# Google AI Studio assessment

## Connect your key

1. Deploy the latest `main` source to the existing Vocab Station Cloudflare Worker, keeping the existing D1 database and Google login secrets.
2. Sign in with the existing administrator Google account. Open **Profile → Administrator workspace → Google AI Studio · Gemini assessment**.
3. Paste your Google AI Studio key into the password field, select a Gemini model ID available to your Google project, enable AI assessment, and choose **Save AI connection**.
4. Choose **Test connection**. This makes one short, billable test request. A successful response confirms authentication, model access and structured assessment output.

Never paste the key into chat, commit it to GitHub, or put it in a public/client environment variable.

## Storage

The saved key is AES-GCM encrypted in a separate private D1 record. Encryption uses the server-only `GEMINI_ENCRYPTION_KEY` secret, or the existing `GOOGLE_CLIENT_SECRET` as a fallback. Prefer a dedicated random encryption secret. If the encryption secret changes, reconnect the saved Gemini key. No database migration is required.

Alternatively set the Worker secret `GEMINI_API_KEY`. An encrypted profile key takes precedence over an environment key; removing a UI key does not remove a Worker secret. Settings endpoints require administrator access and never return the key or encrypted record.

## Exams and scoring

Standard new papers contain 30 objective questions and 5 AI-scored original-sentence questions. Each question is worth one mark. Writing receives partial credit in quarter-mark increments, based on grammar/spelling, correct vocabulary use and coherent meaning. The default 90% requirement is 31.5/35. Sample mocks never unlock stages. Required revision checkpoints remain in place.

Previously opened legacy papers retain their original objective-only scoring. Existing results are not regraded.

Unanswered writing receives zero marks. Non-empty writing is assessed by Gemini before finalisation. If Google returns a quota error, timeout or malformed data, no final result or unlock is created. The first valid submission is preserved; retry uses those same answers. It can complete for up to 24 hours after the initial submission, even if the answering timer has elapsed. A saved result is returned idempotently on further retries.

## Sentence practice

Select **Use Gemini AI assessment**, then enter 1–4 sentences with one sentence per line. Keep the vocabulary target enabled to assess its usage, or turn it off for general sentence feedback. Local spelling/rule checks remain available when AI is not selected.

The interface discloses that requested AI assessment sends the learner's sentence and vocabulary reference to Google. Feedback includes rubric scores, explanations, highlighted supported excerpts and a suggested correction. AI assessment can be mistaken and is not an official IELTS score.

## Validation

Run `node scripts/check-gemini-assessment.mjs` for deterministic provider fixtures covering encrypted key storage, access control, the 35-question total, the 90% boundary, missing writing, malformed/provider failures, frozen-answer retry and duplicate-result prevention. These fixtures use no real API key. Typecheck, existing regression tests and production build are separate checks. A real owner key and the administrator Test connection action are still required to verify the production Google connection.

## Unavailable model (404)

The administrator can load available Google models with the saved key and select one without exposing the key. Connection verification tests structured sentence assessment, not merely model listing. When the selected model returns 404, an explicit connection test checks up to three listed text-model alternatives and saves a replacement only after successful assessment. Other provider failures (including quota and permissions) stop recovery and are reported. Exam submissions use the saved model and never silently change models.
