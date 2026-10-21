/* Validator for chem/data/tools/periodic-trends-pes.json (the periodic
   trends and photoelectron spectra explorer).

   The data: 118 elements in order with group, period and a ground-state
   configuration whose electrons add up to Z; every photoelectron spectrum
   (H to Kr) has one peak per occupied subshell of that configuration, the
   right electron counts, binding energies that fall from 1s outward within
   a shell, a lowest peak equal to the first ionization energy (MJ/mol vs
   kJ/mol to 3 significant figures), and 1s peaks that rise with Z (more
   protons, same distance); radii, ionization energies and electronegativities
   inside physical bounds; ionic radii with the right charges.

   The problems: SEEDS seeded problems per context, each step sound
   (_drills.mjs), and every keyed answer recomputed here from the raw data
   without the generator: the larger value of the pair, the larger ion, the
   element whose peaks add up to the electron count, the subshell of the
   asked peak, the higher 1s peak. The trend pairs must agree with the
   across/down rule (the reasoning the key states), and the key's text must
   name both atoms. */
import { runtime } from './_shared.mjs';
import { frame, sweep } from './_drills.mjs';

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  const T = M.trends;
  frame(data, 'periodic-trends-pes', 'simulator', map, errs);
  const els = data.elements || [];
  if (els.length !== 118) errs.push(`expected 118 elements, found ${els.length}`);
  const byZ = {}, bySym = {};
  els.forEach((e, i) => {
    byZ[e.z] = e; bySym[e.s] = e;
    const w = `element ${e.s || i}`;
    if (e.z !== i + 1) errs.push(`${w}: out of order (z ${e.z} at ${i + 1})`);
    if (!(e.p >= 1 && e.p <= 7)) errs.push(`${w}: period ${e.p}`);
    if (e.conf && T.electrons(e) !== e.z) errs.push(`${w}: configuration ${e.conf} has ${T.electrons(e)} electrons, not ${e.z}`);
    if (e.r != null && !(e.r >= 25 && e.r <= 300 && (e.rk === 'm' || e.rk === 'c'))) errs.push(`${w}: radius ${e.r} or kind ${e.rk}`);
    if (e.g === 18 && e.r != null) errs.push(`${w}: a noble gas has no comparable bonded radius`);
    if (e.ie != null && !(e.ie > 350 && e.ie < 2400)) errs.push(`${w}: first ionization energy ${e.ie} kJ/mol`);
    if (e.en != null && !(e.en >= 0.7 && e.en <= 4.0)) errs.push(`${w}: electronegativity ${e.en}`);
    if (e.ea != null && !(e.ea > 0 && e.ea < 360)) errs.push(`${w}: electron affinity ${e.ea}`);
    if (e.pes) {
      const conf = T.parseConf(e.conf).map(x => x[0]).sort().join(' '), pk = e.pes.map(x => x[0]).sort().join(' ');
      if (conf !== pk) errs.push(`${w}: PES subshells ${pk} differ from the configuration ${conf}`);
      const cnt = Object.fromEntries(T.parseConf(e.conf));
      e.pes.forEach(([s, be, n]) => { if (cnt[s] !== n) errs.push(`${w}: ${s} peak height ${n}, configuration ${cnt[s]}`); if (!(be > 0)) errs.push(`${w}: ${s} binding energy ${be}`); });
      for (const sh of ['1', '2', '3', '4']) {
        const s = e.pes.find(x => x[0] === sh + 's'), p = e.pes.find(x => x[0] === sh + 'p');
        if (s && p && !(s[1] > p[1])) errs.push(`${w}: ${sh}s (${s[1]}) must be above ${sh}p (${p[1]})`);
      }
      const lo = Math.min(...e.pes.map(x => x[1]));
      if (Math.abs(lo - e.ie / 1000) > 0.006 * e.ie / 1000 + 0.0005) errs.push(`${w}: lowest peak ${lo} MJ/mol is not the first ionization energy ${e.ie} kJ/mol`);
      const prev = byZ[e.z - 1];
      if (prev && prev.pes && !(e.pes[0][1] > prev.pes[0][1])) errs.push(`${w}: 1s peak must rise with Z`);
    }
  });
  for (let z = 1; z <= 36; z++) if (!(byZ[z] && byZ[z].pes)) errs.push(`no spectrum for Z = ${z}`);
  for (const x of data.ions || []) {
    const e = bySym[x.el];
    if (!e) { errs.push(`ion ${x.s}: unknown element`); continue; }
    if (x.q > 0 ? !(x.r < e.r) : !(x.r > e.r)) errs.push(`ion ${x.s}: a ${x.q > 0 ? 'cation' : 'anion'} must be ${x.q > 0 ? 'smaller' : 'larger'} than its atom (${x.r} vs ${e.r})`);
  }
  const kinds = new Set();
  sweep(data, errs, (r, c) => T.generate(r, c, els, data.ions), (p, c, w) => {
    kinds.add(c.kind);
    const pick = p.steps[0], right = pick.options[pick.correct];
    if (c.kind === 'radius' || c.kind === 'ie' || c.kind === 'en') {
      const [a, b] = p.pair.map(z => byZ[z]), key = { radius: 'r', ie: 'ie', en: 'en' }[c.kind];
      const big = a[key] > b[key] ? a : b;
      if (!right.includes(`(${big.s})`)) errs.push(`${w}: keyed ${right}, data say ${big.s}`);
      if (T.ruleSays(a, b, key) !== big) errs.push(`${w}: ${a.s}/${b.s} breaks the across/down rule the explanation states`);
      if (a.p === b.p && T.coreCount(a) !== T.coreCount(b)) errs.push(`${w}: ${a.s} and ${b.s} do not share a core`);
      const good = p.steps[1].options[p.steps[1].correct];
      if (!good.includes(a.s) || !good.includes(b.s)) errs.push(`${w}: the explanation does not name both atoms`);
      if (/want|disorder|molar mass/i.test(good)) errs.push(`${w}: the explanation uses a rejected argument`);
    } else if (c.kind === 'ie-dip') {
      const [a, b] = p.pair.map(z => byZ[z]);
      if (!(a.ie > b.ie && b.z === a.z + 1)) errs.push(`${w}: ${a.s} ${a.ie} vs ${b.s} ${b.ie} is not a dip`);
    } else if (c.kind === 'ion') {
      const ion = s => (data.ions || []).find(x => x.s === s), r = s => (ion(s) ? ion(s).r : bySym[s].r);
      const [x, y] = p.ions, big = r(x) > r(y) ? x : y;
      if (p.answer !== big) errs.push(`${w}: keyed ${p.answer}, radii say ${big}`);
      if (!right.includes(big)) errs.push(`${w}: the right option does not name ${big}`);
    } else if (c.kind === 'pes-id') {
      const e = byZ[p.el], tot = e.pes.reduce((n, x) => n + x[2], 0);
      if (tot !== e.z || !right.includes(`(${e.s})`)) errs.push(`${w}: peaks add up to ${tot}, keyed ${right}`);
      const q = p.steps[1], m = /peak at ([\d.]+) MJ/.exec(q.label), pk = e.pes.find(x => String(x[1]) === m[1]);
      if (!pk || q.options[q.correct] !== pk[0]) errs.push(`${w}: the asked peak is not keyed to its subshell`);
    } else if (c.kind === 'pes-cmp') {
      const [a, b] = p.pair.map(z => byZ[z]), hi = a.pes[0][1] > b.pes[0][1] ? a : b;
      if (hi.z !== Math.max(a.z, b.z) || !right.includes(`(${hi.s})`)) errs.push(`${w}: 1s comparison keyed ${right}`);
    }
  });
  for (const k of ['radius', 'ie', 'ie-dip', 'en', 'ion', 'pes-id', 'pes-cmp']) if (!kinds.has(k)) errs.push(`no context of kind ${k}`);
  return errs;
}
