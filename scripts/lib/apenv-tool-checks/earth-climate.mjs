/* Validator for environmental-science/data/tools/earth-climate.json (Earth and climate), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. The frame, the explore settings, then 300
   problems per context and type regenerated with the model the page runs
   (ApEnvMath.earthClimate) and every key recomputed independently from the
   problem's givens with ApEnvCalc and plain arithmetic (never through the
   model): the noon sun angle, the day-length direction, the season from the
   tilt (never the distance), the cell and the wind for a latitude, the rain
   shadow temperatures (10 and 6 °C per km), and the Niño 3.4 average and
   NOAA's ±0.5 °C call. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['sun', 'seasons', 'cells', 'shadow', 'enso'];
const step = (p, k) => p.steps.find(s => s.key === k);
const unitKey = s => s.cell.numeric.answer;
const right = s => String(s.options[s.correct]).replace(/<[^>]+>/g, ' ');

export function recheck(p, c, w, errs) {
  const { Calc, M } = runtime();
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const setupVal = k => { const s = step(p, k); const r = M.evaluate(s.cell.setup.answer, {}, []); return r.ok ? r.value : NaN; };
  if (p.type === 'sun') {
    const ang = Calc.evaluate({ fn: 'sub', args: [90, Math.abs(g.lat - g.decl)] });
    if (!close(unitKey(step(p, 'angle')), ang)) bad(`angle key ${unitKey(step(p, 'angle'))} vs ${ang}`);
    if (!close(setupVal('setup'), ang)) bad('the setup does not give the angle');
    if (!(ang > 0 && ang <= 90)) bad('the sun must be up at noon in a drill');
    const dl = right(step(p, 'day'));
    const want = g.decl === 0 || g.lat === 0 ? /^About 12/ : (g.lat > 0) === (g.decl > 0) ? /^Longer/ : /^Shorter/;
    if (!want.test(dl)) bad(`day length key "${dl}"`);
    if (!/^(Less|The same)/.test(right(step(p, 'spread')))) bad('spread key');
  } else if (p.type === 'seasons') {
    const nh = g.month === 6, summer = nh === (g.lat > 0);
    if (summer !== g.summer) bad('season given');
    if (!right(step(p, 'season')).startsWith(summer ? 'Summer: this hemisphere is tilted toward' : 'Winter: this hemisphere is tilted away')) bad('season key');
    if (!/tilted 23\.5/.test(right(step(p, 'cause')))) bad('cause key must be the tilt');
    if (/closer|farther/.test(right(step(p, 'why')))) bad('why key must not be the distance');
  } else if (p.type === 'cells') {
    const A = Math.abs(g.lat), N = g.lat >= 0;
    const cell = A < 30 ? 'Hadley' : A < 60 ? 'Ferrel' : 'Polar';
    const wind = A < 30 ? (N ? 'Northeast trade' : 'Southeast trade') : A < 60 ? 'Westerlies' : 'Polar easterlies';
    if (!right(step(p, 'cell')).startsWith(cell)) bad(`cell key for ${g.lat}`);
    if (!right(step(p, 'wind')).startsWith(wind)) bad(`wind key for ${g.lat}: "${right(step(p, 'wind'))}"`);
    const v = (A < 10 || (A > 50 && A < 70)) ? 'rise' : ((A > 20 && A < 40) || A > 80) ? 'sink' : '';
    if (v) {
      if (!right(step(p, 'air')).startsWith(v === 'rise' ? 'It rises' : 'It sinks')) bad('air key');
      if (!right(step(p, 'climate')).startsWith(v === 'rise' ? 'Wet' : 'Dry')) bad('climate key');
    } else if (step(p, 'air')) bad('no vertical motion here, but an air step');
  } else if (p.type === 'shadow') {
    const top = g.T0 - 10 * g.hc - 6 * (g.H - g.hc), lee = top + 10 * g.H;
    if (!close(unitKey(step(p, 'top')), top)) bad(`summit key ${unitKey(step(p, 'top'))} vs ${top}`);
    if (!close(unitKey(step(p, 'lee')), lee)) bad(`far side key vs ${lee}`);
    if (!close(setupVal('setup'), top) || !close(setupVal('setup2'), lee)) bad('a setup does not give its key');
    if (!(lee > g.T0)) bad('the far side must be warmer');
    if (!right(step(p, 'desert')).includes('rain shadow')) bad('desert key');
  } else if (p.type === 'enso') {
    const mean = g.vals.reduce((a, b) => a + b, 0) / 3;
    if (!close(step(p, 'mean').cell.answer, mean, 1e-9, 1e-9)) bad('mean key');
    if (!close(setupVal('setup'), mean, 1e-9, 1e-9)) bad('setup value');
    const st = mean >= 0.5 ? 'nino' : mean <= -0.5 ? 'nina' : 'neutral';
    if (st !== g.state) bad(`state ${g.state} but the mean ${mean} says ${st}`);
    if (Math.abs(Math.abs(mean) - 0.5) < 0.1) bad('the mean is too close to the threshold to call');
    if (!right(step(p, 'state')).startsWith({ nino: 'El Niño', nina: 'La Niña', neutral: 'Neutral' }[st])) bad('state key');
    const e = step(p, 'effect');
    if (st === 'nino' && !/weaken/.test(right(e))) bad('El Niño effect key');
    if (st === 'nina' && !/strengthen/.test(right(e))) bad('La Niña effect key');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'earth-climate', 'simulator', map, errs);
  const { model } = runtime('earth-climate');
  if (!model || typeof model.generate !== 'function' || model.stub) { errs.push('environmental-science/assets/tools/math/earth-climate.js does not register ApEnvMath.earthClimate with a generate()'); return errs; }
  const X = data.explore || {};
  if (!(X.T0 >= 10 && X.T0 <= 32) || !(X.rh >= 30 && X.rh <= 95) || !(X.H >= 0.5 && X.H <= 5)) errs.push('explore needs T0 (10 to 32), rh (30 to 95) and H (0.5 to 5)');
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must be some of ${TYPES.join(', ')}`);
    for (const r of c.ranges || []) if (!r.range || !r.wet || !r.dry) errs.push(`context ${c.id}: a range needs range, wet and dry`);
  }
  if (errs.length) return errs;
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
