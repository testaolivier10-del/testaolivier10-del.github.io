# Hoodie runner (code drawn, traced) and the sprint lean Short

Built 2026-10-24 in a chat with Olivier (topic picked: sprint lean physics, AP Physics 1; voice Jeremy for this Short only).

- src.png: the approved painting (sci/art/fire/g_runner_rig.png, the grey hoodie man from the burning building scene).
- extract.py cuts it into parts (head, fist, shoe, hoodie details, hem, drawstrings); trace.py traces each part into flat colour
  layers (k-means, potrace, Inkscape simplify); the head merges the painting's cold face light into warm skin and tags brow,
  eye, eye white and mouth (blinks swap eye and eye white for a lid line). Output traced.json.
- model.py: class Runner (same method as codechar/model.py: winding filled limb tubes, sleeve cuffs, rolled jeans hems
  with a seam line, per frame shadow band, warm fire rim from the light (-0.86, -0.5), far side tinted). build() gives
  rig, spec, joints, radius for mocap_perf.MocapPerformer.
- perf.py: the run, all real motion capture: CMU 104_55 (StartRun) from standing through the leaning launch, phase
  matched crossfade at 104_55 2.86 s into 09_01 0.365 s (steady run), 09_01 looped on a matched stride (0.305 to 1.045 s).
  repair() fixes marker glitches (leg acceleration spikes rebuilt from clean frames; foot angle kept anatomical).
  extra_m() carries the launch lean out over 0.85 s after the switch and adds 4 degrees forward to 09_01 (its rest
  posture was measured while running).
- phys.py: centre of mass from segment masses (Winter). bg.py: the burning street as a vertical world (plate x1.6,
  animated flames, embers; far layer can slide for parallax; sidewalk continues as a seamless repeat).
- short_sprint.py builds the Short (python3 short_sprint.py --words <words.json> --out <mp4>); every cue keys to a word
  (timing.py: ElevenLabs alignment, or an estimate until the voice exists). mix.py makes the sound (fire bed, steps,
  UI sounds, rewind, music bed ducked under the voice, -14 LUFS).
- Checks passed: rig stress test 0 breaks; joint pop scan clean after repair; story check passed (story_sprint_lean.json).
