/* Validator for anatomy-physiology/data/tools/predict.json (Predict the change,
   docs/anp-spec.md section 8.2; docs/anp-tools-contract.md).

     check(data, map) -> array of error strings (empty when the file is good)

   It checks the format, stable unique ids, tags against the dependency map,
   the level ladder (level 4 = two stages), every chain step, the writing rules
   (no bare "receptor", no option letters or positions) and the ordering rule:
   a scenario uses only terms taught in its topic or earlier. It also checks
   that every prediction theme the map plans for the pilot chapters has a
   scenario. */
import { scanPage } from '../anp-map.mjs';

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ANSWERS = ['up', 'down', 'none'];
const LEVELS = [1, 2, 3, 4];
// Chapters that are live (anatomy-physiology/data/published.json, decision 53).
// Items may belong to any chapter; every planned item must exist only once its
// chapter is published.
import { readFileSync as _rf, existsSync as _ex } from 'node:fs';
const _pub = new URL('../../../anatomy-physiology/data/published.json', import.meta.url);
export const PILOT_CHAPTERS = _ex(_pub) ? JSON.parse(_rf(_pub, 'utf8')).chapters : ['orientation', 'chem-physics', 'cells', 'tissues', 'cell-communication', 'cardiovascular'];
// Same rule as scripts/check-anp-content.mjs: an explanation never points at an option by letter or position.
export const POS_RE = /\b[Oo]ptions?\s+(one|two|three|four|five|[1-6]|[A-F])\b|\b(first|second|third|fourth|fifth|last)\s+(option|choice|answer)\b|\b(choice|answer)\s+[A-F]\b/;
// Spec section 5: "receptor" is never bare. Allowed: "sensory receptor", "receptor protein",
// the loop builder's "Receptor (sensor)", and named receptor proteins (beta-1 receptors, ...).
const RECEPTOR_OK_BEFORE = /(sensory|beta-1|beta-2|beta|alpha-1|alpha|muscarinic|nicotinic|adrenergic|cholinergic|hormone|its|their)\s+$/i;
export function bareReceptor(text) {
  const re = /\breceptors?\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 12);
    if (/^\s+proteins?\b/i.test(after) || /^\s*\(sensor\)/i.test(after)) continue;
    if (RECEPTOR_OK_BEFORE.test(before)) continue;
    return text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 12).trim();
  }
  return null;
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function check(data, map) {
  const errors = [];
  const err = m => errors.push(m);
  if (!data || !Array.isArray(data.scenarios) || !data.scenarios.length) return ['scenarios: missing or empty'];
  const topics = new Map(map.topics.map((t, i) => [t.id, { ...t, i }]));
  const core = new Set(map.coreConcepts.map(c => c.id));
  const seen = new Set(), items = new Set();
  const str = v => typeof v === 'string' && v.trim().length > 0;

  for (const [si, s] of data.scenarios.entries()) {
    const where = `scenario ${s && s.id ? s.id : '#' + si}`;
    if (!s || !str(s.id) || !ID_RE.test(s.id)) { err(`${where}: id must be kebab-case`); continue; }
    if (seen.has(s.id)) err(`${where}: duplicate id`);
    seen.add(s.id);
    for (const f of ['title', 'topic', 'setup']) if (!str(s[f])) err(`${where}: missing ${f}`);
    const topic = topics.get(s.topic);
    if (!topic) err(`${where}: unknown topic "${s.topic}"`);
    if (!Array.isArray(s.core) || !s.core.length) err(`${where}: core must list at least one core concept`);
    else for (const c of s.core) if (!core.has(c)) err(`${where}: unknown core concept "${c}"`);
    if (!LEVELS.includes(s.level)) err(`${where}: level must be 1, 2, 3 or 4`);
    if (s.misconception !== undefined && !str(s.misconception)) err(`${where}: misconception, when present, must be text`);

    let stages;
    if (s.level === 4) {
      if (!Array.isArray(s.stages) || s.stages.length !== 2) { err(`${where}: a level 4 scenario has exactly two stages`); continue; }
      if (s.variables || s.steps) err(`${where}: a level 4 scenario keeps its variables inside its stages`);
      stages = s.stages;
    } else {
      if (s.stages) err(`${where}: only level 4 scenarios have stages`);
      stages = [{ id: null, start: s.start, steps: s.steps, variables: s.variables }];
    }
    const stageIds = new Set();
    const texts = [s.title, s.setup, s.misconception || ''];
    for (const st of stages) {
      const sw = st.id ? `${where} stage ${st.id}` : where;
      if (st.id !== null) {
        if (!str(st.id) || !ID_RE.test(st.id)) err(`${sw}: stage id must be kebab-case`);
        if (stageIds.has(st.id)) err(`${sw}: duplicate stage id`);
        stageIds.add(st.id);
        for (const f of ['label', 'prompt']) if (!str(st[f])) err(`${sw}: missing ${f}`);
        texts.push(st.label || '', st.prompt || '');
      }
      if (!str(st.start)) err(`${sw}: missing start (the perturbation that heads the chain)`);
      texts.push(st.start || '');
      const steps = st.steps && typeof st.steps === 'object' ? st.steps : null;
      if (!steps || !Object.keys(steps).length) { err(`${sw}: missing steps`); continue; }
      for (const [k, t] of Object.entries(steps)) { if (!str(t)) err(`${sw}: step ${k} is empty`); texts.push(t); }
      if (!Array.isArray(st.variables) || st.variables.length < 2) { err(`${sw}: needs at least two variables`); continue; }
      const used = new Set(), vids = new Set();
      for (const v of st.variables) {
        const vw = `${sw} variable ${v && v.id}`;
        if (!v || !str(v.id) || !ID_RE.test(v.id)) { err(`${sw}: variable id must be kebab-case`); continue; }
        if (vids.has(v.id)) err(`${vw}: duplicate variable id`);
        vids.add(v.id);
        const item = `predict:${s.id}:${v.id}${st.id ? '-' + st.id : ''}`;
        if (items.has(item)) err(`${vw}: duplicate item id ${item}`);
        items.add(item);
        if (!str(v.name)) err(`${vw}: missing name`);
        if (!ANSWERS.includes(v.answer)) err(`${vw}: answer must be up, down or none`);
        if (!str(v.why)) err(`${vw}: every variable needs an explanation (why)`);
        else if (v.why.trim().length < 40) err(`${vw}: explanation too short to be causal`);
        if (!Array.isArray(v.chain) || !v.chain.length) err(`${vw}: chain must list at least one step`);
        else for (const k of v.chain) { if (!steps[k]) err(`${vw}: chain step "${k}" is not in the stage's steps`); used.add(k); }
        if (v.chain && new Set(v.chain).size !== v.chain.length) err(`${vw}: chain repeats a step`);
        texts.push(v.name || '', v.why || '');
        if (POS_RE.test(v.why || '')) err(`${vw}: explanation refers to an option by letter or position`);
      }
      for (const k of Object.keys(steps)) if (!used.has(k)) err(`${sw}: step "${k}" is never used by a chain`);
    }
    const all = texts.join('\n');
    const bare = bareReceptor(all);
    if (bare) err(`${where}: bare "receptor" (write "sensory receptor" or "receptor protein"): "${bare}"`);
    if (topic) for (const p of scanPage(map, `<p>${esc(all)}</p>`, s.topic)) err(`${where}: ${p}`);
  }

  // Every prediction theme the map plans for the pilot chapters has a scenario.
  const themes = new Set(data.scenarios.map(s => s && s.theme).filter(Boolean));
  const planned = new Set();
  for (const ch of map.chapters) {
    if (!PILOT_CHAPTERS.includes(ch.id)) continue;
    for (const t of (ch.tools && ch.tools.predictionThemes) || []) {
      planned.add(t.title);
      if (!themes.has(t.title)) err(`map theme "${t.title}" (${ch.id}) has no scenario`);
    }
  }
  const allThemes = new Set(map.chapters.flatMap(ch => ((ch.tools && ch.tools.predictionThemes) || []).map(t => t.title)));
  for (const s of data.scenarios) if (s && s.theme && !allThemes.has(s.theme)) err(`scenario ${s.id}: theme "${s.theme}" is not a prediction theme in the map`);
  return errors;
}
