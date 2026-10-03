/* Site audit 2026-10, NREMT course (High): the study notes taught field
   triage from the 2011 scheme (GCS under 14, then anatomic, then mechanism,
   2–3 times a child's height) after the 2021 National Guideline for the Field
   Triage of Injured Patients replaced it with red and yellow criteria; and
   START triage items said "deceased or expectant" for the black tag, although
   Expectant is a SALT category. This fails on that wording anywhere in the
   NREMT notes, bank, flashcard sources and flowcharts. */
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RETIRED = [
  [/GCS\s*(?:&lt;|<|less than|under|below)\s*14/i, '2021 field triage uses motor GCS < 6, not GCS < 14'],
  [/GCS\s*(?:≤|&le;|<=)\s*13/i, '2021 field triage uses motor GCS < 6'],
  [/physiologic first,? then anatomic/i, 'the 2021 guideline has red and yellow criteria, not sequential steps'],
  [/2\s*[–-]\s*3 times the (?:child's )?height/i, '2021 field triage uses a fall of more than 10 ft at any age'],
  [/deceased(?:\/| or )expectant/i, 'START black is Deceased; Expectant is a SALT category'],
];

export default function ({ ROOT, fail }) {
  const files = [
    'nremt/assets/study-notes.json',
    'nremt/assets/questions.json',
    'scripts/lib/nremt-flashcard-sources.mjs',
    'nremt/flowcharts.html',
    'nremt/reference-cards.html',
  ];
  for (const rel of files) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    for (const [re, why] of RETIRED) {
      const m = text.match(re);
      if (m) fail(`${relative(ROOT, join(ROOT, rel))}: "${m[0]}" is retired triage wording; ${why}`);
    }
  }
}
