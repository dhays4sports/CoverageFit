// Synthetic local benchmark. Creates and removes temporary SQLite files; no network.
import {statSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {fixture,seed,event,NOW} from '../tests/helpers/prospect-memory-fixture.mjs';
import {planSignal} from '../server/signal-dynamic-planner.mjs';
const sizes=process.argv.slice(2).map(Number);if(!sizes.length)sizes.push(1000);
for(const n of sizes){
 if(!Number.isInteger(n)||n<1||n>50000)throw Error('bounded_synthetic_size_required');
 const f=fixture();try{
  const cpu=process.cpuUsage(),start=performance.now();
  f.db.exec('BEGIN');for(let i=0;i<n;i++)seed(f.db,'bench-'+i);f.db.exec('COMMIT');
  const seeded=performance.now();
  for(let i=0;i<n;i++){
   const p='bench-'+i;
   const result=f.memory.admit(event('event-'+i,[{field:'renewal_date',value:'2026-10-25',policy_line:'AUTO'},{field:'vehicle_count',value:2}],{profile_id:p}),{now:NOW});
   if(result.code!=='ADMITTED')throw Error(result.code);
  }
  const admitted=performance.now();
  for(let i=0;i<n;i++){
   const profile=f.memory.project('qa-memory','bench-'+i,{now:NOW});
   const decision=planSignal(profile,{now:NOW,workflowOwner:'AGENCYZOOM'});
   if(decision.question_field!=='homeowner'||decision.execution_eligibility.sms)throw Error('invalid_decision');
   f.memory.recordDecision(profile,decision);
  }
  const done=performance.now(),usage=process.cpuUsage(cpu);
  console.log(JSON.stringify({records:n,seed_ms:seeded-start,admit_ms:admitted-seeded,evaluate_and_record_ms:done-admitted,
   admission_per_second:n*1000/(admitted-seeded),evaluation_per_second:n*1000/(done-admitted),total_ms:done-start,
   cpu_ms:(usage.user+usage.system)/1000,rss_bytes:process.memoryUsage().rss,database_bytes:statSync(f.path).size,
   journal_mode:f.db.prepare('PRAGMA journal_mode').get().journal_mode,events:f.db.prepare('SELECT count(*) n FROM cf_evidence_events').get().n,
   assertions:f.db.prepare('SELECT count(*) n FROM cf_evidence_assertions').get().n,decisions:f.db.prepare('SELECT count(*) n FROM cf_evidence_decisions').get().n,
   node:process.version,external_actions:0,synthetic_only:true}));
 }finally{f.cleanup()}
}
