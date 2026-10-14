import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import {randomUUID} from 'node:crypto';
import {districtPilot} from '../server/district-pilot.mjs';
import {soloRepository} from '../server/solo-desk-repository.mjs';
import {producerWorkspace,classifyPopulation,attentionRank} from '../server/producer-workspace.mjs';
import {smsPanel} from '../assets/js/producer-sms.mjs';
import {createSmsConversationStore} from '../server/d1-json-store.mjs';
import {handleSmsSignal} from '../server/sms-signal-api.mjs';
import {handleSoloDesk} from '../server/solo-desk-api.mjs';
function fixture(){const sql=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));const db={prepare(q){let args=[];const stmt={bind(...v){args=v;return stmt},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return stmt},async batch(stmts){sql.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};const now=new Date().toISOString();for(const id of ['one','two'])sql.prepare('INSERT INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,'qa','qa','{}','district','qa',now,now);const repo={db,scope:{workspace:'qa',actor:'qa'},sql:(q,...v)=>db.prepare(q).bind(...v),rows:async(q,...v)=>(await db.prepare(q).bind(...v).all()).results,own:async id=>{const r=sql.prepare('SELECT * FROM cf_solo_opportunities WHERE workspace_id=? AND id=?').get('qa',id);if(!r)throw new Error('unavailable');return r;}};return {sql,repo,pilot:districtPilot(repo),received:new Date(Date.now()-60000).toISOString()};}
function prepared(){const f=fixture();f.repo=soloRepository(f.repo.db,{workspace:'qa',actor:'qa'});f.env={COVERAGEFIT_DB:f.repo.db,COVERAGEFIT_SOLO_WORKSPACE_ID:'qa',COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-producer-key-for-tests',CF_SMS_SIGNAL_ENABLED:'1'};f.store=createSmsConversationStore(f.repo.db);f.work=producerWorkspace(f.repo,f.env);return f;}
const cid='sms-live-'+'a'.repeat(32),otherCid='sms-live-'+'b'.repeat(32);
function source(f,id,kind,value){f.sql.prepare('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?)').run('qa',kind,kind+'-'+id,id,JSON.stringify(value),new Date().toISOString());}
const pilot=(cohort,conversation_id=cid)=>({pilot_id:'SIGNAL_DISTRICT_PILOT_1',cohort,pilot_phase:'NEW_LEAD',conversation_id});
const signal=()=>({managed:true,revision:1,latest_inbound:'Auto',previous_outbound:'Auto, home, or both?',decision_2:'ASK_ONE_QUESTION',reply:'When does your policy renew?',draft_status:'pending',priority:'MEDIUM',az_inferred_stage:'CONTACT_ATTEMPT',az_recommended_stage:'ENGAGED',az_sync_status:'pending',facts:{line:'AUTO'}});
test('population follows explicit sources, never score/stage/SMS; synthetic pilot stays OTHER',()=>{assert.equal(classifyPopulation([]).population,'OTHER');assert.equal(classifyPopulation([{kind:'lead',summary:{context:{signalHome:{}}}}]).population,'WEB_DIRECT');assert.equal(classifyPopulation([{kind:'lead',summary:{rawFacts:{line:'AUTO'}}}]).population,'OTHER');assert.equal(classifyPopulation([{kind:'district_pilot_v1',summary:pilot('CONTROL')},{kind:'lead',summary:{permission:{}}}]).population,'DISTRICT_CONTROL');assert.equal(classifyPopulation([{kind:'district_pilot_v1',summary:{...pilot('SIGNAL'),pilot_phase:'TEST'}}]).population,'OTHER');});
test('work counts, population filters, global search and pure classification stay aligned',async()=>{const f=prepared();try{source(f,'one','district_pilot_v1',pilot('SIGNAL'));source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));f.sql.prepare('UPDATE cf_solo_opportunities SET contact_json=? WHERE id=?').run(JSON.stringify({name:'Find me'}),'two');let r=await f.work.list(new URLSearchParams());assert.equal(r.records.length,1);assert.equal(r.records[0].id,'one');assert.equal(r.counts.DISTRICT_CONTROL,1);assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM cf_solo_sources WHERE kind='producer_population_v2'").get().n,0);r=await f.work.list(new URLSearchParams({population:'DISTRICT_SIGNAL',q:'Find me'}));assert.equal(r.records[0].population,'DISTRICT_CONTROL');assert.equal(r.records[0].priority,null);assert.equal(r.records[0].sms,null);f.sql.prepare("UPDATE cf_solo_opportunities SET stage='decision' WHERE id='two'").run();assert.equal((await f.work.detail('two')).population.population,'DISTRICT_CONTROL');}finally{f.sql.close()}});
test('detail returns exact SIGNAL context; CONTROL, WEB and OTHER have no embedded draft/pilot contamination',async()=>{const f=prepared();try{source(f,'one','district_pilot_v1',pilot('SIGNAL'));source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,signal:signal(),transcript:[]});await f.store.setJSON('sms-live-conversations/'+otherCid,{id:otherCid,signal:signal(),transcript:[]});const a=await f.work.detail('one'),b=await f.work.detail('two');assert.equal(a.sms.reply,signal().reply);assert.equal(b.sms,null);assert.equal(b.opportunityPriority,null);assert.equal(b.nextBestAction,null);assert.equal(smsPanel(b),'');f.sql.prepare("DELETE FROM cf_solo_sources WHERE opportunity_id='two'").run();source(f,'two','lead',{permission:{basis:'Contact requested'},context:{signalHome:{}}});const web=await f.work.detail('two');assert.equal(web.population.population,'WEB_DIRECT');assert.equal(web.pilot,null);assert.equal(web.sms,null);assert.equal(smsPanel(web),'');await assert.rejects(f.work.detail('other-workspace'));}finally{f.sql.close()}});
test('explicit call outranks a complete high score; stop cannot become attention bait',()=>{assert.ok(attentionRank({sms:{decision_2:'CALL'},priority:null})>attentionRank({priority:{queue:'shoot_now',score:100}}));assert.equal(attentionRank({sms:{decision_2:'STOP',priority:'URGENT',human_required:true,latest_inbound:'STOP'}}),0);});
test('embedded presentation withholds send on STOP, disabled processing and takeover; escapes replies',()=>{const d={population:{population:'DISTRICT_SIGNAL'},sms_enabled:true,sms:{...signal(),latest_inbound:'<script>bad</script>'}};assert.ok(smsPanel(d).includes('Approve &amp; send'));assert.ok(!smsPanel(d).includes('<script>'));assert.ok(!smsPanel({...d,sms:{...d.sms,decision_2:'STOP'}}).includes('data-sms-action="approve_send"'));assert.match(smsPanel({...d,sms_enabled:false}),/data-sms-action="approve_send" disabled/);assert.match(smsPanel({...d,sms:{...d.sms,human_active:true}}),/data-sms-action="approve_send" disabled/);});
test('embedded actions reuse canonical revision, identity, CONTROL and send-once guards',async()=>{const f=prepared();try{source(f,'one','district_pilot_v1',pilot('SIGNAL'));source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,contactPhone:'+12025550199',signal:signal(),transcript:[]});let sent=0;const post=b=>handleSmsSignal(new Request('https://coveragefit.test/api/sms/signal',{method:'POST',headers:{Authorization:'Bearer '+f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN,Origin:'https://coveragefit.test','Content-Type':'application/json'},body:JSON.stringify(b)}),{env:f.env,store:f.store,sendSignal:async()=>{sent++;return {providerMessageId:'synthetic-sent'}}});assert.equal((await post({opportunity_id:'two',conversation_id:cid,action:'approve_send',revision:1})).status,409);assert.equal((await post({opportunity_id:'one',conversation_id:otherCid,action:'edit',message:'Test',revision:1})).status,409);assert.equal((await post({opportunity_id:'one',conversation_id:cid,action:'edit',message:'Is next month right?',revision:1})).status,200);assert.equal(sent,0);assert.equal((await post({opportunity_id:'one',conversation_id:cid,action:'approve_send',revision:1})).status,409);assert.equal((await post({opportunity_id:'one',conversation_id:cid,action:'approve_send',revision:2})).status,200);assert.equal(sent,1);assert.equal((await post({opportunity_id:'one',conversation_id:cid,action:'approve_send',revision:2})).status,409);assert.equal(sent,1);assert.equal((await post({opportunity_id:'one',conversation_id:cid,action:'mark_az_updated',revision:3,stage:'ENGAGED'})).status,200);}finally{f.sql.close()}});
test('producer aggregate remains authenticated; legacy deep-link shell retains active controls',async()=>{const f=prepared();try{const r=await handleSoloDesk({request:new Request('https://coveragefit.test/api/solo-desk/producer-work'),env:f.env});assert.equal(r.status,401);const html=readFileSync(new URL('../agent/workspace/index.html',import.meta.url),'utf8');for(const area of ['work','import','analytics','tools'])assert.ok(html.includes('data-area="'+area+'"'));assert.ok(!html.includes('id="deskAcq"'));const legacy=readFileSync(new URL('../agent/workspace/legacy.html',import.meta.url),'utf8');assert.ok(legacy.includes('id="workspaceViewConsultation"'));assert.ok(legacy.includes('/assets/js/agent-workspace.js'));assert.ok(legacy.includes('/agent/workspace/workspace.css'));}finally{f.sql.close()}});
test('CONTROL stale Signal state is absent from Operations as well as Work',async()=>{const f=prepared();try{source(f,'one','district_pilot_v1',pilot('CONTROL'));await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,contactPhone:'+12025550199',signal:signal()});const r=await handleSmsSignal(new Request('https://coveragefit.test/api/sms/signal',{headers:{Authorization:'Bearer '+f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),{env:f.env,store:f.store});assert.equal(r.status,200);assert.equal((await r.json()).conversations.length,0);}finally{f.sql.close()}});
test('optional compact outcome fields retain validation and atomic effort saving',async()=>{const f=prepared();try{const p=districtPilot(f.repo,f.env);await p.enroll({id:'one',lead_key:'qa:advanced',received_at:f.received,eligible:true},randomUUID());const v={id:'one',version:1,minutes:5,effort_category:'discovery',quote:false,bind:false,useful_conversation:true,final_status:'OPEN',confirmed:true,extra_flags:{sales_positive:true,quote_sent:true}};await assert.rejects(p.quickReview(v,randomUUID()),/prepared quote/);assert.equal((await p.get('one')).version,1);const saved=await p.quickReview({...v,quote:true},randomUUID());assert.equal(saved.observation.quote_sent,true);assert.equal(f.sql.prepare('SELECT category FROM cf_opportunity_effort').get().category,'discovery');}finally{f.sql.close()}});


test('normal web work wrap renders saved ISO due dates without breaking the detail',async()=>{
 const {mountWorkWrap}=await import('../assets/js/producer-work-wrap.mjs');
 const nodes=new Map();const root={innerHTML:'',addEventListener(){},querySelector(key){if(!nodes.has(key))nodes.set(key,{});return nodes.get(key)}};
 mountWorkWrap(root,{opportunity:{id:'web',status:'open',stage:'inquiry'},tasks:[{id:'task',due_at:'2026-09-25T17:30:00.000Z',title:'Call as requested'}]},()=>{},()=>{});
 assert.match(root.innerHTML,/value="2026-09-25T10:30"/);
 assert.match(root.innerHTML,/Save work/);
 assert.doesNotMatch(root.innerHTML,/Approve &amp; send|DISTRICT_SIGNAL/);
});

test('same opportunity reload returns newest inbound, facts, draft revision and stage',async()=>{const f=prepared();try{source(f,'one','district_pilot_v1',pilot('SIGNAL'));await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,signal:signal(),transcript:[]});const first=await f.work.detail('one');const latest={...signal(),revision:4,latest_inbound:'Under $220',facts:{line:'AUTO',price_target:220},decision_2:'CALL',reply:'',draft_status:'none',az_recommended_stage:'QUOTE_READY'};await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,signal:latest,transcript:[]});const next=await f.work.detail('one');assert.equal(first.sms.revision,1);assert.equal(next.sms.revision,4);assert.equal(next.sms.latest_inbound,'Under $220');assert.equal(next.sms.facts.price_target,220);assert.equal(next.sms.az_recommended_stage,'QUOTE_READY');assert.ok(smsPanel(next).includes('Revision 4'));}finally{f.sql.close()}});
test('Work shows pending SMS without inventing opportunities; enrollment removes pending label',async()=>{const f=prepared();try{await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,contactPhone:'+12025550199',lastInboundAt:new Date().toISOString(),transcript:[{direction:'outbound',body:'Is this for auto, home, or both?'},{direction:'inbound',body:'Home'}]});const work=producerWorkspace(f.repo,f.env),pending=await work.pendingSms();assert.equal(pending.records.length,1);assert.match(pending.records[0].label,/AgencyZoom lead/);assert.equal(pending.records[0].latest_inbound,'Home');assert.equal(f.sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,2);source(f,'one','district_pilot_v1',pilot('CONTROL'));assert.equal((await work.pendingSms()).records.length,0);}finally{f.sql.close()}});

test('Work list exposes creation separately from updated activity',async()=>{const f=prepared();try{
 f.sql.prepare('UPDATE cf_solo_opportunities SET created_at=?,updated_at=? WHERE id=?').run('2026-09-20T17:00:00Z','2026-09-26T19:00:00Z','one');
 const result=await f.work.list(new URLSearchParams({population:'ALL',status:'all'}));const row=result.records.find(r=>r.id==='one');
 assert.equal(row.created_at,'2026-09-20T17:00:00Z');assert.equal(row.updated_at,'2026-09-26T19:00:00Z');assert.equal(row.received_at,null);
}finally{f.sql.close();}});


test('attention remains optional and CONTROL receives no guidance',async()=>{const f=prepared();try{source(f,'one','district_pilot_v1',pilot('SIGNAL'));source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));let r=await f.work.list(new URLSearchParams({population:'ALL',sort:'recommended'}));assert.equal(r.attention_enabled,false);assert.ok(r.records.every(x=>x.attention===null));f.env.CF_ATTENTION_ENABLED='1';r=await f.work.list(new URLSearchParams({population:'ALL',sort:'recommended'}));assert.equal(r.records.find(x=>x.id==='two').attention,null);assert.equal((await f.work.detail('two')).commitments.length,0);assert.equal(r.sort,'recommended');await assert.rejects(f.work.list(new URLSearchParams({sort:'credit'})));}finally{f.sql.close();}});


test('attention summary counts actionable work and excludes CONTROL guidance',async()=>{const f=prepared();try{
 source(f,'one','district_pilot_v1',pilot('SIGNAL'));source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));
 f.env.CF_ATTENTION_ENABLED='1';
 await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,signal:{...signal(),latest_inbound:'Please call me',new_facts:{explicit_call_request:true},transcript:[{id:'in-1',direction:'inbound',body:'Please call me',occurredAt:new Date().toISOString()}]},transcript:[{id:'in-1',direction:'inbound',body:'Please call me',occurredAt:new Date().toISOString()}]});
 const r=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));
 const one=r.records.find(x=>x.id==='one'),two=r.records.find(x=>x.id==='two');assert.equal(r.attention_enabled,true);assert.equal(one.attention.band,'NOW');assert.equal(one.attention.reasons[0].text,'Explicit contact, quote or proceed request');assert.equal(two.attention,null);assert.equal(r.attention_summary.NOW,1);assert.equal(r.attention_summary.actionable,1);assert.equal(one.action_quality.actionable,true);assert.equal(one.action_quality.why_now.text,'Explicit contact, quote or proceed request');assert.equal(one.action_quality.action.code,'ASK_ONE_QUESTION');assert.ok(one.action_quality.evidence.some(x=>x.kind==='signal_decision_2'));
 const d=await f.work.detail('one');assert.equal(d.attention.band,'NOW');assert.equal(d.attention.actionable,true);assert.equal(d.actionQuality.action.code,'ASK_ONE_QUESTION');
 }finally{f.sql.close();}});


test('TEST pilot inventory is excluded from Attention summary and guidance',async()=>{const f=prepared();try{
 source(f,'one','district_pilot_v1',{...pilot('SIGNAL'),pilot_phase:'TEST',is_test:true});f.env.CF_ATTENTION_ENABLED='1';
 const r=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));assert.equal(r.records.some(x=>x.id==='one'),false);assert.equal(r.test_excluded,1);assert.equal(r.attention_summary.actionable,0);assert.equal((await f.work.detail('one')).attention,null);
 }finally{f.sql.close();}});


test('normal Producer Work excludes TEST pilot records while detail remains auditable',async()=>{const f=prepared();try{
 source(f,'one','district_pilot_v1',{...pilot('SIGNAL'),pilot_phase:'TEST',is_test:true});f.env.CF_ATTENTION_ENABLED='1';
 const r=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));assert.equal(r.test_excluded,1);assert.equal(r.records.some(x=>x.id==='one'),false);assert.equal(r.total,1);
 const d=await f.work.detail('one');assert.equal(d.sources.find(s=>s.kind==='district_pilot_v1')?.summary?.pilot_phase,'TEST');assert.equal(d.attention,null);
 }finally{f.sql.close();}});


test('synthetic NEW_LEAD pilot fixtures are excluded from normal Producer Work but remain directly auditable',async()=>{const f=prepared();try{
 source(f,'one','district_pilot_v1',{...pilot('SIGNAL'),synthetic:true});f.env.CF_ATTENTION_ENABLED='1';
 const r=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));assert.equal(r.records.some(x=>x.id==='one'),false);assert.equal(r.test_excluded,1);
 const d=await f.work.detail('one');assert.equal(d.sources.find(s=>s.kind==='district_pilot_v1')?.summary?.synthetic,true);assert.equal(d.attention,null);
 }finally{f.sql.close();}});


test('CONTROL receives no Producer Action Quality projection',async()=>{const f=prepared();try{source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));f.env.CF_ATTENTION_ENABLED='1';const r=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));const two=r.records.find(x=>x.id==='two');assert.equal(two.action_quality,null);assert.equal((await f.work.detail('two')).actionQuality,null);}finally{f.sql.close();}});

test('Producer Action Quality CALL agrees across Work list and detail with provenance',async()=>{
 const f=prepared();try{
  source(f,'one','district_pilot_v1',pilot('SIGNAL'));f.env.CF_ATTENTION_ENABLED='1';
  const transcript=[{id:'incoming-call-1',direction:'inbound',body:'Please call me',occurredAt:new Date().toISOString()}];
  await f.store.setJSON('sms-live-conversations/'+cid,{
   id:cid,signal:{...signal(),decision_2:'CALL',latest_inbound:'Please call me',new_facts:{explicit_call_request:true},facts:{line:'AUTO',explicit_call_request:true}},transcript
  });
  const listed=(await f.work.list(new URLSearchParams({population:'ALL',sort:'recommended'}))).records.find(r=>r.id==='one');
  const detailed=await f.work.detail('one');
  assert.equal(listed.action_quality.action.code,'CALL_CUSTOMER');
  assert.equal(listed.action_quality.action.channel,'CALL');
  assert.equal(detailed.actionQuality.action.code,listed.action_quality.action.code);
  assert.equal(detailed.actionQuality.action.label,listed.action_quality.action.label);
  assert.deepEqual(detailed.actionQuality.why_now,listed.action_quality.why_now);
  assert.equal(listed.action_quality.why_now.source_ref.id,'incoming-call-1');
 }finally{f.sql.close();}
});

test('confirmed due appointment produces the same action in Work list and detail',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  source(f,'one','lead',{permission:{basis:'Explicit request'},context:{signalHome:{}}});
  const due=new Date(Date.now()+2*60*1000).toISOString();
  source(f,'one','calendar',{eventId:'synthetic-calendar-qa',status:'scheduled',start:due,title:'Insurance review'});
  const listed=(await f.work.list(new URLSearchParams({population:'WEB_DIRECT',sort:'due_now'}))).records.find(r=>r.id==='one');
  const detailed=await f.work.detail('one');
  assert.equal(listed.attention.band,'NOW');
  assert.equal(listed.action_quality.action.code,'PREPARE_OR_HOLD_APPOINTMENT');
  assert.equal(listed.action_quality.action.due_at,due);
  assert.deepEqual(detailed.actionQuality.action,listed.action_quality.action);
  assert.deepEqual(detailed.actionQuality.why_now,listed.action_quality.why_now);
  assert.ok(listed.action_quality.evidence.some(e=>e.kind==='commitment'));
  assert.ok(detailed.actionQuality.evidence.some(e=>e.kind==='commitment'));
 }finally{f.sql.close();}
});

test('WEB_DIRECT opt-out via continued conversation suppresses both list and detail',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  source(f,'one','lead',{permission:{basis:'Prior contact request'},context:{signalHome:{}}});
  source(f,'one','signal_continue_v1',{conversation_id:cid});
  await f.store.setJSON('sms-live-conversations/'+cid,{
   id:cid,smsConsent:{status:'opted_out'},signal:{managed:true,decision_2:'CALL',facts:{line:'AUTO'}}
  });
  const listed=(await f.work.list(new URLSearchParams({population:'WEB_DIRECT',sort:'recommended'}))).records.find(r=>r.id==='one');
  const detailed=await f.work.detail('one');
  assert.equal(listed.attention.band,'SUPPRESSED');
  assert.equal(detailed.attention.band,'SUPPRESSED');
  assert.equal(listed.action_quality.action.code,'DO_NOT_CONTACT');
  assert.equal(detailed.actionQuality.action.code,'DO_NOT_CONTACT');
  assert.equal(listed.action_quality.actionable,false);
  assert.equal(detailed.actionQuality.actionable,false);
  assert.equal(detailed.contactSafety.suppressed,true);
 }finally{f.sql.close();}
});

test('WEB_DIRECT distributor conversation suppression agrees in Work list and detail',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  source(f,'one','lead',{permission:{basis:'Explicit request'},context:{distribution:{phase:'producer_handoff',conversation_id:cid}}});
  await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,signal:{contact_suppressed:true,decision_2:'STOP'}});
  const listed=(await f.work.list(new URLSearchParams({population:'WEB_DIRECT'}))).records.find(r=>r.id==='one');
  const detailed=await f.work.detail('one');
  assert.equal(listed.action_quality.action.code,'DO_NOT_CONTACT');
  assert.equal(detailed.actionQuality.action.code,'DO_NOT_CONTACT');
  assert.equal(detailed.contactSafety.suppressed,true);
 }finally{f.sql.close();}
});

test('synthetic TEST detail is auditable but cannot expose actionable quality guidance',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  source(f,'one','district_pilot_v1',{...pilot('SIGNAL'),pilot_phase:'TEST',is_test:true});
  const listed=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));
  const detailed=await f.work.detail('one');
  assert.equal(listed.records.some(r=>r.id==='one'),false);
  assert.equal(detailed.attention,null);
  assert.equal(detailed.actionQuality,null);
 }finally{f.sql.close();}
});

test('with Attention disabled the Producer Action Quality surface remains off',async()=>{
 const f=prepared();try{
  source(f,'one','district_pilot_v1',pilot('SIGNAL'));
  const listed=(await f.work.list(new URLSearchParams({population:'ALL'}))).records.find(r=>r.id==='one');
  const detailed=await f.work.detail('one');
  assert.equal(listed.action_quality,null);
  assert.equal(detailed.actionQuality,null);
 }finally{f.sql.close();}
});

test('completed high-priority task does not resurrect a proceed recommendation in Work list',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  source(f,'one','district_pilot_v1',pilot('SIGNAL'));
  const at=new Date().toISOString();
  f.sql.prepare("INSERT INTO cf_solo_tasks(id,workspace_id,opportunity_id,assignee_id,work_type,title,due_at,state,priority,source_key,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
   .run('completed-task','qa','one','qa','outreach','Customer requested proceed',at,'completed',100,'test:completed',at);
  // Give list and detail the same existing canonical priority projection.
  await f.repo.detail('one');
  const row=(await f.work.list(new URLSearchParams({population:'DISTRICT_SIGNAL'}))).records.find(r=>r.id==='one');
  const detail=await f.work.detail('one');
  const listNba=row.action_quality.evidence.find(e=>e.kind==='nba');
  assert.notEqual(detail.nextBestAction.action,'RESPOND_TO_PROCEED');
  assert.equal(listNba.action,detail.nextBestAction.action);
  assert.notEqual(listNba.action,'RESPOND_TO_PROCEED');
 }finally{f.sql.close();}
});

test('fresh CALL request outranks unrelated future appointment consistently in list and detail',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  source(f,'one','district_pilot_v1',pilot('SIGNAL'));
  source(f,'one','calendar',{eventId:'future-app',status:'scheduled',start:new Date(Date.now()+21*86400000).toISOString(),title:'Future insurance review'});
  const transcript=[{id:'urgent-inbound',direction:'inbound',body:'Please call me',occurredAt:new Date().toISOString()}];
  await f.store.setJSON('sms-live-conversations/'+cid,{
   id:cid,signal:{...signal(),decision_2:'CALL',latest_inbound:'Please call me',new_facts:{explicit_call_request:true},facts:{line:'AUTO',explicit_call_request:true}},transcript
  });
  const row=(await f.work.list(new URLSearchParams({population:'DISTRICT_SIGNAL'}))).records.find(r=>r.id==='one');
  const detail=await f.work.detail('one');
  assert.equal(row.attention.band,'NOW');
  assert.equal(detail.attention.band,'NOW');
  assert.equal(row.action_quality.action.code,'CALL_CUSTOMER');
  assert.equal(detail.actionQuality.action.code,'CALL_CUSTOMER');
  assert.equal(row.action_quality.action.source,'signal_decision_2');
  assert.ok(row.action_quality.evidence.some(e=>e.kind==='commitment'));
 }finally{f.sql.close();}
});

test('Command Center API is default-off and never unlocks unauthenticated preview',async()=>{
 const f=prepared();try{
  const r=await handleSoloDesk({request:new Request('https://coveragefit.test/api/solo-desk/producer-command-center',{headers:{Authorization:'Bearer '+f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),env:f.env});
  assert.equal(r.status,404);
  const noAuth=await handleSoloDesk({request:new Request('https://coveragefit.test/api/solo-desk/producer-command-center'),env:{...f.env,CF_COMMAND_CENTER_READONLY_ENABLED:'1'}});
  assert.equal(noAuth.status,401);
 }finally{f.sql.close();}
});
test('Command Center Preview route uses existing Attention and Signal and does not grant SMS send authority',async()=>{
 const f=prepared();try{
  f.env.CF_ATTENTION_ENABLED='1';
  f.env.CF_COMMAND_CENTER_READONLY_ENABLED='1';
  source(f,'one','district_pilot_v1',pilot('SIGNAL'));
  source(f,'two','district_pilot_v1',pilot('CONTROL',otherCid));
  await f.store.setJSON('sms-live-conversations/'+cid,{
   id:cid,signal:{...signal(),latest_inbound:'Please help with renewal',draft_status:'pending'},
   transcript:[{id:'incoming-qa',direction:'inbound',body:'Please help with renewal',occurredAt:new Date(Date.now()-60000).toISOString()}]
  });
  const req=new Request('https://coveragefit.test/api/solo-desk/producer-command-center',{headers:{Authorization:'Bearer '+f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}});
  const r=await handleSoloDesk({request:req,env:f.env});
  assert.equal(r.status,200);
  const v=await r.json();
  assert.equal(v.enabled,true);
  assert.equal(v.coverage.read_only,true);
  assert.equal(v.coverage.provider_inbound_live_certified,false);
  assert.equal(v.inbox.length,1);
  assert.equal(v.inbox[0].category,'DRAFT_REVIEW');
  assert.equal(v.inbox[0].can_bulk_approve,false);
  assert.equal(v.inbox[0].sms_send_eligible,false);
  assert.equal(v.today.every(x=>x.population!=='DISTRICT_CONTROL'),true);
  assert.equal(JSON.stringify(v).includes('COVERAGEFIT_PRODUCER_ACCESS_TOKEN'),false);
 }finally{f.sql.close();}
});

test('Prospect 360 is producer-authenticated and default-off; source renewal is unverified',async()=>{
 const f=prepared();try{
  const auth={Authorization:'Bearer '+f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN};
  const base='https://coveragefit.test/api/solo-desk/prospect-360?id=one';
  const disabled=await handleSoloDesk({request:new Request(base,{headers:auth}),env:f.env});
  assert.equal(disabled.status,404);
  f.env.CF_PROSPECT_360_READONLY_ENABLED='1';
  source(f,'one','lead',{rawFacts:{renewal_date:'2026-11-15'}});
  const unauth=await handleSoloDesk({request:new Request(base),env:f.env});assert.equal(unauth.status,401);
  const response=await handleSoloDesk({request:new Request(base,{headers:auth}),env:f.env,now:new Date('2026-10-12T12:00:00Z')});
  assert.equal(response.status,200);const view=await response.json();
  assert.equal(view.facts.renewal.verification,'imported_unverified');
  assert.equal(view.facts.renewal.lifecycle,'CANDIDATE');
  assert.equal(view.facts.renewal.sms_send_authorized,false);
  assert.equal(view.limitations.no_new_identity_merge,true);
 }finally{f.sql.close();}
});
test('SMS selected review API stays default-off, rejects malformed sets and never grants sending',async()=>{
 const f=prepared();try{
  const base='https://coveragefit.test/api/solo-desk/producer-approval-preflight?ids=one';
  const auth={Authorization:'Bearer '+f.env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN};
  const req=x=>new Request(x,{headers:auth});
  f.env.CF_ATTENTION_ENABLED='1';
  f.env.CF_COMMAND_CENTER_READONLY_ENABLED='1';
  assert.equal((await handleSoloDesk({request:req(base),env:f.env})).status,404);
  f.env.CF_SMS_REVIEW_READONLY_ENABLED='1';
  assert.equal((await handleSoloDesk({request:req(base+'%2C'),env:f.env})).status,422);
  source(f,'one','district_pilot_v1',pilot('SIGNAL'));
  await f.store.setJSON('sms-live-conversations/'+cid,{id:cid,signal:signal(),transcript:[]});
  const result=await handleSoloDesk({request:req(base),env:f.env});
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.items.length,1);
  assert.equal(data.items[0].can_review,true);
  assert.equal(data.items[0].current_revision,1);
  assert.equal(data.items[0].can_send,false);
  assert.equal(data.items[0].can_approve,false);
  const noAuth=await handleSoloDesk({request:new Request(base),env:f.env});
  assert.equal(noAuth.status,401);
 }finally{f.sql.close();}
});