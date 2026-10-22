// Enrich the dated editorial snapshot; never include results on/after its date.
const fs=require('node:fs'),assert=require('node:assert/strict');
const path=__dirname+'/2026-10-22-coffee.json';
const cup=a=>/cup|shield|champions|europa/i.test(a);
async function enrich(){
 const data=JSON.parse(fs.readFileSync(path));
 const fixtures=data.divisions.flatMap(d=>d.fixtures),history=new Map();
 const ids=[...new Set(fixtures.flatMap(f=>[f.home_table.id,f.away_table.id]))];
 for(let i=0;i<ids.length;i+=5)await Promise.all(ids.slice(i,i+5).map(async id=>{
  const source='https://www.italianmastersclub.it/nexus/teams/matches.php?world=GW001&sm_club='+id;
  const r=await fetch(source,{signal:AbortSignal.timeout(60000)});assert(r.ok);const d=await r.json();assert(d.ok);
  const past=d.results.filter(f=>f.match_date.slice(0,10)<data.date&&f.result_status==='COMPLETED'&&Number(f.imc_season)===data.season).sort((a,b)=>b.match_date.localeCompare(a.match_date));assert(past.length);
  const f=past[0],day=f.match_date.slice(0,10);
  history.set(id,{date:day,days_between:Math.round((Date.parse(data.date)-Date.parse(day))/86400000),competition:f.sm_action,is_cup:cup(f.sm_action),fixture_id:f.sm_fixture_id,home:f.home_name,away:f.away_name,score:f.home_score+'–'+f.away_score,source});
 }));
 const label=a=>a==='league'?'campionato':a==='leaguecup'?'Coppa di Lega':cup(a)?'coppa':'competizione '+a;
 const fact=(name,r)=>`${name}: ultimo incontro registrato il ${r.date.slice(8)} ottobre in ${label(r.competition)}, ${r.home}–${r.away} ${r.score}; ${r.days_between} giorni tra le due date.`;
 for(const f of fixtures){const h=history.get(f.home_table.id),a=history.get(f.away_table.id);f.recovery={home:h,away:a};
  let angle=h.days_between===a.days_between?`Le due squadre hanno lo stesso intervallo di calendario: ${h.days_between} giorni. La gestione dei ritmi dipenderà anche dai minuti effettivamente giocati dai singoli.`:`${h.days_between>a.days_between?f.home:f.away} ha ${Math.abs(h.days_between-a.days_between)} giorni in più tra gli incontri registrati: un possibile vantaggio nella preparazione, non una garanzia di maggiore freschezza.`;
  f.recovery_text=fact(f.home,h)+' '+fact(f.away,a)+' '+angle;
 }
 const recent=[...history.values()].filter(r=>r.is_cup&&r.days_between<=3).length;
 data.opening[1]=data.opening[1].split(' Anche il calendario')[0]+` Anche il calendario precedente conta: ${recent} delle quaranta squadre arrivano da un impegno di coppa negli ultimi tre giorni. Il tempo per preparare la partita non è uguale per tutti: controlliamo i precedenti prima di parlare di ritmi, rotazioni e possibile fatica.`;
 for(const d of data.divisions){
  const names=d.fixtures.flatMap(f=>[['home',f.home],['away',f.away]].filter(([s])=>f.recovery[s].is_cup&&f.recovery[s].days_between<=3).map(([,name])=>name));
  d.intro[1]=d.intro[1].split(' Sul fronte recupero:')[0]+' Sul fronte recupero: '+(names.length?names.join(', ')+' arrivano da impegni di coppa negli ultimi tre giorni. Questo può orientare la gestione delle energie e delle sostituzioni; non abbiamo però dati sui carichi individuali.':'nessuna delle dieci squadre ha come ultimo incontro registrato una gara di coppa negli ultimi tre giorni. I dettagli dei precedenti sono riportati sotto ciascuna sfida.');
 }
 data.portraits=[
  {name:'Federica Zille',image:'assets/coffee-zille.webp',source:'https://overtimefestival.it/federica-zille/'},
  {name:'Andrea Stramaccioni',image:'assets/coffee-stramaccioni.webp',source:'https://www.fcinternews.it/copertina/stramaccioni-allo-stadium-la-vittoria-dell-interismo-ecco-perche-dopo-il-derby-dissi-e-vostro-alla-curva-nord-337458'},
  {name:'Alessandro Florenzi',image:'assets/coffee-florenzi.webp',source:'https://sport.sky.it/calcio/serie-a/2025/08/27/alessandro-florenzi-ritiro-calcio-video'}
 ];
 data.recovery_checked_at=new Date().toISOString();
 assert.equal(fixtures.length,20);assert.equal(history.size,40);
 require('./apply-correspondents.cjs').apply(data);
 fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
 console.log('Verified recent fixtures for',history.size,'clubs;',recent,'recent cup participants');
 for(const d of data.divisions)console.log(d.name,d.fixtures.map(f=>`${f.home} (${f.recovery.home.competition}, ${f.recovery.home.days_between}) / ${f.away} (${f.recovery.away.competition}, ${f.recovery.away.days_between})`).join('\n'));
}
enrich().catch(e=>{console.error(e);process.exit(1)});
