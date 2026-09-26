import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {createPVXRecordStore} from '../../../server/d1-json-store.mjs';
import {distributionEvent} from '../../../server/distribution-journey.mjs';
export const onRequest=context=>withD1RateLimit(context,{route:'entry-events',limit:30,windowSeconds:60,failClosed:true},()=>distributionEvent(context.request,{env:context.env,store:context.env?.COVERAGEFIT_DB?createPVXRecordStore(context.env.COVERAGEFIT_DB):null}));
