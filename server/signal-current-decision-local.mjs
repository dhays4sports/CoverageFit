// C3 LOCAL SYNTHETIC READ MODEL. No hosted route, queue mutation or provider adapter.
import {createHash} from 'node:crypto';
import {prospectMemoryLocal} from './prospect-memory-local.mjs';
import {normalizeContext} from './signal-evaluation-queue-local.mjs';
import {planSignal} from './signal-dynamic-planner.mjs';
export const CURRENT_DECISION_BUILD='CF-SIGNAL-C3-1';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const eligibility=()=>({sms:false,call:false,external:false,reason:'SHADOW_ONLY'});
const clock=x=>{if(typeof x!=='string'||!Number.isFinite(Date.parse(x)))throw Error('invalid_clock');return new Date(x).toISOString()};
const identifier=x=>{if(typeof x!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(x))throw Error('invalid_identifier');return x};
// Pure selection: never computes a replacement recommendation or promotes historical actions.
export function projectCurrentDecision({id,now,profile,atDecision,policy,queue,result,decision,safety,sourceValid=true}){
 const output={build:CURRENT_DECISION_BUILD,id,as_of:now,status:'UNAVAILABLE',reason:'STORE_OR_IDENTITY_UNAVAILABLE',
  recommendation:null,evidence_refs:[],source_references:[],evidence_revision:profile?.revision??null,evidence_version:profile?.projection_version??null,
  decision_version:result?.decision_id??null,context_version:policy?.version??null,workflow_owner:policy?.options?.workflowOwner??'UNKNOWN',
  next_evaluation_at:queue?.state==='FAILED'?null:queue?.due_at??null,producer_attention:false,requires_human_review:true,
  restrictions:safety?.contact_restrictions||[],execution_eligibility:eligibility(),
  evaluation:queue?{state:queue.state,generation:queue.generation,target_revision:queue.target_revision,due:['READY','LEASED'].includes(queue.state)&&!!queue.due_at&&queue.due_at<=now,
   lease_expired:queue.state==='LEASED'&&queue.lease_until<=now,attempts:queue.attempts,last_error:queue.last_error}:null,
  historical:result?{decision_id:result.decision_id,generation:result.generation,evaluated_at:result.evaluated_at,profile_version:decision?.profile_version}:null};
 const finish=(status,reason,extra={})=>({...output,status,reason,...extra});
 if(!profile||!policy?.version||!queue)return output;
 if(!sourceValid)return finish('HELD','SOURCE_LINK_RESTRICTED');
 if(safety.held||policy.options.workflowOwner==='UNKNOWN')return finish('HELD',safety.held?safety.reason_category:'WORKFLOW_OWNER_UNKNOWN',{
  producer_attention:safety.producer_attention,requires_human_review:!['CONTACT_SUPPRESSED','CONTROL_OR_TEST','PRODUCER_TAKEOVER','CONTACT_WAIT'].includes(safety.reason_category)});
 if(queue.state==='FAILED')return finish('FAILED',queue.last_error||'EVALUATION_FAILED',{recovery:'NEW_MATERIAL_EVIDENCE_OR_GOVERNED_REFRESH',producer_attention:true});
 if(!result)return queue.state==='IDLE'?finish('UNAVAILABLE','NO_RELIABLE_COMMITTED_RESULT'):finish('PENDING','NO_COMMITTED_RESULT',{requires_human_review:false});
 if(!decision||result.acknowledged_at>now||result.evaluated_at>now)return finish('UNAVAILABLE','INVALID_RESULT_OR_CLOCK');
 const timer=queue.reason_mask===16&&queue.state==='READY'&&queue.due_at>now&&queue.generation===result.generation+1;
 const sameGeneration=queue.state==='IDLE'&&queue.generation===result.generation;
 const boundary=[atDecision?.next_change_at,decision.next_evaluation_at].filter(Boolean).sort()[0];
 if(result.evidence_revision!==profile.revision||queue.target_revision!==profile.revision||result.context_version!==policy.version
  ||decision.profile_version!==atDecision?.projection_version||result.decision_id!==queue.last_decision_id
  ||boundary&&boundary<=now||!timer&&!sameGeneration)
  return finish('STALE','SUPERSEDED_EVIDENCE_CONTEXT_GENERATION_OR_TIME',{requires_human_review:false});
 return finish('CURRENT',decision.reason_category,{recommendation:{action:decision.action,reason:decision.reason,question_field:decision.question_field,missing:decision.missing},
  evidence_refs:decision.evidence_refs,source_references:Object.values(profile.facts).flatMap(f=>f.evidence||[]).map(e=>({event_id:e.source_event_id,source_ref:e.source_ref,observed_at:e.observed_at})),decision_profile_version:decision.profile_version,producer_attention:decision.producer_attention,
  requires_human_review:decision.action==='HUMAN REVIEW'});
}
export function signalCurrentDecisionLocal(db,{syntheticOnly=false}={}){
 if(!syntheticOnly)throw Error('synthetic_only_required');
 const memory=prospectMemoryLocal(db,{syntheticOnly:true});
 const get=(sql,...args)=>db.prepare(sql).get(...args);
 function snapshot(fn){if(db.isTransaction)throw Error('read_requires_own_snapshot');db.exec('BEGIN');try{const result=fn();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}
 function read(w,p,now){
  const unavailable=()=>projectCurrentDecision({id:p,now});
  try{
   if(!get('SELECT 1 FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=?',w,p))return unavailable();
   const q=get('SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND opportunity_id=?',w,p);
   const stored=get("SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind='signal_c2_context_v1' AND source_id=? AND opportunity_id=?",w,p,p);
   if(!stored)return unavailable();
   const options=normalizeContext(JSON.parse(stored.summary_json)),policy={options,version:digest(options)};
   const profile=memory.project(w,p,{now});
   const r=get('SELECT * FROM cf_evaluation_results WHERE workspace_id=? AND opportunity_id=? ORDER BY generation DESC LIMIT 1',w,p);
   const decision=r&&JSON.parse(r.decision_json);
   const atDecision=r&&memory.project(w,p,{now:r.evaluated_at});
   if(r){
    const trace=get('SELECT * FROM cf_evidence_decisions WHERE workspace_id=? AND decision_id=?',w,r.decision_id);
    if(!trace||trace.opportunity_id!==p||trace.profile_version!==decision.profile_version||trace.action!==decision.action||trace.reason_category!==decision.reason_category)return unavailable();
   }
   const invalid=get(`SELECT 1 FROM cf_evidence_events e LEFT JOIN cf_solo_sources s ON s.workspace_id=e.workspace_id AND s.kind=e.source_kind AND s.source_id=e.source_id
    WHERE e.workspace_id=? AND e.opportunity_id=? AND e.state='ACTIVE' AND (s.opportunity_id IS NULL OR s.opportunity_id<>e.opportunity_id) LIMIT 1`,w,p);
   return projectCurrentDecision({id:p,now,profile,atDecision,policy,queue:q,result:r,decision,safety:planSignal(profile,{...options,now}),sourceValid:!invalid});
  }catch{return unavailable()} // Missing schema, invalid stored context/JSON or unreadable state fails closed; no repair on read.
 }
 function current(workspace,prospect,{now}={}){identifier(workspace);identifier(prospect);now=clock(now);return snapshot(()=>read(workspace,prospect,now))}
 function page(workspace,{now,after='',limit=25}={}){
  identifier(workspace);now=clock(now);if(after)identifier(after);
  if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('invalid_page_bound');
  return snapshot(()=>{
   const keys=db.prepare('SELECT opportunity_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id>? ORDER BY opportunity_id LIMIT ?').all(workspace,after,limit+1);
   const items=keys.slice(0,limit).map(k=>read(workspace,k.opportunity_id,now));
   return {items,next_cursor:keys.length>limit?items.at(-1).id:null,limit,as_of:now};
  });
 }
 return {current,page};
}
// Contract-only bridge for existing Producer Workspace / Today / Prospect 360 vocabulary.
// Caller must discard prior action fields; no fallback to old action_quality or sms.decision_2.
export function currentDecisionProducerRecord(value){
 const codes={'CALL':'CALL_CUSTOMER','ASK ONE QUESTION':'ASK_ONE_QUESTION','QUOTE PREPARATION':'PREPARE_OR_REVIEW_QUOTE',
  'HUMAN REVIEW':'PRODUCER_REVIEW_AND_RESPOND','LATER':'WAIT_UNTIL_RECORDED_TIME','CLOSE':'CLOSE_NO_OUTREACH','NO ACTION':'NO_ACTION'};
 const current=value.status==='CURRENT'?value.recommendation:null;
 return {id:value.id,current_decision:value,action_quality:{version:CURRENT_DECISION_BUILD,actionable:false,
  action:{code:codes[current?.action]||'NO_ACTION',label:current?.reason||value.reason,channel:null,due_at:null,actionable:false,source:'signal_current_decision'},
  why_now:{text:current?.reason||value.reason,source_ref:{kind:'signal_current_decision',id:value.decision_version}},
  evidence:value.source_references.map(e=>({kind:'prospect_memory',text:'Source-backed evidence',source_ref:e.source_ref,event_id:e.event_id}))},
  attention:{actionable:false,requires_human_review:value.requires_human_review,producer_attention:value.producer_attention}};
}
