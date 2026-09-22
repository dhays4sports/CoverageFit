import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {allowedSignalOrigin,corsHeaders,handleSignalDecision} from '../../../server/signal-decision-core.mjs';

function attachCors(response,origin){
  const headers=new Headers(response.headers);
  for(const [key,value] of Object.entries(corsHeaders(origin)))headers.set(key,value);
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

export const onRequest=async context=>{
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
