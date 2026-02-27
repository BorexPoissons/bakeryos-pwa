/* BakeryOS — ESC/POS Printer Engine + Fallback + Hook */
import { useState, useEffect, useCallback } from "react";
import { hm } from "./utils.js";

var ESC=0x1B, GS=0x1D, LF=0x0A;
var ESCCMD={
  INIT:[ESC,0x40], LF:[LF], CUT:[GS,0x56,0x41,0x03],
  ALIGN_L:[ESC,0x61,0x00], ALIGN_C:[ESC,0x61,0x01], ALIGN_R:[ESC,0x61,0x02],
  BOLD_ON:[ESC,0x45,0x01], BOLD_OFF:[ESC,0x45,0x00],
  DBL_ON:[ESC,0x21,0x30],  DBL_OFF:[ESC,0x21,0x00],
  FONT_B:[ESC,0x4D,0x01],  FONT_A:[ESC,0x4D,0x00],
  DRAWER:[ESC,0x70,0x00,0x19,0xFA], BEEP:[ESC,0x42,0x03,0x02],
};
var PAPER={"80mm":{chars:48,name:"80mm"},"58mm":{chars:32,name:"58mm"}};

function textToBytes(str){
  var bytes=[],map={0xE0:0x85,0xE2:0x83,0xE7:0x87,0xE8:0x8A,0xE9:0x82,0xEA:0x88,
    0xEB:0x89,0xEE:0x8C,0xEF:0x8B,0xF4:0x93,0xF9:0x97,0xFB:0x96,0xFC:0x81,0xC9:0x90,0xC0:0xB7,0xC8:0xD4};
  for(var i=0;i<str.length;i++){var c=str.charCodeAt(i);bytes.push(c<128?c:(map[c]||0x3F));}
  return bytes;
}
function padLine(l,r,w){var s=w-l.length-r.length;return l+(" ".repeat(Math.max(1,s)))+r;}
function dashLine(w){return "-".repeat(w);}
function dblLine(w){return "=".repeat(w);}

var PrinterService={
  _port:null,_writer:null,_connected:false,_config:null,
  DEFAULT_CONFIG:{paperWidth:"80mm",baudRate:9600,autoCut:true,openDrawer:false,beepOnPrint:false,
    headerLines:[],footerLines:["Merci de votre visite !"],tvaNumber:"",copies:1,feedLines:3},
  loadConfig:function(){
    try{var s=localStorage.getItem("bakery_printer_config");
      this._config=Object.assign({},this.DEFAULT_CONFIG,s?JSON.parse(s):{});
    }catch(e){this._config=Object.assign({},this.DEFAULT_CONFIG);}
    return this._config;
  },
  saveConfig:function(c){
    this._config=Object.assign({},this.DEFAULT_CONFIG,c);
    try{localStorage.setItem("bakery_printer_config",JSON.stringify(this._config));}catch(e){}
    return this._config;
  },
  getConfig:function(){if(!this._config)this.loadConfig();return this._config;},
  isSupported:function(){return "serial" in navigator;},
  connect:async function(opts){
    if(!this.isSupported())throw new Error("Web Serial API non supportée. Utilisez Chrome ou Edge.");
    try{
      this._port=await navigator.serial.requestPort();
      var cfg=this.getConfig();
      await this._port.open({baudRate:(opts&&opts.baudRate)||cfg.baudRate||9600});
      this._writer=this._port.writable.getWriter();
      this._connected=true;
      await this._send(ESCCMD.INIT);
      await this._send([ESC,0x74,16]);
      return{success:true};
    }catch(err){
      this._connected=false;
      if(err.name==="NotFoundError")throw new Error("Aucune imprimante sélectionnée");
      throw new Error("Connexion échouée: "+err.message);
    }
  },
  disconnect:async function(){
    try{if(this._writer){await this._writer.close();this._writer=null;}
      if(this._port){await this._port.close();this._port=null;}}catch(e){}
    this._connected=false;
  },
  isConnected:function(){return this._connected&&this._port!==null;},
  _send:async function(d){if(!this._writer)throw new Error("Non connectée");await this._writer.write(d instanceof Uint8Array?d:new Uint8Array(d));},
  _text:async function(s){var b=textToBytes(s);b.push(LF);await this._send(b);},
  openDrawer:async function(){if(this.isConnected())await this._send(ESCCMD.DRAWER);},

  printTest:async function(){
    var c=this.getConfig(),w=PAPER[c.paperWidth].chars;
    await this._send(ESCCMD.INIT);await this._send([ESC,0x74,16]);
    await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.DBL_ON);await this._text("TEST IMPRIMANTE");await this._send(ESCCMD.DBL_OFF);
    await this._send(ESCCMD.ALIGN_L);await this._text(dashLine(w));
    await this._text("BakeryOS ESC/POS v3.8");await this._text("Largeur: "+c.paperWidth+" ("+w+" car.)");
    await this._text("Accents: éèàùçôî");await this._text(dashLine(w));
    await this._send(ESCCMD.ALIGN_C);await this._text(new Date().toLocaleString("fr-CH"));await this._text("OK !");
    await this._send(ESCCMD.ALIGN_L);
    for(var i=0;i<(c.feedLines||3);i++)await this._send(ESCCMD.LF);
    if(c.autoCut)await this._send(ESCCMD.CUT);
    return{success:true};
  },

  printReceipt:async function(r){
    var c=this.getConfig(),w=PAPER[c.paperWidth].chars;
    for(var copy=0;copy<(c.copies||1);copy++){
      await this._send(ESCCMD.INIT);await this._send([ESC,0x74,16]);
      await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.DBL_ON);
      await this._text(r.tenant||"BakeryOS");await this._send(ESCCMD.DBL_OFF);
      if(r.storeAddress)await this._text(r.storeAddress);
      if(c.tvaNumber){await this._send(ESCCMD.FONT_B);await this._text(c.tvaNumber);await this._send(ESCCMD.FONT_A);}
      if(c.headerLines)for(var h=0;h<c.headerLines.length;h++)await this._text(c.headerLines[h]);
      await this._send(ESCCMD.ALIGN_L);await this._text(dblLine(w));
      await this._text(padLine("Ticket: "+(r.ticketNumber||"---"),r.time||"",w));
      if(r.seller)await this._text("Vendeur: "+r.seller);
      if(r.client&&r.client!=="Client")await this._text("Client: "+r.client);
      var ml={surplace:"Sur place",emporter:"A emporter",livraison:"Livraison"};
      if(r.mode)await this._text("Mode: "+(ml[r.mode]||r.mode));
      if(r.table)await this._text("Table: "+r.table);
      await this._text(dashLine(w));
      for(var i=0;i<r.items.length;i++){
        var it=r.items[i],lt=(it.price*it.qty).toFixed(2),il=it.qty+"x "+it.name,pp="CHF "+lt;
        if(il.length+pp.length+1>w){await this._text(il);await this._send(ESCCMD.ALIGN_R);await this._text(pp);await this._send(ESCCMD.ALIGN_L);}
        else await this._text(padLine(il,pp,w));
        if(it.qty>1){await this._send(ESCCMD.FONT_B);await this._text("   @ CHF "+it.price.toFixed(2));await this._send(ESCCMD.FONT_A);}
      }
      await this._text(dashLine(w));
      if(r.tvaInfo&&r.tvaInfo.lines){
        await this._send(ESCCMD.FONT_B);
        for(var t=0;t<r.tvaInfo.lines.length;t++){var tl=r.tvaInfo.lines[t];await this._text(padLine("TVA "+tl.rate+"% (HT "+tl.ht.toFixed(2)+")","CHF "+tl.tva.toFixed(2),w));}
        await this._text(padLine("Total HT","CHF "+r.tvaInfo.totalHT.toFixed(2),w));
        await this._send(ESCCMD.FONT_A);await this._text(dashLine(w));
      }
      await this._send(ESCCMD.BOLD_ON);await this._send(ESCCMD.DBL_ON);await this._send(ESCCMD.ALIGN_R);
      await this._text("CHF "+r.total.toFixed(2));
      await this._send(ESCCMD.DBL_OFF);await this._send(ESCCMD.BOLD_OFF);await this._send(ESCCMD.ALIGN_L);
      await this._text(dashLine(w));
      if(r.payInfo){
        var pl={card:"Carte bancaire",cash:"Especes",mixed:"Paiement mixte",giftcard:"Carte cadeau"};
        await this._text("Paiement: "+(pl[r.payInfo.method]||r.payInfo.method));
        if(r.payInfo.given)await this._text(padLine("Recu","CHF "+r.payInfo.given.toFixed(2),w));
        if(r.payInfo.change>0){await this._send(ESCCMD.BOLD_ON);await this._text(padLine("Rendu","CHF "+r.payInfo.change.toFixed(2),w));await this._send(ESCCMD.BOLD_OFF);}
      }
      if(r.note){await this._text(dashLine(w));await this._send(ESCCMD.FONT_B);await this._text("Note: "+r.note);await this._send(ESCCMD.FONT_A);}
      await this._text(dashLine(w));await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.FONT_B);
      if(c.footerLines)for(var f=0;f<c.footerLines.length;f++)await this._text(c.footerLines[f]);
      await this._text(new Date().toLocaleString("fr-CH"));
      await this._send(ESCCMD.FONT_A);await this._send(ESCCMD.ALIGN_L);
      for(var fl=0;fl<(c.feedLines||3);fl++)await this._send(ESCCMD.LF);
      if(c.autoCut)await this._send(ESCCMD.CUT);
      if(c.beepOnPrint)await this._send(ESCCMD.BEEP);
      if(c.openDrawer&&r.payInfo&&r.payInfo.method==="cash")await this._send(ESCCMD.DRAWER);
    }
    return{success:true};
  },

  printZReport:async function(rp){
    var c=this.getConfig(),w=PAPER[c.paperWidth].chars;
    await this._send(ESCCMD.INIT);await this._send([ESC,0x74,16]);
    await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.DBL_ON);await this._text("RAPPORT Z");await this._send(ESCCMD.DBL_OFF);
    await this._text(rp.tenant||"BakeryOS");if(rp.store)await this._text(rp.store);
    await this._send(ESCCMD.ALIGN_L);await this._text(dblLine(w));
    await this._text(padLine("Date",rp.date||new Date().toLocaleDateString("fr-CH"),w));
    await this._text(padLine("Ouverture",rp.openTime||"---",w));
    await this._text(padLine("Fermeture",rp.closeTime||"",w));
    if(rp.seller)await this._text(padLine("Caissier",rp.seller,w));
    await this._text(dashLine(w));
    await this._send(ESCCMD.BOLD_ON);await this._text("VENTES");await this._send(ESCCMD.BOLD_OFF);
    await this._text(padLine("Tickets",String(rp.ticketCount||0),w));
    await this._text(padLine("Ticket moyen","CHF "+(rp.avgTicket||0).toFixed(2),w));
    await this._send(ESCCMD.BOLD_ON);await this._text(padLine("TOTAL CA TTC","CHF "+(rp.totalCA||0).toFixed(2),w));await this._send(ESCCMD.BOLD_OFF);
    await this._text(dashLine(w));
    if(rp.payments){
      await this._send(ESCCMD.BOLD_ON);await this._text("PAIEMENTS");await this._send(ESCCMD.BOLD_OFF);
      var pl={card:"Carte",cash:"Especes",giftcard:"Carte cadeau",mixed:"Mixte"};
      Object.keys(rp.payments).forEach(function(k){/* sync for ESC: we queue */});
      // Use for loop for async
      var pk=Object.keys(rp.payments);
      for(var pi=0;pi<pk.length;pi++)await this._text(padLine("  "+({"card":"Carte","cash":"Especes","giftcard":"Carte cadeau","mixed":"Mixte"}[pk[pi]]||pk[pi]),"CHF "+rp.payments[pk[pi]].toFixed(2),w));
      await this._text(dashLine(w));
    }
    if(rp.tva){
      await this._send(ESCCMD.BOLD_ON);await this._text("TVA");await this._send(ESCCMD.BOLD_OFF);
      for(var ti=0;ti<rp.tva.length;ti++)await this._text(padLine("  TVA "+rp.tva[ti].rate+"%","CHF "+rp.tva[ti].amount.toFixed(2),w));
      if(rp.totalHT!==undefined)await this._text(padLine("  Total HT","CHF "+rp.totalHT.toFixed(2),w));
      await this._text(dashLine(w));
    }
    if(rp.cashCount){
      await this._send(ESCCMD.BOLD_ON);await this._text("CAISSE");await this._send(ESCCMD.BOLD_OFF);
      await this._text(padLine("Fond","CHF "+(rp.cashCount.openAmount||0).toFixed(2),w));
      await this._text(padLine("Especes","CHF "+(rp.cashCount.cashSales||0).toFixed(2),w));
      await this._text(padLine("Theorique","CHF "+(rp.cashCount.expected||0).toFixed(2),w));
      await this._text(padLine("Compte","CHF "+(rp.cashCount.counted||0).toFixed(2),w));
      var diff=(rp.cashCount.counted||0)-(rp.cashCount.expected||0);
      await this._send(ESCCMD.BOLD_ON);await this._text(padLine("Ecart",(diff>=0?"+":"")+"CHF "+diff.toFixed(2),w));await this._send(ESCCMD.BOLD_OFF);
    }
    if(c.tvaNumber){await this._text(dashLine(w));await this._send(ESCCMD.FONT_B);await this._send(ESCCMD.ALIGN_C);await this._text(c.tvaNumber);await this._send(ESCCMD.ALIGN_L);await this._send(ESCCMD.FONT_A);}
    await this._text(dblLine(w));await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.FONT_B);
    await this._text("Imprime le "+new Date().toLocaleString("fr-CH"));
    await this._send(ESCCMD.FONT_A);await this._send(ESCCMD.ALIGN_L);
    for(var i=0;i<(c.feedLines||3);i++)await this._send(ESCCMD.LF);
    if(c.autoCut)await this._send(ESCCMD.CUT);
    return{success:true};
  },

  printKitchenOrder:async function(o){
    var c=this.getConfig(),w=PAPER[c.paperWidth].chars;
    await this._send(ESCCMD.INIT);await this._send([ESC,0x74,16]);
    await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.DBL_ON);await this._text("BON PRODUCTION");await this._send(ESCCMD.DBL_OFF);
    await this._send(ESCCMD.ALIGN_L);await this._text(dblLine(w));
    await this._send(ESCCMD.BOLD_ON);await this._text(padLine(o.id||"---",o.time||"",w));await this._send(ESCCMD.BOLD_OFF);
    if(o.client)await this._text("Client: "+o.client);
    if(o.store)await this._text("Magasin: "+o.store);
    if(o.priority==="urgent"){await this._send(ESCCMD.DBL_ON);await this._send(ESCCMD.ALIGN_C);await this._text("*** URGENT ***");await this._send(ESCCMD.DBL_OFF);await this._send(ESCCMD.ALIGN_L);}
    await this._text(dashLine(w));
    for(var i=0;i<o.items.length;i++){await this._send(ESCCMD.BOLD_ON);await this._send(ESCCMD.DBL_ON);await this._text(o.items[i].qty+"x "+o.items[i].name);await this._send(ESCCMD.DBL_OFF);await this._send(ESCCMD.BOLD_OFF);}
    if(o.note){await this._text(dashLine(w));await this._send(ESCCMD.BOLD_ON);await this._text("NOTE: "+o.note);await this._send(ESCCMD.BOLD_OFF);}
    if(o.dMethod==="livreur"){await this._text(dashLine(w));await this._text("LIVRAISON");if(o.dest)await this._text("Adresse: "+o.dest);if(o.driver)await this._text("Chauffeur: "+o.driver);}
    await this._text(dblLine(w));await this._send(ESCCMD.ALIGN_C);await this._send(ESCCMD.FONT_B);
    await this._text(new Date().toLocaleString("fr-CH"));await this._send(ESCCMD.FONT_A);await this._send(ESCCMD.ALIGN_L);
    for(var fl=0;fl<(c.feedLines||3);fl++)await this._send(ESCCMD.LF);
    if(c.autoCut)await this._send(ESCCMD.CUT);
    if(c.beepOnPrint)await this._send(ESCCMD.BEEP);
    return{success:true};
  },
};

/* ── HTML Fallback Printer ────────────────────────────────────── */
var FallbackPrinter={
  _receiptHTML:function(r,c){
    var tv=c&&c.tvaNumber||"",fl=c&&c.footerLines||["Merci de votre visite !"];
    var h='<!DOCTYPE html><html><head><meta charset="utf-8"><style>'+
      '@page{margin:0;size:80mm auto}body{font-family:"Courier New",monospace;font-size:12px;padding:6px;max-width:72mm;margin:0 auto;color:#000}'+
      '.c{text-align:center}.r{text-align:right}.b{font-weight:bold}.big{font-size:18px}'+
      '.line{display:flex;justify-content:space-between;margin:1px 0}.sep{border-top:1px dashed #000;margin:5px 0}'+
      '.dsep{border-top:2px solid #000;margin:5px 0}.sm{font-size:9px;color:#444}</style></head><body>';
    h+='<div class="c b big">'+(r.tenant||"BakeryOS")+'</div>';
    if(r.storeAddress)h+='<div class="c sm">'+r.storeAddress+'</div>';
    if(tv)h+='<div class="c sm">'+tv+'</div>';
    if(c&&c.headerLines)c.headerLines.forEach(function(l){h+='<div class="c sm">'+l+'</div>';});
    h+='<div class="dsep"></div>';
    h+='<div class="line"><span>Ticket: '+(r.ticketNumber||"---")+'</span><span>'+(r.time||"")+'</span></div>';
    if(r.seller)h+='<div>Vendeur: '+r.seller+'</div>';
    if(r.client&&r.client!=="Client")h+='<div>Client: '+r.client+'</div>';
    if(r.mode){var ml={surplace:"Sur place",emporter:"\u00c0 emporter",livraison:"Livraison"};h+='<div>Mode: '+(ml[r.mode]||r.mode)+'</div>';}
    if(r.table)h+='<div>Table: '+r.table+'</div>';
    h+='<div class="sep"></div>';
    (r.items||[]).forEach(function(it){
      h+='<div class="line"><span>'+it.qty+'\u00d7 '+it.name+'</span><span>CHF '+(it.price*it.qty).toFixed(2)+'</span></div>';
      if(it.qty>1)h+='<div class="sm">&nbsp;&nbsp;&nbsp;@ CHF '+it.price.toFixed(2)+'</div>';
    });
    h+='<div class="sep"></div>';
    if(r.tvaInfo&&r.tvaInfo.lines){
      r.tvaInfo.lines.forEach(function(l){h+='<div class="line sm"><span>TVA '+l.rate+'% (HT '+l.ht.toFixed(2)+')</span><span>CHF '+l.tva.toFixed(2)+'</span></div>';});
      h+='<div class="line sm"><span>Total HT</span><span>CHF '+r.tvaInfo.totalHT.toFixed(2)+'</span></div><div class="sep"></div>';
    }
    h+='<div class="line b big"><span>TOTAL TTC</span><span>CHF '+r.total.toFixed(2)+'</span></div><div class="sep"></div>';
    if(r.payInfo){
      var pl={card:"Carte bancaire",cash:"Esp\u00e8ces",mixed:"Paiement mixte",giftcard:"Carte cadeau"};
      h+='<div>Paiement: '+(pl[r.payInfo.method]||r.payInfo.method)+'</div>';
      if(r.payInfo.given)h+='<div class="line"><span>Re\u00e7u</span><span>CHF '+r.payInfo.given.toFixed(2)+'</span></div>';
      if(r.payInfo.change>0)h+='<div class="line b"><span>Rendu</span><span>CHF '+r.payInfo.change.toFixed(2)+'</span></div>';
    }
    if(r.note)h+='<div class="sep"></div><div class="sm">Note: '+r.note+'</div>';
    h+='<div class="sep"></div><div class="c sm">'+fl.join('<br>')+'</div>';
    h+='<div class="c sm">'+new Date().toLocaleString("fr-CH")+'</div></body></html>';
    return h;
  },
  printReceipt:function(r,c){
    var w=window.open("","_blank","width=320,height=700");
    if(!w)return{success:false,error:"popup_blocked"};
    w.document.write(this._receiptHTML(r,c));w.document.close();
    setTimeout(function(){w.print();},400);return{success:true,fallback:true};
  },
  printZReport:function(rp,c){
    var tv=c&&c.tvaNumber||"";
    var h='<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{margin:0;size:80mm auto}body{font-family:"Courier New",monospace;font-size:11px;padding:6px;max-width:72mm;margin:0 auto}.c{text-align:center}.b{font-weight:bold}.big{font-size:16px}.line{display:flex;justify-content:space-between;margin:1px 0}.sep{border-top:1px dashed #000;margin:5px 0}.dsep{border-top:2px solid #000;margin:5px 0}.sm{font-size:9px;color:#444}</style></head><body>';
    h+='<div class="c b big">RAPPORT Z</div><div class="c b">'+(rp.tenant||"BakeryOS")+'</div>';
    if(rp.store)h+='<div class="c">'+rp.store+'</div>';
    h+='<div class="dsep"></div>';
    h+='<div class="line"><span>Date</span><span>'+(rp.date||new Date().toLocaleDateString("fr-CH"))+'</span></div>';
    h+='<div class="line"><span>Ouverture</span><span>'+(rp.openTime||"---")+'</span></div>';
    h+='<div class="line"><span>Fermeture</span><span>'+(rp.closeTime||"---")+'</span></div>';
    if(rp.seller)h+='<div class="line"><span>Caissier</span><span>'+rp.seller+'</span></div>';
    h+='<div class="sep"></div><div class="b">VENTES</div>';
    h+='<div class="line"><span>Tickets</span><span>'+(rp.ticketCount||0)+'</span></div>';
    h+='<div class="line"><span>Ticket moyen</span><span>CHF '+(rp.avgTicket||0).toFixed(2)+'</span></div>';
    h+='<div class="line b big"><span>TOTAL CA TTC</span><span>CHF '+(rp.totalCA||0).toFixed(2)+'</span></div><div class="sep"></div>';
    if(rp.payments){h+='<div class="b">PAIEMENTS</div>';var pl2={card:"Carte",cash:"Esp\u00e8ces",giftcard:"Carte cadeau",mixed:"Mixte"};
      Object.keys(rp.payments).forEach(function(k){h+='<div class="line"><span>&nbsp;&nbsp;'+(pl2[k]||k)+'</span><span>CHF '+rp.payments[k].toFixed(2)+'</span></div>';});h+='<div class="sep"></div>';}
    if(rp.tva){h+='<div class="b">TVA</div>';rp.tva.forEach(function(t){h+='<div class="line"><span>&nbsp;&nbsp;TVA '+t.rate+'%</span><span>CHF '+t.amount.toFixed(2)+'</span></div>';});
      if(rp.totalHT!==undefined)h+='<div class="line"><span>&nbsp;&nbsp;Total HT</span><span>CHF '+rp.totalHT.toFixed(2)+'</span></div>';h+='<div class="sep"></div>';}
    if(rp.cashCount){h+='<div class="b">CAISSE</div>';
      h+='<div class="line"><span>Fond</span><span>CHF '+(rp.cashCount.openAmount||0).toFixed(2)+'</span></div>';
      h+='<div class="line"><span>Especes</span><span>CHF '+(rp.cashCount.cashSales||0).toFixed(2)+'</span></div>';
      h+='<div class="line"><span>Theorique</span><span>CHF '+(rp.cashCount.expected||0).toFixed(2)+'</span></div>';
      h+='<div class="line"><span>Compte</span><span>CHF '+(rp.cashCount.counted||0).toFixed(2)+'</span></div>';
      var diff2=(rp.cashCount.counted||0)-(rp.cashCount.expected||0);
      h+='<div class="line b"><span>Ecart</span><span>'+(diff2>=0?"+":"")+'CHF '+diff2.toFixed(2)+'</span></div>';}
    if(tv)h+='<div class="sep"></div><div class="c sm">'+tv+'</div>';
    h+='<div class="dsep"></div><div class="c sm">Imprime le '+new Date().toLocaleString("fr-CH")+'</div></body></html>';
    var w=window.open("","_blank","width=320,height=700");
    if(!w)return{success:false,error:"popup_blocked"};
    w.document.write(h);w.document.close();setTimeout(function(){w.print();},400);return{success:true,fallback:true};
  },
};

/* ── Unified print — ESC/POS or HTML fallback ──────────────────── */
async function printTicketUnified(receipt,type){
  type=type||"receipt";var c=PrinterService.getConfig();
  if(PrinterService.isConnected()){
    try{
      if(type==="receipt")return await PrinterService.printReceipt(receipt);
      if(type==="zreport")return await PrinterService.printZReport(receipt);
      if(type==="kitchen")return await PrinterService.printKitchenOrder(receipt);
    }catch(err){console.warn("ESC/POS fallback:",err);}
  }
  if(type==="receipt")return FallbackPrinter.printReceipt(receipt,c);
  if(type==="zreport")return FallbackPrinter.printZReport(receipt,c);
  return FallbackPrinter.printReceipt(Object.assign({},receipt,{tenant:"BON PRODUCTION"}),c);
}

/* ── usePrinter React Hook ─────────────────────────────────────── */
function usePrinter(){
  var _s=useState(false),connected=_s[0],setConnected=_s[1];
  var _c=useState(null),config=_c[0],setConfig=_c[1];
  var _e=useState(null),error=_e[0],setError=_e[1];
  var _l=useState(false),loading=_l[0],setLoading=_l[1];
  var _su=useState(false),supported=_su[0],setSupported=_su[1];
  var _lp=useState(null),lastPrint=_lp[0],setLastPrint=_lp[1];
  useEffect(function(){setSupported(PrinterService.isSupported());setConfig(PrinterService.loadConfig());},[]);
  var connect=useCallback(async function(opts){
    setLoading(true);setError(null);
    try{await PrinterService.connect(opts);setConnected(true);setLastPrint({type:"connect",time:hm(),success:true});return{success:true};}
    catch(err){setError(err.message);setConnected(false);throw err;}
    finally{setLoading(false);}
  },[]);
  var disconnect=useCallback(async function(){await PrinterService.disconnect();setConnected(false);setError(null);},[]);
  var updateConfig=useCallback(function(nc){var s=PrinterService.saveConfig(nc);setConfig(s);return s;},[]);
  var printReceipt=useCallback(async function(r){
    setLoading(true);setError(null);
    try{var res=await printTicketUnified(r,"receipt");setLastPrint({type:"receipt",time:hm(),success:true,fallback:!!res.fallback,ticket:r.ticketNumber});return res;}
    catch(err){setError(err.message);throw err;}finally{setLoading(false);}
  },[]);
  var printZReport=useCallback(async function(rp){
    setLoading(true);setError(null);
    try{var res=await printTicketUnified(rp,"zreport");setLastPrint({type:"zreport",time:hm(),success:true,fallback:!!res.fallback});return res;}
    catch(err){setError(err.message);throw err;}finally{setLoading(false);}
  },[]);
  var printKitchenOrder=useCallback(async function(o){
    setLoading(true);setError(null);
    try{var res=await printTicketUnified(o,"kitchen");setLastPrint({type:"kitchen",time:hm(),success:true,fallback:!!res.fallback});return res;}
    catch(err){setError(err.message);throw err;}finally{setLoading(false);}
  },[]);
  var printTest=useCallback(async function(){
    setLoading(true);setError(null);
    try{if(!PrinterService.isConnected())throw new Error("Non connectée");var res=await PrinterService.printTest();setLastPrint({type:"test",time:hm(),success:true});return res;}
    catch(err){setError(err.message);throw err;}finally{setLoading(false);}
  },[]);
  var openDrawer=useCallback(async function(){try{await PrinterService.openDrawer();}catch(e){}},[]);
  return{connected:connected,config:config,error:error,loading:loading,supported:supported,lastPrint:lastPrint,
    connect:connect,disconnect:disconnect,updateConfig:updateConfig,printReceipt:printReceipt,
    printZReport:printZReport,printKitchenOrder:printKitchenOrder,printTest:printTest,openDrawer:openDrawer};
}

export { PrinterService, FallbackPrinter, printTicketUnified, usePrinter, PAPER, ESCCMD };
