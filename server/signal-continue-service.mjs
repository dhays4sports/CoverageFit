import {extractFacts,matchTemplate} from './sms-signal-core.mjs';
import {SIGNAL_QUESTION_LIBRARY} from './signal-decision-core.mjs';
import {createSmsHandoffStore,createSmsConversationStore} from './d1-json-store.mjs';
import {sha256Hex} from './runtime-crypto.mjs';
import {parse} from './solo-desk-repository.mjs';
import {classifyPopulation} from './producer-workspace.mjs';
import {resolveSmsOwnership} from './sms-ownership.mjs';
import {templatesFor} from './sms-template-registry.mjs';
import {sendSmsThroughGateway,smsLiveConversationId,baseConversation} from './sms-outbound-gateway.mjs';
import {applySmsConsentCommand} from './sms-consent-core.mjs';
import {CONTINUE_KIND,CONTINUE_TTL,newContinueToken,continueKey,continueUrl,validContinueSession,continueEligibility,continueSignals,continueStep,applyContinueChoice,continueCompletion} from './signal-continue-core.mjs';
const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status,code:'continue_unavailable'});};
export function signalContinue(repo,env,options={}){
 const tokens=createSmsHandoffStore(repo.db),store=createSmsConversationStore(repo.db),w=repo.scope.workspace;
 const now=()=>options.now?new Date(options.now):new Date();
 async function context(id){
  const op=await repo.own(id),sources=(await repo.rows('SELECT * FROM cf_solo_sources WHERE workspace_id=? AND opportunity_id=?',w,id)).map(s=>({...s,summary:parse(s.summary_json)}));
  const pilot=sources.find(s=>s.kind==='district_pilot_v1')?.summary;
  const population=classifyPopulation(sources).population;
  const cid=pilot?.conversation_id;
  // V1 requires an exact existing relationship. No phone-based auto-linking.
  let c=cid?await store.get('sms-live-conversations/'+cid):null;let initializeConversation=false;
  if(!c&&cid&&pilot?.cohort==='SIGNAL'&&pilot.pilot_phase==='NEW_LEAD'){const contact=parse(op.contact_json);try{const verified=await smsLiveConversationId(contact.mobile,env.RINGCENTRAL_FROM_NUMBER,env.RINGCENTRAL_CONVERSATION_HASH_SECRET);if(verified===cid){c=baseConversation(cid,{to:contact.mobile},env.RINGCENTRAL_FROM_NUMBER,now().toISOString());initializeConversation=true;}}catch{/* Missing relationship configuration remains ineligible. */}}
  const owner=c?await resolveSmsOwnership(c,{}, {env,store,templates:await templatesFor(store)}):{owner:'UNKNOWN'};
  let historyFacts={},previous='',goal='';for(const item of c?.transcript||[]){if(item.direction==='outbound'){previous=item.body;goal=item.signalGoal||matchTemplate(previous)?.default_reply_goal||'';}else if(previous&&item.occurredAt&&now().getTime()-Date.parse(item.occurredAt)<=30*86400000)historyFacts=extractFacts(item.body,previous,historyFacts,item.occurredAt,goal).facts;}
  const facts={...pilot?.raw_facts,...c?.signal?.facts,...historyFacts};
  delete facts.stated_need;delete facts.shopping_intent;delete facts.insured_since;
  for(const field of ['renewal_date','closing_date'])if(facts[field]&&facts[field]<now().toISOString().slice(0,10))delete facts[field];
  if(facts.timing?.date&&facts.timing.date<now().toISOString().slice(0,10))delete facts.timing;
  const saved=sources.find(s=>s.kind===CONTINUE_KIND)?.summary;
  const fresh={};for(const source of sources.filter(s=>s.kind==='lead'&&s.summary?.context?.evidenceOrigin!=='agencyzoom_raw').sort((a,b)=>a.updated_at.localeCompare(b.updated_at))){
   if(now().getTime()-Date.parse(source.updated_at)>30*86400000)continue;
   for(const field of ['shoppingIntent','reviewReason','autoNeed','statedTrigger','decisionTiming'])if(source.summary.context?.[field])fresh[field]=source.summary.context[field];
  }
  if(c?.signal?.response_timestamp&&now().getTime()-Date.parse(c.signal.response_timestamp)>30*86400000)delete facts.shopping_reason;
  return {op,sources,pilot,population,c,owner,facts,saved,fresh,initializeConversation};
 }
 function eligibility(x,selection){return continueEligibility({population:x.population,cohort:x.pilot?.cohort,owner:x.owner.owner,facts:x.facts,signal:{...x.c?.signal,contact_suppressed:x.owner.compliance||x.c?.smsConsent?.status==='opted_out'},status:x.op.status,activeFirstParty:x.population==='WEB_DIRECT',...selection});}
 async function locked(cid,fn){const key='sms-signal/locks/'+cid;try{await store.setJSON(key,{at:now().toISOString()},{onlyIfNew:true});}catch{fail('Conversation is processing. Refresh and retry.');}try{return await fn();}finally{await store.delete(key);}}
 const sourceStatement=(id,summary,at)=>repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,CONTINUE_KIND,id,id,JSON.stringify(summary),at);
 const sessionStatement=(key,s)=>repo.sql('UPDATE sms_handoffs SET data_json=?,updated_at=? WHERE record_key=?',JSON.stringify(s),now().toISOString(),key);
 async function save(key,s){await tokens.setJSON(key,s,{metadata:{expiresAt:s.expires_at}});}
 function view(s){return {revision:s.revision,status:s.status,expires_at:s.expires_at,saved_answers:s.answers.map(a=>({question:SIGNAL_QUESTION_LIBRARY[a.question_id]?.prompt,answer:SIGNAL_QUESTION_LIBRARY[a.question_id]?.options.find(o=>o.code===a.code)?.label})),question:s.step?.question?{id:s.step.question.id,prompt:s.step.question.prompt,options:s.step.question.options.map(o=>({code:o.code,label:o.label}))}:null,done:!!s.step?.done,message:s.step?.done?continueCompletion(s.step.decision_2):null};}
 async function load(token){const key=await continueKey(token),s=key?await tokens.get(key):null;if(!validContinueSession(s,now().getTime())||s.workspace!==w)fail('This check-in is unavailable or has expired.',404);return {key,s};}
 async function available(s){if(!validContinueSession(s,now().getTime()))fail('This check-in has expired.',404);const x=await context(s.opportunity);if(!x.c||x.c.id!==s.conversation||x.pilot?.cohort!=='SIGNAL'||x.owner.compliance||!['DISTRICT_SIGNAL','PRODUCER_OWNED'].includes(x.owner.owner)||x.op.status==='closed')fail('This check-in is no longer available.',404);return x;}
 return {
  async preview(id){const x=await context(id);const e=eligibility(x,{trigger:'busy',interestConfirmed:true,producerChosen:true});return {eligibility:e,known:x.facts,step:e.eligible?continueStep(continueSignals(x.facts,x.fresh,now()),0,now()):null,session:x.saved||null};},
  async create(v){const x=await context(v.id),selection={trigger:v.trigger,interestConfirmed:v.interestConfirmed===true,producerChosen:v.producerChosen===true};const e=eligibility(x,selection);if(!e.eligible)fail(e.reason);
   return locked(x.c.id,async()=>{const current=await context(v.id);const recheck=eligibility(current,selection);if(!recheck.eligible)fail(recheck.reason);if(current.saved?.key){const old=await tokens.get(current.saved.key);if(validContinueSession(old,now().getTime())&&!['completed','revoked'].includes(old.status))fail('An existing check-in is available. Use or revoke that draft first.');}
    if(current.initializeConversation)await store.setJSON('sms-live-conversations/'+current.c.id,current.c,{onlyIfNew:true});
    const priorityBefore=await repo.opportunityPriority(v.id);
    const at=now().toISOString(),token=newContinueToken(),key=await continueKey(token),signals=continueSignals(current.facts,current.fresh,now()),step=continueStep(signals,0,now());if(step.done)fail('The next action is already clear. Preserve it instead of sending a check-in.');
    const s={priority_before:priorityBefore?{score:priorityBefore.score,scoreMin:priorityBefore.scoreMin,scoreMax:priorityBefore.scoreMax,engine:priorityBefore.engine}:null,scope:CONTINUE_KIND,workspace:w,opportunity:v.id,conversation:current.c.id,selection,created_at:at,expires_at:new Date(now().getTime()+CONTINUE_TTL).toISOString(),revision:1,status:'draft',signals,submitted:{},answers:[],step,draft:`Thanks for your time. Here’s the quick link I mentioned — it should only take a minute or two, and I’ll pick up from what you already told me: ${continueUrl(token)}`,events:[{type:'offered',at}],base_revision:current.c.signal?.revision||0};
    await tokens.setJSON(key,s,{onlyIfNew:true,metadata:{expiresAt:s.expires_at}});await sourceStatement(v.id,{key,status:'draft',offered_at:at,revision:1},at).run();return {revision:1,draft:s.draft,known:current.facts,first_question:step.question.prompt};
   });
  },
  async producer(v){const x=await context(v.id),key=x.saved?.key,s=key?await tokens.get(key):null;if(!validContinueSession(s,now().getTime())||s.workspace!==w||s.opportunity!==v.id)fail('No valid check-in draft.');
   return locked(s.conversation,async()=>{const live=await tokens.get(key),current=await context(v.id);if(live.revision!==v.revision)fail('This draft changed. Refresh before approving.');
    if(v.action==='revoke'){live.revoked_at=now().toISOString();live.status='revoked';const c=current.c;if(c?.signal?.continue_key===key){c.signal.continue_active=false;await store.setJSON('sms-live-conversations/'+c.id,c);}}
    else {const e=eligibility(current,live.selection);if(!e.eligible)fail(e.reason);if(live.status!=='draft')fail('This draft has already been sent or needs delivery review.');if((current.c.signal?.revision||0)!==live.base_revision)fail('New conversation evidence arrived. Revoke and prepare a fresh check-in.');
     if(v.action==='edit'){const message=String(v.message||'').trim(),link=live.draft.match(/https:\/\/coveragefit\.com\/s\/[A-Za-z0-9_-]{43}/)?.[0];if(!link||!message.includes(link)||message.length>1000||/[<>]/.test(message))fail('Keep the exact secure link and a short plain-text message.');live.draft=message;}
     else if(v.action==='approve_send'){
      live.status='sending';await save(key,live);
      try{const sent=await (options.send||sendSmsThroughGateway)({to:current.c.contactPhone,message:live.draft,origin:'producer_console',workflow:'signal_continue_v1',replyRoute:'producer',ownershipEffect:'preserve',idempotencyKey:'continue:'+key.slice(-48)},{env,store,conversationSnapshot:current.c});live.provider_message_id=sent.providerMessageId;live.sent_at=now().toISOString();live.status='sent';live.events.push({type:'sent',at:live.sent_at});}
      catch{live.status='delivery_review';live.revision++;await save(key,live);fail('Delivery is uncertain. Check RingCentral; do not resend blindly.',502);}
     }else fail('Unsupported check-in action.');
    }
    live.revision++;await save(key,live);await sourceStatement(v.id,{...x.saved,status:live.status,revision:live.revision,sent_at:live.sent_at||null},now().toISOString()).run();return {revision:live.revision,status:live.status,draft:live.status==='draft'?live.draft:null};
   });
  },
  async resume(token){const {key,s}=await load(token);return locked(s.conversation,async()=>{const live=await tokens.get(key);const x=await available(live);if(!['sent','active','completed'].includes(live.status))fail('This check-in is not available yet.',404);if(live.status!=='completed'){
    if(x.facts.explicit_call_request||x.facts.explicit_quote_request||x.facts.callback_date){live.step={done:true,decision_2:'CALL',priority:'HIGH',recommended_az_stage:'ENGAGED'};live.status='completed';}
    else if(x.c.signal?.decision_2&&['CALL','LATER','CLOSE','STOP'].includes(x.c.signal.decision_2)&&x.c.signal.revision!==live.base_revision){live.step={done:true,decision_2:x.c.signal.decision_2};live.status='completed';}
    else {live.signals=continueSignals(x.facts,{...x.fresh,...live.submitted},now());live.step=continueStep(live.signals,live.answers.length,now());live.status=live.step.done?'completed':'active';}
    live.opened_at||=now().toISOString();live.revision++;live.context_revision=x.c.signal?.revision||0;
    const c=x.c;if(live.step.done){live.completed_at||=now().toISOString();c.signal={...c.signal,managed:true,revision:(c.signal?.revision||0)+1,decision_2:live.step.decision_2,priority:live.step.priority||'MEDIUM',reason:'The latest evidence gives Dylan a clear next action.',az_recommended_stage:live.step.recommended_az_stage||({CALL:'ENGAGED',LATER:'FUTURE_BIND',CLOSE:'CLOSED',STOP:'STOP'})[live.step.decision_2],az_sync_status:'pending',automation_lock:true,human_required:live.step.decision_2==='CALL'};}c.signal={...c.signal,continue_active:!live.step.done,continue_expires_at:live.expires_at,continue_key:key,reply:'',draft_status:'none'};
    await repo.db.batch([sessionStatement(key,live),repo.sql('UPDATE sms_conversations SET data_json=?,updated_at=? WHERE record_key=?',JSON.stringify(c),now().toISOString(),'sms-live-conversations/'+live.conversation),sourceStatement(live.opportunity,{...x.saved,status:live.status,revision:live.revision,opened_at:live.opened_at,completed_at:live.completed_at||null,decision_2:live.step.decision_2,priority:live.step.priority||null},now().toISOString())]);
   }return view(live);});},
  async answer(token,v){const {key,s}=await load(token);return locked(s.conversation,async()=>{const live=await tokens.get(key),x=await available(live);if(live.revision!==v.revision||live.status!=='active')fail('This check-in changed. Resume before answering.');
    if(x.facts.explicit_call_request||x.facts.explicit_quote_request||x.facts.callback_date)fail('Your callback or action request takes priority. Resume to see the next step.');
    if((x.c.signal?.revision||0)!==live.context_revision)fail('New conversation evidence arrived. Resume before answering.');
    const at=now().toISOString();let step;
    const interrupts={call:['CALL','HIGH'],urgent:['CALL','URGENT'],quote:['CALL','HIGH'],later:['LATER','MEDIUM'],negative:['CLOSE','LOW'],stop:['STOP','LOW']};
    if(v.action){if(!interrupts[v.action])fail('Unsupported choice.');const [decision_2,priority]=interrupts[v.action];step={done:true,decision_2,priority,recommended_az_stage:{CALL:'ENGAGED',LATER:'FUTURE_BIND',CLOSE:'CLOSED',STOP:'STOP'}[decision_2]};if(v.action==='later'&&v.future_date){if(!/^\d{4}-\d{2}-\d{2}$/.test(v.future_date)||!Number.isFinite(Date.parse(v.future_date))||v.future_date<at.slice(0,10))fail('Choose a current or future date.');live.future_date=v.future_date;}}
    else {const latest=continueStep(continueSignals(x.facts,{...x.fresh,...live.submitted},now()),live.answers.length,now());if(latest.done||latest.question.id!==v.question_id||live.step.question?.id!==v.question_id)fail('Known evidence changed. Resume to get the next useful question.');const previous=live.signals;live.signals=applyContinueChoice(latest.question?continueSignals(x.facts,{...x.fresh,...live.submitted},now()):live.signals,latest.question,v.code);for(const [field,value] of Object.entries(live.signals))if(value!==previous[field]){live.submitted[field]=value;live.provenance||={};live.provenance[field]={source:'signal_continue',observed_at:at};}live.answers.push({question_id:v.question_id,code:v.code,at});step=continueStep(live.signals,live.answers.length,now());}
    live.started_at||=at;live.step=step;live.revision++;live.status=step.done?'completed':'active';if(step.done)live.completed_at=at;
    const summary={key,status:live.status,revision:live.revision,offered_at:live.created_at,sent_at:live.sent_at,opened_at:live.opened_at,started_at:live.started_at,completed_at:live.completed_at||null,answers:live.answers,signals:live.submitted,provenance:live.provenance||{},decision_2:step.decision_2,priority:step.priority||'MEDIUM',recommended_az_stage:step.recommended_az_stage||'ENGAGED',future_date:live.future_date||null};
    let c=x.c;if(v.action==='stop')c=applySmsConsentCommand(c,'STOP',{occurredAt:at});
    c.signal={...c.signal,managed:true,...(step.done?{automation_lock:true,human_required:step.decision_2==='CALL'}:{}),revision:(c.signal?.revision||0)+1,reply:'',draft_status:'none',continue_active:!step.done,continue_expires_at:live.expires_at,continue_key:key,decision_2:step.decision_2,priority:step.priority||'MEDIUM',reason:step.done?'Signal Continue updated the next action.':'Prospect is continuing asynchronously.',az_recommended_stage:summary.recommended_az_stage,az_sync_status:'pending',...(live.future_date?{future_date:live.future_date}:{}),...(v.action==='stop'?{contact_suppressed:true}:{})};
    const learned={};if(live.submitted.autoNeed)learned.shopping_reason=live.submitted.autoNeed;if(live.submitted.reviewReason)learned.shopping_reason=live.submitted.reviewReason;if(live.submitted.shoppingIntent)learned.shopping_intent=live.submitted.shoppingIntent;
    c.signal.facts={...x.facts,...learned,...(live.future_date?{future_date:live.future_date}:{}),...(v.action==='call'?{explicit_call_request:true}:{}),...(v.action==='quote'?{explicit_quote_request:true}:{})};
    c.signal.fact_provenance={...c.signal.fact_provenance,...Object.fromEntries(Object.keys(learned).map(k=>[k,{source:'signal_continue',observed_at:at}]))};
    live.context_revision=c.signal.revision;
    const statements=[sessionStatement(key,live),sourceStatement(s.opportunity,summary,at),repo.sql('UPDATE sms_conversations SET data_json=?,updated_at=? WHERE record_key=?',JSON.stringify(c),at,'sms-live-conversations/'+s.conversation)];
    // Existing evidence-source primitive, same opportunity: no new lead record.
    statements.push(repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,'lead',CONTINUE_KIND+':'+s.opportunity,s.opportunity,JSON.stringify({context:{...live.submitted,product:live.signals.product,reviewTrack:live.signals.product,evidenceOrigin:'signal_continue'},consent:{},provenance:summary.provenance}),at));
    const eventId='continue_'+(await sha256Hex(key+':'+live.revision)).slice(0,40);
    statements.push(repo.sql('INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)',eventId,w,s.opportunity,'prospect','signal_continue_answer',eventId,eventId,JSON.stringify({question_id:v.question_id||null,action:v.action||null,decision_2:step.decision_2,fields:Object.keys(live.submitted),completed:step.done}),at));
    await repo.db.batch(statements);const priority=await repo.refreshOpportunityPriority(s.opportunity);live.priority_after=priority?{score:priority.score,scoreMin:priority.scoreMin,scoreMax:priority.scoreMax,engine:priority.engine}:null;await save(key,live);return view(live);
   });},
  async draft(id){const x=await context(id);if(x.population!=='DISTRICT_SIGNAL'||x.owner.compliance)return null;const s=x.saved?.key?await tokens.get(x.saved.key):null;return s&&validContinueSession(s,now().getTime())?{revision:s.revision,status:s.status,draft:s.status==='draft'?s.draft:null}:null;}
 };
}
