/* The A&P tools hub: one card per tool in window.AnpTools (generated from
   data/pages.json), with its blurb, the learner's own numbers for it where
   the tool records any (AnpCore.toolStats), and a link to tools/<slug>.html. */
(function(){
  var app = document.getElementById('app');
  var tools = window.AnpTools || [];
  var A = window.AnpCore;
  if(!app) return;
  var BASE = window.ANP_BASE || '';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  // What each tool trains, in the spec's terms (docs/anp-spec.md section 8).
  var SKILL = {
    'lab-practical': 'Anatomy: identify', 'predict': 'Physiology: predict', 'feedback-loops': 'Physiology: homeostasis',
    'pathways': 'Sequences', 'graphs': 'Physiology: graphs', 'calculators': 'Quantitative', 'word-roots': 'Terminology'
  };
  var ICON = {
    'lab-practical': '<circle cx="12" cy="10" r="3.2"/><path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/>',
    'predict': '<path d="M7 17V7M7 7l-3 3M7 7l3 3M17 7v10M17 17l-3-3M17 17l3-3"/>',
    'feedback-loops': '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
    'pathways': '<circle cx="5" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="18" r="2"/><path d="M6.5 7.5l4 3M13.5 13.5l4 3"/>',
    'graphs': '<path d="M4 4v16h16"/><path d="M6.5 15c3-7 6-9 12-9"/>',
    'calculators': '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 12h2M13.5 12h2M8.5 16h2M13.5 16h2"/>',
    'word-roots': '<path d="M4 7h9M4 12h6M4 17h9"/><path d="M15 10l5 2-5 2"/>'
  };
  function statLine(slug){
    if(!A) return '';
    var s = A.toolStats(slug);
    if(!s || !s.n) return '<span class="anp-hub-stat is-new">Not tried yet</span>';
    var p = Math.round(s.c / s.n * 100);
    return '<span class="anp-hub-stat"><b>' + p + '%</b> right &middot; ' + s.c + ' of ' + s.n + ' items</span>' +
      '<span class="track thin anp-hub-track" aria-hidden="true"><i style="width:' + p + '%"></i></span>';
  }
  function render(){
    var any = A && tools.some(function(t){ return A.toolStats(t.slug).n; });
    app.innerHTML =
      '<ul class="anp-hub" aria-label="Tools">' + tools.map(function(t){
        return '<li><a class="anp-hub-card" href="' + esc(BASE + 'tools/' + t.slug + '.html') + '">' +
          '<span class="anp-hub-top"><span class="anp-hub-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' + (ICON[t.slug] || '<circle cx="12" cy="12" r="7"/>') + '</svg></span>' +
            (SKILL[t.slug] ? '<span class="anp-hub-skill">' + esc(SKILL[t.slug]) + '</span>' : '') + '</span>' +
          '<span class="anp-hub-name">' + esc(t.name) + '</span>' +
          '<span class="anp-hub-blurb">' + esc(t.blurb) + '</span>' +
          '<span class="anp-hub-foot">' + statLine(t.slug) + '</span>' +
        '</a></li>';
      }).join('') + '</ul>' +
      '<p class="anp-hub-note">' + (any ? 'Your numbers come from every item you have answered in each tool; missed items also go into your <a href="' + esc(BASE + 'review.html') + '">review queue</a>. The <a href="' + esc(BASE + 'mastery.html') + '">dashboard</a> breaks them down by system and level.'
        : 'Every tool records what you answer: missed items go into your <a href="' + esc(BASE + 'review.html') + '">review queue</a>, and your accuracy shows here and on the <a href="' + esc(BASE + 'mastery.html') + '">dashboard</a>.') +
      ' Want cards instead? Try the <a href="' + esc(BASE + 'flashcards.html') + '">flashcards</a>.</p>';
  }
  render();
  document.addEventListener('anp:progress', render);
  window.addEventListener('storage', function(e){ if(!e.key || e.key === 'anp_progress_v1') render(); });
})();
