/* Tells Bing (and the other IndexNow engines: Yandex, Naver, Seznam, Yep)
   which pages changed, right after a deploy (docs/site-health.md, "Bing and
   IndexNow"). Bing is the site's largest search referrer and the index the
   AI assistants lean on; Google does not take part in IndexNow.

   The key is public by design: it is the file /<key>.txt at the site root,
   and a submission is only accepted for the host that serves it.

     node scripts/indexnow.mjs            pages whose text changed in the last 2 days
     node scripts/indexnow.mjs --all      every page in sitemap.xml (first run)
     node scripts/indexnow.mjs --dry      print what would be sent, send nothing

   Pages come from sitemap.xml; "changed" is its <lastmod>, which
   build-sitemap.mjs takes from each page's own text. */
import { readFileSync, existsSync } from 'node:fs';

export const HOST = 'levlprep.com';
export const KEY = 'f6b7887cac9b6d911ce0f33352ad1e26';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX = 10000; // per request, by the protocol

export function changedUrls(xml, { all = false, days = 2, now = new Date() } = {}) {
  const since = new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  const out = [];
  for (const m of xml.matchAll(/<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)) {
    if (all || m[2] >= since) out.push(m[1]);
  }
  return out;
}

async function main() {
  const dry = process.argv.includes('--dry');
  if (!existsSync(`${KEY}.txt`) || readFileSync(`${KEY}.txt`, 'utf8').trim() !== KEY) throw new Error('indexnow: the key file is missing or does not hold the key');
  const urls = changedUrls(readFileSync('sitemap.xml', 'utf8'), { all: process.argv.includes('--all') });
  if (!urls.length) { console.log('indexnow: nothing changed'); return; }
  for (let i = 0; i < urls.length; i += MAX) {
    const urlList = urls.slice(i, i + MAX);
    if (dry) { console.log(`indexnow (dry): ${urlList.length} URLs, first ${urlList[0]}`); continue; }
    const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }) });
    // 200 received, 202 received and the key is still being checked.
    console.log(`indexnow: ${urlList.length} URLs sent, HTTP ${res.status}`);
    if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith('indexnow.mjs')) main().catch((e) => { console.error(String(e)); process.exitCode = 1; });
