# Tools v2: brief for every builder and reviewer

Owner decisions (2026-11-17 and 11-18): every one of the 145 tools is rebuilt to `docs/tools-v2-standard.md`.
The owner does not look at each tool. Nothing merges to `main` until all tools are done: everything collects on
the branch `claude/tools-v2-all`, which is merged once at the end. Similar tools stay separate (more tools, each
more specific). Nothing a tool could do is silently dropped.

Speed rules (owner 2026-11-23: faster, same quality):
- First build and the round that goes to integration: full kept sweep at all ten widths, light and dark.
  Fix rounds in between: sweep at 360, 390, 1024 and 1440 (light and dark) plus the frames run; the reviewer runs
  the full ten widths only on the round it means to PASS.
- Reviewers list every must fix and every should fix in one pass. Builders fix all of them in the same round, so
  no separate polish round follows a PASS unless the PASS round itself finds something new.
- Run one width per process, never several heavy checks at once, and stop servers as soon as a run ends.
- Simpler tools go first in the queue; the slow 3D and NREMT patient tools are not started two at a time.

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
   Caught in reviews of the first twelve tools; check each before you hand in:
   - Dark mode in a sweep: the site's theme key is `localStorage.nremt_theme` (see `assets/site-chrome.js`), not
     `theme`. Assert the page is really dark before trusting a dark run (torque balance's first sweep was all light).
   - Fit the stage to the screen's height: at 390x844, 1024x768 and 1280x800 the main control, the picture and the
     cause line are all in view at once, with no inner scroll; and no bare wall on wide screens (ICE tables, torque).
   - Count from drawn positions, never an internal flag (ICE tables' products appeared before they were counted).
   - Every number, rate word, bar, label and cause line is derived from what is DRAWN at that frame, not from the
     model's target value. Assert this frame by frame for every animated change, including reversals, fast drags,
     keyboard jumps and replays (osmosis, enzyme, energy flow, water potential all failed this first).
   - Proportions in the picture match the numbers (occupied sites vs saturation, heat vs energy passed on, counts
     vs shares). Measure drawn sizes against the model in the sweep.
   - Every on picture label sits clear of every number and of every other label by at least 4 px, at every width,
     in Explore AND Test yourself (longer numbers there). No sweep exclusions for "label and its number".
   - Labels that teach a count must label every part being counted (both Aa plots, not one).
   - The thing a cue tells you to drag must actually drag when grabbed there.
   - Tap and click targets act on what is drawn under the pointer (elementFromPoint / closest), never on a
     bounding rectangle that covers neighbouring things.
   - Only one cue at a time; a cue never covers a number, a label or the object it points at.
   - Nothing a student needs is hidden on phones; the knob never covers the main object (car, cell).
   - Units and words never break inside a word; text fits its sign or pill at 360 px (size from measured text).
   - Performance: a full drag must hold median frame about 16 ms and p95 at or under 50 ms with CPU throttled x4
     at 390 and 1440; one element per drawn object, remove faded copies, no per frame DOM rebuilds.
   - Screen reader text (aria-valuetext, live regions) updates with the current state, not the previous one.
   - Every explanation in Test yourself names the variable that actually changed in that challenge.
   - A "?" or note sentence is checked for science as strictly as the picture (number pyramids can invert;
     irreversible denaturation stated honestly; optimum where the rate actually peaks).
   - Science simplifications that change an answer students can see are not allowed; if a cost or rule cannot
     be estimated honestly for a case, say "not estimated" instead of applying a generic one.
   - No dashed shapes that could read as ghosts or torn parts; two headed thin arrow for "no net movement".
   - A course's adapter in its course kit is shared: before adding a mechanism (practice parts, tabs), check
     whether one already exists on claude/tools-v2-all and extend it (`onPicture: true` exists for tools that
     draw problems on their own picture).
   - Every timer, animation and observer stops when its stage hides (switching to Test yourself, "?", another tab
     mid animation) and the screen returns clean; test leaving mid animation on every tab.
   - Text stays readable: no rendered label under 11 px at any width (fit a drawing by giving it room, never by
     shrinking it below that); the sweep checks minimum rendered text size, not just bounds.
   - After every merge, check no conflict markers were committed: `git grep -nI '^<<<<<<< \|^>>>>>>> '` must print
     nothing.
   - Before handing in, run a self review against this whole list and the 15 rules with your own fresh frames
     at 360, 390, 768, 1024 and 1440, light and dark, and fix what fails. The independent review then
     confirms; it should not be where these are first found.
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

    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
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
