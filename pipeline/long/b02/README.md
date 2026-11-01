# yt-apbio-02-elements-macromolecules build (2026-11-01 long video build run)
Copied from the A&P 02 pilot (pipeline/long/a02/) and changed for AP Bio 02. Work dir: /home/claude/lv_b02 with a symlink
/home/claude/lv -> it (the scripts use /home/claude/lv). Fonts: Inter at /usr/share/fonts/opentype/inter/, Kalam-700.ttf at
/home/claude/lp/fonts/ (google/fonts ofl/kalam/Kalam-Bold.ttf). Sounds from sfx/ into /home/claude/lp/assets/ (shimmer.wav is synthesized
in the run: a short bell, see the run notes).
- b02_script.py: audited script (log at the top). vo/: the voiced takes (one per chapter) so the build can resume without re-voicing.
- people.py: Jay and his grandma BUILT IN CODE from parts (not traced), from the Gemini model sheets ref/jay_sheet.png and
  ref/nana_sheet.png, following Olivier's 2026-11-01 rule (people in code from a reference model sheet). Pose by hand targets (IK)
  or arm angles, breathing, blinks, legs=False for seated shots.
- world.py: the patio (ref/patio.png) and kitchen (ref/kitchen.png) built in code, props (pot, tomato plant at any growth stage,
  scale with readout, plant food bag, lunch). dia.py: atoms, ball and stick molecules, tiles, beads, enzyme, icons.
- scenes.py: one draw function per beat. render.py seg i n out.mp4 (4 parts on 2 cores about 40 min), sound.py, pack.py
  (captions with respellings mapped back to the written form), thumbs.py, finish.sh. sheet.py / stills.py for checks.
- audit/: narration, on screen list and claims list given to the audit agents.
