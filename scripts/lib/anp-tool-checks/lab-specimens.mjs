/* Validator for the lab practical's Explore specimens, anatomy-physiology/data/tools/lab-specimens.json (tools v2,
   docs/tools-v2-anp-lab-practical-brief.md). check(data, map) returns an array of error strings.

   A specimen is one station of a lab practical set drawn clean (scripts/build-lab-specimens.py). Checks: unique ids;
   a tab name and a purpose line; the set exists in data/tools/lab-practical.json and has a station on the figure;
   every spot names a label that station ASKS (so a covered label, decision 30, is never shown), once; every point is
   inside the figure and inside the specimen's crop (figures/specimens/index.json), and the picture files exist;
   spots sit at least 30 figure pixels apart (one tap, one structure); "does" is short (the cause line fits two rows
   on a phone) and holds no term taught after the station's topic (the ordering rule, as the label explanations). */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPage, indexMap } from '../anp-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const COURSE = join(ROOT, 'anatomy-physiology');
const str = v => typeof v === 'string' && v.trim().length > 0;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function check(data, map) {
  const errors = [];
  const err = (where, msg) => errors.push(`lab-specimens ${where}: ${msg}`);
  if (!data || !Array.isArray(data.specimens) || !data.specimens.length) return ['lab-specimens: data.specimens must be a non-empty array'];
  const lab = JSON.parse(readFileSync(join(COURSE, 'data', 'tools', 'lab-practical.json'), 'utf8'));
  const idxPath = join(COURSE, 'figures', 'specimens', 'index.json');
  const index = existsSync(idxPath) ? JSON.parse(readFileSync(idxPath, 'utf8')) : {};
  const { topicIndex } = indexMap(map);
  const ids = new Set();
  for (const sp of data.specimens) {
    const where = `specimen ${sp.id}`;
    if (!str(sp.id) || ids.has(sp.id)) err(where, 'id missing or repeated');
    ids.add(sp.id);
    if (!str(sp.tab) || sp.tab.length > 12) err(where, 'tab must be a short name (12 characters at most)');
    if (!str(sp.purpose) || sp.purpose.split(/\s+/).length > 10) err(where, 'purpose must be one line of 10 words at most');
    const set = lab.sets.find(s => s.id === sp.set);
    if (!set) { err(where, `set "${sp.set}" is not in lab-practical.json`); continue; }
    const st = set.stations.find(s => s.figure === sp.figure);
    if (!st) { err(where, `set ${sp.set} has no station on ${sp.figure}`); continue; }
    const fig = lab.figures[sp.figure];
    const ix = index[sp.figure];
    if (!ix) err(where, 'no crop in figures/specimens/index.json (run python3 scripts/build-lab-specimens.py)');
    for (const ext of ['avif', 'webp']) if (!existsSync(join(COURSE, 'figures', 'specimens', `${sp.figure}.${ext}`))) err(where, `figures/specimens/${sp.figure}.${ext} is missing`);
    if (!Array.isArray(sp.spots) || sp.spots.length < 3) { err(where, 'needs at least 3 spots'); continue; }
    const seen = new Set();
    const pts = [];
    for (const s of sp.spots) {
      const w = `${where} spot ${s.label}`;
      const l = st.labels.find(x => x.id === s.label);
      if (!l) err(w, `not an asked label of ${sp.set} / ${sp.figure}`);
      if (seen.has(s.label)) err(w, 'repeated');
      seen.add(s.label);
      if (!Array.isArray(s.at) || !s.at.length) err(w, 'at must list at least one point');
      for (const p of s.at || []) {
        if (!Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)) { err(w, 'a point must be [x, y]'); continue; }
        if (fig && (p[0] < 0 || p[1] < 0 || p[0] >= fig.w || p[1] >= fig.h)) err(w, `point ${p} is outside the figure`);
        if (ix) { const [cx, cy, cw, ch] = ix.crop; if (p[0] < cx + 6 || p[1] < cy + 6 || p[0] > cx + cw - 6 || p[1] > cy + ch - 6) err(w, `point ${p} is outside the specimen's crop`); }
        pts.push({ label: s.label, p });
      }
      if (!str(s.does) || s.does.length > 56) err(w, '"does" must be a short phrase (56 characters at most)');
      else if (topicIndex.get(st.topic) !== undefined) {
        const later = scanPage(map, `<p>${esc(s.does)}</p>`, st.topic);
        if (later.length) err(w, `"does" uses a later term: ${later.join('; ')}`);
      }
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      if (pts[i].label === pts[j].label) continue;
      const d = Math.hypot(pts[i].p[0] - pts[j].p[0], pts[i].p[1] - pts[j].p[1]);
      if (d < 30) err(where, `spots ${pts[i].label} and ${pts[j].label} are ${Math.round(d)} px apart (30 at least)`);
    }
  }
  return errors;
}
