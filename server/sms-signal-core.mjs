// CF-SMS-SIGNAL-1.0: deterministic, context-first decisions. No network or sending.
import { normalizeRenewalTiming } from './aged-lead-reply-core.mjs';
export const SIGNAL_BUILD = 'CF-SMS-SIGNAL-1.0';
export const D2 = Object.freeze(['CALL','ASK_ONE_QUESTION','LATER','CLOSE','STOP']);
export const AZ_STAGES = Object.freeze(['NEW','CONTACT_ATTEMPT','AWAITING_SIGNAL','ENGAGED','QUOTE_READY','QUOTE_SENT','FUTURE_BIND','WON','CLOSED','STOP']);
export const SIGNAL_PREFIX = 'sms-signal/';
export const enabled = env => env?.CF_SMS_SIGNAL_ENABLED === '1';
export const norm = v => String(v || '').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9'\s]/g,' ').replace(/\s+/g,' ').trim();
const seed = (id,family,stage,goal,patterns,purpose) => ({template_id:id,campaign_family:family,template_name:id,message_pattern:patterns,expected_az_stage:stage,purpose,expected_reply_types:['positive','negative','future','opt_out'],default_reply_goal:goal,active:true,version:1,created_at:'2026-09-24T00:00:00Z',updated_at:'2026-09-24T00:00:00Z'});
export const DEFAULT_TEMPLATES = Object.freeze([
 seed('AZ-FRESH-01','AZ-FRESH','CONTACT_ATTEMPT','IDENTIFY_LINE',['is this for auto home or both'],'Identify requested line'),
 seed('AZ-FRESH-02','AZ-FRESH','CONTACT_ATTEMPT','IDENTIFY_LINE',['handle most of this by text','mainly looking at auto home or both'],'FRESH_SECONDARY_CONTACT'),
 seed('AZ-AGED-P1','AZ-AGED-RECOVERY','AWAITING_SIGNAL','DETECT_INTENT',['still open to comparing your insurance','or are you all set now'],'Discover current interest'),
 seed('AZ-AGED-P2','AZ-AGED-RECOVERY','AWAITING_SIGNAL','DETECT_INTENT',["just closing the loop","reply yes","close this out"],'Final recovery probe'),
 seed('AZ-QUOTE-01','AZ-QUOTE-FOLLOWUP','QUOTE_SENT','DETECT_OBJECTION',['options i sent','price coverage or timing'],'Understand quote response'),
 seed('AZ-FUTURE-01','AZ-FUTURE-BIND','FUTURE_BIND','DETECT_INTENT',['you asked me to check back','still a good time'],'Reconnect at agreed timing'),
 seed('AZ-CALLBACK-01','AZ-CALLBACK','ENGAGED','SCHEDULE',['is now a good time','better time today'],'Confirm callback')
]);
export function validateTemplates(rows) {
 if (!Array.isArray(rows)||!rows.length||rows.length>60) throw Error('Provide 1–60 templates.');
 const ids=new Set();
 return rows.map(t=>{
  if(!/^AZ-[A-Z0-9-]{2,60}$/.test(t.template_id)||ids.has(t.template_id)||!AZ_STAGES.includes(t.expected_az_stage)||!Array.isArray(t.message_pattern)||!t.message_pattern.length||t.message_pattern.length>8||t.message_pattern.some(p=>typeof p!=='string'||norm(p).length<12||p.length>300))throw Error('Invalid or duplicate template; use distinctive literal phrases, not regex.');
  if(!['AZ-FRESH','AZ-AGED-RECOVERY','AZ-QUOTE-FOLLOWUP','AZ-FUTURE-BIND','AZ-CALLBACK'].includes(t.campaign_family)||typeof t.default_reply_goal!=='string'||!Number.isInteger(t.version)||t.version<1)throw Error('Template family, reply goal and positive version are required.');
  ids.add(t.template_id);return {...t,active:t.active===true};
 });
}
export function matchTemplate(body,templates=DEFAULT_TEMPLATES) {
 const text=norm(body);const matches=templates.filter(t=>t.active&&t.message_pattern.every(p=>text.includes(norm(p))));
 return matches.length===1?matches[0]:null; // Ambiguous registry matches fail closed.
}
export function compliance(body,context={}) {
 const t=norm(body);
 if(/^(stop|stopall|unsubscribe|cancel|end|quit|dnc)( now| please)?$/.test(t)||/\b(remove me|unsubscribe me|do not (?:text|call|contact|message)|don't (?:text|call|contact|message)|dont (?:text|call|contact|message)|stop (?:texting|calling|contacting|messaging)|leave me alone)\b/.test(t))return 'opt_out';
 const denied=String(body).trim().match(/^(?:[Tt]his (?:isn't|is not)|[Ii](?:'m| am) not)\s+([A-Z][a-z]+(?:[ -][A-Z][a-z]+)?)[.!]?$/);
 const knownName=norm(context.answers?.firstName||context.answers?.name||context.name||'').split(' ')[0];
 const namedDenial=knownName&&t===`this isn't ${knownName}`;
 if(/\b(wrong number|wrong person)\b/.test(t)||namedDenial||(denied&&!/^(what|who|how|why|when|where|interested|sure|ready|available|happy|okay|ok|right|correct|true|working|insurance|auto|home|farmers)$/i.test(denied[1])))return 'wrong_number';
 if(/\b(sent from my car|driving focus|auto reply|automatic reply|out of office)\b/.test(t))return 'automatic_response';
 if(/^(spam|scam)$/.test(t))return 'spam';
 return '';
}
export function observeOutbound(conversation,event,templates=DEFAULT_TEMPLATES) {
 const c=structuredClone(conversation),template=matchTemplate(event.body,templates);
 if(!template)return {conversation:c,matched:false};
 const old=c.signal||{};
 const stage=old.az_recommended_stage||old.az_confirmed_stage;
 const mismatch=['CONTACT_ATTEMPT','AWAITING_SIGNAL'].includes(template.expected_az_stage)&&(old.meaningful_replies>0||['ENGAGED','QUOTE_READY','QUOTE_SENT','FUTURE_BIND','WON','CLOSED','STOP'].includes(stage));
 c.signal={...old,managed:true,revision:(old.revision||0)+1,reply:'',draft_status:'none',source_campaign:template.campaign_family,source_template:template.template_id,source_probe:template.template_id==='AZ-AGED-P1'?1:template.template_id==='AZ-AGED-P2'?2:null,source_message_id:event.messageId,source_outbound_timestamp:event.occurredAt,pending_goal:null,template_goal:template.default_reply_goal,internal_state:old.meaningful_replies?old.internal_state:template.campaign_family==='AZ-FRESH'?'fresh_attempting':template.template_id==='AZ-AGED-P1'?'awaiting_probe_1':template.template_id==='AZ-AGED-P2'?'awaiting_probe_2':template.expected_az_stage==='QUOTE_SENT'?'quote_delivered':template.expected_az_stage==='FUTURE_BIND'?'future_bind':old.internal_state,previous_outbound:event.body,az_inferred_stage:old.az_inferred_stage||template.expected_az_stage,stage_mismatch:old.stage_mismatch||mismatch,...(mismatch?{stage_mismatch_context:{inferred_stage:stage||old.az_inferred_stage||'ENGAGED',observed_template:template.template_id,expected_stage:template.expected_az_stage}}:{}),outreach_count:(old.outreach_count||0)+1,attribution_basis:'normalized_template_inference'};
 return {conversation:c,matched:true,template,mismatch};
}
function timing(raw,now){
 const t=norm(raw),base=new Date(now);let add=null;
 if(/\btoday\b/.test(t))add=0;else if(/\btomorrow\b/.test(t))add=1;else if(/\bnext week\b/.test(t))add=7;else if(/\bnext month\b/.test(t))add=31;
 const weekday=t.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
 if(add===null&&weekday){add=(['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(weekday[1])-base.getUTCDay()+7)%7;if(/\bnext\b/.test(t))add+=7;}
 if(add!==null)return {raw,date:new Date(base.getTime()+add*86400000).toISOString().slice(0,10),approximate:add>1,days:add};
 const iso=raw.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
 let result=iso?{year:+iso[1],month:+iso[2],day:+iso[3]}:normalizeRenewalTiming(raw,{now});
 if(!result?.month)return null;
 const {year,month,day}=result;const d=new Date(Date.UTC(year,month-1,day||1));
 if(d.getUTCFullYear()!==year||d.getUTCMonth()!==month-1||(day&&d.getUTCDate()!==day))return null;
 return {raw,date:day?d.toISOString().slice(0,10):null,month:`${year}-${String(month).padStart(2,'0')}`,approximate:!day||!!result.approximate,days:Math.ceil((d-base)/86400000)};
}
export function extractFacts(body,previous,known={},now='2026-09-24T12:00:00Z',goal='') {
 const t=norm(body),p=norm(previous),f={},evidence={};
 const set=(k,v)=>{f[k]=v;evidence[k]={value:v,observed_at:now,source:'prospect_reply'};};
 const contextualLine=goal==='IDENTIFY_LINE'||/auto home or both|which (?:insurance|line)|what type/.test(p);
 if(contextualLine||/\b(auto|car|home|homeowners) insurance\b/.test(t)){
  if(/\bboth|bundle|home and auto\b/.test(t))set('line','HOME_AUTO');else if(/\b(auto|car)\b/.test(t))set('line','AUTO');else if(/\b(home|homeowners)\b/.test(t))set('line','HOME');
 }
 if(/\b(bundle|home and auto|auto and home)\b/.test(t))set('bundle_interest',true);
 if((t==='text'&&contextualLine)||/\b(?:text me|prefer text|text only|text is easier|text works)\b/.test(t))set('preferred_channel','TEXT');
 if(/\bemail (?:me|only)|prefer email\b/.test(t))set('preferred_channel','EMAIL');
 if(/\b(?:call me|give me a call|can you call|give me a ring)\b/.test(t)&&! /\b(?:don't call|do not call|dont call)\b/.test(t)){set('explicit_call_request',true);if(!f.preferred_channel)set('preferred_channel','CALL');}
 if(/\b(send|prepare|give|want|need)(?: me)? (?:a |the )?quote\b/.test(t))set('explicit_quote_request',true);
 if(/\b(?:already|currently|insured|i'm|im|i am)\b.*\b(?:with|have) farmers\b/.test(t)&&! /\b(?:not|never|no longer)\b/.test(t))set('existing_farmers',true);
 const carrierQuestion=goal==='DETECT_CARRIER'||/who.*insured|who.*(?:with|carrier)/.test(p);
 const carrier=t.match(/\b(geico|aaa|state farm|progressive|allstate|mercury|safeco|liberty mutual|usaa|farmers|travelers|nationwide)\b/);
 if(carrier&&(carrierQuestion||/\b(with|insured|carrier|have)\b/.test(t))&&!/\bnot with|left |leaving |quote from/.test(t))set('current_carrier',carrier[1].toUpperCase());
 const targetMoney=body.match(/(?:under|below|less than|lower than|target(?: is)?|budget(?: is)?)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i);
 if(targetMoney)set('price_target',Number(targetMoney[1].replaceAll(',','')));
 const money=body.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/)||body.match(/(?:pay(?:ing)?|premium(?: is)?|under|below|target)\s*([\d,]+(?:\.\d{1,2})?)/i)||(goal.startsWith('DETECT_PRICE')?body.match(/^\s*([\d,]+(?:\.\d{1,2})?)\s*(?:a month|monthly|per month)?\s*$/i):null);
 if(money&&!targetMoney&&(/pay|premium|price|under|below|target/.test(t)||goal.startsWith('DETECT_PRICE'))){const target=goal==='DETECT_PRICE_TARGET'||/\b(under|below|target|less than)\b/.test(t);set(target?'price_target':'current_premium',Number(money[1].replaceAll(',','')));if(/\b(month|monthly|mo)\b/.test(t))set('premium_period','monthly');else if(/\b(year|annual)\b/.test(t))set('premium_period','annual');else if(/6 months|six months/.test(t))set('premium_period','six_months');}
 const currentMoney=body.match(/(?:pay(?:ing)?|premium(?: is)?)\s*\$?\s*([\d,]+(?:\.\d{1,2})?)/i);
 if(currentMoney)set('current_premium',Number(currentMoney[1].replaceAll(',','')));
 if(targetMoney&&/\b(month|monthly|mo)\b/.test(t))set('price_target_period','monthly');
 const ded=body.match(/\$?([\d,]+)\s*(?:deductible)/i);if(ded)set('deductible_target',Number(ded[1].replaceAll(',','')));
 for(const [k,re] of [['vehicle_count',/\b(\d{1,2}) (?:cars|vehicles|autos)\b/],['driver_count',/\b(\d{1,2}) drivers?\b/]]){const m=t.match(re);if(m)set(k,Number(m[1]));}
 if(/\b(buying|buyer|in escrow|closing)\b/.test(t))set('owner_or_buyer','BUYER');else if(/\b(own my home|homeowner)\b/.test(t))set('owner_or_buyer','OWNER');
 const zip=t.match(/\b(?:zip(?: code)?(?: is)?|live in) (\d{5})\b/);if(zip)set('zip',zip[1]);
 if(/\bno claims\b/.test(t))set('claims_indicator','reported_none');else if(/\b(?:had|filed) (?:a |\d+ )?claims?\b/.test(t))set('claims_indicator','reported_claim');
 if(/\b(?:price|premium|rate).*(?:increase|went up|high)|too expensive|checking price\b/.test(t))set('shopping_reason','price');
 if(/\b(cancel(?:s|led|ed|lation)?|nonrenewal|non renewal)\b/.test(t)&&! /\bnot (?:being )?cancel/.test(t))set('shopping_reason','cancellation_nonrenewal');
 if(/\b(?:shopping now|actively shopping|looking for insurance)\b/.test(t))set('shopping_reason',f.shopping_reason||'active_shopping');
 const paymentTiming=/\b(?:pay|payment|premium due)\b/.test(t)&&/\b(?:insurance|premium|policy)\b/.test(t);
 const dateContext=paymentTiming||/\b(renew|renews|renewal|closing|escrow|call|check back|later|next month|december)\b/.test(t)||/TIMING|FUTURE|SCHEDULE/.test(goal)||/renew|check back|what month/.test(p);
 if(dateContext){const dt=timing(body,now);if(dt){const type=paymentTiming?'payment_due':/\b(?:purchase|buying)\b/.test(t)?'purchase':/\bclosing|escrow\b/.test(t)?'closing':/\bcall|check back\b/.test(t)?'requested_callback':'renewal';set('timing',dt);set('future_date_type',type);if(dt.date)set(({closing:'closing_date',requested_callback:'callback_date',payment_due:'payment_due_date',purchase:'purchase_date'})[type]||'renewal_date',dt.date);}}
 return {facts:{...known,...f},newFacts:f,evidence};
}
export function decideSignal(conversation,body,options={}) {
 const now=options.now||new Date().toISOString(),old=conversation.signal||{},t=norm(body),templates=options.templates||DEFAULT_TEMPLATES;
 const outbound=[...(conversation.transcript||[])].reverse().find(x=>x.direction==='outbound'&&(!x.occurredAt||x.occurredAt<=now));
 const previous=outbound?.body||old.previous_outbound||'',template=matchTemplate(previous,templates);
 const goal=outbound?.signalGoal||old.pending_goal||template?.default_reply_goal||old.template_goal||'';
 const c=structuredClone(conversation);
 const quoteStage=old.az_confirmed_stage==='QUOTE_SENT'||old.az_recommended_stage==='QUOTE_SENT'||template?.expected_az_stage==='QUOTE_SENT';
 const base={...old,...(template?{source_template:template.template_id,source_campaign:template.campaign_family,template_goal:template.default_reply_goal,az_inferred_stage:old.az_inferred_stage||template.expected_az_stage,attribution_basis:'normalized_template_inference'}:{}),managed:true,revision:(old.revision||0)+1,latest_inbound:body,previous_outbound:previous,response_timestamp:now,inbound_message_id:options.messageId||'',decision_2:'CALL',classification:'review',classification_confidence:.35,human_required:true,automation_lock:true,reply:'',reply_goal:'HUMAN_HANDOFF',priority:'LOW',reason:'Unclear reply or missing context; producer review required.',sales_positive:false,useful:false,quote_response:null,quote_ready:false,new_facts:{}};
 let s=base;
 const finish=(action,classification,confidence,reason,extra={})=>{
  Object.assign(s,{decision_2:action,classification,classification_confidence:confidence,reason,...extra});
  if(action==='STOP'){s.reply='';s.human_required=false;s.automation_lock=true;s.az_recommended_stage='STOP';}
  else if(action==='CLOSE'){s.az_recommended_stage='CLOSED';s.automation_lock=true;}
  else if(action==='LATER')s.az_recommended_stage='FUTURE_BIND';
  else if(s.useful)s.az_recommended_stage=['QUOTE_SENT','WON'].includes(old.az_confirmed_stage)?old.az_confirmed_stage:old.az_recommended_stage==='QUOTE_SENT'?'QUOTE_SENT':s.quote_ready?'QUOTE_READY':'ENGAGED';
  if(s.az_recommended_stage){s.az_sync_status=s.az_recommended_stage===old.az_confirmed_stage?'confirmed':'pending';if(old.az_recommended_stage!==s.az_recommended_stage){s.az_sync_confirmed_at=null;s.az_sync_confirmed_by=null;}}
  s.internal_state=({opt_out:'stop',suppressed:'stop',wrong_number:'wrong_number',existing_farmers:'existing_farmers',negative:'closed',future_intent:'future_bind',objection_price:'objection_price',quote_coverage:'objection_coverage',quote_timing:'objection_timing',review:'reply_unclassified',human_required:'human_required',potential_interest:'collecting_minimum_context'})[classification]||(s.quote_ready?'quote_ready':action==='CALL'?'engaged_high_signal':'human_required');
  if(s.facts?.preferred_channel==='EMAIL'){s.reply='';s.human_required=true;s.automation_lock=true;s.reason+=' Email-only preference: follow up by email.';}
  s.meaningful_replies=(old.meaningful_replies||0)+(classification==='automatic_response'?0:1);
  s.signals={intent:s.sales_positive?(action==='CALL'?3:action==='LATER'?2:1):0,urgency:s.priority==='URGENT'?4:s.priority==='HIGH'?3:s.facts?.timing?.days<=60?2:s.facts?.timing?1:0,engagement:classification==='automatic_response'?0:s.facts?.explicit_call_request||s.facts?.explicit_quote_request?4:s.meaningful_replies>=3?3:Object.keys(s.new_facts||{}).length?2:1,fit:['unknown','poor','possible','good'].includes(old.signals?.fit)?old.signals.fit:'unknown'};
  s.conversation_summary=[s.facts?.line,s.facts?.shopping_reason,s.facts?.timing?.raw,s.facts?.current_carrier,`Next: ${action}`].filter(Boolean).join(' · ');
  if(s.quote_ready)s.quote_ready_context={line:s.facts.line,timing:s.facts.timing,current_carrier:s.facts.current_carrier,current_premium:s.facts.current_premium??null,premium_period:s.facts.premium_period??null,vehicle_count:s.facts.vehicle_count??null,driver_count:s.facts.driver_count??null,owner_or_buyer:s.facts.owner_or_buyer??null,zip:s.facts.zip??null,shopping_reason:s.facts.shopping_reason??null,recommended_action:'Prepare quote'};
  if(action==='LATER')s.future_opportunity={future_date:s.future_date||null,future_month:s.future_month||null,future_date_type:s.facts?.future_date_type||'unknown',reason:s.future_timing_raw||body,line:s.facts?.line||null,current_carrier:s.facts?.current_carrier||null,current_premium:s.facts?.current_premium??null,last_quote:s.last_quote||old.future_opportunity?.last_quote||null,last_objection:s.last_objection||old.last_objection||null,preferred_channel:s.facts?.preferred_channel||'UNKNOWN',conversation_summary:s.conversation_summary};
  c.signal=s;return c;
 };
 const filter=compliance(body,conversation);
 if(filter==='opt_out')return finish('STOP','opt_out',.99,'Explicit opt-out overrides all routing.',{useful:true,facts:{...(old.facts||{}),opt_out:true}});
 if(conversation.smsConsent?.status==='opted_out'||old.decision_2==='STOP')return finish('STOP','suppressed',.99,'Existing suppression remains active.');
 if(old.contact_suppressed)return finish('CLOSE','suppressed',.99,'Local contact suppression remains active.',{human_required:false,contact_suppressed:true});
 if(filter==='automatic_response')return {...c,signal:{...old,latest_inbound:body,response_timestamp:now,last_ignored:'automatic_response',ignored_count:(old.ignored_count||0)+1}};
 if(filter==='wrong_number'||filter==='spam')return finish('CLOSE',filter,.99,'No further sales contact.',{useful:true,human_required:false,contact_suppressed:true,facts:{...(old.facts||{}),...(filter==='wrong_number'?{wrong_number:true}:{})}});
 const a=conversation.answers||{},aged=conversation.agedLead||{};
 const inherited={};
 const line=aged.lineOfBusiness||conversation.intent; if(['auto','home','bundle'].includes(line))inherited.line=({auto:'AUTO',home:'HOME',bundle:'HOME_AUTO'})[line];
 if(aged.carrier?.carrier)inherited.current_carrier=aged.carrier.carrier;
 if(aged.renewal?.raw)inherited.timing=timing(aged.renewal.raw,now);
 for(const key of ['current_carrier','current_premium','renewal_date','closing_date','zip','preferred_channel','vehicle_count','driver_count'])if(a[key]!=null)inherited[key]=a[key];
 const ex=extractFacts(body,previous,{...inherited,...(old.facts||{})},now,goal);s.facts=ex.facts;
 if(!s.facts.timing){const knownDate=s.facts.renewal_date||s.facts.closing_date||s.facts.callback_date;if(knownDate)s.facts.timing=timing(knownDate,now);}s.new_facts=ex.newFacts;s.fact_evidence={...old.fact_evidence,...ex.evidence};
 if(ex.facts.existing_farmers)return finish('CLOSE','existing_farmers',.98,'Existing Farmers customer; no new-business pitch.',{useful:true,human_required:true});
 const futureRequest=goal==='FUTURE_CALLBACK_DATE'||/\b(call|check back|later|next month|closer to|not until)\b/.test(t);
 const dt=ex.newFacts.timing;
 if(dt&&dt.days<0)return finish('CALL','review',.4,'Timing is in the past; verify before acting.');
 if((dt&&(dt.days>30||(futureRequest&&dt.days>0)))||/\b(later|not right now|closer to renewal|just renewed)\b/.test(t)){
  const f=dt||s.facts.timing;
  return finish('LATER','future_intent',.92,'Future timing; do not call now.',{useful:true,sales_positive:true,human_required:false,automation_lock:false,future_date:f?.date||null,future_month:f?.month||null,future_timing_raw:f?.raw||body,quote_response:quoteStage?'TIMING':null,last_objection:quoteStage?'TIMING':old.last_objection,priority:'MEDIUM',reply:f?'Sounds good — I’ll check back around then.':(old.questions_sent||0)<3?'What month should I check back?':'',reply_goal:f?'SIMPLE_ACKNOWLEDGMENT':'FUTURE_CALLBACK_DATE'});
 }
 const declined=/\b(not interested|no thanks|all set|already (?:switched|bought|renewed|insured|got insurance)|already covered|not shopping|no longer interested|we're good)\b/.test(t)||(/^(no|nope)$/.test(t)&&goal==='DETECT_INTENT');
 if(declined)return finish('CLOSE','negative',.98,'No current opportunity or future event.',{useful:true,human_required:false,quote_response:quoteStage?'DECLINE':null,last_objection:quoteStage?'DECLINE':old.last_objection,reply:'Got it — thanks for letting me know.',reply_goal:'CLOSE'});
 if(!previous||(!template&&!old.pending_goal&&!old.managed))return finish('CALL','review',.3,'Outbound context/template unavailable; review without sending.');
 if(quoteStage){s.quote_response=/\b(price|expensive|cost|premium)\b/.test(t)?'PRICE':/\b(coverage|cover|deductible|liability)\b/.test(t)?'COVERAGE':/\b(ready|buy|bind|start|go ahead)\b/.test(t)?'READY':/\b(timing|later|renew)\b/.test(t)?'TIMING':'QUESTION';s.az_recommended_stage='QUOTE_SENT';s.last_objection=s.quote_response;
  if(s.quote_response==='PRICE'&&!s.facts.price_target&&(old.questions_sent||0)<3)return finish('ASK_ONE_QUESTION','objection_price',.94,'One price-target clarification.',{useful:true,human_required:false,automation_lock:false,reply:"Got it. Is there a monthly number you’re trying to stay under?",reply_goal:'DETECT_PRICE_TARGET',priority:'MEDIUM'});
  return finish('CALL','quote_'+s.quote_response.toLowerCase(),.94,'Producer handles quote response; no coverage or pricing promises.',{useful:true,sales_positive:s.quote_response==='READY',priority:'HIGH'});
 }
 if(/\b(cover|coverage|liability|deductible|claim|complaint|angry|upset|refund|change my|cancel my)\b/.test(t)&&!s.facts.shopping_reason)return finish('CALL','human_required',.9,'Insurance/service question needs producer review.',{useful:true,priority:'HIGH'});
 const paymentUrgent=ex.newFacts.payment_due_date&&dt?.days<=1&&ex.newFacts.price_target!=null;
 const urgent=/\b(today|tomorrow|this week|now|friday)\b/.test(t),active=/\b(?:i'm|im|i am|yes i'm) interested|shopping now|actively shopping|need coverage\b/.test(t);
 if(paymentUrgent||ex.newFacts.explicit_call_request||ex.newFacts.explicit_quote_request||s.facts.shopping_reason==='cancellation_nonrenewal'||active||(dt&&dt.days<=30))return finish('CALL','active_intent',.96,'Fresh request or near-term need warrants producer attention.',{useful:true,sales_positive:true,priority:(paymentUrgent||urgent)?'URGENT':'HIGH'});
 const positive=/\b(yes|sure|maybe|possibly|open|compare|send me|interested|checking price)\b/.test(t)||Object.keys(ex.newFacts).length>0;
 if(!positive)return finish('CALL','review',.4,'Low-information/contextual ambiguity; review, do not guess.');
 const enough=s.facts.line&&s.facts.timing&&s.facts.current_carrier&&(s.facts.current_premium||s.facts.shopping_reason);
 if(enough||(old.questions_sent||0)>=3)return finish('CALL','enough_context',.94,enough?'Minimum useful context collected.':'Three-question limit reached; stop qualification.',{useful:true,sales_positive:true,quote_ready:!!enough,priority:'HIGH'});
 const questions=[...(s.pilot_cohort==='SIGNAL'&&s.facts.line&&s.facts.timing&&!s.facts.shopping_reason?[['shopping_reason','DETECT_MOTIVATION','Are you actively comparing right now, or mostly checking price?']]:[]),['line','IDENTIFY_LINE','Is this for auto, home, or both?'],['timing','DETECT_TIMING','Is your current policy renewing soon, or are you mainly checking price?'],['current_carrier','DETECT_CARRIER','Who are you currently insured with?'],['current_premium','DETECT_PRICE','About what are you paying now?']];
 const q=questions.find(([key,goal])=>!s.facts[key]&&!(old.asked_goals||[]).includes(goal));
 if(!q)return finish('CALL','enough_context',.9,'No useful unasked qualification question remains.',{useful:true,sales_positive:true,priority:'HIGH'});
 const out=finish('ASK_ONE_QUESTION','potential_interest',.9,'Ask only the next missing useful fact.',{useful:true,sales_positive:true,human_required:false,automation_lock:false,reply:q[2],reply_goal:q[1],priority:'MEDIUM'});
 if(s.facts.preferred_channel==='EMAIL'){out.signal.reply='';out.signal.human_required=true;out.signal.automation_lock=true;out.signal.reason='Email-only preference; producer follows up through email.';}
 return out;
}
export function signalMetrics(decisions=[],conversations=[]) {
 const events=decisions.filter(d=>d.direction==='inbound'),meaningful=events.filter(d=>d.classification!=='automatic_response');
 const contacted=new Set(decisions.filter(d=>d.direction==='outbound'&&d.source_template).map(d=>d.conversation_id));
 const responded=new Set(meaningful.filter(d=>contacted.has(d.conversation_id)).map(d=>d.conversation_id));
 const unique=pred=>new Set(meaningful.filter(pred).map(d=>d.conversation_id)).size;
 const ratio=(a,b)=>b?a/b:null;
 const positive=unique(d=>d.sales_positive),total=new Set(meaningful.map(d=>d.conversation_id)).size;
 return {scope:'Retained signal events, maximum 1000; not lifetime CRM totals',unique_leads_contacted:contacted.size,unique_meaningful_responders:total,reply_rate:ratio(responded.size,contacted.size),stop_rate:ratio(unique(d=>d.decision_2==='STOP'&&contacted.has(d.conversation_id)),contacted.size),wrong_number_rate:ratio(unique(d=>d.classification==='wrong_number'&&contacted.has(d.conversation_id)),contacted.size),confusion_rate:ratio(unique(d=>d.classification==='review'),total),positive_signal_rate:ratio(positive,total),negative_signal_rate:ratio(unique(d=>d.classification==='negative'),total),future_opportunity_rate:ratio(unique(d=>d.decision_2==='LATER'),total),high_intent_rate:ratio(unique(d=>d.decision_2==='CALL'&&d.sales_positive),total),probe_1_responses:unique(d=>d.source_probe===1),probe_2_responses:unique(d=>d.source_probe===2),useful_conversations:unique(d=>d.useful),automatic_responses:events.filter(d=>d.classification==='automatic_response').length,az_pending:conversations.filter(c=>c.signal?.az_sync_status==='pending').length,positive_to_engaged:null,engaged_to_quote_ready:null,quote_ready_to_quote_sent:null,quote_sent_to_won:null,future_bind_to_reopened:null,producer_effort_per_useful_conversation:null,texts_per_positive_signal:null,texts_per_quote_ready:null,calls_per_quote:null,producer_minutes_per_bind:null,unavailable_reason:'CRM outcomes and producer effort require manual measurement; no AgencyZoom integration.'};
}
