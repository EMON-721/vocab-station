# Security boundaries

- Never commit API keys, authentication cookies, personal environment values, database exports or learner records.
- Browser-delivered frontend code is visible to website visitors; secrets must remain on the server.
- Making the repository public exposes committed source code. It does not grant strangers write access or administrator privileges.
- Administrator authorisation is enforced on the server; hiding a button is not access control.
- The existing server-only ADMIN_EMAIL mechanism is preserved in this snapshot. Changing that mechanism is deferred at the owner's request.
- Limit repository collaborator write/admin permissions and production deployment access to trusted accounts.
- This file documents the boundaries; it does not claim branch protection has been configured.


- Account pages and API responses use private/no-store browser and CDN cache headers to prevent shared caching of profiles, results, contacts and admin settings.
- Gemini keys saved in the admin profile are encrypted in the production database, never returned by the settings API, and excluded from source exports. Learner records, contacts and exam attempts live in the production database, not the repository.
- Learners can access their own profile, practice and exam records. Administrator routes enforce the signed-in server role and cannot be unlocked by changing a browser field.
- A source scan of the current checkout is not a complete audit of every historical commit. Publishing a repository also publishes its retained commit history; do not publish credentials or database dumps in any commit.
