import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {fixture,event,seed,configure,context,authority,batch,snapshot,reopen,W,P,NOW} from './helpers/evaluation-queue-fixture.mjs';
import {signalCurrentDecisionLocal,currentDecisionProducerRecord} from '../server/signal-current-decision-local.mjs';
const at=ms=>new Date(Date.parse(NOW)+ms).toISOString();
const view=(f,p=P,now=NOW)=>signalCurrentDecisionLocal(f.db,{syntheticOnly:true}).current(W,p,{now});
const admit=(f,id='first',claims=[{field:'explicit_call_request',value:true}],extra={})=>f.queue.memory.admit(event(id,claims,extra),{now:NOW});
const setup=f=>{configure(f);admit(f);};
const change=(f,options)=>f.queue.setContext(W,P,options,{now:NOW,requestId:'change',authority,expectedVersion:f.queue.context(W,P).version});
const rows=db=>Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({name})=>[name,db.prepare('SELECT * FROM "'+name+'"').all()]));
const safe=v=>{assert.equal(v.recommendation,null);assert.deepEqual(v.execution_eligibility,{sms:false,call:false,external:false,reason:'SHADOW_ONLY'});assert.equal(currentDecisionProducerRecord(v).action_quality.action.code,'NO_ACTION')};
test('C3 source → PENDING → CURRENT → STALE → latest CURRENT survives reopen',()=>{
 const f=fixture();try{setup(f);assert.equal(view(f).status,'PENDING');safe(view(f));
 assert.equal(snapshot(f.db).target_revision,1);batch(f.queue);const v=view(f);assert.equal(v.status,'CURRENT');assert.equal(v.recommendation.action,'CALL');
 assert.equal(v.historical.generation,snapshot(f.db).generation-1);assert.ok(v.evidence_refs.length);assert.equal(currentDecisionProducerRecord(v).action_quality.action.code,'CALL_CUSTOMER');assert.equal(currentDecisionProducerRecord(v).action_quality.action.actionable,false);assert.ok(v.source_references[0].source_ref.locator);
 assert.equal(admit(f,'quote',[{field:'explicit_call_request',value:false,producer_verified:true,supersedes_source_type:'sms_inbound',supersedes_source_event_id:'first'},{field:'explicit_quote_request',value:true,producer_verified:true}],{source_type:'producer_confirmation',observed_at:'2026-10-14T11:00:00Z'}).code,'ADMITTED');
 assert.equal(view(f).status,'STALE');safe(view(f));assert.equal(snapshot(f.db).target_revision,2);
 batch(f.queue);assert.equal(view(f).recommendation.action,'QUOTE PREPARATION');const expected=view(f);
 f.db.close();const r=reopen(f.path);try{assert.deepEqual(view(r),expected)}finally{r.db.close()}
 }finally{f.cleanup()}
});
for(const [label,options,reason] of [
 ['STOP',{...context,contact:{suppressed:true}},'CONTACT_SUPPRESSED'],
 ['wrong number',{...context,contact:{wrong_number:true}},'CONTACT_SUPPRESSED'],
 ['CONTROL',{...context,population:'CONTROL'},'CONTROL_OR_TEST'],
 ['takeover',{...context,producerTakeover:true},'PRODUCER_TAKEOVER'],
 ['unknown owner',{...context,workflowOwner:'UNKNOWN'},'WORKFLOW_OWNER_UNKNOWN']])test('C3 authoritative '+label+' hides old CALL immediately',()=>{
 const f=fixture();try{setup(f);batch(f.queue);change(f,options);const v=view(f);assert.equal(v.status,'HELD');assert.equal(v.reason,reason);safe(v);batch(f.queue);safe(view(f));}finally{f.cleanup()}
});
test('C3 AgencyZoom owner change invalidates prior policy but preserves valid internal intelligence without SMS permission',()=>{
 const f=fixture();try{configure(f,{...context,workflowOwner:'COVERAGEFIT_APPROVED'});admit(f);batch(f.queue);const prior=view(f);change(f,context);
 assert.equal(view(f).status,'STALE');safe(view(f));batch(f.queue);const v=view(f);assert.equal(v.status,'CURRENT');assert.equal(v.recommendation.action,'CALL');assert.notEqual(v.context_version,prior.context_version);assert.equal(v.workflow_owner,'AGENCYZOOM');assert.ok(v.restrictions.includes('SMS_PERMISSION_UNVERIFIED'));assert.ok(v.restrictions.includes('EXTERNAL_OR_UNKNOWN_WORKFLOW_OWNER'));}finally{f.cleanup()}
});
test('C3 identity changes hold stored decisions, source reassignment fails closed',()=>{
 const f=fixture();try{setup(f);batch(f.queue);seed(f.db,'other');f.db.prepare('UPDATE cf_ucp_opportunity_links SET customer_id=? WHERE workspace_id=? AND opportunity_id=?').run('cust_other',W,P);
 assert.equal(view(f).status,'HELD');assert.equal(view(f).reason,'IDENTITY_HOLD');safe(view(f));
 f.db.prepare('UPDATE cf_ucp_opportunity_links SET customer_id=? WHERE workspace_id=? AND opportunity_id=?').run('cust_'+P,W,P);
 f.db.prepare("UPDATE cf_solo_sources SET opportunity_id='other' WHERE kind='synthetic' AND workspace_id=?").run(W);
 assert.equal(view(f).reason,'SOURCE_LINK_RESTRICTED');safe(view(f));}finally{f.cleanup()}
});
test('C3 expiry invalidates without read-side erasure; governed worker cleanup removes derived traces',()=>{
 const f=fixture();try{configure(f);const e=event('expiry',[{field:'explicit_call_request',value:true}],{rights:{internal_insurance_use:true,controller:'synthetic-agency',retain_until:at(1000)}});f.queue.memory.admit(e,{now:NOW});batch(f.queue);
 const before=rows(f.db);const v=view(f,P,at(1000));assert.equal(v.status,'STALE');safe(v);assert.deepEqual(rows(f.db),before);
 batch(f.queue,at(1000));assert.equal(view(f,P,at(1000)).status,'PENDING');batch(f.queue,at(1000));assert.equal(view(f,P,at(1000)).status,'CURRENT');assert.notEqual(view(f,P,at(1000)).recommendation.action,'CALL');
 }finally{f.cleanup()}
});
test('C3 source retraction removes historical payload and does not resurrect CALL',()=>{
 const f=fixture();try{configure(f);const a=admit(f);batch(f.queue);f.queue.memory.erase(W,a.event_key,'RETRACTED',{now:NOW});const v=view(f);assert.equal(v.status,'PENDING');assert.equal(v.historical,null);safe(v);assert.equal(f.db.prepare('SELECT count(*) n FROM cf_evaluation_results').get().n,0);}finally{f.cleanup()}
});
test('C3 FAILED exposes bounded recovery and never falls back to historical action',()=>{
 const f=fixture({maxAttempts:1});try{setup(f);batch(f.queue);f.queue.requestRefresh(W,P,{now:NOW,requestId:'retry',authority});const c=f.queue.claim({workspace:W,now:NOW,workerId:'failure'}).claims[0];f.queue.fail(c,{now:NOW});const v=view(f);assert.equal(v.status,'FAILED');assert.equal(v.next_evaluation_at,null);assert.equal(v.evaluation.due,false);assert.equal(v.recovery,'NEW_MATERIAL_EVIDENCE_OR_GOVERNED_REFRESH');safe(v);admit(f,'next');assert.equal(view(f).status,'STALE');batch(f.queue);assert.equal(view(f).status,'CURRENT');}finally{f.cleanup()}
});
test('C3 crashed lease and two competing connections cannot publish stale or contradictory current recommendations',()=>{
 const f=fixture();let r;try{setup(f);const c=f.queue.claim({workspace:W,now:NOW,workerId:'crashed',leaseMs:5}).claims[0],prepared=f.queue.evaluate(c,{now:NOW});r=reopen(f.path);
 assert.equal(r.queue.claim({workspace:W,now:NOW,workerId:'second'}).claims.length,0);assert.equal(view(r,P,at(5)).status,'PENDING');assert.equal(view(r,P,at(5)).evaluation.lease_expired,true);
 batch(r.queue,at(5));assert.equal(f.queue.acknowledge(prepared,{now:at(5)}).code,'LEASE_LOST');assert.equal(view(r,P,at(5)).status,'CURRENT');
 admit(f,'new');const next=f.queue.claim({workspace:W,now:at(6),workerId:'first'}).claims[0],work=f.queue.evaluate(next,{now:at(6)});admit(f,'newest',[{field:'explicit_quote_request',value:true}]);assert.equal(f.queue.acknowledge(work,{now:at(6)}).code,'STALE_REQUEUED');safe(view(r,P,at(6)));batch(r.queue,at(6));assert.equal(view(r,P,at(6)).status,'CURRENT');
 assert.equal(f.db.prepare('SELECT count(*) n FROM cf_evaluation_results').get().n,2);
 }finally{r?.db.close();f.cleanup()}
});
test('C3 future timer is current until due; future explicit refresh cannot promote older generation',()=>{
 const f=fixture();try{setup(f);batch(f.queue);const due=snapshot(f.db).due_at;assert.equal(view(f,P,at(1)).status,'CURRENT');assert.equal(view(f,P,due).status,'STALE');
 f.queue.requestRefresh(W,P,{now:NOW,dueAt:at(100),requestId:'future',authority});assert.equal(view(f).status,'STALE');safe(view(f));}finally{f.cleanup()}
});
test('C3 read-only connection, keyset pagination, no network or table mutations',()=>{
 const f=fixture();let ro;const original=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('forbidden')};
 try{setup(f);batch(f.queue);for(let i=0;i<37;i++){const p='page-'+String(i).padStart(3,'0');seed(f.db,p);configure(f,context,p);admit(f,'event-'+i,undefined,{profile_id:p});}
 const before=rows(f.db),changes=f.db.prepare('SELECT total_changes() n').get().n;ro=new DatabaseSync(f.path,{readOnly:true});const reader=signalCurrentDecisionLocal(ro,{syntheticOnly:true});let cursor='',ids=[];
 do{const page=reader.page(W,{now:NOW,limit:7,after:cursor});assert.ok(page.items.length<=7);ids.push(...page.items.map(x=>x.id));cursor=page.next_cursor;}while(cursor);
 assert.equal(ids.length,38);assert.equal(new Set(ids).size,38);assert.equal(reader.page('other',{now:NOW}).items.length,0);assert.throws(()=>reader.page(W,{now:NOW,limit:101}));assert.equal(reader.current(W,'missing',{now:NOW}).status,'UNAVAILABLE');
 assert.deepEqual(rows(f.db),before);assert.equal(f.db.prepare('SELECT total_changes() n').get().n,changes);assert.equal(calls,0);
 assert.match(JSON.stringify(f.db.prepare('EXPLAIN QUERY PLAN SELECT opportunity_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id>? ORDER BY opportunity_id LIMIT ?').all(W,'',26)),/SEARCH/);
 }finally{globalThis.fetch=original;ro?.close();f.cleanup()}
});
test('C3 invalid or absent context and reversed decision clock fail closed',()=>{
 const f=fixture();try{setup(f);batch(f.queue);assert.equal(view(f,P,at(-1)).status,'UNAVAILABLE');f.db.prepare("UPDATE cf_solo_sources SET summary_json='broken' WHERE kind='signal_c2_context_v1'").run();assert.equal(view(f).status,'UNAVAILABLE');safe(view(f));}finally{f.cleanup()}
});
test('C3 persisted pending, stale, held and failed states reproduce after read-only reopen',()=>{
 const f=fixture({maxAttempts:1});try{
  setup(f);
  const check=()=>{const expected=view(f);const db=new DatabaseSync(f.path,{readOnly:true});try{assert.deepEqual(view({db}),expected)}finally{db.close()}return expected};
  assert.equal(check().status,'PENDING');batch(f.queue);assert.equal(check().status,'CURRENT');admit(f,'update');assert.equal(check().status,'STALE');
  const c=f.queue.claim({workspace:W,now:NOW,workerId:'failure'}).claims[0];f.queue.fail(c,{now:NOW});assert.equal(check().status,'FAILED');
  change(f,{...context,contact:{suppressed:true}});assert.equal(check().status,'HELD');
 }finally{f.cleanup()}
});
test('C3 incomplete store and corrupted decision trace are unavailable without repair',()=>{
 const f=fixture();try{setup(f);batch(f.queue);f.db.prepare("UPDATE cf_evidence_decisions SET action='UNTRUSTED'").run();const before=rows(f.db);assert.equal(view(f).status,'UNAVAILABLE');safe(view(f));assert.deepEqual(rows(f.db),before);
 f.db.exec('DROP TABLE cf_evaluation_results');assert.equal(view(f).status,'UNAVAILABLE');
 }finally{f.cleanup()}
});
