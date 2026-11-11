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
// calc-art.js families (tool review 2026-11): no required key beyond what each mode reads
const ART = readFileSync(new URL('anatomy-physiology/assets/tools/calc-art.js', ROOT), 'utf8');
for (const k of [...ART.matchAll(/^  F\.(\w+) = function/gm)].map(m => m[1])) KINDS[k] = [];
// words in a picture, not value keys
const WORDS = new Set(['kind', 'flowUnit', 'unit', 'where', 'mode', 'label', 'title', 'cap', 'name', 'end', 'tone', 'layout', 'foot', 'cls', 'levels', 'legendTitle']);
// every value key a picture names: top-level strings that are not words, any "key", "...Key", and nested lists
function keysOf(pic, top = true) {
  const out = [];
  for (const [k, v] of Object.entries(pic)) {
    if (typeof v === 'string') { if (WORDS.has(k)) continue; if (top || k === 'key' || /Key$/.test(k)) out.push(v); }
    else if (Array.isArray(v)) for (const x of v) { if (x && typeof x === 'object' && !(x.expr && k === 'segs')) out.push(...keysOf(x, false)); }
    else if (v && typeof v === 'object') out.push(...keysOf(v, false));
  }
  return out;
}

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

test('every calculator has a picture', () => {
  for (const c of CALC) assert.ok(PICS[c.id], `${c.id}: no picture in calc-pictures.json`);
});

test('a caption template names only computed values', () => {
  for (const [id, pic] of Object.entries(PICS)) {
    const c = CALC.find(x => x.id === id);
    const keys = new Set([...c.inputs.map(i => i.key), ...(c.derived || []).map(d => d.key)]);
    for (const t of [pic.cap, pic.foot].filter(Boolean)) for (const m of t.matchAll(/\{(\w+)\}/g)) assert.ok(keys.has(m[1]), `${id}: {${m[1]}} in its caption is not computed`);
  }
});

test('every picture names only computed values', () => {
  for (const [id, pic] of Object.entries(PICS)) {
    const c = CALC.find(x => x.id === id);
    assert.ok(c, `${id}: no such calculator`);
    assert.ok(pic.kind in KINDS, `${id}: kind ${pic.kind}`);
    const keys = new Set([...c.inputs.map(i => i.key), ...(c.derived || []).map(d => d.key)]);
    const used = keysOf(pic).filter(k => !(pic.steps || []).some(st => [...(st.in || []), ...(st.out || [])].some(f => f.expr && f.key === k)));
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
