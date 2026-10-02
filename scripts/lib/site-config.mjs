/* The hosts the site talks to, and the Content-Security-Policy every page
   carries, in one place.

   API_URL comes from worker/src/config.js, the one constant for the Worker's
   address. scripts/build-site-config.mjs writes it into the site files that
   call the Worker (lines marked `site-config:API_URL`) and normalizes the CSP
   meta tag on every page; the page generators import CSP from here.

   The CSP (site audit, "All pages' CSP"):
   - script-src names the two exact third-party files the site loads, both
     also pinned with SRI in the code that loads them, instead of all of
     cdn.jsdelivr.net (any package anyone publishes to npm);
   - connect-src names the one Worker instead of *.workers.dev (anyone's);
   - Umami's tracker is served from this site (assets/vendor), so its host
     is only a place events are sent, never a script source;
   - form-action 'self', so an injected form cannot post anywhere else.
   A meta CSP cannot carry frame-ancestors (browsers ignore it there), so the
   account page, where refunds are made, has a frame-buster instead
   (FRAME_BUSTER), and real headers need Cloudflare in front of the site
   (an owner step: docs/site-audit-notes/w3.md). */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { API_URL_DEFAULT } from '../../worker/src/config.js';

export const API_URL = API_URL_DEFAULT;
export const API_ORIGIN = new URL(API_URL).origin;
export const SUPABASE_ORIGIN = 'https://bsfcqrczehbcctwhxmrj.supabase.co';
export const UMAMI_ORIGIN = 'https://cloud.umami.is';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

/* The exact script files, read from the code that loads them so a version
   bump there cannot leave the CSP behind (check-site's csp rule compares). */
function supabaseSdkUrl() {
  const src = readFileSync(ROOT + 'assets/account.js', 'utf8');
  const v = src.match(/var SDK_VERSION = '([^']+)'/);
  if (!v) throw new Error('site-config: SDK_VERSION not found in assets/account.js');
  return `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${v[1]}/dist/umd/supabase.js`;
}
function polarEmbedUrl() {
  const src = readFileSync(ROOT + 'assets/premium.js', 'utf8');
  const m = src.match(/var EMBED_SRC = '([^']+)'/);
  if (!m) throw new Error('site-config: EMBED_SRC not found in assets/premium.js');
  return m[1];
}
export const SCRIPT_PINS = [supabaseSdkUrl(), polarEmbedUrl()];

/* The policy of an ordinary page. Pages that need more (the body map's WASM,
   the sound trainer's Wikimedia audio) keep their extra sources: see
   normalizeCsp. */
export const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${SCRIPT_PINS.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  `connect-src 'self' ${SUPABASE_ORIGIN} ${API_ORIGIN} ${UMAMI_ORIGIN}`,
  "media-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  'frame-src https://polar.sh https://sandbox.polar.sh https://buy.polar.sh',
].join('; ');

/* A redirect stub: one inline location.replace() and nothing else. */
export const STUB_CSP = "default-src 'self'; script-src 'unsafe-inline'; base-uri 'self'; object-src 'none'; form-action 'self'";

/* Pages where a payment or refund is made. GitHub Pages cannot send
   X-Frame-Options or frame-ancestors, so these hide themselves when framed
   and try to break out, which stops a clickjacking overlay. */
export const FRAMED_PAGES = ['account.html'];
export const FRAME_BUSTER = '<script>if(window.top!==window.self){document.documentElement.style.display="none";try{window.top.location.replace(window.self.location.href);}catch(e){}}</script>';

const WIDE = new Set(['https://cdn.jsdelivr.net', 'https://cloud.umami.is', 'https://gateway.umami.is']);

/* Bring one page's policy to the rules above, keeping anything page-specific
   ('wasm-unsafe-eval', extra media hosts). Idempotent. */
export function normalizeCsp(content) {
  const dirs = content.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [name, ...vals] = d.split(/\s+/);
    return { name, vals };
  });
  const get = (name) => dirs.find((d) => d.name === name);
  for (const d of dirs) {
    if (d.name === 'script-src') {
      const hadCdn = d.vals.includes('https://cdn.jsdelivr.net') || SCRIPT_PINS.some((p) => d.vals.includes(p));
      d.vals = d.vals.filter((v) => !WIDE.has(v) && !SCRIPT_PINS.includes(v));
      if (hadCdn) d.vals.push(...SCRIPT_PINS);
    }
    if (d.name === 'connect-src') {
      const hadWorker = d.vals.some((v) => /workers\.dev|^https:\/\/api\./.test(v)) || d.vals.includes(API_ORIGIN);
      const hadUmami = d.vals.includes(UMAMI_ORIGIN);
      d.vals = d.vals.filter((v) => !WIDE.has(v) && !/workers\.dev/.test(v) && v !== API_ORIGIN);
      if (hadWorker) d.vals.push(API_ORIGIN);
      if (hadUmami) d.vals.push(UMAMI_ORIGIN);
    }
  }
  if (!get('form-action')) {
    const at = dirs.findIndex((d) => d.name === 'frame-src');
    dirs.splice(at === -1 ? dirs.length : at, 0, { name: 'form-action', vals: ["'self'"] });
  }
  return dirs.map((d) => [d.name, ...d.vals].join(' ')).join('; ');
}
