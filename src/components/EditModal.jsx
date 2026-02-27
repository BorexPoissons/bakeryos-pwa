import { useState } from "react";
import { PRODUCTS, SM } from "../constants.js";

export default function EditModal(props) {
  var order     = props.order;
  var onSave    = props.onSave;
  var onClose   = props.onClose;
  var onModReq  = props.onModReq;
  var sendMsg   = props.sendMsg;

  var meta   = SM[order.status] || SM.attente;
  var locked = meta.lock;
  var warn   = meta.warn;

  const [items,       setItems]       = useState(order.items.map(function(i){ return Object.assign({},i); }));
  const [note,        setNote]        = useState(order.note || "");
  const [showAdd,     setShowAdd]     = useState(false);
  const [modText,     setModText]     = useState("");
  const [showModForm, setShowModForm] = useState(false);

  function setQty(idx, q) {
    if (q <= 0) setItems(function(prev){ return prev.filter(function(_,i){ return i !== idx; }); });
    else setItems(function(prev){ return prev.map(function(it,i){ return i===idx ? Object.assign({},it,{qty:q}) : it; }); });
  }
  function addProd(p) {
    var ex = items.find(function(i){ return i.id===p.id; });
    if (ex) setItems(function(prev){ return prev.map(function(i){ return i.id===p.id ? Object.assign({},i,{qty:i.qty+1}) : i; }); });
    else    setItems(function(prev){ return prev.concat([Object.assign({},p,{qty:1})]); });
    setShowAdd(false);
  }
  var total = items.reduce(function(s,i){ return s+i.price*i.qty; }, 0);

  function handleModSend() {
    if (!modText.trim()) return;
    sendMsg("MODIF sur " + order.id + " (" + order.client + "): " + modText, order.id, true);
    onModReq(order.id);
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.5)",
                 display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)"}}>
      <div style={{background:"#fff",borderRadius:17,width:"min(490px,94vw)",maxHeight:"88vh",
                   overflow:"auto",boxShadow:"0 26px 65px rgba(0,0,0,.26)",animation:"pinIn .25s ease"}}>
        <div style={{padding:"17px 19px 13px",borderBottom:"1px solid #F0E8DC",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:21,color:"#1E0E05",fontWeight:700,marginBottom:1}}>
              {locked ? "🔒" : "✏️"} {order.id}
            </div>
            <div style={{fontSize:11,color:"#8B7355"}}>{order.client} · {order.store}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{background:meta.bg,color:meta.tx,fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:18}}>{meta.label}</span>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#8B7355",cursor:"pointer",fontSize:18}}>✕</button>
          </div>
        </div>
        <div style={{padding:"15px 19px"}}>
          {locked && (
            <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:"10px 12px",marginBottom:13}}>
              <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:2}}>🔒 Commande verrouillee</div>
              <div style={{fontSize:11,color:"#92400E"}}>
                {order.status==="prete" ? "La production a prepare cette commande. Envoyez une demande via le chat."
                                        : "En livraison ou deja livree."}
              </div>
            </div>
          )}
          {warn && !locked && (
            <div style={{background:"#DBEAFE",border:"1px solid #93C5FD",borderRadius:10,padding:"8px 12px",marginBottom:13,fontSize:11,color:"#1E40AF"}}>
              ⚠️ En production — vos modifications sont visibles immediatement par la production.
            </div>
          )}
          <div style={{marginBottom:13}}>
            <div style={{fontSize:10,fontWeight:600,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:6}}>Produits</div>
            {items.map(function(it, idx){
              var p = PRODUCTS.find(function(p){ return p.id===it.id; });
              return (
                <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #F0E8DC"}}>
                  <span style={{fontSize:14}}>{p ? p.emoji : "🍞"}</span>
                  <span style={{flex:1,fontSize:12,color:"#1E0E05"}}>{it.name}</span>
                  <span style={{fontSize:11,color:"#C8953A",minWidth:55,textAlign:"right"}}>CHF {(it.price*it.qty).toFixed(2)}</span>
                  {locked ? (
                    <span style={{fontSize:12,fontWeight:600,color:"#1E0E05",minWidth:20,textAlign:"center"}}>x{it.qty}</span>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button onClick={function(){ setQty(idx, it.qty-1); }}
                        style={{width:21,height:21,borderRadius:"50%",border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontSize:12,fontWeight:600,color:"#1E0E05",minWidth:18,textAlign:"center"}}>{it.qty}</span>
                      <button onClick={function(){ setQty(idx, it.qty+1); }}
                        style={{width:21,height:21,borderRadius:"50%",border:"1px solid rgba(200,149,58,.4)",background:"#FDF0D8",color:"#C8953A",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!locked && (
            <div style={{marginBottom:13}}>
              {showAdd ? (
                <div style={{background:"#F7F3EE",borderRadius:10,padding:10}}>
                  <div style={{fontSize:10,color:"#8B7355",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:.9}}>Ajouter un produit</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(95px,1fr))",gap:6,maxHeight:160,overflowY:"auto"}}>
                    {PRODUCTS.map(function(p){
                      return (
                        <div key={p.id} className="pt" onClick={function(){ addProd(p); }}
                          style={{background:"#fff",borderRadius:8,padding:"6px",cursor:"pointer",textAlign:"center",border:"1px solid #EDE0D0"}}>
                          <div style={{fontSize:17,marginBottom:2}}>{p.emoji}</div>
                          <div style={{fontSize:9,color:"#1E0E05",fontWeight:500,lineHeight:1.2,marginBottom:1}}>{p.name}</div>
                          <div style={{fontSize:10,color:"#C8953A",fontWeight:600}}>CHF {p.price.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={function(){ setShowAdd(false); }}
                    style={{marginTop:6,padding:"4px 10px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Fermer</button>
                </div>
              ) : (
                <button onClick={function(){ setShowAdd(true); }}
                  style={{padding:"7px 13px",borderRadius:9,border:"1.5px dashed #C8953A",background:"transparent",
                          color:"#C8953A",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                          width:"100%",transition:"all .16s"}}
                  onMouseOver={function(e){ e.currentTarget.style.background="#FDF0D8"; }}
                  onMouseOut={function(e){ e.currentTarget.style.background="transparent"; }}>+ Ajouter un produit</button>
              )}
            </div>
          )}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:4}}>Note</div>
            {locked ? (
              <div style={{padding:"7px 10px",background:"#F7F3EE",borderRadius:7,fontSize:12,color:note?"#1E0E05":"#8B7355",fontStyle:note?"normal":"italic"}}>{note||"Aucune note"}</div>
            ) : (
              <input value={note} onChange={function(e){ setNote(e.target.value); }}
                placeholder="Note pour la production…"
                style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
            )}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid #F0E8DC",marginBottom:13}}>
            <span style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>Total</span>
            <span style={{fontSize:18,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {total.toFixed(2)}</span>
          </div>
          {order.status === "prete" && (
            <div style={{marginBottom:7}}>
              {!showModForm ? (
                <button onClick={function(){ setShowModForm(true); }}
                  style={{width:"100%",padding:"9px",borderRadius:9,border:"1.5px solid #EF4444",
                          background:"#FEF2F2",color:"#DC2626",fontSize:12,fontWeight:600,
                          cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginBottom:7}}>
                  🔔 Demander une modification a la production
                </button>
              ) : (
                <div style={{background:"#FEF2F2",borderRadius:10,padding:10,marginBottom:7}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#DC2626",marginBottom:4}}>Message a la production :</div>
                  <textarea value={modText} onChange={function(e){ setModText(e.target.value); }}
                    placeholder="Ex: Retirer les quiches, ajouter 2 croissants…"
                    style={{width:"100%",height:62,padding:"6px 8px",borderRadius:7,border:"1px solid #FCA5A5",
                            background:"#fff",fontSize:11,resize:"none",outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <button onClick={function(){ setShowModForm(false); }}
                      style={{flex:1,padding:"6px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
                    <button onClick={handleModSend} disabled={!modText.trim()}
                      style={{flex:2,padding:"6px",borderRadius:7,border:"none",
                              background:modText.trim()?"#DC2626":"#D5C4B0",color:"#fff",fontSize:11,fontWeight:600,
                              cursor:modText.trim()?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
                      🔔 Envoyer la demande
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!locked && items.length > 0 ? (
            <div style={{display:"flex",gap:6}}>
              <button onClick={onClose}
                style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
              <button onClick={function(){ onSave(Object.assign({},order,{items:items,note:note,total:total})); }}
                style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#FDF8F0",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                💾 Sauvegarder
              </button>
            </div>
          ) : (
            order.status !== "prete" && (
              <button onClick={onClose}
                style={{width:"100%",padding:"9px",borderRadius:9,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Fermer</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

