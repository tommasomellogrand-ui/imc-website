import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRegistry } from '../platform/core/registry.js';
import { createRegistries } from '../platform/core/registries.js';
import { createRouteCodec } from '../platform/core/router.js';
import { normalizeContext, switchContext } from '../platform/core/context.js';
import { validateDeclaration } from '../platform/core/declaration.js';
import { singleFamily } from '../platform/families/single/contract.js';
import { multiGoldFamily } from '../platform/families/multi-gold/contract.js';
import { creativeFreedom, validateCreativePackage } from '../platform/contracts/creative-freedom.contract.js';
import { validateModel } from '../platform/contracts/components.js';
import { coreBehavior } from '../platform/contracts/core-behavior.contract.js';
import { fixedContextSet } from '../platform/data/selectors/context-entries.js';
import { contextEntry } from '../platform/data/view-models/context-entry.js';
import { sourceState } from '../platform/data/source-state.js';
import { createDataBoundary } from '../platform/data/client.js';
import { createPlatform } from '../platform/core/bootstrap.js';
const json = name => JSON.parse(readFileSync(new URL('./golden-master/'+name, import.meta.url)));
const families = createRegistry(); families.register('SINGLE', singleFamily); families.register('MULTI_GOLD', multiGoldFamily);

test('approved family declarations validate without live imports', () => {
  for (const world of ['GW001','GW007']) {
    const d=json(world+'/declaration.json'); assert.equal(validateDeclaration(d,families).id,d.family); assert.equal(d.liveIntegration,false);
    assert.throws(()=>validateDeclaration({...d,capabilities:[]},families));
  }
  assert.throws(()=>validateDeclaration({...json('GW007/declaration.json'),primaryContext:{provider:'GUESS'}},families));
  assert.ok(Object.isFrozen(singleFamily.navigation.mobile));
});
test('assembly is inert, has instance-local registries and delegates only explicit reads',async()=>{
  let reads=0;
  const config={declaration:json('GW001/declaration.json'),families:[singleFamily,multiGoldFamily],routeMap:json('GW001/routes.json'),
    read:async()=>{reads++;return {rows:[],sourceState:sourceState('empty')}} ,
    creativePackage:{creativeContractVersion:1,...Object.fromEntries(creativeFreedom.packageOwnership.map(k=>[k,{}]))}};
  const a=createPlatform(config),b=createPlatform(config);assert.equal(reads,0);
  a.registries.capabilities.register('archive',{routes:['archive']});assert.equal(b.registries.capabilities.has('archive'),false);
  assert.equal(a.navigation('results').find(x=>x.id==='results').active,true);
  await a.data.read('results');assert.equal(reads,1);
});
test('one creative contract; synthetic radically different package needs no Core change', () => {
  assert.equal(Object.keys(creativeFreedom.guardrails).length,12);
  const pkg={creativeContractVersion:1,...Object.fromEntries(creativeFreedom.packageOwnership.map(k=>[k,{}]))};
  pkg.compositions={home:()=>({scene:'full-bleed typographic constellation'})};
  validateCreativePackage(pkg);
  const r=createRegistries();r.renderers.register('new-world-constellation',{owner:'synthetic-package',render:pkg.compositions.home});
  assert.equal(r.render('new-world-constellation',{}).scene,'full-bleed typographic constellation');
  assert.throws(()=>validateCreativePackage({...pkg,semanticOverrides:{layout:'grid'}}));
});
test('route codec covers every actual destination and unicode deep links',()=>{
  for (const world of ['GW001','GW007']) {
    const mapping=json(world+'/routes.json'), codec=createRouteCodec(mapping);
    for (const [route,spec] of Object.entries(mapping.routes)) {
      const params=Object.fromEntries(spec.query.map(k=>[k,k==='name'?'Académica & Roma':k==='k'?'ITA':k==='division'?'2':'367418672']));
      assert.deepEqual(codec.parse(codec.serialize({route,params})),{route,params,hash:''});
    }
    assert.equal(codec.parse(mapping.basePath).route,'home');
    const anchored=codec.serialize({route:'home',hash:'#capitolo%20uno'});
    assert.equal(codec.serialize(codec.parse(anchored)),anchored);
    assert.equal(codec.parse(mapping.basePath+'missing.html').route,'not-found');
    assert.equal(codec.parse('/other/index.html').route,'not-found');
    assert.throws(()=>codec.serialize({route:'missing'}));
    assert.equal(codec.serialize({route:'home',params:{ignored:'secret'}}),mapping.basePath+'index.html');
  }
});
test('context normalizes parent-dependent division and uses declared fallback',()=>{
  const dims=[{key:'id',values:['A','B']},{key:'division',values:s=>s.id==='A'?['1','2']:['1']}];
  assert.deepEqual(normalizeContext({id:'A',division:'2',hidden:'x'},dims),{id:'A',division:'2'});
  assert.deepEqual(switchContext({route:'results',context:{id:'A',division:'2'}},{id:'B'},multiGoldFamily,dims),{route:'results',context:{id:'B'}});
  assert.equal(switchContext({route:'home',context:{}},{id:'A'},multiGoldFamily,dims).route,'context-detail');
});
test('fixed territory selection retains complete set and rejects invented/duplicate entries',()=>{
  const entries=json('GW007/declaration.json').primaryContext.entries;
  assert.deepEqual(fixedContextSet(entries).primary.map(x=>x.contextId),['ENG','ESP','GER','ITA']);
  assert.equal(fixedContextSet([...entries,{contextId:'EXTRA',label:'Additional context'}]).complete.length,5);
  assert.equal(fixedContextSet(entries.slice(0,2)).primary.length,2);
  assert.throws(()=>fixedContextSet([...entries,entries[0]]));
  assert.throws(()=>fixedContextSet(entries,['MISSING']));
  const vm=contextEntry(entries[0],sourceState('ready',{provenance:'fixture'}),'context-detail');
  validateModel('contextEntry',vm);
  assert.throws(()=>validateModel('contextEntry',{...vm,html:'<div/>'}));
});
test('registry prevents silent overrides; render validation and lifecycle cleanup',()=>{
  const r=createRegistries(),events=[];
  r.capabilities.register('archive',{routes:['archive']});
  assert.throws(()=>r.capabilities.register('archive',{routes:[]}));
  assert.throws(()=>r.renderers.get('missing'));
  r.renderers.register('context',{owner:'test',semanticKind:'contextEntry',render:m=>m.label});
  assert.throws(()=>r.render('context',{}));
  r.extensions.register('a',{mount:()=>{events.push('a');return ()=>events.push('-a')}});
  r.extensions.register('b',{mount:()=>{events.push('b');return ()=>events.push('-b')}});
  const dispose=r.mount({});dispose();dispose();assert.deepEqual(events,['a','b','-b','-a']);
});
test('all source states preserve provenance; no invented zero or implicit network',async()=>{
  for (const status of coreBehavior.data.states) assert.equal(sourceState(status).status,status);
  assert.throws(()=>sourceState('invented'));
  const rows=[{score:null}],boundary=createDataBoundary(async()=>({rows,sourceState:sourceState('stale'),nextCursor:'next'}));
  const result=await boundary.read('match');assert.equal(result.rows[0].score,null);assert.equal(result.nextCursor,'next');
  result.rows[0].score=5;assert.equal(rows[0].score,null);
  const controller=new AbortController();controller.abort();await assert.rejects(boundary.read('match',{signal:controller.signal}));
  await assert.rejects(createDataBoundary(async()=>({})).read('match'));
});
test('platform contains no world identifiers, DOM templates or production endpoint',()=>{
  const root=resolve(import.meta.dirname,'../platform');
  for (const entry of readdirSync(root,{recursive:true})) {
    if (!entry.endsWith('.js')) continue;
    const source=readFileSync(resolve(root,entry),'utf8');
    assert.doesNotMatch(source,/GW00[17]|italianmastersclub\.it|innerHTML|document\.createElement/,entry);
  }
});
test('both responsive matrices have verified observed headings, not assumed routes',()=>{
  const evidence=json('browser-evidence/review.json');
  const required={GW001:['index','competitions','results','schedule','standings','match','archive'],GW007:['index','world','kingdom','map','results','schedule','standings','match']};
  for(const [world,routes] of Object.entries(required)) for(const width of [390,1440]) for(const route of routes){
    const entry=evidence.find(e=>e.world===world&&e.width===width&&e.route===route);
    assert.equal(entry?.verified,true,`${world}/${width}/${route}`);
    const snapshot=readFileSync(new URL(`./golden-master/browser-evidence/${world}-${width}-${route}.md`,import.meta.url),'utf8');
    assert.ok(snapshot.includes(entry.expectedHeading),`${world}/${width}/${route} heading`);
  }
});
