import {randomBase64Url} from './runtime-crypto.mjs';
import {distributionPresentation} from './distribution-journey.mjs';
import {DISTRIBUTION_VERSION,DISTRIBUTION_ROUTES} from './distribution-contract.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headlines={home:'Home insurance review with Dylan',buyer:'A focused review for your home purchase',condo:'Condo insurance review with Dylan',auto:'Auto insurance review with Dylan','auto-bundle':'Review your home and auto together',tech:'A focused insurance review with Dylan',teachers:'A focused insurance review with Dylan',healthcare:'A focused insurance review with Dylan',engineers:'A focused insurance review with Dylan'};
export function entryInput(url,now=new Date()){
  const q=url.searchParams,entry=q.get('entry')||'home';if(!DISTRIBUTION_ROUTES[entry])throw Error('entry');
  const attribution={};
  for(const [key,field]of Object.entries({campaign_id:'campaignId',campaign_variant:'campaignVariant',partner_id:'partnerId',utm_source:'utmSource',utm_medium:'utmMedium',utm_campaign:'utmCampaign',utm_content:'utmContent',utm_term:'utmTerm',creative:'creative'})){
    const value=q.get(key);if(value&&/^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,119}$/.test(value)&&!/[0-9]{7,}/.test(value))attribution[field]=value;
  }
  // Preserve the requested variant; only supply a descriptive default.
  attribution.campaignVariant||='immediate_question_v1';
  return {version:DISTRIBUTION_VERSION,entry,presentation:q.get('presentation')||'408_contextual',bootstrapId:'pvxb_'+randomBase64Url(32),occurredAt:now.toISOString(),attribution,evidence:{},
    ...(q.has('market')?{qr:{market:q.get('market'),campaign:q.get('qr_campaign')}}:{})};
}
export function renderEntry(handoff,state=distributionPresentation(handoff)){
  const contextual=handoff.presentation==='408_contextual',base=contextual?'https://coveragefit.com':'',brand=contextual?'408FARMERS':'CoverageFit';
  const api=contextual?'/api/entry':'/api/distribution';
  const compatibility=handoff.entry==='home'?'/home/legacy.html':'/'+handoff.entry+'/';
  const question=state.question;
  const qhtml=question?`<fieldset><legend tabindex="-1">${esc(question.prompt)}</legend>${question.options.map(o=>`<button type="button" data-answer="${esc(o.code)}">${esc(o.label)}</button>`).join('')}</fieldset>`:`<h2 tabindex="-1">${esc(state.message||'Your answers are saved')}</h2>`;
  const data=JSON.stringify({handoff,state,api}).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="description" content="A focused insurance review with Dylan Haysbert. Share only what matters, without repeating yourself."><title>${esc(headlines[handoff.entry])} — ${brand}</title><link rel="canonical" href="${contextual?'https://408farmers.com/'+handoff.entry+'/':'https://coveragefit.com/begin/'}"><link rel="stylesheet" href="${base}/assets/css/distribution-check-in.css?v=ENTRY-1.0"><script defer src="${base}/assets/js/entry-client.js?v=ENTRY-1.0"></script></head><body><main><a href="/">${brand}</a><h1>${esc(headlines[handoff.entry])}</h1><p>Share what matters so Dylan can make your next conversation more useful. We skip what you’ve already shared.</p><p class="identity"><strong>Dylan Haysbert · Insurance Producer</strong><br>Virginia Tam Insurance Agency, Inc.<br>CA Insurance License #4528400</p><section id="entry-review" aria-label="Your insurance review">${qhtml}</section><p id="entry-status" role="status" aria-live="polite"></p><noscript><p>To answer here, please enable JavaScript, or contact Dylan directly.</p></noscript><p>About 1–2 minutes. No obligation. No quote or policy change happens automatically.</p><p>${contextual?'CoverageFit organizes your answers for Dylan. ':''}<a href="${contextual?'/contact/':'/support/'}">Contact Dylan</a> · <a href="${contextual?'/privacy.html':'/privacy/'}">Privacy</a>${contextual?' · <a href="'+compatibility+'">Existing review or appointment</a>':' · <a href="/terms/">Terms</a>'}</p></main><script type="application/json" id="entry-data">${data}</script></body></html>`;
}
