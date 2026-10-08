import {parseRawRows,RAW_VERSION,RAW_BATCH_LEADS} from './agencyzoom-raw.mjs';
import {pilotAssignment,PILOT_ID,PILOT_KIND,PILOT_ELIGIBILITY_DAYS,PILOT_ELIGIBILITY_MS} from './district-pilot.mjs';
import {digest,parse} from './solo-desk-repository.mjs';
import {smsLiveConversationId} from './sms-outbound-gateway.mjs';
import {createSmsConversationStore} from './d1-json-store.mjs';
import {CONTROL_PREFIX} from './district-control-roster.mjs';
export const RAW_KIND='district_raw_v2';
export function syntheticRawRehearsalBatch({batchId,receivedAt}={}){
 const id=String(batchId||'').toLowerCase();if(!/^[a-f0-9-]{16,64}$/.test(id))throw Error('Invalid synthetic rehearsal batch ID.');
 const at=String(receivedAt||'');if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(at)||!Number.isFinite(Date.parse(at)))throw Error('Invalid synthetic rehearsal timestamp.');
 const header='Lead ID,Date,Lead Type,State,Cell Phone,Name,Current Insurance Co,Experation Date,Needs Quote';
 const rows=Array.from({length:100},(_,i)=>{const n=String(i).padStart(3,'0'),phone='202555'+String(100+i).padStart(4,'0');return ['rehearsal-'+id+'-'+n,at,'Automobile','CA',phone,'Synthetic Rehearsal '+n,'Synthetic Carrier','2026-12-31','ASAP'].join(',');});
 return [{name:'AWL-synthetic-rehearsal-'+id+'.csv',text:[header,...rows].join('\n')}];
}
const msg=e=>String(e.message||'Import failed').slice(0,240);
export function intakeTriage(row={}){
 const status=String(row.status||'');
 if(row.import_status==='DUPLICATE')return {bucket:'DUPLICATE',needs_attention:false,reason:'Already represented by stable source identity'};
 if(row.import_status==='READY'){
  if(row.pilot_status==='INELIGIBLE_AGE')return {bucket:'SAFE_HOLD',needs_attention:false,reason:'Imported evidence; outside current fresh-lead treatment window'};
  if(!row.contact?.mobile&&row.phone_status==='MISSING')return {bucket:'READY_NO_SMS',needs_attention:false,reason:'Usable lead record without an SMS-capable phone'};
  return {bucket:'READY',needs_attention:false,reason:row.pre_enrollment_response?'Fresh lead with existing inbound evidence':'Validated lead ready for governed import'};
 }
 if(/IDENTITY CONFLICT|PHASE CONFLICT|EXISTING OPPORTUNITY|PHONE CONFLICT|COHORT CONFLICT/.test(status))return {bucket:'REVIEW_IDENTITY',needs_attention:true,reason:'Identity or ownership conflict requires a human decision'};
 if(/schema|alignment|Combined AWL|Unlabeled source|header\/value|RAW FILE|ENCODING|UNSUPPORTED FILE/i.test(status))return {bucket:'REVIEW_SCHEMA',needs_attention:true,reason:'Source structure is not safe to infer'};
 if(/RECEIVED DATE|FUTURE RECEIVED DATE|AMBIGUOUS DATE|Invalid seconds/i.test(status))return {bucket:'REVIEW_TIME',needs_attention:true,reason:'Source timing must be resolved from original evidence'};
 if(/PRODUCT|CALIFORNIA|PHONE/i.test(status))return {bucket:'REVIEW_FIELD',needs_attention:true,reason:'A bounded source field needs correction or confirmation'};
 return {bucket:'REVIEW_OTHER',needs_attention:true,reason:'Import exception needs review'};
}
function operationalAssignment(assignment,env={}){
 if(env.CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED==='1'&&assignment?.cohort==='CONTROL')return {...assignment,assignment_cohort:'CONTROL',cohort:'SIGNAL',cohort_override_reason:'control_enrollment_paused'};
 return {...assignment,assignment_cohort:assignment?.cohort||null,cohort_override_reason:null};
}
export function rawImporter(repo,env){const w=repo.scope.workspace,store=createSmsConversationStore(repo.db);
 const receiptPrefix='district-import-receipt/'+w+'/',exceptionPrefix='district-import-exception/'+w+'/';
 const safeException=(row,triage,batch)=>({schemaVersion:'1.0',batch_id:batch,file:String(row.file||'').slice(0,100),row_number:row.row_number??null,lead_key:String(row.lead_key||'').slice(0,180),name:String(row.name||row.first_name||row.contact?.name||'').slice(0,160),line:String(row.line||'').slice(0,40),source_key:String(row.source_key||'').slice(0,120),received_at:String(row.received_at||'').slice(0,60),phone_status:/MALFORMED PHONE/.test(String(row.status||''))?'INVALID':row.contact?.mobile?'VALID':'NOT_EVALUATED',status:String(row.status||'').slice(0,240),import_status:String(row.import_status||'NEEDS_REVIEW'),pilot_status:String(row.pilot_status||'NOT_EVALUATED'),triage,correction_fields:Array.isArray(row.correction_fields)?row.correction_fields.slice(0,8):[],state:'OPEN',disposition_note:'',created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
 async function listReceipts(limit=20){const page=await store.list({prefix:receiptPrefix,limit:Math.max(1,Math.min(100,Number(limit)||20))}),records=[];for(const item of page.blobs||[]){const value=await store.get(item.key);if(value)records.push(value);}return {records};}
 async function listExceptions(state='OPEN',limit=100){const page=await store.list({prefix:exceptionPrefix,limit:Math.max(1,Math.min(500,Number(limit)||100))}),records=[];for(const item of page.blobs||[]){const value=await store.get(item.key);if(!value)continue;if(state!=='ALL'&&value.state!==state)continue;records.push(value);}return {records,open:records.filter(x=>x.state==='OPEN').length};}
 async function rehearsalStatus(batchId){
  const id=String(batchId||'').toLowerCase();if(!/^[a-f0-9-]{16,64}$/.test(id))throw Error('Invalid synthetic rehearsal batch ID.');
  const prefix='awl:rehearsal-'+id+'-';
  const rows=await repo.rows("SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND json_extract(summary_json,'$.pilot_phase')='TEST' AND substr(json_extract(summary_json,'$.source_lead_key'),1,?)=? LIMIT 101",w,PILOT_KIND,prefix.length,prefix);
  const records=rows.map(x=>parse(x.summary_json)),cohorts={},present=[];for(const r of records){cohorts[r.cohort||'NONE']=(cohorts[r.cohort||'NONE']||0)+1;const m=String(r.source_lead_key||'').match(/-(\d{3})$/);if(m)present.push(Number(m[1]));}
  present.sort((a,b)=>a-b);const set=new Set(present),missing=Array.from({length:100},(_,i)=>i).filter(i=>!set.has(i));
  return {batch_id:id,imported_test_rows:records.length,complete:records.length===100,cohorts,present_ordinals:present,missing_ordinals:missing,next_missing:missing[0]??null};
 }
 async function dispositionException(v){if(!/^[a-f0-9]{64}$/i.test(String(v.id||'')))throw Error('Reload the intake exception.');if(!['OPEN','DEFERRED','RESOLVED'].includes(v.state))throw Error('Choose open, deferred or resolved.');const key=exceptionPrefix+String(v.id),old=await store.get(key);if(!old)throw Error('Intake exception not found.');const at=new Date().toISOString(),next={...old,state:v.state,disposition_note:String(v.note||'').trim().slice(0,500),updated_at:at,updated_by:repo.scope.actor};await store.setJSON(key,next,{metadata:{state:next.state,bucket:next.triage?.bucket||'',updatedAt:at}});return next;}

 async function promotionCandidates(){
  const found=await repo.rows('SELECT source_id,opportunity_id,summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? ORDER BY updated_at,source_id LIMIT 501',w,RAW_KIND);
  if(found.length>500)throw Error('Promotion review exceeds 500 imported district leads; narrow the migration before continuing');
  const now=Date.now(),eligible=[],skipped=[];
  for(const row of found){
   const record=parse(row.summary_json),received=Date.parse(record.received_at||'');
   if(!Number.isFinite(received)){skipped.push({opportunity_id:row.opportunity_id,reason:'INVALID_RECEIVED_AT'});continue;}
   const age=now-received;
   if(age<0||age>PILOT_ELIGIBILITY_MS){skipped.push({opportunity_id:row.opportunity_id,reason:'OUTSIDE_CURRENT_WINDOW'});continue;}
   if(record.pilot_status!=='INELIGIBLE_AGE'||!record.source_lead_key){skipped.push({opportunity_id:row.opportunity_id,reason:'NOT_LEGACY_AGE_HOLD'});continue;}
   const a=operationalAssignment(await pilotAssignment(record.source_lead_key),env);
   if(a.lead_key_hash!==row.source_id){skipped.push({opportunity_id:row.opportunity_id,reason:'IDENTITY_MISMATCH'});continue;}
   const existing=await repo.sql('SELECT 1 FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND (source_id=? OR opportunity_id=?)',w,PILOT_KIND,row.source_id,row.opportunity_id).first();
   if(existing){skipped.push({opportunity_id:row.opportunity_id,reason:'ALREADY_ENROLLED'});continue;}
   if(record.conversation_id){
    const linked=await repo.sql("SELECT 1 FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND json_extract(summary_json,'$.conversation_id')=? LIMIT 1",w,PILOT_KIND,record.conversation_id).first();
    if(linked){skipped.push({opportunity_id:row.opportunity_id,reason:'SMS_RELATIONSHIP_CONFLICT'});continue;}
    if(a.cohort==='SIGNAL'&&await store.get(CONTROL_PREFIX+record.conversation_id)){skipped.push({opportunity_id:row.opportunity_id,reason:'CONTROL_EXCLUSION_CONFLICT'});continue;}
   }
   eligible.push({row,record,assignment:a});
  }
  const fingerprint=await digest(JSON.stringify(eligible.map(x=>[x.row.source_id,x.row.opportunity_id,x.row.summary_json,x.assignment.assignment_cohort,x.assignment.cohort,x.assignment.cohort_override_reason,PILOT_ELIGIBILITY_DAYS])));
  return {fingerprint,eligible,skipped};
 }
 async function applyPromotions(v){
  if(v?.confirmed!==true)throw Error('Confirm promotion of currently eligible imported district leads');
  const p=await promotionCandidates();if(p.fingerprint!==v.fingerprint)throw Error('Refresh promotion preview before applying changes');
  const at=new Date().toISOString(),results=[];
  for(const item of p.eligible){
   const {row,record,assignment:a}=item;
   const next={...record,pilot_id:PILOT_ID,pilot_phase:'NEW_LEAD',pilot_status:'ELIGIBLE_NEW_LEAD',cohort:a.cohort,assignment_cohort:a.assignment_cohort,cohort_override_reason:a.cohort_override_reason,enrollment_date:at,version:record.version||1,promotion:{from_kind:RAW_KIND,from_status:'INELIGIBLE_AGE',reason:'eligibility_window_extended',eligibility_window_days:PILOT_ELIGIBILITY_DAYS,promoted_at:at,operation_id:crypto.randomUUID()},late_enrollment:true};
   const rid='promote-'+(await digest(w+'|'+row.source_id+'|'+PILOT_ELIGIBILITY_DAYS)).slice(0,40);
   // Every dependent write must prove that THIS compare-and-swap succeeded.
   // A D1 batch is atomic, but a zero-row UPDATE is not a transaction failure.
   const promotedGuard='EXISTS (SELECT 1 FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=? AND opportunity_id=? AND summary_json=?)';
   const promotedArgs=[w,PILOT_KIND,row.source_id,row.opportunity_id,JSON.stringify(next)];
   const batch=[
    repo.sql('UPDATE cf_solo_sources SET kind=?,summary_json=?,updated_at=? WHERE workspace_id=? AND kind=? AND source_id=? AND opportunity_id=? AND summary_json=?',PILOT_KIND,JSON.stringify(next),at,w,RAW_KIND,row.source_id,row.opportunity_id,row.summary_json),
    repo.sql("INSERT OR IGNORE INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) SELECT ?,?,?,?,'district_pilot_promotion',?,?,?,? WHERE "+promotedGuard,'act_'+rid,w,row.opportunity_id,repo.scope.actor,rid,p.fingerprint,JSON.stringify({action:'promoted_from_outside_pilot',cohort:a.cohort,eligibility_window_days:PILOT_ELIGIBILITY_DAYS,received_at:record.received_at}),at,...promotedArgs)
   ];
   if(record.conversation_id)batch.push(repo.sql('UPDATE sms_conversations SET data_json=?,updated_at=? WHERE record_key=? AND '+promotedGuard,JSON.stringify({opportunity_id:row.opportunity_id,cohort:a.cohort,owner:'DISTRICT_'+a.cohort,basis:'pilot_enrollment_promotion',hold:false}),at,'district-link/'+w+'/'+record.conversation_id,...promotedArgs));
   try{
    const applied=await repo.db.batch(batch);
    if(applied?.[0]?.meta?.changes!==1){results.push({opportunity_id:row.opportunity_id,status:'SKIPPED_CHANGED'});continue;}
    let warning=null;if(next.pilot_phase==='NEW_LEAD'&&a.cohort==='SIGNAL')try{await repo.refreshOpportunityPriority(row.opportunity_id);}catch{warning='Priority refresh needs review; pilot promotion retained';}
    results.push({opportunity_id:row.opportunity_id,status:'PROMOTED',cohort:a.cohort,warning});
   }catch{results.push({opportunity_id:row.opportunity_id,status:'CONFLICT'});}
  }
  return {results,promoted:results.filter(x=>x.status==='PROMOTED').length,signal:results.filter(x=>x.status==='PROMOTED'&&x.cohort==='SIGNAL').length,control:results.filter(x=>x.status==='PROMOTED'&&x.cohort==='CONTROL').length,sms_sent:0};
 }
 const owned=hash=>repo.sql('SELECT opportunity_id,summary_json,kind FROM cf_solo_sources WHERE workspace_id=? AND kind IN (?,?) AND source_id=? ORDER BY kind LIMIT 1',w,PILOT_KIND,RAW_KIND,hash).first();
 async function prepare(v,options={}){
  if(!Array.isArray(v.files)||v.files.length<1||v.files.length>20)throw Error('Select 1–20 CSV files');
  if(v.files.reduce((n,f)=>n+(typeof f.text==='string'?new TextEncoder().encode(f.text).length:0),0)>1048576)throw Error('Batch maximum is 1 MB');
  const fingerprint=await digest(JSON.stringify([v.files,v.synthetic===true,RAW_VERSION])),rows=[],seen=new Map(),phones=new Map(),databaseStart=Math.max(0,Number(options.databaseStart)||0),databaseLimit=options.databaseLimit==null?Infinity:Math.max(1,Number(options.databaseLimit)||1);let ordinal=-1;
  const parsed=v.files.flatMap((file,index)=>parseRawRows(file).map(result=>({file,index,...result})));
  if(parsed.length>RAW_BATCH_LEADS)throw Error('Preview at most 100 leads per batch');
  for(const item of parsed){
   ordinal++;const databaseCheck=ordinal>=databaseStart&&ordinal<databaseStart+databaseLimit;
   const {file,index,lead,error,correction_fields,row_number,stage}=item;
   const row={index,file:String(file.name).slice(0,100),row_number,...lead,import_status:error?'NEEDS_REVIEW':'READY',pilot_status:'NOT_EVALUATED',status:error||'READY',sms_link:'NOT_EVALUATED',correction_fields,issues:error?[{stage,message:error}]:[]};
   rows.push(row);if(error)continue;
   try{
    const a=operationalAssignment(await pilotAssignment(lead.lead_key),env),old=databaseCheck?await owned(a.lead_key_hash):null;row.lead_key_hash=a.lead_key_hash;row.assignment_cohort=a.assignment_cohort;row.cohort_override_reason=a.cohort_override_reason;
    if(old){
     const record=parse(old.summary_json);if((record.pilot_phase==='TEST'||record.is_test===true)!==(v.synthetic===true))throw Error('PHASE CONFLICT: existing test and real imports must not share a key');
     Object.assign(row,{status:'DUPLICATE',import_status:'DUPLICATE',opportunity_id:old.opportunity_id,pilot_status:old.kind===PILOT_KIND?'ALREADY_ENROLLED':record.pilot_status||'NOT_APPLICABLE',cohort:record.cohort||null,sms_link:record.conversation_id?'LINKED':'NOT_LINKED'});continue;
    }
    if(seen.has(a.lead_key_hash)){const prior=seen.get(a.lead_key_hash);if(JSON.stringify([prior.contact,prior.facts,prior.received_at])!==JSON.stringify([row.contact,row.facts,row.received_at])){prior.import_status='NEEDS_REVIEW';prior.status='IDENTITY CONFLICT: same lead key has different source values';throw Error(prior.status);}row.status='DUPLICATE IN BATCH';row.import_status='DUPLICATE';continue;}seen.set(a.lead_key_hash,row);
    const age=Date.now()-Date.parse(lead.received_at);
    if(age<0){row.correction_fields=[];throw Error('FUTURE RECEIVED DATE: review source timestamp/timezone; do not replace it with today');}
    if(!['AUTO','HOME','HOME_AUTO'].includes(lead.line)){row.correction_fields=['line'];throw Error('UNSUPPORTED PRODUCT: California personal-lines Auto/Home/Bundle required');}
    row.pilot_status=v.synthetic===true?'TEST':age>PILOT_ELIGIBILITY_MS?'INELIGIBLE_AGE':'ELIGIBLE_NEW_LEAD';
    row.cohort=row.pilot_status==='INELIGIBLE_AGE'?null:a.cohort;
    if(row.pilot_status==='INELIGIBLE_AGE')row.status=`READY — outside ${PILOT_ELIGIBILITY_DAYS} days; import outside NEW_LEAD pilot`;
    row.conversation_id=lead.contact.mobile?await smsLiveConversationId(lead.contact.mobile,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET):null;
    row.sms_link=row.conversation_id?'LINKABLE':lead.contact.mobile?'NOT_EVALUATED':'NOT_APPLICABLE';
    if(row.conversation_id){
     const priorPhone=phones.get(row.conversation_id);if(priorPhone){priorPhone.status='PHONE CONFLICT: different lead keys share a phone';priorPhone.import_status='NEEDS_REVIEW';throw Error('PHONE CONFLICT: different lead keys share a phone; review identity');}phones.set(row.conversation_id,row);
     if(databaseCheck){
      const link=await repo.sql("SELECT opportunity_id FROM cf_solo_sources WHERE workspace_id=? AND kind IN (?,?) AND json_extract(summary_json,'$.conversation_id')=?",w,PILOT_KIND,RAW_KIND,row.conversation_id).first();if(link)throw Error('PHONE CONFLICT: relationship already imported under another lead key');
      if(row.cohort==='SIGNAL'&&await store.get(CONTROL_PREFIX+row.conversation_id))throw Error('COHORT CONFLICT: preassigned CONTROL exclusion');
      const existing=await repo.sql("SELECT id FROM cf_solo_opportunities WHERE workspace_id=? AND json_extract(contact_json,'$.mobile')=? LIMIT 1",w,lead.contact.mobile).first();if(existing)throw Error('EXISTING OPPORTUNITY: verify stable source identity; no phone-only merge');
      const live=await store.get('sms-live-conversations/'+row.conversation_id);row.pre_enrollment_response=!!(live?.transcript||[]).some(x=>x.direction==='inbound'&&x.occurredAt>=lead.received_at);
     }
    }
    row.late_enrollment=!!row.pre_enrollment_response;
   }catch(e){row.import_status='NEEDS_REVIEW';row.status=msg(e);row.issues.push({stage:'validation',message:row.status});}
  }
  return {fingerprint,rows};
 }

 async function persistExceptionRow(row,batch){
  if(row.import_status!=='NEEDS_REVIEW')return null;
  const phone_status=/MALFORMED PHONE/.test(String(row.status||''))?'INVALID':row.contact?.mobile?'VALID':'NOT_EVALUATED';
  const triage=intakeTriage({...row,phone_status}),id=await digest(JSON.stringify([batch,row.index,row.row_number,row.lead_key||'',row.status||'']));
  const key=exceptionPrefix+id,existing=await store.get(key);
  if(!existing){const record={id,...safeException(row,triage,batch)};await store.setJSON(key,record,{metadata:{state:'OPEN',bucket:triage.bucket,createdAt:record.created_at,updatedAt:record.updated_at}});}
  return id;
 }
 async function commitChunk(v){
  if(v.confirmed!==true||v.eligible!==true)throw Error('Confirm this raw intake chunk.');
  const start=Number(v.start),limit=Number(v.limit||10);if(!Number.isInteger(start)||start<0)throw Error('Invalid chunk start.');if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('Chunk size must be 1–20 rows.');
  const started=Date.now(),prepareStarted=Date.now(),p=await prepare(v,{databaseStart:start,databaseLimit:limit}),prepareDuration=Math.max(0,Date.now()-prepareStarted);
  if(p.fingerprint!==v.fingerprint)throw Error('Preview the exact files and corrections again before importing');
  const selected=p.rows.slice(start,start+limit),results=[];
  for(const r of selected){if(r.import_status!=='READY'){results.push({index:r.index,status:r.status,import_status:r.import_status,pilot_status:r.pilot_status,row_number:r.row_number,opportunity_id:r.opportunity_id||null});continue;}
   const at=new Date().toISOString(),id='opp_raw_'+(await digest(w+'|'+r.lead_key)).slice(0,40),rid='raw-'+(await digest(w+'|'+r.lead_key)).slice(0,40),phase=v.synthetic===true?'TEST':r.pilot_status==='ELIGIBLE_NEW_LEAD'?'NEW_LEAD':null,kind=phase?PILOT_KIND:RAW_KIND;
   const record={pilot_id:phase?PILOT_ID:null,pilot_phase:phase,pilot_status:r.pilot_status,is_test:phase==='TEST',opportunity_id:id,lead_key_hash:r.lead_key_hash,source_lead_key:r.lead_key,cohort:r.cohort,assignment_cohort:r.assignment_cohort||r.cohort,cohort_override_reason:r.cohort_override_reason||null,conversation_id:r.conversation_id,source_family:'district_lead',source_key:r.source_key,campaign_id:'',producer:repo.scope.actor,received_at:r.received_at,enrollment_date:at,version:1,observation:null,raw_facts:r.facts,raw_provenance:r.provenance,pre_enrollment_response:!!r.pre_enrollment_response,late_enrollment:!!r.late_enrollment,mapping_version:RAW_VERSION,normalization_version:r.normalization_version,schema:r.schema,corrections:r.corrections||{}};
   const context={evidenceOrigin:'agencyzoom_raw',product:(r.line||'').toLowerCase(),currentCarrier:r.facts.current_carrier||'',decisionTiming:/^asap$/i.test(r.facts.stated_need||'')?'now':'',statedIntent:({'actively comparing':'actively_comparing','open to switching':'open_to_review','not interested':'not_interested'})[(r.facts.shopping_intent||'').toLowerCase()]||''};
   const batch=[repo.sql('INSERT INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,products,deadline,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,w,repo.scope.actor,JSON.stringify(r.contact),'district',(r.line||'').toLowerCase(),r.facts.renewal_date||r.facts.closing_date||'',rid,r.received_at,at),repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)',w,kind,r.lead_key_hash,id,JSON.stringify(record),at),repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)',w,'lead','agencyzoom_raw:'+r.lead_key_hash,id,JSON.stringify({context,rawFacts:r.facts,provenance:r.provenance,governance:r.governance,corrections:r.corrections||{},normalization_version:r.normalization_version,schema:r.schema,attribution:{sourceFamily:'district_lead',sourceKey:r.source_key},consent:{}}),r.received_at),repo.sql('INSERT INTO cf_acq_opportunity_attribution(workspace_id,opportunity_id,source_family,source_key,batch_id,first_touch_json,latest_touch_json,attribution_basis,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',w,id,'district_lead',r.source_key,p.fingerprint,JSON.stringify({sourceKey:r.source_key,occurredAt:r.received_at}),JSON.stringify({sourceKey:r.source_key,occurredAt:r.received_at}),'agencyzoom_raw',at),repo.sql("INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) VALUES(?,?,?,?,'raw_import',?,?,?,?)",'act_'+rid,w,id,repo.scope.actor,rid,p.fingerprint,JSON.stringify({mapping_version:RAW_VERSION,batch:p.fingerprint,cohort:r.cohort,assignment_cohort:record.assignment_cohort,cohort_override_reason:record.cohort_override_reason,phase,pre_enrollment_response:record.pre_enrollment_response}),at)];
   if(r.conversation_id)batch.push(repo.sql('INSERT INTO sms_conversations(record_key,data_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?)','district-link/'+w+'/'+r.conversation_id,JSON.stringify({opportunity_id:id,cohort:r.cohort,owner:phase?('DISTRICT_'+r.cohort):'UNKNOWN',basis:phase?'pilot_enrollment':'district_inventory_outside_pilot',hold:!phase}), '{}',at,at));
   try{await repo.db.batch(batch);let warning=null;if(phase==='NEW_LEAD'&&r.cohort==='SIGNAL')try{await repo.refreshOpportunityPriority(id);}catch{warning='Priority refresh needs review; enrollment retained, no duplicate on retry';}results.push({index:r.index,row_number:r.row_number,status:'IMPORTED',import_status:'IMPORTED',pilot_status:r.pilot_status,enrolled:!!phase,opportunity_id:id,cohort:r.cohort,sms_linked:!!r.conversation_id,warning});}
   catch(e){const existing=await owned(r.lead_key_hash);results.push({index:r.index,row_number:r.row_number,import_status:existing?'DUPLICATE':'NEEDS_REVIEW',status:existing?'DUPLICATE':'CONFLICT / IMPORT FAILED',opportunity_id:existing?.opportunity_id||null});}
  }
  const summary={imported:results.filter(r=>r.status==='IMPORTED').length,duplicates:results.filter(r=>r.import_status==='DUPLICATE').length,needs_review:results.filter(r=>r.import_status==='NEEDS_REVIEW').length,pilot_enrollments:results.filter(r=>r.status==='IMPORTED'&&r.enrolled).length,outside_pilot:results.filter(r=>r.status==='IMPORTED'&&!r.enrolled).length,sms_linked:results.filter(r=>r.sms_linked).length,sms_sent:0};
  const exceptionIds=[];for(const row of selected){const id=await persistExceptionRow(row,p.fingerprint);if(id)exceptionIds.push(id);}
  const importedActual=await repo.sql('SELECT COUNT(*) AS n FROM cf_acq_opportunity_attribution WHERE workspace_id=? AND batch_id=?',w,p.fingerprint).first();
  const nextStart=Math.min(p.rows.length,start+limit),complete=nextStart>=p.rows.length,record={schemaVersion:'1.0',fingerprint:p.fingerprint,start,limit,row_count:selected.length,total_rows:p.rows.length,next_start:complete?null:nextStart,complete,prepare_duration_ms:prepareDuration,chunk_duration_ms:Math.max(0,Date.now()-started),actual_imported:Number(importedActual?.n)||0,exception_ids:exceptionIds,...summary,results:results.map(({opportunity_id,...r})=>r),created_at:new Date().toISOString()};
  await store.setJSON('district-import-chunk/'+w+'/'+p.fingerprint+'/'+String(start).padStart(3,'0'),record,{metadata:{createdAt:record.created_at,updatedAt:record.created_at,complete}});
  return record;
 }
 return {async promotionPreview(){const p=await promotionCandidates();return {fingerprint:p.fingerprint,eligible:p.eligible.length,signal:p.eligible.filter(x=>x.assignment.cohort==='SIGNAL').length,control:p.eligible.filter(x=>x.assignment.cohort==='CONTROL').length,skipped:p.skipped.length,eligibility_days:PILOT_ELIGIBILITY_DAYS,control_enrollment_paused:env.CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED==='1'};},
 async promote(v){return applyPromotions(v);},
 async preview(v){const started=Date.now(),p=await prepare(v);const rows=p.rows.map(({facts,provenance,contact,conversation_id,lead_key_hash,...r})=>{const row={...r,first_name:contact?.firstName||'',name:contact?.name||'',phone_status:/MALFORMED PHONE/.test(r.status)?'INVALID':contact?.mobile?'VALID':r.import_status==='NEEDS_REVIEW'?'NOT_EVALUATED':'MISSING'};const triage=intakeTriage({...r,contact,phone_status:row.phone_status});return {...row,triage};});const counts={};for(const row of rows)counts[row.triage.bucket]=(counts[row.triage.bucket]||0)+1;return {...p,rows,preview_duration_ms:Math.max(0,Date.now()-started),control_enrollment_paused:env.CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED==='1',triage:{counts,needs_attention:rows.filter(r=>r.triage.needs_attention).length,ready:rows.filter(r=>['READY','READY_NO_SMS','SAFE_HOLD'].includes(r.triage.bucket)).length,duplicates:rows.filter(r=>r.triage.bucket==='DUPLICATE').length}};},
 async commit(v){const started=Date.now();if(v.confirmed!==true||v.eligible!==true)throw Error('Confirm California personal-lines district inventory and original timestamp timezone once for this batch');const prepareStarted=Date.now(),p=await prepare(v),prepareDuration=Math.max(0,Date.now()-prepareStarted);if(p.fingerprint!==v.fingerprint)throw Error('Preview the exact files and corrections again before importing');const results=[];
  for(const r of p.rows){if(r.import_status!=='READY'){results.push({index:r.index,status:r.status,import_status:r.import_status,pilot_status:r.pilot_status,row_number:r.row_number,opportunity_id:r.opportunity_id||null});continue;}
   const at=new Date().toISOString(),id='opp_raw_'+(await digest(w+'|'+r.lead_key)).slice(0,40),rid='raw-'+(await digest(w+'|'+r.lead_key)).slice(0,40),phase=v.synthetic===true?'TEST':r.pilot_status==='ELIGIBLE_NEW_LEAD'?'NEW_LEAD':null,kind=phase?PILOT_KIND:RAW_KIND;
   const record={pilot_id:phase?PILOT_ID:null,pilot_phase:phase,pilot_status:r.pilot_status,is_test:phase==='TEST',opportunity_id:id,lead_key_hash:r.lead_key_hash,source_lead_key:r.lead_key,cohort:r.cohort,assignment_cohort:r.assignment_cohort||r.cohort,cohort_override_reason:r.cohort_override_reason||null,conversation_id:r.conversation_id,source_family:'district_lead',source_key:r.source_key,campaign_id:'',producer:repo.scope.actor,received_at:r.received_at,enrollment_date:at,version:1,observation:null,raw_facts:r.facts,raw_provenance:r.provenance,pre_enrollment_response:!!r.pre_enrollment_response,late_enrollment:!!r.late_enrollment,mapping_version:RAW_VERSION,normalization_version:r.normalization_version,schema:r.schema,corrections:r.corrections||{}};
   const context={evidenceOrigin:'agencyzoom_raw',product:(r.line||'').toLowerCase(),currentCarrier:r.facts.current_carrier||'',decisionTiming:/^asap$/i.test(r.facts.stated_need||'')?'now':'',statedIntent:({'actively comparing':'actively_comparing','open to switching':'open_to_review','not interested':'not_interested'})[(r.facts.shopping_intent||'').toLowerCase()]||''};
   const batch=[repo.sql('INSERT INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,products,deadline,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,w,repo.scope.actor,JSON.stringify(r.contact),'district',(r.line||'').toLowerCase(),r.facts.renewal_date||r.facts.closing_date||'',rid,r.received_at,at),repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)',w,kind,r.lead_key_hash,id,JSON.stringify(record),at),repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)',w,'lead','agencyzoom_raw:'+r.lead_key_hash,id,JSON.stringify({context,rawFacts:r.facts,provenance:r.provenance,governance:r.governance,corrections:r.corrections||{},normalization_version:r.normalization_version,schema:r.schema,attribution:{sourceFamily:'district_lead',sourceKey:r.source_key},consent:{}}),r.received_at),repo.sql('INSERT INTO cf_acq_opportunity_attribution(workspace_id,opportunity_id,source_family,source_key,batch_id,first_touch_json,latest_touch_json,attribution_basis,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',w,id,'district_lead',r.source_key,p.fingerprint,JSON.stringify({sourceKey:r.source_key,occurredAt:r.received_at}),JSON.stringify({sourceKey:r.source_key,occurredAt:r.received_at}),'agencyzoom_raw',at),repo.sql("INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) VALUES(?,?,?,?,'raw_import',?,?,?,?)",'act_'+rid,w,id,repo.scope.actor,rid,p.fingerprint,JSON.stringify({mapping_version:RAW_VERSION,batch:p.fingerprint,cohort:r.cohort,assignment_cohort:record.assignment_cohort,cohort_override_reason:record.cohort_override_reason,phase,pre_enrollment_response:record.pre_enrollment_response}),at)];
   if(r.conversation_id)batch.push(repo.sql('INSERT INTO sms_conversations(record_key,data_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?)','district-link/'+w+'/'+r.conversation_id,JSON.stringify({opportunity_id:id,cohort:r.cohort,owner:phase?('DISTRICT_'+r.cohort):'UNKNOWN',basis:phase?'pilot_enrollment':'district_inventory_outside_pilot',hold:!phase}), '{}',at,at));
   try{await repo.db.batch(batch);let warning=null;if(phase==='NEW_LEAD'&&r.cohort==='SIGNAL')try{await repo.refreshOpportunityPriority(id);}catch{warning='Priority refresh needs review; enrollment retained, no duplicate on retry';}results.push({index:r.index,row_number:r.row_number,status:'IMPORTED',import_status:'IMPORTED',pilot_status:r.pilot_status,enrolled:!!phase,opportunity_id:id,cohort:r.cohort,sms_linked:!!r.conversation_id,warning});}
   catch(e){const existing=await owned(r.lead_key_hash);results.push({index:r.index,row_number:r.row_number,import_status:existing?'DUPLICATE':'NEEDS_REVIEW',status:existing?'DUPLICATE':'CONFLICT / IMPORT FAILED',opportunity_id:existing?.opportunity_id||null});}
  }
  const summary={imported:results.filter(r=>r.status==='IMPORTED').length,duplicates:results.filter(r=>r.import_status==='DUPLICATE').length,needs_review:results.filter(r=>r.import_status==='NEEDS_REVIEW').length,pilot_enrollments:results.filter(r=>r.status==='IMPORTED'&&r.enrolled).length,outside_pilot:results.filter(r=>r.status==='IMPORTED'&&!r.enrolled).length,sms_linked:results.filter(r=>r.sms_linked).length,sms_sent:0};
  const createdAt=new Date().toISOString(),exceptionIds=[];
  for(const row of p.rows){if(row.import_status!=='NEEDS_REVIEW')continue;const triage=intakeTriage({...row,phone_status:/MALFORMED PHONE/.test(String(row.status||''))?'INVALID':row.contact?.mobile?'VALID':'NOT_EVALUATED'});const id=await digest(JSON.stringify([p.fingerprint,row.index,row.row_number,row.lead_key||'',row.status||'']));const record={id,...safeException(row,triage,p.fingerprint)};await store.setJSON(exceptionPrefix+id,record,{metadata:{state:'OPEN',bucket:triage.bucket,createdAt,updatedAt:createdAt}});exceptionIds.push(id);}
  const receipt={schemaVersion:'1.0',id:p.fingerprint,created_at:createdAt,synthetic:v.synthetic===true,files:v.files.map(f=>String(f.name||'').slice(0,100)),row_count:p.rows.length,...summary,exceptions:exceptionIds,prepare_duration_ms:prepareDuration,import_duration_ms:Math.max(0,Date.now()-started),control_enrollment_paused:env.CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED==='1'};
  await store.setJSON('district-import-batch/'+w+'/'+p.fingerprint,{created_at:createdAt,synthetic:v.synthetic===true,files:v.files.length,results:results.map(({opportunity_id,...r})=>r)});
  await store.setJSON(receiptPrefix+p.fingerprint,receipt,{metadata:{createdAt,updatedAt:createdAt,needs_review:summary.needs_review}});
  return {results,...summary,receipt};
 },
 async receipts(v={}){return listReceipts(v.limit);},
 async exceptions(v={}){return listExceptions(String(v.state||'OPEN').toUpperCase(),v.limit);},
 async disposition(v){return dispositionException(v);},
 async commitChunk(v){return commitChunk(v);},
 async rehearsalStatus(v={}){return rehearsalStatus(v.batch_id);}
 };
}
