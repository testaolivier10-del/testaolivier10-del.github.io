# Tool fixes build: brief for builders (2026-11-10)

Owner (2026-11-10), after reading the review totals: "Go ahead and do all of this." Read first:
`docs/tool-visuals-2026-11.md` (his words and the test), `docs/tool-review/README.md` (build order), your course's
`docs/tool-review/<course>.md` (what to do, tool by tool) and the course's section of `CLAUDE.md` with the files it
names. The NREMT body map is the quality bar.

## Your job
Do everything your course's review file lists for the tools you were given: bugs first, then accuracy flags, then
fixes, then redesigns. Do not touch tools marked LEAVE. Keep every function, every data key, URL and saved-progress
key; nothing a student can do today may disappear.

- Accuracy flags: verify against a reliable source (web search, OpenStax, the course's own notes) BEFORE changing.
  If the tool is right, leave it and say so. If contested, record it in the course's needs-author file.
- Redesigns: the picture must BE the idea (see the Human Geography examples in the status file). Real drawn
  things, not boxes; reacts to the controls; simple on landing; nothing clipped or overlapping; readable and usable
  at 390 px; dark mode as polished as light; reduced motion shows the end state.
- Look at your work: screenshot before and after at 1280x800 and 390x844 (how: `docs/tool-review/BRIEF.md`; use
  your OWN port and your own scratch folder), read the screenshots, and iterate until you would put it beside the
  body map. Save one before/after pair per changed tool as `/home/claude/shots/build/<course>/<tool>_before.png`
  and `_after.png` (desktop) plus `_after_p.png` (phone).

## Rules
- Work ONLY in the git worktree and branch you were given. Other builders work in sibling worktrees: never touch
  them or the main checkout.
- Do not edit `sw.js`, `CLAUDE.md`, `docs/tool-review/README.md` or `docs/tool-visuals-2026-11.md` (the lead does).
  Do not edit shared files (`assets/course/*`, `assets/*.js|css`) unless your task says you own that change.
- Run your course's build and checks until clean (its `scripts/build-*.mjs --check`, `check-*` scripts,
  `node --test scripts/test/<course prefix>*`, and `node scripts/check-site.mjs`). Forked courses: keep the parent
  byte-identical where CLAUDE.md says so.
- Commit in your worktree with
  `git -c user.name="LevlPrep automation" -c user.email="noreply@levlprep.com" commit`, messages ending:
      Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
      Claude-Session: https://claude.ai/code/session_011LrYU9Ud14kuBawB478Zqc
  One commit per tool. Do NOT push, do not open a pull request, do not merge.
- No em dashes in user-facing text. Plain words.
- Write `docs/tool-review/done/<your task name>.md`: per tool, what changed, what you verified, anything left
  undone and why. Commit it.

Final reply to the lead, under 15 lines: tools changed, accuracy flags and their outcome, checks and tests status,
anything not done.
