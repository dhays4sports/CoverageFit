// Local synthetic-only acceptance fixture. Never deploy or expose publicly.
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
import http from 'node:http';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {resolve,extname} from 'node:path';
import {onRequest as presentation} from '../../functions/api/distribution/presentation.js';
import {entryInput,renderEntry} from '../../server/entry-presentation.mjs';
import {distributionPresentation,distributionInteract,distributionEvent,distributionEntry,distributionJourney} from '../../server/distribution-journey.mjs';
import {createPVXRecordStore} from '../../server/d1-json-store.mjs';
import {entryPage,entryAction} from '../../../408finneas/server/entry-presentation-proxy.mjs';
const sql=new DatabaseSync(process.env.RESTAURANT_QA_DB||':memory:');
for(const f of readdirSync('../../migrations').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('../../migrations/'+f,'utf8'));
const db={prepare(q){let args=[];const s={bind(...v){args=v;return s},async first(){return sql.prepare(q).get(...args)||null},async all(){return {results:sql.prepare(q).all(...args)}},async run(){return {meta:sql.prepare(q).run(...args)}}};return s},async batch(stmts){sql.exec('BEGIN');try{let out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out}catch(e){sql.exec('ROLLBACK');throw e}}};
const options={db,store:createPVXRecordStore(db),env:{}};
const upstream=async(url,init)=>{
 const request=new Request(url,init),u=new URL(url);
 if(u.pathname.endsWith('/presentation'))return presentation({request,env:{COVERAGEFIT_DB:db}});
 return u.pathname.endsWith('/events')?distributionEvent(request,options):distributionInteract(request,options);
};
const mime={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.html':'text/html'};
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://terminal.local:4173');let response;
 if(u.pathname==='/qa-fresh'){response=new Response(null,{status:303,headers:{Location:'/?route=condo&width='+(u.searchParams.get('width')||390),'Set-Cookie':'cf_distribution_resume=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'}});}
 else if(u.pathname==='/qa-completed'){
  const route=['restaurant','buyer','tech','healthcare','engineers','teachers','home','condo'].includes(u.searchParams.get('route'))?u.searchParams.get('route'):'buyer';
  const handoff=entryInput(new URL('https://coveragefit.com/?entry='+route+'&utm_campaign=original_completed_campaign'));
  const start=await distributionEntry(new Request('https://coveragefit.com/api/distribution/entry',{method:'POST',headers:{Origin:'https://coveragefit.com','Content-Type':'application/json'},body:JSON.stringify(handoff)}),{...options,immediate:true});
  const cookie=start.headers.get('set-cookie');
  const done=await distributionJourney(new Request('https://coveragefit.com/api/distribution/journey',{method:'POST',headers:{Origin:'https://coveragefit.com','Content-Type':'application/json',Cookie:cookie.split(';')[0]},body:JSON.stringify({action:'contact',revision:0,name:'Synthetic New Review QA',phone:'2025550123',mode:'call',permission:true})}),{...options,...(u.searchParams.has('pending')?{project:async()=>({ok:false})}:{})});
  if(![200,503].includes(done.status))throw Error('fixture');
  response=new Response(null,{status:303,headers:{Location:'/?route='+route+'&width='+(u.searchParams.get('width')||390),'Set-Cookie':cookie.replace('; Secure','')}});
 }
 else if(u.pathname==='/'){const route=['restaurant','buyer','tech','healthcare','engineers','teachers','home','condo'].includes(u.searchParams.get('route'))?u.searchParams.get('route'):'tech';const width=Number(u.searchParams.get('width'))||390;const before=u.searchParams.has('before');response=new Response(`<html><head><meta charset="utf-8"><title>Isolated condo acceptance</title></head><body style="margin:0;background:#e6e8eb;font-family:system-ui"><div style="padding:10px;font-size:12px">${before?'BEFORE — source baseline':'AFTER — unpublished candidate'} · ${route} · ${width}px · isolated synthetic data</div><iframe title="Intake preview" src="/${before?'before/':''}${route}/?utm_source=instagram&utm_medium=paid_social&utm_campaign=professional_qa" style="display:block;border:0;width:${width}px;height:1250px;margin:0 auto"></iframe></body></html>`,{headers:{'Content-Type':'text/html'}})}
 else if(/^\/(before\/)?(restaurant|buyer|tech|healthcare|engineers|teachers|home|condo)\/$/.test(u.pathname)){
  const parts=u.pathname.split('/').filter(Boolean),route=parts.at(-1),before=parts[0]==='before';
  if(before&&route==='condo')response=new Response(readFileSync('./baseline-condo.html','utf8'),{headers:{'Content-Type':'text/html'}});
  else if(before&&route==='buyer')response=new Response(readFileSync('./baseline-buyer.html','utf8').replace(/<script\b[\s\S]*?<\/script>/g,''),{headers:{'Content-Type':'text/html'}});
  else if(before&&route==='engineers')response=new Response(readFileSync('../../../408finneas/engineers/index.html','utf8').replaceAll('../shared/','/shared/').replace(/<script\b[\s\S]*?<\/script>/g,''),{headers:{'Content-Type':'text/html'}});
  else if(before){const handoff=entryInput(new URL('https://coveragefit.com/?entry='+route));response=new Response(renderEntry(handoff),{headers:{'Content-Type':'text/html'}})}
  else response=await entryPage(new Request('https://408farmers.com/'+route+'/'+u.search,{headers:{Cookie:req.headers.cookie||''}}),{entry:route},{fetch:upstream});
  let html=await response.text();html=html.replaceAll('https://coveragefit.com/assets/','/cf-assets/');const headers=new Headers(response.headers);headers.delete('Content-Security-Policy');response=new Response(html,{status:response.status,headers});
 } else if(u.pathname.startsWith('/api/entry/')){
  let body='';for await(const c of req)body+=c;
  response=await entryAction(new Request('https://408farmers.com'+u.pathname,{method:req.method,headers:{Origin:'https://408farmers.com','Content-Type':'application/json',Cookie:req.headers.cookie||''},body}),{fetch:upstream});
  // HTTP-only local QA: retain all other cookie attributes. Never deployed.
  const headers=new Headers(response.headers);if(headers.has('set-cookie'))headers.set('set-cookie',headers.get('set-cookie').replace('; Secure',''));response=new Response(response.body,{status:response.status,headers});
 }else if(u.pathname==='/qa-receipt'){
  const rows=sql.prepare("SELECT summary_json FROM cf_solo_sources WHERE kind='lead'").all().map(r=>JSON.parse(r.summary_json));response=Response.json({opportunities:sql.prepare('SELECT count(*) n FROM cf_solo_opportunities').get().n,journeys:sql.prepare("SELECT count(*) n FROM pvx_records WHERE record_key LIKE 'pvx/web-journey/%'").get().n,sources:rows});
 }else{
 const path=u.pathname.startsWith('/cf-assets/')?resolve('../../assets',u.pathname.slice(11)):resolve('../../../408finneas','.'+u.pathname);
 if(!path.startsWith(resolve('../../assets'))&&!path.startsWith(resolve('../../../408finneas')))throw Error('path');
 response=existsSync(path)?new Response(readFileSync(path),{headers:{'Content-Type':mime[extname(path)]||'application/octet-stream'}}):new Response('Not found',{status:404});
 }
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e);res.writeHead(500);res.end('QA error')}}).listen(4173,'0.0.0.0',()=>console.log('Isolated QA ready on 4173'));
