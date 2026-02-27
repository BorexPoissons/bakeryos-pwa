import { useState, useRef, useEffect } from "react";
import { hm } from "../utils.js";

export default function DeliveryCard(props) {
  var order   = props.order;
  var updOrder= props.updOrder;

  const [open,   setOpen]   = useState(false);
  const [signed, setSigned] = useState(false);
  const [photo,  setPhoto]  = useState(false);
  const canvasRef = useRef(null);
  const drawing   = useRef(false);

  function getXY(e) {
    var c = canvasRef.current;
    if (!c) return {x:0,y:0};
    var r = c.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return {x: src.clientX - r.left, y: src.clientY - r.top};
  }
  function startDraw(e) {
    drawing.current = true;
    var c = canvasRef.current; if (!c) return;
    var xy = getXY(e);
    var ctx = c.getContext("2d");
    ctx.beginPath(); ctx.moveTo(xy.x, xy.y);
  }
  function drawOn(e) {
    if (!drawing.current) return;
    var c = canvasRef.current; if (!c) return;
    var xy = getXY(e);
    var ctx = c.getContext("2d");
    ctx.lineTo(xy.x, xy.y);
    ctx.strokeStyle = "#1E0E05"; ctx.lineWidth = 2.5; ctx.stroke();
    setSigned(true);
  }
  function stopDraw() { drawing.current = false; }
  function clearSig() {
    var c = canvasRef.current; if (!c) return;
    c.getContext("2d").clearRect(0,0,c.width,c.height);
    setSigned(false);
  }
  function validate() {
    if (!signed) return;
    updOrder(order.id, {status:"livre", dMethod:"livreur", signedAt:hm(), hasPhoto:photo});
  }

  var o = order;
  return (
    <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 13px rgba(0,0,0,.07)"}}>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontSize:13,fontWeight:700,color:"#1E0E05"}}>{o.id}</span>
              {o.priority==="urgent" && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:16}}>URGENT</span>}
            </div>
            <div style={{fontSize:12,color:"#5C4A32",fontWeight:600,marginBottom:1}}>{o.client}</div>
            <div style={{fontSize:11,color:"#8B7355"}}>📍 {o.dest||o.store}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:16,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
            <div style={{fontSize:10,color:"#8B7355"}}>{o.time}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
          {o.items.map(function(it,j){ return <span key={j} style={{background:"#F7F3EE",color:"#5C4A32",fontSize:10,padding:"3px 8px",borderRadius:16}}>{it.qty}x {it.name}</span>; })}
        </div>
        {!open ? (
          <button className="bg" onClick={function(){ setOpen(true); }}
            style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#7C3AED,#5B21B6)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            🚐 Confirmer la livraison
          </button>
        ) : (
          <div style={{background:"#F7F3EE",borderRadius:10,padding:12}}>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#5C4A32",fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.9}}>✍️ Signature</div>
              <canvas ref={canvasRef} width={500} height={100}
                onMouseDown={startDraw} onMouseMove={drawOn} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={drawOn} onTouchEnd={stopDraw}
                style={{width:"100%",height:85,background:"#fff",border:"2px dashed #D5C4B0",borderRadius:7,cursor:"crosshair",display:"block",touchAction:"none"}} />
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <span style={{fontSize:10,color:signed?"#065F46":"#8B7355",fontWeight:signed?600:400}}>{signed?"✅ OK":"Signez ci-dessus"}</span>
                <button onClick={clearSig} style={{fontSize:10,color:"#EF4444",background:"none",border:"none",cursor:"pointer"}}>Effacer</button>
              </div>
            </div>
            <div onClick={function(){ setPhoto(function(v){ return !v; }); }}
              style={{height:58,borderRadius:7,border:"2px dashed #D5C4B0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                      background:photo?"#D1FAE5":"#fff",color:photo?"#065F46":"#8B7355",fontSize:12,fontWeight:500,transition:"all .18s",marginBottom:10}}>
              {photo ? "✅ Photo prise !" : "📱 Prendre une photo"}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={function(){ setOpen(false); setSigned(false); setPhoto(false); clearSig(); }}
                style={{flex:1,padding:"8px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
              <button disabled={!signed} onClick={validate}
                style={{flex:2,padding:"8px",borderRadius:7,border:"none",
                        background:signed?"linear-gradient(135deg,#065F46,#047857)":"#D5C4B0",
                        color:"#fff",fontSize:12,fontWeight:600,cursor:signed?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",transition:"all .18s"}}>
                ✅ Valider la livraison
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

