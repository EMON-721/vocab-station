import assert from 'node:assert/strict';
import ts from 'typescript';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
const source=readFileSync('worker/security.ts','utf8');
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
vm.runInNewContext(transpiled,{module,exports:module.exports,crypto:webcrypto,Request,Response,Headers,URL,TextEncoder,Date,Math,Number,JSON,Set});
const {ingress,secureResponse}=module.exports;
const origin='https://vocab-station.emon721.workers.dev';
const quotas=new Map();
const DB={prepare(sql){
 let args=[];
 const q={bind(...v){args=v;return q},async first(){
  if(sql.startsWith('SELECT user_id FROM auth_sessions'))return {user_id:'google:learner-1'};
  if(sql.startsWith('INSERT INTO records')){
   const key=args[0],max=args[1],value=quotas.get(key)||0;
   if(value>=max)return null;
   quotas.set(key,value+1);return {data:JSON.stringify({count:value+1})};
  }
  throw Error('Unexpected SQL '+sql);
 }};
 return q;
}};
const env={DB,SITE_ORIGIN:origin,AI_DAILY_LIMIT:'30'};
function post(path,options={}){
 return new Request(origin+path,{method:'POST',
   headers:{Origin:origin,'Content-Type':'application/json','Sec-Fetch-Site':'same-origin',...options.headers},
   body:JSON.stringify(options.body||{action:'save'}),...(options.cookie?{headers:{Origin:origin,'Content-Type':'application/json','Sec-Fetch-Site':'same-origin',Cookie:'__Host-vs_session='+'a'.repeat(43)}}:{})});
}
const cross=post('/api/state',{headers:{Origin:'https://attacker.invalid'}});
assert.equal((await ingress(cross,env)).status,403,'Reject cross-origin POST');
const missing=post('/api/state',{headers:{Origin:''}});
assert.equal((await ingress(missing,env)).status,403,'Reject missing Origin');
const crossSite=post('/api/state',{headers:{'Sec-Fetch-Site':'cross-site'}});
assert.equal((await ingress(crossSite,env)).status,403,'Reject cross-site fetch');
const wrongType=post('/api/state',{headers:{'Content-Type':'text/plain'}});
assert.equal((await ingress(wrongType,env)).status,415,'Require application/json');
assert.equal(await ingress(post('/api/state'),env),null,'Allow valid same-origin JSON');
assert.equal((await ingress(post('/api/sentence',{body:{mode:'ai',text:'test'}}),env)).status,401,'Require session before AI');
for(let i=0;i<6;i++)assert.equal(await ingress(post('/api/sentence',{cookie:true,body:{mode:'ai',text:'test'}}),env),null,'Allow within rate limit');
assert.equal((await ingress(post('/api/sentence',{cookie:true,body:{mode:'ai',text:'test'}}),env)).status,429,'Enforce atomic burst limit');
const secured=secureResponse(new Response('ok'),'/api/state');
assert.equal(secured.headers.get('X-Frame-Options'),'DENY');
assert.match(secured.headers.get('Cache-Control'),/no-store/);
assert.match(secured.headers.get('Content-Security-Policy'),/frame-ancestors/);
console.log('Ingress security tests passed (CSRF, origin, content type, auth, quota, and headers).');
