import { useState, useRef, useEffect, useCallback } from "react";

/* ─── VERSION & UPDATE ───────────────────────────────────────── */
const APP_VERSION = "3.7.0";

/* ─── CONSTANTES ──────────────────────────────────────────────── */
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

// Statuts ASCII uniquement - pas d'accents dans les clés
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

// ─── PERMISSIONS ─────────────────────────────────────────────────
// Catalogue de toutes les permissions disponibles
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
  ],
};

// Permissions par défaut selon le rôle
function defaultPerms(role) {
  switch(role) {
    case "admin":      return { screens:["vendeuse","production","livreur","gerant","admin"], adminTabs:["dashboard","commandes","catalogue","gestion","utilisateurs","supervision","cartes","abonnements","planning","reporting"], features:["create_order","edit_catalogue","view_cost","chat","edit_logo","manage_staff","export_data","manage_subscriptions","manage_recipes"] };
    case "gerant":     return { screens:["gerant"], adminTabs:["dashboard","commandes","catalogue","gestion","abonnements","planning","reporting"], features:["create_order","chat","manage_staff","manage_subscriptions"] };
    case "vendeuse":   return { screens:["vendeuse"], adminTabs:[], features:["chat"] };
    case "production": return { screens:["production"], adminTabs:[], features:["chat"] };
    case "livreur":    return { screens:["livreur"], adminTabs:[], features:[] };
    default:           return { screens:[], adminTabs:[], features:[] };
  }
}

// Base d'utilisateurs (gérée depuis Admin > Utilisateurs)
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

function hm() {
  const d = new Date();
  return d.getHours() + ":" + String(d.getMinutes()).padStart(2,"0");
}

// ── TVA suisse helper ──
// Prix TTC (les prix affichés incluent la TVA)
// TVA = prix / (100 + taux) * taux
function computeTVA(items) {
  var byRate = {};
  (items||[]).forEach(function(i){
    var rate = i.tva || 2.6;
    var ttc  = i.price * i.qty;
    if (!byRate[rate]) byRate[rate] = { rate:rate, ttc:0, ht:0, tva:0 };
    byRate[rate].ttc += ttc;
  });
  var totalHT = 0, totalTVA = 0, totalTTC = 0;
  var lines = Object.values(byRate).map(function(r){
    r.tva = Math.round(r.ttc / (100 + r.rate) * r.rate * 100) / 100;
    r.ht  = Math.round((r.ttc - r.tva) * 100) / 100;
    totalHT  += r.ht;
    totalTVA += r.tva;
    totalTTC += r.ttc;
    return r;
  }).sort(function(a,b){ return a.rate - b.rate; });
  return { lines:lines, totalHT:Math.round(totalHT*100)/100, totalTVA:Math.round(totalTVA*100)/100, totalTTC:Math.round(totalTTC*100)/100 };
}

// ── Cartes cadeaux helpers ──
function generateGiftCode() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var code = "GC-";
  for (var i=0;i<4;i++) code += chars[Math.floor(Math.random()*chars.length)];
  code += "-";
  for (var j=0;j<4;j++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}
function qrUrl(text) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="+encodeURIComponent(text);
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box}body{margin:0;font-family:'Outfit',sans-serif}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:3px}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes glow{0%,100%{opacity:.07}50%{opacity:.25}}
@keyframes shake{0%,100%{transform:translateX(0)}25%,75%{transform:translateX(-7px)}50%{transform:translateX(7px)}}
@keyframes pinIn{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
@keyframes slR{from{transform:translateX(100%)}to{transform:translateX(0)}}
.ch{transition:box-shadow .2s,transform .2s}.ch:hover{box-shadow:0 8px 26px rgba(0,0,0,.1)!important;transform:translateY(-2px)!important}
.nb{transition:all .18s}.nb:hover{background:rgba(200,149,58,.12)!important;color:#C8953A!important}
.pb{transition:all .11s}.pb:hover{background:rgba(200,149,58,.18)!important;color:#C8953A!important}.pb:active{transform:scale(.91)!important}
.pt{transition:all .14s}.pt:hover{background:#FDF0D8!important;border-color:#C8953A!important}
.bg{transition:all .18s}.bg:hover{filter:brightness(1.1);transform:scale(1.02)}
.tr{transition:background .12s}.tr:hover{background:#FDFAF6!important}
.rc{transition:all .25s cubic-bezier(.34,1.56,.64,1)}.rc:hover{transform:translateY(-5px) scale(1.03)!important;box-shadow:0 16px 40px rgba(200,149,58,.2)!important}
`;

/* ─── APP ROOT ────────────────────────────────────────────────── */

/* — Helpers persistance localStorage — */
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

/* — Composant UpdateBanner — */
var _userApprovedUpdate = false; // flag global : reload UNIQUEMENT si l'utilisateur a cliqué

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
  const [users,       setUsers]       = useState(function(){ return lsGet("users", USERS0); });
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
        {displayRole === "vendeuse"   && <Vendeuse   orders={orders} addOrder={addOrder} updOrder={updOrder} sendMsg={sendMsg} userStore={userStore} userName={userName} catalogue={catalogue} sales={sales} addSale={addSale} chat={chat} tableLayouts={tableLayouts} tableSessions={tableSessions} setTableSessions={setTableSessions} tenant={tenant} giftCards={giftCards} addGiftCard={addGiftCard} useGiftCard={useGiftCard} />}
        {displayRole === "production" && <Production orders={orders} updOrder={updOrder} chat={chat} sendMsg={sendMsg} recipes={recipes} catalogue={catalogue} />}
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

/* ─── PIN ─────────────────────────────────────────────────────── */
function PinModal(props) {
  var onSuccess = props.onSuccess;
  var onCancel  = props.onCancel;
  const [pin,   setPin]   = useState("");
  const [shake, setShake] = useState(false);
  const [err,   setErr]   = useState(false);

  function press(v) {
    if (pin.length >= 4) return;
    var next = pin + v;
    setPin(next);
    setErr(false);
    if (next.length === 4) {
      if (next === PIN) {
        setTimeout(onSuccess, 180);
      } else {
        setShake(true); setErr(true);
        setTimeout(function(){ setPin(""); setShake(false); }, 650);
      }
    }
  }
  function del() { setPin(function(p){ return p.slice(0,-1); }); setErr(false); }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.65)",
                 display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#1E0E05",borderRadius:22,padding:"32px 24px",width:275,textAlign:"center",
                   boxShadow:"0 28px 70px rgba(0,0,0,.55)",animation:"pinIn .28s ease",
                   border:"1px solid rgba(200,149,58,.2)"}}>
        <div style={{fontSize:32,marginBottom:5}}>🔐</div>
        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:24,color:"#FDF8F0",fontWeight:700,marginBottom:2}}>Acces Admin</div>
        <div style={{color:"rgba(253,248,240,.35)",fontSize:12,marginBottom:22}}>Code PIN requis</div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:22,
                     animation: shake ? "shake .6s ease" : "none"}}>
          {[0,1,2,3].map(function(i){
            return (
              <div key={i} style={{width:13,height:13,borderRadius:"50%",transition:"background .13s",
                                   background: i < pin.length ? (err ? "#EF4444" : "#C8953A") : "rgba(255,255,255,.15)"}} />
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:7}}>
          {[1,2,3,4,5,6,7,8,9].map(function(n){
            return (
              <button key={n} className="pb" onClick={function(){ press(String(n)); }}
                style={{padding:"13px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",
                        background:"rgba(255,255,255,.05)",color:"#FDF8F0",fontSize:18,
                        fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>{n}</button>
            );
          })}
          <button className="pb" onClick={onCancel}
            style={{padding:"13px",borderRadius:10,border:"1px solid rgba(239,68,68,.2)",
                    background:"rgba(239,68,68,.08)",color:"#FCA5A5",fontSize:12,
                    cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕</button>
          <button className="pb" onClick={function(){ press("0"); }}
            style={{padding:"13px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",
                    background:"rgba(255,255,255,.05)",color:"#FDF8F0",fontSize:18,
                    fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>0</button>
          <button className="pb" onClick={del}
            style={{padding:"13px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",
                    background:"rgba(255,255,255,.05)",color:"rgba(253,248,240,.5)",
                    fontSize:16,cursor:"pointer"}}>⌫</button>
        </div>
        {err && <div style={{color:"#FCA5A5",fontSize:12,marginTop:5}}>Code incorrect</div>}
        <div style={{color:"rgba(253,248,240,.2)",fontSize:10,marginTop:9}}>Demo : 1234</div>
      </div>
    </div>
  );
}

/* ─── LOGIN ───────────────────────────────────────────────────── */
function LoginScreen(props) {
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


/* ─── LAYOUT ──────────────────────────────────────────────────── */
function Layout(props) {
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

/* ─── CHAT ────────────────────────────────────────────────────── */
function ChatPanel(props) {
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

/* ─── EDIT MODAL ──────────────────────────────────────────────── */
function EditModal(props) {
  var order     = props.order;
  var onSave    = props.onSave;
  var onClose   = props.onClose;
  var onModReq  = props.onModReq;
  var sendMsg   = props.sendMsg;

  var meta   = SM[order.status] || SM.attente;
  var locked = meta.lock;
  var warn   = meta.warn;

  const [items,       setItems]       = useState(order.items.map(function(i){ return Object.assign({},i); }));
  const [note,        setNote]        = useState(order.note || "");
  const [showAdd,     setShowAdd]     = useState(false);
  const [modText,     setModText]     = useState("");
  const [showModForm, setShowModForm] = useState(false);

  function setQty(idx, q) {
    if (q <= 0) setItems(function(prev){ return prev.filter(function(_,i){ return i !== idx; }); });
    else setItems(function(prev){ return prev.map(function(it,i){ return i===idx ? Object.assign({},it,{qty:q}) : it; }); });
  }
  function addProd(p) {
    var ex = items.find(function(i){ return i.id===p.id; });
    if (ex) setItems(function(prev){ return prev.map(function(i){ return i.id===p.id ? Object.assign({},i,{qty:i.qty+1}) : i; }); });
    else    setItems(function(prev){ return prev.concat([Object.assign({},p,{qty:1})]); });
    setShowAdd(false);
  }
  var total = items.reduce(function(s,i){ return s+i.price*i.qty; }, 0);

  function handleModSend() {
    if (!modText.trim()) return;
    sendMsg("MODIF sur " + order.id + " (" + order.client + "): " + modText, order.id, true);
    onModReq(order.id);
    onClose();
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.5)",
                 display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)"}}>
      <div style={{background:"#fff",borderRadius:17,width:"min(490px,94vw)",maxHeight:"88vh",
                   overflow:"auto",boxShadow:"0 26px 65px rgba(0,0,0,.26)",animation:"pinIn .25s ease"}}>
        <div style={{padding:"17px 19px 13px",borderBottom:"1px solid #F0E8DC",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:21,color:"#1E0E05",fontWeight:700,marginBottom:1}}>
              {locked ? "🔒" : "✏️"} {order.id}
            </div>
            <div style={{fontSize:11,color:"#8B7355"}}>{order.client} · {order.store}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{background:meta.bg,color:meta.tx,fontSize:10,fontWeight:600,padding:"3px 8px",borderRadius:18}}>{meta.label}</span>
            <button onClick={onClose} style={{background:"none",border:"none",color:"#8B7355",cursor:"pointer",fontSize:18}}>✕</button>
          </div>
        </div>
        <div style={{padding:"15px 19px"}}>
          {locked && (
            <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:"10px 12px",marginBottom:13}}>
              <div style={{fontSize:12,fontWeight:700,color:"#92400E",marginBottom:2}}>🔒 Commande verrouillee</div>
              <div style={{fontSize:11,color:"#92400E"}}>
                {order.status==="prete" ? "La production a prepare cette commande. Envoyez une demande via le chat."
                                        : "En livraison ou deja livree."}
              </div>
            </div>
          )}
          {warn && !locked && (
            <div style={{background:"#DBEAFE",border:"1px solid #93C5FD",borderRadius:10,padding:"8px 12px",marginBottom:13,fontSize:11,color:"#1E40AF"}}>
              ⚠️ En production — vos modifications sont visibles immediatement par la production.
            </div>
          )}
          <div style={{marginBottom:13}}>
            <div style={{fontSize:10,fontWeight:600,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:6}}>Produits</div>
            {items.map(function(it, idx){
              var p = PRODUCTS.find(function(p){ return p.id===it.id; });
              return (
                <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #F0E8DC"}}>
                  <span style={{fontSize:14}}>{p ? p.emoji : "🍞"}</span>
                  <span style={{flex:1,fontSize:12,color:"#1E0E05"}}>{it.name}</span>
                  <span style={{fontSize:11,color:"#C8953A",minWidth:55,textAlign:"right"}}>CHF {(it.price*it.qty).toFixed(2)}</span>
                  {locked ? (
                    <span style={{fontSize:12,fontWeight:600,color:"#1E0E05",minWidth:20,textAlign:"center"}}>x{it.qty}</span>
                  ) : (
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button onClick={function(){ setQty(idx, it.qty-1); }}
                        style={{width:21,height:21,borderRadius:"50%",border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{fontSize:12,fontWeight:600,color:"#1E0E05",minWidth:18,textAlign:"center"}}>{it.qty}</span>
                      <button onClick={function(){ setQty(idx, it.qty+1); }}
                        style={{width:21,height:21,borderRadius:"50%",border:"1px solid rgba(200,149,58,.4)",background:"#FDF0D8",color:"#C8953A",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!locked && (
            <div style={{marginBottom:13}}>
              {showAdd ? (
                <div style={{background:"#F7F3EE",borderRadius:10,padding:10}}>
                  <div style={{fontSize:10,color:"#8B7355",marginBottom:6,fontWeight:600,textTransform:"uppercase",letterSpacing:.9}}>Ajouter un produit</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(95px,1fr))",gap:6,maxHeight:160,overflowY:"auto"}}>
                    {PRODUCTS.map(function(p){
                      return (
                        <div key={p.id} className="pt" onClick={function(){ addProd(p); }}
                          style={{background:"#fff",borderRadius:8,padding:"6px",cursor:"pointer",textAlign:"center",border:"1px solid #EDE0D0"}}>
                          <div style={{fontSize:17,marginBottom:2}}>{p.emoji}</div>
                          <div style={{fontSize:9,color:"#1E0E05",fontWeight:500,lineHeight:1.2,marginBottom:1}}>{p.name}</div>
                          <div style={{fontSize:10,color:"#C8953A",fontWeight:600}}>CHF {p.price.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={function(){ setShowAdd(false); }}
                    style={{marginTop:6,padding:"4px 10px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Fermer</button>
                </div>
              ) : (
                <button onClick={function(){ setShowAdd(true); }}
                  style={{padding:"7px 13px",borderRadius:9,border:"1.5px dashed #C8953A",background:"transparent",
                          color:"#C8953A",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                          width:"100%",transition:"all .16s"}}
                  onMouseOver={function(e){ e.currentTarget.style.background="#FDF0D8"; }}
                  onMouseOut={function(e){ e.currentTarget.style.background="transparent"; }}>+ Ajouter un produit</button>
              )}
            </div>
          )}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:600,color:"#8B7355",textTransform:"uppercase",letterSpacing:.9,marginBottom:4}}>Note</div>
            {locked ? (
              <div style={{padding:"7px 10px",background:"#F7F3EE",borderRadius:7,fontSize:12,color:note?"#1E0E05":"#8B7355",fontStyle:note?"normal":"italic"}}>{note||"Aucune note"}</div>
            ) : (
              <input value={note} onChange={function(e){ setNote(e.target.value); }}
                placeholder="Note pour la production…"
                style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #D5C4B0",background:"#F7F3EE",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif"}} />
            )}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid #F0E8DC",marginBottom:13}}>
            <span style={{fontSize:12,fontWeight:600,color:"#1E0E05"}}>Total</span>
            <span style={{fontSize:18,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {total.toFixed(2)}</span>
          </div>
          {order.status === "prete" && (
            <div style={{marginBottom:7}}>
              {!showModForm ? (
                <button onClick={function(){ setShowModForm(true); }}
                  style={{width:"100%",padding:"9px",borderRadius:9,border:"1.5px solid #EF4444",
                          background:"#FEF2F2",color:"#DC2626",fontSize:12,fontWeight:600,
                          cursor:"pointer",fontFamily:"'Outfit',sans-serif",marginBottom:7}}>
                  🔔 Demander une modification a la production
                </button>
              ) : (
                <div style={{background:"#FEF2F2",borderRadius:10,padding:10,marginBottom:7}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#DC2626",marginBottom:4}}>Message a la production :</div>
                  <textarea value={modText} onChange={function(e){ setModText(e.target.value); }}
                    placeholder="Ex: Retirer les quiches, ajouter 2 croissants…"
                    style={{width:"100%",height:62,padding:"6px 8px",borderRadius:7,border:"1px solid #FCA5A5",
                            background:"#fff",fontSize:11,resize:"none",outline:"none",fontFamily:"'Outfit',sans-serif"}} />
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <button onClick={function(){ setShowModForm(false); }}
                      style={{flex:1,padding:"6px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
                    <button onClick={handleModSend} disabled={!modText.trim()}
                      style={{flex:2,padding:"6px",borderRadius:7,border:"none",
                              background:modText.trim()?"#DC2626":"#D5C4B0",color:"#fff",fontSize:11,fontWeight:600,
                              cursor:modText.trim()?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
                      🔔 Envoyer la demande
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!locked && items.length > 0 ? (
            <div style={{display:"flex",gap:6}}>
              <button onClick={onClose}
                style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
              <button onClick={function(){ onSave(Object.assign({},order,{items:items,note:note,total:total})); }}
                style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#FDF8F0",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                💾 Sauvegarder
              </button>
            </div>
          ) : (
            order.status !== "prete" && (
              <button onClick={onClose}
                style={{width:"100%",padding:"9px",borderRadius:9,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Fermer</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── POS TACTILE ─────────────────────────────────────────────── */
function PayModal(props) {
  var total    = props.total;
  var cart     = props.cart;
  var onPaid   = props.onPaid;
  var onClose  = props.onClose;
  var tenant   = props.tenant;
  var tvaData  = computeTVA(cart);
  var giftCards  = props.giftCards  || [];
  var useGiftCard= props.useGiftCard|| function(){};

  const [method,   setMethod]   = useState("card");   // "card" | "cash" | "split" | "giftcard"
  const [given,    setGiven]    = useState("");        // montant donné en espèces
  const [step,     setStep]     = useState("choose");  // "choose" | "processing" | "done"
  const [splitCard,setSplitCard]= useState("");
  const [gcCode,   setGcCode]   = useState("");
  const [gcError,  setGcError]  = useState("");
  const [gcFound,  setGcFound]  = useState(null);
  const [scanning, setScanning] = useState(false);
  const scanRef    = useRef(null);

  var givenNum    = parseFloat(given)  || 0;
  var splitNum    = parseFloat(splitCard) || 0;
  var change      = method === "cash"  ? Math.max(0, givenNum - total)
                  : method === "split" ? Math.max(0, givenNum - (total - splitNum))
                  : 0;
  var cashNeeded  = method === "split" ? total - splitNum : total;
  var cashValid   = method === "cash"  ? givenNum >= total
                  : method === "split" ? givenNum >= cashNeeded && splitNum > 0 && splitNum < total
                  : method === "giftcard" ? (gcFound && gcFound.balance >= total)
                  : true;

  function lookupGC(code) {
    var c = code.toUpperCase().trim();
    setGcCode(c);
    setGcError("");
    setGcFound(null);
    if (c.length < 5) return;
    var found = giftCards.find(function(g){ return g.code === c; });
    if (!found) { setGcError("Code introuvable"); return; }
    if (found.status === "epuise") { setGcError("Carte épuisée (solde 0)"); return; }
    if (found.status === "inactive") { setGcError("Carte désactivée"); return; }
    if (found.balance <= 0) { setGcError("Solde insuffisant"); return; }
    setGcFound(found);
    if (found.balance < total) { setGcError("Solde partiel (CHF "+found.balance.toFixed(2)+") — complétez avec un autre moyen"); }
  }

  // QR scan via BarcodeDetector
  function startScan() {
    if (!("BarcodeDetector" in window)) { setGcError("Scanner non supporté sur ce navigateur"); return; }
    setScanning(true);
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(function(stream){
      if(scanRef.current) {
        scanRef.current.srcObject = stream;
        scanRef.current.play();
        var detector = new BarcodeDetector({formats:["qr_code"]});
        var interval = setInterval(function(){
          if(!scanRef.current) { clearInterval(interval); stream.getTracks().forEach(function(t){t.stop();}); return; }
          detector.detect(scanRef.current).then(function(codes){
            if(codes.length>0) {
              clearInterval(interval);
              stream.getTracks().forEach(function(t){t.stop();});
              setScanning(false);
              lookupGC(codes[0].rawValue);
            }
          }).catch(function(){});
        }, 300);
      }
    }).catch(function(){ setGcError("Accès caméra refusé"); setScanning(false); });
  }

  function pay() {
    if (method === "giftcard" && gcFound) {
      var debitAmt = Math.min(gcFound.balance, total);
      useGiftCard(gcFound.code, debitAmt);
    }
    setStep("processing");
    setTimeout(function(){
      setStep("done");
      setTimeout(function(){
        onPaid({
          method:   method,
          cashGiven: givenNum,
          cardAmount: method === "split" ? splitNum : method === "card" ? total : method === "giftcard" ? total : 0,
          change:   change,
          giftCode: method === "giftcard" && gcFound ? gcFound.code : null,
        });
      }, 1200);
    }, method === "card" || method === "split" || method === "giftcard" ? 2000 : 400);
  }

  var QUICK = [0.50,1,2,5,10,20,50,100];

  return (
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:460,boxShadow:"0 32px 80px rgba(0,0,0,.35)",overflow:"hidden",animation:"pinIn .25s ease"}}>

        {/* Header */}
        <div style={{background:"#1E0E05",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:"#FDF8F0",fontFamily:"'Outfit',sans-serif",fontSize:13,opacity:.6,marginBottom:2}}>Total à encaisser</div>
            <div style={{color:"#C8953A",fontFamily:"'Outfit',sans-serif",fontSize:34,fontWeight:800,letterSpacing:-1}}>
              CHF {total.toFixed(2)}
            </div>
            <div style={{display:"flex",gap:10,marginTop:4}}>
              {tvaData.lines.map(function(l){
                return React.createElement("span",{key:l.rate,style:{fontSize:9,color:"rgba(253,248,240,.45)"}},
                  "TVA "+l.rate+"% : "+l.tva.toFixed(2));
              })}
            </div>
          </div>
          {step === "choose" && (
            <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:36,height:36,color:"rgba(253,248,240,.5)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          )}
        </div>

        {/* Processing */}
        {step === "processing" && (
          <div style={{padding:"48px 22px",textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16,animation:"spin 1s linear infinite",display:"inline-block"}}>
              {method === "card" || method === "split" ? "💳" : "🪙"}
            </div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:700,color:"#1E0E05",marginBottom:6}}>
              {method === "card" ? "Attente du terminal…" : method === "split" ? "Traitement paiement mixte…" : "Calcul de la monnaie…"}
            </div>
            <div style={{fontSize:12,color:"#8B7355"}}>
              {method === "card" || method === "split" ? "Présentez la carte au lecteur SumUp" : "Vérification…"}
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div style={{padding:"40px 22px",textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:12,animation:"pop .4s ease"}}>✅</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#065F46",marginBottom:8}}>Paiement accepté !</div>
            {change > 0 && (
              <div style={{background:"#D1FAE5",borderRadius:12,padding:"12px 20px",display:"inline-block",marginTop:4}}>
                <div style={{fontSize:11,color:"#065F46",fontWeight:600,marginBottom:2}}>MONNAIE À RENDRE</div>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:28,fontWeight:800,color:"#065F46"}}>CHF {change.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}

        {/* Choose method */}
        {step === "choose" && (
          <div style={{padding:"18px 22px"}}>
            {/* Mode selector */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:18}}>
              {[["card","💳","Carte"],["cash","💵","Espèces"],["split","🔀","Mixte"],["giftcard","🎁","Carte cadeau"]].map(function(m){
                var active = method === m[0];
                return (
                  <button key={m[0]} onClick={function(){ setMethod(m[0]); setGiven(""); setSplitCard(""); setGcCode(""); setGcFound(null); setGcError(""); setScanning(false); }}
                    style={{padding:"12px 8px",borderRadius:12,border:"2px solid "+(active?"#C8953A":"#EDE0D0"),
                            background:active?"#FDF0D8":"#fff",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{m[1]}</div>
                    <div style={{fontSize:11,fontWeight:active?700:500,color:active?"#92400E":"#5C4A32",fontFamily:"'Outfit',sans-serif"}}>{m[2]}</div>
                  </button>
                );
              })}
            </div>

            {/* Card */}
            {method === "card" && (
              <div style={{background:"#F7F3EE",borderRadius:12,padding:"16px",textAlign:"center",marginBottom:16}}>
                <div style={{fontSize:13,color:"#5C4A32",marginBottom:4}}>Terminal SumUp · En attente</div>
                <div style={{fontSize:11,color:"#8B7355"}}>Présentez la carte, tapez ou insérez</div>
              </div>
            )}

            {/* Cash */}
            {method === "cash" && (
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Montant reçu (CHF)</label>
                <input type="number" value={given} onChange={function(e){ setGiven(e.target.value); }}
                  placeholder={"Montant ≥ "+total.toFixed(2)}
                  style={{width:"100%",padding:"12px",borderRadius:10,border:"2px solid "+(givenNum>=total&&given?"#C8953A":"#EDE0D0"),
                          fontSize:20,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",
                          color:"#1E0E05",background:"#fff",transition:"border-color .15s"}} />
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
                  {QUICK.map(function(v){
                    return (
                      <button key={v} onClick={function(){ setGiven(String(v)); }}
                        style={{padding:"5px 10px",borderRadius:8,border:"1px solid #EDE0D0",background:given==String(v)?"#FDF0D8":"#fff",
                                color:given==String(v)?"#92400E":"#5C4A32",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}>
                        {v.toFixed(2)}
                      </button>
                    );
                  })}
                </div>
                {given && givenNum >= total && (
                  <div style={{background:"#D1FAE5",borderRadius:10,padding:"10px 14px",marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:12,color:"#065F46",fontWeight:600}}>Monnaie à rendre</span>
                    <span style={{fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:800,color:"#065F46"}}>CHF {change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Split */}
            {method === "split" && (
              <div style={{marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div>
                    <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Carte (CHF)</label>
                    <input type="number" value={splitCard} onChange={function(e){ setSplitCard(e.target.value); }}
                      placeholder="0.00" min="0" max={total}
                      style={{width:"100%",padding:"10px",borderRadius:10,border:"2px solid #EDE0D0",fontSize:16,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}} />
                  </div>
                  <div>
                    <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Espèces (CHF)</label>
                    <input type="number" value={given} onChange={function(e){ setGiven(e.target.value); }}
                      placeholder={splitNum > 0 ? "≥ "+(total-splitNum).toFixed(2) : "0.00"}
                      style={{width:"100%",padding:"10px",borderRadius:10,border:"2px solid #EDE0D0",fontSize:16,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}} />
                  </div>
                </div>
                {splitNum > 0 && (
                  <div style={{background:"#F7F3EE",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#5C4A32",display:"flex",justifyContent:"space-between"}}>
                    <span>Reste en espèces</span>
                    <span style={{fontWeight:700}}>CHF {Math.max(0,total-splitNum).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Gift Card */}
            {method === "giftcard" && (
              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Code carte cadeau</label>
                <div style={{display:"flex",gap:8}}>
                  <input type="text" value={gcCode} onChange={function(e){ lookupGC(e.target.value); }}
                    placeholder="GC-XXXX-XXXX"
                    style={{flex:1,padding:"12px",borderRadius:10,border:"2px solid "+(gcFound?"#10B981":gcError&&gcCode.length>=5?"#EF4444":"#EDE0D0"),
                            fontSize:18,fontWeight:700,textAlign:"center",outline:"none",fontFamily:"'Courier New',monospace",
                            color:"#1E0E05",background:"#F7F3EE",textTransform:"uppercase",letterSpacing:2,transition:"border-color .15s"}} />
                  <button onClick={startScan}
                    style={{padding:"10px 14px",borderRadius:10,border:"1px solid #EDE0D0",background:scanning?"#1E0E05":"#F7F3EE",
                            color:scanning?"#FDF8F0":"#5C4A32",fontSize:18,cursor:"pointer",transition:"all .15s",flexShrink:0}}
                    title="Scanner QR code">
                    📷
                  </button>
                </div>
                {scanning && (
                  <div style={{marginTop:10,borderRadius:12,overflow:"hidden",border:"2px solid #C8953A",position:"relative"}}>
                    <video ref={scanRef} style={{width:"100%",display:"block",maxHeight:200}} muted playsInline />
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <div style={{width:120,height:120,border:"3px solid #C8953A",borderRadius:14,animation:"glow 1s ease infinite alternate"}} />
                    </div>
                    <button onClick={function(){setScanning(false);if(scanRef.current&&scanRef.current.srcObject)scanRef.current.srcObject.getTracks().forEach(function(t){t.stop();});}}
                      style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.6)",border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",fontSize:14,cursor:"pointer"}}>✕</button>
                  </div>
                )}
                {gcError && <div style={{marginTop:8,padding:"7px 12px",borderRadius:8,background:"#FEF3C7",border:"1px solid #FCD34D",fontSize:11,color:"#92400E",fontWeight:600}}>{gcError}</div>}
                {gcFound && (
                  <div style={{marginTop:10,background:"#D1FAE5",border:"1.5px solid #10B981",borderRadius:12,padding:"14px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#065F46"}}>✅ Carte valide</span>
                      <span style={{fontFamily:"'Courier New',monospace",fontSize:12,fontWeight:700,color:"#065F46",letterSpacing:1}}>{gcFound.code}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <span style={{fontSize:10,color:"#065F46"}}>Solde disponible</span>
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#065F46"}}>CHF {gcFound.balance.toFixed(2)}</span>
                    </div>
                    {gcFound.balance < total && (
                      <div style={{marginTop:8,padding:"6px 10px",borderRadius:6,background:"#FEF3C7",fontSize:10,color:"#92400E",fontWeight:600}}>
                        ⚠️ Solde insuffisant — complétez avec un autre moyen de paiement
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={pay} disabled={!cashValid}
              style={{width:"100%",padding:"15px",borderRadius:12,border:"none",
                      background:cashValid?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                      color:cashValid?"#1E0E05":"#fff",fontSize:16,fontWeight:800,
                      cursor:cashValid?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",
                      transition:"all .18s",letterSpacing:.3}}>
              {method==="card" ? "💳 Lancer le paiement carte" : method==="cash" ? "💵 Encaisser" : method==="giftcard" ? "🎁 Payer avec la carte cadeau" : "🔀 Confirmer paiement mixte"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptModal(props) {
  var sale   = props.sale;
  var tenant = props.tenant;
  var onClose= props.onClose;
  if (!sale) return null;
  var methodLabel = sale.payInfo.method === "card" ? "Carte bancaire" : sale.payInfo.method === "cash" ? "Espèces" : sale.payInfo.method === "giftcard" ? "Carte cadeau" : "Paiement mixte";
  return (
    <div style={{position:"fixed",inset:0,zIndex:950,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
                 display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
         onClick={onClose}>
      <div onClick={function(e){e.stopPropagation();}}
        style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:320,boxShadow:"0 24px 60px rgba(0,0,0,.3)",overflow:"hidden",animation:"fadeUp .25s ease"}}>
        <div style={{background:"#1E0E05",padding:"18px 20px",textAlign:"center"}}>
          <div style={{fontSize:22,marginBottom:4}}>🥐</div>
          <div style={{color:"#C8953A",fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700}}>{tenant}</div>
          <div style={{color:"rgba(253,248,240,.4)",fontSize:10,marginTop:2}}>{sale.time} · {sale.store}</div>
        </div>
        <div style={{padding:"14px 20px",borderBottom:"1px dashed #EDE0D0"}}>
          {sale.items.map(function(i,idx){
            return (
              <div key={idx} style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}>
                <span style={{color:"#5C4A32"}}>{i.qty}× {i.name}</span>
                <span style={{fontWeight:600,color:"#1E0E05"}}>CHF {(i.price*i.qty).toFixed(2)}</span>
              </div>
            );
          })}
        </div>
        <div style={{padding:"12px 20px",borderBottom:"1px dashed #EDE0D0"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:13,color:"#8B7355"}}>Total TTC</span>
            <span style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:"#C8953A"}}>CHF {sale.total.toFixed(2)}</span>
          </div>
          {(function(){
            var tv = sale.tvaInfo || computeTVA(sale.items);
            return React.createElement("div",{style:{marginTop:4}},
              tv.lines.map(function(l){
                return React.createElement("div",{key:l.rate,style:{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8B7355",marginBottom:1}},
                  React.createElement("span",null,"dont TVA "+l.rate+"%"),
                  React.createElement("span",null,"CHF "+l.tva.toFixed(2))
                );
              }),
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:10,color:"#8B7355",marginTop:2,borderTop:"1px dotted #EDE0D0",paddingTop:3}},
                React.createElement("span",null,"Total HT"),
                React.createElement("span",null,"CHF "+tv.totalHT.toFixed(2))
              )
            );
          })()}
          <div style={{fontSize:11,color:"#8B7355",marginTop:6}}>{methodLabel}
            {sale.payInfo.change > 0 && <span style={{color:"#065F46",fontWeight:600}}> · Rendu CHF {sale.payInfo.change.toFixed(2)}</span>}
          </div>
        </div>
        <div style={{padding:"14px 20px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"#B8A898",marginBottom:8}}>Merci de votre visite ! 🙏</div>
          <button onClick={onClose}
            style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:"#1E0E05",color:"#FDF8F0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientDisplay(props) {
  var cart   = props.cart;
  var total  = props.total;
  var tenant = props.tenant;
  var onClose= props.onClose;
  var paid   = props.paid;

  return (
    <div style={{position:"fixed",inset:0,zIndex:800,background:"#1E0E05",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32}}>
      <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(255,255,255,.08)",border:"none",borderRadius:"50%",width:36,height:36,color:"rgba(253,248,240,.4)",fontSize:18,cursor:"pointer"}}>✕</button>
      <div style={{fontSize:48,marginBottom:8}}>🥐</div>
      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:26,color:"#C8953A",fontWeight:800,marginBottom:32,letterSpacing:-1}}>{tenant}</div>

      {paid ? (
        <div style={{textAlign:"center",animation:"fadeUp .4s ease"}}>
          <div style={{fontSize:72,marginBottom:16}}>✅</div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:28,color:"#D1FAE5",fontWeight:800}}>Merci !</div>
          <div style={{color:"rgba(253,248,240,.5)",fontSize:14,marginTop:8}}>Bonne dégustation 🙏</div>
        </div>
      ) : cart.length === 0 ? (
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12,opacity:.3}}>🧺</div>
          <div style={{color:"rgba(253,248,240,.3)",fontSize:16}}>En attente de commande…</div>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:480}}>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:28}}>
            {cart.map(function(i,idx){
              return (
                <div key={idx} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                                       background:"rgba(255,255,255,.06)",borderRadius:14,padding:"12px 18px",
                                       animation:"slideIn .2s "+(idx*.06)+"s both"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:28}}>{i.emoji}</span>
                    <div>
                      <div style={{fontFamily:"'Outfit',sans-serif",color:"#FDF8F0",fontSize:15,fontWeight:600}}>{i.name}</div>
                      <div style={{color:"rgba(253,248,240,.4)",fontSize:12}}>× {i.qty}</div>
                    </div>
                  </div>
                  <div style={{fontFamily:"'Outfit',sans-serif",color:"#C8953A",fontSize:18,fontWeight:700}}>CHF {(i.price*i.qty).toFixed(2)}</div>
                </div>
              );
            })}
          </div>
          <div style={{background:"rgba(200,149,58,.12)",borderRadius:16,padding:"20px 24px",border:"1px solid rgba(200,149,58,.25)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:"rgba(253,248,240,.6)",fontSize:14}}>TOTAL</span>
            <span style={{fontFamily:"'Outfit',sans-serif",color:"#C8953A",fontSize:38,fontWeight:800}}>CHF {total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── VENDEUSE ────────────────────────────────────────────────── */
/* ─── FLOOR PLAN EDITOR (Admin) ──────────────────────────────── */
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

function Vendeuse(props) {
  var orders    = props.orders;
  var addOrder  = props.addOrder;
  var updOrder  = props.updOrder;
  var sendMsg   = props.sendMsg;
  var userStore = props.userStore;
  var userName  = props.userName  || "Inconnu";
  var catalogue = props.catalogue || PRODUCTS.map(function(p){ return Object.assign({},p,{active:true}); });
  var sales     = props.sales     || [];
  var addSale   = props.addSale   || function(){};
  var chat      = props.chat      || [];
  var tableLayouts    = props.tableLayouts    || {};
  var tableSessions   = props.tableSessions   || {};
  var setTableSessions= props.setTableSessions|| function(){};
  var tenant    = props.tenant    || "BakeryOS";
  var giftCards   = props.giftCards   || [];
  var addGiftCard = props.addGiftCard || function(){};
  var useGiftCard = props.useGiftCard || function(){};

  var myStore    = userStore || STORES[0];
  var myTables   = tableLayouts[myStore] || [];

  var activeProd = catalogue.filter(function(p){ return p.active; });

  const [tab,        setTab]        = useState("pos");
  const [search,     setSearch]     = useState("");
  const [cat,        setCat]        = useState("Tous");
  const [cart,       setCart]       = useState([]);
  const [client,     setClient]     = useState("");
  const [store,      setStore]      = useState(userStore || STORES[0]);
  const [note,       setNote]       = useState("");
  const [edit,       setEdit]       = useState(null);
  const [saved,      setSaved]      = useState(false);
  const [cartErr,    setCartErr]    = useState("");
  const [showPay,    setShowPay]    = useState(false);
  const [lastSale,   setLastSale]   = useState(null);
  const [showReceipt,setShowReceipt]= useState(false);
  const [showClient, setShowClient] = useState(false);
  const [paidAnim,   setPaidAnim]   = useState(false);
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [giftAmount,   setGiftAmount]   = useState("");
  const [giftEmail,    setGiftEmail]    = useState("");
  const [createdGift,  setCreatedGift]  = useState(null); // carte créée à afficher
  // ── Nouveau flux tables ──
  const [activeTable,    setActiveTable]    = useState(null);  // table en cours d'édition
  const [showModeModal,  setShowModeModal]  = useState(false); // popup Sur place / Emporter / Livraison
  const [showTablePicker,setShowTablePicker]= useState(false); // choix table pour "sur place"
  const [showDelivery,   setShowDelivery]   = useState(false); // formulaire livraison
  const [deliveryAddr,   setDeliveryAddr]   = useState("");
  const [deliveryDriver, setDeliveryDriver] = useState("");
  const [parkAnim,       setParkAnim]       = useState(false); // animation "en attente"
  const [pendingTickets, setPendingTickets]  = useState([]); // tickets en attente sans table
  const [printingTicket, setPrintingTicket]  = useState(null); // ticket en cours d'impression

  var CATS_ACTIVE = ["Tous"].concat(
    activeProd.reduce(function(acc,p){
      if (acc.indexOf(p.category) < 0) acc.push(p.category); return acc;
    }, [])
  );

  var filtered = activeProd.filter(function(p){
    return (cat==="Tous" || p.category===cat) &&
           p.name.toLowerCase().indexOf(search.toLowerCase()) >= 0;
  });

  function addToCart(p) {
    setCartErr("");
    setCart(function(prev){
      var ex = prev.find(function(i){ return i.id===p.id; });
      return ex ? prev.map(function(i){ return i.id===p.id ? Object.assign({},i,{qty:i.qty+1}) : i; })
                : prev.concat([Object.assign({},p,{qty:1})]);
    });
  }
  function setQty(id, q) {
    if (q <= 0) setCart(function(prev){ return prev.filter(function(i){ return i.id!==id; }); });
    else setCart(function(prev){ return prev.map(function(i){ return i.id===id ? Object.assign({},i,{qty:q}) : i; }); });
  }
  function removeItem(id) { setCart(function(prev){ return prev.filter(function(i){ return i.id!==id; }); }); }
  function clearCart() { setCart([]); setClient(""); setNote(""); setActiveTable(null); setDeliveryAddr(""); setDeliveryDriver(""); }

  var total = cart.reduce(function(s,i){ return s+i.price*i.qty; }, 0);

  // Auto-sync: quand le panier change et une table est active, sauvegarder
  useEffect(function(){
    if (activeTable && cart.length > 0) {
      saveToTable(activeTable, cart);
    }
  }, [cart]);

  // ── Valider → ouvre le popup de mode ──
  function handleValidate() {
    if (!cart.length) {
      setCartErr("⚠️ Ajoutez au moins un article");
      setTimeout(function(){ setCartErr(""); }, 3000);
      return;
    }
    setShowModeModal(true);
  }

  // ── Charger une table dans le panier POS ──
  function loadTable(t) {
    // Si on travaille déjà sur une table, sauvegarder d'abord
    if (activeTable && cart.length > 0) {
      saveToTable(activeTable, cart);
    }
    var key = myStore+"_"+t.id;
    var sess = tableSessions[key];
    if (sess && sess.cart && sess.cart.length > 0) {
      setCart(sess.cart.slice());
      setClient("Table "+t.name);
    } else {
      setCart([]);
      setClient("Table "+t.name);
    }
    setActiveTable(t);
    setNote("");
    setTab("pos");
  }

  // ── Sauvegarder le panier sur une table ──
  function saveToTable(t, items) {
    var key = myStore+"_"+t.id;
    setTableSessions(function(prev){
      var updated = { cart: items.slice(), openedAt: (prev[key] && prev[key].openedAt) || hm(), status: items.length > 0 ? "occupee" : "libre" };
      return Object.assign({},prev,{[key]:updated});
    });
  }

  // ── Mettre en attente (parquer sur table) ──
  function parkOnTable(t) {
    saveToTable(t, cart);
    setParkAnim(true);
    setTimeout(function(){
      setCart([]); setClient(""); setNote(""); setActiveTable(null);
      setParkAnim(false);
    }, 1200);
  }

  // ── Libérer une table ──
  function clearTableSession(t) {
    var key = myStore+"_"+t.id;
    setTableSessions(function(prev){
      var n = Object.assign({},prev);
      delete n[key];
      return n;
    });
    if (activeTable && activeTable.id === t.id) {
      setCart([]); setClient(""); setNote(""); setActiveTable(null);
    }
  }

  // ── Encaisser (appelé par PayModal) ──
  function onPaid(payInfo) {
    var ts = Date.now();
    var sale = {
      id:      "VTE-" + ts,
      time:    hm(),
      date:    new Date().toLocaleDateString("fr-CH"),
      store:   store,
      seller:  userName,
      client:  client || "Client anonyme",
      items:   cart.map(function(i){ return {id:i.id,name:i.name,qty:i.qty,price:i.price,emoji:i.emoji,tva:i.tva||2.6}; }),
      total:   total,
      tvaInfo: computeTVA(cart),
      payInfo: payInfo,
    };
    addSale(sale);
    // Créer commande en production si livraison
    if (showDelivery || deliveryAddr) {
      addOrder({
        id: "CMD-" + (ts + 1),
        client: client, store: store, note: note,
        status: "attente", priority: "normal", modReq: false,
        items: cart.map(function(i){ return {id:i.id,name:i.name,qty:i.qty,price:i.price}; }),
        time: hm(), total: total,
        dMethod: "livreur", dest: deliveryAddr, driver: deliveryDriver || null,
      });
    }
    // Si table active, libérer la table
    if (activeTable) {
      clearTableSession(activeTable);
    }
    setShowPay(false);
    setShowDelivery(false);
    setLastSale(sale);
    setPaidAnim(true);
    setShowReceipt(true);
    setTimeout(function(){
      clearCart();
      setPaidAnim(false);
    }, 3500);
  }

  // ── Modes de validation ──
  function onModeSelect(mode) {
    setShowModeModal(false);
    if (mode === "surplace") {
      if (myTables.length > 0) {
        setShowTablePicker(true);
      } else {
        // Pas de tables configurées → encaisser direct
        setShowPay(true);
      }
    } else if (mode === "emporter") {
      if (!client.trim()) setClient("À emporter");
      setShowPay(true);
    } else if (mode === "livraison") {
      setShowDelivery(true);
    }
  }

  // ── Choix table dans le picker ──
  function onTablePick(t, action) {
    setShowTablePicker(false);
    setClient("Table "+t.name);
    setActiveTable(t);
    if (action === "attente") {
      parkOnTable(t);
    } else {
      // action === "encaisser"
      saveToTable(t, cart);
      setShowPay(true);
    }
  }

  // ── Mettre ticket en attente (sans table) ──
  function parkTicket() {
    setShowModeModal(false);
    var ticket = {
      id: "TK-"+Date.now(),
      cart: cart.slice(),
      client: client || "Client",
      note: note,
      time: hm(),
      total: total,
    };
    setPendingTickets(function(prev){ return prev.concat([ticket]); });
    setParkAnim(true);
    setTimeout(function(){
      clearCart();
      setParkAnim(false);
    }, 1200);
  }

  // ── Reprendre un ticket en attente ──
  function resumeTicket(ticket) {
    // Sauvegarder panier courant si besoin
    if (activeTable && cart.length > 0) saveToTable(activeTable, cart);
    setCart(ticket.cart.slice());
    setClient(ticket.client);
    setNote(ticket.note || "");
    setActiveTable(null);
    // Retirer le ticket
    setPendingTickets(function(prev){ return prev.filter(function(t){ return t.id !== ticket.id; }); });
    setTab("pos");
  }

  // ── Supprimer un ticket en attente ──
  function deleteTicket(ticketId) {
    setPendingTickets(function(prev){ return prev.filter(function(t){ return t.id !== ticketId; }); });
  }

  // ── Imprimer ticket (ouvre fenêtre print) ──
  function printTicket(itemsOrTicket) {
    var items = itemsOrTicket.cart || itemsOrTicket;
    var ticketClient = itemsOrTicket.client || client || "Client";
    var ticketTotal = items.reduce(function(s,i){ return s+i.price*i.qty; },0);
    var tv = computeTVA(items);
    var w = window.open("","_blank","width=320,height=600");
    if (!w) return;
    w.document.write(
      '<html><head><style>body{font-family:monospace;font-size:12px;padding:10px;max-width:280px;margin:0 auto}'+
      '.line{display:flex;justify-content:space-between;margin:2px 0}.sep{border-top:1px dashed #000;margin:6px 0}'+
      '.center{text-align:center}.bold{font-weight:bold}.big{font-size:16px}.small{font-size:9px;color:#666}</style></head><body>'+
      '<div class="center bold big">'+tenant+'</div>'+
      '<div class="center" style="font-size:10px;margin-bottom:8px">'+myStore+'</div>'+
      '<div class="sep"></div>'+
      '<div class="center" style="margin-bottom:4px">'+ticketClient+' · '+hm()+'</div>'+
      '<div class="sep"></div>'+
      items.map(function(i){
        return '<div class="line"><span>'+i.qty+'× '+i.name+'</span><span>'+((i.price*i.qty).toFixed(2))+'</span></div>';
      }).join('')+
      '<div class="sep"></div>'+
      '<div class="line bold big"><span>TOTAL TTC</span><span>CHF '+ticketTotal.toFixed(2)+'</span></div>'+
      '<div class="sep"></div>'+
      tv.lines.map(function(l){
        return '<div class="line small"><span>dont TVA '+l.rate+'%</span><span>CHF '+l.tva.toFixed(2)+'</span></div>';
      }).join('')+
      '<div class="line small"><span>Total HT</span><span>CHF '+tv.totalHT.toFixed(2)+'</span></div>'+
      '<div class="sep"></div>'+
      '<div class="center" style="font-size:9px;margin-top:8px">Merci de votre visite !</div>'+
      '</body></html>'
    );
    w.document.close();
    w.print();
  }

  function handleSave(updated) {
    var t = updated.items.reduce(function(s,i){ return s+i.price*i.qty; }, 0);
    updOrder(updated.id, {items:updated.items, note:updated.note, total:t});
    setSaved(true); setEdit(null);
    setTimeout(function(){ setSaved(false); }, 2000);
  }

  // KPIs du jour
  var today = new Date().toLocaleDateString("fr-CH");
  var todaySales = sales.filter(function(s){ return s.date === today; });
  var caJour     = todaySales.reduce(function(s,v){ return s+v.total; }, 0);
  var nbTx       = todaySales.length;
  var avgTicket  = nbTx > 0 ? caJour / nbTx : 0;

  return (
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"hidden",background:"#F7F3EE"}}>

      {/* ── Modal choix mode : Sur place / Emporter / Livraison ── */}
      {showModeModal && (
        <div style={{position:"fixed",inset:0,zIndex:850,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
                     display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
             onClick={function(){ setShowModeModal(false); }}>
          <div style={{background:"#fff",borderRadius:20,padding:"28px 24px",maxWidth:400,width:"100%",
                       boxShadow:"0 32px 80px rgba(0,0,0,.3)",animation:"pinIn .22s ease",textAlign:"center"}}
               onClick={function(e){ e.stopPropagation(); }}>
            <div style={{fontSize:15,fontWeight:800,color:"#1E0E05",fontFamily:"'Outfit',sans-serif",marginBottom:4}}>
              Type de commande
            </div>
            <div style={{fontSize:11,color:"#8B7355",marginBottom:20}}>
              {cart.reduce(function(s,i){return s+i.qty;},0)} articles · CHF {total.toFixed(2)}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {id:"surplace",  icon:"🍽", label:"Sur place",   desc:"Le client reste en salle",     bg:"#FEF3C7",border:"#F59E0B",tx:"#92400E"},
                {id:"emporter",  icon:"📦", label:"À emporter",  desc:"Le client emporte sa commande", bg:"#DBEAFE",border:"#3B82F6",tx:"#1E40AF"},
                {id:"livraison", icon:"🚐", label:"Livraison",   desc:"Envoi par chauffeur",           bg:"#F3E8FF",border:"#8B5CF6",tx:"#7C3AED"},
              ].map(function(m){
                return (
                  <button key={m.id} onClick={function(){ onModeSelect(m.id); }}
                    style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,
                            border:"2px solid "+m.border,background:m.bg,cursor:"pointer",textAlign:"left",
                            transition:"all .15s",fontFamily:"'Outfit',sans-serif"}}
                    onMouseOver={function(e){ e.currentTarget.style.transform="scale(1.02)"; }}
                    onMouseOut={function(e){ e.currentTarget.style.transform="scale(1)"; }}>
                    <span style={{fontSize:28}}>{m.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:m.tx}}>{m.label}</div>
                      <div style={{fontSize:10,color:m.tx,opacity:.7}}>{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Actions secondaires */}
            <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"center"}}>
              <button onClick={parkTicket}
                style={{padding:"9px 16px",borderRadius:10,border:"1px solid #EDE0D0",
                        background:"#F7F3EE",color:"#5C4A32",fontSize:12,fontWeight:700,
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6}}>
                ⏸ En attente
              </button>
              <button onClick={function(){ printTicket(cart); setShowModeModal(false); }}
                style={{padding:"9px 16px",borderRadius:10,border:"1px solid #EDE0D0",
                        background:"#F7F3EE",color:"#5C4A32",fontSize:12,fontWeight:700,
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:6}}>
                🖨 Imprimer
              </button>
            </div>
            <button onClick={function(){ setShowModeModal(false); }}
              style={{marginTop:14,padding:"8px 20px",borderRadius:8,border:"1px solid #EDE0D0",
                      background:"transparent",color:"#8B7355",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Modal choix table (sur place) ── */}
      {showTablePicker && (
        <div style={{position:"fixed",inset:0,zIndex:850,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
                     display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
             onClick={function(){ setShowTablePicker(false); }}>
          <div style={{background:"#fff",borderRadius:20,padding:"24px",maxWidth:500,width:"100%",maxHeight:"80vh",overflowY:"auto",
                       boxShadow:"0 32px 80px rgba(0,0,0,.3)",animation:"pinIn .22s ease"}}
               onClick={function(e){ e.stopPropagation(); }}>
            <div style={{fontSize:15,fontWeight:800,color:"#1E0E05",fontFamily:"'Outfit',sans-serif",marginBottom:4,textAlign:"center"}}>
              🪑 Choisir une table
            </div>
            <div style={{fontSize:11,color:"#8B7355",marginBottom:16,textAlign:"center"}}>
              CHF {total.toFixed(2)} · {cart.reduce(function(s,i){return s+i.qty;},0)} articles
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10,marginBottom:16}}>
              {myTables.map(function(t){
                var key = myStore+"_"+t.id;
                var sess = tableSessions[key];
                var isOccupied = sess && sess.cart && sess.cart.length > 0;
                var bg = isOccupied ? "#FEF3C7" : "#F0FDF4";
                var border = isOccupied ? "#F59E0B" : "#BBF7D0";
                var tx = isOccupied ? "#92400E" : "#15803D";
                return (
                  <div key={t.id} style={{position:"relative"}}>
                    <div style={{background:bg,borderRadius:12,padding:"12px 10px",textAlign:"center",
                                border:"2px solid "+border,opacity:isOccupied?.5:1,
                                cursor:isOccupied?"not-allowed":"default"}}>
                      <div style={{fontSize:14,fontWeight:800,color:tx,fontFamily:"'Outfit',sans-serif"}}>🪑 {t.name}</div>
                      <div style={{fontSize:9,color:tx,opacity:.7}}>{t.seats}p · {isOccupied?"Occupée":"Libre"}</div>
                      {!isOccupied && (
                        <div style={{display:"flex",gap:5,marginTop:8,justifyContent:"center"}}>
                          <button onClick={function(){ onTablePick(t,"attente"); }}
                            style={{padding:"5px 8px",borderRadius:7,border:"1px solid rgba(200,149,58,.3)",
                                    background:"rgba(200,149,58,.1)",color:"#92400E",fontSize:9,fontWeight:700,
                                    cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                            ⏸ Attente
                          </button>
                          <button onClick={function(){ onTablePick(t,"encaisser"); }}
                            style={{padding:"5px 8px",borderRadius:7,border:"none",
                                    background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",
                                    fontSize:9,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                            💳 Payer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={function(){ setShowTablePicker(false); }}
              style={{width:"100%",padding:"10px",borderRadius:10,border:"1px solid #EDE0D0",
                      background:"transparent",color:"#8B7355",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Modal livraison ── */}
      {showDelivery && (
        <div style={{position:"fixed",inset:0,zIndex:850,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",
                     display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
             onClick={function(){ setShowDelivery(false); }}>
          <div style={{background:"#fff",borderRadius:20,padding:"24px",maxWidth:400,width:"100%",
                       boxShadow:"0 32px 80px rgba(0,0,0,.3)",animation:"pinIn .22s ease"}}
               onClick={function(e){ e.stopPropagation(); }}>
            <div style={{fontSize:15,fontWeight:800,color:"#1E0E05",fontFamily:"'Outfit',sans-serif",marginBottom:16,textAlign:"center"}}>
              🚐 Livraison
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:4}}>Nom du client</label>
              <input value={client} onChange={function(e){ setClient(e.target.value); }}
                placeholder="Nom du client"
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #EDE0D0",
                        fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:4}}>Adresse de livraison</label>
              <input value={deliveryAddr} onChange={function(e){ setDeliveryAddr(e.target.value); }}
                placeholder="Rue, numéro, ville"
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #EDE0D0",
                        fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,color:"#8B7355",display:"block",marginBottom:4}}>Chauffeur</label>
              <select value={deliveryDriver} onChange={function(e){ setDeliveryDriver(e.target.value); }}
                style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #EDE0D0",
                        fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",background:"#fff",boxSizing:"border-box"}}>
                <option value="">— Choisir —</option>
                {DRIVERS.filter(function(d){ return d!=="Non assigné"; }).map(function(d){
                  return <option key={d} value={d}>{d}</option>;
                })}
              </select>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={function(){ setShowDelivery(false); }}
                style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid #EDE0D0",
                        background:"transparent",color:"#8B7355",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Annuler
              </button>
              <button onClick={function(){
                  if (!client.trim()) { setCartErr("⚠️ Saisissez le nom du client"); setTimeout(function(){ setCartErr(""); },3000); return; }
                  if (!deliveryAddr.trim()) { setCartErr("⚠️ Saisissez l'adresse"); setTimeout(function(){ setCartErr(""); },3000); return; }
                  setShowDelivery(false);
                  setShowPay(true);
                }}
                style={{flex:1,padding:"11px",borderRadius:10,border:"none",
                        background:"linear-gradient(135deg,#C8953A,#a07228)",color:"#1E0E05",
                        fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                💳 Encaisser CHF {total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Animation en attente ── */}
      {parkAnim && (
        <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.4)",
                     display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#1E0E05",borderRadius:20,padding:"24px 36px",textAlign:"center",
                       animation:"pinIn .25s ease",boxShadow:"0 20px 60px rgba(0,0,0,.4)"}}>
            <div style={{fontSize:36,marginBottom:8}}>⏸</div>
            <div style={{color:"#C8953A",fontSize:16,fontWeight:800,fontFamily:"'Outfit',sans-serif"}}>En attente</div>
            <div style={{color:"rgba(253,248,240,.5)",fontSize:11,marginTop:4}}>Table réservée — reprendre quand prêt</div>
          </div>
        </div>
      )}

      {edit && <EditModal order={edit} onSave={handleSave} onClose={function(){ setEdit(null); }}
                          onModReq={function(id){ updOrder(id,{modReq:true}); }} sendMsg={sendMsg} />}
      {showPay && <PayModal total={total} cart={cart} tenant="BakeryOS" onPaid={onPaid} onClose={function(){ setShowPay(false); }} giftCards={giftCards} useGiftCard={useGiftCard} />}
      {showReceipt && <ReceiptModal sale={lastSale} tenant="BakeryOS" onClose={function(){ setShowReceipt(false); }} />}
      {showClient && <ClientDisplay cart={cart} total={total} tenant="BakeryOS" paid={paidAnim} onClose={function(){ setShowClient(false); }} />}

      {/* ── Modal création carte cadeau ── */}
      {showGiftCard && !createdGift && (
        <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",
                     display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
             onClick={function(){ setShowGiftCard(false); setGiftAmount(""); setGiftEmail(""); }}>
          <div onClick={function(e){e.stopPropagation();}}
            style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:400,boxShadow:"0 32px 80px rgba(0,0,0,.35)",overflow:"hidden",animation:"pinIn .25s ease"}}>
            <div style={{background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",padding:"22px 24px",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:6}}>🎁</div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:"#C8953A"}}>Nouvelle carte cadeau</div>
              <div style={{fontSize:11,color:"rgba(253,248,240,.4)",marginTop:2}}>Montant libre · Carte virtuelle</div>
            </div>
            <div style={{padding:"20px 24px"}}>
              <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:6}}>Montant (CHF) *</label>
              <input type="number" min="1" step="0.50" value={giftAmount} onChange={function(e){setGiftAmount(e.target.value);}}
                placeholder="Ex: 25, 50, 100..."
                style={{width:"100%",padding:"14px",borderRadius:12,border:"2px solid "+(parseFloat(giftAmount)>0?"#C8953A":"#EDE0D0"),
                        fontSize:26,fontWeight:800,textAlign:"center",outline:"none",fontFamily:"'Outfit',sans-serif",
                        color:"#1E0E05",background:"#F7F3EE",transition:"border-color .15s"}} />
              <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",justifyContent:"center"}}>
                {[10,20,25,50,75,100,150,200].map(function(v){
                  return React.createElement("button",{key:v,onClick:function(){setGiftAmount(String(v));},
                    style:{padding:"6px 12px",borderRadius:8,border:"1px solid "+(giftAmount==String(v)?"#C8953A":"#EDE0D0"),
                           background:giftAmount==String(v)?"#FDF0D8":"#fff",color:giftAmount==String(v)?"#92400E":"#5C4A32",
                           fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}},v+" CHF");
                })}
              </div>
              <div style={{marginTop:14}}>
                <label style={{fontSize:10,color:"#8B7355",textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5}}>Email destinataire (optionnel)</label>
                <input type="email" value={giftEmail} onChange={function(e){setGiftEmail(e.target.value);}}
                  placeholder="nom@email.com"
                  style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #EDE0D0",fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",background:"#F7F3EE"}} />
              </div>
              <div style={{display:"flex",gap:8,marginTop:18}}>
                <button onClick={function(){setShowGiftCard(false);setGiftAmount("");setGiftEmail("");}}
                  style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid #EDE0D0",background:"#fff",color:"#5C4A32",fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
                <button disabled={!(parseFloat(giftAmount)>0)} onClick={function(){
                    var amt = parseFloat(giftAmount)||0;
                    if (amt <= 0) return;
                    var code = generateGiftCode();
                    // Vérifier unicité
                    while(giftCards.some(function(g){return g.code===code;})) code = generateGiftCode();
                    var card = {
                      id: "GC-"+Date.now(),
                      code: code,
                      amount: amt,
                      balance: amt,
                      status: "active",
                      createdAt: new Date().toLocaleDateString("fr-CH"),
                      createdTime: hm(),
                      store: store,
                      seller: userName,
                      email: giftEmail || null,
                      history: [{date:new Date().toLocaleDateString("fr-CH"),time:hm(),amount:0,balance:amt,label:"Création"}]
                    };
                    addGiftCard(card);
                    // Enregistrer comme vente
                    addSale({
                      id:"VTE-"+Date.now(),time:hm(),date:new Date().toLocaleDateString("fr-CH"),
                      store:store,seller:userName,client:giftEmail||"Carte cadeau",
                      items:[{id:0,name:"Carte cadeau "+code,qty:1,price:amt,emoji:"🎁",tva:0}],
                      total:amt,tvaInfo:{lines:[],totalHT:amt,totalTVA:0,totalTTC:amt},
                      payInfo:{method:"card",change:0}
                    });
                    setCreatedGift(card);
                    setGiftAmount("");setGiftEmail("");
                  }}
                  style={{flex:2,padding:"12px",borderRadius:12,border:"none",
                          background:parseFloat(giftAmount)>0?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                          color:parseFloat(giftAmount)>0?"#1E0E05":"#8B7355",fontSize:14,fontWeight:700,
                          cursor:parseFloat(giftAmount)>0?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>
                  🎁 Créer la carte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Carte cadeau créée : affichage + impression/email ── */}
      {createdGift && (
        <div style={{position:"fixed",inset:0,zIndex:950,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",
                     display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
             onClick={function(){setCreatedGift(null);setShowGiftCard(false);}}>
          <div onClick={function(e){e.stopPropagation();}}
            style={{background:"#fff",borderRadius:22,width:"100%",maxWidth:380,boxShadow:"0 32px 80px rgba(0,0,0,.35)",overflow:"hidden",animation:"fadeUp .3s ease"}}>
            <div style={{background:"linear-gradient(135deg,#1E0E05 0%,#3D2B1A 100%)",padding:"28px 24px",textAlign:"center"}}>
              <div style={{fontSize:48,marginBottom:8,animation:"pop .4s ease"}}>🎁</div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:800,color:"#C8953A",marginBottom:4}}>Carte cadeau créée !</div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:36,fontWeight:800,color:"#FDF8F0",letterSpacing:-1}}>CHF {createdGift.amount.toFixed(2)}</div>
            </div>
            <div style={{padding:"20px 24px",textAlign:"center"}}>
              <div style={{background:"#F7F3EE",borderRadius:14,padding:"16px",marginBottom:14}}>
                <div style={{fontSize:9,color:"#8B7355",textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Code carte</div>
                <div style={{fontFamily:"'Courier New',monospace",fontSize:28,fontWeight:800,color:"#1E0E05",letterSpacing:3}}>{createdGift.code}</div>
              </div>
              <img src={qrUrl(createdGift.code)} alt="QR" style={{width:140,height:140,borderRadius:10,border:"2px solid #EDE0D0",marginBottom:14}} />
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <button onClick={function(){
                    var w=window.open("","_blank","width=380,height=600");
                    if(!w)return;
                    w.document.write(
                      '<html><head><style>body{font-family:sans-serif;text-align:center;padding:20px;max-width:340px;margin:0 auto}'+
                      '.code{font-family:monospace;font-size:28px;font-weight:800;letter-spacing:3px;margin:12px 0}'+
                      '.amt{font-size:36px;font-weight:800;color:#C8953A;margin:8px 0}'+
                      '.sep{border-top:2px dashed #DBC9A8;margin:14px 0}.small{font-size:10px;color:#888}</style></head><body>'+
                      '<div style="font-size:42px;margin-bottom:8px">🎁</div>'+
                      '<div style="font-size:20px;font-weight:800">CARTE CADEAU</div>'+
                      '<div style="font-size:13px;color:#888;margin-bottom:4px">'+tenant+'</div>'+
                      '<div class="sep"></div>'+
                      '<div class="amt">CHF '+createdGift.amount.toFixed(2)+'</div>'+
                      '<div class="sep"></div>'+
                      '<div class="code">'+createdGift.code+'</div>'+
                      '<img src="'+qrUrl(createdGift.code)+'" width="160" height="160" style="margin:10px auto;display:block;border-radius:8px" />'+
                      '<div class="sep"></div>'+
                      '<div class="small">Émise le '+createdGift.createdAt+' · '+createdGift.store+'</div>'+
                      '<div class="small" style="margin-top:12px">Présentez ce code en caisse ou scannez le QR code</div>'+
                      '</body></html>'
                    );
                    w.document.close();
                    setTimeout(function(){w.print();},500);
                  }}
                  style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"#1E0E05",color:"#FDF8F0",
                          fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                          display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  🖨 Imprimer
                </button>
                {createdGift.email && (
                  <button onClick={function(){
                      var subj = encodeURIComponent("Votre carte cadeau "+tenant+" — "+createdGift.code);
                      var body = encodeURIComponent(
                        "Bonjour,\n\nVoici votre carte cadeau "+tenant+" !\n\n"+
                        "Montant : CHF "+createdGift.amount.toFixed(2)+"\n"+
                        "Code : "+createdGift.code+"\n\n"+
                        "Présentez ce code en caisse pour l'utiliser.\n\n"+
                        "Merci et à bientôt !\n"+tenant
                      );
                      window.open("mailto:"+createdGift.email+"?subject="+subj+"&body="+body);
                    }}
                    style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#C8953A,#a07228)",
                            color:"#1E0E05",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                            display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    ✉️ Email
                  </button>
                )}
              </div>
              <button onClick={function(){setCreatedGift(null);setShowGiftCard(false);}}
                style={{width:"100%",padding:"11px",borderRadius:10,border:"1px solid #EDE0D0",background:"#F7F3EE",
                        color:"#5C4A32",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barre onglets ── */}
      <div style={{display:"flex",background:"#fff",borderBottom:"1px solid #EDE0D0",padding:"0 16px",alignItems:"center",gap:0,flexShrink:0}}>
        {(function(){
          var addCount = myTables.filter(function(t){
            var k=myStore+"_"+t.id; var s=tableSessions[k];
            return s && s.status==="addition";
          }).length;
          var occCount = myTables.filter(function(t){
            var k=myStore+"_"+t.id; var s=tableSessions[k];
            return s && s.cart && s.cart.length>0;
          }).length;
          var tabLabel = "🪑 Tables"+(myTables.length?" ("+occCount+"/"+myTables.length+")":"");
          return [["pos","🛒 Caisse"],["tables",tabLabel,addCount],["sales","📊 Ventes"],["history","📋 Commandes"]];
        })().map(function(item){
          return (
            <button key={item[0]} onClick={function(){ setTab(item[0]); }}
              style={{padding:"13px 16px",border:"none",background:"none",
                      color:tab===item[0]?"#C8953A":"#8B7355",fontWeight:tab===item[0]?700:400,
                      fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",
                      borderBottom:tab===item[0]?"2px solid #C8953A":"2px solid transparent",
                      transition:"all .16s",whiteSpace:"nowrap",position:"relative"}}>
              {item[1]}
              {item[2] > 0 && (
                <span style={{position:"absolute",top:6,right:2,background:"#EF4444",color:"#fff",
                              borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,
                              display:"inline-flex",alignItems:"center",justifyContent:"center",
                              animation:"glow 1s ease infinite alternate"}}>
                  {item[2]}
                </span>
              )}
            </button>
          );
        })}
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={function(){ setShowGiftCard(true); }}
            title="Créer une carte cadeau"
            style={{padding:"5px 11px",borderRadius:18,border:"1px solid #EDE0D0",
                    background:"transparent",color:"#8B7355",
                    fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,transition:"all .15s"}}>
            🎁 Carte cadeau
          </button>
          <button onClick={function(){ setShowClient(function(v){return !v;}); }}
            title="Affichage client (2e écran)"
            style={{padding:"5px 11px",borderRadius:18,border:"1px solid "+(showClient?"#C8953A":"#EDE0D0"),
                    background:showClient?"#FDF0D8":"transparent",color:showClient?"#92400E":"#8B7355",
                    fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,transition:"all .15s"}}>
            🖥 Client
          </button>
          {saved && <div style={{background:"#D1FAE5",color:"#065F46",fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:18,animation:"pop .3s ease"}}>✅ Sauvegarde</div>}
        </div>
      </div>

      {/* ── Onglet Tables ── */}
      {tab === "tables" && (
        <div style={{flex:1,overflowY:"auto"}}>
          {myTables.length === 0 ? (
            <div style={{padding:"60px 20px",textAlign:"center",color:"#8B7355"}}>
              <div style={{fontSize:48,marginBottom:12}}>🪑</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:6}}>Aucune table configurée</div>
              <div style={{fontSize:12}}>L'admin configure le plan dans Gestion → votre magasin</div>
            </div>
          ) : (
            <div style={{padding:16}}>
              {/* Stats rapides */}
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                {(function(){
                  var libre=0, occ=0, add=0, tCA=0;
                  myTables.forEach(function(t){
                    var k=myStore+"_"+t.id; var s=tableSessions[k];
                    if(!s||!s.cart||s.cart.length===0) libre++;
                    else if(s.status==="addition"){ add++; tCA+=s.cart.reduce(function(x,i){return x+i.price*i.qty;},0); }
                    else { occ++; tCA+=s.cart.reduce(function(x,i){return x+i.price*i.qty;},0); }
                  });
                  return [
                    {label:"Libres",c:"#10B981",bg:"#D1FAE5",v:libre},
                    {label:"Occupées",c:"#F59E0B",bg:"#FEF3C7",v:occ},
                    {label:"Additions",c:"#EF4444",bg:"#FEE2E2",v:add},
                    {label:"CA Tables",c:"#C8953A",bg:"#FDF0D8",v:"CHF "+tCA.toFixed(2),bold:true},
                  ];
                })().map(function(s){
                  return (
                    <div key={s.label} style={{background:s.bg,borderRadius:10,padding:"8px 14px",minWidth:80,textAlign:"center"}}>
                      <div style={{fontSize:s.bold?16:20,fontWeight:800,color:s.c,fontFamily:"'Outfit',sans-serif"}}>{s.v}</div>
                      <div style={{fontSize:9,fontWeight:600,color:s.c,opacity:.8}}>{s.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Grille de cartes tables */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
                {myTables.map(function(t){
                  var key = myStore+"_"+t.id;
                  var sess = tableSessions[key];
                  var isOccupied = sess && sess.cart && sess.cart.length > 0;
                  var isAddition = sess && sess.status === "addition";
                  var tTotal = isOccupied ? sess.cart.reduce(function(s,i){return s+i.price*i.qty;},0) : 0;
                  var nbItems = isOccupied ? sess.cart.reduce(function(s,i){return s+i.qty;},0) : 0;

                  var bg = isAddition ? "#FEE2E2" : isOccupied ? "#FEF3C7" : "#F0FDF4";
                  var border = isAddition ? "#EF4444" : isOccupied ? "#F59E0B" : "#BBF7D0";
                  var dot = isAddition ? "#EF4444" : isOccupied ? "#F59E0B" : "#10B981";
                  var tx = isAddition ? "#991B1B" : isOccupied ? "#92400E" : "#15803D";
                  var label = isAddition ? "Addition" : isOccupied ? "Occupée" : "Libre";

                  return (
                    <div key={t.id} className="ch"
                      onClick={function(){ loadTable(t); }}
                      style={{background:bg,borderRadius:14,padding:"14px 12px",cursor:"pointer",
                              border:"2px solid "+border,position:"relative",
                              transition:"all .15s",
                              animation:isAddition?"glow 1s ease infinite alternate":"none",
                              boxShadow:isOccupied?"0 4px 12px rgba(0,0,0,.08)":"none"}}>
                      {/* Status dot */}
                      <div style={{position:"absolute",top:10,right:10,width:10,height:10,borderRadius:"50%",background:dot}} />

                      <div style={{fontSize:16,fontWeight:800,color:tx,fontFamily:"'Outfit',sans-serif",marginBottom:2}}>
                        🪑 {t.name}
                      </div>
                      <div style={{fontSize:10,color:tx,opacity:.7,marginBottom:isOccupied?8:0}}>
                        {t.seats} couverts · {label}
                      </div>

                      {isOccupied && (
                        <>
                          <div style={{fontSize:10,color:tx,marginBottom:4}}>
                            {nbItems} article{nbItems>1?"s":""}
                            {sess.openedAt ? " · depuis "+sess.openedAt : ""}
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span style={{fontSize:18,fontWeight:800,color:tx,fontFamily:"'Outfit',sans-serif"}}>
                              CHF {tTotal.toFixed(2)}
                            </span>
                            {isAddition && <span style={{fontSize:14}}>🔔</span>}
                          </div>
                          {/* Mini liste articles */}
                          <div style={{marginTop:6,borderTop:"1px solid rgba(0,0,0,.08)",paddingTop:5}}>
                            {sess.cart.slice(0,3).map(function(item,idx){
                              return (
                                <div key={idx} style={{fontSize:9,color:tx,opacity:.7,lineHeight:1.5}}>
                                  {item.emoji} {item.qty}× {item.name}
                                </div>
                              );
                            })}
                            {sess.cart.length > 3 && (
                              <div style={{fontSize:9,color:tx,opacity:.5}}>+{sess.cart.length-3} autres…</div>
                            )}
                          </div>
                        </>
                      )}

                      {!isOccupied && (
                        <div style={{marginTop:10,fontSize:10,color:"#15803D",fontWeight:600,textAlign:"center",opacity:.6}}>
                          Toucher pour ouvrir
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Plan de salle SVG en dessous */}
              <div style={{fontSize:12,fontWeight:700,color:"#5C4A32",marginBottom:8,fontFamily:"'Outfit',sans-serif"}}>📐 Plan de salle</div>
              <FloorPlanView
                tables={myTables}
                sessions={tableSessions}
                store={myStore}
                onSelectTable={function(t){ loadTable(t); }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Ventes du jour ── */}
      {tab === "sales" && (
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:26,color:"#1E0E05",margin:"0 0 16px"}}>📊 Ventes du jour</h2>

          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
            {[
              {label:"CA du jour",    val:"CHF "+caJour.toFixed(2), bg:"linear-gradient(135deg,#C8953A,#a07228)", dot:"#FDF8F0"},
              {label:"Transactions",  val:nbTx,                      bg:"linear-gradient(135deg,#1E40AF,#2563EB)", dot:"#BFDBFE"},
              {label:"Ticket moyen",  val:"CHF "+avgTicket.toFixed(2),bg:"linear-gradient(135deg,#065F46,#059669)",dot:"#A7F3D0"},
            ].map(function(k){
              return (
                <div key={k.label} style={{background:k.bg,borderRadius:14,padding:"16px",color:"#fff"}}>
                  <div style={{fontSize:22,fontWeight:800,fontFamily:"'Outfit',sans-serif",marginBottom:2}}>{k.val}</div>
                  <div style={{fontSize:10,opacity:.75,textTransform:"uppercase",letterSpacing:.9}}>{k.label}</div>
                </div>
              );
            })}
          </div>

          {/* Liste ventes */}
          {todaySales.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0",color:"#8B7355"}}>
              <div style={{fontSize:36,marginBottom:8}}>🧾</div>
              <div style={{fontSize:13}}>Aucune vente enregistrée aujourd'hui</div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {todaySales.map(function(s){
                var mIcon = s.payInfo.method==="card"?"💳":s.payInfo.method==="cash"?"💵":"🔀";
                return (
                  <div key={s.id} style={{background:"#fff",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"#FDF0D8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{mIcon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:"#1E0E05",marginBottom:1}}>{s.client}</div>
                      <div style={{fontSize:10,color:"#8B7355",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {s.items.map(function(i){ return i.qty+"× "+i.name; }).join(", ")}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:15,fontWeight:700,color:"#C8953A"}}>CHF {s.total.toFixed(2)}</div>
                      <div style={{fontSize:10,color:"#8B7355"}}>{s.time}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{background:"#F7F3EE",borderRadius:10,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                <span style={{fontSize:12,color:"#5C4A32",fontWeight:600}}>Total journée</span>
                <span style={{fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:"#C8953A"}}>CHF {caJour.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Historique commandes ── */}
      {tab === "history" && (
        <div style={{flex:1,overflowY:"auto",padding:20}}>
          <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:24,color:"#1E0E05",margin:"0 0 4px"}}>Toutes les commandes</h3>
          <p style={{color:"#8B7355",fontSize:12,margin:"0 0 14px"}}>Cliquez pour voir le détail ou modifier</p>
          <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
            {Object.keys(SM).map(function(s){
              var m = SM[s];
              return (
                <div key={s} style={{display:"flex",alignItems:"center",gap:3,fontSize:10}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:m.dot}} />
                  <span style={{background:m.bg,color:m.tx,padding:"2px 7px",borderRadius:11,fontWeight:600,fontSize:9}}>{m.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {orders.filter(function(o){ return !userStore || o.store === userStore; }).map(function(o){
              var sm = SM[o.status] || SM.attente;
              return (
                <div key={o.id} className="ch" onClick={function(){ setEdit(o); }}
                  style={{background:"#fff",borderRadius:12,padding:"12px 15px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"center",gap:11,cursor:"pointer"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,color:"#1E0E05",fontSize:12}}>{o.id}</span>
                      <span style={{background:sm.bg,color:sm.tx,fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:16}}>{sm.label}</span>
                      {o.modReq && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:16}}>🔔 Modif</span>}
                    </div>
                    <div style={{fontSize:11,color:"#5C4A32",marginBottom:1}}>{o.client}</div>
                    <div style={{fontSize:10,color:"#8B7355"}}>{o.items.map(function(i){ return i.qty+"x "+i.name; }).join(", ")}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
                    <div style={{fontSize:10,color:"#8B7355"}}>{o.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Onglet POS Caisse ── */}
      {tab === "pos" && (
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>

          {/* Grille produits */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

            {/* ── Barre rapide tables ── */}
            {myTables.length > 0 && (
              <div style={{padding:"6px 12px",background:"#fff",borderBottom:"1px solid #EDE0D0",flexShrink:0,
                           display:"flex",alignItems:"center",gap:6,overflowX:"auto"}}>
                <span style={{fontSize:10,color:"#8B7355",fontWeight:600,flexShrink:0,marginRight:2}}>🪑</span>
                {myTables.map(function(t){
                  var key = myStore+"_"+t.id;
                  var sess = tableSessions[key];
                  var isOccupied = sess && sess.cart && sess.cart.length > 0;
                  var isAddition = sess && sess.status === "addition";
                  var tTotal = isOccupied ? sess.cart.reduce(function(s,i){return s+i.price*i.qty;},0) : 0;
                  var nbItems = isOccupied ? sess.cart.reduce(function(s,i){return s+i.qty;},0) : 0;
                  var isActive = activeTable && activeTable.id === t.id;

                  var bg = isActive ? "#FDF0D8" : isAddition ? "#FEE2E2" : isOccupied ? "#FEF3C7" : "#F0FDF4";
                  var border = isActive ? "#C8953A" : isAddition ? "#EF4444" : isOccupied ? "#F59E0B" : "#BBF7D0";
                  var tx = isActive ? "#92400E" : isAddition ? "#991B1B" : isOccupied ? "#92400E" : "#15803D";

                  return (
                    <button key={t.id}
                      onClick={function(){ loadTable(t); }}
                      style={{
                        padding: isOccupied ? "4px 8px 4px 10px" : "4px 10px",
                        borderRadius:10, border: (isActive?"2.5px":"1.5px")+" solid "+border, background:bg,
                        cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", gap:5,
                        fontFamily:"'Outfit',sans-serif", transition:"all .15s",
                        animation: isAddition ? "glow 1s ease infinite alternate" : "none",
                        boxShadow: isActive ? "0 2px 8px rgba(200,149,58,.3)" : isOccupied ? "0 2px 6px rgba(0,0,0,.08)" : "none",
                      }}>
                      <span style={{fontSize:11,fontWeight:700,color:tx}}>{t.name}</span>
                      {isOccupied && (
                        <span style={{fontSize:9,fontWeight:700,color:tx,
                                      background:"rgba(0,0,0,.06)",padding:"1px 5px",borderRadius:6}}>
                          {nbItems}art · {tTotal.toFixed(0)}
                        </span>
                      )}
                      {isAddition && <span style={{fontSize:10}}>🔔</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {/* ── Tickets en attente (quick chips) ── */}
            {pendingTickets.length > 0 && (
              <div style={{padding:"4px 12px 4px",background:"#fff",borderBottom:"1px solid #EDE0D0",flexShrink:0,
                           display:"flex",alignItems:"center",gap:6,overflowX:"auto"}}>
                <span style={{fontSize:10,color:"#8B7355",fontWeight:600,flexShrink:0}}>⏸</span>
                {pendingTickets.map(function(tk){
                  return (
                    <button key={tk.id} onClick={function(){ resumeTicket(tk); }}
                      style={{padding:"4px 10px",borderRadius:10,border:"1.5px solid #8B5CF6",
                              background:"#F3E8FF",cursor:"pointer",flexShrink:0,
                              display:"flex",alignItems:"center",gap:5,
                              fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                      <span style={{fontSize:11,fontWeight:700,color:"#7C3AED"}}>{tk.client}</span>
                      <span style={{fontSize:9,fontWeight:700,color:"#7C3AED",
                                    background:"rgba(0,0,0,.06)",padding:"1px 5px",borderRadius:6}}>
                        {tk.time} · {tk.total.toFixed(0)}
                      </span>
                      <span onClick={function(e){ e.stopPropagation(); deleteTicket(tk.id); }}
                        style={{fontSize:9,color:"#DC2626",cursor:"pointer",marginLeft:2}}>✕</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Barre recherche + catégories */}
            <div style={{padding:"10px 12px 0",background:"#fff",borderBottom:"1px solid #EDE0D0",flexShrink:0}}>
              <input placeholder="🔍 Rechercher un produit…" value={search} onChange={function(e){ setSearch(e.target.value); }}
                style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1.5px solid #EDE0D0",background:"#F7F3EE",
                        fontSize:13,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:8,
                        transition:"border-color .18s"}}
                onFocus={function(e){ e.target.style.borderColor="#C8953A"; }}
                onBlur={function(e){ e.target.style.borderColor="#EDE0D0"; }} />
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:10}}>
                {CATS_ACTIVE.map(function(c){
                  return (
                    <button key={c} onClick={function(){ setCat(c); }}
                      style={{padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",flexShrink:0,
                              background:cat===c?"#1E0E05":"#F7F3EE",color:cat===c?"#FDF8F0":"#5C4A32",
                              fontSize:12,fontWeight:cat===c?700:500,fontFamily:"'Outfit',sans-serif",transition:"all .14s"}}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grille tactile */}
            <div style={{flex:1,overflowY:"auto",padding:12}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
                {filtered.map(function(p){
                  var inCart = cart.find(function(i){ return i.id===p.id; });
                  return (
                    <div key={p.id} className="pt" onClick={function(){ addToCart(p); }}
                      style={{background:"#fff",borderRadius:14,padding:"14px 10px",cursor:"pointer",textAlign:"center",
                              boxShadow:"0 2px 8px rgba(0,0,0,.06)",
                              border:"2px solid "+(inCart?"#C8953A":"transparent"),
                              position:"relative",transition:"all .15s"}}>
                      {inCart && (
                        <div style={{position:"absolute",top:8,right:8,background:"#C8953A",color:"#1E0E05",
                                     borderRadius:"50%",width:20,height:20,fontSize:10,fontWeight:800,
                                     display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {inCart.qty}
                        </div>
                      )}
                      <div style={{fontSize:32,marginBottom:6}}>{p.emoji}</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#1E0E05",marginBottom:4,lineHeight:1.3}}>{p.name}</div>
                      <div style={{fontSize:14,fontWeight:800,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {p.price.toFixed(2)}</div>
                      <div style={{fontSize:8,color:(p.tva||2.6)>3?"#7C3AED":"#8B7355",marginTop:2}}>TVA {p.tva||2.6}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panier */}
          <div style={{width:290,background:"#1E0E05",display:"flex",flexDirection:"column",flexShrink:0}}>

            {/* Header panier */}
            <div style={{padding:"14px 16px 10px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                {activeTable ? (
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:17,color:"#C8953A",margin:0}}>🪑 {activeTable.name}</h3>
                    <button onClick={function(){
                        if (cart.length > 0) saveToTable(activeTable, cart);
                        setCart([]); setClient(""); setNote(""); setActiveTable(null);
                      }}
                      title="Détacher la table"
                      style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:6,
                              color:"rgba(253,248,240,.4)",fontSize:10,padding:"2px 6px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                      ✕ Détacher
                    </button>
                  </div>
                ) : (
                  <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:17,color:"#FDF8F0",margin:0}}>🛒 Panier</h3>
                )}
                {cart.length > 0 && (
                  <button onClick={clearCart}
                    style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,
                            color:"#FCA5A5",fontSize:10,fontWeight:600,padding:"3px 8px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                    Vider
                  </button>
                )}
              </div>
              {/* Client */}
              <input value={client} onChange={function(e){ setClient(e.target.value); }}
                placeholder={activeTable ? "Table "+activeTable.name : "👤 Client (optionnel)"}
                style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid rgba(200,149,58,.25)",
                        background:"rgba(255,255,255,.05)",color:"#FDF8F0",fontSize:12,outline:"none",
                        fontFamily:"'Outfit',sans-serif"}} />
            </div>

            {/* Articles */}
            <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
              {cart.length === 0 ? (
                <div style={{textAlign:"center",color:"rgba(253,248,240,.2)",padding:"30px 0",fontSize:12}}>
                  <div style={{fontSize:28,marginBottom:6}}>{activeTable ? "🪑" : "🧺"}</div>
                  {activeTable ? "Table vide — ajoutez des produits" : "Touchez un produit pour l'ajouter"}
                </div>
              ) : cart.map(function(item){
                return (
                  <div key={item.id} style={{background:"rgba(255,255,255,.06)",borderRadius:9,padding:"8px 10px",marginBottom:6,
                                             display:"flex",alignItems:"center",gap:8,animation:"slideIn .18s ease"}}>
                    <span style={{fontSize:16,flexShrink:0}}>{item.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,color:"#FDF8F0",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      <div style={{fontSize:11,color:"#C8953A",fontWeight:700}}>CHF {(item.price*item.qty).toFixed(2)}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <button onClick={function(){ setQty(item.id,item.qty-1); }}
                        style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(255,255,255,.2)",background:"transparent",
                                color:"#FDF8F0",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                      <span style={{color:"#FDF8F0",fontSize:13,fontWeight:700,minWidth:16,textAlign:"center"}}>{item.qty}</span>
                      <button onClick={function(){ setQty(item.id,item.qty+1); }}
                        style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(200,149,58,.4)",background:"rgba(200,149,58,.15)",
                                color:"#C8953A",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                      <button onClick={function(){ removeItem(item.id); }}
                        style={{width:18,height:18,borderRadius:"50%",border:"none",background:"rgba(239,68,68,.18)",
                                color:"#FCA5A5",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",marginLeft:2}}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div style={{padding:"0 12px 8px"}}>
              <input value={note} onChange={function(e){ setNote(e.target.value); }} placeholder="📝 Note…"
                style={{width:"100%",padding:"6px 9px",borderRadius:7,border:"1px solid rgba(255,255,255,.08)",
                        background:"rgba(255,255,255,.04)",color:"rgba(253,248,240,.6)",fontSize:11,
                        outline:"none",fontFamily:"'Outfit',sans-serif"}} />
            </div>

            {/* Total + actions */}
            <div style={{padding:"12px 16px 16px",borderTop:"1px solid rgba(255,255,255,.1)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                <span style={{color:"rgba(253,248,240,.5)",fontSize:12}}>Total TTC</span>
                <span style={{fontFamily:"'Outfit',sans-serif",color:"#C8953A",fontSize:28,fontWeight:800,letterSpacing:-1}}>
                  CHF {total.toFixed(2)}
                </span>
              </div>
              {cart.length>0 && (function(){
                var tv=computeTVA(cart);
                return React.createElement("div",{style:{marginBottom:10}},
                  tv.lines.map(function(l){
                    return React.createElement("div",{key:l.rate,style:{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(253,248,240,.35)",marginBottom:1}},
                      React.createElement("span",null,"TVA "+l.rate+"%"),
                      React.createElement("span",null,"CHF "+l.tva.toFixed(2))
                    );
                  }),
                  React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(253,248,240,.3)",borderTop:"1px dotted rgba(255,255,255,.1)",paddingTop:2,marginTop:2}},
                    React.createElement("span",null,"HT"),
                    React.createElement("span",null,"CHF "+tv.totalHT.toFixed(2))
                  )
                );
              })()}
              {cartErr && (
                <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,
                             padding:"7px 10px",marginBottom:8,fontSize:11,color:"#FCA5A5",
                             textAlign:"center",animation:"shake .45s ease"}}>
                  {cartErr}
                </div>
              )}

              {activeTable ? (
                /* ── Mode table active : Encaisser, Imprimer ou En attente ── */
                <>
                  <button className="bg" onClick={function(){
                      if (!cart.length) { setCartErr("⚠️ Panier vide"); setTimeout(function(){setCartErr("");},3000); return; }
                      saveToTable(activeTable, cart);
                      setShowPay(true);
                    }}
                    style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                            background:cart.length?"linear-gradient(135deg,#C8953A,#a07228)":"rgba(255,255,255,.08)",
                            color:cart.length?"#1E0E05":"rgba(255,255,255,.2)",
                            fontSize:15,fontWeight:800,cursor:cart.length?"pointer":"not-allowed",
                            fontFamily:"'Outfit',sans-serif",letterSpacing:.3,transition:"all .15s",marginBottom:6}}>
                    💳 Encaisser
                  </button>
                  <div style={{display:"flex",gap:6,marginBottom:0}}>
                    <button onClick={function(){ if (cart.length) printTicket(cart); }}
                      style={{flex:1,padding:"9px",borderRadius:10,
                              border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",
                              color:cart.length?"rgba(253,248,240,.6)":"rgba(255,255,255,.15)",
                              fontSize:11,fontWeight:600,cursor:cart.length?"pointer":"not-allowed",
                              fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                      🖨 Imprimer
                    </button>
                    <button onClick={function(){
                        if (cart.length > 0) parkOnTable(activeTable);
                        else { setActiveTable(null); setClient(""); }
                      }}
                      style={{flex:1,padding:"9px",borderRadius:10,
                              border:"1px solid rgba(200,149,58,.35)",
                              background:"rgba(200,149,58,.08)",
                              color:"#C8953A",
                              fontSize:11,fontWeight:600,cursor:"pointer",
                              fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                      ⏸ Attente
                    </button>
                  </div>
                </>
              ) : (
                /* ── Mode sans table : Valider → choix mode ── */
                <button className="bg" onClick={handleValidate}
                  style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                          background:cart.length?"linear-gradient(135deg,#C8953A,#a07228)":"rgba(255,255,255,.08)",
                          color:cart.length?"#1E0E05":"rgba(255,255,255,.2)",
                          fontSize:15,fontWeight:800,cursor:cart.length?"pointer":"not-allowed",
                          fontFamily:"'Outfit',sans-serif",letterSpacing:.3,transition:"all .15s"}}>
                  ✓ Valider
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PRODUCTION ──────────────────────────────────────────────── */
function Production(props) {
  var orders  = props.orders;
  var updOrder= props.updOrder;
  var chat    = props.chat;
  var sendMsg = props.sendMsg;
  var recipes = props.recipes || [];
  var catalogue = props.catalogue || [];

  const [selId,   setSelId]   = useState(null);
  const [dest,    setDest]    = useState("");
  const [method,  setMethod]  = useState("magasin");
  const [filter,  setFilter]  = useState("all");
  const [editOrd, setEditOrd] = useState(null);
  const [prodRecipe, setProdRecipe] = useState(null); // recipe to view

  var modReqs = chat.filter(function(m){ return m.mod; }).slice(-4);
  var queue = orders
    .filter(function(o){ return o.status==="production" || o.status==="attente"; })
    .filter(function(o){ return filter==="all" || o.priority===filter; })
    .slice().sort(function(a,b){ return (b.priority==="urgent"?1:0)-(a.priority==="urgent"?1:0); });

  var stats = [
    {label:"Attente",   v:orders.filter(function(o){ return o.status==="attente"; }).length,    c:"#F59E0B",bg:"#FEF3C7"},
    {label:"Production",v:orders.filter(function(o){ return o.status==="production"; }).length, c:"#3B82F6",bg:"#DBEAFE"},
    {label:"Pretes",    v:orders.filter(function(o){ return o.status==="prete"; }).length,      c:"#EF4444",bg:"#FEE2E2"},
    {label:"Livrees",   v:orders.filter(function(o){ return o.status==="livre"; }).length,       c:"#10B981",bg:"#D1FAE5"},
  ];

  function markReady(id){ updOrder(id,{status:"prete",modReq:false}); }
  function handleSend(o){
    if(!dest) return;
    updOrder(o.id,{status:method==="livreur"?"livraison":"livre",dMethod:method,dest:dest});
    setSelId(null); setDest(""); setMethod("magasin");
  }
  function handleEdit(updated){
    var t = updated.items.reduce(function(s,i){ return s+i.price*i.qty; },0);
    updOrder(updated.id,{items:updated.items,note:updated.note,total:t});
    setEditOrd(null);
  }

  return (
    <div style={{padding:20,minHeight:"100vh"}}>
      {editOrd && <EditModal order={editOrd} onSave={handleEdit} onClose={function(){ setEditOrd(null); }} onModReq={function(){}} sendMsg={sendMsg} />}
      <div style={{marginBottom:16}}>
        <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:30,color:"#1E0E05",margin:"0 0 2px"}}>Tableau de Production</h2>
        <p style={{color:"#8B7355",fontSize:12,margin:0}}>{queue.length} commande(s) a traiter</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {stats.map(function(s){
          return (
            <div key={s.label} style={{background:s.bg,borderRadius:11,padding:"12px 14px"}}>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"'Outfit',sans-serif"}}>{s.v}</div>
              <div style={{fontSize:9,color:s.c,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>{s.label}</div>
            </div>
          );
        })}
      </div>
      {modReqs.length > 0 && (
        <div style={{background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#DC2626",marginBottom:6}}>🔔 Demandes de modification</div>
          {modReqs.map(function(m){
            return (
              <div key={m.id} style={{fontSize:11,color:"#991B1B",marginBottom:3,display:"flex",alignItems:"center",gap:6}}>
                {m.ord && <span style={{background:"#FEE2E2",padding:"1px 6px",borderRadius:16,fontWeight:600,fontSize:10}}>{m.ord}</span>}
                <span style={{flex:1}}>{m.text}</span>
                <span style={{color:"rgba(153,27,27,.4)",fontSize:10,flexShrink:0}}>{m.t}</span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["all","Toutes"],["urgent","🚨 Urgentes"],["normal","Normales"]].map(function(item){
          return (
            <button key={item[0]} onClick={function(){ setFilter(item[0]); }}
              style={{padding:"5px 12px",borderRadius:16,border:"none",cursor:"pointer",
                      background:filter===item[0]?"#1E0E05":"#fff",color:filter===item[0]?"#FDF8F0":"#5C4A32",
                      fontSize:11,fontWeight:500,fontFamily:"'Outfit',sans-serif",boxShadow:"0 1px 4px rgba(0,0,0,.07)",transition:"all .12s"}}>{item[1]}</button>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {queue.map(function(o, i){
          var sm = SM[o.status] || SM.attente;
          return (
            <div key={o.id} className="ch"
              style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.06)",
                      animation:"slideIn .28s "+(i*.07)+"s both",
                      border:"2px solid "+(o.priority==="urgent"?"#FCA5A5":"#EDE0D0")}}>
              {o.priority==="urgent" && <div style={{height:3,background:"linear-gradient(90deg,#EF4444,#F97316)"}} />}
              <div style={{padding:15}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:700,color:"#1E0E05"}}>{o.id}</span>
                      {o.priority==="urgent" && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:16}}>URGENT</span>}
                      <span style={{background:sm.bg,color:sm.tx,fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:16}}>{sm.label}</span>
                      {o.modReq && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:16}}>🔔</span>}
                    </div>
                    <div style={{fontSize:12,color:"#5C4A32",fontWeight:600}}>{o.client}</div>
                    <div style={{fontSize:10,color:"#8B7355"}}>📍 {o.store}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
                    <div style={{fontSize:10,color:"#8B7355"}}>{o.time}</div>
                  </div>
                </div>
                <div style={{marginBottom:10}}>
                  {o.items.map(function(it,j){
                    var itemRecipe = recipes.find(function(r){ return r.name===it.name || (catalogue.find(function(c){return c.id===it.id;}) && r.productId===it.id); });
                    return <div key={j} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderBottom:"1px solid #F0E8DC",fontSize:11}}>
                      <span style={{color:"#3D2B1A"}}>{it.qty}x {it.name}</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        {itemRecipe && <button onClick={function(e){e.stopPropagation(); setProdRecipe(itemRecipe);}}
                          style={{padding:"1px 5px",borderRadius:4,border:"1px solid #C4B5FD",background:"#EDE9FE",color:"#5B21B6",fontSize:8,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>📖</button>}
                        <span style={{color:"#8B7355"}}>CHF {(it.price*it.qty).toFixed(2)}</span>
                      </div>
                    </div>;
                  })}
                  {o.note && <div style={{marginTop:4,fontSize:10,color:"#8B7355",fontStyle:"italic"}}>📝 {o.note}</div>}
                </div>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  <button onClick={function(){ setEditOrd(o); }}
                    style={{flex:1,padding:"6px",borderRadius:8,border:"1px solid #D5C4B0",background:"#F7F3EE",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}
                    onMouseOver={function(e){ e.currentTarget.style.background="#EDE0D0"; }}
                    onMouseOut={function(e){ e.currentTarget.style.background="#F7F3EE"; }}>✏️ Modifier</button>
                  <button onClick={function(){ markReady(o.id); }}
                    style={{flex:1,padding:"6px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#F59E0B,#D97706)",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✅ Marquer prete</button>
                </div>
                {selId === o.id ? (
                  <div style={{background:"#F7F3EE",borderRadius:9,padding:10}}>
                    <select value={dest} onChange={function(e){ setDest(e.target.value); }}
                      style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:6}}>
                      <option value="">-- Destination --</option>
                      {STORES.map(function(s){ return <option key={s}>{s}</option>; })}
                    </select>
                    <div style={{display:"flex",gap:5,marginBottom:6}}>
                      {[["magasin","🏪 Magasin"],["livreur","🚐 Livreur"]].map(function(item){
                        return (
                          <button key={item[0]} onClick={function(){ setMethod(item[0]); }}
                            style={{flex:1,padding:"5px",borderRadius:6,border:"1px solid "+(method===item[0]?"#C8953A":"#D5C4B0"),background:method===item[0]?"#FDF0D8":"#fff",color:method===item[0]?"#92400E":"#5C4A32",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}>{item[1]}</button>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={function(){ setSelId(null); setDest(""); }}
                        style={{flex:1,padding:"6px",borderRadius:6,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>✕</button>
                      <button disabled={!dest} onClick={function(){ handleSend(o); }}
                        style={{flex:2,padding:"6px",borderRadius:6,border:"none",background:dest?"#1E0E05":"#D5C4B0",color:"#FDF8F0",fontSize:11,fontWeight:600,cursor:dest?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif"}}>Expedier</button>
                    </div>
                  </div>
                ) : (
                  <button className="bg" onClick={function(){ setSelId(o.id); }}
                    style={{width:"100%",padding:"8px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",color:"#FDF8F0",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>🚀 Expedier cette commande</button>
                )}
              </div>
            </div>
          );
        })}
        {queue.length===0 && (
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"50px 0",color:"#8B7355"}}>
            <div style={{fontSize:40,marginBottom:8}}>🎉</div>
            <div style={{fontSize:16,fontFamily:"'Outfit',sans-serif",color:"#1E0E05"}}>Toutes les commandes traitees !</div>
          </div>
        )}
      </div>
      {/* Recipe quick-view modal */}
      {prodRecipe && (function(){
        var r = prodRecipe;
        var totalTime = r.prepTime + r.cookTime;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(30,14,5,.55)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
            onClick={function(){ setProdRecipe(null); }}>
            <div style={{background:"#FDF8F0",borderRadius:18,maxWidth:500,width:"100%",maxHeight:"85vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",animation:"fadeUp .25s ease"}}
              onClick={function(e){e.stopPropagation();}}>
              <div style={{background:"linear-gradient(135deg,#1E0E05,#3D2B1A)",padding:"16px 20px",borderRadius:"18px 18px 0 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:"#FDF8F0",fontFamily:"'Outfit',sans-serif"}}>📖 {r.name}</div>
                    <div style={{fontSize:10,color:"#C8953A",marginTop:2}}>{r.portions} portions · {totalTime} min · {r.difficulty}</div>
                  </div>
                  <button onClick={function(){ setProdRecipe(null); }}
                    style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:8,width:28,height:28,color:"#FDF8F0",fontSize:14,cursor:"pointer"}}>✕</button>
                </div>
              </div>
              <div style={{padding:16}}>
                <div style={{fontWeight:700,color:"#1E0E05",fontSize:12,marginBottom:6}}>🧈 Ingrédients</div>
                {r.ingredients.map(function(ing,idx){
                  return <div key={idx} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #F0E8DC",fontSize:11}}>
                    <span style={{color:"#3D2B1A"}}>{ing.name}</span>
                    <span style={{color:"#C8953A",fontWeight:600}}>{ing.qty} {ing.unit}</span>
                  </div>;
                })}
                <div style={{fontWeight:700,color:"#1E0E05",fontSize:12,marginTop:12,marginBottom:6}}>📝 Étapes</div>
                {r.steps.map(function(step,idx){
                  return <div key={idx} style={{display:"flex",gap:8,marginBottom:4,fontSize:11}}>
                    <span style={{width:18,height:18,borderRadius:9,background:"#1E0E05",color:"#C8953A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>{idx+1}</span>
                    <span style={{color:"#3D2B1A",lineHeight:1.4}}>{step}</span>
                  </div>;
                })}
                {r.notes && <div style={{background:"#FEF3C7",borderRadius:8,padding:"8px 10px",marginTop:10,fontSize:10,color:"#92400E"}}>💡 {r.notes}</div>}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ─── DELIVERY CARD (canvas isole) ───────────────────────────── */
function DeliveryCard(props) {
  var order   = props.order;
  var updOrder= props.updOrder;

  const [open,   setOpen]   = useState(false);
  const [signed, setSigned] = useState(false);
  const [photo,  setPhoto]  = useState(false);
  const canvasRef = useRef(null);
  const drawing   = useRef(false);

  function getXY(e) {
    var c = canvasRef.current;
    if (!c) return {x:0,y:0};
    var r = c.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return {x: src.clientX - r.left, y: src.clientY - r.top};
  }
  function startDraw(e) {
    drawing.current = true;
    var c = canvasRef.current; if (!c) return;
    var xy = getXY(e);
    var ctx = c.getContext("2d");
    ctx.beginPath(); ctx.moveTo(xy.x, xy.y);
  }
  function drawOn(e) {
    if (!drawing.current) return;
    var c = canvasRef.current; if (!c) return;
    var xy = getXY(e);
    var ctx = c.getContext("2d");
    ctx.lineTo(xy.x, xy.y);
    ctx.strokeStyle = "#1E0E05"; ctx.lineWidth = 2.5; ctx.stroke();
    setSigned(true);
  }
  function stopDraw() { drawing.current = false; }
  function clearSig() {
    var c = canvasRef.current; if (!c) return;
    c.getContext("2d").clearRect(0,0,c.width,c.height);
    setSigned(false);
  }
  function validate() {
    if (!signed) return;
    updOrder(order.id, {status:"livre", dMethod:"livreur", signedAt:hm(), hasPhoto:photo});
  }

  var o = order;
  return (
    <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 13px rgba(0,0,0,.07)"}}>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontSize:13,fontWeight:700,color:"#1E0E05"}}>{o.id}</span>
              {o.priority==="urgent" && <span style={{background:"#FEE2E2",color:"#DC2626",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:16}}>URGENT</span>}
            </div>
            <div style={{fontSize:12,color:"#5C4A32",fontWeight:600,marginBottom:1}}>{o.client}</div>
            <div style={{fontSize:11,color:"#8B7355"}}>📍 {o.dest||o.store}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:16,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
            <div style={{fontSize:10,color:"#8B7355"}}>{o.time}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
          {o.items.map(function(it,j){ return <span key={j} style={{background:"#F7F3EE",color:"#5C4A32",fontSize:10,padding:"3px 8px",borderRadius:16}}>{it.qty}x {it.name}</span>; })}
        </div>
        {!open ? (
          <button className="bg" onClick={function(){ setOpen(true); }}
            style={{width:"100%",padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#7C3AED,#5B21B6)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            🚐 Confirmer la livraison
          </button>
        ) : (
          <div style={{background:"#F7F3EE",borderRadius:10,padding:12}}>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#5C4A32",fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:.9}}>✍️ Signature</div>
              <canvas ref={canvasRef} width={500} height={100}
                onMouseDown={startDraw} onMouseMove={drawOn} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={drawOn} onTouchEnd={stopDraw}
                style={{width:"100%",height:85,background:"#fff",border:"2px dashed #D5C4B0",borderRadius:7,cursor:"crosshair",display:"block",touchAction:"none"}} />
              <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
                <span style={{fontSize:10,color:signed?"#065F46":"#8B7355",fontWeight:signed?600:400}}>{signed?"✅ OK":"Signez ci-dessus"}</span>
                <button onClick={clearSig} style={{fontSize:10,color:"#EF4444",background:"none",border:"none",cursor:"pointer"}}>Effacer</button>
              </div>
            </div>
            <div onClick={function(){ setPhoto(function(v){ return !v; }); }}
              style={{height:58,borderRadius:7,border:"2px dashed #D5C4B0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
                      background:photo?"#D1FAE5":"#fff",color:photo?"#065F46":"#8B7355",fontSize:12,fontWeight:500,transition:"all .18s",marginBottom:10}}>
              {photo ? "✅ Photo prise !" : "📱 Prendre une photo"}
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={function(){ setOpen(false); setSigned(false); setPhoto(false); clearSig(); }}
                style={{flex:1,padding:"8px",borderRadius:7,border:"1px solid #D5C4B0",background:"#fff",color:"#5C4A32",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Annuler</button>
              <button disabled={!signed} onClick={validate}
                style={{flex:2,padding:"8px",borderRadius:7,border:"none",
                        background:signed?"linear-gradient(135deg,#065F46,#047857)":"#D5C4B0",
                        color:"#fff",fontSize:12,fontWeight:600,cursor:signed?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",transition:"all .18s"}}>
                ✅ Valider la livraison
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── LIVREUR ─────────────────────────────────────────────────── */
function Livreur(props) {
  var orders   = props.orders;
  var updOrder = props.updOrder;
  const [tab,        setTab]        = useState("prete");
  const [myName,     setMyName]     = useState("");
  const [confirmed,  setConfirmed]  = useState(false);

  // Commandes prêtes assignées à ce chauffeur (ou toutes si non confirmé)
  var prete     = orders.filter(function(o){ return o.status==="prete" && o.dMethod==="livreur"; });
  var myPrete   = confirmed ? prete.filter(function(o){ return o.driver===myName; }) : [];
  var enRoute   = orders.filter(function(o){ return o.status==="livraison" && o.dMethod==="livreur" && (!confirmed || o.driver===myName); });
  var livrees   = orders.filter(function(o){ return o.status==="livre" && o.dMethod==="livreur" && (!confirmed || o.driver===myName); });

  // Écran identification chauffeur
  if (!confirmed) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F7F3EE"}}>
        <div style={{background:"#fff",borderRadius:20,padding:36,boxShadow:"0 8px 32px rgba(0,0,0,.1)",maxWidth:380,width:"100%",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>🚐</div>
          <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:24,color:"#1E0E05",margin:"0 0 6px"}}>Identification chauffeur</h2>
          <p style={{color:"#8B7355",fontSize:12,margin:"0 0 20px"}}>Sélectionnez votre nom pour voir vos livraisons assignées</p>
          <div style={{display:"grid",gap:8,marginBottom:20}}>
            {DRIVERS.filter(function(d){ return d!=="Non assigné"; }).map(function(d){
              var nb = prete.filter(function(o){ return o.driver===d; }).length;
              var active = myName===d;
              return (
                <div key={d} onClick={function(){ setMyName(d); }}
                  style={{padding:"12px 16px",borderRadius:12,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
                          border:"2px solid "+(active?"#C8953A":"#EDE0D0"),
                          background:active?"#FDF0D8":"#F7F3EE",transition:"all .14s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:active?"#C8953A":"#D5C4B0",
                                 display:"flex",alignItems:"center",justifyContent:"center",
                                 color:active?"#1E0E05":"#fff",fontWeight:700,fontSize:13}}>
                      {d.split(" ").map(function(n){ return n[0]; }).join("")}
                    </div>
                    <span style={{fontSize:13,fontWeight:active?700:500,color:active?"#92400E":"#1E0E05"}}>{d}</span>
                  </div>
                  {nb > 0 && (
                    <span style={{background:"#C8953A",color:"#1E0E05",fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:14}}>
                      {nb} colis
                    </span>
                  )}
                  {nb === 0 && <span style={{fontSize:10,color:"#8B7355"}}>Aucune livraison</span>}
                </div>
              );
            })}
          </div>
          <button disabled={!myName} onClick={function(){ setConfirmed(true); }}
            style={{width:"100%",padding:"12px",borderRadius:11,border:"none",
                    background:myName?"linear-gradient(135deg,#C8953A,#a07228)":"#D5C4B0",
                    color:myName?"#1E0E05":"#8B7355",fontSize:13,fontWeight:700,
                    cursor:myName?"pointer":"not-allowed",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
            {myName ? "🚐 Commencer ma tournée — " + myName : "Sélectionnez votre nom"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:20,minHeight:"100vh"}}>
      {/* En-tête chauffeur */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:2}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"#1E0E05",display:"flex",alignItems:"center",justifyContent:"center",color:"#C8953A",fontWeight:700,fontSize:14}}>
              {myName.split(" ").map(function(n){ return n[0]; }).join("")}
            </div>
            <div>
              <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:22,color:"#1E0E05",margin:0}}>Bonjour, {myName.split(" ")[0]} 👋</h2>
              <p style={{color:"#8B7355",fontSize:11,margin:0}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</p>
            </div>
          </div>
        </div>
        <button onClick={function(){ setConfirmed(false); setMyName(""); setTab("prete"); }}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid #EDE0D0",background:"#F7F3EE",color:"#8B7355",fontSize:10,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
          ← Changer
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {[
          {l:"Colis prêts",   v:myPrete.length,  c:"#7C3AED", bg:"#F3E8FF", icon:"📦"},
          {l:"En route",      v:enRoute.length,   c:"#C8953A", bg:"#FEF3C7", icon:"🚐"},
          {l:"Livrés",        v:livrees.length,   c:"#10B981", bg:"#D1FAE5", icon:"✅"},
        ].map(function(s){
          return (
            <div key={s.l} style={{background:s.bg,borderRadius:11,padding:"13px 14px"}}>
              <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"'Outfit',sans-serif"}}>{s.v}</div>
              <div style={{fontSize:9,color:s.c,fontWeight:600,textTransform:"uppercase",letterSpacing:.8}}>{s.l}</div>
            </div>
          );
        })}
      </div>

      {/* Onglets */}
      <div style={{display:"flex",gap:0,background:"#fff",borderRadius:10,padding:3,marginBottom:16,width:"fit-content",boxShadow:"0 1px 5px rgba(0,0,0,.06)"}}>
        {[
          ["prete",   "📦 Prêts ("+myPrete.length+")"],
          ["enroute", "🚐 En route ("+enRoute.length+")"],
          ["livrees", "✅ Livrés ("+livrees.length+")"],
        ].map(function(item){
          return (
            <button key={item[0]} onClick={function(){ setTab(item[0]); }}
              style={{padding:"6px 13px",borderRadius:8,border:"none",background:tab===item[0]?"#1E0E05":"transparent",
                      color:tab===item[0]?"#FDF8F0":"#8B7355",fontSize:11,fontWeight:tab===item[0]?600:400,
                      cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .16s"}}>{item[1]}</button>
          );
        })}
      </div>

      {/* PRÊTS À CHARGER */}
      {tab==="prete" && (
        <div style={{display:"grid",gap:12,maxWidth:560}}>
          {myPrete.length===0 && (
            <div style={{textAlign:"center",padding:"40px",color:"#8B7355",background:"#fff",borderRadius:14}}>
              <div style={{fontSize:36,marginBottom:8}}>📭</div>
              <div style={{fontSize:14,color:"#1E0E05",fontFamily:"'Outfit',sans-serif"}}>Aucun colis assigné</div>
              <div style={{fontSize:11,marginTop:4}}>Les commandes apparaissent ici quand elles sont prêtes et assignées à vous</div>
            </div>
          )}
          {myPrete.map(function(o,i){
            return (
              <div key={o.id} style={{background:"#fff",borderRadius:14,padding:16,boxShadow:"0 3px 14px rgba(0,0,0,.08)",
                                       border:"2px solid #FCD34D",animation:"slideIn .22s "+(i*.08)+"s both"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:"#1E0E05",marginBottom:2}}>
                      {o.id} · {o.client}
                    </div>
                    <div style={{fontSize:11,color:"#8B7355"}}>📍 {o.dest || o.store}</div>
                    {o.note && <div style={{fontSize:10,color:"#92400E",background:"#FEF3C7",padding:"2px 7px",borderRadius:8,marginTop:4,display:"inline-block"}}>💬 {o.note}</div>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
                    <div style={{fontSize:9,color:"#7C3AED",fontWeight:700,background:"#F3E8FF",padding:"2px 7px",borderRadius:8,marginTop:2}}>
                      🚐 {o.driver}
                    </div>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  {o.items.map(function(it){ return (
                    <span key={it.id} style={{display:"inline-block",margin:"2px 4px 2px 0",padding:"2px 8px",background:"#F7F3EE",borderRadius:12,fontSize:10,color:"#5C4A32"}}>
                      {it.qty}× {it.name}
                    </span>
                  ); })}
                </div>
                <button onClick={function(){ updOrder(o.id,{status:"livraison"}); }}
                  style={{width:"100%",padding:"10px",borderRadius:10,border:"none",
                          background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",
                          fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                  📦 → 🚐 Chargé dans le camion
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* EN ROUTE */}
      {tab==="enroute" && (
        <div style={{display:"grid",gap:12,maxWidth:560}}>
          {enRoute.map(function(o,i){
            return (
              <div key={o.id} style={{animation:"slideIn .26s "+(i*.1)+"s both"}}>
                <DeliveryCard order={o} updOrder={updOrder} />
              </div>
            );
          })}
          {enRoute.length===0 && (
            <div style={{textAlign:"center",padding:"40px",color:"#8B7355",background:"#fff",borderRadius:14}}>
              <div style={{fontSize:36,marginBottom:8}}>🛣️</div>
              <div style={{fontSize:14,color:"#1E0E05",fontFamily:"'Outfit',sans-serif"}}>Aucune livraison en cours</div>
            </div>
          )}
        </div>
      )}

      {/* LIVRÉES */}
      {tab==="livrees" && (
        <div style={{display:"grid",gap:8,maxWidth:560}}>
          {livrees.map(function(o){
            return (
              <div key={o.id} style={{background:"#fff",borderRadius:12,padding:"13px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.05)",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#D1FAE5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>✅</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:"#1E0E05",fontSize:12,marginBottom:1}}>{o.id} · {o.client}</div>
                  <div style={{fontSize:10,color:"#8B7355"}}>📍 {o.dest||o.store} {o.signedAt ? "· "+o.signedAt : ""}</div>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"#C8953A",fontFamily:"'Outfit',sans-serif"}}>CHF {o.total.toFixed(2)}</div>
              </div>
            );
          })}
          {livrees.length===0 && <div style={{textAlign:"center",padding:"35px",color:"#8B7355",fontSize:12}}>Aucune livraison terminée</div>}
        </div>
      )}
    </div>
  );
}

/* ─── ADMIN ───────────────────────────────────────────────────── */
function Admin(props) {
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
            {[["dashboard","📊 Vue générale"],["commandes","📋 Commandes"],["catalogue","📦 Catalogue"],["planning","🏭 Planning"],["gestion","⚙️ Gestion"],["utilisateurs","👥 Utilisateurs"],["supervision","📈 Supervision"],["cartes","🎁 Cartes"],["abonnements","🔄 Abonnements"],["reporting","📊 Rapport"]]
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
                              <span style={{fontSize:9,fontWeight:700,color:"#fff",background:margeBg,padding:"1px 5px",borderRadius:8,color:margeColor}}>{margePct}%</span>
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

      </div>
    </div>
  );
}

/* ─── PRICE ANALYSIS MODAL ────────────────────────────────────── */
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
