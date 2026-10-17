/* Validator for statistics/data/tools/p-value-explorer.json (p-value explorer), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It regenerates 300 problems per context and
   type with the model the page runs (ApStatMath.pValueExplorer) and then
   recomputes every key independently from the problem's data with ApStatDist
   (never through the model): the SE from p0, z, t, df, the p-value in the
   direction of Ha, the decision against alpha, the error the decision allows,
   alpha, and the power from the normal model of p-hat. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['pvalue', 'tmean', 'meaning', 'errors'];
const HA = ['greater', 'less', 'two'];

function tail(Dist, cdfAt, ha) {
  const l = cdfAt;
  return ha === 'less' ? l : ha === 'greater' ? 1 - l : Math.min(1, 2 * Math.min(l, 1 - l));
}
const step = (p, k) => p.steps.find(s => s.key === k);
const key = s => s.cell.answer;

export function recheck(p, c, w, errs) {
  const { Dist } = runtime();
  const d = p.data, bad = m => errs.push(`${w}: ${m}`);
  if (!d) return bad('no data on the problem');
  if (!HA.includes(d.ha)) bad(`unknown Ha ${d.ha}`);
  if (p.type === 'pvalue' || p.type === 'meaning' || p.type === 'errors') {
    if (!(d.x > 0 && d.x < d.n)) bad('count out of range');
    const ph = d.x / d.n, se = Math.sqrt(d.p0 * (1 - d.p0) / d.n), z = (ph - d.p0) / se, pv = tail(Dist, Dist.normCdf(z), d.ha);
    if (p.type === 'pvalue') {
      if (!close(key(step(p, 'se')), se)) bad('SE key');
      if (!close(key(step(p, 'z')), z)) bad('z key');
      if (!close(key(step(p, 'p')), pv)) bad('p-value key');
      const t = step(p, 'tail'), word = { greater: 'right', less: 'left', two: 'both' }[d.ha];
      if (!t.options[t.correct].includes(word)) bad('tail key');
      decide(p, pv, d.alpha, bad);
    }
    if (p.type === 'meaning') {
      if (!close(d.given, pv)) bad('given p-value');
      const s = step(p, 'shade');
      if (s.pics.list[s.correct] !== d.ha) bad('shade key');
      const m = step(p, 'meaning');
      if (!/^Assuming/.test(m.options[m.correct]) || !m.options[m.correct].includes(String(d.p0))) bad('meaning key does not assume H0');
    }
    if (p.type === 'errors') {
      const reject = pv < d.alpha, wh = step(p, 'which');
      if (!wh.options[wh.correct].startsWith(reject ? 'A Type I' : 'A Type II')) bad('which error key');
      if (!close(key(step(p, 'pI')), d.alpha)) bad('P(Type I) key');
      const zs = Dist.invNorm(d.ha === 'two' ? 1 - d.alpha / 2 : 1 - d.alpha), sdA = Math.sqrt(d.pa * (1 - d.pa) / d.n);
      const hi = d.p0 + zs * se, lo = d.p0 - zs * se;
      const power = d.ha === 'greater' ? 1 - Dist.normCdf((hi - d.pa) / sdA) : d.ha === 'less' ? Dist.normCdf((lo - d.pa) / sdA)
        : Dist.normCdf((lo - d.pa) / sdA) + 1 - Dist.normCdf((hi - d.pa) / sdA);
      if (!close(d.beta, 1 - power, 1e-9, 1e-12)) bad(`beta ${d.beta} vs ${1 - power}`);
      if (Math.abs(key(step(p, 'power')) - (1 - Math.round((1 - power) * 1e4) / 1e4)) > 1e-9) bad('power key');
      if (d.ha === 'less' ? d.pa >= d.p0 : d.pa <= d.p0) bad('true value is not in the direction of Ha');
      const t1 = step(p, 'typeI');
      if (!t1.options[t1.correct].startsWith('The true proportion') || !t1.options[t1.correct].includes(`is ${d.p0}, but`)) bad('Type I key lacks the conditional clause');
    }
  } else if (p.type === 'tmean') {
    const se = d.s / Math.sqrt(d.n), t = (d.xbar - d.mu0) / se, df = d.n - 1, pv = tail(Dist, Dist.tCdf(t, df), d.ha);
    if (key(step(p, 'df')) !== df) bad('df key');
    if (!close(key(step(p, 't')), t)) bad('t key');
    if (!close(key(step(p, 'p')), pv)) bad('p-value key');
    decide(p, pv, d.alpha, bad);
  } else bad(`unknown type ${p.type}`);
}
function decide(p, pv, alpha, bad) {
  const reject = pv < alpha, dc = step(p, 'decide'), cc = step(p, 'conclude');
  if (Math.abs(pv - alpha) < 0.01) bad('p-value too close to alpha');
  const dk = dc.options[dc.correct];
  if (reject ? !/, reject \$H_0\$/.test(dk) : !/fail to reject/.test(dk)) bad('decision key');
  if (!dk.includes(reject ? 'less' : 'greater')) bad('decision inequality');
  const ck = cc.options[cc.correct];
  if (!ck.startsWith(reject ? 'There is convincing evidence that the true' : 'There is not convincing evidence that the true')) bad('conclusion key');
}

export function check(data, map) {
  const errs = [];
  frame(data, 'p-value-explorer', 'simulator', map, errs);
  const { model, M } = runtime('p-value-explorer');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/p-value-explorer.js does not register ApStatMath.pValueExplorer with a generate()'); return errs; }
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  for (const s of (data.explore && data.explore.scenarios) || []) {
    const r = model.test(s);
    if (!Number.isFinite(r.p) || !Number.isFinite(r.stat)) errs.push(`scenario ${s.id}: no finite p-value`);
  }
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  void M;
  return errs;
}
