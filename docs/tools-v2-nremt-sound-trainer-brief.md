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
  S1 S2. Lung normal is never silent (review round 1): over the lung fields a real normal recording (Fraiwan et al.,
  CC BY 4.0), over the trachea a generated tracheal breath (louder and harsher, both ways), its strip titled
  "Generated breath"; the lens draws what is under the stethoscope (open airway, dry air sacs, or the open larynx).
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
- The side panel's "Why?" notes per spot (for example "P2 is soft and heard mainly here") and the ICS numbers and MCL
  lines drawn on the old Explore chest are no longer in Explore. They are in Test yourself, Where to listen: the notes
  in its feedback after each answer (the tapped spot's note and the answer), the ICS numbers and MCL lines on its
  chest; every spot's intercostal space and line is also listed in "?". Explore keeps the spot's name, its glow (how
  loud the sound is there) and "loudest here" or "faint here" on the cause line. (Corrected in review round 1: the
  first version of this brief said these were in the cause line.)
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
4. Lung Normal plays a real normal recording over the lung fields and a generated tracheal breath over the trachea
   (review round 1; the first build played nothing).
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

## Checks run (2026-11-18)
- `node --test scripts/test/nremt-*.test.mjs scripts/test/tool-content.test.mjs`: 108 pass (the sound stage's timing,
  site and zone tests and the trainer's content tests unchanged). `build-nremt-lessons --check` (80 up to date),
  `build-nremt-flashcards --check` (up to date), `check-site` (OK), `check-weight --check` (all budgets within range).
  No shared kit file changed, so `build-apcalc` and `build-apmacro --check` were not needed.
- A local copy of `check-tool-use.mjs` listing this page (not committed): tool-open, tool-touch(explore),
  tool-mode(quiz), tool-use as frame v2; nothing under automation.
- Sweep (`node scripts/tools-v2/nremt-sound-trainer-sweep.mjs`, one process per width, light and dark): every landmark
  state at 360 to 1920 (opening with the cue, each lung and heart sound at its best spot mid sound and stopped, back
  view, a faint spot, normal on both tabs, the takeaway): nothing clipped, no overlaps (labels, keys, switches, Play,
  cue, R and L, the strip's event pills), the cue clear of every spot and mark, the chest the largest thing, every
  text at least 11 px, keys at least 40 px tall, the compare switch one row, the phone cause line at most two rows
  and constant in height. `--frames` at 390 and 1440: frame by frame (about 900 frames each) the sound's pill only
  after the trace or sound starts, the cause only once the lens moves, each event pill only over drawn trace, the
  spot's label never while the stethoscope moves; a mouse drag, a fast drag, a real touch drag at the scrolled end
  of the page, the keyboard (arrows, End), the phone cause line in view after the drop, the screen reader name
  following the state, leaving mid sound for Test yourself (sound bank stopped, no frame loop, no timers) and coming
  back finished and clean, "?" mid sound (stops), reduced motion (the whole trace at once), Test yourself (Where to
  listen right and wrong from `?mode=where&q=s1`, Name the sound right and wrong, no autoplay, record ids
  `where-s1` and the sound's id), seven deep links, and a drag with the CPU throttled x4 (median 16.7 ms, p95 33.3 ms
  at 390 and at 1440). **Final run: 22858 passed, 0 failed.** `--frames --nocors` (the CORS address fails, the clip
  plays the plain way and the strip draws the named typical breath): 5532 passed, 0 failed.
- Preview: `/mnt/user-data/outputs/nremt-sound-trainer-v2/index.html` (the chest figure inlined by hand; the lung clips
  need a connection). Shots: `/mnt/user-data/outputs/nremt-sound-trainer-v2/shots/` (`sweep-<width>-<theme>-<state>`,
  the `-mid` ones taken while the sound plays, the lens and strip moving; `v-test-*` for Test yourself), compared
  side by side with the flagship's `wp-v2/shots/`.
- Self review against the 15 rules and the "Caught in reviews" list with fresh frames at 360, 390, 768, 1024 and
  1440, light and dark: what it found is fixed above (the compare switch wrapping on phones, the cue over a spot and
  the R mark, a label over Front / Back, event pills too close in a narrow strip, the trace erased under its labels
  between sweeps, the finished state lost on a redraw, the figure loading before the module was ready, slow drops
  under CPU x4).

## Not done, and what I am not happy with
- No independent review yet; no medical review by a person (points in `docs/nremt-needs-author.md`); no real phone,
  no screen reader pass, no real students; only Chromium.
- The live lung trace depends on Wikimedia answering CORS; it could not be checked from this container (Wikimedia is
  blocked here). The fallback is the old typical breath, named as one.
- No normal breath sound recording, so lung normal is silent.
- The heart in the lens is a schematic; the lungs' airway drawings are simple.

## Review round 1 (2026-11-18, independent review BLOCK; all fixed on this branch)
Merged `origin/claude/tools-v2-all` first (both sides of the docs tables kept; its `check-tool-use.mjs` unchanged).
Must fix:
1. **Normal lung was silent.** Silence over a lung field teaches "diminished or absent". Now Normal plays: over the
   lung fields recording DP31 (normal) of the Fraiwan et al. dataset (CC BY 4.0, Mendeley Data jwyy9np4gv), fetched
   from a GitHub copy of the dataset (Mendeley is not reachable from the container) and saved as
   `nremt/assets/audio/normal-vesicular.wav`, credited in "?" and the footer; over the trachea a generated tracheal
   breath (`sound-bank.js` `breath-tracheal`: band limited noise, in and out about equal with a gap, harsh), tagged
   "Generated breath". The takeaway: "Normal breath sounds over the lungs are soft and low (vesicular): heard all
   through breathing in, fading early in breathing out. Over the trachea they are louder and harsher." Points for a
   person (check the file against the original, listen to it) in `docs/nremt-needs-author.md`.
2. **When in the beat under 11 px.** The strip was made while its part was hidden (no width, drawn at 600 units)
   and then shown smaller. It now redraws at its real width whenever that changes, and every svg text in Test
   yourself (the strip, Where to listen's ICS, MCL, R and L) is sized from the measured scale to render at 11 px or
   more (`fitText` in `sound-stage.js`). The sweep measures it with `getScreenCTM` at every width, light and dark.
3. **"What moved" corrected** (above) and the owner log line added.
Should fix: the lens heart redrawn (the aorta rises from the left ventricle and arches over, the pulmonary trunk
rises in front of it toward the patient's left; systolic flow leaves the left ventricle through the aortic valve;
shading like the rendered chest); air sacs shaded on ducts; "does not close fully"; crackles "small airways and air
sacs stuck by fluid snap open"; off the chest the lens is dim and unnamed; the heart picture zooms (up to 2.2x) when
its spots would sit under the chest piece, and on narrow layouts the tubing leaves sideways (the sweep checks the
chest piece never covers another spot); the exam tag right after the keys; pointer moves painted once a frame
(drag x4 p95 16.8 ms at 390, 33.4 at 1440). Removed: the desktop leader line (kept on phones, where the lens sits
under the chest), and on the v2 path the old mode tabs, Sound button, "More options" box (with "Compare two sounds")
and tap cue. The phone cause line keeps 90 px (a long cause pill wraps).
Not taken: none. Still open: the live CORS trace of the Wikimedia clips (one look on the live site).
Performance in this round: the scene is now two svg layers (the still chest and spots; the moving lens, strip and
tubing), a generated sound renders one beat and loops it, and the cause line and the picture's screen reader name
update only when they change; the lens repaints every other frame. Checks (2026-11-19): NREMT and content tests 112
pass; `build-nremt-lessons --check`, `check-site`, `check-weight --check` OK. Sweep, one width per process, 360 to
1920, light and dark, with the new checks (Normal plays at the base and at the trachea, the lens unnamed off the
chest, the chest piece never over another spot, Test yourself svg text measured at 11 px or more): every width 0
failed (1975 to 2026 checks each). `--frames`: all checks pass except the CPU x4 drag at 390 while the machine ran
other builders' browsers (load average 10 to 12): measured back to back under that load, the first build gave p95
66.6 ms at 390 and 50.0 at 1440, this one 66.8 and 33.4; on a quiet machine earlier in the round 16.8 and 33.3.
Preview and shots regenerated in `/mnt/user-data/outputs/nremt-sound-trainer-v2/` (the normal clip inlined too).

## Recheck 1 (2026-11-19, PASS; its should fix items 1 to 4 done before the merge)

1. The dataset is linked by its DOI (doi:10.17632/jwyy9np4gv.3, version 3, the current one) in "?" and the footer,
   beside the CC BY 4.0 link. Which version the GitHub copy came from is an open point in `docs/nremt-needs-author.md`.
2. The key row's tag follows what is on: on a lung tab "Generated breath" while the generated tracheal Normal is the
   sound (as the strip says), "Real recordings" otherwise (`madeTag()`).
3. The recording note's clause now covers only snoring, gurgling and diminished ("for these three a synthesized
   substitute would teach the wrong sound"), not the generated tracheal breath beside it.
4. On the wide heart tab the tubing leaves down and outward on a diagonal before it drops, so it no longer crosses
   Erb's point under the pulmonic area (lung tabs unchanged).
Sweep: 390 (2026) and 1440 (1982) pass, 0 failed; NREMT tests 71 pass.
