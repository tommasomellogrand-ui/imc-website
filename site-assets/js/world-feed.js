(function(){
"use strict";
const worlds={
 GW001:{name:"Road To History",slug:"gw001-road-to-history",id:"468172"},
 GW002:{name:"Gold 558",slug:"gw002-gold-558",id:"467635"},
 GW003:{name:"Gold 557",slug:"gw003-gold-557",id:"467488"},
 GW004:{name:"World League",slug:"gw004-world-league",id:"29871"},
 GW005:{name:"Hall Of Famers",slug:"gw005-hall-of-famers",id:"468194"},
 GW006:{name:"Master League World",slug:"gw006-master-league-world",id:"468156"},
 GW007:{name:"The Four Kingdoms",slug:"gw007-the-four-kingdoms",id:"140637"},
 GW008:{name:"Gold 1",slug:"gw008-gold-1",id:"668"},
 GW009:{name:"Kick Off",slug:"gw009-kick-off",id:"468332"}
};
const news={GW009:[
 [308891258,"Ostia Mare Lido","ASD Imperia",1,0,"Pep Buitre","Matteo Sartori"],
 [308891257,"ALCIONE MILANO","Giugliano",2,1,"Tommaso Mello","Luciano Tana"],
 [308891256,"Calcio Desenzano SSD","Paternò Calcio",1,0,"Francesco Rossi","Giuseppe Trovato"],
 [308891255,"ASD Giulianova","Union Clodiense Chioggia",3,1,"Alessio Gambato","Max Palace"],
 [308891254,"US Agropoli 1921","USD Ragusa",1,3,"Francesco Senesi","Giorgio Grugni"],
 [308891253,"ASD Barletta 1922","FC Lumezzane",3,0,"Marco Fioretti","Giorgio Pucci"],
 [308891252,"Imolese Calcio 1919","AC Renate",1,2,"Carlo Colombo","Giovanni Cabrioli"],
 [308891251,"US Folgore Caratese","Paganese Calcio",0,1,"Davide Rapisarda","Giovanni Iodice"],
 [308891250,"AC Locri 1909","SSD Casarano Calcio",0,3,"Saverio Cordiano","Lorenzo Errico"],
 [308891249,"Enna Calcio","Città di Gela",2,0,"Chris Fenech","Chicco Belin"],
 [308891248,"ASD Manfredonia","Scafatese Calcio 1922",1,1,"Vardan Minasyan","Raffaele Manzo",5,6],
 [308891247,"US Vibonese","SS Milazzo",0,2,"Igor Zanotto","Attilio Bonnici"],
 [308891246,"Battipagliese 1929","SEF Torres",2,1,"Luciano Catalano","Luca Nudo"],
 [308891245,"SS Turris Calcio","AC Savoia 1908",2,1,"Sir Simone","Tommaso Prisco"]
]};
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const code=(document.body.dataset.world||"GW001").toUpperCase(),world=worlds[code]||worlds.GW001,rows=news[code]||[];
document.querySelector(".world-hero").dataset.worldCode=code;
document.querySelector(".world-cover").src=`../site-assets/images/game-worlds/${code.toLowerCase()}.webp`;
document.querySelector(".world-cover").alt=world.name;
document.querySelector("[data-world-eyebrow]").textContent=`${code} · IMC WORLD`;
document.querySelector("[data-world-title]").innerHTML=world.name.toUpperCase().split(" ").map(esc).join("<br>");
document.querySelector("[data-world-id]").textContent=`GAME WORLD ID ${world.id}`;
document.title=`${code} · ${world.name} | Italian Masters Club`;
const list=document.querySelector("[data-feed-list]");
if(!rows.length){list.innerHTML='<div class="feed-empty"><strong>NESSUNA NEWS DISPONIBILE</strong><span>Il feed pubblico di questo Game World è pronto.</span></div>';return;}
list.innerHTML=rows.map(r=>{const pens=r[7]!=null?` · RIGORI ${r[7]}-${r[8]}`:"";return `<article class="beta-story" id="news-${r[0]}"><div class="story-visual"><img src="../site-assets/images/game-worlds/${code.toLowerCase()}.webp" alt=""><span>${code}</span></div><div class="story-copy"><div class="story-meta"><span>IMC | KICK OFF CUP · TURNO 1</span><time datetime="2026-09-01">01.09.2026</time></div><h3>${esc(r[1])} ${r[3]}-${r[4]} ${esc(r[2])}</h3><div class="story-score">${r[3]}<i>—</i>${r[4]}${esc(pens)}</div><p class="story-manager">${esc(r[5])} · ${esc(r[6])}</p><span class="story-label">MATCH REPORT · ${r[0]}</span></div></article>`}).join("");
})();
