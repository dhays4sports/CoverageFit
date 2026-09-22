import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import producer from '../server/producer-config.mjs';
const json=JSON.parse(await readFile(new URL('../producer.json',import.meta.url),'utf8'));
assert.deepEqual(producer,json,'Run node scripts/sync-producer-config.mjs after changing producer.json');
for(const file of ['quote-template-api.mjs','recommendation-api.mjs','solo-desk-repository.mjs']){
 const source=await readFile(new URL('../server/'+file,import.meta.url),'utf8');
 assert.match(source,/import producer from '\.\/producer-config\.mjs';/);
 assert.doesNotMatch(source,/import[^;]*producer\.json[^;]*\b(?:with|assert)\s*\{/);
}
console.log('PASS producer configuration parity and portable ESM imports');
