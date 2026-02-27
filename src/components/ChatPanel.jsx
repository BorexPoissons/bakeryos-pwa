import { useState, useRef, useEffect } from "react";
import { STORES } from "../constants.js";
import { hm } from "../utils.js";

export default function ChatPanel(props) {
  var chat     = props.chat;
  var role     = props.role;
  var sendMsg  = props.sendMsg;
  var orders   = props.orders;
  var onClose  = props.onClose;

  const [text,      setText]      = useState("");
  const [linked,    setLinked]    = useState("");
  const [isMod,     setIsMod]     = useState(false);
  const [mention,   setMention]   = useState("tous");  // "tous" | store name | role
  const [showMen,   setShowMen]   = useState(false);   // dropdown @mention visible
  const endRef        = useRef(null);
  const inputRef      = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(function(){
    if (!endRef.current) return;
    // Premier rendu → scroll instantané pour ne pas animer depuis le haut
    endRef.current.scrollIntoView({ behavior: isFirstRender.current ? "instant" : "smooth" });
    isFirstRender.current = false;
  }, [chat]);

  var rLabels = { vendeuse:"🛒 Vendeuse", production:"👨‍🍳 Production", livreur:"🚐 Livreur", admin:"📊 Admin" };

  // Destinataires disponibles selon le rôle
  var mentionTargets = [
    { id:"tous",       label:"@Tous",              icon:"📢", desc:"Tous les magasins & rôles" },
    { id:"production", label:"@Production",        icon:"👨‍🍳", desc:"Équipe de production" },
    { id:"livreur",    label:"@Livreurs",          icon:"🚐", desc:"Équipe de livraison" },
    { id:"vendeuse",   label:"@Vendeuses",         icon:"🛒", desc:"Toutes les vendeuses" },
    { id:"Rue du Four 12",          label:"@Rue du Four",    icon:"🏪", desc:"Magasin Rue du Four 12" },
    { id:"Place de la Liberte 3",   label:"@Place Liberté",  icon:"🏪", desc:"Magasin Place de la Liberté" },
    { id:"Avenue des Fleurs 8",     label:"@Av. Fleurs",     icon:"🏪", desc:"Magasin Avenue des Fleurs" },
  ];

  var curTarget = mentionTargets.find(function(t){ return t.id===mention; }) || mentionTargets[0];

  function send() {
    if (!text.trim()) return;
    sendMsg(text.trim(), linked || null, isMod, mention !== "tous" ? mention : null);
    setText(""); setLinked(""); setIsMod(false);
  }

  // Intercepte "@" tapé dans le champ
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { send(); return; }
    if (e.key === "@") { setShowMen(true); }
  }

  function pickMention(id) {
    setMention(id);
    setShowMen(false);
    // Retire le "@" s'il a été tapé
    setText(function(t){ return t.replace(/@$/, ""); });
    if (inputRef.current) inputRef.current.focus();
  }

  // Filtre les messages selon la mention (tous voient tout, mais les messages ciblés ont une bordure)
  function isMentioned(m) {
    if (!m.mention) return false;
    if (m.mention === role) return true;
    if (m.mention === "Rue du Four 12" || m.mention === "Place de la Liberte 3" || m.mention === "Avenue des Fleurs 8") return true;
    return false;
  }

  return (
    <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",background:"#fff",
                 boxShadow:"-7px 0 30px rgba(0,0,0,.13)",zIndex:600,
                 display:"flex",flexDirection:"column",animation:"slR .25s ease"}}>

      {/* Header */}
      <div style={{background:"#1E0E05",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(200,149,58,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💬</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:15,color:"#FDF8F0",fontWeight:700}}>Chat inter-magasins</div>
          <div style={{fontSize:10,color:"rgba(253,248,240,.35)"}}>{chat.length} messages · tapez @ pour mentionner</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(253,248,240,.42)",cursor:"pointer",fontSize:18}}>✕</button>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"13px 12px",display:"flex",flexDirection:"column",gap:8,background:"#F7F3EE"}}>
        {chat.map(function(m){
          var isMe = m.role === role;
          var tagged = isMentioned(m);
          var mentTarget = m.mention ? (mentionTargets.find(function(t){ return t.id===m.mention; })||{}) : null;
          return (
            <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
              {!isMe && (
                <div style={{fontSize:9,color:"#8B7355",marginBottom:2,paddingLeft:3,display:"flex",alignItems:"center",gap:5}}>
                  {rLabels[m.role]} · {m.from}
                  {mentTarget && <span style={{background:"#1E0E05",color:"#C8953A",fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:10}}>{mentTarget.label}</span>}
                </div>
              )}
              {isMe && mentTarget && (
                <div style={{fontSize:8,color:"#8B7355",marginBottom:2,paddingRight:3,textAlign:"right"}}>
                  Envoyé à <span style={{fontWeight:700,color:"#C8953A"}}>{mentTarget.label}</span>
                </div>
              )}
              <div style={{maxWidth:"84%",padding:"8px 11px",
                           borderRadius: isMe ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
                           background:   isMe ? "#1E0E05" : m.mod ? "#FEE2E2" : tagged ? "#FFFBEB" : "#fff",
                           color:        isMe ? "#FDF8F0" : m.mod ? "#991B1B" : "#1E0E05",
                           boxShadow:"0 2px 6px rgba(0,0,0,.07)",
                           border: m.mod ? "1.5px solid #FCA5A5" : tagged ? "1.5px solid #FCD34D" : "none"}}>
                {m.mod && <div style={{fontSize:9,fontWeight:700,color:"#DC2626",marginBottom:2}}>🔔 DEMANDE DE MODIFICATION</div>}
                {m.ord  && <div style={{fontSize:9,fontWeight:600,color:isMe?"rgba(253,248,240,.42)":"#C8953A",marginBottom:2}}>{m.ord}</div>}
                <div style={{fontSize:12,lineHeight:1.5}}>{m.text}</div>
                <div style={{fontSize:9,color:isMe?"rgba(253,248,240,.35)":"#8B7355",marginTop:2,textAlign:"right"}}>{m.t}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Compose zone */}
      <div style={{padding:"10px 12px",borderTop:"1px solid #EDE0D0",background:"#fff",position:"relative"}}>

        {/* Dropdown @mention */}
        {showMen && (
          <div style={{position:"absolute",bottom:"100%",left:12,right:12,background:"#1E0E05",borderRadius:12,
                       boxShadow:"0 -8px 28px rgba(0,0,0,.22)",overflow:"hidden",zIndex:10,animation:"slideIn .15s ease"}}>
            <div style={{padding:"9px 12px 6px",fontSize:9,color:"rgba(253,248,240,.35)",textTransform:"uppercase",letterSpacing:1.5,fontWeight:600}}>Envoyer à…</div>
            {mentionTargets.map(function(t){
              var active = mention === t.id;
              return (
                <div key={t.id} onClick={function(){ pickMention(t.id); }}
                  style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",cursor:"pointer",
                          background: active ? "rgba(200,149,58,.15)" : "transparent",
                          borderLeft: active ? "2px solid #C8953A" : "2px solid transparent",
                          transition:"all .12s"}}
                  onMouseOver={function(e){ e.currentTarget.style.background="rgba(200,149,58,.1)"; }}
                  onMouseOut={function(e){ e.currentTarget.style.background=active?"rgba(200,149,58,.15)":"transparent"; }}>
                  <span style={{fontSize:14}}>{t.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:active?700:500,color:active?"#C8953A":"#FDF8F0"}}>{t.label}</div>
                    <div style={{fontSize:9,color:"rgba(253,248,240,.35)"}}>{t.desc}</div>
                  </div>
                  {active && <span style={{fontSize:10,color:"#C8953A"}}>✓</span>}
                </div>
              );
            })}
            <div onClick={function(){ setShowMen(false); }}
              style={{padding:"7px 12px",textAlign:"center",fontSize:10,color:"rgba(253,248,240,.3)",cursor:"pointer",borderTop:"1px solid rgba(255,255,255,.06)"}}>
              Fermer
            </div>
          </div>
        )}

        {/* @ badge + lier commande row */}
        <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
          {/* @ button */}
          <button onClick={function(){ setShowMen(function(v){ return !v; }); }}
            title="Mentionner / cibler un destinataire"
            style={{flexShrink:0,width:32,height:30,borderRadius:7,border:"1.5px solid "+(mention!=="tous"?"#C8953A":"#D5C4B0"),
                    background:mention!=="tous"?"#FDF0D8":"#F7F3EE",
                    color:mention!=="tous"?"#92400E":"#5C4A32",
                    fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                    transition:"all .15s",position:"relative"}}>
            @
            {mention !== "tous" && (
              <span style={{position:"absolute",top:-4,right:-4,width:8,height:8,borderRadius:"50%",background:"#C8953A",border:"1.5px solid #fff"}} />
            )}
          </button>

          {/* Current target pill */}
          {mention !== "tous" && (
            <div style={{display:"flex",alignItems:"center",gap:4,background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:14,padding:"2px 8px",flexShrink:0}}>
              <span style={{fontSize:11}}>{curTarget.icon}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#92400E"}}>{curTarget.label}</span>
              <span onClick={function(){ setMention("tous"); }} style={{fontSize:11,color:"#92400E",cursor:"pointer",marginLeft:2}}>✕</span>
            </div>
          )}

          <select value={linked} onChange={function(e){ setLinked(e.target.value); }}
            style={{flex:1,padding:"5px 8px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,outline:"none",color:"#5C4A32",fontFamily:"'Outfit',sans-serif",minWidth:0}}>
            <option value="">📎 Commande (opt.)</option>
            {orders.filter(function(o){ return o.status !== "livre"; }).map(function(o){
              return <option key={o.id} value={o.id}>{o.id} · {o.client}</option>;
            })}
          </select>
          <label style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#8B7355",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
            <input type="checkbox" checked={isMod} onChange={function(e){ setIsMod(e.target.checked); }} style={{accentColor:"#EF4444"}} />
            🔔
          </label>
        </div>

        {/* Input row */}
        <div style={{display:"flex",gap:6}}>
          <input ref={inputRef} value={text}
            onChange={function(e){
              var v = e.target.value;
              setText(v);
              // Ouvre le dropdown si @ est tapé en dernier caractère
              if (v.endsWith("@")) setShowMen(true);
              else if (showMen && !v.includes("@")) setShowMen(false);
            }}
            onKeyDown={handleKey}
            placeholder={mention!=="tous" ? "Message pour "+curTarget.label+"…" : "Ecrire un message… (@ pour mentionner)"}
            style={{flex:1,padding:"8px 11px",borderRadius:8,border:"2px solid transparent",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",transition:"border-color .18s"}}
            onFocus={function(e){ e.target.style.borderColor="#C8953A"; }}
            onBlur={function(e){ e.target.style.borderColor="transparent"; }} />
          <button onClick={send} disabled={!text.trim()}
            style={{width:38,height:38,borderRadius:8,border:"none",fontSize:15,
                    background:text.trim()?"linear-gradient(135deg,#C8953A,#a07228)":"#EDE0D0",
                    color:text.trim()?"#1E0E05":"#8B7355",cursor:text.trim()?"pointer":"not-allowed",
                    display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s"}}>↑</button>
        </div>
      </div>
    </div>
  );
}

