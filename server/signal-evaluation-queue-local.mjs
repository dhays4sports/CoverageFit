// C2 LOCAL SYNTHETIC ONLY. No route, daemon, provider, messaging or appointment adapter.
import {createHash,randomUUID} from 'node:crypto';
import {prospectMemoryLocal} from './prospect-memory-local.mjs';
import {planSignal} from './signal-dynamic-planner.mjs';
import {currentProducerAttention,decisionAttentionDue,ATTENTION_SELECTION_BUILD} from './producer-intelligence-contract.mjs';
export const QUEUE_BUILD='CF-SIGNAL-C2-1';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const iso=x=>{if(typeof x!=='string'||!Number.isFinite(Date.parse(x)))throw Error('invalid_clock');return new Date(x).toISOString()};
const bounded=(x,min,max)=>{if(!Number.isSafeInteger(x)||x<min||x>max)throw Error('invalid_bound');return x};
const id=x=>{if(typeof x!=='string'||!x.length||x.length>160||!/^[a-zA-Z0-9._:-]+$/.test(x))throw Error('invalid_identifier');return x};
const minimum=values=>values.filter(Boolean).sort()[0]||null;
const CONTEXT_KIND='signal_c2_context_v1';
export function normalizeContext(input){
 if(!input||!['DISTRICT_SIGNAL','DISTRICT_CONTROL','CONTROL','TEST','WEB_DIRECT','OTHER'].includes(input.population)
   ||!['AGENCYZOOM','UNKNOWN','COVERAGEFIT_APPROVED'].includes(input.workflowOwner))throw Error('invalid_context');
 const c=input.contact||{},commitments=input.commitments||[];
 for(const v of [input.producerTakeover,input.closed,c.suppressed,c.wrong_number,c.sms_permission])if(v!==undefined&&typeof v!=='boolean')throw Error('invalid_boolean');
 if(!Array.isArray(commitments)||commitments.length>30)throw Error('invalid_commitments');
 return {population:input.population,workflowOwner:input.workflowOwner,producerTakeover:input.producerTakeover===true,closed:input.closed===true,
  contact:{suppressed:c.suppressed===true,wrong_number:c.wrong_number===true,sms_permission:c.sms_permission===true,
   acquisition_type:c.acquisition_type==='first_party'?'first_party':c.acquisition_type==='purchased'?'purchased':'unknown',wait_until:c.wait_until?iso(c.wait_until):null},
  timing:{renewalWindowDays:bounded(input.timing?.renewalWindowDays??30,0,180)},
  commitments:commitments.map(x=>({confirmed:x.confirmed===true,status:x.status==='open'?'open':'closed',evidence_ref:id(x.evidence_ref),at:iso(x.at)}))
   .sort((a,b)=>a.at.localeCompare(b.at)||a.evidence_ref.localeCompare(b.evidence_ref))};
}
export function signalEvaluationQueueLocal(db,{syntheticOnly=false,maxAttempts=5}={}){
 if(!syntheticOnly)throw Error('synthetic_only_required');
 bounded(maxAttempts,1,20);
 const memory=prospectMemoryLocal(db,{syntheticOnly:true});
 const get=(q,...a)=>db.prepare(q).get(...a),all=(q,...a)=>db.prepare(q).all(...a),run=(q,...a)=>db.prepare(q).run(...a);
 if(!get("SELECT 1 FROM sqlite_master WHERE name='cf_evaluation_queue'"))throw Error('local_c2_migration_required');
 const attentionReady=all('PRAGMA table_info(cf_evaluation_queue)').some(c=>c.name==='attention_json');
 const tx=(fn,read=false)=>{if(db.isTransaction)throw Error('queue_operation_requires_own_transaction');db.exec(read?'BEGIN':'BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v}catch(e){db.exec('ROLLBACK');throw e}};
 const row=(w,p)=>get('SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND opportunity_id=?',w,p);
 const revision=(w,p)=>get('SELECT revision FROM cf_evidence_revisions WHERE workspace_id=? AND opportunity_id=?',w,p)?.revision||0;
 const own=(w,p)=>{id(w);id(p);if(!get('SELECT 1 FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=?',w,p))throw Error('unknown_scoped_prospect')};
 function context(w,p){
  const stored=get('SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=? AND opportunity_id=?',w,CONTEXT_KIND,p,p);
  if(!stored)return {version:null,options:{population:'TEST',workflowOwner:'UNKNOWN',producerTakeover:true}};
  const options=normalizeContext(JSON.parse(stored.summary_json));return {version:digest(options),options};
 }
 function audit(w,p,requestId,authority,payload,now){
  id(requestId);id(authority?.actor);id(authority?.reference);
  const request='c2:'+requestId,fingerprint=digest([p,authority,payload]);
  const existing=get('SELECT fingerprint FROM cf_solo_activity WHERE workspace_id=? AND request_id=?',w,request);
  if(existing){if(existing.fingerprint!==fingerprint)throw Error('request_id_reused');return false}
  run("INSERT INTO cf_solo_activity VALUES(?,?,?,?,?,?,?,?,?)",'act_c2_'+digest([w,request]),w,p,authority.actor,'c2_projection_refresh',request,fingerprint,JSON.stringify({build:QUEUE_BUILD,...payload,authority_reference:authority.reference}),now);
  return true;
 }
 function enqueue(w,p,now,dueAt,reason=8){
  run(`INSERT INTO cf_evaluation_queue(workspace_id,opportunity_id,target_revision,due_at,enqueued_at,reason_mask,state)
   VALUES(?,?,?,?,?,?,'READY') ON CONFLICT(workspace_id,opportunity_id) DO UPDATE SET
   generation=generation+1,target_revision=excluded.target_revision,
   due_at=CASE WHEN state IN ('IDLE','FAILED') OR due_at IS NULL THEN excluded.due_at ELSE MIN(due_at,excluded.due_at) END,
   enqueued_at=excluded.enqueued_at,reason_mask=reason_mask|excluded.reason_mask,
   state=CASE WHEN state='LEASED' THEN 'LEASED' ELSE 'READY' END,attempts=0,last_error=NULL`,w,p,revision(w,p),dueAt,now,reason);
 }
 // Explicit governed local mutation. A single persisted owner per prospect/family; no agency API.
 function setContext(w,p,input,{now,requestId,authority,expectedVersion=null}={}){
  now=iso(now);const options=normalizeContext(input),version=digest(options);
  return tx(()=>{own(w,p);
   if(!audit(w,p,requestId,authority,{operation:'context',version,expectedVersion},now))return {code:'DUPLICATE',version};
   const current=context(w,p);if(current.version!==expectedVersion)throw Error('context_revision_conflict');
   if(current.version===version)return {code:'UNCHANGED',version};
   run('INSERT INTO cf_solo_sources VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,CONTEXT_KIND,p,p,JSON.stringify(options),now);
   return {code:'UPDATED',version};
  });
 }
 function requestRefresh(w,p,{now,dueAt=now,requestId,authority}={}){
  now=iso(now);dueAt=iso(dueAt);
  return tx(()=>{own(w,p);if(!audit(w,p,requestId,authority,{operation:'recompute',dueAt},now))return {code:'DUPLICATE'};
   enqueue(w,p,now,dueAt);return {code:'QUEUED'};
  });
 }
 function claim({workspace,now,workerId,limit=25,leaseMs=30000}={}){
  id(workspace);id(workerId);now=iso(now);bounded(limit,1,100);bounded(leaseMs,1,300000);
  return tx(()=>{
   // Two indexed, bounded scans; never an OR/full-inventory sweep.
   const expired=all("SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND state='LEASED' AND lease_until<=? ORDER BY lease_until,opportunity_id LIMIT ?",workspace,now,limit);
   const ready=all("SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND state='READY' AND due_at<=? ORDER BY due_at,opportunity_id LIMIT ?",workspace,now,limit-expired.length);
   const claims=[];
   for(const q of [...expired,...ready]){
    if(q.attempts>=maxAttempts){run("UPDATE cf_evaluation_queue SET state='FAILED',claim_token=NULL,worker_id=NULL,lease_until=NULL,last_error='ATTEMPTS_EXHAUSTED' WHERE workspace_id=? AND opportunity_id=?",workspace,q.opportunity_id);continue}
    const token=randomUUID(),leaseUntil=new Date(Date.parse(now)+leaseMs).toISOString();
    run("UPDATE cf_evaluation_queue SET state='LEASED',claim_token=?,worker_id=?,claimed_generation=generation,claimed_at=?,lease_until=?,attempts=attempts+1,recovery_count=recovery_count+? WHERE workspace_id=? AND opportunity_id=?",token,workerId,now,leaseUntil,q.state==='LEASED'?1:0,workspace,q.opportunity_id);
    claims.push({workspace_id:workspace,opportunity_id:q.opportunity_id,generation:q.generation,target_revision:q.target_revision,token,worker_id:workerId,claimed_at:now,lease_until:leaseUntil,due_at:q.due_at,lag_ms:Math.max(0,Date.parse(now)-Date.parse(q.due_at)),recovered:q.state==='LEASED'});
   }
   return {claims,examined:expired.length+ready.length,limit};
  });
 }
 const validLease=(q,c,now)=>q?.state==='LEASED'&&q.claim_token===c.token&&q.worker_id===c.worker_id&&q.claimed_generation===c.generation&&q.lease_until>now&&now>=q.claimed_at;
 function evaluate(c,{now}={}){
  now=iso(now);
  return tx(()=>{
   const q=row(c.workspace_id,c.opportunity_id);if(!validLease(q,c,now))throw Error('lease_lost');
   // Governed bounded retention cleanup; revision triggers preserve any new evaluation work.
   const expired=all("SELECT event_key FROM cf_evidence_events WHERE workspace_id=? AND opportunity_id=? AND state='ACTIVE' AND retain_until<=? ORDER BY retain_until,event_key LIMIT 100",c.workspace_id,c.opportunity_id,now);
   for(const e of expired)memory.erase(c.workspace_id,e.event_key,'EXPIRED',{now});
   const profile=memory.project(c.workspace_id,c.opportunity_id,{now}),policy=context(c.workspace_id,c.opportunity_id);
   const decision=planSignal(profile,{...policy.options,now});
   return {claim:c,profile,context_version:policy.version,decision,valid_until:minimum([profile.next_change_at,decision.next_evaluation_at])};
  });
 }
 function releaseStale(q,now){
  run("UPDATE cf_evaluation_queue SET state='READY',generation=generation+1,target_revision=?,due_at=?,enqueued_at=?,claim_token=NULL,worker_id=NULL,claimed_generation=NULL,lease_until=NULL,attempts=0,stale_ack_count=stale_ack_count+1,last_error='STALE_EVALUATION' WHERE workspace_id=? AND opportunity_id=?",revision(q.workspace_id,q.opportunity_id),now,now,q.workspace_id,q.opportunity_id);
  return {code:'STALE_REQUEUED'};
 }
 function acknowledge(prepared,{now,interruptAfterDecision=false}={}){
  now=iso(now);const c=prepared.claim,w=c.workspace_id,p=c.opportunity_id;
  return tx(()=>{
   const q=row(w,p);if(!validLease(q,c,now))return {code:'LEASE_LOST'};
   if(now<prepared.profile.as_of)throw Error('clock_reversed');
   const policy=context(w,p),current=memory.project(w,p,{now:prepared.profile.as_of});
   const decision=planSignal(current,{...policy.options,now:current.as_of});
   const validUntil=minimum([current.next_change_at,decision.next_evaluation_at]);
   if(q.generation!==c.generation||q.target_revision!==current.revision||current.projection_version!==prepared.profile.projection_version
    ||policy.version!==prepared.context_version||validUntil&&validUntil<=now)return releaseStale(q,now);
   // Rebuild internally, so the public local harness cannot persist forged execution eligibility.
   if(digest(decision)!==digest(prepared.decision))throw Error('decision_mismatch');
   const decisionId=memory.recordDecision(current,decision);
   run('INSERT INTO cf_evaluation_results VALUES(?,?,?,?,?,?,?,?,?)',w,p,c.generation,decisionId,current.revision,policy.version||'MISSING',current.as_of,now,JSON.stringify({...decision,context_snapshot:policy.options}));
   if(interruptAfterDecision)throw Error('simulated_ack_interruption');
   const dueAt=minimum([current.next_change_at,decision.next_evaluation_at]);
   run("UPDATE cf_evaluation_queue SET state=?,generation=generation+?,due_at=?,enqueued_at=?,reason_mask=?,claim_token=NULL,worker_id=NULL,claimed_generation=NULL,lease_until=NULL,attempts=0,last_error=NULL,last_decision_id=? WHERE workspace_id=? AND opportunity_id=?",dueAt?'READY':'IDLE',dueAt?1:0,dueAt,now,dueAt?16:0,decisionId,w,p);
   if(attentionReady){
    const restricted=decision.held||policy.options.workflowOwner==='UNKNOWN'||get('SELECT status FROM cf_solo_opportunities WHERE workspace_id=? AND id=?',w,p)?.status==='closed';
    const a=currentProducerAttention({status:restricted?'HELD':'CURRENT',recommendation:decision,reason:decision.reason_category,producer_attention:decision.producer_attention});
    const candidate={build:ATTENTION_SELECTION_BUILD,decision_id:decisionId,evidence_revision:current.revision,context_version:policy.version,
     profile_version:current.projection_version,result_generation:c.generation,queue_generation:c.generation+(dueAt?1:0),
     band:a.band,rank:a.rank,human_attention_eligible:a.human,valid_until:validUntil,published_at:now};
    run('UPDATE cf_evaluation_queue SET attention_eligible=?,attention_order=?,attention_due=?,attention_json=? WHERE workspace_id=? AND opportunity_id=?',a.human?1:0,-a.rank,decisionAttentionDue(decision.reason_category,policy.options.commitments)||'9999',JSON.stringify(candidate),w,p);
   }
   return {code:'ACKNOWLEDGED',decision_id:decisionId,action:decision.action,next_evaluation_at:dueAt};
  });
 }
 function fail(c,{now}={}){
  now=iso(now);
  return tx(()=>{const q=row(c.workspace_id,c.opportunity_id);if(!validLease(q,c,now))return {code:'LEASE_LOST'};
   if(q.generation!==c.generation)return releaseStale(q,now);
   const terminal=q.attempts>=maxAttempts,dueAt=new Date(Date.parse(now)+Math.min(60000,1000*2**(q.attempts-1))).toISOString();
   run("UPDATE cf_evaluation_queue SET state=?,due_at=?,claim_token=NULL,worker_id=NULL,claimed_generation=NULL,lease_until=NULL,last_error='EVALUATION_FAILED' WHERE workspace_id=? AND opportunity_id=?",terminal?'FAILED':'READY',dueAt,c.workspace_id,c.opportunity_id);
   return {code:terminal?'FAILED':'RETRY',due_at:dueAt};
  });
 }
 function runBatch(options){
  const batch=claim(options),outcomes=[];
  for(const c of batch.claims){try{outcomes.push(acknowledge(evaluate(c,{now:options.now}),{now:options.now}));}catch{outcomes.push(fail(c,{now:options.now}));}}
  return {...batch,outcomes};
 }
 function metrics(workspace,{now}={}){
  id(workspace);now=iso(now);
  const states=all('SELECT state,count(*) count FROM cf_evaluation_queue WHERE workspace_id=? GROUP BY state',workspace);
  const ready=get("SELECT count(*) count,min(due_at) earliest FROM cf_evaluation_queue WHERE workspace_id=? AND state='READY' AND due_at<=?",workspace,now);
  const expired=get("SELECT count(*) count FROM cf_evaluation_queue WHERE workspace_id=? AND state='LEASED' AND lease_until<=?",workspace,now);
  const totals=get('SELECT COALESCE(sum(recovery_count),0) recoveries,COALESCE(sum(stale_ack_count),0) stale_acks FROM cf_evaluation_queue WHERE workspace_id=?',workspace);
  return {states:Object.fromEntries(states.map(r=>[r.state,r.count])),due:ready.count,expired_leases:expired.count,
   oldest_due_lag_ms:ready.earliest?Math.max(0,Date.parse(now)-Date.parse(ready.earliest)):0,...totals};
 }
 return {memory,setContext,context,requestRefresh,claim,evaluate,acknowledge,fail,runBatch,metrics};
}
