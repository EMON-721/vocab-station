// Secret-pattern hygiene scan of all Git objects, including historical blobs.
// Deliberately never prints matched content or API key fragments.
import {execFileSync} from "node:child_process";
const git=(args)=>execFileSync("git",args,{encoding:"utf8",maxBuffer:16*1024*1024});
const objects=git(["cat-file","--batch-all-objects","--batch-check=%(objectname) %(objecttype) %(objectsize)"])
  .trim().split("\n").map(line=>line.split(" "));
const patterns=[
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /AIza[0-9a-zA-Z_-]{30,}/,
  /\bsk-(?:proj-)?[a-zA-Z0-9_-]{22,}\b/,
  /\bgh[pousr]_[a-zA-Z0-9_]{20,}\b/,
  /\b(?:GOOGLE_CLIENT_SECRET|GEMINI_API_KEY|GEMINI_ENCRYPTION_KEY|CLOUDFLARE_API_TOKEN)\s*[:=]\s*["'][a-zA-Z0-9_+/=-]{25,}["']/,
];
let checked=0,findings=0;
for(const [sha,type,size] of objects){
 if(type!=="blob"||Number(size)>1500000)continue;
 const value=git(["cat-file","blob",sha]);
 checked++;
 if(patterns.some(p=>p.test(value))){findings++;console.error("Potential secret in Git object "+sha.slice(0,12)+" (content suppressed)");}
}
if(findings)process.exitCode=1;
else console.log("Git history secret-pattern scan: "+checked+" blobs checked, no matching patterns.");
