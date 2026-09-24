/* Figures for the naming-rings-unsaturation notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';

const FIGURES = [];

/* ------------------------------------------------------------------ A4 ---
   Numbering a ring has no left end to start from, and the section says so
   and then asks the reader to go round "in whichever direction gives the
   lowest locants". Two rings numbered in opposite directions is that
   sentence made checkable. */
FIGURES.push({
  id: 'ring-numbering-direction',
  section: 'naming-rings-unsaturation',
  anchor: '<h3>Cis, trans, E and Z \u2014 a forward reference</h3>',
  alt: 'One methylcyclohexene numbered clockwise and counterclockwise, both giving the double bond carbons 1 and 2 and the methyl 3 or 6',
  viewBox: '0 0 760 376',
  build() {
    let s = '';
    /* Vertex 0 is the top; the double bond runs from vertex 0 to vertex 1 and
       the methyl sits on vertex 2, so it is adjacent to an alkene carbon.
       `order` lists which locant each vertex receives, which is the only
       thing that differs between the two panels. */
    const ring = (cx, order) => {
      const v = [];
      for (let i = 0; i < 6; i++) {
        const ang = (-90 + i * 60) * Math.PI / 180;
        v.push(P(cx + Math.cos(ang) * 56, 170 + Math.sin(ang) * 56));
      }
      let t = '';
      for (let i = 0; i < 6; i++) {
        if (i === 0) t += ringDouble(v[i], v[1], P(cx, 170));
        else t += bond(v[i], v[(i + 1) % 6], { rFrom: 0, rTo: 0 });
      }
      // The methyl stub points straight out from the center.
      const m = v[2];
      const ux = (m.x - cx) / 56, uy = (m.y - 170) / 56;
      t += bond(m, P(m.x + ux * 38, m.y + uy * 38), { rFrom: 0, rTo: 16 });
      t += atom(m.x + ux * 38, m.y + uy * 38, 'CH\u2083', { r: 16 });
      // Locants sit inside the ring, where the methyl cannot collide with them.
      for (let i = 0; i < 6; i++) {
        const ux2 = (v[i].x - cx) / 56, uy2 = (v[i].y - 170) / 56;
        t += text(cx + ux2 * 33, 170 + uy2 * 33 + 4, String(order[i]), { cls: 'fg-lbl', size: 11 });
      }
      return t;
    };

    /* The pair is centered on the part of the canvas the reading column
       actually shows, not on the canvas: the right-hand panel carries the
       answer and past about 0.9 of the width it is behind a scroll. */
    s += panel(44, 76, 248, 196, { kind: 'warn' });
    s += tag(168, 64, 'round one way');
    s += ring(168, [2, 1, 6, 5, 4, 3]);

    s += panel(404, 76, 248, 196, { kind: 'hi' });
    s += tag(528, 64, 'round the other');
    s += ring(528, [1, 2, 3, 4, 5, 6]);

    s += text(168, 298, 'methyl lands on C6', { cls: 'fg-sm', size: 10 });
    s += text(168, 320, '6-methylcyclohex-1-ene', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(528, 298, 'methyl lands on C3', { cls: 'fg-sm', size: 10 });
    s += text(528, 320, '3-methylcyclohex-1-ene', { cls: 'fg-tag-good', size: 11.5 });

    s += rule(34, 336, 662, 336);
    s += text(348, 360, 'Both give the double bond 1 and 2. Only the methyl separates them, and 3 beats 6.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The same methylcyclohexene, numbered in both directions. A ring has no end to start from, so the double bond is placed first \u2014 it takes C1 and C2 either way \u2014 and the direction is then settled by whichever substituent is left.',
  note: 'Note the order of operations, which is the same one chains use. The double bond is the senior feature present, so it fixes the locant pair before the methyl is consulted at all; the methyl only chooses between the two numberings that survive. Had the ring carried an \u2013OH, the OH would have taken C1 and the double bond would have had to accept whatever locant followed.',
});

/* ---------------------------------------------------------------- N6 ---
   "The parent must contain the double bond" is the multiple-bond version of
   "the parent must contain the principal group", and the section stated the
   second and not the first. Same two-trace layout, so the reader sees it is
   the same rule. */
FIGURES.push({
  id: 'alkene-parent-contains',
  section: 'naming-rings-unsaturation',
  anchor: '<h3>The parent chain must contain the double bond</h3>',
  alt: 'One alkene traced twice. Left: the six-carbon chain, the longest in the molecule, with the C=CH2 hanging off its third carbon; named 3-methylidenehexane and marked as not the textbook answer. Right: the five-carbon chain that starts at the CH2 of the double bond, numbered so the double bond is C1 to C2 and the ethyl is on C2; named 2-ethylpent-1-ene.',
  viewBox: '0 0 720 390',
  build() {
    let s = '';
    const skeleton = (ox, traced, nums, extra) => {
      const a = zig(ox + 50, 174, 6, 36, 22);
      const ch2 = P(a[2].x, a[2].y + 44);
      const links = [['a0', a[0], a[1]], ['a1', a[1], a[2]], ['a2', a[2], a[3]], ['a3', a[3], a[4]], ['a4', a[4], a[5]]];
      let t = '';
      for (const [, p, q] of links) t += sk(p, q);
      for (const [k, p, q] of links) if (traced.includes(k)) t += sk(p, q, true);
      t += bond(a[2], ch2, { order: 2, rFrom: 0, rTo: 0, cls: traced.includes('db') ? 'fg-bond-hi' : 'fg-bond', gap: 3.5 });
      for (const [x, y, v] of nums) t += text(ox + x, y, v, { cls: 'fg-lbl', size: 11 });
      for (const [x, y, v, anchor] of extra) t += text(ox + x, y, v, { cls: 'fg-sm', size: 9.5, anchor: anchor || 'middle' });
      return t;
    };
    s += panel(20, 64, 300, 224, { kind: 'warn' });
    s += tag(170, 52, 'the longest chain in the molecule');
    s += skeleton(26, ['a0', 'a1', 'a2', 'a3', 'a4'],
      [[50, 130, '1'], [86, 130, '2'], [122, 130, '3'], [158, 130, '4'], [194, 130, '5'], [230, 130, '6']],
      [[144, 224, 'the C=C is off the chain', 'start']]);

    s += panel(370, 64, 300, 224, { kind: 'hi' });
    s += tag(520, 52, 'the longest chain through the C=C');
    s += skeleton(376, ['a2', 'a3', 'a4', 'db'],
      [[122, 130, '2'], [158, 130, '3'], [194, 130, '4'], [230, 130, '5'], [104, 224, '1']],
      [[68, 130, 'ethyl']]);

    s += rule(20, 300, 670, 300);
    s += text(170, 322, 'six carbons — but the double bond is a branch', { cls: 'fg-sm', size: 10 });
    s += text(170, 344, '3-methylidenehexane', { cls: 'fg-tag-warn', size: 11.5 });
    s += text(170, 364, 'not what a textbook or exam expects', { cls: 'fg-sm', size: 9.5 });
    s += text(520, 322, 'five carbons — shorter, and it contains the C=C', { cls: 'fg-sm', size: 10 });
    s += text(520, 344, '2-ethylpent-1-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(520, 364, 'the double bond takes the suffix and C1', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'One alkene, two candidate parents. The six-carbon chain is the longest path through the skeleton and the textbook rule still rejects it, because the double bond is not on it. The five-carbon chain that starts at the CH₂ is the parent, the double bond takes C1, and the two carbons left over are an ethyl.',
  note: 'This is the same shape of argument as the alcohol that lost its longest chain in the previous section, and it is worth seeing that it is the same rule: the feature that sets the suffix has to be on the parent. The 2013 IUPAC recommendations relaxed this for multiple bonds (they now let chain length win, which is where the left-hand name comes from), but every current textbook and exam still applies it, so apply it.',
});

/* ---------------------------------------------------------------- N7 ---
   cis and trans but-2-ene, which the prose describes as "methyls on the same
   side" and "on opposite sides" without a drawing. It is a geometric claim. */
FIGURES.push({
  id: 'cis-trans-but-2-ene',
  section: 'naming-rings-unsaturation',
  anchor: 'The name so far cannot tell them apart.</p>',
  alt: 'Two skeletal drawings of but-2-ene. In cis-but-2-ene both methyl carbons sit below the double bond, on the same side; in trans-but-2-ene one sits below and one above, on opposite sides.',
  viewBox: '0 0 720 262',
  build() {
    let s = '';
    const butene = (cx, cy, trans) => {
      const c1 = P(cx - 52, cy + 22), c2 = P(cx - 18, cy + 2), c3 = P(cx + 18, cy + 2), c4 = P(cx + 52, trans ? cy - 18 : cy + 22);
      let t = sk(c1, c2) + bond(c2, c3, { order: 2, rFrom: 0, rTo: 0, cls: 'fg-bond-hi', gap: 3.5 }) + sk(c3, c4);
      t += text(c1.x - 4, c1.y + 18, 'methyl', { cls: 'fg-sm', size: 9.5 });
      t += text(c4.x + 4, trans ? c4.y - 8 : c4.y + 18, 'methyl', { cls: 'fg-sm', size: 9.5 });
      t += text(c2.x, c2.y - 12, '2', { cls: 'fg-lbl', size: 11 });
      t += text(c3.x, c3.y - 12, '3', { cls: 'fg-lbl', size: 11 });
      return t;
    };
    s += panel(40, 44, 300, 150, { kind: 'hi' });
    s += tag(190, 32, 'same side');
    s += butene(190, 110, false);
    s += text(190, 216, 'cis-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(190, 236, 'both methyls below the C=C', { cls: 'fg-sm', size: 9.5 });

    s += panel(380, 44, 300, 150, { kind: 'hi' });
    s += tag(530, 32, 'opposite sides');
    s += butene(530, 110, true);
    s += text(530, 216, 'trans-but-2-ene', { cls: 'fg-tag-good', size: 11.5 });
    s += text(530, 236, 'one methyl below, one above', { cls: 'fg-sm', size: 9.5 });
    return s;
  },
  caption: 'Two compounds that the name but-2-ene does not distinguish. The double bond between C2 and C3 cannot rotate, so a methyl drawn below it stays below it, and "both below" and "one below, one above" are different molecules with different boiling points, not two drawings of one.',
  note: 'Read the prefix off the drawing: find the two groups that are not hydrogen, one on each alkene carbon, and ask whether they are on the same side of the double bond. Same side is <i>cis</i>, opposite is <i>trans</i>. When one of the alkene carbons carries two groups that are not hydrogen the words stop being enough, which is what the E/Z system is for.',
});

/* ---------------------------------------------------------------- N8 ---
   ortho, meta, para: three hexagons is all it needs, and the prose had
   none. Drawn as the xylenes, which is the example the text uses. */
FIGURES.push({
  id: 'ortho-meta-para',
  section: 'naming-rings-unsaturation',
  anchor: 'and the words mean exactly what they mean here.</p>',
  alt: 'Three benzene rings, each with two methyl groups: adjacent (ortho, 1,2-dimethylbenzene), separated by one ring carbon (meta, 1,3-dimethylbenzene), and directly across the ring (para, 1,4-dimethylbenzene).',
  viewBox: '0 0 720 280',
  build() {
    let s = '';
    const R = 36, D = 60;
    const ring = (cx, cy, subs) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (-90 + i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += sk(pts[i], pts[(i + 1) % 6]);
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="21"></circle>`;
      for (const sb of subs) {
        const a = (-90 + sb.v * 60) * Math.PI / 180;
        const ox = cx + Math.cos(a) * D, oy = cy + Math.sin(a) * D;
        g += bond(pts[sb.v], P(ox, oy), { rFrom: 0, rTo: 16 });
        g += atom(ox, oy, 'CH₃', { kind: 'hi' });
        // The locant sits beside the substituent bond rather than on it:
        // 30 degrees round from the bond, just outside the ring.
        const b = a + Math.PI / 6;
        g += text(cx + Math.cos(b) * 50, cy + Math.sin(b) * 50 + 4, sb.n, { cls: 'fg-lbl', size: 11 });
      }
      return g;
    };
    const cases = [
      { cx: 124, word: 'ortho', pos: '1,2', name: 'o-xylene = 1,2-dimethylbenzene', subs: [{ v: 0, n: '1' }, { v: 1, n: '2' }] },
      { cx: 360, word: 'meta', pos: '1,3', name: 'm-xylene = 1,3-dimethylbenzene', subs: [{ v: 0, n: '1' }, { v: 2, n: '3' }] },
      { cx: 596, word: 'para', pos: '1,4', name: 'p-xylene = 1,4-dimethylbenzene', subs: [{ v: 0, n: '1' }, { v: 3, n: '4' }] },
    ];
    for (const c of cases) {
      s += panel(c.cx - 112, 28, 224, 200);
      s += ring(c.cx, 114, c.subs);
      s += text(c.cx, 214, `${c.word}  (${c.pos})`, { cls: 'fg-tag-good', size: 11 });
      s += text(c.cx, 252, c.name, { cls: 'fg-sm', size: 10 });
    }
    return s;
  },
  caption: 'The three ways to put two groups on a benzene ring, shown for two methyls. <i>ortho</i> is next door, <i>meta</i> has one ring carbon between them, <i>para</i> is straight across; the locant pairs 1,2, 1,3 and 1,4 say the same thing in numbers, and both forms are in constant use.',
  note: 'There are only three because the ring is symmetric: a 1,5 relationship is the same as 1,3 counted the other way round, and 1,6 is 1,2. Whichever of the two groups you call C1, the other lands on 2, 3 or 4, and that is the whole vocabulary.',
});

/* ---------------------------------------------------------------- N9 ---
   Phenyl against benzyl. "Changes the molecule by a carbon" is the whole
   claim, and one extra vertex on a drawing makes it in a glance. */
FIGURES.push({
  id: 'phenyl-vs-benzyl',
  section: 'naming-rings-unsaturation',
  anchor: 'Confusing the two changes the molecule by a carbon, and both words are in constant use.</div>',
  alt: 'Two benzene rings as substituents. Phenyl is the ring attached directly through one of its own carbons, six carbons in all. Benzyl is the same ring attached through a CH2 carbon that sits between the ring and the parent, seven carbons in all; the extra carbon is highlighted.',
  viewBox: '0 0 720 250',
  build() {
    let s = '';
    const R = 34;
    const ring = (cx, cy) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * 60) * Math.PI / 180;
        pts.push(P(cx + Math.cos(a) * R, cy + Math.sin(a) * R));
      }
      let g = '';
      for (let i = 0; i < 6; i++) g += sk(pts[i], pts[(i + 1) % 6]);
      g += `<circle class="fg-bond" cx="${cx}" cy="${cy}" r="20"></circle>`;
      return { g, right: pts[0] };
    };
    // Phenyl
    {
      const cx = 166, cy = 116; s += panel(40, 40, 300, 150);
      s += tag(190, 28, 'phenyl: the ring itself');
      const r = ring(cx, cy); s += r.g;
      const A = P(r.right.x + 40, cy);
      s += sk(r.right, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      s += text(190, 212, 'phenyl, C₆H₅–  ·  six carbons', { cls: 'fg-tag-good', size: 11 });
    }
    // Benzyl
    {
      const cx = 484, cy = 116; s += panel(380, 40, 300, 150);
      s += tag(530, 28, 'benzyl: the ring plus one CH₂');
      const r = ring(cx, cy); s += r.g;
      const ch2 = P(r.right.x + 34, cy - 20), A = P(ch2.x + 34, cy);
      s += sk(r.right, ch2) + sk(ch2, A, true) + atom(A.x, A.y, '', { kind: 'hi', r: 5 });
      s += atom(ch2.x, ch2.y, '', { kind: 'warn', r: 6 });
      s += text(ch2.x + 2, ch2.y - 14, 'CH₂', { cls: 'fg-tag-warn', size: 10 });
      s += text(530, 212, 'benzyl, C₆H₅CH₂–  ·  seven carbons', { cls: 'fg-tag-good', size: 11 });
    }
    s += text(360, 240, 'The dot is the bond to the rest of the molecule.', { cls: 'fg-sm', size: 10 });
    return s;
  },
  caption: 'Phenyl and benzyl, which are one carbon apart and are both used constantly. Phenyl is the benzene ring bonded directly through a ring carbon. Benzyl is the ring plus a CH₂, bonded through that CH₂, so the ring is one bond further away from whatever it is attached to.',
  note: 'The reason the words matter beyond spelling is that the CH₂ in a benzyl group is the benzylic carbon, and the chemistry at that carbon (in <a class="chapter-ref" href="/ochem/learn.html#m-aromatic-breadth">Aromatic Follow-Through</a>) is nothing like the chemistry at a ring carbon. Benzyl alcohol is PhCH₂OH, a primary alcohol; phenol is PhOH, and is not an alcohol at all.',
});

export default FIGURES;
