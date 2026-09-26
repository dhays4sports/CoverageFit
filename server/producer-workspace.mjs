import {resolveSmsOwnership,ownershipLabel} from './sms-ownership.mjs';
import {templatesFor} from './sms-template-registry.mjs';
import {parse} from './solo-desk-repository.mjs';
import {createSmsConversationStore} from './d1-json-store.mjs';
import {districtSmsCohort,districtSmsRecord} from './district-pilot-sms.mjs';
import {enabled} from './sms-signal-core.mjs';
import {fail} from '../assets/js/solo-desk-model.mjs';
export const POPULATIONS=['DISTRICT_SIGNAL','DISTRICT_CONTROL','WEB_DIRECT','OTHER'];
export const POPULATION_KIND='producer_population_v2';
export function classifyPopulation(sources){
 const pilot=sources.find(s=>s.kind==='district_pilot_v1')?.summary;
 if(pilot?.pilot_phase==='NEW_LEAD'&&['CONTROL','SIGNAL'].includes(pilot.cohort))return {population:'DISTRICT_'+pilot.cohort,basis:'immutable_pilot_enrollment'};
 if(pilot)return {population:'OTHER',basis:'non_production_pilot_phase'};
 const web=sources.some(s=>['web','pvx'].includes(s.kind)||(s.kind==='lead'&&!s.summary?.rawFacts&&s.summary?.context?.evidenceOrigin!=='agencyzoom_raw'&&(s.summary?.permission||s.summary?.context?.signalHome)));
 return web?{population:'WEB_DIRECT',basis:'first_party_source_record'}:{population:'OTHER',basis:'no_district_or_first_party_enrollment'};
}
export function attentionRank(r){
 const s=r.sms;
 if(s?.decision_2==='STOP'||s?.contact_suppressed)return 0;
 if(s?.decision_2==='CALL')return 700;
 if(s?.decision_2==='LATER'||s?.decision_2==='CLOSE')return 100;
 if(s?.human_required&&s?.latest_inbound)return 650;
 if(s?.latest_inbound&&['HIGH','URGENT'].includes(s.priority))return 600;
 if(s?.draft_status==='pending')return 500;
 if(s?.quote_ready)return 400;
 if(s?.decision_2==='LATER'||s?.decision_2==='CLOSE')return 100;
 return ({shoot_now:350,quick_play:300,develop:200,nurture:80,low_priority:50})[r.priority?.queue]||10;
}
export function producerWorkspace(repo,env){
 const w=repo.scope.workspace,store=createSmsConversationStore(repo.db);
 async function sources(id){return (await repo.rows('SELECT kind,source_id,summary_json FROM cf_solo_sources WHERE workspace_id=? AND opportunity_id=?',w,id)).map(s=>({...s,summary:parse(s.summary_json)}));}
 async function population(id,ss){const next=classifyPopulation(ss),old=ss.find(s=>s.kind===POPULATION_KIND)?.summary;
  // Source changes may promote OTHER; stages/scores/conversation state never do.
  if(old?.population==='WEB_DIRECT'&&next.population==='OTHER'&&!ss.some(s=>s.kind==='district_pilot_v1'))return old;
  if(old?.population===next.population&&old?.basis===next.basis)return old;
  const value={...next,version:2,classified_at:new Date().toISOString()};
  await repo.sql('INSERT INTO cf_solo_sources(workspace_id,kind,source_id,opportunity_id,summary_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(workspace_id,kind,source_id) DO UPDATE SET summary_json=excluded.summary_json,updated_at=excluded.updated_at',w,POPULATION_KIND,id,id,JSON.stringify(value),value.classified_at).run();return value;
 }
 async function sms(pilot,pop){
  if(pop!=='DISTRICT_SIGNAL'||!pilot?.conversation_id)return null;
  const c=await store.get('sms-live-conversations/'+pilot.conversation_id);if(!c)return null;
  if(await districtSmsCohort(c,env,store)!=='SIGNAL')return null;
  if(!c.signal?.managed)return null;
  return {conversation_id:c.id,...c.signal,contact_suppressed:!!(c.signal.contact_suppressed||c.smsConsent?.status==='opted_out'),transcript:(c.transcript||[]).slice(-12).map(t=>({direction:t.direction,body:t.body,occurredAt:t.occurredAt}))};
 }
 async function continuation(id,ss,pop){
  if(pop!=='WEB_DIRECT')return null;
  const source=ss.find(s=>s.kind==='signal_continue_v1')?.summary;
  if(!source?.conversation_id)return null;
  const c=await store.get('sms-live-conversations/'+source.conversation_id);
  if(!c||c.firstPartyOpportunityId!==id||c.firstPartyWorkspace!==w)return null;
  try{if(await districtSmsRecord(c,env,store))return null;}catch{return null;}
  if(!c.signal?.managed||!c.signal.continue_key)return null;
  const suppressed=c.smsConsent?.status==='opted_out'||c.signal.contact_suppressed;
  return {decision_2:suppressed?'STOP':c.signal.decision_2,priority:c.signal.priority,reason:c.signal.reason,future_date:c.signal.future_date||null,completed_at:source.completed_at||null};
 }
 return {
  async pendingSms(){
   const page=await store.list({prefix:'sms-live-conversations/',limit:500}),templates=await templatesFor(store),records=[];
   for(const entry of page.blobs||[]){const c=await store.get(entry.key);if(!c?.lastInboundAt)continue;
    const owner=await resolveSmsOwnership(c,{}, {env,store,templates});
    if(owner.owner!=='UNKNOWN'||owner.compliance)continue;
    records.push({conversation_id:c.id,phone:c.contactPhone,label:ownershipLabel(owner),latest_inbound:[...(c.transcript||[])].reverse().find(x=>x.direction==='inbound')?.body||'',updated_at:c.lastInboundAt});
   }
   records.sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
   return {records:records.slice(0,50),truncated:(page.blobs||[]).length>=500||records.length>50};
  },
  async detail(id){await repo.own(id);const ss=await sources(id),pop=await population(id,ss),pilot=ss.find(s=>s.kind==='district_pilot_v1')?.summary||null;
   const data=await repo.detail(id),state=await sms(pilot,pop.population);
   if(['DISTRICT_CONTROL','OTHER'].includes(pop.population)){data.opportunityPriority=null;data.possessionQuality=null;data.nextBestAction=null;}
   const webCid=pop.population==='WEB_DIRECT'?ss.find(s=>s.kind==='lead'&&s.summary?.context?.distribution?.phase==='producer_handoff')?.summary.context.distribution.conversation_id:null;
   const linkedCid=pilot?.conversation_id||webCid;const linked=linkedCid?await store.get('sms-live-conversations/'+linkedCid):null;const contactSafety={suppressed:!!(linked?.smsConsent?.status==='opted_out'||linked?.signal?.contact_suppressed||linked?.signal?.decision_2==='STOP')};
   return {...data,contactSafety,continuation:await continuation(id,ss,pop.population),population:pop,pilot:['DISTRICT_SIGNAL','DISTRICT_CONTROL'].includes(pop.population)?pilot:null,sms:state,sms_enabled:enabled(env)};
  },
  async list(params){
   const selected=params.get('population')||'DISTRICT_SIGNAL';if(![...POPULATIONS,'ALL'].includes(selected))fail(422,'population','Select a work population.');
   const q=(params.get('q')||'').trim().toLowerCase().slice(0,120),status=params.get('status')||'open';if(!['open','closed','all'].includes(status))fail(422,'status','Select open, closed or all.');
   const all=await repo.rows('SELECT * FROM cf_solo_opportunities WHERE workspace_id=? ORDER BY updated_at DESC,id LIMIT 5001',w);if(all.length>5000)fail(422,'work_size','Work inventory exceeds this pilot view limit; use the existing specialist desk.');
   const sourceRows=await repo.rows('SELECT opportunity_id,kind,source_id,summary_json FROM cf_solo_sources WHERE workspace_id=?',w),by=new Map();for(const row of sourceRows){if(!by.has(row.opportunity_id))by.set(row.opportunity_id,[]);by.get(row.opportunity_id).push({...row,summary:parse(row.summary_json)});}
   const projected=await repo.rows('SELECT opportunity_id,queue,score,score_min,score_max FROM cf_opportunity_priority_projections WHERE workspace_id=?',w),priority=new Map(projected.map(x=>[x.opportunity_id,x]));
   const counts=Object.fromEntries(POPULATIONS.map(x=>[x,0])),records=[];
   for(const op of all){const ss=by.get(op.id)||[],pop=await population(op.id,ss),contact=parse(op.contact_json);if(status!=='all'&&(status==='closed'?op.status!=='closed':op.status==='closed'))continue;counts[pop.population]++;
    if((selected!=='ALL'&&!q&&pop.population!==selected)||(q&&![contact.name,contact.firstName,contact.lastName,contact.mobile,contact.email,op.products,op.source].join(' ').toLowerCase().includes(q)))continue;
    const pilot=ss.find(s=>s.kind==='district_pilot_v1')?.summary,sm=await sms(pilot,pop.population);
    records.push({id:op.id,name:contact.name||[contact.firstName,contact.lastName].filter(Boolean).join(' ')||'Unnamed opportunity',phone:contact.mobile||'',products:op.products,source:op.source,status:op.status,population:pop.population,updated_at:op.updated_at,deadline:op.deadline,continuation:await continuation(op.id,ss,pop.population),priority:pop.population==='DISTRICT_SIGNAL'?priority.get(op.id)||null:null,sms:sm?{decision_2:sm.decision_2,priority:sm.priority,latest_inbound:sm.latest_inbound,draft_status:sm.draft_status,human_required:sm.human_required,quote_ready:sm.quote_ready,az_sync_status:sm.az_sync_status,contact_suppressed:sm.contact_suppressed}:null});
   }
   records.sort((a,b)=>(a.population==='DISTRICT_SIGNAL'&&b.population==='DISTRICT_SIGNAL'?attentionRank(b)-attentionRank(a):0)||b.updated_at.localeCompare(a.updated_at)||a.id.localeCompare(b.id));
   const offset=Number(params.get('offset')||0);if(!Number.isInteger(offset)||offset<0)fail(422,'offset','Invalid page');
   return {counts,records:records.slice(offset,offset+40),total:records.length,nextOffset:offset+40<records.length?offset+40:null,status,searchAcrossPopulations:!!q};
  }
 };
}
