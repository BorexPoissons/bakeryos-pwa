/* BakeryOS — Utility functions */

export function hm() {
  const d = new Date();
  return d.getHours() + ":" + String(d.getMinutes()).padStart(2,"0");
}

export function computeTVA(items) {
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

export function generateGiftCode() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var code = "GC-";
  for (var i=0;i<4;i++) code += chars[Math.floor(Math.random()*chars.length)];
  code += "-";
  for (var j=0;j<4;j++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}

export function qrUrl(text) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="+encodeURIComponent(text);
}
