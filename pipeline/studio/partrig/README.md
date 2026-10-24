# Part rig engine (2026-10-24, test 1 of the free animation research)

Python, CPU only, no limits: skia textured meshes, angle blended skinning around each joint, fixed length 2 bone IK
with planted feet (heel strike, toe roll), follow through springs on world angles, and a joint gap checker that runs
on every frame. acting.py holds ONE shared performance (idle, point with anticipation and overshoot, wave, walk away)
authored in world angles and scaled by each rig's leg length, so two rigs can be compared fairly.

- char_runner.py: control A, the fire scene runner cut out of one finished bent painting (the old method).
- render.py: `python3 render.py char_runner out.mp4` renders 9 s at 60 fps and prints the gap report.
- Next: char_paramedic_sheet.py, built from a Gemini rig pose set (full figure, then no near limbs, then torso only,
  all side view on flat green, limbs straight), so limbs are continuous and bend from straight.
