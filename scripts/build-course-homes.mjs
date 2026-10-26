#!/usr/bin/env node
/* Writes the round 2 course home blocks (docs/site-redesign.md, mockup S01) into the two hand-written
   course homes, nremt/index.html and ochem/index.html, from scripts/lib/course-home.mjs: the hero,
   "Start here", the domains (NREMT), notes beside exams, tools, and Free beside Premium. Each lands
   between <!-- course-home:<block>:start --> and <!-- course-home:<block>:end -->; everything else in
   those pages (the sample question, ochem's chapter path and JSON-LD from build-ochem-home.mjs, the
   page scripts) stays as written.

   Counts come from the data: NREMT questions per domain from nremt/assets/questions.json, chapter
   numbers from nremt/assets/study-notes.json, prices from assets/premium.js.

   node scripts/build-course-homes.mjs           rewrite the blocks
   node scripts/build-course-homes.mjs --check   exit 1 if either page is stale */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homeHero, homeSteps, homeDomains, notesAndExams, homeTools, homeDeal, sectionHead } from './lib/course-home.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECK = process.argv.includes('--check');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const fmt = (n) => n.toLocaleString('en-US');

/* ---------------------------------------------------------------- NREMT */
function nremt() {
  const bank = JSON.parse(read('nremt/assets/questions.json'));
  const qs = Array.isArray(bank) ? bank : bank.questions;
  const per = {};
  for (const q of qs) per[q.domain] = (per[q.domain] || 0) + 1;
  // The National Registry's EMT exam outline since 7 April 2025, biggest share first.
  const DOMAINS = [
    { d: 'Primary Assessment', w: [39, 43], p: 'Impression, ABCs, life threats and priority.' },
    { d: 'Patient Treatment & Transport', w: [20, 24], p: 'Interventions, medications and transport.' },
    { d: 'Scene Size-Up & Safety', w: [15, 19], p: 'Hazards, PPE, resources and triage.' },
    { d: 'Operations', w: [10, 14], p: 'Equipment, documentation, legal and wellness.' },
    { d: 'Secondary Assessment', w: [5, 9], p: 'History, the focused exam and reassessment.' },
  ];
  for (const x of DOMAINS) if (!per[x.d]) throw new Error(`nremt: no questions tagged "${x.d}"`);
  const chapters = JSON.parse(read('nremt/assets/study-notes.json')).chapters;
  const slug = (t) => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const chips = ['airway-management', 'primary-assessment', 'respiratory-emergencies', 'cardiac-emergencies', 'bleeding-control', 'ems-operations']
    .map((s) => chapters.find((c) => slug(c.title) === s)).filter(Boolean)
    .filter((c) => existsSync(join(ROOT, 'nremt/notes', `${slug(c.title)}.html`)))
    .map((c) => ({ t: c.title, i: `Ch ${c.num}`, href: `notes/${slug(c.title)}.html` }));
  const total = qs.length;

  const top = `${homeHero({
    key: 'nremt', up: '../',
    pill: 'NREMT&#8209;EMT &middot; Cognitive exam',
    t1: 'Level up before', t2: 'the real exam does.',
    hand: '911 call to hospital, one chapter at a time',
    lede: `${fmt(total)} questions, ${chapters.length === 40 ? 'forty' : chapters.length} chapters of notes and scenarios that run a call start to finish. Free to start and works offline; the notes are free forever.`,
    primary: `<a href="practice.html" class="ch-cta" id="heroPrimaryCta">Start practicing</a>
          <script>try{if(localStorage.getItem('nremt_inprogress_exam')||(localStorage.getItem('nremt_mastery')||'{}').length>2)heroPrimaryCta.classList.add('cta-pending')}catch(e){}</script>`,
    secondary: '<a href="#sample" class="ch-ghost">See a sample question</a>',
    trust: 'Made by Olivier Testa, an EMT who passed the NREMT studying with LevlPrep. <a href="../about.html">More about me</a>',
    cardId: 'nrStart',
    card: '<div class="k">Start here</div><h2>A 20-question domain drill</h2><p>Short and focused, with each answer checked as you go. Your weakest topics show up on the dashboard once you have answered a few.</p><a class="btn-press" href="practice.html">Start a drill</a>',
    panelExtra: '<div class="ch-mini" id="nrReview"><span class="k">Review queue</span><h2>Nothing due yet</h2><p>Anything you miss comes back when you are about to forget it, not on a fixed date.</p><a href="review.html">Open review &rarr;</a></div>',
  })}
${homeSteps([
    { h: 'Run a 20-question drill', p: 'Short and focused, with every answer explained. Your weakest topic areas show up once you have answered a few.', href: 'practice.html', go: 'Start a drill' },
    { h: 'Read what it points to', p: `${chapters.length === 40 ? 'Forty' : chapters.length} chapters of notes, free forever, from the call to the handover.`, href: 'study-notes.html', go: 'Open the notes' },
    { h: 'Sit a timed exam', p: 'A full length exam on the clock, scored by domain when you finish, so test day feels familiar.', href: 'exams.html', go: 'See the exams' },
  ], 'New to the course? Three steps, in this order.')}
${homeDomains({
    a: 'Practice by', b: 'exam domain',
    lede: 'The National Registry&rsquo;s EMT exam since 7 April 2025 follows a call from arrival to handover. Every question here is tagged by the step it tests, and practice exams draw them in the exam&rsquo;s proportions.',
    rows: DOMAINS.map((x) => ({
      h: x.d.replace(/&/g, '&amp;'), p: x.p, share: x.w[1] / DOMAINS[0].w[1],
      weight: `<b>${x.w[0]} to ${x.w[1]}%</b> of the exam &middot; ${fmt(per[x.d])} questions`,
      href: `practice.html?domain=${encodeURIComponent(x.d)}`,
    })),
  })}`;

  const mid = `${notesAndExams({
    notes: { eye: 'Learn &middot; free forever', a: `${chapters.length === 40 ? 'Forty' : chapters.length} chapters`, b: 'of notes', p: 'Every chapter of the EMT curriculum, with glossary terms, flowcharts and mnemonics alongside.', chips, href: 'study-notes.html', go: 'Open the notes' },
    exam: { eye: 'Exams', big: '100', unit: 'questions on the clock', p: 'Full length, exam paced, scored by domain when you finish.', href: 'exams.html', go: 'Start a timed exam', note: '<a href="exam-day.html">How the real exam works</a>: the adaptive format, the two-hour clock, cost, eligibility and retakes.' },
  })}
${homeTools({
    a: 'Tools for the', b: 'hands on part', lede: 'Anatomy, sounds, protocol flow, call simulations and the skill sheets.', allHref: 'tools.html',
    tools: [
      { href: 'body-map.html', name: 'Body Map', desc: 'A real 3D model. Turn the body, tap a region and get the structures, landmarks and findings.', icon: '<circle cx="12" cy="5" r="2.5"/><path d="M12 8v7M8 10h8M10 21l2-6 2 6"/>' },
      { href: 'scenario-sim.html', name: 'Scenarios', desc: 'Twenty-five branching calls, dispatch to handover. With Premium.', icon: '<path d="M4 12h4l2-5 4 10 2-5h4"/>' },
      { href: 'skillsheets.html', name: 'Skill Sheets', desc: 'The psychomotor stations and what fails them.', icon: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>' },
      { href: 'sound-trainer.html', name: 'Sound Trainer', desc: 'Wheezes, crackles, stridor and heart sounds, by ear.', icon: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>' },
      { href: 'flowcharts.html', name: 'Flow Diagrams', desc: 'Ten sequences: assessment, CPR, anaphylaxis, choking, triage.', icon: '<rect x="4" y="3" width="7" height="5" rx="1"/><rect x="13" y="16" width="7" height="5" rx="1"/><path d="M7.5 8v5h9v3"/>' },
      { href: 'formulary.html', name: 'Drug Formulary', desc: 'The seven core EMT drugs: doses, contraindications, and what stops you.', icon: '<rect x="4" y="9" width="16" height="6" rx="3"/><path d="M12 9v6"/>' },
    ],
  })}`;

  const deal = homeDeal({ key: 'nremt', up: '../', freeCta: '<a class="ch-ghost" href="practice.html">Start practicing</a>' });
  return { file: 'nremt/index.html', blocks: { top, mid, deal } };
}

/* ---------------------------------------------------------------- ochem */
function ochem() {
  const top = `${homeHero({
    key: 'ochem', up: '../',
    pill: 'Organic Chemistry &middot; free to start',
    t1: 'Push the arrows', t2: 'yourself.',
    hand: 'the why on every wrong step',
    lede: 'Twenty-three chapters, 123 topics and ten mechanisms you perform yourself, with the why on every wrong step.',
    primary: `<a href="learn.html" class="ch-cta" id="heroPrimaryCta">Open the textbook</a>
          <script>try{if((localStorage.getItem('ochem_progress')||'{}').length>2)heroPrimaryCta.classList.add('cta-pending')}catch(e){}</script>`,
    secondary: '<a href="tools/arrow-pusher.html?start=sn2-bromoethane" class="ch-ghost">Push the SN2 arrows, free</a>',
    trust: 'Every textbook page is free, and so are the first four chapters. <a href="how-to-study.html">How to study ochem</a>',
    cardId: 'homeResume',
    card: '<div class="k">Start here</div><h3>Atomic structure</h3><p>Foundations. The groundwork every later arrow uses.</p><a href="lessons/atomic-structure.html" class="btn-press">Start the first lesson</a>',
    panelExtra: '<div class="ch-mini" id="homeReview"><span class="k">Review queue</span><h3>Nothing due yet</h3><p>Finished concepts come back when they&rsquo;re shakiest, not on a fixed date.</p></div>',
  })}
${homeSteps([
    { h: 'Learn a topic from scratch', p: 'Start with atomic structure: the groundwork every later arrow uses. The first four chapters are free.', href: 'lessons/atomic-structure.html', go: 'Start the first lesson' },
    { h: 'Push the arrows yourself', p: 'Draw a mechanism and watch what it makes, with the why on every wrong step.', href: 'tools/arrow-pusher.html?start=sn2-bromoethane', go: 'Open the arrow pusher' },
    { h: 'Practice and review', p: 'Questions from every chapter, 15 a day free. Finished concepts come back when they&rsquo;re shakiest.', href: 'practice.html', go: 'Practice now' },
  ], 'New to the course? Three steps, in this order.')}`;

  const mid = `${notesAndExams({
    notes: { eye: 'Learn &middot; free forever', a: 'The textbook,', b: 'free', p: 'The textbook section for every topic is free, and so are the flashcards. The first four chapters are fully interactive.', chips: [], href: 'learn.html', go: 'Open the textbook' },
    exam: { eye: 'Exams', h: 'Timed tests <span>on your terms</span>', p: 'Timed tests on one chapter, a range of chapters or the whole course, with a full review at the end.', href: 'exams.html', go: 'See the exams' },
  })}
${homeTools({
    a: 'Tools that do', b: 'the chemistry', lede: 'Push electrons and watch the structure change. Rotate a Newman projection against a live energy curve. Draw a structure, get its &#185;H NMR.', allHref: 'tools.html',
    tools: [
      { href: 'tools/arrow-pusher.html', name: 'Arrow Pusher', desc: 'Draw a mechanism and watch what it makes.', icon: '<path d="M5 17c2-8 10-10 14-6"/><path d="M19 7v4h-4"/>' },
      { href: 'tools/resonance.html', name: 'Resonance Explorer', desc: 'Find every valid resonance form, and rank them.', icon: '<path d="M4 12h5M15 12h5M9 9l3 3-3 3M15 9l-3 3 3 3"/>' },
      { href: 'tools/conformations.html', name: 'Conformation Lab', desc: 'Turn the bond. Watch the energy.', icon: '<circle cx="12" cy="12" r="7"/><path d="M12 5v14M6 8.5l12 7"/>' },
      { href: 'tools/reaction-predictor.html', name: 'Reaction Predictor', desc: 'SN1, SN2, E1 or E2, and why, factor by factor.', icon: '<path d="M4 12h12M12 7l5 5-5 5"/>' },
      { href: 'tools/spectroscopy.html', name: 'Spectroscopy Lab', desc: 'Read the peaks, name the compound.', icon: '<path d="M3 18h18M5 18l2-8 2 8 2-12 2 12 2-5 2 5"/>' },
      { href: 'tools/reagent-roadmap.html', name: 'Reagent Roadmap', desc: 'From any functional group to any other, with the reagents.', icon: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h6a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8"/>' },
    ],
  })}`;

  const deal = homeDeal({ key: 'ochem', up: '../', freeCta: '<a class="ch-ghost" href="lessons/atomic-structure.html">Start the first lesson</a>' });
  return { file: 'ochem/index.html', blocks: { top, mid, deal } };
}

/* The ochem chapter path keeps its own section, now headed like the rest of the page. */
export const ochemPathHead = sectionHead('chPath', 'The path through', 'the course', 'Each chapter leans on the last. Tap one to open it.');

let stale = 0;
for (const page of [nremt(), ochem()]) {
  const before = read(page.file);
  let html = before;
  for (const [name, inner] of Object.entries(page.blocks)) {
    const a = `<!-- course-home:${name}:start -->`, b = `<!-- course-home:${name}:end -->`;
    const i = html.indexOf(a), j = html.indexOf(b);
    if (i === -1 || j < i) { console.error(`${page.file}: expected ${a} … ${b}.`); process.exit(1); }
    html = html.slice(0, i + a.length) + '\n' + inner + '\n' + html.slice(j);
  }
  if (html === before) continue;
  if (CHECK) { console.error(`${page.file} is stale. Run: node scripts/build-course-homes.mjs`); stale++; continue; }
  writeFileSync(join(ROOT, page.file), html);
  console.log(`${page.file}: course home blocks rewritten.`);
}
if (stale) process.exit(1);
if (CHECK) console.log('course homes are up to date.');
