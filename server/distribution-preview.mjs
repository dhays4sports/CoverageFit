// Configuration acknowledgement is not proof of isolation: inspect D1/provider
// bindings before setting it. Production behavior is unchanged.
export function distributionOrigin(request,env={}){
  const origin=new URL(request.url).origin;
  if(origin.endsWith('.pages.dev')&&origin!=='https://coveragefit.pages.dev'){
    if(!/^https:\/\/[a-z0-9-]+\.coveragefit\.pages\.dev$/.test(origin)||env.BUYER_STAGING_ISOLATED!=='1')throw Error('preview_not_isolated');
  }
  return origin;
}
export function contextualAssetOrigin(request,env={}){
  const origin=distributionOrigin(request,env);
  return origin.endsWith('.coveragefit.pages.dev')?origin:'https://coveragefit.com';
}

export function withDistributionIsolation(context,run){
  try{distributionOrigin(context.request,context.env);}catch{return Response.json({ok:false,message:'Isolated preview is not configured.'},{status:503,headers:{'Cache-Control':'no-store'}});}
  return run();
}
