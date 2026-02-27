import { useState } from "react";

export default /* ─── PRICE ANALYSIS MODAL ────────────────────────────────────── */
function PriceAnalysisModal(props) {
  var prod    = props.prod;
  var onClose = props.onClose;
  const [period, setPeriod] = useState("semaine");

  var base  = prod.price;
  var cost  = prod.cost;
  var marge = base > 0 ? Math.round((base-cost)/base*100) : 0;

  var datasets = {
    semaine: [
      {label:"Lun",price:base-0.10,cost:cost+0.02},{label:"Mar",price:base-0.05,cost:cost},
      {label:"Mer",price:base,     cost:cost},      {label:"Jeu",price:base+0.05,cost:cost-0.01},
      {label:"Ven",price:base+0.10,cost:cost+0.01}, {label:"Sam",price:base+0.20,cost:cost+0.02},
      {label:"Dim",price:base+0.15,cost:cost},
    ],
    mois: Array.from({length:4},function(_,i){
      return {label:"S"+(i+1),price:parseFloat((base-0.15+i*0.08).toFixed(2)),cost:parseFloat((cost+i*0.01).toFixed(2))};
    }),
    annee: ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"].map(function(m,i){
      return {label:m,price:parseFloat((base-0.40+i*0.07).toFixed(2)),cost:parseFloat((cost+i*0.005).toFixed(2))};
    }),
  };

  var data   = datasets[period]||[];
  var maxP   = Math.max.apply(null,data.map(function(d){return d.price;}));
  var minC   = Math.min.apply(null,data.map(function(d){return d.cost;}));
  var graphH = 90, graphW = 240, n = data.length;
  function px(i){ return n>1 ? i*(graphW/(n-1)) : graphW/2; }
  function py(v,mn,mx){ return graphH-(v-mn)/((mx-mn)||1)*graphH; }

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.55)",
                 display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}
         onClick={onClose}>
      <div style={{background:"#fff",borderRadius:20,padding:24,maxWidth:390,width:"90%",
                   boxShadow:"0 24px 60px rgba(0,0,0,.25)",animation:"pinIn .25s ease"}}
           onClick={function(e){e.stopPropagation();}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontSize:22,marginBottom:2}}>{prod.emoji}</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700,color:"#1E0E05"}}>{prod.name}</div>
            <div style={{fontSize:11,color:"#8B7355"}}>Analyse des fluctuations de prix</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#8B7355",lineHeight:1,padding:0}}>×</button>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
          {[
            {l:"Prix vente",  v:"CHF "+base.toFixed(2), c:"#1E40AF",bg:"#DBEAFE"},
            {l:"Prix revient",v:"CHF "+cost.toFixed(2), c:"#065F46",bg:"#D1FAE5"},
            {l:"Marge",       v:marge+"%",              c:marge>=50?"#065F46":marge>=30?"#92400E":"#991B1B",bg:marge>=50?"#D1FAE5":marge>=30?"#FEF3C7":"#FEE2E2"},
          ].map(function(k){
            return (
              <div key={k.l} style={{background:k.bg,borderRadius:9,padding:"9px 10px",textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:700,color:k.c,fontFamily:"'Outfit',sans-serif"}}>{k.v}</div>
                <div style={{fontSize:9,color:k.c,textTransform:"uppercase",letterSpacing:.8}}>{k.l}</div>
              </div>
            );
          })}
        </div>

        {/* Période */}
        <div style={{display:"flex",gap:0,background:"#F7F3EE",borderRadius:8,padding:3,marginBottom:12,width:"fit-content"}}>
          {["semaine","mois","annee"].map(function(p){
            return (
              <button key={p} onClick={function(){ setPeriod(p); }}
                style={{padding:"5px 12px",borderRadius:6,border:"none",
                        background:period===p?"#1E0E05":"transparent",
                        color:period===p?"#FDF8F0":"#8B7355",fontSize:10,cursor:"pointer",
                        fontFamily:"'Outfit',sans-serif",fontWeight:period===p?600:400,textTransform:"capitalize"}}>
                {p.charAt(0).toUpperCase()+p.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Graphique SVG */}
        <div style={{background:"#F7F3EE",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
          <svg width="100%" viewBox={"0 0 "+(graphW+20)+" "+(graphH+20)} style={{overflow:"visible"}}>
            {[0,0.25,0.5,0.75,1].map(function(t){
              var y=t*graphH;
              return <line key={t} x1="10" y1={y} x2={graphW+10} y2={y} stroke="#EDE0D0" strokeWidth=".6"/>;
            })}
            <polyline points={data.map(function(d,i){ return (px(i)+10)+","+(py(d.price,minC,maxP)); }).join(" ")}
              fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
            <polyline points={data.map(function(d,i){ return (px(i)+10)+","+(py(d.cost,minC,maxP)); }).join(" ")}
              fill="none" stroke="#C8953A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4,3"/>
            {data.map(function(d,i){
              return <text key={i} x={px(i)+10} y={graphH+14} textAnchor="middle" fontSize="7" fill="#8B7355">{d.label}</text>;
            })}
          </svg>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:4}}>
            <span style={{fontSize:9,color:"#3B82F6",display:"flex",alignItems:"center",gap:3}}>
              <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#3B82F6" strokeWidth="2"/></svg>Prix vente
            </span>
            <span style={{fontSize:9,color:"#C8953A",display:"flex",alignItems:"center",gap:3}}>
              <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="#C8953A" strokeWidth="2" strokeDasharray="4,3"/></svg>Prix revient
            </span>
          </div>
        </div>

        {/* Recommandation */}
        {(function(){
          var msg,bg,c,icon;
          if (marge<30)       { icon="🚨"; bg="#FEE2E2"; c="#DC2626"; msg="Marge critique ("+marge+"%). Envisagez une hausse de prix ou une réduction du coût de revient."; }
          else if (marge<50)  { icon="⚠️"; bg="#FEF3C7"; c="#92400E"; msg="Marge correcte ("+marge+"%) mais perfectible. Un ajustement de +0.20 à +0.50 CHF améliorerait la rentabilité."; }
          else                { icon="✅"; bg="#D1FAE5"; c="#065F46"; msg="Excellente marge ("+marge+"%). Ce produit est l'un de vos piliers de rentabilité."; }
          return (
            <div style={{background:bg,borderRadius:10,padding:"11px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:c,marginBottom:2}}>Recommandation</div>
                <div style={{fontSize:11,color:c,lineHeight:1.5}}>{msg}</div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
