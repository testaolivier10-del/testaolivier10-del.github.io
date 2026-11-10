# Originality review: Units 1, 3, 4 and 7 FRQs and the FRQ coach (2026-11-09)

Rule: spec decision 4, no released College Board free-response question reproduced or adapted. Test: flag an FRQ
when its scenario plus the sequence of parts, or its stimulus plus two or more parts, track a released question.
Sharing a standard concept (HDI, a growth pole, centrifugal forces) is allowed. Units 2, 5 and 6 are with their own
reviewers. No released wording was copied into the repo; the comparison table was kept outside it.

## Released sets read

All read in full (each question's scenario, stimulus and parts A to G), from apcentral.collegeboard.org or, for
2021 and 2022 (no longer linked there), the Internet Archive copies of the same AP Central PDFs:

- 2021 Set 1 and Set 2; 2022 Set 1 and Set 2; 2023 Set 1 and Set 2; 2024 Set 1 and Set 2; 2025 Set 1 and Set 2.
- 2026: AP Central lists one free-response set only; read.

Nothing could not be read.

## Verdicts

| FRQ | Closest released question | Verdict |
|---|---|---|
| frq-scale-regions-none | none on region types | Original |
| frq-census-data-one | 2025 Set 2 Q3 shares only an "identify the scale" part | Original |
| frq-human-environment-two | 2023 Set 2 Q3 (Sahel) is a different setup and asks | Original |
| frq-diffusion-religion-none | 2024 Set 2 Q1 shares one "type of diffusion" part | Original |
| frq-language-map-one | 2026 Q3 (a bilingual country by province) and 2022 Set 2 Q3 (centrifugal force, devolution): different stimulus content and only one part each in common | Original (closest call in this set) |
| frq-landscape-two | none with two scenes of one place | Original |
| frq-supranational-none | 2025 Set 1 Q1 (supranational bodies and sovereignty, no stimulus: purpose, then how membership limits sovereignty) and 2021 Set 1 Q3 (define, economic benefit of joining, political cost) | **Flagged, rewritten** |
| frq-boundary-map-one | 2022 Set 1 Q3 and 2025 Set 1 Q1 E each share one part | Original |
| frq-devolution-two | 2022 Set 2 Q3 and 2023 Set 2 Q1 E share the devolution and centrifugal ideas, not the stimulus or sequence | Original |
| frq-development-theory-none | Rostow and Wallerstein appear only as single parts (2023 Set 2 Q2 G, 2021 Set 2 Q3 F, 2022 Set 2 Q2 D) | Original |
| frq-development-table-one | 2023 Set 2 Q2: a cross-country indicator table with schooling by sex and fertility, then an HDI indicator, why one country's HDI is higher, women's schooling and fertility | **Flagged, rewritten** (the Unit 7 reviewer's open check) |
| frq-industrial-cluster-two | 2023 Set 1 Q3: a map of a high-tech cluster plus a research table, then the pattern, growth pole and a regional-to-national scale limit (also 2021 Set 2 Q3: cluster map plus table, pattern) | **Flagged, rewritten** (the Unit 7 reviewer's open check) |
| frq-coach.json, 8 contexts | transition (A and C each match one part of 2024 Set 2 Q3 and 2023 Set 1 Q1), development (one part each with 2023 Set 2 Q2), boundaries (one part with 2023 Set 2 Q1); the rest share nothing | All original; no change |

## Rewrites (summary, before and after)

**frq-supranational-none** (Unit 4 with Unit 2 migration; type none; 7 points; verbs unchanged).
Before: name a body and its function, define supranationalism, how membership limits sovereignty, an economic
reason to join, free movement and migration, compare with devolution, degree bodies weaken sovereignty.
After: a power a state gives up with a shared currency; define supranationalism (kept); what a customs union
changes in trade between members; why a small state's farmers might oppose joining; free movement and migration
(kept); compare with devolution (kept); degree a member can protect its own language and culture. "Tariff" and
"mechanized" are avoided (taught in Units 7 and 5), so the ordering check passes.

**frq-development-table-one** (Unit 7 with Unit 2; type one; 7 points).
Before: a five-country cross-section (GNI, HDI, GII, girls' schooling, fertility).
After: one invented country over 1995, 2010 and 2025 (GNI, HDI, GII, maternal deaths, women's seats in
parliament, women in paid work, fertility). Parts: the period when GII fell more; the HDI change with data; how
fewer maternal deaths lower the GII; HDI better than GNI alone (kept); how more women in paid work helps explain
falling fertility (keeps the Unit 2 topic); a limit of national data (kept); degree the data show equal
opportunity for women and men.

**frq-industrial-cluster-two** (Unit 7 with Unit 2 migration; type two; 7 points).
Before: a province map of high-tech workers and a research-spending table.
After: Source 1 is an invented ministry plan (a foreign carmaker's assembly plant in a farming province, a ten-year
tax break, a rail line, suppliers to locate nearby); Source 2 is a table of jobs by sector, 2005, 2015 and 2025.
Parts: the sector that added most jobs; one incentive offered; suppliers as agglomeration; whether the plant is a
growth pole (from the table); compare farm and parts jobs; effect on internal migration (kept); degree the jobs
will last given a multinational that can move.

Each rewrite keeps its id, file name, type, units, topics, practices and 7 one-point parts with a rubric line
and full-credit sample. `node scripts/check-aphug-content.mjs`: 0 failing (the only failure shown is a bank item
in the unpublished `malthusian-theory` chapter, there before this review).

Note for the lead: `docs/aphug-briefs/g.md` still describes the old cluster stimulus (map plus research table).
I did not edit it, because this review may change only FRQ files and reports.
