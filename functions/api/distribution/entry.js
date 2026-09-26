import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {createPVXRecordStore} from '../../../server/d1-json-store.mjs';
import {distributionEntry} from '../../../server/distribution-journey.mjs';
export const onRequest=context=>withD1RateLimit(context,{route:'distribution-entry',limit:20,windowSeconds:60,failClosed:true},()=>distributionEntry(context.request,{env:context.env,db:context.env?.COVERAGEFIT_DB,store:context.env?.COVERAGEFIT_DB?createPVXRecordStore(context.env.COVERAGEFIT_DB):null}));
