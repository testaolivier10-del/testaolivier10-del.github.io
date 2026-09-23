/* The A&P content check: every authored file under anatomy-physiology/data/
   against the formats in docs/anp-phase1-architecture.md and the rules in
   docs/anp-spec.md (sections 4, 5, 7 and 9).

     node scripts/check-anp-content.mjs                  every topic with content
     node scripts/check-anp-content.mjs --topic <id>     one topic (for authors)
     node scripts/check-anp-content.mjs --check          exit non-zero on a failure

   Per topic it checks the lesson file, the notes fragment, the question file
   and the glossary entries, and it reads all of their text against the
   dependency map: a word taught by a later topic fails unless it sits inside
   a preview box the topic has declared. That is the same rule the page check
   applies to built pages, applied early, so an author finds out while
   writing rather than after the build. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMap, indexMap, scanPage } from './lib/anp-map.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = join(ROOT, 'anatomy-physiology', 'data');
const map = loadMap(join(ROOT, 'docs', 'anp-dependency-map.json'));
const { topicIndex, concepts } = indexMap(map);
const args = process.argv.slice(2);
const only = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null;

export const TYPES = ['single', 'vignette', 'graph', 'multi', 'order', 'missing', 'error', 'image', 'predict'];
export const LEVELS = ['recall', 'apply', 'analyze'];
const POS_RE = /\b[Oo]ptions?\s+(one|two|three|four|five|[1-6]|[A-F])\b|\b(first|second|third|fourth|fifth|last)\s+(option|choice|answer)\b|\b(choice|answer)\s+[A-F]\b/;
const MIN_QUESTIONS = 15;
const ALLOWED_LICENSES = ['CC BY 4.0', 'CC BY', 'public domain', 'LevlPrep original'];
// The OpenStax figure catalog (every A&P 2e figure with its caption credits),
// kept outside the repo. When present, a figure must be in it and carry no
// third-party credit. See spec section 2 and decision 22.
const CATALOG_PATH = process.env.ANP_FIGURE_CATALOG || '';
const OPENSTAX_CATALOG = CATALOG_PATH && existsSync(CATALOG_PATH)
  ? new Map(JSON.parse(readFileSync(CATALOG_PATH, 'utf8')).map(c => [c.url, c])) : null;

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const NREMT_CHAPTERS = JSON.parse(readFileSync(join(ROOT, 'nremt', 'assets', 'study-notes.json'), 'utf8')).chapters.length;
const exists = p => existsSync(p);

function glossaryAll() {
  const dir = join(DATA, 'glossary');
  const all = {};
  if (!exists(dir)) return all;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) Object.assign(all, readJson(join(dir, f)));
  return all;
}
function figuresAll() {
  const dir = join(DATA, 'figures');
  const all = {};
  if (!exists(dir)) return all;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) Object.assign(all, readJson(join(dir, f)));
  return all;
}

const strip = s => String(s ?? '');
function questionText(q) {
  const parts = [q.q, ...(q.options || []), q.why?.correct, ...((q.why && q.why.options) || [])];
  for (const v of q.variables || []) parts.push(v.name, v.why);
  return parts.map(strip).join('\n');
}

export function checkTopic(id, glossary, figures) {
  const errors = [], warns = [];
  const err = m => errors.push(m), warn = m => warns.push(m);
  const topic = map.topics[topicIndex.get(id)];
  const here = topicIndex.get(id);
  const lp = join(DATA, 'lessons', `${id}.json`);
  const np = join(DATA, 'notes', `${id}.html`);
  const qp = join(DATA, 'questions', `${id}.json`);
  const texts = [];

  // --- questions
  let qs = [];
  if (!exists(qp)) err('no question file');
  else {
    try { qs = readJson(qp); } catch (e) { err(`questions: invalid JSON (${e.message})`); qs = []; }
    if (!Array.isArray(qs)) { err('questions: must be an array'); qs = []; }
    if (qs.length < MIN_QUESTIONS) err(`questions: ${qs.length}, need at least ${MIN_QUESTIONS}`);
    const ids = new Set();
    let higher = 0;
    for (const q of qs) {
      const w = `question ${q.id || '(no id)'}`;
      if (!q.id || !new RegExp(`^anp-${id}-\\d+$`).test(q.id)) err(`${w}: id must be anp-${id}-<n>`);
      if (ids.has(q.id)) err(`${w}: duplicate id`); ids.add(q.id);
      if (!TYPES.includes(q.type)) err(`${w}: type must be one of ${TYPES.join(', ')}`);
      if (!LEVELS.includes(q.level)) err(`${w}: level must be recall, apply or analyze`);
      if (q.level !== 'recall') higher++;
      if (![1, 2, 3].includes(q.diff)) err(`${w}: diff must be 1, 2 or 3`);
      if (!Array.isArray(q.core) || !q.core.length) err(`${w}: core concepts missing`);
      for (const c of q.core || []) if (!map.coreConcepts.some(x => x.id === c)) err(`${w}: unknown core concept "${c}"`);
      if (!q.q || String(q.q).length < 12) err(`${w}: no question text`);
      if (q.type === 'predict') {
        if (!Array.isArray(q.variables) || q.variables.length < 2) err(`${w}: predict needs 2+ variables`);
        for (const v of q.variables || []) {
          if (!['up', 'down', 'none'].includes(v.answer)) err(`${w}: variable "${v.name}" answer must be up, down or none`);
          if (!v.why || v.why.length < 20) err(`${w}: variable "${v.name}" needs a causal explanation`);
        }
      } else {
        const n = (q.options || []).length;
        const min = q.type === 'order' || q.type === 'error' ? 3 : 2;
        if (n < min) err(`${w}: needs at least ${min} options`);
        if (n > 6) err(`${w}: at most 6 options`);
        if (new Set((q.options || []).map(o => String(o).trim().toLowerCase())).size !== n) err(`${w}: duplicate options`);
        if (q.type === 'multi') {
          if (!Array.isArray(q.correct) || !q.correct.length || q.correct.some(i => !(i >= 0 && i < n))) err(`${w}: multi needs correct as an array of option indices`);
        } else if (q.type === 'order') {
          if (q.correct !== undefined) err(`${w}: order items list options in the correct order and have no "correct"`);
        } else if (!(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < n)) err(`${w}: correct must be an option index`);
        if (!q.why || !q.why.correct) err(`${w}: why.correct missing`);
        if (q.type !== 'order' && (!q.why || !Array.isArray(q.why.options) || q.why.options.length !== n)) err(`${w}: why.options must explain every option (${n})`);
        if ((q.type === 'graph' || q.type === 'image') && !q.figure) err(`${w}: ${q.type} needs a figure`);
        if (q.figure && figures && !figures[q.figure]) err(`${w}: unknown figure "${q.figure}"`);
      }
      const all = [q.why?.correct, ...((q.why && q.why.options) || []), ...(q.variables || []).map(v => v.why)].map(strip).join(' ');
      const m = all.match(POS_RE);
      if (m) err(`${w}: explanation says "${m[0]}"; options are shuffled, so name the option by its content`);
      texts.push(questionText(q));
    }
    if ((topic.kind === 'physiology') && qs.length && higher / qs.length < 0.6)
      err(`questions: ${(100 * higher / qs.length).toFixed(0)}% apply/analyze; physiology topics need at least 60%`);
  }

  // --- lesson
  if (!exists(lp)) err('no lesson file');
  else {
    let L;
    try { L = readJson(lp); } catch (e) { err(`lesson: invalid JSON (${e.message})`); }
    if (L) {
      if (L.topic !== id) err('lesson: "topic" must be the topic id');
      if (!L.hook || L.hook.length < 80) err('lesson: hook (a short patient scenario) missing');
      if (!Array.isArray(L.prereq) || L.prereq.length < 2 || L.prereq.length > 3) {
        if (here > 0) err('lesson: prereq needs 2 or 3 questions');
      }
      for (const [i, p] of (L.prereq || []).entries()) {
        if (!Array.isArray(p.options) || !(Number.isInteger(p.correct) && p.correct >= 0 && p.correct < p.options.length)) err(`lesson: prereq ${i + 1} malformed`);
        if (!p.why) err(`lesson: prereq ${i + 1} has no explanation`);
        if (!topicIndex.has(p.review) || topicIndex.get(p.review) >= here) err(`lesson: prereq ${i + 1} must point "review" at an earlier topic`);
        texts.push([p.q, ...(p.options || []), p.why].map(strip).join('\n'));
      }
      if (L.anatomy !== null && L.anatomy !== undefined) {
        if (!L.anatomy.figure) err('lesson: anatomy.figure missing (use null for no anatomy panel)');
        else if (figures && !figures[L.anatomy.figure]) err(`lesson: unknown figure "${L.anatomy.figure}"`);
        texts.push(strip(L.anatomy.caption));
      } else if (topic.kind !== 'physiology') warn('lesson: no anatomy panel on an anatomy or mixed topic');
      if (!Array.isArray(L.chain) || L.chain.length < 3) err('lesson: chain needs at least 3 cause-and-effect steps');
      for (const s of L.chain || []) { if (!s.cause || !s.effect) err('lesson: every chain step needs cause and effect'); texts.push(`${strip(s.cause)}\n${strip(s.effect)}`); }
      if (!L.misconception || !L.misconception.wrong || !L.misconception.right) err('lesson: misconception needs wrong and right');
      else texts.push(`${L.misconception.wrong}\n${L.misconception.right}`);
      if (!Array.isArray(L.check) || L.check.length < 5 || L.check.length > 8) err('lesson: check needs 5 to 8 question ids');
      const qids = new Set(qs.map(q => q.id));
      for (const c of L.check || []) if (!qids.has(c)) err(`lesson: check lists unknown question "${c}"`);
      if (!L.summary || L.summary.length < 80) err('lesson: summary missing');
      texts.push(strip(L.hook), strip(L.summary));
    }
  }

  // --- notes
  let notes = '';
  if (!exists(np)) err('no notes file');
  else {
    notes = readFileSync(np, 'utf8');
    const words = notes.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (words < 500) err(`notes: ${words} words; a notes page should be a full explanation (500+)`);
    if (!/<h2[\s>]/.test(notes)) err('notes: needs <h2> sections');
    if (/<h1[\s>]/.test(notes)) err('notes: no <h1> (the generator adds the title)');
    const declared = new Set((topic.previews || []).map(p => p.concept));
    for (const m of notes.matchAll(/class="anp-preview"[^>]*data-concept="([^"]+)"/g))
      if (!declared.has(m[1])) err(`notes: preview box for "${m[1]}" is not a declared preview of this topic`);
    for (const m of notes.matchAll(/<figure[^>]*data-fig="([^"]+)"/g))
      if (figures && !figures[m[1]]) err(`notes: unknown figure "${m[1]}"`);
  }

  // --- figures this topic registers: license must allow commercial use
  const fp = join(DATA, 'figures', `${id}.json`);
  if (exists(fp)) {
    let F = {};
    try { F = readJson(fp); } catch (e) { err(`figures: invalid JSON (${e.message})`); }
    for (const [fid, f] of Object.entries(F)) {
      if (!ALLOWED_LICENSES.includes(f.license)) err(`figure ${fid}: license "${f.license}" is not allowed (CC BY 4.0, CC BY or public domain only; spec section 2)`);
      if (!f.credit) err(`figure ${fid}: credit missing`);
      // Our own diagrams registered as figures (so a question can show one) are
      // SVG files drawn for the course, stored at anatomy-physiology/figures/<id>.svg.
      if (f.source === 'levlprep') {
        if (f.license !== 'LevlPrep original') err(`figure ${fid}: our own diagrams carry the license "LevlPrep original"`);
        if (f.ext !== 'svg' || !exists(join(ROOT, 'anatomy-physiology', 'figures', `${fid}.svg`))) err(`figure ${fid}: our own diagram must be anatomy-physiology/figures/${fid}.svg with "ext": "svg"`);
      } else if (f.license === 'LevlPrep original') err(`figure ${fid}: "LevlPrep original" is only for source "levlprep"`);
      if (!f.alt || f.alt.length < 20) err(`figure ${fid}: alt text missing`);
      if (f.source === 'openstax') {
        const url = f.openstax && f.openstax.url;
        if (!url || !/^https:\/\/openstax\.org\//.test(url)) err(`figure ${fid}: OpenStax figures must come from openstax.org (the original A&P 2e)`);
        const c = OPENSTAX_CATALOG && url && OPENSTAX_CATALOG.get(url);
        if (OPENSTAX_CATALOG && !c) err(`figure ${fid}: not an A&P 2e figure in the catalog`);
        else if (c && c.license !== 'CC BY 4.0 (OpenStax)') err(`figure ${fid}: OpenStax figure ${c.figure} credits a third party (${c.thirdParty.join('; ')}); not cleared for commercial use`);
      }
    }
  }

  // --- glossary: every concept this topic teaches is defined
  for (const c of map.concepts.filter(c => c.taughtIn === id)) {
    const g = glossary[c.id];
    if (!g || !g.def) err(`glossary: no definition for ${c.id} ("${c.term}")`);
    else texts.push(g.def);
  }

  // --- "receptor" is never bare (spec section 5): "sensory receptor" for a
  // sensor, "receptor protein" for a binding molecule, or a named receptor
  // protein ("beta-1 receptors"). Bare means straight after a determiner.
  const plain = rawAll0 => rawAll0.replace(/<[^>]+>/g, ' ');
  for (const t of [notes, ...texts]) {
    const m = plain(t).match(/(?:^|[^A-Za-z-])(?:a|an|the|its|their|matching|same|each|every|no|these|those|this|that|any|own|specific)\s+receptors?\b(?!\s+proteins?|\s*\(sensor\)|-)/i);
    if (m) { err(`bare "receptor": "${m[0].trim()}" (write "sensory receptor" or "receptor protein")`); break; }
  }

  // --- links into the NREMT notes route by #chapter-N (nremt/study-notes.html)
  const rawAll = [notes, ...['lessons', 'questions'].map(d => exists(join(DATA, d, `${id}.json`)) ? readFileSync(join(DATA, d, `${id}.json`), 'utf8') : '')].join('\n');
  for (const m of rawAll.matchAll(/study-notes\.html#([A-Za-z0-9_-]+)/g)) {
    const n = (m[1].match(/^chapter-(\d+)$/) || [])[1];
    if (!n || +n < 1 || +n > NREMT_CHAPTERS) err(`link: nremt/study-notes.html#${m[1]} does not route; use #chapter-N (1-${NREMT_CHAPTERS})`);
  }

  // --- ordering: all of it, as one page
  const page = `<html><head></head><body>${notes}<div>${texts.map(t => `<p>${t}</p>`).join('')}</div></body></html>`;
  for (const p of scanPage(map, page, id)) err(`ORDER: ${p}`);
  return { errors, warns, questions: qs.length };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const glossary = glossaryAll();
  const figures = figuresAll();
  const ids = only ? [only] : map.topics.map(t => t.id).filter(t =>
    exists(join(DATA, 'lessons', `${t}.json`)) || exists(join(DATA, 'notes', `${t}.html`)) || exists(join(DATA, 'questions', `${t}.json`)));
  if (only && !topicIndex.has(only)) { console.error(`unknown topic ${only}`); process.exit(1); }
  let failed = 0, total = 0;
  for (const id of ids) {
    const r = checkTopic(id, glossary, figures);
    total += r.questions;
    if (r.errors.length || r.warns.length || only) {
      console.log(`${id}: ${r.errors.length ? 'FAIL' : 'ok'} (${r.questions} questions)`);
      for (const e of r.errors) console.log(`  FAIL: ${e}`);
      for (const w of r.warns) console.log(`  warning: ${w}`);
    }
    if (r.errors.length) failed++;
  }
  console.log(`A&P content: ${ids.length} topics, ${total} questions, ${failed} failing.`);

  // --- tools: each tool's content file against its own validator
  // (scripts/lib/anp-tool-checks/<slug>.mjs, docs/anp-tools-contract.md).
  let toolFails = 0;
  if (!only) {
    const toolDir = join(DATA, 'tools');
    const checkDir = join(ROOT, 'scripts', 'lib', 'anp-tool-checks');
    for (const f of exists(toolDir) ? readdirSync(toolDir).filter(f => f.endsWith('.json')).sort() : []) {
      const slug = f.replace(/\.json$/, '');
      const v = join(checkDir, `${slug}.mjs`);
      if (!exists(v)) { console.log(`tool ${slug}: FAIL: no validator at scripts/lib/anp-tool-checks/${slug}.mjs`); toolFails++; continue; }
      const { check } = await import(v);
      const errs = check(readJson(join(toolDir, f)), map) || [];
      if (errs.length) { toolFails++; console.log(`tool ${slug}: FAIL`); for (const e of errs) console.log(`  FAIL: ${e}`); }
    }
    console.log(`A&P tools: ${toolFails} failing.`);
  }
  if (args.includes('--check') && (failed || toolFails)) process.exit(1);
}
