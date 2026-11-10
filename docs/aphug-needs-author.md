# AP® Human Geography: open questions for a person

Things a person (the owner, or an AP® Human Geography teacher) should decide or check. Add to this file instead of
guessing; mark an entry resolved with the date and move it to the end.

## ced-text: the CED text in the map is our summary (open, 2026-11-09)

All 68 topic titles and the seven unit titles in `docs/aphug-dependency-map.json` are the official ones
(framework.md, Course at a Glance). The `objectives`, `knowledge` and `exclusions` in `docs/aphug-ced-map.json`
are our summaries of the CED (framework.md section 3), not its words, and some essential knowledge statements were
read only in part. A person with the CED should check every topic's entry before its lessons are written, and
the exclusions above all (the content check refuses only models the map does not name).

## mcq-options: five options on the exam, four in the bank (open, 2026-11-09)

The exam has five options per question (framework.md section 4). Bank singles have four (house style, spec
decision 5); a fixed exam form gives a bank item its fifth option from the form's `fifth` map. Confirm the split,
or decide that bank items carry five options too (then `MCQ_OPTIONS.bank` in `scripts/lib/aphug-exams.mjs`
becomes 5 and every bank item needs a fifth option).

## mcq-sets: how many questions use each stimulus kind (open, 2026-11-09)

The CED says Section I has sets and single questions with maps, data, images and text, but gives no counts.
`EXAM_SETS` (map 1 to 4 sets, data 1 to 4, image 0 to 3, text 0 to 3) is a guess from released practice exams'
shape. Check against the CED's exam description and the latest practice exam (without copying it).

## practice-weights: Section I skill weights (open, 2026-11-09)

The map's skill categories carry the CED's weight ranges as read; `checkForms` uses them only when the map sets
`"practicesConfirmed": true`. Confirm the ranges, then set it.

## topic-skills: focus skills per topic (open, 2026-11-09)

Each topic's `practices` in the map are our choice (two or three skills, spread so every skill appears in every
unit). The CED does not list skills by topic. Confirm or change them before authors start.

## regions: the ten base map regions (open, 2026-11-09)

`REGIONS` in `scripts/build-aphug-basemaps.mjs` puts each country in one of ten world regions (North America,
Latin America, Europe, Russia and Central Asia, North Africa and Southwest Asia, Sub-Saharan Africa, South Asia, East
Asia, Southeast Asia, Oceania) [ours, verify]. Textbooks differ (where Afghanistan, Sudan, the Caucasus and
Mexico go). Pick one scheme, then rebuild the bases. The CED itself names no fixed set of world regions.

## borders: the base map's disputed places (open, 2026-11-09)

The bases use Natural Earth's de facto lines, and every map caption says they show no position on any dispute.
Marked `disputed` (a value on them needs `disputedOk`): Western Sahara, Northern Cyprus, Somaliland, Kosovo,
Taiwan, Palestine, Falkland Islands / Islas Malvinas. Kashmir, Crimea and the South China Sea are not separate
features at 1:110m, so a map cannot color them apart. Confirm the list and the caption wording.

## map-renders: flow maps and cartograms (open, 2026-11-09)

`hug-map.js` draws reference, choropleth, dot, graduated symbol and isoline maps. Flow maps (migration, trade) and
cartograms are drawn as figures for now. Decide whether to add them as renderings before Unit 2 authoring (flow maps
appear on released exams).

## frq-grader: the AI grader for seven one-point parts (open, 2026-11-09)

The AI FRQ grader (`docs/frq-grader.md`) is calibrated on other courses' rubrics. HUG's three 7-point FRQs need
their own eval set before the course joins `FRQ_COURSES`.

## identity: provisional accent, cover and ranks (open, 2026-11-09)

The teal accent (hue 188, `#094953` on `#E1F1F4`), the clay cover (`#7A3310`) and its art (a globe with meridians), the headline "from local
to global." and the ranks (Map Reader, Scale Shifter, Pattern Spotter, Region Builder, Model Maker, World Analyst,
Geography Legend) are provisional. The owner approves them at launch. Tool covers come with each trainer.

## Facts marked [ours, verify] in the research

From `docs/aphug-research/accuracy-risks.md`; check each against its source before any lesson uses it.

- India passed China as the most populous country in 2023 (UN WPP); recheck in WPP 2024.
- China's policy dates: one child 1980 to 2015, two children 2016, three children 2021, later incentives.
- Megacity 10 million and metacity 20 million: teach as a convention with a source; the CED states no threshold.
- The UN's "Least Developed Countries" list is a separate category from "less developed" in AP usage.
- BRICS and other group memberships change; test functions, not counts.
- EU and NATO membership changes (UK left the EU 2020; Finland joined NATO 2023, Sweden 2024).
- Western Sahara: claimed and largely administered by Morocco, on the UN list of non-self-governing territories.
- South China Sea: the 2016 arbitral ruling and China's rejection of it.
- South Sudan's independence in 2011.
- Naming forms: Türkiye, Czechia, Eswatini, North Macedonia, Myanmar, Kyiv, Côte d'Ivoire, Timor-Leste, Cabo Verde,
  Viet Nam.
- 193 UN member states and two observer states (Holy See, State of Palestine).
- Group names: "Native American" (CED 4.1), "Hispanic or Latino" in census data, "tribe" avoided.
- Religion: universalizing and ethnic as the AP classification; adherents may not use these labels.
- Language families: avoid contested families (Altaic).
- Map projections: the trade-off examples (Mercator, Robinson, Peters, and others) in framework.md section 7.

## unit-4-facts: Unit 4 facts written from memory (reviewed 2026-11-09, docs/aphug-reviews/u4.md)

Reviewer check of author D's list. "Verified" names the source read; "open" items still need a person.

- Verified, Elections Québec: 1980 Yes 40.44%, No 59.56%, turnout 85.61%
  (https://www.electionsquebec.qc.ca/en/results-and-statistics/referendum-on-the-1980-sovereignty-association-proposal-for-quebec/);
  1995 Yes 49.42%, No 50.58%, turnout 93.52%
  (https://www.electionsquebec.qc.ca/en/results-and-statistics/1995-referendum-on-quebecs-accession-to-sovereignty/).
  The rounded table values (40.4/59.6/85.6; 49.4/50.6/93.5) are right.
- Verified, Electoral Management Board for Scotland (the official 2014 count): Yes 44.7%, No 55.3%, turnout 84.6%
  (https://emb.scot/scottish-independence-referendum-2014-3/scottish-independence-referendum-18-september-2014). The
  stimulus credits "Electoral Commission"; both published the result, so it stands.
- Verified (secondary): Brexit 2016 Leave 51.9%, Remain 48.1%; UK left in 2020.
- Verified with a caveat, `political-processes-s1` classes: every date class checked against the standard dates
  (1960 values, Sierra Leone and Tanzania 1961, Uganda, Rwanda and Burundi 1962, Kenya 1963, Malawi and Zambia 1964,
  Gambia 1965 to Djibouti 1977, Zimbabwe 1980, Namibia 1990, Eritrea 1993, South Sudan 2011). 17 African states in
  1960: Library of Congress (https://blogs.loc.gov/maps/2023/10/mapping-the-year-of-africa/). Sudan is a grey context
  shape on this base map, so its 1956 date is not needed. Open: South Africa in "before 1950" (Union 1910, Statute of
  Westminster 1931, majority rule 1994) is a judgement call; a teacher may prefer a footnote. The "compiled by LevlPrep"
  source line stays.
- Verified, CFA franc: as of March 2026 Mali, Burkina Faso and Niger remain in the eight-member West African Economic
  and Monetary Union, which uses the CFA franc, "backed by the French treasury"
  (https://prod.currency-news.com/news/2026/mar/05/no-new-currency-for-west-african-states/). The 2019 reform
  (announced 21 December 2019) covers the West African CFA franc only; notes now say so
  (https://www.africanews.com/2019/12/22/end-of-an-era-west-african-states-to-halt-use-of-cfa-franc/). Recheck yearly:
  the Sahel states talk of a currency of their own.
- Verified, supranational table: AU Constitutive Act art. 4(h) (intervention for war crimes, genocide, crimes against
  humanity, by Assembly decision) and art. 30 (governments that take power by unconstitutional means may not take part)
  (https://dirco1.azurewebsites.net/au.nepad/constitutive.htm); Arctic Council founded 19 September 1996 by the Ottawa
  Declaration, an intergovernmental forum, decisions by consensus of the eight Arctic States, six Indigenous Permanent
  Participants, military security excluded (https://arctic-council.org/about/). NATO Article 5 invoked once (2001),
  UN Charter art. 25, EU 1993, ASEAN 1967: standard, not re-read.
- Verified (secondary): Finland joined NATO 4 April 2023, Sweden 7 March 2024.
- Verified (secondary): Korean DMZ about 4 km by about 250 km (1953 armistice); Chamizal settled 1963 after the 1864
  shift (NPS, https://www.nps.gov/cham/learn/historyculture/chamizalconvention.htm); Ever Given aground 23 to 29 March
  2021; 2020 reapportionment Texas +2, Ohio and New York -1 each; Rucho v. Common Cause (2019); Greenland
  self-government 2009; Nunavut 1999; Nigeria 12 states (1967) to 36 (1996); Belgium federal 1993; Spain 1978; ETA
  2011 and 2018; equalization 1957; CPR 1885; 1818 and 1846 treaties; 1881 Chile and Argentina treaty; OAU 1964;
  Resolution 1514 wording (14 December 1960); 2016 South China Sea award and China's rejection.
- Fixed: Partition now gives the range (about 15 million, estimates about 10 to 20 million); Tanzania's Swahili is
  the language of government and of primary schools (secondary teaching is in English).
- New dated facts added by the reviewer, recheck yearly: Louisiana v. Callais, 29 April 2026, narrowed when Section 2
  of the Voting Rights Act requires majority-minority districts (CRS LSB11431,
  https://www.everycrsreport.com/reports/LSB11431.html); California Proposition 50, 4 November 2025, legislature map for
  US House elections 2026 to 2030 (https://ballotpedia.org/California_Changes_to_Congressional_Redistricting_Amendment_(2025));
  nine Schengen members with temporary internal checks as of 2 June 2026 (European Commission IP/26/1223,
  https://ec.europa.eu/commission/presscorner/api/files/document/print/en/ip_26_1223/IP_26_1223_EN.pdf).
- Open, classification calls for a teacher: Iceland as "close to a nation-state"; the China and Viet Nam boundary as
  subsequent; Chile and Argentina as antecedent (the notes name the Indigenous caveat); Eastern Europe in the Cold War
  as the shatterbelt example; Somalia after 1991 as the failed-state example; provincial data called "local
  (subnational)" scale in `devolution-factors` item 6 and FRQ Q3 part A. None is keyed on a disputed status.

## unit-7-facts: Author G facts to verify (open, 2026-11-09)

Unit 7 claims written from memory, kept cautious; a reviewer should check each against its source before launch.

- ILO estimate that about 61% of the world's workers had informal jobs ("Women and Men in the Informal Economy", 2018).
- Grameen Bank story: Yunus's first loan in 1976; Nobel Peace Prize 2006 shared with the bank.
- Rana Plaza collapse near Dhaka, 2013, more than 1,100 deaths; Iceland's equal-pay certification law of 2017;
  Rwanda's majority of women in the lower house since 2008 (IPU); Andhra Pradesh microfinance restrictions, 2010.
- Dates: Watt's steam engine (1770s), Lowell mills (1820s), 1851 census urban majority in England and Wales, Factory
  Act 1833, Japan from 1868, shipping containers in the 1950s, Weber 1909, Rostow 1960, Wallerstein 1970s,
  Prebisch at ECLA, Mexico's 1982 debt crisis, IMF 1944, WTO 1995, OPEC 1960, Mercosur 1991 (founding four), USMCA
  2020, China's SEZs 1980 (Hainan 1988) and open coastal cities 1984 (Shanghai, Tianjin), Ford's assembly line 1913,
  BMW Spartanburg 1994, Newfoundland cod moratorium 1992 (about 30,000 jobs), SDGs 2015 for 2030, Our Common Future
  1987, Greece's 2010 rescue loans.
- Qualitative claims: Zambia's exports mostly copper and its mid-1970s borrowing after a copper price fall; Côte
  d'Ivoire the largest cocoa grower; Kenya's large geothermal share (Olkaria, near Lake Naivasha); Iceland's aluminum
  smelters; Kerala's literacy and life expectancy compared with its income; South Sudan "low income" in FY27.
- HDI values in `development-measures-s1` come from accuracy-risks.md section 1 (UNDP 2025 report, 2023 data):
  re-read on the UNDP data center (it was not reachable from the authoring session) and swap in the 2026 report if
  it is out before launch.

## unit-5-facts: Author E facts to verify (open, 2026-11-09)

Unit 5 claims written from memory or from secondary summaries, kept cautious and never the only route to a key; a
reviewer should check each against its source before launch. Checked this session (fetched): FAO, The Status of
Women in Agrifood Systems (2023) figures (36% and 38%; Sub-Saharan Africa 66% and 60%; Southern Asia 71% and 47%;
82 cents; 24%; 40 of 46 countries; 45 million); FAO SOFIA 2024 (aquaculture 94.4 Mt, 51% of aquatic animals in 2022);
UNCTAD State of Commodity Dependence 2025 (more than 60% threshold; 95 of 143 developing countries, 2021-2023);
USDA 2022 Census via Choices magazine (1.9 million farms, 463 acres, 36% women producers, 6% of farms with 1 million
dollars or more in sales making 78% of sales; 4% and 69% in 2017).

- Not re-read: USDA ERS (2005, EIB-3) 41% of US workers in farming in 1900 and 1.9% in 2000; about 6.8 million US
  farms in 1935; FAO SOFI 2024 "about 733 million people faced hunger in 2023"; the 2016 US National Academies GMO
  review's finding; Kazakhstan's Kok-Aral dam finished in 2005; Ethiopia's land certification listing both spouses;
  bananas shipped at about 13 °C; Brazil the largest soybean exporter and China the largest importer (cited "USDA,
  2024"); horses reaching the Comanche and Lakota in the 1600s and 1700s; Irish famine figures (about 1 million
  deaths, more than 1 million emigrants); IR8 released 1966; Borlaug's Nobel 1970; the term "Green Revolution" 1968;
  Land Ordinance 1785; McCormick reaper 1831; Deere steel plow 1837; Tull seed drill 1701; Conservation Reserve
  Program since 1985; Everglades restoration commitments since 2000; Horn of Africa five failed rainy seasons
  2020-2023; Black Sea grain deal July 2022 to July 2023.
- Hearth dates are given only as "about 12,000 to 10,000 years ago" for the start of farming; the hearth table names
  crops, not dates. The CED's list (Fertile Crescent, Indus River valley, Southeast Asia, Central America) is from
  framework.md's paraphrase (needs-author `ced-text`).
- Map edits for review: `irrigation` moved from agriculture-consequences to agriculture-intro (5.1 and 5.3 need it);
  `gmo` moved from agriculture-challenges to green-revolution (5.5 must say GMOs are not Green Revolution).
- `frq-farm-trade-one` lists `trade-world-economy` (7.6) so it may key comparative advantage; it therefore unlocks
  after Unit 7 topic 7.6, not with Unit 5. If the lead wants it live with Unit 5, part D must change to a Unit 5 or
  earlier concept.
