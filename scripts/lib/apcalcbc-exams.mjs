/* AP® Calculus BC Phase 3 (docs/apcalcbc-spec.md row 3): what BC adds to AB's
   exams, justification trainer, formula page and unit tests. AB's code
   (scripts/lib/apcalc-exams.mjs, apcalc-entry.mjs) reads these only when the
   course is BC (APCALC_COURSE=bc), so AB's output does not change.

     BC_JUSTIFY_SKILLS      the BC misses the trainer adds (framework.md section 7)
     CBC_EXAM_NUMBERS       every BC exam-only key, recomputed here
     CBC_JUSTIFY_NUMBERS    every number in a BC prompt, recomputed here
     BC_EQ, BC_NOT_ON       BC rows for the formula page, merged into AB's groups
     mergeEq(EQ, NOT_ON)    the BC formula page's groups and "easy to forget" lines
     loadUnitTests(dir)     calculus-bc/data/unit-tests.json: the free unit tests
                            chosen by hand for Units 9 and 10
     checkUnitTests(t, ctx) its rules

   The numerical work is our own (composite Simpson, bisection, a central
   difference, Euler steps), written apart from the scratch script that wrote
   the items, so a key that disagrees with the math fails the content check. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const BC_JUSTIFY_SKILLS = {
  series: 'Series: name the test, check its conditions, test both endpoints',
  error: 'Error bounds: which bound, why it applies, and the inequality',
  polar: 'Parametric, vector and polar set-ups: speed, position, the half and r squared',
};

/* ------------------------------------------------------------ numbers */
const simpson = (f, a, b, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
const bisect = (f, a, b) => { let fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
const zeros = (f, a, b, n = 4000) => { const out = [], h = (b - a) / n; for (let i = 0; i < n; i++) { const x0 = a + i * h; if (f(x0) * f(x0 + h) < 0) out.push(bisect(f, x0, x0 + h)); } return out; };
const dif = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const r3 = x => (Math.round(x * 1000) / 1000).toFixed(3);
const m3 = x => `$${r3(x)}$`;
const most = (f, xs, best) => xs.every(x => best === x || f(best) > f(x));

// Form 1: the particle in the plane (exam-1-s1).
const xp = t => 2 + Math.cos(t * t), yp = t => 3 * Math.sin(t);
const euler = (f, x, y, h, n) => { for (let i = 0; i < n; i++) { y += h * f(x, y); x += h; } return y; };
const g111 = x => x * x * Math.exp(-x / 2);
const c17 = zeros(x => 2 * Math.sin(x) - x * x / 2, 0.5, 3);
// Form 2: the polar curve r = θ + sin 2θ (exam-2-s1).
const pr = t => t + Math.sin(2 * t), prp = t => dif(pr, t);
const pdy = t => prp(t) * Math.sin(t) + pr(t) * Math.cos(t), pdx = t => prp(t) * Math.cos(t) - pr(t) * Math.sin(t);
const a24 = zeros(t => pr(t) - 1, 0.01, Math.PI);
const c26 = zeros(x => 2 * Math.cos(x) - x * x, -2, 2);
const P28 = t => 500 / (1 + 22 / 3 * Math.exp(-0.3 * t));
const mvt = (() => { const f = x => x + 2 * Math.cos(x), s = (f(3) - f(0)) / 3; return { s, c: zeros(x => dif(f, x) - s, 0, 3) }; })();
const f212 = x => Math.exp(x) * Math.cbrt(x + 7);

export const CBC_EXAM_NUMBERS = [
  // form 1
  { id: 'cbc-exam-1-01', key: m3(Math.hypot(xp(2), yp(2))) },
  { id: 'cbc-exam-1-02', key: m3(simpson(t => Math.hypot(xp(t), yp(t)), 0, 3)) },
  { id: 'cbc-exam-1-03', key: m3(1 + simpson(xp, 0, 3)) },                                        // x(0) + ∫ x'(t) dt
  { id: 'cbc-exam-1-04', key: m3(yp(1) / xp(1)), check: () => xp(1) !== 0 },
  { id: 'cbc-exam-1-05', key: m3(1 + 0.8 + 0.8 ** 2 / 2 + 0.8 ** 3 / 6) },                        // P3 for e^x at 0.8
  { id: 'cbc-exam-1-06', key: m3(simpson(x => Math.sqrt(1 + dif(t => t ** 3 / 3, x) ** 2), 0, 2)) },
  { id: 'cbc-exam-1-07', key: m3(simpson(x => 2 * Math.sin(x) - x * x / 2, 0, c17[0])), check: () => c17.length === 1 && 2 * Math.sin(1) > 0.5 },
  { id: 'cbc-exam-1-08', key: m3(euler((x, y) => x + Math.sin(y), 0, 1, 0.5, 3)) },
  // ∫₁^∞ dx/(x³ + 1): x = 1/u turns it into ∫₀¹ u/(1 + u³) du; a long finite interval agrees.
  { id: 'cbc-exam-1-09', key: m3(simpson(u => u / (1 + u ** 3), 0, 1)), check: () => Math.abs(simpson(x => 1 / (x ** 3 + 1), 1, 2000, 400000) + 1 / (2 * 2000 ** 2) - simpson(u => u / (1 + u ** 3), 0, 1)) < 1e-4 },
  { id: 'cbc-exam-1-10', key: m3(simpson(x => x * x * Math.log(x), 1, Math.E)), check: () => Math.abs(simpson(x => x * x * Math.log(x), 1, Math.E) - (2 * Math.E ** 3 + 1) / 9) < 1e-9 },
  { id: 'cbc-exam-1-11', key: m3(g111(4)), check: () => zeros(x => dif(g111, x), 0.5, 6).length === 1 && most(g111, [0, 4, 6], 4) },
  { id: 'cbc-exam-1-12', key: `${m3(dif(t => 70 + 30 * Math.exp(-0.2 * t), 3))} degrees Celsius per minute` },
  { id: 'cbc-exam-1-13', key: m3(dif(x => Math.exp(x) / (1 + Math.sin(x)), 1)) },
  // form 2
  { id: 'cbc-exam-2-01', key: m3(simpson(t => pr(t) ** 2, 0, Math.PI) / 2), check: () => zeros(pr, 0.01, Math.PI).length === 0 },
  { id: 'cbc-exam-2-02', key: m3(pdy(Math.PI / 4) / pdx(Math.PI / 4)) },
  { id: 'cbc-exam-2-03', key: `Toward, because $r > 0$ and $\\frac{dr}{d\\theta} \\approx ${r3(prp(1.5))} < 0$`, check: () => pr(1.5) > 0 && prp(1.5) < 0 },
  { id: 'cbc-exam-2-04', key: m3(simpson(t => pr(t) ** 2 - 1, a24[0], Math.PI) / 2), check: () => a24.length === 1 },
  { id: 'cbc-exam-2-05', key: m3(0.8 - 0.8 ** 3 / 3 + 0.8 ** 5 / 10) },                         // ∫ of 1 - t² + t⁴/2
  { id: 'cbc-exam-2-06', key: m3(Math.PI * simpson(x => (2 * Math.cos(x)) ** 2 - x ** 4, c26[0], c26[1])), check: () => c26.length === 2 && 2 * Math.cos(0) > 0 },
  { id: 'cbc-exam-2-07', key: m3(simpson(x => Math.sqrt(1 + (2 * x) ** 2), 0, 1.5)) },
  // fastest growth: where dP/dt is largest, found from the solution itself
  { id: 'cbc-exam-2-08', key: m3(zeros(t => dif(P28, t + 1e-3) - dif(P28, t - 1e-3), 0.5, 20)[0]), check: () => Math.abs(P28(Math.log(22 / 3) / 0.3) - 250) < 1e-9 },
  { id: 'cbc-exam-2-09', key: m3(simpson(x => 3 / (x * x - 1), 2, 5)) },
  { id: 'cbc-exam-2-10', key: m3(dif(x => simpson(t => Math.log(t) / (1 + t), 1, x * x, 4000), 1.5, 1e-4)) },
  { id: 'cbc-exam-2-11', key: m3(mvt.c[1]), check: () => mvt.c.length === 2 },
  { id: 'cbc-exam-2-12', key: m3(f212(1) + 0.2 * dif(f212, 1)) },
  { id: 'cbc-exam-2-13', key: m3(dif(x => x ** 3 * Math.sin(x / 2), 2)) },
];

// The BC prompts' numbers, each from the prompt's own data.
const lc = n => (2 * n + 1) / (n ** 3 + 4) / (1 / n ** 2);
export const CBC_JUSTIFY_NUMBERS = [
  { id: 'u6-improper-limit-notation', has: [`\\left(1 - \\frac{1}{b^2}\\right) = ${1 - 0}`] },
  { id: 'u7-euler-under-concave-up', has: [`1 + 0.5(${0 + 1}) = ${1 + 0.5 * (0 + 1)}`, `1.5 + 0.5(${0.5 + 1.5}) = ${1.5 + 0.5 * (0.5 + 1.5)}`] },
  { id: 'u9-speed-not-slope', has: [`x'(2) = 2(2) = ${2 * 2}`, `y'(2) = 2^2 - 3 = ${2 ** 2 - 3}`, `\\sqrt{${4 ** 2} + ${1 ** 2}} = \\sqrt{17}`] },
  { id: 'u9-position-adds-start', has: [`= 3 + (12 - 4) = ${3 + (3 * 2 ** 2 - 2 * 2)}`] },
  { id: 'u9-polar-petal-setup', has: [`\\frac{9\\pi}{8}`], check: () => Math.abs(simpson(t => (3 * Math.cos(2 * t)) ** 2, -Math.PI / 4, Math.PI / 4) / 2 - 9 * Math.PI / 8) < 1e-9 },
  { id: 'u9-polar-toward-origin', has: [`1 - \\sqrt{3} < 0`, `2\\sin\\frac{\\pi}{6} = ${Math.round(2 * Math.sin(Math.PI / 6))}`], check: () => 1 - 2 * Math.cos(Math.PI / 6) < 0 },
  { id: 'u10-limit-comparison', has: [`\\frac{2n^3 + n^2}{n^3 + 4} = ${Math.round(lc(1e7))}`] },
  { id: 'u10-alternating-bound-conditions', has: [`\\frac{1}{4^3} = \\frac{1}{${4 ** 3}} = ${1 / 4 ** 3}`] },
  { id: 'u10-ratio-test-limit', has: [`\\frac{(n + 1)^2}{3n^2} = \\frac{1}{3}`], check: () => Math.abs((1e7 + 1) ** 2 / (3 * 1e14) - 1 / 3) < 1e-6 },
  { id: 'u10-lagrange-max-interval', has: [`\\frac{3}{8}\\cdot\\frac{${0.4 ** 3 >= 0.064 - 1e-12 ? '0.064' : 'x'}}{6} = ${+(3 / 8 * 0.4 ** 3 / 6).toFixed(6)}`] },
  { id: 'u10-interval-endpoints', has: [`\\frac{|x - 2|}{3}`, `$[-1, 5)$`] },
];

/* --------------------------------------------------------- formula page */
const D = String.raw;
// Rows to add to AB's groups (by AB group id), then BC's own groups.
export const BC_EQ = {
  integrals: [
    [D`\int u\,dv = uv - \int v\,du`, D`Integration by parts, the product rule run backward.`, D`A product such as $x e^x$, $x\sin x$ or $\ln x$: choose $u$ to get simpler when differentiated. For a definite integral, evaluate $uv$ at both limits.`, 'Unit 6', 'integration-by-parts', ['integration-methods']],
    [D`\frac{A}{x - a} + \frac{B}{x - b}`, D`Partial fractions for $\frac{p(x)}{(x - a)(x - b)}$ with distinct linear factors (divide first if the top has the same or higher degree).`, D`A rational function whose denominator factors into distinct linear factors; each piece integrates to a logarithm.`, 'Unit 6', 'partial-fractions', ['integration-methods']],
    [D`\int_a^{\infty} f(x)\,dx = \lim_{b \to \infty} \int_a^b f(x)\,dx`, D`An improper integral, defined as a limit; it converges when the limit is a finite number.`, D`An infinite limit of integration, or an integrand that is unbounded at an endpoint. Keep the limit notation to the end; never substitute $\infty$.`, 'Unit 6', 'improper-integrals', ['integration-methods']],
  ],
  des: [
    [D`y_{n+1} = y_n + \Delta x \cdot \frac{dy}{dx}\Big|_{(x_n,\, y_n)}`, D`Euler's method: step along the tangent line with the slope at the current point.`, D`Approximating a solution value from a differential equation and a starting point. Concave up: the steps land below the curve (underestimate); concave down: above.`, 'Unit 7', 'eulers-method', ['euler-logistic']],
    [D`\frac{dP}{dt} = kP\left(1 - \frac{P}{L}\right)`, D`Logistic growth with carrying capacity $L$ and $k > 0$.`, D`$P \to L$ as $t \to \infty$ for $P(0) > 0$; $P$ grows fastest when $P = \frac{L}{2}$.`, 'Unit 7', 'logistic-models', ['euler-logistic']],
  ],
  area: [
    [D`\int_a^b \sqrt{1 + \left(f'(x)\right)^2}\,dx`, D`The length of the graph of $y = f(x)$ from $x = a$ to $x = b$.`, D`Arc length of a function's graph; for a curve given by $x = g(y)$, use $\sqrt{1 + \left(g'(y)\right)^2}\,dy$.`, 'Unit 8', 'arc-length'],
  ],
};
export const BC_GROUPS = [
  { id: 'parametric', h: 'Parametric, vector and polar', rows: [
    [D`\frac{dy}{dx} = \frac{dy/dt}{dx/dt}, \quad \frac{dx}{dt} \ne 0`, 'The slope of a parametric curve.', 'Tangent lines: horizontal where $\\frac{dy}{dt} = 0$ and $\\frac{dx}{dt} \\ne 0$; vertical where $\\frac{dx}{dt} = 0$ and $\\frac{dy}{dt} \\ne 0$.', 'Unit 9', 'parametric-derivatives', ['parametric-motion']],
    [D`\frac{d^2y}{dx^2} = \frac{\frac{d}{dt}\left(\frac{dy}{dx}\right)}{dx/dt}`, 'The second derivative of a parametric curve.', 'Concavity of a parametric curve. Divide by $\\frac{dx}{dt}$ again; the derivative of $\\frac{dy}{dx}$ with respect to $t$ is not enough.', 'Unit 9', 'parametric-second-derivatives', ['parametric-motion']],
    [D`\int_a^b \sqrt{\left(x'(t)\right)^2 + \left(y'(t)\right)^2}\,dt`, 'Arc length of a parametric curve, and the distance a particle travels.', 'Distance traveled in the plane: integrate the speed.', 'Unit 9', 'parametric-arc-length', ['parametric-motion']],
    [D`\left|\mathbf{v}(t)\right| = \sqrt{\left(x'(t)\right)^2 + \left(y'(t)\right)^2}`, 'Speed, the length of the velocity vector $\\mathbf{v}(t) = \\left\\langle x\'(t), y\'(t) \\right\\rangle$.', 'Speed of a particle in the plane. It is a magnitude; $\\frac{dy}{dx}$ is the slope of the path, not the speed.', 'Unit 9', 'planar-motion', ['parametric-motion']],
    [D`x(b) = x(a) + \int_a^b x'(t)\,dt`, 'Position from velocity, one component at a time.', 'The position at a later time: add the known position to the integral of each velocity component.', 'Unit 9', 'vector-integrals', ['parametric-motion']],
    [D`x = r\cos\theta, \quad y = r\sin\theta`, 'From polar to rectangular coordinates.', 'Every polar derivative starts here: $\\frac{dy}{dx} = \\frac{dy/d\\theta}{dx/d\\theta}$ with $r$ a function of $\\theta$.', 'Unit 9', 'polar-derivatives', ['polar-lab']],
    [D`\frac{1}{2}\int_{\alpha}^{\beta} r^2\,d\theta`, 'The area swept by a polar curve from $\\theta = \\alpha$ to $\\theta = \\beta$.', 'Polar area. Square $r$, keep the $\\frac{1}{2}$, and find the limits where the curve meets the origin ($r = 0$) or another curve.', 'Unit 9', 'polar-area', ['polar-lab']],
    [D`\frac{1}{2}\int_{\alpha}^{\beta} \left(R^2 - r^2\right)d\theta`, 'The area between an outer polar curve $R$ and an inner curve $r$.', 'Square each radius on its own; $(R - r)^2$ is wrong. The limits come from where the curves meet.', 'Unit 9', 'polar-area-between', ['polar-lab']],
  ] },
  { id: 'series', h: 'Series tests', rows: [
    [D`\sum_{n=0}^{\infty} ar^n = \frac{a}{1 - r}, \quad |r| < 1`, 'A geometric series: it converges when $|r| < 1$ and diverges when $|r| \\ge 1$.', 'Sums of series with a constant ratio, and the comparison series for many tests.', 'Unit 10', 'geometric-series', ['series-lab']],
    [D`\lim_{n \to \infty} a_n \ne 0 \Rightarrow \sum a_n \ \text{diverges}`, 'The nth term test, for divergence only.', 'A first check. If the terms do approach 0, this test says nothing.', 'Unit 10', 'nth-term-test', ['series-lab']],
    [D`\sum_{n=1}^{\infty} \frac{1}{n^p} \ \text{converges when}\  p > 1`, 'The $p$-series; with $p = 1$ it is the harmonic series, which diverges.', 'The comparison series for terms that behave like a power of $n$.', 'Unit 10', 'p-series', ['series-lab']],
    [D`\sum_{n=1}^{\infty} a_n \ \text{and}\ \int_1^{\infty} f(x)\,dx`, 'The integral test: both converge or both diverge, when $a_n = f(n)$ with $f$ positive, continuous and decreasing.', 'Terms that are a function you can integrate. State the three conditions on $f$.', 'Unit 10', 'integral-test', ['series-lab']],
    [D`0 < \lim_{n \to \infty} \frac{a_n}{b_n} < \infty`, 'The limit comparison test, for positive terms: $\\sum a_n$ and $\\sum b_n$ do the same thing. (Direct comparison: $0 \\le a_n \\le b_n$ and $\\sum b_n$ converges, then $\\sum a_n$ converges.)', 'Terms that look like a geometric or $p$-series for large $n$. Name the comparison series and why it converges or diverges.', 'Unit 10', 'comparison-tests', ['series-lab']],
    [D`\sum (-1)^n a_n, \quad a_n \ \text{decreasing},\ a_n \to 0`, 'The alternating series test: then the series converges.', 'Series whose signs alternate. Check both conditions in words; the test never shows divergence.', 'Unit 10', 'alternating-series-test', ['series-lab']],
    [D`L = \lim_{n \to \infty} \left|\frac{a_{n+1}}{a_n}\right|`, 'The ratio test: $L < 1$ converges absolutely, $L > 1$ diverges, $L = 1$ decides nothing.', 'Terms with factorials or powers such as $3^n$, and the radius of a power series. At the endpoints of a power series $L = 1$, so test them another way.', 'Unit 10', 'ratio-test', ['series-lab']],
    [D`\sum |a_n| \ \text{converges} \Rightarrow \sum a_n \ \text{converges}`, 'Absolute convergence implies convergence. A series that converges but not absolutely converges conditionally.', 'Series with mixed signs: test $\\sum |a_n|$ first.', 'Unit 10', 'absolute-conditional', ['series-lab']],
  ] },
  { id: 'taylor', h: 'Taylor series and error bounds', rows: [
    [D`P_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x - a)^k`, 'The Taylor polynomial of degree $n$ for $f$ about $x = a$ (Maclaurin when $a = 0$).', 'Approximating $f$ near $a$. A polynomial ends at its last term; a series goes on with $+ \\cdots$ or a general term.', 'Unit 10', 'taylor-polynomials', ['taylor-lab']],
    [D`\left|S - S_n\right| \le a_{n+1}`, 'The alternating series error bound: the error is at most the size of the first term left out.', 'An alternating series that meets the test\'s conditions. Say so before you use the bound.', 'Unit 10', 'alternating-error-bound', ['taylor-lab']],
    [D`\left|f(x) - P_n(x)\right| \le \frac{\max\left|f^{(n+1)}(z)\right|}{(n + 1)!}\left|x - a\right|^{n+1}`, 'The Lagrange error bound, with the maximum of the next derivative taken for $z$ between $a$ and $x$.', 'The error of a Taylor polynomial when the series does not alternate, or when you know a bound on the next derivative.', 'Unit 10', 'lagrange-error-bound', ['taylor-lab']],
    [D`\frac{1}{1 - x} = \sum_{n=0}^{\infty} x^n, \quad |x| < 1`, 'The geometric series as a power series.', 'Series for $\\frac{1}{1 + x^2}$, $\\frac{1}{2 - x}$ and others by substitution; integrate it to reach $\\ln(1 + x)$ and $\\arctan x$.', 'Unit 10', 'taylor-series', ['taylor-lab']],
    [D`e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!}`, 'The Maclaurin series for $e^x$, for every real $x$.', 'With substitution: $e^{-x^2} = 1 - x^2 + \\frac{x^4}{2!} - \\cdots$.', 'Unit 10', 'taylor-series', ['taylor-lab']],
    [D`\sin x = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n+1}}{(2n + 1)!}, \quad \cos x = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n}}{(2n)!}`, 'The Maclaurin series for sine and cosine, for every real $x$.', 'Odd powers for sine, even for cosine; each alternates, so the alternating series error bound often applies.', 'Unit 10', 'taylor-series', ['taylor-lab']],
    [D`\left|x - a\right| < R`, 'A power series centered at $a$ converges inside its radius $R$; the endpoints $x = a \\pm R$ are tested one at a time.', 'The interval of convergence: the ratio test gives $R$, then each endpoint gets its own test. Radius and interval are different answers.', 'Unit 10', 'radius-interval-convergence', ['series-lab']],
    [D`\frac{d}{dx}\sum c_n x^n = \sum n c_n x^{n-1}, \quad \int \sum c_n x^n\,dx = C + \sum \frac{c_n x^{n+1}}{n + 1}`, 'A power series is differentiated and integrated term by term, with the same radius.', 'New series from known ones. Check the endpoints again: they can change.', 'Unit 10', 'power-series-functions', ['taylor-lab']],
  ] },
];
export const BC_NOT_ON = [
  ['The half and the square in polar area', 'Polar area is $\\frac{1}{2}\\int r^2\\,d\\theta$: leaving out either costs the point.', 'polar-area'],
  ['Speed is not the slope', 'Speed is $\\sqrt{\\left(x\'(t)\\right)^2 + \\left(y\'(t)\\right)^2}$; $\\frac{dy}{dx}$ is how steep the path is.', 'planar-motion'],
  ['Both endpoints, by name', 'The ratio test gives the open interval. At each endpoint its limit is 1, so substitute the endpoint and use another named test.', 'radius-interval-convergence'],
  ['A polynomial has no "+ ..."', 'A Taylor polynomial stops at its last term; a series goes on, with $+ \\cdots$ or a general term.', 'taylor-polynomials'],
  ['"At most", not "equals"', 'An error bound says the error is at most a number; write the inequality, and say why the bound applies.', 'alternating-error-bound'],
];

/* The BC formula page: AB's groups with the BC rows added, then BC's groups. */
export function mergeEq(EQ, NOT_ON) {
  const eq = EQ.map(g => ({ ...g, rows: [...g.rows, ...(BC_EQ[g.id] || [])] }));
  return { eq: [...eq, ...BC_GROUPS], notOn: [...NOT_ON, ...BC_NOT_ON] };
}

/* ------------------------------------------------------------ unit tests */
export const UNIT_TEST_SIZE = 12;
export function loadUnitTests(dataDir) {
  const p = join(dataDir, 'unit-tests.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')).units || {} : {};
}
/* ctx: { map, bank: Map(id -> item), lessonChecks: Set, formIds: Set }.
   A hand-picked unit test has 12 questions from its unit, each a single-answer
   or numeric bank item (the types the free page renders), none a lesson check
   or a practice-exam question, a set's items together in authored order, and
   at least two thirds of the unit's CED topics. */
export function checkUnitTests(tests, ctx) {
  const errs = [];
  for (const [unit, ids] of Object.entries(tests)) {
    const w = `unit test ${unit}`;
    const ch = ctx.map.chapters.find(c => c.id === unit);
    if (!ch || ch.part !== 'course') { errs.push(`${w}: not a course unit`); continue; }
    if (!Array.isArray(ids) || ids.length !== UNIT_TEST_SIZE) errs.push(`${w}: has ${(ids || []).length} questions, not ${UNIT_TEST_SIZE}`);
    if (new Set(ids).size !== ids.length) errs.push(`${w}: a question is listed twice`);
    const seenStim = [];
    let last = null;
    for (const id of ids || []) {
      const q = ctx.bank.get(id);
      if (!q) { errs.push(`${w}: unknown question ${id}`); last = null; continue; }
      if (q.unit !== unit) errs.push(`${w}: ${id} is from ${q.unit}`);
      if (!['single', 'numeric'].includes(q.type)) errs.push(`${w}: ${id} is type ${q.type}; the free page takes single-answer and numeric items`);
      if (q.calc) errs.push(`${w}: ${id} is a calculator item`);
      if (ctx.lessonChecks.has(id)) errs.push(`${w}: ${id} is a lesson check item (already on a free lesson)`);
      if (ctx.formIds.has(id)) errs.push(`${w}: ${id} is in a practice exam`);
      if (q.stimulus) {
        if (last && last.stimulus === q.stimulus) { if (ctx.orderOf(id) <= ctx.orderOf(last.id)) errs.push(`${w}: set ${q.stimulus} is not in authored order`); }
        else if (seenStim.includes(q.stimulus)) errs.push(`${w}: set ${q.stimulus} is split; keep its items together`);
        seenStim.push(q.stimulus);
      }
      last = q;
    }
    const topics = ctx.map.topics.filter(t => t.chapter === unit);
    const covered = new Set((ids || []).map(id => (ctx.bank.get(id) || {}).topic));
    if (covered.size * 3 < topics.length * 2) errs.push(`${w}: covers ${covered.size} of the unit's ${topics.length} topics (at least two thirds)`);
  }
  return errs;
}
