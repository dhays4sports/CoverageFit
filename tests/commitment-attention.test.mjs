import test from 'node:test';import assert from 'node:assert/strict';
import {projectCommitments,dueWindow,validateCommitmentProposal,COMMITMENT_TYPES} from '../server/commitment-projection.mjs';
import {deriveAttention,compareAttention} from '../server/attention-priority.mjs';
const now=Date.parse('2026-10-02T17:00:00Z'),incoming=(body='Please send quote',at='2026-10-02T16:00:00Z')=>({id:'in',direction:'inbound',body,occurredAt:at});
const base=()=>({population:'DISTRICT_SIGNAL',opportunity:{id:'one'},now,sms:{latest_inbound:'Please send quote',transcript:[incoming()],facts:{}}});
const commitment=(type,due_at,extra={})=>({id:'c',type,due_at,status:'open',confirmation:'confirmed',source_ref:{kind:'task',id:'t'},...extra});
for(const type of COMMITMENT_TYPES)test('projects '+type+' without new persistence',()=>{const c=projectCommitments({opportunity:{id:'one'},tasks:[{id:'t',commitment_type:type,title:'Recorded work',due_at:'2026-10-03',state:'open'}]})[0];assert.equal(c.type,type);assert.equal(c.due_date,'2026-10-03');assert.equal(c.customer_committed,null);assert.equal(c.producer_committed,true);});
test('calendar supersedes duplicate preparation task and retains cancellation history',()=>{const rows=projectCommitments({opportunity:{id:'one'},sources:[{kind:'calendar',source_id:'e',summary:{eventId:'e',start:'2026-10-02T17:00:00Z',status:'cancelled'}}],tasks:[{id:'t',source_key:'appointment:e',title:'Prepare',due_at:'2026-10-02T17:00:00Z'}]});assert.equal(rows.length,1);assert.equal(rows[0].status,'cancelled');assert.equal(rows[0].external_event_id,'e');});
test('completion is explicit; past calendar alone stays open',()=>{assert.equal(projectCommitments({tasks:[{id:'t',state:'completed',completed_at:'2026-10-01'}]})[0].status,'completed');assert.equal(projectCommitments({sources:[{kind:'calendar',source_id:'e',summary:{status:'scheduled',start:'2020-01-01T10:00:00Z'}}]})[0].status,'open');});
for(const raw of ['next week','Friday morning','later','after work','2026-02-30','2026-10-02T10:00'])test('unresolved date cannot silently become exact time: '+raw,()=>assert.equal(dueWindow(raw).precision,'unresolved'));
test('proposal requires real quoted evidence and always confirmation, including conflict',()=>{const p={type:'APPOINTMENT',confidence:.99,who_committed:'customer',due_at:'2026-10-05T17:00:00Z',evidence_message_id:'in',evidence_text:'Monday at 10 works'};const r=validateCommitmentProposal(p,[incoming('Monday at 10 works')]);assert.equal(r.status,'proposed');assert.equal(r.confirmation_needed,true);assert.throws(()=>validateCommitmentProposal(p,[{...incoming(),direction:'outbound'}]));assert.equal(validateCommitmentProposal({...p,due_at:'Friday morning'},[incoming('Monday at 10 works')]).due_window.precision,'unresolved');});
test('explicit quote/proceed outranks unanswered inbound',()=>{for(const field of ['explicit_quote_request','explicit_proceed_request','explicit_call_request']){const b=base();b.sms.new_facts={[field]:true};assert.equal(deriveAttention(b).rank,120);}});
test('unanswered meaningful inbound elevated with evidence reference',()=>{const r=deriveAttention(base());assert.equal(r.rank,110);assert.equal(r.reasons[0].source_ref.id,'in');});
test('repeated recent replies retain evidence-driven High Intent',()=>{const b=base();b.sms.transcript=[incoming(),{...incoming(),id:'i2'}, {...incoming(),id:'i3'}, {direction:'outbound',body:'Thanks',occurredAt:'2026-10-02T16:30:00Z'}];assert.equal(deriveAttention(b).intent_rank,2);assert.equal(deriveAttention(b).rank,60);});
for(const [type,date,band] of [['APPOINTMENT','2026-10-02T17:00:00Z','NOW'],['CALLBACK','2026-10-02T20:00:00Z','TODAY'],['APPOINTMENT','2026-10-03T17:00:00Z','UPCOMING'],['APPOINTMENT','2026-10-01T17:00:00Z','NOW'],['QUOTE_REVIEW','2026-10-02T20:00:00Z','TODAY']])test(type+' at '+date+' yields '+band,()=>{assert.equal(deriveAttention({...base(),sms:{},commitments:[commitment(type,date)]}).band,band);});
test('overdue producer promise and waiting customer remain distinct',()=>{assert.equal(deriveAttention({...base(),sms:{},commitments:[commitment('FOLLOW_UP','2026-10-01T17:00:00Z',{producer_committed:true})]}).rank,90);assert.equal(deriveAttention({...base(),sms:{},commitments:[commitment('DOCUMENT_EXPECTED',null,{customer_committed:true,status:'waiting'})]}).band,'WAITING');});
test('stale high intent expires and no-thanks stays closed',()=>{const b=base();b.sms.priority='URGENT';b.sms.facts.explicit_quote_request=true;b.sms.transcript=[incoming('Please quote','2026-01-01T17:00:00Z')];assert.equal(deriveAttention(b).intent_rank,0);assert.equal(deriveAttention(b).band,'NORMAL');b.sms.decision_2='CLOSE';assert.equal(deriveAttention(b).actionable,false);});
for(const s of [{decision_2:'STOP'},{contact_suppressed:true},{facts:{wrong_number:true}},{facts:{opt_out:true}}])test('safety overrides explicit urgency '+JSON.stringify(s),()=>{const b=base();b.sms={...b.sms,...s,priority:'URGENT'};assert.equal(deriveAttention(b).band,'SUPPRESSED');});
test('CONTROL produces no attention guidance',()=>assert.equal(deriveAttention({...base(),population:'DISTRICT_CONTROL'}),null));
test('future bind date today resurfaces without pretending appointment',()=>{assert.equal(deriveAttention({...base(),sms:{decision_2:'LATER'},commitments:[commitment('FUTURE_BIND',null,{due_date:'2026-10-02'})]}).band,'TODAY');});
test('quote ready and sent use deterministic state without AI',()=>{for(const s of [{quote_ready:true},{az_confirmed_stage:'QUOTE_SENT'}])assert.equal(deriveAttention({...base(),sms:s}).rank,30);});
test('price/payment text is not proceed; source/traits do not change ranking',()=>{for(const body of ['I pay tomorrow','Only if under $200','Monday at 10 works']){const b=base();b.sms.transcript=[incoming(body)];const r=deriveAttention(b);assert.equal(r.rank,110);assert.equal(r.intent_rank,1);assert.deepEqual(deriveAttention({...b,source:'tech',income:1000000,zip:'95118'}),r);}});
test('sort ties stable and suppressed never rises on intent',()=>{const a={id:'a',attention:{actionable:true,rank:20,intent_rank:0}},b={id:'b',attention:{actionable:true,rank:20,intent_rank:0}},c={id:'c',attention:{actionable:false,rank:120,intent_rank:3}};assert.deepEqual([c,b,a].sort((x,y)=>compareAttention(x,y,'high_intent')).map(r=>r.id),['a','b','c']);});

test('old raised hand does not revive from unrelated new inbound',()=>{const b=base();b.sms.facts.explicit_quote_request=true;assert.equal(deriveAttention(b).rank,110);assert.equal(deriveAttention(b).intent_rank,1);});


test('raw renewal evidence does not become producer commitment or UPCOMING attention',()=>{
 const opportunity={id:'raw-1',status:'open',deadline:'2026-11-15'};
 const sources=[{kind:'lead',summary:{rawFacts:{renewal_date:'2026-11-15'}}}];
 const commitments=projectCommitments({opportunity,sources,tasks:[],sms:null});
 const renewal=commitments.find(x=>x.id==='opportunity:deadline');assert.equal(renewal.type,'RENEWAL');assert.equal(renewal.confirmation,'evidence_only');
 const a=deriveAttention({population:'DISTRICT_SIGNAL',opportunity,commitments,now:Date.parse('2026-10-08T01:00:00Z')});assert.equal(a.band,'NORMAL');assert.equal(a.reasons[0].text,'Review current evidence');
});

test('explicit recorded opportunity deadline still projects actionable future follow-up',()=>{
 const opportunity={id:'manual-1',status:'open',deadline:'2026-11-15'};
 const commitments=projectCommitments({opportunity,sources:[],tasks:[],sms:null});
 const follow=commitments.find(x=>x.id==='opportunity:deadline');assert.equal(follow.type,'FOLLOW_UP');assert.equal(follow.confirmation,'producer_recorded');
 const a=deriveAttention({population:'WEB_DIRECT',opportunity,commitments,now:Date.parse('2026-10-08T01:00:00Z')});assert.equal(a.band,'UPCOMING');
});


test('evidence-only fallback is non-actionable until stronger work evidence exists',()=>{
 const a=deriveAttention({population:'OTHER',opportunity:{id:'x',status:'open'},commitments:[],now:Date.parse('2026-10-08T01:00:00Z')});assert.equal(a.band,'NORMAL');assert.equal(a.actionable,false);assert.equal(a.reasons[0].text,'Review current evidence');
 const q=deriveAttention({population:'DISTRICT_SIGNAL',opportunity:{id:'x',status:'open'},commitments:[],sms:{quote_ready:true},now:Date.parse('2026-10-08T01:00:00Z')});assert.equal(q.band,'NORMAL');assert.equal(q.actionable,true);
});


test('attention canaries cover NOW TODAY HIGH SUPPRESSED and CONTROL',()=>{
 const now=Date.parse('2026-10-08T17:00:00Z'),base={id:'x',status:'open'};
 const explicit=deriveAttention({population:'DISTRICT_SIGNAL',opportunity:base,sms:{latest_inbound:'Call me',new_facts:{explicit_call_request:true},transcript:[{id:'m1',direction:'inbound',body:'Call me',occurredAt:'2026-10-08T16:30:00Z'}]},now});assert.equal(explicit.band,'NOW');assert.equal(explicit.actionable,true);
 const today=deriveAttention({population:'DISTRICT_SIGNAL',opportunity:base,commitments:[{id:'c1',type:'FOLLOW_UP',status:'open',due_date:'2026-10-08',confirmation:'producer_recorded',producer_committed:true,source_ref:{kind:'task',id:'t1'}}],now});assert.equal(today.band,'TODAY');assert.equal(today.actionable,true);
 const high=deriveAttention({population:'DISTRICT_SIGNAL',opportunity:base,sms:{priority:'HIGH',latest_inbound:'Interested',transcript:[{id:'m2',direction:'inbound',body:'Interested',occurredAt:'2026-10-08T16:45:00Z'}]},now});assert.equal(high.band,'HIGH');assert.equal(high.actionable,true);
 const stop=deriveAttention({population:'DISTRICT_SIGNAL',opportunity:base,sms:{decision_2:'STOP'},now});assert.equal(stop.band,'SUPPRESSED');assert.equal(stop.actionable,false);
 const control=deriveAttention({population:'DISTRICT_CONTROL',opportunity:base,now});assert.equal(control,null);
});
