/* Figures for the aromaticity notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* Frost's circle: inscribe the ring in a circle, vertex at the bottom, and
   every touching point is an orbital at that height. The MO filling pattern
   the notes assert in words is read straight off the geometry. */
FIGURES.push({
  id: 'frost-circles',
  section: 'aromaticity',
  anchor: '<b>Third</b>, count. The bottom orbital takes 2 electrons. Each degenerate pair above it takes 4 more. The counts that leave nothing half-filled are 2, then 6, then 10, then 14 — exactly what 4n + 2 generates. Hückel\'s rule is the arithmetic of leaving no half-filled shell.</p>',
  alt: 'Three Frost circles side by side. Benzene: a hexagon inscribed in a circle with one vertex at the bottom, six energy levels at the vertex heights, the lowest and the two below the center line each holding a pair of electrons and the top three empty. Cyclobutadiene: a square, with the lowest level paired and the two levels on the center line each holding one unpaired electron. Cyclopentadienyl anion: a pentagon, with the lowest level and the two below the center line all paired.',
  viewBox: '0 0 760 358',
  build() {
    let s = '';
    const CY = 152, R = 58;
    const panels = [
      { cx: 136, n: 6, title: 'benzene', pi: '6 π electrons',
        fill: [2, 2, 2, 0, 0, 0], detail: 'every bonding level full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
      { cx: 380, n: 4, title: 'cyclobutadiene', pi: '4 π electrons',
        fill: [2, 1, 1, 0], detail: 'two unpaired electrons', verdict: 'ANTIAROMATIC', kind: 'fg-tag-warn' },
      { cx: 624, n: 5, title: 'cyclopentadienyl anion', pi: '6 π electrons',
        fill: [2, 2, 2, 0, 0], detail: 'every bonding level full', verdict: 'AROMATIC', kind: 'fg-tag-good' },
    ];
    for (const p of panels) {
      s += tag(p.cx, 42, p.title);
      s += `<circle class="fg-orb-node" cx="${p.cx}" cy="${CY}" r="${R}" fill="none"></circle>`;
      /* Vertex 0 at the bottom, then round the circle. The y of each vertex
         IS the orbital energy — that is the whole trick. */
      const v = [];
      for (let i = 0; i < p.n; i++) {
        const a = (90 + i * 360 / p.n) * Math.PI / 180;
        v.push(P(p.cx + Math.cos(a) * R, CY + Math.sin(a) * R));
      }
      for (let i = 0; i < p.n; i++) s += bond(v[i], v[(i + 1) % p.n], { rFrom: 0, rTo: 0, cls: 'fg-bond-soft' });
      s += `<line class="fg-dash" x1="${p.cx - 78}" y1="${CY}" x2="${p.cx + 78}" y2="${CY}"></line>`;
      /* Levels lowest-first, so the fill array reads bottom to top. */
      const order = v.map((pt, i) => ({ pt, i })).sort((a, b) => b.pt.y - a.pt.y);
      order.forEach((o, rank) => {
        s += `<line class="fg-bond" x1="${(o.pt.x - 17).toFixed(2)}" y1="${o.pt.y.toFixed(2)}" x2="${(o.pt.x + 17).toFixed(2)}" y2="${o.pt.y.toFixed(2)}"></line>`;
        const e = p.fill[rank];
        if (e) s += text(o.pt.x, o.pt.y - 6, e === 2 ? '↑↓' : '↑', { cls: 'fg-hi', size: 12 });
      });
      s += label(p.cx, 248, p.pi, { size: 12.5 });
      s += text(p.cx, 270, p.detail, { cls: 'fg-sm', size: 10.5 });
      s += text(p.cx, 294, p.verdict, { cls: p.kind, size: 11 });
    }
    s += rule(258, 60, 258, 308);
    s += rule(502, 60, 502, 308);
    s += text(380, 336, 'Below the dashed line an orbital is bonding; on it, nonbonding; above it, antibonding.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Frost&rsquo;s circle turns the filling pattern into geometry. Inscribe the ring in a circle with <b>one vertex at the bottom</b>, and every point where the polygon touches the circle is a molecular orbital at that height. The single lowest orbital and the degenerate pairs above it are not asserted here &mdash; they are read off the drawing. Fill from the bottom, and 4n + 2 is exactly the count that leaves no pair half-filled.',
  note: 'Vertex at the BOTTOM, every time &mdash; that is the only rule, and getting it wrong inverts the whole diagram. Cyclobutadiene is the case worth staring at: its two middle electrons land in separate nonbonding orbitals with parallel spins, which is not a stabilized arrangement at all. That is what <b>antiaromatic</b> means, and it is why the count matters rather than just the delocalization.',
});

/* The pyrrole/pyridine lone pair, drawn edge-on. The notes call this "that
   single decision" and then describe a 3-D orbital orientation in a
   sentence. Seen from the side, the two cases are simply different. */
FIGURES.push({
  id: 'pyrrole-pyridine-lone-pairs',
  section: 'aromaticity',
  anchor: 'so both are aromatic, and both keep one lone pair available for ordinary chemistry.</p>',
  alt: 'Pyrrole and pyridine compared. Each is drawn as a skeletal ring and again edge-on, as a row of atoms along the ring plane with a p orbital above and below each one. Pyrrole\'s nitrogen has its lone pair drawn as two dots inside the upper p-orbital lobe; pyridine\'s nitrogen has its lone pair drawn as two dots on the ring-plane line, pointing outward away from the ring.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const lobe = (cx, cy, op) => `<ellipse class="fg-orb" cx="${cx}" cy="${cy}" rx="11" ry="22" fill-opacity="${op}"></ellipse>`;
    const cases = [
      { cx: 190, n: 5, name: 'PYRROLE', nh: true, kind: 'fg-tag-good',
        l1: 'the lone pair IS the p orbital', l2: '2 C=C + that pair = 6 π · aromatic', l3: 'so the nitrogen is NOT basic' },
      { cx: 570, n: 6, name: 'PYRIDINE', nh: false, kind: 'fg-tag-good',
        l1: 'the lone pair is in the ring plane', l2: '3 ring double bonds = 6 π · aromatic', l3: 'so the nitrogen IS basic' },
    ];
    for (const c of cases) {
      s += tag(c.cx, 36, c.name);
      /* The skeletal ring, nitrogen at the bottom vertex. */
      const RC = P(c.cx, 106), R = 40, v = [];
      for (let i = 0; i < c.n; i++) {
        const a = (90 + i * 360 / c.n) * Math.PI / 180;
        v.push(P(RC.x + Math.cos(a) * R, RC.y + Math.sin(a) * R));
      }
      /* Pyrrole: N1-C2=C3-C4=C5. Pyridine: N1=C2-C3=C4-C5=C6. */
      const doubles = c.n === 5 ? [1, 3] : [0, 2, 4];
      for (let i = 0; i < c.n; i++) {
        const a = v[i], b = v[(i + 1) % c.n];
        const rFrom = i === 0 ? 15 : 0, rTo = (i + 1) % c.n === 0 ? 15 : 0;
        /* A double bond that lands on the nitrogen has to stop at its circle,
           which ringDouble (built for unlabeled ring vertices) does not do. */
        if (doubles.includes(i) && (rFrom || rTo)) s += bond(a, b, { order: 2, rFrom, rTo, gap: 3.6 });
        else if (doubles.includes(i)) s += ringDouble(a, b, RC, { inset: 10 });
        else s += bond(a, b, { rFrom, rTo });
      }
      s += atom(v[0].x, v[0].y, 'N', { kind: 'hi' });
      if (c.nh) {
        s += bond(v[0], P(c.cx, v[0].y + 32), { rFrom: 16, rTo: 11 });
        s += atom(c.cx, v[0].y + 32, 'H', { r: 11 });
      }
      /* The same ring seen edge-on: the plane is a line, and every p orbital
         stands up off it. */
      s += text(c.cx, 214, 'the same ring, seen edge-on', { cls: 'fg-sm', size: 10.5 });
      const BY = 278, step = c.n === 5 ? 44 : 40;
      const x0 = c.cx - step * (c.n - 1) / 2;
      s += `<line class="fg-bond-soft" x1="${x0 - 22}" y1="${BY}" x2="${x0 + step * (c.n - 1) + 22}" y2="${BY}"></line>`;
      for (let i = 0; i < c.n; i++) {
        const x = x0 + i * step;
        const strong = i === 0 && c.nh;
        s += lobe(x, BY - 26, strong ? 0.4 : 0.16);
        s += lobe(x, BY + 26, strong ? 0.4 : 0.16);
      }
      for (let i = 0; i < c.n; i++) {
        const x = x0 + i * step;
        s += atom(x, BY, i === 0 ? 'N' : 'C', { kind: i === 0 ? 'hi' : 'plain', r: 13, size: 11 });
      }
      if (c.nh) s += lonePair(x0, BY, -90, { dist: 26 });
      else s += lonePair(x0, BY, 180, { dist: 26 });
      s += label(c.cx, 346, c.l1, { size: 12.5 });
      s += text(c.cx, 366, c.l2, { cls: 'fg-sm', size: 10.5 });
      s += text(c.cx, 388, c.l3, { cls: c.kind, size: 11 });
    }
    s += rule(380, 56, 380, 392);
    return s;
  },
  caption: 'Both rings are aromatic with six pi electrons, and they get there by opposite routes. Pyrrole&rsquo;s nitrogen has no ring double bond, so its lone pair is the one standing up in the p orbital &mdash; spent on the sextet, and therefore not available to a proton. Pyridine&rsquo;s nitrogen already has a C=N supplying its two electrons, so its lone pair lies in an sp² orbital in the plane of the ring, pointing outward, untouched by the pi system and free to act as a base.',
  note: 'Ask one question of every heteroatom in a ring: <b>does it already have a double bond in the ring?</b> If it does, its lone pair is in the plane and contributes 0. If it does not, its lone pair is in the p orbital and contributes 2. That one question settles pyrrole, pyridine, furan, thiophene and both nitrogens of imidazole.',
});

export default FIGURES;
