import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import producer from '../server/producer-config.mjs';
const json=JSON.parse(await readFile(new URL('../producer.json',import.meta.url),'utf8'));
assert.deepEqual(producer,json,'Run node scripts/sync-producer-config.mjs after changing producer.json');
for(const file of ['quote-template-api.mjs','recommendation-api.mjs','solo-desk-repository.mjs','closing-flow.mjs']){
 const source=await readFile(new URL('../server/'+file,import.meta.url),'utf8');
 assert.match(source,/import producer from '\.\/producer-config\.mjs';/);
 assert.doesNotMatch(source,/import[^;]*producer\.json[^;]*\b(?:with|assert)\s*\{/);
}
console.log('PASS producer configuration parity and portable ESM imports');


async function scan(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const file=new URL(entry.name+(entry.isDirectory()?'/':''),directory);
  if(entry.isDirectory()) await scan(file);
  else if(/\.(?:mjs|cjs|js)$/.test(entry.name)){
   const source=await readFile(file,'utf8');
   assert.doesNotMatch(source,/\b(?:import|export)\s[^;]*?["'][^"']+\.json["']\s*(?:with|assert)\s*\{/,file.pathname+' must use portable ESM configuration');
  }
 }
}
await scan(new URL('../server/',import.meta.url));
console.log('PASS recursive server JSON import compatibility scan');
