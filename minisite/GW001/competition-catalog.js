const groups={'Domestic Competition':'DOMESTIC','International Competition':'INTERNATIONAL','National Team Competition':'NATIONS'};
const canonical=[
  ['DOMESTIC','league','1','League · Divisione 1'],
  ['DOMESTIC','league','2','League · Divisione 2'],
  ['DOMESTIC','league','3','League · Divisione 3'],
  ['DOMESTIC','league','4','League · Divisione 4'],
  ['DOMESTIC','leaguecup','','League Cup'],
  ['DOMESTIC','charityshield','','Charity Shield'],
  ['DOMESTIC','playoff','2','Playoff · Divisione 2'],
  ['DOMESTIC','playoff','3','Playoff · Divisione 3'],
  ['DOMESTIC','playoff','4','Playoff · Divisione 4'],
  ['DOMESTIC','friendly','','Friendly'],
  ['INTERNATIONAL','smfacup','','SMFA Cup'],
  ['INTERNATIONAL','smfashield','','SMFA Shield'],
  ['INTERNATIONAL','supercup','','Super Cup'],
  ['NATIONS','interqualifier','','International Qualifier'],
  ['NATIONS','worldcup','','World Cup'],
];

export function activeCompetitions(catalogue,activity){
  // Custom competitions own their explicit keys, even when their SM action is league.
  const customKeys=new Set(catalogue.filter(c=>c.competition_key).map(c=>c.competition_key));
  const entries=catalogue.filter(c=>c.game_world_id==='GW001').map(c=>{
    const group=groups[c.sm_action_group];
    const playoff=c.competition_key===`GW001|DOMESTIC|playoff|${c.sm_division}`;
    const action=playoff?'playoff':c.sm_action;
    const rank=canonical.findIndex(([g,a,d])=>g===group&&a===action&&d===String(c.sm_division??''));
    if(rank<0)return null;
    const matches=activity.filter(r=>r.game_world_id==='GW001'&&r.competition_group===group&&(
      c.competition_key?r.competition_key===c.competition_key:
      !customKeys.has(r.competition_key)&&!r.competition_key.split('|').includes('playoff')&&r.sm_action===c.sm_action&&
      (c.sm_division==null||String(r.sm_division)===String(c.sm_division))&&
      (c.sm_country==null||r.sm_country===c.sm_country)
    ));
    if(!matches.length)return null;
    return {competition:c,group,order:rank+1,label:canonical[rank][3],results:[...new Set(matches.filter(r=>r.source==='results').map(r=>r.competition_key))].sort(),schedule:[...new Set(matches.filter(r=>r.source==='schedule').map(r=>r.competition_key))].sort()};
  }).filter(Boolean).sort((a,b)=>a.order-b.order||String(a.competition.id).localeCompare(String(b.competition.id),'en',{numeric:true}));
  return ['DOMESTIC','INTERNATIONAL','NATIONS'].map(group=>({group,entries:entries.filter(e=>e.group===group)}));
}
