import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEconomicsSummary} from '../server/economics-core.mjs';
const row={opportunities:2,bound:1,boundPremiumCents:120000,spendCents:5000,producerMinutes:null,effortMeasuredOpportunities:0,effortCoveragePct:0};
const summary=(r)=>buildEconomicsSummary({groups:[r],totals:r,commissionRateConfigured:0.1},{COVERAGEFIT_PRODUCER_ATTENTION_COST_PER_HOUR_CENTS:'3000'}).totals;
test('unmeasured economics hours and labor stay unknown; explicitly measured zero stays zero',()=>{
 const unknown=summary(row);assert.equal(unknown.producerHours,null);assert.equal(unknown.recordedAttentionCostCents,null);assert.equal(unknown.observedAcquisitionCostCents,null);
 const zero=summary({...row,producerMinutes:0,effortMeasuredOpportunities:2,effortCoveragePct:100});assert.equal(zero.producerHours,0);assert.equal(zero.recordedAttentionCostCents,0);assert.equal(zero.firstYearCommissionPerProducerHourCents,null);
});
test('commission per hour requires complete effort and premium evidence',()=>{
 const partial={...row,producerMinutes:60,effortMeasuredOpportunities:1,effortCoveragePct:50};assert.equal(summary(partial).firstYearCommissionPerProducerHourCents,null);
 const complete={...partial,effortMeasuredOpportunities:2,effortCoveragePct:100};assert.equal(summary(complete).firstYearCommissionPerProducerHourCents,12000);
 assert.equal(summary({...complete,premiumEvidenceGaps:1}).firstYearCommissionPerProducerHourCents,null);
});
