# AP® Psychology tools in the standard frame (F5a, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. All 10 tools share `psychology/assets/tools/psy-tools.js` (`ApPsychTools`), a
fork of the APES framework; the same frame changes went in there (table in `docs/tools-frame-notes/apes.md`:
std bar with lede, Share and "?", Explore task with the cue as its "what to do" line, the kinds dropdown on the
stage in Test yourself, the hint ladder per step, the finished card, `stagePick`). Nothing a tool did before
was removed. Premium is not on sale for Psychology, but the tools render locked for a signed-out visitor: the
lock card under the std bar was checked, and every tool unlocked (local test route) at 390 and 1440, light and
dark, first load, Test yourself, a wrong try, finished and the "?" sheet.

Psychology only:
- The drill had no method hints: a step's own `hint` (stats, memory, sensation formulas) was always shown under
  its label. It is now the first hint of the ladder (one tap; a wrong try opens it), and steps without one get a
  `methodOf` line by kind (new copy below). "Show the answer" still opens only after a wrong try.
- A wrong choice now says "Not this one. Use the hint, then check again." (was "Recheck the arithmetic.", wrong
  for a choice).

## Per tool (Explore task title; what moved; judgment)
- **Article analysis studio**: "Find each part of a research study." The study select (in More options) is the
  stage dropdown; the Setup row is now "Settings: Run it again with new numbers". Parts A to F, the paper, the
  self-check cards unchanged. No finished card: it is a reading guide with self-checks, not a scored task.
- **Brain map**: "Learn what each part of the brain does." Map / Split brain, Outside / Inside stay segmented;
  labels, Find a structure and fMRI tasks stay in settings (they change the view, not the scenario).
- **Conditioning lab**: "Watch learning by association and by consequences." The Consequences example select
  keeps its ‹ › row in the panel (a stepper through examples; a dropdown on the stage would split it).
- **Development**: "Follow development across a lifetime." Four lens chips stay.
- **Evidence builder**: "Back a claim with evidence from two sources." The question select is the stage
  dropdown; Setup row "Settings: New numbers, or start the answer over". New: a finished card when an answer
  earns all 7 points (Next question, Your answer as a reader sees it, Keep working on this answer); it goes away
  if the answer changes.
- **Memory lab**: "Test your memory, then see why you forget." The interference story select is the stage
  dropdown in that view; the Setup row hides there (it held only the story).
- **Neuron**: "Fire a neuron, then see what happens at the synapse." The neurotransmitter select is the
  Synapse view's stage dropdown; the Setup row shows only in Fire (stimulus pattern).
- **Sensation and perception**: "Detect a faint signal, then see what shapes what you sense." The figure select
  (Perceive view) is the stage dropdown; the Setup row hides in that view.
- **Social influence**: "See how the situation changes what people do." Four situation chips stay.
- **Stats lab**: "Read percentiles, centers and correlations." Test, Data set and Variables are each view's stage
  dropdown; the Setup row shows only in Correlation ("Line of best fit").

## New copy for an accuracy check
- The 10 task titles above.
- Generic method hints (`methodOf` in psy-tools.js): choice "Find the key detail in the scenario first. Rule out
  the options it does not fit, then pick the one that matches the definition."; number "Find the numbers you need
  in the problem or on the picture, then do one operation at a time."; unit, table and graph lines as in APES.
- Evidence builder finished card: "Every point earned." / "A claim, two pieces of cited evidence, and each one
  explained with a concept and linked back to the claim." (check against the EBQ rubric wording).

## Questions for the owner (nothing removed)
1. The step hints that used to show under every step (the formula) are now one tap away as the first hint. Keep
   that (it matches APES and the spec) or show formulas always?
2. Views (Classical / Schedules / Consequences, Detect / Weber / Color / Perceive...) stay segmented in the panel.
