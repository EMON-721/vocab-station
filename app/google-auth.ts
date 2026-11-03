import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Google account IDs, not email addresses, are the stable user identifiers.
export type SignedInUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export const SESSION_COOKIE = "__Host-vs_session";
export const OAUTH_COOKIE = "__Host-vs_oauth";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function safeReturnPath(value: string | null | undefined): string {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local" || url.pathname.startsWith("/api/auth/")) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export function googleSignInPath(returnTo = "/"): string {
  return "/api/auth/google?return_to=" + encodeURIComponent(safeReturnPath(returnTo));
}

export function googleSignOutPath(returnTo = "/login"): string {
  return "/api/auth/logout?return_to=" + encodeURIComponent(safeReturnPath(returnTo));
}

export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64url(bytes);
}

export function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256Base64url(value: string): Promise<string> {
  return base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function getCookie(header: string | null, name: string): string | null {
  for (const piece of (header || "").split(";")) {
    const cookie = piece.trim();
    if (cookie.startsWith(name + "=")) return cookie.slice(name.length + 1);
  }
  return null;
}

export function cookieHeader(name: string, value: string, maxAge: number): string {
  return name + "=" + value + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + maxAge;
}

export function siteOrigin(request: Request): string {
  const origin = (env.SITE_ORIGIN || new URL(request.url).origin).replace(/\/$/, "");
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.origin !== origin) throw Error("Invalid site origin");
  return origin;
}

export function redirectResponse(url: string, cookiesToSet: string[] = []): Response {
  const headers = new Headers({ Location: url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  for (const cookie of cookiesToSet) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function getSignedInUser(): Promise<SignedInUser | null> {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session || !/^[a-zA-Z0-9_-]{43}$/.test(session) || !env.DB) return null;
  try {
    const id = await sha256Hex(session);
    const row = await env.DB.prepare(
      "SELECT user_id, email, display_name FROM auth_sessions WHERE id = ? AND expires_at > ? AND created_at > ?"
    ).bind(id, Date.now(), Date.now() - SESSION_SECONDS * 1000).first<{ user_id: string; email: string; display_name: string }>();
    if (!row) return null;
    return {
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name || row.email,
      fullName: row.display_name || null,
    };
  } catch {
    // Never trust caller-provided identity headers or allow a broken DB to grant access.
    return null;
  }
}

export async function requireSignedInUser(returnTo: string): Promise<SignedInUser> {
  const user = await getSignedInUser();
  if (!user) redirect("/login?return_to=" + encodeURIComponent(safeReturnPath(returnTo)));
  return user;
}
