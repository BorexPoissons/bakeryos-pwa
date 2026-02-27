import { useState, useRef, useEffect } from "react";
import { STORES, CATS } from "../constants.js";
import { hm } from "../utils.js";

function FloorPlanEditor(props) {
  var store         = props.store;
  var layout        = props.layout || [];
  var onSave        = props.onSave;

  var W = 560; var H = 360; // canvas dimensions

  const [tables,    setTables]    = useState(layout.length ? layout : []);
  const [dragging,  setDragging]  = useState(null); // {id, ox, oy}
  const [selected,  setSelected]  = useState(null);
  const [count,     setCount]     = useState(layout.length || 4);
  const [saved,     setSaved]     = useState(false);
  const svgRef = useRef(null);

  // Générer tables quand count change (garde les existantes, ajoute/enlève)
  function applyCount(n) {
    setCount(n);
    setTables(function(prev) {
      if (n > prev.length) {
        var added = [];
        for (var i = prev.length + 1; i <= n; i++) {
          added.push({
            id: i, name: "T"+i,
            x: 40 + ((i-1) % 6) * 85,
            y: 40 + Math.floor((i-1) / 6) * 90,
            shape: "round", seats: 4
          });
        }
        return prev.concat(added);
      }
      return prev.slice(0, n);
    });
  }

  function onMouseDown(e, id) {
    e.stopPropagation();
    var rect = svgRef.current.getBoundingClientRect();
    var t = tables.find(function(t){ return t.id===id; });
    setDragging({ id: id, ox: e.clientX - rect.left - t.x, oy: e.clientY - rect.top - t.y });
    setSelected(id);
  }
  function onMouseMove(e) {
    if (!dragging) return;
    var rect = svgRef.current.getBoundingClientRect();
    var nx = Math.max(20, Math.min(W-40, e.clientX - rect.left - dragging.ox));
    var ny = Math.max(20, Math.min(H-40, e.clientY - rect.top  - dragging.oy));
    setTables(function(prev){
      return prev.map(function(t){ return t.id===dragging.id ? Object.assign({},t,{x:nx,y:ny}) : t; });
    });
  }
  function onMouseUp() { setDragging(null); }

  function updateTable(id, patch) {
    setTables(function(prev){ return prev.map(function(t){ return t.id===id ? Object.assign({},t,patch) : t; }); });
  }

  function save() {
    onSave(tables);
    setSaved(true);
    setTimeout(function(){ setSaved(false); }, 2000);
  }

  var sel = selected ? tables.find(function(t){ return t.id===selected; }) : null;

  return (
    <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{fontWeight:700,color:"#1E0E05",fontSize:14,fontFamily:"'Outfit',sans-serif"}}>
          🪑 Plan de salle — {store}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto"}}>
          <label style={{fontSize:11,color:"#8B7355"}}>Tables :</label>
          <input type="number" min="1" max="30" value={count}
            onChange={function(e){ applyCount(parseInt(e.target.value)||1); }}
            style={{width:52,padding:"4px 8px",borderRadius:7,border:"1.5px solid #EDE0D0",
                    fontSize:13,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif"}} />
          <button onClick={save}
            style={{padding:"6px 16px",borderRadius:8,border:"none",
                    background:saved?"#065F46":"linear-gradient(135deg,#C8953A,#a07228)",
                    color:saved?"#D1FAE5":"#1E0E05",fontSize:12,fontWeight:700,cursor:"pointer",
                    fontFamily:"'Outfit',sans-serif",transition:"all .2s"}}>
            {saved ? "✅ Sauvegardé" : "💾 Sauvegarder"}
          </button>
        </div>
      </div>

      <div style={{display:"flex",gap:14}}>
        {/* SVG canvas */}
        <div style={{flex:1,position:"relative",userSelect:"none"}}>
          <svg ref={svgRef} width="100%" viewBox={"0 0 "+W+" "+H}
            style={{background:"#F7F3EE",borderRadius:12,border:"1.5px solid #EDE0D0",cursor:dragging?"grabbing":"default",display:"block"}}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            {/* Grille subtile */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />

            {tables.map(function(t){
              var isSel = selected === t.id;
              var r = t.shape === "round" ? 28 : 0;
              return (
                <g key={t.id} onMouseDown={function(e){ onMouseDown(e, t.id); }}
                   style={{cursor:"grab"}}>
                  {t.shape === "round" ? (
                    <circle cx={t.x} cy={t.y} r={30}
                      fill={isSel?"#FDF0D8":"#fff"}
                      stroke={isSel?"#C8953A":"#D4C4B0"} strokeWidth={isSel?2.5:1.5} />
                  ) : (
                    <rect x={t.x-32} y={t.y-22} width={64} height={44} rx={6}
                      fill={isSel?"#FDF0D8":"#fff"}
                      stroke={isSel?"#C8953A":"#D4C4B0"} strokeWidth={isSel?2.5:1.5} />
                  )}
                  <text x={t.x} y={t.y+1} textAnchor="middle" dominantBaseline="middle"
                    style={{fontSize:11,fontWeight:700,fill:isSel?"#92400E":"#5C4A32",
                            fontFamily:"'Outfit',sans-serif",pointerEvents:"none"}}>
                    {t.name}
                  </text>
                  <text x={t.x} y={t.y+14} textAnchor="middle" dominantBaseline="middle"
                    style={{fontSize:9,fill:"#B8A898",fontFamily:"'Outfit',sans-serif",pointerEvents:"none"}}>
                    {t.seats}p
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{fontSize:10,color:"#B8A898",marginTop:6,textAlign:"center"}}>
            Glissez les tables pour les positionner · Cliquez pour sélectionner et éditer
          </div>
        </div>

        {/* Panneau édition table sélectionnée */}
        <div style={{width:170,flexShrink:0}}>
          {sel ? (
            <div style={{background:"#F7F3EE",borderRadius:12,padding:14,border:"1px solid #EDE0D0"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#5C4A32",marginBottom:10,textTransform:"uppercase",letterSpacing:.8}}>
                ✏️ {sel.name}
              </div>
              <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Nom</label>
              <input value={sel.name} onChange={function(e){ updateTable(sel.id,{name:e.target.value}); }}
                style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1px solid #EDE0D0",
                        fontSize:12,fontWeight:600,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:8}} />
              <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Couverts</label>
              <input type="number" min="1" max="20" value={sel.seats}
                onChange={function(e){ updateTable(sel.id,{seats:parseInt(e.target.value)||1}); }}
                style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1px solid #EDE0D0",
                        fontSize:12,fontWeight:600,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:8}} />
              <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:5}}>Forme</label>
              <div style={{display:"flex",gap:6}}>
                {[["round","⬤"],["square","▪"]].map(function(s){
                  return (
                    <button key={s[0]} onClick={function(){ updateTable(sel.id,{shape:s[0]}); }}
                      style={{flex:1,padding:"5px",borderRadius:7,border:"1.5px solid "+(sel.shape===s[0]?"#C8953A":"#EDE0D0"),
                              background:sel.shape===s[0]?"#FDF0D8":"#fff",cursor:"pointer",fontSize:14,transition:"all .15s"}}>
                      {s[1]}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{background:"#F7F3EE",borderRadius:12,padding:14,border:"1px solid #EDE0D0",
                         textAlign:"center",color:"#B8A898",fontSize:11}}>
              <div style={{fontSize:24,marginBottom:6}}>🖱</div>
              Cliquez une table pour l'éditer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── FLOOR PLAN VIEW (POS Vendeuse) ─────────────────────────── */
function FloorPlanView(props) {
  var tables        = props.tables   || [];
  var sessions      = props.sessions || {};
  var onSelectTable = props.onSelectTable;
  var store         = props.store;

  var W = 560; var H = 320;

  function getStatus(t) {
    var key = store+"_"+t.id;
    var s = sessions[key];
    if (!s) return "libre";
    if (s.status === "addition") return "addition";
    if (s.cart && s.cart.length > 0) return "occupee";
    return "libre";
  }

  var STATUS_STYLE = {
    libre:    { fill:"#D1FAE5", stroke:"#10B981", dot:"#10B981", label:"Libre",    tx:"#065F46" },
    occupee:  { fill:"#FEF3C7", stroke:"#F59E0B", dot:"#F59E0B", label:"Occupée",  tx:"#92400E" },
    addition: { fill:"#FEE2E2", stroke:"#EF4444", dot:"#EF4444", label:"Addition", tx:"#991B1B" },
  };

  if (tables.length === 0) {
    return (
      <div style={{padding:"40px 20px",textAlign:"center",color:"#8B7355"}}>
        <div style={{fontSize:36,marginBottom:8}}>🪑</div>
        <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Aucune table configurée</div>
        <div style={{fontSize:11}}>L'admin doit configurer le plan de salle dans Gestion → Magasin</div>
      </div>
    );
  }

  return (
    <div style={{padding:16}}>
      {/* Légende */}
      <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
        {Object.entries(STATUS_STYLE).map(function(e){
          var key=e[0], st=e[1];
          return (
            <div key={key} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#5C4A32"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:st.dot}} />
              {st.label}
            </div>
          );
        })}
      </div>

      <svg width="100%" viewBox={"0 0 "+W+" "+H}
        style={{background:"#F7F3EE",borderRadius:14,border:"1.5px solid #EDE0D0",display:"block"}}>
        <defs>
          <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid2)" />

        {tables.map(function(t){
          var status = getStatus(t);
          var st = STATUS_STYLE[status];
          var key = store+"_"+t.id;
          var sess = sessions[key];
          var cartTotal = sess ? sess.cart.reduce(function(s,i){ return s+i.price*i.qty; },0) : 0;

          return (
            <g key={t.id} onClick={function(){ onSelectTable(t); }} style={{cursor:"pointer"}}>
              {t.shape === "round" ? (
                <circle cx={t.x} cy={t.y} r={30}
                  fill={st.fill} stroke={st.stroke} strokeWidth={2}
                  style={{transition:"all .2s",filter:status==="addition"?"drop-shadow(0 0 6px rgba(239,68,68,.5))":"none"}} />
              ) : (
                <rect x={t.x-32} y={t.y-22} width={64} height={44} rx={6}
                  fill={st.fill} stroke={st.stroke} strokeWidth={2} />
              )}
              {/* Indicateur statut */}
              <circle cx={t.x+22} cy={t.y-22} r={6} fill={st.dot} />

              <text x={t.x} y={t.y+1} textAnchor="middle" dominantBaseline="middle"
                style={{fontSize:11,fontWeight:700,fill:st.tx,fontFamily:"'Outfit',sans-serif",pointerEvents:"none"}}>
                {t.name}
              </text>
              {cartTotal > 0 && (
                <text x={t.x} y={t.y+14} textAnchor="middle" dominantBaseline="middle"
                  style={{fontSize:9,fill:st.tx,fontFamily:"'Outfit',sans-serif",pointerEvents:"none",fontWeight:600}}>
                  CHF {cartTotal.toFixed(2)}
                </text>
              )}
              {status === "libre" && (
                <text x={t.x} y={t.y+14} textAnchor="middle" dominantBaseline="middle"
                  style={{fontSize:9,fill:"#B8A898",fontFamily:"'Outfit',sans-serif",pointerEvents:"none"}}>
                  {t.seats}p
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── TABLE CART (POS Vendeuse) ───────────────────────────────── */
function TableCart(props) {
  var table         = props.table;
  var session       = props.session || {cart:[], openedAt: null, status:"libre"};
  var catalogue     = props.catalogue || [];
  var onUpdate      = props.onUpdate;   // (patch) -> updates session
  var onClose       = props.onClose;    // ferme le modal (met en attente)
  var onPayDirect   = props.onPayDirect;// (table, session) -> paiement direct
  var onClearTable  = props.onClearTable;// (table) -> vider la table
  var sendMsg       = props.sendMsg;

  var [search, setSearch] = useState("");
  var [cat,    setCat]    = useState("Tous");
  var [confirmClear, setConfirmClear] = useState(false);

  var cart  = session.cart || [];
  var total = cart.reduce(function(s,i){ return s+i.price*i.qty; }, 0);

  var activeProd = catalogue.filter(function(p){ return p.active; });
  var CATS = ["Tous"].concat(activeProd.reduce(function(acc,p){
    if (acc.indexOf(p.category)<0) acc.push(p.category); return acc;
  },[]));
  var filtered = activeProd.filter(function(p){
    return (cat==="Tous"||p.category===cat) && p.name.toLowerCase().indexOf(search.toLowerCase())>=0;
  });

  function addItem(p) {
    var newCart = cart.slice();
    var ex = newCart.find(function(i){ return i.id===p.id; });
    if (ex) { ex.qty++; } else { newCart.push(Object.assign({},p,{qty:1})); }
    onUpdate({cart: newCart, status:"occupee", openedAt: session.openedAt || hm()});
  }
  function setQty(id, q) {
    var newCart = q<=0 ? cart.filter(function(i){ return i.id!==id; })
                       : cart.map(function(i){ return i.id===id?Object.assign({},i,{qty:q}):i; });
    onUpdate({cart: newCart, status: newCart.length===0?"libre":"occupee"});
  }
  function requestBill() {
    onUpdate({cart: cart, status:"addition"});
    sendMsg("Table "+table.name+" demande l'addition (CHF "+total.toFixed(2)+")", null, false, null);
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:850,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:780,height:"90vh",
                   display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.3)",
                   animation:"pinIn .22s ease"}}>

        {/* Header */}
        <div style={{background:"#1E0E05",padding:"14px 18px",display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:120}}>
            <div style={{color:"#C8953A",fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800}}>
              🪑 {table.name}
            </div>
            <div style={{color:"rgba(253,248,240,.4)",fontSize:10}}>
              {table.seats} couverts{session.openedAt?" · Ouvert à "+session.openedAt:""}
              {cart.length > 0 ? " · "+cart.reduce(function(s,i){return s+i.qty;},0)+" articles" : ""}
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            {/* Vider la table */}
            {cart.length > 0 && !confirmClear && (
              <button onClick={function(){ setConfirmClear(true); }}
                title="Vider la table"
                style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,.3)",
                        background:"rgba(239,68,68,.1)",color:"#FCA5A5",fontSize:11,fontWeight:600,
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                🗑
              </button>
            )}
            {confirmClear && (
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{color:"#FCA5A5",fontSize:10}}>Vider ?</span>
                <button onClick={function(){ onClearTable(table); setConfirmClear(false); }}
                  style={{padding:"4px 8px",borderRadius:6,border:"none",background:"#EF4444",color:"#fff",
                          fontSize:10,fontWeight:700,cursor:"pointer"}}>Oui</button>
                <button onClick={function(){ setConfirmClear(false); }}
                  style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,.2)",background:"transparent",
                          color:"#FCA5A5",fontSize:10,cursor:"pointer"}}>Non</button>
              </div>
            )}
            {/* Appeler l'addition */}
            {cart.length > 0 && session.status !== "addition" && (
              <button onClick={requestBill}
                style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(239,68,68,.4)",
                        background:"rgba(239,68,68,.15)",color:"#FCA5A5",fontSize:11,fontWeight:700,
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                🧾 Addition
              </button>
            )}
            {session.status === "addition" && (
              <div style={{padding:"6px 10px",borderRadius:8,background:"rgba(239,68,68,.2)",
                           color:"#FCA5A5",fontSize:10,fontWeight:700,animation:"glow 1s ease infinite alternate"}}>
                🔔 Addition demandée
              </div>
            )}
            {/* Encaisser direct */}
            {cart.length > 0 && (
              <button onClick={function(){ onPayDirect(table, session); }}
                style={{padding:"7px 14px",borderRadius:9,border:"none",
                        background:"linear-gradient(135deg,#C8953A,#a07228)",
                        color:"#1E0E05",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                💳 CHF {total.toFixed(2)}
              </button>
            )}
            {/* Mettre en attente (fermer) */}
            <button onClick={onClose}
              title="Mettre en attente"
              style={{padding:"6px 12px",borderRadius:8,border:"1px solid rgba(200,149,58,.3)",
                      background:"rgba(200,149,58,.1)",color:"#C8953A",fontSize:11,fontWeight:700,
                      cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4}}>
              ⏸ Attente
            </button>
          </div>
        </div>

        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {/* Catalogue */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid #EDE0D0"}}>
            <div style={{padding:"10px 12px 0",background:"#fff",borderBottom:"1px solid #EDE0D0",flexShrink:0}}>
              <input placeholder="🔍 Rechercher…" value={search} onChange={function(e){setSearch(e.target.value);}}
                style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1.5px solid #EDE0D0",
                        background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:7}}
                onFocus={function(e){e.target.style.borderColor="#C8953A";}}
                onBlur={function(e){e.target.style.borderColor="#EDE0D0";}} />
              <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:8}}>
                {CATS.map(function(c){
                  return (
                    <button key={c} onClick={function(){setCat(c);}}
                      style={{padding:"4px 11px",borderRadius:16,border:"none",cursor:"pointer",flexShrink:0,
                              background:cat===c?"#1E0E05":"#F7F3EE",color:cat===c?"#FDF8F0":"#5C4A32",
                              fontSize:11,fontWeight:cat===c?700:500,fontFamily:"'Outfit',sans-serif"}}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:10}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:8}}>
                {filtered.map(function(p){
                  var inCart = cart.find(function(i){return i.id===p.id;});
                  return (
                    <div key={p.id} className="pt" onClick={function(){addItem(p);}}
                      style={{background:"#fff",borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",
                              boxShadow:"0 2px 6px rgba(0,0,0,.05)",position:"relative",
                              border:"2px solid "+(inCart?"#C8953A":"transparent"),transition:"all .14s"}}>
                      {inCart && (
                        <div style={{position:"absolute",top:6,right:6,background:"#C8953A",color:"#1E0E05",
                                     borderRadius:"50%",width:18,height:18,fontSize:9,fontWeight:800,
                                     display:"flex",alignItems:"center",justifyContent:"center"}}>{inCart.qty}</div>
                      )}
                      <div style={{fontSize:28,marginBottom:5}}>{p.emoji}</div>
                      <div style={{fontSize:10,fontWeight:600,color:"#1E0E05",lineHeight:1.3,marginBottom:3}}>{p.name}</div>
                      <div style={{fontSize:12,fontWeight:800,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {p.price.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Détail commande table */}
          <div style={{width:240,display:"flex",flexDirection:"column",background:"#1E0E05",flexShrink:0}}>
            <div style={{padding:"12px 14px 8px",borderBottom:"1px solid rgba(255,255,255,.08)",flexShrink:0}}>
              <div style={{fontSize:11,color:"rgba(253,248,240,.4)",fontFamily:"'Outfit',sans-serif"}}>Commande en cours</div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
              {cart.length===0 ? (
                <div style={{textAlign:"center",color:"rgba(253,248,240,.2)",padding:"24px 0",fontSize:11}}>
                  <div style={{fontSize:24,marginBottom:6}}>🍽</div>Aucune commande
                </div>
              ) : cart.map(function(item){
                return (
                  <div key={item.id} style={{background:"rgba(255,255,255,.06)",borderRadius:8,padding:"7px 9px",
                                             marginBottom:5,display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:15}}>{item.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:"#FDF8F0",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      <div style={{fontSize:11,color:"#C8953A",fontWeight:700}}>CHF {(item.price*item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:3}}>
                      <button onClick={function(){setQty(item.id,item.qty-1);}}
                        style={{width:20,height:20,borderRadius:"50%",border:"1px solid rgba(255,255,255,.2)",
                                background:"transparent",color:"#FDF8F0",cursor:"pointer",fontSize:13,
                                display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{color:"#FDF8F0",fontSize:12,fontWeight:700,minWidth:14,textAlign:"center"}}>{item.qty}</span>
                      <button onClick={function(){setQty(item.id,item.qty+1);}}
                        style={{width:20,height:20,borderRadius:"50%",border:"1px solid rgba(200,149,58,.4)",
                                background:"rgba(200,149,58,.15)",color:"#C8953A",cursor:"pointer",fontSize:13,
                                display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {cart.length > 0 && (
              <div style={{padding:"10px 14px",borderTop:"1px solid rgba(255,255,255,.1)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontSize:11,color:"rgba(253,248,240,.4)"}}>Total</span>
                  <span style={{fontFamily:"'Outfit',sans-serif",color:"#C8953A",fontSize:22,fontWeight:800}}>
                    CHF {total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { FloorPlanEditor, FloorPlanView, TableCart };
