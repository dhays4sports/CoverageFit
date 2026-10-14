// Each phase runs in a fresh OS process: construction, drain, C3 reads, contention.
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {performance} from 'node:perf_hooks';
import {Worker} from 'node:worker_threads';
import {fixture,reopen,seed,event,configure,NOW,W,authority} from '../tests/helpers/evaluation-queue-fixture.mjs';
import {signalCurrentDecisionLocal} from '../server/signal-current-decision-local.mjs';
const [phase,path,size]=process.argv.slice(2),n=Number(size);
const memory=()=>({...process.memoryUsage(),max_rss_bytes:process.resourceUsage().maxRSS*1024});
if(!phase){
 for(const count of [1000,5000,20000,50000]){
  const f=fixture();f.db.close();try{
   const reports=[];for(const task of ['construct','drain','read','contend']){
    const r=spawnSync(process.execPath,['--expose-gc',import.meta.filename,task,f.path,String(count)],{encoding:'utf8',maxBuffer:2e6});
    if(r.status!==0)throw Error(r.stderr||r.stdout);reports.push(JSON.parse(r.stdout));
   }
   console.log(JSON.stringify({records:count,node:process.version,phases:reports,synthetic_only:true,external_actions:0}));
  }finally{f.cleanup()}
 }
}else{
 if(!['construct','drain','read','contend'].includes(phase)||!Number.isInteger(n)||n<1||n>50000)throw Error('invalid_benchmark');
 const initial=memory(),start=performance.now();let details={},db;
 if(phase==='read'){
  db=new DatabaseSync(path,{readOnly:true});const reader=signalCurrentDecisionLocal(db,{syntheticOnly:true}),latencies=[];let seen=0,after='',pages=0,maxRows=0;
  do{const t=performance.now(),v=reader.page(W,{now:NOW,after,limit:25});latencies.push(performance.now()-t);seen+=v.items.length;pages++;maxRows=Math.max(maxRows,v.items.length);after=v.next_cursor;
   for(const item of v.items)if(item.id!=='prospect-1'&&item.status!=='CURRENT')throw Error('unexpected_projection');
  }while(after);
  const query=db.prepare('SELECT opportunity_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id>? ORDER BY opportunity_id LIMIT ?'),qt=performance.now();
  for(let i=0;i<100;i++)query.all(W,'',26);const keyQueryMean=(performance.now()-qt)/100;
  latencies.sort((a,b)=>a-b);details={key_query_mean_ms:keyQueryMean,seen,pages,max_rows:maxRows,page_p50_ms:latencies[Math.floor(latencies.length*.5)],page_p95_ms:latencies[Math.floor(latencies.length*.95)],page_max_ms:latencies.at(-1)};
 }else{
  const f=reopen(path);db=f.db;
  if(phase==='construct'){
   db.exec('BEGIN');for(let i=0;i<n;i++)seed(db,'c3-'+String(i).padStart(6,'0'));db.exec('COMMIT');
   for(let i=0;i<n;i++){const p='c3-'+String(i).padStart(6,'0');configure(f,undefined,p);if(f.queue.memory.admit(event('input-'+i,[{field:'vehicle_count',value:2}],{profile_id:p}),{now:NOW}).code!=='ADMITTED')throw Error('admit_failed')}
  }else if(phase==='drain'){
   let completed=0,maxExamined=0;while(completed<n){const b=f.queue.runBatch({workspace:W,now:NOW,workerId:'bench',limit:100});completed+=b.outcomes.filter(o=>o.code==='ACKNOWLEDGED').length;maxExamined=Math.max(maxExamined,b.examined);if(!b.claims.length)throw Error('drain_failed')}
   details={completed,max_examined:maxExamined};
  }else{
   for(let i=0;i<1000;i++)f.queue.requestRefresh(W,'c3-'+String(i).padStart(6,'0'),{now:NOW,requestId:'contention-'+i,authority});
   const workers=Array.from({length:4},(_,i)=>new Worker(new URL('../tests/helpers/evaluation-queue-worker.mjs',import.meta.url),{workerData:{path,now:NOW,workerId:'bench-'+i,limit:25,drain:true}}));
   await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej)})));
   const reports=await Promise.all(workers.map(w=>new Promise((res,rej)=>{w.once('message',res);w.once('error',rej);w.postMessage('start')})));
   if(reports.some(r=>r.error)||reports.reduce((s,r)=>s+r.completed,0)!==1000)throw Error('contention_failed');
   details={reports,workers_active_memory:memory()};await Promise.all(workers.map(w=>w.terminate()));
  }
 }
 const elapsed=performance.now()-start,beforeGc=memory();db.close();globalThis.gc();const afterGc=memory();
 console.log(JSON.stringify({phase,elapsed_ms:elapsed,records_per_second:(phase==='contend'?1000:phase==='read'?details.seen:n)*1000/elapsed,initial,before_gc:beforeGc,after_close_gc:afterGc,...details}));
}
