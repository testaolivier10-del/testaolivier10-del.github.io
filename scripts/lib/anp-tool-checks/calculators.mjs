/* Validator for the worked-example calculators' content,
   anatomy-physiology/data/tools/calculators.json (docs/anp-tools-contract.md).
   check(data, map) returns an array of error strings.

   Each calculator yields one scored item, stable forever:
     calculators:<id>:practice
   so a calculator id must never be renamed once published.

   Checks: required fields; unique ids; group, topic and core ids exist; levels
   and difficulty valid; every input's default and range make sense; every
   expression parses and every template placeholder names a known value; the
   defaults and every preset compute to a valid, finite result; the practice
   generator, run many times, always finds a valid problem whose answer is
   finite and whose rounded answer (what a learner would type) is still graded
   correct; every calculator explains itself (steps and a fallback meaning);
   no text points at an option by letter or position; and the ordering rule:
   nothing in a calculator uses a term the map teaches after its topic. */
import { scanUseTerms, everydaySet, termRegex, indexMap } from '../anp-map.mjs';

const LEVELS = ['recall', 'apply', 'analyze'];
const TONES = ['ok', 'lo', 'hi'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KEY = /^[A-Za-z_]\w*$/;
const RUNS = 400;

const POSITION_TELLS = [
  /\b(option|choice|answer)\s*\(?[A-Ea-e1-5]\)?(?![\w-])/,
  /\b(first|second|third|fourth|fifth|last|top|bottom)\s+(option|choice|answer)s?\b/i,
  /\b(options?|choices?|answers?)\s+(above|below)\b/i,
  /(^|\s)\(?[A-Ea-e]\)\s/,
];

const textOf = html => String(html == null ? '' : html)
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\{[^}]*\}/g, ' 0 ').replace(/\s+/g, ' ').trim();

function laterTerms(map, topicIndex, topicId, text) {
  const here = topicIndex.get(topicId);
  const out = [];
  const t = textOf(text);
  for (const c of map.concepts) {
    const there = topicIndex.get(c.taughtIn);
    if (there === undefined || there <= here) continue;
    // Same terms as the page check: plurals count, everyday words (decision 51) do not.
    for (const term of scanUseTerms(c)) {
      if (everydaySet(map).has(term.toLowerCase())) continue;
      const m = t.match(termRegex(term));
      if (m) { out.push(`"${m[0]}" (${c.id}, taught in ${c.taughtIn})`); break; }
    }
  }
  return out;
}

/* The same tiny expression language the page uses (assets/tools/calculators.js). */
const FUNCS = { abs: Math.abs, sqrt: Math.sqrt, min: Math.min, max: Math.max, round: (x, d = 0) => Math.round(x * 10 ** d) / 10 ** d };
function tokenize(s) {
  const re = /\s*(\d+(?:\.\d+)?(?:e[+-]?\d+)?|\.\d+|[A-Za-z_]\w*|<=|>=|==|!=|&&|\|\||[-+*/^()<>!,])/g;
  const out = []; let pos = 0; s = String(s);
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m || m.index !== pos) { if (/^\s*$/.test(s.slice(pos))) break; throw new Error(`cannot read "${s.slice(pos)}"`); }
    out.push(m[1]); pos = re.lastIndex;
  }
  return out;
}
export function evaluate(expr, env) {
  const t = tokenize(expr); let i = 0;
  const peek = () => t[i], next = () => t[i++];
  const expect = x => { if (next() !== x) throw new Error(`expected ${x}`); };
  const e = 1e-9;
  const or = () => { let v = and(); while (peek() === '||') { next(); const r = and(); v = (v || r) ? 1 : 0; } return v; };
  const and = () => { let v = cmp(); while (peek() === '&&') { next(); const r = cmp(); v = (v && r) ? 1 : 0; } return v; };
  const cmp = () => {
    const v = add(), op = peek();
    if (['<', '<=', '>', '>=', '==', '!='].includes(op)) {
      next(); const r = add();
      return +({ '<': v < r - e, '<=': v <= r + e, '>': v > r + e, '>=': v >= r - e, '==': Math.abs(v - r) <= e, '!=': Math.abs(v - r) > e }[op]);
    }
    return v;
  };
  const add = () => { let v = mul(); while (peek() === '+' || peek() === '-') { const op = next(), r = mul(); v = op === '+' ? v + r : v - r; } return v; };
  const mul = () => { let v = unary(); while (peek() === '*' || peek() === '/') { const op = next(), r = unary(); v = op === '*' ? v * r : v / r; } return v; };
  const unary = () => { if (peek() === '-') { next(); return -unary(); } if (peek() === '!') { next(); return unary() ? 0 : 1; } return pow(); };
  const pow = () => { const b = atom(); if (peek() === '^') { next(); return b ** unary(); } return b; };
  const atom = () => {
    const tok = next();
    if (tok === undefined) throw new Error('unexpected end');
    if (tok === '(') { const v = or(); expect(')'); return v; }
    if (/^[\d.]/.test(tok)) return parseFloat(tok);
    if (/^[A-Za-z_]/.test(tok)) {
      if (peek() === '(') {
        next(); const args = [];
        if (peek() !== ')') { args.push(or()); while (peek() === ',') { next(); args.push(or()); } }
        expect(')');
        if (!FUNCS[tok]) throw new Error(`unknown function ${tok}`);
        return FUNCS[tok](...args);
      }
      if (!(tok in env)) throw new Error(`unknown value ${tok}`);
      return env[tok];
    }
    throw new Error(`unexpected ${tok}`);
  };
  const v = or();
  if (i < t.length) throw new Error(`trailing ${t[i]}`);
  return v;
}

function compute(calc, values) {
  const env = {};
  for (const inp of calc.inputs) env[inp.key] = values[inp.key];
  for (const r of calc.invalid || []) if (evaluate(r.when, env)) return { env, invalid: r.text };
  for (const d of calc.derived || []) env[d.key] = evaluate(d.expr, env);
  for (const d of calc.derived || []) if (!Number.isFinite(env[d.key])) return { env, invalid: `${d.key} is not finite` };
  return { env };
}

function dpOf(calc, key) {
  const all = [...calc.inputs, ...(calc.derived || [])];
  const x = all.find(a => a.key === key);
  if (!x) return 1;
  if (typeof x.dp === 'number') return x.dp;
  if (x.step) { const s = String(x.step); return s.includes('.') ? s.split('.')[1].length : 0; }
  return 0;
}

function pickValue(inp, rnd) {
  const g = inp.gen;
  if (!g) return inp.default;
  if (g.choices) return g.choices[Math.floor(rnd() * g.choices.length)];
  const [lo, hi, step = 1] = g;
  const n = Math.floor((hi - lo) / step + 1e-9);
  const d = String(step).includes('.') ? String(step).split('.')[1].length : 0;
  return +(lo + step * Math.floor(rnd() * (n + 1))).toFixed(d);
}

// A seeded generator so the check is repeatable.
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function check(data, map) {
  const errors = [];
  const err = m => errors.push(m);
  if (!data || typeof data !== 'object') return ['calculators.json is not an object'];
  const { topicIndex } = indexMap(map);
  const core = new Set(map.coreConcepts.map(c => c.id));
  const groups = new Set();
  for (const g of data.groups || []) {
    if (!g.id || !g.title) err(`group needs id and title: ${JSON.stringify(g)}`);
    if (groups.has(g.id)) err(`duplicate group "${g.id}"`);
    groups.add(g.id);
  }
  if (!Array.isArray(data.calculators) || !data.calculators.length) return [...errors, 'no calculators'];

  const ids = new Set();
  for (const c of data.calculators) {
    const where = `calculator ${c.id || '(no id)'}`;
    const e = m => err(`${where}: ${m}`);
    if (!c.id || !SLUG.test(c.id)) { e('id must be a lowercase slug'); continue; }
    const item = `calculators:${c.id}:practice`;
    if (ids.has(item)) e(`duplicate item id ${item}`);
    ids.add(item);
    for (const f of ['title', 'short', 'intro', 'formula']) if (!c[f] || typeof c[f] !== 'string') e(`missing ${f}`);
    if (!groups.has(c.group)) e(`unknown group "${c.group}"`);
    if (!topicIndex.has(c.topic)) e(`unknown topic "${c.topic}"`);
    if (!Array.isArray(c.core) || !c.core.length) e('needs core concept ids');
    for (const k of c.core || []) if (!core.has(k)) e(`unknown core concept "${k}"`);
    if (!LEVELS.includes(c.level)) e(`level must be one of ${LEVELS.join(', ')}`);
    if (![1, 2, 3].includes(c.diff)) e('diff must be 1, 2 or 3');

    // Inputs and derived values.
    const keys = new Set();
    if (!Array.isArray(c.inputs) || !c.inputs.length) { e('no inputs'); continue; }
    for (const inp of c.inputs) {
      if (!KEY.test(inp.key || '')) e(`input key "${inp.key}" is not a valid name`);
      if (keys.has(inp.key)) e(`duplicate key "${inp.key}"`);
      keys.add(inp.key);
      if (!inp.label || !inp.sym) e(`input ${inp.key}: needs label and sym`);
      if (typeof inp.unit !== 'string') e(`input ${inp.key}: unit must be a string ("" for none)`);
      for (const f of ['default', 'min', 'max', 'step']) if (typeof inp[f] !== 'number') e(`input ${inp.key}: ${f} must be a number`);
      if (inp.min >= inp.max) e(`input ${inp.key}: min must be below max`);
      if (inp.default < inp.min || inp.default > inp.max) e(`input ${inp.key}: default outside min..max`);
      if (inp.step <= 0) e(`input ${inp.key}: step must be positive`);
      const g = inp.gen;
      if (g) {
        const vals = g.choices ? g.choices : Array.isArray(g) && g.length >= 2 ? [g[0], g[1]] : null;
        if (!vals) e(`input ${inp.key}: gen must be [min, max, step] or { choices }`);
        else for (const v of vals) if (typeof v !== 'number' || v < inp.min || v > inp.max) e(`input ${inp.key}: generated value ${v} is outside min..max`);
      }
    }
    for (const d of c.derived || []) {
      if (!KEY.test(d.key || '')) e(`derived key "${d.key}" is not a valid name`);
      if (keys.has(d.key)) e(`duplicate key "${d.key}"`);
      keys.add(d.key);
      if (typeof d.dp !== 'number') e(`derived ${d.key}: needs dp (decimals shown)`);
      try { tokenize(d.expr); } catch (x) { e(`derived ${d.key}: ${x.message}`); }
    }

    // Every template placeholder must name a known value.
    const templates = [];
    const addT = (label, s) => { if (s) templates.push([label, s]); };
    (c.steps || []).forEach((s, i) => { addT(`step ${i + 1}`, s.text); if (!s.title || !s.text) e(`step ${i + 1} needs title and text`); });
    (c.meaning || []).forEach((m, i) => addT(`meaning ${i + 1}`, m.text));
    addT('note', c.note); addT('exam', c.exam);
    for (const a of (c.practice && c.practice.asks) || []) addT('practice prompt', a.prompt);
    for (const [label, s] of templates) {
      for (const m of String(s).matchAll(/\{([^}]*)\}/g)) {
        const [key, flags] = m[1].split(':');
        if (!keys.has(key)) e(`${label}: placeholder {${m[1]}} names no input or derived value`);
        if (flags !== undefined && !/^[+p]*\d*$/.test(flags)) e(`${label}: bad format in {${m[1]}}`);
      }
    }

    // It explains itself: steps, results and a meaning for every case.
    if (!Array.isArray(c.steps) || c.steps.length < 2) e('needs at least two worked steps');
    if (!Array.isArray(c.results) || !c.results.length) e('needs results');
    for (const r of c.results || []) {
      if (!keys.has(r.key)) e(`result "${r.key}" is not a known value`);
      if (!r.label) e(`result ${r.key}: needs a label`);
      for (const b of r.bands || []) {
        if (!b.label || !TONES.includes(b.tone)) e(`result ${r.key}: band needs a label and a tone (${TONES.join(', ')})`);
        if (b.when) try { tokenize(b.when); } catch (x) { e(`result ${r.key} band: ${x.message}`); }
      }
      if ((r.bands || []).length && r.bands[r.bands.length - 1].when) e(`result ${r.key}: the last band must have no "when" (the fallback)`);
    }
    const mains = (c.meaning || []).filter(m => !m.also);
    if (!mains.length || mains[mains.length - 1].when !== '1') e('meaning needs a final fallback entry with "when": "1"');
    for (const r of c.invalid || []) if (!r.when || !r.text) e('invalid rule needs when and text');

    // Evaluate: defaults, bands, meanings and every preset.
    const conds = [...(c.invalid || []).map(r => r.when), ...(c.meaning || []).map(m => m.when),
      ...(c.results || []).flatMap(r => (r.bands || []).map(b => b.when).filter(Boolean)), (c.practice || {}).require].filter(Boolean);
    const tryValues = (label, values) => {
      let r;
      try { r = compute(c, values); } catch (x) { e(`${label}: ${x.message}`); return; }
      if (r.invalid) { e(`${label}: gives an invalid result (${r.invalid})`); return; }
      for (const w of conds) try { evaluate(w, r.env); } catch (x) { e(`condition "${w}": ${x.message}`); }
    };
    const defaults = Object.fromEntries(c.inputs.map(i => [i.key, i.default]));
    tryValues('defaults', defaults);
    for (const p of c.presets || []) {
      if (!p.label) e('preset needs a label');
      for (const k of Object.keys(p.values || {})) {
        if (!c.inputs.some(i => i.key === k)) e(`preset "${p.label}": unknown input ${k}`);
        const inp = c.inputs.find(i => i.key === k);
        if (inp && (p.values[k] < inp.min || p.values[k] > inp.max)) e(`preset "${p.label}": ${k} outside min..max`);
      }
      tryValues(`preset "${p.label}"`, { ...defaults, ...p.values });
    }

    // Practice: many generated problems, each valid and gradable.
    const pr = c.practice;
    if (!pr || !Array.isArray(pr.asks) || !pr.asks.length) { e('needs practice.asks'); }
    else {
      for (const a of pr.asks) {
        if (!keys.has(a.key)) e(`practice ask "${a.key}" is not a known value`);
        if (a.show && !keys.has(a.show)) e(`practice show "${a.show}" is not a known value`);
        if (!a.prompt || typeof a.unit !== 'string') e(`practice ask ${a.key}: needs prompt and unit`);
        if (!a.tol || !(a.tol.abs > 0 || a.tol.rel > 0)) e(`practice ask ${a.key}: needs a tolerance (abs and/or rel)`);
      }
      const rnd = rng(c.id.length * 7919 + 17);
      let failed = 0;
      for (let run = 0; run < RUNS && failed < 3; run++) {
        let r = null, tries = 0;
        do {
          const vals = Object.fromEntries(c.inputs.map(i => [i.key, pickValue(i, rnd)]));
          try { r = compute(c, vals); } catch (x) { e(`practice: ${x.message}`); failed = 3; break; }
          tries++;
        } while (tries < 300 && (r.invalid || (pr.require && !evaluate(pr.require, r.env))));
        if (failed >= 3) break;
        if (r.invalid || (pr.require && !evaluate(pr.require, r.env))) { e('practice generator could not find a valid problem in 300 tries'); failed++; continue; }
        for (const a of pr.asks) {
          if (!keys.has(a.key)) continue;
          const ans = r.env[a.key];
          const tol = Math.max(a.tol?.abs || 0, (a.tol?.rel || 0) * Math.abs(ans));
          const shownKey = a.show || a.key;
          const typed = +r.env[shownKey].toFixed(dpOf(c, shownKey));
          if (Math.abs(typed - ans) > tol + 1e-9) { e(`practice ask ${a.key}: the shown answer ${typed} would be graded wrong against ${ans} (tolerance ${tol}); widen tol or show more decimals`); failed++; break; }
        }
      }
    }

    // Every text: no option-position tells, and the ordering rule.
    const texts = [c.title, c.short, c.intro, c.formula, c.note, c.exam,
      ...c.inputs.flatMap(i => [i.label, i.hint, i.unit]),
      ...(c.steps || []).flatMap(s => [s.title, s.text]),
      ...(c.results || []).flatMap(r => [r.label, r.normal, r.unit, ...(r.bands || []).map(b => b.label)]),
      ...(c.meaning || []).map(m => m.text), ...(c.invalid || []).map(r => r.text),
      ...(c.presets || []).map(p => p.label), ...((pr && pr.asks) || []).map(a => a.prompt)].filter(Boolean);
    for (const t of texts) if (POSITION_TELLS.some(re => re.test(textOf(t)))) e(`text refers to an option by letter or position: "${textOf(t).slice(0, 60)}"`);
    if (topicIndex.has(c.topic)) {
      const later = laterTerms(map, topicIndex, c.topic, texts.join(' \n '));
      if (later.length) e(`uses terms taught after ${c.topic}: ${later.join(', ')}`);
    }
  }
  return errors;
}
