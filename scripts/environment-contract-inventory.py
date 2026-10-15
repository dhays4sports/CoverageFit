"""Inventory source references only. Never read deployed values or local secrets."""
from pathlib import Path
import re
refs={};dynamic=[]
for folder in ['server','functions','workers','assets/js']:
 for p in sorted(Path(folder).rglob('*')):
  if p.suffix not in {'.js','.mjs','.ts'}:continue
  for n,line in enumerate(p.read_text().splitlines(),1):
   names=set(re.findall(r'\benv(?:\?\.|\.)([A-Z][A-Z0-9_]+)',line))
   names.update(re.findall(r'\benv(?:\?\.)?\[\s*[\'\"]([A-Z][A-Z0-9_]+)[\'\"]',line))
   # Configuration helpers often pass the env key as a literal argument.
   names.update(re.findall(r'[\'\"]((?:CF_|CALLBACK_|GOOGLE_|RINGCENTRAL_|RC_|COVERAGEFIT_|SIGNAL_|OPENAI_)[A-Z0-9_]+)[\'\"]',line))
   for name in names:refs.setdefault(name,set()).add(f'{p}:{n}')
   if re.search(r'\benv(?:\?\.)?\[[^\'\"]',line):dynamic.append(f'{p}:{n}')
def category(n):
 if n.startswith(('GOOGLE_','CALLBACK_')):return 'Google / callback'
 if n.startswith(('RINGCENTRAL_','RC_')):return 'RingCentral'
 if n.startswith(('CF_AI_','OPENAI_','CF_SIGNAL_COPILOT')):return 'AI / Copilot'
 if 'SMS' in n or 'SIGNAL' in n:return 'Signal / SMS'
 return 'Core / other'
lines=['# Environment contract inventory','', 'Generated from code references by scripts/environment-contract-inventory.py.', 'No secret values inspected. Cloudflare configuration and scope remain UNKNOWN.', 'Helper-key candidates can include constants; source references permit review.', '', '| Category | Repo expects / references | Source | Cloudflare has | Scope | Status / required action |','|---|---|---|---|---|---|']
for name in sorted(refs,key=lambda n:(category(n),n)):
 lines.append(f'| {category(name)} | `{name}` | '+', '.join(sorted(refs[name]))+' | UNKNOWN | UNKNOWN | Compare names/types in operator dashboard; do not expose values |')
lines+=['','## Dynamic lookup sites','',*['- '+r for r in dynamic],'','Dynamic keys require contextual review; this static inventory cannot prove the absence of other bindings.','Cloudflare-only cleanup candidates cannot be identified until its names-only inventory is available.','Do not delete any configuration. Mark unmatched names CANDIDATE CLEANUP — REVIEW REQUIRED.']
Path('docs/COVERAGEFIT-ENVIRONMENT-CONTRACT.md').write_text('\n'.join(lines)+'\n')
print(f'{len(refs)} referenced names; {len(dynamic)} dynamic lookup sites')
