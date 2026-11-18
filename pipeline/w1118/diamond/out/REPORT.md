# w1118-02-diamond-water (AP Microeconomics): build report

Files: out/final.mp4 (music), out/final_nomusic.mp4, out/thumb.png (second concept out/thumb_b.png). Build in /home/claude/w1118/diamond
(build.py, chars.py, person.py = patched copy of people v5, mix.py, music.py, voice.py, thumb.py, render1.py, render_seg.py).

## Round 2 (fresh eyes review 5.5/10, ten fixes), 2026-11-18
1. Ending (37.67 to 41.60): hard cut to a closer two shot that eases back to the opening framing so it loops into frame 0; the stranger lifts the ring to
   the sun with a bloom and turning star glint; the lost man lowers the half empty bottle, eyes open, smiling; final title WATER BEATS / A DIAMOND
   (hard switch at 39.78); levlprep.com on clean sky at y 650, not on the sign.
2. Every title change is now a hard cut (kit title fade and scale pop replaced by _title_cut in build.py).
3. Cap shot 35.40 to 36.15: his left hand grips the bottle, his right finger and thumb are on the cap, two twists (ridges turn), then the cap lifts away in
   his fingers. Drink 36.15 to 37.67: mouth open (parted lips), the bottle's open neck placed on the mouth point the model records, bottom tipped up and out.
4. The 12.5 s two shot is now five shots: two shot MARGINAL (18.97), cut in on the ring hand with the diamond card (23.13), cut in on the bottle with its
   card (24.40), two shot with both cards and the memory of endless shelves (26.50), cut in tighter on the stranger and his bottle (28.67); all with pushes.
5. Leader lines: only in the two cut ins (none cross a face); the two shots carry no leaders.
6. Cards: VALUE OF / ONE MORE (40 px) over DIAMOND or BOTTLE (46 px); the bottle bar shows "?" until "at home".
7. Memory of home redrawn: brass framed jeweller's window with glass reflections, velvet display step, an open ring box with satin lining, a price tag on a
   thread; a tiled kitchen with a wooden shelf of bottles, a chrome gooseneck tap and handle with water running into a steel sink and splashing. The panel
   sits higher (y 540 to 1070) and clears his cap.
8. COLD WATER sign: an opaque painted wooden board with nails.
9. Frame 0: eyes open (blink phase moved), a bright glint on the raised bottle, both men larger (zoom 1.2 around y 900); heads sit just below y 900 for the
   first 8 s (lost man's cap top about y 918).
10. Two silent pauses trimmed from the voice (11.05 to 11.40 and 31.45 to 31.70, both below -80 dB; trim_voice.py, words_t.json). No new words, no re-voice.
Wind: no real wind recording on disk, so the filtered noise was replaced by a richer synthesized desert wind (low body with random slow gusts, a faint
whistle whose pitch rises with the gusts, sand hiss on strong gusts). Still synthesized, still a conflict with the video standard's "never noise beds".

## Round 3 (second fresh eyes review 6/10, nine fixes), 2026-11-18
1. 26.5 to 28.7: the camera frames lower and the cards are smaller (270 x 330, text still 40 to 42 px) and sit above both heads (no cap or hat covered).
   The endless water is now a supermarket aisle inside the memory panel: far wall, floor, ceiling lights, shelving units on both sides with four shelves
   of real bottles receding to the far end.
2. Ending: he holds the half empty bottle to his chest with both hands (his own forearms drawn from his elbows, both grips on the bottle), relieved
   smile, eyes open. The stranger's fingers pinch the ring; the glint is small and sits on the stone.
3. While the big levlprep.com is up (from 40.03 s) the corner tag is hidden; the final title is drawn as a hard cut from 39.78 s.
4. Memory 11.2 to 19.0: ABOUT $1 tag moved to the shelf edge, clear of the tap; water runs from the start; slow push in (9 percent); a hand reaches in,
   closes on the last bottle and lifts it off the shelf (the bottle moves only once the grip is closed).
5. Opening: the lost man lifts his head, sways and shifts weight, leans a little, breathes, turns his head slightly, eyes on the bottle.
6. COLD WATER sign: dark painted letters on lighter opaque wood.
7. 33.8 to 35.0: the stray sleeve at the bottom left is gone (sleeves are drawn only once their hands come in).
8. Out here the diamond bar shrinks to almost nothing while the water bar climbs over the top (at home, before "out here", the diamond bar stays tall).
9. The score is cut at the same two places as the voice (80 ms crossfades), so its sections land on the cuts again. No new music take.

## Length and credits
- Final length 41.60 s (voice ends 39.72 s after the trims; payoff holds about 1.9 s).
- Voice: one take, 579 characters (eleven_v4, Jeremy). Music: 2 music_v1 takes (about 800 each). About 2,180 credits in all; round 2 used none.
- Script words changed: none. Music take B was composed for the first cut; its sections now land up to 0.6 s early; the mix levels it per new section.

## Gates (round 3, all run on the final files)
- ffprobe: 1080x1920, 30 fps, H.264 yuv420p 10.07 Mbps, AAC 192 kbps 44.1 kHz, faststart; video 41.600 s, audio 41.620 s (0.02 s apart); under 60 s.
- ebur128: final.mp4 -14.4 LUFS, true peak -2.0 dBTP; final_nomusic.mp4 -14.4 LUFS, -1.9 dBTP. silencedetect (-45 dB, 1 s): no gaps.
- Mix in speech: music 20.0 dB under the voice, effects 10.0 dB under, wind 26.0 dB under.
- transcript_check on final_nomusic.mp4: 106 of 106 words, match 100%, 0 failures, 0 terms, 0 voice characters used; exit 0.
- motion_qc (regenerated, out/motion_qc and out/motion_qc.txt): moving 100%, 0 FROZEN, 0 STUTTER, 13 JUMP, all planned hard cuts (6.20, 10.10, 11.23,
  18.97, 23.13, 24.40, 26.50, 28.67, 31.20, 33.83, 35.43, 36.17, 37.67).
- Strips at 4 fps regenerated (out/strips/s01 to s06), all six looked at.
- Flatness check (voice unchanged): still FLAGGED sentences 2 to 7 (uncalibrated tool).
- NOT done by me: a third fresh eyes review, story.py and shots.py checkers, an independent fact check.

## Sound effects (5)
- 0.08 s water_pour_real slice: slosh as the stranger lifts the bottle.
- 34.24 s glass_clink_real at 1.7x: tick as the stranger's fingers close on the ring.
- 34.72 s water_pour_real slice: slosh as the bottle changes hands.
- 35.48 s synthesized cap clicks (two short ratchet runs) on the two twists.
- 36.45 s bubbling_real (low passed): glug while he drinks.
No whooshes, risers or human sounds.

## Shot list (round 2)
1. 0.00 to 6.20 opening wide (zoom 1.2 to 1.26 about y 900), stranger lifts the glinting bottle, the lost man turns to it. 2. 6.20 to 10.10 ring hand close.
3. 10.10 to 11.21 face close. 4. 11.21 to 18.97 memory of home (jeweller's window, kitchen tap, shelf). 5. 18.97 to 23.13 two shot, MARGINAL.
6. 23.13 to 24.40 ring hand plus diamond card. 7. 24.40 to 26.48 bottle plus bottle card. 8. 26.48 to 28.64 two shot, both cards, endless shelves.
9. 28.64 to 31.19 closer on the stranger and bottle, water bar sinks. 10. 31.19 to 33.80 the one bottle, water bar over the top. 11. 33.80 to 35.40 the
trade on the hands. 12. 35.40 to 36.15 cap twist. 13. 36.15 to 37.66 drink. 14. 37.66 to 41.60 payoff and loop back.

## People
- Lost man (main person): thin and tall, long face, sunburned light skin (red across nose and cheeks), sandy hair with strands under a navy baseball cap
  pushed back (new: crown plus tipped up brim showing its dark underside), stubble, dry cracked lips (new), dust on face and clothes (new), faded teal
  zip sun shirt with hood down, rust neck cloth knotted at the throat (new), khaki cargo trousers, brown boots, empty dented canteen on a strap at his
  hip with its cap hanging open (new). Face close shots at "Would you take it?", through the home memory, and drinking (eyes closing).
- Stranger: heavy, older, darker skin, grey hair and full grey beard, wide brimmed straw hat with a dark band (new), denim collared shirt under an open
  brown leather waistcoat (new), dark jeans, black boots.
- Lineup still: out/test/lineup.png and crop.png. Both use the v5 body and the one hand model (hands.py) for every hand.
- Model additions live only in the copy /home/claude/w1118/diamond/person.py: hats, waistcoat, neck cloth, sunburn, dry lips, dust, canteen, held props
  under the fingers, late and hidden hands, absolute hand angle, world positions of hands and elbows.

## Still simpler than the rest (honest list)
- Hands from the back only; the trade and the cap are framed close on the hands with sleeves entering from the frame edges.
- In the drink the bottle covers one eye as it tips up; the mouth is a simple open shape behind the neck.
- The kitchen price tag overlaps the tap's neck a little; card fonts are Montserrat bold at 40 to 46 px.
- The stranger's legs are behind his counter (the story places him there; they are drawn).
- Wind is synthesized (no real recording available).
