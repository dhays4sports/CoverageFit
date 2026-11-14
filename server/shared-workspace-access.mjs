// Owner-only preview pairing. Verify Access cryptographically; never trust a header alone.
const bytes=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));
const decode=s=>JSON.parse(new TextDecoder().decode(bytes(s)));
export async function previewOwner(request,env,fetcher=fetch,diagnostic=()=>{}){
 const deny=reason=>{diagnostic(reason);return false;};let stage='configuration';
 try{const issuer=env.CF_SHARED_WORKSPACE_ACCESS_ISSUER,aud=env.CF_SHARED_WORKSPACE_ACCESS_AUD,owner=env.CF_SHARED_WORKSPACE_OWNER_EMAIL;
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer||'')||!aud||!owner)return deny('invalid');
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||'';if(token.length>16000)return deny('invalid');const parts=token.split('.');if(parts.length!==3)return deny('invalid');
 stage='token_decode';const head=decode(parts[0]),claims=decode(parts[1]),now=Date.now()/1000;
 if(head.alg!=='RS256'||typeof head.kid!=='string'||claims.iss!==issuer||!Array.isArray(claims.aud)||!claims.aud.includes(aud)||!Number.isFinite(claims.exp)||claims.exp<=now||claims.nbf&&claims.nbf>now||claims.type!=='app'||claims.email?.toLowerCase()!==owner.toLowerCase())return deny(head.alg!=='RS256'?'algorithm':claims.iss!==issuer?'issuer':!Array.isArray(claims.aud)||!claims.aud.includes(aud)?'audience':!Number.isFinite(claims.exp)||claims.exp<=now?'expired':claims.nbf&&claims.nbf>now?'not_before':claims.type!=='app'?'type':claims.email?.toLowerCase()!==owner.toLowerCase()?'owner':'header');
 stage='keys_fetch';const r=await fetcher(issuer+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(10000)});if(!r.ok)return deny('keys_unavailable');stage='keys_parse';const keys=await r.json(),jwk=keys.keys?.find(k=>k.kid===head.kid&&k.kty==='RSA');if(!jwk)return deny('signing_key_unavailable');
 stage='key_import';const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 stage='signature_verify';const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,bytes(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));return valid||deny('signature');
 }catch{return deny(stage+'_unavailable');}
}
