// Presentation only: the server firewall remains the authority for access.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const isSyntheticPreview=hostname=>String(hostname).endsWith('.coveragefit.pages.dev');
export const PREVIEW_RECORD_NOTICE='Full record and source synchronization are unavailable in this synthetic Preview. Review the saved source evidence here; production retains the legacy workflow.';
export function retrievalError(status,body={}){
 if(status===403&&body.message==='This operation is disabled in the synthetic preview.')return {code:'preview_operation_disabled',message:PREVIEW_RECORD_NOTICE};
 return {code:body.error?.code||'request_failed',message:body.error?.message||body.message||'The request failed.'};
}
export function fullRecordAction(id,preview){
 return preview?`<p role="note">${PREVIEW_RECORD_NOTICE}</p>`:`<p><a href="/agent/workspace/legacy.html?opportunity_id=${encodeURIComponent(id)}&quick_wrap=1">Full record, documents &amp; advanced work update</a></p>`;
}
const rows=items=>`<dl>${items.filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(typeof v==='boolean'?(v?'Yes':'No'):v)}</dd>`).join('')}</dl>`;
const attribution=a=>rows([['Source',a?.sourceKey],['Route',a?.landingPage],['Campaign ID',a?.campaignId],['UTM campaign',a?.utmCampaign],['UTM source',a?.utmSource],['UTM medium',a?.utmMedium],['Variant',a?.campaignVariant],['Partner',a?.partnerId],['Placement',a?.placementId],['Occurred at',a?.occurredAt]]);
export function savedSourceEvidence(detail){
 const sources=(detail.sources||[]).filter(s=>s.kind==='lead'&&s.summary?.context?.distribution);
 if(!sources.length)return '';
 return '<section aria-label="Saved source evidence"><h3>Saved source evidence</h3>'+sources.map(s=>{
  const v=s.summary,d=v.context.distribution,r=d.restaurant,p=v.permission;
  return rows([['Original request ID',s.source_id],['Journey ID',d.journeyId],['Contact requested',v.contactRequested],['Permission basis',p?.basis],['Personal call permitted',p?.callPermitted],['Personal text permitted',p?.personalTextPermitted],['Review context',v.context.reviewContext],['Traffic class',d.trafficClass]])+
   (r?'<h4>Restaurant inquiry</h4>'+rows([['Restaurant',r.name],['City',r.city],['State',r.state],['Reason',r.reason],['Alcohol share',r.alcoholShare],['Initial eligibility screen',r.eligibility],['Detailed underwriting gate',r.detailedUnderwritingAllowed]])+'<p>Initial screen only; final carrier eligibility is not established.</p>':'')+
   '<h4>First touch</h4>'+attribution(d.firstTouch||v.attribution)+
   '<h4>Subsequent touches</h4>'+((d.additionalTouches||[]).map(a=>attribution(a)).join('')||'<p>No subsequent touches in this saved source.</p>')+
   '<p>These are saved source facts. Contact permission is limited to the requested review and channel; it does not authorize automated marketing texts.</p>';
 }).join('')+'</section>';
}
