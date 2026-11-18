import {normalizeAgencyZoomSms,AZ_SMS_KIND} from './agencyzoom-sms-contract.mjs';
import {externalId,reject} from './agencyzoom-contract-utils.mjs';
export {externalId,reject} from './agencyzoom-contract-utils.mjs';
import {normalizeAgencyZoomResource,AZ_RESOURCE_KIND} from './agencyzoom-resource-contract.mjs';
// Offline read contract, deliberately NOT an AgencyZoom HTTP implementation.
// Future authenticated clients must translate verified API payloads into this contract.
export const AZ_KIND = 'agencyzoom_read_v1';
export const AZ_EXTENSIONS = Object.freeze(['customer_policies', 'sms_threads', 'email_messages']);
function object(v, keys) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.getPrototypeOf(v) !== Object.prototype || Object.keys(v).some(k => !keys.includes(k))) reject('unsupported_fields');
}
function text(v, max = 160) { if (typeof v !== 'string' || !v.trim() || v.length > max || /[\u0000-\u001f]/.test(v)) reject('malformed_field'); return v; }
function date(v) { text(v, 30); if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString() !== v) reject('malformed_timestamp'); return v; }
function times(v) { const createdAt=date(v.createdAt),updatedAt=date(v.updatedAt); if(updatedAt<createdAt) reject('malformed_timestamp'); return {createdAt,updatedAt}; }
function array(v, max, fn) { if (!Array.isArray(v) || v.length > max) reject('record_bound'); const ids = new Set(); return v.map(x => { const out = fn(x); if (ids.has(out.id)) reject('ambiguous_identity'); ids.add(out.id); return out; }); }
export function normalizeLead(v, agency) {
  object(v, ['agencyId','id','customerId','revision','createdAt','updatedAt','name','source','pipeline','stage','producerId','opportunities','tasks','notes','synthetic']);
  if (v.synthetic !== true || v.agencyId !== agency) reject('agency_scope');
  const out = {agencyId:externalId(v.agencyId),id:externalId(v.id),customerId:externalId(v.customerId),revision:externalId(v.revision),createdAt:date(v.createdAt),updatedAt:date(v.updatedAt),name:text(v.name)};
  if (out.updatedAt < out.createdAt) reject('malformed_timestamp');
  object(v.source,['id','label']); out.source = {id:externalId(v.source.id),label:text(v.source.label)};
  out.pipeline = externalId(v.pipeline); out.stage = externalId(v.stage); out.producerId = externalId(v.producerId);
  out.opportunities = array(v.opportunities,10,x => { object(x,['id','product','createdAt','updatedAt']); return {id:externalId(x.id),product:text(x.product,60),...times(x)}; });
  if (!out.opportunities.length) reject('missing_opportunity');
  out.tasks = array(v.tasks,10,x => { object(x,['id','title','state','dueAt','createdAt','updatedAt']); if (!['open','completed','cancelled'].includes(x.state)) reject('malformed_task'); return {id:externalId(x.id),title:text(x.title,240),state:x.state,dueAt:date(x.dueAt),...times(x)}; });
  out.notes = array(v.notes,10,x => { object(x,['id','body','authorId','createdAt','updatedAt']); return {id:externalId(x.id),body:text(x.body,240),authorId:externalId(x.authorId),...times(x)}; });
  out.tasks.sort((a,b)=>a.id.localeCompare(b.id)); out.notes.sort((a,b)=>a.id.localeCompare(b.id)); out.opportunities.sort((a,b)=>a.id.localeCompare(b.id));
  if (new TextEncoder().encode(JSON.stringify(out)).length > 6000) reject('record_bound');
  return out;
}
// Transport is branded in-process; no arbitrary HTTP callback, token, URL or write method.
const simulated = new WeakSet();
export function simulatedAgencyZoomTransport(pages, failures = []) {
  const copy = structuredClone(pages), errors = [...failures], requests=[];
  const read=async request=> {
    requests.push(structuredClone(request));
    const error = errors.shift(); if (error) throw Object.assign(new Error('simulated_transport'),error);
    return structuredClone(copy[request.page] ?? {agencyId:request.agencyId,records:[],hasMore:false});
  };
  const transport=Object.freeze({get requests(){return structuredClone(requests);},readLeads:read,readResources:read,readSms:read});
  simulated.add(transport); return transport;
}
export const synchronizeAgencyZoom=options=>synchronize(options,'lead');
export const synchronizeAgencyZoomEvidence=options=>synchronize(options,'resource');
export const synchronizeAgencyZoomSms=options=>synchronize(options,'sms');
async function synchronize({config = {}, principal, store, transport, sleep = ms=>new Promise(r=>setTimeout(r,ms)), pageLimit = 5}, type) {
  if (config.enabled !== true) reject('connector_disabled');
  if (config.mode !== 'offline_synthetic' || !/^future-agency:synthetic:[a-z0-9-]+$/.test(config.workspace || '') || !/^synthetic-[a-z0-9-]+$/.test(config.agencyId || '') || !/^az-test-[a-z0-9-]+$/.test(config.databaseId || '')) reject('isolation_required');
  if (!principal || principal.workspace !== config.workspace || principal.agencyId !== config.agencyId || principal.permission !== 'agencyzoom:synthetic:read') reject('authorization_required');
  if (!simulated.has(transport)) reject('simulated_transport_required');
  if (!Number.isInteger(pageLimit) || pageLimit < 1 || pageLimit > 10) reject('page_bound');
  store.verify(config); // actual database marker must match all configured identities
  const stream=type==='sms'?AZ_SMS_KIND:type==='resource'?AZ_RESOURCE_KIND:AZ_KIND;
  const touched=[];let currentRecord=null;
  const checkpoint = store.checkpoint(stream);
  const run = {page:0,since:checkpoint ? new Date(Date.parse(checkpoint)-300000).toISOString() : null};
  let watermark = checkpoint, processed = 0, changed = 0;
  try {
    for (; run.page < pageLimit; run.page++) {
      let page;currentRecord=null;
      for (let attempt=0; ; attempt++) {
        try { page = await transport[type==='sms'?'readSms':type==='resource'?'readResources':'readLeads']({agencyId:config.agencyId,...run,pageSize:100}); break; }
        catch (e) {
          if ([401,403].includes(e.status)) reject('authentication_failed');
          if (![429,503].includes(e.status) || attempt >= 2) reject(e.status===429 ? 'rate_limited' : 'transport_failed');
          await sleep(Math.min(1000, Math.max(0, Number(e.retryAfterMs)||100) * (attempt+1)));
        }
      }
      object(page,['agencyId','records','hasMore']);
      if (page.agencyId !== config.agencyId || typeof page.hasMore !== 'boolean' || !Array.isArray(page.records) || page.records.length > 100) reject('malformed_page');
      // Validate the entire page before accepting its first record.
      const records = page.records.map(v=>(type==='sms'?normalizeAgencyZoomSms:type==='resource'?normalizeAgencyZoomResource:normalizeLead)(v, config.agencyId));
      for (const lead of records) { currentRecord=lead;changed += type==='sms'?store.acceptSmsPage(lead):type==='resource'?store.acceptResource(lead):store.accept(lead);if(type==='sms')touched.push([lead.id,lead.revision]); processed++; if (!watermark || Date.parse(lead.updatedAt) > Date.parse(watermark)) watermark=new Date(lead.updatedAt).toISOString(); }
      if (!page.hasMore) { if(type==='sms')store.verifySmsPages(touched);store.complete(checkpoint,watermark,stream); return {status:'complete',processed,changed,checkpoint:watermark,outboundCommunications:0}; }
    }
    // Never advance on truncation. Restart from page zero with overlap and durable dedupe.
    reject('page_bound');
  } catch (e) {
    const allowed = new Set(['authentication_failed','rate_limited','transport_failed','malformed_page','unsupported_fields','agency_scope','malformed_field','malformed_id','malformed_timestamp','record_bound','ambiguous_identity','malformed_task','missing_opportunity','identity_conflict','reconciliation_required','revision_conflict','stale_revision','checkpoint_conflict','evidence_integrity','malformed_date','unsupported_resource','incomplete_resource','malformed_policy','invalid_term','malformed_date_kind','malformed_sms','sensitive_message','sms_setup_required','unmarked_edit','archive_bound','incomplete_history','page_bound']);
    const code = allowed.has(e.code) ? e.code : 'sync_failed'; store.audit(code);store.recordSyncFailure?.({stream,record:currentRecord,error:e,code}); reject(code);
  }
}
