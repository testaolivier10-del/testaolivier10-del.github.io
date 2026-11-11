# math1: AP Physics 1, AP Calculus AB and BC tool fixes (2026-11-10)

Branch `claude/tv-math1`, one commit per tool. Screenshots: `/home/claude/shots/build/{physics,calculus,calculus-bc}/`
(`<tool>_before.png`, `_after.png`, `_after_p.png`; area-volume also has `_after_flat`, `_after_sweep`).

## Physics: oscillator lab (FIX)
- Cause: on a desktop the pendulum scene's box is under 420 px wide, so it took the narrow crop (240 units) with
  24-unit labels; "ℓ = 1.00 m" and "On Earth, g = 9.8 m/s²" fell outside it.
- Change: the narrow crop now widens to fit both labels, and the planet line sits centered under the swing.
- Verified: no label outside the scene for all four planets and ℓ at its minimum and maximum, desktop and phone.

## Shared: `.tchip:hover` in `assets/course/tool-studio.css`
- The hover rule now skips selected chips (`:where(:not([aria-pressed="true"], .on))`, so specificity is unchanged).
- Verified: slope fields (light and dark) and Taylor lab keep the label on hover; Env Sci cycles, Human Geography
  city lab and Psychology development chips look as before.

## BC series lab (FIX)
- The Terms slider runs 1 to 40, then 10², 10³ ... 10⁶ (plus a "×10 terms" button). Past 40 the chart is S_N
  against N on a log axis, each power of ten labeled with its value, the guide ln N + γ (1/n) or ln(ln n) + C
  (1/(n ln n), C fitted at 10⁶) dashed; convergent series sit on their sum line, alternating ones show odd and even
  sums closing in. Up to 40 the bars view is unchanged. Details lists 1 to 10 and each power of ten.
- Values checked: H at 10⁶ = 14.3927 (ln 10⁶ + γ = 14.3927); Σ1/(n ln n) climbs 1.69, 2.33, 2.73, 3.02, 3.24, 3.42
  per decade; Σ1/n² at 10⁶ = 1.64493.
- A factorial series is not summed past where its terms drop below 1e-20 (fact(n) is a loop: 10⁶ of them hung the
  page in testing).

## AB related rates and BC parametric motion (caption lag)
- The chips were redrawn every frame, the caption four times a second. Now both come from the same frame, four times
  a second (the caption is a polite live region, so it is not rewritten every frame); the parametric clock chip
  still runs every frame. Verified on all four RR scenes and four paths: caption and chip numbers match.

## AB curve analyzer (FIX)
- Curves leaving a panel stop at the edge with a small arrow ("keeps going") instead of running flat along it, in the
  stacked graphs and the Optimize graph (soda can S′ at small r had the same flat run). The Optimize cursor dot is
  hidden when its value is off the panel, as the stacked graphs already did.

## AB Riemann sums (FIX)
- Table modes: no dashed curve and no Trend chip on the stage; Details keeps that area, labeled "one possible smooth
  f through these points (not given; a table cannot know it)".
- Flow context: the tank is about three times as wide (30% of the stage, 150 to 280 px).
- Done the optional part: slivers between each strip and the curve are shaded, amber where the sum misses area and
  pink where it counts extra; explained in Why.
- Phone: the tank is still narrow beside the graph (stage width); not changed.

## AB area and volume (FIX)
- Revolve opens on the flat region in 3D, its plane facing you, the axis lying the way it does on the 2D graph
  (horizontal for the x-axis and y = k, vertical for the y-axis and x = h). "Revolve it" (in the dock and on the 3D
  panel) sweeps the region 0 to 360 degrees; the swept surface, the turned region and the slice's washer grow with it,
  "Turned N° of 360°" shown. After the first sweep, a new region or axis shows the whole solid ("Revolve again").
  Reduced motion starts with the whole solid. Home (keyboard) returns to the new view.
- Cross sections: seen more from above (pitch 0.62), so the base and squares use more of the panel. They still fit
  for every turn of the solid, so a long flat base leaves height unused.

## Checks
`build-apcalc.mjs --check` (AB byte-identical), `build-apcalcbc.mjs --check`, `build-apphys.mjs --check`, the six
content and map checks, `node --test` apcalc, apcalcbc and apphys (386 pass), `check-site.mjs`: all clean.
Spec logs updated: `docs/apcalc-spec.md` decision 16, `docs/apcalcbc-spec.md` decisions log.
