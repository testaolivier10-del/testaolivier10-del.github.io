/* Figures for the lewis-acids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Lewis acids/bases closes Acids & Bases, so skeletal drawing is allowed, but
   the small species here (BF3, NH3, water, H+, TiCl4, AlCl3) are drawn with
   every atom labeled. Each drawing is a real reaction: reactants with their
   curved arrows, and products with every formal charge in place.

   Lone pairs on the halogens of BF3, TiCl4 and AlCl3 are left off; a caption
   says so where it matters. Lone pairs are drawn on every atom that donates
   or ends up charged.

   Notes figures run up to 760 wide. The lesson copies (ids that start with
   l-) stack their panels at 340 wide and use only fg-lbl and fg-tag text. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, rule, panel, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers ---
   `at` walks from a point at a screen angle (0 east, 90 down). A molecule is
   { atoms, bonds, lp, charges }: atoms map an id to {x, y, l, k, r}; an atom
   with no label is a skeletal vertex (a carbon). Bonds are
   [a, b, kind, cls] where kind is 1, 2, 3, 'w' (wedge) or 'h' (hash).
   `lp` is [id, angle]; `charges` is [id, sign, angle, dist]. */
const r2 = (v) => Math.round(v * 100) / 100;
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const rad = (a) => a.r ?? (!a.l ? 0 : a.l === 'H' ? 11 : a.l.length === 1 ? 14 : a.l.length === 2 ? 15 : 18);

function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [a, b, kind = 1, cls] of m.bonds || []) {
    const o = { rFrom: rad(A[a]), rTo: rad(A[b]) };
    if (kind === 'w') s += wedge(A[a], A[b], { ...o, width: 9 });
    else if (kind === 'h') s += hash(A[a], A[b], { ...o, width: 10, rungs: 5 });
    else s += bond(A[a], A[b], { ...o, order: kind, cls, gap: 3.6 });
  }
  for (const [id, ang] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, { dist: rad(A[id]) + 8 });
  for (const id of Object.keys(A)) {
    const a = A[id];
    if (a.l) s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a), size: a.l.length > 2 ? 10.5 : a.l.length > 1 ? 11.5 : 12.5 });
  }
  for (const [id, sign, ang, dist = 26] of m.charges || []) s += charge(at(A[id], ang, dist), sign);
  return s;
}
const charge = (p, sign) => text(p.x, p.y + 5, sign, { cls: sign === '+' ? 'fg-tag-warn' : 'fg-tag', size: 15 });

/* Substituents on atom `id` at the given screen angles: [angle, label, kind, cls]. */
function arms(m, id, list, len = 44) {
  list.forEach(([ang, l, kind = 1, cls], i) => {
    const k = `${id}_${i}`;
    m.atoms[k] = { ...at(m.atoms[id], ang, len), l };
    m.bonds.push([id, k, kind, cls]);
  });
  return m;
}

const tg = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag', size: 11, anchor });
const mut = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-mut', size: 11, anchor });
const warn = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-warn', size: 11, anchor });
/* A tag whose first word is an italic prefix such as tert. */
const itTag = (x, y, it, rest, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="11"><tspan font-style="italic">${it}</tspan>${rest}</text>`;

function ell(cx, cy, rx, ry, cls) {
  return `<ellipse class="${cls}" cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}"></ellipse>`;
}
/* A p orbital standing straight up and down through an atom. `empty` draws
   both lobes as dashed outlines; otherwise the two phase colors. */
function pUp(c, len = 36, w = 12, empty = false) {
  const top = ell(c.x, c.y - len / 2 - 2, w, len / 2, empty ? 'fg-orb-node' : 'fg-orb');
  const bot = ell(c.x, c.y + len / 2 + 2, w, len / 2, empty ? 'fg-orb-node' : 'fg-orb-alt');
  return top + bot;
}
/* A flat plane seen from slightly above, as a dashed parallelogram. */
const plane = (cx, cy, w, h, skew = 22) =>
  `<path class="fg-dash" d="M${r2(cx - w / 2 + skew)} ${r2(cy - h / 2)} L${r2(cx + w / 2 + skew)} ${r2(cy - h / 2)} L${r2(cx + w / 2 - skew)} ${r2(cy + h / 2)} L${r2(cx - w / 2 - skew)} ${r2(cy + h / 2)} Z"></path>`;

/* ------------------------------------------------------- BF3 + NH3 ---
   BF3 flat in a plane seen from slightly above, with its empty p orbital
   standing through the plane; NH3 above it with its lone pair pointing down
   at boron. B is at `b`. */
function bf3nh3(b) {
  let s = '';
  s += plane(b.x, b.y, 170, 70, 26);
  s += pUp(b, 64, 13, true);
  const m = { atoms: { B: { ...b, l: 'B', k: 'warn', r: 16 } }, bonds: [] };
  // three F in the plane: right, back left, front left (squashed circle)
  const K = 0.42, L = 72;
  [0, 125, 235].forEach((phi, i) => {
    const f = P(b.x + Math.cos(phi * Math.PI / 180) * L, b.y - Math.sin(phi * Math.PI / 180) * L * K);
    m.atoms['F' + i] = { ...f, l: 'F', r: 13 };
    m.bonds.push(['B', 'F' + i]);
  });
  s += mol(m);
  // ammonia above, lone pair down
  const n = P(b.x, b.y - 128);
  const a = { atoms: { N: { ...n, l: 'N', k: 'hi', r: 16 } }, bonds: [], lp: [['N', 90]] };
  arms(a, 'N', [[208, 'H'], [332, 'H', 'w'], [270, 'H', 'h']], 42);
  s += mol(a);
  s += curve(P(b.x + 7, n.y + 26), P(b.x + 7, b.y - 18), { bow: -26 });
  return s;
}

/* F3B–NH3 drawn upright, N at `n`, B below it; both tetrahedral. */
function adduct(n) {
  const b = P(n.x, n.y + 70);
  const m = {
    atoms: { N: { ...n, l: 'N', k: 'hi', r: 16 }, B: { ...b, l: 'B', k: 'warn', r: 16 } },
    bonds: [['N', 'B', 1, 'fg-bond-hi']],
    charges: [['N', '+', 20, 27], ['B', '−', 340, 27]],
  };
  arms(m, 'N', [[208, 'H'], [332, 'H', 'w'], [270, 'H', 'h']], 42);
  arms(m, 'B', [[152, 'F'], [28, 'F', 'w'], [90, 'F', 'h']], 44);
  for (const k of ['B_0', 'B_1', 'B_2']) m.atoms[k].r = 13;
  return mol(m);
}

FIGURES.push({
  id: 'bf3-nh3-adduct',
  section: 'lewis-acids',
  anchor: 'BF₃ is the acid and NH₃ is the base.</p>',
  alt: 'Left: BF3 lying flat in a plane seen from slightly above, three fluorines 120 degrees apart around boron, with an empty p orbital drawn as two dashed lobes standing straight up and down through boron. Ammonia sits above it, its lone pair pointing down; one curved arrow runs from that lone pair to boron. Right: the product F3B–NH3 with a new B–N bond, nitrogen plus one and boron minus one, both now tetrahedral with a wedge and a hashed bond each.',
  viewBox: '0 0 760 340',
  build() {
    let s = '';
    const b = P(200, 212);
    s += bf3nh3(b);
    s += tg(312, 70, 'NH₃: has a lone pair', 'start');
    s += tg(312, 86, 'the Lewis base', 'start');
    s += tg(182, 160, 'empty p orbital', 'end');
    s += tg(200, 306, 'BF₃: flat, 120° between bonds', 'middle');
    s += warn(200, 324, 'the Lewis acid', 'middle');
    s += arrow(P(410, 190), P(480, 190));
    const n = P(600, 128);
    s += adduct(n);
    s += tg(600, 40, 'the adduct, F₃B–NH₃');
    s += tg(584, 170, 'new B–N bond', 'end');
    s += tg(600, 306, 'B: four bonds, tetrahedral, 109.5°');
    s += warn(600, 324, 'N +1, B −1');
    return s;
  },
  caption: 'Follow the arrow from nitrogen’s lone pair into boron’s empty p orbital. Then compare boron’s shape before and after. The fluorines’ own lone pairs are left off.',
});

FIGURES.push({
  id: 'l-bf3-nh3-adduct',
  lessons: ['lewis-acids'],
  alt: 'Top: BF3 lying flat in a plane with an empty p orbital drawn as two dashed lobes through boron, and ammonia above it with its lone pair pointing down; one curved arrow runs from the lone pair to boron. Bottom: the product F3B–NH3 with a new B–N bond, nitrogen plus one and boron minus one, both tetrahedral.',
  viewBox: '0 0 340 620',
  build() {
    let s = '';
    s += panel(6, 6, 328, 324);
    const b = P(160, 210);
    s += bf3nh3(b);
    s += tg(208, 104, 'NH₃: lone pair', 'start');
    s += tg(142, 160, 'empty p', 'end');
    s += tg(170, 302, 'BF₃: flat, 120°');
    s += warn(170, 320, 'accepts the pair');
    s += arrow(P(170, 334), P(170, 362));
    s += panel(6, 366, 328, 248);
    const n = P(170, 432);
    s += adduct(n);
    s += tg(154, 472, 'new bond', 'end');
    s += tg(170, 584, 'B: tetrahedral, 109.5°');
    s += warn(170, 602, 'N +1, B −1');
    return s;
  },
  caption: 'Top panel: before. Bottom panel: after. Compare the shape around boron.',
});

/* ------------------------------------------------ TiCl4 + acetone ---
   The count is the point: four bonds to titanium before, five after. */
function acetone(o, dir = 1) {
  // C=O horizontal, the carbon on the side `dir` points to (1 = right)
  const c = P(o.x + 58 * dir, o.y);
  const m = {
    atoms: {
      O: { ...o, l: 'O', k: 'hi', r: 15 }, C: { ...c, l: 'C', r: 14 },
      M1: { ...at(c, dir > 0 ? 300 : 240, 48), l: 'CH₃' },
      M2: { ...at(c, dir > 0 ? 60 : 120, 48), l: 'CH₃' },
    },
    bonds: [['O', 'C', 2], ['C', 'M1'], ['C', 'M2']],
    lp: [],
  };
  return m;
}

FIGURES.push({
  id: 'ticl4-coordination',
  section: 'lewis-acids',
  anchor: 'oxygen ends up +1 and titanium −1.</p>',
  alt: 'Left: TiCl4, titanium with four chlorines at the corners of a tetrahedron, and acetone, (CH3)2C=O, whose oxygen carries two lone pairs; a curved arrow runs from one oxygen lone pair to titanium. Right: the product, titanium now bonded to five atoms, four chlorines and the acetone oxygen. Oxygen keeps one lone pair and is plus one; titanium is minus one.',
  viewBox: '0 50 760 240',
  build() {
    let s = '';
    // TiCl4
    const ti = P(130, 150);
    const t = { atoms: { Ti: { ...ti, l: 'Ti', k: 'warn', r: 17 } }, bonds: [] };
    arms(t, 'Ti', [[270, 'Cl'], [150, 'Cl'], [30, 'Cl', 'w'], [80, 'Cl', 'h']], 52);
    s += mol(t);
    s += tg(130, 256, 'TiCl₄: four bonds to Ti');
    // acetone, oxygen facing titanium
    const o = P(272, 124);
    const a = acetone(o, 1);
    a.lp = [['O', 150], ['O', 210]];
    s += mol(a);
    s += tg(330, 256, 'acetone, (CH₃)₂C=O');
    s += curve(P(o.x - 24, o.y - 12), P(ti.x + 20, ti.y - 12), { bow: 26 });
    s += arrow(P(410, 150), P(470, 150));
    // the complex
    const ti2 = P(540, 150);
    const p = { atoms: { Ti: { ...ti2, l: 'Ti', k: 'warn', r: 17 } }, bonds: [], charges: [['Ti', '−', 315, 30]] };
    arms(p, 'Ti', [[270, 'Cl'], [90, 'Cl'], [150, 'Cl', 'w'], [210, 'Cl', 'h']], 54);
    // the fifth bond, to oxygen, straight out to the right
    // Ti–O–C is bent at oxygen (three electron domains)
    const o2 = P(ti2.x + 68, ti2.y);
    const c2 = at(o2, 330, 58);
    p.atoms.O = { ...o2, l: 'O', k: 'hi', r: 15 };
    p.atoms.C = { ...c2, l: 'C', r: 14 };
    p.atoms.M1 = { ...at(c2, 270, 48), l: 'CH₃' };
    p.atoms.M2 = { ...at(c2, 30, 48), l: 'CH₃' };
    p.bonds.push(['Ti', 'O', 1, 'fg-bond-hi'], ['O', 'C', 2], ['C', 'M1'], ['C', 'M2']);
    p.lp = [['O', 80]];
    p.charges.push(['O', '+', 250, 27]);
    s += mol(p);
    s += tg(600, 256, 'five bonds to Ti');
    s += warn(600, 274, 'O +1, Ti −1');
    return s;
  },
  caption: 'Count the bonds to titanium on each side of the reaction arrow. The chlorines’ lone pairs are left off.',
});

/* ---------------------------------------------- ethene donates its pi pair ---
   Ethene side on, the pi pair drawn as two clouds above and below the C–C
   line. `withH` adds H–Br above the left carbon and the two arrows. */
function etheneTop(y, withH) {
  let s = '';
  const A = P(128, y), B = P(212, y);
  s += plane(170, y, 250, 58, 24);
  // pi: sideways overlap above and below the C–C axis
  s += ell(170, y - 36, 64, 14, 'fg-orb');
  s += ell(170, y + 36, 64, 14, 'fg-orb-alt');
  const m = { atoms: { A: { ...A, l: 'C', k: 'hi', r: 14 }, B: { ...B, l: 'C', k: 'hi', r: 14 } }, bonds: [['A', 'B']] };
  const K = 0.42, L = 58;
  const inP = (c, phi) => P(c.x + Math.cos(phi * Math.PI / 180) * L, c.y - Math.sin(phi * Math.PI / 180) * L * K);
  [[A, 150], [A, 210], [B, 30], [B, 330]].forEach(([c, phi], i) => {
    m.atoms['H' + i] = { ...inP(c, phi), l: 'H' };
    m.bonds.push([c === A ? 'A' : 'B', 'H' + i]);
  });
  s += mol(m);
  if (withH) {
    // H–Br above the left carbon: arrow 1 from the pi pair to H,
    // arrow 2 from the H–Br bond onto Br
    const h = P(112, y - 96), br = P(176, y - 118);
    s += bond(h, br, { rFrom: 12, rTo: 15 });
    s += atom(h.x, h.y, 'H', { kind: 'warn', r: 12 });
    s += atom(br.x, br.y, 'Br', { r: 15, size: 11.5 });
    for (const a of [300, 30, 80]) s += lonePair(br.x, br.y, a, { dist: 23 });
    s += curve(P(150, y - 50), P(h.x + 8, h.y + 14), { bow: 14 });
    const mHB = P((h.x + br.x) / 2, (h.y + br.y) / 2);
    s += curve(P(mHB.x - 2, mHB.y - 6), at(br, 215, 19), { bow: -14 });
  }
  return s;
}

FIGURES.push({
  id: 'l-ethene-pi',
  lessons: ['lewis-acids'],
  alt: 'Ethene, CH2=CH2, lying flat in a plane seen from slightly above, the two carbons joined along a horizontal line. The pi bond is drawn as two clouds, one above and one below that line.',
  viewBox: '0 20 340 166',
  build() {
    let s = '';
    s += etheneTop(104, false);
    s += tg(170, 40, 'π bond');
    s += tg(170, 172, 'above and below the C–C line');
    return s;
  },
  caption: 'Ethene seen from the side. The σ bond runs along the C–C line; the π bond lies above and below it.',
});

FIGURES.push({
  id: 'ethene-pi-donor',
  section: 'lewis-acids',
  lessons: ['lewis-acids'],
  anchor: 'The acceptor is the H⁺ that HBr hands over.</p>',
  alt: 'Top: ethene lying flat in a plane, its pi pair drawn as two clouds above and below the C–C line, and H–Br above the left carbon. One curved arrow runs from the upper pi cloud to the H; a second runs from the H–Br bond onto bromine. Bottom: the product, a CH3 carbon joined to a CH2 carbon. The new C–H bond on the left carbon is highlighted. The right carbon has three bonds, a positive charge and an empty p orbital drawn as dashed lobes. Bromide, Br−, is the other product.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    s += panel(6, 6, 328, 222);
    s += etheneTop(150, true);
    s += tg(204, 30, 'H–Br supplies the H⁺', 'start');
    s += tg(66, 100, 'π pair', 'middle');
    s += arrow(P(170, 232), P(170, 258));
    s += panel(6, 264, 328, 170);
    const A = P(124, 346), B = P(214, 346);
    s += pUp(B, 52, 9, true);
    const m = {
      atoms: { A: { ...A, l: 'C', r: 14 }, B: { ...B, l: 'C', k: 'warn', r: 14 } },
      bonds: [['A', 'B']],
      charges: [['B', '+', 225, 30]],
    };
    arms(m, 'A', [[270, 'H', 1, 'fg-bond-hi'], [200, 'H', 'w'], [130, 'H', 'h']], 40);
    // B is flat: its two H lie in a plane seen from slightly above
    m.atoms.Hb1 = { ...P(B.x + 48, B.y - 20), l: 'H' };
    m.atoms.Hb2 = { ...P(B.x + 48, B.y + 20), l: 'H' };
    m.bonds.push(['B', 'Hb1'], ['B', 'Hb2']);
    s += mol(m);
    s += tg(144, 300, 'new C–H', 'start');
    s += tg(232, 296, 'empty p', 'start');
    s += warn(170, 422, 'a carbocation');
    s += text(282, 404, 'Br⁻', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(268, 404, '+', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'Arrow 1 runs from the π pair to the H of H–Br; arrow 2 moves the H–Br bonding pair onto bromine. In the product, find the highlighted C–H bond and the empty p orbital.',
});

/* ------------------------------------------- a carbocation meets water ---
   Top row: the Lewis step (one arrow). Bottom row: the Brønsted step that
   follows (two arrows). Methyl groups are skeletal ends. */
function tBuCation(c) {
  const m = { atoms: { C: { ...c, l: 'C', k: 'warn', r: 16 } }, bonds: [] };
  // three methyls in a flat plane seen from slightly above
  [0, 125, 235].forEach((phi, i) => {
    m.atoms['C_' + i] = { ...P(c.x + Math.cos(phi * Math.PI / 180) * 52, c.y - Math.sin(phi * Math.PI / 180) * 52 * 0.42), l: '' };
    m.bonds.push(['C', 'C_' + i]);
  });
  return m;
}
/* (CH3)3C–O with the oxygen straight out to the right of the central carbon;
   `oh` lists [angle, label] for what else the oxygen carries. */
function tBuO(c, oh, oKind) {
  const m = { atoms: { C: { ...c, l: 'C', r: 15 } }, bonds: [] };
  arms(m, 'C', [[270, ''], [180, ''], [90, '']], 46);
  m.atoms.O = { ...P(c.x + 66, c.y), l: 'O', k: oKind, r: 15 };
  m.bonds.push(['C', 'O']);
  arms(m, 'O', oh, 42);
  return m;
}
function water(o, lpAngles, k = 'hi') {
  const m = { atoms: { O: { ...o, l: 'O', k, r: 15 } }, bonds: [], lp: lpAngles.map((a) => ['O', a]) };
  return m;
}

FIGURES.push({
  id: 'carbocation-lewis-acid',
  section: 'lewis-acids',
  anchor: 'one per step, and that is common.</p>',
  alt: 'Two rows. Top row: the tert-butyl cation, a positive carbon with three methyl groups and an empty p orbital, meets water; one curved arrow runs from a lone pair on the water oxygen to the positive carbon, giving an oxonium ion in which carbon is neutral and the oxygen, now with three bonds and one lone pair, is plus one. Bottom row: a second water molecule removes a proton from that oxonium ion; one arrow runs from the water lone pair to the hydrogen and a second from the O–H bond onto the oxonium oxygen, giving tert-butyl alcohol and hydronium, H3O+.',
  viewBox: '0 0 760 540',
  build() {
    let s = '';
    s += tg(380, 22, 'THE LEWIS STEP: ONE ARROW, NO PROTON');
    // ---- row 1 ----
    const c = P(120, 140);
    s += pUp(c, 50, 9, true);
    s += mol(tBuCation(c));
    s += charge(P(c.x - 26, c.y - 30), '+');
    s += mut(c.x + 14, c.y - 62, 'empty p', 'start');
    s += itTag(120, 226, 'tert', '-butyl cation');
    s += mut(120, 244, 'six electrons, empty p');
    const o = P(310, 110);
    const w = water(o, [150, 205]);
    arms(w, 'O', [[330, 'H'], [40, 'H']], 42);
    s += mol(w);
    s += tg(330, 190, 'water, the Lewis base');
    s += curve(P(o.x - 25, o.y + 12), P(c.x + 20, c.y - 4), { bow: -30 });
    s += arrow(P(420, 140), P(470, 140));
    // product: oxonium ion
    const p = tBuO(P(540, 140), [[315, 'H'], [45, 'H']], 'warn');
    p.bonds[p.bonds.findIndex((bd) => bd[1] === 'O')][3] = 'fg-bond-hi';
    p.lp = [['O', 250]];
    p.charges = [['O', '+', 0, 27]];
    s += mol(p);
    s += tg(580, 226, 'an oxonium ion');
    s += warn(580, 244, 'C neutral, O +1');
    s += rule(20, 272, 740, 272);
    // ---- row 2 ----
    s += tg(380, 300, 'THE BRØNSTED STEP THAT FOLLOWS: TWO ARROWS');
    const q = tBuO(P(80, 410), [[315, 'H'], [45, 'H']], 'warn');
    q.lp = [['O', 250]];
    q.charges = [['O', '+', 0, 27]];
    s += mol(q);
    const o3 = q.atoms.O, hx = q.atoms.O_1;   // the H that leaves
    const o4 = P(hx.x + 96, hx.y + 4);
    const w2 = water(o4, [180, 235]);
    arms(w2, 'O', [[315, 'H'], [45, 'H']], 42);
    s += mol(w2);
    // arrow 1: water lone pair to that H; arrow 2: O–H bond onto the oxonium O
    s += curve(P(o4.x - 28, o4.y - 4), P(hx.x + 13, hx.y + 2), { bow: 18 });
    const mOH = P((o3.x + hx.x) / 2, (o3.y + hx.y) / 2);
    s += curve(P(mOH.x + 2, mOH.y + 8), at(o3, 115, 18), { bow: -20 });
    s += tg(120, 510, 'the oxonium ion');
    s += tg(300, 510, 'a second water');
    s += arrow(P(380, 420), P(430, 420));
    // products: tert-butyl alcohol and hydronium
    const r = tBuO(P(490, 420), [[315, 'H']]);
    r.lp = [['O', 235], ['O', 80]];
    s += mol(r);
    s += itTag(540, 510, 'tert', '-butyl alcohol');
    const o6 = P(684, 420);
    const h3o = water(o6, [270], 'warn');
    arms(h3o, 'O', [[150, 'H'], [30, 'H'], [90, 'H']], 42);
    h3o.charges = [['O', '+', 330, 30]];
    s += mol(h3o);
    s += tg(684, 510, 'hydronium, H₃O⁺');
    return s;
  },
  caption: 'Top row: one arrow; track where the + sign goes. Bottom row: two arrows, as in any proton transfer.',
});

/* --------------------------------------- preview: AlCl3 + acetyl chloride ---
   Row 1: the chlorine of acetyl chloride gives a lone pair to aluminum.
   Row 2: the C–Cl bond breaks, leaving the acylium ion and AlCl4−. */
function acylChloride(c) {
  const m = {
    atoms: {
      C: { ...c, l: 'C', r: 14 },
      O: { ...P(c.x, c.y - 58), l: 'O', r: 15 },
      M: { ...at(c, 150, 50), l: 'CH₃' },
      Cl: { ...at(c, 30, 56), l: 'Cl', k: 'hi', r: 15 },
    },
    bonds: [['C', 'O', 2], ['C', 'M'], ['C', 'Cl']],
    lp: [['O', 225], ['O', 315]],
  };
  return m;
}
function alcl3(al, list) {
  const m = { atoms: { Al: { ...al, l: 'Al', k: 'warn', r: 16 } }, bonds: [] };
  arms(m, 'Al', list, 50);
  for (const k of Object.keys(m.atoms)) if (k !== 'Al') m.atoms[k].r = 15;
  return m;
}
/* The complex CH3C(=O)–Cl+–AlCl3−; carbonyl carbon at c. */
function acylComplex(c) {
  const m = acylChloride(c);
  const cl = m.atoms.Cl;
  const al = at(cl, 0, 62);
  const a = alcl3(al, [[270, 'Cl'], [25, 'Cl', 'w'], [335, 'Cl', 'h']]);
  const out = {
    atoms: { ...m.atoms, ...a.atoms },
    bonds: [...m.bonds, ...a.bonds, ['Cl', 'Al', 1, 'fg-bond-hi']],
    lp: [...m.lp, ['Cl', 120], ['Cl', 290]],
    charges: [['Cl', '+', 60, 27], ['Al', '−', 225, 28]],
  };
  return out;
}

FIGURES.push({
  id: 'alcl3-acylium',
  section: 'lewis-acids',
  anchor: 'So the Lewis acid does not supply the electrophile; it manufactures one.</p>',
  alt: 'A preview in two rows. Top row: acetyl chloride, CH3COCl, and AlCl3; a curved arrow runs from a lone pair on the acetyl chloride chlorine to aluminum, giving a complex in which that chlorine is bonded to both carbon and aluminum, chlorine plus one and aluminum minus one. Bottom row: in the complex, a curved arrow runs from the C–Cl bond onto the chlorine; the bond breaks, leaving the acylium ion, CH3–C≡O+, drawn straight with a triple bond and a lone pair on the positive oxygen, and AlCl4−; a second curved arrow runs from an oxygen lone pair into the C–O bond, making it a triple bond.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    s += tg(380, 22, 'A PREVIEW OF AROMATIC CHEMISTRY');
    // ---- row 1 ----
    const c = P(104, 150);
    const ac = acylChloride(c);
    ac.lp.push(['Cl', 300], ['Cl', 30], ['Cl', 120]);
    s += mol(ac);
    s += tg(110, 222, 'acetyl chloride');
    const al = P(300, 150);
    s += mol(alcl3(al, [[270, 'Cl'], [30, 'Cl'], [150, 'Cl']]));
    s += tg(300, 222, 'AlCl₃: six electrons on Al');
    const cl = ac.atoms.Cl;
    const lpPt = at(cl, 30, 23);
    s += curve(P(lpPt.x + 4, lpPt.y - 4), P(al.x - 18, al.y - 6), { bow: -22 });
    s += arrow(P(372, 140), P(412, 140));
    const c2 = P(484, 150);
    s += mol(acylComplex(c2));
    s += tg(590, 222, 'Cl +1, Al −1');
    s += rule(20, 246, 740, 246);
    // ---- row 2 ----
    const c3 = P(104, 380);
    const cx = acylComplex(c3);
    s += mol(cx);
    const clB = cx.atoms.Cl;
    const midB = P((c3.x + clB.x) / 2, (c3.y + clB.y) / 2);
    s += curve(P(midB.x - 3, midB.y - 7), at(clB, 245, 18), { bow: -16 });
    // arrow 2: an O lone pair moves in to make a third C–O bond
    const oB = cx.atoms.O;
    s += curve(P(oB.x + 20, oB.y - 18), P(oB.x + 6, oB.y + 30), { bow: -22 });
    s += tg(170, 454, 'C–Cl breaks; C≡O forms');
    s += arrow(P(320, 370), P(372, 370));
    // acylium ion: CH3–C≡O+, straight
    const k = P(480, 370);
    const acy = {
      atoms: {
        M: { ...P(k.x - 56, k.y), l: 'CH₃' },
        C: { ...k, l: 'C', r: 14 },
        O: { ...P(k.x + 56, k.y), l: 'O', k: 'warn', r: 15 },
      },
      bonds: [['M', 'C'], ['C', 'O', 3]],
      lp: [['O', 0]],
      charges: [['O', '+', 300, 28]],
    };
    s += mol(acy);
    s += tg(490, 424, 'the acylium ion');
    s += mut(490, 442, 'straight: 180° at C');
    s += text(630, 375, '+', { cls: 'fg-lbl', size: 13 });
    s += text(690, 375, 'AlCl₄', { cls: 'fg-lbl', size: 13 });
    s += charge(P(715, 364), '−');
    return s;
  },
  caption: 'A preview only. Top row: one arrow, and a Cl–Al bond forms. Bottom row: two arrows. The C–Cl bond breaks, and an oxygen lone pair makes the third C–O bond. The chlorines on aluminum are drawn without their lone pairs.',
});

export default FIGURES;
