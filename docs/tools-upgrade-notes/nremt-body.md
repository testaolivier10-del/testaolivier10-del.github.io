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
- **Owner check:** sound-by-site is a teaching approximation (relative loudness, not measured); the lung strip is
  schematic because the Wikimedia clips carry no inspiration/expiration markers (the page says so).
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

## For accuracy review

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

Sound trainer:

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
