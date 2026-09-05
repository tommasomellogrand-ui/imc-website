Object.assign(RTH.T,{111:['Borussia Dortmund',26,24,9,'L W D W L',56.4,16.3,6.7,'https://cdn.soccerwiki.org/images/logos/clubs/392.png','RAPHINHA · 8.9'],149:['Lazio',25,28,16,'W W D W W',55.3,16.3,6.8,'https://cdn.soccerwiki.org/images/logos/clubs/111.png','K MBAPPÉ · 9.1'],142:['Dynamo Kyiv',22,23,9,'W W L W W',57.3,17.9,7.3,'https://cdn.soccerwiki.org/images/logos/clubs/347.png','J BELLINGHAM · 8.2'],148:['Roma',22,18,11,'W W D L W',51,14.1,5.3,'https://cdn.soccerwiki.org/images/logos/clubs/123.png','ENDRICK · 7.9'],139:['Legia Warszawa',20,19,17,'L W W L L',46.1,12.2,3.4,'https://cdn.soccerwiki.org/images/logos/clubs/651.png','A GRIEZMANN · 7.8'],150:['Hertha Berlino',19,21,19,'W L W L W',54.8,14.6,6.2,'https://cdn.soccerwiki.org/images/logos/clubs/404.png','F WIRTZ · 9.0'],144:['River Plate',10,13,26,'L L D W L',45.2,10.7,3.1,'https://cdn.soccerwiki.org/images/logos/clubs/282.png','F BALOGUN · 7.3'],143:['Campobasso',9,19,25,'L L W L L',45.8,14.6,5.3,'https://cdn.soccerwiki.org/images/logos/clubs/3874.png','L DÍAZ · 7.9'],146:['Club América',8,12,31,'L L L W W',43.3,10.3,2.9,'https://cdn.soccerwiki.org/images/logos/clubs/439.png','J PANICHELLI · 7.6'],145:['Flamengo',7,10,24,'W L L L L',44.9,11.1,2.7,'https://cdn.soccerwiki.org/images/logos/clubs/294.png','RODRYGO · 7.1']});RTH.D[4]=[111,149,142,148,139,150,144,143,146,145];RTH.F[4]=[[143,139],[148,142],[149,145],[146,144],[150,111]];
RTH.COPY={
'1-0':['SURVIVAL MODE MEETS A CHANCE TO STRIKE BACK.','CAN PARMA TURN DESPERATION INTO DANGER?'],
'1-1':['TWO HEAVYWEIGHTS. ONE LANE TO THE TOP.','DOES DRESDEN’S CONTROL HOLD UP AGAINST TORINO’S FIREPOWER?'],
'1-2':['THE CHASE IS ON. NOBODY GETS TO BLINK.','CAN AEK SLOW DOWN 1860’S POSSESSION MACHINE?'],
'1-3':['PALERMO WANT THE CLIMB. ATALANTA WANT THE CROWN.','CAN PALERMO’S PRESSURE CRACK ATALANTA’S EDGE?'],
'1-4':['PRIDE, PRESSURE, AND ONE LAST WAY OUT.','CAN PARTIZAN FIND A SPARK BEFORE ACADÉMICA TAKES CONTROL?'],
'2-0':['SAME NEIGHBORHOOD. VERY DIFFERENT INTENTIONS.','CAN GENOA’S SHOT VOLUME BREAK FRANKFURT’S MOMENTUM?'],
'2-1':['THE GAP SAYS EASY. THE NIGHT SAYS PROVE IT.','CAN PALMEIRAS DRAG FENERBAHÇE INTO A FIGHT THEY DON’T WANT?'],
'2-2':['DEAD EVEN. NOW SOMEBODY TAKES THE EDGE.','WHO WINS THE BATTLE BETWEEN BOCA’S BITE AND KAISERSLAUTERN’S CONTROL?'],
'2-3':['THE LEADER WALKS IN. FEYENOORD REFUSE TO BOW.','CAN FEYENOORD DISRUPT SAMPDORIA’S CONTROL OF THE NIGHT?'],
'2-4':['ONE SIDE NEEDS AIR. THE OTHER SMELLS BLOOD.','CAN SUNDERLAND’S VOLUME SURVIVE BOLOGNA’S FINISHING POWER?'],
'3-0':['LEVEL ON POINTS. NOTHING ELSE FEELS LEVEL.','CAN NAPOLI’S BALANCE OUTLIVE TOTTENHAM’S PRESSURE?'],
'3-1':['THIS ISN’T A MATCH. IT’S A COLLISION COURSE.','CAN ATLÉTICO SURVIVE CELTIC’S RELENTLESS WAVE?'],
'3-2':['SOMEBODY HAS TO STOP THE FALL.','WHO FINDS A PULSE FIRST WHEN CONFIDENCE IS GONE?'],
'3-3':['SHAKHTAR BRING THE FIRE. SÃO PAULO BRING THE NEED.','CAN SÃO PAULO ABSORB THE STORM AND STEAL THE MOMENT?'],
'3-4':['THE LEADER MEETS THE TEAM THAT WON’T GO QUIETLY.','CAN MARSEILLE’S MOMENTUM OUTRUN VALENCIA’S FIREPOWER?'],
'4-0':['THE TABLE SAYS LEGIA. THE NIGHT DEMANDS PROOF.','CAN CAMPOBASSO TURN CHAOS INTO AN UPSET?'],
'4-1':['CONTROL VS CONTROL. SOMETHING HAS TO GIVE.','WHO OWNS THE BALL WHEN BOTH SIDES WANT THE KEYS?'],
'4-2':['LAZIO ARE FLYING. FLAMENGO NEED A MIRACLE.','CAN FLAMENGO SURVIVE LAZIO’S ATTACKING WAVE?'],
'4-3':['TWO TEAMS HUNTING A WAY BACK INTO THE STORY.','WHO TURNS FRAGILE DEFENDING INTO A NIGHT OF REDEMPTION?'],
'4-4':['BERLIN WANTS A STATEMENT. DORTMUND WANTS THE THRONE.','CAN HERTHA’S WIRTZ FACTOR BREAK DORTMUND’S CONTROL?']};
(function(){
function routeButtons(){
 document.querySelectorAll('a.navbtn[href^="#data-"]').forEach(function(a){var m=a.getAttribute('href').match(/^#data-(\d)-(\d)$/);if(m)a.setAttribute('href','data.html?d='+m[1]+'&i='+m[2]);});
 document.querySelectorAll('a.navbtn[href^="#match-"]').forEach(function(a){var m=a.getAttribute('href').match(/^#match-(\d)-(\d)$/);if(m)a.setAttribute('href','match.html?d='+m[1]+'&i='+m[2]);});
}
function patchStory(){var m=(location.hash||'').match(/^#match-(\d)-(\d)$/);if(!m)return;var c=RTH.COPY[m[1]+'-'+m[2]];if(!c)return;var h=document.querySelector('.storybox h2');if(h)h.textContent=c[0];}
function refresh(){routeButtons();patchStory();}
var obs=new MutationObserver(refresh);obs.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',function(){setTimeout(refresh,0)});setTimeout(refresh,0);
})();