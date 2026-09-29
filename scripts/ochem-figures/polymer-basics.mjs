/* Figures for the polymer-basics notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- 48 ---
   The chapter's first claim is that one count predicts the material. Three
   monomers, three outcomes, drawn as what each can connect to. */
FIGURES.push({
  id: 'sites-decide',
  section: 'polymer-basics',
  anchor: '<h3>Addition polymerization: one active end</h3>',
  viewBox: '0 0 760 300',
  alt: 'One reactive site giving a single bond, two giving a chain and three giving a cross-linked network',
  build() {
    let s = '';
    const col = (ox, n, title, out, kind) => {
      s += panel(ox, 48, 220, 130, { kind });
      s += tag(ox + 110, 36, title);
      const cx = ox + 110, cy = 110;
      s += atom(cx, cy, 'M', { kind: kind === 'warn' ? 'warn' : 'hi' });
      const dirs = [[0, -40], [0, 40], [-46, 26]];
      for (let i = 0; i < n; i++) {
        const [dx, dy] = dirs[i];
        s += bond(P(cx, cy), P(cx + dx, cy + dy), { rTo: 13 });
        s += atom(cx + dx, cy + dy, 'M', {});
      }
      s += text(ox + 110, 202, out, { cls: kind === 'warn' ? 'fg-tag' : 'fg-tag-good', size: 11.5 });
    };
    col(24,  1, 'one reactive site',   'a small molecule, and it stops', 'warn');
    col(270, 2, 'two reactive sites',  'a chain — a thermoplastic', null);
    col(516, 3, 'three or more',       'a network — a thermoset',   null);

    s += rule(24, 232, 700, 232);
    s += text(360, 258, 'Counting the reactive groups on ONE monomer predicts the material,', { cls: 'fg-lbl', size: 12 });
    s += text(360, 280, 'before any mechanism has been written down.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The count that runs the whole chapter. One reactive site makes a single bond and stops; two extends a line; three or more ties the lines to each other in every direction, which is what a network is. Count one functional group per site for a step-growth monomer, and count one C=C as <b>two</b> sites for a chain-growth one — one of its carbons carries the chain arriving and the other becomes the new active center. Counted that way a vinyl monomer has two sites, and divinylbenzene, with two C=C, is the cross-linker.',
  note: 'The consequence reaches all the way to the end of the material’s life. Separate chains are held to each other by intermolecular forces, so heat lets them slide and a thermoplastic can be melted and remolded. A network is one covalent molecule, so heating it breaks bonds rather than loosening them — and a thermoset cannot be recycled by melting at all.',
});

/* ----------------------------------------------------------------- 73 ---
   The chapter's central drawing operation — open the pi bond and bracket
   what is left, or join two groups and take the water out — was never once
   drawn. Three rows, monomer on the left and repeat unit on the right. */
FIGURES.push({
  id: 'monomer-to-repeat-unit',
  section: 'polymer-basics',
  anchor: '<p class="step-body">Regiochemistry follows the same rule it always has: whichever end of the alkene gives the more stable intermediate is where the chain attaches. For a monosubstituted alkene that gives <b>head-to-tail</b> linking, with all the substituents on alternating carbons.</p>',
  viewBox: '0 0 760 510',
  alt: 'Ethylene and propylene each drawn with their double bond beside the bracketed repeat unit they give, and adipic acid with ethylene glycol drawn beside the bracketed polyester repeat unit with two waters leaving',
  build() {
    let s = '';
    /* A polymer bracket: the upright with two short arms turned toward the
       repeat unit, which is how a repeat unit is written by hand. */
    const brack = (x, y, h, dir) => {
      const t = y - h / 2, b = y + h / 2;
      return `<path class="fg-bond" d="M${x + 10 * dir} ${t} L${x} ${t} L${x} ${b} L${x + 10 * dir} ${b}"></path>`;
    };
    s += tag(380, 26, 'MONOMER IN, REPEAT UNIT OUT');

    /* Row 1 — ethylene. */
    const y1 = 86;
    s += atom(110, y1, 'CH₂', { r: 18 });
    s += atom(186, y1, 'CH₂', { r: 18 });
    s += bond(P(110, y1), P(186, y1), { order: 2, rFrom: 18, rTo: 18 });
    s += arrow(P(232, y1), P(308, y1), { muted: true });
    s += brack(346, y1, 54, 1);
    s += atom(398, y1, 'CH₂', { r: 18 });
    s += atom(474, y1, 'CH₂', { r: 18 });
    s += bond(P(346, y1), P(398, y1), { rFrom: 0, rTo: 18 });
    s += bond(P(398, y1), P(474, y1), { rFrom: 18, rTo: 18 });
    s += bond(P(474, y1), P(526, y1), { rFrom: 18, rTo: 0 });
    s += brack(526, y1, 54, -1);
    s += text(538, y1 + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(648, y1 - 4, 'polyethylene', { cls: 'fg-tag-good', size: 11 });
    s += text(648, y1 + 14, 'same atoms, nothing lost', { cls: 'fg-sm', size: 9.5 });
    s += text(270, y1 + 40, 'the π bond opens', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 148, 720, 148);

    /* Row 2 — propylene, and the carbon tacticity is about. */
    const y2 = 252;
    s += atom(110, y2, 'CH₂', { r: 18 });
    s += atom(186, y2, 'CH', { r: 16 });
    s += bond(P(110, y2), P(186, y2), { order: 2, rFrom: 18, rTo: 16 });
    s += atom(244, 196, 'CH₃', { r: 18 });
    s += bond(P(186, y2), P(244, 196), { rFrom: 16, rTo: 18 });
    s += arrow(P(300, y2), P(372, y2), { muted: true });
    s += brack(406, y2, 54, 1);
    s += atom(458, y2, 'CH₂', { r: 18 });
    s += atom(534, y2, 'CH', { kind: 'hi', r: 16 });
    s += atom(534, 196, 'CH₃', { r: 18 });
    s += bond(P(406, y2), P(458, y2), { rFrom: 0, rTo: 18 });
    s += bond(P(458, y2), P(534, y2), { rFrom: 18, rTo: 16 });
    s += bond(P(534, y2), P(534, 196), { rFrom: 16, rTo: 18 });
    s += bond(P(534, y2), P(586, y2), { rFrom: 16, rTo: 0 });
    s += brack(586, y2, 54, -1);
    s += text(598, y2 + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(672, y2 - 4, 'polypropylene', { cls: 'fg-tag-good', size: 11 });
    s += text(380, y2 + 44, 'the highlighted carbon is the one whose orientation along the chain tacticity describes', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 314, 720, 314);

    /* Row 3 — a step-growth pair, and the water that leaves. */
    const y3 = 362;
    s += atom(96, y3, 'HO₂C', { kind: 'hi', r: 23, size: 9 });
    s += atom(180, y3, '(CH₂)₄', { r: 26, size: 9 });
    s += atom(266, y3, 'CO₂H', { kind: 'hi', r: 23, size: 9 });
    s += bond(P(96, y3), P(180, y3), { rFrom: 23, rTo: 26 });
    s += bond(P(180, y3), P(266, y3), { rFrom: 26, rTo: 23 });
    s += text(318, y3 + 5, '+', { cls: 'fg-lbl', size: 14 });
    s += atom(374, y3, 'HO', { kind: 'hi', r: 18 });
    s += atom(452, y3, 'CH₂CH₂', { r: 29, size: 9 });
    s += atom(528, y3, 'OH', { kind: 'hi', r: 18 });
    s += bond(P(374, y3), P(452, y3), { rFrom: 18, rTo: 29 });
    s += bond(P(452, y3), P(528, y3), { rFrom: 29, rTo: 18 });
    s += text(648, y3 - 4, 'adipic acid, ethylene glycol', { cls: 'fg-tag', size: 10.5 });
    s += text(648, y3 + 14, 'two sites on each monomer', { cls: 'fg-sm', size: 9.5 });

    const y4 = 434;
    s += arrow(P(56, y4), P(126, y4), { muted: true });
    s += text(91, y4 - 12, '− 2 H₂O', { cls: 'fg-sm', size: 10 });
    s += brack(160, y4, 54, 1);
    s += atom(200, y4, 'O', { r: 15 });
    s += atom(268, y4, 'CH₂CH₂', { r: 29, size: 9 });
    s += atom(338, y4, 'O', { r: 15 });
    s += atom(396, y4, 'CO', { kind: 'hi', r: 17 });
    s += atom(466, y4, '(CH₂)₄', { r: 26, size: 9 });
    s += atom(536, y4, 'CO', { kind: 'hi', r: 17 });
    s += bond(P(160, y4), P(200, y4), { rFrom: 0, rTo: 15 });
    s += bond(P(200, y4), P(268, y4), { rFrom: 15, rTo: 29 });
    s += bond(P(268, y4), P(338, y4), { rFrom: 29, rTo: 15 });
    s += bond(P(338, y4), P(396, y4), { rFrom: 15, rTo: 17 });
    s += bond(P(396, y4), P(466, y4), { rFrom: 17, rTo: 26 });
    s += bond(P(466, y4), P(536, y4), { rFrom: 26, rTo: 17 });
    s += bond(P(536, y4), P(580, y4), { rFrom: 17, rTo: 0 });
    s += brack(580, y4, 54, -1);
    s += text(592, y4 + 22, 'n', { cls: 'fg-lbl', size: 12, anchor: 'start' });
    s += text(668, y4 - 4, 'a polyester', { cls: 'fg-tag-good', size: 11 });
    s += text(668, y4 + 14, 'lighter than its monomers', { cls: 'fg-sm', size: 9.5 });
    s += text(380, 496, 'One water leaves per ester made, so the repeat unit no longer weighs what the monomers did.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The whole chapter’s drawing skill in three rows. For an alkene, open the π bond and bracket what is left; for a step-growth pair, join the two groups and take the water out. The bracket with a bond leaving each side is the notation: it means this piece continues in both directions.',
  note: 'Count the atoms across each arrow and the diagnostic falls out on its own. Rows one and two lose nothing, so the repeat unit weighs exactly what its monomer did. Row three is lighter than its two monomers by one water for every ester bond it contains — two of them, for this repeat unit — and that difference is the only evidence you need that a small molecule was expelled.',
});

/* --------------------------------------------------------------- 76b ---
   The section describes three ways to start a chain and draws only the
   radical one, so the two ionic chain ends — the ones whose stability
   decides which monomers each method can touch — were prose. */
FIGURES.push({
  id: 'ionic-chain-ends',
  section: 'polymer-basics',
  anchor: 'and adding a second monomer afterwards extends every chain into a block copolymer.</li>\n</ul>',
  viewBox: '0 0 760 400',
  alt: 'Two propagation steps drawn with curved arrows: a carbocation chain end of polyisobutylene attacked by the double bond of another isobutylene to give a new tertiary cation, and a carbanion chain end stabilized by a nitrile adding to acrylonitrile to give a new stabilized carbanion',
  build() {
    let s = '';
    const head2 = (y, a, b) => {
      s += tag(48, y - 48, a, { anchor: 'start' });
      s += text(48, y - 30, b, { cls: 'fg-sm', size: 9.5, anchor: 'start' });
    };

    /* 1. Cationic: the chain end is a tertiary carbocation. */
    head2(110, 'CATIONIC — THE END IS A CARBOCATION', 'isobutylene');
    s += atom(88, 110, '~CH₂', { r: 23, size: 9 });
    s += atom(160, 110, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += bond(P(88, 110), P(160, 110), { rFrom: 23, rTo: 32 });
    s += text(186, 78, '+', { cls: 'fg-tag-warn', size: 14 });
    s += text(218, 115, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(256, 110, 'CH₂', { r: 18 });
    s += atom(330, 110, 'C(CH₃)₂', { r: 32, size: 9 });
    s += bond(P(256, 110), P(330, 110), { order: 2, rFrom: 18, rTo: 32 });
    s += curve(P(293, 90), P(192, 92), { bow: -16 });
    s += arrow(P(388, 110), P(448, 110), { muted: true });
    s += atom(492, 110, '~CH₂', { r: 23, size: 9 });
    s += atom(564, 110, 'C(CH₃)₂', { r: 32, size: 9 });
    s += atom(632, 110, 'CH₂', { r: 18 });
    s += atom(704, 110, 'C(CH₃)₂', { r: 32, size: 9, kind: 'warn' });
    s += bond(P(492, 110), P(564, 110), { rFrom: 23, rTo: 32 });
    s += bond(P(564, 110), P(632, 110), { rFrom: 32, rTo: 18 });
    s += bond(P(632, 110), P(704, 110), { rFrom: 18, rTo: 32 });
    s += text(730, 78, '+', { cls: 'fg-tag-warn', size: 14 });
    s += text(380, 162, 'the π bond attacks the cation, and the cation that results is tertiary again — two methyls donating into it', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 186, 720, 186);

    /* 2. Anionic: the chain end is a carbanion the nitrile can hold. */
    head2(300, 'ANIONIC — THE END IS A CARBANION', 'acrylonitrile');
    s += atom(88, 300, '~CH₂', { r: 23, size: 9 });
    s += atom(154, 300, 'CHCN', { r: 25, size: 9, kind: 'warn' });
    s += bond(P(88, 300), P(154, 300), { rFrom: 23, rTo: 25 });
    s += text(180, 332, '−', { cls: 'fg-tag-warn', size: 15 });
    s += lonePair(154, 300, 300, { dist: 30 });
    s += text(206, 305, '+', { cls: 'fg-lbl', size: 13 });
    s += atom(244, 300, 'CH₂', { r: 18 });
    s += atom(312, 300, 'CHCN', { r: 25, size: 9 });
    s += bond(P(244, 300), P(312, 300), { order: 2, rFrom: 18, rTo: 25 });
    s += curve(P(172, 284), P(238, 280), { bow: -14 });
    s += curve(P(278, 282), P(306, 272), { bow: -10 });
    s += arrow(P(378, 300), P(438, 300), { muted: true });
    s += atom(482, 300, '~CH₂', { r: 23, size: 9 });
    s += atom(548, 300, 'CHCN', { r: 25, size: 9 });
    s += atom(614, 300, 'CH₂', { r: 18 });
    s += atom(680, 300, 'CHCN', { r: 25, size: 9, kind: 'warn' });
    s += bond(P(482, 300), P(548, 300), { rFrom: 23, rTo: 25 });
    s += bond(P(548, 300), P(614, 300), { rFrom: 25, rTo: 18 });
    s += bond(P(614, 300), P(680, 300), { rFrom: 18, rTo: 25 });
    s += text(704, 270, '−', { cls: 'fg-tag-warn', size: 15 });
    s += text(380, 352, 'the carbanion adds to the CH₂ end, so the new negative charge lands next to the nitrile that can delocalize it', { cls: 'fg-sm', size: 9.5 });
    s += rule(40, 372, 720, 372);
    s += text(380, 394, 'Same anatomy as the radical chain — only the charge on the end differs.', { cls: 'fg-lbl', size: 11.5 });
    return s;
  },
  caption: 'The two ionic propagation steps, drawn with the full-headed arrows that move a <b>pair</b> of electrons — the difference from the radical figure is not cosmetic. Each new chain end is the same kind of ion the old one was, which is the whole requirement: the monomer has to be able to stabilize that charge, or the chain stops.',
  note: 'Read each row backwards to see why the monomer lists differ. A cation needs electron density pushed toward it, so isobutylene (two methyls) and vinyl ethers (an oxygen lone pair) work and acrylonitrile does not; an anion needs electron density pulled away, so acrylonitrile, methyl methacrylate and styrene work and isobutylene does not. Nothing terminates the second row on its own — two carbanions repel rather than pair — which is why the anionic chain end stays alive after the monomer is gone.',
});

export default FIGURES;
