# Vocab Station — Google login on Cloudflare Workers

## Deployment status and requirements

The app uses Next.js/Vinext on Cloudflare Workers with the D1 database binding named DB.
ChatGPT Sites sign-in has been removed. This is a portable **Google OAuth authorization-code
flow with PKCE** and a D1-backed session stored in a host-only, HttpOnly, Secure cookie.

No photo, Google access token, refresh token or password is stored. The stable Google
subject ID identifies the learner, and sessions are stored as SHA-256 hashes.

## 1. Google Cloud Console (owner action)

1. Open https://console.cloud.google.com/auth/overview and create/select a Google Cloud project.
2. In Google Auth Platform, fill in Branding and Audience. Choose **External** for regular Google users.
   In Testing mode add your Google account under **Test users**.
3. In **Clients > Create Client** select **Web application** and name it Vocab Station.
4. Add Authorized redirect URI **exactly**:
   https://vocab-station.emon721.workers.dev/api/auth/google/callback
5. Save and copy the Google **Client ID** and **Client Secret**. Never place the secret in GitHub.
6. When opening sign-in to everyone, configure the Audience/Publishing status accordingly.

Authorized JavaScript origins are not needed for this server-side redirect flow.
Google requires the exact redirect URI, including https and callback path.

## 2. Cloudflare Workers variables (owner action)

Cloudflare Dashboard > Workers & Pages > vocab-station > Settings > Variables and Secrets.
Add these runtime variables (not only GitHub build-time variables):

  GOOGLE_CLIENT_ID         [Google Client ID]           (text)
  GOOGLE_CLIENT_SECRET     [Google Client Secret]       (**Secret**)
  SITE_ORIGIN              https://vocab-station.emon721.workers.dev (text)
  ADMIN_EMAIL              [your verified Google email] (text)
  LEARNING_ENABLED         true                         (text)

The DB binding must point to your existing vocab-station-db D1 database.
Do not create a second D1 database or change the binding name DB.

## 3. D1 setup (required once)

Cloudflare Dashboard > Storage & databases > D1 > vocab-station-db > Console.
Run the SQL migrations in drizzle/0000_young_lockheed.sql,
drizzle/0001_minor_albert_cleary.sql, and drizzle/0002_google_auth_sessions.sql
in ascending order (if not previously run). They are idempotent for these new tables.
To initialize all three tables at once, run:

  CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY NOT NULL, student_id TEXT NOT NULL, username TEXT NOT NULL);
  CREATE UNIQUE INDEX IF NOT EXISTS accounts_student_id_unique ON accounts(student_id);
  CREATE UNIQUE INDEX IF NOT EXISTS accounts_username_unique ON accounts(username);
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions(user_id);
  CREATE INDEX IF NOT EXISTS auth_sessions_expiry_idx ON auth_sessions(expires_at);

## 4. Production verification

1. Deploy latest GitHub main through Cloudflare.
2. Visit /login, click Continue with Google, pick your approved Google account.
3. You should land on / with your profile and a unique learner username/ID.
4. Verify profile save persists after logout and login.
5. Verify ADMIN_EMAIL (and only it) can see /admin; regular learners cannot.
6. Check mobile sign-in and sign-out, and D1 reads/writes.

Until variables and the database tables are ready, sign-in deliberately fails closed.
If the app is in Google OAuth Testing mode, only configured test users can sign in.
Google's External production audience may require published app details.

## Security and data

- The server never trusts oai-authenticated-user-* request headers.
- Short-lived OAuth state + PKCE, verified Google userinfo, server-held Google client secret.
- Google account ID (sub) is the stable identity; verified email is used only for display/admin authorization.
- Session tokens are random, their hashes stored in D1; cookies are Secure, HttpOnly and SameSite=Lax.
- Log-out deletes the D1 session. Old login cookies cannot authenticate.
- Changing SITE_ORIGIN or custom domains requires updating Google's exact redirect URI.
- Existing Sites-hosted learner data is **not** automatically migrated to Cloudflare D1.

Admin tools and all learner learning features are preserved. This update does not implement
additional administrator controls; changes can be made later.
