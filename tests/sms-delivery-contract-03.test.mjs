// Characterization, including explicitly named gaps. All HTTP is synthetic/injected.
// A passing GAP test proves a missing guarantee, not acceptance for live delivery.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sendSmsThroughGateway,smsLiveConversationId,resolveOutboundRegistration,markOutboundRegistrationWebhookSeen} from '../server/sms-outbound-gateway.mjs';
import {clearRingCentralTokenCache} from '../server/ringcentral-client.mjs';
import {smsPermissionSnapshot} from '../server/sms-consent-core.mjs';
import {queueSmsRetry} from '../server/sms-operations-core.mjs';
import {handleRingCentralWebhook} from '../server/ringcentral-sms-connection-core.mjs';
const NOW='2026-10-16T16:00:00.000Z';
const env={RINGCENTRAL_FROM_NUMBER:'+12025550100',RINGCENTRAL_CONVERSATION_HASH_SECRET:'synthetic-only-long-hash-secret',RINGCENTRAL_CLIENT_ID:'fictional-client',RINGCENTRAL_CLIENT_SECRET:'fictional-secret',RINGCENTRAL_JWT_TOKEN:'fictional-jwt',RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN:'fictional-validation'};
const descriptor={to:'+12025550101',message:'Synthetic assistance request',origin:'appointment',workflow:'synthetic_callback',replyRoute:'appointment',ownershipEffect:'transfer',ownershipTarget:'appointment',idempotencyKey:'synthetic-action-1'};
function memory(initial=[]){const rows=new Map(initial);return {rows,async get(k){return structuredClone(rows.get(k)||null)},async setJSON(k,v,o={}){if(o.onlyIfNew&&rows.has(k))throw Error('unique_conflict');rows.set(k,structuredClone(v))},async delete(k){rows.delete(k)},async list(){return {blobs:[]}}};}
async function fixture(){
 clearRingCentralTokenCache();const store=memory();let submitted=0;
 const cid=await smsLiveConversationId(descriptor.to,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET),ckey='sms-live-conversations/'+cid;
 const options={env,store,now:NOW,fetchImpl:async(url)=>{if(url.endsWith('/oauth/token'))return Response.json({access_token:'fictional-token',expires_in:3600});if(url.endsWith('/sms')){submitted++;return f.provider()}throw Error('unexpected_stub_request:'+url)}};
 const f={store,options,ckey,cid,count:()=>submitted,provider:async()=>Response.json({id:'synthetic-provider-1'}),send:(patch={})=>sendSmsThroughGateway({...descriptor,...patch},options),rows:prefix=>[...store.rows].filter(([k])=>k.startsWith(prefix)).map(([,v])=>v)};
 return f;
}
const idem=f=>f.rows('sms-outbound-idempotency/');
const fingerprint=f=>f.rows('sms-outbound-registry/fingerprint/');
const outbound=(status,id='synthetic-provider-1',at=NOW)=>new Request('https://synthetic.test/api/sms/ringcentral/webhook',{method:'POST',headers:{'Content-Type':'application/json','validation-token':env.RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN},body:JSON.stringify({body:{id,type:'SMS',direction:'Outbound',from:{phoneNumber:env.RINGCENTRAL_FROM_NUMBER},to:[{phoneNumber:descriptor.to}],subject:descriptor.message,creationTime:at,messageStatus:status}})});

test('0.3 GAP: acceptance then response loss is recorded failed and a new key can duplicate submission',async()=>{
 const f=await fixture();let accepted=0;f.provider=async()=>{accepted++;throw Error('response_lost_after_acceptance')};
 await assert.rejects(f.send(),e=>e.code==='ringcentral_api_unreachable');assert.equal(accepted,1);assert.equal(idem(f)[0].status,'failed');assert.equal(fingerprint(f)[0].status,'failed');
 await assert.rejects(f.send(),e=>e.code==='idempotency_key_failed');assert.equal(f.count(),1);
 f.provider=async()=>{accepted++;return Response.json({id:'synthetic-second'})};await f.send({idempotencyKey:'synthetic-action-2'});assert.equal(accepted,2);
});
test('0.3 GAP: unknown timeout and explicit pre-acceptance rejection share failed state',async()=>{
 for(const uncertain of [true,false]){const f=await fixture();f.provider=async()=>{if(uncertain)throw Error('timeout_unknown');return Response.json({errorCode:'synthetic_rejected',message:'Not accepted'},{status:400})};await assert.rejects(f.send());assert.equal(idem(f)[0].status,'failed');assert.equal(f.count(),1)}
});
test('0.3 same-key concurrent claims and repeated completion use one injected provider call',async()=>{
 const f=await fixture();const results=await Promise.allSettled([f.send(),f.send()]);assert.equal(f.count(),1);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await f.send()).deduped,true);assert.equal(f.count(),1);
});
test('0.3 GAP: idempotency does not bind message contents or workflow/context revision',async()=>{
 const f=await fixture();const a=await f.send();const b=await f.send({message:'Different content',workflow:'different_workflow',profileRevision:999});assert.equal(b.deduped,true);assert.equal(a.providerMessageId,b.providerMessageId);assert.equal(f.count(),1);
});
test('0.3 GAP: same content with new legitimate workflow/key submits again after prior sent',async()=>{
 const f=await fixture();await f.send();f.provider=async()=>Response.json({id:'synthetic-provider-2'});await f.send({idempotencyKey:'different-workflow-2',workflow:'synthetic_quote'});assert.equal(f.count(),2);assert.equal(idem(f).length,2);
});
test('0.3 GAP: gateway ignores stale canonical revision fields during provider submission',async()=>{
 const f=await fixture();await f.store.setJSON(f.ckey,{id:f.cid,signal:{revision:2},state:'new'});await f.send({profileRevision:1,contextVersion:'old'});assert.equal(f.count(),1);
});
test('0.3 STOP, provider opt-out and takeover before provider submission are denied',async()=>{
 for(const c of [{state:'opted_out'},{smsConsent:{status:'active',providerStatus:'opted_out'}},{orchestration:{ownership:{owner:'producer',reason:'producer_took_ownership'}}}]){
  const f=await fixture();await f.store.setJSON(f.ckey,{id:f.cid,...c});await assert.rejects(f.send(),e=>['sms_channel_suppressed','sms_automation_paused'].includes(e.code));assert.equal(f.count(),0);
 }
});
test('0.3 STOP arriving in flight survives completion but cannot unsend accepted request',async()=>{
 const f=await fixture();f.provider=async()=>{await f.store.setJSON(f.ckey,{id:f.cid,state:'opted_out',smsConsent:{status:'opted_out'},orchestration:{channel:{status:'opted_out'},automationMode:'suppressed'}});return Response.json({id:'synthetic-provider-1'})};
 await f.send();assert.equal(f.count(),1);const c=await f.store.get(f.ckey);assert.equal(c.state,'opted_out');assert.equal(smsPermissionSnapshot(c).allowed,false);await assert.rejects(f.send({idempotencyKey:'future-action'}));assert.equal(f.count(),1);
});
test('0.3 provider suppression written after fingerprint approval is reloaded before submission',async()=>{
 const f=await fixture(),set=f.store.setJSON;f.store.setJSON=async(k,v,o)=>{await set(k,v,o);if(k.startsWith('sms-outbound-registry/fingerprint/'))await set(f.ckey,{id:f.cid,smsConsent:{providerStatus:'blocked'}})};
 await assert.rejects(f.send(),e=>e.code==='sms_channel_suppressed');assert.equal(f.count(),0);
});
test('0.3 GAP: legacy unsuppressed consent has no affirmative source/campaign authorization',async()=>{
 const p=smsPermissionSnapshot({}, {occurredAt:NOW});assert.equal(p.allowed,true);assert.equal(p.consent.source,'legacy');assert.equal(p.consent.optedInAt,'');assert.equal(p.providerStatus,'unknown');
 const f=await fixture();await f.send({sourceType:'purchased',campaignPermission:false});assert.equal(f.count(),1); // ignored extra fields: NOT authorization to use this route
});
test('0.3 process interruption after provider ID leaves processing lock; restart same key fails closed',async()=>{
 const f=await fixture(),set=f.store.setJSON;f.store.setJSON=async(k,v,o)=>{if(k.startsWith('sms-outbound-registry/provider/'))throw Error('injected_storage_failure');return set(k,v,o)};
 await assert.rejects(f.send(),/injected_storage_failure/);assert.equal(f.count(),1);assert.equal(idem(f)[0].status,'processing');assert.equal(fingerprint(f)[0].status,'pending');
 const reopened=memory(JSON.parse(JSON.stringify([...f.store.rows])));await assert.rejects(sendSmsThroughGateway(descriptor,{...f.options,store:reopened}),e=>e.code==='sms_send_in_progress');assert.equal(f.count(),1);
});
test('0.3 GAP: expired unresolved fingerprint allows new key after processing interruption',async()=>{
 const f=await fixture(),set=f.store.setJSON;f.store.setJSON=async(k,v,o)=>{if(k.startsWith('sms-outbound-registry/provider/'))throw Error('crash');return set(k,v,o)};await assert.rejects(f.send());f.store.setJSON=set;f.options.now='2026-10-16T16:11:00.000Z';
 f.provider=async()=>Response.json({id:'synthetic-late-2'});await f.send({idempotencyKey:'fresh-after-crash'});assert.equal(f.count(),2);assert.equal(idem(f).filter(x=>x.status==='processing').length,1);
});
test('0.3 GAP: explicit registration reconciliation does not release original processing identity',async()=>{
 const f=await fixture(),set=f.store.setJSON;f.store.setJSON=async(k,v,o)=>{if(k.startsWith('sms-outbound-registry/provider/'))throw Error('crash');return set(k,v,o)};await assert.rejects(f.send());f.store.setJSON=set;
 const reg=await resolveOutboundRegistration(f.store,{businessPhone:env.RINGCENTRAL_FROM_NUMBER,contactPhone:descriptor.to,message:descriptor.message,occurredAt:NOW},{now:NOW});assert.equal(reg.matchedBy,'fingerprint');
 await markOutboundRegistrationWebhookSeen(f.store,reg,'synthetic-provider-1',NOW);assert.equal((await resolveOutboundRegistration(f.store,{providerMessageId:'synthetic-provider-1'})).status,'sent');assert.equal(idem(f)[0].status,'processing');await assert.rejects(f.send(),e=>e.code==='sms_send_in_progress');assert.equal(f.count(),1);
});
test('0.3 GAP: failed fingerprint cannot associate late accepted provider response',async()=>{
 const f=await fixture();f.provider=async()=>{throw Error('unknown')};await assert.rejects(f.send());assert.equal(await resolveOutboundRegistration(f.store,{businessPhone:env.RINGCENTRAL_FROM_NUMBER,contactPhone:descriptor.to,message:descriptor.message,occurredAt:NOW},{now:NOW}),null);
 const job=await queueSmsRetry(f.store,{to:descriptor.to,body:descriptor.message,errorCode:'ringcentral_api_unreachable'},{now:NOW});assert.equal(job.status,'pending'); // retry admission has no unknown-outcome exclusion
});
test('0.3 GAP: webhook dedups same message ID and does not reduce conflicting delivery statuses',async()=>{
 const f=await fixture();await f.send();const options={...f.options,fetchImpl:async()=>{throw Error('unexpected_network')},fetch:async()=>{throw Error('unexpected_network')}};
 const first=await (await handleRingCentralWebhook(outbound('SendingFailed'),options)).json();assert.equal(first.registeredOutbound,true);
 for(const [status,at] of [['Delivered','2026-10-16T16:01:00Z'],['DeliveryFailed','2026-10-16T15:59:00Z']]){const r=await (await handleRingCentralWebhook(outbound(status,undefined,at),options)).json();assert.equal(r.deduped,true)}
 const reg=await resolveOutboundRegistration(f.store,{providerMessageId:'synthetic-provider-1'});assert.equal(reg.status,'sent');assert.equal(reg.messageStatus,undefined);assert.equal(f.count(),1);
});

test('0.3 GAP: different keys race past non-atomic fingerprint get/set',async()=>{
 const f=await fixture(),get=f.store.get;let reads=0,release;const barrier=new Promise(r=>release=r);
 f.store.get=async k=>{const value=await get(k);if(k.startsWith('sms-outbound-registry/fingerprint/')&&reads<2){if(++reads===2)release();await barrier}return value};
 let accepted=0;f.provider=async()=>Response.json({id:'synthetic-race-'+(++accepted)});
 const results=await Promise.allSettled([f.send(),f.send({idempotencyKey:'synthetic-race-2'})]);assert.equal(accepted,2);assert.equal(results.filter(x=>x.status==='fulfilled').length,2);
});
test('0.3 producer takeover written during provider call remains paused after completion',async()=>{
 const f=await fixture();f.provider=async()=>{await f.store.setJSON(f.ckey,{id:f.cid,state:'human_takeover',orchestration:{ownership:{owner:'producer',reason:'producer_took_ownership'},automationMode:'human_only'}});return Response.json({id:'synthetic-provider-1'})};await f.send();
 const c=await f.store.get(f.ckey);assert.equal(c.orchestration.ownership.owner,'producer');assert.equal(c.state,'human_takeover');await assert.rejects(f.send({idempotencyKey:'after-takeover'}));assert.equal(f.count(),1);
});
test('0.3 GAP: successful HTTP response with ID is stored sent without reducing messageStatus',async()=>{
 const f=await fixture();f.provider=async()=>Response.json({id:'synthetic-provider-1',messageStatus:'SendingFailed'});const sent=await f.send();assert.equal(sent.ok,true);assert.equal(sent.registration.status,'sent');assert.equal(idem(f)[0].status,'sent');
});
