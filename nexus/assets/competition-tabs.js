(async()=>{'use strict';
const {p,gw,esc,url,get}=NexusUI,$=id=>document.getElementById(id);
const families=[{id:'domestic-leagues',group:'DOMESTIC',name:'Campionati',actions:['league']},{id:'domestic-playoffs',group:'DOMESTIC',name:'Playoff',actions:['playoff']},{id:'domestic-cups',group:'DOMESTIC',name:'Coppe',actions:['charityshield','nationalcup','leaguecup','leagueshield']},{id:'international-cups',group:'INTERNATIONAL',name:'International',actions:['smfacup','smfashield','supercup']},{id:'world-cup',group:'NATIONS',name:'World Cup',actions:['interqualifier','worldcup']}];
const familyOf=r=>families.find(f=>f.actions.includes(String(r.sm_action).toLowerCase()));
let cleanup=()=>{},all=[],season='',currentGroup='',currentFamily='',country=p.get('country')||'',selectedKey=p.get('competition')||'';
const legacyFamily=p.get('family')||(document.body.dataset.page==='domestic'?(p.get('section')==='cups'?'domestic-cups':'domestic-leagues'):'');
function available(f){return all.some(r=>f.actions.includes(String(r.sm_action).toLowerCase()))}
function button(label,value,active,attribute,disabled=false){return '<button type="button" '+attribute+'="'+esc(value)+'" aria-pressed="'+String(active)+'" class="choice'+(active?' active':'')+'"'+(disabled?' disabled':'')+'>'+esc(label)+'</button>'}
function updateUrl(r,tab){const next=new URLSearchParams({world:gw,season,group:currentGroup,family:currentFamily,...(country?{country}:{}),...(r?{competition:r.competition_key,name:r.nexus_view}:{}),tab});history.replaceState(null,'','?'+next)}
function chooseFamily(id){currentFamily=id;const f=families.find(x=>x.id===id);currentGroup=f.group;render()}
function render(){
 cleanup();cleanup=()=>{};
 const groups=[['DOMESTIC','Domestic'],['INTERNATIONAL','International'],['NATIONS','World Cup']];
 $('group-tabs').innerHTML=groups.map(([id,name])=>button(name,id,id===currentGroup,'data-group',!families.some(f=>f.group===id&&available(f)))).join('');
 $('group-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{const first=families.find(f=>f.group===b.dataset.group&&available(f));if(first)chooseFamily(first.id)});
 const fs=families.filter(f=>f.group===currentGroup&&available(f));
 if(!fs.some(f=>f.id===currentFamily))currentFamily=fs[0]?.id||'';
 $('family-tabs').hidden=currentGroup!=='DOMESTIC';$('family-tabs').innerHTML=fs.map(f=>button(f.name,f.id,f.id===currentFamily,'data-family')).join('');
 $('family-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>chooseFamily(b.dataset.family));
 const f=families.find(x=>x.id===currentFamily);let rows=all.filter(r=>f?.actions.includes(String(r.sm_action).toLowerCase()));
 const countries=currentGroup==='DOMESTIC'?[...new Set(rows.filter(r=>r.world_type==='MULTI').map(r=>r.sm_country).filter(Boolean))].sort():[];
 $('country-filter').hidden=!countries.length;$('country-select').innerHTML=countries.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
 if(countries.length){if(!countries.includes(country))country=countries[0];$('country-select').value=country;rows=rows.filter(r=>r.sm_country===country)}else country='';
 $('country-select').onchange=()=>{country=$('country-select').value;render()};
 const old=all.find(r=>r.competition_key===selectedKey);
 const selected=rows.find(r=>r.competition_key===selectedKey)||rows.find(r=>old&&r.sm_action===old.sm_action&&String(r.sm_division)===String(old.sm_division))||rows[0];
 selectedKey=selected?.competition_key||'';
 const label=r=>['league','playoff'].includes(r.sm_action)?'Div '+r.sm_division+(r.sm_action==='playoff'?' Playoff':''):r.nexus_view;
 $('competition-tabs').innerHTML=rows.map(r=>button(label(r),r.competition_key,r===selected,'data-competition')).join('');
 $('competition-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{selectedKey=b.dataset.competition;render()});
 $('competition-tools').hidden=!selected;$('competition-nav').hidden=!selected;$('group-filter').hidden=true;
 if(!selected){$('title').textContent='Competizioni';$('selected-name').textContent='';$('view').innerHTML='<div class="empty">Nessuna competizione con risultati o calendario nella stagione selezionata.</div>';updateUrl(null,'overview');return}
 $('title').textContent='Competizioni';$('selected-name').textContent=selected.nexus_view;$('group').textContent='IMC · COMPETIZIONI';document.title='Nexus · '+selected.nexus_view;
 const tab=firstRender&&['overview','results','standings','schedule','stats'].includes(p.get('tab'))?p.get('tab'):'overview';firstRender=false;
 updateUrl(selected,tab);
 cleanup=NexusCompetition.mount({season,key:selected.competition_key,name:selected.nexus_view,tab})||(()=>{});
}
let firstRender=true;
try{const c=await NexusUI.ready;season=c.season;$('back').href=url('../');if(!season)throw Error('Nessuna stagione configurata.');const d=await get(url('catalog.php',{season}));all=d.rows||[];const selected=all.find(r=>r.competition_key===selectedKey);const initial=selected?familyOf(selected):families.find(f=>f.id===legacyFamily&&available(f));currentGroup=initial?.group||p.get('group')||families.find(available)?.group||'DOMESTIC';currentFamily=initial?.id||families.find(f=>f.group===currentGroup&&available(f))?.id||'';render()}catch(e){$('view').innerHTML='<div class="empty">'+esc(e.message)+'</div>'}
})();
