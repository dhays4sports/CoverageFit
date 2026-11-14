import {withD1RateLimit} from '../../../server/api-rate-limit.mjs';
import {handleSharedProfile} from '../../../server/shared-prospect-profile.mjs';
export const onRequest=context=>withD1RateLimit(context,{route:'shared-profile',limit:60,windowSeconds:60},()=>handleSharedProfile(context));
