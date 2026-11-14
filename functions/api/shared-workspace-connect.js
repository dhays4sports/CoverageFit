import {sharedWorkspaceEnvironment} from '../../server/shared-workspace-config.mjs';
import {previewOwner} from '../../server/shared-workspace-access.mjs';
// Used only by Electron's main process after browser sign-in. Never navigated to.
export async function onRequest(context){const env=sharedWorkspaceEnvironment(context.env||{});
 const reply=(v,status)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
 if(context.request.method!=='GET'||env.BUYER_STAGING_ISOLATED!=='1'||env.CF_SHARED_WORKSPACE_PREVIEW!=='1'||!env.CF_SHARED_WORKSPACE_PREVIEW_ID?.startsWith('preview:shared-workspace:')||!env.CF_SHARED_PROFILE_DESKTOP_TOKEN)return reply({ok:false},404);
 if(!await previewOwner(context.request,env))return reply({ok:false,error:'Owner preview sign-in required.'},403);
 return reply({ok:true,origin:new URL(context.request.url).origin,workspace:env.CF_SHARED_WORKSPACE_PREVIEW_ID,desktopToken:env.CF_SHARED_PROFILE_DESKTOP_TOKEN},200);
}
