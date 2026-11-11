# AP Precalculus: cleanup round (pass 3, 2026-11-11, builder c8)

Judge file: `docs/tool-review/pass2/judge-c.md`. Screens: `/home/claude/shots/pass3/precalculus/<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`. Counts are on the opening screen: P / L / N / C / W = pictures / labels on the
picture / live numbers / controls showing / words outside buttons. No fact, answer or scoring changed.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| Function lab | FAIL. 1 / 8 / 1 / 17 / 35. Ten parent chips, a/b/h/k tabs, slider, two buttons; three dotted mapping lines and five marker types; phone coach covers the graph. | The ten parents are one "Parent function" menu. One mapping at a time: only the key point under the round handle (or the (h, k) corner while it is dragged) shows its parent point and dotted line; the other key points' images are gone from the picture and every mapping stays in the key-point table in Numbers & details. Legend swatch now matches the handle's color. | PASS. 1 / 6 / 1 / 8 / 30. The phone coach is the shared builder's. |
| Regression lab | FAIL. 2 / 5 / 1 / 16 / 40. Seven data chips and seven model chips; coach on the explanation. | Data sets are one "Data" menu, so the models are the one row of chips (the main action). The coach now lands below the models, clear of the explanation. | PASS. 2 (graph and residuals, the idea) / 5 / 1 / 9 / 35. The model chip row gets the shared "More". |
| Exp and log lab | TOUCH UP. Seven busy columns with +3 / x1.5 under each; phone table about 9 px; halo covers "Rate m". | One column in focus: the step tags show only under the chosen step and the other columns are dimmed (tap one to move the focus). Phone table text 12 to 13 px. | PASS. The slider halo is the shared builder's. |
| Polar graphs | TOUCH UP. Doubled pink and green outline reads as a glitch. | The curve is one stroke colored by its band (moving away green, moving toward pink), dashed where r < 0; no glow under a blue line, so a retraced rose shows one outline. The r < 0 key swatch is neutral. | PASS. |
| Polynomials and rationals | TOUCH UP. No visible first action; three rows of similar controls. | Opens with no factor chosen and the caption "Tap a factor below, or drag its pin on the x-axis, to see what it does to the graph." The Zero / Asymptote / Hole row and multiplicity appear after a tap. | PASS. 1 / 8 / 2 / 4 / 20. |
| Rate of change | TOUCH UP. Six context chips; coach covers the first rate bar. | The six situations are one "Situation" menu. | PASS. 2 (linked) / 10 / 6 / 8 / 30. The coach over the first bar is the shared builder's. |
| Sinusoid builder | TOUCH UP (lead: dense). Phone "a =" and "y = 20" sit on the curve, period labels tiny; desktop "a = 10" half hidden. | The a, midline, period and start labels are drawn on top of the curve (with their halo), not under it; phone labels 14 px; the four situations are one menu. | PASS. 2 (linked) / 8 / 4 / 7 / 30. |
| Symbolic steps | PASS (legend 5 items). | Left. | PASS. |
| Unit circle | TOUCH UP. Phone circle about 140 px and the coach covers it. | Not changed. Tried a tighter phone layout: the circle and the graph share one vertical scale (sin is the circle's height), the stage is 425 px tall, and the gain was under 5%. The covering coach is the shared builder's fix. | TOUCH UP until the shared coach fix; desktop passes. |
| Vectors and matrices | TOUCH UP. Path plus x(t) and y(t) panels on open; phone panels cramped. | The path fills the stage on open. A "Show x(t) and y(t)" button in the legend row brings the two graphs back (and they are always on in Interval, whose secants are drawn on them). | PASS. 1 / 6 / 2 / 10 / 20. The five path chips get the shared "More". |

Checks: `build-apprecalc.mjs --check`, `check-apprecalc-content.mjs`, `check-apprecalc-map.mjs`, all
`apprecalc*` tests, `check-site.mjs`, `check-weight.mjs`: clean.
