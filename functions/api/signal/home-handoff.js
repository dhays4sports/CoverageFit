import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {createPVXRecordStore} from '../../../server/d1-json-store.mjs';
import {handleSignalHomeHandoff} from '../../../server/signal-home-handoff.mjs';
export const onRequest=context=>withD1RateLimit(context,{route:'signal-home-handoff',limit:30,windowSeconds:60},()=>handleSignalHomeHandoff(context.request,{env:context.env,db:context.env?.COVERAGEFIT_DB,store:context.env?.COVERAGEFIT_DB?createPVXRecordStore(context.env.COVERAGEFIT_DB):null}));
