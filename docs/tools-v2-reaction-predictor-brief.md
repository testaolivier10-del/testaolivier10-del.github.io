# Tools v2: Organic Chemistry Reaction Predictor (brief and build notes)

Status file for the v2 rebuild of `ochem/tools/reaction-predictor.html` (Premium; rank 25 in `docs/tools-v2-rollout.md`,
group M "sorters and matchers"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`.
Branch `claude/tools-v2-reaction-predictor`, cut from `claude/tools-v2-all`. NOT merged: an independent reviewer runs
first. Built on Opus.

## The one main idea (one screen)
**The substrate, the reagent and the conditions decide whether a flask goes SN1, SN2, E1 or E2.** The student picks a
substrate and a reagent (and, quietly, the solvent and heat) and at once sees what that reagent does to that molecule:
it attacks the back of the carbon while bromide leaves and the three groups flip like an umbrella (SN2), takes a beta
hydrogen anti to bromine while the double bond forms (E2), waits while bromide leaves on its own and the carbon goes
flat and positive, then adds or takes a proton (SN1, E1), or comes in and bounces off (no reaction). The products land
in a tray with their rough shares; the cause line names the factors that decided it.

The rollout row listed the control as "tap the path you think wins" (group M, sorters). That is the right control for
Test yourself (it is "Call the path" there); in Explore the thing to change is the reagent, so the picker of reagents,
grouped by what they are, is the main control (decision 1).

## Research (rule 10): what exists and what we took
"Read" means the page's text was fetched and read; nothing below was run in a browser for this job except our own.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| ChemTube3D (Liverpool), E2 menthyl chlorides page (read) and the site's SN2 and E2 animations (read as text) | 3D models; click a structure, then click the reaction arrow to play the animation; spacefill, ball and stick or sticks; you can turn the molecule to see the anti periplanar H and Cl | The real 3D motion (inversion, anti periplanar) is what makes SN2 and E2 click | One fixed reaction per page; you never choose the substrate or the reagent, so the arbitration (which path wins) is not there | A ball and stick molecule that really moves: the umbrella flip, the anti H, the flat cation; and the choice of substrate and reagent ours |
| Master Organic Chemistry, "SN1/SN2/E1/E2 decision" (read) | A decision procedure in text, with real product percentages | Numbers: isopropyl bromide with ethoxide about 80% E2 in ethanol, 97% in DMSO; cyclohexyl bromide about 1% SN2 | Text and tables, no picture | The numbers for the accuracy fixes below |
| Reusch, Virtual Textbook, alkyl halide reactivity (read) | A table by substrate class and reagent type, with ratios (2-bromobutane: 2-butene 4:1 over 1-butene, trans 6:1 over cis) | Clear about where courses disagree (tertiary with weakly basic nucleophiles: mostly E2 in his table) | Text | The contested point logged in `docs/ochem-needs-author.md` |
| The old LevlPrep Reaction Predictor (run, `origin/main`) | Predict first landing; 8 substrates and 11 reagents in chips, solvent and heat behind a disclosure, a 2 by 2 meter of SN1/SN2/E1/E2 with a puck, the four factors as rows, the product drawn, Draw your own substrate | Its decision procedure (`predict`, `mixture`) is a real rule set with reasons per factor; the quiz | 37 controls; the landing is graded; the molecule only gets arrows, nothing moves; the meter is a bare chart | The engine (three accuracy fixes), every substrate, reagent, solvent and the heat switch, the reasons and verdicts, the product drawings, Draw your own, the quiz and its ids, the Arrow Pusher links |
| Our own Arrow Pusher and Resonance v2 (run) | The shared board's look: balls, sticks, violet electron pairs, curved arrows, red and blue charge glows | Accepted by review as the ochem visual level | Flat (2D) | The look and the colours of `ochem/assets/push-board.js` and `push-board.css` (gradients, balls, pairs, arrows, badges, the small product drawings) |

What ours does that none of the above do: the student chooses the flask and immediately watches that reagent do its
own path to that molecule, with the competing product in the tray beside it.

## The design (Explore, one screen)
- **The picture, the biggest thing:** a 3D ball and stick sketch of the substrate on the board's lit wall, the
  reagent beside it. The hydrogens on the carbon that holds bromine are balls (so the umbrella flip shows), and one
  hydrogen per kind of beta carbon is a ball (the one that can leave, drawn anti to bromine); the rest are written in
  the labels (CH₃, CH₂). Lone pairs are the board's violet pairs; charges are red and blue glows with a badge.
- **Every change plays at once** (instant response): the reagent slides in; for a moment the names say what matters
  ("2° carbon", "β-H", "strong base"); then the mechanism runs: curved arrows draw in, the electron pairs fly along
  them, bonds break and form as they land, charges move, the groups reshape (umbrella flip, flat cation, flat alkene
  carbons), the pieces part. SN1 and E1 pause on the flat "carbocation" before the second step; a neutral nucleophile
  then hands its extra H⁺ to the solvent. No reaction: the reagent comes in and goes back, with the reason
  ("backside blocked", "too weak to attack", "no β-H to take", "not a nucleophile").
- **On the picture:** Substrate (8, and Yours after Build your own) and Reagent (11, grouped: Strong base and
  nucleophile, Bulky strong base, Good nucleophile weak base, Fair nucleophile, Weak (solvolysis)); the reagent picker is
  the main control (violet ring, the cue "Pick a reagent"). Quiet on the right: Protic | Aprotic, Heat, Play it again.
- **The tray, "In the flask":** the products drawn as on paper (the board's small drawings) with the path and its
  share ("E2 ≈80%") and a bar of that length; the major card framed green. A tap on a card plays how that product forms
  (the minor path too, titled "(minor)"). No reaction: the substrate, "No reaction".
- **Names at the end:** the path ("E2: one step", "SN1: cation first"), the product ("Zaitsev alkene", "ether"),
  "Br⁻". Names are hidden while the molecule moves and placed from the drawn frame.
- **Cause line:** the factors, then the result: "2° carbon + strong base + protic → E2 wins → Zaitsev alkene"
  (+ heat when it is on). While a run plays it shows only the factors, so it never names a result the picture has not
  reached.
- **Purpose line:** "Substrate and reagent decide SN1, SN2, E1 or E2." with Show me how (three pointers: the
  substrate, the reagent, the tray). First visit cue: "Pick a reagent", beside the reagent picker (under it on a phone,
  where the molecule starts lower while the cue is there).
- **One colour per idea:** the reagent and electrons violet; substitution teal; elimination rose; heat amber; a
  product green; a carbocation blue; a negative charge red; the carbon's class and the solvent grey.

### What is on screen in Explore (counted; Playwright, 2-bromobutane + NaOEt at the end of its run, 1440 and 390)
Outside the picture: the purpose line (8 words) and Show me how; the cause line (5 pills, 10 words). One control
outside the picture (Show me how). On the picture: 8 controls (Substrate, Reagent, Protic, Aprotic, Heat, Play it
again, two tray cards), 3 names at the end ("E2: one step", "Zaitsev alkene", "Br⁻"), "In the flask" and the two
card tags. During the pause before a run: "2° carbon", two "β-H", "strong base". The old screen: 37 controls.

### Explore against Test yourself
- **Explore:** free play as above. Nothing graded, nothing locked.
- **Test yourself**, one dropdown "What to practice":
  1. **Call the path** (the old Predict first): a random flask from the whole space (not one of the last 12) on the
     same picture, still, with its names; the task gives the substrate, reagent, solvent and temperature; five buttons
     (SN1, SN2, E1, E2, No reaction). After the call the real path plays, the answer is marked, the verdict and the
     four arguments show, with the Arrow Pusher link; Next flask; "n of m right".
  2. **Check yourself: 6 questions**: the page's quiz, `OchemToolQuiz` slug `reaction-predictor`, the same generator
     and ids (`<sub>/<rgt>/<solvent>[/h]`).
- Links keep working: `?sub=&rgt=&solv=&heat=1` opens that flask in Explore; `?mode=explore` still opens Explore (it
  is the default now); `?build=` opens Build your own in "?" and loads the drawing; `#call`, `#check` open Test
  yourself there.

### What moved
| From the old tool | Where it is now |
|---|---|
| Predict first as the landing (graded) | Test yourself, Call the path (same five answers, score, Next flask) |
| Substrate and reagent chips (8, 11) | The two pickers on the picture (same items; reagents grouped) |
| "Solvent and heat" disclosure | Protic / Aprotic and Heat, quiet, on the picture |
| Shuffle the flask | Next flask in Call the path (a random flask is a drill, not free play) |
| The 2 by 2 meter, the puck, a corner's "why" | The molecule doing the path and the tray's shares; each path's share and what drives it or blocks it in "?" (table) |
| The four arguments, the verdict, the split note, product note, substrate and solvent notes | "?" (This flask, factor by factor), live for the Explore flask; Call the path after a call |
| "What changed" line (Solvent moved E2 from 80% to 90%) | The tray cards and the cause line change with every change; not kept as a sentence (decision 6) |
| Product drawn beside the flask, formula | The tray (drawn, path, share); the condensed formula in "?" |
| Draw your own substrate, Send to another tool | "?", Build your own substrate (the builder, the hand-off row); it loads as Substrate: Yours |
| Draw the SN2 in Arrow Pusher | "?" and Call the path after a call |
| Reagent's nucleophile and base bars | "?" ("Nucleophile 3 of 4, base 3 of 4") and the reagent groups in the picker |
| Check yourself | Test yourself part 2 |
| Premium | Unchanged: the page is Premium in `ochem-premium.js` (not in `FREE_TOOLS`), gated by the shell as before |

## Decisions made for the owner
Each is also one line in `docs/tools-v2-owner-log.md`.
1. Explore's main control is the reagent picker (the rollout row named "tap the path", which is Test yourself's).
2. The picture is a 3D sketch with explicit H balls only where they move (on alpha, one per kind of beta carbon).
3. Every change plays the whole mechanism at once (about 3 to 7 seconds); Play it again repeats it; a tray card plays
   that product's path.
4. The 2 by 2 meter is gone; the shares are the tray's, the per path reasons are in "?".
5. Accuracy fixes in the engine (below): a strong base on a secondary carbon 80% E2 (90% on cyclohexyl), more in an
   aprotic solvent; solvolysis 80% substitution at room temperature, 60% alkene with heat.
6. The "what changed" sentence is not kept; the change is seen in the picture, the tray and the cause line.
7. Shuffle the flask moved to Test yourself as Next flask.
8. E1 with iodide or azide: a solvent molecule (EtOH, or DMSO in an aprotic flask) takes the proton, drawn; the
   reagent waits aside.
9. The H⁺ a neutral nucleophile loses is drawn leaving toward the solvent (a ball with + that fades), not a named base.
10. A drawn substrate (Build your own) is shown flat with the first arrow and the verdict; the product is left to work
    out, as before.
11. The registry tagline loses its dash ("SN1, SN2, E1 or E2, and why, factor by factor.").

## Accuracy (checked 2026-11-19; ochem content always gets a check)
- **Engine rules unchanged except three fixes** (sources: Master Organic Chemistry's SN1/SN2/E1/E2 article; LibreTexts,
  Roberts and Caserio 8.10; Reusch): secondary + strong base about 80% E2 (isopropyl bromide with ethoxide in ethanol,
  79 to 80%), more in DMSO (97%); the old aprotic rule gave that share to SN2, and its verdict said "The aprotic solvent
  pushes the SN2 share up", now "A polar aprotic solvent makes the base stronger still, so even more of it goes to E2";
  cyclohexyl about 90% (1% SN2 reported; capped at the tool's 90% band); room temperature solvolysis 80% substitution
  (tert-butyl chloride, 80% ethanol, 25 °C: 83% alcohol, 17% alkene).
- **Every frame of every flask is a real structure** (unit test: all 352 flasks, major and minor paths): each atom's
  drawn charge equals its formal charge from its bonds, lone pairs and the hydrogens in its label; bromide leaves with
  four pairs and −1; the nucleophile ends bonded to the carbon (SN1, SN2); the double bond is to the beta carbon whose H
  was taken (E1, E2); a bulky base takes the Hofmann H where two alkenes are possible (2-bromobutane, 2-bromo-2-
  methylbutane); the tray's alkene is the verdict's (Zaitsev or Hofmann); no reaction keeps bromine on.
- **Geometry, a sketch:** SN2 reflects the three groups through the carbon (inversion); a carbocation and both carbons
  of a new double bond are flat across the C–Br axis; the E2 H is anti periplanar to bromine. Bond lengths and angles
  are not to scale and the sketch widens across the axis; "?" says so. On the cyclohexane ring the ring stays still.
- **Products:** the old condensed formulas through `mol-builder.js` (unit tested before: formula of every drawn
  product); the tray draws the minor product too, the same way.
- **Open points** in `docs/ochem-needs-author.md`, "Reaction Predictor, tools v2": tertiary + weakly basic anions
  (CN⁻, N₃⁻, HS⁻, I⁻) is SN1/E1 here (Klein's convention) but mostly E2 in Reusch's table; "heat makes E1 major" is
  the course convention while real tertiary solvolysis stays mostly substitution at moderate heat; E1 drawn with the
  reagent or solvent as the base.

## What was built
- `ochem/assets/tools/reaction-predictor.js` (rewritten: the engine is the old code with the fixes above; new: the 3D
  sketch `substrate3d`, `sequence` (every frame of a flask), the two layer renderer, names, the tray, the cause line,
  Call the path, "?", Build your own), `ochem/assets/tools/reaction-predictor.css` (new), the page (inline styles gone,
  `push-board.js` added), `kit2: true` and `css: ['push-board']` in the registry. `window.OchemReactionPredictor` keeps
  `predict`, `mixture`, `productDrawing`, `sites`, `build`, `DRAW`, `SUBSTRATES`, `REAGENTS`, `SOLVENTS` and adds
  `productOf`, `sequence`, `substrate3d`, `MECH_LINK`, `view` (for the sweep).
- `scripts/test/ochem-tools-upgrade.test.mjs`: one new test (every frame of every flask, see Accuracy).
- `scripts/tools-v2/reaction-predictor-sweep.mjs` (ten widths, one per process) and
  `scripts/tools-v2/reaction-predictor-perf.mjs` (CPU x4, beside the flagship).
- The view for each substrate (turn, tilt, arm turn, widening, reagent tail turn: `VIEW` in the code) was chosen by a
  search that keeps every ball apart in every frame of every flask; the unit test checks it.

## Checks run (2026-11-19, after the last change)
- **Sweep** (`scripts/tools-v2/reaction-predictor-sweep.mjs`), one width per process at 360, 390, 430, 600, 768, 820,
  1024, 1280, 1440 and 1920, light and dark: 80 states and 960 checks per width, **0 failures** (800 states, 9,600
  checks). States: 32 flasks covering every path of every substrate (with heat and aprotic cases), a minor tray card
  played, "?" open, Call the path before, after and Next flask, a first visit with the cue, a run left halfway for Test
  yourself and back. Checks: nothing clipped, names 4 px clear of names, balls, badges, controls and the cue, no ball on
  a ball, no badge or pair on another atom, the molecule bigger than any tray card, share bars in proportion, no text
  under 11 px, pickers show their whole name, the cause line at most two rows and one height on phones, no sideways
  scroll, no console errors, names and tray waiting mid run, the run stopped in Test yourself, Explore settled on return.
- **Frame by frame** (`scripts/tools-v2/reaction-predictor-frames.mjs`): 8 runs at 390 and 1440, about 4,400 frames,
  **0 failures**: names only while still and clear of every ball; no result on the cause line and no tray before the
  end; Br⁻'s badge only once its bond is mostly gone, the carbocation's + only after bromide left; no ball on a ball in
  any in between frame; nothing off the stage; a change mid run starts the new flask at once.
- **Performance** (`scripts/tools-v2/reaction-predictor-perf.mjs`, CPU x4, three full runs per width, flagship measured
  in the same run; load average about 4): 390 median 16.7 ms, p95 33.3 ms (flagship's Watch it happen 33.3 / 66.7);
  1440 median 16.7 ms, p95 50 ms (flagship 66.6 / 133.3). Single frames at a change reach 300 to 380 ms (see below).
  Earlier under load 7 to 10: 390 p95 50, 1440 p95 66.7 (flagship 200 to 280).
- **Unit tests**: `ochem-tools-upgrade` (with the new frame test), `tool-content`, `ochem-url-compat`, `ochem-premium`,
  `tool-use`, `question-ids`: 105 pass. `build-tool-pages --check`, `check-site`, `check-weight --check` pass; no
  conflict markers.
- **check-tool-use** with a local copy of its list (not committed): tool-open, tool-touch (explore), tool-mode (quiz),
  tool-use, frame v2; nothing under automation.
- **Premium**: with the real `premium.js` (not unlocked) the page shows the same Premium gate and the stage is hidden;
  nothing is drawn behind it (no console errors).
- **Links**: `?sub=&rgt=&solv=&heat=1` open that flask; `?build=CH3CH2CH(Br)CH3` loads Build your own and Substrate:
  Yours; `#call` opens Call the path.
- **Preview**: `/mnt/user-data/outputs/reaction-predictor-v2/index.html`; shots in
  `/mnt/user-data/outputs/reaction-predictor-v2/shots/` (390, 768, 1440, light and dark: the first visit with the cue;
  an E2 run at the pause with names, arrows drawing, electrons moving, bonds changing and the end; SN1 with bromide
  leaving, the carbocation, water attacking and the end; the SN2 umbrella mid flip and its end; the Hofmann product; no
  reaction; the minor card's SN2; Call the path before and after).

## What I am not happy with
- **Single slow frames at a change** (300 to 380 ms at CPU x4): building the new molecule's elements and, at the end,
  the tray's two small drawings. The run itself holds 16.7 ms median. Not split across frames yet.
- **The molecule is small on a phone** (a C–C bond about 45 px at 390): the reagent waits beside the substrate and
  bromide leaves to the other side, so the scene is wide; the stage was made taller but width limits it.
- **The ring sketches are sketches**: bromocyclohexane's chair stays still (only H, the nucleophile and bromide move),
  and benzyl's ring is drawn as a flat hexagon of balls; turning views were chosen by a search for no overlaps, so some
  substrates are seen from unusual angles (2-bromobutane from 40° to the side).
- **Each change plays 3 to 7 seconds**; a student flipping reagents quickly sees each run restart (by design: the new
  flask starts at once). A "skip to the end" was not added (Play it again and the tray cards cover replays).
- **The contested chemistry is logged, not changed**: tertiary + CN⁻/N₃⁻/HS⁻/I⁻ stays SN1 (Klein) though Reusch's
  data say mostly E2; "heat makes E1 major" is the course convention.
- Accuracy was checked by the builder (sources above and the frame test); no separate chemistry reviewer in this
  session, so the independent review should include the ochem accuracy pass. No real phone, no screen reader pass, no
  real students.

## Review round 1 (2026-11-19, `/home/claude/review-reaction-predictor/REVIEW.md`: BLOCK on 6 must fix items; all done)
Where this section and the text above disagree, this section is the tool as it is now. The branch then took in
`origin/claude/tools-v2-all` (a merge; its `check-tool-use.mjs` kept; both sides of the owner log, pipeline and status
tables kept).

### Must fix
1. **Heat counts on a secondary carbon with a strong base.** `mixture()` set the secondary band after the heat step;
   it now sets the band first, and heat and the solvent add to it (cap raised to 95). 2-bromobutane + NaOEt: protic
   80 → 90 with heat; aprotic 90 → 95; bromocyclohexane 85 → 95 (aprotic is already 95, the cap).
2. **The solvent argues what the verdict says.** On a secondary carbon with a strong, unhindered base an aprotic
   solvent now leans E2 (`{E2:1}`): "Polar aprotic. The anion is left bare, a stronger base as well as a stronger
   nucleophile, so on this carbon it adds to E2." The same reason feeds "?", Call the path and Check yourself.
3. **No name is dropped.** The path's title has its own row above the molecule; a name with no room beside what it
   names goes to a row under the molecule, as near under it as other names allow. The sweep now fails any name drawn
   with no size.
4. **Names clear of lone pairs.** Every drawn pair (and badge) is an obstacle for the names; the sweep counts pair dots
   as solid.
5. **Tray letters.** A card's drawing is turned (0, 90, −90, 180, 45, −45°) to the first turn whose letters keep 3 px
   apart; the phone tray is taller (148 px). The sweep checks letters inside each card.
6. **Readable on a phone.** On a tall stage the scene turns a quarter turn (reagent on top, bromide below) when that
   draws it at least 12% bigger; the reagent waits closer (−2.3 C–C), bromide drifts less, and the phone stage is taller
   (`clamp(720px, 100vw + 424px, 884px)`). 2-bromobutane at 390: C–C 71 px (was 50).

### Should fix (done)
- Heat or solvent that leaves the same paths: the molecule stays still and the tray's bars and numbers move together
  (480 ms); the first pause is 520 ms (was 900).
- SN1 from either face: each play alternates the back face (the groups flip) and the front face (they stay; the
  nucleophile waits on bromide's side, bromide drifts off below the axis), named "back face" or "front face".
- Ring SN2: the nucleophile ends in hydrogen's equatorial slot and hydrogen takes bromine's axial place (trans), as
  the reviewer described; ring SN1 the same from the back, retention from the front.
- SN2's umbrella now swings each group through (its branch translated), not a mirror image interpolated (that
  squashed branches mid flip); every in between frame of all 352 flasks is checked for overlaps by script.
- Views searched again for the new geometry, with the two rings shown more face on.
- "?": a path with no share says why it loses ("loses: the reagent acts before a cation can form").
- The shared Check yourself intro lost its dash (`ochem/assets/tool-quiz.js`, every ochem tool).
- "?" is filled after the frame on a change.

### Checks (this round, after the merge)
- Sweep, one width per process at all ten widths, light and dark: 80 states and 960 checks each (800 states, 9,600
  checks), **0 failures**, now also asserting every name is drawn with a size, lone pair dots are solid to names and
  letters inside tray cards never overlap.
- Frames: 6,997 frames at 390 and 1440 (now both SN1 faces), **0 failures**. A node scan of every in between frame of
  all 352 flasks (both SN1 faces) finds no two balls overlapping.
- Unit tests 105 pass (the frame test now runs both SN1 faces); `build-tool-pages --check`, `check-site`,
  `check-weight --check` pass; no conflict markers.
- Still open (not blocking): single slow frames at a change; the desktop molecule is a little smaller than in round 0
  (the title and name rows take space).
