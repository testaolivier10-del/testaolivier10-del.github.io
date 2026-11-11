# AP Psychology: cleanup pass 3 (2026-11-11, builder c5)

Judge: `docs/tool-review/pass2/judge-b.md`. Shots: `/home/claude/shots/pass3/psychology/<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`. Hint placement, halo clipping and chip rows in the dock belong to the shared fix
(not in this pass, per `CLEANUP.md`). No fact, answer or scoring changed.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| Memory lab (FAIL) | Opens on a blank chart; the current word shows as a 92% bar that reads as a score | Opens on the word card ("Ten words, one at a time / Ready?") above the chart, with the ten "You" slots under the axis where the recall lands. During study a small pointer marks the position on the axis and the matching slot is ringed (earlier slots faint); no tall bar. "Word n of 10" now shows once (on the card), not also in a pill and the caption. The class curve still appears only after scoring (the pass 2 rule: do not give the result away); the faint-curve idea was declined for that reason | PASS |
| Conditioning lab | Half the stage an empty chart; saliva line starts at the nose | Before trial 1 the dog scene fills the stage; the record appears with trial 1. The tube starts at the front of the mouth. The measuring tube is sized to the dog, not the stage. "1 trials" fixed to "1 trial" | PASS |
| Article analysis studio | Model answer shows before the student tries | "Earns the point" and "A typical miss" both start unpressed; the card says "Answer it in your head first, then check." Changing part resets it | PASS (hint placement is shared) |
| Development | Caption lists stage, crisis, abilities and Erikson's question | Caption is one line (age, stage, crisis); what the age can do and Erikson's question head the Explanation | PASS (4 lens chips are within the 4-control rule; halo is shared) |
| Evidence builder | Source chart below the fold; collapse sections after the first read | A source the student has already read opens with Introduction, participants and method folded into one line, so Results and the chart lead; it opens itself when the part being scored cites a participant detail. First read is unchanged (the exam shows whole sources) | PASS (hint is shared) |
| Social influence | Caption over 40 words | Conformity caption drops the percent (already on the pill and the bar): head plus the normative-influence line. Bystanders caption keeps only the end-of-study figure (the "in time" figure is on the pill) | PASS (chip row is the shared More) |
| Stats lab | Seven jump-to-z buttons; hint over the tails | Not changed: the z row is a dock chip row (shared More overflow) and the hint is shared | Waits on shared fixes |
| Neuron, Sensation | Hint covers the slider on phone | Shared hint fix only | Waits on shared fix |
| Brain map | PASS | None | PASS |

Checks: `build-appsych --check`, `check-appsych-content`, `check-appsych-map`, `node --test scripts/test/appsych*`
(152 pass), `check-site`, `check-weight`: clean.
