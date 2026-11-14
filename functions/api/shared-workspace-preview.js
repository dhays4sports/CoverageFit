import {sharedWorkspaceEnvironment} from '../../server/shared-workspace-config.mjs';
import {identity,soloRepository} from '../../server/solo-desk-repository.mjs';
import {sharedProfileService} from '../../server/shared-prospect-profile.mjs';
// Publicly readable synthetic presentation only. Never authenticates writes.
export async function onRequest(context){
 const env=sharedWorkspaceEnvironment(context.env||{}),url=new URL(context.request.url),scope=identity(env);
 const off=()=>Response.json({ok:false,error:{message:'Isolated example is unavailable.'}},{status:404,headers:{'Cache-Control':'no-store'}});
 if(context.request.method!=='GET'||env.BUYER_STAGING_ISOLATED!=='1'||env.CF_SHARED_WORKSPACE_PREVIEW!=='1'||env.CF_SHARED_PROFILE_ENABLED!=='1'||!scope.workspace.startsWith('preview:shared-workspace:')||!env.COVERAGEFIT_DB)return off();
 try{const service=sharedProfileService(soloRepository(env.COVERAGEFIT_DB,scope)),op=url.searchParams.get('opportunityId'),cid=url.searchParams.get('customerId'),rid=url.searchParams.get('requestId');
 let result;if(cid&&rid){if(!cid.startsWith('cust_cfsw_demo_'))return off();result={ok:true,record:await service.evidence(cid,rid)};}
 else if(op){if(!op.startsWith('cfsw_demo_'))return off();const repo=soloRepository(env.COVERAGEFIT_DB,scope);const link=await repo.sql('SELECT customer_id FROM cf_ucp_opportunity_links WHERE workspace_id=? AND opportunity_id=?',scope.workspace,op).first();if(!link?.customer_id.startsWith('cust_cfsw_demo_'))return off();result={ok:true,profile:{status:'ready',...await service.read(link.customer_id,{opportunityId:op})}};}
 else if(url.searchParams.has('view'))result={ok:true,...await service.queues(url.searchParams,{exampleOnly:true})};
 else{const repo=soloRepository(env.COVERAGEFIT_DB,scope);const profiles=await repo.rows("SELECT l.customer_id AS customerId,l.opportunity_id AS opportunityId,c.display_name AS name,o.products AS products FROM cf_ucp_opportunity_links l JOIN cf_ucp_customers c ON c.workspace_id=l.workspace_id AND c.id=l.customer_id JOIN cf_solo_opportunities o ON o.workspace_id=l.workspace_id AND o.id=l.opportunity_id WHERE l.workspace_id=? AND substr(l.opportunity_id,1,10)='cfsw_demo_' AND substr(l.customer_id,1,15)='cust_cfsw_demo_' ORDER BY CASE WHEN o.products='Home' THEN 0 ELSE 1 END,l.opportunity_id LIMIT 25",scope.workspace);result={ok:true,profiles,nextCursor:null};}
 return Response.json(result,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return off();}
}
