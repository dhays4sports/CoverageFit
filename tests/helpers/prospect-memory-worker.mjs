import {parentPort,workerData} from 'node:worker_threads';
import {open,NOW} from './prospect-memory-fixture.mjs';
const f=open(workerData.path);
try{parentPort.postMessage(f.memory.admit(workerData.event,{now:NOW}));}finally{f.db.close()}
