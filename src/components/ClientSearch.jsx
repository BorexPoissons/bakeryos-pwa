import { useState, useRef, useEffect } from "react";

export default function ClientSearch(props) {
  var value       = props.value || "";
  var onChange    = props.onChange;     // (name) => void
  var clients     = props.clients || [];
  var onSelect    = props.onSelect;    // (client) => void — select full client object
  var onAddNew    = props.onAddNew;    // (name) => void — create new client
  var placeholder = props.placeholder || "Nom du client…";

  const [open, setOpen]     = useState(false);
  const [focused, setFocused] = useState(false);
  var ref = useRef(null);

  // Close dropdown on outside click
  useEffect(function(){
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return function(){ document.removeEventListener("mousedown", handler); };
  }, []);

  var query = value.toLowerCase().trim();
  var matches = query.length >= 1
    ? clients.filter(function(c){
        return c.name.toLowerCase().indexOf(query) >= 0 ||
               (c.phone && c.phone.indexOf(query) >= 0) ||
               (c.email && c.email.toLowerCase().indexOf(query) >= 0);
      }).slice(0, 8)
    : [];

  var exactMatch = clients.some(function(c){ return c.name.toLowerCase() === query; });

  function selectClient(c) {
    onChange(c.name);
    if (onSelect) onSelect(c);
    setOpen(false);
  }

  return (
    <div ref={ref} style={{position:"relative",width:"100%"}}>
      <input
        value={value}
        onChange={function(e){ onChange(e.target.value); setOpen(true); }}
        onFocus={function(){ setFocused(true); setOpen(true); }}
        onBlur={function(){ setFocused(false); setTimeout(function(){ setOpen(false); }, 200); }}
        placeholder={placeholder}
        style={{width:"100%",padding:"8px 12px",borderRadius:8,
                border:"1px solid "+(focused?"#C8953A":"#EDE0D0"),
                fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",
                background:"#fff",color:"#1E0E05",boxSizing:"border-box",
                transition:"border-color .2s"}}
      />
      {open && query.length >= 1 && (matches.length > 0 || !exactMatch) && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:50,
                     background:"#fff",borderRadius:10,marginTop:4,
                     boxShadow:"0 12px 40px rgba(0,0,0,.15)",border:"1px solid #EDE0D0",
                     maxHeight:260,overflowY:"auto"}}>
          {matches.map(function(c, idx){
            return (
              <div key={c.id || idx}
                onMouseDown={function(e){ e.preventDefault(); selectClient(c); }}
                style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                        borderBottom: idx < matches.length - 1 ? "1px solid #f5f0eb" : "none",
                        transition:"background .15s"}}
                onMouseEnter={function(e){ e.currentTarget.style.background="rgba(200,149,58,.06)"; }}
                onMouseLeave={function(e){ e.currentTarget.style.background="transparent"; }}>
                <div style={{width:32,height:32,borderRadius:8,background:"rgba(200,149,58,.12)",
                             display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                  👤
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1E0E05",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {c.name}
                  </div>
                  <div style={{fontSize:10,color:"#8B7355"}}>
                    {c.phone || ""}{c.phone && c.email ? " · " : ""}{c.email || ""}
                    {c.totalOrders ? " · " + c.totalOrders + " commandes" : ""}
                  </div>
                </div>
              </div>
            );
          })}
          {!exactMatch && query.length >= 2 && onAddNew && (
            <div onMouseDown={function(e){ e.preventDefault(); onAddNew(value); setOpen(false); }}
              style={{padding:"8px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                      borderTop:"1px solid #EDE0D0",background:"rgba(200,149,58,.04)"}}
              onMouseEnter={function(e){ e.currentTarget.style.background="rgba(200,149,58,.12)"; }}
              onMouseLeave={function(e){ e.currentTarget.style.background="rgba(200,149,58,.04)"; }}>
              <div style={{width:32,height:32,borderRadius:8,background:"rgba(16,185,129,.12)",
                           display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                ➕
              </div>
              <div style={{fontSize:12,fontWeight:600,color:"#065F46"}}>
                Créer "{value}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
