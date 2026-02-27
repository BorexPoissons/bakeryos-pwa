import { useState } from "react";
import { hm, computeTVA } from "../utils.js";

export default function RefundModal(props) {
  var sale      = props.sale;       // vente originale
  var onRefund  = props.onRefund;   // (refundData) => void
  var onClose   = props.onClose;
  var printer   = props.printer || {};

  const [mode, setMode]       = useState("full"); // "full" | "partial"
  const [selected, setSelected] = useState({}); // { itemIndex: qtyToRefund }
  const [reason, setReason]   = useState("");
  const [step, setStep]       = useState("select"); // "select" | "confirm" | "done"

  if (!sale) return null;

  function toggleItem(idx) {
    setSelected(function(prev){
      var n = Object.assign({}, prev);
      if (n[idx] !== undefined) { delete n[idx]; }
      else { n[idx] = sale.items[idx].qty; }
      return n;
    });
  }

  function setItemQty(idx, qty) {
    setSelected(function(prev){
      var n = Object.assign({}, prev);
      n[idx] = Math.min(Math.max(1, qty), sale.items[idx].qty);
      return n;
    });
  }

  var refundItems = mode === "full"
    ? sale.items.map(function(i){ return Object.assign({}, i); })
    : Object.keys(selected).map(function(idx){
        var i = sale.items[idx];
        return Object.assign({}, i, { qty: selected[idx] || i.qty });
      });

  var refundTotal = refundItems.reduce(function(s, i){ return s + i.price * i.qty; }, 0);
  refundTotal = Math.round(refundTotal * 100) / 100;

  function doRefund() {
    var refundData = {
      id:          "RMB-" + Date.now(),
      originalId:  sale.id,
      date:        new Date().toLocaleDateString("fr-CH"),
      time:        hm(),
      items:       refundItems,
      total:       refundTotal,
      tvaInfo:     computeTVA(refundItems),
      reason:      reason,
      mode:        mode,
      seller:      sale.seller,
      store:       sale.store,
      client:      sale.client,
    };
    onRefund(refundData);
    setStep("done");
    // Print refund receipt
    if (printer && printer.printReceipt) {
      var receipt = Object.assign({}, refundData, {
        tenant:       "REMBOURSEMENT",
        ticketNumber: refundData.id,
        isRefund:     true,
      });
      printer.printReceipt(receipt).catch(function(){});
    }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:480,maxHeight:"85vh",overflow:"auto",
                   boxShadow:"0 32px 80px rgba(0,0,0,.35)",animation:"pinIn .25s ease"}}>
        {/* Header */}
        <div style={{background:"#7F1D1D",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"rgba(254,226,226,.6)",fontSize:11}}>Remboursement</div>
            <div style={{color:"#FCA5A5",fontSize:24,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>
              − CHF {refundTotal.toFixed(2)}
            </div>
            <div style={{color:"rgba(254,226,226,.5)",fontSize:10,marginTop:2}}>
              Ticket original : {sale.id} — {sale.client}
            </div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:"50%",
                  width:36,height:36,color:"rgba(254,226,226,.5)",fontSize:18,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {step === "done" ? (
          <div style={{padding:"40px 22px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontSize:16,fontWeight:700,color:"#065F46",marginBottom:6}}>Remboursement effectué</div>
            <div style={{fontSize:12,color:"#5C4A32"}}>CHF {refundTotal.toFixed(2)} — Réf: {refundItems.length > 0 ? "RMB-..." : ""}</div>
            <button onClick={onClose}
              style={{marginTop:20,padding:"10px 28px",borderRadius:10,border:"none",
                      background:"#1E0E05",color:"#C8953A",fontSize:13,fontWeight:700,cursor:"pointer",
                      fontFamily:"'Outfit',sans-serif"}}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div style={{padding:"14px 22px",display:"flex",gap:8,borderBottom:"1px solid #EDE0D0"}}>
              {[["full","Remboursement total"],["partial","Remboursement partiel"]].map(function(m){
                return (
                  <button key={m[0]} onClick={function(){ setMode(m[0]); setSelected({}); }}
                    style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid "+(mode===m[0]?"#C8953A":"#EDE0D0"),
                            background:mode===m[0]?"rgba(200,149,58,.1)":"#fff",color:mode===m[0]?"#C8953A":"#5C4A32",
                            fontSize:12,fontWeight:mode===m[0]?700:500,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    {m[1]}
                  </button>
                );
              })}
            </div>

            {/* Items */}
            <div style={{padding:"12px 22px"}}>
              {sale.items.map(function(item, idx){
                var isSelected = mode === "full" || selected[idx] !== undefined;
                return (
                  <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",
                                         borderBottom:"1px solid #f5f0eb",opacity:isSelected?1:.4}}>
                    {mode === "partial" && (
                      <input type="checkbox" checked={selected[idx] !== undefined}
                        onChange={function(){ toggleItem(idx); }}
                        style={{width:18,height:18,accentColor:"#C8953A"}} />
                    )}
                    <span style={{fontSize:16}}>{item.emoji || "📦"}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>{item.name}</div>
                      <div style={{fontSize:10,color:"#8B7355"}}>CHF {item.price.toFixed(2)} × {item.qty}</div>
                    </div>
                    {mode === "partial" && selected[idx] !== undefined && item.qty > 1 && (
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <button onClick={function(){ setItemQty(idx, (selected[idx]||1) - 1); }}
                          style={{width:22,height:22,borderRadius:6,border:"1px solid #EDE0D0",background:"#fff",fontSize:11,cursor:"pointer"}}>−</button>
                        <span style={{fontSize:11,fontWeight:700,minWidth:16,textAlign:"center"}}>{selected[idx]}</span>
                        <button onClick={function(){ setItemQty(idx, (selected[idx]||1) + 1); }}
                          style={{width:22,height:22,borderRadius:6,border:"none",background:"#1E0E05",color:"#C8953A",fontSize:11,cursor:"pointer"}}>+</button>
                      </div>
                    )}
                    <div style={{fontSize:12,fontWeight:700,color:"#1E0E05",minWidth:60,textAlign:"right"}}>
                      CHF {(item.price * (isSelected ? (mode==="partial" ? (selected[idx]||item.qty) : item.qty) : 0)).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Raison */}
            <div style={{padding:"0 22px 12px"}}>
              <input value={reason} onChange={function(e){ setReason(e.target.value); }}
                placeholder="Raison du remboursement (optionnel)"
                style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #EDE0D0",
                        fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}} />
            </div>

            {/* Actions */}
            <div style={{padding:"12px 22px 20px",borderTop:"1px solid #EDE0D0",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={onClose}
                style={{padding:"10px 20px",borderRadius:10,border:"1px solid #EDE0D0",background:"#fff",
                        fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#5C4A32"}}>
                Annuler
              </button>
              <button onClick={doRefund}
                disabled={mode === "partial" && Object.keys(selected).length === 0}
                style={{padding:"10px 24px",borderRadius:10,border:"none",
                        background: (mode === "partial" && Object.keys(selected).length === 0) ? "#ccc" : "#DC2626",
                        color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Rembourser CHF {refundTotal.toFixed(2)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
