// COMMAND-CENTER-TODAY-INBOX-0.1 — small read-only view in canonical Workspace.
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const label={NOW:'Now',TODAY:'Today',HIGH:'High intent',UPCOMING:'Upcoming',WAITING:'Waiting',NORMAL:'Review'};
function row(r,mode){
 const description=mode==='today'?r.why_now:
  r.category==='DELIVERY_REVIEW'?'Uncertain delivery: check RingCentral; do not retry blindly':
  r.category==='DRAFT_REVIEW'?'Draft awaiting individual producer review — sending authority not evaluated':
  'Current inbound decision requires producer attention';
 const action=mode==='today'?r.next_action_label:
  r.category==='NEEDS_PRODUCER_ATTENTION'?r.next_action_label:r.latest_inbound;
 return `<button class="cc-row" type="button" data-cc-id="${esc(r.opportunity_id)}" aria-label="Open ${esc(r.name)}">
  <span class="cc-row-top"><strong>${esc(r.name)}</strong><small>${esc(mode==='today'?(label[r.band]||r.band):r.category.replaceAll('_',' '))}</small></span>
  <span>${esc(r.products||'Product not recorded')} · ${esc(r.population)}</span>
  <span class="cc-why">${esc(description)}</span>
  ${action?`<span class="cc-action">${esc(action)}</span>`:''}
  ${r.timing_hint?`<span class="cc-note">Recorded deadline (not verified renewal): ${esc(r.timing_hint.raw)}</span>`:''}
 </button>`;
}
export function mountCommandCenter(root,api,open){
 if(!root)return {refresh:async()=>{}};
 let state=null,active='today',request=0;
 function render(){
  if(!state?.enabled){root.hidden=true;return;}
  root.hidden=false;
  const rows=active==='today'?state.today:state.inbox;
  root.innerHTML=`<div class="cc-top">
    <div><h2>Command Center <span class="cc-preview">Read-only preview</span></h2>
      <p class="muted">The right prospect, the current evidence, one next action.</p></div>
    <button type="button" data-cc-refresh>Refresh preview</button>
   </div>
   <div class="cc-stats" aria-label="Command Center counts">
    <div><strong>${Number(state.counts.today||0)}</strong><span>Priorities today</span></div>
    <div><strong>${Number(state.counts.needs_attention||0)}</strong><span>SMS attention</span></div>
    <div><strong>${Number(state.counts.draft_review||0)}</strong><span>Drafts to review</span></div>
    <div><strong>${Number(state.counts.delivery_review||0)}</strong><span>Delivery exceptions</span></div>
   </div>
   <div class="cc-tabs" role="group" aria-label="Command Center preview sections">
    <button type="button" data-cc-tab="today" aria-pressed="${active==='today'}">Today</button>
    <button type="button" data-cc-tab="inbox" aria-pressed="${active==='inbox'}">Inbox</button>
   </div>
   <div class="cc-list" aria-live="polite">${rows.length?rows.map(r=>row(r,active)).join(''):
      '<p class="muted">No matching governed actions in this preview.</p>'}</div>
   <p class="cc-note">Source: existing CoverageFit Work. Inbox shows linked SIGNAL decisions only;
   <b>live RingCentral inbound synchronization is not certified.</b>
   Drafts shown here cannot be sent from this panel. Consent and sender eligibility are not evaluated.</p>
   <p class="cc-note">${Number(state.coverage.scanned_work_records||0)} open Work records reviewed ·
   ${Number(state.coverage.test_excluded||0)} synthetic TEST records excluded.</p>`;
 }
 root.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.ccId){open(button.dataset.ccId);return;}
  if(button.dataset.ccTab){active=button.dataset.ccTab;render();return;}
  if(button.hasAttribute('data-cc-refresh'))refresh();
 });
 async function refresh(){
  const ticket=++request;
  try{
   const response=await api('producer-command-center');
   if(ticket!==request)return;
   if(response?.enabled===true){state=response;render();}
   else {state=null;root.hidden=true;}
  }catch{
   if(ticket!==request)return;
   // Default-off in all current live environments. Preserve normal Work UI.
   state=null;root.hidden=true;
  }
 }
 return {refresh};
}
