# Author D self-report: Unit 3, topics 3.1-3.6 (2026-10-27)

## Done

| Topic | Items | Apply/analyze | In sets | Sets (kind) | Numeric | Figure |
|---|---|---|---|---|---|---|
| 3.1 `development-methods` | 17 | 94% | 59% | data (cross-sectional vs longitudinal, brief), study (shyness 2 to 15) | 2 | `development-methods-designs` |
| 3.2 `physical-development` | 19 | 95% | 63% | study (Gibson & Walk 1960, cited), data (walking ages), study (smoking and birth weight, with bar plot) | 3 | `physical-development-lifespan` |
| 3.3 `gender-orientation` | 17 | 94% | 65% | visual (four dimensions), study (toy-label experiment, bar plot), data | 2 | `gender-orientation-dimensions` |
| 3.4 `cognitive-development` | 17 | 100% | 65% | study (conservation at 4, 6, 8, brief; bar plot), visual (conservation and stages), data (crystallized vs fluid line plot) | 2 | `cognitive-development-conservation` |
| 3.5 `language-development` | 15 | 100% | 67% | visual (milestones), study (Werker & Tees 1984, cited), data | 2 | `language-development-milestones` |
| 3.6 `social-emotional-development` | 29 | 100% | 41% | study (Harlow 1958, cited), data (strange situation bar plot), visual (ecological systems) | 1 | `social-emotional-development-ecological` |

114 items in all (99 single, 12 numeric, 2 specific, 1 order). Lessons, notes (500+ words, worked example on each),
glossary for every mapped concept (77). FRQs: `frq-development-methods-aaq` (longitudinal correlational study of
parenting style at 13 and GPA and self-reliance at 17; ethics: IRB, parental consent, student assent, right to
withdraw, confidentiality) and `frq-social-emotional-development-ebq` (three invented sources: infant attachment and
peer skill at 10, adult self-described styles and relationships, stability of attachment 1 to 19). Figures: six
SVG diagrams from `scripts/appsych-figures/author-d.mjs`, each rendered to PNG and inspected; data figures are plot
specs. 3.6 notes carry the help line (ACEs).

## Checks

`check-appsych-content.mjs --topic <id>` clean for all six; full run 0 failing; `check-appsych-map.mjs --check`
clean; `APPSYCH_PUBLISHED=unit-3 build-appsych.mjs --out <scratch>` builds, and the built lessons and notes scan clean.
Numeric recheck: all 12 keys recomputed by hand from the stems and graded through ApPsychGrade in a vm; every key
graded right and every authored mistake caught with its own feedback (one duplicate slip found and replaced).

## Map edits

None.

## Open points (for needs-author)

- **3.3 CED text** (`ced-text`): no essential knowledge was readable. Written to the title and mainstream science:
  sex vs gender, gender identity (incl. transgender and nonbinary, as normal variation per APA), gender roles and
  gender typing (social, cognitive-schema and prenatal-hormone influences), Hyde (2005) gender similarities, and
  sexual orientation (twin data, Ganna et al. 2019, fraternal birth-order effect; no parenting cause; change efforts
  ineffective and harmful). A teacher should confirm scope; the topic touches sensitive ground and should get the
  accuracy reviewer's attention for tone too.
- **Harlow (1958)**: taught with its ethics stated plainly (lasting harm; not approvable today) and the
  monkey-to-human generalization limit.
- **Piaget's ages**: taught as typical, with the sequence holding up better than the ages (violation-of-expectation
  findings named in notes). Erikson presented as a framework, not a tested timetable.
- **Attachment stability and prediction**: framed as moderate (the EBQ's Source 3 models change after stressful
  events); ACEs framed as population risk, not individual destiny. Felitti et al. (1998) wording: first report from a
  study that eventually surveyed 17,000+ adults.
- **AAQ ordering**: `frq-development-methods-aaq` is filed under 3.1 but uses parenting-style terms taught in 3.6; its
  `topics` lists both. If the FRQ page is shown with 3.1 before 3.6 is published, it should wait for 3.6.
- Brain maturation "into the early to mid 20s" is the common textbook line; the exact end point is debated.
