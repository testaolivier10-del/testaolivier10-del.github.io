#!/usr/bin/env node
/* The guided study path's data, one file per course: assets/path/<course>.json
   (docs/guided-path.md). Everything is read from what each course already
   has, so nothing here is typed twice:

     AP® courses  <dir>/assets/<pfx>-curriculum.js   order, units, free flags
                  docs/<ap>-dependency-map.json      concepts -> prerequisites
     A&P          anatomy-physiology/assets/anp-curriculum.js, docs/anp-dependency-map.json
     Ochem        ochem/assets/curriculum.js (topic dependsOn)
     NREMT        nremt/assets/study-notes.json chapters (no prerequisite map yet)
     Free parts   assets/premium.js freeChapters; exam dates assets/exam-date.js DEFAULTS

   A prerequisite of topic A is a topic B, earlier in the course, that teaches
   at least two concepts A's own concepts depend on (or, where the map has
   only single links, the one within 6 topics); the 3 strongest links, with
   the concepts as the reason. Ochem's topics name their own dependsOn, so
   there the direct links are kept, minus any another link already implies.

   File shape (short keys, it is fetched on every path page):
     { v, key, kind, name, exam: { date, label } | null, progress, units: [{ id, label, title, w, f }],
       topics: [{ id, n, t, u, f, l, o, p: [[id, reason]], s: [words] }], review, exams, tests: { unitId: url } }
   u is the unit's index, f 1 when free, l the lesson URL, o the notes URL, both relative to the course
   folder (0 when there is none).

   node scripts/build-paths.mjs          write
   node scripts/build-paths.mjs --check  fail when a file is stale */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { COURSES } from './lib/courses.mjs';
import { loadModules, positions } from './lib/ochem-order.mjs';
import { loadChapters, chapterSlug } from './lib/nremt-notes.mjs';
import { loadLessons } from './lib/nremt-lessons.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const has = (p) => existsSync(join(ROOT, p));

function runBrowser(file, extra = {}) {
  const sandbox = { window: {}, document: { addEventListener() {}, querySelector() { return null; } },
    localStorage: { getItem: () => null, setItem() {} }, ...extra };
  vm.createContext(sandbox);
  vm.runInContext(read(file), sandbox, { filename: file });
  return JSON.parse(JSON.stringify(sandbox.window));
}

/* assets/premium.js: { course: freeChapters[] } and exam-date.js DEFAULTS. */
const premium = read('assets/premium.js');
function freeChapters(key) {
  const m = premium.match(new RegExp('\\n    ' + key + ': \\{[\\s\\S]*?freeChapters: \\[([^\\]]*)\\]'));
  if (!m) throw new Error(`assets/premium.js: no freeChapters for ${key}`);
  return m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
}
const examDefaults = (() => {
  const src = read('assets/exam-date.js');
  const m = src.match(/var DEFAULTS = (\{[\s\S]*?\n  \});/);
  return m ? vm.runInNewContext('(' + m[1].replace(/;$/, '') + ')') : {};
})();

const AP = {
  apbio: { file: 'bio/assets/bio-curriculum.js', g: 'ApBioCurriculum', maps: ['apbio'] },
  apchem: { file: 'chem/assets/chem-curriculum.js', g: 'ApChemCurriculum', maps: ['apchem'] },
  apphys: { file: 'physics/assets/phys-curriculum.js', g: 'ApPhysCurriculum', maps: ['apphys'] },
  apcalc: { file: 'calculus/assets/calc-curriculum.js', g: 'ApCalcCurriculum', maps: ['apcalc'] },
  apcalcbc: { file: 'calculus-bc/assets/calc-curriculum.js', g: 'ApCalcBCCurriculum', maps: ['apcalc', 'apcalcbc'] },
  apstat: { file: 'statistics/assets/stat-curriculum.js', g: 'ApStatCurriculum', maps: ['apstat'] },
  apenv: { file: 'environmental-science/assets/env-curriculum.js', g: 'ApEnvCurriculum', maps: ['apenv'] },
  appsych: { file: 'psychology/assets/psy-curriculum.js', g: 'ApPsychCurriculum', maps: ['appsych'] },
  apprecalc: { file: 'precalculus/assets/pcalc-curriculum.js', g: 'ApPrecalcCurriculum', maps: ['apprecalc'] },
  apmacro: { file: 'macroeconomics/assets/mac-curriculum.js', g: 'ApMacroCurriculum', maps: ['apmacro'] },
};

/* Concepts -> topic prerequisites. order: topic id -> position. A link's
   strength is how many of the topic's concepts lean on concepts taught in the
   other topic; one stray term (a single shared word) is not enough. */
function prereqsFromConcepts(concepts, order) {
  const teach = {}, byTopic = {};
  concepts.forEach((c) => { if (c.taughtIn) { teach[c.id] = c; (byTopic[c.taughtIn] = byTopic[c.taughtIn] || []).push(c); } });
  const res = {};
  Object.keys(order).forEach((tid) => {
    const cnt = new Map();
    (byTopic[tid] || []).forEach((c) => (c.dependsOn || []).forEach((d) => {
      const dc = teach[d];
      if (!dc || dc.taughtIn === tid || !(dc.taughtIn in order) || order[dc.taughtIn] >= order[tid]) return;
      const e = cnt.get(dc.taughtIn) || { n: 0, terms: [] };
      e.n++; if (!e.terms.includes(dc.term)) e.terms.push(dc.term);
      cnt.set(dc.taughtIn, e);
    }));
    const ranked = [...cnt.entries()].sort((a, b) => b[1].n - a[1].n || order[b[0]] - order[a[0]]);
    let kept = ranked.filter(([, e]) => e.n >= 2);
    // A sparse map (calculus, chemistry) links most topics by one concept: then
    // keep the one link that is close by, which is the topic it builds on.
    if (!kept.length) kept = ranked.filter(([id]) => order[tid] - order[id] <= 6).slice(0, 1);
    res[tid] = kept.slice(0, 3).map(([id, e]) => [id, e.terms.slice(0, 2).join(', ')]);
  });
  return res;
}
function prereqsFromTopics(dependsOn, order, title) {
  const direct = {};
  Object.keys(order).forEach((tid) => {
    const out = new Map();
    (dependsOn[tid] || []).forEach((d) => { if (d in order && order[d] < order[tid]) out.set(d, title[d]); });
    direct[tid] = out;
  });
  return reduce(direct, order);
}
function reduce(direct, order) {
  const reach = {};
  const reachOf = (t) => {
    if (reach[t]) return reach[t];
    const s = new Set(); reach[t] = s;
    direct[t].forEach((_, d) => { s.add(d); reachOf(d).forEach((x) => s.add(x)); });
    return s;
  };
  const res = {};
  Object.keys(direct).forEach((t) => {
    const ds = [...direct[t].keys()];
    const kept = ds.filter((b) => !ds.some((z) => z !== b && reachOf(z).has(b)));
    kept.sort((a, b) => order[b] - order[a]);
    res[t] = kept.slice(0, 3).map((b) => [b, direct[t].get(b)]);
  });
  return res;
}
function wordsFromConcepts(concepts) {
  const w = {};
  concepts.forEach((c) => {
    if (!c.taughtIn) return;
    const list = (w[c.taughtIn] = w[c.taughtIn] || []);
    [c.term].concat(c.aliases || []).forEach((x) => {
      const s = String(x).toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
      if (s && list.length < 24 && list.indexOf(s) < 0) list.push(s);
    });
  });
  return w;
}
const range = (w) => (Array.isArray(w) ? `${w[0]} to ${w[1]}%` : '');
const page = (dir, rel) => (has(`${dir}/${rel}`) ? rel : 0);

function buildAp(c) {
  const spec = AP[c.key];
  const cur = runBrowser(spec.file)[spec.g];
  if (!cur) throw new Error(`${spec.file}: no ${spec.g}`);
  const free = freeChapters(c.key);
  const units = cur.units.filter((u) => cur.topics.some((t) => t.unit === u.id && t.built !== false));
  const uIdx = {}; units.forEach((u, i) => { uIdx[u.id] = i; });
  const topics = cur.topics.filter((t) => t.built !== false && t.unit in uIdx);
  const order = {}; topics.forEach((t, i) => { order[t.id] = i; });
  const concepts = spec.maps.flatMap((m) => json(`docs/${m}-dependency-map.json`).concepts || []);
  const pre = prereqsFromConcepts(concepts, order);
  const words = wordsFromConcepts(concepts);
  const lesson = (id) => page(c.dir, `lessons/${id}.html`) || (c.key === 'apcalcbc' && has(`calculus/lessons/${id}.html`) ? `../calculus/lessons/${id}.html` : 0);
  const notes = (id) => page(c.dir, `notes/${id}.html`) || (c.key === 'apcalcbc' && has(`calculus/notes/${id}.html`) ? `../calculus/notes/${id}.html` : 0);
  const tests = {};
  units.forEach((u) => { const p = page(c.dir, `unit-tests/${u.id}.html`); if (p) tests[u.id] = p; });
  const ex = examDefaults[c.key];
  return {
    kind: 'ap', exam: ex ? { date: ex.date, label: ex.label.replace(/ \(.*\)$/, '') } : { date: null, label: 'AP® exam' },
    cram: has(`${c.dir}/cram.html`) ? 'cram.html' : null,
    progress: `${c.storagePrefix}progress_v1`,
    units: units.map((u) => ({ id: u.id, label: u.n ? `Unit ${u.n}` : 'Skills', title: u.title, w: range(u.weight),
      f: free.includes(u.id) || u.part === 'skills' ? 1 : 0 })),
    topics: topics.map((t) => ({ id: t.id, n: t.ced || '', t: t.title, u: uIdx[t.unit], f: t.free ? 1 : 0,
      l: lesson(t.id), o: notes(t.id), p: pre[t.id] || [], s: words[t.id] || [] })),
    tests,
  };
}

function buildAnp(c) {
  const cur = runBrowser('anatomy-physiology/assets/anp-curriculum.js').AnpCurriculum;
  const free = freeChapters('anp');
  const chapters = cur.chapters.slice().sort((a, b) => a.n - b.n)
    .filter((ch) => cur.topics.some((t) => t.chapter === ch.id && t.built !== false));
  const uIdx = {}; chapters.forEach((ch, i) => { uIdx[ch.id] = i; });
  const topics = cur.topics.filter((t) => t.built !== false && t.chapter in uIdx)
    .sort((a, b) => uIdx[a.chapter] - uIdx[b.chapter] || a.n - b.n);
  const order = {}; topics.forEach((t, i) => { order[t.id] = i; });
  const concepts = json('docs/anp-dependency-map.json').concepts || [];
  const pre = prereqsFromConcepts(concepts, order);
  const words = wordsFromConcepts(concepts);
  return {
    kind: 'anp', exam: { date: null, label: 'final exam' }, progress: 'anp_progress_v1',
    units: chapters.map((ch) => ({ id: ch.id, label: `Chapter ${ch.n}`, title: ch.title, w: '', f: free.includes(ch.id) ? 1 : 0 })),
    topics: topics.map((t) => ({ id: t.id, n: '', t: t.title, u: uIdx[t.chapter], f: free.includes(t.chapter) ? 1 : 0,
      l: page(c.dir, `lessons/${t.id}.html`), o: page(c.dir, `notes/${t.id}.html`), p: pre[t.id] || [], s: words[t.id] || [] })),
    tests: {},
  };
}

function buildOchem(c) {
  const MODULES = loadModules(ROOT);
  const pos = positions(MODULES);
  const free = freeChapters('ochem');
  const all = MODULES.flatMap((m, mi) => m.topics.map((t) => ({ ...t, mi })));
  const title = {}, dep = {}; all.forEach((t) => { title[t.id] = t.title; dep[t.id] = t.dependsOn || []; });
  const pre = prereqsFromTopics(dep, pos.topic, title);
  return {
    kind: 'ochem', exam: { date: null, label: 'final exam' }, progress: 'ochem_progress',
    units: MODULES.map((m, i) => ({ id: m.id, label: `Chapter ${i + 1}`, title: m.title, w: '', f: free.includes(m.id) ? 1 : 0 })),
    topics: all.map((t) => ({ id: t.id, n: '', t: t.title, u: t.mi, f: free.includes(MODULES[t.mi].id) ? 1 : 0,
      l: !t.notesOnly && t.href && has(`ochem/${t.href}`) ? t.href : 0, o: page(c.dir, `notes/${t.id}.html`),
      p: pre[t.id] || [], s: [] })),
    tests: {},
  };
}

function buildNremt(c) {
  const chapters = loadChapters(ROOT);
  const lessons = loadLessons(ROOT, chapters);
  const free = freeChapters('nremt');
  const groups = [];
  for (let i = 0; i < chapters.length; i += 8) {
    const a = chapters[i].num, b = chapters[Math.min(i + 7, chapters.length - 1)].num;
    groups.push({ id: `ch${a}-${b}`, label: `Chapters ${a} to ${b}`, title: chapters[i].title, w: '', f: free.includes(`ch${a}`) ? 1 : 0 });
  }
  return {
    kind: 'nremt', exam: { date: null, label: 'NREMT exam' }, progress: 'nremt_lessons_v1',
    units: groups,
    topics: chapters.map((ch, i) => {
      const L = lessons.find((x) => x.chapter === ch.num);
      return { id: `ch${ch.num}`, n: String(ch.num), t: ch.title, u: Math.floor(i / 8), f: free.includes(`ch${ch.num}`) ? 1 : 0,
        l: L && has(`nremt/lessons/${L.id}.html`) ? `lessons/${L.id}.html` : 0, o: page(c.dir, `notes/${chapterSlug(ch)}.html`),
        p: [], s: (ch.sections || []).map((s) => String(s.title).toLowerCase()).slice(0, 24), lessons: lessons.filter((x) => x.chapter === ch.num).map((x) => x.id) };
    }),
    tests: {},
  };
}

let stale = 0;
for (const c of COURSES) {
  const body = c.key in AP ? buildAp(c) : c.key === 'anp' ? buildAnp(c) : c.key === 'ochem' ? buildOchem(c) : c.key === 'nremt' ? buildNremt(c) : null;
  if (!body) throw new Error(`build-paths: no builder for course ${c.key}`);
  const data = { v: 1, key: c.key, name: c.name, dir: c.dir, prefix: c.storagePrefix, ...body,
    review: page(c.dir, 'review.html'), exams: page(c.dir, 'exams.html'), practice: page(c.dir, 'practice.html') };
  const out = JSON.stringify(data) + '\n';
  const file = `assets/path/${c.key}.json`;
  if (CHECK) {
    if (!has(file) || read(file) !== out) { console.error(`stale: ${file} (run node scripts/build-paths.mjs)`); stale++; }
  } else {
    mkdirSync(join(ROOT, 'assets/path'), { recursive: true });
    writeFileSync(join(ROOT, file), out);
    const withPre = data.topics.filter((t) => t.p.length).length;
    console.log(`${file}: ${data.units.length} units, ${data.topics.length} topics, ${withPre} with prerequisites, ${(out.length / 1024).toFixed(1)} KB`);
  }
}
if (stale) process.exit(1);
