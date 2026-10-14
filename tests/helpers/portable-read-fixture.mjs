import {readFileSync} from 'node:fs';
import {fixture as queueFixture} from './evaluation-queue-fixture.mjs';
import {producerIntelligencePortable} from '../../server/producer-intelligence-portable.mjs';
import {authority} from './producer-intelligence-fixture.mjs';
import {NOW} from './evaluation-queue-fixture.mjs';
import {producerIntelligenceRead} from '../../server/producer-intelligence-read.mjs';
export function fixture(){const f=queueFixture();f.db.exec(readFileSync(new URL('../migrations/0023_bounded_read_history.sql',import.meta.url),'utf8'));return f}
// Implements binding shape only; SQLite execution is real. Not a D1 emulator/certification.
export function binding(db,{before,after}={}){
 const receipts=[];
 return {receipts,withSession(mode){if(mode!=='first-primary')throw Error('primary_required');return {prepare(sql){
  if(!sql.startsWith('WITH ')||/\b(?:INSERT|UPDATE|DELETE|PRAGMA|BEGIN|COMMIT|REPLACE)\b/i.test(sql))throw Error('read_only_sql_required');
  return {bind(...args){if(args.length>100)throw Error('D1_BIND_LIMIT');return {async all(){
   await before?.();const changes=db.prepare('SELECT total_changes() n').get().n;
   // Node uses named objects for SQLite numbered placeholders; D1 bind uses positional values.
   const parameters=Object.fromEntries(args.map((v,i)=>['?'+(i+1),v]));
   const stmt=db.prepare(sql);stmt.setAllowUnknownNamedParameters(true);
   const results=stmt.all(parameters);receipts.push({sql,args,rows:results.length});
   const changed=db.prepare('SELECT total_changes() n').get().n!==changes;await after?.();
   return {success:true,results,meta:{changed_db:changed,rows_written:changed?1:0}};
  }}}};
 }}}};
}
export function portableViews(f,options={}){const db=binding(f.db,options);return {db,service:producerIntelligenceRead({authorize:authority(),clock:()=>NOW,...options,store:producerIntelligencePortable(db,{syntheticOnly:true})})}}
