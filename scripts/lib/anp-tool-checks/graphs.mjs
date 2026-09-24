/* Validator for the graph reader's content, anatomy-physiology/data/tools/graphs.json
   (docs/anp-tools-contract.md). check(data, map) returns an array of error strings.

   Every question is one scored item, id graphs:<graph>:<question>, stable
   forever. Question types:
     value   read a number off the graph: answer, tol (accepted +/-), unit
     phase   name a phase or region: options, correct, highlight
     shift   predict how the curve shifts: options, correct, overlay (the
             shifted curve drawn after answering)
   Every graph carries all three types.

   A panel's y axis may set reverse: true to draw min at the top and max at
   the bottom (a clinical audiogram); points and labels stay in data units.

   Checks: required fields; unique ids; topic and core ids exist; levels and
   difficulty valid; axes have labels and units (or say they are unitless);
   series points sit inside the axes; every question explains itself, with one
   explanation per option; no explanation points at an option by letter or
   position; and the ordering rule: a graph's own text uses nothing taught
   after its topic, and a question's text nothing taught after the question's
   topic (which may be later than the graph's, never earlier). */
import { textOf, positionTell, laterTerms } from './pathways.mjs';

const LEVELS = ['recall', 'apply', 'analyze'];
const TYPES = ['value', 'phase', 'shift'];
const CLASSES = ['o2', 'deo2', 'symp', 'para', 'aff', 'eff', 'hi', 'lo', 'memb', 'shape', 'accent'];
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const str = v => typeof v === 'string' && v.trim().length > 0;
const num = v => typeof v === 'number' && isFinite(v);

function checkAxis(ax, where, err) {
  if (!ax || typeof ax !== 'object') { err(where, 'missing axis'); return; }
  if (!str(ax.label)) err(where, 'axis has no label');
  if (!ax.unitless && !str(ax.unit) && !Array.isArray(ax.cats)) err(where, `axis "${ax.label}" has no unit (set unitless: true if it truly has none)`);
  if (ax.reverse !== undefined && typeof ax.reverse !== 'boolean') err(where, `axis "${ax.label}" reverse must be true or false`);
  if (Array.isArray(ax.cats)) { if (ax.cats.length < 2) err(where, 'categorical axis needs 2+ categories'); return; }
  if (!num(ax.min) || !num(ax.max) || ax.min >= ax.max) err(where, `axis "${ax.label}" needs numeric min < max`);
  if (ax.ticks && !ax.ticks.every(t => num(t) && t >= ax.min - 1e-9 && t <= ax.max + 1e-9)) err(where, `axis "${ax.label}" has a tick outside its range`);
}
function range(ax) { return Array.isArray(ax.cats) ? [0, ax.cats.length - 1] : [ax.min, ax.max]; }

function checkSeries(s, x, y, where, err, needLabel) {
  if (!s || typeof s !== 'object') { err(where, 'series is not an object'); return ''; }
  if (!CLASSES.includes(s.cls)) err(where, `series "${s.id}" class must be one of the visual-language classes`);
  if (!Array.isArray(s.pts) || s.pts.length < 2) { err(where, `series "${s.id}" needs 2+ points`); return ''; }
  const [x0, x1] = range(x), [y0, y1] = range(y);
  const tx = (x1 - x0) * 0.001, ty = (y1 - y0) * 0.001;
  s.pts.forEach((p, k) => {
    if (!Array.isArray(p) || !num(p[0]) || !num(p[1])) err(where, `series "${s.id}" point ${k} is not [x, y]`);
    else if (p[0] < x0 - tx || p[0] > x1 + tx || p[1] < y0 - ty || p[1] > y1 + ty) err(where, `series "${s.id}" point [${p}] is outside the axes`);
  });
  if (needLabel && !str(s.label)) err(where, `series "${s.id}" has no label (labels go on the lines, never in a legend)`);
  if (str(s.label) && !(Array.isArray(s.labelAt) && num(s.labelAt[0]) && num(s.labelAt[1]))) err(where, `series "${s.id}" label needs labelAt [x, y]`);
  return s.label || '';
}

export function check(data, map) {
  const errors = [];
  const err = (where, msg) => errors.push(`graphs ${where}: ${msg}`);
  if (!data || !Array.isArray(data.graphs)) return ['graphs: data.graphs must be an array'];
  const topics = map.topics.map(t => t.id);
  const tIndex = new Map(topics.map((t, i) => [t, i]));
  const cores = new Set(map.coreConcepts.map(c => c.id));
  const ids = new Set();
  const itemIds = new Set();

  data.graphs.forEach((g, n) => {
    const where = g && g.id ? g.id : `#${n}`;
    if (!g || typeof g !== 'object') { err(where, 'not an object'); return; }
    if (!str(g.id) || !SLUG.test(g.id)) err(where, 'id must be a lowercase slug');
    if (ids.has(g.id)) err(where, 'duplicate graph id');
    ids.add(g.id);
    for (const f of ['title', 'intro', 'alt']) if (!str(g[f])) err(where, `missing ${f}`);
    if (!tIndex.has(g.topic)) err(where, `unknown topic "${g.topic}"`);
    if (!Array.isArray(g.core) || !g.core.length) err(where, 'core must be a non-empty array');
    else g.core.forEach(c => { if (!cores.has(c)) err(where, `unknown core concept "${c}"`); });

    checkAxis(g.x, where, err);
    const panels = Array.isArray(g.panels) ? g.panels : [];
    if (!panels.length) err(where, 'needs at least one panel');
    const graphText = [g.title, g.intro, g.alt, g.x && g.x.label, g.x && g.x.unit, ...((g.x && g.x.cats) || [])];
    const regionIds = new Set();
    (g.regions || []).forEach(r => {
      if (!str(r.id)) err(where, 'region without id');
      regionIds.add(r.id);
      if (!str(r.label)) err(where, `region "${r.id}" has no label`);
      graphText.push(r.label);
    });
    (g.vlines || []).forEach(v => { if (!num(v.x) || !str(v.label)) err(where, 'vline needs x and label'); graphText.push(v.label); });
    panels.forEach((p, k) => {
      const pw = `${where} panel ${k + 1}`;
      checkAxis(p.y, pw, err);
      graphText.push(p.y && p.y.label, p.y && p.y.unit);
      if (!Array.isArray(p.series) && !Array.isArray(p.bursts)) err(pw, 'panel has no series');
      const sids = new Set();
      (p.series || []).forEach(s => {
        if (sids.has(s.id)) err(pw, `duplicate series id "${s.id}"`);
        sids.add(s.id);
        graphText.push(checkSeries(s, g.x, p.y, pw, err, !s.nolabel));
      });
      (p.hlines || []).forEach(h => { if (!num(h.y) || !str(h.label)) err(pw, 'hline needs y and label'); graphText.push(h.label); });
      (p.notes || []).forEach(t => { if (!num(t.x) || !num(t.y) || !str(t.text)) err(pw, 'note needs x, y and text'); graphText.push(t.text); });
      (p.bursts || []).forEach(b => { if (!num(b.x0) || !num(b.x1) || !str(b.label)) err(pw, 'burst needs x0, x1 and label'); graphText.push(b.label); });
    });
    if (tIndex.has(g.topic)) laterTerms(map, g.topic, graphText.filter(Boolean).join(' | ')).forEach(h => err(where, `graph uses ${h} before it is taught`));

    const qs = Array.isArray(g.questions) ? g.questions : [];
    const types = new Set();
    const qids = new Set();
    qs.forEach((q, k) => {
      const qw = `${where} question ${q && q.id ? q.id : k + 1}`;
      if (!str(q.id) || !SLUG.test(q.id)) err(qw, 'id must be a lowercase slug');
      if (qids.has(q.id)) err(qw, 'duplicate question id');
      qids.add(q.id);
      const iid = `graphs:${g.id}:${q.id}`;
      if (itemIds.has(iid)) err(qw, `duplicate item id ${iid}`);
      itemIds.add(iid);
      if (!TYPES.includes(q.type)) { err(qw, `type must be one of ${TYPES.join(', ')}`); return; }
      types.add(q.type);
      if (!str(q.q)) err(qw, 'missing q (the question)');
      if (!LEVELS.includes(q.level)) err(qw, 'level must be recall, apply or analyze');
      if (![1, 2, 3].includes(q.diff)) err(qw, 'diff must be 1, 2 or 3');
      const qt = q.topic || g.topic;
      if (!tIndex.has(qt)) err(qw, `unknown topic "${qt}"`);
      else if (tIndex.has(g.topic) && tIndex.get(qt) < tIndex.get(g.topic)) err(qw, `topic "${qt}" comes before the graph's topic "${g.topic}"`);
      if (q.core !== undefined) (Array.isArray(q.core) && q.core.length ? q.core : ['?']).forEach(c => { if (!cores.has(c)) err(qw, `unknown core concept "${c}"`); });
      const expl = [];
      const text = [q.q];
      if (q.type === 'value') {
        if (!num(q.answer)) err(qw, 'value question needs a numeric answer');
        if (!num(q.tol) || q.tol <= 0) err(qw, 'value question needs tol > 0');
        if (q.unit === undefined) err(qw, 'value question needs unit ("" for none)');
        if (!str(q.why)) err(qw, 'value question needs why');
        expl.push(q.why); text.push(q.why, q.unit);
        if (q.show && !(num(q.show.x) && num(q.show.y))) err(qw, 'show needs x and y');
      } else {
        if (!Array.isArray(q.options) || q.options.length < 2) err(qw, 'needs 2+ options');
        if (!Number.isInteger(q.correct) || !q.options || q.correct < 0 || q.correct >= q.options.length) err(qw, 'correct must index an option');
        if (!q.why || !str(q.why.correct)) err(qw, 'needs why.correct');
        if (!q.why || !Array.isArray(q.why.options) || !q.options || q.why.options.length !== q.options.length || !q.why.options.every(str)) err(qw, 'needs one why.options entry per option');
        if (q.why) expl.push(q.why.correct, ...(q.why.options || []));
        text.push(...(q.options || []), ...expl);
        if (q.type === 'phase') {
          const h = q.highlight;
          if (!h || !(regionIds.has(h.region) || (num(h.x0) && num(h.x1)) || (num(h.y0) && num(h.y1)) || Array.isArray(h.path))) err(qw, 'phase question needs highlight: a region id, x0/x1, y0/y1 or a path');
          if (h && h.label) text.push(h.label);
        }
        if (q.type === 'shift') {
          const o = q.overlay;
          if (!o || !((Array.isArray(o.series) && o.series.length) || (Array.isArray(o.marks) && o.marks.length))) err(qw, 'shift question needs overlay.series or overlay.marks');
          else {
            (o.series || []).forEach(s => {
              const p = panels[s.panel || 0];
              if (!p) err(qw, `overlay series "${s.id}" names a missing panel`);
              else text.push(checkSeries(s, g.x, p.y, qw, err, true));
            });
            (o.marks || []).forEach(m => { if (!num(m.x) || !num(m.y) || !str(m.label)) err(qw, 'overlay mark needs x, y, label'); text.push(m.label); });
            (o.hlines || []).forEach(h => { if (!num(h.y) || !str(h.label)) err(qw, 'overlay hline needs y and label'); text.push(h.label); });
          }
        }
      }
      if (q.marker) { if (!num(q.marker.x) || !num(q.marker.y)) err(qw, 'marker needs x and y'); if (q.marker.label) text.push(q.marker.label); }
      expl.forEach(x => { if (x && positionTell(x)) err(qw, `an explanation refers to an option by letter or position: "${textOf(x).slice(0, 80)}"`); });
      if (tIndex.has(qt)) laterTerms(map, qt, text.filter(Boolean).join(' | ')).forEach(h => err(qw, `uses ${h} before it is taught`));
    });
    for (const t of TYPES) if (!types.has(t)) err(where, `needs at least one "${t}" question`);
  });
  return errors;
}
