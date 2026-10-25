# Setup and repository handoff

## GitHub

Repository: https://github.com/EMON-721/vocab-station

The full source snapshot is uploaded through the connected GitHub account. Repository visibility is private at the time of this handoff. Credentials and learner database records are not part of the source.

## Runtime configuration

- `DB`: Cloudflare D1 binding. Required tables are defined in `drizzle/0000_young_lockheed.sql` and `drizzle/0001_minor_albert_cleary.sql`.
- `LEARNING_ENABLED`: set to `true` to enable learner progress and assessments.
- `ADMIN_EMAIL`: the current implementation uses this server-only value to determine administrator access. No actual value is included. The owner requested that changes to this mechanism be deferred.
- R2 storage is not required by the current application.

Hosted authentication is supplied by Sites. This GitHub upload does not create Google OAuth or a portable production authentication service.

For portable loopback development only, visit `/signin-with-chatgpt?return_to=/` to use the starter's local simulated account. It is not production authentication.

## Source boundaries

The package includes all tracked application code, dataset files, migrations, tests, assets, lockfile and required build helpers. It excludes `.git`, dependencies, local credentials, `.wrangler`, `.sites-runtime`, `.next` and `dist`. User progress remains in the existing hosted database and is not included in this repository.
