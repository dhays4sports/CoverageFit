// Independent reference implementation from an immutable PR #22 checkout.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {fixture,binding} from '../tests/helpers/portable-read-fixture.mjs';
import {event,configure,context,batch,W,P,NOW} from '../tests/helpers/evaluation-queue-fixture.mjs';
import {producerIntelligencePortable} from '../server/producer-intelligence-portable.mjs';
const root=process.argv[2];if(!root)throw Error('Pass immutable PR22 checkout path');
const {signalCurrentDecisionLocal}=await import(pathToFileURL(resolve(root,'server/signal-current-decision-local.mjs')));
const cases=[];
for(const mode of ['call','quote','waiting','conflict','history','STOP','CONTROL','unknown','future','expired','retracted']){
 const f=fixture();try{
  configure(f,mode==='STOP'?{...context,contact:{suppressed:true}}:mode==='CONTROL'?{...context,population:'CONTROL'}:mode==='unknown'?{...context,workflowOwner:'UNKNOWN'}:context);
  const field=mode==='quote'?'explicit_quote_request':mode==='waiting'?'carrier':'explicit_call_request';f.queue.memory.admit(event('original',[{field,value:field==='carrier'?'AAA':true}]),{now:NOW});
  if(mode==='history')for(let i=0;i<20;i++)f.queue.memory.admit(event('old-'+i,[{field:'vehicle_count',value:2}]),{now:NOW});
  if(mode==='conflict')for(const [id,value] of [['a','2026-11-01'],['b','2026-12-01']])f.queue.memory.admit(event(id,[{field:'renewal_date',value,policy_line:'auto'}]),{now:NOW});
  batch(f.queue,NOW);if(mode==='retracted')f.queue.memory.erase(W,f.queue.memory.eventKey(event('original')),'RETRACTED',{now:NOW});
  const now=mode==='future'?'2026-10-14T12:00:01.000Z':mode==='expired'?'2027-01-02T12:00:00.000Z':NOW;
  const baseline=signalCurrentDecisionLocal(f.db,{syntheticOnly:true}).current(W,P,{now});
  const portable=await producerIntelligencePortable(binding(f.db),{syntheticOnly:true}).read({workspace:W,actor:'synthetic',workspaceRead:true,id:P,now});
  assert.deepEqual(portable.decision,baseline,mode);cases.push({mode,status:baseline.status,evidence_version:baseline.evidence_version,decision_version:baseline.decision_version});
 }finally{f.cleanup()}
}
console.log(JSON.stringify({baseline:'80cb58ae7793d7bccabd084ffce1994f284cfdba',passed:cases.length,cases},null,2));
