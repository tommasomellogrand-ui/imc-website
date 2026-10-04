(()=>{'use strict';
const p=new URLSearchParams(location.search),gw=p.get('world')||localStorage.getItem('imc_nexus_world')||'GW001',id=p.get('manager')||'',view=document.getElementById('view');
localStorage.setItem('imc_nexus_world',gw);document.getElementById('gw').textContent=gw;document.getElementById('back').href='page.html?world='+gw;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let D,scope=p.get('scope')==='national_team'?'national_team':'club',tab='overview',version=0;
const assignments=()=> (D.assignments||[]).filter(a=>a.assignment_type===scope);
const label=a=>a.assignment_name||a.club_name||a.national_name||a.team_name||'Squadra';
function badge(a){const src=String(a.image_url||'').replace(/^http:/i,'https:');return /^(https:\/\/|\/(?!\/))/.test(src)?'<img src="'+esc(src)+'" alt="" onerror="this.hidden=true">':'<span class="manager-crest-placeholder" aria-hidden="true">'+esc(label(a).slice(0,2))+'</span>'}
function teamLink(a,body){return a.world_team_id?'<a class="manager-team-link" href="../teams/detail.html?'+esc(new URLSearchParams({world:gw,type:a.assignment_type==='club'?'club':'nation',id:a.world_team_id}))+'">'+body+'</a>':'<div class="manager-team-link">'+body+'</div>'}
function show(next){
 tab=next;const call=++version;NexusH2H.stop(view);NexusHistory.stop(view);
 document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 document.querySelectorAll('[data-manager-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.managerScope===scope)));
 const q=new URLSearchParams(location.search);q.set('scope',scope);q.set('tab',tab);history.replaceState(null,'','?'+q);
 if(tab==='overview'||tab==='stats'){NexusHistory.mount(view,{world:gw,kind:'manager',id,scope});return;}
 if(tab==='h2h'){NexusH2H.mount(view,{world:gw,kind:'manager',id,name:D.manager.full_name,scope,lockScope:true});return;}
 if(tab==='career'){const rows=assignments();view.innerHTML='<section class="section"><h2>Carriera · '+(scope==='club'?'Club':'Nazionale')+'</h2><div class="card timeline">'+(rows.map(a=>'<div class="job">'+teamLink(a,badge(a)+'<div><b>'+esc(label(a))+'</b><span>'+esc(a.start_date||'Data non disponibile')+' → '+esc(a.end_date||'Attuale')+'</span></div>')+'</div>').join('')||'<p>Nessun incarico disponibile.</p>')+'</div></section>';return;}
 view.innerHTML='<div class="card empty">Caricamento trofei…</div>';
 fetch('../trophies/index.php?'+new URLSearchParams({world:gw,manager:id}),{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok||d.ok===false)throw Error('Trofei non disponibili.');if(call!==version)return;const rows=(d.rows||[]).filter(t=>{const national=t.competition_group==='NATIONS'||['worldcup','interqualifier'].includes(t.trophy_type);return national===(scope==='national_team')});await NexusTrophies.mount(view,rows,gw);}).catch(e=>{if(call===version)view.innerHTML='<div class="card empty">'+esc(e.message)+'</div>'});
}
async function init(){
 try{const r=await fetch('index.php?'+new URLSearchParams({world:gw,manager:id}),{cache:'no-store'});D=await r.json();if(!r.ok||!D.ok||!D.manager)throw Error('Manager non disponibile.');
 document.getElementById('name').textContent=D.manager.full_name;document.getElementById('mid').textContent=id+' · '+gw;
 document.getElementById('assign').innerHTML=['club','national_team'].map(type=>{const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'}),a=(D.assignments||[]).find(x=>x.assignment_type===type&&(!x.start_date||x.start_date<=today)&&(!x.end_date||x.end_date>=today));return '<div class="assignment"><small>'+(type==='club'?'Club':'Nazionale')+'</small>'+(a?teamLink(a,badge(a)+'<b>'+esc(label(a))+'</b>'):'<b>Nessun incarico attivo</b>')+'</div>'}).join('');
 document.querySelectorAll('[data-manager-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.managerScope;show(tab)});
 document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>show(b.dataset.tab));
 show(['overview','career','stats','h2h','trophies'].includes(p.get('tab'))?p.get('tab'):'overview');
 }catch(e){view.innerHTML='<div class="card empty">'+esc(e.message)+'</div>'}
}init();
})();
