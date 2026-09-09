(()=>{
  const clubs={
    'Peñarol':{id:'376',name:'Peñarol',source:'https://cdn.soccerwiki.org/images/logos/clubs/376.png'},
    'Colo-Colo':{id:'362',name:'Colo-Colo',source:'https://cdn.soccerwiki.org/images/logos/clubs/362.png'},
    'Millonarios':{id:'618',name:'Millonarios',source:'https://cdn.soccerwiki.org/images/logos/clubs/618.png'},
    'Bolívar':{id:'1238',name:'Bolívar',source:'https://cdn.soccerwiki.org/images/logos/clubs/1238.png'},
    'Olimpia':{id:'613',name:'Club Olimpia',source:'https://cdn.soccerwiki.org/images/logos/clubs/613.png'},
    'Alianza Lima':{id:'621',name:'Alianza Lima',source:'https://cdn.soccerwiki.org/images/logos/clubs/621.png'},
    'Santos':{id:'304',name:'Santos FC',source:'https://cdn.soccerwiki.org/images/logos/clubs/304.png'},
    'São Paulo':{id:'306',name:'São Paulo FC',source:'https://cdn.soccerwiki.org/images/logos/clubs/306.png'},
    'Grêmio':{id:'602',name:'Grêmio',source:'https://cdn.soccerwiki.org/images/logos/clubs/602.png'},
    'Argentinos Juniors':{id:'267',name:'Argentinos Juniors',source:'https://cdn.soccerwiki.org/images/logos/clubs/267.png'},
    "Newell's Old Boys":{id:'278',name:"Newell's Old Boys",source:'https://cdn.soccerwiki.org/images/logos/clubs/278.png'},
    'Vélez Sarsfield':{id:'285',name:'Vélez Sársfield',source:'https://cdn.soccerwiki.org/images/logos/clubs/285.png'},
    'Atalanta':{id:'96',name:'Atalanta BC',source:'https://cdn.soccerwiki.org/images/logos/clubs/96.png'},
    'Ferencváros':{id:'1416',name:'Ferencvárosi TC',source:'https://cdn.soccerwiki.org/images/logos/clubs/1416.png'},
    'IFK Göteborg':{id:'471',name:'IFK Göteborg',source:'https://cdn.soccerwiki.org/images/logos/clubs/471.png'},
    'Aberdeen':{id:'420',name:'Aberdeen',source:'https://cdn.soccerwiki.org/images/logos/clubs/420.png'},
    'Siviglia':{id:'168',name:'Sevilla FC',source:'https://cdn.soccerwiki.org/images/logos/clubs/168.png'},
    'West Ham United':{id:'85',name:'West Ham United',source:'https://cdn.soccerwiki.org/images/logos/clubs/85.png'},
    'Stoccarda':{id:'417',name:'VfB Stuttgart',source:'https://cdn.soccerwiki.org/images/logos/clubs/417.png'},
    'Anderlecht':{id:'353',name:'RSC Anderlecht',source:'https://cdn.soccerwiki.org/images/logos/clubs/353.png'},
    'Ajax':{id:'180',name:'Ajax',source:'https://cdn.soccerwiki.org/images/logos/clubs/180.png'},
    'Olympique Lyonnais':{id:'329',name:'Olympique Lyonnais',source:'https://cdn.soccerwiki.org/images/logos/clubs/329.png'},
    'Dinamo Zagreb':{id:'365',name:'Dinamo Zagreb',source:'https://cdn.soccerwiki.org/images/logos/clubs/365.png'},
    'Benfica':{id:'218',name:'SL Benfica',source:'https://cdn.soccerwiki.org/images/logos/clubs/218.png'}
  };
  const remote={};
  Object.entries(clubs).forEach(([name,meta])=>{remote[name]=meta.source;});
  window.IMC_GW010_CLUB_CODEX=clubs;
  window.IMC_CREST_OVERRIDES=Object.assign(window.IMC_CREST_OVERRIDES||{},remote);
  const spacing=document.createElement('style');
  spacing.textContent='.matrix > .panel:last-child .pool .grid{padding-top:14px}.matrix > .panel:last-child .pool h3{margin-bottom:0}';
  document.head.appendChild(spacing);
})();
