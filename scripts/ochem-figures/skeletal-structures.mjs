/* Figures for the skeletal-structures notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ 8 ---
   One molecule, three notations, so the rules can be read off by comparison
   rather than taken on trust. */
FIGURES.push({
  id: 'skeletal-notation',
  section: 'skeletal-structures',
  anchor: '<h3>Four rules, and the third is the one people get wrong</h3>',
  alt: 'Butan-1-ol drawn as a full Lewis structure, condensed, and skeletal, with the implied carbons and hydrogens marked',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    // ---- Lewis ----
    s += tag(130, 40, 'FULL LEWIS');
    const lx = [46, 102, 158, 214], ly = 104;
    for (let i = 0; i < 4; i++) {
      if (i) s += bond(P(lx[i - 1], ly), P(lx[i], ly), { rFrom: 13, rTo: 13 });
      s += atom(lx[i], ly, 'C', { r: 13, size: 11 });
      // Hydrogens above and below, and three on the first carbon.
      s += bond(P(lx[i], ly), P(lx[i], ly - 38), { rFrom: 13, rTo: 11 });
      s += atom(lx[i], ly - 38, 'H', { r: 11, size: 10 });
      s += bond(P(lx[i], ly), P(lx[i], ly + 38), { rFrom: 13, rTo: 11 });
      s += atom(lx[i], ly + 38, 'H', { r: 11, size: 10 });
    }
    s += bond(P(lx[0], ly), P(lx[0] - 40, ly), { rFrom: 13, rTo: 11 });
    s += atom(lx[0] - 40, ly, 'H', { r: 11, size: 10 });
    s += bond(P(lx[3], ly), P(lx[3] + 42, ly), { rFrom: 13, rTo: 13 });
    s += atom(lx[3] + 42, ly, 'O', { r: 13, size: 11 });
    s += bond(P(lx[3] + 42, ly), P(lx[3] + 42, ly - 38), { rFrom: 13, rTo: 11 });
    s += atom(lx[3] + 42, ly - 38, 'H', { r: 11, size: 10 });
    s += text(130, 176, '15 symbols to say one molecule', { cls: 'fg-sm', size: 10 });

    s += rule(300, 34, 300, 300);

    // ---- Condensed ----
    s += tag(400, 40, 'CONDENSED');
    s += label(400, 108, 'CH₃CH₂CH₂CH₂OH', { size: 15 });
    s += text(400, 140, 'shorter, but the shape is gone', { cls: 'fg-sm', size: 10 });

    s += rule(500, 34, 500, 300);

    // ---- Skeletal ----
    s += tag(630, 40, 'SKELETAL');
    const pts = [P(540, 118), P(576, 96), P(612, 118), P(648, 96), P(684, 118)];
    for (let i = 1; i < pts.length; i++) s += bond(pts[i - 1], pts[i], { rFrom: 0, rTo: i === pts.length - 1 ? 14 : 0 });
    s += atom(684, 118, 'OH', { r: 15, size: 10.5 });
    // Mark the implied carbons and their implied hydrogens.
    for (let i = 0; i < 4; i++) {
      s += atom(pts[i].x, pts[i].y, '', { kind: 'point' });
      const above = i % 2 === 1;
      s += text(pts[i].x, pts[i].y + (above ? -16 : 26), i === 0 ? 'CH₃' : 'CH₂', { cls: 'fg-sm', size: 9.5 });
    }
    // Centred on the column, and short enough that the rendered width stays
    // inside the canvas — the bounds test checks anchor points, not glyphs.
    s += text(618, 176, 'every corner and end is a carbon', { cls: 'fg-sm', size: 10 });
    s += text(618, 192, 'H = whatever is left of four', { cls: 'fg-sm', size: 10 });
    s += text(618, 214, 'the O and its H are always drawn', { cls: 'fg-tag-good', size: 10.5 });

    s += rule(34, 244, 726, 244);
    s += text(380, 272, 'Same molecule, butan-1-ol. The hydrogens did not disappear — they became', { cls: 'fg-lbl', size: 12 });
    s += text(380, 294, 'something you work out, which is cheaper than something you read.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Butan-1-ol three ways. The skeletal drawing on the right contains exactly the same information as the Lewis structure on the left — it has simply moved the boring half of it into rules you apply rather than symbols you read.',
  note: 'Note what stayed visible. The oxygen is drawn and its hydrogen is drawn, while nine hydrogens on carbon are not. That is not inconsistency: an O–H hydrogen is acidic, hydrogen bonds, and gets removed by base, so it is part of the chemistry; a C–H hydrogen on a chain almost never is. The notation hides what does not matter and keeps what does.',
});

/* ---------------------------------------------------------------- 100 ---
   Skeletal structures taught the rule "subtract the drawn bonds from four"
   and then worked one example in prose. The count is the whole skill, and a
   count is exactly the kind of claim that is easier to check on a drawing
   than to follow in a sentence — especially the multiple-bond case, where
   the number of lines and the number of bonds stop being the same thing. */
FIGURES.push({
  id: 'skeletal-h-count',
  section: 'skeletal-structures',
  anchor: '<p>Put it together: CH₃–CH(OH)–CH₂–CH₂–CH₃, pentan-2-ol. The whole read is one pass, and the hydrogens were never guessed — they were subtracted.</p>',
  alt: 'Pentan-2-ol and 2-methylbut-2-ene drawn skeletally with the bond count and hydrogen count written under every carbon',
  viewBox: '0 0 760 290',
  build() {
    let s = '';

    // ---- Pentan-2-ol: single bonds only ----
    s += tag(174, 40, 'ALL SINGLE BONDS');
    const a = [P(70, 150), P(122, 122), P(174, 150), P(226, 122), P(278, 150)];
    for (let i = 1; i < a.length; i++) s += bond(a[i - 1], a[i], { rFrom: 0, rTo: 0 });
    s += bond(a[1], P(122, 74), { rFrom: 0, rTo: 15 });
    s += atom(122, 74, 'OH', { kind: 'hi', size: 10.5 });
    for (const pt of a) s += atom(pt.x, pt.y, '', { kind: 'point' });
    const aH = ['1 bond', '3 bonds', '2 bonds', '2 bonds', '1 bond'];
    const aN = ['CH₃', 'CH', 'CH₂', 'CH₂', 'CH₃'];
    for (let i = 0; i < a.length; i++) {
      s += text(a[i].x, 196, aH[i], { cls: 'fg-sm', size: 9.5 });
      s += text(a[i].x, 214, aN[i], { cls: 'fg-tag-good', size: 10.5 });
    }
    s += text(174, 242, 'C₅H₁₂O — the OH is one of that carbon’s four', { cls: 'fg-sm', size: 10 });

    s += rule(390, 34, 390, 262);

    // ---- 2-methylbut-2-ene: the double bond eats two of the four ----
    s += tag(530, 40, 'WITH A DOUBLE BOND');
    const b = [P(460, 150), P(512, 122), P(564, 122), P(616, 150)];
    s += bond(b[0], b[1], { rFrom: 0, rTo: 0 });
    s += bond(b[1], b[2], { rFrom: 0, rTo: 0, order: 2 });
    s += bond(b[2], b[3], { rFrom: 0, rTo: 0 });
    s += bond(b[1], P(512, 74), { rFrom: 0, rTo: 0 });
    for (const pt of b) s += atom(pt.x, pt.y, '', { kind: 'point' });
    s += atom(512, 74, '', { kind: 'point' });
    s += text(512, 62, '3 H', { cls: 'fg-tag-good', size: 10.5 });
    const bH = ['1 bond', '4 bonds', '3 bonds', '1 bond'];
    const bN = ['3 H', 'no H', '1 H', '3 H'];
    for (let i = 0; i < b.length; i++) {
      s += text(b[i].x, 196, bH[i], { cls: 'fg-sm', size: 9.5 });
      s += text(b[i].x, 214, bN[i], { cls: 'fg-tag-good', size: 10.5 });
    }
    s += text(530, 242, 'C₅H₁₀ — a C=C is two of the four', { cls: 'fg-sm', size: 10 });

    s += rule(34, 262, 726, 262);
    s += text(380, 282, 'Count bonds at the vertex, subtract from four, the rest is hydrogen.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The hydrogen count written out under every carbon of two molecules. Nothing here is remembered &mdash; each number is four minus the bonds you can see at that vertex.',
  note: 'The right-hand molecule is where the rule earns its keep. The carbon carrying the methyl has three lines drawn at it but four bonds, because one of those lines is a double bond; it therefore carries no hydrogen at all. Read lines and you get it wrong, read bonds and you get it right, and the difference only ever shows up at a multiple bond &mdash; which is to say, at every carbonyl and every alkene in the rest of the book.',
});

/* ---------------------------------------------------------------- 101 ---
   Rings, and the five-bond slip. The notes name a bare hexagon, a benzene
   and a pitfall in prose, and three bank questions depend on telling the
   first two apart. The pitfall in particular is a drawing error, so it is
   drawn: the wrong structure beside the right one, with the count. */
FIGURES.push({
  id: 'skeletal-rings',
  section: 'skeletal-structures',
  anchor: '<h3>Rings, and why they are the clearest case for the notation</h3>',
  alt: 'A bare hexagon read as cyclohexane, benzene drawn with alternating double bonds and with a circle, and a vertex carbon wrongly redrawn with five bonds',
  viewBox: '0 0 760 300',
  build() {
    let s = '';
    const hex = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const t = (Math.PI / 180) * (90 + i * 60);
        pts.push(P(cx + r * Math.cos(t), cy - r * Math.sin(t)));
      }
      return pts;
    };
    const ringSkeleton = (pts) => {
      let g = '';
      for (let i = 0; i < 6; i++) g += bond(pts[i], pts[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      for (const pt of pts) g += atom(pt.x, pt.y, '', { kind: 'point' });
      return g;
    };

    // ---- Cyclohexane ----
    s += tag(118, 44, 'A BARE HEXAGON');
    const h1 = hex(118, 140, 50);
    s += ringSkeleton(h1);
    s += text(118, 218, 'six corners, six carbons', { cls: 'fg-sm', size: 10 });
    s += text(118, 236, 'two H on each: C₆H₁₂', { cls: 'fg-tag-good', size: 10.5 });
    s += text(118, 256, 'cyclohexane', { cls: 'fg-lbl', size: 12 });

    s += rule(236, 34, 236, 274);

    // ---- Benzene, both conventions ----
    s += tag(378, 44, 'BENZENE, TWO WAYS');
    const h2 = hex(316, 140, 44);
    s += ringSkeleton(h2);
    for (const i of [0, 2, 4]) s += ringDouble(h2[i], h2[(i + 1) % 6], P(316, 140));
    const h3 = hex(440, 140, 44);
    s += ringSkeleton(h3);
    s += `<circle class="fg-bond" cx="440" cy="140" r="26" fill="none"></circle>`;
    s += text(378, 218, 'alternating double bonds, or a circle', { cls: 'fg-sm', size: 10 });
    s += text(378, 236, 'one H on each: C₆H₆', { cls: 'fg-tag-good', size: 10.5 });
    s += text(378, 256, 'same molecule, two conventions', { cls: 'fg-lbl', size: 12 });

    s += rule(520, 34, 520, 274);

    // ---- The five-bond slip ----
    s += tag(630, 44, 'THE FIVE-BOND SLIP');
    s += text(630, 78, '2 bonds + 2 H = 4 ✓', { cls: 'fg-tag-good', size: 10.5 });
    const ok = [P(586, 118), P(630, 94), P(674, 118)];
    for (let i = 1; i < ok.length; i++) s += bond(ok[i - 1], ok[i], { rFrom: 0, rTo: 0 });
    for (const pt of ok) s += atom(pt.x, pt.y, '', { kind: 'point' });
    const bad = [P(586, 178), P(630, 154), P(674, 178)];
    for (let i = 1; i < bad.length; i++) s += bond(bad[i - 1], bad[i], { rFrom: 0, rTo: i === 1 ? 15 : 0 });
    s += bond(bad[1], bad[2], { rFrom: 15, rTo: 0 });
    s += atom(586, 178, '', { kind: 'point' });
    s += atom(674, 178, '', { kind: 'point' });
    s += atom(630, 154, 'CH₃', { kind: 'warn', size: 9.5 });
    s += text(630, 202, '2 bonds + 3 H = 5 ✗', { cls: 'fg-tag-warn', size: 10.5 });
    s += text(630, 228, 'the vertex is already a carbon,', { cls: 'fg-sm', size: 10 });
    s += text(630, 244, 'so writing CH₃ on it adds a bond', { cls: 'fg-sm', size: 10 });
    s += text(630, 260, 'that was never there', { cls: 'fg-sm', size: 10 });

    s += rule(34, 274, 726, 274);
    s += text(380, 292, 'A ring vertex is read exactly like a chain vertex.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'Three things the prose can only assert: what a bare hexagon means, the two accepted ways of marking benzene, and what going wrong looks like.',
  note: 'The circle inside the ring is the honest drawing &mdash; benzene has no alternating single and double bonds, it has one delocalized system and six identical C&ndash;C bonds. The alternating-bond drawing survives because you can push arrows on it and because it lets you count hydrogens the ordinary way; the circle cannot do either. Both appear in exams, and neither is wrong to write.',
});

export default FIGURES;
