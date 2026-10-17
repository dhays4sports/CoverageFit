// Fresh-process, synthetic file-backed workload. No gateway/provider network calls.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {statSync} from 'node:fs';
import {fixture,open,NOW,W,evidence} from '../tests/helpers/sms-accounting-fixture.mjs';
import {fictionalProvider} from '../tests/helpers/sms-fictional-provider.mjs';
const n=Number(process.argv[2]||1000);assert.ok([1000,5000].includes(n));
const f=fixture({rate:40,reserve:2}),ms=()=>performance.now(),rss=()=>process.memoryUsage().rss;
const before=rss(),begin=ms();
for(let i=0;i<n;i++)f.ledger.admit(f.seed('bench-'+i),{now:NOW});
const admissionMs=ms()-begin,afterConstruction=rss();
const worker=new URL('../tests/helpers/sms-accounting-worker.mjs',import.meta.url),loader=new URL('../tests/json-loader.mjs',import.meta.url);
const run=()=>new Promise((resolve,reject)=>{let out='',err='';const child=spawn(process.execPath,['--experimental-loader',loader.pathname,worker.pathname,f.path,f.providerPath,'claim','{}'],{stdio:['ignore','pipe','pipe']});child.stdout.on('data',s=>out+=s);child.stderr.on('data',s=>err+=s);child.on('error',reject);child.on('exit',code=>code?reject(Error(err)):resolve(JSON.parse(out)));});
try{
 const contentionStart=ms(),workers=await Promise.all(Array.from({length:4},run)),contentionMs=ms()-contentionStart;
 assert.equal(workers.reduce((a,w)=>a+w.claims,0),n);assert.equal(workers.reduce((a,w)=>a+w.reserved,0),38);
 assert.equal(f.db.prepare('SELECT count(*) n FROM cf_test_sms_attempts').get().n,38);
 const provider=fictionalProvider(f.providerPath),tickets=[];
 for(const row of f.db.prepare('SELECT a.* , t.attempt_id FROM cf_test_sms_actions a JOIN cf_test_sms_attempts t ON a.action_id=t.action_id ORDER BY a.action_id LIMIT 10').all()){
  const ticket=f.ledger.beginSubmission(row,row.attempt_id,{now:NOW});assert.equal(ticket.code,'SUBMISSION_MARKED');tickets.push(ticket);
 }
 for(const ticket of tickets.slice(0,5))provider.accept(ticket,{now:NOW});provider.close();
 f.db.close();const restartStart=ms(),reopened=open(f.path),restartMs=ms()-restartStart;
 const recoveryStart=ms();let recovered=0,batches=0,largest=0;
 while(true){const r=reopened.ledger.recover(W,{now:NOW+60000,limit:100});largest=Math.max(largest,r.recovered);recovered+=r.recovered;if(!r.recovered)break;batches++;}
 const recoveryMs=ms()-recoveryStart;assert.equal(recovered,n);assert.equal(reopened.db.prepare("SELECT count(*) n FROM cf_test_sms_attempts WHERE state='OUTCOME_UNKNOWN'").get().n,10);
 const p=fictionalProvider(f.providerPath),receipts=p.records(),reconcileStart=ms();
 for(const row of receipts){const ticket=JSON.parse(row.ticket_json),t=reopened.ledger.inspect(W,ticket.action_id).attempts[0];reopened.ledger.reconcile(W,ticket.action_id,ticket.attempt_id,evidence(ticket,{evidence_id:'receipt-'+row.id,provider_id:'fictional-'+row.id}),{now:NOW+60000,expectedRevision:t.revision});}
 const reconcileMs=ms()-reconcileStart;assert.equal(receipts.length,5);assert.equal(reopened.db.prepare("SELECT count(*) n FROM cf_test_sms_actions WHERE state='COMPLETED'").get().n,5);
 const replayStart=ms();for(let i=0;i<n;i++){const a=reopened.db.prepare('SELECT immutable_json FROM cf_test_sms_actions WHERE workspace=? AND relationship=?').get(W,'bench-'+i);assert.equal(reopened.ledger.admit({...JSON.parse(a.immutable_json),synthetic:true},{now:NOW+60000}).code,'DUPLICATE');}
 const replayMs=ms()-replayStart;p.close();reopened.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
 console.log(JSON.stringify({n,admissionMs,admissionsPerSecond:n/admissionMs*1000,replayMs,contentionMs,claimsPerSecond:n/contentionMs*1000,workers,duplicateClaims:0,capacityReservations:38,busyErrors:0,restartMs,recoveryMs,recovered,batches,maxRecoveryBatch:largest,unknownAfterRecovery:10,fictionalAcceptances:5,reconcileMs,unresolvedRemaining:5,memory:{before,afterConstruction,afterWork:rss(),parentPeakKiB:process.resourceUsage().maxRSS},databaseBytes:statSync(f.path).size},null,2));
 reopened.db.close();
}finally{f.cleanup()}
