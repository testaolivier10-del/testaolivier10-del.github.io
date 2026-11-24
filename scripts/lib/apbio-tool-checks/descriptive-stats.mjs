/* Validator for bio/data/tools/descriptive-stats.json. Descriptive statistics: mean, median, range, sample SD (n − 1) and SE.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'descriptive-stats', 'descriptive', map, errs);
  for (const c of data.contexts || []) if (!(c.n && c.n[0] >= 3)) errs.push(`context ${c.id}: n must be at least 3 (an SD needs n − 1 ≥ 2)`);
  for (const p of data.problems || []) {
    const v = p.input.values || [];
    if (v.length < 3) errs.push(`problem ${p.id}: at least three values`);
    // the sample SD, independently: Σ(x − x̄)² / (n − 1)
    const m = v.reduce((a, b) => a + b, 0) / v.length, s = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1));
    if (Math.abs(s - M.sd(v)) > 1e-9) errs.push(`problem ${p.id}: ApBioMath.sd is not the n − 1 sample SD`);
  }
  // Explore (tools v2): the plants it opens on and can sow are real heights within the board, 3 to 10 of them
  const ex = data.explore;
  if (!ex) errs.push('explore: missing');
  else {
    const hs = ex.heights || [];
    if (hs.length !== ex.maxN) errs.push(`explore: ${hs.length} heights for at most ${ex.maxN} plants`);
    if (!(ex.minN >= 3 && ex.open >= ex.minN && ex.open <= ex.maxN && ex.maxN <= 10)) errs.push('explore: 3 <= minN <= open <= maxN <= 10');
    for (const h of hs) if (!(h >= ex.min && h <= ex.max && Math.abs(h * 10 - Math.round(h * 10)) < 1e-9)) errs.push(`explore: height ${h} outside ${ex.min} to ${ex.max} cm or not to 0.1 cm`);
    if (!(ex.max < ex.ruler)) errs.push('explore: the tallest plant must fit the board');
    const o = hs.slice(0, ex.open), m = o.reduce((a, b) => a + b, 0) / o.length, srt = o.slice().sort((a, b) => a - b);
    const med = o.length % 2 ? srt[(o.length - 1) / 2] : (srt[o.length / 2 - 1] + srt[o.length / 2]) / 2;
    if (Math.abs(m - M.mean(o)) > 1e-9 || Math.abs(med - M.median(o)) > 1e-9) errs.push('explore: the opening mean or median disagrees with ApBioMath');
    for (const g of ex.goals || []) if (!g.id || !g.text) errs.push('explore: a goal without id or text');
    if (/\u2014|\s-\s/.test(JSON.stringify(ex))) errs.push('explore: a dash used as punctuation');
  }
  return errs;
}
