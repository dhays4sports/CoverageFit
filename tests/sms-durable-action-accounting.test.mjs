import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {fixture,open,input,authority,start,evidence,NOW,W} from './helpers/sms-accounting-fixture.mjs';
import {fictionalProvider} from './helpers/sms-fictional-provider.mjs';
import {smsDurableAccountingLocal} from '../server/sms-durable-action-accounting-local.mjs';
const worker=new URL('./helpers/sms-accounting-worker.mjs',import.meta.url);
function processRun(f,mode,args={}){return new Promise((resolve,reject)=>{let out='',err='';const p=spawn(process.execPath,['--experimental-loader',new URL('./json-loader.mjs',import.meta.url).pathname,worker.pathname,f.path,f.providerPath,mode,JSON.stringify(args)],{stdio:['ignore','pipe','pipe']});p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('error',reject);p.on('exit',code=>{if(code!==0&&code!==70)reject(Error(err));else resolve({code,result:out.trim()?JSON.parse(out):null})})})}
const count=(f,table)=>f.db.prepare('SELECT count(*) n FROM '+table).get().n;
const read=(f,a)=>f.ledger.inspect(W,a);
const rev=(f,t)=>read(f,t.action_id).attempts.find(x=>x.attempt_id===t.attempt_id).revision;
function accept(f,t,extra={},now=NOW){return f.ledger.reconcile(W,t.action_id,t.attempt_id,evidence(t,extra),{now,expectedRevision:rev(f,t)})}

test('0.4 requires explicit synthetic mode and real file-backed schema',()=>{const db=new DatabaseSync(':memory:');try{assert.throws(()=>smsDurableAccountingLocal(db),/synthetic/);assert.throws(()=>smsDurableAccountingLocal(db,{syntheticOnly:true}),/file_backed/)}finally{db.close()}});
test('0.4 immutable action identity ignores gateway retry keys and rejects changed payload/family',()=>{
 const f=fixture();try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW});assert.equal(f.ledger.admit({...raw,gatewayKey:'fresh-key'},{now:NOW}).action_id,a.action_id);
 assert.throws(()=>f.ledger.admit({...raw,descriptor:{...raw.descriptor,message:'changed'}},{now:NOW}),/immutable_action/);assert.throws(()=>f.ledger.admit({...raw,family:'AUTO'},{now:NOW}),/immutable_action/);assert.equal(count(f,'cf_test_sms_actions'),1);
 assert.throws(()=>f.ledger.inspect('another-tenant',a.action_id),/unknown_scoped/);
 }finally{f.cleanup()}
});
test('0.4 admission interruption rolls back action and audit together',()=>{const f=fixture();try{const raw=f.seed(),n=count(f,'cf_test_sms_audit');assert.throws(()=>f.ledger.admit(raw,{now:NOW,interrupt:true}),/interrupted/);assert.equal(count(f,'cf_test_sms_actions'),0);assert.equal(count(f,'cf_test_sms_audit'),n)}finally{f.cleanup()}});
test('0.4 independent processes concurrently admit one canonical action',async()=>{const f=fixture();try{const raw=f.seed();const r=await Promise.all(Array.from({length:4},()=>processRun(f,'admit',{raw})));assert.equal(r.filter(x=>x.result.code==='ADMITTED').length,1);assert.equal(new Set(r.map(x=>x.result.action_id)).size,1);assert.equal(count(f,'cf_test_sms_actions'),1)}finally{f.cleanup()}});
for(const rate of [10,20,25,40])test('0.4 '+rate+'/minute atomic sender reservations across independent workers',async()=>{
 const f=fixture({rate,reserve:2});try{const actions=Array.from({length:120},(_,i)=>{const r='r-'+i;return f.ledger.admit(f.seed(r),{now:NOW}).action_id});
 const results=await Promise.all(Array.from({length:4},()=>processRun(f,'claim',{actions})));assert.equal(results.reduce((n,r)=>n+r.result.claims,0),120);assert.equal(results.reduce((n,r)=>n+r.result.reserved,0),rate-2);assert.equal(count(f,'cf_test_sms_reservations'),rate-2);
 const dup=f.db.prepare('SELECT action_id,count(*) n FROM cf_test_sms_attempts GROUP BY action_id HAVING count(*)>1').all();assert.equal(dup.length,0);
 }finally{f.cleanup()}
});
test('0.4 sender identities independent; HOME/AUTO recipient spacing shared',()=>{
 const f=fixture({rate:1});try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW}),c=f.ledger.claim(W,a.action_id,{now:NOW,worker:'a'});assert.equal(f.ledger.reserve(c,{now:NOW}).code,'RESERVED');
 f.ledger.setSender('other-sender',{rate:1,reserve:0,externalKnown:true,recipientGapMs:60000},{now:NOW,reference:'other'});
 const raw2=f.seed('r2',{campaigns:[{sender:'other-sender',campaign:'synthetic-campaign',authorized:true,reference:'other'}]});raw2.sender='other-sender';const a2=f.ledger.admit(raw2,{now:NOW}),c2=f.ledger.claim(W,a2.action_id,{now:NOW,worker:'b'});assert.equal(f.ledger.reserve(c2,{now:NOW}).code,'RESERVED');
 f.ledger.setSender('synthetic-sender',{rate:10,reserve:0,externalKnown:true,recipientGapMs:60000},{now:NOW,expectedRevision:1,reference:'increase'});
 const b=f.ledger.admit({...raw,family:'AUTO',businessEvent:'second-request'},{now:NOW}),bc=f.ledger.claim(W,b.action_id,{now:NOW,worker:'c'});assert.equal(f.ledger.reserve(bc,{now:NOW}).reason,'RECIPIENT_SPACING');
 }finally{f.cleanup()}
});
test('0.4 reservation replay is idempotent and capacity reduction fences submission',()=>{
 const f=fixture();try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW}),c=f.ledger.claim(W,a.action_id,{now:NOW,worker:'a'}),r=f.ledger.reserve(c,{now:NOW});assert.deepEqual(f.ledger.reserve(c,{now:NOW}),r);assert.equal(count(f,'cf_test_sms_reservations'),1);
 f.ledger.setSender('synthetic-sender',{rate:0,reserve:0,externalKnown:true,recipientGapMs:60000},{now:NOW,expectedRevision:1,reference:'outage'});assert.equal(f.ledger.beginSubmission(c,r.attempt_id,{now:NOW}).reason,'SENDER_CAPACITY');assert.equal(read(f,a.action_id).attempts[0].started_at,null);
 }finally{f.cleanup()}
});
test('0.4 unknown external traffic holds all reservations',()=>{const f=fixture({externalKnown:false});try{const a=f.ledger.admit(f.seed(),{now:NOW}),c=f.ledger.claim(W,a.action_id,{now:NOW,worker:'a'});assert.equal(f.ledger.reserve(c,{now:NOW}).reason,'UNKNOWN_EXTERNAL_CAPACITY');assert.equal(count(f,'cf_test_sms_attempts'),0)}finally{f.cleanup()}});
for(const point of ['before_admission','after_admission','after_claim','after_reservation','after_marker','response_loss','ack_persistence_failure'])test('0.4 independent process crash at '+point+' preserves durable boundary',async()=>{
 const f=fixture();try{const raw=f.seed();assert.equal((await processRun(f,'crash',{point,raw})).code,70);
 if(point==='before_admission'){assert.equal(count(f,'cf_test_sms_actions'),0);return}
 const aid=f.ledger.admit({...raw,gatewayKey:'different-after-crash'},{now:NOW+2000}).action_id;
 const outcomes=await Promise.all([processRun(f,'recover',{now:NOW+2000}),processRun(f,'recover',{now:NOW+2000})]);assert.ok(outcomes.reduce((n,x)=>n+x.result.recovered,0)<=1);
 const inspected=read(f,aid),started=['after_marker','response_loss','ack_persistence_failure'].includes(point);
 if(started){assert.equal(inspected.action.state,'HELD');assert.equal(inspected.attempts[0].state,'OUTCOME_UNKNOWN');assert.equal(f.ledger.claim(W,aid,{now:NOW+60001,worker:'retry'}).code,'NOT_CLAIMABLE');}
 else{const c=f.ledger.claim(W,aid,{now:NOW+2000,worker:'resume'});assert.equal(c.code,'CLAIMED');assert.equal(f.ledger.reserve(c,{now:NOW+2000}).code,'RESERVED');}
 const p=fictionalProvider(f.providerPath);try{assert.equal(p.records().length,['response_loss','ack_persistence_failure'].includes(point)?1:0);
 if(p.records().length){const row=p.records()[0],ticket=JSON.parse(row.ticket_json);const accepted=accept(f,ticket,{provider_id:'fictional-'+row.id},NOW+2001);assert.equal(accepted.code,'ACKNOWLEDGED');assert.equal(read(f,aid).action.state,'COMPLETED');assert.equal(p.records().length,1);assert.equal(read(f,aid).attempts.length,1)}
 }finally{p.close()}
 }finally{f.cleanup()}
});
test('0.4 late worker cannot repeat submission marker after lease recovery',()=>{
 const f=fixture();try{const x=start(f);f.ledger.recover(W,{now:NOW+30001});assert.throws(()=>f.ledger.beginSubmission(x.claim,x.reservation.attempt_id,{now:NOW+30001}),/fenced/);assert.equal(read(f,x.admitted.action_id).attempts[0].state,'OUTCOME_UNKNOWN');assert.equal(count(f,'cf_test_sms_reservations'),1)}finally{f.cleanup()}
});
test('0.4 uncertainty blocks a new action/key/family for same relationship',()=>{
 const f=fixture();try{const x=start(f);f.ledger.recover(W,{now:NOW+30001});const a=f.ledger.admit({...x.raw,family:'AUTO',businessEvent:'another-request'},{now:NOW+30001});assert.equal(f.ledger.claim(W,a.action_id,{now:NOW+30001,worker:'new-key'}).reason,'RELATIONSHIP_OUTCOME_UNKNOWN');assert.equal(count(f,'cf_test_sms_attempts'),1)}finally{f.cleanup()}
});
test('0.4 authoritative rejection permits new attempt only after capacity/authority recheck',()=>{
 const f=fixture();try{const x=start(f);assert.equal(accept(f,x.ticket,{outcome:'REJECTED',provider_id:undefined,nonAcceptance:true,retryEligible:true}).code,'PROVEN_REJECTED');
 const c=f.ledger.claim(W,x.admitted.action_id,{now:NOW,worker:'retry'});assert.equal(f.ledger.reserve(c,{now:NOW}).reason,'RECIPIENT_SPACING');f.ledger.recover(W,{now:NOW+60001});
 const c2=f.ledger.claim(W,x.admitted.action_id,{now:NOW+60001,worker:'retry2'}),r=f.ledger.reserve(c2,{now:NOW+60001});assert.equal(r.code,'RESERVED');assert.notEqual(r.attempt_id,x.ticket.attempt_id);assert.notEqual(r.gateway_key,x.ticket.gateway_key);assert.equal(read(f,x.admitted.action_id).attempts.length,2);
 assert.equal(accept(f,x.ticket,{evidence_id:'late-rejection',outcome:'REJECTED',nonAcceptance:true,retryEligible:true},NOW+60001).code,'ALREADY_REJECTED');assert.equal(read(f,x.admitted.action_id).action.state,'CLAIMED');
 }finally{f.cleanup()}
});
test('0.4 duplicate/out-of-order/conflicting receipt evidence preserved without false delivery',()=>{
 const f=fixture();try{const x=start(f),e=evidence(x.ticket);assert.equal(accept(f,x.ticket).delivery,'UNVERIFIED');assert.equal(f.ledger.reconcile(W,x.ticket.action_id,x.ticket.attempt_id,e,{now:NOW,expectedRevision:2}).code,'DUPLICATE');
 assert.equal(accept(f,x.ticket,{evidence_id:'delivered',outcome:'DELIVERED',sequence:2}).delivery,'DELIVERED');assert.equal(accept(f,x.ticket,{evidence_id:'older',outcome:'DELIVERY_FAILED',sequence:1}).code,'OUT_OF_ORDER');
 assert.equal(accept(f,x.ticket,{evidence_id:'conflict',outcome:'DELIVERY_FAILED',sequence:3}).reason,'CONFLICTING_DELIVERY');assert.equal(read(f,x.ticket.action_id).action.state,'HELD');
 assert.equal(accept(f,x.ticket,{evidence_id:'ordinary-ack'}).code,'HELD');assert.equal(count(f,'cf_test_sms_evidence'),5);assert.throws(()=>f.db.exec('DELETE FROM cf_test_sms_evidence'),/immutable/);
 }finally{f.cleanup()}
});
for(const patch of [{fingerprintOnly:true},{authoritative:false},{provider_id:null},{sender:'wrong-sender'},{workspace:'other-workspace'}])test('0.4 incomplete or ambiguous identity cannot resolve '+JSON.stringify(patch),()=>{
 const f=fixture();try{const x=start(f);assert.equal(accept(f,x.ticket,patch).code,'HELD');assert.equal(read(f,x.ticket.action_id).attempts[0].state,'OUTCOME_UNKNOWN');assert.equal(f.ledger.claim(W,x.ticket.action_id,{now:NOW,worker:'retry'}).code,'NOT_CLAIMABLE')}finally{f.cleanup()}
});
const changes=[{suppressed:true},{providerOptOut:true},{takeover:true},{identityVerified:false},{sourceRights:false},{smsPermission:false},{campaigns:[]},{profileVersion:'new-profile'},{contextVersion:'new-context'},{generation:2},{owners:{HOME:{owner:'AGENCYZOOM',epoch:2,exclusive:true}}},{owners:{HOME:{owner:'COVERAGEFIT_APPROVED',epoch:1,exclusive:false}}}];
for(const patch of changes)test('0.4 authority change fences reserved work '+JSON.stringify(patch),()=>{
 const f=fixture();try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW}),c=f.ledger.claim(W,a.action_id,{now:NOW,worker:'a'}),r=f.ledger.reserve(c,{now:NOW});f.ledger.setAuthority(W,raw.relationship,authority(patch),{now:NOW+1,expectedRevision:1});assert.throws(()=>f.ledger.beginSubmission(c,r.attempt_id,{now:NOW+1}),/fenced/);assert.equal(read(f,a.action_id).attempts[0].started_at,null)}finally{f.cleanup()}
});
test('0.4 STOP after admission prevents claim and in-flight STOP preserves acceptance without more work',()=>{
 const f=fixture();try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW});f.ledger.setAuthority(W,raw.relationship,authority({suppressed:true}),{now:NOW+1,expectedRevision:1});assert.equal(f.ledger.claim(W,a.action_id,{now:NOW+1,worker:'a'}).code,'NOT_CLAIMABLE');
 const x=start(f,f.seed('inflight'));f.ledger.setAuthority(W,'inflight',authority({suppressed:true}),{now:NOW+1,expectedRevision:1});assert.equal(accept(f,x.ticket,{},NOW+2).code,'ACKNOWLEDGED');assert.equal(read(f,x.ticket.action_id).action.state,'HELD');assert.equal(read(f,x.ticket.action_id).attempts[0].state,'ACKNOWLEDGED');
 }finally{f.cleanup()}
});
test('0.4 invalid admission denies purchased, missing positive consent, CONTROL, owner and preference',()=>{
 const f=fixture();try{for(const [i,patch] of [{sourceType:'purchased'},{smsPermission:false},{control:true},{preference:'CALL'},{sourceRights:false},{identityVerified:false},{owners:{HOME:{owner:'UNKNOWN',epoch:1,exclusive:false}}}].entries()){assert.throws(()=>f.ledger.admit(f.seed('r'+i,patch),{now:NOW}));}assert.equal(count(f,'cf_test_sms_actions'),0)}finally{f.cleanup()}
});
test('0.4 expiry/cancellation release only unsubmitted reservations; reads have no business writes',()=>{
 const f=fixture();try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW}),c=f.ledger.claim(W,a.action_id,{now:NOW,worker:'a'});f.ledger.reserve(c,{now:NOW});f.ledger.cancel(W,a.action_id,{now:NOW,reference:'customer-reply'});assert.throws(()=>f.ledger.beginSubmission(c,read(f,a.action_id).attempts[0].attempt_id,{now:NOW}),/fenced/);assert.equal(f.db.prepare('SELECT released FROM cf_test_sms_reservations').get().released,1);
 const b=f.ledger.admit({...raw,businessEvent:'expired',expiresAt:NOW+1},{now:NOW});assert.equal(f.ledger.claim(W,b.action_id,{now:NOW+2,worker:'a'}).code,'EXPIRED');const n=f.db.prepare('SELECT total_changes() n').get().n;read(f,a.action_id);assert.equal(f.db.prepare('SELECT total_changes() n').get().n,n);
 }finally{f.cleanup()}
});
test('0.4 reconciliation CAS and evidence identity prevent stale/conflicting writes',()=>{
 const f=fixture();try{const x=start(f),other=open(f.path);try{accept(f,x.ticket);assert.throws(()=>other.ledger.reconcile(W,x.ticket.action_id,x.ticket.attempt_id,evidence(x.ticket,{evidence_id:'new'}),{now:NOW,expectedRevision:2}),/fenced/);assert.throws(()=>accept(f,x.ticket,{outcome:'REJECTED'}),/evidence_identity_conflict/)}finally{other.db.close()}}finally{f.cleanup()}
});
test('0.4 independent provider does not hide duplicated calls; ledger denies second submission boundary',()=>{
 const f=fixture(),p=fictionalProvider(f.providerPath),old=globalThis.fetch;globalThis.fetch=()=>{throw Error('network_forbidden')};try{const x=start(f);p.accept(x.ticket,{now:NOW});assert.throws(()=>f.ledger.beginSubmission(x.claim,x.ticket.attempt_id,{now:NOW}),/fenced/);assert.equal(p.records().length,1);assert.equal(x.ticket.execution_eligibility.external,false);assert.equal(x.ticket.gateway_key.startsWith('local04:'),true);assert.throws(()=>p.accept({...x.ticket,syntheticOnly:false},{now:NOW}),/fictional/)}finally{globalThis.fetch=old;p.close();f.cleanup()}
});

test('0.4 sibling uncertainty fences already claimed and reserved work at submission boundary',()=>{
 const f=fixture({rate:40,gap:0});try{
  const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW}),b=f.ledger.admit({...raw,family:'AUTO',businessEvent:'other-event'},{now:NOW});
  const ca=f.ledger.claim(W,a.action_id,{now:NOW,worker:'a'}),cb=f.ledger.claim(W,b.action_id,{now:NOW,worker:'b'});
  const ra=f.ledger.reserve(ca,{now:NOW}),rb=f.ledger.reserve(cb,{now:NOW});
  assert.equal(f.ledger.beginSubmission(ca,ra.attempt_id,{now:NOW}).code,'SUBMISSION_MARKED');
  assert.equal(f.ledger.beginSubmission(cb,rb.attempt_id,{now:NOW}).reason,'RELATIONSHIP_OUTCOME_UNKNOWN');
  assert.equal(read(f,b.action_id).attempts[0].started_at,null);
 }finally{f.cleanup()}
});

test('0.4 verified relationship must authorize the exact immutable recipient',()=>{
 const f=fixture();try{const raw=f.seed();assert.throws(()=>f.ledger.admit({...raw,descriptor:{...raw.descriptor,to:'+12025550102'}},{now:NOW}),/IDENTITY_HOLD/);assert.equal(count(f,'cf_test_sms_actions'),0)}finally{f.cleanup()}
});

test('0.4 rolling sender budget counts submission markers until the exact 60-second boundary',()=>{
 const f=fixture({rate:1});try{
  const first=start(f);accept(f,first.ticket);
  const a=f.ledger.admit(f.seed('second'),{now:NOW}),c=f.ledger.claim(W,a.action_id,{now:NOW+59999,worker:'second'});
  assert.equal(f.ledger.reserve(c,{now:NOW+59999}).reason,'SENDER_CAPACITY');
  assert.equal(f.ledger.reserve(c,{now:NOW+60000}).code,'RESERVED');
 }finally{f.cleanup()}
});
test('0.4 proven nonacceptance retries are bounded and never imply delivery or engagement',()=>{
 const f=fixture();try{const raw=f.seed(),a=f.ledger.admit(raw,{now:NOW});
  for(let i=0;i<3;i++){const now=NOW+i*60000,c=f.ledger.claim(W,a.action_id,{now,worker:'retry'}),r=f.ledger.reserve(c,{now}),t=f.ledger.beginSubmission(c,r.attempt_id,{now});
   assert.equal(accept(f,t,{evidence_id:'reject-'+i,outcome:'REJECTED',provider_id:null,nonAcceptance:true,retryEligible:true},now).code,'PROVEN_REJECTED');}
  const c=f.ledger.claim(W,a.action_id,{now:NOW+180000,worker:'retry'});assert.equal(f.ledger.reserve(c,{now:NOW+180000}).reason,'ATTEMPTS_EXHAUSTED');assert.equal(read(f,a.action_id).attempts.length,3);
 }finally{f.cleanup()}
});
