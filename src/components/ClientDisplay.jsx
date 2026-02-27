import { useState, useEffect } from "react";

export default function ClientDisplay(props) {
  var cart   = props.cart;
  var total  = props.total;
  var tenant = props.tenant;
  var onClose= props.onClose;
  var paid   = props.paid;

  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:"#1E0E05",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:36,height:36,color:"rgba(253,248,240,.4)",fontSize:18,cursor:"pointer"}}>✕</button>
      <div style={{fontSize:48,marginBottom:8}}>🥐</div>
      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:26,color:"#C8953A",fontWeight:800,marginBottom:32,letterSpacing:-1}}>{tenant}</div>

      {paid ? (
        <div style={{textAlign:"center",animation:"fadeUp .4s ease"}}>
          <div style={{fontSize:72,marginBottom:16}}>✅</div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:28,color:"#D1FAE5",fontWeight:800}}>Merci !</div>
          <div style={{color:"rgba(253,248,240,.5)",fontSize:14,marginTop:8}}>Bonne dégustation 🙏</div>
        </div>
      ) : cart.length === 0 ? (
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12,opacity:.3}}>🧺</div>
          <div style={{color:"rgba(253,248,240,.3)",fontSize:16}}>En attente de commande…</div>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:480}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {cart.map(function(i,idx){
              return (
                <div key={idx} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                                       background:"rgba(255,255,255,.06)",borderRadius:14,padding:"12px 18px",
                                       animation:"slideIn .2s "+(idx*.06)+"s both"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:28}}>{i.emoji}</span>
                    <div>
                      <div style={{fontFamily:"'Outfit',sans-serif",color:"#FDF8F0",fontSize:15,fontWeight:600}}>{i.name}</div>
                      <div style={{color:"rgba(253,248,240,.4)",fontSize:12}}>× {i.qty}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"'Outfit',sans-serif",color:"#C8953A",fontSize:18,fontWeight:700}}>CHF {(i.price*i.qty).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <div style={{background:"rgba(200,149,58,.12)",borderRadius:16,padding:"20px 24px",border:"1px solid rgba(200,149,58,.25)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:"rgba(253,248,240,.6)",fontSize:14}}>TOTAL</span>
            <span style={{fontFamily:"'Outfit',sans-serif",color:"#C8953A",fontSize:38,fontWeight:800}}>CHF {total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

