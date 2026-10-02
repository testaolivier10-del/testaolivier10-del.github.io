/* The free/Premium story is told the same way everywhere, with the same
   numbers and dates.

   Audit findings (site audit 2026-10, "Free vs Premium, legal and trust" and
   SEO): terms and privacy said "Last updated 2 October" and the changelog
   "Premium is live 2 October" while privacy said Premium went on sale on
   1 October; the four manifests each told a different (and wrong) story and
   two shared the short name "LevlPrep"; Pass-or-extend's conditions lived
   only in the terms; and there was no pricing page. This checks:
   - Pass-or-extend's numbers in premium.js equal the Worker's GUARANTEE, and
     the terms state them, including that exams count only when finished
     while signed in;
   - terms.html and privacy.html carry the same "Last updated" date, and the
     changelog's "Premium is live" entry and the legal pages agree on the day
     Premium went on sale;
   - the canonical free sentence is on the hub, terms, sources and
     premium.html, and in the hub manifest; course manifests have their own
     "LevlPrep …" short names;
   - premium.html exists and the hub and account page link to it. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FREE_SENTENCE, premiumData } from '../lib/premium-data.mjs';

export default function ({ ROOT, fail }) {
  const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
  const { GUARANTEE } = premiumData();

  const worker = read('worker/src/premium.js');
  const w = /export const GUARANTEE = (\{[^}]*\})/.exec(worker);
  if (!w) fail('premium-copy: worker/src/premium.js has no GUARANTEE');
  else {
    const wg = Function(`return (${w[1]})`)();
    for (const k of ['claimDays', 'extendDays', 'minExams']) {
      if (wg[k] !== GUARANTEE[k]) fail(`premium-copy: Pass-or-extend ${k} is ${GUARANTEE[k]} in premium.js but ${wg[k]} in the Worker.`);
    }
  }

  const terms = read('terms.html');
  const pe = (/<p id="pass-or-extend">([\s\S]*?)<\/p>/.exec(terms) || [])[1] || '';
  if (!pe) fail('premium-copy: terms.html has no <p id="pass-or-extend">.');
  for (const [re, what] of [
    [new RegExp(`${GUARANTEE.extendDays}-day extension`), `a ${GUARANTEE.extendDays}-day extension`],
    [new RegExp(`within ${GUARANTEE.claimDays} days`), `within ${GUARANTEE.claimDays} days`],
    [new RegExp(`at least ${GUARANTEE.minExams} full timed exams`), `at least ${GUARANTEE.minExams} full timed exams`],
    [/while (you are )?signed in/, 'that exams count only when finished while signed in'],
  ]) if (pe && !re.test(pe)) fail(`premium-copy: terms.html's Pass-or-extend paragraph does not say ${what}.`);

  const updated = (rel) => (/Last updated (\d{1,2} \w+ \d{4})/.exec(read(rel)) || [])[1];
  const tu = updated('terms.html'), pu = updated('privacy.html');
  if (!tu || tu !== pu) fail(`premium-copy: terms.html (Last updated ${tu}) and privacy.html (${pu}) should carry the same date.`);
  const live = (/Premium is live <span class="date">([^<]+)<\/span>/.exec(read('changelog.html')) || [])[1];
  const sale = (/went on sale on (\d{1,2} \w+ \d{4})/.exec(read('privacy.html')) || [])[1];
  if (!live || live !== sale) fail(`premium-copy: the changelog says Premium went live on ${live}, privacy.html says it went on sale on ${sale}.`);
  const tsale = (/went on sale on (\d{1,2} \w+ \d{4})/.exec(terms) || [])[1];
  if (tsale && tsale !== sale) fail(`premium-copy: terms.html says Premium went on sale on ${tsale}, privacy.html ${sale}.`);

  const plain = (s) => s.replace(/&amp;/g, '&').replace(/&rsquo;/g, '’');
  for (const rel of ['index.html', 'terms.html', 'sources.html', 'premium.html']) {
    if (!existsSync(join(ROOT, rel))) { fail(`premium-copy: ${rel} is missing (node scripts/build-pricing.mjs writes premium.html).`); continue; }
    if (!plain(read(rel)).includes(FREE_SENTENCE)) fail(`premium-copy: ${rel} does not carry the free sentence from scripts/lib/premium-data.mjs.`);
  }
  for (const rel of ['index.html', 'account.html']) {
    if (!/href="(\/|\.\.\/)?premium\.html/.test(read(rel))) fail(`premium-copy: ${rel} does not link to premium.html.`);
  }

  const manifests = ['manifest.json', 'nremt/manifest.json', 'ochem/manifest.json', 'anatomy-physiology/manifest.json']
    .map((rel) => [rel, JSON.parse(read(rel))]);
  if (!manifests[0][1].description.includes(FREE_SENTENCE)) fail('premium-copy: manifest.json does not carry the free sentence.');
  const names = new Set();
  for (const [rel, m] of manifests) {
    if (names.has(m.short_name)) fail(`premium-copy: ${rel} shares the short name "${m.short_name}" with another manifest.`);
    names.add(m.short_name);
    if (rel !== 'manifest.json' && !/^LevlPrep \S/.test(m.short_name)) fail(`premium-copy: ${rel} short_name should be "LevlPrep <course>".`);
    if (rel !== 'manifest.json' && !/free forever/.test(m.description)) fail(`premium-copy: ${rel} should say what is free forever.`);
    if (rel !== 'manifest.json' && !/Premium adds/.test(m.description)) fail(`premium-copy: ${rel} should say what Premium adds.`);
  }
}
