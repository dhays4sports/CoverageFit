import {normalizeSignalDecisionInput} from './signal-decision-core.mjs';
import {deriveSourceFamily} from './acquisition-measurement.mjs';

// Distribution metadata never becomes individual priority evidence.
export const DISTRIBUTION_VERSION = 'coveragefit-distribution-v1';
export const DISTRIBUTION_ROUTES = Object.freeze({
  buyer: {route:'/buyer/', audience:'homebuyer', product:'home'},
  condo: {route:'/condo/', audience:'condo', product:'home'},
  home: {route:'/home/', audience:'home', product:'home'},
  auto: {route:'/auto/', audience:'auto', product:'auto'},
  'auto-bundle': {route:'/auto-bundle/', audience:'home_auto', product:'home'},
  tech: {route:'/tech/', audience:'tech', product:'unknown'},
  healthcare: {route:'/healthcare/', audience:'healthcare', product:'unknown'},
  teachers: {route:'/teachers/', audience:'teachers', product:'unknown'},
  engineers: {route:'/engineers/', audience:'engineers', product:'unknown'}
});
const fail=()=>{throw new TypeError('Invalid distribution handoff');};
export function normalizeDistribution(input, now=new Date()) {
  if(!input || input.version!==DISTRIBUTION_VERSION) fail();
  if(Object.keys(input).some(k=>!['version','entry','bootstrapId','attribution','occurredAt','evidence','knownContext','contactChoice','referralContext','presentation','qr'].includes(k))) fail();
  if(!/^pvxb_[A-Za-z0-9_-]{24,80}$/.test(input.bootstrapId||'')) fail();
  const route=DISTRIBUTION_ROUTES[input.entry];
  if(!route) fail();
  const presentation=input.presentation||'408_contextual';
  if(!['408_contextual','paid_agency'].includes(presentation))fail();
  let qr=null;
  if(input.qr){
    if(presentation!=='408_contextual'||!['home','condo'].includes(input.entry)||Object.keys(input.qr).some(k=>!['market','campaign'].includes(k)))fail();
    if(!/^\d{5}$/.test(input.qr.market)||!['rate','review','fit'].includes(input.qr.campaign))fail();
    qr={market:input.qr.market,campaign:input.qr.campaign};
  }
  const at=new Date(input.occurredAt);
  if(!Number.isFinite(at.getTime()) || at>new Date(now.getTime()+60000) || now-at>7*86400000) fail();
  const evidence=input.evidence||{};
  // A campaign audience is not a declaration of profession, purchase or intent.
  if(Object.hasOwn(evidence,'professionalProgram')) fail();
  const normalized=normalizeSignalDecisionInput({signalSessionId:'distribution_contract',flowId:'distribution',
    canonicalSignals:evidence, attribution:input.attribution||{}});
  if(Object.keys(normalized.attribution).some(k=>['source','sourceFamily','sourceKey','landingPage'].includes(k))) fail();
  const choice=input.contactChoice||'';
  if(!['','call','text','callback'].includes(choice)) fail();
  const referral=input.referralContext||'';
  if(referral && !/^[A-Za-z][A-Za-z0-9_-]{0,59}$/.test(referral)) fail();
  const context=input.knownContext||{};
  if(!context || typeof context!=='object' || Array.isArray(context)) fail();
  const choices={housing:['owner','buyer','renter','landlord','unsure'],bundleInterest:['yes','no','unsure'],occupancy:['primary','secondary','rental','unsure']};
  for(const [key,value] of Object.entries(context))if(!choices[key]?.includes(value))fail();
  const operationalSourceKey=presentation==='paid_agency'?'web_coveragefit_home':input.entry==='auto-bundle'?'web_408_home_auto':'web_408_'+input.entry.replaceAll('-','_');
  const sourceKey=presentation==='paid_agency'&&['meta','facebook','instagram'].includes(normalized.attribution.utmSource)?'meta':operationalSourceKey;
  const sourceFamily=qr?'qr':deriveSourceFamily({...normalized.attribution,sourceKey});
  const landingPage=qr?`/${input.entry}/qr/${qr.market}/${qr.campaign}`:presentation==='paid_agency'?'/begin/':route.route;
  return {version:DISTRIBUTION_VERSION,bootstrapId:input.bootstrapId,entry:input.entry,presentation,operationalSourceKey,audience:route.audience,productContext:route.product,marketContext:qr?.market||'',route:landingPage,knownContext:context,
    occurredAt:at.toISOString(),receivedAt:now.toISOString(),contactChoice:choice,referralContext:referral,
    attribution:{...normalized.attribution,...(qr?{campaignId:normalized.attribution.campaignId||`${input.entry}_qr_${qr.market}_${qr.campaign}`,campaignVariant:normalized.attribution.campaignVariant||qr.campaign,utmMedium:'qr'}:{}),source:presentation==='paid_agency'?'coveragefit':'408farmers',sourceFamily,sourceKey,landingPage},
    // The deliberate route supplies product context. Need and intent still require answers.
    evidence:{...normalized.canonicalSignals,product:normalized.canonicalSignals.product==='unknown'?route.product:normalized.canonicalSignals.product}};
}
