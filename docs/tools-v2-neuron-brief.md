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

## Checks run (2026-11-23)
- Sweep (`node scripts/tools-v2/neuron-sweep.mjs`, one width per process): 360, 390, 430, 600, 768, 820, 1024, 1280,
  1440, 1920, light and dark, 90 states and 1804 checks per width (landmark settings of all four tabs, mid run frames,
  the first visit cue of each tab, Test yourself): 0 failures. Nothing clipped, every label, number, tag, knob and
  cue 4 px clear, no text under 11 px, the neuron (or synapse) the largest object, the cause line at most two rows
  and one height per tab on phones, no sideways scroll, no console errors.
- Frames (`--frames`, 390 and 1440): 7458 and 6897 frames (every 0.05 ms forward, a reversal, jumps, and every
  animation frame of a real played run, 13 settings over the four tabs; a keyboard End on the knob; a real pointer
  drag, read mid drag; reduced motion): 0 failures. The trace's head sits on the model's charge; Na⁺ open and "Na⁺
  rushes in" only in the rising phase; "K⁺ flows out" only while K⁺ flows; each action potential where the
  conduction model puts it; the travel bar's time; "fires" and "arrives" only once drawn; in Synapse the lit
  receptors, the free molecules and the graph's head match the model.
- Perf (`--perf`, CPU x4), flagship (Water pollution, sacks dragged) in the same process: 390: neuron runs median
  16.7 ms, p95 16.8 to 50 ms, drag p95 33.4 ms; flagship median 33.4, p95 116.6. 1440 (measured while check-site
  ran): neuron median 16.7 (synapse run 33.3), p95 33 to 200 ms; flagship median 50, p95 167. Paint plus layout per
  frame at x4, measured alone: median 0.2 to 5.7 ms, p95 at most 17 ms in every tab.
- `node --test scripts/test/appsych-*.test.mjs` 153 pass (the fixture pages.json follows the real one);
  `check-appsych-content --check --tools` 0 failing; `build-appsych --check`; `check-weight --check` all within;
  `check-site`: the neuron is clean; 2 failures remain in the merged brain map's `brain-map.js` (lines 1024, 1026,
  "colour" in visible text), for that branch to fix; `check-tool-use` with a local copy of its list: the neuron
  reports frame v2, one of each event, nothing under automation.
- Preview: `/mnt/user-data/outputs/neuron-v2/index.html`; shots in `shots/` (01 to 12, each tab at 1440, 768 and
  390, light and dark, with mid run frames 03a to 03d and mid animation frames in Myelin and Synapse).

## Review round 1 (2026-11-23, `/home/claude/review-neuron/REVIEW.md`: BLOCK, 9 must fix, 12 should fix, 3 removals)
All fixed in this round (the speed rule). Science and frame agreement were confirmed by the reviewer.

Must fix:
1. Synapse had two time cursors: the scrub now spans 0 to 12 ms like the graph, and the kit's own scrub line is hidden
   (the drawn "now" line is the one cursor; the scrub steps 0.01 ms). The frame check asserts one line.
2. `layoutNow` returns while the scene has no size (Test yourself, `?seed=`, `#quiz`): no fake layout, no console errors.
3. The Na⁺ and K⁺ labels sit on the membrane beside their channels (Na⁺ to the left, K⁺ to the right; the channels
   are placed so both fit), never over a mouth the ions use; ion seats avoid the labels. The frame check asserts no
   label covers a moving ion or molecule.
4. "+40 mV spike" sits right of the whole spike (spike + 2.4 ms) with a halo; the band is gone from Threshold.
5. Phone Myelin: the axon takes the width (a stub of dendrites, no input, short terminals, a thicker axon); each
   target spans its stretch and half of each node gap: at least 44 px at 360 (the sweep asserts 44 px targets).
6. The myelin targets are invisible (focus ring only); hover or focus outlines the sheath itself (or the bare stretch).
7. No "Tap" chip or pulse on the segments: the cue is the only hint.
8. The tabs use the short "Refractory" up to 900 px (the sweep asserts no tab name is cut).
9. The cleft's two names keep the moving parts off them: the molecules' range and the transporters (with the plug)
   stay clear of "Synapse" and of the neurotransmitter's name; on a phone "Reuptake" is not on the picture (no free
   spot among the vesicles; the cause line names it).

Should fix:
1. The two K⁺ ions cross from 0.55 to 1.75 and 1.75 to 2.95 ms; "K⁺ flows out" shows 0.5 to 3.0 ms only.
2. Phone excitatory track 92 px (the control column is 128 px; the track runs to the input's bouton).
3. Each input has its name above its track and its value under it.
4. Cause line: "0 mV excitatory"; the inhibitory pill is joined with a minus ("+29 mV excitatory − 15 mV inhibitory",
   a `join: '-'` added to `K.cause` in the kit); exactly 15 mV "reaches threshold".
5. Inhibitory input 0 to 10 mV (the floor is −80 mV).
6. GABA: its cause pills and the receiving neuron's glow are pink.
7. "?" says potassium violet.
8. The refractory band is drawn only in Refractory period.
9. Cues: Threshold below the knob on desktop (its value waits while the cue shows), right of it on a phone;
   Refractory period right of the 2nd pulse (off the spikes and the threshold line; on a phone the short "resting"
   word waits). The stimulus row sits lower in the graph so the cue keeps off the tick numbers.
10. Phone Myelin stage 250 px with the bigger axon.
11. Test yourself draws the neuron and synapse figures with the Explore art (`figSvg`: own gradient ids; a part lit
    and named only once answered; the drug only once its kind is named; no neurotransmitter name on the figure).
    The trace figure keeps its graph.
12. Perf: the ions and the cleft's molecules are built once per layout and moved by attribute; the faint run drawn
    once per run. CPU x4 on a quiet machine: neuron median 16.7 ms everywhere, p95 16.8 to 50 ms (390 and 1440);
    flagship in the same process median 33.3, p95 66.7.

Merged `claude/tools-v2-brain-map` again (4cb0572c, its colour fix). Its adapter change (kit loader into
`ApPsychTools.kit2`) was not pushed yet; the neuron still loads the kit itself when the page did not.

Checks this round: sweep at 360, 390, 768, 1024 and 1440, light and dark (90 states each): 0 failures; frames at 390
and 1440 (7650 and 7379 frames): 0 failures; AP Psych tests 153 pass; content check, `build-appsych --check`,
`check-weight --check`: pass; `check-site`: OK.
