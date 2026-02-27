/* BakeryOS — Constants & Demo Data */

const APP_VERSION = "3.8.0";

const PRODUCTS = [
  { id:1,  name:"Croissant au beurre",    price:2.40,  cost:0.85,  category:"Viennoiseries", emoji:"🥐", tva:2.6 },
  { id:2,  name:"Pain au chocolat",       price:2.80,  cost:1.05,  category:"Viennoiseries", emoji:"🍫", tva:2.6 },
  { id:3,  name:"Baguette tradition",     price:1.50,  cost:0.52,  category:"Pains",         emoji:"🥖", tva:2.6 },
  { id:4,  name:"Pain de campagne",       price:4.20,  cost:1.40,  category:"Pains",         emoji:"🍞", tva:2.6 },
  { id:5,  name:"Tarte aux pommes",       price:28.00, cost:9.50,  category:"Tartes",        emoji:"🥧", tva:2.6 },
  { id:6,  name:"Eclair chocolat",        price:4.50,  cost:1.60,  category:"Patisseries",   emoji:"🍮", tva:2.6 },
  { id:7,  name:"Mille-feuille",          price:5.20,  cost:1.90,  category:"Patisseries",   emoji:"🍰", tva:2.6 },
  { id:8,  name:"Chausson aux pommes",    price:2.60,  cost:0.90,  category:"Viennoiseries", emoji:"🍏", tva:2.6 },
  { id:9,  name:"Macaron (6 pcs)",        price:12.00, cost:4.20,  category:"Patisseries",   emoji:"🎨", tva:2.6 },
  { id:10, name:"Sandwich jambon-beurre", price:5.50,  cost:2.30,  category:"Traiteur",      emoji:"🥪", tva:8.1 },
  { id:11, name:"Quiche lorraine",        price:6.80,  cost:2.60,  category:"Traiteur",      emoji:"🥗", tva:8.1 },
  { id:12, name:"Financier amande",       price:1.80,  cost:0.58,  category:"Patisseries",   emoji:"✨", tva:2.6 },
];
const STORES = ["Rue du Four 12", "Place de la Liberte 3", "Avenue des Fleurs 8"];
const CATS   = ["Tous","Viennoiseries","Pains","Patisseries","Tartes","Traiteur"];
const PIN    = "1234";
const SM = {
  attente:    { bg:"#FEF3C7", tx:"#92400E", label:"En attente",    dot:"#F59E0B", lock:false, warn:false },
  production: { bg:"#DBEAFE", tx:"#1E40AF", label:"En production", dot:"#3B82F6", lock:false, warn:true  },
  prete:      { bg:"#FEE2E2", tx:"#991B1B", label:"Prete",         dot:"#EF4444", lock:true,  warn:false },
  livraison:  { bg:"#F3E8FF", tx:"#7C3AED", label:"En livraison",  dot:"#8B5CF6", lock:true,  warn:false },
  livre:      { bg:"#D1FAE5", tx:"#065F46", label:"Livre",         dot:"#10B981", lock:true,  warn:false },
};

const ROLES = [
  { id:"vendeuse",   icon:"🛒", label:"Vendeuse",   prot:false },
  { id:"production", icon:"👨‍🍳", label:"Production", prot:false },
  { id:"livreur",    icon:"🚐", label:"Livreur",    prot:false },
  { id:"gerant",     icon:"🏪", label:"Gérant(e)",  prot:true, storeSelect:true },
  { id:"admin",      icon:"📊", label:"Admin",       prot:true  },
];
const DRIVERS = ["Paul Mercier","Karim Saïdi","Lucas Fontaine","Non assigné"];

// ─── PERMISSIONS
const PERMS_DEF = {
  // Écrans (navigation sidebar)
  screens: [
    { id:"vendeuse",    label:"🛒 Vue Vendeuse / Caisse",     group:"screens" },
    { id:"production",  label:"👨‍🍳 Vue Production",           group:"screens" },
    { id:"livreur",     label:"🚐 Vue Livreur",               group:"screens" },
    { id:"gerant",      label:"🏪 Vue Gérant (admin limité)", group:"screens" },
    { id:"admin",       label:"📊 Vue Admin complète",        group:"screens" },
  ],
  // Onglets visibles dans la vue Admin/Gérant
  adminTabs: [
    { id:"dashboard",     label:"📊 Vue générale",     group:"adminTabs" },
    { id:"commandes",     label:"📋 Commandes",         group:"adminTabs" },
    { id:"catalogue",     label:"📦 Catalogue",         group:"adminTabs" },
    { id:"gestion",       label:"⚙️ Gestion magasins",  group:"adminTabs" },
    { id:"utilisateurs",  label:"👥 Utilisateurs",      group:"adminTabs" },
    { id:"supervision",   label:"📈 Supervision",        group:"adminTabs" },
    { id:"cartes",         label:"🎁 Cartes cadeaux",     group:"adminTabs" },
    { id:"abonnements",   label:"🔄 Abonnements",        group:"adminTabs" },
    { id:"planning",      label:"🏭 Planning production",  group:"adminTabs" },
    { id:"reporting",     label:"📊 Rapport",               group:"adminTabs" },
    { id:"imprimante",    label:"🖨 Imprimante",            group:"adminTabs" },
  ],
  // Fonctionnalités
  features: [
    { id:"create_order",     label:"➕ Créer une commande",             group:"features" },
    { id:"edit_catalogue",   label:"✏️ Modifier le catalogue",          group:"features" },
    { id:"view_cost",        label:"💰 Voir prix de revient / marges",  group:"features" },
    { id:"chat",             label:"💬 Chat production",                group:"features" },
    { id:"edit_logo",        label:"🖼️ Modifier le logo",              group:"features" },
    { id:"manage_staff",     label:"👤 Gérer l'équipe et les horaires", group:"features" },
    { id:"export_data",      label:"📤 Exporter données / CSV",         group:"features" },
    { id:"manage_subscriptions", label:"🔄 Gérer les abonnements",     group:"features" },
    { id:"manage_recipes",       label:"📖 Gérer les fiches recettes", group:"features" },
    { id:"manage_printer",       label:"🖨 Gérer l'imprimante",       group:"features" },
  ],
};

export function defaultPerms(role) {
  switch(role) {
    case "admin":      return { screens:["vendeuse","production","livreur","gerant","admin"], adminTabs:["dashboard","commandes","catalogue","gestion","utilisateurs","supervision","cartes","abonnements","planning","reporting","imprimante"], features:["create_order","edit_catalogue","view_cost","chat","edit_logo","manage_staff","export_data","manage_subscriptions","manage_recipes","manage_printer"] };
    case "gerant":     return { screens:["gerant"], adminTabs:["dashboard","commandes","catalogue","gestion","abonnements","planning","reporting","imprimante"], features:["create_order","chat","manage_staff","manage_subscriptions","manage_printer"] };
    case "vendeuse":   return { screens:["vendeuse"], adminTabs:[], features:["chat"] };
    case "production": return { screens:["production"], adminTabs:[], features:["chat"] };
    case "livreur":    return { screens:["livreur"], adminTabs:[], features:[] };
    default:           return { screens:[], adminTabs:[], features:[] };
  }
}

const USERS0 = [
  { id:1, login:"admin",  password:"admin1234", role:"admin",      store:null,                    nom:"Administrateur",  actif:true, permissions:defaultPerms("admin")      },
  { id:2, login:"sophie", password:"1234",      role:"gerant",     store:"Rue du Four 12",        nom:"Sophie Lacombe",  actif:true, permissions:defaultPerms("gerant")     },
  { id:3, login:"thomas", password:"1234",      role:"gerant",     store:"Place de la Liberte 3", nom:"Thomas Bernard",  actif:true, permissions:defaultPerms("gerant")     },
  { id:4, login:"claire", password:"1234",      role:"gerant",     store:"Avenue des Fleurs 8",   nom:"Claire Morin",    actif:true, permissions:defaultPerms("gerant")     },
  { id:5, login:"marc",   password:"1234",      role:"production", store:null,                    nom:"Marc Dupuis",     actif:true, permissions:defaultPerms("production") },
  { id:6, login:"paul",   password:"1234",      role:"livreur",    store:null,                    nom:"Paul Mercier",    actif:true, permissions:defaultPerms("livreur")    },
  { id:7, login:"karim",  password:"1234",      role:"livreur",    store:null,                    nom:"Karim Saïdi",     actif:true, permissions:defaultPerms("livreur")    },
  { id:8, login:"lea",    password:"1234",      role:"vendeuse",   store:"Rue du Four 12",        nom:"Léa Martin",      actif:true, permissions:defaultPerms("vendeuse")   },
  { id:9, login:"demo",   password:"demo",      role:"vendeuse",   store:"Place de la Liberte 3", nom:"Demo Vendeuse",   actif:true, permissions:defaultPerms("vendeuse")   },
];

const O0 = [
  { id:"CMD-001", client:"Marie Dupont",   items:[{id:1,name:"Croissant",qty:3,price:2.40},{id:2,name:"Pain choc.",qty:2,price:2.80}], store:"Rue du Four 12",       status:"production", priority:"urgent", time:"08:15", total:12.80, dMethod:null,       dest:null,               driver:null,           modReq:false, note:"" },
  { id:"CMD-002", client:"Jean Martin",    items:[{id:3,name:"Baguette",  qty:4,price:1.50},{id:5,name:"Tarte pommes",qty:1,price:28.00}],store:"Place de la Liberte 3",status:"production", priority:"normal", time:"08:30", total:34.00, dMethod:null,       dest:null,               driver:null,           modReq:false, note:"" },
  { id:"CMD-003", client:"Sophie Bernard", items:[{id:6,name:"Eclair choc.",qty:6,price:4.50}],                                         store:"Avenue des Fleurs 8",  status:"livraison",  priority:"urgent", time:"07:55", total:27.00, dMethod:"livreur",  dest:"Domicile client",  driver:"Paul Mercier", modReq:false, note:"Sonner 2x" },
  { id:"CMD-004", client:"Pierre Moreau",  items:[{id:9,name:"Macaron",   qty:2,price:12.00}],                                          store:"Rue du Four 12",       status:"livre",      priority:"normal", time:"07:30", total:24.00, dMethod:"retrait",  dest:"Place de la Liberte 3", driver:null,      modReq:false, note:"" },
  { id:"CMD-005", client:"Isabelle Leroy", items:[{id:7,name:"Mille-feuille",qty:1,price:5.20},{id:12,name:"Financier",qty:4,price:1.80}],store:"Rue du Four 12",      status:"attente",    priority:"normal", time:"08:45", total:12.40, dMethod:null,       dest:null,               driver:null,           modReq:false, note:"" },
  { id:"CMD-006", client:"Alain Petit",    items:[{id:11,name:"Quiche",   qty:2,price:6.80}],                                           store:"Place de la Liberte 3",status:"prete",      priority:"normal", time:"08:10", total:13.60, dMethod:"livreur",  dest:"Domicile client",  driver:"Karim Saïdi",  modReq:true,  note:"Fragile" },
  { id:"CMD-007", client:"Hôtel Beau-Rivage",items:[{id:1,name:"Croissant",qty:30,price:2.40},{id:2,name:"Pain choc.",qty:20,price:2.80},{id:3,name:"Baguette",qty:10,price:1.50}],store:"Place de la Liberte 3",status:"attente",priority:"urgent",time:"06:30",total:143.00,dMethod:"livreur",dest:"Quai du Mont-Blanc 15",driver:"Paul Mercier",modReq:false,note:"Livraison avant 8h impératif" },
  { id:"CMD-008", client:"Garderie Les Lutins",items:[{id:8,name:"Chausson pommes",qty:15,price:2.60},{id:12,name:"Financier",qty:20,price:1.80}],store:"Avenue des Fleurs 8",status:"prete",priority:"normal",time:"07:00",total:75.00,dMethod:"livreur",dest:"Rue des Enfants 4",driver:"Karim Saïdi",modReq:false,note:"" },
  { id:"CMD-009", client:"Famille Rochat",items:[{id:5,name:"Tarte pommes",qty:2,price:28.00},{id:7,name:"Mille-feuille",qty:6,price:5.20}],store:"Rue du Four 12",status:"production",priority:"normal",time:"09:00",total:87.20,dMethod:"retrait",dest:"Rue du Four 12",driver:null,modReq:false,note:"Anniversaire — bougies SVP" },
  { id:"CMD-010", client:"M. Favre",items:[{id:10,name:"Sandwich",qty:8,price:5.50},{id:11,name:"Quiche",qty:4,price:6.80}],store:"Place de la Liberte 3",status:"attente",priority:"normal",time:"09:15",total:71.20,dMethod:null,dest:null,driver:null,modReq:false,note:"Réunion d'entreprise 12h" },
];

const C0 = [
  { id:1, role:"vendeuse",   from:"Rue du Four 12",        text:"La CMD-005 peut-elle avoir du pain sans sel ?", t:"08:47", ord:"CMD-005", mod:false },
  { id:2, role:"production", from:"Production centrale",   text:"Pas de probleme, on note ca 👍",                t:"08:49", ord:null,      mod:false },
  { id:3, role:"vendeuse",   from:"Place de la Liberte 3", text:"CMD-006 : client veut annuler les quiches ?",   t:"08:52", ord:"CMD-006", mod:true  },
  { id:4, role:"production", from:"Production centrale",   text:"CMD-006 deja prete, impossible de modifier.",   t:"08:54", ord:"CMD-006", mod:false },
];

// ─── ABONNEMENTS DÉMO ─────────────────────────────────────────
const SUBS0 = [
  { id:"ABO-001", client:"Restaurant Le Provençal", phone:"079 123 45 67",
    items:[{id:3,name:"Baguette tradition",qty:10,price:1.50,emoji:"🥖"},{id:1,name:"Croissant au beurre",qty:20,price:2.40,emoji:"🥐"}],
    store:"Rue du Four 12", dMethod:"livreur", dest:"Rue du Marché 5, Lausanne", driver:"Paul Mercier",
    note:"Livrer avant 7h", frequency:"weekly", days:[1,2,3,4,5], deliveryTime:"06:30",
    startDate:"2026-01-15", endDate:null, active:true, total:63.00,
    lastGenerated:null, createdAt:"2026-01-15" },
  { id:"ABO-002", client:"Hôtel Beau-Rivage", phone:"021 613 33 33",
    items:[{id:1,name:"Croissant au beurre",qty:30,price:2.40,emoji:"🥐"},{id:2,name:"Pain au chocolat",qty:20,price:2.80,emoji:"🍫"},{id:3,name:"Baguette tradition",qty:15,price:1.50,emoji:"🥖"}],
    store:"Place de la Liberte 3", dMethod:"livreur", dest:"Quai d'Ouchy 18, Lausanne", driver:"Karim Saïdi",
    note:"Entrée de service, demander Michel", frequency:"daily", days:[1,2,3,4,5,6,0], deliveryTime:"05:45",
    startDate:"2026-02-01", endDate:null, active:true, total:150.50,
    lastGenerated:null, createdAt:"2026-02-01" },
  { id:"ABO-003", client:"Garderie Les Lutins", phone:"079 456 78 90",
    items:[{id:4,name:"Pain de campagne",qty:3,price:4.20,emoji:"🍞"},{id:8,name:"Chausson aux pommes",qty:15,price:2.60,emoji:"🍏"}],
    store:"Avenue des Fleurs 8", dMethod:"retrait", dest:"Avenue des Fleurs 8", driver:null,
    note:"Retrait lundi et jeudi à 7h30", frequency:"weekly", days:[1,4], deliveryTime:"07:30",
    startDate:"2026-01-20", endDate:"2026-06-30", active:true, total:51.60,
    lastGenerated:null, createdAt:"2026-01-20" },
];

// ─── FICHES RECETTES DÉMO ─────────────────────────────────────
const RECIPES0 = [
  { id:"REC-001", productId:1, name:"Croissant au beurre", portions:20, prepTime:40, cookTime:18, restTime:720,
    difficulty:"avancé",
    ingredients:[
      {name:"Farine T55",qty:500,unit:"g",cost:0.45},{name:"Beurre AOP 82%",qty:280,unit:"g",cost:3.36},
      {name:"Lait entier",qty:125,unit:"ml",cost:0.15},{name:"Sucre",qty:50,unit:"g",cost:0.06},
      {name:"Sel fin",qty:10,unit:"g",cost:0.01},{name:"Levure fraîche",qty:12,unit:"g",cost:0.18},
      {name:"Œuf (dorure)",qty:1,unit:"pcs",cost:0.30}
    ],
    steps:["Mélanger farine, sucre, sel et levure","Ajouter lait tiède, pétrir 10 min V2","Repos 1h à température ambiante",
      "Étaler en rectangle, incorporer le beurre en détrempe","Tourage: 1 tour double + 2 tours simples (repos 30min entre chaque)",
      "Abaisser à 4mm, détailler en triangles","Rouler les croissants, pointe dessous","Pousse 2h à 26°C (volume doublé)",
      "Dorer à l'œuf battu","Cuire 18 min à 180°C (chaleur tournante)"],
    notes:"Ne jamais dépasser 24°C pendant le tourage. Beurre et détrempe même consistance.",
    costPerBatch:4.51 },
  { id:"REC-002", productId:3, name:"Baguette tradition", portions:8, prepTime:20, cookTime:25, restTime:1440,
    difficulty:"moyen",
    ingredients:[
      {name:"Farine T65 tradition",qty:1000,unit:"g",cost:0.90},{name:"Eau",qty:680,unit:"ml",cost:0},
      {name:"Sel de Guérande",qty:20,unit:"g",cost:0.08},{name:"Levure fraîche",qty:5,unit:"g",cost:0.08},
      {name:"Levain liquide",qty:200,unit:"g",cost:0.30}
    ],
    steps:["Autolyse: farine + eau, repos 30 min","Ajouter levain, sel, levure — pétrir 6 min V1 + 4 min V2",
      "Pointage 1h30 en bac (2 rabats à 30 min)","Diviser en pâtons de 350g","Pré-façonner en boules, repos 20 min",
      "Façonner les baguettes (allonger sans dégazer)","Apprêt sur couche farinée 1h à 24°C",
      "Scarifier (5 coups de lame)","Enfourner à 250°C, coup de buée","Cuire 25 min, ouvrir le clapet à mi-cuisson"],
    notes:"Autolyse essentielle pour le réseau glutineux. Poolish possible en remplacement du levain.",
    costPerBatch:1.36 },
  { id:"REC-003", productId:6, name:"Éclair chocolat", portions:12, prepTime:30, cookTime:35, restTime:60,
    difficulty:"avancé",
    ingredients:[
      {name:"Eau",qty:250,unit:"ml",cost:0},{name:"Beurre",qty:100,unit:"g",cost:1.20},
      {name:"Farine T55",qty:150,unit:"g",cost:0.14},{name:"Œufs",qty:5,unit:"pcs",cost:1.50},
      {name:"Sel",qty:3,unit:"g",cost:0.01},{name:"Sucre",qty:5,unit:"g",cost:0.01},
      {name:"Chocolat noir 64%",qty:200,unit:"g",cost:2.80},{name:"Crème 35%",qty:300,unit:"ml",cost:1.50},
      {name:"Lait",qty:250,unit:"ml",cost:0.30},{name:"Jaunes d'œuf",qty:4,unit:"pcs",cost:1.20},
      {name:"Sucre (crème)",qty:80,unit:"g",cost:0.10},{name:"Maïzena",qty:30,unit:"g",cost:0.12}
    ],
    steps:["PÂTE À CHOUX: Porter eau+beurre+sel+sucre à ébullition","Verser farine d'un coup, dessécher 2 min",
      "Incorporer les œufs un par un (consistance ruban)","Dresser bâtonnets de 12cm sur plaque",
      "Cuire 25 min à 180°C (ne pas ouvrir le four)","Laisser sécher 10 min four éteint porte entrouverte",
      "CRÈME PÂTISSIÈRE CHOCO: Chauffer lait, verser sur jaunes+sucre+maïzena",
      "Cuire jusqu'à épaississement, ajouter chocolat hors feu","Filmer au contact, refroidir",
      "MONTAGE: Percer 3 trous sous chaque éclair, garnir à la poche",
      "GLAÇAGE: Fondant + chocolat fondu, glacer le dessus"],
    notes:"Pâte à choux: la détrempe doit se décoller de la casserole. Œufs à incorporer progressivement.",
    costPerBatch:8.88 },
  { id:"REC-004", productId:11, name:"Quiche lorraine", portions:6, prepTime:25, cookTime:40, restTime:30,
    difficulty:"facile",
    ingredients:[
      {name:"Pâte brisée (maison)",qty:1,unit:"pcs",cost:1.20},{name:"Lardons fumés",qty:200,unit:"g",cost:2.40},
      {name:"Œufs",qty:3,unit:"pcs",cost:0.90},{name:"Crème fraîche 35%",qty:250,unit:"ml",cost:1.25},
      {name:"Lait",qty:100,unit:"ml",cost:0.12},{name:"Gruyère râpé",qty:80,unit:"g",cost:0.96},
      {name:"Noix de muscade",qty:1,unit:"pincée",cost:0.02},{name:"Sel, poivre",qty:1,unit:"pincée",cost:0.02}
    ],
    steps:["Foncer le moule avec la pâte, piquer le fond","Cuire à blanc 10 min à 180°C avec des billes de cuisson",
      "Faire revenir les lardons (sans matière grasse)","Mélanger œufs + crème + lait + muscade + sel/poivre",
      "Répartir lardons sur le fond de tarte","Verser l'appareil, parsemer de gruyère",
      "Cuire 35-40 min à 180°C (appareil pris et doré)","Laisser tiédir 10 min avant de servir"],
    notes:"Servir tiède. Se conserve 2 jours au frais. Réchauffer 10 min à 160°C.",
    costPerBatch:6.87 },
];

// ─── VENTES DE DÉMONSTRATION (dates dynamiques) ──────────────
function _demoDate(daysAgo){
  var d=new Date(); d.setDate(d.getDate()-daysAgo); d.setHours(0,0,0,0);
  return d.toLocaleDateString("fr-CH");
}
function _buildSales(){
  var T=_demoDate(0),H=_demoDate(1),J2=_demoDate(2),J3=_demoDate(3),J6=_demoDate(6),J7=_demoDate(7),J8=_demoDate(8),J14=_demoDate(14),J16=_demoDate(16),J20=_demoDate(20),J30=_demoDate(30),J35=_demoDate(35);
  return [
  // ── Aujourd'hui (8 ventes) ──
  {id:"VTE-D01",time:"07:22",date:T,store:"Rue du Four 12",seller:"Léa Martin",client:"Marie Dupont",
    items:[{id:1,name:"Croissant au beurre",qty:4,price:2.40,emoji:"🥐",tva:2.6},{id:2,name:"Pain au chocolat",qty:2,price:2.80,emoji:"🍫",tva:2.6}],
    total:15.20,payInfo:{method:"card",change:0}},
  {id:"VTE-D02",time:"07:45",date:T,store:"Rue du Four 12",seller:"Léa Martin",client:"Pierre Moreau",
    items:[{id:3,name:"Baguette tradition",qty:2,price:1.50,emoji:"🥖",tva:2.6},{id:10,name:"Sandwich jambon-beurre",qty:1,price:5.50,emoji:"🥪",tva:8.1}],
    total:8.50,payInfo:{method:"cash",change:1.50,given:10}},
  {id:"VTE-D03",time:"08:15",date:T,store:"Place de la Liberte 3",seller:"Sophie Lacombe",client:"Restaurant Le Provençal",
    items:[{id:1,name:"Croissant au beurre",qty:20,price:2.40,emoji:"🥐",tva:2.6},{id:3,name:"Baguette tradition",qty:10,price:1.50,emoji:"🥖",tva:2.6},{id:4,name:"Pain de campagne",qty:5,price:4.20,emoji:"🍞",tva:2.6}],
    total:84.00,payInfo:{method:"card",change:0}},
  {id:"VTE-D04",time:"09:30",date:T,store:"Rue du Four 12",seller:"Léa Martin",client:"Client anonyme",
    items:[{id:6,name:"Eclair chocolat",qty:3,price:4.50,emoji:"🍮",tva:2.6},{id:7,name:"Mille-feuille",qty:2,price:5.20,emoji:"🍰",tva:2.6}],
    total:23.90,payInfo:{method:"split",change:0.10,given:14,splitCard:10}},
  {id:"VTE-D05",time:"10:10",date:T,store:"Avenue des Fleurs 8",seller:"Claire Dubois",client:"Mme Fontaine",
    items:[{id:5,name:"Tarte aux pommes",qty:1,price:28.00,emoji:"🥧",tva:2.6},{id:9,name:"Macaron (6 pcs)",qty:2,price:12.00,emoji:"🎨",tva:2.6}],
    total:52.00,payInfo:{method:"card",change:0}},
  {id:"VTE-D06",time:"11:45",date:T,store:"Rue du Four 12",seller:"Léa Martin",client:"Jean-Luc Bernard",
    items:[{id:11,name:"Quiche lorraine",qty:2,price:6.80,emoji:"🥗",tva:8.1},{id:10,name:"Sandwich jambon-beurre",qty:1,price:5.50,emoji:"🥪",tva:8.1}],
    total:19.10,payInfo:{method:"cash",change:0.90,given:20}},
  {id:"VTE-D07",time:"12:20",date:T,store:"Place de la Liberte 3",seller:"Sophie Lacombe",client:"Table 3",
    items:[{id:11,name:"Quiche lorraine",qty:3,price:6.80,emoji:"🥗",tva:8.1},{id:10,name:"Sandwich jambon-beurre",qty:2,price:5.50,emoji:"🥪",tva:8.1}],
    total:31.40,payInfo:{method:"card",change:0}},
  {id:"VTE-D08",time:"13:00",date:T,store:"Rue du Four 12",seller:"Léa Martin",client:"Cadeau pour Sophie",
    items:[{id:1,name:"Croissant au beurre",qty:6,price:2.40,emoji:"🥐",tva:2.6},{id:7,name:"Mille-feuille",qty:2,price:5.20,emoji:"🍰",tva:2.6}],
    total:24.80,payInfo:{method:"giftcard",change:0,gcCode:"GIFT-AB12CD"}},
  // ── Hier (3 ventes) ──
  {id:"VTE-H01",time:"07:10",date:H,store:"Rue du Four 12",seller:"Léa Martin",client:"Marie Dupont",
    items:[{id:1,name:"Croissant au beurre",qty:3,price:2.40,emoji:"🥐",tva:2.6},{id:3,name:"Baguette tradition",qty:1,price:1.50,emoji:"🥖",tva:2.6}],
    total:8.70,payInfo:{method:"cash",change:1.30,given:10}},
  {id:"VTE-H02",time:"08:30",date:H,store:"Place de la Liberte 3",seller:"Sophie Lacombe",client:"Hôtel Beau-Rivage",
    items:[{id:1,name:"Croissant au beurre",qty:30,price:2.40,emoji:"🥐",tva:2.6},{id:2,name:"Pain au chocolat",qty:15,price:2.80,emoji:"🍫",tva:2.6}],
    total:114.00,payInfo:{method:"card",change:0}},
  {id:"VTE-H03",time:"12:15",date:H,store:"Avenue des Fleurs 8",seller:"Claire Dubois",client:"Garderie Les Lutins",
    items:[{id:8,name:"Chausson aux pommes",qty:12,price:2.60,emoji:"🍏",tva:2.6},{id:12,name:"Financier amande",qty:20,price:1.80,emoji:"✨",tva:2.6}],
    total:67.20,payInfo:{method:"card",change:0}},
  // ── J-2 à J-3 ──
  {id:"VTE-W01",time:"08:00",date:J2,store:"Rue du Four 12",seller:"Léa Martin",client:"Famille Rochat",
    items:[{id:5,name:"Tarte aux pommes",qty:2,price:28.00,emoji:"🥧",tva:2.6},{id:7,name:"Mille-feuille",qty:4,price:5.20,emoji:"🍰",tva:2.6}],
    total:76.80,payInfo:{method:"card",change:0}},
  {id:"VTE-W02",time:"09:15",date:J3,store:"Place de la Liberte 3",seller:"Sophie Lacombe",client:"Client anonyme",
    items:[{id:1,name:"Croissant au beurre",qty:6,price:2.40,emoji:"🥐",tva:2.6},{id:6,name:"Eclair chocolat",qty:4,price:4.50,emoji:"🍮",tva:2.6}],
    total:32.40,payInfo:{method:"cash",change:7.60,given:40}},
  {id:"VTE-W03",time:"11:40",date:J3,store:"Avenue des Fleurs 8",seller:"Claire Dubois",client:"M. Favre",
    items:[{id:10,name:"Sandwich jambon-beurre",qty:3,price:5.50,emoji:"🥪",tva:8.1},{id:11,name:"Quiche lorraine",qty:1,price:6.80,emoji:"🥗",tva:8.1}],
    total:23.30,payInfo:{method:"card",change:0}},
  // ── Semaine précédente J-6 à J-8 ──
  {id:"VTE-P01",time:"07:30",date:J6,store:"Rue du Four 12",seller:"Léa Martin",client:"Restaurant Le Provençal",
    items:[{id:3,name:"Baguette tradition",qty:15,price:1.50,emoji:"🥖",tva:2.6},{id:4,name:"Pain de campagne",qty:8,price:4.20,emoji:"🍞",tva:2.6}],
    total:56.10,payInfo:{method:"card",change:0}},
  {id:"VTE-P02",time:"10:00",date:J7,store:"Place de la Liberte 3",seller:"Sophie Lacombe",client:"Anniversaire Müller",
    items:[{id:5,name:"Tarte aux pommes",qty:3,price:28.00,emoji:"🥧",tva:2.6},{id:9,name:"Macaron (6 pcs)",qty:5,price:12.00,emoji:"🎨",tva:2.6}],
    total:144.00,payInfo:{method:"card",change:0}},
  {id:"VTE-P03",time:"08:45",date:J8,store:"Avenue des Fleurs 8",seller:"Claire Dubois",client:"Table 5",
    items:[{id:11,name:"Quiche lorraine",qty:4,price:6.80,emoji:"🥗",tva:8.1},{id:10,name:"Sandwich jambon-beurre",qty:4,price:5.50,emoji:"🥪",tva:8.1}],
    total:49.20,payInfo:{method:"split",change:0,given:25,splitCard:24.20}},
  // ── J-14 à J-20 ──
  {id:"VTE-M01",time:"07:15",date:J14,store:"Rue du Four 12",seller:"Léa Martin",client:"Pierre Moreau",
    items:[{id:1,name:"Croissant au beurre",qty:2,price:2.40,emoji:"🥐",tva:2.6},{id:2,name:"Pain au chocolat",qty:2,price:2.80,emoji:"🍫",tva:2.6}],
    total:10.40,payInfo:{method:"cash",change:9.60,given:20}},
  {id:"VTE-M02",time:"14:00",date:J16,store:"Place de la Liberte 3",seller:"Sophie Lacombe",client:"Événement Fondation Rivier",
    items:[{id:7,name:"Mille-feuille",qty:10,price:5.20,emoji:"🍰",tva:2.6},{id:6,name:"Eclair chocolat",qty:10,price:4.50,emoji:"🍮",tva:2.6},{id:12,name:"Financier amande",qty:30,price:1.80,emoji:"✨",tva:2.6}],
    total:151.00,payInfo:{method:"card",change:0}},
  {id:"VTE-M03",time:"09:20",date:J20,store:"Rue du Four 12",seller:"Léa Martin",client:"Mme Fontaine",
    items:[{id:8,name:"Chausson aux pommes",qty:6,price:2.60,emoji:"🍏",tva:2.6},{id:3,name:"Baguette tradition",qty:3,price:1.50,emoji:"🥖",tva:2.6}],
    total:20.10,payInfo:{method:"cash",change:4.90,given:25}},
  // ── Mois précédent J-30 à J-35 ──
  {id:"VTE-A01",time:"08:10",date:J30,store:"Avenue des Fleurs 8",seller:"Claire Dubois",client:"Restaurant Le Provençal",
    items:[{id:3,name:"Baguette tradition",qty:20,price:1.50,emoji:"🥖",tva:2.6},{id:1,name:"Croissant au beurre",qty:15,price:2.40,emoji:"🥐",tva:2.6}],
    total:66.00,payInfo:{method:"card",change:0}},
  {id:"VTE-A02",time:"16:30",date:J35,store:"Rue du Four 12",seller:"Léa Martin",client:"Client anonyme",
    items:[{id:12,name:"Financier amande",qty:5,price:1.80,emoji:"✨",tva:2.6}],
    total:9.00,payInfo:{method:"cash",change:1.00,given:10}},
  ].map(function(s){ return Object.assign({},s,{tvaInfo:computeTVA(s.items)}); });
}
var SALES0 = _buildSales();

// ─── CARTES CADEAUX DE DÉMONSTRATION ──────────────────────────
var GIFTS0 = [
  {code:"GIFT-AB12CD",amount:50,balance:25.20,status:"active",createdAt:_demoDate(11),createdTime:"10:00",store:"Rue du Four 12",seller:"Léa Martin",email:"sophie.meyer@gmail.com",
    history:[{date:_demoDate(11),time:"10:00",amount:0,balance:50,label:"Création"},{date:_demoDate(0),time:"13:00",amount:24.80,balance:25.20,label:"Achat VTE-D08"}]},
  {code:"GIFT-XY34ZW",amount:100,balance:100,status:"active",createdAt:_demoDate(6),createdTime:"14:30",store:"Place de la Liberte 3",seller:"Sophie Lacombe",email:"marc.favre@bluewin.ch",
    history:[{date:_demoDate(6),time:"14:30",amount:0,balance:100,label:"Création"}]},
  {code:"GIFT-MM56NN",amount:30,balance:0,status:"epuise",createdAt:_demoDate(47),createdTime:"11:00",store:"Avenue des Fleurs 8",seller:"Claire Dubois",email:null,
    history:[{date:_demoDate(47),time:"11:00",amount:0,balance:30,label:"Création"},{date:_demoDate(39),time:"09:15",amount:22.40,balance:7.60},{date:_demoDate(32),time:"16:30",amount:7.60,balance:0}]},
  {code:"GIFT-PP78QQ",amount:75,balance:75,status:"inactive",createdAt:_demoDate(25),createdTime:"09:00",store:"Rue du Four 12",seller:"Léa Martin",email:"alice.rochat@proton.me",
    history:[{date:_demoDate(25),time:"09:00",amount:0,balance:75,label:"Création"}]},
];

export { APP_VERSION, PRODUCTS, STORES, CATS, PIN, SM, ROLES, DRIVERS, PERMS_DEF, USERS0, O0, C0, SUBS0, RECIPES0, SALES0, GIFTS0 };
