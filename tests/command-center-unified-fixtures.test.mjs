import {signalCurrentDecisionLocal} from '../server/signal-current-decision-local.mjs';
import {seed as seedMemory,event as memoryEvent,NOW as memoryNow} from './helpers/prospect-memory-fixture.mjs';
import {signalEvaluationQueueLocal} from '../server/signal-evaluation-queue-local.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {generateCommandCenterFixturePackage} from '../scripts/prepare-command-center-preview-fixtures.mjs';
import {handleSoloDesk} from '../server/solo-desk-api.mjs';
const runId='qa-unified-package-test-20261012',workspace='qa-unified-test',head='c'.repeat(40);
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../migrations/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())
  sql.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const db={prepare(q){let args=[];const stmt={bind(...v){args=v;return stmt},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return stmt},async batch(stmts){sql.exec('BEGIN');try{const r=[];for(const x of stmts)r.push(await x.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const env={COVERAGEFIT_DB:db,COVERAGEFIT_SOLO_WORKSPACE_ID:workspace,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-pass-only-access-token',CF_ATTENTION_ENABLED:'1',CF_AI_ENABLED:'0',CF_COMMAND_CENTER_READONLY_ENABLED:'1',CF_PROSPECT_360_READONLY_ENABLED:'1',CF_SMS_REVIEW_READONLY_ENABLED:'1'};
 const api=async(path)=>{
  const response=await handleSoloDesk({request:new Request('https://synthetic.test/api/solo-desk/'+path,{headers:{Authorization:'Bearer '+env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN}}),env,now:new Date('2026-10-12T22:00:00Z')});
  return {status:response.status,body:await response.json()};
 };
 return {sql,api};
}
test('single SQL package adds twelve fictional fixtures, never deletes, updates, or duplicates',()=>{
 const p=generateCommandCenterFixturePackage({runId,workspaceId:workspace,head,now:new Date('2026-10-12T22:00:00Z')});
 assert.equal(Object.keys(p.fixtures).length,12);
 assert.equal(new Set(Object.values(p.fixtures)).size,12);
 assert.doesNotMatch(p.sql,/\bDELETE FROM\b|\bUPDATE\s+\w+\s+SET\b/i);
 assert.match(p.sql,/ON CONFLICT DO NOTHING/);
 assert.doesNotMatch(p.sql,/@gmail\.com|@farmersagency\.com|\+1408\d{7}/);
 const f=setup();
 try{
  f.sql.exec(p.sql);
  const query=()=>f.sql.prepare("SELECT COUNT(*) AS n FROM cf_solo_opportunities WHERE workspace_id=? AND source='preview_certification'").get(workspace).n;
  assert.equal(query(),12);
  f.sql.exec(p.sql);
  assert.equal(query(),12);
  assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM cf_solo_sources WHERE kind='preview_command_center_fixture_v1'").get().n,3);
 }finally{f.sql.close()}
});
test('one seeded Preview fixture package exercises hosted-equivalent Today, Inbox, Prospect and selected draft APIs',async()=>{
 const p=generateCommandCenterFixturePackage({runId,workspaceId:workspace,head,now:new Date('2026-10-12T22:00:00Z')});
 const f=setup();try{
  f.sql.exec(p.sql);
  const command=await f.api('producer-command-center');
  assert.equal(command.status,200);
  assert.equal(command.body.enabled,true);
  assert.equal(command.body.inbox.some(x=>x.opportunity_id===p.fixtures.review_pending&&x.category==='DRAFT_REVIEW'),true);
  assert.equal(command.body.today.some(x=>x.opportunity_id===p.fixtures.call),true);
  assert.equal(command.body.today.some(x=>x.opportunity_id===p.fixtures.test_excluded),false);
  assert.equal(command.body.today.some(x=>x.opportunity_id===p.fixtures.stop),false);
  assert.equal(command.body.today.some(x=>x.opportunity_id===p.fixtures.control),false);
  const review=await f.api('producer-approval-preflight?ids='+[p.fixtures.review_pending,p.fixtures.stop,p.fixtures.control].join(','));
  assert.equal(review.status,200);
  const items=review.body.items;
  assert.equal(items.length,3);
  assert.equal(items[0].current_revision,3);
  assert.equal(items[0].can_review,true);
  assert.equal(items[0].draft_body,'When does your current auto policy renew?');
  assert.ok(items.every(x=>x.can_send===false&&x.can_approve===false));
  assert.ok(items.slice(1).every(x=>x.can_review===false));
  const verified=(await f.api('prospect-360?id='+p.fixtures.renewal_verified)).body;
  const conflicted=(await f.api('prospect-360?id='+p.fixtures.renewal_conflict)).body;
  assert.equal(verified.facts.renewal.verification,'customer_confirmed');
  assert.equal(verified.facts.renewal.value.date,p.manifest.expected_renewal_date);
  assert.equal(verified.facts.renewal.sms_send_authorized,false);
  assert.equal(conflicted.facts.renewal.verification,'conflicted');
  assert.equal(conflicted.facts.renewal.value,null);
  assert.equal(conflicted.facts.contact_safety.sms_authority,'NOT_EVALUATED');
 }finally{f.sql.close()}
});

test('combined browser checker is same-origin GET-only and reports sanitized acceptance',()=>{
 const text=readFileSync(new URL('../scripts/command-center-combined-browser-check.template.js',import.meta.url),'utf8');
 assert.match(text,/const HOST='__PREVIEW_HOST__'/);
 assert.match(text,/const HEAD='__EXPECTED_HEAD__'/);
 assert.match(text,/const RUN='__RUN_ID__'/);
 assert.match(text,/location\.hostname!==HOST/);
 assert.match(text,/method:'GET'/);
 assert.match(text,/COVERAGEFIT_UNIFIED_RESULT/);
 assert.match(text,/preview_isolation:'OPERATOR_ATTESTED_ONLY'/);
 assert.match(text,/sends:0/);
 assert.doesNotMatch(text,/method:\s*['"](?:POST|PATCH|DELETE|PUT)['"]/);
 assert.doesNotMatch(text,/sessionStorage\.setItem\s*\(/);
 assert.doesNotMatch(text,/console\.log\s*\([^\n]*\b(?:token|data\.opportunity|data\.sources)\b/);
});

test('P0 designated GET endpoints preserve every stored row and SQLite change counter',async()=>{
 const f=setup();try{
  for(const file of ['0020_prospect_memory_e2.sql','0021_signal_evaluation_queue.sql'])f.sql.exec(readFileSync(new URL('./migrations/'+file,import.meta.url),'utf8'));
  seedMemory(f.sql,'read-only-queue-prospect',workspace);
  const queue=signalEvaluationQueueLocal(f.sql,{syntheticOnly:true});
  assert.equal(queue.memory.admit(memoryEvent('readonly-event',undefined,{workspace_id:workspace,profile_id:'read-only-queue-prospect'}),{now:memoryNow}).code,'ADMITTED');
  queue.setContext(workspace,'read-only-queue-prospect',{population:'DISTRICT_SIGNAL',workflowOwner:'AGENCYZOOM'},{now:memoryNow,requestId:'read-context',authority:{actor:'synthetic-test',reference:'local-mandate'}});
  const p=generateCommandCenterFixturePackage({runId,workspaceId:workspace,head,now:new Date('2026-10-12T22:00:00Z')});
  f.sql.exec(p.sql);
  const snapshot=()=>Object.fromEntries(f.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({name})=>[name,f.sql.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'"').all().map(r=>JSON.stringify(r)).sort()]));
  const id=p.fixtures.review_pending;
  for(const route of ['producer-work','producer-command-center','producer-detail?id='+id,'prospect-360?id='+id,'producer-approval-preflight?ids='+id,'profile?id='+id,'record?id='+id,'next-best-action?id='+id,'fiv-calibration','priority-calibration','acquisition-summary','economics-summary']){
   const before=snapshot(),changes=f.sql.prepare('SELECT total_changes() n').get().n;
   const c3=signalCurrentDecisionLocal(f.sql,{syntheticOnly:true}).current(workspace,'read-only-queue-prospect',{now:memoryNow});assert.equal(c3.status,'PENDING');
   const response=await f.api(route);assert.equal(response.status,200,route+': '+JSON.stringify(response.body));
   assert.deepEqual(snapshot(),before,route+' mutated stored rows');
   assert.equal(f.sql.prepare('SELECT total_changes() n').get().n,changes,route+' executed a write');
  }
 }finally{f.sql.close()}
});
