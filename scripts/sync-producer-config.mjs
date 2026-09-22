import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile(new URL('../producer.json',import.meta.url),'utf8');
JSON.parse(source);
const output='// Generated from producer.json. After editing producer.json, run: node scripts/sync-producer-config.mjs\n// Plain ESM avoids JSON import attributes unsupported by the Pages Functions bundler.\nexport default JSON.parse('+JSON.stringify(source)+');\n';
await writeFile(new URL('../server/producer-config.mjs',import.meta.url),output);
