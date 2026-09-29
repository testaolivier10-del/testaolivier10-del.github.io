# Commands (run from repo root)
- Link/JSON integrity: `node scripts/check-site.mjs`
- Unit tests: `node --test scripts/test/*.test.mjs`
- Any builder: `node scripts/build-<x>.mjs` writes; `--check` exits 1 if stale. Main ones:
  - A&P: `build-anp.mjs`, `check-anp-map.mjs --check`, `check-anp-content.mjs --check`
  - NREMT bank split: `build-question-bank.mjs`; tutor banks: `build-tutor-bank.mjs`
  - Ochem: `build-ochem-bank.mjs`, `build-notes-pages.mjs`, `build-ochem-home.mjs`, `build-lesson-meta.mjs`, `build-leads-to.mjs`, `build-tool-pages.mjs`, `build-ochem-figures.mjs`, `build-notes-figures.mjs`, `build-flashcards.mjs`, `check-curriculum.mjs --check`
  - Site-wide: `build-og-tags.mjs`, `build-sitemap.mjs` (needs full git history), `check-weight.mjs --check`
  - Worker: `build-worker.mjs`
- Browser checks (need Playwright/axe; Chromium at /opt/pw-browsers): `check-a11y.mjs --check`, `check-console.mjs --check`.
