import {normalizeDistribution} from './distribution-contract.mjs';
import {deriveSignalDecision,SIGNAL_QUESTION_LIBRARY} from './signal-decision-core.mjs';
import {createPvxWebResumeToken,pvxWebJourneyKey} from './pvx-web-journey-core.mjs';
import {normalizeLeadPayload,upsertLeadJourney} from './lead-operations-core.mjs';
import {projectSoloDeskEvent} from './solo-desk-event-projection.mjs';
import {sha256Hex} from './runtime-crypto.mjs';

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
function decide(record,now){return deriveSignalDecision({signalSessionId:record.journeyId,flowId:'distribution_'+record.distribution.entry,
  canonicalSignals:record.signals,attribution:record.distribution.attribution},now).public;}
function publicState(record,now){
  if(record.contact) return {ok:true,revision:record.revision,complete:true,contactSubmitted:true,message:record.contact.delivered?'Thanks — your request reached Dylan’s workspace. He can pick up from what you shared.':'Your request is saved. Please retry delivery or contact Dylan directly.',deliveryPending:!record.contact.delivered};
  const d=decide(record,now);
  return {ok:true,revision:record.revision,canBack:record.answers.length>0,contactChoice:record.distribution.contactChoice,
    question:d.nextQuestion?{id:d.nextQuestion.id,prompt:d.nextQuestion.prompt,options:d.nextQuestion.options.map(o=>({code:o.code,label:o.label}))}:null,
    message:d.publicExperience?.headline||'',description:d.publicExperience?.body||'',complete:!d.nextQuestion};
}
async function load(request,options){
  const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(DISTRIBUTION_COOKIE+'='))?.slice(DISTRIBUTION_COOKIE.length+1);
  if(!/^pvxw_[A-Za-z0-9_-]{43}$/.test(token||''))return null;
  const key=await pvxWebJourneyKey(token),record=await options.store.get(key);
  return record?.seed?.journey?.experience==='canonical_signal' && Date.parse(record.expiresAt)>date(options).getTime()?{key,record,token}:null;
}
async function save(loaded,next,options){
  // Compare the exact previous JSON, not a browser-supplied identity or cohort.
  const result=await options.db.prepare('UPDATE pvx_records SET data_json=?,updated_at=? WHERE record_key=? AND data_json=?')
    .bind(JSON.stringify(next),next.updatedAt,loaded.key,JSON.stringify(loaded.record)).run();
  if(Number(result.meta?.changes)!==1)problem(409);
}
export async function distributionEntry(request,options={}){
  if(request.method!=='POST')return json({ok:false},405);
  if(!origins.has(request.headers.get('origin')))return json({ok:false},403);
  try{
    const raw=await request.text();if(raw.length>8192)problem(413);
    const input=request.headers.get('content-type')?.includes('application/json')?JSON.parse(raw):JSON.parse(new URLSearchParams(raw).get('handoff')||'null');
    const now=date(options),distribution=normalizeDistribution(input,now);
    // Buyer is the only candidate. Other routes remain dependency-gated.
    if(distribution.entry!=='buyer'||distribution.evidence.product!=='home'||distribution.contactChoice==='callback')problem(422);
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
    const record={recordType:'pvx_web_journey',schemaVersion:'1.0',journeyId:'pvxj_'+crypto.randomUUID().replaceAll('-',''),
      seed:{journey:{experience:'canonical_signal'}},distribution,signals:distribution.evidence,answers:[],revision:0,
      createdAt:at,updatedAt:at,expiresAt:new Date(now.getTime()+TTL).toISOString()};
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
    source_key:a.sourceKey,route_path:a.landingPage,campaign_id:a.campaignId,campaign_variant:a.campaignVariant,
    partner_id:a.partnerId,creative:a.creative,utm_source:a.utmSource,utm_medium:a.utmMedium,utm_campaign:a.utmCampaign,utm_content:a.utmContent,utm_term:a.utmTerm,
    review_track:s.product,review_reason:s.reviewReason,shopping_intent:s.shoppingIntent,decision_timing:s.decisionTiming,
    stated_trigger:s.statedTrigger,closing_date:s.closingDate,property_type:s.propertyType,renewal_timing:s.renewalTiming});
  if(!normalized.valid)problem(422);
  const v=normalized.value;
  v.attribution={...v.attribution,sourceFamily:a.sourceFamily,audience:r.distribution.audience,occurredAt:r.distribution.occurredAt,referralContext:r.distribution.referralContext};
  v.context.distribution={version:r.distribution.version,journeyId:r.journeyId,evidenceSource:'consumer_answer',answers:r.answers,initialEvidence:r.distribution.evidence};
  v.context.housing=r.distribution.knownContext.housing||'';
  v.context.distribution.knownContext=r.distribution.knownContext;
  v.context.reviewContext='408FARMERS '+a.landingPage+' — requested '+c.mode;
  v.consent.agencyContact.callPermitted=c.mode==='call';v.consent.agencyContact.personalTextPermitted=c.mode==='text';
  v.consent.agencyContact.scope='requested_review_'+c.mode;
  // Explicit first-party provenance is recorded; this does not create an SMS
  // journey, override suppression, or alter a district enrollment.
  v.context.smsOwnership={owner:'FIRST_PARTY_408',basis:'explicit_web_handoff'};
  const result=await upsertLeadJourney(options.store,v,{env:options.env,now:at});
  const projected=await (options.project||projectSoloDeskEvent)({db:options.db,env:options.env},{kind:'lead',record:result.record});
  if(!projected.ok)return json({...publicState(r,date(options)),ok:false},503);
  const next={...r,contact:{...c,delivered:true},revision:r.revision+1,updatedAt:date(options).toISOString()};
  await save(loaded,next,options);
  return json(publicState(next,date(options)));
}
export async function distributionJourney(request,options={}){
  if(request.method!=='POST')return json({ok:false},405);
  if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false},403);
  try{
    const raw=await request.text();if(raw.length>4096)problem(413);
    const body=JSON.parse(raw);strict(body,['action','revision','questionId','code','name','phone','mode','permission']);
    const loaded=await load(request,options);if(!loaded)problem(404);
    const r=loaded.record,now=date(options);
    if(body.action==='load')return json(publicState(r,now));
    if(body.action==='retry_delivery' && r.contact && !r.contact.delivered)return await deliver(loaded,options);
    if(r.contact)return json(publicState(r,now));
    if(body.revision!==r.revision)problem(409);
    let next={...r,revision:r.revision+1,updatedAt:now.toISOString()};
    if(body.action==='answer'){
      const d=decide(r,now),q=SIGNAL_QUESTION_LIBRARY[d.nextQuestionId];
      if(!q||q.id!==body.questionId||r.answers.length>=7)problem(422);
      const option=q.options.find(o=>o.code===body.code);if(!option)problem(422);
      next.signals={...r.signals,...option.signals};
      next.answers=[...r.answers,{questionId:q.id,optionCode:option.code,signals:option.signals,source:'coveragefit_signal',occurredAt:now.toISOString()}];
    }else if(body.action==='back'){
      if(!r.answers.length)problem(422);
      next.answers=r.answers.slice(0,-1);next.signals=Object.assign({},r.distribution.evidence,...next.answers.map(a=>a.signals));
    }else if(body.action==='contact'){
      const phone=String(body.phone||'').replace(/\D/g,'').replace(/^1(?=\d{10}$)/,''),name=String(body.name||'').trim();
      if(body.permission!==true||!['call','text'].includes(body.mode)||!/^\d{10}$/.test(phone)||!name||name.length>80||/[<>\x00-\x1f]/.test(name))problem(422);
      next.contact={name,phone,mode:body.mode,at:now.toISOString(),delivered:false};
    }else problem(422);
    await save(loaded,next,options);
    return next.contact?await deliver({...loaded,record:next},options):json(publicState(next,now));
  }catch(e){return json({ok:false,message:e.status===409?'Your review changed. Reload to continue with the saved answers.':'This review is unavailable. Please retry or contact Dylan directly.'},e.status||503);}
}
