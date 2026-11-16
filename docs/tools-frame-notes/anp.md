# A&P tools in the standard frame (F2, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`; A&P decision 99 in `docs/anp-spec.md`. No change to the shared layer. Everything
is in `anatomy-physiology/assets/tools/tool-kit.js` plus a few lines per tool:

- `AnpToolKit.studio` mounts with `std: true` and one line per tool (`LEDE` in tool-kit.js): name and line in the bar,
  modes in the bar, Ask the tutor, Share, "?" (the second tab, still named for what it holds: Topic & all loops,
  Formula & every step, Topic & options, Level & scenarios, Filter & options...) and the menu.
- `AnpToolKit.picker` (the item chooser every tool used as a dock row) is now ONE grouped dropdown at the stage's top
  left: the same groups, "3 of 89", a tick on done items, and a "More" group with "Search all n ..." (reopens the old
  searchable list, open with the cursor in its search box, for lists of more than 12) and the tool's full list view
  (onAll / allHref). The old disclosure is still built (the tool finds it) but hidden. The dropdown hides on a view
  with no chooser (lists, setup screens).
- `s.reset()` (each render) clears the finished card; the render that finishes sets it again.

Nothing a tool did before was removed. The A&P tools already had the standard's hint ladder: a first miss gets one
method hint with Try again or Show the answer (feedback loops, pathways, calculators), lab practical has Hint and
I don't know, 3D anatomy Show me / I don't know. They keep their own (it matches: hint first, the answer after a real
try), so `s.hints` was not wired in. Their live caption stays the "what to do" line (as five ochem tools in F1).

| Tool | What changed |
|---|---|
| Feedback loop builder | Loop dropdown (49 loops by chapter, All loops); a built loop ends in a finished card (score, Next loop or Build it again, All loops). Watch it work, cut a part, Test yourself steps unchanged. |
| Worked-example calculators | Calculator dropdown (89 by group, Search all). Calculate / Practice, sliders, picture, formula and every step under "?", practice record unchanged. |
| Graph reader (Premium) | Graph dropdown (Search all, the list). Explore / Quiz, What if, phases and regions unchanged. |
| Pathway tracer (Premium) | Pathway dropdown (208, Search all, the list). Order / Missing step / Spot the error, figure tracing unchanged. |
| Virtual lab practical (Premium) | Image set dropdown (83, Search all, all sets by chapter). Explore / Study / Quiz / Timed kept as four modes (each distinct). Quiz and timed results end in a finished card (score, Retry the missed or New practical, the next lesson); the breakdown and every station stay on the stage. |
| Predict the change (Premium) | Scenario dropdown; a session's summary ends in a finished card (score, Retry the missed or Choose new scenarios, the next lesson). |
| Word root builder | Decode / Build / Part bank in the bar; no item list (terms are dealt), so no dropdown. |
| 3D anatomy (Premium) | Explore / Study / Quiz / Timed in the bar; a quiz round or practical ends in a finished card (score, Retry the misses or New round, Every question under Explanation); misses still glow on the model. |

Checked at 1440 and 390, light and dark, first load, mid use, a finished quiz (lab practical, 3D anatomy by script), the
Search all path; Premium tools both locked and unlocked (premium.js with LAUNCHED false, test only).

## New copy for the accuracy check
Only the one line per tool in `LEDE` (tool-kit.js) and the finished cards' fixed words ("Every part in its place.",
"A clean sweep. Try a higher level next." reused from predict, "Missed structures glow on the model..." reused from
3D anatomy). No new science.

## Questions for the owner (nothing removed)
1. Lab practical and 3D anatomy have four modes (Explore, Study, Quiz, Timed). The standard allows four when each is
   distinct; they are. Keep?
2. Very long lists (pathways 208, predict scenarios, calculators 89) are now a native dropdown with "Search all" as a
   choice. Fine, or should the searchable list stay visible?

## Accuracy check (F6b, 2026-11-16)
Checked the eight `LEDE` lines and the three finished card lines against the tools.
- Correct as written: calculators, graphs, pathways, lab-practical, predict, word-roots, anatomy-3d; "Every part in its
  place.", "A clean sweep. Try a higher level next.", "Missed structures glow on the model...".
- Changed: feedback-loops "See how the body pulls a variable back to its set point." to "See how feedback loops pull a
  variable back to its set point, or push it further." (the builder has 5 positive loops, such as labor and clotting,
  which amplify the change instead of reversing it).
