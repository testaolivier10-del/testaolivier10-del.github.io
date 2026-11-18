# Tools v2: brief for every builder and reviewer

Owner decisions (2026-11-17 and 11-18): every one of the 145 tools is rebuilt to `docs/tools-v2-standard.md`.
The owner does not look at each tool. Nothing merges to `main` until all tools are done: everything collects on
the branch `claude/tools-v2-all`, which is merged once at the end. Similar tools stay separate (more tools, each
more specific). Nothing a tool could do is silently dropped.

## Builder

Setup: `cd /home/claude/testaolivier10-del.github.io && git fetch origin claude/tools-v2-all && git worktree add
/home/claude/wt-<tool> -B claude/tools-v2-<tool> origin/claude/tools-v2-all` (retry after 10 s on a lock).
Commit and push early and often: the session restarts and uncommitted work can be lost.

Read first: `CLAUDE.md`, `docs/tools-v2-standard.md` (15 rules, the test, the process), the course spec and
architecture doc, the tool's line in `docs/tools-v2-rollout.md`, and two worked examples with every owner and
review round: `docs/tools-v2-water-pollution-brief.md`, `docs/tools-v2-osmosis-brief.md`. Read
`docs/tool-visuals-2026-11.md`. Never read question bank or lesson JSON in full.

1. Research (rule 10): actually open or fetch how the best existing tools do this exact job; say in the brief
   which you saw and which only as text. Check the science against the course's source; contested points go in
   the course's needs-author doc.
2. Write `docs/tools-v2-<tool>-brief.md`: the one main idea per screen, the main control, what is on screen
   (counted), Explore vs Test yourself, and "Decisions made for the owner" (also one line each appended to
   `docs/tools-v2-owner-log.md`). Anything the old tool did that Explore no longer does moves to Test yourself,
   "?" or a later separate tool, and is listed.
3. Build with `assets/course/tool-kit2.js` through the course's adapter (`"kit2": true`; add the adapter to the
   course kit if it has none, small, never fork the kit; other tools of the course unchanged). Explore: free
   play, the picture is the biggest thing and is a drawn scene at flagship level using the full stage, the main
   control on the picture, one cue, instant visible result, every change of state animated, a short colored
   cause line, purpose line, 1 to 3 word labels, no side panel. Labels, picture and cause line agree on every
   frame; labels wait for the picture. One control never moves another. Test yourself keeps every existing
   question, drill and record id. Deep links keep working.
4. Lessons already learned, do these the first time:
   - The cause line fits two rows at 360 px (the kit reserves two rows on phones).
   - Nothing is clipped by the stage and no labels overlap at any width.
   - Result words appear only when the picture shows the result; no flashes on the first frame of a change.
   - No dashed "ghost" shapes that can be read as real parts; a small "before" tick on the control is enough.
   - Irreversible states (burst, broken, dead) do not heal on a drag back; a new one comes in, shown.
   - Particles and drawn things stay inside what contains them.
   - On a phone, a run started below the picture scrolls the picture into view.
   - The first visit cue never covers a label or number.
   - Reduced motion gets a short cross fade and the full result at once.
   - Do not edit `scripts/check-tool-use.mjs` (its samples are fixed so branches never conflict); to check your tool
     reports frame v2, run it with a local copy of the list. Do not redefine the kit's phone cause line height.
   - Run long sweeps one width per process (one process for all ten widths can pass ten minutes).
5. Keep a sweep test in the repo, `scripts/tools-v2/<tool>-sweep.mjs` (copy the pattern of the first one in
   that folder if present): every preset or landmark state at widths 360, 390, 430, 600, 768, 820, 1024, 1280,
   1440, 1920; assert nothing clipped, no label overlap, the acted-on object is the largest thing, cause line at
   most two rows on phones with constant height, no sideways scroll. Fix until clean; look at the contact sheet.
6. Verify: the course's unit tests, content check and build `--check`; `check-site`; `check-weight`;
   `build-apcalc --check` and `build-apmacro --check` after any shared change; `scripts/check-tool-use.mjs`
   (a rebuilt tool reports frame v2). Playwright at 390, 768, 1440, light and dark (executablePath
   `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, `python3 -m http.server` on a free port 8800 to 8999,
   block service workers; a Premium tool is unlocked in tests only by routing `assets/premium.js` and replacing
   `function has(course) {` with `function has(course) { return true;`, never committed): pointer and real touch
   drag, keyboard, reduced motion, frames during every animation, Test yourself right and wrong answers, the real
   locked or free state unchanged, no console errors. Compare your shots side by side with
   `/mnt/user-data/outputs/wp-v2/shots/` and `/mnt/user-data/outputs/osmosis-v2/shots/`.
7. Preview: `node scripts/tool-preview.mjs <page> /mnt/user-data/outputs/<tool>-v2/index.html`; shots in
   `/mnt/user-data/outputs/<tool>-v2/shots/` including mid animation frames.
8. Push the branch. Do NOT merge and do not open a PR to main. Stop your local server. Report briefly: branch
   and head, what is on screen in Explore (counted), decisions made for the owner, the sweep counts, what you are
   not happy with.

Commit messages end with

    Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
    Claude-Session: https://claude.ai/code/session_011LrYU6oPHBYNE4ERGyPxWg

No em dashes or hyphens as punctuation in user facing copy.

## Reviewer

You did not build it; you are the gate and can block. Review only: never edit the builder's worktree. Read the
standard and the tool's brief. Use the tool like a student who reads almost nothing, with your own Playwright
frames at 360, 390, 768, 1024 and 1440, light and dark, including frames during every animation, fast and
reversed drags, real touch drag at the scrolled end of the page, keyboard and reduced motion. Do not trust the
builder's sweep. Check each of the 15 rules, the lessons list above, the science, Test yourself (right and wrong
answers), and that nothing the old tool did was silently dropped (compare with the page on `origin/main`).
Open or fetch the best existing tools for this job and say what they do better, if anything. Write
`/home/claude/review-<tool>/REVIEW.md`: PASS or BLOCK, must fix, should fix, things to remove (never suggest
adding panels, text or controls). Each item: what you saw, the shot, the rule, the smallest fix. Stop your
servers. Report the verdict and the must fix list.
