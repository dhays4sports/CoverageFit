import test from 'node:test';
import assert from 'node:assert/strict';
import {CERT_CASES,safePreviewOrigin,validateManifest,verifyUnauthorizedStatus,verifyFixtureProvenance,verifyCase,certifySnapshots} from '../scripts/certify-producer-action-preview.mjs';

const head='a'.repeat(40);
const runId='qa-run-20261012-confirmed';
const fixtures=Object.fromEntries(Object.keys(CERT_CASES).map(k=>[k,'qa-cert-'+k.replaceAll('_','-')]));
const manifest=()=>({schema_version:'1.1',synthetic_only:true,head,run_id:runId,
 isolation_evidence:'Cloudflare Preview D1 distinct from Production D1 (operator recorded)',
 deployment_evidence:'Cloudflare immutable deployment at exact approved SHA (operator recorded)',
 fixtures:{...fixtures}});
const env={expectedHead:head,attestedHead:head,isolationConfirmed:'1'};
const attn=(band='NOW',actionable=true)=>({band,actionable,reasons:[{text:'Verified fixture reason',source_ref:{kind:'qa',id:'src'}}],due_at:null});
const quality=(code,actionable=true,attention=attn())=>({
 actionable,action:{code,label:'Governed action',source:'test',actionable},
 why_now:{band:attention.band,text:'Verified fixture reason',source_ref:{kind:'qa',id:'src'},due_at:null},
 evidence:[{kind:'attention',source_ref:{kind:'qa',id:'src'}},{kind:'signal_decision_2'},{kind:'commitment'}]
});
function fixtureData(kind){
 const id=fixtures[kind],expected=CERT_CASES[kind];
 const marker={kind:'preview_cert_fixture_v1',source_id:'qa-marker-'+kind,summary:{run_id:runId,scenario:kind,synthetic:true,suite:'PRODUCER_ACTION_QUALITY_1'}};
 const opportunity={id,contact:{name:'Synthetic QA '+kind,email:'qa@example.invalid',mobile:'2025550199'}};
 const sources=[marker];
 if(kind==='test_excluded')return {detail:{opportunity,sources:[...sources,{kind:'district_pilot_v1',summary:{pilot_phase:'TEST'}}],attention:null,actionQuality:null}};
 if(kind==='control')return {row:{id,population:'DISTRICT_CONTROL',attention:null,action_quality:null},detail:{opportunity,sources,population:{population:'DISTRICT_CONTROL'},attention:null,actionQuality:null}};
 const a=attn(kind==='stop'||kind==='opt_out'?'SUPPRESSED':kind==='tentative_calendar'?'NORMAL':'NOW',
  kind!=='stop'&&kind!=='opt_out'&&kind!=='tentative_calendar');
 const q=quality(expected.code||'CHOOSE_NEXT_ACTION',expected.actionable??false,a);
 return {
  row:{id,population:'WEB_DIRECT',attention:a,action_quality:q},
  detail:{opportunity,sources,population:{population:'WEB_DIRECT'},attention:a,actionQuality:structuredClone(q),contactSafety:{suppressed:['stop','opt_out'].includes(kind)}}
 };
}
function complete(){
 const rows=[],details={};
 for(const kind of Object.keys(CERT_CASES)){
  const {row,detail}=fixtureData(kind);
  if(row)rows.push(row);
  details[kind]=detail;
 }
 return {manifest:manifest(),work:{attention_enabled:true,records:rows},details};
}
test('preview target is fixed to HTTPS Cloudflare Pages preview subdomains, no login/query/port',()=>{
 assert.equal(safePreviewOrigin('https://2ac2764e.coveragefit.pages.dev/'),'https://2ac2764e.coveragefit.pages.dev');
 for(const url of [
  'https://coveragefit.com/','http://foo.coveragefit.pages.dev/',
  'https://foo.coveragefit.pages.dev.evil.com/','https://user:pass@foo.coveragefit.pages.dev/',
  'https://foo.coveragefit.pages.dev:8443/','https://foo.coveragefit.pages.dev/?token=x',
  'https://foo.coveragefit.pages.dev/api/solo-desk/producer-work',
  'https://foo.coveragefit.pages.dev/#token',
  'https://ops-producer-action-quality.coveragefit.pages.dev/'
 ])assert.throws(()=>safePreviewOrigin(url),/preview_host_not_allowed/);
});
test('no network operation can begin without exact deployed head and isolation attestation',()=>{
 assert.deepEqual(validateManifest(manifest(),env),fixtures);
 for(const ctx of [
  {...env,isolationConfirmed:'0'},
  {...env,attestedHead:'b'.repeat(40)},
  {...env,expectedHead:'a'.repeat(7)},
  {...env,expectedHead:null}
 ])assert.throws(()=>validateManifest(manifest(),ctx),/preview_isolation_not_verified|deployed_head_not_verified/);
 assert.throws(()=>validateManifest({...manifest(),synthetic_only:false},env),/manifest_not_approved/);
 assert.throws(()=>validateManifest({...manifest(),fixtures:{...fixtures,call:fixtures.ask_one_question}},env),/duplicate_fixture_identity/);
 assert.throws(()=>validateManifest({...manifest(),isolation_evidence:''},env),/missing_isolation_evidence/);
 assert.throws(()=>validateManifest({...manifest(),run_id:'short'},env),/missing_synthetic_run_id/);
});
test('all nine synthetic governed cases pass with complete list/detail parity',()=>{
 const r=certifySnapshots(complete());
 assert.equal(r.checked,Object.keys(CERT_CASES).length);
 assert.equal(r.status,'PASS');
 assert.equal(r.failures.length,0);
});
test('wrong action, ignored STOP, and list/detail drift cause NO_GO',()=>{
 const x=complete();
 const call=x.work.records.find(r=>r.id===fixtures.call);
 call.action_quality.action.code='ASK_ONE_QUESTION';
 const stop=x.details.stop;
 stop.attention.band='HIGH';stop.contactSafety.suppressed=false;
 const r=certifySnapshots(x);
 assert.equal(r.status,'NO_GO');
 assert.ok(r.failures.some(e=>e.case==='call'&&/wrong_exact_action|list_detail_action_mismatch/.test(e.code)));
 assert.ok(r.failures.some(e=>e.case==='stop'&&e.code==='suppression_state_not_preserved'));
});
test('synthetic lead may be inspected by direct detail but never appear in the action queue',()=>{
 const x=complete();
 x.work.records.push({id:fixtures.test_excluded,action_quality:null,attention:null});
 assert.ok(certifySnapshots(x).failures.some(e=>e.code==='synthetic_record_visible_in_work'));
});
test('unconfirmed appointment cannot masquerade as due committed work',()=>{
 const x=fixtureData('tentative_calendar');
 x.row.action_quality.action.code='PREPARE_OR_HOLD_APPOINTMENT';
 assert.ok(verifyCase('tentative_calendar',x.row,x.detail).includes('unconfirmed_calendar_elevated'));
});
test('certification fails closed with disabled Attention or mismatched fixture identity',()=>{
 const x=complete();x.work.attention_enabled=false;
 assert.throws(()=>certifySnapshots(x),/attention_feature_not_enabled_in_preview/);
 x.work.attention_enabled=true;x.details.call.opportunity.id='not-the-expected-fixture';
 assert.throws(()=>certifySnapshots(x),/fixture_detail_identity_mismatch_call/);
});

test('unauthenticated producer endpoint must refuse with exact 401',()=>{
 assert.equal(verifyUnauthorizedStatus(401),true);
 for(const status of [200,302,403,404,500])assert.throws(()=>verifyUnauthorizedStatus(status),/producer_authorization_not_enforced/);
});

test('hosted PASS requires per-record synthetic provenance, not just a manifest claim',()=>{
 const data=complete();
 const invalid=data.details.call;
 invalid.sources=[];
 const result=certifySnapshots(data);
 assert.equal(result.status,'NO_GO');
 assert.ok(result.failures.some(x=>x.case==='call'&&x.code==='synthetic_source_provenance_missing'));
});
test('real contact fields or switched scenario marker block certification',()=>{
 const record=fixtureData('call').detail;
 assert.deepEqual(verifyFixtureProvenance('call',record,manifest()),[]);
 record.opportunity.contact.mobile='+14085551212';
 assert.ok(verifyFixtureProvenance('call',record,manifest()).includes('non_reserved_phone_in_fixture'));
 record.opportunity.contact.mobile='2025550199';
 record.opportunity.contact.email='person@gmail.com';
 assert.ok(verifyFixtureProvenance('call',record,manifest()).includes('non_reserved_email_in_fixture'));
 record.opportunity.contact.email='qa@example.invalid';
 record.sources[0].summary.scenario='ask_one_question';
 assert.ok(verifyFixtureProvenance('call',record,manifest()).includes('synthetic_source_provenance_missing'));
});
test('TEST exception requires actual stored pilot TEST provenance',()=>{
 const data=complete();
 data.details.test_excluded.sources=data.details.test_excluded.sources.filter(s=>s.kind!=='district_pilot_v1');
 assert.ok(certifySnapshots(data).failures.some(x=>x.code==='missing_test_exclusion_provenance'));
});
test('CONTROL exclusion checks immutable population classification',()=>{
 const data=complete();
 data.details.control.population.population='WEB_DIRECT';
 assert.ok(certifySnapshots(data).failures.some(x=>x.code==='control_cohort_not_verified'));
});
