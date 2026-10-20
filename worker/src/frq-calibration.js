/* Scored example answers for the FRQ grader's prompt (docs/frq-grader.md).

   One part of one real question per course, with three authored answers:
   full credit, partial and none, each graded point by point the way the
   grader must grade. They teach the three things a model gets wrong most:
   applying the rubric's own wording (units "with units" means units), the
   quote rule (no exact words, no point), and context (a conclusion about
   the sample is not one about the population).

   These are LevlPrep's own authored answers, not College Board samples. The
   questions they use are left out of the accuracy eval
   (scripts/frq-eval/cases.mjs checks), so the eval never grades a question
   the prompt has already shown the answer to. Changing anything here changes
   GRADER_VERSION's prompt digest, so cached grades are not reused. */

export const CALIBRATION = {
  apbio: {
    id: 'frq-density-bands',
    question: 'Bacteria grown in light nitrogen (14N) were moved to heavy nitrogen (15N) and divided once per generation. Percent of DNA at each density: generation 1: light 2%, intermediate 96%, heavy 2%. generation 2: light 1%, intermediate 51%, heavy 48%.',
    parts: [
      { label: 'a', prompt: 'Calculate the expected percentages of light, intermediate and heavy DNA at generation 3 if replication is semiconservative.',
        rubric: ['Light 0%, intermediate 25%, heavy 75% (2 of 8 molecules keep an old light strand paired with a heavy one; 6 are fully heavy).'] },
      { label: 'b', prompt: 'Describe how the data for generation 1 rule out the conservative model.',
        rubric: ['Describes that the conservative model predicts half light and half heavy at generation 1, with no intermediate DNA, but 96% of the DNA is intermediate.'] },
    ],
    answers: [
      { kind: 'full credit',
        text: { a: 'After 3 generations there are 8 molecules. 2 have one old light strand and one heavy strand, the other 6 are all heavy, so 0% light, 25% intermediate, 75% heavy.',
                b: 'In the conservative model the old molecule stays fully light and the copy is fully heavy, so generation 1 should be 50% light and 50% heavy with no hybrid band. But 96% of the DNA is intermediate.' },
        grade: { a: [{ quote: '0% light, 25% intermediate, 75% heavy', reason: 'Gives all three expected percentages for generation 3 correctly.', earned: true }],
                 b: [{ quote: 'generation 1 should be 50% light and 50% heavy with no hybrid band. But 96% of the DNA is intermediate', reason: 'States the conservative prediction and contrasts it with the 96% intermediate data.', earned: true }] } },
      { kind: 'partial',
        text: { a: 'Half of the DNA would be intermediate and half would be heavy, 50% and 50%.',
                b: 'The conservative model predicts some DNA stays light and some is heavy, but almost all of the DNA at generation 1 is intermediate (96%), so it is not conservative.' },
        grade: { a: [{ quote: '', reason: 'The student gave 50% intermediate and 50% heavy, which is generation 2, not the 25% and 75% expected at generation 3.', earned: false }],
                 b: [{ quote: 'The conservative model predicts some DNA stays light and some is heavy, but almost all of the DNA at generation 1 is intermediate (96%)', reason: 'Names the conservative prediction (light and heavy, no hybrid) and the 96% intermediate result; the exact 50/50 split is not required by the accepted answers.', earned: true }] } },
      { kind: 'no credit',
        text: { a: 'The DNA gets heavier each generation so it would be mostly heavy.',
                b: 'The conservative model is wrong because the bands at generation 1 look different.' },
        grade: { a: [{ quote: '', reason: '"Mostly heavy" gives no percentages, and the point needs 0%, 25% and 75%.', earned: false }],
                 b: [{ quote: '', reason: 'Says the bands "look different" without stating what the conservative model predicts or the 96% intermediate result.', earned: false }] } },
    ],
  },
  apchem: {
    id: 'frq-ethanol-hess',
    question: 'Reaction 1: C(graphite) + O2(g) → CO2(g), ΔH° = −393.5 kJ/mol. Reaction 2: H2(g) + ½ O2(g) → H2O(l), ΔH° = −285.8 kJ/mol. Reaction 3: C2H5OH(l) + 3 O2(g) → 2 CO2(g) + 3 H2O(l), ΔH° = −1366.7 kJ/mol. Target: 2 C(graphite) + 3 H2(g) + ½ O2(g) → C2H5OH(l).',
    parts: [
      { label: 'b', prompt: 'Calculate ΔH° for the target reaction.',
        rubric: ['Correct manipulation: Reaction 1 × 2, Reaction 2 × 3, Reaction 3 reversed, with each ΔH adjusted the same way. Also accept: 2(−393.5) + 3(−285.8) + 1366.7',
                 'Correct answer with units: −277.7 kJ/mol. Also accept: −278 kJ/mol'] },
    ],
    answers: [
      { kind: 'full credit',
        text: { b: 'ΔH = 2(−393.5) + 3(−285.8) − (−1366.7) = −787.0 − 857.4 + 1366.7 = −277.7 kJ/mol' },
        grade: { b: [{ quote: '2(−393.5) + 3(−285.8) − (−1366.7)', reason: 'Doubles reaction 1, triples reaction 2 and reverses reaction 3, adjusting each ΔH.', earned: true },
                     { quote: '−277.7 kJ/mol', reason: 'Correct value with units.', earned: true }] } },
      { kind: 'partial',
        text: { b: '2(-393.5) + 3(-285.8) + 1366.7 = -277.7' },
        grade: { b: [{ quote: '2(-393.5) + 3(-285.8) + 1366.7', reason: 'The manipulation matches the accepted setup exactly.', earned: true },
                     { quote: '', reason: 'The value −277.7 is right but has no units, and this point requires the answer with units.', earned: false }] } },
      { kind: 'no credit',
        text: { b: 'Add them up: −393.5 − 285.8 − 1366.7 = −2046.0 kJ/mol' },
        grade: { b: [{ quote: '', reason: 'Adds the three reactions as written: nothing is multiplied and reaction 3 is not reversed.', earned: false },
                     { quote: '', reason: '−2046.0 kJ/mol is not −277.7 kJ/mol.', earned: false }] } },
    ],
  },
  apphys: {
    id: 'frq-u1-stopping-distance',
    question: 'A car moves at constant speed v0, the driver reacts for a time tr, then brakes with constant acceleration of magnitude a until it stops. Part (b) found D = v0·tr + v0²/(2a).',
    parts: [
      { label: 'c', prompt: 'Calculate the stopping distance for v0 = 24 m/s, tr = 0.75 s and a = 6.0 m/s².',
        rubric: ['Correct substitution into the expression from part (b), with units. Also accept: D = (24 m/s)(0.75 s) + (24 m/s)²/(2 × 6.0 m/s²)',
                 'D = 66 m, with a unit (63 m to 69 m accepted for rounding of intermediate steps).'] },
    ],
    answers: [
      { kind: 'full credit',
        text: { c: 'D = (24 m/s)(0.75 s) + (24 m/s)^2 / (2 × 6.0 m/s^2) = 18 m + 48 m = 66 m' },
        grade: { c: [{ quote: 'D = (24 m/s)(0.75 s) + (24 m/s)^2 / (2 × 6.0 m/s^2)', reason: 'Substitutes every value, with units, into the part (b) expression.', earned: true },
                     { quote: '= 66 m', reason: 'Correct distance with a unit.', earned: true }] } },
      { kind: 'partial',
        text: { c: 'D = 24(0.75) + 24²/(2·6) = 18 + 48 = 66 m' },
        grade: { c: [{ quote: '', reason: 'The substitution is correct but carries no units, and this rubric point asks for the substitution with units.', earned: false },
                     { quote: '66 m', reason: 'Correct distance with a unit.', earned: true }] } },
      { kind: 'no credit',
        text: { c: 'The car goes 24 × 0.75 = 18 m before it stops.' },
        grade: { c: [{ quote: '', reason: 'Uses only the reaction distance; the braking term v0²/(2a) is missing.', earned: false },
                     { quote: '', reason: '18 m is outside 63 m to 69 m.', earned: false }] } },
    ],
  },
  apcalc: {
    id: 'frq-u4-table-medicine',
    question: 'C(t) is the concentration of a medicine in mg/L, t in hours; C is differentiable. Table: t = 0, 1, 3, 4, 6, 8; C(t) = 0, 7.4, 12.2, 12.0, 9.9, 7.3.',
    parts: [
      { label: 'a', prompt: "Use the data in the table to estimate C'(5). Show the computations that lead to your answer, and indicate units of measure.",
        rubric: ['A difference quotient on an interval that contains t = 5: (C(6) − C(4))/(6 − 4). Also accept: (9.9 − 12.0)/(6 − 4)',
                 "C'(5) ≈ −1.05 milligrams per liter per hour. Also accept: mg/L per hour; the units point needs the correct units with an answer"] },
    ],
    answers: [
      { kind: 'full credit',
        text: { a: "C'(5) ≈ (C(6) − C(4))/(6 − 4) = (9.9 − 12.0)/2 = −1.05 mg/L per hour" },
        grade: { a: [{ quote: '(C(6) − C(4))/(6 − 4)', reason: 'Difference quotient on [4, 6], which contains t = 5.', earned: true },
                     { quote: '−1.05 mg/L per hour', reason: 'Correct estimate with the correct units.', earned: true }] } },
      { kind: 'partial',
        text: { a: '(9.9-12.0)/2 = -1.05' },
        grade: { a: [{ quote: '(9.9-12.0)/2', reason: 'The accepted difference quotient with the table values.', earned: true },
                     { quote: '', reason: 'Gives −1.05 with no units; this point needs the units with the answer.', earned: false }] } },
      { kind: 'no credit',
        text: { a: "C'(5) is about 10.95 mg/L because it is halfway between 12.0 and 9.9." },
        grade: { a: [{ quote: '', reason: 'Averages two concentrations instead of computing a difference quotient.', earned: false },
                     { quote: '', reason: '10.95 mg/L is a concentration, not the rate −1.05 mg/L per hour.', earned: false }] } },
    ],
  },
  apstat: {
    id: 'frq-one-proportion-test',
    question: 'Three years ago 40% of a state\'s seniors did at least one hour of homework a night. This year a random sample of 600 of the 120,000 seniors gave p-hat = 0.355. H0: p = 0.40, Ha: p < 0.40, alpha = 0.05; part (c) found z = −2.25 and p-value = 0.0122.',
    parts: [
      { label: 'd', prompt: 'Justify a conclusion in the context of this study, using alpha = 0.05.',
        rubric: ['Compares the p-value with alpha and makes the decision: because 0.012 < 0.05, reject H0.',
                 'States the conclusion with evidence language about the parameter in context: there is convincing evidence that the true proportion of all the state\'s seniors who do at least one hour of homework a night is less than 0.40. "Proves", "accept", or a conclusion about the sample proportion does not earn this point.'] },
    ],
    answers: [
      { kind: 'full credit',
        text: { d: 'Because the p-value of 0.0122 is less than alpha = 0.05, we reject H0. There is convincing evidence that the true proportion of all the state\'s seniors who do at least an hour of homework a night is less than 0.40.' },
        grade: { d: [{ quote: 'Because the p-value of 0.0122 is less than alpha = 0.05, we reject H0', reason: 'Compares the p-value with alpha and makes the decision.', earned: true },
                     { quote: 'There is convincing evidence that the true proportion of all the state\'s seniors who do at least an hour of homework a night is less than 0.40', reason: 'Evidence language about the population proportion, in context.', earned: true }] } },
      { kind: 'partial',
        text: { d: 'Since 0.0122 < 0.05 we reject the null. The proportion of seniors in the sample who do homework is lower than 0.40.' },
        grade: { d: [{ quote: 'Since 0.0122 < 0.05 we reject the null', reason: 'Compares the p-value with alpha and rejects H0.', earned: true },
                     { quote: '', reason: 'The conclusion is about the sample ("in the sample"), not the true proportion of all the state\'s seniors, and has no evidence language.', earned: false }] } },
      { kind: 'no credit',
        text: { d: 'We accept H0 because the p-value is small, which proves homework has dropped.' },
        grade: { d: [{ quote: '', reason: 'No comparison of the p-value with 0.05, and "accept H0" is the wrong decision.', earned: false },
                     { quote: '', reason: '"Proves" is not evidence language and the parameter is not described in context.', earned: false }] } },
    ],
  },
  apenv: {
    id: 'frq-irrigation-calc',
    question: 'A 120-hectare farm applies 9,000 m³ of water per hectare per season with furrow irrigation.',
    parts: [
      { label: 'a', prompt: 'Calculate the total volume of water, in cubic meters, the farm applies in one season with furrow irrigation. Show your setup with units.',
        rubric: ['Correct setup: the area times the water applied per hectare, with units that cancel. Also accept: an equivalent product that shows both values',
                 'Correct answer with units: 1,080,000 m³. Also accept: 1.08 × 10⁶ m³'] },
    ],
    answers: [
      { kind: 'full credit',
        text: { a: '120 ha × 9,000 m³/ha = 1,080,000 m³' },
        grade: { a: [{ quote: '120 ha × 9,000 m³/ha', reason: 'Area times water per hectare, with units that cancel.', earned: true },
                     { quote: '1,080,000 m³', reason: 'Correct volume with units.', earned: true }] } },
      { kind: 'partial',
        text: { a: '120 x 9000 = 1,080,000' },
        grade: { a: [{ quote: '120 x 9000', reason: 'A product of both values, which the rubric also accepts as the setup.', earned: true },
                     { quote: '', reason: 'The number is right but has no units; this point needs m³.', earned: false }] } },
      { kind: 'no credit',
        text: { a: '9,000 / 120 = 75 m³' },
        grade: { a: [{ quote: '', reason: 'Divides instead of multiplying area by water per hectare.', earned: false },
                     { quote: '', reason: '75 m³ is not 1,080,000 m³.', earned: false }] } },
    ],
  },
};

export function calibrationText(course) {
  const c = CALIBRATION[course];
  if (!c) return '';
  const lines = ['SCORED EXAMPLES (authored by LevlPrep, scored by a teacher; they show the standard to apply, they are not this question):', '', `Example question: ${c.question}`];
  for (const p of c.parts) {
    lines.push(`Part (${p.label}): ${p.prompt}`);
    p.rubric.forEach((r, k) => lines.push(`  Point ${k + 1}: ${r}`));
  }
  for (const a of c.answers) {
    lines.push('', `Example answer (${a.kind}):`);
    for (const p of c.parts) lines.push(`<student_answer part="${p.label}">${a.text[p.label]}</student_answer>`);
    lines.push('Correct grading: ' + JSON.stringify({ parts: c.parts.map((p) => ({ label: p.label, points: a.grade[p.label] })) }));
  }
  return lines.join('\n');
}
