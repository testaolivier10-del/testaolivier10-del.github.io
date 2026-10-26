# Batch w1025 (Sunday 2026-10-25 weekly batch, part 2): plan and status

STATUS 2026-10-25 ~8:50pm PT: steps 0 to 6 done (queue check, topics, scripts, Gate A fact check and human read
check applied). STOPPED before art: the laptop (Gemini in Chrome, device bridge) dropped off mid run
(Chrome extension and device bridge both unreachable). Rerun continues at spec step 7 (art) with this plan.
ElevenLabs key was staged; balance not yet read. Nothing voiced, nothing built.

Decision for review: the house look is flat layered (video standard section 0, 2026-10-25). The traced cast
(paramedic codechar/model.py, hoodie runner runner/model.py) are flat colour vector traces with two tones and a rim
light, so this batch uses them with NEW flat layered scenes (prompt core from characters/flat/README.md,
references characters/flat/ref_*.png). The jump girl (codechar/jump) is already the flat courtyard character.

## Videos (suggested posting order)
| # | id | course | format | hook type | cast | motion | special |
|---|---|---|---|---|---|---|---|
| 1 | w1025-01-power-lift | NREMT | skill demo / trap | cost of inaction | paramedic | CMU 26_09 (stoop, bend pick up), CMU 69_70 (squat pick up, 2.3 to 4.0 s) | series EMT traps #1 (make sfx/series_emt_traps.wav) |
| 2 | w1025-02-free-throw | AP Statistics (first) | myth vs fact | myth bust | jump girl (side rig) | CMU 124_04 free throw (shot near 4.6 s), looped shots; ball on a computed parabola, flat code ball | CTA spoken; long_reason: two linked ideas (gambler's fallacy, law of large numbers) |
| 3 | w1025-03-dead-zone | AP Environmental Science (first) | scenario, chain reaction | cost of inaction | hoodie runner as homeowner | CMU walk (e.g. 07_01) plus keyed scatter arm (upper layer) | experiment of the week: one continuous above and below water cut away scene |
| 4 | w1025-04-head-rush | A&P | why explainer | visual shock / curiosity gap | hoodie runner | CMU 13_01 (sit on high stool, stand up), keyed sway and calf raise | poll post: audience, "What are you studying for?" options "NREMT" / "An AP class" (upper middle free for 8 s) |

Scripts: scripts.json (final after Gate A). Gate A: gateA_brief.md (claims and motion lists). Fact check result:
all four pass; applied fixes: 01 "Feet shoulder width"; 02 end question states the independence assumption (real
free throw data show a small hot hand, Miller and Sanjurjo NBER w26510); 04 "sensors in his neck and chest" (carotid
sinus and aortic arch), "Gravity pulls" (not "just pulled"). Motion constraints from the check: 01 squat lever line
must be visibly shorter than the stoop's (bag between or just in front of the feet, no twisting); 02 simulation uses
independent Bernoulli draws at p 0.7 and must not land exactly on 70%; 04 pressure trace recovers in about 10 to 30 s
with no big overshoot. Human read check rewrites applied. Pronunciation: spoken "E M Ts", "levl prep dot com".
Lengths (estimate): 01 about 33 s, 02 about 36 s, 03 about 37 s, 04 about 31 s; trim on the real voice timing or
add long_reason.

Topic pages for tracked links: nremt/notes/lifting-and-moving-patients.html (?ref=yt-power-lift),
statistics/notes/simulation.html (law of large numbers; ?ref=yt-free-throw-due), environmental-science/notes/eutrophication.html
(?ref=yt-dead-zone), anatomy-physiology/notes/bp-short-term.html (?ref=yt-head-rush).

## Art plan (Gemini, flat layered, portrait 9:16, empty scenes: people are drawn in code)
- 01: fire station ambulance bay, bright morning daylight through the open bay door, ambulance parked, concrete floor,
  a big orange trauma jump bag on the floor at center left; plus a repaint without the bag (bag cut by difference).
- 02: outdoor public basketball court, late afternoon golden light, hoop and backboard on the right, free throw line
  on the left, chain link fence, trees; ball drawn in code as a flat two tone ball.
- 03: one tall cut away scene: a backyard lawn sloping down to a lake under dark storm clouds (top), the water line,
  and an underwater cut away below (sunlight rays, water plants, muddy bottom); then the same scene with a thick green
  algae bloom and murky water; then the same scene with a strip of tall wild plants along the shore. Fertilizer bag
  prop at the top of the lawn. Fish drawn in code as flat two tone fish matching the palette.
- 04: home kitchen in the morning, kitchen island with a tall bar stool, window light; plus a flat body diagram
  (front view figure, heart, arteries bright red, veins dark red, carotid in the neck, aortic arch in the chest,
  leg veins) on a soft blue background, every part with a named colour, no labels.

## Pinned questions (draft)
01 "Have you ever felt that twinge lifting something? What were you lifting?"
02 "What's a time you were sure something was due?"
03 "Is there a lake near you that turns green in summer?"
04 "When do you get head rushes the most?"
