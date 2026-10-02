/* No page downloads the Supabase SDK or the study assistant up front.

   Audit finding (site audit 2026-10, performance): the Supabase SDK loaded on
   every page for every visitor just to count a page view, and the assistant
   (assets/tutor.js, 1,300 lines) was mounted on every page. Now account.js
   counts views with a plain fetch and loads the SDK only for a stored session,
   a sign-in callback or the sign-in dialog; site-chrome.js mounts only
   assets/tutor-launcher.js, which fetches tutor.js on the first reach. */
import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export default function ({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    if (rel.startsWith('scripts/') || rel.startsWith('docs/')) continue;
    const html = readFileSync(file, 'utf8');
    if (/<script[^>]+src="[^"]*supabase-js/i.test(html)) fail(`lazy-sdk-and-tutor: ${rel} loads the Supabase SDK in its HTML; account.js loads it when needed.`);
    if (/<script[^>]+src="[^"]*\/tutor\.js"/i.test(html)) fail(`lazy-sdk-and-tutor: ${rel} loads assets/tutor.js up front; site-chrome.js mounts tutor-launcher.js instead.`);
  }
  const chrome = readFileSync(join(ROOT, 'assets', 'site-chrome.js'), 'utf8');
  if (/['"]\/assets\/tutor\.js['"]/.test(chrome)) fail('lazy-sdk-and-tutor: site-chrome.js mounts assets/tutor.js on every page; mount tutor-launcher.js.');
  if (!/['"]\/assets\/tutor-launcher\.js['"]/.test(chrome)) fail('lazy-sdk-and-tutor: site-chrome.js no longer mounts assets/tutor-launcher.js.');

  const account = readFileSync(join(ROOT, 'assets', 'account.js'), 'utf8');
  const start = /function start\(\)\{([\s\S]*?)\n  \}/.exec(account);
  if (!start) fail('lazy-sdk-and-tutor: could not find start() in assets/account.js.');
  else {
    if (/loadSdk\(/.test(start[1])) fail('lazy-sdk-and-tutor: account.js start() loads the SDK for every visitor.');
    if (!/sessionLikely\(\)/.test(start[1])) fail('lazy-sdk-and-tutor: account.js start() must connect only when a session is likely.');
  }
  if (!/function trackPageview\(\)\{\s*postRpc\(/.test(account)) fail('lazy-sdk-and-tutor: the page counter must be a plain fetch (postRpc), not an SDK call.');
}
