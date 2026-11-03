/**
 * Defense in depth at the Workers ingress. Never trust browser-supplied role,
 * identity, or user-id headers. Production sessions come only from D1.
 */
type RuntimeEnv = Cloudflare.Env;
const API_WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
function deny(message: string, status: number, retryAfter?: number): Response {
  const headers = new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
  if (retryAfter) headers.set("Retry-After", String(retryAfter));
  return new Response(JSON.stringify({error: message}), {status, headers});
}
function originAllowed(request: Request, env: RuntimeEnv): boolean {
  const incoming = new URL(request.url);
  const canonical = env.SITE_ORIGIN || incoming.origin;
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");
  const site = request.headers.get("Sec-Fetch-Site");
  // First-party fetch and forms must provide an Origin; reject legacy or
  // scripted cookie-bearing requests with no trustworthy origin signal.
  if (origin !== canonical) return false;
  if (site && !["same-origin", "none"].includes(site)) return false;
  if (referer) {
    try { if (new URL(referer).origin !== canonical) return false; }
    catch { return false; }
  }
  return incoming.origin === canonical;
}
async function digest(input: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
  return Array.from(bytes, x => x.toString(16).padStart(2, "0")).join("");
}
function cookieValue(request: Request, name: string): string | null {
  for (const pair of (request.headers.get("Cookie")||"").split(";")) {
    const item=pair.trim();
    if (item.startsWith(name+"=")) return item.slice(name.length+1);
  }
  return null;
}
async function authenticatedIdentity(request: Request, env: RuntimeEnv): Promise<string|null> {
  const token=cookieValue(request,"__Host-vs_session");
  if (!token || !/^[a-zA-Z0-9_-]{43}$/.test(token) || !env.DB) return null;
  const hashed=await digest(token);
  const session=await env.DB.prepare("SELECT user_id FROM auth_sessions WHERE id=? AND expires_at>? AND created_at>?")
    .bind(hashed, Date.now(), Date.now()-7*24*60*60*1000).first<{user_id:string}>();
  return session?.user_id || null;
}
/**
 * Atomically reserves a quota before a paid AI operation. Limits are retained
 * in the existing D1 records table; no additional migration is needed.
 * Atomic UPSERT avoids read/modify/write bypass under concurrent requests.
 */
async function reserveQuota(env:RuntimeEnv, group:string, subject:string, windowSeconds:number, maxRequests:number):Promise<boolean>{
  if (!env.DB) throw Error("Database unavailable");
  const bucket=Math.floor(Date.now()/(windowSeconds*1000));
  const key="security-quota-v1:"+group+":"+windowSeconds+":"+bucket+":"+(await digest(subject));
  const row=await env.DB.prepare(
    "INSERT INTO records(id,data) VALUES(?,json_object('count',1)) "+
    "ON CONFLICT(id) DO UPDATE SET data=json_set(data,'$.count',json_extract(data,'$.count')+1) "+
    "WHERE CAST(json_extract(data,'$.count') AS INTEGER) < ? RETURNING data"
  ).bind(key,maxRequests).first<{data:string}>();
  return !!row;
}
const numberOr=(value:string|undefined, fallback:number, floor:number, ceiling:number)=>{
  const n=Number(value);return Number.isInteger(n)&&n>=floor&&n<=ceiling?n:fallback;
};
export async function ingress(request:Request, env:RuntimeEnv):Promise<Response|null>{
  const url=new URL(request.url),path=url.pathname,method=request.method.toUpperCase();
  if (!API_WRITE.has(method)) {
    if (method==="GET" && path==="/api/auth/google") {
      try {
        const ip=request.headers.get("CF-Connecting-IP")||"unknown";
        if (!await reserveQuota(env,"oauth-start",ip,3600,120)) return deny("Too many sign-in attempts. Try again later.",429,3600);
      } catch { return deny("Sign-in temporarily unavailable.",503); }
    }
    // Do not let third-party sites navigate users through an automatic logout.
    if (path==="/api/auth/logout" && method==="GET" && request.headers.get("Sec-Fetch-Site")==="cross-site")
      return deny("Cross-site sign-out blocked.",403);
    return null;
  }
  if (path.startsWith("/api/") || path==="/api/auth/logout") {
    if (!originAllowed(request,env)) return deny("Same-origin request required.",403);
    if (path.startsWith("/api/") && !/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type")||""))
      return deny("JSON content type required.",415);
    const size=Number(request.headers.get("Content-Length")||0);
    if (size>2_600_000 || !Number.isFinite(size)) return deny("Request too large.",413);
  }
  if (path==="/api/auth/email" && method==="POST") {
    try {
      const ip=request.headers.get("CF-Connecting-IP")||"unknown";
      if (!await reserveQuota(env,"email-auth",ip,60,12) ||
          !await reserveQuota(env,"email-auth",ip,86400,120))
        return deny("Too many login attempts. Try again later.",429,60);
    } catch { return deny("Authentication temporarily unavailable.",503); }
  }
  let quotaGroup:string|null=null;
  if (method==="POST"&&["/api/sentence","/api/tests","/api/admin/ai"].includes(path)) {
    let value:any;
    try { value=await request.clone().json(); }catch{return deny("Invalid JSON request.",400);}
    if (path==="/api/sentence"&&value?.mode==="ai") quotaGroup="ai-sentence";
    if (path==="/api/tests"&&value?.action==="submit") quotaGroup="ai-tests";
    if (path==="/api/admin/ai"&&["test","models","save-test"].includes(value?.action)) quotaGroup="ai-admin";
  }
  if (quotaGroup) {
    try{
      const userId=await authenticatedIdentity(request,env);
      if (!userId) return deny("Sign in required.",401);
      const daily=numberOr(env.AI_DAILY_LIMIT,30,1,500);
      const perDay=quotaGroup==="ai-sentence"?daily:quotaGroup==="ai-admin"?20:Math.max(10,daily);
      // Per-user plus globally bounded paid API use. Adjust as needed.
      if (!await reserveQuota(env,quotaGroup,userId,60,6) ||
          !await reserveQuota(env,quotaGroup,userId,86400,perDay) ||
          !await reserveQuota(env,"ai-global","all",3600,500))
        return deny("AI request limit reached. Please try again later.",429,60);
    }catch{return deny("AI security check temporarily unavailable.",503);}
  }
  return null;
}
export function secureResponse(response:Response, path:string):Response{
  const headers=new Headers(response.headers);
  headers.set("X-Content-Type-Options","nosniff");
  headers.set("Referrer-Policy","strict-origin-when-cross-origin");
  headers.set("X-Frame-Options","DENY");
  headers.set("Permissions-Policy","camera=(), geolocation=(), payment=(), usb=()");
  headers.set("Content-Security-Policy","frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  headers.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  // Never cache anything tied to user sessions, API responses, or auth redirects.
  if (path==="/"||path==="/admin"||path==="/login"||path.startsWith("/api/")){
    headers.set("Cache-Control","private, no-store, max-age=0");
    headers.set("CDN-Cache-Control","no-store");
    headers.set("Cloudflare-CDN-Cache-Control","no-store");
    headers.append("Vary","Cookie");
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
