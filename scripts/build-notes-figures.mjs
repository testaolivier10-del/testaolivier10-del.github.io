/* Figures for the NREMT study notes.

   The notes had none, and not for want of wanting them: the chapters were an
   inline JavaScript array inside a 536 KB page, so a figure meant hand-writing
   SVG into a template literal in a file nobody could diff. The chapters are a
   JSON file now (nremt/assets/study-notes.json), which is what makes this
   practical — and the drawing kit the ochem textbook already uses turned out
   to be half generic: panel, bar, rule, arrow, text and figure know nothing
   about chemistry.

   Four figures, chosen where the prose is making a claim about SHAPE or
   SEQUENCE and a reader who has not seen one cannot picture it:

     ch21-chain         the six links, in order, with the two that belong to
                        the EMT marked. A chain is a picture by nature and the
                        notes were describing one in an ordered list.
     ch9-airway-path    where a breath goes, and where the epiglottis sits in
                        it, which is the whole reason that structure matters.
     ch9-fbao-cycle     the 2025 five-and-five, and the one thing that changes
                        with age. A cycle drawn as a cycle.
     ch21-depth         compression depth as a FRACTION of the chest, which is
                        what the numbers 2in/2in/1.5in actually mean and what
                        makes them look inconsistent until you see it.

   Each figure names the section id it belongs to and an anchor — a string
   already in that section's prose — and is written in after it, between
   markers, so the prose around it stays hand-edited:

     <!-- fig:id:start -->  ...generated...  <!-- fig:id:end -->

     node scripts/build-notes-figures.mjs            write
     node scripts/build-notes-figures.mjs --check    fail if stale (CI)
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { arrow, text, tag, label, rule, panel, bar, figure, P } from './lib/ochem-figure.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA = join(ROOT, 'nremt', 'assets', 'study-notes.json');
const check = process.argv.includes('--check');

const FIGURES = [];

/* ------------------------------------------------------------------ 1 ---
   The 2025 chain of survival. The notes list the six links; a list is the one
   thing a chain is not, and the 2025 revision — one chain for every arrest,
   adult or pediatric, in hospital or out — is easier to see than to say. */
FIGURES.push({
  id: 'ch21-chain',
  section: 'ch21-arrest-pathophys',
  anchor: 'Recovery and survivorship.</strong> Rehabilitation, follow-up, and psychological support, which continue for months to years.</li>\n            </ol>',
  viewBox: '0 0 700 268',
  alt: 'The six links of the 2025 AHA chain of survival in order, with high-quality CPR and defibrillation marked as the EMT\u2019s two',
  build() {
    const LINKS = [
      ['1', 'Recognition &', 'emergency activation'],
      ['2', 'High-quality', 'CPR'],
      ['3', 'Defibrillation', ''],
      ['4', 'Advanced', 'resuscitation'],
      ['5', 'Post\u2013cardiac', 'arrest care'],
      ['6', 'Recovery &', 'survivorship'],
    ];
    const OURS = new Set([1, 2]);
    const W = 196, GAP = 24, X0 = 22, H = 80, ROW = [46, 158];
    let s = '';
    s += text(350, 22, 'ONE CHAIN \u2014 ADULT OR PEDIATRIC, IN HOSPITAL OR OUT', { cls: 'fg-tag', size: 11.5, anchor: 'middle' });
    LINKS.forEach((lk, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = X0 + col * (W + GAP), y = ROW[row];
      const mine = OURS.has(i);
      s += panel(x, y, W, H, mine ? { kind: 'hi' } : {});
      if (mine) s += bar(x, y, W, H, { opacity: 0.14 });
      s += text(x + 16, y + 26, lk[0], { cls: 'fg-tag', size: 14, anchor: 'start' });
      s += text(x + W / 2, y + 46, lk[1], { cls: 'fg-lbl', size: 12.5, anchor: 'middle' });
      if (lk[2]) s += text(x + W / 2, y + 63, lk[2], { cls: 'fg-lbl', size: 12.5, anchor: 'middle' });
      if (col < 2) s += arrow(P(x + W + 2, y + H / 2), P(x + W + GAP - 2, y + H / 2));
    });
    s += arrow(P(X0 + 2 * (W + GAP) + W / 2, ROW[0] + H + 2), P(X0 + W / 2, ROW[1] - 2), { cls: 'fg-arrow-soft' });
    return s;
  },
  caption: 'The 2025 chain of survival. The 2020 guidelines ran separate chains for adults and children and for in-hospital and out-of-hospital arrest; 2025 went back to <b>one chain for all of them</b>.',
  note: 'Links 2 and 3 are shaded because they are the EMT\u2019s. High-quality CPR and defibrillation are the two interventions research shows reliably change the outcome, and both sit inside an EMT\u2019s scope of practice. Everything left of them is somebody noticing in time; everything right of them needs a hospital.',
});

/* ------------------------------------------------------------------ 2 ---
   Where a breath actually goes. The chapter opens by tracing the path in a
   sentence, then spends a section on the epiglottis without ever showing
   where in the path it sits. */
FIGURES.push({
  id: 'ch9-airway-path',
  section: 'ch9-airway',
  anchor: 'They un-fold something.</p>',
  viewBox: '0 0 700 236',
  alt: 'The path of a breath from nose and mouth through pharynx, larynx, trachea and bronchi to the alveoli, with the epiglottis marked at the larynx and the esophagus branching away',
  build() {
    const STOPS = [
      ['Nose / mouth', 'warmed, filtered'],
      ['Pharynx', 'shared with food'],
      ['Larynx', 'the epiglottis'],
      ['Trachea', 'held open by rings'],
      ['Bronchi', 'one per lung'],
      ['Alveoli', 'gas exchange'],
    ];
    const W = 100, GAP = 12, X0 = 20, Y = 52, H = 62;
    let s = '';
    s += text(X0, 28, 'THE PATH OF ONE BREATH', { cls: 'fg-tag', size: 11.5, anchor: 'start' });
    STOPS.forEach((st, i) => {
      const x = X0 + i * (W + GAP);
      s += panel(x, Y, W, H, i === 2 ? { kind: 'warn' } : {});
      s += text(x + W / 2, Y + 26, st[0], { cls: 'fg-lbl', size: 11.5, anchor: 'middle' });
      s += text(x + W / 2, Y + 44, st[1], { cls: 'fg-sm', size: 9.5, anchor: 'middle' });
      if (i < STOPS.length - 1) s += arrow(P(x + W + 1, Y + H / 2), P(x + W + GAP - 1, Y + H / 2));
    });
    const px = X0 + (W + GAP) + W / 2;
    s += arrow(P(px, Y + H + 2), P(px, Y + H + 32), { cls: 'fg-arrow-warn' });
    s += text(px, Y + H + 50, 'esophagus \u2014 food, and anything', { cls: 'fg-sm', size: 10, anchor: 'middle' });
    s += text(px, Y + H + 64, 'that comes back up', { cls: 'fg-sm', size: 10, anchor: 'middle' });
    s += text(X0 + 2 * (W + GAP) + W / 2, Y - 10, 'the gate', { cls: 'fg-tag-warn', size: 10.5, anchor: 'middle' });
    return s;
  },
  caption: 'Every breath follows the same path, and airway management is entirely about keeping it open. The <b>pharynx is shared</b> — it is the one place where the road to the lungs and the road to the stomach are the same road.',
  note: 'That sharing is why the epiglottis exists, and why it causes so much trouble: it is a single flap deciding, several times a minute, which pipe the next thing goes down. It is also why the tongue — which sits in the pharynx — is the most common airway obstruction in an unresponsive patient, and why suction is an airway skill rather than a cleaning one.',
});

/* ------------------------------------------------------------------ 3 ---
   The 2025 five-and-five, drawn as the cycle it is. The table in the section
   states it by age; this states the SHAPE, which is the part that is the same
   at every age and the part worth remembering under stress. */
FIGURES.push({
  id: 'ch9-fbao-cycle',
  section: 'ch9-fbao',
  anchor: "Abdominal thrusts are never used on an infant. An infant's liver is proportionally large and sits low, largely below the protection of the rib cage, and an abdominal thrust can tear it.</p>",
  viewBox: '0 0 700 282',
  alt: 'The choking cycle: five back blows, then five thrusts, repeated until the object clears or the patient goes unresponsive, with the thrusts differing by age',
  build() {
    let s = '';
    const Y = 56, H = 74;
    s += text(20, 26, 'SEVERE OBSTRUCTION \u2014 NO EFFECTIVE COUGH, NO SPEECH, NO AIR', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += panel(20, Y, 190, H, { kind: 'hi' });
    s += text(115, Y + 28, '5 back blows', { cls: 'fg-lbl', size: 13.5, anchor: 'middle' });
    s += text(115, Y + 47, 'between the shoulder blades,', { cls: 'fg-sm', size: 9.5, anchor: 'middle' });
    s += text(115, Y + 60, 'heel of the hand', { cls: 'fg-sm', size: 9.5, anchor: 'middle' });
    s += arrow(P(212, Y + H / 2), P(242, Y + H / 2));
    s += panel(244, Y, 190, H, { kind: 'hi' });
    s += text(339, Y + 28, '5 thrusts', { cls: 'fg-lbl', size: 13.5, anchor: 'middle' });
    s += text(339, Y + 50, 'the half that changes with age', { cls: 'fg-sm', size: 9.5, anchor: 'middle' });
    s += arrow(P(436, Y + H / 2), P(466, Y + H / 2));
    s += panel(468, Y, 212, H);
    s += text(574, Y + 26, 'Object out?', { cls: 'fg-lbl', size: 12.5, anchor: 'middle' });
    s += text(574, Y + 46, 'No \u2014 repeat the cycle', { cls: 'fg-sm', size: 9.5, anchor: 'middle' });
    s += text(574, Y + 60, 'Unresponsive \u2014 start CPR', { cls: 'fg-sm', size: 9.5, anchor: 'middle' });
    const AGES = [
      ['Adult', 'abdominal thrusts', ''],
      ['Child 1 to puberty', 'abdominal thrusts', ''],
      ['Infant under 1', 'chest thrusts', 'heel of one hand'],
    ];
    s += rule(20, 160, 680, 160);
    s += text(20, 182, 'AND WHAT THE THRUSTS ARE', { cls: 'fg-tag', size: 10.5, anchor: 'start' });
    AGES.forEach((a, i) => {
      const x = 20 + i * 222;
      s += text(x, 210, a[0], { cls: 'fg-tag', size: 10.5, anchor: 'start' });
      s += text(x, 228, a[1], { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      if (a[2]) s += text(x, 246, a[2], { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
    });
    s += text(20, 272, 'Never abdominal thrusts under 1 year \u2014 the infant liver is large, low, and poorly protected.', { cls: 'fg-sm', size: 10, anchor: 'start' });
    return s;
  },
  caption: 'The 2025 sequence. <b>Five back blows, then five thrusts, repeated</b> — the same shape at every age, and only the second half changes.',
  note: 'The back blows are the new part for adults and children, who used to get thrusts alone. In a cohort of 709 choking patients, back blows relieved more obstructions and caused fewer injuries than abdominal thrusts did; the five-and-five shape was chosen because infants were already being treated that way, so one sequence now covers everyone.',
});

/* ------------------------------------------------------------------ 4 ---
   Why 2 inches, 2 inches and 1.5 inches are the same instruction. The table
   gives three numbers that look arbitrary and unrelated; drawn against the
   chest they are measured in, they are one rule. */
FIGURES.push({
  id: 'ch21-depth',
  section: 'ch21-steps',
  anchor: 'deeper than about 2.4 inches in an adult causes injury without improving flow.</p>',
  viewBox: '0 0 700 272',
  alt: 'Compression depth drawn as a fraction of chest depth for adult, child and infant, showing that all three are about one third',
  build() {
    const CASES = [
      ['Adult', 6.0, 2.0, '2 to 2.4 in', '5\u20136 cm'],
      ['Child', 5.5, 2.0, 'about 2 in', 'one third'],
      ['Infant', 4.0, 1.5, 'about 1.5 in', 'one third'],
    ];
    const SCALE = 24, X0 = 48, GAP = 212, BASE = 186, BW = 120;
    let s = '';
    s += text(20, 28, 'DEPTH AGAINST THE CHEST IT IS MEASURED IN', { cls: 'fg-tag', size: 11, anchor: 'start' });
    CASES.forEach((c, i) => {
      const [name, chest, depth, inches, alt] = c;
      const x = X0 + i * GAP;
      const chestH = chest * SCALE, depthH = depth * SCALE;
      s += panel(x, BASE - chestH, BW, chestH, { r: 8 });
      s += bar(x, BASE - chestH, BW, depthH, { r: 8, opacity: 0.3 });
      s += rule(x - 6, BASE - chestH + depthH, x + BW + 6, BASE - chestH + depthH);
      s += text(x + BW / 2, BASE - chestH + depthH / 2 + 5, inches, { cls: 'fg-lbl', size: 12, anchor: 'middle' });
      s += text(x + BW / 2, BASE + 22, name, { cls: 'fg-tag', size: 11.5, anchor: 'middle' });
      s += text(x + BW / 2, BASE + 40, alt, { cls: 'fg-sm', size: 10, anchor: 'middle' });
      s += text(x + BW + 12, BASE - chestH + 14, Math.round((depth / chest) * 100) + '%', { cls: 'fg-tag', size: 11.5, anchor: 'start' });
    });
    s += text(20, 262, 'Three numbers, one rule: about a third of the way through the chest in front of you.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Why the three depths are not three rules. <b>2 inches, 2 inches and 1.5 inches</b> are all roughly one third of the chest they are measured in.',
  note: 'This is also why depth has an upper limit for the same reason it has a lower one. Too shallow and the heart is not squeezed; deeper than about a third and you are past the point where more depth adds flow, and into the range that breaks things. The adult figure is the only one given as a range — 2 to 2.4 inches — because for adults the guidelines set an explicit upper limit as well as a minimum.',
});

/* ---------------------------------------------------------------------- */
const START = (id) => `<!-- fig:${id}:start -->`;
const END = (id) => `<!-- fig:${id}:end -->`;

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const sections = new Map();
for (const ch of data.chapters) for (const sec of ch.sections) sections.set(sec.id, sec);

let changed = 0;
const stale = [];
for (const def of FIGURES) {
  const sec = sections.get(def.section);
  if (!sec) {
    console.error(`FAIL: ${def.id} targets section "${def.section}", which is not in the data.`);
    process.exit(1);
  }
  const html = figure({
    viewBox: def.viewBox,
    alt: def.alt,
    caption: def.caption,
    note: def.note,
    body: def.build(),
  });
  const block = `${START(def.id)}${html}${END(def.id)}`;

  // Which topic carries the figure: the one whose prose holds the anchor, or
  // the one that already holds the markers.
  let hit = null;
  for (const t of sec.topics) {
    const body = String(t.html || '');
    if (body.includes(START(def.id)) || body.includes(def.anchor)) { hit = t; break; }
  }
  if (!hit) {
    console.error(`FAIL: ${def.id} could not find its anchor in section "${def.section}":`);
    console.error(`      ${def.anchor.slice(0, 90)}`);
    process.exit(1);
  }

  const before = String(hit.html);
  const a = before.indexOf(START(def.id));
  const b = before.indexOf(END(def.id));
  const after = (a !== -1 && b !== -1)
    ? before.slice(0, a) + block + before.slice(b + END(def.id).length)
    : (() => {
        const at = before.indexOf(def.anchor) + def.anchor.length;
        return before.slice(0, at) + block + before.slice(at);
      })();

  if (after === before) continue;
  if (check) { stale.push(def.id); continue; }
  hit.html = after;
  changed++;
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} notes figure(s) are stale or missing: ${stale.join(', ')}`);
    console.error('Run: node scripts/build-notes-figures.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${FIGURES.length} notes figures are up to date.`);
} else {
  if (changed) {
    const body = data.chapters.map((c) => JSON.stringify(c)).join(',\n');
    writeFileSync(DATA, '{\n"chapters": [\n' + body + '\n]\n}\n');
  }
  console.log(`Wrote ${changed} of ${FIGURES.length} figures into nremt/assets/study-notes.json.`);
}
