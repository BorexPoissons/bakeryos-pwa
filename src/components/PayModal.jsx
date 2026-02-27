import { useState, useRef } from "react";
import { computeTVA } from "../utils.js";

export default function PayModal(props) {
  var total    = props.total;
  var cart     = props.cart;
  var onPaid   = props.onPaid;
  var onClose  = props.onClose;
  var tenant   = props.tenant;
  var tvaData  = computeTVA(cart);
  var giftCards  = props.giftCards  || [];
  var useGiftCard= props.useGiftCard|| function(){};

  const [method,   setMethod]   = useState("card");   // "card" | "cash" | "split" | "giftcard"
  const [given,    setGiven]    = useState("");        // montant donné en espèces
  const [step,     setStep]     = useState("choose");  // "choose" | "processing" | "done"
  const [splitCard,setSplitCard]= useState("");
  const [gcCode,   setGcCode]   = useState("");
  const [gcError,  setGcError]  = useState("");
  const [gcFound,  setGcFound]  = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanRef    = useRef(null);

  var givenNum    = parseFloat(given)  || 0;
  var splitNum    = parseFloat(splitCard) || 0;
  var change      = method === "cash"  ? Math.max(0, givenNum - total)
                  : method === "split" ? Math.max(0, givenNum - (total - splitNum))
                  : 0;
  var cashNeeded  = method === "split" ? total - splitNum : total;
  var cashValid   = method === "cash"  ? givenNum >= total
                  : method === "split" ? givenNum >= cashNeeded && splitNum > 0 && splitNum < total
                  : method === "giftcard" ? (gcFound && gcFound.balance >= total)
                  : true;

  function lookupGC(code) {
    var c = code.toUpperCase().trim();
    setGcCode(c);
    setGcError("");
    setGcFound(null);
    if (c.length < 5) return;
    var found = giftCards.find(function(g){ return g.code === c; });
    if (!found) { setGcError("Code introuvable"); return; }
    if (found.status === "epuise") { setGcError("Carte épuisée (solde 0)"); return; }
    if (found.status === "inactive") { setGcError("Carte désactivée"); return; }
    if (found.balance <= 0) { setGcError("Solde insuffisant"); return; }
    setGcFound(found);
    if (found.balance < total) { setGcError("Solde partiel (CHF "+found.balance.toFixed(2)+") — complétez avec un autre moyen"); }
  }

  // QR scan via BarcodeDetector
  function startScan() {
    if (!("BarcodeDetector" in window)) { setGcError("Scanner non supporté sur ce navigateur"); return; }
    setScanning(true);
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(function(stream){
      if(scanRef.current) {
        scanRef.current.srcObject = stream;
        scanRef.current.play();
        var detector = new BarcodeDetector({formats:["qr_code"]});
        var interval = setInterval(function(){
          if(!scanRef.current) { clearInterval(interval); stream.getTracks().forEach(function(t){t.stop();}); return; }
          detector.detect(scanRef.current).then(function(codes){
            if(codes.length>0) {
              clearInterval(interval);
              stream.getTracks().forEach(function(t){t.stop();});
              setScanning(false);
              lookupGC(codes[0].rawValue);
            }
          }).catch(function(){});
        }, 300);
      }
    }).catch(function(){ setGcError("Accès caméra refusé"); setScanning(false); });
  }

  function pay() {
    if (method === "giftcard" && gcFound) {
      var debitAmt = Math.min(gcFound.balance, total);
      useGiftCard(gcFound.code, debitAmt);
    }
    setStep("processing");
    setTimeout(function(){
      setStep("done");
      setTimeout(function(){
        onPaid({
          method:   method,
          cashGiven: givenNum,
          cardAmount: method === "split" ? splitNum : method === "card" ? total : method === "giftcard" ? total : 0,
          change:   change,
          giftCode: method === "giftcard" && gcFound ? gcFound.code : null,
        });
      }, 1200);
    }, method === "card" || method === "split" || method === "giftcard" ? 2000 : 400);
  }

  var QUICK = [0.50,1,2,5,10,20,50,100];

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:460,boxShadow:"0 32px 80px rgba(0,0,0,.35)",overflow:"hidden",animation:"pinIn .25s ease"}}>

        {/* Header */}
        <div style={{background:"#1E0E05",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"#FDF8F0",fontFamily:"'Outfit',sans-serif",fontSize:13,opacity:.6,marginBottom:2}}>Total à encaisser</div>
            <div style={{color:"#C8953A",fontFamily:"'Outfit',sans-serif",fontSize:34,fontWeight:800,letterSpacing:-1}}>
              CHF {total.toFixed(2)}
            </div>
            <div style={{display:"flex",gap:10,marginTop:4}}>
              {tvaData.lines.map(function(l){
                return React.createElement("span",{key:l.rate,style:{fontSize:9,color:"rgba(253,248,240,.45)"}},
                  "TVA "+l.rate+"% : "+l.tva.toFixed(2));
              })}
            </div>
          </div>
          {step === "choose" && (
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:36,height:36,color:"rgba(253,248,240,.5)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          )}
        </div>

        {/* Processing */}
        {step === "processing" && (
          <div style={{padding:"48px 22px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16,animation:"spin 1s linear infinite",display:"inline-block"}}>
              {method === "card" || method === "split" ? "💳" : "🪙"}
            </div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:700,color:"#1E0E05",marginBottom:6}}>
              {method === "card" ? "Attente du terminal…" : method === "split" ? "Traitement paiement mixte…" : "Calcul de la monnaie…"}
            </div>
            <div style={{fontSize:12,color:"#8B7355"}}>
              {method === "card" || method === "split" ? "Présentez la carte au lecteur SumUp" : "Vérification…"}
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div style={{padding:"40px 22px",textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:12,animation:"pop .4s ease"}}>✅</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#065F46",marginBottom:8}}>Paiement accepté !</div>
            {change > 0 && (
              <div style={{background:"#D1FAE5",borderRadius:12,padding:"12px 20px",display:"inline-block",marginTop:4}}>
                <div style={{fontSize:11,color:"#065F46",fontWeight:600,marginBottom:2}}>MONNAIE À RENDRE</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:28,fontWeight:800,color:"#065F46"}}>CHF {change.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}

        {/* Choose method */}
        {step === "choose" && (
          <div style={{padding:"18px 22px"}}>
            {/* Mode selector */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:18}}>
              {[["card","💳","Carte"],["cash","💵","Espèces"],["split","🔀","Mixte"],["giftcard","🎁","Carte cadeau"]].map(function(m){
                var active = method === m[0];
                return (
                  <button key={m[0]} onClick={function(){ setMethod(m[0]); setGiven(""); setSplitCard(""); setGcCode(""); setGcFound(null); setGcError(""); setScanning(false); }}
                    style={{padding:"12px 8px",borderRadius:12,border:"2px solid "+(active?"#C8953A":"#EDE0D0"),
                            background:active?"#FDF0D8":"#fff",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{m[1]}</div>
                    <div style={{fontSize:11,fontWeight:active?700:500,color:active?"#92400E":"#5C4A32",fontFamily:"'Outfit',sans-serif"}}>{m[2]}</div>
                  </button>
                );
              })}
            </div>

            {/* Card */}
            {method === "card" && (
              <div style={{background:"#F7F3EE",borderRadius:12,padding:"16px",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:13,color:"#5C4A32",marginBottom:4}}>Terminal SumUp · En attente</div>
                <div style={{fontSize:11,color:"#8B7355"}}>Présentez la carte, tapez ou insérez</div>
              </div>
            )}

            {/* Cash */}
            {method === "cash" && (
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Montant reçu (CHF)</label>
                <input type="number" value={given} onChange={function(e){ setGiven(e.target.value); }}
                  placeholder={"Montant ≥ "+total.toFixed(2)}
                  style={{width:"100%",padding:"12px",borderRadius:10,border:"2px solid "+(givenNum>=total&&given?"#C8953A":"#EDE0D0"),
                          fontSize:20,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",
                          color:"#1E0E05",background:"#fff",transition:"border-color .15s"}} />
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
                  {QUICK.map(function(v){
                    return (
                      <button key={v} onClick={function(){ setGiven(String(v)); }}
                        style={{padding:"5px 10px",borderRadius:8,border:"1px solid #EDE0D0",background:given==String(v)?"#FDF0D8":"#fff",
                                color:given==String(v)?"#92400E":"#5C4A32",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}>
                        {v.toFixed(2)}
                      </button>
                    );
                  })}
                </div>
                {given && givenNum >= total && (
                  <div style={{background:"#D1FAE5",borderRadius:10,padding:"10px 14px",marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#065F46",fontWeight:600}}>Monnaie à rendre</span>
                    <span style={{fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:800,color:"#065F46"}}>CHF {change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Split */}
            {method === "split" && (
              <div style={{marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Carte (CHF)</label>
                    <input type="number" value={splitCard} onChange={function(e){ setSplitCard(e.target.value); }}
                      placeholder="0.00" min="0" max={total}
                      style={{width:"100%",padding:"10px",borderRadius:10,border:"2px solid #EDE0D0",fontSize:16,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}} />
                  </div>
                  <div>
                    <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Espèces (CHF)</label>
                    <input type="number" value={given} onChange={function(e){ setGiven(e.target.value); }}
                      placeholder={splitNum > 0 ? "≥ "+(total-splitNum).toFixed(2) : "0.00"}
                      style={{width:"100%",padding:"10px",borderRadius:10,border:"2px solid #EDE0D0",fontSize:16,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}} />
                  </div>
                </div>
                {splitNum > 0 && (
                  <div style={{background:"#F7F3EE",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#5C4A32",display:"flex",justifyContent:"space-between"}}>
                    <span>Reste en espèces</span>
                    <span style={{fontWeight:700}}>CHF {Math.max(0,total-splitNum).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Gift Card */}
            {method === "giftcard" && (
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Code carte cadeau</label>
                <div style={{display:"flex",gap:8}}>
                  <input type="text" value={gcCode} onChange={function(e){ lookupGC(e.target.value); }}
                    placeholder="GC-XXXX-XXXX"
                    style={{flex:1,padding:"12px",borderRadius:10,border:"2px solid "+(gcFound?"#10B981":gcError&&gcCode.length>=5?"#EF4444":"#EDE0D0"),
                            fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Courier New',monospace",
                            color:"#1E0E05",background:"#F7F3EE",textTransform:"uppercase",letterSpacing:2,transition:"border-color .15s"}} />
                  <button onClick={startScan}
                    style={{padding:"10px 14px",borderRadius:10,border:"1px solid #EDE0D0",background:scanning?"#1E0E05":"#F7F3EE",
                            color:scanning?"#FDF8F0":"#5C4A32",fontSize:18,cursor:"pointer",transition:"all .15s",flexShrink:0}}
                    title="Scanner QR code">
                    📷
                  </button>
                </div>
                {scanning && (
                  <div style={{marginTop:10,borderRadius:12,overflow:"hidden",border:"2px solid #C8953A",position:"relative"}}>
                    <video ref={scanRef} style={{width:"100%",display:"block",maxHeight:200}} muted playsInline />
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{width:120,height:120,border:"3px solid #C8953A",borderRadius:14,animation:"glow 1s ease infinite alternate"}} />
                    </div>
                    <button onClick={function(){setScanning(false);if(scanRef.current&&scanRef.current.srcObject)scanRef.current.srcObject.getTracks().forEach(function(t){t.stop();});}}
                      style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.6)",border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",fontSize:14,cursor:"pointer"}}>✕</button>
                  </div>
                )}
                {gcError && <div style={{marginTop:8,padding:"7px 12px",borderRadius:8,background:"#FEF3C7",border:"1px solid #FCD34D",fontSize:11,color:"#92400E",fontWeight:600}}>{gcError}</div>}
                {gcFound && (
                  <div style={{marginTop:10,background:"#D1FAE5",border:"1.5px solid #10B981",borderRadius:12,padding:"14px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#065F46"}}>✅ Carte valide</span>
                      <span style={{fontFamily:"'Courier New',monospace",fontSize:12,fontWeight:700,color:"#065F46",letterSpacing:1}}>{gcFound.code}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <span style={{fontSize:10,color:"#065F46"}}>Solde disponible</span>
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#065F46"}}>CHF {gcFound.balance.toFixed(2)}</span>
                    </div>
                    {gcFound.balance < total && (
                      <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,background:"#FEF3C7",fontSize:10,color:"#92400E",fontWeight:600}}>
                        ⚠️ Solde insuffisant — complétez avec un autre moyen de paiement
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={pay} disabled={!cashValid}
              style={{width:"100%",padding:"15px",borderRadius:12,border:"none",
                      background:cashValid?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                      color:cashValid?"#1E0E05":"#fff",fontSize:16,fontWeight:800,
                      cursor:cashValid?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",
                      transition:"all .18s",letterSpacing:.3}}>
              {method==="card" ? "💳 Lancer le paiement carte" : method==="cash" ? "💵 Encaisser" : method==="giftcard" ? "🎁 Payer avec la carte cadeau" : "🔀 Confirmer paiement mixte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
