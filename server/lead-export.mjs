import {authorizeProducer} from './consultation-inbox-core.mjs';

// Local draft. No infrastructure configuration is supplied by this module.
export const SCHEMA='coveragefit-leads/1';
export const EXPORT_RELEASE_BLOCKERS=Object.freeze(['legacy_scope_and_source_rights_signoff','remaining_identified_store_inventory','authoritative_suppression_coverage','hosted_security_and_capacity_acceptance']);
export const COLUMNS=['schema_version','canonical_lead_id','source_ids','opportunity_ids','name','email','phone','product','source','campaign','placement','created_at','updated_at','status','owner','permission_evidence','suppression_state','handoff_state','action_ids','quote_evidence','bound_premium_evidence','limitations'];
const headers={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
const fail=code=>{throw Object.assign(new Error(code),{code});};
const parse=v=>{try{return JSON.parse(v);}catch{fail('malformed_record');}};
const enc=new TextEncoder();
export function csvCell(v){const s=typeof v==='object'?JSON.stringify(v):String(v??'');return '"'+(/^[\s\u0000-\u001f\u007f\ufeff]*[=+\-@]/u.test(s)?"'"+s:s).replaceAll('"','""')+'"';}
const id=(kind,value)=>kind+':'+encodeURIComponent(value);
const pick=(v,keys)=>Object.fromEntries(keys.filter(k=>v?.[k]!==undefined).map(k=>[k,v[k]]));
const identified=c=>!!(c&&(c.name||c.firstName||c.lastName||c.email||c.phone||c.mobile));
const name=c=>c?.name||[c?.firstName,c?.lastName].filter(Boolean).join(' ');

// One SQL statement gives every adapter and count the same SQLite snapshot.
// No worklist pagination, implicit LIMIT, source sync, refresh or provider calls.
export function snapshotQuery(workspace,owner){
 const specs=[
 ['opportunities','SELECT * FROM cf_solo_opportunities WHERE workspace_id=?',[workspace]],
 ['sources','SELECT * FROM cf_solo_sources WHERE workspace_id=?',[workspace]],
 ['tasks','SELECT id,opportunity_id,state FROM cf_solo_tasks WHERE workspace_id=?',[workspace]],
 ['activities','SELECT id,opportunity_id,kind FROM cf_solo_activity WHERE workspace_id=?',[workspace]],
 ['attribution','SELECT * FROM cf_acq_opportunity_attribution WHERE workspace_id=?',[workspace]],
 ['measurements','SELECT * FROM cf_acq_opportunity_measurements WHERE workspace_id=?',[workspace]],
 ['suppression',"SELECT json_extract(c.data_json,'$.id') AS conversation_id, json_extract(c.data_json,'$.smsConsent.status') AS consent_status, json_extract(c.data_json,'$.signal.contact_suppressed') AS contact_suppressed, json_extract(c.data_json,'$.signal.decision_2') AS decision, json_extract(c.data_json,'$.state') AS state FROM sms_conversations c WHERE c.record_key LIKE 'sms-live-conversations/%' AND EXISTS (SELECT 1 FROM cf_solo_sources s WHERE s.workspace_id=? AND json_extract(s.summary_json,'$.conversation_id')=json_extract(c.data_json,'$.id'))",[workspace]],
 ['recommendations','SELECT id,owner_id,draft_json,outcome_json,created_at,updated_at FROM cf_recommendations WHERE owner_id=?',[owner]],
 ['leads',"SELECT * FROM pvx_records WHERE record_key LIKE 'lead-ops/lead/%'",[]],
 ['journeys',"SELECT * FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'",[]],
 ['consultations',"SELECT * FROM consultation_records WHERE record_key LIKE 'records/%'",[]]
 ];
 // json_object explicit column lists prevent accidental export of future columns.
 const cols={suppression:'conversation_id,consent_status,contact_suppressed,decision,state',opportunities:'id,workspace_id,owner_id,contact_json,source,products,status,stage,created_at,updated_at',sources:'kind,source_id,opportunity_id,summary_json',tasks:'id,opportunity_id,state',activities:'id,opportunity_id,kind',attribution:'opportunity_id,source_family,source_key,campaign_id,first_touch_json,latest_touch_json',measurements:'opportunity_id,quote_prepared_at,bound_at,written_premium_cents,premium_evidence_json',recommendations:'id,owner_id,draft_json,outcome_json,created_at,updated_at',leads:'record_key,data_json,expires_at,created_at,updated_at',journeys:'record_key,data_json,expires_at,created_at,updated_at',consultations:'record_key,data_json,expires_at,created_at,updated_at'};
 return {sql:'WITH '+specs.map(([n,q])=>n+' AS ('+q+')').join(',')+' SELECT '+specs.map(([n])=>`(SELECT json_object('count',count(*),'rows',json_group_array(json_object(${cols[n].split(',').map(c=>`'${c}',${c}`).join(',')}))) FROM ${n}) AS ${n}`).join(','),args:specs.flatMap(s=>s[2])};
}
export async function buildExport(db,policy,now=new Date()){
 if(policy?.version!==SCHEMA||!policy.workspace||!policy.owner||policy.legacyWorkspace!==policy.workspace||policy.inventoryReviewed!==true)fail('scope_review_required');
 // Recommendations have owner scope only; attest that owner belongs to exactly this workspace.
 if(policy.ownerWorkspace!==policy.workspace||!policy.sourceDecisions)fail('scope_review_required');
 const q=snapshotQuery(policy.workspace,policy.owner),raw=await db.prepare(q.sql).bind(...q.args).first();
 if(!raw)fail('snapshot_unavailable');
 if(enc.encode(JSON.stringify(raw)).length>16*1024*1024)fail('export_capacity_exceeded');
 const data={},counts={};for(const key of ['opportunities','sources','tasks','activities','attribution','measurements','suppression','recommendations','leads','journeys','consultations']){const part=parse(raw[key]);if(!Array.isArray(part.rows)||!Number.isSafeInteger(part.count)||part.count!==part.rows.length)fail('incomplete_snapshot');data[key]=part.rows;counts[key]=part.count;}
 const ops=new Map(data.opportunities.map(o=>[o.id,{...o,contact:parse(o.contact_json)}]));
 const sources=data.sources.map(s=>({...s,summary:parse(s.summary_json)}));
 if(sources.some(s=>!ops.has(s.opportunity_id)))fail('orphan_source');
 const represented=new Set(),records=new Map(),excluded={expired:0,anonymous:0,restricted:0},aliases=new Map();
 const decision=key=>{const d=policy.sourceDecisions[key];if(!['allow','deny'].includes(d))fail('source_rights_review_required');return d==='allow';};
 const expired=r=>{if(!r.expires_at)return false;if(!Number.isFinite(Date.parse(r.expires_at)))fail('invalid_retention');return Date.parse(r.expires_at)<=now.getTime();};
 function add(kind,sourceId,c,fields={},opId=null){
  if(!sourceId)fail('missing_source_id');
  const canonical=id(kind,sourceId);if(records.has(canonical))fail('duplicate_canonical_id');
  if(opId&&!ops.has(opId))fail('cross_scope_link');
  const o=opId?ops.get(opId):null,linked=opId?sources.filter(s=>s.opportunity_id===opId):[];
  // A restricted attached source restricts the whole joined row; no field laundering.
  const allowed=decision(kind)&&linked.every(s=>decision(s.kind));
  if(opId)represented.add(opId);
  if(!allowed){excluded.restricted++;return;}
  const sourceKey=fields.source||o?.source||kind;
  const right=policy.sourceKeyDecisions?.[sourceKey];
  if(!['allow','deny'].includes(right))fail('source_rights_review_required');
  if(right==='deny'){excluded.restricted++;return;}
  const a=data.attribution.find(a=>a.opportunity_id===opId),m=data.measurements.find(m=>m.opportunity_id===opId);
  for(const s of linked){const key=s.summary.source_key||s.summary.attribution?.sourceKey;if(key){const right=policy.sourceKeyDecisions?.[key];if(!['allow','deny'].includes(right))fail('source_rights_review_required');if(right==='deny'){excluded.restricted++;return;}}}
  const control=linked.some(s=>s.summary.cohort==='CONTROL');
  if(control&&policy.allowControl!==true){excluded.restricted++;return;}
  const recommendations=data.recommendations.filter(r=>linked.some(s=>s.kind==='recommendation'&&s.source_id===r.id));
  const r={schema_version:SCHEMA,canonical_lead_id:canonical,source_ids:[canonical,...linked.map(s=>id(s.kind,s.source_id))].filter((v,i,a)=>a.indexOf(v)===i).sort(),opportunity_ids:opId?[opId]:[],name:name(c),email:c?.email||'',phone:c?.mobile||c?.phone||'',product:o?.products||'',source:a?.source_key||o?.source||kind,campaign:a?.campaign_id||'',placement:'',created_at:o?.created_at||'',updated_at:o?.updated_at||'',status:o?.status||'unprojected',owner:o?.owner_id||policy.owner,permission_evidence:[],suppression_state:'unknown — consult authoritative suppression before contact',handoff_state:opId?'projected':'unprojected',action_ids:data.tasks.filter(t=>t.opportunity_id===opId).map(t=>t.id).concat(data.activities.filter(t=>t.opportunity_id===opId).map(t=>t.id)).sort(),quote_evidence:recommendations.map(r=>({recommendation_id:r.id,option_ids:(parse(r.draft_json).options||[]).map(o=>o.id)})),bound_premium_evidence:recommendations.map(r=>({recommendation_id:r.id,outcome:pick(parse(r.outcome_json),['kind','policyIds','updatedAt'])})),limitations:'Export grants no contact authority; external-only records unavailable',...fields};
  if(m){r.quote_evidence.push({quote_prepared_at:m.quote_prepared_at});r.bound_premium_evidence.push({bound_at:m.bound_at,written_premium_cents:m.written_premium_cents,evidence:parse(m.premium_evidence_json),basis:'stored measurement; not independently carrier-verified'});}
  const suppression=data.suppression.filter(c=>linked.some(s=>s.summary.conversation_id===c.conversation_id));
  if(suppression.length)r.suppression_state=suppression;
  records.set(canonical,r);
 }
 const linkedOp=(kind,key)=>sources.find(s=>s.kind===kind&&s.source_id===key)?.opportunity_id;
 for(const row of data.leads){const v=parse(row.data_json),op=linkedOp('lead',v.checkpointId);if(expired(row)){excluded.expired++;if(op)represented.add(op);continue;}if(!identified(v.identity)){excluded.anonymous++;continue;}add('lead',v.checkpointId,v.identity,{product:v.context?.reviewTrack||'',source:v.attribution?.sourceKey||'',campaign:v.attribution?.campaign||v.attribution?.campaignId||'',placement:v.attribution?.placement||'',created_at:v.createdAt||row.created_at,updated_at:v.updatedAt||row.updated_at,permission_evidence:v.consent||{},handoff_state:v.crm?.state|| (op?'projected':'unprojected')},op);aliases.set(v.checkpointId,true);}
 for(const row of data.journeys){const v=parse(row.data_json);if(!v.contact){excluded.anonymous++;continue;}if(expired(row)){excluded.expired++;continue;}const checkpoint='408d_'+v.journeyId;if(aliases.has(checkpoint))continue;add('lead',checkpoint,v.contact,{product:v.distribution?.entry||'',source:v.distribution?.attribution?.source||'',campaign:v.distribution?.attribution?.campaign||'',placement:v.distribution?.attribution?.placement||'',created_at:v.contact.at||row.created_at,updated_at:row.updated_at,permission_evidence:{mode:v.contact.mode,captured_at:v.contact.at,basis:'explicit distribution contact request'},handoff_state:v.contact.delivered?'delivered':'failed_handoff'},linkedOp('lead',checkpoint));}
 for(const row of data.consultations){const v=parse(row.data_json),op=linkedOp('consultation',v.id);if(expired(row)){excluded.expired++;if(op)represented.add(op);continue;}if(!identified(v.customer)){excluded.anonymous++;continue;}add('consultation',v.id,v.customer,{product:v.product||'',created_at:v.createdAt||row.created_at,updated_at:v.updatedAt||row.updated_at,status:v.disposition?.stage||'unprojected',permission_evidence:v.consent||{}},op);}
 // Imported lead IDs are preserved; do not turn a name/phone match into identity reconciliation.
 for(const s of sources.filter(s=>s.kind==='lead'&&s.source_id.startsWith('agencyzoom_raw:'))){const o=ops.get(s.opportunity_id);add('lead',s.source_id,o.contact,{permission_evidence:s.summary.consent||{}},o.id);}
 for(const o of data.opportunities)if(!represented.has(o.id))add('opportunity',o.id,parse(o.contact_json),{},o.id);
 for(const r of data.recommendations){if(linkedOp('recommendation',r.id))continue;const draft=parse(r.draft_json);if(!identified(draft.contact)){excluded.anonymous++;continue;}add('recommendation',r.id,draft.contact,{created_at:r.created_at,updated_at:r.updated_at,quote_evidence:(draft.options||[]).map(o=>({option_id:o.id})),bound_premium_evidence:pick(parse(r.outcome_json),['kind','policyIds','updatedAt'])});}
 const rows=[...records.values()].sort((a,b)=>a.canonical_lead_id<b.canonical_lead_id?-1:a.canonical_lead_id>b.canonical_lead_id?1:0);
 const csv='\ufeff'+[COLUMNS.map(csvCell).join(','),...rows.map(r=>COLUMNS.map(c=>csvCell(r[c])).join(','))].join('\r\n')+'\r\n';
 if(enc.encode(csv).length>16*1024*1024)fail('export_capacity_exceeded');
 return {csv,manifest:{schema:SCHEMA,counts,exported:rows.length,excluded,externalOnly:'not queried / unavailable',suppression:'Exact linked SMS state included; unresolved identities remain unknown, never permission',completeFor:'reviewed adapter inventory only'},rows};
}
export async function handleLeadExport(context){
 const request=context.request,env=context.env||{};
 const auth=authorizeProducer(request,env);if(!auth.ok)return auth.response;
 if(request.method!=='GET')return Response.json({error:{code:'method_not_allowed'}},{status:405,headers});
 if(new URL(request.url).search) return Response.json({error:{code:'scope_parameters_prohibited'}},{status:400,headers});
 try{
  const policy=parse(env.COVERAGEFIT_LEAD_EXPORT_POLICY||'null');
  // Incomplete adapters must never be enabled by an environment flag.
  if(policy?.productionAcceptance===true)fail('draft_not_certified');
  if(env.COVERAGEFIT_DISTRIBUTION_TEST_ISOLATED!=='1'||env.COVERAGEFIT_SOLO_WORKSPACE_ID!==policy?.workspace)fail('draft_test_only');
  // The draft reader can be exercised locally; the public All Leads promise must
  // not succeed until the remaining inventory and security gates are implemented.
  if(EXPORT_RELEASE_BLOCKERS.length)fail('export_coverage_incomplete');
  const result=await buildExport(env.COVERAGEFIT_DB,policy,context.now||new Date());
  console.info(JSON.stringify({operation:'lead_export',request_id:crypto.randomUUID(),schema:SCHEMA,rows:result.manifest.exported,result:'success'}));
  return new Response(result.csv,{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="coveragefit-leads-v1.csv"','X-CoverageFit-Export-Rows':String(result.manifest.exported),'X-CoverageFit-Export-Manifest':JSON.stringify(result.manifest)}});
 }catch(e){return Response.json({error:{code:e.code||'export_unavailable',message:'No download created. Export completeness, scope or source rights could not be established.'}},{status:503,headers});}
}
