/* The one footer link row every page carries (consistency audit 2026-11, D3): the same links, in the same order,
   on the homepage, the site pages, every course page, the teacher pages and the certificate. Builders call
   footerLinks(up) with the path back to the site root ('', '../', '../../' or '/'); hand-written pages carry the
   same row, and site rule footer-links fails any row that differs. Anything course-specific (A&P figure credits,
   a course's disclaimer) goes in the footer's own line above the row, never in it. */
export const FOOTER_LINKS = [
  ['privacy.html', 'Privacy'],
  ['terms.html', 'Terms'],
  ['about.html', 'About'],
  ['sources.html', 'Sources'],
  ['changelog.html', 'What&rsquo;s new'],
  ['premium.html', 'Premium'],
  ['teach/', 'Teachers'],
  ['account.html', 'Account'],
  ['mailto:hello@levlprep.com', 'Contact'],
];

export function footerLinks(up = '') {
  return `<p class="privacy-link">${FOOTER_LINKS.map(([href, label]) => `<a href="${href.startsWith('mailto:') ? href : up + href}">${label}</a>`).join(' &middot; ')}</p>`;
}
