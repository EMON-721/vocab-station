import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { webcrypto } from "node:crypto";
import ts from "typescript";

/** Production-compatibility regression: Cloudflare Workers limits PBKDF2 to 100,000 iterations. */
const source=fs.readFileSync("app/api/auth/email/route.ts","utf8");
const iterations=Number(source.match(/const ITERATIONS\s*=\s*(\d+)/)?.[1]);
assert(Number.isInteger(iterations)&&iterations>=100000&&iterations<=100000,
  "Password KDF exceeds Cloudflare's 100,000-iteration per-call maximum");

const sqlite=new DatabaseSync(":memory:");
sqlite.exec(`
  CREATE TABLE records(id TEXT PRIMARY KEY NOT NULL,data TEXT NOT NULL);
  CREATE TABLE accounts(id TEXT PRIMARY KEY NOT NULL,student_id TEXT NOT NULL UNIQUE,username TEXT NOT NULL UNIQUE);
  CREATE TABLE auth_sessions(id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,email TEXT NOT NULL,
    display_name TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
`);
const DB={
  prepare(sql){
    return {bind(...args){
      return {
        async first(){return sqlite.prepare(sql).get(...args)||null},
        async run(){return sqlite.prepare(sql).run(...args)},
      };
    }};
  },
  async batch(statements){
    sqlite.exec("BEGIN");
    try {
      const out=[];
      for(const statement of statements)out.push(await statement.run());
      sqlite.exec("COMMIT");
      return out;
    }catch(e){sqlite.exec("ROLLBACK");throw e;}
  },
};
const env={DB};
const textEncoder=new TextEncoder();
const base64url=bytes=>Buffer.from(bytes).toString("base64url");
const randomToken=()=>base64url(webcrypto.getRandomValues(new Uint8Array(32)));
const stubAuth={
  SESSION_COOKIE:"__Host-vs_session",SESSION_SECONDS:7*86400,
  base64url,randomToken,
  safeReturnPath:value=>value?.startsWith("/")&&!value.startsWith("//")?value:"/",
  sha256Hex:async value=>Buffer.from(await webcrypto.subtle.digest("SHA-256",textEncoder.encode(value))).toString("hex"),
  cookieHeader:(name,value,maxAge)=>name+"="+value+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge,
};
const limitedCrypto={
  randomUUID:()=>webcrypto.randomUUID(),
  getRandomValues:array=>webcrypto.getRandomValues(array),
  subtle:{
    importKey:(...args)=>webcrypto.subtle.importKey(...args),
    deriveBits:(params,...rest)=>{
      if(params.iterations>100000)throw Error("Cloudflare production PBKDF2 ceiling exceeded");
      return webcrypto.subtle.deriveBits(params,...rest);
    },
    digest:(...args)=>webcrypto.subtle.digest(...args),
  },
};
const cache=new Map();
function load(file) {
  if(cache.has(file))return cache.get(file);
  const mod={exports:{}};
  cache.set(file,mod.exports);
  const js=ts.transpileModule(fs.readFileSync(file,"utf8"),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true},
  }).outputText;
  vm.runInNewContext(js,{
    module:mod,exports:mod.exports,
    require:spec=>{
      if(spec==="cloudflare:workers")return {env};
      if(spec.endsWith("google-auth"))return stubAuth;
      if(spec.startsWith("."))return load(path.resolve(path.dirname(file),spec)+".ts");
      throw Error("Unexpected import in email route: "+spec);
    },
    TextEncoder,TextDecoder,Uint8Array,Response,Request,URL,Date,console,crypto:limitedCrypto,Buffer,btoa,atob,
  },{filename:file});
  return mod.exports;
}
const api=load(path.resolve("app/api/auth/email/route.ts"));
const request=(fields)=>new Request("https://test.invalid/api/auth/email",{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(fields),
});
const register=async(name,email,loginId,password)=>api.POST(request({
  action:"register",name,email,loginId,password,
}));
const one=await register("Learner One","one@example.invalid","learner_one","example-passphrase-1");
assert.equal(one.status,201,await one.text());
assert.match(one.headers.get("set-cookie"),/__Host-vs_session=.*HttpOnly; Secure/);
assert.equal(sqlite.prepare("SELECT student_id FROM accounts WHERE username=?").get("learner_one").student_id,"9057");
const two=await register("Learner Two","two@example.invalid","learner_two","example-passphrase-2");
assert.equal(two.status,201,await two.text());
assert.equal(sqlite.prepare("SELECT student_id FROM accounts WHERE username=?").get("learner_two").student_id,"9058");
assert.equal((await register("Again","one@example.invalid","learner_three","example-passphrase-3")).status,409);
assert.equal((await register("Short","short@example.invalid","short_id","1234567")).status,400);
const invalid=await api.POST(request({action:"login",identifier:"learner_one",password:"incorrect-password"}));
assert.equal(invalid.status,401);
const valid=await api.POST(request({action:"login",identifier:"ONE@example.invalid",password:"example-passphrase-1"}));
assert.equal(valid.status,200,await valid.text());
const validById=await api.POST(request({action:"login",identifier:"learner_two",password:"example-passphrase-2"}));
assert.equal(validById.status,200,await validById.text());
const secrets=sqlite.prepare("SELECT data FROM records WHERE id LIKE 'email-auth:user:%'").all().map(r=>r.data).join("\n");
assert(!secrets.includes("example-passphrase"),"Raw passwords must never be stored");
assert.equal(sqlite.prepare("SELECT COUNT(*) AS total FROM auth_sessions").get().total,4);
console.log("Email signup/login verified against a Cloudflare-capped PBKDF2 simulator: 8+ password, salted hashes, sessions, duplicate rejection and learner IDs 9057/9058.");
