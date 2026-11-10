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

## map-renders: flow maps and cartograms (flow maps done 2026-11-09; cartograms open)

`hug-map.js` now draws flow maps (`render: 'flow'`, arrow width from the value, a legend of sample widths) and
has an invented `metro` base (integration pass, `docs/aphug-reviews/integration.md`). Cartograms are still drawn
figures (map-reader draws its own Country A cartogram). Decide whether a cartogram rendering is worth building.

## frq-grader: the AI grader for seven one-point parts (open, 2026-11-09; partly done at launch)

The AI FRQ grader (`docs/frq-grader.md`) is calibrated on other courses' rubrics. HUG's three 7-point FRQs need
their own eval set before the course joins `FRQ_COURSES`.
- **Launch, 2026-11-10**: `aphug` joined `FRQ_COURSES` with its conventions (the task verb sets what earns each
  part), a calibration example (`frq-population-policy-none` C and G) and four eval cases (41-44). Still open: rerun
  the eval with them before the grader is switched on for this course; a teacher may check the four cases' marks.

## identity: provisional accent, cover and ranks (open, 2026-11-09; final proposal at launch)

**Launch, 2026-11-10 (spec decision 11)**: accent, headline, hand line and ranks kept; the cover's wire globe read
as a ball, so it is now an Earth with land, its grid and a gold migration path to a gold pin (cover, thumb and band
art); the icon is the common globe sign. The owner confirms (spec section 9). The original note:


The teal accent (hue 188, `#094953` on `#E1F1F4`), the clay cover (`#7A3310`) and its art (a globe with meridians), the headline "from local
to global." and the ranks (Map Reader, Scale Shifter, Pattern Spotter, Region Builder, Model Maker, World Analyst,
Geography Legend) are provisional. The owner approves them at launch. Tool covers come with each trainer.

## scale-words: one house term for data on parts of a country (settled at launch, 2026-11-10; teacher to confirm)

**Launch**: keys say "local (subnational)"; notes may say a province or state is a subnational unit; nothing says
"regional scale" for part of one country (the notes, bank items and FRQ part changed are listed in
`docs/aphug-reviews/launch.md`, section 1). A teacher who wants "regional" accepted for parts of a country would
change the keys and these notes together. The original note:


The course uses the CED's four scales (global, regional, national, local; framework.md 1.6) with one rule: the
scale of analysis is the unit of the data. Regional means a group of countries; data for provinces, states or
counties are "local (subnational)", the wording the 2025 scoring accepted (Chief Reader Report, set 2 Q3A). The
glossary, the skills topic, scale-lab and every keyed item follow it (integration check, 2026-11-09). Some
textbooks call a province or a region inside a country "regional": a teacher should confirm that the course may
say both usages exist, and whether "the regional scale" for the US Midwest or the Great Plains (notes listed in
`docs/aphug-reviews/integration.md`) should become "local (subnational)".

## publish-order: FRQs unlock only when all their units are live (done 2026-11-10: all eight chapters published together)

Every FRQ but the three Unit 1 ones joins two units (as the exam does), and it goes live only when every unit it
lists is published. Published in course order, each unit adds its FRQs (Unit 1: 3, Unit 2: 3, Unit 3: 2, Unit 4:
4, Units 5 to 7: 3 each; 21 in all). A unit published out of order (Unit 6 before Unit 2, say) has no FRQ.
Publish in course order, or all at once.

## tools-facts: trainers' open points for the Phase 4 accuracy pass (open, 2026-11-09)

From the builders' reports (`self-t1.md` to `self-t4.md`): Ravenstein placed on 2.8 and worded as usually taught
(five laws; the women and men law from the 1885 paper); epidemiological transition taught as four stages (Omran's
three plus a later fourth); the Southeast Asian model's "alien commercial zone" renamed (Model Studio "Western and
immigrant commerce", city-lab "merchant minority commercial zone": pick one wording); the African model's market
zone as one of three centers; Hoyt "142 US cities, 1939"; the transition rate thresholds are ours
(`ApHugCalc.transitionStage`); state shapes kept though the current CED does not name them (labeled an older
classification; owner to confirm); borders-lab real cases (49th parallel 1818 and 1846, the inner German border,
the 1899 Anglo-French line, Punjab 1947) and diffusion-lab real cases (pizza, paneer burgers); scale-lab's
invented values on real outlines; no trainer uses real-country pyramid data.

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

## unit-7-facts: Author G facts to verify (reviewed 2026-11-09, partly open)

Reviewer u7 (docs/aphug-reviews/u7.md). WebFetch was not approved in the review session, so no source page or PDF
could be read; "title-checked" means a web search returned a primary or dated page whose title states the fact.
Everything else stays open for a pass that can read the sources.

- ILO "about 61% of the world's workers had informal jobs": now cited as "ILO, 2018 report" (2016 data). OPEN: not
  re-read; search shows newer ILO figures near 58% (ILOSTAT blog "Decent Work Reality Check: Informality";
  ILO WESO). Swap to the latest ILO figure with its data year once read.
- Grameen Bank 1976 first loan; Nobel Peace Prize 2006 shared with the bank. OPEN (low risk, not searched).
- Rana Plaza, near Dhaka (Savar), 2013, more than 1,100 deaths: title-checked (en.wikipedia.org/wiki/Rana_Plaza_collapse;
  thedailystar.net "deadliest industrial tragedy"). Count not re-read.
- Iceland equal-pay certification law of 2017: title-checked (government.is "Questions and Answers on equal pay
  certification", 2018-01-30; wageindicator.org "Iceland - Legislation on equal pay - March 31, 2017"; NPR 2018-01-05).
  The size threshold ("larger employers", 25+ staff) not re-read.
- Rwanda, majority of women in the lower house since the 2008 election: 2008 title-checked (pbs.org "Rwanda elects
  world's first majority female parliament", 2008-10; IPU "How did Rwanda become no.1 for gender equality", 2022).
  OPEN: the 2024 election result (needed for "since") not re-read.
- Andhra Pradesh 2010 microfinance restrictions: OPEN (not searched).
- Dates list (Watt 1770s ... Greece 2010): OPEN as sources, but the reviewer found each consistent with standard
  references; none is the only route to a key. IMF "set up in 1944" means the 1944 Bretton Woods agreement.
- Zambia mostly copper exports and mid-1970s borrowing: OPEN (search found only trade-data pages, not read).
- Côte d'Ivoire: notes now say "has long been the world's largest grower of cocoa beans". OPEN (titles consistent,
  no figure read).
- Kenya's large geothermal share near Lake Naivasha: title-checked (thinkgeoenergy.com "Geothermal supplies largest
  share to Kenya's growing electricity demand"; powermag.com "Kenya banks on geothermal for majority of its power").
- Iceland's aluminum smelters: OPEN (low risk).
- Kerala: wording changed to "though several Indian states have a higher income per person" (the old "not far
  ahead" was doubtful; Kerala's income is above India's average). OPEN: cite state data with a year if kept.
- South Sudan "low income" FY27 and the FY27 thresholds: verified through accuracy-risks.md section 1 (World Bank
  FY27 document, no country moved down).
- HDI values in `development-measures-s1` and the lesson hook (Iceland 0.972, Norway and Switzerland 0.970, US 0.938,
  South Sudan 0.388; UNDP 2025 report, 2023 data): match accuracy-risks.md section 1 (UNDP data center). DEADLINE:
  UNDP announces the 2026 HDR for release on 1 December 2026 (hdr.undp.org "2026 Human Development Report to be
  released on 1 December"); swap s1, the hook and the notes sentence to the 2026 report then, or keep the 2025 label.
- "About 6% earned the point" (trade hook): framework.md section 6, 2025 set 2 Q2C CR report. Verified there.
- FRQ originality (frq-development-table-one vs 2023 set 2 Q2; frq-industrial-cluster-two vs 2023 set 1 Q3): OPEN.
  The released PDFs (apcentral ap23-frq-human-geography-set-1.pdf and set-2.pdf) could not be read. From the CR
  summaries in framework.md section 7, the released items cover HDI components, an outcome type, table values and
  Rostow/DTM (set 2 Q2) and growth pole vs agglomeration plus the galactic city model (set 1 Q3). Ours share
  concepts (set by the lead's plan) but use invented data and different tasks; a reader of the PDFs must confirm
  no wording or part sequence was adapted.

## unit-5-facts: Author E facts (reviewer u5, 2026-11-09, docs/aphug-reviews/u5.md)

Checked by the Unit 5 reviewer against dated sources (full list in `docs/aphug-reviews/u5.md`).

Verified:

- FAO, The Status of Women in Agrifood Systems (13 Apr 2023): 36% of working women and 38% of men in agrifood
  systems; Sub-Saharan Africa 66% and 60%; Southern Asia 71% and 47%; 82 cents; 24% productivity gap; 45 million.
  Verified (FAO newsroom, 13 Apr 2023; FAO report overview). "40 of 46 countries" was not re-read this pass (still
  open, low risk: author fetched it).
- FAO SOFIA 2024: aquaculture 94.4 Mt of aquatic animals, 51% of the total, 2022, first time ahead of capture.
  Verified (FAO newsroom).
- UNCTAD State of Commodity Dependence 2025: more than 60% of merchandise export earnings; 95 of 143 developing
  countries, 2021-2023. Verified (UNCTAD news and report page).
- USDA 2022 Census: 1,900,487 farms, 463 acres (441 in 2017), 36% women producers; $1 million farms 6% of farms
  and 78% of sales (4% and 69% in 2017). Verified (NASS release 13 Feb 2024; Choices magazine).
- About 6.8 million US farms at the 1935 peak. Verified (USDA ERS Chart of Note 106385).
- 41% of US workers in farming in 1900, 1.9% in 2000 (Dimitri, Effland and Conklin, USDA ERS EIB-3, June 2005).
  Verified: report title and date from the ERS PDF; the two figures as quoted by works citing it (the PDF text
  could not be extracted).
- FAO and partners, SOFI 2024: 713 to 757 million people faced hunger in 2023, midpoint about 733 million.
  Verified (Devex report of SOFI 2024).
- National Academies 2016: "no substantiated evidence that foods from GE crops were less safe". Verified
  (National Academies Press, executive summary).
- GMO dates: first GMO food on sale 1994 (FDA timeline); content now says GMO crops "spread widely on farms from the
  late 1990s" instead of "first sold in the late 1990s". Verified.
- IR8 1966; Borlaug Nobel Peace Prize 1970; "Green Revolution" named by William Gaud, 8 Mar 1968. Verified
  (secondary summaries citing Gaud's speech).
- Land Ordinance 1785: 6-mile townships, 36 sections of 640 acres, section 16 for schools. Verified (Knox College
  text of the ordinance summary). The notes no longer say "west of the Appalachians"; surveying began in Ohio.
- Black Sea Grain Initiative 22 July 2022 to 17 July 2023, UN and Türkiye. Verified (UN News, 17 July 2023).
- Horn of Africa five failed rainy seasons, 2020-2023. Verified (peer-reviewed study citing WMO 2022).
- Brazil the largest soybean exporter, China the largest importer. Verified (USDA FAS, Oilseeds: World Markets
  and Trade).
- Irish famine: about 1 million deaths, more than 1 million emigrants (Britannica gives up to 2 million). Verified.
- Kok-Aral dike finished 2005; North Aral recovering. Verified (World Bank and Wikipedia summaries; the World Bank
  results page now returns 404).
- Bananas shipped at about 13 to 14 °C. Verified (Global Cold Chain Alliance).
- Conservation Reserve Program from the Food Security Act of 23 Dec 1985 (USDA FSA); Everglades plan (CERP)
  authorized by WRDA 2000. Verified.
- Horses on the Plains in the 1600s and 1700s. Verified (NSF, 2023 study: horses in Plains cultures by the early
  1600s; spread hastened after the 1680 Pueblo Revolt).
- McCormick reaper 1831 (Virginia), Deere steel plow 1837, Tull seed drill about 1701. Verified (secondary history
  sources; standard dates).
- CED 5.3 hearths: "the Fertile Crescent and several other regions of the world, including the Indus River Valley,
  Southeast Asia, and Central America". Verified (CED wording as quoted by a course site; CED PDF not opened).

Fixed by the reviewer: Ethiopia's land certificates are use rights (the state owns land; it cannot be mortgaged),
so `women-in-agriculture` item 14 no longer keys "easier to get loans".

Still open:

- `frq-farm-trade-one` now pairs units 2 and 5 (migration push factor replaces comparative advantage, which was too
  close to the 2026 and 2025 set 2 released FRQs), so it unlocks after 5.9, not 7.6. The spec's FRQ plan may need
  the new title and units (lead).
- Map edits for review (from self-e): `irrigation` moved to agriculture-intro; `gmo` moved to green-revolution.
  Still open for the lead (the checker passes).

## unit-3-facts: Unit 3 dated facts and open points (reviewer u3, 2026-11-09)

From `docs/aphug-reviews/self-c.md`; checked by the Unit 3 reviewer (report: `docs/aphug-reviews/u3.md`).

Dated facts:

- Quebec 1995: No 50.58%, Yes 49.42%, turnout 93.52%, held 30 Oct 1995. Verified (Élections Québec results page).
- French radio quota: passed 1994, in force 1 Jan 1996, 40% French-language songs (quota now sits in the 1986 law
  as amended). Verified (Arcom song-quotas page; Christian Science Monitor, 3 Jan 1996).
- Māori Language Week since 1975, first kōhanga reo 1982, Māori Language Act in force 1 Aug 1987 (official language).
  Verified (NZHistory, Manatū Taonga). Māori Television launched 2004. Verified (Te Māngai Pāho timeline).
  "By the 1970s studies found few young Māori fluent" (the Benton survey) is still open: no source opened this pass.
- Saudi Arabia ended required sex-segregated restaurant entrances on 8 Dec 2019 (Ministry of Municipal and Rural
  Affairs; owners may keep them). Verified (Al Jazeera, 8 Dec 2019).
- Haiti 1987 constitution art. 5: Creole and French official. Verified (Constitute Project text).
- Canada multiculturalism policy 8 Oct 1971. Verified (Pier 21). TRC final report Dec 2015. Verified (Crown-Indigenous
  Relations). Residential schools "from the 1880s to 1996" is still open: standard dates, not re-read from a
  government page this pass.
- Sequoyah syllabary 1821, 86 symbols; Cherokee Phoenix 21 Feb 1828. Verified (Britannica, Cherokee language).
- First Walmart 2 July 1962, Rogers, Arkansas. Verified (Walmart corporate history).
- 550 Madison Avenue completed 1984, Johnson and Burgee, pink granite, "Chippendale" split pediment. Verified
  (Docomomo US).
- Owámniyomni = St. Anthony Falls (Dakota). Verified (MNHS Mill City Museum page; Open Rivers, 29 Oct 2024).
  Mill City Museum in the Washburn A Mill ruins, opened 2003; Washburn A closed 1965; Pillsbury A Mill closed 2003.
  Verified (Mill City Museum article; National Trust, Pillsbury A Mill); the notes now give these dates.
- Pilsen: museum founded 1982, opened 1987 as the Mexican Fine Arts Center Museum, renamed 2006. Verified (museum's
  history page); the notes and stimulus now say "then called".
- Denali / Mount McKinley: Interior order 3424 (14 Feb 2025) reinstates Mount McKinley; the park keeps the name
  Denali National Park and Preserve. Verified (DOI order PDF).
- Pew 2025 (2020 data): 28.8 / 25.6 / 24.2 / 14.9 / 4.1 / Jews about 0.2%; Muslims grew fastest. Verified (Pew).
- Ethnologue 29th edition is the 2026 edition. Verified (Our World in Data source note). The 7,170 count is from
  accuracy-risks.md; the Ethnologue page could not be opened this pass (still open, recheck).
- Hong Kong 1842-1997, Senegal 1960, Philippines 1898-1946, Brazil 1822, Swahili's name from Arabic "coasts",
  papermaking at Samarkand about 751 and Baghdad by about 800 (EBSCO research starter), Tok Pisin's plantation
  origin in the late 1800s and official status (Britannica), Boston's first Saint Patrick's Day 1737 and march 1841
  (Boston Irish). Verified except Hong Kong, Senegal, Philippines, Brazil and the Swahili etymology, which are
  standard textbook dates not re-read this pass (still open, low risk).

Open points from self-c.md:

1. Scale wording for province data: Unit 3 keys "local (subnational)"; author A's skills topic should use the same
   words. Still open (cross-unit consistency, not a fact).
2. Contested name: the 3.7 notes give Denali / Mount McKinley with users and date. Verified (see above).
3. Religion classification caveat (Hinduism and Judaism accept converts in some forms) in notes and glossary.
   Still open: a teacher should confirm the wording.
4. Bank-wide select-all items with one correct option (Unit 3 has 2 of 5). Still open for the lead (bank balance).

## unit-1-facts: Skills chapter and Unit 1 open points (reviewer u1, 2026-11-09, docs/aphug-reviews/u1.md)

1. World Bank FY27 classes on `views-of-the-world-s2` and `scales-of-analysis-s1`: verified from the World Bank
   blog (1 July 2026) and a matching August 2026 table; the World Bank's own classification page could not be
   opened from the review container. Confirm Sri Lanka (upper-middle, "narrowly crossed") on the World Bank page
   before launch. **Launch check, 2026-11-10**: several July 2026 reports of the FY27 release say Sri Lanka moved back
   to upper-middle income (Business Today, 4 July 2026; Daily FT; Newsfirst, 1 July 2026); the World Bank page itself
   was not opened. Low risk; closed unless a teacher finds otherwise.
2. UN WPP: the population.un.org site could not be opened; WPP 2024 figures were confirmed from a WPP 2024 table.
   Check for a newer revision before launch. **Launch check, 2026-11-10**: a web search finds no WPP revision after
   2024 on the UN site (WPP 2024 is still the latest); recheck at the yearly pass.
3. Scale words: provinces and states are keyed "local (subnational)", as the 2025 scoring accepted and as Unit 3
   keys them (self-c open point 1 is consistent now). A teacher may want to note that some textbooks call a state
   "regional". Still open (wording, not a fact).
4. Figure polish, not changed: the scale bar in `skills-scale-two-meanings` ("0 to 3 km" at 1:50,000) holds at one
   print size only; `data-in-decisions-flow` puts "A formula in US federal law" under "Who decides". Still open.

## unit-6-facts: Author F's four entries (reviewer u6, 2026-11-09, docs/aphug-reviews/u6.md)

1. `metacity-threshold`: verified. UN-Habitat's *State of the World's Cities 2006/7* (2006) calls conurbations of
   "more than 20 million people" metacities; the 2024 Set 1 Q3 scoring guideline accepts "over 20 million" for a
   metacity and gives no megacity figure. UN DESA's World Urbanization Prospects 2025 counts megacities at 10 million
   or more. The notes now name the UN-Habitat report.
2. `wup-2025-figures`: verified with one error fixed. UN DESA's December 2025 feature: 33 megacities in 2025, 8 in
   1975, 19 in Asia, 45% of 8.2 billion in cities (20% in 1950), Jakarta nearly 42 million, Tokyo 33 million, Cairo
   the only non-Asian city in the top ten, Addis Ababa and Dar es Salaam past 10 million by 2050. City values from
   WUP 2025 tables (as reproduced by Destatis and by the São Paulo city government's table of the 100 largest
   agglomerations): Jakarta 41.9, Tokyo 33.4, New Delhi 30.2, Shanghai 29.6, Manila 24.7, Sao Paulo 18.95,
   **Cairo 25.6, not 32.0** (fixed in `cities-worldwide-s1`, its item 2 explanation and `frq-world-cities-two`).
   Dhaka: the data tables give 36.6 million and DESA's feature says "almost 40 million"; still open, Dhaka stays
   off the maps. Check the WUP 2025 data files themselves before launch (population.un.org was not opened).
3. `flint-task-force`: verified. The Flint Water Advisory Task Force final report (21 March 2016), appointed by
   Gov. Rick Snyder, lists among its findings "The Flint water crisis is a clear case of environmental injustice"
   (quoted by Jenner & Block's report summary, 23 March 2016).
4. `released-overlap-world-cities`: resolved by rewriting. Compared with 2024 Set 1 Q3 (map of metacities and
   top-tier world cities plus a city table; part C compared metacity and world city): Source 1 no longer marks
   world cities, part D (world cities vs Jakarta) became a limitation of Source 1, part G (population vs world-city
   rank) became the degree to which a primate city helps a whole country. A second overlap was found and fixed:
   `frq-rail-boundary-one` parts D (fragmented governments and building a rail line) and E (transit reducing
   pollution) matched 2024 Set 2 Q2 G and E; they now ask about the central city's budget and land use near new
   stations. The stimulus type (a metro map with jurisdictions and a rail line) still resembles 2024 Set 2 Q2's;
   still open for the owner: keep (parts now differ) or swap the stimulus.

## unit-2-facts: Author B's open points (reviewer u2, 2026-11-09, docs/aphug-reviews/u2.md)

1. TFR map classes (`population-dynamics-s1`). Verified and fixed against World Bank WDI `SP.DYN.TFRT.IN`, 2023
   (API, last updated 2026-10-08; built on UN WPP 2024), cross-checked with the UN WPP 2024 values for 2024 listed on
   Wikipedia. Fixed: Yemen 2.1-3.9 to 4.0 or more (about 4.6); South Sudan 4.0 or more to 2.1-3.9 (about 3.9); Gambia
   unshaded (about 4.0, on the line). Shaded, far from a line: Kuwait, Georgia, Ecuador, Tunisia (under 2.1), Malawi
   (2.1-3.9). Every other class matches. Still open: the UN WPP site and data portal could not be read directly (the
   portal API now needs a key); confirm against WPP 2024 itself before launch.
2. Remittance chart (`migration-effects-s1`, notes, hook). The 2023 figures (120, 66, 50, 39, 27) were right
   (World Bank, Migration and Development Brief 40, June 2024, read). Updated to the latest brief: Migration and
   Development Brief 41 (December 2024), 2024 estimates: India 129, Mexico 68, China 48, Philippines 40, Pakistan 33
   billion US dollars. Verified (World Bank Blogs, "In 2024, remittance flows ... $685 billion"). Recheck for a newer
   brief at the yearly pass.
3. Bangladesh TFR 2.3 (BDHS 2022). Verified (BDHS 2022 Key Indicators Report, DHS Program PR148: "declined from 3.3
   to 2.3 over the last 22 years"). More than 6 in the early 1970s: standard, not re-read (low risk).
4. Egypt arable land about 3 percent (World Bank, 2021). Verified (WDI `AG.LND.ARBL.ZS`: 3.09 percent, 2021).
   Bangladesh more than 1,000 and Canada about 4 people per sq km (2022): verified (WDI `EN.POP.DNST`: 1,301 and 4.4).
5. Japan more than a quarter 65 and over (2023); natural decrease every year since the late 2000s. Standard
   (Statistics Bureau of Japan: 29.1 percent in 2023; deaths above births every year since 2007); not re-read this
   pass (low risk). Italy nearly a quarter 65 and over (Istat, 2024): standard (24.3 percent on 1 January 2024), not
   re-read (low risk).
6. Iran's 2021 law. Verified (Human Rights Watch, 10 Nov 2021: approved by the Guardian Council 1 Nov 2021; ends free
   contraceptives in the public health system, bans sterilization, adds paid maternity leave and other incentives).
7. China 2021 wording. Verified in part: the 2021 decision (dated 26 June, released 20 July 2021, gov.cn) allows
   three children with support measures, and fines for extra births ended in 2021 (wide press reports). Fixed: the
   hook said China "began paying families" in 2021; the national payment (3,600 yuan a year per child under 3) began in
   2025 (National Health Commission, Sept 2025). Hook, notes and the policy table now date each step.
8. Romania births nearly doubled in 1967. Verified at secondary level only (Wikipedia, "Decree 770", citing
   Lataianu 2002: births almost doubled, TFR about 1.9 to 3.7). Still open for a primary demographic source (low risk).
9. Ireland's population fell about a fifth, 1841-1851; more than a million left. Standard census figures (8.18 to
   6.55 million); not re-read this pass (low risk).
10. Great Migration about 6 million (1910-1970); Trans-Atlantic Slave Trade Database about 12.5 million embarked.
    Standard figures; not re-read this pass (low risk).
11. Sudan the largest displacement. Verified and redated: UNHCR Global Trends (released 12 June 2025, end-2024 data):
    14.3 million Sudanese refugees and IDPs, the world's largest displacement situation, ahead of Syria (13.5 million).
    Item 14 now cites that report; the hook's "millions within a year (UNHCR, 2024)" is consistent.
12. Malthus quotation with "[The food supply]" for "Subsistence". The 1798 wording is right. Still open: the owner may
    prefer the original word with a gloss. The order check no longer stands in the way: the bare word "subsistence"
    is not a term of `subsistence-agriculture` since the integration pass (2026-11-09).
13. Requests to the lead (flow maps as a map rendering; tap-to-enlarge figures at 360 px). Done in the integration
    pass (2026-11-09): `render: 'flow'` and Enlarge on every figure without hidden labels.
14. France pension law. Fixed: the 2023 law raised the minimum pension age from 62 to 64 in steps; the 2026 social
    security financing law (published 31 Dec 2025) suspended the rise (WTW summary, Jan 2026). Notes and item 12 of
    `aging-populations` now say so.
15. Released FRQs. Compared with 2023 to 2026 on apcentral; 2021 and 2022 are no longer posted there and were not
    compared (still open). Two parts were rewritten for closeness (see u2.md).

## phase3-exams: practice exam choices and facts to confirm (open, 2026-11-09, docs/aphug-reviews/phase3.md)

- `mcq-sets` stays open: the forms use sets of two or three only (four map, three or four data, one image, two or
  three text blocks a form, 23 of 60 questions with a stimulus). A teacher who knows the 2025 and 2026 forms
  should say whether real sets run longer.
- `hug-exam-1-01` keys "Local (subnational)" for a province map: it depends on `scale-words`. If a teacher wants
  "regional" accepted for parts of a country, rewrite the key and the "Regional" distractor together.
- The 104 fifth options (`fifth` maps in `forms.json`) were written in one pass by the Phase 3 builder and
  checked by code only (no repeats, no absolutes, position balance, length tell). They need the Phase 4 human
  read for a second defensible answer.
- Facts in the exam-only items to confirm: Tysons, Virginia, grew from a crossroads from the 1960s and has more
  jobs than residents; Singapore at about 1° N, 104° E; GMO crops first sold commercially in the 1990s.
- **Phase 4 review, 2026-11-09 (`docs/aphug-reviews/exams.md`)**: all 120 served MCQs, the 104 fifths and the 16
  exam-only items read; 5 fifths reworded (a Costa Rica and Canada "trade bloc" that their 2002 free trade
  agreement half supports, "Galactic city" for Los Angeles, "Expansion diffusion" for Sequoyah, two repeats) and
  the Singapore key corrected (it sits beside the Strait of Malacca, on the Singapore Strait). The three facts
  above are confirmed (Tysons: 26,374 residents in 2020, daytime population over 100,000). Still open for a
  teacher: `mcq-sets`, `scale-words`, and one human read of the fifth options as a set.

## phase3-facts: dated examples on the models page and in "Make it specific" (open, 2026-11-09)

Written from memory by the Phase 3 builder, each with its year; the Phase 4 accuracy pass should check every one
against a source and log it. Models page (`data/models.json`): Japan 2023 births about 727,000 and deaths about
1.58 million (MHLW, 2024); US leading causes of death in 1900 and 2022 (CDC); Ravenstein's 1881 census base;
Dublin to London among Europe's busiest international air routes in 2019; Christaller 1933 and southern
Germany's high-order centers; Hoyt's 1939 study of 142 cities; the Willis Tower finished in 1973; the 2020 census
populations of New York (8.8 million), Los Angeles (3.9 million) and Chicago (2.7 million); Paseo de la Reforma
laid out in the 1860s; Batavia founded 1619; Nairobi founded 1899; Copperbelt smelters from the 1930s; Rostow
1960; Wallerstein 1974; Flevoland drained in the 1950s and 1960s and a province in 1986; Belgium federal in 1993;
Zambia's kwacha in 2015; the UN Economic Commission for Latin America in the 1950s; Ricardo 1817. Prompts
(`data/justify/*.json`): McDowell County median household income under half the US median (2016-2020
estimates); INPE satellite tracking since the 1980s; Texas gaining two House seats after 2020; Hungary's income
tax exemption for mothers of four or more since 2020; Venezuela's emigration since about 2015 (UNHCR, 2024);
Welsh speakers 18% in Wales and 64% in Gwynedd (2021 census); San Francisco's Dragon Gate (1970); the Official
Languages Act (1969); Québec's 1995 referendum (No about 50.6%); Rucho v. Common Cause (2019); Côte d'Ivoire the
largest cocoa grower (FAOSTAT, 2022 data); Lima about 9.5 million and Arequipa about 1 million (INEI, 2017);
Curitiba's bus rapid transit (1974); Shenzhen special economic zone (1980); Grameen Bank (1983); the Aral Sea
irrigation from the 1960s; World Bank FY27 thresholds (from `accuracy-risks.md`). "Make it specific" prompts
on contested topics (gerrymandering, Québec, Kurds, microloans) were written to attribute and give both sides;
a teacher should read them for neutrality.
- **Phase 4 review, 2026-11-09 (`docs/aphug-reviews/exams.md`, sources table there)**: every fact above checked;
  all right. Fixed: the Ravenstein example's wording (papers of 1885 and 1889, from the 1881 census) and the
  Hungary prompt, which now says the exemption was widened to mothers of three in 2025 and younger mothers of two
  in 2026. Read but not refetched: the stable historical dates listed in the review. Still open: the teacher read
  of the contested-topic prompts for neutrality (found neutral and attributed in this review).

## generated-at-root: rebuild after the integrator's runtime changes (done 2026-11-10: rebuilt at launch)

The Phase 3 builder did not run the generator into the repo (the shared runtime was changing). After the
integrator lands, run `node scripts/build-aphug.mjs`: it adds `human-geography/models.html` and updates
`formula-sheet.html` (shorter title, a link to the models page) and `assets/justify.json` (the "legend" skill).
The forms, items and unit tests are served once their units are published.
