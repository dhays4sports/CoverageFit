// Independent, file-backed fictional provider. Deliberately NO deduplication to expose duplicate calls.
// No HTTP client, fetch, credentials, provider package or real destination capability.
import {DatabaseSync} from 'node:sqlite';
export function fictionalProvider(path){
 const db=new DatabaseSync(path);db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=10000; CREATE TABLE IF NOT EXISTS accepted(id INTEGER PRIMARY KEY,attempt_id TEXT,action_id TEXT,ticket_json TEXT,at INTEGER);');
 return {db,accept(ticket,{now}={}){
  if(ticket.syntheticOnly!==true||ticket.code!=='SUBMISSION_MARKED'||ticket.execution_eligibility.external!==false||now<ticket.submissionAt||now>=ticket.validUntil||!/^\+1[2-9]\d{2}55501\d{2}$/.test(ticket.descriptor.to))throw Error('fictional_ticket_required');
  const row=db.prepare('INSERT INTO accepted(attempt_id,action_id,ticket_json,at) VALUES(?,?,?,?) RETURNING id').get(ticket.attempt_id,ticket.action_id,JSON.stringify(ticket),now);
  return {provider_id:'fictional-'+row.id,ticket};
 },records(){return db.prepare('SELECT * FROM accepted ORDER BY id').all()},close(){db.close()}};
}
