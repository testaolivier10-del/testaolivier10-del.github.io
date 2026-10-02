/* Every page's site header is a <header> landmark, and no page footer sits
   inside its main landmark.

   Guards the audit 2026-10 accessibility row "Landmarks: header isn't a
   landmark; footer inside main on 11 pages; ochem practice has no main". The
   header mount was a <div id="site-header">, so screen readers had no banner;
   and the footer (contentinfo) sat inside the content wrapper that is main.
   Pages that are a redirect stub or an HTML fragment are skipped. A page
   whose main is assigned at runtime (site-chrome.js) has its footer moved
   after main there (liftFooter); check-a11y.mjs checks that in a browser. */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/* True when a <footer> opens while a main element (or role="main") is open.
   A tag-stack walk over the markup: enough for these hand-written and
   generated pages, which close what they open. Script and style bodies are
   blanked first so their strings are not read as tags. */
function footerInMain(html) {
  const body = html.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const stack = [];
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
    const [, close, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (close) {
      const at = stack.map((e) => e.tag).lastIndexOf(tag);
      if (at !== -1) stack.length = at;
      continue;
    }
    if (VOID.has(tag) || /\/\s*$/.test(attrs)) continue;
    if (tag === 'footer' && stack.some((e) => e.main)) return true;
    stack.push({ tag, main: tag === 'main' || /\brole="main"/.test(attrs) });
  }
  return false;
}

export default function headerFooterLandmarks({ ROOT, fail, htmlFiles }) {
  for (const file of htmlFiles) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const html = readFileSync(file, 'utf8');
    if (!/<head[\s>]/i.test(html) || /http-equiv="refresh"/i.test(html)) continue;
    const mount = html.match(/<([a-z]+)\b[^>]*\bid="site-header"/);
    if (mount && mount[1] !== 'header') {
      fail(`${rel}: #site-header is a <${mount[1]}>; make it <header id="site-header"> so the site header is a banner landmark`);
    }
    if (footerInMain(html)) {
      fail(`${rel}: the page <footer> is inside <main> (or role="main"); close main before the footer`);
    }
  }
}
