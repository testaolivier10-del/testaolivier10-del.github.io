# w1118-01-book-stack (AP Calculus BC): report (round 2, after the fresh eyes review at 6.5/10)

## Round 2 fixes (all nine review notes)
1. Payoff held on the stack from 19.6 to 24.1 s (no cut on "table."): continuous push in, one solid line labelled TABLE EDGE (the second dashed line is gone), the gap between the top book's back end and the line glows, tag NO TABLE UNDER IT with a small arrow at 22.24 s. I wrote NO TABLE UNDER IT, not NOTHING UNDER IT, because the top book still rests on the book below it. Her face reaction is now 24.1 to 25.3 s.
2. Frame 0: her fingertips are already sliding the top book out toward the edge (110 px, fastest at frame 0, flush by 1.8 s).
3. The tall stack (32 to 39.9 s) is made of solid hardbacks with spines and page blocks, a little hazier further down the stack. The real four stay on top in full colour. The desk lamp became a brass pendant over her, clear of the tower; she looks up at it, mouth open, then smiles at 31 BOOKS.
4. Stack framed larger and lower: zoom 1.28 to 1.82 in the stack shots, against 1.12 to 1.33 before. The fractions went from 40 to 54 px, the formula is 50 px and the running total 54 px. Caption, watermark and books do not collide.
5. Close ups: the stack is no longer drawn in the face shots, so the stray corner is gone. At 6 s she looks doubtful (one brow up, mouth pulled to one side); at 7.2 to 8.25 s she looks determined (brows low and together, pressed lips, a small nod).
6. Every title has two lines (ADD THEM UP / 1/2 + 1/4 + 1/6 + 1/8, IT REACHES FAR / JUST SLOWLY, TWO FULL / BOOK LENGTHS, and so on). Titles hard switch with no blank frame.
7. Ending 39.9 to 41.6 s: the same camera as frame 0, her pleased look at the four books with the top book past the edge.
8. 10 to 12.95 s: a centre of mass marker (circle with opposite quarters filled), WEIGHT label, an arrow growing down onto the book below, then that book's top lights up with a BOOK BELOW tag.
9. 25.3 to 29.68 s: slow push (zoom 1.30 to 1.40). There is a cut in at 29.68 s ("and that sum") to 1.75 to 1.85, and the pull back starts from there. The four overhang brackets light up as their matching harmonic terms are spoken.
Voice take unchanged (no new words). No new credits spent this round.


Files: out/final.mp4, out/final_nomusic.mp4, out/thumb.png (alternate thumb_b.png). Build: /home/claude/w1118/stack/ (build.py, world.py, reader.py, mix.py, music.py, voice.py, thumb.py, render1.py, encode.sh).

## Length and credits
- Final length 41.6 s (voice 0.00 to 39.84 s; end line from 40.1 s). Matches the plan (1248 frames). Round 2 re-rendered with one process.
- Voice: one take, 588 characters, vo.txt exactly as BRIEF.md (no word changed), Jeremy, eleven_v4, 0.5 / 0.75. No re-voice.
- Music: 2 music_v1 takes (about 800 each). Total about 2,190 credits (cap 4,500). Transcript check: Scribe, 0 voice characters.

## Gates (all run and seen)
- Search phrase "book stacking" starts 0.80 s, first word 0.00 s; title BOOK STACKING / PAST THE EDGE? on screen from frame 0.
- flatcheck: PASSED (10 sentences, median pitch spread 18.9 st, loudness spread 7.2 dB).
- ffprobe (round 2): 1080x1920, 30 fps, H.264 yuv420p 9.99 Mbps, AAC 44.1 kHz 192 kbps, video 41.600 s = audio 41.600 s, faststart.
- ebur128 (round 2): final -14.3 LUFS, true peak -1.3 dBTP; nomusic -14.3 LUFS, -1.2 dBTP.
- Mix: score 20.2 dB under voice in speech (4 dB duck), effects 9.9 dB under, far clock 27.6 dB under.
- motion_qc (round 2): moving 100% of frames, 0 FROZEN, 0 STUTTER, 6 JUMP (5.97, 8.27, 24.10, 25.30, 29.70, 39.90 s), all planned hard cuts: to her face, back to the stack, to her face, back to the stack, the requested cut in, and the loop back.
- transcript_check (round 2, on final_nomusic.mp4): scribe_v2, 119/119 words, 100%, 0 failures, 0 terms, 0 voice characters.
- Strips at 4 fps (out/strips, round 2): the push, payoff and tower sheets were looked at (s03, s05; the others checked as stills). Fixed: a one frame blank title at every switch (local hard switch override).
- Gate C own check: frame 0 moving with hook; text above y 1500 and off her face; pushes land on HALF 14.56, quarter 16.48, sixth 17.60, eighth 18.88; fingertips on the back end of the pushed book every frame, books above ride along, nothing moves without her hand; gap past the edge to scale (0.042 L); ghost stack is the true harmonic stack, 31 books first past 2 L (H30 3.995, H31 4.027).
- Not run: independent fact check subagent, fresh eyes review subagent, shots.json, story.py.

## Person
- Nadia (reader.py), designed new: grad student, late twenties, warm brown skin, oval face, black hair in a high bun with two loose strands, round gold glasses, gold hoops, cream turtleneck, open mustard cardigan. One head function at every size; the one hand model (hands.py). Lamp warm key on her right, window cool fill. One person only.

## Still simpler than the rest
- Front view only, no turning head; she sits behind the table, the table top hides her below the waist; her left arm hangs to her lap under the table.
- The pushing arm crosses in front of her body with a simple foreshortened forearm; hands seen from the back only.
- During the pushes her face slides out of frame left (arm and hand stay in).
- In the pull back (32 to 40 s) she is small (head about 80 px), moving only eyes, brows, smile, breath.
- The tall stack grows underneath the four books as an imagined what if (nobody builds it on screen); its colours cycle and can read busy.
- Bottom quarter of the stack shots is the dark table front (captions sit there).
- In the pushes and the payoff, her face leaves frame at the left; only her arm and hand stay in.
- Thumbnail uses the pro kit words and pill but no cut out sticker hero.

## Sound
- Score: take B (E minor turning to C major at the steps and payoff; take A stayed A minor).
- Effects (synthesized): book slides 13.75, 15.95, 17.15, 18.35 s; soft wood knock 19.05 s as the stack settles. No whooshes.
- Ambience: far wall clock ticking once a second (synthesized), about 27 dB under.

## Script
- No word changed.

## Shot list (round 2)
- A 0.00-5.95 medium wide (frame 0 framing): fingertips sliding the top book out; ghost goal past the edge; TABLE EDGE line.
- B 5.95-8.25 face close: doubtful look at the edge, then determined, with a small nod.
- C 8.25-12.95 stack closer: centre of mass marker, arrow onto the book below, BOOK BELOW; hand comes onto the top book.
- D 12.95-19.60 continuous: four pushes with 1/2, 1/4, 1/6, 1/8; camera pans with the books; hand in frame.
- E 19.60-24.10 continuous push onto the edge: TABLE EDGE line, glowing gap, NO TABLE UNDER IT.
- F 24.10-25.30 face close: surprised, then pleased.
- G 25.30-29.68 stack with the formula, slow push; brackets light with their terms.
- G2 29.68-32.15 cut in: running total ticking 2.08 to 3.10 with a rising arrow.
- H 32.15-36.70 pull back: the tower of real hardbacks grows under the four, she looks up.
- I 36.70-39.90 wide: floor ruler, 2 BOOKS OUT, 31 BOOKS reaches it.
- J 39.90-41.60 frame 0 framing: her pleased look at the four books (loop), levlprep.com.

## Round 3 (last round, after the second review at 6.5/10)
1. Opening: frame 0 is her last push, all four books moving together; the top book crosses the table edge at 0.65 s and settles with a small wobble (0.5 degrees). Her fingertips stay on the bottom book's back end until 1.05 s. TABLE EDGE line and gap glow appear on "past the edge". From 4.9 to 5.95 s there is a marked REWIND (blue tint, scan lines, a REWIND chip): the whole build, hand included, plays backwards at 6x to the flush stack. The story then shows how she did it.
2. Framing: books are bigger and higher in frame in every stack shot (zoom 1.32 to 1.84). The reading desk now has a closed front panel down to the floor, so the lower frame is warm wood, not empty legs. Fractions went from 54 to 72 px (1/2 now sits above the top book so the labels no longer collide). NO TABLE UNDER IT is 58 px, TABLE EDGE 52 px, the WHAT IF count 50 px.
3. 32 to 41 s: the count reads WHAT IF: n BOOKS and the title is WHAT IF YOU STACK / ENOUGH BOOKS?. The camera tilts up and out along the growing stack, ending on its top with a large ruler at table height (ticks at the edge, 1 and 2 book lengths, 2 BOOKS OUT at screen y about 1270). She stays in frame looking up.
4. 29.68 s title: THE SUM DIVERGES / IT NEVER STOPS GROWING.
5. Ending: 39.9 to 41.1 s shows the title 1 + 1/2 + 1/3 + ... / NEVER STOPS over the 31 book stack. At 41.1 s it cuts to the frame 0 picture and motion, with the frame 0 title, so the end runs straight into frame 0.
6. 25.3 to 32.15 s: framed so she is fully out (no shoulder sliver at the edge).
7. 29.3 to 30.5 s: eased camera move; the jump at 29.7 s is gone in motion_qc.
8. Face close up: a 2.1 s eased push (zoom 2.2 to 2.75) instead of the whip. She looks doubtful (brow up, head tilted 8 degrees), blinks at 6.75 and 7.95 s, then looks determined with a small nod.
9. The crosshair is replaced by an amber dot with a cream arrow straight down, labelled BALANCE POINT. It rides with the top book through push 1 and lands exactly on the edge of the book below as the push ends (glint). The same arrow without a label shows each sub stack's balance point landing on its support in pushes 2 to 4.

## Round 3 gates (final file, all regenerated)
- ffprobe: 1080x1920, 30 fps, H.264 yuv420p 10.03 Mbps, AAC 192 kbps, video 41.600 s = audio 41.600 s.
- ebur128: final -14.3 LUFS, true peak -1.3 dBTP; nomusic -14.3 LUFS, -1.2 dBTP.
- motion_qc (regenerated): moving 100%, 0 FROZEN, 0 STUTTER, 5 JUMP at 5.97, 8.27, 24.10, 25.30 and 41.10 s. All five are planned hard cuts (to her face, back to the stack, to her face, back to the stack, the loop back to frame 0).
- transcript_check: 119/119, 100%, 0 failures, 0 voice characters.
- Strips at 4 fps regenerated; all six sheets looked at.
- No new voice or music: total stays about 2,190 credits.

## Still weak after round 3
- The far right end of the top book is cut by the frame in the opening and the payoff wide.
- During the pull back the top of the tall stack sits just under the titles (about y 440), and the WHAT IF chip covers a few books.
- She is front view only and seated; during the pushes her face leaves frame and only her arm and hand stay in. In the wide tower shot her head is about 95 px.
- The rewind is an editing device (marked as one), not a physical action.
- The independent fact check and fresh eyes review subagents were not run by me.
