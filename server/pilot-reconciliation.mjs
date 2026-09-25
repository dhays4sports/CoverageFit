import {digest,parse} from './solo-desk-repository.mjs';
import {fail} from '../assets/js/solo-desk-model.mjs';
import {PILOT_KIND,PILOT_FLAGS,validateObservation} from './district-pilot.mjs';
const number=(v,max)=>{if(v===null||v===''||v===undefined)return null;if(!Number.isFinite(Number(v))||Number(v)<0||Number(v)>max)fail(422,'measurement','Use a nonnegative measured value, or unknown.');return Number(v)};
export async function measurementLedger(repo,id,received){
 const effort=await repo.rows('SELECT id,minutes,created_at FROM cf_opportunity_effort WHERE workspace_id=? AND opportunity_id=? AND occurred_at>=? ORDER BY id',repo.scope.workspace,id,received);
 const calls=await repo.rows("SELECT id,payload_json,created_at FROM cf_solo_activity WHERE workspace_id=? AND opportunity_id=? AND kind='pilot_call_attempt' AND created_at>=? ORDER BY id",repo.scope.workspace,id,received);
 return {fingerprint:await digest(JSON.stringify([effort,calls])),minutes:effort.length?effort.reduce((s,e)=>s+e.minutes,0):null,calls:calls.length,call_sources:calls.length?['producer confirmed']:[]};
}
export async function measurementLedgers(repo,records){
 const w=repo.scope.workspace;
 const effort=await repo.rows("SELECT e.opportunity_id,e.id,e.minutes,e.created_at FROM cf_opportunity_effort e JOIN cf_solo_sources s ON s.workspace_id=e.workspace_id AND s.opportunity_id=e.opportunity_id AND s.kind=? WHERE e.workspace_id=? AND e.occurred_at>=json_extract(s.summary_json,'$.received_at') ORDER BY e.id",PILOT_KIND,w);
 const calls=await repo.rows("SELECT a.opportunity_id,a.id,a.payload_json,a.created_at FROM cf_solo_activity a JOIN cf_solo_sources s ON s.workspace_id=a.workspace_id AND s.opportunity_id=a.opportunity_id AND s.kind=? WHERE a.workspace_id=? AND a.kind='pilot_call_attempt' AND a.created_at>=json_extract(s.summary_json,'$.received_at') ORDER BY a.id",PILOT_KIND,w);
 const es=new Map(),cs=new Map();for(const [list,map] of [[effort,es],[calls,cs]])for(const {opportunity_id,...row} of list){if(!map.has(opportunity_id))map.set(opportunity_id,[]);map.get(opportunity_id).push(row);}
 const result=new Map();for(const p of records){const e=es.get(p.opportunity_id)||[],c=cs.get(p.opportunity_id)||[];result.set(p.opportunity_id,{fingerprint:await digest(JSON.stringify([e,c])),minutes:e.length?e.reduce((s,r)=>s+r.minutes,0):null,calls:c.length,call_sources:c.length?['producer confirmed']:[]});}return result;
}
export function pilotReconciliation(repo){const w=repo.scope.workspace;
 const get=async id=>{await repo.own(id);const row=await repo.sql('SELECT * FROM cf_solo_sources WHERE workspace_id=? AND opportunity_id=? AND kind=?',w,id,PILOT_KIND).first();if(!row)fail(422,'enrollment','Only enrolled pilot records can be reconciled.');const p=parse(row.summary_json);if(!['NEW_LEAD','TEST'].includes(p.pilot_phase))fail(422,'phase','Unsupported pilot phase');return {row,p};};
 const receipt=async(rid,fp)=>{const a=await repo.sql('SELECT fingerprint,payload_json FROM cf_solo_activity WHERE workspace_id=? AND request_id=?',w,rid).first();if(a&&a.fingerprint!==fp)fail(409,'request_reused','Request already used for different evidence.');return a?parse(a.payload_json):null};
 return {
 async call(v,rid){const {p}=await get(v.id);if(v.confirmed!==true)fail(422,'call_actual','Only record a call you actually attempted.');const fp=await digest(JSON.stringify(['call',v.id]));const old=await receipt(rid,fp);if(old)return old;const at=new Date().toISOString(),payload={attempt_type:'CALL',status:'confirmed',source:'producer confirmed',occurred_at:at,cohort:p.cohort,pilot_phase:p.pilot_phase,duration_seconds:null};
 await repo.sql("INSERT OR IGNORE INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) VALUES(?,?,?,?,'pilot_call_attempt',?,?,?,?)",'call_'+rid,w,v.id,repo.scope.actor,rid,fp,JSON.stringify(payload),at).run();return receipt(rid,fp);
 },
 async preview(v){if(!Array.isArray(v.rows)||!v.rows.length||v.rows.length>100)fail(422,'batch','Select 1–100 enrolled records.');if(new Set(v.rows.map(r=>r.id)).size!==v.rows.length)fail(422,'batch_duplicate','Duplicate opportunity in batch.');const at=new Date().toISOString(),result=[];
 for(const input of v.rows){const {row,p}=await get(input.id),ledger=await measurementLedger(repo,input.id,p.received_at),old=p.observation||{};
 const o={...Object.fromEntries(PILOT_FLAGS.map(k=>[k,old[k]??null])),...old,final_status:old.final_status||'OPEN'};
 const patch=input.outcomes||{};const allowed=[...PILOT_FLAGS,'final_status','future_bind_date','future_bind_month','bound_premium','farmers_policy_count'];
 for(const [key,value] of Object.entries(patch)){if(!allowed.includes(key))fail(422,'field','Unsupported reconciliation field');if(old[key]===true&&value!==true)fail(409,'outcome_conflict','Batch cannot erase a verified outcome; review the exception.');o[key]=value;}
 if(old.stop===true&&o.final_status!=='STOP')fail(409,'suppression','Batch cannot clear STOP.');
 if((o.quote||o.bind)&&Object.keys(patch).length)o.outcome_evidence='Authenticated producer reconciliation against normal business records';
 const valid=validateObservation(o,p.received_at,at);
 const farmers=Object.hasOwn(patch,'farmers_policy_count')?number(patch.farmers_policy_count,1000):old.farmers_policy_count??null;
 if(farmers!==null&&(!Number.isInteger(farmers)||valid.bind!==true))fail(422,'policy_count','Farmers policy count requires an actual bind; use an integer or unknown.');valid.farmers_policy_count=farmers;
 const measure=input.measure||{},allowedMeasures=['effort_mode','producer_minutes','calls_mode','call_attempts'];if(Object.keys(measure).some(k=>!allowedMeasures.includes(k)))fail(422,'measurement','Unsupported measurement field');
 const previous=p.reconciliation,stillCurrent=previous?.ledger_fingerprint===ledger.fingerprint;
 let minutes=stillCurrent?previous.producer_minutes:null,calls=stillCurrent?previous.call_attempts:null;
 const modes=['preserve','recorded','zero','total','unknown'];for(const k of ['effort_mode','calls_mode'])if(measure[k]&&!modes.includes(measure[k]))fail(422,'measurement','Unsupported reconciliation mode');
 if(measure.effort_mode==='recorded')minutes=ledger.minutes===null&&previous?.producer_minutes==null?null:(ledger.minutes||0)+Math.max(0,(previous?.producer_minutes||0)-(previous?.ledger_minutes||0));
 if(measure.effort_mode==='zero'){if(ledger.minutes!==null||ledger.calls)fail(409,'zero_conflict','Work evidence exists. Zero effort cannot be assumed.');minutes=0;}
 if(measure.effort_mode==='total')minutes=number(measure.producer_minutes,100000);
 if(measure.effort_mode==='unknown')minutes=null;
 if(minutes===0&&ledger.calls)fail(409,'effort_conflict','Actual call attempts cannot be certified as no work.');
 if(minutes!==null&&minutes<Math.max(ledger.minutes||0,previous?.producer_minutes||0))fail(409,'effort_conflict','Total cannot be less than recorded effort.');
 if(measure.calls_mode==='recorded')calls=ledger.calls+Math.max(0,(previous?.call_attempts||0)-(previous?.ledger_calls||0));
 if(measure.calls_mode==='zero'){if(ledger.calls)fail(409,'calls_conflict','Recorded calls exist.');calls=0;}
 if(measure.calls_mode==='total')calls=number(measure.call_attempts,100000);
 if(measure.calls_mode==='unknown')calls=null;
 if(calls!==null&&(!Number.isInteger(calls)||calls<Math.max(ledger.calls,previous?.call_attempts||0)))fail(409,'calls_conflict','Call total must include recorded attempts.');
 // Reviewing outcomes alone must not invent effort/call completeness.
 valid.effort_complete=minutes!==null;valid.zero_effort_confirmed=minutes===0;
 const next={...p,version:p.version+1,observation:valid,reconciliation:{producer_minutes:minutes,call_attempts:calls,call_sources:calls!==null?['producer confirmed']:ledger.call_sources,ledger_fingerprint:ledger.fingerprint,ledger_minutes:ledger.minutes||0,ledger_calls:ledger.calls,reviewed_at:at,source:'producer confirmed against normal business records'}};
 result.push({id:input.id,cohort:p.cohort,pilot_phase:p.pilot_phase,version:p.version,ledger_fingerprint:ledger.fingerprint,before:row.summary_json,next});
 }
 const fingerprint=await digest(JSON.stringify([v.rows,result.map(r=>[r.id,r.before,r.ledger_fingerprint])]));return {fingerprint,rows:result};
 },
 async apply(v,rid){const fp=await digest(JSON.stringify(['reconcile',v.rows,v.fingerprint]));const old=await receipt(rid,fp);if(old)return old;if(v.confirmed!==true)fail(422,'confirmation','Confirm the reviewed batch against normal records.');const preview=await this.preview(v);if(preview.fingerprint!==v.fingerprint)fail(409,'batch_stale','Records or work changed. Preview again; nothing saved.');
 const at=new Date().toISOString();const results=[];
 // Per-row CAS is intentional: return exceptions; never silently claim whole-batch success.
 for(const r of preview.rows){const rowRid=await digest(rid+'|'+r.id),rowFp=await digest(r.before+'|'+r.ledger_fingerprint);const done=await receipt(rowRid,rowFp);if(done){results.push(done);continue;}
 const payload={action:'batch_reconciled',id:r.id,cohort:r.cohort,pilot_phase:r.pilot_phase,source:'producer confirmed',reconciliation:r.next.reconciliation};
 const countEff=await repo.sql('SELECT COUNT(*) n FROM cf_opportunity_effort WHERE workspace_id=? AND opportunity_id=? AND occurred_at>=?',w,r.id,r.next.received_at).first();
 const countCalls=await repo.sql("SELECT COUNT(*) n FROM cf_solo_activity WHERE workspace_id=? AND opportunity_id=? AND kind='pilot_call_attempt' AND created_at>=?",w,r.id,r.next.received_at).first();
 if((await measurementLedger(repo,r.id,r.next.received_at)).fingerprint!==r.ledger_fingerprint){results.push({id:r.id,status:'conflict'});continue;}
 const out=await repo.db.batch([repo.sql(`UPDATE cf_solo_sources SET summary_json=?,updated_at=? WHERE workspace_id=? AND kind=? AND opportunity_id=? AND summary_json=? AND (SELECT COUNT(*) FROM cf_opportunity_effort WHERE workspace_id=? AND opportunity_id=? AND occurred_at>=?)=? AND (SELECT COUNT(*) FROM cf_solo_activity WHERE workspace_id=? AND opportunity_id=? AND kind='pilot_call_attempt' AND created_at>=?)=?`,JSON.stringify(r.next),at,w,PILOT_KIND,r.id,r.before,w,r.id,r.next.received_at,countEff.n,w,r.id,r.next.received_at,countCalls.n),repo.sql("INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) SELECT ?,?,?,?,'pilot_reconciliation',?,?,?,? WHERE changes()=1",'recon_'+rowRid,w,r.id,repo.scope.actor,rowRid,rowFp,JSON.stringify({...payload,status:'saved'}),at)]);
 results.push({id:r.id,status:out[0].meta?.changes===1?'saved':'conflict'});
 }
 const response={results,saved:results.filter(r=>r.status==='saved').length};await repo.sql("INSERT INTO cf_solo_activity(id,workspace_id,opportunity_id,actor_id,kind,request_id,fingerprint,payload_json,created_at) VALUES(?,?,?,?,'pilot_reconciliation_batch',?,?,?,?)",'batch_'+rid,w,preview.rows[0].id,repo.scope.actor,rid,fp,JSON.stringify(response),at).run();return response;
 }
 };
}
