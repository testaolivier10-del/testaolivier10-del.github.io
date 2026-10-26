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
| 3 | Display headlines on every course page (`assets/course/base.css`), question card restyle (`study.css` section 8), cover per course on `premium.html` (`courseSection` in build-pricing) | PR open |

Merge order: #86, then #87, then part 3 (each stacked on the one before). #85 and #86 both edit the site budget line in
`scripts/check-weight.mjs`; whichever merges second keeps the higher number.
Not done yet: the course home layout changes from the canvas (Start here steps, practice by domain) are left for a
later pass; existing course homes already have practice, notes and Premium cards.

## Homepage decisions
- Keeps every generated block and script: from-video card, Continue card, hero facts (now a strip, hidden on phones),
  progress card, AP® cards, pricing, FAQ, structured data.
- The try-one question is plain HTML with a 300-byte script (no :has needed).
- Free-claims rule: say "free to start" / "notes free forever", never "no account needed".
