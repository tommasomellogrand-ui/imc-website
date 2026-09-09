(()=>{
  const clubs={
    'Peñarol':{id:'376',file:'penarol.png',source:'http://cdn.cloudfiles.mosso.com/c12351/376.png'},
    'Colo-Colo':{id:'362',file:'colo-colo.png',source:'http://cdn.cloudfiles.mosso.com/c12351/362.png'},
    'Millonarios':{id:'618',file:'millonarios.png',source:'http://cdn.cloudfiles.mosso.com/c12351/618.png'},
    'Bolívar':{id:'1238',file:'bolivar.png',source:'http://cdn.cloudfiles.mosso.com/c12351/1238.png'},
    'Olimpia':{id:'613',file:'olimpia.png',source:'http://cdn.cloudfiles.mosso.com/c12351/613.png'},
    'Alianza Lima':{id:'621',file:'alianza-lima.png',source:'http://cdn.cloudfiles.mosso.com/c12351/621.png'},
    'Santos':{id:'304',file:'santos.png',source:'http://cdn.cloudfiles.mosso.com/c12351/304.png'},
    'São Paulo':{id:'306',file:'sao-paulo.png',source:'http://cdn.cloudfiles.mosso.com/c12351/306.png'},
    'Grêmio':{id:'602',file:'gremio.png',source:'http://cdn.cloudfiles.mosso.com/c12351/602.png'},
    'Argentinos Juniors':{id:'267',file:'argentinos-juniors.png',source:'http://cdn.cloudfiles.mosso.com/c12351/267.png'},
    "Newell's Old Boys":{id:'278',file:'newells-old-boys.png',source:'http://cdn.cloudfiles.mosso.com/c12351/278.png'},
    'Vélez Sarsfield':{id:'285',file:'velez-sarsfield.png',source:'http://cdn.cloudfiles.mosso.com/c12351/285.png'},
    'Atalanta':{id:'96',file:'atalanta.png',source:'http://cdn.cloudfiles.mosso.com/c12351/96.png'},
    'Ferencváros':{id:'1416',file:'ferencvaros.png',source:'http://cdn.cloudfiles.mosso.com/c12351/1416.png'},
    'IFK Göteborg':{id:'471',file:'ifk-goteborg.png',source:'http://cdn.cloudfiles.mosso.com/c12351/471.png'},
    'Aberdeen':{id:'420',file:'aberdeen.png',source:'http://cdn.cloudfiles.mosso.com/c12351/420.png'},
    'Siviglia':{id:'168',file:'sevilla.png',source:'http://cdn.cloudfiles.mosso.com/c12351/168.png'},
    'West Ham United':{id:'85',file:'west-ham.png',source:'http://cdn.cloudfiles.mosso.com/c12351/85.png'},
    'Stoccarda':{id:'417',file:'vfb-stuttgart.png',source:'http://cdn.cloudfiles.mosso.com/c12351/417.png'},
    'Anderlecht':{id:'353',file:'anderlecht.png',source:'http://cdn.cloudfiles.mosso.com/c12351/353.png'},
    'Ajax':{id:'180',file:'ajax.png',source:'http://cdn.cloudfiles.mosso.com/c12351/180.png'},
    'Olympique Lyonnais':{id:'329',file:'lyon.png',source:'http://cdn.cloudfiles.mosso.com/c12351/329.png'},
    'Dinamo Zagreb':{id:'365',file:'dinamo-zagreb.png',source:'http://cdn.cloudfiles.mosso.com/c12351/365.png'},
    'Benfica':{id:'218',file:'benfica.png',source:'http://cdn.cloudfiles.mosso.com/c12351/218.png'}
  };
  const local={};
  Object.entries(clubs).forEach(([name,meta])=>{local[name]='./crests/'+meta.file;});
  window.IMC_GW010_CLUB_CODEX=clubs;
  window.IMC_CREST_OVERRIDES=Object.assign(window.IMC_CREST_OVERRIDES||{},local);
  const spacing=document.createElement('style');
  spacing.textContent='.matrix > .panel:last-child .pool .grid{padding-top:14px}.matrix > .panel:last-child .pool h3{margin-bottom:0}';
  document.head.appendChild(spacing);
})();
