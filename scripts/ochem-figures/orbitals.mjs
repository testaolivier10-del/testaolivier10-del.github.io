/* Figures for the orbitals notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there.

   This topic sits in Foundations, before skeletal structures, so every
   drawing labels its nucleus or atom. Orbitals use the site's orbital style:
   the two phases of a wave are fg-orb and fg-orb-alt, and a node (where the
   electron is never found) is a dashed fg-orb-node line. Figures shown in the
   lesson are 340 wide or less and use only fg-lbl and fg-tag text; the
   wide notes-only figures (p-three-axes, periodic-blocks, config-boxes) have
   stacked lesson copies with the id prefix l-. */
import { arrow, text, tag, label, panel, bar, P } from '../lib/ochem-figure.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ helpers --- */
const rad = (d) => (d * Math.PI) / 180;
/* Screen direction for a math angle: 0 is east, 90 is up. */
const dir = (deg) => ({ x: Math.cos(rad(deg)), y: -Math.sin(rad(deg)) });
const r2 = (v) => Math.round(v * 100) / 100;
const pt = (p) => `${r2(p.x)} ${r2(p.y)}`;
const add = (c, d, k) => P(c.x + d.x * k, c.y + d.y * k);

/* One p-orbital lobe: a teardrop pinched to a point at the nucleus `c`,
   reaching `len` along screen angle `deg`, about 2 × 0.75 × w across. */
function lobe(c, deg, len, w, cls, extra = '') {
  const d = dir(deg);
  const p = { x: -d.y, y: d.x };
  const tip = add(c, d, len);
  const a1 = P(c.x + d.x * len * 0.32 + p.x * w * 0.62, c.y + d.y * len * 0.32 + p.y * w * 0.62);
  const a2 = add(tip, p, w * 0.95);
  const b2 = add(tip, p, -w * 0.95);
  const b1 = P(c.x + d.x * len * 0.32 - p.x * w * 0.62, c.y + d.y * len * 0.32 - p.y * w * 0.62);
  return `<path class="${cls}" d="M${pt(c)} C${pt(a1)} ${pt(a2)} ${pt(tip)} C${pt(b2)} ${pt(b1)} ${pt(c)} Z"${extra}></path>`;
}
/* A whole p orbital: the + lobe along `deg`, the − lobe opposite. */
function pOrb(c, deg, len, w, opts = {}) {
  return lobe(c, deg + 180, opts.backLen ?? len, w, 'fg-orb-alt') + lobe(c, deg, len, w, 'fg-orb');
}
const nucleus = (c, r = 3.2) => `<circle class="fg-fill-mut" cx="${r2(c.x)}" cy="${r2(c.y)}" r="${r}"></circle>`;
const circ = (c, r, cls, extra = '') => `<circle class="${cls}" cx="${r2(c.x)}" cy="${r2(c.y)}" r="${r2(r)}"${extra}></circle>`;
const dashLine = (a, b, cls = 'fg-dash') => `<line class="${cls}" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;
/* A thin pointer line from a label to the thing it names. */
const lead = (a, b) => `<line class="fg-bond-soft" x1="${r2(a.x)}" y1="${r2(a.y)}" x2="${r2(b.x)}" y2="${r2(b.y)}"></line>`;

/* One orbital box with 0, 1 or 2 electrons (up arrow, then down arrow). */
function box(x, y, e, opts = {}) {
  const w = opts.w ?? 28, h = opts.h ?? 24;
  let s = `<rect class="${opts.hi ? 'fg-panel-hi' : 'fg-panel'}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="5"></rect>`;
  const up = (xx) => arrow(P(xx, y + 8), P(xx, y - 8), { size: 5 });
  const down = (xx) => arrow(P(xx, y - 8), P(xx, y + 8), { size: 5 });
  if (e === 1) s += up(x);
  if (e === 2) s += up(x - 5) + down(x + 5);
  return s;
}

/* The oblique axes used for the three p orbitals: x to the right, y up the
   page, z toward the reader, drawn down and to the left and shortened. */
const ZDEG = 222, ZK = 0.62;

/* ============================================== 1. hydrogen's 1s cloud === */
FIGURES.push({
  id: 'h-1s-cloud',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 236',
  alt: 'Two panels about hydrogen’s one electron. Left: a nucleus labeled H nucleus, one proton, surrounded by hundreds of dots, each a place the electron was found in one snapshot. The dots are densest near the nucleus and thin out with distance. Right: the same nucleus inside a shaded circle labeled 1s orbital, the boundary that holds the electron 90 percent of the time.',
  build() {
    let s = '';
    s += panel(6, 6, 160, 224) + panel(174, 6, 160, 224);
    s += tag(86, 26, 'many snapshots');
    s += tag(254, 26, 'the 1s orbital');
    // Dots: positions drawn from the 1s distribution (radius ~ r² e^-2r in
    // units of the Bohr radius), projected onto the page. Seeded, so the
    // figure is the same every build.
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const scale = 26;            // px per Bohr radius; 90% boundary at 2.66 → ~69 px
    const L = P(86, 118), R = P(254, 118);
    for (let i = 0; i < 420; i++) {
      const r = -(Math.log(rnd()) + Math.log(rnd()) + Math.log(rnd())) / 2;
      const ct = 2 * rnd() - 1, ph = 2 * Math.PI * rnd();
      const st = Math.sqrt(1 - ct * ct);
      const x = L.x + r * st * Math.cos(ph) * scale, y = L.y + r * st * Math.sin(ph) * scale;
      if (Math.hypot(x - L.x, y - L.y) > 74) continue;
      s += `<circle class="fg-fill-hi" cx="${r2(x)}" cy="${r2(y)}" r="1.2" opacity="0.7"></circle>`;
    }
    s += circ(L, 10, 'fg-atom');
    s += label(L.x, L.y + 5, 'H', { size: 13 });
    s += circ(R, 69, 'fg-orb');
    s += circ(R, 10, 'fg-atom');
    s += label(R.x, R.y + 5, 'H', { size: 13 });
    s += tag(86, 212, 'one dot per sighting');
    s += tag(254, 204, 'electron inside this');
    s += tag(254, 218, 'boundary 90% of the time');
    return s;
  },
  caption: 'Hydrogen’s single electron. The H at the center of each panel is the nucleus, one proton.',
});

/* ============================================ 2. s orbitals: 1s and 2s === */
FIGURES.push({
  id: 's-orbitals',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 200',
  alt: 'Two s orbitals drawn as circles, each with the nucleus at its center. Left: 1s, a small sphere. Right: 2s, a larger sphere with a dashed circle inside it labeled node; inside the node is a small inner region in the other shade, and outside it the main region.',
  build() {
    let s = '';
    const a = P(72, 96), b = P(236, 96);
    s += circ(a, 34, 'fg-orb');
    s += circ(b, 70, 'fg-orb');
    s += circ(b, 19, 'fg-orb-alt');
    s += circ(b, 25, 'fg-orb-node');
    s += nucleus(a) + nucleus(b);
    s += label(a.x, 30, '1s', { size: 13 });
    s += label(b.x, 16, '2s', { size: 13 });
    s += tag(a.x, 150, 'a sphere');
    s += tag(a.x, 164, 'around the nucleus');
    s += tag(b.x, b.y - 32, 'node');
    s += tag(b.x, 186, 'bigger sphere, node inside');
    return s;
  },
  caption: 'The dot at each center is the nucleus. The dashed circle inside 2s is its node. The region inside the node has the other shade, for a reason explained later, under phase.',
});

/* ===================================== 3. one p orbital, labeled parts === */
FIGURES.push({
  id: 'p-orbital',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 210',
  alt: 'One 2p orbital lying along the x axis: two teardrop lobes that meet at the nucleus, one to the right in the green shade and one to the left in the lilac shade. A dashed flat plane seen at a slant passes through the nucleus at right angles to the axis, labeled nodal plane, where the electron is never found.',
  build() {
    let s = '';
    const c = P(170, 104);
    s += dashLine(P(18, c.y), P(322, c.y));
    s += label(328, c.y + 4, 'x', { size: 13 });
    // The nodal plane, seen at a slant: a thin parallelogram through the nucleus.
    s += `<path class="fg-orb-node" d="M${c.x - 16} ${c.y - 70} L${c.x + 16} ${c.y - 50} L${c.x + 16} ${c.y + 70} L${c.x - 16} ${c.y + 50} Z"></path>`;
    s += pOrb(c, 0, 118, 44);
    s += nucleus(c);
    s += tag(250, 58, 'lobe');
    s += tag(90, 58, 'lobe');
    s += lead(P(c.x + 14, c.y - 46), P(c.x + 40, c.y - 82));
    s += tag(c.x + 42, c.y - 86, 'nodal plane', { anchor: 'start' });
    s += lead(P(c.x - 4, c.y + 5), P(c.x - 50, c.y + 62));
    s += tag(c.x - 52, c.y + 76, 'nucleus', { anchor: 'end' });
    s += tag(170, 200, 'one orbital, two lobes');
    return s;
  },
  caption: 'One 2p orbital, lying along x. The dashed sheet is its nodal plane, seen at a slant.',
});

/* ================================== 4. the three p orbitals (notes, wide) === */
function pAxes(c, show, opts = {}) {
  const L = opts.L ?? 78, W = opts.W ?? 24, A = opts.A ?? 104;
  let s = '';
  const zd = dir(ZDEG);
  s += dashLine(add(c, dir(0), -A), add(c, dir(0), A));
  s += dashLine(add(c, dir(90), -A), add(c, dir(90), A));
  s += dashLine(add(c, zd, -A * ZK), add(c, zd, A * ZK));
  s += label(c.x + A + 8, c.y + 4, 'x', { size: 13 });
  s += label(c.x, c.y - A - 6, 'y', { size: 13 });
  const ze = add(c, zd, A * ZK + 12);
  s += label(ze.x, ze.y + 6, 'z', { size: 13 });
  // Back half of pz first (it points away from the reader), then x and y,
  // then the front half of pz on top.
  if (show.z) s += lobe(c, ZDEG + 180, L * ZK, W, 'fg-orb-alt');
  if (show.x) s += pOrb(c, 0, L, W);
  if (show.y) s += pOrb(c, 90, L, W);
  if (show.z) s += lobe(c, ZDEG, L * ZK, W, 'fg-orb');
  s += nucleus(c);
  return s;
}

FIGURES.push({
  id: 'p-three-axes',
  section: 'orbitals',
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 760 270',
  alt: 'Three panels built up one at a time on the same x, y and z axes, with z drawn coming toward the reader down and to the left. Panel 1: the 2px orbital, two lobes along x. Panel 2: 2py added, two lobes along y, at 90 degrees to 2px. Panel 3: 2pz added, two shorter-looking lobes along z, toward and away from the reader, at 90 degrees to both.',
  build() {
    let s = '';
    const titles = ['2pₓ alone', 'add 2p_y', 'add 2p_z'];
    const shows = [{ x: 1 }, { x: 1, y: 1 }, { x: 1, y: 1, z: 1 }];
    [8, 260, 512].forEach((x0, i) => {
      s += panel(x0, 8, 240, 254);
      s += tag(x0 + 120, 28, ['1. 2px alone', '2. add 2py', '3. add 2pz'][i]);
      const c = P(x0 + 120, 146);
      s += pAxes(c, shows[i], { L: 74, W: 22, A: 96 });
      void titles;
    });
    // Labels on the lobes of the last panel.
    s += tag(726, 132, '2px');
    s += tag(662, 64, '2py');
    s += tag(560, 226, '2pz');
    s += tag(420, 236, '90° to 2px');
    return s;
  },
  caption: 'Same axes in every panel. z comes out of the page toward you, so its lobes look shorter.',
});

FIGURES.push({
  id: 'l-p-three-axes',
  lessons: ['orbitals'],
  viewBox: '0 0 340 290',
  alt: 'The three 2p orbitals together on x, y and z axes, z drawn coming toward the reader down and to the left. 2px lies along x, 2py along y and 2pz along z, each at 90 degrees to the other two, all meeting at the nucleus.',
  build() {
    let s = '';
    const c = P(170, 150);
    s += pAxes(c, { x: 1, y: 1, z: 1 }, { L: 92, W: 26, A: 112 });
    s += tag(270, 128, '2px');
    s += tag(196, 40, '2py');
    s += tag(96, 232, '2pz');
    s += tag(170, 284, 'each at 90° to the other two');
    return s;
  },
  caption: 'z points out of the page toward you, so its lobes look shorter.',
});

/* ============================== 5. the four shapes, s p d f (2 × 2 grid) === */
FIGURES.push({
  id: 'orbital-shapes',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 360',
  alt: 'Four panels. s: a sphere, one per shell, from n = 1. p: two lobes, three per shell, from n = 2. d: a four-lobed cloverleaf with the lobes alternating in shade, five per shell, from n = 3. f: a six-lobed flower with alternating shades, seven per shell, from n = 4. A dot marks the nucleus in each.',
  build() {
    let s = '';
    const cells = [
      { x: 6, y: 6, name: 's', a: '1 per shell', b: 'from n = 1' },
      { x: 174, y: 6, name: 'p', a: '3 per shell', b: 'from n = 2' },
      { x: 6, y: 184, name: 'd', a: '5 per shell', b: 'from n = 3' },
      { x: 174, y: 184, name: 'f', a: '7 per shell', b: 'from n = 4' },
    ];
    for (const cl of cells) {
      s += panel(cl.x, cl.y, 160, 170);
      s += label(cl.x + 80, cl.y + 22, cl.name, { size: 13 });
      s += tag(cl.x + 80, cl.y + 146, cl.a);
      s += tag(cl.x + 80, cl.y + 160, cl.b);
      const c = P(cl.x + 80, cl.y + 82);
      if (cl.name === 's') s += circ(c, 44, 'fg-orb');
      if (cl.name === 'p') s += pOrb(c, 90, 52, 22);
      if (cl.name === 'd') {
        [45, 225].forEach((d) => { s += lobe(c, d, 50, 20, 'fg-orb'); });
        [135, 315].forEach((d) => { s += lobe(c, d, 50, 20, 'fg-orb-alt'); });
      }
      if (cl.name === 'f') {
        [90, 210, 330].forEach((d) => { s += lobe(c, d, 50, 15, 'fg-orb'); });
        [30, 150, 270].forEach((d) => { s += lobe(c, d, 50, 15, 'fg-orb-alt'); });
      }
      s += nucleus(c, 2.8);
    }
    return s;
  },
  caption: 'One example of each type. The dot is the nucleus.',
});

/* ========================================= 6. phase, and what overlap does === */
FIGURES.push({
  id: 'phase-overlap',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 380',
  alt: 'Three rows. Row 1: one p orbital with a plus sign in one lobe and a minus sign in the other, and a dashed node between them; the signs are phase, not charge. Row 2: two hydrogen atoms, each labeled H, whose 1s spheres are both in the same shade and overlap; the overlap region between them is where the shared pair sits, a bond. Row 3: the same two hydrogens with spheres in opposite shades; the waves cancel and a dashed node runs between the two nuclei, so there is no bond.',
  build() {
    let s = '';
    // Row 1: signs on a p orbital.
    s += panel(6, 6, 328, 112);
    const c = P(110, 62);
    s += pOrb(c, 0, 70, 30);
    s += dashLine(P(c.x, c.y - 40), P(c.x, c.y + 40), 'fg-orb-node');
    s += nucleus(c);
    s += label(c.x + 42, c.y + 5, '+', { size: 13 });
    s += label(c.x - 42, c.y + 5, '−', { size: 13 });
    s += tag(256, 56, 'signs of the wave,');
    s += tag(256, 72, 'not charges');
    // Row 2: same phase, overlap builds up.
    s += panel(6, 128, 328, 118, { kind: 'good' });
    const h1 = P(88, 180), h2 = P(148, 180);
    s += circ(h1, 40, 'fg-orb') + circ(h2, 40, 'fg-orb');
    s += label(h1.x, h1.y + 5, 'H', { size: 13 }) + label(h2.x, h2.y + 5, 'H', { size: 13 });
    s += tag(250, 170, 'same phase:');
    s += tag(250, 186, 'waves add up');
    s += tag(250, 202, '→ a bond', { cls: 'fg-tag-good' });
    s += tag(118, 238, 'shared pair between the nuclei');
    // Row 3: opposite phase, cancel, node.
    s += panel(6, 256, 328, 118, { kind: 'warn' });
    const h3 = P(88, 308), h4 = P(148, 308);
    s += circ(h3, 40, 'fg-orb') + circ(h4, 40, 'fg-orb-alt');
    s += dashLine(P(118, 262), P(118, 354), 'fg-orb-node');
    s += label(h3.x, h3.y + 5, 'H', { size: 13 }) + label(h4.x, h4.y + 5, 'H', { size: 13 });
    s += tag(250, 298, 'opposite phase:');
    s += tag(250, 314, 'waves cancel');
    s += tag(250, 330, '→ no bond', { cls: 'fg-tag-warn' });
    s += tag(118, 368, 'node between the nuclei');
    return s;
  },
  caption: 'Row 1 shows what the two shades mean. Rows 2 and 3 bring the same two hydrogen atoms together with their 1s orbitals in matching and in opposite phase.',
});

/* ============================ 7. penetration: radial probability curves === */
FIGURES.push({
  id: 'penetration',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 250',
  alt: 'A graph of how likely an electron is to be found at each distance from the nucleus. A shaded hump close to the nucleus is the 1s core electrons. The 2s curve has a small inner bump inside that core region, then dips to zero at its node and rises to a large outer hump. The 2p curve starts at zero at the nucleus and has only one hump, farther out, with nothing inside the core.',
  build() {
    let s = '';
    const x0 = 34, yb = 196, xr = 326, rMax = 12;
    const X = (r) => x0 + (r / rMax) * (xr - x0);
    // Hydrogen-like radial probabilities (same nuclear charge), in Bohr radii.
    const P1 = (r) => 4 * r * r * Math.exp(-2 * r);
    const P2s = (r) => (r * r * (2 - r) * (2 - r) * Math.exp(-r)) / 8;
    const P2p = (r) => (Math.pow(r, 4) * Math.exp(-r)) / 24;
    const k1 = 70 / P1(1);          // core hump drawn 70 px tall
    const k2 = 110 / P2p(4);        // 2s and 2p share one scale
    const path = (f, k) => {
      let d = `M${x0} ${yb}`;
      for (let i = 1; i <= 240; i++) { const r = (i / 240) * rMax; d += ` L${r2(X(r))} ${r2(yb - f(r) * k)}`; }
      return d;
    };
    s += `<path class="fg-fill-mut" d="${path(P1, k1)} L${xr} ${yb} Z" opacity="0.22"></path>`;
    s += `<path class="fg-orb-alt" d="${path(P2p, k2)} L${xr} ${yb} Z" fill-opacity="0.12"></path>`;
    s += `<path class="fg-orb" d="${path(P2s, k2)} L${xr} ${yb} Z" fill-opacity="0.12"></path>`;
    s += arrow(P(x0, yb), P(x0, 40), { size: 6 });
    s += arrow(P(x0, yb), P(xr + 6, yb), { size: 6 });
    s += tag(x0 + 4, 32, 'chance of finding the electron', { anchor: 'start' });
    s += tag(xr, yb + 20, 'distance from nucleus →', { anchor: 'end' });
    s += tag(x0, yb + 20, 'nucleus', { anchor: 'start' });
    // Labels.
    s += tag(X(1), yb - 78, '1s core');
    const bump = P(X(0.76), yb - P2s(0.76) * k2);
    s += lead(P(bump.x, bump.y - 2), P(X(2.4), 140));
    s += tag(X(2.5), 140, '2s bump inside the core', { anchor: 'start' });
    s += tag(X(7.6), yb - P2s(7.5) * k2 - 10, '2s', { anchor: 'start' });
    s += tag(X(3.2) - 4, yb - P2p(3.2) * k2 - 6, '2p', { anchor: 'end' });
    return s;
  },
  caption: 'Hydrogen-like curves, 2s and 2p on one scale. Only 2s has a bump inside the core.',
});

/* ============================================ 8. energy ladder (fill order) === */
FIGURES.push({
  id: 'orbital-energy-ladder',
  section: 'orbitals',
  lessons: ['orbitals'],
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 340 330',
  alt: 'An energy ladder of subshells from 1s at the bottom to 3d at the top, each drawn as its boxes: one box for each s, three for each p, five for 3d. The 4s rung sits below the 3d rung. The 2s and 2p rungs are bracketed together as n = 2: four orbitals, eight electrons.',
  build() {
    let s = '';
    const rungs = [
      { y: 300, name: '1s', boxes: 1 },
      { y: 254, name: '2s', boxes: 1 },
      { y: 216, name: '2p', boxes: 3 },
      { y: 166, name: '3s', boxes: 1 },
      { y: 130, name: '3p', boxes: 3 },
      { y: 86, name: '4s', boxes: 1, hi: true },
      { y: 44, name: '3d', boxes: 5 },
    ];
    s += arrow(P(16, 318), P(16, 24), { size: 6 });
    s += `<text class="fg-tag" x="10" y="170" text-anchor="middle" transform="rotate(-90 10 170)">energy</text>`;
    // n = 2 bracket behind its rungs.
    s += bar(54, 200, 104, 66, { kind: 'good', opacity: 0.16, r: 8 });
    for (const r of rungs) {
      const w = 22, gap = 4, bx = 72;
      for (let i = 0; i < r.boxes; i++) {
        s += `<rect class="${r.hi ? 'fg-panel-hi' : 'fg-panel'}" x="${bx + i * (w + gap)}" y="${r.y - 11}" width="${w}" height="22" rx="4"></rect>`;
      }
      s += label(62, r.y + 5, r.name, { size: 13, anchor: 'end' });
      s += tag(bx + r.boxes * (w + gap) + 6, r.y + 4, `holds ${r.boxes * 2}`, { anchor: 'start', cls: 'fg-tag-mut' });
    }
    s += tag(170, 250, 'n = 2: 4 orbitals,', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(170, 266, '8 electrons', { anchor: 'start', cls: 'fg-tag-good' });
    s += tag(164, 82, '4s sits below 3d,', { anchor: 'start' });
    s += tag(164, 98, 'so it fills first', { anchor: 'start' });
    return s;
  },
  caption: 'Fill from the bottom rung up. Each box is one orbital and holds 2.',
});

/* ============================== 9. C, N, O, F box diagrams (worked example) === */
function atomBoxes(x0, y0, el, n, fill, cfgText, sub1, sub2) {
  let s = panel(x0, y0, 176, 196);
  s += label(x0 + 88, y0 + 22, `${el}, ${n} electrons`, { size: 13 });
  s += label(x0 + 26, y0 + 58, '2p', { size: 12 });
  s += label(x0 + 26, y0 + 96, '2s', { size: 12 });
  s += label(x0 + 26, y0 + 130, '1s', { size: 12 });
  [0, 1, 2].forEach((k) => { s += box(x0 + 66 + k * 34, y0 + 54, fill[k]); });
  s += box(x0 + 66, y0 + 92, 2);
  s += box(x0 + 66, y0 + 126, 2);
  s += label(x0 + 88, y0 + 158, cfgText, { size: 12 });
  s += tag(x0 + 88, y0 + 176, sub1);
  s += tag(x0 + 88, y0 + 190, sub2, { cls: 'fg-tag-mut' });
  return s;
}
const ATOMS = [
  ['C', 6, [1, 1, 0], '1s² 2s² 2p²', '2 unpaired', 'paired: 2s'],
  ['N', 7, [1, 1, 1], '1s² 2s² 2p³', '3 unpaired', 'paired: 2s'],
  ['O', 8, [2, 1, 1], '1s² 2s² 2p⁴', '2 unpaired', 'paired: 2s, one 2p'],
  ['F', 9, [2, 2, 1], '1s² 2s² 2p⁵', '1 unpaired', 'paired: 2s, two 2p'],
];

FIGURES.push({
  id: 'config-boxes',
  section: 'orbitals',
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 740 204',
  alt: 'Orbital box diagrams for carbon, nitrogen, oxygen and fluorine, side by side, with 1s at the bottom, then 2s, then three 2p boxes. In all four, 1s and 2s each hold a pair of opposite arrows. Carbon: one up arrow in each of two 2p boxes, the third empty. Nitrogen: one up arrow in each of the three 2p boxes. Oxygen: one 2p box paired, two singles. Fluorine: two 2p boxes paired, one single. Under each: its configuration and its count of unpaired electrons and paired boxes.',
  build() {
    let s = '';
    ATOMS.forEach((a, i) => { s += atomBoxes(4 + i * 184, 4, ...a); });
    return s;
  },
  caption: 'Compare the 2p rows. Single arrows are the unpaired electrons. For N, O and F, the paired boxes in n = 2 become lone pairs.',
});

/* ================================== 10. Hund's rule on nitrogen (lesson) === */
FIGURES.push({
  id: 'l-hund-nitrogen',
  lessons: ['orbitals'],
  viewBox: '0 0 340 200',
  alt: 'Nitrogen’s three 2p electrons placed two ways. Top, marked right: one up arrow in each of the three 2p boxes. Bottom, marked wrong: two arrows paired in the first box, one in the second, and the third box empty.',
  build() {
    let s = '';
    const row = (y0, kind, word, fill, note) => {
      let g = panel(6, y0, 328, 88, { kind });
      g += tag(20, y0 + 22, word, { anchor: 'start', cls: kind === 'good' ? 'fg-tag-good' : 'fg-tag-warn' });
      g += label(44, y0 + 57, '2p', { size: 12 });
      [0, 1, 2].forEach((k) => { g += box(92 + k * 36, y0 + 52, fill[k]); });
      g += tag(186, y0 + 48, note[0], { anchor: 'start' });
      g += tag(186, y0 + 64, note[1], { anchor: 'start' });
      return g;
    };
    s += row(6, 'good', 'Hund’s rule: right', [1, 1, 1], ['one per box,', 'same spin']);
    s += row(104, 'warn', 'wrong', [2, 1, 0], ['a pair while a', 'box sits empty']);
    return s;
  },
  caption: 'Nitrogen’s three 2p electrons. The three boxes have equal energy.',
});

/* ================================== 11. periodic table blocks (notes, wide) === */
const ROWS = [
  ['H', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'He'],
  ['Li', 'Be', '', '', '', '', '', '', '', '', '', '', 'B', 'C', 'N', 'O', 'F', 'Ne'],
  ['Na', 'Mg', '', '', '', '', '', '', '', '', '', '', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
  ['K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'],
];
const blockOf = (row, col) => {
  if (row === 0 && col === 17) return 's';   // He: 1s², placed over the p-block
  if (col < 2) return 's';
  if (col < 12) return 'd';
  return 'p';
};
function blockCell(x, y, w, h, b, hi) {
  const cls = b === 's' ? 'fg-panel-hi' : b === 'p' ? 'fg-panel-good' : b === 'd' ? 'fg-panel-warn' : 'fg-panel';
  let s = `<rect class="${cls}" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="3"></rect>`;
  if (hi) s += `<rect class="fg-orb-node" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="3" style="stroke-dasharray:none;stroke-width:2"></rect>`;
  return s;
}
const ORGANIC = new Set(['C', 'N', 'O', 'F']);

FIGURES.push({
  id: 'periodic-blocks',
  section: 'orbitals',
  anchor: '<h3>What an orbital is</h3>',
  viewBox: '0 0 760 300',
  alt: 'The first four rows of the periodic table, every element labeled, with the f-block row drawn separately below. Groups 1 and 2 are shaded as the s-block, groups 3 to 12 (Sc to Zn in row 4) as the d-block, groups 13 to 18 as the p-block. Helium is shaded as s-block although it sits at the top of group 18. Carbon, nitrogen, oxygen and fluorine are outlined. A row of 14 blank cells below is the f-block.',
  build() {
    let s = '';
    const x0 = 56, cw = 38, ch = 34, y0 = 44;
    for (let c = 0; c < 18; c++) s += text(x0 + c * cw + cw / 2, y0 - 8, String(c + 1), { cls: 'fg-sm', size: 10.5 });
    s += text(x0 - 30, y0 - 8, 'group', { cls: 'fg-sm', size: 10.5 });
    ROWS.forEach((row, r) => {
      s += text(x0 - 30, y0 + r * ch + ch / 2 + 4, `row ${r + 1}`, { cls: 'fg-sm', size: 10.5 });
      row.forEach((sym, c) => {
        if (!sym) return;
        const x = x0 + c * cw, y = y0 + r * ch;
        s += blockCell(x + 1, y + 1, cw - 2, ch - 2, blockOf(r, c), ORGANIC.has(sym));
        s += label(x + cw / 2, y + ch / 2 + 5, sym, { size: 13 });
      });
    });
    // f-block, pulled out below.
    const fy = y0 + 4 * ch + 28;
    for (let c = 0; c < 14; c++) s += blockCell(x0 + (2 + c) * cw + 1, fy + 1, cw - 2, ch - 2, 'f', false);
    s += text(x0 + 2 * cw - 8, fy + ch / 2 + 4, 'f-block', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += text(x0 + 9 * cw, fy + ch + 18, 'lanthanides and actinides, drawn below the table', { cls: 'fg-sm', size: 10.5 });
    // Block names under row 4.
    const ly = y0 + 4 * ch + 14;
    s += text(x0 + cw, ly, 's-block', { cls: 'fg-tag', size: 11 });
    s += text(x0 + 7 * cw, ly, 'd-block (transition metals)', { cls: 'fg-tag', size: 11 });
    s += text(x0 + 15 * cw, ly, 'p-block', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'Rows 1 to 4. The outlined cells are C, N, O and F. Helium is shaded with the s-block: its electrons are 1s², though it sits at the top of group 18.',
});

FIGURES.push({
  id: 'l-periodic-blocks',
  lessons: ['orbitals'],
  viewBox: '0 0 340 250',
  alt: 'The periodic table’s first four rows and the f-block row as colored blocks. Groups 1 and 2 are the s-block, the ten middle columns the d-block, groups 13 to 18 the p-block, and a separate row of 14 cells below is the f-block. Hydrogen, carbon, nitrogen, oxygen and fluorine are labeled.',
  build() {
    let s = '';
    const x0 = 17, cw = 17, ch = 24, y0 = 34;
    ROWS.forEach((row, r) => {
      row.forEach((sym, c) => {
        if (!sym) return;
        const x = x0 + c * cw, y = y0 + r * ch;
        s += blockCell(x + 0.5, y + 0.5, cw - 1, ch - 1, blockOf(r, c), ORGANIC.has(sym));
        if (sym === 'H' || ORGANIC.has(sym)) s += label(x + cw / 2, y + ch / 2 + 5, sym, { size: 13 });
      });
    });
    s += tag(x0 + cw, y0 - 10, 's');
    s += tag(x0 + 7 * cw, y0 + ch - 10, 'd');
    s += tag(x0 + 15 * cw, y0 - 10, 'p');
    const fy = y0 + 4 * ch + 18;
    for (let c = 0; c < 14; c++) s += blockCell(x0 + (2 + c) * cw + 0.5, fy + 0.5, cw - 1, ch - 1, 'f', false);
    s += tag(x0 + 2 * cw - 4, fy + 16, 'f', { anchor: 'end' });
    // Key.
    const ky = 196;
    const key = [['s-block', 's', 20], ['p-block', 'p', 100], ['d-block', 'd', 180], ['f-block', 'f', 260]];
    for (const [t, b, x] of key) {
      s += blockCell(x, ky - 11, 14, 14, b, false);
      s += tag(x + 20, ky, t, { anchor: 'start' });
    }
    s += tag(170, 232, 'organic chemistry lives in the p-block');
    return s;
  },
  caption: 'Rows 1 to 4, with the f-block row below. C, N, O and F are outlined.',
});

export default FIGURES;
