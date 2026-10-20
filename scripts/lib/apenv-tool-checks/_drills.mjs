/* Shared checks for seeded step problems (any trainer's "Test yourself"
   drill built on ApEnvTools.drill). Not a validator itself: its name starts
   with "_". Forked from apstat-tool-checks/_drills.mjs; setup and unit steps
   in place of expression steps.

   drills(data, slug, kind, map, errs, gen, recheck) checks the data file's
   frame, then, for every context and every problem type it lists, generates
   SEEDS problems with the same generator the page runs (the tool's model,
   ApEnvMath.<camelSlug>.generate) and checks
   that each is sound: finite answers, every step graded right on its own
   key, no authored mistake that would be graded right, no step text that
   prints NaN or undefined, and then recheck(problem, ctx) recomputes the
   answers independently (the tool's own validator supplies it). */
import { runtime, topicOk, SKILLS, trademark } from './_shared.mjs';

export const SEEDS = 300;
export const seedOf = i => i * 7919 + 13;

export function frame(data, slug, kind, map, errs) {
  if (data.slug !== slug) errs.push(`slug "${data.slug}" must be "${slug}" (the file name)`);
  if (data.kind !== kind) errs.push(`kind must be "${kind}"`);
  if (!topicOk(data.topic, map)) errs.push(`topic "${data.topic}" is not a topic of the map`);
  for (const k of ['intro', 'howItWorks']) if (!data[k] || typeof data[k] !== 'string') errs.push(`"${k}" (HTML) is required`);
  if (!Array.isArray(data.contexts) || !data.contexts.length) errs.push('no contexts');
  for (const [k, t] of Object.entries(data.partTopics || {})) if (!topicOk(t, map)) errs.push(`partTopics.${k}: unknown topic "${t}"`);
  const ids = new Set();
  for (const c of data.contexts || []) {
    if (!c.id || ids.has(c.id)) errs.push(`context ${c.id}: missing or duplicate id`);
    ids.add(c.id);
    if (!topicOk(c.topic, map)) errs.push(`context ${c.id}: unknown topic "${c.topic}"`);
  }
  trademark(data, errs);
}

const BAD = /NaN|undefined|Infinity|\[object/;
export function stepsSound(p, w, errs) {
  const { M } = runtime();
  if (!Array.isArray(p.steps) || !p.steps.length) { errs.push(`${w}: no steps`); return; }
  if (!Array.isArray(p.solution) || !p.solution.length) errs.push(`${w}: no worked solution`);
  const text = [p.text, ...(p.solution || []), ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || [])])].join(' ');
  if (BAD.test(text)) errs.push(`${w}: a text prints NaN, undefined or Infinity`);
  const keys = new Set();
  for (const s of p.steps) {
    if (keys.has(s.key)) errs.push(`${w}: duplicate step key ${s.key}`); keys.add(s.key);
    if (!SKILLS.has(s.practice)) errs.push(`${w}: step ${s.key} practice "${s.practice}" is not a skill id`);
    // A setup step: its key graded right through the runtime grader, and no
    // authored mistake is. A unit step: the key with its unit graded right.
    if (s.kind === 'setup') {
      const S = s.cell && s.cell.setup;
      if (!S) { errs.push(`${w}: step ${s.key} has no setup cell`); continue; }
      if (!M.diagnoseSetup(s.cell, S.answer).ok) errs.push(`${w}: step ${s.key}: its own setup "${S.answer}" is graded wrong`);
      for (const m of S.mistakes || []) {
        if (M.diagnoseSetup(s.cell, m.expr).ok) errs.push(`${w}: step ${s.key}: mistake "${m.expr}" would be graded right`);
        if (!m.why || BAD.test(m.why)) errs.push(`${w}: step ${s.key}: a mistake has no usable explanation`);
      }
      continue;
    }
    if (s.kind === 'unit') {
      const N = s.cell && s.cell.numeric;
      if (!N || !Number.isFinite(N.answer)) { errs.push(`${w}: step ${s.key} has no finite answer`); continue; }
      if (!M.diagnoseUnit(s.cell, { value: String(N.answer), unit: N.unit || '' }).ok) errs.push(`${w}: step ${s.key}: its own key is graded wrong`);
      for (const m of N.mistakes || []) if (M.diagnoseUnit(s.cell, { value: String(m.value), unit: N.unit || '' }).ok) errs.push(`${w}: step ${s.key}: mistake ${m.value} would be graded right`);
      continue;
    }
    const cells = s.cell ? [s.cell] : s.cells || [];
    for (const c of cells) {
      if (!Number.isFinite(c.answer)) { errs.push(`${w}: step ${s.key} has no finite answer`); continue; }
      if (!M.diagnose(c, c.answer).ok) errs.push(`${w}: step ${s.key}: its own key is graded wrong`);
      // A student who rounds to the figures the page shows is graded right.
      const shown = s.d != null ? Number(M.fixed(c.answer, s.d)) : M.sig(c.answer, 3);
      if (!M.diagnose(c, shown).ok) errs.push(`${w}: step ${s.key}: the answer rounded as shown (${shown}) grades wrong`);
      for (const m of c.mistakes) {
        if (M.diagnose({ ...c, mistakes: [] }, m.value).ok) errs.push(`${w}: step ${s.key}: mistake "${m.why.slice(0, 40)}…" would be graded right`);
        if (!m.why || BAD.test(m.why)) errs.push(`${w}: step ${s.key}: a mistake has no usable explanation`);
      }
    }
    if (s.kind === 'choice') {
      if (!(s.correct >= 0 && s.correct < s.options.length)) errs.push(`${w}: step ${s.key}: correct is out of range`);
      if (!Array.isArray(s.why) || s.why.length !== s.options.length) errs.push(`${w}: step ${s.key}: one explanation per option`);
      if (new Set(s.options).size !== s.options.length) errs.push(`${w}: step ${s.key}: two options read the same`);
    }
  }
}

/* Run gen over every context × type × seed; recheck(p, ctx, w) pushes its
   own errors. Stops a context at its first failing seed. */
export function sweep(data, errs, gen, recheck, typesOf = c => [undefined]) {
  const { M } = runtime();
  for (const c of data.contexts || []) {
    for (const t of typesOf(c)) {
      for (let i = 1; i <= SEEDS; i++) {
        const w = `context ${c.id}${t ? ' ' + t : ''} seed ${seedOf(i)}`;
        let p;
        try { p = gen(M.rng(seedOf(i)), c, t); } catch (e) { errs.push(`${w}: ${e.message}`); break; }
        const before = errs.length;
        if (t && p.type && p.type !== t) errs.push(`${w}: asked for ${t}, got ${p.type}`);
        stepsSound(p, w, errs);
        recheck(p, c, w);
        if (errs.length > before) break;
      }
    }
  }
}

export const close = (a, b, rel = 1e-6, abs = 1e-12) => Math.abs(a - b) <= rel * Math.abs(b) + abs;
