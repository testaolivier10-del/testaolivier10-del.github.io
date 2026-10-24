# Code drawn paramedic (2026-10-24): traced from the approved painting, redrawn from the skeleton every frame

Free, cloud only, no limits, no laptop. About 0.03 s a frame.
1. extract.py cuts characters/studio/paramedic/source_painting.png into design parts (head, glove, boot, patch,
   shoulder fold, collar, belt, torso) by colour and region.
2. trace2.py traces each part as flat colour shapes: k-means palette per part, potrace per colour region,
   Inkscape path simplify, eye and brow traced on their own (the eye is swapped for a lid line on blinks).
   Output traced.json (painting coordinates).
3. model.py (Paramedic, a Rig from ../partrig) hangs the traced parts on a standing skeleton and draws every frame:
   limbs are one outline each (upper and lower tube unioned, round joints), sleeves and hems end flat past the
   joint over hidden glove and boot stubs, shadow band and warm rim computed from the scene light direction,
   soft light gradient per part, far limbs tinted, contact shadows under the near limbs. The torso front line is
   designed (the painting hid it behind her arm); everything else is traced.
4. ../partrig/acting.py is the shared performance; ../partrig/render.py renders and runs the joint gap check.
   final.py: square comparison and the park scene (sun upper left). Result 2026-10-24: 0 of 540 frames with a
   joint gap (the old cut painting rig: 250 of 540).
Limits: side view only (other angles need their own traced turnaround), one glove shape, no mouth shapes yet.
