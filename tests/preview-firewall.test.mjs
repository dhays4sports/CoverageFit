import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {previewFirewall,TEST_DATABASE_ID,TEST_WORKSPACE} from '../server/preview-firewall.mjs';
test('preview cannot invoke adapters or use unmarked/production storage',async()=>{
  const sql=new DatabaseSync(':memory:');
  const db={prepare:q=>({first:async()=>sql.prepare(q).get()})};
  const env={COVERAGEFIT_DB:db,BUYER_STAGING_ISOLATED:'1',COVERAGEFIT_SOLO_WORKSPACE_ID:TEST_WORKSPACE};
  let calls=0;
  const run=(path,method='GET',extra={})=>previewFirewall({request:new Request('https://12345678.coveragefit.pages.dev'+path,{method}),env:{...env,...extra},next:()=>{calls++;return new Response('accepted')}});
  assert.equal((await run('/api/distribution/presentation')).status,503);
  sql.exec('CREATE TABLE distribution_preview_identity(singleton INTEGER PRIMARY KEY,database_id TEXT,traffic_class TEXT)');
  sql.prepare('INSERT INTO distribution_preview_identity VALUES(1,?,?)').run('production','PRODUCTION');
  assert.equal((await run('/api/distribution/presentation')).status,503);
  sql.prepare('UPDATE distribution_preview_identity SET database_id=?,traffic_class=?').run(TEST_DATABASE_ID,'TEST');
  for(const path of ['/api/sms/send','/api/solo-desk/sync','/api/solo-desk/raw-import','/api/solo-desk/continue-action','/api/unknown'])assert.equal((await run(path,'POST')).status,403);
  for(const key of ['RINGCENTRAL_JWT_TOKEN','OPENAI_API_KEY','RESEND_API_KEY','AGENCYZOOM_TOKEN','GOOGLE_CALENDAR_REFRESH_TOKEN','POLICY_FILES'])assert.equal((await run('/api/distribution/interact','POST',{[key]:'test'})).status,503);
  assert.equal(calls,0);
  assert.equal((await run('/api/distribution/interact','POST')).status,200);
  assert.equal((await run('/api/solo-desk/producer-work')).status,200);
  assert.equal(calls,2);sql.close();
});
test('production middleware is a passthrough',async()=>{
  const response=await previewFirewall({request:new Request('https://coveragefit.com/api/sms/send',{method:'POST'}),env:{RINGCENTRAL_JWT_TOKEN:'fixture'},next:()=>new Response('production')});
  assert.equal(await response.text(),'production');
});
