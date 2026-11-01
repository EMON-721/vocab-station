import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const read=(p)=>readFileSync(p,'utf8');
const edge=read('worker/security.ts'),worker=read('worker/index.ts'),auth=read('app/google-auth.ts');
assert(edge.includes('originAllowed(request,env)'), 'Mandatory same-origin request verification missing');
assert(edge.includes('authenticatedIdentity(request,env)'), 'AI quotas need verified D1 identity');
assert(edge.includes('ON CONFLICT(id) DO UPDATE'), 'AI quotas need atomic storage increments');
assert(edge.includes('Content-Security-Policy'), 'Security response headers missing');
assert(worker.includes('await ingress(request,env)'), 'Ingress security middleware is not enabled');
assert(worker.includes('return secureResponse(response'), 'Security response headers are not enabled');
assert(auth.includes('SELECT user_id, email, display_name FROM auth_sessions'), 'D1 session authentication missing');
assert(read('app/data-server.ts').includes('u.role')===false || read('app/data-server.ts').includes("env.ADMIN_EMAIL"),'Admin role must derive from trusted configuration');
const exclude=new Set(['node_modules','.git','.next','.vinext','dist','vendor','public']);
const sensitiveName=/(?:^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|[^/]+\.(?:pem|p12|pfx|key)|service-account\.json|[^/]*credentials?\.json)$/i;
const keyPatterns=[
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AIza[0-9a-zA-Z_-]{30,}/,
  /\bsk-(?:proj-)?[a-zA-Z0-9_-]{22,}\b/,
  /\bgh[pousr]_[a-zA-Z0-9_]{20,}\b/,
  /\b(?:GOOGLE_CLIENT_SECRET|GEMINI_API_KEY|GEMINI_ENCRYPTION_KEY|CLOUDFLARE_API_TOKEN)\s*[:=]\s*["'][a-zA-Z0-9_+/=-]{25,}["']/,
];
let scanned=0;
function scan(dir='.') {
 for(const name of readdirSync(dir)){
  if(exclude.has(name)||name==='pnpm-lock.yaml')continue;
  const path=join(dir,name),relative=path.replace(/^\.\/?/,'');
  if(sensitiveName.test(relative))throw Error('Sensitive file path must not be committed: '+relative);
  const stat=statSync(path);
  if(stat.isDirectory())scan(path);
  else if(stat.isFile()&&stat.size<2500000 && /(?:\.(?:ts|tsx|js|mjs|json|yaml|yml|toml|md|sql|sh)|^\.[^/.]+)$/i.test(name)){
   const content=read(path);
   scanned++;
   if(keyPatterns.some(pattern=>pattern.test(content)))throw Error('Potential credential found in: '+relative+' (content suppressed)');
  }
 }
}
scan();
console.log('Security policy checks passed; '+scanned+' text files scanned for typical secret patterns.');
