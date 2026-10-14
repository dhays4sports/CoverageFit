// Selected SMS drafts — local, unsaved, never sent. Escaped for untrusted text.
const esc=x=>String(x??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
export function selectableReview(items,selected=new Set()){
 return `<section aria-label="Selected SMS review" class="cc-review">
 <h3>Review several drafts <span class="cc-preview">No send</span></h3>
 <p class="cc-note">Select up to 10 linked SIGNAL drafts. Each is checked again before showing its current text. This does not approve, save or send anything.</p>
 <div class="cc-review-pick">${items.filter(r=>r.category==='DRAFT_REVIEW').map(r=>`<label class="cc-review-option">
 <input type="checkbox" data-cc-select="${esc(r.opportunity_id)}" ${selected.has(r.opportunity_id)?'checked':''}>
 <span><strong>${esc(r.name)}</strong><small>${esc(r.decision_2)} · ${esc(r.latest_inbound)}</small></span></label>`).join('')||'<p class="muted">No draft reviews in this linked SIGNAL snapshot.</p>'}</div>
 <div class="cc-actions"><button type="button" data-cc-review ${selected.size===0?'disabled':''}>Review selected (no send)</button>
 <button type="button" data-cc-clear>Clear</button><small data-cc-selected-count>${selected.size}/10 selected</small></div>
 <div id="cc-selected-preview" role="status" aria-live="polite"></div>
 </section>`;
}
export function selectedReviewHTML(report){
 if(!Array.isArray(report?.items))return '<p>Unable to inspect current drafts. No changes made.</p>';
 return `<div class="cc-reviewed">
 <p><b>Current per-prospect snapshot</b> · No send authority · Edits below remain in this browser until you leave or refresh.</p>
 ${report.items.map(item=>`<article class="cc-reviewed-item">
 <div class="cc-row-top"><strong>${esc(item.display_name||'Unavailable opportunity')}</strong>
 <small>${esc(item.reason||'UNKNOWN')}</small></div>
 ${item.can_review?`<label>Draft for local review — rev ${Number(item.current_revision)}
 <textarea data-cc-local-edit="${esc(item.opportunity_id)}" maxlength="1600" rows="3">${esc(item.draft_body)}</textarea></label>`:
 `<p>Not reviewable: ${esc(item.reason)}. Do not contact based on this snapshot.</p>`}
 <p class="cc-note">No approval, queue write or RingCentral delivery. Contact permission is not verified.</p>
 </article>`).join('')}
 </div>`;
}
