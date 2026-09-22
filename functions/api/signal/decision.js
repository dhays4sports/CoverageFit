import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {allowedSignalOrigin,corsHeaders,handleSignalDecision} from '../../../server/signal-decision-core.mjs';

function attachCors(response,origin){
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(corsHeaders(origin)))headers.set(key,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export const onRequest=async context=>{
  // TEMPORARY preview-only CORS failure fixture; remove immediately after QA.
  if(new URL(context.request.url).hostname==='cf-signal-decision-1-0.coveragefit.pages.dev' && context.request.headers.get('Origin')==='https://signal-decision-bridge-1-0.408farmers-v2.pages.dev'){
    return new Response(JSON.stringify({ok:false,error:{code:'origin_not_allowed',message:'Preview failure exercise'}}),{status:403,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
  const origin=allowedSignalOrigin(context.request,context.env||{});
  if(context.request.method==='OPTIONS'||!origin){
    return handleSignalDecision(context.request,{env:context.env||{},now:context.now||new Date()});
  }
  const response=await withD1RateLimit(
    context,
    {route:'signal-decision',limit:90,windowSeconds:60,failClosed:true},
    ()=>handleSignalDecision(context.request,{env:context.env||{},now:context.now||new Date()})
  );
  return attachCors(response,origin);
};
