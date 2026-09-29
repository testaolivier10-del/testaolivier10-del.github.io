/* Figures for the chirality notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   Every figure here is 340 wide, stacked, and labelled only with fg-lbl and
   fg-tag text, so the same drawing can sit in the notes and in a lesson step.

   Every tetrahedral carbon uses the frame the Molecular geometry section of
   Foundations uses for CHBrClF: two plain bonds in a V pointing up (145 and
   35 degrees), a solid wedge at 245 and a dashed wedge at 295, side by side.
   Reflecting in a vertical mirror swaps left and right; reflecting in the
   plane of the page swaps the wedge and the dash; a half turn about a
   vertical axis does both. */
import { atom, bond, wedge, hash, text, panel, P } from '../lib/ochem-figure.mjs';
import { sk, ringDouble, polyPts } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const r2 = (v) => Math.round(v * 100) / 100;
const rad = (d) => (d * Math.PI) / 180;
/* A point `len` from c at a math angle: 0 is east, 90 is up. */
const at = (c, deg, len) => P(c.x + Math.cos(rad(deg)) * len, c.y - Math.sin(rad(deg)) * len);
const tagT = (x, y, s, cls = 'fg-tag', anchor = 'middle') => text(x, y, s, { cls, size: 11, anchor });
/* Disc radius that fits a group label. */
const gr = (t) => Math.max(12, Math.round(3.3 * [...t].length + 7));
const Cr = 13;
/* A group label too long for a disc, in a rounded box. */
const pillW = (t) => Math.round(6.2 * [...t].length + 14);
const pill = (x, y, t, kind) => {
  const w = pillW(t);
  const cls = kind === 'hi' ? 'fg-atom-hi' : kind === 'warn' ? 'fg-atom-warn' : 'fg-atom';
  return `<rect class="${cls}" x="${r2(x - w / 2)}" y="${r2(y - 13)}" width="${w}" height="26" rx="13"></rect>` +
    atom(x, y, t, { kind: 'point' });
};
/* Draw one group at p: a disc, or a pill when the label is long. Returns
   the radius a bond should stop at. */
const LONG = 4;
function group(p, t, kind) {
  if ([...t].length > LONG) return { s: pill(p.x, p.y, t, kind), r: 13 };
  const r = gr(t);
  return { s: atom(p.x, p.y, t, { r, kind: kind || 'plain' }), r };
}
function groupR(t) { return [...t].length > LONG ? 15 : gr(t); }

/* A tetrahedral carbon. arms: [{ deg, t, kind: plain|wedge|hash, len, hi }].
   `hi` is 'hi' or 'warn' to tint a group. */
function tet(c, arms, o = {}) {
  let bonds = '', atoms = '';
  for (const a of arms) {
    const len = a.len ?? 48;
    const p = at(c, a.deg, len);
    const r = groupR(a.t);
    const opt = { rFrom: Cr, rTo: r };
    bonds += a.kind === 'wedge' ? wedge(c, p, { ...opt, width: 10 })
      : a.kind === 'hash' ? hash(c, p, { ...opt, width: 11, rungs: 5 })
      : bond(c, p, opt);
    atoms += group(p, a.t, a.hi).s;
  }
  return bonds + atoms + atom(c.x, c.y, o.center || 'C', { r: Cr, kind: o.centerKind || 'plain' });
}
/* The Foundations frame, filled in: [left plain, right plain, wedge, dash]. */
const frame = (c, g, hi = {}) => tet(c, [
  { deg: 145, t: g[0], hi: hi[g[0]] },
  { deg: 35, t: g[1], hi: hi[g[1]] },
  { deg: 245, t: g[2], kind: 'wedge', hi: hi[g[2]] },
  { deg: 295, t: g[3], kind: 'hash', hi: hi[g[3]] },
]);
const vline = (x, y1, y2, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${r2(x)}" y1="${r2(y1)}" x2="${r2(x)}" y2="${r2(y2)}"></line>`;
const hline = (y, x1, x2, cls = 'fg-dash-hi') =>
  `<line class="${cls}" x1="${r2(x1)}" y1="${r2(y)}" x2="${r2(x2)}" y2="${r2(y)}"></line>`;

/* A Newman projection: the front carbon is the point where three bonds
   meet, the back carbon is the circle. Each list is [{ deg, t, hi }]. */
function newman(c, front, back, o = {}) {
  const R = o.R ?? 20, L = o.L ?? 48;
  let s = `<circle class="fg-bond" cx="${r2(c.x)}" cy="${r2(c.y)}" r="${R}"></circle>`;
  let atoms = '';
  for (const g of back) {
    const p = at(c, g.deg, L);
    s += bond(at(c, g.deg, R), p, { rFrom: 0, rTo: groupR(g.t) });
    atoms += group(p, g.t, g.hi).s;
  }
  for (const g of front) {
    const p = at(c, g.deg, L);
    s += bond(c, p, { rFrom: 0, rTo: groupR(g.t) });
    atoms += group(p, g.t, g.hi).s;
  }
  return s + atoms;
}

/* ------------------------------------------------------ mirror-pair --- */
FIGURES.push({
  id: 'mirror-pair',
  section: 'chirality',
  lessons: ['chirality'],
  alt: 'Top row: CHBrClF drawn with H and F on plain bonds in a V, Br on a solid wedge and Cl on a dashed wedge, and beside it, across a vertical dashed mirror line, its mirror image, with every group moved to the opposite side. Bottom row: the original again, and the mirror image turned half a turn about a vertical axis. The turned copy has H and F in the same places as the original, but Br is now on the dashed wedge and Cl on the solid wedge, the reverse of the original.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    const g = ['H', 'F', 'Br', 'Cl'];
    const hi = { Br: 'hi', Cl: 'warn' };
    s += tagT(170, 24, 'mirror');
    s += vline(170, 34, 176);
    s += frame(P(85, 96), g, hi);
    // mirror image: left and right swap, wedge stays wedge
    s += tet(P(255, 96), [
      { deg: 35, t: 'H' }, { deg: 145, t: 'F' },
      { deg: 295, t: 'Br', kind: 'wedge', hi: 'hi' }, { deg: 245, t: 'Cl', kind: 'hash', hi: 'warn' },
    ]);
    s += tagT(85, 178, 'CHBrClF');
    s += tagT(255, 178, 'its mirror image');

    s += `<line class="fg-rule" x1="20" y1="200" x2="320" y2="200"></line>`;
    s += tagT(170, 224, 'Turn the mirror image half a turn');
    s += tagT(170, 240, 'about a vertical axis, then compare:');
    s += frame(P(85, 300), g, hi);
    // half turn about a vertical axis: left and right swap back, wedge and dash swap
    s += frame(P(255, 300), ['H', 'F', 'Cl', 'Br'], hi);
    s += tagT(85, 382, 'original');
    s += tagT(255, 382, 'mirror image, turned');
    s += tagT(170, 408, 'H and F line up. Br and Cl come out swapped.', 'fg-tag-warn');
    return s;
  },
  caption: 'Compare the bottom row group by group, starting with the solid wedge.',
});

/* --------------------------------------------------- ch2brcl-mirror --- */
FIGURES.push({
  id: 'ch2brcl-mirror',
  section: 'chirality',
  lessons: ['chirality'],
  alt: 'The same test run on CH2BrCl. Top row: Br and Cl on plain bonds in a V, one H on a solid wedge and one H on a dashed wedge, and its mirror image across a vertical dashed line. Bottom row: the original, and the mirror image turned half a turn about a vertical axis. In the turned copy Br and Cl sit where they sit in the original, and the two hydrogens fill the wedge and the dashed wedge.',
  viewBox: '0 0 340 400',
  build() {
    let s = '';
    const hi = { Br: 'hi', Cl: 'warn' };
    s += tagT(170, 24, 'mirror');
    s += vline(170, 34, 176);
    s += frame(P(85, 96), ['Br', 'Cl', 'H', 'H'], hi);
    s += tet(P(255, 96), [
      { deg: 35, t: 'Br', hi: 'hi' }, { deg: 145, t: 'Cl', hi: 'warn' },
      { deg: 295, t: 'H', kind: 'wedge' }, { deg: 245, t: 'H', kind: 'hash' },
    ]);
    s += tagT(85, 178, 'CH₂BrCl');
    s += tagT(255, 178, 'its mirror image');

    s += `<line class="fg-rule" x1="20" y1="200" x2="320" y2="200"></line>`;
    s += tagT(170, 224, 'The mirror image, turned half a turn');
    s += tagT(170, 240, 'about a vertical axis:');
    s += frame(P(85, 300), ['Br', 'Cl', 'H', 'H'], hi);
    s += frame(P(255, 300), ['Br', 'Cl', 'H', 'H'], hi);
    s += tagT(85, 382, 'original');
    s += tagT(255, 382, 'mirror image, turned');
    return s;
  },
  caption: 'Compare the bottom two drawings group by group.',
});

/* ------------------------------------------------- everyday-objects --- */
FIGURES.push({
  id: 'everyday-objects',
  section: 'chirality',
  alt: 'Top: a coffee mug seen from above, a ring with the handle sticking out to the right, and a dashed line through the middle of the mug and the handle, marking a plane that cuts it into two mirror-image halves. Bottom: two coils side by side across a vertical mirror line. In the left coil the strands in front rise to the right; this is a right-handed coil. In the right coil they rise to the left; this is the left-handed coil, its mirror image.',
  viewBox: '0 0 340 390',
  build() {
    let s = '';
    // the mug, from above
    const mc = P(150, 92);
    s += `<circle class="fg-bond" cx="${mc.x}" cy="${mc.y}" r="40"></circle>`;
    s += `<circle class="fg-bond-soft" cx="${mc.x}" cy="${mc.y}" r="33"></circle>`;
    s += `<path class="fg-bond" d="M189 80 L214 80 Q228 80 228 92 Q228 104 214 104 L189 104"></path>`;
    s += hline(mc.y, 84, 256);
    s += tagT(262, 96, 'plane', 'fg-tag', 'start');
    s += tagT(170, 164, 'a mug, seen from above');

    s += `<line class="fg-rule" x1="20" y1="192" x2="320" y2="192"></line>`;
    // two coils, mirror images
    const coil = (cx, hand) => {
      const R = 30, turns = 2.5, top = 214, h = 120;
      const N = 160;
      let front = '', back = '', out = '';
      let run = [], runFront = null;
      const flush = () => {
        if (run.length > 1) {
          const d = 'M' + run.map((p) => `${r2(p.x)} ${r2(p.y)}`).join(' L');
          out += `<path class="${runFront ? 'fg-bond' : 'fg-dash'}" d="${d}"></path>`;
        }
      };
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * turns * 2 * Math.PI;
        const x = cx + hand * R * Math.sin(t);
        const z = Math.cos(t);
        const y = top + h - (i / N) * h;
        const isFront = z >= 0;
        if (runFront === null) runFront = isFront;
        if (isFront !== runFront) { run.push(P(x, y)); flush(); run = [P(x, y)]; runFront = isFront; }
        else run.push(P(x, y));
      }
      flush();
      return front + back + out;
    };
    s += tagT(170, 212, 'mirror');
    s += vline(170, 220, 336);
    s += coil(85, 1);
    s += coil(255, -1);
    s += tagT(85, 356, 'right-handed coil');
    s += tagT(255, 356, 'left-handed coil');
    s += tagT(170, 380, 'solid strands in front, dashed behind', 'fg-tag-mut');
    return s;
  },
  caption: 'Top: follow the dashed line through the mug and its handle. Bottom: compare which way the solid front strands slope in each coil.',
});

/* --------------------------------------------------- plane-of-page --- */
FIGURES.push({
  id: 'plane-of-page',
  section: 'chirality',
  lessons: ['chirality'],
  alt: 'Two molecules, stacked, each drawn on a shaded rectangle standing for the page. Top: 2-chloropropane, with Cl and H on plain bonds in the page, one CH3 on a solid wedge and the other CH3 on a dashed wedge. The page is a plane of symmetry: it contains C, Cl and H and reflects one methyl onto the other. Bottom: 2-chlorobutane, drawn the same way but with CH3 on the solid wedge and CH2CH3 on the dashed wedge. Reflecting through the page would put a methyl where the ethyl is, so the page is not a plane of symmetry.',
  viewBox: '0 0 340 380',
  build() {
    let s = '';
    const row = (y, name, verdict, good, g, lines) => {
      s += panel(40, y + 22, 260, 124, { kind: good ? 'good' : 'warn' });
      s += tagT(170, y + 12, name + ': ' + verdict, good ? 'fg-tag-good' : 'fg-tag-warn');
      s += tet(P(170, y + 72), [
        { deg: 145, t: 'Cl', hi: 'warn' }, { deg: 35, t: 'H' },
        { deg: 240, t: g[0], kind: 'wedge', hi: 'hi', len: 52 },
        { deg: 300, t: g[1], kind: 'hash', hi: 'hi', len: good ? 52 : 58 },
      ]);
      lines.forEach((l, i) => { s += tagT(170, y + 166 + i * 16, l); });
    };
    row(8, '2-chloropropane', 'achiral', true, ['CH₃', 'CH₃'],
      ['the page is a plane of symmetry']);
    row(196, '2-chlorobutane', 'chiral', false, ['CH₃', 'CH₂CH₃'],
      ['the page is not a plane of symmetry']);
    return s;
  },
  caption: 'In each drawing, find the group that sits on the dashed wedge and compare it with the group on the solid wedge.',
});

/* ------------------------------------------------ butane-conformers --- */
FIGURES.push({
  id: 'butane-conformers',
  section: 'chirality',
  lessons: ['chirality'],
  alt: 'Butane in Newman projections, looking along the bond between C2 and C3. Top: the anti conformation, front methyl straight up, back methyl straight down, with a vertical dashed line through both methyls marking a plane of symmetry. Bottom: a gauche conformation, back methyl 60 degrees clockwise from the front one, and beside it across a mirror line the other gauche conformation, back methyl 60 degrees counterclockwise. Neither gauche drawing has a plane of symmetry, and a turn about the C2 to C3 bond carries one into the other.',
  viewBox: '0 0 340 420',
  build() {
    let s = '';
    const H = (deg) => ({ deg, t: 'H' });
    const Me = (deg) => ({ deg, t: 'CH₃', hi: 'hi' });
    s += tagT(170, 20, 'anti: a plane of symmetry', 'fg-tag-good');
    s += vline(170, 32, 172);
    s += newman(P(170, 102), [Me(90), H(210), H(330)], [Me(270), H(30), H(150)]);
    s += tagT(20, 96, 'C2 in front', 'fg-tag-mut', 'start');
    s += tagT(20, 112, 'C3 behind', 'fg-tag-mut', 'start');

    s += `<line class="fg-rule" x1="20" y1="190" x2="320" y2="190"></line>`;
    s += tagT(170, 214, 'gauche: no plane of symmetry', 'fg-tag-warn');
    s += tagT(170, 230, 'mirror', 'fg-tag');
    s += vline(170, 240, 360);
    s += newman(P(85, 298), [Me(90), H(210), H(330)], [Me(30), H(150), H(270)]);
    s += newman(P(255, 298), [Me(90), H(210), H(330)], [Me(150), H(30), H(270)]);
    s += tagT(170, 384, 'Turning the back carbon a third of a turn');
    s += tagT(170, 400, 'carries one gauche drawing into the other.');
    return s;
  },
  caption: 'Top: follow the dashed line through both methyls. Bottom: find the back-carbon methyl in each drawing.',
});

/* ----------------------------------------------- center-of-symmetry --- */
FIGURES.push({
  id: 'center-of-symmetry',
  section: 'chirality',
  alt: 'A Newman projection of one stereoisomer of CHBrCl–CHBrCl, looking along the carbon–carbon bond. Front carbon: Br straight up, Cl lower left, H lower right. Back carbon: Br straight down, Cl upper right, H upper left. Each front atom has an identical atom on the back carbon directly across the center. The center of the drawing, midway between the two carbons, is marked as the center of symmetry.',
  viewBox: '0 0 340 222',
  build() {
    let s = '';
    const c = P(170, 124);
    s += newman(c,
      [{ deg: 90, t: 'Br', hi: 'hi' }, { deg: 210, t: 'Cl', hi: 'warn' }, { deg: 330, t: 'H' }],
      [{ deg: 270, t: 'Br', hi: 'hi' }, { deg: 30, t: 'Cl', hi: 'warn' }, { deg: 150, t: 'H' }], { L: 56 });
    s += `<circle class="fg-fill-hi" cx="${c.x}" cy="${c.y}" r="4.5"></circle>`;
    s += tagT(20, 20, 'front carbon: bonds meet at the center', 'fg-tag-mut', 'start');
    s += tagT(20, 36, 'back carbon: the circle', 'fg-tag-mut', 'start');
    s += tagT(236, 128, '← center of', 'fg-tag', 'start');
    s += tagT(250, 144, 'symmetry', 'fg-tag', 'start');
    return s;
  },
  caption: 'Pick any atom, go straight through the center dot, and the same distance out you meet its twin.',
});

/* ------------------------------------------------------ allene-pair --- */
function allene(cx, y, left, right, o = {}) {
  const C1 = P(cx - 50, y), C2 = P(cx, y), C3 = P(cx + 50, y);
  let s = '';
  if (o.orbitals) {
    const disc = (c) => `<circle class="fg-orb" cx="${r2(c.x)}" cy="${r2(c.y)}" r="17"></circle>`;
    const lobes = (c) =>
      `<ellipse class="fg-orb" cx="${r2(c.x)}" cy="${r2(c.y - 24)}" rx="11" ry="22"></ellipse>` +
      `<ellipse class="fg-orb-alt" cx="${r2(c.x)}" cy="${r2(c.y + 24)}" rx="11" ry="22"></ellipse>`;
    s += disc(C1) + disc(C2) + lobes(C2) + lobes(C3);
  } else {
    s += bond(C1, C2, { order: 2, rFrom: Cr, rTo: Cr, gap: 3.5 });
    s += bond(C2, C3, { order: 2, rFrom: Cr, rTo: Cr, gap: 3.5 });
  }
  s += tet(C1, [{ deg: 150, t: left[0], kind: left[2], len: 46 }, { deg: 210, t: left[1], kind: left[3], len: 46 }], { center: 'C' });
  s += tet(C3, [{ deg: 30, t: right[0], kind: right[2], len: 46 }, { deg: 330, t: right[1], kind: right[3], len: 46 }], { center: 'C' });
  s += atom(C2.x, C2.y, 'C', { r: Cr });
  return s;
}
FIGURES.push({
  id: 'allene-pair',
  section: 'chirality',
  lessons: ['chirality'],
  alt: 'Penta-2,3-diene, CH3–CH=C=CH–CH3, with its three chain carbons in a straight line. Top: the left carbon carries CH3 and H in the plane of the page; the right carbon carries CH3 on a solid wedge and H on a dashed wedge, in a plane at right angles to the page. Second: the mirror image, the same drawing with the wedge and the dashed wedge swapped on the right carbon. Third: the mirror image turned half a turn about the C=C=C axis; its right end now matches the first drawing, but its left end has H up and CH3 down, the reverse of the first. Bottom: the orbitals behind the twist. The first pi bond is made from p orbitals pointing out of the page on the left and middle carbons; the second is made from p orbitals lying in the page, pointing up and down, on the middle and right carbons.',
  viewBox: '0 0 340 614',
  build() {
    let s = '';
    s += tagT(170, 20, 'penta-2,3-diene: one form');
    s += allene(170, 76, ['CH₃', 'H'], ['CH₃', 'H', 'wedge', 'hash']);
    s += tagT(170, 146, 'its mirror image: wedge and dash swapped');
    s += allene(170, 200, ['CH₃', 'H'], ['CH₃', 'H', 'hash', 'wedge']);
    s += tagT(170, 270, 'the mirror image, turned half a turn');
    s += tagT(170, 286, 'about the C=C=C axis');
    s += allene(170, 336, ['H', 'CH₃'], ['CH₃', 'H', 'wedge', 'hash']);
    s += tagT(170, 398, 'Right end lines up. Left end: CH₃ and H swapped.', 'fg-tag-warn');
    s += `<line class="fg-rule" x1="20" y1="418" x2="320" y2="418"></line>`;
    s += tagT(170, 440, 'why the two ends are twisted');
    s += allene(170, 516, ['CH₃', 'H'], ['CH₃', 'H', 'wedge', 'hash'], { orbitals: true });
    s += `<line class="fg-arrow-mut" x1="114" y1="498" x2="104" y2="480"></line>`;
    s += tagT(20, 458, 'p orbital pointing', 'fg-tag-mut', 'start');
    s += tagT(20, 473, 'at you (seen end-on)', 'fg-tag-mut', 'start');
    s += tagT(170, 584, 'left π bond: p orbitals point out of the page');
    s += tagT(170, 600, 'right π bond: p orbitals lie in the page');
    return s;
  },
  caption: 'Top: compare the third drawing with the first, end by end. Bottom: the middle carbon uses two p orbitals at right angles, one for each π bond.',
});

/* --------------------------------------------------- allene-achiral --- */
FIGURES.push({
  id: 'allene-achiral',
  section: 'chirality',
  alt: 'Buta-1,2-diene, CH2=C=CH–CH3, on a shaded rectangle standing for the page. The left carbon carries two hydrogens, one on a solid wedge and one on a dashed wedge. The right carbon carries CH3 and H in the page. The page holds all three chain carbons plus the CH3 and H, and reflects one hydrogen of the CH2 end onto the other, so it is a plane of symmetry.',
  viewBox: '0 0 340 152',
  build() {
    let s = '';
    s += panel(30, 26, 280, 118, { kind: 'good' });
    s += tagT(170, 16, 'buta-1,2-diene: achiral', 'fg-tag-good');
    s += tagT(302, 138, 'the page: a plane of symmetry', 'fg-tag-mut', 'end');
    s += allene(170, 80, ['H', 'H', 'wedge', 'hash'], ['CH₃', 'H']);
    return s;
  },
  caption: 'Compare the two hydrogens on the left-hand carbon: one on the solid wedge, one on the dashed wedge.',
});

/* ------------------------------------------------------ biaryl-pair --- */
function biaryl(y, front, back) {
  let s = '';
  // ring A in the page, joined at its right-hand vertex
  const A = polyPts(100, y, 6, 28, 0);
  const cA = P(100, y);
  for (let i = 0; i < 6; i++) {
    const a = A[i], b = A[(i + 1) % 6];
    s += i % 2 === 1 ? ringDouble(a, b, cA, { inset: 6 }) : sk(a, b);
  }
  // ring B at right angles to the page, seen in perspective
  const cB = P(216, y);
  const B = [0, 60, 120, 180, 240, 300].map((d) => P(cB.x + 28 * Math.cos(rad(d)), cB.y - 10 * Math.sin(rad(d))));
  for (let i = 0; i < 6; i++) {
    const a = B[i], b = B[(i + 1) % 6];
    s += i % 2 === 0 ? ringDouble(a, b, cB, { inset: 5, gap: 3 }) : sk(a, b);
  }
  // the joint
  s += sk(A[0], B[3], true);
  // ring A's two neighbors of the joint, in the page
  const pN = at(A[1], 60, 34), pC = at(A[5], 300, 34);
  s += bond(A[1], pN, { rFrom: 0, rTo: 17 }) + atom(pN.x, pN.y, 'NO₂', { r: 17 });
  s += bond(A[5], pC, { rFrom: 0, rTo: 15 }) + pill(pC.x, pC.y, 'CO₂H');
  // ring B's two neighbors of the joint: one toward you, one away
  const pF = P(B[4].x - 6, y + 46), pB = P(B[2].x - 6, y - 46);
  const draw = (t, p, kind) => {
    const r = t === 'NO₂' ? 17 : 15;
    const ink = kind === 'wedge' ? wedge(B[kind === 'wedge' ? 4 : 2], p, { rFrom: 0, rTo: r, width: 10 })
      : hash(B[2], p, { rFrom: 0, rTo: r, width: 11, rungs: 5 });
    return ink + (t === 'NO₂' ? atom(p.x, p.y, t, { r: 17, kind: 'hi' }) : pill(p.x, p.y, t, 'hi'));
  };
  s += draw(front, pF, 'wedge');
  s += draw(back, pB, 'hash');
  return s;
}
FIGURES.push({
  id: 'biaryl-pair',
  section: 'chirality',
  lessons: ['chirality'],
  alt: 'The biaryl 6,6′-dinitro[1,1′-biphenyl]-2,2′-dicarboxylic acid drawn twice, stacked. Two benzene rings are joined by a single bond. The left ring lies in the page, with NO2 and CO2H on the two carbons next to the joint. The right ring is drawn in perspective, at right angles to the page; its two groups next to the joint point one toward you on a solid wedge and one away on a dashed wedge. Top: CO2H on the wedge and NO2 on the dashed wedge. Bottom, the mirror image: NO2 on the wedge and CO2H on the dashed wedge.',
  viewBox: '0 0 340 386',
  build() {
    let s = '';
    s += tagT(170, 20, 'one form');
    s += biaryl(100, 'CO₂H', 'NO₂');
    s += tagT(100, 182, 'ring in the page', 'fg-tag-mut');
    s += tagT(270, 182, 'ring at right', 'fg-tag-mut');
    s += tagT(270, 196, 'angles to it', 'fg-tag-mut');
    s += `<line class="fg-rule" x1="20" y1="208" x2="320" y2="208"></line>`;
    s += tagT(170, 228, 'its mirror image: wedge and dash swapped');
    s += biaryl(304, 'NO₂', 'CO₂H');
    return s;
  },
  caption: 'Find the four groups beside the highlighted joint. Then compare the right-hand ring in the two drawings: which group sits on the solid wedge, and which on the dashed wedge.',
});

/* ---------------------------------------------------- binol-joint --- */
FIGURES.push({
  id: 'binol-joint',
  section: 'chirality',
  alt: 'One half of BINOL: a naphthalene, two benzene rings sharing an edge, drawn flat. A highlighted bond leaves the top carbon of the right ring and leads to the second naphthalene, which is twisted out of the page and not drawn. On one side of that bond, the top carbon of the left ring carries a hydrogen, labeled peri H. On the other side, the next carbon of the right ring carries an OH.',
  viewBox: '0 0 340 180',
  build() {
    let s = '';
    const L = polyPts(144, 130, 6, 30, 90), R = polyPts(196, 130, 6, 30, 90);
    // right ring: 0 top (the joint carbon), 1 upper-left (shared), 2 lower-left (shared), 3 bottom, 4 lower-right, 5 upper-right
    const cR = P(196, 130), cL = P(144, 130);
    s += ringDouble(R[0], R[5], cR, { inset: 6 });
    s += sk(R[5], R[4]);
    s += ringDouble(R[4], R[3], cR, { inset: 6 });
    s += sk(R[3], R[2]);
    s += ringDouble(R[2], R[1], cR, { inset: 6 });
    s += sk(R[1], R[0]);
    // left ring: 0 top (peri carbon), 1 upper-left, 2 lower-left, 3 bottom, 4 = R[2], 5 = R[1]
    s += sk(L[5], L[0]);
    s += ringDouble(L[0], L[1], cL, { inset: 6 });
    s += sk(L[1], L[2]);
    s += ringDouble(L[2], L[3], cL, { inset: 6 });
    s += sk(L[3], L[4]);
    // the joint
    const stub = P(R[0].x, R[0].y - 58);
    s += sk(R[0], stub, true);
    s += tagT(R[0].x, stub.y - 22, 'to the second naphthalene,');
    s += tagT(R[0].x, stub.y - 7, 'twisted out of the page');
    // peri H and the OH
    const pH = at(L[0], 90, 30);
    s += bond(L[0], pH, { rFrom: 0, rTo: 12 }) + atom(pH.x, pH.y, 'H', { r: 12, kind: 'warn' });
    s += `<text class="fg-tag-warn" x="${r2(pH.x - 18)}" y="${r2(pH.y + 4)}" text-anchor="end" font-size="11"><tspan font-style="italic">peri</tspan> H</text>`;
    const pO = at(R[5], 30, 32);
    s += bond(R[5], pO, { rFrom: 0, rTo: 15 }) + atom(pO.x, pO.y, 'OH', { r: 15, kind: 'hi' });
    return s;
  },
  caption: 'Find the highlighted bond, then the two groups on either side of it.',
});

export default FIGURES;
