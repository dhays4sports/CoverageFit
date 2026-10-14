// C4 paired C3/C4 read overhead. Synthetic file-backed SQLite only; no provider operations.
import {performance} from 'node:perf_hooks';
import {fixture,seed,event,configure,batch,NOW,W} from '../tests/helpers/evaluation-queue-fixture.mjs';
import {views,request} from '../tests/helpers/producer-intelligence-fixture.mjs';
import {signalCurrentDecisionLocal} from '../server/signal-current-decision-local.mjs';
for(const n of [1000,5000]){
 const f=fixture();try{
  f.db.exec('BEGIN');for(let i=0;i<n;i++)seed(f.db,'bench-'+String(i).padStart(6,'0'));f.db.exec('COMMIT');
  for(let i=0;i<n;i++){const p='bench-'+String(i).padStart(6,'0');configure(f,undefined,p);if(f.queue.memory.admit(event('request-'+i,[{field:'explicit_call_request',value:true}],{profile_id:p}),{now:NOW}).code!=='ADMITTED')throw Error('admission_failed')}
  let completed=0;while(completed<n){const b=batch(f.queue,NOW,{limit:100});completed+=b.outcomes.filter(x=>x.code==='ACKNOWLEDGED').length;if(!b.claims.length)throw Error('drain_failed')}
  const svc=views(f),req=request(),reader=signalCurrentDecisionLocal(f.db,{syntheticOnly:true}),times={c3:[],c4:[]};
  const before=f.db.prepare('SELECT total_changes() n').get().n;
  for(let i=0;i<100;i++){
   // Alternate order to reduce warm-cache/order bias; same first 25 persisted prospects.
   for(const key of i%2?['c4','c3']:['c3','c4']){
    const t=performance.now();const value=key==='c3'?reader.page(W,{now:NOW,limit:25}):await svc.list(req,{limit:25});times[key].push(performance.now()-t);
    const records=value.items||value.records;if(records.length!==25)throw Error('page_size_mismatch');
    if(key==='c4'&&records.some(r=>!r.human_attention_eligible||r.execution_authority.call))throw Error('invalid_handoff');
   }
  }
  let after='',rows=0,pages=0,maxRows=0;const scanStart=performance.now();
  do{const page=await svc.list(req,{after,limit:25});rows+=page.records.length;pages++;maxRows=Math.max(maxRows,page.records.length);after=page.next_cursor}while(after);
  const scanMs=performance.now()-scanStart;if(rows!==n+1)throw Error('pagination_mismatch');
  if(f.db.prepare('SELECT total_changes() n').get().n!==before)throw Error('read_mutation');
  const summary=values=>{const a=[...values].sort((a,b)=>a-b);return {mean_ms:a.reduce((x,y)=>x+y,0)/a.length,p50_ms:a[49],p95_ms:a[94],max_ms:a.at(-1)}};
  const c3=summary(times.c3),c4=summary(times.c4);
  console.log(JSON.stringify({records:n,seed_identity_extra:1,node:process.version,sample_pages:100,page_size:25,c3,c4,mean_added_ms:c4.mean_ms-c3.mean_ms,scan:{rows,pages,max_rows:maxRows,elapsed_ms:scanMs},rss_bytes:process.memoryUsage().rss,sqlite_changes_during_reads:0,synthetic_only:true,external_actions:0}));
 }finally{f.cleanup()}
}
