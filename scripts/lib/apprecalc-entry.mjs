/* AP® Precalculus search-entry pages and exam data (docs/apprecalc-architecture.md,
   "Exams and entry pages"), written by scripts/build-apprecalc.mjs:

     formula-sheet.html          the formulas and identities to know (the exam
                                 gives no formula sheet): what each is for,
                                 when to use it, where it is taught; free,
                                 indexable
     unit-tests/<unit>.html      a free sample of 12 questions per exam unit
                                 (none for Unit 4, beyond the exam),
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the "Make it specific" trainer's prompts

   No score calculator and no readiness band (docs/apprecalc-spec.md section 1).

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apprecalc-exams.mjs';
import { renderMath, prepareBank } from './apprecalc-build.mjs';
import { r3Inner } from './r3-inner.mjs';

export const SAMPLE_SIZE = 12;

/* The unit test sample: the same choice every build, so the page is
   stable for search. Whole stimulus sets of single-answer items first (at
   most two, from different topics), then standalone items spread over the
   unit's topics, skipping lesson check items (they are already on the free
   lessons) where enough others exist. */
export function unitSample(ch, ctx) {
  const { map, C } = ctx;
  const checks = new Set(Object.values(C.lessons).flatMap(L => L.check || []));
  const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
  const sets = [], singles = [];
  for (const t of topics) {
    const items = C.questions[t.id].items;
    const by = new Map();
    for (const q of items) {
      if (q.stimulus) { if (!by.has(q.stimulus)) by.set(q.stimulus, []); by.get(q.stimulus).push(q); }
      else if (q.type === 'single' || q.type === 'numeric') singles.push(q);
    }
    for (const [sid, qs] of by) {
      const ok = qs.filter(q => q.type === 'single' && !/previous (question|set|calculation)/.test(q.q));
      if (ok.length >= 3 && ok.length === qs.filter(q => q.type === 'single').length) sets.push({ sid, topic: t.id, items: ok.slice(0, 4), checks: ok.filter(q => checks.has(q.id)).length });
    }
  }
  sets.sort((a, b) => a.checks - b.checks || a.sid.localeCompare(b.sid));
  const out = [], usedT = new Set();
  for (const s of sets) { if (out.length >= 8 || usedT.has(s.topic)) continue; if (out.length + s.items.length > 8) continue; out.push(...s.items); usedT.add(s.topic); }
  const pool = singles.filter(q => !checks.has(q.id) && q.level !== 'recall' && !/previous/.test(q.q));
  const byTopic = new Map(); for (const q of pool) { if (!byTopic.has(q.topic)) byTopic.set(q.topic, []); byTopic.get(q.topic).push(q); }
  for (let round = 0; out.length < SAMPLE_SIZE && round < 6; round++) {
    for (const t of topics) {
      if (out.length >= SAMPLE_SIZE) break;
      if (round === 0 && usedT.has(t.id)) continue;
      const q = (byTopic.get(t.id) || [])[round - (usedT.has(t.id) ? 1 : 0)];
      if (q && !out.includes(q)) out.push(q);
    }
  }
  return out;
}

/* The formula page. The exam gives no formula sheet, so this is our own
   list of what to know, in our own words, grouped our way. Each row is
   [formula (TeX), what it is, when you use it, 'Unit N', topic id,
   trainers?]; the trainers (tools/<slug>.html) that practice it are linked
   only when live. Phase 3 writes the rows (spec section 5); until then the
   page shows its habits and says the guide arrives with the first unit.
   Groups: rates of change; polynomials and rational functions;
   transformations; exponentials and logarithms; the unit circle and
   sinusoids; identities; polar coordinates. Units 1-3 only (Unit 4 is
   beyond the exam). A test holds the list to the formulas the course
   teaches (scripts/test/apprecalc-exams.test.mjs). */
const D = String.raw;
export const EQ = [
  { id: 'rates', h: 'Rates of change', rows: [
    [D`\frac{f(b) - f(a)}{b - a}`, 'The average rate of change of $f$ on $[a, b]$: the slope of the secant line through $(a, f(a))$ and $(b, f(b))$.', 'Any rate over an interval, from a formula, a table or a graph. Name the function and the interval, and give the units (output units per input unit).', 'Unit 1', 'rates-of-change', ['rate-of-change']],
    [D`y = f(a) + \frac{f(b) - f(a)}{b - a}(x - a)`, 'The secant line through $(a, f(a))$ and $(b, f(b))$, in point-slope form.', 'To estimate $f(x)$ for $x$ between $a$ and $b$: the estimate is a point on this line. Concave down on $[a, b]$ gives an underestimate, concave up an overestimate.', 'Unit 1', 'linear-quadratic-rates', ['rate-of-change']],
    [D`\text{rates of change increasing} \Rightarrow \text{concave up}`, 'Concavity from average rates over consecutive equal-length intervals; rates decreasing means concave down.', 'Reading concavity from a table or a graph. Say "the rate of change of $f$ is increasing", not a calculus phrase.', 'Unit 1', 'linear-quadratic-rates', ['rate-of-change']],
    [D`\text{constant second differences} \Rightarrow \text{quadratic}`, 'Over equal input steps, constant differences of the outputs mean linear; constant differences of those differences mean quadratic.', 'Choosing or justifying a linear or quadratic model from a table: name the equal steps and give the differences.', 'Unit 1', 'linear-quadratic-rates', ['function-lab']],
  ] },
  { id: 'polynomials', h: 'Polynomial and rational functions', rows: [
    [D`(x - c)^k`, 'A factor that makes $c$ a zero of multiplicity $k$. Even $k$: the graph touches the $x$-axis at $c$; odd $k$: it crosses.', 'Sketching a polynomial from its factors, or reading the factors from a graph.', 'Unit 1', 'complex-zeros', ['poly-rational']],
    [D`a + bi \ \text{and}\ a - bi`, 'Complex zeros of a polynomial with real coefficients come in conjugate pairs; a polynomial of degree $n$ has $n$ zeros, counted with multiplicity.', 'Finding every zero, or the least degree a polynomial can have from the zeros you are given.', 'Unit 1', 'complex-zeros'],
    [D`f(-x) = f(x), \quad f(-x) = -f(x)`, 'Even functions (the first: symmetric about the $y$-axis) and odd functions (the second: symmetric about the origin).', 'Symmetry questions, and filling in a graph or table from half of it.', 'Unit 1', 'complex-zeros', ['function-lab']],
    [D`\lim_{x \to \infty} p(x) \ \text{from}\ a_n x^n`, 'End behavior of a polynomial comes from its leading term $a_n x^n$: the sign of $a_n$ and whether $n$ is even or odd.', 'Writing end behavior in limit notation, for both $x \\to \\infty$ and $x \\to -\\infty$.', 'Unit 1', 'polynomial-end-behavior', ['function-lab']],
    [D`\lim_{x \to \infty} \frac{ax^n + \cdots}{bx^n + \cdots} = \frac{a}{b}`, 'Same degree on top and bottom: a horizontal asymptote at $y = \\frac{a}{b}$. Lower degree on top: $y = 0$. Higher on top: no horizontal asymptote (one more gives a slant asymptote).', 'End behavior of a rational function, written as a limit.', 'Unit 1', 'rational-end-behavior', ['poly-rational']],
    [D`\lim_{x \to c^-} r(x) = \pm\infty, \quad \lim_{x \to c^+} r(x) = \pm\infty`, 'A vertical asymptote at $x = c$, where the denominator is 0 and the numerator is not (after cancelling common factors).', 'Behavior near a vertical asymptote: give both one-sided limits, each with its sign.', 'Unit 1', 'vertical-asymptotes', ['poly-rational']],
    [D`\frac{(x - c)g(x)}{(x - c)h(x)}`, 'A factor $x - c$ that cancels completely leaves a hole at $x = c$, at height $\\frac{g(c)}{h(c)}$, not a vertical asymptote.', 'Telling a hole from an asymptote: factor first, then use the value the outputs approach.', 'Unit 1', 'rational-holes', ['poly-rational']],
  ] },
  { id: 'transformations', h: 'Transformations and models', rows: [
    [D`g(x) = a f\left(b(x - h)\right) + k`, 'The graph of $f$ stretched vertically by $a$, horizontally by $\\frac{1}{b}$, shifted right $h$ and up $k$. A negative $a$ reflects over the $x$-axis; a negative $b$ over the $y$-axis.', 'Building a function from a parent graph, or reading the changes from a formula. Factor $b$ out before reading the shift.', 'Unit 1', 'transformations', ['function-lab']],
    [D`\text{residual} = \text{actual} - \text{predicted}`, 'A positive residual means the model predicted too little; a negative one, too much.', 'Judging a model: residuals scattered around 0 with no pattern mean the model is appropriate.', 'Unit 2', 'model-validation', ['regression-lab']],
  ] },
  { id: 'explog', h: 'Exponential and logarithmic functions', rows: [
    [D`a_n = a_0 + dn, \quad g_n = g_0 r^n`, 'Arithmetic sequences add a common difference $d$; geometric sequences multiply by a common ratio $r$.', 'Linear and exponential patterns at whole-number steps; a linear function is the continuous arithmetic case, an exponential function the geometric one.', 'Unit 2', 'sequences', ['exp-log-lab']],
    [D`f(x) = ab^x`, 'An exponential function: initial value $a$, growth factor $b$ (growth when $b > 1$, decay when $0 < b < 1$). Over equal input steps the outputs have a constant ratio.', 'Justifying an exponential model: equal-length input intervals and proportional outputs, with the numbers.', 'Unit 2', 'exponential-functions', ['exp-log-lab']],
    [D`b^m b^n = b^{m + n}, \quad \left(b^m\right)^n = b^{mn}, \quad b^{-n} = \frac{1}{b^n}`, 'The exponent rules for products, powers and negative exponents.', 'Rewriting exponential expressions, such as $2^{x + 3} = 8 \\cdot 2^x$, and comparing growth over different time units.', 'Unit 2', 'exponential-manipulation', ['symbolic-steps']],
    [D`f(t) = a(1 + r)^t, \quad f(t) = ae^{kt}`, 'Exponential models with a growth rate $r$ per unit of time, and with the natural base $e$.', 'Models from a percent change or from two data points; store the constants, never round partway.', 'Unit 2', 'exponential-modeling', ['regression-lab']],
    [D`(f \circ g)(x) = f(g(x))`, 'Composition: $g$ acts first, then $f$. Usually $f(g(x)) \\ne g(f(x))$.', 'Composite values from tables or graphs: show the inner value, then the outer.', 'Unit 2', 'composition', ['function-lab']],
    [D`f\left(f^{-1}(x)\right) = x`, 'An inverse undoes a function; its graph is the reflection over $y = x$. A function has an inverse only if no two inputs share an output.', 'Finding an inverse (swap $x$ and $y$, then solve), and justifying invertibility with specific values.', 'Unit 2', 'inverse-functions', ['function-lab']],
    [D`\log_b c = a \Leftrightarrow b^a = c`, 'The definition of a logarithm, for $b > 0$, $b \\ne 1$ and $c > 0$. $\\ln$ is $\\log_e$; $\\log$ alone is $\\log_{10}$.', 'Evaluating logarithms exactly and moving between exponential and logarithmic forms.', 'Unit 2', 'logarithmic-expressions', ['exp-log-lab']],
    [D`\log_b\left(b^x\right) = x, \quad b^{\log_b x} = x`, 'Exponential and logarithmic functions with the same base are inverses.', 'Undoing one with the other when solving equations.', 'Unit 2', 'exp-log-inverses', ['exp-log-lab']],
    [D`\log_b(mn) = \log_b m + \log_b n, \quad \log_b\frac{m}{n} = \log_b m - \log_b n`, 'The product and quotient rules for logarithms, for $m > 0$ and $n > 0$.', 'Combining into a single logarithm or expanding one. There is no rule for $\\log_b(m + n)$.', 'Unit 2', 'logarithmic-manipulation', ['symbolic-steps']],
    [D`\log_b\left(m^k\right) = k\log_b m, \quad \log_b x = \frac{\ln x}{\ln b}`, 'The power rule and the change of base rule.', 'Moving a coefficient into an exponent before combining, and evaluating any logarithm on a calculator.', 'Unit 2', 'logarithmic-manipulation', ['symbolic-steps']],
    [D`\log y = (\log b)x + \log a`, 'Taking the logarithm of $y = ab^x$ gives a line: on a semi-log plot exponential data look linear, with slope $\\log b$.', 'Recognizing exponential data on a semi-log plot and reading $a$ and $b$ from the line.', 'Unit 2', 'semi-log-plots', ['exp-log-lab']],
  ] },
  { id: 'trig', h: 'The unit circle and sinusoids', rows: [
    [D`\sin\theta = \frac{y}{r}, \quad \cos\theta = \frac{x}{r}, \quad \tan\theta = \frac{y}{x}`, 'Sine, cosine and tangent of an angle in standard position whose terminal ray passes through $(x, y)$, with $r = \\sqrt{x^2 + y^2}$. On the unit circle, $(\\cos\\theta, \\sin\\theta)$.', 'Values from a point or the unit circle; tangent is the slope of the terminal ray.', 'Unit 3', 'sine-cosine-tangent', ['unit-circle']],
    [D`\pi \ \text{radians} = 180 \ \text{degrees}`, 'Converting between radians and degrees. The exam works in radians.', 'Every angle: set the calculator to radian mode.', 'Unit 3', 'sine-cosine-tangent', ['unit-circle']],
    [D`\sin\frac{\pi}{6} = \frac{1}{2}, \quad \sin\frac{\pi}{4} = \frac{\sqrt{2}}{2}, \quad \sin\frac{\pi}{3} = \frac{\sqrt{3}}{2}`, 'The special values; cosine has the same values in the opposite order ($\\cos\\frac{\\pi}{3} = \\frac{1}{2}$).', 'Exact values without a calculator, with the sign set by the quadrant.', 'Unit 3', 'sine-cosine-values', ['unit-circle']],
    [D`f(\theta) = a\sin\left(b(\theta + c)\right) + d`, 'A sinusoid: amplitude $|a|$, period $\\frac{2\\pi}{|b|}$, midline $y = d$, shifted left by $c$ (right if $c < 0$).', 'Periodic models: $b$ from the period, $d$ from the midline, $a$ from half the distance from maximum to minimum.', 'Unit 3', 'sinusoidal-transformations', ['sinusoid-builder']],
    [D`\tan x = \frac{\sin x}{\cos x}`, 'Tangent has period $\\pi$ and vertical asymptotes where $\\cos x = 0$, at $x = \\frac{\\pi}{2} + k\\pi$.', 'Graphs and values of tangent, and rewriting to a single function.', 'Unit 3', 'tangent-function', ['unit-circle']],
    [D`\sin^{-1}x, \ \tan^{-1}x \in \left[-\frac{\pi}{2}, \frac{\pi}{2}\right], \quad \cos^{-1}x \in [0, \pi]`, 'The ranges of the inverse trigonometric functions. $\\sin^{-1}x$ is not $\\frac{1}{\\sin x}$.', 'Inverse trig values and the first solution of a trig equation; use symmetry for the others.', 'Unit 3', 'inverse-trig', ['symbolic-steps']],
    [D`\sec x = \frac{1}{\cos x}, \quad \csc x = \frac{1}{\sin x}, \quad \cot x = \frac{1}{\tan x}`, 'The reciprocal functions, undefined where the function in the denominator is 0.', 'Rewriting expressions in sine and cosine, and finding their asymptotes.', 'Unit 3', 'sec-csc-cot', ['symbolic-steps']],
  ] },
  { id: 'identities', h: 'Identities and equations', rows: [
    [D`\sin^2 x + \cos^2 x = 1`, 'The Pythagorean identity. Dividing by $\\cos^2 x$ gives $1 + \\tan^2 x = \\sec^2 x$; by $\\sin^2 x$, $1 + \\cot^2 x = \\csc^2 x$.', 'Rewriting to one function, and finding $\\cos x$ from $\\sin x$ (the sign from the quadrant).', 'Unit 3', 'trig-identities', ['symbolic-steps']],
    [D`\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta`, 'The sum and difference identities for sine.', 'Exact values such as $\\sin\\frac{7\\pi}{12}$, and rewriting a shifted sine.', 'Unit 3', 'trig-identities', ['symbolic-steps']],
    [D`\cos(\alpha \pm \beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta`, 'The sum and difference identities for cosine; the sign in the middle flips.', 'Exact values and rewriting, as for sine.', 'Unit 3', 'trig-identities', ['symbolic-steps']],
    [D`\sin(2x) = 2\sin x\cos x, \quad \cos(2x) = \cos^2 x - \sin^2 x`, 'The double-angle identities; also $\\cos(2x) = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x$.', 'Pick the form of $\\cos(2x)$ that cancels what is next to it, and solve equations with $2x$ inside.', 'Unit 3', 'trig-identities', ['symbolic-steps']],
    [D`x = x_0 + 2k\pi`, 'Sine and cosine repeat every $2\\pi$ (tangent every $\\pi$), so one solution gives infinitely many.', 'Every solution in an interval: find the solutions in one period, then add periods while they stay in the interval.', 'Unit 3', 'trig-equations', ['symbolic-steps']],
  ] },
  { id: 'polar', h: 'Polar coordinates', rows: [
    [D`x = r\cos\theta, \quad y = r\sin\theta, \quad r^2 = x^2 + y^2`, 'Converting between polar $(r, \\theta)$ and rectangular $(x, y)$ coordinates.', 'Plotting polar points and rewriting equations; check the quadrant when you find $\\theta$ from $\\tan\\theta = \\frac{y}{x}$.', 'Unit 3', 'polar-coordinates', ['polar-graphs']],
    [D`a + bi = r(\cos\theta + i\sin\theta)`, 'The polar form of a complex number, with $r = \\sqrt{a^2 + b^2}$.', 'Moving a complex number between rectangular and polar form.', 'Unit 3', 'polar-coordinates', ['polar-graphs']],
    [D`\frac{r(\theta_2) - r(\theta_1)}{\theta_2 - \theta_1}`, 'The average rate of change of $r$ with respect to $\\theta$. If $r > 0$ and $r$ is increasing, the curve moves away from the origin.', 'How the distance from the origin changes as $\\theta$ turns; the units are distance per radian.', 'Unit 3', 'polar-rates', ['polar-graphs']],
  ] },
];
// Easy to forget, and each one costs points every year (framework.md section 7): [rule, why, topic].
export const NOT_ON = [
  ['Three decimal places, never partway', 'Store every constant and intermediate value in the calculator and round only the final answer. A model built from rounded constants often misses the third decimal place.', 'model-construction'],
  ['Every solution in the interval', 'A calculator or inverse function gives one solution. Widen the window, use symmetry or add a period, and list every solution in the stated interval, with no extras.', 'trig-equations'],
  ['$\\sin^{-1} x$ is not $\\frac{1}{\\sin x}$', 'The $-1$ means the inverse function, whose outputs are in $\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]$. The reciprocal is $\\csc x$.', 'inverse-trig'],
  ['$\\log_b(m + n)$ has no rule', 'Only products, quotients and powers inside a logarithm can be split. $\\ln(x^2) = 2\\ln x$ only for $x > 0$.', 'logarithmic-manipulation'],
  ['$e^x$ is never 0 or negative', 'In an equation quadratic in $e^x$, reject the root where $e^x$ would be 0 or negative, and say why.', 'exp-log-equations'],
  ['$b$ is not the period', 'The period of $\\sin(bx)$ is $\\frac{2\\pi}{b}$, so $b = \\frac{2\\pi}{\\text{period}}$. Factor $b$ out before reading the phase shift.', 'sinusoidal-transformations'],
  ['Both sides of a vertical asymptote', 'Write each one-sided limit with its sign: $\\lim_{x \\to c^-}$ and $\\lim_{x \\to c^+}$.', 'vertical-asymptotes'],
  ['Invertible needs values', 'Show two inputs with the same output (not invertible), or explain why every output comes from one input. "Fails the horizontal line test" alone earns nothing.', 'inverse-functions'],
];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  // Exam units only: Unit 4 (beyond the exam) gets no unit test (spec decision 7).
  const units = map.chapters.filter(c => c.part === 'course' && !c.beyondExam);
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="pcalc-eq-tools"><span class="pcalc-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Precalculus Formulas and Identities to Know', [LABEL]);
    const desc = 'The precalculus formulas and identities to know by heart, since the exam gives no formula sheet: what each is for, when to use it and where it is taught.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Precalculus formulas and identities to know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Formulas to know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection pcalc-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="pcalc-eq"><thead><tr><th scope="col">Formula</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="pcalc-eq-f">${R(`$${r[0]}$`)}</span></th><td>${R(r[1])}</td><td>${R(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell pcalc-app pcalc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Formulas to know' }])}
  <header class="hero pcalc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Formulas and identities to know</h1>
  <p class="lede">The exam gives no formula sheet. These are the formulas and identities to know by heart, what each is for and when to use it.</p></header>
  <section class="xsection pcalc-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="pcalc-links">
      <li><b>Use the numbers you are given.</b> A reason earns the point when it cites specific values of the function (two inputs with the same output), not a rule such as "it fails the horizontal line test".</li>
      <li><b>Three decimal places, never partway.</b> On a calculator question, write the equation you solve, store every value, and round or truncate only the final answer, to three places after the decimal point.</li>
      <li><b>Radian mode and exact values.</b> Every angle is in radians. Without a calculator, give exact values (fractions, roots, π, e, logarithms) and combine to one logarithm or one trigonometric term when asked.</li>
    </ul>
  </section>
  ${EQ.length ? sections : '<p class="pcalc-small">The formula-by-formula guide arrives with the first published unit.</p>'}
  ${NOT_ON.length ? `<section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Easy to forget</h2>
    <ul class="pcalc-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="pcalc-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>` : ''}
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[testLink('', 'Free unit practice tests'), `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
  </section>
</main>
${footer(depth, 'page:formula-sheet')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------- unit practice tests */
  const stimFor = q => { const s = ((C.questions[q.topic] || {}).stimuli || {})[q.stimulus]; return s; };
  for (const ch of units.filter(built)) {
    const depth = '../', path = `unit-tests/${ch.id}.html`, url = `${SITE}${BASE}${path}`;
    const qs = unitSample(ch, ctx).map(questionForPage);
    const title = courseTitle(`Unit ${ch.n} Practice Test: ${ch.title}`, [LABEL]);
    const desc = clampDesc(`A free ${qs.length}-question practice test for Unit ${ch.n}, ${ch.title.toLowerCase()}, with the answer and an explanation for every option.`);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'Quiz', '@id': `${url}#quiz`, name: `Unit ${ch.n} practice test: ${ch.title}`, url, description: desc, isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', about: ch.title, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: ch.title, url: `${SITE}${BASE}units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test`, url }])),
    ] };
    const stimuli = {};
    for (const q of qs) if (q.stimulus) { const s = stimFor(q); if (s) stimuli[q.stimulus] = { kind: s.kind, title: s.title, html: stimulusBody(C, s, '') }; }
    const html = groupSets(qs).map(g => {
      const items = g.items.map(q => questionHtml(q, qs.indexOf(q) + 1)).join('');
      const s = g.stimulus && stimuli[g.stimulus];
      return s ? `<div class="pcalc-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell pcalc-app pcalc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero pcalc-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask you to type a value or an expression; sets share one graph or table.</p>
  <p class="pcalc-small pcalc-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="pcalc-qs" data-set="check">${html}</div>
  <section class="xsection pcalc-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="pcalc-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="pcalc-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="pcalc-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['pcalc-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = r3Inner(head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body, { key: 'apprecalc', slug: 'unit-test', up: '../../' });
  }

  /* ---------------------------------------------------------- exam data */
  const ex = loadExams(C.data);
  // Exam-only items and their stimuli get the same math rendering as the bank.
  ex.items = prepareBank(renderMath({ items: ex.items }), 'exams').items;
  ex.stimuli = renderMath(ex.stimuli);
  const bank = new Map(); for (const t of map.topics) for (const q of ((C.questions[t.id] || {}).items || [])) bank.set(q.id, q);
  const examItems = new Map(ex.items.map(q => [q.id, q]));
  const frqById = Object.fromEntries(frqs.map(f => [f.id, f]));
  const live = ex.forms.filter(f => formUnits(f, { bank, examItems, frqs: frqById }).every(u => C.published.has(u)) && (f.frq || []).every(id => frqById[id]));
  const usedOwn = new Set(live.flatMap(f => f.mcq.flat()).filter(id => examItems.has(id)));
  const ownStim = {};
  for (const id of usedOwn) { const s = examItems.get(id).stimulus; if (s && ex.stimuli[s]) ownStim[s] = { kind: ex.stimuli[s].kind, title: ex.stimuli[s].title, html: stimulusBody(C, ex.stimuli[s], '') }; }
  out['assets/exams/forms.json'] = JSON.stringify(live.map(f => ({ id: f.id, title: f.title, mcq: f.mcq, frq: f.frq })));
  out['assets/exams/items.json'] = JSON.stringify({ stimuli: ownStim, items: [...usedOwn].map(id => questionForPage(examItems.get(id))) });

  /* ---------------------------------------------- "Make it specific" data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  /* The builder for a prompt whose answer has parts (carried from AP®
     Psychology): the slots in order, option text raw (shown as plain text in
     a select), each why rendered as math. */
  const builder = S => ({ slots: Object.fromEntries(Object.entries(S.slots || {}).map(([k, sl]) => [k, { label: sl.label, options: sl.options, correct: sl.correct, why: renderMath(sl.why || {}) }])) });
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    // "answer" is a raw key for questions (never TeX), so the model answers are rendered on their own.
    prompts: prompts.map((raw, i) => { const p = renderMath(raw), R1 = s => renderMath([s])[0]; return { id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: { answer: R1(raw.earns.answer), why: p.earns.why }, misses: { answer: R1(raw.misses.answer), why: p.misses.why }, ...(raw.specific ? { specific: builder(raw.specific) } : {}), ...(i < FREE_JUSTIFY ? { free: true } : {}) }; }),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
