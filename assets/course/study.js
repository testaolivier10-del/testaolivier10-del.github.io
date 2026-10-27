/* Shared markup for the study pages (docs/course-shell.md, W-C).

   Each course's engine works out its own numbers; these helpers turn them
   into the same HTML in every course, so the study rail, an empty review
   queue or a free-tier line cannot drift apart again. Styles are in
   assets/course/study.css and base.css. No storage, no course names.

     LevlStudy.rail({ links })              the right-hand rail (other ways to study)
     LevlStudy.stat(label, num, sub, cls)    one .cx-stat tile
     LevlStudy.empty({ num, unit, h, p, actions })   a .cx-empty card body
     LevlStudy.actions([{ href|act, label, primary }])
     LevlStudy.free(html)                    the .cx-free line under Start
     LevlStudy.streak()                      the shared day streak (HubProgress) */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function stat(label, num, sub, cls){
    return '<div class="cx-stat' + (cls ? ' ' + cls : '') + '"><div class="cx-stat-label">' + label + '</div>' +
      '<div class="cx-stat-num">' + num + '</div>' + (sub ? '<div class="cx-stat-sub">' + sub + '</div>' : '') + '</div>';
  }
  function actions(list){
    return '<div class="cx-actions">' + (list || []).map(function(a){
      var cls = a.primary ? 'btn-press sm' : 'btn-outline';
      return a.href ? '<a class="' + cls + '" href="' + esc(a.href) + '">' + a.label + '</a>'
        : '<button type="button" class="' + cls + '" data-act="' + esc(a.act) + '"' + (a.attrs || '') + '>' + a.label + '</button>';
    }).join('') + '</div>';
  }
  /* The rail beside Practice, Review and Exams: only the other ways to study.
     The "Your numbers" card and the review queue card used to sit here on all
     three pages, repeating what Progress and Review show; Olivier (2026-10-26)
     wants each page to do one job, so o.stats and o.due are accepted and
     ignored, and the numbers stay on Progress. o.links: [{ href, title, sub }]. */
  function rail(o){
    o = o || {};
    if (!o.links || !o.links.length) return '';
    return '<aside class="cx-rail" aria-label="Other ways to study">' +
      '<nav class="cx-links" aria-label="More ways to study">' + o.links.map(function(l){
        return '<a class="cx-link" href="' + esc(l.href) + '"><b>' + l.title + (l.sub ? '<small>' + l.sub + '</small>' : '') + '</b><span aria-hidden="true">&rarr;</span></a>';
      }).join('') + '</nav>' +
    '</aside>';
  }
  /* The review empty state: the due-count tile, a heading, a sentence and
     the actions (Practice / Next lesson / Flashcards). */
  function empty(o){
    return '<div class="cx-empty"><div class="cx-empty-num">' + (o.num || 0) + '<small>' + (o.unit || 'due now') + '</small></div>' +
      '<div><h2>' + o.h + '</h2>' + (o.p ? '<p>' + o.p + '</p>' : '') + (o.extra || '') + actions(o.actions) + '</div></div>';
  }
  function free(html){ return html ? '<p class="cx-free">' + html + '</p>' : ''; }
  function streak(){
    try{ var s = window.HubProgress && window.HubProgress.streak(); return s ? s.current : 0; }catch(e){ return 0; }
  }
  window.LevlStudy = { rail: rail, stat: stat, empty: empty, actions: actions, free: free, streak: streak, esc: esc, plural: plural };

  /* Site redesign round 3 (docs/site-redesign.md, boards R10-Practice-*,
     R10-Review, R10-Flashcards*): every study page opens with the short cover
     band of the course home (assets/course/r3.css .band.short): the breadcrumb,
     a kicker, a two-tone headline, one handwritten line, one main action and
     the course drawing. The band is its own element, so the engines can keep
     hiding their .page-head during a session (they all do: hero.hidden); the
     band stays and says where you are instead:
       setup    "Practice, one at a time."      action: the page's own Start
       session  "Question 3, with the why."     action: the engine's Save and exit
       results  "11 right. 4 to fix."           actions: review the misses, Back to Start
     Engines can also set it directly: LevlStudy.band({ h1a, h1b, hand, kicker,
     cta: [{ label, el|href, ghost }] }), and LevlStudy.band(null) to go back
     to watching the page. The lede moves to the top of the first panel, where
     the board puts it. */
  var COVER = { nremt: 'nremt', ochem: 'ochem', 'anatomy-physiology': 'anp', bio: 'apbio', chem: 'apchem',
    physics: 'apphys', calculus: 'apcalc', statistics: 'apstat', 'environmental-science': 'apenv' };
  var PAGE = { practice: 'Practice', review: 'Review', exams: 'Exams', flashcards: 'Flashcards' };
  var HAND = { practice: 'every answer comes with the why', review: 'a miss today, a solid answer days later',
    exams: 'on the clock, like test day', flashcards: 'grade yourself honestly' };
  var TONE = { practice: 'one at a time.', review: 'before you forget.',
    exams: 'the full run.', flashcards: 'quick recall.' };
  var me = document.currentScript && document.currentScript.src;
  var B = null, forced = null;
  function vis(el){ return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  function txt(el){ return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
  function findAction(re, scope){
    var list = (scope || document.getElementById('main') || document).querySelectorAll('button, a.btn-press, a.btn-outline');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (B && B.band.contains(el)) continue;
      if (!el.disabled && !el.hidden && vis(el) && re.test(txt(el))) return el;
    }
    return null;
  }
  function paint(s){
    if (!B) return;
    var key = [s.kicker, s.h1a, s.h1b, s.hand, (s.cta || []).map(function(c){ return c.label + (c.href || ''); }).join('|')].join('~');
    if (key === B.last) { B.ctaEls = (s.cta || []).map(function(c){ return c.el || null; }); return; }
    B.last = key;
    B.kicker.textContent = s.kicker || B.base.kicker;
    B.h1.innerHTML = esc(s.h1a) + (s.h1b ? ' <span>' + esc(s.h1b) + '</span>' : '');
    B.hand.textContent = s.hand || '';
    B.hand.hidden = !s.hand;
    B.ctaEls = [];
    B.ctas.innerHTML = (s.cta || []).map(function(c, i){
      B.ctaEls[i] = c.el || null;
      var cls = c.ghost ? 'btn-ghost' : 'btn-chan';
      return c.href ? '<a class="' + cls + '" href="' + esc(c.href) + '">' + esc(c.label) + '</a>'
        : '<button type="button" class="' + cls + '" data-band-cta="' + i + '">' + esc(c.label) + '</button>';
    }).join('');
    B.ctas.hidden = !(s.cta && s.cta.length);
  }
  function plain(n){ return ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || String(n); }
  function state(){
    if (forced) return forced;
    var main = document.getElementById('main');
    var head = B.head;
    /* The engines hide their .page-head (hidden) or, on NREMT, the whole
       #introScreen once a session starts. */
    var intro = document.getElementById('introScreen');
    var setup = intro ? vis(intro) : !(head && (head.hidden || head.closest('[hidden]')));
    var resEl = document.getElementById('resultsScreen');
    var results = (resEl && vis(resEl)) || !!(main && main.querySelector('[data-view="results"]'));
    if (results) {
      var sc = main.querySelector('#scoreBig, .bio-pr-score-big, [class*="score-big"], [class*="score"] .big');
      var m = txt(sc).match(/(\d+)\s*\/\s*(\d+)/);
      var back = findAction(/back to start|practice again|new set|start over/i);
      var cta = [];
      if (m) {
        var right = +m[1], wrong = +m[2] - right;
        if (wrong > 0 && B.page !== 'exams') cta.push({ label: 'Review your misses', href: 'review.html' });
        if (back) cta.push({ label: txt(back).replace(/^[←\s]+/, ''), el: back, ghost: cta.length > 0 });
        return { kicker: B.base.kicker, h1a: right + ' right.', h1b: wrong > 0 ? wrong + ' to fix.' : 'Nothing to fix.',
          hand: wrong > 0 && B.page !== 'exams' ? 'the ' + (wrong === 1 ? 'one miss is' : plain(wrong) + ' are') + ' in your review queue already' : 'every answer is explained below', cta: cta };
      }
      if (back) cta.push({ label: txt(back).replace(/^[←\s]+/, ''), el: back });
      return { kicker: B.base.kicker, h1a: 'Your results,', h1b: 'with the why.', hand: B.base.hand, cta: cta };
    }
    if (!setup) {
      var fc = document.getElementById('flashcardScreen');
      var counter = txt(main && main.querySelector('#progressText, #fcProgressText, .cx-progress-text, [class*="progress-text"]'));
      var mm = counter.match(/(?:Question|Card)\s+(\d+)\s+of\s+(\d+)/i) || txt(main).match(/(?:Question|Card)\s+(\d+)\s+of\s+(\d+)/i);
      var card = (fc && vis(fc)) || B.page === 'flashcards';
      var timed = vis(document.getElementById('timerBar'));
      var exit = findAction(/save and exit|exit exam|exit flashcards|end session|exit/i);
      var banner = txt(document.getElementById('practiceBanner'));
      return {
        kicker: banner ? banner.replace(/\.$/, '').replace(/,\s*/g, ' · ') : B.base.kicker,
        h1a: mm ? (card ? 'Card ' : 'Question ') + mm[1] + ',' : (card ? 'Studying,' : 'In session,'),
        h1b: card ? 'grade it honestly.' : timed ? 'on the clock.' : 'with the why.',
        hand: card ? 'it comes back just before you forget' : timed ? 'the score and every answer come at the end' : 'misses go to your review queue',
        cta: exit ? [{ label: txt(exit).replace(/^[←\s]+/, ''), el: exit, ghost: true }] : []
      };
    }
    var start = findAction(/^(start|study|begin|resume)/i, document.querySelector('.cx-start') || undefined) || findAction(/^(start|study|begin)/i);
    return { kicker: B.base.kicker, h1a: B.base.h1a, h1b: B.base.h1b, hand: B.base.hand,
      cta: start ? [{ label: txt(start), el: start }] : [] };
  }
  var pending = 0, placeLede = function(){};
  function refresh(){ if (pending) return; pending = requestAnimationFrame(function(){ pending = 0; placeLede(); paint(state()); }); }
  function band(){
    var head = document.querySelector('.page-head');
    var main = document.getElementById('main');
    if (!head || !main || B || !document.querySelector('.cx-study')) return;
    var m = location.pathname.match(/\/([a-z-]+)\/(practice|review|exams|flashcards)(?:\.html)?$/);
    var key = m && COVER[m[1]];
    if (!key || !me) return;
    var root = me.replace(/assets\/course\/study\.js(?:[?#].*)?$/, '');
    var eyebrow = head.querySelector('.eyebrow');
    var course = eyebrow ? txt(eyebrow.cloneNode(true)).replace(/\bBeta\b/i, '').trim() : '';
    var h1 = head.querySelector('h1');
    var name = h1 ? txt(h1).replace(/\s+(one at a time|before you forget|the full run|quick recall)\.?$/i, '') : PAGE[m[2]];
    var wrap = document.createElement('div');
    wrap.className = 'r3 r3-sband';
    wrap.setAttribute('data-cover', key);
    var crumb = document.querySelector('[data-crumb]') || main.querySelector('nav.cx-crumb');
    wrap.innerHTML = '<section class="band short" aria-labelledby="r3-band-h"><div class="hwrap"><div>' +
      '<div class="r3-crumb"></div>' +
      '<p class="issue"><span class="r3-kick"></span> <i></i></p>' +
      '<h1 class="deck" id="r3-band-h"></h1><p class="hand"></p>' +
      '<div class="hero-ctas"></div></div>' +
      '<div class="art" aria-hidden="true"><img src="' + esc(root + 'assets/covers/art/' + key + '.svg') + '" alt="" width="520" height="300" decoding="async"></div>' +
      '</div></section>';
    main.parentNode.insertBefore(wrap, main);
    if (crumb) wrap.querySelector('.r3-crumb').appendChild(crumb);
    /* The page's own h1 stays in the DOM for the engines but is no longer
       the page's heading: the band's is. */
    if (h1) { h1.setAttribute('aria-hidden', 'true'); h1.removeAttribute('id'); }
    head.classList.add('r3-moved');
    var lede = head.querySelector('.lede');
    /* Some engines draw their first panel after this runs; the lede follows
       it there as soon as it appears (placeLede, on every refresh). */
    placeLede = function(){
      if (!lede || main.querySelector('.cx-lede')) return;
      var panel = main.querySelector('.cx-main > .cx-builder, .cx-main > .cx-card:not(.cx-deckcard), .cx-main > .cx-deck');
      if (!panel) return;
      /* A copy, so an engine that redraws the panel gets it back next time. */
      var c = lede.cloneNode(true);
      c.className = 'cx-lede';
      c.removeAttribute('id');
      panel.insertBefore(c, panel.firstChild);
    };
    placeLede();
    main.classList.add('r3-under', 'cx-study');
    /* NREMT's readiness card sits at the top of the rail (board R10-Practice-Setup);
       while it is locked it is the Premium card instead, which the board puts
       under the builder, so it moves there. */
    var ready = main.querySelector('.r3-readiness');
    if (ready) {
      var rail = ready.parentNode, builder = main.querySelector('.cx-main > .cx-builder');
      var place = function(){
        var gate = !!ready.querySelector('.premium-card');
        if (gate && builder && ready.previousElementSibling !== builder) builder.insertAdjacentElement('afterend', ready);
        else if (!gate && ready.parentNode !== rail) rail.insertBefore(ready, rail.firstChild);
        ready.classList.toggle('is-gate', gate);
      };
      place();
      new MutationObserver(place).observe(ready, { childList: true, subtree: true });
    }
    B = { band: wrap, head: head, page: m[2], kicker: wrap.querySelector('.r3-kick'), h1: wrap.querySelector('#r3-band-h'),
      hand: wrap.querySelector('.hand'), ctas: wrap.querySelector('.hero-ctas'), ctaEls: [], last: '',
      base: { kicker: (course ? course + ' · ' : '') + PAGE[m[2]], h1a: name + ',', h1b: TONE[m[2]], hand: HAND[m[2]] } };
    B.ctas.addEventListener('click', function(e){
      var b = e.target.closest('[data-band-cta]');
      if (!b) return;
      var el = B.ctaEls[+b.getAttribute('data-band-cta')];
      if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.click(); }
    });
    paint(state());
    new MutationObserver(refresh).observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'style', 'data-view', 'disabled'], characterData: true });
  }
  window.LevlStudy.band = function(s){ forced = s || null; if (B) paint(state()); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', band); else band();
})();
