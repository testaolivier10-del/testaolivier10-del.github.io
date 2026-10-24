# Building a LevlPrep video the code drawn way (current method, Olivier 2026-10-24)

Reference build: runner/short_sprint.py (sprint lean Short, AP Physics 1). Read it first; copy its structure.

1. Setup: bash /tmp/m/pipeline/studio/codechar/setup_codechar.sh (installs skia, potrace, Inkscape; copies the
   code to /home/claude/{rig,trace,mocap,runner,neuro,short}, the paths the modules import from).
2. Scene: a full lit style B painting that makes sense for the story (a sprint start happens on a track or a street
   in daylight, not in front of a fire). Library first (characters/style_b/README.md), else a new Gemini scene
   (claude/levlprep-studio-wan.md). Turn it into a world like runner/bg.py: scaled plate, a far layer and a near
   ground layer (near ground 1:1 under the feet, seamless repeat for long tracking runs, far layer parallax),
   ambient life in the painting (flames, leaves, embers, light).
3. People: the traced cast. Paramedic (codechar/model.py, build()) and the hoodie runner (runner/model.py).
   A new person: paint them in a full lit scene in Gemini (side view, whole body, limbs clear of the body),
   then copy runner/extract.py and runner/trace.py (cut parts by colour and region, k-means + potrace + Inkscape,
   tag brow, eye, eye white, mouth), and write a model like runner/model.py (bones measured on the painting,
   limb tubes, cuffs, light and rim from the scene). Check with still_test.py and stress.py (0 breaks).
4. Motion: CMU motion capture through mocap/mocap_perf.py (MocapPerformer; plans of takes with weights;
   foot locks, heel raise, layered upper body takes). Every take passes the real motion check before use
   (studio system section 4): runner/perf.py repair() for marker glitches, ptest.py for the joint pop scan and
   strips, stress.py. Find takes with mocap.search("words") and side.py <code> sheets. If a move cannot pass,
   key it simply (a 'what if' is labelled).
5. Science and diagrams: painted pieces moved by code (neuro/neuro.py: painted brain, impulse along the path);
   exact things (force arrows from the real contact and the computed centre of mass, labels, meters, graphs) may be
   code drawn. Every arrow, label and motion matches the checked step list.
6. Timing: runner/timing.py keys every cue to its spoken word (ElevenLabs alignment once voiced; an estimate before).
7. Layout: kit/layout.py is the house Short look (progress bar, badge, two line titles with coloured words, fades,
   watermark, word by word captions, chips, end card). Long videos keep their own layout rules (video standard 8).
8. Render: python3 <build>.py --words <words.json> --out out/<id>/silent.mp4 (30 fps, skia, ffmpeg pipe), then the
   sound mix (runner/mix.py: voice, ambience, steps, UI sounds, music bed ducked, -14 LUFS) and the final encode
   (H.264 8 Mbps, AAC 192 kbps, faststart). Then the gates (spec-shorts steps 8 to 10).
