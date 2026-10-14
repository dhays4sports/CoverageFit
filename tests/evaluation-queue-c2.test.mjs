import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fixture,reopen,event,seed,NOW,W,P,authority,context,configure,batch,count,snapshot,result} from './helpers/evaluation-queue-fixture.mjs';
const later=ms=>new Date(Date.parse(NOW)+ms).toISOString();
const claim=(f,extra={})=>f.queue.claim({workspace:W,workerId:'worker-1',now:NOW,limit:1,...extra}).claims[0];
async function competitors(path,options={},n=4){
 const workers=Array.from({length:n},(_,i)=>new Worker(new URL('./helpers/evaluation-queue-worker.mjs',import.meta.url),{workerData:{path,now:NOW,workerId:'worker-'+i,...options}}));
 try{
  await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej)})));
  return await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej);w.postMessage('start')})));
 }finally{await Promise.all(workers.map(w=>w.terminate()))}
}
test('C2 automatic admission queues one row; replay coalesces; restart worker retains latest C1 recommendation',()=>{
 const f=fixture();let next;try{
  configure(f);const e=event();f.queue.memory.admit(e,{now:NOW});
  const q=snapshot(f.db);assert.equal(q.target_revision,1);assert.equal(q.state,'READY');
  f.queue.memory.admit(e,{now:NOW});assert.deepEqual(snapshot(f.db),q);
  f.db.close();next=reopen(f.path);
  assert.equal(batch(next.queue).outcomes[0].code,'ACKNOWLEDGED');assert.equal(result(next.db).question_field,'renewal_date');
  next.queue.memory.admit(event('reply',[{field:'renewal_date',value:'2026-10-25',policy_line:'AUTO'},{field:'vehicle_count',value:2}]),{now:NOW});
  batch(next.queue);assert.equal(result(next.db).question_field,'homeowner');
  assert.equal(count(next.db,'cf_evaluation_queue'),1);assert.equal(count(next.db,'cf_evaluation_results'),2);
  assert.equal(next.db.prepare('SELECT max(evidence_revision) n FROM cf_evaluation_results').get().n,2);
 }finally{next?.db.close();f.cleanup()}
});
test('C2 event interruption rolls back queue and evidence together',()=>{
 const f=fixture();try{
  assert.throws(()=>f.queue.memory.admit(event(),{now:NOW,interruptAfterEvent:true}),/interruption/);
  assert.equal(count(f.db,'cf_evidence_events'),0);assert.equal(count(f.db,'cf_evaluation_queue'),0);
  f.db.exec("CREATE TRIGGER synthetic_fail_queue BEFORE INSERT ON cf_evaluation_queue BEGIN SELECT RAISE(ABORT,'queue_interrupted'); END;");
  assert.throws(()=>f.queue.memory.admit(event(),{now:NOW}),/queue_interrupted/);
  for(const t of ['cf_evidence_events','cf_evidence_assertions','cf_evidence_revisions','cf_evaluation_queue'])assert.equal(count(f.db,t),0);
 }finally{f.cleanup()}
});
test('C2 competing real worker connections claim and commit each current generation once',async()=>{
 const f=fixture();try{
  for(let i=0;i<24;i++){const p='parallel-'+i;seed(f.db,p);configure(f,context,p);f.queue.memory.admit(event('input-'+p,undefined,{profile_id:p}),{now:NOW})}
  const reports=await competitors(f.path,{limit:4,drain:true});assert.ok(reports.every(r=>!r.error),JSON.stringify(reports));
  assert.equal(reports.reduce((s,r)=>s+r.completed,0),24);assert.equal(count(f.db,'cf_evaluation_results'),24);
  assert.ok(reports.every(r=>r.maxExamined<=4));assert.equal(f.queue.metrics(W,{now:NOW}).due,0);
  assert.equal(f.db.prepare('SELECT count(*) n FROM (SELECT workspace_id,opportunity_id,generation,count(*) n FROM cf_evaluation_results GROUP BY 1,2,3 HAVING n>1)').get().n,0);
 }finally{f.cleanup()}
});
test('C2 new evidence between evaluation and ack rejects stale work and preserves pending revision',()=>{
 const f=fixture();try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});const c=claim(f),prepared=f.queue.evaluate(c,{now:NOW});
  f.queue.memory.admit(event('call',[{field:'explicit_call_request',value:true}]),{now:NOW});
  assert.equal(f.queue.acknowledge(prepared,{now:NOW}).code,'STALE_REQUEUED');assert.equal(count(f.db,'cf_evaluation_results'),0);
  assert.equal(snapshot(f.db).target_revision,2);assert.equal(snapshot(f.db).state,'READY');
  batch(f.queue);assert.equal(result(f.db).action,'CALL');assert.equal(result(f.db).execution_eligibility.call,false);
  assert.equal(f.queue.acknowledge(prepared,{now:NOW}).code,'LEASE_LOST');assert.equal(count(f.db,'cf_evaluation_results'),1);
 }finally{f.cleanup()}
});
test('C2 crashed worker lease recovers across connection restart and fences the old token',()=>{
 const f=fixture();let reopened;try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});const c=claim(f,{leaseMs:1000}),old=f.queue.evaluate(c,{now:NOW});
  f.db.close();reopened=reopen(f.path);
  assert.equal(reopened.queue.claim({workspace:W,workerId:'recovery',now:later(999),limit:1}).claims.length,0);
  const recovered=reopened.queue.claim({workspace:W,workerId:'recovery',now:later(1000),limit:1}).claims[0];
  assert.equal(recovered.recovered,true);assert.notEqual(recovered.token,c.token);
  assert.equal(reopened.queue.acknowledge(old,{now:later(1000)}).code,'LEASE_LOST');
  assert.equal(reopened.queue.acknowledge(reopened.queue.evaluate(recovered,{now:later(1000)}),{now:later(1000)}).code,'ACKNOWLEDGED');
  assert.equal(reopened.queue.metrics(W,{now:later(1000)}).recoveries,1);
 }finally{reopened?.db.close();f.cleanup()}
});
test('C2 worker thread exits after claiming; another runtime recovers its persisted lease',async()=>{
 const f=fixture();try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});
  const reports=await competitors(f.path,{claimOnly:true,leaseMs:1,limit:1},1);assert.equal(reports[0].claims.length,1);
  const r=batch(f.queue,later(1));assert.equal(r.claims[0].recovered,true);assert.equal(r.outcomes[0].code,'ACKNOWLEDGED');
 }finally{f.cleanup()}
});
test('C2 acknowledgment transaction interruption never leaves a result without queue completion',()=>{
 const f=fixture();try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});const c=claim(f),p=f.queue.evaluate(c,{now:NOW});
  assert.throws(()=>f.queue.acknowledge(p,{now:NOW,interruptAfterDecision:true}),/interruption/);
  assert.equal(count(f.db,'cf_evidence_decisions'),0);assert.equal(count(f.db,'cf_evaluation_results'),0);assert.equal(snapshot(f.db).state,'LEASED');
  assert.equal(f.queue.acknowledge(p,{now:NOW}).code,'ACKNOWLEDGED');
  assert.equal(f.queue.acknowledge(p,{now:NOW}).code,'LEASE_LOST');assert.equal(count(f.db,'cf_evaluation_results'),1);
 }finally{f.cleanup()}
});
test('C2 controlled due time, callback and evidence expiration re-evaluate without a producer request',()=>{
 const f=fixture();try{
  configure(f,{...context,commitments:[{confirmed:true,status:'open',at:later(60000),evidence_ref:'callback-1'}]});
  f.queue.memory.admit(event(),{now:NOW});batch(f.queue);
  assert.equal(result(f.db).action,'LATER');assert.equal(snapshot(f.db).due_at,later(60000));
  assert.equal(batch(f.queue,later(59999)).claims.length,0);batch(f.queue,later(60000));assert.equal(result(f.db).action,'CALL');
  assert.equal(snapshot(f.db).due_at,'2027-01-01T00:00:00.000Z');
 }finally{f.cleanup()}
});
test('C2 time change during evaluation rejects expired recommendation even if caller tampers validity',()=>{
 const f=fixture();try{
  configure(f);f.queue.memory.admit(event('expiring',undefined,{rights:{internal_insurance_use:true,controller:'qa',retain_until:later(1)}}),{now:NOW});
  const c=claim(f),p=f.queue.evaluate(c,{now:NOW});p.valid_until=null;
  assert.equal(f.queue.acknowledge(p,{now:later(1)}).code,'STALE_REQUEUED');
  assert.equal(batch(f.queue,later(1)).outcomes[0].code,'STALE_REQUEUED'); // Cleanup is itself a new revision.
  batch(f.queue,later(1));assert.equal(result(f.db).evidence_refs.length,0);
  assert.equal(count(f.db,'cf_evidence_assertions'),0);
 }finally{f.cleanup()}
});
test('C2 STOP CONTROL missing context takeover and ownership remain effective after restart',()=>{
 const f=fixture();try{
  const cases=[['STOP',{...context,contact:{suppressed:true}}],['NO ACTION',{...context,population:'CONTROL'}],['NO ACTION',{...context,producerTakeover:true}],['CALL',context],['CALL',{...context,workflowOwner:'UNKNOWN'}]];
  cases.forEach(([expected,options],i)=>{const p='safe-'+i;seed(f.db,p);configure(f,options,p);f.queue.memory.admit(event('call-'+p,[{field:'explicit_call_request',value:true}],{profile_id:p}),{now:NOW})});
  seed(f.db,'missing');f.queue.memory.admit(event('call-missing',[{field:'explicit_call_request',value:true}],{profile_id:'missing'}),{now:NOW});
  const reopened=reopen(f.path);try{batch(reopened.queue);}finally{reopened.db.close()}
  cases.forEach(([expected],i)=>{const r=result(f.db,'safe-'+i);assert.equal(r.action,expected);assert.deepEqual(r.execution_eligibility,{sms:false,call:false,external:false,reason:'SHADOW_ONLY'})});
  assert.equal(result(f.db,'missing').action,'NO ACTION');
  assert.equal(result(f.db,'safe-3').workflow_owner,'AGENCYZOOM');assert.equal(result(f.db,'safe-3').context_snapshot.workflowOwner,'AGENCYZOOM');assert.ok(result(f.db,'safe-3').contact_restrictions.includes('EXTERNAL_OR_UNKNOWN_WORKFLOW_OWNER'));
 }finally{f.cleanup()}
});
test('C2 ownership and identity changes fence in-flight work without changing evidence revision',()=>{
 const f=fixture();try{
  const cfg=configure(f);f.queue.memory.admit(event(),{now:NOW});const c=claim(f),p=f.queue.evaluate(c,{now:NOW});
  f.queue.setContext(W,P,{...context,producerTakeover:true},{now:NOW,requestId:'takeover',authority,expectedVersion:cfg.version});
  assert.equal(snapshot(f.db).target_revision,1);assert.equal(f.queue.acknowledge(p,{now:NOW}).code,'STALE_REQUEUED');batch(f.queue);assert.equal(result(f.db).reason_category,'PRODUCER_TAKEOVER');
  seed(f.db,'other');
  f.db.prepare('UPDATE cf_ucp_opportunity_links SET customer_id=?,updated_at=? WHERE workspace_id=? AND opportunity_id=?').run('cust_other',NOW,W,P);
  batch(f.queue);assert.equal(result(f.db).reason_category,'IDENTITY_HOLD');
 }finally{f.cleanup()}
});
test('C2 explicit governed refresh is idempotent, scoped, audited and respects bounds',()=>{
 const f=fixture();try{
  const opts={now:NOW,dueAt:later(60000),requestId:'refresh-1',authority};
  assert.equal(f.queue.requestRefresh(W,P,opts).code,'QUEUED');const q=snapshot(f.db);
  assert.equal(f.queue.requestRefresh(W,P,opts).code,'DUPLICATE');assert.deepEqual(snapshot(f.db),q);
  assert.equal(count(f.db,'cf_solo_activity'),1);assert.equal(batch(f.queue).claims.length,0);
  assert.throws(()=>f.queue.requestRefresh(W,P,{...opts,dueAt:NOW}),/request_id_reused/);
  assert.throws(()=>f.queue.requestRefresh('other',P,opts),/unknown_scoped/);
  for(const limit of [0,101,1.5])assert.throws(()=>claim(f,{limit}),/invalid_bound/);
  assert.equal(batch(f.queue,later(60000)).outcomes[0].code,'ACKNOWLEDGED');
 }finally{f.cleanup()}
});
test('C2 bounded retry, exhaustion and governed recovery never create send work',()=>{
 const f=fixture({maxAttempts:2});try{
  configure(f);const c=claim(f);assert.equal(f.queue.fail(c,{now:NOW}).code,'RETRY');
  assert.equal(batch(f.queue,later(999)).claims.length,0);
  const c2=claim(f,{now:later(1000)});assert.equal(f.queue.fail(c2,{now:later(1000)}).code,'FAILED');
  assert.equal(batch(f.queue,later(100000)).claims.length,0);
  f.queue.requestRefresh(W,P,{now:later(100000),requestId:'recover',authority});assert.equal(batch(f.queue,later(100000)).outcomes[0].code,'ACKNOWLEDGED');
 }finally{f.cleanup()}
});
test('C2 source collision and retraction trigger evaluation; erasure cascades old result traces',()=>{
 const f=fixture();try{
  configure(f);const e=event(),admitted=f.queue.memory.admit(e,{now:NOW});batch(f.queue);
  f.queue.memory.admit(event('first',[{field:'carrier',value:'Different'}]),{now:NOW});assert.equal(snapshot(f.db).state,'READY');
  batch(f.queue);assert.equal(result(f.db).reason_category,'CONFLICTING_EVIDENCE');
  f.queue.memory.erase(W,admitted.event_key,'RETRACTED',{now:NOW});assert.equal(count(f.db,'cf_evaluation_results'),0);assert.equal(snapshot(f.db).last_decision_id,null);
  batch(f.queue);assert.equal(result(f.db).evidence_refs.length,0);
 }finally{f.cleanup()}
});
test('C2 forged decision and reversed clock are rejected with zero network operations',()=>{
 const f=fixture(),old=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('network_forbidden')};
 try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});const c=claim(f),p=f.queue.evaluate(c,{now:NOW});
  p.decision.execution_eligibility.sms=true;assert.throws(()=>f.queue.acknowledge(p,{now:NOW}),/decision_mismatch/);
  assert.throws(()=>f.queue.evaluate(c,{now:later(-1)}),/lease_lost/);
  assert.equal(count(f.db,'cf_evaluation_results'),0);assert.equal(calls,0);
 }finally{globalThis.fetch=old;f.cleanup()}
});
test('C2 deleted safety context triggers fail-closed re-evaluation; CAS prevents two owner changes',()=>{
 const f=fixture();try{
  const a=configure(f);f.queue.memory.admit(event('call',[{field:'explicit_call_request',value:true}]),{now:NOW});batch(f.queue);assert.equal(result(f.db).action,'CALL');
  f.queue.setContext(W,P,{...context,workflowOwner:'UNKNOWN'},{now:NOW,requestId:'owner-1',authority,expectedVersion:a.version});
  assert.throws(()=>f.queue.setContext(W,P,{...context,workflowOwner:'COVERAGEFIT_APPROVED'},{now:NOW,requestId:'owner-2',authority,expectedVersion:a.version}),/context_revision_conflict/);
  f.db.prepare("DELETE FROM cf_solo_sources WHERE workspace_id=? AND kind='signal_c2_context_v1' AND opportunity_id=?").run(W,P);
  batch(f.queue);assert.equal(result(f.db).action,'NO ACTION');assert.equal(result(f.db).workflow_owner,'UNKNOWN');
 }finally{f.cleanup()}
});
test('C2 denied rights and ambiguous new identity do not admit or schedule forbidden facts',()=>{
 const f=fixture();try{
  assert.equal(f.queue.memory.admit(event('denied',undefined,{rights:{}}),{now:NOW}).code,'HOLD_SOURCE_RIGHTS');
  assert.equal(f.queue.memory.admit(event('ambiguous',undefined,{identity:{status:'ambiguous'}}),{now:NOW}).code,'HOLD_IDENTITY_UNVERIFIED');
  assert.equal(count(f.db,'cf_evidence_events'),0);assert.equal(count(f.db,'cf_evaluation_queue'),0);
 }finally{f.cleanup()}
});
test('C2 claim scans remain indexed and bounded when many future timers exist',()=>{
 const f=fixture();try{
  for(let i=0;i<120;i++){const p='bound-'+i;seed(f.db,p);f.queue.requestRefresh(W,p,{now:NOW,dueAt:later(60000),requestId:p,authority})}
  const empty=f.queue.claim({workspace:W,workerId:'bounds',now:NOW,limit:7});assert.equal(empty.examined,0);
  const due=f.queue.claim({workspace:W,workerId:'bounds',now:later(60000),limit:7});assert.equal(due.examined,7);assert.equal(due.claims.length,7);
  const plan=f.db.prepare("EXPLAIN QUERY PLAN SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND state='READY' AND due_at<=? ORDER BY due_at,opportunity_id LIMIT ?").all(W,later(60000),7);
  assert.ok(plan.some(r=>r.detail.includes('cf_eval_due')));assert.equal(f.queue.metrics(W,{now:later(60000)}).due,113);
 }finally{f.cleanup()}
});
test('C2 four competing claimers receive distinct prospect generations and fencing tokens',async()=>{
 const f=fixture();try{
  for(let i=0;i<4;i++){const p='claims-'+i;seed(f.db,p);configure(f,context,p)}
  const reports=await competitors(f.path,{claimOnly:true,limit:1});
  assert.ok(reports.every(r=>r.claims?.length===1),JSON.stringify(reports));
  const claims=reports.flatMap(r=>r.claims);assert.equal(new Set(claims.map(c=>c.opportunity_id)).size,4);assert.equal(new Set(claims.map(c=>c.token)).size,4);
  for(const c of claims)assert.equal(f.queue.acknowledge(f.queue.evaluate(c,{now:NOW}),{now:NOW}).code,'ACKNOWLEDGED');
  assert.equal(count(f.db,'cf_evaluation_results'),4);
 }finally{f.cleanup()}
});
test('C2 future evidence and renewal-window timers change decisions at the justified time',()=>{
 const f=fixture();try{
  configure(f);
  f.queue.memory.admit(event('future',[{field:'renewal_date',value:'2026-12-01',policy_line:'AUTO'},{field:'vehicle_count',value:2}],{observed_at:later(1000)}),{now:NOW});
  batch(f.queue);assert.equal(result(f.db).question_field,'renewal_date');assert.equal(snapshot(f.db).due_at,later(1000));
  batch(f.queue,later(1000));assert.equal(result(f.db).reason_category,'RENEWAL_WINDOW');assert.equal(snapshot(f.db).due_at,'2026-11-01T00:00:00.000Z');
  assert.equal(batch(f.queue,'2026-10-31T23:59:59.999Z').claims.length,0);
  batch(f.queue,'2026-11-01T00:00:00.000Z');assert.equal(result(f.db).question_field,'homeowner');
  assert.equal(snapshot(f.db).due_at,'2026-12-02T00:00:00.000Z');
 }finally{f.cleanup()}
});
test('C2 repeated crashed leases exhaust bounded attempts; newer evidence survives an old failure',()=>{
 const f=fixture({maxAttempts:1});try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});claim(f,{leaseMs:1});
  const exhausted=f.queue.claim({workspace:W,workerId:'new',now:later(1),limit:1});assert.equal(exhausted.examined,1);assert.equal(exhausted.claims.length,0);assert.equal(snapshot(f.db).state,'FAILED');
  f.queue.memory.admit(event('recovery',[{field:'homeowner',value:true}]),{now:later(1)});
  const c=claim(f,{now:later(1)});
  f.queue.memory.admit(event('newer',[{field:'vehicle_count',value:2}]),{now:later(1)});
  assert.equal(f.queue.fail(c,{now:later(1)}).code,'STALE_REQUEUED');assert.equal(snapshot(f.db).target_revision,3);
  batch(f.queue,later(1));assert.equal(result(f.db).question_field,'renewal_date');
 }finally{f.cleanup()}
});
test('C2 successful worker changes only evaluation storage; CRM, SMS, tasks and appointments stay untouched',()=>{
 const f=fixture(),originalFetch=globalThis.fetch;let network=0;globalThis.fetch=()=>{network++;throw Error('external_action_forbidden')};
 try{
  configure(f);f.queue.memory.admit(event('call',[{field:'explicit_call_request',value:true}]),{now:NOW});
  const exempt=new Set(['cf_evaluation_queue','cf_evaluation_results','cf_evidence_decisions']);
  const tables=f.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r=>r.name).filter(n=>!exempt.has(n));
  const snap=()=>Object.fromEntries(tables.map(n=>[n,f.db.prepare('SELECT * FROM "'+n.replaceAll('"','""')+'"').all().map(r=>JSON.stringify(r)).sort()]));
  const before=snap();assert.equal(batch(f.queue).outcomes[0].code,'ACKNOWLEDGED');assert.deepEqual(snap(),before);
  assert.equal(result(f.db).action,'CALL');assert.equal(result(f.db).external_actions,0);assert.equal(network,0);
 }finally{globalThis.fetch=originalFetch;f.cleanup()}
});
test('C2 SIGKILL of an actual child process leaves a durable lease that another runtime recovers',async()=>{
 const f=fixture();let child;
 try{
  configure(f);f.queue.memory.admit(event(),{now:NOW});
  child=spawn(process.execPath,[fileURLToPath(new URL('./helpers/evaluation-queue-crash-process.mjs',import.meta.url)),f.path],{stdio:['ignore','pipe','pipe']});
  const ready=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',d=>{text+=d;if(text.includes('\n'))resolve(JSON.parse(text.trim()))});child.once('error',reject);child.once('exit',(code)=>reject(Error('child exited before claim: '+code)))});
  assert.equal(ready.claimed,1);const stopped=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGKILL');await stopped;
  const reopened=reopen(f.path);try{
   const r=batch(reopened.queue,later(1));assert.equal(r.claims[0].recovered,true);assert.equal(r.outcomes[0].code,'ACKNOWLEDGED');assert.equal(count(reopened.db,'cf_evaluation_results'),1);
  }finally{reopened.db.close()}
 }finally{if(child&&child.exitCode===null&&!child.killed)child.kill('SIGKILL');f.cleanup()}
});
