# w1111-02-great-smog (AP Environmental Science 7.3, thermal inversion): build report

## Fix round 3 (after the second review, 7.4). This section is current; where it differs from anything below, this section wins.
No new voice or music; narration and timings unchanged. The whole picture was rendered again (1320 frames), the mix rerun, both finals encoded, strips, motion_qc and the thumbnail rebuilt. Round 2 files are kept in out/round2/.

What was done, by the reviewer's points:
1a. The on the spot stepping is removed from every conductor shot. In the wide shots (0 to 4.86 s and 41.30 to 44 s) and the face close shot he stands planted, flare up, and beckons with a larger beckon (upper arm out from the body, hand up beside his head, then swept toward the camera with the fingers curling in). The bus creeps up to him: about 10.4 m to 8.3 m behind him in the opening, 6.9 m to 5.3 m in the last shot, rocking, headlamps bobbing. His feet sit at about y 1350 to 1410 on screen, above the caption.
1b. The boots insert was built and is used once, 4.86 to 6.92 s (2.06 s, starting on "on foot"). steps.py: a purpose built low side view of his boots, trouser legs and coat hem taking two steps on wet setts, with the bus's two headlamps glowing far behind. Each boot is planted at a fixed point on the road for its whole stance (heel down, sole rolls flat, heel peels up, toe off) and moves only through the air; the setts are drawn in the same road coordinates, so they hold still under a planted boot while the camera follows at six tenths of his pace. The hem lags the hips. Checked alone first as a 16 frame strip (out/test/steps_strip.jpg) and one full size still. It is NOT reused in 41.3 to 44: that shot is only 2.7 s and holds the end line, so it stays the wide shot.
2. Five days (33.10 to 39.46): one continuous push in (zoom 3.0 to 4.25) on the three people, who now fill about 35 percent of the frame height at the start and about 50 percent at the end. They were redrawn with more finish (faces, hands from the one hand model, shade band and rim, coat details) and timed actions spread over the shot: the tall man lifts the handkerchief and coughs three times (1.4, 1.7, 2.0 s in), lowers it, raises it again near the end; the woman glances at him, then takes her knitted scarf and pulls it up over her mouth and nose (2.7 to 3.6 s in); the man in the cap turns his head to the cough and shifts his weight three times.
3. Captions now end at a cut when their words ended there (rule added in build.py). "people die." no longer hangs over the close shot; in the close shot the caption sits at y 1500 on his coat, below his face.
4. Cab shot: the windscreen ends at y 968, the wheel sits at y 1030 to 1440 and the hands at about y 1010 to 1250, above the caption. The gloves are tan leather with gauntlet cuffs and separate fingers from the one hand model wrapped over the rim; the rim shows on both sides of each fist.
5. The note is 50 px on a dark plate.
6. The 7X DEPOT lettering on the bus's blind is dimmed to near black in the conductor shots, so the title is clean.
7. The close shot is framed further left; the open hand is fully in frame through the whole beckon.
Sound: two soft footfalls were added on the insert's heel strikes (5.16 and 6.01 s, made in mix.py, 11.8 dB under the voice). That makes 5 effects: flare hiss, diesel idle, footfalls, lid tone, cough.

Gates, all run on the final files after the last encode:
- ffprobe: both files H.264 1080x1920, 30 fps, video 10.03 Mbps, AAC 44.1 kHz 192 kbps, video and audio 44.000 s. PASS.
- ebur128: final.mp4 -14.6 LUFS, true peak -1.9 dBTP; final_nomusic.mp4 -14.6 LUFS, true peak -1.9 dBTP. PASS.
- motion_qc.py final.mp4: moving 100% of frames, 0 frozen, 0 stutter, 6 jumps at 4.87, 6.93, 9.07, 33.10, 39.47, 41.30 s, all planned hard cuts. PASS.
- transcript_check.py final.mp4: 112 of 112 words, 100.0%, 0 failures. PASS.
- flatcheck.py: still FLAGGED (sentences 4 to 6: pitch spread 1.2 st, loudness spread 2.4 dB); no new voice take was allowed.
- Strips: I looked at all six strips (s01 to s06, the whole 44 s at 4 frames a second) made from the picture render out/silent.mp4. The strips now in out/strips were then remade from final.mp4 (the same frames after the 10 Mbps encode); I did not look at that second set.
- Also checked before rendering: full size stills at 0.0, 2.0, 4.6, 5.6, 8.0, 33.3, 34.6, 36.5, 38.8, 39.6, 40.4, 40.6, 43.5 s, and frame strips of the wide beckon (1.0 to 2.4 s), the cab (7.0 to 8.5 s) and the five days actions. Not checked at full size: the last wide shot's beckon as a consecutive strip (only one still at 43.5 s and the 4 per second strip).
- Credits: none spent in this round (total about 2,770 of 4,500).

Shot list now:
1. 0.00 to 4.86 wide, he stands and beckons, the bus creeps up. 1b. 4.86 to 6.92 the boots insert. 2. 6.92 to 9.05 from the driver's cab. 3 to 6. 9.05 to 33.10 the rise and the air cutaway. 7 and 8. 33.10 to 39.46 the three at the bus stop, one push in, DAY 1 to 5 then AT LEAST 4,000 DEAD with the note. 9. 39.46 to 41.30 close on his face. 9b. 41.30 to 44.00 wide, bus closer, end line at the left.

Still weak (honest):
- The boots insert is a simple side view: the legs are plain tapered shapes, the coat is one flat panel, the far leg is only a greyer copy of the near one, and during it the caption says "with a flare" while no flare is in the picture.
- In the wide shots he does not walk at all; the walking is carried only by the insert.
- The three waiting figures are a simpler build than the conductor (not the full people model), and in the last two seconds they are faint under the smog.
- The cab shot's conductor is a small plain silhouette; the driver's arms are plain dark shapes.
- The bus is a flat front view. The voice is flat in the middle. The length is 44 s.
- I cannot hear audio or watch playback.

---
(Round 2 and round 1 reports follow; superseded where they differ.)

## Fix round 2 (after the independent review graded it 7). This section is current; where it differs from the text below, this section wins.
No new voice take and no new music take. Narration and timings unchanged. The whole picture was rendered again (out/silent.mp4, 1320 frames), the mix was rerun, final.mp4, final_nomusic.mp4, the strips, motion_qc and the thumbnail were rebuilt. The round 1 files are kept in out/round1/.

What changed, by the reviewer's points:
1. He now steps and the bus creeps. I built a front view step cycle in the people model and checked it alone first (out/test/walk.png, out/test/walk_feet.png), then in the shot (out/test/strip_walk.jpg), and used it in both wide shots and the close shot. One thing differs from the note: he faces the camera with the bus behind him, so moving ahead of the bus means stepping FORWARD toward the camera, not backing away. The cycle is small careful steps: the weight goes over the planted leg, the other foot lifts, comes forward and sets down, the hips rise and fall, the coat hem swings a beat late and the lifted knee pushes the skirt out. The camera backs away at his pace, so he holds his place while the road moves: rows of setts, their joints, worn patches, wet glints, kerb joints and the gas lamps are fixed to the street and slide away at exactly the speed his planted foot is carried back (no foot slide by construction). The bus is a little faster than he is: from 0 to 6.9 s it closes from 7.6 m to 6.25 m behind him (about 20 percent larger), rocking on its springs, headlamps bobbing; in the last shot it closes from 5.9 m to 5.4 m. The headlamps now throw a wash of light along the wet road so his legs and boots read dark against it, and he stands higher in frame so his boots are clear of the caption.
2. The opening is now ONE shot from 0 to 6.92 s (wide, slow push in to a medium wide; the title changes at 3.04 s but the picture does not cut). The 6.92 to 9.05 s shot is the view from the driver's cab: the wheel and the driver's gloved hands (the one hand model, gripping the rim, which shows on both sides of each fist; the hands ride the rim as the wheel makes small corrections), the windscreen full of lit murk, the setts coming out of it, a lamp drifting past, the wiper still, a dim gauge, and ahead the conductor's small dark shape from behind with the flare and his waving arm. The close shot of his face is kept at 39.46 s.
3. The three at the bus stop are three different people (people_small.py, test sheet out/test/waiting.png): a tall man in a trilby and long overcoat who coughs twice into a handkerchief every 2.9 s; a short woman in a headscarf and belted coat with a handbag, a knitted muffler wound over her mouth and nose, who turns her head to look down the street and back; a stocky man in a flat cap and short jacket, hands in pockets, a muffler with hanging ends, who shifts his weight from leg to leg. Faces have skin, eyes and brim shadow; the mufflers are shaped, with folds.
4. The end line levlprep.com now sits at the left, baseline y 1392, clear of him.
5. The air cutaway is framed larger and lower (zoom 1.15 rising to 1.21, the chimney pots held low), so the sky part fills more of the frame. Labels: NORMAL NIGHT chip 40 to 56 px, COLDER HIGHER UP 40 to 56 px with a heavier arrow, WARM SMOKE 38 to 54 px. The house row is varied: two rendered ground floors, a taller house with a brick gable and a lit attic window, doors in five colours, lit and unlit windows.
6. The footnote lines are 46 px (were 38).
Own list: in the last shot the flare is now well above the left headlamp (about 340 px apart) and the number plate is hidden; the ragged sleeve edge is smoothed (small notches in the coat outline are closed before the outline is rounded; compare out/test/arms.png).

Gates after round 2 (run on the final files):
- ffprobe: both files H.264 1080x1920, 30 fps, video 10.05 Mbps, AAC 44.1 kHz 192 kbps, video and audio 44.000 s. PASS.
- ebur128: final.mp4 -14.6 LUFS, true peak -1.7 dBTP; final_nomusic.mp4 -14.6 LUFS, true peak -1.9 dBTP. PASS. (The first encode of this round measured -0.9 dBTP on final.mp4, over the limit, so the loudnorm ceiling was lowered to -2.2 dBTP and the audio was encoded again; the video stream was copied.)
- motion_qc.py final.mp4: moving 100% of frames, 0 frozen, 0 stutter, 5 jumps at 6.93, 9.07, 33.10, 39.47, 41.30 s, all planned hard cuts (one fewer than round 1 because the 3.04 s cut is gone). PASS.
- transcript_check.py on final.mp4: 112 of 112 words, 100.0%, 0 failures. PASS.
- flatcheck: unchanged, still FLAGGED (sentences 4 to 6), because no new voice take was allowed.
- Strips out/strips/s01 to s06: all looked at again.
- Mix: same four effects and times; the diesel is louder and the flare hiss lower during the cab shot (6.92 to 9.05 s). Levels against the voice: hush 26.0 dB under, hiss 16.0, diesel 16.7, lid tone 10.3, cough 13.1, score 20.1.
- Credits: none spent in this round (total stays about 2,770 of 4,500).

Shot list after round 2:
1. 0.00 to 6.92 wide to medium wide, one shot: he steps toward us with the flare up, beckoning, a look back at 4.5 s; the bus gains on him. Titles THE GREAT SMOG OF LONDON, then DECEMBER 1952, HE GUIDES HIS BUS ON FOOT.
2. 6.92 to 9.05 from the driver's cab. THE DRIVER CAN'T SEE THE ROAD.
3 to 6. 9.05 to 33.10 the rise up the terrace and the air cutaway, as before but framed larger.
7. 33.10 to 36.82 five days, three people at the bus stop. 8. 36.82 to 39.46 AT LEAST 4,000 DEAD.
9. 39.46 to 41.30 close on his face as he walks. 9b. 41.30 to 44.00 wide: still stepping ahead of the bus, which is closer; end line at the left from 42.9.

What I could not fix or is still weak (honest):
- The step cycle is a modest shuffle seen from the front: feet lift and set down and the body shifts, but the boots do not roll heel to toe or tilt, and most of each leg is under the long coat. It reads as careful steps at phone size; it is not a full walk.
- In the cab shot the conductor is a small simple back view silhouette (the model has no back view of him), and the gloved fists are large and plain; the driver himself is not seen.
- The three waiting figures are better but still small simple figures, not built to the people standard.
- The bus is still a flat front view; it grows and rocks but does not turn.
- The voice is still flat in the middle; the length is still 44 s.
- I cannot hear the audio or watch playback; the motion was judged from frame strips.

---
(Round 1 report follows. Its gate numbers, shot list for shots 1, 1b and 2, and people notes about the bus stop figures are superseded by the section above.)


Files: out/final.mp4, out/final_nomusic.mp4, out/thumb.png, out/silent.mp4 (picture only), out/mix_music.wav, out/mix_nomusic.wav.
Code: build.py (shots, titles), world.py (fog, smoke, bus, lamp, terrace, air cutaway), cond.py (the conductor), person.py (this build's copy of the v5 people model with the new options; patch_person.py records what was added), mix.py, music.py, voice.py, thumb.py.

## Length
44.0 s (1320 frames at 30 fps). The narration as given runs 42.6 s, so the video is longer than the 30 to 40 s the common brief names. It is under 60 s. Nothing was cut from the script.

## Credits used (cap 4,500)
- Voice: 2 takes of 583 characters = 1,166. Take 1 is used. Take 2 was the one allowed re-voice, made because the flatness check flagged take 1; take 2 came out flatter (three flagged windows), so take 1 was kept.
- Music: 2 takes of music_v1 (about 800 each by the brief's figure, about 1,600). Take A (snd/smog_a.mp3) is used: A minor all the way through, strongest accent at 25.2 s next to the lid. Take B sat in A major for most sections.
- Total about 2,770. The transcript check uses speech to text, not voice characters (it reported 0 voice characters used).

## Script
No word changed. vo.txt is the brief's text exactly.

## Gates (run on the final files)
- ffprobe final.mp4: H.264 1080x1920, 30 fps, video 10.07 Mbps, AAC 44.1 kHz 192 kbps, video 44.000 s and audio 44.000 s. final_nomusic.mp4 the same. PASS.
- ebur128: final.mp4 -14.4 LUFS, true peak -1.2 dBTP. final_nomusic.mp4 -14.4 LUFS, true peak -1.2 dBTP. PASS (0.4 LU under the target; the linear loudnorm pass is held by the peak limit).
- motion_qc.py final.mp4: moving 100% of frames, 0 frozen, 0 stutter, 6 jumps at 3.07, 6.93, 9.07, 33.10, 39.47, 41.30 s. All six are the planned hard cuts of the shot list. The first render also had a jump at 25.57 s (the light change on LID); the light now comes up over four frames and that finding is gone. PASS.
- transcript_check.py (ran with a small spec module, spec_smog.py): 112 script words, 112 heard, match 100.0%, 0 failures, 0 terms. PASS.
- flatcheck.py on the voice: FLAGGED. Sentences 4 to 6 ("The city's own coal fires..." to "But this week...") have a pitch spread of 1.2 semitones and a loudness spread of 2.4 dB. Whole take: median pitch spread 9.4 st, loudness spread 6.4 dB. Not fixed (the one re-voice was worse).
- Voice timing: first word at 0.00 s; "Great Smog of London" starts at 0.32 s; the title THE GREAT SMOG OF LONDON is on screen from frame zero to 3.04 s.
- Strips at 4 frames a second (out/strips/s01 to s06): all looked at. Found and fixed in the fix round: two titles drawn on top of each other from 8.0 to 9.0 s (a word lookup picked the wrong "the"), and the question title missing; both corrected and checked again.
- Mix levels against the voice: city hush 26.0 dB under; score 20.1 dB under in speech with a 4 dB duck; flare hiss 16.0 dB under; diesel idle 16.4 dB under; lid tone 10.3 dB under in its first 0.6 s; cough 13.1 dB under.
- Gate C by my own eye: hook moving at frame zero with a person in danger, search phrase on screen in the first 3 s, titles hard switch, captions word by word, badge and watermark present, end line over the last moving shot, nothing important under y 1500 except his boots in the wide shot, no em dashes and no hyphens as punctuation on screen. I cannot hear the audio or watch playback: sound is judged from measured levels, motion from strips of frames.

## People
- The conductor (the one designed person): a lean man of about fifty, long face, greying moustache and temples, narrowed tired eyes, brow lines. Navy double breasted uniform greatcoat with wide lapels, two rows of brass buttons, flapped pockets and a skirt to below the knee; peaked cap with a badge plate (a plain plate, no real emblem), red piping and a glossy peak; dark red knitted scarf pulled down off his mouth; two crossed leather straps with the ticket machine on one hip and the cash bag on the other; a round licence badge; dark trousers, black boots. Built as new options in this build's copy of the people model: top coat, hair cap, beard moustache, age lines, scarf, straps with machine and bag. Checked first on a model sheet and a beckon strip (out/test/sheet.png, out/test/beckon.png).
- New actions built: the right fist grips the flare (the one hand model; the flare is drawn under the fingers and shows above and below the fist every frame); the left arm beckons with the forearm coming toward the camera and the fingers curling in, one continuous swing every 1.25 s; head turn and eyes for the look back at the bus; two close shots of his face (6.92 and 39.46 s).
- The rim light sits on the flare's side of him (the model's light direction was turned round for this build).
- The bus driver: a dim shape behind the cab glass, as the brief asks.
- Three people at a bus stop in the five days shot: simple small far figures on purpose (coat, hat, two legs, a cloth held over the mouth), about 230 px tall, standing. They are not built to the people standard.
- He never walks. He stands and beckons while the bus creeps closer, as the brief allows.

## Sound effects (4) and times
1. Flare hiss (sizzle_real.wav looped, with fire_real.wav under it): 0.0 to 11.4 s fading out as the camera rises, and 39.46 s to the end.
2. Diesel idle of the bus (made in mix.py): 0.0 to 9.6 s and 39.46 s to the end.
3. One low tone when the lid settles (made in mix.py): 25.56 s.
4. One cough far off (cough_real.wav, dulled and set back): 34.52 s.
Under everything: a low city hush made from filtered noise. No foghorn or bell (left out rather than faked). No whooshes or risers.

## Shot list with times
1. 0.00 to 3.04 wide. The conductor in the smog, flare up, beckoning, the bus behind him (two headlamps, dark red). Title THE GREAT SMOG OF LONDON.
1b. 3.04 to 6.92 medium, cut in on the same line. Flare, sparks, beckon, a look back at the bus. Title DECEMBER 1952, HE GUIDES HIS BUS ON FOOT.
2. 6.92 to 9.05 close on his face: eyes back to the bus, then ahead, a blink. THE DRIVER CAN'T SEE THE ROAD.
3. 9.05 to 15.60 one rising move from a coal fire seen through a window (flare light on the bricks, a gas lamp) up the brick front to the chimney pots, pulling back to the roofs. WHERE IS IT ALL COMING FROM, THE CITY'S OWN COAL FIRES, A COLD, STILL WEEK.
4. 15.60 to 21.15 normal night over the roofs: columns rise, lean and thin away. Labels NORMAL NIGHT, COLDER HIGHER UP, WARM SMOKE.
5. 21.15 to 26.40 the warm layer sinks in from above and settles on LID at 25.56 (light change, low tone, a small shake). Labels WARM AIR above, COLD AIR below.
6. 26.40 to 33.10 the smoke climbs, stops under the band, slides sideways (arrows), beds down until the roofs dim. THERMAL INVERSION at 31.66.
7. 33.10 to 36.82 the terrace across the street, three people at a bus stop, DAY 1 to DAY 5 (33.20, 33.92, 34.64, 35.36, 36.08), the smog thicker each day.
8. 36.82 to 39.46 the same street nearly swallowed. AT LEAST 4,000 DEAD, with two small lines: counted at the time about 4,000, later estimates up to 12,000.
9. 39.46 to 41.30 close on his face, eyes down at the road then up ahead. 9b. 41.30 to 44.00 medium, flare up, beckoning, the headlamps closer; end line levlprep.com from 42.9.

## Changes to the shot plan
- Shot 2 is the close shot of his face, not the view from the driver's seat (the brief allowed either).
- Shot 7 is a flat view of the terrace across the street with the smog thickening, not a view along the street. A first version looking along the street (lamps vanishing with distance) looked boxy and was dropped.
- Small white arrows were added in shot 6 to show the smoke going up and then sideways.

## Still weaker than the reference stills (honest list)
- The voice is flat through the middle (flatness check flagged, see above).
- The video is 44 s, over the 30 to 40 s target.
- The three bus stop figures are simple silhouettes.
- The flare flame is a soft three tone shape; at phone size it reads as a flame, close up it is mushy, and in the last shot the flare sits in front of the left headlamp so the two glows merge.
- The conductor is front view only. In the close shots the flare is out of frame and only its light falls on him; his face is lit evenly rather than with a strong moving flare light.
- The coat sleeves have a slightly ragged lower edge near the elbow (from the base model's cloth folds), visible in close crops.
- In the wide shot the bus sits close behind him and reads a little cramped; the bus front is flat (no three quarter view), and the mudguards are plain dark shapes.
- The rise in shot 3 starts beside a large gas lamp that covers the left edge; the flare there is only a glow at the lower left, the man is not in that shot.
- The air cutaway is a diagram laid over the scene: the smoke sheet under the lid is soft and the arrows are plain.
- Shots 1b and 9b share the same framing (a bookend), with the bus closer and the smog thicker in 9b.
- The assembled picture went through one extra high quality encode (the fix round re-rendered only the changed frames and joined them to the first render).
- No independent review or outside fact check was done in this run; the drawings follow the facts in the brief (warm band above cold air, never at the ground).
