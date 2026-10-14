import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {generatePreviewFixturePackage} from '../scripts/prepare-producer-action-preview-fixtures.mjs';
import {certifySnapshots,CERT_CASES,validateManifest} from '../scripts/certify-producer-action-preview.mjs';
import {producerWorkspace} from '../server/producer-workspace.mjs';
import {soloRepository} from '../server/solo-desk-repository.mjs';

const head='a'.repeat(40),runId='qa-preview-validation-20261012',workspace='qa-preview';
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())
  sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const db={prepare(q){let args=[];const stmt={bind(...v){args=v;return stmt},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return stmt},async batch(stmts){sql.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};
 const repo=soloRepository(db,{workspace,actor:'qa'});
 const env={COVERAGEFIT_DB:db,COVERAGEFIT_SOLO_WORKSPACE_ID:workspace,CF_ATTENTION_ENABLED:'1',CF_SMS_SIGNAL_ENABLED:'0',CF_AI_ENABLED:'0'};
 return {sql,repo,work:producerWorkspace(repo,env)};
}
test('fixture builder creates exactly nine unique fictional records with replay-safe SQL',()=>{
 const p=generatePreviewFixturePackage({runId,workspaceId:workspace,head});
 assert.equal(Object.keys(p.fixtures).length,Object.keys(CERT_CASES).length);
 assert.equal(new Set(Object.values(p.fixtures)).size,9);
 assert.deepEqual(validateManifest(p.manifest,{expectedHead:head,attestedHead:head,isolationConfirmed:'1'}),p.fixtures);
 assert.doesNotMatch(p.sql,/BEGIN TRANSACTION|\bDELETE FROM\b|\bUPDATE\s+\w+\s+SET\b/i);
 assert.doesNotMatch(p.sql,/\+1\d{10}|@gmail\.com|@farmersagency\.com/);
 assert.ok(p.sql.includes("ON CONFLICT DO NOTHING"));
});
test('all generated D1 fixture SQL parses against real migrations; rerun does not create duplicates',()=>{
 const f=setup();
 try{
  const p=generatePreviewFixturePackage({runId,workspaceId:workspace,head});
  f.sql.exec(p.sql);
  const count=()=>f.sql.prepare("SELECT COUNT(*) n FROM cf_solo_opportunities WHERE workspace_id=? AND source='preview_certification'").get(workspace).n;
  assert.equal(count(),9);
  f.sql.exec(p.sql);
  assert.equal(count(),9);
  assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM cf_solo_sources WHERE kind='preview_cert_fixture_v1'").get().n,9);
  const pilot=f.sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='district_pilot_v1'").all().map(x=>JSON.parse(x.summary_json));
  assert.equal(pilot.filter(x=>x.pilot_phase==='TEST').length,1);
  assert.equal(pilot.filter(x=>x.cohort==='CONTROL').length,1);
  assert.ok(pilot.every(x=>x.source_lead_key.startsWith('synthetic:')));
 }finally{f.sql.close()}
});
test('real producer-workspace list/detail and synthetic fixture runner agree on all nine cases',async()=>{
 const f=setup();
 try{
  const p=generatePreviewFixturePackage({runId,workspaceId:workspace,head});
  f.sql.exec(p.sql);
  // Fixture ingestion explicitly materializes scores; GET no longer warms the cache.
  for(const id of Object.values(p.fixtures))await f.repo.refreshOpportunityPriority(id);
  const details={};
  for(const [kind,id] of Object.entries(p.fixtures))details[kind]=await f.work.detail(id);
  const list=await f.work.list(new URLSearchParams({population:'ALL',status:'all',sort:'recommended'}));
  assert.equal(list.test_excluded,1);
  assert.equal(list.records.length,8);
  const report=certifySnapshots({manifest:p.manifest,work:list,details});
  assert.equal(report.status,'PASS',JSON.stringify(report.failures));
  assert.equal(report.checked,9);
  assert.ok(details.ask_one_question.actionQuality.evidence.some(e=>e.kind==='signal_decision_2'));
  assert.equal(details.control.actionQuality,null);
  assert.equal(details.test_excluded.actionQuality,null);
 }finally{f.sql.close()}
});
test('generated manifest is rejected without independently attested isolation',()=>{
 const p=generatePreviewFixturePackage({runId,workspaceId:workspace,head});
 assert.throws(()=>validateManifest(p.manifest,{expectedHead:head,attestedHead:head,isolationConfirmed:'0'}),/preview_isolation_not_verified/);
});
test('invalid workspace/run/head are rejected before any SQL can be produced',()=>{
 for(const cfg of [
  {runId:'bad',workspaceId:workspace,head},
  {runId,workspaceId:'prod;DROP TABLE x',head},
  {runId,workspaceId:workspace,head:'ad9fd5e'}
 ])assert.throws(()=>generatePreviewFixturePackage(cfg),/invalid_/);
});
