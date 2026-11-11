# Second pass: simple, clear, high quality (brief for builders, 2026-11-10)

## What the owner said after seeing the rebuilt tools (PR #188)
"It seems like you may have overcomplicated them. They should still be simple and easy to use ... not
overcomplicated with too many things to look at or too many words or pieces of information. Do not saturate the
tools. ... With each tool, alongside the simplicity, what I want you to look at and ask is: what is this tool
supposed to help me understand? Think about what the most optimal way of showing that is, and then if what we
currently have is achieving that or if it needs to be changed or modified or improved. I also want you to look at
the quality of it all. Are the graphics and visuals high quality and are they representative? These tools should
not be just these random things. They should actually be helping students learn and understand concepts while
staying simple enough where it's easy to use the tools and straightforward for what you need to do and what you
need to learn. But again, that does not mean stripping away its depth."

Standing wishes that still hold: simple on landing, clear what it is for and what to do first, no function
removed, extra information revealed progressively; readable on a phone; the NREMT body map is the bar ("it just
works, is very interactive, gives good information"); no walls of text or repeated information.

So the first pass fixed "the picture is not the idea" and overshot into "too much on the picture". This pass keeps
the better pictures and makes every tool calm. Depth stays: it moves behind a tap or appears at the step that
needs it. It is never deleted.

## For EVERY tool in your courses (changed in the first pass or not), answer in writing
1. What is this tool supposed to help a student understand? One sentence.
2. What is the best way to show that? (Describe the ideal picture and the one thing the student does.)
3. Does what we have do that? LEAVE, SIMPLIFY (same picture, less on it), or CHANGE (the picture or the main
   action should be different). Most first-pass rebuilds will need SIMPLIFY; expect many untouched tools to be
   LEAVE. Do not change a tool that already passes.
4. Graphics: are they well drawn, consistent with the rest of the site, and do they look like the real thing?
   Anything that reads as a random shape, clip art, or decoration that does not teach, goes or gets redrawn.

## The standard on the opening screen and at every step (Explore and Test yourself)
1. One hero picture. One main picture fills the stage. No dashboard of panels. A second panel may appear when the
   student's action makes it meaningful (the graph that a slider drives may sit beside its scene only if both are
   read together as one thing).
2. One obvious first action. A student must see within three seconds what to look at and what to do. One primary
   control stands out; at most 4 controls show at once; the rest sit behind the existing More / Details / Setup.
3. At most 5 to 7 text labels on the picture at one time. Name parts on tap, or label only the part in focus at
   this step (dim the rest). No legend longer than 4 items; a longer key opens on tap.
4. At most 2 live numbers on the picture. Other readouts go in Details or appear when they change.
5. Words: the opening screen carries at most about 40 words outside button labels (title excluded). One short
   line says what to do. Explanations stay in Explanation / Why, where they already live. Never say the same
   thing twice on one screen.
6. One question per screen. If a view teaches three ideas, it is three steps or scenes, not one crowded picture.
7. Reveal in time. Results, gauges, comparisons and consequences appear when the student's action produces them,
   not before. Cause and effect sit next to each other: the eye should not cross the screen to connect a control
   to what it changes.
8. Nothing is lost. Every function, data key, saved progress key, drill and number that exists stays reachable.

## Where NOT to simplify (push back in your notes rather than cut)
- Do not separate things that teach cause and effect together (an ICE table and Q against K; demand above its
  revenue hill). Keep them on one screen and reveal the second when the first is acted on.
- Do not flatten a real place into a flowchart (a cascade belongs in a cell, a border on land). Keep the place;
  focus the current step and dim the rest.
- Do not remove accuracy, units or the labels a student needs to answer the question in front of them.

## How to work
- Work ONLY in the worktree and branch you were given; follow the commit, check and no-push rules in
  `docs/tool-review/BUILD.md` (do not edit sw.js, CLAUDE.md, the README or status files, or shared files outside
  your course unless told you own them). node_modules is a symlink: never commit it.
- For each tool: open every scene at 1280x800 and 390x844, COUNT what is on the opening screen (labels on the
  picture, live numbers, controls showing, words outside buttons, panels), and write the counts down before and
  after. Fix until the standard holds, then look again as a student seeing it for the first time.
- Save for every tool, changed or not: `/home/claude/shots/pass2/<course>/<tool>_land_d.png` (opening screen,
  desktop) and `_land_p.png` (phone), taken after your work. Changed tools also get `_before_d.png`.
- Write `docs/tool-review/pass2/<course>.md`: a table with one row per tool (the idea; the best way to show it;
  verdict; counts before and after; what changed; what moved behind a tap), then notes on graphics quality and
  anything you chose not to simplify and why. Commit it.
- Run the course's build --check, checks, tests, `node scripts/check-site.mjs` and `node scripts/check-weight.mjs`
  until clean. New code for a tool loads with that tool, never in a course's shared shell.

Final reply to the lead, under 15 lines: counts of LEAVE / SIMPLIFY / CHANGE, the three tools that changed most,
anything you pushed back on, checks status, anything not done.
