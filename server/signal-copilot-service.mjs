import {createSmsConversationStore} from './d1-json-store.mjs';
import {digest,parse} from './solo-desk-repository.mjs';
import {copilotContext,minimize} from './signal-copilot-context.mjs';
import {COPILOT_VERSION,validateReasoning} from './signal-copilot-contract.mjs';
import {aiConfig,reasonWithProvider,safeProviderFailure} from './ai-provider.mjs';
const PREFIX='signal-copilot/';
export function copilotService(repo,env,options={}){
 const store=createSmsConversationStore(repo.db),w=repo.scope.workspace,base=PREFIX+w+'/';
 const requestPattern=(base+'requests/').replace(/[\\%_]/g,x=>'\\'+x)+'%';
 const load=id=>copilotContext(repo,store,env,id);
 const requestKey=id=>{if(!/^[a-f0-9]{64}$/.test(id||''))throw Error('invalid_suggestion');return base+'requests/'+id;};
 async function metrics(){
  const month=new Date().toISOString().slice(0,7),day=new Date().toISOString().slice(0,10);
  const rows=await repo.rows("SELECT data_json FROM sms_conversations WHERE record_key LIKE ? ESCAPE '\\' ORDER BY updated_at DESC LIMIT 1001",requestPattern);
  const all=rows.slice(0,1000).map(x=>parse(x.data_json)),recent=all.filter(r=>r.at?.startsWith(month)),today=recent.filter(r=>r.at.startsWith(day));
  const analyzed=new Set(recent.map(r=>r.conversation_id+'|'+r.inbound_message_id)),sent=recent.filter(r=>r.sent_at),sentInbounds=new Set(sent.map(r=>r.conversation_id+'|'+r.inbound_message_id));
  const uniqueIds=[...new Set(recent.map(r=>r.opportunity_id))],ids=uniqueIds.slice(0,50);let measured=[];
  if(ids.length)measured=await repo.rows('SELECT opportunity_id,meaningful_conversation_at,quoteable_at,quote_prepared_at,bound_at FROM cf_acq_opportunity_measurements WHERE workspace_id=? AND opportunity_id IN ('+ids.map(()=>'?').join(',')+')',w,...ids);
  const evaluation={basis:'Descriptive results for analyzed inbounds only; not causal lift or all meaningful inbound coverage.',analyzed_inbounds:analyzed.size,sent_inbounds:sentInbounds.size,sent_per_analyzed:analyzed.size?sentInbounds.size/analyzed.size:null,accepted_after_revision:sent.filter(r=>r.parent_suggestion_id).length,sent_unchanged:sent.filter(r=>!r.edited).length,average_time_to_approval_ms:sent.length?Math.round(sent.reduce((n,r)=>n+Math.max(0,Date.parse(r.sent_at)-Date.parse(r.at)),0)/sent.length):null,fact_conflicts:recent.filter(r=>r.result?.fact_proposals.some(p=>p.status==='CONFLICTING')).length,outcome_join_truncated:uniqueIds.length>50,outcome_records:measured.length,useful_conversations:measured.length?measured.filter(r=>r.meaningful_conversation_at).length:null,quote_ready:measured.length?measured.filter(r=>r.quoteable_at).length:null,quotes:measured.length?measured.filter(r=>r.quote_prepared_at).length:null,binds:measured.length?measured.filter(r=>r.bound_at).length:null};
  return {evaluation,enabled:env.CF_AI_ENABLED==='1'&&env.CF_SIGNAL_COPILOT_ENABLED==='1',month,budget_usd:Number(env.CF_AI_MONTHLY_BUDGET_USD)||null,budget_warning:((await store.get(base+'budget/'+month))?.charged||0)>=Number(env.CF_AI_MONTHLY_BUDGET_USD)*.8,provider:env.CF_AI_PROVIDER||'openai',charged_or_reserved_usd:(await store.get(base+'budget/'+month))?.charged||0,requests_today:today.length,failures:recent.filter(r=>r.status==='failed').length,average_latency_ms:recent.length?Math.round(recent.reduce((n,r)=>n+(r.latency_ms||0),0)/recent.length):null,accepted:recent.filter(r=>r.accepted).length,edited:recent.filter(r=>r.edited).length,rejected:recent.filter(r=>r.rejected).length,repeat_rejections:recent.filter(r=>r.result?.validation.repeated_fields.length).length,truncated:rows.length>1000};
 }
 async function reserve(config){
  const at=new Date().toISOString(),month=at.slice(0,7),budgetKey=base+'budget/'+month,rateKey=base+'rate/'+repo.scope.actor+'/'+at.slice(0,16);
  for(const [key,value] of [[budgetKey,{charged:0}],[rateKey,{count:0}]])try{await store.setJSON(key,value,{onlyIfNew:true});}catch{if(!await store.get(key))throw Error('storage_unavailable');}
  const rate=await repo.sql("UPDATE sms_conversations SET data_json=json_set(data_json,'$.count',json_extract(data_json,'$.count')+1) WHERE record_key=? AND json_extract(data_json,'$.count')<6",rateKey).run();if(rate.meta.changes!==1)throw Error('ai_rate_limited');
  // Conservative reservation: UTF-8 byte cap bounds input tokens plus schema; no cached-token discount.
  const amount=(config.maxInput*config.input_per_million+config.maxOutput*config.output_per_million)/1e6;
  const r=await repo.sql("UPDATE sms_conversations SET data_json=json_set(data_json,'$.charged',json_extract(data_json,'$.charged')+?),updated_at=? WHERE record_key=? AND json_extract(data_json,'$.charged')+?<=?",amount,at,budgetKey,amount,config.budget).run();
  if(r.meta.changes!==1)throw Error('ai_budget_exceeded');return {amount,budgetKey};
 }
 async function act(v){
  const ctx=await load(v.id);
  if(v.action==='status'){
   const rows=await repo.rows("SELECT data_json FROM sms_conversations WHERE record_key LIKE ? ESCAPE '\\' ORDER BY updated_at DESC LIMIT 100",requestPattern);
   const latest=rows.map(x=>parse(x.data_json)).find(x=>x.opportunity_id===v.id&&x.status==='complete');
   return {enabled:env.CF_AI_ENABLED==='1'&&env.CF_SIGNAL_COPILOT_ENABLED==='1',suggestion:latest?{...latest,stale:latest.fingerprint!==ctx.fingerprint||latest.revision!==ctx.revision}:null};
  }
  if(v.action==='reject'){
   const key=requestKey(v.suggestion_id),r=await store.get(key);if(r?.opportunity_id!==v.id)throw Error('invalid_suggestion');await store.setJSON(key,{...r,rejected:true});return {rejected:true};
  }
  if(!['analyze','revise'].includes(v.action))throw Error('invalid_action');
  const config=aiConfig(env),direction=String(v.direction||'');if(direction.length>600)throw Error('direction_too_long');
  let previous='';if(v.action==='revise'){
   const r=await store.get(requestKey(v.suggestion_id));if(r?.opportunity_id!==v.id||r.fingerprint!==ctx.fingerprint||r.revision!==ctx.revision)throw Error('stale_suggestion');previous=r.result?.reply.draft||'';
  }
  const keyId=await digest(JSON.stringify([COPILOT_VERSION,ctx.fingerprint,ctx.revision,direction,previous,config.model])),key=requestKey(keyId);
  const old=await store.get(key);if(old?.status==='complete')return {suggestion:old,cached:true};if(old)throw Error('ai_request_already_attempted');
  const record={id:keyId,version:COPILOT_VERSION,opportunity_id:v.id,conversation_id:ctx.conversation.id,inbound_message_id:ctx.conversation.signal.inbound_message_id,revision:ctx.revision,fingerprint:ctx.fingerprint,direction:minimize(direction),type:v.action,parent_suggestion_id:v.action==='revise'?v.suggestion_id:null,provider:config.provider,model:config.model,capability:config.capability,at:new Date().toISOString(),status:'pending',retries:0,escalation:false};
  try{await store.setJSON(key,record,{onlyIfNew:true});}catch{throw Error('ai_request_in_progress');}
  const start=Date.now();let reserved;
  try{
   reserved=await reserve(config);
   const response=await (options.provider||reasonWithProvider)({...ctx.data,producer_direction:minimize(direction),previous_draft:previous},config,{env,fetch:options.fetch,signal:options.signal});
   record.usage=response.usage;
   record.estimated_cost_usd=(response.usage.input_tokens*config.input_per_million+response.usage.output_tokens*config.output_per_million)/1e6;
   // Validate output locally even if provider reports strict structured output success.
   record.result=validateReasoning(response.result,ctx.data);
   const fresh=await load(v.id);if(fresh.fingerprint!==ctx.fingerprint||fresh.revision!==ctx.revision)throw Error('stale_suggestion');
   record.status='complete';record.known_answers=ctx.data.known_answers;
  }catch(e){record.status='failed';Object.assign(record,safeProviderFailure(e));}
  record.latency_ms=Date.now()-start;record.reserved_usd=reserved?.amount||0;
  if(reserved&&Number.isFinite(record.estimated_cost_usd))await repo.sql("UPDATE sms_conversations SET data_json=json_set(data_json,'$.charged',MAX(0,json_extract(data_json,'$.charged')+?)) WHERE record_key=?",record.estimated_cost_usd-reserved.amount,reserved.budgetKey).run();
  await store.setJSON(key,record);
  if(record.status!=='complete')throw Error(record.error);
  return {suggestion:record,cached:false};
 }
 async function select(id,suggestionId,message){
  const ctx=await load(id),key=requestKey(suggestionId),r=await store.get(key);
  if(r?.status!=='complete'||r.opportunity_id!==id||r.fingerprint!==ctx.fingerprint||r.revision!==ctx.revision||!r.result?.reply.draft)throw Error('stale_suggestion');
  await store.setJSON(key,{...r,accepted:true,accepted_at:new Date().toISOString(),edited:message!==r.result.reply.draft,manual_edit:message});
  return {suggestion_id:suggestionId,opportunity_id:id,fingerprint:ctx.fingerprint};
 }
 async function check(draft){const ctx=await load(draft.opportunity_id);if(ctx.fingerprint!==draft.fingerprint)throw Error('stale_suggestion');}
 async function edited(draft,message){const key=requestKey(draft.suggestion_id),r=await store.get(key);if(r)await store.setJSON(key,{...r,edited:message!==r.result.reply.draft,manual_edit:message});}
 async function sent(draft,message,providerId){const key=requestKey(draft.suggestion_id),r=await store.get(key);if(r)await store.setJSON(key,{...r,final_approved_message:message,provider_message_id:providerId,sent_at:new Date().toISOString()});}
 return {act,metrics,select,check,sent,edited};
}
