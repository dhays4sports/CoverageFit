// New preview variables are deliberately ignored by older branches. Production
// is unchanged unless the independently isolated staging gate is also present.
export function sharedWorkspaceEnvironment(env={}){
 const scoped=env.BUYER_STAGING_ISOLATED==='1'&&env.CF_SHARED_WORKSPACE_PREVIEW==='1'&&String(env.CF_SHARED_WORKSPACE_PREVIEW_ID||'').startsWith('preview:shared-workspace:');
 return scoped?{...env,CF_SHARED_PROFILE_ENABLED:'1',CF_SHARED_PROFILE_DESKTOP_TOKEN:env.CF_SHARED_WORKSPACE_DESKTOP_TOKEN,COVERAGEFIT_PRODUCER_ACCESS_TOKEN:env.CF_SHARED_WORKSPACE_PRODUCER_TOKEN,CF_SMS_SIGNAL_ENABLED:'0',CF_AI_ENABLED:'0',CF_CALENDAR_ACTIONS_ENABLED:'0'}:env;
}
