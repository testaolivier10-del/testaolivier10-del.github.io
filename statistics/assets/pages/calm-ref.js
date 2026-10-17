/* Reference pages on the calm layout (docs/tools-calm.md; the score
   calculator and the equations sheet, scripts/lib/apstat-entry.mjs). These
   are long reading pages, not tools: they get the Tool Studio's slim top bar
   (LevlStudio.mount({ slim: true }): back, title, "⋯" with Copy link, Report
   a problem, Ask the tutor and the periodic table) and calm type
   (body.stat-calm-ref, entry.css), and nothing else. The page itself stays in
   normal flow below the bar; the footer stays at its end. */
(function(){
  if(!window.LevlStudio) return;
  var main = document.getElementById('main');
  if(!main) return;
  var B = window.ApStatBase || '';
  var h1 = main.querySelector('.stat-hero h1'), lede = main.querySelector('.stat-hero .lede');
  document.body.classList.add('stat-calm-ref');
  var s = window.LevlStudio.mount({
    title: h1 ? h1.textContent : document.title, course: 'AP® Statistics', back: B + 'index.html', backLabel: 'Back to AP® Statistics', host: main,
    slug: 'apstat-' + (document.body.getAttribute('data-app') || 'page'), slim: true,
    menu: { copyLink: true, report: { course: 'apstat', id: 'page:' + (document.body.getAttribute('data-app') || '') }, allTools: { label: 'Course home' } }
  });
  // The title is in the bar; the one-line lede opens the page.
  if(lede){ lede.classList.add('stat-ref-lede'); main.insertBefore(lede, main.firstChild); }
  if(h1){ h1.classList.add('sr-only'); main.insertBefore(h1, main.firstChild); }
})();
