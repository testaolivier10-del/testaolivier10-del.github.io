/* Figures for the nucleophilic-aromatic notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every ring uses one numbering: vertex 0 is the top and the vertices run
   clockwise, so for a group on vertex 0, vertices 1 and 5 are ortho, 2 and 4
   meta, and 3 para. The drawing helpers for each structure take a centre and
   a ring radius, so the wide notes figures and the stacked 340-wide lesson
   copies are drawn from the same code. */
import { atom, bond, arrow, curve, lonePair, text, tag, rule, panel, P } from '../lib/ochem-figure.mjs';
import { ringDouble } from '../lib/ochem-skeletal.mjs';

/* ---------------------------------------------------------------- kit --- */

const rad = (d) => (d * Math.PI) / 180;
const at = (p, deg, d) => P(p.x + Math.cos(rad(deg)) * d, p.y + Math.sin(rad(deg)) * d);
const mid = (a, b, f = 0.5) => P(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f);
const vAng = (i) => -90 + 60 * i;           // the outward direction at vertex i

/* A hexagon kit. Vertex 0 is the top and the numbering runs clockwise. */
function hexKit(R) {
  const V = (c) => Array.from({ length: 6 }, (_, i) => at(c, vAng(i), R));
  const ring = (c, doubles, o = {}) => {
    const v = V(c);
    let g = '';
    for (let i = 0; i < 6; i++) {
      const j = (i + 1) % 6;
      if (doubles.includes(i)) g += ringDouble(v[i], v[j], c, { inset: o.inset ?? 7, gap: o.gap ?? 4.4 });
      else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
    }
    return g;
  };
  /* The third line of a benzyne triple bond: drawn outside the ring, since
     the extra bond lies in the ring plane, outside the aromatic π system. */
  const outer = (c, i, cls = 'fg-bond') => {
    const v = V(c), a = v[i], b = v[(i + 1) % 6];
    const m = mid(a, b), dx = m.x - c.x, dy = m.y - c.y, L = Math.hypot(dx, dy);
    const nx = (dx / L) * 4.4, ny = (dy / L) * 4.4;
    const A = mid(a, b, 0.2), B = mid(a, b, 0.8);
    return bond(P(A.x + nx, A.y + ny), P(B.x + nx, B.y + ny), { rFrom: 0, rTo: 0, cls });
  };
  return { V, ring, outer };
}

/* A label disc sized for 13px text (the fg-lbl size). */
const rOf = (t) => { const n = [...t].length; return n <= 1 ? 12 : n === 2 ? 14 : n === 3 ? 17 : n === 4 ? 20 : 25; };
const lab = (p, t, o = {}) => atom(p.x, p.y, t, { kind: o.kind || 'plain', r: o.r ?? rOf(t), size: 13 });
/* A group hanging off point `from` in direction `deg`, `d` away. */
const grp = (from, deg, d, t, o = {}) => {
  const p = at(from, deg, d);
  const r = o.r ?? rOf(t);
  return bond(from, p, { rFrom: o.rFrom ?? 0, rTo: r, cls: o.bondCls }) + lab(p, t, { kind: o.kind, r });
};
const chg = (p, s = '−') => text(p.x, p.y + 5, s, { cls: 'fg-warn', size: 17 });
/* A carbanion lone pair at vertex point v, pointing in direction deg, with its charge beside it. */
const anion = (v, deg, cdeg = deg - 32) => lonePair(v.x, v.y, deg, { dist: 10 }) + chg(at(v, cdeg, 21));
const nitroL = 'NO₂';
const star = (p) => `<circle class="fg-fill-warn" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="5"></circle>`;
const dot = (p) => `<circle class="fg-fill-warn" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="6" opacity="0.85"></circle>`;
const down = (x, y1, y2) => arrow(P(x, y1), P(x, y2));
/* A resonance arrow: one line, a head at each end. */
const reso = (x, y, w = 40) => arrow(P(x - w / 2, y), P(x + w / 2, y)) + arrow(P(x + w / 2 - 1, y), P(x - w / 2, y));
/* Ring numbers, set inside the ring next to each vertex. `from` is the vertex
   that carries C1; numbering runs clockwise unless `ccw`. */
const nums = (c, R, o = {}) => {
  let g = '';
  const from = o.from ?? 0, only = o.only;
  for (let n = 1; n <= 6; n++) {
    if (only && !only.includes(n)) continue;
    const i = ((o.ccw ? from - (n - 1) : from + (n - 1)) % 6 + 6) % 6;
    const p = at(c, vAng(i), R * 0.52);
    g += text(p.x, p.y + 4, String(n), { cls: 'fg-tag-mut', size: 11 });
  }
  return g;
};
const right = (x1, x2, y) => arrow(P(x1, y), P(x2, y));

/* ------------------------------------------------- SNAr structures --- */
/* 1-chloro-2,4-dinitrobenzene: Cl on vertex 0, NO2 on 1 (C2) and 3 (C4). */

function snarSubstrate(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  const d = R * 0.95 + 14;
  let s = K.ring(c, [0, 2, 4]);
  s += grp(v[0], -90, d, o.lg || 'Cl');
  if (!o.noNitro1) s += grp(v[1], -30, d, nitroL, { kind: 'warn' });
  s += grp(v[3], 90, d, nitroL, { kind: 'warn' });
  if (o.nu !== false) {
    const nu = P(c.x - R * 2.55, c.y - R * 1.5);
    s += lab(nu, 'CH₃O', { kind: 'hi' });
    s += chg(P(nu.x + 12, nu.y - 30));
    s += lonePair(nu.x, nu.y, 0, { dist: 25 });
    s += lonePair(nu.x, nu.y, 60, { dist: 25 });
    /* the nucleophile's lone pair to C1 */
    s += curve(P(nu.x + 28, nu.y - 4), at(v[0], 190, 5), { bow: -22, size: 7 });
    /* the C1=C2 pi bond moves onto C2 */
    s += curve(mid(v[0], v[1], 0.45), at(v[1], 40, 9), { bow: -12, size: 7 });
  }
  return s;
}

/* The Meisenheimer complex from methoxide. `at1` is the ring vertex that
   carries the charge (1 = C2, 3 = C4, 5 = C6). `arrows` adds the curved
   arrows that lead onward: 'elim' (C2 form, back to aromatic), 'next'
   (push the charge one position further round). */
function snarComplex(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  const d = R * 0.95 + 14;
  const k = o.at ?? 1;
  const dbl = { 1: [2, 4], 3: [1, 4], 5: [1, 3] }[k];
  let s = K.ring(c, dbl);
  s += grp(v[0], -122, d + 4, o.nu || 'OCH₃', { kind: 'hi' });
  s += grp(v[0], -62, d, o.lg || 'Cl');
  const nitros = o.nitros || [1, 3];
  if (nitros.includes(1)) s += grp(v[1], -30, d, nitroL, { kind: 'warn' });
  if (nitros.includes(2)) s += grp(v[2], 30, d, nitroL, { kind: 'warn' });
  if (nitros.includes(3)) s += grp(v[3], 90, d, nitroL, { kind: 'warn' });
  /* where the lone pair sits at each charged vertex, clear of its bonds */
  const lpDeg = { 1: 32, 3: 150, 5: -150 }[k];
  const cDeg = { 1: 0, 3: 30, 5: -118 }[k];
  s += anion(v[k], lpDeg, cDeg);
  const lpAt = at(v[k], lpDeg, 11);
  if (o.nums) s += nums(c, R);
  if (o.arrows === 'elim') {
    s += curve(lpAt, mid(v[0], v[1], 0.55), { bow: 16, size: 7 });
    const cl = at(v[0], -62, d);
    s += curve(mid(v[0], cl, 0.45), at(cl, 10, rOf(o.lg || 'Cl') + 1), { bow: 12, size: 7 });
  }
  if (o.arrows === 'next') {
    /* lone pair into the next ring bond, and the pi bond beyond it onto the next-but-one carbon */
    const n1 = (k + 1) % 6, n2 = (k + 2) % 6;
    s += curve(lpAt, mid(v[k], v[n1], 0.5), { bow: k === 1 ? -14 : -14, size: 7 });
    s += curve(mid(v[n1], v[n2], 0.45), at(v[n2], vAng(n2) + (k === 1 ? -60 : 60), 9), { bow: -12, size: 7 });
  }
  return s;
}

function snarProduct(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  const d = R * 0.95 + 14;
  let s = K.ring(c, [0, 2, 4]);
  s += grp(v[0], -90, d + 4, o.nu || 'OCH₃', { kind: 'hi' });
  s += grp(v[1], -30, d, nitroL, { kind: 'warn' });
  s += grp(v[3], 90, d, nitroL, { kind: 'warn' });
  return s;
}

/* ---------------------------------------------- benzyne structures --- */

/* Chlorobenzene with the ortho H drawn, and amide about to take it. */
function bzSubstrate(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  const d = R * 0.95 + 12;
  let s = K.ring(c, [0, 2, 4]);
  s += grp(v[0], -90, d, 'Cl');
  const h = at(v[1], -30, d - 4);
  s += bond(v[1], h, { rFrom: 0, rTo: 12 }) + lab(h, 'H', { r: 12 });
  if (o.base !== false) {
    const b = P(h.x + 66, h.y - 22);
    s += lab(b, 'NH₂', { kind: 'hi' });
    s += chg(P(b.x + 4, b.y - 28));
    s += lonePair(b.x, b.y, 200, { dist: 24 });
    s += lonePair(b.x, b.y, 130, { dist: 24 });
    s += curve(P(b.x - 27, b.y - 6), P(h.x + 7, h.y - 12), { bow: 12, size: 7 });
    s += curve(mid(v[1], h, 0.5), at(v[1], 30, 9), { bow: -12, size: 7 });
  }
  return s;
}

/* The aryl anion left when the ortho H is gone. With `arrows`, its lone pair
   pushes chloride out and makes the extra bond. */
function bzAnion(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  const d = R * 0.95 + 12;
  let s = K.ring(c, [0, 2, 4]);
  s += grp(v[0], -90, d, 'Cl');
  s += anion(v[1], -30, 20);
  if (o.arrows) {
    const lp = at(v[1], -30, 11);
    s += curve(lp, at(mid(v[0], v[1]), -60, 6), { bow: 12, size: 7 });
    const cl = at(v[0], -90, d);
    s += curve(mid(v[0], cl, 0.4), at(cl, 20, 15), { bow: -12, size: 7 });
  }
  return s;
}

function benzyne(c, R, o = {}) {
  const K = hexKit(R);
  let s = K.ring(c, [0, 2, 4]) + K.outer(c, 0, o.hi ? 'fg-bond-hi' : 'fg-bond');
  return s;
}


/* A substituted benzene. `subs` maps a vertex to a label, or to
   { t, kind }. `triple` draws the benzyne bond on ring bond i -> i+1. */
function arene(c, R, subs = {}, o = {}) {
  const K = hexKit(R), v = K.V(c);
  const d = o.d ?? R * 0.95 + 12;
  let s = K.ring(c, o.doubles || [0, 2, 4]);
  if (o.triple !== undefined) s += K.outer(c, o.triple, o.tripleCls || 'fg-bond-hi');
  for (const [i, x] of Object.entries(subs)) {
    const g = typeof x === 'string' ? { t: x } : x;
    const kind = g.kind || (g.t === 'NO₂' ? 'warn' : g.t === 'NH₂' || g.t === 'OCH₃' || g.t === 'Nu' ? 'hi' : 'plain');
    s += grp(v[+i], vAng(+i), g.d ?? (g.t === 'H' ? d - 6 : d), g.t, { kind, r: g.t === 'H' ? 11 : undefined });
  }
  if (o.nums) s += nums(c, R, o.nums === true ? {} : o.nums);
  if (o.stars) for (const i of o.stars) s += dot(v[i]);
  return s;
}

/* ------------------------------------------------------------ figures --- */

const FIGURES = [];

/* Why neither SN2 nor SN1: both are spatial arguments. */
function noSn(s, c1, c2, R) {
  const K = hexKit(R);
  /* SN2: the backside of C1 is inside the ring. */
  {
    const v = K.V(c1);
    s.push(K.ring(c1, [0, 2, 4]));
    s.push(grp(v[0], -90, R * 0.95 + 12, 'Cl'));
    const nu = P(c1.x, c1.y + R + 48);
    s.push(`<line class="fg-dash-hi" x1="${nu.x}" y1="${nu.y - 18}" x2="${v[0].x}" y2="${v[0].y + 8}"></line>`);
    s.push(lab(nu, 'Nu', { kind: 'hi' }) + chg(P(nu.x + 19, nu.y - 16)));
    s.push(text(c1.x, c1.y + 8, '✕', { cls: 'fg-warn', size: 22 }));
  }
  /* SN1: the aryl cation's empty orbital is sp2 and lies in the ring plane. */
  {
    const v = K.V(c2);
    s.push(K.ring(c2, [1, 3, 5]));
    const lobe = at(v[0], -90, 22);
    s.push(`<ellipse class="fg-orb-node" cx="${lobe.x}" cy="${lobe.y}" rx="9" ry="20"></ellipse>`);
    s.push(chg(P(v[0].x + 16, v[0].y - 4), '+'));
    for (let i = 0; i < 6; i++) {
      const p = v[i];
      s.push(`<circle class="fg-orb" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="6.5"></circle>`);
    }
  }
}

FIGURES.push({
  id: 'aryl-no-sn',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:aryl-no-sn -->',
  viewBox: '0 0 760 260',
  alt: 'Left: chlorobenzene with a nucleophile below the ring. A dashed line from the nucleophile to the carbon bearing chlorine passes through the middle of the ring, marked with a cross. Right: the phenyl cation, a benzene ring with a plus charge on the top carbon, an empty orbital drawn as an outline pointing out from that carbon in the plane of the ring, and a small circle on every ring carbon for the p orbitals, which stand up out of the page.',
  build() {
    const s = [];
    s.push(tag(190, 26, 'NO Sₙ2: THE BACKSIDE IS INSIDE THE RING'));
    s.push(tag(570, 26, 'NO Sₙ1: THE EMPTY ORBITAL IS IN THE PLANE'));
    noSn(s, P(190, 128), P(570, 138), 38);
    s.push(tag(250, 128, 'the Nu⁻ would have to', { anchor: 'start' }));
    s.push(tag(250, 144, 'pass through the ring', { anchor: 'start' }));
    s.push(tag(610, 80, 'empty sp² orbital,', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(610, 96, 'in the ring plane', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(570, 216, 'circles: p orbitals, seen end-on, standing', {}));
    s.push(tag(570, 232, 'out of the page at 90° to the empty orbital', {}));
    s.push(rule(380, 44, 380, 244));
    return s.join('');
  },
  caption: 'Left: the dashed line is the backside approach to C1. Right: the dashed outline is the empty orbital, and the circles are the p orbitals.',
});

FIGURES.push({
  id: 'l-aryl-no-sn',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 420',
  alt: 'Top: chlorobenzene with a nucleophile below the ring; a dashed line from it to the carbon bearing chlorine crosses the middle of the ring, marked with a cross. Bottom: the phenyl cation, with a plus charge on the top carbon, an empty orbital drawn as an outline in the plane of the ring, and a small circle on each ring carbon for the p orbitals standing out of the page.',
  build() {
    const s = [];
    s.push(tag(170, 18, 'NO Sₙ2: THE BACKSIDE IS INSIDE THE RING'));
    noSn(s, P(110, 124), P(110, 366), 34);
    s.push(tag(186, 142, 'path to C1 runs', { anchor: 'start' }));
    s.push(tag(186, 158, 'through the ring', { anchor: 'start' }));
    s.push(rule(20, 238, 320, 238));
    s.push(tag(170, 262, 'NO Sₙ1: THE EMPTY ORBITAL IS IN THE PLANE'));
    s.push(tag(150, 300, 'empty sp² orbital', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(186, 360, 'circles: p orbitals,', { anchor: 'start' }));
    s.push(tag(186, 376, 'out of the page,', { anchor: 'start' }));
    s.push(tag(186, 392, 'at 90° to it', { anchor: 'start' }));
    return s.join('');
  },
  caption: 'Top: the dashed line is the backside approach to C1. Bottom: the dashed outline is the empty orbital, and the circles are the p orbitals.',
});

/* The SNAr mechanism: one row in the notes. */
FIGURES.push({
  id: 'meisenheimer',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:meisenheimer -->',
  viewBox: '0 0 760 310',
  alt: 'Three structures in a row. First, 1-chloro-2,4-dinitrobenzene with methoxide; a curved arrow runs from an oxygen lone pair of methoxide to C1, the carbon bearing chlorine, and a second arrow moves the C1–C2 double bond onto C2. An arrow labeled addition, slow, leads to the Meisenheimer complex: C1 now carries both OCH3 and Cl, the ring has two double bonds, and C2 carries a lone pair and a minus charge. Curved arrows on it move that lone pair back into the C1–C2 bond and push the C1–Cl bond onto chlorine. An arrow labeled elimination leads to 1-methoxy-2,4-dinitrobenzene plus chloride.',
  build() {
    const R = 40, y = 156;
    let s = '';
    s += snarSubstrate(P(175, y), R);
    s += right(280, 340, y);
    s += tag(310, y - 12, 'addition');
    s += tag(310, y + 20, '(slow)', { cls: 'fg-tag-mut' });
    s += snarComplex(P(430, y), R, { at: 1, arrows: 'elim', nums: true });
    s += right(530, 590, y);
    s += tag(560, y - 12, 'elimination');
    s += snarProduct(P(660, y), R);
    s += text(706, y + 66, '+ Cl⁻', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(150, 290, '1-chloro-2,4-dinitrobenzene');
    s += tag(430, 290, 'Meisenheimer complex');
    s += tag(640, 290, '1-methoxy-2,4-dinitrobenzene');
    return s;
  },
  caption: 'Follow the arrows: the first pair makes the C1&ndash;O bond, and the second pair breaks the C1&ndash;Cl bond.',
});

FIGURES.push({
  id: 'l-meisenheimer',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 600',
  alt: 'Stacked top to bottom. 1-chloro-2,4-dinitrobenzene with methoxide; curved arrows from the methoxide oxygen to C1, and from the C1–C2 double bond onto C2. Arrow down, labeled addition, slow. The Meisenheimer complex: C1 carries OCH3 and Cl, and C2 has a lone pair and a minus charge; curved arrows return that lone pair to the C1–C2 bond and push chloride off. Arrow down, labeled elimination. 1-methoxy-2,4-dinitrobenzene plus chloride.',
  build() {
    const R = 26;
    let s = '';
    s += snarSubstrate(P(200, 92), R);
    s += down(200, 178, 214);
    s += tag(214, 200, 'addition (slow)', { anchor: 'start' });
    s += snarComplex(P(200, 300), R, { at: 1, arrows: 'elim' });
    s += tag(24, 300, 'Meisenheimer', { anchor: 'start' });
    s += tag(24, 316, 'complex', { anchor: 'start' });
    s += down(200, 386, 422);
    s += tag(214, 408, 'elimination', { anchor: 'start' });
    s += snarProduct(P(200, 512), R);
    s += text(252, 574, '+ Cl⁻', { cls: 'fg-lbl', anchor: 'start' });
    return s;
  },
  caption: 'The arrows on each structure lead to the next one.',
});

/* Where the charge goes: three resonance forms of the complex. */
FIGURES.push({
  id: 'meisenheimer-charge',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:meisenheimer-charge -->',
  viewBox: '0 0 760 300',
  alt: 'Three resonance forms of the Meisenheimer complex from 1-chloro-2,4-dinitrobenzene and methoxide, joined by double-headed arrows. In the first the lone pair and minus charge are on C2, with curved arrows moving them to C4. In the second they are on C4, with curved arrows moving them to C6. In the third they are on C6. C3 and C5, the meta carbons, never carry the charge. C2 and C4 both carry nitro groups.',
  build() {
    const R = 40, y = 150;
    let s = '';
    s += snarComplex(P(130, y), R, { at: 1, arrows: 'next', nums: true });
    s += reso(255, y);
    s += snarComplex(P(380, y), R, { at: 3, arrows: 'next', nums: true });
    s += reso(505, y);
    s += snarComplex(P(630, y), R, { at: 5, nums: true });
    s += tag(130, 284, 'charge on C2 (ortho)', { cls: 'fg-tag-warn' });
    s += tag(380, 284, 'charge on C4 (para)', { cls: 'fg-tag-warn' });
    s += tag(630, 284, 'charge on C6 (ortho)', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Each set of arrows moves the lone pair two carbons further round the ring. The ring numbers match the name 1-chloro-2,4-dinitrobenzene.',
});

/* Para versus meta: the nitro group has to sit on a charged carbon. */
FIGURES.push({
  id: 'snar-positions',
  section: 'nucleophilic-aromatic',
  lessons: ['nucleophilic-aromatic'],
  anchor: '<!-- anchor:snar-positions -->',
  viewBox: '0 0 340 540',
  alt: 'Top panel, para nitro: the Meisenheimer complex from 1-chloro-4-nitrobenzene and methoxide, drawn with the charge on C4, the carbon carrying the nitro group. Curved arrows move the lone pair into a C=N double bond and push an N=O pi bond onto oxygen. A double-headed arrow leads to the form with C4=N and a minus charge on each nitro oxygen. Bottom panel, meta nitro: the complex from 1-chloro-3-nitrobenzene with its carbons numbered, and coral dots on C2, C4 and C6, the carbons that can carry the charge. The nitro group sits on C3, which has no dot.',
  build() {
    const R = 28, K = hexKit(R), d = R * 0.95 + 14;
    let s = '';
    s += tag(170, 18, 'NO₂ PARA TO Cl: THE CHARGE REACHES O', { cls: 'fg-tag-good' });
    const form = (c, f) => {
      const v = K.V(c);
      let g = K.ring(c, [1, 4]);
      g += grp(v[0], -128, d + 4, 'OCH₃', { kind: 'hi' });
      g += grp(v[0], -52, d, 'Cl');
      const N = at(v[3], 90, 34), Ol = at(N, 145, 38), Or = at(N, 35, 38);
      g += bond(v[3], N, { rFrom: 0, rTo: 12, order: f === 'D' ? 2 : 1, gap: 2.6 });
      g += bond(N, Ol, { rFrom: 12, rTo: 12 });
      g += bond(N, Or, { rFrom: 12, rTo: 12, order: f === 'D' ? 1 : 2, gap: 2.6 });
      g += lab(N, 'N', { r: 12, kind: 'warn' }) + text(N.x + 15, N.y - 8, '+', { cls: 'fg-warn', size: 14 });
      g += lab(Ol, 'O', { r: 12 }) + chg(P(Ol.x - 18, Ol.y - 12));
      g += lab(Or, 'O', { r: 12 });
      if (f === 'D') g += chg(P(Or.x + 18, Or.y - 12));
      g += nums(c, R, { only: [1, 4] });
      if (f === 'B') {
        g += anion(v[3], 150, 30);
        g += curve(at(v[3], 150, 11), mid(v[3], N, 0.55), { bow: 9, size: 6 });
        g += curve(mid(N, Or, 0.5), at(Or, -80, 14), { bow: -10, size: 6 });
      }
      return g;
    };
    s += form(P(84, 118), 'B');
    s += reso(172, 150, 34);
    s += form(P(262, 118), 'D');
    s += tag(170, 262, 'C4 carries both the charge and the NO₂');
    s += rule(20, 280, 320, 280);
    s += tag(170, 302, 'NO₂ META TO Cl: THE CHARGE NEVER REACHES IT', { cls: 'fg-tag-warn' });
    {
      const R2 = 34, K2 = hexKit(R2), d2 = R2 * 0.95 + 14;
      const c = P(150, 410), v = K2.V(c);
      s += K2.ring(c, [2, 4]);
      s += grp(v[0], -128, d2 + 2, 'OCH₃', { kind: 'hi' });
      s += grp(v[0], -52, d2 - 2, 'Cl');
      s += grp(v[2], 30, d2 - 4, nitroL, { kind: 'warn' });
      s += dot(v[1]) + dot(v[3]) + dot(v[5]);
      s += anion(v[1], -20, 25);
      s += nums(c, R2);
    }
    s += dot(P(34, 512));
    s += tag(48, 516, 'C2, C4, C6: the only carbons the', { anchor: 'start' });
    s += tag(48, 532, 'charge visits. NO₂ is on C3.', { anchor: 'start' });
    return s;
  },
  caption: 'Top: follow the arrows from C4 onto a nitro oxygen. Bottom: the dots mark every carbon the charge can visit.',
});


/* The worked example: methylamine on 1-fluoro-2,4-dinitrobenzene. */
FIGURES.push({
  id: 'snar-amine',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:snar-amine -->',
  viewBox: '0 0 760 300',
  alt: 'Left: the Meisenheimer complex from 1-fluoro-2,4-dinitrobenzene and methylamine. C1 carries F and an NH2CH3 group whose nitrogen has a plus charge; C2 carries a lone pair and a minus charge. Curved arrows return the lone pair to the ring and push fluoride off. An arrow labeled minus F-, then minus H+ leads to N-methyl-2,4-dinitroaniline, with NHCH3 on C1 and nitro groups on C2 and C4.',
  build() {
    const R = 40, y = 158;
    let s = '';
    s += snarComplex(P(190, y), R, { at: 1, arrows: 'elim', nu: 'NH₂CH₃', lg: 'F', nums: true });
    {
      const v = hexKit(R).V(P(190, y)), n = at(v[0], -122, R * 0.95 + 18);
      s += text(n.x - 30, n.y - 16, '+', { cls: 'fg-warn', size: 16 });
    }
    s += right(318, 440, y);
    s += tag(379, y - 14, '− F⁻, then');
    s += tag(379, y + 26, 'CH₃NH₂ takes H⁺', { cls: 'fg-tag-mut' });
    s += snarProduct(P(560, y), R, { nu: 'NHCH₃' });
    s += tag(190, 290, 'Meisenheimer complex, + on N and − on the ring');
    s += '<text class="fg-tag" x="560" y="290" text-anchor="middle" font-size="11"><tspan font-style="italic">N</tspan>-methyl-2,4-dinitroaniline</text>';
    return s;
  },
  caption: 'Steps 3 to 6 of the worked example, drawn.',
});

/* ------------------------------------------------ benzyne figures --- */

/* Benzyne with amide about to add to C1 (vertex 0). */
function bzAttack(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  let s = benzyne(c, R, { hi: true });
  const nu = P(v[0].x - 66, v[0].y - 26);
  s += lab(nu, 'H₂N', { kind: 'hi' }) + chg(P(nu.x + 8, nu.y - 29));
  s += lonePair(nu.x, nu.y, 0, { dist: 24 }) + lonePair(nu.x, nu.y, 70, { dist: 24 });
  s += curve(P(nu.x + 27, nu.y), at(v[0], 200, 6), { bow: -12, size: 7 });
  /* the in-plane bond's electrons go onto C2 */
  const om = at(mid(v[0], v[1]), -60, 5);
  s += curve(om, at(v[1], -10, 10), { bow: -12, size: 7 });
  if (o.star) s += dot(v[0]);
  return s;
}

/* The aryl anion after amide has added, with ammonia beside it. */
function bzAddAnion(c, R, o = {}) {
  const K = hexKit(R), v = K.V(c);
  let s = arene(c, R, { 0: 'NH₂' });
  s += anion(v[1], -30, 10);
  if (o.nh3 !== false) {
    const H = at(v[1], -30, 50), N = P(H.x + 50, H.y);
    s += lab(H, 'H', { r: 11 }) + bond(H, N, { rFrom: 11, rTo: 17 }) + lab(N, 'NH₂');
    s += curve(at(v[1], -30, 12), P(H.x - 10, H.y + 7), { bow: 10, size: 7 });
    s += curve(mid(H, N), at(N, 125, 18), { bow: 10, size: 7 });
  }
  return s;
}

FIGURES.push({
  id: 'benzyne-mechanism',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:benzyne-mechanism -->',
  viewBox: '0 0 760 470',
  alt: 'Two rows. Top row, elimination: chlorobenzene with the hydrogen on C2 drawn; a curved arrow runs from an amide lone pair to that hydrogen, and another moves the C–H bond onto C2. The resulting aryl anion has a lone pair and minus charge on C2, pointing out from the ring; curved arrows move that lone pair toward the C1–C2 bond and push the C1–Cl bond onto chlorine. The product is benzyne, whose C1–C2 bond is drawn with three lines, plus chloride. Bottom row, addition: amide adds to C1 of benzyne and the extra bond moves onto C2; the aryl anion then takes a proton from ammonia, giving aniline and amide.',
  build() {
    const R = 34;
    let s = '';
    s += tag(24, 26, 'ELIMINATION: TAKE THE H, LOSE Cl⁻', { anchor: 'start' });
    s += bzSubstrate(P(100, 138), R);
    s += right(262, 310, 138);
    s += bzAnion(P(380, 138), R, { arrows: true });
    s += right(452, 500, 138);
    s += benzyne(P(570, 138), R, { hi: true });
    s += text(630, 186, '+ Cl⁻', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(100, 214, 'chlorobenzene + amide');
    s += tag(380, 214, 'aryl anion');
    s += tag(570, 214, 'benzyne');
    s += rule(24, 236, 736, 236);
    s += tag(24, 262, 'ADDITION: ADD NH₂⁻, THEN TAKE H⁺', { anchor: 'start' });
    s += bzAttack(P(150, 372), R);
    s += right(214, 262, 372);
    s += bzAddAnion(P(320, 372), R);
    s += right(478, 526, 372);
    s += arene(P(600, 372), R, { 0: 'NH₂' });
    s += text(650, 428, '+ NH₂⁻', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(320, 456, 'aryl anion + NH₃');
    s += tag(600, 456, 'aniline');
    return s;
  },
  caption: 'Each row is one half of the mechanism. The arrows on each structure lead to the next one.',
});

FIGURES.push({
  id: 'l-benzyne-make',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 440',
  alt: 'Stacked top to bottom. Chlorobenzene with the hydrogen on C2 drawn, and amide beside it; curved arrows from an amide lone pair to that hydrogen and from the C–H bond onto C2. Arrow down. The aryl anion, with a lone pair and minus charge on C2; curved arrows move the lone pair toward the C1–C2 bond and push chloride off. Arrow down. Benzyne, its C1–C2 bond drawn with three lines, plus chloride.',
  build() {
    const R = 30;
    let s = '';
    s += bzSubstrate(P(100, 110), R);
    s += down(100, 150, 186);
    s += tag(114, 174, 'amide takes the H', { anchor: 'start' });
    s += bzAnion(P(100, 276), R, { arrows: true });
    s += tag(150, 290, 'aryl anion', { anchor: 'start' });
    s += down(100, 316, 352);
    s += tag(114, 340, 'chloride leaves', { anchor: 'start' });
    s += benzyne(P(100, 400), R, { hi: true });
    s += tag(146, 392, 'benzyne', { anchor: 'start' });
    s += text(146, 416, '+ Cl⁻', { cls: 'fg-lbl', anchor: 'start' });
    return s;
  },
  caption: 'The arrows on each structure lead to the next one.',
});

FIGURES.push({
  id: 'l-benzyne-add',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 490',
  alt: 'Stacked top to bottom. Benzyne with amide beside it; curved arrows from the amide lone pair to C1 and from the extra C1–C2 bond onto C2. Arrow down. The aryl anion, NH2 on C1 and a lone pair on C2, beside a molecule of ammonia; curved arrows from the lone pair to an ammonia hydrogen and from that N–H bond onto nitrogen. Arrow down. Aniline plus amide.',
  build() {
    const R = 30;
    let s = '';
    s += bzAttack(P(150, 104), R);
    s += down(110, 146, 182);
    s += tag(124, 170, 'amide adds to C1', { anchor: 'start' });
    s += bzAddAnion(P(110, 274), R);
    s += down(110, 314, 350);
    s += tag(124, 338, 'C2 takes H⁺ from NH₃', { anchor: 'start' });
    s += arene(P(110, 442), R, { 0: 'NH₂' });
    s += text(160, 476, '+ NH₂⁻', { cls: 'fg-lbl', anchor: 'start' });
    return s;
  },
  caption: 'The arrows on each structure lead to the next one.',
});

/* The extra bond: top view and edge-on view. */
function bzOrbTop(s, c, R) {
  const K = hexKit(R), v = K.V(c);
  s.push(K.ring(c, []));
  for (let i = 0; i < 6; i++) s.push(`<circle class="fg-orb" cx="${v[i].x.toFixed(2)}" cy="${v[i].y.toFixed(2)}" r="7"></circle>`);
  for (const i of [0, 1]) {
    const q = at(v[i], vAng(i), 17);
    s.push(`<ellipse class="fg-orb-alt" cx="${q.x.toFixed(2)}" cy="${q.y.toFixed(2)}" rx="16" ry="8" transform="rotate(${vAng(i)} ${q.x.toFixed(2)} ${q.y.toFixed(2)})"></ellipse>`);
  }
  s.push(nums(c, R, { only: [1, 2] }));
}
function bzOrbEdge(s, c, W) {
  /* a flat-topped hexagon squashed to 0.32 of its height: the ring seen from just above its plane */
  const sq = 0.42;
  const pts = Array.from({ length: 6 }, (_, i) => P(c.x + Math.cos(rad(i * 60)) * W, c.y + Math.sin(rad(i * 60)) * W * sq));
  for (let i = 0; i < 6; i++) s.push(bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 }));
  for (const p of pts) {
    s.push(`<ellipse class="fg-orb" cx="${p.x.toFixed(2)}" cy="${(p.y - 15).toFixed(2)}" rx="5" ry="12"></ellipse>`);
    s.push(`<ellipse class="fg-orb" cx="${p.x.toFixed(2)}" cy="${(p.y + 15).toFixed(2)}" rx="5" ry="12"></ellipse>`);
  }
  /* the two front carbons (60 and 120 degrees) carry the in-plane lobes */
  for (const i of [1, 2]) {
    const a = rad(i * 60), dx = Math.cos(a), dy = Math.sin(a) * sq, L = Math.hypot(dx, dy);
    const q = P(pts[i].x + (dx / L) * 18, pts[i].y + (dy / L) * 18);
    const rot = (Math.atan2(dy, dx) * 180) / Math.PI;
    s.push(`<ellipse class="fg-orb-alt" cx="${q.x.toFixed(2)}" cy="${q.y.toFixed(2)}" rx="17" ry="5" transform="rotate(${rot.toFixed(1)} ${q.x.toFixed(2)} ${q.y.toFixed(2)})"></ellipse>`);
  }
}

FIGURES.push({
  id: 'benzyne-orbitals',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:benzyne-orbitals -->',
  viewBox: '0 0 760 280',
  alt: 'Two views of benzyne. Left, from above: the ring of six carbons, a small circle on each carbon for its p orbital, which points straight out of the page, and on C1 and C2 two lilac lobes lying flat in the page, each pointing outward from its own carbon, so they splay apart. Right, the ring seen almost edge-on: each carbon has a p orbital drawn as lobes above and below the ring, and the two front carbons have lilac lobes lying in the plane of the ring, pointing outward.',
  build() {
    const s = [];
    s.push(tag(190, 24, 'FROM ABOVE'));
    bzOrbTop(s, P(150, 150), 50);
    s.push(tag(222, 72, 'sp² lobes on C1 and C2,', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(222, 88, 'flat in the ring plane', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(190, 238, 'circles: p orbitals, standing out of the page'));
    s.push(tag(190, 256, 'lobes point apart: only weak side overlap'));
    s.push(rule(400, 40, 400, 262));
    s.push(tag(585, 24, 'SEEN FROM THE SIDE'));
    bzOrbEdge(s, P(585, 146), 92);
    s.push(tag(585, 64, 'π system above and below: unchanged', { cls: 'fg-tag-mut' }));
    s.push(tag(585, 238, 'extra bond: in the ring plane, at 90°', { cls: 'fg-tag-warn' }));
    s.push(tag(585, 256, 'to the p orbitals', { cls: 'fg-tag-warn' }));
    return s.join('');
  },
  caption: 'Lilac: the two sp&sup2; lobes that make the extra bond. Green: the six p orbitals of the aromatic ring.',
});

FIGURES.push({
  id: 'l-benzyne-orbitals',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 470',
  alt: 'Top, benzyne from above: six ring carbons, a small circle on each for its p orbital, and on C1 and C2 two lilac lobes lying flat in the page, each pointing outward so they splay apart. Bottom, the ring seen almost edge-on: p orbital lobes above and below every carbon, and lilac lobes in the ring plane on the two front carbons.',
  build() {
    const s = [];
    s.push(tag(170, 20, 'FROM ABOVE'));
    bzOrbTop(s, P(130, 130), 46);
    s.push(tag(196, 60, 'sp² lobes,', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(196, 76, 'flat in the plane', { anchor: 'start', cls: 'fg-tag-warn' }));
    s.push(tag(196, 150, 'circles:', { anchor: 'start' }));
    s.push(tag(196, 166, 'p orbitals, out', { anchor: 'start' }));
    s.push(tag(196, 182, 'of the page', { anchor: 'start' }));
    s.push(rule(20, 222, 320, 222));
    s.push(tag(170, 244, 'SEEN FROM THE SIDE'));
    s.push(tag(170, 272, 'π system above and below', { cls: 'fg-tag-mut' }));
    bzOrbEdge(s, P(170, 350), 82);
    s.push(tag(170, 446, 'extra bond: in the ring plane', { cls: 'fg-tag-warn' }));
    s.push(tag(170, 462, 'at 90° to the p orbitals', { cls: 'fg-tag-warn' }));
    return s.join('');
  },
  caption: 'Lilac: the two sp&sup2; lobes of the extra bond. Green: the p orbitals of the ring.',
});

/* The labeling experiment. */
FIGURES.push({
  id: 'benzyne-label',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:benzyne-label -->',
  viewBox: '0 0 760 300',
  alt: 'Chlorobenzene with its C1 marked by a coral dot for carbon-14 reacts with NaNH2 in liquid ammonia to give benzyne, with the dot on one end of the triple bond. Two arrows lead to two anilines. In the upper one the NH2 sits on the marked carbon; in the lower one the NH2 sits on the carbon next to the marked one. Each is labeled about 50 percent.',
  build() {
    const R = 32;
    let s = '';
    s += arene(P(90, 160), R, { 0: 'Cl' }, { stars: [0] });
    s += right(158, 238, 160);
    s += tag(198, 148, 'NaNH₂');
    s += tag(198, 180, 'NH₃ (l)', { cls: 'fg-tag-mut' });
    s += benzyne(P(310, 160), R, { hi: true }) + dot(hexKit(R).V(P(310, 160))[0]);
    s += arrow(P(362, 140), P(452, 96));
    s += arrow(P(362, 180), P(452, 224));
    s += arene(P(520, 96), R, { 0: 'NH₂' }, { stars: [0] });
    s += arene(P(520, 232), R, { 1: 'NH₂' }, { stars: [0] });
    s += text(620, 102, '≈ 50%', { cls: 'fg-lbl', anchor: 'start' });
    s += text(620, 238, '≈ 50%', { cls: 'fg-lbl', anchor: 'start' });
    s += tag(620, 124, 'NH₂ on the ¹⁴C', { anchor: 'start' });
    s += tag(620, 260, 'NH₂ next to it', { anchor: 'start' });
    s += dot(P(40, 270)) + tag(54, 274, '= ¹⁴C', { anchor: 'start' });
    return s;
  },
  caption: 'The coral dot follows the <sup>14</sup>C through each step.',
});

FIGURES.push({
  id: 'l-benzyne-label',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 330',
  alt: 'Top: chlorobenzene with C1 marked by a coral dot for carbon-14, an arrow labeled NaNH2, and benzyne with the dot on one end of the triple bond. Bottom: two anilines, one with NH2 on the marked carbon and one with NH2 on the carbon next to it, each about 50 percent.',
  build() {
    const R = 28;
    let s = '';
    s += arene(P(70, 90), R, { 0: 'Cl' }, { stars: [0] });
    s += right(118, 206, 90);
    s += tag(162, 78, 'NaNH₂');
    s += benzyne(P(262, 90), R, { hi: true }) + dot(hexKit(R).V(P(262, 90))[0]);
    s += arrow(P(240, 136), P(110, 196));
    s += arrow(P(262, 136), P(262, 196));
    s += arene(P(80, 262), R, { 0: 'NH₂' }, { stars: [0] });
    s += arene(P(250, 262), R, { 1: 'NH₂' }, { stars: [0] });
    s += tag(80, 318, '≈ 50%');
    s += tag(250, 318, '≈ 50%');
    s += dot(P(22, 150)) + tag(34, 154, '= ¹⁴C', { anchor: 'start' });
    return s;
  },
  caption: 'The coral dot follows the ¹⁴C through each step.',
});

/* A worked benzyne: 2-chlorotoluene. CH3 on vertex 5 is C1, Cl on vertex 0
   is C2, and vertex 1 (C3) holds the only H next to the chlorine. */
FIGURES.push({
  id: 'benzyne-chlorotoluene',
  section: 'nucleophilic-aromatic',
  lessons: ['nucleophilic-aromatic'],
  anchor: '<!-- anchor:benzyne-chlorotoluene -->',
  viewBox: '0 0 340 420',
  alt: 'Top left: 2-chlorotoluene, numbered with CH3 on C1 and Cl on C2; C3 carries the only hydrogen next to the chlorine, drawn explicitly. An arrow labeled NaNH2 leads to the benzyne, with the triple bond between C2 and C3 and the CH3 still on C1. Two arrows lead down to two products: 2-methylaniline, with NH2 on C2, and 3-methylaniline, with NH2 on C3.',
  build() {
    const R = 28;
    let s = '';
    s += arene(P(80, 110), R, { 5: 'CH₃', 0: 'Cl', 1: 'H' }, { nums: { from: 5, only: [1, 2, 3] } });
    s += right(146, 198, 126);
    s += tag(172, 150, 'NaNH₂');
    s += arene(P(262, 110), R, { 5: 'CH₃' }, { triple: 0, nums: { from: 5, only: [1, 2, 3] } });
    s += tag(262, 176, 'benzyne: C2–C3');
    s += arrow(P(236, 188), P(130, 236));
    s += arrow(P(270, 188), P(270, 236));
    s += arene(P(88, 318), R, { 5: 'CH₃', 0: 'NH₂' });
    s += arene(P(262, 318), R, { 5: 'CH₃', 1: 'NH₂' });
    s += tag(88, 386, 'NH₂ on C2:');
    s += tag(88, 402, '2-methylaniline');
    s += tag(262, 386, 'NH₂ on C3:');
    s += tag(262, 402, '3-methylaniline');
    return s;
  },
  caption: 'The carbons are numbered from the CH₃ carbon. The H drawn on C3 is the one the base removes.',
});

FIGURES.push({
  id: 'l-p-chlorotoluene',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 200',
  alt: '4-chlorotoluene, a benzene ring with CH3 on C1 at the bottom and Cl on C4 at the top, with every ring carbon numbered 1 to 6.',
  build() {
    const R = 34;
    let s = arene(P(170, 100), R, { 3: 'CH₃', 0: 'Cl' }, { nums: { from: 3 } });
    s += tag(250, 104, '4-chlorotoluene', { anchor: 'start' });
    return s;
  },
  caption: '<i>para</i>-Chlorotoluene, numbered from the CH₃ carbon.',
});

FIGURES.push({
  id: 'l-dimethyl',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 200',
  alt: '2-bromo-1,3-dimethylbenzene: a benzene ring with Br on C2 at the top and a CH3 on each carbon beside it, C1 and C3, with the ring carbons numbered.',
  build() {
    const R = 34;
    let s = arene(P(170, 112), R, { 5: 'CH₃', 0: 'Br', 1: 'CH₃' }, { nums: { from: 5 } });
    return s;
  },
  caption: '2-Bromo-1,3-dimethylbenzene, with its carbons numbered.',
});

/* Substituted benzynes: where the new group lands. */
FIGURES.push({
  id: 'benzyne-regio',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:benzyne-regio -->',
  viewBox: '0 0 760 440',
  alt: 'Two rows. Top row: 4-chlorotoluene gives a benzyne between C3 and C4, which gives both 4-methylaniline and 3-methylaniline, labeled a mixture of both. Bottom row: 3-bromoanisole, with the hydrogen between the OCH3 and Br groups drawn, gives a benzyne between C2 and C3. Amide adds to C3, the end further from the OCH3, leaving a lone pair and minus charge on C2, the carbon next to the one carrying oxygen; that anion takes a proton to give 3-methoxyaniline.',
  build() {
    const R = 26, d = R * 0.95 + 9;
    let s = '';
    s += tag(24, 24, '4-CHLOROTOLUENE: A METHYL BARELY CHOOSES', { anchor: 'start' });
    const y1 = 122;
    const n1 = { from: 3, ccw: true, only: [1, 3, 4] };
    s += arene(P(80, y1), R, { 3: 'CH₃', 0: 'Cl' }, { d, nums: n1 });
    s += right(126, 186, y1);
    s += tag(156, y1 + 24, 'NaNH₂');
    s += arene(P(236, y1), R, { 3: 'CH₃' }, { d, triple: 0, nums: n1 });
    s += right(282, 342, y1);
    s += tag(312, y1 + 24, 'NH₂⁻, then H⁺');
    s += arene(P(400, y1), R, { 3: 'CH₃', 0: 'NH₂' }, { d });
    s += text(476, y1 + 5, '+', { cls: 'fg-lbl' });
    s += arene(P(540, y1), R, { 3: 'CH₃', 1: 'NH₂' }, { d });
    s += tag(400, 216, '4-methylaniline');
    s += tag(548, 216, '3-methylaniline');
    s += tag(660, y1 - 6, 'a mixture', { anchor: 'start', cls: 'fg-tag-mut' });
    s += tag(660, y1 + 10, 'of both', { anchor: 'start', cls: 'fg-tag-mut' });
    s += rule(24, 238, 736, 238);
    s += tag(24, 264, '3-BROMOANISOLE: THE OXYGEN CHOOSES', { anchor: 'start' });
    const y = 350, n2 = { from: 5, only: [1, 2, 3] };
    s += arene(P(88, y), R, { 5: 'OCH₃', 0: 'H', 1: 'Br' }, { d, nums: n2 });
    s += right(162, 204, y + 10);
    s += tag(183, y + 34, 'NaNH₂');
    s += arene(P(270, y), R, { 5: 'OCH₃' }, { d, triple: 0, nums: n2 });
    s += right(318, 372, y + 10);
    s += tag(345, y + 34, 'NH₂⁻ adds');
    s += tag(345, y + 50, 'to C3');
    {
      const c = P(450, y), v = hexKit(R).V(c);
      s += arene(c, R, { 5: 'OCH₃', 1: 'NH₂' }, { d, nums: n2 });
      s += anion(v[0], -90, -50);
      s += tag(450, y + 60, 'charge on C2, beside', { cls: 'fg-tag-good' });
      s += tag(450, y + 76, 'the carbon bearing O', { cls: 'fg-tag-good' });
    }
    s += right(528, 580, y + 10);
    s += tag(554, y + 34, 'H⁺');
    s += arene(P(660, y), R, { 5: 'OCH₃', 1: 'NH₂' }, { d });
    s += tag(660, y + 60, '3-methoxyaniline');
    return s;
  },
  caption: 'Top: NH₂ ends up at both ends of the benzyne. Bottom: the third structure shows where the charge sits.',
});

/* Benzyne as a dienophile, with furan. */
FIGURES.push({
  id: 'benzyne-furan',
  section: 'nucleophilic-aromatic',
  anchor: '<!-- anchor:benzyne-furan -->',
  viewBox: '0 0 760 240',
  alt: 'Benzyne, drawn with its triple bond on the right-hand edge of the ring, faces furan, whose oxygen points toward it. Three curved arrows: from the benzyne extra bond to the top end of the furan diene, from the furan top double bond into the middle of the furan, and from the furan lower double bond to the lower benzyne carbon. The product is a benzene ring fused to a six-membered ring whose two far corners are bridged by the oxygen; the remaining C=C sits on the far edge.',
  build() {
    const R = 36, K = hexKit(R), h = R * Math.sqrt(3);
    let s = '';
    const b = P(110, 118), v = K.V(b);
    s += K.ring(b, [1, 3, 5]) + K.outer(b, 1, 'fg-bond-hi');
    /* furan as a regular pentagon, its oxygen pointing at the benzyne */
    const f = P(b.x + 150, b.y), fr = 40;
    const [O, C2, C3, C4, C5] = [180, 252, 324, 36, 108].map((a) => at(f, a, fr));
    s += bond(O, C2, { rFrom: 12, rTo: 0 }) + bond(C5, O, { rFrom: 0, rTo: 12 });
    s += ringDouble(C2, C3, f, { inset: 6, gap: 4.4 }) + bond(C3, C4, { rFrom: 0, rTo: 0 }) + ringDouble(C4, C5, f, { inset: 6, gap: 4.4 });
    s += lab(O, 'O', { r: 12 });
    s += `<line class="fg-dash" x1="${(v[1].x + 6).toFixed(1)}" y1="${(v[1].y - 2).toFixed(1)}" x2="${(C2.x - 5).toFixed(1)}" y2="${(C2.y + 1).toFixed(1)}"></line>`;
    s += `<line class="fg-dash" x1="${(v[2].x + 6).toFixed(1)}" y1="${(v[2].y + 2).toFixed(1)}" x2="${(C5.x - 5).toFixed(1)}" y2="${(C5.y - 1).toFixed(1)}"></line>`;
    const om = at(mid(v[1], v[2]), 0, 6);
    s += curve(P(om.x + 1, om.y - 8), mid(v[1], C2, 0.5), { bow: -14, size: 7 });
    s += curve(mid(C2, C3), at(mid(C3, C4), 0, 4), { bow: -16, size: 7 });
    s += curve(mid(C4, C5), mid(C5, v[2], 0.5), { bow: -16, size: 7 });
    const q = f;
    s += tag(110, 206, 'benzyne (dienophile)');
    s += tag(q.x + 8, 206, 'furan (diene)');
    s += right(346, 420, 118);
    s += tag(383, 106, 'room temp.');
    /* product: benzene fused to the new ring, O bridging its two far corners */
    const p1 = P(510, 118);
    s += K.ring(p1, [1, 3, 5]);
    const p2 = P(p1.x + h, p1.y), w = K.V(p2);
    s += bond(w[0], w[1], { rFrom: 0, rTo: 0 }) + ringDouble(w[1], w[2], p2, { inset: 6, gap: 4.4 }) + bond(w[2], w[3], { rFrom: 0, rTo: 0 });
    s += bond(w[0], p2, { rFrom: 0, rTo: 12 }) + bond(p2, w[3], { rFrom: 12, rTo: 0 });
    s += lab(p2, 'O', { r: 12, kind: 'hi' });
    s += tag(p2.x + 46, p1.y - 4, 'O bridge, tilted', { anchor: 'start' });
    s += tag(p2.x + 46, p1.y + 12, 'up out of the page', { anchor: 'start' });
    s += tag(560, 206, 'the bicyclic adduct');
    return s;
  },
  caption: 'The dashed lines are the two new σ bonds. The three curved arrows are the same as in any Diels&ndash;Alder reaction.',
});

/* Deciding which route a substrate can take. */
FIGURES.push({
  id: 'snar-vs-benzyne',
  section: 'nucleophilic-aromatic',
  anchor: '<h3>Telling them apart</h3>',
  viewBox: '0 0 760 250',
  alt: 'A decision chart. First question: is there a nitro group, or another strong withdrawing group, ortho or para to the halide? Yes leads to SNAr: one product, the nucleophile where the halide was. No leads to a second question: is there a very strong base such as NaNH2, and a hydrogen on a carbon next to the halide? Yes leads to benzyne: two products at neighboring carbons. No leads to no reaction.',
  build() {
    let s = '';
    const box = (x, y, w, h, lines, kind) => {
      let g = panel(x, y, w, h, { kind });
      lines.forEach((t, i) => { g += text(x + w / 2, y + 22 + i * 17, t, { cls: 'fg-tag' }); });
      return g;
    };
    s += box(24, 30, 250, 62, ['A strong withdrawing group', 'ortho or para to the halide?'], null);
    s += box(24, 158, 250, 62, ['A very strong base (NaNH₂) and', 'an H on a carbon next to X?'], null);
    s += arrow(P(149, 92), P(149, 156));
    s += tag(160, 128, 'no', { anchor: 'start', cls: 'fg-tag-mut' });
    s += arrow(P(274, 61), P(420, 61));
    s += tag(347, 52, 'yes', { cls: 'fg-tag-good' });
    s += box(422, 30, 314, 62, ['SₙAr: one product,', 'the nucleophile where X was'], 'hi');
    s += arrow(P(274, 189), P(420, 189));
    s += tag(347, 180, 'yes', { cls: 'fg-tag-good' });
    s += box(422, 158, 314, 62, ['Benzyne: two products,', 'on neighboring carbons'], 'warn');
    s += arrow(P(149, 220), P(149, 240));
    s += text(170, 244, 'no: no reaction', { cls: 'fg-tag-mut', anchor: 'start' });
    return s;
  },
  caption: 'Start at the top left.',
});

/* The sorter substrates, drawn. */
FIGURES.push({
  id: 'l-sort',
  lessons: ['nucleophilic-aromatic'],
  viewBox: '0 0 340 340',
  alt: 'Four substrates in a grid. A: 1-chloro-2,4-dinitrobenzene, Cl with nitro groups ortho and para to it. B: chlorobenzene. C: 1-chloro-3-nitrobenzene, Cl with a nitro group meta to it. D: 2-chloro-1,3,5-trimethylbenzene, Cl with a methyl group on each neighboring carbon and a third methyl para to it.',
  build() {
    const R = 24;
    let s = '';
    const cell = (x, y, L, subs) => arene(P(x, y), R, subs, { d: R * 0.95 + 11 }) + tag(x - 70, y - 50, L, { anchor: 'start', size: 11 });
    s += cell(90, 88, 'A', { 0: 'Cl', 1: 'NO₂', 3: 'NO₂' });
    s += cell(254, 88, 'B', { 0: 'Cl' });
    s += cell(90, 260, 'C', { 0: 'Cl', 2: 'NO₂' });
    s += cell(254, 260, 'D', { 0: 'Cl', 1: 'CH₃', 5: 'CH₃', 3: 'CH₃' });
    s += rule(172, 20, 172, 320) + rule(20, 172, 320, 172);
    return s;
  },
  caption: 'A: 1-chloro-2,4-dinitrobenzene. B: chlorobenzene. C: 1-chloro-3-nitrobenzene. D: 2-chloro-1,3,5-trimethylbenzene.',
});

export default FIGURES;
