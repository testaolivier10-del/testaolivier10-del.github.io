# House style B pieces (approved 2026-10-18 with the t1018 test Shorts)

Bold flat geometric illustration, smooth gradients, warm rim light from one side, clean shapes, natural proportions. The lighting and palette change with the scene (night kitchen, daylight lab, gym, classroom); the drawing style does not. Make new pieces with pipeline/ai/lpimg.py using style_ref_bold.png or an approved scene below as the reference, then add a line here with the exact prompt.

| File | What | Used in |
|---|---|---|
| style_ref_bold.png | the style reference still (paramedic kneeling by a man, night kitchen) | every new piece |
| shotA_first.png | night kitchen, landscape crop, first frame of the original shot | t1018 pulse |
| kit_fb.png | night kitchen extended to full phone height (ceiling lamp, floor) | t1018 pulse |
| clean82_0.png, cu_fb.png | close up: his forearm palm up on the kitchen floor (core, full height) | t1018 pulse |
| L_thumb.png, L_fing.png (+ _fb full height) | paramedic's hand layers: thumb press, two fingertips on the radial pulse (transparent, aligned to cu_fb) | t1018 pulse |
| watch2_0.png | watch face, no hands (code draws hands and ring) | t1018 pulse |
| dorm_fb.png | student at a desk, dorm at night, full height | t1018 caffeine |
| syn_fb.png | synapse: nerve ending above, membrane bilayer below, full height | t1018 caffeine |
| rec.png | membrane receptor protein with a binding pocket (transparent) | t1018 caffeine |
| brain_fb.png | glowing brain in dark space, full height | t1018 caffeine |
| clips/kitA.mp4, kitB.mp4 | acting shots: paramedic checks the wrist; continues (portrait) | t1018 pulse |
| clips/cafA.mp4, cafB.mp4 | acting shots: student yawns, sips, perks up; then slumps asleep (portrait) | t1018 caffeine |

Freshness: these are parts, not scenes to repeat. A new video re-lights, re-frames or re-dresses them (video standard section 3b) and logs what it used in characters/library_log.json.

## Added 2026-10-20 (yt-nremt-35-bleeding)
| File | What | Used in |
|---|---|---|
| garage_cut.png | home garage workshop, late afternoon daylight: man with a saw cut sitting against the workbench, the paramedic (same as style_ref_bold) pressing gauze on his forearm; her hands recolored to blue nitrile gloves in code (1360x768). Prompt: "Same paramedic as in the reference image ... bright home garage workshop in late afternoon daylight ... presses a folded white gauze pad firmly onto his forearm with her gloved palm ... Exactly the same flat 2D vector illustration style as the reference image" (ref style_ref_bold.png, seed 31) | yt-nremt-35 |
| forearm_cu.png | close up of the same man's bare forearm across his thigh, gauze wrap at the wrist, no hands (1360x768). Prompt: "Close up from the same scene as the reference image, same man ... his bare left forearm rests straight and horizontal across his thigh ... A folded white gauze pad lies over a cut on the forearm just above the wrist" (ref garage_cut original, seed 57, second prompt) | yt-nremt-35 |
| nose_kitchen.png | bright morning kitchen: a teen in a green hoodie sits upright, leans forward, pinching his nose over a tissue (1360x768). Prompt: "A new scene in exactly the same flat 2D vector illustration style as the reference image ... leans his head and upper body FORWARD over a white tissue ... pinching the soft lower part of his nose" (ref garage_cut original, seed 44) | yt-nremt-35 |

| w1021/v1_room_ext.png | hospital room at night: IV pole and bag (label added in code), tubing to a patient's forearm with a catheter; extended up and down for the pan (1088x2570). Gemini (Nano Banana Pro), style ref garage_cut.png, full size download upscaled | w1021-01-iv-water |
| w1021/v1_vein_bg.png, w1021/cell0-9.png, cells.json | inside a vein: empty lumen painting plus red blood cells cut from a second painting of the same view (positions in cells.json). Gemini, style ref garage_cut.png | w1021-01-iv-water |
| w1021/v1_cell_a.png, v1_cell_swollen.png, v1_cell_burst.png | one red blood cell close up: normal disc, swollen round, burst; same framing, Gemini edits of one painting | w1021-01-iv-water |
| w1021/v2_park_bg.png, ball.png, stu_body.png, stu_arm.png | sunny park from low on the grass; student from behind looking up; body and arm separated by a no arm Gemini edit (difference mask), arm rigged on two bones with paintskin; tennis ball cut out | w1021-02-ball-top |
| w1021/v3_dash_tall.png, needle.png, cap.png | car dashboard at dusk with a big speedometer and odometer; needle and cap cut out so the needle turns; extended tall for the opening framing. Gemini, style ref garage_cut.png | w1021-03-speedometer |
