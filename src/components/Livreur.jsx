import { useState } from "react";
import { DRIVERS } from "../constants.js";
import DeliveryCard from "./DeliveryCard.jsx";

export default function Livreur(props) {
  var orders   = props.orders;
  var updOrder = props.updOrder;
  const [tab,        setTab]        = useState("prete");
  const [myName,     setMyName]     = useState("");
  const [confirmed,  setConfirmed]  = useState(false);

  // Commandes prêtes assignées à ce chauffeur (ou toutes si non confirmé)
  var prete     = orders.filter(function(o){ return o.status==="prete" && o.dMethod==="livreur"; });
  var myPrete   = confirmed ? prete.filter(function(o){ return o.driver===myName; }) : [];
  var enRoute   = orders.filter(function(o){ return o.status==="livraison" && o.dMethod==="livreur" && (!confirmed || o.driver===myName); });
  var livrees   = orders.filter(function(o){ return o.status==="livre" && o.dMethod==="livreur" && (!confirmed || o.driver===myName); });

  // Écran identification chauffeur
  if (!confirmed) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F7F3EE"}}>
        <div style={{background:"#fff",borderRadius:20,padding:36,boxShadow:"0 8px 32px rgba(0,0,0,.1)",maxWidth:380,width:"100%",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>🚐</div>
          <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:24,color:"#1E0E05",margin:"0 0 6px"}}>Identification chauffeur</h2>
          <p style={{color:"#8B7355",fontSize:12,margin:"0 0 20px"}}>Sélectionnez votre nom pour voir vos livraisons assignées</p>
          <div style={{display:"grid",gap:8,marginBottom:20}}>
            {DRIVERS.filter(function(d){ return d!=="Non assigné"; }).map(function(d){
              var nb = prete.filter(function(o){ return o.driver===d; }).length;
              var active = myName===d;
              return (
                <div key={d} onClick={function(){ setMyName(d); }}
                  style={{padding:"12px 16px",borderRadius:12,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
                          border:"2px solid "+(active?"#C8953A":"#EDE0D0"),
                          background:active?"#FDF0D8":"#F7F3EE",transition:"all .14s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:active?"#C8953A":"#D5C4B0",
                                 display:"flex",alignItems:"center",justifyContent:"center",
                                 color:active?"#1E0E05":"#fff",fontWeight:700,fontSize:13}}>
                      {d.split(" ").map(function(n){ return n[0]; }).join("")}
                    </div>
                    <span style={{fontSize:13,fontWeight:active?700:500,color:active?"#92400E":"#1E0E05"}}>{d}</span>
                  </div>
                  {nb > 0 && (
                    <span style={{background:"#C8953A",color:"#1E0E05",fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:14}}>
                      {nb} colis
                    </span>
                  )}
                  {nb === 0 && <span style={{fontSize:10,color:"#8B7355"}}>Aucune livraison</span>}
                </div>
              );
            })}
          </div>
          <button disabled={!myName} onClick={function(){ setConfirmed(true); }}
            style={{width:"100%",padding:"12px",borderRadius:11,border:"none",
                    background:myName?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                    color:myName?"#1E0E05":"#8B7355",fontSize:13,fontWeight:700,
                    cursor:myName?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
            {myName ? "🚐 Commencer ma tournée — " + myName : "Sélectionnez votre nom"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:20,minHeight:"100vh"}}>
      {/* En-tête chauffeur */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"#1E0E05",display:"flex",alignItems:"center",justifyContent:"center",color:"#C8953A",fontWeight:700,fontSize:14}}>
              {myName.split(" ").map(function(n){ return n[0]; }).join("")}
            </div>
            <div>
              <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:22,color:"#1E0E05",margin:0}}>Bonjour, {myName.split(" ")[0]} 👋</h2>
              <p style={{color:"#8B7355",fontSize:11,margin:0}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p>
            </div>
          </div>
        </div>
        <button onClick={function(){ setConfirmed(false); setMyName(""); setTab("prete"); }}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid #EDE0D0",background:"#F7F3EE",color:"#8B7355",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
          ← Changer
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {[
          {l:"Colis prêts",   v:myPrete.length,  c:"#7C3AED", bg:"#F3E8FF", icon:"📦"},
          {l:"En route",      v:enRoute.length,   c:"#C8953A", bg:"#FEF3C7", icon:"🚐"},
          {l:"Livrés",        v:livrees.length,   c:"#10B981", bg:"#D1FAE5", icon:"✅"},
        ].map(function(s){
          return (
            <div key={s.l} style={{background:s.bg,borderRadius:11,padding:"13px 14px"}}>
              <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"'Outfit',sans-serif"}}>{s.v}</div>
              <div style={{fontSize:9,color:s.c,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>{s.l}</div>
            </div>
          );
        })}
      </div>

      {/* Onglets */}
      <div style={{display:"flex",gap:0,background:"#fff",borderRadius:10,padding:3,marginBottom:16,width:"fit-content",boxShadow:"0 1px 5px rgba(0,0,0,.06)"}}>
        {[
          ["prete",   "📦 Prêts ("+myPrete.length+")"],
          ["enroute", "🚐 En route ("+enRoute.length+")"],
          ["livrees", "✅ Livrés ("+livrees.length+")"],
        ].map(function(item){
          return (
            <button key={item[0]} onClick={function(){ setTab(item[0]); }}
              style={{padding:"6px 13px",borderRadius:8,border:"none",background:tab===item[0]?"#1E0E05":"transparent",
                      color:tab===item[0]?"#FDF8F0":"#8B7355",fontSize:11,fontWeight:tab===item[0]?600:400,
                      cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .16s"}}>{item[1]}</button>
          );
        })}
      </div>

      {/* PRÊTS À CHARGER */}
      {tab==="prete" && (
        <div style={{display:"grid",gap:12,maxWidth:560}}>
          {myPrete.length===0 && (
            <div style={{textAlign:"center",padding:"40px",color:"#8B7355",background:"#fff",borderRadius:14}}>
              <div style={{fontSize:36,marginBottom:8}}>📭</div>
              <div style={{fontSize:14,color:"#1E0E05",fontFamily:"'Outfit',sans-serif"}}>Aucun colis assigné</div>
              <div style={{fontSize:11,marginTop:4}}>Les commandes apparaissent ici quand elles sont prêtes et assignées à vous</div>
            </div>
          )}
          {myPrete.map(function(o,i){
            return (
              <div key={o.id} style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 3px 14px rgba(0,0,0,.08)",
                                       border:"2px solid #FCD34D",animation:"slideIn .22s "+(i*.08)+"s both"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:"#1E0E05",marginBottom:2}}>
                      {o.id} · {o.client}
                    </div>
                    <div style={{fontSize:11,color:"#8B7355"}}>📍 {o.dest || o.store}</div>
                    {o.note && <div style={{fontSize:10,color:"#92400E",background:"#FEF3C7",padding:"2px 7px",borderRadius:8,marginTop:4,display:"inline-block"}}>💬 {o.note}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
                    <div style={{fontSize:9,color:"#7C3AED",fontWeight:700,background:"#F3E8FF",padding:"2px 7px",borderRadius:8,marginTop:2}}>
                      🚐 {o.driver}
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  {o.items.map(function(it){ return (
                    <span key={it.id} style={{display:"inline-block",margin:"2px 4px 2px 0",padding:"2px 8px",background:"#F7F3EE",borderRadius:12,fontSize:10,color:"#5C4A32"}}>
                      {it.qty}× {it.name}
                    </span>
                  ); })}
                </div>
                <button onClick={function(){ updOrder(o.id,{status:"livraison"}); }}
                  style={{width:"100%",padding:"10px",borderRadius:10,border:"none",
                          background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",
                          fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                  📦 → 🚐 Chargé dans le camion
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* EN ROUTE */}
      {tab==="enroute" && (
        <div style={{display:"grid",gap:12,maxWidth:560}}>
          {enRoute.map(function(o,i){
            return (
              <div key={o.id} style={{animation:"slideIn .26s "+(i*.1)+"s both"}}>
                <DeliveryCard order={o} updOrder={updOrder} />
              </div>
            );
          })}
          {enRoute.length===0 && (
            <div style={{textAlign:"center",padding:"40px",color:"#8B7355",background:"#fff",borderRadius:14}}>
              <div style={{fontSize:36,marginBottom:8}}>🛣️</div>
              <div style={{fontSize:14,color:"#1E0E05",fontFamily:"'Outfit',sans-serif"}}>Aucune livraison en cours</div>
            </div>
          )}
        </div>
      )}

      {/* LIVRÉES */}
      {tab==="livrees" && (
        <div style={{display:"grid",gap:8,maxWidth:560}}>
          {livrees.map(function(o){
            return (
              <div key={o.id} style={{background:"#fff",borderRadius:12,padding:"13px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#D1FAE5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✅</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:"#1E0E05",fontSize:12,marginBottom:1}}>{o.id} · {o.client}</div>
                  <div style={{fontSize:10,color:"#8B7355"}}>📍 {o.dest||o.store} {o.signedAt ? "· "+o.signedAt : ""}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
              </div>
            );
          })}
          {livrees.length===0 && <div style={{textAlign:"center",padding:"35px",color:"#8B7355",fontSize:12}}>Aucune livraison terminée</div>}
        </div>
      )}
    </div>
  );
}

