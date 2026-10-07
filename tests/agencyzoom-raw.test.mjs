import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';
import {parseRaw,fieldClass} from '../server/agencyzoom-raw.mjs';
import {rawImporter} from '../server/agencyzoom-import.mjs';
import {districtPilot,pilotAssignment} from '../server/district-pilot.mjs';
function fixture(){const sql=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));const db={prepare(q){let args=[];const stmt={bind(...v){args=v;return stmt},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return stmt},async batch(stmts){sql.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};const now=new Date().toISOString();for(const id of ['one','two'])sql.prepare('INSERT INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'qa','qa','{}','district','qa',now,now);const repo={db,scope:{workspace:'qa',actor:'qa'},sql:(q,...v)=>db.prepare(q).bind(...v),rows:async(q,...v)=>(await db.prepare(q).bind(...v).all()).results,own:async id=>{const r=sql.prepare('SELECT * FROM cf_solo_opportunities WHERE workspace_id=? AND id=?').get('qa',id);if(!r)throw new Error('unavailable');return r;}};return {sql,repo,pilot:districtPilot(repo),received:new Date(Date.now()-60000).toISOString()};}
const file=(id='100',phone='2025550199')=>({name:'AWL-'+id+'.csv',text:'Lead ID,Date,Lead Type,State,Cell Phone,Name,Current Insurance Co,Experation Date,Credit Rating,DOB,Occupation,Needs Quote\n'+[id,new Date(Date.now()-60000).toISOString(),'Automobile','CA',phone,'Synthetic Tester','Mercury','2026-12-31','EXCLUDED_CREDIT','EXCLUDED_DOB','EXCLUDED_JOB','ASAP'].join(',')});
const env={RINGCENTRAL_FROM_NUMBER:'+12025550100',RINGCENTRAL_CONVERSATION_HASH_SECRET:'synthetic-only-conversation-secret'};
function setup(){const f=fixture();f.refreshed=[];f.repo.refreshOpportunityPriority=async id=>f.refreshed.push(id);f.importer=rawImporter(f.repo,env);return f;}
test('RAW allowlist keeps insurance evidence, excludes sensitive values and infers no consent',()=>{const r=parseRaw(file());assert.equal(r.facts.line,'AUTO');assert.equal(r.facts.current_carrier,'Mercury');assert.equal(r.governance.D,3);assert.ok(!JSON.stringify(r).includes('EXCLUDED_'));assert.equal(r.contact.mobile,'+12025550199');assert.match(r.contact.contactBasis,/no SMS/);assert.equal(fieldClass('Credit Rating'),'D');assert.equal(fieldClass('Annual Miles'),'B');});
test('RAW parser accepts BOM and exact observed header defect; rejects malformed, oversized and empty headers',()=>{const f=file();assert.equal(parseRaw({...f,text:'\uFEFF'+f.text}).line,'AUTO');const observed={name:'AWL-test.csv',text:'_csv_"Lead ID","Date","Lead Type","State","Credit Rating",","Currently Insurance", ,\n"abc","'+new Date(Date.now()-60000).toISOString()+'","Auto","CA","discard","Yes", ,'};assert.equal(parseRaw(observed).facts.currently_insured,true);assert.throws(()=>parseRaw({...f,text:'"a,b\nx,y'}));assert.throws(()=>parseRaw({...f,text:'x'.repeat(65537)}),/OVERSIZED/);assert.throws(()=>parseRaw({...f,text:',,\n1,2,3'}),/INVALID RAW FILE/);});
test('RAW batch creates one durable enrollment per stable key, retries dedupe, and only SIGNAL gets priority',async()=>{const f=setup();try{const files=Array.from({length:10},(_,i)=>file(String(1000+i),'20255501'+String(i+10)));const p=await f.importer.preview({files});assert.equal(p.rows.filter(r=>r.status==='READY').length,10);const v={files,fingerprint:p.fingerprint,confirmed:true,eligible:true};const result=await f.importer.commit(v);assert.equal(result.imported,10,JSON.stringify(result));assert.equal(f.refreshed.length,result.results.filter(r=>r.cohort==='SIGNAL').length);assert.equal((await f.importer.commit(v)).duplicates,10);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM cf_solo_sources WHERE kind=?').get('district_pilot_v1').n,10);const sources=f.sql.prepare('SELECT summary_json FROM cf_solo_sources').all();assert.ok(!JSON.stringify(sources).includes('EXCLUDED_'));assert.equal((await f.pilot.report()).records.length,10);}finally{f.sql.close()}});
test('RAW one bad file does not drop good files; phone collision blocks both; TEST excluded from report',async()=>{const f=setup();try{let files=[file('valid'),{name:'bad.csv',text:'broken'}],p=await f.importer.preview({files,synthetic:true});assert.equal(p.rows[0].status,'READY');const r=await f.importer.commit({files,synthetic:true,fingerprint:p.fingerprint,eligible:true,confirmed:true});assert.equal(r.imported,1);assert.equal((await f.pilot.report()).records.length,0);files=[file('phone1','2025550188'),file('phone2','2025550188')];p=await f.importer.preview({files});assert.ok(p.rows.every(r=>r.status.startsWith('PHONE CONFLICT')));}finally{f.sql.close()}});
test('RAW fingerprint prevents changed confirmation; old leads cannot be silently enrolled',async()=>{const f=setup();try{const files=[file()],p=await f.importer.preview({files});await assert.rejects(f.importer.commit({files,fingerprint:'changed',eligible:true,confirmed:true}),/Preview/);const old=file();old.text=old.text.replace(/20\d\d-\d\d-\d\dT[^,]+/,'2020-01-01T00:00:00Z');assert.match((await f.importer.preview({files:[old]})).rows[0].status,/outside 7 days/);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM cf_solo_sources').get().n,0);}finally{f.sql.close()}});
import {soloRepository} from '../server/solo-desk-repository.mjs';
import {signalInbound,signalOutbound} from '../server/sms-signal-service.mjs';
test('real priority projection remains incomplete after RAW; CONTROL has no projection or priority queue',async()=>{const f=fixture();try{const repo=soloRepository(f.repo.db,f.repo.scope),imp=rawImporter(repo,env),files=Array.from({length:6},(_,i)=>file(String(2000+i),'20255502'+String(i+10))),p=await imp.preview({files});const r=await imp.commit({files,fingerprint:p.fingerprint,eligible:true,confirmed:true});assert.equal(r.imported,6);assert.ok(r.results.every(x=>!x.warning),JSON.stringify(r));for(const row of r.results){const detail=await repo.detail(row.opportunity_id);if(row.cohort==='CONTROL'){assert.equal(detail.opportunityPriority,null);assert.equal(detail.possessionQuality,null);assert.equal(detail.nextBestAction,null);}else{assert.ok(detail.opportunityPriority);assert.notEqual(detail.opportunityPriority.score,100);}}}finally{f.sql.close()}});
test('RAW facts feed SIGNAL zero-repeat without enrollment creating a reply; CONTROL stays isolated',async()=>{const f=setup();try{let key;for(let n=0;n<100;n++)if((await pilotAssignment('awl:'+n)).cohort==='SIGNAL'){key=String(n);break;}const files=[file(key)],p=await f.importer.preview({files}),r=await f.importer.commit({files,fingerprint:p.fingerprint,eligible:true,confirmed:true});const record=await f.pilot.get(r.results[0].opportunity_id);const values=new Map(),store={get:async k=>values.get(k)||null,setJSON:async(k,v)=>values.set(k,v)},e={...env,COVERAGEFIT_DB:f.repo.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa',CF_SMS_SIGNAL_ENABLED:'1',CF_SMS_SIGNAL_PILOT_ONLY:'1'};const now=new Date().toISOString();const c={id:record.conversation_id,contactPhone:'+12025550199',businessPhone:env.RINGCENTRAL_FROM_NUMBER,transcript:[{id:'out',direction:'outbound',body:'Is this for auto, home, or both?',occurredAt:now}]};const next=await signalInbound(c,{messageId:'new-reply',body:'Auto',occurredAt:now},{env:e,store});assert.equal(next.signal.facts.current_carrier,'Mercury');assert.equal(next.signal.facts.line,'AUTO');assert.equal(next.signal.decision_2,'ASK_ONE_QUESTION');assert.equal(next.signal.draft_status,'pending');assert.ok(!/who are you|auto, home|renewing soon/i.test(next.signal.reply),next.signal.reply);const observed=await signalOutbound({...c,id:'unenrolled'},{messageId:'out2',body:'Is this for auto, home, or both?',occurredAt:now},{env:e,store});assert.equal(observed.matched,true);assert.equal(observed.conversation.smsOwnership.basis,'agencyzoom_pending_enrollment');assert.ok(!observed.conversation.signal?.reply);const held=await signalInbound({...c,id:'unenrolled'},{messageId:'reply2',body:'Auto',occurredAt:now},{env:e,store});assert.equal(held.signal.reply,'');assert.equal(held.signal.pilot_cohort,'UNENROLLED');}finally{f.sql.close()}});
import {pilotReconciliation} from '../server/pilot-reconciliation.mjs';
test('synthetic system rehearsal: 10 CONTROL, 10 SIGNAL and silent batch through import/reconcile/export',async()=>{
 const f=setup(),start=performance.now();try{
  const keys={CONTROL:[],SIGNAL:[]};for(let n=20000;keys.CONTROL.length<10||keys.SIGNAL.length<10;n++){const a=await pilotAssignment('awl:'+n);if(keys[a.cohort].length<10)keys[a.cohort].push(String(n));}
  const files=[...keys.CONTROL,...keys.SIGNAL].map((k,i)=>file(k,'20255501'+String(i+10)));
  const preview=await f.importer.preview({files});assert.equal(preview.rows.filter(x=>x.status==='READY').length,20);
  const imported=await f.importer.commit({files,eligible:true,confirmed:true,fingerprint:preview.fingerprint});assert.equal(imported.imported,20);
  const m=pilotReconciliation(f.repo),rows=[];
  for(const [i,r] of imported.results.entries()){
   const rid=crypto.randomUUID();await m.call({id:r.opportunity_id,confirmed:true},rid);await m.call({id:r.opportunity_id,confirmed:true},rid);
   rows.push({id:r.opportunity_id,measure:{effort_mode:'total',producer_minutes:5,calls_mode:'recorded'},outcomes:{useful_conversation:i%2===0,quote_ready:i%5===0,quote:i%5===0,bind:i===0,future_intent:false,...(i===0?{bound_premium:1200,farmers_policy_count:1,final_status:'WON'}:{})}});
  }
  const p=await m.preview({rows});assert.equal((await m.apply({rows,fingerprint:p.fingerprint,confirmed:true},crypto.randomUUID())).saved,20);
  const silentFiles=Array.from({length:10},(_,i)=>file(String(30000+i),'20255501'+String(40+i))),sp=await f.importer.preview({files:silentFiles}),si=await f.importer.commit({files:silentFiles,fingerprint:sp.fingerprint,eligible:true,confirmed:true});assert.equal(si.imported,10);
  const silentRows=si.results.map(r=>({id:r.opportunity_id,measure:{effort_mode:'zero',calls_mode:'zero'},outcomes:{useful_conversation:false,quote_ready:false,quote:false,bind:false,future_intent:false}}));const batch=await m.preview({rows:silentRows});assert.equal((await m.apply({rows:silentRows,fingerprint:batch.fingerprint,confirmed:true},crypto.randomUUID())).saved,10);
  const report=await f.pilot.report();assert.equal(report.records.length,30);assert.equal(report.records.filter(r=>r.calls_complete).length,30);assert.equal(report.summary.reduce((s,g)=>s+g.call_attempts,0),20);assert.equal(report.summary.reduce((s,g)=>s+g.producer_minutes,0),100);assert.equal(report.summary.reduce((s,g)=>s+(g.bound_premium||0),0),1200);assert.ok(report.csv.includes('farmers_policy_count'));
  console.log('Synthetic machine rehearsal only: 20 worked + 10 silent; elapsed '+Math.round(performance.now()-start)+'ms. NOT a producer administrative-burden timing trial.');
 }finally{f.sql.close()}
});

import {parseRawRows,csvRows} from '../server/agencyzoom-raw.mjs';
import {normalizeAwlText} from '../server/awl-normalization.mjs';
import {resolveSmsOwnership} from '../server/sms-ownership.mjs';
import {classifyPopulation} from '../server/producer-workspace.mjs';
import {rawPreviewRowHTML} from '../assets/js/agencyzoom-import.mjs';
const awlFixture=name=>({name:'AWL-'+name+'.csv',text:readFileSync(new URL('./fixtures/awl/'+name+'.csv',import.meta.url),'utf8')});
const batchFile=files=>({name:'AWL-batch.csv',text:[files[0].text.split('\n')[0],...files.map(f=>f.text.split('\n').slice(1).join('\n'))].join('\n')});
test('observed home placeholder and unlabeled padding align facts semantically, not just rectangularly',()=>{
 const r=parseRaw(awlFixture('home-shifted'));assert.equal(r.facts.current_carrier,'Foremost');assert.equal(r.facts.renewal_date,'2027-04-01');assert.equal(r.line,'HOME');assert.equal(r.facts.property_type,'Single Family');assert.equal(r.facts.occupancy,'Owner');assert.equal(r.normalization_version,'AWL-NORM-1.0');assert.equal(r.schema,'AWL-HOME-64-1.0');assert.equal(r.provenance.current_carrier.source_fields[0].column,24);assert.ok(!JSON.stringify(r).includes('EXCLUDED_'));assert.ok(!JSON.stringify(r).includes('1990-01-01'));
});
for(const name of ['auto-one','auto-two'])test(`AWL repeated vehicle groups ${name} retain permitted evidence and zero-repeat count`,()=>{
 const r=parseRaw(awlFixture(name)),n=name==='auto-one'?1:2;assert.equal(r.facts.vehicles.length,n);assert.equal(r.facts.vehicle_count,n);assert.equal(r.facts.vehicle,'2020 SYNTHETIC 1');assert.equal(r.facts.vehicles[0].liability_limits,'100/300');assert.equal(r.facts.current_carrier,'Foremost');assert.equal(r.facts.renewal_date,'2027-04-01');if(n===2)assert.equal(r.facts.vehicles[1].vehicle,'2020 SYNTHETIC 2');assert.ok(!JSON.stringify(r).includes('EXCLUDED_'));assert.ok(!JSON.stringify(r).includes('1990-01-01'));
});
test('numbered vehicle groups share the same collection contract',()=>{let f=awlFixture('auto-two'),n=0;f.text=f.text.replace(/Vehicle/g,x=>++n===2?'Vehicle (2)':x);assert.equal(parseRaw(f).facts.vehicle_count,2);});
test('unproven home alignment and external union schema hold without repairing guesses',()=>{
 const f=awlFixture('home-shifted');assert.match(parseRawRows({...f,text:f.text.replace('4/1/2027 12:00:00\u202fAM','Uncertain')})[0].error,/alignment unresolved/);
 const union={name:'AWL-combined.csv',text:'Lead ID,Date,Lead Type,State,Cell Phone,Buyer Name,Buyerid,Renewal Date,Credit History\ncombined,2026-09-25 10:00:00,Home Insurance,CA,2025550187,,,Foremost,2027-04-01'};
 const r=parseRawRows(union)[0];assert.match(r.error,/Combined AWL schema/);assert.equal(r.lead.lead_key,'awl:combined');assert.equal(r.lead.contact.mobile,'+12025550187');assert.equal(r.lead.facts,undefined);assert.deepEqual(r.correction_fields,[]);
});
test('unlabeled nonempty values are never mapped, and malformed quotes fail safely',()=>{
 for(const text of ['Lead ID,Date,Lead Type,State,\nx,2026-09-25 10:00:00,Home,CA,unknown','Lead ID,Date\nx,"unclosed']){const r=parseRawRows({name:'AWL-test.csv',text})[0];assert.ok(r.error);assert.deepEqual(r.correction_fields,[]);}
});
test('batch row isolation, 100-lead bound, Unicode byte limit, CSV quoted newline',async()=>{
 const f=setup();try{const good=file('batch1'),bad=file('batch2').text.replace(',CA,',',NV,'),files=[batchFile([good,{...good,text:bad},file('batch3','2025550188')])];const p=await f.importer.preview({files});assert.equal(p.rows.length,3);assert.equal(p.rows.filter(r=>r.import_status==='READY').length,2);assert.equal(p.rows[1].import_status,'NEEDS_REVIEW');assert.deepEqual(p.rows[1].correction_fields,['state']);const r=await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true});assert.equal(r.imported,2);assert.equal(r.needs_review,1);assert.equal(r.sms_sent,0);
 const hundred=batchFile(Array.from({length:100},(_,i)=>file('limit'+i)));assert.equal(parseRawRows(hundred).length,100);assert.ok(parseRawRows(batchFile(Array.from({length:101},(_,i)=>file('limit'+i))))[0].error);
 assert.match(parseRawRows({name:'x.csv',text:'é'.repeat(140000)})[0].error,/OVERSIZED/);assert.deepEqual(csvRows('a,b\n"one\ntwo","x,y"'),[['a','b'],['one\ntwo','x,y']]);
 }finally{f.sql.close()}
});
test('old leads import to OTHER, retain evidence, never enroll/project/send or become first-party',async()=>{
 const f=setup();try{const old=awlFixture('auto-two');old.text=old.text.replace('2026-09-25 10:00:00','2020-01-01 10:00:00');const files=[old],p=await f.importer.preview({files});const row=p.rows[0];assert.equal(row.import_status,'READY');assert.equal(row.pilot_status,'INELIGIBLE_AGE');assert.equal(row.phone_status,'VALID');assert.equal(row.first_name,'Synthetic');assert.equal(row.cohort,null);assert.deepEqual(row.correction_fields,[]);
 const r=await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true});assert.equal(r.imported,1);assert.equal(r.outside_pilot,1);assert.equal(r.pilot_enrollments,0);assert.equal(r.sms_sent,0);assert.equal(f.refreshed.length,0);assert.equal((await f.pilot.report()).records.length,0);
 const id=r.results[0].opportunity_id,sources=f.sql.prepare('SELECT kind,summary_json FROM cf_solo_sources WHERE opportunity_id=?').all(id).map(x=>({kind:x.kind,summary:JSON.parse(x.summary_json)}));assert.equal(classifyPopulation(sources).population,'OTHER');const raw=sources.find(x=>x.kind==='district_raw_v2').summary;assert.equal(raw.cohort,null);assert.equal(raw.raw_facts.vehicle_count,2);
 const real=soloRepository(f.repo.db,f.repo.scope);assert.equal((await real.detail(id)).opportunityPriority,null);await real.backfillOpportunityPriority();assert.equal(await real.opportunityPriority(id),null);
 const owner=await resolveSmsOwnership({id:raw.conversation_id,outboundContext:{origin:'coveragefit',registrationId:'stale'}},{},{env:{...env,COVERAGEFIT_DB:f.repo.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa'}});assert.equal(owner.basis,'district_inventory_outside_pilot');assert.equal(owner.hold,true);
 const retry=await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true});assert.equal(retry.imported,0);assert.equal(retry.duplicates,1);
 await assert.rejects(f.pilot.enroll({id,eligible:true,lead_key:raw.source_lead_key,received_at:f.received},'cannot-promote'),/outside the fresh-lead pilot/);
 await assert.rejects(f.pilot.enroll({id:'one',eligible:true,lead_key:raw.source_lead_key,received_at:f.received},'cannot-rekey-opportunity'),/stable source was imported outside/);
 const test=await f.importer.preview({files,synthetic:true});assert.match(test.rows[0].status,/PHASE CONFLICT/);
 }finally{f.sql.close()}
});
test('future timestamps hold with retained identity and actionable correction; missing phone is not parser failure',async()=>{
 const f=setup();try{const future=file('future');future.text=future.text.replace(/20\d\d-\d\d-\d\dT[^,]+/,new Date(Date.now()+86400000).toISOString());const p=await f.importer.preview({files:[future,{name:'broken.csv',text:'broken'}]});assert.match(p.rows[0].status,/FUTURE/);assert.equal(p.rows[0].lead_key,'awl:future');assert.equal(p.rows[0].phone_status,'VALID');assert.equal(p.rows[0].sms_link,'NOT_EVALUATED');assert.equal(p.rows[1].phone_status,'NOT_EVALUATED');assert.ok(!rawPreviewRowHTML(p.rows[1]).includes('MISSING'));assert.ok(!rawPreviewRowHTML(p.rows[1]).includes('Resolve this field'));const r=await f.importer.commit({files:[future,{name:'broken.csv',text:'broken'}],fingerprint:p.fingerprint,confirmed:true,eligible:true});assert.equal(r.imported,0);
 }finally{f.sql.close()}
});
test('valid source identities and dates cannot be overridden to shop cohorts or eligibility',()=>{
 const f=awlFixture('auto-one');assert.match(parseRawRows({...f,corrections:{lead_key:'awl:new'}})[0].error,/cannot be overridden/);assert.match(parseRawRows({...f,corrections:{received_at:new Date().toISOString()}})[0].error,/cannot be changed/);
});
test('optional date validation retains identity, phone and source instead of blanking preview',()=>{
 const f=file('badrenewal');f.text=f.text.replace('2026-12-31','Not a date');const r=parseRawRows(f)[0];assert.match(r.error,/DATE/);assert.equal(r.lead.lead_key,'awl:badrenewal');assert.equal(r.lead.contact.mobile,'+12025550199');assert.deepEqual(r.correction_fields,[]);
});
test('same-key contradictory rows block both rather than silently choosing a cohort input',async()=>{
 const f=setup();try{const files=[file('same','2025550181'),file('same','2025550182')];const p=await f.importer.preview({files});assert.ok(p.rows.every(r=>r.import_status==='NEEDS_REVIEW'));assert.equal((await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true})).imported,0);}finally{f.sql.close()}
});
test('legacy scalar RAW records remain unchanged on duplicate reimport',async()=>{
 const f=setup();try{const files=[file('legacy')],p=await f.importer.preview({files}),r=await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true}),id=r.results[0].opportunity_id;
 const before=f.sql.prepare("SELECT source_id,summary_json FROM cf_solo_sources WHERE opportunity_id=? AND kind='district_pilot_v1'").get(id),legacy=JSON.parse(before.summary_json);legacy.mapping_version='AZ-RAW-1.0';legacy.raw_facts.vehicle='2018 SYNTHETIC LEGACY';delete legacy.raw_facts.vehicles;legacy.received_at='2020-01-01T00:00:00Z';f.sql.prepare("UPDATE cf_solo_sources SET summary_json=? WHERE source_id=? AND kind='district_pilot_v1'").run(JSON.stringify(legacy),before.source_id);
 const p2=await f.importer.preview({files});assert.equal(p2.rows[0].import_status,'DUPLICATE');assert.equal(p2.rows[0].pilot_status,'ALREADY_ENROLLED');assert.equal(p2.rows[0].cohort,legacy.cohort);assert.equal((await f.importer.commit({files,fingerprint:p2.fingerprint,confirmed:true,eligible:true})).imported,0);assert.deepEqual(JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE source_id=? AND kind='district_pilot_v1'").get(before.source_id).summary_json),legacy);
 }finally{f.sql.close()}
});
test('old district SMS hold preserves STOP and producer takeover precedence',async()=>{
 const f=setup();try{const old=awlFixture('auto-one');old.text=old.text.replace('2026-09-25 10:00:00','2020-01-01 10:00:00');const files=[old],p=await f.importer.preview({files}),r=await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true});const record=JSON.parse(f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE opportunity_id=? AND kind='district_raw_v2'").get(r.results[0].opportunity_id).summary_json),options={env:{...env,COVERAGEFIT_DB:f.repo.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa'}},c={id:record.conversation_id};
 assert.equal((await resolveSmsOwnership(c,{body:'STOP'},options)).basis,'compliance');assert.equal((await resolveSmsOwnership({...c,orchestration:{ownership:{owner:'producer'}}},{},options)).owner,'PRODUCER_OWNED');
 }finally{f.sql.close()}
});
test('UI only offers actionable field corrections and clearly separates old inventory',async()=>{
 const f=setup();try{const old=awlFixture('home-shifted');old.text=old.text.replace('2026-09-25 10:00:00','2020-01-01 10:00:00');const rows=(await f.importer.preview({files:[old]})).rows;const html=rawPreviewRowHTML(rows[0]);assert.match(html,/Outside NEW_LEAD/);assert.match(html,/VALID/);assert.ok(!html.includes('data-correction'));const bad=parseRawRows({name:'AWL-missing.csv',text:'Lead ID,Date,Lead Type,State\nmissing,unknown,Auto,CA'})[0];assert.deepEqual(bad.correction_fields,['received_at']);assert.match(rawPreviewRowHTML({index:0,row_number:2,...bad.lead,correction_fields:bad.correction_fields}),/Original received timestamp/);
 }finally{f.sql.close()}
});


test('six-day district leads remain eligible for NEW_LEAD while eight-day leads stay outside',async()=>{
 const f=setup();try{
  const six=file('sixday','2025550177'),eight=file('eightday','2025550178');
  const sixAt=new Date(Date.now()-6*24*3600000).toISOString(),eightAt=new Date(Date.now()-8*24*3600000).toISOString();
  six.text=six.text.replace(/20\d\d-\d\d-\d\dT[^,]+/,sixAt);
  eight.text=eight.text.replace(/20\d\d-\d\d-\d\dT[^,]+/,eightAt);
  const p=await f.importer.preview({files:[six,eight]});
  assert.equal(p.rows[0].pilot_status,'ELIGIBLE_NEW_LEAD');
  assert.ok(['CONTROL','SIGNAL'].includes(p.rows[0].cohort));
  assert.equal(p.rows[1].pilot_status,'INELIGIBLE_AGE');
  assert.equal(p.rows[1].cohort,null);
  assert.match(p.rows[1].status,/outside 7 days/i);
 }finally{f.sql.close()}
});

// Reproduce legacy age-hold inventory without changing the approved seven-day policy.
async function legacyPromotionFixture(cohort='SIGNAL') {
 const f=setup();let key;
 for(let n=40000;n<41000;n++)if((await pilotAssignment('awl:'+n)).cohort===cohort){key=String(n);break;}
 const input=file(key);input.text=input.text.replace(/20\d\d-\d\d-\d\dT[^,]+/,new Date(Date.now()-8*86400000).toISOString());
 const files=[input],p=await f.importer.preview({files});
 const r=await f.importer.commit({files,fingerprint:p.fingerprint,confirmed:true,eligible:true});
 f.id=r.results[0].opportunity_id;
 const row=f.sql.prepare('SELECT * FROM cf_solo_sources WHERE kind=? AND opportunity_id=?').get('district_raw_v2',f.id);
 f.record=JSON.parse(row.summary_json);f.record.received_at=new Date(Date.now()-3*86400000).toISOString();
 f.sql.prepare('UPDATE cf_solo_sources SET summary_json=? WHERE kind=? AND source_id=?').run(JSON.stringify(f.record),'district_raw_v2',row.source_id);
 f.linkKey='district-link/qa/'+f.record.conversation_id;
 f.link=()=>JSON.parse(f.sql.prepare('SELECT data_json FROM sms_conversations WHERE record_key=?').get(f.linkKey).data_json);
 f.audits=()=>f.sql.prepare("SELECT COUNT(*) n FROM cf_solo_activity WHERE kind='district_pilot_promotion'").get().n;
 return f;
}
for(const cohort of ['SIGNAL','CONTROL'])test('promotion preserves identity and '+cohort+' assignment, retries never send',async()=>{
 const f=await legacyPromotionFixture(cohort);try{
  const preview=await f.importer.promotionPreview();assert.equal(preview.eligible,1);
  const result=await f.importer.promote({confirmed:true,fingerprint:preview.fingerprint});
  assert.equal(result.promoted,1);assert.equal(result.sms_sent,0);assert.equal(result.results[0].cohort,cohort);
  assert.equal(f.link().opportunity_id,f.id);assert.equal(f.link().owner,'DISTRICT_'+cohort);assert.equal(f.audits(),1);
  assert.equal(f.refreshed.length,cohort==='SIGNAL'?1:0);
  await assert.rejects(f.importer.promote({confirmed:true,fingerprint:preview.fingerprint}),/Refresh promotion preview/);
  const retry=await f.importer.promotionPreview();assert.equal(retry.eligible,0);
  assert.equal((await f.importer.promote({confirmed:true,fingerprint:retry.fingerprint})).promoted,0);assert.equal(f.audits(),1);
 }finally{f.sql.close();}
});
test('promotion rejects changed evidence after preview without changing ownership',async()=>{
 const f=await legacyPromotionFixture();try{
  const p=await f.importer.promotionPreview(),before=f.link();
  f.sql.prepare('UPDATE cf_solo_sources SET summary_json=? WHERE kind=? AND opportunity_id=?').run(JSON.stringify({...f.record,raw_facts:{line:'HOME'}}),'district_raw_v2',f.id);
  await assert.rejects(f.importer.promote({confirmed:true,fingerprint:p.fingerprint}),/Refresh promotion preview/);
  assert.deepEqual(f.link(),before);assert.equal(f.audits(),0);
 }finally{f.sql.close();}
});
test('promotion losing compare-and-swap has no ownership, audit or priority side effects',async()=>{
 const f=await legacyPromotionFixture();try{
  const p=await f.importer.promotionPreview(),before=f.link(),batch=f.repo.db.batch;
  f.repo.db.batch=async statements=>{
   f.sql.prepare('UPDATE cf_solo_sources SET summary_json=? WHERE kind=? AND opportunity_id=?').run(JSON.stringify({...f.record,version:2}),'district_raw_v2',f.id);
   return batch(statements);
  };
  const r=await f.importer.promote({confirmed:true,fingerprint:p.fingerprint});
  assert.equal(r.results[0].status,'SKIPPED_CHANGED');assert.equal(r.promoted,0);assert.equal(r.sms_sent,0);
  assert.deepEqual(f.link(),before);assert.equal(f.audits(),0);assert.equal(f.refreshed.length,0);
 }finally{f.sql.close();}
});
test('promotion transaction failure rolls back enrollment, audit and ownership together',async()=>{
 const f=await legacyPromotionFixture();try{
  const p=await f.importer.promotionPreview(),before=f.link();
  f.sql.exec("CREATE TRIGGER reject_promotion_link BEFORE UPDATE ON sms_conversations BEGIN SELECT RAISE(ABORT,'synthetic storage failure'); END");
  const r=await f.importer.promote({confirmed:true,fingerprint:p.fingerprint});
  assert.equal(r.results[0].status,'CONFLICT');assert.equal(r.promoted,0);assert.deepEqual(f.link(),before);assert.equal(f.audits(),0);
  assert.equal((await f.importer.promotionPreview()).eligible,1);assert.equal(f.refreshed.length,0);
 }finally{f.sql.close();}
});
