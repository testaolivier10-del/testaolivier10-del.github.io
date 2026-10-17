/* ApStatTex (statistics/assets/stat-math.js): the course's TeX subset to
   MathML, the plain-text reading, $...$ in authored text, and the strict
   check the build and content check use. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tex as T } from '../lib/apstat-mathlib.mjs';
import { text } from '../lib/apstat-build.mjs';

const R = s => T.render(s, { strict: true });

test('textbook structures: fractions, powers, roots, integrals with limits, limits, primes', () => {
  assert.match(R('\\frac{a}{b}'), /<mfrac><mi>a<\/mi><mi>b<\/mi><\/mfrac>/);
  assert.match(R('x^2'), /<msup><mi>x<\/mi><mn>2<\/mn><\/msup>/);
  assert.match(R('x_{n+1}'), /<msub><mi>x<\/mi><mrow><mi>n<\/mi><mo>\+<\/mo><mn>1<\/mn><\/mrow><\/msub>/);
  assert.match(R('\\sqrt{x}'), /<msqrt><mi>x<\/mi><\/msqrt>/);
  assert.match(R('\\sqrt[3]{x}'), /<mroot><mi>x<\/mi><mn>3<\/mn><\/mroot>/);
  assert.match(R('\\int_0^1 x\\,dx'), /<msubsup><mo largeop="true"[^>]*>∫<\/mo><mn>0<\/mn><mn>1<\/mn><\/msubsup>/);
  assert.match(R('\\lim_{x \\to 2^-} f(x)'), /<munder><mo movablelimits="false">lim<\/mo><mrow><mi>x<\/mi><mo>→<\/mo><msup><mn>2<\/mn><mo>−<\/mo><\/msup><\/mrow><\/munder>/);
  assert.match(R('\\sum_{i=1}^{n} i'), /<munderover>/);
  assert.match(R("f'(x)"), /<mi>f<\/mi><mo lspace="0" rspace="0">′<\/mo>/);
  assert.match(R("f''(x)"), /″/);
  assert.match(R('\\frac{d}{dx}'), /<mfrac><mi>d<\/mi><mrow><mi>d<\/mi><mi>x<\/mi><\/mrow><\/mfrac>/);
  assert.match(R('\\frac{dy}{dx}'), /<mfrac><mrow><mi>d<\/mi><mi>y<\/mi><\/mrow>/);
  assert.match(R('\\sin^2 x'), /<msup><mi>sin<\/mi><mn>2<\/mn><\/msup><mo [^>]*>&#x2061;<\/mo>/);
  assert.match(R('\\left( \\frac{1}{2} \\right)'), /<mo fence="true" stretchy="true">\(<\/mo>/);
  assert.match(R('\\left. F(x) \\right|_0^2'), /<msubsup><mrow>.*\|<\/mo><\/mrow><mn>0<\/mn><mn>2<\/mn><\/msubsup>/);
  assert.match(R('f(x) = \\begin{cases} x^2 & x < 1 \\\\ 2x & x \\ge 1 \\end{cases}'), /<mtable columnalign="left left"[^>]*><mtr><mtd>.*<\/mtd><\/mtr><mtr>/);
  assert.match(R('\\text{area of } R'), /<mtext>area of <\/mtext>/, 'spaces in text survive');
  assert.match(R('x < 1'), /<mo>&lt;<\/mo>/, 'escaped');
  assert.match(R('a - b'), /<mo>−<\/mo>/, 'a real minus');
  assert.match(R('\\pi \\theta \\infty \\Delta x'), /π.*θ.*∞.*Δ/);
  // Every formula carries its TeX, which the ordering check reads.
  assert.match(R('\\int x\\,dx'), /<annotation encoding="application\/x-tex">\\int x\\,dx<\/annotation>/);
  assert.match(T.render('x', { display: true }), /<math class="stat-m" display="block">/);
});

test('strict mode refuses typos; loose mode shows them as text', () => {
  for (const bad of ['\\frak{a}{b}', '\\frac{a}{b', 'x^{2', '\\left( x', '\\begin{foo} x \\end{foo}', 'x}'])
    assert.throws(() => R(bad), T.Error, bad);
  assert.match(T.render('\\foo x'), /<mtext>\\foo<\/mtext>/);
  assert.deepEqual([...T.check('A $x^2$ and $\\int_0^1 f$.')], []);
  assert.equal(T.check('cost \\$5 and $x$').length, 0, 'a literal dollar');
  assert.match(T.check('a $x$ b $y').join(), /unmatched \$/);
  assert.match(T.check('$\\frak{1}{2}$').join(), /unknown command \\frak/);
});

test('$...$ in text, and the plain-text reading for titles and search', () => {
  const h = T.html('Cost \\$5, $x^2$ and $$\\int_0^1 f$$');
  assert.match(h, /^Cost \$5, <math class="stat-m"><semantics>/);
  assert.match(h, /<math class="stat-m" display="block">/);
  assert.equal(T.text('\\int_0^1 x^2\\,dx'), '∫ from 0 to 1 of x² dx');
  assert.equal(T.text('\\frac{x^2 - 4}{x - 2}'), '(x² − 4)/(x − 2)');
  assert.equal(T.text("f'(x) = 3x^2"), 'f′(x) = 3x²');
  assert.equal(T.text('\\sqrt{x + 1}'), '√(x + 1)');
  assert.equal(T.plain('Find $\\frac{d}{dx} x^2$ now'), 'Find d/dx x² now');
  // The generator's text() reads rendered math back as plain text.
  assert.equal(text(`<p>Find ${R('\\int_0^1 x\\,dx')}.</p>`), 'Find ∫ from 0 to 1 of x dx .');
});

test('a minus with nothing before it to subtract from is a sign, with no binary spacing', () => {
  const SIGN = '<mo form="prefix" lspace="0" rspace="0">−</mo>';
  for (const s of ['x = -2', '-x^2', 'f(-1)', '(1, -3)', 'x \\to -\\infty', 'x \\le -1', 'x^{-1}', '3 \\cdot -2', '|-2|', '= \\, -4'])
    assert.ok(R(s).includes(SIGN), s);
  for (const s of ['a - b', 'f(x) - 1', '(x + 1) - 2', '|x| - 1', "f'(x) - 1", 'x^2 - 4'])
    assert.ok(!R(s).includes(SIGN) && R(s).includes('<mo>−</mo>'), s);
  assert.match(R('x = -2'), /<mo>=<\/mo><mo form="prefix" lspace="0" rspace="0">−<\/mo><mn>2<\/mn>/);
  assert.match(R('\\lim_{x \\to 2^-} f(x)'), /<msup><mn>2<\/mn><mo>−<\/mo><\/msup>/, 'a one-sided limit mark is unchanged');
  assert.equal(T.text('x = -2'), 'x = −2');
  assert.equal(T.text('f(-1) = 3 - 4'), 'f(−1) = 3 − 4');
  assert.equal(T.text('-x^2 + 1'), '−x² + 1');
  assert.equal(T.text('x \\to -\\infty'), 'x → −∞');
});

test('statistics notation: accents, combinations, set symbols and the plain-text reading', () => {
  assert.match(T.render('\\hat{p}_1', { strict: true }), /<msub><mover accent="true"><mi>p<\/mi><mo stretchy="false">&#x005E;<\/mo><\/mover><mn>1<\/mn><\/msub>/);
  assert.match(T.render('\\bar{x}', { strict: true }), /<mover accent="true"><mi>x<\/mi><mo stretchy="true">&#x00AF;<\/mo><\/mover>/);
  assert.match(T.render('\\binom{10}{3}', { strict: true }), /<mfrac linethickness="0"><mn>10<\/mn><mn>3<\/mn><\/mfrac>/);
  for (const t of ['P(A \\cap B)', 'P(A \\cup B)', 'P(A \\mid B)', 'P(A^c)', 'H_0: p = 0.5', '\\chi^2', '\\mu_{\\bar{x}}', '\\sigma_{\\hat{p}}', 'p_c', '\\text{SE}', '\\text{IQR}', 'Q_1']) assert.equal(T.check(`$${t}$`).length, 0, t);
  assert.equal(T.text('\\hat{p}_1 - \\hat{p}_2'), 'p-hat_1 − p-hat_2', 'read the way Bluebook types it');
  assert.equal(T.text('\\bar{x}'), 'x-bar');
  assert.equal(T.text('\\binom{10}{3}'), '(10C3)');
});
