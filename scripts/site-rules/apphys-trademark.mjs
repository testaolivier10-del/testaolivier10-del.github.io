/* The AP® mark, used the way the trademark rules allow (docs/apphys-spec.md
   decision 2, and docs/apbio-spec.md decisions 2, 3 and 12).

   Guards the owner's brief for the AP® Physics 1 course before its first page
   ships: the mark is "AP®", with the ®, used only as an adjective ("AP®
   Physics"), never plural or possessive; every page that uses it carries the
   College Board disclaimer; the mark never appears in a URL, a file name or a
   meta description, keywords or og:description (only <title> and og:title
   may carry "AP® Physics 1"). Pages come from scripts/build-apphys.mjs, so a
   failure here means a template or authored text slipped.

   Forked from apchem-trademark.mjs. Pages outside physics/ (the hub,
   premium.html, privacy, terms, the 404 and offline pages, account) are
   already held to the registered mark by that rule, so this one checks
   physics/ only, plus every web app manifest (an install name is ad copy). */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { DISCLAIMER, hasApToken, trademarkProblems } from '../lib/apphys-build.mjs';

const DISCLAIMER_HTML = DISCLAIMER.replace(/&/g, '&amp;');

function filesUnder(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) filesUnder(full, out); else out.push(full);
  }
  return out;
}

export default function apphysTrademark({ ROOT, fail, htmlFiles }) {
  const rel = f => relative(ROOT, f).split(sep).join('/');
  // No web app manifest carries the mark, or "AP" at all.
  for (const m of ['manifest.json', ...['nremt', 'ochem', 'anatomy-physiology', 'bio', 'chem', 'physics'].map(d => `${d}/manifest.json`)]) {
    const f = join(ROOT, m);
    if (existsSync(f) && /\bAP\b/.test(readFileSync(f, 'utf8'))) fail(`${m}: a web app manifest carries "AP" (docs/apbio-spec.md decision 12)`);
  }
  // No served path under physics/ carries the token "ap" (decision 2).
  for (const f of filesUnder(join(ROOT, 'physics'))) {
    const r = rel(f);
    if (hasApToken(r.slice('physics/'.length))) fail(`${r}: a path under physics/ contains the token "ap" (docs/apphys-spec.md decision 2)`);
  }
  for (const file of htmlFiles) {
    const r = rel(file);
    const html = readFileSync(file, 'utf8');
    // No link from anywhere into physics/ with the token "ap" in it.
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const ref = m[1];
      if (/^(https?:|mailto:|tel:|data:|#)/.test(ref) && !ref.includes('levlprep.com/physics/')) continue;
      const target = ref.includes('levlprep.com/physics/') ? ref.split('levlprep.com/')[1] : relative(ROOT, join(ref.startsWith('/') ? ROOT : dirname(file), ref.split('#')[0].split('?')[0])).split(sep).join('/');
      if (target.startsWith('physics/') && hasApToken(ref.replace(/^.*?physics\//, ''))) fail(`${r}: link "${ref}" into physics/ contains the token "ap"`);
    }
    if (r.startsWith('physics/data/')) continue;
    // Pages outside physics/ are held to the registered mark by apbio-trademark.
    if (!r.startsWith('physics/')) continue;
    if (/<meta http-equiv="refresh"/i.test(html)) continue;
    const visible = html.replace(/<script\b[\s\S]*?<\/script>/g, ' ').replace(/<style\b[\s\S]*?<\/style>/g, ' ');
    if (/\bAP\b/.test(visible) && !html.includes(DISCLAIMER_HTML) && !html.includes(DISCLAIMER)) fail(`${r}: uses the AP® mark without the disclaimer ("${DISCLAIMER}")`);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    for (const p of trademarkProblems(title)) fail(`${r}: <title> ${p}`);
    for (const p of trademarkProblems(visible.replace(/<title>[\s\S]*?<\/title>/, ' ').replace(/<meta\b[^>]*>/g, ' '))) fail(`${r}: ${p}`);
    for (const m of html.matchAll(/<meta\s+(?:name|property)="(description|keywords|og:description|twitter:description)"\s+content="([^"]*)"/g))
      if (/\bAP\b/.test(m[2])) fail(`${r}: meta ${m[1]} contains "AP" (only <title> and og:title may carry the mark)`);
  }
}
