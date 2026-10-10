# U-NREMT-body notes

## Sound trainer (`nremt/sound-trainer.html`, `assets/sound-stage.js`, `assets/sound-bank.js`)

- **Job:** hear each sound where it is listened for, and see when in the beat or the breath it falls.
- **Changed:** a front/back chest with 14 auscultation sites opens the page. Explore: pick a finding, tap a site,
  hear it there (louder or fainter by site), see a live strip (heart: the real envelope of the generated sound with
  S1/S2/A2/P2/S3/S4/murmur marked from the same timing table the synth uses, with a playhead; lungs: a schematic
  breath with the phase shaded). Compare side by side. Quiz modes: Name it (the old quiz, unchanged, now with a
  strip in its feedback), Where to listen (tap the site; 9 questions), Timing (tap the strip where the extra sound
  falls; 5 sounds, keyboard arrows + Enter). Misses go to `NremtToolResults` (ids `where-<q>`, `timing-<q>`, links
  `?mode=where&q=` / `?mode=timing&q=`). Mute button + volume slider (remembered in `nremt_sound_volume`). Sound only
  plays after a tap. `#snd-<id>` from Review still lands on the card and preselects that finding.
- **Why 2D, not the 3D body viewer:** auscultation sites are surface landmarks (intercostal spaces, sternal border,
  midclavicular line). The 3D model is bones/organs, 4 MB, lazy and rotatable; on a 390 px phone the five heart
  sites sit within about 2 cm and move with rotation. A flat front/back chest with ribs, sternum and MCL drawn is
  exact, instant and tappable.
- **Figure (visual polish, 2026-10):** the chest is the same BodyParts3D model rendered flat by
  `scripts/build-body-figures.mjs` (ribs, cartilages, sternum, clavicles, heart under the skin; back: scapulae and
  spine), and every site is placed from landmarks measured on the skeleton (rib ends -> ICS, clavicle midpoints ->
  MCL, 7th rib lateral point -> midaxillary line, scapulae -> posterior sites). Data: `assets/body-figs/chest.js`.
- **Owner check:** sound-by-site is a teaching approximation (relative loudness, not measured); the lung strip is
  a static typical breath with no playhead (see Simplify pass 2026-10-10 for what each clip measured).
- Tests: `scripts/test/nremt-sound-stage.test.mjs`.

## Body map: Burns / Rule of Nines (`nremt/body-map.html`, `assets/burns.js`)

- **Job:** estimate how much of the body is burned, fast, by the Rule of Nines, and know each region's share.
- **Changed:** a mode switch above the model ("3D anatomy" / "Burns: Rule of Nines"; `?mode=burns`). Front and back
  outlines side by side, 15 regions, each showing its %. Tap or drag to paint; brush Full / Half / Erase; Adult /
  Child toggle; running TBSA; each tap explains that region's share (and how the child chart differs); list of
  marked regions; over 10% shows the burn-center and no-wet-dressing teaching point; palm rule note. Quiz: 11
  "estimate the TBSA" scenarios (answer choices include the other-age chart and half/double traps, explained) and 5
  "paint an X% burn" targets (total hidden until Check; the miss explains the gap in nines). Misses go to
  `NremtToolResults` (`burns-<id>`, link `body-map.html?mode=burns&q=<id>`). The reference card's "Pediatric
  proportions differ" now states them and links into the mode. The 3D anatomy mode is unchanged.
- **Why 2D:** the Rule of Nines is a map of surface regions; the 3D model's skin layer has no region boundaries, so
  painting "back of the left leg" on it would be guesswork; two flat figures show front and back at once.
- **Child chart source:** the course's own study notes (ch. 30 Burns: "head and neck 18% rather than 9%, each leg
  13.5% rather than 18%; everything else as in an adult") and bank question 533 (infant head about 18%). This is
  the infant version of the modified rule taught at EMT level; some texts give an intermediate child (head 12%,
  leg 16.5%) or use the Lund-Browder chart. Owner: confirm this single "child" chart is what you want shown.
- Tests: `scripts/test/nremt-burns.test.mjs` (totals 100%, adult and child values, every quiz answer, every paint
  target reachable).

## Simplify pass (2026-10-10): sound trainer accuracy

### Sites: where each lung sound is played and what the page says elsewhere
- Each finding now opens at its classic best site instead of at no site: stridor at the trachea; wheeze at the right
  lung apex (heard over every lung field); crackles at the right posterior base (front/back view switches to it).
  Heart findings open at their BEST site (mitral, or pulmonic for split S2, aortic for the systolic murmur, Erb for
  the diastolic murmur).
- `ASSESSED` lists where each lung finding is actually listened for (stridor: trachea only; wheeze and crackles:
  the 8 lung-field sites; heart findings: the 5 heart sites). Tapping anywhere else says so plainly, e.g. "Stridor
  is heard best over the trachea; here it is faint and transmitted." The strip no longer says "Stridor here"; it
  says "usually breathing in".
- Transmitted loudness lowered so it reads as transmitted (LUNG_GAIN): stridor heart sites .55 -> .4, upper fields
  .6/.5 -> .4, lower .3 -> .2; wheeze heart sites .8 -> .6, trachea .6 -> .5; crackles heart sites .45 -> .3,
  trachea .2 -> .15. Best sites unchanged (all still 1).
- "Where to listen" keys checked against this: stridor = trachea; S1 = mitral, tricuspid; S2 = aortic, pulmonic;
  S3, S4 = mitral; split = pulmonic; AS = aortic; edema = 4 bases; apices = 4 apex sites. All are sites where the
  sound is assessed (new test). No key changed.

### Lung recordings: what was measured, per clip
Decoded with the Web Audio API in a browser (the container cannot reach Wikimedia), from
`Special:FilePath/<file>`; envelope = RMS of the 150-1500 Hz band in 50 ms and 100 ms frames, plus per-frame
spectral peak and flatness (tonal = flatness < 0.05). Listening check by the numbers: burst = tonal or loud run,
gap = > 15 dB down.
- **Stridor_NP_OGG_2.ogg** (15.37 s, 44.1 kHz mono): 0.0-0.55 s silent lead-in; tonal bursts (peak 300-520 Hz)
  at 0.60-1.80, 2.45-3.85, 4.35-5.60, 5.90-6.50, 6.70-8.55, 8.90-10.15, 10.75-11.90, 12.15-13.35, 13.65-14.95 s;
  gaps of 0.2-0.6 s (e.g. 1.80-2.40, 3.85-4.35). Envelope autocorrelation peak at 1.80 s, so about 33
  breaths/min (a child's rate). Several bursts have a short dip mid-burst (1.20, 5.65, 12.45 s), which may be the
  in/out turn, but it is not consistent and nothing in the audio says which side is inspiration.
- **Wheeze2O.ogg** (8.46 s): tonal bursts (peak 345-410 Hz) at 0.10-0.80, 2.85-3.75, 5.15-6.20, 7.55-8.35 s,
  between them quieter non-tonal breath noise; autocorrelation peak 2.5-2.6 s (about 24/min). Burst length about
  0.7-1.0 s of a 2.5 s cycle.
- **Crackles_pneumoniaO.ogg** (13.95 s): no clean silent gaps; louder crackle clusters at about 1.25-2.05,
  3.40-4.15, 5.85-6.80, 8.70-9.50, 10.85-11.60, 13.30-13.85 s. The clip is a loop: the 100 ms envelope repeats
  with a 7.5 s period (mean difference 2.8 dB, far below its 16 dB range), so it holds about 3 distinct cycles.
- **Decision:** the cycles are measurable, but none of the clips has an airflow or phase marker, so mapping a burst
  to inspiration or expiration would be a guess (the textbook rule would assign it, which is circular). So no clip
  gets a synced playhead or a measured curve. The strip is a static typical breath, labelled "A typical breath,
  not traced from this recording", with no moving line, and "Why?" states what was measured in that clip
  (`timingNote` in `sound-trainer.html`). The old line sweeping a 4 s schematic breath over a clip with a 1.8 s or
  2.5 s cycle is gone.

### Heart sounds
- Re-checked: `heartEvents()` is still the single timing table; `renderHeartData()` schedules from it and the strip
  draws and labels from it (S1, S2 or A2/P2, S3, S4, murmur spans). New test: at every heart site's mix, every
  event above 0.2 relative loudness has its peak right after its scheduled time in the audio buffer.
- Fixed a mismatch: with no site chosen, Play used the mitral mix while the strip was drawn unmixed. Now both use
  the same mix (a site's, or none). The name-it feedback strip is now drawn unmixed, as that quiz plays it (was
  drawn at the mitral mix). Labels unchanged and correct (A2 before P2; S3 after S2; S4 before S1).

### Layout
- Landing: one sentence, then Explore | Test yourself, then the chest with "Tap a glowing spot to listen there";
  each finding is preselected at its best site with Play next to it. Test yourself shows Name the sound / Where to
  listen / When in the beat. Volume, Compare and credits are under More options; site notes, phase text and
  measurements under "Why?". "Every sound, described" (12 cards and the recordings note) is one disclosure, opened
  automatically by `#snd-<id>`. All modes, deep links (`?mode=`, `&q=`, `#snd-`) and records unchanged.

### Other NREMT tools (simplify pass 2026-10-10)
What a new student sees first, per tool; nothing removed, every deep link kept.
- **Body map (3D):** "Tap any part of the model. Drag to turn it." + Quiz me, then the model. Reset view, skin,
  systems, gesture help and the not-to-scale note under More options; Browse by name and the two reference cards
  (Rule of Nines in words, directional terms) are disclosures. Side panel no longer sticky. `?focus=`, `?hunt=` kept.
- **Body map (Burns):** Adult | Child, Quiz me, "Tap a region to mark it burned, or drag across several." Brush
  (Full/Half/Erase) and the palm rule under More options; Clear shows once something is marked. `?mode=burns&q=` kept.
- **Scenario sim:** "Pick a call to start." above the cards; the call scrolls 24 px clear of the translucent header;
  patient panel sticky only on windows 880 px tall or more (it is about 730 px). Budget 52 -> 53 KB (it sat 0.1 KB
  under; the cue and the rule tipped it).
- **Flowcharts:** Read | Build it | Drill me, then "Pick a sequence to read it." with one chip per diagram; Read
  shows one diagram (Show all shows every one; print shows all). `#flow-<slug>`, `#build-<slug>` and the drill's
  "See the whole diagram" open the right one.
- **Skill sheets:** the timed run (pick a station) first; the reading guide, the official-sheet table and the 10
  station cards are three disclosures; the run's text points to the table by name.
- **Formulary:** compact header "EMT Drug Formulary", the give-or-withhold card first; the seven full drug cards and
  the scope note in one disclosure, opened by "See the whole card".
- **Reference cards:** compact header, a jump row (vitals, GCS, APGAR, triangle); each card's teaching notes behind
  "N notes worth knowing". The vitals checker is the first thing on the page.
- **Mnemonics:** compact header and "Read a card, then press Fill the letters to test yourself on it."
- **Review, From the tools:** the newest three misses, the rest behind "Show N more"; one-line explanation.
- Checks: check-site OK; check-weight OK (one budget raised, above); node --test 686 pass; axe (wcag2a/aa) no
  serious or critical on all nine pages, light and dark, with every disclosure open; no horizontal scroll or
  control under 40 px at 390/768/1280/1440/1680; no sticky element over content at 1440/1626/1680 (probe verified
  with a planted sticky box); no page errors.

## For accuracy review

Simplify pass (2026-10-10), sound trainer:
- Default sites: stridor trachea, wheeze right apex, crackles right posterior base.
- Sites where each lung sound is "assessed" (stridor: trachea only; wheeze, crackles: all lung fields) and the
  sentence shown elsewhere ("Stridor is heard best over the trachea; here it is faint and transmitted").
- Transmitted-loudness values lowered (listed above); best sites unchanged.
- Per-clip measured breath rates (stridor about 33/min, wheeze about 24/min, crackles bursts every 2-2.8 s, clip
  loops at 7.5 s) shown in Why?; no phase is claimed for any clip.


Burns (all in `nremt/assets/burns.js`):
- Adult: head and neck 9 (front 4.5, back 4.5); each arm 9 (4.5 front, 4.5 back); anterior trunk 18 (chest 9,
  abdomen 9); posterior trunk 18 (upper back 9, lower back and buttocks 9); each leg 18 (9 front, 9 back);
  genitals 1. Sum 100.
- Child: head and neck 18 (9 front, 9 back); each leg 13.5 (6.75 front, 6.75 back); all else as adult. Sum 100.
- Half mark = half the region's %. Palm (fingers included) about 1% TBSA.
- Over 10% (partial thickness) meets burn center criteria; cool wet dressings over more than 10% risk hypothermia
  (both from the course's study notes, ch. 30).
- Quiz answers: arm + anterior trunk 27; both arms 18; left leg + back 36; head + left arm 18; front of both legs 18;
  genitals + front of both legs 19; lower back + back of both legs 27; child head 18; child head + both legs 45;
  child right arm + anterior trunk 27; child right leg 13.5.

Sound trainer (all in `nremt/assets/sound-stage.js` unless noted):
- Sites: aortic = 2nd ICS right sternal border; pulmonic = 2nd ICS left sternal border; Erb's point = 3rd ICS left
  sternal border; tricuspid = 4th-5th ICS lower left sternal border; mitral/apex = 5th ICS left midclavicular line;
  trachea = anterior neck above the sternal notch; lung apices below the clavicles at the MCL; lateral bases at the
  midaxillary line, lower ribs; back: upper fields between scapula and spine, bases below the scapular tips.
- S1 loudest at apex/lower left sternal border; S2 loudest at the base (aortic, pulmonic). Mix multipliers:
  S1 mitral 1, tricuspid 1, Erb .75, aortic .45, pulmonic .45; S2 aortic 1, pulmonic 1, Erb .8, tricuspid .55,
  mitral .5; P2 pulmonic 1, Erb .6, tricuspid .3, aortic .25, mitral .15 (P2 heard mainly at the pulmonic area).
  Away from the heart: whole sound x .25 upper front lung, .12 lower, .15 trachea, .08 back.
- S3 and S4 best at the apex with the bell, patient left lateral; extra-sound multipliers mitral 1, tricuspid .5,
  Erb .35, base .2.
- Systolic murmur shaped as aortic stenosis (crescendo-decrescendo), loudest at the aortic area, radiates to the
  neck (aortic 1, Erb .7, pulmonic .6, mitral .55, tricuspid .45); mitral regurgitation would be loudest at the apex.
- Diastolic murmur: aortic regurgitation loudest at the left sternal border/Erb's point; mitral stenosis at the apex
  (Erb 1, aortic .75, tricuspid .7, mitral .7, pulmonic .6).
- Lung: wheeze heard over all lung fields, mostly on expiration (gain lung 1, heart sites .8, trachea .6);
  crackles mostly on inspiration, fluid at the bases first (lower lung 1, upper .45, heart sites .45, trachea .2);
  stridor mostly on inspiration, loudest over the neck (trachea 1, heart sites .55, upper front .6, upper back .5,
  lower .3). Schematic breath: inspiration one third, expiration two thirds (I:E 1:2), 4 s breath.
- Timing (unchanged synth, `sound-bank.js`, now one table `heartEvents`): systole 0.32 s; split S2 A2-P2 45 ms;
  S3 150 ms after S2; S4 130 ms before the next S1; systolic murmur 0.06 to 0.31 s; diastolic murmur S2+0.05 s to
  0.04 s before S1; 72 bpm. Timing quiz answer zones: S3 = S2+0.05 to S2+0.30 s; S4 = up to 0.25 s before S1
  (to 0.04 s before); split = S2 -0.04 to +0.09 s; systolic = S1+0.03 to S2-0.01 s; diastolic = after S2+0.03 s or
  before S1-0.02 s.
- Feedback copy: "S3 is blood rushing into a stretched ventricle as filling begins"; "S4 is the atrium squeezing
  against a stiff ventricle at the very end of filling"; "the aortic valve closes a moment before the pulmonic".

## Checks (2026-10-09)

- check-site OK; check-weight OK (no budget changed; the two pages and new assets are within existing budgets);
  node --test: all pass after fixing `scripts/test/anp-tool-kit.test.mjs`, which still read the Browse-by-name labels
  from body-map.html although Phase 1 moved them into `assets/body-viewer.js` (failed on the base commit too).
- check-a11y --check: no serious/critical violations. check-console: the full 1201-page run crashed its browser on
  this shared machine (unrelated to these pages); a targeted run of both pages, every mode and deep link, and
  review.html had no console errors.
- New runtime files `nremt/assets/sound-stage.js` and `nremt/assets/burns.js` are in sw.js precache next to
  `sound-bank.js` / `body-viewer.js`. CACHE not bumped.

## Accuracy review

Independent review, 2026-10-09. Checked against the National EMS Education Standards (EMT), standard EMT texts,
ABA burn referral criteria and standard auscultation references. Burns model run in node: both charts total 100;
every one of the 11 estimate answers and its 4 choices hand-checked.

| Item | Verdict | Source |
|---|---|---|
| Adult Rule of Nines regions and splits (head 9, arm 9, front/back trunk 18, leg 18, genitals 1; sums 100) | correct | standard EMT texts; course notes ch. 30 |
| Child chart (head 18, leg 13.5, rest adult) | correct as the infant chart, matches notes ch. 30 and bank Q533; **logged**: the tool now says these are infant/small-child figures and that many protocols use Lund-Browder (docs/TRACKER.md) | Brady/AAOS EMT texts; Lund & Browder |
| Palm rule (palm with fingers about 1%) | correct | ABA |
| Over 10% partial thickness meets burn-center criteria; wet dressings over >10% risk hypothermia | correct | ABA referral criteria; course notes ch. 30 |
| 11 estimate keys (27, 18, 36, 18, 18, 19, 27, 18, 45, 27, 13.5) and distractors; 5 paint targets | correct | hand calculation |
| Auscultation sites (aortic 2nd ICS RSB, pulmonic 2nd ICS LSB, Erb 3rd ICS LSB, tricuspid 4th-5th ICS LLSB, mitral 5th ICS MCL) | correct | Bates' Guide to Physical Examination |
| S1 loudest at apex/LLSB, S2 at base; P2 mainly pulmonic; S3/S4 apex, bell, left lateral | correct | Bates' |
| AS loudest aortic, radiates to neck; AR loudest left sternal border/Erb; MR/MS at apex | correct | Bates' |
| Timing: systole 0.32 s at 72 bpm; split 45 ms; S3 150 ms after S2; S4 130 ms before S1 | correct (S3 typically 120-180 ms; physiologic split 30-60 ms) | Bates'; standard physiology |
| Wheeze mainly expiratory, crackles and stridor mainly inspiratory; I:E 1:2 | correct | Bates'; EMT texts |
| S3/S4/split feedback sentences | correct | standard physiology |
| "Where to listen: apices" explanation said the back apex is "between the shoulder blades and the spine" | **fixed**: now "high on the back, between the top of the shoulder blade and the spine" (the posterior apex is above the scapular spine) | Bates' |
| Site loudness multipliers | correct as a labelled teaching approximation (the page says relative, not measured) | judgement |
