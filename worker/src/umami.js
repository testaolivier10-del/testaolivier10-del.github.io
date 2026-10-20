/* Umami, through this Worker.

   Why a proxy. The site sent its analytics straight to cloud.umami.is, a host
   on the common ad-block lists, so every student with uBlock or Brave's
   shields was invisible: the dashboard undercounted real people while still
   counting every crawler that ran the page. Sending the same events to
   api.levlprep.com/api/send and forwarding them from here fixes the first half
   (this host is not on any list) and lets the Worker fix the second half,
   because it can see what a browser cannot: which network a request came from.

   The forward follows Umami's own guide for Umami Cloud (docs.umami.is,
   "Bypass ad blockers"): POST to gateway.umami.is/api/send with the visitor's
   User-Agent and X-Forwarded-For set to their IP, so country and device stay
   right. Nothing is added to what the browser sent, and nothing is stored here.

   What is dropped, with a 204 so the page never retries:
   - requests from data-center networks (AWS, Google Cloud, Azure, Alibaba,
     Tencent, DigitalOcean, OVH, Hetzner and similar). On 2026-10-19 these were
     about half of all "visitors": one crawler in Singapore alone was 259 of
     647, every one with a 6-second visit. A student on a VPN that exits from
     one of these networks is lost too; that is the honest cost, and it is
     small next to what the bots did to every number.
     Not dropped: Akamai, Cloudflare and Fastly, because iCloud Private Relay
     (Safari on an iPhone with iCloud+) exits through them, and those are real
     students.
   - bodies that are not small JSON events for this site's website id, so the
     route cannot be used to write into somebody else's Umami.

   Server-side events (purchase, refund) go out through umamiServerEvent(),
   from the Polar webhook and the refund route, so the funnel's last step is
   counted even when the buyer's browser blocks everything. */

export const UMAMI_WEBSITE_ID = 'cc421df1-3f32-40f1-bd08-d7f6666de3ac';
export const UMAMI_GATEWAY = 'https://gateway.umami.is/api/send';
const MAX_BODY = 8192;

/* SHA-256 of the owner's addresses (lower case), so his own test purchases and
   refunds are not counted as sales. The same list is in assets/analytics.js. */
export const OWNER_EMAIL_SHA256 = [
  '6ac353e37000f38dc54cdee3ed28f34e498f6978b33ad16409471cd7c2441154',
  '7662e6de54cf228c5781e9b65b74ea942b2fc1156dbc3517fe20a9ca5f3e5d55',
];

export async function isOwnerEmail(email) {
  if (typeof email !== 'string' || !email) return false;
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return OWNER_EMAIL_SHA256.includes(hex);
}

/* The buyer's first-touch channel (assets/analytics.js source()), carried
   through Polar's metadata like the video ref: lower-case words, dots and
   hyphens only, so it can never carry anything but a channel name. */
export function isSource(src) {
  return typeof src === 'string' && /^[a-z0-9][a-z0-9.-]{0,39}$/.test(src);
}

/* Autonomous systems that are hosting providers, not homes, phones or
   schools. Numbers, not names, so a lookalike name cannot slip through and a
   residential ISP that shares a word with a cloud cannot be caught. */
export const DATACENTER_ASNS = new Set([
  16509, 14618, 8987,           // Amazon AWS
  15169, 396982, 19527, 36040,  // Google, Google Cloud
  8075, 8068, 8069,             // Microsoft Azure
  45102, 37963, 24429,          // Alibaba Cloud
  132203, 45090,                // Tencent Cloud
  136907, 55990,                // Huawei Cloud
  14061,                        // DigitalOcean
  16276,                        // OVH
  24940, 213230,                // Hetzner
  63949,                        // Linode / Akamai Connected Cloud
  31898,                        // Oracle Cloud
  20473,                        // Vultr (Choopa)
  51167,                        // Contabo
  60781, 28753, 59253,          // Leaseweb
  9009,                         // M247
  212238,                       // Datacamp (CDN77)
  12876,                        // Scaleway
  47583,                        // Hostinger
  36352,                        // ColoCrossing
  40676,                        // Psychz
  21859,                        // Zenlayer
  62240,                        // Clouvider
  46606,                        // Unified Layer
  398324, 398705,               // Censys
]);

export function fromDatacenter(request) {
  const asn = Number(request?.cf?.asn);
  return Number.isFinite(asn) && DATACENTER_ASNS.has(asn);
}

const AUTOMATED_UA = /HeadlessChrome|PhantomJS|Playwright|Puppeteer|Lighthouse|PageSpeed|GTmetrix|bot\b|crawler|spider|python-requests|curl\/|wget/i;

/* The body the tracker (or the site's own beacon) sends: one pageview or one
   event for this site. Anything else is refused. */
export function acceptableEvent(text) {
  if (typeof text !== 'string' || !text || text.length > MAX_BODY) return null;
  let body;
  try { body = JSON.parse(text); } catch { return null; }
  if (!body || (body.type !== 'event' && body.type !== 'identify')) return null;
  const p = body.payload;
  if (!p || typeof p !== 'object' || p.website !== UMAMI_WEBSITE_ID) return null;
  return body;
}

const quiet = (cors) => new Response(null, { status: 204, headers: cors });

export async function umamiProxy(request, env, cors, fetchImpl = fetch) {
  if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
  const ua = request.headers.get('User-Agent') || '';
  if (!ua || AUTOMATED_UA.test(ua) || fromDatacenter(request)) return quiet(cors);

  const text = await request.text();
  if (!acceptableEvent(text)) return new Response('Bad event', { status: 400, headers: cors });

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const headers = { 'Content-Type': 'application/json', 'User-Agent': ua };
  if (ip) headers['X-Forwarded-For'] = ip;
  const cache = request.headers.get('x-umami-cache');
  if (cache && cache.length < 2000) headers['x-umami-cache'] = cache;
  const lang = request.headers.get('Accept-Language');
  if (lang) headers['Accept-Language'] = lang.slice(0, 200);

  try {
    const res = await fetchImpl(UMAMI_GATEWAY, { method: 'POST', headers, body: text });
    const out = await res.text();
    return new Response(out, { status: res.status, headers: { 'Content-Type': 'text/plain', ...cors } });
  } catch {
    // Umami down: the visitor's page does not care.
    return quiet(cors);
  }
}

/* An event counted by the Worker itself. It arrives in Umami as its own
   one-event visit (country: wherever Cloudflare ran the Worker), so read it
   as a count, not as part of the buyer's visit. Never throws. */
export async function umamiServerEvent(name, data, fetchImpl = fetch) {
  const payload = {
    website: UMAMI_WEBSITE_ID,
    hostname: 'levlprep.com',
    language: 'en-US',
    screen: '0x0',
    url: '/server/' + name,
    title: 'Server event',
    referrer: '',
    name,
    data: data || {},
  };
  try {
    await fetchImpl(UMAMI_GATEWAY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) LevlPrepServer/1.0' },
      body: JSON.stringify({ type: 'event', payload }),
    });
  } catch { /* counting must never fail a payment */ }
}
