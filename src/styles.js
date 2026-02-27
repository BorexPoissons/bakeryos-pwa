/* BakeryOS — CSS Keyframes & Global Styles */

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

export { CSS };
