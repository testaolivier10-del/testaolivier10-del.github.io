# Plan: AP® Biology, Graph builder (tools v2)

**Tool and page:** `bio/tools/graph-builder.html`; `bio/assets/tools/graph-builder.js` (428 lines), data
`bio/data/tools/graph-builder.json` (types line, bar, scatter; 6 datasets: `catalase-temperature`, `potato-sucrose`,
`agar-cubes` line; `fertilizer`, `yeast-sugars` bar; `seed-mass` scatter; most with error bars). Free (a skill tool).
Rollout row 47, group B, wave 5, size rebuild.

**The one idea:** the kind of variable on the x axis decides the kind of graph. Explore lets the student plot a real
data table by hand and see the right graph emerge; the graded step list moves to Test yourself.

## Research
- [Desmos graphing calculator, tables to points](https://www.desmos.com/calculator) (known, group row): typed table
  rows appear as draggable points at once; take "a row becomes a point the moment it exists".
- Khan Academy "Create a bar graph / line plot" exercises (known): drag the bar top to the value, snapping to the
  scale; take snapping and the forgiving target.
- PhET Graphing Lines (known): points dragged on graph paper with grid snapping. Builder: open these (rule 10).

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Plot the data mode: graded steps (type, axes, labels, scale, points, error bars), Check my graph; record `graph-builder:<dataset>` items; `#` deep link to a dataset | Test yourself part "Plot the data", same steps, grading and record ids; dataset links kept |
| Free plot (sketch): drag points or bars, +/− steppers, grid mode, Delete a point | Explore: the main screen (below), ungraded |
| Data set picker, Next data set | Explore: 3 dataset chips (one per graph type: catalase, fertilizer, seed mass); all 6 in Test yourself, log it |
| Type justifications (4) | Explore: one short line on the picture after the type is set ("temperature is continuous: join the points"); full set in Test yourself |
| "Read the lesson" link | "?" |

## Design
- **Picture:** an open lab notebook: the left page holds the experiment's data table handwritten in ink with a small
  drawing of the setup (a test tube in a water bath for catalase), the right page is graph paper with faint grid.
- **Main control (K.draw, new in the kit):** drag a table row onto the graph paper. It lands as a point (or bar) that
  snaps to the grid; the axes name and scale themselves from the column the student first dropped on each axis
  (drag a column header onto an axis). Wrong way round axes are allowed in Explore: the drawn graph then visibly
  reads oddly and the cause line says why.
- **Graph type:** follows the x column. With a continuous x the points join into a line as the second point lands;
  with categories they become bars; with two measured variables they stay unjoined. Error bars, when the table has
  them, draw on each point as it lands.
- **Animates:** the row lifts off the table and flies to its point; bars grow up from the axis; the line draws
  through the points.
- **Cause line:** "temperature on x → continuous → line graph → peak at 37 °C".
- **Takeaway:** "Categories get bars; a continuous variable gets a line."
- **Outside the picture:** dataset chips (3), purpose line, Show me how, cause line, Start over. About 25 words.

## Science to verify
- The graphing conventions in the CED science practice 3 (independent on x, labels with units, even scale, title)
  and the College Board lab manual's graphing appendix.
- Each dataset's numbers and error bars plausible (catalase optimum, potato sucrose isotonic point near 0.25 to
  0.35 M); they were authored, so recheck against the course's notes.
- Trap: a line graph joins means only when x is continuous; never draw a best fit curve the data cannot support.

## Reuse
`ApBioTools.studioKit2` with "Plot the data" as a practice style part with its own stage (the old step figure).
New shared piece: `K.draw` (drag from one thing to another with snapping, large targets, undo) in
`assets/course/tool-kit2.js`; build it here or in AP® Physics 1 free body diagrams, whichever starts first, and
document it in the kit header. Check `ochem/assets/push-board.js` for drag and snap code to reuse, never fork.

## Risks reviewers will likely block on
- Notebook on phones: the two pages stack (table above, graph below); a dragged row must scroll the graph into view
  or offer tap row then tap place.
- The thing the cue says to drag (a table row) must drag from anywhere on the row.
- Axis labels, tick numbers and point labels 4 px apart and 11 px minimum.
- Kit weight: `K.draw` must fit the `assets/course/kit2` budget (34 KB) or raise it with a measured note.
