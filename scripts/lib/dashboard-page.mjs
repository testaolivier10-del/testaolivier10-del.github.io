/* The progress page's opener and stylesheet (site redesign round 2, step 4;
   docs/site-redesign.md, mockup S10-Dashboard). Every course builder runs its
   built dashboard.html through dashboardPage(); nremt/dashboard.html and
   ochem/dashboard.html carry the same markup by hand.

   It turns the shared .page-head into the two-tone headline with one
   handwritten line, keeps the course's own lede, and loads
   assets/course/dashboard.css last so it wins over the course sheets.
   Throws when the page head is not where it expects, so a builder change
   cannot drop the redesign silently. */
export const DASH_H1 = 'Where you <span>stand today.</span>';
export const DASH_HAND = 'worked out in your browser from every answer you give';

export function dashboardPage(html, up = '../') {
  const re = /<header class="page-head">(<div class="eyebrow">[\s\S]*?)<\/div><h1>Dashboard<\/h1>/;
  if (!re.test(html)) throw new Error('dashboard-page: no "<header class=\\"page-head\\">...<h1>Dashboard</h1>" to restyle');
  const link = `<link rel="stylesheet" href="${up}assets/course/dashboard.css">`;
  if (!html.includes('</body>')) throw new Error('dashboard-page: no </body>');
  return html
    .replace(re, (m, eyebrow) => `<header class="page-head db-head">${eyebrow} <span>&middot; Dashboard</span></div><h1>${DASH_H1}</h1><p class="db-hand">${DASH_HAND}</p>`)
    .replace('</body>', `${link}\n</body>`);
}
