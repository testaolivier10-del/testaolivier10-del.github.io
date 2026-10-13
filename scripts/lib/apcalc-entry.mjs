/* AP® Calculus AB search-entry pages and exam data (docs/apcalc-architecture.md,
   "Exams and entry pages"), written by scripts/build-apcalc.mjs:

     formula-sheet.html          the formulas and theorems to know (the exam
                                 gives no formula sheet): what each is for,
                                 when to use it, where it is taught; free,
                                 indexable
     score-calculator.html       composite estimate from Section I correct
                                 and Section II points (pages/score.js)
     unit-tests/<unit>.html      a free sample of 12 questions per unit,
                                 readable without JavaScript, with a link
                                 into practice and the timed unit test
     assets/exams/forms.json     the two fixed practice exams, filtered to
                                 forms whose units are all published
     assets/exams/items.json     exam-only questions, served with the forms
     assets/justify.json         the justification trainer's prompts

   No path carries the token "ap" (spec decision 2). The helpers come from
   the generator (ctx) so the pages share its head, crumbs, footer and tail. */
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apcalc-exams.mjs';
import { renderMath, prepareBank } from './apcalc-build.mjs';

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
   only when live. A test holds the list to the rules, theorems and set-ups
   the course teaches (scripts/test/apcalc-exams.test.mjs). */
const D = String.raw;
export const EQ = [
  { id: 'limits', h: 'Limits and continuity', rows: [
    [D`\lim_{x \to c} f(x) = f(c)`, 'Continuity at $x = c$: $f(c)$ is defined, the limit exists, and the two are equal.', 'To show a function is continuous at a point. For a piecewise function, find both one-sided limits first.', 'Unit 1', 'continuity-at-a-point', ['limit-explorer']],
    [D`\lim_{x \to 0} \frac{\sin x}{x} = 1`, 'A special limit, with $x$ in radians, found with the squeeze theorem.', D`Limits such as $\lim_{x \to 0} \frac{\sin(3x)}{x}$: rewrite as $3 \cdot \frac{\sin(3x)}{3x}$.`, 'Unit 1', 'squeeze-theorem', ['limit-explorer']],
    [D`\lim_{x \to 0} \frac{1 - \cos x}{x} = 0`, 'The companion special limit, also with $x$ in radians.', 'Limits with $1 - \\cos x$ over $x$; together with the first, it gives the derivatives of sine and cosine.', 'Unit 1', 'squeeze-theorem'],
    [D`g(x) \le f(x) \le h(x) \Rightarrow \lim_{x \to c} f(x) = L`, 'The squeeze theorem, when $g(x) \\le f(x) \\le h(x)$ near $c$ and $g$ and $h$ both have limit $L$ at $c$.', 'When $f$ is trapped between two functions with the same limit, such as a bounded factor like $\\sin\\frac{1}{x}$ times something that goes to 0.', 'Unit 1', 'squeeze-theorem', ['limit-explorer']],
    [D`f(c) = d \ \text{for some}\  c \ \text{in}\  [a, b]`, 'The Intermediate Value Theorem, when $f$ is continuous on $[a, b]$ and $d$ is between $f(a)$ and $f(b)$.', 'To show an equation $f(x) = d$ has a solution. Say first why $f$ is continuous on the closed interval.', 'Unit 1', 'intermediate-value-theorem'],
    [D`\lim_{x \to c} \frac{f(x)}{g(x)} = \lim_{x \to c} \frac{f'(x)}{g'(x)}`, "L'Hospital's rule, when $f$ and $g$ both have limit 0, or both have infinite limits, and the limit on the right exists.", 'For $\\frac{0}{0}$ and $\\frac{\\infty}{\\infty}$ forms. Write the two limits separately first, then differentiate top and bottom on their own (not the quotient rule).', 'Unit 4', 'lhospitals-rule'],
  ] },
  { id: 'derivatives', h: 'Derivative rules', rows: [
    [D`f'(a) = \lim_{h \to 0} \frac{f(a + h) - f(a)}{h}`, 'The definition of the derivative: the limit of the slopes of secant lines.', 'To recognize a limit as a derivative in disguise, or to check differentiability where two pieces meet.', 'Unit 2', 'derivative-definition', ['tangent-tracer']],
    [D`\frac{f(b) - f(a)}{b - a}`, 'The average rate of change of $f$ on $[a, b]$, the slope of a secant line.', 'Rates over an interval from a formula or a table; to estimate $f\'(c)$ from a table, use the two values closest to $c$ on either side.', 'Unit 2', 'average-and-instant-rates', ['tangent-tracer']],
    [D`\frac{d}{dx} x^n = n x^{n - 1}`, 'The power rule, for any real number $n$.', 'Powers, roots and reciprocals. Rewrite $\\sqrt{x}$ as $x^{1/2}$ and $\\frac{1}{x^2}$ as $x^{-2}$ first.', 'Unit 2', 'power-rule', ['rule-drills']],
    [D`\frac{d}{dx}\left[f(x)g(x)\right] = f'(x)g(x) + f(x)g'(x)`, 'The product rule, for a product of two functions.', 'A product of two functions of $x$; for three factors, use it twice.', 'Unit 2', 'product-rule', ['rule-drills']],
    [D`\frac{d}{dx}\left[\frac{f(x)}{g(x)}\right] = \frac{f'(x)g(x) - f(x)g'(x)}{\left[g(x)\right]^2}`, 'The quotient rule, for a quotient of two functions.', 'A quotient that does not simplify by dividing first. The order on top matters.', 'Unit 2', 'quotient-rule', ['rule-drills']],
    [D`\frac{d}{dx}\sin x = \cos x, \quad \frac{d}{dx}\cos x = -\sin x`, 'Derivatives of sine and cosine, with $x$ in radians.', 'Every trigonometric derivative starts here. The minus sign belongs to cosine.', 'Unit 2', 'derivatives-sin-cos-exp-ln', ['rule-drills']],
    [D`\frac{d}{dx}e^x = e^x, \quad \frac{d}{dx}\ln x = \frac{1}{x}`, 'Derivatives of the natural exponential and the natural logarithm.', 'Exponentials and logarithms. With the chain rule, $\\frac{d}{dx}e^{u} = e^{u}u\'$ and $\\frac{d}{dx}\\ln u = \\frac{u\'}{u}$.', 'Unit 2', 'derivatives-sin-cos-exp-ln', ['rule-drills']],
    [D`\frac{d}{dx}\tan x = \sec^2 x, \quad \frac{d}{dx}\sec x = \sec x \tan x`, 'Derivatives of tangent and secant, from the quotient rule.', 'Tangent and secant directly, without rewriting them as quotients each time.', 'Unit 2', 'other-trig-derivatives'],
    [D`\frac{d}{dx}\cot x = -\csc^2 x, \quad \frac{d}{dx}\csc x = -\csc x \cot x`, 'Derivatives of cotangent and cosecant.', 'The co-functions follow the same pattern as tangent and secant, with minus signs.', 'Unit 2', 'other-trig-derivatives'],
    [D`\frac{d}{dx}f(g(x)) = f'(g(x)) \cdot g'(x)`, 'The chain rule, for a composite function.', 'Any function inside another, such as $e^{3x}$, $\\sin(x^2)$ or $(2x + 1)^5$: multiply by the derivative of the inside.', 'Unit 3', 'chain-rule', ['rule-drills']],
    [D`\frac{d}{dx}\left[y^n\right] = n y^{n - 1}\frac{dy}{dx}`, 'Implicit differentiation: $y$ is a function of $x$, so the chain rule brings out $\\frac{dy}{dx}$.', 'Curves such as $x^2 + xy + y^2 = 7$: differentiate both sides, keep the $= 0$, then solve for $\\frac{dy}{dx}$.', 'Unit 3', 'implicit-differentiation', ['rule-drills']],
    [D`\left(f^{-1}\right)'(b) = \frac{1}{f'(a)} \ \text{where}\  f(a) = b`, 'The derivative of an inverse function at a point.', 'When you know $f$ but not its inverse: find the input $a$ with $f(a) = b$ first.', 'Unit 3', 'inverse-function-derivatives'],
    [D`\frac{d}{dx}\arcsin x = \frac{1}{\sqrt{1 - x^2}}, \quad \frac{d}{dx}\arctan x = \frac{1}{1 + x^2}`, 'Derivatives of inverse sine and inverse tangent.', 'Inverse trigonometric functions, with the chain rule for $\\arcsin u$ and $\\arctan u$.', 'Unit 3', 'inverse-trig-derivatives'],
    [D`y = f(a) + f'(a)(x - a)`, 'The tangent line at $x = a$, in point-slope form.', 'Tangent lines and local linear approximation. Whether the estimate is too big or too small comes from concavity.', 'Unit 4', 'local-linearity', ['tangent-tracer']],
  ] },
  { id: 'analysis', h: 'Theorems and curve analysis', rows: [
    [D`\text{differentiable at}\  c \Rightarrow \text{continuous at}\  c`, 'Differentiability implies continuity. Not the other way: $|x|$ is continuous at 0 but not differentiable there.', 'To supply the continuity a theorem needs when you are told only that $f$ is differentiable.', 'Unit 2', 'differentiability'],
    [D`f'(c) = \frac{f(b) - f(a)}{b - a},\ a < c < b`, 'The Mean Value Theorem, when $f$ is continuous on $[a, b]$ and differentiable on $(a, b)$.', 'To show an instantaneous rate equals an average rate. State both hypotheses in words first.', 'Unit 5', 'mean-value-theorem', ['curve-analyzer']],
    [D`f \ \text{has an absolute max and min on}\  [a, b]`, 'The Extreme Value Theorem, when $f$ is continuous on the closed interval $[a, b]$.', 'To know absolute extrema exist before you look for them. It needs a closed interval and continuity.', 'Unit 5', 'extreme-value-theorem'],
    [D`f' > 0 \Rightarrow f \ \text{increasing}, \quad f' < 0 \Rightarrow f \ \text{decreasing}`, 'Increasing and decreasing from the sign of $f\'$.', 'Where $f$ rises or falls, from a formula, a table, or a graph of $f\'$.', 'Unit 5', 'increasing-decreasing', ['curve-analyzer']],
    [D`f' \ \text{from}\  + \ \text{to}\  - \ \text{at}\  c \Rightarrow \text{relative max}`, 'The first derivative test. From negative to positive: a relative minimum.', 'Any relative extremum. Name the function that changes sign and say from what to what; $f\'(c) = 0$ alone is not enough.', 'Unit 5', 'first-derivative-test', ['curve-analyzer']],
    [D`\text{compare}\  f(a),\ f(b),\ f(\text{each critical point})`, 'The candidates test for absolute extrema on $[a, b]$, also called the closed interval method.', 'An absolute (global) maximum or minimum on a closed interval. A sign change only shows a relative extremum.', 'Unit 5', 'candidates-test', ['curve-analyzer']],
    [D`f'' > 0 \Rightarrow \text{concave up}, \quad f'' < 0 \Rightarrow \text{concave down}`, 'Concavity. A point of inflection is where $f\'\'$ changes sign (where $f\'$ changes from increasing to decreasing, or back).', 'Concavity and inflection points, and whether a tangent line estimate is an overestimate (concave down) or an underestimate (concave up).', 'Unit 5', 'concavity', ['curve-analyzer']],
    [D`f'(c) = 0,\ f''(c) < 0 \Rightarrow \text{relative max}`, 'The second derivative test. If $f\'\'(c) > 0$, a relative minimum; if $f\'\'(c) = 0$, the test says nothing.', 'A relative extremum at a critical point where $f\'\'$ is easy to evaluate.', 'Unit 5', 'second-derivative-test', ['curve-analyzer']],
  ] },
  { id: 'integrals', h: 'Integrals and the Fundamental Theorem', rows: [
    [D`\int x^n\,dx = \frac{x^{n + 1}}{n + 1} + C \quad (n \ne -1)`, 'The power rule for antiderivatives.', 'Powers and roots, rewritten as powers first. Check by differentiating.', 'Unit 6', 'antiderivatives'],
    [D`\int \frac{1}{x}\,dx = \ln|x| + C`, 'The case $n = -1$, with the absolute value.', 'An integrand $\\frac{1}{x}$, or $\\frac{u\'}{u}$ after a substitution.', 'Unit 6', 'antiderivatives'],
    [D`\int e^x\,dx = e^x + C`, 'The antiderivative of the natural exponential.', 'Exponentials; with a substitution, $\\int e^{kx}\\,dx = \\frac{1}{k}e^{kx} + C$.', 'Unit 6', 'antiderivatives'],
    [D`\int \sin x\,dx = -\cos x + C, \quad \int \cos x\,dx = \sin x + C`, 'Antiderivatives of sine and cosine.', 'Trigonometric integrands. The minus sign is on the antiderivative of sine.', 'Unit 6', 'antiderivatives'],
    [D`\int \sec^2 x\,dx = \tan x + C, \quad \int \sec x \tan x\,dx = \sec x + C`, 'The derivatives of tangent and secant, read backward.', 'Integrands that are exactly one of these derivatives.', 'Unit 6', 'antiderivatives'],
    [D`\int \frac{1}{\sqrt{1 - x^2}}\,dx = \arcsin x + C, \quad \int \frac{1}{1 + x^2}\,dx = \arctan x + C`, 'The inverse trigonometric derivatives, read backward.', 'Integrands of these forms, sometimes after a substitution or after completing the square.', 'Unit 6', 'antiderivatives'],
    [D`\int_a^b f(x)\,dx = \lim_{n \to \infty}\sum_{i=1}^{n} f(x_i)\Delta x, \quad \Delta x = \frac{b - a}{n}`, 'The definite integral as a limit of Riemann sums.', 'To recognize a limit of sums as an integral: read $\\Delta x$ and $x_i$ to find $a$, $b$ and $f$.', 'Unit 6', 'definite-integral-notation', ['riemann-sums']],
    [D`\frac{\Delta x_1}{2}\left[f(x_0) + f(x_1)\right] + \frac{\Delta x_2}{2}\left[f(x_1) + f(x_2)\right] + \cdots`, 'The trapezoidal sum, each trapezoid with its own width.', 'Approximating an integral from a table. Widths may differ; never assume they are equal.', 'Unit 6', 'riemann-sums', ['riemann-sums']],
    [D`\frac{d}{dx}\int_a^x f(t)\,dt = f(x)`, 'The Fundamental Theorem of Calculus, first part, for continuous $f$.', 'Derivatives of accumulation functions. With an upper limit $g(x)$, multiply by $g\'(x)$: $\\frac{d}{dx}\\int_a^{g(x)} f(t)\\,dt = f(g(x))g\'(x)$.', 'Unit 6', 'ftc-accumulation', ['accumulation']],
    [D`\int_a^b f(x)\,dx = F(b) - F(a), \ \text{where}\  F' = f`, 'The Fundamental Theorem of Calculus, second part: evaluate with any antiderivative.', 'Definite integrals without a calculator.', 'Unit 6', 'ftc-definite-integrals', ['accumulation']],
    [D`\int_b^a f(x)\,dx = -\int_a^b f(x)\,dx`, 'Reversing the limits changes the sign.', 'An accumulation function evaluated below its lower limit, such as $\\int_4^1 f(t)\\,dt$.', 'Unit 6', 'integral-properties', ['accumulation']],
    [D`\int_a^b f(x)\,dx + \int_b^c f(x)\,dx = \int_a^c f(x)\,dx`, 'Integrals over adjacent intervals add.', 'Integrals given in pieces, or a graph made of pieces whose areas you add.', 'Unit 6', 'integral-properties', ['accumulation']],
    [D`\int f(g(x))g'(x)\,dx = \int f(u)\,du, \quad u = g(x)`, 'Substitution: the chain rule run backward.', 'An inside function whose derivative, up to a constant, is also a factor. For a definite integral, change the limits too.', 'Unit 6', 'u-substitution'],
  ] },
  { id: 'motion', h: 'Motion, rates and accumulation', rows: [
    [D`v(t) = x'(t), \quad a(t) = v'(t) = x''(t)`, 'Velocity and acceleration from position.', 'Particle motion on a line.', 'Unit 4', 'straight-line-motion', ['motion-lab']],
    [D`v, a \ \text{same sign} \Rightarrow \text{speeding up}`, 'Speeding up or slowing down. Opposite signs: slowing down. Speed is $|v(t)|$.', 'Any speeding-up question: give the signs of both $v$ and $a$ at that time.', 'Unit 4', 'straight-line-motion', ['motion-lab']],
    [D`\frac{d}{dt}\left[x^2 + y^2\right] = 2x\frac{dx}{dt} + 2y\frac{dy}{dt}`, 'Related rates: differentiate the equation that links the quantities with respect to time.', 'Ladders, cones, shadows: differentiate first, then substitute the values at the moment asked about.', 'Unit 4', 'related-rates-intro', ['related-rates']],
    [D`f_{\text{avg}} = \frac{1}{b - a}\int_a^b f(x)\,dx`, 'The average value of $f$ on $[a, b]$.', '"Average temperature" or "average velocity" asks for the average value of the function, not its average rate of change.', 'Unit 8', 'average-value'],
    [D`x(t) = x(t_0) + \int_{t_0}^{t} v(s)\,ds`, 'Position from velocity and a known position.', 'Position at a time: start from the time where the position is known, not always $t = 0$.', 'Unit 8', 'motion-with-integrals', ['motion-lab']],
    [D`\int_a^b v(t)\,dt \ \text{and}\  \int_a^b |v(t)|\,dt`, 'Displacement (the first) and total distance traveled (the second).', 'Total distance: integrate the speed, or, without a calculator, split where $v$ changes sign.', 'Unit 8', 'motion-with-integrals', ['motion-lab']],
    [D`A(t) = A(0) + \int_0^t r(s)\,ds`, 'An amount from a rate and a starting amount (net change).', 'Water in a tank, people in a park: keep the starting amount, and subtract the rate out from the rate in.', 'Unit 8', 'accumulation-in-context', ['accumulation']],
  ] },
  { id: 'des', h: 'Differential equations', rows: [
    [D`\frac{dy}{dx} = f(x)g(y) \Rightarrow \int \frac{1}{g(y)}\,dy = \int f(x)\,dx`, 'Separation of variables.', 'A particular solution: add $+ C$ as you antidifferentiate, use the initial condition right away, then solve for $y$.', 'Unit 7', 'separation-of-variables', ['slope-fields']],
    [D`\frac{dy}{dt} = ky \Rightarrow y = y_0 e^{kt}`, 'Exponential growth ($k > 0$) and decay ($k < 0$); $y_0$ is the value at $t = 0$.', 'A rate proportional to the amount present.', 'Unit 7', 'exponential-models', ['slope-fields']],
  ] },
  { id: 'area', h: 'Area and volume', rows: [
    [D`\int_a^b \left[f(x) - g(x)\right]dx`, 'Area between curves, $f$ above $g$, slicing along $x$.', 'Area between two graphs. Split at crossings if the top curve changes.', 'Unit 8', 'area-between-curves-x', ['area-volume']],
    [D`\int_c^d \left[p(y) - q(y)\right]dy`, 'Area slicing along $y$: the right curve minus the left curve.', 'When the region is easier to describe with $x$ as a function of $y$.', 'Unit 8', 'area-between-curves-y', ['area-volume']],
    [D`\int_a^b A(x)\,dx, \quad A = s^2 \ \text{for squares}`, 'Volume from cross sections of area $A(x)$; a square of side $s$ has area $s^2$.', 'Known cross sections on a base region: the side $s$ is the length across the base at $x$.', 'Unit 8', 'cross-sections-squares', ['area-volume']],
    [D`A = \frac{\sqrt{3}}{4}s^2, \quad A = \frac{\pi}{8}s^2, \quad A = \frac{1}{2}s^2`, 'Cross-section areas: an equilateral triangle of side $s$, a semicircle of diameter $s$, an isosceles right triangle with a leg $s$ in the base.', 'Triangle and semicircle cross sections; with the hypotenuse $s$ in the base, the right triangle has area $\\frac{1}{4}s^2$.', 'Unit 8', 'cross-sections-triangles', ['area-volume']],
    [D`\pi\int_a^b \left[R(x)\right]^2 dx`, 'The disc method, with the radius $R$ measured from the axis of revolution.', 'A region that touches the axis. About a line $y = k$, the radius is $|f(x) - k|$.', 'Unit 8', 'disc-method-axes', ['area-volume']],
    [D`\pi\int_a^b \left(\left[R(x)\right]^2 - \left[r(x)\right]^2\right)dx`, 'The washer method: outer radius $R$ and inner radius $r$, both from the axis.', 'A region with a gap from the axis. Square each radius on its own; $(R - r)^2$ is wrong.', 'Unit 8', 'washer-method-axes', ['area-volume']],
  ] },
];
// Easy to forget, and each one costs points every year (framework.md section 8).
export const NOT_ON = [
  ['$+ C$', 'Every indefinite integral ends with $+ C$. In a separable differential equation the constant appears as you antidifferentiate, before you solve for $y$.', 'separation-of-variables'],
  ['Units of a rate of a rate', 'If $r(t)$ is in liters per minute, $r\'(t)$ is in liters per minute per minute, and $\\int_a^b r(t)\\,dt$ is in liters.', 'derivative-in-context'],
  ['The chain factor on an accumulation function', '$\\frac{d}{dx}\\int_0^{x^2} f(t)\\,dt = f(x^2) \\cdot 2x$, not $f(x^2)$.', 'ftc-accumulation'],
  ['Average value is not average rate', '$\\frac{1}{b - a}\\int_a^b f(x)\\,dx$ is the average value of $f$; $\\frac{f(b) - f(a)}{b - a}$ is its average rate of change.', 'average-value'],
  ['Vertical tangents', 'Where the denominator of $\\frac{dy}{dx}$ is 0 and its numerator is not, at a point that is on the curve. $\\frac{dy}{dx} = 0$ gives horizontal tangents.', 'implicit-relations'],
  ['$\\pi$ in discs and washers', 'Every disc or washer volume has a factor of $\\pi$; a square or triangle cross section has none.', 'disc-method-axes'],
];

export function entryPages(ctx) {
  const { map, C, put, head, tail, footer, crumbNav, crumbs, orgCrumbs, esc, text, SITE, BASE, COURSE_ID, COURSE_NAME, COURSE_HTML, BETA_PILL, LABEL, courseTitle, clampDesc, noindex, bodyOpen, questionHtml, questionForPage, groupSets, stimulusPanel, stimulusBody, isFreeTopic, frqs, liveTools } = ctx;
  const units = map.chapters.filter(c => c.part === 'course');
  const built = ch => map.topics.some(t => t.chapter === ch.id && C.built.has(t.id));
  const topicLink = (id, depth) => C.built.has(id) ? `<a href="${depth}notes/${id}.html">${esc(map.topicById(id).title)}</a>` : esc((map.topicById(id) || {}).title || id);
  const out = {};
  // Live trainers that practice an equation (EQ rows' sixth field), as links.
  const trainers = slugs => {
    const live = (slugs || []).map(sl => (liveTools || []).find(t => t.slug === sl)).filter(Boolean);
    return live.length ? `<span class="calc-eq-tools"><span class="calc-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ------------------------------------------------------- formula sheet */
  {
    const depth = '', path = 'formula-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Calculus Formulas and Theorems to Know', [LABEL]);
    const desc = 'The calculus formulas and theorems to know by heart, since the exam gives no formula sheet: what each is for, when to use it and where it is taught.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'Calculus formulas and theorems to know', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Formulas to know', url }])),
    ] };
    const R = x => renderMath(x);
    const sections = EQ.map(s => `<section class="xsection calc-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: formulas"><table class="calc-eq"><thead><tr><th scope="col">Formula</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="calc-eq-f">${R(`$${r[0]}$`)}</span></th><td>${R(r[1])}</td><td>${R(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="formula-sheet"')}
<main id="main" class="xshell calc-app calc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Formulas to know' }])}
  <header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Formulas and theorems to know</h1>
  <p class="lede">The exam gives no formula sheet. These are the formulas and theorems to know by heart, what each is for and when to use it.</p></header>
  <section class="xsection calc-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="calc-links">
      <li><b>Name the theorem and check its conditions.</b> Before you use the Intermediate Value Theorem, the Mean Value Theorem or the Extreme Value Theorem, say why the function is continuous (and differentiable, for the Mean Value Theorem) on the interval.</li>
      <li><b>Three decimal places, setup first.</b> On a calculator question, write the integral, derivative or equation you solve, then give the answer correct to three decimal places. Keep full precision until the end.</li>
      <li><b>Radian mode.</b> Every angle in calculus is in radians.</li>
    </ul>
  </section>
  ${EQ.length ? sections : '<p class="calc-small">The formula-by-formula guide arrives with the first published unit.</p>'}
  ${NOT_ON.length ? `<section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">Easy to forget</h2>
    <ul class="calc-eq-not">${NOT_ON.map(r => `<li><b>${R(r[0])}.</b> ${R(r[1])} <span class="calc-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
  </section>` : ''}
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[`<a href="score-calculator.html">Estimate your score</a>`, testLink('', 'Free unit practice tests'), `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
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

  /* ----------------------------------------------------- score calculator */
  {
    const depth = '', path = 'score-calculator.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Calculus Score Calculator', [LABEL]);
    const desc = 'Estimate your calculus exam score from multiple-choice questions right and free-response points. The method and its limits are explained on the page.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${url}#calc`, name: 'Calculus score calculator', url, description: desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Score calculator', url }])),
    ] };
    const body = `
${bodyOpen(' data-app="score-calculator"')}
<main id="main" class="xshell calc-app calc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Score calculator' }])}
  <header class="hero calc-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Score calculator</h1>
  <p class="lede">Enter your multiple-choice and free-response results to get an estimated score from 1 to 5.</p></header>
  <div id="calc-calc" class="calc-app-mount"><noscript><p>The calculator needs JavaScript. The method below lets you work it out by hand.</p></noscript></div>
  <section class="xsection" aria-labelledby="sc-how"><h2 id="sc-how">How the estimate works</h2>
    <p>Use the questions you got right and the points on each free-response question from a practice exam, or from a released one you scored with its rubric.</p>
    <p>The exam has two sections worth half the score each: 42 multiple-choice questions (29 without a calculator, 13 with one), and 6 free-response questions worth 9 points each, 54 in all. So the calculator turns each section into a score out of 50 and adds them:</p>
    <p class="calc-sc-formula"><b>composite = 50 &times; (multiple-choice right &divide; 42) + 50 &times; (free-response points &divide; 54)</b></p>
    <p>A composite of 66 or more is shown as a 5, 49 or more as a 4, 40 or more as a 3, 23 or more as a 2, and anything lower as a 1. There is no penalty for a wrong multiple-choice answer, so a blank and a wrong answer count the same.</p>
    <p class="calc-ex-band-warn"><b>These cut-offs are estimates, not official.</b> The College Board sets the real cut-offs after each exam, from how that year's students did, and has published none for the current calculus exam. We chose ours so that, with the average free-response scores the College Board published for 2024 and 2025 (about 43% and 44% of the points), they give about the share of 5s (about 20%), 4s or better (about 49%), 3s or better (about 64%) and 2s or better (about 87%) reported for 2024 to 2026. How the 42-question multiple-choice section will be scaled in 2027 is not published either. Treat a result within about 5 points of a cut-off as either score, and use the estimate to see which section has the most room to grow.</p>
  </section>
  <section class="xsection" aria-labelledby="sc-next"><h2 id="sc-next">Raise your score</h2>
    <ul class="calc-links">
      <li><a href="exams.html">Full practice exams</a> in the real format, with this estimate at the end.</li>
      <li><a href="justify.html">The justification trainer</a> for the justification points free response is built on.</li>
      <li><a href="formula-sheet.html">The formulas and theorems to know</a>${firstTest ? `, and ${testLink('', 'free unit practice tests')}` : ''}.</li>
    </ul>
  </section>
</main>
${footer(depth, 'page:score-calculator')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
<link rel="stylesheet" href="../assets/course/tool-studio.css">
${tail({ depth, section: 'exams', extra: ['pages/score.js', 'pages/calm-ref.js'], site: ['course/tool-studio.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'website', jsonld, noindex }) + body;
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
      return s ? `<div class="calc-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell calc-app calc-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero calc-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Most have four answer choices, as on the real exam, and a few ask you to type a value or an expression; sets share one graph or table.</p>
  <p class="calc-small calc-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="calc-qs" data-set="check">${html}</div>
  <section class="xsection calc-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="calc-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="calc-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="calc-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['calc-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
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

  /* ---------------------------------------------------- justification data */
  const prompts = loadJustify(C.data, map).filter(p => C.published.has(p.unit));
  out['assets/justify.json'] = JSON.stringify({
    skills: JUSTIFY_SKILLS,
    // "answer" is a raw key for questions (never TeX), so the model answers are rendered on their own.
    prompts: prompts.map((raw, i) => { const p = renderMath(raw), R1 = s => renderMath([s])[0]; return { id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: { answer: R1(raw.earns.answer), why: p.earns.why }, misses: { answer: R1(raw.misses.answer), why: p.misses.why }, ...(i < FREE_JUSTIFY ? { free: true } : {}) }; }),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
