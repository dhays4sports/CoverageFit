import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSignalDecision} from '../server/signal-decision-core.mjs';
import {handleSmsSignal} from '../server/sms-signal-api.mjs';
import {signalInbound} from '../server/sms-signal-service.mjs';
const body={schemaVersion:'1.0',signalSessionId:'signal_abcdefghijklmnop',flowId:'qa_flow',flowVersion:'1.0',canonicalSignals:{product:'life'},attribution:{source:'qa'}};
const request=payload=>new Request('https://preview.test/api/signal/decision',{method:'POST',headers:{origin:'https://408farmers.com','content-type':'application/json'},body:JSON.stringify(payload)});
test('anonymous decision stays stateless and unchanged when SMS flag is enabled',async()=>{
 const store={setJSON(){throw Error('Anonymous decision must not persist contact data');}};
 const off=await handleSignalDecision(request(body),{env:{},store,now:new Date('2026-09-24T12:00:00Z')});
 const on=await handleSignalDecision(request(body),{env:{CF_SMS_SIGNAL_ENABLED:'1'},store,now:new Date('2026-09-24T12:00:00Z')});
 assert.equal(off.status,200);assert.equal(on.status,200);assert.deepEqual(await off.json(),await on.json());
 const pii=await handleSignalDecision(request({...body,phone:'+12025550101'}),{env:{CF_SMS_SIGNAL_ENABLED:'1'},store,now:new Date('2026-09-24T12:00:00Z')});assert.ok(pii.status>=400);
});
test('SMS remains protected and opt-in while anonymous route coexists',async()=>{
 const r=await handleSmsSignal(new Request('https://preview.test/api/sms/signal'),{env:{COVERAGEFIT_PRODUCER_ACCESS_TOKEN:'synthetic-producer-key-at-least-24'}});assert.equal(r.status,401);
 const result=await signalInbound({}, {body:'Yes',messageId:'synthetic',occurredAt:'2026-09-24T12:00:00Z'},{env:{},store:{get(){throw Error('Disabled SMS must not read live state');}}});assert.equal(result,null);
});
