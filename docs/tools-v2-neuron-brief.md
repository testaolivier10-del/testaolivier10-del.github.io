# Tools v2: AP® Psychology Neuron (brief and build notes)

Status file for the v2 rebuild of `psychology/tools/neuron.html` (Free, group P, rollout row 29). Standard:
`docs/tools-v2-standard.md`. Branch `claude/tools-v2-neuron`, cut from `claude/tools-v2-all`, with
`claude/tools-v2-brain-map` merged in (the AP® Psychology kit2 adapter is the brain map's `ApPsychTools.kit2` in
`psychology/assets/tools/psy-tools.js`; this tool uses it unchanged). Not merged: an independent review comes first.

## The one main idea
**A neuron fires only when its input passes threshold, and then it fires all the way.** CED topic 1.3 (The Neuron
and Neural Firing): threshold, the all or none action potential, the refractory period, myelin and saltatory
conduction, excitatory and inhibitory input, the synapse, reuptake, agonists, antagonists and reuptake inhibitors.
The sodium-potassium pump is out of scope (CED exclusion) and is left out of the picture.

## Research (rule 10): what exists and what we took
| Source | How it works | What we took |
|---|---|---|
| PhET, Neuron (teacher guide and the design write-up "Neuron simulation: allowing students to visualize the invisible", University of Colorado; read as text, the sim itself not run) | A "Stimulate neuron" button; a zoomable axon cross section with Na⁺ and K⁺ ions, gated and leak channels; a voltage chart; the action potential travels along the axon | Ions moving through drawn channels, tied to the trace; only a few ions cross (the PhET interviews found students overestimate how much concentrations change); no pump drawn (students wrongly credit it with restoring rest) |
| OpenStax Psychology 2e, 3.2 (read) | Text and figures: rest about −70 mV, threshold about −55 mV, all or none, nodes of Ranvier ("leapfrog"), reuptake, agonist and antagonist | The numbers and the words |
| OpenStax Biology 2e, 35.2 (read) | EPSPs and IPSPs summed at the axon hillock; Na⁺ in, K⁺ out; saltatory conduction | Excitatory and inhibitory input added before the neuron decides (tab 1); the recording site is the start of the axon |
| The old LevlPrep neuron (origin/main) | Stimulus slider and Stimulate in the side panel; Fire and Synapse scenes; pulse, pair and held patterns; tap a part | The model (`math/neuron.js`), the drills, the synapse model and the drug list, kept |

What ours does better: the control is on the picture and the result is instant; the membrane close-up, the trace and
the travelling signal are one frame of one run, so they never disagree; excitatory and inhibitory input share one
screen; myelin can be stripped piece by piece and timed.

## The design
Four tabs (`K.tabs` big; two rows of two on a phone), each one idea, each its own control on the picture:

1. **Threshold**: "Excitatory" knob (0 to 40 mV, the main control, with the cue) and a quiet "Inhibitory" knob (0
   to 20 mV), each riding its input axon at the left into a dendrite. While a knob moves, the picture holds the
   moment that matters (the peak of the push, or the spike's rise) and the graph the whole run; let go and the run
   plays (inputs release, a ripple of charge reaches the cell body, which warms as it nears threshold; past it the
   Na⁺ channel in the close-up opens and Na⁺ rushes in, the trace rises to +40 mV, K⁺ flows out, the signal jumps
   node to node to the terminals, which release neurotransmitter). Cause line: "+24 mV excitatory → passes
   threshold → fires: +40 mV spike"; "+12 mV excitatory → reaches −58 mV → below threshold: no spike". Takeaway at
   the end ("All or none: any push past threshold fires the same full spike.").
2. **Refractory period**: two pulses; the knob is the 2nd pulse on the graph's time axis (1 to 10 ms after the
   first). The refractory period is shaded after each spike; in the close-up the Na⁺ channel is drawn locked (a ball
   in the pore, "Na⁺ locked") while it lasts. Opens at 4 ms (fires again); dragging closer blocks it.
3. **Myelin**: tap any of the 6 stretches of myelin to strip it (as in multiple sclerosis) or restore it; the
   myelin peels away (animated) and a signal is sent. It jumps node to node over myelin and creeps along bare
   stretches; the bar below times its trip ("arrives in 0.72 ms"; a "before" tick after a change).
4. **Synapse**: tap a drug on the picture (No drug, Agonist, Antagonist, Reuptake inhibitor); the action potential
   comes down the terminal, a vesicle moves down and fuses, the neurotransmitter crosses, binds receptors (each lit
   receptor is one eighth of the model's activation), the receiving neuron glows, and reuptake pulls it back
   (plugged by a reuptake inhibitor, so it lingers). Graph: receptors activated, with the no drug curve faint.
   The neurotransmitter is a quiet select beside Watch it happen (8 from the CED; GABA is pink, the inhibitory
   colour).

Every tab: purpose line (about 8 words) and Show me how (`K.tour`, 2 or 3 steps), one first visit cue, Watch it
happen (`K.player`, small) to replay, the graph scrubbable by pointer (`K.scrub`, no knob), the cause line
(`K.cause`). One colour per idea: signal and threshold vermillion, Na⁺ amber, K⁺ violet, excitatory and
neurotransmitter green, inhibitory pink, myelin cream, drugs slate, the neuron the course cerulean.

Reduced motion: the end of the run at once with a 240 ms cross fade, and the takeaway.

### On screen in Explore (counted at 1440 and 390, Threshold landing)
Outside the picture: 4 tabs (one control), the purpose line (9 words), Show me how, the cause line (3 pills, 10
words), Watch it happen. 3 controls plus the link; about 25 words. On the picture: the neuron (dendrites, cell body,
myelinated axon, terminals), 2 input axons with 2 knobs and their values, the membrane close-up (2 channels, about 26
ions, "outside", "inside", "Na⁺", "K⁺"), 7 part labels (Excitatory, Inhibitory, Dendrites, Cell body, Myelin, Axon,
Axon terminals), the graph (title, 3 ticks, threshold and resting lines with their labels, the pulse mark). Synapse
adds the neurotransmitter select (one more control).

### Explore against Test yourself
- Explore: free play as above; nothing locked, graded or asked.
- Test yourself: the drills, unchanged (read a membrane trace, drugs at the synapse, name the neurotransmitter,
  parts of a neuron), with the same "Kind of problem" dropdown, record ids, `?seed=` and `#quiz` links. The
  figures are the old drill art (drawn from each problem's numbers; nothing shown before its step is answered).

### What moved (nothing dropped silently)
| Old tool | Now |
|---|---|
| Stimulus slider and Stimulate (side panel) | Excitatory knob on the picture; the run plays when it is let go; Watch it happen replays |
| Pattern "Held on" (a held stimulus fires more often, never bigger) | "?" (How it works: the rate per 25 ms at 16, 20, 30, 40 mV) and Test yourself (held traces in the drills). Not in Explore |
| Pattern "Two pulses" with the gap slider | Tab 2, the 2nd pulse dragged on the graph |
| Tap a part to read what it does | "?" (Parts of a neuron); the parts are labelled on the picture; the parts drill |
| Synapse scene, drug buttons, neurotransmitter dropdown, graph with the no drug curve | Tab 4 (drugs drawn on the picture, the select beside the play button) |
| The numbers table, the eight neurotransmitters, the real drugs table, the "Why" steps | "?" |
| Pills (Stimulus, Fired: n spikes, Signal %) | The cause line |
| Stored last mode (Explore or Test yourself) | Kept (the adapter's `modes`) |

## Accuracy
- Model unchanged except: `simulate({ net: true })` lets the push be negative (excitatory minus inhibitory; old
  callers unchanged); a push of exactly 15 mV now reaches threshold and fires (it read "reaches −55 mV" and did not
  fire, a contradiction); `conduction(myel)` and `travelAt(myel, t)` time the axon (myelinated 0.12 ms, bare 0.9 ms
  per stretch). The drills' tests and the content check pass.
- Myelin speeds a real signal far more (about 50 to 100 times); 7.5 times is a teaching ratio, said in "?" and logged
  in `docs/appsych-needs-author.md` ("neuron-v2"). A stripped stretch in this model still conducts (slowly); in
  multiple sclerosis it can also block. Said in "?".
- Excitatory and inhibitory inputs are summed linearly with one time course (a simplification of EPSPs and IPSPs).
- Only a few ions are drawn crossing; "?" says real concentrations barely change. No pump.

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)
1. Four tabs (Threshold, Refractory period, Myelin, Synapse) instead of two scenes.
2. Excitatory and inhibitory input share tab 1 (the inhibitory knob quiet).
3. A run plays by itself when a knob is let go (or a tap); while dragging, the picture holds the key moment.
4. "Held on" (rate coding) leaves Explore for "?" and the drills.
5. Tapping a part for its card leaves Explore for "?" and labels.
6. Myelin is 7.5 times faster than bare axon in the picture, not 50 to 100.
7. Refractory period opens at 4 ms (fires again), so the first drag closer shows the block.
8. Drill figures keep the old art.
9. No teaser.

## Build status (2026-11-23)
Files: `psychology/assets/tools/neuron.js` (Explore v2 plus the kept drill art and drills), `neuron.css`,
`math/neuron.js`, `psychology/data/tools/neuron.json` (intro and how it works), `psychology/data/pages.json`
(`"kit2": true`), `scripts/tools-v2/neuron-sweep.mjs` (layout, `--frames`, `--perf`). Results of the checks are in
the report section below.

## Checks
See "Checks run" (filled at hand in).
