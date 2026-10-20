# Unit 8 (8.12-8.15) and Unit 9 review

Independent accuracy review, 2026-10-20, branch `claude/apenv`, of author G's work: `lethal-dose-50`,
`dose-response-curve`, `pollution-human-health`, `pathogens`, `ozone-depletion`, `reducing-ozone-depletion`,
`greenhouse-effect`, `greenhouse-gas-increases`, `climate-change`, `ocean-warming`, `ocean-acidification`,
`invasive-species`, `endangered-species`, `human-impacts-biodiversity` (lesson, notes, questions, glossary, figure
entries; 221 items, 28 stimuli), the 14 figures in `environmental-science/figures/`, and `frq-lethal-dose-50-calc`,
`frq-ocean-acidification-data`.

CED: WebFetch returned the CED PDF only up to Topic 2.7, so the learning objectives and exclusion statements for
8.12-9.10 were **not** read (needs-author `ced-text` stays open). Content was checked against the official topic
titles and the sources below.

## Sources checked

| Claim | Source | Result |
|---|---|---|
| 100-year GWPs and lifetimes (CH4 28, 12.4 yr; N2O 265, 121 yr; HFC-134a 1,300, 13.4 yr; CFC-12 10,200, 100 yr) | IPCC AR5 WG1 Table 8.A.1 (copy hosted by Maine DEP) | exact match |
| GWP by report (CH4 25 / 28 / 27.0 non-fossil, 29.8 fossil; N2O 298 / 265 / 273) | GHG Protocol, "Global Warming Potential Values" (August 2024), from AR4, AR5, AR6 | used for the new "roughly 25 to 30" wording |
| Bald eagle: 417 nesting pairs (1963), 9,789 pairs (2007), lower 48 | USFWS, "Bald Eagle Numbers Soaring" (2007) | numbers match; USFWS says **breeding** pairs for 2007 (fixed) |
| Oral LD50 categories: I up to and including 50; II >50 thru 500; III >500 thru 5,000; IV >5,000 mg/kg | 40 CFR 156.62 | match |
| Signal words: DANGER (plus POISON, skull and crossbones for oral, dermal, inhalation category I), WARNING, CAUTION, category IV none required (CAUTION if used) | 40 CFR 156.64(a) | match; item 7 stem had "50 to 500" and "above 500" without the 5,000 bound (fixed) |
| Ozone back to 1980 values: about 2066 Antarctic, 2045 Arctic, 2040 rest of the world | WMO release of the 2022 Scientific Assessment of Ozone Depletion (Jan 2023) | match |
| HCFC phase-out: developed 2020 (0.5% servicing to 2030), developing 2030 (2.5% average to 2040) | 2007 Montreal Protocol adjustment (MOP-19 summary) | match |
| NOAA Mauna Loa annual means | author fetched NOAA file | not refetched; values internally consistent with the figure |
| NASA ozone hole areas | ozonewatch.gsfc.nasa.gov | fetch blocked; set stays labeled invented |

## Methane decision (lead)

Prose now says methane traps roughly 25 to 30 times as much heat as CO2 over 100 years and N2O roughly 265 to 300
times, the value depending on the IPCC report (notes, lesson key idea, glossary). The AR5 table stays as the stimulus
for `greenhouse-effect-s2`. Every item that computes a CO2 equivalent states the GWP in its stem
(`env-greenhouse-effect-9`: "Use the global warming potential of methane in the table, 28"; `-10`: N2O, 265). No other
item, FRQ, tool or figure in the course computes a CO2 equivalent from a GWP (searched all `environmental-science/data`).
The worked example in the notes now says "Using a GWP of 28 for methane".

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| greenhouse-effect | `env-greenhouse-effect-9`, `-10` stems | GWP only in the table; a student who learned 25 or 30 could differ | Stem states 28 (CH4) and 265 (N2O); keys unchanged |
| greenhouse-effect | notes GWP section, worked example; lesson `ideas[2]`; glossary `nitrous-oxide` | Fixed "about 28" / "about 265" as if the only values | "Roughly 25 to 30" / "265 to 300", depends on the report; a question gives the GWP |
| ocean-warming | `env-ocean-warming-15` (unit changed) | Answer unit `°C` for a rate "in °C per decade": the correct answer "0.15 °C per decade" was graded wrong on unit, and a bare "0.15 °C" passed | Unit `°C/decade`, accepts "°C per decade"; mistake why says "per year" |
| lethal-dose-50 | `env-lethal-dose-50-7` stem and one why | Boundaries "50 to 500" (50 belongs to DANGER) and CAUTION "above 500" with no upper bound | "above 50 to 500 ... above 500 to 5,000 ... above 5,000, no signal word required" (40 CFR) |
| lethal-dose-50 | notes | CFR basis and category IV rule not stated | Cites 40 CFR 156.62 and 156.64; category IV needs no signal word, CAUTION if used |
| endangered-species | `endangered-species-s2` passage and source; `env-endangered-species-8` stem; notes | 2007 count called "nesting pairs"; USFWS reports 9,789 breeding pairs; source unnamed | "breeding pairs"; source names the USFWS 2007 release; stems say "eagle pairs" |
| greenhouse-effect | `env-greenhouse-effect-14` (key changed) | Select-all with two keys | One key: Methane; option "Carbon dioxide" replaced by "Nitrogen gas (N₂)" with its why |
| human-impacts-biodiversity | `env-human-impacts-biodiversity-11` (key changed) | Select-all with two keys | One key: cod overfishing; "poaching rhinos" replaced by beetles killing pines in warmer winters (climate change, the C) |
| pollution-human-health | `env-pollution-human-health-15` (key changed) | Select-all with two keys | One key: the farmworker; "child drinks low lead for years" replaced by a one-time chlorine spill (acute) |

Changed keys: `env-greenhouse-effect-14` [0,1] → [1]; `env-human-impacts-biodiversity-11` [0,1] → [0];
`env-pollution-human-health-15` [0,1] → [0]; `env-ocean-warming-15` unit `°C` → `°C/decade` (value 0.15 unchanged).
Bank: select-all items with one correct option 13 → 16 of 52 (31%, rule 20%); this unit 3 of 13. All three
converted items stay "Select all that apply", so a student still judges every option.

## Numeric recheck

A scratch script (`recheck.mjs` in my scratch folder) holds my own value for every key, worked from the stem and
stimulus, not the recipe, and grades it through `env-questions.js` (with `env-expr`, `env-calc`, `env-grade` in the
test harness's vm): 39 item keys and 4 FRQ checks, **43 of 43 graded right** after the fix (before it, 42: the
per-decade unit). Every authored value mistake and setup mistake is graded wrong. Examples: LD50 from the solvent
curve 400 mg/kg; ED50 10, LD50 60, ratio 6; synergism 40 / 18 = 2.22; ozone hole (24.8 − 12) / 12 × 100 = 106.7%;
Mauna Loa 30.70%, 2.225 ppm/yr, 50.4%; pH factor 10^0.057 = 1.140; DO −17.8%; mussels 1,420 × 3,000 = 4,260,000;
eagle 2,247%; cranes 7.2; FRQ LD50 17.5 mg/kg, 7 mg, 25 kg, 16.9%. Unit spellings checked: "92 yr/years", "1.5 mm
per year", "56 tonnes", "40 grams" accepted. Two minor gaps, not changed: "56 t" is not read as metric tons, and
"40000 mg" is not accepted where the stem asks for grams (the stem says grams, so this is fair).

## Checked and fine

- Science in all 14 notes pages, lessons, glossaries, 162 single items, 13 select-all, 14 specific, both FRQs:
  ozone depletion and the greenhouse effect never mixed (separate tables, CFCs as the only overlap); sea ice vs land
  ice; thermal expansion credited to heat, not CO2; carbonate chemistry; Anopheles as vector, Plasmodium as pathogen;
  drug resistance as natural selection; invasive "trait" vs "no predators" trap; HIPPCO; ESA vs CITES.
- Every plotted stimulus matches its numbers (curve, line, bar specs); all 14 figures rendered in headless Chromium
  and inspected: no overlaps or cut-off labels; figure text matches the notes (2066, 1987, 1996, 2010, 2016; 90% of
  heat to the ocean; pH 8.2 / 8.1 / 7.8).
- Specific items and FRQ samples score: directional hypothesis, measured variable, complete chains, solutions that
  say how they work, a policy that is a law. FRQs are 10 points with one rubric line per point.
- Checks: `check-apenv-content --topic` clean for all 14 topics; `check-apenv-map --check` "Nothing is used before
  it is taught"; `node --test scripts/test/apenv-questions.test.mjs scripts/test/apenv-map.test.mjs` 30/30.
- No em dashes in any file in scope.

## Open (left for a person)

- `ced-text`: Units 8.12-9.10 objectives unread, including whether 9.3 expects named GWP values (now moot for
  items, which state the GWP) and whether 9.6 expects the thermohaline circulation (taught; two items).
- NASA ozone hole areas: still unverified (fetch blocked), so `ozone-depletion-s1` stays invented.
- Ocean station data (`ocean-acidification-s1`, FRQ) remain invented, shaped like HOT/BATS; a NOAA-cited table could
  replace them.
- The shared grader does not read "t" as metric tons; a runtime builder may want to add it to `normUnit`.
