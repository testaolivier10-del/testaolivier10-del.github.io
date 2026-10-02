/* Site audit 2026-10, Fix-first 3: assets/premium.js trusted the cached
   levlprep_premium_v1 when no user was loaded and exported _setLaunched and
   other `_` internals on window.LevlPremium, so one line in the console
   unlocked Premium. Guards: no `_`-prefixed key in the exported API, no
   launch switch reachable from window, test internals only through the
   harness's sandbox-only __levlTestHooks, and expiry() refuses without a
   signed-in user. Behaviour is tested in scripts/test/premium.test.mjs. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function ({ ROOT, fail }) {
  const src = readFileSync(join(ROOT, 'assets/premium.js'), 'utf8');
  const start = src.indexOf('window.LevlPremium = {');
  if (start === -1) { fail('assets/premium.js: window.LevlPremium export not found'); return; }
  const api = src.slice(start, src.indexOf('};', start));
  for (const m of api.matchAll(/^\s*(_\w+)\s*:/gm)) {
    fail(`assets/premium.js: window.LevlPremium exports test hook ${m[1]}; put it on __levlTestHooks`);
  }
  if (/setLaunched|LAUNCHED\s*=\s*!!/.test(api)) fail('assets/premium.js: the launch switch is reachable from window.LevlPremium');
  if (/_setLaunched/.test(src)) fail('assets/premium.js: _setLaunched is back');
  const hooks = src.indexOf('__levlTestHooks');
  if (hooks !== -1 && !/typeof __levlTestHooks === 'object'/.test(src)) {
    fail('assets/premium.js: test hooks must be gated on the sandbox-only __levlTestHooks');
  }
  const exp = src.slice(src.indexOf('function expiry('), src.indexOf('function has('));
  if (!/if \(!uid\) return null;/.test(exp)) fail('assets/premium.js: expiry() must return null when nobody is signed in');
}
