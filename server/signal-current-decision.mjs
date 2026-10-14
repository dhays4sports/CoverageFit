// Canonical pure C3 projection, shared by local and portable read harnesses.
import {decisionAttentionDue} from './producer-intelligence-contract.mjs';
export const CURRENT_DECISION_BUILD='CF-SIGNAL-C3-1';
const eligibility=()=>({sms:false,call:false,external:false,reason:'SHADOW_ONLY'});
// Pure selection: never computes a replacement recommendation or promotes historical actions.
export function projectCurrentDecision({id,now,profile,atDecision,policy,queue,result,decision,safety,sourceValid=true}){
 const output={build:CURRENT_DECISION_BUILD,id,as_of:now,status:'UNAVAILABLE',reason:'STORE_OR_IDENTITY_UNAVAILABLE',
  recommendation:null,evidence_refs:[],source_references:[],evidence_revision:profile?.revision??null,evidence_version:profile?.projection_version??null,
  decision_version:result?.decision_id??null,context_version:policy?.version??null,workflow_owner:policy?.options?.workflowOwner??'UNKNOWN',population:policy?.options?.population??'OTHER',
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
  attention_due_at:decisionAttentionDue(decision.reason_category,policy.options.commitments),requires_human_review:decision.action==='HUMAN REVIEW'});
}
