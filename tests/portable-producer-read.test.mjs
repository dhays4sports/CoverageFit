import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {fixture,binding,portableViews} from './helpers/portable-read-fixture.mjs';
import {seed,event,configure,context,batch,W,P,NOW,authority as mutationAuthority} from './helpers/evaluation-queue-fixture.mjs';
import {views,request,authority} from './helpers/producer-intelligence-fixture.mjs';
import {producerIntelligencePortable} from '../server/producer-intelligence-portable.mjs';
import {producerReadSQL,READ_BUDGET} from '../server/producer-intelligence-sql.mjs';
const later=n=>new Date(Date.parse(NOW)+n).toISOString();
function add(f,p=P,claims=[{field:'explicit_call_request',value:true}],ctx=context){seed(f.db,p);configure(f,ctx,p);assert.equal(f.queue.memory.admit(event('request-'+p,claims,{profile_id:p}),{now:NOW}).code,'ADMITTED')}
function drain(f){for(;;){const b=batch(f.queue,NOW,{limit:100});if(!b.claims.length)return;assert.ok(b.outcomes.every(x=>x.code==='ACKNOWLEDGED'))}}
const change=(f,c,p=P)=>f.queue.setContext(W,p,c,{now:NOW,requestId:'update-'+p,authority:mutationAuthority,expectedVersion:f.queue.context(W,p).version});
const strip=r=>{const {read_metrics,...rest}=r;return rest};
test('portable read: one atomic SELECT, eight binds, canonical C3 parity for 25 CURRENT prospects',async()=>{
 const f=fixture(),old=globalThis.fetch;let external=0;globalThis.fetch=()=>{external++;throw Error('external forbidden')};try{
  for(let i=0;i<25;i++)add(f,'p-'+String(i).padStart(3,'0'),[{field:i%2?'explicit_call_request':'explicit_quote_request',value:true}]);drain(f);
  const v=portableViews(f),before=f.db.prepare('SELECT total_changes() n').get().n;
  const local=await views(f).today(request()),portable=await v.service.today(request());
  assert.deepEqual(portable.today,local.today);assert.equal(portable.today.length,25);assert.equal(v.db.receipts.length,1);assert.equal(v.db.receipts[0].args.length,8);
  assert.equal(portable.read_metrics.queries,1);assert.ok(portable.read_metrics.sql_bytes<100000);assert.ok(portable.read_metrics.response_bytes<40*70000);
  assert.equal(f.db.prepare('SELECT total_changes() n').get().n,before);assert.equal(external,0);for(const r of portable.today){assert.equal(r.actionable,false);assert.ok(Object.entries(r.execution_authority).filter(([k])=>k!=='reason').every(([,v])=>v===false))}
 }finally{globalThis.fetch=old;f.cleanup()}
});
test('portable read: historical corrections, supersession, conflicting renewals and hashes match canonical local reader',async()=>{
 const f=fixture();try{add(f);for(let i=0;i<20;i++)f.queue.memory.admit(event('history-'+i,[{field:'carrier',value:'Carrier '+i}],{observed_at:new Date(Date.parse(NOW)-3600000+i*1000).toISOString()}),{now:NOW});
  assert.equal(f.queue.memory.admit(event('correction',[{field:'carrier',value:'Corrected',producer_verified:true,supersedes_source_type:'sms_inbound',supersedes_source_event_id:'history-19'}],{source_type:'producer_confirmation',observed_at:NOW}),{now:NOW}).code,'ADMITTED');
  assert.equal(f.db.prepare('SELECT count(*) n FROM cf_evidence_assertions WHERE superseded_at IS NOT NULL').get().n,1);
  f.queue.memory.admit(event('renewal-a',[{field:'renewal_date',value:'2026-11-01',policy_line:'auto'}]),{now:NOW});
  f.queue.memory.admit(event('renewal-b',[{field:'renewal_date',value:'2026-12-01',policy_line:'auto'}]),{now:NOW});drain(f);
  const local=await views(f).detail(request(),P),portable=await portableViews(f).service.detail(request(),P);assert.deepEqual(portable.current_decision,local.current_decision);
  assert.notEqual(portable.current_decision.status,'UNAVAILABLE');
 }finally{f.cleanup()}
});
for(const [name,ctx] of [['STOP',{...context,contact:{suppressed:true}}],['CONTROL',{...context,population:'CONTROL'}],['wrong number',{...context,contact:{wrong_number:true}}],['takeover',{...context,producerTakeover:true}],['unknown owner',{...context,workflowOwner:'UNKNOWN'}]])test('portable read: '+name+' invalidates and remains held',async()=>{
 const f=fixture();try{add(f);drain(f);change(f,ctx);const v=portableViews(f);assert.equal((await v.service.today(request())).today.length,0);assert.equal((await v.service.detail(request(),P)).current_decision.status,'HELD');drain(f);assert.equal((await v.service.today(request())).today.length,0)}finally{f.cleanup()}
});
test('portable read: pending, stale, failure, identity, retraction, expiry, owner change and future timer',async()=>{
 for(const kind of ['pending','evidence','failure','identity','retraction','expiry','owner','future']){const f=fixture();try{add(f);if(kind!=='pending')drain(f);
  if(kind==='evidence')f.queue.memory.admit(event('new',[{field:'vehicle_count',value:2}]),{now:NOW});
  if(kind==='failure')f.db.prepare("UPDATE cf_evaluation_queue SET state='FAILED',last_error='EVALUATION_FAILED'").run();
  if(kind==='identity'){seed(f.db,'other');f.db.prepare('UPDATE cf_ucp_opportunity_links SET customer_id=? WHERE workspace_id=? AND opportunity_id=?').run('cust_other',W,P)}
  if(kind==='retraction')f.queue.memory.erase(W,f.queue.memory.eventKey(event('request-'+P)),'RETRACTED',{now:NOW});
  if(kind==='owner')change(f,{...context,workflowOwner:'COVERAGEFIT_APPROVED'});
  const clock=()=>kind==='expiry'?'2027-01-02T12:00:00.000Z':kind==='future'?later(1000):NOW;
  const v=portableViews(f,{clock}),a=await v.service.detail(request(),P),b=await views(f,{clock}).detail(request(),P);assert.deepEqual(a.current_decision,b.current_decision,kind);
  if(kind==='future')assert.equal((await v.service.today(request())).today.length,1);else assert.equal((await v.service.today(request())).today.length,0);
 }finally{f.cleanup()}}
});
test('portable read: row/byte history overflow is explicit UNAVAILABLE, never a truncated CURRENT',async()=>{
 for(const kind of ['events','bytes','assertions']){const f=fixture();try{add(f);
  if(kind==='events')for(let i=0;i<64;i++)f.queue.memory.admit(event('extra-'+i,[{field:'vehicle_count',value:2}]),{now:NOW});
  if(kind==='bytes')for(let i=0;i<30;i++)f.queue.memory.admit(event('extra-'+i,[{field:'carrier',value:'x'.repeat(150)}]),{now:NOW});
  drain(f);
  if(kind==='bytes')f.db.prepare("UPDATE cf_evidence_events SET source_ref_json=?").run(JSON.stringify({locator:'x'.repeat(1800)}));
  if(kind==='assertions'){const e=f.db.prepare('SELECT event_key FROM cf_evidence_events').get();for(let i=0;i<13;i++)f.db.prepare('INSERT INTO cf_evidence_assertions VALUES(?,?,?,?,?,NULL)').run(W,e.event_key,'corrupt-'+i,'carrier','{}')}
  const v=portableViews(f),d=await v.service.detail(request(),P);assert.equal(d.current_decision.status,'UNAVAILABLE');assert.match(d.current_decision.reason,/BUDGET/);const page=await v.service.today(request());assert.equal(page.today.length,0);assert.equal(page.selection_coverage.completeness,'LIMITED');
 }finally{f.cleanup()}}
});
test('portable read: trusted actor, workspace and independent SQL record scope; cursor grants no access',async()=>{
 const f=fixture();try{for(const p of ['allowed','private','zzz'])add(f,p);drain(f);
  const ids=['allowed',...Array.from({length:99},(_,i)=>'absent-'+i)],scoped=portableViews(f,{authorize:authority({workspace:W,actor:'producer',recordIds:ids})});
  const page=await scoped.service.today(request('?workspace=foreign'));assert.deepEqual(page.today.map(r=>r.opportunity_id),['allowed']);assert.equal(scoped.db.receipts[0].args.length,8);assert.equal(page.selection_coverage.scope_rows_examined,100);
  await assert.rejects(scoped.service.detail(request(),'private'),/RECORD_UNAVAILABLE/);await assert.rejects(scoped.service.today(new Request('https://synthetic.test')),/AUTHORIZATION_REQUIRED/);
  const full=await portableViews(f).service.attention(request(),{limit:1});assert.ok(full.next_cursor);
  const foreign=portableViews(f,{authorize:authority({workspace:'foreign',actor:'producer',workspaceRead:true})});assert.equal((await foreign.service.today(request(),{after:full.next_cursor})).today.length,0);
  await assert.rejects(scoped.service.today(request(),{after:'injected'}),/INVALID_ATTENTION_CURSOR/);
  const adapter=producerIntelligencePortable(binding(f.db),{syntheticOnly:true});await assert.rejects(adapter.attentionPage({workspace:W,now:NOW,workspaceRead:true,limit:25}),/SCOPE_DENIED/);
 }finally{f.cleanup()}
});
test('portable read: concurrent writers cannot mix selection and C3 snapshot; subsequent read sees change',async()=>{
 const f=fixture();let writer;try{f.db.exec('PRAGMA journal_mode=WAL');add(f);drain(f);writer=new DatabaseSync(f.path);
  // Writer commits after the one statement finishes, before async hash/projection completes.
  let once=true;const v=portableViews(f,{after(){if(once){once=false;writer.prepare("UPDATE cf_solo_sources SET summary_json=json_set(summary_json,'$.contact.suppressed',json('true')) WHERE workspace_id=? AND kind='signal_c2_context_v1'").run(W)}}});
  const first=await v.service.today(request());assert.equal(first.today.length,1);assert.equal(first.today[0].current_decision.status,'CURRENT');assert.equal(v.db.receipts.length,1);
  assert.equal((await v.service.today(request())).today.length,0);assert.equal((await v.service.detail(request(),P)).current_decision.status,'HELD');
  // A change before statement execution is part of that snapshot, not cached client state.
  change(f,context);drain(f);const before=portableViews(f,{before(){writer.prepare("UPDATE cf_evaluation_queue SET generation=generation+1 WHERE workspace_id=?").run(W)}});assert.equal((await before.service.today(request())).today.length,0);
 }finally{writer?.close();f.cleanup()}
});
test('portable read: missing index/schema, corrupt context/decision and driver failure fail closed',async()=>{
 for(const kind of ['schema','context','decision','driver']){const f=fixture();try{add(f);drain(f);
  if(kind==='schema')f.db.exec('DROP INDEX cf_evidence_read_history');
  if(kind==='context')f.db.prepare("UPDATE cf_solo_sources SET summary_json='{' WHERE kind='signal_c2_context_v1'").run();
  if(kind==='decision')f.db.prepare("UPDATE cf_evaluation_results SET decision_json=json_set(decision_json,'$.reason','forged reason')").run();
  const v=portableViews(f,kind==='driver'?{before(){throw Error('storage unavailable')}}:{});assert.equal((await v.service.today(request())).today.length,0);
  if(kind==='decision'){assert.equal((await v.service.detail(request(),P)).current_decision.reason,'CORRUPT_DECISION');assert.equal((await views(f).detail(request(),P)).current_decision.status,'UNAVAILABLE')}
 }finally{f.cleanup()}}
});
test('portable read: deterministic empty-page continuation and read-only process reopen',async()=>{
 const f=fixture();let ro;try{for(const p of ['Zed','a-b','a.b'])add(f,p);drain(f);const v=portableViews(f),seen=[];let after='';do{const r=await v.service.attention(request(),{limit:1,after});seen.push(...r.records.map(x=>x.id));after=r.next_cursor}while(after);assert.deepEqual(seen,['Zed','a-b','a.b']);
  const empty=await v.service.today(request(),{limit:1,q:'doesnotmatch'});assert.equal(empty.today.length,0);assert.ok(empty.next_cursor);
  const original=await v.service.today(request());ro=new DatabaseSync(f.path,{readOnly:true});const reopened=await portableViews({db:ro}).service.today(request());assert.deepEqual(reopened.today,original.today);
 }finally{ro?.close();f.cleanup()}
});
test('portable read: SQL uses bounded candidate/history/claim indexes; portable imports exclude Node',()=>{
 const f=fixture();try{const sql=producerReadSQL({after:true}),stmt=f.db.prepare('EXPLAIN QUERY PLAN '+sql);stmt.setAllowUnknownNamedParameters(true);const p=stmt.all({'?1':W,'?2':'[]','?3':NOW,'?4':-120,'?5':'9999','?6':'a','?7':26,'?8':null}).map(r=>r.detail).join('\n');
  assert.match(p,/SEARCH.*cf_eval_attention/);assert.match(p,/SEARCH.*cf_evidence_read_history/);assert.match(p,/SEARCH.*cf_assertions_event/);assert.doesNotMatch(p,/SCAN (?:e|a|cf_evidence_events|cf_evidence_assertions)\b/);
  const visited=new Set();function walk(path){if(visited.has(path))return;visited.add(path);const s=readFileSync(new URL('../server/'+path,import.meta.url),'utf8');assert.doesNotMatch(s,/from ['"]node:|require\(/);for(const m of s.matchAll(/(?:from|import)\s*['"]\.\/([^'"]+)['"]/g))walk(m[1])}walk('producer-intelligence-portable.mjs');
 }finally{f.cleanup()}
});
test('portable read: stale acknowledgment and crashed lease cannot publish a current handoff',async()=>{
 const f=fixture();try{add(f);const c=f.queue.claim({workspace:W,now:NOW,workerId:'stale',limit:1,leaseMs:10}).claims[0],prepared=f.queue.evaluate(c,{now:NOW});
  f.queue.memory.admit(event('new-evidence',[{field:'vehicle_count',value:3}]),{now:NOW});assert.equal(f.queue.acknowledge(prepared,{now:NOW}).code,'STALE_REQUEUED');assert.equal((await portableViews(f).service.today(request())).today.length,0);
  const fresh=f.queue.claim({workspace:W,now:NOW,workerId:'crash',limit:1,leaseMs:10}).claims[0];assert.ok(fresh);const r=await portableViews(f,{clock:()=>later(10)}).service.detail(request(),P);assert.notEqual(r.current_decision.status,'CURRENT');assert.equal(r.current_decision.evaluation.lease_expired,true);
  const recovered=f.queue.claim({workspace:W,now:later(10),workerId:'recover',limit:1}).claims[0];assert.ok(recovered.recovered);f.queue.acknowledge(f.queue.evaluate(recovered,{now:later(10)}),{now:later(10)});assert.equal((await portableViews(f,{clock:()=>later(10)}).service.today(request())).today.length,1);
 }finally{f.cleanup()}
});
test('portable read: interleaved writer inside SQLite statement cannot tear the read snapshot',async()=>{
 const f=fixture();let writer;try{f.db.exec('PRAGMA journal_mode=WAL');add(f);drain(f);writer=new DatabaseSync(f.path);let fired=false;
  f.db.function('cf_interleave',value=>{if(!fired){fired=true;writer.prepare("UPDATE cf_solo_sources SET summary_json=json_set(summary_json,'$.workflowOwner','UNKNOWN') WHERE workspace_id=? AND kind='signal_c2_context_v1'").run(W)}return value});
  const raw=binding(f.db),interleaved={withSession(mode){const s=raw.withSession(mode);return {prepare(sql){return s.prepare(sql.replace('AS attention_due,c.generation','AS attention_due,cf_interleave(c.generation) AS generation'))}}}};
  const svc=views(f,{store:producerIntelligencePortable(interleaved,{syntheticOnly:true})}),first=await svc.today(request());assert.ok(fired);assert.equal(first.today.length,1);assert.equal(first.today[0].current_decision.workflow_owner,'AGENCYZOOM');
  assert.equal((await svc.today(request())).today.length,0);assert.equal((await svc.detail(request(),P)).current_decision.status,'HELD');
 }finally{writer?.close();f.cleanup()}
});
test('portable read: write-reporting or uninitialized drivers fail closed; no runtime activation',async()=>{
 const f=fixture();try{add(f);drain(f);const db=binding(f.db),bad={withSession(mode){const session=db.withSession(mode);return {prepare(sql){const s=session.prepare(sql);return {bind(...a){const q=s.bind(...a);return {async all(){const r=await q.all();return {...r,meta:{rows_written:1}}}}}}}}}};
  assert.equal((await views(f,{store:producerIntelligencePortable(bad,{syntheticOnly:true})}).today(request())).status,'UNAVAILABLE');
  const store=producerIntelligencePortable(db,{syntheticOnly:true});assert.equal((await views(f,{store:{...store,initialized:false}}).today(request())).reason,'ADAPTER_NOT_INITIALIZED');
  assert.equal((await views(f,{store:{...store,runtime:'D1'}}).today(request())).reason,'HOSTED_ADAPTER_NOT_ACCEPTED');
  for(const path of ['server/solo-desk-api.mjs','server/cloudflare-pages-handlers.mjs','functions/api/solo-desk/[[path]].js'])assert.doesNotMatch(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/producer-intelligence-portable/);
 }finally{f.cleanup()}
});
test('portable read: page and response budgets are explicit at 1, 25, 40 and rejected 41',async()=>{
 const f=fixture();try{for(let i=0;i<41;i++)add(f,'limit-'+String(i).padStart(2,'0'));drain(f);const v=portableViews(f);
  for(const limit of [1,25,40]){const r=await v.service.attention(request(),{limit});assert.equal(r.records.length,limit);assert.equal(r.selection_coverage.candidate_rows_read,limit+1);assert.ok(r.next_cursor);assert.equal(r.read_metrics.queries,1)}
  const before=v.db.receipts.length,r=await v.service.attention(request(),{limit:41});assert.equal(r.reason,'READ_BUDGET_EXCEEDED');assert.equal(v.db.receipts.length,before);
 }finally{f.cleanup()}
});

test('portable read: authorized existing record without evaluation state is UNAVAILABLE, not missing',async()=>{
 const f=fixture();try{const v=portableViews(f);const r=await v.service.detail(request(),P);assert.equal(r.id,P);assert.equal(r.current_decision.status,'UNAVAILABLE');assert.equal(r.current_decision.recommendation,null);
  await assert.rejects(v.service.detail(request(),'absent'),/RECORD_UNAVAILABLE/);
 }finally{f.cleanup()}
});
