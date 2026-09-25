import {EFFORT_CATEGORIES} from './fiv-calibration.mjs';
import {createSmsConversationStore} from './d1-json-store.mjs';
import {CONTROL_PREFIX} from './district-control-roster.mjs';
// Experiment metadata only. No CRM stage, scoring, consent or SMS transport mutation.
import {smsLiveConversationId} from './sms-outbound-gateway.mjs';
import {fail} from '../assets/js/solo-desk-model.mjs';
import {digest,parse} from './solo-desk-repository.mjs';
export const PILOT_ID='SIGNAL_DISTRICT_PILOT_1';
export const PILOT_KIND='district_pilot_v1';
export const PILOT_FLAGS=['fresh_response','useful_conversation','sales_positive','current_intent','future_intent','negative_disposition','quote_ready','quote','quote_sent','bind','stop','wrong_number','confusion'];
export const PILOT_DATES=['fresh_response_at','qualified_at','contact_at','quote_at','bind_at','future_bind_date'];
const trim=(v,n=120)=>String(v??'').trim().slice(0,n);
const iso=(v)=>{if(!v)return null;const n=Date.parse(v);if(!Number.isFinite(n))fail(422,'pilot_date','Use a valid date and time.');return new Date(n).toISOString()};
export async function pilotAssignment(leadKey){const key=trim(leadKey,180).toLowerCase();if(!/^[a-z0-9][a-z0-9_.:/-]{2,179}$/.test(key))fail(422,'lead_key','Use the original stable provider lead key, prefixed by the provider; no name, phone or email.');const hash=await digest(`${PILOT_ID}|${key}`);return {lead_key_hash:hash,cohort:parseInt(hash.slice(0,8),16)%2?'SIGNAL':'CONTROL'};}
export function validateObservation(input,receivedAt,now=new Date().toISOString()){
 const o={};for(const k of PILOT_FLAGS){const v=input[k];if(v!==null&&v!==true&&v!==false)fail(422,'pilot_flag',`Record ${k} as yes, no as of review, or unknown.`);o[k]=v;}
 for(const k of PILOT_DATES){o[k]=iso(input[k]);if(o[k]&&k!=='future_bind_date'&&(o[k]<receivedAt||o[k]>now))fail(422,'pilot_date','Observed outcomes must fall between lead receipt and now.');}
 for(const [flag,date] of [['fresh_response','fresh_response_at'],['quote_ready','qualified_at'],['quote','quote_at'],['bind','bind_at']])if(o[flag]!==true&&o[date])fail(422,'pilot_evidence',`${flag}: match the recorded outcome and its timestamp.`);
 if(o.quote_sent===true&&o.quote!==true)fail(422,'pilot_evidence','Quote sent requires a prepared quote.');
 if(o.sales_positive===true&&o.useful_conversation!==true)fail(422,'pilot_evidence','A sales-positive signal must also be recorded as useful.');
 o.future_bind_month=input.future_bind_month||null;if(o.future_bind_month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(o.future_bind_month))fail(422,'pilot_date','Use YYYY-MM for a follow-up month.');
 if(o.future_bind_date&&o.future_bind_month&&o.future_bind_date.slice(0,7)!==o.future_bind_month)fail(422,'pilot_date','Follow-up date and month must agree.');
 if(o.future_intent===true&&!o.future_bind_date&&!o.future_bind_month)fail(422,'pilot_evidence','Record the future follow-up date before marking Future Bind.');
 o.outcome_evidence=trim(input.outcome_evidence,240);
 if((o.quote===true||o.bind===true)&&!o.outcome_evidence)fail(422,'pilot_evidence','Quote or bind needs a non-sensitive CRM/reference note.');
 const premium=input.bound_premium;if(premium===null||premium===''||premium===undefined)o.bound_premium=null;else{const n=Number(premium);if(o.bind!==true||!Number.isFinite(n)||n<=0||n>1e7)fail(422,'pilot_premium','Record a verified term premium only for a recorded bind.');o.bound_premium=Math.round(n*100)/100;}
 if(!['OPEN','FUTURE_BIND','CLOSED','STOP','WON'].includes(input.final_status))fail(422,'pilot_status','Choose a pilot final status.');o.final_status=input.final_status;
 if(o.stop===true&&o.final_status!=='STOP'||o.final_status==='STOP'&&o.stop!==true)fail(422,'pilot_status','STOP must remain distinct from CLOSED.');
 if(o.final_status==='WON'&&o.bind!==true||o.final_status==='FUTURE_BIND'&&o.future_intent!==true)fail(422,'pilot_status','Final status must match verified outcome evidence.');
 o.effort_complete=input.effort_complete===true;o.zero_effort_confirmed=input.zero_effort_confirmed===true;o.reviewed_at=now;return o;
}
export const PILOT_EXPORT_COLUMNS=['pilot_id','pilot_phase','cohort','opportunity_id','lead_key_hash','source_family','source_key','campaign_id','producer','sms_linked','received_at','enrollment_date',...PILOT_FLAGS,...PILOT_DATES,'bound_premium','producer_minutes','effort_complete','reviewed_at','final_status','future_bind_month','pre_enrollment_response','late_enrollment'];
export function pilotCSV(records){const cell=v=>{let s=v===null||v===undefined?'':String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};return [PILOT_EXPORT_COLUMNS,...records.map(r=>PILOT_EXPORT_COLUMNS.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';}
export function pilotSummary(records){return ['CONTROL','SIGNAL'].map(cohort=>{const rows=records.filter(r=>r.cohort===cohort),n=rows.length;const g={cohort,enrolled:n};for(const k of PILOT_FLAGS){g[k]=rows.filter(r=>r[k]===true).length;g[`${k}_known`]=rows.filter(r=>r[k]!==null&&r[k]!==undefined).length;}
 g.effort_complete=rows.filter(r=>r.effort_complete&&r.producer_minutes!==null).length;
 g.recorded_minutes=rows.some(r=>r.producer_minutes!==null)?rows.reduce((s,r)=>s+(r.producer_minutes??0),0):null;
 g.producer_minutes=n&&g.effort_complete===n?g.recorded_minutes:null;
 for(const [name,k] of [['useful_conversation','useful_conversation'],['quote','quote'],['bind','bind']])g[`minutes_per_${name}`]=g.producer_minutes!==null&&g[`${k}_known`]===n&&g[k]>0?g.producer_minutes/g[k]:null;
 g.bound_premium=rows.filter(r=>r.bind===true).every(r=>r.bound_premium!==null)&&g.bind_known===n&&n?rows.reduce((s,r)=>s+(r.bind===true?r.bound_premium||0:0),0):null;
 g.premium_per_producer_hour=g.bound_premium!==null&&g.producer_minutes>0?g.bound_premium/(g.producer_minutes/60):null;
 g.directional=true;return g;});}
export function districtPilot(repo,env={}){const w=repo.scope.workspace;
 const get=async id=>{await repo.own(id);const r=await repo.sql('SELECT * FROM cf_solo_sources WHERE workspace_id=? AND opportunity_id=? AND kind=?',w,id,PILOT_KIND).first();return r?{row:r,data:parse(r.summary_json)}:null};
 const prior=async(rid,fingerprint)=>{const r=await repo.sql('SELECT fingerprint FROM cf_solo_activity WHERE workspace_id=? AND request_id=?',w,rid).first();if(r&&r.fingerprint!==fingerprint)fail(409,'request_reused','Reload before saving a different update.');return r};
 const event=(id,rid,fp,payload,at)=>repo.sql("INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) SELECT ?,?,?,?,'district_pilot',?,?,?,? WHERE changes()=1",`act_${rid}`,w,id,repo.scope.actor,rid,fp,JSON.stringify(payload),at);
 return {
  async get(id){return (await get(id))?.data||null},
  async enroll(v,rid){await repo.own(v.id);if(v.eligible!==true)fail(422,'pilot_eligible','Confirm a new incoming California personal-lines district lead, enrolled before treatment or response review.');const a=await pilotAssignment(v.lead_key),received=iso(v.received_at),at=new Date().toISOString();if(!received||received>at||Date.parse(at)-Date.parse(received)>48*3600000)fail(422,'pilot_population','Enroll new leads within 48 hours of receipt; aged leads are Phase 2.');
   let conversation_id=null;if(v.link_sms===true){const op=await repo.own(v.id),contact=parse(op.contact_json);conversation_id=await smsLiveConversationId(contact.mobile,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET);}
   if(conversation_id&&a.cohort==='SIGNAL'&&await createSmsConversationStore(repo.db).get(CONTROL_PREFIX+conversation_id))fail(409,'pilot_cohort_conflict','This phone is on the preassigned CONTROL list. Resolve the assignment protocol before enrollment; no automatic reassignment is allowed.');
   const fp=await digest(JSON.stringify(['enroll',v.id,a.lead_key_hash,received,conversation_id]));if(await prior(rid,fp))return (await get(v.id)).data;
   const existing=await get(v.id);if(existing){if(existing.data.lead_key_hash!==a.lead_key_hash)fail(409,'pilot_enrolled','This opportunity already has an immutable assignment.');return existing.data;}
   const attr=await repo.sql('SELECT source_family,source_key,campaign_id FROM cf_acq_opportunity_attribution WHERE workspace_id=? AND opportunity_id=?',w,v.id).first();
   if(conversation_id){const dup=await repo.sql("SELECT opportunity_id FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND json_extract(summary_json,'$.conversation_id')=?",w,PILOT_KIND,conversation_id).first();if(dup)fail(409,'pilot_relationship','This SMS relationship is already enrolled. Resolve duplicate inventory before assignment.');}
   const data={conversation_id,pilot_id:PILOT_ID,pilot_phase:'NEW_LEAD',opportunity_id:v.id,...a,source_family:attr?.source_family||'district_lead',source_key:attr?.source_key||'',campaign_id:attr?.campaign_id||'',producer:repo.scope.actor,received_at:received,enrollment_date:at,version:1,observation:null};
   try{await repo.db.batch([repo.sql(`INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND (opportunity_id=? OR (? IS NOT NULL AND json_extract(summary_json,'$.conversation_id')=?)))`,w,PILOT_KIND,a.lead_key_hash,v.id,JSON.stringify(data),at,w,PILOT_KIND,v.id,conversation_id,conversation_id),event(v.id,rid,fp,{action:'enrolled',...data},at),...(conversation_id?[repo.sql('INSERT INTO sms_conversations(record_key,data_json,metadata_json,created_at,updated_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=? AND opportunity_id=?)', 'district-link/'+w+'/'+conversation_id,JSON.stringify({opportunity_id:v.id,cohort:a.cohort}),'{}',at,at,w,PILOT_KIND,a.lead_key_hash,v.id)]:[])]);}catch(e){if(await prior(rid,fp))return (await get(v.id)).data;if(/UNIQUE/.test(e.message))fail(409,'pilot_duplicate','This source lead key is already enrolled. Use the existing opportunity.');throw e;}
   const finalRecord=await get(v.id);if(!finalRecord)fail(409,'pilot_relationship','This SMS relationship was enrolled elsewhere. Reload.');const saved=finalRecord.data;if(saved.lead_key_hash!==a.lead_key_hash)fail(409,'pilot_enrolled','Another enrollment won. Reload the record.');return saved;
  },
  async observe(v,rid){const old=await get(v.id);if(!old)fail(422,'pilot_enrollment','Enroll this opportunity first.');const fp=await digest(JSON.stringify(['observe',v.id,v.version,v.observation]));if(await prior(rid,fp))return (await get(v.id)).data;if(v.version!==old.data.version)fail(409,'pilot_conflict','A newer pilot update exists. Reload before saving.');const at=new Date().toISOString(),o=validateObservation(v.observation,old.data.received_at,at);const next={...old.data,version:old.data.version+1,observation:o};
   const result=await repo.db.batch([repo.sql('UPDATE cf_solo_sources SET summary_json=?,updated_at=? WHERE workspace_id=? AND kind=? AND source_id=? AND summary_json=?',JSON.stringify(next),at,w,PILOT_KIND,old.row.source_id,old.row.summary_json),event(v.id,rid,fp,{action:'observed',...o},at)]).catch(async e=>{if(await prior(rid,fp))return null;throw e});if(result&&result[0].meta?.changes!==1)fail(409,'pilot_conflict','A newer pilot update exists. Reload before saving.');return (await get(v.id)).data;
  },
  async quickReview(v,rid){
   const old=await get(v.id);if(!old)fail(422,'pilot_enrollment','Enroll this opportunity first.');
   const fp=await digest(JSON.stringify(['quick-review',v]));if(await prior(rid,fp))return (await get(v.id)).data;
   if(v.version!==old.data.version)fail(409,'pilot_conflict','A newer pilot update exists. Reload before saving.');
   if(v.confirmed!==true)fail(422,'pilot_confirm','Confirm actual outcomes and complete recorded effort through this review.');
   const blank=v.minutes===null||v.minutes===undefined||v.minutes==='';const minutes=blank?null:Number(v.minutes);
   if(minutes!==null&&(!Number.isInteger(minutes)||minutes<1||minutes>480))fail(422,'effort_minutes','Enter 1–480 additional minutes, or leave blank if already recorded.');
   const category=v.effort_category||'other_sales';if(!EFFORT_CATEGORIES.includes(category))fail(422,'effort_category','Select a supported work category.');
   const at=new Date().toISOString(),previous=old.data.observation||{};
   const o={...Object.fromEntries(PILOT_FLAGS.map(k=>[k,previous[k]??null])),...previous};
   if(v.useful_conversation!==undefined){if(![true,false,null].includes(v.useful_conversation))fail(422,'pilot_flag','Use yes/no/unknown for useful conversation');o.useful_conversation=v.useful_conversation;}
   for(const k of ['quote','bind']){if(![true,false,null].includes(v[k]))fail(422,'pilot_flag','Confirm quote and bind or leave unknown.');o[k]=v[k];if(v[k]!==true)o[k+'_at']=null;}
   o.final_status=v.final_status;
   if(v.final_status==='WON'&&v.bind!==true)fail(422,'pilot_status','WON requires a verified bind.');
   // A suppression observation may not be cleared through the compact form.
   if(previous.stop===true&&v.final_status!=='STOP')fail(409,'pilot_stop','STOP cannot be cleared in quick review.');
   o.stop=v.final_status==='STOP'?true:previous.stop??null;
   if(v.final_status==='FUTURE_BIND'){o.future_intent=true;o.future_bind_date=v.future_bind_date||null;o.future_bind_month=v.future_bind_month||null;}
   o.outcome_evidence=(v.quote===true||v.bind===true)?'Authenticated producer confirmed actual quote/bind in quick review':previous.outcome_evidence||'';
   o.effort_complete=true;o.zero_effort_confirmed=previous.zero_effort_confirmed===true;
   const observation=validateObservation(o,old.data.received_at,at),next={...old.data,version:old.data.version+1,observation};
   const batch=[repo.sql('UPDATE cf_solo_sources SET summary_json=?,updated_at=? WHERE workspace_id=? AND kind=? AND source_id=? AND summary_json=?',JSON.stringify(next),at,w,PILOT_KIND,old.row.source_id,old.row.summary_json),event(v.id,rid,fp,{action:'quick_review',...observation,additional_minutes:minutes},at)];
   if(minutes!==null)batch.push(repo.sql("INSERT INTO cf_opportunity_effort(id,workspace_id,opportunity_id,actor_id,category,minutes,note,request_id,occurred_at,created_at) SELECT ?,?,?,?,?,?,'Pilot quick review: actual additional work, including pilot administration',?,?,? WHERE EXISTS(SELECT 1 FROM cf_solo_activity WHERE workspace_id=? AND request_id=? AND fingerprint=?)",'effort_'+rid,w,v.id,repo.scope.actor,category,minutes,rid,at,at,w,rid,fp));
   const result=await repo.db.batch(batch).catch(async e=>{if(await prior(rid,fp))return null;throw e;});
   if(result&&result[0].meta?.changes!==1)fail(409,'pilot_conflict','A newer pilot update exists. Reload before saving.');
   return (await get(v.id)).data;
  },
  async report(){const found=await repo.rows(`SELECT s.summary_json,SUM(e.minutes) effort_minutes,MAX(e.created_at) effort_last_at FROM cf_solo_sources s LEFT JOIN cf_opportunity_effort e ON e.workspace_id=s.workspace_id AND e.opportunity_id=s.opportunity_id AND e.occurred_at>=json_extract(s.summary_json,'$.received_at') WHERE s.workspace_id=? AND s.kind=? GROUP BY s.source_id ORDER BY s.updated_at,s.source_id LIMIT 10001`,w,PILOT_KIND);if(found.length>10000)fail(422,'pilot_size','Pilot export exceeds 10,000 records; narrow the approved pilot before continuing.');const records=[];for(const row of found){const p=parse(row.summary_json);if(p.pilot_phase!=='NEW_LEAD')continue;const o=p.observation||{},eff={minutes:row.effort_minutes,last_at:row.effort_last_at};const minutes=eff?.minutes??(o.effort_complete&&o.zero_effort_confirmed?0:null);records.push({...p,sms_linked:!!p.conversation_id,...Object.fromEntries(PILOT_FLAGS.map(k=>[k,o[k]??null])),...Object.fromEntries(PILOT_DATES.map(k=>[k,o[k]??null])),bound_premium:o.bound_premium??null,producer_minutes:minutes,effort_complete:!!(o.effort_complete&&minutes!==null&&(!eff?.last_at||eff.last_at<=o.reviewed_at)),reviewed_at:o.reviewed_at||null,final_status:o.final_status||'OPEN',future_bind_month:o.future_bind_month||null});}
   return {pilot_id:PILOT_ID,as_of:new Date().toISOString(),records,summary:pilotSummary(records),csv:pilotCSV(records),basis:'Cumulative enrollment cohort; explicit operator observations; missing is unknown. No statistical significance claim.'};}
 };
}
