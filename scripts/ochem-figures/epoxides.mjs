/* Figures for the epoxides notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure that also appears in the lesson is 340 wide, with its panels
   stacked, and uses only fg-lbl and fg-tag text. The two 760-wide figures
   (oxirane-numbering, halohydrin-closure, epoxide-acid-base-switch) are
   notes only. */
import { atom, bond, wedge, hash, curve, lonePair, text, tag, rule, panel, arrow, P } from '../lib/ochem-figure.mjs';
import { polyPts } from '../lib/ochem-skeletal.mjs';
import { armEnd } from '../lib/ochem-helpers.mjs';

/* ------------------------------------------------------------ helpers --- */
const at = armEnd;                                   // at(p, deg, len), deg counterclockwise from east
const A = (p, l, o = {}) => atom(p.x, p.y, l, o);
const B = (a, b, rf = 15, rt = 15, cls) => bond(a, b, { rFrom: rf, rTo: rt, cls });
const mid = (a, b, f = 0.5) => P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
const T = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, anchor });
const sign = (x, y, s = '−', cls = 'fg-hi') => text(x, y, s, { cls, size: 15 });
/* A tag with an italic prefix (trans, cis). The kit's text() escapes its
   string, so the tspan is written here. */
const itag = (x, y, ital, rest, cls = 'fg-tag', pre = '') =>
  `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle" font-size="11">${pre}<tspan font-style="italic">${ital}</tspan>${rest}</text>`;
/* A dashed curved arrow: one that runs behind the page. */
const dashedCurve = (a, b, o) => curve(a, b, o).replace('class="fg-arrow"', 'class="fg-arrow" stroke-dasharray="4 3"');
/* Point p nudged d px toward q: where an arrow should stop short of an atom. */
const toward = (p, q, d) => { const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1; return P(p.x + dx / l * d, p.y + dy / l * d); };
/* Where a lone pair drawn at svg angle deg (0 = east, 90 = down) sits. */
const lpAt = (p, deg, d = 22) => P(p.x + Math.cos(deg * Math.PI / 180) * d, p.y + Math.sin(deg * Math.PI / 180) * d);

const FIGURES = [];

/* ================================================= 1. bent bonds ===
   Ethylene oxide: the 60° ring angle, and the bonds bowing outside the
   straight lines between the nuclei. Notes and lesson step 1. */
FIGURES.push({
  id: 'epoxide-bent-bonds',
  section: 'epoxides',
  lessons: ['epoxides'],
  anchor: '<h3>Ring strain makes epoxides reactive</h3>',
  alt: 'Ethylene oxide drawn as a triangle of two carbons and an oxygen, each carbon carrying two hydrogens. Dashed straight lines join the three nuclei; the bonds themselves are drawn as curves that bow outward, outside the triangle. An arc at one carbon marks the ring angle of about 60 degrees.',
  viewBox: '0 0 340 290',
  build() {
    let s = '';
    s += tag(170, 26, 'ETHYLENE OXIDE');
    const o = P(170, 78), cl = P(118, 166), cr = P(222, 166);
    const V = [o, cr, cl], cen = P(170, 137);
    for (let i = 0; i < 3; i++) {
      const a = V[i], b = V[(i + 1) % 3], m = mid(a, b);
      const dx = m.x - cen.x, dy = m.y - cen.y, l = Math.hypot(dx, dy);
      const c = P(m.x + dx / l * 24, m.y + dy / l * 24);
      s += `<line class="fg-dash" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`;
      s += `<path class="fg-bond-hi" d="M${a.x} ${a.y} Q${c.x.toFixed(2)} ${c.y.toFixed(2)} ${b.x} ${b.y}"></path>`;
    }
    for (const [c, degs] of [[cl, [185, 245]], [cr, [355, 295]]]) {
      for (const d of degs) { const h = at(c, d, 44); s += B(c, h, 15, 11) + A(h, 'H', { r: 11 }); }
    }
    s += A(cl, 'C') + A(cr, 'C') + A(o, 'O', { kind: 'hi' });
    s += lonePair(o.x, o.y, 215, { dist: 24 }) + lonePair(o.x, o.y, 325, { dist: 24 });
    /* The ring angle at the left carbon, between the C–C and C–O lines. */
    const ang = Math.atan2(cl.y - o.y, o.x - cl.x), r = 30;
    s += `<path class="fg-bond-soft" d="M${cl.x + r} ${cl.y} A${r} ${r} 0 0 0 ${(cl.x + r * Math.cos(ang)).toFixed(2)} ${(cl.y - r * Math.sin(ang)).toFixed(2)}"></path>`;
    s += T(160, 150, '60°');
    s += T(170, 240, 'solid: each bond bows outside the triangle', 'fg-tag-good');
    s += T(170, 258, 'dashed: the straight line between nuclei');
    s += T(170, 276, 'ring angles about 60°; sp³ prefers 109.5°');
    return s;
  },
  caption: 'Ethylene oxide, with its ring bonds drawn as bent bonds.',
});

/* ============================================ 2. naming: locants === */
FIGURES.push({
  id: 'oxirane-numbering',
  section: 'epoxides',
  anchor: 'which does not happen.</p>',
  alt: 'Three panels. Left: the oxirane ring, oxygen numbered 1 and the two CH2 carbons numbered 2 and 3. Middle: 2,2-dimethyloxirane, with both methyl groups on carbon 2. Right: 2,3-epoxy-2-methylbutane, a four-carbon chain numbered 1 to 4 with the oxygen bridging carbons 2 and 3 and a methyl group on carbon 2; the same compound is 2,2,3-trimethyloxirane.',
  viewBox: '0 0 760 256',
  build() {
    let s = '';
    const num = (x, y, v) => text(x, y, v, { cls: 'fg-tag-good' });
    /* Left: the parent ring. */
    s += tag(127, 30, 'OXIRANE');
    {
      const o = P(127, 84), c2 = P(90, 146), c3 = P(164, 146);
      s += B(o, c2, 15, 17) + B(o, c3, 15, 17) + B(c2, c3, 17, 17);
      s += A(o, 'O', { kind: 'hi' }) + A(c2, 'CH₂', { r: 17 }) + A(c3, 'CH₂', { r: 17 });
      s += num(154, 76, '1') + num(66, 132, '2') + num(188, 132, '3');
      s += T(127, 240, 'the oxygen is atom 1');
    }
    s += rule(253, 24, 253, 246);
    /* Middle: 2,2-dimethyloxirane. */
    s += tag(380, 30, '2,2-DIMETHYLOXIRANE');
    {
      const o = P(386, 84), c2 = P(350, 146), c3 = P(422, 146);
      const m1 = at(c2, 180, 52), m2 = at(c2, 245, 50);
      s += B(c2, m1, 15, 17) + B(c2, m2, 15, 17) + A(m1, 'CH₃', { r: 17 }) + A(m2, 'CH₃', { r: 17 });
      s += B(o, c2, 15, 15) + B(o, c3, 15, 17) + B(c2, c3, 15, 17);
      s += A(o, 'O', { kind: 'hi' }) + A(c2, 'C', { kind: 'hi' }) + A(c3, 'CH₂', { r: 17 });
      s += num(412, 76, '1') + num(336, 118, '2') + num(446, 132, '3');
      s += T(380, 240, 'both methyls on C2');
    }
    s += rule(507, 24, 507, 246);
    /* Right: the same kind of compound named on a chain. */
    s += tag(633, 30, '2,3-EPOXY-2-METHYLBUTANE');
    {
      const c1 = P(550, 150), c2 = P(604, 150), c3 = P(662, 150), c4 = P(716, 150), o = P(633, 98), me = P(604, 200);
      s += B(c1, c2, 17, 15) + B(c2, c3, 15, 17) + B(c3, c4, 17, 17) + B(c2, o, 15, 15) + B(c3, o, 17, 15) + B(c2, me, 15, 17);
      s += A(c1, 'CH₃', { r: 17 }) + A(c2, 'C', { kind: 'hi' }) + A(c3, 'CH', { r: 17, kind: 'hi' }) + A(c4, 'CH₃', { r: 17 });
      s += A(o, 'O', { kind: 'hi' }) + A(me, 'CH₃', { r: 17 });
      s += num(550, 126, '1') + num(588, 126, '2') + num(680, 126, '3') + num(716, 126, '4');
      s += T(633, 240, 'also 2,2,3-trimethyloxirane');
    }
    return s;
  },
  caption: 'Green numbers are the locants. The right-hand compound is numbered along its four-carbon chain.',
});

/* =================================== 3. halohydrin ring closure === */
FIGURES.push({
  id: 'halohydrin-closure',
  section: 'epoxides',
  anchor: 'give the same epoxide.</p>',
  alt: 'Left: the alkoxide of 3-bromobutan-2-ol, drawn with the carbon 2 to carbon 3 bond horizontal, the negatively charged oxygen pointing up from carbon 2 and the bromine pointing down from carbon 3, so the two are anti. Carbon 2 carries a methyl on a wedge and a hydrogen on a hash; carbon 3 carries a methyl on a hash and a hydrogen on a wedge. One curved arrow runs from an oxygen lone pair to carbon 3, and another from the carbon–bromine bond onto bromine. Right: the product, trans-2,3-dimethyloxirane, with the methyl on a wedge at carbon 2 and on a hash at carbon 3.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    /* Left: the alkoxide, turned so O⁻ and Br are anti. */
    s += tag(190, 30, 'O⁻ AND Br ANTI, READY TO CLOSE');
    const c2 = P(150, 150), c3 = P(236, 150), o = P(150, 84), br = P(236, 216);
    s += B(c2, c3) + B(c2, o, 15, 16) + B(c3, br, 15, 17);
    const m2 = at(c2, 205, 50), h2 = at(c2, 245, 42), m3 = at(c3, 25, 50), h3 = at(c3, 65, 42);
    s += wedge(c2, m2, { rFrom: 15, rTo: 17, width: 9 }) + hash(c2, h2, { rFrom: 15, rTo: 11, width: 9 });
    s += hash(c3, m3, { rFrom: 15, rTo: 17, width: 9 }) + wedge(c3, h3, { rFrom: 15, rTo: 11, width: 9 });
    s += A(m2, 'CH₃', { r: 17 }) + A(h2, 'H', { r: 11 }) + A(m3, 'CH₃', { r: 17 }) + A(h3, 'H', { r: 11 });
    s += A(c2, 'C') + A(c3, 'C', { kind: 'warn' }) + A(o, 'O', { kind: 'hi' }) + A(br, 'Br', { r: 17 });
    s += lonePair(o.x, o.y, 160) + lonePair(o.x, o.y, 235) + lonePair(o.x, o.y, 320);
    s += sign(169, 106);
    s += lonePair(br.x, br.y, 180, { dist: 24 }) + lonePair(br.x, br.y, 90, { dist: 24 }) + lonePair(br.x, br.y, 0, { dist: 24 });
    s += T(122, 138, 'C2', 'fg-tag', 'end') + T(262, 176, 'C3', 'fg-tag', 'start');
    /* O⁻ lone pair to C3; the C–Br bond onto Br. */
    s += curve(lpAt(o, 320, 24), toward(c3, o, 20), { bow: -18 });
    s += curve(mid(c3, br), P(br.x + 20, br.y - 12), { bow: -14 });
    s += T(190, 266, 'the alkoxide of 3-bromobutan-2-ol');
    s += T(190, 284, 'O⁻ reaches C3 on the side opposite Br', 'fg-tag-good');

    s += arrow(P(392, 150), P(452, 150));
    s += T(422, 138, 'Br⁻ leaves');

    /* Right: trans-2,3-dimethyloxirane. */
    s += itag(610, 30, 'trans', '-2,3-DIMETHYLOXIRANE');
    const q2 = P(572, 156), q3 = P(648, 156), qo = P(610, 96);
    s += B(q2, q3) + B(q2, qo, 15, 16) + B(q3, qo, 15, 16);
    const qm2 = at(q2, 210, 50), qh2 = at(q2, 150, 42), qm3 = at(q3, 330, 50), qh3 = at(q3, 30, 42);
    s += wedge(q2, qm2, { rFrom: 15, rTo: 17, width: 9 }) + hash(q2, qh2, { rFrom: 15, rTo: 11, width: 9 });
    s += hash(q3, qm3, { rFrom: 15, rTo: 17, width: 9 }) + wedge(q3, qh3, { rFrom: 15, rTo: 11, width: 9 });
    s += A(qm2, 'CH₃', { r: 17 }) + A(qh2, 'H', { r: 11 }) + A(qm3, 'CH₃', { r: 17 }) + A(qh3, 'H', { r: 11 });
    s += A(q2, 'C') + A(q3, 'C', { kind: 'warn' }) + A(qo, 'O', { kind: 'hi' });
    s += lonePair(qo.x, qo.y, 225, { dist: 24 }) + lonePair(qo.x, qo.y, 315, { dist: 24 });
    s += T(610, 248, 'CH₃ on a wedge at C2, on a hash at C3:');
    s += T(610, 266, 'the methyls sit on opposite faces', 'fg-tag-good');
    return s;
  },
  caption: 'The orange carbon loses Br and is inverted, yet each wedge stays a wedge and each hash stays a hash.',
});

/* ====================================== 4. opening under base === */
FIGURES.push({
  id: 'epoxide-base-opening',
  section: 'epoxides',
  lessons: ['epoxides'],
  anchor: '<h3>Base-catalyzed opening: SN2 at the less hindered carbon</h3>',
  alt: 'Two stacked panels. Top: 2-methyloxirane and a methoxide ion. The methoxide oxygen sits below and to the left of the CH2 carbon, on the side opposite that carbon’s bond to the ring oxygen. One curved arrow runs from a methoxide lone pair to the CH2 carbon, and a second from the CH2–O ring bond onto the ring oxygen. Bottom: the product, 1-methoxypropan-2-ol, CH3–O–CH2–CH(OH)–CH3, with the new C–O bond highlighted.',
  viewBox: '0 0 340 424',
  build() {
    let s = '';
    s += panel(8, 8, 324, 232);
    s += tag(170, 32, '1 · CH₃O⁻ ATTACKS THE CH₂ FROM THE BACK');
    const o = P(190, 74), ca = P(160, 126), cb = P(220, 126), me = at(cb, 330, 50);
    s += B(ca, cb, 17, 17) + B(ca, o, 17, 15) + B(cb, o, 17, 15) + B(cb, me, 17, 17);
    s += A(o, 'O') + A(ca, 'CH₂', { r: 17, kind: 'hi' }) + A(cb, 'CH', { r: 17 }) + A(me, 'CH₃', { r: 17 });
    s += lonePair(o.x, o.y, 235, { dist: 24 }) + lonePair(o.x, o.y, 305, { dist: 24 });
    /* Methoxide, opposite the CH2–O bond. */
    const nu = at(ca, 240, 80), nme = at(nu, 180, 50);
    s += B(nu, nme, 15, 17) + A(nme, 'CH₃', { r: 17 }) + A(nu, 'O', { kind: 'hi' });
    s += lonePair(nu.x, nu.y, 300) + lonePair(nu.x, nu.y, 60) + lonePair(nu.x, nu.y, 225);
    s += sign(nu.x - 16, nu.y + 30);
    s += curve(lpAt(nu, 300, 24), toward(ca, nu, 20), { bow: -12 });
    s += curve(P(ca.x + 11, ca.y - 22), P(o.x - 17, o.y + 9), { bow: -14 });
    s += T(138, 106, 'less hindered', 'fg-tag-good', 'end');
    s += T(316, 96, 'more hindered', 'fg-tag-warn', 'end');

    s += panel(8, 250, 324, 166);
    s += tag(170, 274, '2 · THE O⁻ TAKES H⁺ FROM METHANOL');
    const y = 346;
    const p0 = P(42, y), p1 = P(96, y), p2 = P(150, y), p3 = P(206, y), p4 = P(262, y), oh = P(206, y - 48);
    s += B(p0, p1, 17, 15) + B(p1, p2, 15, 17, 'fg-bond-hi') + B(p2, p3, 17, 17) + B(p3, p4, 17, 17) + B(p3, oh, 17, 16);
    s += A(p0, 'CH₃', { r: 17 }) + A(p1, 'O', { kind: 'hi' }) + A(p2, 'CH₂', { r: 17, kind: 'hi' });
    s += A(p3, 'CH', { r: 17 }) + A(p4, 'CH₃', { r: 17 }) + A(oh, 'OH', { r: 16 });
    s += T(123, y + 30, 'new bond', 'fg-tag-good');
    s += T(170, 402, '1-methoxypropan-2-ol');
    return s;
  },
  caption: 'Two arrows, one step. The highlighted bond in panel 2 is the one methoxide made.',
});

/* ====================================== 5. opening under acid === */
FIGURES.push({
  id: 'epoxide-acid-opening',
  section: 'epoxides',
  lessons: ['epoxides'],
  anchor: '<h3>Acid-catalyzed opening: attack shifts to the more substituted carbon</h3>',
  alt: 'Three stacked panels for 2,2-dimethyloxirane in methanol with acid. 1: a curved arrow from a ring-oxygen lone pair to H+. 2: the protonated epoxide, the oxygen now carrying an H and a positive charge; the carbon with two methyl groups is marked delta plus, and a methanol molecule below and to its right attacks it from the side opposite its bond to oxygen, with a second curved arrow from that C–O bond onto the positive oxygen. 3: the product, 2-methoxy-2-methylpropan-1-ol, HO–CH2–C(CH3)2–OCH3, with the new C–O bond highlighted.',
  viewBox: '0 0 340 624',
  build() {
    let s = '';
    /* The same epoxide in panels 1 and 2: CH2 on the left, C(CH3)2 on the right. */
    const ring = (y0, kindB) => {
      const o = P(150, y0), ca = P(120, y0 + 52), cb = P(180, y0 + 52);
      const m1 = at(cb, 25, 48), m2 = at(cb, 340, 48);
      let g = B(ca, cb, 17, 15) + B(ca, o, 17, 15) + B(cb, o, 15, 15) + B(cb, m1, 15, 17) + B(cb, m2, 15, 17);
      g += A(ca, 'CH₂', { r: 17 }) + A(cb, 'C', { kind: kindB }) + A(m1, 'CH₃', { r: 17 }) + A(m2, 'CH₃', { r: 17 });
      return { g, o, ca, cb };
    };

    s += panel(8, 8, 324, 164);
    s += tag(170, 32, '1 · H⁺ ADDS TO THE RING OXYGEN');
    {
      const R = ring(70, 'plain');
      s += R.g + A(R.o, 'O', { kind: 'hi' });
      s += lonePair(R.o.x, R.o.y, 215, { dist: 24 }) + lonePair(R.o.x, R.o.y, 320, { dist: 24 });
      const h = P(84, 62);
      s += A(h, 'H⁺', { r: 15, kind: 'warn' });
      s += curve(lpAt(R.o, 215, 24), P(h.x + 17, h.y - 2), { bow: -12 });
      s += T(84, 94, 'from the acid');
    }

    s += panel(8, 182, 324, 236);
    s += tag(170, 206, '2 · CH₃OH ATTACKS THE MORE SUBSTITUTED C');
    {
      const R = ring(262, 'warn');
      s += R.g;
      const h = P(R.o.x, R.o.y - 34);
      s += B(R.o, h, 16, 11) + A(h, 'H', { r: 11 }) + A(R.o, 'O', { kind: 'warn' });
      s += lonePair(R.o.x, R.o.y, 200, { dist: 24 });
      s += sign(R.o.x + 22, R.o.y - 14, '+', 'fg-tag-warn');
      s += T(R.cb.x - 16, R.cb.y + 34, 'δ+', 'fg-tag-warn');
      /* Methanol, opposite the C(CH3)2–O bond. */
      const nu = at(R.cb, 300, 80), nme = at(nu, 0, 50), nh = at(nu, 225, 34);
      s += B(nu, nme, 15, 17) + B(nu, nh, 15, 11) + A(nme, 'CH₃', { r: 17 }) + A(nh, 'H', { r: 11 }) + A(nu, 'O', { kind: 'hi' });
      s += lonePair(nu.x, nu.y, 240) + lonePair(nu.x, nu.y, 300);
      s += curve(lpAt(nu, 240, 24), toward(R.cb, nu, 20), { bow: -12 });
      s += curve(P(R.cb.x - 11, R.cb.y - 22), P(R.o.x + 17, R.o.y + 9), { bow: 14 });
    }

    s += panel(8, 428, 324, 188);
    s += tag(170, 452, '3 · THE EXTRA H⁺ LEAVES');
    {
      const y = 526;
      const p0 = P(46, y), p1 = P(102, y), p2 = P(160, y), p3 = P(216, y), p4 = P(272, y);
      const u = P(160, y - 50), d = P(160, y + 50);
      s += B(p0, p1, 16, 17) + B(p1, p2, 17, 15) + B(p2, p3, 15, 15, 'fg-bond-hi') + B(p3, p4, 15, 17);
      s += B(p2, u, 15, 17) + B(p2, d, 15, 17);
      s += A(p0, 'HO', { r: 16 }) + A(p1, 'CH₂', { r: 17 }) + A(p2, 'C', { kind: 'warn' }) + A(p3, 'O', { kind: 'hi' });
      s += A(p4, 'CH₃', { r: 17 }) + A(u, 'CH₃', { r: 17 }) + A(d, 'CH₃', { r: 17 });
      s += T(196, y - 12, 'new bond', 'fg-tag-good');
      s += T(170, 606, '2-methoxy-2-methylpropan-1-ol');
    }
    return s;
  },
  caption: 'Three steps: the oxygen is protonated, methanol attacks the δ+ carbon from the back, and the extra proton leaves.',
});

/* ============================= 6. one epoxide, two conditions === */
FIGURES.push({
  id: 'epoxide-acid-base-switch',
  section: 'epoxides',
  anchor: '<h3>Same substrate, opposite regiochemistry</h3>',
  alt: 'Two panels for 2,3-epoxy-2-methylbutane, the more substituted ring carbon (two methyl groups) on the left and the less substituted one (a methyl and a hydrogen) on the right. Basic panel: methoxide attacks the right-hand carbon from the side opposite its bond to oxygen, with curved arrows for the attack and for the C–O bond breaking; the product below is 3-methoxy-2-methylbutan-2-ol. Acidic panel: the oxygen carries an H and a positive charge, and methanol attacks the left-hand carbon from the side opposite its bond to oxygen; the product below is 3-methoxy-3-methylbutan-2-ol.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    /* One drawing routine, used for both panels so they cannot drift apart:
       the more substituted carbon (two methyls) on the left, the less
       substituted one (a methyl and an H) on the right. */
    const epoxide = (x0, hit) => {
      const cm = P(x0 + 150, 152), cl = P(x0 + 230, 152), o = P(x0 + 190, 94);
      let g = B(cm, cl) + B(cm, o, 15, 15) + B(cl, o, 15, 15);
      for (const d of [145, 190]) { const m = at(cm, d, 52); g += B(cm, m, 15, 17) + A(m, 'CH₃', { r: 17 }); }
      const m = at(cl, 30, 52), h = at(cl, 250, 42);
      g += B(cl, m, 15, 17) + A(m, 'CH₃', { r: 17 }) + B(cl, h, 15, 11) + A(h, 'H', { r: 11 });
      g += A(cm, 'C', { kind: hit === 'cm' ? 'warn' : 'plain' }) + A(cl, 'C', { kind: hit === 'cl' ? 'warn' : 'plain' });
      return { g, cm, cl, o };
    };
    /* The product, drawn in the same frame: the ring O stays where it was
       as an OH, and the methoxy group sits where the nucleophile came from. */
    const product = (x0, hit) => {
      const cm = P(x0 + 150, 372), cl = P(x0 + 230, 372);
      let g = B(cm, cl);
      for (const d of [145, 190]) { const m = at(cm, d, 52); g += B(cm, m, 15, 17) + A(m, 'CH₃', { r: 17 }); }
      const m = at(cl, 30, 52), h = at(cl, 250, 42);
      g += B(cl, m, 15, 17) + A(m, 'CH₃', { r: 17 }) + B(cl, h, 15, 11) + A(h, 'H', { r: 11 });
      const oh = hit === 'cl' ? at(cm, 58, 46) : at(cl, 122, 46);
      g += B(hit === 'cl' ? cm : cl, oh, 15, 16) + A(oh, 'OH', { r: 16 });
      const on = hit === 'cl' ? at(cl, 305, 52) : at(cm, 235, 52);
      const onMe = at(on, hit === 'cl' ? 0 : 180, 48);
      g += B(hit === 'cl' ? cl : cm, on, 15, 15, 'fg-bond-hi') + B(on, onMe, 15, 17);
      g += A(on, 'O', { kind: 'hi' }) + A(onMe, 'CH₃', { r: 17 });
      g += A(cm, 'C', { kind: hit === 'cm' ? 'warn' : 'plain' }) + A(cl, 'C', { kind: hit === 'cl' ? 'warn' : 'plain' });
      return g;
    };

    /* ---------- basic ---------- */
    s += tag(190, 34, 'BASIC: CH₃O⁻ IN CH₃OH');
    {
      const E = epoxide(0, 'cl');
      s += E.g + A(E.o, 'O', { kind: 'hi' });
      s += lonePair(E.o.x, E.o.y, 235, { dist: 24 }) + lonePair(E.o.x, E.o.y, 305, { dist: 24 });
      const nu = at(E.cl, 305, 76), nme = at(nu, 0, 48);
      s += B(nu, nme, 15, 17) + A(nme, 'CH₃', { r: 17 }) + A(nu, 'O', { kind: 'hi' });
      s += lonePair(nu.x, nu.y, 235) + lonePair(nu.x, nu.y, 110) + lonePair(nu.x, nu.y, 175);
      s += sign(nu.x + 20, nu.y + 28);
      s += curve(lpAt(nu, 235, 24), toward(E.cl, nu, 20), { bow: 12 });
      s += curve(P(E.cl.x - 11, E.cl.y - 22), P(E.o.x + 17, E.o.y + 9), { bow: 14 });
      s += T(190, 272, 'attack at the less substituted carbon');
      s += arrow(P(190, 282), P(190, 310));
      s += product(0, 'cl');
      s += T(190, 458, '3-methoxy-2-methylbutan-2-ol');
    }
    s += rule(380, 24, 380, 460);
    /* ---------- acidic ---------- */
    s += tag(570, 34, 'ACIDIC: CH₃OH WITH A LITTLE H₂SO₄', { cls: 'fg-tag-warn' });
    {
      const E = epoxide(380, 'cm');
      s += E.g;
      const h = P(E.o.x, E.o.y - 36);
      s += B(E.o, h, 16, 11) + A(h, 'H', { r: 11 }) + A(E.o, 'O', { kind: 'warn' });
      s += lonePair(E.o.x, E.o.y, 330, { dist: 24 });
      s += sign(E.o.x - 24, E.o.y - 12, '+', 'fg-tag-warn');
      const nu = at(E.cm, 235, 78), nme = at(nu, 180, 48), nh = at(nu, 270, 34);
      s += B(nu, nme, 15, 17) + B(nu, nh, 15, 11) + A(nme, 'CH₃', { r: 17 }) + A(nh, 'H', { r: 11 }) + A(nu, 'O', { kind: 'hi' });
      s += lonePair(nu.x, nu.y, 305) + lonePair(nu.x, nu.y, 20);
      s += curve(lpAt(nu, 305, 24), toward(E.cm, nu, 20), { bow: -12 });
      s += curve(P(E.cm.x + 11, E.cm.y - 22), P(E.o.x - 17, E.o.y + 9), { bow: -14 });
      s += T(570, 272, 'attack at the more substituted carbon', 'fg-tag-warn');
      s += arrow(P(570, 282), P(570, 310));
      s += product(380, 'cm');
      s += T(570, 458, '3-methoxy-3-methylbutan-2-ol');
    }
    return s;
  },
  caption: 'The orange carbon is the one attacked. In each product the new C–O bond is highlighted and the ring oxygen has become the OH on the neighboring carbon.',
});

/* ============================ 7. cyclohexene oxide: trans diol === */
/* The chair, from ring-flips.mjs: an exact orthographic view of a real
   cyclohexane chair. Index 0 is the right-hand end (axial up), index 1 its
   neighbor (axial down). The flipped chair keeps each carbon's place in
   the drawing and reverses every height. */
const CHAIR_V = [P(113.15, -18.21), P(56.57, -15.31), P(-56.57, -51.72), P(-113.15, 18.21), P(-56.58, 15.31), P(56.57, 51.72)];
const CHAIR_EQ = [P(0.944, 0.329), P(0.613, -0.790), P(-0.994, 0.104), P(-0.944, -0.329), P(-0.613, 0.790), P(0.994, -0.104)];
const SIG = (j) => (6 - j) % 6;
function chair(cx, cy, k, flipped) {
  const src = (j) => (flipped ? SIG(j) : j);
  const pts = [0, 1, 2, 3, 4, 5].map((j) => { const v = CHAIR_V[src(j)]; return P(cx + v.x * k, cy + (flipped ? -v.y : v.y) * k); });
  const axUp = (j) => (j % 2 === 0) !== flipped;
  const onFace = (j, face, L) => {
    if ((face === 'up') === axUp(j)) return { axial: true, end: P(pts[j].x, pts[j].y + (face === 'up' ? -L : L)) };
    const e = CHAIR_EQ[src(j)];
    return { axial: false, end: P(pts[j].x + e.x * L, pts[j].y + (flipped ? -e.y : e.y) * L) };
  };
  return { pts, onFace };
}
const outline = (pts) => pts.map((p, i) => bond(p, pts[(i + 1) % 6], { rFrom: 0, rTo: 0 })).join('');

FIGURES.push({
  id: 'epoxide-anti-opening',
  section: 'epoxides',
  lessons: ['epoxides'],
  anchor: '<h3>Both openings are anti</h3>',
  alt: 'Three stacked panels. 1: cyclohexene oxide drawn as a hexagon with the epoxide oxygen on wedges toward the reader; the oxygen is protonated, and a water molecule behind the page attacks the lower ring carbon, shown with a dashed curved arrow, while a second arrow moves the breaking C–O bond onto the oxygen. 2: the diol as it first forms, on a chair, with the OH on C1 axial pointing up and the OH on C2 axial pointing down. 3: after a ring flip, both OH groups are equatorial; one is still on the top face and one on the bottom face, so the diol is still trans.',
  viewBox: '0 0 340 634',
  build() {
    let s = '';
    s += panel(8, 8, 324, 196);
    s += tag(170, 32, '1 · WATER ATTACKS FROM THE BACK FACE');
    {
      const v = polyPts(96, 108, 6, 34, 30);        // vertices at 30°, 90°, … : v[0] upper right, v[5] lower right
      s += outline(v);
      const o = P(170, 108), h = P(210, 108);
      s += wedge(v[0], o, { rFrom: 0, rTo: 15, width: 8 }) + wedge(v[5], o, { rFrom: 0, rTo: 15, width: 8 });
      s += B(o, h, 16, 11) + A(h, 'H', { r: 11 }) + A(o, 'O', { kind: 'warn' });
      s += sign(154, 90, '+', 'fg-tag-warn');
      s += lonePair(o.x, o.y, 300, { dist: 22 });
      const w = P(160, 172);
      s += A(w, 'H₂O', { r: 18, kind: 'hi' });
      s += lonePair(w.x, w.y, 225, { dist: 24 });
      s += dashedCurve(lpAt(w, 225, 26), P(v[5].x + 2, v[5].y + 12), { bow: -12, size: 7 });
      s += curve(mid(v[5], o, 0.45), P(o.x + 6, o.y + 17), { bow: 16, size: 7 });
      s += T(186, 176, 'behind the page', 'fg-tag', 'start');
      s += T(236, 60, 'the ring O is', 'fg-tag', 'start') + T(236, 76, 'toward you', 'fg-tag', 'start');
    }

    s += panel(8, 214, 324, 206);
    s += tag(170, 238, '2 · AS FIRST FORMED: BOTH OH AXIAL');
    {
      const r = chair(170, 316, 0.85, false);
      const a = r.onFace(0, 'up', 34).end, b = r.onFace(5, 'down', 34).end;
      s += bond(r.pts[0], a, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + bond(r.pts[5], b, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' });
      s += outline(r.pts);
      s += A(a, 'OH', { r: 16, kind: 'hi' }) + A(b, 'OH', { r: 16, kind: 'hi' });
      s += T(r.pts[0].x + 14, r.pts[0].y + 22, 'C1', 'fg-tag', 'start');
      s += T(r.pts[5].x - 12, r.pts[5].y + 4, 'C2', 'fg-tag', 'end');
      s += T(80, 384, 'one OH up,', 'fg-tag-good') + T(80, 400, 'one OH down', 'fg-tag-good');
    }

    s += panel(8, 430, 324, 196);
    s += tag(170, 454, '3 · AFTER A RING FLIP: BOTH EQUATORIAL');
    {
      const r = chair(170, 516, 0.85, true);
      const a = r.onFace(0, 'up', 34).end, b = r.onFace(5, 'down', 34).end;
      s += bond(r.pts[0], a, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' }) + bond(r.pts[5], b, { rFrom: 0, rTo: 16, cls: 'fg-bond-hi' });
      s += outline(r.pts);
      s += A(a, 'OH', { r: 16, kind: 'hi' }) + A(b, 'OH', { r: 16, kind: 'hi' });
      s += T(r.pts[0].x + 14, r.pts[0].y + 24, 'C1', 'fg-tag', 'start');
      s += T(r.pts[5].x - 8, r.pts[5].y + 22, 'C2', 'fg-tag', 'end');
      s += itag(170, 610, 'trans', ': one OH up, one down', 'fg-tag-good', 'still ');
    }
    return s;
  },
  caption: 'Cyclohexene oxide in aqueous acid. Follow the two OH groups from panel 2 to panel 3.',
});

/* ======================================== lesson: click a carbon === */
FIGURES.push({
  id: 'l-dimethyloxirane',
  lessons: ['epoxides'],
  alt: '2,2-Dimethyloxirane: a three-membered ring of an oxygen, numbered 1, and two carbons. Carbon 2 carries two methyl groups; carbon 3 is a CH2.',
  viewBox: '0 0 340 196',
  build() {
    let s = '';
    s += tag(170, 26, '2,2-DIMETHYLOXIRANE');
    const o = P(176, 70), c2 = P(140, 132), c3 = P(212, 132);
    const m1 = at(c2, 180, 54), m2 = at(c2, 245, 52);
    s += B(c2, m1, 15, 17) + B(c2, m2, 15, 17) + A(m1, 'CH₃', { r: 17 }) + A(m2, 'CH₃', { r: 17 });
    s += B(o, c2, 15, 15) + B(o, c3, 15, 17) + B(c2, c3, 15, 17);
    s += A(o, 'O') + A(c2, 'C') + A(c3, 'CH₂', { r: 17 });
    s += lonePair(o.x, o.y, 235, { dist: 24 }) + lonePair(o.x, o.y, 305, { dist: 24 });
    s += T(206, 62, '1', 'fg-tag-good') + T(126, 106, 'C2', 'fg-tag-good') + T(242, 118, 'C3', 'fg-tag-good', 'start');
    return s;
  },
  caption: 'The epoxide made from 2-methylpropene.',
});

export default FIGURES;
