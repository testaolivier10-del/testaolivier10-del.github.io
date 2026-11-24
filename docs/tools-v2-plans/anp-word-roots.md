# Plan: A&P, Word roots (tools v2)

## Tool and page
- Page `anatomy-physiology/tools/word-roots.html` (from `data/pages.json`). Script
  `anatomy-physiology/assets/tools/word-roots.js` (524 lines, 32 KB); data `data/tools/word-roots.json` (700 parts:
  prefixes, roots, suffixes with meaning and origin; 957 terms, each with segments, literal and real meaning, topic).
  Uses the shared glossary. Spec section 8.7.
- **Free.** Rollout row 71, group M (sorters and matchers), size rework (the free mode is a multiple choice quiz).
  Unchanged on `claude/tools-v2-all`.

## The one idea
A medical word is built from parts, and each part changes what the word means. Two tabs:
1. **Suffix**: the same organ root, a different ending, a different thing happening to it.
2. **Prefix**: the same root, a prefix that says too much, too little, too fast or too slow.

## Research
- [Wisc Online, building medical terms for the digestive system](https://www.wistechopen.org/wisc-online-learning-object/building-medical-terms-for-the-digestive-system):
  parts dropped onto a word with the organ shown. Take: the body part is the anchor of the word.
- [Medical Terminology Web (HKU)](https://medterms.hku.hk) and the
  [ecampusontario workbook, identifying word parts](https://ecampusontario.pressbooks.pub/medicalterminology2studentworkbook/chapter/identifying-word-parts-in-medical-terms/):
  split, define each part, suffix first. Take: the reading order the course teaches, kept in Test yourself.
- Duolingo (group M row): tap to place a tile, instant result on the tile. Seen as text only; the builder opens them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Decode: a term split into parts, meaning of each part (suffix first), then the whole; records `word-roots:<term>:decode` | Test yourself part "Decode" unchanged |
| Build: a meaning given, place part cards (tap or Enter, tap to take back); records `word-roots:<term>:build` | Test yourself part "Build" unchanged |
| Part bank: every part offered so far with origin and examples | "?" (searchable, forgiving find) |
| Topic filter ("up to topic", ordering rule), prefs `anp_wordroots_prefs_v1` (mode, upto) | Test yourself, unchanged; Explore offers only terms at or before the topic the student set, or all if none |
| Next term order (never tried, then missed) and session score | Test yourself only |
| Glossary link after an answer | Test yourself and the Explore takeaway (after the word is built, never before) |

## Design
- **Suffix tab picture:** one organ drawn large and real (stomach, liver, kidney, skin, joint, lung), in a body
  outline that shows where it is. Suffix tiles sit on a tray under it; tapping one snaps it onto the word strip on
  the picture ("gastr + itis") and the organ shows the meaning: inflamed (red, swollen, heat), enlarged (grows),
  removed (lifted out by forceps onto a tray, the space left drawn as a real cavity), cut into (an incision
  opens), looked into (a scope with its light), painful (pain marks). Main control: the suffix tile; quiet: tap a
  different organ on the outline.
- **Prefix tab picture:** a patient with the matching instrument drawn: heart on a monitor (brady, tachy + cardia),
  chest rising (brady, tachy, hyper, hypo + pnea or ventilation), thermometer (hyper, hypo + thermia), glucose meter
  (hyper, hypo + glycemia), BP cuff (hyper, hypo + tension). Main control: a prefix knob from "too little" through
  "normal" to "too much" on the instrument; the picture and the word change together.
- **Only real words:** a tile shows only where the combination is a term in the bank (gastritis, gastralgia,
  hepatitis, hepatomegaly, nephrectomy, nephrotomy, dermatitis, arthroscopy, pneumonectomy, osteoma were found;
  cardiomegaly and arthritis are not in the bank). The builder either adds missing common terms to the bank with
  a topic tag and an accuracy check, or offers fewer tiles; never a made up word.
- **Cause line:** "gastr = stomach, itis = inflammation → gastritis: an inflamed stomach".
- **Outside the picture:** two tabs, purpose line, cause line. About 20 words.

## Science to verify
- Each part's meaning and origin language used in Explore (gastr, hepat, nephr, derm, arthr, pneumon, oste;
  itis, megaly, ectomy, otomy, oscopy, algia, oma; brady, tachy, hyper, hypo): a medical terminology text (the
  open [Medical Terminology, ecampusontario](https://ecampusontario.pressbooks.pub/medicalterminology/front-matter/introduction/)),
  Dorland's; OpenStax A&P 2e 1.1 for the body terms.
- "pneumon" means lung (not air: pneum); "-ectomy" is removal of all or part; "-oma" is a tumour, not always cancer.
- Every term's real meaning, which can differ from its literal one (the bank keeps both): show the real one.
- Any added term goes through `docs/anp-needs-author.md` and the ordering build check (topic must exist).

## Reuse
- `AnpToolKit.kit2` with `"kit2": true`; Test yourself parts in the studio's quiz mode.
- `word-roots.js` bank loading, `itemId` records, the topic filter and glossary lookups, unchanged.
- Organ drawings from A&P lab practical figures where they suit, or the body figures; `K.spots` for the organ
  outline taps, `K.tap` for tiles, `K.drag` for the prefix knob.

## Risks reviewers will likely block on
- Organs drawn as icons, or "removed" drawn as a dashed ghost outline (lessons list).
- The word strip text under 11 px or breaking inside a part at 360 px.
- The picture changing before the tile lands (rule 14), or a tile for a word not in the bank.
- Too many tiles: at most six per organ, the rest only in Test yourself.
- Gore: inflamed and removed must stay clinical, not graphic.
