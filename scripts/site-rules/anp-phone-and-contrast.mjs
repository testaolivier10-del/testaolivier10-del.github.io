/* Two A&P layout regressions the audit found (2026-10):

   1. Dark mode course home: `.anp-feature p` sat at 3.7:1 on the dark-theme
      navy. The dark override in anatomy-physiology/assets/anp-home.css must
      reach 4.5:1 against theme.css's dark --navy.
   2. Tools at 390 px: 12 to 25 chapter filter chips came before any content.
      Every tool that renders a "Filter by chapter" chip group must also render
      the one-select version (a <select id="…-chsel">) its CSS shows on phones. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

export default function anpPhoneAndContrast({ ROOT, fail }) {
  const theme = readFileSync(join(ROOT, 'assets', 'theme.css'), 'utf8');
  const dark = theme.slice(theme.indexOf(':root[data-theme="dark"]'));
  const navy = (dark.match(/--navy:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
  const home = join(ROOT, 'anatomy-physiology', 'assets', 'anp-home.css');
  if (navy && existsSync(home)) {
    const m = readFileSync(home, 'utf8').match(/:root\[data-theme="dark"\]\s*\.anp-feature p\{color:(#[0-9A-Fa-f]{6})/);
    if (!m) fail('anatomy-physiology/assets/anp-home.css: no dark-mode color for .anp-feature p (it was 3.7:1)');
    else if (ratio(m[1], navy) < 4.5) fail(`anatomy-physiology/assets/anp-home.css: dark .anp-feature p is ${ratio(m[1], navy).toFixed(2)}:1 on ${navy} (needs 4.5:1)`);
  }
  const tools = join(ROOT, 'anatomy-physiology', 'assets', 'tools');
  if (existsSync(tools)) for (const f of readdirSync(tools).filter((n) => n.endsWith('.js'))) {
    const src = readFileSync(join(tools, f), 'utf8');
    if (/aria-label="Filter by chapter"/.test(src) && !/<select id="[a-z]+-chsel"/.test(src)) fail(`anatomy-physiology/assets/tools/${f}: chapter chips without the phone select (one control at 390 px)`);
  }
}
