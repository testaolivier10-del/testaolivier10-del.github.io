# AP Psychology: tool purpose review (2026-11-10)

Every tool in `psychology/tools/` opened at 1280x800 and 390x844, every scene, chip and preset used, at least two
Test yourself items per tool answered (wrong first, then shown). Screenshots: `/home/claude/shots/review/psychology/`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Article analysis studio | Where each AAQ part is answered in a study, and what earns the point | LEAVE | A reading and writing tool; the study laid out with lit sentences and tags is the right picture. |
| Brain map | Where each structure is and what it does; contralateral control; split brain | LEAVE | Tap, damage hatch, body figure and split-brain flash all teach. Small: the temporal lobe is drawn very large, running under the parietal and occipital lobes. |
| Conditioning lab | Classical acquisition, extinction, recovery; schedule shapes; the four consequences | FIX | Classical is very good. Schedules: the y axis is fixed at 1,200 presses for every schedule, so FR's pause and run steps are invisible and FI's scallops are faint. Consequences: four text boxes with a dot; the example is never pictured. |
| Development | Piaget and Erikson stages across a life; attachment patterns; parenting styles; the aging mind | FIX | Lifespan, Parenting, Aging mind work. Attachment: the child looks the same in every pattern; only the captions differ. Test figures are thumbnails in an empty stage. |
| Evidence builder | Build an EBQ answer from sources: claim, cited evidence, concept, reasoning | LEAVE | A writing tool; sources as the exam shows them, scored live. |
| Memory lab | Serial position; spacing beats massing; proactive vs retroactive interference | FIX | List (run on you) and Forgetting work. Interference is three boxes of numbers with a curved arrow. The empty recall card says "Use the box below the picture" though on desktop the box is in the dock. |
| Neuron | Threshold and all-or-none firing; what agonists, antagonists and reuptake inhibitors do at the synapse | FIX | The action potential crosses the axon in about 150 ms, before the eye catches it, and the trace is already fully drawn: the picture and the trace are not in step. Synapse molecules are a few pixels. |
| Sensation and perception | Signal detection; Weber's law; opponent afterimage; depth cues and Gestalt | LEAVE | Criterion, JND patches, the real afterimage and the cue drawings all work. Small: retinal disparity's two "eye sees" views are tiny insets. |
| Social influence | Classic results (Asch, Milgram, Darley and Latane, facilitation, loafing) and what changes them | LEAVE | Scenes plus published numbers, all checked against the sources. |
| Stats lab | z scores and the normal curve; mean vs median with an outlier; correlation | LEAVE | The graphs are the concept and react well. Small: in Center the dot plot uses a thin strip of a large stage. |

LEAVE 6, FIX 4, REDESIGN 0.

## Notes

**Conditioning lab.**
- Schedules (`conditioning-lab_d_02_fi.png`, `_01_frmid.png`): FI makes 234 presses and VR 1,026 on the same 0 to
  1,200 axis, so FI's record is a low, slightly wavy line and FR's is a straight line. The schedule's shape is the
  lesson. Scale the axis to the schedule (or zoom into two minutes) so FR shows a run, a flat pause at each tick,
  another run, and FI a clear scallop. Keep the faint other schedules for comparison.
- Consequences: the 2x2 grid of words is the blocks pattern. Keep the grid small as the answer, but draw the example
  above it: the driver, the beeping (a speaker with sound waves) that is removed when the belt clicks, and a
  behavior arrow going up. "Added" and "removed" should be things the student sees appear or vanish.

**Development, Attachment** (`development_d_01_avoid.png`, `_02_disorg.png`): panel 1 says "Upset, protests" or
"Little distress" but the child is drawn the same standing pose. Draw the reaction: secure cries when the parent
leaves and reaches up and calms on return; avoidant keeps playing with the blocks, back to the door; anxious
clings then pushes away; disorganized freezes half turned. Test figures (the Aiden timeline) are 200 px wide in an
empty stage.

**Memory lab.**
- Interference: show the recall going wrong. The person tries to say the new combination and the old one comes out
  (for proactive), or tries the old one and the new one comes out (retroactive), with the intruding memory in
  vermillion moving into the recall slot. The arrow and the three cards can stay as the timeline.
- List: the class curve is drawn before you study, so the result is given away before the experiment runs on
  you. Show it after "Done: score my recall".
- "Use the box below the picture" (`memory-lab.js` line 291) is wrong at desktop widths.

**Neuron.** Slow the travel to about one to two seconds, with the depolarized patch jumping node to node and a time
cursor on the trace moving with it, so the student sees the spike happen where the signal is. In Synapse the
transmitter and drug molecules are a few pixels in a large stage; draw the cleft bigger.

**Phone.** All ten reflow and work. The phone stats Center dot plot and the neuron are small but readable.

**Accuracy.** Nothing wrong found. Checked: Asch 32% at 8, about 6% with a partner; Milgram 65/62.5/40/30/20.5/47.5/10;
Darley and Latane 85/62/31; Michaels pool shots; Latane, Williams and Harkins 82%/74% (pseudo-groups); normal-curve
bands and 99.62% at z 2.67; reuptake inhibitor (cocaine) and antagonist (haloperidol) examples.
