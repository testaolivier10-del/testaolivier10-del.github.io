# yt-apchem-01-units-sci-notation build (2026-11-04 long video build run)
Started from the b02 build (A&P 02 pilot format) at the premium standard. Work dir /home/claude/lv_c01 with /home/claude/lv -> it.
- c01_script.py: audited script (log at the top). vo/: the eleven_v4 takes (one per chapter; units is take 3 after two flatness re-voices).
- cast.py: Maya and Theo as ONE skinned body each (person.py and airman2.py from pipeline/people, with casual clothes, hair and a
  child's head), from the Gemini model sheet ref/cast_sheet.png. world.py: the night kitchen built in code from ref/kitchen.png.
- mk.py: handwritten math (powers of ten, quantities with coloured units, conversion factors with timed strikes).
- scenes.py: one draw function per beat; teaching boards get a slow push (render.py) and an amber band on the line being explained.
- render_chunks.sh: renders 1500 frame chunks with two workers (safe to rerun; the container can restart mid render).
- sound.py: NO music (Olivier 2026-11-05: no music in long videos). Voice, the kitchen's room tone 26 dB under, a few effects 10 dB under. Final loudness via a limiter pass.
- flatcheck.py: the flatness check (also committed as pipeline/flatcheck.py with flatcheck_ref.json from take D).
- Final encode is two pass at about 0.9 Mbps total so the file stays under GitHub's 100 MB limit (the 12 Mbps master was 570 MB).

## Rebuild of 2026-11-05 (Olivier's notes on the first cut)
- cast.py: each person's head is built from their own Figma AI head turnaround (ref/heads_theo.png, ref/heads_maya.png): skin and hair outlines measured into ref/head_contours.json, features placed at measured points. Theo has a child's head (big cranium, small lower face, big low eye), no longer the airman's head.
- scenes.py: restaged so nobody turns or mirrors on screen (Theo on the stool left of the sink facing right, Maya at the right chair facing left); planted walk at the end.
- render.py: teaching boards stay still (no slow push). kit.py: one board background for every long video (BOARD_TINT).
- thumbs2.py: new thumbnails with Theo and the drop as big stickers (a2 is the pick).
- render_chunks.sh: resumable chunked render (run one per worker: bash render_chunks.sh 0 and 1).
