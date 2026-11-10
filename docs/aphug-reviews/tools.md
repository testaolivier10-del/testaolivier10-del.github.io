# AP® Human Geography trainers: independent review (2026-11-10)

Scope: the eight trainers (model-studio, frq-coach, scale-lab, map-reader, population-lab, diffusion-lab,
borders-lab, city-lab), after the integration pass changed the shared runtime. Bar: `review-common.md`,
`tools-common.md`, spec section 6 and decisions 7 and 8, `accuracy-risks.md` (binding). Read: the builders'
reports (`self-t1.md` to `self-t4.md`, `tools-frq-coach.md`, `tools-scale-lab.md`), `integration.md`,
`originality.md` and needs-author `tools-facts`. No git command was run. Nothing in `data/exams`, `data/justify`,
the exams pages or the entry libs was touched.

## Method

1. **Content.** Every string of every data file was dumped and read (model descriptions, claims, origins,
   assumptions, limits, decoys, apply cases, slips); every generator's words were read through generated
   problems (two to four per kind read in full by hand, the rest by script).
2. **Keys, by my own scripts** (in `/tmp/hugrev/*-check.mjs`, not the tools' validators): each problem's key
   recomputed from the problem's own data with my own rules (my own DTM and epidemiological bands, bid
   arithmetic from the text, diffusion type classified from the spread picture alone, boundary type from the
   story's years and clue words, UNCLOS zones from 12/24/200, map-scale arithmetic parsed from the text,
   pyramid shape from the bars, pyramid group sums against the stated millions, and so on).
   **3,980 problems worked**, at least 40 per drill kind:

   | Tool | Kinds | Problems | Key errors |
   |---|---|---|---|
   | model-studio | 21 models (build, apply, limit) | 1,260 (60 per model), 840 again after fixes | 0 |
   | frq-coach | part, verbs, earns × 8 questions | 960 | 0 |
   | scale-lab | identify, across, chain (5), limit, mapscale | 360 | 0 |
   | map-reader | kind, legend (2), pattern (2), breaks, limits, isoline | 320 | 0 |
   | population-lab | rates (2), growth, dependency (2), stage, shape (3), cohort (3) | 480 | 0 |
   | diffusion-lab | diffusion, mixed, migration, kinds, ravenstein | 200 | 0 |
   | borders-lab | boundary, shape, sea, forces | 160 | 0 |
   | city-lab | rings, bidrent (farm and city), models, central, ranksize | 240 | 0 |

3. **Hands-on.** Scratch build with every chapter published
   (`APHUG_PUBLISHED=geo-skills,unit-1,...,unit-7 node scripts/build-aphug.mjs --out /tmp/hug-tr/human-geography`),
   served on 8870. Playwright (`/tmp/hugrev/walk.mjs`) at 360 and 1280 wide, light and dark (32 runs): landing,
   every Explore button pressed once by keyboard and every Explore select option, then every drill kind walked
   to the worked solution by keyboard only (radios with Space, model pieces and slots with Enter, Check, Show
   the answer). Measured at every state: console errors, horizontal scroll, overlapping or clipped SVG text,
   overlapping absolutely placed HTML labels, pointer targets that are not keyboard reachable. Gates checked
   with aphug put on sale inside the test page (`onSale: true` in a routed copy of `premium.js`); covers checked
   on `tools.html`. Screenshots in `/tmp/hugrev/shots2/`.

Result: every drill kind of every tool reached its worked solution in all 32 runs; **0 console errors**,
**0 horizontal scroll**, **0 unreachable controls**; a clear first step on every landing (Model Studio's
"Start here" cue, the other trainers' explanation line and controls); Premium gate where the spec says (free
user: Model Studio Explore plus the DTM drills only, the other 20 models marked "(drills: Premium)"; scale-lab and
map-reader fully free; frq-coach, population-lab, diffusion-lab, borders-lab, city-lab show the Premium card); all
eight covers load at 360 and 1280.

## Sources checked this pass

- 1899 Anglo-French declaration (21 March 1899) set the long straight part of the Chad and Libya border, not the
  Libya, Niger and Algeria lines: https://en.wikipedia.org/wiki/Chad%E2%80%93Libya_border (with the ICJ case
  pages it cites, https://icj-cij.org/node/140018). Led to a fix (below).
- Hoyt, *The Structure and Growth of Residential Neighborhoods in American Cities* (FHA, 1939), rent data for 142
  cities: https://archive.org/details/structuregrowtho00unitrich (catalog record) and
  https://www.progress.org/wiki/sector-model/ (secondary). The Wikipedia page was blocked (permission timeout).
- Punjab Boundary Commission terms of reference, 1947 ("contiguous majority areas of Muslims and non-Muslims ...
  also take into account other factors"): https://nehruarchive.in/documents/terms-of-reference-for-boundary-commissions-12-june-1947-qgk5jz ,
  https://legal.un.org/riaa/cases/vol_XXI/1-51.pdf . The trainer's wording is right.
- Flint: GM employment in the Flint area about 77,000 to 80,000 in 1978, far lower by the 2000s
  (https://www.wsws.org/en/articles/1999/07/auto-j02.html , secondary). Led to a softening (below).
- Checked against standard references but not re-fetched this pass (search credits ran low): Malthus 1798;
  Ravenstein 1885 and 1889; von Thünen, *Der isolierte Staat*, 1826 (estate in Mecklenburg); Christaller 1933;
  Burgess 1925; Harris and Ullman 1945; Griffin and Ford 1980; McGee 1967; Weber 1909; Rostow 1960; Wallerstein
  1974; Omran 1971 (three stages; the fourth added later); UNCLOS 1982 zones 12/24/200 nautical miles; the
  49th parallel (1818 convention, 1846 Oregon treaty); the inner German border (zones from 1945, opened 1989,
  reunification 1990); Brasília inaugurated 1960; Poland joined the EU 2004, the UK left 2020. A teacher should
  spot-check this list.

## Per tool

### Model Studio (`model-studio`, free Explore and DTM drills)

Checked: 21 contexts, one per CED model (decision 8 holds: Griffin-Ford, McGee, de Blij and Weber appear only as
"Your class may name" asides); each has claim, origin, assumptions, a model, decoys, explanations and real
limits. Apply kinds worked: rates, epidemiological table, Malthus plot, Ravenstein bars, bid-rent, rank-size,
gravity (index and the halved-distance step), central place threshold, least cost shipping, world-system table,
authored cases.

Fixes:
- Epidemiological stage 3 drew life expectancy up to 70 while the feedback says "in the 60s": range now 62 to 69.
  Stage 2 feedback claimed "life expectancy is rising" from a one-year table: now "has risen to the 40s or low 50s".
- DTM stage 1 apply drew gaps up to 15 per 1,000 (RNI 1.5%, reads as early stage 2): now 2 to 8.
- Bid-rent feedback "Retail and offices bids ..." and negative bids: now "The bid for retail and offices is ...",
  with "(nothing left to bid there)" for a bid at or below zero.
- Central place feedback said "the store needs" for a hospital: now "it needs".
- Malthus decoy called the Green Revolution "a critique of Malthus": now "Critics of Malthus point to the Green
  Revolution ...; it is not part of his model."
- 49th parallel apply: the Superimposed distractor is arguable (the line was drawn by the US and Britain over
  Native nations); the question now asks which type "that straight line along a parallel" makes it, and the
  Superimposed slip says superimposed is about who drew a line, not its shape.
- DTM claim "Your class teaches five stages" now "This course shows five stages; some versions of the model show
  only four."
- Phone legibility: on the 360 px quiz stage the figure is about 150 px wide and the numbered badges covered
  each other (central place, Hoyt, multiple nuclei, galactic, the three regional models). Badges and tags now
  shrink with the drawing (`model-studio.css`, container units, 16 to 28 px); checked by screenshot.
- `pages.json` (and fixture): desc claimed "Every model the course framework names ... apply the model to a real
  case"; now "The models the course framework names in Units 2 to 7 ... apply the model to a case" (determinism
  and possibilism, centripetal and centrifugal forces, complementarity are not in this tool); lede "test it on a
  case".

Open (teacher or lead):
- **Phone stage plots (lead, shared).** On 360 px the quiz stage shrinks after the fit, and the studio raises
  small SVG words to 12 px, so in the Malthus, bid-rent, rank-size, Ravenstein and DTM plots the year and axis
  labels collide (screens `ms-mal-360*.png`, `ms-bid-360*.png`). The question text carries every number and
  the full-screen button shows the plot whole; three tool-local CSS attempts did not hold against the stage fit,
  so they were reverted. Needs a studio-level rule (a plot keeps its natural size and the stage scrolls, as
  city-lab's does). Also at 1280 the y-axis "0" touches the x-axis "1960" in the Malthus plot (`hug-plot.js`).
- Teacher: the epidemiological stage cut-offs (infectious share and life expectancy bands) and the transition
  thresholds are ours (as `tools-facts` says); "Western and immigrant commerce" for McGee's zones matches the
  notes ("a commercial zone run by immigrant merchants").

### FRQ coach (`frq-coach`, Premium)

Checked: 8 questions, 27 parts; verbs, rubric lines, samples and weak answers; facts in the stems (Berlin
Conference 1884-1885, Punjab Green Revolution from the 1960s with groundwater decline, polders and peat
subsidence, HDI's three dimensions, US city models of the 1920s and 1930s); originality per `originality.md`
(all original). 960 drill problems: every "demand" step names the part's verb and keys its demand, every "earns"
step keys the authored sample. No fix needed. Teacher: read the eight samples once for tone.

### Scale lab (`scale-lab`, free)

Checked: intro, map-scale ladder, five chains, the question bank for `limit`. Keys: scale from the unit each value
describes, national figure equals the population-weighted mean of the provinces (within 0.6 points), the gap,
map-scale arithmetic (cm × denominator ÷ 100,000), larger and smaller scale, the coverage rule.

Fix: the Flint chain set a single cause next to a real city; the setup now adds "Moving work abroad was one
reason among several; automation and plants moved to other US states also cut jobs."

Teacher: "Since the 2010s ... flooded at the highest tides" (Miami Beach) and "Polish workers no longer needed a
work permit" (2004; the UK kept a registration scheme to 2011) are fair simplifications; check the wording.

### Map reader (`map-reader`, free)

Checked: six map types, legend reading, pattern statements (named place and direction), misleading-map cases
(gapped legend, totals on a choropleth with the density step), limits, isolines. Every value invented and
labeled; disputed places carry no value. Keys recomputed from the map spec (class of a marked place, highest
marked class, largest circle, pattern places in the top classes, map type from the render).

Fixes: "a isoline map" (three strings) now picks "an"; data titles lowered mid-sentence kept proper words
("average July temperature", was "average july temperature").

### Population lab (`population-lab`, Premium)

Checked: STAGES teaching values and reasons, every generator's words, pyramids. Keys: CBR, CDR, RNI, doubling
time, growth with migration, the three dependency ratios (and that the pyramid's bars sum to the stated
groups), stage from rates with my own bands, shape from base against middle bars, cohort birth years and sex
ratio.

Fixes: stage 1 drills drew gaps up to 16 per 1,000 (for example 41 and 28, an arguable early stage 2): now 2 to 8;
the cohort option "A baby boom 1996 years ago" (a year printed as a count) now "A baby boom about 30 years
before 2026".

### Diffusion lab (`diffusion-lab`, Premium)

Checked: the four kinds, the slip matrix, the real cases (Italian immigrants and pizza, late 1800s to early
1900s; fashion; disease; potato or paneer burgers in India), push/pull/obstacle/opportunity scenes, migration
kinds (refugee, asylum seeker, IDP as the CED defines them; no "illegal"), Ravenstein's laws (counterflow,
short distance, big centers, women within and men abroad, as his 1885 paper words it). Keys: type classified from
the spread picture alone (arrows, changed versions, big far places at step 2, nearest-neighbor steps), hearth
letter, factor roles against where each tag sits on the map, survey percents.

Fixes: "Place A got it at never (it has not reached there)" now "Place A does not have it yet"; the refugee slip
for an IDP case said "A refugee has crossed an international border" twice: now once.

### Borders lab (`borders-lab`, Premium)

Checked: boundary stories, state shapes (labeled in every drill as "an older way to classify states; the current
course framework does not list them": owner to confirm they stay), forces and the CED devolution factors, the
UNCLOS zones and rights, the four real boundaries. Keys: antecedent or subsequent from the years, the second
type from the clue words, shape, centripetal or centrifugal, zone rights by distance, EEZ overlap 400 − D.

Fixes:
- **Fact:** the Saharan case said the 1899 Britain-France agreement drew "Straight borders across the Sahara
  (Libya, Niger, Algeria)". That agreement set the Chad and Libya line. Now "(Libya, Chad, Niger)", the text
  "a line agreed by Britain and France in 1899 became the long straight part of the Chad and Libya border", and
  the mark moved onto that line ([19.5, 21.4]); the map passes `ApHugMap.check`.
- Relict stories with the border drawn first could have the towns founded after the two countries joined
  ("towns grew after 1740. In 1740 the two countries joined"): the gap is now 30 or 40 years, always before the
  join.
- "Country A's coast guard sees a boat that Country A's coast guard suspects" now "a boat it suspects"; "a
  elongated state" now "an elongated state".

Teacher: the zones drill labels the EEZ slot "24 to 200 nautical miles"; under UNCLOS the EEZ starts at 12 (it
overlaps the contiguous zone). The answers are right (fishing within 200 is the coastal state's); the slot name is
a simplification worth a note.

### City lab (`city-lab`, Premium)

Checked: von Thünen rings and the four changes, bid-rent pairs, the seven city models with clues and limits,
central place goods, rank-size. Keys: bids and the winner from the text, crossing point, people within range
against the threshold, expected size by rank, primate ratio (3 or more), model from the description.

Fixes:
- Central place: the area within range did not fit the range (a car dealership with a 50 km range and 2,000 km²
  around the town; a bakery with a 2 km range and 50 km²). The area is now the circle the range draws (π r²,
  rounded) and the density is chosen to land near the threshold; text "about 7,854 square km lie within that
  range (a circle reaching 50 km out from the town)".
- Southeast Asian model zone "Merchant minority commercial zone" now "Immigrant merchant commercial zone", the
  notes' wording ("a commercial zone run by immigrant merchants (often Chinese)"); Model Studio's "Western and
  immigrant commerce" already matches.
- "What does homes bid", "Homes outbids industry" now "What is the bid for homes", "The bid for homes is higher
  than the bid for ...". "the store" for a gas station or dealership now "it". "Which is a limit of the southeast
  asian city model" now keeps "Southeast Asian", "Latin American", "African" capitalized. Middle-order goods: "people
  travel less far for it" (was "will not travel far").
- Shared fix (`hug-model.js`): a rings drawing with five or more rings drew its numbers 15 px in 18-unit bands, so
  the numbers touched (city-lab's concentric zone item, at 220 px and at 300 px). Numbers are 12.5 px when a band is
  under 20 units; checked by screenshot and by measurement (no overlap in eight rings drawings).

## Checks after the fixes

- `node --test scripts/test/aphug-*.test.mjs`: 157 pass (tool tests 39 pass); `check-aphug-content.mjs`: tools 0
  failing (exams 0 at the last run; the exams builder's work moves under it); `check-aphug-map.mjs`: clean.
- Every course's `--check` (anp, apbio, apcalc, apcalcbc, apchem, apenv, apmacro, apmicro, apphys, apprecalc,
  appsych, apstat): byte-identical. `build-aphug.mjs --check` lists 5 stale generated files (index, curriculum,
  formula sheet, models page, justify.json) from content and exams work, none from the tools; left for the lead's
  build.
- My key scripts rerun after the fixes: 0 errors.

## What a teacher should read

1. The 21 Model Studio "limits" lists and the epidemiological stage bands (ours).
2. The real cases: the four borders-lab boundaries, the five scale-lab chains, the diffusion-lab cases.
3. State shapes kept as a labeled older classification (owner decision).
4. The EEZ slot name (12 vs 24 nautical miles) in the borders-lab zones drill.
5. The eight FRQ coach samples.
