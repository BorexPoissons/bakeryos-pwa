import { useState } from "react";
import { PIN } from "../constants.js";

export default function PinModal(props) {
  var onSuccess = props.onSuccess;
  var onCancel  = props.onCancel;
  const [pin,   setPin]   = useState("");
  const [shake, setShake] = useState(false);
  const [err,   setErr]   = useState(false);

  function press(v) {
    if (pin.length >= 4) return;
    var next = pin + v;
    setPin(next);
    setErr(false);
    if (next.length === 4) {
      if (next === PIN) {
        setTimeout(onSuccess, 180);
      } else {
        setShake(true); setErr(true);
        setTimeout(function(){ setPin(""); setShake(false); }, 650);
      }
    }
  }
  function del() { setPin(function(p){ return p.slice(0,-1); }); setErr(false); }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.65)",
                 display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#1E0E05",borderRadius:22,padding:"32px 24px",width:275,textAlign:"center",
                   boxShadow:"0 28px 70px rgba(0,0,0,.55)",animation:"pinIn .28s ease",
                   border:"1px solid rgba(200,149,58,.2)"}}>
        <div style={{fontSize:32,marginBottom:5}}>🔐</div>
        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:24,color:"#FDF8F0",fontWeight:700,marginBottom:2}}>Acces Admin</div>
        <div style={{color:"rgba(253,248,240,.35)",fontSize:12,marginBottom:22}}>Code PIN requis</div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:22,
                     animation: shake ? "shake .6s ease" : "none"}}>
          {[0,1,2,3].map(function(i){
            return (
              <div key={i} style={{width:13,height:13,borderRadius:"50%",transition:"background .13s",
                                   background: i < pin.length ? (err ? "#EF4444" : "#C8953A") : "rgba(255,255,255,.15)"}} />
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:7}}>
          {[1,2,3,4,5,6,7,8,9].map(function(n){
            return (
              <button key={n} className="pb" onClick={function(){ press(String(n)); }}
                style={{padding:"13px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",
                        background:"rgba(255,255,255,.05)",color:"#FDF8F0",fontSize:18,
                        fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{n}</button>
            );
          })}
          <button className="pb" onClick={onCancel}
            style={{padding:"13px",borderRadius:10,border:"1px solid rgba(239,68,68,.2)",
                    background:"rgba(239,68,68,.08)",color:"#FCA5A5",fontSize:12,
                    cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕</button>
          <button className="pb" onClick={function(){ press("0"); }}
            style={{padding:"13px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",
                    background:"rgba(255,255,255,.05)",color:"#FDF8F0",fontSize:18,
                    fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>0</button>
          <button className="pb" onClick={del}
            style={{padding:"13px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",
                    background:"rgba(255,255,255,.05)",color:"rgba(253,248,240,.5)",
                    fontSize:16,cursor:"pointer"}}>⌫</button>
        </div>
        {err && <div style={{color:"#FCA5A5",fontSize:12,marginTop:5}}>Code incorrect</div>}
        <div style={{color:"rgba(253,248,240,.2)",fontSize:10,marginTop:9}}>Demo : 1234</div>
      </div>
    </div>
  );
}

