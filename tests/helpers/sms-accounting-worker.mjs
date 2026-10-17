import {open,NOW,W,input,evidence} from './sms-accounting-fixture.mjs';
import {fictionalProvider} from './sms-fictional-provider.mjs';
const [path,providerPath,mode,payload]=process.argv.slice(2),args=JSON.parse(payload||'{}');
const f=open(path),now=args.now??NOW;
if(mode==='admit'){console.log(JSON.stringify(f.ledger.admit(args.raw||input(),{now})));}
else if(mode==='recover'){console.log(JSON.stringify(f.ledger.recover(W,{now,limit:500})));}
else if(mode==='claim'){
 const began=performance.now();let claims=0,reserved=0,waits=0;for(const action_id of (args.actions||f.db.prepare('SELECT action_id FROM cf_test_sms_actions WHERE workspace=? ORDER BY action_id').all(W).map(x=>x.action_id))){const c=f.ledger.claim(W,action_id,{now,worker:'process-'+process.pid});if(c.code!=='CLAIMED')continue;claims++;const r=f.ledger.reserve(c,{now});if(r.code==='RESERVED')reserved++;else waits++;}console.log(JSON.stringify({claims,reserved,waits,elapsedMs:performance.now()-began,maxRssKiB:process.resourceUsage().maxRSS}));
}else if(mode==='crash'){
 if(args.point==='before_admission')process.exit(70);
 const a=f.ledger.admit(args.raw||input(),{now});if(args.point==='after_admission')process.exit(70);
 const c=f.ledger.claim(W,a.action_id,{now,worker:'crash-worker',leaseMs:1000});if(args.point==='after_claim')process.exit(70);
 const r=f.ledger.reserve(c,{now});if(args.point==='after_reservation')process.exit(70);
 const ticket=f.ledger.beginSubmission(c,r.attempt_id,{now});if(args.point==='after_marker')process.exit(70);
 const provider=fictionalProvider(providerPath),accepted=provider.accept(ticket,{now});provider.close();
 if(args.point==='response_loss')process.exit(70);
 if(args.point==='ack_persistence_failure'){
  f.db.exec("CREATE TEMP TRIGGER injected_ack_failure BEFORE UPDATE ON cf_test_sms_attempts WHEN NEW.state='ACKNOWLEDGED' BEGIN SELECT RAISE(ABORT,'injected_ack_failure'); END;");
  try{f.ledger.reconcile(W,a.action_id,r.attempt_id,evidence(ticket,{provider_id:accepted.provider_id}),{now,expectedRevision:2});throw Error('failure_not_injected')}catch(e){if(e.message!=='injected_ack_failure')throw e}
  if(f.db.prepare('SELECT count(*) n FROM cf_test_sms_evidence').get().n!==0)throw Error('ack_transaction_not_rolled_back');
  process.exit(70);
 }
 f.ledger.reconcile(W,a.action_id,r.attempt_id,evidence(ticket,{provider_id:accepted.provider_id}),{now,expectedRevision:2});
 console.log(JSON.stringify({action_id:a.action_id}));
}else throw Error('invalid_worker_mode');
f.db.close();
