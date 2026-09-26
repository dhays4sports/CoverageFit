import {compliance,matchingTemplates,DEFAULT_TEMPLATES} from './sms-signal-core.mjs';
import {districtSmsRecord} from './district-pilot-sms.mjs';
import {smsAutomationPaused} from './sms-safety-core.mjs';

// Relationship ownership is independent of feature activation, intent and consent.
export const SMS_OWNERS = Object.freeze(['DISTRICT_SIGNAL','DISTRICT_CONTROL','FIRST_PARTY_408','PRODUCER_OWNED','UNKNOWN']);
export function firstPartyEvidence(c={}) {
 const o=c.orchestration||{}, origin=c.outboundContext?.origin;
 if(c.smsOwnership?.owner==='FIRST_PARTY_408'&&c.smsOwnership?.basis==='explicit_first_party_workflow')return true;
 // Server-written outbound registration or explicit producer workflow start.
 // Inferred state/intent and the shared destination number are not evidence.
 return (['coveragefit','appointment','service','life','commercial','system'].includes(origin)&&!!c.outboundContext?.registrationId)
  || (['producer_started_workflow','producer_returned_to_coveragefit','producer_resumed_workflow','producer_transferred_to_coveragefit','producer_released_to_preserved_coveragefit'].includes(o.ownership?.reason)&&o.ownership?.owner==='coveragefit'&&o.workflow?.type?.startsWith('coveragefit_'));
}
export async function resolveSmsOwnership(c={},event={},options={}) {
 const at=event.occurredAt||new Date().toISOString();
 const result=(owner,basis,extra={})=>({owner,basis,updated_at:at,...extra});
 const safety=compliance(event.body||'',c);
 if(safety||c.smsConsent?.status==='opted_out'||c.signal?.contact_suppressed||c.state==='opted_out')return result(c.smsOwnership?.owner||'UNKNOWN','compliance',{hold:true,compliance:safety||'suppressed'});
 if(smsAutomationPaused(c)||c.orchestration?.ownership?.owner==='producer'||c.signal?.human_active)return result('PRODUCER_OWNED','producer_takeover',{hold:true});
 let pilot;
 try{pilot=await districtSmsRecord(c,options.env,options.store);}catch{return result('UNKNOWN','enrollment_lookup_failed',{hold:true});}
 if(pilot?.cohort==='CONTROL')return result('DISTRICT_CONTROL','pilot_enrollment',{hold:true});
 if(pilot?.cohort==='SIGNAL'&&pilot.pilot_id==='SIGNAL_DISTRICT_PILOT_1'&&['NEW_LEAD','TEST'].includes(pilot.pilot_phase))return result('DISTRICT_SIGNAL','pilot_enrollment',{hold:false,pilot_phase:pilot.pilot_phase});
 const candidates=[...(c.transcript||[])].reverse().filter(x=>x.direction==='outbound'&&!['automation','automation_retry','appointment','service','life','commercial','system'].includes(x.kind)).map(x=>matchingTemplates(x.body,options.templates||DEFAULT_TEMPLATES)).find(x=>x.length);
 const agencyzoom_context=(candidates?.length===1?candidates[0].template_id:null)||c.smsOwnership?.agencyzoom_context;
 if(candidates?.length>1)return result('UNKNOWN','ambiguous_outbound_context',{hold:true});
 if(agencyzoom_context)return result('UNKNOWN','agencyzoom_pending_enrollment',{hold:true,agencyzoom_context,pre_enrollment_response_at:c.smsOwnership?.pre_enrollment_response_at||at});
 if(firstPartyEvidence(c))return result('FIRST_PARTY_408','explicit_first_party_workflow',{hold:false});
 if(c.signal?.context_error)return result('UNKNOWN','context_unavailable',{hold:true});
 return result('UNKNOWN','no_positive_ownership_evidence',{hold:true});
}
export function ownershipLabel(o={}) {
 if(o.basis==='agencyzoom_pending_enrollment')return 'AgencyZoom lead — awaiting pilot enrollment';
 return ({DISTRICT_SIGNAL:'SIGNAL',DISTRICT_CONTROL:'CONTROL',FIRST_PARTY_408:'WEB / DIRECT',PRODUCER_OWNED:'Producer handling'})[o.owner]||'Unclassified SMS — manual review';
}
