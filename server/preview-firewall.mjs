// Preview has a deliberately smaller API surface. Never enable provider adapters,
// imports, reporting exports or producer mutations against synthetic fixtures.
export const TEST_DATABASE_ID='f5ac694d-1028-4a30-9fbd-c264b2e5995e';
export const TEST_WORKSPACE='distribution-engine:synthetic-test';
const deny=(status,message)=>Response.json({ok:false,message},{status,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
export async function previewFirewall(context){
  const {request,env={}}=context,url=new URL(request.url);
  const preview=url.hostname.endsWith('.coveragefit.pages.dev') || (env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH!=='main');
  if(!preview)return context.next();
  if(!url.hostname.endsWith('.coveragefit.pages.dev'))return deny(403,'Preview host is not permitted.');
  const path=url.pathname.replace(/\/$/,'');
  const allowed=(request.method==='GET' && ['/begin','/api/distribution/presentation','/api/solo-desk/producer-work','/api/solo-desk/producer-detail','/api/solo-desk/activity','/api/solo-desk/sync-status'].includes(path)) ||
    (request.method==='POST' && ['/api/distribution/entry','/api/distribution/journey','/api/distribution/interact','/api/distribution/events'].includes(path));
  if(!allowed)return deny(403,'This operation is disabled in the synthetic preview.');
  // Fail closed if an operator accidentally restores a live provider credential
  // or binding. Do not log names, values, tokens or request contents.
  if(Object.keys(env).some(key=>/^(RINGCENTRAL_|OPENAI_|RESEND_|AGENCYZOOM_|GOOGLE_CALENDAR_|PRODUCER_ALERT_|COVERAGEFIT_LEAD_SYNC_|POLICY_FILES$)/.test(key)))return deny(503,'Preview provider isolation is not configured.');
  if(env.BUYER_STAGING_ISOLATED!=='1'||env.COVERAGEFIT_SOLO_WORKSPACE_ID!==TEST_WORKSPACE||!env.COVERAGEFIT_DB?.prepare)return deny(503,'Isolated preview is not configured.');
  try{
    const marker=await env.COVERAGEFIT_DB.prepare('SELECT database_id, traffic_class FROM distribution_preview_identity WHERE singleton = 1').first();
    if(marker?.database_id!==TEST_DATABASE_ID||marker?.traffic_class!=='TEST')return deny(503,'Isolated preview storage is not configured.');
  }catch{return deny(503,'Isolated preview storage is not configured.');}
  return context.next();
}
