/* Figures for the eas notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

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

/* The whole "why substitution" argument is energetic and nothing was drawn.
   Two barriers, one shallow well, and a grayed branch showing where addition
   would have gone. */
FIGURES.push({
  id: 'eas-energy-profile',
  section: 'eas',
  anchor: 'stabilizes the transition state leading to it, and therefore speeds the reaction up.</div>',
  alt: 'A reaction-energy diagram for electrophilic aromatic substitution. From benzene plus an electrophile the curve rises steeply over a tall first transition state, drops into a shallow well labeled arenium ion that is well above the starting level, rises over a much smaller second transition state, and falls to a product plateau below the start. A gray dashed branch leaves the arenium well, rises over a barrier and ends on a plateau above the starting level, labeled addition product.',
  viewBox: '0 0 760 400',
  build() {
    let s = '';
    const base = 320;
    s += rule(56, base, 692, base) + rule(56, base, 56, 60);
    s += text(62, 44, 'free energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(380, 344, 'reaction coordinate →', { cls: 'fg-sm', size: 10.5 });

    const start = P(70, 252), ts1 = P(196, 92), well = P(300, 198), ts2 = P(392, 158), prod = P(580, 288);
    /* The branch benzene does not take: addition, which never gets the
       aromaticity back and so ends UPHILL of the starting material. */
    s += profile([well, P(430, 120), P(664, 226)], 'fg-dash');
    s += profile([start, ts1, well, ts2, prod]);
    s += `<line class="fg-dash" x1="${well.x}" y1="${well.y}" x2="${well.x}" y2="${base}"></line>`;

    s += text(72, 272, 'benzene + E⁺', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(196, 76, '‡', { cls: 'fg-tag-warn', size: 15 });
    s += text(196, 60, 'TS1 · aromaticity being lost', { cls: 'fg-tag-warn', size: 11 });
    s += text(392, 152, '‡', { cls: 'fg-tag', size: 13 });
    s += text(362, 136, 'TS2 · H⁺ leaving', { cls: 'fg-tag', size: 11, anchor: 'end' });
    s += text(308, 230, 'arenium ion', { cls: 'fg-lbl', size: 12.5, anchor: 'start' });
    s += text(308, 248, 'the 36 kcal/mol is gone', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    s += text(548, 310, 'substituted benzene — aromatic again', { cls: 'fg-sm', size: 10.5 });
    s += text(668, 250, 'addition product ✗', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });

    s += text(380, 368, 'Two barriers and one intermediate — and the first barrier is the taller one.', { cls: 'fg-lbl', size: 12.5 });
    s += text(380, 388, 'Anything that lowers the arenium ion lowers TS1 with it, which is the whole of the next section.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'The first barrier is tall because aromaticity has to be paid for up front; the second is small because losing a proton hands it straight back. That asymmetry is the reason the <b>first</b> step is rate-determining &mdash; and since the rate-determining step is the one every directing-effect argument is about, everything in the next section is really an argument about the height of TS1.',
  note: 'Look at where the gray branch ends: <b>above</b> the starting material. Addition to benzene is uphill overall, and that, not anything about the first step, is what makes EAS a substitution. An alkene&rsquo;s version of this diagram has the gray branch running downhill instead, which is why an alkene adds.',
});

/* Three contributors and a hybrid. The notes assert the three-carbon
   delocalization in one sentence, and the whole of the next section is read
   off it. */
FIGURES.push({
  id: 'arenium-resonance-three',
  section: 'eas',
  anchor: 'since conjugation is still broken.</p>',
  alt: 'Three resonance structures of the arenium ion in a row, each a benzene ring with an sp3 carbon at the top bearing E on a wedge and H on a hash. The positive charge is on an ortho carbon in the first, on the para carbon in the second and on the other ortho carbon in the third, with curved arrows connecting them. Below, the hybrid is drawn with a dashed arc over the five remaining carbons and a delta-plus on only three of them.',
  viewBox: '0 0 760 470',
  build() {
    let s = '';
    const R = 46;
    const verts = (cx, cy) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      return v;   // 0 top (sp3), 1 ortho, 2 meta, 3 para, 4 meta, 5 ortho
    };
    const ringOf = (cx, cy, doubles) => {
      const v = verts(cx, cy), mid = P(cx, cy);
      let g = '';
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        if (doubles.includes(i)) g += ringDouble(v[i], v[j], mid, { inset: 10 });
        else g += bond(v[i], v[j], { rFrom: 0, rTo: 0 });
      }
      /* The sp3 carbon carries both groups: E toward the reader, H away. */
      g += wedge(v[0], P(cx - 28, cy - R - 38), { rFrom: 0, rTo: 14 });
      g += atom(cx - 28, cy - R - 38, 'E', { kind: 'hi', r: 14 });
      g += hash(v[0], P(cx + 28, cy - R - 38), { rFrom: 0, rTo: 12 });
      g += atom(cx + 28, cy - R - 38, 'H', { r: 12 });
      return g;
    };
    const plus = (cx, cy, i) => {
      const v = verts(cx, cy)[i];
      const ux = (v.x - cx) / R, uy = (v.y - cy) / R;
      return text(v.x + ux * 19, v.y + uy * 19 + 5, '+', { cls: 'fg-warn', size: 17 });
    };

    const CY = 140;
    s += tag(380, 28, 'THE THREE ARENIUM CONTRIBUTORS');
    // 1: charge on an ortho carbon; the meta-side C=C is about to shift.
    s += ringOf(140, CY, [2, 4]);
    s += plus(140, CY, 1);
    s += curve(P(166, 177), P(187, 141), { bow: -13 });
    // 2: charge on the para carbon.
    s += ringOf(380, CY, [1, 4]);
    s += plus(380, CY, 3);
    s += curve(P(333, 141), P(354, 177), { bow: -13 });
    // 3: charge on the other ortho carbon.
    s += ringOf(620, CY, [1, 3]);
    s += plus(620, CY, 5);

    const dbl = (x1, x2, y) => arrow(P(x1, y), P(x2, y), { muted: true }) + arrow(P(x2, y), P(x1, y), { muted: true });
    s += dbl(218, 302, CY);
    s += dbl(458, 542, CY);
    s += text(140, 232, 'charge on an ortho carbon', { cls: 'fg-tag', size: 11 });
    s += text(380, 232, 'charge on the para carbon', { cls: 'fg-tag', size: 11 });
    s += text(620, 232, 'charge on the other ortho', { cls: 'fg-tag', size: 11 });
    s += rule(24, 258, 736, 258);

    /* The hybrid: one drawing, with the charge marked only where it is. */
    const HY = 342;
    const v = verts(380, HY);
    for (let i = 0; i < 6; i++) s += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
    s += wedge(v[0], P(352, HY - R - 38), { rFrom: 0, rTo: 14 });
    s += atom(352, HY - R - 38, 'E', { kind: 'hi', r: 14 });
    s += hash(v[0], P(408, HY - R - 38), { rFrom: 0, rTo: 12 });
    s += atom(408, HY - R - 38, 'H', { r: 12 });
    const arcR = 30;
    const a1 = P(380 + (v[1].x - 380) / R * arcR, HY + (v[1].y - HY) / R * arcR);
    const a5 = P(380 + (v[5].x - 380) / R * arcR, HY + (v[5].y - HY) / R * arcR);
    s += `<path class="fg-dash-hi" d="M${a1.x.toFixed(2)} ${a1.y.toFixed(2)} A${arcR} ${arcR} 0 1 1 ${a5.x.toFixed(2)} ${a5.y.toFixed(2)}"></path>`;
    for (const i of [1, 3, 5]) {
      const p = v[i];
      const ux = (p.x - 380) / R, uy = (p.y - HY) / R;
      s += text(p.x + ux * 22, p.y + uy * 22 + 4, 'δ+', { cls: 'fg-warn', size: 12 });
    }
    s += text(452, 366, 'meta · no charge, ever', { cls: 'fg-tag-mut', size: 11, anchor: 'start' });
    s += text(308, 366, 'meta · no charge, ever', { cls: 'fg-tag-mut', size: 11, anchor: 'end' });
    s += label(380, 438, 'the hybrid: partial + on THREE carbons, none on the other two', { size: 12.5 });
    s += text(380, 458, 'and the two bare carbons are exactly the meta positions', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'Three structures, three carbons. The charge lands <b>ortho, para, ortho</b> with respect to the carbon the electrophile attacked, and never on the two carbons meta to it. The hybrid underneath shows where the charge actually is: partial positive on three carbons and none on two.',
  note: 'Count the marked carbons: THREE, not five. Everything in the next section is read off this one picture &mdash; a substituent sitting on a δ+ carbon can help or hurt, and a substituent sitting on a bare carbon can do neither. The two unmarked carbons are the meta positions, which is the entire reason meta directors exist.',
});

/* One fully drawn example of each of the five reactions. The notes give the
   other four as table rows only. */
FIGURES.push({
  id: 'five-eas-reactions',
  section: 'eas',
  anchor: 'because one of them has serious problems and the other does not.</p>',
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
    const ring = (cx, cy) => {
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
      { y: 72,  rgt: 'Br₂, FeBr₃',      sub: 'Br',     r: 15, name: 'bromobenzene',          note: 'FeBr₃ is catalytic — a trace is enough' },
      { y: 152, rgt: 'HNO₃, H₂SO₄',     sub: 'NO₂',    r: 18, name: 'nitrobenzene',          note: 'later reduced to NH₂ — the way onto aromatic amines' },
      { y: 232, rgt: 'SO₃, H₂SO₄',      sub: 'SO₃H',   r: 21, name: 'benzenesulfonic acid',  note: 'the only one of the five that also runs backwards' },
      { y: 312, rgt: 'CH₃CH₂Cl, AlCl₃', sub: 'CH₂CH₃', r: 25, name: 'ethylbenzene',         note: 'ethyl activates the ring, so it happens again' },
      { y: 392, rgt: 'CH₃COCl, AlCl₃',  sub: 'COCH₃',  r: 23, name: 'acetophenone',          note: 'the ketone deactivates, so it stops at one' },
    ];
    s += tag(380, 28, 'THE FIVE REACTIONS, EACH DRAWN ONCE');
    rows.forEach((row, i) => {
      const y = row.y;
      s += ring(70, y);
      if (i === 2) {
        s += arrow(P(106, y - 6), P(196, y - 6));
        s += arrow(P(196, y + 12), P(106, y + 12), { muted: true });
        s += text(151, y - 16, row.rgt, { cls: 'fg-sm', size: 10.5 });
        s += text(151, y + 30, 'H₂O, H⁺, Δ', { cls: 'fg-sm', size: 10.5 });
      } else {
        s += arrow(P(106, y), P(196, y));
        s += text(151, y - 10, row.rgt, { cls: 'fg-sm', size: 10.5 });
      }
      s += ring(248, y);
      const v = hex(248, y, 24);
      s += bond(v[0], P(248 + 24 + 32, y), { rFrom: 0, rTo: row.r });
      s += atom(248 + 24 + 32, y, row.sub, { kind: 'hi', r: row.r, size: row.sub.length > 3 ? 8.5 : 10 });
      if (i === 3) {
        /* The second alkylation, drawn faint: this is the whole problem. */
        s += bond(v[2], P(248 - 34, y + 42), { rFrom: 0, rTo: 13, cls: 'fg-bond-soft' });
        s += text(248 - 34, y + 46, 'Et', { cls: 'fg-mut', size: 11 });
      }
      s += label(356, y - 4, row.name, { size: 12.5, anchor: 'start' });
      s += text(356, y + 16, row.note, { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    });
    return s;
  },
  caption: 'Each of the five, once, with a real product on the end of the arrow. Only rows 4 and 5 make a carbon&ndash;carbon bond; only row 3 runs backwards; only row 4 keeps going after the first substitution. Those three facts are most of what the rest of this section is about.',
  note: 'Row 3&rsquo;s reverse arrow and row 4&rsquo;s faint second ethyl are the two features worth memorizing. One of them is the blocking-group trick that makes an ortho product reachable; the other is the reason Friedel&ndash;Crafts acylation exists at all.',
});

export default FIGURES;
