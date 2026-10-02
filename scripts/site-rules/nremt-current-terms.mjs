/* Site audit 2026-10, NREMT course: 36 items, the notes and the mnemonics
   footer still said "EMT-B" / "EMT-Basic" (the level has been "EMT" since the
   2009 National Scope of Practice Model) and taught sliding in a backboard as
   routine. This keeps the current terms across the NREMT course: the pages,
   the bank, the notes and the flashcard sources. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const OUTDATED = [
  [/\bEMT-B(?:asic)?s?\b/, 'say "EMT"'],
  [/\bEMT Basic\b/, 'say "EMT"'],
  [/slide in a backboard/i, 'a long board is for extrication and moving, not routine'],
];

export default function ({ ROOT, fail }) {
  const files = [
    ...readdirSync(join(ROOT, 'nremt')).filter((n) => n.endsWith('.html')).map((n) => join(ROOT, 'nremt', n)),
    join(ROOT, 'nremt/assets/questions.json'),
    join(ROOT, 'nremt/assets/study-notes.json'),
    join(ROOT, 'scripts/lib/nremt-flashcard-sources.mjs'),
  ];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const [re, why] of OUTDATED) {
      const m = text.match(re);
      if (m) fail(`${relative(ROOT, file)}: "${m[0]}" is an outdated term; ${why}`);
    }
  }
}
