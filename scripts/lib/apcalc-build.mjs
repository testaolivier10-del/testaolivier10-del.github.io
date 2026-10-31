/* Data loading, page templates and helpers for the AP® Calculus AB generator
   (scripts/build-apcalc.mjs) and its content check (scripts/check-apcalc-content.mjs).

   Forked from scripts/lib/apphys-build.mjs (docs/apcalc-spec.md decision 1),
   itself from apchem-build.mjs: the same head, footer, glossary markup,
   stimulus tables, adapted for calculus: every $...$ in authored data is
   rendered to MathML at load (calculus/assets/calc-math.js through
   apcalc-mathlib.mjs; a TeX typo is a listed problem, C.mathProblems),
   graph stimuli are plotted from a declarative spec (stimulus.plot,
   calculus/assets/tools/calc-plot.js), `expr` items, calculator and
   no-calculator numeric items (three-decimal rule; exact forms), no
   periodic table, and no OpenStax figures (spec decision 4).
   docs/apcalc-architecture.md describes every data format read here.

   THE MAP. loadMap() reads docs/apcalc-dependency-map.json (validated in full by
   scripts/lib/apcalc-map.mjs and check-apcalc-map.mjs); without it, only when
   APCALC_MAP_STUB=1 (tests), the fixture scripts/test/fixtures/apcalc-map-stub.json;
   otherwise there is no map and nothing is built. Its interface is deliberately small so the swap is one
   import: { chapters, topics, concepts, practices, parts, order(), topicById(id),
   chapterById(id) }, where topics is already in course order. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP } from './site-config.mjs';
import { Tex, Plot, Expr, mathHtml, RAW_KEYS } from './apcalc-mathlib.mjs';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const SITE = 'https://levlprep.com';

/* ONE GENERATOR, TWO COURSES (docs/apcalcbc-architecture.md, "Reuse").
   AP® Calculus BC is built by this same code with the "bc" profile:
   APCALC_COURSE=bc, set by scripts/build-apcalcbc.mjs and the BC checks
   before they import anything. Every AB value below is the profile's AB
   field, so with no APCALC_COURSE the AB build is byte-identical to the one
   before BC existed (scripts/test/apcalcbc-reuse.test.mjs holds it so).

   BC reads AB's authored topics from calculus/data/ and its own from
   calculus-bc/data/ (no AB file is copied), serves at /calculus-bc/, keys
   storage apcalcbc_*, ids new items cbc-, and runs AB's runtime files from
   /calculus/assets/, configured per page by window.ApCalcCourse (tail()). */
export const PROFILES = {
  ab: {
    id: 'ab', key: 'apcalc', dir: 'calculus', name: 'AP® Calculus AB', html: 'AP&reg; Calculus AB', label: 'AP® Calculus AB',
    short: 'Calculus AB', idPrefix: 'calc', freeUnits: ['unit-1', 'unit-2'], freeTopics: [],
    map: 'apcalc-dependency-map.json', stub: 'apcalc-map-stub.json', dataEnv: 'APCALC_DATA', pubEnv: 'APCALC_PUBLISHED',
    runtime: '', scoreCalculator: true, band: true,
  },
  bc: {
    id: 'bc', key: 'apcalcbc', dir: 'calculus-bc', name: 'AP® Calculus BC', html: 'AP&reg; Calculus BC', label: 'AP® Calculus BC',
    short: 'Calculus BC', idPrefix: 'cbc', freeUnits: ['unit-1', 'unit-2'],
    // Spec decision 6 (proposed, owner to confirm): AB's free tier plus 9.1-9.3,
    // so a BC visitor tries BC material free. Keep in step with premium.js.
    freeTopics: ['parametric-derivatives', 'parametric-second-derivatives', 'parametric-arc-length'],
    map: 'apcalcbc-dependency-map.json', stub: 'apcalcbc-map-stub.json', dataEnv: 'APCALCBC_DATA', pubEnv: 'APCALCBC_PUBLISHED',
    // AB's authored data (the AB topics), and the folder BC pages reach AB's runtime through.
    abData: 'APCALC_DATA', runtime: '../calculus/', scoreCalculator: false, band: false,
  },
};
export const COURSE = PROFILES[process.env.APCALC_COURSE === 'bc' ? 'bc' : 'ab'];
export const IS_BC = COURSE.id === 'bc';
export const BASE = `/${COURSE.dir}/`;
export const COURSE_KEY = COURSE.key;              // storage, analytics, registry: never in a URL
export const COURSE_NAME = COURSE.name;
export const COURSE_HTML = COURSE.html;
export const COURSE_ID = `${SITE}${BASE}#course`;
export const DISCLAIMER = 'AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.';
export const BETA_NOTE = `This course has not yet been reviewed by an ${COURSE.name} teacher.`;
// Units 1 and 2 are free, and every math-skills lesson (as AP® Chemistry,
// apchem-spec decision 6; docs/apcalc-spec.md decision 6).
export const FREE_UNITS = COURSE.freeUnits;
export const MAP_PATH = join(ROOT, 'docs', COURSE.map);
export const STUB_PATH = join(ROOT, 'scripts', 'test', 'fixtures', COURSE.stub);
/* Where a page finds the runtime files (calc-*.js, calc.css, pages/, tools/
   framework): AB its own assets/, BC AB's (one copy of the runtime). The
   course's generated files (curriculum, bank, glossary, tool data) are
   always its own `${depth}assets/`. */
export const RT = depth => `${depth}${COURSE.runtime}assets/`;
/* An AB figure on a BC page: AB's file, by root-relative path. */
export const figureDir = (f, depth) => f && f._course === 'ab' && IS_BC ? '/calculus/figures/' : `${depth}figures/`;

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Plain text of authored HTML: a rendered formula becomes its plain-text
// reading (from the TeX in its annotation), a $...$ its plain text.
const mathText = s => String(s ?? '').replace(/<math\b[\s\S]*?<\/math>/g, m => {
  const a = m.match(/<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/);
  return a ? ` ${Tex.text(a[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'))} ` : ' ';
});
export const text = html => Tex.plain(mathText(html)).replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&reg;/g, '®').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

/* The token rule (spec decision 2): no "ap" or "apcalc" token in a served path. */
export const hasApToken = s => String(s).toLowerCase().split(/[^a-z0-9]+/).some(t => t === 'ap' || t === 'apcalc' || t === 'apcalcbc' || t === 'apphys' || t === 'apchem' || t === 'apbio');

/* The trademark (spec section 1, decision 3): "AP®" with the ®, as an
   adjective before a capitalized noun ("AP® Calculus AB"), never plural or
   possessive. Returns problems found in a piece of authored text. */
export function trademarkProblems(s) {
  // The disclaimer is the one sentence where the mark is the subject.
  const t = String(s ?? '').replace(/&reg;/g, '®').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').split(DISCLAIMER).join(' ');
  const out = [];
  for (const m of t.matchAll(/\bAP\b(®?)(\S*)/g)) {
    const [all, reg, after] = m;
    if (!reg) out.push(`"${all}": write "AP®", with the ®`);
    else if (/^(s|'s|’s)\b/.test(after) || /^(s|'s|’s)$/.test(after)) out.push(`"${all}": the mark is never plural or possessive`);
    else if (after) out.push(`"${all}": "AP®" is followed by a space and a noun ("AP® Calculus AB")`);
    else {
      const next = t.slice(m.index + all.length).match(/^\s+(\S+)/);
      if (!next || !/^[A-Z]/.test(next[1])) out.push(`"AP®${next ? ' ' + next[1] : ''}": use the mark as an adjective before a capitalized noun ("AP® Calculus AB")`);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ map */

export function mapSource(env = process.env) {
  if (existsSync(MAP_PATH)) return MAP_PATH;
  if (env.APCALC_MAP_STUB === '1') return STUB_PATH;
  return null;
}

/* The BC map is an overlay on AB's (docs/apcalcbc-phase0.md): AB's units,
   topics and concepts plus BC's own, merged here so nothing is copied.
   mergeBcMap(ab, bc) -> a map in AB's format: chapters in course order
   (Units 1-10, then the skills chapters), BC weights for Units 1-8, topics
   grouped by chapter in CED order (BC topics where the CED places them),
   AB concepts then BC ones, every topic and concept tagged with the course
   whose data folder holds it (`source`: 'ab' | 'bc'). */
export const AB_MAP_PATH = join(ROOT, 'docs', PROFILES.ab.map);
export function mergeBcMap(ab, bc) {
  const cedKey = t => t.ced ? t.ced.split('.').map(n => String(+n).padStart(3, '0')).join('.') : null;
  const chapters = [...ab.chapters.map(c => {
    const w = (bc.chapterWeights || {})[c.id];
    const tools = (bc.chapterTools || {})[c.id];
    const merged = { ...c, ...(w ? { weight: w } : {}) };
    if (tools) { merged.tools = { ...(c.tools || {}) }; for (const [k, v] of Object.entries(tools)) merged.tools[k] = [...(merged.tools[k] || []), ...v]; }
    return merged;
  }), ...bc.chapters];
  chapters.sort((a, b) => (a.part === 'course' ? 0 : 1) - (b.part === 'course' ? 0 : 1) || (a.n ?? 999) - (b.n ?? 999));
  const all = [...ab.topics.map(t => ({ ...t, source: 'ab' })), ...bc.topics.map(t => ({ ...t, source: 'bc' }))];
  const topics = [];
  for (const c of chapters) {
    const ts = all.filter(t => t.chapter === c.id).map((t, i) => ({ t, i }));
    ts.sort((x, y) => (cedKey(x.t) && cedKey(y.t) ? cedKey(x.t).localeCompare(cedKey(y.t)) : x.i - y.i) || x.i - y.i);
    topics.push(...ts.map(x => x.t));
  }
  return {
    about: bc.about, version: bc.version, ced: bc.ced, practices: ab.practices, parts: ab.parts, chapters, topics,
    everydayWords: { ...(ab.everydayWords || {}), words: [...((ab.everydayWords || {}).words || []), ...((bc.everydayWords || {}).words || [])] },
    concepts: [...ab.concepts.map(c => ({ ...c, source: 'ab' })), ...bc.concepts.map(c => ({ ...c, source: 'bc' }))],
    circularDependencies: [...(ab.circularDependencies || []), ...(bc.circularDependencies || [])],
  };
}
/* A map file, raw: BC's overlay merged onto AB's (a stub overlay too). */
export function readMapRaw(path) {
  const raw = readJson(path);
  return raw.overlay ? mergeBcMap(readJson(raw.base ? join(ROOT, raw.base) : AB_MAP_PATH), raw) : raw;
}

/* Validates the parts of the map this generator relies on and returns the
   interface above. Throws with every problem listed. */
export function loadMap(path = mapSource()) {
  if (!path) return null;
  const raw = readMapRaw(path);
  const errs = [];
  for (const k of ['practices', 'parts', 'chapters', 'topics', 'concepts']) if (!Array.isArray(raw[k])) errs.push(`map: "${k}" must be an array`);
  if (errs.length) throw new Error(errs.join('\n'));
  const chapterById = new Map(raw.chapters.map(c => [c.id, c]));
  const partIds = new Set(raw.parts.map(p => p.id));
  const seen = new Set();
  for (const c of raw.chapters) {
    if (seen.has(c.id)) errs.push(`map: duplicate chapter ${c.id}`); seen.add(c.id);
    if (!partIds.has(c.part)) errs.push(`map: chapter ${c.id} has unknown part "${c.part}"`);
    if (hasApToken(c.id)) errs.push(`map: chapter id ${c.id} contains the token "ap"`);
  }
  const topicIds = new Set();
  for (const t of raw.topics) {
    if (topicIds.has(t.id)) errs.push(`map: duplicate topic ${t.id}`); topicIds.add(t.id);
    if (!chapterById.has(t.chapter)) errs.push(`map: topic ${t.id} has unknown chapter "${t.chapter}"`);
    if (hasApToken(t.id)) errs.push(`map: topic id ${t.id} contains the token "ap"`);
    if (!['concept', 'skill', 'drill'].includes(t.kind)) errs.push(`map: topic ${t.id} kind must be concept, skill or drill`);
  }
  for (const t of raw.topics) for (const k of ['after', 'before']) if (t[k] && !topicIds.has(t[k])) errs.push(`map: topic ${t.id} is placed ${k} unknown topic "${t[k]}"`);
  for (const c of raw.concepts) {
    if (!topicIds.has(c.taughtIn)) errs.push(`map: concept ${c.id} taught in unknown topic "${c.taughtIn}"`);
    c.aliases = c.aliases || []; c.dependsOn = c.dependsOn || [];
  }
  if (errs.length) throw new Error(errs.join('\n'));

  /* Course order (docs/apcalc-phase0.md): unit topics in CED order, each skill
     topic right before its "before" topic or right after its "after" topic. */
  const cedKey = t => String(t.ced || '').split('.').map(n => String(+n).padStart(3, '0')).join('.');
  const chN = c => c.n ?? 999;
  const main = raw.topics.filter(t => !t.after && !t.before)
    .map((t, i) => ({ t, i }))
    .sort((a, b) => chN(chapterById.get(a.t.chapter)) - chN(chapterById.get(b.t.chapter)) || (a.t.ced && b.t.ced ? cedKey(a.t).localeCompare(cedKey(b.t)) : 0) || a.i - b.i)
    .map(x => x.t);
  const ordered = [];
  const place = t => { for (const s of raw.topics.filter(x => x.before === t.id)) place(s); ordered.push(t); for (const s of raw.topics.filter(x => x.after === t.id)) place(s); };
  for (const t of main) place(t);
  const byId = new Map(ordered.map(t => [t.id, t]));
  return {
    raw, path,
    practices: raw.practices, parts: raw.parts, bigIdeas: raw.bigIdeas || [],
    chapters: raw.chapters, topics: ordered, concepts: raw.concepts,
    everyday: new Set(((raw.everydayWords || {}).words || []).map(w => w.toLowerCase())),
    order: () => ordered.slice(),
    topicById: id => byId.get(id),
    chapterById: id => chapterById.get(id),
  };
}

/* ------------------------------------------------------------------ data */

function mergeDir(dir, course) {
  const all = {};
  if (!existsSync(dir)) return all;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    for (const [k, v] of Object.entries(readJson(join(dir, f)))) if (!(k in all)) all[k] = { ...v, _file: f, ...(course ? { _course: course } : {}) };
  }
  return all;
}

/* Text for one course only (docs/apcalcbc-architecture.md, "One source"):
   an element whose class has calc-ab-only is dropped from BC pages, one with
   cbc-only from AB pages. Not nested; AB data has neither today. */
const ONLY_RE = cls => new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>[\\s\\S]*?<\\/\\1>`, 'g');
/* A <span> wrapper for the course being built is unwrapped (its text kept, the span
   dropped), so wrapping AB text in calc-ab-only leaves AB's pages byte-identical. */
const KEEP_RE = cls => new RegExp(`<span\\b[^>]*class="${cls}"[^>]*>([\\s\\S]*?)<\\/span>`, 'g');
export function courseOnly(v, course = COURSE.id) {
  const bc = course === 'bc';
  const re = ONLY_RE(bc ? 'calc-ab-only' : 'cbc-only');
  const keep = KEEP_RE(bc ? 'cbc-only' : 'calc-ab-only');
  // Any other element kept for this course (<li class="cbc-only">) loses the marker class.
  const mark = new RegExp(` class="${bc ? 'cbc-only' : 'calc-ab-only'}"`, 'g');
  if (typeof v === 'string') return v.includes('-only') ? v.replace(re, '').replace(keep, '$1').replace(mark, '') : v;
  if (Array.isArray(v)) return v.map(x => courseOnly(x, course));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, courseOnly(x, course)]));
  return v;
}

/* The data folders a course reads, AB's first: AB [calculus/data]; BC
   [calculus/data (AB topics), calculus-bc/data (BC topics)]. */
export function dataDirs(root = ROOT, dataDir) {
  if (!IS_BC) return { ab: dataDir || join(root, 'calculus', 'data'), own: dataDir || join(root, 'calculus', 'data') };
  return { ab: process.env[COURSE.abData] || join(root, 'calculus', 'data'), own: dataDir || join(root, COURSE.dir, 'data') };
}

/* BC: AB's page descriptions for AB topics, BC's own on top. */
const mergeDescriptions = (a, b) => { const out = { ...a }; for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' ? { ...(a[k] || {}), ...v } : v; return out; };

/* published: override for tests (an array of chapter ids). */
export function loadCourse(root = ROOT, { map = loadMap(), published: pubOverride, data: dataDir } = {}) {
  const dirs = dataDirs(root, dataDir);
  const data = dirs.own;
  const dirOf = t => IS_BC && t.source === 'ab' ? dirs.ab : data;
  const lessons = {}, notes = {}, questions = {};
  const topics = map ? map.topics : [];
  for (const t of topics) {
    const d = dirOf(t);
    const lp = join(d, 'lessons', `${t.id}.json`), np = join(d, 'notes', `${t.id}.html`), qp = join(d, 'questions', `${t.id}.json`);
    if (existsSync(lp)) lessons[t.id] = readJson(lp);
    if (existsSync(np)) notes[t.id] = readFileSync(np, 'utf8');
    if (existsSync(qp)) questions[t.id] = readJson(qp);
  }
  // BC: its own definitions and figures first, then AB's (each figure knows its folder).
  const both = sub => IS_BC ? { ...mergeDir(join(dirs.ab, sub), 'ab'), ...mergeDir(join(data, sub), 'bc') } : mergeDir(join(data, sub));
  const glossary = both('glossary');
  const figures = both('figures');
  for (const d of IS_BC ? [dirs.ab, data] : [data]) {
    const labelDir = join(d, 'labels');
    if (existsSync(labelDir)) for (const f of readdirSync(labelDir).filter(f => f.endsWith('.json'))) {
      const id = f.slice(0, -5);
      if (figures[id]) figures[id] = { ...figures[id], labels: readJson(join(labelDir, f)).labels || [] };
    }
  }
  // FRQs: BC serves AB's (the shared Q1, Q3, Q4 stock) and its own.
  const frq = {};
  for (const d of IS_BC ? [dirs.ab, data] : [data]) {
    const frqDir = join(d, 'frq');
    if (existsSync(frqDir)) for (const f of readdirSync(frqDir).filter(f => f.endsWith('.json')).sort()) frq[f.slice(0, -5)] = readJson(join(frqDir, f));
  }
  const pubPath = join(data, 'published.json');
  const published = new Set(pubOverride || (existsSync(pubPath) ? readJson(pubPath).chapters || [] : []));
  const readOpt = (f, d) => existsSync(join(data, f)) ? readJson(join(data, f)) : d;
  // A skills topic also waits for the chapter of the topic it sits before or
  // after (the logs refresher publishes with Unit 5, which first needs ln).
  const anchorLive = t => { const id = t.after || t.before; const a = id && topics.find(x => x.id === id); return !a || published.has(a.chapter); };
  const built = new Set(topics.filter(t => lessons[t.id] && notes[t.id] && questions[t.id] && published.has(t.chapter) && anchorLive(t)).map(t => t.id));
  // Math: every $...$ becomes MathML here, once. A TeX typo is listed in
  // mathProblems (the content check reports it, the build refuses a built
  // topic that has one) and rendered loosely so the rest still loads.
  const mathProblems = [];
  const R = (v, where) => renderMath(courseOnly(v), msg => mathProblems.push(`${where}: ${msg}`));
  const raw = { questions: {} };
  for (const id of Object.keys(lessons)) lessons[id] = R(lessons[id], `lessons/${id}.json`);
  for (const id of Object.keys(notes)) notes[id] = R(notes[id], `notes/${id}.html`);
  for (const id of Object.keys(questions)) { raw.questions[id] = questions[id]; questions[id] = prepareBank(R(questions[id], `questions/${id}.json`), id, mathProblems); }
  for (const id of Object.keys(glossary)) glossary[id] = R(glossary[id], `glossary/${glossary[id]._file}`);
  for (const id of Object.keys(frq)) frq[id] = R(frq[id], `frq/${id}.json`);
  return {
    map, data, lessons, notes, questions, glossary, figures, frq, published, built, mathProblems, raw,
    pages: readOpt('pages.json', { apps: [], tools: [] }),
    descriptions: IS_BC ? mergeDescriptions(existsSync(join(dirs.ab, 'descriptions.json')) ? readJson(join(dirs.ab, 'descriptions.json')) : {}, readOpt('descriptions.json', {})) : readOpt('descriptions.json', {}),
    dirs, dirOf,
  };
}

/* Every string with a $ rendered to MathML (strict), except keys and
   expressions in the student syntax (RAW_KEYS) and plot specs, which
   calc-plot.js reads itself. onError(msg) hears about a TeX typo. */
const SKIP_TREE = new Set(['plot', 'chart', 'field']);
export function renderMath(v, onError = msg => { throw new Error(msg); }) {
  if (typeof v === 'string') {
    if (!v.includes('$')) return v;
    try { return mathHtml(v); } catch (e) { onError(e.message); return Tex.html(v); }
  }
  if (Array.isArray(v)) return v.map(x => renderMath(x, onError));
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = SKIP_TREE.has(k) || (RAW_KEYS.has(k) && typeof x !== 'object') ? x : renderMath(x, onError);
    return out;
  }
  return v;
}

/* What the runtime needs from an expr or numeric item beyond what was
   authored: the key as rendered math (expr.answerHtml, numeric.answerHtml),
   the numeric value of an exact key ("pi/4"), the rendered lhs. A key that
   does not parse is a listed problem. */
export function prepareBank(bank, topicId, problems = []) {
  for (const q of (bank && bank.items) || []) {
    try {
      if (q.type === 'interval' && q.interval) q.interval.answerHtml = Tex.render(intervalTex(q.interval), { strict: true });
      if (q.type === 'expr' && q.expr) {
        const E = q.expr, vars = E.vars || ['x'];
        const tree = Expr.parse(String(E.answer), { vars });
        const tex = E.answerTex || Expr.toTex(tree);
        E.answerHtml = Tex.render(tex + (E.mode === 'constant' ? ' + C' : ''), { strict: true });
        if (E.lhs) E.lhsHtml = Tex.render(E.lhs, { strict: true });
        for (const m of E.mistakes || []) Expr.parse(String(m.expr), { vars, allowC: E.mode === 'constant' });
      }
      if (q.type === 'numeric' && q.numeric && typeof q.numeric.answer === 'string') {
        const v = Expr.number(q.numeric.answer);
        if (!Number.isFinite(v)) throw new Error(`numeric answer "${q.numeric.answer}" is not a number`);
        q.numeric.answerHtml = Tex.render(q.numeric.answerTex || Expr.toTex(Expr.parse(q.numeric.answer, { vars: [] })), { strict: true });
        q.numeric.value = v;
      }
    } catch (e) { problems.push(`questions/${topicId}.json [${q.id}]: ${e.message}`); }
  }
  return bank;
}

/* An interval item's key as TeX (AP® Calculus BC; docs/apcalcbc-architecture.md,
   "interval items"): "[1, 5)", "(-\infty, \infty)", "x = 2 \text{ only}". An
   endpoint is a number or an exact value in the student syntax ("sqrt(3)"). */
export function intervalTex(I) {
  const v = I.var || 'x';
  const end = e => /^-?(inf|infinity)$/i.test(String(e).trim()) ? (String(e).trim().startsWith('-') ? '-\\infty' : '\\infty') : Expr.toTex(Expr.parse(String(e), { vars: [] }));
  if (I.point !== undefined) return `${v} = ${end(I.point)} \\text{ only}`;
  if (/^-(inf|infinity)$/i.test(String(I.lo).trim()) && /^(inf|infinity)$/i.test(String(I.hi).trim())) return '(-\\infty, \\infty)';
  return `${I.loIn ? '[' : '('}${end(I.lo)}, ${end(I.hi)}${I.hiIn ? ']' : ')'}`;
}

/* Free lessons (structured data and the runtime gate agree on this):
   Units 1 and 2, and every math-skills topic. */
export function isFreeTopic(map, t) {
  const ch = map.chapterById(t.chapter);
  if (FREE_UNITS.includes(t.chapter) || COURSE.freeTopics.includes(t.id)) return true;
  return !!(ch && ch.part !== 'course');
}

/* ------------------------------------------------------------- the head */

const REFERS_BACK = /^(That|This|These|Those|It|Its|They|Their|Them|So|But|And|Or|Then|Here|There|Both|Each|Such|Now|Also|Yet|Instead|Because|Which|We)\b/;
/* Whole sentences that fit, else the fallback (as scripts/lib/anp-build.mjs). */
export function clampDesc(s, fallback) {
  s = text(s);
  if (s.length <= 158) return s;
  const sentences = s.split(/(?<=[.!?])\s+(?=[A-Z0-9(])/);
  for (let i = 0; i < Math.min(3, sentences.length); i++) {
    if (i && REFERS_BACK.test(sentences[i])) continue;
    let out = '';
    for (const sentence of sentences.slice(i)) {
      const next = out ? `${out} ${sentence}` : sentence;
      if (next.length > 158) break;
      out = next;
    }
    if (out.length >= 70) return out;
  }
  if (fallback) return clampDesc(fallback);
  return s.slice(0, 157).replace(/\s+\S*$/, '') + '…';
}
/* Meta descriptions never carry the mark (spec decision 3). */
export const stripMark = s => String(s).replace(/\bAP®?\s*/g, '').replace(/\s+/g, ' ').trim();

export const NOINDEX = '<meta name="robots" content="noindex, follow">';

/* depth: '' for pages in calculus/, '../' one folder down. */
/* canonical: another page's URL, when this one renders the same source. AP®
   Calculus BC's lesson and notes pages for AB topics name the AB page, so search
   engines index one copy (docs/apcalcbc-architecture.md, "One source"). */
export function head({ title, desc, path, depth, ogType = 'article', jsonld, meta = '', noindex = false, book = false, canonical }) {
  const url = canonical || `${SITE}${BASE}${path}`;
  const up = depth + '../';
  desc = stripMark(desc);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>try{var t=localStorage.getItem("nremt_theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark");}catch(e){}</script>
<link rel="preload" href="/assets/fonts/nunito-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="icon" href="${up}assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}assets/icon-180.png">
<link rel="manifest" href="${depth}manifest.json">
<meta name="theme-color" content="#16332E">
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? `${NOINDEX}\n` : ''}<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="LevlPrep">
<meta property="og:image" content="${SITE}${BASE}assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${meta}<link rel="stylesheet" href="${up}assets/theme.css">
<script src="${up}assets/errors.js" defer></script>
<script src="${up}assets/account.js" defer></script>
<script src="${up}assets/hub-progress.js" defer></script>
<script src="${up}assets/chime.js" defer></script>
<script src="${up}assets/site-chrome.js" defer></script>
${book ? `<link rel="stylesheet" href="${up}assets/course/base.css">
<link rel="stylesheet" href="${up}assets/course/book.css">
` : ''}<link rel="stylesheet" href="${RT(depth)}calc.css">${IS_BC ? `\n<link rel="stylesheet" href="${depth}assets/cbc.css">` : ''}
<link rel="stylesheet" href="${up}assets/fonts/fonts.css">
<!-- levlprep-structured-data -->
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>`;
}

/* The scripts every course page ends with. premium loads the site's Premium
   module first on pages with a Premium surface; ApCalcCore does without it. */
/* BC pages tell the shared runtime which course they are (AB pages set
   nothing, so AB's runtime keeps its own defaults): window.ApCalcCourse =
   { key, name, dir, rt (the path to AB's folder, for runtime files the
   runtime loads itself), pfx (id prefixes), frqTypes, band, score, ... }.
   Set by courseConfig() in build-apcalc.mjs through setCourseConfig(). */
let COURSE_CONFIG = null;
export const setCourseConfig = c => { COURSE_CONFIG = c; };
/* A runtime file (calc-*.js, pages/, tools/ framework) or a file of this
   course (its curriculum, a BC trainer's own script)? BC trainers' scripts
   live in calculus-bc/assets/tools/ (OWN_TOOL). */
const OWN_FILES = new Set(['calc-curriculum.js', 'cbc-interval.js']);
export const OWN_TOOL = new Set();
const srcFor = (depth, f) => OWN_FILES.has(f) || OWN_TOOL.has(f) ? `${depth}assets/${f}` : `${RT(depth)}${f}`;
export function tail({ depth, section, extra = [], premium = false, site = [] }) {
  const s = src => `<script src="${srcFor(depth, src)}" defer></script>`;
  const cfg = IS_BC && COURSE_CONFIG ? ` window.ApCalcCourse = ${JSON.stringify({ ...COURSE_CONFIG, rt: `${depth}${COURSE.runtime}` }).replace(/</g, '\\u003c')};` : '';
  return [
    ...['report-question.js', ...site].map(f => `<script src="${depth}../assets/${f}" defer></script>`),
    ...(premium ? [`<script src="${depth}../assets/premium.js" defer></script>`] : []),
    `<script>window.ApCalcSection = '${section}'; window.ApCalcBase = '${depth}';${cfg}</script>`,
    s('calc-curriculum.js'), s('calc-core.js'), s('calc-nav.js'),
    `<script src="${depth}../assets/course/glossary-tip.js" data-glossary="${depth}assets/glossary.json" data-course-root="${depth}" defer></script>`,
    // The question engine needs the expression parser and the math renderer.
    // BC adds its interval answers (calculus-bc/assets/cbc-interval.js) before the engine.
    ...extra.flatMap(f => f === 'calc-questions.js' ? ['calc-expr.js', 'calc-math.js', ...(IS_BC ? ['cbc-interval.js'] : []), f] : [f]).map(s),
  ].join('\n');
}

export function crumbs(items) {
  return { '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })) };
}
export const orgCrumbs = extra => [{ name: 'LevlPrep', url: `${SITE}/` }, { name: COURSE_NAME, url: `${SITE}${BASE}` }, ...extra];
export function crumbNav(items) {
  return `<nav class="calc-crumb calc-nav-ref" aria-label="Breadcrumb">${items.map((it, i) =>
    i === items.length - 1 ? `<span aria-current="page">${esc(it.name)}</span>`
      : `<a href="${it.href}">${esc(it.name)}</a> <span aria-hidden="true">&rsaquo;</span>`).join(' ')}</nav>`;
}

/* Beta until an AP® Calculus AB teacher signs off (docs/apcalc-needs-author.md,
   teacher-review). calc-nav-ref: a label, not teaching. */
/* The Beta label is gone (Olivier, 2026-10-26); the export stays so the pages that place it need no change. */
export const BETA_PILL = '';

/* "Report a problem" for a page, through the site dialog (assets/report-question.js). */
export const reportButton = (pageId) => `<button type="button" class="report-btn" data-report-kind="page" data-report-course="${COURSE_KEY}" data-report-question="${esc(pageId)}">Report a problem</button>`;

/* Every page: the Beta note, the trademark disclaimer and Report a problem
   (spec section 1, "Quality" and "Trademark"; site rules apcalc-trademark and
   apcalc-beta-and-report). */
export function footer(depth, pageId) {
  return `<footer class="calc-foot xshell">
  <p class="calc-accuracy-note">${BETA_PILL} ${esc(BETA_NOTE)} It follows the published course framework and open textbooks, listed on the <a href="${depth}../sources.html">Sources</a> page. Spot a mistake? <span class="calc-nav-ref">${reportButton(pageId)}</span></p>
  <p class="calc-disclaimer">${esc(DISCLAIMER)}</p>
  <p class="privacy-link"><a href="${depth}../privacy.html">Privacy</a> &middot; <a href="${depth}../terms.html">Terms</a> &middot; <a href="${depth}../about.html">About</a> &middot; <a href="${depth}../sources.html">Sources</a> &middot; <a href="${depth}../premium.html">Premium</a> &middot; <a href="${depth}../account.html">Account</a> &middot; <a href="mailto:hello@levlprep.com">Contact</a></p>
</footer>`;
}

/* ------------------------------------------------------------ glossary */

const termRe = t => new RegExp(`(?<![A-Za-z0-9-])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9-])`, /^[A-Z0-9]+$/.test(t) ? 'g' : 'gi');
/* Every term and alias of every concept with a definition, longest first. */
export function termIndex(C) {
  const out = [];
  for (const c of C.map.concepts) {
    if (!C.glossary[c.id]) continue;
    for (const t of [c.term, ...c.aliases]) if (t && t.length > 1) out.push({ t, id: c.id, re: termRe(t) });
  }
  return out.sort((a, b) => b.t.length - a.t.length);
}

const SKIP_TAGS = new Set(['a', 'script', 'style', 'svg', 'math', 'h1', 'h2', 'h3', 'code', 'button', 'summary', 'figcaption', 'th', 'label', 'title', 'nav', 'caption']);
const VOID = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'ellipse', 'wbr']);

/* Marks the first use of each defined term on a page: a link to the notes
   page that teaches it when that page is built, else a hover span. */
export function glossify(C, html, { depth, topic, seen, index }) {
  const parts = String(html).split(/(<[^>]+>)/);
  const stack = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith('<')) {
      const m = p.match(/^<\s*(\/)?\s*([a-zA-Z0-9]+)/);
      if (m) {
        const tag = m[2].toLowerCase();
        if (m[1]) { const k = stack.lastIndexOf(tag); if (k > -1) stack.length = k; }
        else if (!/\/>$/.test(p) && !VOID.has(tag)) stack.push(tag);
      }
      continue;
    }
    if (!p.trim() || stack.some(t => SKIP_TAGS.has(t))) continue;
    let s = p;
    const marks = [];
    for (const { id, re } of index) {
      if (seen.has(id)) continue;
      re.lastIndex = 0;
      const m = re.exec(s);
      if (!m) continue;
      const start = m.index, end = start + m[0].length;
      if (marks.some(k => start < k.end && end > k.start)) continue;
      seen.add(id);
      marks.push({ start, end, id, word: m[0] });
    }
    marks.sort((a, b) => b.start - a.start);
    for (const k of marks) {
      const c = C.map.concepts.find(x => x.id === k.id);
      const href = c && C.built.has(c.taughtIn) && c.taughtIn !== topic ? `${depth}notes/${c.taughtIn}.html` : null;
      const tag = href ? `<a class="gl" href="${href}" data-c="${k.id}">${k.word}</a>` : `<span class="gl" tabindex="0" data-c="${k.id}">${k.word}</span>`;
      s = s.slice(0, k.start) + tag + s.slice(k.end);
    }
    parts[i] = s;
  }
  return parts.join('');
}

/* ------------------------------------------------------------- figures */

/* Figures: our own SVGs, or a public-domain image with its source. No
   OpenStax material in this course (docs/apcalc-spec.md decision 4). */
export const ALLOWED_LICENSES = ['Public domain', 'LevlPrep original'];
const LICENSE_URL = { 'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/' };

/* { text, html } credit for a figure as shown; adapted when labels are hidden. */
export function attribution(f, { adapted = false } = {}) {
  if (!f) return { text: '', html: '' };
  const ad = adapted ? ' Adapted: labels hidden.' : '';
  if (f.source === 'levlprep') return { text: 'LevlPrep original diagram.', html: 'LevlPrep original diagram.' };
  if (!f.credit) return { text: '', html: '' };
  const lic = LICENSE_URL[f.license] ? `<a href="${LICENSE_URL[f.license]}" rel="license">${esc(f.license)}</a>` : esc(f.license);
  return { text: `${f.credit} (${f.license}).${ad}`, html: `${esc(f.credit)} (${lic}).${ad}` };
}

/* One figure's markup: an <img> for raster or SVG files, with masks for
   labelled figures when asked. */
export function figureImg(C, figId, depth, { masks = false } = {}) {
  const f = C.figures[figId];
  if (!f) return '';
  const W = f.w || 800, H = f.h || 600;
  const labels = (f.labels || []).filter(l => l.box);
  const pct = (v, of) => (100 * v / of).toFixed(2) + '%';
  const maskHtml = masks ? labels.map(l => `<button type="button" class="calc-mask" data-label="${esc(l.id)}" aria-label="Hidden label: ${esc(l.name)}. Select to reveal." style="left:${pct(l.box[0], W)};top:${pct(l.box[1], H)};width:${pct(l.box[2], W)};height:${pct(l.box[3], H)}"><span>${esc(l.name)}</span></button>`).join('') : '';
  return `<div class="calc-figimg${maskHtml ? ' has-masks' : ''}" data-fig="${esc(figId)}"><img src="${figureDir(f, depth)}${figId}.${f.ext || 'svg'}" alt="${esc(f.alt)}" width="${W}" height="${H}" loading="lazy" decoding="async">${maskHtml}</div>`;
}
export const credit = (f, opts) => { const a = attribution(f, opts); return a.html ? `<span class="calc-credit">${a.html}</span>` : ''; };

/* Numbers every <figure> on a page and fills <figure data-fig> with its image. */
export function renderFigures(C, html, depth) {
  let n = 0;
  return String(html).replace(/<figure\b([^>]*)>([\s\S]*?)<\/figure>/g, (all, attrs, inner) => {
    n++;
    const fig = (attrs.match(/\bdata-fig="([^"]+)"/) || [])[1];
    const cap = ((inner.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || '').replace(/^\s*(<b>)?\s*Figure\s+\d+[.:]?\s*(<\/b>)?\s*/i, '');
    const body = fig ? figureImg(C, fig, depth) : inner.replace(/<figcaption>[\s\S]*?<\/figcaption>/, '');
    const cr = fig ? ' ' + credit(C.figures[fig]) : '';
    const rest = attrs.replace(/\bdata-fig="[^"]*"/, '').replace(/\bclass="[^"]*"/, '');
    return `<figure${rest} class="calc-figure">${body}<figcaption><b>Figure ${n}.</b> ${cap}${cr}</figcaption></figure>`;
  });
}

/* ---------------------------------------------------- charts (stimuli) */

/* A small, accessible chart drawn at build time from data, so a graph
   stimulus is authored as numbers, not as a picture:
   { type: "line"|"bar", x: { label, unit?, categories? }, y: { label, unit?, min?, max?, step? },
     series: [{ name, points: [[x, y, err?], ...], line?: false, markers?: false }] }
   err draws an error bar (±err). The SVG is role="img" with a label; the
   data table follows in a <details> for screen readers and for checking. */
const SERIES_CLASS = ['s1', 's2', 's3', 's4', 's5'];
const fmt = v => (Math.round(v * 1000) / 1000).toString();
export function chartSvg(spec, title = '') {
  const W = 560, H = 320, L = 64, R = 18, T = 18, B = 58;
  const pw = W - L - R, ph = H - T - B;
  const series = spec.series || [];
  const isBar = spec.type === 'bar';
  const cats = isBar ? (spec.x.categories || [...new Set(series.flatMap(s => s.points.map(p => p[0])))]) : null;
  const ys = series.flatMap(s => s.points.flatMap(p => [p[1] + (p[2] || 0), p[1] - (p[2] || 0)]));
  const yMin = spec.y.min ?? Math.min(0, ...ys), yMax = spec.y.max ?? Math.max(...ys) * 1.1;
  const step = spec.y.step || niceStep((yMax - yMin) / 5);
  const sy = v => T + ph - (v - yMin) / (yMax - yMin) * ph;
  let xs, sx;
  if (!isBar) {
    const xv = series.flatMap(s => s.points.map(p => p[0]));
    const xMin = spec.x.min ?? Math.min(...xv), xMax = spec.x.max ?? Math.max(...xv);
    sx = v => L + (v - xMin) / ((xMax - xMin) || 1) * pw;
    const xstep = spec.x.step || niceStep((xMax - xMin) / 6);
    xs = []; for (let v = xMin; v <= xMax + 1e-9; v += xstep) xs.push(v);
  }
  const yt = []; for (let v = Math.ceil(yMin / step) * step; v <= yMax + 1e-9; v += step) yt.push(v);
  const axisLabel = a => esc(a.label + (a.unit ? ` (${a.unit})` : ''));
  const parts = [];
  parts.push(`<line class="axis" x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}"/><line class="axis" x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}"/>`);
  for (const v of yt) parts.push(`<line class="grid" x1="${L}" y1="${sy(v).toFixed(1)}" x2="${L + pw}" y2="${sy(v).toFixed(1)}"/><text class="tick" x="${L - 8}" y="${(sy(v) + 4).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`);
  if (isBar) {
    const gw = pw / cats.length, bw = Math.min(46, gw * 0.7 / Math.max(1, series.length));
    cats.forEach((c, ci) => {
      parts.push(`<text class="tick" x="${(L + gw * (ci + 0.5)).toFixed(1)}" y="${T + ph + 18}" text-anchor="middle">${esc(c)}</text>`);
      series.forEach((s, si) => {
        const p = s.points.find(q => q[0] === c);
        if (!p) return;
        const x = L + gw * (ci + 0.5) - bw * series.length / 2 + bw * si;
        parts.push(`<rect class="bar ${SERIES_CLASS[si % SERIES_CLASS.length]}" x="${x.toFixed(1)}" y="${sy(Math.max(p[1], 0)).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${Math.abs(sy(p[1]) - sy(0)).toFixed(1)}"/>`);
        if (p[2]) parts.push(errBar(x + (bw - 4) / 2, sy(p[1] + p[2]), sy(p[1] - p[2])));
      });
    });
  } else {
    for (const v of xs) parts.push(`<text class="tick" x="${sx(v).toFixed(1)}" y="${T + ph + 18}" text-anchor="middle">${fmt(v)}</text>`);
    series.forEach((s, si) => {
      const cls = SERIES_CLASS[si % SERIES_CLASS.length];
      // A series may set line: false (measured data: points only, never dot to dot)
      // or markers: false (a fitted line: no points that look like data).
      if (s.line !== false) parts.push(`<polyline class="series ${cls}" points="${s.points.map(p => `${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join(' ')}"/>`);
      for (const p of s.points) {
        if (s.markers === false && !p[2]) continue;
        parts.push(si % 2 ? `<rect class="pt ${cls}" x="${(sx(p[0]) - 4).toFixed(1)}" y="${(sy(p[1]) - 4).toFixed(1)}" width="8" height="8"/>` : `<circle class="pt ${cls}" cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="4.5"/>`);
        if (p[2]) parts.push(errBar(sx(p[0]), sy(p[1] + p[2]), sy(p[1] - p[2])));
      }
    });
  }
  parts.push(`<text class="lbl" x="${L + pw / 2}" y="${H - 12}" text-anchor="middle">${axisLabel(spec.x)}</text>`);
  parts.push(`<text class="lbl" transform="translate(16 ${T + ph / 2}) rotate(-90)" text-anchor="middle">${axisLabel(spec.y)}</text>`);
  const legend = series.length > 1 ? `<p class="calc-legend">${series.map((s, si) => `<span class="${SERIES_CLASS[si % SERIES_CLASS.length]}"><i aria-hidden="true"></i>${esc(s.name)}</span>`).join('')}</p>` : '';
  const label = `${title ? `${title}: ` : ''}${isBar ? 'bar' : 'line'} graph of ${text(spec.y.label)} against ${text(spec.x.label)}${series.length > 1 ? ` for ${series.map(s => s.name).join(', ')}` : ''}. The data table follows.`;
  const anyErr = series.some(s => s.points.some(p => p[2]));
  const xHead = axisLabel(spec.x);
  const table = `<details class="calc-chart-data"><summary>Data table</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Data table"><table><thead><tr><th scope="col">${xHead}</th>${series.map(s => `<th scope="col">${esc(s.name || text(spec.y.label))}${anyErr ? ' (± error)' : ''}</th>`).join('')}</tr></thead><tbody>${
    [...new Set(series.flatMap(s => s.points.map(p => p[0])))].map(x => `<tr><th scope="row">${esc(x)}</th>${series.map(s => { const p = s.points.find(q => q[0] === x); return `<td>${p ? fmt(p[1]) + (p[2] ? ` ± ${fmt(p[2])}` : '') : '—'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  return `<div class="calc-chart"><svg class="calc-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${parts.join('')}</svg>${legend}${table}</div>`;
}
function errBar(x, y1, y2) {
  return `<path class="err" d="M${x.toFixed(1)} ${y1.toFixed(1)}V${y2.toFixed(1)}M${(x - 5).toFixed(1)} ${y1.toFixed(1)}h10M${(x - 5).toFixed(1)} ${y2.toFixed(1)}h10"/>`;
}
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * p) return m * p;
  return 10 * p;
}

/* ------------------------------------------------------------ stimuli */

export function tableHtml(t) {
  const cap = t.caption ? `<caption>${t.caption}</caption>` : '';
  return `<table class="calc-data">${cap}<thead><tr>${t.cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map((v, i) => i === 0 ? `<th scope="row">${v}</th>` : `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

/* The body of a stimulus panel, as HTML, from its authored form:
   { kind, title, text?, html? | table? | figure? | chart? }. Built once and
   carried in the bank, so the runtime only places it. depth is the path from
   the page to calculus/ (the bank uses '' and the runtime prefixes ApCalcBase). */
export function stimulusBody(C, s, depth = '') {
  const out = [];
  if (s.text) out.push(`<div class="calc-stim-text">${s.text}</div>`);
  // Wrapped here, not only by the page generator: the bank and page data carry
  // this HTML to the runtime, which places it as is.
  if (s.table) out.push(`<div class="table-wrap" tabindex="0" role="region" aria-label="${esc(text(s.table.caption || s.title || 'Data table'))}">${tableHtml(s.table)}</div>`);
  if (s.plot) out.push(`<div class="calc-plot-wrap">${Plot.svg(s.plot)}</div>`);
  if (s.chart) out.push(chartSvg(s.chart, s.title));
  if (s.figure && C.figures[s.figure]) out.push(`<figure class="calc-figure">${figureImg(C, s.figure, depth)}<figcaption>${credit(C.figures[s.figure])}</figcaption></figure>`);
  if (s.html) out.push(`<div class="calc-stim-html">${s.html}</div>`);
  return out.join('');
}
export const STIM_KIND = { table: 'Table', graph: 'Graph', diagram: 'Diagram' };
export function stimulusPanel(id, s, bodyHtml) {
  return `<section class="calc-stim" data-stim="${esc(id)}" aria-labelledby="stim-${esc(id)}"><p class="calc-stim-k">${STIM_KIND[s.kind] || 'Stimulus'}</p><h3 id="stim-${esc(id)}">${s.title || ''}</h3>${bodyHtml}</section>`;
}

/* ---------------------------------------------------------- questions */

/* A question as a page or the bank carries it. unit, topic and practice are
   copied from the item itself: never inferred (spec section 1). */
export function questionForPage(q) {
  return {
    id: q.id, type: q.type, unit: q.unit, topic: q.topic, practice: q.practice, level: q.level, diff: q.diff,
    ...(q.stimulus ? { stimulus: q.stimulus } : {}), ...(q.fixed ? { fixed: true } : {}),
    ...(q.calc ? { calc: true } : {}),
    q: q.q, options: q.options, correct: q.correct, numeric: q.numeric, expr: q.expr, variables: q.variables, why: q.why,
    ...(q.interval ? { interval: q.interval } : {}),
  };
}

const PRED = { up: 'increases', down: 'decreases', none: 'no change' };
/* A numeric key as it should be written, the same rule as formatKey in
   calculus/assets/calc-questions.js: a calculator answer to three decimal
   places (the exam rule), an exact key as rendered math with its decimal. */
export function formatKey(N, calc = false) {
  const v = N.value != null ? N.value : Number(N.answer);
  const unit = N.unit ? ` ${esc(N.unit)}` : '';
  if (N.answerHtml) return `${N.answerHtml}${Number.isInteger(v) ? '' : ` ≈ ${v.toFixed(3)}`}${unit}`;
  if (calc) return `${v.toFixed(3)}${unit}`;
  return `${+v.toPrecision(12)}${unit}`;
}
/* The question as static HTML, readable without JavaScript; calc-questions.js
   swaps in the live version. */
export function questionHtml(q, n) {
  let opts = '', key = '';
  if (q.type === 'predict') {
    opts = `<table class="calc-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Change</th></tr></thead><tbody>${q.variables.map(v => `<tr><th scope="row">${v.name}</th><td>—</td></tr>`).join('')}</tbody></table>`;
    key = q.variables.map(v => `<li><b>${v.name}: ${PRED[v.answer]}.</b> ${v.why || ''}</li>`).join('');
  } else if (q.type === 'numeric') {
    const u = q.numeric.unit ? ` ${esc(q.numeric.unit)}` : '';
    opts = `<p class="calc-small">${q.calc ? 'Calculator allowed. Give the answer correct to three decimal places' : 'No calculator. Type the exact value (a fraction, π, e or a root is fine)'}${q.numeric.askUnit ? ', then its unit.' : u ? `, in${u}.` : '.'}</p>`;
    key = `<li>Answer: ${formatKey(q.numeric, q.calc)}</li>`;
  } else if (q.type === 'interval') {
    opts = '<p class="calc-small">Type the interval, in interval notation such as [1, 5) or as an inequality such as 1 &le; x &lt; 5.</p>';
    key = `<li>Answer: ${q.interval.answerHtml || esc(intervalTex(q.interval))}</li>`;
  } else if (q.type === 'expr') {
    opts = `<p class="calc-small">Type an expression${q.expr.lhs ? ` for ${q.expr.lhsHtml || esc(q.expr.lhs)}` : ''}.</p>`;
    key = `<li>Answer: ${q.expr.lhsHtml ? `${q.expr.lhsHtml} ` : ''}${q.expr.answerHtml || esc(q.expr.answer)}</li>`;
  } else {
    opts = `<ol class="calc-opts">${(q.options || []).map(o => `<li>${o}</li>`).join('')}</ol>`;
    key = q.type === 'order'
      ? `<li>Correct order: ${q.options.map((o, i) => `${i + 1}. ${o}`).join(' ')}</li>`
      : (q.options || []).map((o, i) => `<li>${[].concat(q.correct).includes(i) ? '<b>Correct:</b> ' : ''}${o}: ${((q.why || {}).options || [])[i] || ''}</li>`).join('');
  }
  return `<div class="calc-q" data-qid="${esc(q.id)}"><p class="calc-q-stem"><span class="calc-q-n">${n}.</span> ${q.q}</p>${opts}<details class="calc-q-key"><summary>Show the answer</summary>${q.why && q.why.correct ? `<p>${q.why.correct}</p>` : ''}<ul>${key}</ul></details></div>`;
}

/* Consecutive items sharing a stimulus, in authored order:
   [{ stimulus: id|null, items: [...] }]. */
export function groupSets(items) {
  const out = [];
  for (const q of items) {
    const last = out[out.length - 1];
    if (q.stimulus && last && last.stimulus === q.stimulus) last.items.push(q);
    else out.push({ stimulus: q.stimulus || null, items: [q] });
  }
  return out;
}
