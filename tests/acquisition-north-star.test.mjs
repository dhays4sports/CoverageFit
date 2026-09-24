import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {normalizeAcquisitionTouch,projectOpportunityAttribution,refreshOpportunityMeasurement,acquisitionMeasurement} from '../server/acquisition-measurement.mjs';
import {capturePriorityBaseline,opportunityPriorityCalibration} from '../server/opportunity-priority-calibration.mjs';
function fixture(){
 const db=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../migrations/'+f,import.meta.url),'utf8'));
 const at=new Date().toISOString();
 const insert=(table,row)=>db.prepare(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.keys(row).map(()=>'?').join(',')})`).run(...Object.values(row));
 insert('cf_solo_opportunities',{id:'op',workspace_id:'qa',owner_id:'qa',contact_json:'{}',source:'synthetic',last_mutation_id:'qa',created_at:at,updated_at:at});
 const repo={scope:{workspace:'qa',actor:'qa'},sql:(q,...a)=>({first:async()=>db.prepare(q).get(...a)||null,run:async()=>db.prepare(q).run(...a)}),rows:async(q,...a)=>db.prepare(q).all(...a),own:async()=>db.prepare('SELECT * FROM cf_solo_opportunities WHERE id=?').get('op')};
 repo.detail=async()=>({opportunity:await repo.own(),sources:await repo.rows('SELECT * FROM cf_solo_sources'),possessionQuality:null,opportunityPriority:null});
 return {db,repo,at,insert};
}
test('generic attribution preserves full identity, first touch and latest touch without vendor taxonomy',async()=>{
 const f=fixture();try{
 const touch={sourceFamily:'paid_search',sourceKey:'synthetic_provider',campaignId:'campaign',campaignVariant:'b',creative:'creative_a',partnerId:'partner',batchId:'batch',utmSource:'source',utmMedium:'cpc',utmCampaign:'utm_campaign',utmContent:'content',utmTerm:'term',landingPage:'/home/',occurredAt:f.at};
 const normalized=normalizeAcquisitionTouch({attribution:touch});assert.equal(normalized.creative,'creative_a');assert.equal(normalized.sourceFamily,'paid_search');assert.equal(normalized.utm.term,'term');assert.equal(normalized.occurredAt,f.at);
 await projectOpportunityAttribution(f.repo,'op',touch);
 const result=await projectOpportunityAttribution(f.repo,'op',{...touch,sourceKey:'second_provider',creative:'creative_b'});
 assert.equal(result.firstTouch.sourceKey,'synthetic_provider');assert.equal(result.firstTouch.creative,'creative_a');assert.equal(result.latestTouch.creative,'creative_b');
 const stored=JSON.parse(f.db.prepare('SELECT first_touch_json FROM cf_acq_opportunity_attribution').get().first_touch_json);assert.equal(stored.utm.content,'content');
 }finally{f.db.close()}
});
test('measurement does not infer contact, bind, premium or producer minutes from an inquiry',async()=>{
 const f=fixture();try{const m=await refreshOpportunityMeasurement(f.repo,'op');for(const k of ['contactMadeAt','meaningfulConversationAt','boundAt','writtenPremiumCents','producerMinutes'])assert.equal(m[k],null,k);
 const summary=await acquisitionMeasurement(f.repo).summary();assert.equal(summary.totals.producerMinutes,null);assert.equal(summary.totals.bound,0);assert.equal(summary.totals.qualifiedPer1000Exposures,null);
 }finally{f.db.close()}
});
test('explicit milestones, verified premium, effort, exposure and spend retain evidence and deduplicate',async()=>{
 const f=fixture();try{
 f.db.prepare("UPDATE cf_solo_opportunities SET stage='quote_preparation' WHERE id='op'").run();
 f.insert('cf_solo_activity',{id:'event',workspace_id:'qa',opportunity_id:'op',actor_id:'qa',kind:'wrap',request_id:'wrap',fingerprint:'qa',payload_json:JSON.stringify({outcome:'conversation',stage:'quote_preparation'}),created_at:f.at});
 f.insert('cf_solo_sources',{workspace_id:'qa',kind:'recommendation',source_id:'rec',opportunity_id:'op',summary_json:'{}',updated_at:f.at});
 f.insert('cf_recommendations',{id:'rec',owner_id:'qa',draft_json:'{}',current_revision:1,outcome_json:JSON.stringify({kind:'bound',policyIds:['policy'],updatedAt:f.at}),created_at:f.at,updated_at:f.at,sent_at:f.at});
 const payload=premium=>JSON.stringify({options:[{id:'option',policies:[{id:'policy',product:'home',termPremium:premium,termMonths:12}]}]});
 f.insert('cf_recommendation_revisions',{recommendation_id:'rec',revision:1,token_hash:'synthetic',payload_json:payload(null),expires_at:f.at,created_at:f.at});
 for(const premium of [null,'',' ']){f.db.prepare('UPDATE cf_recommendation_revisions SET payload_json=?').run(payload(premium));const m=await refreshOpportunityMeasurement(f.repo,'op');assert.equal(m.writtenPremiumCents,null);assert.equal(m.premiumEvidence.length,0);assert.equal(m.boundAt,f.at)}
 f.db.prepare('UPDATE cf_recommendation_revisions SET payload_json=?').run(payload(1200));
 f.insert('cf_opportunity_effort',{id:'effort',workspace_id:'qa',opportunity_id:'op',actor_id:'qa',category:'discovery',minutes:10,request_id:'effort',occurred_at:f.at,created_at:f.at});
 const m=await refreshOpportunityMeasurement(f.repo,'op');for(const key of ['qualifiedPossessionAt','contactMadeAt','meaningfulConversationAt','quoteableAt','quotePreparedAt','recommendationDeliveredAt','boundAt'])assert.equal(m[key],f.at,key);assert.equal(m.writtenPremiumCents,120000);assert.equal(m.producerMinutes,10);
 const api=acquisitionMeasurement(f.repo);const source={sourceFamily:'paid_search',sourceKey:'synthetic_provider',campaignId:'campaign',campaignVariant:'a'};
 await projectOpportunityAttribution(f.repo,'op',source);
 for(let i=0;i<2;i++){await api.spend({...source,amount:25,incurredOn:f.at.slice(0,10)},'spend');await api.exposure({...source,exposures:1000,exposureDay:f.at.slice(0,10),basis:'manual_import'},'exposure')}
 const summary=await api.summary();assert.equal(summary.totals.spendCents,2500);assert.equal(summary.totals.exposures,1000);assert.equal(summary.totals.qualifiedPer1000Exposures,1);assert.equal(summary.totals.bound,1);assert.equal(summary.totals.producerMinutes,10);
 }finally{f.db.close()}
});
test('calibration freezes first-ready baseline, warns on small samples and never recalibrates',async()=>{
 const f=fixture();try{
 const dimensions=Object.fromEntries(['need','intent','timing','fit'].map(k=>[k,{points:20,reasons:[]}]));
 await capturePriorityBaseline(f.repo,'op',{status:'ready',score:80,queue:'shoot_now',dimensions});
 await capturePriorityBaseline(f.repo,'op',{status:'ready',score:95,queue:'shoot_now',dimensions});
 assert.equal(f.db.prepare('SELECT score FROM cf_opportunity_priority_baselines').get().score,80);
 const report=await opportunityPriorityCalibration(f.repo).summary();assert.equal(report.observationalOnly,true);assert.equal(report.autoRecalibration,false);assert.equal(report.bands[0].evidenceStatus,'early');assert.ok(report.warnings.some(w=>w.includes('small samples')));
 }finally{f.db.close()}
});
