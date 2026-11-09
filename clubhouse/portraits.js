(()=>{'use strict';
const people=new Map();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function portrait(id,kind='face'){
 const m=people.get(String(id)),raw=String(m?.[kind==='bust'?'bust_image_url':'face_image_url']||'').trim();
 const src=/^(https?:\/\/|\/(?!\/))/i.test(raw)?raw:'';
 return '<span class="manager-portrait manager-portrait--'+(kind==='bust'?'bust':'face')+'" aria-hidden="true">'+(src?'<img src="'+esc(src)+'" alt="" loading="'+(kind==='bust'?'eager':'lazy')+'">':'')+'</span>';
}
document.addEventListener('error',e=>{if(e.target.matches?.('.manager-portrait img'))e.target.remove();},true);
window.ClubhousePortraits={setPeople(rows){people.clear();for(const m of rows)people.set(String(m.manager_id),m);},portrait};
})();
;(()=>{if(document.querySelector('script[src*="/site-assets/names/display.js"]'))return;const s=document.createElement('script');s.src='/site-assets/names/display.js?v=1';document.head.append(s)})();
