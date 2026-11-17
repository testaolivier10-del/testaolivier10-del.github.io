/* One file preview of a tool page for the owner to open from disk (tools v2, docs/tools-v2-water-pollution-brief.md).

     node scripts/tool-preview.mjs environmental-science/tools/water-pollution.html out/index.html

   Every same-origin stylesheet and script the page names is inlined (fonts as data URLs), premium.js is unlocked
   (has() returns true, as in the browser tests), and the page's JSON fetches are answered from inlined copies
   (the tool's data, the glossary). Anything else the page would fetch or add later (analytics, sign in, the tutor)
   is answered with an empty "not here" response or not loaded at all, so the preview makes no network calls. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const [page, out] = process.argv.slice(2);
if (!page || !out) { console.error('usage: node scripts/tool-preview.mjs <page.html> <out.html>'); process.exit(1); }
const pagePath = resolve(ROOT, page), pageDir = dirname(pagePath);
let html = readFileSync(pagePath, 'utf8');
const local = (u) => { const p = u.startsWith('/') ? join(ROOT, u) : resolve(pageDir, u); return existsSync(p) ? p : null; };
const urlOf = (p) => '/' + relative(ROOT, p).split('\\').join('/');

// fonts and url() in css as data URLs
function inlineCss(css, file) {
  return css.replace(/url\((['"]?)([^)'"]+)\1\)/g, (m, q, u) => {
    if (/^(data:|https?:|#)/.test(u)) return m;
    const p = resolve(dirname(file), u.split(/[?#]/)[0]);
    if (!existsSync(p)) return m;
    const ext = p.split('.').pop(), type = { woff2: 'font/woff2', woff: 'font/woff', svg: 'image/svg+xml', png: 'image/png' }[ext] || 'application/octet-stream';
    return `url(data:${type};base64,${readFileSync(p).toString('base64')})`;
  });
}
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/, '');
html = html.replace(/<link rel="preload"[^>]*>\n?|<link rel="(icon|apple-touch-icon|manifest)"[^>]*>\n?/g, '');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  const p = local(href); if (!p) return '';
  return `<style data-src="${urlOf(p)}">\n${inlineCss(readFileSync(p, 'utf8'), p)}\n</style>`;
});
const SKIP = /\/(errors|account|hub-progress|chime|report-question|glossary-tip)\.js$/;   // sign in, error reporting, sounds, glossary tips: not needed offline
html = html.replace(/<script src="([^"]+)"([^>]*)><\/script>/g, (m, src, attrs) => {
  const p = local(src); if (!p || SKIP.test(p)) return '';
  let js = readFileSync(p, 'utf8');
  if (/\/premium\.js$/.test(p)) js = js.replace('function has(course) {', 'function has(course) { return true;');
  return `<script data-src="${urlOf(p)}"${attrs.replace(/\s*defer/g, '')}>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
});
// the JSON the page fetches: the tool's data and the glossary
const app = html.match(/data-src="([^"]+\.json)"/), files = {};
if (app) { const p = local(app[1]); if (p) files[app[1].split('/').pop()] = JSON.parse(readFileSync(p, 'utf8')); }
const gl = html.match(/data-glossary="([^"]+)"/);
if (gl) { const p = local(gl[1]); if (p) files[gl[1].split('/').pop()] = JSON.parse(readFileSync(p, 'utf8')); }
const shim = `<script>
/* tool-preview shim: no network. Inlined JSON for the page's own fetches; everything else answers "not here". */
(function(){
  var FILES = ${JSON.stringify(files)};
  window.fetch = function(u){
    var k = String(u && u.url || u).split('?')[0].split('/').pop();
    if(FILES[k]) return Promise.resolve(new Response(JSON.stringify(FILES[k]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return Promise.resolve(new Response('', { status: 404 }));
  };
  if(navigator.sendBeacon) navigator.sendBeacon = function(){ return true; };
  // scripts the page adds later (analytics, tutor, sign in) are not loaded
  function block(fn){ return function(n){ if(n && n.tagName === 'SCRIPT' && n.src && !/^data:/.test(n.src)) return n; if(n && n.tagName === 'LINK' && n.href && /^(https?:)/.test(n.href) && n.rel !== 'stylesheet') return n; return fn.apply(this, arguments); }; }
  Node.prototype.appendChild = block(Node.prototype.appendChild);
  Node.prototype.insertBefore = block(Node.prototype.insertBefore);
  try{ if(!localStorage.getItem('nremt_theme') && matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme', 'dark'); }catch(e){}
})();
</script>`;
html = html.replace(/<head>/, '<head>\n' + shim);
mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), html);
console.log(`tool-preview: ${out} (${Math.round(html.length / 1024)} KB, ${Object.keys(files).length} JSON files inlined)`);
