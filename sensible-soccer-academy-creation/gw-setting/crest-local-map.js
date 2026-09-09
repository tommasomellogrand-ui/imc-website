(()=>{
  const clubs={
    'Peñarol':{id:'376',file:'376.png',source:'http://cdn.cloudfiles.mosso.com/c12351/376.png'},
    'Colo-Colo':{id:'362',file:'362.png',source:'http://cdn.cloudfiles.mosso.com/c12351/362.png'},
    'Millonarios':{id:'618',file:'618.png',source:'http://cdn.cloudfiles.mosso.com/c12351/618.png'},
    'Bolívar':{id:'1238',file:'1238.png',source:'http://cdn.cloudfiles.mosso.com/c12351/1238.png'},
    'Olimpia':{id:'613',file:'613.png',source:'http://cdn.cloudfiles.mosso.com/c12351/613.png'},
    'Alianza Lima':{id:'621',file:'621.png',source:'http://cdn.cloudfiles.mosso.com/c12351/621.png'},
    'Santos':{id:'304',file:'304.png',source:'http://cdn.cloudfiles.mosso.com/c12351/304.png'},
    'São Paulo':{id:'306',file:'306.png',source:'http://cdn.cloudfiles.mosso.com/c12351/306.png'},
    'Grêmio':{id:'602',file:'602.png',source:'http://cdn.cloudfiles.mosso.com/c12351/602.png'},
    'Argentinos Juniors':{id:'267',file:'267.png',source:'http://cdn.cloudfiles.mosso.com/c12351/267.png'},
    "Newell's Old Boys":{id:'278',file:'278.png',source:'http://cdn.cloudfiles.mosso.com/c12351/278.png'},
    'Vélez Sarsfield':{id:'285',file:'285.png',source:'http://cdn.cloudfiles.mosso.com/c12351/285.png'},
    'Atalanta':{id:'96',file:'96.png',source:'http://cdn.cloudfiles.mosso.com/c12351/96.png'},
    'Ferencváros':{id:'1416',file:'1416.png',source:'http://cdn.cloudfiles.mosso.com/c12351/1416.png'},
    'IFK Göteborg':{id:'471',file:'471.png',source:'http://cdn.cloudfiles.mosso.com/c12351/471.png'},
    'Aberdeen':{id:'420',file:'420.png',source:'http://cdn.cloudfiles.mosso.com/c12351/420.png'},
    'Siviglia':{id:'168',file:'168.png',source:'http://cdn.cloudfiles.mosso.com/c12351/168.png'},
    'West Ham United':{id:'85',file:'85.png',source:'http://cdn.cloudfiles.mosso.com/c12351/85.png'},
    'Stoccarda':{id:'417',file:'417.png',source:'http://cdn.cloudfiles.mosso.com/c12351/417.png'},
    'Anderlecht':{id:'353',file:'353.png',source:'http://cdn.cloudfiles.mosso.com/c12351/353.png'},
    'Ajax':{id:'180',file:'180.png',source:'http://cdn.cloudfiles.mosso.com/c12351/180.png'},
    'Olympique Lyonnais':{id:'329',file:'329.png',source:'http://cdn.cloudfiles.mosso.com/c12351/329.png'},
    'Dinamo Zagreb':{id:'365',file:'365.png',source:'http://cdn.cloudfiles.mosso.com/c12351/365.png'},
    'Benfica':{id:'218',file:'218.png',source:'http://cdn.cloudfiles.mosso.com/c12351/218.png'}
  };
  const local={};
  Object.entries(clubs).forEach(([name,meta])=>{local[name]='./crests/'+meta.file;});
  window.IMC_GW010_CLUB_CODEX=clubs;
  window.IMC_CREST_OVERRIDES=Object.assign(window.IMC_CREST_OVERRIDES||{},local);
  const spacing=document.createElement('style');
  spacing.textContent='.matrix > .panel:last-child .pool .grid{padding-top:14px}.matrix > .panel:last-child .pool h3{margin-bottom:0}';
  document.head.appendChild(spacing);
})();
