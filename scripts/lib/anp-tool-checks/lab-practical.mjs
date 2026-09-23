/* Validator for the virtual lab practical's content,
   anatomy-physiology/data/tools/lab-practical.json (docs/anp-tools-contract.md,
   docs/anp-spec.md section 8.1). check(data, map) returns an array of error
   strings.

   The data file is the source of truth the page runs on, but its figures and
   label boxes are copies of the registered figure entries
   (data/figures/*.json) and the named labels (data/labels/<figure>.json). This
   check re-reads both, so any drift is caught: a label renamed, a box moved, a
   figure re-registered at another size, a new label added to a figure the tool
   uses.

   Scored items, stable forever:
     lab-practical:<set>:<figure>:<label>          name it / point to
     lab-practical:<set>:<figure>:<label>:follow   the follow-up question

   Checks: required fields; unique set ids and item ids; chapter, topic and
   core ids exist in the map, and a set's topic belongs to its chapter; every
   figure is registered with an allowed license, its image exists and its size,
   alt text and credit match the entry; every asked label matches the label
   file (id, name, box, concept, accepted answers drawn from the file's); the
   ordering rule (decision 30, laterLabel in scripts/lib/anp-build.mjs): a
   label whose concept is taught after the station's topic, whose printed name
   uses a later term, or that the label file marks "cover" (printed wrong or
   misleading) is never asked and is listed as covered with its exact box,
   and no asked label's name or explanation uses a term taught later; every
   label on the figure is asked, covered, or listed with a reason as shown
   (not a structure) or as a hint (masked in the quiz because it gives an
   answer away); every asked label explains
   itself; follow-up questions are well formed and never point at an option by
   letter or position. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPage, indexMap } from '../anp-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const COURSE = join(ROOT, 'anatomy-physiology');
const LEVELS = ['recall', 'apply', 'analyze'];
const LICENSES = ['CC BY 4.0', 'public domain', 'CC0'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LABEL_ID = /^[a-z0-9]+([-_][a-z0-9]+)*$/;

const POSITION_TELLS = [
  /\b(option|choice|answer)\s*\(?[A-Ea-e1-5]\)?(?![\w-])/,
  /\b(first|second|third|fourth|fifth|last|top|bottom)\s+(option|choice|answer)s?\b/i,
  /\b(options?|choices?|answers?)\s+(above|below)\b/i,
  /(^|\s)\(?[A-Ea-e]\)\s/,
  /\bthe (one|option) (above|below)\b/i,
];
const textOf = h => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const positionTell = s => POSITION_TELLS.some(re => re.test(textOf(s)));
const str = v => typeof v === 'string' && v.trim().length > 0;
const sameBox = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === 4 && b.length === 4 && a.every((v, i) => v === b[i]);
const norm = s => String(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

/* Terms taught after `topicId` that appear in `text`: the same scan the page
   check runs (scanPage), so a figure label or an explanation is held to the
   ordering rule exactly as a page is. */
const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function laterTerms(map, topicIndex, topicId, text) {
  if (topicIndex.get(topicId) === undefined) return [];
  return scanPage(map, `<p>${escHtml(textOf(text))}</p>`, topicId).map(p => p.replace(/^uses /, '').replace(/; teach it first.*$/, ''));
}

function registeredFigures() {
  const dir = join(COURSE, 'data', 'figures');
  const all = {};
  if (!existsSync(dir)) return all;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const obj = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const [k, v] of Object.entries(obj)) if (!(k in all)) all[k] = v;
  }
  return all;
}
function labelFile(fig) {
  const p = join(COURSE, 'data', 'labels', `${fig}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}
function openstaxPage(f) {
  return f.openstax && f.openstax.page
    ? `https://openstax.org/books/anatomy-and-physiology-2e/pages/${f.openstax.page}`
    : 'https://openstax.org/details/books/anatomy-and-physiology-2e';
}

export function check(data, map) {
  const errors = [];
  const err = (where, msg) => errors.push(`lab-practical ${where}: ${msg}`);
  if (!data || typeof data !== 'object') return ['lab-practical: data must be an object'];
  if (!Array.isArray(data.sets) || !data.sets.length) return ['lab-practical: data.sets must be a non-empty array'];
  if (!data.figures || typeof data.figures !== 'object') return ['lab-practical: data.figures must be an object'];

  const { topicIndex, concepts } = indexMap(map);
  const topics = new Map(map.topics.map(t => [t.id, t]));
  const chapters = new Set(map.chapters.map(c => c.id));
  const cores = new Set(map.coreConcepts.map(c => c.id));
  const registered = registeredFigures();
  const setIds = new Set();
  const itemIds = new Set();
  const usedFigures = new Set();
  // A label is covered for good when it names a concept taught after the
  // topic, when its printed name uses a later term, or when the label file
  // marks it "cover" (printed wrong or misleading): laterLabel in
  // scripts/lib/anp-build.mjs, the rule every lesson and notes page follows.
  const mustCover = (fl, topicId) => !!fl.cover || isLater(fl.concept, topicId) || laterTerms(map, topicIndex, topicId, fl.name).length > 0;
  const isLater = (conceptId, topicId) => {
    const c = conceptId && concepts.get(conceptId);
    return !!c && topicIndex.get(c.taughtIn) > topicIndex.get(topicId);
  };

  /* Figures the page draws: each must be a registered, cleared figure. */
  for (const [id, f] of Object.entries(data.figures)) {
    const where = `figure ${id}`;
    const reg = registered[id];
    if (!reg) { err(where, 'not registered in data/figures/*.json'); continue; }
    if (!LICENSES.includes(reg.license)) err(where, `license "${reg.license}" is not cleared for use (CC BY or public domain only)`);
    if (reg.source !== 'openstax' && reg.source !== 'levlprep') err(where, `unknown source "${reg.source}"`);
    const src = `figures/${id}.${reg.ext || 'jpg'}`;
    if (f.src !== src) err(where, `src must be "${src}"`);
    if (!existsSync(join(COURSE, src))) err(where, `image file ${src} is missing`);
    if (f.w !== reg.w || f.h !== reg.h) err(where, `size ${f.w}x${f.h} does not match the registered ${reg.w}x${reg.h}`);
    if (f.alt !== reg.alt) err(where, 'alt text does not match the registered entry');
    if (!str(f.alt)) err(where, 'alt text is missing');
    if (f.credit !== reg.credit || !str(f.credit)) err(where, 'credit does not match the registered entry');
    if (reg.source === 'openstax' && f.page !== openstaxPage(reg)) err(where, `page link must be ${openstaxPage(reg)}`);
    if (f.license !== reg.license) err(where, 'license does not match the registered entry');
  }

  data.sets.forEach((s, n) => {
    const where = `set ${s && s.id ? s.id : '#' + n}`;
    if (!s || typeof s !== 'object') { err(where, 'not an object'); return; }
    if (!str(s.id) || !SLUG.test(s.id)) err(where, 'id must be a lowercase slug');
    if (setIds.has(s.id)) err(where, 'duplicate set id');
    setIds.add(s.id);
    if (!str(s.title)) err(where, 'title is missing');
    if (!chapters.has(s.chapter)) err(where, `unknown chapter "${s.chapter}"`);
    const t = topics.get(s.topic);
    if (!t) err(where, `unknown topic "${s.topic}"`);
    else if (t.chapter !== s.chapter) err(where, `topic ${s.topic} is in chapter ${t.chapter}, not ${s.chapter}`);
    if (!Array.isArray(s.stations) || !s.stations.length) { err(where, 'stations must be a non-empty array'); return; }

    s.stations.forEach((st, k) => {
      const sw = `${where} station ${st && st.figure ? st.figure : '#' + k}`;
      if (!st || typeof st !== 'object') { err(sw, 'not an object'); return; }
      usedFigures.add(st.figure);
      const reg = registered[st.figure];
      if (!data.figures[st.figure]) err(sw, 'figure is not listed in data.figures');
      if (!reg) { err(sw, 'figure is not registered'); return; }
      if (!topics.has(st.topic)) err(sw, `unknown topic "${st.topic}"`);
      if (st.topic !== s.topic) err(sw, `station topic ${st.topic} differs from the set's topic ${s.topic}`);
      if (!Array.isArray(st.core) || !st.core.length) err(sw, 'core must list at least one core concept');
      else for (const c of st.core) if (!cores.has(c)) err(sw, `unknown core concept "${c}"`);
      const file = labelFile(st.figure);
      if (!file) { err(sw, `no data/labels/${st.figure}.json`); return; }
      if (file.figure !== st.figure) err(sw, `data/labels/${st.figure}.json names figure "${file.figure}"`);
      const fileLabels = new Map((file.labels || []).map(l => [l.id, l]));
      const asked = new Set(), covered = new Set();
      const W = reg.w, H = reg.h;

      if (!Array.isArray(st.labels) || !st.labels.length) err(sw, 'labels must be a non-empty array');
      (st.labels || []).forEach(lab => {
        const lw = `${sw} label ${lab && lab.id}`;
        if (!lab || !str(lab.id) || !LABEL_ID.test(lab.id)) { err(lw, 'id must be a lowercase slug'); return; }
        const iid = `lab-practical:${s.id}:${st.figure}:${lab.id}`;
        if (itemIds.has(iid)) err(lw, `duplicate item id ${iid}`);
        itemIds.add(iid);
        if (asked.has(lab.id)) err(lw, 'asked twice on one station');
        asked.add(lab.id);
        const fl = fileLabels.get(lab.id);
        if (!fl) { err(lw, `not in data/labels/${st.figure}.json (renamed or removed?)`); return; }
        if (!fl.box) err(lw, 'the label file has no box for it yet');
        if (!sameBox(lab.box, fl.box)) err(lw, `box ${JSON.stringify(lab.box)} does not match the label file's ${JSON.stringify(fl.box)}`);
        if (Array.isArray(lab.box) && (lab.box[0] < 0 || lab.box[1] < 0 || lab.box[0] + lab.box[2] > W + 1 || lab.box[1] + lab.box[3] > H + 1 || lab.box[2] <= 0 || lab.box[3] <= 0)) err(lw, 'box lies outside the image');
        if (lab.name !== fl.name) err(lw, `name "${lab.name}" does not match the label file's "${fl.name}"`);
        if ((lab.concept || null) !== (fl.concept || null)) err(lw, `concept "${lab.concept}" does not match the label file's "${fl.concept}"`);
        const fileAccept = new Set([norm(fl.name), ...(fl.accept || []).map(norm)]);
        if (!Array.isArray(lab.accept)) err(lw, 'accept must be an array');
        else for (const a of lab.accept) if (!fileAccept.has(norm(a))) err(lw, `accepted answer "${a}" is not in the label file`);
        if (lab.concept) {
          const c = concepts.get(lab.concept);
          if (!c) err(lw, `unknown concept "${lab.concept}"`);
          else if (lab.taught !== c.taughtIn) err(lw, `taught must be "${c.taughtIn}" (where ${lab.concept} is taught)`);
        } else if (lab.taught != null) err(lw, 'taught is set but the label has no concept');
        // The ordering rule: a later label is never asked.
        if (fl.cover) err(lw, 'the label file marks it "cover" (printed wrong or misleading): cover it instead of asking it');
        if (isLater(lab.concept, s.topic)) err(lw, `names ${lab.concept}, taught after ${s.topic}: cover it instead of asking it`);
        const lateName = laterTerms(map, topicIndex, s.topic, lab.name);
        if (lateName.length) err(lw, `the label's own words are taught after ${s.topic}: ${lateName.join(', ')}; cover it`);
        // Every item explains itself.
        if (!str(lab.fn)) err(lw, 'fn (what the structure is and does) is missing');
        else {
          if (positionTell(lab.fn)) err(lw, 'fn points at an option by letter or position');
          const late = laterTerms(map, topicIndex, s.topic, lab.fn);
          if (late.length) err(lw, `fn uses terms taught after ${s.topic}: ${late.join(', ')}`);
        }
        if (lab.follow != null) {
          const f = lab.follow, fw = `${lw} follow-up`;
          if (!str(f.q)) err(fw, 'q is missing');
          if (!Array.isArray(f.options) || f.options.length < 3 || f.options.length > 5) err(fw, 'needs 3 to 5 options');
          else {
            if (new Set(f.options.map(o => textOf(o).toLowerCase())).size !== f.options.length) err(fw, 'options repeat');
            if (!Number.isInteger(f.correct) || f.correct < 0 || f.correct >= f.options.length) err(fw, 'correct must index an option');
          }
          if (!str(f.why)) err(fw, 'why (the explanation) is missing');
          else if (positionTell(f.why)) err(fw, 'why points at an option by letter or position');
          if (f.level != null && !LEVELS.includes(f.level)) err(fw, `level must be one of ${LEVELS.join(', ')}`);
          const late = laterTerms(map, topicIndex, s.topic, [f.q, ...(f.options || []), f.why].join(' \n '));
          if (late.length) err(fw, `uses terms taught after ${s.topic}: ${late.join(', ')}`);
          if (itemIds.has(iid + ':follow')) err(fw, 'duplicate follow-up id');
          itemIds.add(iid + ':follow');
        }
      });

      (st.covered || []).forEach(c => {
        const cw = `${sw} covered ${c && c.id}`;
        const fl = c && fileLabels.get(c.id);
        if (!fl) { err(cw, `not in data/labels/${st.figure}.json`); return; }
        if (!sameBox(c.box, fl.box)) err(cw, `box does not match the label file's ${JSON.stringify(fl.box)}`);
        if (asked.has(c.id)) err(cw, 'both asked and covered');
        if (!mustCover(fl, s.topic)) err(cw, `is covered but is neither marked "cover" nor names anything taught after ${s.topic}: ask it instead`);
        covered.add(c.id);
      });

      // Labels that are not structures to name. "shown": left visible in every
      // mode (an analogy's labels, a note printed on the figure). "hints":
      // visible in explore and study, masked in the quiz and the practical
      // because they give an answer away (a table's row and column headings).
      const other = new Set();
      for (const kind of ['shown', 'hints']) (st[kind] || []).forEach(h => {
        const hw = `${sw} ${kind} ${h && h.id}`;
        const fl = h && fileLabels.get(h.id);
        if (!fl) { err(hw, `not in data/labels/${st.figure}.json`); return; }
        if (!str(h.why)) err(hw, 'why (the reason it is not asked) is missing');
        if (kind === 'hints' && !sameBox(h.box, fl.box)) err(hw, `box does not match the label file's ${JSON.stringify(fl.box)}`);
        if (asked.has(h.id) || covered.has(h.id) || other.has(h.id)) err(hw, 'listed twice (asked, covered, shown or hints)');
        if (mustCover(fl, s.topic)) err(hw, `must be covered (later term or marked "cover"), not left visible`);
        other.add(h.id);
      });

      // Every labeled box on the figure is accounted for: asked, or covered
      // because it names something taught later (never left showing a later
      // word, never silently dropped).
      for (const fl of file.labels || []) {
        if (!fl.box) { err(`${sw} label ${fl.id}`, 'the label file has no box for it yet; run scripts/anp-figures.py'); continue; }
        if (mustCover(fl, s.topic) && !covered.has(fl.id)) err(`${sw} label ${fl.id}`, fl.cover ? 'is marked "cover" in the label file and must be listed as covered' : `names something taught after ${s.topic} and must be listed as covered`);
        if (!asked.has(fl.id) && !covered.has(fl.id) && !other.has(fl.id)) err(`${sw} label ${fl.id}`, 'is on the figure but not asked, covered, shown or listed as a hint (regenerate the tool data)');
      }
    });
  });

  for (const id of Object.keys(data.figures)) if (!usedFigures.has(id)) err(`figure ${id}`, 'listed but used by no station');
  return errors;
}
