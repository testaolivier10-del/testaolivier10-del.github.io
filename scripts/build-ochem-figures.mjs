/* Figures for the reaction-heavy half of the ochem textbook.

   Figure density across the book, counted before this file existed:

     Foundations                     2.8 per section
     Organic Structure               2.7
     Alkanes & Conformations         2.4
     ...
     Carbonyl Chemistry              1.3
     Aromatic Chemistry              1.3
     Carboxylic Acids & Derivatives  1.0
     Enolate Chemistry               1.0
     Amines                          1.0

   Exactly backwards. The front of the book is where a picture is a nice
   extra — a p orbital, a chair — and the back is where it is the only honest
   way to state the claim, because a reaction IS which bond broke and which
   formed. Prose can assert that; a drawing shows it.

   Each figure below names the section it belongs to and an anchor — a string
   already in that section's prose — and is written in after it. The generated
   block sits between markers so the prose around it stays hand-edited:

     <!-- fig:id:start -->  ...generated...  <!-- fig:id:end -->

   The markers live inside the prose, which build-notes-pages.mjs copies
   through untouched, so the two generators compose without knowing about
   each other.

   Figures can also live in scripts/ochem-figures/<topic>.mjs (one module per
   topic, default-exporting an array of definitions), and a definition can
   list `lessons: [...]` to show the same figure inside lesson steps, between
   the same markers placed in a step's HTML string.

     node scripts/build-ochem-figures.mjs                 write
     node scripts/build-ochem-figures.mjs --only=<topic>  write one module's figures
     node scripts/build-ochem-figures.mjs --check         fail if stale (CI)
*/
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, figure, P } from './lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing } from './lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from './lib/ochem-helpers.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
/* --only=<module> builds just the figures in scripts/ochem-figures/<module>.mjs
   and touches no other page, so two people working on two chapters' figures
   at once cannot overwrite each other's pages. */
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).replace(/\.mjs$/, '');

const FIGURES = [];




























































/* ---------------------------------------------------------------------- */










/* The nomenclature and functional-group figures live in scripts/ochem-figures/. */











/* ================================================================ F1 ---
   Foundations, second pass. The reviewer's count: the Lewis-structures
   section draws no organic molecule at all, the functional-groups section
   runs 2,500 words on one figure, and the three places a first reader most
   often draws something impossible (five-bond carbon, neutral four-bond
   nitrogen, a nitro group with no charges) are text only. These eight put a
   picture where the prose asks the reader to picture something.

   Everything here is condensed or Lewis notation on purpose: skeletal
   drawing is taught at the start of the next chapter, so a Foundations
   figure that used it would be showing a reader a notation they have not
   met. Lone pairs are drawn everywhere, because "the group is where the
   lone pairs are" is the argument these sections are making. */




























































/* ================================================================== ch5 ===
   Alkanes & Conformations, plus one for leaving-groups. Added after a review
   found the chapter asserting in prose the four things it is actually
   examined on: turning a structure into a Newman, drawing a chair, telling
   cis/trans on a ring from up/down, and the radical mechanism itself. */

/* A fishhook: one barb, because it carries one electron. `curve` in the kit
   draws a full two-barbed head, which in a radical mechanism says the wrong
   thing about how many electrons moved. */
function fishhook(a, b, opts = {}) {
  const f = (v) => (Math.round(v * 100) / 100);
  const bow = opts.bow ?? 30;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bow, cy = my + (dx / len) * bow;
  let ux = b.x - cx, uy = b.y - cy;
  const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
  const size = opts.size ?? 9;
  const px = -uy, py = ux;
  const side = opts.side ?? 1;
  const bx = b.x - ux * size, by = b.y - uy * size;
  const h = size * 0.6 * side;
  return `<path class="fg-arrow" d="M${f(a.x)} ${f(a.y)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}"></path>` +
         `<path class="fg-head" d="M${f(b.x)} ${f(b.y)} L${f(bx + px * h)} ${f(by + py * h)} L${f(bx)} ${f(by)} Z"></path>`;
}

/* The single dot that makes a species a radical. */
const dot = (x, y) => `<circle class="fg-lp" cx="${x}" cy="${y}" r="3.4"></circle>`;

/* A Newman projection. Angles are degrees clockwise from straight up, which
   is how a student reads a dihedral off the page. */
function newman(cx, cy, r, front, back, opts = {}) {
  const at = (a, R) => P(cx + R * Math.sin(a * Math.PI / 180), cy - R * Math.cos(a * Math.PI / 180));
  let s = '';
  // back spokes first, so the front circle and dot sit on top of them
  for (const [a, lab] of back) {
    const p1 = at(a, r), p2 = at(a, r + 21), p3 = at(a, r + 34);
    s += `<line class="fg-bond-soft" x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-atom" cx="${cx}" cy="${cy}" r="${r}"></circle>`;
  for (const [a, lab] of front) {
    const p2 = at(a, r), p3 = at(a, r + 13);
    s += `<line class="fg-bond" x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}"></line>`;
    s += text(p3.x, p3.y + 3.5, lab, { cls: 'fg-lbl', size: lab.length > 1 ? 9.5 : 11 });
  }
  s += `<circle class="fg-lp-mut" cx="${cx}" cy="${cy}" r="4.5"></circle>`;
  return s;
}

/* The chair, taken from the one already drawn in axial-equatorial (the
   twelve-position figure), so a new drawing cannot disagree with the book's
   own reference. Offsets are relative to the ring center; axial is vertical
   and alternates, and each equatorial unit vector is the one that figure
   uses, which is parallel to the ring bond two carbons round and tilted
   OPPOSITE to that carbon's axial. Getting that tilt backwards is the
   classic bad chair, so it is measured here rather than re-derived. */
const CHAIR_V = [
  P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72),
  P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72),
];
const CHAIR_EQ = [
  P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104),
  P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104),
];
function chair(cx, cy, k = 1) {
  return CHAIR_V.map((v) => P(cx + v.x * k, cy + v.y * k));
}
const chairRing = (pts, cls) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0, cls })).join('');
/* Axial: straight up on the even carbons, straight down on the odd ones. */
const axialEnd = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? -L : L));
/* Equatorial: outward, and tilted the other way from that carbon's axial. */
const equatorialEnd = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y + CHAIR_EQ[i].y * L);








/* ---------------------------------------------------------------- ch5.8 ---
   The figure the whole ring-flips section turns on. The hand-drawn version it
   replaces reused the SAME ring outline for "the other chair" and merely moved
   the methyl from the vertical bond to the outward one — which, on an
   unchanged outline, moves the group to the other FACE, the exact mistake the
   prose beside it warns against. A flip is a reflection of the ring, so the
   right-hand chair is drawn by negating every vertex's height (and with it the
   axial and equatorial directions), which is what the ring-flips lesson does. */
const chairFlipped = (cx, cy, k = 1) => CHAIR_V.map((v) => P(cx + v.x * k, cy - v.y * k));
/* In the reflected ring every axial reverses: the even carbons now point down. */
const axialEndF = (pts, i, L = 34) => P(pts[i].x, pts[i].y + (i % 2 === 0 ? L : -L));
const equatorialEndF = (pts, i, L = 32) => P(pts[i].x + CHAIR_EQ[i].x * L, pts[i].y - CHAIR_EQ[i].y * L);



/* ================================================================== ch6 ===
   Stereochemistry. The chapter was carrying its three-dimensional claims in
   prose — allenes held perpendicular, a nitrogen turning itself inside out,
   two chair conformers that are each other's mirror image, a plane of
   polarization being rotated — and a claim about shape that you cannot look
   at is a claim a student has to take on trust. Every figure below draws one
   of those, and each one was checked by assigning CIP priorities to the
   coordinates that are actually emitted rather than to the molecule that was
   meant. */

/* (moved to lib/ochem-helpers.mjs) */








/* A stereocenter on a vertical chain, drawn the way this chapter's tartaric
   acid figure draws them: the chain runs up and down in the plane of the
   page, and the other two groups sit on a wedge and a hash at `deg` and
   180-deg. `left` is the group on the wedge. */
function chainCentre(c, deg, wedgeLabel, hashLabel) {
  const w = armEnd(c, deg, 46), h = armEnd(c, 180 - deg, 46);
  let g = wedge(c, w, { rFrom: 15, rTo: 15, width: 10 });
  g += hash(c, h, { rFrom: 15, rTo: 13, width: 13, rungs: 4 });
  g += atom(w.x, w.y, wedgeLabel, { r: 15, size: 10, kind: 'hi' });
  g += atom(h.x, h.y, hashLabel, { r: 13, size: 11 });
  g += atom(c.x, c.y, 'C', { r: 15 });
  return g;
}







/* ================================================================== ch7 ===
   Substitution & elimination. The chapter carried its hardest claims in
   prose: a transition state that is not an intermediate (asserted four times,
   drawn never), two rearrangements called "the commonest source of wrong
   products" with no picture of a group moving, the two arrows of an E1
   deprotonation, and the two three-dimensional arguments the E2 section rests
   on — menthyl's ring flip and the stereospecific pair. Every figure below
   draws one of those. */

/* An energy profile through a list of nodes, each a minimum or a maximum,
   with a horizontal tangent at every node — which is what makes a well look
   like a well rather than a corner. */
function profile(nodes, cls = 'fg-bond-hi') {
  let d = `M${nodes[0].x} ${nodes[0].y}`;
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i - 1], b = nodes[i], h = (b.x - a.x) * 0.5;
    d += ` C${a.x + h} ${a.y} ${b.x - h} ${b.y} ${b.x} ${b.y}`;
  }
  return `<path class="${cls}" d="${d}"></path>`;
}



/* tert-Butyl and its relatives: a central carbon with three methyls and,
   optionally, a fourth group at the given angle. */
function tBu(c, fourth, opts = {}) {
  let g = '';
  for (const deg of [120, 180, 240]) {
    const e = armEnd(c, deg, 46);
    g += bond(c, e, { rFrom: 15, rTo: 17 });
    g += atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
  }
  if (fourth) {
    const e = armEnd(c, 0, 46);
    g += bond(c, e, { rFrom: 15, rTo: fourth.r ?? 15, cls: fourth.cls });
    g += atom(e.x, e.y, fourth.label, { r: fourth.r ?? 15, size: fourth.size ?? 12, kind: fourth.kind });
  }
  g += atom(c.x, c.y, 'C', { kind: opts.kind });
  if (opts.charge) g += text(c.x + 2, c.y - 22, opts.charge, { cls: 'fg-tag-warn', size: 16 });
  return g;
}







/* ================================================================== ch8 ===
   The alkene/alkyne chapter had 1.25 figures per section and four separate
   places where the only statement of a geometric fact was a sentence. These
   nine draw the ones a student cannot check without a picture: which way the
   p orbitals point, which groups E/Z is actually ranking, where a proton
   goes and where the charge lands, and what "syn" does to a ring. */

/* (moved to lib/ochem-helpers.mjs) */


















































































/* ---------------------------------------------------------------- 200 ---
   Chapter 16 had 1.3 figures per section and makes four of its central
   claims in prose alone: where 4n + 2 comes from, which nitrogen lone pair
   is in the pi system, why the first EAS step is the slow one, and which
   three carbons the arenium charge actually reaches. Each of those is a
   picture the student is currently asked to build in their head. */









/* ------------------------------------------------------------ Spectroscopy ---
   The chapter taught four techniques and showed no spectrum. A region map is
   not a spectrum, a range chart is not a spectrum, and three structures are
   not a spectrum: a student could finish the chapter having never seen the
   thing every exam question in the subject puts in front of them. These five
   figures are the missing pictures. Every peak position drawn below is a real
   textbook value for the named compound. */

/* A % transmittance trace. Absorptions are Gaussian dips from a 100 %T
   baseline, which is what an IR trace actually is, and the sampling step
   tightens near a sharp band so a narrow spike does not come out triangular. */
function irTrace(peaks, X, Y) {
  const T = (w) => {
    let t = 100;
    for (const p of peaks) t -= p.d * Math.exp(-Math.pow((w - p.c) / p.s, 2) / 2);
    return Math.max(t, 3);
  };
  const near = (w) => peaks.some((p) => p.s < 40 && Math.abs(w - p.c) < 90);
  const pts = [];
  let w = 4000;
  while (w >= 500) {
    pts.push(`${n2(X(w))} ${n2(Y(T(w)))}`);
    w -= near(w) ? 3 : 14;
  }
  pts.push(`${n2(X(500))} ${n2(Y(T(500)))}`);
  return `<path class="fg-bond" d="M${pts.join(' L')}"></path>`;
}
/* (moved to lib/ochem-helpers.mjs) */

/* A stick, for the three spectra that are line spectra rather than traces. */
function stick(x, yBase, h, cls = 'fg-bond', w = 2.6) {
  return `<line class="${cls}" x1="${n2(x)}" y1="${n2(yBase)}" x2="${n2(x)}" y2="${n2(yBase - h)}" stroke-width="${w}"></line>`;
}








































/* ---------------------------------------------------------------- 22 ---
   Chapter 22 drew no molecules at all: five sections of reagent-and-product
   material whose central claims — a Meisenheimer complex, a benzyne, a
   benzylic resonance set, a phenoxide, a Birch intermediate, a diazotization
   — were made in prose and never shown. These six draw them. */

/* A hexagon kit the six figures below share. Vertex 0 is the top and the
   numbering runs clockwise, so 1 and 5 are ortho, 2 and 4 meta, 3 para. */
function hexKit(R) {
  const V = (cx, cy) => {
    const v = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
    }
    return v;
  };
  /* A point `d` further out along the line from the ring centre through
     vertex i — where a substituent hangs. */
  const out = (cx, cy, i, d) => {
    const v = V(cx, cy)[i];
    return P(v.x + ((v.x - cx) / R) * d, v.y + ((v.y - cy) / R) * d);
  };
  const ring = (cx, cy, doubles, opts = {}) => {
    const v = V(cx, cy), mid = P(cx, cy);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: opts.inset ?? 9, gap: opts.gap ?? 4 });
      else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  /* A substituent on vertex i: a bond out to a labelled disc. */
  const sub = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 34);
    const r = o.r ?? 16;
    return bond(V(cx, cy)[i], p, { rFrom: 0, rTo: r, cls: o.bondCls }) +
           atom(p.x, p.y, txt, { kind: o.kind || 'plain', r, size: o.size });
  };
  /* A charge or dot sitting just outside vertex i. */
  const mark = (cx, cy, i, txt, o = {}) => {
    const p = out(cx, cy, i, o.d ?? 19);
    return text(p.x, p.y + (o.dy ?? 5), txt, { cls: o.cls || 'fg-warn', size: o.size ?? 15 });
  };
  return { V, out, ring, sub, mark };
}
















/* ---------------------------------------------------------------- ch7.5 ---
   Energy diagrams & the Hammond postulate. Four figures, all of them the
   same object — a curve over a free-energy axis — because the whole section
   is about reading one picture in four different ways. The shared helpers
   below draw the axis, a smooth hill between two plateaus, and the two
   measuring arrows (a barrier and a plateau-to-plateau gap), so the four
   definitions differ only in the numbers, which is the honest way to show
   that only the numbers differ. */

/* A vertical double-headed arrow with its own short guide lines: the way a
   textbook marks a height on one of these diagrams. */
function measure(x, yTop, yBottom, opts = {}) {
  const c = opts.cls || 'fg-arrow';
  const h = opts.head || 'fg-head';
  let g = `<line class="${c}" x1="${x}" y1="${yBottom - 6}" x2="${x}" y2="${yTop + 7}"></line>`;
  g += `<path class="${h}" d="M${x} ${yTop} L${x + 3.6} ${yTop + 7} L${x - 3.6} ${yTop + 7} Z"></path>`;
  g += `<line class="${c}" x1="${x}" y1="${yTop + 6}" x2="${x}" y2="${yBottom - 7}"></line>`;
  g += `<path class="${h}" d="M${x} ${yBottom} L${x - 3.6} ${yBottom - 7} L${x + 3.6} ${yBottom - 7} Z"></path>`;
  return g;
}

/* One hill: a plateau, a rise to a peak at `peakX`, a fall to a second
   plateau. Returned as a path so the caller can pick the stroke class. */
function hill(xA, yA, xP, yP, xB, yB, cls = 'fg-bond-hi') {
  const lead = (xP - xA) * 0.55, tail = (xB - xP) * 0.55;
  return `<path class="${cls}" fill="none" d="M${xA} ${yA} C${xA + lead} ${yA} ${xP - lead * 0.45} ${yP} ${xP} ${yP} ` +
         `C${xP + tail * 0.45} ${yP} ${xB - tail} ${yB} ${xB} ${yB}"></path>`;
}





/* ---------------------------------------------------------------- 78 ---
   The Carbocations section of How Reactions Happen. It owns the general
   teaching that SN1 used to re-derive: the shape and the empty orbital, the
   hyperconjugation picture, the stability ladder, why vinyl and aryl are
   excluded, and the 1,2-shifts. Every one of those is a claim about geometry
   or about an ordering, which is exactly what prose cannot show. */








/* ---------------------------------------------------------------- 30 ---
   Cis/trans and E/Z. Five drawings for a section whose whole subject is a
   spatial relationship: which face of a ring a group sits on, which side of
   a double bond, and which of two branches outranks the other. Prose can
   assert all three and a reader still has to picture them. */















/* --------------------------------------------------------------- 230 ---
   The three figures the self-study pass deferred. Each is a structure the
   prose names and the reader has never been shown: a five-membered ring with
   one heteroatom between two carbonyls, a four-membered amide, and a polymer
   taken apart at its linkages. */

/* An open retrosynthetic arrow between two points: a double shaft and a
   filled head, the way the retrosynthesis figure draws it by hand. */
function openArrow(a, b, opts = {}) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux;
  const g = opts.gap ?? 4, hl = opts.head ?? 16, hw = opts.width ?? 9;
  const r = (v) => Math.round(v * 100) / 100;
  const ex = b.x - ux * (hl - 2), ey = b.y - uy * (hl - 2);
  let o = '';
  for (const k of [-g, g]) {
    o += `<line class="fg-arrow" x1="${r(a.x + px * k)}" y1="${r(a.y + py * k)}" x2="${r(ex + px * k)}" y2="${r(ey + py * k)}"></line>`;
  }
  const bx = b.x - ux * hl, by = b.y - uy * hl;
  o += `<path class="fg-head" d="M${r(b.x)} ${r(b.y)} L${r(bx + px * hw)} ${r(by + py * hw)} L${r(bx - px * hw)} ${r(by - py * hw)} Z"></path>`;
  return o;
}

/* The squiggle that marks a disconnection, drawn across a bond at its
   midpoint so it reads as a cut through that bond and not as a bond. */
function squiggle(a, b, opts = {}) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = (b.x - a.x) / L, uy = (b.y - a.y) / L, px = -uy, py = ux;
  const half = opts.half ?? 20;
  let d = '';
  for (let i = 0; i <= 8; i++) {
    const t = -half + (i * half) / 4;
    const off = i % 2 === 0 ? 0 : (i % 4 === 1 ? 5 : -5);
    const x = mx + px * t + ux * off, y = my + py * t + uy * off;
    d += (i === 0 ? 'M' : 'L') + `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100} `;
  }
  return `<path class="${opts.cls || 'fg-dash-hi'}" fill="none" d="${d.trim()}"></path>`;
}





/* Figure modules. A figure written for one topic can live in its own file
   under scripts/ochem-figures/, which default-exports an array of figure
   definitions in the same shape as the ones above. This keeps a rewrite of
   one chapter's figures out of everyone else's way. */
const MOD_DIR = join(ROOT, 'scripts', 'ochem-figures');
if (existsSync(MOD_DIR)) {
  for (const f of readdirSync(MOD_DIR).filter((f) => f.endsWith('.mjs') && (!only || f === `${only}.mjs`)).sort()) {
    const mod = await import(pathToFileURL(join(MOD_DIR, f)).href);
    for (const def of mod.default) FIGURES.push({ ...def, from: f });
  }
}
{
  const seen = new Set();
  for (const def of FIGURES) {
    // One id per page: two figures on different pages may share an id, since
    // each page carries its own markers (nitrogen-inversion does).
    for (const page of [def.section, ...(def.lessons || []).map((l) => 'lesson:' + l)].filter(Boolean)) {
      const key = `${def.id}@${page}`;
      if (seen.has(key)) { console.error(`FAIL: two figures share the id ${def.id} on ${page}.`); process.exit(1); }
      seen.add(key);
    }
  }
}

const START = (id) => `<!-- fig:${id}:start -->`;
const END = (id) => `<!-- fig:${id}:end -->`;

/* A figure can also be shown in a lesson. A lesson's steps are HTML inside
   single-quoted JavaScript strings, so the lesson carries the markers inside
   one of those strings, where its author wants the figure, and the block
   written there is one line with every quote and backslash made safe for
   that string. The words and the drawing are the same ones the notes page
   shows, so the two cannot drift. A lesson listed in `lessons` must already
   carry the markers: where a figure sits in a lesson is the author's call. */
const forJsString = (html) => html.replace(/\\/g, '\\\\').replace(/'/g, '&#39;').replace(/\n/g, ' ');

let wrote = 0;
const stale = [];
function place(file, rel, def, block, anchorOk) {
  const current = readFileSync(file, 'utf8');
  let next;
  const a = current.indexOf(START(def.id));
  const b = current.indexOf(END(def.id));
  if (a !== -1 && b !== -1) {
    next = current.slice(0, a) + block + current.slice(b + END(def.id).length);
  } else {
    const at = anchorOk && def.anchor ? current.indexOf(def.anchor) : -1;
    if (at === -1) {
      console.error(`FAIL: ${def.id} has no markers in ${rel}` + (anchorOk ? ` and could not find its anchor: ${def.anchor}` : '.'));
      process.exit(1);
    }
    const insert = at + def.anchor.length;
    next = current.slice(0, insert) + '\n' + block + current.slice(insert);
  }
  if (next === current) return;
  if (check) { stale.push(`${def.id} (${rel})`); return; }
  writeFileSync(file, next);
  wrote++;
}

for (const def of FIGURES) {
  if (only && def.from !== `${only}.mjs`) continue;
  const html = figure({
    viewBox: def.viewBox,
    alt: def.alt,
    caption: def.caption,
    note: def.note,
    body: def.build(),
  });
  if (def.section) {
    const rel = `ochem/notes/${def.section}.html`;
    const file = join(ROOT, rel);
    if (!existsSync(file)) {
      console.error(`FAIL: ${def.id} targets ${rel}, which does not exist.`);
      process.exit(1);
    }
    place(file, rel, def, `${START(def.id)}\n${html}\n${END(def.id)}`, true);
  }
  for (const lesson of def.lessons || []) {
    const rel = `ochem/lessons/${lesson}.html`;
    const file = join(ROOT, rel);
    if (!existsSync(file)) {
      console.error(`FAIL: ${def.id} targets ${rel}, which does not exist.`);
      process.exit(1);
    }
    place(file, rel, def, `${START(def.id)}${forJsString(html)}${END(def.id)}`, false);
  }
}

if (check) {
  if (stale.length) {
    console.error(`FAIL: ${stale.length} figure(s) are stale or missing: ${stale.join(', ')}`);
    console.error('Run: node scripts/build-ochem-figures.mjs');
    process.exit(1);
  }
  console.log(`OK — all ${FIGURES.length} generated figures are up to date.`);
} else {
  console.log(`Wrote ${wrote} of ${FIGURES.length} figures.`);
}
