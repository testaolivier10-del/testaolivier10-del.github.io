/* Figures for the uv-vis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ------------------------------------------------------------ gap ladder ---
   The notes argue that each added double bond narrows the HOMO-LUMO gap.
   Conjugated systems draws the full ladder; this one keeps only what UV-Vis
   reads off it: the gap, and the wavelength that goes with it. Levels are
   Huckel's (alpha +/- x*beta), 42 px per |beta| about y = 150, so the gap
   really does close from left to right. 340 wide so the lesson can use it. */
FIGURES.push({
  id: 'uv-gap-ladder',
  section: 'uv-vis',
  lessons: ['uv-vis'],
  anchor: 'the narrowest gap of the four.</p>',
  alt: 'Pi-orbital energy levels for ethene, buta-1,3-diene and hexa-1,3,5-triene side by side. The lower half of each ladder is filled with electron pairs. The HOMO and LUMO are highlighted with a double-headed arrow between them, and the arrow gets shorter from ethene to the triene, while the wavelength absorbed rises from 171 to 217 to 258 nanometers.',
  viewBox: '0 0 340 312',
  build() {
    let s = '';
    s += arrow(P(14, 236), P(14, 58));
    s += text(22, 58, 'energy', { cls: 'fg-tag', size: 11, anchor: 'start' });
    const Y = (x) => 150 - 42 * x;
    const cols = [
      { cx: 64, name: 'Ethene', lam: '171 nm', lv: [-1, 1] },
      { cx: 166, name: 'Buta-1,3-diene', lam: '217 nm', lv: [-1.618, -0.618, 0.618, 1.618] },
      { cx: 274, name: 'Hexa-1,3,5-triene', lam: '258 nm', lv: [-1.802, -1.247, -0.445, 0.445, 1.247, 1.802] },
    ];
    for (const c of cols) {
      const half = c.lv.length / 2;
      c.lv.forEach((x, i) => {
        const y = Y(x);
        const frontier = i === half - 1 || i === half;
        s += bond(P(c.cx - 30, y), P(c.cx + 30, y), { rFrom: 0, rTo: 0, cls: frontier ? 'fg-bond-hi' : 'fg-bond-soft' });
        if (i < half) {
          s += `<circle class="fg-lp" cx="${c.cx - 12}" cy="${y}" r="3.2"></circle>`;
          s += `<circle class="fg-lp" cx="${c.cx + 12}" cy="${y}" r="3.2"></circle>`;
        }
      });
      const hi = Y(c.lv[half - 1]), lo = Y(c.lv[half]);
      s += arrow(P(c.cx, hi - 5), P(c.cx, lo + 5), { size: 6 });
      s += arrow(P(c.cx, lo + 5), P(c.cx, hi - 5), { size: 6 });
      s += text(c.cx, 254, c.name, { cls: 'fg-tag', size: 11 });
      s += text(c.cx, 272, c.lam, { cls: 'fg-tag-good', size: 11 });
    }
    // Ethene's two rungs are the only ones with room to name.
    s += text(64, 98, 'LUMO', { cls: 'fg-tag', size: 11 });
    s += text(64, 210, 'HOMO', { cls: 'fg-tag', size: 11 });
    s += text(70, 154, 'gap', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += text(170, 300, 'Smaller gap, longer λmax', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'Only the highlighted rungs matter to UV-Vis: the HOMO and the LUMO. The arrow between them is the gap a photon must match, and it gets shorter with each double bond added.',
});

/* ------------------------------------------------------------ n -> pi* ---
   "The lone pair barely overlaps the pi*" is a claim about directions in
   space. Seen edge-on, the carbonyl's plane is a line: the pi* lobes stand
   above and below it, and the lone pairs lie along it. */
FIGURES.push({
  id: 'uv-n-pi-star',
  section: 'uv-vis',
  lessons: ['uv-vis'],
  anchor: 'against 10,000 and up for a π &rarr; π* band.</p>',
  alt: 'A carbonyl group seen edge-on, with the plane of the molecule as a dashed horizontal line. The pi-star orbital has lobes above and below the plane on both carbon and oxygen, with the phase reversed between the two atoms. The oxygen lone pairs lie along the plane, pointing away from carbon, at right angles to the pi-star lobes, so the two barely overlap and the n to pi-star band is weak.',
  viewBox: '0 0 340 300',
  build() {
    let s = '';
    const C = P(112, 160), O = P(182, 160);
    s += text(170, 30, 'π*: lobes above and below the plane', { cls: 'fg-lbl', size: 13 });
    s += text(170, 50, 'a C=O group, seen edge-on', { cls: 'fg-tag', size: 11 });
    // The plane line stops at the bonds: run through the C=O it reads as a third bond.
    s += `<line class="fg-dash" x1="20" y1="160" x2="60" y2="160"></line>`;
    s += `<line class="fg-dash" x1="268" y1="160" x2="324" y2="160"></line>`;
    s += text(18, 150, 'plane', { cls: 'fg-tag', size: 11, anchor: 'start' });
    // pi*: bigger on carbon, phase flips between the atoms
    s += lobeE(C.x, 114, 16, 30, 'fg-orb');
    s += lobeE(C.x, 206, 16, 30, 'fg-orb-alt');
    s += lobeE(O.x, 121, 12, 23, 'fg-orb-alt');
    s += lobeE(O.x, 199, 12, 23, 'fg-orb');
    // n: the lone pairs, along the plane
    s += `<ellipse class="fg-atom-warn" cx="232" cy="160" rx="34" ry="12" fill-opacity="0.5"></ellipse>`;
    // Both in-plane lone pairs project onto the plane line in this view.
    s += `<circle class="fg-lp" cx="220" cy="160" r="3.2"></circle>`;
    s += `<circle class="fg-lp" cx="230" cy="160" r="3.2"></circle>`;
    s += `<circle class="fg-lp" cx="244" cy="160" r="3.2"></circle>`;
    s += `<circle class="fg-lp" cx="254" cy="160" r="3.2"></circle>`;
    s += bond(P(60, 160), C, { rFrom: 0 });
    s += bond(C, O, { order: 2 });
    s += atom(C.x, C.y, 'C');
    s += atom(O.x, O.y, 'O');
    s += text(206, 196, 'n: lone pairs,', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(206, 214, 'in the plane', { cls: 'fg-lbl', size: 13, anchor: 'start' });
    s += text(170, 258, 'at right angles, so they barely overlap', { cls: 'fg-tag', size: 11 });
    s += text(170, 282, 'weak n → π* band, ε 10–100', { cls: 'fg-lbl', size: 13 });
    return s;
  },
  caption: 'Seen edge-on, the plane of the carbonyl group is the dashed line. Compare the directions of the two orbitals.',
});

/* ----------------------------------------------------- Woodward-Fieser ---
   The table's vocabulary (homoannular, heteroannular, ring residue,
   exocyclic) only means something on a drawn molecule. One diene of each
   kind, with every counted feature marked and the sum written under it. */
FIGURES.push({
  id: 'uv-wf-dienes',
  section: 'uv-vis',
  anchor: 'and the other outside it.</li>',
  alt: 'Three dienes with their Woodward-Fieser sums. Hexa-2,4-diene: base 217 plus two alkyl groups gives 227 nanometers. Cyclohexa-1,3-diene, both double bonds in one ring: base 253 plus two ring residues gives 263. A diene spread over two fused six-membered rings: base 214 plus three ring residues and one exocyclic double bond gives 234.',
  viewBox: '0 0 760 352',
  build() {
    let s = '';
    const dot = (p) => `<circle class="fg-atom-warn" cx="${n2(p.x)}" cy="${n2(p.y)}" r="5"></circle>`;
    const dbl = (a, b, inward) => ringDouble(a, b, inward, { inset: 7, gap: 4.6, cls: 'fg-bond-hi' });
    const rows = (cx, lines) => lines.map(([y, t, cls]) => text(cx, y, t, { cls, size: cls === 'fg-sm' ? 10.5 : cls === 'fg-lbl' ? 13 : 11 })).join('');

    // ---- A: acyclic ----
    s += panel(12, 12, 240, 310);
    s += text(132, 38, 'Acyclic diene', { cls: 'fg-lbl', size: 13 });
    s += text(132, 58, 'base 217 nm', { cls: 'fg-tag', size: 11 });
    const a = zig(52, 150, 6, 32, 22);
    s += sk(a[0], a[1]) + sk(a[4], a[5]);
    s += dbl(a[1], a[2], P((a[1].x + a[2].x) / 2, 180));
    s += sk(a[2], a[3], true);
    s += dbl(a[3], a[4], P((a[3].x + a[4].x) / 2, 180));
    s += dot(a[0]) + dot(a[5]);
    s += text(132, 196, 'hexa-2,4-diene', { cls: 'fg-sm', size: 10.5 });
    s += rows(132, [
      [230, '217 base', 'fg-lbl'],
      [252, '+ 2 alkyl groups × 5 = +10', 'fg-sm'],
      [294, 'predicted 227 nm', 'fg-tag-good'],
      [312, 'measured ≈ 227 nm', 'fg-sm'],
    ]);

    // ---- B: homoannular ----
    s += panel(260, 12, 240, 310);
    s += text(380, 38, 'Homoannular: one ring', { cls: 'fg-lbl', size: 13 });
    s += text(380, 58, 'base 253 nm', { cls: 'fg-tag', size: 11 });
    const bc = P(380, 138);
    const b = polyPts(bc.x, bc.y, 6, 40, 90);
    s += dbl(b[5], b[0], bc);
    s += sk(b[0], b[1], true);
    s += dbl(b[1], b[2], bc);
    s += sk(b[2], b[3]) + sk(b[3], b[4]) + sk(b[4], b[5]);
    s += dot(b[3]) + dot(b[4]);
    s += text(380, 206, 'cyclohexa-1,3-diene', { cls: 'fg-sm', size: 10.5 });
    s += rows(380, [
      [230, '253 base', 'fg-lbl'],
      [252, '+ 2 ring residues × 5 = +10', 'fg-sm'],
      [294, 'predicted 263 nm', 'fg-tag-good'],
      [312, 'measured ≈ 256 nm', 'fg-sm'],
    ]);

    // ---- C: heteroannular ----
    s += panel(508, 12, 240, 310);
    s += text(628, 38, 'Heteroannular: two rings', { cls: 'fg-lbl', size: 13 });
    s += text(628, 58, 'base 214 nm', { cls: 'fg-tag', size: 11 });
    const r = 34, lc = P(598, 132), rc = P(598 + r * Math.sqrt(3), 132);
    const L = polyPts(lc.x, lc.y, 6, r, 90), R = polyPts(rc.x, rc.y, 6, r, 90);
    // L[4] = R[2] is the lower fusion carbon, L[5] = R[1] the upper one.
    s += sk(L[0], L[1]) + sk(L[1], L[2]) + sk(L[4], L[5]) + sk(L[5], L[0]);
    s += dbl(L[2], L[3], lc);
    s += sk(L[3], L[4], true);
    s += dbl(R[2], R[3], rc);
    s += sk(R[3], R[4]) + sk(R[4], R[5]) + sk(R[5], R[0]) + sk(R[0], R[1]);
    s += dot(L[1]) + dot(L[5]) + dot(R[4]);
    const exo = P((L[4].x + R[3].x) / 2, (L[4].y + R[3].y) / 2);
    s += `<line class="fg-dash-hi" x1="${n2(exo.x + 3)}" y1="${n2(exo.y + 8)}" x2="${n2(exo.x + 10)}" y2="184"></line>`;
    s += text(exo.x + 12, 198, 'exocyclic C=C', { cls: 'fg-tag-warn', size: 11 });
    s += rows(628, [
      [230, '214 base', 'fg-lbl'],
      [252, '+ 3 ring residues × 5 = +15', 'fg-sm'],
      [272, '+ 1 exocyclic C=C = +5', 'fg-sm'],
      [294, 'predicted 234 nm', 'fg-tag-good'],
    ]);

    s += dot(P(206, 340));
    s += text(218, 344, 'marks each alkyl group or ring residue; the highlighted bonds are the diene.', { cls: 'fg-sm', size: 10.5, anchor: 'start' });
    return s;
  },
  caption: 'One diene of each kind. Count the marked carbons, add any exocyclic double bond, and the sum under each drawing follows.',
});

/* ----------------------------------------------------------------- B5 ---
   The table gives four wavelengths; what the section is really claiming is
   that they march in one direction and eventually cross into visible light.
   A number line says both at once, and puts the 200 nm instrument limit and
   the 400 nm color threshold on the same axis as the data. */
FIGURES.push({
  id: 'lambda-ladder',
  section: 'uv-vis',
  anchor: '<td>~450 nm</td></tr>',
  alt: 'A wavelength axis from 150 to 500 nanometers marking ethene at 171, buta-1,3-diene at 217, hexa-1,3,5-triene at 258 and beta-carotene near 450, with the visible region beginning at 400',
  viewBox: '0 0 760 330',
  build() {
    let s = '';
    /* The axis stops short of the canvas edge on purpose: drawn to 700 the
       500 tick and the label under the visible band were both behind the
       reading column's horizontal scroll. */
    const x = (nm) => 40 + ((nm - 150) / 350) * 620;

    // The two regions that bound the useful range.
    s += bar(x(150), 200, x(200) - x(150), 20, { kind: 'warn', opacity: 0.26, r: 4 });
    s += bar(x(400), 200, x(500) - x(400), 20, { kind: 'good', opacity: 0.26, r: 4 });

    s += rule(x(150), 220, x(500), 220);
    for (let nm = 150; nm <= 500; nm += 50) {
      s += rule(x(nm), 220, x(nm), 227);
      s += text(x(nm), 242, String(nm), { cls: 'fg-sm', size: 10 });
    }
    s += tag(340, 268, 'wavelength absorbed, \u03bb\u2098\u2090\u2093 (nm)');

    // Three lines per compound, then the stem starts below them: a stem drawn
    // from the label down to the axis otherwise runs straight through its own
    // caption, which reads as a struck-out word.
    const marks = [
      { nm: 171, y: 100, name: 'Ethene',            n: '1 C=C' },
      { nm: 217, y: 146, name: 'Buta-1,3-diene',    n: '2 C=C' },
      { nm: 258, y: 100, name: 'Hexa-1,3,5-triene', n: '3 C=C' },
      { nm: 450, y: 100, name: '\u03b2-Carotene',   n: '11 C=C' },
    ];
    for (const m of marks) {
      s += rule(x(m.nm), m.y + 20, x(m.nm), 200);
      s += text(x(m.nm), m.y, m.name, { cls: 'fg-lbl', size: 12 });
      s += text(x(m.nm), m.y - 21, `${m.nm} nm`, { cls: 'fg-tag-good', size: 11 });
      s += text(x(m.nm), m.y + 14, m.n, { cls: 'fg-sm', size: 9.5 });
    }

    // The two band labels sit inside their bands, clear of the stems.
    s += text(x(175), 214, 'out of range', { cls: 'fg-tag-warn', size: 10 });
    s += text(x(455), 214, 'visible (400\u2013700 nm) \u2192', { cls: 'fg-tag-good', size: 10.5 });
    s += text(x(175), 268, 'a lone C=C absorbs here', { cls: 'fg-sm', size: 10 });
    s += text(x(450), 268, 'here the compound has a color', { cls: 'fg-sm', size: 10 });

    s += rule(20, 286, 670, 286);
    s += text(345, 308, 'Each double bond added to the conjugation narrows the gap, so \u03bbmax moves right.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The four compounds from the table, placed on a wavelength axis. Look at the two shaded bands: the left one is out of an ordinary instrument\u2019s reach, and the right one is visible light.',
});

/* ----------------------------------------------------------------- B5a ---
   A UV-Vis section with no spectrum in it. The lambda-ladder figure puts
   compounds on a wavelength axis, which shows the RESULT of the argument;
   what the reader has never seen is the thing an instrument actually prints:
   an absorbance axis, a broad band, a peak you read lambda-max off, and a
   weak n->pi* transition sitting almost on the baseline beside it. */
FIGURES.push({
  id: 'uv-spectrum-trace',
  section: 'uv-vis',
  anchor: 'a lone pair, almost always a carbonyl.</li>\n</ul>',
  alt: 'An absorbance-versus-wavelength plot from 180 to 400 nanometres. A tall broad band peaks at 217 nanometres for buta-1,3-diene, a second taller band peaks further right at 258 nanometres for hexa-1,3,5-triene, and a very small bump near 280 nanometers, drawn magnified, marks the weak n to pi-star transition of a ketone.',
  viewBox: '0 0 760 364',
  build() {
    let s = '';
    const X = (nm) => 90 + ((nm - 180) / 220) * 590;
    const trace = (mu, sig, amp, cls) => {
      let d = '';
      for (let nm = 180; nm <= 400; nm += 2) {
        const y = Math.max(72, 260 - amp * Math.exp(-((nm - mu) ** 2) / (2 * sig * sig)));
        d += (nm === 180 ? 'M' : 'L') + X(nm).toFixed(1) + ' ' + y.toFixed(1);
      }
      return `<path class="${cls}" fill="none" d="${d}"></path>`;
    };

    // axes
    s += arrow(P(90, 262), P(90, 68));
    s += text(96, 62, 'absorbance', { cls: 'fg-tag', size: 11, anchor: 'start' });
    s += rule(90, 260, 690, 260);
    for (let nm = 200; nm <= 400; nm += 50) {
      s += rule(X(nm), 260, X(nm), 267);
      s += text(X(nm), 280, String(nm), { cls: 'fg-sm', size: 10 });
    }
    s += tag(390, 302, 'wavelength (nm)');

    // the two pi -> pi* bands, and the weak n -> pi* one
    s += `<line class="fg-dash" x1="${X(217).toFixed(1)}" y1="155" x2="${X(217).toFixed(1)}" y2="260"></line>`;
    s += `<line class="fg-dash" x1="${X(258).toFixed(1)}" y1="82" x2="${X(258).toFixed(1)}" y2="260"></line>`;
    s += trace(280, 18, 12, 'fg-bond-soft');
    s += trace(217, 14, 105, 'fg-bond');
    s += trace(258, 16, 178, 'fg-bond-hi');

    /* Centred over its own peak: anchored at the left it ran back across the
       absorbance axis and the arrowhead sat inside the word. */
    s += text(X(217), 146, 'buta-1,3-diene, 217 nm', { cls: 'fg-lbl', size: 11.5 });
    s += text(X(258) + 10, 72, 'hexa-1,3,5-triene, 258 nm', { cls: 'fg-lbl', size: 11.5, anchor: 'start' });
    /* The weak band is the ketone n → π* one, so it belongs at 280 nm, where
       the prose puts acetone. A leader runs from the label down to it, because
       at ε ≈ 20 the bump itself is a few pixels tall. */
    s += `<line class="fg-dash" x1="${X(280).toFixed(1)}" y1="216" x2="${X(280).toFixed(1)}" y2="248"></line>`;
    s += text(X(280) + 16, 192, 'n → π* of a ketone, 280 nm, ε ≈ 20', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(X(280) + 16, 208, 'drawn magnified: true size would not show', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(566, 112, 'position is λmax; height follows ε', { cls: 'fg-tag', size: 11 });
    s += text(566, 130, '(at equal concentration)', { cls: 'fg-sm', size: 10 });

    s += rule(30, 316, 706, 316);
    s += text(368, 338, 'Position says how long the conjugation is; height says how strongly it absorbs.', { cls: 'fg-lbl', size: 11.5 });
    s += text(368, 356, 'A band is broad because bond vibrations spread one jump over a range of energies.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What the instrument prints. Each band is one jump of an electron, and λ<sub>max</sub> is read off its top. One more conjugated double bond moves the whole band 41 nm to the right, and in this example also makes it taller.',
  note: 'Now find the ketone\u2019s n → π* band near 280 nm. It lies to the right of both π → π* bands, and even drawn magnified it barely rises off the baseline.',
});

export default FIGURES;
