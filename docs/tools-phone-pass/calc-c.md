# Phone pass: AP® Calculus AB accumulation, slope-fields, area-volume (2026-10-13)

Rules: `docs/tools-phone-pass.md`. Checked at 360×740, 390×844, 740×360 and 1280×800, light and dark, Explore, every
drill kind, drills solved end to end, the Enlarge view. Files touched: `calculus/assets/tools/{accumulation,slope-fields,area-volume}.{js,css}`
(and `math/area-volume.js` for one feedback message, see `docs/apcalc-reviews/tools-c.md`). Validators and tests pass;
no console errors, no horizontal scroll. Screenshots (scratch, temporary):
`/tmp/claude-0/-home-claude-testaolivier10-del-github-io/1e00213e-3bb5-50fc-a8ac-0b1f2469eb3d/scratchpad/calc-c/{before,after}/`
(`<tool>-explore-<vp>-<theme>.png`, `<tool>-q-<kind>-<vp>-light.png`, `<tool>-solved-<kind>-<vp>-<theme>.png`,
`<tool>-enlarge*.png`).

Shared to all three: SVGs are drawn 1:1 at their box size, and under `.ls-phone` tick numbers are 12.5 px and axis
names 14 px; every drag handle has an invisible 44 px hit circle.

## Accumulation

- **Explore:** before, f and g side by side, each about 150 px wide with 9 px numbers (`before/accumulation-explore-p360-light.png`).
  Now g sits under f at every size (x-axes aligned), each full width; f is drawn to scale so the semicircle is round;
  tick steps adapt to the height; captions hidden on phones (the caption bar says the same). Unit 8 tank: the tank is a
  104 px column beside both graphs, drawn by a new compact tank (amount 16 px, unit 12 px) when narrower than 140 px.
  The lower-limit label "a" moved to the bottom so it no longer covers the y-axis name.
- **Drill:** the graph was a fixed 540-wide SVG scaled to about 8 px text; now drawn at the stage size, to scale, with
  the name of f clear of the end point. Tank kind: the rates graph is drawn at its size and the tank uses the compact
  drawing (before, 4 px text: `before/accumulation-q-tank-p360-light.png`). Captions keep 46 px clear of the Enlarge
  button; on a phone on its side the caption is hidden (it repeats the stem) and the figure fits the short stage.
- Left: on a phone on its side the tank drill's graph is small (stage about 120 px tall under the stem); Enlarge fixes it.

## Slope fields

- **Match the field:** a 2×2 grid of squares sized to the stage (about 165 px each at 360 px; 290 px on desktop),
  darker and thicker segments, more of them when large. Before: stretched rectangles with faint lines. Field 4's
  bottom-right corner still sits under Enlarge at 360 px: keeping it clear would shrink every field below 150 px.
- **Fields drawn square:** drill fields (slopes, sketch, concavity, separation) are square, so slopes read at their
  true angle; Explore widens the view along the longer side instead (more field, equal units) and scales the field
  density with the stage width.
- **Exponential models:** a 40 px strip is kept clear under the graph on phones, so "t (days)" and the last tick no
  longer sit under Enlarge; 4- and 5-digit ticks read 2k, 10k (before, "10000" was clipped at the left edge).
- Sketch and Explore handles: 44 px hit circles.

## Area and volume

- **Explore (Revolve, Cross sections):** on a phone held upright the region is above and the solid below, each full
  width (before, two 175 px columns). Area mode keeps the full stage for the region.
- **The finished 3D solid** (drill, after the volume step): on phones it stacks under the region, about half the stage
  (before, a 175 px column: `before/area-volume-solved-washerOther-p360-light.png`). The renderer now fits the solid's
  projection to the canvas at every yaw instead of a sphere fitting the smaller side, so a long solid is about 1.5 to
  1.8 times bigger on every screen (desktop included).
- Curve labels in the drill moved off the slice strip; slice handle 44 px hit circle.
- Left: in the solved state on a 360 px phone the region above the solid is only about 110 px tall, so its labels
  crowd; the region was already read before the solid appears, and Enlarge shows both large.
