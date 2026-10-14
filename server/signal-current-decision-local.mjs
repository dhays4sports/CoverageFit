import {reconcileProducerIntelligence} from './producer-intelligence-contract.mjs';
// C3 LOCAL SYNTHETIC READ MODEL. No hosted route, queue mutation or provider adapter.
import {createHash} from 'node:crypto';
import {prospectMemoryLocal} from './prospect-memory-local.mjs';
import {normalizeContext} from './signal-context.mjs';
import {planSignal} from './signal-dynamic-planner.mjs';
import {projectCurrentDecision} from './signal-current-decision.mjs';
export {projectCurrentDecision,CURRENT_DECISION_BUILD} from './signal-current-decision.mjs';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clock=x=>{if(typeof x!=='string'||!Number.isFinite(Date.parse(x)))throw Error('invalid_clock');return new Date(x).toISOString()};
const identifier=x=>{if(typeof x!=='string'||! /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(x))throw Error('invalid_identifier');return x};
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
    const {context_snapshot,...originalDecision}=decision;
    if(digest([decision.profile_version,originalDecision])!==r.decision_id||r.context_version===policy.version&&digest(normalizeContext(context_snapshot))!==r.context_version)return unavailable();
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
 return {current,page,currentInSnapshot(workspace,prospect,{now}={}){
  if(!db.isTransaction)throw Error('read_snapshot_required');identifier(workspace);identifier(prospect);return read(workspace,prospect,clock(now));
 }};
}
// Contract-only bridge for existing Producer Workspace / Today / Prospect 360 vocabulary.
// Caller must discard prior action fields; no fallback to old action_quality or sms.decision_2.
export function currentDecisionProducerRecord(value){return reconcileProducerIntelligence({id:value.id,population:value.population},value)}
