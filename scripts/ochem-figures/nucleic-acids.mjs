/* Figures for the nucleic-acids notes page and its lesson. Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Conventions, kept the same as the carbohydrates page:

     Haworth furanose  ring oxygen at the back, C1' at the right corner,
                       C2' front right, C3' front left, C4' at the left.
                       The front edge is drawn thick, every substituent is
                       a vertical stick, and the hydrogens on the ring
                       carbons are left off unless one is the point. The
                       coral dot marks the anomeric carbon, C1'.
     beta              the base (or the C1' OH) points up, on the same
                       side as the CH2 at C5'.
     bases             drawn skeletal (chapter 2 on), every N and O
                       labelled, in their usual lactam and amino forms.

   Lesson copies (id prefix l-) and the figures shared with the lesson are
   340 wide or less, stacked, and use only fg-lbl and fg-tag text. */
import { atom as atom0, bond, arrow, curve, lonePair, text, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
const mid = (a, b, f = 0.5) => P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);

/* An atom disc that stays opaque in both themes (the tinted discs are
   translucent in the dark theme, so a plain disc goes under them). */
function atom(x, y, l, o = {}) {
  const kind = o.kind || 'plain';
  const back = kind === 'hi' || kind === 'warn'
    ? `<circle class="fg-atom" cx="${r2(x)}" cy="${r2(y)}" r="${r2(o.r ?? 16)}"></circle>` : '';
  return back + atom0(x, y, l, o);
}
const rOf = (l) => {
  const n = [...String(l)].length;
  return l === 'H' ? 11 : n <= 2 ? 14 : n === 3 ? 18 : n === 4 ? 20 : 22;
};
const A = (p, l, o = {}) => atom(p.x, p.y, l, { r: o.r ?? rOf(l), ...o });
const lbl = (x, y, s, anchor = 'middle') => text(x, y, s, { cls: 'fg-lbl', size: 13, anchor });
const tg = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });
const dot = (p) => atom(p.x, p.y, '', { kind: 'warn', r: 5 });
/* A bond between two labelled atoms, trimmed by label size. */
const bd = (a, la, b, lb, o = {}) => bond(a, b, { rFrom: la ? rOf(la) : 0, rTo: lb ? rOf(lb) : 0, ...o });
/* A thick front-edge bond. */
function front(a, b, rA = 0, rB = 0) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return `<line class="fg-bond-hi" x1="${r2(a.x + ux * rA)}" y1="${r2(a.y + uy * rA)}" x2="${r2(b.x - ux * rB)}" y2="${r2(b.y - uy * rB)}"></line>`;
}
/* A dashed hydrogen bond, trimmed at both labels. */
function hb(a, ra, b, rb) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return `<line class="fg-dash-hi" x1="${r2(a.x + ux * ra)}" y1="${r2(a.y + uy * ra)}" x2="${r2(b.x - ux * rb)}" y2="${r2(b.y - uy * rb)}"></line>`;
}
/* Equilibrium arrows. */
function eq(a, b, gap = 5) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const px = (-dy / L) * gap, py = (dx / L) * gap;
  return arrow(P(a.x + px, a.y + py), P(b.x + px, b.y + py), { size: 7 }) +
         arrow(P(b.x - px, b.y - py), P(a.x - px, a.y - py), { size: 7 });
}

/* --------------------------------------------------- Haworth furanose --- */
/* Slots as on the carbohydrates page (scaled by k). */
const SLOT5 = { O: [0, -44], 1: [66, -8], 2: [40, 32], 3: [-40, 32], 4: [-66, -8] };
const NUM = { 1: [16, 16], 2: [18, 16], 3: [-18, 16], 4: [-16, 16] };

/* furanose(c, o) draws the ring and returns atom positions.
   o.c1: label written at C1' (e.g. none); o.dot: mark C1'.
   o.nums: write 1'..4' beside the ring carbons.
   Substituents are drawn by the caller from pos. */
function furanose(c, o = {}) {
  const k = o.k ?? 1;
  const pos = {};
  for (const [key, [dx, dy]] of Object.entries(SLOT5)) pos[key] = P(c.x + dx * k, c.y + dy * k);
  let s = '';
  s += bond(pos.O, pos[1], { rFrom: 14, rTo: 0 });
  s += bond(pos[1], pos[2], { rFrom: 0, rTo: 0 });
  s += front(pos[2], pos[3]);
  s += bond(pos[3], pos[4], { rFrom: 0, rTo: 0 });
  s += bond(pos[4], pos.O, { rFrom: 0, rTo: 14 });
  s += A(pos.O, 'O');
  if (o.nums !== false) {
    for (const key of ['1', '2', '3', '4']) {
      const [ox, oy] = NUM[key];
      s += tg(pos[key].x + ox, pos[key].y + oy, key + (o.prime === false ? '' : '′'));
    }
  }
  if (o.dot) s += dot(pos[1]);
  return { s, pos };
}
/* A vertical stick from a ring carbon: up (dir -1) or down (+1). */
const stick = (p, dir, len, l, o = {}) => {
  const e = P(p.x, p.y + dir * (len + rOf(l)));
  return { s: bond(p, e, { rFrom: 0, rTo: rOf(l), cls: o.cls }) + A(e, l, { kind: o.kind }), e };
};

/* ------------------------------------------------------------- bases --- */
/* Each base is described in a local frame (math axes, y up, unit = one
   bond) in its standard orientation, then rotated and placed.
     pyrimidine: N1 at the bottom (bond to the sugar straight down), C2
                 lower right, N3 upper right, C4 top, C5 upper left, C6
                 lower left.
     purine:     six-ring C6 top, N1 upper left, C2 lower left, N3 bottom,
                 C4 lower right, C5 upper right; the five-ring is fused on
                 the C4-C5 edge, and N9 bonds to the sugar. */
const S3 = Math.sqrt(3) / 2;
const polar = (p, deg, len) => [p[0] + Math.cos(rad(deg)) * len, p[1] + Math.sin(rad(deg)) * len];

function baseSpec(kind, form = 'usual') {
  const at = {}, lab = {}, bonds = [], rings = {};
  if (kind === 'C' || kind === 'T' || kind === 'U') {
    Object.assign(at, { N1: [0, -1], C2: [S3, -0.5], N3: [S3, 0.5], C4: [0, 1], C5: [-S3, 0.5], C6: [-S3, -0.5] });
    rings.six = [0, 0];
    at.X2 = polar(at.C2, -30, 1);
    at.X4 = polar(at.C4, 90, 1);
    at.S = polar(at.N1, -90, 1.2);
    lab.N1 = 'N'; lab.N3 = 'N'; lab.X2 = 'O';
    bonds.push(['N1', 'C2'], ['C2', 'X2', 2], ['C2', 'N3'], ['C4', 'C5'], ['C5', 'C6', 2, 'six'], ['C6', 'N1'], ['N1', 'S']);
    if (kind === 'C') {
      lab.X4 = 'N';
      bonds.push(['N3', 'C4', 2, 'six'], ['C4', 'X4']);
      at.H4a = polar(at.X4, 30, 1.2); at.H4b = polar(at.X4, 150, 1.2);
      lab.H4a = 'H'; lab.H4b = 'H';
      bonds.push(['X4', 'H4a'], ['X4', 'H4b']);
    } else if (form === 'lactim') {
      lab.X4 = 'O';
      bonds.push(['N3', 'C4', 2, 'six'], ['C4', 'X4']);
      at.H4 = polar(at.X4, 30, 1.2); lab.H4 = 'H';
      bonds.push(['X4', 'H4']);
    } else {
      lab.X4 = 'O';
      bonds.push(['N3', 'C4'], ['C4', 'X4', 2]);
      at.H3 = polar(at.N3, 30, 1.2); lab.H3 = 'H';
      bonds.push(['N3', 'H3']);
    }
    if (kind === 'T') { at.Me = polar(at.C5, 150, 1); lab.Me = 'CH₃'; bonds.push(['C5', 'Me']); }
  } else {
    Object.assign(at, { C6: [0, 1], N1: [-S3, 0.5], C2: [-S3, -0.5], N3: [0, -1], C4: [S3, -0.5], C5: [S3, 0.5] });
    rings.six = [0, 0];
    // the fused pentagon: centre beyond the C4-C5 edge
    const ap = 0.5 / Math.tan(rad(36)), R5 = 0.5 / Math.sin(rad(36));
    const pc = [S3 + ap, 0];
    rings.five = pc;
    const v = (deg) => [pc[0] + R5 * Math.cos(rad(deg)), pc[1] + R5 * Math.sin(rad(deg))];
    at.N7 = v(72); at.C8 = v(0); at.N9 = v(-72);
    at.S = polar(at.N9, -72, 1.2);
    at.X6 = polar(at.C6, 90, 1);
    lab.N1 = 'N'; lab.N3 = 'N'; lab.N7 = 'N'; lab.N9 = 'N';
    bonds.push(['C6', 'C5'], ['C5', 'C4', 2, 'six'], ['C4', 'N3'], ['N3', 'C2', 2, 'six'],
      ['C5', 'N7'], ['N7', 'C8', 2, 'five'], ['C8', 'N9'], ['N9', 'C4'], ['N9', 'S']);
    if (kind === 'A') {
      lab.X6 = 'N';
      bonds.push(['N1', 'C6', 2, 'six'], ['C2', 'N1'], ['C6', 'X6']);
      at.H6a = polar(at.X6, 150, 1.2); at.H6b = polar(at.X6, 30, 1.2);
      lab.H6a = 'H'; lab.H6b = 'H';
      bonds.push(['X6', 'H6a'], ['X6', 'H6b']);
    } else {
      lab.X6 = 'O';
      bonds.push(['N1', 'C6'], ['C2', 'N1'], ['C6', 'X6', 2]);
      at.H1 = polar(at.N1, 150, 1.2); lab.H1 = 'H';
      at.X2 = polar(at.C2, 210, 1); lab.X2 = 'N';
      at.H2a = polar(at.X2, 150, 1.2); at.H2b = polar(at.X2, 270, 1.2);
      lab.H2a = 'H'; lab.H2b = 'H';
      bonds.push(['N1', 'H1'], ['C2', 'X2'], ['X2', 'H2a'], ['X2', 'H2b']);
    }
  }
  return { at, lab, bonds, rings };
}

/* drawBase(kind, o) -> { s, p (screen positions), lab }
   o.c: screen position of the local origin; o.b: bond length in px;
   o.rot: rotation in degrees (counterclockwise); o.form: 'usual'|'lactim';
   o.compact: fold explicit H into 'NH' / 'NH₂' labels;
   o.sugar: label at the sugar end ('' for a bare stub, null for none);
   o.hiMe: shade thymine's methyl. */
function drawBase(kind, o) {
  const { at, lab, bonds, rings } = baseSpec(kind, o.form);
  const b = o.b ?? 32, c = o.c, rot = rad(o.rot ?? 0);
  const tf = ([x, y]) => P(c.x + b * (x * Math.cos(rot) - y * Math.sin(rot)),
                           c.y - b * (x * Math.sin(rot) + y * Math.cos(rot)));
  const p = {};
  for (const [k, v] of Object.entries(at)) p[k] = tf(v);
  const rc = {};
  for (const [k, v] of Object.entries(rings)) rc[k] = tf(v);
  const L = { ...lab };
  if (o.compact) {
    // fold each explicit H into its heavy atom's label
    const hs = Object.keys(L).filter((k) => k.startsWith('H'));
    for (const h of hs) {
      const bnd = bonds.find((x) => x[1] === h);
      const heavy = bnd[0];
      L[heavy] = L[heavy] === 'N' ? 'NH' : L[heavy] === 'NH' ? 'NH₂' : L[heavy] === 'O' ? 'OH' : L[heavy];
      delete L[h];
    }
  }
  if (o.sugar === null) delete p.S;
  const r = (k) => (L[k] ? rOf(L[k]) : 0);
  let s = '';
  for (const [a, z, order, ring] of bonds) {
    if (!p[a] || !p[z]) continue;
    if (o.compact && (z.startsWith('H'))) continue;
    if (z === 'S') {
      s += bond(p[a], p[z], { rFrom: r(a), rTo: 0 });
      continue;
    }
    if (ring) {
      // inset second line on the ring side; trim the full line at labels
      const inward = rc[ring];
      s += bond(p[a], p[z], { rFrom: r(a), rTo: r(z) });
      const t = ringDouble(p[a], p[z], inward, { inset: 11, gap: 4.6 });
      // keep only the inset line (the second <line>)
      s += t.slice(t.indexOf('</line>') + 7);
    } else {
      s += bond(p[a], p[z], { rFrom: r(a), rTo: r(z), order: order || 1 });
    }
  }
  for (const [k, l] of Object.entries(L)) {
    if (!p[k]) continue;
    const kind2 = (k === 'Me' && o.hiMe) ? 'warn' : (o.kinds && o.kinds[k]) || undefined;
    s += A(p[k], l, { kind: kind2 });
  }
  if (o.sugar) s += tg(p.S.x, p.S.y + 15, o.sugar);
  /* a ring locant: inside the ring (toward its centre) or at an offset */
  const loc = (k, n, ring, f = 0.55, off) => {
    const q = off ? P(p[k].x + off[0], p[k].y + off[1]) : mid(p[k], rc[ring], f);
    return tg(q.x, q.y + 4, n, 'fg-tag-mut');
  };
  return { s, p, lab: L, loc };
}

/* ================================================= 1. the two sugars === */
function sugarPair(c, deoxy, k = 1) {
  const F = furanose(c, { k, dot: true, prime: false });
  const { pos } = F;
  let s = F.s;
  const up1 = stick(pos[1], -1, 20, 'OH');
  const dn2 = stick(pos[2], 1, 20, deoxy ? 'H' : 'OH', { kind: 'warn' });
  const dn3 = stick(pos[3], 1, 20, 'OH');
  const up4 = stick(pos[4], -1, 20, 'CH₂OH');
  s += up1.s + dn2.s + dn3.s + up4.s;
  s += tg(up4.e.x - 34, up4.e.y + 4, '5', 'fg-tag', 'end');
  return { s, pos, ends: { up1: up1.e, dn2: dn2.e, dn3: dn3.e, up4: up4.e } };
}

FIGURES.push({
  id: 'sugars-ribose-deoxy',
  section: 'nucleic-acids',
  anchor: '<h3>Three pieces, two names</h3>',
  alt: 'Two Haworth rings side by side. Left, ribose, the sugar of RNA: ring oxygen at the back, C1 at the right with an OH up (the beta anomer), C2 with an OH down, C3 with an OH down, and C4 carrying the CH2OH (C5) up. Right, 2-deoxyribose, the sugar of DNA: identical except that C2 carries H instead of OH.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    s += panel(20, 20, 350, 262);
    s += panel(390, 20, 350, 262);
    s += tg(195, 44, 'RIBOSE: THE SUGAR OF RNA');
    s += tg(565, 44, '2-DEOXYRIBOSE: THE SUGAR OF DNA');
    const L = sugarPair(P(190, 160), false);
    const R = sugarPair(P(560, 160), true);
    s += L.s + R.s;
    s += tg(L.ends.dn2.x + 28, L.ends.dn2.y + 4, 'OH at C2', 'fg-tag-warn', 'start');
    s += tg(R.ends.dn2.x + 24, R.ends.dn2.y + 4, 'H at C2', 'fg-tag-warn', 'start');
    for (const F of [L, R]) {
      s += tg(F.pos[1].x + 18, F.pos[1].y - 22, 'anomeric', 'fg-tag', 'start');
      s += tg(F.pos[1].x + 18, F.pos[1].y - 8, 'carbon', 'fg-tag', 'start');
    }
    return s;
  },
  caption: 'Ribose and 2-deoxyribose drawn as Haworth projections, the flat ring drawing from the carbohydrates section, with the β anomer shown. The only change is at C2 (coral). The coral dot marks C1, the anomeric carbon. Hydrogens on the ring carbons are left off, except the one at C2 that makes the difference.',
});

FIGURES.push({
  id: 'l-sugars-ribose-deoxy',
  lessons: ['nucleic-acids'],
  alt: 'Ribose (top) and 2-deoxyribose (bottom) as Haworth rings, numbered 1 to 5. They differ only at C2: OH in ribose, H in 2-deoxyribose.',
  viewBox: '0 0 340 520',
  build() {
    let s = '';
    s += tg(170, 22, 'RIBOSE (RNA)');
    s += tg(170, 282, '2-DEOXYRIBOSE (DNA)');
    const T = sugarPair(P(160, 140), false);
    const B = sugarPair(P(160, 400), true);
    s += T.s + B.s;
    s += tg(T.ends.dn2.x + 26, T.ends.dn2.y + 4, 'OH at C2', 'fg-tag-warn', 'start');
    s += tg(B.ends.dn2.x + 22, B.ends.dn2.y + 4, 'H at C2', 'fg-tag-warn', 'start');
    s += rule(20, 262, 320, 262);
    return s;
  },
  caption: 'The two sugars differ only at C2 (coral). The coral dot marks C1, the anomeric carbon.',
});

/* ======================================== 2. one nucleotide, dAMP ====== */
/* Shared by the notes and the lesson, so 340 wide. */
function nucleotide() {
  let s = '';
  const c = P(170, 244);
  const F = furanose(c, { dot: true });
  const { pos } = F;
  s += F.s;
  // C2': H (DNA); C3': OH
  const h2 = stick(pos[2], 1, 18, 'H', { kind: 'warn' });
  const o3 = stick(pos[3], 1, 20, 'OH');
  s += h2.s + o3.s;
  // C4' -> C5'H2 -> O -> P
  const c5 = P(pos[4].x, pos[4].y - 50);
  s += bond(pos[4], c5, { rFrom: 0, rTo: rOf('CH₂') }) + A(c5, 'CH₂');
  s += tg(c5.x + 26, c5.y + 4, '5′', 'fg-tag', 'start');
  const o5 = P(c5.x - 36, c5.y - 38);
  s += bd(c5, 'CH₂', o5, 'O', { cls: 'fg-bond-hi' }) + A(o5, 'O');
  const Pp = P(o5.x - 4, o5.y - 50);
  s += bd(o5, 'O', Pp, 'P', { cls: 'fg-bond-hi' });
  const oA = P(Pp.x, Pp.y - 52), oB = P(Pp.x + 48, Pp.y - 22), oC = P(Pp.x - 2, Pp.y + 0);
  s += bd(Pp, 'P', oA, 'O', { order: 2 });
  s += bd(Pp, 'P', oB, 'O⁻');
  s += A(Pp, 'P', { kind: 'warn' }) + A(oA, 'O') + A(oB, 'O⁻');
  // third oxygen, to the lower left
  const oD = P(Pp.x - 30, Pp.y + 40);
  s += bd(Pp, 'P', oD, 'O⁻') + A(oD, 'O⁻');
  void oC;
  s += tg(o5.x + 22, o5.y - 10, 'phosphate', 'fg-tag-warn', 'start');
  s += tg(o5.x + 22, o5.y + 4, 'ester', 'fg-tag-warn', 'start');
  // C1' -> N9 of adenine, base up (beta)
  const n9 = P(pos[1].x, pos[1].y - 58);
  const bopt = { b: 30, rot: -18, sugar: null, compact: true, kinds: { N9: 'hi' } };
  const probe = drawBase('A', { ...bopt, c: P(0, 0) });
  // place the base so its N9 lands on n9
  s += drawBase('A', { ...bopt, c: P(n9.x - probe.p.N9.x, n9.y - probe.p.N9.y) }).s;
  s += bond(pos[1], n9, { rFrom: 0, rTo: rOf('N'), cls: 'fg-bond-hi' });
  s += tg(pos[1].x + 10, pos[1].y - 30, 'N-glycosidic', 'fg-tag-good', 'start');
  s += tg(pos[1].x + 10, pos[1].y - 16, 'bond', 'fg-tag-good', 'start');
  s += tg(n9.x - 30, n9.y - 118, 'ADENINE');
  // brackets
  s += rule(24, 344, 316, 344);
  s += lbl(170, 368, 'nucleoside = base + sugar');
  s += lbl(170, 390, 'nucleotide = base + sugar + phosphate');
  return s;
}
FIGURES.push({
  id: 'nucleotide-drawn',
  section: 'nucleic-acids',
  lessons: ['nucleic-acids'],
  anchor: 'the nucleoside becomes a <b>nucleotide</b>.',
  alt: 'dAMP drawn out. A 2-deoxyribose Haworth ring numbered 1 prime to 4 prime; adenine bonded through its N9 to C1 prime, pointing up; H down on C2 prime; OH down on C3 prime; and from C4 prime a CH2 (C5 prime) joined through an oxygen to a phosphate carrying one double-bonded O and two O minus.',
  viewBox: '0 0 340 404',
  build: nucleotide,
  caption: 'dAMP, one DNA nucleotide. The base hangs from C1′ through an N-glycosidic bond (green), the phosphate is an ester on the 5′ oxygen (coral), and the OH on C3′ is left free for the next nucleotide.',
});

/* ================================================= 3. the five bases === */
FIGURES.push({
  id: 'bases-five',
  section: 'nucleic-acids',
  anchor: '<h3>The bases, in two families</h3>',
  alt: 'The five bases, each with its bond to the sugar pointing down. Top row, the purines: adenine and guanine, each a six-membered ring fused to a five-membered ring, bonded to the sugar through N9. Bottom row, the pyrimidines: cytosine, thymine and uracil, each a single six-membered ring bonded to the sugar through N1. Thymine carries a CH3 on C5 that uracil lacks.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    s += panel(20, 16, 720, 208);
    s += panel(20, 240, 720, 214);
    s += tg(380, 38, 'PURINES: TWO FUSED RINGS, BONDED TO THE SUGAR THROUGH N9');
    s += tg(380, 262, 'PYRIMIDINES: ONE RING, BONDED TO THE SUGAR THROUGH N1');
    const pur = [['A', 'adenine (A)', 230], ['G', 'guanine (G)', 500]];
    for (const [k, name, x] of pur) {
      const B = drawBase(k, { c: P(x, 118), b: 30, sugar: 'sugar', compact: true, kinds: { N9: 'hi' } });
      s += B.s + B.loc('N9', '9', null, 0, [-20, 16]);
      s += lbl(x + 20, 212, name);
    }
    const pyr = [['C', 'cytosine (C)', 170], ['T', 'thymine (T)', 390], ['U', 'uracil (U)', 610]];
    for (const [k, name, x] of pyr) {
      const B = drawBase(k, { c: P(x, 340), b: 30, sugar: 'sugar', compact: true, hiMe: true, kinds: { N1: 'hi' } });
      s += B.s + B.loc('N1', '1', null, 0, [-20, 14]) + B.loc('C5', '5', 'six', 0.42);
      s += lbl(x, 440, name);
    }
    return s;
  },
  caption: 'The five bases, each with its bond to the sugar pointing down. The shaded nitrogen is the one bonded to C1′. The coral CH₃ is the only difference between thymine and uracil.',
});

/* ================================================= 4. two nucleotides == */
/* Shared by the notes and the lesson, so 340 wide. */
function dinucleotide() {
  let s = '';
  const hi = { cls: 'fg-bond-hi' };
  // upper sugar
  const F1 = furanose(P(176, 150), { dot: true });
  s += F1.s;
  const p1 = F1.pos;
  const c5a = P(p1[4].x, p1[4].y - 48);
  s += bond(p1[4], c5a, { rFrom: 0, rTo: rOf('CH₂') }) + A(c5a, 'CH₂');
  const ho = P(c5a.x - 50, c5a.y);
  s += bd(c5a, 'CH₂', ho, 'HO') + A(ho, 'HO');
  s += tg(c5a.x + 26, c5a.y + 4, '5′', 'fg-tag', 'start');
  s += tg(ho.x + 6, ho.y - 24, '5′ END', 'fg-tag-good');
  const b1 = P(p1[1].x, p1[1].y - 46);
  s += bond(p1[1], b1, { rFrom: 0, rTo: 20 }) + A(b1, 'base', { r: 22 });
  s += stick(p1[2], 1, 16, 'H').s;
  // C3' -> O3' -> P -> O5' -> C5' of the lower sugar
  const o3 = P(p1[3].x, p1[3].y + 46);
  s += bond(p1[3], o3, { rFrom: 0, rTo: 14, ...hi }) + A(o3, 'O');
  const Pp = P(o3.x, o3.y + 52);
  s += bd(o3, 'O', Pp, 'P', hi);
  const oL = P(Pp.x - 50, Pp.y), oR = P(Pp.x + 50, Pp.y);
  s += bd(Pp, 'P', oL, 'O', { order: 2 }) + bd(Pp, 'P', oR, 'O⁻');
  s += A(Pp, 'P', { kind: 'warn' }) + A(oL, 'O') + A(oR, 'O⁻');
  const o5 = P(Pp.x, Pp.y + 52);
  s += bd(Pp, 'P', o5, 'O', hi) + A(o5, 'O');
  const c5b = P(o5.x, o5.y + 50);
  s += bd(o5, 'O', c5b, 'CH₂', hi) + A(c5b, 'CH₂');
  s += tg(c5b.x + 26, c5b.y + 4, '5′', 'fg-tag', 'start');
  s += tg(o3.x - 20, o3.y + 4, '3′-O', 'fg-tag', 'end');
  s += tg(o5.x - 20, o5.y + 4, '5′-O', 'fg-tag', 'end');
  s += tg(oR.x + 22, Pp.y - 18, 'phospho-', 'fg-tag-warn', 'start');
  s += tg(oR.x + 22, Pp.y - 4, 'diester', 'fg-tag-warn', 'start');
  // lower sugar: its C4' sits under the CH2
  const c2 = P(c5b.x + 66, c5b.y + 48 + 8);
  const F2 = furanose(c2, { dot: true });
  s += F2.s;
  const p2 = F2.pos;
  s += bond(c5b, p2[4], { rFrom: rOf('CH₂'), rTo: 0 });
  const b2 = P(p2[1].x, p2[1].y - 46);
  s += bond(p2[1], b2, { rFrom: 0, rTo: 20 }) + A(b2, 'base', { r: 22 });
  s += stick(p2[2], 1, 16, 'H').s;
  const oh = stick(p2[3], 1, 20, 'OH', { kind: 'warn' });
  s += oh.s;
  s += tg(oh.e.x, oh.e.y + 34, '3′ END', 'fg-tag-good');
  // direction arrow down the left side
  s += arrow(P(22, 70), P(22, 560), { size: 8 });
  s += tg(22, 60, '5′');
  s += tg(22, 578, '3′');
  return s;
}
FIGURES.push({
  id: 'dinucleotide',
  section: 'nucleic-acids',
  lessons: ['nucleic-acids'],
  anchor: 'with a base hanging off every sugar.</p>',
  alt: 'Two DNA nucleotides drawn as Haworth rings, one above the other. The upper sugar carries a CH2OH at C5 prime, the 5 prime end. From its C3 prime an oxygen bonds to a phosphorus that carries a double-bonded O and an O minus, and a second oxygen joins that phosphorus to the CH2 (C5 prime) of the lower sugar. The lower sugar has a free OH on C3 prime, the 3 prime end. An arrow down the left side runs from 5 prime to 3 prime.',
  viewBox: '0 0 340 600',
  build: dinucleotide,
  caption: 'Two nucleotides joined by one phosphodiester (thick bonds). The top sugar holds the 5′ end, and the free OH on the lower sugar’s C3′ is the 3′ end.',
});

/* ============================================ 5. how a chain grows ===== */
/* A phosphate: P with its four oxygens at given screen angles. */
function phos(Pp, arms, o = {}) {
  let s = '';
  const out = {};
  for (const a of arms) {
    const e = P(Pp.x + Math.cos(rad(a.deg)) * (a.len ?? 50), Pp.y - Math.sin(rad(a.deg)) * (a.len ?? 50));
    out[a.key] = e;
    if (a.skipBond) continue;
    s += bd(Pp, 'P', e, a.l, { order: a.order || 1, cls: a.cls });
  }
  let at = A(Pp, 'P', { kind: o.kind });
  for (const a of arms) if (!a.shared) at += A(out[a.key], a.l, { kind: a.kind });
  return { s: s + at, out };
}

FIGURES.push({
  id: 'polymerase-step',
  section: 'nucleic-acids',
  anchor: 'which is why chains grow 5′ to 3′.</p>',
  alt: 'Top: the last sugar of a growing DNA chain, whose C3 prime OH sits to the right of the first phosphorus of an incoming deoxynucleoside triphosphate. A curved arrow runs from a lone pair on the 3 prime oxygen to that phosphorus, and a second curved arrow takes the electrons of the bond from that phosphorus to the next oxygen along the phosphate chain. Bottom: the product, a new 3 prime O, P, O 5 prime link joining the chain to the new nucleotide, and the diphosphate ion that left.',
  viewBox: '0 0 760 680',
  build() {
    let s = '';
    s += panel(14, 14, 732, 444);
    s += panel(14, 472, 732, 194);
    s += tg(30, 36, 'THE ATTACK', 'fg-tag', 'start');
    // chain-end sugar, top right
    const F = furanose(P(560, 110), { dot: true });
    s += F.s;
    const p = F.pos;
    const up4 = P(p[4].x, p[4].y - 40);
    s += bond(p[4], up4, { rFrom: 0, rTo: rOf('CH₂') }) + A(up4, 'CH₂');
    s += tg(up4.x - 26, up4.y + 4, 'chain', 'fg-tag', 'end');
    const b1 = P(p[1].x, p[1].y - 40);
    s += bond(p[1], b1, { rFrom: 0, rTo: 20 }) + A(b1, 'base', { r: 22 });
    s += stick(p[2], 1, 16, 'H').s;
    const o3 = P(p[3].x, p[3].y + 58);
    s += bond(p[3], o3, { rFrom: 0, rTo: 14 }) + A(o3, 'O', { kind: 'hi' });
    const h3 = P(o3.x + 40, o3.y + 12);
    s += bd(o3, 'O', h3, 'H') + A(h3, 'H');
    s += lonePair(o3.x, o3.y, 180, { dist: 20 });
    s += lonePair(o3.x, o3.y, 250, { dist: 20 });
    s += tg(o3.x + 60, o3.y + 46, 'the chain’s 3′ OH', 'fg-tag');
    // incoming dNTP: P-alpha directly left of O3', the triphosphate running left
    const Pa = P(o3.x - 118, o3.y);
    const PA = phos(Pa, [
      { key: 'up', deg: 90, l: 'O', order: 2 },
      { key: 'lo', deg: 240, l: 'O⁻' },
      { key: 'o5', deg: 300, l: 'O' },
      { key: 'ab', deg: 180, l: 'O', len: 56 },
    ], { kind: 'warn' });
    s += PA.s;
    const Pb = P(PA.out.ab.x - 56, Pa.y);
    const PB = phos(Pb, [
      { key: 'ab', deg: 0, l: 'O', len: 56, shared: true },
      { key: 'up', deg: 90, l: 'O', order: 2 },
      { key: 'dn', deg: 270, l: 'O⁻' },
      { key: 'bg', deg: 180, l: 'O', len: 56 },
    ]);
    s += PB.s;
    const Pg = P(PB.out.bg.x - 56, Pa.y);
    const PG = phos(Pg, [
      { key: 'bg', deg: 0, l: 'O', len: 56, shared: true },
      { key: 'up', deg: 90, l: 'O', order: 2 },
      { key: 'dn', deg: 270, l: 'O⁻' },
      { key: 'end', deg: 180, l: 'O⁻' },
    ]);
    s += PG.s;
    s += tg(Pa.x, Pa.y - 76, 'Pα', 'fg-tag-warn');
    s += tg(Pb.x, Pb.y - 76, 'Pβ', 'fg-tag');
    s += tg(Pg.x, Pg.y - 76, 'Pγ', 'fg-tag');
    // incoming sugar hangs below the O5'
    const o5 = PA.out.o5;
    const c5 = P(o5.x, o5.y + 46);
    s += bd(o5, 'O', c5, 'CH₂') + A(c5, 'CH₂');
    s += tg(c5.x - 26, c5.y + 4, '5′', 'fg-tag', 'end');
    const F2 = furanose(P(c5.x + 66, c5.y + 52), { dot: true, nums: false });
    s += F2.s;
    s += bond(c5, F2.pos[4], { rFrom: rOf('CH₂'), rTo: 0 });
    const b2 = P(F2.pos[1].x, F2.pos[1].y - 40);
    s += bond(F2.pos[1], b2, { rFrom: 0, rTo: 22 }) + A(b2, 'base', { r: 22 });
    s += stick(F2.pos[2], 1, 16, 'H').s + stick(F2.pos[3], 1, 18, 'OH').s;
    s += tg(F2.pos[1].x + 30, F2.pos[1].y + 24, 'incoming dNTP', 'fg-tag', 'start');
    // the arrows
    const lp = P(o3.x - 22, o3.y);
    s += curve(P(lp.x - 2, lp.y - 6), P(Pa.x + 18, Pa.y - 10), { bow: 26 });
    const mAB = mid(Pa, PA.out.ab);
    s += curve(P(mAB.x, mAB.y + 4), P(PA.out.ab.x + 4, PA.out.ab.y + 16), { bow: -18 });
    s += tg((Pb.x + Pg.x) / 2, Pa.y + 88, 'leaves as diphosphate', 'fg-tag');

    // ---- product row
    s += tg(30, 494, 'THE PRODUCTS', 'fg-tag', 'start');
    const y = 566;
    const q3 = P(160, y), qP = P(240, y), q5 = P(320, y);
    s += tg(q3.x - 24, y + 4, 'chain 3′', 'fg-tag', 'end');
    s += A(q3, 'O');
    const QP = phos(qP, [
      { key: 'l', deg: 180, l: 'O', len: 80, shared: true, cls: 'fg-bond-hi' },
      { key: 'r', deg: 0, l: 'O', len: 80, shared: true },
      { key: 'up', deg: 90, l: 'O', order: 2 },
      { key: 'dn', deg: 270, l: 'O⁻' },
    ], { kind: 'warn' });
    s += QP.s;
    s += A(q5, 'O');
    const qc = P(q5.x + 56, y);
    s += bd(q5, 'O', qc, 'CH₂') + A(qc, 'CH₂');
    s += tg(qc.x + 26, y + 4, 'new unit', 'fg-tag', 'start');
    s += tg((q3.x + qP.x) / 2, y + 30, 'new bond', 'fg-tag-good');
    // diphosphate
    const d1 = P(560, y), d2 = P(660, y);
    const D1 = phos(d1, [
      { key: 'l', deg: 180, l: 'O⁻' },
      { key: 'up', deg: 90, l: 'O', order: 2 },
      { key: 'dn', deg: 270, l: 'O⁻' },
      { key: 'r', deg: 0, l: 'O' },
    ]);
    const D2 = phos(d2, [
      { key: 'l', deg: 180, l: 'O', shared: true },
      { key: 'up', deg: 90, l: 'O', order: 2 },
      { key: 'dn', deg: 270, l: 'O⁻' },
      { key: 'r', deg: 0, l: 'O⁻', len: 46 },
    ]);
    s += D1.s + D2.s;
    s += tg(484, y + 4, '+', 'fg-tag');
    s += tg(610, y + 84, 'diphosphate', 'fg-tag');
    return s;
  },
  caption: 'One step of chain growth. The chain’s 3′ oxygen attacks Pα, the phosphorus bonded to the incoming sugar, and the Pα–O bond to Pβ breaks. A base in the enzyme takes the proton from the 3′ OH.',
});

/* ========================================= 6. RNA cut by its own 2' O ==== */
function cleavePanel(ox, oy, stage) {
  let s = '';
  const F = furanose(P(ox + 150, oy + 90), { dot: true });
  s += F.s;
  const p = F.pos;
  const up4 = P(p[4].x, p[4].y - 40);
  s += bond(p[4], up4, { rFrom: 0, rTo: rOf('CH₂') }) + A(up4, 'CH₂');
  s += tg(up4.x - 26, up4.y + 4, 'chain', 'fg-tag', 'end');
  const b1 = P(p[1].x, p[1].y - 40);
  s += bond(p[1], b1, { rFrom: 0, rTo: 20 }) + A(b1, 'base', { r: 22 });
  // O2' and O3' straight down; P below, between them
  const o2 = P(p[2].x, p[2].y + 50), o3 = P(p[3].x, p[3].y + 50);
  const Pp = P((o2.x + o3.x) / 2, o3.y + 44);
  const ring = stage === 'after';
  s += bond(p[3], o3, { rFrom: 0, rTo: 14, cls: ring ? 'fg-bond-hi' : undefined });
  s += bond(p[2], o2, { rFrom: 0, rTo: ring ? 14 : 18, cls: ring ? 'fg-bond-hi' : undefined });
  s += bd(o3, 'O', Pp, 'P', { cls: ring ? 'fg-bond-hi' : undefined });
  if (ring) s += bd(o2, 'O', Pp, 'P', { cls: 'fg-bond-hi' });
  const oDb = P(Pp.x + 40, Pp.y + 32), oMn = P(Pp.x - 52, Pp.y + 4);
  s += bd(Pp, 'P', oDb, 'O', { order: 2 }) + bd(Pp, 'P', oMn, 'O⁻');
  let o5 = P(Pp.x - 30, Pp.y + 50);
  if (!ring) s += bd(Pp, 'P', o5, 'O');
  else o5 = P(Pp.x + 100, Pp.y + 36);
  s += A(o3, 'O') + A(Pp, 'P', { kind: 'warn' }) + A(oDb, 'O') + A(oMn, 'O⁻');
  s += A(o2, ring ? 'O' : 'O⁻', { kind: ring ? undefined : 'hi', r: ring ? 14 : 18 });
  s += A(o5, ring ? 'O⁻' : 'O', { kind: ring ? 'hi' : undefined });
  const c5 = P(o5.x, o5.y + 46);
  s += bd(o5, ring ? 'O⁻' : 'O', c5, 'CH₂') + A(c5, 'CH₂');
  s += ring ? tg(c5.x - 26, c5.y + 4, 'next nucleotide', 'fg-tag', 'end') : tg(c5.x + 26, c5.y + 4, 'next nucleotide', 'fg-tag', 'start');
  if (!ring) {
    s += lonePair(o2.x, o2.y, 125, { dist: 23 });
    s += curve(P(o2.x - 16, o2.y + 24), P(Pp.x + 13, Pp.y - 9), { bow: -10 });
    const m = mid(Pp, o5);
    s += curve(P(m.x + 3, m.y + 3), P(o5.x + 16, o5.y - 4), { bow: 14 });
  } else {
    s += tg(Pp.x + 40, Pp.y - 12, 'five-membered ring', 'fg-tag-good', 'start');
  }
  return s;
}

FIGURES.push({
  id: 'rna-cleavage',
  section: 'nucleic-acids',
  anchor: 'The ring left behind is a <b>2′,3′-cyclic phosphate</b>.</p>',
  alt: 'Left: an RNA ribose with its 2 prime oxygen deprotonated (O minus) and its 3 prime oxygen bonded to a phosphorus, which is also bonded to the 5 prime oxygen of the next nucleotide. A curved arrow runs from the 2 prime O minus to the phosphorus, and a second from the phosphorus to 5 prime oxygen bond onto that oxygen. Right: the product, a five-membered ring of 2 prime O, C2 prime, C3 prime, 3 prime O and P, the 2 prime,3 prime-cyclic phosphate, and the next nucleotide released with an O minus on its 5 prime carbon.',
  viewBox: '0 0 760 380',
  build() {
    let s = '';
    s += panel(14, 14, 360, 352);
    s += panel(386, 14, 360, 352);
    s += tg(194, 36, 'THE 2′ O⁻ ATTACKS ITS OWN PHOSPHATE');
    s += tg(566, 36, 'THE CHAIN IS CUT');
    s += cleavePanel(20, 40, 'before');
    s += cleavePanel(392, 40, 'after');
    return s;
  },
  caption: 'The 2′ O⁻ attacks the phosphorus on its own 3′ oxygen, and the P–O bond to the next nucleotide’s 5′ oxygen breaks. The thick bonds on the right are the new five-membered ring.',
});
FIGURES.push({
  id: 'l-rna-cleavage',
  lessons: ['nucleic-acids'],
  alt: 'Top: an RNA ribose whose 2 prime O minus attacks the phosphorus on its own 3 prime oxygen, with a second arrow breaking the bond to the next nucleotide. Bottom: the five-membered cyclic phosphate and the released next nucleotide.',
  viewBox: '0 0 340 740',
  build() {
    let s = '';
    s += tg(170, 22, 'THE 2′ O⁻ ATTACKS');
    s += cleavePanel(0, 26, 'before');
    s += rule(20, 372, 320, 372);
    s += tg(170, 396, 'THE CHAIN IS CUT');
    s += cleavePanel(0, 400, 'after');
    return s;
  },
  caption: 'Top: the two arrows. Bottom: the five-membered ring (thick bonds) and the freed next nucleotide.',
});

/* =============================================== 7. the ladder ========= */
/* Shared by the notes and the lesson, so 340 wide. */
function ladder() {
  let s = '';
  const xl = 64, xr = 276, ys = [130, 200, 270, 340];
  const pairs = [['A', 'T'], ['G', 'C'], ['C', 'G'], ['T', 'A']];
  const pur = (b) => b === 'A' || b === 'G';
  // rails
  s += bond(P(xl, 95), P(xl, 340), { rFrom: 0, rTo: 0 });
  s += bond(P(xr, 130), P(xr, 375), { rFrom: 0, rTo: 0 });
  for (const x of [xl, xr]) {
    for (const y of ys) {
      const pts = [0, 1, 2, 3, 4].map((i) => {
        const a = rad(90 + i * 72);
        return `${r2(x + 11 * Math.cos(a))},${r2(y - 11 * Math.sin(a))}`;
      }).join(' ');
      s += `<polygon class="fg-panel" points="${pts}"></polygon>`;
    }
    // each strand's 5' end carries a phosphate; its 3' end stops at a sugar
    for (const y of (x === xl ? [95, 165, 235, 305] : [165, 235, 305, 375])) s += A(P(x, y), 'P', { kind: 'warn', r: 11 });
  }
  // rungs
  const inner = xr - xl - 30, wPu = inner * 0.58, wPy = inner - wPu;
  ys.forEach((y, i) => {
    const [l, r] = pairs[i];
    const wl = pur(l) ? wPu : wPy, wr = inner - wl;
    const x0 = xl + 15;
    s += bar(x0, y - 11, wl - 3, 22, { kind: pur(l) ? 'hi' : 'good', opacity: 0.3 });
    s += bar(x0 + wl + 3, y - 11, wr - 3, 22, { kind: pur(r) ? 'hi' : 'good', opacity: 0.3 });
    s += lbl(x0 + wl / 2, y + 5, l);
    s += lbl(x0 + wl + wr / 2, y + 5, r);
  });
  // directions
  s += arrow(P(24, 96), P(24, 372), { size: 8 });
  s += arrow(P(316, 372), P(316, 96), { size: 8 });
  s += tg(24, 84, '5′'); s += tg(24, 392, '3′');
  s += tg(316, 84, '3′'); s += tg(316, 392, '5′');
  s += tg(170, 40, 'BACKBONES OUTSIDE, BASES INSIDE');
  s += tg(xl, 66, 'backbone'); s += tg(xr, 66, 'backbone');
  s += bar(56, 420, 22, 14, { kind: 'hi', opacity: 0.3 });
  s += tg(86, 432, 'purine (A or G)', 'fg-tag', 'start');
  s += bar(56, 444, 22, 14, { kind: 'good', opacity: 0.3 });
  s += tg(86, 456, 'pyrimidine (C or T)', 'fg-tag', 'start');
  s += tg(170, 486, 'Every rung is one of each,');
  s += tg(170, 502, 'so every rung is the same width.');
  return s;
}
FIGURES.push({
  id: 'dna-ladder',
  section: 'nucleic-acids',
  lessons: ['nucleic-acids'],
  anchor: 'lined up.</p>',
  alt: 'The double helix untwisted into a ladder. Two vertical rails of alternating sugars and phosphates are the backbones. Four rungs between them read A-T, G-C, C-G and T-A; each rung is a wide purine block and a narrow pyrimidine block, so all four rungs are the same width. An arrow beside the left rail points down from 5 prime to 3 prime; an arrow beside the right rail points up from 5 prime to 3 prime.',
  viewBox: '0 0 340 520',
  build: ladder,
  caption: 'The double helix untwisted into a ladder. The left strand runs 5′→3′ down the page and the right strand runs 5′→3′ up it. Pentagons are sugars and P marks each phosphate; each strand ends at its 3′ end with a sugar, whose 3′ OH is free.',
});

/* =============================================== 8. the base pairs ====== */
/* One Watson-Crick pair, pyrimidine on the left with N3 facing right and
   the purine on the right with N1 facing left. Every hydrogen bond is a
   dashed line from the H to the atom that accepts it, labelled with the
   atoms in the order they are drawn. */
function pairAt(x0, y0, g) {
  let s = '';
  const b = 30;
  const cL = P(x0 + 66, y0), cR = P(x0 + 66 + 5.8 * b, y0);
  const L = drawBase(g ? 'C' : 'T', { c: cL, b, rot: -30, sugar: 'sugar' });
  const R = drawBase(g ? 'G' : 'A', { c: cR, b, rot: 30, sugar: 'sugar' });
  s += L.s + R.s;
  const pl = L.p, pr = R.p;
  const bonds = g
    ? [[pl.H4b, pr.X6, 'N–H···O'], [pl.N3, pr.H1, 'N···H–N'], [pl.X2, pr.H2a, 'O···H–N']]
    : [[pl.X4, pr.H6a, 'O···H–N'], [pl.H3, pr.N1, 'N–H···N']];
  // pick the H of an NH2 that faces the partner
  if (g) {
    const nearer = (h1, h2, t) => (Math.hypot(h1.x - t.x, h1.y - t.y) < Math.hypot(h2.x - t.x, h2.y - t.y) ? h1 : h2);
    bonds[0][0] = nearer(pl.H4a, pl.H4b, pr.X6);
    bonds[2][1] = nearer(pr.H2a, pr.H2b, pl.X2);
  } else {
    const nearer = (h1, h2, t) => (Math.hypot(h1.x - t.x, h1.y - t.y) < Math.hypot(h2.x - t.x, h2.y - t.y) ? h1 : h2);
    bonds[0][1] = nearer(pr.H6a, pr.H6b, pl.X4);
  }
  for (const [a, z, txt] of bonds) {
    const ra = [pl.H3, pl.H4a, pl.H4b].includes(a) ? 11 : 14;
    const rz = [pr.H1, pr.H2a, pr.H2b, pr.H6a, pr.H6b].includes(z) ? 11 : 14;
    s += hb(a, ra + 2, z, rz + 2);
    const m = mid(a, z);
    s += tg(m.x, m.y - 9, txt, 'fg-tag-good');
  }
  return { s, sugL: pl.S, sugR: pr.S };
}

FIGURES.push({
  id: 'base-pairs-drawn',
  section: 'nucleic-acids',
  anchor: 'A and T line up two such donor–acceptor pairs, and G and C line up three.</p>',
  alt: 'Left: thymine paired with adenine by two hydrogen bonds, O4 of thymine to an N-H of adenine’s amino group, and N3-H of thymine to N1 of adenine. Right: cytosine paired with guanine by three hydrogen bonds, an N-H of cytosine’s amino group to O6 of guanine, N3 of cytosine to N1-H of guanine, and O2 of cytosine to an N-H of guanine’s amino group. In both pairs the bonds to the sugars point down and are the same distance apart.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += panel(8, 14, 366, 300);
    s += panel(386, 14, 366, 300);
    s += tg(191, 38, 'THYMINE · ADENINE: TWO HYDROGEN BONDS');
    s += tg(569, 38, 'CYTOSINE · GUANINE: THREE HYDROGEN BONDS');
    const a = pairAt(14, 150, false);
    const g = pairAt(392, 150, true);
    s += a.s + g.s;
    for (const q of [a, g]) {
      const y = 262;
      s += rule(q.sugL.x, y, q.sugR.x, y);
      s += rule(q.sugL.x, y - 6, q.sugL.x, y + 6);
      s += rule(q.sugR.x, y - 6, q.sugR.x, y + 6);
      s += tg((q.sugL.x + q.sugR.x) / 2, y + 18, 'same distance');
    }
    return s;
  },
  caption: 'Every hydrogen bond is a dashed line from an H to the N or O that accepts it. In both pairs the bonds to the sugars point down, toward the backbones, and end the same distance apart.',
  note: 'Try pairing A with C on paper: A’s N–H faces C’s N–H, and A’s ring N faces C’s ring N, so donor meets donor and acceptor meets acceptor.',
});
FIGURES.push({
  id: 'l-base-pairs',
  lessons: ['nucleic-acids'],
  alt: 'Top: thymine paired with adenine by two hydrogen bonds. Bottom: cytosine paired with guanine by three hydrogen bonds. Each dashed hydrogen bond runs from an H to an N or O.',
  viewBox: '0 0 340 600',
  build() {
    let s = '';
    s += tg(170, 22, 'T · A: TWO HYDROGEN BONDS');
    s += tg(170, 316, 'C · G: THREE HYDROGEN BONDS');
    s += pairAt(-6, 140, false).s;
    s += rule(20, 290, 320, 290);
    s += pairAt(-6, 434, true).s;
    return s;
  },
  caption: 'Each dashed line runs from an H on one base to an N or O on the other.',
});

/* ============================================ 9. thymine's two forms ===== */
FIGURES.push({
  id: 'thymine-tautomers',
  section: 'nucleic-acids',
  anchor: 'a change of one base pair.</p>',
  alt: 'Two forms of thymine, each with its pairing edge facing right. Left, the usual lactam: C4=O, N3-H, C2=O, so the edge reads acceptor, donor, acceptor, which matches adenine. Right, the rare lactim: the H has moved from N3 to the oxygen on C4, giving C4-OH and C4=N3, so the edge reads donor, acceptor, acceptor, which matches guanine. Equilibrium arrows between them are marked mostly lactam.',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    s += panel(14, 14, 300, 300);
    s += panel(446, 14, 300, 300);
    s += tg(164, 38, 'LACTAM (USUAL)');
    s += tg(596, 38, 'LACTIM (RARE)');
    const L = drawBase('T', { c: P(120, 164), b: 32, rot: -30, sugar: 'sugar', kinds: { H3: 'warn' } });
    const R = drawBase('T', { c: P(552, 164), b: 32, rot: -30, sugar: 'sugar', form: 'lactim', kinds: { H4: 'warn' } });
    s += L.s + R.s;
    for (const B of [L, R]) s += B.loc('N3', '3', 'six', 0.6) + B.loc('C4', '4', 'six', 0.42);
    // edge tags
    const tagAt = (p, t, cls) => tg(p.x + 22, p.y + 4, t, cls, 'start');
    s += tagAt(L.p.X4, 'acceptor', 'fg-tag');
    s += tagAt(L.p.H3, 'donor', 'fg-tag-warn');
    s += tagAt(L.p.X2, 'acceptor', 'fg-tag');
    s += tagAt(R.p.H4, 'donor', 'fg-tag-warn');
    s += tagAt(R.p.N3, 'acceptor', 'fg-tag');
    s += tagAt(R.p.X2, 'acceptor', 'fg-tag');
    s += lbl(164, 300, 'pairs with A');
    s += lbl(596, 300, 'pairs with G');
    s += eq(P(338, 164), P(422, 164));
    s += tg(380, 146, 'H moves');
    s += tg(380, 190, 'mostly');
    s += tg(380, 204, 'lactam');
    return s;
  },
  caption: 'Thymine’s pairing edge in its two forms. The coral H moves from N3 to O4.',
});

export default FIGURES;
