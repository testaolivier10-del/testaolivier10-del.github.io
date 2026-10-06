#!/bin/bash
# Runs every job in .github/workflows/checks.yml locally, in one go.
# BROWSER=1 adds check-a11y and check-console (needs playwright + axe-core
# installed with `npm ci --ignore-scripts`, from package.json).
# Usage: [BROWSER=1] scripts/ci-local.sh [repo-dir]
cd "${1:-$(dirname "$0")/..}"
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium}
fail=0
run() { out=$("$@" 2>&1) || { echo "FAIL: $*"; echo "$out" | tail -20; fail=1; }; }
run node scripts/check-site.mjs
for s in build-og-tags build-sitemap build-notes-pages build-ochem-glossary build-nremt-glossary check-curriculum \
         check-anp-map build-anp check-anp-content check-apbio-map build-apbio check-apbio-content check-apchem-map build-apchem check-apchem-content build-ochem-home build-lesson-meta build-leads-to build-crumbs \
         build-tool-pages build-nremt-notes-toc build-ochem-figures build-notes-figures build-flashcards \
         build-nremt-flashcards build-question-bank build-ochem-bank build-worker build-site-config build-courses check-courses build-pricing check-weight; do
  run node "scripts/$s.mjs" --check
done
node scripts/build-tutor-bank.mjs >/dev/null 2>&1
git diff --quiet -- nremt/assets/tutor-bank.json ochem/assets/tutor-bank.json || { echo "FAIL: tutor banks stale"; fail=1; }
run node --test scripts/test/*.test.mjs
if [ "$BROWSER" = 1 ]; then
  # Random ports so parallel runs (several worktrees) do not collide.
  export CHECK_A11Y_PORT=$((20000 + RANDOM % 20000)) CHECK_CONSOLE_PORT=$((40000 + RANDOM % 20000))
  run node scripts/check-a11y.mjs --check
  run node scripts/check-console.mjs --check
fi
[ $fail = 0 ] && echo "ALL PASS"
exit $fail
