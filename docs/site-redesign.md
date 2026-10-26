# Site redesign: the light channel look (status file)

Owner brief (2026-10-25): make the site look like the LevlPrep YouTube and TikTok channels, but not in your face,
keeping a lighter look; every course gets its own cover art (never a reused video thumbnail); carry the same style to
every page; lay pages out from research and earlier owner decisions. Approved design: the canvas artifact
https://claude.ai/artifact/5fmnuUYa5ZodTEsagNPQg2 (top row: Home, Course page, Practice, Notes, Pricing, plus Home and
Practice at phone width). The full rationale and sources are in the Project doc `claude/levlprep-site-redesign.md`.

## System
- Page: the theme's paper colour with a faint 44 px grid. Headlines in Inter 800 to 900 (end of `assets/fonts/fonts.css`,
  family `'Inter Display'`), two-tone (ink, then `--accent`). One handwritten line in Kalam 700 in `--amber-text`
  (`#F2C14E` in dark). Body text stays Nunito. Buttons: channel navy `#0B1A33` (dark theme: teal `#2EE6D6`).
- Course covers: `assets/covers/<course key>.svg`, 640 x 320, background, grid, glow and the drawing; the two-tone
  title and handwritten line are HTML over it (`.cover`, `.cv-t`, colours per `[data-cover]`). Drawings: ambulance on
  an ECG line, benzene resonance, heart, cell, flask and beaker, block on a ramp (mg, N, f), tangent line with dy/dx,
  histogram with a normal curve, leaf with sun and water drop. Source: Project doc `claude/levlprep-redesign/covers.py`.

## Status
| Part | What | Status |
|---|---|---|
| 1 | Covers, display fonts, homepage (`index.html`; AP® cards and pricing from `scripts/build-pricing.mjs` `courseCard`) | PR #86 |
| 2 | Course home pages: cover banner over each hero (`scripts/lib/covers.mjs` `courseBanner`, styles in `assets/course/hub.css`) | PR #87 |
| 3 | Display headlines on every course page (`assets/course/base.css`), question card restyle (`study.css` section 8), cover per course on `premium.html` (`courseSection` in build-pricing) | PR #88 |

Merge order: #86, then #87, then part 3 (each stacked on the one before). #85 and #86 both edit the site budget line in
`scripts/check-weight.mjs`; whichever merges second keeps the higher number.
Not done yet: the course home layout changes from the canvas (Start here steps, practice by domain) are left for a
later pass; existing course homes already have practice, notes and Premium cards.

## Homepage decisions
- Keeps every generated block and script: from-video card, Continue card, hero facts (now a strip, hidden on phones),
  progress card, AP® cards, pricing, FAQ, structured data.
- The try-one question is plain HTML with a 300-byte script (no :has needed).
- Free-claims rule: say "free to start" / "notes free forever", never "no account needed".

## Round 2: every page (approved 2026-10-26)
Olivier saw parts 1 to 3 and said they still looked like the old site. He approved 27 new mockups (canvas rows
"Every page, 1 of 4" to "4 of 4", files `S01` to `S22`, in the design canvas linked at the top) and said "do all".
Six PRs, each stacked on `claude/redesign-study` (#88), built in parallel:

| Step | Branch | Owns (only edit these, plus new files) | Mockups |
|---|---|---|---|
| 1 Shared parts | `claude/redesign-r2-chrome` | `assets/theme.css` token values incl. dark, `assets/course/base.css`, `assets/site-chrome.js`, every `*/assets/*nav*.js`, footer | top bar, course tab bar, footer on all |
| 2 Course homes | `claude/redesign-r2-courses` | `assets/course/hub.css`, `hub.js`, course home builders, `nremt/index.html`, `ochem/index.html` | S01, S02 |
| 3 Practice and study | `claude/redesign-r2-study` | `assets/course/study.css`, `study.js`, each course's practice/exam/review/flashcard CSS and pages | S03 to S09 |
| 4 Progress | `claude/redesign-r2-progress` | dashboard pages and their CSS/JS | S10 |
| 5 Reading | `claude/redesign-r2-reading` | `book.css`, `glossary.css`, `lesson.css`, notes/learn/glossary/tools/FRQ pages and builders | S11 to S16 |
| 6 Site pages | `claude/redesign-r2-site` | `premium` section of build-pricing, `about`, `account`, `search`, `changelog`, `privacy`, `terms`, `404` | S17 to S22 |

Rules for every step: colors only through theme tokens (dark mode must work); display face `'Inter Display'` 900
for headlines, Kalam for the one hand line; no example data ships (real progress or nothing); copy rules from
`scripts/site-rules/`; no em dashes. The integration pass (after all six) bumps `sw.js`, writes the changelog entry,
and resolves `scripts/check-weight.mjs` budgets.
Open for Olivier: is "No human expert has reviewed it yet" on About still true; a photo for About (none ships until
he sends one).
