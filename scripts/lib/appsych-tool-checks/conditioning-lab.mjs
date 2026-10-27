/* Validator for psychology/data/tools/conditioning-lab.json (Conditioning lab), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. Phase 0: the frame (slug, kind, topic,
   intro, howItWorks, contexts, trademark wording); Phase 2 adds the seeded
   regeneration of every drill through the model the page runs
   (ApPsychMath.conditioningLab) and recomputes every key independently. */
import { frame } from './_drills.mjs';

export const TYPES = [];

export function check(data, map) {
  const errs = [];
  frame(data, 'conditioning-lab', 'simulator', map, errs);
  return errs;
}
