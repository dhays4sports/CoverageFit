import {parentPort,workerData} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {reopen,W} from './evaluation-queue-fixture.mjs';
const f=reopen(workerData.path);parentPort.postMessage({ready:true});
parentPort.once('message',async()=>{
 const start=performance.now();let completed=0,claimed=0,maxExamined=0,recovered=0,maxLag=0,loops=0;const latencies=[];
 try{
  do{
   const t=performance.now();
   const b=workerData.claimOnly?f.queue.claim({workspace:W,now:workerData.now,workerId:workerData.workerId,limit:workerData.limit||25,leaseMs:workerData.leaseMs||30000})
    :f.queue.runBatch({workspace:W,now:workerData.now,workerId:workerData.workerId,limit:workerData.limit||25});
   latencies.push(performance.now()-t);claimed+=b.claims.length;maxExamined=Math.max(maxExamined,b.examined);recovered+=b.claims.filter(c=>c.recovered).length;
   for(const c of b.claims)maxLag=Math.max(maxLag,c.lag_ms);
   completed+=(b.outcomes||[]).filter(o=>o.code==='ACKNOWLEDGED').length;loops++;
   if(workerData.claimOnly){parentPort.postMessage({claims:b.claims});return}
   if(!workerData.drain||(!b.claims.length&&!b.examined))break;
   await new Promise(resolve=>setTimeout(resolve,1)); // Cooperative local test-worker polling.
  }while(loops<10000);
  latencies.sort((a,b)=>a-b);
  parentPort.postMessage({completed,claimed,maxExamined,recovered,maxLag,loops,elapsed_ms:performance.now()-start,batch_latency_p95_ms:latencies[Math.floor((latencies.length-1)*.95)]});
 }catch(e){parentPort.postMessage({error:e.message});}finally{f.db.close();parentPort.close()}
});
