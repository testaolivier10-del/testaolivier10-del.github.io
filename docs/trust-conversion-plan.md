# Trust and conversion plan (2026-10-08)

Status file for making LevlPrep trusted and turning visitors into buyers. Read this, not the chat history.

## Where we are (Supabase, 2026-09-24 to 2026-10-08)

| Step | Count |
|---|---|
| Page views, all courses | ~6,700 (includes owner testing and bots) |
| Accounts, ever | 4 (1 since Oct 1) |
| Premium gate shown | 644 |
| Clicked "interest" | 10 |
| Checkout started | 4 |
| Paid | 0 (no AP® Biology or AP® Chemistry pass ever bought, not even a test) |

Leaks, biggest first: checkout (4 → 0), signup (6,700 → 4), gate (644 → 10).

## Owner facts (given 2026-10-08; use these, invent nothing)

- Name: **Olivier Testa**, shown in full. No photo yet.
- EMT; passed the NREMT, and the exam shut off at 70 questions, studying with LevlPrep.
- UC San Diego pre-med.
- Why: tired of textbooks that just throw information at you; wanted interactive lessons that actually build
  on each other.
- Link the LevlPrep TikTok and YouTube. **URLs still needed from the owner.**
- Not anonymous any more: reverses PR #45 (`claude/anonymize-operator`).

Wording rule (FTC): the NREMT story is the founder's own result. Say it as that ("I passed…"), never as
typical ("students pass…").

## Plan and status (owner decisions 2026-10-08)

| # | Item | Status |
|---|---|---|
| 1 | Founder named again (reverts #45): privacy, terms (dated 8 Oct), LICENSE, schema `founder` | **done** |
| 2 | `about.html` + About link in every footer and footer generator; Sources "who makes this" names the founder | **done** |
| 3 | Founder line + refund line next to the buy button in the Premium dialog | **on hold** (owner unsure) |
| 4 | NREMT home: "Made by Olivier Testa, an EMT who studied with this course and passed…" (`.hero-founder`) | **done** |
| 5 | "Ask a parent to pay" link | **dropped** (owner: teens buy online themselves; terms keep the parent-permission rule, which is Polar's) |
| 6 | Paywall shows the student's score: daily-limit card says "You got X of Y right today" (`noteAnswer`/`todayScore` in `assets/premium.js`, called from every course's answer check) | **done** |
| 7 | Account prompt after a finished session: account.js `promptToSave` (already in NREMT and ochem) now also after AP® Bio, AP® Chem and A&P practice sets (8+) and exams (10+) | **done** |
| 8 | Email capture with a free cram sheet | waiting on `POSTAL_ADDRESS` (CAN-SPAM) |
| 9 | Video tags: `?ref=tt-<topic>` / `yt-` / `ig-` accepted by `assets/analytics.js`, reported on `ref-open` and `visit` in Umami | **done** |
| 10 | `premium.html`: "$25 to $49, about one or two hours with a private tutor" (Care.com ~$26/h, `TUTOR_HOUR` in `scripts/build-pricing.mjs`) + 7-day refund line | **done** |

Not done yet:
- TikTok and YouTube links on the About page: their sites are blocked from the build container and a web search
  found nothing, so the owner must paste the URLs.

How to tag video links: `https://levlprep.com/ochem/lessons/<topic>.html?ref=tt-sn2` (lowercase letters, digits and
hyphens after `tt-`, `yt-` or `ig-`, up to 40 characters). Umami → Events → `ref-open` → filter by `ref`.

### Owner only
- Test-buy `bio-2027` and `chem-2027` with a 100% code, then refund (rules out a broken checkout). Check Polar
  for abandoned/failed checkouts on the 4 starts.
- Residence: Minnesota (living in California for school), so the Minnesota assumed-name filing stands. Ask a tax
  preparer whether income from work done while in California counts as California-source income.
- Later: real student quotes with permission; a teacher/clinical reviewer to name on the About page.

## Progress log

- 2026-10-08: plan written; items 1, 2, 4, 6, 7, 9, 10 built, full CI green (with browser checks).
