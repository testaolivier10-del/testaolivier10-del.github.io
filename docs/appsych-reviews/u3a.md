# Unit 3 review, part A (topics 3.1-3.6, two FRQs)

Branch `claude/appsych`, 2026-10-27. Independent accuracy check from the reviewer's own knowledge,
`docs/appsych-ced-map.json`, framework.md section 3, the original papers named below and the author's self-report
(`docs/appsych-reviews/self-d.md`). Scope: `development-methods`, `physical-development`, `gender-orientation`,
`cognitive-development`, `language-development`, `social-emotional-development` (lesson, notes, questions,
glossary, figure entries; 114 items, 15 stimuli), the six SVG figures from `scripts/appsych-figures/author-d.mjs`,
`frq-development-methods-aaq` and `frq-social-emotional-development-ebq`.

**CED.** The CED PDF returned only binary data through WebFetch, so nothing was read from it directly. The
third-party copy (Lumisource) gives 3.3's learning objective as "Describe how sex and gender influence socialization
and other aspects of development" (3.3.A) but no essential knowledge or exclusions; Fiveable's 3.3 summary covers
sex vs gender, gender identity (including nonbinary), gender roles, gender socialization and sexual orientation as
distinct from identity. Our 3.3 matches that scope; the extra pieces (Hyde 2005, the genetics of orientation, the
fraternal birth-order effect) are taught as context, and only Hyde's conclusion is tested (item 14). Exclusions
checked: no prenatal stage names taught (only "fetal" inside the disorder name "fetal alcohol spectrum
disorders"), no pragmatics, no psychosexual stages, no Kohlberg.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| 3.6 FRQ | `frq-social-emotional-development-ebq` Source 3 | 64% overall, 78% and 44% by group cannot all come from 60 people (no split gives those three rounded values) | 65% (39 of 60) overall; 78% (28 of 36) with no major events; 46% (11 of 24) with events. Results text, plot values and label, B(i) and C(i) accepts, both samples updated |
| 3.6 FRQ | same, Sources 2 and 3 | Labeled invented but reused real published details: Source 2's newspaper survey of 620 adults with three self-descriptions and mean relationships of 10, 6 and 5 years is Hazan & Shaver (1987); Source 3 (60 middle-class Californians, infancy to about 20, stability with change after negative life events) closely mirrors Waters et al. (2000) (from memory, not rechecked against the paper). That is real data presented as invented | Source 2: 480 adults from a social media survey (61% women), 9 years, trust 5.8 / 4.4 / 4.1 (table, results, accepts). Source 3: "one Northeastern US city" plus the new numbers above. The conclusions are unchanged |
| 3.6 FRQ | `frq-development-methods-aaq` F | The study reports significance only for authoritative vs permissive GPA, so a reasonable "partly supports" answer had no accepted wording | Added an accept line for "partly supports" |
| 3.1 | stimulus `development-methods-s2`, items 7 and 8 | $r = -.35$ was called "moderate", but the course rule (`stats-correlation`) puts 0.1-0.4 as weak | $r = -.45$ in the stimulus and items 7 and 8 (key unchanged) |
| 3.3 | `psy-gender-orientation-1` stem | "born with a male body" did not match the notes and glossary, which use "assigned male at birth" | "assigned male at birth" |
| 3.3 | `psy-gender-orientation-4` option 2 | "A man attracted to women who works as a nurse" also breaks the "expected" set, so it could be argued as showing independence. That gave the item two defensible answers | Now "works as a builder", with an explanation that every answer is the expected one |
| 3.3 | notes, orientation section | Ganna et al. (2019) studied same-sex sexual *behavior* in about 477,000 people; the notes implied orientation in general | Says "nearly half a million people ... which looked at same-sex sexual behavior" |
| 3.2 | `psy-physical-development-4` option 0 why | Said "older babies avoided the drop more", but the finding compared babies of the same age | Explanation now says it is about crawling experience at the same age |
| 3.5 | stimulus `language-development-s2` | Listed English-speaking adults as tested in a sample about infants. Adults were tested in Werker's earlier work, not in this infant study as summarized | Removed; the sample now lists only infants learning Hindi or Nthlakampx |
| 3.6 | items 23, 24, 25 | Keys used "vs." while the distractors spelled out "versus", a length and form cue | "versus" |

Keys changed: none (one option replaced in `psy-gender-orientation-4`, same key). No items removed, no ids
changed. The 23 scope items and 0 scope FRQs used in `psychology/data/exams/forms.json` keep their keys.

## Checked and fine

- **Numeric recheck.** A scratch script with values typed from the stems gave all 12 numeric keys, and they
  match the `from` recipes: 13, 51, 12, 11, 250 g, 12, 14, 12, 30, 10, 15, 60%. Each was graded right through
  `ApPsychGrade.numeric` loaded in a vm, and all 24 authored mistakes were graded wrong with their own feedback.
  The EBQ and AAQ figures were also recomputed: GPA 3.3/3.0/2.8; 462/540 = 86% retained, 78 left; Source 1 7.2 vs
  5.4; the new Source 3 counts. Every number can be worked by hand.
- **Real studies.** These match the papers: Gibson & Walk (1960): 36 infants aged 6-14 months; 27 moved off the board; 3 crept to the deep
  side; experience-dependent wariness came from later work (Campos and colleagues). Werker & Tees (1984): Hindi and
  Nthlakampx contrasts, the 6-8 / 8-10 / 10-12 month decline, a head-turn procedure, some infants followed across
  ages. Harlow (1958): cloth vs wire, feeding conditions, frightened infants ran to cloth; the ethics and the
  species generalization limit are stated. Felitti et al. (1998): the first report from the ACE Study (more than
  17,000 adults over time), a dose-response pattern framed as population risk. Hyde (2005). All invented stimuli
  are labeled and plausible, and none is attributed to a real researcher.
- **Methods.** Every design is named exactly: longitudinal correlational (shyness, AAQ); cross-sectional
  (conservation, adult intelligence); an experiment with random assignment and a blind coder (toy labels);
  correlational (smoking). Each set says correlation is not causation and names a third variable (family, income
  and diet). Ethics are taken from each summary (assent, IRB, code numbers). Generalization rests on participant
  characteristics. The smoking item notes that animal experiments support causation.
- **Science.** Teratogens, the rooting reflex, critical vs sensitive periods (imprinting, cataract, accent),
  primary vs secondary sex characteristics, menarche at about 12 and spermarche at about 13-14, adolescent
  prefrontal maturation ("early to mid 20s", worded cautiously), aging and menopause. Piaget's stages and ages
  are given as typical, with the violation-of-expectation caveat. Theory of mind (false belief at 4-5),
  Vygotsky's ZPD and scaffolding, crystallized vs fluid, dementia as disease. Phoneme, morpheme, semantics,
  syntax, generativity, the speech milestones, overgeneralization. Bronfenbrenner's systems (the exosystem
  example and the chronosystem are right). Ainsworth's four patterns classified by the reunion, with secure about
  60-65% in US samples. Baumrind's three styles, with the correlation and culture caveats. Erikson's eight
  stages, Marcia's statuses, the imaginary audience and personal fable, emerging adulthood, the social clock and
  possible selves.
- **3.3 tone.** Respectful and current: "assigned male at birth", transgender and nonbinary identities as normal
  variation (the APA position), orientation not chosen and not caused by parenting, change efforts ineffective and
  harmful, the myth stated only inside a correction box. No self-diagnosis prompts. The 3.6 help line is set
  (`help: true`) for the ACEs content.
- **Item quality.** Apply/analyze is 94-100% per topic. The key is the longest option in 6-39% of single items
  (3.6 is highest at 39%, under the 40% cap). Key positions are balanced. Stimulus sets have 3-5 items. There is
  one defensible key per item after the gender-orientation-4 fix. Each distractor's explanation names its
  concept.
- **FRQs.** The AAQ has 7 points in parts A-F (1/1/1/1/1/2), with ethics taken from the summary and a sample
  per part. The EBQ has 7 points in parts A, B(i), B(ii), C(i), C(ii). C(i) uses a different source (3 vs 1),
  C(ii) uses a different concept (stability and change vs trust versus mistrust), and the restricted terms are
  never used as concepts.
- **Figures.** All six were rendered to PNG with Playwright and inspected. Text is legible with no overlaps,
  the content is correct, and each alt text matches its figure. Plot specs were checked against the numbers
  stated in each stem. No figure needed a change.
- **Checks.** `check-appsych-content --topic` reports 0 bank or FRQ failures for all six topics. Its exam
  failures under `--topic` come only from loading one topic; the full run has 807 items and 0 failing.
  `check-appsych-map` reports that nothing is used before it is taught.

## Open (for a person)

- **3.3 scope (`ced-text`, `sensitive-scope`).** The 3.3 essential knowledge is still unread. A teacher with the
  CED should confirm that intersex traits, transgender and nonbinary identities, the genetics of orientation and
  the fraternal birth-order effect are in scope or fine as context, and approve the tone.
- **The AAQ is filed under 3.1 but needs 3.6's parenting styles.** Its `topics` lists both. The FRQ page should
  not show it before 3.6 is published (self-report point).
- **Hyde (2005)** reviewed 46 meta-analyses. The text says "hundreds of studies", which is true but loose. Leave
  it or reword.
