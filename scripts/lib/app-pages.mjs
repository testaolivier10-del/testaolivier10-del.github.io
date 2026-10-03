/* Pages that show a visitor's own state (progress, account, a review queue,
   search results) rather than content. They have nothing for a search engine
   to index, and an empty dashboard is a poor landing page.

   Site audit 2026-10 (SEO, sitemap row): dashboards, account and search pages
   were listed in sitemap.xml and indexable, and nremt/dashboard.html was
   noindex yet listed. Each of these carries NOINDEX in its <head>, and
   build-sitemap.mjs leaves out every page that is noindex. Site rule
   sitemap-noindex holds both. Paths are repo-relative. */
export const APP_STATE_PAGES = [
  'account.html',
  'search.html',
  'nremt/dashboard.html',
  'nremt/review.html',
  'nremt/search.html',
  'ochem/dashboard.html',
  'ochem/review.html',
  'ochem/search.html',
  'anatomy-physiology/dashboard.html',
  'anatomy-physiology/review.html',
  'anatomy-physiology/search.html',
  'bio/dashboard.html',
  'bio/review.html',
  'bio/search.html',
];

export const NOINDEX = '<meta name="robots" content="noindex, follow">';

export const isNoindex = (html) => /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
