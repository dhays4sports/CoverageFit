// Disposable local child process: parent terminates it after the committed claim.
import {reopen,W,NOW} from './evaluation-queue-fixture.mjs';
const f=reopen(process.argv[2]);
const batch=f.queue.claim({workspace:W,now:NOW,workerId:'crash-process',limit:1,leaseMs:1});
process.stdout.write(JSON.stringify({claimed:batch.claims.length})+'\n');
setInterval(()=>{},1000);
