import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {fixture as e2Fixture,NOW} from './prospect-memory-fixture.mjs';
import {signalEvaluationQueueLocal} from '../../server/signal-evaluation-queue-local.mjs';
export {event,seed,NOW} from './prospect-memory-fixture.mjs';
export const W='qa-memory',P='prospect-1';
export const authority={actor:'synthetic-test',reference:'local-mandate'};
export const context={population:'DISTRICT_SIGNAL',workflowOwner:'AGENCYZOOM',contact:{sms_permission:false}};
export function fixture(options={}){
 const f=e2Fixture();f.db.exec(readFileSync(new URL('../migrations/0021_signal_evaluation_queue.sql',import.meta.url),'utf8'));
 return {...f,queue:signalEvaluationQueueLocal(f.db,{syntheticOnly:true,...options})};
}
export function reopen(path,options={}){const db=new DatabaseSync(path);return {db,queue:signalEvaluationQueueLocal(db,{syntheticOnly:true,...options})};}
export function configure(f,options=context,p=P){return f.queue.setContext(W,p,options,{now:NOW,requestId:'context-'+p,authority});}
export const batch=(queue,now=NOW,extra={})=>queue.runBatch({workspace:W,now,workerId:'worker-1',limit:10,...extra});
export const count=(db,table)=>db.prepare('SELECT count(*) n FROM '+table).get().n;
export const snapshot=(db,p=P)=>db.prepare('SELECT * FROM cf_evaluation_queue WHERE workspace_id=? AND opportunity_id=?').get(W,p);
export const result=(db,p=P)=>JSON.parse(db.prepare('SELECT decision_json FROM cf_evaluation_results WHERE workspace_id=? AND opportunity_id=? ORDER BY generation DESC LIMIT 1').get(W,p).decision_json);
