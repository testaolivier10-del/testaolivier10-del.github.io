/* Validator for chem/data/tools/particle-diagrams.json. 300 seeded problems
   per context from ApChemMath.particles.generate (_drills.mjs), and here,
   without the generator, from the pictures themselves (each SVG's atoms
   are counted by their symbols, and its text alternative is read):
   - limiting reactant: the keyed box conserves every element from the
     "before" box, one reactant is gone and the other left over, and no
     distractor conserves atoms with the right products;
   - equilibrium: the keyed box's counts give Q = K and every distractor's
     do not; the keyed box conserves atoms;
   - acids: the keyed picture is fully ionized for a strong acid and has
     one ion pair in six for a weak acid whose exact percent ionization is
     under 17%;
   - ions in water: in the keyed picture every water molecule's oxygen is
     nearer the ion than its hydrogens for a cation, farther for an anion. */
import { runtime } from './_shared.mjs';
import { frame, sweep } from './_drills.mjs';

const SYMBOLS = /<text[^>]*>([^<]+)<\/text>/g;
function atoms(svg) {
  const n = {};
  for (const m of svg.matchAll(SYMBOLS)) { const s = m[1].replace(/[⁺⁻²]/g, ''); n[s] = (n[s] || 0) + 1; }
  return n;
}
const same = (a, b) => Object.keys({ ...a, ...b }).every(k => (a[k] || 0) === (b[k] || 0));
const alt = svg => (/aria-label="([^"]*)"/.exec(svg) || [])[1] || '';

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  frame(data, 'particle-diagrams', 'simulator', map, errs);
  const kinds = new Set();
  sweep(data, errs, (r, c) => M.particles.generate(r, c), (p, c, w) => {
    kinds.add(p.type);
    if (p.options.some(o => !/role="img"/.test(o.svg) || alt(o.svg).length < 20)) errs.push(`${w}: a picture lacks role="img" and a text description`);
    if (new Set(p.options.map(o => o.svg)).size !== p.options.length) errs.push(`${w}: two pictures are identical`);
    const key = p.options[p.correct].svg;
    if (p.type === 'limiting') {
      const before = atoms(p.extra.before), after = atoms(key);
      if (!same(before, after)) errs.push(`${w}: the keyed box does not conserve atoms (${JSON.stringify(before)} → ${JSON.stringify(after)})`);
      const reac = Object.keys(p.extra.start);
      if (reac.filter(k => p.extra.after[k] === 0).length !== 1) errs.push(`${w}: exactly one reactant must run out`);
      p.options.forEach((o, i) => { if (i !== p.correct && same(before, atoms(o.svg)) && JSON.stringify(atoms(o.svg)) === JSON.stringify(after)) errs.push(`${w}: distractor ${i} is also a correct box`); });
      const lim = p.steps.find(s => s.key === 'limiting-reactant');
      if (!lim || p.extra.after[reac[lim.correct]] !== 0) errs.push(`${w}: the limiting-reactant key is wrong`);
    }
    if (p.type === 'equilibrium') {
      const count = svg => { const a = alt(svg), g = re => +((re.exec(a) || [])[1] || 0); return { A2: g(/(\d+) A₂/), B2: g(/(\d+) B₂/), AB: g(/(\d+) AB/) }; };
      const Qof = x => (x.A2 * x.B2 ? x.AB ** 2 / (x.A2 * x.B2) : Infinity);
      const k = count(key), b = count(p.extra.before);
      if (Math.abs(Qof(k) - p.extra.K) > 1e-9) errs.push(`${w}: the keyed box gives Q = ${Qof(k)}, not K = ${p.extra.K}`);
      if (k.A2 + k.AB / 2 !== b.A2 || k.B2 + k.AB / 2 !== b.B2) errs.push(`${w}: the keyed box does not conserve atoms`);
      if (!(k.A2 > 0 && k.B2 > 0 && k.AB > 0)) errs.push(`${w}: an equilibrium box must keep every species`);
      p.options.forEach((o, i) => { if (i !== p.correct && Math.abs(Qof(count(o.svg)) - p.extra.K) < 1e-9) errs.push(`${w}: distractor ${i} is also at equilibrium`); });
    }
    if (p.type === 'acid') {
      const a = atoms(key), ions = (a['O'] || 0), molecules = (a['H'] || 0) - 3 * ions;
      const acid = (c.acids || []).find(x => p.text.includes(x.formula));
      if (!acid) { errs.push(`${w}: no acid named in the text`); return; }
      if (acid.strong && molecules !== 0) errs.push(`${w}: a strong acid picture keeps un-ionized molecules`);
      if (!acid.strong) {
        const pct = M.weakAcid(acid.c, acid.Ka).percent;
        if (!(ions === 1 && molecules === 5)) errs.push(`${w}: the weak acid picture is not one ion pair in six`);
        if (pct > 17) errs.push(`${w}: ${acid.formula} at ${acid.c} M is ${pct.toFixed(1)}% ionized; one in six overstates "mostly un-ionized"`);
        if (Math.abs(pct - p.extra.pct) > 1e-9) errs.push(`${w}: percent ionization disagrees with ApChemMath.weakAcid`);
      }
    }
    if (p.type === 'hydration') {
      const cation = /pcat/.test(key);
      const circ = [...key.matchAll(/<g class="pt-atom (\w+)"><circle cx="([\d.-]+)" cy="([\d.-]+)"/g)].map(m => ({ cls: m[1], x: +m[2], y: +m[3] }));
      const ion = circ.find(q => q.cls === 'pcat' || q.cls === 'pani');
      const mols = [...key.matchAll(/<g class="pt-mol">([\s\S]*?)<\/g><\/g>/g)].map(m => [...m[1].matchAll(/<g class="pt-atom (\w+)"><circle cx="([\d.-]+)" cy="([\d.-]+)"/g)].map(q => ({ cls: q[1], d: Math.hypot(+q[2] - ion.x, +q[3] - ion.y) })));
      if (mols.length !== 6) errs.push(`${w}: the hydration picture needs six water molecules`);
      for (const m of mols) {
        const o = m.find(q => q.cls === 'po').d, hs = m.filter(q => q.cls === 'ph').map(q => q.d);
        if (cation ? !hs.every(h => o < h) : !hs.every(h => h < o)) { errs.push(`${w}: a water molecule in the keyed picture points the wrong end at the ${cation ? 'cation' : 'anion'}`); break; }
      }
    }
  });
  for (const k of ['hydration', 'acid', 'limiting', 'equilibrium']) if (!kinds.has(k)) errs.push(`no ${k} pictures: ions in water, acids, limiting reactant and equilibrium are all required`);
  return errs;
}
