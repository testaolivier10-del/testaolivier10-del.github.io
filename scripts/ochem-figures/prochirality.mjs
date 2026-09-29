/* Figures for the prochirality notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every substitution test and every face assignment is drawn with its CIP
   priorities on the drawing, because the whole topic is "run R/S twice and
   compare". All figures except the flowchart are 340 wide with fg-lbl and
   fg-tag text only, so the same drawing can sit in the notes and the lesson. */
import { atom, bond, wedge, hash, arrow, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { sk } from '../lib/ochem-skeletal.mjs';
import { armEnd, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ---------------------------------------------------------------- helpers */

/* Radius of the disc an atom label sits in. */
const rOf = (lab) => (lab.length > 2 ? 20 : lab.length > 1 ? 15 : 12);

/* One arm of a drawn center: the bond (plain, wedge or hash) and its atom. */
function arm(c, deg, len, lab, o = {}) {
  const e = armEnd(c, deg, len);
  const r = o.r ?? rOf(lab);
  const rc = o.rc ?? 16;
  const draw = o.type === 'wedge' ? wedge : o.type === 'hash' ? hash : bond;
  let s = draw(c, e, { rFrom: rc, rTo: r, width: 10, rungs: 5 });
  s += atom(e.x, e.y, lab, { r, kind: o.kind, size: o.size });
  return s;
}

/* A CIP priority number beside an atom: 1 to 3 in the "good" color, 4 in the
   warning color, as on the R/S configuration page. */
const pri = (x, y, k) => text(x, y, String(k), { cls: k === 4 ? 'fg-tag-warn' : 'fg-tag-good' });

/* Arrowhead with its tip at (x, y), pointing along (ux, uy). */
function head(x, y, ux, uy, size = 7) {
  const px = -uy, py = ux, bx = x - ux * size, by = y - uy * size, h = size * 0.52;
  return `<path class="fg-head" d="M${n2(x)} ${n2(y)} L${n2(bx + px * h)} ${n2(by + py * h)} L${n2(bx - px * h)} ${n2(by - py * h)} Z"></path>`;
}

/* The 1 -> 2 -> 3 sweep as a circular arc around the center, from angle a1 to
   a2 (degrees, counterclockwise from +x as in armEnd). `cw` picks the
   direction the arrow turns on the page. */
function sweep(c, R, a1, a2, cw) {
  const pt = (a) => P(c.x + R * Math.cos((a * Math.PI) / 180), c.y - R * Math.sin((a * Math.PI) / 180));
  let d = cw ? a1 - a2 : a2 - a1;
  while (d <= 0) d += 360;
  const stop = cw ? a1 - d + 9 : a1 + d - 9;           // leave room for the head
  const p1 = pt(a1), p2 = pt(stop), tip = pt(cw ? a1 - d : a1 + d);
  const large = d - 9 > 180 ? 1 : 0;
  const sweepFlag = cw ? 1 : 0;                          // SVG: 1 = clockwise on screen
  let s = `<path class="fg-arrow" fill="none" d="M${n2(p1.x)} ${n2(p1.y)} A${R} ${R} 0 ${large} ${sweepFlag} ${n2(p2.x)} ${n2(p2.y)}"></path>`;
  const ux = tip.x - p2.x, uy = tip.y - p2.y, ul = Math.hypot(ux, uy) || 1;
  s += head(tip.x, tip.y, ux / ul, uy / ul);
  return s;
}

/* Text with an italic prefix, e.g. itext(x, y, 'cis', ' isomer'). */
const itext = (x, y, parts, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${n2(x)}" y="${n2(y)}" text-anchor="${anchor}">` +
  parts.map((p) => (typeof p === 'string' ? p.replace(/&/g, '&amp;').replace(/</g, '&lt;') : `<tspan font-style="italic">${p.i}</tspan>`)).join('') +
  `</text>`;

/* Lines of text, one under another. */
const lines = (x, y0, dy, rows, anchor = 'start') =>
  rows.map((r, i) => {
    if (!r) return '';
    const [s, cls] = Array.isArray(r) ? r : [r, 'fg-tag'];
    return text(x, y0 + i * dy, s, { cls, anchor });
  }).join('');

/* ---------------------------------------------------------------- flowchart
   The whole page as one decision: three branches, three names. */
FIGURES.push({
  id: 'topicity-flowchart',
  section: 'prochirality',
  viewBox: '0 0 760 330',
  alt: 'A flowchart. Two identical-looking groups on one atom: replace one with D, undo it, replace the other, then compare the two products. If they are the same compound, the groups are homotopic, as in the CH2 of propane: one NMR signal, and nothing can tell them apart. If they are enantiomers, the groups are enantiotopic, as in the CH2 of ethanol: one NMR signal, and only a chiral environment tells them apart. If they are diastereomers, the groups are diastereotopic, as in the C3 hydrogens of 2-bromobutane: they can give two NMR signals, and they differ toward everything.',
  build() {
    let s = '';
    s += panel(212, 16, 336, 40);
    s += text(380, 41, 'Two identical-looking groups on one atom', { cls: 'fg-lbl' });
    s += arrow(P(380, 58), P(380, 84));
    s += panel(150, 84, 460, 52, { kind: 'hi' });
    s += text(380, 106, 'Replace one with D. Undo it. Replace the other.', { cls: 'fg-lbl' });
    s += text(380, 126, 'Then compare the two products.', { cls: 'fg-tag' });
    s += arrow(P(380, 138), P(380, 154));
    s += bond(P(130, 156), P(630, 156), { rFrom: 0, rTo: 0 });
    const cols = [
      { x: 130, q: 'the same compound', name: 'homotopic', kind: null,
        ex: 'the CH₂ of propane', f1: 'one NMR signal; nothing', f2: 'can tell them apart' },
      { x: 380, q: 'enantiomers', name: 'enantiotopic', kind: 'hi',
        ex: 'the CH₂ of ethanol', f1: 'one NMR signal; only a chiral', f2: 'environment tells them apart' },
      { x: 630, q: 'diastereomers', name: 'diastereotopic', kind: 'warn',
        ex: 'the C3 hydrogens of 2-bromobutane', f1: 'can give two NMR signals;', f2: 'they differ toward everything' },
    ];
    for (const c of cols) {
      s += arrow(P(c.x, 156), P(c.x, 180));
      s += text(c.x, 198, 'products are ' + c.q, { cls: 'fg-tag' });
      s += panel(c.x - 110, 208, 220, 44, c.kind ? { kind: c.kind } : {});
      s += text(c.x, 235, c.name, { cls: 'fg-lbl' });
      s += text(c.x, 274, c.ex, { cls: 'fg-sm' });
      s += text(c.x, 300, c.f1, { cls: c.kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good' });
      s += text(c.x, 318, c.f2, { cls: c.kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good' });
    }
    return s;
  },
  caption: 'The substitution test as one decision. The bottom row previews what each answer means for a spectrum and for reactions.',
});

/* ------------------------------------------------------------------ propane
   The homotopic case: the labeled carbon is left with two identical methyl
   groups, so both substitutions give one compound. */
function propaneCenter(c, top, bottom) {
  // top = the group on the wedge (60°), bottom = the group on the hash (120°)
  let s = '';
  s += arm(c, 180, 56, 'CH₃');
  s += arm(c, 0, 56, 'CH₃');
  s += arm(c, 60, 46, top.lab, { type: 'wedge', kind: top.kind, size: top.size });
  s += arm(c, 120, 46, bottom.lab, { type: 'hash', kind: bottom.kind, size: bottom.size });
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  return s;
}
FIGURES.push({
  id: 'propane-homotopic',
  section: 'prochirality',
  viewBox: '0 0 340 446',
  alt: 'The substitution test on C2 of propane. Top: C2 with a methyl group on each side, Ha on a wedge and Hb on a hash. Replacing Ha with D gives C2 with two methyls, D on the wedge and H on the hash. Replacing Hb with D gives two methyls, H on the wedge and D on the hash. The two methyl groups tie, so C2 is not a stereocenter; turning the second product over gives the first. Both are the same compound, so Ha and Hb are homotopic.',
  build() {
    let s = '';
    s += text(170, 16, 'propane, C2: two CH₃ and two H', { cls: 'fg-tag' });
    s += propaneCenter(P(170, 96), { lab: 'Ha', size: 10.5 }, { lab: 'Hb', size: 10.5 });

    s += panel(8, 140, 324, 104);
    s += text(20, 162, 'Ha → D', { cls: 'fg-lbl', anchor: 'start' });
    s += propaneCenter(P(170, 214), { lab: 'D', kind: 'warn' }, { lab: 'H' });

    s += panel(8, 254, 324, 104);
    s += text(20, 276, 'Hb → D', { cls: 'fg-lbl', anchor: 'start' });
    s += propaneCenter(P(170, 328), { lab: 'H' }, { lab: 'D', kind: 'warn' });

    s += lines(170, 384, 22, [
      ['CH₃ and CH₃ tie, so C2 is not a stereocenter.', 'fg-tag'],
      ['Turn the second product over: it is the first.', 'fg-tag-good'],
    ], 'middle');
    s += text(170, 436, 'same compound: homotopic', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Turning the second product over (a half turn about a vertical line in the page) swaps its wedge and hash and leaves the two methyl groups where they were. It becomes the first product exactly.',
});

/* ------------------------------------------------------------------ ethanol
   The enantiotopic case. The parent and both products are drawn in the same
   orientation, so the only change between the two products is which bond D
   sits on. Priorities are marked; the arc is the 1 -> 2 -> 3 trace. */
function ethanolCenter(c, wedgeLab, hashLab, o = {}) {
  // OH up, CH3 lower left, the two hydrogens lower right: one wedge, one hash.
  let s = '';
  s += arm(c, 90, 46, 'OH', { kind: 'hi', size: 10.5 });
  s += arm(c, 210, 50, 'CH₃');
  s += arm(c, 335, 50, wedgeLab.lab, { type: 'wedge', kind: wedgeLab.kind, size: wedgeLab.size, r: 12 });
  s += arm(c, 285, 46, hashLab.lab, { type: 'hash', kind: hashLab.kind, size: hashLab.size, r: 12 });
  if (o.sweepTo !== undefined) s += sweep(c, 27, 104, o.sweepTo, false);
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  if (o.pri) {
    const [pw, ph] = o.pri;                 // priorities of the wedge and hash groups
    s += pri(c.x + 24, c.y - 50, 1);
    s += pri(c.x - 43, c.y + 56, 2);
    s += pri(c.x + 65, c.y + 26, pw);
    s += pri(c.x + 29, c.y + 60, ph);
  }
  return s;
}
FIGURES.push({
  id: 'ethanol-substitution-test',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 494',
  alt: 'The substitution test on C1 of ethanol, with every drawing in the same orientation: OH up, CH3 lower left, Ha on a wedge and Hb on a hash at the lower right. Replacing Ha with D: priorities OH 1, CH3 2, D 3, H 4; H is on the hash, pointing away, and 1 to 2 to 3 runs counterclockwise, so the product is S. Replacing Hb with D: the same priorities, but H is now on the wedge, pointing at you, so the counterclockwise trace is flipped and the product is R. S and R are enantiomers, so Ha and Hb are enantiotopic.',
  build() {
    let s = '';
    s += text(170, 16, 'ethanol, C1: OH, CH₃ and two H', { cls: 'fg-tag' });
    s += ethanolCenter(P(170, 86), { lab: 'Ha', size: 10.5 }, { lab: 'Hb', size: 10.5 });

    s += panel(8, 150, 324, 138);
    s += ethanolCenter(P(92, 222), { lab: 'D', kind: 'warn' }, { lab: 'H' }, { sweepTo: 330, pri: [3, 4] });
    s += lines(178, 174, 20, [
      ['Ha → D', 'fg-lbl'],
      'H (4) is on the hash,',
      'pointing away.',
      '1→2→3 runs',
      'counterclockwise,',
      ['so this is S', 'fg-tag-good'],
    ]);

    s += panel(8, 298, 324, 138);
    s += ethanolCenter(P(92, 370), { lab: 'H' }, { lab: 'D', kind: 'warn' }, { sweepTo: 292, pri: [4, 3] });
    s += lines(178, 322, 20, [
      ['Hb → D', 'fg-lbl'],
      'H (4) is on the wedge,',
      'pointing at you.',
      'Counterclockwise,',
      'so flip it:',
      ['this is R', 'fg-tag-warn'],
    ]);

    s += text(170, 462, 'S and R are enantiomers,', { cls: 'fg-lbl' });
    s += text(170, 484, 'so Ha and Hb are enantiotopic', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The two products differ only in which bond D and H sit on. Swapping a wedge and a hash is a reflection through the page, so the products are mirror images.',
});

/* ----------------------------------------------------------- 2-bromobutane
   The diastereotopic case, as a skeletal zigzag with C2's bromine on a wedge
   and both C3 hydrogens drawn. */
function bromobutane(x, y, left, right, o = {}) {
  // C1..C4 zigzag; C2 and C4 are the upper vertices. left/right = the groups on
  // C3's down-left wedge and down-right hash.
  const c1 = P(x, y + 24), c2 = P(x + 40, y), c3 = P(x + 80, y + 24), c4 = P(x + 120, y);
  let s = sk(c1, c2) + sk(c2, c3) + sk(c3, c4);
  const br = P(x + 40, y - 40);
  s += wedge(c2, br, { rFrom: 0, rTo: 15, width: 10 });
  s += atom(br.x, br.y, 'Br', { kind: 'hi', size: 10.5 });
  const a = armEnd(c3, 245, 42), b = armEnd(c3, 295, 42);
  s += wedge(c3, a, { rFrom: 0, rTo: 12, width: 10 });
  s += hash(c3, b, { rFrom: 0, rTo: 12, width: 10 });
  s += atom(a.x, a.y, left.lab, { r: 12, kind: left.kind, size: left.size });
  s += atom(b.x, b.y, right.lab, { r: 12, kind: right.kind, size: right.size });
  if (o.labels) {
    s += text(c2.x - 12, c2.y + 4, 'C2', { cls: 'fg-tag', anchor: 'end' });
    s += text(c3.x + 12, c3.y + 4, 'C3', { cls: 'fg-tag', anchor: 'start' });
  }
  if (o.pri) {
    const [pl, pr] = o.pri;
    s += sweep(c3, 22, 160, pr === 3 ? 305 : 255, true);
    s += pri(c2.x + 15, c2.y - 6, 1);
    s += pri(c4.x + 10, c4.y + 22, 2);
    s += pri(a.x - 20, a.y + 4, pl);
    s += pri(b.x + 20, b.y + 4, pr);
  }
  return s;
}
FIGURES.push({
  id: 'bromobutane-c3-test',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 540',
  alt: 'The substitution test on C3 of (R)-2-bromobutane, drawn as a zigzag with Br on a wedge at C2 and, at C3, Ha on a wedge (down left) and Hb on a hash (down right). Replacing Ha with D: at C3 the priorities are C2 1 (it carries Br), C4 2, D 3 and H 4; H points away and 1 to 2 to 3 runs clockwise, so C3 is R. Replacing Hb with D: the same priorities, but H points at you, so the clockwise trace is flipped and C3 is S. C2 stays R in both. The products are (2R,3R) and (2R,3S), which are diastereomers, so Ha and Hb are diastereotopic.',
  build() {
    let s = '';
    s += text(170, 16, '(R)-2-bromobutane: C2 is already R', { cls: 'fg-tag' });
    s += bromobutane(110, 92, { lab: 'Ha', size: 10.5 }, { lab: 'Hb', size: 10.5 }, { labels: true });

    s += panel(8, 180, 324, 146);
    s += bromobutane(28, 240, { lab: 'D', kind: 'warn' }, { lab: 'H' }, { pri: [3, 4] });
    s += lines(180, 204, 22, [
      ['Ha → D', 'fg-lbl'],
      'At C3: 1 = C2, 2 = C4,',
      '3 = D, 4 = H.',
      'H points away:',
      'clockwise, so C3 is R.',
      ['(2R,3R)', 'fg-tag-good'],
    ]);

    s += panel(8, 336, 324, 146);
    s += bromobutane(28, 396, { lab: 'H' }, { lab: 'D', kind: 'warn' }, { pri: [4, 3] });
    s += lines(180, 360, 22, [
      ['Hb → D', 'fg-lbl'],
      'Same ranking, but H',
      'points at you:',
      'clockwise, flipped,',
      'so C3 is S.',
      ['(2R,3S)', 'fg-tag-warn'],
    ]);

    s += text(170, 508, 'C2 matches, C3 is opposite: diastereomers,', { cls: 'fg-lbl' });
    s += text(170, 530, 'so Ha and Hb are diastereotopic', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'The numbers are the CIP priorities at C3, the new stereocenter. C2 is untouched by either substitution and stays R.',
});

/* ------------------------------------------------------- methylcyclohexane
   A ring can give the two hydrogens of a CH2 different surroundings with no
   stereocenter in the starting molecule. */
function mchx(cx, cy, a, b) {
  const v = [];
  for (let i = 0; i < 6; i++) v.push(armEnd(P(cx, cy), 90 - i * 60, 32));
  let s = '';
  for (let i = 0; i < 6; i++) s += sk(v[i], v[(i + 1) % 6]);
  const c1 = v[3], c2 = v[2];                  // bottom vertex, lower-right vertex
  const me = P(c1.x, c1.y + 32);
  s += wedge(c1, me, { rFrom: 0, rTo: 17, width: 10 });
  s += atom(me.x, me.y, 'CH₃', { r: 17, kind: 'hi', size: 9.5 });
  const pa = armEnd(c2, 5, 40), pb = armEnd(c2, 300, 40);
  s += wedge(c2, pa, { rFrom: 0, rTo: 12, width: 10 });
  s += hash(c2, pb, { rFrom: 0, rTo: 12, width: 10 });
  s += atom(pa.x, pa.y, a.lab, { r: 12, kind: a.kind, size: a.size });
  s += atom(pb.x, pb.y, b.lab, { r: 12, kind: b.kind, size: b.size });
  return { s, c1, c2 };
}
FIGURES.push({
  id: 'ring-diastereotopic',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 494',
  alt: 'Methylcyclohexane as a flat hexagon with the methyl group on a wedge at C1. The next carbon, C2, carries Ha on a wedge and Hb on a hash. Replacing Ha with D puts D and the methyl both on wedges, the same face of the ring: the cis product. Replacing Hb with D puts D on a hash and the methyl on a wedge, opposite faces: the trans product. Cis and trans isomers are diastereomers, so Ha and Hb are diastereotopic.',
  build() {
    let s = '';
    s += text(170, 16, 'methylcyclohexane: no stereocenter', { cls: 'fg-tag' });
    const top = mchx(150, 64, { lab: 'Ha', size: 10.5 }, { lab: 'Hb', size: 10.5 });
    s += top.s;
    s += text(top.c1.x - 12, top.c1.y + 2, 'C1', { cls: 'fg-tag', anchor: 'end' });
    s += text(top.c2.x - 8, top.c2.y - 8, 'C2', { cls: 'fg-tag', anchor: 'end' });

    s += panel(8, 154, 324, 136);
    s += mchx(80, 200, { lab: 'D', kind: 'warn' }, { lab: 'H' }).s;
    s += lines(178, 180, 22, [['Ha → D', 'fg-lbl'], 'D and CH₃ are both', 'on wedges: the same', 'face of the ring']);
    s += itext(178, 268, [{ i: 'cis' }, ' product'], 'fg-tag-good', 'start');

    s += panel(8, 300, 324, 136);
    s += mchx(80, 346, { lab: 'H' }, { lab: 'D', kind: 'warn' }).s;
    s += lines(178, 326, 22, [['Hb → D', 'fg-lbl'], 'D on a hash, CH₃ on', 'a wedge: opposite', 'faces of the ring']);
    s += itext(178, 414, [{ i: 'trans' }, ' product'], 'fg-tag-warn', 'start');

    s += itext(170, 464, [{ i: 'cis' }, ' and ', { i: 'trans' }, ' are diastereomers,'], 'fg-lbl');
    s += text(170, 486, 'so Ha and Hb are diastereotopic', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Wedges point toward you and hashes away, so two wedged groups sit on the same face of the flat ring. Each product has two new stereocenters, C1 and C2.',
});

/* ------------------------------------------------------------------ propene
   A C=C does the same job: the two =CH2 hydrogens give E and Z products. */
function propene(x, y, up, down, o = {}) {
  // C1 on the left carries `up` (up-left) and `down` (down-left); C2 carries
  // CH3 up-right and H down-right.
  const c1 = P(x, y), c2 = P(x + 52, y);
  let s = bond(c1, c2, { order: 2, rFrom: 15, rTo: 15 });
  const u = armEnd(c1, 120, 42), d = armEnd(c1, 240, 42), me = armEnd(c2, 60, 46), h = armEnd(c2, 300, 42);
  s += bond(c1, u, { rFrom: 15, rTo: 12 }) + atom(u.x, u.y, up.lab, { r: 12, kind: up.kind, size: up.size });
  s += bond(c1, d, { rFrom: 15, rTo: 12 }) + atom(d.x, d.y, down.lab, { r: 12, kind: down.kind, size: down.size });
  s += bond(c2, me, { rFrom: 15, rTo: 17 }) + atom(me.x, me.y, 'CH₃', { r: 17, size: 9.5 });
  s += bond(c2, h, { rFrom: 15, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
  s += atom(c1.x, c1.y, 'C') + atom(c2.x, c2.y, 'C');
  if (o.hi) {
    const hp = o.hi === 'up' ? u : d;
    s += text(hp.x, o.hi === 'up' ? hp.y - 18 : hp.y + 28, 'higher', { cls: 'fg-tag-good' });
    s += text(me.x + 20, me.y + 4, 'higher', { cls: 'fg-tag-good', anchor: 'start' });
  }
  return s;
}
FIGURES.push({
  id: 'propene-ez',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 474',
  alt: 'Propene with every atom labeled: the left carbon of the double bond carries Ha on the upper side and Hb on the lower side; the right carbon carries CH3 on the upper side and H on the lower side. Replacing Ha with D puts D and CH3, the higher-priority group on each carbon, on the same side: Z. Replacing Hb with D puts them on opposite sides: E. E and Z isomers are diastereomers, so Ha and Hb are diastereotopic.',
  build() {
    let s = '';
    s += text(170, 16, 'propene: no stereocenter', { cls: 'fg-tag' });
    s += propene(144, 82, { lab: 'Ha', size: 10.5 }, { lab: 'Hb', size: 10.5 });

    s += panel(8, 136, 324, 136);
    s += propene(64, 206, { lab: 'D', kind: 'warn' }, { lab: 'H' }, { hi: 'up' });
    s += lines(212, 180, 22, [['Ha → D', 'fg-lbl'], 'higher groups on', 'the same side:', ['Z', 'fg-tag-good']]);

    s += panel(8, 282, 324, 136);
    s += propene(64, 346, { lab: 'H' }, { lab: 'D', kind: 'warn' }, { hi: 'down' });
    s += lines(212, 320, 22, [['Hb → D', 'fg-lbl'], 'higher groups on', 'opposite sides:', ['E', 'fg-tag-warn']]);

    s += text(170, 446, 'E and Z are diastereomers,', { cls: 'fg-lbl' });
    s += text(170, 466, 'so Ha and Hb are diastereotopic', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'On each carbon of the double bond the higher-priority group is tagged: D outranks H on the left carbon, and CH₃ outranks H on the right one.',
});

/* ---------------------------------------------------------------- pro-R/S
   Naming the two hydrogens of ethanol: promote one, assign, read the name. */
FIGURES.push({
  id: 'pro-r-pro-s',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 360',
  alt: 'Ethanol C1 drawn twice in the same orientation, OH up, CH3 lower left, one H on a wedge and one on a hash at the lower right. First drawing: promote the hashed H, so the priorities are OH 1, CH3 2, hashed H 3, wedged H 4. Priority 4 points at you, and 1 to 2 to 3 runs counterclockwise, so the reading flips to R: the hashed H is pro-R. Second drawing: promote the wedged H instead, so the hashed H is 4 and points away; the trace is counterclockwise, S: the wedged H is pro-S.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 150, { kind: 'warn' });
    s += ethanolCenter(P(92, 84), { lab: 'H' }, { lab: 'H', kind: 'warn' }, { sweepTo: 292, pri: [4, 3] });
    s += lines(178, 32, 20, [
      ['name the hashed H', 'fg-lbl'],
      'Promote it: it is 3,',
      'its twin is 4.',
      '4 points at you:',
      'counterclockwise',
      'flips to R,',
      ['so it is pro-R', 'fg-tag-warn'],
    ]);

    s += panel(8, 168, 324, 150, { kind: 'good' });
    s += ethanolCenter(P(92, 244), { lab: 'H', kind: 'hi' }, { lab: 'H' }, { sweepTo: 330, pri: [3, 4] });
    s += lines(178, 192, 20, [
      ['name the wedged H', 'fg-lbl'],
      'Promote it: it is 3,',
      'its twin is 4.',
      '4 points away:',
      'counterclockwise',
      'reads S,',
      ['so it is pro-S', 'fg-tag-good'],
    ]);
    s += text(170, 342, 'The hashed H is pro-R; the wedged H is pro-S.', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The highlighted hydrogen in each drawing is the one being named. Promoting the other hydrogen swaps priorities 3 and 4, and that always reverses the answer.',
});

/* ------------------------------------------------------------- Re and Si
   Acetaldehyde seen from each side of its plane. */
function acetaldehyde(c, meDeg, hDeg, o = {}) {
  let s = '';
  const oa = armEnd(c, 90, 46);
  s += bond(c, oa, { order: 2, rFrom: 16, rTo: 15 });
  s += lonePair(oa.x, oa.y, -150);
  s += lonePair(oa.x, oa.y, -30);
  s += atom(oa.x, oa.y, 'O', { kind: 'hi' });
  s += arm(c, meDeg, 50, 'CH₃');
  s += arm(c, hDeg, 42, 'H', { r: 12 });
  if (o.sweep) s += sweep(c, 27, 76, o.sweep.to, o.sweep.cw);
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  if (o.pri) {
    const me = armEnd(c, meDeg, 50), h = armEnd(c, hDeg, 42);
    s += pri(oa.x + 30, oa.y - 6, 1);
    s += pri(me.x + (me.x > c.x ? 6 : -6), me.y + 32, 2);
    s += pri(h.x + (h.x > c.x ? 6 : -6), h.y + 26, 3);
  }
  return s;
}
FIGURES.push({
  id: 're-si-faces',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 338',
  alt: 'Acetaldehyde drawn flat, with priorities O 1, CH3 2, H 3. Seen from the front, with O up, CH3 lower right and H lower left, 1 to 2 to 3 runs clockwise: the Re face. Seen from behind, the same molecule shows CH3 lower left and H lower right, and 1 to 2 to 3 runs counterclockwise: the Si face.',
  build() {
    let s = '';
    s += panel(8, 8, 324, 150, { kind: 'good' });
    s += acetaldehyde(P(96, 86), 330, 210, { sweep: { to: 214, cw: true }, pri: true });
    s += lines(186, 38, 22, [
      ['from the front', 'fg-lbl'],
      '1 = O, 2 = CH₃, 3 = H',
      '1→2→3 runs clockwise:',
      ['the Re face', 'fg-tag-good'],
    ]);

    s += panel(8, 168, 324, 150, { kind: 'warn' });
    s += acetaldehyde(P(96, 246), 210, 330, { sweep: { to: 326, cw: false }, pri: true });
    s += lines(186, 198, 22, [
      ['from behind', 'fg-lbl'],
      'the same molecule,',
      'turned over:',
      'counterclockwise:',
      ['the Si face', 'fg-tag-warn'],
    ]);
    s += text(170, 334, 'One face of the plane is Re, the other Si.', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Turning the molecule over to look at the back face moves CH₃ and H to opposite sides of the drawing, so the same three priorities trace the other way.',
});

/* ------------------------------------------------------ attack on each face
   A nucleophile adding to either face of acetaldehyde gives the two
   enantiomers of the product. */
function adduct(c, nuType) {
  let s = '';
  s += arm(c, 90, 42, 'O⁻', { kind: 'hi', size: 10.5 });
  s += arm(c, 335, 50, 'CH₃');
  s += arm(c, 205, 42, 'H', { r: 12 });
  s += arm(c, 270, 54, 'Nu', { type: nuType, kind: 'warn', size: 10.5 });
  s += atom(c.x, c.y, 'C', { kind: 'hi' });
  return s;
}
FIGURES.push({
  id: 'face-attack',
  section: 'prochirality',
  lessons: ['prochirality'],
  viewBox: '0 0 340 404',
  alt: 'Acetaldehyde flat in the page, O up, CH3 lower right, H lower left, with the Re face toward you. A nucleophile adding from the front, the Re face, gives a product with Nu on a wedge. A nucleophile adding from behind, the Si face, gives the product with Nu on a hash. The three original groups keep their places in both, so the two products are mirror images, and with an achiral nucleophile they form 50 to 50.',
  build() {
    let s = '';
    s += text(170, 16, 'acetaldehyde, Re face toward you', { cls: 'fg-tag' });
    s += acetaldehyde(P(170, 96), 330, 210);
    s += arrow(P(128, 150), P(90, 188));
    s += arrow(P(212, 150), P(250, 188));
    s += text(84, 152, 'Nu⁻ from', { cls: 'fg-tag', anchor: 'end' });
    s += text(84, 170, 'the front', { cls: 'fg-tag', anchor: 'end' });
    s += text(256, 152, 'Nu⁻ from', { cls: 'fg-tag', anchor: 'start' });
    s += text(256, 170, 'behind', { cls: 'fg-tag', anchor: 'start' });

    s += panel(8, 196, 158, 156, { kind: 'good' });
    s += adduct(P(87, 252), 'wedge');
    s += text(87, 340, 'Nu toward you', { cls: 'fg-tag-good' });
    s += panel(174, 196, 158, 156, { kind: 'warn' });
    s += adduct(P(253, 252), 'hash');
    s += text(253, 340, 'Nu away from you', { cls: 'fg-tag-warn' });

    s += text(170, 376, 'mirror images, formed 50 : 50', { cls: 'fg-lbl' });
    s += text(170, 396, 'when nothing chiral is present', { cls: 'fg-tag' });
    return s;
  },
  caption: 'Nu stands for the group the nucleophile brings; if it is anything other than H or CH₃, the carbon ends up with four different groups. Only the bond to Nu changes between the two products.',
});

/* ---------------------------------------------------------------- NMR sketch
   A preview of what diastereotopic hydrogens do to a proton spectrum. */
FIGURES.push({
  id: 'nmr-diastereotopic',
  section: 'prochirality',
  viewBox: '0 0 340 298',
  alt: 'Two sketched proton NMR traces. Top: if the two hydrogens of a CH2 were equivalent, they would give one signal. Bottom: diastereotopic hydrogens Ha and Hb can give two signals at different positions, and each is split into two lines because the two hydrogens split each other.',
  build() {
    let s = '';
    const peak = (x, h, base, cls) =>
      `<path class="${cls}" fill="none" d="M${x - 12} ${base} Q${x - 4} ${base} ${x} ${base - h} Q${x + 4} ${base} ${x + 12} ${base}"></path>`;
    s += text(170, 16, 'a preview of ¹H NMR', { cls: 'fg-tag' });
    s += rule(20, 118, 320, 118);
    s += peak(170, 70, 118, 'fg-bond-soft');
    s += text(170, 140, 'if Ha and Hb were equivalent:', { cls: 'fg-tag' });
    s += text(170, 158, 'one signal', { cls: 'fg-tag' });

    s += rule(20, 250, 320, 250);
    for (const x of [100, 240]) {
      s += peak(x - 7, 56, 250, 'fg-bond-hi');
      s += peak(x + 7, 56, 250, 'fg-bond-hi');
    }
    s += text(100, 184, 'Ha', { cls: 'fg-tag-warn' });
    s += text(240, 184, 'Hb', { cls: 'fg-tag-warn' });
    s += text(170, 272, 'diastereotopic: two positions,', { cls: 'fg-tag-warn' });
    s += text(170, 288, 'and each split by the other', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Each diastereotopic hydrogen gives its own signal, drawn here split into two lines by its partner.',
});

export default FIGURES;
