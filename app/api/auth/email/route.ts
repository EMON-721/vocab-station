import { env } from "cloudflare:workers";
import {
  SESSION_COOKIE, SESSION_SECONDS, base64url, cookieHeader, randomToken,
  safeReturnPath, sha256Hex,
} from "../../../google-auth";
import { getOrCreateLearnerAccount } from "../../../learner-identity";

const ITERATIONS = 260000;
const enc = new TextEncoder();
type Credential = {user_id:string;email:string;login_id:string;display_name:string;password_salt:string;password_hash:string};
const json = (body:unknown, status=200, cookie?:string) => {
  const headers: Record<string,string> = {"Cache-Control":"no-store","Pragma":"no-cache"};
  if (cookie) headers["Set-Cookie"] = cookie;
  return Response.json(body,{status,headers});
};
const validEmail = (email:string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const validId = (id:string) => /^[a-z][a-z0-9_]{2,31}$/.test(id);

async function ensureCredentialsTable() {
  if (!env.DB) throw Error("Database unavailable");
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS email_credentials (" +
    "user_id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL UNIQUE, " +
    "login_id TEXT NOT NULL UNIQUE COLLATE NOCASE, display_name TEXT NOT NULL, " +
    "password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL)"
  ).run();
}
async function derivedPassword(password:string,salt:string) {
  const raw = Uint8Array.from(atob(salt.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
  const material = await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
  const bytes = await crypto.subtle.deriveBits({name:"PBKDF2",salt:raw,iterations:ITERATIONS,hash:"SHA-256"},material,256);
  return new Uint8Array(bytes);
}
function equalConstantTime(a:Uint8Array,b:Uint8Array):boolean{
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function setSession(userId:string,email:string,name:string) {
  const token=randomToken(),now=Date.now();
  await env.DB!.prepare(
    "INSERT INTO auth_sessions(id,user_id,email,display_name,expires_at,created_at) VALUES(?,?,?,?,?,?)"
  ).bind(await sha256Hex(token),userId,email,name,now+SESSION_SECONDS*1000,now).run();
  return cookieHeader(SESSION_COOKIE,token,SESSION_SECONDS);
}

export async function POST(request:Request):Promise<Response>{
  if (!env.DB) return json({error:"Sign-up is temporarily unavailable."},503);
  if (Number(request.headers.get("content-length")||"0")>8192) return json({error:"Request too large."},413);
  let input:Record<string,unknown>;
  try { input=await request.json() as Record<string,unknown>; if(!input||typeof input!=="object")throw Error(); }
  catch { return json({error:"Invalid request."},400); }
  const action=input.action, password=typeof input.password==="string"?input.password:"";
  const returnTo=safeReturnPath(typeof input.returnTo==="string"?input.returnTo:"/");
  if (password.length<8||password.length>128) return json({error:"Password must be 8–128 characters."},400);
  try {
    await ensureCredentialsTable();
    if (action==="register") {
      const name=typeof input.name==="string"?input.name.trim():"";
      const email=typeof input.email==="string"?input.email.trim().toLowerCase():"";
      const loginId=typeof input.loginId==="string"?input.loginId.trim().toLowerCase():"";
      if(name.length<2||name.length>100||!validEmail(email)||!validId(loginId))
        return json({error:"Enter your name, a valid email, and a User ID (3–32 letters, numbers or underscores)."},400);
      const existing = await env.DB.prepare(
        "SELECT user_id FROM email_credentials WHERE email=? OR login_id=? LIMIT 1"
      ).bind(email,loginId).first();
      if(existing)return json({error:"Email or User ID is already registered."},409);
      const salt=base64url(crypto.getRandomValues(new Uint8Array(16)));
      const hash=base64url(await derivedPassword(password,salt));
      const userId="local:"+crypto.randomUUID();
      try {
        await env.DB.prepare(
          "INSERT INTO email_credentials(user_id,email,login_id,display_name,password_salt,password_hash,created_at) " +
          "VALUES(?,?,?,?,?,?,?)"
        ).bind(userId,email,loginId,name,salt,hash,Date.now()).run();
      }catch {return json({error:"Email or User ID is already registered."},409);}
      try {
        await getOrCreateLearnerAccount(userId,loginId);
      }catch(e){
        await env.DB.prepare("DELETE FROM email_credentials WHERE user_id=?").bind(userId).run();
        return json({error:e instanceof Error?e.message:"Could not create your account."},409);
      }
      const cookie=await setSession(userId,email,name);
      return json({ok:true,returnTo},201,cookie);
    }
    if(action==="login") {
      const identifier=typeof input.identifier==="string"?input.identifier.trim().toLowerCase():"";
      if(!identifier||identifier.length>254)return json({error:"Invalid User ID/email or password."},401);
      const row=await env.DB.prepare(
        "SELECT user_id,email,login_id,display_name,password_salt,password_hash FROM email_credentials " +
        "WHERE email=? OR login_id=? LIMIT 1"
      ).bind(identifier,identifier).first<Credential>();
      // Use an actual KDF even for unknown accounts to limit timing-based enumeration.
      const salt=row?.password_salt||base64url(new Uint8Array(16));
      const candidate=await derivedPassword(password,salt);
      const stored=row?Uint8Array.from(atob(row.password_hash.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0)):new Uint8Array(32);
      if(!row||!equalConstantTime(candidate,stored))return json({error:"Invalid User ID/email or password."},401);
      const cookie=await setSession(row.user_id,row.email,row.display_name);
      return json({ok:true,returnTo},200,cookie);
    }
    return json({error:"Unknown action."},400);
  }catch {
    return json({error:"Authentication is temporarily unavailable. Please try again."},503);
  }
}
