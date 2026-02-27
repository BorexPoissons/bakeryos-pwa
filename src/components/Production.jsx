import { useState } from "react";
import { STORES, SM } from "../constants.js";
import EditModal from "./EditModal.jsx";

export default function Production(props) {
  var orders  = props.orders;
  var updOrder= props.updOrder;
  var chat    = props.chat;
  var sendMsg = props.sendMsg;
  var recipes = props.recipes || [];
  var catalogue = props.catalogue || [];
  var printer = props.printer || {};

  const [selId,   setSelId]   = useState(null);
  const [dest,    setDest]    = useState("");
  const [method,  setMethod]  = useState("magasin");
  const [filter,  setFilter]  = useState("all");
  const [editOrd, setEditOrd] = useState(null);
  const [prodRecipe, setProdRecipe] = useState(null); // recipe to view

  var modReqs = chat.filter(function(m){ return m.mod; }).slice(-4);
  var queue = orders
    .filter(function(o){ return o.status==="production" || o.status==="attente"; })
    .filter(function(o){ return filter==="all" || o.priority===filter; })
    .slice().sort(function(a,b){ return (b.priority==="urgent"?1:0)-(a.priority==="urgent"?1:0); });

  var stats = [
    {label:"Attente",   v:orders.filter(function(o){ return o.status==="attente"; }).length,    c:"#F59E0B",bg:"#FEF3C7"},
    {label:"Production",v:orders.filter(function(o){ return o.status==="production"; }).length, c:"#3B82F6",bg:"#DBEAFE"},
    {label:"Pretes",    v:orders.filter(function(o){ return o.status==="prete"; }).length,      c:"#EF4444",bg:"#FEE2E2"},
    {label:"Livrees",   v:orders.filter(function(o){ return o.status==="livre"; }).length,       c:"#10B981",bg:"#D1FAE5"},
  ];

  function markReady(id){ updOrder(id,{status:"prete",modReq:false}); }
  function handleSend(o){
    if(!dest) return;
    updOrder(o.id,{status:method==="livreur"?"livraison":"livre",dMethod:method,dest:dest});
    setSelId(null); setDest(""); setMethod("magasin");
  }
  function handleEdit(updated){
    var t = updated.items.reduce(function(s,i){ return s+i.price*i.qty; },0);
    updOrder(updated.id,{items:updated.items,note:updated.note,total:t});
    setEditOrd(null);
  }

  return (
    <div style={{padding:20,minHeight:"100vh"}}>
      {editOrd && <EditModal order={editOrd} onSave={handleEdit} onClose={function(){ setEditOrd(null); }} onModReq={function(){}} sendMsg={sendMsg} />}
      <div style={{marginBottom:16}}>
        <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:30,color:"#1E0E05",margin:"0 0 2px"}}>Tableau de Production</h2>
        <p style={{color:"#8B7355",fontSize:12,margin:0}}>{queue.length} commande(s) a traiter</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {stats.map(function(s){
          return (
            <div key={s.label} style={{background:s.bg,borderRadius:11,padding:"12px 14px"}}>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"'Outfit',sans-serif"}}>{s.v}</div>
              <div style={{fontSize:9,color:s.c,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>{s.label}</div>
            </div>
          );
        })}
      </div>
      {modReqs.length > 0 && (
        <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#DC2626",marginBottom:6}}>🔔 Demandes de modification</div>
          {modReqs.map(function(m){
            return (
              <div key={m.id} style={{fontSize:11,color:"#991B1B",marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
                {m.ord && <span style={{background:"#FEE2E2",padding:"1px 6px",borderRadius:16,fontWeight:600,fontSize:10}}>{m.ord}</span>}
                <span style={{flex:1}}>{m.text}</span>
                <span style={{color:"rgba(153,27,27,.4)",fontSize:10,flexShrink:0}}>{m.t}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["all","Toutes"],["urgent","🚨 Urgentes"],["normal","Normales"]].map(function(item){
          return (
            <button key={item[0]} onClick={function(){ setFilter(item[0]); }}
              style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",
                      background:filter===item[0]?"#1E0E05":"#fff",color:filter===item[0]?"#FDF8F0":"#5C4A32",
                      fontSize:11,fontWeight:500,fontFamily:"'Outfit',sans-serif",boxShadow:"0 1px 4px rgba(0,0,0,.07)",transition:"all .12s"}}>{item[1]}</button>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {queue.map(function(o, i){
          var sm = SM[o.status] || SM.attente;
          return (
            <div key={o.id} className="ch"
              style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.06)",
                      animation:"slideIn .28s "+(i*.07)+"s both",
                      border:"2px solid "+(o.priority==="urgent"?"#FCA5A5":"#EDE0D0")}}>
              {o.priority==="urgent" && <div style={{height:3,background:"linear-gradient(90deg,#EF4444,#F97316)"}} />}
              <div style={{padding:15}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#1E0E05"}}>{o.id}</span>
                      {o.priority==="urgent" && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:16}}>URGENT</span>}
                      <span style={{background:sm.bg,color:sm.tx,fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:16}}>{sm.label}</span>
                      {o.modReq && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:16}}>🔔</span>}
                    </div>
                    <div style={{fontSize:12,color:"#5C4A32",fontWeight:600}}>{o.client}</div>
                    <div style={{fontSize:10,color:"#8B7355"}}>📍 {o.store}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
                    <div style={{fontSize:10,color:"#8B7355"}}>{o.time}</div>
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  {o.items.map(function(it,j){
                    var itemRecipe = recipes.find(function(r){ return r.name===it.name || (catalogue.find(function(c){return c.id===it.id;}) && r.productId===it.id); });
                    return <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:"1px solid #F0E8DC",fontSize:11}}>
                      <span style={{color:"#3D2B1A"}}>{it.qty}x {it.name}</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {itemRecipe && <button onClick={function(e){e.stopPropagation(); setProdRecipe(itemRecipe);}}
                          style={{padding:"1px 5px",borderRadius:4,border:"1px solid #C4B5FD",background:"#EDE9FE",color:"#5B21B6",fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>📖</button>}
                        <span style={{color:"#8B7355"}}>CHF {(it.price*it.qty).toFixed(2)}</span>
                      </div>
                    </div>;
                  })}
                  {o.note && <div style={{marginTop:4,fontSize:10,color:"#8B7355",fontStyle:"italic"}}>📝 {o.note}</div>}
                </div>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <button onClick={function(){ setEditOrd(o); }}
                    style={{flex:1,padding:"6px",borderRadius:8,border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}
                    onMouseOver={function(e){ e.currentTarget.style.background="#EDE0D0"; }}
                    onMouseOut={function(e){ e.currentTarget.style.background="#F7F3EE"; }}>✏️ Modifier</button>
                  <button onClick={function(){ markReady(o.id); }}
                    style={{flex:1,padding:"6px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✅ Marquer prete</button>
                  {printer&&printer.printKitchenOrder && <button onClick={function(e){e.stopPropagation(); printer.printKitchenOrder(o).catch(function(err){console.warn("Print kitchen:",err);});}}
                    style={{padding:"6px 10px",borderRadius:8,border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}
                    title="Imprimer bon de production">🖨</button>}
                </div>
                {selId === o.id ? (
                  <div style={{background:"#F7F3EE",borderRadius:9,padding:10}}>
                    <select value={dest} onChange={function(e){ setDest(e.target.value); }}
                      style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:6}}>
                      <option value="">-- Destination --</option>
                      {STORES.map(function(s){ return <option key={s}>{s}</option>; })}
                    </select>
                    <div style={{display:"flex",gap:5,marginBottom:6}}>
                      {[["magasin","🏪 Magasin"],["livreur","🚐 Livreur"]].map(function(item){
                        return (
                          <button key={item[0]} onClick={function(){ setMethod(item[0]); }}
                            style={{flex:1,padding:"5px",borderRadius:6,border:"1px solid "+(method===item[0]?"#C8953A":"#D5C4B0"),background:method===item[0]?"#FDF0D8":"#fff",color:method===item[0]?"#92400E":"#5C4A32",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}>{item[1]}</button>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={function(){ setSelId(null); setDest(""); }}
                        style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕</button>
                      <button disabled={!dest} onClick={function(){ handleSend(o); }}
                        style={{flex:2,padding:"6px",borderRadius:6,border:"none",background:dest?"#1E0E05":"#D5C4B0",color:"#FDF8F0",fontSize:11,fontWeight:600,cursor:dest?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>Expedier</button>
                    </div>
                  </div>
                ) : (
                  <button className="bg" onClick={function(){ setSelId(o.id); }}
                    style={{width:"100%",padding:"8px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#FDF8F0",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>🚀 Expedier cette commande</button>
                )}
              </div>
            </div>
          );
        })}
        {queue.length===0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"50px 0",color:"#8B7355"}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div style={{fontSize:16,fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}}>Toutes les commandes traitees !</div>
          </div>
        )}
      </div>
      {/* Recipe quick-view modal */}
      {prodRecipe && (function(){
        var r = prodRecipe;
        var totalTime = r.prepTime + r.cookTime;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(30,14,5,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={function(){ setProdRecipe(null); }}>
            <div style={{background:"#FDF8F0",borderRadius:18,maxWidth:500,width:"100%",maxHeight:"85vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",animation:"fadeUp .25s ease"}}
              onClick={function(e){e.stopPropagation();}}>
              <div style={{background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",padding:"16px 20px",borderRadius:"18px 18px 0 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:"#FDF8F0",fontFamily:"'Outfit',sans-serif"}}>📖 {r.name}</div>
                    <div style={{fontSize:10,color:"#C8953A",marginTop:2}}>{r.portions} portions · {totalTime} min · {r.difficulty}</div>
                  </div>
                  <button onClick={function(){ setProdRecipe(null); }}
                    style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:28,height:28,color:"#FDF8F0",fontSize:14,cursor:"pointer"}}>✕</button>
                </div>
              </div>
              <div style={{padding:16}}>
                <div style={{fontWeight:700,color:"#1E0E05",fontSize:12,marginBottom:6}}>🧈 Ingrédients</div>
                {r.ingredients.map(function(ing,idx){
                  return <div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #F0E8DC",fontSize:11}}>
                    <span style={{color:"#3D2B1A"}}>{ing.name}</span>
                    <span style={{color:"#C8953A",fontWeight:600}}>{ing.qty} {ing.unit}</span>
                  </div>;
                })}
                <div style={{fontWeight:700,color:"#1E0E05",fontSize:12,marginTop:12,marginBottom:6}}>📝 Étapes</div>
                {r.steps.map(function(step,idx){
                  return <div key={idx} style={{display:"flex",gap:8,marginBottom:4,fontSize:11}}>
                    <span style={{width:18,height:18,borderRadius:9,background:"#1E0E05",color:"#C8953A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{idx+1}</span>
                    <span style={{color:"#3D2B1A",lineHeight:1.4}}>{step}</span>
                  </div>;
                })}
                {r.notes && <div style={{background:"#FEF3C7",borderRadius:8,padding:"8px 10px",marginTop:10,fontSize:10,color:"#92400E"}}>💡 {r.notes}</div>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

