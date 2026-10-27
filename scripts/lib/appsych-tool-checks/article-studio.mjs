/* Validator for psychology/data/tools/article-studio.json (Article analysis studio), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. Phase 0: the frame (slug, kind, topic,
   intro, howItWorks, contexts, trademark wording); Phase 2 adds the seeded
   regeneration of every drill through the model the page runs
   (ApPsychMath.articleStudio) and recomputes every key independently. */
import { frame } from './_drills.mjs';

export const TYPES = [];

export function check(data, map) {
  const errs = [];
  frame(data, 'article-studio', 'simulator', map, errs);
  return errs;
}
