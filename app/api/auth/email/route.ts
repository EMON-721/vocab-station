import { env } from "cloudflare:workers";
import {
  SESSION_COOKIE, SESSION_SECONDS, base64url, cookieHeader, randomToken,
  safeReturnPath, sha256Hex,
} from "../../../google-auth";
import { NEXT_LEARNER_ID_SQL } from "../../../learner-identity";

const ITERATIONS = 260000;
const enc = new TextEncoder();
type Credential = {
  user_id:string;email:string;login_id:string;display_name:string;
  password_salt:string;password_hash:string
};
const json = (body:unknown,status=200,cookie?:string) => {
  const headers:Record<string,string> = {"Cache-Control":"no-store","Pragma":"no-cache"};
  if (cookie) headers["Set-Cookie"]=cookie;
  return Response.json(body,{status,headers});
};
const emailKey=(value:string)=>"email-auth:email:"+value;
const loginKey=(value:string)=>"email-auth:login:"+value;
const userKey=(value:string)=>"email-auth:user:"+value;
const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;
const validId=(value:string)=>/^[a-z][a-z0-9_]{2,31}$/.test(value);
const nonempty=(value:unknown)=>typeof value==="string"?value:"";

async function readRecord(id:string) {
  const row=await env.DB!.prepare("SELECT data FROM records WHERE id=?")
    .bind(id).first<{data:string}>();
  return row?JSON.parse(row.data) as any:null;
}
async function readLegacyCredential(identifier:string):Promise<Credential|null> {
  try {
    // Read-only compatibility for accounts created by the previous implementation.
    return await env.DB!.prepare(
      "SELECT user_id,email,login_id,display_name,password_salt,password_hash " +
      "FROM email_credentials WHERE email=? OR login_id=? LIMIT 1"
    ).bind(identifier,identifier).first<Credential>();
  } catch { return null; } // The optional old table may not have been migrated.
}
async function derivedPassword(password:string,salt:string) {
  const raw=Uint8Array.from(atob(salt.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
  const material=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
  const bytes=await crypto.subtle.deriveBits({
    name:"PBKDF2",salt:raw,iterations:ITERATIONS,hash:"SHA-256"
  },material,256);
  return new Uint8Array(bytes);
}
function equalConstantTime(a:Uint8Array,b:Uint8Array):boolean {
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
async function createSession(userId:string,email:string,name:string) {
  const token=randomToken(),now=Date.now();
  await env.DB!.prepare(
    "INSERT INTO auth_sessions(id,user_id,email,display_name,expires_at,created_at) VALUES(?,?,?,?,?,?)"
  ).bind(await sha256Hex(token),userId,email,name,now+SESSION_SECONDS*1000,now).run();
  return cookieHeader(SESSION_COOKIE,token,SESSION_SECONDS);
}
async function findCredential(identifier:string):Promise<Credential|null> {
  const ref=await readRecord(emailKey(identifier))||await readRecord(loginKey(identifier));
  if(ref?.userId) {
    const credential=await readRecord(userKey(ref.userId));
    if(credential?.user_id) return credential as Credential;
  }
  return readLegacyCredential(identifier);
}

export async function POST(request:Request):Promise<Response> {
  if(!env.DB)return json({error:"The account database is not connected."},503);
  if(Number(request.headers.get("content-length")||"0")>8192)
    return json({error:"Request too large."},413);
  let input:Record<string,unknown>;
  try {
    input=await request.json() as Record<string,unknown>;
    if(!input||typeof input!=="object"||Array.isArray(input))throw Error();
  }catch{return json({error:"Invalid request."},400);}
  const action=input.action,password=nonempty(input.password);
  const returnTo=safeReturnPath(typeof input.returnTo==="string"?input.returnTo:"/");
  if(password.length<8||password.length>128)
    return json({error:"Password must be at least 8 characters (maximum 128)."},400);
  try {
    if(action==="register") {
      const name=nonempty(input.name).trim();
      const email=nonempty(input.email).trim().toLowerCase();
      const loginId=nonempty(input.loginId).trim().toLowerCase();
      if(name.length<2||name.length>100||!validEmail(email)||!validId(loginId))
        return json({error:"Enter your full name, a valid email and a User ID (3–32 characters)."},400);

      if(await readRecord(emailKey(email))||await readRecord(loginKey(loginId))||
         await readLegacyCredential(email)||await readLegacyCredential(loginId))
        return json({error:"Email or User ID is already registered."},409);

      const userId="local:"+crypto.randomUUID();
      const salt=base64url(crypto.getRandomValues(new Uint8Array(16)));
      const hash=base64url(await derivedPassword(password,salt));
      const cred:Credential={user_id:userId,email,login_id:loginId,
        display_name:name,password_salt:salt,password_hash:hash};
      const token=randomToken(),now=Date.now();
      const sessionId=await sha256Hex(token);
      // All writes are one D1 transaction. No schema changes or new tables are needed.
      // Conflicts on either lookup or accounts roll back the entire registration.
      try {
        await env.DB.batch([
          env.DB.prepare("INSERT INTO records(id,data) VALUES(?,?)")
            .bind(emailKey(email),JSON.stringify({userId})),
          env.DB.prepare("INSERT INTO records(id,data) VALUES(?,?)")
            .bind(loginKey(loginId),JSON.stringify({userId})),
          env.DB.prepare("INSERT INTO records(id,data) VALUES(?,?)")
            .bind(userKey(userId),JSON.stringify(cred)),
          env.DB.prepare(
            "INSERT INTO accounts(id,student_id,username) "+NEXT_LEARNER_ID_SQL
          ).bind(userId,loginId),
          env.DB.prepare(
            "INSERT INTO auth_sessions(id,user_id,email,display_name,expires_at,created_at) VALUES(?,?,?,?,?,?)"
          ).bind(sessionId,userId,email,name,now+SESSION_SECONDS*1000,now),
        ]);
      }catch(error) {
        console.error("Vocab Station email registration transaction failed:",error);
        return json({error:"Could not create this account. Check whether the email or User ID is already used, then retry."},409);
      }
      return json({ok:true,returnTo},201,cookieHeader(SESSION_COOKIE,token,SESSION_SECONDS));
    }
    if(action==="login") {
      const identifier=nonempty(input.identifier).trim().toLowerCase();
      if(!identifier||identifier.length>254)
        return json({error:"Invalid Email/User ID or password."},401);
      const row=await findCredential(identifier);
      const candidate=await derivedPassword(password,row?.password_salt||base64url(new Uint8Array(16)));
      const hash=row?.password_hash||base64url(new Uint8Array(32));
      const stored=Uint8Array.from(atob(hash.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
      if(!row||!equalConstantTime(candidate,stored))
        return json({error:"Invalid Email/User ID or password."},401);
      const cookie=await createSession(row.user_id,row.email,row.display_name);
      return json({ok:true,returnTo},200,cookie);
    }
    return json({error:"Unknown action."},400);
  }catch(error) {
    // Log server details only, never passwords or account secrets.
    console.error("Vocab Station account authentication failure:",error);
    return json({error:"The account service could not complete the request. Please try again."},503);
  }
}
