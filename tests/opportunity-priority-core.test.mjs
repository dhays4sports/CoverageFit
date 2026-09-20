import assert from 'node:assert/strict';
import {deriveOpportunityPriority} from '../server/opportunity-priority-core.mjs';
import {deriveNextBestAction} from '../server/next-best-action-core.mjs';

const NOW=new Date('2026-09-20T20:00:00Z');
const base=(products='Life',reason='Review')=>({
  id:'opp_test',status:'open',stage:'inquiry',products,reason,
  created_at:'2026-09-20T18:00:00Z',updated_at:'2026-09-20T18:00:00Z'
});
const lead=(context,updated_at='2026-09-20T18:00:00Z')=>[{
  kind:'lead',source_id:'lead_test',updated_at,
  summary:{context,attribution:{sourceKey:'test'},consent:{agencyContact:{callPermitted:true}}}
}];

{
  const p=deriveOpportunityPriority({
    opportunity:base('Life'),
    sources:lead({reviewTrack:'life',lifeCoverageStatus:'employer_only',lifeGoal:'mortgage protection',shoppingIntent:'ready_now',decisionTiming:'within_30'})
  },NOW);
  assert.equal(p.status,'ready');
  assert.equal(p.score,86);
  assert.equal(p.queue,'shoot_now');
  assert.deepEqual(
    Object.fromEntries(Object.entries(p.dimensions).map(([key,value])=>[key,value.points])),
    {need:23,intent:30,timing:23,fit:10}
  );
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Life'),
    sources:lead({reviewTrack:'life',lifeCoverageStatus:'none',lifeGoal:'income replacement',shoppingIntent:'open_to_review'})
  },NOW);
  assert.equal(p.status,'provisional');
  assert.equal(p.score,null);
  assert.deepEqual([p.scoreMin,p.scoreMax],[57,82]);
  assert.equal(p.missingCriticalFact,'timing');
  assert.equal(p.recommendedMicroQuestion,'When would you ideally want the life coverage in place?');
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Life'),
    sources:lead({reviewTrack:'life',lifeCoverageStatus:'employer_only',lifeGoal:'mortgage protection',shoppingIntent:'ready_now',decisionTiming:'within_30'},'2026-07-22T18:00:00Z')
  },NOW);
  assert.equal(p.status,'provisional');
  assert.deepEqual([p.scoreMin,p.scoreMax],[51,76]);
  assert.equal(p.dimensions.intent.points,18);
  assert.equal(p.dimensions.timing.points,null);
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Life'),
    sources:lead({reviewTrack:'life',lifeCoverageStatus:'employer_only',lifeGoal:'mortgage protection',shoppingIntent:'ready_now',decisionTiming:'within_30'},'2026-05-23T18:00:00Z')
  },NOW);
  assert.equal(p.status,'unclassified');
  assert.deepEqual([p.scoreMin,p.scoreMax],[33,88]);
  assert.equal(p.dimensions.intent.points,null);
  assert.equal(p.dimensions.timing.points,null);
  assert.equal(p.missingCriticalFact,'intent');
}

{
  const p=deriveOpportunityPriority({
    opportunity:{...base('Life'),deadline:'2026-09-01'},
    sources:lead({reviewTrack:'life',lifeCoverageStatus:'none',shoppingIntent:'open_to_review'},'2026-09-18T18:00:00Z')
  },NOW);
  assert.equal(p.dimensions.timing.points,null);
  assert.equal(p.missingCriticalFact,'timing');
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Home'),
    sources:lead({reviewTrack:'home',reviewReason:'nonrenewal_notice',shoppingIntent:'ready_now',decisionTiming:'within_14'})
  },NOW);
  assert.equal(p.score,90);
  assert.equal(p.queue,'shoot_now');
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Home','Buying home'),
    sources:lead({reviewTrack:'home',reviewReason:'buying_condo',shoppingIntent:'ready_now',closingDate:'2026-09-27'})
  },NOW);
  assert.equal(p.score,88);
  assert.equal(p.queue,'shoot_now');
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Auto'),
    sources:lead({reviewTrack:'auto',autoNeed:'new_vehicle',shoppingIntent:'open_to_review',decisionTiming:'days_31_60'})
  },NOW);
  assert.equal(p.score,71);
  assert.equal(p.queue,'quick_play');
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Business','COI needed for contract'),
    sources:lead({reviewTrack:'business',businessNeed:'COI needed before contract starts',shoppingIntent:'ready_now',decisionTiming:'urgent'})
  },NOW);
  assert.equal(p.score,90);
  assert.equal(p.queue,'shoot_now');
}

{
  const p=deriveOpportunityPriority({
    opportunity:base('Life'),
    tasks:[{id:'task1',priority:100,state:'open',title:'Client wants to proceed'}],
    sources:lead({reviewTrack:'life'})
  },NOW);
  assert.equal(p.routeOverride.kind,'human_now');
}

{
  const nba=deriveNextBestAction({
    opportunity:base('Life'),
    tasks:[{id:'task1',priority:100,state:'open',title:'Proceed'}],
    sources:[{kind:'lead',summary:{}}],
    opportunityPriority:{status:'ready',score:22,scoreMin:22,scoreMax:22,queue:'low_priority'}
  },NOW);
  assert.equal(nba.action,'RESPOND_TO_PROCEED');
  assert.equal(nba.source,'explicit_client_response');
}

{
  const nba=deriveNextBestAction({
    opportunity:base('Life'),
    sources:[{kind:'lead',summary:{}}],
    opportunityPriority:{status:'provisional',score:null,scoreMin:57,scoreMax:82,queue:'unclassified',recommendedMicroQuestion:'When would you ideally want coverage in place?'}
  },NOW);
  assert.equal(nba.action,'ASK_ONE_SIGNAL');
  assert.equal(nba.label,'When would you ideally want coverage in place?');
}

{
  const nba=deriveNextBestAction({
    opportunity:base('Life'),
    sources:[{kind:'lead',summary:{}}],
    opportunityPriority:{status:'ready',score:86,scoreMin:86,scoreMax:86,queue:'shoot_now'}
  },NOW);
  assert.equal(nba.action,'CONNECT_OR_PREPARE_NOW');
  assert.equal(nba.opportunityPriorityScore,86);
}

console.log('CF-OPPORTUNITY-PRIORITY-1.0 regression tests passed');
