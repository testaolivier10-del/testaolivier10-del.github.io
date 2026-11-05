# yt-apchem-01-units-sci-notation build (2026-11-04 long video build run)
Started from the b02 build (A&P 02 pilot format) at the premium standard. Work dir /home/claude/lv_c01 with /home/claude/lv -> it.
- c01_script.py: audited script (log at the top). vo/: the eleven_v4 takes (one per chapter; units is take 3 after two flatness re-voices).
- cast.py: Maya and Theo as ONE skinned body each (person.py and airman2.py from pipeline/people, with casual clothes, hair and a
  child's head), from the Gemini model sheet ref/cast_sheet.png. world.py: the night kitchen built in code from ref/kitchen.png.
- mk.py: handwritten math (powers of ten, quantities with coloured units, conversion factors with timed strikes).
- scenes.py: one draw function per beat; teaching boards get a slow push (render.py) and an amber band on the line being explained.
- render_chunks.sh: renders 1500 frame chunks with two workers (safe to rerun; the container can restart mid render).
- music.py / music2.py: ElevenLabs music_v1 (intro composition, a looped teaching bed, a story cue, the ending) on a credit budget.
- sound.py: restrained mix (music about 21 dB under the voice, room tone 26 dB under, 5 effects). Final loudness via a limiter pass.
- flatcheck.py: the flatness check (also committed as pipeline/flatcheck.py with flatcheck_ref.json from take D).
- Final encode is two pass at about 0.9 Mbps total so the file stays under GitHub's 100 MB limit (the 12 Mbps master was 570 MB).
