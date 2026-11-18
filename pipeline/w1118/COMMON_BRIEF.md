# LevlPrep Short build brief (batch w1118, built 2026-11-18). Read fully before doing anything.

You are building ONE vertical Short (1080x1920, 30 fps, about 30 to 40 s) for LevlPrep, an education brand, entirely in code (Python + skia), to the house standard that the owner (Olivier) approved on the reference builds. Nobody is watching; work on your own until the video passes every gate below or you have made three honest fix rounds. Your per video brief (script, shots, facts) is in your own folder as BRIEF.md.

## Rules that cannot be broken
- Everything on screen is drawn in code with skia in the house flat style. No AI images or video, no pasted pictures, no Modal.
- Never print, echo, log or copy the API key. It is in /root/.lpkey/k and is read only inside commands (see voice.py and music.py of the reference).
- Never post anything anywhere, never push to git, never write to the Project. Work only inside your own folder /home/claude/w1118/<slug>/. Do NOT edit files in /home/claude/guy, /home/claude/mh, /home/claude/short, /home/claude/lt, /home/claude/dv, /home/claude/lp (shared, other builders use them at the same time). If you need to change the people model, copy the files into your folder and put your folder FIRST on sys.path.
- No em dashes and no hyphens used as punctuation in any on screen text or report.
- ElevenLabs credit cap for your whole build: 4,500 credits. Voice = 1 credit per character (one take, at most one re-voice). music_v1 takes cost about 800 each (at most 2 takes).
- NO SHORTCUTS (owner, 2026-11-10): never recolour one person to make another, never rotate a standing figure to fake lying down, never hide legs behind something to fake a pose, no short fat capsule shapes as cuffs or bands (they read as hexagons). If the story needs a pose, view or prop the model cannot draw, BUILD it and check it on its own (a test still, then a strip), or change the shot so it is not needed and say so in your report.
- ACTIONS CONNECT: a hand that holds, pushes or waves something is ON it every frame; nothing moves unless a person or a real force moves it.

## Read these first (use the Projects tool, method project_read; if you have no Projects tool, work from the reference code alone)
1. claude/levlprep-director-workflow.md (THE CURRENT STANDARD for people and the director steps you do silently)
2. claude/levlprep-people-standard.md and claude/levlprep-no-shortcuts.md
3. claude/levlprep-video-standard.md: sections 0, 0a, 0b, 4, 5d, 6 (ignore anything about painted style B scenes, traced cast, Modal, AI clips: history)
4. claude/levlprep-style-guide.md section 10 (and the palette)
5. claude/levlprep-spec-shorts.md: "The premium standard" and steps 8, 9, 10 (the gates)

## Reference builds on disk (approved by the owner; copy their patterns, not their content)
- /home/claude/lt/ = w1109-03 lightning triage (build.py, mix.py, music.py, voice.py, render2.py, full.sh, thumb.py). Three designed people with the v5 people model. Render a still: cd /home/claude/lt && python3 -c "import sys; sys.path.insert(0,'/home/claude/lt'); import build as B, skia; B.SHORT.frame(6.0).makeImageSnapshot().save('/tmp/x.png', skia.kPNG)". A sheet of its stills: /home/claude/lt/out/ref_sheet.jpg (look at it first: that is the bar for finish, people, titles and captions).
- /home/claude/dv/ = w1110-01 dive reflex (side view woman swimmer in diver.py, world.py scene pieces, mix.py with a heartbeat laid on picture beats).
- /home/claude/mh/ = w1109-01 Monty Hall (char.py: a woman seen from behind with a turning head and face close shots; art.py helpers shaded, tube, glow; hands.py the ONE hand model; kit.py Words, Short, titles, captions, finish; lpk.py paint helpers).
- /home/claude/guy/ = the people model v5 (person.py with design options through ps.cfg, guy.py Pose, guy13.py, hands.py) plus kit.py, lpk.py, art.py.
- /home/claude/short/layout.py = the house Short layout (badge, two line titles with colour words, word by word captions, watermark, end card).
- /tmp/m/pipeline/ = the whole pipeline (w1101, w1104, w1108, w1109, w1110, w1111 (tide car with a man and a hatchback, bank run, great smog: the newest approved builds; also copies in /home/claude/lp/w1111), long/ca01/marco.py, thumbpro/ for thumbnails, sound/judge_music.py, motion_qc.py, transcript_check.py, flatcheck.py, studio/story.py, studio/shots.py). /home/claude/lp is a copy with assets/ (real sounds: *_real.wav).
The people model has: men, front view, standing, sitting on the ground with knees up, one waving arm, head turn, scream and worry faces; a woman from behind (mh/char.py); a side view woman swimmer (dv/diver.py). It does NOT have walking, running, kneeling, side view men, front view women. Design every person new (who they are, build, hair, clothes) and check a lineup still. The main person's FACE must be shown in close shots reacting at the key beats.

## What the numbers say (analytics 2026-11-18, read before writing a single frame)
- The two best posts ever (firework blue 153K TikTok views, lightning triage 39.7% full watch and 92% held on YouTube) both open on ONE person with a goal or a choice and a felt stake in the first second, put as a question the viewer can answer.
- Weak posts open on a setup the viewer watches from outside, or cut from the person to a diagram or explanation between 4 and 8 s: that is exactly where viewers leave. Keep the main person and the stake ON SCREEN through 10 s; let the idea arrive inside the scene (overlays drawn in the world, the person still visible).
- Endings: stop on the payoff picture; keep any end card very short.

## Steps
1. Read the docs and the reference code. Look at the reference stills.
2. Director pre production (silent, in your folder): beat sheet, colour script, shot list in build.py's docstring. Follow the shot plan in BRIEF.md unless you find something better that keeps the facts and the script.
3. Voice FIRST so every cue can be keyed to a spoken word: write vo.txt exactly as given in BRIEF.md (you may change a word only if it reads badly aloud and the facts stay the same; say so in the report), run a copy of /home/claude/lt/voice.py with paths changed (voice Jeremy 5gaEGrWSk4v20HMfIhgC, model eleven_v4, stability 0.5, similarity 0.75, one take with timestamps). Check out/words.json: the search phrase must begin before 3.0 s and the first word within 0.15 s. Run python3 /home/claude/lp/flatcheck.py out/voice.mp3 out/words.json if it works, and note the result.
4. Build build.py exposing SHORT (kit.Short) like the references: scene world, people, overlays, titles keyed to words (WD), captions, badge, watermark, the film finish, continuous slow camera pushes, no static frame over about 2 s, scene life (particles, drift, flicker). The search phrase appears as on screen title text in the first 3 s. Titles hard switch, never ghost. Keep everything important above y 1500 and text off faces and the action. The upper middle (about y 560 to 900) stays free of chips and labels for the first 8 s if BRIEF.md says this is the poll post.
5. Check stills at frame zero, every cue, every 2 s and the last frame, at full size crops for faces and hands. Check motion with strips of consecutive frames. Compare with /home/claude/lt/out/ref_sheet.jpg. Fix what is pale, boxy, busy, clipped or hard to read at phone size.
6. Render into out/silent.mp4 with ONE render process (the machine has 2 cores shared by three builders working at the same time; adapt /home/claude/lt/full.sh and render2.py to a single process, run it with setsid nohup in the background and poll). Confirm the length matches the plan.
7. Music and mix: a composed music_v1 score with a composition plan timed to your shots (copy /home/claude/lt/music.py; make 2 takes, pick with /tmp/m/pipeline/sound/judge_music.py or by its numbers), then a restrained mix like /home/claude/lt/mix.py: voice leads; score about 20 dB under the voice with a 4 dB duck; ambience of the place about 26 dB under; ONLY 3 to 5 sound effects on the actions that matter, about 10 dB under; no whooshes or risers; two pass loudnorm to -14 LUFS, true peak -1.5 dBTP. Write out/mix_music.wav and out/mix_nomusic.wav. Use real sounds from /home/claude/lp/assets/*_real.wav where one fits; otherwise synthesize a simple honest sound or leave it out.
8. Encode out/final.mp4 and out/final_nomusic.mp4: H.264 10 Mbps (maxrate 12M, bufsize 20M), yuv420p, 30 fps, AAC 192 kbps 44.1 kHz, -movflags +faststart.
9. Gates (fix and rerun what fails):
   - ffprobe: 1080x1920, 30 fps, H.264 at least 6 Mbps, AAC, audio and video within 0.2 s, under 60 s. ebur128 about -14 LUFS, true peak under -1 dBTP.
   - python3 /home/claude/lp/motion_qc.py out/final.mp4 --out out/motion_qc (FROZEN and JUMP are flaws unless a planned hard cut; END_CARD is fine).
   - python3 /home/claude/lp/transcript_check.py if it runs in this setup (it may need a module spec; if it cannot run, say so, do not fake it).
   - Strips at 4 frames a second: mkdir -p out/strips && ffmpeg -i out/final.mp4 -vf "fps=4,scale=270:-1,tile=8x4" out/strips/s%02d.jpg ; look at every one.
   - Your own honest check against step 9 of the spec (Gate C list).
10. Thumbnail: out/thumb.png 1080x1920 with the pro kit pattern (see /home/claude/lt/thumb.py and /tmp/m/pipeline/thumbpro/): the strongest frame plus 2 to 5 big words naming the topic in the viewer's words.
11. Write out/REPORT.md: final length, voice characters and music takes used (credits), every gate result with numbers, the list of people and how each was designed, what is still simpler than the rest (honest list), any word you changed in the script, the sound effects used and their times, and the shot list with times. Also write out/story.json style notes if you used story.py.

Your final message back: 10 lines at most: paths of final.mp4, final_nomusic.mp4, thumb.png, REPORT.md; length; credits used; gate results; the honest weak points. Do not claim a gate passed unless you ran it and saw it pass.
