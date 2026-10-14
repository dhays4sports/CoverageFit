// Fresh build process AND separate fresh read-only process per population.
import {spawnSync} from 'node:child_process';
import {mkdtempSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {signalEvaluationQueueLocal} from '../server/signal-evaluation-queue-local.mjs';
import {fixture,portableViews} from '../tests/helpers/portable-read-fixture.mjs';
import {seed,event,configure,context,batch,W,NOW} from '../tests/helpers/evaluation-queue-fixture.mjs';
import {request} from '../tests/helpers/producer-intelligence-fixture.mjs';
const [mode,path,nArg]=process.argv.slice(2),n=Number(nArg),mem=()=>({rss_bytes:process.memoryUsage().rss,heap_used_bytes:process.memoryUsage().heapUsed,peak_rss_bytes:process.resourceUsage().maxRSS*1024});
if(!mode){for(const size of [1000,5000,20000,50000]){
 const dir=mkdtempSync(join(tmpdir(),'cf-portable-scale-')),file=join(dir,'db.sqlite');
 try{const run=m=>{const p=spawnSync(process.execPath,['--experimental-loader','./tests/json-loader.mjs',import.meta.filename,m,file,String(size)],{encoding:'utf8',maxBuffer:4*1024*1024});if(p.status!==0)throw Error(p.stderr+'\n'+p.stdout);return JSON.parse(p.stdout)};
 console.log(JSON.stringify({prospects:size,synthetic_only:true,build:run('build'),read:run('read'),invalidation:run('backlog'),backlog_read:run('backlog-read')}));}finally{rmSync(dir,{recursive:true,force:true})}
}}else if(mode==='build'){
 const f=fixture(),start=mem(),t=performance.now();try{
  f.db.exec('BEGIN');for(let i=0;i<n;i++)seed(f.db,'scale-'+String(i).padStart(6,'0'));f.db.exec('COMMIT');
  for(let i=0;i<n;i++){const p='scale-'+String(i).padStart(6,'0');configure(f,context,p);f.queue.memory.admit(event('e-'+p,[{field:i>=n-100?'explicit_call_request':'carrier',value:i>=n-100?true:'AAA'}],{profile_id:p}),{now:NOW});}
  let count=0;while(count<n){const b=batch(f.queue,NOW,{limit:100});if(!b.claims.length||b.outcomes.some(x=>x.code!=='ACKNOWLEDGED'))throw Error('evaluation_failed');count+=b.outcomes.length}
  // A material-history page: 20 additional retained assertions per urgent prospect.
  for(let i=n-100;i<n;i++){const p='scale-'+String(i).padStart(6,'0');for(let h=0;h<20;h++)f.queue.memory.admit(event('h-'+p+'-'+h,[{field:'vehicle_count',value:2}],{profile_id:p}),{now:NOW});}
  while(batch(f.queue,NOW,{limit:100}).claims.length){}
  const result={ms:performance.now()-t,start,end:mem()};f.db.close();copyFileSync(f.path,path);console.log(JSON.stringify(result));
 }finally{f.cleanup()}
}else if(mode==='read'){
 const db=new DatabaseSync(path,{readOnly:true}),start=mem(),v=portableViews({db}),samples=[],sql=[],validation=[],cpuStart=process.cpuUsage();let first,external=0;
 globalThis.fetch=()=>{external++;throw Error('no external operations')};
 try{const before=db.prepare('SELECT total_changes() n').get().n;
 for(let i=0;i<30;i++){const t=performance.now(),p=await v.service.today(request());samples.push(performance.now()-t);sql.push(p.read_metrics.selection_ms);validation.push(p.read_metrics.validation_ms);first??=p;
 if(p.today.length!==25||p.today[0].opportunity_id!=='scale-'+String(n-100).padStart(6,'0')||p.read_metrics.queries!==1)throw Error('selection_failed');}
 let cursor='',seen=[];do{const p=await v.service.attention(request(),{after:cursor});seen.push(...p.records.map(r=>r.id));cursor=p.next_cursor}while(cursor);if(seen.length!==100||new Set(seen).size!==100)throw Error('paging_failed');
 const receipt=v.db.receipts[0],s=db.prepare('EXPLAIN QUERY PLAN '+receipt.sql);s.setAllowUnknownNamedParameters(true);const params=Object.fromEntries(receipt.args.map((v,i)=>['?'+(i+1),v]));const plan=s.all(params).map(x=>x.detail);
 // Instrument actual indexed-row visits inside the same statement, no emulated scan counts.
 const visits={candidates:0,events:0,assertions:0};for(const k of Object.keys(visits))db.function('cf_visit_'+k,_=>{visits[k]++;return 1});
 const instrumented=receipt.sql.replace('q.attention_eligible=1','q.attention_eligible=1 AND cf_visit_candidates(q.opportunity_id)').replace('e.opportunity_id=c.opportunity_id ORDER BY','e.opportunity_id=c.opportunity_id AND cf_visit_events(e.event_key) ORDER BY').replace('a.event_key=ev.event_key ORDER BY','a.event_key=ev.event_key AND cf_visit_assertions(a.assertion_id) ORDER BY');
 const probe=db.prepare(instrumented);probe.setAllowUnknownNamedParameters(true);probe.all(params);
 if(visits.candidates!==26||visits.events!==525||visits.assertions!==525)throw Error('unexpected_visits '+JSON.stringify(visits));
 if(db.prepare('SELECT total_changes() n').get().n!==before)throw Error('read_mutation');
 const stats=a=>{const s=[...a].sort((a,b)=>a-b);return {mean_ms:s.reduce((a,b)=>a+b,0)/s.length,p50_ms:s[Math.ceil(s.length*.5)-1],p95_ms:s[Math.ceil(s.length*.95)-1]}};
 console.log(JSON.stringify({samples:30,events_per_current:21,page_size:25,page:stats(samples),sql:stats(sql),projection:stats(validation),cpu_us:process.cpuUsage(cpuStart),start,end:mem(),query_count:1,bindings:8,sql_bytes:first.read_metrics.sql_bytes,response_bytes:first.read_metrics.response_bytes,visits,plan,coverage:first.selection_coverage,pagination:{records:seen.length,unique:new Set(seen).size},sqlite_changes:0,external_actions:external}));
 }finally{db.close()}
}
else if(mode==='backlog'){
 const db=new DatabaseSync(path),queue=signalEvaluationQueueLocal(db,{syntheticOnly:true}),t=performance.now();
 try{for(let i=0;i<n-1;i++){const p='scale-'+String(i).padStart(6,'0');if(queue.memory.admit(event('invalidate-'+p,[{field:'homeowner',value:true}],{profile_id:p}),{now:NOW}).code!=='ADMITTED')throw Error('invalidation_failed')}
 console.log(JSON.stringify({updates:n-1,ms:performance.now()-t,mean_ms:(performance.now()-t)/(n-1)}));}finally{db.close()}
}else if(mode==='backlog-read'){
 const db=new DatabaseSync(path,{readOnly:true}),v=portableViews({db}),samples=[];let last;
 try{for(let i=0;i<30;i++){const t=performance.now();last=await v.service.today(request());samples.push(performance.now()-t);if(last.today.length!==1||last.today[0].opportunity_id!=='scale-'+String(n-1).padStart(6,'0')||!last.selection_coverage.pending_evaluation)throw Error('backlog_failed')}
 samples.sort((a,b)=>a-b);console.log(JSON.stringify({p50_ms:samples[14],p95_ms:samples[28],query_count:1,coverage:last.selection_coverage,metrics:last.read_metrics,memory:mem()}));}finally{db.close()}
}
