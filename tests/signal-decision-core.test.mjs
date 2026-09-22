import assert from 'node:assert/strict';
import {deriveSignalDecision,handleSignalDecision,normalizeSignalDecisionInput,SIGNAL_DECISION_BUILD} from '../server/signal-decision-core.mjs';

const NOW=new Date('2026-09-20T20:00:00Z');
const base=canonicalSignals=>({
  schemaVersion:'1.0',
  signalSessionId:'signal_abcdefghijklmnop',
  flowId:'qa_flow',
  flowVersion:'1.0',
  canonicalSignals,
  attribution:{source:'qa',campaignId:'signal_qa'}
});

function decision(signals){return deriveSignalDecision(base(signals),NOW);}

{
  const result=decision({product:'life'});
  assert.equal(result.public.decision,'ASK_ONE_SIGNAL');
  assert.equal(result.public.nextQuestionId,'life_coverage_status');
  assert.equal(result.public.missingDimension,'need');
}

{
  const result=decision({product:'home'});
  assert.equal(result.public.nextQuestionId,'home_trigger');
  assert.equal(result.public.missingDimension,'need');
}

{
  const result=decision({product:'auto'});
  assert.equal(result.public.nextQuestionId,'auto_trigger');
  assert.equal(result.public.missingDimension,'need');
}

{
  const result=decision({product:'business'});
  assert.equal(result.public.nextQuestionId,'business_trigger');
  assert.equal(result.public.missingDimension,'need');
}

{
  const result=decision({product:'life',lifeCoverageStatus:'employer_only'});
  assert.equal(result.public.decision,'ASK_ONE_SIGNAL');
  assert.equal(result.public.nextQuestionId,'life_shopping_intent');
  assert.equal(result.public.missingDimension,'intent');
  assert.equal(result.internal.priority.dimensions.intent.status,'unknown');
}

{
  const result=decision({product:'life',lifeCoverageStatus:'employer_only',shoppingIntent:'open_to_review'});
  assert.equal(result.public.decision,'ASK_ONE_SIGNAL');
  assert.equal(result.public.nextQuestionId,'life_decision_timing');
  assert.equal(result.public.missingDimension,'timing');
}

{
  const result=decision({product:'life',lifeCoverageStatus:'employer_only',shoppingIntent:'open_to_review',decisionTiming:'within_30'});
  assert.equal(result.public.decision,'OFFER_HUMAN');
  assert.equal(result.public.state,'qualified_signal');
  assert.equal(result.internal.priority.queue,'quick_play');
  assert.equal(result.internal.priority.score,78);
  assert.equal('score' in result.public,false);
  assert.equal('queue' in result.public,false);
  assert.equal('dimensions' in result.public,false);
}

{
  const result=decision({product:'life',lifeCoverageStatus:'none',shoppingIntent:'ready_now',decisionTiming:'now'});
  assert.equal(result.public.decision,'OFFER_HUMAN');
  assert.equal(result.internal.priority.queue,'shoot_now');
  assert.equal(result.internal.priority.score,90);
}

{
  const result=decision({product:'life',lifeCoverageStatus:'yes_personal',shoppingIntent:'open_to_review',decisionTiming:'within_30'});
  assert.equal(result.public.decision,'ASK_ONE_SIGNAL');
  assert.equal(result.public.nextQuestionId,'life_protection_goal');
  assert.equal(result.public.missingDimension,'need');
}

{
  const result=decision({product:'life',lifeCoverageStatus:'none',shoppingIntent:'researching',decisionTiming:'future'});
  assert.equal(result.public.decision,'OFFER_LEARN');
  assert.deepEqual(result.public.publicExperience.actions,['learn_first','continue_later','talk_anyway']);
}

{
  const result=decision({product:'home',reviewReason:'nonrenewal_notice',shoppingIntent:'ready_now',decisionTiming:'within_14'});
  assert.equal(result.public.decision,'OFFER_HUMAN');
  assert.equal(result.internal.priority.queue,'shoot_now');
  assert.equal(result.internal.priority.score,90);
}

{
  const result=decision({product:'home',reviewReason:'nonrenewal_notice',shoppingIntent:'not_interested'});
  assert.equal(result.public.decision,'CONTINUE_LATER');
}

{
  const result=decision({product:'auto',autoNeed:'new_vehicle',shoppingIntent:'open_to_review',decisionTiming:'days_31_60'});
  assert.equal(result.public.decision,'OFFER_HUMAN');
  assert.equal(result.internal.priority.queue,'quick_play');
  assert.equal(result.internal.priority.score,71);
}

{
  const result=decision({product:'auto',autoNeed:'need_now',shoppingIntent:'ready_now',decisionTiming:'now'});
  assert.equal(result.public.decision,'OFFER_HUMAN');
  assert.equal(result.internal.priority.queue,'shoot_now');
  assert.equal(result.internal.priority.score,87);
}

{
  const result=decision({product:'business',businessNeed:'coi',shoppingIntent:'ready_now',decisionTiming:'now'});
  assert.equal(result.internal.priority.queue,'shoot_now');
  assert.equal(result.public.decision,'ASK_ONE_SIGNAL');
  assert.equal(result.public.nextQuestionId,'business_type');
}

{
  const result=decision({product:'business',businessNeed:'coi',businessType:'contractor',shoppingIntent:'ready_now',decisionTiming:'now'});
  assert.equal(result.public.decision,'OFFER_HUMAN');
  assert.equal(result.internal.priority.queue,'shoot_now');
}

{
  const result=decision({product:'unknown'});
  assert.equal(result.public.decision,'ASK_ONE_SIGNAL');
  assert.equal(result.public.nextQuestionId,'signal_product');
}

assert.throws(
  ()=>normalizeSignalDecisionInput({...base({product:'life'}),email:'person@example.com'}),
  error=>error?.code==='pii_not_allowed'
);
assert.throws(
  ()=>normalizeSignalDecisionInput(base({product:'life',shoppingIntent:'I am maybe interested'})),
  error=>error?.code==='signal_value'
);
assert.throws(
  ()=>normalizeSignalDecisionInput({...base({product:'life'}),attribution:{source:'person@example.com'}}),
  error=>error?.code==='attribution_value'
);

{
  const request=new Request('https://coveragefit.example/api/signal/decision',{
    method:'POST',
    headers:{'content-type':'application/json','origin':'https://408farmers.com'},
    body:JSON.stringify(base({product:'life',lifeCoverageStatus:'employer_only',shoppingIntent:'open_to_review',decisionTiming:'within_30'}))
  });
  const response=await handleSignalDecision(request,{now:NOW,env:{}});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://408farmers.com');
  const payload=await response.json();
  assert.equal(payload.engine,SIGNAL_DECISION_BUILD);
  assert.equal(payload.decision,'OFFER_HUMAN');
  assert.equal(payload.guardrails.persisted,false);
  assert.equal(payload.guardrails.leadCreated,false);
  assert.equal(payload.guardrails.consumerScoreExposed,false);
  assert.equal('score' in payload,false);
}

{
  const request=new Request('https://coveragefit.example/api/signal/decision',{
    method:'OPTIONS',
    headers:{origin:'https://408farmers.com'}
  });
  const response=await handleSignalDecision(request,{now:NOW,env:{}});
  assert.equal(response.status,204);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://408farmers.com');
}

{
  const request=new Request('https://coveragefit.example/api/signal/decision',{
    method:'POST',
    headers:{'content-type':'application/json','origin':'https://evil.example'},
    body:JSON.stringify(base({product:'life'}))
  });
  const response=await handleSignalDecision(request,{now:NOW,env:{}});
  assert.equal(response.status,403);
}

console.log('CF-SIGNAL-DECISION-1.0 tests passed');

// Anonymous need must not substitute for explicit shopping intent.
assert.equal(decision({product:'home',reviewReason:'nonrenewal_notice'}).public.nextQuestionId,'home_shopping_intent');
assert.equal(decision({product:'home',reviewReason:'nonrenewal_notice',decisionTiming:'within_14'}).public.nextQuestionId,'home_shopping_intent');
assert.throws(()=>normalizeSignalDecisionInput({...base({product:'life'}),health:'synthetic'}),e=>e.code==='pii_not_allowed');
assert.throws(()=>normalizeSignalDecisionInput({...base({product:'life'}),unrecognizedNotes:'synthetic'}),e=>e.code==='request_field');
console.log('PASS explicit anonymous intent and strict request envelope regressions');
