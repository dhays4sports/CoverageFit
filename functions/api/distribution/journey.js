import {withD1RateLimit} from '../../../server/cloudflare-rate-limit.mjs';
import {createPVXRecordStore} from '../../../server/d1-json-store.mjs';
import {distributionJourney} from '../../../server/distribution-journey.mjs';
export const onRequest=context=>withD1RateLimit(context,{route:'distribution-journey',limit:60,windowSeconds:60,failClosed:true},()=>distributionJourney(context.request,{env:context.env,db:context.env?.COVERAGEFIT_DB,store:context.env?.COVERAGEFIT_DB?createPVXRecordStore(context.env.COVERAGEFIT_DB):null}));
