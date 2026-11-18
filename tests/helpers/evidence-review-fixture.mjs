import {fixture,load,config,principal,page} from './agencyzoom-fixture.mjs';
import {sharedProfileService} from '../../server/shared-prospect-profile.mjs';
import {synchronizeAgencyZoomSms,simulatedAgencyZoomTransport} from '../../server/agencyzoom-connector.mjs';
export const feature={enabled:true,agencyId:config.agencyId,databaseId:config.databaseId};
export async function reviewFixture(t){const f=await fixture(t);f.service=()=>sharedProfileService(f.repo(),{evidenceReview:feature});f.read=async()=>{const oid=await f.op('op-home'),cid=(await f.repo().profile(oid)).customer.id;return f.service().read(cid,{opportunityId:oid});};f.sms=(records=[load('sms')],options={})=>synchronizeAgencyZoomSms({config,principal,store:f.store,transport:simulatedAgencyZoomTransport([page(records)]),sleep:async()=>{},...options});
 f.body=(p,items,requestId=crypto.randomUUID())=>({requestId,customerId:p.customerId,opportunityId:p.view.opportunityId,expectedVersion:p.version,threadId:'offline-evidence-review',threadTitle:'Synthetic producer reconciliation',approved:true,items:items.map(i=>({id:crypto.randomUUID(),confidence:'unverified',sources:['producer-proof'],...i})),evidence:{messages:[{id:'producer-proof',role:'user',body:'Exact synthetic identifiers and source were explicitly reviewed by the producer.',created:new Date().toISOString(),captureIds:[]}],captures:[]}});
 f.fact=async({value,factKey='renewal_date:home',externalEvidence,smsEvidence,supersedes,requestId}={})=>{const p=await f.read();return f.service().commit(f.body(p,[{kind:'fact',label:'Reviewed insurance fact',value,factKey,confidence:'verified',verification:'verified',freshness:'current',reviewReason:'Compared the exact original source and selected this supported value.',...(externalEvidence?{externalEvidence}:{}),...(smsEvidence?{smsEvidence}:{}),...(supersedes?{supersedes}:{})}],requestId));};
 f.policyChoice=async(value='2027-04-01')=>{const p=await f.read(),r=p.view.agencyZoom.renewals.find(r=>r.field==='expiration');return f.fact({value,factKey:r.factKey,externalEvidence:{sourceId:r.sourceId,revision:r.revision,digest:r.digest,field:r.field}});};
 f.smsRef=async()=>{const p=await f.read(),r=p.view.agencyZoomSms.threads.find(t=>t.id==='thread-1'),m=r.messages.find(m=>m.id==='message-1');return {threadId:r.id,threadRevision:r.revision,threadDigest:r.digest,messageId:m.id,revision:m.revision,digest:m.digest};};
 f.localTask=async(id='local-task',state='open')=>{await f.store.repositoryDb.prepare("INSERT INTO cf_solo_tasks(id,workspace_id,opportunity_id,assignee_id,work_type,title,due_at,state,source_key,created_at) VALUES(?,?,?,'synthetic-owner','quoting_service','Synthetic local obligation','2026-11-19T18:00:00.000Z',?,?,'2026-11-18T10:00:00.000Z')").bind(id,config.workspace,await f.op('op-home'),state,'manual:'+id).run();return id;};
 f.decisionBody=async(kind,localTaskId='local-task',requestId=crypto.randomUUID())=>{const p=await f.read(),issue=p.view.review.open.find(i=>i.kind===kind);if(!issue)throw Error('Expected actionable issue '+kind);const candidate=issue.action.candidates.find(t=>t.id===localTaskId);return f.body(p,[{kind:'note',label:'Explicit external task reconciliation',value:'Producer reviewed the exact task relationship/state; local Work remains unchanged.',reconciliation:{operation:issue.action.operation,issueId:issue.id,expectedReviewRevision:p.view.review.evidenceRevision,sourceId:issue.action.sourceId,sourceRevision:issue.action.sourceRevision,sourceDigest:issue.action.sourceDigest,localTaskId,expectedTaskVersion:candidate.version,reason:'Compared exact synthetic external/local task IDs and retained their independent authorities.'}}],requestId);};
 return f;
}
export const cleanPolicy=()=>({...load('policy'),dates:[]});
export const updated=(v,changes={})=>({...structuredClone(v),revision:'r2',updatedAt:'2026-11-18T11:30:00.000Z',...changes});
export async function prepareCase(f,id){switch(id){
 case 'clean_lead':break;
 case 'clean_policy':await f.sync([cleanPolicy()]);break;
 case 'clean_sms':await f.sms();break;
 case 'settled_stop':{const v=load('sms');v.messages[0].body='STOP';await f.sms([v]);break;}
 case 'policy_conflict':await f.sync([load('policy')]);break;
 case 'policy_resolved':await f.sync([load('policy')]);await f.policyChoice();break;
 case 'policy_reopened':await f.sync([load('policy')]);await f.policyChoice();await f.sync([updated(load('policy'),{expirationDate:'2027-05-01'})]);break;
 case 'policy_term':await f.sync([cleanPolicy()]);await f.sync([updated(cleanPolicy(),{effectiveDate:'2026-04-01'})]);break;
 case 'policy_integrity':await f.sync([load('policy')]);await f.store.repositoryDb.prepare("UPDATE cf_solo_sources SET summary_json=json_set(summary_json,'$.resource.carrier','corrupted') WHERE kind='agencyzoom_resource_v2'").run();break;
 case 'sms_stale':await f.sms();await f.fact({value:'2027-03-01',smsEvidence:await f.smsRef()});{const v=load('sms');v.revision='thread-r2';v.updatedAt='2026-11-18T12:00:00.000Z';v.messages[0]={...v.messages[0],revision:'message-r2',updatedAt:v.updatedAt,change:'edited',body:'The reviewed source changed.'};await f.sms([v]);}break;
 case 'sms_ownership':await f.sms([{...load('sms'),relationship:'unresolved'}]);break;
 case 'sms_integrity':await f.sms();await f.store.repositoryDb.prepare("UPDATE az_sms_messages SET payload_json=json_set(payload_json,'$.body','corrupted') WHERE message_id='message-1'").run();break;
 case 'sms_partial':await f.sms([{...load('sms'),historyCompleteReported:false}]);break;
 case 'sms_missing_page':case 'sms_recovered':{const v={...load('sms'),pageCount:2,messages:[load('sms').messages[0]]};try{await f.sms([v]);}catch(e){if(e.code!=='incomplete_history')throw e;}if(id==='sms_recovered')await f.sms([v,{...v,pageIndex:1,messages:[load('sms').messages[1]]}]);break;}
 case 'external_task_only':await f.sync([load('task')]);break;
 case 'task_unlinked':await f.sync([load('task')]);await f.localTask();break;
 case 'task_linked':await prepareCase(f,'task_unlinked');await f.service().commit(await f.decisionBody('task_relationship'));break;
 case 'task_state_conflict':await f.sync([{...load('task'),state:'completed'}]);await f.localTask();f.store.reconcileExternalTask({externalTaskId:'task-1',localTaskId:'local-task'});break;
 case 'task_state_acknowledged':await prepareCase(f,'task_state_conflict');await f.service().commit(await f.decisionBody('task_state'));break;
 case 'task_state_reopened':await prepareCase(f,'task_state_acknowledged');await f.sync([updated(load('task'),{state:'completed'})]);break;
 case 'capacity_near':case 'capacity_limit':{const v=load('sms'),n=id==='capacity_near'?20:25,records=Array.from({length:8},(_,pageIndex)=>({...v,pageIndex,pageCount:8,messages:Array.from({length:n},(_,i)=>({...v.messages[0],id:'capacity-'+(pageIndex*n+i).toString().padStart(3,'0'),body:'Synthetic archived context'}))}));await f.sms(records);if(id==='capacity_limit')try{await f.sms([{...v,revision:'overflow-r2',updatedAt:'2026-11-18T12:00:00.000Z',messages:[{...v.messages[0],id:'overflow-message'}]}]);}catch(e){if(e.code!=='archive_bound')throw e;}break;}
 case 'sms_identity':await f.sms();{const other=await f.repo().create({contact:{name:'Other synthetic customer'},source:'Manual',products:'Home',reason:'',deadline:'',next:{workType:'quoting_service',title:'Existing work',dueAt:'2026-11-20T18:00:00.000Z'}},'review-other');await f.repo().linkProfile(await f.op('op-home'),other.opportunity.id,'review-explicit-relink');}break;
 default:throw Error('Unknown predeclared evaluation case '+id);
}}
