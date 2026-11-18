# Tools v2: NREMT Mnemonics (brief and build notes)

Status file for the v2 rebuild of `nremt/mnemonics.html` (free; the fourth most opened tool, rank 4 in
`docs/tools-v2-rollout.md`, group M, a "rebuild"). Standard: `docs/tools-v2-standard.md`; process:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-nremt-mnemonics`, built on `claude/tools-v2-all`. NOT
merged: an independent review comes first. Decisions made for the owner are also in `docs/tools-v2-owner-log.md`.
The first NREMT tool on the v2 kit (`assets/course/tool-kit2.js`), so it adds the NREMT adapter
(`NremtStudio.kit2` in `nremt/assets/nremt-studio.js`, the pattern of `ApBioTools.studioKit2`).

## The one main idea
**A mnemonic is the order of an assessment you actually do: each letter is one thing you look for, feel for or ask
the patient.** The old page was a reference card per mnemonic (read it, then type the words for each letter):
nothing to do with a patient, and the rollout's verdict was "a text card; nothing to change in the free view".
Owner decision (2026-11-18): tools that are mostly practice stay tools, but Explore must be real free play that
shows an idea, not a quiz. So Explore puts the letters on a drawn patient: tap a letter and the EMT does that
check on the patient, and the picture shows what that letter finds.

## Research (rule 10)
| Source | How it works | What we took |
|---|---|---|
| Brainscape and Varsity Tutors NREMT flashcards (search results, text only) | Letter on the front, words on the back | Nothing new: that is already Test yourself (Fill the letters). The gap: no patient, so the letters never become checks |
| Open Exam Prep, NREMT EMR "Level of consciousness and AVPU" (page seen as text) | Text, a comparison table, three multiple choice questions | AVPU as a ladder: voice first, then a painful stimulus (trapezius squeeze or sternal rub) only if voice gets nothing; any response (eyes, sound, movement) counts; the first stimulus that gets a response sets the letter. Our AVPU tab acts exactly that ladder out |
| Open Oregon EMS lab manual, "Trauma assessment (MARCH)" (page seen as text) | DCAP-BTLS named as a checklist per region (scalp, face, spine) | DCAP-BTLS is a look and feel check of every region; "?" says so, since Explore shows one finding per letter on one body |
| Virtual patient for history taking (Maicher et al., PMC7099396; search result only, not opened) | Students type questions to a virtual patient, who answers | The pattern for SAMPLE and OPQRST: the EMT asks, the patient answers in her own words, and the picture lights what the answer is about |
| The old LevlPrep page (origin/main, seen) | 19 cards, one at a time, a picker, Back and Next, "Fill the letters" self-check, a "Use it on a call" link | All of it is Test yourself, unchanged |

What ours does that none of them do: the student applies the letters to one drawn patient and each letter changes
the patient (an injury appears, the eyes open to a voice, pain spreads down an arm), so the mnemonic is seen as a
sequence of checks, not a word list.

## The design
- **Picture:** the course's own rendered body (`nremt/assets/body-figs/`, BodyParts3D, the figure the body map and
  the skill stations use) lying on its back, seen from above, on a drawn surface: a road for the trauma patient,
  a sidewalk for the unresponsive one, a store aisle with the patient on a stretcher for the chest pain patient. On
  a wide stage the patient lies across it (head left); on a phone the patient lies along it (head up), which keeps
  the body the largest thing at every width. A drawn face and hair, clothes clipped to the body outline, a gloved
  hand when the EMT touches the patient.
- **Four tabs, one patient story each** (the short curated set; each is a different assessment, so a tab each):
  1. **DCAP-BTLS**, a rider after a motorcycle crash: each letter draws its injury on the body (deformed forearm,
     chest contusion, road rash, a puncture, an exhaust pipe burn on the calf, tenderness under the gloved hand,
     a scalp laceration, a swollen ankle).
  2. **AVPU**, a man found on the sidewalk: each letter acts the ladder out on the face (A eyes open on their own;
     V eyes open when the EMT speaks; P nothing to the voice, a grimace to a trapezius squeeze; U nothing to
     either).
  3. **OPQRST**, a 58 year old woman with chest pain on the stretcher: each letter is the EMT's question, her
     answer, and what it is about lit on the picture (the cart for onset, the chest for quality, arrows down the
     left arm for radiation, a 0 to 10 scale for severity).
  4. **SAMPLE**, the same woman: her signs on her face, her pills, her coffee cup, the cart.
- **Main control, on the picture:** the letter keys along the bottom of the picture (a radio group; tap, or arrows,
  Home, End). Each letter: the check is drawn (grow, fade, the hand moves in), then its 1 to 3 word label, then
  the cause line's result. A letter already done keeps its mark on the patient with a small letter badge, so by
  the last letter the whole assessment is on the body.
- **Cause line** (`K.cause`) in the idea's colours: letter (course teal) → what it stands for → what it finds
  ("D → Deformity → forearm bent out of line"). The finding pill appears only once the picture shows it.
- **Buttons under the picture:** "Next letter" and "Start over" (clears the patient, same tab).
- **Takeaway** after every letter of a tab: one plain sentence (for AVPU: "The first thing that gets a response
  sets the letter: voice before pain.").
- **Cue:** "Tap a letter", once per device, above the first key. "Show me how" from the purpose line and "?".
- **"?":** what each tab shows and what it does not (one finding per letter; a real exam checks every region for
  all eight), the figure's credit, the course footer.

### Explore against Test yourself
- Explore: free play on the patient; nothing graded, nothing typed.
- Test yourself, "Fill the letters": the old screen, unchanged: all 19 cards (ids `m-...`), the picker, Back and
  Next, Fill the letters, Show the answers, the meter, "Use it on a call" links. A `#m-...` link of one of the four
  Explore mnemonics opens Explore on that tab; any other `#m-...` link opens Test yourself on that card. `#test`
  opens Test yourself.

### What moved (nothing dropped silently)
- Reading a card (the old free view) is now the first thing Test yourself shows for each card (the card text is
  shown until Fill the letters hides it), as before.
- The 15 mnemonics outside the curated four (Cincinnati, rule of nines adult and pediatric, scene size up, FAST,
  BE-FAST, AEIOU-TIPS, CUPS, APGAR, pediatric assessment triangle, SLUDGEM, RPM, GCS, rule of palm, PERRL) are in
  Test yourself only. Candidates for later drawn tabs: BE-FAST and APGAR (they need a face up close and a newborn).

## Decisions made for the owner (also in the owner log)
(filled in as the build goes)

## Build notes
(filled in as the build goes)
