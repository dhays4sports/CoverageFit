import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {openAgencyZoomSyntheticStore} from '../../scripts/lib/agencyzoom-offline-store.mjs';
import {simulatedAgencyZoomTransport,synchronizeAgencyZoom,synchronizeAgencyZoomEvidence} from '../../server/agencyzoom-connector.mjs';
import {soloRepository} from '../../server/solo-desk-repository.mjs';import {sharedProfileService} from '../../server/shared-prospect-profile.mjs';
export const config={enabled:true,mode:'offline_synthetic',workspace:'future-agency:synthetic:dylan',agencyId:'synthetic-dylan',databaseId:'az-test-dylan'};
export const principal={workspace:config.workspace,agencyId:config.agencyId,permission:'agencyzoom:synthetic:read'};
export const load=name=>JSON.parse(readFileSync(new URL('../fixtures/agencyzoom/'+name+'.json',import.meta.url)));
export const page=(records,hasMore=false)=>({agencyId:config.agencyId,records,hasMore});
export const code=name=>e=>e.code===name;
export async function fixture(t){t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-18T18:00:00.000Z')});const dir=mkdtempSync(join(tmpdir(),'cf-az02-')),path=join(dir,'synthetic.sqlite');let store=openAgencyZoomSyntheticStore(path,config,{create:true});t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});
 const repo=()=>soloRepository(store.repositoryDb,{workspace:config.workspace,actor:'synthetic-owner'});
 const query=(q,...values)=>store.repositoryDb.prepare(q).bind(...values).all().then(r=>r.results);
 const sync=(records,options={})=>synchronizeAgencyZoomEvidence({config,principal,store,transport:simulatedAgencyZoomTransport([page(records)]),sleep:async()=>{},...options});
 await synchronizeAgencyZoom({config,principal,store,transport:simulatedAgencyZoomTransport([page([load('lead')])])});
 const op=async external=>(await query("SELECT canonical_id FROM az_external_ids WHERE entity='opportunity' AND external_id=?",external))[0].canonical_id;
 async function profile(external='op-home'){const id=await op(external),link=(await repo().profile(id)).customer;return sharedProfileService(repo()).read(link.id,{opportunityId:id});}
 async function review(row,value,{supersedes=null,requestId=crypto.randomUUID()}={}){const p=await profile();return sharedProfileService(repo()).commit({requestId,customerId:p.customerId,opportunityId:p.view.opportunityId,expectedVersion:p.version,threadId:'synthetic-review',threadTitle:'Explicit synthetic policy date review',approved:true,items:[{id:'choice',kind:'fact',label:'Reviewed policy date',value,confidence:'verified',verification:'verified',freshness:'current',factKey:row.factKey,externalEvidence:{sourceId:row.sourceId,revision:row.revision,digest:row.digest,field:row.field},...(supersedes?{supersedes}:{}),sources:['source-copy']}],evidence:{messages:[{id:'source-copy',role:'user',body:JSON.stringify({source:row,producerChoice:value}),created:new Date().toISOString(),captureIds:[]}],captures:[]}});}
 return {path,get store(){return store;},repo,query,sync,op,profile,review,reopen(){store.close();store=openAgencyZoomSyntheticStore(path,config);}};
}
