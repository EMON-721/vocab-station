import { env } from "cloudflare:workers";
import {
  OAUTH_COOKIE, SESSION_COOKIE, SESSION_SECONDS,
  cookieHeader, getCookie, randomToken, redirectResponse,
  safeReturnPath, sha256Hex, siteOrigin,
} from "../../../../google-auth";

type GoogleUserInfo = {
  sub?: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
};

function equalConstantTime(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

export async function GET(request: Request): Promise<Response> {
  const origin = siteOrigin(request);
  const clearPending = cookieHeader(OAUTH_COOKIE, "", 0);
  const fail = () => redirectResponse(origin + "/login?auth_error=sign_in_failed", [clearPending]);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const pending = getCookie(request.headers.get("Cookie"), OAUTH_COOKIE);
  if (!code || !state || !pending || !env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail();

  const parts = pending.split(".");
  if (parts.length !== 3 || !equalConstantTime(state, parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return fail();

  let returnTo = "/";
  try {
    const binary = atob(parts[2].replace(/-/g, "+").replace(/_/g, "/"));
    returnTo = safeReturnPath(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0))));
  } catch { return fail(); }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: origin + "/api/auth/google/callback",
        grant_type: "authorization_code", code_verifier: parts[1],
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail();
    const token = await tokenResponse.json() as { access_token?: string; token_type?: string };
    if (!token.access_token || token.token_type?.toLowerCase() !== "bearer") return fail();

    // The Google userinfo endpoint validates the bearer token and returns the
    // Google-issued stable subject ID and verified email address.
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: "Bearer " + token.access_token },
      cache: "no-store",
    });
    if (!profileResponse.ok) return fail();
    const profile = await profileResponse.json() as GoogleUserInfo;
    if (!profile.sub || !/^[a-zA-Z0-9_-]{1,255}$/.test(profile.sub) ||
        !profile.email || profile.email_verified !== true) return fail();

    const session = randomToken();
    const id = await sha256Hex(session);
    const now = Date.now();
    const userId = "google:" + profile.sub;
    const email = profile.email.toLowerCase();
    const name = (profile.name || "").trim().slice(0, 150);
    await env.DB.prepare(
      "INSERT INTO auth_sessions (id, user_id, email, display_name, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, email, name, now + SESSION_SECONDS * 1000, now).run();
    // No Google access/refresh token or profile image is stored.
    return redirectResponse(origin + returnTo, [
      clearPending,
      cookieHeader(SESSION_COOKIE, session, SESSION_SECONDS),
    ]);
  } catch {
    return fail();
  }
}
