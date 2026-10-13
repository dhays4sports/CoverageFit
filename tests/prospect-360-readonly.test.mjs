import test from 'node:test';
import assert from 'node:assert/strict';
import {projectProspect360} from '../server/prospect-360-readonly.mjs';
const base=()=>({opportunity:{id:'synthetic-opp',products:'AUTO',deadline:'2026-11-15'},population:{population:'DISTRICT_SIGNAL'},sources:[],sms:null,
 contactSafety:{suppressed:false},commitments:[],attention:null,actionQuality:null});
const src=(kind,id,v)=>({kind,source_id:id,updated_at:'2026-10-12T12:00:00Z',summary:v});
const at='2026-10-12T12:00:00Z';
test('deadline alone never becomes renewal or consent evidence',()=>{
 const result=projectProspect360(base(),{now:at});
 assert.equal(result.facts.renewal.verification,'unknown');
 assert.equal(result.facts.renewal.value,null);
 assert.equal(result.facts.renewal.sms_send_authorized,false);
 assert.equal(result.identity.status,'not_linked');
});
test('import and raw SMS dates remain provisional even when inside renewal window',()=>{
 const d=base();
 d.sources=[src('lead','import-a',{rawFacts:{renewal_date:'2026-11-15'}})];
 d.sms={conversation_id:'synthetic-sms',facts:{renewal_date:'2026-11-15'}};
 const r=projectProspect360(d,{now:at});
 assert.equal(r.facts.renewal.verification,'imported_unverified');
 assert.equal(r.facts.renewal.lifecycle,'CANDIDATE');
 assert.equal(r.facts.renewal.evidence.length,2);
});
test('exact customer-confirmed date supports upcoming; non-month invalid formats rejected',()=>{
 const d=base();
 d.sources=[src('renewal_verification_v1','verified-a',{renewal_exact_date:'2026-12-15',verification_status:'customer_confirmed',confirmed_at:'2026-10-11T17:00:00Z'})];
 const r=projectProspect360(d,{now:at});
 assert.equal(r.facts.renewal.verification,'customer_confirmed');
 assert.equal(r.facts.renewal.lifecycle,'UPCOMING');
 assert.equal(r.facts.renewal.value.date,'2026-12-15');
 assert.equal(r.facts.renewal.sms_send_authorized,false);
});
test('verified renewal inside quote window does not authorize outreach',()=>{
 const d=base();
 d.sources=[src('renewal_verification_v1','verified-a',{renewal_exact_date:'2026-10-23',verification_status:'producer_confirmed'})];
 const r=projectProspect360(d,{now:at});
 assert.equal(r.facts.renewal.lifecycle,'WINDOW_OPEN');
 assert.equal(r.facts.contact_safety.sms_authority,'NOT_EVALUATED');
});
test('conflicting imports and direct verification are surfaced, never silently overwritten',()=>{
 const d=base();
 d.sources=[src('lead','raw-1',{rawFacts:{renewal_date:'2026-10-23'}}),src('renewal_verification_v1','verified-a',{renewal_exact_date:'2026-11-15',verification_status:'document_verified'})];
 const r=projectProspect360(d,{now:at});
 assert.equal(r.facts.renewal.verification,'conflicted');
 assert.equal(r.facts.renewal.conflict,true);
 assert.equal(r.facts.renewal.value,null);
});
test('month-only timing is not invented into a day',()=>{
 const d=base();d.sms={facts:{renewal_month:'2026-11'}};
 const r=projectProspect360(d,{now:at});
 assert.equal(r.facts.renewal.value.date,null);
 assert.equal(r.facts.renewal.value.month,'2026-11');
 assert.equal(r.facts.renewal.verification,'imported_unverified');
});
test('past verified date becomes stale with no automatic anniversary roll-forward',()=>{
 const d=base();
 d.sources=[src('renewal_verification_v1','verified-a',{renewal_exact_date:'2026-08-01',verification_status:'customer_confirmed'})];
 const r=projectProspect360(d,{now:at});
 assert.equal(r.facts.renewal.lifecycle,'STALE');
 assert.equal(r.facts.renewal.verification,'stale');
 assert.equal(r.facts.renewal.value.date,'2026-08-01');
});
test('unconfirmed renewal commitment does not become a due customer commitment',()=>{
 const d=base();
 d.commitments=[{id:'record',type:'RENEWAL',status:'open',title:'Renewal timing',confirmation:'evidence_only',due_date:'2026-11-15'},
 {id:'confirmed',type:'CALLBACK',status:'open',title:'Call back',confirmation:'producer_recorded',due_date:'2026-10-13'}];
 const r=projectProspect360(d,{now:at});
 assert.equal(r.commitments[0].actionable,false);
 assert.equal(r.commitments[1].actionable,true);
});
test('existing explicit customer link is preserved without merging same-phone opportunities',()=>{
 const d=base();
 const identity={status:'linked',customer_id:'cust_known',household_id:'hh_known',link_basis:'explicit_profile_link',related_opportunities:['opp2','synthetic-opp']};
 const r=projectProspect360(d,{now:at,identity});
 assert.deepEqual(r.identity.related_opportunities,['opp2','synthetic-opp']);
});
