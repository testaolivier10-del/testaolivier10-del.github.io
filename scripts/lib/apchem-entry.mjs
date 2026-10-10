/* AP® Chemistry search-entry pages and exam data (docs/apchem-architecture.md,
   "Exams and entry pages"), written by scripts/build-apchem.mjs:

     equations-sheet.html        what each equation and constant on the
                                 official sheet is for, and what the sheet
                                 leaves out; free, indexable
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
import { loadExams, loadJustify, formUnits, FREE_JUSTIFY, JUSTIFY_SKILLS } from './apchem-exams.mjs';

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

/* The equations-sheet walkthrough. Our own words; the equations are the
   standard ones; the grouping and order are ours, not the sheet's. A row's
   sixth field lists the trainers (tools/<slug>.html) that practice it; only
   live ones are linked. */
const EQ = [
  { h: 'Particles, light and charge', id: 'atoms', rows: [
    ['F ∝ q₁q₂ / r²', 'Coulomb\'s law: the attraction between two charges grows with the charges and falls with the square of the distance.', 'Every "why is this ionization energy, radius, lattice energy or boiling point bigger" argument. You rarely calculate with it; you compare both species\' charges and distances.', 'Units 1, 2, 3', 'periodic-trends'],
    ['E = hν', 'The energy of one photon from its frequency.', 'Photoelectron spectroscopy, emission lines, which wavelengths can cause an electronic transition. h = 6.626 × 10⁻³⁴ J·s.', 'Units 1, 3', 'photons'],
    ['c = λν', 'Speed of light from wavelength and frequency.', 'Converting a wavelength (often given in nm: change it to m) to a frequency before E = hν. c = 2.998 × 10⁸ m/s.', 'Unit 3', 'photons'],
    ['N_A = 6.022 × 10²³ mol⁻¹', 'Avogadro\'s number: particles in one mole.', 'Moving between a count of particles and moles; per-photon energy to per-mole energy.', 'Unit 1', 'moles-molar-mass'],
  ] },
  { h: 'Gases, liquids and solutions', id: 'gases', rows: [
    ['PV = nRT', 'The ideal gas law.', 'Moles, molar mass or density of a gas from its pressure, volume and temperature. Temperature in kelvins, and pick the R that matches your units.', 'Unit 3', 'ideal-gas-law', ['units-sig-figs']],
    ['P₁V₁/T₁ = P₂V₂/T₂', 'The combined gas law, for a fixed amount of gas.', 'The same gas before and after a change in conditions. Again kelvins only.', 'Unit 3', 'ideal-gas-law'],
    ['P_total = P_A + P_B + …;  P_A = X_A × P_total', 'Dalton\'s law and mole fraction.', 'Gas mixtures, and gas collected over water (subtract the water\'s vapor pressure).', 'Unit 3', 'ideal-gas-law'],
    ['R = 8.314 J/(mol·K) = 0.08206 L·atm/(mol·K)', 'The gas constant in two sets of units.', '0.08206 with liters and atmospheres (gas law problems); 8.314 with joules (ΔG° = −RT ln K, the Nernst equation, kinetic energy).', 'Units 3, 9', 'ideal-gas-law', ['units-sig-figs']],
    ['STP: 273.15 K and 1.0 atm; 22.4 L/mol', 'Standard temperature and pressure, and the molar volume of an ideal gas there.', 'A shortcut only at STP. At any other conditions use PV = nRT.', 'Unit 3', 'ideal-gas-law'],
    ['KE = ½mv²', 'Kinetic energy of a moving particle.', 'Kinetic molecular theory: at the same temperature, lighter particles move faster on average.', 'Unit 3', 'kinetic-molecular-theory'],
    ['M = n_solute / L of solution', 'Molarity.', 'Every solution calculation: dilution, titration, stoichiometry in solution. Liters of solution, not of solvent.', 'Units 3, 4', 'solutions'],
    ['D = m/V;  molar mass = m/n', 'Density, and molar mass from a mass and an amount.', 'Identifying a gas or liquid; combined with PV = nRT for a gas\'s molar mass.', 'Units 1, 3', 'ideal-gas-law'],
    ['A = εbc', 'The Beer-Lambert law: absorbance from molar absorptivity, path length and concentration.', 'Spectrophotometry labs: a calibration line, then a concentration from an absorbance. Also kinetics labs that follow a colored species.', 'Units 3, 5, 7', 'beer-lambert-law'],
  ] },
  { h: 'Kinetics', id: 'kinetics', rows: [
    ['ln[A]_t − ln[A]_0 = −kt', 'The first-order integrated rate law.', 'Concentration after a time, or k from data. If ln[A] against t is a straight line, the reaction is first order (slope −k).', 'Unit 5', 'concentration-time'],
    ['1/[A]_t − 1/[A]_0 = kt', 'The second-order integrated rate law.', 'If 1/[A] against t is a straight line, the reaction is second order (slope k).', 'Unit 5', 'concentration-time'],
    ['t½ = 0.693/k', 'The half-life of a first-order reaction.', 'Only for first order: its half-life does not depend on concentration (radioactive decay, many decompositions).', 'Unit 5', 'concentration-time'],
  ] },
  { h: 'Equilibrium, acids and bases', id: 'equilibrium', rows: [
    ['Kc = [C]^c[D]^d / ([A]^a[B]^b);  Kp the same with partial pressures', 'The equilibrium constant for aA + bB ⇌ cC + dD.', 'Every equilibrium question; Q has the same form with the current values. Leave out pure solids and liquids.', 'Unit 7', 'q-and-k', ['q-vs-k', 'ice-table-drills']],
    ['Kw = [H₃O⁺][OH⁻] = 1.0 × 10⁻¹⁴ at 25 °C;  pH + pOH = 14.00', 'The ionization of water.', 'Converting between [H₃O⁺] and [OH⁻], or pH and pOH, at 25 °C.', 'Unit 8', 'acids-bases-intro', ['titration-curve-reader']],
    ['pH = −log[H₃O⁺];  pOH = −log[OH⁻];  pKa = −log Ka', 'Logarithmic scales for acidity and acid strength.', 'Base-10 log, never ln. Keep as many decimal places as the concentration has significant figures.', 'Unit 8', 'acids-bases-intro', ['units-sig-figs', 'titration-curve-reader']],
    ['Kw = Ka × Kb;  pKa + pKb = pKw', 'The link between a conjugate acid and base.', 'Getting Ka of NH₄⁺ from Kb of NH₃ (or the reverse) before a buffer or salt calculation.', 'Unit 8', 'weak-acids-bases', ['buffer-drills']],
    ['pH = pKa + log([A⁻]/[HA])', 'The Henderson-Hasselbalch equation.', 'Buffer pH from the ratio of conjugate base to weak acid. At half-equivalence the ratio is 1, so pH = pKa. For a basic buffer, use the pKa of the conjugate acid.', 'Unit 8', 'henderson-hasselbalch', ['buffer-drills', 'titration-curve-reader']],
  ] },
  { h: 'Thermodynamics and electrochemistry', id: 'thermo', rows: [
    ['q = mcΔT', 'Heat absorbed or released when a substance changes temperature.', 'Calorimetry: q of the solution, then ΔH per mole with the opposite sign.', 'Unit 6', 'calorimetry', ['units-sig-figs']],
    ['ΔH°rxn = Σ ΔH°f(products) − Σ ΔH°f(reactants)', 'Enthalpy of reaction from enthalpies of formation. ΔS° and ΔG° from tables work the same way.', 'Each value times its coefficient; an element in its standard state has ΔH°f = 0 (but not S° = 0).', 'Units 6, 9', 'enthalpy-of-formation'],
    ['ΔG° = ΔH° − TΔS°', 'Gibbs free energy from enthalpy and entropy.', 'Whether a process is thermodynamically favored, and at what temperatures. Convert ΔS° from J to kJ first.', 'Unit 9', 'gibbs-free-energy'],
    ['ΔG° = −RT ln K', 'The link between free energy and the equilibrium constant.', 'K from ΔG° or the reverse. R = 8.314 J/(mol·K), so ΔG° in joules. Natural log here.', 'Unit 9', 'free-energy-equilibrium'],
    ['ΔG° = −nFE°', 'The link between free energy and cell potential.', 'n is the moles of electrons transferred in the balanced equation. F = 96,485 C/mol e⁻, and 1 V = 1 J/C.', 'Unit 9', 'cell-potential'],
    ['E = E° − (RT/nF) ln Q', 'The Nernst equation: cell potential away from standard conditions.', 'Mostly reasoning: when Q < 1, E > E°; when Q > 1, E < E°; at equilibrium E = 0.', 'Unit 9', 'nernst-equation'],
    ['I = q/t', 'Current is charge per time (1 A = 1 C/s).', 'Electrolysis: charge from current and time, then moles of electrons with F, then moles of metal from the half-reaction.', 'Unit 9', 'electrolysis-faraday'],
  ] },
];
const NOT_ON = [
  ['A table of standard reduction potentials', 'Any E° you need is given in the question. Learn how to use one: the more positive E° is the cathode, and E°cell = E°(cathode) − E°(anode), never multiplied by a coefficient.', 'cell-potential'],
  ['Solubility rules', 'A question that needs to know whether a salt dissolves tells you, or gives a Ksp. Worth knowing anyway: sodium, potassium and ammonium salts, and all nitrates, dissolve.', 'net-ionic-equations'],
  ['The Arrhenius equation', 'How k depends on temperature is tested as reasoning with the collision model and energy distributions, not as a calculation.', 'collision-model'],
  ['The zero-order integrated rate law', '[A]_t = [A]_0 − kt. For a zero-order reaction [A] against t is a straight line with slope −k, and the half-life shortens as the reaction goes.', 'concentration-time'],
  ['Strong acids and bases', 'Learn the common strong acids (HCl, HBr, HI, HNO₃, H₂SO₄, HClO₄) and strong bases (group 1 hydroxides, and Ca, Sr, Ba hydroxides).', 'strong-acids-bases'],
  ['Formal charge, bond angles and electron configurations', 'None of the structure rules are on the sheet. Formal charge = valence electrons − (nonbonding electrons + ½ bonding electrons).', 'resonance-formal-charge'],
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
    return live.length ? `<span class="chem-eq-tools"><span class="chem-small">Practice it:</span> ${live.map(t => `<a href="tools/${t.slug}.html">${esc(t.name)}</a>`).join(', ')}</span>` : '';
  };
  // The first unit with a practice test, or none yet (no link to a page that is not built).
  const firstTest = units.find(built);
  const testLink = (depth, label) => firstTest ? `<a href="${depth}unit-tests/${firstTest.id}.html">${label}</a>` : '';

  /* ----------------------------------------------------- equations sheet */
  {
    const depth = '', path = 'equations-sheet.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Equations and Constants Sheet, Explained', [LABEL]);
    const desc = 'Every equation and constant on the chemistry exam reference sheet, explained: what it is for, when to use it, the common slips, and what the sheet leaves out.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'LearningResource', '@id': `${url}#sheet`, name: 'The equations and constants sheet, explained', url, description: desc, learningResourceType: 'Reference', isAccessibleForFree: true, educationalLevel: 'High school', inLanguage: 'en', isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Equations sheet, explained', url }])),
    ] };
    const sections = EQ.map(s => `<section class="xsection chem-eq-sec" aria-labelledby="eq-${s.id}"><h2 id="eq-${s.id}">${esc(s.h)}</h2>
    <div class="table-wrap" tabindex="0" role="region" aria-label="${esc(s.h)}: equations"><table class="chem-eq"><thead><tr><th scope="col">Equation</th><th scope="col">What it is</th><th scope="col">When you use it</th><th scope="col">Learn it in</th></tr></thead><tbody>${s.rows.map(r => `<tr><th scope="row"><span class="chem-eq-f">${esc(r[0])}</span></th><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}<br>${topicLink(r[4], depth)}${trainers(r[5])}</td></tr>`).join('')}</tbody></table></div></section>`).join('\n  ');
    const body = `
${bodyOpen(' data-app="equations-sheet"')}
<main id="main" class="xshell chem-app chem-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Equations sheet, explained' }])}
  <header class="hero chem-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>The equations and constants sheet, explained</h1>
  <p class="lede">What each equation and constant on the exam sheet is for, and when to use it.</p></header>
  <section class="xsection chem-eq-tips" aria-labelledby="eq-tips"><h2 id="eq-tips">Three habits that save points</h2>
    <ul class="chem-links">
      <li><b>Kelvins in every gas law and every thermodynamics equation.</b> K = °C + 273.15. The sheet gives the conversion; using °C is still one of the commonest slips.</li>
      <li><b>Match R to your units.</b> 0.08206 L·atm/(mol·K) with pressure and volume; 8.314 J/(mol·K) with energy. Then J or kJ consistently: ΔS° usually comes in J, ΔH° in kJ.</li>
      <li><b>log is not ln.</b> pH, pOH, pKa and Henderson-Hasselbalch use base-10 log. Only ΔG° = −RT ln K, the first-order rate law and the Nernst equation use ln.</li>
    </ul>
  </section>
  ${sections}
  <section class="xsection" aria-labelledby="eq-not"><h2 id="eq-not">What is not on the sheet</h2>
    <p>The exam gives you these values in the question, or expects you to reason without them. None of them is printed on the sheet.</p>
    <ul class="chem-eq-not">${NOT_ON.map(r => `<li><b>${esc(r[0])}.</b> ${esc(r[1])} <span class="chem-small">${topicLink(r[2], depth)}</span></li>`).join('')}</ul>
    <p>On exam day you get a periodic table and this sheet of equations and constants. The sheet itself is published by the College Board; this page is our own guide to using it.</p>
    <p>The sheet also lists unit symbols, conversions (1 atm = 760 mm Hg = 760 torr; 1 V = 1 J/C; 1 A = 1 C/s) and the metric prefixes from giga to pico.</p>
  </section>
  <section class="xsection" aria-labelledby="eq-next"><h2 id="eq-next">Practice with it</h2>
    <p>${[`<a href="score-calculator.html">Estimate your score</a>`, testLink('', 'Free unit practice tests'), `<a href="learn.html">Free notes for every topic</a>`, `<a href="exams.html">Full practice exams</a>`].filter(Boolean).join(' &middot; ')}</p>
  </section>
</main>
${footer(depth, 'page:equations-sheet')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
${tail({ depth, section: 'exams' })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ----------------------------------------------------- score calculator */
  {
    const depth = '', path = 'score-calculator.html', url = `${SITE}${BASE}${path}`;
    const title = courseTitle('Chemistry Score Calculator', [LABEL]);
    const desc = 'Estimate your chemistry exam score from multiple-choice questions right and free-response points. The method and its limits are explained on the page.';
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', '@id': `${url}#calc`, name: 'Chemistry score calculator', url, description: desc, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', isAccessibleForFree: true, isPartOf: { '@id': COURSE_ID } },
      crumbs(orgCrumbs([{ name: 'Score calculator', url }])),
    ] };
    const body = `
${bodyOpen(' data-app="score-calculator"')}
<main id="main" class="xshell chem-app chem-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../index.html' }, { name: COURSE_NAME, href: 'index.html' }, { name: 'Score calculator' }])}
  <header class="hero chem-hero"><div class="eyebrow">${COURSE_HTML} ${BETA_PILL}</div><h1>Score calculator</h1>
  <p class="lede">Enter your multiple-choice and free-response results to get an estimated score from 1 to 5.</p></header>
  <div id="chem-calc" class="chem-app-mount"><noscript><p>The calculator needs JavaScript. The method below lets you work it out by hand.</p></noscript></div>
  <section class="xsection" aria-labelledby="sc-how"><h2 id="sc-how">How the estimate works</h2>
    <p>Use the questions you got right and the points on each free-response question from a practice exam, or from a released one you scored with its rubric.</p>
    <p>The exam has two sections worth half the score each: 60 multiple-choice questions, and 7 free-response questions worth 46 points (three long questions at 10 points, four short at 4). So the calculator turns each section into a score out of 50 and adds them:</p>
    <p class="chem-sc-formula"><b>composite = 50 &times; (multiple-choice right &divide; 60) + 50 &times; (free-response points &divide; 46)</b></p>
    <p>A composite of 72 or more is shown as a 5, 58 or more as a 4, 42 or more as a 3, 27 or more as a 2, and anything lower as a 1. There is no penalty for a wrong multiple-choice answer, so a blank and a wrong answer count the same.</p>
    <p class="chem-ex-band-warn"><b>This is an estimate, not a predicted score.</b> The College Board sets the real cut-offs after each exam, from how that year's students did, and does not publish them for recent years. These are the cut-offs reported for the 2014 exam, the first in today's format and also weighted half and half out of 100; most score calculators use the same numbers. Recent exams have given more 5s (about 15-18% of students) than 2014 did (about 10%), so the real line for a 5 may now be a little lower. Use the estimate to see which section has the most room to grow.</p>
  </section>
  <section class="xsection" aria-labelledby="sc-next"><h2 id="sc-next">Raise your score</h2>
    <ul class="chem-links">
      <li><a href="exams.html">Full practice exams</a> in the real format, with this estimate at the end.</li>
      <li><a href="justify.html">The justification trainer</a> for the explain and justify points free response is built on.</li>
      <li><a href="equations-sheet.html">The equations sheet, explained</a>${firstTest ? `, and ${testLink('', 'free unit practice tests')}` : ''}.</li>
    </ul>
  </section>
</main>
${footer(depth, 'page:score-calculator')}
<link rel="stylesheet" href="assets/pages/pages.css">
<link rel="stylesheet" href="assets/pages/entry.css">
${tail({ depth, section: 'exams', extra: ['pages/score.js'] })}
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
      return s ? `<div class="chem-set">${stimulusPanel(g.stimulus, s, s.html.replace(/(src|href)="figures\//g, `$1="${depth}figures/`))}${items}</div>` : items;
    }).join('');
    const topics = map.topics.filter(t => t.chapter === ch.id && C.built.has(t.id));
    const pageData = { topic: null, unit: ch.id, free: true, sample: true, prereq: [], check: qs, stimuli };
    const others = units.filter(built).map(u => u.id === ch.id ? `<b>Unit ${u.n}</b>` : `<a href="${u.id}.html">Unit ${u.n}</a>`).join(' &middot; ');
    const body = `
${bodyOpen(` data-unit="${ch.id}" data-app="unit-test"`)}
<main id="main" class="xshell chem-app chem-entry">
  ${crumbNav([{ name: 'LevlPrep', href: '../../index.html' }, { name: COURSE_NAME, href: '../index.html' }, { name: ch.title, href: `../units/${ch.id}.html` }, { name: `Unit ${ch.n} practice test` }])}
  <header class="hero chem-hero"><div class="eyebrow">Unit ${ch.n} &middot; ${ch.weight[0]}&ndash;${ch.weight[1]}% of the exam ${BETA_PILL}</div><h1>Unit ${ch.n} practice test: ${esc(ch.title)}</h1>
  <p class="lede">${qs.length} exam-style questions from the unit, free, with an explanation for every option. Four answer choices each, and data sets that share one table, graph or particle diagram, as on the real exam.</p>
  <p class="chem-small chem-nav-ref">Covers: ${topics.map(t => esc(t.title)).join('; ')}.</p></header>
  <div class="chem-qs" data-set="check">${html}</div>
  <section class="xsection chem-nav-ref" aria-labelledby="ut-more"><h2 id="ut-more">Keep going</h2>
    <div class="chem-cards-row"><a class="btn-press" href="../practice.html?unit=${ch.id}">Practice the whole unit</a><a class="btn-outline" href="../exams.html?unit=${ch.id}">Take a timed unit test</a><a class="btn-outline" href="../unit-sheets/${ch.id}.html">Print the unit sheet</a></div>
    <p class="chem-small">Practice has every question in the unit, with feedback after each one; ${isFreeTopic(map, topics[0]) ? 'this unit\'s lessons are free.' : 'the notes for every topic are free.'} Other units: ${others}.</p>
  </section>
</main>
${footer(depth, `unit-test:${ch.id}`)}
<link rel="stylesheet" href="../assets/pages/pages.css">
<link rel="stylesheet" href="../assets/pages/entry.css">
<script type="application/json" id="chem-page-data">${JSON.stringify(pageData).replace(/</g, '\\u003c')}</script>
${tail({ depth, section: 'exams', extra: ['chem-questions.js', 'pages/sample.js'] })}
</body>
</html>
`;
    out[path] = head({ title, desc, path, depth, ogType: 'article', jsonld, noindex }) + body;
  }

  /* ---------------------------------------------------------- exam data */
  const ex = loadExams(C.data);
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
    prompts: prompts.map((p, i) => ({ id: p.id, unit: p.unit, topic: p.topic, practice: p.practice, skill: p.skill, title: p.title, context: p.context || '', prompt: p.prompt, checklist: p.checklist, earns: p.earns, misses: p.misses, ...(i < FREE_JUSTIFY ? { free: true } : {}) })),
  });
  return { pages: out, sampleUnits: units.filter(built).map(u => u.id), forms: live.length, prompts: prompts.length };
}
