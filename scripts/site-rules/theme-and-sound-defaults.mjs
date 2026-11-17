/* The site opens light unless dark was picked, and answer sounds start off.

   - Light by default (owner 2026-11-16, reversing the audit 2026-10 row that
     followed the OS): every page's first-paint theme script (the inline one
     in <head> that reads nremt_theme) turns dark on only for a saved "dark"
     and must not read prefers-color-scheme. Generators are checked too.
   - "Sounds on by default": assets/chime.js must start disabled and play only
     after an explicit 'on' is saved. */
import { readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const GENERATORS = ['scripts/build-notes-pages.mjs', 'scripts/build-ochem-glossary.mjs', 'scripts/lib/anp-build.mjs', 'scripts/build-pricing.mjs'];
const THEME_READ = /<script>[^<]*localStorage\.getItem\("nremt_theme"\)[^<]*<\/script>/g;

export default function themeAndSoundDefaults({ ROOT, fail, htmlFiles }) {
  const sources = htmlFiles.map((f) => [f, relative(ROOT, f).split(sep).join('/')])
    .concat(GENERATORS.filter((g) => existsSync(join(ROOT, g))).map((g) => [join(ROOT, g), g]));
  for (const [file, rel] of sources) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(THEME_READ)) {
      if (/prefers-color-scheme/.test(m[0])) {
        fail(`${rel}: the first-paint theme script follows the device setting; the site opens light unless dark was picked`);
        break;
      }
    }
  }

  const chime = readFileSync(join(ROOT, 'assets/chime.js'), 'utf8');
  if (!/var enabled = false;/.test(chime) || !/getItem\(PREF_KEY\) === 'on'/.test(chime)) {
    fail('assets/chime.js: answer sounds must be off until the reader turns them on (enabled = false; only a saved "on" enables)');
  }
}
