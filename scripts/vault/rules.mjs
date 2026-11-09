/* Which published pages are Premium, so the deploy keeps them off the public
   site and in the Worker's private vault (docs/premium-vault.md).

   The rule is the one each page already follows in the browser, read from the
   page itself, so the vault and the lock can never disagree:
   - AP courses: the page's <script id="*-page-data"> JSON says "free".
   - NREMT and organic chemistry: the page's data-chapter, against that
     course's freeChapters in assets/premium.js.
   - A&P: the page's data-topic, whose chapter (AnpCurriculum) is checked the same way.
   Only interactive lesson pages are vaulted. FRQs, unit tests and exams are
   shared with the free exam and the free samples, so they stay as they are. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

function runBrowserScript(file, extra = {}) {
  const store = new Map();
  const ls = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const doc = { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
    createElement: () => ({ setAttribute() {}, appendChild() {}, style: {} }), documentElement: { setAttribute() {}, getAttribute: () => null },
    head: { appendChild() {} }, body: null, readyState: 'loading', cookie: '' };
  const win = { localStorage: ls, sessionStorage: ls, document: doc, location: { href: 'https://levlprep.com/', pathname: '/', search: '', hostname: 'levlprep.com' },
    addEventListener() {}, removeEventListener() {}, setTimeout() {}, clearTimeout() {}, setInterval() {}, matchMedia: () => ({ matches: false, addListener() {} }),
    navigator: { userAgent: 'node' }, fetch: () => new Promise(() => {}), ...extra };
  win.window = win; win.self = win;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), win, { filename: file });
  return win;
}

let cache = null;
function context() {
  if (cache) return cache;
  const premium = runBrowserScript('assets/premium.js').LevlPremium;
  if (!premium || !premium.COURSES) throw new Error('vault: could not read COURSES from assets/premium.js');
  const anp = runBrowserScript('anatomy-physiology/assets/anp-curriculum.js').AnpCurriculum;
  const anpChapter = {};
  for (const t of (anp && anp.topics) || []) anpChapter[t.id] = t.chapter;
  if (!Object.keys(anpChapter).length) throw new Error('vault: could not read AnpCurriculum topics');
  cache = { COURSES: premium.COURSES, anpChapter };
  return cache;
}

function freeChapter(course, ch) {
  const c = context().COURSES[course];
  if (!c) throw new Error(`vault: course ${course} is not in assets/premium.js COURSES`);
  return !!ch && (c.freeChapters || []).includes(ch);
}

const AP = {
  bio: 'apbio', chem: 'apchem', physics: 'apphys', calculus: 'apcalc', 'calculus-bc': 'apcalcbc', statistics: 'apstat',
  'environmental-science': 'apenv', psychology: 'appsych', precalculus: 'apprecalc', macroeconomics: 'apmacro',
};

/* rel: a path relative to the repo root, with forward slashes. Returns the
   course key when the page is a Premium lesson, else null. Throws when a page
   that should carry its marker does not, so a new page type fails the deploy
   instead of going out unlocked or locked by mistake. */
export function premiumCourse(rel, html) {
  const parts = rel.split('/');
  const dir = parts[0];
  const kind = parts[1];
  if (parts.length !== 3 || !rel.endsWith('.html')) return null;

  if (AP[dir] && kind === 'lessons') {
    const m = /<script type="application\/json" id="[a-z]+-page-data">\s*\{[\s\S]{0,600}?"free":(true|false)/.exec(html);
    if (!m) throw new Error(`vault: ${rel} has no "free" in its page data`);
    return m[1] === 'true' ? null : AP[dir];
  }
  if ((dir === 'ochem' && (kind === 'lessons' || kind === 'mechanisms')) || (dir === 'nremt' && kind === 'lessons')) {
    const course = dir;
    const m = /data-chapter="([^"]+)"/.exec(html);
    if (!m) throw new Error(`vault: ${rel} has no data-chapter`);
    return freeChapter(course, m[1]) ? null : course;
  }
  if (dir === 'anatomy-physiology' && kind === 'lessons') {
    const m = /data-topic="([^"]+)"/.exec(html);
    if (!m) throw new Error(`vault: ${rel} has no data-topic`);
    const ch = context().anpChapter[m[1]];
    if (!ch) throw new Error(`vault: ${rel} topic ${m[1]} is not in AnpCurriculum`);
    return freeChapter('anp', ch) ? null : 'anp';
  }
  return null;
}
