/* Builds what the deploy publishes (docs/premium-vault.md):

     .deploy/site/    the public site: every tracked site file, minus build-only
                   folders, with each Premium lesson page replaced by a stub
     .deploy/vault/   the Premium lesson pages themselves, plus _index.json
                   (path -> course), shipped only to the Worker's private assets

     node scripts/build-deploy.mjs           build both
     node scripts/build-deploy.mjs --list    print what is vaulted, per course

   Which pages are Premium is decided by scripts/vault/rules.mjs from each
   page's own markup, the same signal the page's lock reads in the browser. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { premiumCourse } from './vault/rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// A dot folder: every site check already skips dot folders, so the build never shows up as a second site.
const OUT = path.join(ROOT, '.deploy');
const SITE = path.join(OUT, 'site');
const VAULT = path.join(OUT, 'vault');
const listOnly = process.argv.includes('--list');

/* Never published: the repo's own machinery, and each course's data/ folder,
   which only the build scripts read (it holds lesson sources, so publishing it
   would publish the vault). */
const EXCLUDE_DIRS = ['docs/', 'scripts/', 'worker/', '.github/', '.serena/', '.claude/', 'node_modules/', '.deploy/'];
const EXCLUDE_FILES = new Set(['CLAUDE.md', 'README.md', 'package.json', 'package-lock.json', '.gitignore', 'CNAME']);
const COURSE_DATA = /^[a-z0-9-]+\/data\//;
const MAX_FILES = 19500;              // Workers static assets: 20,000 files per version on the free plan
const MAX_BYTES = 25 * 1024 * 1024;   // and 25 MiB per file

function published(rel) {
  if (EXCLUDE_FILES.has(rel)) return false;
  if (EXCLUDE_DIRS.some((d) => rel.startsWith(d))) return false;
  if (COURSE_DATA.test(rel)) return false;
  return true;
}

const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&(?![a-z#0-9]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The stub: the real page's head without its scripts (the inline theme line
   stays, so dark mode does not flash), its title and opening paragraph so the
   page still says what it teaches, and assets/vault.js to open it. */
export function stubFor(rel, html, course) {
  const headEnd = html.indexOf('</head>');
  const bodyTag = /<body[^>]*>/i.exec(html);
  if (headEnd < 0 || !bodyTag) throw new Error(`deploy: ${rel} has no head or body`);
  // noindex: the stub has a title and one sentence, nothing a search engine
  // should rank; the free notes page for the topic is the one to find (site
  // health 2026-11-10). "follow" so its links still count.
  const head = html.slice(0, headEnd).replace(/<script\b(?![^>]*application\/ld\+json)[^>]*\bsrc=[^>]*>\s*<\/script>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>\s*/gi, '') + '<meta name="robots" content="noindex, follow">\n';
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const title = h1 ? text(h1[1]) : text((/<title>([\s\S]*?)<\/title>/i.exec(html) || [, ''])[1]).replace(/\s*[|·–-]\s*LevlPrep.*$/, '');
  // The page's own meta description says what it teaches; the first real paragraph if it has none.
  const desc = /<meta name="description" content="([^"]*)"/i.exec(html);
  let hook = desc ? desc[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
  const after = h1 ? html.slice(h1.index + h1[0].length) : html.slice(bodyTag.index);
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while (!hook && (m = re.exec(after))) {
    const t = text(m[1]);
    if (t.length >= 60) { hook = t.length > 320 ? t.slice(0, 317).replace(/\s+\S*$/, '') + '…' : t; break; }
  }
  const dir = rel.split('/')[0];
  const notesRel = `${dir}/notes/${path.basename(rel)}`;
  const notes = fs.existsSync(path.join(ROOT, notesRel)) ? '/' + notesRel : '';
  return `${head}<style>
.vault-page{max-width:44rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
.vault-eyebrow{font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;opacity:.7;margin:0 0 .4rem}
.vault-page h1{margin:0 0 .8rem}
.vault-hook{opacity:.85;margin:0 0 1.5rem}
.vault-card .vault-why{margin:.25rem 0 1rem}
.vault-notes{margin-top:1.25rem}
</style>
</head>
${bodyTag[0]}
<header id="site-header"></header>
<main class="vault-page" id="main">
  <p class="vault-eyebrow">Premium lesson</p>
  <h1>${esc(title)}</h1>
  ${hook ? `<p class="vault-hook">${esc(hook)}</p>` : ''}
  <div id="vault-card" class="vault-card" aria-live="polite"><p class="vault-why">Opening your lesson…</p></div>
</main>
<script src="/assets/vault.js" data-course="${course}" data-path="${rel}"${notes ? ` data-notes="${notes}"` : ''}></script>
</body>
</html>
`;
}

/* Response headers for the static site (Workers static assets read _headers).
   Fonts never change under the same name and course art changes rarely, so a
   browser keeps them instead of asking again on every page; HTML, CSS and
   scripts keep Cloudflare's default (always rechecked), so a deploy shows at
   once. The workers.dev copy of the site is the same pages on another host:
   noindex there, so only levlprep.com is in search. */
export const HEADERS = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/covers/*
  Cache-Control: public, max-age=604800

https://:project.:account.workers.dev/*
  X-Robots-Tag: noindex
`;

function main() {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0').filter(Boolean);
  const site = files.filter(published);
  const vaulted = {};
  const counts = {};
  for (const rel of site) {
    if (!rel.endsWith('.html')) continue;
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const course = premiumCourse(rel, html);
    if (course) { vaulted[rel] = course; counts[course] = (counts[course] || 0) + 1; }
  }
  if (listOnly) {
    console.log(JSON.stringify(counts, null, 2));
    console.log(Object.keys(vaulted).length, 'pages vaulted of', site.length, 'published files');
    return;
  }
  if (site.length > MAX_FILES) throw new Error(`deploy: ${site.length} files is over the ${MAX_FILES} limit (docs/premium-vault.md, File limit)`);

  fs.rmSync(OUT, { recursive: true, force: true });
  for (const rel of site) {
    const src = path.join(ROOT, rel);
    const stat = fs.statSync(src);
    if (stat.size > MAX_BYTES) throw new Error(`deploy: ${rel} is over 25 MiB`);
    const dest = path.join(SITE, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (vaulted[rel]) {
      const html = fs.readFileSync(src, 'utf8');
      const v = path.join(VAULT, rel);
      fs.mkdirSync(path.dirname(v), { recursive: true });
      fs.writeFileSync(v, html);
      fs.writeFileSync(dest, stubFor(rel, html, vaulted[rel]));
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  fs.mkdirSync(VAULT, { recursive: true });
  fs.writeFileSync(path.join(VAULT, '_index.json'), JSON.stringify(vaulted));
  fs.writeFileSync(path.join(SITE, '_headers'), HEADERS);
  console.log(`.deploy/site: ${site.length} files; .deploy/vault: ${Object.keys(vaulted).length} Premium lesson pages`, counts);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
