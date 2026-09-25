/* Figures for the aldehydes-ketones notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This topic opens Carbonyl Chemistry, long after skeletal structures, so
   chains may be drawn skeletally. The carbonyl carbon and oxygen are still
   written out with labels in almost every drawing, because they are what the
   page is about. Two views recur:
     - face-on: the carbonyl's plane is the page;
     - nearly edge-on: the plane is seen from just above its edge, as a
       thin shaded strip, with the two groups on carbon lying in the strip as
       a wedge (toward the reader) and a hash (away). This is the view that shows where a nucleophile comes
       from, so the trajectory, the aldehyde/ketone crowding comparison and
       their lesson copies all use it.
   Lesson copies (id prefix l-) are 340 wide or less, stacked, and use only
   fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, P } from '../lib/ochem-figure.mjs';
import { sk, polyPts, benzene, ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
const r2 = (v) => Math.round(v * 100) / 100;
/* A point at math angle `deg` (0 east, 90 up) and distance `len` from c. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
/* A lone pair pointing out along math angle `deg`. */
const lp = (c, deg, o = {}) => lonePair(c.x, c.y, -deg, { dist: o.dist ?? 21, spread: 4.5, r: 2.4 });

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so an opaque plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => (l.length >= 7 ? 25 : l.length >= 5 ? 21 : l.length === 4 ? 20 : l.length >= 3 ? 17 : l === 'H' ? 12 : 15);

/* A plain, wedged or hashed bond from c to a labeled group, plus the group. */
function arm(c, deg, len, l, o = {}) {
  const e = at(c, deg, len);
  const r = o.r ?? rOf(l);
  const opts = { rFrom: o.rFrom ?? 16, rTo: r };
  let s = o.kind === 'wedge' ? wedge(c, e, { ...opts, width: 9 })
        : o.kind === 'hash' ? hash(c, e, { ...opts, width: 10, rungs: 5 })
        : bond(c, e, { ...opts, order: o.order || 1 });
  s += atom(e.x, e.y, l, { r, kind: o.atomKind });
  return { s, e };
}

/* A carbonyl drawn face-on: C at c, O at math angle oDeg, and the two other
   groups at subs[i].deg. Returns the ink plus the key points. */
function carbonyl(c, { oDeg = 90, len = 56, subs = [], cKind = 'plain', oKind = 'plain', lps = true, oLabel = 'O' } = {}) {
  let s = '';
  const o = at(c, oDeg, len);
  s += bond(c, o, { order: 2, rFrom: 16, rTo: 15 });
  for (const g of subs) s += arm(c, g.deg, g.len ?? len, g.l, { atomKind: g.kind }).s;
  if (lps) s += lp(o, oDeg + 60) + lp(o, oDeg - 60);
  s += atom(o.x, o.y, oLabel, { kind: oKind });
  s += atom(c.x, c.y, 'C', { kind: cKind });
  return { s, o };
}

/* A straight dashed path with an arrowhead: where a nucleophile travels.
   Deliberately not a curved arrow, which would claim electrons move. */
function path(a, b, cls = 'fg-dash-hi', headCls = 'fg-head') {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, size = 8, px = -uy, py = ux, h = size * 0.52;
  const ex = b.x - ux * size, ey = b.y - uy * size;
  return `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(ex)}" y2="${r2(ey)}"></line>` +
    `<path class="${headCls}" d="M${r2(b.x)} ${r2(b.y)} L${r2(ex + px * h)} ${r2(ey + py * h)} L${r2(ex - px * h)} ${r2(ey - py * h)} Z"></path>`;
}
/* The molecule's plane seen nearly edge-on: a thin shaded parallelogram
   through c. Its dashed edges run above and below the atoms, never along a
   bond, so a C=O inside it still reads as a double bond. */
function strip(c, left, right, h = 26, skew = 18) {
  const pts = [P(c.x - left + skew, c.y - h), P(c.x + right + skew, c.y - h), P(c.x + right - skew, c.y + h), P(c.x - left - skew, c.y + h)];
  const d = 'M' + pts.map((q) => `${r2(q.x)} ${r2(q.y)}`).join(' L') + ' Z';
  return `<path class="fg-fill-mut" d="${d}" opacity="0.08"></path><path class="fg-dash" d="${d}"></path>`;
}
const dline = (a, b, cls = 'fg-dash') => `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;

/* An arc about c from math angle a1 to a2 (a2 > a1). */
function arc(c, r, a1, a2, cls = 'fg-bond-soft', gap = 0) {
  a1 += gap; a2 -= gap;
  const p1 = at(c, a1, r), p2 = at(c, a2, r);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `<path class="${cls}" d="M${r2(p1.x)} ${r2(p1.y)} A${r} ${r} 0 ${large} 0 ${r2(p2.x)} ${r2(p2.y)}"></path>`;
}
const ell = (cx, cy, rx, ry, cls) => `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"></ellipse>`;
const halo = (c, r) => `<circle class="fg-fill-mut" cx="${r2(c.x)}" cy="${r2(c.y)}" r="${r2(r)}" opacity="0.16"></circle>`;

/* Resonance arrow: one line, a head at each end. */
function resArrow(a, b) {
  const m = P((a.x + b.x) / 2, (a.y + b.y) / 2);
  return arrow(m, b, { size: 8 }) + arrow(m, a, { size: 8 });
}
/* Equilibrium arrows: one each way, stacked. Horizontal or vertical. */
function eqArrows(a, b, gap = 6) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const px = (-dy / L) * gap, py = (dx / L) * gap;
  return arrow(P(a.x - px, a.y - py), P(b.x - px, b.y - py), { size: 7 }) +
         arrow(P(b.x + px, b.y + py), P(a.x + px, a.y + py), { size: 7 });
}
/* The C=O pi pair moving onto oxygen, for a C=O drawn straight up: from the
   middle of the double bond, round the right-hand side, into the oxygen. */
const piToO = (c, o, skel = false) => curve(P(c.x + 8, c.y - (skel ? 14 : 24)), P(o.x + 16, o.y + 4), { bow: 14 });
const charge = (x, y, s, cls = 'fg-warn') => text(x, y, s, { cls, size: 15 });

/* The edge-on carbonyl: C at c, O to the right along the axis, the plane as
   a dashed line, and the two groups on carbon as a hash (up-left, away from
   the reader) and a wedge (down-left, toward the reader). */
function edgeOn(c, { g1 = 'R', g2 = 'R′', len = 58, oLen = 84, lps = true, plane = [120, 150], halos = false } = {}) {
  let s = '';
  const o = P(c.x + oLen, c.y);
  s += strip(c, plane[0], plane[1]);
  const back = arm(c, 162, len, g2, { kind: 'hash' });
  const front = arm(c, 198, len, g1, { kind: 'wedge' });
  if (halos) {
    s += halo(back.e, g2 === 'H' ? 15 : 31);
    s += halo(front.e, g1 === 'H' ? 15 : 31);
  }
  s += back.s + front.s;
  s += bond(c, o, { order: 2, rFrom: 16, rTo: 15 });
  if (lps) s += lp(o, 32) + lp(o, -32);
  s += atom(o.x, o.y, 'O');
  s += atom(c.x, c.y, 'C', { kind: 'warn' });
  return { s, o, back: back.e, front: front.e };
}

/* A nucleophile at math angle `deg` and distance `len` from c, with its
   lone pair facing c and the dashed approach path. */
function nuApproach(c, deg, len, { stop = 22 } = {}) {
  const n = at(c, deg, len);
  let s = '';
  s += path(at(c, deg, len - 30), at(c, deg, stop));
  s += lp(n, deg + 180, { dist: 22 });
  s += atom(n.x, n.y, 'Nu', { kind: 'hi', r: 16 });
  s += charge(n.x + 20, n.y - 10, '−', 'fg-hi');
  return { s, n };
}

/* ======================================================= NOTES FIGURES === */

/* 1. Four real carbonyl compounds: the H on the carbonyl carbon is what makes
   an aldehyde. */
FIGURES.push({
  id: 'ak-examples',
  section: 'aldehydes-ketones',
  anchor: '<!-- notes:start -->',
  alt: 'Formaldehyde, acetaldehyde, acetone and butanone drawn with every group on the carbonyl carbon labeled. The two aldehydes carry at least one H on the carbonyl carbon; the two ketones carry two carbon groups.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    const cols = [
      { x: 95, name: 'formaldehyde', a: 'H', b: 'H', kind: 'aldehyde' },
      { x: 285, name: 'acetaldehyde', a: 'CH₃', b: 'H', kind: 'aldehyde' },
      { x: 475, name: 'acetone', a: 'CH₃', b: 'CH₃', kind: 'ketone' },
      { x: 665, name: 'butanone', a: 'CH₃', b: 'CH₂CH₃', kind: 'ketone' },
    ];
    for (const k of cols) {
      const c = P(k.x, 124);
      s += carbonyl(c, {
        subs: [{ deg: 210, l: k.a, kind: k.a === 'H' ? 'warn' : undefined }, { deg: 330, l: k.b, kind: k.b === 'H' ? 'warn' : undefined }],
        cKind: 'hi', len: 56,
      }).s;
      s += label(k.x, 196, k.name);
      s += text(k.x, 218, k.kind === 'aldehyde' ? 'an aldehyde' : 'a ketone', { cls: k.kind === 'aldehyde' ? 'fg-tag-warn' : 'fg-tag', size: 11 });
    }
    s += rule(380, 34, 380, 226);
    s += tag(190, 22, 'H on the carbonyl carbon');
    s += tag(570, 22, 'two carbons on the carbonyl carbon');
    return s;
  },
  caption: 'Each carbonyl carbon (tinted) makes three bonds besides its double bond to oxygen. Look at the two groups on it: an H (coral) marks an aldehyde, two carbons mark a ketone.',
});

/* 2. Formaldehyde face-on with its angles, and edge-on with its pi bond. */
FIGURES.push({
  id: 'ak-planar',
  section: 'aldehydes-ketones',
  anchor: '<h3>Structure: a polarized, planar, sp² carbon</h3>',
  alt: 'Left: formaldehyde drawn face-on, with the angles between its three groups each marked about 120 degrees. Right: the same molecule seen nearly edge-on, its plane a thin shaded strip holding all four atoms, with the pi bond drawn as two lobes above and two below the plane, the lobes larger on oxygen.',
  viewBox: '0 0 760 290',
  build() {
    let s = '';
    // Face-on.
    const c = P(180, 162);
    s += arc(c, 30, 90, 210, 'fg-bond-soft', 14) + arc(c, 30, 210, 330, 'fg-bond-soft', 14) + arc(c, 30, 330, 450, 'fg-bond-soft', 14);
    s += carbonyl(c, { subs: [{ deg: 210, l: 'H' }, { deg: 330, l: 'H' }], len: 66, cKind: 'hi' }).s;
    s += text(c.x - 50, c.y - 28, '≈120°', { cls: 'fg-sm', size: 10.5 });
    s += text(c.x + 50, c.y - 28, '≈120°', { cls: 'fg-sm', size: 10.5 });
    s += text(c.x, c.y + 50, '≈120°', { cls: 'fg-sm', size: 10.5 });
    s += tag(180, 24, 'face-on: the page is the molecule’s plane');
    s += text(180, 250, 'sp² carbon: three groups,', { cls: 'fg-sm', size: 10.5 });
    s += text(180, 266, 'spread flat and evenly', { cls: 'fg-sm', size: 10.5 });

    s += rule(372, 30, 372, 270);

    // Edge-on, with the bonding pi orbital.
    const e = P(540, 166), o = P(620, 166);
    s += ell(e.x, e.y - 30, 11, 22, 'fg-orb') + ell(e.x, e.y + 30, 11, 22, 'fg-orb-alt');
    s += ell(o.x, o.y - 36, 15, 28, 'fg-orb') + ell(o.x, o.y + 36, 15, 28, 'fg-orb-alt');
    s += strip(e, 110, 170);
    s += arm(e, 162, 58, 'H', { kind: 'hash' }).s;
    s += arm(e, 198, 58, 'H', { kind: 'wedge' }).s;
    s += bond(e, o, { rFrom: 16, rTo: 15 });
    s += lp(o, 30) + lp(o, -30);
    s += atom(o.x, o.y, 'O');
    s += atom(e.x, e.y, 'C', { kind: 'hi' });
    s += tag(575, 24, 'nearly edge-on: the plane is the shaded strip');
    s += text(575, 62, 'π bond: lobes above and below the plane', { cls: 'fg-sm', size: 10.5 });
    s += text(575, 258, 'lobes bigger on O: the π electrons sit nearer O', { cls: 'fg-sm', size: 10.5 });
    s += text(440, 186, 'plane', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Formaldehyde from two directions. Face-on, read the three marked angles. Nearly edge-on, the shaded strip is the molecule’s plane and the colored lobes are the π bond.',
});

/* 3. The two resonance contributors. */
FIGURES.push({
  id: 'ak-resonance',
  section: 'aldehydes-ketones',
  anchor: 'it is the one that predicts the reactivity.</p>',
  alt: 'Two resonance structures of a carbonyl R2C=O. Left, the neutral form, with a curved arrow moving the pi bond onto oxygen. A note between them says the real molecule is a blend, with delta plus on carbon and delta minus on oxygen. Right, the charge-separated form: carbon plus, oxygen minus with three lone pairs.',
  viewBox: '0 44 760 206',
  build() {
    let s = '';
    const c1 = P(210, 140);
    const a = carbonyl(c1, { subs: [{ deg: 210, l: 'R' }, { deg: 330, l: 'R′' }], len: 58 });
    s += a.s;
    s += piToO(c1, a.o);
    s += text(370, 150, 'the real molecule is a blend:', { cls: 'fg-sm', size: 10.5 });
    s += text(370, 166, 'C is δ+, O is δ−', { cls: 'fg-sm', size: 10.5 });
    s += label(210, 212, 'major contributor');
    s += text(210, 230, 'every atom has an octet', { cls: 'fg-sm', size: 10.5 });

    s += resArrow(P(320, 118), P(420, 118));

    const c2 = P(540, 140);
    s += bond(c2, at(c2, 210, 58), { rFrom: 16, rTo: 15 }) + atom(at(c2, 210, 58).x, at(c2, 210, 58).y, 'R');
    s += bond(c2, at(c2, 330, 58), { rFrom: 16, rTo: 15 }) + atom(at(c2, 330, 58).x, at(c2, 330, 58).y, 'R′');
    const o2 = at(c2, 90, 58);
    s += bond(c2, o2, { rFrom: 16, rTo: 15 });
    s += lp(o2, 90) + lp(o2, 180) + lp(o2, 0);
    s += atom(o2.x, o2.y, 'O', { kind: 'hi' });
    s += atom(c2.x, c2.y, 'C', { kind: 'warn' });
    s += charge(c2.x + 24, c2.y - 14, '+');
    s += charge(o2.x + 24, o2.y - 18, '−', 'fg-hi');
    s += label(540, 212, 'minor contributor');
    s += text(540, 230, 'carbon has only six electrons', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Follow the curved arrow from the neutral structure to the charge-separated one, and note which atom ends up with which charge.',
});

/* 4. The two moves every carbonyl reaction is built from. */
FIGURES.push({
  id: 'ak-two-sites',
  section: 'aldehydes-ketones',
  anchor: '<h3>Two sites, two kinds of reactivity</h3>',
  alt: 'Top row: a nucleophile uses its lone pair to bond to the carbonyl carbon while the pi electrons move onto oxygen, giving a tetrahedral alkoxide. Bottom row: an oxygen lone pair takes a proton from an acid H–A, giving a protonated carbonyl with a positive oxygen, plus A minus.',
  viewBox: '0 0 760 370',
  build() {
    let s = '';
    // Row 1: nucleophile attacks carbon.
    s += tag(24, 24, 'a nucleophile attacks the carbon', { anchor: 'start' });
    const nu = P(70, 118), c = P(200, 118);
    s += lp(nu, 0, { dist: 22 });
    s += atom(nu.x, nu.y, 'Nu', { kind: 'hi' });
    s += charge(nu.x - 2, nu.y - 24, '−', 'fg-hi');
    const k = carbonyl(c, { subs: [{ deg: 210, l: 'R' }, { deg: 330, l: 'R′' }], len: 56, cKind: 'warn' });
    s += k.s;
    s += curve(P(nu.x + 24, nu.y - 4), P(c.x - 18, c.y - 4), { bow: -22 });
    s += piToO(c, k.o);
    s += arrow(P(300, 118), P(368, 118), { muted: true });
    // Tetrahedral alkoxide.
    const t = P(480, 124);
    s += arm(t, 215, 58, 'R').s;
    s += arm(t, 325, 58, 'R′', { kind: 'hash' }).s;
    s += arm(t, 285, 56, 'Nu', { kind: 'wedge', atomKind: 'hi' }).s;
    const to = at(t, 90, 58);
    s += bond(t, to, { rFrom: 16, rTo: 15 });
    s += lp(to, 90) + lp(to, 180) + lp(to, 0);
    s += atom(to.x, to.y, 'O', { kind: 'hi' });
    s += charge(to.x + 24, to.y - 18, '−', 'fg-hi');
    s += atom(t.x, t.y, 'C', { kind: 'warn' });
    s += label(560, 110, 'an alkoxide', { anchor: 'start' });
    s += text(560, 128, 'carbon now has four', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(560, 142, 'groups: sp³, tetrahedral', { cls: 'fg-sm', size: 10.5, anchor: 'start' });

    s += rule(20, 196, 740, 196);

    // Row 2: acid protonates oxygen.
    s += tag(24, 222, 'an acid protonates the oxygen', { anchor: 'start' });
    const c2 = P(160, 318);
    const k2 = carbonyl(c2, { subs: [{ deg: 210, l: 'R' }, { deg: 330, l: 'R′' }], len: 56 });
    s += k2.s;
    const h = P(262, 250), a = P(322, 250);
    s += bond(h, a, { rFrom: 12, rTo: 15 });
    s += atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    s += atom(a.x, a.y, 'A');
    s += curve(P(k2.o.x + 22, k2.o.y - 16), P(h.x - 13, h.y + 3), { bow: -12 });
    s += curve(P(292, 246), P(a.x + 4, a.y - 17), { bow: -14 });
    s += arrow(P(360, 290), P(428, 290), { muted: true });
    const c3 = P(530, 318);
    s += arm(c3, 210, 56, 'R').s + arm(c3, 330, 56, 'R′').s;
    const o3 = at(c3, 90, 56);
    s += bond(c3, o3, { order: 2, rFrom: 16, rTo: 15 });
    const h3 = at(o3, 30, 48);
    s += bond(o3, h3, { rFrom: 15, rTo: 12 });
    s += atom(h3.x, h3.y, 'H', { r: 12 });
    s += lp(o3, 150);
    s += atom(o3.x, o3.y, 'O', { kind: 'warn' });
    s += charge(o3.x - 4, o3.y - 24, '+');
    s += atom(c3.x, c3.y, 'C', { kind: 'warn' });
    s += text(650, 290, '+  A', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += charge(685, 284, '−', 'fg-hi');
    s += text(620, 340, 'carbon is now even', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(620, 354, 'more electron-poor', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Top: the nucleophile’s lone pair makes the new bond to carbon, and the π pair moves up onto oxygen. Bottom: an oxygen lone pair takes the proton from the acid, and the H–A pair stays on A.',
});

/* 5. The two faces of a flat carbonyl, and the two mirror-image products. */
FIGURES.push({
  id: 'ak-faces',
  section: 'aldehydes-ketones',
  anchor: 'gives a racemic mixture',
  alt: 'Butanone drawn flat in the page. A nucleophile adding from in front of the page gives a product with Nu on a wedge and O minus on a hash; adding from behind gives Nu on a hash and O minus on a wedge. The two products are mirror images.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const c = P(380, 160);
    s += carbonyl(c, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'CH₂CH₃' }], len: 58, cKind: 'hi' }).s;
    s += tag(380, 24, 'butanone lies flat in the page');
    s += arrow(P(318, 124), P(252, 124));
    s += text(285, 96, 'Nu⁻ adds from', { cls: 'fg-sm', size: 10.5 });
    s += text(285, 110, 'in front', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(442, 124), P(508, 124));
    s += text(475, 96, 'Nu⁻ adds from', { cls: 'fg-sm', size: 10.5 });
    s += text(475, 110, 'behind', { cls: 'fg-sm', size: 10.5 });
    const prod = (x, nuKind, oKind) => {
      const t = P(x, 170);
      let g = '';
      g += arm(t, 215, 58, 'CH₃').s;
      g += arm(t, 325, 58, 'CH₂CH₃').s;
      g += arm(t, 118, 54, 'Nu', { kind: nuKind, atomKind: 'hi' }).s;
      g += arm(t, 62, 54, 'O⁻', { kind: oKind }).s;
      g += atom(t.x, t.y, 'C', { kind: 'hi' });
      return g;
    };
    s += prod(125, 'wedge', 'hash');
    s += prod(635, 'hash', 'wedge');
    s += text(125, 238, 'Nu toward you', { cls: 'fg-sm', size: 10.5 });
    s += text(635, 238, 'Nu away from you', { cls: 'fg-sm', size: 10.5 });
    s += text(380, 272, 'mirror images, 50 : 50', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Wedge and hash swap between the two products, and nothing else changes: they are mirror images (enantiomers).',
});

/* 6. The Bürgi–Dunitz approach, and the fold-back that follows it. */
FIGURES.push({
  id: 'ak-trajectory',
  section: 'aldehydes-ketones',
  anchor: 'the <b>Bürgi–Dunitz angle</b>',
  alt: 'Left: a carbonyl seen nearly edge-on, its plane a thin shaded strip, with the empty pi-star orbital drawn as a large lobe pair on carbon and a small opposite-phase pair on oxygen. A nucleophile comes in along a dashed path about 107 degrees from the carbon-to-oxygen direction, tilted away from oxygen; a gray dashed line straight up marks 90 degrees for comparison. Right: after the bond forms, R and R prime have folded down away from the nucleophile and the carbon is tetrahedral.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const c = P(210, 214), o = P(296, 214);
    // pi*: big lobes on C, small opposite-phase lobes on O.
    s += ell(c.x, c.y - 36, 13, 27, 'fg-orb') + ell(c.x, c.y + 36, 13, 27, 'fg-orb-alt');
    s += ell(o.x, o.y - 25, 8, 16, 'fg-orb-alt') + ell(o.x, o.y + 25, 8, 16, 'fg-orb');
    const eo = edgeOn(c, { oLen: 86, plane: [140, 150] });
    s += eo.s;
    // 90 degree reference and the 107 degree path.
    s += dline(at(c, 90, 66), at(c, 90, 160));
    s += text(c.x + 10, c.y - 150, '90°', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += nuApproach(c, 107, 172, { stop: 66 }).s;
    s += arc(c, 50, 0, 107, 'fg-bond-soft');
    s += text(c.x + 44, c.y - 50, '≈107°', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(330, 152, 'π* (empty):', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(330, 166, 'bigger lobe on C', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(74, 236, 'plane', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += tag(210, 24, 'the approach');
    s += text(210, 314, 'the path leans away from oxygen', { cls: 'fg-tag', size: 11 });

    s += rule(468, 30, 468, 300);

    // After: the tetrahedral carbon, R and R' folded down.
    const t = P(600, 190);
    s += dline(t, at(t, 162, 52), 'fg-dash') + dline(t, at(t, 198, 52), 'fg-dash');
    const nu = at(t, 107, 62);
    s += bond(t, nu, { rFrom: 16, rTo: 16 });
    s += atom(nu.x, nu.y, 'Nu', { kind: 'hi' });
    const o2 = at(t, -18, 64);
    s += bond(t, o2, { rFrom: 16, rTo: 16 });
    s += atom(o2.x, o2.y, 'O⁻', { kind: 'hi' });
    s += arm(t, 256, 60, 'R′', { kind: 'hash' }).s;
    s += arm(t, 222, 60, 'R', { kind: 'wedge' }).s;
    s += atom(t.x, t.y, 'C', { kind: 'warn' });
    s += text(484, 92, 'dashed: where', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(484, 106, 'R and R′ were', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += tag(614, 24, 'after the bond forms');
    s += text(614, 290, 'R and R′ fold away from Nu:', { cls: 'fg-tag', size: 11 });
    s += text(614, 306, 'a tetrahedral, sp³ carbon', { cls: 'fg-tag', size: 11 });
    return s;
  },
  caption: 'Left: the empty π* orbital, and the nucleophile’s dashed path against the gray 90° line. Right: the same carbon once the bond has formed, with dashed lines where R and R′ were.',
});

/* 7. Why an aldehyde is easier to attack than a ketone. */
function aldKet(cx, cy, ald, nuLen = 150) {
  let s = '';
  const c = P(cx, cy);
  const eo = edgeOn(c, { g1: 'CH₃', g2: ald ? 'H' : 'CH₃', len: 52, oLen: 84, plane: [120, 128], halos: true });
  s += eo.s;
  s += nuApproach(c, 107, nuLen, { stop: 24 }).s;
  s += text(c.x + 30, c.y + 46, 'δ+', { cls: 'fg-warn', size: ald ? 16 : 11 });
  return s;
}
FIGURES.push({
  id: 'ak-ald-vs-ket',
  section: 'aldehydes-ketones',
  anchor: '<h3>Aldehydes are more reactive than ketones</h3>',
  alt: 'Acetaldehyde and acetone, each nearly edge-on, with a nucleophile approaching the carbonyl carbon from above along the tilted path. A shaded disc shows the room each group takes: the aldehyde has one CH3 and a small H; the ketone has two CH3 groups, both large. The aldehyde carbon carries a larger delta plus.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += tag(190, 24, 'acetaldehyde');
    s += aldKet(210, 196, true);
    s += text(190, 266, 'one CH₃ pushes electrons in;', { cls: 'fg-sm', size: 10.5 });
    s += text(190, 280, 'the small H leaves the path open', { cls: 'fg-sm', size: 10.5 });
    s += text(190, 306, 'more reactive', { cls: 'fg-tag-good', size: 11 });
    s += rule(380, 30, 380, 312);
    s += tag(570, 24, 'acetone');
    s += aldKet(590, 196, false);
    s += text(570, 266, 'two CH₃ push electrons in;', { cls: 'fg-sm', size: 10.5 });
    s += text(570, 280, 'both are large, so the path is crowded', { cls: 'fg-sm', size: 10.5 });
    s += text(570, 306, 'less reactive', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'Both carbonyls nearly edge-on (the shaded strip is the plane), with the nucleophile on the tilted path. The shaded discs show how much room each group takes. The size of the δ+ label shows which carbon is more electron-poor.',
});

/* 8. The angle squeeze on going from sp2 to sp3. */
FIGURES.push({
  id: 'ak-squeeze',
  section: 'aldehydes-ketones',
  anchor: 'That costs more when the substituents are large.</p>',
  alt: 'Left: a ketone with R and R prime 120 degrees apart around a flat carbon. Right: after a nucleophile adds, four groups around a tetrahedral carbon, with R and R prime about 109.5 degrees apart.',
  viewBox: '0 0 760 240',
  build() {
    let s = '';
    const c = P(190, 116);
    s += arc(c, 30, 210, 330);
    s += carbonyl(c, { subs: [{ deg: 210, l: 'R' }, { deg: 330, l: 'R′' }], len: 60 }).s;
    s += text(c.x, c.y + 52, '120°', { cls: 'fg-lbl', size: 13 });
    s += text(190, 200, 'three groups on carbon', { cls: 'fg-sm', size: 10.5 });
    s += text(190, 216, 'R and R′ are 120° apart', { cls: 'fg-sm', size: 10.5 });
    s += arrow(P(320, 116), P(420, 116), { muted: true });
    s += text(370, 102, 'Nu⁻ adds', { cls: 'fg-sm', size: 10.5 });
    const t = P(560, 122);
    s += arc(t, 30, 215, 325);
    s += arm(t, 215, 60, 'R').s + arm(t, 325, 60, 'R′').s;
    s += arm(t, 118, 54, 'Nu', { kind: 'wedge', atomKind: 'hi' }).s;
    s += arm(t, 62, 54, 'O⁻', { kind: 'hash' }).s;
    s += atom(t.x, t.y, 'C');
    s += text(t.x, t.y + 52, '≈109.5°', { cls: 'fg-lbl', size: 13 });
    s += text(560, 200, 'four groups on carbon', { cls: 'fg-sm', size: 10.5 });
    s += text(560, 216, 'R and R′ are pushed closer', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The same two groups, R and R′, before and after addition. Compare the two marked angles.',
});

/* 9. Hydration: what a hydrate is. */
FIGURES.push({
  id: 'ak-hydration',
  section: 'aldehydes-ketones',
  anchor: '<h3>Hydration equilibria prove the trend quantitatively</h3>',
  alt: 'Acetaldehyde plus water in equilibrium with its hydrate, a carbon carrying CH3, H and two OH groups.',
  viewBox: '0 40 760 180',
  build() {
    let s = '';
    const c = P(130, 124);
    s += carbonyl(c, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'H' }], len: 56, cKind: 'hi' }).s;
    s += label(130, 196, 'acetaldehyde');
    s += text(236, 128, '+  H₂O', { cls: 'fg-lbl', size: 13 });
    s += eqArrows(P(300, 118), P(400, 118));
    const t = P(530, 130);
    s += arm(t, 215, 56, 'CH₃').s + arm(t, 325, 56, 'H').s;
    s += arm(t, 118, 54, 'OH', { kind: 'wedge', atomKind: 'hi' }).s;
    s += arm(t, 62, 54, 'OH', { kind: 'hash', atomKind: 'hi' }).s;
    s += atom(t.x, t.y, 'C', { kind: 'hi' });
    s += '<text class="fg-lbl" x="530" y="196" text-anchor="middle" font-size="12.5">the hydrate (a <tspan font-style="italic">gem</tspan>-diol)</text>';
    s += text(640, 80, 'two OH on', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(640, 94, 'the same carbon', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Acetaldehyde and its hydrate. Both tinted OH groups sit on the old carbonyl carbon.',
});

/* 10. The four carbonyls of the worked example, in order. */
FIGURES.push({
  id: 'ak-rank-four',
  section: 'aldehydes-ketones',
  anchor: '<span class="k">Worked example — rank four carbonyls toward a nucleophile</span>',
  alt: 'Chloral, acetaldehyde, benzaldehyde and acetone in a row from most to least reactive, each labeled with what its groups do to the carbonyl carbon.',
  viewBox: '0 0 760 260',
  build() {
    let s = '';
    const y = 128;
    const cols = [
      { x: 92, name: 'chloral', a: 'CCl₃', b: 'H', n1: 'CCl₃ pulls', n2: 'electrons away' },
      { x: 276, name: 'acetaldehyde', a: 'CH₃', b: 'H', n1: 'CH₃ pushes', n2: 'a little in' },
      { x: 488, name: 'benzaldehyde', a: null, b: 'H', n1: 'the ring pushes', n2: 'in by resonance' },
      { x: 672, name: 'acetone', a: 'CH₃', b: 'CH₃', n1: 'two CH₃ push in', n2: 'and crowd' },
    ];
    for (const k of cols) {
      const c = P(k.x, y);
      const subs = [{ deg: 330, l: k.b }];
      if (k.a) subs.push({ deg: 210, l: k.a, kind: k.a === 'CCl₃' ? 'warn' : undefined });
      s += carbonyl(c, { subs, len: 54, cKind: 'hi' }).s;
      if (!k.a) {
        const ipso = at(c, 210, 50);
        const ctr = at(ipso, 210, 27);
        const ring = benzene(ctr.x, ctr.y, 27, { rot: 30 });
        s += bond(c, ipso, { rFrom: 16, rTo: 0 });
        s += ring.svg;
      }
      s += label(k.x, 32, k.name);
      s += text(k.x, 214, k.n1, { cls: 'fg-sm', size: 10.5 });
      s += text(k.x, 228, k.n2, { cls: 'fg-sm', size: 10.5 });
    }
    for (const x of [184, 370, 584]) s += text(x, 118, '>', { cls: 'fg-lbl', size: 13 });
    s += text(92, 252, 'most reactive', { cls: 'fg-tag-good', size: 11 });
    s += text(672, 252, 'least reactive', { cls: 'fg-tag-warn', size: 11 });
    return s;
  },
  caption: 'The answer to the worked example, drawn. Read each label as “what does this group do to the δ+ on the tinted carbon?”',
});

/* 11. Benzaldehyde's ring pushes electrons toward the carbonyl carbon. */
FIGURES.push({
  id: 'ak-benz-res',
  section: 'aldehydes-ketones',
  anchor: 'so benzaldehyde sits below acetaldehyde.',
  alt: 'Benzaldehyde and one of its minor resonance contributors. Curved arrows move a ring pi bond toward the carbonyl carbon and the C=O pi bond onto oxygen, giving a structure with a double bond from the ring to the carbonyl carbon, O minus, and a plus charge on a ring carbon next to it.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    // Left: benzaldehyde, ring vertex 0 pointing right.
    const ctr = P(150, 132);
    const ring = benzene(ctr.x, ctr.y, 34, { rot: 0 });
    s += ring.svg;
    const v = ring.pts;
    const c = P(v[0].x + 52, v[0].y);
    s += bond(v[0], c, { rFrom: 0, rTo: 16 });
    const o = at(c, 60, 54), h = at(c, 300, 50);
    s += bond(c, o, { order: 2, rFrom: 16, rTo: 15 });
    s += lp(o, 120) + lp(o, 0);
    s += atom(o.x, o.y, 'O');
    s += bond(c, h, { rFrom: 16, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12 });
    s += atom(c.x, c.y, 'C', { kind: 'hi' });
    const m01 = P((v[0].x + v[1].x) / 2, (v[0].y + v[1].y) / 2);
    s += curve(P(m01.x + 2, m01.y - 4), P((v[0].x + c.x) / 2 - 4, c.y - 5), { bow: -16 });
    const mco = P((c.x + o.x) / 2, (c.y + o.y) / 2);
    s += curve(P(mco.x + 6, mco.y + 2), P(o.x + 14, o.y + 10), { bow: 12 });
    s += label(170, 222, 'benzaldehyde');

    s += resArrow(P(330, 132), P(420, 132));

    // Right: the contributor.
    const ctr2 = P(510, 132);
    const p = polyPts(ctr2.x, ctr2.y, 6, 34, 0);
    const inward = ctr2;
    for (let i = 0; i < 6; i++) {
      const a = p[i], b = p[(i + 1) % 6];
      s += (i === 2 || i === 4) ? ringDouble(a, b, inward, { inset: 7 }) : sk(a, b);
    }
    const c2 = P(p[0].x + 52, p[0].y);
    s += bond(p[0], c2, { rFrom: 0, rTo: 16, order: 2 });
    const o2 = at(c2, 60, 54), h2 = at(c2, 300, 50);
    s += bond(c2, o2, { rFrom: 16, rTo: 15 });
    s += lp(o2, 350) + lp(o2, 110) + lp(o2, 170);
    s += atom(o2.x, o2.y, 'O', { kind: 'hi' });
    s += charge(o2.x + 18, o2.y - 18, '−', 'fg-hi');
    s += bond(c2, h2, { rFrom: 16, rTo: 12 }) + atom(h2.x, h2.y, 'H', { r: 12 });
    s += atom(c2.x, c2.y, 'C', { kind: 'hi' });
    s += charge(p[1].x + 8, p[1].y - 10, '+');
    s += label(530, 222, 'a minor contributor');
    s += text(640, 150, 'the + sits in', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(640, 164, 'the ring, not on', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(640, 178, 'the carbonyl C', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Follow the two curved arrows from benzaldehyde to the contributor on the right, then find where the + ended up.',
});

/* 12. Conjugation puts + on the beta carbon; alpha hydrogens are acidic. */
FIGURES.push({
  id: 'ak-enone-alpha',
  section: 'aldehydes-ketones',
  anchor: '<h3>Conjugation and the alpha carbon</h3>',
  alt: 'Top: but-3-en-2-one with its alpha and beta carbons labeled; curved arrows move the C=C pi bond toward the carbonyl and the C=O pi bond onto oxygen, giving a contributor with a plus charge on the beta carbon. Bottom: acetone with an alpha hydrogen marked; removing it leaves an anion whose negative charge is shared between the alpha carbon and the oxygen.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    // Row 1: enone.
    s += tag(24, 24, 'an enone: a C=O conjugated with a C=C', { anchor: 'start' });
    const enone = (x0, contributor) => {
      const c1 = P(x0, 136), c2 = P(x0 + 50, 108), c3 = P(x0 + 100, 136), c4 = P(x0 + 150, 108);
      const o = P(c2.x, 58);
      let g = '';
      g += sk(c1, c2);
      if (contributor) {
        g += ringDouble(c2, c3, P(x0 + 75, 160), { inset: 7 }) + sk(c3, c4);
        g += bond(c2, o, { rFrom: 0, rTo: 15 });
        g += lp(o, 90) + lp(o, 180) + lp(o, 0);
        g += atom(o.x, o.y, 'O', { kind: 'hi' });
        g += charge(o.x + 24, o.y - 16, '−', 'fg-hi');
        g += charge(c4.x + 10, c4.y - 12, '+');
      } else {
        g += sk(c2, c3) + ringDouble(c3, c4, P(x0 + 125, 150), { inset: 7 });
        g += bond(c2, o, { order: 2, rFrom: 0, rTo: 15 });
        g += lp(o, 150) + lp(o, 30);
        g += atom(o.x, o.y, 'O');
        g += curve(P((c3.x + c4.x) / 2 + 2, (c3.y + c4.y) / 2 - 8), P((c2.x + c3.x) / 2 + 2, (c2.y + c3.y) / 2 - 8), { bow: -14 });
        g += piToO(c2, o, true);
      }
      g += text(c3.x, c3.y + 24, 'α', { cls: 'fg-lbl', size: 13 });
      g += text(c4.x + 2, c4.y + 26, 'β', { cls: 'fg-lbl', size: 13 });
      return g;
    };
    s += enone(60, false);
    s += label(135, 184, 'but-3-en-2-one');
    s += resArrow(P(270, 110), P(350, 110));
    s += enone(400, true);
    s += label(475, 184, 'a minor contributor');
    s += text(600, 96, 'the β carbon', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(600, 110, 'carries a +', { cls: 'fg-sm', size: 10.5, anchor: 'start' });

    s += rule(20, 204, 740, 204);

    // Row 2: acetone, an alpha hydrogen, and the anion.
    s += tag(24, 230, 'alpha hydrogens: on the carbon next to the C=O', { anchor: 'start' });
    const a1 = P(60, 340), a2 = P(110, 312), a3 = P(160, 340), ao = P(110, 262);
    s += sk(a1, a2) + sk(a2, a3);
    s += bond(a2, ao, { order: 2, rFrom: 0, rTo: 15 });
    s += lp(ao, 150) + lp(ao, 30);
    s += atom(ao.x, ao.y, 'O');
    const ha = at(a1, 240, 40);
    s += bond(a1, ha, { rFrom: 0, rTo: 12 }) + atom(ha.x, ha.y, 'H', { r: 12, kind: 'warn' });
    s += text(a1.x - 8, a1.y - 12, 'α', { cls: 'fg-lbl', size: 13 });
    s += text(a3.x + 8, a3.y - 12, 'α', { cls: 'fg-lbl', size: 13 });
    s += label(110, 400, 'acetone');
    s += text(58, 410, '', { cls: 'fg-sm' });
    s += arrow(P(200, 318), P(270, 318), { muted: true });
    s += text(235, 302, 'base', { cls: 'fg-sm', size: 10.5 });
    s += text(235, 340, '− H⁺', { cls: 'fg-sm', size: 10.5 });
    // Carbanion form.
    const b1 = P(320, 340), b2 = P(370, 312), b3 = P(420, 340), bo = P(370, 262);
    s += sk(b1, b2) + sk(b2, b3);
    s += bond(b2, bo, { order: 2, rFrom: 0, rTo: 15 });
    s += lp(bo, 150) + lp(bo, 30);
    s += atom(bo.x, bo.y, 'O');
    s += lp(b1, 210, { dist: 12 });
    s += charge(b1.x - 6, b1.y + 24, '−', 'fg-hi');
    s += curve(P(b1.x - 8, b1.y + 8), P((b1.x + b2.x) / 2 - 4, (b1.y + b2.y) / 2 + 8), { bow: 16 });
    s += piToO(b2, bo, true);
    s += resArrow(P(450, 312), P(510, 312));
    // Enolate form.
    const e1 = P(550, 340), e2 = P(600, 312), e3 = P(650, 340), eo = P(600, 262);
    s += ringDouble(e1, e2, P(610, 350), { inset: 7 }) + sk(e2, e3);
    s += bond(e2, eo, { rFrom: 0, rTo: 15 });
    s += lp(eo, 90) + lp(eo, 180) + lp(eo, 0);
    s += atom(eo.x, eo.y, 'O', { kind: 'hi' });
    s += charge(eo.x + 24, eo.y - 16, '−', 'fg-hi');
    s += label(485, 400, 'the anion: − shared by C and O');
    return s;
  },
  caption: 'Top: follow the arrows to the + on the β carbon. Bottom: the coral H is an α hydrogen; once it has gone, compare where the − sits in the two structures on the right.',
});

/* 13. Where carbonyls come from. */
FIGURES.push({
  id: 'ak-sources',
  section: 'aldehydes-ketones',
  anchor: '<h3>Where they come from</h3>',
  alt: 'Four routes. Propyne with water, acid and a mercury(II) salt gives acetone. Propyne by hydroboration then oxidation gives propanal. Ozonolysis of 2-methylbut-2-ene gives acetone and acetaldehyde. Still to come: oxidizing propan-2-ol gives acetone, and oxidizing ethanol gives acetaldehyde and then acetic acid.',
  viewBox: '0 0 760 570',
  build() {
    let s = '';
    const propyne = (x, y) => {
      const a = P(x, y), b = P(x + 50, y), c = P(x + 100, y), h = P(x + 142, y);
      let g = '';
      g += bond(a, b, { rFrom: 17, rTo: 0 });
      g += bond(b, c, { order: 3, rFrom: 0, rTo: 0, gap: 3.4 });
      g += bond(c, h, { rFrom: 0, rTo: 12 });
      g += atom(a.x, a.y, 'CH₃') + atom(h.x, h.y, 'H', { r: 12 });
      return g;
    };
    const acetone = (x, y) => {
      const a = P(x, y + 14), b = P(x + 36, y - 6), c = P(x + 72, y + 14), o = P(x + 36, y - 50);
      return sk(a, b) + sk(b, c) + bond(b, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
    };
    const rowLabel = (y, l1, l2) => tag(20, y - 6, l1, { anchor: 'start' }) + text(20, y + 10, l2, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    const step = (x, y, top, bot) => arrow(P(x, y), P(x + 96, y), { muted: true }) +
      text(x + 48, y - 10, top, { cls: 'fg-sm', size: 10.5 }) + (bot ? text(x + 48, y + 20, bot, { cls: 'fg-sm', size: 10.5 }) : '');

    // Row A: Markovnikov hydration.
    let y = 70;
    s += rowLabel(y, 'hydrate an alkyne', '(O on the inner C)');
    s += propyne(200, y);
    s += step(380, y, 'H₂O, H₂SO₄', 'HgSO₄');
    s += acetone(520, y);
    s += text(640, y + 4, 'ketone', { cls: 'fg-tag', size: 11, anchor: 'start' });

    // Row B: hydroboration–oxidation.
    y = 180;
    s += rowLabel(y, 'hydroborate an alkyne', '(O on the end C)');
    s += propyne(200, y);
    s += step(380, y, '1. R₂BH', '2. H₂O₂, NaOH');
    {
      const a = P(520, y + 14), b = P(556, y - 6), c = P(592, y + 14), o = P(628, y - 6);
      s += sk(a, b) + sk(b, c) + bond(c, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      const h = at(c, 270, 38);
      s += bond(c, h, { rFrom: 0, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    }
    s += text(660, y + 4, 'aldehyde', { cls: 'fg-tag-warn', size: 11, anchor: 'start' });

    // Row C: ozonolysis.
    y = 300;
    s += rowLabel(y, 'cut an alkene', '(ozonolysis)');
    {
      const a = P(200, y - 22), b = P(236, y), c = P(200, y + 22), d = P(280, y), e = P(316, y + 22);
      s += sk(a, b) + sk(c, b) + ringDouble(b, d, P(258, y + 20), { inset: 5 }) + sk(d, e);
    }
    s += step(380, y, '1. O₃', '2. (CH₃)₂S');
    s += acetone(510, y);
    s += text(606, y + 4, '+', { cls: 'fg-lbl', size: 13 });
    {
      const a = P(632, y + 14), b = P(668, y - 6), o = P(704, y + 14);
      s += sk(a, b) + bond(b, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      const h = at(b, 90, 36);
      s += bond(b, h, { rFrom: 0, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    }

    s += rule(20, 352, 740, 352);

    // Row D: alcohol oxidation, taught later.
    y = 424;
    s += rowLabel(y, 'oxidize an alcohol', '(taught later)');
    {
      const a = P(200, y + 14), b = P(236, y - 6), c = P(272, y + 14), o = P(236, y - 48);
      s += sk(a, b) + sk(b, c) + bond(b, o, { rFrom: 0, rTo: 16 }) + atom(o.x, o.y, 'OH');
    }
    s += arrow(P(300, y), P(360, y), { muted: true }) + text(330, y - 10, '[O]', { cls: 'fg-sm', size: 10.5 });
    s += acetone(390, y);
    s += text(500, y + 4, '2° alcohol → ketone', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    y = 526;
    {
      const a = P(200, y + 14), b = P(236, y - 6), o = P(272, y + 14);
      s += sk(a, b) + bond(b, o, { rFrom: 0, rTo: 16 }) + atom(o.x, o.y, 'OH');
    }
    s += arrow(P(300, y), P(350, y), { muted: true }) + text(325, y - 10, '[O]', { cls: 'fg-sm', size: 10.5 });
    {
      const a = P(370, y + 14), b = P(406, y - 6), o = P(442, y + 14);
      s += sk(a, b) + bond(b, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      const h = at(b, 90, 36);
      s += bond(b, h, { rFrom: 0, rTo: 12 }) + atom(h.x, h.y, 'H', { r: 12, kind: 'warn' });
    }
    s += arrow(P(472, y), P(522, y), { muted: true }) + text(497, y - 10, '[O]', { cls: 'fg-sm', size: 10.5 });
    {
      const a = P(540, y + 14), b = P(576, y - 6), o = P(612, y + 14), oh = P(576, y - 48);
      s += sk(a, b) + bond(b, o, { order: 2, rFrom: 0, rTo: 15 }) + atom(o.x, o.y, 'O');
      s += bond(b, oh, { rFrom: 0, rTo: 16 }) + atom(oh.x, oh.y, 'OH');
    }
    s += text(640, y - 4, '1° alcohol →', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(640, y + 10, 'aldehyde → acid', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'Three routes you have already met, and one still to come. [O] is shorthand for “an oxidizing agent”. In the last route, the aldehyde is a stop on the way to the carboxylic acid.',
});

/* ====================================================== LESSON FIGURES === */

/* Step 1: the flat carbonyl and its two resonance contributors, stacked. */
FIGURES.push({
  id: 'l-ak-structure',
  lessons: ['aldehydes-ketones'],
  alt: 'Top: formaldehyde, flat, with the angles between its groups marked about 120 degrees. Bottom: the neutral carbonyl, a double-headed resonance arrow, and the charge-separated contributor with plus on carbon and minus on oxygen; a note says the real molecule is a blend, delta plus on carbon and delta minus on oxygen.',
  viewBox: '0 0 340 480',
  build() {
    let s = '';
    s += tag(170, 20, 'flat: all four atoms in one plane');
    const c = P(170, 124);
    s += arc(c, 30, 90, 210, 'fg-bond-soft', 14) + arc(c, 30, 210, 330, 'fg-bond-soft', 14) + arc(c, 30, 330, 450, 'fg-bond-soft', 14);
    s += carbonyl(c, { subs: [{ deg: 210, l: 'H' }, { deg: 330, l: 'H' }], len: 64, cKind: 'hi' }).s;
    s += text(c.x - 64, c.y - 22, '≈120°', { cls: 'fg-lbl', size: 13 });
    s += text(c.x + 64, c.y - 22, '≈120°', { cls: 'fg-lbl', size: 13 });
    s += text(c.x, c.y + 54, '≈120°', { cls: 'fg-lbl', size: 13 });
    s += rule(20, 214, 320, 214);
    s += tag(170, 240, 'two resonance contributors');
    const c1 = P(80, 350);
    const a = carbonyl(c1, { subs: [{ deg: 210, l: 'R' }, { deg: 330, l: 'R′' }], len: 52 });
    s += a.s;
    s += piToO(c1, a.o);
    s += resArrow(P(140, 330), P(196, 330));
    const c2 = P(260, 350);
    s += arm(c2, 210, 52, 'R').s + arm(c2, 330, 52, 'R′').s;
    const o2 = at(c2, 90, 52);
    s += bond(c2, o2, { rFrom: 16, rTo: 15 });
    s += lp(o2, 90) + lp(o2, 180) + lp(o2, 0);
    s += atom(o2.x, o2.y, 'O', { kind: 'hi' });
    s += atom(c2.x, c2.y, 'C', { kind: 'warn' });
    s += charge(c2.x + 24, c2.y - 14, '+');
    s += charge(o2.x + 24, o2.y - 18, '−', 'fg-hi');
    s += tag(80, 420, 'major');
    s += tag(260, 420, 'minor, but it');
    s += tag(260, 436, 'shows the + on C');
    s += tag(170, 466, 'the real molecule, a blend: C δ+, O δ−');
    return s;
  },
  caption: 'Top: formaldehyde face-on, with its three angles marked. Bottom: follow the curved arrow to the charge-separated contributor.',
});

/* Step 4: aldehyde vs ketone, stacked. */
FIGURES.push({
  id: 'l-ak-ald-vs-ket',
  lessons: ['aldehydes-ketones'],
  alt: 'Acetaldehyde above acetone, each nearly edge-on with a nucleophile approaching the carbonyl carbon along a tilted path. Shaded discs show the room each group takes: a small H and a CH3 on the aldehyde, two CH3 groups on the ketone.',
  viewBox: '0 0 340 468',
  build() {
    let s = '';
    s += tag(170, 18, 'acetaldehyde: one CH₃, one small H');
    s += aldKet(150, 156, true, 112);
    s += tag(170, 218, 'more reactive', { cls: 'fg-tag-good' });
    s += rule(20, 234, 320, 234);
    s += tag(170, 256, 'acetone: two CH₃');
    s += aldKet(150, 394, false, 112);
    s += tag(170, 456, 'less reactive', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Each carbonyl nearly edge-on (the shaded strip is the plane), with the nucleophile’s path dashed. Shaded discs show the room each group takes; the larger δ+ marks the more electron-poor carbon.',
});

/* Step 5: hydration, stacked. */
FIGURES.push({
  id: 'l-ak-hydration',
  lessons: ['aldehydes-ketones'],
  alt: 'Acetaldehyde plus water, above equilibrium arrows, above the hydrate: a carbon with CH3, H and two OH groups.',
  viewBox: '0 0 340 340',
  build() {
    let s = '';
    const c = P(136, 94);
    s += carbonyl(c, { subs: [{ deg: 210, l: 'CH₃' }, { deg: 330, l: 'H' }], len: 54, cKind: 'hi' }).s;
    s += text(244, 98, '+  H₂O', { cls: 'fg-lbl', size: 13 });
    s += eqArrows(P(170, 150), P(170, 200));
    const t = P(170, 262);
    s += arm(t, 215, 54, 'CH₃').s + arm(t, 325, 54, 'H').s;
    s += arm(t, 118, 52, 'OH', { kind: 'wedge', atomKind: 'hi' }).s;
    s += arm(t, 62, 52, 'OH', { kind: 'hash', atomKind: 'hi' }).s;
    s += atom(t.x, t.y, 'C', { kind: 'hi' });
    s += tag(170, 326, 'the hydrate: two OH on one carbon');
    return s;
  },
  caption: 'Acetaldehyde above its hydrate. Both tinted OH groups sit on the old carbonyl carbon.',
});

/* Step 6: three carbonyls not yet seen in the lesson, to rank. */
FIGURES.push({
  id: 'l-ak-three',
  lessons: ['aldehydes-ketones'],
  alt: 'Propanal, butanone and 3,3-dimethylbutan-2-one, one per row, with the two groups on each carbonyl carbon labeled: CH2CH3 and H; CH3 and CH2CH3; CH3 and C(CH3)3.',
  viewBox: '0 0 340 386',
  build() {
    let s = '';
    const rows = [
      { y: 80, name: 'propanal', a: 'CH₂CH₃', b: 'H' },
      { y: 204, name: 'butanone', a: 'CH₃', b: 'CH₂CH₃' },
      { y: 328, name: '3,3-dimethyl-', name2: 'butan-2-one', a: 'C(CH₃)₃', b: 'CH₃' },
    ];
    for (const k of rows) {
      const c = P(110, k.y);
      s += carbonyl(c, { subs: [{ deg: 212, l: k.a, len: 50 }, { deg: 328, l: k.b, len: 50 }], len: 44, cKind: 'hi' }).s;
      if (k.name2) { s += tag(262, k.y - 4, k.name); s += tag(262, k.y + 12, k.name2); }
      else s += tag(262, k.y + 4, k.name);
    }
    return s;
  },
  caption: 'Three carbonyl compounds. Read the two groups on each carbonyl carbon.',
});

/* Final: benzaldehyde against acetone. */
FIGURES.push({
  id: 'l-ak-benz-acetone',
  lessons: ['aldehydes-ketones'],
  alt: 'Benzaldehyde, a benzene ring and an H on the carbonyl carbon, beside acetone, two CH3 groups on the carbonyl carbon.',
  viewBox: '0 0 340 190',
  build() {
    let s = '';
    const c = P(110, 94);
    s += carbonyl(c, { subs: [{ deg: 330, l: 'H', len: 48 }], len: 50, cKind: 'hi' }).s;
    const ipso = at(c, 210, 46);
    const ctr = at(ipso, 210, 25);
    s += bond(c, ipso, { rFrom: 16, rTo: 0 }) + benzene(ctr.x, ctr.y, 25, { rot: 30 }).svg;
    s += tag(100, 170, 'benzaldehyde');
    const c2 = P(262, 94);
    s += carbonyl(c2, { subs: [{ deg: 214, l: 'CH₃', len: 46 }, { deg: 326, l: 'CH₃', len: 46 }], len: 50, cKind: 'hi' }).s;
    s += tag(262, 170, 'acetone');
    return s;
  },
  caption: 'An aryl aldehyde (one ring and one H on the carbonyl carbon) against a ketone (two CH₃).',
});

export default FIGURES;
