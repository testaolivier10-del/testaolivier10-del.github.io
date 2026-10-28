# yt-nremt-35-bleeding rebuild on the code drawn studio (status file)

STATUS 2026-10-27 ~5pm PT (long video build run): queue item set to "building". Steps 0 to 5 done: ElevenLabs
balance 66,895 (reset Nov 6), human read pass for the connected talking rule applied (15 beats reworded, facts
unchanged), pronunciation clean, runtime estimate 13:47, first minute story check PASSED
(pipeline/long/n35_story.json). STOPPED at step 6 (art): the laptop dropped off (Chrome extension and device
bridge both unreachable) after the first Gemini scene. Rerun continues at step 6 with this plan.
Voice: the 10-20 voice files were never kept and the narrator is now Jeremy, so voice_all.py voices every
chapter (about 10,700 credits).

## Look and cast (decided this run, from the docs)
- House look is FLAT LAYERED (video standard 0, 2026-10-25); prompt core in characters/flat/README.md, reference
  upload: characters/flat/w1025/b_court_wide.jpg. The style B kit pieces (forearm_artery_bone, blood_cells) are NOT
  mixed in; their subjects are repainted flat.
- People: the traced cast. Paramedic (codechar/model.py, faces right natively) kneels on the LEFT facing right
  (CMU 23_03, subject B kneels and reaches forward, about 1.2 to 4.3 s). Patient = hoodie runner (runner/model.py)
  MIRRORED to face left, seated on the step stool (CMU 13_04 sit on stepstool, about 18 to 22 s seated), his
  right (near) forearm held out to her; her hands by rig.ik2 onto his forearm. Both pass the real motion check
  before use (perf.repair, ptest, stress 0 breaks), else keyed simply.
- Pipeline: engine_long for timing, cards, pause timers, calm teaching (handwriting), captions, chapters and the
  audio mix; every story and painted process shot is a skia clip (like pipeline/w1025/build/*/build.py, 1920x1080)
  laid over its time range with ffmpeg overlay after render_long (clips draw the chapter header pill themselves).

## Art (Gemini Thinking, gemini.google.com/u/2/app; chat "Garage Vector Illustration at Dusk")
Done: g_garage.png (characters/flat/n35/): garage at dusk, workbench and miter saw left, pegboard, lamp, open
door right with an ambulance (lights glow; animate in code), empty floor, dark blue step stool at centre.
To do (all 16:9, no people unless said, no text):
1. forearm close up (requested, image generated but not captured): side view, his hand on the LEFT palm up,
   grey hoodie sleeve at the elbow on the right, clean skin, garage out of focus. Wound, blood (liquid.py),
   gauze, tourniquet drawn in code in the flat style.
2. same framing WITH a blue gloved hand pressing a white gauze pad near the wrist (split the hand layer by
   difference after phase alignment).
3. forearm lengthwise cutaway diagram (skin, yellow fat, red muscle, ivory radius and ulna, artery bright red,
   vein dark red; soft blue background): vessels inpainted out and redrawn in code so they can pinch and flow
   (p1, p2 clot, w4 mechanism, why lens).
4. forearm cross section diagram (round cut, same colours): s1 push toward bone, s3 gauze stack, s4 wrap.
5. kitchen in daylight with a table and chair (nosebleed: patient seated, leans forward, pinches).
6. front view body map on soft blue (skin tone figure, arteries bright red): junctional areas, high and tight,
   q2 knee, chest, belly and neck.
7. deep wound cavity cutaway in the thigh (packing: gauze fed in by code).
Calm teaching background: g_garage blurred and darkened (same world).

## Scene plan (what each beat shows)
hook/promise/why: story.json. read: forearm close up with arterial spurt, venous flow, capillary ooze (liquid
presets); r3 jugs as code liquid containers over the calm background; r4 back in the garage. press: lengthwise
diagram. steps: cross section plus handwriting. nose: kitchen clip. tq: garage clip, then a code drawn windlass
tourniquet with the three parts named. place: close up with the tourniquet on the forearm a few inches toward the
elbow; w2 and q2 on the body map; w4 lengthwise diagram mechanism. after: close up, the time written on the tag by
hand. pack: body map then the cavity cutaway. recap: one picture. practice: calm background with small pictures.
outro: garage wide.
