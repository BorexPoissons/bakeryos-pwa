import { useState } from "react";

/* ── CHF denominations ── */
var CHF_BILLS  = [1000, 200, 100, 50, 20, 10];
var CHF_COINS  = [5, 2, 1, 0.50, 0.20, 0.10, 0.05];
var CHF_ALL    = CHF_BILLS.concat(CHF_COINS);

export default function CaisseModal(props) {
  var mode        = props.mode;        // "open" | "close"
  var onConfirm   = props.onConfirm;   // (data) => void
  var onClose     = props.onClose;
  var expectedTotal = props.expectedTotal || 0; // for close mode
  var storeName   = props.storeName || "";

  const [counts, setCounts] = useState(function(){
    var c = {};
    CHF_ALL.forEach(function(d){ c[d] = 0; });
    return c;
  });

  function setCount(denom, val) {
    setCounts(function(prev){
      var n = Object.assign({}, prev);
      n[denom] = Math.max(0, parseInt(val) || 0);
      return n;
    });
  }

  var total = CHF_ALL.reduce(function(s, d){ return s + d * (counts[d] || 0); }, 0);
  var diff = mode === "close" ? total - expectedTotal : 0;

  function confirm() {
    onConfirm({
      counts:   Object.assign({}, counts),
      total:    Math.round(total * 100) / 100,
      diff:     Math.round(diff * 100) / 100,
      time:     new Date().toLocaleTimeString("fr-CH", {hour:"2-digit",minute:"2-digit"}),
      date:     new Date().toLocaleDateString("fr-CH"),
    });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",
                   boxShadow:"0 32px 80px rgba(0,0,0,.35)",animation:"pinIn .25s ease"}}>
        {/* Header */}
        <div style={{background:"#1E0E05",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",
                     position:"sticky",top:0,zIndex:2}}>
          <div>
            <div style={{color:"rgba(253,248,240,.6)",fontSize:11,marginBottom:2}}>
              {mode === "open" ? "Ouverture de caisse" : "Fermeture de caisse"}
            </div>
            <div style={{color:"#C8953A",fontSize:28,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>
              CHF {total.toFixed(2)}
            </div>
            {mode === "close" && (
              <div style={{fontSize:10,marginTop:2,color: diff === 0 ? "#10B981" : diff > 0 ? "#F59E0B" : "#EF4444",fontWeight:600}}>
                {diff === 0 ? "✓ Caisse juste" : diff > 0 ? "+" + diff.toFixed(2) + " CHF excédent" : diff.toFixed(2) + " CHF manquant"}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",
                  width:36,height:36,color:"rgba(253,248,240,.5)",fontSize:18,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {mode === "close" && expectedTotal > 0 && (
          <div style={{padding:"8px 22px",background:"#FEF3C7",fontSize:11,color:"#92400E",fontWeight:600}}>
            💰 Attendu : CHF {expectedTotal.toFixed(2)} (espèces encaissées)
          </div>
        )}

        {/* Billets */}
        <div style={{padding:"16px 22px 8px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1E0E05",marginBottom:10}}>💵 Billets</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {CHF_BILLS.map(function(d){
              return (
                <div key={d} style={{border:"1px solid #EDE0D0",borderRadius:10,padding:"8px 10px",
                                     background: counts[d] > 0 ? "rgba(200,149,58,.08)" : "#fff"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1E0E05",marginBottom:4}}>CHF {d}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={function(){ setCount(d, (counts[d]||0) - 1); }}
                      style={{width:28,height:28,borderRadius:7,border:"1px solid #EDE0D0",background:"#fff",
                              fontSize:14,cursor:"pointer",color:"#1E0E05"}}>−</button>
                    <input value={counts[d] || ""} onChange={function(e){ setCount(d, e.target.value); }}
                      style={{width:40,textAlign:"center",border:"1px solid #EDE0D0",borderRadius:7,padding:"4px 2px",
                              fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",outline:"none"}} />
                    <button onClick={function(){ setCount(d, (counts[d]||0) + 1); }}
                      style={{width:28,height:28,borderRadius:7,border:"none",background:"#1E0E05",
                              fontSize:14,cursor:"pointer",color:"#C8953A"}}>+</button>
                  </div>
                  <div style={{fontSize:9,color:"#8B7355",marginTop:3,textAlign:"right"}}>
                    = CHF {(d * (counts[d]||0)).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pièces */}
        <div style={{padding:"8px 22px 16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1E0E05",marginBottom:10}}>🪙 Pièces</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {CHF_COINS.map(function(d){
              var label = d >= 1 ? ("CHF " + d) : (Math.round(d*100) + " ct");
              return (
                <div key={d} style={{border:"1px solid #EDE0D0",borderRadius:10,padding:"8px 8px",
                                     background: counts[d] > 0 ? "rgba(200,149,58,.08)" : "#fff"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1E0E05",marginBottom:4}}>{label}</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <button onClick={function(){ setCount(d, (counts[d]||0) - 1); }}
                      style={{width:24,height:24,borderRadius:6,border:"1px solid #EDE0D0",background:"#fff",
                              fontSize:12,cursor:"pointer",color:"#1E0E05"}}>−</button>
                    <input value={counts[d] || ""} onChange={function(e){ setCount(d, e.target.value); }}
                      style={{width:32,textAlign:"center",border:"1px solid #EDE0D0",borderRadius:6,padding:"3px 1px",
                              fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",outline:"none"}} />
                    <button onClick={function(){ setCount(d, (counts[d]||0) + 1); }}
                      style={{width:24,height:24,borderRadius:6,border:"none",background:"#1E0E05",
                              fontSize:12,cursor:"pointer",color:"#C8953A"}}>+</button>
                  </div>
                  <div style={{fontSize:8,color:"#8B7355",marginTop:2,textAlign:"right"}}>
                    = {(d * (counts[d]||0)).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{padding:"12px 22px 20px",borderTop:"1px solid #EDE0D0",display:"flex",gap:10,justifyContent:"flex-end",
                     position:"sticky",bottom:0,background:"#fff"}}>
          <button onClick={onClose}
            style={{padding:"10px 20px",borderRadius:10,border:"1px solid #EDE0D0",background:"#fff",
                    fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#5C4A32"}}>
            Annuler
          </button>
          <button onClick={confirm}
            style={{padding:"10px 24px",borderRadius:10,border:"none",
                    background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",
                    fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            {mode === "open" ? "✓ Ouvrir la caisse" : "✓ Fermer la caisse"}
          </button>
        </div>
      </div>
    </div>
  );
}

export { CHF_ALL, CHF_BILLS, CHF_COINS };
