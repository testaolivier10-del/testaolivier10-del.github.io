/* Builds each course's tutor-bank.json — the teaching half of the question bank,
   for the study assistant to search.

   questions.json is 2.3MB because it carries every option array and answer key,
   none of which teaches anything. The explanations do: 2,084 of them, all
   distinct, 1.2MB of prose written to explain why an answer is right. That is
   more teaching text than the study notes, and the assistant could not see any
   of it.
 
   This strips the bank down to what can answer a question — topic, domain, the
   stem for context, the explanation — under short keys, so the assistant can
   load it as a second tier without pulling the answer key along with it.
 
   Ochem's bank is the same idea in a different wrapper: practice-bank.json is
   a 1MB object keyed by topic id, whose `why` field explains each answer. Same
   treatment, so both courses have the same depth to draw on.

   Regenerate after editing either bank:  node scripts/build-tutor-bank.mjs */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'nremt/assets/questions.json';
const OUT = 'nremt/assets/tutor-bank.json';

const questions = JSON.parse(readFileSync(SRC, 'utf8'));
const seen = new Set();
const entries = [];

for (const item of questions) {
  const explain = String(item?.explain || '').replace(/\s+/g, ' ').trim();
  // Short explanations are answer-key notes ("Option B is correct"), not
  // teaching, and they pollute results with text that explains nothing on
  // its own.
  if (explain.length < 80) continue;
  if (seen.has(explain)) continue;
  seen.add(explain);

  entries.push({
    t: String(item?.topic || '').trim(),
    d: String(item?.domain || '').trim(),
    q: String(item?.q || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    e: explain,
  });
}

writeFileSync(OUT, JSON.stringify(entries));
const bytes = readFileSync(OUT).byteLength;
console.log(`${entries.length} entries -> ${OUT} (${(bytes / 1024).toFixed(0)} KB, from ${(readFileSync(SRC).byteLength / 1024).toFixed(0)} KB)`);

// ---------------------------------------------------------------- ochem
// The ochem bank used to be a script that assigned window.OchemPracticeBank,
// which this had to run in a throwaway VM context to read. It ships as plain
// JSON now (the browser fetches it rather than parsing a megabyte of
// JavaScript), so it just parses.
const OCHEM_SRC = 'ochem/assets/practice-bank.json';
const OCHEM_OUT = 'ochem/assets/tutor-bank.json';
const CURRICULUM = 'ochem/assets/curriculum.js';

const bank = JSON.parse(readFileSync(OCHEM_SRC, 'utf8'));

// Topic ids are slugs; curriculum.js holds the human titles.
const titles = {};
const curriculumSrc = readFileSync(CURRICULUM, 'utf8');
const titleRe = /\{\s*id:\s*['"]([a-z0-9-]+)['"]\s*,\s*title:\s*['"]([^'"]+)['"]/g;
let match;
while ((match = titleRe.exec(curriculumSrc)) !== null) {
  if (!titles[match[1]]) titles[match[1]] = match[2];
}

const ochemSeen = new Set();
const ochemEntries = [];

for (const [topicId, questions] of Object.entries(bank)) {
  if (!Array.isArray(questions)) continue;
  for (const item of questions) {
    const why = String(item?.why || '').replace(/\s+/g, ' ').trim();
    if (why.length < 80 || ochemSeen.has(why)) continue;
    ochemSeen.add(why);
    ochemEntries.push({
      t: titles[topicId] || topicId,
      d: topicId,
      q: String(item?.q || '').replace(/\s+/g, ' ').trim().slice(0, 160),
      e: why,
    });
  }
}

writeFileSync(OCHEM_OUT, JSON.stringify(ochemEntries));
console.log(`${ochemEntries.length} entries -> ${OCHEM_OUT} (${(readFileSync(OCHEM_OUT).byteLength / 1024).toFixed(0)} KB, from ${(readFileSync(OCHEM_SRC).byteLength / 1024).toFixed(0)} KB)`);
