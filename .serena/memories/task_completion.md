# Before committing
1. Rerun every builder whose sources you touched (without `--check`), commit their output.
2. `node scripts/check-site.mjs`
3. `node --test scripts/test/*.test.mjs`
4. The `--check` form of relevant builders/checkers (full list in `.github/workflows/checks.yml`); for page additions also `build-og-tags.mjs --check` and `build-sitemap.mjs --check`.
5. If `sw.js` or cached assets change: bump `CACHE_NAME` in `sw.js`.
6. UI changes: `check-a11y.mjs --check` and `check-console.mjs --check` when Playwright is available.
