# Plan: Organic Chemistry, Synthesis Trainer (tools v2)

## Tool and page
- Page `ochem/tools/synthesis.html` (registry slug `synthesis`). Scripts `ochem/assets/tools/synthesis.js`
  (1,239 lines, 69 KB; engine `window.OchemSynthesisEngine`, tested in node by
  `scripts/test/synthesis-trainer.test.mjs`), `reagent-roadmap-data.js` and `synthesis-data.js` (36 problems,
  molecule families).
- **Premium**. Rollout row 103, group F, size rework (no free play: the landing is a graded problem; 153 words on the
  stage). Unchanged on `claude/tools-v2-all`.

## The one idea
The molecule you have after each step decides what the next step can do. One screen, no tabs: a bench where each
reagent turns the flask's molecule into the next one.

## Research
- [UCI Reaction Explorer](https://cdb.ics.uci.edu/cgibin/tutorial/help/ReactionTutorialHelp.htm): pick reagents,
  see the real product of the real molecule, multistep problems. Take: the product is always drawn, never named
  only.
- [RSC Education, designing an organic synthesis](https://edu.rsc.org/resources/designing-an-organic-synthesis/2361.article):
  forward and backward planning taught as the same chain. Take: Backward stays a mode of practice, not of Explore.
- Brilliant (group F row): one step per screen, each step an action. Take: one step at a time, the chain kept on
  the picture. Seen as text only; the builder opens them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Forward: a problem (start, target), four reagent choices per step (seeded), intermediate drawn after each pick, dead end note and Step back, hint ladder, misses, shortest route shown when solved | Test yourself part "Forward" unchanged |
| Backward: from the target, pick the step before | Test yourself part "Backward" unchanged |
| 36 problems plus random problems (`randomProblem`, 2 to 4 steps on one skeleton) | Test yourself, the problem picker unchanged; Explore starts from one family's molecules |
| Trail of names (start, steps, "?", target) | Explore: the trail is the row of drawn flasks |
| Mastery records (`OchemMastery`, nothing recorded for a no topic step) | Test yourself only, unchanged |
| Check yourself quiz (5 rounds) | last Test yourself part |
| `OchemToolState` keys `p`, `m` | `?p=<id>` opens Test yourself on that problem (`m=back` Backward); no key opens Explore |

## Design
- **Picture:** a lab bench across the stage. On it a row of round bottom flasks, the first holding the start
  molecule (drawn as a skeletal structure in the liquid), and a shelf of reagent bottles above (real drawn bottles
  with short labels: "PCC", "H₂SO₄, heat", "BH₃ then H₂O₂"). The shelf shows the reactions the engine allows from
  the current molecule (up to six), each bottle in its family colour.
- **Main control:** tap (or drag) a bottle onto the last flask. The bottle tips, the liquid changes colour, and the
  molecule morphs in place into the product; a new flask slides in beside it with the product, an arrow between
  flasks carries the reagent. A reagent that is real chemistry but leaves no functional group (an alkane) shows the
  product and a short "dead end" mark on the flask, never a red error.
- **Secondary, quiet:** Undo (takes the last flask back, animated pour back), Start over, and the family picker
  (the propane, butane, 2 methylpropane, cyclohexane and benzene families in `FAMILIES`).
- **Cause line:** "Butan-2-ol dehydrates to but-2-ene → hydroboration gives butan-2-ol back, not butan-1-ol".
- **One optional teaser** (flagship rule 10): "Make butanone from but-1-ene" with a quiet check when met, ungraded.
- **Takeaway** after three flasks: "Each product sets the next step's choices."
- **Outside the picture:** purpose line, cause line, Undo, Start over. About 25 words.

## Science to verify
- Every product the bench draws comes from the engine's exact walk (`OchemSynthesisEngine`), never from a group
  level guess; run `scripts/test/synthesis-trainer.test.mjs`.
- Regiochemistry on each family molecule (Markovnikov, anti-Markovnikov, Zaitsev) and stereo notes where a
  product is racemic: Klein ch. 8 to 12; Clayden ch. 17 and 19 to 20.
- Every molecule name (IUPAC) on each flask; the C–C step allowed once (as the engine says).
- Reagent bottle labels match the roadmap's reagent lines word for word.

## Reuse
- `OchemSynthesisEngine` (moves, judge, dist), `OchemRoadmapEngine`, `molSvg` from the roadmap; the station
  molecules the Reagent Roadmap plan draws (build that plan first so both share one molecule morph).
- `OchemStudioKit.kit2` with parts (Forward, Backward, Check yourself).
- Kit: `K.tap`, `K.cue`, `K.cause`, `K.head`; a shared `K.steps` only if the roadmap builder adds it.

## Risks reviewers will likely block on
- A row of flasks overflowing the stage on a phone: keep the last three flasks, earlier ones as small thumbnails
  that tap open.
- Bottle labels under 11 px or wrapping inside a reagent name at 360 px.
- The molecule morph finishing after the cause line names the product (rule 14).
- Explore overlapping Reagent Roadmap tab 1: the difference must be visible (one real molecule here, groups there).
- Liquid and molecule drawn outside the flask (lessons list: things stay inside what contains them).
