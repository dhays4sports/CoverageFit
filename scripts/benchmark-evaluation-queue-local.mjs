// C2 actual local queue benchmark, synthetic only. No provider or service calls.
import {performance} from 'node:perf_hooks';
import {statSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {fixture,reopen,seed,event,configure,NOW,W,authority,count} from '../tests/helpers/evaluation-queue-fixture.mjs';
const sizes=process.argv.slice(2).map(Number);if(!sizes.length)sizes.push(1000);
const at=ms=>new Date(Date.parse(NOW)+Math.ceil(ms)).toISOString();
async function contention(path,now){
 const workers=Array.from({length:4},(_,i)=>new Worker(new URL('../tests/helpers/evaluation-queue-worker.mjs',import.meta.url),{workerData:{path,now,workerId:'bench-worker-'+i,limit:25,drain:true}}));
 try{
  await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej)})));
  const start=performance.now();
  const reports=await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej);w.postMessage('start')})));
  return {wall_ms:performance.now()-start,reports};
 }finally{await Promise.all(workers.map(w=>w.terminate()))}
}
for(const n of sizes){
 if(!Number.isInteger(n)||n<1||n>50000)throw Error('bounded_synthetic_size_required');
 const f=fixture();let runtime=f;
 try{
  const cpu=process.cpuUsage(),started=performance.now();
  f.db.exec('BEGIN');for(let i=0;i<n;i++)seed(f.db,'queue-bench-'+i);f.db.exec('COMMIT');
  for(let i=0;i<n;i++){
   const p='queue-bench-'+i;configure(f,undefined,p);
   const e=event('input-'+i,[{field:'renewal_date',value:'2026-10-25',policy_line:'AUTO'},{field:'vehicle_count',value:2}],{profile_id:p});
   if(f.queue.memory.admit(e,{now:NOW}).code!=='ADMITTED')throw Error('admission_failed');
   if(i<100&&f.queue.memory.admit(e,{now:NOW}).code!=='DUPLICATE_EXACT')throw Error('replay_failed');
  }
  const enqueued=performance.now();let completed=0,batches=0,maxExamined=0,maxLag=0,peakRss=process.memoryUsage().rss;
  const lags=[];
  while(completed<n){
   const b=f.queue.runBatch({workspace:W,now:at(performance.now()-started),workerId:'benchmark',limit:100});
   if(!b.claims.length||b.outcomes.some(o=>o.code!=='ACKNOWLEDGED'))throw Error('unexpected_queue_outcome');
   completed+=b.outcomes.length;batches++;maxExamined=Math.max(maxExamined,b.examined);
   for(const c of b.claims){maxLag=Math.max(maxLag,c.lag_ms);lags.push(c.lag_ms)}
   peakRss=Math.max(peakRss,process.memoryUsage().rss);
  }
  const drained=performance.now(),queueStats=f.queue.metrics(W,{now:at(drained-started)});
  if(queueStats.due||count(f.db,'cf_evaluation_results')!==n||count(f.db,'cf_evaluation_queue')!==n)throw Error('queue_count_mismatch');
  // Persist leases, close runtime, reopen same file, advance controlled clock past lease expiry.
  const recoverySample=Math.min(n,100),recoveryAt=at(drained-started+1000);
  for(let i=0;i<recoverySample;i++)f.queue.requestRefresh(W,'queue-bench-'+i,{now:recoveryAt,requestId:'recover-'+i,authority});
  const abandoned=f.queue.claim({workspace:W,now:recoveryAt,workerId:'crashed',limit:100,leaseMs:50});
  f.db.close();runtime=reopen(f.path);const recoveryStart=performance.now(),recoveredAt=at(drained-started+1050);
  const recovery=runtime.queue.runBatch({workspace:W,now:recoveredAt,workerId:'recovered',limit:100});
  const recoveryMs=performance.now()-recoveryStart;
  if(recovery.outcomes.length!==recoverySample||recovery.outcomes.some(o=>o.code!=='ACKNOWLEDGED')||recovery.claims.some(c=>!c.recovered))throw Error('recovery_failed');
  // Four connections compete over a bounded sample; report contention instead of claiming scaling.
  const contentionSample=Math.min(n,1000),contentionAt=at(performance.now()-started+2000);
  for(let i=0;i<contentionSample;i++)runtime.queue.requestRefresh(W,'queue-bench-'+i,{now:contentionAt,requestId:'contend-'+i,authority});
  const contended=await contention(f.path,contentionAt),busyErrors=contended.reports.filter(r=>r.error);
  if(busyErrors.length||contended.reports.reduce((s,r)=>s+r.completed,0)!==contentionSample)throw Error(JSON.stringify(contended));
  if(count(runtime.db,'cf_evaluation_results')!==n+recoverySample+contentionSample)throw Error('duplicate_or_missing_results');
  lags.sort((a,b)=>a-b);const usage=process.cpuUsage(cpu);
  console.log(JSON.stringify({records:n,queue_rows:count(runtime.db,'cf_evaluation_queue'),initial_results:completed,final_results:count(runtime.db,'cf_evaluation_results'),
   enqueue_ms:enqueued-started,drain_ms:drained-enqueued,queue_evaluations_per_second:n*1000/(drained-enqueued),batches,max_examined_per_batch:maxExamined,
   lag_p50_ms:lags[Math.floor((lags.length-1)*.5)],lag_p95_ms:lags[Math.floor((lags.length-1)*.95)],lag_max_ms:maxLag,due_after_drain:queueStats.due,
   recovery:{abandoned:abandoned.claims.length,recovered:recovery.outcomes.length,lease_ms:50,controlled_recovery_delay_ms:50,processing_ms:recoveryMs},
   contention:{workers:4,records:contentionSample,wall_ms:contended.wall_ms,evaluations_per_second:contentionSample*1000/contended.wall_ms,busy_errors:busyErrors.length,reports:contended.reports},
   sampled_peak_rss_bytes:Math.max(peakRss,process.memoryUsage().rss),database_bytes:statSync(f.path).size,total_cpu_ms:(usage.user+usage.system)/1000,
   journal_mode:runtime.db.prepare('PRAGMA journal_mode').get().journal_mode,node:process.version,clock:'controlled_origin_plus_measured_elapsed',external_actions:0,synthetic_only:true}));
 }finally{if(runtime!==f)runtime.db.close();f.cleanup()}
}
