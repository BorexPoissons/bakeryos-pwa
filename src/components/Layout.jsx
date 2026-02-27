import { useState, useRef, useEffect } from "react";
import { APP_VERSION, SM, PERMS_DEF, ROLES } from "../constants.js";
import ChatPanel from "./ChatPanel.jsx";

export default function Layout(props) {
  var role    = props.role;
  var tenant  = props.tenant;
  var goRole   = props.goRole   || function(){};
  var viewRole = props.viewRole || role;
  var onLogout = props.onLogout || function(){};
  var orders  = props.orders;
  var unread  = props.unread;
  var children    = props.children;
  var logoUrl     = props.logoUrl;
  var userName    = props.userName    || null;
  var userStore   = props.userStore   || null;
  var chat        = props.chat        || [];
  var sendMsg     = props.sendMsg     || function(){};
  var markRead    = props.markRead    || function(){};
  var permissions = props.permissions || { screens:[], adminTabs:[], features:[] };
  var canScreen = function(id){ return (permissions.screens||[]).indexOf(id)>=0; };
  var canTab    = function(id){ return (permissions.adminTabs||[]).indexOf(id)>=0; };
  var canFeat   = function(id){ return (permissions.features||[]).indexOf(id)>=0; };

  const [mobile,       setMobile]     = useState(function(){ return window.innerWidth < 700; });
  const [mOpen,        setMOpen]      = useState(false);
  const [sideChat,     setSideChat]   = useState(false);
  const [chatInput,    setChatInput]  = useState("");
  const sideChatEndRef = useRef(null);
  useEffect(function(){
    function onResize(){ setMobile(window.innerWidth < 700); }
    window.addEventListener("resize", onResize);
    return function(){ window.removeEventListener("resize", onResize); };
  }, []);

  useEffect(function(){
    if (sideChat && sideChatEndRef.current)
      sideChatEndRef.current.scrollIntoView({behavior:"smooth"});
  }, [chat, sideChat]);

  var prodN = orders.filter(function(o){ return o.status==="production"; }).length;
  var livN  = orders.filter(function(o){ return o.status==="livraison"; }).length;
  var modN  = orders.filter(function(o){ return o.modReq; }).length;

  var isAdmin = role === "admin";
  var allowedScreens = permissions.screens || [];
  var allNavItems = [
    { id:"vendeuse",   icon:"🛒", label:"Vendeuse",   badge:0,     prot:false },
    { id:"production", icon:"👨‍🍳", label:"Production", badge:prodN, prot:false },
    { id:"livreur",    icon:"🚐", label:"Livreur",    badge:livN,  prot:false },
    { id:"gerant",     icon:"🏪", label:"Gérant(e)",  badge:0,     prot:true  },
    { id:"admin",      icon:"📊", label:"Admin",       badge:modN,  prot:true  },
  ];
  // Filtre par permissions.screens — l'admin peut switcher, les autres voient seulement leurs écrans autorisés
  var navItems = allNavItems.filter(function(item){ return allowedScreens.indexOf(item.id) !== -1; });
  // Chat visible uniquement si feature "chat" accordée
  var canChat = permissions.features && permissions.features.indexOf("chat") !== -1;

  var curRole = ROLES.find(function(r){ return r.id===role; }) || {};

  var sidebar = (
    <div style={{display:"flex",flexDirection:"column",height:"100%",padding:"20px 0"}}>
      <div style={{padding:"0 16px",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
          {logoUrl
            ? <img src={logoUrl} alt="logo" style={{width:28,height:28,borderRadius:8,objectFit:"cover",flexShrink:0}} />
            : <span style={{fontSize:20}}>🥐</span>}
          <span style={{fontFamily:"'Outfit',sans-serif",fontSize:20,color:"#FDF8F0",fontWeight:700}}>BakeryOS</span>
        </div>
        <div style={{fontSize:9,color:"rgba(253,248,240,.28)",letterSpacing:1.5,textTransform:"uppercase",paddingLeft:27,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tenant}</div>
      </div>
      <div style={{padding:"0 8px",flex:1}}>
        <div style={{fontSize:9,color:"rgba(253,248,240,.2)",letterSpacing:2,textTransform:"uppercase",padding:"0 7px",marginBottom:5}}>Navigation</div>
        {navItems.map(function(item){
          return (
            <div key={item.id} className="nb"
              onClick={function(){ goRole(item.id); setMOpen(false); }}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 10px",borderRadius:8,
                      marginBottom:2,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:12,
                      background: viewRole === item.id ? "rgba(200,149,58,.15)" : "transparent",
                      color:      viewRole === item.id ? "#C8953A" : "rgba(253,248,240,.58)",
                      fontWeight: viewRole === item.id ? 600 : 400,
                      border:     "1px solid " + (viewRole === item.id ? "rgba(200,149,58,.25)" : "transparent")}}>
              <span style={{fontSize:14}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.prot && <span style={{fontSize:9,color:"rgba(253,248,240,.2)"}}>🔐</span>}
              {item.badge > 0 && (
                <span style={{background: item.id==="admin" ? "#EF4444" : "#C8953A",
                              color:"#fff",borderRadius:18,padding:"1px 6px",fontSize:10,fontWeight:700}}>{item.badge}</span>
              )}
              {viewRole === item.id && <span style={{width:5,height:5,borderRadius:"50%",background:"#C8953A",flexShrink:0}} />}
            </div>
          );
        })}
        <div style={{height:1,background:"rgba(255,255,255,.07)",margin:"8px 2px"}} />
        {canChat && (
          <div>
            {/* Bouton toggle */}
            <div className="nb" onClick={function(){ setSideChat(function(v){ if(!v) markRead(); return !v; }); }}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 10px",borderRadius:8,
                      cursor:"pointer",color: sideChat ? "#C8953A" : "rgba(253,248,240,.58)",fontSize:12,
                      fontFamily:"'Outfit',sans-serif",
                      background: sideChat ? "rgba(200,149,58,.1)" : "transparent",
                      border:"1px solid "+(sideChat?"rgba(200,149,58,.2)":"transparent"),
                      transition:"all .18s"}}>
              <span style={{fontSize:14}}>💬</span>
              <span style={{flex:1}}>Chat Production</span>
              {!sideChat && unread > 0 && <span style={{background:"#EF4444",color:"#fff",borderRadius:18,padding:"1px 6px",fontSize:10,fontWeight:700}}>{unread}</span>}
              <span style={{fontSize:10,opacity:.4,transition:"transform .2s",transform:sideChat?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
            </div>

            {/* Chat déplié */}
            {sideChat && (
              <div style={{margin:"4px 4px 8px",borderRadius:10,overflow:"hidden",
                           border:"1px solid rgba(255,255,255,.07)",animation:"fadeUp .2s ease"}}>
                {/* Messages */}
                <div style={{maxHeight:220,overflowY:"auto",padding:"8px 8px 4px",display:"flex",flexDirection:"column",gap:5,
                             background:"rgba(0,0,0,.15)"}}>
                  {chat.slice(-15).map(function(m){
                    var isMe = m.role === role;
                    return (
                      <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                        {!isMe && (
                          <div style={{fontSize:8,color:"rgba(253,248,240,.25)",marginBottom:2,paddingLeft:2}}>{m.from}</div>
                        )}
                        <div style={{maxWidth:"90%",padding:"5px 8px",
                                     borderRadius:isMe?"9px 3px 9px 9px":"3px 9px 9px 9px",
                                     background: isMe ? "rgba(200,149,58,.25)"
                                                : m.mod ? "rgba(239,68,68,.2)"
                                                : "rgba(255,255,255,.07)",
                                     border: m.mod ? "1px solid rgba(239,68,68,.3)" : "none"}}>
                          {m.mod && <div style={{fontSize:8,fontWeight:700,color:"#FCA5A5",marginBottom:1}}>🔔 MODIF</div>}
                          {m.ord  && <div style={{fontSize:8,color:"#C8953A",fontWeight:600,marginBottom:1}}>{m.ord}</div>}
                          <div style={{fontSize:10,color:isMe?"rgba(253,248,240,.85)":"rgba(253,248,240,.65)",lineHeight:1.4}}>{m.text}</div>
                          <div style={{fontSize:7,opacity:.3,textAlign:"right",marginTop:1,color:"#FDF8F0"}}>{m.t}</div>
                        </div>
                      </div>
                    );
                  })}
                  {chat.length === 0 && (
                    <div style={{textAlign:"center",color:"rgba(253,248,240,.2)",fontSize:10,padding:"8px 0"}}>Aucun message</div>
                  )}
                  <div ref={sideChatEndRef} />
                </div>
                {/* Input */}
                <div style={{display:"flex",gap:4,padding:"6px 6px",background:"rgba(0,0,0,.2)"}}>
                  <input value={chatInput}
                    onChange={function(e){ setChatInput(e.target.value); }}
                    onKeyDown={function(e){
                      if (e.key==="Enter" && chatInput.trim()){
                        sendMsg(chatInput.trim(), null, false, null);
                        setChatInput("");
                      }
                    }}
                    placeholder="Message…"
                    style={{flex:1,padding:"5px 8px",borderRadius:7,border:"1px solid rgba(255,255,255,.1)",
                            background:"rgba(255,255,255,.06)",color:"rgba(253,248,240,.8)",
                            fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",minWidth:0}} />
                  <button onClick={function(){
                      if (!chatInput.trim()) return;
                      sendMsg(chatInput.trim(), null, false, null);
                      setChatInput("");
                    }}
                    style={{padding:"5px 9px",borderRadius:7,border:"none",background:"rgba(200,149,58,.3)",
                            color:"#C8953A",fontSize:13,cursor:"pointer",flexShrink:0,transition:"all .15s"}}
                    onMouseOver={function(e){ e.currentTarget.style.background="rgba(200,149,58,.5)"; }}
                    onMouseOut={function(e){ e.currentTarget.style.background="rgba(200,149,58,.3)"; }}>
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{height:1,background:"rgba(255,255,255,.07)",margin:"10px 14px"}} />
      <div style={{padding:"0 8px"}}>
        <div style={{padding:"10px",background:"rgba(200,149,58,.08)",borderRadius:9,marginBottom:8,border:"1px solid rgba(200,149,58,.13)"}}>
          <div style={{fontSize:9,color:"rgba(253,248,240,.35)",marginBottom:2}}>Connecté(e)</div>
          <div style={{fontSize:12,color:"#FDF8F0",fontWeight:600,marginBottom:1}}>{userName || curRole.label}</div>
          <div style={{fontSize:9,color:"rgba(200,149,58,.55)"}}>{curRole.icon} {curRole.label}{userStore ? " · "+userStore.split(" ").slice(0,3).join(" ") : ""}</div>
        </div>
        <button onClick={onLogout}
          style={{width:"100%",padding:"8px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
                  borderRadius:7,color:"rgba(253,248,240,.4)",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .18s"}}
          onMouseOver={function(e){ e.currentTarget.style.background="rgba(239,68,68,.1)"; }}
          onMouseOut={function(e){ e.currentTarget.style.background="rgba(255,255,255,.04)"; }}>
          Deconnexion
        </button>
        <div style={{textAlign:"center",marginTop:6,fontSize:8,color:"rgba(253,248,240,.15)",fontFamily:"'Outfit',sans-serif"}}>
          v{APP_VERSION}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#F7F3EE"}}>
      {!mobile && (
        <div style={{width:208,background:"#1E0E05",position:"fixed",top:0,left:0,height:"100vh",zIndex:100,flexShrink:0}}>
          {sidebar}
        </div>
      )}
      {mobile && (
        <div style={{position:"fixed",top:0,left:0,right:0,height:50,background:"#1E0E05",zIndex:200,
                     display:"flex",alignItems:"center",padding:"0 13px",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{width:26,height:26,borderRadius:7,objectFit:"cover",flexShrink:0}} />
              : <span style={{fontSize:18}}>🥐</span>}
            <span style={{fontFamily:"'Outfit',sans-serif",fontSize:18,color:"#FDF8F0",fontWeight:700}}>BakeryOS</span>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={function(){ setMOpen(function(v){ return !v; }); }} style={{background:"none",border:"none",color:"#C8953A",fontSize:20,cursor:"pointer"}}>☰</button>
          </div>
        </div>
      )}
      {mobile && mOpen && (
        <div style={{position:"fixed",inset:0,zIndex:300}} onClick={function(){ setMOpen(false); }}>
          <div style={{position:"absolute",top:0,left:0,width:230,height:"100%",background:"#1E0E05"}}
               onClick={function(e){ e.stopPropagation(); }}>
            {sidebar}
          </div>
        </div>
      )}
      <div style={{marginLeft:mobile?0:208,flex:1,minHeight:"100vh",paddingTop:mobile?50:0,animation:"slideIn .3s ease"}}>
        {children}
      </div>
    </div>
  );
}

