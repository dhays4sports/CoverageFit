import {scopedRequest,otherReviewEntries} from '../../../server/distribution-sessions.mjs';
import {contextualAssetOrigin} from '../../../server/distribution-preview.mjs';
import {entryInput,renderEntry} from '../../../server/entry-presentation.mjs';
import {distributionPresentation,distributionJourney} from '../../../server/distribution-journey.mjs';
import {createPVXRecordStore} from '../../../server/d1-json-store.mjs';
export async function onRequest(context){
  if(context.request.method!=='GET')return new Response(null,{status:405});
  let assetOrigin;
  try{assetOrigin=contextualAssetOrigin(context.request,context.env);}catch{return new Response('Isolated preview is not configured.',{status:503,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});}
  try{
    const url=new URL(context.request.url),handoff=entryInput(url);let state=distributionPresentation(handoff);
    if(context.request.headers.get('cookie')&&context.env?.COVERAGEFIT_DB){
      const response=await distributionJourney(new Request(url,{method:'POST',headers:{Origin:url.origin,Cookie:scopedRequest(context.request,handoff.entry).headers.get('cookie')||'','Content-Type':'application/json'},body:'{"action":"load"}'}),{env:context.env,db:context.env.COVERAGEFIT_DB,store:createPVXRecordStore(context.env.COVERAGEFIT_DB)});
      if(response.ok){const saved=await response.json();
        if(saved.reviewAudience===handoff.entry)state={...saved,resumed:true};
        else state={...state,otherReviews:[saved.reviewAudience]};
      }
      state.otherReviews=[...new Set([...(state.otherReviews||[]),...otherReviewEntries(context.request,handoff.entry)])];
    }
    return new Response(renderEntry(handoff,state,assetOrigin),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':`default-src 'none'; script-src 'self' ${assetOrigin}; style-src 'self' ${assetOrigin}; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`}});
  }catch{return new Response('This review is unavailable. Please contact Dylan.',{status:422,headers:{'Cache-Control':'no-store'}});}
}
