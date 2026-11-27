# yt-nremt-02-provider-levels: DRAFT built 2026-11-27, HELD by the review bar (ship gate 5)
12:57, 1920x1080. Voice eleven_v4 (Jeremy), natural tempo. Part 1 of the coverage map entry (split, see the script's audit log).
Fresh eyes round 1 (whole video from stills): overall 6. Teaching clarity 8, people 5. Round 2 (story shots after two fix rounds):
overall 6.5, people 6. Bar: 8 on every shot with a person. Shots at 8: hook close face and question, Ruiz with the AED case,
the map with times, the protocol card, the nitroglycerin bottle in Walt's fist. Everything else with a person is 5 to 7.
## Blockers still open (all about people)
1. Walt at the counter (hook, end): a second hand still reads under the counter forearm; ball shaped elbows; a pale slab on his forehead.
2. Joan with the ECG strip (end): her hands are hidden by the strip, the sleeves end like mittens.
3. Seated Walt (l6, j4, m3): cuffs float off the forearm with a pale ghost shape behind the hands; arms hang like tubes.
4. Priya "starts her assessment" standing with her arms at her sides (l6 wide, j4 two shot); no hand on a wrist or a cuff.
5. Tablets hand off: no frame clearly shows the four tablets in Priya's palm first.
6. Ruiz stands beside Walt with his hands at his belt (the hand on the shoulder could not be built from the front view).
7. Likeness: Walt is narrower than his sheet, Ruiz slimmer than his.
8. Wide store shots read as a line up of people facing the camera.
## Notes (not blockers)
Board helper text of 28 to 50 px in places; a few boards start nearly empty for some seconds; board avatars are simpler
than the cast; hospitals on the map have icons and times but no word labels; the end portraits sit low.
## Other checks
Gate 1: 120 sentences, 0 flags. Gates 2 and 3 (gate2s.py, gate3s.py): 663 poses, 0 failures. Transcript check 97.7 percent,
0 failures, 0 terms. Pause check passed (median 1.05 s after a sentence, 0.50 s at commas, 166 words a minute while talking,
3 sentence pairs the voice ran together: "orders. Those", "using? And", "slip. They"); 180 silences stretched, 360 cut points,
loudest -56.1 dB. Flatness (long rule): flat stretches flagged in every chapter (in sentence range 7.5 to 9.3 semitones); NOT
re-voiced (the same check flagged yt-orgo-03 after a full re-voice). Fact check: 37 claims and 16 reworded lines confirmed
(2019 National EMS Scope of Practice Model, 2025 ACC/AHA ACS guideline, nremt.org).
## To continue
Code, references and the voiced takes with word timings are in pipeline/long/n02/ on the media branch (work dir
/home/claude/lv_n02, link /home/claude/lv; needs pipeline/people/v5 plus w1109 lpk.py and art.py at /home/claude/guy and
studio/codechar/kit at /home/claude/short). Do not voice again. The people need what yt-orgo-03 needed: a model that can turn
three quarters, sit, lean in and reach to another person. With that: restage the assessment (a hand on Walt's wrist), the
shoulder touch, the tablets and Joan's strip, then render only the story chunks (0, 4, 5, 7, 8, 11, 12, 14, 15).
If Olivier says in a chat that the draft is good as it is, follow his words (spec step 12): copy the draft files to long/,
set the item pending with approval.py review, then approve.
