import test from 'node:test';
import assert from 'node:assert/strict';
import {
 handleRingCentralStatus,
 handleRingCentralSubscription,
 handleRingCentralRecovery
} from '../server/ringcentral-sms-connection-core.mjs';

const origin='https://coveragefit-preview.test';
const bearer='synthetic-producer-key-no-real-account';
function fixture(){
 let providerCalls=0,storeWrites=0;
 const env={
  COVERAGEFIT_PRODUCER_ACCESS_TOKEN:bearer,
  RINGCENTRAL_CLIENT_ID:'fake-id',
  RINGCENTRAL_CLIENT_SECRET:'fake-secret',
  RINGCENTRAL_JWT_TOKEN:'fake-jwt',
  RINGCENTRAL_FROM_NUMBER:'+12025550100',
  RINGCENTRAL_CONVERSATION_HASH_SECRET:'fake-preview-identity-secret'
  // Deliberately missing webhook URL and validation token.
 };
 const store={
  async get(){return null},
  async setJSON(){storeWrites++;throw Error('No mutation authorized in config gate')},
  async delete(){storeWrites++;throw Error('No mutation authorized in config gate')}
 };
 const options={env,store,fetchImpl:async()=>{providerCalls++;throw Error('No provider call authorized')},fetch:async()=>{providerCalls++;throw Error('No provider call authorized')}};
 const request=(path,method='GET')=>new Request(origin+path,{method,headers:{Authorization:'Bearer '+bearer,...(method==='POST'?{Origin:origin}:{})}});
 return {options,request,counts:()=>({providerCalls,storeWrites})};
}

test('missing webhook config blocks authenticated subscription creation before provider/write side effects',async()=>{
 const f=fixture();
 const res=await handleRingCentralSubscription(f.request('/api/sms/ringcentral/subscription','POST'),f.options);
 assert.equal(res.status,503);
 const d=await res.json();
 assert.equal(d.error?.code,'ringcentral_not_configured');
 assert.deepEqual(f.counts(),{providerCalls:0,storeWrites:0});
});

test('missing webhook config blocks recovery replay without provider or D1 writes',async()=>{
 const f=fixture();
 const res=await handleRingCentralRecovery(f.request('/api/sms/ringcentral/recovery','POST'),f.options);
 assert.equal(res.status,503);
 const d=await res.json();
 assert.equal(d.error?.code,'ringcentral_not_configured');
 assert.deepEqual(f.counts(),{providerCalls:0,storeWrites:0});
});

test('unauthenticated RingCentral status is denied before account queries and mutations',async()=>{
 const f=fixture();
 const res=await handleRingCentralStatus(new Request(origin+'/api/sms/ringcentral/status'),f.options);
 assert.equal(res.status,401);
 assert.deepEqual(f.counts(),{providerCalls:0,storeWrites:0});
});
