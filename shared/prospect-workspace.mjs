import {projectAgencyZoomEvidence} from './agencyzoom-resource-evidence.mjs';
// Read-only UI projection of the existing shared profile. No scheduler, CRM or
// recommendation engine lives here. Unknown state stays unknown.
export const WORKSPACE_BUILD='CF-SHARED-PROSPECT-WORKSPACE-1';
const materialKinds=new Set(['fact','qualification','gap','readiness','commitment','callback','task','transcript','handoff','review']);
const byTime=(a,b)=>Number.isFinite(a.sequence)&&Number.isFinite(b.sequence)?a.sequence-b.sequence||(a.itemOrder||0)-(b.itemOrder||0):String(a.approvedAt||'').localeCompare(String(b.approvedAt||''))||a.id.localeCompare(b.id);
const statuses=new Set(['verified','tentative','unverified']);
export function dimensions(item){
 const legacy=item.confidence;
 return {verification:statuses.has(item.verification)?item.verification:statuses.has(legacy)?legacy:'unknown',
 freshness:item.freshness|| (legacy==='stale'?'stale':'unknown'),
 producerReview:'approved_record',
 draftReview:item.kind==='draft'?'awaiting_review':'not_applicable',
 processing:legacy==='failed'?'failed':'not_reported',
 taskState:['commitment','callback','task'].includes(item.kind)?'unlinked':'not_applicable',
 delivery:'not_reported',legacyStatus:legacy||null};
}
export function materialEvidence(profile,opportunityId){
 return {customerId:profile.customerId,link:profile.links.find(l=>l.opportunityId===opportunityId)||null,
 items:profile.items.filter(i=>i.opportunityId===opportunityId&&materialKinds.has(i.kind)).slice().sort((a,b)=>a.id.localeCompare(b.id)).map(i=>({id:i.id,kind:i.kind,value:i.value,verification:i.verification||i.confidence,freshness:i.freshness||null,supersedes:i.supersedes||null,target:i.target||null,dimension:i.dimension||null,resolution:i.resolution||null,factKey:i.factKey||null,due:i.due||'',actorRole:i.actorRole||'unknown',timingConfirmation:i.timingConfirmation||'unconfirmed',readiness:i.readiness||null,observedAt:i.observedAt||'',effectiveAt:i.effectiveAt||'',transcriptState:i.transcriptState||null,smsEvidence:i.smsEvidence||null})),
 sources:(profile.context?.sources||[]).filter(s=>s.opportunityId===opportunityId&&s.kind!=='workspace_example_readonly'),sms:profile.context?.sms||[],importedSms:(profile.context?.agencyZoomSms?.threads.length||profile.context?.agencyZoomSms?.held||profile.context?.agencyZoomSms?.reviewReferences.length)?{status:profile.context.agencyZoomSms.status,held:profile.context.agencyZoomSms.held,threads:profile.context.agencyZoomSms.threads.map(t=>({id:t.id,revision:t.revision,digest:t.digest,status:t.status,requestedPagesComplete:t.requestedPagesComplete})),references:profile.context.agencyZoomSms.reviewReferences.map(r=>({itemId:r.itemId,current:r.current,available:r.available,status:r.status}))}:null,
 tasks:(profile.tasks||[]).filter(t=>t.opportunityId===opportunityId).map(t=>({id:t.id,state:t.state,due:t.due,blocker:t.blocker||''})).sort((a,b)=>a.id.localeCompare(b.id))};
}
export function projectWorkspace(profile,opportunityId,{evidenceRevision=null,asOf=new Date().toISOString(),governed=null}={}){
 const linked=profile.links.find(l=>l.opportunityId===opportunityId);
 if(!linked)return {build:WORKSPACE_BUILD,status:'identity_unavailable',opportunityId,customerId:profile.customerId};
 const history=profile.items.filter(i=>i.opportunityId===opportunityId).slice().sort(byTime);
 const records=history.filter(i=>i.kind!=='review').map(i=>({...i,dimensions:dimensions(i)}));const map=new Map(records.map(i=>[i.id,i]));
 for(const event of history.filter(i=>i.kind==='review')){const target=map.get(event.target);if(!target)continue;
  const field={verification:'verification',freshness:'freshness',draft_review:'draftReview',handoff:'handoffState'}[event.dimension];if(field){target.dimensions[field]=event.resolution;target.lastReviewId=event.id;if(event.dimension==='draft_review'&&event.resolution==='approved')target.dimensions.draftReview=event.coveredEvidenceRevision===evidenceRevision?'approved':'needs_review';}}
 for(const item of records){if(item.supersedes&&map.has(item.supersedes)){map.get(item.supersedes).dimensions.freshness='superseded';map.get(item.supersedes).supersededBy=item.id;}if(['task','callback','commitment'].includes(item.kind)){
 const task=(profile.tasks||[]).find(t=>t.sourceKey===`desktop:${item.requestId}:${item.id.slice(item.requestId.length+1)}`||t.id.endsWith('_'+item.requestId+'_'+item.id.slice(item.requestId.length+1)));
 if(task){item.task=task;item.dimensions.taskState=task.state;}}
 }
 for(const item of records)if(item.externalEvidence){const x=item.externalEvidence,source=profile.context?.sources?.find(s=>s.kind==='agencyzoom_resource_v2'&&s.sourceId===x.sourceId),v=source?.summary;const current=v&&v.revision===x.revision&&v.digest===x.digest&&v.resource?.availability==='present'&&Date.parse(asOf)-Date.parse(v.resource.updatedAt)<=30*86400000;item.dimensions.sourceEvidence=current?'verified_revision_current':'source_changed_or_unavailable';if(!current&&item.dimensions.freshness!=='superseded')item.dimensions.freshness='stale';}
 for(const item of records)if(item.smsEvidence){const source=profile.context?.agencyZoomSms?.reviewReferences.find(r=>r.itemId===item.id);item.dimensions.sourceEvidence=source?.status||'source_unavailable';if(!source?.current&&item.dimensions.freshness!=='superseded')item.dimensions.freshness='stale';}
 const facts=records.filter(i=>['fact','qualification'].includes(i.kind));const groups=new Map();for(const fact of facts){if(!fact.factKey||['stale','superseded'].includes(fact.dimensions.freshness))continue;const group=groups.get(fact.factKey)||[];group.push(fact);groups.set(fact.factKey,group);}
 for(const group of groups.values())if(new Set(group.map(i=>i.value.trim().toLowerCase())).size>1)for(const i of group)i.dimensions.freshness='conflicted';
 const summary=records.filter(i=>i.kind==='summary').at(-1)||null;
 if(summary)summary.summaryState=!summary.coveredEvidenceRevision?'unversioned':summary.coveredEvidenceRevision===evidenceRevision?'current':'needs_review';
 const readiness=records.filter(i=>i.kind==='readiness'&&!['stale','superseded'].includes(i.dimensions.freshness)).at(-1)||null;
 const gaps=records.filter(i=>i.kind==='gap'&&i.dimensions.handoffState!=='resolved'&&!['stale','superseded'].includes(i.dimensions.freshness));
 const readinessState=gaps.length?'missing_information':readiness?.readiness||'not_assessed';
 const commitments=records.filter(i=>['commitment','callback','task'].includes(i.kind)).sort((a,b)=>(Date.parse(a.task?.due||a.due)||Infinity)-(Date.parse(b.task?.due||b.due)||Infinity));
 const transcript=records.filter(i=>i.kind==='transcript').at(-1)||null;
 const handoffs=records.filter(i=>i.kind==='handoff'&&i.dimensions.handoffState!=='resolved');
 const drafts=records.filter(i=>i.kind==='draft');const safety=profile.context?.contactSafety||{};
 let nextAction={status:'unavailable',label:'Current governed recommendation unavailable',reason:'Existing Work and manual drafting controls remain available. No action is inferred from these notes.',outreachAuthorized:false};
 if(governed?.status==='CURRENT'&&governed.action?.label)nextAction={...nextAction,status:'current',label:governed.action.label,reason:governed.why_now?.text||'',code:governed.action.code};
 if(safety.suppressed||safety.control)nextAction={...nextAction,status:'held',label:safety.suppressed?'Contact suppressed — review only':'CONTROL — follow existing agency workflow',reason:'Profile evidence does not remove this hold.'};
 if(safety.importedSmsHold)nextAction={...nextAction,status:'held',label:'Imported SMS evidence — contact review hold',reason:'Historical opt-out, ownership or integrity evidence requires review. Current provider state is not certified.',outreachAuthorized:false};
 return {build:WORKSPACE_BUILD,status:'ready',customerId:profile.customerId,opportunityId,householdId:linked.householdId,productLine:linked.products||'Not recorded',asOf,evidenceRevision,profileVersion:profile.version,
  coverage:{complete:!(profile.context?.agencyZoomSms?.threads.length)&&!profile.context?.agencyZoomSms?.held&&!profile.historyLimited&&!profile.context?.sourceDetailsTruncated&&!profile.context?.externalRelationshipHold&&!profile.context?.externalIntegrityHold&&!(profile.context?.sources||[]).some(s=>s.kind==='agencyzoom_resource_v2'&&s.summary?.inventoryComplete!==true),historyLimited:!!profile.historyLimited,sourceDetailsTruncated:!!profile.context?.sourceDetailsTruncated},
  summary,nextAction,readiness:{state:readinessState,evidence:readiness,gaps,nextQuestion:gaps[0]?.value||null,eligibilityAssessed:false},
  facts:{current: facts.filter(i=>i.factKey&&i.dimensions.verification==='verified'&&i.dimensions.freshness==='current'),uncertain:facts.filter(i=>!i.factKey||i.dimensions.verification!=='verified'||i.dimensions.freshness!=='current'),reconciledBy:'explicit_fact_key_and_supersession_only'},
  commitments,transcript:{state:transcript?.transcriptState|| (transcript?'unverified':'missing'),latest:transcript},handoffs,drafts,records,history,
  agencyZoomSms:profile.context?.agencyZoomSms||null,
  agencyZoom:projectAgencyZoomEvidence(profile.context?.sources,{customerId:profile.customerId,opportunityId,tasks:profile.tasks,records,asOf}),
  counts:{openCommitments:commitments.filter(i=>!['completed','cancelled'].includes(i.dimensions.taskState)).length,readinessGaps:gaps.length,draftsNeedingReview:drafts.filter(i=>['awaiting_review','needs_review'].includes(i.dimensions.draftReview)).length,unresolvedHandoffs:handoffs.length}};
}
