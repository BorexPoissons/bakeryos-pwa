import { useState, useRef, useEffect } from "react";
import { PRODUCTS, STORES, CATS, SM, ROLES, DRIVERS, PERMS_DEF, defaultPerms, GIFTS0, SUBS0, RECIPES0 } from "../constants.js";
import { hm, computeTVA, generateGiftCode, qrUrl } from "../utils.js";
import { PrinterService, PAPER } from "../printer.js";
import EditModal from "./EditModal.jsx";
import { FloorPlanEditor } from "./FloorPlan.jsx";
import PriceAnalysisModal from "./PriceAnalysisModal.jsx";

export default function Admin(props) {
  var orders     = props.orders;
  var updOrder   = props.updOrder;
  var logoUrl    = props.logoUrl;
  var setLogoUrl = props.setLogoUrl;
  var setTenant  = props.setTenant   || function(){};
  var tenant     = props.tenant      || "BakeryOS";
  var userStore  = props.userStore;  // null = superadmin, string = gérant
  var addOrder   = props.addOrder;
  var users       = props.users        || [];
  var setUsers    = props.setUsers     || function(){};
  var tableLayouts    = props.tableLayouts    || {};
  var setTableLayouts = props.setTableLayouts || function(){};
  var permissions = props.permissions  || defaultPerms(userStore ? "gerant" : "admin");
  var catalogue   = props.catalogue   || [];
  var sales       = props.sales       || [];
  var setSales    = props.setSales    || function(){};
  var giftCards   = props.giftCards   || [];
  var setGiftCards= props.setGiftCards|| function(){};
  var subscriptions  = props.subscriptions  || [];
  var setSubscriptions = props.setSubscriptions || function(){};
  var recipes        = props.recipes        || [];
  var setRecipes     = props.setRecipes     || function(){};
  var printer        = props.printer        || {};
  var waste          = props.waste          || [];
  var addWaste       = props.addWaste       || function(){};
  var refunds        = props.refunds        || [];
  var clients        = props.clients        || [];
  var setClients     = props.setClients     || function(){};
  var tvaNumber      = props.tvaNumber      || "";
  var setTvaNumber   = props.setTvaNumber   || function(){};

  function loadDemoData(){
    var ds = _buildSales();
    setSales(ds);
    setGiftCards(GIFTS0.map(function(g){ return Object.assign({},g); }));
    setSavedMsg("✅ "+ds.length+" ventes + "+GIFTS0.length+" cartes cadeaux démo chargées");
    setTimeout(function(){ setSavedMsg(""); },3000);
  }
  var isGerant    = !!userStore;
  var allowedTabs = permissions.adminTabs || [];
  var canCreateOrder  = permissions.features && permissions.features.indexOf("create_order") !== -1;
  var canEditCatalogue= permissions.features && permissions.features.indexOf("edit_catalogue") !== -1;
  var canViewCost     = permissions.features && permissions.features.indexOf("view_cost") !== -1;
  var canEditLogo     = permissions.features && permissions.features.indexOf("edit_logo") !== -1;
  var canManageStaff  = permissions.features && permissions.features.indexOf("manage_staff") !== -1;
  var canExportData   = permissions.features && permissions.features.indexOf("export_data") !== -1;
  var canManageSubs   = permissions.features && permissions.features.indexOf("manage_subscriptions") !== -1;
  var canManageRecipes= permissions.features && permissions.features.indexOf("manage_recipes") !== -1;
  var canManagePrinter= permissions.features && permissions.features.indexOf("manage_printer") !== -1;

  const [adminTab,   setAdminTab]   = useState("dashboard");
  const [selO,       setSelO]       = useState(null);
  const [flt,        setFlt]        = useState("all");
  const [storeFilter,setStoreFilter] = useState(userStore || "all");
  const [showNewOrder,setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    client:"", dMethod:"sur_place", destStore:"", destAddr:"", driver:"Non assigné",
    items:[], priority:"normal", note:""
  });

  // Gestion utilisateurs
  const [editUser,    setEditUser]    = useState(null);  // user en édition
  const [showAddUser, setShowAddUser] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // id user à supprimer
  const [expandedTicket, setExpandedTicket] = useState(null); // ticket déplié en supervision
  const [newUser, setNewUser] = useState({login:"",password:"",nom:"",role:"vendeuse",store:"",actif:true,permissions:defaultPerms("vendeuse")});

  // Abonnements
  const [editSub, setEditSub]     = useState(null);   // subscription en édition
  const [showAddSub, setShowAddSub] = useState(false);
  const [confirmDeleteSub, setConfirmDeleteSub] = useState(null);
  const [subFormData, setSubFormData] = useState(null);   // form data in progress
  const [subFormSearch, setSubFormSearch] = useState("");  // product search in form
  var FREQ_OPTS = [{id:"daily",label:"Quotidien"},{id:"weekly",label:"Hebdomadaire"},{id:"monthly",label:"Mensuel"}];
  var DAY_NAMES = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
  var emptySub = {client:"",phone:"",items:[],store:STORES[0],dMethod:"livreur",dest:"",driver:"Non assigné",note:"",frequency:"weekly",days:[1,2,3,4,5],deliveryTime:"07:00",startDate:new Date().toISOString().slice(0,10),endDate:"",active:true};
  var DIFF_OPTS = [{id:"facile",label:"Facile",color:"#10B981"},{id:"moyen",label:"Moyen",color:"#F59E0B"},{id:"avancé",label:"Avancé",color:"#EF4444"}];
  const [viewRecipe, setViewRecipe] = useState(null);    // recipe to view/edit
  const [editRecipe, setEditRecipe] = useState(null);    // recipe being edited (form data)
  const [reportPeriod, setReportPeriod] = useState("mois");
  const [reportCustomFrom, setReportCustomFrom] = useState("");
  const [reportCustomTo, setReportCustomTo] = useState("");

  // Helpers abonnements
  function todayStr(){ return new Date().toISOString().slice(0,10); }
  function todayDow(){ return new Date().getDay(); } // 0=dim
  function isDueToday(sub){
    if (!sub.active) return false;
    var today = todayStr();
    if (sub.startDate && today < sub.startDate) return false;
    if (sub.endDate && today > sub.endDate) return false;
    if (sub.lastGenerated === today) return false;
    var dow = todayDow();
    if (sub.frequency === "daily") return sub.days.indexOf(dow) !== -1;
    if (sub.frequency === "weekly") return sub.days.indexOf(dow) !== -1;
    if (sub.frequency === "monthly") {
      var dom = new Date().getDate();
      return sub.days.indexOf(dom) !== -1;
    }
    return false;
  }
  function generateSubOrders(subsToGen){
    var generated = [];
    var ts = Date.now();
    subsToGen.forEach(function(sub, idx){
      var cmdId = "CMD-ABO-" + (ts + idx);
      var cmd = {
        id: cmdId, client: sub.client, store: sub.store, note: sub.note ? "🔄 " + sub.note : "🔄 Commande récurrente",
        status: "attente", priority: "normal", modReq: false,
        items: sub.items.map(function(i){ return {id:i.id,name:i.name,qty:i.qty,price:i.price}; }),
        time: sub.deliveryTime || hm(), total: sub.total,
        dMethod: sub.dMethod === "livreur" ? "livreur" : sub.dMethod === "retrait" ? "retrait" : null,
        dest: sub.dest || null, driver: sub.driver && sub.driver !== "Non assigné" ? sub.driver : null,
        source: "abo", aboId: sub.id,
      };
      addOrder(cmd);
      generated.push({subId: sub.id, cmdId: cmdId});
    });
    // Mark as generated today
    setSubscriptions(function(prev){
      return prev.map(function(s){
        var match = generated.find(function(g){ return g.subId === s.id; });
        return match ? Object.assign({}, s, {lastGenerated: todayStr()}) : s;
      });
    });
    return generated;
  }

  // Subscriptions due today
  var subsDueToday = subscriptions.filter(isDueToday);
  var subsFilteredByStore = storeFilter === "all" ? subscriptions : subscriptions.filter(function(s){ return s.store === storeFilter; });

  const ROLE_OPTS = [
    {id:"admin",      label:"Admin",        icon:"📊"},
    {id:"gerant",     label:"Gérant(e)",    icon:"🏪"},
    {id:"vendeuse",   label:"Vendeuse",     icon:"🛒"},
    {id:"production", label:"Production",   icon:"👨‍🍳"},
    {id:"livreur",    label:"Livreur",      icon:"🚐"},
  ];
  function saveUser(updated) {
    setUsers(function(prev){ return prev.map(function(u){ return u.id===updated.id ? updated : u; }); });
    setEditUser(null);
    setSavedMsg("✅ Utilisateur sauvegardé"); setTimeout(function(){ setSavedMsg(""); }, 2200);
  }
  function addUser() {
    if (!newUser.login || !newUser.password || !newUser.nom) return;
    var maxId = users.reduce(function(m,u){ return Math.max(m,u.id); }, 0);
    setUsers(function(prev){ return prev.concat([Object.assign({id:maxId+1},newUser,{actif:true})]); });
    setNewUser({login:"",password:"",nom:"",role:"vendeuse",store:"",actif:true,permissions:defaultPerms("vendeuse")});
    setShowAddUser(false);
    setSavedMsg("✅ Utilisateur créé"); setTimeout(function(){ setSavedMsg(""); }, 2200);
  }
  function toggleUserActif(id) {
    setUsers(function(prev){ return prev.map(function(u){ return u.id===id ? Object.assign({},u,{actif:!u.actif}) : u; }); });
  }
  function deleteUser(id) {
    setUsers(function(prev){ return prev.filter(function(u){ return u.id!==id; }); });
  }

  // Catalogue — partagé depuis App via props
  var catalogue    = props.catalogue    || PRODUCTS.map(function(p){ return Object.assign({},p,{active:true}); });
  var setCatalogue = props.setCatalogue || function(){};
  var sales        = props.sales        || [];
  const [editProd,  setEditProd]  = useState(null);
  const [showNew,   setShowNew]   = useState(false);
  const [newP, setNewP] = useState({name:"",price:"",category:"Viennoiseries",emoji:"🍞",stock:"",tva:"2.6"});
  const [savedMsg, setSavedMsg] = useState("");
  const [analyseProd, setAnalyseProd] = useState(null);

  // Gestion state
  const ROLES_METIER = ["Gérant(e)","Chef de production","Chef de service","Responsable livraison","Vendeur/Vendeuse"];
  const DAYS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const [stores, setStores] = useState([
    {
      id:1, name:"Boulangerie Maison Blanche – Rue du Four",
      shortName:"Rue du Four 12",
      address:"Rue du Four 12", city:"Paris 75006", phone:"01 42 33 11 22",
      email:"rufour@maisonblanche.fr",
      logo:"🥐",
      color:"#C8953A",
      gerant:"Sophie Lacombe",
      chefProd:"Marc Dupuis",
      chefService:"Isabelle Renard",
      chefLivraison:"",
      staff:[
        {name:"Sophie Lacombe", role:"Gérant(e)",       hours:{Lun:"08:00-18:00",Mar:"08:00-18:00",Mer:"08:00-18:00",Jeu:"08:00-18:00",Ven:"08:00-18:00",Sam:"",Dim:""}},
        {name:"Marc Dupuis",    role:"Chef de production",hours:{Lun:"05:00-13:00",Mar:"05:00-13:00",Mer:"05:00-13:00",Jeu:"05:00-13:00",Ven:"05:00-13:00",Sam:"05:00-11:00",Dim:""}},
        {name:"Léa Martin",    role:"Vendeur/Vendeuse", hours:{Lun:"08:00-16:00",Mar:"08:00-16:00",Mer:"",Jeu:"08:00-16:00",Ven:"08:00-16:00",Sam:"08:00-14:00",Dim:""}},
      ],
      openHours:{Lun:"07:00-19:30",Mar:"07:00-19:30",Mer:"07:00-19:30",Jeu:"07:00-19:30",Ven:"07:00-19:30",Sam:"07:00-18:00",Dim:""},
    },
    {
      id:2, name:"Boulangerie Maison Blanche – Place de la Liberté",
      shortName:"Place de la Liberte 3",
      address:"Place de la Liberté 3", city:"Paris 75007", phone:"01 42 55 33 44",
      email:"liberte@maisonblanche.fr",
      logo:"🍞",
      color:"#3B82F6",
      gerant:"Thomas Bernard",
      chefProd:"Nadia Allou",
      chefService:"",
      chefLivraison:"Karim Saïdi",
      staff:[
        {name:"Thomas Bernard", role:"Gérant(e)",          hours:{Lun:"08:00-18:00",Mar:"08:00-18:00",Mer:"",Jeu:"08:00-18:00",Ven:"08:00-18:00",Sam:"08:00-14:00",Dim:""}},
        {name:"Nadia Allou",    role:"Chef de production", hours:{Lun:"05:00-13:00",Mar:"05:00-13:00",Mer:"05:00-13:00",Jeu:"05:00-13:00",Ven:"05:00-13:00",Sam:"",Dim:""}},
        {name:"Karim Saïdi",   role:"Responsable livraison",hours:{Lun:"06:00-14:00",Mar:"06:00-14:00",Mer:"06:00-14:00",Jeu:"06:00-14:00",Ven:"06:00-14:00",Sam:"06:00-10:00",Dim:""}},
      ],
      openHours:{Lun:"07:30-19:00",Mar:"07:30-19:00",Mer:"07:30-19:00",Jeu:"07:30-19:00",Ven:"07:30-19:00",Sam:"08:00-17:00",Dim:"09:00-13:00"},
    },
    {
      id:3, name:"Boulangerie Maison Blanche – Avenue des Fleurs",
      shortName:"Avenue des Fleurs 8",
      address:"Avenue des Fleurs 8", city:"Paris 75008", phone:"01 42 77 55 88",
      email:"fleurs@maisonblanche.fr",
      logo:"🌸",
      color:"#10B981",
      gerant:"Claire Morin",
      chefProd:"Antoine Petit",
      chefService:"Julie Blanc",
      chefLivraison:"",
      staff:[
        {name:"Claire Morin",   role:"Gérant(e)",          hours:{Lun:"08:00-18:00",Mar:"",Mer:"08:00-18:00",Jeu:"08:00-18:00",Ven:"08:00-18:00",Sam:"08:00-14:00",Dim:""}},
        {name:"Antoine Petit",  role:"Chef de production", hours:{Lun:"04:30-12:30",Mar:"04:30-12:30",Mer:"04:30-12:30",Jeu:"04:30-12:30",Ven:"04:30-12:30",Sam:"04:30-09:00",Dim:""}},
        {name:"Julie Blanc",    role:"Chef de service",    hours:{Lun:"09:00-17:00",Mar:"09:00-17:00",Mer:"09:00-17:00",Jeu:"",Ven:"09:00-17:00",Sam:"09:00-15:00",Dim:""}},
      ],
      openHours:{Lun:"07:00-20:00",Mar:"07:00-20:00",Mer:"07:00-20:00",Jeu:"07:00-20:00",Ven:"07:00-20:00",Sam:"07:30-18:00",Dim:"08:00-13:00"},
    },
  ]);
  const [selStore,  setSelStore]  = useState(1);
  const [editStore, setEditStore] = useState(false);
  const [editStaff, setEditStaff] = useState(null); // index du membre en édition
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({name:"",role:"Vendeur/Vendeuse",hours:{Lun:"",Mar:"",Mer:"",Jeu:"",Ven:"",Sam:"",Dim:""}});
  const [gSaved, setGSaved] = useState("");
  // Enseigne globale
  const [brand, setBrand] = useState({name:"Boulangerie Maison Blanche", slogan:"Artisans boulangers depuis 1986", logo:"🥐", primaryColor:"#C8953A"});
  const [editBrand, setEditBrand] = useState(false);

  function saveStore(updated) {
    setStores(function(prev){ return prev.map(function(s){ return s.id===updated.id ? updated : s; }); });
    setEditStore(false);
    setGSaved("✅ Sauvegarde"); setTimeout(function(){ setGSaved(""); }, 2200);
  }
  function addStaffMember() {
    if (!newStaff.name) return;
    setStores(function(prev){ return prev.map(function(s){
      if (s.id !== selStore) return s;
      return Object.assign({},s,{staff: s.staff.concat([Object.assign({},newStaff)])});
    }); });
    setNewStaff({name:"",role:"Vendeur/Vendeuse",hours:{Lun:"",Mar:"",Mer:"",Jeu:"",Ven:"",Sam:"",Dim:""}});
    setShowAddStaff(false);
    setGSaved("✅ Membre ajouté"); setTimeout(function(){ setGSaved(""); }, 2200);
  }
  function removeStaff(sIdx) {
    setStores(function(prev){ return prev.map(function(s){
      if (s.id !== selStore) return s;
      return Object.assign({},s,{staff: s.staff.filter(function(_,i){ return i!==sIdx; })});
    }); });
  }

  function saveBrand() {
    setTenant(brand.name);   // propage vers App → persist localStorage
    setEditBrand(false);
    setGSaved("✅ Enseigne sauvegardée"); setTimeout(function(){ setGSaved(""); }, 2200);
  }

  function exportCSV() {
    var OSORT = {attente:0,production:1,prete:2,livraison:3,livre:4};
    var exportData = storeOrders
      .filter(function(o){ return flt==="all" || o.status===flt; })
      .slice().sort(function(a,b){ return (OSORT[a.status]||0)-(OSORT[b.status]||0); });
    var cols = ["ID","Client","Magasin","Statut","Mode","Destination","Chauffeur","Heure","Total CHF","Articles","Note"];
    var rows = exportData.map(function(o){
      return [
        o.id,
        '"'+o.client.replace(/"/g,'""')+'"',
        '"'+o.store.replace(/"/g,'""')+'"',
        SM[o.status] ? SM[o.status].label : o.status,
        o.dMethod || "sur_place",
        '"'+(o.dest||"").replace(/"/g,'""')+'"',
        '"'+(o.driver||"").replace(/"/g,'""')+'"',
        o.time,
        o.total.toFixed(2),
        '"'+o.items.map(function(i){ return i.qty+"x "+i.name; }).join("; ").replace(/"/g,'""')+'"',
        '"'+(o.note||"").replace(/"/g,'""')+'"'
      ].join(",");
    });
    var csv = [cols.join(",")].concat(rows).join("\r\n");
    var blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"}); // BOM pour Excel
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href     = url;
    a.download = "bakeryos_commandes_"+new Date().toISOString().slice(0,10)+".csv";
    a.click();
    URL.revokeObjectURL(url);
    setSavedMsg("✅ Export téléchargé ("+exportData.length+" lignes)"); setTimeout(function(){ setSavedMsg(""); }, 2200);
  }

  function saveStaff(sIdx, updated) {
    setStores(function(prev){ return prev.map(function(s){
      if (s.id !== selStore) return s;
      var newStaffArr = s.staff.map(function(m,i){ return i===sIdx ? updated : m; });
      return Object.assign({},s,{staff: newStaffArr});
    }); });
    setEditStaff(null);
    setGSaved("✅ Horaires sauvegardés"); setTimeout(function(){ setGSaved(""); }, 2200);
  }

  function saveProd(updated) {
    setCatalogue(function(prev){ return prev.map(function(p){ return p.id===updated.id ? updated : p; }); });
    setEditProd(null);
    setSavedMsg("✅ Sauvegarde"); setTimeout(function(){ setSavedMsg(""); }, 2000);
  }
  function toggleActive(id) {
    setCatalogue(function(prev){ return prev.map(function(p){ return p.id===id ? Object.assign({},p,{active:!p.active}) : p; }); });
  }
  function addNew() {
    if (!newP.name || !newP.price) return;
    var maxId = catalogue.reduce(function(m,p){ return Math.max(m,p.id); }, 0);
    setCatalogue(function(prev){ return prev.concat([{id:maxId+1,name:newP.name,price:parseFloat(newP.price)||0,category:newP.category,emoji:newP.emoji,stock:parseInt(newP.stock)||0,tva:parseFloat(newP.tva)||2.6,active:true}]); });
    setNewP({name:"",price:"",category:"Viennoiseries",emoji:"🍞",stock:"",tva:"2.6"});
    setShowNew(false);
    setSavedMsg("✅ Produit ajoute"); setTimeout(function(){ setSavedMsg(""); }, 2000);
  }

  // Filtre par magasin (gérant voit son magasin par défaut, admin voit tout)
  var storeOrders = storeFilter==="all"
    ? orders
    : orders.filter(function(o){ return o.store===storeFilter || o.dest===storeFilter; });

  var totalCA = storeOrders.reduce(function(s,o){ return s+o.total; }, 0);
  var nbL     = storeOrders.filter(function(o){ return o.status==="livre"; }).length;
  var modN    = storeOrders.filter(function(o){ return o.modReq; }).length;
  var urgN    = storeOrders.filter(function(o){ return o.priority==="urgent" && o.status!=="livre"; }).length;

  var byStore = STORES.map(function(s){
    return {
      name: s.split(" ").slice(0,3).join(" "),
      val:  orders.filter(function(o){ return o.store===s||o.dest===s; }).reduce(function(sum,o){ return sum+o.total; },0),
    };
  });
  var maxS = Math.max.apply(null, byStore.map(function(r){ return r.val; }).concat([1]));

  var OSORT = {attente:0,production:1,prete:2,livraison:3,livre:4};
  var filtered = storeOrders
    .filter(function(o){ return flt==="all" || o.status===flt; })
    .slice().sort(function(a,b){ return (OSORT[a.status]||0)-(OSORT[b.status]||0); });

  var EMOJIS = ["🥐","🍫","🥖","🍞","🥧","🍮","🍰","🍏","🎨","🥪","🥗","✨","🎂","🧁","🍩","🥨"];

  return (
    <div style={{minHeight:"100vh",background:"#F7F3EE"}}>
      {/* Modal analyse prix */}
      {analyseProd && <PriceAnalysisModal prod={analyseProd} onClose={function(){ setAnalyseProd(null); }} />}

      {/* Header + tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid #EDE0D0",padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <div style={{padding:"14px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:24,color:"#1E0E05",fontWeight:700}}>
                {isGerant ? "Mon magasin" : "Dashboard Admin"}
              </div>
              {isGerant && (
                <span style={{background:"#FEF3C7",border:"1px solid #FCD34D",color:"#92400E",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:12}}>
                  🏪 Gérant(e)
                </span>
              )}
            </div>
            <div style={{color:"#8B7355",fontSize:11}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:2,flexWrap:"wrap"}}>
            {[["dashboard","📊 Vue générale"],["commandes","📋 Commandes"],["catalogue","📦 Catalogue"],["planning","🏭 Planning"],["gestion","⚙️ Gestion"],["utilisateurs","👥 Utilisateurs"],["supervision","📈 Supervision"],["cartes","🎁 Cartes"],["abonnements","🔄 Abonnements"],["reporting","📊 Rapport"],["imprimante","🖨 Imprimante"]]
            .filter(function(item){ return allowedTabs.indexOf(item[0]) !== -1; })
            .map(function(item){
              return (
                <button key={item[0]} onClick={function(){ setAdminTab(item[0]); }}
                  style={{padding:"10px 14px",border:"none",background:"none",fontSize:12,cursor:"pointer",
                          fontFamily:"'Outfit',sans-serif",fontWeight:adminTab===item[0]?700:400,
                          color:adminTab===item[0]?"#C8953A":"#8B7355",
                          borderBottom:adminTab===item[0]?"2px solid #C8953A":"2px solid transparent",transition:"all .15s"}}>{item[1]}</button>
              );
            })}
            {savedMsg && <span style={{alignSelf:"center",marginLeft:8,background:"#D1FAE5",color:"#065F46",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:18,animation:"pop .3s ease"}}>{savedMsg}</span>}
          </div>
        </div>
        {/* Store filter bar */}
        <div style={{display:"flex",alignItems:"center",gap:6,paddingBottom:10,overflowX:"auto"}}>
          <span style={{fontSize:10,color:"#8B7355",flexShrink:0,textTransform:"uppercase",letterSpacing:.8}}>Magasin :</span>
          {(isGerant ? [storeFilter] : ["all","Rue du Four 12","Place de la Liberte 3","Avenue des Fleurs 8"]).map(function(s){
            if (isGerant) {
              // Gérant: show their store fixed + option to see all or another
              return null;
            }
            var lbl = s==="all" ? "Tous" : s.split(" ").slice(0,3).join(" ");
            var active = storeFilter===s;
            return (
              <button key={s} onClick={function(){ setStoreFilter(s); }}
                style={{padding:"3px 10px",borderRadius:14,border:"1px solid "+(active?"#C8953A":"#EDE0D0"),
                        background:active?"#FDF0D8":"transparent",color:active?"#92400E":"#8B7355",
                        fontSize:10,fontWeight:active?700:400,cursor:"pointer",whiteSpace:"nowrap",
                        fontFamily:"'Outfit',sans-serif",transition:"all .13s"}}>{lbl}</button>
            );
          })}
          {isGerant && (
            <>
              <button onClick={function(){ setStoreFilter(userStore); }}
                style={{padding:"3px 10px",borderRadius:14,border:"1px solid "+(storeFilter===userStore?"#C8953A":"#EDE0D0"),
                        background:storeFilter===userStore?"#FDF0D8":"transparent",color:storeFilter===userStore?"#92400E":"#8B7355",
                        fontSize:10,fontWeight:storeFilter===userStore?700:400,cursor:"pointer",
                        fontFamily:"'Outfit',sans-serif",transition:"all .13s"}}>
                🏪 Mon magasin
              </button>
              <button onClick={function(){ setStoreFilter("all"); }}
                style={{padding:"3px 10px",borderRadius:14,border:"1px solid "+(storeFilter==="all"?"#1E40AF":"#EDE0D0"),
                        background:storeFilter==="all"?"#DBEAFE":"transparent",color:storeFilter==="all"?"#1E40AF":"#8B7355",
                        fontSize:10,fontWeight:storeFilter==="all"?700:400,cursor:"pointer",
                        fontFamily:"'Outfit',sans-serif",transition:"all .13s"}}>
                🌐 Tous les magasins
              </button>
            </>
          )}
          {/* Nouvelle commande — si permission create_order */}
          {canCreateOrder && (
            <button onClick={function(){ setShowNewOrder(function(v){ return !v; }); }}
              style={{marginLeft:"auto",padding:"5px 13px",borderRadius:9,border:"none",flexShrink:0,
                      background:showNewOrder?"#FEE2E2":"linear-gradient(135deg,#1E0E05,#3D2B1A)",
                      color:showNewOrder?"#DC2626":"#FDF8F0",fontSize:11,fontWeight:600,cursor:"pointer",
                      fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
              {showNewOrder ? "✕ Annuler" : "+ Nouvelle commande"}
            </button>
          )}
        </div>
      </div>

      <div style={{padding:20}}>

        {/* ── NOUVELLE COMMANDE (gérant) ── */}
        {canCreateOrder && showNewOrder && (
          <div style={{background:"#fff",borderRadius:16,padding:20,marginBottom:18,boxShadow:"0 2px 14px rgba(0,0,0,.1)",border:"2px solid #C8953A",animation:"slideIn .2s ease"}}>
            <div style={{fontWeight:700,fontSize:15,color:"#1E0E05",marginBottom:14}}>📋 Nouvelle commande — {userStore}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Nom du client *</label>
                <input value={newOrder.client} onChange={function(e){ setNewOrder(function(o){ return Object.assign({},o,{client:e.target.value}); }); }}
                  placeholder="Prénom Nom"
                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
              </div>
              <div>
                <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Priorité</label>
                <select value={newOrder.priority} onChange={function(e){ setNewOrder(function(o){ return Object.assign({},o,{priority:e.target.value}); }); }}
                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                  <option value="normal">Normal</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>

            {/* Mode de livraison */}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:6}}>Mode de récupération</label>
              <div style={{display:"flex",gap:8}}>
                {[
                  {id:"sur_place", label:"🏪 Sur place", desc:"Retrait au magasin"},
                  {id:"retrait",   label:"🔄 Autre magasin", desc:"Retrait dans un autre point"},
                  {id:"livreur",   label:"🚐 Livraison", desc:"Livraison à domicile"},
                ].map(function(m){
                  var active = newOrder.dMethod===m.id;
                  return (
                    <div key={m.id} onClick={function(){ setNewOrder(function(o){ return Object.assign({},o,{dMethod:m.id,destStore:"",destAddr:"",driver:"Non assigné"}); }); }}
                      style={{flex:1,padding:"10px 8px",borderRadius:10,cursor:"pointer",textAlign:"center",
                              border:"1.5px solid "+(active?"#C8953A":"#EDE0D0"),
                              background:active?"#FDF0D8":"#F7F3EE",transition:"all .13s"}}>
                      <div style={{fontSize:14,marginBottom:2}}>{m.label.split(" ")[0]}</div>
                      <div style={{fontSize:10,fontWeight:active?700:500,color:active?"#92400E":"#5C4A32"}}>{m.label.slice(2)}</div>
                      <div style={{fontSize:9,color:"#8B7355"}}>{m.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Retrait autre magasin */}
            {newOrder.dMethod==="retrait" && (
              <div style={{marginBottom:10}}>
                <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Magasin de retrait</label>
                <select value={newOrder.destStore} onChange={function(e){ setNewOrder(function(o){ return Object.assign({},o,{destStore:e.target.value}); }); }}
                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                  <option value="">-- Choisir un magasin --</option>
                  {STORES.filter(function(s){ return s!==userStore; }).map(function(s){ return <option key={s} value={s}>{s}</option>; })}
                </select>
              </div>
            )}

            {/* Livraison à domicile */}
            {newOrder.dMethod==="livreur" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Adresse de livraison *</label>
                  <input value={newOrder.destAddr} onChange={function(e){ setNewOrder(function(o){ return Object.assign({},o,{destAddr:e.target.value}); }); }}
                    placeholder="15 rue de la Paix, Paris"
                    style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                </div>
                <div>
                  <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>🚐 Chauffeur assigné</label>
                  <select value={newOrder.driver} onChange={function(e){ setNewOrder(function(o){ return Object.assign({},o,{driver:e.target.value}); }); }}
                    style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                    {DRIVERS.map(function(d){ return <option key={d} value={d}>{d}</option>; })}
                  </select>
                </div>
              </div>
            )}

            {/* Articles */}
            <div style={{marginBottom:10}}>
              <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:5}}>Articles</label>
              {newOrder.items.map(function(it,i){
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:13}}>{(catalogue.find(function(p){ return p.id===it.id; })||{emoji:"?"}).emoji}</span>
                    <span style={{flex:1,fontSize:11,color:"#3D2B1A"}}>{it.name}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button onClick={function(){ setNewOrder(function(o){ var arr=o.items.map(function(x,j){ return j===i&&x.qty>1?Object.assign({},x,{qty:x.qty-1}):x; }).filter(function(x){ return x.qty>0; }); return Object.assign({},o,{items:arr}); }); }}
                        style={{width:22,height:22,borderRadius:5,border:"1px solid #D5C4B0",background:"#F7F3EE",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontSize:12,fontWeight:700,minWidth:18,textAlign:"center"}}>{it.qty}</span>
                      <button onClick={function(){ setNewOrder(function(o){ var arr=o.items.map(function(x,j){ return j===i?Object.assign({},x,{qty:x.qty+1}):x; }); return Object.assign({},o,{items:arr}); }); }}
                        style={{width:22,height:22,borderRadius:5,border:"1px solid #D5C4B0",background:"#F7F3EE",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                    <span style={{fontSize:11,fontWeight:600,color:"#C8953A",minWidth:52,textAlign:"right"}}>CHF {(it.price*it.qty).toFixed(2)}</span>
                    <button onClick={function(){ setNewOrder(function(o){ return Object.assign({},o,{items:o.items.filter(function(_,j){ return j!==i; })}); }); }}
                      style={{width:20,height:20,borderRadius:4,border:"none",background:"#FEE2E2",color:"#DC2626",cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                  </div>
                );
              })}
              <select defaultValue="" onChange={function(e){
                if (!e.target.value) return;
                var pid = parseInt(e.target.value);
                var prod = catalogue.find(function(p){ return p.id===pid && p.active; });
                if (!prod) return;
                setNewOrder(function(o){
                  var existing = o.items.find(function(x){ return x.id===pid; });
                  var items = existing
                    ? o.items.map(function(x){ return x.id===pid?Object.assign({},x,{qty:x.qty+1}):x; })
                    : o.items.concat([{id:prod.id,name:prod.name,qty:1,price:prod.price,emoji:prod.emoji}]);
                  return Object.assign({},o,{items:items});
                });
                e.target.value="";
              }}
                style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1.5px dashed #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer",color:"#8B7355",marginTop:4}}>
                <option value="">+ Ajouter un article…</option>
                {catalogue.filter(function(p){ return p.active; }).map(function(p){ return <option key={p.id} value={p.id}>{p.emoji} {p.name} — CHF {p.price.toFixed(2)}</option>; })}
              </select>
            </div>

            <div style={{marginBottom:10}}>
              <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Note</label>
              <input value={newOrder.note} onChange={function(e){ setNewOrder(function(o){ return Object.assign({},o,{note:e.target.value}); }); }}
                placeholder="Instructions particulières…"
                style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
            </div>

            {/* Total + valider */}
            {(function(){
              var total = newOrder.items.reduce(function(s,it){ return s+(it.price*it.qty); },0);
              var valid = newOrder.client && newOrder.items.length>0
                && (newOrder.dMethod!=="retrait" || newOrder.destStore)
                && (newOrder.dMethod!=="livreur" || newOrder.destAddr);
              return (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"2px solid #F0E8DC"}}>
                  <div>
                    <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9}}>Total</div>
                    <div style={{fontSize:20,fontWeight:700,color:"#C8953A"}}>CHF {total.toFixed(2)}</div>
                  </div>
                  <button disabled={!valid} onClick={function(){
                    var total = newOrder.items.reduce(function(s,it){ return s+(it.price*it.qty); },0);
                    var newCmd = {
                      id:"CMD-"+Date.now(),
                      client:newOrder.client,
                      items:newOrder.items.map(function(it){ return {id:it.id,name:it.name,qty:it.qty,price:it.price}; }),
                      store:userStore, status:"attente", priority:newOrder.priority,
                      time:hm(), total:total,
                      dMethod: newOrder.dMethod==="sur_place" ? null : newOrder.dMethod,
                      dest: newOrder.dMethod==="retrait" ? newOrder.destStore
                           : newOrder.dMethod==="livreur" ? newOrder.destAddr : null,
                      driver: newOrder.dMethod==="livreur" ? newOrder.driver : null,
                      modReq:false, note:newOrder.note
                    };
                    addOrder(newCmd);
                    setNewOrder({client:"",dMethod:"sur_place",destStore:"",destAddr:"",driver:"Non assigné",items:[],priority:"normal",note:""});
                    setShowNewOrder(false);
                    setSavedMsg("✅ Commande créée"); setTimeout(function(){ setSavedMsg(""); },2500);
                  }}
                    style={{padding:"10px 22px",borderRadius:10,border:"none",
                            background:valid?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                            color:valid?"#1E0E05":"#8B7355",fontSize:13,fontWeight:700,
                            cursor:valid?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                    ✓ Valider la commande
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── TAB: DASHBOARD ── */}
        {adminTab==="dashboard" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[
                {l:"CA du jour",  v:"CHF "+totalCA.toFixed(2), icon:"💰",bg:"linear-gradient(135deg,#1E0E05,#3D2B1A)",a:"#C8953A"},
                {l:"Commandes",   v:orders.length,             icon:"📋",bg:"linear-gradient(135deg,#1E40AF,#2563EB)",a:"#BFDBFE"},
                {l:"Livrees",     v:nbL+"/"+orders.length,     icon:"✅",bg:"linear-gradient(135deg,#065F46,#059669)",a:"#A7F3D0"},
                {l:"Modif. ddes", v:modN,                      icon:"🔔",bg:"linear-gradient(135deg,#DC2626,#B91C1C)",a:"#FEE2E2"},
              ].map(function(k){
                return (
                  <div key={k.l} className="ch" style={{background:k.bg,borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{k.icon}</div>
                    <div style={{fontSize:18,fontWeight:700,color:k.a,fontFamily:"'Outfit',sans-serif",marginBottom:2}}>{k.v}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,.42)",textTransform:"uppercase",letterSpacing:.8}}>{k.l}</div>
                  </div>
                );
              })}
            </div>
            {urgN>0 && <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span>🚨</span><span style={{color:"#92400E",fontSize:12,fontWeight:600}}>{urgN} commande(s) urgente(s)</span></div>}
            {modN>0 && <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span>🔔</span><span style={{color:"#DC2626",fontSize:12,fontWeight:600}}>{modN} demande(s) de modification</span></div>}
            {subsDueToday.length>0 && (
              <div style={{background:"#EDE9FE",border:"1px solid #C4B5FD",borderRadius:10,padding:"9px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span>🔄</span>
                  <span style={{color:"#5B21B6",fontSize:12,fontWeight:600}}>{subsDueToday.length} abonnement(s) à générer aujourd'hui</span>
                </div>
                <button onClick={function(){
                  var gen = generateSubOrders(subsDueToday);
                  setSavedMsg("✅ "+gen.length+" commande(s) générée(s)"); setTimeout(function(){ setSavedMsg(""); },3000);
                }}
                  style={{padding:"5px 14px",borderRadius:8,border:"none",background:"#7C3AED",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                  Générer
                </button>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>📊 Revenue par magasin</div>
                {byStore.map(function(row){
                  return (
                    <div key={row.name} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:10,color:"#5C4A32"}}>{row.name}</span>
                        <span style={{fontSize:11,fontWeight:600,color:"#C8953A"}}>CHF {row.val.toFixed(2)}</span>
                      </div>
                      <div style={{height:6,background:"#F0E8DC",borderRadius:3}}>
                        <div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#C8953A,#a07228)",width:(row.val/maxS*100)+"%",transition:"width 1.1s ease"}} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:10}}>⚡ Activite recente</div>
                {orders.slice(0,8).map(function(o){
                  var sm = SM[o.status] || SM.attente;
                  return (
                    <div key={o.id} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",marginTop:3,flexShrink:0,background:sm.dot}} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,color:"#3D2B1A",fontWeight:500}}>{o.id} · {o.client}</div>
                        <div style={{fontSize:10,color:"#8B7355"}}>{sm.label} · {o.time}</div>
                      </div>
                      <div style={{fontSize:10,color:"#C8953A",fontWeight:600,whiteSpace:"nowrap"}}>CHF {o.total.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: COMMANDES ── */}
        {adminTab==="commandes" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 270px",gap:16,alignItems:"start"}}>
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
              <div style={{padding:"12px 17px",borderBottom:"1px solid #F0E8DC",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                <span style={{fontWeight:600,color:"#1E0E05",fontSize:13}}>Toutes les commandes</span>
                <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                  {[["all","Toutes"],["attente","Attente"],["production","Prod."],["prete","Prete"],["livraison","Livraison"],["livre","Livrees"]].map(function(item){
                    return (
                      <button key={item[0]} onClick={function(){ setFlt(item[0]); }}
                        style={{padding:"3px 8px",borderRadius:16,border:"none",cursor:"pointer",
                                background:flt===item[0]?"#1E0E05":"#F7F3EE",color:flt===item[0]?"#FDF8F0":"#5C4A32",
                                fontSize:10,fontWeight:500,fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}>{item[1]}</button>
                    );
                  })}
                  {canExportData && (
                    <button onClick={exportCSV} title={"Exporter "+filtered.length+" commande(s) en CSV"}
                      style={{marginLeft:4,padding:"3px 10px",borderRadius:16,border:"1px solid #C8953A",cursor:"pointer",
                              background:"#FDF0D8",color:"#92400E",fontSize:10,fontWeight:600,
                              fontFamily:"'Outfit',sans-serif",transition:"all .12s",display:"flex",alignItems:"center",gap:4}}>
                      📤 CSV ({filtered.length})
                    </button>
                  )}
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"#F7F3EE"}}>
                      {["ID","Client","Magasin","Produits","Total","Statut",""].map(function(h){
                        return <th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:9,color:"#8B7355",fontWeight:600,textTransform:"uppercase",letterSpacing:.9,whiteSpace:"nowrap"}}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(function(o){
                      var sm = SM[o.status] || SM.attente;
                      var active = selO && selO.id===o.id;
                      return (
                        <tr key={o.id} className="tr" onClick={function(){ setSelO(active ? null : o); }}
                          style={{borderBottom:"1px solid #F0E8DC",cursor:"pointer",background:active?"#FDFAF2":"#fff",transition:"background .12s"}}>
                          <td style={{padding:"8px 10px",fontSize:11,fontWeight:700,color:"#1E0E05",whiteSpace:"nowrap"}}>{o.id}{o.modReq?" 🔔":""}</td>
                          <td style={{padding:"8px 10px",fontSize:11,color:"#3D2B1A",whiteSpace:"nowrap"}}>{o.client}</td>
                          <td style={{padding:"8px 10px",fontSize:10,color:"#8B7355",whiteSpace:"nowrap"}}>{o.store.split(" ").slice(0,3).join(" ")}</td>
                          <td style={{padding:"8px 10px",fontSize:10,color:"#5C4A32",maxWidth:120}}>
                            <span style={{display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.items.map(function(it){ return it.qty+"x "+it.name; }).join(", ")}</span>
                          </td>
                          <td style={{padding:"8px 10px",fontSize:12,fontWeight:600,color:"#C8953A",whiteSpace:"nowrap"}}>CHF {o.total.toFixed(2)}</td>
                          <td style={{padding:"8px 10px"}}><span style={{background:sm.bg,color:sm.tx,fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:16,whiteSpace:"nowrap"}}>{sm.label}</span></td>
                          <td style={{padding:"8px 10px",color:"#8B7355",fontSize:12}}>{active?"▲":"▼"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              {selO && (
                <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",animation:"slideIn .18s ease"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontWeight:700,color:"#1E0E05",fontSize:12}}>Detail — {selO.id}</span>
                    <button onClick={function(){ setSelO(null); }} style={{background:"none",border:"none",color:"#8B7355",cursor:"pointer",fontSize:17}}>✕</button>
                  </div>
                  <div style={{fontSize:12,color:"#3D2B1A",fontWeight:600,marginBottom:2}}>{selO.client}</div>
                  <div style={{fontSize:11,color:"#8B7355",marginBottom:1}}>📍 {selO.store}</div>
                  {selO.dest && <div style={{fontSize:11,color:"#8B7355",marginBottom:1}}>→ {selO.dest}</div>}
                  <div style={{fontSize:11,color:"#8B7355",marginBottom:8}}>{selO.time}</div>
                  <div style={{borderTop:"1px solid #F0E8DC",paddingTop:7,marginBottom:8}}>
                    {selO.items.map(function(it,j){
                      return (
                        <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11}}>
                          <span style={{color:"#3D2B1A"}}>{it.qty}x {it.name}</span>
                          <span style={{color:"#C8953A",fontWeight:600}}>CHF {(it.price*it.qty).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:12,color:"#1E0E05",marginBottom:10,paddingTop:5,borderTop:"1px solid #F0E8DC"}}>
                    <span>Total</span>
                    <span style={{color:"#C8953A",fontFamily:"'Outfit',sans-serif",fontSize:16}}>CHF {selO.total.toFixed(2)}</span>
                  </div>
                  {selO.modReq && <div style={{background:"#FEF2F2",borderRadius:7,padding:"6px 9px",fontSize:11,color:"#DC2626",fontWeight:600,marginBottom:8}}>🔔 Demande de modification</div>}
                  <select defaultValue="" onChange={function(e){
                    if (!e.target.value) return;
                    var s = e.target.value;
                    updOrder(selO.id, {status:s, modReq:false});
                    setSelO(Object.assign({},selO,{status:s,modReq:false}));
                    e.target.value="";
                  }} style={{width:"100%",padding:"6px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#1E0E05",fontSize:11,outline:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    <option value="" disabled>Changer le statut…</option>
                    {Object.keys(SM).map(function(s){ return <option key={s} value={s}>{SM[s].label}</option>; })}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: CATALOGUE ── */}
        {adminTab==="catalogue" && (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontWeight:700,color:"#1E0E05",fontSize:16,fontFamily:"'Outfit',sans-serif"}}>📦 Gestion du catalogue</div>
                <div style={{fontSize:11,color:"#8B7355"}}>{catalogue.filter(function(p){return p.active;}).length} articles actifs · {catalogue.filter(function(p){return !p.active;}).length} inactifs</div>
              </div>
              <button onClick={function(){ setShowNew(true); setEditProd(null); }}
                style={{padding:"8px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#FDF8F0",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                + Nouvel article
              </button>
            </div>

            {/* Formulaire nouvel article */}
            {showNew && (
              <div style={{background:"#fff",borderRadius:14,padding:18,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.08)",border:"2px solid #C8953A",animation:"slideIn .2s ease"}}>
                <div style={{fontWeight:700,color:"#1E0E05",fontSize:13,marginBottom:14}}>✨ Nouvel article</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Nom *</label>
                    <input value={newP.name} onChange={function(e){ setNewP(function(p){ return Object.assign({},p,{name:e.target.value}); }); }}
                      placeholder="Ex: Pain aux noix"
                      style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                  </div>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Prix CHF *</label>
                    <input type="number" step="0.05" min="0" value={newP.price} onChange={function(e){ setNewP(function(p){ return Object.assign({},p,{price:e.target.value}); }); }}
                      placeholder="0.00"
                      style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                  </div>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Categorie</label>
                    <select value={newP.category} onChange={function(e){ setNewP(function(p){ return Object.assign({},p,{category:e.target.value}); }); }}
                      style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                      {["Viennoiseries","Pains","Patisseries","Tartes","Traiteur"].map(function(c){ return <option key={c}>{c}</option>; })}
                    </select>
                  </div>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Stock initial</label>
                    <input type="number" min="0" value={newP.stock} onChange={function(e){ setNewP(function(p){ return Object.assign({},p,{stock:e.target.value}); }); }}
                      placeholder="0"
                      style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                  </div>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>TVA %</label>
                    <select value={newP.tva} onChange={function(e){ setNewP(function(p){ return Object.assign({},p,{tva:e.target.value}); }); }}
                      style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                      <option value="2.6">2.6% — Alimentaire</option>
                      <option value="8.1">8.1% — Restauration</option>
                    </select>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:5}}>Emoji</label>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {EMOJIS.map(function(em){
                      return (
                        <button key={em} onClick={function(){ setNewP(function(p){ return Object.assign({},p,{emoji:em}); }); }}
                          style={{width:34,height:34,borderRadius:8,border:"2px solid "+(newP.emoji===em?"#C8953A":"#EDE0D0"),background:newP.emoji===em?"#FDF0D8":"#fff",fontSize:17,cursor:"pointer",transition:"all .12s"}}>
                          {em}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={function(){ setShowNew(false); }}
                    style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
                  <button disabled={!newP.name||!newP.price} onClick={addNew}
                    style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:newP.name&&newP.price?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",color:newP.name&&newP.price?"#1E0E05":"#8B7355",fontSize:12,fontWeight:600,cursor:newP.name&&newP.price?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
                    ✅ Creer l'article
                  </button>
                </div>
              </div>
            )}

            {/* Tableau catalogue */}
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:"#F7F3EE"}}>
                    {["","Article","Categorie","Px vente",...(canViewCost?["Px revient","Marge"]:[]),"TVA","Stock","Statut",""].map(function(h){
                      return <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:9,color:"#8B7355",fontWeight:600,textTransform:"uppercase",letterSpacing:.9,whiteSpace:"nowrap"}}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {catalogue.map(function(p){
                    var isEdit = editProd && editProd.id===p.id;
                    var ep = isEdit ? editProd : p;
                    var marge    = ep.price - (ep.cost||0);
                    var margePct = ep.price > 0 ? Math.round((marge/ep.price)*100) : 0;
                    var margeColor = margePct>=60?"#065F46":margePct>=40?"#92400E":"#DC2626";
                    var margeBg    = margePct>=60?"#D1FAE5":margePct>=40?"#FEF3C7":"#FEE2E2";
                    return (
                      <tr key={p.id} className="tr" style={{borderBottom:"1px solid #F0E8DC",background:isEdit?"#FFFDF5":"#fff",opacity:p.active?1:.55}}>
                        {/* Emoji */}
                        <td style={{padding:"9px 10px",fontSize:17,width:34}}>{p.emoji}</td>
                        {/* Nom */}
                        <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <input value={editProd.name} onChange={function(e){ setEditProd(function(ep){ return Object.assign({},ep,{name:e.target.value}); }); }}
                              style={{padding:"4px 7px",borderRadius:6,border:"1px solid #C8953A",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",width:"140px"}} />
                          ) : (
                            <span style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>{p.name}</span>
                          )}
                        </td>
                        {/* Categorie */}
                        <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <select value={editProd.category} onChange={function(e){ setEditProd(function(ep){ return Object.assign({},ep,{category:e.target.value}); }); }}
                              style={{padding:"4px 6px",borderRadius:6,border:"1px solid #C8953A",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                              {["Viennoiseries","Pains","Patisseries","Tartes","Traiteur"].map(function(c){ return <option key={c}>{c}</option>; })}
                            </select>
                          ) : (
                            <span style={{background:"#F7F3EE",color:"#5C4A32",fontSize:10,padding:"2px 7px",borderRadius:12,fontWeight:500,whiteSpace:"nowrap"}}>{p.category}</span>
                          )}
                        </td>
                        {/* Prix vente */}
                        <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <div style={{display:"flex",alignItems:"center",gap:3}}>
                              <span style={{fontSize:9,color:"#8B7355"}}>CHF</span>
                              <input type="number" step="0.05" min="0" value={editProd.price}
                                onChange={function(e){ setEditProd(function(ep){ return Object.assign({},ep,{price:parseFloat(e.target.value)||0}); }); }}
                                style={{width:62,padding:"4px 6px",borderRadius:6,border:"2px solid #C8953A",fontSize:12,fontWeight:700,color:"#C8953A",outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                            </div>
                          ) : (
                            <span style={{fontSize:12,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {p.price.toFixed(2)}</span>
                          )}
                        </td>
                        {/* Prix revient */}
                        {canViewCost && <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <div style={{display:"flex",alignItems:"center",gap:3}}>
                              <span style={{fontSize:9,color:"#8B7355"}}>CHF</span>
                              <input type="number" step="0.05" min="0" value={editProd.cost||0}
                                onChange={function(e){ setEditProd(function(ep){ return Object.assign({},ep,{cost:parseFloat(e.target.value)||0}); }); }}
                                style={{width:62,padding:"4px 6px",borderRadius:6,border:"2px solid #5C4A32",fontSize:12,fontWeight:600,color:"#5C4A32",outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                            </div>
                          ) : (
                            <span style={{fontSize:12,fontWeight:600,color:"#5C4A32"}}>CHF {(p.cost||0).toFixed(2)}</span>
                          )}
                        </td>}
                        {/* Marge */}
                        {canViewCost && <td style={{padding:"9px 10px"}}>
                          <div style={{display:"flex",flexDirection:"column",gap:2}}>
                            <span style={{fontSize:11,fontWeight:700,color:margeColor}}>+CHF {marge.toFixed(2)}</span>
                            <div style={{display:"flex",alignItems:"center",gap:4}}>
                              <div style={{flex:1,height:4,background:"#F0E8DC",borderRadius:2,minWidth:36}}>
                                <div style={{height:"100%",borderRadius:2,background:margeColor,width:Math.min(margePct,100)+"%",transition:"width .6s ease"}} />
                              </div>
                              <span style={{fontSize:9,fontWeight:700,background:margeBg,padding:"1px 5px",borderRadius:8,color:margeColor}}>{margePct}%</span>
                            </div>
                          </div>
                        </td>}
                        {/* TVA */}
                        <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <select value={editProd.tva||2.6} onChange={function(e){ setEditProd(function(ep){ return Object.assign({},ep,{tva:parseFloat(e.target.value)}); }); }}
                              style={{width:72,padding:"4px 4px",borderRadius:6,border:"1px solid #C8953A",fontSize:10,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                              <option value={2.6}>2.6%</option>
                              <option value={8.1}>8.1%</option>
                            </select>
                          ) : (
                            <span style={{fontSize:10,fontWeight:600,color:(p.tva||2.6)>3?"#7C3AED":"#065F46",
                                          background:(p.tva||2.6)>3?"#F3E8FF":"#D1FAE5",padding:"2px 7px",borderRadius:8}}>
                              {(p.tva||2.6)}%
                            </span>
                          )}
                        </td>
                        {/* Stock */}
                        <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <input type="number" min="0" value={editProd.stock||0}
                              onChange={function(e){ setEditProd(function(ep){ return Object.assign({},ep,{stock:parseInt(e.target.value)||0}); }); }}
                              style={{width:52,padding:"4px 6px",borderRadius:6,border:"1px solid #C8953A",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                          ) : (
                            <span style={{fontSize:12,color:p.stock>10?"#065F46":p.stock>0?"#92400E":"#DC2626",fontWeight:600}}>{p.stock}</span>
                          )}
                        </td>
                        {/* Statut */}
                        <td style={{padding:"9px 10px"}}>
                          <div onClick={function(){ toggleActive(p.id); }}
                            style={{display:"inline-flex",alignItems:"center",gap:4,cursor:"pointer",background:p.active?"#D1FAE5":"#F3F4F6",borderRadius:20,padding:"3px 9px",transition:"all .18s"}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:p.active?"#10B981":"#9CA3AF"}} />
                            <span style={{fontSize:9,fontWeight:600,color:p.active?"#065F46":"#6B7280"}}>{p.active?"Actif":"Inactif"}</span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td style={{padding:"9px 10px"}}>
                          {isEdit ? (
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={function(){ saveProd(editProd); }}
                                style={{padding:"5px 9px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#065F46,#047857)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✓</button>
                              <button onClick={function(){ setEditProd(null); }}
                                style={{padding:"5px 7px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer"}}>✕</button>
                            </div>
                          ) : (
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={function(){ setEditProd(Object.assign({},p)); setShowNew(false); }}
                                style={{padding:"5px 8px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}
                                onMouseOver={function(e){ e.currentTarget.style.background="#FDF0D8"; e.currentTarget.style.borderColor="#C8953A"; }}
                                onMouseOut={function(e){ e.currentTarget.style.background="#F7F3EE"; e.currentTarget.style.borderColor="#D5C4B0"; }}>✏️</button>
                              <button onClick={function(){ setAnalyseProd(p); }}
                                title="Analyse des prix"
                                style={{padding:"5px 8px",borderRadius:7,border:"1px solid #DBEAFE",background:"#EFF6FF",color:"#1E40AF",fontSize:12,cursor:"pointer",transition:"all .12s"}}
                                onMouseOver={function(e){ e.currentTarget.style.background="#DBEAFE"; }}
                                onMouseOut={function(e){ e.currentTarget.style.background="#EFF6FF"; }}>📈</button>
                              {(function(){
                                var rec = recipes.find(function(r){ return r.productId===p.id; });
                                return rec ? (
                                  <button onClick={function(){ setViewRecipe(rec); }}
                                    title="Voir la recette"
                                    style={{padding:"5px 8px",borderRadius:7,border:"1px solid #C4B5FD",background:"#EDE9FE",color:"#5B21B6",fontSize:12,cursor:"pointer",transition:"all .12s"}}
                                    onMouseOver={function(e){ e.currentTarget.style.background="#DDD6FE"; }}
                                    onMouseOut={function(e){ e.currentTarget.style.background="#EDE9FE"; }}>📖</button>
                                ) : canManageRecipes ? (
                                  <button onClick={function(){ setEditRecipe({id:"REC-"+Date.now(),productId:p.id,name:p.name,portions:10,prepTime:0,cookTime:0,restTime:0,difficulty:"moyen",ingredients:[],steps:[],notes:"",costPerBatch:0}); }}
                                    title="Créer une fiche recette"
                                    style={{padding:"5px 8px",borderRadius:7,border:"1px dashed #D5C4B0",background:"transparent",color:"#8B7355",fontSize:12,cursor:"pointer",transition:"all .12s"}}
                                    onMouseOver={function(e){ e.currentTarget.style.background="#F7F3EE"; }}
                                    onMouseOut={function(e){ e.currentTarget.style.background="transparent"; }}>📖</button>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Résumé marges */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:12}}>
              {(function(){
                var active = catalogue.filter(function(p){ return p.active; });
                var avgMarge = active.length ? active.reduce(function(s,p){ return s+(p.price>0?(p.price-(p.cost||0))/p.price*100:0); },0)/active.length : 0;
                var best  = active.slice().sort(function(a,b){ return ((b.price-(b.cost||0))/b.price)-((a.price-(a.cost||0))/a.price); })[0];
                var worst = active.slice().sort(function(a,b){ return ((a.price-(a.cost||0))/a.price)-((b.price-(b.cost||0))/b.price); })[0];
                return [
                  {label:"Marge moyenne",v:Math.round(avgMarge)+"%",bg:"#F7F3EE",c:"#1E0E05"},
                  {label:"Meilleure marge",v:best?best.emoji+" "+best.name.split(" ")[0]+" ("+Math.round((best.price-(best.cost||0))/best.price*100)+"%)":"—",bg:"#D1FAE5",c:"#065F46"},
                  {label:"Marge la plus basse",v:worst?worst.emoji+" "+worst.name.split(" ")[0]+" ("+Math.round((worst.price-(worst.cost||0))/worst.price*100)+"%)":"—",bg:"#FEE2E2",c:"#DC2626"},
                ].map(function(k){
                  return (
                    <div key={k.label} style={{background:k.bg,borderRadius:10,padding:"11px 13px"}}>
                      <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:3}}>{k.label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:k.c}}>{k.v}</div>
                    </div>
                  );
                });
              })()}
            </div>

            <div style={{marginTop:10,padding:"8px 13px",background:"#F7F3EE",borderRadius:8,fontSize:11,color:"#8B7355"}}>
              💡 Marge = (Prix vente − Prix revient) / Prix vente. Cliquez sur 📈 pour l'analyse des fluctuations.
            </div>
          </div>
        )}

        {/* ── TAB: GESTION ── */}
        {adminTab==="gestion" && (
          <div>
            {/* Saved feedback */}
            {gSaved && (
              <div style={{position:"fixed",top:20,right:24,background:"#D1FAE5",color:"#065F46",fontWeight:700,fontSize:12,padding:"8px 16px",borderRadius:20,boxShadow:"0 4px 14px rgba(0,0,0,.12)",zIndex:800,animation:"pop .3s ease"}}>
                {gSaved}
              </div>
            )}

            {/* ─ ENSEIGNE GLOBALE ─ */}
            <div style={{background:"#fff",borderRadius:16,padding:20,marginBottom:18,boxShadow:"0 2px 10px rgba(0,0,0,.06)",border:"1px solid #EDE0D0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  {/* Logo preview */}
                  <div style={{width:48,height:48,borderRadius:13,overflow:"hidden",background:"#FEF3C7",
                               display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                               border:"2px solid #EDE0D0"}}>
                    {logoUrl
                      ? <img src={logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                      : <span style={{fontSize:26}}>{brand.logo}</span>}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:"#1E0E05"}}>{brand.name}</div>
                    <div style={{fontSize:11,color:"#8B7355"}}>{brand.slogan}</div>
                  </div>
                </div>
                <button onClick={function(){ setEditBrand(function(v){ return !v; }); }}
                  style={{padding:"6px 14px",borderRadius:9,border:"1px solid #D5C4B0",background:editBrand?"#1E0E05":"#F7F3EE",color:editBrand?"#FDF8F0":"#5C4A32",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                  {editBrand ? "✕ Annuler" : "✏️ Modifier"}
                </button>
              </div>
              {editBrand && (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["Nom de l'enseigne","name",brand.name],["Slogan","slogan",brand.slogan]].map(function(f){
                    return (
                      <div key={f[1]}>
                        <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>{f[0]}</label>
                        <input value={f[2]} onChange={function(e){ var v=e.target.value; setBrand(function(b){ return Object.assign({},b,{[f[1]]:v}); }); }}
                          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                      </div>
                    );
                  })}
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Numéro TVA (affiché sur les tickets)</label>
                    <input value={tvaNumber} onChange={function(e){ setTvaNumber(e.target.value); }}
                      placeholder="CHE-123.456.789 TVA"
                      style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                  </div>
                  <div style={{gridColumn:"1/-1"}}>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:6}}>Logo de l'enseigne</label>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
                      {/* Upload zone */}
                      <div style={{position:"relative",flexShrink:0}}>
                        <div
                          onClick={function(){ document.getElementById("admin-logo-input").click(); }}
                          style={{width:72,height:72,borderRadius:14,cursor:"pointer",overflow:"hidden",
                                  border:"2px dashed "+(logoUrl?"#C8953A":"#D5C4B0"),
                                  background:logoUrl?"transparent":"#F7F3EE",
                                  display:"flex",alignItems:"center",justifyContent:"center",
                                  position:"relative",transition:"all .18s"}}
                          onMouseOver={function(e){ e.currentTarget.querySelector(".logo-overlay").style.opacity=1; }}
                          onMouseOut={function(e){ e.currentTarget.querySelector(".logo-overlay").style.opacity=0; }}>
                          {logoUrl
                            ? <img src={logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}} />
                            : <div style={{textAlign:"center"}}>
                                <div style={{fontSize:28}}>{brand.logo}</div>
                                <div style={{fontSize:8,color:"#8B7355",marginTop:2}}>Emoji</div>
                              </div>}
                          <div className="logo-overlay"
                            style={{position:"absolute",inset:0,background:"rgba(0,0,0,.52)",
                                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                                    opacity:0,transition:"opacity .15s"}}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span style={{fontSize:8,color:"#fff",marginTop:3}}>{logoUrl?"Changer":"Upload"}</span>
                          </div>
                        </div>
                        <input id="admin-logo-input" type="file" accept="image/*" style={{display:"none"}}
                          onChange={function(e){
                            var file = e.target.files[0];
                            if (!file) return;
                            var reader = new FileReader();
                            reader.onload = function(ev){ setLogoUrl(ev.target.result); };
                            reader.readAsDataURL(file);
                          }} />
                        {logoUrl && (
                          <button onClick={function(){ setLogoUrl(null); }}
                            style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",
                                    background:"#EF4444",border:"2px solid #fff",color:"#fff",
                                    fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",
                                    alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>✕</button>
                        )}
                      </div>
                      {/* Emoji fallback (when no image) */}
                      {!logoUrl && (
                        <div>
                          <div style={{fontSize:9,color:"#8B7355",marginBottom:5}}>Ou choisir un emoji :</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",maxWidth:220}}>
                            {["🥐","🍞","🎂","🧁","🍰","🥖","🌾","⭐","🏅","👑"].map(function(em){
                              return (
                                <button key={em} onClick={function(){ setBrand(function(b){ return Object.assign({},b,{logo:em}); }); }}
                                  style={{width:30,height:30,borderRadius:7,border:"2px solid "+(brand.logo===em?"#C8953A":"#EDE0D0"),
                                          background:brand.logo===em?"#FDF0D8":"#fff",fontSize:16,cursor:"pointer",transition:"all .12s"}}>
                                  {em}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{fontSize:9,color:"#B5A090",marginTop:5}}>Le logo image remplace l'emoji partout.</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Couleur principale</label>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["#C8953A","#1E40AF","#065F46","#DC2626","#7C3AED","#1E0E05"].map(function(c){
                        return (
                          <div key={c} onClick={function(){ setBrand(function(b){ return Object.assign({},b,{primaryColor:c}); }); }}
                            style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:"2px solid "+(brand.primaryColor===c?"#1E0E05":"transparent"),boxSizing:"border-box"}} />
                        );
                      })}
                    </div>
                  </div>
                  <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"flex-end",marginTop:4}}>
                    <button onClick={saveBrand}
                      style={{padding:"8px 20px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                      💾 Sauvegarder l'enseigne
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─ SÉLECTEUR MAGASIN ─ */}
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {stores.map(function(s){
                var active = selStore===s.id;
                return (
                  <div key={s.id} onClick={function(){ setSelStore(s.id); setEditStore(false); setEditStaff(null); }}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",borderRadius:12,cursor:"pointer",
                            background:active?"#1E0E05":"#fff",
                            border:"2px solid "+(active?"#1E0E05":"#EDE0D0"),
                            boxShadow:active?"0 4px 14px rgba(0,0,0,.15)":"0 1px 4px rgba(0,0,0,.05)",
                            transition:"all .18s"}}>
                    <span style={{fontSize:18}}>{s.logo}</span>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:active?"#C8953A":"#1E0E05"}}>{s.address}</div>
                      <div style={{fontSize:9,color:active?"rgba(253,248,240,.45)":"#8B7355"}}>{s.city}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─ DÉTAIL MAGASIN ─ */}
            {(function(){
              var st = stores.find(function(s){ return s.id===selStore; });
              if (!st) return null;
              var editSt = editStore ? Object.assign({},st) : null;

              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

                  {/* Fiche infos */}
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:36,height:36,borderRadius:10,background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{st.logo}</div>
                          <div style={{fontWeight:700,fontSize:14,color:"#1E0E05"}}>Informations</div>
                        </div>
                        <button onClick={function(){ setEditStore(function(v){ return !v; }); }}
                          style={{padding:"5px 12px",borderRadius:8,border:"1px solid #D5C4B0",background:editStore?"#FEE2E2":"#F7F3EE",color:editStore?"#DC2626":"#5C4A32",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .14s"}}>
                          {editStore ? "✕ Annuler" : "✏️ Modifier"}
                        </button>
                      </div>

                      {/* Champs info */}
                      {(function(){
                        var fields = [
                          {label:"Nom complet",    key:"name"},
                          {label:"Adresse",        key:"address"},
                          {label:"Ville / CP",     key:"city"},
                          {label:"Téléphone",      key:"phone"},
                          {label:"Email",          key:"email"},
                        ];
                        return fields.map(function(f){
                          return (
                            <div key={f.key} style={{marginBottom:10}}>
                              <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:3}}>{f.label}</div>
                              {editStore ? (
                                <input defaultValue={st[f.key]} id={"si_"+f.key}
                                  style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                              ) : (
                                <div style={{fontSize:12,fontWeight:500,color:"#1E0E05"}}>{st[f.key]||"—"}</div>
                              )}
                            </div>
                          );
                        });
                      })()}

                      {/* Responsables */}
                      <div style={{borderTop:"1px solid #F0E8DC",paddingTop:12,marginTop:6}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#1E0E05",marginBottom:8}}>👤 Responsables</div>
                        {[["Gérant(e)","gerant"],["Chef de production","chefProd"],["Chef de service","chefService"],["Resp. livraison","chefLivraison"]].map(function(r){
                          return (
                            <div key={r[1]} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                              <span style={{fontSize:10,color:"#8B7355",minWidth:120}}>{r[0]}</span>
                              {editStore ? (
                                <input defaultValue={st[r[1]]} id={"si_"+r[1]}
                                  style={{padding:"4px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",flex:1}} />
                              ) : (
                                <span style={{fontSize:11,fontWeight:600,color:st[r[1]]?"#1E0E05":"#D5C4B0"}}>{st[r[1]]||"Non défini"}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {editStore && (
                        <button onClick={function(){
                          var keys = ["name","address","city","phone","email","gerant","chefProd","chefService","chefLivraison"];
                          var updated = Object.assign({},st);
                          keys.forEach(function(k){
                            var el = document.getElementById("si_"+k);
                            if (el) updated[k] = el.value;
                          });
                          saveStore(updated);
                        }}
                          style={{width:"100%",marginTop:12,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                          💾 Sauvegarder les informations
                        </button>
                      )}
                    </div>

                    {/* Heures d'ouverture */}
                    <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#1E0E05",marginBottom:12}}>🕐 Heures d'ouverture</div>
                      {DAYS.map(function(d){
                        var h = st.openHours[d];
                        return (
                          <div key={d} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontSize:10,fontWeight:600,color:"#5C4A32",minWidth:28}}>{d}</span>
                            {editStore ? (
                              <input defaultValue={h} id={"oh_"+d}
                                placeholder="ex: 07:00-19:30 ou vide si fermé"
                                style={{flex:1,padding:"4px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                            ) : h ? (
                              <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
                                <div style={{flex:1,height:5,background:"#F0E8DC",borderRadius:3,overflow:"hidden"}}>
                                  <div style={{height:"100%",background:"linear-gradient(90deg,#C8953A,#a07228)",borderRadius:3,width:(function(){
                                    var parts = h.split("-"); if(parts.length!==2) return "0%";
                                    var toM = function(t){ var p=t.split(":"); return parseInt(p[0])*60+parseInt(p[1]); };
                                    var start=toM(parts[0]),end=toM(parts[1]),total=toM("20:00")-toM("06:00");
                                    return Math.round((end-start)/total*100)+"%";
                                  })()}} />
                                </div>
                                <span style={{fontSize:11,fontWeight:600,color:"#1E0E05",whiteSpace:"nowrap"}}>{h}</span>
                              </div>
                            ) : (
                              <span style={{fontSize:10,color:"#D5C4B0",fontStyle:"italic"}}>Fermé</span>
                            )}
                          </div>
                        );
                      })}
                      {editStore && (
                        <button onClick={function(){
                          var updated = Object.assign({},st,{openHours:{}});
                          DAYS.forEach(function(d){ var el=document.getElementById("oh_"+d); updated.openHours[d]=el?el.value:""; });
                          saveStore(updated);
                        }}
                          style={{width:"100%",marginTop:10,padding:"8px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                          💾 Sauvegarder les horaires
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Équipe */}
                  <div style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#1E0E05"}}>👥 Équipe ({st.staff.length} membres)</div>
                      <button onClick={function(){ setShowAddStaff(function(v){ return !v; }); setEditStaff(null); }}
                        style={{padding:"5px 12px",borderRadius:8,border:"none",background:showAddStaff?"#FEE2E2":"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:showAddStaff?"#DC2626":"#FDF8F0",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                        {showAddStaff?"✕ Annuler":"+ Ajouter"}
                      </button>
                    </div>

                    {/* Formulaire ajout membre */}
                    {showAddStaff && (
                      <div style={{background:"#F7F3EE",borderRadius:11,padding:13,marginBottom:14,border:"1.5px dashed #C8953A",animation:"slideIn .18s ease"}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                          <div>
                            <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:2}}>Nom *</label>
                            <input value={newStaff.name} onChange={function(e){ setNewStaff(function(p){ return Object.assign({},p,{name:e.target.value}); }); }}
                              placeholder="Prénom Nom"
                              style={{width:"100%",padding:"6px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                          </div>
                          <div>
                            <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:2}}>Rôle</label>
                            <select value={newStaff.role} onChange={function(e){ setNewStaff(function(p){ return Object.assign({},p,{role:e.target.value}); }); }}
                              style={{width:"100%",padding:"6px 9px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                              {ROLES_METIER.map(function(r){ return <option key={r}>{r}</option>; })}
                            </select>
                          </div>
                        </div>
                        <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:4}}>Horaires par jour</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
                          {DAYS.map(function(d){
                            return (
                              <div key={d} style={{textAlign:"center"}}>
                                <div style={{fontSize:8,fontWeight:600,color:"#5C4A32",marginBottom:2}}>{d}</div>
                                <input value={newStaff.hours[d]||""} onChange={function(e){ var v=e.target.value; setNewStaff(function(p){ var h=Object.assign({},p.hours); h[d]=v; return Object.assign({},p,{hours:h}); }); }}
                                  placeholder="08-16"
                                  style={{width:"100%",padding:"3px 2px",borderRadius:5,border:"1px solid #D5C4B0",background:"#fff",fontSize:9,outline:"none",textAlign:"center",fontFamily:"'Outfit',sans-serif"}} />
                              </div>
                            );
                          })}
                        </div>
                        <button disabled={!newStaff.name} onClick={addStaffMember}
                          style={{width:"100%",padding:"7px",borderRadius:8,border:"none",background:newStaff.name?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",color:newStaff.name?"#1E0E05":"#8B7355",fontSize:11,fontWeight:700,cursor:newStaff.name?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
                          ✅ Ajouter le membre
                        </button>
                      </div>
                    )}

                    {/* Liste membres */}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {st.staff.map(function(m, sIdx){
                        var isEd = editStaff===sIdx;
                        var roleColors = {"Gérant(e)":"#7C3AED","Chef de production":"#1E40AF","Chef de service":"#065F46","Responsable livraison":"#C8953A","Vendeur/Vendeuse":"#5C4A32"};
                        var rc = roleColors[m.role]||"#5C4A32";
                        return (
                          <div key={sIdx} style={{background:"#F7F3EE",borderRadius:11,padding:12,border:"1px solid "+(isEd?"#C8953A":"#EDE0D0"),transition:"border-color .15s"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:isEd?10:6}}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:32,height:32,borderRadius:"50%",background:rc+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:rc}}>
                                  {m.name.split(" ").map(function(n){ return n[0]; }).join("").slice(0,2)}
                                </div>
                                <div>
                                  {isEd ? (
                                    <input defaultValue={m.name} id={"sm_name_"+sIdx}
                                      style={{padding:"3px 7px",borderRadius:6,border:"1px solid #C8953A",fontSize:12,fontWeight:600,outline:"none",fontFamily:"'Outfit',sans-serif",width:"130px"}} />
                                  ) : (
                                    <div style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>{m.name}</div>
                                  )}
                                  {isEd ? (
                                    <select defaultValue={m.role} id={"sm_role_"+sIdx}
                                      style={{padding:"2px 6px",borderRadius:5,border:"1px solid #D5C4B0",background:"#fff",fontSize:10,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer",marginTop:2}}>
                                      {ROLES_METIER.map(function(r){ return <option key={r}>{r}</option>; })}
                                    </select>
                                  ) : (
                                    <div style={{fontSize:10,color:rc,fontWeight:600}}>{m.role}</div>
                                  )}
                                </div>
                              </div>
                              <div style={{display:"flex",gap:4}}>
                                {isEd ? (
                                  <>
                                    <button onClick={function(){
                                      var nameEl  = document.getElementById("sm_name_"+sIdx);
                                      var roleEl  = document.getElementById("sm_role_"+sIdx);
                                      var hours   = {};
                                      DAYS.forEach(function(d){ var el=document.getElementById("sm_h_"+sIdx+"_"+d); hours[d]=el?el.value:""; });
                                      saveStaff(sIdx,{name:nameEl?nameEl.value:m.name, role:roleEl?roleEl.value:m.role, hours:hours});
                                    }}
                                      style={{padding:"4px 9px",borderRadius:6,border:"none",background:"#065F46",color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer"}}>✓ OK</button>
                                    <button onClick={function(){ setEditStaff(null); }}
                                      style={{padding:"4px 7px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:10,cursor:"pointer"}}>✕</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={function(){ setEditStaff(sIdx); setShowAddStaff(false); }}
                                      style={{padding:"4px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✏️</button>
                                    <button onClick={function(){ removeStaff(sIdx); }}
                                      style={{padding:"4px 8px",borderRadius:6,border:"1px solid #FCA5A5",background:"#FEF2F2",color:"#DC2626",fontSize:10,cursor:"pointer"}}>🗑</button>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Horaires tableau */}
                            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                              {DAYS.map(function(d){
                                var h = m.hours[d]||"";
                                return (
                                  <div key={d} style={{textAlign:"center"}}>
                                    <div style={{fontSize:8,fontWeight:600,color:"#8B7355",marginBottom:2}}>{d}</div>
                                    {isEd ? (
                                      <input defaultValue={h} id={"sm_h_"+sIdx+"_"+d}
                                        style={{width:"100%",padding:"2px 1px",borderRadius:4,border:"1px solid #C8953A",background:"#fff",fontSize:8,outline:"none",textAlign:"center",fontFamily:"'Outfit',sans-serif"}} />
                                    ) : h ? (
                                      <div style={{background:"#fff",borderRadius:5,padding:"2px 3px",fontSize:8,color:"#1E0E05",fontWeight:500,border:"1px solid #EDE0D0"}}>{h}</div>
                                    ) : (
                                      <div style={{background:"#F0E8DC",borderRadius:5,padding:"3px",fontSize:8,color:"#D5C4B0",textAlign:"center"}}>—</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })()}

          {/* ── Plan de salle par magasin ── */}
          <div style={{marginTop:20}}>
            <div style={{fontWeight:700,color:"#1E0E05",fontSize:15,fontFamily:"'Outfit',sans-serif",marginBottom:12}}>
              🪑 Plans de salle
            </div>
            {stores.map(function(s){
              var storeName = s.address;
              return (
                <div key={s.id} style={{marginBottom:20}}>
                  <FloorPlanEditor
                    store={storeName}
                    layout={tableLayouts[storeName] || []}
                    onSave={function(tables){
                      setTableLayouts(function(prev){ return Object.assign({},prev,{[storeName]:tables}); });
                    }}
                  />
                </div>
              );
            })}
          </div>
          </div>
        )}

        {/* ── TAB: UTILISATEURS ── */}
        {adminTab==="utilisateurs" && (
          <div>

            {/* ─ Header ─ */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"#1E0E05",marginBottom:2}}>👥 Utilisateurs ({users.length})</div>
                <div style={{fontSize:11,color:"#8B7355"}}>Gérez les accès, rôles et permissions de chaque collaborateur</div>
              </div>
              <button onClick={function(){ setShowAddUser(function(v){ return !v; }); setEditUser(null); }}
                style={{padding:"7px 16px",borderRadius:10,border:"none",
                        background:showAddUser?"#FEE2E2":"linear-gradient(135deg,#1E0E05,#3D2B1A)",
                        color:showAddUser?"#DC2626":"#FDF8F0",fontSize:12,fontWeight:700,
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                {showAddUser ? "✕ Annuler" : "+ Nouvel utilisateur"}
              </button>
            </div>

            {/* ─ Formulaire ajout ─ */}
            {showAddUser && (
              <div style={{background:"#fff",borderRadius:16,padding:22,marginBottom:18,
                           border:"2px solid #C8953A",boxShadow:"0 4px 20px rgba(0,0,0,.08)",animation:"slideIn .18s ease"}}>
                <div style={{fontWeight:700,fontSize:14,color:"#1E0E05",marginBottom:16}}>Créer un utilisateur</div>

                {/* Infos de base */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                  {[["Nom complet *","nom","text","Sophie Lacombe"],["Identifiant *","login","text","sophie"],["Mot de passe *","password","password","••••"]].map(function(f){
                    return (
                      <div key={f[1]}>
                        <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>{f[0]}</label>
                        <input type={f[2]} value={newUser[f[1]]} placeholder={f[3]}
                          onChange={function(e){ var v=e.target.value; setNewUser(function(u){ return Object.assign({},u,{[f[1]]:v}); }); }}
                          style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}} />
                      </div>
                    );
                  })}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div>
                    <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Rôle de base</label>
                    <select value={newUser.role}
                      onChange={function(e){
                        var r = e.target.value;
                        setNewUser(function(u){ return Object.assign({},u,{role:r,permissions:defaultPerms(r),store:(r==="livreur"||r==="production"||r==="admin")?"":u.store}); });
                      }}
                      style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                      {ROLE_OPTS.map(function(r){ return <option key={r.id} value={r.id}>{r.icon} {r.label}</option>; })}
                    </select>
                  </div>
                  {(newUser.role==="gerant"||newUser.role==="vendeuse") && (
                    <div>
                      <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,display:"block",marginBottom:3}}>Magasin assigné</label>
                      <select value={newUser.store||""}
                        onChange={function(e){ setNewUser(function(u){ return Object.assign({},u,{store:e.target.value}); }); }}
                        style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                        <option value="">-- Aucun --</option>
                        {STORES.map(function(s){ return <option key={s} value={s}>{s}</option>; })}
                      </select>
                    </div>
                  )}
                </div>

                {/* Bloc permissions pour ajout */}
                {(function(){
                  var p = newUser.permissions || defaultPerms(newUser.role);
                  function toggleNewPerm(group, id) {
                    setNewUser(function(u){
                      var cur = (u.permissions||defaultPerms(u.role));
                      var arr = cur[group]||[];
                      var next = arr.indexOf(id)>=0 ? arr.filter(function(x){return x!==id;}) : arr.concat([id]);
                      return Object.assign({},u,{permissions:Object.assign({},cur,{[group]:next})});
                    });
                  }
                  return (
                    <div style={{background:"#F7F3EE",borderRadius:12,padding:14,marginBottom:14}}>
                      <div style={{fontSize:11,fontWeight:700,color:"#1E0E05",marginBottom:10}}>🔐 Permissions personnalisées</div>
                      {[
                        {key:"screens",   title:"Écrans accessibles",        items:PERMS_DEF.screens},
                        {key:"adminTabs", title:"Onglets admin visibles",     items:PERMS_DEF.adminTabs},
                        {key:"features",  title:"Fonctionnalités autorisées", items:PERMS_DEF.features},
                      ].map(function(grp){
                        return (
                          <div key={grp.key} style={{marginBottom:10}}>
                            <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:5}}>{grp.title}</div>
                            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                              {grp.items.map(function(item){
                                var active = (p[grp.key]||[]).indexOf(item.id)>=0;
                                return (
                                  <div key={item.id} onClick={function(){ toggleNewPerm(grp.key,item.id); }}
                                    style={{padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:10,
                                            border:"1.5px solid "+(active?"#C8953A":"#D5C4B0"),
                                            background:active?"#FDF0D8":"#fff",
                                            color:active?"#92400E":"#8B7355",
                                            fontWeight:active?600:400,transition:"all .12s"}}>
                                    {item.label}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:10,color:"#8B7355"}}>💡 Rôle de base = permissions par défaut, modifiables ci-dessus</div>
                  <button disabled={!newUser.login||!newUser.password||!newUser.nom} onClick={addUser}
                    style={{padding:"9px 20px",borderRadius:9,border:"none",
                            background:newUser.login&&newUser.password&&newUser.nom?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                            color:newUser.login&&newUser.password&&newUser.nom?"#1E0E05":"#8B7355",
                            fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    ✅ Créer l'utilisateur
                  </button>
                </div>
              </div>
            )}

            {/* ─ Liste utilisateurs ─ */}
            <div style={{display:"grid",gap:10}}>
              {users.map(function(u){
                var roleInfo   = ROLE_OPTS.find(function(r){ return r.id===u.role; })||{icon:"❓",label:u.role};
                var isEd       = editUser && editUser.id===u.id;
                var roleColors = {admin:"#7C3AED",gerant:"#C8953A",vendeuse:"#3B82F6",production:"#10B981",livreur:"#F59E0B"};
                var rc         = roleColors[u.role]||"#5C4A32";
                var uPerms     = u.permissions || defaultPerms(u.role);

                return (
                  <div key={u.id} style={{background:"#fff",borderRadius:14,
                                           boxShadow:"0 2px 10px rgba(0,0,0,.05)",
                                           border:"1.5px solid "+(isEd?"#C8953A":u.actif?"#EDE0D0":"#EDE0D0"),
                                           opacity:u.actif?1:.55,transition:"all .15s",overflow:"hidden"}}>

                    {/* ─ Ligne résumé cliquable ─ */}
                    <div style={{padding:"13px 16px",display:"flex",alignItems:"center",gap:12,
                                 cursor:"pointer",background:isEd?"#FFFBF4":"transparent"}}
                      onClick={function(){ setEditUser(isEd ? null : Object.assign({},u,{permissions:uPerms})); setShowAddUser(false); }}>

                      {/* Avatar */}
                      <div style={{width:42,height:42,borderRadius:"50%",background:rc+"18",border:"2px solid "+rc+"44",
                                   display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:17}}>
                        {roleInfo.icon}
                      </div>

                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap"}}>
                          <span style={{fontWeight:700,fontSize:13,color:"#1E0E05"}}>{u.nom}</span>
                          <span style={{background:rc+"18",color:rc,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10}}>{roleInfo.icon} {roleInfo.label}</span>
                          {!u.actif && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:600,padding:"1px 7px",borderRadius:8}}>Inactif</span>}
                        </div>
                        <div style={{display:"flex",gap:12,fontSize:10,color:"#8B7355",flexWrap:"wrap"}}>
                          <span>🔑 {u.login}</span>
                          {u.store && <span>📍 {u.store}</span>}
                          {/* Mini badges permissions */}
                          <span style={{color:"rgba(0,0,0,.3)"}}>·</span>
                          {(uPerms.screens||[]).map(function(s){
                            var ri=ROLE_OPTS.find(function(r){return r.id===s;})||{icon:"?"};
                            return <span key={s} title={s} style={{fontSize:11}}>{ri.icon}</span>;
                          })}
                        </div>
                      </div>

                      <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
                        <button onClick={function(e){ e.stopPropagation(); toggleUserActif(u.id); }}
                          style={{padding:"4px 9px",borderRadius:7,border:"1px solid #EDE0D0",
                                  background:u.actif?"#F7F3EE":"#D1FAE5",
                                  color:u.actif?"#8B7355":"#065F46",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                          {u.actif ? "⏸" : "▶"}
                        </button>
                        {u.id!==1 && (
                          confirmDeleteId === u.id ? (
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              <span style={{fontSize:9,color:"#DC2626",fontWeight:600}}>Supprimer ?</span>
                              <button onClick={function(e){ e.stopPropagation(); deleteUser(u.id); setConfirmDeleteId(null); }}
                                style={{padding:"3px 7px",borderRadius:6,border:"none",background:"#DC2626",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer"}}>Oui</button>
                              <button onClick={function(e){ e.stopPropagation(); setConfirmDeleteId(null); }}
                                style={{padding:"3px 7px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:9,cursor:"pointer"}}>Non</button>
                            </div>
                          ) : (
                            <button onClick={function(e){ e.stopPropagation(); setConfirmDeleteId(u.id); }}
                              style={{padding:"4px 9px",borderRadius:7,border:"1px solid #FCA5A5",background:"#FEF2F2",color:"#DC2626",fontSize:10,cursor:"pointer"}}>🗑</button>
                          )
                        )}
                        <span style={{fontSize:11,color:"#C8953A",transition:"transform .2s",display:"inline-block",
                                       transform:isEd?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                      </div>
                    </div>

                    {/* ─ Panel d'édition dépliable ─ */}
                    {isEd && (
                      <div style={{padding:"0 16px 16px",borderTop:"1px solid #F0E8DC"}}>

                        {/* Infos de base */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,margin:"14px 0 10px"}}>
                          {[["Nom","nom"],["Login","login"],["Mot de passe","password"]].map(function(f){
                            return (
                              <div key={f[1]}>
                                <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:2}}>{f[0]}</label>
                                <input value={editUser[f[1]]||""}
                                  onChange={function(e){ var v=e.target.value; setEditUser(function(eu){ return Object.assign({},eu,{[f[1]]:v}); }); }}
                                  style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #C8953A",background:"#FFFBF4",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}} />
                              </div>
                            );
                          })}
                        </div>

                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                          <div>
                            <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4}}>Rôle de base</label>
                            <select value={editUser.role}
                              onChange={function(e){
                                var r=e.target.value;
                                setEditUser(function(eu){ return Object.assign({},eu,{role:r,permissions:defaultPerms(r)}); });
                              }}
                              style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #C8953A",background:"#FFFBF4",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                              {ROLE_OPTS.map(function(r){ return <option key={r.id} value={r.id}>{r.icon} {r.label}</option>; })}
                            </select>
                          </div>
                          <div>
                            <label style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4}}>Magasin</label>
                            <select value={editUser.store||""}
                              onChange={function(e){ setEditUser(function(eu){ return Object.assign({},eu,{store:e.target.value}); }); }}
                              style={{width:"100%",padding:"7px 9px",borderRadius:7,border:"1px solid #C8953A",background:"#FFFBF4",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",cursor:"pointer"}}>
                              <option value="">-- Aucun --</option>
                              {STORES.map(function(s){ return <option key={s} value={s}>{s}</option>; })}
                            </select>
                          </div>
                        </div>

                        {/* ── Éditeur de permissions ── */}
                        <div style={{background:"#F7F3EE",borderRadius:12,padding:14,marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                            <div style={{fontSize:11,fontWeight:700,color:"#1E0E05"}}>🔐 Permissions</div>
                            <div style={{display:"flex",gap:6}}>
                              {ROLE_OPTS.map(function(r){
                                return (
                                  <button key={r.id} onClick={function(){
                                    setEditUser(function(eu){ return Object.assign({},eu,{permissions:defaultPerms(r.id)}); });
                                  }}
                                    title={"Preset "+r.label}
                                    style={{padding:"3px 8px",borderRadius:8,border:"1px solid #D5C4B0",background:"#fff",
                                            fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                                            color:"#5C4A32",transition:"all .12s"}}
                                    onMouseOver={function(e){e.currentTarget.style.borderColor="#C8953A";e.currentTarget.style.color="#C8953A";}}
                                    onMouseOut={function(e){e.currentTarget.style.borderColor="#D5C4B0";e.currentTarget.style.color="#5C4A32";}}>
                                    {r.icon}
                                  </button>
                                );
                              })}
                              <span style={{fontSize:9,color:"#8B7355",alignSelf:"center",marginLeft:2}}>presets</span>
                            </div>
                          </div>

                          {[
                            {key:"screens",   title:"📺 Écrans accessibles",       items:PERMS_DEF.screens},
                            {key:"adminTabs", title:"🗂 Onglets admin",             items:PERMS_DEF.adminTabs},
                            {key:"features",  title:"⚡ Fonctionnalités",           items:PERMS_DEF.features},
                          ].map(function(grp){
                            var curArr = (editUser.permissions||{})[grp.key]||[];
                            return (
                              <div key={grp.key} style={{marginBottom:10}}>
                                <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8,marginBottom:5,fontWeight:600}}>{grp.title}</div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                  {grp.items.map(function(item){
                                    var active = curArr.indexOf(item.id)>=0;
                                    return (
                                      <div key={item.id} onClick={function(){
                                        setEditUser(function(eu){
                                          var p = eu.permissions||defaultPerms(eu.role);
                                          var arr = p[grp.key]||[];
                                          var next = active ? arr.filter(function(x){return x!==item.id;}) : arr.concat([item.id]);
                                          return Object.assign({},eu,{permissions:Object.assign({},p,{[grp.key]:next})});
                                        });
                                      }}
                                        style={{padding:"5px 11px",borderRadius:20,cursor:"pointer",fontSize:10,
                                                border:"1.5px solid "+(active?"#C8953A":"#D5C4B0"),
                                                background:active?"#FDF0D8":"#fff",
                                                color:active?"#92400E":"#8B7355",
                                                fontWeight:active?600:400,transition:"all .12s",userSelect:"none"}}>
                                        {item.label}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                          <button onClick={function(){ setEditUser(null); }}
                            style={{padding:"7px 13px",borderRadius:8,border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",fontSize:11,cursor:"pointer"}}>✕ Annuler</button>
                          <button onClick={function(){ saveUser(editUser); }}
                            style={{padding:"7px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                            💾 Sauvegarder
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── ONGLET SUPERVISION (admin only) ───────────────────── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {adminTab==="supervision" && (function(){
          // ── Filtrage des ventes ──
          var today = new Date().toLocaleDateString("fr-CH");
          var allSales = sales || [];
          var filteredSales = storeFilter==="all" ? allSales : allSales.filter(function(s){ return s.store===storeFilter; });

          // ── Dates helper ──
          function parseDate(d) { var p=d.split("."); return new Date(p[2],p[1]-1,p[0]); }
          var now = new Date();
          var startOfWeek = new Date(now); startOfWeek.setDate(now.getDate()-now.getDay()+1); startOfWeek.setHours(0,0,0,0);
          var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          var salesToday = filteredSales.filter(function(s){ return s.date===today; });
          var salesWeek  = filteredSales.filter(function(s){ return parseDate(s.date)>=startOfWeek; });
          var salesMonth = filteredSales.filter(function(s){ return parseDate(s.date)>=startOfMonth; });

          var caToday = salesToday.reduce(function(a,s){ return a+s.total; },0);
          var caWeek  = salesWeek.reduce(function(a,s){ return a+s.total; },0);
          var caMonth = salesMonth.reduce(function(a,s){ return a+s.total; },0);
          var txToday = salesToday.length;
          var avgToday = txToday>0 ? caToday/txToday : 0;

          // ── Par méthode de paiement ──
          var byCash=0, byCard=0, bySplit=0;
          salesToday.forEach(function(s){
            if(s.payInfo.method==="cash") byCash+=s.total;
            else if(s.payInfo.method==="split"){ bySplit+=s.total; }
            else byCard+=s.total;
          });

          // ── Par magasin ──
          var byStore = {};
          STORES.forEach(function(st){ byStore[st]={ca:0,tx:0,items:0}; });
          salesToday.forEach(function(s){
            if(byStore[s.store]){
              byStore[s.store].ca+=s.total;
              byStore[s.store].tx++;
              byStore[s.store].items+=s.items.reduce(function(a,i){return a+i.qty;},0);
            }
          });

          // ── Par vendeur (basé sur client prefix "Table" ou nom) ──
          var byClient = {};
          salesToday.forEach(function(s){
            var key = s.client || "Anonyme";
            if(!byClient[key]) byClient[key]={ca:0,tx:0};
            byClient[key].ca+=s.total;
            byClient[key].tx++;
          });
          var clientRanking = Object.keys(byClient).map(function(k){ return {name:k,ca:byClient[k].ca,tx:byClient[k].tx}; })
            .sort(function(a,b){ return b.ca-a.ca; });

          // ── Par vendeuse ──
          var bySeller = {};
          salesToday.forEach(function(s){
            var key = s.seller || "Inconnu";
            if(!bySeller[key]) bySeller[key]={name:key,ca:0,tx:0,items:0,stores:{}};
            bySeller[key].ca+=s.total;
            bySeller[key].tx++;
            bySeller[key].items+=s.items.reduce(function(a,i){return a+i.qty;},0);
            bySeller[key].stores[s.store]=true;
          });
          var sellerRanking = Object.values(bySeller).sort(function(a,b){ return b.ca-a.ca; });
          var maxSellerCA = sellerRanking.length>0 ? sellerRanking[0].ca : 1;

          // ── Par vendeuse (toutes périodes) ──
          var bySellerAll = {};
          filteredSales.forEach(function(s){
            var key = s.seller || "Inconnu";
            if(!bySellerAll[key]) bySellerAll[key]={name:key,ca:0,tx:0};
            bySellerAll[key].ca+=s.total;
            bySellerAll[key].tx++;
          });
          var sellerRankingAll = Object.values(bySellerAll).sort(function(a,b){ return b.ca-a.ca; });

          // ── Top produits ──
          var prodMap = {};
          salesToday.forEach(function(s){
            s.items.forEach(function(i){
              if(!prodMap[i.name]) prodMap[i.name]={name:i.name,qty:0,ca:0,emoji:i.emoji||"📦"};
              prodMap[i.name].qty+=i.qty;
              prodMap[i.name].ca+=i.price*i.qty;
            });
          });
          var topProducts = Object.values(prodMap).sort(function(a,b){ return b.ca-a.ca; });

          // ── Anomalies / erreurs ──
          var anomalies = [];
          salesToday.forEach(function(s){
            if(s.total===0) anomalies.push({type:"zero",label:"Montant zéro",sale:s});
            if(s.total>500) anomalies.push({type:"high",label:"Montant élevé (>500 CHF)",sale:s});
            if(s.payInfo.method==="cash" && s.payInfo.change>50) anomalies.push({type:"change",label:"Rendu monnaie > 50 CHF",sale:s});
            if(!s.client || s.client==="Client anonyme") anomalies.push({type:"anon",label:"Client non identifié",sale:s});
          });

          // ── Heures de pointe ──
          var byHour = {};
          salesToday.forEach(function(s){
            var h = s.time ? s.time.split(":")[0] : "??";
            if(!byHour[h]) byHour[h]={h:h,ca:0,tx:0};
            byHour[h].ca+=s.total;
            byHour[h].tx++;
          });
          var hourData = Object.values(byHour).sort(function(a,b){ return a.h.localeCompare(b.h); });
          var maxHourCA = hourData.reduce(function(m,h){ return Math.max(m,h.ca); },1);

          return (
            <div>
              {allSales.length===0 && (
                <div style={{background:"#FEF3C7",borderRadius:12,padding:"14px 18px",marginBottom:14,border:"1.5px solid #F59E0B",display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:20}}>📊</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#92400E"}}>Aucune vente — chargez les données démo</div>
                  </div>
                  <button onClick={loadDemoData}
                    style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#1E0E05",color:"#C8953A",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    🔄 Charger démo
                  </button>
                </div>
              )}
              {/* ── KPIs globaux ── */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
                {[
                  {label:"CA Aujourd'hui",val:"CHF "+caToday.toFixed(2),bg:"linear-gradient(135deg,#C8953A,#a07228)",c:"#fff"},
                  {label:"Transactions",  val:txToday,                     bg:"linear-gradient(135deg,#1E40AF,#2563EB)",c:"#fff"},
                  {label:"Ticket moyen",  val:"CHF "+avgToday.toFixed(2), bg:"linear-gradient(135deg,#065F46,#059669)",c:"#fff"},
                  {label:"CA Semaine",    val:"CHF "+caWeek.toFixed(2),   bg:"#fff",c:"#1E0E05",border:true},
                  {label:"CA Mois",       val:"CHF "+caMonth.toFixed(2),  bg:"#fff",c:"#1E0E05",border:true},
                  {label:"Total ventes",  val:filteredSales.length+" tickets",bg:"#fff",c:"#1E0E05",border:true},
                ].map(function(k){
                  return (
                    <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"14px 16px",
                                               border:k.border?"1.5px solid #EDE0D0":"none"}}>
                      <div style={{fontSize:20,fontWeight:800,fontFamily:"'Outfit',sans-serif",color:k.c,marginBottom:2}}>{k.val}</div>
                      <div style={{fontSize:9,color:k.c,opacity:.7,textTransform:"uppercase",letterSpacing:.8}}>{k.label}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

                {/* ── CA par magasin ── */}
                <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>🏪 CA par magasin (jour)</h4>
                  {STORES.map(function(st){
                    var d = byStore[st];
                    var pct = caToday>0 ? (d.ca/caToday*100) : 0;
                    return (
                      <div key={st} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                          <span style={{color:"#5C4A32",fontWeight:600}}>{st.split(" ").slice(0,3).join(" ")}</span>
                          <span style={{color:"#C8953A",fontWeight:700}}>CHF {d.ca.toFixed(2)} · {d.tx} tx</span>
                        </div>
                        <div style={{height:8,background:"#F7F3EE",borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:pct+"%",height:"100%",background:"linear-gradient(90deg,#C8953A,#a07228)",borderRadius:4,
                                       transition:"width .4s ease"}} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Par méthode de paiement ── */}
                <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>💳 Paiements (jour)</h4>
                  {[
                    {label:"Carte",  val:byCard,  icon:"💳",c:"#3B82F6",bg:"#DBEAFE"},
                    {label:"Espèces",val:byCash,   icon:"💵",c:"#059669",bg:"#D1FAE5"},
                    {label:"Mixte",  val:bySplit,  icon:"🔀",c:"#8B5CF6",bg:"#F3E8FF"},
                  ].map(function(m){
                    var pct = caToday>0 ? (m.val/caToday*100) : 0;
                    return (
                      <div key={m.label} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <div style={{width:32,height:32,borderRadius:8,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                          {m.icon}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
                            <span style={{color:"#5C4A32",fontWeight:600}}>{m.label}</span>
                            <span style={{color:m.c,fontWeight:700}}>CHF {m.val.toFixed(2)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div style={{height:6,background:"#F7F3EE",borderRadius:3,overflow:"hidden"}}>
                            <div style={{width:pct+"%",height:"100%",background:m.c,borderRadius:3,transition:"width .4s ease"}} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>

                {/* ── Heures de pointe ── */}
                <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>⏰ Activité par heure</h4>
                  {hourData.length===0 ? (
                    <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune vente aujourd'hui</div>
                  ) : (
                    <div style={{display:"flex",alignItems:"flex-end",gap:4,height:100}}>
                      {hourData.map(function(h){
                        var pct = h.ca/maxHourCA*100;
                        return (
                          <div key={h.h} style={{flex:1,textAlign:"center"}}>
                            <div style={{background:"linear-gradient(180deg,#C8953A,#a07228)",borderRadius:"4px 4px 0 0",
                                         height:Math.max(4,pct)+"%",transition:"height .3s ease",minHeight:4}} />
                            <div style={{fontSize:8,color:"#8B7355",marginTop:3,fontWeight:600}}>{h.h}h</div>
                            <div style={{fontSize:7,color:"#C8953A",fontWeight:700}}>{h.tx}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Top produits ── */}
                <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>🏆 Top produits (jour)</h4>
                  {topProducts.length===0 ? (
                    <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune vente</div>
                  ) : topProducts.slice(0,8).map(function(p,idx){
                    return (
                      <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,
                                                 padding:"5px 8px",borderRadius:8,background:idx<3?"#FDF0D8":"transparent"}}>
                        <span style={{fontSize:9,color:"#8B7355",fontWeight:700,minWidth:16}}>{idx+1}.</span>
                        <span style={{fontSize:14}}>{p.emoji}</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#1E0E05",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>{p.qty}×</div>
                          <div style={{fontSize:9,color:"#8B7355"}}>CHF {p.ca.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Anomalies / Alertes ── */}
              <div style={{background:anomalies.length>0?"#FEF3C7":"#D1FAE5",borderRadius:16,padding:18,
                           border:"1.5px solid "+(anomalies.length>0?"#F59E0B":"#10B981"),marginBottom:20}}>
                <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:anomalies.length>0?"#92400E":"#065F46",margin:"0 0 10px"}}>
                  {anomalies.length>0 ? "⚠️ Anomalies détectées ("+anomalies.length+")" : "✅ Aucune anomalie détectée"}
                </h4>
                {anomalies.length>0 && (
                  <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
                    {anomalies.map(function(a,idx){
                      var colors = {zero:{bg:"#FEE2E2",c:"#991B1B"},high:{bg:"#FEF3C7",c:"#92400E"},change:{bg:"#F3E8FF",c:"#7C3AED"},anon:{bg:"#F7F3EE",c:"#5C4A32"}};
                      var st = colors[a.type] || colors.anon;
                      return (
                        <div key={idx} style={{display:"flex",alignItems:"center",gap:10,background:st.bg,borderRadius:8,padding:"7px 10px"}}>
                          <span style={{fontSize:11,fontWeight:700,color:st.c}}>{a.label}</span>
                          <span style={{fontSize:10,color:st.c,opacity:.7}}>— {a.sale.id} · {a.sale.client} · {a.sale.time} · CHF {a.sale.total.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Performance par vendeuse ── */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>🛒 Performance vendeuses (jour)</h4>
                  {sellerRanking.length===0 ? (
                    <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune vente aujourd'hui</div>
                  ) : sellerRanking.map(function(v,idx){
                    var pct = v.ca/maxSellerCA*100;
                    var storeList = Object.keys(v.stores).map(function(s){ return s.split(" ").slice(0,2).join(" "); }).join(", ");
                    return (
                      <div key={v.name} style={{marginBottom:12,padding:"8px 10px",borderRadius:10,
                                                 background:idx===0?"linear-gradient(135deg,#FDF8F0,#FDF0D8)":"transparent",
                                                 border:idx===0?"1.5px solid #C8953A":"1px solid transparent"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:idx===0?"#C8953A":"#F7F3EE",
                                         display:"flex",alignItems:"center",justifyContent:"center",
                                         fontSize:11,fontWeight:700,color:idx===0?"#fff":"#5C4A32"}}>{idx+1}</div>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:"#1E0E05"}}>{v.name}</div>
                              <div style={{fontSize:9,color:"#8B7355"}}>{storeList}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:13,fontWeight:800,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {v.ca.toFixed(2)}</div>
                            <div style={{fontSize:9,color:"#8B7355"}}>{v.tx} ticket{v.tx>1?"s":""} · {v.items} art.</div>
                          </div>
                        </div>
                        <div style={{height:6,background:"#F7F3EE",borderRadius:3,overflow:"hidden"}}>
                          <div style={{width:pct+"%",height:"100%",background:idx===0?"linear-gradient(90deg,#C8953A,#a07228)":"#DBC9A8",
                                       borderRadius:3,transition:"width .4s ease"}} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>📊 Historique vendeuses (total)</h4>
                  {sellerRankingAll.length===0 ? (
                    <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune donnée</div>
                  ) : (
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{background:"#F7F3EE"}}>
                          <th style={{padding:"7px 6px",textAlign:"left",color:"#5C4A32",fontWeight:700,fontSize:10}}>Vendeuse</th>
                          <th style={{padding:"7px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>Tickets</th>
                          <th style={{padding:"7px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>CA Total</th>
                          <th style={{padding:"7px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>Moy/ticket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellerRankingAll.map(function(v,idx){
                          var avg = v.tx>0 ? v.ca/v.tx : 0;
                          return (
                            <tr key={v.name} className="tr" style={{borderBottom:"1px solid #F7F3EE"}}>
                              <td style={{padding:"7px 6px",fontWeight:600,color:"#1E0E05"}}>{v.name}</td>
                              <td style={{padding:"7px 6px",textAlign:"right",color:"#5C4A32"}}>{v.tx}</td>
                              <td style={{padding:"7px 6px",textAlign:"right",fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {v.ca.toFixed(2)}</td>
                              <td style={{padding:"7px 6px",textAlign:"right",color:"#8B7355"}}>CHF {avg.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── Clients / Tickets ranking ── */}
              <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0",marginBottom:20}}>
                <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:"0 0 12px"}}>👤 Clients / Tickets du jour</h4>
                {clientRanking.length===0 ? (
                  <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune vente</div>
                ) : clientRanking.slice(0,15).map(function(c,idx){
                  return (
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",
                                           borderBottom:idx<clientRanking.length-1?"1px solid #F7F3EE":"none"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"#F7F3EE",display:"flex",alignItems:"center",
                                   justifyContent:"center",fontSize:11,fontWeight:700,color:"#5C4A32",flexShrink:0}}>{idx+1}</div>
                      <div style={{flex:1,fontSize:12,fontWeight:600,color:"#1E0E05"}}>{c.name}</div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {c.ca.toFixed(2)}</div>
                        <div style={{fontSize:9,color:"#8B7355"}}>{c.tx} ticket{c.tx>1?"s":""}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Historique complet des tickets ── */}
              <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:0}}>
                    🧾 Tous les tickets ({filteredSales.length})
                  </h4>
                  {canExportData && filteredSales.length>0 && (
                    <button onClick={function(){
                      var csv = "ID;Date;Heure;Magasin;Vendeuse;Client;Articles;Total;Paiement;Rendu\n";
                      filteredSales.forEach(function(s){
                        csv += [s.id,s.date,s.time,s.store,s.seller||"",s.client,
                          s.items.map(function(i){return i.qty+"x "+i.name;}).join(" + "),
                          s.total.toFixed(2),s.payInfo.method,
                          (s.payInfo.change||0).toFixed(2)].join(";")+"\n";
                      });
                      var blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
                      var url = URL.createObjectURL(blob);
                      var a = document.createElement("a");
                      a.href=url; a.download="bakery_ventes_"+today.replace(/\./g,"-")+".csv";
                      a.click(); URL.revokeObjectURL(url);
                    }}
                      style={{padding:"6px 14px",borderRadius:8,border:"1px solid #EDE0D0",
                              background:"#F7F3EE",color:"#5C4A32",fontSize:11,fontWeight:700,
                              cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:5}}>
                      📤 Export CSV
                    </button>
                  )}
                </div>
                <div style={{maxHeight:400,overflowY:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{background:"#F7F3EE",position:"sticky",top:0}}>
                        {["ID","Heure","Magasin","Vendeuse","Client","Articles","Total","Paiement"].map(function(h){
                          return <th key={h} style={{padding:"8px 6px",textAlign:"left",color:"#5C4A32",fontWeight:700,fontSize:10,
                                                     borderBottom:"1.5px solid #EDE0D0",whiteSpace:"nowrap"}}>{h}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length===0 ? (
                        <tr><td colSpan={8} style={{padding:"24px",textAlign:"center",color:"#8B7355"}}>Aucune vente enregistrée</td></tr>
                      ) : filteredSales.map(function(s){
                        var mIcon = s.payInfo.method==="card"?"💳":s.payInfo.method==="cash"?"💵":"🔀";
                        var isAnomaly = s.total===0 || s.total>500;
                        var isOpen = expandedTicket===s.id;
                        return React.createElement(React.Fragment, {key:s.id},
                          React.createElement("tr", {className:"tr",
                            onClick:function(){ setExpandedTicket(isOpen?null:s.id); },
                            style:{borderBottom:isOpen?"none":"1px solid #F7F3EE",
                                   background:isOpen?"#FDF8F0":isAnomaly?"#FEF3C7":"transparent",
                                   cursor:"pointer",transition:"background .15s"}},
                            React.createElement("td",{style:{padding:"7px 6px",fontWeight:600,color:"#1E0E05",whiteSpace:"nowrap"}},
                              (isOpen?"▼ ":"▶ ")+s.id),
                            React.createElement("td",{style:{padding:"7px 6px",color:"#5C4A32"}},s.date+" "+s.time),
                            React.createElement("td",{style:{padding:"7px 6px",color:"#5C4A32",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},
                              s.store?s.store.split(" ").slice(0,3).join(" "):"—"),
                            React.createElement("td",{style:{padding:"7px 6px",color:"#5C4A32",fontWeight:500,whiteSpace:"nowrap"}},s.seller||"—"),
                            React.createElement("td",{style:{padding:"7px 6px",color:"#1E0E05",fontWeight:500}},s.client),
                            React.createElement("td",{style:{padding:"7px 6px",color:"#8B7355",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},
                              s.items.map(function(i){return i.qty+"× "+i.name;}).join(", ")),
                            React.createElement("td",{style:{padding:"7px 6px",fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}},
                              "CHF "+s.total.toFixed(2)),
                            React.createElement("td",{style:{padding:"7px 6px"}},
                              React.createElement("span",{style:{display:"inline-flex",alignItems:"center",gap:3}},
                                mIcon," ",
                                React.createElement("span",{style:{fontSize:9,color:"#5C4A32"}},s.payInfo.method),
                                s.payInfo.change>0 && React.createElement("span",{style:{fontSize:8,color:"#8B7355"}}," (rendu "+s.payInfo.change.toFixed(2)+")")
                              ))
                          ),
                          /* ── Ticket de caisse déplié ── */
                          isOpen && React.createElement("tr", {style:{background:"#FDF8F0",borderBottom:"2px solid #EDE0D0"}},
                            React.createElement("td", {colSpan:8, style:{padding:"0 6px 12px"}},
                              React.createElement("div", {style:{
                                maxWidth:320, margin:"8px auto", background:"#fff", borderRadius:12, padding:"20px 24px",
                                boxShadow:"0 4px 20px rgba(0,0,0,.08)", border:"1.5px dashed #EDE0D0",
                                fontFamily:"'Courier New',monospace", fontSize:12, color:"#1E0E05"
                              }},
                                /* En-tête ticket */
                                React.createElement("div",{style:{textAlign:"center",marginBottom:12}},
                                  React.createElement("div",{style:{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:800,color:"#1E0E05",letterSpacing:.5}},
                                    (tenant||"BakeryOS").toUpperCase()),
                                  React.createElement("div",{style:{fontSize:10,color:"#8B7355",marginTop:2}},s.store||""),
                                  React.createElement("div",{style:{borderBottom:"1px dashed #DBC9A8",margin:"8px 0"}}),
                                  React.createElement("div",{style:{fontSize:10,color:"#5C4A32"}},s.date+" · "+s.time),
                                  React.createElement("div",{style:{fontSize:10,color:"#5C4A32"}},"Ticket: "+s.id)
                                ),
                                /* Client / Vendeuse */
                                React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:10,color:"#5C4A32",marginBottom:8}},
                                  React.createElement("span",null,"Client: "+(s.client||"—")),
                                  React.createElement("span",null,"Caisse: "+(s.seller||"—"))
                                ),
                                React.createElement("div",{style:{borderBottom:"1px dashed #DBC9A8",margin:"6px 0"}}),
                                /* Articles */
                                s.items.map(function(item,idx){
                                  var lineTotal = item.qty * item.price;
                                  return React.createElement("div",{key:idx,style:{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:11}},
                                    React.createElement("span",{style:{flex:1}},
                                      (item.emoji||"")+" "+item.qty+"× "+item.name),
                                    React.createElement("span",{style:{fontWeight:600,whiteSpace:"nowrap",marginLeft:8}},
                                      "CHF "+lineTotal.toFixed(2))
                                  );
                                }),
                                React.createElement("div",{style:{borderBottom:"2px solid #1E0E05",margin:"8px 0"}}),
                                /* Total */
                                React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800}},
                                  React.createElement("span",null,"TOTAL TTC"),
                                  React.createElement("span",{style:{color:"#C8953A"}},"CHF "+s.total.toFixed(2))
                                ),
                                /* TVA */
                                (function(){
                                  var tv = s.tvaInfo || computeTVA(s.items);
                                  return React.createElement("div",{style:{margin:"6px 0"}},
                                    tv.lines.map(function(l){
                                      return React.createElement("div",{key:l.rate,style:{display:"flex",justifyContent:"space-between",fontSize:9,color:"#8B7355",marginBottom:1}},
                                        React.createElement("span",null,"dont TVA "+l.rate+"%"),
                                        React.createElement("span",null,"CHF "+l.tva.toFixed(2))
                                      );
                                    }),
                                    React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:9,color:"#8B7355",borderTop:"1px dotted #DBC9A8",paddingTop:2,marginTop:2}},
                                      React.createElement("span",null,"Total HT"),
                                      React.createElement("span",null,"CHF "+tv.totalHT.toFixed(2))
                                    )
                                  );
                                })(),
                                /* Paiement */
                                React.createElement("div",{style:{borderBottom:"1px dashed #DBC9A8",margin:"8px 0"}}),
                                React.createElement("div",{style:{fontSize:10,color:"#5C4A32",textAlign:"center"}},
                                  "Payé par "+s.payInfo.method.toUpperCase()+
                                  (s.payInfo.given ? " · Donné: CHF "+s.payInfo.given.toFixed(2) : "")+
                                  (s.payInfo.change>0 ? " · Rendu: CHF "+s.payInfo.change.toFixed(2) : "")
                                ),
                                /* Pied */
                                React.createElement("div",{style:{textAlign:"center",marginTop:12,fontSize:10,color:"#8B7355",fontFamily:"'Outfit',sans-serif"}},
                                  "Merci de votre visite ! 🥐")
                              )
                            )
                          )
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Remboursements du jour ── */}
              {refunds && refunds.length > 0 && (
                <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",border:"1px solid #EDE0D0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <h4 style={{fontSize:14,fontWeight:700,color:"#1E0E05",margin:0}}>↩ Remboursements</h4>
                    <span style={{fontSize:12,fontWeight:700,color:"#DC2626"}}>
                      −CHF {refunds.filter(function(r){ return r.date === today; }).reduce(function(a,r){ return a+r.total; },0).toFixed(2)}
                    </span>
                  </div>
                  {refunds.filter(function(r){ return r.date === today; }).length === 0 ? (
                    <div style={{textAlign:"center",padding:"12px 0",color:"#8B7355",fontSize:11}}>Aucun remboursement aujourd'hui</div>
                  ) : refunds.filter(function(r){ return r.date === today; }).map(function(r){
                    return (
                      <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f5f0eb"}}>
                        <div style={{width:32,height:32,borderRadius:8,background:"rgba(239,68,68,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>↩</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#1E0E05"}}>{r.client} — {r.originalId}</div>
                          <div style={{fontSize:10,color:"#8B7355"}}>{r.time} · {r.mode === "full" ? "Total" : "Partiel"}{r.reason ? " · " + r.reason : ""}</div>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:"#DC2626"}}>−CHF {r.total.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Pertes du jour ── */}
              {waste && waste.length > 0 && (
                <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",border:"1px solid #EDE0D0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <h4 style={{fontSize:14,fontWeight:700,color:"#1E0E05",margin:0}}>📉 Pertes / Invendus</h4>
                    <span style={{fontSize:12,fontWeight:700,color:"#8B5CF6"}}>
                      −CHF {waste.filter(function(w){ return w.date === today; }).reduce(function(a,w){ return a+w.totalLoss; },0).toFixed(2)}
                    </span>
                  </div>
                  {waste.filter(function(w){ return w.date === today; }).length === 0 ? (
                    <div style={{textAlign:"center",padding:"12px 0",color:"#8B7355",fontSize:11}}>Aucune perte enregistrée aujourd'hui</div>
                  ) : waste.filter(function(w){ return w.date === today; }).map(function(w){
                    var reasons = {invendu:"🍞 Invendu",casse:"💥 Cassé",perime:"⏰ Périmé",autre:"📝 Autre"};
                    return (
                      <div key={w.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f5f0eb"}}>
                        <div style={{width:32,height:32,borderRadius:8,background:"rgba(139,92,246,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📉</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#1E0E05"}}>{reasons[w.reason] || w.reason} — {w.items.length} article{w.items.length>1?"s":""}</div>
                          <div style={{fontSize:10,color:"#8B7355"}}>{w.time} · {w.seller} · {w.store}</div>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:"#8B5CF6"}}>−CHF {w.totalLoss.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()} 

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── ONGLET CARTES CADEAUX ──────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {adminTab==="cartes" && (function(){
          var cards = giftCards || [];
          var filtered = storeFilter==="all" ? cards : cards.filter(function(c){ return c.store===storeFilter; });
          var activeCards  = filtered.filter(function(c){ return c.status==="active"; });
          var usedCards    = filtered.filter(function(c){ return c.status==="epuise"; });
          var totalVendu   = filtered.reduce(function(a,c){ return a+c.amount; },0);
          var totalRestant = activeCards.reduce(function(a,c){ return a+c.balance; },0);
          var totalUtilise = filtered.reduce(function(a,c){ return a+(c.amount-c.balance); },0);

          function toggleCardStatus(code) {
            setGiftCards(function(prev){
              return prev.map(function(c){
                if(c.code!==code) return c;
                return Object.assign({},c,{status:c.status==="inactive"?"active":"inactive"});
              });
            });
          }

          return (
            <div>
              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
                {[
                  {l:"Cartes émises",  v:filtered.length,                 icon:"🎁",bg:"linear-gradient(135deg,#C8953A,#a07228)",c:"#fff"},
                  {l:"Total vendu",    v:"CHF "+totalVendu.toFixed(2),    icon:"💰",bg:"linear-gradient(135deg,#1E0E05,#3D2B1A)",c:"#C8953A"},
                  {l:"Solde en cours", v:"CHF "+totalRestant.toFixed(2),  icon:"💳",bg:"linear-gradient(135deg,#7C3AED,#6D28D9)",c:"#fff"},
                  {l:"Total utilisé",  v:"CHF "+totalUtilise.toFixed(2),  icon:"✅",bg:"linear-gradient(135deg,#065F46,#059669)",c:"#fff"},
                  {l:"Actives",        v:activeCards.length,              icon:"🟢",bg:"#fff",c:"#065F46",border:true},
                  {l:"Épuisées",       v:usedCards.length,                icon:"🔴",bg:"#fff",c:"#DC2626",border:true},
                ].map(function(k){
                  return (
                    <div key={k.l} style={{background:k.bg,borderRadius:14,padding:"14px 16px",border:k.border?"1.5px solid #EDE0D0":"none"}}>
                      <div style={{fontSize:16,marginBottom:2}}>{k.icon}</div>
                      <div style={{fontSize:18,fontWeight:800,fontFamily:"'Outfit',sans-serif",color:k.c,marginBottom:1}}>{k.v}</div>
                      <div style={{fontSize:9,color:k.c,opacity:.7,textTransform:"uppercase",letterSpacing:.8}}>{k.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Tableau des cartes */}
              <div style={{background:"#fff",borderRadius:16,padding:18,border:"1.5px solid #EDE0D0"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <h4 style={{fontFamily:"'Outfit',sans-serif",fontSize:14,color:"#1E0E05",margin:0}}>🎁 Toutes les cartes ({filtered.length})</h4>
                  {canExportData && filtered.length>0 && (
                    <button onClick={function(){
                      var csv="Code;Montant;Solde;Statut;Date;Magasin;Vendeuse;Email\n";
                      filtered.forEach(function(c){ csv+=[c.code,c.amount.toFixed(2),c.balance.toFixed(2),c.status,c.createdAt,c.store,c.seller||"",c.email||""].join(";")+"\n"; });
                      var blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
                      var url=URL.createObjectURL(blob);var a=document.createElement("a");a.href=url;a.download="cartes_cadeaux.csv";a.click();URL.revokeObjectURL(url);
                    }}
                      style={{padding:"6px 14px",borderRadius:8,border:"1px solid #EDE0D0",background:"#F7F3EE",color:"#5C4A32",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                      📤 Export CSV
                    </button>
                  )}
                </div>
                <div style={{maxHeight:500,overflowY:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{background:"#F7F3EE",position:"sticky",top:0}}>
                        {["Code","Montant","Solde","Statut","Date","Magasin","Vendeuse","Email","Actions"].map(function(h){
                          return <th key={h} style={{padding:"8px 6px",textAlign:"left",color:"#5C4A32",fontWeight:700,fontSize:10,borderBottom:"1.5px solid #EDE0D0",whiteSpace:"nowrap"}}>{h}</th>;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length===0 ? (
                        <tr><td colSpan={9} style={{padding:"30px",textAlign:"center",color:"#8B7355"}}>Aucune carte cadeau émise</td></tr>
                      ) : filtered.map(function(c){
                        var pct = c.amount>0?Math.round(c.balance/c.amount*100):0;
                        var stColor = c.status==="active"?"#065F46":c.status==="epuise"?"#DC2626":"#8B7355";
                        var stBg    = c.status==="active"?"#D1FAE5":c.status==="epuise"?"#FEE2E2":"#F3F4F6";
                        var stLabel = c.status==="active"?"Active":c.status==="epuise"?"Épuisée":"Inactive";
                        var isExp = expandedTicket===c.id;
                        return React.createElement(React.Fragment,{key:c.id},
                          React.createElement("tr",{className:"tr",onClick:function(){setExpandedTicket(isExp?null:c.id);},
                            style:{borderBottom:isExp?"none":"1px solid #F7F3EE",cursor:"pointer",background:isExp?"#FDF8F0":"transparent"}},
                            React.createElement("td",{style:{padding:"8px 6px",fontFamily:"'Courier New',monospace",fontWeight:700,color:"#1E0E05",letterSpacing:1,whiteSpace:"nowrap"}},
                              (isExp?"▼ ":"▶ ")+c.code),
                            React.createElement("td",{style:{padding:"8px 6px",fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}},"CHF "+c.amount.toFixed(2)),
                            React.createElement("td",{style:{padding:"8px 6px"}},
                              React.createElement("div",{style:{display:"flex",alignItems:"center",gap:6}},
                                React.createElement("div",{style:{width:40,height:5,background:"#F0E8DC",borderRadius:3,overflow:"hidden"}},
                                  React.createElement("div",{style:{width:pct+"%",height:"100%",borderRadius:3,
                                    background:pct>50?"#10B981":pct>20?"#F59E0B":"#EF4444",transition:"width .3s"}})),
                                React.createElement("span",{style:{fontWeight:600,color:stColor,fontSize:11}},"CHF "+c.balance.toFixed(2))
                              )),
                            React.createElement("td",{style:{padding:"8px 6px"}},
                              React.createElement("span",{style:{fontSize:9,fontWeight:700,color:stColor,background:stBg,padding:"2px 8px",borderRadius:10}},stLabel)),
                            React.createElement("td",{style:{padding:"8px 6px",color:"#5C4A32",whiteSpace:"nowrap"}},c.createdAt+" "+(c.createdTime||"")),
                            React.createElement("td",{style:{padding:"8px 6px",color:"#5C4A32",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},
                              c.store?c.store.split(" ").slice(0,3).join(" "):"—"),
                            React.createElement("td",{style:{padding:"8px 6px",color:"#5C4A32"}},c.seller||"—"),
                            React.createElement("td",{style:{padding:"8px 6px",color:"#8B7355",fontSize:10}},c.email||"—"),
                            React.createElement("td",{style:{padding:"8px 6px"}},
                              React.createElement("button",{onClick:function(e){e.stopPropagation();toggleCardStatus(c.code);},
                                style:{padding:"4px 10px",borderRadius:6,border:"1px solid #EDE0D0",
                                       background:c.status==="inactive"?"#D1FAE5":"#FEE2E2",
                                       color:c.status==="inactive"?"#065F46":"#DC2626",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}},
                                c.status==="inactive"?"▶ Activer":"⏸ Désactiver")
                            )
                          ),
                          isExp && React.createElement("tr",{style:{background:"#FDF8F0",borderBottom:"2px solid #EDE0D0"}},
                            React.createElement("td",{colSpan:9,style:{padding:"14px 18px"}},
                              React.createElement("div",{style:{display:"flex",gap:20,flexWrap:"wrap"}},
                                React.createElement("div",{style:{textAlign:"center",flexShrink:0}},
                                  React.createElement("img",{src:qrUrl(c.code),alt:"QR",style:{width:110,height:110,borderRadius:10,border:"2px solid #EDE0D0"}}),
                                  React.createElement("div",{style:{fontFamily:"'Courier New',monospace",fontSize:16,fontWeight:800,marginTop:6,letterSpacing:2}},c.code),
                                  React.createElement("div",{style:{fontSize:10,color:"#8B7355",marginTop:4}},"Valeur: CHF "+c.amount.toFixed(2))
                                ),
                                React.createElement("div",{style:{flex:1,minWidth:200}},
                                  React.createElement("div",{style:{fontSize:12,fontWeight:700,color:"#1E0E05",marginBottom:8}},"📜 Historique"),
                                  (c.history||[]).length===0
                                    ? React.createElement("div",{style:{fontSize:10,color:"#8B7355"}},"Aucune utilisation")
                                    : (c.history||[]).map(function(h,idx){
                                        return React.createElement("div",{key:idx,style:{display:"flex",gap:10,alignItems:"center",padding:"5px 0",
                                          borderBottom:idx<(c.history||[]).length-1?"1px solid #F0E8DC":"none",fontSize:10}},
                                          React.createElement("span",{style:{color:"#8B7355",whiteSpace:"nowrap"}},h.date+" "+h.time),
                                          React.createElement("span",{style:{fontWeight:600,color:h.label?"#065F46":"#DC2626"}},
                                            h.label || ("- CHF "+h.amount.toFixed(2))),
                                          React.createElement("span",{style:{color:"#8B7355",marginLeft:"auto"}},"Solde: CHF "+h.balance.toFixed(2))
                                        );
                                      })
                                )
                              )
                            )
                          )
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TAB: ABONNEMENTS ── */}
        {adminTab==="abonnements" && (function(){

          var filteredSubs = subsFilteredByStore;
          var activeSubs = filteredSubs.filter(function(s){ return s.active; });
          var pausedSubs = filteredSubs.filter(function(s){ return !s.active; });
          var totalMensuel = activeSubs.reduce(function(acc,s){
            var multiplier = s.frequency==="daily" ? s.days.length * 4.33
                           : s.frequency==="weekly" ? s.days.length * 4.33
                           : s.frequency==="monthly" ? s.days.length : 1;
            return acc + s.total * multiplier;
          },0);

          // Preview next 7 days
          var preview = [];
          for(var d=0; d<7; d++){
            var dt = new Date(); dt.setDate(dt.getDate()+d);
            var dow = dt.getDay();
            var dateStr = dt.toISOString().slice(0,10);
            var dayLabel = d===0 ? "Aujourd'hui" : d===1 ? "Demain" : DAY_NAMES[dow]+" "+dt.getDate()+"/"+(dt.getMonth()+1);
            var daySubs = activeSubs.filter(function(s){
              if (s.startDate && dateStr < s.startDate) return false;
              if (s.endDate && dateStr > s.endDate) return false;
              if (s.frequency==="monthly") return s.days.indexOf(dt.getDate())!==-1;
              return s.days.indexOf(dow)!==-1;
            });
            preview.push({label:dayLabel, date:dateStr, subs:daySubs, dow:dow, isToday:d===0});
          }

          // Edit form logic

          function saveSub(data){
            var total = data.items.reduce(function(a,i){return a+i.price*i.qty;},0);
            if(editSub){
              setSubscriptions(function(prev){
                return prev.map(function(s){ return s.id===editSub.id ? Object.assign({},data,{id:editSub.id,total:total,lastGenerated:editSub.lastGenerated,createdAt:editSub.createdAt}) : s; });
              });
              setEditSub(null);
            } else {
              var newSub = Object.assign({},data,{id:"ABO-"+Date.now(),total:total,lastGenerated:null,createdAt:todayStr()});
              setSubscriptions(function(prev){ return prev.concat([newSub]); });
              setShowAddSub(false);
            }
            setSavedMsg("✅ Abonnement enregistré"); setTimeout(function(){ setSavedMsg(""); },2500);
          }

          function toggleSubActive(id){
            setSubscriptions(function(prev){
              return prev.map(function(s){ return s.id===id ? Object.assign({},s,{active:!s.active}) : s; });
            });
          }

          function deleteSub(id){
            setSubscriptions(function(prev){ return prev.filter(function(s){ return s.id!==id; }); });
            setConfirmDeleteSub(null);
            setSavedMsg("✅ Abonnement supprimé"); setTimeout(function(){ setSavedMsg(""); },2500);
          }

          return (
            <div>
              {/* Header + KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                {[
                  {l:"Abonnements actifs", v:activeSubs.length, icon:"🔄",bg:"linear-gradient(135deg,#5B21B6,#7C3AED)",a:"#E9D5FF"},
                  {l:"CA mensuel estimé",  v:"CHF "+totalMensuel.toFixed(0), icon:"💰",bg:"linear-gradient(135deg,#1E0E05,#3D2B1A)",a:"#C8953A"},
                  {l:"À générer auj.",     v:subsDueToday.length, icon:"📋",bg:"linear-gradient(135deg,#065F46,#059669)",a:"#A7F3D0"},
                  {l:"En pause",           v:pausedSubs.length,  icon:"⏸",bg:"linear-gradient(135deg,#92400E,#B45309)",a:"#FDE68A"},
                ].map(function(k){
                  return (
                    <div key={k.l} className="ch" style={{background:k.bg,borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{k.icon}</div>
                      <div style={{fontSize:18,fontWeight:700,color:k.a,fontFamily:"'Outfit',sans-serif",marginBottom:2}}>{k.v}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.42)",textTransform:"uppercase",letterSpacing:.8}}>{k.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Action bar */}
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                {canManageSubs && (
                  <button onClick={function(){ setShowAddSub(true); setEditSub(null); setSubFormData(Object.assign({},emptySub,{store:userStore||STORES[0]})); setSubFormSearch(""); }}
                    className="bg" style={{padding:"9px 18px",borderRadius:10,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}}>
                    + Nouvel abonnement
                  </button>
                )}
                {subsDueToday.length>0 && (
                  <button onClick={function(){
                    var gen = generateSubOrders(subsDueToday);
                    setSavedMsg("✅ "+gen.length+" commande(s) générée(s)"); setTimeout(function(){ setSavedMsg(""); },3000);
                  }}
                    style={{padding:"9px 18px",borderRadius:10,border:"2px solid #7C3AED",background:"transparent",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#7C3AED"}}>
                    🔄 Générer les {subsDueToday.length} commande(s) du jour
                  </button>
                )}
              </div>

              {/* Calendrier 7 jours */}
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",marginBottom:16}}>
                <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>📅 Aperçu 7 jours</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                  {preview.map(function(day){
                    var hasSubs = day.subs.length>0;
                    var generated = day.isToday && day.subs.every(function(s){ return s.lastGenerated===day.date; });
                    return (
                      <div key={day.date} style={{textAlign:"center",padding:"8px 4px",borderRadius:10,
                            background:day.isToday?"#EDE9FE":hasSubs?"#F0FDF4":"#F7F3EE",
                            border:day.isToday?"2px solid #7C3AED":"1px solid "+(hasSubs?"#BBF7D0":"#EDE0D0")}}>
                        <div style={{fontSize:9,fontWeight:700,color:day.isToday?"#5B21B6":"#8B7355",marginBottom:4,textTransform:"uppercase"}}>{day.label}</div>
                        {hasSubs ? (
                          <div>
                            <div style={{fontSize:18,fontWeight:700,color:generated?"#10B981":"#5B21B6"}}>{generated?"✅":day.subs.length}</div>
                            <div style={{fontSize:8,color:"#8B7355",marginTop:2}}>{generated?"Générées":day.subs.length+" cmd"}</div>
                          </div>
                        ) : (
                          <div style={{fontSize:14,color:"#D5C4B0",marginTop:2}}>—</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Formulaire ajout/édition */}
              {subFormData && (function(){
                var f = subFormData;
                var filtCat = catalogue.filter(function(p){ return p.active!==false && p.name.toLowerCase().indexOf(subFormSearch.toLowerCase())>=0; });

                function updateF(patch){ setSubFormData(function(prev){ return Object.assign({},prev,patch); }); }
                function toggleDay(d){
                  var days = f.days.slice();
                  var idx = days.indexOf(d);
                  if(idx>=0) days.splice(idx,1); else days.push(d);
                  days.sort(function(a,b){return a-b;});
                  updateF({days:days});
                }
                function addItem(p){
                  var items = f.items.slice();
                  var ex = items.find(function(i){ return i.id===p.id; });
                  if(ex){ ex = Object.assign({},ex,{qty:ex.qty+1}); items = items.map(function(i){ return i.id===p.id?ex:i; }); }
                  else items.push({id:p.id,name:p.name,qty:1,price:p.price,emoji:p.emoji||""});
                  updateF({items:items});
                }
                function setItemQty(id,delta){
                  var items = f.items.map(function(i){
                    if(i.id!==id) return i;
                    return Object.assign({},i,{qty:Math.max(0,i.qty+delta)});
                  }).filter(function(i){ return i.qty>0; });
                  updateF({items:items});
                }
                function removeItem(id){
                  updateF({items:f.items.filter(function(i){ return i.id!==id; })});
                }
                function closeForm(){ setEditSub(null); setShowAddSub(false); setSubFormData(null); setSubFormSearch(""); }

                var total = f.items.reduce(function(a,i){ return a+i.price*i.qty; },0);
                var valid = f.client && f.items.length>0 && f.days.length>0;

                return (
                  <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",marginBottom:16,border:"2px solid #C4B5FD"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                      <div style={{fontWeight:700,color:"#5B21B6",fontSize:14}}>{editSub?"✏️ Modifier l'abonnement":"🔄 Nouvel abonnement"}</div>
                      <button onClick={closeForm}
                        style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#8B7355"}}>✕</button>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Client *</label>
                        <input value={f.client} onChange={function(e){updateF({client:e.target.value});}}
                          placeholder="Nom du client" style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Téléphone</label>
                        <input value={f.phone||""} onChange={function(e){updateF({phone:e.target.value});}}
                          placeholder="079 123 45 67" style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                      </div>
                    </div>

                    {/* Fréquence */}
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:6}}>Fréquence</label>
                      <div style={{display:"flex",gap:6,marginBottom:8}}>
                        {FREQ_OPTS.map(function(fo){
                          return (
                            <button key={fo.id} onClick={function(){ updateF({frequency:fo.id,days:fo.id==="monthly"?[]:[1,2,3,4,5]}); }}
                              style={{padding:"6px 14px",borderRadius:8,border:f.frequency===fo.id?"2px solid #7C3AED":"1px solid #D5C4B0",
                                      background:f.frequency===fo.id?"#EDE9FE":"#F7F3EE",color:f.frequency===fo.id?"#5B21B6":"#8B7355",
                                      fontSize:11,fontWeight:f.frequency===fo.id?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                              {fo.label}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {f.frequency==="monthly" ? (
                          <div style={{display:"flex",gap:4,alignItems:"center"}}>
                            <span style={{fontSize:10,color:"#8B7355"}}>Jours du mois :</span>
                            <input value={f.days.join(",")} onChange={function(e){
                              var vals = e.target.value.split(",").map(Number).filter(function(n){ return n>=1 && n<=31; });
                              updateF({days:vals});
                            }}
                              placeholder="1,15" style={{width:100,padding:"4px 8px",borderRadius:6,border:"1px solid #D5C4B0",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                          </div>
                        ) : (
                          [0,1,2,3,4,5,6].map(function(d){
                            var sel = f.days.indexOf(d)>=0;
                            return (
                              <button key={d} onClick={function(){ toggleDay(d); }}
                                style={{width:36,height:36,borderRadius:8,border:sel?"2px solid #7C3AED":"1px solid #D5C4B0",
                                        background:sel?"#7C3AED":"#F7F3EE",color:sel?"#fff":"#8B7355",
                                        fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                                {DAY_NAMES[d]}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Livraison */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Mode</label>
                        <select value={f.dMethod||"sur_place"} onChange={function(e){updateF({dMethod:e.target.value});}}
                          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}}>
                          <option value="livreur">🚐 Livraison</option>
                          <option value="retrait">🔄 Retrait</option>
                          <option value="sur_place">🏪 Sur place</option>
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Magasin</label>
                        <select value={f.store} onChange={function(e){updateF({store:e.target.value});}}
                          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}}>
                          {STORES.map(function(s){ return <option key={s} value={s}>{s}</option>; })}
                        </select>
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Heure livraison</label>
                        <input type="time" value={f.deliveryTime||""} onChange={function(e){updateF({deliveryTime:e.target.value});}}
                          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                      </div>
                    </div>

                    {f.dMethod==="livreur" && (
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                        <div>
                          <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Adresse de livraison</label>
                          <input value={f.dest||""} onChange={function(e){updateF({dest:e.target.value});}}
                            placeholder="Rue, ville" style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                        </div>
                        <div>
                          <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Chauffeur</label>
                          <select value={f.driver||""} onChange={function(e){updateF({driver:e.target.value});}}
                            style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}}>
                            {DRIVERS.map(function(d){ return <option key={d} value={d}>{d}</option>; })}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Date début</label>
                        <input type="date" value={f.startDate||""} onChange={function(e){updateF({startDate:e.target.value});}}
                          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                      </div>
                      <div>
                        <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Date fin (optionnel)</label>
                        <input type="date" value={f.endDate||""} onChange={function(e){updateF({endDate:e.target.value});}}
                          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                      </div>
                    </div>

                    {/* Note */}
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Note</label>
                      <input value={f.note||""} onChange={function(e){updateF({note:e.target.value});}}
                        placeholder="Instructions particulières" style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                    </div>

                    {/* Articles */}
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:6}}>Articles *</label>
                      <input value={subFormSearch} onChange={function(e){setSubFormSearch(e.target.value);}}
                        placeholder="🔍 Rechercher un produit..." style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:8}} />
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",maxHeight:140,overflowY:"auto"}}>
                        {filtCat.map(function(p){
                          return (
                            <button key={p.id} onClick={function(){ addItem(p); }}
                              style={{padding:"5px 10px",borderRadius:8,border:"1px solid #EDE0D0",background:"#FDF8F0",
                                      cursor:"pointer",fontSize:11,fontFamily:"'Outfit',sans-serif",display:"flex",gap:4,alignItems:"center"}}>
                              <span>{p.emoji||"📦"}</span> {p.name} <span style={{color:"#C8953A",fontWeight:600}}>{p.price.toFixed(2)}</span>
                            </button>
                          );
                        })}
                      </div>
                      {f.items.length>0 && (
                        <div style={{marginTop:10,background:"#1E0E05",borderRadius:10,padding:10}}>
                          {f.items.map(function(it){
                            return (
                              <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid #3D2B1A"}}>
                                <span style={{color:"#FDF8F0",fontSize:11}}>{it.emoji} {it.name}</span>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  <button onClick={function(){setItemQty(it.id,-1);}} style={{width:22,height:22,borderRadius:6,border:"none",background:"#5C4A32",color:"#FDF8F0",cursor:"pointer",fontSize:12,fontWeight:700}}>−</button>
                                  <span style={{color:"#C8953A",fontWeight:700,fontSize:12,minWidth:20,textAlign:"center"}}>{it.qty}</span>
                                  <button onClick={function(){setItemQty(it.id,1);}} style={{width:22,height:22,borderRadius:6,border:"none",background:"#5C4A32",color:"#FDF8F0",cursor:"pointer",fontSize:12,fontWeight:700}}>+</button>
                                  <span style={{color:"#C8953A",fontSize:11,fontWeight:600,minWidth:55,textAlign:"right"}}>{(it.price*it.qty).toFixed(2)}</span>
                                  <button onClick={function(){removeItem(it.id);}} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:12}}>✕</button>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{display:"flex",justifyContent:"flex-end",paddingTop:8}}>
                            <span style={{color:"#C8953A",fontWeight:700,fontSize:14}}>Total: CHF {total.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Boutons */}
                    <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                      <button onClick={closeForm}
                        style={{padding:"9px 18px",borderRadius:10,border:"1px solid #D5C4B0",background:"transparent",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#8B7355"}}>
                        Annuler
                      </button>
                      <button disabled={!valid} onClick={function(){ saveSub(f); closeForm(); }}
                        className="bg" style={{padding:"9px 22px",borderRadius:10,border:"none",fontSize:12,fontWeight:700,cursor:valid?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",color:"#1E0E05",opacity:valid?1:.5}}>
                        {editSub?"✓ Enregistrer":"+ Créer l'abonnement"}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Liste des abonnements */}
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>
                  📋 Abonnements ({filteredSubs.length})
                </div>
                {filteredSubs.length===0 && (
                  <div style={{textAlign:"center",padding:"30px 0",color:"#8B7355",fontSize:12}}>
                    Aucun abonnement — créez-en un avec le bouton ci-dessus
                  </div>
                )}
                {filteredSubs.map(function(sub){
                  var freqLabel = sub.frequency==="daily"?"Quotidien":sub.frequency==="weekly"?"Hebdomadaire":"Mensuel";
                  var daysLabel = sub.frequency==="monthly"
                    ? sub.days.map(function(d){return d;}).join(", ")+" du mois"
                    : sub.days.map(function(d){return DAY_NAMES[d];}).join(", ");
                  var isDue = isDueToday(sub);
                  var modeIcon = sub.dMethod==="livreur"?"🚐":sub.dMethod==="retrait"?"🔄":"🏪";

                  return (
                    <div key={sub.id} style={{borderBottom:"1px solid #F0E8DC",padding:"14px 0",animation:"fadeUp .35s ease",opacity:sub.active?1:.55}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:14,fontWeight:700,color:sub.active?"#1E0E05":"#8B7355"}}>{sub.client}</span>
                            {sub.active ? (
                              <span style={{fontSize:8,fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"2px 8px",borderRadius:10}}>ACTIF</span>
                            ) : (
                              <span style={{fontSize:8,fontWeight:700,color:"#92400E",background:"#FEF3C7",padding:"2px 8px",borderRadius:10}}>PAUSE</span>
                            )}
                            {isDue && <span style={{fontSize:8,fontWeight:700,color:"#5B21B6",background:"#EDE9FE",padding:"2px 8px",borderRadius:10,animation:"glow 1s infinite alternate"}}>À GÉNÉRER</span>}
                          </div>
                          <div style={{fontSize:11,color:"#8B7355",marginTop:3}}>
                            {modeIcon} {freqLabel} · {daysLabel} · {sub.deliveryTime||"—"}
                          </div>
                          {sub.phone && <div style={{fontSize:10,color:"#8B7355",marginTop:2}}>📞 {sub.phone}</div>}
                          {sub.dest && <div style={{fontSize:10,color:"#8B7355",marginTop:2}}>📍 {sub.dest}</div>}
                          {sub.driver && sub.driver!=="Non assigné" && <div style={{fontSize:10,color:"#8B7355",marginTop:2}}>🚐 {sub.driver}</div>}
                          {sub.note && <div style={{fontSize:10,color:"#5B21B6",marginTop:2,fontStyle:"italic"}}>💬 {sub.note}</div>}
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:16,fontWeight:700,color:"#C8953A"}}>CHF {sub.total.toFixed(2)}</div>
                          <div style={{fontSize:9,color:"#8B7355"}}>{sub.store.split(" ").slice(0,3).join(" ")}</div>
                          {sub.endDate && <div style={{fontSize:9,color:"#8B7355"}}>Fin: {sub.endDate}</div>}
                        </div>
                      </div>
                      {/* Items résumé */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                        {sub.items.map(function(it){
                          return (
                            <span key={it.id} style={{fontSize:10,background:"#F7F3EE",border:"1px solid #EDE0D0",borderRadius:6,padding:"2px 8px",color:"#5C4A32"}}>
                              {it.emoji||""} {it.name} ×{it.qty}
                            </span>
                          );
                        })}
                      </div>
                      {/* Actions */}
                      {canManageSubs && (
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={function(){ setEditSub(sub); setShowAddSub(false); setSubFormData(Object.assign({},sub)); setSubFormSearch(""); }}
                            style={{padding:"4px 12px",borderRadius:6,border:"1px solid #D5C4B0",background:"#FDF8F0",cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"'Outfit',sans-serif",color:"#5C4A32"}}>
                            ✏️ Modifier
                          </button>
                          <button onClick={function(){ toggleSubActive(sub.id); }}
                            style={{padding:"4px 12px",borderRadius:6,border:"1px solid #D5C4B0",
                                    background:sub.active?"#FEF3C7":"#D1FAE5",cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"'Outfit',sans-serif",
                                    color:sub.active?"#92400E":"#065F46"}}>
                            {sub.active?"⏸ Pause":"▶ Reprendre"}
                          </button>
                          {isDue && (
                            <button onClick={function(){
                              var gen = generateSubOrders([sub]);
                              setSavedMsg("✅ Commande générée pour "+sub.client); setTimeout(function(){ setSavedMsg(""); },2500);
                            }}
                              style={{padding:"4px 12px",borderRadius:6,border:"2px solid #7C3AED",background:"#EDE9FE",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Outfit',sans-serif",color:"#5B21B6"}}>
                              🔄 Générer
                            </button>
                          )}
                          {confirmDeleteSub===sub.id ? (
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              <span style={{fontSize:10,color:"#DC2626",fontWeight:600}}>Confirmer ?</span>
                              <button onClick={function(){ deleteSub(sub.id); }}
                                style={{padding:"4px 10px",borderRadius:6,border:"none",background:"#DC2626",color:"#fff",cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>Oui</button>
                              <button onClick={function(){ setConfirmDeleteSub(null); }}
                                style={{padding:"4px 10px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",cursor:"pointer",fontSize:10,fontFamily:"'Outfit',sans-serif",color:"#8B7355"}}>Non</button>
                            </div>
                          ) : (
                            <button onClick={function(){ setConfirmDeleteSub(sub.id); }}
                              style={{padding:"4px 12px",borderRadius:6,border:"1px solid #FCA5A5",background:"#FEF2F2",cursor:"pointer",fontSize:10,fontWeight:600,fontFamily:"'Outfit',sans-serif",color:"#DC2626"}}>
                              🗑
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── TAB: PLANNING PRODUCTION ── */}
        {adminTab==="planning" && (function(){
          // Aggregate production needs from pending orders
          var pendingOrders = orders.filter(function(o){ return o.status==="attente"||o.status==="production"; });
          if(storeFilter!=="all") pendingOrders = pendingOrders.filter(function(o){ return o.store===storeFilter; });

          // Aggregate from today's subscriptions (not yet generated)
          var todayD = new Date().toISOString().slice(0,10);
          var aboItems = [];
          subscriptions.filter(function(s){ return s.active && s.lastGenerated!==todayD; }).forEach(function(s){
            var dow = new Date().getDay();
            var isDue = s.frequency==="monthly" ? s.days.indexOf(new Date().getDate())!==-1 : s.days.indexOf(dow)!==-1;
            if(isDue && (storeFilter==="all"||s.store===storeFilter)){
              s.items.forEach(function(it){ aboItems.push(Object.assign({},it,{source:"abo",client:s.client})); });
            }
          });

          // Build product aggregation
          var prodAgg = {};
          pendingOrders.forEach(function(o){
            o.items.forEach(function(it){
              var key = it.name;
              if(!prodAgg[key]) prodAgg[key]={name:it.name,id:it.id,qty:0,orders:0,emoji:"",aboQty:0};
              prodAgg[key].qty += it.qty;
              prodAgg[key].orders++;
            });
          });
          aboItems.forEach(function(it){
            var key = it.name;
            if(!prodAgg[key]) prodAgg[key]={name:it.name,id:it.id,qty:0,orders:0,emoji:it.emoji||"",aboQty:0};
            prodAgg[key].aboQty += it.qty;
            prodAgg[key].emoji = it.emoji||prodAgg[key].emoji;
          });
          // Enrich with catalogue emoji/recipe
          Object.values(prodAgg).forEach(function(p){
            var catItem = catalogue.find(function(c){ return c.id===p.id||c.name===p.name; });
            if(catItem){ p.emoji = catItem.emoji||p.emoji; p.productId = catItem.id; }
            p.recipe = recipes.find(function(r){ return r.productId===p.productId||r.name===p.name; });
            p.totalQty = p.qty + p.aboQty;
          });
          var sortedProds = Object.values(prodAgg).sort(function(a,b){ return b.totalQty - a.totalQty; });
          var maxQty = sortedProds.length>0 ? sortedProds[0].totalQty : 1;

          // Timeline: orders by time
          var timeline = pendingOrders.slice().sort(function(a,b){ return (a.time||"").localeCompare(b.time||""); });

          // Recipes stats
          var productsWithRecipe = catalogue.filter(function(p){ return p.active && recipes.some(function(r){ return r.productId===p.id; }); }).length;
          var productsWithoutRecipe = catalogue.filter(function(p){ return p.active; }).length - productsWithRecipe;

          return (
            <div>
              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                {[
                  {l:"Commandes en cours",v:pendingOrders.length,icon:"📋",bg:"linear-gradient(135deg,#1E40AF,#2563EB)",a:"#BFDBFE"},
                  {l:"Produits à préparer",v:sortedProds.length,icon:"🏭",bg:"linear-gradient(135deg,#1E0E05,#3D2B1A)",a:"#C8953A"},
                  {l:"Pièces totales",v:sortedProds.reduce(function(a,p){return a+p.totalQty;},0),icon:"📦",bg:"linear-gradient(135deg,#065F46,#059669)",a:"#A7F3D0"},
                  {l:"Fiches recettes",v:productsWithRecipe+"/"+catalogue.filter(function(p){return p.active;}).length,icon:"📖",bg:"linear-gradient(135deg,#7C3AED,#5B21B6)",a:"#E9D5FF"},
                ].map(function(k){
                  return (
                    <div key={k.l} className="ch" style={{background:k.bg,borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{k.icon}</div>
                      <div style={{fontSize:18,fontWeight:700,color:k.a,fontFamily:"'Outfit',sans-serif",marginBottom:2}}>{k.v}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.42)",textTransform:"uppercase",letterSpacing:.8}}>{k.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Besoins production agrégés */}
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",marginBottom:16}}>
                <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:14}}>🏭 Besoins de production — aujourd'hui</div>
                {sortedProds.length===0 && (
                  <div style={{textAlign:"center",padding:"30px 0",color:"#8B7355",fontSize:12}}>
                    🎉 Aucune production en attente
                  </div>
                )}
                {sortedProds.map(function(p){
                  var pct = Math.round(p.totalQty/maxQty*100);
                  var hasRecipe = !!p.recipe;
                  return (
                    <div key={p.name} style={{marginBottom:12,animation:"fadeUp .3s ease"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:18}}>{p.emoji||"📦"}</span>
                          <div>
                            <span style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>{p.name}</span>
                            <div style={{fontSize:10,color:"#8B7355"}}>
                              {p.qty>0 && <span>{p.qty} (commandes)</span>}
                              {p.qty>0&&p.aboQty>0 && <span> + </span>}
                              {p.aboQty>0 && <span style={{color:"#7C3AED"}}>{p.aboQty} (abonnements)</span>}
                              {" · "+p.orders+" cmd"}
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:20,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>{p.totalQty}</span>
                          {hasRecipe && (
                            <button onClick={function(){ setViewRecipe(p.recipe); }}
                              style={{padding:"3px 8px",borderRadius:6,border:"1px solid #C4B5FD",background:"#EDE9FE",color:"#5B21B6",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                              📖 Recette
                            </button>
                          )}
                          {!hasRecipe && canManageRecipes && (
                            <button onClick={function(){
                              var catP = catalogue.find(function(c){ return c.id===p.productId||c.name===p.name; });
                              if(catP) setEditRecipe({id:"REC-"+Date.now(),productId:catP.id,name:catP.name,portions:10,prepTime:0,cookTime:0,restTime:0,difficulty:"moyen",ingredients:[],steps:[],notes:"",costPerBatch:0});
                            }}
                              style={{padding:"3px 8px",borderRadius:6,border:"1px dashed #D5C4B0",background:"transparent",color:"#8B7355",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                              + Recette
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{height:8,background:"#F0E8DC",borderRadius:4,overflow:"hidden"}}>
                        <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#C8953A,#a07228)",width:pct+"%",transition:"width .6s ease"}} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Timeline commandes */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>⏱ Timeline commandes</div>
                  {timeline.length===0 && <div style={{color:"#8B7355",fontSize:11,textAlign:"center",padding:20}}>Aucune commande en attente</div>}
                  {timeline.slice(0,12).map(function(o){
                    var sm = SM[o.status]||SM.attente;
                    return (
                      <div key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #F0E8DC"}}>
                        <div style={{width:6,height:6,borderRadius:3,background:sm.dot,flexShrink:0}} />
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#1E0E05"}}>{o.id} · {o.client}</div>
                          <div style={{fontSize:10,color:"#8B7355"}}>{o.items.map(function(i){return i.qty+"x "+i.name;}).join(", ")}</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#C8953A"}}>{o.time}</div>
                          <span style={{fontSize:8,fontWeight:700,color:sm.tx,background:sm.bg,padding:"1px 6px",borderRadius:8}}>{sm.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Fiches recettes catalogue */}
                <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontWeight:600,color:"#1E0E05",fontSize:12}}>📖 Fiches recettes</div>
                    {productsWithoutRecipe>0 && <span style={{fontSize:9,color:"#F59E0B",fontWeight:600}}>{productsWithoutRecipe} sans recette</span>}
                  </div>
                  {recipes.map(function(r){
                    var diff = DIFF_OPTS.find(function(d){return d.id===r.difficulty;})||DIFF_OPTS[1];
                    var catP = catalogue.find(function(c){return c.id===r.productId;});
                    return (
                      <div key={r.id} className="tr" onClick={function(){ setViewRecipe(r); }}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px",borderBottom:"1px solid #F0E8DC",cursor:"pointer",borderRadius:6}}>
                        <span style={{fontSize:18}}>{catP?catP.emoji:"📦"}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#1E0E05"}}>{r.name}</div>
                          <div style={{fontSize:10,color:"#8B7355"}}>{r.portions} portions · {r.prepTime+r.cookTime} min</div>
                        </div>
                        <span style={{fontSize:8,fontWeight:700,color:diff.color,background:diff.color+"18",padding:"2px 8px",borderRadius:8}}>{diff.label}</span>
                        {canManageRecipes && (
                          <button onClick={function(e){ e.stopPropagation(); setEditRecipe(Object.assign({},r)); }}
                            style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#8B7355"}}>✏️</button>
                        )}
                      </div>
                    );
                  })}
                  {/* Add new recipe for products without one */}
                  {canManageRecipes && (
                    <div style={{marginTop:10}}>
                      {catalogue.filter(function(p){ return p.active && !recipes.some(function(r){return r.productId===p.id;}); }).slice(0,5).map(function(p){
                        return (
                          <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 6px",opacity:.5}}>
                            <span>{p.emoji||"📦"}</span>
                            <span style={{flex:1,fontSize:10,color:"#8B7355"}}>{p.name}</span>
                            <button onClick={function(){
                              setEditRecipe({id:"REC-"+Date.now(),productId:p.id,name:p.name,portions:10,prepTime:0,cookTime:0,restTime:0,difficulty:"moyen",ingredients:[],steps:[],notes:"",costPerBatch:0});
                            }}
                              style={{padding:"2px 8px",borderRadius:6,border:"1px dashed #D5C4B0",background:"transparent",color:"#8B7355",fontSize:9,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                              + Créer fiche
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── RECIPE VIEW MODAL ── */}
        {viewRecipe && (function(){
          var r = viewRecipe;
          var diff = DIFF_OPTS.find(function(d){return d.id===r.difficulty;})||DIFF_OPTS[1];
          var catP = catalogue.find(function(c){return c.id===r.productId;});
          var totalCost = r.ingredients.reduce(function(a,ing){return a+ing.cost;},0);
          var costPerUnit = r.portions>0 ? totalCost/r.portions : 0;
          var totalTime = r.prepTime + r.cookTime + (r.restTime||0);
          var timeLabel = totalTime>=60 ? Math.floor(totalTime/60)+"h"+((totalTime%60)>0?(totalTime%60+"min"):"") : totalTime+"min";
          return (
            <div style={{position:"fixed",inset:0,background:"rgba(30,14,5,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
              onClick={function(){ setViewRecipe(null); }}>
              <div style={{background:"#FDF8F0",borderRadius:18,maxWidth:580,width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",animation:"fadeUp .25s ease"}}
                onClick={function(e){e.stopPropagation();}}>
                {/* Header */}
                <div style={{background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",padding:"20px 22px",borderRadius:"18px 18px 0 0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:28,marginBottom:4}}>{catP?catP.emoji:"📖"}</div>
                      <div style={{fontSize:18,fontWeight:700,color:"#FDF8F0",fontFamily:"'Outfit',sans-serif"}}>{r.name}</div>
                      <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:9,fontWeight:700,color:diff.color,background:"rgba(255,255,255,.12)",padding:"3px 10px",borderRadius:10}}>{diff.label}</span>
                        <span style={{fontSize:9,fontWeight:600,color:"#C8953A",background:"rgba(255,255,255,.08)",padding:"3px 10px",borderRadius:10}}>🍽 {r.portions} portions</span>
                        <span style={{fontSize:9,fontWeight:600,color:"#A7F3D0",background:"rgba(255,255,255,.08)",padding:"3px 10px",borderRadius:10}}>⏱ {timeLabel}</span>
                      </div>
                    </div>
                    <button onClick={function(){ setViewRecipe(null); }}
                      style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:32,height:32,color:"#FDF8F0",fontSize:16,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
                <div style={{padding:20}}>
                  {/* Temps */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
                    {[
                      {l:"Préparation",v:r.prepTime+"min",icon:"👨‍🍳",bg:"#DBEAFE",c:"#1E40AF"},
                      {l:"Cuisson",v:r.cookTime+"min",icon:"🔥",bg:"#FEF3C7",c:"#92400E"},
                      {l:"Repos/Pousse",v:r.restTime>=60?Math.floor(r.restTime/60)+"h"+(r.restTime%60>0?r.restTime%60+"m":""):r.restTime+"min",icon:"⏳",bg:"#F3E8FF",c:"#7C3AED"},
                    ].map(function(t){
                      return (
                        <div key={t.l} style={{background:t.bg,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                          <div style={{fontSize:16}}>{t.icon}</div>
                          <div style={{fontSize:14,fontWeight:700,color:t.c,fontFamily:"'Outfit',sans-serif"}}>{t.v}</div>
                          <div style={{fontSize:9,color:t.c,textTransform:"uppercase",letterSpacing:.8}}>{t.l}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Ingrédients */}
                  <div style={{marginBottom:18}}>
                    <div style={{fontWeight:700,color:"#1E0E05",fontSize:13,marginBottom:8}}>🧈 Ingrédients ({r.ingredients.length})</div>
                    <div style={{background:"#fff",borderRadius:10,overflow:"hidden",border:"1px solid #EDE0D0"}}>
                      {r.ingredients.map(function(ing,idx){
                        return (
                          <div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",borderBottom:idx<r.ingredients.length-1?"1px solid #F0E8DC":"none",fontSize:12}}>
                            <span style={{color:"#3D2B1A",fontWeight:500}}>{ing.name}</span>
                            <div style={{display:"flex",gap:12}}>
                              <span style={{color:"#C8953A",fontWeight:600}}>{ing.qty} {ing.unit}</span>
                              <span style={{color:"#8B7355",minWidth:50,textAlign:"right"}}>{ing.cost>0?"CHF "+ing.cost.toFixed(2):"-"}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:"#F7F3EE",fontWeight:700,fontSize:12}}>
                        <span style={{color:"#1E0E05"}}>Coût total batch</span>
                        <span style={{color:"#C8953A"}}>CHF {totalCost.toFixed(2)} · {costPerUnit.toFixed(2)}/pièce</span>
                      </div>
                    </div>
                  </div>
                  {/* Étapes */}
                  <div style={{marginBottom:18}}>
                    <div style={{fontWeight:700,color:"#1E0E05",fontSize:13,marginBottom:8}}>📝 Étapes ({r.steps.length})</div>
                    {r.steps.map(function(step,idx){
                      return (
                        <div key={idx} style={{display:"flex",gap:10,marginBottom:8}}>
                          <div style={{width:24,height:24,borderRadius:12,background:"#1E0E05",color:"#C8953A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{idx+1}</div>
                          <div style={{fontSize:12,color:"#3D2B1A",lineHeight:1.5,paddingTop:3}}>{step}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Notes */}
                  {r.notes && (
                    <div style={{background:"#FEF3C7",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"flex-start"}}>
                      <span style={{fontSize:14}}>💡</span>
                      <div style={{fontSize:11,color:"#92400E",lineHeight:1.5}}>{r.notes}</div>
                    </div>
                  )}
                  {/* Actions */}
                  <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
                    {canManageRecipes && (
                      <button onClick={function(){ setEditRecipe(Object.assign({},r)); setViewRecipe(null); }}
                        style={{padding:"8px 16px",borderRadius:8,border:"1px solid #D5C4B0",background:"#FDF8F0",color:"#5C4A32",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                        ✏️ Modifier
                      </button>
                    )}
                    <button onClick={function(){ setViewRecipe(null); }}
                      className="bg" style={{padding:"8px 18px",borderRadius:8,border:"none",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}}>
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── RECIPE EDIT MODAL ── */}
        {editRecipe && (function(){
          var r = editRecipe;
          function updR(patch){ setEditRecipe(function(prev){ return Object.assign({},prev,patch); }); }
          function addIngredient(){ updR({ingredients:r.ingredients.concat([{name:"",qty:0,unit:"g",cost:0}])}); }
          function updIngredient(idx,patch){
            var ings = r.ingredients.map(function(ing,i){ return i===idx?Object.assign({},ing,patch):ing; });
            updR({ingredients:ings});
          }
          function removeIngredient(idx){ updR({ingredients:r.ingredients.filter(function(_,i){return i!==idx;})}); }
          function addStep(){ updR({steps:r.steps.concat([""])}); }
          function updStep(idx,text){ var s=r.steps.slice(); s[idx]=text; updR({steps:s}); }
          function removeStep(idx){ updR({steps:r.steps.filter(function(_,i){return i!==idx;})}); }
          function saveRecipe(){
            var totalCost = r.ingredients.reduce(function(a,ing){return a+(parseFloat(ing.cost)||0);},0);
            var rec = Object.assign({},r,{costPerBatch:totalCost});
            setRecipes(function(prev){
              var exists = prev.find(function(p){ return p.id===rec.id; });
              return exists ? prev.map(function(p){ return p.id===rec.id?rec:p; }) : prev.concat([rec]);
            });
            setEditRecipe(null);
            setSavedMsg("✅ Fiche recette enregistrée"); setTimeout(function(){ setSavedMsg(""); },2500);
          }
          var valid = r.name && r.ingredients.length>0 && r.steps.length>0;
          return (
            <div style={{position:"fixed",inset:0,background:"rgba(30,14,5,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
              onClick={function(){ setEditRecipe(null); }}>
              <div style={{background:"#FDF8F0",borderRadius:18,maxWidth:620,width:"100%",maxHeight:"90vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",animation:"fadeUp .25s ease"}}
                onClick={function(e){e.stopPropagation();}}>
                <div style={{padding:22}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div style={{fontWeight:700,color:"#1E0E05",fontSize:16,fontFamily:"'Outfit',sans-serif"}}>📖 {r.id&&recipes.some(function(x){return x.id===r.id;})?"Modifier":"Nouvelle"} fiche recette</div>
                    <button onClick={function(){ setEditRecipe(null); }}
                      style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#8B7355"}}>✕</button>
                  </div>
                  {/* Info de base */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                    <div style={{gridColumn:"1/3"}}>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Produit</label>
                      <input value={r.name} readOnly style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#EDE0D0",fontSize:12,fontFamily:"'Outfit',sans-serif",color:"#5C4A32"}} />
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Portions/batch</label>
                      <input type="number" min="1" value={r.portions} onChange={function(e){updR({portions:parseInt(e.target.value)||1});}}
                        style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:14}}>
                    <div>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Prépa (min)</label>
                      <input type="number" min="0" value={r.prepTime} onChange={function(e){updR({prepTime:parseInt(e.target.value)||0});}}
                        style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Cuisson (min)</label>
                      <input type="number" min="0" value={r.cookTime} onChange={function(e){updR({cookTime:parseInt(e.target.value)||0});}}
                        style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Repos (min)</label>
                      <input type="number" min="0" value={r.restTime} onChange={function(e){updR({restTime:parseInt(e.target.value)||0});}}
                        style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}} />
                    </div>
                    <div>
                      <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:3}}>Difficulté</label>
                      <select value={r.difficulty} onChange={function(e){updR({difficulty:e.target.value});}}
                        style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif"}}>
                        {DIFF_OPTS.map(function(d){ return <option key={d.id} value={d.id}>{d.label}</option>; })}
                      </select>
                    </div>
                  </div>
                  {/* Ingrédients */}
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <label style={{fontSize:11,fontWeight:700,color:"#1E0E05"}}>🧈 Ingrédients</label>
                      <button onClick={addIngredient}
                        style={{padding:"3px 10px",borderRadius:6,border:"1px solid #C8953A",background:"transparent",color:"#C8953A",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>+ Ajouter</button>
                    </div>
                    {r.ingredients.map(function(ing,idx){
                      return (
                        <div key={idx} style={{display:"grid",gridTemplateColumns:"2fr 1fr 60px 80px 24px",gap:6,marginBottom:4,alignItems:"center"}}>
                          <input value={ing.name} onChange={function(e){updIngredient(idx,{name:e.target.value});}} placeholder="Ingrédient"
                            style={{padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                          <input type="number" min="0" step="0.1" value={ing.qty} onChange={function(e){updIngredient(idx,{qty:parseFloat(e.target.value)||0});}}
                            style={{padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                          <select value={ing.unit} onChange={function(e){updIngredient(idx,{unit:e.target.value});}}
                            style={{padding:"5px 4px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:10,fontFamily:"'Outfit',sans-serif"}}>
                            {["g","kg","ml","L","pcs","pincée","cs","cc"].map(function(u){ return <option key={u} value={u}>{u}</option>; })}
                          </select>
                          <input type="number" min="0" step="0.01" value={ing.cost} onChange={function(e){updIngredient(idx,{cost:parseFloat(e.target.value)||0});}}
                            placeholder="CHF" style={{padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                          <button onClick={function(){removeIngredient(idx);}} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:12}}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                  {/* Étapes */}
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <label style={{fontSize:11,fontWeight:700,color:"#1E0E05"}}>📝 Étapes</label>
                      <button onClick={addStep}
                        style={{padding:"3px 10px",borderRadius:6,border:"1px solid #C8953A",background:"transparent",color:"#C8953A",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>+ Ajouter</button>
                    </div>
                    {r.steps.map(function(step,idx){
                      return (
                        <div key={idx} style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
                          <span style={{width:20,height:20,borderRadius:10,background:"#1E0E05",color:"#C8953A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{idx+1}</span>
                          <input value={step} onChange={function(e){updStep(idx,e.target.value);}} placeholder={"Étape "+(idx+1)}
                            style={{flex:1,padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                          <button onClick={function(){removeStep(idx);}} style={{background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:12}}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                  {/* Notes */}
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:11,fontWeight:700,color:"#1E0E05",display:"block",marginBottom:4}}>💡 Notes & astuces</label>
                    <textarea value={r.notes||""} onChange={function(e){updR({notes:e.target.value});}} rows="3" placeholder="Conseils, variantes, points d'attention..."
                      style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,fontFamily:"'Outfit',sans-serif",resize:"vertical"}} />
                  </div>
                  {/* Boutons */}
                  <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
                    <button onClick={function(){ setEditRecipe(null); }}
                      style={{padding:"9px 18px",borderRadius:10,border:"1px solid #D5C4B0",background:"transparent",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",color:"#8B7355"}}>
                      Annuler
                    </button>
                    <button disabled={!valid} onClick={saveRecipe}
                      className="bg" style={{padding:"9px 22px",borderRadius:10,border:"none",fontSize:12,fontWeight:700,cursor:valid?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",color:"#1E0E05",opacity:valid?1:.5}}>
                      ✓ Enregistrer la recette
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── TAB: REPORTING ── */}
        {adminTab==="reporting" && (function(){
          // ── Date helpers ──
          function parseD(d){ var p=d.split("."); return new Date(p[2],p[1]-1,p[0]); }
          var now = new Date();
          var todayS = now.toLocaleDateString("fr-CH");
          var allS = sales||[];
          var fs = storeFilter==="all" ? allS : allS.filter(function(s){ return s.store===storeFilter; });

          // ── Period filtering ──
          var periodStart, periodEnd = now, periodLabel;
          if(reportPeriod==="jour"){ periodStart=new Date(now.getFullYear(),now.getMonth(),now.getDate()); periodLabel="Aujourd'hui"; }
          else if(reportPeriod==="semaine"){ periodStart=new Date(now); periodStart.setDate(now.getDate()-now.getDay()+1); periodStart.setHours(0,0,0,0); periodLabel="Cette semaine"; }
          else if(reportPeriod==="mois"){ periodStart=new Date(now.getFullYear(),now.getMonth(),1); periodLabel="Ce mois"; }
          else if(reportPeriod==="trimestre"){ var q=Math.floor(now.getMonth()/3)*3; periodStart=new Date(now.getFullYear(),q,1); periodLabel="Ce trimestre (T"+(Math.floor(q/3)+1)+")"; }
          else if(reportPeriod==="annee"){ periodStart=new Date(now.getFullYear(),0,1); periodLabel="Année "+now.getFullYear(); }
          else if(reportPeriod==="custom" && reportCustomFrom){
            var cf=reportCustomFrom.split("-"); periodStart=new Date(cf[0],cf[1]-1,cf[2]);
            if(reportCustomTo){ var ct=reportCustomTo.split("-"); periodEnd=new Date(ct[0],ct[1]-1,ct[2]); }
            periodLabel=reportCustomFrom+(reportCustomTo?" → "+reportCustomTo:"");
          } else { periodStart=new Date(now.getFullYear(),now.getMonth(),1); periodLabel="Ce mois"; }
          periodStart.setHours(0,0,0,0);

          var periodSales = fs.filter(function(s){ var d=parseD(s.date); return d>=periodStart && d<=periodEnd; });
          var totalCA = periodSales.reduce(function(a,s){return a+s.total;},0);
          var totalTx = periodSales.length;
          var avgTicket = totalTx>0 ? totalCA/totalTx : 0;

          // ── TVA ventilation ──
          var tvaByRate = {};
          periodSales.forEach(function(s){
            (s.items||[]).forEach(function(it){
              var rate = it.tva||2.6;
              if(!tvaByRate[rate]) tvaByRate[rate]={rate:rate,ht:0,tva:0,ttc:0,items:0};
              var ttc = it.price*it.qty;
              var tvaAmt = ttc/(100+rate)*rate;
              tvaByRate[rate].ttc+=ttc; tvaByRate[rate].tva+=tvaAmt; tvaByRate[rate].ht+=(ttc-tvaAmt); tvaByRate[rate].items+=it.qty;
            });
          });
          var tvaLines = Object.values(tvaByRate).sort(function(a,b){return a.rate-b.rate;});
          var totalHT = tvaLines.reduce(function(a,l){return a+l.ht;},0);
          var totalTVA = tvaLines.reduce(function(a,l){return a+l.tva;},0);

          // ── By category ──
          var byCat = {};
          periodSales.forEach(function(s){
            (s.items||[]).forEach(function(it){
              var catP = catalogue.find(function(c){return c.name===it.name||c.id===it.id;});
              var cat = catP ? catP.category : "Autre";
              if(!byCat[cat]) byCat[cat]={cat:cat,ca:0,qty:0};
              byCat[cat].ca+=it.price*it.qty; byCat[cat].qty+=it.qty;
            });
          });
          var catData = Object.values(byCat).sort(function(a,b){return b.ca-a.ca;});
          var maxCatCA = catData.length>0 ? catData[0].ca : 1;
          var catColors = {"Viennoiseries":"#C8953A","Pains":"#8B5CF6","Patisseries":"#EC4899","Tartes":"#10B981","Traiteur":"#3B82F6","Autre":"#8B7355"};

          // ── By product (margin analysis) ──
          var byProd = {};
          periodSales.forEach(function(s){
            (s.items||[]).forEach(function(it){
              var key = it.name;
              if(!byProd[key]) byProd[key]={name:key,ca:0,qty:0,cost:0,id:it.id};
              byProd[key].ca+=it.price*it.qty; byProd[key].qty+=it.qty;
            });
          });
          Object.values(byProd).forEach(function(p){
            var catP = catalogue.find(function(c){return c.id===p.id||c.name===p.name;});
            p.cost = catP ? catP.cost*p.qty : 0;
            p.marge = p.ca>0 ? (p.ca-p.cost)/p.ca*100 : 0;
            p.emoji = catP ? catP.emoji : "📦";
          });
          var prodData = Object.values(byProd).sort(function(a,b){return b.ca-a.ca;});

          // ── Daily CA trend (last N days depending on period) ──
          var dayCount = reportPeriod==="jour"?1:reportPeriod==="semaine"?7:reportPeriod==="mois"?30:reportPeriod==="trimestre"?90:365;
          if(reportPeriod==="custom") dayCount = Math.max(1,Math.ceil((periodEnd-periodStart)/(86400000)));
          dayCount = Math.min(dayCount, 60); // cap at 60 bars
          var trendData = [];
          for(var d=dayCount-1; d>=0; d--){
            var dt=new Date(now); dt.setDate(now.getDate()-d); dt.setHours(0,0,0,0);
            var ds=dt.toLocaleDateString("fr-CH");
            var dayCA=fs.filter(function(s){return s.date===ds;}).reduce(function(a,s){return a+s.total;},0);
            var label = dayCount<=7 ? ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dt.getDay()] : dt.getDate()+"/"+(dt.getMonth()+1);
            trendData.push({label:label, ca:dayCA, date:ds});
          }
          var maxDayCA = trendData.reduce(function(m,d){return Math.max(m,d.ca);},1);

          // ── By store ──
          var storeCA = {};
          STORES.forEach(function(st){ storeCA[st]=0; });
          periodSales.forEach(function(s){ if(storeCA[s.store]!==undefined) storeCA[s.store]+=s.total; });

          // ── Export functions ──
          function exportComptable(){
            var csv = "Date;Heure;Ticket;Magasin;Vendeuse;Client;Articles;Total TTC;Total HT;TVA;Mode paiement\n";
            periodSales.forEach(function(s){
              var tv = s.tvaInfo || computeTVA(s.items);
              csv += [s.date,s.time,s.id,'"'+s.store+'"',s.seller||"",'"'+s.client+'"',
                '"'+s.items.map(function(i){return i.qty+"x "+i.name;}).join(", ")+'"',
                s.total.toFixed(2),tv.totalHT.toFixed(2),(s.total-tv.totalHT).toFixed(2),s.payInfo.method].join(";")+"\n";
            });
            var blob = new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
            var a = document.createElement("a"); a.href=URL.createObjectURL(blob);
            a.download="journal_ventes_"+reportPeriod+"_"+todayS.replace(/\./g,"-")+".csv"; a.click();
            setSavedMsg("✅ Journal comptable exporté ("+periodSales.length+" lignes)"); setTimeout(function(){ setSavedMsg(""); },3000);
          }

          function exportTVA(){
            var csv = "Période;Taux TVA;CA TTC;CA HT;Montant TVA;Nb articles\n";
            tvaLines.forEach(function(l){
              csv += [periodLabel,l.rate+"%",l.ttc.toFixed(2),l.ht.toFixed(2),l.tva.toFixed(2),l.items].join(";")+"\n";
            });
            csv += [periodLabel,"TOTAL",totalCA.toFixed(2),totalHT.toFixed(2),totalTVA.toFixed(2),""].join(";")+"\n";
            var blob = new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
            var a = document.createElement("a"); a.href=URL.createObjectURL(blob);
            a.download="rapport_tva_"+reportPeriod+"_"+todayS.replace(/\./g,"-")+".csv"; a.click();
            setSavedMsg("✅ Rapport TVA exporté"); setTimeout(function(){ setSavedMsg(""); },3000);
          }

          function exportMarges(){
            var csv = "Produit;Catégorie;Qté vendue;CA TTC;Coût total;Marge brute;Marge %\n";
            prodData.forEach(function(p){
              var catP = catalogue.find(function(c){return c.name===p.name;});
              csv += ['"'+p.name+'"',catP?catP.category:"",p.qty,p.ca.toFixed(2),p.cost.toFixed(2),(p.ca-p.cost).toFixed(2),p.marge.toFixed(1)+"%"].join(";")+"\n";
            });
            var blob = new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
            var a = document.createElement("a"); a.href=URL.createObjectURL(blob);
            a.download="marges_produits_"+reportPeriod+"_"+todayS.replace(/\./g,"-")+".csv"; a.click();
            setSavedMsg("✅ Rapport marges exporté"); setTimeout(function(){ setSavedMsg(""); },3000);
          }

          // SVG chart dimensions
          var chartW = 520, chartH = 120, barW = Math.max(4, Math.min(16, (chartW-20)/trendData.length - 2));

          return (
            <div>
              {/* Demo data loader + empty state */}
              {fs.length===0 && (
                <div style={{background:"linear-gradient(135deg,#FEF3C7,#FDF0D8)",borderRadius:14,padding:"20px 22px",marginBottom:16,border:"2px solid #C8953A",textAlign:"center"}}>
                  <div style={{fontSize:28,marginBottom:6}}>📊</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#1E0E05",marginBottom:4,fontFamily:"'Outfit',sans-serif"}}>Aucune vente enregistrée</div>
                  <div style={{fontSize:11,color:"#8B7355",marginBottom:12}}>Chargez les données de démonstration pour voir le rapport en action</div>
                  <button onClick={loadDemoData}
                    style={{padding:"10px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#C8953A",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    🔄 Charger 22 ventes + 4 cartes cadeaux de démo
                  </button>
                </div>
              )}
              {/* Période selector */}
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8}}>Période :</span>
                {[["jour","Jour"],["semaine","Semaine"],["mois","Mois"],["trimestre","Trimestre"],["annee","Année"],["custom","Personnalisé"]].map(function(p){
                  return (
                    <button key={p[0]} onClick={function(){ setReportPeriod(p[0]); }}
                      style={{padding:"6px 14px",borderRadius:8,border:reportPeriod===p[0]?"2px solid #1E0E05":"1px solid #D5C4B0",
                              background:reportPeriod===p[0]?"#1E0E05":"#fff",color:reportPeriod===p[0]?"#C8953A":"#5C4A32",
                              fontSize:11,fontWeight:reportPeriod===p[0]?700:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                      {p[1]}
                    </button>
                  );
                })}
                {reportPeriod==="custom" && (
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input type="date" value={reportCustomFrom} onChange={function(e){setReportCustomFrom(e.target.value);}}
                      style={{padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                    <span style={{fontSize:10,color:"#8B7355"}}>→</span>
                    <input type="date" value={reportCustomTo} onChange={function(e){setReportCustomTo(e.target.value);}}
                      style={{padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",fontSize:11,fontFamily:"'Outfit',sans-serif"}} />
                  </div>
                )}
                <span style={{fontSize:11,color:"#C8953A",fontWeight:600,marginLeft:8}}>{periodLabel}</span>
              </div>

              {/* KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
                {[
                  {l:"CA TTC",v:"CHF "+totalCA.toFixed(2),icon:"💰",bg:"linear-gradient(135deg,#1E0E05,#3D2B1A)",a:"#C8953A"},
                  {l:"CA HT",v:"CHF "+totalHT.toFixed(2),icon:"📋",bg:"linear-gradient(135deg,#065F46,#059669)",a:"#A7F3D0"},
                  {l:"Total TVA",v:"CHF "+totalTVA.toFixed(2),icon:"🏛",bg:"linear-gradient(135deg,#7C3AED,#5B21B6)",a:"#E9D5FF"},
                  {l:"Ticket moyen",v:"CHF "+avgTicket.toFixed(2),icon:"🧾",bg:"linear-gradient(135deg,#1E40AF,#2563EB)",a:"#BFDBFE"},
                ].map(function(k){
                  return (
                    <div key={k.l} className="ch" style={{background:k.bg,borderRadius:14,padding:"16px 14px",boxShadow:"0 4px 16px rgba(0,0,0,.1)"}}>
                      <div style={{fontSize:22,marginBottom:4}}>{k.icon}</div>
                      <div style={{fontSize:18,fontWeight:700,color:k.a,fontFamily:"'Outfit',sans-serif",marginBottom:2}}>{k.v}</div>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.42)",textTransform:"uppercase",letterSpacing:.8}}>{k.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Exports */}
              {canExportData && (
                <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                  <button onClick={exportComptable}
                    style={{padding:"8px 16px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#FDF8F0",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    📤 Journal comptable CSV
                  </button>
                  <button onClick={exportTVA}
                    style={{padding:"8px 16px",borderRadius:9,border:"2px solid #7C3AED",background:"transparent",color:"#7C3AED",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    🏛 Rapport TVA CSV
                  </button>
                  <button onClick={exportMarges}
                    style={{padding:"8px 16px",borderRadius:9,border:"2px solid #C8953A",background:"transparent",color:"#C8953A",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    📊 Marges produits CSV
                  </button>
                  <span style={{alignSelf:"center",fontSize:10,color:"#8B7355"}}>{periodSales.length} ticket(s) · {periodLabel}</span>
                  <button onClick={loadDemoData} title="Recharger les données de démonstration"
                    style={{marginLeft:"auto",padding:"6px 12px",borderRadius:7,border:"1px dashed #D5C4B0",background:"transparent",color:"#8B7355",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    🔄 Réinit. démo
                  </button>
                </div>
              )}

              {/* Graphique CA tendance */}
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",marginBottom:16}}>
                <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>📈 Évolution du chiffre d'affaires en CHF ({periodLabel})</div>
                {trendData.length<=1 ? (
                  <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"20px 0"}}>Pas assez de données pour un graphique</div>
                ) : (
                  <svg width="100%" viewBox={"0 0 "+(chartW+10)+" "+(chartH+25)} style={{overflow:"visible"}}>
                    {[0,0.25,0.5,0.75,1].map(function(t){
                      var y=chartH-t*chartH;
                      return <g key={t}>
                        <line x1="0" y1={y} x2={chartW} y2={y} stroke="#F0E8DC" strokeWidth=".5"/>
                        <text x={chartW+2} y={y+3} fontSize="7" fill="#8B7355">{"CHF "+(maxDayCA*t).toFixed(0)}</text>
                      </g>;
                    })}
                    {trendData.map(function(d,i){
                      var x = 5 + i*(chartW/trendData.length);
                      var h = d.ca>0 ? Math.max(2, d.ca/maxDayCA*chartH) : 0;
                      var isToday = d.date===todayS;
                      return <g key={i}>
                        <rect x={x} y={chartH-h} width={barW} height={h} rx="2"
                          fill={isToday?"#C8953A":"#DBC9A8"} opacity={d.ca>0?1:.3}>
                          <title>{d.label+" — CHF "+d.ca.toFixed(2)}</title>
                        </rect>
                        {d.ca>0 && trendData.length<=15 && (
                          <text x={x+barW/2} y={chartH-h-3} textAnchor="middle" fontSize="7" fontWeight="600" fill="#1E0E05">{d.ca.toFixed(0)}</text>
                        )}
                        {(trendData.length<=15 || i%Math.ceil(trendData.length/15)===0) && (
                          <text x={x+barW/2} y={chartH+12} textAnchor="middle" fontSize="7" fill="#8B7355">{d.label}</text>
                        )}
                      </g>;
                    })}
                  </svg>
                )}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                {/* Rapport TVA */}
                <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>🏛 Ventilation TVA suisse</div>
                  {tvaLines.length===0 ? (
                    <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune donnée</div>
                  ) : (
                    <div>
                      {tvaLines.map(function(l){
                        var pct = totalCA>0 ? l.ttc/totalCA*100 : 0;
                        var rateLabel = l.rate===2.6 ? "Alimentaire" : l.rate===8.1 ? "Restauration" : l.rate+"%";
                        return (
                          <div key={l.rate} style={{background:"#F7F3EE",borderRadius:10,padding:"12px 14px",marginBottom:8}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <div>
                                <span style={{fontSize:13,fontWeight:700,color:"#1E0E05"}}>{l.rate}%</span>
                                <span style={{fontSize:10,color:"#8B7355",marginLeft:6}}>{rateLabel}</span>
                              </div>
                              <span style={{fontSize:10,color:"#8B7355"}}>{l.items} articles · {pct.toFixed(0)}% du CA</span>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                              <div><div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase"}}>TTC</div><div style={{fontSize:12,fontWeight:700,color:"#1E0E05"}}>CHF {l.ttc.toFixed(2)}</div></div>
                              <div><div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase"}}>HT</div><div style={{fontSize:12,fontWeight:700,color:"#065F46"}}>CHF {l.ht.toFixed(2)}</div></div>
                              <div><div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase"}}>TVA due</div><div style={{fontSize:12,fontWeight:700,color:"#7C3AED"}}>CHF {l.tva.toFixed(2)}</div></div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,borderRadius:10,overflow:"hidden",border:"2px solid #1E0E05",marginTop:4}}>
                        <div style={{background:"#FDF8F0",padding:"14px 16px",textAlign:"center",borderRight:"1px solid #EDE0D0"}}>
                          <div style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Total TTC</div>
                          <div style={{fontSize:18,fontWeight:800,color:"#1E0E05",fontFamily:"'Outfit',sans-serif"}}>CHF {totalCA.toFixed(2)}</div>
                        </div>
                        <div style={{background:"#FDF8F0",padding:"14px 16px",textAlign:"center",borderRight:"1px solid #EDE0D0"}}>
                          <div style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>Total HT</div>
                          <div style={{fontSize:18,fontWeight:800,color:"#065F46",fontFamily:"'Outfit',sans-serif"}}>CHF {totalHT.toFixed(2)}</div>
                        </div>
                        <div style={{background:"#F3E8FF",padding:"14px 16px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:"#5B21B6",textTransform:"uppercase",letterSpacing:.8,marginBottom:4,fontWeight:700}}>TVA due</div>
                          <div style={{fontSize:18,fontWeight:800,color:"#5B21B6",fontFamily:"'Outfit',sans-serif"}}>CHF {totalTVA.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CA par catégorie */}
                <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                  <div style={{fontWeight:600,color:"#1E0E05",fontSize:12,marginBottom:12}}>📦 CA par catégorie</div>
                  {catData.length===0 ? (
                    <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune donnée</div>
                  ) : catData.map(function(c){
                    var pct = c.ca/maxCatCA*100;
                    var color = catColors[c.cat]||"#8B7355";
                    return (
                      <div key={c.cat} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                          <span style={{color:"#5C4A32",fontWeight:600}}>{c.cat}</span>
                          <span style={{fontWeight:700,color:color}}>CHF {c.ca.toFixed(2)} · {c.qty} pcs</span>
                        </div>
                        <div style={{height:8,background:"#F0E8DC",borderRadius:4,overflow:"hidden"}}>
                          <div style={{width:pct+"%",height:"100%",background:color,borderRadius:4,transition:"width .4s ease"}} />
                        </div>
                      </div>
                    );
                  })}
                  {/* CA par magasin */}
                  {storeFilter==="all" && (
                    <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid #F0E8DC"}}>
                      <div style={{fontWeight:600,color:"#1E0E05",fontSize:11,marginBottom:8}}>🏪 Par magasin</div>
                      {STORES.map(function(st){
                        var ca = storeCA[st]||0;
                        var pct = totalCA>0 ? ca/totalCA*100 : 0;
                        return (
                          <div key={st} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontSize:10,color:"#5C4A32",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{st}</span>
                            <span style={{fontSize:11,fontWeight:700,color:"#C8953A",flexShrink:0}}>CHF {ca.toFixed(2)}</span>
                            <span style={{fontSize:9,color:"#8B7355",flexShrink:0}}>({pct.toFixed(0)}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Analyse marges par produit */}
              <div style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:600,color:"#1E0E05",fontSize:12}}>📊 Analyse marges par produit</div>
                  <span style={{fontSize:9,color:"#8B7355"}}>{prodData.length} produits vendus</span>
                </div>
                {prodData.length===0 ? (
                  <div style={{textAlign:"center",color:"#8B7355",fontSize:11,padding:"16px 0"}}>Aucune vente sur cette période</div>
                ) : (
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{background:"#F7F3EE"}}>
                          <th style={{padding:"8px 6px",textAlign:"left",color:"#5C4A32",fontWeight:700,fontSize:10}}>Produit</th>
                          <th style={{padding:"8px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>Qté</th>
                          <th style={{padding:"8px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>CA TTC</th>
                          {canViewCost && <th style={{padding:"8px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>Coût</th>}
                          {canViewCost && <th style={{padding:"8px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>Marge</th>}
                          {canViewCost && <th style={{padding:"8px 6px",textAlign:"right",color:"#5C4A32",fontWeight:700,fontSize:10}}>Marge %</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {prodData.map(function(p,idx){
                          var margeColor = p.marge>=50?"#065F46":p.marge>=30?"#92400E":"#DC2626";
                          var margeBg = p.marge>=50?"#D1FAE5":p.marge>=30?"#FEF3C7":"#FEE2E2";
                          return (
                            <tr key={p.name} className="tr" style={{borderBottom:"1px solid #F7F3EE"}}>
                              <td style={{padding:"7px 6px"}}>
                                <div style={{display:"flex",alignItems:"center",gap:6}}>
                                  <span style={{fontSize:14}}>{p.emoji}</span>
                                  <span style={{fontWeight:600,color:"#1E0E05"}}>{p.name}</span>
                                </div>
                              </td>
                              <td style={{padding:"7px 6px",textAlign:"right",color:"#5C4A32"}}>{p.qty}</td>
                              <td style={{padding:"7px 6px",textAlign:"right",fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {p.ca.toFixed(2)}</td>
                              {canViewCost && <td style={{padding:"7px 6px",textAlign:"right",color:"#8B7355"}}>CHF {p.cost.toFixed(2)}</td>}
                              {canViewCost && <td style={{padding:"7px 6px",textAlign:"right",fontWeight:600,color:margeColor}}>CHF {(p.ca-p.cost).toFixed(2)}</td>}
                              {canViewCost && <td style={{padding:"7px 6px",textAlign:"right"}}>
                                <span style={{fontSize:9,fontWeight:700,color:margeColor,background:margeBg,padding:"2px 8px",borderRadius:8}}>{p.marge.toFixed(1)}%</span>
                              </td>}
                            </tr>
                          );
                        })}
                      </tbody>
                      {canViewCost && (
                        <tfoot>
                          <tr style={{background:"#F7F3EE",fontWeight:700}}>
                            <td style={{padding:"8px 6px",color:"#1E0E05"}}>TOTAL</td>
                            <td style={{padding:"8px 6px",textAlign:"right",color:"#1E0E05"}}>{prodData.reduce(function(a,p){return a+p.qty;},0)}</td>
                            <td style={{padding:"8px 6px",textAlign:"right",color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {totalCA.toFixed(2)}</td>
                            <td style={{padding:"8px 6px",textAlign:"right",color:"#8B7355"}}>CHF {prodData.reduce(function(a,p){return a+p.cost;},0).toFixed(2)}</td>
                            <td style={{padding:"8px 6px",textAlign:"right",color:"#065F46"}}>CHF {(totalCA-prodData.reduce(function(a,p){return a+p.cost;},0)).toFixed(2)}</td>
                            <td style={{padding:"8px 6px",textAlign:"right"}}>
                              {(function(){ var tc=prodData.reduce(function(a,p){return a+p.cost;},0); var m=totalCA>0?(totalCA-tc)/totalCA*100:0;
                                return <span style={{fontSize:9,fontWeight:700,color:m>=50?"#065F46":"#92400E",background:m>=50?"#D1FAE5":"#FEF3C7",padding:"2px 8px",borderRadius:8}}>{m.toFixed(1)}%</span>;
                              })()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══ ONGLET IMPRIMANTE ═══════════════════════════════════ */}
        {adminTab==="imprimante" && (function(){
          var pConfig = printer.config || PrinterService.getConfig();
          return (
            <div style={{animation:"fadeUp .25s ease"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div>
                  <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:22,color:"#1E0E05",margin:"0 0 4px"}}>🖨 Imprimante thermique</h3>
                  <p style={{color:"#8B7355",fontSize:12,margin:0}}>Configuration ESC/POS · Web Serial API · Fallback HTML</p>
                </div>
              </div>

              {/* Status message */}
              {printer.error && (
                <div style={{padding:"12px 16px",borderRadius:12,marginBottom:16,background:"#FEE2E2",color:"#991B1B",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,animation:"fadeUp .2s ease"}}>
                  ❌ {printer.error}
                </div>
              )}

              {/* Connection card */}
              <div style={{background:"#1E0E05",borderRadius:16,padding:24,marginBottom:16,boxShadow:"0 4px 20px rgba(30,14,5,.15)"}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700,color:"#C8953A",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>🔗 Connexion</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",borderRadius:20,
                    background:printer.connected?"#D1FAE5":"#FEF3C7",color:printer.connected?"#065F46":"#92400E",
                    fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600}}>
                    <div style={{width:8,height:8,borderRadius:4,background:printer.connected?"#10B981":"#F59E0B",animation:"glow 1.5s ease infinite alternate"}} />
                    {printer.connected?"Connectée":"Non connectée"}
                  </div>
                  {!printer.supported && (
                    <div style={{padding:"6px 12px",borderRadius:8,background:"rgba(239,68,68,.15)",color:"#EF4444",fontSize:11,fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
                      ⚠️ Web Serial non supporté — utilisez Chrome/Edge
                    </div>
                  )}
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {!printer.connected ? (
                    <button onClick={function(){ printer.connect().catch(function(){}); }}
                      disabled={printer.loading||!printer.supported}
                      style={{padding:"10px 20px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#C8953A,#E8B968)",color:"#fff",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",opacity:printer.loading||!printer.supported?.5:1}}>
                      {printer.loading?"⏳ Connexion…":"🔗 Connecter l'imprimante"}
                    </button>
                  ) : (
                    React.createElement(React.Fragment,null,
                      React.createElement("button",{onClick:function(){ printer.printTest().catch(function(){}); },disabled:printer.loading,
                        style:{padding:"10px 20px",borderRadius:10,border:"none",background:"#D1FAE5",color:"#065F46",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}},"🧪 Page de test"),
                      React.createElement("button",{onClick:function(){ printer.openDrawer(); },
                        style:{padding:"10px 20px",borderRadius:10,border:"1px solid #3D2B1A",background:"#1E0E05",color:"#FDF8F0",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}},"🗃 Tiroir-caisse"),
                      React.createElement("button",{onClick:function(){ printer.disconnect(); },
                        style:{padding:"10px 20px",borderRadius:10,border:"none",background:"#FEE2E2",color:"#991B1B",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}},"Déconnecter")
                    )
                  )}
                </div>
                {printer.lastPrint && (
                  <div style={{marginTop:12,fontSize:11,color:"rgba(253,248,240,.4)",fontFamily:"'Outfit',sans-serif"}}>
                    Dernière action: {printer.lastPrint.type} à {printer.lastPrint.time}
                    {printer.lastPrint.fallback?" (HTML fallback)":""}
                    {printer.lastPrint.success?" ✅":" ❌"}
                  </div>
                )}
              </div>

              {/* Hardware config */}
              <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE0D0",padding:24,marginBottom:16}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700,color:"#1E0E05",marginBottom:16}}>⚙️ Configuration matérielle</div>
                <div style={{display:"flex",gap:12,marginBottom:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:"#5C4A32",marginBottom:6}}>Largeur papier</div>
                    <div style={{display:"flex",gap:8}}>
                      {["80mm","58mm"].map(function(k){
                        var active=pConfig.paperWidth===k;
                        return React.createElement("button",{key:k,onClick:function(){ printer.updateConfig(Object.assign({},pConfig,{paperWidth:k})); },
                          style:{padding:"6px 14px",borderRadius:20,border:active?"2px solid #C8953A":"1px solid #EDE0D0",background:active?"rgba(200,149,58,.1)":"#fff",
                            color:active?"#C8953A":"#5C4A32",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:active?700:500,cursor:"pointer"}},
                          k+" ("+PAPER[k].chars+" car.)");
                      })}
                    </div>
                  </div>
                  <div style={{width:150}}>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:"#5C4A32",marginBottom:6}}>Baud rate</div>
                    <select value={pConfig.baudRate} onChange={function(e){ printer.updateConfig(Object.assign({},pConfig,{baudRate:parseInt(e.target.value)})); }}
                      style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #EDE0D0",fontFamily:"'Outfit',sans-serif",fontSize:13,color:"#1E0E05",background:"#FDFAF6",cursor:"pointer"}}>
                      <option value={9600}>9600</option><option value={19200}>19200</option><option value={38400}>38400</option><option value={115200}>115200</option>
                    </select>
                  </div>
                </div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:"#5C4A32",marginBottom:6}}>Copies</div>
                <div style={{display:"flex",gap:6,marginBottom:14}}>
                  {[1,2,3].map(function(n){ var active=pConfig.copies===n;
                    return React.createElement("button",{key:n,onClick:function(){ printer.updateConfig(Object.assign({},pConfig,{copies:n})); },
                      style:{padding:"6px 14px",borderRadius:20,border:active?"2px solid #C8953A":"1px solid #EDE0D0",background:active?"rgba(200,149,58,.1)":"#fff",
                        color:active?"#C8953A":"#5C4A32",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:active?700:500,cursor:"pointer"}},n+"×");
                  })}
                </div>
                {/* Toggles */}
                {[["autoCut","Couper le papier automatiquement"],["openDrawer","Ouvrir tiroir-caisse (paiement espèces)"],["beepOnPrint","Bip sonore après impression"]].map(function(t){
                  var key=t[0],label=t[1],on=pConfig[key];
                  return React.createElement("div",{key:key,style:{display:"flex",alignItems:"center",gap:10,marginBottom:12}},
                    React.createElement("div",{onClick:function(){ var p={};p[key]=!on;printer.updateConfig(Object.assign({},pConfig,p)); },
                      style:{width:44,height:24,borderRadius:12,background:on?"#C8953A":"#D4C5B0",position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}},
                      React.createElement("div",{style:{width:18,height:18,borderRadius:9,background:"#fff",position:"absolute",top:3,left:on?23:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}})
                    ),
                    React.createElement("span",{style:{fontFamily:"'Outfit',sans-serif",fontSize:12,color:"#5C4A32"}},label)
                  );
                })}
              </div>

              {/* Receipt content */}
              <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE0D0",padding:24,marginBottom:16}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700,color:"#1E0E05",marginBottom:16}}>🧾 Contenu du ticket</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:"#5C4A32",marginBottom:4}}>Numéro TVA</div>
                <input value={pConfig.tvaNumber||""} onChange={function(e){ printer.updateConfig(Object.assign({},pConfig,{tvaNumber:e.target.value})); }}
                  placeholder="CHE-123.456.789 TVA"
                  style={{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #EDE0D0",fontFamily:"'Outfit',sans-serif",fontSize:13,color:"#1E0E05",background:"#FDFAF6",marginBottom:12,boxSizing:"border-box"}} />
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:"#5C4A32",marginBottom:6}}>Pied de page</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                  {(pConfig.footerLines||[]).map(function(line,idx){
                    return React.createElement("div",{key:idx,style:{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,background:"#F7F3EE",border:"1px solid #EDE0D0",fontSize:12,fontFamily:"'Outfit',sans-serif",color:"#5C4A32"}},
                      line,
                      React.createElement("span",{onClick:function(){ var nl=(pConfig.footerLines||[]).filter(function(_,i){return i!==idx;});printer.updateConfig(Object.assign({},pConfig,{footerLines:nl})); },
                        style:{cursor:"pointer",color:"#DC2626",marginLeft:4,fontWeight:700}},"✕")
                    );
                  })}
                </div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:"#5C4A32",marginBottom:6,marginTop:12}}>Avance papier avant coupe</div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(function(n){ var active=pConfig.feedLines===n;
                    return React.createElement("button",{key:n,onClick:function(){ printer.updateConfig(Object.assign({},pConfig,{feedLines:n})); },
                      style:{padding:"6px 14px",borderRadius:20,border:active?"2px solid #C8953A":"1px solid #EDE0D0",background:active?"rgba(200,149,58,.1)":"#fff",
                        color:active?"#C8953A":"#5C4A32",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:active?700:500,cursor:"pointer"}},String(n));
                  })}
                </div>
              </div>

              {/* Receipt preview */}
              <div style={{background:"#fff",borderRadius:16,border:"1px solid #EDE0D0",padding:24,marginBottom:16}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700,color:"#1E0E05",marginBottom:16}}>👁 Aperçu ticket</div>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:11,lineHeight:1.6,background:"#fff",border:"2px solid #EDE0D0",borderRadius:12,padding:16,maxWidth:300,margin:"0 auto",boxShadow:"inset 0 2px 8px rgba(0,0,0,.04)"}}>
                  <div style={{textAlign:"center",fontWeight:700,fontSize:14}}>{tenant}</div>
                  {pConfig.tvaNumber && <div style={{textAlign:"center",fontSize:9,color:"#888"}}>{pConfig.tvaNumber}</div>}
                  <div style={{borderTop:"2px solid #000",margin:"6px 0"}} />
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>Ticket: T-00042</span><span>14:32</span></div>
                  <div>Vendeur: Léa</div>
                  <div>Mode: Sur place · Table: 5</div>
                  <div style={{borderTop:"1px dashed #000",margin:"4px 0"}} />
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>2× Croissant</span><span>4.80</span></div>
                  <div style={{fontSize:9,color:"#888",paddingLeft:12}}>@ CHF 2.40</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>1× Café crème</span><span>4.50</span></div>
                  <div style={{borderTop:"1px dashed #000",margin:"4px 0"}} />
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#888"}}><span>TVA 8.1% (HT 8.60)</span><span>CHF 0.70</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#888"}}><span>Total HT</span><span>CHF 8.60</span></div>
                  <div style={{borderTop:"1px dashed #000",margin:"4px 0"}} />
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:14}}><span>TOTAL TTC</span><span>CHF 9.30</span></div>
                  <div style={{borderTop:"1px dashed #000",margin:"4px 0"}} />
                  <div>Paiement: Espèces</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span>Reçu</span><span>CHF 10.00</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Rendu</span><span>CHF 0.70</span></div>
                  <div style={{borderTop:"1px dashed #000",margin:"4px 0"}} />
                  <div style={{textAlign:"center",fontSize:9,color:"#888"}}>{(pConfig.footerLines||["Merci de votre visite !"]).join(" · ")}</div>
                  <div style={{textAlign:"center",fontSize:9,color:"#aaa"}}>{new Date().toLocaleString("fr-CH")}</div>
                </div>
              </div>

              {/* Help */}
              <div style={{background:"#FDFAF6",borderRadius:16,border:"1px solid #EDE0D0",padding:24}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700,color:"#1E0E05",marginBottom:12}}>💡 Imprimantes compatibles</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:"#5C4A32",lineHeight:1.7}}>
                  <strong>USB direct (Web Serial) :</strong> Epson TM-T20III, TM-T88VI · Star TSP143IV · Bixolon SRP-330III<br />
                  <strong>Navigateurs :</strong> Chrome 89+, Edge 89+, Opera 75+<br />
                  <strong>Fallback :</strong> Firefox/Safari → impression HTML classique optimisée 80mm
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

