import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {identity,soloRepository} from '../../../server/solo-desk-repository.mjs';
import {signalContinue} from '../../../server/signal-continue-service.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
export const onRequest=context=>withD1RateLimit(context,{route:'signal-continue',limit:40,windowSeconds:60,failClosed:true},async()=>{
 try{
  const r=context.request;
  if(context.env.SIGNAL_CONTINUE_ENABLED!=='1')return json({error:{message:'This check-in is not available.'}},404);
  if(r.method!=='POST'||r.headers.get('origin')!==new URL(r.url).origin||!r.headers.get('content-type')?.includes('application/json'))return json({error:{message:'Open your secure check-in link.'}},403);
  const reader=r.body?.getReader();let bytes=0,chunks=[];if(reader)while(true){const x=await reader.read();if(x.done)break;bytes+=x.value.byteLength;if(bytes>4096){await reader.cancel();return json({error:{message:'The answer is too large.'}},413);}chunks.push(x.value);}
  const data=new Uint8Array(bytes);let offset=0;for(const x of chunks){data.set(x,offset);offset+=x.length;}const b=JSON.parse(new TextDecoder().decode(data));
  if(!b||Object.keys(b).some(k=>!['token','action','revision','question_id','code','future_date'].includes(k)))return json({error:{message:'Unsupported answer.'}},422);
  const svc=signalContinue(soloRepository(context.env.COVERAGEFIT_DB,identity(context.env)),context.env);
  return json({ok:true,...await (b.action==='resume'?svc.resume(b.token):svc.answer(b.token,b))});
 }catch(e){return json({error:{message:e.status?e.message:'Your answer could not be saved. Please retry.'}},e.status||503);}
});
