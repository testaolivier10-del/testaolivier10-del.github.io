# Tools v2: NREMT Sound trainer (brief and build notes)

Status file for the v2 rebuild of `nremt/sound-trainer.html` (free; rank 15 in `docs/tools-v2-rollout.md`, group S,
"sound and recognition"). Standard: `docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch
`claude/tools-v2-nremt-sound-trainer`, built on `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also in `docs/tools-v2-owner-log.md`; open medical points in
`docs/nremt-needs-author.md` ("Sound trainer, tools v2 Explore"). The second NREMT tool on the v2 kit; it uses the
NREMT adapter (`nremt/assets/nremt-kit2.js`) as it is (no adapter change was needed).

## The one main idea
**Each lung and heart sound is loudest in one place on the chest, and it sounds the way it does because of what is
happening inside.** The old Explore had the chest and its spots, but Play, the sound chips, the strip and the
explanation sat in a side panel away from the chest (rollout: "Play sits in the side panel, away from the chest").
Now the student puts a stethoscope on a drawn patient, hears the sound at that spot at the loudness it has there,
sees what makes it in a lens beside the chest, sees the sound drawn as it plays, and flips between normal and
abnormal at the same spot.

## Research (rule 10)
| Source | Seen how | How it works | What we took |
|---|---|---|---|
| Easy Auscultation, "Wheeze" lesson page (`easyauscultation.com/heart-lung-sounds-details/29/wheeze`) | Page fetched as text (the player itself is not in the text) | A position image (where to listen and the patient's position), the recording, a slowed copy, a phonocardiogram image per clip, then description ("continuous with a musical quality", "more pronounced on expiration", "caused by narrowing of the airways") | The trio on one screen: where on the chest, the sound, its waveform; and the cause in one line. Ours draws the waveform from the sound itself as it plays, not a still picture |
| Easy Auscultation, heart and lung sounds reference guide | Page fetched as text | An index filtered by site (aortic, pulmonic, Erb's point, tricuspid, mitral, lungs); paired healthy and abnormal entries | Site first (the spots on the chest), and normal beside abnormal (our switch under the lens) |
| 3M Littmann Learning and Littmann University apps | Only as text (app store and 3M education pages; no app could be run here) | A sound library to switch between quickly, play again at will, test yourself at any time | Switching sounds in one tap at the same spot; replay at will; testing kept separate (Test yourself) |
| The old LevlPrep page (origin/claude/tools-v2-all, seen) | Opened and read in full | Chest with tappable spots (front and back), sound chips, Play and a phonocardiogram strip in the side panel, compare two sounds, "Why?", volume; tests: Name the sound, Where to listen, When in the beat | The sites, loudness by site, timing table and every question, unchanged; the strip idea moved onto the picture |

What ours does that none of them do: the stethoscope is dragged onto a drawn chest, the loudness follows the spot
(the glow on each spot shows where the sound is loudest before you listen), and a lens draws the cause moving in time
with the sound (valves closing on S1 and S2, an atrium squeezing into a stiff ventricle on S4, air sacs popping open
for crackles).

Science checked against the course notes (airway management: stridor, snoring, gurgling, wheezing; primary
assessment; principles of assessment: "wheezes indicate narrowing of the airways"; cardiac emergencies: crackles in
pulmonary edema) and the existing accuracy notes of this tool (`docs/tools-upgrade-notes/nremt-body.md`). Open points
are in `docs/nremt-needs-author.md`.

## The design
- **Picture** (`nremt/assets/sound-explore.js`, `.css`): a clinic wall with a curtain, the course's rendered chest
  (BodyParts3D, `body-figs/chest-front.webp` and `-back.webp`, ribs, sternum and heart under the skin) with R and L
  marks, the listening spots measured from the skeleton (the same landmarks as Test yourself), a stethoscope chest piece
  with its tubing, a round lens joined to the chest piece by a thin leader, a dark monitor strip with Play. On a wide
  stage the chest takes the left 55 % and the lens and strip stand to its right; on a phone the chest is on top and the
  lens and strip share the band below it. The chest is the largest thing at every width (sweep checked).
- **Two tabs, one listening task each:** Lung sounds (wheeze, crackles, stridor: real recordings; spots: trachea,
  both apices, both bases, and on the back four more) and Heart sounds (S3, S4, split S2, systolic murmur, diastolic
  murmur: generated, marked "Generated, not recorded. Beyond the EMT exam"; the five heart spots).
- **Main control, on the picture:** the stethoscope. Drag it onto a spot (let go within reach of one and it lands
  there) or tap a spot (it slides there). Landing plays the sound at that spot, at the loudness the spot has
  (`SoundStage.pure.heartMix` and `LUNG_GAIN`, the old tool's tables). A tap on the chest piece or Play plays or
  stops; arrow keys move it spot to spot (Home, End). Secondary, on the picture: the sound keys along the top, Front and
  Back (lungs only), and the Normal / abnormal switch under the lens.
- **Each spot's glow** is as big and strong as the chosen sound is loud there, so where it is loudest shows before
  you listen; it changes with the key and with Normal.
- **The lens** draws what makes the sound, moving with it: a bronchiole squeezed narrow with air racing through and
  sound waves at the narrowing (wheeze; with a live level, the waves follow the clip's loudness); air sacs, some with
  fluid, snapping open (crackles); a swollen larynx narrowing the trachea (stridor); the heart cut open from the front,
  its valves closing on the same clock as the sound (S1 the mitral and tricuspid, S2 the aortic and pulmonic, split S2
  the aortic first), the ventricles squeezing in systole, the atria at the end of diastole, a stretched left ventricle
  (S3), a thick stiff one (S4), a jet through a narrow aortic valve (systolic murmur), a leak back through it in
  diastole (diastolic murmur). Its name sits above it (1 to 3 words): "Narrowed airway", "Stiff ventricle".
- **Normal / abnormal** at the same spot: the switch swaps sound, lens and strip. Heart normal is the generated
  S1 S2. Lung normal has no free recording, so it draws the open airway (or dry air sacs, or an open larynx) and plays
  nothing, and says so.
- **The strip** draws the sound as it plays. Heart: the loudness envelope of the very samples being played (at that
  spot's mix), swept once a beat by a playhead like a monitor, S1 and S2 (and the extra sound) named as the trace
  reaches them, systole shaded. Lungs: the clip's own loudness, live, scrolling, when the browser can measure it
  (`sound-bank.js` `analyse`, CORS on the clip's direct address); otherwise a typical breath named "Typical breath" with
  the part of the breath the sound lives in shaded. Lung normal: the typical breath with "in" and "out".
- **Cause line** (`K.cause`), one colour per idea everywhere: where (course teal: the spot's label), the sound (blue:
  the keys, the trace), its cause (warm red: the lens's name). "Right base → Crackles, loudest here → fluid filled
  air sacs pop open". The sound's pill waits for the trace (or the sound) to start; the cause waits for the lens to
  move. Off the chest: "Off the chest → nothing heard". When the sound ends, the takeaway replaces it (one sentence).
- **Cue:** "Drag the stethoscope onto the chest" (phone: "Drag the stethoscope", below it), once per device.
  "Show me how" (three steps: the stethoscope, the keys, the switch) beside the purpose line and in "?".
- **"?":** what you are looking at, where to listen (every site with its intercostal space), where the clips come
  from and that heart sounds are generated and beyond the exam, loudness is a teaching approximation, what is not in
  Explore; the volume; every sound's card (including snoring, gurgling and diminished, which have no clip); credits.
- **Audio rules:** audio starts only from the student's own action (a drop, a tap, a key, Play); never on load,
  never on a new Test yourself round. It stops, with every frame loop and timer, when Explore hides (Test yourself),
  when "?" opens, and when the page is hidden; coming back shows the finished trace and cause line, nothing running.
  Reduced motion: the stethoscope cross fades to its spot, the whole trace is drawn at once, the lens is still.

### Explore against Test yourself
- Explore: free play; nothing graded.
- Test yourself (one dropdown on the stage, "What to practice"): **Name the sound** (the old quiz: 10 rounds,
  Everything or Heart only, misses come back more often, the answer's strip, the misses to hear again), **Where to
  listen** (tap the spot on the chest; front and back), **When in the beat** (tap the strip where the extra sound
  falls). Each is the old screen, moved in through `NremtStudio.kit2`, not copied. Record ids unchanged: the sound's id
  (Name it), `where-<id>`, `timing-<id>`; Review's links unchanged (`?mode=where&q=...`, `?mode=timing&q=...`,
  `#snd-<id>`).
- Deep links: `?mode=name|where|timing` (with `&q=`) opens that part; `?mode=explore` and no link open Explore; `#test`
  opens Test yourself; `#snd-<id>` opens Explore on that sound with the stethoscope on its best spot, nothing playing
  (a sound with no clip opens "?" on its card); `?studio=0` keeps the old page.

### What moved (nothing dropped silently)
- "Compare two sounds side by side" (any two abnormal sounds) is now normal against abnormal at the same spot; two
  abnormal sounds are one key tap apart.
- The side panel's "Why?" text (why this spot, the spot's landmarks) is in the cause line, the glow and "?".
- Volume and every sound's card moved to "?". Mute as a button on the stage is gone; volume 0 in "?" does the same.
- Name the sound no longer plays on its own when a round opens (press Play).

### What is on screen in Explore (counted, opening, 1440 and 390)
2 tabs; 1 purpose line (8 to 9 words) and "Show me how"; 1 picture with: 3 sound keys (5 on Heart) and a 2 to 7 word
tag ("Real recordings"); Front / Back (Lungs only); 5 listening spots (4 on the back, 5 on Heart); the stethoscope;
R and L; the lens with its 1 to 3 word name; the Normal / abnormal switch; the strip with Play and its 1 to 2 word
title. Under the picture: 1 cause line (2 pills at the opening, 3 while a sound plays, the takeaway after). After
placing: 1 spot label (1 to 3 words) and the strip's event names (S1, S2, S3...). The cue on the first visit only. No
side panel, no text block, no buttons under the picture.

## Decisions made for the owner (also in the owner log)
1. Explore is a chest with a stethoscope to drag; landing it plays the sound (the student's own action, not autoplay).
2. Two tabs, lungs first; heart marked beyond the EMT exam.
3. Normal against abnormal on one switch; the old "compare two sounds" removed.
4. The lung Normal side plays nothing and says so (no licensed recording).
5. Name the sound no longer autoplays.
6. Test yourself keeps its three parts unchanged; record ids and Review links unchanged.
7. Volume and every sound's card in "?".
8. `#snd-<id>` opens Explore on that sound (best spot, nothing playing); no clip: "?" on its card.
9. Lung strip: the clip's live loudness when measurable, otherwise a named typical breath.
10. Text in the tool's Test yourself parts raised to at least 11 px.

## Build notes
- `nremt/assets/sound-explore.js` and `.css`: the scene, the stethoscope (pointer drag with capture, tap, keys), the
  spots and their glow, the lens drawings and their animation per sound, the strip (heart envelope from
  `LevlSoundBank.heartData` at the spot's mix; lung live level), the cause line, the cue, "Show me how" and "?". All
  in stage pixels (the svg's viewBox is the stage's size), so every text is its real size. Data from the page's
  `SOUNDS` and `SoundStage.pure`; no copy of the tables.
- `nremt/assets/sound-bank.js`: one additive option, `analyse`: the clip is asked for with CORS from `liveUrl` and
  routed through an AnalyserNode (`info.level()`); if that load fails, it is asked for again the old way. A play
  promise rejected by a stop no longer shows "Playback was blocked".
- `nremt/sound-trainer.html`: loads the kit, the adapter and Explore; `liveUrl` on the three clips; no autoplay in
  Name the sound; the small texts at 11 px; the v2 block (Explore, the three Test yourself parts, "?", deep links).
  The old studio block stays for `?studio=0` and a browser without the kit. `SOUNDS`, the quiz and the content tests'
  extraction markers are unchanged.
- `nremt/assets/sound-stage.js`: unchanged (Test yourself's Where and When, and the tables Explore reads).
- `scripts/tools-v2/nremt-sound-trainer-sweep.mjs`: the kept sweep (one process per width, then `--frames`).
  A local test tone stands in for the Wikimedia clips (served with CORS; `--nocors` checks the fallback).
- A one file preview (`scripts/tool-preview.mjs`) cannot load the chest figure through `LevlBodyFigs.load`, and the
  lung clips stream from Wikimedia; the preview in outputs was patched by hand to inline the figure data.

## Checks run
See "Checks" at the end (filled in after the runs).

## Not done, and what I am not happy with
- No independent review yet; no medical review by a person (points in `docs/nremt-needs-author.md`); no real phone,
  no screen reader pass, no real students; only Chromium.
- The live lung trace depends on Wikimedia answering CORS; it could not be checked from this container (Wikimedia is
  blocked here). The fallback is the old typical breath, named as one.
- No normal breath sound recording, so lung normal is silent.
- The heart in the lens is a schematic; the lungs' airway drawings are simple.
