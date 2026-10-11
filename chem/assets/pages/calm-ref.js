/* Reference pages on the calm layout (docs/tools-calm.md; the score
   calculator and the equations sheet, scripts/lib/apchem-entry.mjs). These
   are long reading pages, not tools: they get the Tool Studio's slim top bar
   (LevlStudio.mount({ slim: true }): back, title, "⋯" with Copy link, Report
   a problem, Ask the tutor and the periodic table) and calm type
   (body.chem-calm-ref, entry.css), and nothing else. The page itself stays in
   normal flow below the bar; the footer stays at its end. */
(function(){
  if(!window.LevlStudio) return;
  var main = document.getElementById('main');
  if(!main) return;
  var B = window.ApChemBase || '';
  var h1 = main.querySelector('.chem-hero h1'), lede = main.querySelector('.chem-hero .lede');
  document.body.classList.add('chem-calm-ref');
  var s = window.LevlStudio.mount({
    title: h1 ? h1.textContent : document.title, course: 'AP® Chemistry', back: B + 'index.html', backLabel: 'Back to AP® Chemistry', host: main,
    slug: 'apchem-' + (document.body.getAttribute('data-app') || 'page'), slim: true,
    menu: { copyLink: true, report: { course: 'apchem', id: 'page:' + (document.body.getAttribute('data-app') || '') }, allTools: { label: 'Course home' } }
  });
  // The title is in the bar; the one-line lede opens the page.
  if(lede){ lede.classList.add('chem-ref-lede'); main.insertBefore(lede, main.firstChild); }
  if(h1){ h1.classList.add('sr-only'); main.insertBefore(h1, main.firstChild); }
})();
