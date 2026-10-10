/* Calculator live pictures (anatomy-physiology/data/calc-pictures.json,
   tools upgrade 2026-10): every key a picture draws must be a value its
   calculator computes, so the picture can only show the formula's own
   numbers; and the stack parts must add up to the whole they claim. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const read = p => JSON.parse(readFileSync(new URL(p, ROOT), 'utf8'));
const PICS = read('anatomy-physiology/data/calc-pictures.json').pictures;
const CALC = read('anatomy-physiology/data/tools/calculators.json').calculators;
const KINDS = { tube: ['flow'], wave: ['sbp', 'dbp'], balance: ['net'], pump: ['sv'], stack: [] };

// The page's expression language, enough for the derived values here.
const FUNCS = { abs: Math.abs, sqrt: Math.sqrt, min: Math.min, max: Math.max, round: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d };
function run(c) {
  const env = {};
  for (const i of c.inputs) env[i.key] = i.default;
  for (const d of c.derived || []) {
    const js = d.expr.replace(/\^/g, '**').replace(/\b([A-Za-z_]\w*)\b(?!\s*\()/g, k => `env.${k}`).replace(/\b(abs|sqrt|min|max|round)\(/g, 'F.$1(');
    env[d.key] = Function('env', 'F', `return (${js});`)(env, FUNCS);
  }
  return env;
}

test('every picture names only computed values', () => {
  for (const [id, pic] of Object.entries(PICS)) {
    const c = CALC.find(x => x.id === id);
    assert.ok(c, `${id}: no such calculator`);
    assert.ok(pic.kind in KINDS, `${id}: kind ${pic.kind}`);
    const keys = new Set([...c.inputs.map(i => i.key), ...(c.derived || []).map(d => d.key)]);
    const used = [];
    for (const [k, v] of Object.entries(pic)) if (typeof v === 'string' && !['kind', 'flowUnit', 'unit', 'where'].includes(k)) used.push(v);
    for (const f of [...(pic.out || []), ...(pic.in || [])]) used.push(f.key);
    for (const b of pic.bars || []) for (const s of b.segs) if (!s.expr) used.push(s.key);
    for (const k of used) assert.ok(keys.has(k), `${id}: ${k} is not computed by the calculator`);
    for (const k of KINDS[pic.kind]) assert.ok(pic[k] || (pic.kind === 'pump' && pic.edv), `${id}: ${k} missing`);
  }
});

test('stacked parts add up to the whole they show (defaults)', () => {
  const sums = {
    capacities: [['IRV', 'TV', 'ERV', 'RV'], 'TLC'], ventilation: [['VD', 'fresh'], 'TV'],
    'ur-filtration-fraction': [['GFR', 'left'], 'RPF'], 'ur-filtered-load-tm': [['reab', 'excr'], 'load'],
    'fab-compartments': [['ICF', 'ISF', 'PL'], 'TBW'], 'oxygen-content': [['bound', 'diss'], 'total'],
    'met-meal-energy': [['kc', 'kp', 'kf', 'ka'], 'total']
  };
  for (const [id, [parts, whole]] of Object.entries(sums)) {
    const env = run(CALC.find(x => x.id === id));
    const s = parts.reduce((a, k) => a + env[k], 0);
    assert.ok(Math.abs(s - env[whole]) < 1e-6 * Math.max(1, env[whole]), `${id}: ${parts.join('+')} = ${s}, ${whole} = ${env[whole]}`);
  }
});

test('glomerular and capillary balances: out minus in is the net', () => {
  for (const id of ['nfp', 'ur-glomerular-nfp']) {
    const pic = PICS[id], env = run(CALC.find(x => x.id === id));
    const net = pic.out.reduce((a, f) => a + env[f.key], 0) - pic.in.reduce((a, f) => a + env[f.key], 0);
    assert.ok(Math.abs(net - env[pic.net]) < 1e-9, id);
  }
});
