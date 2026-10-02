/* The addresses the Worker hands to people, in one place.

   API_URL is where this Worker answers: the unsubscribe link and the
   List-Unsubscribe header in every reminder email point here. They used to
   point at the site (levlprep.com/api/unsubscribe), which is GitHub Pages and
   answered 404, so nobody could leave the list (site audit, Fix-first 8).

   The value below is the one source for the Worker host across the repo:
   scripts/lib/site-config.mjs reads it, and scripts/build-site-config.mjs
   writes it into the four site files and the CSP of every page. To move to
   api.levlprep.com (owner step in docs/site-audit-notes/w3.md), change it
   here, run `node scripts/build-site-config.mjs`, rebuild the Worker and
   deploy. An API_URL variable on the Worker overrides it without a rebuild,
   for the Worker only. */
export const API_URL_DEFAULT = 'https://levlprep-ask.testaolivier10.workers.dev'; // site-config:API_URL
export const SITE_URL_DEFAULT = 'https://levlprep.com';

export function apiUrl(env) {
  return String((env && env.API_URL) || API_URL_DEFAULT).replace(/\/+$/, '');
}

export function siteUrl(env) {
  return String((env && env.SITE_URL) || SITE_URL_DEFAULT).replace(/\/+$/, '');
}

/* A path on this site, or '/'. Reminder links come from the browser that
   wrote the row; an absolute URL, a protocol-relative `//host` or a
   backslash trick would turn a study reminder into a link to anywhere. */
export function sitePath(raw) {
  const s = String(raw == null ? '' : raw);
  return s.length <= 200 && /^\/(?![/\\])[^\s\\]*$/.test(s) ? s : '/';
}
