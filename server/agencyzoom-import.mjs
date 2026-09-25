import {parseRaw,RAW_VERSION} from './agencyzoom-raw.mjs';
import {pilotAssignment,PILOT_ID,PILOT_KIND} from './district-pilot.mjs';
import {digest,parse} from './solo-desk-repository.mjs';
import {smsLiveConversationId} from './sms-outbound-gateway.mjs';
import {createSmsConversationStore} from './d1-json-store.mjs';
import {CONTROL_PREFIX} from './district-control-roster.mjs';
const msg=e=>String(e.message||'Import failed').slice(0,240);
export function rawImporter(repo,env){const w=repo.scope.workspace,store=createSmsConversationStore(repo.db);
 const owned=hash=>repo.sql('SELECT opportunity_id,summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',w,PILOT_KIND,hash).first();
 async function prepare(v){
  if(!Array.isArray(v.files)||v.files.length<1||v.files.length>20)throw Error('Select 1–20 individual CSV files');
  if(v.files.reduce((n,f)=>n+(typeof f.text==='string'?f.text.length:0),0)>262144)throw Error('Batch maximum is 256 KB');
  const fingerprint=await digest(JSON.stringify([v.files,v.synthetic===true,RAW_VERSION])),rows=[],seen=new Set(),phones=new Map();
  for(let i=0;i<v.files.length;i++){const file=v.files[i];try{const lead=parseRaw(file,file.corrections||{}),a=await pilotAssignment(lead.lead_key),old=await owned(a.lead_key_hash);const row={index:i,file:String(file.name).slice(0,100),...lead,...a,status:'READY',opportunity_id:old?.opportunity_id||null};
   if(old){if((parse(old.summary_json).pilot_phase==='TEST')!==(v.synthetic===true))throw Error('PHASE CONFLICT: existing test and real enrollment must not share a key');row.status='DUPLICATE';row.cohort=parse(old.summary_json).cohort;rows.push(row);continue;}
   if(seen.has(a.lead_key_hash)){row.status='DUPLICATE IN BATCH';rows.push(row);continue;}seen.add(a.lead_key_hash);
   const age=Date.now()-Date.parse(lead.received_at);if(age<0||age>48*3600000)throw Error('OUTSIDE PHASE 1 WINDOW: received time must be within 48 hours');
   row.conversation_id=lead.contact.mobile?await smsLiveConversationId(lead.contact.mobile,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET):null;
   if(row.conversation_id){
    const priorPhone=phones.get(row.conversation_id);if(priorPhone){priorPhone.status='PHONE CONFLICT';throw Error('PHONE CONFLICT: different lead keys share a phone; review identity');}phones.set(row.conversation_id,row);
    const link=await repo.sql("SELECT opportunity_id FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND json_extract(summary_json,'$.conversation_id')=?",w,PILOT_KIND,row.conversation_id).first();if(link)throw Error('PHONE CONFLICT: relationship already enrolled under another lead key');
    if(a.cohort==='SIGNAL'&&await store.get(CONTROL_PREFIX+row.conversation_id))throw Error('COHORT CONFLICT: preassigned CONTROL exclusion');
    const existing=await repo.sql("SELECT id FROM cf_solo_opportunities WHERE workspace_id=? AND json_extract(contact_json,'$.mobile')=? LIMIT 1",w,lead.contact.mobile).first();if(existing)throw Error('EXISTING OPPORTUNITY: verify stable source identity before importing; no phone-only merge');
    const c=await store.get('sms-live-conversations/'+row.conversation_id);row.pre_enrollment_response=!!(c?.transcript||[]).some(x=>x.direction==='inbound'&&x.occurredAt>=lead.received_at);
   }
   row.late_enrollment=!!row.pre_enrollment_response;rows.push(row);
  }catch(e){rows.push({index:i,file:String(file?.name||'File').slice(0,100),status:msg(e),warnings:[]});}}
  return {fingerprint,rows};
 }
 return {async preview(v){const p=await prepare(v);return {...p,rows:p.rows.map(({facts,provenance,contact,conversation_id,...r})=>({...r,first_name:contact?.firstName||'',phone_status:contact?.mobile?'VALID':'MISSING',sms_link:conversation_id?'READY':'NOT LINKED'}))};},
 async commit(v){if(v.confirmed!==true||v.eligible!==true)throw Error('Confirm eligible new California personal-lines district inventory and timestamp timezone once for this batch');const p=await prepare(v);if(p.fingerprint!==v.fingerprint)throw Error('Preview the exact files and corrections again before importing');const results=[];
  for(const r of p.rows){if(r.status!=='READY'){results.push({index:r.index,status:r.status,opportunity_id:r.opportunity_id||null});continue;}
   const at=new Date().toISOString(),id='opp_raw_'+(await digest(w+'|'+r.lead_key)).slice(0,40),rid='raw-'+(await digest(w+'|'+r.lead_key)).slice(0,40),phase=v.synthetic===true?'TEST':'NEW_LEAD';
   const record={pilot_id:PILOT_ID,pilot_phase:phase,is_test:phase==='TEST',opportunity_id:id,lead_key_hash:r.lead_key_hash,cohort:r.cohort,conversation_id:r.conversation_id,source_family:'district_lead',source_key:r.source_key,campaign_id:'',producer:repo.scope.actor,received_at:r.received_at,enrollment_date:at,version:1,observation:null,raw_facts:r.facts,raw_provenance:r.provenance,pre_enrollment_response:!!r.pre_enrollment_response,late_enrollment:!!r.late_enrollment,mapping_version:RAW_VERSION};
   const context={evidenceOrigin:'agencyzoom_raw',product:(r.line||'').toLowerCase(),currentCarrier:r.facts.current_carrier||'',decisionTiming:/^asap$/i.test(r.facts.stated_need||'')?'now':'',statedIntent:({'actively comparing':'actively_comparing','open to switching':'open_to_review','not interested':'not_interested'})[(r.facts.shopping_intent||'').toLowerCase()]||''};
   const batch=[repo.sql('INSERT INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,products,deadline,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,w,repo.scope.actor,JSON.stringify(r.contact),'district',(r.line||'').toLowerCase(),r.facts.renewal_date||r.facts.closing_date||'',rid,r.received_at,at),repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)',w,PILOT_KIND,r.lead_key_hash,id,JSON.stringify(record),at),repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)',w,'lead','agencyzoom_raw:'+r.lead_key_hash,id,JSON.stringify({context,rawFacts:r.facts,provenance:r.provenance,governance:r.governance,attribution:{sourceFamily:'district_lead',sourceKey:r.source_key},consent:{}}),r.received_at),repo.sql('INSERT INTO cf_acq_opportunity_attribution(workspace_id,opportunity_id,source_family,source_key,batch_id,first_touch_json,latest_touch_json,attribution_basis,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',w,id,'district_lead',r.source_key,p.fingerprint,JSON.stringify({sourceKey:r.source_key,occurredAt:r.received_at}),JSON.stringify({sourceKey:r.source_key,occurredAt:r.received_at}),'agencyzoom_raw',at),repo.sql("INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) VALUES(?,?,?,?,'raw_import',?,?,?,?)",'act_'+rid,w,id,repo.scope.actor,rid,p.fingerprint,JSON.stringify({mapping_version:RAW_VERSION,batch:p.fingerprint,cohort:r.cohort,phase,pre_enrollment_response:record.pre_enrollment_response}),at)];
   if(r.conversation_id)batch.push(repo.sql('INSERT INTO sms_conversations(record_key,data_json,metadata_json,created_at,updated_at) VALUES(?,?,?,?,?)','district-link/'+w+'/'+r.conversation_id,JSON.stringify({opportunity_id:id,cohort:r.cohort}), '{}',at,at));
   try{await repo.db.batch(batch);let warning=null;if(r.cohort==='SIGNAL')try{await repo.refreshOpportunityPriority(id);}catch{warning='Priority refresh needs review; enrollment retained, no duplicate on retry';}results.push({index:r.index,status:'IMPORTED',opportunity_id:id,cohort:r.cohort,sms_linked:!!r.conversation_id,warning});}
   catch(e){const existing=await owned(r.lead_key_hash);results.push({index:r.index,status:existing?'DUPLICATE':'CONFLICT / IMPORT FAILED',opportunity_id:existing?.opportunity_id||null});}
  }
  await store.setJSON('district-import-batch/'+w+'/'+p.fingerprint,{created_at:new Date().toISOString(),synthetic:v.synthetic===true,files:v.files.length,results:results.map(({opportunity_id,...r})=>r)});return {results,imported:results.filter(r=>r.status==='IMPORTED').length,duplicates:results.filter(r=>r.status.startsWith('DUPLICATE')).length};
 }};
}
