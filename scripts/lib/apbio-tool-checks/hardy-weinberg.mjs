/* Validator for bio/data/tools/hardy-weinberg.json. Hardy-Weinberg (built now, published with Unit 7).
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect".
   Tools v2 (docs/tools-v2-hardy-weinberg-brief.md): the Explore bed and the "Set the alleles" targets are checked
   against the equations: every plant is a whole plant at every stop, and each target's answers are exactly the
   stops that give the share it asks for. */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M } = skills(data, 'hardy-weinberg', 'hw', map, errs);
  const h = M.hwCounts(36, 48, 16);
  if (Math.abs(h.p - 0.6) > 1e-12 || Math.abs(h.pq2 - 0.48) > 1e-12) errs.push('ApBioMath.hwCounts is wrong for 36 AA, 48 Aa, 16 aa (p must be 0.6, 2pq 0.48)');
  const ex = data.explore;
  if (!ex) { errs.push('hardy-weinberg: no explore block'); return errs; }
  const N = ex.side;
  if (!Number.isInteger(N) || N < 2) errs.push('hardy-weinberg explore: side must be a whole number of plants');
  const n0 = ex.p * N;
  if (Math.abs(n0 - Math.round(n0)) > 1e-9) errs.push('hardy-weinberg explore: the opening p is not a stop of the bed');
  if (!ex.A || !ex.a || ex.A === ex.a) errs.push('hardy-weinberg explore: two different allele letters are needed');
  if (!Array.isArray(ex.phen) || ex.phen.length !== 3) errs.push('hardy-weinberg explore: phen needs the three phenotypes');
  if (!ex.purpose || ex.purpose.split(/\s+/).length > 10) errs.push('hardy-weinberg explore: the purpose line is missing or over 10 words');
  // the shares in percent of the bed at stop n, from the equations
  const share = (n) => { const p = n / N, q = 1 - p; return [p * p, 2 * p * q, q * q].map((f) => Math.round(f * 1e6) / 1e4); };
  for (let n = 0; n <= N; n++) {
    const s = share(n), plants = s.map((x) => x * N * N / 100);
    if (plants.some((x) => Math.abs(x - Math.round(x)) > 1e-6) || Math.abs(plants[0] + plants[1] + plants[2] - N * N) > 1e-6) errs.push(`hardy-weinberg explore: at p = ${n / N} the bed does not hold whole plants`);
  }
  const ids = new Set();
  (data.targets || []).forEach((t) => {
    const at = `hardy-weinberg target ${t.id}`;
    if (!t.id || ids.has(t.id)) errs.push(`${at}: missing or repeated id`);
    ids.add(t.id);
    if (t.sp && (t.sp !== 'pea' || !data.pea)) errs.push(`${at}: sp must be "pea" with a pea block in the data`);
    if (t.sp === 'pea' && t.geno !== 2) errs.push(`${at}: a pea target asks for the recessive (white) share, the one class that can be seen`);
    if (![0, 1, 2].includes(t.geno)) errs.push(`${at}: geno must be 0, 1 or 2`);
    if (!t.ask || !t.hint || !t.why) errs.push(`${at}: ask, hint and why are all needed`);
    const want = [];
    for (let n = 0; n <= N; n++) if (Math.abs(share(n)[t.geno] - t.pct) < 1e-6) want.push(n);
    const got = (t.p || []).map((p) => Math.round(p * N)).sort((a, b) => a - b);
    if (!want.length) errs.push(`${at}: no stop of the bed gives ${t.pct}%`);
    else if (want.join(',') !== got.join(',')) errs.push(`${at}: p must be ${want.map((n) => n / N).join(' or ')} for ${t.pct}%, the data say ${(t.p || []).join(' or ')}`);
    if (!String(t.ask).includes(t.pct + '%') && t.id !== 'het') errs.push(`${at}: the question does not name ${t.pct}%`);
  });
  if (data.pea && (!data.pea.A || !data.pea.a || !Array.isArray(data.pea.phen) || data.pea.phen.length !== 3 || data.pea.phen[0] !== data.pea.phen[1] || data.pea.phen[2] === data.pea.phen[0])) errs.push('hardy-weinberg pea: complete dominance needs AA and Aa with one phenotype and aa with another');
  if (!(data.targets || []).some((t) => t.sp === 'pea')) errs.push('hardy-weinberg: no target meets a hidden recessive (carriers) on the pea bed');
  if (!(data.targets || []).length) errs.push('hardy-weinberg: no targets for Test yourself');
  return errs;
}
