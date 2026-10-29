// Audience-specific browser capabilities. The legacy capability stays intact so
// pre-upgrade progress remains recoverable. Tokens are HttpOnly, never in URLs.
import {DISTRIBUTION_ROUTES} from './distribution-contract.mjs';
const PREFIX='cf_distribution_resume';
export function sessionCookies(request){
  return (request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(s=>/^cf_distribution_resume(?:_[a-z_-]+)?=pvxw_[A-Za-z0-9_-]{43}$/.test(s));
}
export function scopedRequest(request,entry,{legacy=true}={}){
  if(!Object.hasOwn(DISTRIBUTION_ROUTES,entry))throw Error('invalid_entry');
  const cookies=sessionCookies(request),name=PREFIX+'_'+entry;
  const selected=cookies.find(s=>s.startsWith(name+'='))||(legacy?cookies.find(s=>s.startsWith(PREFIX+'=')):null);
  const headers=new Headers(request.headers);headers.delete('cookie');
  if(selected)headers.set('cookie',PREFIX+'='+selected.split('=')[1]);
  return new Request(request.url,{headers});
}
export function scopedResponse(response,entry){
  const headers=new Headers(response.headers),cookie=headers.get('set-cookie');
  if(cookie?.startsWith(PREFIX+'='))headers.set('set-cookie',cookie.replace(PREFIX+'=',PREFIX+'_'+entry+'='));
  return new Response(response.body,{status:response.status,headers});
}
export function otherReviewEntries(request,entry){
  return Object.keys(DISTRIBUTION_ROUTES).filter(e=>e!==entry&&sessionCookies(request).some(s=>s.startsWith(PREFIX+'_'+e+'=')));
}
