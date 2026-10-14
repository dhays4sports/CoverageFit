// Characterization of demonstrated release blockers, not acceptance of global
// Today completeness or certification of a hosted D1 adapter.
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,seed,event,configure,context,batch,W,NOW} from './helpers/evaluation-queue-fixture.mjs';
import {views,request,authority} from './helpers/producer-intelligence-fixture.mjs';
import {commandCenterPreview} from '../server/producer-command-center.mjs';
import {producerIntelligenceLocal} from '../server/producer-intelligence-local.mjs';

function admitted(f,id,call=false){
 seed(f.db,id);configure(f,context,id);
 assert.equal(f.queue.memory.admit(event('source-'+id,[{field:call?'explicit_call_request':'carrier',value:call?true:'AAA'}],{profile_id:id}),{now:NOW}).code,'ADMITTED');
}
test('readiness blocker: ID-first C4 pages omit a later CURRENT CALL from initial Today',async()=>{
 const f=fixture(),original=globalThis.fetch;let external=0;
 globalThis.fetch=()=>{external++;throw Error('external operation forbidden')};
 try{
  for(let i=0;i<25;i++)admitted(f,'aaa-'+String(i).padStart(3,'0'));
  admitted(f,'zzz-urgent',true);batch(f.queue,NOW,{limit:100});
  const svc=views(f),before=f.db.prepare('SELECT total_changes() n').get().n;
  const urgent=await svc.detail(request(),'zzz-urgent');
  assert.equal(urgent.current_decision.status,'CURRENT');assert.equal(urgent.human_attention_eligible,true);
  const first=await svc.today(request());assert.equal(first.today.length,0);assert.ok(first.next_cursor);
  const second=await svc.today(request(),{after:first.next_cursor});
  assert.equal(second.today[0].opportunity_id,'zzz-urgent');assert.equal(second.today[0].execution_authority.call,false);
  const center=await commandCenterPreview({scope:{workspace:W},db:f.db},{CF_COMMAND_CENTER_READONLY_ENABLED:'1'},{intelligence:svc,request:request()});
  assert.equal(center.today.length,0);assert.equal(center.scope,'BOUNDED_PAGE_ONLY');
  // Existing wrapper drops the service cursor. Do not mistake empty Today for
  // an empty global attention queue; fix selection before any hosted activation.
  assert.equal(center.next_cursor,undefined);
  assert.equal(f.db.prepare('SELECT total_changes() n').get().n,before);assert.equal(external,0);
 }finally{globalThis.fetch=original;f.cleanup()}
});
test('readiness blocker: local query fan-out and 100-record allowlist need D1-specific planning',async t=>{
 const f=fixture();try{
  const ids=Array.from({length:100},(_,i)=>'bounded-'+String(i).padStart(3,'0'));
  for(const id of ids.slice(0,25))admitted(f,id,true);batch(f.queue,NOW,{limit:100});
  let statements=0,maxBindings=0;
  const db={get isTransaction(){return f.db.isTransaction},exec(sql){return f.db.exec(sql)},prepare(sql){
   const stmt=f.db.prepare(sql);return new Proxy(stmt,{get(target,key){
    const fn=target[key];if(typeof fn!=='function')return fn;
    return (...args)=>{statements++;maxBindings=Math.max(maxBindings,args.length);return fn.apply(target,args)};
   }});
  }};
  const store=producerIntelligenceLocal(db,{syntheticOnly:true}),svc=views(f,{store,authorize:authority({workspace:W,actor:'test',recordIds:ids})});
  const before=f.db.prepare('SELECT total_changes() n').get().n;statements=0;
  const page=await svc.list(request());assert.equal(page.records.length,25);
  assert.ok(page.records.every(r=>r.current_decision.status==='CURRENT'));
  // These characterize the local algorithm. Neither is a hosted D1 request.
  assert.ok(statements>50);assert.equal(maxBindings,103);
  assert.equal(f.db.prepare('SELECT total_changes() n').get().n,before);
  t.diagnostic(JSON.stringify({records:page.records.length,sqlite_statements:statements,max_bound_parameters:maxBindings,sqlite_changes:0}));
 }finally{f.cleanup()}
});
