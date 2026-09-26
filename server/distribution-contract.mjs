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
  if(Object.keys(input).some(k=>!['version','entry','bootstrapId','attribution','occurredAt','evidence','knownContext','contactChoice','referralContext'].includes(k))) fail();
  if(!/^pvxb_[A-Za-z0-9_-]{24,80}$/.test(input.bootstrapId||'')) fail();
  const route=DISTRIBUTION_ROUTES[input.entry];
  if(!route) fail();
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
  const sourceKey='web_408_'+input.entry.replaceAll('-','_');
  const sourceFamily=deriveSourceFamily({...normalized.attribution,sourceKey});
  return {version:DISTRIBUTION_VERSION,bootstrapId:input.bootstrapId,entry:input.entry,audience:route.audience,route:route.route,knownContext:context,
    occurredAt:at.toISOString(),receivedAt:now.toISOString(),contactChoice:choice,referralContext:referral,
    attribution:{...normalized.attribution,source:'408farmers',sourceFamily,sourceKey,landingPage:route.route},
    // Product is selected by an explicitly labelled CTA. Other facts require answers.
    evidence:{...normalized.canonicalSignals,product:normalized.canonicalSignals.product==='unknown'?route.product:normalized.canonicalSignals.product}};
}
