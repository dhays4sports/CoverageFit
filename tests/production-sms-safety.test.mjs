import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCallbackInbound, shouldHandleCallbackInbound} from '../server/sms-callback-scheduling-core.mjs';
import {smsAutomationPaused} from '../server/sms-safety-core.mjs';
const opts = {now: '2026-09-22T22:00:00Z', env: {}};
const active = () => ({callbackScheduling: {status: 'callback_requested'}});
test('uncertain opening hands off; subsequent timing cannot restart automation', async () => {
  let c = active();
  for (const body of ['Maybe I have an appt tomorrow', 'Afternoon', 'Friday am not before ten', 'Text me in am and I will see how my dad is going best I can do', 'Friday']) {
    const r = await handleCallbackInbound(c, body, opts);
    assert.equal(r.reply, ''); c = r.conversation;
    assert.ok(smsAutomationPaused(c));
    assert.notEqual(c.callbackScheduling.status, 'scheduled');
  }
});
test('one clarification then silent producer handoff preserves selected day', async () => {
  const a = await handleCallbackInbound(active(), 'Friday', opts);
  assert.match(a.reply, /time/i);
  assert.equal(a.conversation.callbackScheduling.clarificationCount, 1);
  const b = await handleCallbackInbound(a.conversation, 'Afternoon', opts);
  assert.equal(b.reply, ''); assert.equal(b.handoff, true);
  assert.equal(b.conversation.callbackScheduling.pendingDay.day, 25);
});
test('bounded availability cannot produce endless clarification', async () => {
  const a = await handleCallbackInbound(active(), 'Friday am not before ten', opts);
  const b = await handleCallbackInbound(a.conversation, 'After ten', opts);
  assert.equal(b.handoff, true); assert.equal(b.reply, '');
});
test('text follow-up captures request without creating an appointment', async () => {
  const r = await handleCallbackInbound(active(), 'Text me Friday morning', opts);
  assert.equal(r.handoff, true);
  assert.equal(r.conversation.callbackScheduling.followupRequested, true);
  assert.equal(r.conversation.callbackScheduling.requestedRaw, 'Text me Friday morning');
  assert.equal(r.conversation.callbackScheduling.googleEventId, undefined);
});
test('scheduled acknowledgments remain silent and preserve booking', async () => {
  const c = {callbackScheduling: {status: 'scheduled', googleEventId: 'existing', proposedDisplay: 'Friday at 10 AM'}};
  const r = await handleCallbackInbound(c, 'Thanks', opts);
  assert.equal(r.reply, ''); assert.equal(r.conversation.callbackScheduling.googleEventId, 'existing');
});
test('manual pause beats callback commands and date heuristics', () => {
  const c = {...active(), orchestration: {ownership: {owner: 'producer', reason: 'unregistered_outbound_message'}}};
  for (const body of ['Friday', 'CALLBACK', 'tomorrow at 3', 'yes']) assert.equal(shouldHandleCallbackInbound(c, body, opts), false);
});
test('appointment ownership is not mistaken for a manual pause', () => {
  assert.equal(smsAutomationPaused({state: 'human_takeover', orchestration: {ownership: {owner: 'appointment'}}}), false);
});
import {handleRingCentralWebhook} from '../server/ringcentral-sms-connection-core.mjs';
import {sendSmsThroughGateway, smsLiveConversationId} from '../server/sms-outbound-gateway.mjs';
const env = {RINGCENTRAL_FROM_NUMBER: '+12025550100', RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN: 'test-only-validation', RINGCENTRAL_CONVERSATION_HASH_SECRET: 'test-only-hash-secret-long'};
function memoryStore() {
  const rows = new Map();
  return {rows, async get(k) {return structuredClone(rows.get(k) || null);}, async setJSON(k,v,o={}) {if(o.onlyIfNew&&rows.has(k))throw Error('exists');rows.set(k,structuredClone(v));}, async delete(k){rows.delete(k);}, async list(){return {keys:[]};}};
}
async function webhook(store, direction, body, id) {
  const from = direction === 'Outbound' ? env.RINGCENTRAL_FROM_NUMBER : '+12025550101';
  const to = direction === 'Outbound' ? '+12025550101' : env.RINGCENTRAL_FROM_NUMBER;
  return handleRingCentralWebhook(new Request('https://example.test/api/sms/ringcentral/webhook', {method:'POST', headers:{'Content-Type':'application/json','validation-token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN}, body:JSON.stringify({body:{type:'SMS',direction,id,from:{phoneNumber:from},to:[{phoneNumber:to}],subject:body,creationTime:opts.now}})}), {...opts,env,store, fetch:async()=>{throw Error('Unexpected external call');}});
}
test('real webhook manual reply suppresses subsequent callback routing and STOP still wins', async () => {
  const store = memoryStore();
  const outbound = await webhook(store,'Outbound','I will handle this personally','manual-1');
  assert.equal(outbound.status,200);
  const reply = await webhook(store,'Inbound','Friday','inbound-1');
  const result = await reply.json(); assert.equal(result.routeReason,'automation_paused'); assert.equal(result.replied,false);
  const stop = await webhook(store,'Inbound','STOP','inbound-2');
  const stopped = await stop.json(); assert.equal(stopped.routeReason,'global_stop_command');
});
test('gateway checks stored manual pause even when caller provides older snapshot', async () => {
  const store = memoryStore();
  const id = await smsLiveConversationId('+12025550101',env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET);
  const snapshot = {id, state:'human_takeover', orchestration:{ownership:{owner:'appointment',reason:'callback_scheduling_reply'}}};
  await store.setJSON(`sms-live-conversations/${id}`, {...snapshot, orchestration:{ownership:{owner:'producer',reason:'unregistered_outbound_message'}}});
  await assert.rejects(sendSmsThroughGateway({to:'+12025550101',message:'What time?',origin:'appointment',workflow:'missed_call_callback_v1',replyRoute:'appointment',ownershipEffect:'transfer',ownershipTarget:'appointment',idempotencyKey:'test-stale-snapshot'}, {...opts, env,store,conversationSnapshot:snapshot,fetch:async()=>{throw Error('External delivery must not happen');}}), e=>e.code==='sms_automation_paused');
});
import {queueSmsRetry} from '../server/sms-operations-core.mjs';
test('paused and opted-out delivery never creates a retry job', async () => {
  const store=memoryStore();
  for(const errorCode of ['sms_automation_paused','sms_channel_suppressed']) assert.equal(await queueSmsRetry(store,{errorCode},opts),null);
  assert.equal(store.rows.size,0);
});
test('precise follow-up time continues normal scheduling instead of handoff', async () => {
  const a=await handleCallbackInbound(active(),'Friday',opts);
  const b=await handleCallbackInbound(a.conversation,'10 AM',opts);
  assert.equal(b.handoff,undefined);
  assert.match(b.conversation.callbackScheduling.proposedStart,/2026-09-25T17:00/);
});
import {recoverMissedRingCentralSms, RINGCENTRAL_RECOVERY_CURSOR_KEY} from '../server/ringcentral-webhook-recovery-core.mjs';
const historyRecord=(id,direction,subject,creationTime=opts.now)=>({id,type:'SMS',direction,subject,creationTime,from:{phoneNumber:direction==='Outbound'?env.RINGCENTRAL_FROM_NUMBER:'+12025550101'},to:[{phoneNumber:direction==='Outbound'?'+12025550101':env.RINGCENTRAL_FROM_NUMBER}]});
test('history recovery ingests outbound manual message and subsequent inbound remains silent',async()=>{
 const store=memoryStore();
 const result=await recoverMissedRingCentralSms({...opts,env,store,listHistory:async input=>{
  assert.equal(input.direction,'All');
  return {records:[historyRecord('recover-out','Outbound','I will handle this personally','2026-09-22T21:59:00Z'),historyRecord('recover-in','Inbound','Friday')],hasMore:false};
 },processEvent:async payload=>(await webhook(store,payload.body.direction,payload.body.subject,payload.body.id)).json()});
 assert.equal(result.counts.replayed,2);
 assert.equal((await store.get('sms-live-events/recover-out')).manualTakeover,true);
 assert.equal((await store.get('sms-live-events/recover-in')).routeReason,'automation_paused');
});
test('registered automation recovered from history does not trigger manual takeover',async()=>{
 const store=memoryStore();
 await store.setJSON('sms-outbound-registry/provider/registered-1',{providerMessageId:'registered-1',origin:'appointment',workflow:'missed_call_callback_v1',replyRoute:'appointment',ownershipEffect:'transfer',ownershipTarget:'appointment',status:'sent',businessPhone:env.RINGCENTRAL_FROM_NUMBER,contactPhone:'+12025550101',message:'Your call is booked',registrationId:'test-registration'});
 const result=await webhook(store,'Outbound','Your call is booked','registered-1');
 const response=await result.json();assert.equal(response.registeredOutbound,true);assert.notEqual(response.manualTakeover,true);
});
test('truncated history fails without replay or advancing recovery cursor',async()=>{
 const store=memoryStore();let replayed=0;
 await assert.rejects(recoverMissedRingCentralSms({...opts,env:{...env,RINGCENTRAL_RECOVERY_MAX_MESSAGES:'1'},store,listHistory:async()=>({records:[historyRecord('limited','Outbound','Manual')],hasMore:true}),processEvent:async()=>{replayed++;return {ok:true};}}),/recovery_window_limit/);
 assert.equal(replayed,0); assert.equal((await store.get(RINGCENTRAL_RECOVERY_CURSOR_KEY)).lastRecoveryCompletedThrough,'');
});
test('inbound webhook checkpoint cannot skip older outbound history on upgrade',async()=>{
 const store=memoryStore();await store.setJSON(RINGCENTRAL_RECOVERY_CURSOR_KEY,{lastConfirmedEventAt:opts.now,lastRecoveryCompletedThrough:opts.now});
 let from;
 await recoverMissedRingCentralSms({...opts,env,store,listHistory:async input=>{from=input.dateFrom;return {records:[],hasMore:false};},processEvent:async()=>({ok:true})});
 assert.equal(from,'2026-09-19T22:00:00.000Z');assert.equal((await store.get(RINGCENTRAL_RECOVERY_CURSOR_KEY)).historyDirections,'both');
});
