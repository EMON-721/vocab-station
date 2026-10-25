# Vocab Station

For study purposes.

English vocabulary learning with Bengali meanings, example sentences, typing practice, personal sentence feedback, weekly mocks and required revision checkpoints.

## Current features

- 4,081 vocabulary entries with English practice sentences, including 563 unique additions from the owner-provided PDF.
- 120, 150 and 180-day learning plans; 34–35 words/day on the 120-day plan.
- Sequential daily completion and 90% weekly pass requirement.
- 30 scored questions and two separate writing tasks; 15-minute assessments.
- Required revision after every two weekly mocks.
- A sample mock; unanswered questions can be submitted; persisted results can be retrieved by retry without duplicate attempts.
- Local Hunspell spelling and supported grammar-rule feedback with highlighted issues and suggestions. This is not a full AI or semantic evaluator.
- Persistent learner profiles, unique usernames/IDs, private progress/history and personal vocabulary.
- Administrator workspace for vocabulary, learners, assessments and messages.

## Stack and hosting

React 19, TypeScript, Vinext/Vite, Cloudflare Workers and D1. This snapshot is the actual Sites-hosted implementation. It is **not a standard Next.js/Vercel deployment**. Moving it to Vercel/Supabase would require a separate migration of authentication, database access and hosting configuration.

The original Sites project identity is retained in `.openai/hosting.json`; this identifier is not a secret. Uploading this repository to GitHub does not transfer or deploy the hosted database.

## Local development

Prerequisites: Node.js >=22.13 and the package manager version in `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

On ordinary local checkouts the project uses the portable runtime profile. Use the URL printed by the development server. Local sign-in simulation is documented in `SETUP.md`; production sign-in is supplied by Sites.

```sh
pnpm build
```

## Verification

```sh
node node_modules/typescript/bin/tsc --noEmit
node scripts/check-vocabulary.mjs
node scripts/check-sentence-evaluator.mjs
node scripts/check-assessment-v3.mjs
node scripts/check-access.mjs
```

These checks cover curriculum integrity, duplicate rejection, stable original day assignments, access control, sentence feedback, 90% gates, required revisions, blank submissions and retry recovery. They use in-memory test records and do not alter production learner history.

## Data and privacy

Runtime credentials, environment values, user records, database exports, build output and dependencies are excluded from this source package. Configure runtime bindings separately. Existing email-based administrator logic is preserved at the owner's request and was not changed as part of this GitHub export.

## Content and licences

Source attribution for existing example content is in `public/example-credits.txt`. Dictionary licence information is in `app/vendor/en-gb-license.txt`. The PDF audit records source-entry mapping without embedding the uploaded PDF or its images. This project has no blanket public content licence; retain third-party notices and obtain rights before redistributing content publicly.

See `SETUP.md` for configuration and `SOURCE_SNAPSHOT.json` for the source commit.

## Repository access and public release

Private visibility restricts source access to authorised accounts. If this repository becomes public, its committed source code can be read and copied; public visibility does not hide code. Public visitors do not gain permission to push changes to this repository or administer the live application. Only explicitly authorised collaborators can write to GitHub, and the deployed server separately checks administrator access. Keep tokens, runtime environment values and user database records outside Git. Review collaborators, branch rules and deployment credentials before making the repository public.

No branch-protection or repository permission setting is created by this README. Repository access controls must be configured in GitHub Settings.
