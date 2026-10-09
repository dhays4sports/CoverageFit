import {COPILOT_SCHEMA,INSTRUCTIONS,FIELDS} from './signal-copilot-contract.mjs';
const PROVIDER_CODES=new Set(['insufficient_quota','rate_limit_exceeded','invalid_api_key','model_not_found','invalid_json_schema','invalid_request_error','permission_denied','billing_hard_limit_reached']);
const FAILURE_CODES=new Set(['ai_rate_limited','ai_budget_exceeded','stale_suggestion','invalid_output','unsupported_evidence','invalid_fact_date','invalid_fact_value','provider_timeout','provider_unavailable','provider_incomplete','provider_refusal','provider_rate_limited','invalid_usage','provider_cancelled','context_too_large']);
export function safeProviderFailure(error){
 const result={error:FAILURE_CODES.has(error?.message)?error.message:'ai_unavailable'};
 if(Number.isInteger(error?.provider_status)&&error.provider_status>=400&&error.provider_status<=599)result.provider_status=error.provider_status;
 if(PROVIDER_CODES.has(error?.provider_code))result.provider_code=error.provider_code;
 if(['invalid_fact_value','invalid_fact_date','unsupported_evidence'].includes(error?.message)&&FIELDS.includes(error?.validation_field))result.validation_field=error.validation_field;
 return result;
}
export const CAPABILITIES=['FAST_EXTRACT','NORMAL_REASON','DEEP_REASON'];
export function aiConfig(env={},capability='NORMAL_REASON'){
 if(env.CF_AI_ENABLED!=='1'||env.CF_SIGNAL_COPILOT_ENABLED!=='1')throw Error('ai_disabled');
 if((env.CF_AI_PROVIDER||'openai')!=='openai'||!env.OPENAI_API_KEY)throw Error('ai_unconfigured');
 let models;try{models=JSON.parse(env.CF_AI_MODELS_JSON||'{}');}catch{throw Error('ai_unconfigured');}
 const route=models[capability];if(!CAPABILITIES.includes(capability)||!route||!/^[-a-zA-Z0-9._]+$/.test(route.model||'')||!['input_per_million','output_per_million'].every(k=>Number.isFinite(route[k])&&route[k]>0))throw Error('ai_unconfigured');
 const budget=Number(env.CF_AI_MONTHLY_BUDGET_USD);if(!Number.isFinite(budget)||budget<=0||budget>10000)throw Error('ai_unconfigured');
 return {provider:'openai',...route,capability,budget,timeout:Math.min(20000,Math.max(1000,Number(env.CF_AI_REQUEST_TIMEOUT_MS)||15000)),maxOutput:2000,maxInput:30000};
}
// One server-side Copilot adapter. No SDK retry loop, tools or provider-owned memory.
export async function reasonWithProvider(context,config,options={}){
 const payload={model:config.model,store:false,instructions:INSTRUCTIONS,input:[{role:'user',content:JSON.stringify(context)}],max_output_tokens:config.maxOutput,text:{format:{type:'json_schema',name:'signal_copilot',strict:true,schema:COPILOT_SCHEMA}}};
 if(['minimal','low','medium'].includes(config.reasoning_effort))payload.reasoning={effort:config.reasoning_effort};
 if(new TextEncoder().encode(JSON.stringify(payload)).length>config.maxInput)throw Error('context_too_large');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeout);
 const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});
 try{
  if(options.signal?.aborted)throw Error('provider_cancelled');
  const response=await (options.fetch||fetch)('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+options.env.OPENAI_API_KEY,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify(payload)});
  if(!response.ok){
   const failure=Error(response.status===429?'provider_rate_limited':'provider_unavailable');
   failure.provider_status=response.status;
   // Store only recognized codes. Never retain provider messages, bodies or headers.
   try{const raw=await response.text();if(raw.length<=100000){const code=JSON.parse(raw)?.error?.code;if(PROVIDER_CODES.has(code))failure.provider_code=code;}}catch{}
   throw failure;
  }
  const raw=await response.text();if(raw.length>100000)throw Error('invalid_output');const body=JSON.parse(raw);
  if(body.status!=='completed')throw Error('provider_incomplete');
  const content=(body.output||[]).flatMap(x=>x.content||[]);if(content.some(x=>x.type==='refusal'))throw Error('provider_refusal');
  const result=JSON.parse(content.filter(x=>x.type==='output_text').map(x=>x.text).join(''));
  const u=body.usage||{};if(!Number.isInteger(u.input_tokens)||!Number.isInteger(u.output_tokens)||u.input_tokens<0||u.output_tokens<0)throw Error('invalid_usage');
  return {result,usage:{input_tokens:u.input_tokens,cached_input_tokens:u.input_tokens_details?.cached_tokens||0,output_tokens:u.output_tokens},model:config.model};
 }catch(e){
  const failure=Error(controller.signal.aborted?'provider_timeout':['provider_rate_limited','provider_unavailable','provider_incomplete','provider_refusal','invalid_usage','provider_cancelled'].includes(e.message)?e.message:'invalid_output');
  const safe=safeProviderFailure(e);
  if(safe.provider_status)failure.provider_status=safe.provider_status;
  if(safe.provider_code)failure.provider_code=safe.provider_code;
  throw failure;
 }
 finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
