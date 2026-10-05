import test from 'node:test';
import assert from 'node:assert/strict';
import {reasonWithProvider,safeProviderFailure} from '../server/ai-provider.mjs';
const config={model:'fixture',maxOutput:2000,maxInput:30000,timeout:1000};
for(const [status,code] of [[429,'insufficient_quota'],[429,'rate_limit_exceeded'],[401,'invalid_api_key'],[403,'permission_denied'],[404,'model_not_found'],[400,'invalid_json_schema']]){
 test('safe provider diagnostic '+status+' '+code,async()=>{
  let calls=0;
  await assert.rejects(reasonWithProvider({},config,{env:{OPENAI_API_KEY:'synthetic-secret'},fetch:async()=>{calls++;return Response.json({error:{code,message:'PRIVATE BODY synthetic-secret',extra:'private'}},{status});}}),error=>{
   assert.deepEqual(safeProviderFailure(error),{error:status===429?'provider_rate_limited':'provider_unavailable',provider_status:status,provider_code:code});
   assert.doesNotMatch(JSON.stringify(error),/PRIVATE|synthetic-secret|extra/);return true;
  });
  assert.equal(calls,1);
 });
}
test('unrecognized provider codes and bodies are discarded',async()=>{
 await assert.rejects(reasonWithProvider({},config,{env:{},fetch:async()=>Response.json({error:{code:'secret-customer-value',message:'private'}},{status:500})}),e=>{
 assert.deepEqual(safeProviderFailure(e),{error:'provider_unavailable',provider_status:500});return true;
 });
});
test('HTML provider error keeps only status',async()=>{
 await assert.rejects(reasonWithProvider({},config,{env:{},fetch:async()=>new Response('private HTML',{status:502})}),e=>{
 assert.deepEqual(safeProviderFailure(e),{error:'provider_unavailable',provider_status:502});return true;
 });
});
test('timeout remains bounded without retry',async()=>{
 let calls=0;
 await assert.rejects(reasonWithProvider({}, {...config,timeout:5},{env:{},fetch:async(_url,{signal})=>{calls++;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('private abort'))));}}),e=>{
 assert.deepEqual(safeProviderFailure(e),{error:'provider_timeout'});return true;
 });assert.equal(calls,1);
});
test('unknown internal errors are not exposed',()=>{
 assert.deepEqual(safeProviderFailure(Error('private database or secret detail')),{error:'ai_unavailable'});
 assert.deepEqual(safeProviderFailure(Object.assign(Error('provider_rate_limited'),{provider_status:200,provider_code:'private'})),{error:'provider_rate_limited'});
});
test('success still returns structured output and actual usage',async()=>{
 const result=await reasonWithProvider({},config,{env:{},fetch:async()=>Response.json({status:'completed',output:[{content:[{type:'output_text',text:'{"synthetic":true}'}]}],usage:{input_tokens:10,output_tokens:5}})});
 assert.deepEqual(result.result,{synthetic:true});assert.equal(result.usage.input_tokens,10);assert.equal(result.usage.output_tokens,5);
});
