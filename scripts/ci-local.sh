#!/bin/bash
# Runs every job in .github/workflows/checks.yml locally, independent checks in
# parallel. BROWSER=1 adds check-a11y and check-console (needs playwright +
# axe-core: `npm i --no-save playwright@1.49.1 axe-core@4.10.2`).
# Usage: [BROWSER=1] scripts/ci-local.sh [repo-dir]
cd "${1:-$(dirname "$0")/..}"
export CHROMIUM_PATH=${CHROMIUM_PATH:-/opt/pw-browsers/chromium}
# Random ports so parallel runs (several worktrees) do not collide.
export CHECK_A11Y_PORT=$((20000 + RANDOM % 20000)) CHECK_CONSOLE_PORT=$((40000 + RANDOM % 20000))
LOG=$(mktemp -d)
cmds=("node scripts/check-site.mjs" "node --test scripts/test/*.test.mjs")
for s in build-og-tags build-sitemap build-notes-pages build-ochem-glossary check-curriculum \
         check-anp-map build-anp check-anp-content build-ochem-home build-lesson-meta build-leads-to \
         build-tool-pages build-nremt-notes-toc build-ochem-figures build-notes-figures build-flashcards \
         build-nremt-flashcards build-question-bank build-ochem-bank build-worker check-weight; do
  cmds+=("node scripts/$s.mjs --check")
done
[ "$BROWSER" = 1 ] && cmds+=("node scripts/check-a11y.mjs --check" "node scripts/check-console.mjs --check")
i=0; pids=()
for c in "${cmds[@]}"; do
  ( bash -c "$c" > "$LOG/$i.log" 2>&1; echo $? > "$LOG/$i.rc" ) &
  pids+=($!); i=$((i+1))
  # cap concurrency at the core count
  while [ "$(jobs -rp | wc -l)" -ge "$(nproc)" ]; do sleep 0.5; done
done
wait
fail=0
for j in $(seq 0 $((i-1))); do
  if [ "$(cat "$LOG/$j.rc")" != 0 ]; then echo "FAIL: ${cmds[$j]}"; tail -20 "$LOG/$j.log"; fail=1; fi
done
# The tutor banks have no --check mode: rebuild and diff (after the others, since it writes).
node scripts/build-tutor-bank.mjs >/dev/null 2>&1
git diff --quiet -- nremt/assets/tutor-bank.json ochem/assets/tutor-bank.json || { echo "FAIL: tutor banks stale"; fail=1; }
rm -rf "$LOG"
[ $fail = 0 ] && echo "ALL PASS"
exit $fail
