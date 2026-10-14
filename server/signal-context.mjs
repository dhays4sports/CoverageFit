// Runtime-neutral canonical C2 context normalization. No execution authority.
const iso=x=>{if(typeof x!=='string'||!Number.isFinite(Date.parse(x)))throw Error('invalid_clock');return new Date(x).toISOString()};
const bounded=(x,min,max)=>{if(!Number.isSafeInteger(x)||x<min||x>max)throw Error('invalid_bound');return x};
const id=x=>{if(typeof x!=='string'||!x.length||x.length>160||!/^[a-zA-Z0-9._:-]+$/.test(x))throw Error('invalid_identifier');return x};
export function normalizeContext(input){
 if(!input||!['DISTRICT_SIGNAL','DISTRICT_CONTROL','CONTROL','TEST','WEB_DIRECT','OTHER'].includes(input.population)
   ||!['AGENCYZOOM','UNKNOWN','COVERAGEFIT_APPROVED'].includes(input.workflowOwner))throw Error('invalid_context');
 const c=input.contact||{},commitments=input.commitments||[];
 for(const v of [input.producerTakeover,input.closed,c.suppressed,c.wrong_number,c.sms_permission])if(v!==undefined&&typeof v!=='boolean')throw Error('invalid_boolean');
 if(!Array.isArray(commitments)||commitments.length>30)throw Error('invalid_commitments');
 return {population:input.population,workflowOwner:input.workflowOwner,producerTakeover:input.producerTakeover===true,closed:input.closed===true,
  contact:{suppressed:c.suppressed===true,wrong_number:c.wrong_number===true,sms_permission:c.sms_permission===true,
   acquisition_type:c.acquisition_type==='first_party'?'first_party':c.acquisition_type==='purchased'?'purchased':'unknown',wait_until:c.wait_until?iso(c.wait_until):null},
  timing:{renewalWindowDays:bounded(input.timing?.renewalWindowDays??30,0,180)},
  commitments:commitments.map(x=>({confirmed:x.confirmed===true,status:x.status==='open'?'open':'closed',evidence_ref:id(x.evidence_ref),at:iso(x.at)}))
   .sort((a,b)=>a.at.localeCompare(b.at)||a.evidence_ref.localeCompare(b.evidence_ref))};
}
