import { useState } from "react";
import { hm } from "../utils.js";

export default function WasteModal(props) {
  var catalogue  = props.catalogue || [];
  var onSave     = props.onSave;       // (wasteEntry) => void
  var onClose    = props.onClose;
  var storeName  = props.storeName || "";
  var userName   = props.userName || "";

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("invendu"); // invendu | casse | perime | autre

  var activeProd = catalogue.filter(function(p){ return p.active; });
  var filtered = search.trim()
    ? activeProd.filter(function(p){ return p.name.toLowerCase().indexOf(search.toLowerCase()) >= 0; })
    : activeProd;

  function addItem(p) {
    setItems(function(prev){
      var ex = prev.find(function(i){ return i.id === p.id; });
      if (ex) return prev.map(function(i){ return i.id === p.id ? Object.assign({}, i, { qty: i.qty + 1 }) : i; });
      return prev.concat([{ id: p.id, name: p.name, emoji: p.emoji, price: p.cost || p.price, qty: 1, category: p.category }]);
    });
    setSearch("");
  }

  function setQty(id, qty) {
    if (qty <= 0) { setItems(function(prev){ return prev.filter(function(i){ return i.id !== id; }); }); return; }
    setItems(function(prev){ return prev.map(function(i){ return i.id === id ? Object.assign({}, i, { qty: qty }) : i; }); });
  }

  function removeItem(id) {
    setItems(function(prev){ return prev.filter(function(i){ return i.id !== id; }); });
  }

  var totalLoss = items.reduce(function(s, i){ return s + i.price * i.qty; }, 0);

  function save() {
    var entry = {
      id:     "PRT-" + Date.now(),
      date:   new Date().toLocaleDateString("fr-CH"),
      time:   hm(),
      store:  storeName,
      seller: userName,
      reason: reason,
      items:  items.slice(),
      totalLoss: Math.round(totalLoss * 100) / 100,
    };
    onSave(entry);
    onClose();
  }

  var REASONS = [
    { id: "invendu", label: "🍞 Invendu", color: "#F59E0B" },
    { id: "casse",   label: "💥 Cassé/abîmé", color: "#EF4444" },
    { id: "perime",  label: "⏰ Périmé", color: "#8B5CF6" },
    { id: "autre",   label: "📝 Autre", color: "#6B7280" },
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"auto",
                   boxShadow:"0 32px 80px rgba(0,0,0,.35)",animation:"pinIn .25s ease"}}>
        {/* Header */}
        <div style={{background:"#1E0E05",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"rgba(253,248,240,.6)",fontSize:11}}>Saisie des pertes</div>
            <div style={{color:"#FCA5A5",fontSize:24,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>
              − CHF {totalLoss.toFixed(2)}
            </div>
            <div style={{color:"rgba(253,248,240,.4)",fontSize:10}}>{items.length} article{items.length>1?"s":""}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",
                  width:36,height:36,color:"rgba(253,248,240,.5)",fontSize:18,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>

        {/* Raison */}
        <div style={{padding:"12px 22px",display:"flex",gap:6,flexWrap:"wrap"}}>
          {REASONS.map(function(r){
            return (
              <button key={r.id} onClick={function(){ setReason(r.id); }}
                style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(reason===r.id?r.color:"#EDE0D0"),
                        background:reason===r.id?"rgba(200,149,58,.08)":"#fff",
                        fontSize:11,fontWeight:reason===r.id?700:500,cursor:"pointer",
                        fontFamily:"'Outfit',sans-serif",color:reason===r.id?r.color:"#5C4A32"}}>
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Recherche produit */}
        <div style={{padding:"0 22px 8px"}}>
          <input value={search} onChange={function(e){ setSearch(e.target.value); }}
            placeholder="Rechercher un produit…"
            style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #EDE0D0",
                    fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}} />
        </div>

        {/* Grille produits rapide */}
        {search.trim() && (
          <div style={{padding:"0 22px 8px",display:"flex",flexWrap:"wrap",gap:6}}>
            {filtered.slice(0, 12).map(function(p){
              return (
                <button key={p.id} onClick={function(){ addItem(p); }}
                  style={{padding:"6px 10px",borderRadius:8,border:"1px solid #EDE0D0",background:"#fff",
                          fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4}}>
                  <span>{p.emoji}</span> {p.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Articles en perte */}
        <div style={{padding:"8px 22px",minHeight:80}}>
          {items.length === 0 && (
            <div style={{textAlign:"center",padding:"20px 0",color:"#C4B5A5",fontSize:12}}>
              Recherchez et ajoutez les produits perdus
            </div>
          )}
          {items.map(function(item){
            return (
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",
                                         borderBottom:"1px solid #f5f0eb"}}>
                <span style={{fontSize:16}}>{item.emoji || "📦"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>{item.name}</div>
                  <div style={{fontSize:10,color:"#8B7355"}}>Coût: CHF {item.price.toFixed(2)}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button onClick={function(){ setQty(item.id, item.qty - 1); }}
                    style={{width:24,height:24,borderRadius:6,border:"1px solid #EDE0D0",background:"#fff",fontSize:12,cursor:"pointer"}}>−</button>
                  <span style={{fontSize:12,fontWeight:700,minWidth:20,textAlign:"center"}}>{item.qty}</span>
                  <button onClick={function(){ setQty(item.id, item.qty + 1); }}
                    style={{width:24,height:24,borderRadius:6,border:"none",background:"#1E0E05",color:"#C8953A",fontSize:12,cursor:"pointer"}}>+</button>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:"#DC2626",minWidth:55,textAlign:"right"}}>
                  −{(item.price * item.qty).toFixed(2)}
                </div>
                <button onClick={function(){ removeItem(item.id); }}
                  style={{background:"none",border:"none",color:"#EF4444",fontSize:14,cursor:"pointer",padding:2}}>✕</button>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{padding:"12px 22px 20px",borderTop:"1px solid #EDE0D0",display:"flex",gap:10,justifyContent:"flex-end",
                     position:"sticky",bottom:0,background:"#fff"}}>
          <button onClick={onClose}
            style={{padding:"10px 20px",borderRadius:10,border:"1px solid #EDE0D0",background:"#fff",
                    fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#5C4A32"}}>
            Annuler
          </button>
          <button onClick={save} disabled={items.length === 0}
            style={{padding:"10px 24px",borderRadius:10,border:"none",
                    background: items.length === 0 ? "#ccc" : "#DC2626",
                    color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Enregistrer les pertes
          </button>
        </div>
      </div>
    </div>
  );
}
