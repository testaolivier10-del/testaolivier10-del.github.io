/* Ochem bank notation stays normalized.

   Audit finding (site audit 2026-10, "Bank notation"): 678 items wrote
   formulas as H2SO4, 267 used subscripts, 14 mixed both; charges were typed
   as "RCOO^-"; "Huckel" sat beside "Hückel"; stray double spaces. All of it
   was rewritten by scripts/normalize-ochem-notation.mjs, and this rule runs
   the same normalizer over the same files and fails on any string it would
   still change. Fix: node scripts/normalize-ochem-notation.mjs */
import { findIssues } from '../normalize-ochem-notation.mjs';

export default function({ ROOT, fail }){
  const issues = findIssues(ROOT);
  for(const x of issues.slice(0, 10)){
    fail(`ochem notation: ${x.file}: "${x.before.slice(0, 80)}" should read "${x.after.slice(0, 80)}" ` +
         '(run node scripts/normalize-ochem-notation.mjs)');
  }
  if(issues.length > 10) fail(`ochem notation: ${issues.length - 10} more string(s) not normalized`);
}
