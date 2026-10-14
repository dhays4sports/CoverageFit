import test from 'node:test';
import assert from 'node:assert/strict';
import {projectRingCentralReadiness} from '../scripts/phase3-ringcentral-readiness.mjs';
const base=()=>({
 ok:true,status:{
  outboundConfigured:true,webhookConfigured:true,senderReady:true,connected:true,
  connectionState:'subscription_healthy',environment:'production',
  subscriptionHealth:{state:'healthy',active:true},
  missing:[],missingWebhook:[],
  recovery:{lastRecoveryStatus:'complete',rawMessages:[{phone:'+14155550123',body:'private'}]},
  maintenance:{status:'ok',internalSecret:'dont-log'},
  fromNumber:'+14155550123',webhookUrl:'https://private.example/with-secret',
  subscription:{id:'secret-provider-id',authorization:'bearer'},
  secret:'raw-credential'
 }
});
test('Phase 3 status projector returns only allowlisted non-sensitive fields',()=>{
 const report=projectRingCentralReadiness(base());
 assert.equal(report.readiness,'READY_FOR_SEPARATELY_AUTHORIZED_CANARY');
 assert.equal(report.connected,true);assert.equal(report.provider_environment,'production');
 for(const term of ['14155550123','private.example','dont-log','secret-provider-id','raw-credential','private'])
  assert.equal(JSON.stringify(report).includes(term),false);
 assert.deepEqual(report.missing_config_keys,[]);
});
test('missing webhook keys produce configuration blocker without leaking values',()=>{
 const x=base();
 x.status.connected=false;x.status.webhookConfigured=false;
 x.status.missing=['RINGCENTRAL_WEBHOOK_URL','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN','Bearer abc', '__proto__'];
 x.status.missingWebhook=['RINGCENTRAL_WEBHOOK_URL','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN'];
 x.status.connectionState='sender_ready_webhook_unconfigured';
 const report=projectRingCentralReadiness(x);
 assert.equal(report.readiness,'CONFIGURATION_BLOCKED');
 assert.equal(report.connection_state,'sender_ready_webhook_unconfigured');
 assert.deepEqual(report.missing_config_keys,['RINGCENTRAL_WEBHOOK_URL','RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN']);
 assert.equal(JSON.stringify(report).includes('Bearer abc'),false);
});
test('healthy sender alone is not proof of active inbound subscription',()=>{
 const x=base();x.status.connected=false;x.status.subscriptionHealth.active=false;
 x.status.subscriptionHealth.state='missing';
 const report=projectRingCentralReadiness(x);
 assert.equal(report.readiness,'SUBSCRIPTION_OR_WEBHOOK_NOT_CERTIFIED');
 assert.equal(report.subscription_active,false);
});
test('sender not ready and missing outbound configuration stay blocked',()=>{
 const x=base();x.status.connected=false;x.status.senderReady=false;x.status.outboundConfigured=false;
 x.status.missing=['RINGCENTRAL_FROM_NUMBER'];x.status.connectionState='outbound_configuration_required';
 const report=projectRingCentralReadiness(x);
 assert.equal(report.readiness,'CONFIGURATION_BLOCKED');
 assert.equal(report.sender_ready,false);
});
test('API failures and untrusted labels do not become trusted status or raw log output',()=>{
 for(const b of [null,{}, {ok:false,status:base().status},{ok:true,status:null}])
  assert.throws(()=>projectRingCentralReadiness(b),/status_response_not_verified/);
 const x=base();x.status.connected=false;x.status.senderReady=false;x.status.error={code:'<secret>\nBearer 123',message:'private key'};
 x.status.connectionState='unsafe state <script>';
 const report=projectRingCentralReadiness(x);
 assert.equal(report.connection_state,'unknown');
 assert.equal(report.provider_error_code,'unknown');
 assert.equal(JSON.stringify(report).includes('private key'),false);
});
