import {CONDO_QUESTIONS,condoDecision,condoFacts,condoSummary,condoQualified} from './condo-journey.mjs';
import {distributionOrigin} from './distribution-preview.mjs';
import {BUYER_QUESTIONS,buyerDecision,buyerFacts,buyerSummary} from './buyer-journey.mjs';
import {normalizeDistribution} from './distribution-contract.mjs';
import {deriveSignalDecision,SIGNAL_QUESTION_LIBRARY} from './signal-decision-core.mjs';
import {createPvxWebResumeToken,pvxWebJourneyKey} from './pvx-web-journey-core.mjs';
import {normalizeLeadPayload,upsertLeadJourney,retentionExpiresAt} from './lead-operations-core.mjs';
import {projectSoloDeskEvent} from './solo-desk-event-projection.mjs';
import {randomBase64Url} from './runtime-crypto.mjs';
import {sha256Hex} from './runtime-crypto.mjs';
import {smsLiveConversationId} from './sms-outbound-gateway.mjs';

// Same PVX record primitive, with a distinct cookie so legacy PVX update APIs
// cannot mutate this execution. No separate lead exists before permission.
export const DISTRIBUTION_COOKIE='cf_distribution_resume';
const TTL=7*86400000;
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const origins=new Set(['https://408farmers.com','https://www.408farmers.com','https://coveragefit.com','https://www.coveragefit.com']);
const date=options=>new Date(options.now||Date.now());
const problem=(status)=>{const e=new Error('Review unavailable');e.status=status;throw e;};
const strict=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))problem(422);};
function decide(record,now){if(record.condoFlowVersion===1)return condoDecision(record,now);if(record.buyerFlowVersion===1)return buyerDecision(record,now);return deriveSignalDecision({signalSessionId:record.journeyId,flowId:'distribution_'+record.distribution.entry,
  canonicalSignals:record.signals,attribution:record.distribution.attribution,
  presentationContext:record.distribution.audience==='homebuyer'?'homebuyer':record.distribution.audience==='condo'?'condo':''},now).public;}
function publicState(record,now){
  if(record.contact) return {ok:true,revision:record.revision,complete:true,contactSubmitted:true,message:record.contact.delivered?'Thanks — your request reached Dylan’s workspace. He can pick up from what you shared.':'Your request is saved. Please retry delivery or contact Dylan directly.',deliveryPending:!record.contact.delivered};
  const d=decide(record,now);
  return {ok:true,revision:record.revision,canBack:record.answers.length>0,contactChoice:record.distribution.contactChoice,
    ...(record.buyerFlowVersion===1?{buyer:true,urgent:buyerFacts(record,now).urgency==='urgent'}:{}),
    ...(record.condoFlowVersion===1?{condo:true,urgent:condoFacts(record,now).urgency==='urgent'}:{}),
    question:d.nextQuestion?{id:d.nextQuestion.id,prompt:d.nextQuestion.prompt,...(d.nextQuestion.input?{input:d.nextQuestion.input,hint:d.nextQuestion.hint,value:(record.condoFlowVersion===1?record.condo?.propertyZip:record.buyer?.propertyZip)||''}:{}),options:d.nextQuestion.options.map(o=>({code:o.code,label:o.label}))}:null,
    message:d.publicExperience?.headline||'',description:d.publicExperience?.body||'',complete:!d.nextQuestion};
}
async function load(request,options){
  const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(DISTRIBUTION_COOKIE+'='))?.slice(DISTRIBUTION_COOKIE.length+1);
  if(!/^pvxw_[A-Za-z0-9_-]{43}$/.test(token||''))return null;
  const key=await pvxWebJourneyKey(token),record=await options.store.get(key);
  return record?.seed?.journey?.experience==='canonical_signal' && Date.parse(record.expiresAt)>date(options).getTime()?{key,record,token,reviewVersion:await sha256Hex('distribution-review-version|'+token)}:null;
}
function stateFor(loaded,now){return {...publicState(loaded.record,now),reviewVersion:loaded.reviewVersion,reviewAudience:loaded.record.distribution.entry};}
async function save(loaded,next,options){
  // Compare the exact previous JSON, not a browser-supplied identity or cohort.
  const result=await options.db.prepare('UPDATE pvx_records SET data_json=?,updated_at=?,expires_at=COALESCE(?,expires_at) WHERE record_key=? AND data_json=?')
    .bind(JSON.stringify(next),next.updatedAt,next.contact?.retainedUntil||null,loaded.key,JSON.stringify(loaded.record)).run();
  if(Number(result.meta?.changes)!==1)problem(409);
}
function createJourney(distribution,now,immediate){
  const at=now.toISOString();
  return {recordType:'pvx_web_journey',schemaVersion:'1.0',journeyId:'pvxj_'+crypto.randomUUID().replaceAll('-',''),
      ...(immediate&&distribution.entry==='buyer'?{buyerFlowVersion:1,buyer:{}}:{}),
      ...(immediate&&distribution.entry==='condo'?{condoFlowVersion:1,condo:{}}:{}),
      seed:{journey:{experience:'canonical_signal'}},distribution,signals:distribution.evidence,answers:[],revision:0,
      firstTouch:{...distribution.attribution,occurredAt:distribution.occurredAt},currentChannel:distribution.presentation,lastTouchChannel:distribution.presentation,
      createdAt:at,updatedAt:at,expiresAt:new Date(now.getTime()+TTL).toISOString()};
}
export async function distributionEntry(request,options={}){
  if(request.method!=='POST')return json({ok:false},405);
  let own;try{own=distributionOrigin(request,options.env);}catch{return json({ok:false},503);}
  if(own.endsWith('.coveragefit.pages.dev')?request.headers.get('origin')!==own:!origins.has(request.headers.get('origin')))return json({ok:false},403);
  try{
    const raw=await request.text();if(raw.length>8192)problem(413);
    const input=request.headers.get('content-type')?.includes('application/json')?JSON.parse(raw):JSON.parse(new URLSearchParams(raw).get('handoff')||'null');
    const now=date(options),distribution=normalizeDistribution(input,now);
    // Preserve the old buyer handoff; immediate entry uses the shared route contract.
    if((!options.immediate&&distribution.entry!=='buyer')||distribution.contactChoice==='callback')problem(422);
    if(!options.store||!options.db)problem(503);
    const aliasKey='pvx/web-bootstrap/distribution/'+await sha256Hex(distribution.bootstrapId);
    const fingerprint=await sha256Hex(JSON.stringify({...distribution,receivedAt:undefined}));
    const alias=await options.store.get(aliasKey);
    if(alias && Date.parse(alias.expiresAt)>now.getTime()){
      if(alias.fingerprint!==fingerprint)problem(409);
      return new Response(null,{status:303,headers:{...headers,Location:'/check-in/',
        'Set-Cookie':`${DISTRIBUTION_COOKIE}=${alias.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor((Date.parse(alias.expiresAt)-now)/1000)}`}});
    }
    const token=createPvxWebResumeToken(),key=await pvxWebJourneyKey(token),at=now.toISOString();
    const record=createJourney(distribution,now,options.immediate);
    await options.store.setJSON(key,record,{onlyIfNew:true,metadata:{recordType:record.recordType,createdAt:at,expiresAt:record.expiresAt}});
    try{await options.store.setJSON(aliasKey,{token,fingerprint,expiresAt:record.expiresAt},{onlyIfNew:true,metadata:{expiresAt:record.expiresAt}});}
    catch(e){
      // A concurrent POST won. Reuse its capability; never replace it.
      const winner=await options.store.get(aliasKey);
      if(!winner||Date.parse(winner.expiresAt)<=now.getTime())throw e;
      await options.store.delete(key);
      if(winner.fingerprint!==fingerprint)problem(409);
      return new Response(null,{status:303,headers:{...headers,Location:'/check-in/',
        'Set-Cookie':`${DISTRIBUTION_COOKIE}=${winner.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor((Date.parse(winner.expiresAt)-now)/1000)}`}});
    }
    return new Response(null,{status:303,headers:{...headers,Location:'/check-in/',
      'Set-Cookie':`${DISTRIBUTION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL/1000}`}});
  }catch(e){
    if(!request.headers.get('content-type')?.includes('application/json'))return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Continue with Dylan — CoverageFit</title><main><h1>Let’s pick up with Dylan</h1><p>We couldn’t open this review. Please return to the page Dylan shared or contact him directly.</p><p>Dylan Haysbert · Insurance Producer<br>Virginia Tam Insurance Agency, Inc. · CA License #4528400</p><a href="/support/">Contact Dylan</a></main></html>',{status:e.status||422,headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});
    return json({ok:false,message:'We could not open this review. Please return to the page Dylan shared or contact him directly.'},e.status||422);
  }
}
async function deliver(loaded,options){
  const r=loaded.record,c=r.contact,at=c.at,s=r.signals,a=r.distribution.attribution;
  const normalized=normalizeLeadPayload({lead_checkpoint_id:'408d_'+r.journeyId,lead_stage:'contact_requested',first_name:c.name,phone:c.phone,
    contact_consent:true,consent_version:'distribution-contact-v1',consent_at:at,automated_marketing_sms_consent:false,
    source_key:r.distribution.operationalSourceKey||a.sourceKey,route_path:a.landingPage,campaign_id:a.campaignId,campaign_variant:a.campaignVariant,
    partner_id:a.partnerId,creative:a.creative,utm_source:a.utmSource,utm_medium:a.utmMedium,utm_campaign:a.utmCampaign,utm_content:a.utmContent,utm_term:a.utmTerm,
    review_track:s.product,review_reason:s.reviewReason,shopping_intent:s.shoppingIntent,decision_timing:s.decisionTiming,
    stated_trigger:s.statedTrigger,closing_date:s.closingDate,property_type:s.propertyType,renewal_timing:s.renewalTiming});
  if(!normalized.valid)problem(422);
  const v=normalized.value;
  v.attribution={...v.attribution,sourceKey:a.sourceKey,sourceFamily:a.sourceFamily,audience:r.distribution.audience,marketContext:r.distribution.marketContext,occurredAt:r.distribution.occurredAt,referralContext:r.distribution.referralContext};
  v.context.distribution={version:r.distribution.version,journeyId:r.journeyId,evidenceSource:'consumer_answer',answers:r.answers,initialEvidence:r.distribution.evidence};
  v.context.housing=r.distribution.knownContext.housing||'';
  v.context.distribution.knownContext=r.distribution.knownContext;
  v.context.distribution.phase='producer_handoff';
  if(r.buyerFlowVersion===1){v.context.distribution.buyer=buyerFacts(r,date(options));v.context.buyerUrgency=v.context.distribution.buyer.urgency;v.context.buyerSummary=buyerSummary(r,date(options));}
  if(r.condoFlowVersion===1){v.context.distribution.condo=condoFacts(r,date(options));v.context.condoSummary=condoSummary(r,date(options));}
  // Exact relationship capability derived server-side, not an inbound field.
  // Missing provider configuration leaves continuation unavailable. No SMS is sent.
  try{v.context.distribution.conversation_id=await smsLiveConversationId(c.phone,options.env?.RINGCENTRAL_FROM_NUMBER,options.env?.RINGCENTRAL_CONVERSATION_HASH_SECRET);}catch{}
  v.context.distribution.firstTouch=r.firstTouch;v.context.distribution.currentChannel=r.currentChannel;v.context.distribution.lastTouchChannel=r.lastTouchChannel;
  v.context.reviewContext=(r.distribution.presentation==='paid_agency'?'CoverageFit ':'408FARMERS ')+a.landingPage+' — requested '+c.mode+(r.buyerFlowVersion===1?' — '+buyerSummary(r,date(options)):r.condoFlowVersion===1?' — '+condoSummary(r,date(options)):'');
  v.consent.agencyContact.callPermitted=c.mode==='call';v.consent.agencyContact.personalTextPermitted=c.mode==='text';
  v.consent.agencyContact.scope='requested_review_'+c.mode;
  // Explicit first-party provenance is recorded; this does not create an SMS
  // journey, override suppression, or alter a district enrollment.
  v.context.smsOwnership={owner:'FIRST_PARTY_408',basis:'explicit_web_handoff'};
  const result=await upsertLeadJourney(options.store,v,{env:options.env,now:at});
  const projected=await (options.project||projectSoloDeskEvent)({db:options.db,env:options.env},{kind:'lead',record:result.record});
  if(!projected.ok)return json({...stateFor(loaded,date(options)),ok:false},503);
  const next={...r,contact:{...c,delivered:true,recoveryState:'delivered'},revision:r.revision+1,updatedAt:date(options).toISOString()};
  try{await save(loaded,next,options);}catch(error){
    // Concurrent reconciliation/retry may have completed this exact handoff.
    const winner=await options.store.get(loaded.key);
    if(error.status!==409||!winner?.contact?.delivered)throw error;
    return json(stateFor({...loaded,record:winner},date(options)));
  }
  await event(next.distribution,'producer_handoff',options).catch(()=>{});
  // First-party measurement only; never transmit intake or identity to ad vendors.
  if(next.condoFlowVersion===1&&condoQualified(next,date(options)))await event(next.distribution,'condo_qualified_request_accepted',options).catch(()=>{});
  const buyer=next.buyerFlowVersion===1?buyerFacts(next,date(options)):null;
  if(buyer&&/^9\d{4}$/.test(buyer.propertyZip||'')&&['single_family','condo','townhome'].includes(buyer.propertyType)&&['urgent','near_term','upcoming','longer_term'].includes(buyer.urgency))await event(next.distribution,'buyer_qualified_request_accepted',options).catch(()=>{});
  return json(stateFor({...loaded,record:next},date(options)));
}
export async function distributionJourney(request,options={}){
  try{distributionOrigin(request,options.env);}catch{return json({ok:false},503);}
  if(request.method!=='POST')return json({ok:false},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false},403);
  try{
    const raw=await request.text();if(raw.length>4096)problem(413);
    const body=JSON.parse(raw);strict(body,['action','revision','questionId','code','name','phone','mode','permission','value','contactTime','reviewVersion']);
    const loaded=await load(request,options);if(!loaded)problem(404);
    const r=loaded.record,now=date(options);
    if(body.action==='load')return json(stateFor(loaded,now));
    if((body.reviewVersion||r.requiresReviewVersion)&&body.reviewVersion!==loaded.reviewVersion)return json({ok:false,reviewChanged:true,message:'A different review is active in this browser. Reload to continue.'},409);
    if(body.action==='retry_delivery' && r.contact && !r.contact.delivered)return await deliver(loaded,options);
    if(r.contact)return json(stateFor(loaded,now));
    if(body.revision!==r.revision)problem(409);
    let next={...r,revision:r.revision+1,updatedAt:now.toISOString()};
    if(body.action==='answer'){
      const d=decide(r,now),q=(r.condoFlowVersion===1?CONDO_QUESTIONS:r.buyerFlowVersion===1?BUYER_QUESTIONS:SIGNAL_QUESTION_LIBRARY)[d.nextQuestionId];
      if(!q||q.id!==body.questionId||r.answers.length>=7)problem(422);
      let option=q.options.find(o=>o.code===body.code);
      if(q.input==='zip'&&body.code==='zip'){const zip=String(body.value||'').trim();if(!/^9\d{4}$/.test(zip)||Number(zip)<90001||Number(zip)>96162)problem(422);option={code:'zip',signals:{},[r.condoFlowVersion===1?'condo':'buyer']:{propertyZip:zip}};}
      if(!option)problem(422);
      if(r.buyerFlowVersion===1)next.buyer={...r.buyer,...option.buyer};
      if(r.condoFlowVersion===1)next.condo={...r.condo,...option.condo};
      next.signals={...r.signals,...option.signals};
      next.answers=[...r.answers,{questionId:q.id,optionCode:option.code,signals:option.signals,...(option.buyer?{buyer:option.buyer}:{}),...(option.condo?{condo:option.condo}:{}),source:'coveragefit_signal',occurredAt:now.toISOString()}];
    }else if(body.action==='back'){
      if(!r.answers.length)problem(422);
      next.answers=r.answers.slice(0,-1);next.signals=Object.assign({},r.distribution.evidence,...next.answers.map(a=>a.signals));
      if(r.buyerFlowVersion===1)next.buyer=Object.assign({},...next.answers.map(a=>a.buyer||{}));
      if(r.condoFlowVersion===1)next.condo=Object.assign({},...next.answers.map(a=>a.condo||{}));
    }else if(body.action==='contact'){
      const phone=String(body.phone||'').replace(/\D/g,'').replace(/^1(?=\d{10}$)/,''),name=String(body.name||'').trim();
      if(body.permission!==true||!['call','text'].includes(body.mode)||!/^\d{10}$/.test(phone)||!name||name.length>80||/[<>\x00-\x1f]/.test(name))problem(422);
      if(body.contactTime&&!['morning','afternoon','evening','anytime'].includes(body.contactTime))problem(422);
      next.contact={name,phone,mode:body.mode,...(body.contactTime?{contactTime:body.contactTime}:{}),at:now.toISOString(),retainedUntil:retentionExpiresAt(now,options.env),delivered:false};
    }else problem(422);
    await save(loaded,next,options);
    if(body.action==='answer'){
      if(next.answers.length===1){await event(next.distribution,'first_answer',options).catch(()=>{});await event(next.distribution,'signal_session_started',options).catch(()=>{});}
      if(next.answers.length===2)await event(next.distribution,'second_answer',options).catch(()=>{});
      if(!decide(next,now).nextQuestion)await event(next.distribution,'signal_session_completed',options).catch(()=>{});
    }
    if(next.contact)await event(next.distribution,'contact_requested',options).catch(()=>{});
    return next.contact?await deliver({...loaded,record:next},options):json(stateFor({...loaded,record:next},now));
  }catch(e){return json({ok:false,message:e.status===409?'Your review changed. Reload to continue with the saved answers.':'This review is unavailable. Please retry or contact Dylan directly.'},e.status||503);}
}

async function event(distribution,type,options){
  const key='pvx/acquisition-event/'+await sha256Hex(distribution.bootstrapId+'|'+type),at=date(options).toISOString();
  if(await options.store.get(key))return;
  const value={recordType:'acquisition_event',version:'entry-1.0',type,at,firstTouch:distribution.attribution,route:distribution.route,
    presentation:distribution.presentation,marketContext:distribution.marketContext,visit:await sha256Hex(distribution.bootstrapId)};
  try{await options.store.setJSON(key,value,{onlyIfNew:true,metadata:{recordType:value.recordType,createdAt:at,expiresAt:new Date(date(options).getTime()+90*86400000).toISOString()}});}catch(e){if(!await options.store.get(key))throw e;}
}
export function distributionPresentation(input,now=new Date()){
  const distribution=normalizeDistribution(input,now);
  return publicState({journeyId:'entry_presentation',...(distribution.entry==='buyer'?{buyerFlowVersion:1,buyer:{}}:{}),...(distribution.entry==='condo'?{condoFlowVersion:1,condo:{}}:{}),distribution,signals:distribution.evidence,answers:[],revision:0},now);
}
export async function distributionInteract(request,options={}){
  try{distributionOrigin(request,options.env);}catch{return json({ok:false},503);}
  if(request.method!=='POST')return json({ok:false},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false},403);
  try{
    const raw=await request.text();if(raw.length>8192)problem(413);const body=JSON.parse(raw);
    if(body.action==='new_review')return await startNewReview(request,body,options);
    if(body.action!=='start')return distributionJourney(new Request(request.url,{method:'POST',headers:request.headers,body:raw}),options);
    strict(body,['action','handoff','questionId','code']);
    if((await load(request,options))?.record.requiresReviewVersion)return json({ok:false,reviewChanged:true,message:'A different review is active in this browser. Reload to continue.'},409);
    const distribution=normalizeDistribution(body.handoff,date(options)),state=distributionPresentation(body.handoff,date(options));
    if(state.question?.id!==body.questionId||!state.question.options.some(o=>o.code===body.code))problem(422);
    const start=await distributionEntry(new Request(request.url,{method:'POST',headers:{Origin:new URL(request.url).origin,'Content-Type':'application/json'},body:JSON.stringify(body.handoff)}),{...options,immediate:true});
    if(start.status!==303)return start;
    const cookie=start.headers.get('set-cookie'),cookieHeader=cookie?.split(';')[0];
    if(!cookieHeader)problem(503);
    const h={Origin:new URL(request.url).origin,'Content-Type':'application/json',Cookie:cookieHeader};
    const loaded=await load(new Request(request.url,{headers:h}),options);
    let response;
    if(loaded.record.answers.length){
      if(loaded.record.answers[0].questionId!==body.questionId||loaded.record.answers[0].optionCode!==body.code)problem(409);
      response=json(stateFor(loaded,date(options)));
    }else response=await distributionJourney(new Request(request.url,{method:'POST',headers:h,body:JSON.stringify({action:'answer',revision:loaded.record.revision,questionId:body.questionId,code:body.code})}),options);
    const out=new Headers(response.headers);out.set('Set-Cookie',cookie);
    return new Response(response.body,{status:response.status,headers:out});
  }catch(e){return json({ok:false,message:'We couldn’t save that answer. Please retry or contact Dylan.'},e.status||503);}
}
export async function distributionEvent(request,options={}){
  try{distributionOrigin(request,options.env);}catch{return json({ok:false},503);}
  if(request.method!=='POST'||request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false},403);
  try{
    const raw=await request.text();if(raw.length>8192)problem(413);const body=JSON.parse(raw);strict(body,['type','handoff']);
    if(!['landing_view','first_question_view','abandon'].includes(body.type))problem(422);
    const existing=await load(request,options);
    const distribution=existing?.record.distribution||normalizeDistribution(body.handoff,date(options));
    if(body.type==='abandon'&&(!existing?.record.answers.length||existing.record.contact||!decide(existing.record,date(options)).nextQuestion))problem(422);
    await event(distribution,body.type,options);
    return json({ok:true});
  }catch(e){return json({ok:false},e.status||422);}
}

// Bounded operator-triggered reconciliation, invoked by the existing lead sync.
// No cron, provider delivery, token exposure, or new queue. Resume expiration is
// separate from explicitly consented request retention. Failed rows rotate so a
// permanent error cannot starve later requests.
export async function reconcileDistributionContacts(options={}){
  const where="record_key LIKE 'pvx/web-journey/%' AND json_extract(data_json,'$.seed.journey.experience')='canonical_signal' AND json_extract(data_json,'$.contact.delivered')=0 AND (expires_at IS NULL OR expires_at>?)";
  const at=date(options).toISOString();
  const rows=(await options.db.prepare(`SELECT record_key,data_json FROM pvx_records WHERE ${where} ORDER BY updated_at,record_key LIMIT 10`).bind(at).all()).results||[];
  let recovered=0,failed=0;
  for(const row of rows){
    const record=JSON.parse(row.data_json),loaded={key:row.record_key,record};
    try{
      if(!record.contact?.at||!['call','text'].includes(record.contact.mode))throw Error('invalid_contact');
      const response=await deliver(loaded,options);
      if(!response.ok)throw Error('handoff_pending');
      recovered++;
    }catch{
      failed++;
      // Preserve the saved permission and inputs. Never store exception text.
      const next={...record,updatedAt:at,contact:{...record.contact,lastRecoveryAt:at,recoveryState:'pending'}};
      try{await save(loaded,next,options);}catch{/* A concurrent delivery wins. */}
    }
  }
  const pending=Number((await options.db.prepare(`SELECT count(*) n FROM pvx_records WHERE ${where}`).bind(at).first())?.n||0);
  return {attempted:rows.length,recovered,failed,pending};
}


async function startNewReview(request,body,options){
  strict(body,['action','handoff','reviewVersion']);
  const previous=await load(request,options);if(!previous)problem(404);
  if(body.reviewVersion!==previous.reviewVersion)return json({ok:false,reviewChanged:true,message:'A different review is active in this browser. Reload to continue.'},409);
  if(!previous.record.contact?.delivered)return json({...stateFor(previous,date(options)),ok:false,message:previous.record.contact?'Your saved request still needs delivery. Retry delivery before starting another review.':'Finish this review before starting another.'},409);
  const now=date(options);
  // Validate the current landing-page contract; never inherit old answers,
  // consent or campaign context from the completed record.
  normalizeDistribution(body.handoff,now);
  const handoff={...body.handoff,bootstrapId:'pvxb_'+randomBase64Url(32),occurredAt:now.toISOString(),evidence:{},knownContext:{},contactChoice:''};
  const distribution=normalizeDistribution(handoff,now);
  const fingerprint=await sha256Hex(JSON.stringify({...distribution,bootstrapId:undefined,receivedAt:undefined,occurredAt:undefined}));
  const aliasKey='pvx/web-bootstrap/new-review/'+await sha256Hex(previous.token);
  const token=createPvxWebResumeToken(),key=await pvxWebJourneyKey(token),at=now.toISOString();
  const record={...createJourney(distribution,now,true),requiresReviewVersion:true};
  const alias={token,fingerprint,expiresAt:record.expiresAt};
  // D1 batch is atomic. One rotation per predecessor capability, even when
  // separate tabs submit concurrently. Neither statement changes the old row.
  await options.db.batch([
    options.db.prepare("INSERT INTO pvx_records(record_key,data_json,metadata_json,created_at,updated_at,expires_at) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM pvx_records WHERE record_key=?)")
      .bind(key,JSON.stringify(record),JSON.stringify({recordType:record.recordType}),at,at,record.expiresAt,aliasKey),
    options.db.prepare("INSERT OR IGNORE INTO pvx_records(record_key,data_json,metadata_json,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?)")
      .bind(aliasKey,JSON.stringify(alias),'{}',at,at,record.expiresAt)
  ]);
  const winner=await options.store.get(aliasKey);
  if(!winner||winner.fingerprint!==fingerprint)return json({ok:false,reviewChanged:true,message:'Another tab started a review. Reload to continue.'},409);
  const active=await load(new Request(request.url,{headers:{Cookie:DISTRIBUTION_COOKIE+'='+winner.token}}),options);if(!active)problem(503);
  const out=new Headers(headers);out.set('Set-Cookie',`${DISTRIBUTION_COOKIE}=${winner.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0,Math.floor((Date.parse(active.record.expiresAt)-now)/1000))}`);
  return Response.json({...stateFor(active,now),newReview:true},{headers:out});
}
