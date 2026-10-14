// Actual local file-backed admission/evaluation/selection. Fresh process per size.
// No hosted adapter, provider, network, cache or external workflow.
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {fixture,seed,event,configure,context,batch,W,NOW,authority} from '../tests/helpers/evaluation-queue-fixture.mjs';
import {views,request} from '../tests/helpers/producer-intelligence-fixture.mjs';
import {producerIntelligenceLocal} from '../server/producer-intelligence-local.mjs';
const size=Number(process.argv[2]);
if(!size){
 for(const n of [1000,5000,20000,50000]){
  const p=spawnSync(process.execPath,['--experimental-loader','./tests/json-loader.mjs',import.meta.filename,String(n)],{encoding:'utf8',maxBuffer:8*1024*1024});
  if(p.status!==0)throw Error(p.stderr+'\n'+p.stdout);process.stdout.write(p.stdout);
 }
}else{
 const f=fixture(),mem=()=>({rss_bytes:process.memoryUsage().rss,heap_used_bytes:process.memoryUsage().heapUsed,peak_rss_bytes:process.resourceUsage().maxRSS*1024});
 const timings={},memory={start:mem()},ids=Array.from({length:size},(_,i)=>'bench-'+String(i).padStart(6,'0')),urgent=ids.slice(-100);
 let external=0;const oldFetch=globalThis.fetch;globalThis.fetch=()=>{external++;throw Error('external operation forbidden')};
 try{
  let t=performance.now();
  f.db.exec('BEGIN');for(const id of ids)seed(f.db,id);f.db.exec('COMMIT');
  for(let i=0;i<size;i++){const id=ids[i];configure(f,context,id);const call=i>=size-100;
   if(f.queue.memory.admit(event('event-'+id,[{field:call?'explicit_call_request':'carrier',value:call?true:'AAA'}],{profile_id:id}),{now:NOW}).code!=='ADMITTED')throw Error('admission_failed');
  }
  timings.admission_ms=performance.now()-t;memory.after_admission=mem();t=performance.now();let completed=0;
  while(completed<size){const b=batch(f.queue,NOW,{limit:100});if(!b.claims.length||b.outcomes.some(x=>x.code!=='ACKNOWLEDGED'))throw Error('evaluation_failed');completed+=b.outcomes.length}
  timings.evaluation_ms=performance.now()-t;memory.after_evaluation=mem();
  const service=views(f),req=request(),samples=[],selection=[],validation=[];
  const before=f.db.prepare('SELECT total_changes() n').get().n;
  for(let i=0;i<50;i++){t=performance.now();const p=await service.today(req);samples.push(performance.now()-t);selection.push(p.read_metrics.selection_ms);validation.push(p.read_metrics.validation_ms);
   if(p.today[0]?.opportunity_id!==urgent[0]||p.today.length!==25||p.selection_coverage.candidate_rows_read!==26||p.today.some(x=>x.execution_authority.call))throw Error('ranking_or_bound_failed');
  }
  let after='',seen=[],pages=0,maxRead=0;do{const p=await service.attention(req,{after,limit:25});seen.push(...p.records.map(x=>x.id));pages++;maxRead=Math.max(maxRead,p.selection_coverage.candidate_rows_read);after=p.next_cursor}while(after);
  if(JSON.stringify(seen)!==JSON.stringify(urgent))throw Error('pagination_failed');
  const plan=f.db.prepare('EXPLAIN QUERY PLAN SELECT opportunity_id FROM cf_evaluation_queue INDEXED BY cf_eval_attention WHERE workspace_id=? AND attention_eligible=1 AND (attention_order,attention_due,opportunity_id)>(?,?,?) ORDER BY attention_order,attention_due,opportunity_id LIMIT ?').all(W,-120,'9999','',26).map(x=>x.detail);
  // Probe actual candidate index entries visited by the same filter-free seek.
  // The always-true probe is evaluated once per visited candidate, before LIMIT.
  let visited=0;f.db.function('cf_attention_visit',_id=>{visited++;return 1});
  f.db.prepare('SELECT opportunity_id FROM cf_evaluation_queue INDEXED BY cf_eval_attention WHERE workspace_id=? AND attention_eligible=1 AND (attention_order,attention_due,opportunity_id)>(?,?,?) AND cf_attention_visit(opportunity_id) ORDER BY attention_order,attention_due,opportunity_id LIMIT ?').all(W,-120,'9999','',26);
  if(visited!==26)throw Error('unexpected_candidate_scan');
  if(f.db.prepare('SELECT total_changes() n').get().n!==before)throw Error('read_mutation');memory.after_reads=mem();
  // Material evidence requeues all but one human candidate, without a population read.
  t=performance.now();for(const id of ids.slice(0,-1))f.queue.memory.admit(event('update-'+id,[{field:'vehicle_count',value:2}],{profile_id:id}),{now:NOW});
  timings.backlog_admission_ms=performance.now()-t;timings.incremental_admission_mean_ms=timings.backlog_admission_ms/(size-1);
  t=performance.now();const backlog=await service.today(req);timings.backlog_read_ms=performance.now()-t;
  if(backlog.today.length!==1||backlog.today[0].opportunity_id!==ids.at(-1)||!backlog.selection_coverage.pending_evaluation)throw Error('backlog_freshness_failed');
  // Governed refresh of the newest ID only; no worker drain of unrelated backlog.
  const last=ids.at(-1);t=performance.now();f.queue.requestRefresh(W,last,{now:NOW,requestId:'benchmark-refresh',authority});
  timings.refresh_invalidation_ms=performance.now()-t;if((await service.today(req)).today.length)throw Error('refresh_not_invalidated');
  memory.after_backlog=mem();
  const stats=a=>{const x=[...a].sort((a,b)=>a-b);return {mean_ms:x.reduce((a,b)=>a+b,0)/x.length,p95_ms:x[Math.ceil(x.length*.95)-1],max_ms:x.at(-1)}};
  console.log(JSON.stringify({prospects:size,seed_identity_extra:1,current_candidates:100,synthetic_only:true,node:process.version,page_size:25,samples:50,read:stats(samples),candidate_selection:stats(selection),c3_hydration_validation:stats(validation),pagination:{pages,records:seen.length,unique:new Set(seen).size,max_candidate_rows_read:maxRead},query_plan:plan,actual_candidate_index_visits:visited,backlog:{pending_prospects:size-1,coverage:backlog.selection_coverage,read_metrics:backlog.read_metrics},timings,memory,sqlite_changes_during_reads:0,external_actions:external}));
 }finally{globalThis.fetch=oldFetch;f.cleanup()}
}
