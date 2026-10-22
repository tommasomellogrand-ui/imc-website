const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=require('../nexus/alltoplayfor/2026-10-22-coffee.json');
assert.equal(data.divisions.length,4);assert.equal(data.portraits.length,3);
const fixtures=data.divisions.flatMap(d=>d.fixtures);assert.equal(new Set(fixtures.map(f=>f.id)).size,20);
for(const d of data.divisions){assert.equal(d.fixtures.length,5);assert.equal(d.intro.length,3);for(const f of d.fixtures){assert.equal(f.time,'22:00');assert(f.recovery_text);for(const r of Object.values(f.recovery)){assert(r.date<data.date);assert.equal(r.days_between,(Date.parse(data.date)-Date.parse(r.date))/86400000);assert(r.source.startsWith('https://www.italianmastersclub.it/'))}}}
for(const p of data.portraits)assert(fs.existsSync(__dirname+'/../nexus/alltoplayfor/'+p.image));
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset=new Proxy({},{set:(o,k,v)=>{o[k]=String(v);return true}});this.events={};this.hidden=false;this.className=''}
 append(...nodes){this.children.push(...nodes)}
 setAttribute(k,v){this.attrs[k]=v}
 addEventListener(k,v){this.events[k]=v}
 replaceChildren(){this.children=[]}
 insertBefore(a,b){this.children.splice(this.children.indexOf(b),0,a)}
 querySelector(s){return this.querySelectorAll(s)[0]}
 querySelectorAll(s){const all=this.children.flatMap(n=>[n,...n.querySelectorAll('*')]);if(s==='*')return all;if(s.includes(' ')){const [p,c]=s.split(' ');return this.querySelectorAll(p).flatMap(n=>n.querySelectorAll(c))}return all.filter(n=>s.startsWith('.')?n.className.split(' ').includes(s.slice(1)):n.tag===s)}
 focus(){this.focused=true}
}
const panel=new Element('section'),pending=new Element('p');pending.className='programme-pending';panel.append(pending);const date={value:'2026-10-22'},events={};
const document={getElementById:id=>id==='date'?date:panel,createElement:t=>new Element(t),addEventListener:(k,f)=>events[k]=f};
vm.runInNewContext(fs.readFileSync(__dirname+'/../nexus/alltoplayfor/coffee.js','utf8'),{document,fetch:async()=>({ok:true,json:async()=>data}),console});
setImmediate(()=>{
 const panels=panel.querySelectorAll('.coffee-division'),buttons=panel.querySelectorAll('.coffee-divisions button');assert.equal(panels.length,4);assert.equal(buttons.length,4);
 assert(panels.every(p=>p.hidden));assert(buttons.every(b=>b.attrs['aria-selected']==='false'));assert.equal(buttons[0].tabIndex,0);assert.equal(panel.querySelectorAll('.coffee-schedule-match').length,20);
 for(let i=0;i<4;i++){buttons[i].events.click();assert.deepEqual(panels.map(p=>p.hidden),[0,1,2,3].map(j=>j!==i));assert.equal(buttons[i].attrs['aria-selected'],'true');assert.equal(panels[i].querySelectorAll('.coffee-fixture').length,5)}
 const tabs=panel.querySelector('.coffee-divisions');tabs.events.keydown({key:'Home',preventDefault(){}});assert.equal(panels[0].hidden,false);
 assert.equal(panel.querySelectorAll('.coffee-speaker').length,16);assert.equal(panel.querySelectorAll('.coffee-recovery').length,20);
 panel.querySelector('.coffee-back').events.click();assert(panels.every(p=>p.hidden));assert.equal(panel.querySelector('.coffee-back').hidden,true);
 date.value='2026-10-20';events['programme-date-change']();assert.equal(panel.querySelector('.coffee-edition').hidden,true);assert.equal(pending.hidden,false);
 date.value='2026-10-22';events['programme-date-change']();assert.equal(panel.querySelector('.coffee-edition').hidden,false);
 console.log('Coffee Time: 20 fixtures, 40 prior results, 3 portraits, 4 exclusive keyboard-accessible tabs and date isolation verified');
});
