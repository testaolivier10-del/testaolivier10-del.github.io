# Tool fixes build: AP Environmental Science (task env, 2026-11-10)

Branch `claude/tv-env`, one commit per tool. Screenshots: `/home/claude/shots/build/environmental-science/`
(`<tool>_before.png`, `_after.png`, `_after_p.png`). Checks: `build-apenv.mjs --check`, `check-apenv-map`,
`check-apenv-content`, `node --test scripts/test/apenv-*.test.mjs` (184 pass), `check-site.mjs`: all clean.

## Course-wide: Test yourself figures fill the stage
`env-tools.js`: `ApEnvTools.figSize(W, H, o)` gives a drill figure the stage's shape (width kept, height grown to the
stage, capped by `o.max`, room kept for the try card); `drill(o.refit)` redraws the figure when the stage first shows or
changes size. Used by every tool's drill figure. Fixed-layout figures (budget bar, pH strip, CO2 bars, percolation ring)
are drawn narrower instead so they scale up. Phone layout unchanged (the phone stage is wide and short, so H stays).

## Per tool (FIX)
- **Energy flow**: opens on log widths (header comment now true); "to scale" second in More options. On the log scale the
  loss is written beside each step ("−90% as heat", shorter where tight). `big()` never prints `5.00000e+6` (commas up to
  10^15), the reverse solution prints `÷ 0.0001` not `1.00e-4`; checked over 400 seeds x 6 types.
- **Earth and climate, Winds**: rebuilt. The globe with its atmosphere drawn thick on the lit edge; six loops of air
  (Hadley, Ferrel, polar) bent around it, turning the right way, arrowheads on every leg and air parcels moving along
  them (none in reduced motion or the drill); cloud and rain at 0 and 60, sun at 30, "Air rises: rain / sinks: dry"
  outside; belts named on the globe (Rainy, Deserts, Wet, stormy); surface winds kept. The balloon is a drawn weather
  balloon (envelope, string, box) riding the surface leg of its cell; drag works on the globe and on the air. Drill
  figure uses the same scene and still reveals answers step by step. Light, dark, 390 px checked.
- **Air pollution, Acid rain**: the nine animals are drawn (snail, clam, bass, crayfish, mayfly nymph, trout, salamander,
  perch, frog) in a wider, deeper lake at the x of the lowest pH each survives, with a pH ruler under the lake and the
  lake's pH as a dashed line; those that cannot live there fade and are crossed out. Drill: the buffer step now shows
  the same rain on a granite lake and a limestone lake (pH shown once answered). Smog, inversion, percent figures fill.
- **Climate change, Sea level**: the coast is drawn to one vertical scale: ground elevation in meters, five 3 m houses at
  0.6 to 8 m, the sea fills up the slope to the new level (0.15 m wets nothing, +7.55 m floods 4 of 5), a rise bracket,
  "n of 5 houses flooded"; the ice sheet is a dome on the high ground.
- **Energy chain**: wide screens draw the plant as its machines standing on the ground in a row (fuel, boiler or reactor
  or rotor, turbine, generator, pylon, house) joined by pipe, shaft and wire, the band running below. Phone layout kept.
- **Population growth**: the J-curve stops at the top edge with an arrowhead and "off the chart: N by year t"; the
  marker dot is not drawn off the chart. The deer herd is drawn on its island in the graph's corner (one deer per tenth
  of K, grass browning over K or after overgrazing).
- **Water pollution**: Play and Day 0 now hide in Heat and Sewage (the studio's primary group undid `hidden`; the tool now
  sets `data-off`). Sewage stages are drawn tanks: bar screen with trash, settling tank with sludge hopper, aeration tank
  with diffuser and bubbles, sand and gravel filter, UV channel; water colored by that stage's outflow; fish in a clean
  river. The drill's plant figure uses the same tanks.
- **Calculation studio**: the chain no longer overlaps the question and tray when Explanation squeezes the stage (stage
  children never shrink, the stage scrolls with `safe center`, and a narrow stage stacks the picture above the question
  via a container query). Phone scene no longer cropped (meet, sky behind).

## Accuracy flags
- **Energy chain, wind "waste heat"**: verified against Betz's law (Wikipedia, "Betz's law": at most 16/27 of the wind's
  kinetic energy can be captured; the air leaves with a reduced, nonzero velocity). The rotor's loss is now drawn blue and
  labeled "left in the wind", the headline says "55.0 stay in the wind that passes the blades and 6.0 leave as heat". The
  model's `lost` text already said so. Solar: the cell's loss is mostly heat in the panel plus some reflected light; the
  model's text already says "reflected or turned into heat", left as is.
- **Cycles, Pave land**: verified wrong as a global picture (impervious surface is about 0.43% of land, Elvidge et al.
  2007). Model unchanged; the change now reads "an exaggerated case: as if all land were paved like a city" and the
  explanation gives the real share. The fertilizer note says the nitrogen stores are a relative sketch. Recorded in
  `docs/apenv-needs-author.md` for a teacher to choose a fix.

## Also changed (sizing only, LEAVE tools)
Cycles, soil texture (bigger jars, ring), age structure, dose-response: drill figures fill the stage.

## Not done
- Soil texture: horizon captions still cut off in the Test profile ("where most ro"), and the jar the header promises is
  not in Explore (LEAVE tool, small).
- Age structure phone hint ring and dose-response axis (LEAVE notes) untouched.
- The energy-chain drill's chain band and the calculation studio's "givens as cards" figure fill the stage but keep their
  old drawing.
