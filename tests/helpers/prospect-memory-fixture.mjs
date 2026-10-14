import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prospectMemoryLocal} from '../../server/prospect-memory-local.mjs';
export const NOW='2026-10-14T12:00:00.000Z';
export function open(path){const db=new DatabaseSync(path);return {db,memory:prospectMemoryLocal(db,{syntheticOnly:true})};}
export function seed(db,id='prospect-1',w='qa-memory'){
 db.prepare('INSERT OR IGNORE INTO cf_solo_opportunities(id,workspace_id,owner_id,contact_json,source,last_mutation_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').run(id,w,'qa','{}','synthetic','qa',NOW,NOW);
 db.prepare('INSERT OR IGNORE INTO cf_ucp_customers(id,workspace_id,display_name,created_at,updated_at) VALUES(?,?,?,?,?)').run('cust_'+id,w,'Fictional prospect',NOW,NOW);
 db.prepare('INSERT OR IGNORE INTO cf_ucp_households(id,workspace_id,label,created_at,updated_at) VALUES(?,?,?,?,?)').run('hh_'+id,w,'Fictional household',NOW,NOW);
 db.prepare("INSERT OR IGNORE INTO cf_ucp_opportunity_links VALUES(?,?,?,?, 'seeded_from_opportunity','qa','synthetic',?,?)").run(w,id,'cust_'+id,'hh_'+id,NOW,NOW);
 db.prepare('INSERT OR IGNORE INTO cf_solo_sources VALUES(?,?,?,?,?,?)').run(w,'synthetic','source_'+id,id,'{}',NOW);
}
export function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'cf-memory-')),path=join(dir,'test.sqlite');
 const f=open(path);
 for(const name of readdirSync(new URL('../../migrations/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())f.db.exec(readFileSync(new URL('../../migrations/'+name,import.meta.url),'utf8'));
 f.db.exec(readFileSync(new URL('../migrations/0020_prospect_memory_e2.sql',import.meta.url),'utf8'));
 seed(f.db);
 return {...f,path,dir,cleanup(){try{f.db.close()}catch{}rmSync(dir,{recursive:true,force:true})}};
}
export function event(id='first',claims=[{field:'carrier',value:'AAA'}],extra={}){
 const p=extra.profile_id||'prospect-1';
 return {workspace_id:'qa-memory',profile_id:p,source_event_id:id,source_type:'sms_inbound',observed_at:'2026-10-14T10:00:00Z',
  identity:{status:'linked',verified_reference:true,linked_profile_id:p,customer_id:'cust_'+p,basis:'existing_ucp'},
  source_ref:{kind:'synthetic',id:'source_'+p,locator:'fixture-observations'},
  rights:{internal_insurance_use:true,controller:'synthetic-agency',retain_until:'2027-01-01T00:00:00Z'},observations:claims,...extra};
}
export const project=m=>m.project('qa-memory','prospect-1',{now:NOW});
