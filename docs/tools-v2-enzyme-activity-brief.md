# Tools v2: AP® Biology Enzyme activity (brief and build notes)

Status file for the v2 rebuild of `bio/tools/enzyme-activity.html` (Premium; rank 27 in `docs/tools-v2-rollout.md`;
the second AP® Biology tool on the kit through `ApBioTools.studioKit2`). Standard: `docs/tools-v2-standard.md`.
Process: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-enzyme-activity`, cut from `claude/tools-v2-all`.
NOT merged: the independent review comes next.

## The one main idea
**An enzyme only works when substrate reaches an active site that still has its shape. Anything that changes how
often they meet, or the shape of the site, changes the rate.** CED topics 3.1 to 3.3 (`docs/apbio-ced-map.json`):
the active site fits the substrate in shape and charge; rate is product formed over time; more substrate raises
the rate until all enzymes are busy; warmer means more collisions until the enzyme denatures; a pH far from the
optimum changes the enzyme's shape; competitive inhibitors compete for the active site, noncompetitive ones bind
elsewhere and change the enzyme's shape.

Four tabs, because each control teaches a different idea (rule 11):

| Tab | The idea on that screen | Main control |
|---|---|---|
| 1 Substrate | More substrate fills more active sites, until every site is busy (saturation) | Substrate, 0 to 20 mM |
| 2 Temperature | Warmer molecules collide more often, until heat unfolds the enzyme (denaturation) | Temperature, 0 to 70 °C |
| 3 pH | Away from the best pH the charges in the active site change and substrate binds poorly | pH, 1 to 13 |
| 4 Inhibitor | A competitive inhibitor sits in the active site; a noncompetitive one binds elsewhere and bends it | Inhibitor, 0 to 5 mM |

## Research (rule 10): what exists and what we took
The sandbox could not open other sites in a browser (the proxy refuses them), so **every source below was read as
text through a fetch, none was seen as a screen**. Where a page served only a summary it says so, and nothing is
claimed about its screen beyond that.

| Source | How it works (as far as the text says) | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| Biology Simulations, Enzymes (page and its blog post; text only, the simulation itself did not load) | Amylase and maltase in a two step pathway; set temperature, pH and concentrations, press "Run Simulation", "Reset" for a new run; a competitive inhibitor can be added | Students "watch the reactions as they happen" | Set, then run, then reset: nothing answers while a control moves. Its own post notes a bug where new enzyme appears without explanation | Instant response instead of Run and Reset. When our picture brings in new enzyme it is labelled "new enzyme" |
| dmccreary, Enzyme activity explorer (page text) | A bell curve of activity against temperature or pH with a draggable cursor, three sliders that move the optimum and the width, presets (human enzyme, pepsin, Taq), an explanation panel, a molecular cartoon | The explanation names collisions, denaturation or ionization on each side of the optimum | The graph is the main thing; five or more controls and a panel; no substrate, no inhibitors | The three reasons, as the cause line. Not the layout: our picture is the molecules, the curve is behind "?" |
| "Interactive Computer Simulations as Pedagogical Tools in Biology Labs", CBE Life Sciences Education (doi 10.1187/cbe.17-09-0208; article text) | A MATLAB enzyme kinetics simulation: rate constants, concentrations, temperature and pH sliders, concentration against time plots | Large test gains over a control group | Plots only: no molecules, no active site, no denaturation to see. The authors say active exploration of variables would strengthen it | Confirms the gap: the measured simulation has no picture of the mechanism |
| Amoeba Sisters, Enzymes (Updated) (a summary of the video, not the transcript) | Pac-Man eats pebbles: active site, induced fit ("enzyme-substrate hug"), reusable, then ghosts distort Pac-Man (denaturation) | Shape is the whole story; one enzyme, one substrate, drawn big | A video: nothing to do; no inhibitors in the summary | Enzymes drawn big with an obvious mouth; the site closes on the substrate (induced fit); the enzyme is not used up |
| OpenStax Biology for AP® Courses 6.5 (the course's source; section text) | Text and figure 6.17 | States each mechanism | (a text) | The science check below |
| LabXchange, Effect of Temperature / of pH on Enzyme Function (catalog pages only: "an interactive image") | Not described by the page | (not inspected) | (not inspected) | Nothing claimed |
| PhET | Not opened this round (no enzyme simulation was found by search) | (not inspected) | (not inspected) | Only the PhET rules already in the standard |

What ours does that none of the above does, by their own descriptions: one control on the picture, the molecules
answer that instant, each idea on its own screen, and the reason written in the idea's colours under the picture.

## Science check (against the CED map and OpenStax 6.5)
- Saturation, the temperature optimum and denaturation, the pH optimum, competitive and noncompetitive
  inhibition: as the CED states them. The rate always comes from the unchanged model `ApBioMath.enzyme`.
- OpenStax: high substrate can overcome a competitive inhibitor and cannot overcome a noncompetitive one. The
  inhibitor tab's quiet substrate knob shows exactly this, and the validator checks it.
- Drawing conventions that go beyond the model are logged in `docs/apbio-needs-author.md` (enzyme-explore-drawing):
  a denatured enzyme does not refold; a pH more than about 3 units from the best is drawn as denaturing; molecule
  speed is exaggerated with temperature; the share of unfolded molecules drawn starts once a quarter are unfolded.

## The design
- **The picture:** enzyme molecules in solution across the whole stage (8 on a desktop, 6 on a tablet, 4 on a
  phone), each a shaded globular protein with its active site. Substrate (amber, two joined parts) drifts, docks
  in a free site, the site closes on it, and two products (green) leave. Substrate that meets a site it cannot use
  (bent, blocked, unfolded) goes up to it and bounces off.
- **The rate:** a "Reaction rate" bar on the picture, top right, in the product's green. It is the model's rate as
  a share of the best that tab's control can reach ("max"). The reactions drawn come at the model's pace.
- **One main control per tab,** a knob on the picture under the solution with its value on it. The inhibitor tab
  adds two quiet, connected controls (rule 11): a Competitive / Noncompetitive switch on the picture and a small
  Substrate knob, so "more substrate overcomes one and not the other" can be done, not read.
- **Opens** on Substrate at 2 mM (half the top rate: a drag either way does something). Temperature opens at
  37 °C (just under the optimum, so the student finds the top and then the cliff), pH at 7, Inhibitor at none.
- **A tab never moves another tab's control.** On a tab the other conditions are fixed (37 °C, pH 7, 10 mM
  substrate), stated in "?".
- **Cue:** "Drag the substrate" at the knob, once per device, gone at the first touch.
- **Cause line** (`K.cause`), live. Examples: "Lots of substrate → every site busy → rate levels off";
  "Too hot → enzymes denature → substrate cannot fit → no reaction"; "Too acidic → site charges change →
  substrate binds poorly → rate falls"; "Inhibitor in active site → substrate blocked → slower rate";
  "More substrate → bent sites still fail → rate stays low". A pill that names a change in the enzymes appears
  once at least one enzyme is drawn that way (rule 14).
- **Labels (1 to 3 words, attached):** "active site", "enzyme"; only while true: "Saturated", "Optimum
  temperature", "Optimum pH", "denatured", "inhibitor", "new enzyme", "before" (a tick on the track).
- **Every change is seen (rule 13):** an enzyme unfolds over 0.8 s (the fold loosens into a chain); a site bends
  over 0.35 s; an inhibitor flies in and docks; added substrate drifts in from the edges; the solution takes the
  colour of the condition (cool blue to warm, the indicator's red to violet for pH).
- **Irreversible:** a denatured enzyme does not refold on a drag back. The unfolded ones fade while new enzyme
  comes in, marked "new enzyme" for 2.6 s. A pH change that only changed the charges is undone, with no new enzyme.
- **One colour per idea:** enzyme blue, substrate amber, product green (and the rate bar), inhibitor purple, red
  for denatured only. Every value is also written.
- **Pause** (small, beside the cause line) stops the motion. Reduced motion: a still picture with every state
  drawn, the working sites holding substrate in the model's share, and a 240 ms cross fade on each change.

### What is on screen in Explore (counted, opening state)
Outside the picture: 4 tabs, the purpose line (9 words), "Show me how", the cause line (3 pills, 4 at most),
Pause. About 24 words (30 at the wordiest setting). No side panel, no graph, no readout cards.
On the picture: the enzymes with substrate and product, 1 knob with its value, the control's name and its two
ends, the rate bar ("Reaction rate", "max"), 2 labels ("active site", "enzyme"). The inhibitor tab adds the
two button switch and the quiet substrate knob with its value. The other labels appear only while true.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself,** one dropdown ("What to practice"):
  1. **Predict, then change** (the old Predict mode; same seven kinds of change, same seeded choice, same
     marking): the picture shows the starting conditions, the student picks up, down or about the same, "Make the
     change" plays it on the picture, then the mark, the two rates and the explanation. Recorded as
     `enzyme-activity:predict-<change>:dir`, as before. The question now also states the conditions in words.
     On a phone the picture is scrolled into view for the change.
  2. **Inhibitor data questions** (the old Questions: the two tables, the 5 questions and the mini FRQ), unchanged.
- `#predict`, `#questions` and `#frq` open the same place as before.

### What moved
| From the old tool | Where it is now |
|---|---|
| Substrate, temperature, pH, inhibitor kind and amount sliders | Explore, one per tab |
| "Predict, then change" mode | Test yourself, first part |
| Questions and the mini FRQ | Test yourself, second part |
| The rate curve (rate against substrate, temperature or pH, with the dashed no inhibitor curve) and its sampled table | "?", for the tab that is open |
| Readouts (rate now, apparent Vmax and Km, percent of best Vmax) | "?" ("This setting") |
| The key (substrate, products, the two inhibitors) | Labels on the picture; "The words" in "?" |
| The "why" paragraph | Explore: the cause line. Test yourself: unchanged, after each challenge |
| "How this model works", the intro | About (the ⋯ menu) |
| Pause | Small button beside the cause line |

### What the new Explore cannot do that the old one could (questions for the owner; nothing dropped silently)
1. **Enzymes B and C in free play.** Explore uses Enzyme A only. The stomach enzyme (best at pH 2) and the hot
   spring enzyme (stable to about 80 °C) are still drawn in Test yourself. Bring them back as a quiet "Which
   enzyme" choice on the pH and Temperature tabs?
2. **Several conditions at once.** Old Explore could set, say, an inhibitor at 60 °C. Each tab now changes one
   thing with the rest fixed. OK?
3. **Trials with scatter.** "Run one trial", "Run a series", "Clear runs" and the table of your own runs are gone;
   the model's curve and table are in "?". Is collecting noisy data worth its own tool (an "enzyme lab" in the
   Graph group)?
4. **The live rate number** (µmol/min) is in "?" only; the picture has the bar.
5. **Temperature above 70 °C** (the old slider went to 100 °C): Enzyme A is fully denatured by 55 °C.

## Decisions made for the owner
Also one line each in `docs/tools-v2-owner-log.md`.
- Four tabs; the two kinds of inhibitor share one tab with a switch (five tabs do not fit a phone).
- The inhibitor tab keeps a quiet substrate knob.
- Explore uses Enzyme A only; other conditions fixed per tab.
- Denatured enzymes do not refold; new enzyme comes in, labelled.
- A pH far from the best is drawn as denaturing.
- The rate is a bar with no number; the bar's top is the best that tab can reach.
- Trials, the runs table and the live graph left Explore (graph and table to "?").
- Temperature capped at 70 °C, substrate knob opens at 2 mM.
- The hub blurb, the About intro and four words of the description were changed ("run trials" is no longer true).

## Files
`bio/assets/tools/enzyme-activity.js` and `.css`; `explore` in `bio/data/tools/enzyme-activity.json` (checked by
`scripts/lib/apbio-tool-checks/enzyme-activity.mjs`); `"kit2": true` in `bio/data/pages.json`; the sweep
`scripts/tools-v2/enzyme-activity-sweep.mjs`. The kit and the adapter were not changed.

## Build status (2026-11-18)
- Sweep (`scripts/tools-v2/enzyme-activity-sweep.mjs`): 42 states at each of the ten widths, 420 states and
  2,955 checks, 0 failures. Smallest enzyme share of the solution 21.0% (1024, Test yourself, all denatured).
  Run one width per process (`node scripts/tools-v2/enzyme-activity-sweep.mjs 390`); all ten in one process takes
  over ten minutes.
- Fixes from the sweep: the unfolded chain fills about the space of the folded enzyme (scaled per axis in the
  molecule's frame), so it stays in the solution and stays the largest thing; the fold stretches less while it
  loosens; enzymes take a little more of each cell in narrow scenes (0.315 of the cell width); the cause line
  keeps two rows on a phone in this tool's CSS (the kit reserves one row only, so the builder brief's note that
  the kit reserves two is not true for `.tk2-cause`).
- Verified: AP® Biology content check, `build-apbio --check`, the 72 AP® Biology unit tests, `check-site`,
  `check-weight`; `check-tool-use` with this tool swapped in reports `apbio/enzyme-activity` frame v2 (the stock
  run fails on Osmosis, still listed there as the old frame although it was rebuilt on `claude/tools-v2-all`).
  Playwright at 390, 768 and 1440, light and dark: touch drag (390) and pointer drag, keyboard (End, Home, arrows),
  the inhibitor switch, frames while unfolding and while new enzyme comes in, reduced motion (still result at
  once), Test yourself right and wrong marks, `#predict`, `#questions`, `#frq` (now opens the questions with the
  FRQ; the old tool ignored `#frq`), the real locked state (Premium card), no console errors.
- Preview: `/mnt/user-data/outputs/enzyme-activity-v2/index.html`; shots in `.../shots/` (sweep shots and contact
  sheets in `shots/sweep/`). No shared file changed, so `build-apcalc` and `build-apmacro` were not needed.

## Review round 1 (2026-11-18): BLOCK, all items fixed
Rebased on `claude/tools-v2-all` (the kit now keeps a phone's cause line two rows tall, so the tool's own rule was
dropped; `scripts/check-tool-use.mjs` untouched).

Must fix:
1. **Saturation drawn.** The share of working sites holding substrate follows the model, S/(Km + S) (the same among
   the sites an inhibitor leaves free; on the Temperature tab scaled down with the collision rate when cold). A
   site that fills keeps its substrate until a reaction (`held`); at high substrate the next substrate waits at the
   mouth (from an occupancy of 0.35 up) and slides in as the products leave; only the turnover pace follows the
   rate. Enough substrate is drawn to keep the sites supplied (at least twice the occupied sites plus 3). Measured
   (frames test, 1440): 1 mM 0.31 against 0.33, 2 mM 0.50 against 0.50, 5 mM 0.72 against 0.71, 20 mM 0.99 against
   0.91. The sweep checks 2 and 20 mM at every width (within 0.15). Under heavy machine load (other browsers
   running) the sample can lag; run the frames test and sweep widths alone or a few at a time.
2. **Optimum temperature at 40.5 °C.** "Optimum temperature", "Best temperature" and "top rate" only within 1.5 °C
   of the model's optimum. From 30 °C up to it: "Warm → faster collisions"; just past it while the rate is still
   at least 0.9 of the best and nothing is drawn unfolded: "Just past best → fast collisions". "Too hot" only below
   0.9 of the best.
3. **Words and bar follow the picture.** The bar moves from where it was to the model's rate only as far as the
   enzymes are drawn changed (unfolding, fading in, site bending, inhibitor docked); the rate word reads the drawn
   bar. While unfolded enzymes are swapped: "Denatured stay unfolded", then "→ new enzyme added → rate" while the
   new ones are marked. The inhibitor tab says "Inhibitor added" until an inhibitor is drawn bound.
4. **Reduced motion keeps "new enzyme"** through a whole drag (`settle()` keeps a future `newUntil`).
5. **A replacement that denatures again** loses "new enzyme" and shows "denatured".
6. **Layout by the solution's shape:** 2 by N/2 or N/2 by 2, whichever gives the larger enzymes (Test yourself at
   1024 is now 2 columns by 3 rows).

Should fix: "denatured" waits until the folded body is gone (fold under 0.2); free particles bounce off the walls;
the Competitive / Noncompetitive switch sits on the bench right under the Inhibitor name (bench 196 px on that tab);
the opening line says "Some substrate → about half the sites busy" until the knob is moved; Predict's explanation
uses the saturation sentence only when the answer is "about the same"; the dark shadow is lighter; on the
Temperature and pH tabs "?" draws Enzymes B and C beside A (each at its own usual conditions, in the table too).
"How this model works" no longer calls unfolding instant and reversible (and the old "Runs" item is gone); the
"?" note adds that in a real test tube the rate would stay low.

Checks: sweep 42 states and 297 or 298 checks at each of the ten widths (420 states, 2,975 checks), a few widths at
a time, 0 failures. New kept test
`scripts/tools-v2/enzyme-activity-frames.mjs` (frame by frame, items 1, 3, 4 and 5 and the pH 2 to 13 drag):
0 failures at 390, 1440 and 1920. AP® Biology content, build `--check`, 72 unit tests, `check-site`,
`check-weight`, `check-tool-use` with a local list (frame v2) pass. Playwright at 390, 768, 1440 light and dark.
