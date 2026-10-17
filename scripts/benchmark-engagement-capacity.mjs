// Local-only fresh-process measurements. No provider, database or network access.
// node --experimental-loader ./tests/json-loader.mjs scripts/benchmark-engagement-capacity.mjs > results.json
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {createCapacitySimulation} from '../server/engagement-capacity-shadow.mjs';
import {capacityConfig,capacityCohort,importEvent,CAPACITY_START,DAY} from '../tests/helpers/engagement-capacity-fixture.mjs';
if(process.argv[2]==='--case'){
 const [size,rate,imports,days]=process.argv.slice(3).map(Number),start=Date.parse(CAPACITY_START);
 const before=process.memoryUsage(),t0=performance.now();
 const s=createCapacitySimulation(capacityConfig({rate,days}));
 for(let d=0;d<imports;d++)s.submit(importEvent(capacityCohort(size,{prefix:'day'+d}),start+d*DAY,'import'+d));
 const constructed=process.memoryUsage(),t1=performance.now(),result=s.advance(start+days*DAY),t2=performance.now(),drained=process.memoryUsage();
 console.log(JSON.stringify({size,rate,imports,days,construction_ms:t1-t0,simulation_ms:t2-t1,evaluations_per_second:result.counts.evaluated/((t2-t1)/1000),memory:{before,constructed,drained,peak_rss_kib:process.resourceUsage().maxRSS},result}));
}else{
 const results=[];
 for(const [size,imports,days] of [[1000,1,7],[5000,1,7],[1000,7,14]])for(const rate of [10,20,25,40]){
  const child=spawnSync(process.execPath,['--experimental-loader','./tests/json-loader.mjs',import.meta.filename,'--case',size,rate,imports,days].map(String),{encoding:'utf8',maxBuffer:8*1024*1024});
  if(child.status!==0)throw Error(child.stderr);results.push(JSON.parse(child.stdout));
 }
 console.log(JSON.stringify({build:'CF-ENGAGEMENT-CAPACITY-SHADOW-0.2',node:process.version,platform:process.platform,measurement:'one fresh process per case; synthetic workload, not hosted/provider capacity',results},null,2));
}
