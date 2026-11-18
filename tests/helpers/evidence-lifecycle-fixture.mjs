import {openAgencyZoomSyntheticStore} from '../../scripts/lib/agencyzoom-offline-store.mjs';
import {soloRepository} from '../../server/solo-desk-repository.mjs';
import {sharedProfileService} from '../../server/shared-prospect-profile.mjs';
import {reviewFixture,feature} from './evidence-review-fixture.mjs';
import {config} from './agencyzoom-fixture.mjs';
export const archivePrincipal={workspace:config.workspace,agencyId:config.agencyId,permission:'agencyzoom:synthetic:archive',actor:'synthetic-owner'};
// Test-only separate canonical bootstrap; archive packages never carry canonical row values.
export async function destination(t,f,{provider=false}={}){const path=f.path+'.restore-'+crypto.randomUUID(),store=openAgencyZoomSyntheticStore(path,config,{create:true});t.after(()=>store.close());const tables=['cf_ucp_customers','cf_ucp_households','cf_ucp_household_members','cf_solo_opportunities','cf_ucp_opportunity_links','cf_solo_tasks'];for(const table of tables){for(const r of await f.query('SELECT * FROM '+table)){const keys=Object.keys(r);await store.repositoryDb.prepare(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(()=>'?')})`).bind(...keys.map(k=>r[k])).run();}}
 if(provider){for(const table of ['sms_conversations','cf_solo_sources'])for(const r of await f.query('SELECT * FROM '+table+(table==='cf_solo_sources'?" WHERE kind NOT IN ('agencyzoom_read_v1','agencyzoom_resource_v2','agencyzoom_sms_v3','desktop_review_v1')":''))){const keys=Object.keys(r);await store.repositoryDb.prepare(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(()=>'?')})`).bind(...keys.map(k=>r[k])).run();}}
 const repo=()=>soloRepository(store.repositoryDb,{workspace:config.workspace,actor:'synthetic-owner'}),read=async(external='op-home')=>{const oid=await f.op(external),cid=(await repo().profile(oid)).customer.id;return sharedProfileService(repo(),{evidenceReview:feature}).read(cid,{opportunityId:oid});};return {path,store,repo,read,query:(q,...v)=>store.repositoryDb.prepare(q).bind(...v).all().then(r=>r.results)};
}
export {reviewFixture};
