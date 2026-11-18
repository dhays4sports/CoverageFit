import {AZ_SMS_KIND,SMS_LIMITS,smsHeader,smsDigest} from './agencyzoom-sms-contract.mjs';
// Read only from the independently marked offline archive. No provider stores or network.
export async function agencyZoomSmsEvidence(repo,{customerId,opportunityId=null,sources=[],reviewReferences=[],after=0,threadId=null}={}){
 const empty={status:'not_present',threads:[],reviewReferences:[],held:false,suppressionObserved:false,historyVerified:false,contactAuthorityGranted:false};
 const relevant=sources.filter(s=>s.kind===AZ_SMS_KIND),requested=relevant.length||reviewReferences.length;
 const hold=(reason)=>({...empty,status:reason,held:true});
 if(!/^future-agency:synthetic:[a-z0-9-]+$/.test(repo.scope.workspace))return requested?hold('isolation_hold'):empty;
 if(!Number.isInteger(after)||after<0||after>SMS_LIMITS.threadMessages)return hold('window_bound');
 let configured=false;
 try{
  configured=!!await repo.sql("SELECT name FROM sqlite_master WHERE type='table' AND name='az_sms_archive_meta'").first();if(!configured)return requested?hold('sms_setup_hold'):empty;if((await repo.sql('SELECT schema_version FROM az_sms_archive_meta WHERE singleton=1').first())?.schema_version!=='v3')return hold('sms_setup_hold');
  const marker=await repo.sql('SELECT * FROM az_synthetic_scope WHERE singleton=1').first();
  if(!marker||marker.workspace!==repo.scope.workspace||!/^synthetic-/.test(marker.agency)||!/^az-test-/.test(marker.database_id))return hold('isolation_hold');
  if((await repo.sql('SELECT status FROM cf_ucp_customers WHERE workspace_id=? AND id=?',repo.scope.workspace,customerId).first())?.status!=='active')return hold('identity_hold');
  const ids=[...new Set(relevant.map(s=>s.summary?.threadId).filter(Boolean))];
  const candidates=await repo.rows(`SELECT * FROM az_sms_threads WHERE customer_id=? ${ids.length?'OR thread_id IN ('+ids.map(()=>'?').join(',')+')':''} ORDER BY thread_id LIMIT 9`,customerId,...ids);
  if(threadId&&!candidates.some(t=>t.thread_id===threadId))return hold('window_thread_unavailable');
  if(candidates.length>8||reviewReferences.length>100)return hold('archive_window_bound');
  const result={...empty,status:candidates.length?'ready':'not_present'};
  for(const row of candidates){
   const start=threadId&&threadId!==row.thread_id?0:after;
   let thread;
   try{
    const header=JSON.parse(row.header_json);if(header.agencyId!==marker.agency||await smsDigest(header)!==row.digest)throw Error('integrity');
    const source=await repo.sql('SELECT summary_json FROM cf_solo_sources WHERE workspace_id=? AND kind=? AND source_id=?',repo.scope.workspace,AZ_SMS_KIND,(await repo.sql("SELECT canonical_id FROM az_external_ids WHERE entity='sms_thread' AND external_id=?",row.thread_id).first())?.canonical_id||'').first();
    const summary=JSON.parse(source?.summary_json||'null');
    if(!summary||summary.threadRevision!==row.revision||summary.threadDigest!==row.digest||summary.agencyId!==marker.agency||summary.databaseId!==marker.database_id||summary.canonicalCustomerId!==row.customer_id)throw Error('integrity');
    const link=await repo.sql('SELECT customer_id,household_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=?',repo.scope.workspace,row.anchor_id).first();
    if(row.customer_id!==customerId||link?.customer_id!==customerId){result.held=true;result.threads.push({id:row.thread_id,status:'identity_hold',messages:[],suppressionObserved:!!summary.suppressionObserved});continue;}
    const pages=await repo.rows('SELECT * FROM az_sms_pages WHERE thread_id=? AND revision=? ORDER BY page_index',row.thread_id,row.revision),cache=new Map();
    async function original(mid,revision){const key=JSON.stringify([mid,revision]);if(cache.has(key))return cache.get(key);const record=await repo.sql('SELECT * FROM az_sms_messages WHERE message_id=? AND revision=?',mid,revision).first();if(!record||record.thread_id!==row.thread_id||await smsDigest(JSON.parse(record.payload_json))!==record.digest)throw Error('integrity');cache.set(key,record);return record;}
    const currentRefs=new Set();
    for(const page of pages){const meta=JSON.parse(page.header_json),refs=JSON.parse(page.manifest_json),messages=[];if(await smsDigest(smsHeader(meta))!==row.digest)throw Error('integrity');for(const ref of refs){const m=await original(ref.id,ref.revision);if(m.digest!==ref.digest)throw Error('integrity');messages.push(JSON.parse(m.payload_json));currentRefs.add(JSON.stringify([ref.id,ref.revision]));}if(await smsDigest({...meta,messages})!==page.digest)throw Error('integrity');}
    const requestedPagesComplete=pages.length===header.pageCount&&pages.every((p,i)=>p.page_index===i);
    if(requestedPagesComplete!==summary.requestedPagesComplete)throw Error('integrity');
    const heads=await repo.rows('SELECT message_id,revision,digest FROM az_sms_heads WHERE thread_id=? ORDER BY message_id LIMIT 201',row.thread_id);
    if(heads.length>SMS_LIMITS.threadMessages||heads.length!==summary.messageCount||await smsDigest(heads)!==summary.indexDigest)throw Error('integrity');
    const messages=[];
    for(const head of heads){const stored=await original(head.message_id,head.revision);if(stored.digest!==head.digest)throw Error('integrity');const m=JSON.parse(stored.payload_json);messages.push({...m,digest:stored.digest,seenInCurrentRevision:currentRefs.has(JSON.stringify([m.id,m.revision])),originalContentObserved:m.body!==null||!!await repo.sql("SELECT 1 FROM az_sms_messages WHERE message_id=? AND json_extract(payload_json,'$.body') IS NOT NULL LIMIT 1",m.id).first()});}
    const observations=await repo.rows('SELECT kind,entity_id,revision,digest FROM az_sms_observations WHERE thread_id=?',row.thread_id);
    for(const o of observations){if(o.kind==='reported_opt_out'||o.kind==='thread_ownership_review'){const p=await repo.sql('SELECT header_json FROM az_sms_pages WHERE thread_id=? AND revision=? LIMIT 1',row.thread_id,o.revision).first();if(!p||await smsDigest(smsHeader(JSON.parse(p.header_json)))!==o.digest)throw Error('integrity');}else if((await original(o.entity_id,o.revision)).digest!==o.digest)throw Error('integrity');}
    const suppressionObserved=summary.suppressionObserved||observations.some(o=>['reported_opt_out','inbound_opt_out'].includes(o.kind)),ownershipHeld=summary.reviewHold||header.relationship!=='attributed'||!!header.otherProviderReference||observations.some(o=>!['reported_opt_out','inbound_opt_out'].includes(o.kind));
    result.suppressionObserved ||= !!suppressionObserved;result.held ||= !!suppressionObserved||!!ownershipHeld;
    const scoped=opportunityId!==null&&row.opportunity_id!==null&&row.opportunity_id!==opportunityId;
    messages.sort((a,b)=>{const aa=a.occurredAt?Date.parse(a.occurredAt):Infinity,bb=b.occurredAt?Date.parse(b.occurredAt):Infinity;return (aa===bb?0:aa-bb)||a.id.localeCompare(b.id);});
    const times=new Map();for(const m of messages)if(m.occurredAt){const time=Date.parse(m.occurredAt);times.set(time,(times.get(time)||0)+1);}
    const window=scoped?[]:messages.slice(start,start+SMS_LIMITS.window).map(m=>({...m,orderAmbiguous:!m.occurredAt||times.get(Date.parse(m.occurredAt))>1,chronology:m.occurredAt?'source_timestamp':'unknown',importedBy:'agencyzoom-offline-importer',reviewEligible:!!row.opportunity_id&&!ownershipHeld&&m.direction==='inbound'&&m.authorRole==='prospect'&&m.change!=='deleted'&&m.seenInCurrentRevision}));
    thread={id:row.thread_id,status:'ready',revision:row.revision,digest:row.digest,scope:row.opportunity_id?'opportunity':'customer',opportunityId:row.opportunity_id,sourceUpdatedAt:header.updatedAt,synchronizedAt:summary.synchronizedAt,relationship:header.relationship,otherProviderReference:header.otherProviderReference,suppressionObserved:!!suppressionObserved,suppressionEvidence:observations,ownershipHeld:!!ownershipHeld,requestedPagesComplete,historyCompleteReported:header.historyCompleteReported,historyVerified:false,allCurrentMessagesIntegrityVerified:true,total:heads.length,after:start,inspected:window.length,nextAfter:!scoped&&start+SMS_LIMITS.window<heads.length?start+SMS_LIMITS.window:null,scopedOut:scoped,messages:window,contactAuthorityGranted:false};
    const by=new Map(messages.map(m=>[m.id,m]));
    for(const ref of reviewReferences.filter(r=>r.threadId===row.thread_id)){
     let available=false,originalMessage=null;try{const originalRow=await original(ref.messageId,ref.revision);available=originalRow.digest===ref.digest;originalMessage=available?JSON.parse(originalRow.payload_json):null;}catch{result.held=true;}
     const current=by.get(ref.messageId),currentBinding=available&&!scoped&&row.opportunity_id===opportunityId&&!ownershipHeld&&current?.revision===ref.revision&&current?.digest===ref.digest&&current?.direction==='inbound'&&current?.authorRole==='prospect'&&current?.change!=='deleted'&&currentRefs.has(JSON.stringify([ref.messageId,ref.revision]))&&row.revision===ref.threadRevision&&row.digest===ref.threadDigest;
     result.reviewReferences.push({...ref,available,current:!!currentBinding,status:currentBinding?'verified_revision_current':available?'superseded_deleted_or_held':'integrity_unavailable',original:originalMessage});
    }
   }catch{result.held=true;thread={id:row.thread_id,status:'integrity_or_setup_hold',messages:[],suppressionObserved:true};}
   result.threads.push(thread);
  }
  // Any unavailable reviewed source is stale, never implicitly verified.
  for(const ref of reviewReferences)if(!result.reviewReferences.some(r=>r.itemId===ref.itemId))result.reviewReferences.push({...ref,current:false,available:false,status:'source_unavailable'});
  return result;
 }catch{return requested||configured?hold('integrity_or_setup_hold'):empty;}
}
