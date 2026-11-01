# Vocab Station — public-source security checklist

**Repository visibility remains Private unless the owner changes it.** Making it public will reveal the full source and historical commits. Public source does not itself disclose D1 records, Google sessions, or Cloudflare runtime Secrets, but cannot guarantee immunity from attacks.

## Controls implemented in source
- Production Google OAuth authorization code with PKCE, short-lived OAuth state cookie, verified Google userinfo, and stable Google subject ID.
- Random, SHA-256 hashed D1 session identifiers; HttpOnly, Secure, host-only, SameSite=Lax cookies; new sessions expire in 7 days.
- Server-only admin authorization via verified Google email; optional \`ADMIN_GOOGLE_SUB\` pins the admin to one Google subject ID.
- CSRF and same-origin enforcement for API writes in the Worker ingress (Origin + Fetch Metadata + JSON content type).
- Defensive headers: CSP anti-framing/base restrictions, HSTS, X-Frame-Options, nosniff, Referrer-Policy and Permissions-Policy.
- No-store caching for personal pages and API responses.
- D1 atomic rate counters for AI assessment, per-user minute/day controls, global spending guard, OAuth start request limit.
- Gemini API key encrypted using AES-GCM when entered through Admin; a separate \`GEMINI_ENCRYPTION_KEY\` is recommended.
- Dependabot configuration, strict dependency audit in GitHub CI, security regression checks, current checkout and Git history secret-pattern scans.

## Owner-only production steps required before making GitHub public
1. **Do not paste API keys, OAuth secrets, Cloudflare tokens, or user data into GitHub or screenshots.**
2. Google Cloud → Auth Platform: keep OAuth client secret limited to Cloudflare runtime Secrets; use HTTPS exact callback URIs; protect Google owner account using passkey/2-Step Verification.
3. Cloudflare → Workers & Pages → vocab-station → Settings → Variables and Secrets:
   - \`GOOGLE_CLIENT_SECRET\` must be Secret, never normal plaintext deployment variable.
   - \`GEMINI_API_KEY\` should be Secret if used as a server environment key, or enter it in the protected Admin AI settings.
   - Add a **random 32+ byte** \`GEMINI_ENCRYPTION_KEY\` as Secret, different from Google OAuth client secret. If an older Gemini key was encrypted using Google OAuth client secret, remove and re-add the Gemini key in Admin AI settings to re-encrypt it with the dedicated key before rotating OAuth credentials.
   - \`ADMIN_EMAIL\` must match the owner's verified Google account.
   - Optional but strongly recommended: copy the stable Google subject from your own \`auth_sessions.user_id\` (strip the \`google:\` prefix) into \`ADMIN_GOOGLE_SUB\` as a Secret; this pins Admin to that one Google account. DO NOT use the email address or learner ID in this field.
   - \`SITE_ORIGIN\` must equal the public HTTPS Worker domain.
   - \`AI_DAILY_LIMIT\` can be set to 30 (default) or stricter for AI cost control.
4. Enable Cloudflare account 2FA and keep Deployment/API tokens scoped to minimum permissions; revoke old tokens; use a separate deploy token with the smallest scopes.
5. Enable Cloudflare WAF/bot controls and edge rate limiting for all endpoints, especially \`/api/auth/*\`, \`/api/sentence\`, \`/api/tests\`. D1 counters are an extra defense, not a DDoS-proof replacement for edge rate limiting. Review AI quotas/billing in Google AI Studio.
6. Set up automated D1 backups/restore procedure; test recovery before broad rollout, and use least-privileged collaborators for Cloudflare.
7. GitHub → Repository → Settings → Security / Advanced Security: enable Secret Scanning and Push Protection where available; enable CodeQL default setup when eligible; enable Dependabot security updates and alerts. Enable GitHub account 2FA/passkey.
8. GitHub → Settings → Rules / Rulesets: require Pull Requests, successful Vocab Station checks, and approval before changes to \`main\`, if your plan allows it. Disable force pushes; limit collaborators and GitHub App install scope. GitHub connector does not have repo administration permission to enable these switches.
9. Consider using GitHub private \`noreply\` commit emails to avoid public disclosure of the Git commit author email.
10. Rotate any secret ever committed, even if it was later deleted. Deleted secrets remain in Git history. If the historical scan reports a possible match, investigate privately before publishing; do not merely silence genuine leaks.

## Limits of assurances
- Neither passing CI nor a pattern-based scan is a full penetration test or proof of zero leaked credentials.
- This repository's security checks cannot see Cloudflare account permissions, Google account configuration, or all deployed runtime state.
- Public history is not automatically cleaned by deleting a file in a new commit.
- No actual secret value is required in GitHub. Changes to real credentials and account-level security require the owner.
