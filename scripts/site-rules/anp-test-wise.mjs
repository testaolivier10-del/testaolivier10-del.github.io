/* Test-wise guessing must not pay in the A&P bank.

   Guards the audit 2026-10 A&P row "Select-all and predict items": select-all
   items always had 2+ right answers (61% of options right), "no change" was
   the key for only 13% of predict variables, and distractors used absolutes
   (always, never, only, cannot...) about twice as often as keys. The first
   rebalancing passes moved each number to target (50% of select-all options
   correct, about 20% "no change" keys, absolutes no more common in distractors
   than in keys); these limits hold the bank there so it cannot drift back.
   "all-or-none" is a term, not an absolute, so it is not counted. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LIMITS = {
  multiShare: 0.50,        // share of select-all options that are correct, at most
  multiMaxFraction: 2 / 3, // no single select-all item above this share correct
  singleKeyMulti: 4,       // select-all items with exactly one correct option, at least
  noneShare: 0.20,         // share of predict variables keyed "no change", at least
  distractorAbsolutes: 0.024, // share of distractors with an absolute word, at most (and never above the keys' share)
};
const ABS = /\b(always|never|only|all|none|every|completely|entirely|must|cannot)\b/i;
const hasAbs = (s) => ABS.test(s.replace(/all-or-none/gi, ''));

export default function anpTestWise({ ROOT, fail }) {
  const dir = join(ROOT, 'anatomy-physiology', 'data', 'questions');
  if (!existsSync(dir)) return;
  const all = readdirSync(dir).filter((f) => f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  let opts = 0, keys = 0, single = 0;
  for (const q of all.filter((x) => x.type === 'multi')) {
    opts += q.options.length; keys += q.correct.length;
    if (q.correct.length === 1) single++;
    if (q.correct.length / q.options.length > LIMITS.multiMaxFraction + 1e-9) fail(`A&P ${q.id}: ${q.correct.length} of ${q.options.length} select-all options are correct (at most two thirds)`);
  }
  if (keys / opts > LIMITS.multiShare) fail(`A&P select-all items: ${(100 * keys / opts).toFixed(1)}% of options are correct (limit ${100 * LIMITS.multiShare}%)`);
  if (single < LIMITS.singleKeyMulti) fail(`A&P select-all items with one correct option: ${single} (at least ${LIMITS.singleKeyMulti})`);
  let vars = 0, none = 0;
  for (const q of all.filter((x) => x.type === 'predict')) for (const v of q.variables) { vars++; if (v.answer === 'none') none++; }
  if (none / vars < LIMITS.noneShare) fail(`A&P predict items: "no change" keys ${(100 * none / vars).toFixed(1)}% of variables (at least ${100 * LIMITS.noneShare}%)`);
  let d = 0, dAbs = 0, k = 0, kAbs = 0;
  for (const q of all.filter((x) => x.options && x.type !== 'order' && x.type !== 'predict')) {
    const key = [].concat(q.correct);
    q.options.forEach((o, i) => { if (key.includes(i)) { k++; if (hasAbs(o)) kAbs++; } else { d++; if (hasAbs(o)) dAbs++; } });
  }
  if (dAbs / d > LIMITS.distractorAbsolutes) fail(`A&P distractors with absolute words: ${(100 * dAbs / d).toFixed(1)}% (limit ${100 * LIMITS.distractorAbsolutes}%)`);
  if (dAbs / d > kAbs / k) fail(`A&P absolute words are more common in distractors (${(100 * dAbs / d).toFixed(1)}%) than in keys (${(100 * kAbs / k).toFixed(1)}%)`);
}
