# FRQ coach (`frq-coach`): builder T2 report (2026-11-09)

Topic `skills-frq`, Premium (`premium: 'tools'`, unchanged). Files: `human-geography/assets/tools/frq-coach.js`,
`.css`, `math/frq-coach.js` (`ApHugMath.frqCoach`), `human-geography/data/tools/frq-coach.json`,
`scripts/lib/aphug-tool-checks/frq-coach.mjs`, `scripts/test/aphug-tool-frq-coach.test.mjs`,
`assets/covers/tools/aphug/frq-coach.svg`.

## What it does

Eight original short questions (skills chapter, then one per unit: polders and possibilism; the transition model;
diffusion; superimposed boundaries and unitary vs federal; the Green Revolution in Punjab and von Thunen; city
models and sprawl; HDI, GNI and Rostow), 27 parts, every verb at least twice. Each context carries its unit topic,
so it unlocks with its unit.

- **Explore.** Stage: the question as the exam sets it out, verbs in bold, the current part marked. Dock, one
  part at a time: (1) the verb and its demand (the exam's `VERBS` words); write, with link-word buttons and a
  live `ApHugGrade.flags` checklist (`mechanism`, `both`, `degree` read from the opening, `scale` where the part
  asks); (2) the rubric line and a full-credit sample on request; (3) "Which answer earns the point?" between the
  sample and an answer that misses the verb's demand, Select then Check, slip named. Drafts kept on the device
  (`aphug_frqcoach_v1`). Why: the demand, the slip readers see most, how a part is scored.
- **Test yourself** (three kinds): one part step by step (demand, earns, the missing link of the chain), every
  verb of a question, every "earns" of a question.

## Checks

Validator: model `VERBS` equal to `scripts/lib/aphug-exams.mjs` word for word; prompts open with their verb;
samples pass their verb's flag rule and weak answers fail it by slip; explain parts have chains; 300 seeds per
context and type with every key recomputed. Tests: 5. Screenshots 360 and 1280, light and dark (explore, a full
interaction, two drills); no console errors.

## Local style choice

The shared `hug-tools.css` centers a drill text on the stage with `margin:auto`; a question this long reads
better from the top, so `frq-coach.css` sets `margin:0` and a 17 px size for this tool's question only.
