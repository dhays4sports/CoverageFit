// Node-only compatibility for the existing Cloudflare bundled JSON imports.
import {readFile} from 'node:fs/promises';
export async function load(url,context,nextLoad){
 if(url.endsWith('.json'))return {format:'module',shortCircuit:true,source:`export default ${await readFile(new URL(url),'utf8')};`};
 return nextLoad(url,context);
}
