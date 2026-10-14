import {authorizeProducer} from '../../server/consultation-inbox-core.mjs';
import {producerIntelligenceRead} from '../../server/producer-intelligence-read.mjs';
import {producerIntelligenceLocal} from '../../server/producer-intelligence-local.mjs';
import {W,NOW} from './evaluation-queue-fixture.mjs';
export const token='synthetic-c4-read-acceptance-token';
export const request=(query='')=>new Request('https://synthetic.test/api/solo-desk/producer-work'+query,{headers:{authorization:'Bearer '+token}});
export const authority=(scope={workspace:W,actor:'synthetic-producer',workspaceRead:true})=>async req=>authorizeProducer(req,{COVERAGEFIT_PRODUCER_ACCESS_TOKEN:token}).ok?scope:null;
export function views(f,options={}){return producerIntelligenceRead({authorize:authority(),store:producerIntelligenceLocal(f.db,{syntheticOnly:true}),clock:()=>NOW,...options})}
