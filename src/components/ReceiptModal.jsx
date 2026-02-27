import { useState } from "react";
import { hm, computeTVA } from "../utils.js";

export default function ReceiptModal(props) {
  var sale   = props.sale;
  var tenant = props.tenant;
  var onClose= props.onClose;
  if (!sale) return null;
  var methodLabel = sale.payInfo.method === "card" ? "Carte bancaire" : sale.payInfo.method === "cash" ? "Espèces" : sale.payInfo.method === "giftcard" ? "Carte cadeau" : "Paiement mixte";
  return (
    <div style={{position:"fixed",inset:0,zIndex:950,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
         onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}}
        style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:320,boxShadow:"0 24px 60px rgba(0,0,0,.3)",overflow:"hidden",animation:"fadeUp .25s ease"}}>
        <div style={{background:"#1E0E05",padding:"18px 20px",textAlign:"center"}}>
          <div style={{fontSize:22,marginBottom:4}}>🥐</div>
          <div style={{color:"#C8953A",fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700}}>{tenant}</div>
          <div style={{color:"rgba(253,248,240,.4)",fontSize:10,marginTop:2}}>{sale.time} · {sale.store}</div>
        </div>
        <div style={{padding:"14px 20px",borderBottom:"1px dashed #EDE0D0"}}>
          {sale.items.map(function(i,idx){
            return (
              <div key={idx} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}>
                <span style={{color:"#5C4A32"}}>{i.qty}× {i.name}</span>
                <span style={{fontWeight:600,color:"#1E0E05"}}>CHF {(i.price*i.qty).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div style={{padding:"12px 20px",borderBottom:"1px dashed #EDE0D0"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:13,color:"#8B7355"}}>Total TTC</span>
            <span style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:"#C8953A"}}>CHF {sale.total.toFixed(2)}</span>
          </div>
          {(function(){
            var tv = sale.tvaInfo || computeTVA(sale.items);
            return React.createElement("div",{style:{marginTop:4}},
              tv.lines.map(function(l){
                return React.createElement("div",{key:l.rate,style:{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8B7355",marginBottom:1}},
                  React.createElement("span",null,"dont TVA "+l.rate+"%"),
                  React.createElement("span",null,"CHF "+l.tva.toFixed(2))
                );
              }),
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8B7355",marginTop:2,borderTop:"1px dotted #EDE0D0",paddingTop:3}},
                React.createElement("span",null,"Total HT"),
                React.createElement("span",null,"CHF "+tv.totalHT.toFixed(2))
              )
            );
          })()}
          <div style={{fontSize:11,color:"#8B7355",marginTop:6}}>{methodLabel}
            {sale.payInfo.change > 0 && <span style={{color:"#065F46",fontWeight:600}}> · Rendu CHF {sale.payInfo.change.toFixed(2)}</span>}
          </div>
        </div>
        <div style={{padding:"14px 20px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"#B8A898",marginBottom:8}}>Merci de votre visite ! 🙏</div>
          <button onClick={onClose}
            style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:"#1E0E05",color:"#FDF8F0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

