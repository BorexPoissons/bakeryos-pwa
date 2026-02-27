import { useState, useEffect } from "react";
import { APP_VERSION, ROLES } from "../constants.js";

export default function LoginScreen(props) {
  var logoUrl        = props.logoUrl;
  var users          = props.users;
  var onLogin        = props.onLogin;
  var installPrompt  = props.installPrompt  || null;
  var isInstalled    = props.isInstalled     || false;

  const [login,   setLogin]   = useState("");
  const [pass,    setPass]    = useState("");
  const [err,     setErr]     = useState("");
  const [vis,     setVis]     = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(function(){ var t = setTimeout(function(){ setVis(true); }, 60); return function(){ clearTimeout(t); }; }, []);

  function handleInstall() {
    if (!installPrompt) return;
    setInstalling(true);
    installPrompt.prompt();
    installPrompt.userChoice.then(function(result){
      setInstalling(false);
    });
  }

  function handleSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!login || !pass) { setErr("Remplissez les deux champs."); return; }
    setLoading(true);
    setTimeout(function(){
      var user = users.find(function(u){ return u.login.toLowerCase()===login.toLowerCase() && u.password===pass && u.actif; });
      if (user) {
        setErr("");
        onLogin(user);
      } else {
        setErr("Identifiant ou mot de passe incorrect.");
        setLoading(false);
      }
    }, 500);
  }

  var ROLE_LABELS = {
    admin:"Administrateur", gerant:"Gérant(e)", vendeuse:"Vendeuse",
    production:"Production", livreur:"Livreur"
  };

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#140701,#2d1308,#140701)",
                 display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      {/* Cercles décoratifs */}
      {[1,2,3,4].map(function(i){
        return <div key={i} style={{position:"absolute",borderRadius:"50%",width:i*160+"px",height:i*160+"px",
                                    border:"1px solid rgba(200,149,58,.06)",top:"50%",left:"50%",
                                    transform:"translate(-50%,-50%)",animation:"glow "+(2+i*.4)+"s ease-in-out infinite alternate"}} />;
      })}

      <div style={{position:"relative",zIndex:10,textAlign:"center",maxWidth:400,width:"100%",padding:"0 20px",
                   opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(24px)",transition:"all .55s ease"}}>

        {/* Logo (affichage seul — modifiable uniquement par Admin) */}
        <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{width:84,height:84,borderRadius:20,objectFit:"cover",boxShadow:"0 8px 24px rgba(0,0,0,.35)"}} />
            : <div style={{width:84,height:84,borderRadius:20,background:"rgba(255,255,255,.05)",border:"1px solid rgba(200,149,58,.18)",
                           display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🥐</div>}
        </div>

        <h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:48,fontWeight:700,color:"#FDF8F0",margin:"0 0 3px",letterSpacing:-1}}>BakeryOS</h1>
        <p style={{color:"rgba(253,248,240,.35)",fontSize:10,marginBottom:30,letterSpacing:3,textTransform:"uppercase"}}>Gestion artisans boulangers</p>

        {/* Carte formulaire */}
        <div style={{background:"rgba(255,255,255,.05)",backdropFilter:"blur(12px)",border:"1px solid rgba(200,149,58,.18)",
                     borderRadius:18,padding:"28px 24px",boxShadow:"0 20px 60px rgba(0,0,0,.4)",textAlign:"left"}}>

          <div style={{marginBottom:20}}>
            <label style={{fontSize:10,color:"rgba(253,248,240,.4)",textTransform:"uppercase",letterSpacing:1.2,display:"block",marginBottom:7}}>
              Identifiant
            </label>
            <div style={{position:"relative"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,149,58,.6)" strokeWidth="2" strokeLinecap="round"
                style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                value={login}
                onChange={function(e){ setLogin(e.target.value); setErr(""); }}
                onKeyDown={function(e){ if(e.key==="Enter") handleSubmit(); }}
                placeholder="ex: sophie"
                autoComplete="username"
                style={{width:"100%",padding:"11px 14px 11px 36px",borderRadius:10,
                        border:"1px solid "+(err?"rgba(239,68,68,.5)":"rgba(200,149,58,.2)"),
                        background:"rgba(255,255,255,.06)",color:"#FDF8F0",fontSize:13,outline:"none",
                        fontFamily:"'Outfit',sans-serif",transition:"border-color .15s",boxSizing:"border-box"}} />
            </div>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{fontSize:10,color:"rgba(253,248,240,.4)",textTransform:"uppercase",letterSpacing:1.2,display:"block",marginBottom:7}}>
              Mot de passe
            </label>
            <div style={{position:"relative"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,149,58,.6)" strokeWidth="2" strokeLinecap="round"
                style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                type={showPw?"text":"password"}
                value={pass}
                onChange={function(e){ setPass(e.target.value); setErr(""); }}
                onKeyDown={function(e){ if(e.key==="Enter") handleSubmit(); }}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{width:"100%",padding:"11px 42px 11px 36px",borderRadius:10,
                        border:"1px solid "+(err?"rgba(239,68,68,.5)":"rgba(200,149,58,.2)"),
                        background:"rgba(255,255,255,.06)",color:"#FDF8F0",fontSize:13,outline:"none",
                        fontFamily:"'Outfit',sans-serif",transition:"border-color .15s",boxSizing:"border-box"}} />
              <button onClick={function(){ setShowPw(function(v){ return !v; }); }}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",
                        cursor:"pointer",color:"rgba(200,149,58,.5)",padding:0,lineHeight:1}}>
                {showPw
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          {err && (
            <div style={{background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,
                         padding:"8px 12px",marginBottom:14,fontSize:11,color:"#FCA5A5",display:"flex",alignItems:"center",gap:7}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {err}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{width:"100%",padding:"13px",background:loading?"rgba(255,255,255,.08)":"linear-gradient(135deg,#C8953A,#a07228)",
                    border:"none",borderRadius:11,
                    color:loading?"rgba(255,255,255,.3)":"#1a0a02",
                    fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",
                    fontFamily:"'Outfit',sans-serif",transition:"all .18s",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading
              ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:14}}>⟳</span> Connexion…</>
              : "Se connecter →"}
          </button>
        </div>

        {/* Bouton installer PWA */}
        {installPrompt && !isInstalled && (
          <button onClick={handleInstall} disabled={installing}
            style={{
              marginTop:16, padding:"10px 22px", borderRadius:12,
              border:"1px solid rgba(200,149,58,.25)",
              background:"rgba(200,149,58,.08)", backdropFilter:"blur(8px)",
              color:"#C8953A", fontSize:12, fontWeight:700,
              cursor:installing?"not-allowed":"pointer",
              fontFamily:"'Outfit',sans-serif", transition:"all .18s",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              width:"100%", maxWidth:400,
            }}
            onMouseOver={function(e){ e.currentTarget.style.background="rgba(200,149,58,.15)"; }}
            onMouseOut={function(e){ e.currentTarget.style.background="rgba(200,149,58,.08)"; }}>
            {installing ? (
              <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Installation…</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Installer l'application
              </>
            )}
          </button>
        )}
        {isInstalled && (
          <div style={{marginTop:14,fontSize:10,color:"rgba(16,185,129,.6)",display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>
            <span>✓</span> Application installée
          </div>
        )}

        <p style={{color:"rgba(253,248,240,.18)",fontSize:10,marginTop:isInstalled?8:16,textAlign:"center"}}>
          Accès restreint · Géré par l'administrateur · v{APP_VERSION}
        </p>
      </div>
    </div>
  );
}
