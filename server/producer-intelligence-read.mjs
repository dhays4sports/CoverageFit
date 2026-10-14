// Trusted-server composition boundary; not installed in any HTTP route.
// A future hosted adapter requires independent authorization/consistency acceptance.
import {PRODUCER_INTELLIGENCE_CONTRACT,reconcileProducerIntelligence,unavailableDecision} from './producer-intelligence-contract.mjs';
import {projectCommandCenter} from './producer-command-center.mjs';
import {projectProspect360} from './prospect-360-readonly.mjs';
import {compareAttention} from './attention-priority.mjs';
const validId=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(x);
const deny=(status,code)=>{throw Object.assign(Error(code),{status,code})};
export function producerIntelligenceRead({authorize,store,clock=()=>new Date().toISOString()}={}){
 async function scope(request){
  if(typeof authorize!=='function')deny(401,'AUTHORIZATION_REQUIRED');
  const a=await authorize(request);
  if(!a)deny(401,'AUTHORIZATION_REQUIRED');
  if(!validId(a.workspace)||!validId(a.actor)||(a.workspaceRead!==true&&!Array.isArray(a.recordIds)))deny(403,'SCOPE_DENIED');
  if(a.recordIds&&(!a.recordIds.every(validId)||a.recordIds.length>100))deny(403,'SCOPE_DENIED');
  return {workspace:a.workspace,actor:a.actor,workspaceRead:a.workspaceRead===true,recordIds:a.workspaceRead===true?null:[...new Set(a.recordIds)]};
 }
 const allowed=(a,id)=>a.workspaceRead||a.recordIds.includes(id);
 function readiness(){
  if(!store)return 'DECISION_STORE_UNAVAILABLE';
  if(store.contract!==PRODUCER_INTELLIGENCE_CONTRACT)return 'INCOMPATIBLE_DECISION_STORE';
  if(store.runtime!=='LOCAL_SYNTHETIC')return 'HOSTED_ADAPTER_NOT_ACCEPTED';
  if(store.initialized!==true||store.consistency!=='SQLITE_READ_TRANSACTION'||typeof store.read!=='function'||typeof store.page!=='function')return 'ADAPTER_NOT_INITIALIZED';
  return null;
 }
 function now(){const n=clock();if(typeof n!=='string'||!Number.isFinite(Date.parse(n)))deny(503,'CLOCK_UNAVAILABLE');return new Date(n).toISOString()}
 function checked(a,item,at){
  const id=item?.record?.id;
  if(item?.workspace!==a.workspace||!validId(id)||!allowed(a,id)||item.record?.opportunity?.id!==id||item.decision?.id!==id)deny(503,'ADAPTER_SCOPE_MISMATCH');
  const v=item.decision.as_of===at?item.decision:unavailableDecision(id,at,'INCONSISTENT_SNAPSHOT_CLOCK');
  return reconcileProducerIntelligence(item.record,v);
 }
 async function detail(request,id){
  const a=await scope(request);if(!validId(id))deny(422,'INVALID_RECORD');if(!allowed(a,id))deny(404,'RECORD_UNAVAILABLE');
  const at=now(),blocked=readiness();
  if(blocked)return reconcileProducerIntelligence({id,opportunity:{id,contact:{}},population:{population:'OTHER'},sources:[]},unavailableDecision(id,at,blocked));
  let item;try{item=await store.read({...a,id,now:at})}catch{ return reconcileProducerIntelligence({id,opportunity:{id,contact:{}},population:{population:'OTHER'},sources:[]},unavailableDecision(id,at,'DECISION_STORE_UNAVAILABLE'))}
  if(!item)deny(404,'RECORD_UNAVAILABLE');
  if(item.record?.id!==id)deny(503,'ADAPTER_SCOPE_MISMATCH');return checked(a,item,at);
 }
 async function list(request,{after='',limit=25,population='ALL',status='open',q='',sort='recommended'}={}){
  const a=await scope(request);if(typeof q!=='string'||q.length>120||!['baseline','recommended','high_intent','due_now','newest'].includes(sort))deny(422,'INVALID_FILTER');q=q.trim().toLowerCase();if(!Number.isInteger(limit)||limit<1||limit>100||after&&!validId(after))deny(422,'INVALID_PAGE');
  if(!['ALL','DISTRICT_SIGNAL','DISTRICT_CONTROL','WEB_DIRECT','OTHER'].includes(population)||!['open','closed','all'].includes(status))deny(422,'INVALID_FILTER');
  const at=now(),blocked=readiness();
  const empty=reason=>({enabled:false,status:'UNAVAILABLE',reason,attention_enabled:false,counts:{DISTRICT_SIGNAL:0,DISTRICT_CONTROL:0,WEB_DIRECT:0,OTHER:0},attention_summary:{},records:[],total:0,total_scope:'PAGE_ONLY',next_cursor:null});
  if(blocked)return empty(blocked);
  let page;try{page=await store.page({...a,after,limit,now:at})}catch{return empty('DECISION_STORE_UNAVAILABLE')}
  if(page?.unavailable)return empty(page.unavailable);
  if(!Array.isArray(page?.items)||page.items.length>limit||page.next_cursor&&(!validId(page.next_cursor)||page.next_cursor<=after))deny(503,'INVALID_ADAPTER_PAGE');
  const seen=new Set();const records=page.items.map(item=>{const r=checked(a,item,at);if(r.id<=after||seen.has(r.id))deny(503,'INVALID_ADAPTER_PAGE');seen.add(r.id);return {...r,population:r.population?.population||r.population||'OTHER'}});
  if(page.next_cursor&&!seen.has(page.next_cursor))deny(503,'INVALID_ADAPTER_PAGE');
  // Rank this bounded page only; no whole-inventory scan or global ranking claim.
  const visible=records.filter(r=>(population==='ALL'||r.population===population||q)&&( !q||[r.name,r.products,r.source].join(' ').toLowerCase().includes(q))&&(status==='all'||(status==='closed'?r.status==='closed':r.status!=='closed')));
  visible.sort((a,b)=>compareAttention(a,b,sort==='baseline'?'recommended':sort));
  const counts={DISTRICT_SIGNAL:0,DISTRICT_CONTROL:0,WEB_DIRECT:0,OTHER:0},attention_summary={NOW:0,TODAY:0,HIGH:0,UPCOMING:0,WAITING:0,NORMAL:0,SUPPRESSED:0,actionable:0};
  for(const r of visible){if(Object.hasOwn(counts,r.population))counts[r.population]++;attention_summary[r.attention.band]++;if(r.human_attention_eligible)attention_summary.actionable++;}
  return {enabled:true,status:'AVAILABLE',attention_enabled:true,attention_summary,counts,sort:sort==='baseline'?'recommended':sort,test_excluded:0,nextOffset:null,records:visible,total:visible.length,total_scope:'PAGE_ONLY',next_cursor:page.next_cursor||null,limit,as_of:at};
 }
 return {detail,list,
  async today(request,options){const work=await list(request,options);return {...projectCommandCenter(work),status:work.status,reason:work.reason,next_cursor:work.next_cursor,scope:'BOUNDED_PAGE_ONLY'}},
  async prospect360(request,id){const d=await detail(request,id);return projectProspect360(d,{now:d.current_decision.as_of})}};
}
