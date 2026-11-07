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
  /* The free allowance line, the same words in every course, on Practice and
     Review (consistency audit 2026-11, B11). The words live in
     LevlPremium.allowanceLine (assets/premium.js); note is the course's own
     always-free part ("Units 1 and 2 are unlimited."). '' for members. */
  function allowance(course, note){
    var P = window.LevlPremium;
    return P && P.allowanceLine ? P.allowanceLine(course, note) : '';
  }
  function streak(){
    try{ var s = window.HubProgress && window.HubProgress.streak(); return s ? s.current : 0; }catch(e){ return 0; }
  }

  /* The end of a session, one layout in every course (consistency audit
     2026-11, B7): the score, the course's extras (XP, a domain list), what to
     study next, Retry misses, one next step, then the details and, only once
     today's free questions are used, the Premium card.
       o.right, o.total     the score ("11/15")
       o.line, o.sub        the bold line beside it and the small one under it (HTML)
       o.extras             HTML under the score (XP, a breakdown)
       o.next               HTML under "What to study next" ('' leaves the heading out)
       o.retry              { label, act } for Retry misses, or null
       o.step               { label, act|href, why } the one next step, or
       o.stepHtml           a ready next step (LevlNextStep's placeholder)
       o.also               up to two quiet { label, act|href }
       o.more               HTML after the actions (tables, notes)
       o.course             the LevlPremium course key, for the Premium card at the limit
     Buttons carry data-act; the page wires them (LevlStudy.wire). */
  function ctl(cls, a){
    return a.href ? '<a class="' + cls + '" href="' + esc(a.href) + '">' + a.label + '</a>'
      : '<button type="button" class="' + cls + '" data-act="' + esc(a.act) + '">' + a.label + '</button>';
  }
  function atLimit(course){
    var P = window.LevlPremium;
    if(!course || !P || !P.quota) return false;
    try{ var q = P.quota(course); return isFinite(q.limit) && q.left <= 0; }catch(e){ return false; }
  }
  function premiumAtLimit(course, source){
    var P = window.LevlPremium;
    return atLimit(course) && P && P.card ? P.card(course, source || 'summary') : '';
  }
  function end(o){
    var also = (o.also || []).filter(Boolean).slice(0, 2);
    var right = o.right || 0, total = o.total || 0, miss = total - right;
    /* End screen v2 (owner 2026-11-07, mockup): one card for the score with a right/missed bar and the actions
       beside it, then the topics in one list (the old "What to study next" cards and "By topic" table merged),
       then the course's breakdowns. Nothing removed; the score card is neutral, the bar carries right and missed. */
    var bar = total ? '<span class="cx-endp-bar" role="img" aria-label="' + right + ' right, ' + miss + ' missed"><i class="ok" style="width:' + (right / total * 100) + '%"></i><i class="no" style="width:' + (miss / total * 100) + '%"></i></span>' : '';
    // v2b (owner 2026-11-07): no explainer lines; the buttons say what they do.
    var acts = (o.step ? ctl('btn-press', o.step) : '') + (o.retry ? ctl('btn-outline', o.retry) : '') +
      also.map(function(a){ return ctl('link-quiet', a); }).join('');
    // A ready next step (LevlNextStep) keeps its own buttons; Retry sits under it.
    var rt = o.retry ? ctl('btn-outline cx-endp-retry2', o.retry) : '';
    var step = o.stepHtml ? (rt && o.stepHtml.indexOf('<p class="levl-next__why">') > -1 ? o.stepHtml.replace('<p class="levl-next__why">', rt + '<p class="levl-next__why">') : o.stepHtml + (rt ? '<div class="cx-endp-acts">' + rt + '</div>' : ''))
      : (acts ? '<div class="cx-endp-acts">' + acts + '</div>' : '');
    return '<section class="cx-endp cx-endp2" aria-label="Session results">' +
      '<div class="cx-endp-card">' +
        '<div class="cx-endp-score" tabindex="-1"><span class="cx-score-big">' + right + '<small>/' + total + '</small></span>' +
          '<span><b>' + (o.line || '') + '</b>' + (o.sub ? '<span class="cx-small">' + o.sub + '</span>' : '') + bar + '</span></div>' +
        step + (o.stepHtml && also.length ? '<p class="cx-endp-also">' + also.map(function(a){ return ctl('link-quiet', a); }).join('') + '</p>' : '') +
      '</div>' +
      (o.extras || '') +
      (o.next ? '<h2 class="cx-endp-h">' + (o.nextTitle || 'What to study next') + '</h2>' + o.next : '') +
      (o.more || '') + premiumAtLimit(o.course) +
    '</section>';
  }
  /* End screen v2b helpers (owner 2026-11-07), one look in every course.
     topics(rows): one table, misses first. Row: { name, href, c, n, mastery (0..1 or null), links: [{ label, href }] }.
     bars(title, rows): a compact breakdown. Row: { label, c, n }. */
  function topics(rows){
    rows = rows.slice().sort(function(a, b){ return (b.n - b.c) - (a.n - a.c) || a.c / a.n - b.c / b.n; });
    var hasM = rows.some(function(r){ return r.mastery != null; });
    return '<div class="cx-topics' + (hasM ? '' : ' no-m') + '" role="table" aria-label="Results by topic"><div class="cx-topics-h" role="row"><span role="columnheader">Topic</span><span role="columnheader">Right</span>' +
      (hasM ? '<span role="columnheader">Mastery</span>' : '') + '<span></span></div>' + rows.map(function(r){
        var mp = r.mastery == null ? null : Math.round(r.mastery * 100);
        return '<div class="cx-topic' + (r.c < r.n ? ' is-miss' : '') + '" role="row">' +
          (r.href ? '<a class="cx-topic-name" role="cell" href="' + esc(r.href) + '">' + esc(r.name) + '</a>' : '<span class="cx-topic-name" role="cell">' + esc(r.name) + '</span>') +
          '<span class="cx-topic-r" role="cell">' + r.c + '/' + r.n + '</span>' +
          (hasM ? '<span class="cx-topic-m" role="cell">' + (mp == null ? '' : '<span class="cx-mbar" aria-hidden="true"><i style="width:' + mp + '%"></i></span>' + mp + '%') + '</span>' : '') +
          '<span class="cx-topic-go" role="cell">' + (r.links || []).map(function(l){ return '<a class="btn-outline sm" href="' + esc(l.href) + '">' + esc(l.label) + '</a>'; }).join('') + '</span></div>';
      }).join('') + '</div>';
  }
  function bars(title, rows){
    if(!rows || !rows.length) return '';
    return '<h2 class="cx-endp-h">' + esc(title) + '</h2><ul class="cx-prac">' + rows.map(function(r){
      return '<li><span>' + esc(r.label) + '</span><span class="cx-mbar" aria-hidden="true"><i style="width:' + Math.round(r.n ? r.c / r.n * 100 : 0) + '%"></i></span><b>' + r.c + '/' + r.n + '</b></li>';
    }).join('') + '</ul>';
  }
  /* Wires an end panel's data-act buttons to handlers, then puts the focus on the score. */
  function wire(root, handlers){
    if(!root) return;
    [].forEach.call(root.querySelectorAll('.cx-endp [data-act]'), function(b){
      var fn = handlers[b.getAttribute('data-act')];
      if(fn) b.addEventListener('click', fn);
    });
    var h = root.querySelector('.cx-endp-score');
    if(h){ try{ h.focus({ preventScroll: true }); }catch(e){ h.focus(); } }
  }

  /* One keyboard set on every question card (consistency audit 2026-11, B8).
     Arrow keys, Home and End move between the answers of a .cx-opts group
     wherever the engine does not already do it; Space and Enter choose (the
     answers are buttons). keys() is the legend; study pages get it, folded,
     under a session (mountKeys below). NREMT adds its sorting keys. */
  var KEYS = [
    ['<kbd aria-label="Up arrow">&uarr;</kbd><kbd aria-label="Down arrow">&darr;</kbd>', 'move between answers'],
    ['<kbd>Home</kbd><kbd>End</kbd>', 'first or last answer'],
    ['<kbd>Space</kbd><kbd>Enter</kbd>', 'choose, or press the button in focus']
  ];
  function keys(extra){
    return '<dl class="cx-keys-list">' + KEYS.concat(extra || []).map(function(k){ return '<dt>' + k[0] + '</dt><dd>' + k[1] + '</dd>'; }).join('') + '</dl>';
  }
  document.addEventListener('keydown', function(e){
    if(e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key;
    if(!/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End)$/.test(k)) return;
    var t = e.target, g = t && t.closest ? t.closest('.cx-opts') : null;
    if(!g || !t.matches('.cx-opt, .cx-opt *')) return;
    var cur = t.closest('.cx-opt');
    var L = [].filter.call(g.querySelectorAll('.cx-opt'), function(b){ return !b.disabled && b.getClientRects().length; });
    var i = L.indexOf(cur), n = L.length;
    if(i < 0 || !n) return;
    var j = /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : n - 1;
    e.preventDefault();
    if(!L[j].hasAttribute('tabindex') && !/^(BUTTON|A|INPUT)$/.test(L[j].tagName)) L[j].tabIndex = -1;
    L[j].focus();
  });

  window.LevlStudy = { rail: rail, stat: stat, empty: empty, actions: actions, free: free, allowance: allowance, streak: streak, esc: esc, plural: plural,
    end: end, wire: wire, topics: topics, bars: bars, keys: keys, atLimit: atLimit, premiumAtLimit: premiumAtLimit };

  /* Site redesign round 3 (docs/site-redesign.md, boards R10-Practice-*,
     R10-Review, R10-Flashcards*): every study page opens with the short cover
     band of the course home (assets/course/r3.css .band.short): the breadcrumb,
     a kicker, a two-tone headline, one handwritten line, one main action and
     the course drawing. The band is its own element, so the engines can keep
     hiding their .page-head during a session (they all do: hero.hidden); the
     band stays and says where you are instead:
       setup    "Practice, one at a time."
       session  "Question 3, with the why."
       results  "11 right. 4 to fix."
     It used to repeat the page's Start, its exit and its results buttons, so each showed twice (consistency
     audit 2026-11, B13); now it only says where you are, and LevlStudy.band() can still give it a cta.
     Engines can also set it directly: LevlStudy.band({ h1a, h1b, hand, kicker,
     cta: [{ label, el|href, ghost }] }), and LevlStudy.band(null) to go back
     to watching the page. The lede moves to the top of the first panel, where
     the board puts it. */
  var COVER = { nremt: 'nremt', ochem: 'ochem', 'anatomy-physiology': 'anp', bio: 'apbio', chem: 'apchem',
    physics: 'apphys', calculus: 'apcalc', 'calculus-bc': 'apcalcbc', statistics: 'apstat', 'environmental-science': 'apenv', psychology: 'appsych', precalculus: 'apprecalc', macroeconomics: 'apmacro' };
  var PAGE = { practice: 'Practice', review: 'Review', exams: 'Exams', flashcards: 'Flashcards' };
  var HAND = { practice: 'every answer comes with the why', review: 'a miss today, a solid answer days later',
    exams: 'on the clock, like test day', flashcards: 'grade yourself honestly' };
  var TONE = { practice: 'one at a time.', review: 'before you forget.',
    exams: 'the full run.', flashcards: 'quick recall.' };
  var me = document.currentScript && document.currentScript.src;
  var B = null, forced = null;
  function vis(el){ return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  function txt(el){ return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }
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
    var endp = main && main.querySelector('.cx-endp');
    var results = (resEl && vis(resEl)) || !!(main && main.querySelector('[data-view="results"]')) || vis(endp);
    /* The band never copies a control from the page (consistency audit 2026-11, B9, B13): the page's own Start,
       exit and end-panel buttons are the only ones, so none shows twice. The band says where you are. */
    if (results) {
      var sc = main.querySelector('#scoreBig, .cx-score-big, .bio-pr-score-big, [class*="score-big"], [class*="score"] .big');
      var m = txt(sc).match(/(\d+)\s*\/\s*(\d+)/);
      if (m) {
        var right = +m[1], wrong = +m[2] - right;
        return { kicker: B.base.kicker, h1a: right + ' right.', h1b: wrong > 0 ? wrong + ' to fix.' : 'Nothing to fix.',
          hand: wrong > 0 && B.page !== 'exams' ? 'the ' + (wrong === 1 ? 'one miss is' : plain(wrong) + ' are') + ' in your review queue already' : 'every answer is explained below', cta: [] };
      }
      return { kicker: B.base.kicker, h1a: 'Your results,', h1b: 'with the why.', hand: B.base.hand, cta: [] };
    }
    if (!setup) {
      var fc = document.getElementById('flashcardScreen');
      var counter = txt(main && main.querySelector('#progressText, #fcProgressText, .cx-progress-text, [class*="progress-text"]'));
      var mm = counter.match(/(?:Question|Card)\s+(\d+)\s+of\s+(\d+)/i) || txt(main).match(/(?:Question|Card)\s+(\d+)\s+of\s+(\d+)/i);
      var card = (fc && vis(fc)) || B.page === 'flashcards';
      var timed = vis(document.getElementById('timerBar'));
      var banner = txt(document.getElementById('practiceBanner'));
      return {
        kicker: banner ? banner.replace(/\.$/, '').replace(/,\s*/g, ' · ') : B.base.kicker,
        h1a: mm ? (card ? 'Card ' : 'Question ') + mm[1] + ',' : (card ? 'Studying,' : 'In session,'),
        h1b: card ? 'grade it honestly.' : timed ? 'on the clock.' : 'with the why.',
        hand: card ? 'it comes back just before you forget' : timed ? 'the score and every answer come at the end' : 'misses go to your review queue',
        cta: []
      };
    }
    return { kicker: B.base.kicker, h1a: B.base.h1a, h1b: B.base.h1b, hand: B.base.hand, cta: [] };
  }
  /* The keyboard legend under a running session, folded (B8). NREMT's runner
     draws the same list in its own side card (#quizScreen .r3-kbd). */
  function mountKeys(){
    var main = document.getElementById('main');
    if (!main || main.querySelector('#quizScreen')) return;
    [].forEach.call(main.querySelectorAll('.cx-session'), function(s){
      if (s.querySelector(':scope > .cx-keys')) return;
      var d = document.createElement('details');
      d.className = 'cx-keys';
      d.innerHTML = '<summary>Keyboard</summary>' + keys();
      s.appendChild(d);
    });
  }
  var pending = 0, placeLede = function(){};
  function refresh(){ if (pending) return; pending = requestAnimationFrame(function(){ pending = 0; placeLede(); mountKeys(); paint(state()); }); }
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
    mountKeys();
    paint(state());
    new MutationObserver(refresh).observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'style', 'data-view', 'disabled'], characterData: true });
  }
  window.LevlStudy.band = function(s){ forced = s || null; if (B) paint(state()); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', band); else band();
})();
