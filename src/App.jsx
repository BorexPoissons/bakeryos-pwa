import { useState, useRef, useEffect, useCallback } from "react";
import { APP_VERSION, PRODUCTS, STORES, SM, ROLES, PERMS_DEF, defaultPerms, USERS0, O0, C0, SUBS0, RECIPES0, SALES0, GIFTS0 } from "./constants.js";
import { hm } from "./utils.js";
import { CSS } from "./styles.js";
import { usePrinter } from "./printer.js";
import PinModal from "./components/PinModal.jsx";
import LoginScreen from "./components/LoginScreen.jsx";
import Layout from "./components/Layout.jsx";
import Vendeuse from "./components/Vendeuse.jsx";
import Production from "./components/Production.jsx";
import Livreur from "./components/Livreur.jsx";
import Admin from "./components/Admin.jsx";

// ── LocalStorage helpers ──
var LS_PREFIX = "bakery_";
function lsGet(key, fallback) {
  try { var v = localStorage.getItem(LS_PREFIX+key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(LS_PREFIX+key, JSON.stringify(val)); } catch(e) {}
}

/* — Persistance de session pour mise à jour en douceur — */
var SESSION_KEY = "bakery_session_state";

function saveSessionState(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch(e) {}
}
function loadSessionState() {
  try {
    var raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      localStorage.removeItem(SESSION_KEY); // usage unique
      return JSON.parse(raw);
    }
  } catch(e) {}
  return null;
}

// ── Session persistence for SW updates ──
var _userApprovedUpdate = false;

function UpdateBanner(props) {
  var onUpdate     = props.onUpdate;
  var hasOpenWork  = props.hasOpenWork; // bool : tables ouvertes ou panier non vide
  var [show,       setShow]       = useState(false);
  var [swWaiting,  setSwWaiting]  = useState(null);
  var [dismissed,  setDismissed]  = useState(false);
  var [countdown,  setCountdown]  = useState(null); // secondes restantes

  // Détection mise à jour Service Worker
  useEffect(function(){
    if (!("serviceWorker" in navigator)) return;

    function checkUpdate(reg) {
      if (reg.waiting) {
        setSwWaiting(reg.waiting);
        setShow(true);
      }
    }

    navigator.serviceWorker.getRegistration().then(function(reg){
      if (!reg) return;
      checkUpdate(reg);

      reg.addEventListener("updatefound", function(){
        var newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", function(){
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setSwWaiting(newSW);
            setShow(true);
          }
        });
      });
    });

    // Vérifier périodiquement (toutes les 2 min)
    var interval = setInterval(function(){
      navigator.serviceWorker.getRegistration().then(function(reg){
        if (reg) { reg.update(); checkUpdate(reg); }
      });
    }, 120000);

    // IMPORTANT : reload UNIQUEMENT si l'utilisateur a approuvé
    // Sans ce flag, un SKIP_WAITING déclenché par un autre onglet
    // ou par le SW lui-même ferait un reload sauvage
    var refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if (_userApprovedUpdate && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
      // Si pas approuvé → on ignore silencieusement, la bannière reste affichée
    });

    return function(){ clearInterval(interval); };
  }, []);

  function doUpdate() {
    _userApprovedUpdate = true; // flag : maintenant le reload est autorisé
    onUpdate(); // sauvegarde la session
    if (swWaiting) {
      swWaiting.postMessage({ type: "SKIP_WAITING" });
      // Fallback si controllerchange ne se déclenche pas (ex: même SW)
      setTimeout(function(){
        if (!document.hidden) window.location.reload();
      }, 3000);
    } else {
      window.location.reload();
    }
  }

  function startCountdown() {
    setCountdown(5);
  }

  useEffect(function(){
    if (countdown === null) return;
    if (countdown <= 0) { doUpdate(); return; }
    var timer = setTimeout(function(){ setCountdown(countdown - 1); }, 1000);
    return function(){ clearTimeout(timer); };
  }, [countdown]);

  if (!show || dismissed) return null;

  return (
    <div style={{
      position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", zIndex:9999,
      background:"#1E0E05", borderRadius:16, padding:"12px 18px",
      boxShadow:"0 12px 40px rgba(0,0,0,.35)", border:"1px solid rgba(200,149,58,.3)",
      display:"flex", alignItems:"center", gap:12, maxWidth:480, width:"calc(100% - 32px)",
      animation:"fadeUp .35s ease", fontFamily:"'Outfit',sans-serif",
    }}>
      {/* Icône */}
      <div style={{width:38, height:38, borderRadius:10, background:"rgba(200,149,58,.15)",
                   display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0}}>
        🔄
      </div>

      {/* Texte */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{color:"#FDF8F0", fontSize:13, fontWeight:700, marginBottom:2}}>
          Nouvelle version disponible
        </div>
        <div style={{color:"rgba(253,248,240,.5)", fontSize:10, lineHeight:1.4}}>
          {hasOpenWork
            ? "Terminez vos tables/tickets en cours. Votre session sera sauvegardée."
            : "Aucune table ouverte — mise à jour prête."}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"flex", gap:6, flexShrink:0, alignItems:"center"}}>
        {countdown !== null ? (
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:"#C8953A", fontSize:12, fontWeight:700}}>
              {countdown}s…
            </div>
            <button onClick={function(){ setCountdown(null); }}
              style={{padding:"4px 8px", borderRadius:6, border:"1px solid rgba(239,68,68,.3)",
                      background:"rgba(239,68,68,.1)", color:"#FCA5A5", fontSize:10,
                      cursor:"pointer", fontFamily:"'Outfit',sans-serif"}}>
              Annuler
            </button>
          </div>
        ) : (
          <>
            <button onClick={function(){ setDismissed(true); }}
              style={{padding:"6px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,.12)",
                      background:"transparent", color:"rgba(253,248,240,.5)", fontSize:11,
                      cursor:"pointer", fontFamily:"'Outfit',sans-serif"}}>
              Plus tard
            </button>
            <button onClick={hasOpenWork ? startCountdown : doUpdate}
              style={{padding:"7px 14px", borderRadius:8, border:"none",
                      background:"linear-gradient(135deg,#C8953A,#a07228)",
                      color:"#1E0E05", fontSize:12, fontWeight:800,
                      cursor:"pointer", fontFamily:"'Outfit',sans-serif"}}>
              {hasOpenWork ? "⏳ Mettre à jour" : "✓ Installer"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}


export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users,       setUsers]       = useState(function(){
    var saved = lsGet("users", USERS0);
    // ── Migration: s'assurer que tous les onglets/features de defaultPerms sont présents ──
    return saved.map(function(u){
      if (!u.permissions) return u;
      var def = defaultPerms(u.role);
      var changed = false;
      // Ajouter les adminTabs manquants
      if (def.adminTabs && u.permissions.adminTabs) {
        def.adminTabs.forEach(function(tab){
          if (u.permissions.adminTabs.indexOf(tab) === -1) {
            u.permissions.adminTabs.push(tab);
            changed = true;
          }
        });
      }
      // Ajouter les features manquantes
      if (def.features && u.permissions.features) {
        def.features.forEach(function(feat){
          if (u.permissions.features.indexOf(feat) === -1) {
            u.permissions.features.push(feat);
            changed = true;
          }
        });
      }
      // Ajouter les screens manquants
      if (def.screens && u.permissions.screens) {
        def.screens.forEach(function(scr){
          if (u.permissions.screens.indexOf(scr) === -1) {
            u.permissions.screens.push(scr);
            changed = true;
          }
        });
      }
      return u;
    });
  });
  const [tenant,      setTenant]      = useState(function(){ return lsGet("tenant", "Boulangerie Maison Blanche"); });
  const [orders,      setOrders]      = useState(function(){ return lsGet("orders", O0); });
  const [chat,        setChat]        = useState(function(){ return lsGet("chat", C0); });
  const [chatOpen,    setChatOpen]    = useState(false);
  const [logoUrl,     setLogoUrl]     = useState(function(){ try{ return localStorage.getItem("bakery_logo") || null; }catch(e){ return null; } });
  const [seenCount,   setSeenCount]   = useState(0);
  const [catalogue,   setCatalogue]   = useState(function(){
    var saved = lsGet("catalogue", PRODUCTS.map(function(p){ return Object.assign({},p,{active:true,stock:0}); }));
    // Migration: ajouter tva si absente
    return saved.map(function(p){ if (p.tva===undefined) p.tva = (p.category==="Traiteur"?8.1:2.6); return p; });
  });
  const [sales,       setSales]       = useState(function(){ return lsGet("sales", SALES0); });
  // Tables par magasin : { [store]: [{id,name,x,y,shape,seats}] }
  const [tableLayouts, setTableLayouts] = useState(function(){ return lsGet("tableLayouts", {}); });
  // Sessions de tables ouvertes : { [store_tableId]: {cart,openedAt,status} }
  const [tableSessions, setTableSessions] = useState(function(){ return lsGet("tableSessions", {}); });
  const [giftCards,     setGiftCards]     = useState(function(){ return lsGet("giftCards", GIFTS0); });
  const [subscriptions, setSubscriptions] = useState(function(){ return lsGet("subscriptions", SUBS0); });
  const [recipes,       setRecipes]       = useState(function(){ return lsGet("recipes", RECIPES0); });
  // Session restaurée après mise à jour
  const [showRestored,    setShowRestored]    = useState(false);
  // PWA install prompt
  const [installPrompt,   setInstallPrompt]   = useState(null);
  const [isInstalled,     setIsInstalled]     = useState(false);

  // ── Printer (ESC/POS + fallback) ──
  var printer = usePrinter();

  // ── Capturer beforeinstallprompt ──
  useEffect(function(){
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
      setIsInstalled(true);
      return;
    }
    function onPrompt(e) {
      e.preventDefault();
      setInstallPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", function(){ setIsInstalled(true); setInstallPrompt(null); });
    return function(){ window.removeEventListener("beforeinstallprompt", onPrompt); };
  }, []);

  // ── Vérifier si on revient d'une mise à jour SW ──
  useEffect(function(){
    var saved = loadSessionState();
    if (saved) {
      setShowRestored(true);
      setTimeout(function(){ setShowRestored(false); }, 5000);
    }
  }, []);

  function addSale(sale) { setSales(function(prev){ return [sale].concat(prev); }); }

  // ── Persist all data to localStorage ──
  useEffect(function(){ lsSet("tenant", tenant); }, [tenant]);
  useEffect(function(){ lsSet("users", users); }, [users]);
  useEffect(function(){ lsSet("orders", orders); }, [orders]);
  useEffect(function(){ lsSet("chat", chat); }, [chat]);
  useEffect(function(){ lsSet("catalogue", catalogue); }, [catalogue]);
  useEffect(function(){ lsSet("sales", sales); }, [sales]);
  useEffect(function(){ lsSet("tableLayouts", tableLayouts); }, [tableLayouts]);
  useEffect(function(){ lsSet("tableSessions", tableSessions); }, [tableSessions]);
  useEffect(function(){ lsSet("giftCards", giftCards); }, [giftCards]);
  useEffect(function(){ lsSet("subscriptions", subscriptions); }, [subscriptions]);
  useEffect(function(){ lsSet("recipes", recipes); }, [recipes]);

  function addGiftCard(card) { setGiftCards(function(prev){ return [card].concat(prev); }); }
  function useGiftCard(code, amount) {
    setGiftCards(function(prev){
      return prev.map(function(c){
        if (c.code !== code) return c;
        var newBal = Math.max(0, c.balance - amount);
        var entry = { date: new Date().toLocaleDateString("fr-CH"), time: hm(), amount: amount, balance: newBal };
        return Object.assign({}, c, { balance: newBal, status: newBal <= 0 ? "epuise" : "active",
          history: (c.history||[]).concat([entry]) });
      });
    });
  }
  useEffect(function(){
    try{
      if (logoUrl) localStorage.setItem("bakery_logo", logoUrl);
      else         localStorage.removeItem("bakery_logo");
    }catch(e){}
  }, [logoUrl]);

  var role        = currentUser ? currentUser.role        : null;
  var userStore   = currentUser ? currentUser.store       : null;
  var userName    = currentUser ? currentUser.nom         : null;
  var permissions = currentUser ? (currentUser.permissions || defaultPerms(currentUser.role)) : { screens:[], adminTabs:[], features:[] };

  // viewRole = vue actuellement affichée (admin peut switcher entre toutes les vues)
  const [viewRole, setViewRole] = useState(null);
  var displayRole = viewRole || role;
  // Reset viewRole si on se déconnecte/reconnecte
  useEffect(function(){ setViewRole(null); }, [currentUser]);

  function updOrder(id, patch) {
    setOrders(prev => prev.map(o => o.id === id ? Object.assign({}, o, patch) : o));
  }
  function addOrder(o) {
    setOrders(prev => [o].concat(prev));
  }
  function sendMsg(text, ord, mod, mention) {
    var from = role === "production" ? "Production centrale"
             : role === "admin"      ? "Admin"
             : role === "gerant"     ? (userStore || "Gérant")
             : role === "livreur"    ? (userName || "Livreur")
             : (userStore || userName || "Vendeuse");
    setChat(prev => prev.concat([{ id: Date.now(), role: role, from: from, text: text, t: hm(), ord: ord || null, mod: !!mod, mention: mention || null }]));
  }

  var otherMsgs = chat.filter(function(m){ return m.role !== role; }).length;
  var unread    = Math.max(0, otherMsgs - seenCount);

  // ── Détection travail en cours (tables ouvertes, panier) ──
  var hasOpenWork = Object.keys(tableSessions).some(function(k){
    var s = tableSessions[k];
    return s && s.cart && s.cart.length > 0;
  });

  // ── Sauvegarde session avant mise à jour ──
  var handlePreUpdate = useCallback(function(){
    saveSessionState({
      tableSessions: tableSessions,
      tableLayouts:  tableLayouts,
      orders:        orders,
      sales:         sales,
      catalogue:     catalogue,
      savedAt:       new Date().toISOString(),
      version:       APP_VERSION,
      user:          currentUser ? { login: currentUser.login, store: currentUser.store } : null,
    });
  }, [tableSessions, tableLayouts, orders, sales, catalogue, currentUser]);

  if (!currentUser) {
    return (
      <>
        <style>{CSS}</style>
        <LoginScreen
          logoUrl={logoUrl}
          users={users}
          onLogin={function(user){ setCurrentUser(user); }}
          installPrompt={installPrompt}
          isInstalled={isInstalled}
        />
        {showRestored && (
          <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,
                       background:"#065F46",borderRadius:12,padding:"10px 18px",
                       boxShadow:"0 8px 30px rgba(0,0,0,.25)",color:"#D1FAE5",fontSize:12,fontWeight:600,
                       fontFamily:"'Outfit',sans-serif",animation:"fadeUp .35s ease",
                       display:"flex",alignItems:"center",gap:8}}>
            ✅ Session restaurée — connectez-vous pour reprendre
          </div>
        )}
        <UpdateBanner onUpdate={handlePreUpdate} hasOpenWork={hasOpenWork} />
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <Layout role={role} viewRole={displayRole} tenant={tenant} orders={orders} unread={unread} logoUrl={logoUrl} userStore={userStore} permissions={permissions}
              userName={userName} chat={chat} sendMsg={sendMsg}
              markRead={function(){ setSeenCount(otherMsgs); }}
              goRole={function(r){ setViewRole(r); }}
              onLogout={function(){ setCurrentUser(null); setChatOpen(false); setSeenCount(0); }}>
        {displayRole === "vendeuse"   && <Vendeuse   orders={orders} addOrder={addOrder} updOrder={updOrder} sendMsg={sendMsg} userStore={userStore} userName={userName} catalogue={catalogue} sales={sales} addSale={addSale} chat={chat} tableLayouts={tableLayouts} tableSessions={tableSessions} setTableSessions={setTableSessions} tenant={tenant} giftCards={giftCards} addGiftCard={addGiftCard} useGiftCard={useGiftCard} printer={printer} />}
        {displayRole === "production" && <Production orders={orders} updOrder={updOrder} chat={chat} sendMsg={sendMsg} recipes={recipes} catalogue={catalogue} printer={printer} />}
        {displayRole === "livreur"    && <Livreur    orders={orders} updOrder={updOrder} userStore={userStore} currentUser={currentUser} />}
        {(displayRole === "admin" || displayRole === "gerant" || (role==="admin" && !viewRole)) && (
          <Admin
            orders={orders} updOrder={updOrder} addOrder={addOrder}
            logoUrl={logoUrl} setLogoUrl={setLogoUrl}
            tenant={tenant}  setTenant={setTenant}
            catalogue={catalogue} setCatalogue={setCatalogue}
            sales={sales} setSales={setSales}
            tableLayouts={tableLayouts} setTableLayouts={setTableLayouts}
            userStore={role==="admin"?null:userStore}
            users={users} setUsers={setUsers}
            permissions={permissions}
            giftCards={giftCards} setGiftCards={setGiftCards}
            subscriptions={subscriptions} setSubscriptions={setSubscriptions}
            recipes={recipes} setRecipes={setRecipes}
            printer={printer}
          />
        )}
      </Layout>
      {/* Notification session restaurée */}
      {showRestored && (
        <div style={{position:"fixed",bottom:70,left:"50%",transform:"translateX(-50%)",zIndex:9998,
                     background:"#065F46",borderRadius:12,padding:"10px 18px",
                     boxShadow:"0 8px 30px rgba(0,0,0,.25)",color:"#D1FAE5",fontSize:12,fontWeight:600,
                     fontFamily:"'Outfit',sans-serif",animation:"fadeUp .35s ease",
                     display:"flex",alignItems:"center",gap:8}}>
          ✅ Mise à jour installée — session restaurée
          <button onClick={function(){ setShowRestored(false); }}
            style={{background:"transparent",border:"none",color:"#A7F3D0",cursor:"pointer",fontSize:14,marginLeft:4}}>✕</button>
        </div>
      )}
      {/* Banner mise à jour */}
      <UpdateBanner onUpdate={handlePreUpdate} hasOpenWork={hasOpenWork} />
    </>
  );
}
