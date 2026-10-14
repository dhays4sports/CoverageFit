import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {Worker} from 'node:worker_threads';
import {readFileSync} from 'node:fs';
import {fixture,seed,event,configure,context,batch,snapshot,W,P,NOW,authority as mutationAuthority,reopen} from './helpers/evaluation-queue-fixture.mjs';
import {views,request,authority} from './helpers/producer-intelligence-fixture.mjs';
import {producerIntelligenceLocal} from '../server/producer-intelligence-local.mjs';
import {commandCenterPreview} from '../server/producer-command-center.mjs';
import {compareAttention} from '../server/attention-priority.mjs';
const later=n=>new Date(Date.parse(NOW)+n).toISOString();
function add(f,p=P,claims=[{field:'explicit_call_request',value:true}],options=context){
 seed(f.db,p);configure(f,options,p);assert.equal(f.queue.memory.admit(event('request-'+p,claims,{profile_id:p}),{now:NOW}).code,'ADMITTED');
}
const drain=f=>{let n=0;for(;;){const b=batch(f.queue,NOW,{limit:100});if(!b.claims.length)return n;assert.ok(b.outcomes.every(x=>x.code==='ACKNOWLEDGED'));n+=b.outcomes.length}};
const candidate=(f,p=P)=>f.db.prepare('SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND opportunity_id=?').get(W,p);
const change=(f,options,p=P)=>f.queue.setContext(W,p,options,{now:NOW,requestId:'change-'+p,authority:mutationAuthority,expectedVersion:f.queue.context(W,p).version});
function noExecution(row){for(const k of ['sms','call','calendar','crm','external'])assert.equal(row.execution_authority[k],false);assert.equal(row.actionable,false)}
test('global attention: 2000 earlier nonurgent persisted prospects cannot hide last-ID CALL and quote',async()=>{
 const f=fixture(),old=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('no external action')};try{
  for(let i=0;i<2000;i++)add(f,'aaa-'+String(i).padStart(5,'0'),[{field:'carrier',value:'AAA'}]);
  add(f,'zzz-call');add(f,'zzz-quote',[{field:'explicit_quote_request',value:true}]);assert.equal(drain(f),2002);
  const before=f.db.prepare('SELECT total_changes() n').get().n,svc=views(f),r=await svc.today(request());
  assert.deepEqual(r.today.map(x=>x.opportunity_id),['zzz-call','zzz-quote']);r.today.forEach(noExecution);
  assert.equal(r.selection_coverage.candidate_rows_read,2);assert.equal(r.selection_coverage.candidates_validated,2);
  const c=candidate(f,'zzz-call'),stored=JSON.parse(c.attention_json);assert.equal(stored.decision_id,c.last_decision_id);assert.equal(stored.evidence_revision,c.target_revision);assert.equal(stored.queue_generation,c.generation);
  assert.equal(f.db.prepare('SELECT total_changes() n').get().n,before);assert.equal(calls,0);
 }finally{globalThis.fetch=old;f.cleanup()}
});
for(const [name,options] of [['STOP',{...context,contact:{suppressed:true}}],['CONTROL',{...context,population:'CONTROL'}],['wrong number',{...context,contact:{wrong_number:true}}],['takeover',{...context,producerTakeover:true}],['unknown owner',{...context,workflowOwner:'UNKNOWN'}]])test('global attention: '+name+' invalidates before read and stays excluded after evaluation',async()=>{
 const f=fixture();try{add(f);drain(f);assert.equal(candidate(f).attention_eligible,1);change(f,options);assert.equal(candidate(f).attention_eligible,0);
 assert.equal((await views(f).today(request())).today.length,0);drain(f);assert.equal(candidate(f).attention_eligible,0);assert.equal((await views(f).today(request())).today.length,0);
 }finally{f.cleanup()}
});
test('global attention: evidence, identity, retraction and source relink invalidate persisted candidates',async()=>{
 for(const kind of ['evidence','identity','retraction','source']){const f=fixture();try{add(f);drain(f);
  if(kind==='evidence')f.queue.memory.admit(event('new',[{field:'vehicle_count',value:2}]),{now:NOW});
  if(kind==='identity'){seed(f.db,'other');f.db.prepare('UPDATE cf_ucp_opportunity_links SET customer_id=? WHERE workspace_id=? AND opportunity_id=?').run('cust_other',W,P)}
  if(kind==='retraction')f.queue.memory.erase(W,f.queue.memory.eventKey(event('request-'+P)),'RETRACTED',{now:NOW});
  if(kind==='source'){seed(f.db,'other');f.db.prepare("UPDATE cf_solo_sources SET opportunity_id='other' WHERE workspace_id=? AND kind='synthetic' AND source_id=?").run(W,'source_'+P)}
  assert.equal(candidate(f).attention_eligible,0);assert.equal((await views(f).today(request())).today.length,0);
 }finally{f.cleanup()}}
});
test('global attention: stale worker cannot publish rank; interrupted acknowledgment rolls it back',async()=>{
 const f=fixture();try{add(f);const claim=f.queue.claim({workspace:W,now:NOW,workerId:'old',limit:1}).claims[0],prepared=f.queue.evaluate(claim,{now:NOW});
  change(f,{...context,contact:{suppressed:true}});assert.equal(f.queue.acknowledge(prepared,{now:NOW}).code,'STALE_REQUEUED');assert.equal(candidate(f).attention_eligible,0);
  drain(f);assert.equal((await views(f).today(request())).today.length,0);assert.equal(f.queue.acknowledge(prepared,{now:NOW}).code,'LEASE_LOST');
 }finally{f.cleanup()}
 const g=fixture();try{add(g);const c=g.queue.claim({workspace:W,now:NOW,workerId:'x',limit:1}).claims[0],p=g.queue.evaluate(c,{now:NOW});
  assert.throws(()=>g.queue.acknowledge(p,{now:NOW,interruptAfterDecision:true}));assert.equal(candidate(g).attention_eligible,0);assert.equal(g.db.prepare('SELECT count(*) n FROM cf_evaluation_results').get().n,0);
  g.db.exec("CREATE TRIGGER reject_candidate BEFORE UPDATE OF attention_json ON cf_evaluation_queue WHEN NEW.attention_eligible=1 BEGIN SELECT RAISE(ABORT,'candidate_interrupted'); END;");
  assert.throws(()=>g.queue.acknowledge(p,{now:NOW}),/candidate_interrupted/);assert.equal(g.db.prepare('SELECT count(*) n FROM cf_evaluation_results').get().n,0);assert.equal(candidate(g).attention_eligible,0);
  g.db.exec('DROP TRIGGER reject_candidate');
  g.queue.acknowledge(p,{now:NOW});assert.equal(candidate(g).attention_eligible,1);
 }finally{g.cleanup()}
});
test('global attention: competing worker connections publish one candidate per committed generation',async()=>{
 const f=fixture();let workers=[];try{for(let i=0;i<24;i++)add(f,'race-'+String(i).padStart(2,'0'));
  workers=Array.from({length:3},(_,i)=>new Worker(new URL('./helpers/evaluation-queue-worker.mjs',import.meta.url),{workerData:{path:f.path,now:NOW,workerId:'race-'+i,limit:3,drain:true}}));
  await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej)})));
  const reports=await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej);w.postMessage('start')})));
  assert.ok(reports.every(r=>!r.error));assert.equal(reports.reduce((n,r)=>n+r.completed,0),24);
  assert.equal(f.db.prepare('SELECT count(*) n FROM cf_evaluation_queue WHERE attention_eligible=1').get().n,24);
  assert.equal((await views(f).attention(request())).records.length,24);
 }finally{await Promise.all(workers.map(w=>w.terminate()));f.cleanup()}
});
test('global attention: future timer retains CURRENT; due boundary and crashed lease never expose old action',async()=>{
 const f=fixture();let next;try{add(f);drain(f);const q=candidate(f);assert.equal(q.state,'READY');assert.equal(q.reason_mask,16);assert.equal(JSON.parse(q.attention_json).queue_generation,q.generation);
  assert.equal((await views(f,{clock:()=>later(1000)}).today(request())).today.length,1);
  const due=q.due_at;assert.equal((await views(f,{clock:()=>due}).today(request())).today.length,0);
  const claim=f.queue.claim({workspace:W,now:due,workerId:'crash',limit:1,leaseMs:10}).claims[0];assert.ok(claim);assert.equal(candidate(f).attention_eligible,0);
  f.db.close();next=reopen(f.path);const at=new Date(Date.parse(due)+10).toISOString();assert.equal((await views(next,{clock:()=>at}).today(request())).today.length,0);
  const recovered=next.queue.claim({workspace:W,now:at,workerId:'recover',limit:1}).claims[0];assert.ok(recovered.recovered);
 }finally{next?.db.close();f.cleanup()}
});
test('global attention: binary tie ordering, due commitments, bounded empty filters and wrapper continuation',async()=>{
 const f=fixture();try{
  const ids=['Zed','a-b','a.b','a_b','aaa'];for(const id of ids)add(f,id);
  for(const [id,at] of [['due-new','2026-10-14T11:00:00.000Z'],['due-old','2026-10-14T10:00:00.000Z']])add(f,id,undefined,{...context,commitments:[{confirmed:true,status:'open',evidence_ref:id,at}]});drain(f);
  const svc=views(f),all=[];let after='';do{const p=await svc.attention(request(),{limit:2,after});assert.ok(p.selection_coverage.candidate_rows_read<=3);all.push(...p.records);after=p.next_cursor}while(after);
  assert.deepEqual(all.map(x=>x.id),['due-old','due-new',...ids]);assert.deepEqual([...all].sort(compareAttention).map(x=>x.id),all.map(x=>x.id));
  const filtered=await svc.today(request(),{limit:1,q:'not a matching person'});assert.equal(filtered.today.length,0);assert.ok(filtered.next_cursor);
  const center=await commandCenterPreview({scope:{workspace:W},db:f.db},{CF_COMMAND_CENTER_READONLY_ENABLED:'1'},{intelligence:svc,request:request('?limit=1')});assert.equal(center.today[0].opportunity_id,'due-old');assert.ok(center.next_cursor);assert.equal(center.selection_coverage.window_limit,1);
  const second=await commandCenterPreview({scope:{workspace:W},db:f.db},{CF_COMMAND_CENTER_READONLY_ENABLED:'1'},{intelligence:svc,request:request('?limit=1&after='+encodeURIComponent(center.next_cursor))});assert.equal(second.today[0].opportunity_id,'due-new');
 }finally{f.cleanup()}
});
test('global attention: tenant scope and 100-record allowlist stay bounded, without wide SQL bindings',async()=>{
 const f=fixture();try{add(f);drain(f);const ids=[P,...Array.from({length:99},(_,i)=>'absent-'+i)];let max=0;
  const db={get isTransaction(){return f.db.isTransaction},exec:s=>f.db.exec(s),prepare(s){const p=f.db.prepare(s);return new Proxy(p,{get(o,k){if(typeof o[k]!=='function')return o[k];return (...args)=>{max=Math.max(max,args.length);return o[k](...args)}}})}};
  const svc=views(f,{store:producerIntelligenceLocal(db,{syntheticOnly:true}),authorize:authority({workspace:W,actor:'test',recordIds:ids})});
  const page=await svc.today(request('?workspace=other'));assert.equal(page.today.length,1);assert.equal(page.selection_coverage.scope_rows_examined,100);assert.ok(max<=6);
  await assert.rejects(svc.today(new Request('https://synthetic.test')));const foreign=views(f,{authorize:authority({workspace:'foreign',actor:'test',workspaceRead:true})});assert.equal((await foreign.today(request())).today.length,0);
  const denied=views(f,{authorize:authority({workspace:W,actor:'test',recordIds:[]})});assert.equal((await denied.today(request())).today.length,0);
 }finally{f.cleanup()}
});
test('global attention: read-only reopen reproduces selection; missing schema and corrupt candidates fail closed',async()=>{
 const f=fixture();let ro;try{add(f);drain(f);const a=await views(f).today(request()),before=f.db.prepare('SELECT total_changes() n').get().n;
  ro=new DatabaseSync(f.path,{readOnly:true});const b=await views({db:ro}).today(request());assert.deepEqual(b.today,a.today);assert.equal(f.db.prepare('SELECT total_changes() n').get().n,before);ro.close();ro=null;
  f.db.prepare("UPDATE cf_evaluation_queue SET attention_json='{}'").run();assert.equal((await views(f).today(request())).today.length,0);
  f.db.exec('ALTER TABLE cf_evaluation_queue RENAME COLUMN attention_json TO incompatible');assert.equal((await views(f).today(request())).reason,'ATTENTION_MIGRATION_UNAVAILABLE');
 }finally{ro?.close();f.cleanup()}
});
test('global attention: bounded window discloses expired candidate holes and evaluation backlog',async()=>{
 const f=fixture();try{for(const p of ['a','b','c'])add(f,p);drain(f);const at=candidate(f,'a').due_at;
  const page=await views(f,{clock:()=>at}).today(request(),{limit:1});assert.equal(page.today.length,0);assert.ok(page.next_cursor);assert.equal(page.selection_coverage.candidates_validated,1);assert.equal(page.selection_coverage.rejected_candidates,1);assert.equal(page.selection_coverage.pending_evaluation,true);assert.equal(page.selection_coverage.completeness,'LIMITED');
 }finally{f.cleanup()}
});
test('global attention: real indexed seek has no temporary sort and browser preserves next-page controls',()=>{
 const f=fixture();try{
  const plan=f.db.prepare('EXPLAIN QUERY PLAN SELECT opportunity_id FROM cf_evaluation_queue INDEXED BY cf_eval_attention WHERE workspace_id=? AND attention_eligible=1 AND (attention_order,attention_due,opportunity_id)>(?,?,?) ORDER BY attention_order,attention_due,opportunity_id LIMIT ?').all(W,-120,'9999','a',26).map(x=>x.detail).join(' ');
  assert.match(plan,/SEARCH.*cf_eval_attention/);assert.doesNotMatch(plan,/SCAN|TEMP B-TREE/);
  const ui=readFileSync(new URL('../assets/js/producer-command-center.mjs',import.meta.url),'utf8');assert.match(ui,/data-cc-next/);assert.match(ui,/encodeURIComponent\(after\)/);assert.match(ui,/selection_coverage/);
 }finally{f.cleanup()}
});
test('global attention: failed evaluation and owner changes remove old rank with explicit coverage',async()=>{
 const f=fixture({maxAttempts:1});try{add(f, P,undefined,{...context,workflowOwner:'COVERAGEFIT_APPROVED'});drain(f);
  change(f,context);assert.equal(candidate(f).attention_eligible,0);drain(f);assert.equal((await views(f).today(request())).today[0].current_decision.workflow_owner,'AGENCYZOOM');
  f.queue.requestRefresh(W,P,{now:NOW,requestId:'failure',authority:mutationAuthority});const c=f.queue.claim({workspace:W,now:NOW,workerId:'fail',limit:1}).claims[0];f.queue.fail(c,{now:NOW});
  const result=await views(f).today(request());assert.equal(result.today.length,0);assert.equal(result.selection_coverage.failed_evaluation,true);assert.equal(candidate(f).attention_eligible,0);
 }finally{f.cleanup()}
});
test('global attention: newly reprioritized work is visible on first-page refresh, not a frozen old cursor',async()=>{
 const f=fixture();try{add(f,'aaa',[{field:'carrier',value:'AAA'}]);add(f,'middle');add(f,'zzz');drain(f);const svc=views(f),first=await svc.attention(request(),{limit:1});assert.equal(first.records[0].id,'middle');
  f.queue.memory.admit(event('new-call',[{field:'explicit_call_request',value:true}],{profile_id:'aaa'}),{now:NOW});drain(f);
  const refreshed=await svc.attention(request(),{limit:1});assert.equal(refreshed.records[0].id,'aaa');
  const continued=await svc.attention(request(),{limit:1,after:first.next_cursor});assert.equal(continued.records[0].id,'zzz');assert.equal(continued.selection_coverage.restart_from_first_page_for_new_priority,true);
 }finally{f.cleanup()}
});
