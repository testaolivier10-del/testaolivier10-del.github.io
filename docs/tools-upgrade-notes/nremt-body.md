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

## For accuracy review

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
