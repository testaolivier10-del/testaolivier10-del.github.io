# Plan: AP® Biology, Meiosis and nondisjunction (tools v2)

**Tool and page:** `bio/tools/meiosis-nondisjunction.html`; `bio/assets/tools/meiosis-nondisjunction.js`, data
`bio/data/tools/meiosis-nondisjunction.json`, course layer `bio-tools.js`, `bio-tool-math.js`, `bio-art.js`.
Premium (`premium: "tools"`). Rollout row 33, group P, wave 11, size rework.

**The one idea:** a pair that fails to separate leaves gametes with one chromosome too many or too few.
Two tabs, one idea each: "Meiosis I error" (homologs stay together: all four gametes are wrong) and "Meiosis II
error" (sisters stay together: two of four are wrong).

## Research
- [Biology Simulations, nondisjunction (McCreary)](https://dmccreary.github.io/biology/sims/nondisjunction): picks the
  division where the error happens and shows the gametes; take the side by side normal vs error gametes.
- [Biomanbio nondisjunction models](https://biomanbio.com/HTML5GamesandLabs/Genegames/nondisjunctionpage.html): the
  student drags chromosomes into daughter cells; take "you move the chromosome" as the act, and the count shown on
  each gamete.
- PhET has no meiosis sim; HHMI BioInteractive's meiosis animations (known only) draw the spindle pulling
  chromatids, which is the motion to copy. Builder: open all three before the brief (rule 10).

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Next step, Back, Play to gametes, Go to step dropdown, Stage label | Explore: one time bar under the cell with the stage name (K.scrub), "Watch it" (K.player) |
| Pairs 2n = 4 or 2n = 6 | Explore: fixed at 2n = 6 (three pairs fit 360 px); 2n = 4 in Test yourself setups. Log it |
| Crossing over toggle | Explore, quiet tap on the chiasma point in prophase I (ungraded) |
| Line up: flip a pair (orientation buttons, Next line-up, Try every line-up) | Explore: tap a pair at metaphase I to flip it (quiet). "Try every line-up" to "?" (the 2ⁿ count) |
| Nondisjunction dropdown (none, MI, MII cell 1, MII cell 2) and the tap on a pair or sister chromatids | Explore: the main control, tap the pair (tab 1) or the sisters (tab 2) on the cell at anaphase |
| Chromosomes per cell / DNA per cell graph | "?" (the DNA content graph with its table) |
| Record these gametes, Clear runs, the run table | "?" (the run table) or dropped to a later tool: log it as moved to "?" |
| Make this gamete mode, Check my gametes, Next gamete, Show me how; record ids `meiosis-nondisjunction:make-<kind>:a`; `#make` | Test yourself part "Make this gamete", same ids and grading; `#make` opens it |
| Questions (5, ids `meiosis-nondisjunction:cells:1..5`), stimulus `mei-s1`, mini FRQ | Test yourself part "Questions", unchanged; `#questions`, `#frq` |
| Premium gate | unchanged |

## Design
- **Picture:** a real dividing animal cell at the flagship level: membrane with depth, a faint nucleus envelope that
  dissolves in prophase, centrosomes and spindle fibers that visibly attach and pull, three homologous pairs drawn
  as X shaped duplicated chromosomes (maternal red, paternal blue, three lengths), cleavage furrows that pinch. The
  end of the bar shows four gametes in a row, each with its chromosome count on a small sign ("n + 1", "n", "n − 1")
  and a zygote preview that says "trisomy" or "monosomy" when it forms with a normal gamete.
- **Main control:** tap the pair (or the sister chromatids) the student wants to stick; it gets a small "stuck"
  clamp. Instant response: the time bar jumps to that division and replays its anaphase, the stuck pair goes to one
  pole, the gametes and their signs update.
- **Animates:** fibers shorten and pull; a stuck pair is dragged whole to one pole; furrows pinch; gametes slide out.
- **Cause line:** "pair 2 stays together in meiosis I → both copies go to one cell → 2 gametes n + 1, 2 gametes n − 1".
- **Takeaway** at the end of the bar: "A meiosis I error makes every gamete abnormal; a meiosis II error, half."
- **Outside the picture:** 2 tabs, purpose line (about 8 words), Show me how, the time bar with Watch it, the cause
  line. Under 30 words, 3 controls.

## Science to verify
- Gamete outcomes: MI error gives two n + 1 and two n − 1; MII error in one cell gives one n + 1, one n − 1, two n
  (check against NCBI Bookshelf, Alberts "Molecular Biology of the Cell", meiosis chapter, and the CED topic 5.1/5.4).
- Trisomy 21 is usually maternal MI (cite NCBI Bookshelf or a review in "?" only if stated; else leave out).
- Crossing over happens in prophase I between non sister chromatids; chiasmata hold homologs (Alberts).
- Number of line-up combinations 2ⁿ (2²³ for humans, `humanN` 23).
- Trap (authoring guide): mechanisms, not purposes; no "the cell wants". No OpenStax text or figures (decision 24).

## Reuse
`ApBioTools.studioKit2` (exists): `o.stage`, `o.ref`, `o.parts` with the questions part (`questionsLabel`) and a
part that carries its own stage for "Make this gamete". Kit: `K.tabs`, `K.tap`, `K.scrub`, `K.player`, `K.cue`,
`K.cause`, `K.head`. `bio-art.js` for chromosome drawing if it has one. Not the first AP® Biology tool on kit2.
Sweep: copy `scripts/tools-v2/osmosis` or `enzyme-activity-frames.mjs` patterns.

## Risks reviewers will likely block on
- Six chromosomes plus labels at 360 px: chromosome tap targets 44 px and the "stuck" clamp never covers a sign.
- Gamete signs must read from the drawn chromosomes in that frame (count what is drawn mid anaphase, not the model).
- Small text: chromosome numbers at 11 px minimum; signs sized from measured text.
- Perf: one element per chromatid; fiber redraws must not rebuild DOM per frame.
- Leaving mid anaphase (to Test yourself or "?") must stop the player and return clean.
