/* Validator for psychology/data/tools/evidence-builder.json (Evidence Builder), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems: the frame; each question's fields (exactly
   three sources, each with a result, a method detail and the claims it
   supports; at least one defensible claim that two sources support, and
   refused claims with a reason; every concept a term of the course map,
   never a restricted term; every restricted list naming the question's own
   topic and research words; no em dash); then 300 drills per context and
   type regenerated with the model the page runs (ApPsychMath.evidenceBuilder),
   each key recomputed independently:
     A      the keyed claim is defensible and two sources support it
     B(i)   the keyed evidence cites the source it reads, which supports the claim
     C(i)   a different source from B(i), cited, supporting the claim
     B(ii)  the keyed concept links that source's result; never restricted
     C(ii)  a different concept from B(ii), linking C's source
     read   the difference of the means recomputed with ApPsychStats
   and the scorer is checked against the rubric rules on built answers. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['full', 'evidence', 'reasoning'];
const EMDASH = /—/;
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s.options[s.correct];
const norm = s => String(s).toLowerCase().replace(/^the /, '').trim();

function contextProblems(c, map, errs) {
  const w = `context ${c.id}`;
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  for (const k of ['title', 'question']) need(typeof c[k] === 'string' && c[k].trim(), `"${k}" is required`);
  need(/\?$/.test(c.question || ''), 'the question ends with a question mark');
  need(Array.isArray(c.sources) && c.sources.length === 3, 'exactly three sources (the EBQ)');
  const claimIds = new Set((c.claims || []).map(x => x.id));
  need((c.claims || []).filter(x => !x.defensible).length >= 3, 'three or more refused claims (topic, question, oversimplified)');
  for (const cl of c.claims || []) {
    need(cl.id && cl.text, 'a claim needs id and text');
    if (!cl.defensible) need(typeof cl.why === 'string' && cl.why.length > 20, `claim ${cl.id}: say why it is refused`);
    else need(!/\?/.test(cl.text), `claim ${cl.id}: a defensible claim is not a question`);
  }
  (c.sources || []).forEach((s, k) => {
    const sw = `source ${k + 1}`;
    for (const f of ['title', 'design', 'intro', 'participants', 'method', 'detail', 'vague', 'res', 'ev']) need(typeof s[f] === 'string' && s[f].trim(), `${sw}: "${f}" is required`);
    need(['experiment', 'correlational', 'naturalistic', 'survey', 'case'].includes(s.design), `${sw}: design is a method`);
    need(s.design !== 'experiment' || /random/i.test(s.method), `${sw}: an experiment says participants were randomly assigned`);
    need(Number.isInteger(s.n) && s.n >= 20, `${sw}: n`);
    need(Array.isArray(s.supports) && s.supports.length && s.supports.every(id => claimIds.has(id) && c.claims.find(x => x.id === id).defensible), `${sw}: supports names defensible claims`);
    need(!/\{/.test(s.detail), `${sw}: the detail is a method fact, with no numbers from the results`);
    if (s.kind === 'means') {
      need(Array.isArray(s.groups) && s.groups.length >= 2 && Number.isInteger(s.hi) && Number.isInteger(s.lo) && s.hi !== s.lo, `${sw}: groups, hi and lo`);
      need(/\{m\d\}/.test(s.res) && /\{m\d\}/.test(s.ev), `${sw}: res and ev quote the means`);
      need(Array.isArray(s.base) && Array.isArray(s.gap) && s.gap[0] > 0, `${sw}: base and gap`);
      if (s.max) need(s.base[1] + s.gap[1] <= s.max, `${sw}: means could pass the scale maximum`);
      need(s.axis, `${sw}: axis label`);
    } else if (s.kind === 'r') {
      need(s.design === 'correlational', `${sw}: a result reported as r is correlational`);
      need(/\{r\}/.test(s.res) && /\{r\}/.test(s.ev), `${sw}: res and ev quote r`);
      need(s.direction === 1 || s.direction === -1, `${sw}: direction`);
      need(!/\b(causes?|leads? to|makes)\b/i.test(s.ev), `${sw}: evidence from a correlation never claims cause`);
      for (const ax of ['x', 'y']) need(s[ax] && Array.isArray(s[ax].range) && s[ax].axis, `${sw}: ${ax} axis`);
    } else need(false, `${sw}: kind is "means" or "r"`);
  });
  const drillable = (c.claims || []).filter(cl => cl.defensible && (c.sources || []).filter(s => (s.supports || []).includes(cl.id)).length >= 2);
  need(drillable.length >= 1, 'at least one defensible claim that two sources support (B and C need different sources)');
  const restricted = c.restricted || [];
  need(restricted.some(r => r.kind === 'topic') && restricted.some(r => r.kind === 'research'), 'restricted: the question\'s own topic and research or statistics words');
  for (const r of restricted) need(r.id && r.name && r.why && ['topic', 'research'].includes(r.kind), `restricted ${r.id}: id, name, kind, why`);
  const rnames = new Set(restricted.map(r => norm(r.name)));
  const termOf = new Map();
  for (const x of (map && map.concepts) || []) for (const t of [x.term, ...(x.aliases || [])]) termOf.set(norm(t), x);
  for (const cn of c.concepts || []) {
    need(cn.id && cn.name && cn.def && cn.off && cn.links && typeof cn.links === 'object', `concept ${cn.id}: id, name, def, off and links`);
    need(!rnames.has(norm(cn.name)), `concept ${cn.id} is also a restricted term`);
    need(!map || termOf.has(norm(cn.name)), `concept "${cn.name}" is not a term of the course map (docs/appsych-dependency-map.json)`);
    for (const k of Object.keys(cn.links || {})) need(['0', '1', '2'].includes(k) && cn.links[k].length > 30, `concept ${cn.id}: link ${k}`);
  }
  for (const s of c.sources || []) { const k = c.sources.indexOf(s); need((c.concepts || []).filter(x => x.links && x.links[String(k)]).length >= 1, `source ${k + 1}: no concept explains it`); }
  for (const cl of drillable) {
    const sup = c.sources.map((s, k) => k).filter(k => c.sources[k].supports.includes(cl.id));
    for (const b of sup) for (const cc of sup) if (b !== cc) {
      const fb = c.concepts.filter(x => x.links[String(b)]), fc = c.concepts.filter(x => x.links[String(cc)]);
      need(fb.some(x => fc.some(y => y.id !== x.id)), `claim ${cl.id}: sources ${b + 1} and ${cc + 1} cannot get two different concepts`);
    }
  }
  const walk = (v, path) => {
    if (typeof v === 'string') { if (EMDASH.test(v)) errs.push(`${w}: ${path} has an em dash`); return; }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(c, '');
}

export function recheck(p, c, w, errs) {
  const { Stats, model: E } = runtime('evidence-builder');
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const g = p.given, cl = c.claims.find(x => x.id === g.claim);
  need(cl && cl.defensible, 'the keyed claim is defensible');
  need(c.sources[g.b].supports.includes(g.claim) && c.sources[g.c].supports.includes(g.claim), 'both evidence sources support the claim');
  need(g.b !== g.c, 'B(i) and C(i) come from different sources');
  need(g.bc !== g.cc, 'B(ii) and C(ii) use different concepts');
  const bc = c.concepts.find(x => x.id === g.bc), cc = c.concepts.find(x => x.id === g.cc);
  need(bc && bc.links[String(g.b)] && cc && cc.links[String(g.c)], 'each concept explains its own source');
  // The numbers behind each source: r from the plotted points, means within the scale.
  p.nums.forEach((nm, k) => {
    const s = c.sources[k];
    if (s.kind === 'r') {
      const rv = Stats.evaluate({ fn: 'r', args: [nm.points] });
      need(close(rv, nm.r, 1e-9, 1e-9), `source ${k + 1}: r is not the plotted points' r`);
      need(Math.sign(rv) === s.direction && Math.abs(rv) >= 0.3, `source ${k + 1}: r ${rv} does not show the stated direction`);
      need(nm.points.length === s.n, `source ${k + 1}: one point per participant`);
    } else {
      need(nm.means[s.hi] > nm.means[s.lo], `source ${k + 1}: the result is not in the stated direction`);
      if (s.max) need(nm.means.every(m => m >= 0 && m <= s.max), `source ${k + 1}: a mean is off the scale`);
    }
  });
  const sc = stepOf(p, 'claim');
  if (sc) { need(right(sc) === cl.text, 'claim key'); for (const o of sc.options) if (o !== cl.text) need(c.claims.some(x => x.text === o && !x.defensible), `claim distractor "${o}" is not a refused claim`); }
  const cite = k => new RegExp(`^According to Source ${k + 1}, `);
  const se = stepOf(p, 'evB');
  if (se) { need(cite(g.b).test(right(se)) && right(se) === E.evidence(c, p.nums, g.b, true), 'B(i) key is not source ' + (g.b + 1) + '\'s result, cited'); }
  const sf = stepOf(p, 'evC');
  if (sf) {
    need(cite(g.c).test(right(sf)) && right(sf) === E.evidence(c, p.nums, g.c, true), 'C(i) key is not source ' + (g.c + 1) + '\'s result, cited');
    need(sf.options.includes(E.evidence(c, p.nums, g.b, true)) ? sf.why[sf.options.indexOf(E.evidence(c, p.nums, g.b, true))].includes('different source') : true, 'reusing the B(i) source is not named');
  }
  for (const [key, cid] of [['conB', g.bc], ['conC', g.cc]]) {
    const s = stepOf(p, key);
    if (!s) continue;
    const want = c.concepts.find(x => x.id === cid).name;
    need(norm(right(s)) === norm(want), `${key} key "${right(s)}" is not ${want}`);
    for (const o of s.options) if (o !== right(s)) { const r = c.restricted.find(x => norm(x.name) === norm(o)); const cn = c.concepts.find(x => norm(x.name) === norm(o)); need(r || cn, `${key}: distractor "${o}" is neither restricted nor a concept`); if (cn && key === 'conC') need(cn.id === g.bc || !cn.links[String(g.c)], `${key}: distractor ${cn.id} would also be right`); if (cn && key === 'conB') need(!cn.links[String(g.b)], `${key}: distractor ${cn.id} would also be right`); }
  }
  for (const [key, cid, k] of [['linkB', g.bc, g.b], ['linkC', g.cc, g.c]]) {
    const s = stepOf(p, key);
    if (s) { const L = c.concepts.find(x => x.id === cid); need(norm(right(s)) === norm(L.links[String(k)]) && norm(right(s)).includes(norm(L.name)), `${key} key does not apply ${L.name} to source ${k + 1}`); }
  }
  const sr = stepOf(p, 'read');
  if (sr) {
    const k = [g.b, g.c].find(i => c.sources[i].kind === 'means'), s = c.sources[k], nm = p.nums[k];
    const want = Stats.evaluate({ fn: 'sub', args: [nm.means[s.hi], nm.means[s.lo]] });
    need(close(sr.cell.answer, want, 1e-9, 1e-9), `read key ${sr.cell.answer} is not ${want}`);
  }
  // The scorer agrees with the rubric on the keyed answer and on each slip.
  const full = { claim: g.claim, b: { src: g.b, what: 'result', cite: true }, bc: g.bc, c: { src: g.c, what: 'result', cite: true }, cc: g.cc };
  const sc7 = E.score(c, p.nums, full);
  need(sc7.total === 7, `the keyed answer scores ${sc7.total}, not 7`);
  need(E.score(c, p.nums, { ...full, b: { ...full.b, cite: false } }).Bi === 0, 'uncited evidence still earns B(i)');
  need(E.score(c, p.nums, { ...full, c: { ...full.b } }).Ci === 0, 'the B(i) source reused in C(i) still earns C(i)');
  need(E.score(c, p.nums, { ...full, cc: g.bc }).Cii === 1, 'the B(ii) concept reused in C(ii) is not capped at 1');
  need(E.score(c, p.nums, { ...full, bc: c.restricted[0].id }).Bii === 1, 'a restricted term earns the concept point');
  need(E.score(c, p.nums, { ...full, b: { ...full.b, what: 'detail' } }).Bi === 0, 'a method detail earns the evidence point');
  need(E.score(c, p.nums, { ...full, bc: E.NONE }).Bii === 1 && E.score(c, p.nums, { ...full, bc: null }).Bii === 0, 'reasoning with no concept is not capped at 1, or an unbuilt part scores');
  const keys = p.steps.map(s => s.key);
  const want = { full: ['claim', 'evB', 'conB', 'linkB', 'evC', 'conC', 'linkC'], evidence: ['claim', ...([g.b, g.c].some(i => c.sources[i].kind === 'means') ? ['read'] : []), 'evB', 'evC'], reasoning: ['conB', 'linkB', 'conC', 'linkC'] }[p.type];
  need(JSON.stringify(keys) === JSON.stringify(want), `steps ${keys.join(',')} are not ${want.join(',')}`);
  need(!EMDASH.test(JSON.stringify(p)), 'a drill text has an em dash');
}

export function check(data, map) {
  const errs = [];
  frame(data, 'evidence-builder', 'simulator', map, errs);
  const { model } = runtime('evidence-builder');
  if (!model) { errs.push('no model registered (ApPsychMath.evidenceBuilder)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) contextProblems(c, map, errs);
  for (const k of ['intro', 'howItWorks']) if (EMDASH.test(data[k] || '')) errs.push(`${k} has an em dash`);
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), () => TYPES);
  return errs;
}
