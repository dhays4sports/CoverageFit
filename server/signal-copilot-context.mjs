import {FIELDS,STYLE} from './signal-copilot-contract.mjs';
import {parse,digest} from './solo-desk-repository.mjs';
import {resolveSmsOwnership} from './sms-ownership.mjs';
import {compliance} from './sms-signal-core.mjs';
export function minimize(value){return String(value??'').replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g,'[secret omitted]').replace(/\b(?:1)?\d{10}\b/g,'[phone omitted]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email omitted]').replace(/\b\d{3}[- .]?\d{2}[- .]?\d{4}\b/g,'[identifier omitted]').replace(/(?:\+?1[- .]?)?\(?\d{3}\)?[- .]\d{3}[- .]\d{4}/g,'[phone omitted]').replace(/\b\d{1,6}\s+[A-Za-z ]+\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct)\b/gi,'[address omitted]').split(/(?<=[.!\n])\s+/).map(s=>/\b(dob|birth date|born on|ssn|social security|credit score|income|salary|occupation|marital|medical|diagnosed|religion|race|ethnicity|salary|wealth|married|divorced|education|degree|doctor|nurse|teacher|engineer|retired|student)\b/i.test(s)?'[sensitive detail omitted]':s).join(' ').slice(0,700);}
export async function copilotContext(repo,store,env,id){
 const op=await repo.own(id);
 const rows=await repo.rows('SELECT kind,source_id,summary_json FROM cf_solo_sources WHERE workspace_id=? AND opportunity_id=? ORDER BY kind,source_id',repo.scope.workspace,id);
 const pilots=rows.filter(x=>x.kind==='district_pilot_v1').map(x=>parse(x.summary_json));
 if(pilots.length!==1||pilots[0].cohort!=='SIGNAL'||pilots[0].pilot_phase!=='NEW_LEAD'||!pilots[0].conversation_id)throw Error('copilot_ineligible');
 const c=await store.get('sms-live-conversations/'+pilots[0].conversation_id);
 if(!c?.signal?.managed||!c.signal.latest_inbound)throw Error('copilot_ineligible');
 const owner=await resolveSmsOwnership(c,{body:c.signal.latest_inbound},{env,store});
 if(owner.owner!=='DISTRICT_SIGNAL'||owner.hold||compliance(c.signal.latest_inbound,c)||c.signal.decision_2==='STOP'||c.signal.contact_suppressed||c.smsConsent?.status==='opted_out'||['sending','delivery_review'].includes(c.signal.draft_status))throw Error('copilot_ineligible');
 const messages=(c.transcript||[]).slice(-12).filter(m=>['inbound','outbound'].includes(m.direction)).map(m=>({id:String(m.id||'').slice(0,120),direction:m.direction,body:minimize(m.body)}));
 if(!messages.some(m=>m.direction==='inbound'&&m.id===c.signal.inbound_message_id))throw Error('copilot_context_incomplete');
 const known_answers={};
 const add=(facts,source)=>{for(const field of FIELDS){const value=facts?.[field];if(value===null||value===undefined||value==='')continue;const clean=minimize(typeof value==='object'?JSON.stringify(value):value);const old=known_answers[field];known_answers[field]={value:clean,alternatives:[...new Set([...(old?.alternatives||[]),clean])],status:/^(unknown|unsure|not sure|uncertain)$/i.test(clean)?'UNCERTAIN':old&&old.value.toLowerCase()!==clean.toLowerCase()?'CONFLICTING':old?.status||'KNOWN',sources:[...(old?.sources||[]),source]};}};
 for(const row of rows){const s=parse(row.summary_json);add(s.raw_facts||s.rawFacts,row.kind==='lead'?'raw_source':row.kind);}
 add(c.signal.facts,'sms_memory');
 for(const field of FIELDS)if(!known_answers[field])known_answers[field]={value:null,status:'UNKNOWN',sources:[]};
 const data={known_answers,do_not_reask:Object.entries(known_answers).filter(([,v])=>v.status==='KNOWN').map(([k])=>k),messages,thread_summary:minimize(c.signal.conversation_summary||''),business_state:{priority:c.signal.priority||'UNKNOWN',decision:c.signal.decision_2,stage:c.signal.az_confirmed_stage||c.signal.az_inferred_stage||'UNKNOWN',quote_ready:!!c.signal.quote_ready},style:STYLE};
 // Full server-side source snapshots are hashed, never sent to the provider.
 const fingerprint=await digest(JSON.stringify([data,rows,c.signal.inbound_message_id]));
 return {data,fingerprint,revision:c.signal.revision,conversation:c,opportunity:op};
}
