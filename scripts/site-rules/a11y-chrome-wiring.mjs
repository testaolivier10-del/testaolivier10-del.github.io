/* The accessibility wiring the audit found missing stays in the shared code.

   Guards the audit 2026-10 fix-first 12 and accessibility rows, at the
   source level (check-a11y.mjs drives the same things in a browser):
   - the header settings menu (dark mode, answer sounds) is a named button with
     aria-expanded, and its two switches carry aria-pressed (the phone "More"
     sheet it once guarded went away with the five tabs, docs/course-redesign-r4.md);
   - the floating buttons sit below the phone tab bar's overlays (z-index under 44);
   - the study assistant panel is a dialog with a live log;
   - right and wrong answers carry a mark and a word, not colour alone
     (the ::before markers in theme.css for ochem and A&P options);
   - A&P single-answer options are a radio group, not toggle buttons. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function a11yChromeWiring({ ROOT, fail }) {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');
  const chrome = read('assets/site-chrome.js');
  if (!/id="settingsBtn" aria-haspopup="true" aria-expanded="false" aria-controls="settingsMenu" aria-label="[^"]+"/.test(chrome)) {
    fail('assets/site-chrome.js: the settings menu button must be named and carry aria-expanded and aria-controls');
  }
  if (!/setAttribute\('aria-expanded', open \? 'true' : 'false'\)/.test(chrome) || !/setAttribute\('aria-pressed'/.test(chrome)) {
    fail('assets/site-chrome.js: header menus must update aria-expanded, and the theme and sound switches aria-pressed');
  }
  const tutor = read('assets/tutor.js');
  if (!/setAttribute\('role', opts\.inline \? 'region' : 'dialog'\)/.test(tutor)) fail('assets/tutor.js: the floating panel must have role="dialog"');
  if (!/role="log" aria-live="polite"/.test(tutor)) fail('assets/tutor.js: answers must land in an aria-live log');
  const z = tutor.match(/\.lp-launch\{position:fixed;[^}]*z-index:(\d+)/);
  if (!z || Number(z[1]) >= 44) fail('assets/tutor.js: the assistant button must sit below the More sheet (z-index under 44)');
  const pt = read('ochem/assets/periodic-table.css').match(/\.pt-fab\{[^}]*z-index:(\d+)/);
  if (!pt || Number(pt[1]) >= 44) fail('ochem/assets/periodic-table.css: the periodic-table button must sit below the More sheet (z-index under 44)');
  const theme = read('assets/theme.css');
  for (const sel of ['.choice-btn.correct::before', '.choice-btn.wrong::before', '.anp-opt.is-right::before', '.anp-opt.is-wrong::before']) {
    if (!theme.includes(sel)) fail(`assets/theme.css: ${sel} must mark a graded option with an icon and a word, not colour alone`);
  }
  const anp = read('anatomy-physiology/assets/anp-questions.js');
  if (!/role="radiogroup"/.test(anp) || !/role="radio" aria-checked="false"/.test(anp)) {
    fail('anatomy-physiology/assets/anp-questions.js: single-answer options must be a radio group (role="radio", aria-checked)');
  }
}
