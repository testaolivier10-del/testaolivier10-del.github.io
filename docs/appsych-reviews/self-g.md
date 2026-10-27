# Self-review: author G (Unit 5, topics 5.3-5.5)

Date: 2026-10-27. Topics: `explaining-disorders` (5.3), `disorders` (5.4), `treatment` (5.5).

## What was written

| Topic | Items | Apply/analyze | In sets | Sets (kinds) | Notes words | Glossary |
|---|---|---|---|---|---|---|
| explaining-disorders | 24 | 95% | 45% | 3 (visual, data, study) | 1,178 | 6 of 6 concepts |
| disorders | 42 | 97% | 40% | 4 (visual, data, study, data) | 1,258 | 30 of 30 |
| treatment | 37 | 94% | 40% | 3 (study, data, visual) | 1,208 | 30 of 30 |

103 items in total (single, multi, numeric, specific, order). The brief's required sets are in `treatment`: `treatment-s1`
(study: CBT vs SSRI vs waitlist, randomized, blind interviewer, consent, right to withdraw, IRB) and `treatment-s2`
(data: anxiety scores before and after for three groups, a grouped bar plot spec).

FRQs (both `ebq`, 7 points, parts A:1 B(i):1 B(ii):2 C(i):1 C(ii):2, three invented sources each with a plot or table,
`claimTopic`, `restricted`, `write` hints, full-credit samples using evidence, then concept, then link, and a different
source and concept in C):
- `frq-treatment-depression-ebq`: exercise vs stretching (RCT), exercise vs CBT vs SSRI (no significant difference), and
  activity and symptoms in teens (correlational, stated as such).
- `frq-treatment-anxiety-ebq`: CBT vs waitlist for social anxiety, CBT vs SSRI vs placebo for panic (with relapse
  follow-up), and one-session exposure for children's dog phobia.

Figures (LevlPrep original SVGs, generator `scripts/appsych-figures/author-g.mjs`, rendered to PNG and checked):
`explaining-disorders-diathesis`, `disorders-categories`, `treatment-approaches`. Data figures are plot specs in the
question files and FRQs (twin concordance bar, 12-week mood line, before and after bars).

The help line (`<p class="psy-help">`, the guide's wording) is on all three notes pages and at the end of each lesson
summary. All studies and data are `invented: true`; no real study is attributed. No em dashes.

## Checks

- `node scripts/check-appsych-content.mjs --topic <id>`: clean for all three; full run: FRQ 0 failing.
- `node scripts/check-appsych-map.mjs`: nothing in my files is used before it is taught. The full run currently fails on
  `gender-orientation.json` (another author's file: "pretend play", "parenting style").
- `node scripts/build-appsych.mjs --check`: clean. `APPSYCH_PUBLISHED=unit-5` build to scratch: 5 topics, 46 files.
- Numeric recheck: all 6 numeric keys recomputed by hand from the stems match ApPsychStats, every key is graded correct
  and every authored mistake is graded wrong (vm load of `psy-stats.js` and `psy-grade.js`). Every plot's values match the
  numbers in its label and stems.

## Map edits

None.

## Open points for needs-author

1. **Dissociative identity disorder causes.** Taught as debated (the trauma model vs the sociocognitive model). The owner
   should confirm this framing.
2. **Category placement vs the CED.** The CED (third-party copy) lists OCD and hoarding, and the culture-bound examples,
   next to the anxiety disorders. The figure and notes follow the DSM-5-TR: OCD and hoarding have their own category, and
   PTSD is trauma- and stressor-related. Ataque de nervios and taijin kyofusho are described as "cultural concepts of
   distress (often called culture-bound syndromes)". Confirm against the CED text (needs-author `ced-text`).
3. **Time rules stated as fact:** MDD at least 2 weeks; PDD at least 2 years in adults (1 year in youth); mania at least 1
   week, hypomania at least 4 days; GAD at least 6 months; PTSD more than 1 month; schizophrenia signs at least 6 months.
   These are DSM-5-TR criteria in our own words. A reviewer should check them against the manual.
4. **Treatment evidence claims:** exercise works about as well as CBT and medication for mild to moderate depression
   (recent meta-analyses support this, but effects vary and blinding is hard); CBT gains last longer than medication after
   treatment stops for anxiety and depression; DBT was developed for self-harm and borderline personality disorder;
   lithium needs blood tests and lowers suicide risk (stated in one item's explanation); hypnosis
   helps pain and anxiety but not memory recovery. These are mainstream, but the Phase 4 review should confirm the wording.
5. **Help line placement.** It appears on notes pages and inside lesson summaries (there is no lesson field for it). The
   owner may prefer a template slot (needs-author `mental-health-line`).
