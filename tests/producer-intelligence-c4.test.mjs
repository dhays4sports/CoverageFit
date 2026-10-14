import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture,event,seed,configure,context,authority as mutationAuthority,batch,snapshot,W,P,NOW} from './helpers/evaluation-queue-fixture.mjs';
import {views,request,authority} from './helpers/producer-intelligence-fixture.mjs';
import {producerIntelligenceRead} from '../server/producer-intelligence-read.mjs';
import {producerIntelligenceLocal} from '../server/producer-intelligence-local.mjs';
import {producerWorkspace} from '../server/producer-workspace.mjs';
import {projectCommandCenter,commandCenterPreview} from '../server/producer-command-center.mjs';
import {projectProspect360} from '../server/prospect-360-readonly.mjs';
import {deriveAttention} from '../server/attention-priority.mjs';
import {deriveProducerActionQuality} from '../server/producer-action-quality.mjs';
import {reconcileProducerIntelligence} from '../server/producer-intelligence-contract.mjs';
const admit=(f,id='request',claims=[{field:'explicit_call_request',value:true}],p=P)=>{assert.equal(f.queue.memory.admit(event(id,claims,{profile_id:p}),{now:NOW}).code,'ADMITTED')};
const setup=(f,options=context)=>{configure(f,options);admit(f);batch(f.queue)};
const change=(f,options)=>f.queue.setContext(W,P,options,{now:NOW,requestId:'change',authority:mutationAuthority,expectedVersion:f.queue.context(W,P).version});
const dump=db=>Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({name})=>[name,db.prepare('SELECT * FROM "'+name+'"').all()]));
const noExecution=r=>{for(const k of ['sms','call','calendar','crm','external'])assert.equal(r.execution_authority[k],false);assert.equal(r.actionQuality.action.actionable,false);assert.equal(r.sms,null);assert.equal(r.nextBestAction,null);assert.equal(r.continuation,null);assert.equal(r.sms_enabled,false);assert.equal(r.copilot_enabled,false)};
const poisoned=r=>({...r,sms:{decision_2:'CALL',draft_status:'pending',quote_ready:true},nextBestAction:{action:'CALL',label:'old call'},continuation:{decision_2:'CALL'},opportunityPriority:{recommendedMicroQuestion:'old question'},action_quality:{actionable:true,action:{code:'CALL_CUSTOMER',label:'old call'}},actionQuality:{actionable:true,action:{code:'CALL_CUSTOMER',label:'old call'}},attention:{band:'NOW',actionable:true,rank:120}});
const assertNoAction=r=>{assert.equal(r.actionQuality.action.code,'NO_ACTION');assert.equal(r.human_attention_eligible,false);noExecution(r)};
test('C4 persisted customer CALL reaches existing Workspace, Today and Prospect 360 as internal review only',async()=>{
 const f=fixture();try{configure(f);admit(f);const svc=views(f);assert.equal((await svc.detail(request(),P)).current_decision.status,'PENDING');batch(f.queue);
 const repo={scope:{workspace:W},db:f.db,rows(){throw Error('full inventory forbidden')},own(){throw Error('legacy detail forbidden')}};
 const env={CF_COMMAND_CENTER_READONLY_ENABLED:'1'},work=producerWorkspace(repo,env,{intelligence:svc,request:request('?workspace=attacker')});
 const d=await work.detail(P);assert.equal(d.current_decision.status,'CURRENT');assert.equal(d.current_decision.evidence_revision,snapshot(f.db).target_revision);assert.ok(d.current_decision.decision_version);assert.ok(d.current_decision.source_references.length);assert.equal(d.attention.band,'NOW');assert.equal(d.actionQuality.actionable,true);assert.equal(d.actionQuality.action.code,'CALL_CUSTOMER');noExecution(d);
 const list=await work.list(new URLSearchParams({limit:'10'}));assert.equal(list.records.length,1);assert.equal(list.records[0].human_attention_eligible,true);
 const today=await commandCenterPreview(repo,env,{intelligence:svc,request:request()});assert.equal(today.today.length,1);assert.equal(today.today[0].human_attention_eligible,true);assert.equal(today.today[0].actionable,false);assert.equal(today.today[0].execution_authority.call,false);assert.equal(today.inbox.length,0);
 const p=await svc.prospect360(request(),P);assert.equal(p.facts.decision.next_action,'CALL_CUSTOMER');assert.equal(p.execution_authority.call,false);assert.equal(p.human_attention_eligible,true);
 }finally{f.cleanup()}
});
test('C4 quote preparation is human attention, waiting remains upcoming and nonurgent',async()=>{
 const f=fixture();try{configure(f);admit(f,'quote',[{field:'explicit_quote_request',value:true}]);batch(f.queue);const svc=views(f);assert.equal((await svc.today(request())).today[0].next_action,'PREPARE_OR_REVIEW_QUOTE');
 change(f,{...context,commitments:[{confirmed:true,status:'open',evidence_ref:'callback-source',at:'2026-11-01T12:00:00Z'}]});batch(f.queue);
 const d=await svc.detail(request(),P);assert.equal(d.current_decision.status,'CURRENT');assert.equal(d.current_decision.recommendation.action,'LATER');assert.equal(d.attention.band,'UPCOMING');assert.equal(d.attention.due_at,null);assert.equal(d.human_attention_eligible,false);assert.equal((await svc.today(request())).today.length,0);noExecution(d);
 }finally{f.cleanup()}
});
for(const status of ['PENDING','STALE','FAILED','HELD','UNAVAILABLE'])test('C4 '+status+' cannot leak legacy action through any producer projection',async()=>{
 const f=fixture({maxAttempts:1});try{configure(f);admit(f);if(status!=='PENDING')batch(f.queue);
 if(status==='STALE')admit(f,'new');
 if(status==='FAILED'){f.queue.requestRefresh(W,P,{now:NOW,requestId:'fail',authority:mutationAuthority});const c=f.queue.claim({workspace:W,now:NOW,workerId:'fail'}).claims[0];f.queue.fail(c,{now:NOW});}
 if(status==='HELD')change(f,{...context,contact:{suppressed:true}});
 if(status==='UNAVAILABLE')f.db.prepare("DELETE FROM cf_solo_sources WHERE kind='signal_c2_context_v1'").run();
 const svc=views(f),d=await svc.detail(request(),P);assert.equal(d.current_decision.status,status);assertNoAction(d);
 const old=poisoned(d),center=projectCommandCenter({attention_enabled:true,records:[{...old,population:old.population.population}]});assert.equal(center.today.length,0);assert.equal(center.inbox.length,0);
 const p=projectProspect360(old,{now:NOW});assert.equal(p.facts.decision.next_action,'NO_ACTION');
 const input={population:'DISTRICT_SIGNAL',opportunity:{id:P},sms:old.sms,nextBestAction:old.nextBestAction,currentDecision:d.current_decision};assert.equal(deriveAttention(input).actionable,false);assert.equal(deriveProducerActionQuality(input).action.code,'NO_ACTION');
 if(['HELD','FAILED','UNAVAILABLE'].includes(status)){assert.equal(center.exceptions.length,1);assert.equal(center.exceptions[0].next_action,'NO_ACTION');}
 }finally{f.cleanup()}
});
for(const [name,options] of [['STOP',{...context,contact:{suppressed:true}}],['CONTROL',{...context,population:'CONTROL'}],['takeover',{...context,producerTakeover:true}],['unknown owner',{...context,workflowOwner:'UNKNOWN'}]])test('C4 '+name+' blocks old handoff immediately',async()=>{
 const f=fixture();try{setup(f);change(f,options);const svc=views(f),d=await svc.detail(request(),P);assert.equal(d.current_decision.status,'HELD');assertNoAction(d);assert.equal((await svc.today(request())).today.length,0)}finally{f.cleanup()}
});
test('C4 AgencyZoom and absent SMS permission retain internal CALL without workflow transfer',async()=>{
 const f=fixture();try{setup(f);const d=await views(f).detail(request(),P);assert.equal(d.current_decision.workflow_owner,'AGENCYZOOM');assert.ok(d.current_decision.restrictions.includes('SMS_PERMISSION_UNVERIFIED'));assert.ok(d.current_decision.restrictions.includes('EXTERNAL_OR_UNKNOWN_WORKFLOW_OWNER'));assert.equal(d.human_attention_eligible,true);noExecution(d);const missingExecution=reconcileProducerIntelligence(d,{...d.current_decision,execution_eligibility:undefined});assert.equal(missingExecution.human_attention_eligible,true);noExecution(missingExecution);assert.equal(reconcileProducerIntelligence(d,{...d.current_decision,workflow_owner:undefined}).current_decision.status,'HELD')}finally{f.cleanup()}
});
test('C4 changed identity and policy revision invalidate handoff before producer reads',async()=>{
 const f=fixture();try{setup(f);seed(f.db,'other');f.db.prepare('UPDATE cf_ucp_opportunity_links SET customer_id=? WHERE workspace_id=? AND opportunity_id=?').run('cust_other',W,P);const d=await views(f).detail(request(),P);assert.equal(d.current_decision.reason,'IDENTITY_HOLD');assertNoAction(d)}finally{f.cleanup()}
});
test('C4 missing authorization and cross-tenant/record access denied before disclosure',async()=>{
 const f=fixture();try{setup(f);seed(f.db,'tenant-b','other-workspace');const svc=views(f);
 await assert.rejects(svc.detail(new Request('https://synthetic.test/?workspace='+W),P),e=>e.status===401);
 await assert.rejects(producerIntelligenceRead().list(request()),e=>e.status===401);
 await assert.rejects(svc.detail(request('?workspace=other-workspace'),'tenant-b'),e=>e.status===404);
 const restricted=views(f,{authorize:authority({workspace:W,actor:'test',recordIds:[]})});assert.equal((await restricted.list(request())).records.length,0);await assert.rejects(restricted.detail(request(),P),e=>e.status===404);
 const scoped=views(f,{authorize:authority({workspace:W,actor:'test',recordIds:[P]})});assert.equal((await scoped.list(request('?workspace=other-workspace'))).records.length,1);
 }finally{f.cleanup()}
});
test('C4 missing/incompatible/uninitialized/hosted and failing stores do not fall back',async()=>{
 const f=fixture();try{setup(f);const base=producerIntelligenceLocal(f.db,{syntheticOnly:true});
 for(const [store,reason] of [[null,'DECISION_STORE_UNAVAILABLE'],[{...base,contract:'old'},'INCOMPATIBLE_DECISION_STORE'],[{...base,initialized:false},'ADAPTER_NOT_INITIALIZED'],[{...base,runtime:'D1'},'HOSTED_ADAPTER_NOT_ACCEPTED'],[{...base,read(){throw Error('private database details')},page(){throw Error('private database details')}},'DECISION_STORE_UNAVAILABLE']]){
 const svc=views(f,{store}),d=await svc.detail(request(),P);assert.equal(d.current_decision.reason,reason);assertNoAction(d);const list=await svc.list(request());assert.equal(list.status,'UNAVAILABLE');assert.equal(list.records.length,0);
 }
 f.db.exec('DROP TABLE cf_evaluation_results');const svc=views(f);assert.equal((await svc.detail(request(),P)).current_decision.reason,'DECISION_MIGRATION_UNAVAILABLE');assert.equal((await svc.list(request())).reason,'DECISION_MIGRATION_UNAVAILABLE');
 }finally{f.cleanup()}
});
test('C4 inconsistent evidence/context state and adapter scope/clock fail closed',async()=>{
 const f=fixture();try{setup(f);const base=producerIntelligenceLocal(f.db,{syntheticOnly:true});
 const wrong=views(f,{store:{...base,read(a){return {...base.read(a),workspace:'other'}}}});await assert.rejects(wrong.detail(request(),P),e=>e.code==='ADAPTER_SCOPE_MISMATCH');
 const staleClock=views(f,{store:{...base,read(a){const r=base.read(a);r.decision.as_of='2020-01-01T00:00:00Z';return r}}});assert.equal((await staleClock.detail(request(),P)).current_decision.status,'UNAVAILABLE');
 const d=await views(f).detail(request(),P),bad={...d.current_decision,evidence_revision:999};assertNoAction(reconcileProducerIntelligence(poisoned(d),bad));
 f.db.prepare("UPDATE cf_evaluation_results SET context_version='incorrect'").run();assert.equal((await views(f).detail(request(),P)).current_decision.status,'STALE');
 }finally{f.cleanup()}
});
test('C4 existing authoritative suppression/takeover outrank otherwise CURRENT C3',async()=>{
 const f=fixture();try{setup(f);const d=await views(f).detail(request(),P);
 for(const extra of [{sms:{decision_2:'STOP'}},{sms:{human_active:true}},{population:{population:'DISTRICT_CONTROL'}},{contactSafety:{suppressed:true}}]){const r=reconcileProducerIntelligence({...d,...extra},d.current_decision);assert.equal(r.current_decision.status,'HELD');assertNoAction(r)}
 }finally{f.cleanup()}
});
test('C4 bounded keyset pages, file reopen, real GET read harness and zero mutation/external calls',async()=>{
 const f=fixture();let ro;const previous=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('no external action')};try{
 setup(f);for(let i=0;i<35;i++){const p='page-'+String(i).padStart(3,'0');seed(f.db,p);configure(f,context,p);admit(f,'source-'+i,undefined,p)}
 const before=dump(f.db),changes=f.db.prepare('SELECT total_changes() n').get().n;ro=new DatabaseSync(f.path,{readOnly:true});const svc=views({db:ro});let after='',ids=[];
 do{const req=request('?after='+after),page=await svc.list(req,{after,limit:7});assert.equal(req.method,'GET');assert.ok(page.records.length<=7);ids.push(...page.records.map(r=>r.id));after=page.next_cursor;}while(after);
 assert.equal(ids.length,36);assert.equal(new Set(ids).size,36);assert.equal((await svc.detail(request(),P)).current_decision.status,'CURRENT');await svc.today(request());await svc.prospect360(request(),P);await assert.rejects(svc.list(request(),{limit:101}));
 assert.deepEqual(dump(f.db),before);assert.equal(f.db.prepare('SELECT total_changes() n').get().n,changes);assert.equal(calls,0);
 }finally{globalThis.fetch=previous;ro?.close();f.cleanup()}
});
test('C4 runtime-neutral modules and hosted route graph exclude local Node adapters',()=>{
 for(const p of ['producer-intelligence-contract.mjs','producer-intelligence-read.mjs'])assert.doesNotMatch(readFileSync(new URL('../server/'+p,import.meta.url),'utf8'),/from ['"]node:|from ['"].*-local\.mjs/);
 const route=readFileSync(new URL('../server/solo-desk-api.mjs',import.meta.url),'utf8');assert.doesNotMatch(route,/producer-intelligence-local|signal-current-decision-local/);
});
test('C4 CURRENT question and close are not urgent producer work',async()=>{
 const f=fixture();try{configure(f);admit(f,'facts',[{field:'carrier',value:'AAA'}]);batch(f.queue);const svc=views(f);let d=await svc.detail(request(),P);assert.equal(d.current_decision.status,'CURRENT');assert.equal(d.current_decision.recommendation.action,'ASK ONE QUESTION');assert.equal(d.human_attention_eligible,false);assert.equal((await svc.today(request())).today.length,0);
 change(f,{...context,closed:true});batch(f.queue);d=await svc.detail(request(),P);assert.equal(d.current_decision.recommendation.action,'CLOSE');assert.equal((await svc.today(request())).today.length,0);noExecution(d);
 }finally{f.cleanup()}
});
test('C4 unauthorized requests do not invoke the store; foreign page envelopes disclose nothing',async()=>{
 const f=fixture();try{setup(f);const base=producerIntelligenceLocal(f.db,{syntheticOnly:true});let reads=0;const svc=views(f,{store:{...base,read(a){reads++;return base.read(a)},page(a){reads++;return base.page(a)}}});
 await assert.rejects(svc.list(new Request('https://synthetic.test/?workspace='+W)));assert.equal(reads,0);
 const restricted=views(f,{authorize:authority({workspace:W,actor:'test',recordIds:[]}),store:{...base,read(){reads++;throw Error('must not read')}}});await assert.rejects(restricted.detail(request(),P));assert.equal(reads,0);
 const foreign=views(f,{store:{...base,page(a){const p=base.page(a);p.items[0].workspace='other';return p}}});await assert.rejects(foreign.list(request()),e=>e.code==='ADAPTER_SCOPE_MISMATCH');
 }finally{f.cleanup()}
});
test('C4 page-local filtering and closed record guard preserve cursors without inventory scans',async()=>{
 const f=fixture();try{setup(f);f.db.prepare("UPDATE cf_solo_opportunities SET status='closed' WHERE workspace_id=? AND id=?").run(W,P);const svc=views(f);assert.equal((await svc.list(request())).records.length,0);const closed=await svc.list(request(),{status:'closed'});assert.equal(closed.records.length,1);assertNoAction(closed.records[0]);assert.equal((await svc.today(request(),{status:'closed'})).today.length,0);await assert.rejects(svc.list(request(),{population:'attacker'}));
 }finally{f.cleanup()}
});
test('C4 actual producer contract never enables legacy mutation panels; paging retains bounded cursor',async()=>{
 const {allowsProducerMutationPanels,producerPageContinuation}=await import('../assets/js/producer-intelligence-readonly.mjs');
 const f=fixture();try{setup(f);const d=await views(f).detail(request(),P);assert.equal(allowsProducerMutationPanels(d),false);assert.equal(allowsProducerMutationPanels({current_decision:null}),false);assert.equal(allowsProducerMutationPanels({}),true);
 assert.deepEqual(producerPageContinuation({total_scope:'PAGE_ONLY',next_cursor:'next',nextOffset:5000}),{after:'next',offset:null});assert.deepEqual(producerPageContinuation({nextOffset:40}),{after:null,offset:40});
 const ui=readFileSync(new URL('../assets/js/producer-workspace.mjs',import.meta.url),'utf8');assert.match(ui,/if\(allowsProducerMutationPanels\(d\)\)\{mountConversation\(d\);mountContinue/);assert.match(ui,/else\{\$\('effort-outcome'\)\.textContent='Read-only intelligence/);
 }finally{f.cleanup()}
});
test('C4 page-key query uses existing UCP range index without full-inventory sort',()=>{
 const f=fixture();try{const plan=JSON.stringify(f.db.prepare('EXPLAIN QUERY PLAN SELECT opportunity_id AS id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id>? ORDER BY opportunity_id LIMIT ?').all(W,'',26));assert.match(plan,/SEARCH/);assert.doesNotMatch(plan,/TEMP B-TREE|SCAN cf_solo_opportunities/)}finally{f.cleanup()}
});
test('C4 partial or incompatible evidence migration is explicitly unavailable',async()=>{
 for(const sql of ['DROP TABLE cf_evidence_assertions','ALTER TABLE cf_evidence_revisions RENAME COLUMN revision TO incompatible_revision']){
  const f=fixture();try{setup(f);f.db.exec(sql);const svc=views(f);assert.equal((await svc.detail(request(),P)).current_decision.reason,'DECISION_MIGRATION_UNAVAILABLE');assert.equal((await svc.list(request())).reason,'DECISION_MIGRATION_UNAVAILABLE')}finally{f.cleanup()}
 }
});
