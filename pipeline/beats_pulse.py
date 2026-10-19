PULSE = [
 dict(key="hook", vo="Checking a radial pulse with your thumb? {1}You might be counting your own heartbeat.",
      disp="Checking a radial pulse with your thumb? You might be counting your own heartbeat."),
 dict(key="why", vo="Your thumb has a pulse of its own {1}that's easy to feel. {2}Press with it, and you might feel your own pulse {3}instead of his.",
      disp="Your thumb has a pulse of its own that's easy to feel. Press with it, and you might feel your own pulse instead of his."),
 dict(key="fix", vo="So use the tips of two fingers, {1}usually your index and middle. {2}Put them on the thumb side of his wrist. {3}That's where the radial artery is. {4}Keep the pressure light. {5}Push too hard, and you'll squash it flat.",
      disp="So use the tips of two fingers, usually your index and middle. Put them on the thumb side of his wrist. That's where the radial artery is. Keep the pressure light. Push too hard, and you'll squash it flat."),
 dict(key="count", vo="If it's steady, count thirty seconds and double it. {1}If it's irregular, though, count the whole minute. {2}A short count misses skipped beats, {3}and doubling it doubles the error.",
      disp="If it's steady, count 30 seconds and double it. If it's irregular, though, count the whole minute. A short count misses skipped beats, and doubling it doubles the error."),
 dict(key="ask", vo="His pulse is forty eight, and it keeps skipping. {1}How long do you count?",
      disp="His pulse is 48, and it keeps skipping. How long do you count?"),
 dict(key="end", vo="", disp=""),
]
MOTIONS = """
hook: AI shot (style B night kitchen): paramedic kneels by a man lying on his back, two fingers resting on the thumb side of his
  upturned wrist, she leans in and glances at his face, he breathes. On "thumb" a round lens grows out of the wrist spot.
switch: the kitchen scene shrinks into a round corner inset (the paramedic keeps moving inside it); the lens becomes the full
  close up: his forearm palm up, thumb side at the top, the radial artery shown through a soft see-through window in the skin
  near the thumb side of the wrist, blood inside as shaded liquid that swells with each of his beats (about 75 a minute, steady).
why: the paramedic's thumb pad presses on his wrist; a second artery inside her thumb pad glows and swells on HER rhythm
  (a different, slightly faster rate, about 90 a minute), out of step with his; two beat markers show the two rhythms mixing.
fix: the thumb lifts away; her index and middle fingertips land side by side on the thumb side of his wrist over the radial
  artery; each of his beats sends a soft ripple under both fingertips. "Too hard": fingers press down, the artery under them
  flattens and the flow stops; fingers ease up, the artery rounds out and flow returns.
count: a watch face (same style) beside the wrist; the second hand sweeps 30 s while a counter adds one per beat (regular),
  then x2. Irregular: the pulse rhythm gets gaps (dropped beats); the hand keeps going to a full 60 s ring.
ask: the inset grows back into the full kitchen scene (AI shot B continues the same moment); the question appears.
"""
