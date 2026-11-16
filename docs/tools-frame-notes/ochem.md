# Ochem tools in the standard frame (F1, 2026-11-15)

Spec: `docs/tools-frame-2026-11.md`. Shared API: header of `assets/course/tool-studio.js` and `docs/tools-calm.md`
("The standard frame"). `ochem/assets/tool-shell.js` mounts every ochem tool with `std: true`, so all nine get:

- Bar: name, one line (the registry blurb; the arrow pusher's line is the mockup's), modes, Ask the tutor, Share,
  "?" and the menu. "?" opens the second sheet ("Help and reference"; synthesis "Problems and help", 3D viewer
  "View options and help", conformations "Ring builder and help"), which still holds the tool's reference and
  settings, then Check yourself and Keep going.
- Menu: Start over, Copy link, About, Report, Ask the tutor, Periodic table, then **Check yourself** and **Keep
  going** (new: each opens the sheet at that section), Course home, All tools.
- Finished card extras (`OchemStudioKit.extras`): Full explanation (Why), Check yourself (6 questions), Read the
  lesson (from the tool's Keep going list).
- `OchemStudioKit.chipPicker` turns a tool's scenario chips into one grouped dropdown on the stage; the chips stay
  in the page, hidden, and a pick clicks the chip, so the tool's own state, links and handlers are unchanged.

Nothing a tool did before was removed. Each list below is everything the tool does and where it is now.

## Arrow pusher (the template, matches the approved mockup)
| Feature | Where now |
|---|---|
| 3 modes (Ready-made, Build your own, Mechanism challenge) | bar: Explore, Build, Challenge |
| 21 ready-made molecules in 4 groups | one grouped dropdown, stage top left (sub = group name) |
| Per-molecule nudge (`hint`) | hint ladder "Nudge for this molecule" (one step) |
| Arrow editor (tap source, tap target, pulsing likely ends, tap an arrow to remove) | stage, left |
| Editor Undo / Clear | stage foot: Undo, Reset (drive the editor's own buttons; off with no arrows) |
| What your arrows make (product drawing, fragments) | stage, right of an arrow, only once an arrow is drawn |
| Readout: what you drew, errors, warnings, commentary, "Legal, but" notes | side panel "What happened": the head names the first arrow (or the error); the notes below |
| Illegal arrow | red pill and a short note under the drawing on the stage; full text in the panel |
| Use this as the next step, mechanism strip, Start over | panel action; strip on the stage as before |
| See it in 3D | tag under the notes |
| Formal charge table (bookkeeping) | "?" as "Formal charges", open |
| How an arrow works, keyboard help | "?" |
| Builder: type, quick picks, canvas, palette, charges, undo/clear | Build mode only: builder on the stage; quick picks in the "Start from" dropdown; builder Undo and Clear (now "Reset") at the stage foot |
| Builder verdict | panel ("Every atom checks out" or what to fix) |
| Push on a built molecule | "Push electrons on this" carries it to Explore ("Yours" group in the dropdown) |
| Send to other tools (handoff) | "?" sheet in Build and menu "Open in another tool" |
| 7 challenges (2 two-step) | dropdown with "n of 7"; Check primary; step marker "Step 1 ✓ / Step 2 of 2" heads the panel; the intermediate is the drawing |
| Target | readout pill on the stage; structure behind "Show target structure" (stage foot) |
| Wrong check feedback | the arrows the step does not want turn red on the molecule (new `marks` option in molecule-editor.js, cleared at the next edit), short note under the drawing, full reading in Explanation |
| Show one arrow | hint ladder answer, opens after one wrong Check; each tap shows one more arrow |
| Next challenge, Again | finished card: Next challenge, Try it again, Full explanation (arrow by arrow), Check yourself, lesson |
| URL state (start, build, chal), handoff in | unchanged; a `build=` link lands on pushing that molecule |
| Check yourself quiz, Keep going | "?" sheet, menu, finished card |

New copy: two hints per challenge step and a takeaway per challenge (in `CHALLENGES`). Chemistry check, by the
writer: each hint names the nucleophile or the bond that breaks and matches the step's stored answer arrows.

## Resonance explorer
Modes Find the forms, Compare two (bar). Species chips (13) now one dropdown (Start here, More species). Build your
own keeps its disclosure (summary renamed). "Show me one I'm missing" is the ladder's answer, open after one judged
arrow set, with two new hints before it. Finished card when every form is found (at least one by the student): All
found, Next molecule, Start over, Full explanation (ranking), Check yourself, lesson. Unchanged: forms gallery,
hybrid view, charge map (in "?"), compare mode, URL state, handoff.

## 3D molecule viewer
Modes Explore, Predict shape. Molecule chips in groups now one grouped dropdown (Explore). Unchanged: Ready-made |
Build your own, the 3D stage, atom readouts, view options and send (in "?"), predict quiz.

## Spectroscopy lab
Modes Read a spectrum, Identify it, Reference. Compound chips (two sets) now one dropdown (Start here, More
compounds); "Draw your own" keeps the builder. Unchanged: IR / NMR switch, peak notes, tables (in "?"), puzzle,
degrees of unsaturation.

## Synthesis trainer
Modes Forward, Backward. New problem dropdown on the stage, grouped by chapter, solved ones ticked; the Problems
sheet (chapter filter, list, Random route) stays behind "?". Its 3 layer hint: the third layer names the reagents
(the answer), so it now opens after one pick on the problem (the second hint says so). Finished card: Next problem,
Solve it backward, All problems, Full explanation (shortest route), Check yourself, lesson.

## Acid/base comparator, Conformation lab, Reaction predictor, Reagent roadmap
On the standard bar, "?" and menu; layouts otherwise unchanged. Judgment: their choices are already dropdowns
(substrate, reagent, start and target, molecule) or one-tap predictions whose result lands on the stage pills and
the caption with New pair / New question beside it; a finished card per one-tap round would add a click per round
for no gain, so none was added.

## Questions for the owner (nothing removed)
1. Reagent roadmap has four modes (Route, Reagent, Groups, Puzzle); the standard says at most three. Merge Groups
   into Reagent, or keep four?
Done along the way: captions that said "Why? has the reasoning" now name the Explanation button.

2. The arrow pusher's old ready-made chip list and the 13 resonance / spectroscopy chips stay in the page hidden (the
   dropdown drives them). Fine to delete that markup later?
