# Author C: Unit 3

Read `docs/apmacro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (9)

`aggregate-demand` (3.1), `multipliers` (3.2), `sras` (3.3), `lras` (3.4), `adas-equilibrium` (3.5), `adas-short-run-changes` (3.6), `long-run-self-adjustment` (3.7), `fiscal-policy` (3.8), `automatic-stabilizers` (3.9).

## FRQs

- `long` on `long-run-self-adjustment` (graph part: `adas`): A recessionary gap: AD-AS with LRAS, the fiscal policy and multiplier that close it, the money market and the long-run self-adjustment if nothing is done. File `macroeconomics/data/frq/frq-recession-long.json` (id `frq-recession-long`).
- `short` on `multipliers`: An MPC and a gap: the spending and tax multipliers, the change in spending that closes the gap, and why a tax cut must be larger. File `macroeconomics/data/frq/frq-multiplier-short.json` (id `frq-multiplier-short`).
- `short` on `long-run-self-adjustment` (graph part: `adas`): An inflationary gap left alone: what shifts in the long run and why, with the new price level and output. File `macroeconomics/data/frq/frq-self-adjustment-short.json` (id `frq-self-adjustment-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `macroeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `macroeconomics/figures/` (ids starting with your topic ids); `scripts/apmacro-figures/author-c.mjs` if you generate figures; your report `docs/apmacro-reviews/self-c.md`.

## Notes for your topics

Unit 3 carries the AD-AS model: every graph item on `adas` (AD, SRAS and LRAS shifts with their causes; recessionary and inflationary gaps with `start`), the multipliers (divide the gap, direction first; spending vs tax), long-run self-adjustment through nominal wages and SRAS (never AD or automatic stabilizers), fiscal policy and automatic stabilizers. The long FRQ is on `adas` and spans into the money market if you list Unit 4 (unlock order).
