const fs=require('fs'),vm=require('vm'),assert=require('assert');
const document={createElement:()=>({}),getElementById:()=>null,head:{append(){}}};
const context=vm.createContext({window:{},document,Intl,NexusUI:{esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}});
vm.runInContext(fs.readFileSync(__dirname+'/../site-assets/world-engine/templates/competitions/row-summary.js','utf8'),context);
const render=context.window.IMCCompetitionRow.render,row={competition_key:'GW001|IMC|clubworldcup',sm_action:'imc_custom',competition_group:'IMC',nexus_view:'RTH Club World Cup'};
let html=render(row);assert(!html.includes('<progress'));assert(html.includes('Data da definire'));assert(!html.includes('0%'));
html=render(row,{status:'In corso',played:19,expected:37,played_days:4,total_days:8,remaining_days:4,complete:false,last_turn:{date:'2026-11-16',label:'Quarti di Finale · Ritorno'},next_turn:{date:'2026-11-20',label:'Semifinali · Andata'}});
assert(html.includes('4 di 8'));assert(html.includes('50%'));assert(html.includes('4 turni da giocare'));assert(!html.includes('partite'));assert(html.includes('Semifinali · Andata'));assert(html.includes('value="4"'));assert(!html.includes('Turno 4 di 5'));
html=render(row,{status:'Conclusa',played:1,expected:1,complete:true},{winner_name:'Club <A>',winner_manager_name:'Manager B',winner_manager_photo_url:'/photo.png'});
assert(html.includes('Club &lt;A&gt;'));assert(html.includes('Manager B'));assert(html.includes('src="/photo.png"'));assert(!html.includes('<A>'));
html=render(row,{league_summary:true,played:5,expected:132,ranking:[{name:'Club A',points:3}]});assert(html.includes('Prima in classifica'));assert(html.includes('3 pt'));
console.log('Competition summary rendering: all checks passed');

html=render(row,{status:'In programma',played_days:0,total_days:4,remaining_days:4});assert(html.includes('0 di 4'));assert(html.includes('Data da definire'));
