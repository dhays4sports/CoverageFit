import test from 'node:test';import assert from 'node:assert/strict';
import {webEvidence} from '../assets/js/work-web-evidence.mjs';
test('submitted evidence replaces initial context once, with answer provenance',()=>{
 const facts=webEvidence({version:'coveragefit-distribution-v1',initialEvidence:{product:'home',shoppingIntent:'exploring'},answers:[{source:'coveragefit_signal',signals:{reviewReason:'renewal_change',shoppingIntent:'ready_now'}}]});
 assert.deepEqual(facts,[['product','home','Entry context / previously supplied evidence'],['shoppingIntent','ready now','Submitted web answer'],['reviewReason','renewal change','Submitted web answer']]);
});
test('source context and internal values do not masquerade as submitted facts',()=>{
 const facts=webEvidence({version:'coveragefit-distribution-v1',audience:'tech',initialEvidence:{product:'unknown',professionalProgram:'tech',score:100},answers:[{source:'unrecognized',signals:{shoppingIntent:'ready_now'}},{source:'coveragefit_signal',signals:{opportunity_id:'private',phone:'private'}}]});
 assert.deepEqual(facts,[]);assert.deepEqual(webEvidence(null),[]);
});
