# Accuracy review: practice exams, rewritten FRQs, "Make it specific", models page (2026-11-09)

Reviewer: independent accuracy review (Phase 4), scope: Phase 3 (`docs/aphug-reviews/phase3.md`, spec section
5b) and the FRQs rewritten by the originality and unit reviews. Rules applied: `docs/aphug-briefs/review-common.md`
and `docs/aphug-research/accuracy-risks.md` (binding). Tool files and `human-geography/data/tools/` were read only.

## What was checked

- **Both practice exam forms, all 120 MCQs as served** (`servedForm`, five options each, read in a dump of the
  served order): every key; each of the **104 added fifth options** for a second defensible answer, a length tell
  and absolute words; the **16 exam-only items** with every number recomputed by hand and every map, pyramid and
  table read against its data (country-a internet map, Country V pyramid: under 15 = 40.6% of a total of 100.0%;
  symbol map: rank-size third city 1,200 / 3 = 400 thousand, primate ratio 1,200 / 260 = 4.6; physiological
  density 40,000,000 / 20,000 = 2,000; doubling time 70 / 2.5 = 28 years; comparative advantage K 0.2 vs L 0.33
  phones per shirt; Hormuz mark E at 56.4° E, 26.6° N; Little Saigon text). Bank stimuli the forms use were
  read for the fifth options that cite them (boundary marks A to F, the Oaxaca and Puebla flow map, the von
  Thünen distance table, the city-size map, the Country B sector chart, the Country S table, the riverbank panels).
- **Section II choices**: form 1 `frq-gentrification-none`, `frq-language-map-one`, `frq-human-environment-two`;
  form 2 `frq-development-theory-none`, `frq-rail-boundary-one`, `frq-devolution-two` (three units each, no
  repeat; the code check agrees).
- **The 10 rewritten FRQs**, every part: verb, one checkable rubric point the sample earns, facts and dates,
  scale words: `frq-supranational-none`, `frq-development-table-one`, `frq-industrial-cluster-two`
  (originality); `frq-population-policy-none`, `frq-aging-pyramid-one` (u2); `frq-green-revolution-none`,
  `frq-farm-trade-one`, `frq-von-thunen-two` part B (u5); `frq-world-cities-two`, `frq-rail-boundary-one` (u6).
  Table sums recomputed (cluster jobs 180, 187, 227; coffee per tonne 3,000 and about 2,400 dollars; GII falls
  0.15 then 0.10).
- **All 73 "Make it specific" prompts**: context, model answer and each slot's key.
- **Models you must know**: all 26 entries (claim, assumptions, limit from Model Studio for 21, the five written
  in `models.json`), each dated example and every easy-to-confuse flag. Only CED-named models are presented as
  required; Griffin-Ford, McGee and de Blij appear only as Model Studio "your class may name" asides.

## Errors and fixes (before and after)

| # | Score | Where | Before | After |
|---|---|---|---|---|
| 1 | error | form 1 fifth, `hug-trade-world-economy-9` | "A trade bloc that Costa Rica and Canada both belong to" (the two have had a bilateral free trade agreement since 2002, so a student could defend part of it) | "A single currency that Costa Rica and Canada both use" (why names the colón and the Canadian dollar) |
| 2 | risk | form 2 fifth, `hug-city-structure-11` (Los Angeles) | "Galactic city" (LA is often used as a polycentric, car-based example, so a second defensible answer) | "Central place theory" (not a model of land use inside one city) |
| 3 | risk | form 1 fifth, `hug-diffusion-types-5` | "Expansion diffusion from Cherokee towns to English towns" (stimulus diffusion is a kind of expansion diffusion, so half of it is true) | "Reverse hierarchical diffusion from small towns up to large cities" |
| 4 | polish | form 1 fifth, `hug-settlement-survey-10` | "The government divided the land into large square sections for single farms" (repeated option D) | "Living in a village gives each family the largest possible farm" |
| 5 | polish | form 2 fifth, `hug-culture-on-the-land-6` | "The new glass tower beside the river" (repeated option B) | "The river that flows past the mill" (a physical feature, not a human mark) |
| 6 | error | form 2 exam-only `hug-exam-2-01`, key | "It lies on the Strait of Malacca" (Singapore lies on the Singapore Strait, at the southern end of the Strait of Malacca) | "It sits beside the Strait of Malacca, a main shipping route between oceans" |
| 7 | polish | `models.json` Ravenstein example | "from the British census of 1881 (published in 1885 and 1889)" (reads as if the census was published then; the 1889 paper added other countries) | "mainly from the British census of 1881, in papers published in 1885 and 1889" |
| 8 | risk | `justify/unit-2.json` `u2-place-pronatalist` | Hungary's income tax exemption for mothers of four or more since 2020, with no word of later change | adds that it was widened to mothers of three in 2025 and to younger mothers of two in 2026 |

After the fixes: `node scripts/check-aphug-content.mjs` 0 failing (2 forms, 16 exam-only items, 73 prompts;
1,107 items); `node --test scripts/test/aphug-*.test.mjs` 157 of 157 pass. Keys did not change position.

Nothing else was wrong. The other 99 fifth options are clearly wrong, name the slip in their why, and carry no
absolute-word or length tell; the 16 exam-only keys are right and need their stimulus where they have one.

## For the author (not changed)

- `frq-aging-pyramid-one`: the Country Z pyramid bars sum to 97.4%, not 100%. No part asks for a share, so no
  answer changes, but a student who adds bars will notice. Rescale when the figure is next touched.
- `u1-describe-elevation`: the context says the lines fall "toward the South Coast", the model answer says
  "toward the east"; both fit the base map, but one direction would read more cleanly.
- `u2-legend-fertility`: classes "1.5 to 2.0" and "2.1 to 2.9" leave a gap for values such as 2.05.
- `frq-industrial-cluster-two` and `frq-rail-boundary-one` call a whole metro or province "regional"; the forms
  and `frq-von-thunen-two` key province data as "local (subnational)". Both fit `scale-words` as written; a
  teacher should confirm the pair (needs-author `scale-words`).
- Form 2 `hug-agricultural-origins-14` (bank, reviewed in u5) keys expansion diffusion for farming entering
  Europe; ancient DNA shows farmers largely migrated (relocation). The stem's wording leads to expansion, but a
  teacher may prefer a different example.

## For the tools reviewer (Model Studio data)

No error found in the 21 Model Studio entries the models page draws on (claims, assumptions, limits, origins).
One note: the galactic city's origin line says "also called the peripheral model"; textbooks use both names, but
Harris's peripheral model (1997) and Lewis's galactic city (1983) are separate papers.

## Sources (read 2026-11-09)

| Fact | Where used | Source |
|---|---|---|
| WUP 2025 city values: Jakarta 41.9, Tokyo 33.4, New Delhi 30.2, Shanghai 29.6, Cairo 25.6 (7th), Manila 24.7, São Paulo 18.95 million; megacity over 10 million | `frq-world-cities-two` | UN DESA, The World's Cities in 2025 data booklet, https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2025_data-booklet_world_cities_in_2025.pdf (press reports giving Cairo 32 million are wrong) |
| Japan 2023: 727,277 births, 1,575,936 deaths (MHLW) | models DTM | https://www.nippon.com/en/japan-data/h02015/ |
| Tysons: rural crossroads into the 1950s, mall approved 1962, opened 1968; 26,374 residents (2020 census), daytime population over 100,000 | exam-only `hug-exam-2-06`, models galactic | https://en.wikipedia.org/wiki/Tysons (census and Fairfax County figures cited there) |
| FY27 thresholds $1,175 / $4,635 / $14,375, 2025 Atlas GNI | `u7-legend-income-groups` | https://documents1.worldbank.org/curated/en/099063026190549947/pdf/BOSIB-8ff63426-3c40-412d-bad2-cc20a4ebea81.pdf |
| Welsh 2021: 17.8% of Wales, 64.4% of Gwynedd | `u3-scale-welsh` | https://www.welshlanguagecommissioner.wales/policy-and-research/research/2021-census |
| McDowell County median household income about 40% of the US median in 2020 and 2020-2024 | `u1-scale-income` | https://www.neilsberg.com/insights/mcdowell-county-wv-median-household-income ; https://usafacts.org/answers/what-is-the-income-of-a-us-household/county/mcdowell-county-wv/ |
| Hungary: mothers of four exempt from 2020, three from 2025, two (under 40) from January 2026 | `u2-place-pronatalist` | https://xpatloop.com/channels/2026/03/growing-tax-exemptions-for-mothers-in-hungary.html |
| South Korea TFR 0.72 in 2023 (Statistics Korea, February 2024) | `frq-population-policy-none` E | https://www.asiae.co.kr/en/article/2024022811165704436 |
| Niger about half under 15 | `frq-aging-pyramid-one` G | https://en.wikipedia.org/wiki/Demographics_of_Niger (UN figures); WPP 2024 itself not re-read |
| Zambia's kwacha lost about 45% against the dollar in 2015 as copper fell | models commodity dependence | https://www.aljazeera.com/news/2015/10/19/zambia-leader-seeks-gods-help-as-currency-freefalls |
| Dublin to London Heathrow Europe's busiest international route (OAG) | models gravity | https://www.irishtimes.com/life-and-style/travel/dublin-london-heathrow-named-busiest-air-route-in-europe-1.3484094 (12 months to February 2018; the 2019 claim "one of the busiest" holds, but a 2019 OAG list was not read) |
| Peru 2017 census: Lima department 9,485,405 | `u6-model-lima` | https://en.wikipedia.org/wiki/2017_Peruvian_census (INEI) |
| Iceland equal pay certification passed 1 June 2017, in force 2018, 25+ staff | form 2 `hug-women-development-12` | https://government.is/news/article/2018/01/30/Questions-and-Answers-on-equal-pay-certification |
| Saudi Arabia ended required separate restaurant entrances in December 2019 | form 1 `hug-culture-on-the-land-11` | https://gulfnews.com/world/gulf/saudi/saudi-arabia-ends-gender-segregation-in-restaurants-1.1575821601026 |

Checked against standard references without a fetch this pass (stable historical dates): Malthus 1798; von Thünen
1826; Christaller 1933; Burgess 1925; Hoyt 1939 (142 cities); Harris and Ullman 1945; Rostow 1960; Wallerstein
1974; Omran 1971; Ricardo 1817; Batavia 1619; Nairobi 1899; Paseo de la Reforma 1860s; Willis Tower 1973;
Flevoland province 1986; Belgium federal 1993; 2020 census New York 8.8, Los Angeles 3.9, Chicago 2.7 million;
Texas +2 and Ohio -1 seats after 2020; Rucho v. Common Cause 2019; Québec 1995 No 50.6%; Official Languages Act
1969; Dragon Gate 1970; Curitiba BRT 1974; Shenzhen SEZ 1980; Grameen Bank 1983; M-Pesa 2007; Korean DMZ 1953;
OAU border resolution 1964; Chicago over 1 million in 1890; Detroit 1950 to 2020; Hungary's baby loan 2019;
Kerala and Bihar TFR (NFHS-5, 2019-21); Copperbelt smelters from the early 1930s; Garreau's Edge City 1991.

## What a teacher should confirm

1. The two reworded fifth options that touch content (rows 2 and 3): Los Angeles as multiple nuclei is the key,
   and no galactic option is now offered.
2. "Local (subnational)" for province data and "regional" for a metro area (`scale-words`).
3. The fifth options as a set, read once by someone who teaches the course: this review found 5 to change out
   of 104; a second human read is cheap.
4. Hypothetical numbers in exam-only items are invented; real ones above are logged for the yearly pass.
