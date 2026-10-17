export const CAPACITY_START='2026-10-19T16:00:00.000Z';
export const MINUTE=60000,DAY=86400000;
export const fact=value=>({status:'KNOWN',verification:'customer_reported',value,evidence:[{source_event_id:'synthetic-source'}]});
export const capacityConfig=(extra={})=>{
 const cfg={start:CAPACITY_START,days:7,rate:20,manualReserve:2,activeReserve:2,externalCapacityKnown:true,producerDailyCapacity:8,recipientGapMs:DAY,...extra};
 cfg.producerSlots??=Array.from({length:cfg.days},(_,d)=>Array.from({length:cfg.producerDailyCapacity},(_,i)=>Date.parse(cfg.start)+d*DAY+i*15*MINUTE)).flat();return cfg;
};
export function capacityRecord(id,extra={}){
 return {synthetic:true,id,workspace:'synthetic-workspace',relationship:id,sender:'synthetic-sender',family:'first_party',line:'HOME',
  source:{internal_insurance_use:true,retain_until:'2027-01-01T00:00:00.000Z'},
  profile:{projection_version:'synthetic-v1',identity_status:'LINKED',material_conflicts:false,facts:{}},
  context:{population:'WEB_DIRECT',workflowOwner:'COVERAGEFIT_APPROVED',contact:{sms_permission:true,verified_first_party_inquiry:true,acquisition_type:'first_party'}},
  owners:['COVERAGEFIT_APPROVED'],hypotheticalSenderApproved:true,syntheticInvitationApproved:true,
  window:{zone:'America/Los_Angeles',weekdays:['Mon','Tue','Wed','Thu','Fri'],startHour:9,endHour:17,holidays:[]},
  followupDelaysMs:[2*DAY,3*DAY],...extra};
}
export function capacityCohort(size,{prefix='cohort',mixed=true}={}){
 return Array.from({length:size},(_,i)=>{
  const r=capacityRecord(`${prefix}-${String(i).padStart(5,'0')}`);if(!mixed)return r;
  switch(i%12){
   case 0:r.highIntent=true;break;
   case 1:break;
   case 2:r.older=true;r.family='reengagement';break;
   case 3:r.context.contact.acquisition_type='purchased';r.family='vendor';break;
   case 4:r.quoteFollowup=true;r.family='quote';break;
   case 5:r.context.commitments=[{confirmed:true,status:'open',evidence_ref:'synthetic-callback',at:'2026-10-21T16:00:00.000Z'}];r.family='callback';break;
   case 6:r.active=true;r.profile.facts.preferred_channel=fact('TEXT');r.family='active';break;
   case 7:r.context.contact.suppressed=true;break;
   case 8:r.profile.identity_status='HOLD';break;
   case 9:r.context.workflowOwner='AGENCYZOOM';r.owners=['AGENCYZOOM'];break;
   case 10:r.profile.facts.explicit_quote_request=fact(true);break;
   case 11:r.profile.facts.closing_date=fact('2026-10-25');r.line='BUYER';break;
  }return r;
 });
}
export const importEvent=(records,at=CAPACITY_START,id='import')=>({id,type:'import',at,records});
export const updateEvent=(r,sequence,at,extra={})=>({id:`update-${r.id}-${sequence}`,type:'update',workspace:r.workspace,prospect:r.id,sequence,at,...extra});
