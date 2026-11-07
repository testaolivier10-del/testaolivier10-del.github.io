# yt-phys-01-units-sig-figs build (2026-11-07 long video build run)
Started from the c01 build (pilot format, 2026-11-05 rules). Work dir /home/claude/lv_p01 with /home/claude/lv -> it.
- p01_script.py: audited script (log at the top); vo/: eleven_v4 takes (si, convert, sigfigs, recap re-voiced twice after the flatness check).
- Story at a school track at golden hour. ref/track.png (Figma AI, gemini-3.1-flash-image) is the composition reference; world.py builds
  the track in code as a pure side view with parallax layers, timing gates, the display, a measuring wheel and a slow push on every shot.
- People: cast.py builds Leo and Ana on ONE skinned body (person.py, airman2.py) with heads measured off their own head turnarounds
  (ref/heads_leo.png, ref/heads_ana.png; measure_heads.py writes ref/head_contours.json). people.py: standing helpers, a planted walk,
  and Sprint, a run with leg IK: the stance foot is planted in world space, flight phases between steps, heel kick and knee drive.
- Staging (nobody turns on screen): Leo always runs right; at the finish Ana stands left of the gate facing right; after a run Leo slows
  out of frame and walks back in facing left.
- story.py: the story beats; scenes.py: the teaching boards (one navy board, no zoom) and SCENES; base.py: shared helpers.
- sound.py: no music. Voice, birds 26 dB under in the track scenes, gate beeps and running feet about 10 dB under.
- thumbs_p01.py: three concepts (a is the pick). render_chunks.sh: N=22920 frames.
