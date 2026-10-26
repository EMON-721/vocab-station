# Setup and repository handoff

## GitHub

Repository: https://github.com/EMON-721/vocab-station

The full source snapshot is uploaded through the connected GitHub account. Repository visibility is private at the time of this handoff. Credentials and learner database records are not part of the source.

## Runtime configuration

- `DB`: Cloudflare D1 binding. Required tables are defined in `drizzle/0000_young_lockheed.sql` and `drizzle/0001_minor_albert_cleary.sql`.
- `LEARNING_ENABLED`: set to `true` to enable learner progress and assessments.
- `ADMIN_EMAIL`: the current implementation uses this server-only value to determine administrator access. No actual value is included. The owner requested that changes to this mechanism be deferred.
- R2 storage is not required by the current application.

Production Google OAuth sign-in and D1 sessions are now implemented. See GOOGLE_LOGIN_SETUP.md for the required Google Cloud credentials, Cloudflare secrets and auth_sessions migration. Existing Sites-hosted user records are not migrated automatically.

Portable local development now requires separately configured Google OAuth credentials and a matching authorized callback URI. The old Sites simulated login is no longer accepted.

## Source boundaries

The package includes all tracked application code, dataset files, migrations, tests, assets, lockfile and required build helpers. It excludes `.git`, dependencies, local credentials, `.wrangler`, `.sites-runtime`, `.next` and `dist`. User progress remains in the existing hosted database and is not included in this repository.
