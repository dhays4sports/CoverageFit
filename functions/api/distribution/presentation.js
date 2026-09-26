import {entryInput,renderEntry} from '../../../server/entry-presentation.mjs';
import {distributionPresentation,distributionJourney} from '../../../server/distribution-journey.mjs';
import {createPVXRecordStore} from '../../../server/d1-json-store.mjs';
export async function onRequest(context){
  if(context.request.method!=='GET')return new Response(null,{status:405});
  try{
    const url=new URL(context.request.url),handoff=entryInput(url);let state=distributionPresentation(handoff);
    if(context.request.headers.get('cookie')&&context.env?.COVERAGEFIT_DB){
      const response=await distributionJourney(new Request(url,{method:'POST',headers:{Origin:url.origin,Cookie:context.request.headers.get('cookie'),'Content-Type':'application/json'},body:'{"action":"load"}'}),{db:context.env.COVERAGEFIT_DB,store:createPVXRecordStore(context.env.COVERAGEFIT_DB)});
      if(response.ok)state={...await response.json(),resumed:true};
    }
    return new Response(renderEntry(handoff,state),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; script-src 'self' https://coveragefit.com; style-src 'self' https://coveragefit.com; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
  }catch{return new Response('This review is unavailable. Please contact Dylan.',{status:422,headers:{'Cache-Control':'no-store'}});}
}
