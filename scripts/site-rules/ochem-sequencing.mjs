/* The ochem chapter order holds, and nothing is used before it is taught.

   Audit findings (site audit 2026-10, "Organic Chemistry course", Sequencing
   and Coverage rows): Grignard reagents were taught in the Organometallics
   chapter but used throughout Carbonyl Chemistry before it; Aromatic
   Chemistry came after the carbonyl chapters that use benzaldehyde and
   acetophenone; IR and mass spectrometry sat near the end of the course
   instead of after the alkenes; the pericyclic chapter had no electrocyclic,
   sigmatropic or carbene chemistry. W9 reordered the course and added the
   two topics. This rule keeps it that way:

   1. ORDER. Organometallic bonding and Grignard reagents come before
      Carbonyl Chemistry; all of Aromatic Chemistry comes before Carbonyl
      Chemistry; IR and mass spectrometry are the chapter directly after
      Alkenes & Alkynes; NMR comes after aromaticity; the cyclopropanation
      and electrocyclic/sigmatropic topics exist in their chapters.
   2. NO NEW FORWARD REFERENCE. A glossary term used in a topic's notes,
      lesson, mechanism or bank items before the topic that teaches it is a
      forward reference (scripts/lib/ochem-order.mjs). The ones that exist
      were read and accepted (a labeled one-line preview, or a group name
      the Foundations chapter already introduced) and are listed in
      scripts/ochem-forward-refs-baseline.json. Any (topic, term) pair not in
      that list fails. Run node scripts/ochem-forward-refs.mjs to see them,
      fix the text, or, for a deliberate labeled preview, rerun it with
      --write-baseline.
   3. DIRECTION WORDS. A cross-reference link that says "later" next to a
      chapter already taught, or "you saw"/"earlier" next to one not yet
      taught, fails. These go stale silently when chapters move.
   4. NAMES. A link to learn.html#m-<chapter> must carry that chapter's name
      or one of its topics' (so a moved topic is not still credited to its
      old chapter), and every lesson and mechanism page's breadcrumb data
      must name the chapter the curriculum puts it in. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadModules, positions, topicSources, glossaryTerms, forwardRefs, directionProblems, decode } from '../lib/ochem-order.mjs';

/* Links whose direction words are about something else in the sentence,
   read and confirmed (topic|target|says). */
const DIRECTION_OK = new Set([
  'curved-arrows|m-carbonyl-chemistry|earlier',   // "the one you drew for acetone earlier" is this lesson's own step
  'amine-synthesis|directing-effects|later',     // "steers later substituents meta"
  'diazonium-chemistry|leaving-groups|later',    // "the best leaving group you will meet"
  'peptides-proteins|protecting-groups|later',   // "comes off later", said of the protecting group
]);

export default function({ ROOT, fail }){
  const M = loadModules(ROOT);
  const P = positions(M);
  const at = (id) => P.topic[id];
  const ch = (id) => M.find((m) => m.id === id);

  /* ---- 1. order ---- */
  const carbonyl = P.chapter['carbonyl-chemistry'];
  if (!carbonyl) fail('ochem-sequencing: no carbonyl-chemistry chapter');
  else {
    for (const t of ['organometallic-bonding', 'grignard-reagents']) {
      if (!(at(t) < carbonyl.first)) fail(`ochem-sequencing: ${t} must come before Carbonyl Chemistry (it is used from that chapter's first page)`);
    }
    const arom = P.chapter['aromatic-chemistry'];
    if (!arom || !(arom.last < carbonyl.first)) fail('ochem-sequencing: Aromatic Chemistry must come before Carbonyl Chemistry');
  }
  const alk = P.chapter['alkenes-alkynes'];
  const next = alk && M[alk.index + 1];
  const nextIds = next ? next.topics.map((t) => t.id) : [];
  if (!nextIds.includes('ir') || !nextIds.includes('mass-spec')) {
    fail('ochem-sequencing: IR and mass spectrometry must be the chapter directly after Alkenes & Alkynes');
  }
  if (!(at('h-nmr') > at('aromaticity'))) fail('ochem-sequencing: ¹H NMR must come after aromaticity (ring currents)');
  if (!ch('alkenes-alkynes')?.topics.some((t) => t.id === 'cyclopropanation')) fail('ochem-sequencing: cyclopropanation belongs in Alkenes & Alkynes');
  if (!ch('conjugation')?.topics.some((t) => t.id === 'electrocyclic-sigmatropic')) fail('ochem-sequencing: electrocyclic-sigmatropic belongs in Conjugation & Pericyclic Reactions');

  /* ---- 2. forward references ---- */
  const sources = topicSources(ROOT, M);
  const basePath = join(ROOT, 'scripts', 'ochem-forward-refs-baseline.json');
  const base = existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : {};
  const seen = new Set();
  for (const r of forwardRefs(M, sources, glossaryTerms(ROOT))) {
    const k = `${r.topic} ${r.term}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (!(base[r.topic] || []).includes(r.term)) {
      fail(`ochem-sequencing: ${r.topic} uses "${r.term}" (${r.kind} ${r.file}) before ${r.taughtIn} teaches it. ` +
           'Define it in place, reword, or mark a one-line preview and run node scripts/ochem-forward-refs.mjs --write-baseline.');
    }
  }

  /* ---- 3. direction words ---- */
  for (const d of directionProblems(M, sources)) {
    if (DIRECTION_OK.has(`${d.topic}|${d.target}|${d.says}`)) continue;
    fail(`ochem-sequencing: ${d.topic} (${d.kind}) links to ${d.target} with "${d.says}" wording, but the course order says otherwise: ${d.sentence.slice(0, 160)}`);
  }

  /* ---- 4. names ---- */
  const low = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.,]$/, '');
  for (const dir of ['notes', 'lessons', 'mechanisms']) {
    for (const f of readdirSync(join(ROOT, 'ochem', dir)).filter((x) => x.endsWith('.html'))) {
      const src = readFileSync(join(ROOT, 'ochem', dir, f), 'utf8');
      for (const m of src.matchAll(/<a\b[^>]*class="chapter-ref"[^>]*href="[^"]*learn\.html#m-([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const c = ch(m[1]);
        if (!c) { fail(`ochem-sequencing: ochem/${dir}/${f} links to learn.html#m-${m[1]}, which is not a chapter`); continue; }
        const lab = low(m[2]);
        const names = [c.title, ...c.topics.map((t) => t.title)].map(low);
        if (!names.some((n) => n === lab || n.includes(lab) || lab.includes(n))) {
          fail(`ochem-sequencing: ochem/${dir}/${f} labels a link to "${c.title}" as "${lab}"`);
        }
      }
    }
  }
  for (const m of M) for (const t of m.topics) {
    for (const href of [t.href, t.mechanism].filter((h) => h && !h.startsWith('notes/'))) {
      const file = join(ROOT, 'ochem', href);
      if (!existsSync(file)) continue;
      const crumb = readFileSync(file, 'utf8').match(/"position": 3,\s*"name": "([^"]*)",\s*"item": "[^"]*#m-([a-z0-9-]+)"/);
      if (crumb && (crumb[2] !== m.id || crumb[1] !== m.title)) {
        fail(`ochem-sequencing: ochem/${href} breadcrumb data names "${crumb[1]}" (#m-${crumb[2]}) but the topic is in "${m.title}" (#m-${m.id})`);
      }
    }
  }
}
