/* Site audit 2026-10, NREMT course: about 28 distractors (70 once searched
   for properly) carried a clause admitting they were wrong — "..., a view
   that is not supported by current guidelines", "..., a step that puts
   rescuers at risk" — left over from padding distractors to the key's length.
   A student learns that an option arguing against itself is never the
   answer. This fails the build on any non-key option that does it.

   The patterns are the self-refuting forms found in the bank, not every
   trailing clause: a distractor may still carry a false reason ("..., since
   faster breathing means more oxygen"), which is a fair near-miss. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SELF_REFUTING = [
  /not supported by (?:current|the current|any)/i,
  /\b(?:a|an|the) (?:common|dangerous|widespread) (?:but dangerous )?misconception\b/i,
  /based on a common misconception/i,
  /left over from outdated/i,
  /\boutdated (?:training|teaching|guidance)\b/i,
  /,\s*a (?:view|claim|belief|conclusion|status|request|habit|placement|definition|mechanism|finding|pattern|technique|method|step|detail|rate|list|maneuver|sign|shortcut|delay|level of detail|test|fixed rule|position|burn|concern|factor|purpose|explanation|side effect|minor benefit)\b[^,]*\b(?:not|no|never|little|less|far|without|missing|misstates|unrelated|rather than|does not|do not|cannot|risks|puts|leaves|skips|worsen|delays|best reserved|often (?:confused|assumed))\b/i,
  /,\s*an? (?:approach|explanation|assumption|interval)\b[^,]*\b(?:leaves|can miss|far less|not|works well)\b/i,
  /\beven though (?:this|that|the patient|it) (?:is|can|has|was|does)\b/i,
  /does not actually (?:represent|support|have)/i,
];

export default function ({ ROOT, fail }) {
  const bank = JSON.parse(readFileSync(join(ROOT, 'nremt/assets/questions.json'), 'utf8'));
  for (const q of bank) {
    if (q.type === 'order') continue;
    const keys = Array.isArray(q.correct) ? q.correct : [q.correct];
    q.options.forEach((o, i) => {
      if (keys.includes(i)) return;
      const hit = SELF_REFUTING.find((re) => re.test(o));
      if (hit) fail(`nremt/assets/questions.json: question ${q.id}, option ${i} argues against itself ("${o.slice(0, 90)}"). Move the reasoning into the explanation.`);
    });
  }
}
