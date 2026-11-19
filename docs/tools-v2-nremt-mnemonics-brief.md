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

### What is on screen in Explore (counted, opening, 1440 and 390)
4 tabs; 1 purpose line (9 to 10 words) and "Show me how"; 1 picture (the patient on the ground or stretcher, the
largest thing at every width, sweep checked) with 1 small patient chip ("Rider after a motorcycle crash") and the
letter keys on it (8, 4, 6 or 6); 1 cause line (2 pills at the opening, 3 after a letter); 2 buttons ("Next letter",
"Start over"). After a letter: 1 label of 1 to 3 words with a leader, a small letter badge on each earlier finding,
and on AVPU, OPQRST and SAMPLE two speech bubbles (the EMT's question or action, the patient's answer). The cue on
the first visit only. No side panel, no text block.

## Decisions made for the owner (also in the owner log)
1. Explore is a drawn patient, four tabs (DCAP-BTLS, AVPU, OPQRST, SAMPLE); the other 15 are Test yourself only.
2. Reading a card moved to Test yourself (each card shows until Fill the letters, as before).
3. Deep links: `#m-...` of the four opens Explore on that tab; others open Test yourself; Test yourself writes
   `#test-m-...`; `#test` opens Test yourself.
4. Made up patients; the chest pain answers match scenario s2.
5. OPQRST severity drawn on a 0 to 10 scale (the card says 1 to 10; logged in `docs/nremt-needs-author.md`).
6. The "Read a card, then press Fill the letters" line is not shown in the v2 frame (the side panel says it).
7. Keys 38 to 44 px wide on a 360 px phone so eight letters stay one row (46 px tall).
8. The NREMT adapter is its own small file, `nremt/assets/nremt-kit2.js` (`NremtStudio.kit2`), loaded only by v2
   pages, so `nremt-studio.js` and every other NREMT page are byte for byte unchanged.
9. On AVPU the trapezius squeeze is said in the EMT's bubble (italic, "Squeezes the trapezius muscle (a painful
   stimulus)") rather than as a label by the hand: a label there collided with the speech on phones.
10. OPQRST P (worse with walking), SAMPLE A and SAMPLE P draw nothing on the patient: they are the question and the
    answer only (nothing honest to draw).

## Build notes
- `nremt/assets/mnemonics.js` and `.css`: the four patients (`TABS`), the scene (ground, stretcher, clothes clipped to
  the body outline, face states, findings per letter, the gloved hand, the cart, purse and 0 to 10 scale), the
  letter keys, labels with a placer that keeps them off speech, badges and the patient chip, the cause line, Next
  letter, Start over, "?", the cue and "Show me how". Figures from `LevlBodyFigs` (`body` for the men, `case` for the
  woman, both fetched only when shown).
- `nremt/assets/nremt-kit2.js`: the adapter (Explore stage, "?", Test yourself parts with their own stage and dock,
  deep link start, onShow).
- `nremt/mnemonics.html`: loads the kit, the adapter, `body-figures.js` and the tool; its script keeps the card
  screen (picker, Back, Next, `mnemonic-check.js`) as Test yourself. Cards, ids, `data-scenario` links and the HTML
  that `build-nremt-flashcards.mjs` and the tutor read are unchanged. `?studio=0` still shows all 19 cards.
- `scripts/tools-v2/nremt-mnemonics-sweep.mjs`: the kept sweep (one process per width).
- A one file preview needs the body figures inlined by hand (the shared `tool-preview.mjs` does not follow
  `LevlBodyFigs.load`); the preview in outputs was patched that way, the script was not changed.

## Checks run (2026-11-18)
`node --test scripts/test/nremt-*.test.mjs` (71 pass), `build-nremt-flashcards.mjs --check` (19 mnemonic cards, up
to date), `check-site` (OK), `check-weight --check` (nremt shell 28.6 of 28.8 KB; the one budget over is the same
on the base branch), a local copy of `check-tool-use.mjs` listing this page (reports frame v2: open, touch, mode,
use; nothing under automation). Playwright at 390 (real touch taps), 768 and 1440, light and dark: 113 passed, 0
failed (opening counts and cue, letters, keyboard arrows, Home, End, Next letter on a phone brings the picture into
view, Start over, AVPU and OPQRST runs with mid frames, Test yourself: Fill the letters on SAMPLE with five right and
one wrong answer reads 5 / 6, Explore kept after Test yourself, seven deep links, `?studio=0` 19 cards, "?" credit,
no console errors).
Sweep (`node scripts/tools-v2/nremt-mnemonics-sweep.mjs`): every tab's opening, every letter, the takeaway and Start over, at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, light and dark, plus the first visit with the cue; frame by frame at 390 and 1440 (8101 frames, 1846 mid change: no result word before the picture shows it, no flash on a first frame); reduced motion. **9690 passed, 0 failed.**
Preview: `/mnt/user-data/outputs/nremt-mnemonics-v2/index.html`; shots (`sweep-*`, `v-*`, mid change frames
`v-*-mid-*`, `v-avpu-P-voice-*`, `v-avpu-P-squeeze-*`) in `/mnt/user-data/outputs/nremt-mnemonics-v2/shots/`.

## Not done, and what I am not happy with
- No independent medical review yet (the points are in `docs/nremt-needs-author.md`); no real phone, no screen
  reader pass, no real students.
- The drawn face on the rendered mannequin is simple; at 360 px the eyes are small, so AVPU leans on its labels.
- At 360 px the eight DCAP-BTLS keys are under 44 px wide (about 39).
- On a phone the AVPU result label sits under the speech bubbles with a long leader to the face.
- The figure is the same mannequin body for both men (only clothes and hair differ).
- Only Chromium.
