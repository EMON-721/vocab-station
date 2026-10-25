# Security boundaries

- Never commit API keys, authentication cookies, personal environment values, database exports or learner records.
- Browser-delivered frontend code is visible to website visitors; secrets must remain on the server.
- Making the repository public exposes committed source code. It does not grant strangers write access or administrator privileges.
- Administrator authorisation is enforced on the server; hiding a button is not access control.
- The existing server-only ADMIN_EMAIL mechanism is preserved in this snapshot. Changing that mechanism is deferred at the owner's request.
- Limit repository collaborator write/admin permissions and production deployment access to trusted accounts.
- This file documents the boundaries; it does not claim branch protection has been configured.
