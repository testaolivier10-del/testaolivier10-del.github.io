# Tech stack
- Plain HTML/CSS/vanilla JS in the browser: no framework, no bundler, no runtime build step. All external scripts `defer`red; shared `<head>` modules run before page scripts.
- Hosting: GitHub Pages (Jekyll default, no `.nojekyll` → dotfiles not published).
- Tooling: Node ESM scripts (`.mjs`), CI on Node 20 (`.github/workflows/checks.yml`); no root package.json — scripts use only Node built-ins. Tests use `node --test` with `scripts/test/harness.mjs`.
- `scripts/anp-figures.py` (Python) for A&P figures.
- Backend: Cloudflare Worker in `worker/` (`wrangler.toml`), SQL in `scripts/sql/`.
- Offline: `sw.js` with `CACHE_NAME` (bump on change) + `STATIC_CACHE`.
