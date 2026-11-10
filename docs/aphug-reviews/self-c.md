# Author C self-review: Unit 3, Cultural Patterns and Processes (2026-11-09)

## Done

All 8 topics complete: lesson, notes, questions, glossary, figures. `node scripts/check-aphug-content.mjs` reports no
failure for any Unit 3 topic or my three FRQs; `node scripts/check-aphug-map.mjs` passes; a scratch build
(`APHUG_PUBLISHED=unit-3 ... --out /tmp/hug-c/build`) writes 52 files and its 16 lesson and notes pages pass the
map's ordering scan.

| Topic | Items | In sets | Apply/analyze | Set kinds | Notes words |
|---|---|---|---|---|---|
| culture-intro (3.1) | 17 | 7 | 15 | text, text | 836 |
| culture-on-the-land (3.2) | 17 | 7 | 16 | image, image | 776 |
| cultural-patterns (3.3) | 16 | 7 | 15 | map (Country A), text | 662 |
| diffusion-types (3.4) | 16 | 7 | 16 | map (Country A), text | 703 |
| diffusion-history (3.5) | 16 | 7 | 15 | text, map (world) | 640 |
| diffusion-today (3.6) | 16 | 7 | 15 | data (line chart), text | 618 |
| religion-language-diffusion (3.7) | 17 | 7 | 17 | map (Country A), data (Pew table) | 751 |
| diffusion-effects (3.8) | 16 | 7 | 16 | text, data | 597 |

131 items: 113 single, 5 multi, 1 order, 5 model (sequent occupance stages, centripetal/centrifugal at two
scales, the four diffusion types, family-branch-language-dialect, the four effects), 6 specific, 1 numeric
(`sum` of Pew shares, with the "added Hindus" and "left out Buddhists" slips).

FRQs: `frq-diffusion-religion-none` (Buddhism: hearth, hierarchical and trade diffusion, chain migration to Long
Beach, stupas, scale limit of a world map; Units 3 and 2), `frq-language-map-one` (Country A language map: scale,
pattern, centripetal, centrifugal, placemaking, official bilingualism, degree of devolution; Units 3 and 4, so it
unlocks with 4.10), `frq-landscape-two` (one invented Main Street in 1925 and 2025: religion on the landscape,
sequent occupance, convergence, Somali relocation diffusion, a compare, scale limit; Units 3 and 2).

Figures (`scripts/aphug-figures/author-c.mjs`, LevlPrep original SVGs, checked as PNGs at phone width): one per
lesson (8), a second for 3.7 (how the two kinds of religion spread), the Little Saigon-style streetscape, and the
two FRQ street scenes. 12 in all.

## Map edits (`docs/aphug-dependency-map.json`)

- Concepts added: `folk-culture`, `popular-culture` (culture-intro), `traditional-architecture`
  (culture-on-the-land), `pidgin` (diffusion-history).
- Unit 3 `tools.stimulusThemes`: 12 sets added beside the four planned ones.

## Accuracy notes

- Religion shares only from Pew 2025 (2020 data), as accuracy-risks.md gives them; language count from Ethnologue
  29th edition. No CIA Factbook. Hinduism and Judaism taught as the AP® classification with the caveat.
- Real dated facts used (worth a reviewer's check): Haiti 1987 constitution (Creole official); Quebec 1995 vote
  about 50.6% "No"; Saudi 2019 end of required separate restaurant entrances; French 1994 radio quota law; Māori
  Language Week 1975, kōhanga reo 1982, Māori Language Act 1987, Māori TV 2004; Canada multiculturalism policy
  1971, residential schools to 1996, TRC 2015; Sequoyah syllabary 1821 (86 symbols), Cherokee Phoenix 1828;
  Walmart first store 1962 in Rogers, Arkansas; 550 Madison Avenue 1984; Mill City Museum in mill ruins;
  Owámniyomni as the Dakota name for St. Anthony Falls; Hong Kong 1842-1997; Senegal French until 1960;
  Philippines under the US 1898-1946.
- Graded items never hinge on a figure that goes stale within a year; the Country A maps, the internet and
  language chart and the family table are invented and labeled.

## Open points (for `docs/aphug-needs-author.md`; I did not edit shared docs)

1. Scale wording for province data: I key "local (subnational)", as the fixture does; author A's skills topic should
   use the same words.
2. Contested-name check: the 3.7 notes give Denali / Mount McKinley with users and date, per accuracy-risks.md.
3. The religion classification caveat (Hinduism and Judaism accept converts in some forms) sits in notes and
   glossary; a teacher should confirm the wording.
4. Bank-wide: "select-all items with one correct option" is 2 of 32 across the course (mine 2 of 5); other authors
   need some single-key multis.
