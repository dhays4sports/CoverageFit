import {sharedWorkspaceEnvironment} from '../../server/shared-workspace-config.mjs';
import {previewOwner} from '../../server/shared-workspace-access.mjs';
// Used only by Electron's main process after browser sign-in. Never navigated to.
export async function onRequest(context){const env=sharedWorkspaceEnvironment(context.env||{});
 const reply=(v,status)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 if(!['GET','POST'].includes(context.request.method)||env.BUYER_STAGING_ISOLATED!=='1'||env.CF_SHARED_WORKSPACE_PREVIEW!=='1'||!env.CF_SHARED_WORKSPACE_PREVIEW_ID?.startsWith('preview:shared-workspace:')||!env.CF_SHARED_PROFILE_DESKTOP_TOKEN)return reply({ok:false},404);
 if(context.request.method==='POST'&&context.request.headers.get('origin')!==new URL(context.request.url).origin)return reply({ok:false},403);
 if(!await previewOwner(context.request,env))return reply({ok:false,error:'Owner preview sign-in required.'},403);
 if(context.request.method==='POST'){const disconnect=new URL(context.request.url).searchParams.has('disconnect');return Response.json({ok:true,workspace:env.CF_SHARED_WORKSPACE_PREVIEW_ID},{headers:{'Cache-Control':'private, no-store','Set-Cookie':'__Host-cf-shared-preview='+(disconnect?'':env.COVERAGEFIT_PRODUCER_ACCESS_TOKEN)+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+(disconnect?'0':'3600')}});}
 return reply({ok:true,origin:new URL(context.request.url).origin,workspace:env.CF_SHARED_WORKSPACE_PREVIEW_ID,desktopToken:env.CF_SHARED_PROFILE_DESKTOP_TOKEN},200);
}
