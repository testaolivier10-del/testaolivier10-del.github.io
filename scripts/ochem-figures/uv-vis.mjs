/* Figures for the uv-vis notes page (and its lesson). Built by
   scripts/build-ochem-figures.mjs; see the header there. */
import { atom, bond, wedge, hash, arrow, curve, lonePair, text, tag, label, rule, panel, bar, P } from '../lib/ochem-figure.mjs';
import { zig, sk, ringDouble, polyPts, polyRing, locant, benzene } from '../lib/ochem-skeletal.mjs';
import { center, armEnd, skDouble, plus, lobeE, frame, n2 } from '../lib/ochem-helpers.mjs';

const FIGURES = [];

/* ----------------------------------------------------------------- B5 ---
   The table gives four wavelengths; what the section is really claiming is
   that they march in one direction and eventually cross into visible light.
   A number line says both at once, and puts the 200 nm instrument limit and
   the 400 nm color threshold on the same axis as the data. */
FIGURES.push({
  id: 'lambda-ladder',
  section: 'uv-vis',
  anchor: '<h3>Why conjugation eventually produces color</h3>',
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
      { nm: 171, y: 100, name: 'Ethene',            n: '1 conjugated C=C' },
      { nm: 217, y: 146, name: 'Buta-1,3-diene',    n: '2' },
      { nm: 258, y: 100, name: 'Hexa-1,3,5-triene', n: '3' },
      { nm: 450, y: 100, name: '\u03b2-Carotene',   n: '11' },
    ];
    for (const m of marks) {
      s += rule(x(m.nm), m.y + 20, x(m.nm), 200);
      s += text(x(m.nm), m.y, m.name, { cls: 'fg-lbl', size: 12 });
      s += text(x(m.nm), m.y - 21, `${m.nm} nm`, { cls: 'fg-tag-good', size: 11 });
      s += text(x(m.nm), m.y + 14, m.n, { cls: 'fg-sm', size: 9.5 });
    }

    // The two band labels sit inside their bands, clear of the stems.
    s += text(x(175), 214, 'out of range', { cls: 'fg-tag-warn', size: 10 });
    s += text(x(455), 214, 'visible region', { cls: 'fg-tag-good', size: 10.5 });
    s += text(x(175), 268, 'a lone C=C absorbs here', { cls: 'fg-sm', size: 10 });
    s += text(x(450), 268, 'here the compound has a color', { cls: 'fg-sm', size: 10 });

    s += rule(20, 286, 670, 286);
    s += text(345, 308, 'Each double bond added to the conjugation narrows the gap, so \u03bb\u2098\u2090\u2093 moves right.', { cls: 'fg-lbl', size: 12 });
    return s;
  },
  caption: 'The four compounds from the table, placed on the axis they actually differ along. An isolated double bond absorbs off the left-hand end of the accessible range; each double bond joined to the conjugation moves the absorption to the right, and with eleven of them \u03b2-carotene has walked all the way into visible light.',
  note: 'The two shaded bands are why this technique is a conjugation detector rather than a general one. Below about 200 nm an ordinary instrument cannot look, so a lone alkene is invisible; past 400 nm the molecule is removing visible light and the compound has a color \u2014 \u03b2-carotene absorbs blue near 450 nm, which is why what reaches your eye is orange. A colorless organic compound is a compound whose \u03c0 system stopped short of the right-hand band.',
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
  anchor: 'when you see a strongly colored organic compound, extended conjugation is the first thing to look for.</p>',
  alt: 'An absorbance-versus-wavelength plot from 180 to 400 nanometres. A tall broad band peaks at 217 nanometres for buta-1,3-diene, a second taller band peaks further right at 258 nanometres for hexa-1,3,5-triene, and a very small bump near 280 nanometers marks the weak n to pi-star transition of a ketone.',
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
    s += `<line class="fg-dash" x1="${X(217).toFixed(1)}" y1="100" x2="${X(217).toFixed(1)}" y2="260"></line>`;
    s += `<line class="fg-dash" x1="${X(258).toFixed(1)}" y1="85" x2="${X(258).toFixed(1)}" y2="260"></line>`;
    s += trace(280, 18, 12, 'fg-bond-soft');
    s += trace(217, 14, 160, 'fg-bond');
    s += trace(258, 16, 175, 'fg-bond-hi');

    /* Centred over its own peak: anchored at the left it ran back across the
       absorbance axis and the arrowhead sat inside the word. */
    s += text(X(217), 92, 'buta-1,3-diene, 217 nm', { cls: 'fg-lbl', size: 11.5 });
    s += text(X(258) + 10, 72, 'hexa-1,3,5-triene, 258 nm', { cls: 'fg-tag-good', size: 11.5, anchor: 'start' });
    /* The weak band is the ketone n → π* one, so it belongs at 280 nm, where
       the prose puts acetone. A leader runs from the label down to it, because
       at ε ≈ 20 the bump itself is a few pixels tall. */
    s += `<line class="fg-dash" x1="${X(280).toFixed(1)}" y1="216" x2="${X(280).toFixed(1)}" y2="248"></line>`;
    s += text(X(280) + 16, 192, 'n → π* of a ketone, 280 nm', { cls: 'fg-sm', size: 10, anchor: 'start' });
    s += text(X(280) + 16, 208, 'ε ≈ 20, so barely a ripple', { cls: 'fg-sm', size: 10, anchor: 'start' });

    s += text(566, 112, 'height is ε; position is λₘₐₓ', { cls: 'fg-tag', size: 11 });
    s += text(566, 130, 'and the two are independent', { cls: 'fg-sm', size: 10 });

    s += rule(30, 316, 706, 316);
    s += text(368, 338, 'Position says how long the conjugation is; height says how strongly it absorbs.', { cls: 'fg-lbl', size: 11.5 });
    s += text(368, 356, 'A UV band is broad because many vibrational levels take part in one transition.', { cls: 'fg-sm', size: 10.5 });
    return s;
  },
  caption: 'What the instrument actually prints. Each band is a single electronic transition, and λ<sub>max</sub> is read off the top of it. Adding one double bond to the conjugation moves the whole band 41 nm to the right — and, here, makes it taller as well.',
  note: 'The small bump near 280 nm is the part most students never meet, and it is the one that stops UV-Vis being read as "a long λ means a long chain". It is a lone pair on a carbonyl oxygen being promoted into the same π* orbital — an <b>n → π*</b> transition. It lands to the right of both π → π* bands here, and its ε is in the tens rather than the tens of thousands, because the two orbitals barely overlap. A big λ<sub>max</sub> with a tiny ε is a lone pair; a big λ<sub>max</sub> with a huge ε is a long conjugated system.',
});

export default FIGURES;
