# Building a LevlPrep video the code drawn way (current method, Olivier 2026-10-24)

Reference builds: jump/short_jump.py (landing impulse Short: traced background, three view character, graph;
the newest, copy this one) and runner/short_sprint.py (sprint lean Short). Read one first; copy its structure.

New since the jump Short (Olivier asked: characters are not only side view; backgrounds traced like characters):
- Backgrounds are traced in code from a Gemini painting, like the characters: jump/bgtrace2.py (Felzenszwalb
  regions on a smoothed 3x upscale, potrace per region, a fitted linear gradient per region, regions sorted into
  far / building / trees / wall / ground layers) and jump/bgdraw2.py (draws them; sky, sun glow and clouds in code).
  jump/world.py places the painting in world px for the vertical frame: grass extended below it, code tufts in
  front, tree sway (each tree shears about its trunk base), depth of field (back layers blurred together, wall a
  little, ground sharp), parallax per layer.
- Characters come as a turnaround (Gemini: front, three quarter, side on green). The side view is the motion
  capture rig (jump/side: extract.py, trace.py, model.py with a ponytail that swings on a spring about its tie);
  front and three quarter are posed models (jump/views.py: rigid traced parts with breathing, sway, head tilt,
  arm sway, blinks). Turns swap views for a few frames each (front, three quarter, side) at the rig's spot.
- Physics read off the motion itself (jump/jphys.py, Curves in short_jump.py): gravity from the flight parabola
  gives px per metre; ground force F = m(g + a) from the 8 Hz filtered centre of mass; touchdown, stop time and
  the impulse area all from the recording, so labels and graphs match what is shown.

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
