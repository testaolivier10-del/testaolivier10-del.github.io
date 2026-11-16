# AP® Chemistry tools in the standard frame (F3, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. `chem/assets/tools/chem-tools.js` mounts every chem tool with `std: true`
(`studioFrame`); `modes()`, `drill()` and `studioPane()` place the parts, so all 8 tools change from one place. Physics
(`phys-tools.js`, a fork) got the same code: `docs/tools-frame-notes/apphys.md`.

## What every chem tool got (course layer)
| Feature (before) | Where now |
|---|---|
| Title, back, "?" (Explanation), menu | bar: name, the page's one line, the two modes, Ask the tutor, Share, "?", menu |
| Explore / Test yourself switch in the dock | bar (second row on a phone); "Explore the buffer" style labels already read "Explore" |
| Second sheet (Numbers & setup, Setup, Element & table...) with its dock button | "?" opens it (same name); the menu has it too, as the settings |
| "Start here" cue (first line of Why) | the task's "what to do" line under the question the tool answers (`STD_ASK`); the cue itself is hidden |
| Explore live line, Explanation, Setup row (opens More options) | unchanged |
| Test yourself: Problem type select behind More options | the stage dropdown ("Any kind" and each type; the select stays, out of sight) |
| Problem text as caption (or on the stage when there is no figure) | the side panel's head: kicker = the problem's kind, the question, "Answer one step at a time." |
| Step hint shown under every step's label from the start | the hint ladder's first rung (instant on request); Show the answer is its last rung, open after one wrong Check (it used to appear after a wrong Check, as now) |
| Wrong Check: the slip notes on the step, the ICE row flash | unchanged (feedback on the step and the table) |
| After the last step: score pill, worked solution to Why (opened by itself), New problem, Keep going strip, Report | pill unchanged; finished card: score, New problem, Full explanation (worked solution, Keep going under it), Review your steps, Read the lesson; Why no longer opens by itself while the card shows (shared change, std only) |
| Problem code and link | Details as before; Share copies the problem's link in Test yourself |
| Locked Premium tool (Q vs K, Equilibrium and kinetics, Buffer drills) | lock card in the standard bar, via `data-ls-std` from `chem-core.js` |

## Per tool
- **Periodic trends and PES**: explore task; Table / spectrum / Across and down view chips, trend chips, Table setup row unchanged. Test yourself: kind dropdown, ladder, finished card.
- **Particle diagrams** (Build it, Pick the picture): Build it is a problem: the task asks its question; a right box (or Show the answer) now ends in a finished card (New problem, See your box, Atom tally). Pick the picture: drill as above; a one-step picture choice keeps its pictures on the stage.
- **ICE table drills**: explore task (x slider, Solve for x, Reaction row unchanged). Test yourself: rows typed in the table on the stage as before; the active row still flashes on a blank Check.
- **Q vs K** (Premium): explore task; particle counters and Let it react unchanged.
- **Equilibrium and kinetics simulator** (Premium): explore task; temperature, molecule counters, More (catalyst, challenge, graphs) unchanged. Test yourself (predict, then run): drill as above.
- **Titration curve reader**: explore task "Why does the pH jump all at once?" (the mockup's question); burette slider, Run, +1 drop, Setup unchanged. Its own arrangement (no studioPane) hid its cue through the shared fallback.
- **Buffer drills** (Premium): explore task; + OH⁻ / + H₃O⁺, Buffer row unchanged.
- **Units and significant figures** (Set it up, Test yourself): Set it up task (its "Start here" line, re-rendered per problem, is hidden by CSS and is the task's line). Test yourself (its own quiz, not `drill`): Habit select is the stage dropdown; task "Give the value with its units and the right significant figures."; finished card (verdict, New problem, Full explanation with Keep going, Review your answer, the lesson).

## Judgment notes
- The reaction / buffer / table choice in Explore stays behind the Setup row (it opens More options with the other settings); a second dropdown on the stage for it would show the same control twice.
- Format help a student needs to type an answer (units after the box, "Type each value in the I row", the volume slider note) stays visible; only the method hints moved into the ladder.

## New copy for the accuracy check
Explore questions (`STD_ASK` in `chem-tools.js`): buffer-drills "Why does a buffer’s pH barely move?"; equilibrium-kinetics "Which way does an equilibrium shift, and how fast does it get there?"; ice-table-drills "How far does a reaction go before Q equals K?"; particle-diagrams "What does this change look like, particle by particle?"; periodic-trends-pes "How does Coulomb’s law explain each periodic trend?"; q-vs-k "Which way will this mixture shift to reach equilibrium?"; titration-curve-reader "Why does the pH jump all at once?"; units-sig-figs "How do you set up a calculation so the units cancel?".
Finished cards: "Every step right on the first try.", "The worked solution shows each step.", "Value, unit and significant figures all right.", "What went wrong, and the answer, are in the full explanation.", "Your box is right.", "The answer is shown."

## Questions for the owner (nothing removed)
1. The hidden Problem type selects (behind the new dropdown) and the hidden "Start here" cues stay in the page; fine to delete that markup later?

## Accuracy check (F6b, 2026-11-16)
Checked against the tools and `docs/apchem-authoring-guide.md`.
- Correct as written: equilibrium-kinetics, ice-table-drills, particle-diagrams, periodic-trends-pes (Coulomb's law is
  how the course explains every trend), q-vs-k, titration-curve-reader (the owner's mockup question; the tool shows the
  jump at the equivalence point), units-sig-figs; "Give the value with its units and the right significant figures.";
  all six finished card lines.
- Changed: buffer-drills "Why does a buffer’s pH barely move?" to "Why does a buffer’s pH barely move when you add acid
  or base?" (the claim is about adding small amounts of acid or base, which is what the tool does; it says what the
  pH resists).
