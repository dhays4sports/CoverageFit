import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
import {openAgencyZoomSyntheticStore} from './lib/agencyzoom-offline-store.mjs';
import {simulatedAgencyZoomTransport,synchronizeAgencyZoom} from '../server/agencyzoom-connector.mjs';
import {soloRepository} from '../server/solo-desk-repository.mjs';
import {producerWorkspace} from '../server/producer-workspace.mjs';
import {sharedProfileService} from '../server/shared-prospect-profile.mjs';
import {sharedWorkspaceHTML} from '../assets/js/shared-workspace-panel.mjs';
const config={enabled:true,mode:'offline_synthetic',workspace:'future-agency:synthetic:dylan',agencyId:'synthetic-dylan',databaseId:'az-test-dylan'};
const principal={workspace:config.workspace,agencyId:config.agencyId,permission:'agencyzoom:synthetic:read'};
const dir=mkdtempSync(join(tmpdir(),'cf-az-demo-')),store=openAgencyZoomSyntheticStore(join(dir,'synthetic.sqlite'),config,{create:true});
try {
 const lead=JSON.parse(readFileSync(new URL('../tests/fixtures/agencyzoom/lead.json',import.meta.url)));
 const sync=()=>synchronizeAgencyZoom({config,principal,store,transport:simulatedAgencyZoomTransport([{agencyId:config.agencyId,records:[lead],hasMore:false}])});
 const initial=await sync();lead.revision='r2';lead.stage='review';lead.updatedAt='2026-11-18T11:00:00.000Z';lead.notes[0].body='Updated synthetic evidence; no customer contact.';
 const update=await sync(),replay=await sync();
 const repo=soloRepository(store.repositoryDb,{workspace:config.workspace,actor:'synthetic-owner'}),work=producerWorkspace(repo,{CF_SHARED_PROFILE_ENABLED:'1'}),list=await work.list(new URLSearchParams({population:'ALL'})),detail=await work.detail(list.records[0].id);
 const profile=await sharedProfileService(repo).read(detail.customerProfile.customer.id,{opportunityId:detail.opportunity.id});
 assert.equal(initial.changed,1);assert.equal(update.changed,1);assert.equal(replay.changed,0);assert.equal(list.records.length,2);assert.equal(profile.links.length,2);assert.equal(profile.items.length,0);assert.equal(profile.tasks.length,0);
 const receipt={mandate:'CF-AGENCYZOOM-CONNECTOR-FOUNDATION-0.1',status:'PASS_OFFLINE_SYNTHETIC',initial,update,replay,canonicalCustomer:profile.customerId,opportunities:list.records.map(r=>({id:r.id,name:r.name,products:r.products,source:r.source,population:r.population})),sharedProfileSourceRevision:profile.context.sources[0].summary.revision,localTasks:profile.tasks.length,approvedFacts:profile.items.length,outboundCommunications:0,liveAuthentication:false,productionActivation:false};
 const output=new URL('../docs/agencyzoom/',import.meta.url);
 writeFileSync(new URL('synthetic-receipt.json',output),JSON.stringify(receipt,null,2)+'\n');
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const snapshot=sharedWorkspaceHTML({status:'ready',...profile},'Evidence').replace(/<button\b[^>]*>/g,'<button disabled>');
 writeFileSync(new URL('synthetic-demo.html',output),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AgencyZoom offline acceptance</title><style>body{font:16px system-ui;background:#f1f5f9;color:#16243c;max-width:1080px;margin:40px auto;padding:24px}section,article{background:white;border:1px solid #cbd5e1;border-radius:12px;padding:22px;margin:16px 0}h1,h2,h3{color:#16345c}small{display:block}button{padding:10px}pre{white-space:pre-wrap;overflow-wrap:anywhere}.sw-tabs{display:flex;gap:8px;flex-wrap:wrap}</style><h1>AgencyZoom → CoverageFit</h1><p>Synthetic acceptance snapshot from existing Work and Shared Prospect 360 projections. No live account, API, send or production activation. Snapshot controls are disabled.</p><section><h2>Existing Work · All populations</h2>${list.records.map(r=>`<article><strong>${esc(r.name)}</strong><p>${esc(r.products)} · ${esc(r.source)} · ${esc(r.population)}</p></article>`).join('')}</section>${snapshot}<section><h2>Acceptance receipt</h2><pre>${esc(JSON.stringify(receipt,null,2))}</pre></section></html>`);
 console.log(JSON.stringify({status:receipt.status,new:initial.changed,updated:update.changed,replay:replay.changed,opportunities:list.records.length,outboundCommunications:0}));
} finally {store.close();rmSync(dir,{recursive:true,force:true});}
