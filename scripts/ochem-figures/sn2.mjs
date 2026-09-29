/* Figures for the sn2 notes page. Built by scripts/build-ochem-figures.mjs;
   see the header there. The sn2 topic has an interactive mechanism page
   (ochem/mechanisms/sn2.html) instead of a lesson, so nothing here is shown
   in a lesson.

   Conventions used throughout: the nucleophile comes in from the LEFT and
   the leaving group sits on the RIGHT, on one horizontal line through the
   carbon under attack. Before the reaction the carbon's other three groups
   lean left, toward the nucleophile; after it they lean right. Each group
   keeps its wedge or hash, because the umbrella flip swaps left for right
   but not front for back. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, P } from '../lib/ochem-figure.mjs';
import { polyPts, polyRing, benzene } from '../lib/ochem-skeletal.mjs';
import { armEnd, frame } from '../lib/ochem-helpers.mjs';

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

/* ---- small local helpers ------------------------------------------------ */
const r2 = (v) => (Math.round(v * 100) / 100).toString();
const rad = (l) => (l.length > 2 ? 18 : l.length > 1 ? 16 : 14);
/* An atom in a disc, label at the CSS size. */
const A = (p, l, kind = 'plain', r) => atom(p.x, p.y, l, { kind, size: 13, r: r ?? rad(l) });
/* A lone pair on atom p, pointing along screen angle deg (0 east, 90 south). */
const lp = (p, deg, d = 21) => lonePair(p.x, p.y, deg, { dist: d });
/* A formal charge or a partial charge, set small beside an atom. */
const chg = (x, y, s = '−') => `<text class="fg-lbl fg-warn" x="${r2(x)}" y="${r2(y + 5)}" text-anchor="middle">${s}</text>`;
const delta = (x, y, s) => text(x, y, s, { cls: 'fg-tag-warn' });
/* A dotted partial bond, trimmed back from both atoms. */
function partial(a, b, rA = 16, rB = 16) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  return `<line class="fg-dash" x1="${r2(a.x + ux * rA)}" y1="${r2(a.y + uy * rA)}" x2="${r2(b.x - ux * rB)}" y2="${r2(b.y - uy * rB)}"></line>`;
}
/* Square brackets and a double dagger around a transition-state drawing. */
function brackets(xl, xr, yt, yb) {
  let g = `<path class="fg-bond" fill="none" d="M${xl + 9} ${yt} L${xl} ${yt} L${xl} ${yb} L${xl + 9} ${yb}"></path>`;
  g += `<path class="fg-bond" fill="none" d="M${xr - 9} ${yt} L${xr} ${yt} L${xr} ${yb} L${xr - 9} ${yb}"></path>`;
  g += text(xr + 5, yt + 10, '‡', { cls: 'fg-lbl', anchor: 'start' });
  return g;
}
/* Width of a label at the 13px label size. Subscript digits count as one. */
const wid = (s) => s.length * 13 * 0.62;

/* A group on the carbon at c, at math angle deg (0 east, counterclockwise),
   drawn as a disc atom when `disc` is set and otherwise as bare text beyond
   the bond end. kind is 'plain', 'wedge' or 'hash'. `pri` is a CIP rank
   printed beside the label. Returns the ink. */
function grp(c, deg, len, l, kind = 'plain', opts = {}) {
  const e = armEnd(c, deg, len);
  const rFrom = opts.rFrom ?? 16;
  const disc = opts.disc ?? (l.length <= 3);
  const rTo = disc ? rad(l) : 0;
  const o = { rFrom, rTo };
  let s = kind === 'wedge' ? wedge(c, e, { ...o, width: 9 })
        : kind === 'hash' ? hash(c, e, { ...o, width: 11, rungs: 4 })
        : bond(c, e, o);
  const cs = Math.cos((deg * Math.PI) / 180), sn = Math.sin((deg * Math.PI) / 180);
  let lx, ly, anchor;
  if (disc) {
    s += A(e, l, opts.kind || 'plain');
    lx = e.x; ly = e.y + 4.5; anchor = 'middle';
  } else {
    anchor = cs < -0.3 ? 'end' : cs > 0.3 ? 'start' : 'middle';
    lx = e.x + (anchor === 'end' ? -3 : anchor === 'start' ? 3 : 0);
    ly = anchor === 'middle' ? (sn > 0 ? e.y - 6 : e.y + 15) : e.y + 4.5 + (sn > 0.3 ? -4 : sn < -0.3 ? 6 : 0);
    s += text(lx, ly, l, { cls: 'fg-lbl', anchor });
  }
  if (opts.pri) {
    const w = disc ? 2 * rad(l) : wid(l);
    const left = disc ? e.x - w / 2 : anchor === 'end' ? lx - w : anchor === 'middle' ? lx - w / 2 : lx;
    const right = left + w;
    const side = opts.priSide || (cs < -0.3 ? 'left' : 'right');
    const px = side === 'left' ? left - 4 : right + 4;
    const py = disc ? e.y - 8 : ly - 8;
    s += text(px, py, opts.pri, { cls: 'fg-tag-warn', anchor: side === 'left' ? 'end' : 'start' });
  }
  return s;
}

/* The two curved arrows of a displacement: a lone pair at `from` attacks the
   carbon at c (arriving on its left), and the C–LG bond's pair moves onto
   the leaving group at lg. */
function displace(from, c, lg, rLg = 16) {
  return curve(from, P(c.x - 17, c.y - 6), { bow: -18 }) +
         curve(P((c.x + lg.x) / 2 - 6, c.y - 4), P(lg.x - rLg + 4, lg.y - 14), { bow: -14 });
}

/* A bromine atom with three lone pairs (bonded on its left). */
const brBonded = (p) => A(p, 'Br') + lp(p, 270, 22) + lp(p, 90, 22) + lp(p, 0, 22);
/* Bromide ion: four lone pairs and a charge. */
const bromide = (p) => A(p, 'Br') + lp(p, 270, 22) + lp(p, 90, 22) + lp(p, 0, 22) + lp(p, 180, 22) + chg(p.x + 20, p.y - 22);

const FIGURES = [];

/* ------------------------------------------------------------------ 1 ---
   HO⁻ + CH₃Br, before and after, with the two arrows. */
FIGURES.push({
  id: 'sn2-arrows',
  section: 'sn2',
  anchor: '<h3>One step, two arrows</h3>',
  alt: 'Left: hydroxide ion, an oxygen with three lone pairs, a negative charge and a hydrogen, sits to the left of bromomethane. Bromomethane has its carbon in the middle, bromine to the right, and three hydrogens leaning to the left: one up, one on a wedge and one on a hash. Curved arrow 1 runs from the oxygen lone pair that faces the carbon to the carbon. Curved arrow 2 runs from the C–Br bond onto the bromine. A reaction arrow leads to the right side: methanol, with the oxygen now bonded to the carbon, the three hydrogens leaning to the right, and a separate bromide ion with four lone pairs and a negative charge.',
  viewBox: '0 0 760 230',
  build() {
    let s = '';
    const y = 120;
    // ---- before ----
    const h0 = P(34, y), o = P(88, y), c = P(206, y), br = P(290, y);
    s += bond(h0, o, { rFrom: 14, rTo: 16 }) + A(h0, 'H') + A(o, 'O', 'hi');
    s += lp(o, 270) + lp(o, 90) + lp(o, 0) + chg(o.x - 18, o.y - 26);
    s += grp(c, 110, 46, 'H') + grp(c, 208, 54, 'H', 'wedge') + grp(c, 262, 50, 'H', 'hash');
    s += bond(c, br, { rFrom: 16, rTo: 16 }) + A(c, 'C', 'warn') + brBonded(br);
    s += displace(P(o.x + 23, o.y - 3), c, br);
    s += tag(140, 50, 'arrow 1: new C–O bond');
    s += tag(318, 72, 'arrow 2: C–Br breaks', { anchor: 'start' });
    s += text(160, 212, 'HO⁻ + CH₃Br', { cls: 'fg-lbl' });
    // ---- reaction arrow ----
    s += arrow(P(360, y), P(420, y));
    s += tag(390, y - 12, 'one step');
    // ---- after ----
    const h1 = P(454, y), o1 = P(506, y), c1 = P(574, y), br1 = P(706, y);
    s += bond(h1, o1, { rFrom: 14, rTo: 16 }) + A(h1, 'H') + A(o1, 'O', 'hi');
    s += lp(o1, 270) + lp(o1, 90);
    s += bond(o1, c1, { rFrom: 16, rTo: 16, cls: 'fg-bond-hi' });
    s += grp(c1, 70, 46, 'H') + grp(c1, 332, 54, 'H', 'wedge') + grp(c1, 278, 50, 'H', 'hash');
    s += A(c1, 'C', 'warn') + bromide(br1);
    s += text(560, 212, 'CH₃OH', { cls: 'fg-lbl' });
    s += text(706, 212, 'Br⁻', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Arrow 1 starts at an oxygen lone pair and arrow 2 at the C–Br bond. Compare which way the three hydrogens point before and after.',
});

/* ------------------------------------------------------------------ 2 ---
   The transition state, drawn, and where it sits on the energy diagram. */
FIGURES.push({
  id: 'sn2-ts',
  section: 'sn2',
  anchor: '<h3>The transition state: one hill, no valley</h3>',
  alt: 'Left: the SN2 transition state for hydroxide and bromomethane, in square brackets with a double dagger. HO, the carbon and Br lie on one horizontal line; dotted partial bonds join the carbon to O and to Br, and each end carries delta minus. A p orbital drawn along that line passes through the carbon. The three hydrogens are fully bonded and lie flat in one plane at right angles to the line: one straight up, one on a wedge and one on a hash. Labels: half-formed bond, half-broken bond, 180 degrees, three H flat, 120 degrees apart. Right: an energy diagram with a single peak between the reactants HO minus plus CH3Br and the lower products CH3OH plus Br minus. The peak is labeled with the double dagger and the note that this structure sits at the top; the curve has no valley.',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const y = 140;
    const o = P(80, y), c = P(200, y), br = P(320, y);
    // p orbital along the axis, behind everything
    s += `<ellipse class="fg-orb" cx="${c.x - 38}" cy="${y}" rx="36" ry="16"></ellipse>`;
    s += `<ellipse class="fg-orb" cx="${c.x + 38}" cy="${y}" rx="36" ry="16"></ellipse>`;
    const h0 = P(30, y);
    s += bond(h0, o, { rFrom: 14, rTo: 16 }) + A(h0, 'H') + A(o, 'O', 'hi');
    s += partial(o, c) + partial(c, br);
    s += grp(c, 90, 50, 'H') + grp(c, 245, 46, 'H', 'wedge') + grp(c, 295, 46, 'H', 'hash');
    s += A(c, 'C') + A(br, 'Br');
    s += delta(o.x, o.y - 26, 'δ−') + delta(br.x, br.y - 26, 'δ−');
    s += brackets(12, 348, 50, 232);
    s += tag(112, y + 48, 'half formed', { anchor: 'middle' });
    s += tag(288, y + 48, 'half broken', { anchor: 'middle' });
    s += text(180, 262, 'three H flat, 120° apart', { cls: 'fg-tag' });
    s += text(180, 280, 'O, C and Br in a line: 180°', { cls: 'fg-tag' });
    s += text(180, 30, 'TRANSITION STATE', { cls: 'fg-lbl' });

    // ---- energy diagram ----
    s += rule(380, 20, 380, 290);
    const x0 = 420, base = 236;
    s += frame(x0, base, 40, 744);
    s += text(x0 + 9, 45, 'free energy', { cls: 'fg-tag', anchor: 'start' });
    s += text(744, base + 17, 'reaction coordinate →', { cls: 'fg-tag', anchor: 'end' });
    const yR = 170, yT = 80, yP = 196;
    s += profile([P(440, yR), P(480, yR), P(585, yT), P(690, yP), P(730, yP)]);
    s += tag(585, yT - 26, 'the structure at left');
    s += text(585, yT - 10, '‡', { cls: 'fg-lbl' });
    s += text(462, yR - 12, 'HO⁻ + CH₃Br', { cls: 'fg-tag' });
    s += text(712, yP + 18, 'CH₃OH + Br⁻', { cls: 'fg-tag' });
    s += text(585, 284, 'one peak, no valley: no intermediate', { cls: 'fg-tag-warn' });
    return s;
  },
  caption: 'Left, the structure at the top of the hill: dotted bonds, δ− at both ends, brackets and ‡. Right, the SN2 energy diagram, with a single peak.',
});

/* ------------------------------------------------------------------ 3 ---
   Why backside: the big lobe of the C–Br σ* orbital. */
function lobePath(c, deg, len, w, cls) {
  const d = { x: Math.cos((deg * Math.PI) / 180), y: -Math.sin((deg * Math.PI) / 180) };
  const p = { x: -d.y, y: d.x };
  const at = (k, m) => P(c.x + d.x * k + p.x * m, c.y + d.y * k + p.y * m);
  const a1 = at(len * 0.32, w * 0.62), a2 = at(len, w * 0.95), tip = at(len, 0), b2 = at(len, -w * 0.95), b1 = at(len * 0.32, -w * 0.62);
  const pt = (q) => `${r2(q.x)} ${r2(q.y)}`;
  return `<path class="${cls}" d="M${pt(c)} C${pt(a1)} ${pt(a2)} ${pt(tip)} C${pt(b2)} ${pt(b1)} ${pt(c)} Z"></path>`;
}
FIGURES.push({
  id: 'sn2-sigma-star',
  section: 'sn2',
  anchor: '<h3>Why the nucleophile attacks from the back</h3>',
  alt: 'Bromomethane with its carbon in the middle and bromine to the right. The empty C–Br sigma star orbital is drawn as a large lobe on the carbon pointing left, away from the bromine, a dashed node line between the carbon and the bromine, and a small lobe beyond the bromine. A nucleophile with a lone pair and a negative charge sits far to the left on the same line; a dashed arrow runs from its lone pair into the large lobe. Labels: large lobe, the target; node; front side blocked by Br and its lone pairs; 180 degrees from Br.',
  viewBox: '0 0 700 250',
  build() {
    let s = '';
    const y = 120;
    const c = P(330, y), br = P(410, y), nu = P(70, y);
    s += lobePath(c, 180, 118, 36, 'fg-orb');
    s += lobePath(br, 0, 44, 18, 'fg-orb-alt');
    s += `<line class="fg-orb-node" x1="${(c.x + br.x) / 2}" y1="${y - 38}" x2="${(c.x + br.x) / 2}" y2="${y + 38}"></line>`;
    s += grp(c, 110, 46, 'H') + grp(c, 208, 54, 'H', 'wedge') + grp(c, 262, 50, 'H', 'hash');
    s += bond(c, br, { rFrom: 16, rTo: 16 }) + A(c, 'C', 'warn') + brBonded(br);
    s += A(nu, 'Nu', 'hi') + lp(nu, 0, 24) + chg(nu.x, nu.y - 30);
    s += `<line class="fg-dash-hi" x1="${nu.x + 34}" y1="${y}" x2="${c.x - 110}" y2="${y}"></line>`;
    s += arrow(P(c.x - 118, y), P(c.x - 100, y));
    s += tag(c.x - 90, y + 90, 'large lobe of C–Br σ*:', { anchor: 'middle' });
    s += tag(c.x - 90, y + 106, 'the target', { anchor: 'middle' });
    s += tag((c.x + br.x) / 2, y - 48, 'node');
    s += tag(br.x + 40, y + 90, 'front: Br and its', { anchor: 'middle' });
    s += tag(br.x + 40, y + 106, 'lone pairs in the way', { anchor: 'middle' });
    s += tag(130, y - 30, 'lone pair aims here', { anchor: 'start' });
    s += text(nu.x + 70, y + 30, '180° from Br', { cls: 'fg-tag-warn', anchor: 'start' });
    return s;
  },
  caption: 'Follow the dashed line from the lone pair through the carbon to the bromine. The big lobe, and so the only way in, is on the side away from the bromine.',
});

/* ------------------------------------------------------------------ 4/5 ---
   Inversion at a stereocenter, with CIP ranks, before and after. */
function invPanel(o) {
  let s = '';
  const y = 130;
  const c = P(o.cx, y), br = P(o.cx + 70, y);
  // nucleophile
  s += o.nu(P(o.cx - 120, y));
  // substrate, groups leaning left
  s += grp(c, 115, 48, o.up, 'plain', { pri: '2', disc: false });
  s += grp(c, 210, 52, o.wedge, 'wedge', { pri: '3', disc: false });
  s += grp(c, 255, 50, 'H', 'hash', { pri: '4', priSide: 'right' });
  s += bond(c, br, { rFrom: 16, rTo: 16 }) + A(c, 'C', 'warn') + brBonded(br);
  s += text(br.x, br.y - 32, '1', { cls: 'fg-tag-warn' });
  s += displace(o.lpAt, c, br);
  return s;
}
function prodPanel(o) {
  let s = '';
  const y = 130;
  const c = P(o.cx, y);
  s += o.nu(c);
  s += grp(c, 65, 48, o.up, 'plain', { pri: o.priUp, disc: false });
  s += grp(c, 330, 52, o.wedge, 'wedge', { pri: '3', disc: false });
  s += grp(c, 285, 50, 'H', 'hash', { pri: '4', priSide: 'right' });
  s += A(c, 'C', 'warn');
  s += bromide(P(o.cx + 150, y));
  return s;
}
/* The hydrosulfide ion with S at p, facing right. */
const hsIon = (p) => bond(P(p.x - 44, p.y), p, { rFrom: 14, rTo: 14 }) + A(P(p.x - 44, p.y), 'H') + A(p, 'S', 'hi') +
  lp(p, 270) + lp(p, 90) + lp(p, 0) + chg(p.x - 16, p.y - 26);
/* A bonded SH on the left of carbon c. */
const shGroup = (c) => {
  const s0 = P(c.x - 70, c.y), h = P(c.x - 114, c.y);
  return bond(h, s0, { rFrom: 14, rTo: 14 }) + A(h, 'H') + A(s0, 'S', 'hi') + lp(s0, 270) + lp(s0, 90) +
    bond(s0, c, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' }) + text(s0.x, s0.y - 34, '1', { cls: 'fg-tag-warn' });
};
/* Cyanide with its carbon at p, facing right: N≡C:⁻ */
const cnIon = (p) => {
  const n = P(p.x - 48, p.y);
  return bond(n, p, { order: 3, rFrom: 14, rTo: 14 }) + A(n, 'N') + A(p, 'C', 'hi') +
    lp(n, 180) + lp(p, 0) + chg(p.x + 2, p.y - 26);
};
/* A bonded nitrile on the left of carbon c: N≡C–C */
const cnGroup = (c) => {
  const k = P(c.x - 68, c.y), n = P(c.x - 116, c.y);
  return bond(n, k, { order: 3, rFrom: 14, rTo: 14 }) + A(n, 'N') + A(k, 'C', 'hi') + lp(n, 180) +
    bond(k, c, { rFrom: 14, rTo: 16, cls: 'fg-bond-hi' }) + text(k.x, k.y - 30, '2', { cls: 'fg-tag-warn' });
};

FIGURES.push({
  id: 'sn2-inversion-sh',
  section: 'sn2',
  anchor: 'Worked example 1',
  alt: 'Left, (S)-2-bromobutane with hydrosulfide approaching from the left. The stereocenter carries bromine on the right, ranked 1; an ethyl group up and to the left, ranked 2; a methyl on a wedge, lower left, ranked 3; and a hydrogen on a hash, ranked 4. Curved arrows run from a sulfur lone pair to the carbon and from the C–Br bond onto bromine. Right, (R)-butane-2-thiol: SH on the left, ranked 1; ethyl up and to the right, ranked 2; methyl on a wedge, lower right, ranked 3; hydrogen on a hash, ranked 4; plus bromide ion. Under each: with H at the back, 1 to 2 to 3 runs counterclockwise, S, on the left and clockwise, R, on the right.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += invPanel({ cx: 200, up: 'CH₂CH₃', wedge: 'CH₃', nu: hsIon, lpAt: P(103, 127) });
    s += arrow(P(346, 130), P(400, 130));
    s += prodPanel({ cx: 560, up: 'CH₂CH₃', wedge: 'CH₃', priUp: '2', nu: shGroup });
    s += text(190, 222, '(S)-2-bromobutane + ⁻SH', { cls: 'fg-lbl' });
    s += text(190, 242, 'H at the back; 1 → 2 → 3 counterclockwise', { cls: 'fg-tag' });
    s += text(580, 222, '(R)-butane-2-thiol + Br⁻', { cls: 'fg-lbl' });
    s += text(580, 242, 'H at the back; 1 → 2 → 3 clockwise', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The orange numbers are CIP ranks. The ethyl, methyl and hydrogen swing from the left side of the carbon to the right; sulfur takes rank 1, as bromine did.',
});

FIGURES.push({
  id: 'sn2-inversion-cn',
  section: 'sn2',
  anchor: 'Worked example 2',
  alt: 'Left, (S)-2-bromo-1-methoxypropane with cyanide approaching from the left through its carbon. The stereocenter carries bromine on the right, ranked 1; CH2OCH3 up and to the left, ranked 2; a methyl on a wedge, lower left, ranked 3; and hydrogen on a hash, ranked 4. Curved arrows run from the cyanide carbon lone pair to the stereocenter and from the C–Br bond onto bromine. Right, (S)-3-methoxy-2-methylpropanenitrile: the nitrile carbon on the left, now ranked 2; CH2OCH3 up and to the right, now ranked 1; methyl on a wedge, lower right, ranked 3; hydrogen on a hash, ranked 4; plus bromide. Under each: counterclockwise, S, on both sides.',
  viewBox: '0 0 760 250',
  build() {
    let s = '';
    s += invPanel({ cx: 200, up: 'CH₂OCH₃', wedge: 'CH₃', nu: cnIon, lpAt: P(103, 127) });
    s += arrow(P(346, 130), P(400, 130));
    s += prodPanel({ cx: 560, up: 'CH₂OCH₃', wedge: 'CH₃', priUp: '1', nu: cnGroup });
    s += text(190, 222, '(S)-2-bromo-1-methoxypropane + ⁻CN', { cls: 'fg-lbl' });
    s += text(190, 242, 'H at the back; 1 → 2 → 3 counterclockwise', { cls: 'fg-tag' });
    s += text(580, 222, '(S)-3-methoxy-2-methylpropanenitrile', { cls: 'fg-lbl' });
    s += text(580, 242, 'H at the back; 1 → 2 → 3 still counterclockwise', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The same flip as in Worked example 1. This time the new group takes rank 2, not rank 1, and CH₂OCH₃ moves up to rank 1.',
});

/* ------------------------------------------------------------------ 6 ---
   On a ring: cis to trans. */
FIGURES.push({
  id: 'sn2-ring',
  section: 'sn2',
  anchor: 'On a ring,',
  alt: 'Left: cis-1-bromo-4-methylcyclohexane drawn as a flat hexagon, with bromine on a wedge at the right-hand carbon, C1, and a methyl on a wedge at the left-hand carbon, C4; both point toward the viewer, on the same face. The reaction arrow is labeled: SH minus attacks C1 from the back. Right: trans-4-methylcyclohexane-1-thiol, with SH on a hash at C1, pointing away from the viewer, and the methyl still on a wedge at C4, so the two groups are on opposite faces.',
  viewBox: '0 0 760 210',
  build() {
    let s = '';
    const y = 104;
    const ring = (cx) => polyPts(cx, y, 6, 46, 0);
    const subs = (p, right, rightKind) => {
      let g = polyRing(p);
      const e = P(p[0].x + 48, y), w = P(p[3].x - 46, y);
      g += rightKind === 'wedge' ? wedge(p[0], e, { rFrom: 0, rTo: 0, width: 10 }) : hash(p[0], e, { rFrom: 0, rTo: 0, width: 11, rungs: 5 });
      g += text(e.x + 5, y + 5, right, { cls: 'fg-lbl', anchor: 'start' });
      g += wedge(p[3], w, { rFrom: 0, rTo: 0, width: 10 }) + text(w.x - 5, y + 5, 'CH₃', { cls: 'fg-lbl', anchor: 'end' });
      g += text(p[0].x - 12, y + 5, 'C1', { cls: 'fg-tag-mut', anchor: 'end' }) + text(p[3].x + 12, y + 5, 'C4', { cls: 'fg-tag-mut', anchor: 'start' });
      return g;
    };
    s += subs(ring(160), 'Br', 'wedge');
    s += text(170, 32, 'cis: Br and CH₃ both toward you', { cls: 'fg-tag' });
    s += arrow(P(338, y), P(420, y));
    s += text(379, y - 14, '⁻SH', { cls: 'fg-lbl' });
    s += text(379, y + 24, 'attacks C1', { cls: 'fg-tag' });
    s += text(379, y + 40, 'from the back', { cls: 'fg-tag' });
    s += subs(ring(560), 'SH', 'hash');
    s += text(570, 32, 'trans: SH away from you, CH₃ toward you', { cls: 'fg-tag' });
    s += text(170, 196, 'cis-1-bromo-4-methylcyclohexane', { cls: 'fg-lbl' });
    s += text(580, 196, 'trans-4-methylcyclohexane-1-thiol', { cls: 'fg-lbl' });
    return s;
  },
  caption: 'Wedges point toward you and hashes away. Bromine left from the front face, so the sulfur arrived on the back face.',
});

/* ------------------------------------------------------------------ 7 ---
   The steric ladder, drawn, with rates on a log scale. */
function ladderRow(y, groups, opts = {}) {
  let s = '';
  const c = P(200, y), br = P(262, y);
  for (const [deg, kind, l] of groups) {
    if (l === 'Q') continue;
    s += grp(c, deg, 50, l, kind, { disc: true, kind: l === 'H' ? 'plain' : 'warn' });
  }
  if (opts.neo) {
    // the quaternary carbon up and to the left, one CH3 hanging into the path
    const q = armEnd(c, 115, 50);
    s += bond(c, q, { rFrom: 16, rTo: 14 });
    s += grp(q, 165, 42, 'CH₃', 'plain', { rFrom: 14, kind: 'warn', disc: true });
    s += grp(q, 60, 42, 'CH₃', 'plain', { rFrom: 14, kind: 'warn', disc: true });
    s += grp(q, 228, 42, 'CH₃', 'plain', { rFrom: 14, kind: 'warn', disc: true });
    s += A(q, 'C', 'warn', 14);
  }
  s += bond(c, br, { rFrom: 16, rTo: 16 }) + A(c, 'C') + A(br, 'Br');
  const stop = opts.block ?? c.x - 20;
  s += arrow(P(20, y), P(stop, y));
  if (opts.block) {
    const bx = opts.block + 8;
    s += `<line class="fg-arrow" x1="${bx - 9}" y1="${y - 9}" x2="${bx + 9}" y2="${y + 9}"></line><line class="fg-arrow" x1="${bx - 9}" y1="${y + 9}" x2="${bx + 9}" y2="${y - 9}"></line>`;
  }
  return s;
}
FIGURES.push({
  id: 'sn2-sterics',
  section: 'sn2',
  anchor: '<h3>Steric effects: which carbons can react</h3>',
  alt: 'Five alkyl bromides stacked, each with its carbon in the middle, bromine to the right and an attack arrow coming in from the left along the C–Br line. Bromomethane has three hydrogens around the carbon and the arrow reaches it; relative rate about 30. Bromoethane has one methyl and two hydrogens; rate 1. 2-Bromopropane has two methyls and one hydrogen; rate 0.03. Neopentyl bromide has two hydrogens and a quaternary carbon whose methyl groups hang over the path; the arrow is stopped with a cross; rate about 0.00001. tert-Butyl bromide has three methyls; the arrow is stopped with a cross; no reaction. Bars on a log scale to the right shrink down the list.',
  viewBox: '0 0 760 740',
  build() {
    let s = '';
    s += text(20, 20, 'the path to the back of the carbon', { cls: 'fg-tag', anchor: 'start' });
    s += text(560, 20, 'relative rate (log scale)', { cls: 'fg-tag' });
    const rows = [
      { y: 96, g: [[115, 'plain', 'H'], [208, 'wedge', 'H'], [250, 'hash', 'H']], f: 'CH₃Br', k: 'methyl', rate: 30, v: '≈30' },
      { y: 231, g: [[115, 'plain', 'CH₃'], [208, 'wedge', 'H'], [250, 'hash', 'H']], f: 'CH₃CH₂Br', k: 'primary (1°)', rate: 1, v: '1' },
      { y: 366, g: [[115, 'plain', 'CH₃'], [208, 'wedge', 'CH₃'], [250, 'hash', 'H']], f: '(CH₃)₂CHBr', k: 'secondary (2°)', rate: 0.03, v: '0.03' },
      { y: 526, g: [[115, 'plain', 'Q'], [208, 'wedge', 'H'], [250, 'hash', 'H']], f: '(CH₃)₃CCH₂Br', k: 'neopentyl (1°)', rate: 1e-5, v: '≈0.00001', neo: true, block: 118 },
      { y: 666, g: [[115, 'plain', 'CH₃'], [208, 'wedge', 'CH₃'], [250, 'hash', 'CH₃']], f: '(CH₃)₃CBr', k: 'tertiary (3°)', rate: 0, v: 'no SN2', block: 104 },
    ];
    const x0 = 450, per = 34;
    for (const r of rows) {
      s += ladderRow(r.y, r.g, { neo: r.neo, block: r.block });
      s += text(310, r.y - 4, r.f, { cls: 'fg-lbl', anchor: 'start' });
      s += text(310, r.y + 14, r.k, { cls: 'fg-tag-mut', anchor: 'start' });
      if (r.rate > 0) {
        const w = (Math.log10(r.rate) + 6) * per;
        s += `<rect class="fg-fill-hi" x="${x0}" y="${r.y - 8}" width="${r2(w)}" height="16" rx="7"></rect>`;
        s += text(x0 + w + 8, r.y + 4, r.v, { cls: 'fg-tag', anchor: 'start' });
      } else {
        s += text(x0, r.y + 4, r.v, { cls: 'fg-tag-warn', anchor: 'start' });
      }
    }
    return s;
  },
  caption: 'Orange discs are carbon groups. Read down the left column and watch the way in close up; the bars shrink with it.',
});

/* ------------------------------------------------------------------ 8 ---
   A bridgehead: the backside faces into the cage. */
FIGURES.push({
  id: 'sn2-bridgehead',
  section: 'sn2',
  anchor: 'bridgehead',
  alt: '1-Bromobicyclo[2.2.2]octane drawn as a cage lying on its side. The left bridgehead carbon, C1, carries bromine pointing out to the left. Three two-carbon bridges run from C1 to the right bridgehead, C4: one across the top, one across the bottom and one, drawn fainter, through the middle, behind. A dashed line labeled back of C1 runs from C1 to the right, into the middle of the cage. A nucleophile on the far right with an arrow aimed at C1 is stopped by a cross at the cage.',
  viewBox: '0 0 620 230',
  build() {
    let s = '';
    const y = 112;
    const c1 = P(170, y), c4 = P(370, y);
    const t1 = P(225, 50), t2 = P(315, 50), b1 = P(225, 174), b2 = P(315, 174), m1 = P(240, 132), m2 = P(300, 132);
    const sk = (a, b, cls = 'fg-bond') => bond(a, b, { rFrom: 0, rTo: 0, cls });
    s += sk(c1, m1, 'fg-bond-soft') + sk(m1, m2, 'fg-bond-soft') + sk(m2, c4, 'fg-bond-soft');
    s += sk(c1, t1) + sk(t1, t2) + sk(t2, c4) + sk(c1, b1) + sk(b1, b2) + sk(b2, c4);
    const br = P(96, y);
    s += bond(br, c1, { rFrom: 16, rTo: 0 }) + A(br, 'Br') + lp(br, 270, 22) + lp(br, 90, 22) + lp(br, 180, 22);
    s += text(c1.x - 6, y + 30, 'C1', { cls: 'fg-tag-warn', anchor: 'end' });
    s += text(c4.x + 8, y + 4, 'C4', { cls: 'fg-tag-mut', anchor: 'start' });
    s += text(170, 212, 'bridgehead C1: its back points into the cage', { cls: 'fg-tag', anchor: 'start' });
    const nu = P(560, y);
    s += A(nu, 'Nu', 'hi') + lp(nu, 180, 24) + chg(nu.x, nu.y - 30);
    s += arrow(P(nu.x - 34, y), P(412, y));
    const bx = 404;
    s += `<line class="fg-arrow" x1="${bx - 9}" y1="${y - 9}" x2="${bx + 9}" y2="${y + 9}"></line><line class="fg-arrow" x1="${bx - 9}" y1="${y + 9}" x2="${bx + 9}" y2="${y - 9}"></line>`;
    s += text(470, y - 22, 'no way through', { cls: 'fg-tag-warn' });
    s += `<line class="fg-dash-hi" x1="${c1.x + 14}" y1="${y}" x2="${c4.x - 26}" y2="${y}"></line>`;
    s += text(270, y - 12, 'back of C1', { cls: 'fg-tag' });
    return s;
  },
  caption: 'The faint bridge runs behind the other two. To reach the back of C1, a nucleophile would have to pass through the cage.',
});

/* ------------------------------------------------------------------ 9 ---
   Allylic: the transition state's p orbital lines up with the π bond. */
function pOrbital(c, len, w) {
  return lobePath(c, 90, len, w, 'fg-orb') + lobePath(c, 270, len, w, 'fg-orb-alt');
}
FIGURES.push({
  id: 'sn2-allylic',
  section: 'sn2',
  anchor: 'Allylic',
  alt: 'The SN2 transition state for an allylic bromide, in brackets with a double dagger. Three carbons in a row, drawn skeletally: C3 double-bonded to C2 on the left, and C2 single-bonded to C1, the carbon under attack, on the right. Each carbon has a p orbital standing straight up and down. At C1 the nucleophile sits above and the bromine below, each joined by a dotted partial bond along the axis of C1’s p orbital and each marked delta minus. Labels: the C=C p orbitals; the p orbital at C1 holding the two half bonds; side-by-side overlap spreads the charge.',
  viewBox: '0 0 640 300',
  build() {
    let s = '';
    const y = 150;
    const c3 = P(150, y), c2 = P(240, y), c1 = P(330, y);
    for (const c of [c3, c2, c1]) s += pOrbital(c, 58, 20);
    s += bond(c3, c2, { rFrom: 0, rTo: 0, order: 2, gap: 3.4 }) + bond(c2, c1, { rFrom: 0, rTo: 0 });
    for (const c of [c3, c2, c1]) s += `<circle class="fg-fill-mut" cx="${c.x}" cy="${c.y}" r="3"></circle>`;
    const nu = P(330, 40), br = P(330, 262);
    s += partial(nu, c1, 16, 4) + partial(c1, br, 4, 16);
    s += A(nu, 'Nu', 'hi') + A(br, 'Br');
    s += delta(nu.x + 30, nu.y + 4, 'δ−') + delta(br.x + 30, br.y + 4, 'δ−');
    s += text(c3.x, y + 78, 'C3', { cls: 'fg-tag-mut' });
    s += text(c2.x, y + 78, 'C2', { cls: 'fg-tag-mut' });
    s += text(c1.x + 26, y + 78, 'C1', { cls: 'fg-tag-mut' });
    s += brackets(96, 386, 14, 288);
    s += text(412, 70, 'C1’s p orbital holds', { cls: 'fg-tag', anchor: 'start' });
    s += text(412, 86, 'both half bonds', { cls: 'fg-tag', anchor: 'start' });
    s += text(412, 150, 'it lies parallel to the', { cls: 'fg-tag', anchor: 'start' });
    s += text(412, 166, 'p orbitals of the C=C,', { cls: 'fg-tag', anchor: 'start' });
    s += text(412, 182, 'so they overlap side by side', { cls: 'fg-tag', anchor: 'start' });
    s += text(412, 230, 'the charge spreads over', { cls: 'fg-tag-good', anchor: 'start' });
    s += text(412, 246, 'the π bond: a lower hill', { cls: 'fg-tag-good', anchor: 'start' });
    return s;
  },
  caption: 'The three carbons are seen edge-on, so the plane they lie in shows as a line, and hydrogens are left off as in a skeletal drawing. Compare the three upright orbitals: the one at C1 carries the two dotted bonds and sits side by side with the pair at C2 and C3.',
});

/* ------------------------------------------------------------------ 10 ---
   sp² carbons: vinyl and aryl halides. */
FIGURES.push({
  id: 'sn2-sp2',
  section: 'sn2',
  anchor: 'An sp² carbon is as closed to SN2',
  alt: 'Left: chlorobenzene, a benzene ring with chlorine on the right-hand ring carbon. The backside of that carbon points left, straight into the middle of the ring. An attack arrow from inside the ring is stopped with a cross. Right: chloroethene, H2C=CHCl, drawn flat with every bond at 120 degrees and all atoms labeled. Chlorine points up and to the right from its carbon; the backside approach runs in the plane of the molecule, in the plane of the molecule, between the double bond and the hydrogen, and is stopped with a cross.',
  viewBox: '0 0 700 250',
  build() {
    let s = '';
    const y = 118;
    // ---- chlorobenzene ----
    s += benzene(150, y, 52, { rot: 0 }).svg;
    const cc = P(202, y), cl = P(262, y);
    s += bond(cc, cl, { rFrom: 0, rTo: 16 }) + A(cl, 'Cl') + lp(cl, 270, 22) + lp(cl, 90, 22) + lp(cl, 0, 22);
    s += arrow(P(118, y), P(176, y));
    const bx = 184;
    s += `<line class="fg-arrow" x1="${bx - 8}" y1="${y - 8}" x2="${bx + 8}" y2="${y + 8}"></line><line class="fg-arrow" x1="${bx - 8}" y1="${y + 8}" x2="${bx + 8}" y2="${y - 8}"></line>`;
    s += text(160, 222, 'chlorobenzene: the back of the', { cls: 'fg-tag' });
    s += text(160, 238, 'C–Cl carbon is inside the ring', { cls: 'fg-tag' });
    // ---- chloroethene: every bond at 120 degrees ----
    const a = P(470, y), b = P(546, y), cl2 = armEnd(b, 60, 66);
    s += bond(a, b, { order: 2, rFrom: 16, rTo: 16 });
    s += A(a, 'C') + A(b, 'C', 'warn');
    s += grp(a, 120, 44, 'H') + grp(a, 240, 44, 'H') + grp(b, 300, 44, 'H');
    s += bond(b, cl2, { rFrom: 16, rTo: 16 }) + A(cl2, 'Cl') + lp(cl2, 300, 22) + lp(cl2, 30, 22) + lp(cl2, 210, 22);
    s += arrow(armEnd(b, 240, 92), armEnd(b, 240, 44));
    const v = armEnd(b, 240, 36);
    s += `<line class="fg-arrow" x1="${v.x - 8}" y1="${v.y - 8}" x2="${v.x + 8}" y2="${v.y + 8}"></line><line class="fg-arrow" x1="${v.x - 8}" y1="${v.y + 8}" x2="${v.x + 8}" y2="${v.y - 8}"></line>`;
    s += text(560, 222, 'chloroethene: the back of the C–Cl', { cls: 'fg-tag' });
    s += text(560, 238, 'carbon lies in the flat molecule', { cls: 'fg-tag' });
    return s;
  },
  caption: 'In both molecules the carbon holding chlorine is sp², flat, and has no open back side.',
});

export default FIGURES;
