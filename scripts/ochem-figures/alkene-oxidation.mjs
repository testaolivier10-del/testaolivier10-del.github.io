/* Figures for the alkene-oxidation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   The page sits in Alkenes & Alkynes, after skeletal structures, so carbon
   chains and rings are drawn skeletally. Oxygen that a reagent brings in is
   highlighted (fg-atom-hi) in every drawing, so where each oxygen went can
   be read straight off the figure.

   Most figures are 340 wide, stacked in cells, with only fg-lbl and fg-tag
   text, so the same drawing serves the notes page and a lesson step. Three
   are notes only: the peroxyacid comparison, the four butane-2,3-diol cases
   (760 wide) and the ozonolysis mechanism (760 wide). */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, panel, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, ringDouble } from '../lib/ochem-skeletal.mjs';
import { armEnd, skDouble } from '../lib/ochem-helpers.mjs';

const FIGURES = [];
const r2 = (v) => Math.round(v * 100) / 100;

/* ------------------------------------------------------------ helpers --- */

/* A labelled atom, with a disc sized to its label, and a bond that stops at
   the edge of each disc. An empty label is an unlabelled skeletal vertex. */
const rOf = (l) => (l === '' ? 0 : l.length >= 3 ? 18 : l.length === 2 ? 15 : 13);
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: rOf(l), ...o });
const B = (a, b, la, lb, o = {}) => bond(a, b, { rFrom: rOf(la), rTo: rOf(lb), ...o });
const mid = (a, b, t = 0.5) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const charge = (x, y, s) => text(x, y, s, { cls: 'fg-warn', size: 15 });

/* Text with an italic prefix (cis, trans). The kit's text() escapes its
   string, so the tspan is written here. */
const itag = (x, y, ital, rest, o = {}) =>
  `<text class="${o.cls || 'fg-tag'}" x="${r2(x)}" y="${r2(y)}" text-anchor="${o.anchor || 'middle'}" font-size="11">` +
  `<tspan font-style="italic">${ital}</tspan>${rest}</text>`;

/* A dashed line: a mirror plane, or where a bond is cut. */
const dashLine = (a, b, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;

/* A cell: a panel with a title tag at the top. `draw(Q)` gets a point maker
   already shifted to the cell's corner. */
function cell(ox, oy, w, h, title, draw, opts = {}) {
  const Q = (x, y) => P(ox + x, oy + y);
  let s = panel(ox, oy, w, h, opts.kind ? { kind: opts.kind } : {});
  if (title) s += tag(ox + w / 2, oy + 22, title);
  s += draw(Q);
  return s;
}

/* A cyclohexane ring, point at the top. Vertex 5 is upper right and vertex
   4 lower right, so the right-hand edge is the bond that reacts, and its
   two carbons point their new groups out at 30 and -30 degrees. */
const hexagon = (c, r = 30) => polyPts(c.x, c.y, 6, r, 90);
const ringInk = (v, skip = []) => v.map((p, i) => {
  const j = (i + 1) % 6;
  return skip.some(([a, b]) => (a === i && b === j) || (a === j && b === i)) ? '' : sk(p, v[j]);
}).join('');

/* =====================================================================
   1. What a peroxyacid is: a carboxylic acid with one more oxygen, and
   mCPBA as the one the course uses. Notes only. */
FIGURES.push({
  id: 'peroxyacid',
  section: 'alkene-oxidation',
  anchor: '<h3>Epoxidation: one oxygen, ring intact</h3>',
  alt: 'Three stacked panels. A carboxylic acid, R–C(=O)–O–H. A peroxyacid, R–C(=O)–O–O–H, with the outer oxygen highlighted and the O–O bond marked as weak. mCPBA drawn skeletally: a benzene ring carrying a C(=O)OOH group, with a chlorine on the ring one carbon further round.',
  viewBox: '0 0 340 424',
  build() {
    let s = '';
    s += cell(0, 8, 340, 112, 'A CARBOXYLIC ACID', (Q) => {
      const r = Q(56, 92), c = Q(94, 72), o = Q(94, 40), oh = Q(134, 92), h = Q(172, 72);
      return bond(r, c, { rFrom: 13, rTo: 0 }) + B(c, o, '', 'O', { order: 2 }) +
        bond(c, oh, { rFrom: 0, rTo: 13 }) + B(oh, h, 'O', 'H') +
        A(r, 'R') + A(o, 'O') + A(oh, 'O') + A(h, 'H') +
        tag(Q(262, 78).x, Q(262, 78).y, 'R–CO₂H');
    });
    s += cell(0, 128, 340, 136, 'A PEROXYACID: ONE MORE O', (Q) => {
      const r = Q(46, 92), c = Q(84, 72), o = Q(84, 40), oi = Q(124, 92), ot = Q(164, 72), h = Q(202, 92);
      return bond(r, c, { rFrom: 13, rTo: 0 }) + B(c, o, '', 'O', { order: 2 }) +
        bond(c, oi, { rFrom: 0, rTo: 13 }) + B(oi, ot, 'O', 'O', { cls: 'fg-bond-hi' }) + B(ot, h, 'O', 'H') +
        A(r, 'R') + A(o, 'O') + A(oi, 'O') + A(ot, 'O', { kind: 'hi' }) + A(h, 'H') +
        tag(Q(144, 124).x, Q(144, 124).y, 'weak O–O bond', { cls: 'fg-tag-warn' }) +
        tag(Q(172, 46).x, Q(172, 46).y, 'outer O') +
        tag(Q(262, 96).x, Q(262, 96).y, 'R–CO₃H');
    });
    s += cell(0, 272, 340, 144, '', (Q) => {
      const v = hexagon(Q(96, 96), 26);
      let g = '';
      for (let i = 0; i < 6; i++) {
        g += (i % 2 === 0) ? ringDouble(v[i], v[(i + 1) % 6], Q(96, 96), { inset: 7 }) : sk(v[i], v[(i + 1) % 6]);
      }
      const cl = armEnd(v[1], 150, 30);
      const c = armEnd(v[5], 30, 30), o = armEnd(c, 90, 30), oi = armEnd(c, -30, 32), ot = armEnd(oi, 30, 32), h = armEnd(ot, -30, 28);
      g += bond(v[1], cl, { rFrom: 0, rTo: 15 }) + A(cl, 'Cl');
      g += sk(v[5], c) + B(c, o, '', 'O', { order: 2 }) + bond(c, oi, { rFrom: 0, rTo: 13 }) +
        B(oi, ot, 'O', 'O', { cls: 'fg-bond-hi' }) + B(ot, h, 'O', 'H');
      g += A(o, 'O') + A(oi, 'O') + A(ot, 'O', { kind: 'hi' }) + A(h, 'H');
      g += tag(Q(24, 26).x, Q(24, 26).y, 'mCPBA', { anchor: 'start' });
      g += itag(Q(170, 134).x, Q(170, 134).y, 'meta', '-chloroperoxybenzoic acid');
      return g;
    });
    return s;
  },
  caption: 'Put the two acids one above the other and the difference is a single oxygen, inserted between the carbonyl group and the H. In mCPBA the R group is a benzene ring that carries a chlorine.',
});

/* =====================================================================
   2. The epoxidation step with its four curved arrows, on cis-but-2-ene.
   Ar stands for the chlorophenyl ring of mCPBA. */
FIGURES.push({
  id: 'epoxidation-arrows',
  section: 'alkene-oxidation',
  anchor: 'the byproduct is the ordinary carboxylic acid.</p>',
  lessons: ['alkene-oxidation'],
  alt: 'Two stacked panels. Top: mCPBA sits above cis-but-2-ene, its outer O directly over the C=C. Four curved arrows run round a ring: the C=C pi bond to the outer O; the O–O bond to the O–C bond of the acid; the C=O pi bond of the acid to the H; the O–H bond to the second alkene carbon. Bottom: the products, the epoxide with its O bridging both carbons, and the carboxylic acid Ar–CO2H.',
  viewBox: '0 0 340 390',
  build() {
    let s = '';
    s += cell(0, 8, 340, 244, 'ONE STEP, FOUR ARROWS', (Q) => {
      /* The peroxyacid's five ring-forming atoms sit on a pentagon, the
         outer O at the bottom, right over the middle of the C=C. */
      const at = (deg) => Q(170 + 44 * Math.cos((deg * Math.PI) / 180), 106 + 44 * Math.sin((deg * Math.PI) / 180));
      const ot = at(90), h = at(162), oc = at(234), cc = at(306), oi = at(18);
      const ar = armEnd(cc, 50, 36);
      const ca = Q(140, 212), cb = Q(200, 212);
      let g = '';
      g += bond(ca, cb, { order: 2, rFrom: 0, rTo: 0 });
      g += sk(ca, armEnd(ca, 215, 34)) + sk(cb, armEnd(cb, 325, 34));
      g += B(ot, oi, 'O', 'O') + bond(oi, cc, { rFrom: 13, rTo: 0 }) + bond(cc, oc, { order: 2, rFrom: 0, rTo: 13 }) +
        B(ot, h, 'O', 'H') + bond(cc, ar, { rFrom: 0, rTo: 15 });
      g += A(ot, 'O', { kind: 'hi' }) + A(oi, 'O') + A(oc, 'O') + A(h, 'H') + A(ar, 'Ar');
      // 1: the pi bond to the outer O
      g += curve(Q(170, 207), Q(170, 168), { bow: 10, size: 7 });
      // 2: the O–O bond becomes the new C=O of the acid
      g += curve(mid(ot, oi), mid(oi, cc), { bow: -16, size: 7 });
      // 3: the old C=O pi bond picks up the H
      g += curve(mid(cc, oc), mid(oc, h), { bow: 16, size: 7 });
      // 4: the O–H bond becomes the second C–O bond
      g += curve(mid(ot, h), mid(ot, ca, 0.6), { bow: 16, size: 7 });
      const n = (x, y, t) => tag(Q(x, y).x, Q(x, y).y, t, { cls: 'fg-tag-warn' });
      g += n(186, 194, '1') + n(234, 128, '2') + n(142, 46, '3') + n(112, 170, '4');
      g += tag(Q(196, 156).x, Q(196, 156).y, 'outer O', { anchor: 'start' });
      g += tag(Q(236, 84).x, Q(236, 84).y, 'Ar = the ring', { anchor: 'start' });
      g += tag(Q(236, 100).x, Q(236, 100).y, 'of mCPBA', { anchor: 'start' });
      g += itag(Q(170, 238).x, Q(170, 238).y, 'cis', '-but-2-ene');
      return g;
    });
    s += cell(0, 260, 340, 122, 'AFTER THE STEP', (Q) => {
      const a = Q(62, 82), b = Q(112, 82), o = Q(87, 44);
      let g = sk(a, b) + bond(a, o, { rFrom: 0, rTo: 13 }) + bond(b, o, { rFrom: 0, rTo: 13 }) + A(o, 'O', { kind: 'hi' });
      g += sk(a, armEnd(a, 215, 32)) + sk(b, armEnd(b, 325, 32));
      g += text(Q(164, 74).x, Q(164, 74).y, '+', { cls: 'fg-lbl', size: 15 });
      const c = Q(246, 70), oc = Q(246, 38), ar = Q(206, 88), oh = Q(284, 88);
      g += B(c, oc, '', 'O', { order: 2 }) + bond(c, ar, { rFrom: 0, rTo: 15 }) + bond(c, oh, { rFrom: 0, rTo: 15 }) +
        A(oc, 'O') + A(ar, 'Ar') + A(oh, 'OH');
      g += tag(Q(87, 112).x, Q(87, 112).y, 'the epoxide') + tag(Q(246, 112).x, Q(246, 112).y, 'the carboxylic acid');
      return g;
    });
    return s;
  },
  caption: 'Follow the arrows round in order, 1 to 4. The oxygen that ends up in the epoxide is the outer O, and it forms both of its C–O bonds in this one step.',
});

/* =====================================================================
   3. cis and trans but-2-ene: the alkene geometry carried into the
   epoxide. The ring is drawn face on, O at the top; a wedged methyl points
   toward the reader and a hashed one away. */
function butene(a, cis, len = 40) {
  const b = P(a.x + 44, a.y);
  let g = skDouble(a, b, P(a.x + 22, a.y + (cis ? 10 : -10)));
  g += sk(a, armEnd(a, 210, len)) + sk(b, armEnd(b, cis ? 330 : 30, len));
  return g;
}
function epoxide(a, left, right, hiO = true) {
  const b = P(a.x + 50, a.y), o = P(a.x + 25, a.y - 40);
  let g = sk(a, b) + bond(a, o, { rFrom: 0, rTo: 13 }) + bond(b, o, { rFrom: 0, rTo: 13 });
  g += (left === 'w' ? wedge : hash)(a, armEnd(a, 235, 36), { rFrom: 0, rTo: 0, width: 8 });
  g += (right === 'w' ? wedge : hash)(b, armEnd(b, 305, 36), { rFrom: 0, rTo: 0, width: 8 });
  g += A(o, 'O', hiO ? { kind: 'hi' } : {});
  return g;
}
FIGURES.push({
  id: 'epoxide-cis-trans',
  section: 'alkene-oxidation',
  anchor: 'are called <b>stereospecific</b>.</p>',
  lessons: ['alkene-oxidation'],
  alt: 'Two stacked panels. Top: cis-but-2-ene with mCPBA gives the cis epoxide, both methyls on wedges, with a dashed mirror plane through the O and the middle of the C–C bond; it is meso and achiral. Bottom: trans-but-2-ene with mCPBA gives the trans epoxide as two mirror images, one with the left methyl wedged and the right hashed (2R,3R), the other the reverse (2S,3S), in equal amounts.',
  viewBox: '0 0 340 402',
  build() {
    let s = '';
    s += cell(0, 8, 340, 156, '', (Q) => {
      let g = itag(Q(170, 22).x, Q(170, 22).y, 'cis', '-BUT-2-ENE');
      g += butene(Q(50, 84), true);
      g += arrow(Q(134, 80), Q(186, 80)) + tag(Q(160, 68).x, Q(160, 68).y, 'mCPBA');
      g += epoxide(Q(222, 96), 'w', 'w');
      g += dashLine(Q(247, 71), Q(247, 128));
      g += tag(Q(302, 64).x, Q(302, 64).y, 'mirror') + tag(Q(302, 80).x, Q(302, 80).y, 'plane');
      g += tag(Q(170, 146).x, Q(170, 146).y, 'meso: achiral, one compound', { cls: 'fg-tag-good' });
      return g;
    });
    s += cell(0, 172, 340, 222, '', (Q) => {
      let g = itag(Q(170, 22).x, Q(170, 22).y, 'trans', '-BUT-2-ENE');
      g += butene(Q(148, 62), false, 34);
      g += arrow(Q(170, 84), Q(170, 128)) + tag(Q(182, 110).x, Q(182, 110).y, 'mCPBA', { anchor: 'start' });
      g += epoxide(Q(40, 170), 'w', 'h');
      g += epoxide(Q(250, 170), 'h', 'w');
      g += tag(Q(65, 212).x, Q(65, 212).y, '(2R,3R)');
      g += tag(Q(275, 212).x, Q(275, 212).y, '(2S,3S)');
      g += tag(Q(170, 154).x, Q(170, 154).y, 'mirror');
      g += tag(Q(170, 170).x, Q(170, 170).y, 'images');
      g += tag(Q(170, 196).x, Q(170, 196).y, '50 : 50', { cls: 'fg-tag-good' });
      return g;
    });
    return s;
  },
  caption: 'Both methyls start on the same side in the cis alkene, and they stay on the same face of the ring. The trans alkene keeps them apart, so they end up on opposite faces.',
});

/* =====================================================================
   4. The syn route: OsO4 adds to cyclohexene in one step (three arrows),
   the osmate ester holds both oxygens on the front face, and NaHSO3 frees
   the cis diol. */
function osmium(Q, os, oa, ob, oc, od, cOa, cOb) {
  let g = '';
  g += B(oa, os, 'O', 'Os', cOa) + B(ob, os, 'O', 'Os', cOb) +
    B(os, oc, 'Os', 'O', { order: 2 }) + B(os, od, 'Os', 'O', { order: 2 });
  g += A(os, 'Os') + A(oc, 'O') + A(od, 'O');
  return g;
}
FIGURES.push({
  id: 'syn-osmate',
  section: 'alkene-oxidation',
  anchor: 'The result is a <b><i>syn</i> diol</b>.',
  lessons: ['alkene-oxidation'],
  alt: 'Three stacked panels. 1: cyclohexene with OsO4 beside its double bond; three curved arrows: the C=C pi bond to one Os=O oxygen, that Os=O pi bond onto osmium, and a second Os=O pi bond to the other alkene carbon. 2: the osmate ester, a five-membered ring of two carbons, two oxygens and osmium, with both C–O bonds drawn as wedges. 3: after NaHSO3 in water, cis-cyclohexane-1,2-diol with both OH groups on wedges.',
  viewBox: '0 0 340 470',
  build() {
    let s = '';
    s += cell(0, 8, 340, 168, '1   OsO₄ ADDS IN ONE STEP', (Q) => {
      const c = Q(76, 92), v = hexagon(c, 30);
      let g = ringInk(v, [[4, 5]]) + ringDouble(v[4], v[5], c, { inset: 6 });
      const oa = Q(160, 62), ob = Q(160, 122), os = Q(214, 92), oc = Q(260, 62), od = Q(260, 122);
      g += bond(oa, os, { order: 2, rFrom: 13, rTo: 15 }) + bond(ob, os, { order: 2, rFrom: 13, rTo: 15 }) +
        B(os, oc, 'Os', 'O', { order: 2 }) + B(os, od, 'Os', 'O', { order: 2 });
      g += A(oa, 'O', { kind: 'hi' }) + A(ob, 'O', { kind: 'hi' }) + A(os, 'Os') + A(oc, 'O') + A(od, 'O');
      // 1: the C=C pi bond to the upper oxygen
      g += curve(mid(v[4], v[5], 0.3), Q(147, 66), { bow: -14, size: 7 });
      // 2: the upper Os=O pi bond onto osmium
      g += curve(mid(oa, os, 0.4), Q(206, 78), { bow: -12, size: 7 });
      // 3: the lower Os=O pi bond to the lower alkene carbon
      g += curve(mid(ob, os, 0.45), mid(v[4], ob, 0.4), { bow: 16, size: 7 });
      g += tag(Q(170, 156).x, Q(170, 156).y, 'OsO₄ comes at the face toward you');
      return g;
    });
    s += cell(0, 184, 340, 146, '2   THE OSMATE ESTER', (Q) => {
      const c = Q(76, 84), v = hexagon(c, 30);
      let g = ringInk(v);
      const oa = Q(138, 58), ob = Q(138, 110), os = Q(188, 84), oc = Q(236, 58), od = Q(236, 110);
      g += wedge(v[5], oa, { rFrom: 0, rTo: 13, width: 8 }) + wedge(v[4], ob, { rFrom: 0, rTo: 13, width: 8 });
      g += B(oa, os, 'O', 'Os') + B(ob, os, 'O', 'Os') + B(os, oc, 'Os', 'O', { order: 2 }) + B(os, od, 'Os', 'O', { order: 2 });
      g += A(oa, 'O', { kind: 'hi' }) + A(ob, 'O', { kind: 'hi' }) + A(os, 'Os') + A(oc, 'O') + A(od, 'O');
      g += tag(Q(170, 136).x, Q(170, 136).y, 'both C–O bonds on the front face');
      return g;
    });
    s += cell(0, 338, 340, 124, '3   NaHSO₃ IN WATER CUTS OFF THE OSMIUM', (Q) => {
      const c = Q(80, 76), v = hexagon(c, 30);
      let g = ringInk(v);
      const o1 = armEnd(v[5], 30, 34), o2 = armEnd(v[4], -30, 34);
      g += wedge(v[5], o1, { rFrom: 0, rTo: 15, width: 8 }) + wedge(v[4], o2, { rFrom: 0, rTo: 15, width: 8 });
      g += A(o1, 'OH', { kind: 'hi' }) + A(o2, 'OH', { kind: 'hi' });
      g += itag(Q(238, 66).x, Q(238, 66).y, 'cis', '-cyclohexane-');
      g += tag(Q(238, 82).x, Q(238, 82).y, '1,2-diol', { cls: 'fg-tag' });
      g += tag(Q(238, 104).x, Q(238, 104).y, 'both OH toward you', { cls: 'fg-tag-good' });
      return g;
    });
    return s;
  },
  caption: 'Both oxygens come from the same OsO₄ molecule, so they join the ring on the same face and stay there until the osmium is removed.',
});

/* =====================================================================
   5. The anti route: epoxide on one face, protonated, opened by water from
   the other face, giving the trans diol. */
FIGURES.push({
  id: 'anti-opening',
  section: 'alkene-oxidation',
  anchor: 'an <b><i>anti</i> diol</b>.',
  lessons: ['alkene-oxidation'],
  alt: 'Three stacked panels. 1: the epoxide of cyclohexene, its O bridging the two carbons on wedges, toward the reader. 2: the O is protonated; a water molecule below the lower carbon attacks it from the back face, with one curved arrow from the water lone pair to that carbon and one from the breaking C–O bond to the positive oxygen. 3: trans-cyclohexane-1,2-diol, one OH on a wedge and the other on a hash.',
  viewBox: '0 0 340 502',
  build() {
    let s = '';
    s += cell(0, 8, 340, 138, '1   mCPBA PUTS ONE O ON THE FRONT FACE', (Q) => {
      const c = Q(96, 82), v = hexagon(c, 30);
      let g = ringInk(v);
      const o = Q(158, 82);
      g += wedge(v[5], o, { rFrom: 0, rTo: 13, width: 8 }) + wedge(v[4], o, { rFrom: 0, rTo: 13, width: 8 });
      g += A(o, 'O', { kind: 'hi' });
      g += tag(Q(250, 76).x, Q(250, 76).y, 'the epoxide O') + tag(Q(250, 92).x, Q(250, 92).y, 'points toward you');
      return g;
    });
    s += cell(0, 154, 340, 200, '2   H⁺ ON THE O, THEN WATER FROM THE BACK', (Q) => {
      const c = Q(70, 88), v = hexagon(c, 30);
      let g = ringInk(v);
      const o = Q(152, 88), h = Q(194, 88), w = Q(146, 156);
      g += wedge(v[5], o, { rFrom: 0, rTo: 13, width: 8 }) + wedge(v[4], o, { rFrom: 0, rTo: 13, width: 8 });
      g += B(o, h, 'O', 'H') + A(o, 'O', { kind: 'hi' }) + A(h, 'H') + charge(Q(162, 70).x, Q(162, 70).y, '+');
      g += A(w, 'H₂O');
      g += lonePair(w.x, w.y, 228, { dist: 24 });
      // water's lone pair to the lower ring carbon; the C–O bond onto O+
      g += curve(Q(124, 132), Q(100, 110), { bow: -10, size: 7 });
      g += curve(mid(v[4], o, 0.5), Q(146, 101), { bow: 14, size: 7 });
      g += tag(Q(258, 134).x, Q(258, 134).y, 'water attacks from');
      g += tag(Q(258, 150).x, Q(258, 150).y, 'the back, opposite');
      g += tag(Q(258, 166).x, Q(258, 166).y, 'the C–O that breaks');
      return g;
    });
    s += cell(0, 362, 340, 132, '3   LOSS OF H⁺ GIVES THE DIOL', (Q) => {
      const c = Q(80, 78), v = hexagon(c, 30);
      let g = ringInk(v);
      const o1 = armEnd(v[5], 30, 34), o2 = armEnd(v[4], -30, 34);
      g += wedge(v[5], o1, { rFrom: 0, rTo: 15, width: 8 }) + hash(v[4], o2, { rFrom: 0, rTo: 15, width: 9 });
      g += A(o1, 'OH', { kind: 'hi' }) + A(o2, 'OH', { kind: 'hi' });
      g += itag(Q(238, 66).x, Q(238, 66).y, 'trans', '-cyclohexane-');
      g += tag(Q(238, 82).x, Q(238, 82).y, '1,2-diol');
      g += tag(Q(238, 104).x, Q(238, 104).y, 'one OH toward you,', { cls: 'fg-tag-good' });
      g += tag(Q(238, 120).x, Q(238, 120).y, 'one away', { cls: 'fg-tag-good' });
      return g;
    });
    return s;
  },
  caption: 'The first oxygen stays on the face where mCPBA put it. Water can only reach the carbon from the other face, so the second OH ends up there.',
});

/* =====================================================================
   6. The four but-2-ene cases, drawn in the frame of the alkene: each
   carbon keeps its CH3 and H where the alkene had them, and the new OH
   points toward the reader (wedge) or away (hash). Notes only. */
function frameAlkene(a, cis) {
  const b = P(a.x + 44, a.y);
  const m1 = armEnd(a, 120, 34), h1 = armEnd(a, 240, 30);
  const m2 = armEnd(b, cis ? 60 : 300, 34), h2 = armEnd(b, cis ? 300 : 60, 30);
  return bond(a, b, { order: 2, rFrom: 0, rTo: 0 }) +
    bond(a, m1, { rFrom: 0, rTo: 18 }) + bond(a, h1, { rFrom: 0, rTo: 11 }) +
    bond(b, m2, { rFrom: 0, rTo: 18 }) + bond(b, h2, { rFrom: 0, rTo: 11 }) +
    A(m1, 'CH₃') + A(h1, 'H', { r: 11 }) + A(m2, 'CH₃') + A(h2, 'H', { r: 11 });
}
function frameDiol(a, cis, oh2, oh3) {
  const b = P(a.x + 44, a.y);
  const m1 = armEnd(a, 110, 34), h1 = armEnd(a, 250, 30), o1 = armEnd(a, 180, 31);
  const m2 = armEnd(b, cis ? 70 : 290, 34), h2 = armEnd(b, cis ? 290 : 70, 30), o2 = armEnd(b, 0, 31);
  const st = (k, p, q) => (k === 'w' ? wedge : hash)(p, q, { rFrom: 0, rTo: 15, width: k === 'w' ? 8 : 9 });
  return sk(a, b) +
    bond(a, m1, { rFrom: 0, rTo: 18 }) + bond(a, h1, { rFrom: 0, rTo: 11 }) + st(oh2, a, o1) +
    bond(b, m2, { rFrom: 0, rTo: 18 }) + bond(b, h2, { rFrom: 0, rTo: 11 }) + st(oh3, b, o2) +
    A(m1, 'CH₃') + A(h1, 'H', { r: 11 }) + A(o1, 'OH', { kind: 'hi' }) +
    A(m2, 'CH₃') + A(h2, 'H', { r: 11 }) + A(o2, 'OH', { kind: 'hi' });
}
FIGURES.push({
  id: 'butanediol-four-cases',
  section: 'alkene-oxidation',
  anchor: '</tbody>\n</table>\n</div>',
  alt: 'A two-by-two grid. Rows: cis-but-2-ene and trans-but-2-ene, each drawn with its two CH3 groups and two H atoms. Columns: OsO4 (syn) and mCPBA then H3O+ (anti). Each product keeps the alkene frame and adds one OH to each carbon, on a wedge or a hash. cis with syn: both OH on wedges, a mirror plane between the carbons, meso. cis with anti: one wedge and one hash, drawn with its mirror image, (2R,3R) and (2S,3S), racemic. trans with syn: both wedges, and its mirror image with both hashes, (2S,3S) and (2R,3R), racemic. trans with anti: one wedge and one hash, meso.',
  viewBox: '0 0 760 452',
  build() {
    let s = '';
    const cols = [[6, 146], [158, 296], [460, 296]];
    s += tag(76, 22, 'ALKENE');
    s += tag(158 + 148, 22, 'OsO₄, NMO   (syn)');
    s += tag(460 + 148, 22, 'mCPBA, then H₃O⁺   (anti)');
    const rows = [[34, true], [244, false]];
    for (const [y, cis] of rows) {
      for (const [x, w] of cols) s += panel(x, y, w, 202);
      s += itag(76, y + 26, cis ? 'cis' : 'trans', '-but-2-ene');
      s += frameAlkene(P(54, y + 106), cis);
      // the syn column
      if (cis) {
        s += frameDiol(P(284, y + 100), true, 'w', 'w');
        s += dashLine(P(306, y + 44), P(306, y + 150));
        s += tag(372, y + 58, 'mirror plane', { anchor: 'start' });
        s += text(306, y + 172, 'meso (2R,3S): achiral, one compound', { cls: 'fg-tag-good', size: 11 });
        s += text(306, y + 190, 'both faces of attack give this same molecule', { cls: 'fg-sm' });
      } else {
        s += frameDiol(P(206, y + 100), false, 'w', 'w');
        s += frameDiol(P(352, y + 100), false, 'h', 'h');
        s += tag(228, y + 162, '(2S,3S)') + tag(374, y + 162, '(2R,3R)');
        s += text(306, y + 188, 'racemic (±): mirror images, 50 : 50', { cls: 'fg-tag-good', size: 11 });
      }
      // the anti column
      if (cis) {
        s += frameDiol(P(510, y + 100), true, 'w', 'h');
        s += frameDiol(P(656, y + 100), true, 'h', 'w');
        s += tag(532, y + 162, '(2S,3S)') + tag(678, y + 162, '(2R,3R)');
        s += text(608, y + 188, 'racemic (±): mirror images, 50 : 50', { cls: 'fg-tag-good', size: 11 });
      } else {
        s += frameDiol(P(586, y + 100), false, 'w', 'h');
        s += text(608, y + 172, 'meso (2R,3S): achiral, one compound', { cls: 'fg-tag-good', size: 11 });
        s += text(608, y + 190, 'both faces of attack give this same molecule', { cls: 'fg-sm' });
      }
    }
    return s;
  },
  caption: 'Each product keeps the alkene’s CH₃ and H groups where they were, and adds one OH to each carbon, toward you (wedge) or away from you (hash).',
});

/* =====================================================================
   7. The ozonolysis mechanism, in four panels. Notes only. The pentagon is
   the same five positions in panels 2 to 4: v0 top, then clockwise. */
const pent = (cx, cy, r = 46) => [-90, -18, 54, 126, 198].map((d) => {
  const a = (d * Math.PI) / 180;
  return P(cx + r * Math.cos(a), cy + r * Math.sin(a));
});
const shift = (p, dx) => P(p.x + dx, p.y);
FIGURES.push({
  id: 'ozonolysis-mechanism',
  section: 'alkene-oxidation',
  anchor: 'and <i>that</i> is why the workup, not the ozone, decides the answer.</p>',
  alt: 'Ozonolysis in four panels, with curved arrows. 1: ozone, drawn O-minus, O-plus, O, sits over an alkene R2C=CR2; three arrows: the O-minus lone pair to the left carbon, the C=C pi bond to the right-hand oxygen, and the O=O pi bond onto the central O-plus. 2: the molozonide, a five-membered ring C–C–O–O–O; three arrows: an oxygen lone pair forms a C=O+ bond, the C–C bond becomes a C=O bond, and an O–O bond breaks onto the middle oxygen. 3: the two pieces, a carbonyl compound and a carbonyl oxide, rejoin the other way round with three arrows. 4: the ozonide, a five-membered ring C–O–C–O–O in which the two former alkene carbons are no longer bonded to each other.',
  viewBox: '0 0 760 476',
  build() {
    let s = '';
    // ---- 1 ----
    s += panel(6, 34, 360, 206) + tag(186, 24, '1   OZONE ADDS ACROSS THE C=C IN ONE STEP');
    {
      const c1 = P(132, 188), c2 = P(234, 188);
      const o1 = P(132, 116), o2 = P(183, 80), o3 = P(234, 116);
      s += bond(c1, c2, { order: 2, rFrom: 18, rTo: 18 });
      s += B(o1, o2, 'O⁻', 'O⁺') + B(o2, o3, 'O⁺', 'O', { order: 2 });
      s += A(c1, 'R₂C') + A(c2, 'CR₂') + A(o1, 'O⁻', { kind: 'hi' }) + A(o2, 'O⁺', { kind: 'hi' }) + A(o3, 'O', { kind: 'hi' });
      s += lonePair(o1.x, o1.y, 90, { dist: 22 });
      s += curve(P(132, 144), P(132, 168), { bow: -12, size: 7 });
      s += curve(P(190, 184), P(226, 134), { bow: 14, size: 7 });
      s += curve(mid(o2, o3, 0.5), P(197, 72), { bow: 16, size: 7 });
      s += text(186, 228, 'both new C–O bonds form at once', { cls: 'fg-sm' });
    }
    s += arrow(P(370, 136), P(390, 136));
    // ---- 2 ----
    s += panel(394, 34, 360, 206) + tag(574, 24, '2   THE MOLOZONIDE SPLITS IN TWO');
    {
      const [v0, v1, v2, v3, v4] = pent(574, 136, 50);
      // C1 = v3, C2 = v2, O1 = v4, O2 = v0, O3 = v1
      s += B(v3, v2, 'R₂C', 'CR₂') + B(v2, v1, 'CR₂', 'O') + B(v1, v0, 'O', 'O') + B(v0, v4, 'O', 'O') + B(v4, v3, 'O', 'R₂C');
      s += A(v3, 'R₂C') + A(v2, 'CR₂') + A(v4, 'O', { kind: 'hi' }) + A(v0, 'O', { kind: 'hi' }) + A(v1, 'O', { kind: 'hi' });
      s += lonePair(v1.x, v1.y, 0, { dist: 21 });
      s += curve(P(v1.x + 24, v1.y + 8), mid(v1, v2), { bow: -12, size: 7 });
      s += curve(mid(v3, v2), mid(v3, v4), { bow: 18, size: 7 });
      s += curve(mid(v4, v0), P(v0.x - 15, v0.y - 5), { bow: -14, size: 7 });
      s += text(574, 222, 'molozonide (a 1,2,3-trioxolane)', { cls: 'fg-tag' });
    }
    // ---- 3 ----
    s += panel(6, 262, 360, 206) + tag(186, 252, '3   THE PIECES REJOIN THE OTHER WAY ROUND');
    {
      const [v0, v1, v2, v3, v4] = pent(186, 360, 50);
      // ozonide positions: O1 = v0, C2 = v1, O3 = v2, O2 = v3, C1 = v4
      const o1 = shift(v0, -30), c1 = shift(v4, -30);
      const c2 = shift(v1, 30), o3 = shift(v2, 30), o2 = shift(v3, 30);
      s += B(c1, o1, 'R₂C', 'O', { order: 2 });
      s += B(c2, o3, 'CR₂', 'O⁺', { order: 2 }) + B(o3, o2, 'O⁺', 'O⁻');
      s += A(c1, 'R₂C') + A(o1, 'O', { kind: 'hi' }) + A(c2, 'CR₂') + A(o3, 'O⁺', { kind: 'hi' }) + A(o2, 'O⁻', { kind: 'hi' });
      s += lonePair(o2.x, o2.y, 200, { dist: 22 });
      s += curve(P(o2.x - 26, o2.y - 2), P(c1.x + 10, c1.y + 16), { bow: -12, size: 7 });
      s += curve(mid(c1, o1), mid(o1, c2), { bow: 18, size: 7 });
      s += curve(mid(c2, o3), P(o3.x + 16, o3.y - 2), { bow: -18, size: 7 });
      s += text(132, 446, 'a carbonyl compound', { cls: 'fg-sm' });
      s += text(262, 446, 'a carbonyl oxide', { cls: 'fg-sm' });
    }
    s += arrow(P(370, 364), P(390, 364));
    // ---- 4 ----
    s += panel(394, 262, 360, 206) + tag(574, 252, '4   THE OZONIDE: IN THE FLASK UNTIL THE WORKUP');
    {
      const [v0, v1, v2, v3, v4] = pent(574, 360, 50);
      s += B(v4, v0, 'R₂C', 'O') + B(v0, v1, 'O', 'CR₂') + B(v1, v2, 'CR₂', 'O') + B(v2, v3, 'O', 'O') + B(v3, v4, 'O', 'R₂C');
      s += A(v4, 'R₂C', { kind: 'warn' }) + A(v1, 'CR₂', { kind: 'warn' }) +
        A(v0, 'O', { kind: 'hi' }) + A(v2, 'O', { kind: 'hi' }) + A(v3, 'O', { kind: 'hi' });
      s += text(574, 438, 'ozonide (a 1,2,4-trioxolane)', { cls: 'fg-tag' });
      s += text(574, 456, 'the two old alkene carbons no longer share a bond', { cls: 'fg-sm' });
    }
    return s;
  },
  caption: 'Three arrows in each of the first three panels. After step 1 the C–C bond is still there; after step 2 it is gone; step 3 closes the ring that the workup then opens.',
  note: 'The numbers in the ring names say where the oxygens are. The <b>molozonide</b> is a 1,2,3-trioxolane: three oxygens in a row, with the old C&ndash;C bond still intact, and it is too strained to last. The <b>ozonide</b> is a 1,2,4-trioxolane: the two carbons are joined only through oxygen, one O on one side and an O&ndash;O pair on the other.',
});

/* =====================================================================
   8. The two workups on 2-methylbut-2-ene. */
function methylbutene(Q, x, y) {
  const c2 = Q(x, y), c3 = Q(x + 44, y);
  const h = armEnd(c3, 60, 30);
  return {
    ink: bond(c2, c3, { order: 2, rFrom: 0, rTo: 0 }) + sk(c2, armEnd(c2, 150, 34)) + sk(c2, armEnd(c2, 210, 34)) +
      sk(c3, armEnd(c3, 300, 34)) + bond(c3, h, { rFrom: 0, rTo: 11 }) + A(h, 'H', { r: 11, kind: 'hi' }),
    c2, c3,
  };
}
const propanone = (c) => sk(c, armEnd(c, 210, 34)) + sk(c, armEnd(c, 330, 34)) +
  bond(c, P(c.x, c.y - 32), { order: 2, rFrom: 0, rTo: 13 }) + A(P(c.x, c.y - 32), 'O', { kind: 'hi' });
const ethanal = (c) => sk(c, armEnd(c, 210, 34)) + bond(c, armEnd(c, 330, 30), { rFrom: 0, rTo: 11 }) + A(armEnd(c, 330, 30), 'H', { r: 11 }) +
  bond(c, P(c.x, c.y - 32), { order: 2, rFrom: 0, rTo: 13 }) + A(P(c.x, c.y - 32), 'O', { kind: 'hi' });
const ethanoic = (c) => sk(c, armEnd(c, 210, 34)) + bond(c, armEnd(c, 330, 34), { rFrom: 0, rTo: 15 }) + A(armEnd(c, 330, 34), 'OH', { kind: 'hi' }) +
  bond(c, P(c.x, c.y - 32), { order: 2, rFrom: 0, rTo: 13 }) + A(P(c.x, c.y - 32), 'O', { kind: 'hi' });
FIGURES.push({
  id: 'ozonolysis-workups',
  section: 'alkene-oxidation',
  anchor: 'Ketones, having no hydrogen to lose, are unaffected.</li>\n</ul>',
  lessons: ['alkene-oxidation'],
  alt: 'Three stacked panels. 1: 2-methylbut-2-ene drawn skeletally, with a dashed cut through the double bond; the left alkene carbon carries two methyls and no H, the right one carries one methyl and one H. 2: O3 then Me2S gives propanone and ethanal. 3: O3 then H2O2 gives propanone and ethanoic acid.',
  viewBox: '0 0 340 416',
  build() {
    let s = '';
    s += cell(0, 8, 340, 136, '2-METHYLBUT-2-ENE', (Q) => {
      const m = methylbutene(Q, 148, 86);
      let g = m.ink;
      g += dashLine(Q(170, 50), Q(170, 124), 'fg-dash');
      g += tag(Q(92, 122).x, Q(92, 122).y, 'no H here');
      g += tag(Q(226, 58).x, Q(226, 58).y, 'one H here', { anchor: 'start' });
      g += tag(Q(170, 42).x, Q(170, 42).y, 'O₃ cuts here');
      return g;
    });
    s += cell(0, 152, 340, 124, 'THEN Me₂S: REDUCTIVE WORKUP', (Q) => {
      let g = propanone(Q(90, 74)) + text(Q(170, 72).x, Q(170, 72).y, '+', { cls: 'fg-lbl', size: 15 }) + ethanal(Q(236, 74));
      g += tag(Q(90, 114).x, Q(90, 114).y, 'propanone') + tag(Q(236, 114).x, Q(236, 114).y, 'ethanal');
      return g;
    });
    s += cell(0, 284, 340, 124, 'THEN H₂O₂: OXIDATIVE WORKUP', (Q) => {
      let g = propanone(Q(90, 72)) + text(Q(170, 70).x, Q(170, 70).y, '+', { cls: 'fg-lbl', size: 15 }) + ethanoic(Q(236, 72));
      g += tag(Q(90, 116).x, Q(90, 116).y, 'propanone, again') + tag(Q(236, 116).x, Q(236, 116).y, 'ethanoic acid');
      return g;
    });
    return s;
  },
  caption: 'Each alkene carbon becomes a C=O. The carbon with no H can only become a ketone. The carbon with an H becomes an aldehyde, and peroxide takes that aldehyde on to the acid.',
});

/* =====================================================================
   9. A ring alkene opens instead of splitting: cyclohexene to hexanedial.
   Notes only. */
FIGURES.push({
  id: 'cyclohexene-ozonolysis',
  section: 'alkene-oxidation',
  anchor: 'the signature of a symmetric acyclic one.</p>',
  lessons: ['alkene-oxidation'],
  alt: 'Cyclohexene, with its C=C highlighted, goes with O3 then Me2S to hexanedial, drawn as the same ring of carbons opened at the old double bond: the two former alkene carbons have moved apart and each now carries a C=O and an H.',
  viewBox: '0 0 340 184',
  build() {
    let s = '';
    s += cell(0, 8, 340, 168, '', (Q) => {
      const c = Q(62, 80), v = hexagon(c, 30);
      let g = ringInk(v, [[4, 5]]) + ringDouble(v[4], v[5], c, { inset: 6, cls: 'fg-bond-hi' });
      g += arrow(Q(112, 80), Q(160, 80)) + tag(Q(136, 66).x, Q(136, 66).y, 'O₃, then') + tag(Q(136, 104).x, Q(136, 104).y, 'Me₂S');
      const c2 = Q(222, 80), w = hexagon(c2, 30);
      const top = P(w[5].x + 8, w[5].y - 12), bot = P(w[4].x + 8, w[4].y + 12);
      g += sk(w[0], w[1]) + sk(w[1], w[2]) + sk(w[2], w[3]) + sk(w[0], top) + sk(w[3], bot);
      const o1 = armEnd(top, 20, 30), h1 = armEnd(top, 110, 24);
      const o2 = armEnd(bot, -20, 30), h2 = armEnd(bot, 250, 24);
      g += bond(top, o1, { order: 2, rFrom: 0, rTo: 13 }) + bond(top, h1, { rFrom: 0, rTo: 11 }) +
        bond(bot, o2, { order: 2, rFrom: 0, rTo: 13 }) + bond(bot, h2, { rFrom: 0, rTo: 11 });
      g += A(o1, 'O', { kind: 'hi' }) + A(o2, 'O', { kind: 'hi' }) + A(h1, 'H', { r: 11 }) + A(h2, 'H', { r: 11 });
      g += tag(Q(62, 148).x, Q(62, 148).y, 'cyclohexene');
      g += tag(Q(236, 148).x, Q(236, 148).y, 'hexanedial: one molecule');
      return g;
    });
    return s;
  },
  caption: 'The cut goes through the highlighted double bond. The other four ring carbons still hold the two ends together, so one molecule comes out, with a CHO group at each end.',
});

/* =====================================================================
   10. Reading a cleavage backwards: propanal and propanone rejoined. */
FIGURES.push({
  id: 'ozonolysis-backwards',
  section: 'alkene-oxidation',
  anchor: 'one carbon bore a hydrogen, the other did not.</p>',
  lessons: ['alkene-oxidation'],
  alt: 'Two stacked panels. 1: propanal and propanone drawn with their C=O groups facing each other, both oxygens highlighted to be removed. 2: the two carbonyl carbons joined by a C=C, giving 2-methylpent-2-ene, C6H12.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    s += cell(0, 8, 340, 138, 'THE FRAGMENTS', (Q) => {
      const a = Q(40, 88), b = Q(70, 70), c = Q(100, 88);
      const o = Q(136, 88), h = armEnd(c, 270, 28);
      let g = sk(a, b) + sk(b, c) + bond(c, o, { order: 2, rFrom: 0, rTo: 13 }) + bond(c, h, { rFrom: 0, rTo: 11 });
      g += A(o, 'O', { kind: 'warn' }) + A(h, 'H', { r: 11 });
      const k = Q(240, 88), ok = Q(204, 88);
      g += bond(k, ok, { order: 2, rFrom: 0, rTo: 13 }) + sk(k, armEnd(k, 60, 34)) + sk(k, armEnd(k, 300, 34));
      g += A(ok, 'O', { kind: 'warn' });
      g += tag(Q(84, 40).x, Q(84, 40).y, 'propanal') + tag(Q(250, 40).x, Q(250, 40).y, 'propanone');
      g += tag(Q(170, 128).x, Q(170, 128).y, 'remove both O', { cls: 'fg-tag-warn' });
      return g;
    });
    s += cell(0, 154, 340, 138, 'JOIN THE TWO CARBONS WITH A C=C', (Q) => {
      const a = Q(76, 76), b = Q(106, 58), c = Q(136, 76), h = armEnd(c, 270, 26);
      const k = Q(186, 76);
      let g = sk(a, b) + sk(b, c) + bond(c, k, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi' }) + bond(c, h, { rFrom: 0, rTo: 11 }) +
        A(h, 'H', { r: 11 }) + sk(k, armEnd(k, 60, 34)) + sk(k, armEnd(k, 300, 34));
      g += tag(Q(170, 130).x, Q(170, 130).y, '2-methylpent-2-ene, C₆H₁₂', { cls: 'fg-tag-good' });
      return g;
    });
    return s;
  },
  caption: 'Turn the two carbonyl groups to face each other, take out both oxygens, and join the two carbons with a double bond.',
});

/* =====================================================================
   11. The worked example's substrate taken through the two additions.
   Notes only. */
FIGURES.push({
  id: 'methylbutene-additions',
  section: 'alkene-oxidation',
  anchor: 'if you want to see syn and anti differ.</p>',
  alt: 'Three stacked panels. 1: 2-methylbut-2-ene, the left alkene carbon with two methyls, the right with one methyl and one H. 2: with mCPBA, 2,2,3-trimethyloxirane, the O bridging the two old alkene carbons. 3: with OsO4, or with mCPBA then H3O+, 2-methylbutane-2,3-diol, with C3 starred as its only stereocenter.',
  viewBox: '0 0 340 396',
  build() {
    let s = '';
    s += cell(0, 8, 340, 112, 'THE SUBSTRATE', (Q) => {
      const m = methylbutene(Q, 148, 74);
      return m.ink + tag(Q(84, 104).x, Q(84, 104).y, 'two CH₃, no H') + tag(Q(222, 56).x, Q(222, 56).y, 'one CH₃, one H', { anchor: 'start' });
    });
    s += cell(0, 128, 340, 112, '(a)   mCPBA', (Q) => {
      const a = Q(126, 82), b = Q(176, 82), o = Q(151, 44);
      let g = sk(a, b) + bond(a, o, { rFrom: 0, rTo: 13 }) + bond(b, o, { rFrom: 0, rTo: 13 }) + A(o, 'O', { kind: 'hi' });
      g += sk(a, armEnd(a, 160, 34)) + sk(a, armEnd(a, 230, 34)) + sk(b, armEnd(b, 310, 34));
      g += tag(Q(262, 78).x, Q(262, 78).y, '2,2,3-trimethyl-') + tag(Q(262, 94).x, Q(262, 94).y, 'oxirane');
      return g;
    });
    s += cell(0, 248, 340, 140, '(b) AND (c)   OsO₄, OR mCPBA THEN H₃O⁺', (Q) => {
      const c1 = Q(60, 90), c2 = Q(92, 72), c3 = Q(124, 90), c4 = Q(156, 72);
      let g = sk(c1, c2) + sk(c2, c3) + sk(c3, c4) + sk(c2, armEnd(c2, 150, 30));
      const o2 = armEnd(c2, 60, 30), o3 = armEnd(c3, 270, 28);
      g += bond(c2, o2, { rFrom: 0, rTo: 15 }) + bond(c3, o3, { rFrom: 0, rTo: 15 });
      g += A(o2, 'OH', { kind: 'hi' }) + A(o3, 'OH', { kind: 'hi' });
      g += text(c3.x + 12, c3.y - 4, '*', { cls: 'fg-warn', size: 16 });
      g += tag(Q(254, 76).x, Q(254, 76).y, '2-methylbutane-') + tag(Q(254, 92).x, Q(254, 92).y, '2,3-diol');
      g += tag(Q(254, 112).x, Q(254, 112).y, '* the one stereocenter', { cls: 'fg-tag-warn' });
      return g;
    });
    return s;
  },
  caption: 'The star marks C3, the only stereocenter the diol has.',
});

export default FIGURES;
