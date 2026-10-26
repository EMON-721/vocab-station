# Vocab Station — Administrator Handbook

## Scope
Owner-only administration uses a **verified Google login** matching the Cloudflare Worker runtime variable \`ADMIN_EMAIL\`. It does not grant administration based on usernames, browser headers or learner-provided role fields. The same Google sign-in form serves everyone.

Admin workspaces appear under the signed-in user's **My profile → Administrator workspace**, with **Admin Dashboard** and **Admin Vocabulary** navigation. All writes are checked server-side before D1 persistence.

## Branding and public content
Admin Dashboard → **Site branding and editable content** lets the owner:
- Change the site title shown in the header, login-brand and footer
- Update the logo URL or upload a small PNG/JPEG/WEBP logo (limit 140 KB)
- Edit the tagline, homepage text, progress heading, daily vocabulary heading, practice title, mock heading, learning-day instructions, About text, footer caption
- Expand "Edit learning, practice and assessment button labels" for 29 editable labels including I know this, Needs review, Hear word, Hear sentence, mock and submit buttons
- Publish to D1 without changing the code or redeploying

All user-facing custom text is escaped by React. Existing learning data and Bengali vocabulary entries remain unchanged until deliberately edited.

## Learner profiles
In **Admin Dashboard → Administrator control desk**, select a learner and manage:
- Full name, username (unique and validated), school/institution name
- Learning start date, target exam date, 120/150/180-day plan, milestones
- Learner ID (read-only stable ID, never reassign casually)
- Ban, restore, soft-delete access, exam assignments, manual passes
- Correct, delete or review practice attempts; change word statuses; inspect assessment history
- Send global announcements and individual messages

**Per-learner schedule, permissions and words** includes summary details, dates, activity counts, learning day access (allow/lock/reset), manual day completion, individual exam pass overrides and per-learner word scheduling.

Day unlocks can bypass sequential daily progression for that learner. The test scheduler still enforces weekly exams unless the administrator assigns an individual exam. A locked day prevents new saving for that day.

## Daily words and learning
- Search the complete shared vocabulary by English word/Bangla meaning in **Admin Vocabulary**; page through all results
- Add, edit or delete words; the editor includes part of speech, Bengali/English meaning, articles, countability, CEFR/band information, pronunciation, accepted spellings, usage notes and bilingual example sentences
- Provide optional HTTPS audio links for a word or its first sentence; otherwise browser text-to-speech remains available
- Move one word to a chosen day, reset the assignment, exclude or restore it for an individual learner
- Bulk move up to **200** exact vocabulary words/IDs to a day, or exclude/restore them for an individual learner
- Mark learner words as mastered, review or reset, with practice answer corrections
- Add/edit/delete personal bilingual practice sentences associated with the learner and a word

Changes to shared vocabulary affect all learners on next reload. Changes to per-user schedules or exclusions affect only that learner.

## Mock tests and revision
In **Admin Dashboard → Weekly mock and revision policy** choose Weekly/Revision and its week to control:
- Assessment enabled/disabled
- Paper title
- Scored objective question count (5–60, subject to an adequate word/question pool)
- Time (60–7,200 seconds), pass mark (1–100%), writing count (0–2)
- Require all answers, and show/hide correct answers after submission

In **Admin Vocabulary → Mock question bank**, add/edit/delete week- and assessment-specific questions:
- MCQ, True/False, Fill in the blank, Short answer, Word meaning, Context/Cloze MCQ and Multiple correct answer
- Linked vocabulary, prompt, correct answer(s), selectable answer options
- Optional band/CEFR label, hint, explanation and required-answer flag
- Automatically generated questions fill the remaining configured slots
- An administrator can inspect the full answer bank and actual exam session papers in **Assessment solutions desk**

The pass mark is stored per attempt so future setting changes do not silently rewrite historical results. Admin may approve an individual already-taken Weekly/Revision result without fabricating a new score. A manual pass remains available for exceptional cases.

## Personal vocabulary, feedback and messages
- Learners can **request** a personal word, but it appears in their list only after admin approval
- Admin Dashboard → Personal vocabulary requests provides Approve/Reject
- In the administrator control desk, the owner may also directly create or edit a learner's personal vocabulary
- Learner contact messages appear in **Learner contact inbox**; send replies from the dashboard
- Practice results, mock history, learner activity, attendance-like progress and announcements remain in D1

## Guardrails and caveats
- Keep \`GOOGLE_CLIENT_SECRET\` only in a Cloudflare runtime Secret; no client-side tokens or source control credentials
- Set \`ADMIN_EMAIL\` to the exact verified Google identity used by the owner
- Keep \`DB\` binding pointing to \`vocab-station-db\`; do not delete the production database
- Back up D1 before bulk curriculum edits or mass deletion; they affect actual progress
- The app does **not** upload learner photos or store audio files in R2. Audio links use externally hosted HTTPS assets
- Existing Google identity, learner ID and D1 data are not automatically migrated between providers
- New Admin changes can be made in the UI without redeployment; new GitHub code commits trigger Cloudflare builds
- Use the GitHub Actions workflow \`.github/workflows/validate.yml\` to check TypeScript, vocabulary integrity, access controls and production builds

## Recommended acceptance checklist
1. Owner Google login opens Administrator workspace, while a regular user cannot access Admin routes.
2. Save a new site name and small logo; refresh login, header and footer to confirm.
3. Create learner profile with school, username and target date; verify learner ID remains stable.
4. Unlock Day 3 without completing Day 1, then lock Day 2; refresh the learner dashboard and verify available days.
5. Bulk move a word to Day 3 and remove/restore a word; verify daily totals change for that learner only.
6. Edit a Bengali meaning, pronunciation and sentence; verify on the learner page.
7. Set Week 1 to 34 questions and 20 minutes with 80% passing; run a sample attempt.
8. Write an MCQ, True/False, and required multi-answer question; verify learner paper and grading.
9. Disable answer visibility for a new attempt; ensure student feedback does not disclose the answer key.
10. Reject one personal-word request, approve another, send a learner reply and verify it arrives.
