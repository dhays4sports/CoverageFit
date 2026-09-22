import assert from 'node:assert/strict';
import {withD1RateLimit} from '../server/cloudflare-rate-limit.mjs';
const original=console.warn;
const logs=[];
console.warn=(...args)=>logs.push(args);
try {
 for(const [message,reason] of [[null,'binding_missing'],['no such table: api_rate_limits','table_missing'],['no such column: reset_at','schema_mismatch'],['private-value sentinel','query_failed']]){
  let called=false;
  const env=message===null?{}:{COVERAGEFIT_DB:{prepare(){throw new Error(message);}}};
  const response=await withD1RateLimit({env,request:new Request('https://preview.example/api/signal/decision')},{failClosed:true},()=>{called=true;});
  assert.equal(response.status,503);
  assert.equal(called,false);
  assert.deepEqual(await response.json(),{ok:false,error:{code:'rate_limit_unavailable',message:'The connection is temporarily unavailable.'}});
  assert.deepEqual(logs.pop(),['CoverageFit rate limiter unavailable',{reason}]);
 }
} finally {console.warn=original;}
console.log('PASS bounded D1 diagnostics, unchanged public error and fail-closed behavior');
