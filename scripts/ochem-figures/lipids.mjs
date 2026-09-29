/* Figures for the lipids notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 12 ---
   Why one double bond changes the melting point by tens of degrees. This is
   a claim about SHAPE, which prose can assert and a drawing can show: three
   C18 chains, same length, drawn as they pack. */
FIGURES.push({
  id: 'chain-packing',
  section: 'lipids',
  anchor: '<h3>Triglycerides are triesters</h3>',
  viewBox: '0 0 700 380',
  alt: 'Three panels of C18 fatty acid chains: straight saturated chains packed close together, cis chains bent into a V at the double bond so they cannot touch, and trans chains that carry a double bond and stay straight',
  build() {
    let s = '';
    /* A chain as a list of BOND ANGLES, in degrees, y down. Two consecutive
       bonds differ by exactly 60 degrees, which is what makes every vertex a
       120 degree carbon — including the two sp2 carbons of a double bond.
       (The version this replaces walked an axis and then dropped the double
       bond in vertically, which left the alkene carbons with 180 degree
       bonds: the cis/trans geometry the whole figure exists to contrast was
       not actually drawn, and a viewer could not read it off the picture.) */
    const L = 25.5;
    const walk = (x, y, angles, dbl) => {
      let t = '', cx = x, cy = y;
      angles.forEach((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const nx = cx + Math.cos(a) * L, ny = cy + Math.sin(a) * L;
        t += bond(P(cx, cy), P(nx, ny), i === dbl
          ? { rFrom: 0, rTo: 0, order: 2, gap: 3.4 }
          : { rFrom: 0, rTo: 0 });
        cx = nx; cy = ny;
      });
      return t;
    };
    /* Straight chain: 60 and 120 alternating, so the chain axis is vertical.
       Put the double bond on bond 3 and the pattern carries straight on —
       the two chain halves end up on OPPOSITE sides of the C=C, which is
       what trans means. */
    const SAT  = [60, 120, 60, 120, 60, 120, 60];
    const TRANS = SAT;
    /* Cis: same first four bonds, then 180 instead of 60, which puts the two
       halves on the SAME side of the C=C. Everything after it is the same
       zigzag, tilted 60 degrees off the axis it started on — the kink. */
    const CIS  = [60, 120, 60, 120, 180, 120, 180];

    const col = (ox, title, sub, mp, kind, draw) => {
      s += panel(ox, 44, 214, 242, { kind });
      s += tag(ox + 107, 32, title);
      draw(ox);
      s += text(ox + 107, 304, sub, { cls: 'fg-sm' });
      s += text(ox + 107, 326, mp, { cls: kind === 'warn' ? 'fg-tag-warn' : 'fg-tag-good', size: 11 });
    };

    // Saturated: four chains, as close together as the drawing can put them.
    col(8, 'saturated (stearic, 18:0)', 'they lie flat against each other', 'mp 69 °C', null, (ox) => {
      for (let j = 0; j < 4; j++) s += walk(ox + 34 + j * 30, 70, SAT, -1);
    });

    // Cis: the chain leaves the double bond on the side it arrived on, so it
    // runs off at 60 degrees to the half above it. Three chains, set further
    // apart, because a bent chain cannot lie against its neighbour.
    col(238, 'one cis double bond (oleic)', 'the kink breaks the contact', 'mp 13 °C', 'warn', (ox) => {
      for (let j = 0; j < 3; j++) s += walk(ox + 82 + j * 52, 70, CIS, 3);
    });

    // Trans: it leaves on the opposite side, so the zigzag carries on. Same
    // C18, same one double bond, and the stack survives.
    col(468, 'one trans double bond (elaidic)', 'still essentially straight', 'mp 44 °C', null, (ox) => {
      for (let j = 0; j < 4; j++) s += walk(ox + 34 + j * 30, 70, TRANS, 3);
    });

    s += rule(20, 342, 680, 342);
    s += label(345, 364, 'All three are C18 — only the shape differs, and shape is what a melting point reads.');
    return s;
  },
  caption: 'Three eighteen-carbon fatty acids, drawn as they pack. Chain length is held constant, so the fifty-six degrees between stearic and oleic acid is entirely the bend that one cis double bond puts in the middle of the chain.',
  note: 'The trans column is what makes the rule precise. Elaidic acid is exactly as unsaturated as oleic acid and melts thirty degrees higher, because a trans double bond leaves the chain straight. “Unsaturated means low melting” is a shortcut that stops working the moment partial hydrogenation is in the room.',
});

/* ---------------------------------------------------------------- B6 ---
   The molecule the lipids section is about, drawn once. The prose
   introduced the triglyceride in a single sentence and the phospholipid in
   another, and a reader who had never seen either could not tell from the
   words that they are the same molecule with one group swapped. */
FIGURES.push({
  id: 'triglyceride-and-phospholipid',
  section: 'lipids',
  anchor: 'it is three Fischer esterifications, and everything an ester does, a triglyceride does.</p>',
  viewBox: '0 0 680 380',
  alt: 'A triglyceride: glycerol carrying three ester groups, the top and bottom chains straight and the middle one kinked by a cis double bond, with an arrow replacing the bottom chain by a phosphate and choline head to give a phospholipid',
  build() {
    let s = '';
    const rows = [90, 176, 262];
    // the three ester groups, shaded, because they are where every reaction
    // in the section happens.
    for (const y of rows) s += bar(128, y - 50, 96, 72, { kind: 'hi', opacity: 0.18 });

    // glycerol: three carbons, one oxygen each.
    s += bond(P(90, rows[0]), P(90, rows[1]), { rFrom: 17, rTo: 15 });
    s += bond(P(90, rows[1]), P(90, rows[2]), { rFrom: 15, rTo: 17 });
    s += atom(90, rows[0], 'CH₂', { r: 17 });
    s += atom(90, rows[1], 'CH');
    s += atom(90, rows[2], 'CH₂', { r: 17 });
    s += text(70, 310, 'glycerol', { cls: 'fg-tag' });
    s += tag(176, 310, 'three ester groups');

    /* A chain as a list of BOND ANGLES in degrees, y down. Consecutive bonds
       differ by 60 degrees, so every vertex — the two sp2 carbons included —
       is drawn at 120 degrees. That matters here because the middle chain's
       geometry is the claim the caption makes, and the version this replaces
       drew its alkene with a 180 degree bond, which reads as trans. */
    const CL = 27;
    const walk = (x, y, angles, dbl) => {
      let t = '', cx = x, cy = y;
      angles.forEach((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const nx = cx + Math.cos(a) * CL, ny = cy + Math.sin(a) * CL;
        t += bond(P(cx, cy), P(nx, ny), i === dbl
          ? { rFrom: 0, rTo: 0, order: 2, gap: 3.4 }
          : { rFrom: 0, rTo: 0 });
        cx = nx; cy = ny;
      });
      return t;
    };

    for (const y of rows) {
      s += bond(P(90, y), P(146, y), { rFrom: 17, rTo: 15 });
      s += bond(P(146, y), P(202, y), { rFrom: 15, rTo: 15 });
      s += bond(P(202, y), P(202, y - 34), { rFrom: 15, rTo: 15, order: 2 });
      s += atom(146, y, 'O');
      s += atom(202, y, 'C', { kind: 'hi' });
      s += atom(202, y - 34, 'O');
    }
    // Top and bottom chains: a plain zigzag, bonds at ±30° about a
    // horizontal axis. The middle one carries a cis double bond on bond 3:
    // the bond after it leaves on the SAME side the chain arrived on, which
    // is what cis means and what tilts the rest of the chain by 60°.
    s += walk(218, rows[0], [-30, 30, -30, 30, -30, 30], -1);
    s += walk(218, rows[2], [-30, 30, -30, 30, -30, 30], -1);
    s += walk(218, rows[1], [30, -30, 30, -30, -90, -30], 3);
    s += text(300, 64, 'saturated', { cls: 'fg-sm' });
    s += text(302, 222, 'one cis double bond', { cls: 'fg-sm' });
    s += text(300, 300, 'saturated', { cls: 'fg-sm' });

    /* one swap, and it is a membrane lipid instead of a fat */
    s += arrow(P(400, rows[2]), P(446, rows[2]));
    s += tag(430, 296, 'replace this chain');
    s += bond(P(470, 262), P(516, 262), { rFrom: 15, rTo: 15 });
    s += bond(P(516, 262), P(562, 262), { rFrom: 15, rTo: 15 });
    s += bond(P(516, 262), P(516, 222), { rFrom: 15, rTo: 15, order: 2 });
    s += bond(P(516, 262), P(516, 302), { rFrom: 15, rTo: 16 });
    s += bond(P(562, 262), P(618, 262), { rFrom: 15, rTo: 26 });
    s += atom(470, 262, 'O');
    s += atom(516, 262, 'P', { kind: 'warn' });
    s += atom(516, 222, 'O');
    s += atom(516, 302, 'O⁻', { r: 16, kind: 'warn' });
    s += atom(562, 262, 'O');
    s += atom(618, 262, 'choline', { r: 26 });
    s += tag(540, 196, 'phosphate + choline head');

    s += rule(20, 336, 660, 336);
    s += label(340, 360, 'One swap out of three, and a storage fat becomes a membrane lipid.');
    return s;
  },
  caption: 'A triglyceride is glycerol wearing three esters, and a phospholipid is the same molecule with one of them exchanged for a charged phosphate. Every <i>reaction</i> in this section happens at the shaded ester groups; everything <i>physical</i> happens out in the chains.',
  note: 'The middle chain is drawn kinked on purpose. A natural fat carries different acids on one backbone, which is why saponifying one gives a mixture of soaps rather than three copies of anything, and why a single fat can be part solid and part oil in its behavior.',
});

/* ---------------------------------------------------------------- B7 ---
   Micelle against bilayer: two spatial objects the section describes in
   words. One tail or two is the entire difference, and it decides the
   shape. */
FIGURES.push({
  id: 'micelle-and-bilayer',
  section: 'lipids',
  anchor: 'That bilayer is the cell membrane, and its existence is a direct consequence of one molecule having a polar end and a nonpolar end.</p>',
  viewBox: '0 0 680 330',
  alt: 'A micelle drawn as single-tailed molecules arranged in a circle with their tails pointing inward around a gray droplet, beside a bilayer drawn as two rows of double-tailed molecules with tails facing each other and heads facing the water',
  build() {
    let s = '';
    s += panel(16, 44, 300, 200);
    s += panel(348, 44, 300, 200);
    s += tag(166, 32, 'one tail → sphere');
    s += tag(498, 32, 'two tails → sheet');

    /* the micelle: heads out, tails in, grease in the middle */
    const cx = 166, cy = 144, R = 78;
    s += `<circle class="fg-fill-mut" cx="${cx}" cy="${cy}" r="30" opacity="0.5"></circle>`;
    s += text(cx, cy + 4, 'oil', { cls: 'fg-sm' });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * 2 * Math.PI;
      const ux = Math.cos(a), uy = Math.sin(a);
      s += bond(P(cx + ux * (R - 10), cy + uy * (R - 10)), P(cx + ux * 34, cy + uy * 34), { rFrom: 0, rTo: 0 });
      s += atom(cx + ux * R, cy + uy * R, '', { kind: 'hi', r: 9 });
    }

    /* the bilayer: the same molecules, two tails each, in two rows */
    for (let i = 0; i < 10; i++) {
      const x = 376 + i * 27;
      for (const [hy, dir] of [[98, 1], [190, -1]]) {
        s += atom(x, hy, '', { kind: 'hi', r: 9 });
        s += bond(P(x - 4, hy + dir * 9), P(x - 4, hy + dir * 48), { rFrom: 0, rTo: 0 });
        s += bond(P(x + 4, hy + dir * 9), P(x + 4, hy + dir * 48), { rFrom: 0, rTo: 0 });
      }
    }
    s += text(498, 74, 'water', { cls: 'fg-sm' });
    s += text(498, 222, 'water', { cls: 'fg-sm' });

    s += tag(166, 272, 'micelle — what soap makes');
    s += tag(498, 272, 'bilayer — what a membrane is');
    s += rule(20, 290, 660, 290);
    s += label(340, 314, 'Both structures hide the same thing from the same solvent.');
    return s;
  },
  caption: 'Two ways of hiding a hydrocarbon from water, and the number of tails decides which one forms. One tail tapers to a wedge, and wedges tile a sphere; two tails make a molecule closer to a cylinder, and cylinders tile a flat sheet.',
  note: 'Neither structure involves a new kind of bond. It is the same hydrophobic effect that buries the nonpolar side chains inside a folded protein: the ordering forced on water around a hydrocarbon surface is what is being avoided, so the surfaces are put where the water cannot reach them.',
});

export default FIGURES;
