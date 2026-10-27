/* Validator for the 3D anatomy tool's content,
   anatomy-physiology/data/tools/anatomy-3d.json (docs/anp-tools-contract.md,
   docs/tools-upgrade.md). check(data, map) returns an array of error strings.

   Each structure is one or more meshes of the shared BodyParts3D model
   (assets/body3d/body3d.glb), named by their FMA ids. The rule the tool lives
   by: never guess a mesh's identity. So this check reads the model itself and
   fails when a structure names a mesh the model does not have, when a mesh is
   in two structures, or when a mesh is in none (every mesh is either named or
   listed under "context", drawn but never named). The names given to meshes
   were checked by hand against the BodyParts3D 4.0 concept tables and the FMA
   (docs/tools-upgrade.md, "3D anatomy"); this check keeps the data from
   drifting away from the model.

   Scored items, stable forever (a structure id must never be renamed once
   published):
     anatomy-3d:<structure>:name    the structure was highlighted; name it
     anatomy-3d:<structure>:point   the structure was named; tap it on the model

   Checks: required fields; unique slug ids; system is listed; topic exists in
   the map (its lesson link); related ids exist and are not the structure
   itself; accepted answers are unique across structures (so a typed answer
   names one structure); partNames only for meshes that exist; the ordering
   rule: a structure's text uses no term taught after its topic (everyday words
   allowed, decision 51), exactly as a page is checked; no em dash (owner rule
   for new student-facing copy); no option-by-position wording. */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPage, indexMap } from '../anp-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const MODEL = join(ROOT, 'assets', 'body3d', 'body3d.glb');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const KINDS = ['bone', 'organ', 'vessel', 'skin'];
const FIELDS = ['what', 'where', 'features'];

const textOf = h => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const str = v => typeof v === 'string' && v.trim().length > 0;
const norm = s => String(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const escHtml = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* The mesh names in the model: the node names in the glTF JSON chunk. */
export function modelMeshes(path = MODEL) {
  if (!existsSync(path)) return null;
  const b = readFileSync(path);
  if (b.toString('ascii', 0, 4) !== 'glTF') return null;
  const len = b.readUInt32LE(12);
  const j = JSON.parse(b.toString('utf8', 20, 20 + len));
  return new Set((j.nodes || []).filter(n => n.mesh != null).map(n => n.name));
}

export function check(data, map) {
  const errs = [];
  const E = m => errs.push(m);
  if (!data || !Array.isArray(data.structures)) return ['anatomy-3d: no structures array'];
  const { topicIndex } = indexMap(map);
  const topics = new Set(map.topics.map(t => t.id));
  const systems = data.systems || {};
  if (!data.model || !str(data.model.credit) || !str(data.model.contains) || !str(data.model.missing)) E('model: credit, contains and missing are required (the tool says what the model holds and lacks)');
  else if (!/BodyParts3D/.test(data.model.credit) || !/CC BY 4\.0/.test(data.model.credit)) E('model.credit must name BodyParts3D and its CC BY 4.0 license');
  for (const k of data.order || []) if (!systems[k]) E(`order lists ${k}, which is not in systems`);

  const meshes = modelMeshes();
  if (!meshes) E('assets/body3d/body3d.glb is missing or not a glTF binary');
  const owner = {};
  const ids = new Set();
  const answers = {};
  for (const s of data.structures) {
    const at = `structure ${s.id || '?'}`;
    if (!str(s.id) || !SLUG.test(s.id)) { E(`${at}: id must be a lowercase slug`); continue; }
    if (ids.has(s.id)) E(`${at}: duplicate id`);
    ids.add(s.id);
    if (!str(s.name)) E(`${at}: no name`);
    if (!systems[s.system]) E(`${at}: system "${s.system}" is not listed in systems`);
    if (!topics.has(s.topic)) E(`${at}: topic "${s.topic}" is not in the dependency map`);
    if (!KINDS.includes(s.kind)) E(`${at}: kind must be one of ${KINDS.join(', ')}`);
    for (const f of FIELDS) if (!str(s[f])) E(`${at}: ${f} is required`);
    if (!Array.isArray(s.parts) || !s.parts.length) E(`${at}: parts must list at least one mesh`);
    for (const p of s.parts || []) {
      if (meshes && !meshes.has(p)) E(`${at}: mesh ${p} is not in the model`);
      if (owner[p]) E(`${at}: mesh ${p} is already in ${owner[p]}`);
      owner[p] = s.id;
    }
    if (!Array.isArray(s.related)) E(`${at}: related must be an array`);
    if (s.inner && !Array.isArray(s.inner)) E(`${at}: inner must be an array of structure ids`);
    if (s.opacity != null && !(s.opacity > 0 && s.opacity <= 1)) E(`${at}: opacity must be in (0, 1]`);
    for (const a of [s.name, ...(s.accept || [])]) {
      const k = norm(a);
      if (!k) continue;
      if (answers[k] && answers[k] !== s.id) E(`${at}: the answer "${a}" also names ${answers[k]}`);
      answers[k] = s.id;
    }
    // The ordering rule (docs/anp-spec.md section 7), as for every page.
    if (topicIndex.get(s.topic) !== undefined) {
      const html = [s.name, s.what, s.where, s.features, s.note].filter(Boolean).map(x => `<p>${escHtml(textOf(x))}</p>`).join('');
      for (const p of scanPage(map, html, s.topic)) E(`${at}: ${p}`);
    }
    for (const x of [s.name, s.what, s.where, s.features, s.note, ...(s.accept || [])]) {
      if (x && /—/.test(x)) E(`${at}: em dash in "${textOf(x).slice(0, 40)}…"; use a period, colon or comma`);
    }
  }
  for (const s of data.structures) {
    for (const r of s.related || []) if (!ids.has(r) || r === s.id) E(`structure ${s.id}: related "${r}" is not another structure`);
    for (const r of s.inner || []) if (!ids.has(r) || r === s.id) E(`structure ${s.id}: inner "${r}" is not another structure`);
  }
  for (const c of data.context || []) {
    if (meshes && !meshes.has(c)) E(`context mesh ${c} is not in the model`);
    if (owner[c]) E(`context mesh ${c} is also in ${owner[c]}`);
    owner[c] = 'context';
  }
  if (meshes) for (const m of meshes) if (!owner[m]) E(`mesh ${m} is in no structure and not listed as context; name it (after confirming its FMA id) or list it as context`);
  for (const [p, n] of Object.entries(data.partNames || {})) {
    if (!owner[p] || owner[p] === 'context') E(`partNames: ${p} is not a named structure's mesh`);
    if (!str(n)) E(`partNames: ${p} has no name`);
    if (/—/.test(n)) E(`partNames: em dash in ${p}`);
  }
  for (const k of ['contains', 'missing']) if (data.model && /—/.test(data.model[k] || '')) E(`model.${k}: em dash`);
  return errs;
}
