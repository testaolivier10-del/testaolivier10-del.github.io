# Real human motion for the code drawn characters (2026-10-24)
Olivier asked for better human movement. Characters are now driven by real motion capture (free CMU library,
mocap.py downloads takes from una-dinosauria/cmu-mocap; any use allowed), not hand written rules.
- side.py: side view of a take, aligned to the body's facing (a figure facing right shows its LEFT side).
- mocap_perf.py MocapPerformer: trunk and head relative to the actor's standing posture applied to hers; arm
  angles from the actor; hands continue the forearm (CMU hand markers are unreliable); root from the actor's hips
  scaled by leg length; legs by 2 bone IK to his ankles; planted feet locked where they land (no sliding);
  takes blend with eased weights; 'upper' layers (a wave) drive only trunk, head and arms while legs keep standing.
- Takes used: 82_08 (standing idle), 141_16 (wave hello, actor's right arm = her near arm, skip 0.25 s T pose),
  104_19 (casual walk from standing; near = actor's right, whose calf pushes off first, at about 1.65 s).
  Avoid 82_08 for walking (forearms held up). Measure candidate walks with knee and elbow bend before using.
- model.py draws with NO boolean path ops now (they failed at some sizes and positions and dropped pieces):
  limbs are winding fills of overlapping tubes, shadow bands, rim light and x-ray outline are cut in pixel
  layers, belt and cuffs are clipped. stress.py: 1,152 drawings at random sizes and positions, 0 breaks.
