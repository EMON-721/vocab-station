import { env } from "cloudflare:workers";
import {
  OAUTH_COOKIE, base64url, cookieHeader, randomToken, redirectResponse,
  safeReturnPath, sha256Base64url, siteOrigin,
} from "../../../google-auth";

// Authorization code + PKCE, with a short-lived host-only HttpOnly state cookie.
export async function GET(request: Request): Promise<Response> {
  const origin = siteOrigin(request);
  if (!env.DB || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return redirectResponse(origin + "/login?auth_error=not_configured");
  }

  const returnTo = safeReturnPath(new URL(request.url).searchParams.get("return_to"));
  const state = randomToken();
  const verifier = randomToken();
  const challenge = await sha256Base64url(verifier);
  const returnToEncoded = base64url(new TextEncoder().encode(returnTo));
  const pending = state + "." + verifier + "." + returnToEncoded;
  const redirectUri = origin + "/api/auth/google/callback";

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return redirectResponse(url.toString(), [cookieHeader(OAUTH_COOKIE, pending, 10 * 60)]);
}
