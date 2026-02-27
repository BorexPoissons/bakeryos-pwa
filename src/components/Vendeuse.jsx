import React, { useState, useRef, useEffect } from "react";
import { PRODUCTS, STORES, CATS, SM, DRIVERS } from "../constants.js";
import { hm, computeTVA, generateGiftCode, qrUrl } from "../utils.js";
import PayModal from "./PayModal.jsx";
import ReceiptModal from "./ReceiptModal.jsx";
import ClientDisplay from "./ClientDisplay.jsx";
import EditModal from "./EditModal.jsx";
import { FloorPlanView, TableCart } from "./FloorPlan.jsx";
import CaisseModal from "./CaisseModal.jsx";
import RefundModal from "./RefundModal.jsx";
import ClientSearch from "./ClientSearch.jsx";
import WasteModal from "./WasteModal.jsx";

export default function Vendeuse(props) {
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
  var printer     = props.printer     || {};
  var nextTicketNumber = props.nextTicketNumber || function(){ return "T-" + Date.now(); };
  var clients     = props.clients     || [];
  var addClient   = props.addClient   || function(){};
  var updateClient= props.updateClient|| function(){};
  var registerState   = props.registerState;
  var setRegisterState= props.setRegisterState || function(){};
  var refunds     = props.refunds     || [];
  var addRefund   = props.addRefund   || function(){};
  var waste       = props.waste       || [];
  var addWaste    = props.addWaste    || function(){};
  var tvaNumber   = props.tvaNumber   || "";

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
  const [showCaisse,     setShowCaisse]     = useState(null); // "open" | "close" | null
  const [showRefund,     setShowRefund]     = useState(null); // sale object to refund
  const [showWaste,      setShowWaste]      = useState(false);
  const [selectedClient, setSelectedClient] = useState(null); // client object sélectionné

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
    // Stock blocage : vérifier si stock > 0 (si stock géré)
    var catItem = catalogue.find(function(c){ return c.id === p.id; });
    if (catItem && catItem.stock !== undefined && catItem.stock !== null && catItem.stock > 0) {
      var inCart = cart.find(function(i){ return i.id === p.id; });
      var qtyInCart = inCart ? inCart.qty : 0;
      if (qtyInCart >= catItem.stock) {
        setCartErr(p.name + " — stock insuffisant (" + catItem.stock + " dispo)");
        return;
      }
    }
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
  function clearCart() { setCart([]); setClient(""); setNote(""); setActiveTable(null); setDeliveryAddr(""); setDeliveryDriver(""); setSelectedClient(null); }

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
    var ticketNum = nextTicketNumber();
    var sale = {
      id:      ticketNum,
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
    // Mettre à jour le client si sélectionné
    if (selectedClient) {
      updateClient(selectedClient.id, {
        totalOrders: (selectedClient.totalOrders || 0) + 1,
        totalSpent:  Math.round(((selectedClient.totalSpent || 0) + total) * 100) / 100,
        lastVisit:   new Date().toLocaleDateString("fr-CH"),
      });
    }
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
    // Auto-print ticket after payment
    printTicket(sale.items, sale);
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

  // ── Imprimer ticket (ESC/POS ou HTML fallback) ──
  function printTicket(itemsOrTicket, saleData) {
    var items = itemsOrTicket.cart || itemsOrTicket;
    var ticketClient = itemsOrTicket.client || client || "Client";
    var ticketTotal = items.reduce(function(s,i){ return s+i.price*i.qty; },0);
    var tv = computeTVA(items);
    var receipt = {
      tenant:        tenant,
      storeAddress:  myStore,
      ticketNumber:  (saleData && saleData.id) || ("T-" + Date.now()),
      time:          hm(),
      seller:        userName,
      client:        ticketClient,
      mode:          (saleData && saleData.mode) || null,
      table:         activeTable ? ("Table " + activeTable) : null,
      items:         items.map(function(i){ return {id:i.id,name:i.name,qty:i.qty,price:i.price,emoji:i.emoji,tva:i.tva||2.6}; }),
      total:         ticketTotal,
      tvaInfo:       tv,
      payInfo:       (saleData && saleData.payInfo) || null,
      note:          (saleData && saleData.note) || note || "",
      tvaNumber:     tvaNumber || "",
    };
    if (printer && printer.printReceipt) {
      printer.printReceipt(receipt).catch(function(err){ console.warn("Print:", err); });
    }
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
              <ClientSearch value={client} onChange={setClient} clients={clients}
                onSelect={function(c){ setClient(c.name); setSelectedClient(c); }}
                onAddNew={function(name){ var c={id:Date.now(),name:name,phone:"",email:"",notes:"",totalOrders:0,totalSpent:0,lastVisit:new Date().toLocaleDateString("fr-CH")}; addClient(c); setSelectedClient(c); }}
                placeholder="Nom du client" />
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
      {showReceipt && <ReceiptModal sale={lastSale} tenant={tenant} tvaNumber={tvaNumber} onClose={function(){ setShowReceipt(false); }} />}
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
                  return (
                    <button key={v} onClick={function(){setGiftAmount(String(v));}}
                      style={{padding:"6px 12px",borderRadius:8,border:"1px solid "+(giftAmount==String(v)?"#C8953A":"#EDE0D0"),
                             background:giftAmount==String(v)?"#FDF0D8":"#fff",color:giftAmount==String(v)?"#92400E":"#5C4A32",
                             fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .12s"}}>
                      {v+" CHF"}
                    </button>
                  );
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
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {/* Caisse open/close */}
          {!registerState ? (
            <button onClick={function(){ setShowCaisse("open"); }}
              style={{padding:"5px 11px",borderRadius:18,border:"1px solid #10B981",
                      background:"rgba(16,185,129,.08)",color:"#065F46",
                      fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
              💰 Ouvrir caisse
            </button>
          ) : (
            <button onClick={function(){ setShowCaisse("close"); }}
              style={{padding:"5px 11px",borderRadius:18,border:"1px solid #EF4444",
                      background:"rgba(239,68,68,.08)",color:"#DC2626",
                      fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
              🔒 Fermer caisse
            </button>
          )}
          <button onClick={function(){ setShowWaste(true); }}
            title="Saisir des pertes"
            style={{padding:"5px 11px",borderRadius:18,border:"1px solid #EDE0D0",
                    background:"transparent",color:"#8B7355",
                    fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
            📉 Pertes
          </button>
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
                    <button onClick={function(){ setShowRefund(s); }}
                      title="Rembourser"
                      style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,.2)",
                              background:"rgba(239,68,68,.06)",color:"#DC2626",fontSize:10,cursor:"pointer",
                              fontFamily:"'Outfit',sans-serif",fontWeight:600,flexShrink:0}}>
                      ↩ Remb.
                    </button>
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
              <ClientSearch value={client} onChange={setClient} clients={clients}
                onSelect={function(c){ setClient(c.name); setSelectedClient(c); }}
                onAddNew={function(name){ var c={id:Date.now(),name:name,phone:"",email:"",notes:"",totalOrders:0,totalSpent:0,lastVisit:new Date().toLocaleDateString("fr-CH")}; addClient(c); setSelectedClient(c); }}
                placeholder={activeTable ? "Table "+activeTable.name : "👤 Client (optionnel)"} />
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
                return (
                  <div style={{marginBottom:10}}>
                    {tv.lines.map(function(l){
                      return (
                        <div key={l.rate} style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(253,248,240,.35)",marginBottom:1}}>
                          <span>TVA {l.rate}%</span>
                          <span>CHF {l.tva.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"rgba(253,248,240,.3)",borderTop:"1px dotted rgba(255,255,255,.1)",paddingTop:2,marginTop:2}}>
                      <span>HT</span>
                      <span>CHF {tv.totalHT.toFixed(2)}</span>
                    </div>
                  </div>
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

      {/* ── Modals caisse / remboursement / pertes ── */}
      {showCaisse && (
        <CaisseModal mode={showCaisse} storeName={myStore}
          expectedTotal={showCaisse === "close" ? todaySales.filter(function(s){ return s.payInfo && s.payInfo.method === "cash"; }).reduce(function(sum,s){ return sum + (s.payInfo.cashGiven || s.total); }, 0) : 0}
          onConfirm={function(data){
            if (showCaisse === "open") {
              setRegisterState({ openData: data, openTime: data.time, openDate: data.date });
            } else {
              // Générer Z-report data
              var zData = {
                id: "Z-" + Date.now(),
                date: data.date, closeTime: data.time,
                openTime: registerState ? registerState.openTime : "?",
                openAmount: registerState && registerState.openData ? registerState.openData.total : 0,
                closeAmount: data.total,
                diff: data.diff,
                totalSales: caJour,
                nbTransactions: nbTx,
                store: myStore, seller: userName,
              };
              // Print Z-report
              if (printer && printer.printZReport) {
                printer.printZReport(zData).catch(function(){});
              }
              setRegisterState(null);
            }
            setShowCaisse(null);
          }}
          onClose={function(){ setShowCaisse(null); }}
        />
      )}
      {showRefund && (
        <RefundModal sale={showRefund} printer={printer}
          onRefund={function(refundData){ addRefund(refundData); setShowRefund(null); }}
          onClose={function(){ setShowRefund(null); }} />
      )}
      {showWaste && (
        <WasteModal catalogue={catalogue} storeName={myStore} userName={userName}
          onSave={addWaste}
          onClose={function(){ setShowWaste(false); }} />
      )}
    </div>
  );
}
