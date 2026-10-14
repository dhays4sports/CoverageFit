// Prospect 360 preview rail — purely read-only. Never displays unverified facts as verified.
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renew(x){
 if(!x)return 'No renewal timing recorded';
 const fact=x.facts?.renewal||{};
 if(fact.conflict)return 'Conflicting renewal dates — producer verification needed';
 const date=fact.value?.date||fact.value?.month||'Unknown';
 const basis=fact.verification==='customer_confirmed'?'Customer confirmed':
  fact.verification==='document_verified'?'Document verified':
  fact.verification==='producer_confirmed'?'Producer confirmed':
  fact.verification==='stale'?'Previous date passed — reverify':
  fact.value?'Imported/SMS evidence — not yet verified':'Unknown';
 return `${basis}: ${date}`;
}
export async function mountProspect360(root,api,id){
 if(!root||!id)return;
 root.hidden=true;
 try{
  const p=await api('prospect-360?id='+encodeURIComponent(id));
  if(root.dataset.opportunity!==id||p?.opportunity_id!==id)return;
  const r=p.facts?.renewal;
  const evidence=(r?.evidence||[]).slice(0,8).map(e=>`<li>
    ${escape(e.date||e.month)} · ${escape(e.source_kind)}
    <small> ${escape(e.verification.replaceAll('_',' '))}</small></li>`).join('');
  const pending=(p.commitments||[]).filter(x=>x.actionable).slice(0,6)
   .map(c=>`<li>${escape(c.title)} · ${escape(c.due_date||c.due_at||'Timing unknown')}</li>`).join('');
  root.hidden=false;
  root.innerHTML=`<section class="cc-prospect-preview" aria-label="Prospect 360 evidence preview">
   <div class="cc-top"><h3>Prospect 360 <span class="cc-preview">Evidence-only</span></h3></div>
   <p><strong>Renewal:</strong> ${escape(renew(p))}</p>
   <p><strong>Identity:</strong> ${p.identity?.status==='linked'
    ?'Previously linked in CoverageFit (no automatic merges)':'Not linked or profile data unavailable'}</p>
   <p><strong>SMS:</strong> Contact permission not evaluated. A renewal date is not authorization to send.</p>
   ${evidence?`<details><summary>Renewal evidence (${Number(r.evidence.length)})</summary><ul>${evidence}</ul></details>`:''}
   ${pending?`<details><summary>Recorded commitments</summary><ul>${pending}</ul></details>`:''}
   <p class="cc-note">Conflicts require producer review. Timing is separate from send eligibility.</p></section>`;
 }catch{if(root.dataset.opportunity===id)root.hidden=true;}
}
