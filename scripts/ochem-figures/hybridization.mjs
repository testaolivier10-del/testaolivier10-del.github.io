/* Figures for the hybridization notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This topic sits in Foundations, before skeletal structures, so every
   drawing writes every atom out with its label. Orbitals follow one color
   rule throughout: a hybrid is gray (it is a mixture), and a leftover p
   orbital is drawn in the two phase colors, so the reader can count the
   leftover p orbitals at a glance. Lesson copies (id prefix l-) are 340 wide
   or less, stacked, and use only fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, lonePair, text, tag, label, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* Screen direction for a math angle: 0 is east, 90 is up. */
const dir = (deg) => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
const at = (c, deg, len) => { const d = dir(deg); return P(c.x + d.x * len, c.y + d.y * len); };
const r2 = (v) => Math.round(v * 100) / 100;

/* An atom disc that stays opaque in both themes: the highlighted disc's
   fill is translucent in the dark theme, so an opaque plain disc goes under
   it and hides any orbital or bond drawn behind the atom. */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'plain' || kind === 'point' ? '' :
    `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>`;
  return back + atom0(x, y, l, o);
}

/* A tetrahedral center in the site's wedge-and-dash convention: two plain
   bonds in the page pointing down, one wedge (toward the reader) and one
   hash (away) pointing up, side by side. Each slot holds 'H' or 'lp'. */
function tetCenter(c, el, slots, L = 50, rc = 16) {
  const dirs = [
    { deg: 215, kind: 'plain' }, { deg: 325, kind: 'plain' },
    { deg: 118, kind: 'wedge' }, { deg: 62, kind: 'hash' },
  ];
  let g = '';
  dirs.forEach((d, i) => {
    if (slots[i] === 'lp') { const a = d.deg > 90 ? d.deg + 12 : d.deg - 12; g += lonePair(c.x, c.y, -a, { dist: rc + 16, spread: 5, r: 2.6 }); return; }
    const e = at(c, d.deg, d.kind === 'plain' ? L : L * 0.92);
    const o = { rFrom: rc, rTo: 12 };
    g += d.kind === 'wedge' ? wedge(c, e, { ...o, width: 10 }) : d.kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 5 }) : bond(c, e, o);
    g += atom(e.x, e.y, slots[i], { r: 12 });
  });
  g += atom(c.x, c.y, el, { kind: 'hi', r: rc });
  return g;
}

/* A CH3 carbon whose fourth bond (to the rest of the molecule) leaves at
   math angle `toward`: one H in the page, one wedged, one hashed. */
function methyl(c, toward = 0) {
  const arms = [
    { deg: toward + 125, kind: 'plain' },
    { deg: toward + 210, kind: 'wedge' },
    { deg: toward + 248, kind: 'hash' },
  ];
  let g = '';
  for (const a of arms) {
    const e = at(c, a.deg, a.kind === 'plain' ? 54 : 50);
    const o = { rFrom: 15, rTo: 12 };
    g += a.kind === 'wedge' ? wedge(c, e, { ...o, width: 10 }) : a.kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 5 }) : bond(c, e, o);
    g += atom(e.x, e.y, 'H', { r: 12 });
  }
  return g;
}

function ell(cx, cy, rx, ry, deg, cls, extra = '') {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"${extra}></ellipse>`;
}

/* A hybrid orbital, drawn as the big gray lobe it bonds with. Every hybrid
   also has a small back lobe; it is left off (the captions say so), or the
   back lobes would pile up at the nucleus. `len` is how far the lobe reaches. */
function hybrid(c, deg, len = 56, w = 16, opts = {}) {
  const d = dir(deg);
  const big = P(c.x + d.x * len * 0.54, c.y + d.y * len * 0.54);
  const op = opts.faint ? 0.1 : 0.24;
  return ell(big.x, big.y, len * 0.5, w, deg, 'fg-fill-mut fg-bond-soft', ` fill-opacity="${op}"`);
}

/* A p orbital: two lobes on opposite sides of the nucleus, one in each phase
   color. With `empty` both lobes are drawn as dashed outlines. */
function pOrb(c, deg, len = 40, w = 13, opts = {}) {
  const d = dir(deg);
  const a = P(c.x + d.x * len * 0.52, c.y + d.y * len * 0.52);
  const b = P(c.x - d.x * len * 0.52, c.y - d.y * len * 0.52);
  if (opts.empty) {
    return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb-node') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-node');
  }
  return ell(a.x, a.y, len * 0.5, w, deg, 'fg-orb') + ell(b.x, b.y, len * 0.5, w, deg, 'fg-orb-alt');
}

/* An arc from math angle a1 to a2 (a2 > a1), radius r, about c. */
function arc(c, r, a1, a2) {
  const p1 = at(c, a1, r), p2 = at(c, a2, r);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `<path class="fg-bond-soft" d="M${r2(p1.x)} ${r2(p1.y)} A${r} ${r} 0 ${large} 0 ${r2(p2.x)} ${r2(p2.y)}"></path>`;
}

/* One electron (or an arrow for one) in an orbital box, for energy diagrams. */
function box(x, y, e, hi = false) {
  let s = `<rect class="${hi ? 'fg-panel-hi' : 'fg-panel'}" x="${x - 15}" y="${y - 13}" width="30" height="26" rx="5"></rect>`;
  const up = (xx) => arrow(P(xx, y + 9), P(xx, y - 9), { size: 5 });
  const down = (xx) => arrow(P(xx, y - 9), P(xx, y + 9), { size: 5 });
  if (e === 1) s += up(x);
  if (e === 2) s += up(x - 5) + down(x + 5);
  return s;
}

/* The four tetrahedral directions as drawn on paper: two in the plane of the
   page (up and lower left), one toward the reader (lower right) and one away
   (below, slightly right). */
const TET = { up: 90, left: 210, front: 330, back: 283 };

/* Four sp3 hybrids on a tetrahedron, back lobe first so the front ones sit
   on top of it. */
function sp3Set(c, len = 56, w = 16) {
  return hybrid(c, TET.back, len * 0.78, w * 0.85, { faint: true }) +
         hybrid(c, TET.up, len, w) + hybrid(c, TET.left, len, w) + hybrid(c, TET.front, len * 1.05, w * 1.05);
}

/* The oblique view used for anything flat: the molecule's plane is seen from
   a little above, so directions in that plane are squashed vertically and a
   direction at right angles to the plane is straight up the page. */
const FLAT = 0.34;
const flatDir = (phi) => ({ x: Math.cos(rad(phi)), y: -Math.sin(rad(phi)) * FLAT });
const flatAt = (c, phi, len) => { const d = flatDir(phi); return P(c.x + d.x * len, c.y + d.y * len); };
const flatDeg = (phi) => { const d = flatDir(phi); return (Math.atan2(-d.y, d.x) * 180) / Math.PI; };
const flatLen = (phi, len) => { const d = flatDir(phi); return Math.hypot(d.x, d.y) * len; };

/* sp2 set: three hybrids in the flat plane, 120 degrees apart, and the
   leftover p straight up through them. */
function sp2Set(c, len = 58, opts = {}) {
  let s = '';
  s += ell(c.x, c.y, len * 1.18, len * 1.18 * FLAT + 6, 0, 'fg-dash');
  const phis = [60, 180, 300];
  for (const phi of [60, 180]) s += hybrid(c, flatDeg(phi), flatLen(phi, len) + 8, 14);
  s += pOrb(c, 90, opts.pLen ?? 76, 15, { empty: opts.emptyP });
  s += hybrid(c, flatDeg(300), flatLen(300, len) + 10, 15);
  return { s, ends: phis.map((phi) => flatAt(c, phi, len + 14)) };
}

/* sp set: two hybrids on a straight line, one leftover p up the page and one
   pointing out toward the reader (drawn foreshortened, down and to the left). */
function spSet(c, len = 58) {
  let s = '';
  s += pOrb(c, 90, 76, 15);
  s += pOrb(c, 222, 52, 12);
  s += hybrid(c, 180, len, 15) + hybrid(c, 0, len, 15);
  return s;
}

/* ================================================== promotion (notes) === */
FIGURES.push({
  id: 'carbon-promotion',
  section: 'hybridization',
  anchor: 'Bonding is so profitable that promotion happens essentially every time carbon bonds.</p>',
  viewBox: '0 0 760 250',
  alt: 'Orbital box diagrams for carbon in three stages. Ground state: 2s holds a pair, two 2p boxes hold one electron each and one 2p box is empty. After promotion: 2s holds one electron and all three 2p boxes hold one each, four unpaired electrons. After mixing: four identical sp3 boxes at one energy, one electron in each.',
  build() {
    let s = '';
    const cols = [
      { x: 128, t: 'ground state', cfg: '1s² 2s² 2p²', sub: '2 unpaired electrons' },
      { x: 380, t: 'after promotion', cfg: '1s² 2s¹ 2p³', sub: '4 unpaired, but s ≠ p' },
      { x: 652, t: 'after mixing', cfg: '1s² (sp³)⁴', sub: '4 identical orbitals' },
    ];
    // energy axis
    s += arrow(P(26, 176), P(26, 56), { size: 7 });
    s += `<text class="fg-sm" x="18" y="118" text-anchor="middle" font-size="10.5" transform="rotate(-90 18 118)">energy</text>`;
    cols.forEach((c, i) => {
      s += tag(c.x, 28, c.t);
      if (i < 2) {
        s += text(c.x - 78, 84, '2p', { cls: 'fg-lbl', size: 12 });
        s += text(c.x - 78, 154, '2s', { cls: 'fg-lbl', size: 12 });
        const fill = i === 0 ? [1, 1, 0] : [1, 1, 1];
        [-36, 0, 36].forEach((dx, k) => { s += box(c.x + dx, 80, fill[k]); });
        s += box(c.x - 36, 150, i === 0 ? 2 : 1);
      } else {
        s += text(c.x - 94, 120, 'sp³', { cls: 'fg-lbl', size: 12 });
        [-54, -18, 18, 54].forEach((dx) => { s += box(c.x + dx, 116, 1, true); });
      }
      s += text(c.x, 200, c.cfg, { cls: 'fg-lbl', size: 13 });
      s += text(c.x, 222, c.sub, { cls: 'fg-sm', size: 10.5 });
    });
    s += arrow(P(226, 118), P(282, 118));
    s += text(254, 106, 'promote', { cls: 'fg-tag', size: 11 });
    s += text(254, 138, '≈ 96 kcal/mol', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(474, 118), P(528, 118));
    s += text(501, 106, 'mix', { cls: 'fg-tag', size: 11 });
    s += text(501, 138, '4 in, 4 out', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Carbon’s valence orbitals at each stage. Count the unpaired electrons under each column: two, then four, then still four, now in four boxes at one energy.',
});

/* ================================================= promotion (lesson) === */
FIGURES.push({
  id: 'l-carbon-promotion',
  lessons: ['hybridization'],
  viewBox: '0 0 340 330',
  alt: 'Carbon orbital boxes before and after promotion. Before: 2s holds a pair, two 2p boxes hold one electron each, one 2p box is empty. An arrow labeled promote leads to the after state: one electron in 2s and one in each of the three 2p boxes.',
  build() {
    let s = '';
    const state = (y0, title, fill2s, fillp, cfg) => {
      let g = panel(8, y0, 324, 120);
      g += tag(170, y0 + 22, title);
      g += label(58, y0 + 62, '2p', { size: 12 });
      g += label(58, y0 + 98, '2s', { size: 12 });
      [0, 1, 2].forEach((k) => { g += box(110 + k * 38, y0 + 58, fillp[k]); });
      g += box(110, y0 + 94, fill2s);
      g += label(262, y0 + 80, cfg, { size: 12 });
      return g;
    };
    s += state(8, 'ground state: 2 unpaired', 2, [1, 1, 0], '2s² 2p²');
    s += arrow(P(170, 136), P(170, 186));
    s += tag(186, 166, 'promote one 2s electron', { anchor: 'start' });
    s += state(196, 'promoted: 4 unpaired', 1, [1, 1, 1], '2s¹ 2p³');
    return s;
  },
  caption: 'One 2s electron moves up into the empty 2p box.',
});

/* ================================================ sp3 from mixing (notes) === */
FIGURES.push({
  id: 'sp3-mixing',
  section: 'hybridization',
  anchor: 'These are <b>sp³</b> orbitals: one part s, three parts p.</p>',
  viewBox: '0 0 760 290',
  alt: 'Three panels. Left: carbon’s unmixed orbitals, a round s orbital and three p dumbbells at right angles, labeled 90 degrees. Middle: four identical gray sp3 hybrid lobes pointing to the corners of a tetrahedron, 109.5 degrees apart. Right: methane, with four hydrogens bonded along those four directions, two in the page, one wedged toward the reader and one hashed away.',
  build() {
    let s = '';
    const titles = ['unmixed: 1 s + 3 p', 'mixed: 4 sp³ hybrids', 'methane, CH₄'];
    const tags = ['p orbitals sit at 90° to each other', 'four identical lobes, 109.5° apart', 'four identical C–H bonds'];
    [14, 262, 510].forEach((x, i) => {
      s += panel(x, 14, 236, 256);
      s += label(x + 118, 38, titles[i], { size: 12.5 });
      s += text(x + 118, 256, tags[i], { cls: 'fg-tag', size: 11 });
    });
    // left: s + three p
    const a = P(132, 148);
    s += pOrb(a, 225, 60, 13);
    s += pOrb(a, 0, 84, 15);
    s += pOrb(a, 90, 84, 15);
    s += `<circle class="fg-fill-mut fg-bond-soft" cx="${a.x}" cy="${a.y}" r="23" fill-opacity="0.55"></circle>`;
    s += text(a.x, a.y + 5, 's', { cls: 'fg-lbl', size: 13 });
    s += text(a.x + 76, a.y - 22, 'p', { cls: 'fg-lbl', size: 12 });
    s += text(a.x + 20, a.y - 76, 'p', { cls: 'fg-lbl', size: 12 });
    s += text(a.x - 52, a.y + 26, 'p', { cls: 'fg-lbl', size: 12 });
    s += arc(a, 30, 270, 360);
    s += text(a.x + 26, a.y + 38, '90°', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    // middle: four hybrids
    const b = P(380, 146);
    s += sp3Set(b, 70, 18);
    s += atom(b.x, b.y, 'C', { kind: 'hi', r: 13 });
    s += arc(b, 34, 90, 210);
    s += text(b.x - 46, b.y - 30, '109.5°', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    // right: methane
    const c = P(628, 150);
    const ends = { up: at(c, TET.up, 68), left: at(c, TET.left, 68), front: at(c, TET.front, 66), back: at(c, TET.back, 62) };
    s += bond(c, ends.up, { rFrom: 16, rTo: 13 });
    s += bond(c, ends.left, { rFrom: 16, rTo: 13 });
    s += wedge(c, ends.front, { rFrom: 14, rTo: 13, width: 10 });
    s += hash(c, ends.back, { rFrom: 14, rTo: 13, width: 11, rungs: 5 });
    for (const k of Object.keys(ends)) s += atom(ends[k].x, ends[k].y, 'H', { r: 13 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    s += arc(c, 30, 90, 210);
    s += text(c.x - 40, c.y - 30, '109.5°', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    return s;
  },
  caption: 'Left, the four orbitals before mixing: the round s in the middle and three p dumbbells. Middle, the four hybrids they become. Right, methane built on those hybrids; the wedge points toward you and the hashed bond points away.',
});

/* =============================================== sp3 from mixing (lesson) === */
FIGURES.push({
  id: 'l-sp3-mixing',
  lessons: ['hybridization'],
  viewBox: '0 0 340 390',
  alt: 'Top: one round s orbital plus three p dumbbells, pointing along three different axes. An arrow labeled mix, 4 in and 4 out, leads down to four identical gray sp3 hybrid lobes around a carbon, pointing to the corners of a tetrahedron, 109.5 degrees apart.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 112);
    s += tag(170, 28, 'carbon’s four orbitals, unmixed');
    const cells = [44, 124, 204, 284];
    s += `<circle class="fg-fill-mut fg-bond-soft" cx="${cells[0]}" cy="68" r="14" fill-opacity="0.3"></circle>`;
    s += pOrb(P(cells[1], 68), 0, 30, 9);
    s += pOrb(P(cells[2], 68), 90, 30, 9);
    s += pOrb(P(cells[3], 68), 225, 30, 9);
    ['s', 'p', 'p', 'p'].forEach((t, i) => { s += label(cells[i], 110, t, { size: 12 }); });
    [84, 164, 244].forEach((x) => { s += label(x, 72, '+', { size: 13 }); });
    s += arrow(P(170, 128), P(170, 170));
    s += tag(184, 154, 'mix: 4 in, 4 out', { anchor: 'start' });
    s += panel(8, 178, 324, 204, { kind: 'hi' });
    const c = P(170, 280);
    s += sp3Set(c, 70, 18);
    s += atom(c.x, c.y, 'C', { kind: 'hi', r: 13 });
    s += arc(c, 34, 90, 210);
    s += tag(c.x - 46, c.y - 34, '109.5°', { anchor: 'end' });
    s += tag(170, 372, 'four identical sp³ hybrids');
    return s;
  },
  caption: 'Four unequal orbitals go in; four identical sp³ hybrids come out, aimed at the corners of a tetrahedron.',
});

/* ========================================== three hybrid sets (notes) === */
function sp3Panel(x, y, w) {
  const c = P(x + w / 2, y + 128);
  let s = sp3Set(c, 66, 17);
  s += atom(c.x, c.y, 'C', { kind: 'hi', r: 12 });
  s += arc(c, 32, 90, 210);
  return { s, c };
}

FIGURES.push({
  id: 'three-hybrid-sets',
  section: 'hybridization',
  anchor: '<li>Mix 1 s with 1 p → two <b>sp</b> orbitals, 180° apart, linear. <b>2 p orbitals left over</b>, both perpendicular to the axis and to each other.</li>\n</ul>',
  viewBox: '0 0 760 300',
  alt: 'Three panels. sp3: four gray hybrid lobes toward the corners of a tetrahedron, 109.5 degrees apart, no p orbital left. sp2: three gray hybrids lying in one flat plane, drawn as a dashed ellipse, 120 degrees apart, with one leftover p orbital standing straight up through the plane in the two phase colors. sp: two gray hybrids pointing opposite ways on a straight line, 180 degrees apart, with two leftover p orbitals, one up the page and one pointing out toward the reader.',
  build() {
    let s = '';
    const heads = [
      ['sp³: 4 hybrids', '0 leftover p'],
      ['sp²: 3 hybrids', '1 leftover p'],
      ['sp: 2 hybrids', '2 leftover p'],
    ];
    const xs = [14, 262, 510];
    xs.forEach((x, i) => {
      s += panel(x, 14, 236, 272);
      s += label(x + 118, 38, heads[i][0], { size: 12.5 });
      s += text(x + 118, 272, heads[i][1], { cls: 'fg-tag-good', size: 11 });
    });
    // sp3
    const a = sp3Panel(14, 22, 236);
    s += a.s;
    s += text(a.c.x - 42, a.c.y - 30, '109.5°', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    s += text(132, 248, 'tetrahedral', { cls: 'fg-sm', size: 10.5 });
    // sp2
    const b = P(380, 156);
    s += sp2Set(b, 62).s;
    s += atom(b.x, b.y, 'C', { kind: 'hi', r: 12 });
    s += text(b.x + 26, b.y - 62, 'leftover p', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(b.x, 248, 'trigonal planar, 120° apart', { cls: 'fg-sm', size: 10.5 });
    // sp
    const c = P(628, 150);
    s += `<line class="fg-dash-hi" x1="${c.x - 74}" y1="${c.y}" x2="${c.x + 74}" y2="${c.y}"></line>`;
    s += spSet(c, 66);
    s += atom(c.x, c.y, 'C', { kind: 'hi', r: 12 });
    s += text(c.x + 22, c.y - 62, 'leftover p', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(c.x - 36, c.y + 56, 'leftover p,', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    s += text(c.x - 36, c.y + 70, 'toward you', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    s += text(c.x + 78, c.y + 4, '180°', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(c.x, 248, 'linear', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Gray lobes are hybrids; two-color dumbbells are leftover p orbitals, the two colors marking the two halves (phases) of one p orbital. The dashed ellipse in the middle panel is the plane the three sp² hybrids lie in. Each hybrid also has a small back lobe, left off here so the back lobes do not pile up at the nucleus.',
});

/* ========================================= sp2 and sp stacked (lesson) === */
FIGURES.push({
  id: 'l-sp2-sp',
  lessons: ['hybridization'],
  viewBox: '0 0 340 470',
  alt: 'Two panels. sp2: three gray hybrids in one flat plane, drawn as a dashed ellipse, 120 degrees apart, with one leftover p orbital standing straight up through the plane. sp: two gray hybrids on a straight line, 180 degrees apart, with two leftover p orbitals, one up the page and one pointing toward the reader.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 222);
    s += label(170, 30, 'sp²: 1 s + 2 p mixed', { size: 12.5 });
    const b = P(170, 136);
    s += sp2Set(b, 62, { pLen: 64 }).s;
    s += atom(b.x, b.y, 'C', { kind: 'hi', r: 12 });
    s += tag(b.x + 24, b.y - 54, '1 leftover p', { anchor: 'start' });
    s += tag(170, 220, '3 hybrids, flat, 120° apart');

    s += panel(8, 240, 324, 222);
    s += label(170, 262, 'sp: 1 s + 1 p mixed', { size: 12.5 });
    const c = P(170, 362);
    s += spSet(c, 66);
    s += atom(c.x, c.y, 'C', { kind: 'hi', r: 12 });
    s += tag(c.x + 22, c.y - 66, 'leftover p', { anchor: 'start' });
    s += tag(c.x - 34, c.y + 60, 'leftover p', { anchor: 'end' });
    s += tag(170, 452, '2 hybrids, 180° apart');
    return s;
  },
  caption: 'Gray lobes are hybrids; two-color dumbbells are the leftover p orbitals. The dashed ellipse is the flat plane of the sp² hybrids.',
});

/* ======================================= ethene: sigma and pi (shared) === */
FIGURES.push({
  id: 'ethene-sigma-pi',
  section: 'hybridization',
  lessons: ['hybridization'],
  anchor: 'the next section, Bonding, takes the two apart.</p>',
  viewBox: '0 0 340 296',
  alt: 'Ethene, CH2=CH2, lying in a flat plane seen from slightly above. Each carbon has three gray sp2 hybrids 120 degrees apart: two reach hydrogens and one meets the other carbon’s hybrid head-on along the C–C line, marked sigma. The leftover p orbital on each carbon stands straight up through the plane; the two are parallel and overlap side by side above and below the plane, marked pi.',
  build() {
    let s = '';
    const A = P(118, 168), B = P(222, 168);
    const K = 0.62;                       // how much the plane is squashed
    const inPlane = (c, phi, len) => P(c.x + Math.cos(rad(phi)) * len, c.y - Math.sin(rad(phi)) * len * K);
    const degTo = (c, e) => (Math.atan2(c.y - e.y, e.x - c.x) * 180) / Math.PI;
    s += `<path class="fg-dash" d="M60 116 L280 116 L318 222 L22 222 Z"></path>`;
    // pi: the two p orbitals and their sideways overlap
    s += ell(170, 124, 52, 12, 0, 'fg-orb');
    s += ell(170, 212, 52, 12, 0, 'fg-orb-alt');
    s += pOrb(A, 90, 70, 14);
    s += pOrb(B, 90, 70, 14);
    // sigma framework
    const hs = [[A, 120], [A, 240], [B, 60], [B, 300]].map(([c, phi]) => [c, inPlane(c, phi, 74)]);
    for (const [c, h] of hs) s += hybrid(c, degTo(c, h), Math.hypot(h.x - c.x, h.y - c.y) - 10, 11);
    s += hybrid(A, 0, 56, 12) + hybrid(B, 180, 56, 12);
    for (const [, h] of hs) s += atom(h.x, h.y, 'H', { r: 11 });
    s += atom(A.x, A.y, 'C', { kind: 'hi', r: 12 });
    s += atom(B.x, B.y, 'C', { kind: 'hi', r: 12 });
    s += tag(170, 128, 'π');
    s += tag(170, 192, 'σ');
    s += tag(A.x - 44, A.y + 4, '120°');
    s += tag(170, 44, 'π bond: p orbitals overlap');
    s += tag(170, 60, 'side by side, above and below');
    s += tag(170, 268, 'σ bond: hybrids meet head-on');
    s += tag(170, 284, 'along the C–C line');
    return s;
  },
  caption: 'Ethene, CH₂=CH₂. Gray hybrids make the σ bonds, including the one between the carbons; the two parallel leftover p orbitals make the π bond.',
});

/* ===================================== lone pairs are groups (notes) === */
FIGURES.push({
  id: 'lone-pairs-are-groups',
  section: 'hybridization',
  anchor: 'Molecular Geometry, later in this chapter, explains the size of that squeeze.</p>',
  viewBox: '0 0 760 212',
  alt: 'Methane, ammonia and water drawn side by side as tetrahedral centers, each with two bonds in the page, one wedge toward the reader and one hashed bond away. Methane has four hydrogens. Ammonia has three hydrogens and a lone pair, two dots, where the hashed hydrogen would be. Water has two hydrogens and two lone pairs where the wedge and hash hydrogens would be.',
  build() {
    let s = '';
    const cases = [
      { x: 14, name: 'methane, CH₄', el: 'C', slots: ['H', 'H', 'H', 'H'], count: '4 bonds + 0 pairs' },
      { x: 268, name: 'ammonia, NH₃', el: 'N', slots: ['H', 'H', 'H', 'lp'], count: '3 bonds + 1 pair' },
      { x: 522, name: 'water, H₂O', el: 'O', slots: ['H', 'H', 'lp', 'lp'], count: '2 bonds + 2 pairs' },
    ];
    for (const c of cases) {
      s += panel(c.x, 12, 226, 188);
      const cc = P(c.x + 113, 118);
      s += text(cc.x, 36, c.name, { cls: 'fg-lbl', size: 12.5 });
      s += tetCenter(cc, c.el, c.slots, 54);
      s += text(cc.x, 188, c.count + ' = 4 groups', { cls: 'fg-tag-good', size: 11 });
    }
    return s;
  },
  caption: 'The dots are lone pairs. Each one takes a corner of the tetrahedron, where a hydrogen would otherwise be. The wedge points toward you and the hashed bond points away.',
});

/* ==================================== lone pairs are groups (lesson) === */
FIGURES.push({
  id: 'l-lone-pairs',
  lessons: ['hybridization'],
  viewBox: '0 0 340 262',
  alt: 'Methane and water stacked, each drawn as a tetrahedral center with two bonds in the page, a wedge and a hashed position. Methane has four hydrogens: 4 groups, sp3. Water has two hydrogens and two lone pairs, drawn as two dots each, in the wedge and hash positions: 4 groups, sp3.',
  build() {
    let s = '';
    const rows = [
      { name: 'methane, CH₄', el: 'C', slots: ['H', 'H', 'H', 'H'], count: '4 bonds + 0 pairs' },
      { name: 'water, H₂O', el: 'O', slots: ['H', 'H', 'lp', 'lp'], count: '2 bonds + 2 pairs' },
    ];
    rows.forEach((r, i) => {
      const y0 = 8 + i * 128;
      s += panel(8, y0, 324, 120);
      s += tetCenter(P(84, y0 + 62), r.el, r.slots, 44);
      s += label(160, y0 + 40, r.name, { anchor: 'start', size: 12.5 });
      s += tag(160, y0 + 66, r.count, { anchor: 'start' });
      s += text(160, y0 + 88, '= 4 groups → sp³', { cls: 'fg-tag-good', size: 11, anchor: 'start' });
    });
    return s;
  },
  caption: 'Two dots are a lone pair. It takes a corner just as a bonded hydrogen does.',
});

/* ===================================== cation, anion, radical (notes) === */
FIGURES.push({
  id: 'carbon-ion-shapes',
  section: 'hybridization',
  anchor: 'The radical needs a caveat rather than an answer.</p>\n</div>',
  viewBox: '0 0 760 320',
  alt: 'Three panels. Methyl cation CH3+: carbon and its three hydrogens lie flat in one plane, drawn in perspective, with an empty p orbital drawn as a dashed outline standing up through the carbon; arrows show that it can be reached from above and from below. Methyl anion CH3−: a pyramid, with the three hydrogens below the carbon and the lone pair, two dots, in the fourth corner on top. Methyl radical CH3•: flat like the cation, with one electron in the p orbital, drawn as a single dot where the p orbital meets the carbon.',
  build() {
    let s = '';
    const heads = [
      ['methyl cation, CH₃⁺', '3 groups → sp², flat, 120°'],
      ['methyl anion, CH₃⁻', '4 groups → sp³, pyramidal'],
      ['methyl radical, CH₃•', 'close to sp², nearly flat'],
    ];
    [14, 262, 510].forEach((x, i) => {
      s += panel(x, 14, 236, 292);
      s += label(x + 118, 38, heads[i][0], { size: 12.5 });
      s += text(x + 118, 292, heads[i][1], { cls: 'fg-tag-good', size: 11 });
    });
    const flatCarbon = (c, pOpts) => {
      let g = ell(c.x, c.y, 88, 88 * FLAT + 6, 0, 'fg-dash');
      g += pOrb(c, 90, 96, 17, pOpts);
      for (const phi of [180, 60, 300]) {
        const h = flatAt(c, phi, 84);
        g += bond(c, h, { rFrom: 14, rTo: 12 });
        g += atom(h.x, h.y, 'H', { r: 12 });
      }
      g += atom(c.x, c.y, 'C', { kind: 'hi', r: 14 });
      return g;
    };
    // cation
    const a = P(132, 170);
    s += flatCarbon(a, { empty: true });
    s += text(a.x - 20, a.y - 14, '+', { cls: 'fg-warn', size: 15 });
    s += text(a.x + 24, a.y - 58, 'empty p', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += arrow(P(a.x - 60, 60), P(a.x - 30, 92), { muted: true });
    s += arrow(P(a.x - 60, 276), P(a.x - 30, 246), { muted: true });
    s += text(a.x - 64, 76, 'open', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    s += text(a.x - 64, 264, 'open', { cls: 'fg-sm', size: 10.5, anchor: 'end' });
    // anion
    const b = P(380, 150);
    const ends = { left: at(b, 215, 64), front: at(b, 318, 62), back: at(b, 268, 58) };
    s += bond(b, ends.left, { rFrom: 15, rTo: 12 });
    s += wedge(b, ends.front, { rFrom: 14, rTo: 12, width: 10 });
    s += hash(b, ends.back, { rFrom: 14, rTo: 12, width: 11, rungs: 5 });
    for (const k of Object.keys(ends)) s += atom(ends[k].x, ends[k].y, 'H', { r: 12 });
    s += atom(b.x, b.y, 'C', { kind: 'hi', r: 14 });
    s += lonePair(b.x, b.y, -90, { dist: 30, spread: 5, r: 2.8 });
    s += text(b.x + 20, b.y - 12, '−', { cls: 'fg-warn', size: 15 });
    s += text(b.x + 16, b.y - 36, 'lone pair', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(b.x, 246, 'the pair holds the fourth corner', { cls: 'fg-sm', size: 10.5 });
    // radical
    const c = P(628, 170);
    s += flatCarbon(c, {});
    s += `<circle class="fg-lp" cx="${c.x}" cy="${c.y - 21}" r="3"></circle>`;
    s += text(c.x + 24, c.y - 58, 'one electron in p', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'The cation and the radical are drawn in perspective: the dashed ellipse is the flat plane of carbon and its three hydrogens. The dashed p orbital on the cation holds no electrons.',
});

/* ========================================= every atom: three molecules === */
/* A hybridization tag set right against its own atom, in a direction the
   caller has checked is free of bonds and lone pairs. */
const hybTag = (c, deg, s, dist = 30) => { const p = at(c, deg, dist); return text(p.x, p.y + 4, s, { cls: 'fg-tag-good', size: 11 }); };

FIGURES.push({
  id: 'every-atom-acetonitrile',
  section: 'hybridization',
  anchor: 'So the C–C≡N unit is linear and the methyl end is tetrahedral, in one molecule.</p>',
  viewBox: '0 0 760 200',
  alt: 'Acetonitrile, CH3–C≡N, drawn with every atom. The methyl carbon is tetrahedral, with one hydrogen in the page, one on a wedge and one on a hashed bond, and is tagged sp3. The nitrile carbon and the nitrogen are joined by three lines and each is tagged sp. The two carbons and the nitrogen lie on one straight line, and the nitrogen’s lone pair points straight out along it.',
  build() {
    let s = panel(14, 10, 732, 180);
    const c1 = P(250, 96), c2 = P(360, 96), n = P(460, 96);
    s += methyl(c1, 0);
    s += bond(c1, c2);
    s += bond(c2, n, { order: 3 });
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += atom(n.x, n.y, 'N', { kind: 'hi' });
    s += lonePair(n.x, n.y, 0, { dist: 24 });
    s += hybTag(c1, 55, 'sp³');
    s += hybTag(c2, 90, 'sp', 28);
    s += hybTag(n, 90, 'sp', 28);
    s += `<line class="fg-dash-hi" x1="${c1.x}" y1="150" x2="${n.x + 30}" y2="150"></line>`;
    s += text((c1.x + n.x) / 2, 170, 'C, C and N on one line: 180°', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Acetonitrile, CH₃C≡N. Each green tag sits next to the atom it describes.',
});

FIGURES.push({
  id: 'every-atom-acetic-acid',
  section: 'hybridization',
  anchor: 'Its shape is still bent, because it has only two neighbors.</p>',
  viewBox: '0 0 760 220',
  alt: 'Acetic acid, CH3–C(=O)–O–H, drawn with every atom and all four lone pairs. The methyl carbon is tetrahedral, with one hydrogen in the page, one wedged and one hashed, and is tagged sp3. The carbonyl carbon and the double-bonded oxygen are tagged sp2. The OH oxygen is tagged sp2 with a star, and a note says the plain count would give sp3.',
  build() {
    let s = panel(14, 10, 732, 200);
    const c1 = P(250, 112), c2 = P(358, 112);
    const o1 = at(c2, 60, 62), o2 = at(c2, 300, 62);
    const h = at(o2, 0, 60);
    s += methyl(c1, 0);
    s += bond(c1, c2);
    s += bond(c2, o1, { order: 2 });
    s += bond(c2, o2);
    s += bond(o2, h, { rTo: 12 });
    s += atom(h.x, h.y, 'H', { r: 12 });
    s += atom(c1.x, c1.y, 'C', { kind: 'hi' });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += atom(o1.x, o1.y, 'O', { kind: 'hi' });
    s += atom(o2.x, o2.y, 'O', { kind: 'hi' });
    s += lonePair(o1.x, o1.y, -150);
    s += lonePair(o1.x, o1.y, -30);
    s += lonePair(o2.x, o2.y, 80);
    s += lonePair(o2.x, o2.y, 170);
    s += hybTag(c1, 55, 'sp³');
    s += hybTag(c2, 240, 'sp²', 32);
    s += hybTag(o1, 0, 'sp²', 34);
    s += hybTag(o2, 62, 'sp² *', 36);
    s += text(490, 104, '* the plain count gives sp³;', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(490, 120, 'the rule for a lone pair beside', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(490, 136, 'a π bond gives sp²', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Acetic acid, CH₃COOH, written out as CH₃–C(=O)–O–H, with each green tag next to its own atom.',
});

FIGURES.push({
  id: 'every-atom-propenal',
  section: 'hybridization',
  anchor: 'calls resonance.</p>',
  viewBox: '0 0 760 210',
  alt: 'Propenal, CH2=CH–CH=O, drawn as a zigzag with every atom: two carbons joined by a double bond, a single bond to a third carbon, and that carbon double-bonded to oxygen, with each hydrogen drawn. All three carbons and the oxygen are tagged sp2.',
  build() {
    let s = panel(14, 10, 732, 190);
    const c1 = P(180, 124), c2 = at(c1, 30, 70), c3 = at(c2, -30, 70), o = at(c3, 30, 70);
    const h1a = at(c1, 150, 56), h1b = at(c1, 270, 54), h2 = at(c2, 90, 54), h3 = at(c3, 270, 54);
    s += bond(c1, c2, { order: 2 });
    s += bond(c2, c3);
    s += bond(c3, o, { order: 2 });
    for (const [a, hh] of [[c1, h1a], [c1, h1b], [c2, h2], [c3, h3]]) {
      s += bond(a, hh, { rTo: 12 });
      s += atom(hh.x, hh.y, 'H', { r: 12 });
    }
    for (const a of [c1, c2, c3]) s += atom(a.x, a.y, 'C', { kind: 'hi' });
    s += atom(o.x, o.y, 'O', { kind: 'hi' });
    s += lonePair(o.x, o.y, -90);
    s += lonePair(o.x, o.y, 30);
    s += hybTag(c1, -30, 'sp²');
    s += hybTag(c2, 30, 'sp²');
    s += hybTag(c3, -30, 'sp²');
    s += hybTag(o, 30, 'sp²', 32);
    return s;
  },
  caption: 'Propenal, CH₂=CH–CHO, with each green tag next to its own atom.',
});

/* ===================================== amide lone pair in p (shared) === */
FIGURES.push({
  id: 'amide-lone-pair-p',
  section: 'hybridization',
  lessons: ['hybridization'],
  anchor: 'When it does, the atom holding it has only three hybrid orbitals left, so it is sp².</p>',
  viewBox: '0 0 340 420',
  alt: 'Two panels about the nitrogen of an amide, R–C(=O)–NH2. Top, what the plain count predicts: a pyramidal nitrogen with its two hydrogens wedged and hashed and its lone pair in the fourth corner, labeled 4 groups, sp3. Bottom, what the nitrogen does: the O, C and N seen side-on in one flat plane, each with a p orbital standing up and down, all three parallel. The C and O p orbitals form the C=O pi bond, and the nitrogen’s p orbital holds its lone pair and overlaps sideways with them. Labeled sp2, flat.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 186, { kind: 'warn' });
    s += tag(170, 28, 'the count predicts: sp³, pyramidal', { cls: 'fg-tag-warn' });
    const c = P(110, 116), o = at(P(110, 116), 110, 52), r = at(P(110, 116), 220, 56);
    const n = P(196, 116);
    s += bond(c, o, { order: 2 });
    s += bond(c, r, { rTo: 12 });
    s += bond(c, n);
    const hf = at(n, 320, 52), hb = at(n, 270, 52);
    s += wedge(n, hf, { rFrom: 14, rTo: 12, width: 10 });
    s += hash(n, hb, { rFrom: 14, rTo: 12, width: 11, rungs: 5 });
    s += atom(hf.x, hf.y, 'H', { r: 12 }) + atom(hb.x, hb.y, 'H', { r: 12 });
    s += atom(r.x, r.y, 'R', { r: 12 });
    s += atom(c.x, c.y, 'C');
    s += atom(o.x, o.y, 'O');
    s += lonePair(o.x, o.y, -160);
    s += lonePair(o.x, o.y, -50);
    s += atom(n.x, n.y, 'N', { kind: 'warn' });
    s += lonePair(n.x, n.y, -60, { dist: 26 });
    s += tag(222, 84, 'pair in the', { anchor: 'start' });
    s += tag(222, 98, '4th corner', { anchor: 'start' });

    s += panel(8, 204, 324, 208, { kind: 'good' });
    s += tag(170, 224, 'what it does: sp², flat', { cls: 'fg-tag-good' });
    const y = 316;
    const O = P(80, y), C = P(170, y), N = P(260, y);
    s += `<line class="fg-dash" x1="30" y1="${y}" x2="310" y2="${y}"></line>`;
    for (const a of [O, C, N]) s += pOrb(a, 90, 60, 15);
    s += bond(O, C, { rFrom: 14, rTo: 14 });
    s += bond(C, N, { rFrom: 14, rTo: 14 });
    s += atom(O.x, O.y, 'O', { r: 14 });
    s += atom(C.x, C.y, 'C', { r: 14 });
    s += atom(N.x, N.y, 'N', { kind: 'hi', r: 14 });
    s += `<circle class="fg-lp" cx="${N.x - 5}" cy="${y - 34}" r="2.8"></circle><circle class="fg-lp" cx="${N.x + 5}" cy="${y - 34}" r="2.8"></circle>`;
    s += tag(125, 248, 'C=O π');
    s += tag(N.x, 248, 'N lone pair');
    s += tag(170, 394, 'three parallel p orbitals, side by side');
    return s;
  },
  caption: 'Bottom panel: the O, C and N seen edge-on, so the flat plane they share is the dashed line. R and the two H on nitrogen lie in that plane too.',
});

/* ============================================= acidity and s-character === */
FIGURES.push({
  id: 'ch-acidity-s-character',
  section: 'hybridization',
  anchor: 'twenty-five powers of ten from the mixing alone.</p>',
  viewBox: '0 0 760 226',
  alt: 'A table-like figure with three rows, sp3, sp2 and sp. Columns: the compound (ethane, ethene, ethyne), the s-character (25, 33 and 50 percent), the pKa of its C–H (about 50, 44 and 25), and a drawing of a carbon with the leftover pair after H+ leaves, the pair drawn further from the carbon for sp3 and closest for sp.',
  build() {
    let s = '';
    const cols = [70, 220, 380, 490, 640];
    ['carbon', 'the C–H in', 's-character', 'pKa', 'where the pair sits'].forEach((h, i) => {
      s += text(cols[i], 28, h, { cls: 'fg-tag', size: 11 });
    });
    s += rule(14, 40, 746, 40);
    const rows = [
      { h: 'sp³', ex: 'ethane, H₃C–CH₃', pct: '25%', pka: '≈ 50', d: 52, how: 'far out' },
      { h: 'sp²', ex: 'ethene, H₂C=CH₂', pct: '33%', pka: '≈ 44', d: 40, how: 'closer' },
      { h: 'sp', ex: 'ethyne, HC≡CH', pct: '50%', pka: '≈ 25', d: 28, how: 'closest' },
    ];
    rows.forEach((r, i) => {
      const y = 76 + i * 56;
      s += text(cols[0], y + 5, r.h, { cls: 'fg-lbl', size: 13 });
      s += text(cols[1], y + 5, r.ex, { cls: 'fg-sm', size: 10.5 });
      s += text(cols[2], y + 5, r.pct, { cls: 'fg-lbl', size: 13 });
      s += text(cols[3], y + 5, r.pka, { cls: 'fg-lbl', size: 13 });
      const c = P(586, y);
      s += atom(c.x, c.y, 'C', { r: 14 });
      s += `<line class="fg-dash" x1="${c.x + 15}" y1="${y}" x2="${c.x + r.d - 4}" y2="${y}"></line>`;
      s += lonePair(c.x, c.y, 0, { dist: r.d, spread: 5, r: 2.8 });
      s += text(c.x + 90, y + 4, r.how, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    });
    return s;
  },
  caption: 'Three C–H bonds that differ only in the carbon’s hybridization. Read down the last column: the more s-character, the closer to the carbon the leftover pair sits.',
});

/* ===================================== s-character bars (lesson) === */
FIGURES.push({
  id: 'l-s-character',
  lessons: ['hybridization'],
  viewBox: '0 0 340 250',
  alt: 'Three bars showing how much of each hybrid comes from the s orbital: sp3, one s out of four orbitals, 25 percent; sp2, one out of three, 33 percent; sp, one out of two, 50 percent.',
  build() {
    let s = '';
    s += tag(170, 20, 's-character = share of the hybrid that is s');
    const rows = [
      { h: 'sp³', f: '1 s of 4', pct: 25 },
      { h: 'sp²', f: '1 s of 3', pct: 33 },
      { h: 'sp', f: '1 s of 2', pct: 50 },
    ];
    rows.forEach((r, i) => {
      const y = 52 + i * 62;
      s += label(12, y + 12, r.h, { anchor: 'start', size: 13 });
      s += `<rect class="fg-panel" x="58" y="${y}" width="200" height="18" rx="5"></rect>`;
      s += `<rect class="fg-fill-hi" x="58" y="${y}" width="${r.pct * 2}" height="18" rx="5"></rect>`;
      s += label(268, y + 14, r.pct + '%', { anchor: 'start', size: 13 });
      s += tag(58, y + 38, r.f, { anchor: 'start' });
    });
    s += tag(170, 240, 'more s → shorter, stronger bonds', { cls: 'fg-tag-good' });
    return s;
  },
  caption: 'The share of s in each hybrid.',
});

/* ============================================ beyond four (shared) === */
FIGURES.push({
  id: 'beyond-four-groups',
  section: 'hybridization',
  lessons: ['hybridization'],
  anchor: 'if the count exceeds four you are not looking at a carbon, nitrogen or oxygen.</b></p>',
  viewBox: '0 0 340 250',
  alt: 'Two panels. PCl5: phosphorus with five chlorines, one straight up, one straight down, and three around the middle, one in the page, one wedged toward the reader and one hashed away; labeled 5 groups, trigonal bipyramidal. SF6: sulfur with six fluorines, one up, one down, and four around the middle, two in the page, one wedged and one hashed; labeled 6 groups, octahedral.',
  build() {
    let s = '';
    s += panel(6, 6, 160, 238);
    s += panel(174, 6, 160, 238);
    const p = P(84, 116);
    const pEnds = { up: P(84, 50), down: P(84, 182), left: P(28, 116), front: P(132, 140), back: P(130, 88) };
    for (const k of ['up', 'down', 'left']) s += bond(p, pEnds[k], { rFrom: 14, rTo: 13 });
    s += wedge(p, pEnds.front, { rFrom: 13, rTo: 13, width: 10 });
    s += hash(p, pEnds.back, { rFrom: 13, rTo: 13, width: 11, rungs: 4 });
    for (const k of Object.keys(pEnds)) s += atom(pEnds[k].x, pEnds[k].y, 'Cl', { r: 13 });
    s += atom(p.x, p.y, 'P', { kind: 'hi', r: 14 });
    s += label(86, 214, 'PCl₅: 5 groups', { size: 12 });
    s += tag(86, 234, 'trigonal bipyramidal');

    const q = P(254, 116);
    const f = { up: P(254, 50), down: P(254, 182), left: P(198, 116), right: P(310, 116), front: P(222, 150), back: P(286, 84) };
    for (const k of ['up', 'down', 'left', 'right']) s += bond(q, f[k], { rFrom: 14, rTo: 13 });
    s += wedge(q, f.front, { rFrom: 13, rTo: 13, width: 10 });
    s += hash(q, f.back, { rFrom: 13, rTo: 13, width: 11, rungs: 4 });
    for (const k of Object.keys(f)) s += atom(f[k].x, f[k].y, 'F', { r: 13 });
    s += atom(q.x, q.y, 'S', { kind: 'hi', r: 14 });
    s += label(254, 214, 'SF₆: 6 groups', { size: 12 });
    s += tag(254, 234, 'octahedral');
    return s;
  },
  caption: 'Wedges point toward you and hashed bonds point away.',
});

/* ============================== practice molecules, drawn (lesson) === */
FIGURES.push({
  id: 'l-formaldehyde',
  lessons: ['hybridization'],
  viewBox: '0 0 340 150',
  alt: 'Formaldehyde drawn with every atom: a carbon bonded to two hydrogens and double-bonded to an oxygen that carries two lone pairs. The carbon is highlighted.',
  build() {
    let s = panel(8, 8, 324, 134);
    const c = P(140, 76), o = P(220, 76);
    const h1 = at(c, 125, 54), h2 = at(c, 235, 54);
    s += bond(c, o, { order: 2 });
    s += bond(c, h1, { rTo: 12 }) + bond(c, h2, { rTo: 12 });
    s += atom(h1.x, h1.y, 'H', { r: 12 }) + atom(h2.x, h2.y, 'H', { r: 12 });
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += atom(o.x, o.y, 'O');
    s += lonePair(o.x, o.y, -55) + lonePair(o.x, o.y, 55);
    s += tag(262, 40, 'formaldehyde');
    return s;
  },
  caption: 'Formaldehyde. The highlighted carbon is the one asked about.',
});

FIGURES.push({
  id: 'l-co2',
  lessons: ['hybridization'],
  viewBox: '0 0 340 120',
  alt: 'Carbon dioxide drawn with every atom: a carbon double-bonded to an oxygen on each side, each oxygen carrying two lone pairs. The carbon is highlighted.',
  build() {
    let s = panel(8, 8, 324, 104);
    const o1 = P(90, 58), c = P(170, 58), o2 = P(250, 58);
    s += bond(o1, c, { order: 2 }) + bond(c, o2, { order: 2 });
    s += atom(o1.x, o1.y, 'O') + atom(o2.x, o2.y, 'O');
    s += atom(c.x, c.y, 'C', { kind: 'warn' });
    s += lonePair(o1.x, o1.y, -125) + lonePair(o1.x, o1.y, 125);
    s += lonePair(o2.x, o2.y, -55) + lonePair(o2.x, o2.y, 55);
    s += tag(170, 102, 'carbon dioxide');
    return s;
  },
  caption: 'Carbon dioxide. The highlighted carbon is the one asked about.',
});

FIGURES.push({
  id: 'l-methyl-acetate',
  lessons: ['hybridization'],
  viewBox: '0 0 340 220',
  alt: 'Methyl acetate drawn with every atom: a CH3 carbon bonded to a carbon that is double-bonded to one oxygen and single-bonded to a second oxygen, which is bonded to another CH3. Both oxygens carry two lone pairs. The single-bonded oxygen, between the C=O carbon and the second CH3, is highlighted.',
  build() {
    let s = panel(8, 8, 324, 204);
    const c1 = P(74, 104), c2 = P(154, 104);
    const o1 = at(c2, 60, 58), o2 = at(c2, 300, 58);
    const c3 = at(o2, 0, 76);
    s += methyl(c1, 0);
    s += methyl(c3, 180);
    s += bond(c1, c2) + bond(c2, o1, { order: 2 }) + bond(c2, o2) + bond(o2, c3);
    s += atom(c1.x, c1.y, 'C') + atom(c2.x, c2.y, 'C') + atom(c3.x, c3.y, 'C');
    s += atom(o1.x, o1.y, 'O');
    s += atom(o2.x, o2.y, 'O', { kind: 'warn' });
    s += lonePair(o1.x, o1.y, -150) + lonePair(o1.x, o1.y, -30);
    s += lonePair(o2.x, o2.y, 80) + lonePair(o2.x, o2.y, 170);
    s += tag(o2.x, 202, 'this oxygen', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Methyl acetate, every atom drawn. The highlighted oxygen is the one asked about.',
});

FIGURES.push({
  id: 'l-methanol',
  lessons: ['hybridization'],
  viewBox: '0 0 340 170',
  alt: 'Methanol drawn with every atom: a CH3 carbon, with one hydrogen in the page, one wedged and one hashed, bonded to an oxygen that carries one hydrogen and two lone pairs. The oxygen is highlighted.',
  build() {
    let s = panel(8, 8, 324, 154);
    const c = P(130, 92), o = P(210, 92);
    const h = at(o, -60, 56);
    s += methyl(c, 0);
    s += bond(c, o) + bond(o, h, { rTo: 12 });
    s += atom(h.x, h.y, 'H', { r: 12 });
    s += atom(c.x, c.y, 'C');
    s += atom(o.x, o.y, 'O', { kind: 'warn' });
    s += lonePair(o.x, o.y, -20) + lonePair(o.x, o.y, -125);
    s += tag(270, 60, 'methanol');
    return s;
  },
  caption: 'Methanol, every atom drawn. The highlighted oxygen is the one asked about.',
});

export default FIGURES;
