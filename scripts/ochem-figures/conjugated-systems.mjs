/* Figures for the conjugated-systems notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is placed by markers in the prose. Figures whose id
   starts with `l-` are lesson-only copies: 340 wide, panels stacked, and
   every label in fg-lbl or fg-tag so it stays readable on a phone. */
import { atom, bond, arrow, curve, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, locant, ringDouble } from '../lib/ochem-skeletal.mjs';
import { skDouble, plus, lobeE } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => (Math.round(v * 100) / 100).toString();

/* ------------------------------------------------------------ helpers --- */

/* A p orbital standing straight up and down through an atom at (x, y0).
   `sign` picks which phase color goes on top; `size` scales the lobes.
   With `empty`, both lobes are dashed outlines: an orbital with no electrons. */
function pUp(x, y0, opts = {}) {
  const rx = opts.rx ?? 12, ry = opts.ry ?? 19;
  const gap = 2;
  if (opts.empty) {
    return `<ellipse class="fg-orb-node" cx="${r2(x)}" cy="${r2(y0 - gap - ry)}" rx="${r2(rx)}" ry="${r2(ry)}"></ellipse>` +
           `<ellipse class="fg-orb-node" cx="${r2(x)}" cy="${r2(y0 + gap + ry)}" rx="${r2(rx)}" ry="${r2(ry)}"></ellipse>`;
  }
  const up = (opts.sign ?? 1) > 0;
  return lobeE(r2(x), r2(y0 - gap - ry), r2(rx), r2(ry), up ? 'fg-orb' : 'fg-orb-alt') +
         lobeE(r2(x), r2(y0 + gap + ry), r2(rx), r2(ry), up ? 'fg-orb-alt' : 'fg-orb');
}

/* A p orbital pointing toward and away from the reader, drawn in the usual
   perspective: one lobe down and to the left (toward you), one up and to the
   right (away). */
function pFront(x, y0, opts = {}) {
  const len = opts.len ?? 20, w = opts.w ?? 9, deg = 215;
  const a = (deg * Math.PI) / 180;
  const dx = Math.cos(a), dy = -Math.sin(a);
  const d = len + 2;
  const e = (cx, cy, cls) =>
    `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(len)}" ry="${r2(w)}" fill-opacity="0.18" transform="rotate(${r2(-deg)} ${r2(cx)} ${r2(cy)})"></ellipse>`;
  return e(x + dx * d, y0 + dy * d, 'fg-orb') + e(x - dx * d, y0 - dy * d, 'fg-orb-alt');
}

/* A soft band behind a row of top lobes: the overlap that makes one π system. */
const band = (x1, x2, y, h = 30) => bar(x1, y, x2 - x1, h, { kind: 'good', opacity: 0.16, r: 12 });

/* A bracket under (or over) a run of atoms, with a label. */
function bracket(x1, x2, y, words, cls, up = false) {
  const t = up ? 6 : -6;
  let s = `<line class="fg-bond-soft" x1="${r2(x1)}" y1="${r2(y + t)}" x2="${r2(x1)}" y2="${r2(y)}"></line>`;
  s += `<line class="fg-bond-soft" x1="${r2(x1)}" y1="${r2(y)}" x2="${r2(x2)}" y2="${r2(y)}"></line>`;
  s += `<line class="fg-bond-soft" x1="${r2(x2)}" y1="${r2(y)}" x2="${r2(x2)}" y2="${r2(y + t)}"></line>`;
  if (words) s += text((x1 + x2) / 2, up ? y - 8 : y + 17, words, { cls });
  return s;
}

/* Two dots for an electron pair, or one for a single electron, at (x, y). */
const dots = (x, y, n) => n === 2
  ? `<circle class="fg-lp" cx="${r2(x - 4.5)}" cy="${r2(y)}" r="2.6"></circle><circle class="fg-lp" cx="${r2(x + 4.5)}" cy="${r2(y)}" r="2.6"></circle>`
  : `<circle class="fg-lp" cx="${r2(x)}" cy="${r2(y)}" r="2.6"></circle>`;

/* The sigma framework of a chain drawn straight, with a dot at each atom. */
function frameRow(xs, y0) {
  let s = '';
  for (let i = 0; i + 1 < xs.length; i++) s += bond(P(xs[i], y0), P(xs[i + 1], y0), { cls: 'fg-bond-soft', rFrom: 0, rTo: 0 });
  for (const x of xs) s += atom(x, y0, '', { kind: 'point' });
  s += xs.map((x) => `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y0)}" r="3.5"></circle>`).join('');
  return s;
}

/* One of the three diene arrangements as a row of p orbitals centered at
   (cx, y0). `small` is the text class for the notes (fg-sm) or the lesson
   (fg-tag). Returns the drawing only; titles are placed by the caller. */
function arrangement(kind, cx, y0, small) {
  let s = '';
  const labelY = y0 + 58;
  if (kind === 'isolated') {
    const xs = [-88, -44, 0, 44, 88].map((d) => cx + d);
    s += band(xs[0] - 14, xs[1] + 14, y0 - 44);
    s += band(xs[3] - 14, xs[4] + 14, y0 - 44);
    s += frameRow(xs, y0);
    [0, 1, 3, 4].forEach((i) => { s += pUp(xs[i], y0); });
    s += text(xs[2], y0 - 16, 'sp³', { cls: 'fg-tag-warn' });
    xs.forEach((x, i) => { s += text(x, labelY, `C${i + 1}`, { cls: 'fg-lbl', size: 11 }); });
    s += text(cx, labelY + 22, 'no p orbital on C3', { cls: small });
  } else if (kind === 'conjugated') {
    const xs = [-72, -24, 24, 72].map((d) => cx + d);
    s += band(xs[0] - 14, xs[3] + 14, y0 - 44);
    s += frameRow(xs, y0);
    xs.forEach((x) => { s += pUp(x, y0); });
    xs.forEach((x, i) => { s += text(x, labelY, `C${i + 1}`, { cls: 'fg-lbl', size: 11 }); });
    s += text(cx, labelY + 22, 'one unbroken row, C1 to C4', { cls: small });
  } else {
    const xs = [-66, 0, 66].map((d) => cx + d);
    s += frameRow(xs, y0);
    s += band(xs[0] - 14, xs[1] + 14, y0 - 44);
    s += pUp(xs[0], y0);
    s += pUp(xs[1], y0);
    s += pFront(xs[1], y0);
    s += pFront(xs[2], y0);
    xs.forEach((x, i) => { s += text(x, labelY, `C${i + 1}`, { cls: 'fg-lbl', size: 11 }); });
    s += text(xs[1], labelY - 74 - 30, 'sp', { cls: 'fg-tag-warn' });
    s += text(cx, labelY + 22, 'C1=C2 lobes: up and down', { cls: small });
    s += text(cx, labelY + 40, 'C2=C3 lobes: toward you and away', { cls: small });
  }
  return s;
}

/* ---------------------------------------------------- diene-arrangements --- */
FIGURES.push({
  id: 'diene-arrangements',
  section: 'conjugated-systems',
  anchor: '<h3>Isolated, conjugated, cumulated</h3>',
  alt: 'Three dienes drawn as rows of p orbitals. Isolated, penta-1,4-diene: p orbitals on C1, C2, C4 and C5, none on the sp3 carbon C3, so there are two separate shaded pairs. Conjugated, buta-1,3-diene: four p orbitals side by side in one shaded row from C1 to C4. Cumulated, allene: C1 and C2 share p orbitals pointing up and down, while C2 and C3 share p orbitals pointing toward and away from the reader, at right angles to the first pair.',
  viewBox: '0 0 760 310',
  build() {
    let s = '';
    const cols = [
      { x: 14, kind: 'isolated', name: 'penta-1,4-diene', f: 'CH₂=CH–CH₂–CH=CH₂', foot: 'two separate π systems' },
      { x: 262, kind: 'conjugated', name: 'buta-1,3-diene', f: 'CH₂=CH–CH=CH₂', foot: 'one π system over four carbons' },
      { x: 510, kind: 'cumulated', name: 'propa-1,2-diene (allene)', f: 'CH₂=C=CH₂', foot: 'two π systems at 90°' },
    ];
    for (const c of cols) {
      const cx = c.x + 118;
      s += panel(c.x, 14, 236, 286, { kind: c.kind === 'conjugated' ? 'good' : undefined });
      s += tag(cx, 40, c.kind, { cls: c.kind === 'conjugated' ? 'fg-tag-good' : 'fg-tag' });
      s += label(cx, 62, c.name, { size: 12 });
      s += text(cx, 80, c.f, { cls: 'fg-sm', size: 10.5 });
      s += arrangement(c.kind, cx, 160, 'fg-sm');
      s += text(cx, 286, c.foot, { cls: c.kind === 'cumulated' ? 'fg-tag-warn' : c.kind === 'conjugated' ? 'fg-tag-good' : 'fg-tag' });
    }
    return s;
  },
  caption: 'The same test applied three times: follow the p orbitals from one end of the molecule to the other. The shaded bands mark up-and-down p orbitals that overlap side by side. In allene, the p orbitals of C1=C2 overlap up and down (the band), and those of C2=C3 overlap front to back; the two pairs never meet.',
});

FIGURES.push({
  id: 'l-diene-arrangements',
  lessons: ['conjugated-systems'],
  alt: 'Three dienes stacked, drawn as rows of p orbitals. Isolated, penta-1,4-diene: no p orbital on C3, so two separate pairs. Conjugated, buta-1,3-diene: one row of four p orbitals. Cumulated, allene: the C1=C2 lobes point up and down and the C2=C3 lobes point toward and away from the reader.',
  viewBox: '0 0 340 690',
  build() {
    let s = '';
    const rows = [
      { y: 6, kind: 'isolated', name: 'penta-1,4-diene', foot: 'two separate π systems', h: 210 },
      { y: 226, kind: 'conjugated', name: 'buta-1,3-diene', foot: 'one π system', h: 210 },
      { y: 446, kind: 'cumulated', name: 'allene, CH₂=C=CH₂', foot: 'two π systems at 90°', h: 238 },
    ];
    for (const r of rows) {
      s += panel(8, r.y, 324, r.h, { kind: r.kind === 'conjugated' ? 'good' : undefined });
      s += tag(170, r.y + 24, `${r.kind}: ${r.name}`, { cls: r.kind === 'conjugated' ? 'fg-tag-good' : 'fg-tag' });
      s += arrangement(r.kind, 170, r.y + 100, 'fg-tag');
      s += text(170, r.y + r.h - 12, r.foot, { cls: r.kind === 'cumulated' ? 'fg-tag-warn' : r.kind === 'conjugated' ? 'fg-tag-good' : 'fg-tag' });
    }
    return s;
  },
  caption: 'Follow the p orbitals along each molecule. Bands mark up-and-down p orbitals that overlap. In allene, the p orbitals of C2=C3 overlap front to back instead, and the two pairs never meet.',
});

/* ------------------------------------------- conjugation-beyond-alkenes --- */
FIGURES.push({
  id: 'conjugation-beyond-alkenes',
  section: 'conjugated-systems',
  anchor: '<h3>Isolated, conjugated, cumulated</h3>',
  alt: 'Three three-atom p orbital rows. Allyl cation: C1 and C2 carry filled p orbitals and C3 an empty one drawn dashed, with a plus charge. Allyl radical: C3 carries a p orbital holding one electron. Methoxyethene: the oxygen carries a p orbital holding a lone pair, parallel to the C1=C2 p orbitals, and a CH3 group on the oxygen has no p orbital.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const cols = [
      { x: 14, name: 'allyl cation', f: 'CH₂=CH–CH₂⁺', third: 'empty', foot: 'an empty p orbital' },
      { x: 262, name: 'allyl radical', f: 'CH₂=CH–CH₂•', third: 'one', foot: 'a p orbital with one electron' },
      { x: 510, name: 'methoxyethene', f: 'CH₂=CH–O–CH₃', third: 'pair', foot: 'a lone pair in a p orbital' },
    ];
    for (const c of cols) {
      const cx = c.x + 118, y0 = 124;
      s += panel(c.x, 14, 236, 224);
      s += label(cx, 42, c.name, { size: 12 });
      s += text(cx, 62, c.f, { cls: 'fg-sm', size: 10.5 });
      const xs = c.third === 'pair' ? [cx - 84, cx - 34, cx + 16] : [cx - 50, cx, cx + 50];
      s += band(xs[0] - 14, xs[2] + 14, y0 - 44);
      if (c.third === 'pair') {
        // the CH3 on oxygen: an sp3 carbon, drawn as a label with no p orbital
        s += bond(P(xs[2], y0), P(cx + 76, y0), { cls: 'fg-bond-soft', rFrom: 0, rTo: 18 });
        s += text(cx + 80, y0 + 5, 'CH₃', { cls: 'fg-lbl', size: 11, anchor: 'start' });
      }
      s += frameRow(xs, y0);
      s += pUp(xs[0], y0);
      s += pUp(xs[1], y0);
      s += pUp(xs[2], y0, { empty: c.third === 'empty' });
      if (c.third === 'one') s += dots(xs[2], y0 - 22, 1);
      if (c.third === 'pair') s += dots(xs[2], y0 - 22, 2);
      if (c.third === 'empty') s += plus(xs[2] + 22, y0 - 30);
      const names = c.third === 'pair' ? ['C1', 'C2', 'O'] : ['C1', 'C2', 'C3'];
      xs.forEach((x, i) => { s += text(x, y0 + 58, names[i], { cls: 'fg-lbl', size: 11 }); });
      s += text(cx, 212, 'the row is extended by', { cls: 'fg-sm', size: 10.5 });
      s += text(cx, 232, c.foot, { cls: 'fg-tag-good' });
    }
    return s;
  },
  caption: 'Three rows that are conjugated with only one C=C each. In every panel, look at the third p orbital: it is parallel to the two p orbitals of the C=C, so all three overlap. The dashed lobes are empty, the single dot is one electron and the pair of dots is a lone pair.',
});

/* ------------------------------------------------- heptatriene-classify --- */
FIGURES.push({
  id: 'heptatriene-classify',
  section: 'conjugated-systems',
  anchor: '<h3>Isolated, conjugated, cumulated</h3>',
  alt: 'Skeletal structure of hepta-1,3,6-triene with carbons numbered 1 to 7. Double bonds at C1=C2, C3=C4 and C6=C7. C5 is marked sp3. A bracket over C1 to C4 reads conjugated, 4 pi electrons; a bracket over C6 and C7 reads isolated.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    const pts = zig(190, 150, 7, 64, 38);
    const below = (p) => P(p.x, p.y + 60);
    s += skDouble(pts[0], pts[1], below(pts[0]));
    s += bond(pts[1], pts[2], { rFrom: 0, rTo: 0 });
    s += skDouble(pts[2], pts[3], below(pts[2]));
    s += bond(pts[3], pts[4], { rFrom: 0, rTo: 0 });
    s += bond(pts[4], pts[5], { rFrom: 0, rTo: 0 });
    s += skDouble(pts[5], pts[6], below(pts[6]));
    pts.forEach((p, i) => {
      const up = i % 2 === 1;
      s += text(p.x, up ? p.y - 14 : p.y + 24, String(i + 1), { cls: i === 4 ? 'fg-tag-warn' : 'fg-lbl', size: 12 });
    });
    s += text(pts[4].x, pts[4].y + 44, 'sp³: the row breaks', { cls: 'fg-tag-warn' });
    s += bracket(pts[0].x - 6, pts[3].x + 6, 58, 'conjugated diene: 4 π electrons', 'fg-tag-good', true);
    s += bracket(pts[5].x - 6, pts[6].x + 6, 58, 'isolated alkene', 'fg-tag', true);
    return s;
  },
  caption: 'Hepta-1,3,6-triene with its carbons numbered. Find the one sp³ carbon, then read each side of it separately.',
});

/* ------------------------------------------------ delocalization-energy --- */
FIGURES.push({
  id: 'delocalization-energy',
  section: 'conjugated-systems',
  anchor: '<h3>Conjugation is worth about 15 kJ/mol</h3>',
  alt: 'Heats of hydrogenation compared as bars: but-1-ene 127, penta-1,4-diene 254, buta-1,3-diene 239 and allene 298 kilojoules per mole. A dashed line at 254 marks two independent double bonds; buta-1,3-diene falls 15 short of it and allene runs 44 past it.',
  viewBox: '0 0 760 360',
  build() {
    let s = '';
    const x0 = 200, k = 1.6;
    const rows = [
      { y: 96, name: 'But-1-ene', sub: 'one C=C', kJ: 127, kind: 'hi' },
      { y: 166, name: 'Penta-1,4-diene', sub: 'two isolated C=C', kJ: 254, kind: 'hi' },
      { y: 236, name: 'Buta-1,3-diene', sub: 'two conjugated C=C', kJ: 239, kind: 'good' },
      { y: 306, name: 'Allene', sub: 'two cumulated C=C', kJ: 298, kind: 'warn' },
    ];
    s += tag(430, 46, 'heat released on hydrogenation (kJ/mol)');
    s += rule(20, 62, 700, 62);
    for (const r of rows) {
      const w = r.kJ * k;
      s += label(20, r.y + 2, r.name, { anchor: 'start', size: 12 });
      s += text(20, r.y + 18, r.sub, { cls: 'fg-sm', size: 10, anchor: 'start' });
      s += bar(x0, r.y - 11, w, 22, { kind: r.kind, opacity: 0.34 });
      s += text(x0 + w - 14, r.y + 4, `${r.kJ} kJ/mol`, { cls: 'fg-lbl', size: 11.5, anchor: 'end' });
    }
    s += text(x0 + 6, 196, '2 × 127 = 254: the two C=C act independently', { cls: 'fg-sm', size: 10, anchor: 'start' });
    const xExp = x0 + 254 * k, xAct = x0 + 239 * k;
    s += `<line class="fg-dash" x1="${r2(xExp)}" y1="150" x2="${r2(xExp)}" y2="288"></line>`;
    const xAll = x0 + 298 * k;
    s += `<line class="fg-dash" x1="${r2(xExp)}" y1="322" x2="${r2(xExp)}" y2="334"></line>`;
    s += rule(xAll, 322, xAll, 334);
    s += rule(xExp, 334, xAll, 334);
    s += rule(xAct, 250, xAct, 262);
    s += rule(xAct, 262, xExp, 262);
    s += text(xAct - 8, 270, '15 less', { cls: 'fg-tag-good', anchor: 'end' });
    s += text((xExp + xAll) / 2, 352, '44 more', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'All four bars start from the same zero, so compare lengths. The dashed line marks where two independent double bonds would end: the conjugated diene stops short of it, and allene runs past it.',
});

FIGURES.push({
  id: 'l-delocalization-energy',
  lessons: ['conjugated-systems'],
  alt: 'Four bars of heat released on hydrogenation: but-1-ene 127, penta-1,4-diene 254, buta-1,3-diene 239, allene 298 kilojoules per mole. A dashed line at 254 shows buta-1,3-diene falls 15 short and allene runs past it.',
  viewBox: '0 0 340 360',
  build() {
    let s = '';
    const x0 = 16, k = 0.98;
    s += tag(170, 20, 'heat released on hydrogenation');
    const rows = [
      { y: 52, name: 'but-1-ene (one C=C)', kJ: 127, kind: 'hi' },
      { y: 122, name: 'penta-1,4-diene (isolated)', kJ: 254, kind: 'hi' },
      { y: 192, name: 'buta-1,3-diene (conjugated)', kJ: 239, kind: 'good' },
      { y: 262, name: 'allene (cumulated)', kJ: 298, kind: 'warn' },
    ];
    for (const r of rows) {
      const w = r.kJ * k;
      s += text(x0, r.y, r.name, { cls: 'fg-tag', anchor: 'start' });
      s += bar(x0, r.y + 8, w, 24, { kind: r.kind, opacity: 0.34 });
      s += text(x0 + w - 8, r.y + 25, `${r.kJ}`, { cls: 'fg-lbl', anchor: 'end' });
    }
    const xExp = x0 + 254 * k, xAct = x0 + 239 * k;
    s += `<line class="fg-dash" x1="${r2(xExp)}" y1="126" x2="${r2(xExp)}" y2="300"></line>`;
    s += rule(xAct, 228, xAct, 238);
    s += rule(xAct, 238, xExp, 238);
    s += text(xExp + 6, 222, '15 short', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(xExp - 6, 318, '44 past the line', { cls: 'fg-tag-warn', anchor: 'end' });
    s += text(170, 346, 'values in kJ/mol', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The dashed line marks two independent double bonds. The conjugated diene stops short of it; allene runs past it.',
});

/* -------------------------------------------------------- s-cis-s-trans --- */
/* A diene chain of four skeletal vertices with the central bond marked. */
function dieneChain(pts) {
  let t = '';
  t += bond(pts[0], pts[1], { order: 2, rFrom: 0, rTo: 0 });
  t += bond(pts[1], pts[2], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
  t += bond(pts[2], pts[3], { order: 2, rFrom: 0, rTo: 0 });
  return t;
}

/* The s-trans and s-cis forms, with the two inner hydrogens of s-cis drawn.
   Returns the ink for both, centered on the given points. */
function sTrans(c, small) {
  let s = '';
  const pts = [P(c.x - 72, c.y + 18), P(c.x - 24, c.y - 12), P(c.x + 24, c.y + 18), P(c.x + 72, c.y - 12)];
  s += dieneChain(pts);
  s += text(pts[0].x - 4, pts[0].y + 20, 'C1', { cls: small });
  s += text(pts[3].x + 4, pts[3].y - 10, 'C4', { cls: small });
  return s;
}
function sCis(c, small) {
  let s = '';
  const pts = [P(c.x - 50, c.y - 18), P(c.x - 28, c.y + 24), P(c.x + 28, c.y + 24), P(c.x + 50, c.y - 18)];
  s += dieneChain(pts);
  // the two inward hydrogens, one on C1 and one on C4
  const h1 = P(c.x - 18, c.y - 42), h4 = P(c.x + 18, c.y - 42);
  s += bond(pts[0], h1, { rFrom: 0, rTo: 12 });
  s += bond(pts[3], h4, { rFrom: 0, rTo: 12 });
  s += atom(h1.x, h1.y, 'H', { kind: 'warn', r: 12 });
  s += atom(h4.x, h4.y, 'H', { kind: 'warn', r: 12 });
  s += text(pts[0].x - 16, pts[0].y + 4, 'C1', { cls: small, anchor: 'end' });
  s += text(pts[3].x + 16, pts[3].y + 4, 'C4', { cls: small, anchor: 'start' });
  return s;
}

/* Cyclopentadiene with its CH2 at the top: the diene runs round the bottom. */
function cyclopentadiene(c, r) {
  let s = '';
  const v = [];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180;
    v.push(P(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r));
  }
  // v0 top (CH2), v1 upper right, v2 lower right, v3 lower left, v4 upper left
  s += bond(v[0], v[1], { rFrom: 0, rTo: 0 });
  s += bond(v[4], v[0], { rFrom: 0, rTo: 0 });
  s += ringDouble(v[1], v[2], c, { inset: 7 });
  s += bond(v[2], v[3], { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
  s += ringDouble(v[3], v[4], c, { inset: 7 });
  return { s, v };
}

/* Two six-membered rings sharing a bond, with one C=C in each ring placed
   on opposite sides of the shared bond: a diene locked s-trans. */
function fusedTrans(c, r) {
  let s = '';
  const k = r * Math.sqrt(3) / 2;
  const cxA = c.x - k, cxB = c.x + k, cy = c.y;
  const hex = (cx) => ({
    e30: P(cx + k, cy + r / 2), e90: P(cx, cy + r), e150: P(cx - k, cy + r / 2),
    e210: P(cx - k, cy - r / 2), e270: P(cx, cy - r), e330: P(cx + k, cy - r / 2),
  });
  const A = hex(cxA), B = hex(cxB);
  for (const [a, b] of [[A.e30, A.e90], [A.e90, A.e150], [A.e150, A.e210], [A.e210, A.e270]]) s += bond(a, b, { rFrom: 0, rTo: 0 });
  for (const [a, b] of [[B.e90, B.e30], [B.e30, B.e330], [B.e330, B.e270], [B.e270, A.e330]]) s += bond(a, b, { rFrom: 0, rTo: 0 });
  s += bond(A.e330, A.e30, { cls: 'fg-bond-hi', rFrom: 0, rTo: 0 });
  s += ringDouble(A.e270, A.e330, P(cxA, cy), { inset: 7 });
  s += ringDouble(B.e90, A.e30, P(cxB, cy), { inset: 7 });
  return s;
}

FIGURES.push({
  id: 's-cis-s-trans',
  section: 'conjugated-systems',
  anchor: '<h3>s-cis and s-trans: a conformation, not a configuration</h3>',
  alt: 'Buta-1,3-diene drawn s-trans, with its two double bonds pointing opposite ways across the highlighted C2–C3 single bond, and a pair of rotation arrows to the s-cis form, with both double bonds on the same side and the inward hydrogens on C1 and C4 drawn crowding each other. Below, cyclopentadiene, whose ring holds its diene s-cis, and two fused six-membered rings that hold a diene s-trans across the shared bond.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    s += tag(155, 54, 's-trans');
    s += sTrans(P(155, 140), 'fg-sm');
    s += text(155, 196, 'the two C=C point opposite ways', { cls: 'fg-sm', size: 10 });
    s += text(155, 212, 'the more stable conformation', { cls: 'fg-sm', size: 10 });

    s += curve(P(282, 132), P(430, 132), { bow: -26 });
    s += curve(P(430, 164), P(282, 164), { bow: -26 });
    s += text(356, 86, 'rotate about the highlighted', { cls: 'fg-tag', size: 10.5 });
    s += text(356, 102, 'C2–C3 single bond', { cls: 'fg-tag', size: 10.5 });
    s += text(356, 152, 'about 12 kJ/mol uphill', { cls: 'fg-sm', size: 10 });
    s += text(356, 204, 'no bond breaks: one compound', { cls: 'fg-sm', size: 10 });

    s += tag(580, 54, 's-cis');
    s += sCis(P(580, 146), 'fg-sm');
    s += text(580, 196, 'both C=C point the same way', { cls: 'fg-sm', size: 10 });
    s += text(580, 212, 'the inward H atoms on C1 and C4 collide', { cls: 'fg-tag-warn', size: 10.5 });

    s += rule(30, 234, 730, 234);

    s += tag(190, 256, 'cyclopentadiene: locked s-cis');
    const cp = cyclopentadiene(P(190, 330), 40);
    s += cp.s;
    s += text(cp.v[0].x, cp.v[0].y - 10, 'CH₂', { cls: 'fg-sm', size: 10 });
    s += text(190, 392, 'the ring holds both C=C on the same side', { cls: 'fg-sm', size: 10 });
    s += text(190, 408, 'of the highlighted bond', { cls: 'fg-sm', size: 10 });

    s += tag(560, 256, 'two fused rings: locked s-trans');
    s += fusedTrans(P(560, 318), 38);
    s += text(560, 392, 'the highlighted bond belongs to both rings,', { cls: 'fg-sm', size: 10 });
    s += text(560, 408, 'and the two C=C sit on opposite sides of it', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Top: one molecule in two conformations. Follow the highlighted C2–C3 bond and see which side of it each double bond sits on. Bottom: two rings that fix the answer.',
});

FIGURES.push({
  id: 'l-s-cis-s-trans',
  lessons: ['conjugated-systems'],
  alt: 'Stacked panels. Buta-1,3-diene s-trans, with the double bonds on opposite sides of the highlighted C2–C3 bond. Rotation arrow. The s-cis form, with both double bonds on the same side and the inward hydrogens on C1 and C4 colliding. Below, cyclopentadiene locked s-cis and two fused rings locked s-trans.',
  viewBox: '0 0 340 560',
  build() {
    let s = '';
    s += panel(8, 6, 324, 128);
    s += tag(170, 28, 's-trans: C=C on opposite sides');
    s += sTrans(P(170, 84), 'fg-tag');
    s += arrow(P(170, 140), P(170, 168));
    s += arrow(P(170, 168), P(170, 140));
    s += tag(186, 158, 'rotate about C2–C3', { anchor: 'start' });
    s += panel(8, 174, 324, 150, { kind: 'warn' });
    s += tag(170, 196, 's-cis: C=C on the same side');
    s += sCis(P(170, 264), 'fg-tag');
    s += tag(170, 314, 'inward H atoms collide', { cls: 'fg-tag-warn' });
    s += panel(8, 334, 158, 220);
    s += tag(87, 356, 'cyclopentadiene');
    const cp = cyclopentadiene(P(87, 440), 38);
    s += cp.s;
    s += tag(cp.v[0].x, cp.v[0].y - 10, 'CH₂');
    s += tag(87, 520, 'locked s-cis', { cls: 'fg-tag-good' });
    s += panel(174, 334, 158, 220);
    s += tag(253, 356, 'fused rings');
    s += fusedTrans(P(253, 440), 34);
    s += tag(253, 520, 'locked s-trans', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'The highlighted bond is C2–C3. Check which side of it each C=C sits on.',
});

/* ------------------------------------------------------ butadiene-orbitals --- */
/* Hückel coefficients for buta-1,3-diene, lowest orbital first. */
const BUTA = [
  [0.372, 0.602, 0.602, 0.372],
  [0.602, 0.372, -0.372, -0.602],
  [0.602, -0.372, -0.372, 0.602],
  [0.372, -0.602, 0.602, -0.372],
];

/* One orbital drawn as a row of p orbitals whose sizes follow the
   coefficients, with a dashed node line wherever the phase flips. */
function orbitalRow(xs, y0, coef) {
  let s = '';
  s += frameRow(xs, y0);
  coef.forEach((c, i) => {
    if (Math.abs(c) < 0.01) return;
    const big = Math.abs(c) > 0.5;
    s += pUp(xs[i], y0, { sign: c, rx: big ? 12 : 8.5, ry: big ? 17 : 11 });
  });
  for (let i = 0; i + 1 < coef.length; i++) {
    if (coef[i] * coef[i + 1] < 0) {
      const x = (xs[i] + xs[i + 1]) / 2;
      s += `<line class="fg-orb-node" x1="${r2(x)}" y1="${r2(y0 - 38)}" x2="${r2(x)}" y2="${r2(y0 + 38)}"></line>`;
    }
  }
  return s;
}

FIGURES.push({
  id: 'butadiene-orbitals',
  section: 'conjugated-systems',
  anchor: '<h3>The orbital picture: n p orbitals make n molecular orbitals</h3>',
  alt: 'The four pi molecular orbitals of buta-1,3-diene stacked by energy, each drawn as p orbitals on C1 to C4. psi-1 at the bottom: all lobes in phase, no node, two electrons. psi-2: one node between C2 and C3, two electrons, labeled HOMO. psi-3: two nodes, empty, labeled LUMO. psi-4 at the top: three nodes, empty. In psi-2 and psi-3 the lobes on C1 and C4 are the largest.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    s += arrow(P(40, 404), P(40, 40));
    s += text(50, 36, 'energy', { cls: 'fg-tag', anchor: 'start' });
    const xs = [250, 310, 370, 430];
    // Hückel spacing: 88 px per |beta| about y = 221 (levels at ±0.618 and ±1.618 beta)
    const ys = [363, 275, 167, 79];
    const info = [
      ['ψ₁', '0 nodes', 'filled: 2 electrons', ''],
      ['ψ₂', '1 node', 'filled: 2 electrons', 'HOMO'],
      ['ψ₃', '2 nodes', 'empty', 'LUMO'],
      ['ψ₄', '3 nodes', 'empty', ''],
    ];
    BUTA.forEach((coef, i) => {
      const y0 = ys[i];
      s += orbitalRow(xs, y0, coef);
      s += label(170, y0 + 5, info[i][0], { size: 14 });
      s += text(480, y0 - 4, info[i][1], { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      s += text(480, y0 + 14, info[i][2], { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      if (i < 2) s += dots(130, y0, 2);
      if (info[i][3]) s += text(620, y0 + 5, info[i][3], { cls: info[i][3] === 'HOMO' ? 'fg-tag-good' : 'fg-tag-warn', anchor: 'start' });
    });
    xs.forEach((x, i) => { s += text(x, 420, `C${i + 1}`, { cls: 'fg-lbl', size: 11 }); });
    s += text(130, 420, 'electrons', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Read from the bottom up. Count the dashed node lines in each row, and compare the lobe sizes on the end carbons with those on C2 and C3 in ψ₂ and ψ₃.',
});

/* ---------------------------------------------------- butadiene-mo-ladder --- */
FIGURES.push({
  id: 'butadiene-mo-ladder',
  section: 'conjugated-systems',
  anchor: '<h3>The orbital picture: n p orbitals make n molecular orbitals</h3>',
  alt: 'Molecular orbital energy ladders for ethene, buta-1,3-diene and hexa-1,3,5-triene side by side. Each has as many orbitals as p orbitals, the lower half filled with electron pairs, and the HOMO-LUMO gap marked; the gap shrinks from ethene to the triene while the ladder grows slightly taller.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    s += arrow(P(40, 300), P(40, 64));
    s += text(50, 58, 'energy', { cls: 'fg-tag', anchor: 'start' });
    const col = (cx, name, sub, levels, homoAt) => {
      let t = '';
      levels.forEach((lv, i) => {
        t += `<line class="fg-bond" x1="${cx - 50}" y1="${lv.y}" x2="${cx + 50}" y2="${lv.y}"></line>`;
        t += text(cx - 58, lv.y + 4, lv.name, { cls: 'fg-sm', size: 10, anchor: 'end' });
        if (i <= homoAt) t += dots(cx - 24, lv.y - 6, 2);
      });
      const hi = levels[homoAt].y, lo = levels[homoAt + 1].y;
      t += text(cx + 58, hi + 4, 'HOMO', { cls: 'fg-tag-good', anchor: 'start' });
      t += text(cx + 58, lo + 4, 'LUMO', { cls: 'fg-tag-warn', anchor: 'start' });
      t += arrow(P(cx + 20, hi - 4), P(cx + 20, lo + 4), { size: 7 });
      t += arrow(P(cx + 20, lo + 4), P(cx + 20, hi - 4), { size: 7 });
      t += text(cx + 28, (hi + lo) / 2 + 4, 'gap', { cls: 'fg-tag', anchor: 'start' });
      t += text(cx, 306, name, { cls: 'fg-lbl', size: 12 });
      t += text(cx, 322, sub, { cls: 'fg-sm', size: 9.5 });
      return t;
    };
    /* Hückel heights: every level at alpha - 2*beta*cos(k*pi/(n+1)), drawn at
       55 px per |beta| about a common alpha line at y = 180. */
    s += col(170, 'Ethene', '2 p orbitals → 2 orbitals',
      [{ name: 'π', y: 235 }, { name: 'π*', y: 125 }], 0);
    s += col(390, 'Buta-1,3-diene', '4 p orbitals → 4 orbitals',
      [{ name: 'ψ₁', y: 269 }, { name: 'ψ₂', y: 214 }, { name: 'ψ₃', y: 146 }, { name: 'ψ₄', y: 91 }], 1);
    s += col(610, 'Hexa-1,3,5-triene', '6 p orbitals → 6 orbitals',
      [{ name: 'ψ₁', y: 279 }, { name: 'ψ₂', y: 249 }, { name: 'ψ₃', y: 204 },
       { name: 'ψ₄', y: 156 }, { name: 'ψ₅', y: 111 }, { name: 'ψ₆', y: 81 }], 2);
    return s;
  },
  caption: 'Compare the length of the gap arrow from left to right, then compare the height of each whole ladder.',
});

/* --------------------------------------------------- allyl-cation-resonance --- */
FIGURES.push({
  id: 'allyl-cation-resonance',
  section: 'conjugated-systems',
  lessons: ['conjugated-systems'],
  anchor: '<h3>Why the ends of the system are where the chemistry happens</h3>',
  alt: 'The two resonance forms of the allyl cation. Left: CH2=CH–CH2 plus, charge on C3, with a curved arrow from the C1=C2 double bond to the C2–C3 bond. Double-headed resonance arrow. Right: plus CH2–CH=CH2, charge on C1. C2 carries no charge in either form.',
  viewBox: '0 0 340 220',
  build() {
    let s = '';
    const L = [P(34, 132), P(84, 102), P(134, 132)];
    const R = [P(206, 132), P(256, 102), P(306, 132)];
    // left: C1=C2, C2-C3, + on C3
    s += bond(L[0], L[1], { order: 2 });
    s += bond(L[1], L[2]);
    // right: C1-C2, C2=C3, + on C1
    s += bond(R[0], R[1]);
    s += bond(R[1], R[2], { order: 2 });
    const names = ['CH₂', 'CH', 'CH₂'];
    for (const set of [L, R]) set.forEach((p, i) => { s += atom(p.x, p.y, names[i]); });
    s += plus(L[2].x, L[2].y - 24);
    s += plus(R[0].x, R[0].y - 24);
    // curved arrow: the pi electrons of C1=C2 move into the C2-C3 bond
    s += curve(P(52, 110), P(117, 109), { bow: -62, size: 7 });
    s += arrow(P(158, 132), P(182, 132), { size: 7 });
    s += arrow(P(182, 132), P(158, 132), { size: 7 });
    for (const set of [L, R]) set.forEach((p, i) => { s += text(p.x, p.y + 32, `C${i + 1}`, { cls: 'fg-tag' }); });
    s += text(L[1].x, 190, '+ on C3', { cls: 'fg-tag-warn' });
    s += text(R[1].x, 190, '+ on C1', { cls: 'fg-tag-warn' });
    s += text(170, 212, 'C2 carries no charge in either form', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Follow the curved arrow: the π electrons of C1=C2 move to C2–C3, so the positive charge moves from C3 to C1.',
});

/* ------------------------------------------------------- allyl-three-orbitals --- */
const ALLYL = [
  [0.5, 0.707, 0.5],
  [0.707, 0, -0.707],
  [0.5, -0.707, 0.5],
];

FIGURES.push({
  id: 'allyl-three-orbitals',
  section: 'conjugated-systems',
  anchor: '<h3>Why the ends of the system are where the chemistry happens</h3>',
  alt: 'The three molecular orbitals of the allyl system, drawn as p orbital lobes on three carbons. psi-1: every lobe in phase, the middle one largest, no node. psi-2: lobes only on C1 and C3, in opposite phases, with a node drawn through C2. psi-3: all three carry lobes with the phase alternating and two nodes between atoms. Below, a table: the allyl cation has 2 electrons, psi-2 empty; the radical has 3, one in psi-2; the anion has 4, psi-2 full.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    const titles = [['ψ₁', 'lowest: no node between atoms'], ['ψ₂', 'middle: node through C2'], ['ψ₃', 'highest: two nodes']];
    [0, 1, 2].forEach((k) => {
      const x = 20 + k * 244, cx = x + 110, y0 = 150;
      s += panel(x, 20, 220, 210, { kind: k === 1 ? 'hi' : undefined });
      s += label(cx, 48, titles[k][0], { size: 14 });
      s += text(cx, 68, titles[k][1], { cls: k === 1 ? 'fg-tag' : 'fg-sm', size: 10.5 });
      const xs = [cx - 56, cx, cx + 56];
      s += frameRow(xs, y0);
      ALLYL[k].forEach((c, i) => {
        if (Math.abs(c) < 0.01) return;
        const big = Math.abs(c) > 0.6;
        s += pUp(xs[i], y0, { sign: c, rx: big ? 13 : 10, ry: big ? 19 : 14 });
      });
      if (k === 1) s += `<line class="fg-orb-node" x1="${cx}" y1="102" x2="${cx}" y2="198"></line>`;
      if (k === 2) for (const nx of [cx - 28, cx + 28]) s += `<line class="fg-orb-node" x1="${nx}" y1="102" x2="${nx}" y2="198"></line>`;
      xs.forEach((x2, i) => { s += text(x2, 218, `C${i + 1}`, { cls: 'fg-lbl', size: 11 }); });
    });
    s += rule(30, 250, 730, 250);
    s += tag(380, 274, 'what ψ₂ holds in each allyl species');
    const rows = [
      ['allyl cation', '2 π electrons', 'ψ₂ empty', '+ on C1 and C3'],
      ['allyl radical', '3 π electrons', 'ψ₂ holds one', 'odd electron on C1 and C3'],
      ['allyl anion', '4 π electrons', 'ψ₂ full', '− on C1 and C3'],
    ];
    rows.forEach((r, i) => {
      const y = 302 + i * 24;
      s += text(60, y, r[0], { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
      s += text(230, y, r[1], { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      s += text(380, y, r[2], { cls: 'fg-sm', size: 10.5, anchor: 'start' });
      s += text(520, y, r[3], { cls: 'fg-tag', anchor: 'start' });
    });
    return s;
  },
  caption: 'Look at the middle panel: C2 has no lobe in ψ₂. The table shows that ψ₂ is the only orbital whose filling changes from cation to radical to anion.',
});

FIGURES.push({
  id: 'l-allyl-psi2',
  lessons: ['conjugated-systems'],
  alt: 'The allyl psi-2 orbital: p orbital lobes on C1 and C3 in opposite phases, no lobe on C2, and a dashed node line drawn through C2. It is empty in the allyl cation.',
  viewBox: '0 0 340 200',
  build() {
    let s = '';
    const cx = 170, y0 = 96;
    s += tag(cx, 20, 'ψ₂ of the allyl system');
    const xs = [cx - 70, cx, cx + 70];
    s += frameRow(xs, y0);
    s += pUp(xs[0], y0, { sign: 1, rx: 13, ry: 19 });
    s += pUp(xs[2], y0, { sign: -1, rx: 13, ry: 19 });
    s += `<line class="fg-orb-node" x1="${cx}" y1="48" x2="${cx}" y2="144"></line>`;
    s += tag(cx + 8, 50, 'node', { anchor: 'start' });
    xs.forEach((x, i) => { s += text(x, 164, `C${i + 1}`, { cls: 'fg-lbl' }); });
    s += tag(cx, 190, 'empty in the cation: + on C1 and C3', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'C2 has no lobe in this orbital, so whatever it holds or lacks belongs to C1 and C3.',
});

export default FIGURES;
