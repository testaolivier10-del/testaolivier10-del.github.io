/* Figures for the eas notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every mechanism here is drawn with its curved arrows: which pair moves,
   which bond forms, which bond breaks. Rings are Kekulé structures, so the
   pi bond that attacks is a real line on the page. Lone pairs are drawn only
   where an arrow starts or where a charge depends on them; the halogens on
   Fe and Al are drawn without theirs, and a caption says so.

   Notes figures run up to 760 wide. Lesson copies (ids that start with l-)
   stack their panels at 340 wide and use only fg-lbl and fg-tag text. */
import { atom as atom0, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

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

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
/* Walk from p at a screen angle (0 east, 90 down). */
const at = (p, deg, len) => P(p.x + Math.cos(deg * Math.PI / 180) * len, p.y + Math.sin(deg * Math.PI / 180) * len);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
/* A point pushed d further out along the line from c through p. */
const away = (c, p, d) => {
  const dx = p.x - c.x, dy = p.y - c.y, l = Math.hypot(dx, dy) || 1;
  return P(p.x + dx / l * d, p.y + dy / l * d);
};

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rad = (a) => a.r ?? (!a.l ? 0 : a.l === 'H' ? 11 : a.l.length === 1 ? 14 : a.l.length === 2 ? 15 : a.l.length <= 4 ? 19 : 24);

/* A molecule: { atoms, bonds, lp, charges }. Atoms map an id to
   {x, y, l, k, r}; an atom with no label is a ring or chain vertex. Bonds
   are [a, b, kind, cls], kind 1, 2, 3, 'w' (wedge) or 'h' (hash). lp is
   [id, angle]; charges are [id, sign, angle, dist]. */
function mol(m) {
  const A = m.atoms;
  let s = '';
  for (const [a, b, kind = 1, cls] of m.bonds || []) {
    const o = { rFrom: rad(A[a]), rTo: rad(A[b]) };
    if (kind === 'w') s += wedge(A[a], A[b], { ...o, width: 9 });
    else if (kind === 'h') s += hash(A[a], A[b], { ...o, width: 10, rungs: 5 });
    else s += bond(A[a], A[b], { ...o, order: kind, cls, gap: 3.6 });
  }
  for (const [id, ang] of m.lp || []) s += lonePair(A[id].x, A[id].y, ang, { dist: rad(A[id]) + 7 });
  for (const id of Object.keys(A)) {
    const a = A[id];
    if (a.l) s += atom(a.x, a.y, a.l, { kind: a.k, r: rad(a), size: a.l.length > 4 ? 10 : a.l.length > 2 ? 10.5 : a.l.length > 1 ? 11.5 : 12.5 });
  }
  for (const [id, sign, ang, dist = 26] of m.charges || []) s += charge(at(A[id], ang, dist), sign);
  return s;
}
const charge = (p, sign) => text(p.x, p.y + 5, sign, { cls: sign === '+' ? 'fg-tag-warn' : 'fg-tag', size: 15 });

/* Substituents on atom `id` at screen angles: [angle, label, kind, cls]. */
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
const good = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-tag-good', size: 11, anchor });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
/* A tag whose first word is an italic prefix such as tert. */
const itTag = (x, y, it, rest, cls = 'fg-tag', anchor = 'middle') =>
  `<text class="${cls}" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" font-size="11"><tspan font-style="italic">${it}</tspan>${rest}</text>`;

/* A six-membered ring. Vertex 0 sits at screen angle `rot` from the centre
   (-90 puts it at the top) and the rest follow clockwise. Edge i joins
   vertex i to vertex i+1; `doubles` lists the edges drawn double. */
function hexV(c, R, rot = -90) {
  return Array.from({ length: 6 }, (_, i) => at(c, rot + 60 * i, R));
}
function ring(c, R, doubles = [], o = {}) {
  const v = hexV(c, R, o.rot ?? -90);
  let s = '';
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    const cls = (o.hi || []).includes(i) ? 'fg-bond-hi' : undefined;
    s += doubles.includes(i)
      ? ringDouble(v[i], v[j], c, { inset: o.inset ?? R * 0.2, gap: o.gap ?? 4.2, cls })
      : bond(v[i], v[j], { rFrom: 0, rTo: 0, cls });
  }
  return { s, v };
}
const edge = (v, i) => mid(v[i], v[(i + 1) % 6]);
/* A substituent on ring vertex `p`, pointing straight out from the centre. */
function sub(c, p, l, o = {}) {
  const len = o.len ?? 34;
  const q = away(c, p, len);
  const r = o.r ?? rad({ l });
  return bond(p, q, { rFrom: 0, rTo: r, cls: o.cls }) + atom(q.x, q.y, l, { kind: o.kind, r, size: l.length > 4 ? 10 : l.length > 2 ? 10.5 : l.length > 1 ? 11.5 : 12.5 });
}
/* A '+' just outside ring vertex p. */
const ringPlus = (c, p, d = 15) => charge(away(c, p, d), '+');

/* The arenium ion: vertex 0 is the sp3 carbon, carrying E on a wedge
   (up-left) and H on a hash (up-right); the positive charge is on vertex
   `plus` and the two remaining pi bonds are the `doubles`. */
function arenium(c, R, o = {}) {
  const { s: rs, v } = ring(c, R, o.doubles ?? [2, 4]);
  let s = rs;
  const E = at(v[0], 238, o.eLen ?? 40), H = at(v[0], 302, 36);
  const eR = o.tBu ? 0 : (o.eR ?? rad({ l: o.E ?? 'E' }));
  s += wedge(v[0], E, { rFrom: 0, rTo: eR, width: 9 });
  if (o.tBu) {
    // a skeletal tert-butyl: three methyl lines from the quaternary carbon
    for (const d of [178, 298, 238]) s += bond(E, at(E, d, 26), { rFrom: 0, rTo: 0 });
  } else {
    s += atom(E.x, E.y, o.E ?? 'E', { kind: 'hi', r: eR, size: (o.E ?? 'E').length > 2 ? 10.5 : 12.5 });
  }
  if (o.H !== false) {
    s += hash(v[0], H, { rFrom: 0, rTo: 11, width: 10, rungs: 5 });
    s += atom(H.x, H.y, 'H', { r: 11 });
  }
  if (o.plus !== null) s += ringPlus(c, v[o.plus ?? 1]);
  return { s, v, E, H };
}

/* A reaction arrow with a label above (and optionally below). */
function rxn(a, b, above, below, o = {}) {
  let s = arrow(a, b, { muted: o.muted });
  const mx = (a.x + b.x) / 2;
  if (a.y === b.y) {
    if (above) s += tg(mx, a.y - 9, above);
    if (below) s += tg(mx, a.y + 19, below);
  } else {
    if (above) s += tg(a.x + 12, (a.y + b.y) / 2 + 4, above, 'start');
    if (below) s += tg(a.x + 12, (a.y + b.y) / 2 + 20, below, 'start');
  }
  return s;
}

/* ================================================= bromine: add vs sub === */
FIGURES.push({
  id: 'eas-bromine-compare',
  section: 'eas',
  anchor: 'The bromine has <b>substituted</b> for the hydrogen rather than adding.</p>',
  alt: 'Three rows. Top: cyclohexene with bromine gives trans-1,2-dibromocyclohexane, the two bromines added to the two carbons that were double bonded, one on a wedge and one on a hash. Middle: benzene with bromine alone gives no reaction. Bottom: benzene with bromine and iron tribromide gives bromobenzene plus HBr; the ring keeps its three double bonds and one hydrogen has been replaced by bromine.',
  viewBox: '0 0 760 390',
  build() {
    let s = '';
    const R = 32;
    // row 1: cyclohexene adds
    let y = 104;
    s += ring(P(92, y), R, [0]).s;
    s += rxn(P(150, y), P(262, y), 'Br₂', 'dark, 25 °C');
    {
      const c = P(330, y);
      const { s: rs, v } = ring(c, R, []);
      s += rs;
      const b1 = at(v[0], 262, 36), b2 = at(v[1], 338, 36);
      s += wedge(v[0], b1, { rFrom: 0, rTo: 15, width: 9 }) + atom(b1.x, b1.y, 'Br', { kind: 'hi', r: 15, size: 11.5 });
      s += hash(v[1], b2, { rFrom: 0, rTo: 15, width: 10, rungs: 5 }) + atom(b2.x, b2.y, 'Br', { kind: 'hi', r: 15, size: 11.5 });
    }
    s += lbl(450, y - 6, 'cyclohexene: the two Br ADD', 'start');
    s += tg(450, y + 14, 'the C=C is gone; two new C–Br bonds', 'start');
    s += rule(24, 164, 736, 164);
    // row 2: benzene alone does nothing
    y = 222;
    s += ring(P(92, y), R, [0, 2, 4]).s;
    s += rxn(P(150, y), P(262, y), 'Br₂');
    s += warn(330, y + 4, 'no reaction');
    s += lbl(450, y + 4, 'benzene alone: nothing happens', 'start');
    s += rule(24, 262, 736, 262);
    // row 3: with FeBr3 it substitutes
    y = 330;
    s += ring(P(92, y), R, [0, 2, 4]).s;
    s += rxn(P(150, y), P(262, y), 'Br₂, FeBr₃');
    {
      const c = P(330, y);
      const { s: rs, v } = ring(c, R, [0, 2, 4]);
      s += rs + sub(c, v[0], 'Br', { kind: 'hi', r: 15, len: 36 });
    }
    s += lbl(372, y + 5, '+ HBr', 'start');
    s += lbl(450, y - 6, 'with FeBr₃: Br SUBSTITUTES for H', 'start');
    s += tg(450, y + 14, 'the ring keeps all three C=C', 'start');
    return s;
  },
  caption: 'Compare the top and bottom products: an added pair of bromines on sp³ carbons, against one bromine in place of one hydrogen on a ring that is still aromatic.',
});

/* ===================================================== the mechanism === */
/* Panel pieces, placed by the notes (row) and lesson (column) layouts. */
function mechAttack(c, R) {
  // Kekulé benzene with the C1=C2 pi bond at the top right; E+ above-right.
  const { s: rs, v } = ring(c, R, [0, 2, 4], { hi: [0] });
  let s = rs;
  const e = P(v[0].x + 64, v[0].y - 28);
  s += atom(e.x, e.y, 'E', { kind: 'hi', r: 14 });
  s += charge(P(e.x + 18, e.y - 14), '+');
  const from = away(c, edge(v, 0), 6);
  s += curve(from, at(e, 180, 17), { bow: -14 });
  return s;
}
function mechArenium(c, R, withBase = true) {
  const a = arenium(c, R);
  let s = a.s;
  if (withBase) {
    const b = P(a.H.x + 62, a.H.y + 2);
    s += atom(b.x, b.y, 'B', { r: 14 });
    s += lonePair(b.x, b.y, 180, { dist: 21 });
    s += charge(P(b.x + 16, b.y - 16), '−');
    // arrow 1: base lone pair to H
    s += curve(P(b.x - 24, b.y - 6), at(a.H, 350, 13), { bow: 14 });
    // arrow 2: the C–H bond pair drops into the ring, making C1=C2 again
    const ch = mid(a.v[0], a.H);
    s += curve(P(ch.x + 5, ch.y + 1), away(c, edge(a.v, 0), -4), { bow: -14 });
  }
  return { s, a };
}
function mechProduct(c, R) {
  const { s: rs, v } = ring(c, R, [0, 2, 4], { hi: [0] });
  return rs + sub(c, v[0], 'E', { kind: 'hi', r: 14, len: 34 });
}

FIGURES.push({
  id: 'eas-mechanism',
  section: 'eas',
  anchor: 'The ring is aromatic again, and E sits where the H used to be.</p>',
  alt: 'Three panels left to right. First: benzene drawn with alternating double bonds, and E plus above its top right; a curved arrow runs from the top-right pi bond to E. Arrow labeled step 1, slow. Second: the arenium ion; the top carbon is sp3 and carries E on a wedge and H on a hash, the positive charge sits on the next carbon clockwise, and two double bonds remain. A base, B minus, sits to the right of the H; one curved arrow runs from its lone pair to the H, and a second runs from the C–H bond into the ring bond between the sp3 carbon and the positive carbon. Arrow labeled step 2, fast. Third: the substituted benzene with E on the ring and three double bonds, plus H–B.',
  viewBox: '0 0 760 262',
  build() {
    let s = '';
    const R = 38, y = 136;
    s += mechAttack(P(96, y), R);
    s += rxn(P(186, y), P(250, y), 'step 1', 'slow');
    s += mechArenium(P(330, y), R).s;
    s += rxn(P(478, y), P(542, y), 'step 2', 'fast');
    s += mechProduct(P(612, y), R);
    s += lbl(664, y + 5, '+ H–B', 'start');
    s += tg(110, 206, 'benzene + E⁺');
    s += tg(330, 206, 'arenium ion: C1 is sp³,');
    s += tg(330, 222, 'the ring is not aromatic');
    s += tg(640, 206, 'aromatic again, E in place of H');
    s += mut(330, 250, 'C1 carries E and H; C2 carries the +');
    return s;
  },
  caption: 'Follow the highlighted C1=C2 bond: it attacks E in step 1, and the C–H electrons rebuild it in step 2. B⁻ stands for whatever base is present.',
});

FIGURES.push({
  id: 'l-eas-mechanism',
  lessons: ['eas'],
  alt: 'Stacked top to bottom. Benzene with alternating double bonds and E plus above its top right; a curved arrow runs from the top-right pi bond to E. Arrow down, step 1, slow. The arenium ion: the top carbon carries E on a wedge and H on a hash, the positive charge is on the next carbon, and a base B minus sits to the right; one curved arrow runs from the base lone pair to H and one from the C–H bond into the ring. Arrow down, step 2, fast. The substituted benzene with E on the ring, plus H–B.',
  viewBox: '0 0 340 560',
  build() {
    let s = '';
    const R = 36, x = 130;
    s += mechAttack(P(x, 100), R);
    s += tg(20, 160, 'benzene + E⁺', 'start');
    s += rxn(P(x, 150), P(x, 196), 'step 1 (slow)');
    s += mechArenium(P(x, 290), R).s;
    s += tg(20, 350, 'arenium ion: C1 is sp³, not aromatic', 'start');
    s += rxn(P(x, 362), P(x, 400), 'step 2 (fast)');
    s += mechProduct(P(x, 506), R);
    s += lbl(180, 511, '+ H–B', 'start');
    return s;
  },
  caption: 'The highlighted bond attacks E, and the C–H electrons rebuild it.',
});

/* ========================================================= the fork === */
function forkParts(o) {
  let s = '';
  s += arenium(o.a, o.R).s;
  // addition: Nu bonds to C2
  {
    const c = o.add;
    const { s: rs, v } = ring(c, o.R, [2, 4]);
    s += rs;
    const E = at(v[0], 262, 36), Nu = at(v[1], 338, 38);
    s += wedge(v[0], E, { rFrom: 0, rTo: 14, width: 9 }) + atom(E.x, E.y, 'E', { kind: 'hi', r: 14 });
    s += hash(v[1], Nu, { rFrom: 0, rTo: 16, width: 10, rungs: 5 }) + atom(Nu.x, Nu.y, 'Nu', { kind: 'warn', r: 16, size: 11.5 });
    s += `<circle class="fg-fill-warn" cx="${r2(v[0].x)}" cy="${r2(v[0].y)}" r="4" opacity="0.9"></circle>`;
    s += `<circle class="fg-fill-warn" cx="${r2(v[1].x)}" cy="${r2(v[1].y)}" r="4" opacity="0.9"></circle>`;
  }
  {
    const c = o.sub;
    const { s: rs, v } = ring(c, o.R, [0, 2, 4]);
    s += rs + sub(c, v[0], 'E', { kind: 'hi', r: 14, len: 34 });
  }
  return s;
}

FIGURES.push({
  id: 'eas-fork',
  section: 'eas',
  anchor: 'Step 1 is the same for an alkene and for benzene.</p>',
  alt: 'The arenium ion on the left, with two arrows leaving it. The upper arrow, labeled a nucleophile bonds to the positive carbon, leads to a ring with E and Nu on two neighboring sp3 carbons, marked with dots, and only two double bonds left; it is labeled addition, not aromatic, and crossed out. The lower arrow, labeled the base removes H plus, leads to the substituted benzene with three double bonds, labeled substitution, aromatic again, with a check.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    const R = 34;
    s += forkParts({ R, a: P(110, 180), add: P(420, 96), sub: P(420, 258) });
    s += arrow(P(190, 160), P(340, 104));
    s += tg(250, 112, 'Nu⁻ bonds to C2', 'end');
    s += arrow(P(190, 204), P(340, 256));
    s += tg(250, 252, 'base removes H⁺', 'end');
    s += warn(500, 86, 'ADDITION ✗', 'start');
    s += tg(500, 104, 'two sp³ carbons (dots): not aromatic,', 'start');
    s += tg(500, 120, 'the 36 kcal/mol never comes back', 'start');
    s += good(500, 250, 'SUBSTITUTION ✓', 'start');
    s += tg(500, 268, 'aromatic again: the 36 kcal/mol returns', 'start');
    s += tg(110, 244, 'the arenium ion');
    return s;
  },
  caption: 'Two ways out of the same cation. Count the sp³ carbons in each product.',
});

FIGURES.push({
  id: 'l-fork',
  lessons: ['eas'],
  alt: 'The arenium ion at the top, with two arrows leading down. Left: a nucleophile bonds to the positive carbon, giving a ring with E and Nu on two neighboring sp3 carbons, marked with dots, labeled addition, not aromatic, crossed out. Right: the base removes H plus, giving the substituted benzene, labeled substitution, aromatic, with a check.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    const R = 32;
    s += forkParts({ R, a: P(170, 96), add: P(80, 276), sub: P(262, 276) });
    s += arrow(P(140, 150), P(98, 200));
    s += tg(20, 164, 'Nu⁻ adds', 'start');
    s += arrow(P(200, 150), P(244, 200));
    s += tg(320, 164, 'H⁺ lost', 'end');
    s += warn(80, 346, 'ADDITION ✗');
    s += tg(80, 364, 'not aromatic');
    s += good(262, 346, 'SUBSTITUTION ✓');
    s += tg(262, 364, 'aromatic again');
    return s;
  },
  caption: 'The dots mark sp³ carbons.',
});

/* =============================================== the three contributors === */
function areniumThree(o) {
  // o.cs: three centres; o.hy: hybrid centre (or null); R
  const R = o.R;
  let s = '';
  const num = (c, v) => v.map((p, i) => {
    const q = away(c, p, -18);
    return mut(q.x, q.y + 4, String(i + 1));
  }).join('');
  // 1: charge on C2; the C3=C4 bond is about to shift toward it.
  const a1 = arenium(o.cs[0], R, { doubles: [2, 4], plus: 1 });
  s += a1.s + num(o.cs[0], a1.v);
  s += curve(away(o.cs[0], edge(a1.v, 2), 5), away(o.cs[0], edge(a1.v, 1), 5), { bow: 14 });
  // 2: charge on C4; the C5=C6 bond shifts toward it.
  const a2 = arenium(o.cs[1], R, { doubles: [1, 4], plus: 3 });
  s += a2.s + num(o.cs[1], a2.v);
  s += curve(away(o.cs[1], edge(a2.v, 4), 5), away(o.cs[1], edge(a2.v, 3), 5), { bow: 14 });
  // 3: charge on C6.
  const a3 = arenium(o.cs[2], R, { doubles: [1, 3], plus: 5 });
  s += a3.s + num(o.cs[2], a3.v);
  if (o.hy) {
    const c = o.hy;
    const a = arenium(c, R, { doubles: [], plus: null });
    s += a.s;
    const v = a.v, arcR = R * 0.62;
    const a1p = away(c, v[1], arcR - R), a5p = away(c, v[5], arcR - R);
    s += `<path class="fg-dash-hi" d="M${r2(a1p.x)} ${r2(a1p.y)} A${r2(arcR)} ${r2(arcR)} 0 1 1 ${r2(a5p.x)} ${r2(a5p.y)}"></path>`;
    for (const i of [1, 3, 5]) {
      const q = away(c, v[i], 17);
      s += text(q.x, q.y + 4, 'δ+', { cls: 'fg-tag-warn', size: 11 });
    }
  }
  return s;
}

FIGURES.push({
  id: 'arenium-resonance-three',
  section: 'eas',
  anchor: 'The positive charge is shared by three carbons and only three.</p>',
  alt: 'Three resonance structures of the arenium ion in a row, each a six-membered ring numbered 1 to 6 with C1 at the top carrying E on a wedge and H on a hash. The positive charge is on C2 in the first, on C4 in the second and on C6 in the third; in the first two a curved arrow moves the neighboring double bond toward the positive carbon. Below, the hybrid: a dashed arc over C2 to C6 and delta-plus on C2, C4 and C6 only, with C3 and C5 labeled meta, no charge.',
  viewBox: '0 0 760 490',
  build() {
    let s = '';
    const R = 44, CY = 150;
    s += areniumThree({ R, cs: [P(130, CY), P(380, CY), P(630, CY)], hy: P(380, 370) });
    const dbl = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true }) + arrow(P(x2, y), P(x1, y), { muted: true });
    s += dbl(212, 296, CY);
    s += dbl(462, 546, CY);
    s += tg(130, 236, 'charge on C2 (ortho)');
    s += tg(380, 236, 'charge on C4 (para)');
    s += tg(630, 236, 'charge on C6 (ortho)');
    s += rule(24, 256, 736, 256);
    s += mut(446, 404, 'C3 · meta · no charge', 'start');
    s += mut(314, 404, 'C5 · meta · no charge', 'end');
    s += lbl(380, 472, 'the hybrid: δ+ on C2, C4 and C6 only');
    return s;
  },
  caption: 'Follow the + from left to right: C2, then C4, then C6. The hybrid below marks where the charge really sits.',
});

FIGURES.push({
  id: 'l-arenium-three',
  lessons: ['eas'],
  alt: 'Three resonance structures of the arenium ion stacked top to bottom, each numbered 1 to 6 with C1 carrying E on a wedge and H on a hash. The positive charge is on C2, then C4, then C6, joined by double-headed arrows; curved arrows move the neighboring double bond toward the positive carbon.',
  viewBox: '0 0 340 616',
  build() {
    let s = '';
    const R = 40, x = 130;
    s += areniumThree({ R, cs: [P(x, 100), P(x, 300), P(x, 516)], hy: null });
    const dbl = (y1, y2) => arrow(P(x, y1), P(x, y2), { muted: true }) + arrow(P(x, y2), P(x, y1), { muted: true });
    s += dbl(162, 214);
    s += dbl(376, 428);
    s += tg(196, 104, '+ on C2 (ortho)', 'start');
    s += tg(196, 304, '+ on C4 (para)', 'start');
    s += tg(196, 520, '+ on C6 (ortho)', 'start');
    s += tg(196, 586, 'C3 and C5 (meta):', 'start');
    s += tg(196, 602, 'never charged', 'start');
    return s;
  },
  caption: 'Follow the + down the page: C2, C4, C6.',
});

/* ===================================================== energy profile === */
FIGURES.push({
  id: 'eas-energy-profile',
  section: 'eas',
  anchor: 'For nearly every EAS reaction, it is step 1.</p>',
  alt: 'A reaction-energy diagram for electrophilic aromatic substitution. From benzene plus an electrophile the curve rises steeply over a tall first transition state, drops into a shallow well labeled arenium ion, well above the starting level, rises over a much smaller second transition state, and falls to a product plateau below the start. A gray dashed branch leaves the arenium well, rises over a barrier and ends on a plateau above the starting level, labeled addition product.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    const base = 320;
    s += rule(56, base, 692, base) + rule(56, base, 56, 60);
    s += text(62, 44, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(380, 344, 'reaction progress →', { cls: 'fg-tag', size: 11 });

    const start = P(70, 252), ts1 = P(196, 92), well = P(300, 198), ts2 = P(392, 158), prod = P(580, 288);
    s += profile([well, P(430, 120), P(664, 226)], 'fg-dash');
    s += profile([start, ts1, well, ts2, prod]);

    s += text(72, 274, 'benzene + E⁺', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(196, 80, 'TS1: aromaticity being lost', { cls: 'fg-tag-warn', size: 11 });
    s += text(362, 150, 'TS2: H⁺ leaving', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += text(300, 226, 'arenium ion', { cls: 'fg-lbl', size: 13 });
    s += text(300, 244, 'not aromatic', { cls: 'fg-tag', size: 11 });
    s += text(560, 310, 'substituted benzene: aromatic', { cls: 'fg-tag-good', size: 11 });
    s += text(672, 250, 'addition product ✗', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += text(380, 370, 'step 1 has the taller barrier, so step 1 sets the rate', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'Compare the two barriers: the climb to TS1 is much taller than the climb from the arenium ion to TS2. The dashed branch is the addition the ring does not take; it ends above the starting materials.',
});

FIGURES.push({
  id: 'l-eas-profile',
  lessons: ['eas'],
  alt: 'A reaction-energy diagram. From benzene plus an electrophile the curve climbs over a tall first transition state, drops into a shallow well labeled arenium ion, climbs over a much smaller second transition state, and falls to a product level below the start.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const base = 250;
    s += rule(24, base, 326, base) + rule(24, base, 24, 40);
    s += tg(30, 30, 'free energy', 'start');
    const start = P(32, 200), ts1 = P(104, 70), well = P(160, 150), ts2 = P(206, 122), prod = P(300, 226);
    s += profile([start, ts1, well, ts2, prod]);
    s += tg(34, 222, 'benzene + E⁺', 'start');
    s += warn(104, 58, 'TS1: tall');
    s += tg(214, 110, 'TS2: small', 'start');
    s += text(160, 176, 'arenium ion', { cls: 'fg-lbl', size: 13 });
    s += good(318, 244, 'product', 'end');
    s += tg(170, 278, 'reaction progress →');
    return s;
  },
  caption: 'Compare the climb to TS1 with the climb to TS2.',
});

/* ================================================ skeletal side chains === */
/* A ring whose vertex 0 points right (rot 0), for a side chain drawn to the
   right. Returns the ring ink and vertex 0. */
function flatRing(c, R, doubles = [0, 2, 4]) {
  const r = ring(c, R, doubles, { rot: 0 });
  return { s: r.s, v0: r.v[0], v: r.v };
}
const skb = (a, b, cls) => bond(a, b, { rFrom: 0, rTo: 0, cls });
/* Chains hung on vertex p. kind: 'propyl', 'isopropyl', 'propanoyl',
   'acetyl'. Carbonyl oxygens are labeled atoms. */
function chain(p, kind, L = 28) {
  let s = '';
  const c1 = at(p, -30, L);
  s += skb(p, c1);
  if (kind === 'isopropyl') {
    s += skb(c1, at(c1, 30, L)) + skb(c1, at(c1, -90, L));
    return s;
  }
  if (kind === 'propanoyl' || kind === 'acetyl') {
    const o = at(c1, -90, L + 4);
    s += bond(c1, o, { order: 2, rFrom: 0, rTo: 13, gap: 3.4 }) + atom(o.x, o.y, 'O', { r: 13, size: 12 });
  }
  const c2 = at(c1, 30, L);
  s += skb(c1, c2);
  if (kind === 'acetyl') return s;
  s += skb(c2, at(c2, -30, L));
  return s;
}

/* ============================================== bromination electrophile === */
function br2(a, withLp = true) {
  const m = { atoms: { A: { ...a, l: 'Br', r: 15 }, B: { ...P(a.x + 64, a.y), l: 'Br', k: 'hi', r: 15 } }, bonds: [['A', 'B']], lp: [] };
  if (withLp) m.lp.push(['A', 180], ['A', 270], ['A', 90], ['B', 270], ['B', 90], ['B', 0]);
  return m;
}
function febr3(fe, list) {
  const m = { atoms: { Fe: { ...fe, l: 'Fe', k: 'warn', r: 16 } }, bonds: [] };
  arms(m, 'Fe', list.map((a) => [a, 'Br']), 46);
  for (const k of Object.keys(m.atoms)) if (k !== 'Fe') m.atoms[k].r = 14;
  return m;
}
/* Br–Br+–FeBr3− with the outer bromine at a. Returns the molecule. */
function brComplex(a, withLp = true) {
  const b = P(a.x + 66, a.y), fe = P(a.x + 134, a.y);
  const f = febr3(fe, [270, 30, 90]);
  const m = {
    atoms: { A: { ...a, l: 'Br', r: 15 }, B: { ...b, l: 'Br', k: 'hi', r: 15 }, ...f.atoms },
    bonds: [['A', 'B'], ['B', 'Fe', 1, 'fg-bond-hi'], ...f.bonds],
    lp: withLp ? [['A', 180], ['A', 270], ['A', 90], ['B', 270], ['B', 90]] : [],
    charges: [['B', '+', 318, 27], ['Fe', '−', 148, 28]],
  };
  return m;
}
function bromRow1(y, x0, feX, arrowX, cxX) {
  let s = '';
  const m = br2(P(x0, y));
  s += mol(m);
  const f = febr3(P(feX, y), [270, 30, 150]);
  s += mol(f);
  const lp = at(m.atoms.B, 0, 22);
  s += curve(P(lp.x + 4, lp.y - 3), at(P(feX, y), 200, 18), { bow: -18 });
  return s;
}
function bromRow2(c, R, a) {
  // Benzene with its right-hand C=C facing the complex; outer Br at a.
  let s = '';
  const { s: rs, v } = ring(c, R, [1, 3, 5], { hi: [1] });
  s += rs;
  const m = brComplex(a, false);
  s += mol(m);
  s += curve(away(c, edge(v, 1), 5), at(a, 180, 17), { bow: -16 });
  const bb = mid(a, m.atoms.B);
  s += curve(P(bb.x - 4, bb.y - 5), at(m.atoms.B, 250, 17), { bow: -14 });
  return s;
}

FIGURES.push({
  id: 'bromination-electrophile',
  section: 'eas',
  anchor: 'but the ring receives a bromine without its electrons.</p>',
  alt: 'Two rows. Top: Br2 and FeBr3; a curved arrow runs from a lone pair on one bromine to iron, giving the complex Br–Br–FeBr3 in which the middle bromine is plus one and iron is minus one. Bottom: benzene attacks the outer bromine of that complex; one curved arrow runs from a ring pi bond to the outer bromine, and a second from the Br–Br bond onto the middle bromine. The products are the arenium ion carrying Br and H on its sp3 carbon, and FeBr4 minus.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    let y = 96;
    s += bromRow1(y, 64, 272);
    s += tg(98, 150, 'Br₂', 'middle');
    s += tg(272, 170, 'FeBr₃: a Lewis acid', 'middle');
    s += arrow(P(344, y), P(404, y));
    s += mol(brComplex(P(452, y)));
    s += tg(540, 178, 'the outer Br is now electron-poor', 'middle');
    s += rule(24, 200, 736, 200);
    y = 300;
    s += bromRow2(P(80, y), 36, P(186, y));
    s += rxn(P(378, y), P(436, y), 'step 1');
    const a = arenium(P(520, y + 8), 36, { E: 'Br', eR: 15 });
    s += a.s;
    s += lbl(592, y + 13, '+ FeBr₄⁻', 'start');
    s += tg(380, 404, 'then FeBr₄⁻ takes the H⁺: HBr forms, and FeBr₃ is free to work again');
    return s;
  },
  caption: 'Top: one arrow, and an Fe–Br bond forms. Bottom: two arrows, one from the ring to the outer bromine and one from the Br–Br bond onto the inner bromine. Lone pairs are drawn in the top row only, and the bromines on iron are drawn without theirs.',
});

FIGURES.push({
  id: 'l-bromination',
  lessons: ['eas'],
  alt: 'Stacked. Br2 and FeBr3, with a curved arrow from a bromine lone pair to iron; below, the complex Br–Br–FeBr3 with the middle bromine plus one and iron minus one. Then benzene attacks the outer bromine of the complex: one arrow from a ring pi bond to that bromine, one from the Br–Br bond onto the middle bromine. At the bottom, the arenium ion carrying Br and H, plus FeBr4 minus.',
  viewBox: '0 0 340 590',
  build() {
    let s = '';
    s += bromRow1(70, 34, 226);
    s += arrow(P(170, 120), P(170, 150));
    s += mol(brComplex(P(96, 200)));
    s += tg(20, 262, 'Br +1, Fe −1', 'start');
    s += rule(16, 276, 324, 276);
    s += bromRow2(P(50, 360), 30, P(130, 360));
    s += rxn(P(150, 420), P(150, 460), 'step 1');
    s += arenium(P(110, 540), 32, { E: 'Br', eR: 15 }).s;
    s += lbl(170, 545, '+ FeBr₄⁻', 'start');
    return s;
  },
  caption: 'The ring bonds to the outer bromine as the Br–Br bond breaks.',
});

/* ========================================================= nitronium === */
/* HO–NO2 protonated: H2O+–N+(=O)–O−, with the water oxygen at o. */
function protNitric(o) {
  const n = P(o.x + 66, o.y);
  const m = {
    atoms: {
      O1: { ...o, l: 'O', k: 'hi', r: 14 },
      Ha: { ...at(o, 215, 40), l: 'H' },
      Hb: { ...at(o, 145, 40), l: 'H' },
      N: { ...n, l: 'N', k: 'warn', r: 14 },
      O2: { ...at(n, -55, 50), l: 'O', r: 14 },
      O3: { ...at(n, 55, 50), l: 'O', r: 14 },
    },
    bonds: [['O1', 'Ha'], ['O1', 'Hb'], ['O1', 'N', 1, 'fg-bond-hi'], ['N', 'O2', 2], ['N', 'O3']],
    lp: [['O1', 270], ['O3', 90]],
    charges: [['O1', '+', 80, 25], ['N', '+', 0, 25], ['O3', '−', 0, 25]],
  };
  return m;
}
function waterLoss(o) {
  const m = protNitric(o);
  let s = mol(m);
  const A = m.atoms;
  // O3's lone pair moves in to make N=O3
  const lp = at(A.O3, 90, 21);
  s += curve(P(lp.x - 5, lp.y + 2), mid(A.N, A.O3), { bow: -20 });
  // the N–O1 bond pair leaves with the water
  const b = mid(A.O1, A.N);
  s += curve(P(b.x, b.y - 6), at(A.O1, 300, 17), { bow: 14 });
  return s;
}
/* O=N+=O, linear, centre n, horizontal or vertical. */
function nitronium(n, vertical = false) {
  const d = 50;
  const o1 = vertical ? P(n.x, n.y - d) : P(n.x - d, n.y);
  const o2 = vertical ? P(n.x, n.y + d) : P(n.x + d, n.y);
  const m = {
    atoms: { N: { ...n, l: 'N', k: 'warn', r: 14 }, O1: { ...o1, l: 'O', r: 14 }, O2: { ...o2, l: 'O', r: 14 } },
    bonds: [['N', 'O1', 2], ['N', 'O2', 2]],
    charges: [['N', '+', vertical ? 20 : 300, 24]],
  };
  return m;
}
function nitroAttack(c, R, n) {
  let s = '';
  const { s: rs, v } = ring(c, R, [1, 3, 5], { hi: [1] });
  s += rs;
  const m = nitronium(n, true);
  s += mol(m);
  s += curve(away(c, edge(v, 1), 5), at(n, 180, 17), { bow: -16 });
  const b = mid(n, m.atoms.O1);
  s += curve(P(b.x + 6, b.y), at(m.atoms.O1, 20, 17), { bow: -12 });
  return s;
}

FIGURES.push({
  id: 'nitronium',
  section: 'eas',
  anchor: 'After step 2, the product is nitrobenzene.</p>',
  alt: 'Three rows. Top: nitric acid, HO–NO2 with nitrogen plus one and one oxygen minus one, next to sulfuric acid; a curved arrow runs from a lone pair on the OH oxygen to the acidic H of sulfuric acid, and another from that H–O bond onto its oxygen, giving protonated nitric acid, with a water molecule bonded to nitrogen, plus HSO4 minus. Middle: in protonated nitric acid, a lone pair on the negative oxygen moves in to make a second N=O bond while the N–OH2 bond breaks and water leaves, giving the linear nitronium ion O=N+=O plus water. Bottom: benzene attacks the nitrogen of a vertical nitronium ion while one N=O pi bond moves onto oxygen; the product is the arenium ion carrying NO2 and H.',
  viewBox: '0 0 760 560',
  build() {
    let s = '';
    // ---- row 1: protonation ----
    const y = 118;
    const o = P(150, y);
    const nit = {
      atoms: {
        H: { ...P(92, y), l: 'H' },
        O1: { ...o, l: 'O', r: 14 },
        N: { ...P(216, y), l: 'N', k: 'warn', r: 14 },
        O2: { ...at(P(216, y), -55, 50), l: 'O', r: 14 },
        O3: { ...at(P(216, y), 55, 50), l: 'O', r: 14 },
      },
      bonds: [['H', 'O1'], ['O1', 'N'], ['N', 'O2', 2], ['N', 'O3']],
      lp: [['O1', 270], ['O1', 90]],
      charges: [['N', '+', 0, 24], ['O3', '−', 0, 25]],
    };
    s += mol(nit);
    const hs = P(150, 42), os = P(50, 42);
    s += bond(os, hs, { rFrom: 26, rTo: 11 });
    s += atom(hs.x, hs.y, 'H', { kind: 'hi', r: 11 });
    s += atom(os.x, os.y, 'OSO₃H', { r: 26, size: 10 });
    s += curve(P(o.x + 4, o.y - 22), at(hs, 80, 13), { bow: 10 });
    s += curve(P(112, 36), at(os, 335, 27), { bow: -14 });
    s += tg(170, 196, 'HNO₃ and H₂SO₄');
    s += arrow(P(300, y), P(360, y));
    s += mol(protNitric(P(446, y)));
    s += lbl(600, y + 5, '+ HSO₄⁻', 'start');
    s += tg(486, 198, 'water is now bonded to N');
    s += rule(24, 212, 736, 212);
    // ---- row 2: water leaves ----
    const y2 = 292;
    s += waterLoss(P(130, y2));
    s += arrow(P(290, y2), P(350, y2));
    s += mol(nitronium(P(460, y2)));
    s += lbl(560, y2 + 5, '+ H₂O', 'start');
    s += tg(460, y2 + 40, 'nitronium ion, NO₂⁺: straight, 180°');
    s += rule(24, 364, 736, 364);
    // ---- row 3: the ring attacks N ----
    const y3 = 462;
    s += nitroAttack(P(84, y3), 36, P(196, y3));
    s += rxn(P(290, y3), P(350, y3), 'step 1');
    s += arenium(P(440, y3 + 10), 36, { E: 'NO₂', eR: 18 }).s;
    s += tg(520, y3 + 14, 'then step 2 gives nitrobenzene', 'start');
    return s;
  },
  caption: 'Top: sulfuric acid gives its proton to the OH oxygen. Middle: water leaves, and an oxygen lone pair makes the second N=O. Bottom: as the ring bonds to nitrogen, one N=O π bond moves onto oxygen. Only the lone pairs that move are drawn.',
});

FIGURES.push({
  id: 'l-nitronium',
  lessons: ['eas'],
  alt: 'Stacked. Protonated nitric acid, with water bonded to a positive nitrogen; one curved arrow moves a lone pair on the negative oxygen into the N–O bond, another sends the N–OH2 bond pair onto the water oxygen. Arrow down to the linear nitronium ion O=N+=O plus water. Then benzene attacks the nitrogen of a vertical nitronium ion while an N=O pi bond moves onto oxygen, giving the arenium ion carrying NO2 and H.',
  viewBox: '0 0 340 530',
  build() {
    let s = '';
    s += waterLoss(P(90, 70));
    s += arrow(P(262, 104), P(262, 150));
    s += mol(nitronium(P(130, 192)));
    s += lbl(210, 197, '+ H₂O', 'start');
    s += tg(170, 236, 'nitronium ion: straight, 180°');
    s += rule(16, 252, 324, 252);
    s += nitroAttack(P(56, 334), 32, P(156, 334));
    s += rxn(P(240, 350), P(240, 400), 'step 1', null);
    s += arenium(P(120, 480), 30, { E: 'NO₂', eR: 18 }).s;
    return s;
  },
  caption: 'Water leaves to make NO₂⁺; the ring then bonds to its nitrogen.',
});

/* ======================================================== sulfonation === */
function so3(sx) {
  const m = { atoms: { S: { ...sx, l: 'S', k: 'warn', r: 15 } }, bonds: [] };
  arms(m, 'S', [[270, 'O', 2], [30, 'O', 2], [150, 'O', 2]], 46);
  for (const k of Object.keys(m.atoms)) if (k !== 'S') m.atoms[k].r = 14;
  return m;
}
FIGURES.push({
  id: 'sulfonation',
  section: 'eas',
  anchor: 'concentrated fuming acid, with little water, favors the forward one.</p>',
  alt: 'Two rows. Top, forward: benzene attacks the sulfur of SO3; one curved arrow runs from a ring pi bond to sulfur and one from an S=O pi bond onto oxygen, giving an arenium ion that carries SO3 minus and H on its sp3 carbon; after loss of H plus and a proton transfer to oxygen, the product is benzenesulfonic acid. Bottom, reverse, in hot dilute aqueous acid: benzenesulfonate, the ionized acid, is attacked by H plus at the carbon carrying sulfur, with a curved arrow from the ring pi bond at that carbon to H plus; this gives the same arenium ion, and a curved arrow from the C–S bond back into the ring releases SO3 and gives benzene.',
  viewBox: '0 0 760 450',
  build() {
    let s = '';
    // ---- forward ----
    let y = 110;
    const c = P(80, y), R = 34;
    const { s: rs, v } = ring(c, R, [1, 3, 5], { hi: [1] });
    s += rs;
    const S = P(206, y);
    const m = so3(S);
    s += mol(m);
    s += curve(away(c, edge(v, 1), 5), at(S, 185, 18), { bow: -18 });
    const top = m.atoms.S_0;
    s += curve(P(S.x + 7, S.y - 24), at(top, 10, 16), { bow: -12 });
    s += tg(206, 190, 'SO₃: S is strongly δ+');
    s += rxn(P(272, y), P(328, y), 'step 1');
    s += arenium(P(410, y + 10), 34, { E: 'SO₃⁻', eR: 21 }).s;
    s += rxn(P(484, y), P(560, y), '−H⁺, +H⁺');
    {
      const c2 = P(630, y + 16);
      const { s: r2s, v: v2 } = ring(c2, R, [0, 2, 4]);
      s += r2s + sub(c2, v2[0], 'SO₃H', { kind: 'hi', r: 21, len: 34 });
    }
    s += tg(640, 190, 'benzenesulfonic acid');
    s += rule(24, 214, 736, 214);
    // ---- reverse ----
    y = 348;
    s += tg(24, 240, 'IN HOT DILUTE AQUEOUS ACID: THE SAME STEPS, BACKWARDS', 'start');
    {
      const c3 = P(90, y + 10);
      const { s: r3, v: v3 } = ring(c3, R, [1, 3, 5], { hi: [5] });
      s += r3 + sub(c3, v3[0], 'SO₃⁻', { kind: 'hi', r: 21, len: 34 });
      const h = P(v3[0].x - 66, v3[0].y - 22);
      s += atom(h.x, h.y, 'H', { kind: 'hi', r: 12 });
      s += charge(P(h.x - 16, h.y - 12), '+');
      s += curve(away(c3, edge(v3, 5), 5), at(h, 0, 13), { bow: 12 });
      s += tg(90, 432, 'benzenesulfonate + H⁺');
    }
    s += rxn(P(168, y), P(222, y), 'H⁺ adds');
    {
      const c4 = P(314, y + 12);
      const a = arenium(c4, R, { E: 'SO₃⁻', eR: 21, doubles: [1, 3], plus: 5 });
      s += a.s;
      const b = mid(a.v[0], a.E);
      s += curve(P(b.x - 6, b.y + 4), away(c4, edge(a.v, 5), 4), { bow: 12 });
    }
    s += rxn(P(392, y), P(452, y), 'SO₃ leaves');
    s += ring(P(530, y + 10), R, [0, 2, 4]).s;
    s += lbl(580, y + 15, '+ SO₃', 'start');
    s += tg(580, y + 38, 'water turns it into H₂SO₄', 'start');
    return s;
  },
  caption: 'Top: the same two steps as every EAS reaction, with sulfur as the atom attacked. Bottom: H⁺ is now the electrophile, and SO₃ leaves instead of H⁺. Only the lone pairs that move are drawn, and SO₃⁻ and SO₃H are written as groups.',
});

/* =================================================== FC alkylation === */
function alcl3(al, list) {
  const m = { atoms: { Al: { ...al, l: 'Al', k: 'warn', r: 16 } }, bonds: [] };
  arms(m, 'Al', list.map((a) => [a, 'Cl']), 46);
  for (const k of Object.keys(m.atoms)) if (k !== 'Al') m.atoms[k].r = 14;
  return m;
}
function tBuCl(c) {
  const m = {
    atoms: { C: { ...c, l: 'C', r: 13 }, Cl: { ...P(c.x + 62, c.y), l: 'Cl', k: 'hi', r: 15 } },
    bonds: [['C', 'Cl']],
    lp: [],
  };
  arms(m, 'C', [[270, 'CH₃'], [150, 'CH₃'], [210, 'CH₃']], 44);
  return m;
}

FIGURES.push({
  id: 'fc-electrophile',
  section: 'eas',
  anchor: 'and returns AlCl₃.</p>',
  alt: 'Two rows. Top: 2-chloro-2-methylpropane and AlCl3; a curved arrow runs from a chlorine lone pair to aluminum, giving a complex in which chlorine is bonded to both carbon and aluminum, chlorine plus one and aluminum minus one; in the complex a second curved arrow sends the C–Cl bond pair onto chlorine. Bottom: the tert-butyl cation, a flat carbon with three methyl groups and a plus charge, with AlCl4 minus; benzene attacks the positive carbon with a curved arrow from a ring pi bond, giving the arenium ion that carries C(CH3)3 and H.',
  viewBox: '0 0 760 420',
  build() {
    let s = '';
    let y = 110;
    const t = tBuCl(P(92, y));
    t.lp.push(['Cl', 270], ['Cl', 90], ['Cl', 0]);
    s += mol(t);
    s += mol(alcl3(P(286, y), [270, 30, 150]));
    const lp = at(t.atoms.Cl, 0, 22);
    s += curve(P(lp.x + 4, lp.y - 3), at(P(286, y), 200, 18), { bow: -18 });
    s += itTag(110, 190, 'tert', '-butyl chloride');
    s += arrow(P(350, y), P(404, y));
    {
      const c = P(476, y);
      const t2 = tBuCl(c);
      const al = P(c.x + 62 + 66, y);
      const a = alcl3(al, [270, 30, 90]);
      const m = {
        atoms: { ...t2.atoms, ...a.atoms },
        bonds: [...t2.bonds, ...a.bonds, ['Cl', 'Al', 1, 'fg-bond-hi']],
        lp: [['Cl', 270], ['Cl', 90]],
        charges: [['Cl', '+', 318, 27], ['Al', '−', 148, 28]],
      };
      s += mol(m);
      const b = mid(c, m.atoms.Cl);
      s += curve(P(b.x - 3, b.y + 6), at(m.atoms.Cl, 160, 17), { bow: 10 });
      s += tg(560, 190, 'the C–Cl bond breaks');
    }
    s += rule(24, 212, 736, 212);
    y = 316;
    {
      const c = P(80, y), R = 36;
      const { s: rs, v } = ring(c, R, [1, 3, 5], { hi: [1] });
      s += rs;
      const cp = P(200, y);
      const m = { atoms: { C: { ...cp, l: 'C', k: 'warn', r: 13 } }, bonds: [], charges: [['C', '+', 300, 23]] };
      arms(m, 'C', [[0, 'CH₃'], [120, 'CH₃'], [240, 'CH₃']], 44);
      s += mol(m);
      s += curve(away(c, edge(v, 1), 5), at(cp, 180, 16), { bow: -14 });
      s += itTag(200, 402, 'tert', '-butyl cation + AlCl₄⁻');
    }
    s += rxn(P(300, y), P(356, y), 'step 1');
    s += arenium(P(446, y + 12), 36, { tBu: true }).s;
    s += tg(526, y + 4, 'step 2: AlCl₄⁻ takes the H⁺,', 'start');
    s += itTag(526, y + 22, 'tert', '-butylbenzene + HCl + AlCl₃', 'fg-tag', 'start');
    return s;
  },
  caption: 'Top: one arrow makes the Cl–Al bond, and a second breaks the C–Cl bond. Bottom: the ring attacks the carbocation. Lone pairs are drawn only where an arrow starts, and the chlorines on aluminum are drawn without theirs.',
});

/* ========================================================= acylium === */
function acylChloride(c) {
  return {
    atoms: {
      C: { ...c, l: 'C', r: 14 },
      O: { ...P(c.x, c.y - 58), l: 'O', r: 15 },
      M: { ...at(c, 150, 50), l: 'CH₃' },
      Cl: { ...at(c, 30, 56), l: 'Cl', k: 'hi', r: 15 },
    },
    bonds: [['C', 'O', 2], ['C', 'M'], ['C', 'Cl']],
    lp: [['O', 225], ['O', 315]],
  };
}
function acylComplex(c) {
  const m = acylChloride(c);
  const cl = m.atoms.Cl;
  const a = alcl3(at(cl, 0, 62), [270, 30, 330]);
  return {
    atoms: { ...m.atoms, ...a.atoms },
    bonds: [...m.bonds, ...a.bonds, ['Cl', 'Al', 1, 'fg-bond-hi']],
    lp: [...m.lp, ['Cl', 120], ['Cl', 290]],
    charges: [['Cl', '+', 60, 27], ['Al', '−', 225, 28]],
  };
}
/* The complex with its two arrows: C–Cl onto Cl, and an O lone pair into C–O. */
function acyliumArrows(c) {
  const cx = acylComplex(c);
  let s = mol(cx);
  const clB = cx.atoms.Cl;
  const mB = mid(c, clB);
  s += curve(P(mB.x - 3, mB.y - 7), at(clB, 245, 18), { bow: -16 });
  const oB = cx.atoms.O;
  s += curve(P(oB.x + 20, oB.y - 18), P(oB.x + 6, oB.y + 30), { bow: -22 });
  return s;
}
function acyliumLinear(k, plusO = true) {
  // CH3–C≡O+ straight; or CH3–C+=O when plusO is false.
  const m = {
    atoms: {
      M: { ...P(k.x - 58, k.y), l: 'CH₃' },
      C: { ...k, l: 'C', r: 14 },
      O: { ...P(k.x + 56, k.y), l: 'O', k: plusO ? 'warn' : undefined, r: 15 },
    },
    bonds: [['M', 'C'], ['C', 'O', plusO ? 3 : 2]],
    lp: plusO ? [['O', 0]] : [['O', 305], ['O', 55]],
    charges: plusO ? [['O', '+', 300, 27]] : [['C', '+', 270, 26]],
  };
  return m;
}

FIGURES.push({
  id: 'acylium',
  section: 'eas',
  anchor: 'Oxygen’s lone pair stabilizes the cation the same way it stabilizes the oxocarbenium ion in <a class="chapter-ref" href="/ochem/learn.html#m-carbonyl-chemistry">Carbonyl Chemistry</a>.</p>',
  alt: 'Three rows. Top: acetyl chloride and AlCl3; a curved arrow from a lone pair on the acetyl chlorine to aluminum gives a complex with chlorine plus one and aluminum minus one. Middle: in the complex, one curved arrow sends the C–Cl bond pair onto chlorine and another moves an oxygen lone pair into the C–O bond; the result is the acylium ion CH3–C≡O+, drawn straight, plus AlCl4 minus. Bottom: the two resonance structures of the acylium ion, CH3–C+=O with two lone pairs on oxygen and a curved arrow from one of them into the C–O bond, and CH3–C≡O+ with one lone pair on the positive oxygen.',
  viewBox: '0 0 760 566',
  build() {
    let s = '';
    const c = P(104, 118);
    const ac = acylChloride(c);
    ac.lp.push(['Cl', 300], ['Cl', 30], ['Cl', 120]);
    s += mol(ac);
    s += tg(110, 190, 'acetyl chloride');
    const al = P(300, 118);
    s += mol(alcl3(al, [270, 30, 150]));
    s += tg(300, 190, 'AlCl₃');
    const lpPt = at(ac.atoms.Cl, 30, 22);
    s += curve(P(lpPt.x + 4, lpPt.y - 4), P(al.x - 18, al.y - 6), { bow: -22 });
    s += arrow(P(372, 108), P(412, 108));
    s += mol(acylComplex(P(474, 118)));
    s += tg(560, 190, 'Cl +1, Al −1');
    s += rule(20, 212, 740, 212);
    s += acyliumArrows(P(104, 330));
    s += tg(150, 414, 'C–Cl breaks; C≡O forms');
    s += arrow(P(320, 320), P(372, 320));
    s += mol(acyliumLinear(P(480, 320)));
    s += tg(490, 370, 'the acylium ion: straight, 180° at C');
    s += lbl(620, 325, '+ AlCl₄⁻', 'start');
    s += rule(20, 430, 740, 430);
    // resonance
    const y = 494;
    const left = acyliumLinear(P(200, y), false);
    s += mol(left);
    const lp = at(left.atoms.O, 305, 22);
    s += curve(P(lp.x - 2, lp.y - 4), mid(left.atoms.C, left.atoms.O), { bow: 18 });
    s += arrow(P(310, y), P(410, y), { muted: true }) + arrow(P(410, y), P(310, y), { muted: true });
    s += mol(acyliumLinear(P(530, y)));
    s += tg(200, 546, 'C has only six electrons');
    s += tg(530, 546, 'every atom has an octet: major');
    return s;
  },
  caption: 'Top: one arrow makes the Cl–Al bond. Middle: two arrows, as the C–Cl bond breaks and an oxygen lone pair makes the third C–O bond. Bottom: the two resonance structures of the acylium ion. The chlorines on aluminum are drawn without their lone pairs.',
});

FIGURES.push({
  id: 'l-acylium',
  lessons: ['eas'],
  alt: 'Stacked. The acetyl chloride–AlCl3 complex, with one curved arrow sending the C–Cl bond pair onto chlorine and another moving an oxygen lone pair into the C–O bond. Arrow down to the acylium ion CH3–C≡O+, drawn straight, plus AlCl4 minus. Below, the two resonance structures: CH3–C+=O, with a curved arrow from an oxygen lone pair into the C–O bond, and CH3–C≡O+.',
  viewBox: '0 0 340 500',
  build() {
    let s = '';
    s += acyliumArrows(P(90, 130));
    s += arrow(P(170, 200), P(170, 236));
    s += mol(acyliumLinear(P(110, 272)));
    s += lbl(200, 277, '+ AlCl₄⁻', 'start');
    s += tg(170, 314, 'the acylium ion');
    s += rule(16, 330, 324, 330);
    const left = acyliumLinear(P(110, 380), false);
    s += mol(left);
    const lp = at(left.atoms.O, 305, 22);
    s += curve(P(lp.x - 2, lp.y - 4), mid(left.atoms.C, left.atoms.O), { bow: 18 });
    s += tg(250, 376, 'C has only', 'start');
    s += tg(250, 392, 'six electrons', 'start');
    s += arrow(P(110, 408), P(110, 438), { muted: true }) + arrow(P(110, 438), P(110, 408), { muted: true });
    s += mol(acyliumLinear(P(110, 474)));
    s += tg(250, 470, 'all octets:', 'start');
    s += tg(250, 486, 'the major one', 'start');
    return s;
  },
  caption: 'Two arrows make the acylium ion; its two resonance structures are below.',
});

/* The ring attacks the acylium ion; the ketone then binds AlCl3. */
FIGURES.push({
  id: 'acylation-alcl3',
  section: 'eas',
  anchor: 'and water is added at the end to free the ketone from the aluminum.</p>',
  alt: 'Two rows. Top: benzene attacks the carbon of a vertical acylium ion, with a curved arrow from a ring pi bond to that carbon and another from one C≡O pi bond onto oxygen; after step 2 the product is acetophenone. Bottom: acetophenone and AlCl3; a curved arrow runs from a lone pair on the ketone oxygen to aluminum, giving a complex with oxygen plus one and aluminum minus one.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    let y = 110;
    {
      const c = P(80, y), R = 36;
      const { s: rs, v } = ring(c, R, [1, 3, 5], { hi: [1] });
      s += rs;
      const k = P(196, y);
      const m = {
        atoms: { C: { ...k, l: 'C', r: 14 }, O: { ...P(k.x, k.y - 54), l: 'O', k: 'warn', r: 15 }, M: { ...P(k.x, k.y + 54), l: 'CH₃' } },
        bonds: [['C', 'O', 3], ['C', 'M']],
        lp: [['O', 270]],
        charges: [['O', '+', 0, 26]],
      };
      s += mol(m);
      s += curve(away(c, edge(v, 1), 5), at(k, 180, 17), { bow: -16 });
      const b = mid(k, m.atoms.O);
      s += curve(P(b.x + 8, b.y + 2), at(m.atoms.O, 20, 17), { bow: -12 });
    }
    s += rxn(P(290, y), P(400, y), 'steps 1 and 2');
    {
      const c = P(480, y + 14), R = 34;
      const r = flatRing(c, R);
      s += r.s + chain(r.v0, 'acetyl');
    }
    s += tg(490, 190, 'acetophenone, a ketone');
    s += rule(24, 212, 736, 212);
    y = 312;
    {
      const c = P(80, y + 14), R = 34;
      const r = flatRing(c, R);
      s += r.s + chain(r.v0, 'acetyl');
      const c1 = at(r.v0, -30, 28);
      const o = at(c1, -90, 32);
      s += lonePair(o.x, o.y, 330, { dist: 20 }) + lonePair(o.x, o.y, 210, { dist: 20 });
      const al = P(260, y - 50);
      s += mol(alcl3(al, [270, 30, 150]));
      const lp = at(o, 330, 20);
      s += curve(P(lp.x + 3, lp.y - 3), at(al, 190, 18), { bow: -14 });
    }
    s += arrow(P(340, y), P(400, y));
    {
      const c = P(470, y + 14), R = 34;
      const r = flatRing(c, R);
      s += r.s + chain(r.v0, 'acetyl');
      const c1 = at(r.v0, -30, 28);
      const o = at(c1, -90, 32);
      const al = at(o, 0, 70);
      const a = alcl3(al, [270, 30, 330]);
      s += mol(a);
      s += bond(o, al, { rFrom: 13, rTo: 16, cls: 'fg-bond-hi' });
      s += lonePair(o.x, o.y, 210, { dist: 20 });
      s += charge(at(o, 300, 26), '+') + charge(at(al, 120, 28), '−');
    }
    s += tg(520, y + 80, 'O +1, Al −1: one AlCl₃ held per ketone');
    return s;
  },
  caption: 'Top: follow the two arrows from the ring to carbon and from the C≡O bond to oxygen. Bottom: the ketone oxygen, a Lewis base, holds on to AlCl₃. Water at the end breaks the O–Al bond.',
});

/* ====================================================== hydride shift === */
FIGURES.push({
  id: 'fc-hydride-shift',
  section: 'eas',
  lessons: ['eas'],
  anchor: 'Propylbenzene still forms as the minor product, from direct attack on the complex before it rearranges.</p>',
  alt: 'Stacked. Top: the propyl cation drawn as CH3–CH2–CH2 plus, with C1 positive; the upper hydrogen on C2 is highlighted, and a curved arrow runs from its C–H bond to C1. Arrow down, labeled 1,2-hydride shift. Middle: the isopropyl cation, CH3–CH plus–CH3, with the charge on C2. Arrow down, labeled benzene attacks, then loses H plus. Bottom: isopropylbenzene, a benzene ring carrying a CH with two methyl groups, labeled the major product.',
  viewBox: '0 0 340 530',
  build() {
    let s = '';
    s += tg(170, 22, 'from CH₃CH₂CH₂Cl + AlCl₃');
    let y = 96;
    const c3 = P(70, y), c2 = P(160, y), c1 = P(252, y);
    const hUp = P(160, y - 46), hDn = P(160, y + 46);
    const m1 = {
      atoms: {
        C3: { ...c3, l: 'CH₃' }, C2: { ...c2, l: 'C', r: 14 }, C1: { ...c1, l: 'CH₂', k: 'warn' },
        Hu: { ...hUp, l: 'H', k: 'hi', r: 12 }, Hd: { ...hDn, l: 'H' },
      },
      bonds: [['C3', 'C2'], ['C2', 'C1'], ['C2', 'Hu', 1, 'fg-bond-hi'], ['C2', 'Hd']],
      charges: [['C1', '+', 300, 28]],
    };
    s += mol(m1);
    s += curve(P(166, y - 26), at(c1, 225, 20), { bow: -18 });
    s += mut(70, y + 34, 'C3');
    s += mut(188, y + 34, 'C2');
    s += mut(252, y + 36, 'C1');
    s += tg(170, 172, 'primary cation: + on C1');
    s += rxn(P(170, 184), P(170, 222), '1,2-hydride shift');
    y = 290;
    const m2 = {
      atoms: {
        A: { ...P(70, y), l: 'CH₃' }, B: { ...P(160, y), l: 'C', k: 'warn', r: 14 }, C: { ...P(252, y), l: 'CH₃', k: 'hi' },
        H: { ...P(160, y - 46), l: 'H' },
      },
      bonds: [['A', 'B'], ['B', 'C'], ['B', 'H']],
      charges: [['B', '+', 60, 26]],
    };
    s += mol(m2);
    s += tg(170, 340, 'secondary cation: + on C2, more stable');
    s += rxn(P(170, 352), P(170, 396), 'benzene attacks,', 'then H⁺ is lost');
    {
      const c = P(110, 466), R = 32;
      const r = flatRing(c, R);
      s += r.s + chain(r.v0, 'isopropyl');
      s += tg(214, 492, 'isopropylbenzene', 'start');
      s += tg(214, 508, '(major product)', 'start');
    }
    return s;
  },
  caption: 'The highlighted H moves from C2 to C1 with its bonding pair. The CH₃ it lands on is highlighted in the second cation.',
});

/* ========================================================== FC fails === */
FIGURES.push({
  id: 'fc-fails',
  section: 'eas',
  anchor: 'Both limits apply to acylation as well.</p>',
  alt: 'Two rows. Top: nitrobenzene with chloromethane and AlCl3 gives no reaction. Bottom: aniline, a benzene ring carrying NH2, with AlCl3; a curved arrow runs from the nitrogen lone pair to aluminum, giving a complex in which nitrogen carries two hydrogens, the ring and AlCl3, nitrogen plus one and aluminum minus one.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    let y = 100;
    {
      const c = P(90, y + 16), R = 34;
      const { s: rs, v } = ring(c, R, [0, 2, 4]);
      s += rs + sub(c, v[0], 'NO₂', { kind: 'warn', r: 18, len: 34 });
    }
    s += rxn(P(160, y + 10), P(290, y + 10), 'CH₃Cl, AlCl₃');
    s += warn(310, y + 14, 'no reaction', 'start');
    s += tg(460, y + 4, 'NO₂ pulls electron density', 'start');
    s += tg(460, y + 20, 'out of the ring: strongly deactivated', 'start');
    s += rule(24, 178, 736, 178);
    y = 280;
    {
      const c = P(90, y + 20), R = 34;
      const { s: rs, v } = ring(c, R, [0, 2, 4]);
      s += rs;
      const n = away(c, v[0], 36);
      const m = { atoms: { N: { ...n, l: 'N', k: 'hi', r: 14 } }, bonds: [], lp: [['N', 330]] };
      arms(m, 'N', [[200, 'H'], [262, 'H']], 34);
      s += bond(v[0], n, { rFrom: 0, rTo: 14 });
      s += mol(m);
      const al = P(n.x + 96, n.y - 6);
      s += mol(alcl3(al, [270, 30, 90]));
      const lp = at(n, 330, 21);
      s += curve(P(lp.x + 3, lp.y - 3), at(al, 195, 18), { bow: -14 });
      s += tg(96, 366, 'aniline + AlCl₃');
    }
    s += arrow(P(290, y - 14), P(350, y - 14));
    {
      const c = P(430, y + 20), R = 34;
      const { s: rs, v } = ring(c, R, [0, 2, 4]);
      s += rs;
      const n = away(c, v[0], 36);
      const al = P(n.x + 70, n.y);
      const m = { atoms: { N: { ...n, l: 'N', k: 'warn', r: 14 } }, bonds: [], charges: [['N', '+', 300, 24]] };
      arms(m, 'N', [[200, 'H'], [240, 'H']], 34);
      s += bond(v[0], n, { rFrom: 0, rTo: 14 });
      s += mol(m);
      s += mol(alcl3(al, [270, 30, 90]));
      s += bond(n, al, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' });
      s += charge(at(al, 150, 28), '−');
    }
    s += tg(600, y - 30, 'N +1, Al −1:', 'start');
    s += tg(600, y - 14, 'a positive N on', 'start');
    s += tg(600, y + 2, 'the ring deactivates it', 'start');
    return s;
  },
  caption: 'Top: a strongly deactivated ring. Bottom: the NH₂ lone pair binds AlCl₃ before any electrophile can form, and the positive nitrogen then deactivates the ring.',
});

/* ============================================ making propylbenzene === */
FIGURES.push({
  id: 'propylbenzene-route',
  section: 'eas',
  anchor: 'a propyl cation rearranges, and a propanoyl acylium ion does not.</p>',
  alt: 'Two rows. Top: benzene with 1-chloropropane and AlCl3 gives isopropylbenzene, marked with a cross. Bottom: benzene with propanoyl chloride and AlCl3 gives 1-phenylpropan-1-one, a ketone with the C=O next to the ring; then zinc amalgam and HCl reduce the C=O to CH2, giving propylbenzene, marked with a check.',
  viewBox: '0 0 760 280',
  build() {
    let s = '';
    const R = 30;
    let y = 76;
    s += flatRing(P(60, y), R).s;
    s += rxn(P(104, y), P(254, y), 'CH₃CH₂CH₂Cl, AlCl₃');
    {
      const r = flatRing(P(300, y), R);
      s += r.s + chain(r.v0, 'isopropyl');
    }
    s += warn(420, y - 4, 'isopropylbenzene ✗', 'start');
    s += tg(420, y + 14, 'mostly branched: the cation rearranged', 'start');
    s += rule(24, 132, 736, 132);
    y = 214;
    s += flatRing(P(60, y), R).s;
    s += rxn(P(104, y), P(234, y), 'CH₃CH₂COCl', 'AlCl₃');
    {
      const r = flatRing(P(282, y), R);
      s += r.s + chain(r.v0, 'propanoyl');
      s += tg(318, 268, '1-phenylpropan-1-one');
    }
    s += rxn(P(418, y), P(516, y), 'Zn(Hg), HCl');
    {
      const r = flatRing(P(562, y), R);
      s += r.s + chain(r.v0, 'propyl');
    }
    s += good(690, y + 42, 'propylbenzene ✓');
    return s;
  },
  caption: 'Compare the two products on the right: a branched chain from one step, and a straight chain from two.',
});

FIGURES.push({
  id: 'l-propyl-route',
  lessons: ['eas'],
  alt: 'Stacked. Benzene, then an arrow labeled propanoyl chloride and AlCl3, then 1-phenylpropan-1-one, a ketone with the C=O next to the ring. Then an arrow labeled zinc amalgam and HCl, then propylbenzene with a straight three-carbon chain.',
  viewBox: '0 0 340 440',
  build() {
    let s = '';
    const R = 30;
    s += flatRing(P(110, 50), R).s;
    s += rxn(P(110, 92), P(110, 138), 'CH₃CH₂COCl, AlCl₃');
    {
      const r = flatRing(P(110, 200), R);
      s += r.s + chain(r.v0, 'propanoyl');
      s += tg(20, 256, '1-phenylpropan-1-one (a ketone)', 'start');
    }
    s += rxn(P(110, 272), P(110, 318), 'Zn(Hg), HCl');
    {
      const r = flatRing(P(110, 380), R);
      s += r.s + chain(r.v0, 'propyl');
      s += good(250, 420, 'propylbenzene ✓');
    }
    return s;
  },
  caption: 'Acylate, then reduce the C=O to CH₂.',
});

/* One fully drawn example of each of the five reactions. The notes give the
   other four as table rows only. */
FIGURES.push({
  id: 'five-eas-reactions',
  section: 'eas',
  anchor: 'The five reactions side by side:</p>',
  alt: 'Five rows, each showing benzene, an arrow carrying the reagents, and the product ring with its new substituent: bromobenzene from bromine and iron tribromide, nitrobenzene from nitric and sulfuric acid, benzenesulfonic acid from sulfur trioxide with a reverse arrow underneath, ethylbenzene from chloroethane and aluminum trichloride with a faint second ethyl group, and acetophenone from acetyl chloride and aluminum trichloride.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';
    /* A flat-right hexagon so the substituent can hang off horizontally. */
    const hex = (cx, cy, r) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
      }
      return v;
    };
    const ring5 = (cx, cy) => {
      const v = hex(cx, cy, 24), mid = P(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if ([0, 2, 4].includes(i)) g += ringDouble(v[i], v[j], mid, { inset: 6, gap: 3.4 });
        else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
      }
      return g;
    };
    const rows = [
      { y: 72,  rgt: 'Br₂, FeBr₃',      sub: 'Br',     r: 15, name: 'bromobenzene',          note: 'FeBr₃ is a catalyst: a little is enough' },
      { y: 152, rgt: 'HNO₃, H₂SO₄',     sub: 'NO₂',    r: 18, name: 'nitrobenzene',          note: 'the nitro group can later become NH₂' },
      { y: 232, rgt: 'SO₃, H₂SO₄',      sub: 'SO₃H',   r: 21, name: 'benzenesulfonic acid',  note: 'hot dilute aqueous acid reverses it' },
      { y: 312, rgt: 'CH₃CH₂Cl, AlCl₃', sub: 'CH₂CH₃', r: 25, name: 'ethylbenzene',         note: 'the product reacts faster, so it goes again' },
      { y: 392, rgt: 'CH₃COCl, AlCl₃',  sub: 'COCH₃',  r: 23, name: 'acetophenone',          note: 'the product reacts slower, so it stops at one' },
    ];
    s += tag(380, 28, 'THE FIVE REACTIONS, EACH DRAWN ONCE');
    rows.forEach((row, i) => {
      const y = row.y;
      s += ring5(70, y);
      if (i === 2) {
        s += arrow(P(106, y - 6), P(196, y - 6));
        s += arrow(P(196, y + 12), P(106, y + 12), { muted: true });
        s += text(151, y - 16, row.rgt, { cls: 'fg-sm', size: 10.5 });
        s += text(151, y + 30, 'H₂O, H⁺, Δ', { cls: 'fg-sm', size: 10.5 });
      } else {
        s += arrow(P(106, y), P(196, y));
        s += text(151, y - 10, row.rgt, { cls: 'fg-sm', size: 10.5 });
      }
      s += ring5(248, y);
      const v = hex(248, y, 24);
      s += bond(v[0], P(248 + 24 + 32, y), { rFrom: 0, rTo: row.r });
      s += atom(248 + 24 + 32, y, row.sub, { kind: 'hi', r: row.r, size: row.sub.length > 3 ? 8.5 : 10 });
      if (i === 3) {
        /* The second alkylation, drawn faint: this is the whole problem. */
        s += bond(v[2], P(248 - 34, y + 42), { rFrom: 0, rTo: 13, cls: 'fg-bond-soft' });
        s += text(248 - 40, y + 46, 'CH₂CH₃', { cls: 'fg-mut', size: 11 });
      }
      s += label(356, y - 4, row.name, { size: 12.5, anchor: 'start' });
      s += text(356, y + 16, row.note, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    });
    return s;
  },
  caption: 'Rows 4 and 5 make a carbon&ndash;carbon bond. Look for the reverse arrow in row 3 and the faint second ethyl group in row 4.',
});

export default FIGURES;
