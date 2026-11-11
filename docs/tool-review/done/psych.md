# AP Psychology tool fixes: done (task psych, 2026-11-10)

From `docs/tool-review/psychology.md` (FIX: conditioning lab, development, memory lab, neuron; the six LEAVE tools
untouched). Shots: `/home/claude/shots/build/psychology/` (`<tool>_before.png`, `_after.png`, `_after_p.png`, plus
`conditioning-lab-consequences_*`, `development-test_*`, `memory-lab-list_after.png`, `neuron-synapse_*`). Checked at
1280x800 and 390x844, light and dark. No accuracy flags were raised by the review; none found in the build.

## Conditioning lab (`conditioning-lab.js`, `.css`)
- Schedules: each cumulative record is now scaled to its own schedule (FR 0-600, FI 0-250, VR 0-1,200), so FR's
  stair steps and FI's scallops show. "Show the other three schedules, faint" keeps all four on one scale (the axis
  title says which), so slopes still compare rates there. New close-up panel: the last two minutes magnified at a
  fixed scale per schedule, following the pen while playing, with the mark named on it (FR "pause" and "run", FI
  "slow" and "fast", VR and VI "no pauses"); the window is shaded on the main record. Phone: box and close-up side
  by side above the record.
- Consequences: the example is drawn as three panels: the behavior (ten drawings: seat belt, broom, texting,
  "No!", aspirin and water, homework, hot stove, house at night, raised hand, dirty plate), what happens (the
  consequence pops in when added; fades and is crossed out when removed; badge "+ Added" or "- Removed" with
  pleasant or unpleasant) and next time (five bars rising or falling with an arrow). The 2x2 grid stays below as the
  answer, smaller. Reduced motion: end state. Bug fixed: the Schedules "Presses" pill stayed on Consequences.

## Development (`development.js`, `.css`)
- Attachment: the child now acts out each pattern (Ainsworth; Main and Solomon for disorganized): secure cries and
  reaches toward the door, sits upset, then reaches up to the parent (heart) and calms; avoidant sits playing with
  the blocks, back to the door, in all three panels and ignores the return; anxious screams with arms up, cries
  sitting, then pushes against the parent angrily; disorganized freezes ("?") and comes near with the head turned
  away. New poses (arms up, push, play, sit on the floor, crying); panel notes reworded to match. The parent no longer
  runs off the left of panel 1; panels are taller.
- Test yourself: the lifespan figure on desktop is the scene full width with the lane below (it was a 230 px scene
  beside a one-lane strip in a large empty stage). Phone layout unchanged.

## Memory lab (`memory-lab.js`, `.css`)
- Interference: below the timeline (kept, compacted, now a row on phones too) the recall going wrong: the story's
  situation ("Standing at the new locker."), a person who "Means to say" the wanted memory (dashed, cerulean) while
  "What comes out" is the intruder (vermillion), which flies in from its timeline card when the choice changes.
- List: the class curves and the primacy and recency bands appear only once your recall is scored; before that the
  chart says what to do and that the curve comes after.
- The empty recall card said "Use the box below the picture" at desktop widths; it now says the box is at the right
  when the dock is beside the stage.

## Neuron (`neuron.js`, `.css`)
- Fire: the clock slows while a spike crosses the axon (3.2 model ms in about 1.7 s, node to node; a held stimulus
  slows only for its first spike so the run stays short); a time cursor runs on the trace and a dashed line ties the
  travelling signal to it. Reduced motion: end state, as before.
- Synapse: the parts scale with the stage (up to 2.2x: vesicles, transmitter and drug molecules, receptors,
  transporters, a wider cleft); the close-up takes 64% of the stage. The test figure uses the same drawing.

## Checks
`node scripts/build-appsych.mjs --check`, `check-appsych-content.mjs`, `check-appsych-map.mjs`,
`node --test scripts/test/appsych*` (152 pass, 0 fail) and `node scripts/check-site.mjs` (OK): all clean after the last tool commit.

## Not done
- The development Test yourself figure for attachment items still shows the lifespan lane (not the strange
  situation); the review asked only for size.
- Memory lab phone interference: the person and bubbles are small but readable at 390 px.
