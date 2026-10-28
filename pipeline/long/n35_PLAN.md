# yt-nremt-35-bleeding rebuild on the code drawn studio (status file)

STATUS 2026-10-28: DONE and sent to Olivier for review (long/queue.json status "pending", review fingerprint ec244a063f7f).
Finished 13:38 (estimate 13:47 before voicing). Voice: Jeremy, all chapters re-voiced (about 4,600 credits).

## What was built
- Look: flat layered (video standard 0). 7 new Gemini plates in characters/flat/n35 (garage, forearm close up and the
  gloved hand layer, lengthwise arm, cross section rotated so the radius is on top, kitchen, body map, wound block).
- People: traced paramedic (kneeling, CMU 23_03) and the hoodie man as the patient (CMU 13_04 seated, mirrored), arms
  by IK; kitchen: same man, head and trunk keyed, IK hand to the nose. Patient scaled 0.88 vs her 0.757 (his rig is
  drawn about 8% shorter; Olivier said he looked too small).
- Liquids: studio liquid.py sims (hook, arterial, venous, capillary, slap, peel, windlass, garage wide).
- One skia renderer for the whole video (pipeline/long/n35_scenes: core, wide, closeup, diag, s_*.py per chapter,
  build.py seg f0 f1 out, splice.py, mix.py). engine_long only for timing (plan), captions and chapters.
- Checks: animation accuracy check (armpit rings, radius artery, pinch labels, neck dressing side, tourniquet gap, packing
  reaches the bleed, all fixed), two fresh eyes passes, transcript 99.9%, motion QC (remaining FROZEN flags are calm
  teaching, pause timers, recap and practice; JUMPs are chapter cards and planned cuts), shots.json passes.
- Thumbnail: thumb.png = garage with the tourniquet close up (concept 3), b = garage pair, c = forearm.
