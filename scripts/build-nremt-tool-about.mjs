/* Writes the closed "About this tool" (docs/tool-about.json) under the lede of the three NREMT tool pages that
   were thin before their scripts ran (docs/site-health.md, "Fuller tool pages"). nremt-studio.js moves the text
   into the studio's About, so a student sees it only by opening About.

     node scripts/build-nremt-tool-about.mjs           rewrite
     node scripts/build-nremt-tool-about.mjs --check   fail if a page is stale (CI) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toolAboutExtra } from './lib/tool-about.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const START = '<!-- tool-about:start -->', END = '<!-- tool-about:end -->';
let stale = 0;
for (const slug of ['body-map', 'scenario-sim', 'sound-trainer']) {
  const file = join(ROOT, 'nremt', `${slug}.html`);
  const html = readFileSync(file, 'utf8');
  const block = START + toolAboutExtra(`nremt/${slug}`) + END;
  let next;
  if (html.includes(START)) {
    next = html.slice(0, html.indexOf(START)) + block + html.slice(html.indexOf(END) + END.length);
  } else {
    const lede = html.match(/  <p class="lede">[^\n]*<\/p>\n/);
    if (!lede) throw new Error(`${slug}: no lede line to place the block after`);
    next = html.replace(lede[0], lede[0] + '  ' + block + '\n');
  }
  if (next === html) continue;
  if (check) { console.error(`STALE: nremt/${slug}.html (run node scripts/build-nremt-tool-about.mjs)`); stale++; }
  else { writeFileSync(file, next); console.log(`wrote nremt/${slug}.html`); }
}
if (stale) process.exit(1);
if (check) console.log('OK: NREMT tool About blocks are up to date.');
