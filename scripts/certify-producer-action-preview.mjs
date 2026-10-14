// Preview-only, GET-only Producer Action Quality acceptance runner.
// IMPORTANT: producer-work and producer-detail GETs can refresh stored projections.
// Run ONLY after an operator has verified isolated Cloudflare Preview bindings.
// Never use production, real customer records, or a shared browser token in logs.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const CERT_CASES=Object.freeze({
 ask_one_question:{code:'ASK_ONE_QUESTION',actionable:true},
 call:{code:'CALL_CUSTOMER',actionable:true},
 due_callback:{code:'CALL_BACK',actionable:true},
 due_appointment:{code:'PREPARE_OR_HOLD_APPOINTMENT',actionable:true},
 stop:{code:'DO_NOT_CONTACT',actionable:false},
 opt_out:{code:'DO_NOT_CONTACT',actionable:false},
 control:{code:null,actionable:false},
 test_excluded:{code:null,actionable:false,excluded:true},
 tentative_calendar:{forbiddenCodes:['PREPARE_OR_HOLD_APPOINTMENT','CALL_BACK']}
});

const HEAD=/^[0-9a-f]{40}$/;
const ID=/^[a-zA-Z0-9:_-]{4,120}$/;
const RUN_ID=/^[a-z0-9_-]{12,80}$/;
const fail=m=>{throw Error(m)};
export function safePreviewOrigin(raw){
 let url;try{url=new URL(raw);}catch{fail('invalid_preview_url');}
 if(url.protocol!=='https:'||!/^([a-f0-9]{8})\.coveragefit\.pages\.dev$/i.test(url.hostname)
  ||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash)fail('preview_host_not_allowed');
 return url.origin;
}

export function validateManifest(raw,{expectedHead,attestedHead,isolationConfirmed}={}){
 if(isolationConfirmed!=='1')fail('preview_isolation_not_verified');
 if(!HEAD.test(String(expectedHead||''))||!HEAD.test(String(attestedHead||''))||expectedHead!==attestedHead)fail('deployed_head_not_verified');
 if(raw?.schema_version!=='1.1'||raw.synthetic_only!==true||raw.head!==expectedHead)fail('manifest_not_approved');
 if(!RUN_ID.test(String(raw.run_id||'')))fail('missing_synthetic_run_id');
 if(typeof raw.isolation_evidence!=='string'||raw.isolation_evidence.trim().length<12)fail('missing_isolation_evidence');
 if(typeof raw.deployment_evidence!=='string'||raw.deployment_evidence.trim().length<12)fail('missing_deployment_evidence');
 const fixtures=raw.fixtures||{};
 for(const key of Object.keys(CERT_CASES))if(!ID.test(String(fixtures[key]||'')))fail('missing_synthetic_fixture_'+key);
 if(new Set(Object.values(fixtures)).size!==Object.values(fixtures).length)fail('duplicate_fixture_identity');
 return fixtures;
}

// Every displayed opportunity must be proven synthetic by its own durable
// Preview-only source, not by a manifest assertion, name guess, or cohort label.
// The source is a QA marker, not an immutable authentication or send permission.
export function verifyFixtureProvenance(kind,detail,manifest){
 const errors=[];
 const marker=(Array.isArray(detail?.sources)?detail.sources:[]).find(s=>s.kind==='preview_cert_fixture_v1'
  &&s.summary?.run_id===manifest?.run_id&&s.summary?.scenario===kind
  &&s.summary?.synthetic===true&&s.summary?.suite==='PRODUCER_ACTION_QUALITY_1');
 if(!marker)errors.push('synthetic_source_provenance_missing');
 const contact=detail?.opportunity?.contact||{};
 const name=String(contact.name||[contact.firstName,contact.lastName].filter(Boolean).join(' '));
 if(!/^Synthetic (?:QA|Certification)\b/.test(name))errors.push('synthetic_name_not_verified');
 const phones=[contact.mobile,contact.phone,contact.cell].filter(Boolean).map(v=>String(v).replace(/[^\d]/g,''));
 if(phones.some(v=>!/^1?20255501\d\d$/.test(v)))errors.push('non_reserved_phone_in_fixture');
 const emails=[contact.email].filter(Boolean).map(x=>String(x).toLowerCase());
 if(emails.some(v=>!/^[a-z0-9._%+-]+@example\.(invalid|test)$/.test(v)))errors.push('non_reserved_email_in_fixture');
 return errors;
}

export function verifyCase(kind,row,detail){
 const expected=CERT_CASES[kind],errors=[];
 if(!expected)return ['unknown_certification_case'];
 if(kind==='test_excluded'){
  const pilot=(detail?.sources||[]).find(s=>s.kind==='district_pilot_v1')?.summary;
  if(!(pilot?.pilot_phase==='TEST'||pilot?.is_test===true||pilot?.synthetic===true))errors.push('missing_test_exclusion_provenance');
  if(row)errors.push('synthetic_record_visible_in_work');
  if(detail?.attention!==null||detail?.actionQuality!==null)errors.push('synthetic_detail_has_guidance');
  return errors;
 }
 if(!detail?.opportunity?.id)errors.push('missing_detail');
 if(!row)errors.push('missing_work_row');
 if(kind==='control'){
  if(row?.population!=='DISTRICT_CONTROL'||detail?.population?.population!=='DISTRICT_CONTROL')errors.push('control_cohort_not_verified');
  if(row?.action_quality!==null||detail?.actionQuality!==null||row?.attention!==null||detail?.attention!==null)errors.push('control_exposed_guidance');
  return errors;
 }
 const rq=row?.action_quality,dq=detail?.actionQuality;
 if(!rq||!dq)return [...errors,'missing_action_quality'];
 if(expected.code){
  if(rq.action?.code!==expected.code||dq.action?.code!==expected.code)errors.push('wrong_exact_action');
  if(rq.actionable!==expected.actionable||dq.actionable!==expected.actionable)errors.push('wrong_actionability');
 }
 if(expected.forbiddenCodes?.includes(rq.action?.code)||expected.forbiddenCodes?.includes(dq.action?.code))errors.push('unconfirmed_calendar_elevated');
 if(kind==='tentative_calendar'&&['NOW','TODAY'].includes(row?.attention?.band))errors.push('tentative_calendar_elevated_attention');
 if(JSON.stringify(rq.action)!==JSON.stringify(dq.action))errors.push('list_detail_action_mismatch');
 if(JSON.stringify(rq.why_now)!==JSON.stringify(dq.why_now))errors.push('list_detail_reason_mismatch');
 if(!Array.isArray(rq.evidence)||!Array.isArray(dq.evidence))errors.push('missing_evidence');
 if(['stop','opt_out'].includes(kind)){
  if(row?.attention?.band!=='SUPPRESSED'||detail?.attention?.band!=='SUPPRESSED'||detail?.contactSafety?.suppressed!==true)errors.push('suppression_state_not_preserved');
 }
 if(kind==='ask_one_question'&&!rq.evidence?.some(x=>x.kind==='signal_decision_2'))errors.push('missing_signal_source_evidence');
 if(['due_callback','due_appointment'].includes(kind)&&!rq.evidence?.some(x=>x.kind==='commitment'))errors.push('missing_confirmed_commitment_evidence');
 return [...new Set(errors)];
}

export function verifyUnauthorizedStatus(status){
 if(status!==401)fail('producer_authorization_not_enforced');
 return true;
}

export function certifySnapshots({manifest,work,details}){
 const failures=[],results=[];
 if(work?.attention_enabled!==true)fail('attention_feature_not_enabled_in_preview');
 if(!Array.isArray(work.records))fail('work_records_missing');
 const rows=new Map(work.records.map(r=>[r.id,r]));
 for(const kind of Object.keys(CERT_CASES)){
  const id=manifest.fixtures[kind],row=rows.get(id)||null,detail=details[kind]||null;
  if(detail?.opportunity?.id!==id)fail('fixture_detail_identity_mismatch_'+kind);
  const errors=[...verifyFixtureProvenance(kind,detail,manifest),...verifyCase(kind,row,detail)];
  results.push({case:kind,result:errors.length?'FAIL':'PASS',errors});
  if(errors.length)failures.push(...errors.map(code=>({case:kind,code})));
 }
 return {status:failures.length?'NO_GO':'PASS',checked:results.length,results,failures};
}

async function main(){
 const [path]=process.argv.slice(2);
 if(!path)fail('usage: node scripts/certify-producer-action-preview.mjs manifest.json');
 const manifest=JSON.parse(await readFile(path,'utf8'));
 const origin=safePreviewOrigin(process.env.CF_PREVIEW_URL||'');
 validateManifest(manifest,{
  expectedHead:process.env.CF_PREVIEW_EXPECTED_HEAD,
  attestedHead:process.env.CF_PREVIEW_DEPLOYED_HEAD,
  isolationConfirmed:process.env.CF_PREVIEW_ISOLATION_VERIFIED
 });
 const token=process.env.CF_PREVIEW_PRODUCER_TOKEN;
 if(typeof token!=='string'||token.length<16)fail('missing_producer_credential');
 // Check that public callers cannot read the producer queue before using a secret.
 // Authentication denial precedes any stateful Workspace projection work.
 const denied=await fetch(origin+'/api/solo-desk/producer-work?population=ALL',{
  method:'GET',redirect:'manual',cache:'no-store',headers:{Accept:'application/json'},
  signal:AbortSignal.timeout(15000)
 });
 verifyUnauthorizedStatus(denied.status);
 const api=async route=>{
  const response=await fetch(origin+'/api/solo-desk/'+route,{
   method:'GET',redirect:'manual',cache:'no-store',
   headers:{Authorization:'Bearer '+token,Accept:'application/json'},
   signal:AbortSignal.timeout(15000)
  });
  if(response.status>=300&&response.status<400)fail('redirect_blocked');
  if(!response.ok)fail('preview_request_failed_'+response.status);
  const body=await response.json();
  if(body.ok!==true)fail('preview_payload_not_ok');
  return body;
 };
 // Detail first: reject any unmarked/non-synthetic fixture before scanning
 // the wider Producer Work inventory. These GETs still require Preview isolation.
 const details={};
 for(const kind of Object.keys(CERT_CASES)){
  const id=manifest.fixtures[kind];
  details[kind]=await api('producer-detail?id='+encodeURIComponent(id));
  if(details[kind]?.opportunity?.id!==id)fail('fixture_detail_identity_mismatch_'+kind);
  if(verifyFixtureProvenance(kind,details[kind],manifest).length)fail('fixture_provenance_not_verified_'+kind);
 }
 const page=await api('producer-work?population=ALL&status=all&sort=recommended');
 if(!page.attention_enabled)fail('preview_attention_flag_off');
 const all=[...page.records];let offset=page.nextOffset,pageCount=1;
 while(offset!==null&&offset!==undefined){
  if(++pageCount>125)fail('preview_inventory_over_5000_records');
  const next=await api('producer-work?population=ALL&status=all&sort=recommended&offset='+offset);
  all.push(...next.records);offset=next.nextOffset;
 }
 const report=certifySnapshots({manifest,work:{attention_enabled:true,records:all},details});
 console.log(JSON.stringify({
  ...report,verified_head:process.env.CF_PREVIEW_EXPECTED_HEAD,
  preview_host:new URL(origin).hostname,
  isolation:'operator_attested_only',
  requests:1+pageCount+Object.keys(CERT_CASES).length,
  note:'GET endpoints may refresh internal projections; run exclusively on verified isolated synthetic Preview.'
 },null,2));
 if(report.status!=='PASS')process.exitCode=1;
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 main().catch(e=>{console.error('Preview acceptance blocked: '+(e?.message||'unknown_error'));process.exitCode=2;});
}
