import { env } from "cloudflare:workers";
import {
  SESSION_COOKIE, cookieHeader, getCookie, redirectResponse,
  safeReturnPath, sha256Hex, siteOrigin,
} from "../../../google-auth";

async function signOut(request: Request): Promise<Response> {
  const origin = siteOrigin(request);
  const token = getCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (token && /^[A-Za-z0-9_-]{43}$/.test(token) && env.DB) {
    try {
      await env.DB.prepare("DELETE FROM auth_sessions WHERE id = ?")
        .bind(await sha256Hex(token)).run();
    } catch { /* Clear the browser cookie even when D1 is temporarily unavailable. */ }
  }
  const returnTo = safeReturnPath(new URL(request.url).searchParams.get("return_to") || "/login");
  return redirectResponse(origin + returnTo, [cookieHeader(SESSION_COOKIE, "", 0)]);
}
export const GET = signOut;
export const POST = signOut;
