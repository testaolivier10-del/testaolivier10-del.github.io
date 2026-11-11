# AP Chemistry tool fixes: done (2026-11-10)

Builder `chem`, branch `claude/tv-chem`. Four FIX tools from `docs/tool-review/chem.md`; the four LEAVE tools were
not touched (titration shares the live beaker; its flask view was checked unchanged). Shots:
`/home/claude/shots/build/chem/<tool>_before.png`, `_after.png`, `_after_p.png`.

## Q vs K (and the shared jar, `live-beaker.js`)
- Particles were placed on a grid sized only by count, so molecules nearly filled their cells and touched end to end
  (chains like "A B A A"). Now the grid takes the shape of the widest molecule the beaker draws (`extentOf`), the
  layout with the largest molecules wins (staggered rows preferred), tilt and jitter are small and the scale keeps a
  clear gap. New test in `apchem-beaker.test.mjs`: six species sets, four seeds, no two molecules' atoms within
  4 units. Gas jars use the space up to the stopper.
- Q vs K's jar holds 42 (3 x 14, the per-species cap), so what the student counts always equals the counter;
  before, 37+ particles were silently scaled to 36.

## ICE table drills
- Explore now has the ICE table on the stage: I row, C row in x with this x worked out, E row as "initial - x" and
  the number, labelled "At this x" until Q = K, then "Equilibrium" (green). x shows in the table corner. Wide stage:
  table over the bars, jar full height beside; phone: table, then bars and jar side by side, Q-K gauge across.
- One particle = top value / 9 (was / 12), max 22 (largest total over 400 seeds per context: 21), so molecules
  are larger. Bar value labels are dropped on phones (the table beside carries them).
- Verified: H2 0.732, I2 0.964, solved x 0.640 gives E 0.092, 0.324, 1.28 and Q = 1.28^2/(0.092 x 0.324) = 55.0 = K.

## Buffer drills
- + OH- / + H3O+ now drop a labelled particle into the beaker (0.9 s), ring the HA (or A-) it reacts with, swap
  it to A- (or HA) in place and leave as labelled H2O that floats off; the pH marker moves on landing. Reduced
  motion and past-capacity taps (no one-for-one swap) draw the end state. `ApChemBeaker` `state.incoming`.
- Volume numbers moved outside the glass (marks on the wall). Wide stage: beaker and graph side by side, graph
  drawn taller. Beaker max 36 (20 + 16 leftover), so nothing is scaled.
- Verified: acetic acid buffer, one 1.0 mmol OH- tap: 4.74 + log(11/9) = 4.83, matches the meter.

## Equilibrium and kinetics
- Test yourself graph was 320 x 80 px (the generic `.cd-fig svg` 320 px cap); now full width, 150-230 px tall,
  drawn at its box's size. Explore (wide): vessel full height, graph fills its column. Graph left margin 44 -> 54
  so the axis title clears the ticks on a phone.

## Accuracy flags
- The flags in the review (titration "Neutral" badge at pH 6.59, periodic trends radius footnote) are on LEAVE
  tools, so they were not changed here; they remain for the lead. No number in the four tools was changed; the
  values touched above were rechecked by hand.

## Checks
`build-apchem.mjs --check`, `check-apchem-content.mjs`, `check-apchem-map.mjs`, all 11 `apchem-*` test files,
`check-site.mjs`: clean.

## Not done
- "I" atoms read a little like "1" at small sizes (the highlight crosses the letter); pre-existing, all tools.
- The ICE jar and Q vs K molecules are smaller than before (scale 0.75 to 0.9 vs about 1.0): the price of a
  visible gap; still readable at 390 px.
