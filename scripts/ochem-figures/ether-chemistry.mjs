/* Figures for the ether-chemistry notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------- 10.3 ---
   Ether cleavage. The section's second half had no figure at all, and its
   whole content is a fork: which carbon, by which mechanism. */
FIGURES.push({
  id: 'ether-cleavage-two-branches',
  section: 'ether-chemistry',
  anchor: '<p class="step-body">With excess HI the initially formed alcohol is itself converted to a second alkyl halide, so an ether ends up as two alkyl halides. HCl does not work well — chloride is too poor a nucleophile for the SN2 case.</p>',
  alt: 'Two panels, each starting from a protonated ether. On the left, methyl propyl ether: iodide attacks the methyl carbon from the back in an SN2, giving methyl iodide and propan-1-ol. On the right, tert-butyl methyl ether: a curved arrow from the carbon-oxygen bond to oxygen ionizes the tertiary carbon to a carbocation, which iodide then captures, giving tert-butyl iodide and methanol.',
  viewBox: '0 0 700 340',
  build() {
    let s = '';
    // ---------- left: both carbons primary, so SN2 ----------
    s += tag(196, 38, 'NEITHER CARBON CAN HOLD A CHARGE → SN2');
    const oL = P(196, 150);
    const meL = P(112, 150);
    s += bond(meL, oL, { rFrom: 17, rTo: 15 });
    s += atom(meL.x, meL.y, 'CH₃', { r: 17, size: 10 });
    const hL = P(196, 96);
    s += bond(oL, hL, { rFrom: 15, rTo: 12 });
    s += atom(hL.x, hL.y, 'H', { r: 12, size: 11, kind: 'warn' });
    const p1 = P(254, 180), p2 = P(312, 150);
    s += bond(oL, p1, { rFrom: 15, rTo: 0 }) + bond(p1, p2, { rFrom: 0, rTo: 17 });
    s += atom(p1.x, p1.y, '', { kind: 'point' });
    s += atom(p2.x, p2.y, 'CH₃', { r: 17, size: 10 });
    s += atom(oL.x, oL.y, 'O', { kind: 'hi' });
    s += text(oL.x + 26, oL.y - 18, '+', { cls: 'fg-tag-warn', size: 16 });
    const iL = P(64, 232);
    s += atom(iL.x, iL.y, 'I', { kind: 'hi' });
    s += text(iL.x + 20, iL.y - 14, '−', { cls: 'fg-hi', size: 15 });
    s += curve(P(iL.x + 6, iL.y - 16), P(meL.x - 10, meL.y + 14), { bow: -14 });
    s += curve(P(meL.x + 22, meL.y - 12), P(oL.x - 14, oL.y - 12), { bow: -20 });
    s += text(196, 272, 'iodide attacks the carbon it can reach —', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 288, 'the methyl — and the oxygen leaves as an alcohol', { cls: 'fg-sm', size: 9.5 });
    s += text(196, 312, 'CH₃I  +  propan-1-ol', { cls: 'fg-tag-good', size: 11 });

    s += rule(356, 60, 356, 300);

    // ---------- right: one tertiary carbon, so SN1 ----------
    s += tag(528, 38, 'ONE CARBON IS TERTIARY → SN1');
    const oR = P(546, 150);
    const meR = P(622, 150);
    s += bond(oR, meR, { rFrom: 15, rTo: 17 });
    s += atom(meR.x, meR.y, 'CH₃', { r: 17, size: 10 });
    const hR = P(546, 96);
    s += bond(oR, hR, { rFrom: 15, rTo: 12 });
    s += atom(hR.x, hR.y, 'H', { r: 12, size: 11, kind: 'warn' });
    const tC = P(462, 150);
    s += bond(tC, oR, { rFrom: 15, rTo: 15 });
    for (const deg of [120, 180, 240]) {
      const e = armEnd(tC, deg, 44);
      s += bond(tC, e, { rFrom: 15, rTo: 17 }) + atom(e.x, e.y, 'CH₃', { r: 17, size: 10 });
    }
    s += atom(tC.x, tC.y, 'C');
    s += atom(oR.x, oR.y, 'O', { kind: 'hi' });
    s += text(oR.x + 26, oR.y - 18, '+', { cls: 'fg-tag-warn', size: 16 });
    s += curve(P(tC.x + 20, tC.y - 12), P(oR.x - 14, oR.y - 12), { bow: -20 });
    s += text(528, 272, 'the C–O bond breaks on its own: a 3° cation,', { cls: 'fg-sm', size: 9.5 });
    s += text(528, 288, 'plus methanol — and iodide captures the cation', { cls: 'fg-sm', size: 9.5 });
    s += text(528, 312, '(CH₃)₃CI  +  methanol', { cls: 'fg-tag-good', size: 11 });
    return s;
  },
  caption: 'One protonation, two different second steps, and the substrate decides which. On the left nothing can carry a positive charge, so iodide has to do the work itself and does it where the approach is clear — the methyl. On the right the tertiary carbon ionizes without help, and the iodide simply waits for the cation. The <b>most hindered</b> carbon is attacked in the second case precisely because no backside attack is involved.',
  note: 'Both panels start the same way, and that first step is the whole reason ethers can be cleaved at all: protonation converts RO⁻, a strong base that would never leave, into a neutral alcohol that will. Ask which mechanism is running before asking which carbon reacts — answering in the other order is what makes this question feel like two unrelated rules.',
});

/* ------------------------------------------------------------- 10.6 ---
   The crown ether, drawn. "Six oxygens, one cation, a 2.7 Å hole" is an
   inherently spatial claim, and the section made it in prose only. The
   right-hand panel draws the three diameters to scale, because the whole
   selectivity argument is a comparison of sizes. */
FIGURES.push({
  id: 'crown-ether-cavity',
  section: 'ether-chemistry',
  anchor: 'A "naked" anion like that is a dramatically better nucleophile than the same anion in water, where every lone pair is hydrogen-bonded to a solvent molecule.</p>',
  alt: 'Left: 18-crown-6 drawn as an eighteen-membered ring of six oxygens separated by pairs of CH2 groups, with every oxygen lone pair pointing inward at a potassium ion sitting in the middle of the cavity. Right: the three diameters drawn to scale — the cavity at 2.7 angstroms, potassium at 2.66 which fills it, and sodium at 1.9 which leaves a gap — above a line showing potassium fluoride dissolving in benzene as a crowned cation and a naked, unsolvated fluoride.',
  viewBox: '0 0 760 430',
  build() {
    let s = '';

    // ---------------- the macrocycle ----------------
    s += panel(8, 16, 368, 398);
    s += tag(192, 42, '18-CROWN-6, WITH K⁺ IN THE MIDDLE');

    const CX = 192, CY = 224, RO = 92, RC = 108;
    const at = (deg, r) => P(CX + Math.cos((deg * Math.PI) / 180) * r, CY + Math.sin((deg * Math.PI) / 180) * r);
    const os = [];
    for (let i = 0; i < 6; i++) os.push({ deg: -90 + i * 60, p: at(-90 + i * 60, RO) });
    let ring = '';
    for (let i = 0; i < 6; i++) {
      const a = os[i], b = os[(i + 1) % 6];
      const ca = at(a.deg + 20, RC), cb = at(a.deg + 40, RC);
      ring += bond(a.p, ca, { rFrom: 14, rTo: 0 });
      ring += bond(ca, cb, { rFrom: 0, rTo: 0 });
      ring += bond(cb, b.p, { rFrom: 0, rTo: 14 });
      ring += atom(ca.x, ca.y, '', { kind: 'point' });
      ring += atom(cb.x, cb.y, '', { kind: 'point' });
    }
    s += ring;
    for (const o of os) {
      s += lonePair(o.p.x, o.p.y, o.deg + 180, { dist: 22 });
      s += atom(o.p.x, o.p.y, 'O', { r: 14, kind: 'hi' });
    }
    s += atom(CX, CY, 'K', { r: 22, kind: 'warn', size: 13 });
    s += text(CX + 26, CY - 16, '+', { cls: 'fg-warn', size: 15 });
    s += text(192, 356, 'every vertex between two oxygens is a CH₂', { cls: 'fg-sm', size: 9.5 });
    s += text(192, 374, 'six lone pairs, all pointing at the same ion', { cls: 'fg-sm', size: 9.5 });
    s += text(192, 396, 'the ring is a solvent shell you can weigh out', { cls: 'fg-tag', size: 10.5 });

    // ---------------- the sizes, drawn to scale ----------------
    s += panel(392, 16, 360, 220);
    s += tag(572, 42, 'WHY IT PICKS K⁺ AND NOT Na⁺');
    const SCALE = 26;   // pixels per angstrom of DIAMETER
    const circleAt = (x, y, dia, label, kind) => {
      const r = (dia * SCALE) / 2;
      let g = kind === 'cavity'
        ? `<circle class="fg-dash" cx="${x}" cy="${y}" r="${r}" fill="none"></circle>`
        : `<circle class="${kind === 'k' ? 'fg-fill-warn' : 'fg-fill-hi'}" cx="${x}" cy="${y}" r="${r}" opacity="0.5"></circle>`;
      g += text(x, y + 4, label, { cls: 'fg-lbl', size: 11 });
      return g;
    };
    s += circleAt(470, 128, 2.7, '', 'cavity');
    s += text(470, 132, 'cavity', { cls: 'fg-sm', size: 9.5 });
    s += text(470, 186, '≈ 2.7 Å across', { cls: 'fg-sm', size: 9.5 });
    s += circleAt(572, 128, 2.66, 'K⁺', 'k');
    s += text(572, 186, '2.66 Å — fills it', { cls: 'fg-tag-good', size: 10 });
    s += circleAt(672, 128, 1.9, 'Na⁺', 'na');
    s += text(672, 186, '1.9 Å — rattles', { cls: 'fg-tag-warn', size: 10 });
    s += text(572, 212, 'Diameters, drawn to the same scale.', { cls: 'fg-sm', size: 9.5 });

    // ---------------- what it is for ----------------
    s += panel(392, 252, 360, 162);
    s += tag(572, 278, 'AND WHAT THAT BUYS YOU');
    s += text(572, 306, 'KF is insoluble in benzene.', { cls: 'fg-lbl', size: 11.5 });
    s += text(572, 330, 'Crown the K⁺ and the ion pair dissolves —', { cls: 'fg-sm', size: 10 });
    s += text(572, 348, 'and the fluoride comes with it, neither', { cls: 'fg-sm', size: 10 });
    s += text(572, 366, 'solvated nor held to its cation.', { cls: 'fg-sm', size: 10 });
    s += text(572, 392, 'a NAKED anion: a far better nucleophile', { cls: 'fg-tag-good', size: 10.5 });
    return s;
  },
  caption: 'What "size-selective" actually looks like. Six ether oxygens held in one ring point all of their lone pairs into the middle, and an ion of the right size is wrapped by the lot of them at once — the ring doing, as a single molecule, the job a shell of solvent molecules normally does.',
  note: 'The middle panel is the argument, and the numbers in it are <b>diameters</b>: a 2.7 Å hole against a 2.66 Å potassium ion and a 1.9 Å sodium one. Potassium fills the cavity and contacts all six oxygens; sodium sits in a hole too big for it and touches fewer of them at a time, which is why the binding is so much weaker. The payoff is the anion left behind: unsolvated, uncoupled from its cation, and far more nucleophilic than the same ion in water.',
});

export default FIGURES;
