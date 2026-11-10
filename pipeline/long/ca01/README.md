# yt-calc-01-functions-exponents build (2026-11-10 long video build run)
Started from the p01 build (pilot format, 2026-11-05 rules, people standard of 2026-11-09). Work dir /home/claude/lv_ca01, /home/claude/lv -> it.
- ca01_script.py: audited script (log at the top); beat l7 (rational functions, cost per loaf) was voiced but is cut from the
  timeline for runtime (tl.CUT; the take is split around it). ca01_tc.py is the script as it plays, for transcript_check.py.
- vo/: eleven_v4 takes; intro, func, graphs, lines, expo, outro rewritten after the flatness check and re-voiced (twice for
  all but intro).
- Story: Marco's bakery at night. bakery.py builds the set in code (front view across the workbench: window with night sky
  and dawn, wall clock, the taped starter chart, shelves, oven glow, pendant lamp, bench with the jar, notebook, flour,
  bowl). The jar has tape marks, a rubber band at 8 cm and bubbles; level(h) in story.py is his doubling rule.
- People: marco.py, a new design on the v5 model (pipeline/people/v5/person.py, needs guy.py, guy13.py, hands.py from v5 and
  lpk.py, art.py, layout.py from w1109 / studio). person.py gained an apron option (bib, neck strap, ties, pocket, flour).
  Nobody walks or turns; he stands behind the bench (the bench hides his legs because the story puts him there).
- gr.py: board math (fractions, roots, subscripts) and graphs (axes, curves, open and filled dots).
- scenes.py: teaching boards (one navy board, never zooms). story.py: hook, f6, g4, l6, e2, e8, end.
- sound.py: no music; voice, the oven's soft roar 26 dB under in bakery scenes, a pour and two glass clinks.
- thumbs_ca01.py (uses thumbs_p01.py helpers): a is the pick. finish.sh: concat, limiter, two pass encode, 720p copy.
- render_chunks.sh: N=26826 frames (894.2 s).
