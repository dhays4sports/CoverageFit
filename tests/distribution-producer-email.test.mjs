import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDistributionProducerEmail,
  distributionProducerEmailConfig,
  sendDistributionProducerEmail
} from '../server/distribution-producer-email.mjs';

const event = () => ({
  journeyId:'pvxj_0123456789abcdef0123456789abcdef',
  opportunityId:'opp_src_0123456789abcdef0123456789abcdef',
  entry:'tech',
  requestedMode:'call'
});
const enabledEnv = () => ({
  COVERAGEFIT_DISTRIBUTION_LEAD_EMAIL_ENABLED:'1',
  RESEND_API_KEY:'synthetic-resend-test-key',
  COVERAGEFIT_PRODUCER_NOTIFICATION_EMAIL:'producer@example.com',
  COVERAGEFIT_NOTIFICATION_FROM:'CoverageFit <alerts@coveragefit.com>',
  COVERAGEFIT_SITE_URL:'https://coveragefit.com'
});
function store() {
  const entries = new Map();
  return {
    entries,
    async get(key) { return entries.get(key) || null; },
    async setJSON(key, value, options = {}) {
      if (options.onlyIfNew && entries.has(key)) throw new Error('duplicate');
      entries.set(key, structuredClone(value));
    }
  };
}

test('email alerts stay disabled without explicit activation', async () => {
  let fetchCalls=0;
  const data=store();
  const result=await sendDistributionProducerEmail(event(), {
    env:{}, store:data,
    fetch:async () => { fetchCalls++; throw new Error('must not call'); }
  });
  assert.deepEqual(result,{status:'skipped',reason:'disabled'});
  assert.equal(fetchCalls,0);
  assert.equal(data.entries.size,0);
});

test('sender and recipient must be configured before any network call or durable marker', async () => {
  let fetchCalls=0;
  const data=store();
  const result=await sendDistributionProducerEmail(event(), {
    env:{COVERAGEFIT_DISTRIBUTION_LEAD_EMAIL_ENABLED:'1'},store:data,
    fetch:async () => { fetchCalls++; throw new Error('must not call'); }
  });
  assert.equal(result.status,'skipped');
  assert.equal(result.reason,'not_configured');
  assert.equal(fetchCalls,0);
  assert.equal(data.entries.size,0);
});

test('producer alert points to actual authenticated Workspace record and omits prospect PII', () => {
  const config=distributionProducerEmailConfig(enabledEnv());
  const email=buildDistributionProducerEmail(event(),config);
  assert.equal(email.subject,'New 408FARMERS lead — Technology');
  assert.match(email.plain,/Preferred response: Personal call/);
  assert.match(email.destination,/^https:\/\/coveragefit\.com\/agent\/workspace\/\?area=work&opportunity_id=opp_src_/);
  assert.doesNotMatch(email.plain,/Michael|4088262465|Solo Desk/i);
  assert.match(email.html,/Open in Producer Workspace/);
});

test('successful provider acceptance records a durable receipt and cannot send twice', async () => {
  const data=store(), calls=[];
  const fetcher=async (url,request) => {
    calls.push({url,request,body:JSON.parse(request.body)});
    return new Response(JSON.stringify({id:'re_synthetic_001'}),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const options={env:enabledEnv(),store:data,fetch:fetcher,now:'2026-10-07T20:10:00.000Z'};
  const first=await sendDistributionProducerEmail(event(),options);
  assert.equal(first.status,'sent');
  assert.equal(first.providerStatus,200);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://api.resend.com/emails');
  assert.deepEqual(calls[0].body.to,['producer@example.com']);
  assert.match(calls[0].body.text,/agent\/workspace\/\?area=work&opportunity_id=opp_src_/);
  assert.doesNotMatch(JSON.stringify(calls[0].body),/Michael|4088262465/);
  assert.match(calls[0].request.headers['Idempotency-Key'],/^coveragefit-distribution-lead-/);
  const again=await sendDistributionProducerEmail(event(),options);
  assert.equal(again.status,'deduplicated');
  assert.equal(again.recordedStatus,'sent');
  assert.equal(data.entries.size,1);
  assert.equal([...data.entries.values()][0].status,'sent');
  assert.equal(calls.length,1);
});

test('provider failure is saved without silently resending on a duplicate handoff', async () => {
  const data=store();let calls=0;
  const options={
    env:enabledEnv(),store:data,
    fetch:async()=>{calls++;return new Response('unavailable',{status:503});}
  };
  const first=await sendDistributionProducerEmail(event(),options);
  assert.equal(first.status,'failed');
  assert.equal(first.reason,'provider_rejected');
  assert.equal([...data.entries.values()][0].providerStatus,503);
  const repeat=await sendDistributionProducerEmail(event(),options);
  assert.equal(repeat.status,'deduplicated');
  assert.equal(repeat.recordedStatus,'failed');
  assert.equal(calls,1);
});

test('invalid or unlinked opportunities never trigger outbound email', async () => {
  let calls=0;
  const data=store();
  const result=await sendDistributionProducerEmail({...event(),opportunityId:''},{
    env:enabledEnv(),store:data,fetch:async()=>{calls++;throw new Error('unexpected');}
  });
  assert.equal(result.status,'skipped');
  assert.equal(result.reason,'invalid_opportunity');
  assert.equal(data.entries.size,0);
  assert.equal(calls,0);
});
