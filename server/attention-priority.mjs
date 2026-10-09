// Deterministic read-only orchestration; never a contact permission or bind score.
export const ATTENTION_VERSION='SIGNAL-ATTENTION-1.0';
const time=v=>v&&Number.isFinite(Date.parse(v))?Date.parse(v):null;
const day=(n,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(n));
export function deriveAttention({population,opportunity={},sms={},commitments=[],priority=null,suppressed=false,now=Date.now(),timeZone='America/Los_Angeles'}={}){
 if(population==='DISTRICT_CONTROL')return null;
 const n=typeof now==='number'?now:Date.parse(now),today=day(n,timeZone),s=sms||{},facts=s.facts||{};
 const result=(band,rank,text,ref,extra={})=>({version:ATTENTION_VERSION,band,rank,actionable:band!=='SUPPRESSED',reasons:[{text,source_ref:ref}],intent_rank:0,due_at:null,...extra});
 if(suppressed||s.contact_suppressed||s.wrong_number||facts.wrong_number||facts.opt_out||s.decision_2==='STOP')return result('SUPPRESSED',0,'Contact suppressed',{kind:'contact_safety'});
 if(opportunity.status==='closed'||s.decision_2==='CLOSE')return result('WAITING',5,'Closed — no outreach due',{kind:'opportunity_state'},{actionable:false});
 const messages=(s.transcript||[]).map(m=>({...m,at:time(m.occurredAt)})).filter(m=>m.at!==null&&m.at<=n).sort((a,b)=>a.at-b.at),inbound=messages.filter(m=>m.direction==='inbound'),lastIn=inbound.at(-1),lastOut=messages.filter(m=>m.direction==='outbound').at(-1),fresh=lastIn&&n-lastIn.at<=48*3600000;
 const requests=s.new_facts||{};
 const intent=fresh?(requests.explicit_quote_request||requests.explicit_call_request||requests.explicit_proceed_request?3:inbound.filter(m=>n-m.at<=48*3600000).length>=3?2:1):0;
 const finish=(...args)=>({...result(...args),intent_rank:intent});
 if(fresh&&(requests.explicit_quote_request||requests.explicit_call_request||requests.explicit_proceed_request))return finish('NOW',120,'Explicit contact, quote or proceed request',{kind:'sms',id:lastIn.id});
 if(fresh&&(!lastOut||lastOut.at<lastIn.at)&&s.latest_inbound&&s.reason_code!=='autoresponder')return finish('NOW',110,'Recent inbound has no later producer reply',{kind:'sms',id:lastIn.id});
 const active=commitments.filter(c=>!['cancelled','completed','proposed'].includes(c.status)&&c.confirmation!=='evidence_only');
 const due=active.filter(c=>c.due_at&&time(c.due_at)<=n+15*60000&&['APPOINTMENT','CALLBACK'].includes(c.type)).sort((a,b)=>time(a.due_at)-time(b.due_at))[0];
 if(due)return finish('NOW',100,time(due.due_at)<n-30*60000?'Past appointment/callback needs disposition':'Appointment/callback due now',due.source_ref,{due_at:due.due_at});
 const overdue=active.find(c=>c.producer_committed===true&&(c.due_at&&time(c.due_at)<n||c.due_date&&c.due_date<today));
 if(overdue)return finish('TODAY',90,'Producer commitment overdue',overdue.source_ref,{due_at:overdue.due_at});
 const sameDay=active.find(c=>c.due_date===today||c.due_at&&day(time(c.due_at),timeZone)===today);
 if(sameDay)return finish('TODAY',80,'Recorded '+sameDay.type.toLowerCase().replaceAll('_',' ')+' due today',sameDay.source_ref,{due_at:sameDay.due_at});
 const future=active.filter(c=>c.due_at&&time(c.due_at)>n||c.due_date&&c.due_date>today).sort((a,b)=>(a.due_at||a.due_date).localeCompare(b.due_at||b.due_date))[0];
 if(s.decision_2==='LATER')return finish(future?'UPCOMING':'WAITING',future?25:10,future?'Future timing recorded':'Waiting for a confirmed follow-up date',future?.source_ref||{kind:'sms_state'},{due_at:future?.due_at||null});
 if(fresh&&['HIGH','URGENT'].includes(s.priority))return finish('HIGH',70,'Fresh '+s.priority.toLowerCase()+' Signal',{kind:'sms',id:lastIn.id});
 if(intent>=2)return finish('HIGH',60,'Repeated replies in the last 48 hours',{kind:'sms',id:lastIn.id});
 if(priority?.queue==='shoot_now')return finish('HIGH',50,'Opportunity Priority: shoot now',{kind:'opportunity_priority'});
 if(priority?.queue==='quick_play')return finish('HIGH',40,'Opportunity Priority: quick play',{kind:'opportunity_priority'});
 if(s.quote_ready||s.az_confirmed_stage==='QUOTE_SENT')return finish('NORMAL',30,'Quote work available',{kind:'sms_state'});
 if(future)return finish('UPCOMING',25,'Upcoming '+future.type.toLowerCase().replaceAll('_',' '),future.source_ref,{due_at:future.due_at});
 if(active.some(c=>c.status==='waiting'||c.customer_committed===true&&c.producer_committed!==true))return finish('WAITING',10,'Waiting on a recorded commitment',{kind:'commitment'});
 return finish('NORMAL',20,'Review current evidence',{kind:'opportunity'},{actionable:false});
}
export function compareAttention(a,b,mode='recommended'){
 const x=a.attention,y=b.attention;
 if(mode==='newest')return String(b.received_at||b.created_at||'').localeCompare(String(a.received_at||a.created_at||''))||a.id.localeCompare(b.id);
 const safe=v=>v?.actionable===false?0:v?1:0;
 const rank=v=>mode==='high_intent'?(v?.intent_rank||0):mode==='due_now'?(['NOW','TODAY'].includes(v?.band)?v.rank:0):(v?.rank||0);
 return safe(y)-safe(x)||rank(y)-rank(x)||String(x?.due_at||'9999').localeCompare(String(y?.due_at||'9999'))||a.id.localeCompare(b.id);
}
