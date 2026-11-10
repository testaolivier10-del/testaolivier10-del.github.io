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
  /* Score card v3 (owner approved mockup, 2026-11-07; docs/score-card.md). One layout for every course and mode:
     a course-colour band (kind of session, big result, right/missed bar, a few chips, one handwritten line that
     says what happened, the path line), a white card over its foot (what you missed with the answer and its
     explanation, earned badges, the main button, Retry and quiet links), then topics with mastery arrows and the
     course's breakdowns. Under 5 questions only the band, the misses and the buttons show.
     o: { course, kind, right, total, skipped, unit ('right'), chips: [text], sub, timed: { used, limit, pace },
          missed: [LevlStudy.miss(...)], missedTitle, hand, step, retry, also, stepHtml, extras, next, nextTitle,
          more, kept, estimate: { value, range, label } } */
  var LS = { get: function(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } },
             set: function(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  function courseKey(){ return (document.body && document.body.getAttribute('data-course')) || 'site'; }
  var UPS = null;   // mastery moves counted by topics() for the handwritten line
  var ICO = {
    clock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    up: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 15l7-7 7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/></svg>'
  };
  /* One missed question for the card, from a question object and the student's pick. Works with every course's
     shapes: options + correct index, a correct list (select all), a number or text answer; anything else shows the
     stem only. stem, options and explanations are the courses' own authored markup. */
  function textOf(h){ var d = document.createElement('div'); d.innerHTML = String(h == null ? '' : h); return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  function miss(q, pick, href){
    if(!q) return null;
    var opts = q.options || q.choices || q.opts, you = '', ans = '';
    var cor = q.correct != null ? q.correct : q.answer;
    if(opts && typeof cor === 'number'){ ans = opts[cor]; you = typeof pick === 'number' ? opts[pick] : ''; }
    else if(opts && Array.isArray(cor)){ ans = cor.map(function(i){ return opts[i]; }).join(', '); you = Array.isArray(pick) ? pick.map(function(i){ return opts[i]; }).join(', ') : ''; }
    else if(cor != null && typeof cor !== 'object'){ ans = String(cor); you = pick == null || typeof pick === 'object' ? '' : String(pick); }
    var why = q.why && (q.why.correct || (typeof q.why === 'string' ? q.why : '')) || q.explanation || q.rationale || '';
    var yw = q.why && q.why.options && typeof pick === 'number' ? q.why.options[pick] : '';
    return { stem: q.q || q.stem || q.prompt || q.question || '', you: you, ans: ans, why: why, youWhy: yw, href: href || '' };
  }
  /* A question's own markup kept for one summary line: math (MathML, KaTeX) stays as it rendered in the
     question; pictures, tables and block wrappers that would not fit one line are dropped or made inline. */
  function lineHtml(h){
    var d = document.createElement('div'); d.innerHTML = String(h == null ? '' : h);
    [].forEach.call(d.querySelectorAll('img,figure,table,video,audio,iframe,script,style,button,input,select,textarea'), function(x){ x.remove(); });
    [].forEach.call(d.querySelectorAll('svg'), function(x){ if(!x.closest('.katex,math,mjx-container')) x.remove(); });
    [].forEach.call(d.querySelectorAll('p,div,ul,ol,li,h1,h2,h3,h4,blockquote,pre,section'), function(x){ if(x.closest('.katex,math')) return; var sp = document.createElement('span'); while(x.firstChild) sp.appendChild(x.firstChild); sp.appendChild(document.createTextNode(' ')); x.replaceWith(sp); });
    [].forEach.call(d.querySelectorAll('a'), function(x){ var sp = document.createElement('span'); while(x.firstChild) sp.appendChild(x.firstChild); x.replaceWith(sp); });
    return d.innerHTML.trim();
  }
  function missedHtml(list, title){
    list = (list || []).filter(Boolean);
    if(!list.length) return '';
    var row = function(m, i){
      return '<details class="cx-mq"' + (i >= 3 ? ' hidden data-more' : '') + '><summary><span class="cx-mq-x" aria-hidden="true">&#x2715;</span><span class="cx-mq-q"><span class="cx-mq-stem">' + lineHtml(m.stem) + '</span>' +
        (m.ans ? '<small>' + (m.you ? 'You said ' + lineHtml(m.you) + ' · ' : '') + 'Answer: <b>' + lineHtml(m.ans) + '</b></small>' : '') + '</span><span class="cx-mq-ch" aria-hidden="true">&rsaquo;</span></summary>' +
        '<div class="cx-mq-body">' + (m.youWhy ? '<p><b>Your answer:</b> ' + m.youWhy + '</p>' : '') + (m.why ? '<p>' + m.why + '</p>' : '') +
          (m.href ? '<p><a href="' + esc(m.href) + '">Open the lesson</a></p>' : (!m.why && !m.youWhy ? '<p class="cx-small">The explanation is in the answer list below.</p>' : '')) + '</div></details>';
    };
    return '<div class="cx-missed"><p class="cx-card-k">' + esc(title || ('You missed ' + list.length)) + '</p>' + list.map(row).join('') +
      (list.length > 3 ? '<button type="button" class="cx-mq-more" data-act="moremiss">+ ' + (list.length - 3) + ' more</button>' : '') + '</div>';
  }
  function handLine(o, pct, best){
    if(o.hand != null) return o.hand;
    if(!o.total) return '';
    if(pct === 100) return o.total >= 3 ? 'Every one right!' : 'All right!';
    if(best) return 'Your best yet!';
    if(UPS && UPS.up >= 2) return UPS.up + ' topics went up!';
    if(pct >= 80) return 'Strong set.';
    if(pct >= 50) return 'Misses come back in review.';
    return 'The misses are where it sticks.';
  }
  function end(o){
    var also = (o.also || []).filter(Boolean).slice(0, 2);
    var right = o.right || 0, total = o.total || 0, skip = o.skipped || 0, miss_ = Math.max(0, total - right - skip);
    var pct = total ? Math.round(100 * right / total) : 0, ck = courseKey(), kind = o.kind || 'Practice set', short = total < 5;
    if(o.title == null){ var cn = document.querySelector('.site-header__course-full'); o.title = cn ? cn.textContent : ''; }
    // Last time and personal best, per course and kind of session (this device).
    var lk = 'levl_card_v1', st = LS.get(lk) || {}, key = ck + '|' + kind, prev = st[key], best = false, chips = [];
    // One question per page (free response, justify, a scenario): last time and best would compare different questions.
    var oneQ = o.noHistory || /^(Free response|Justify|Scenario)/.test(kind);
    if(total >= 3 && !oneQ){
      if(prev && prev.n >= 3){ var d = pct - prev.p; if(d) chips.push('<span class="cx-chip ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? ICO.up : ICO.down) + (d > 0 ? '+' : '') + d + '% vs last time</span>'); }
      best = !!(prev && total >= 5 && pct > (prev.b || 0) && pct < 100);
      st[key] = { p: pct, n: total, b: Math.max(pct, prev && prev.b || 0), at: Date.now() }; LS.set(lk, st);
    }
    if(o.timed){ chips.unshift('<span class="cx-chip">' + ICO.clock + esc(o.timed.used + (o.timed.limit ? ' of ' + o.timed.limit : '')) + '</span>' + (o.timed.pace ? '<span class="cx-chip">' + esc(o.timed.pace) + ' a question</span>' : '')); }
    if(skip) chips.push('<span class="cx-chip">' + skip + ' unanswered</span>');
    (o.chips || []).forEach(function(c){ if(c) chips.push('<span class="cx-chip">' + c + '</span>'); });
    if(o.sub) chips.push('<span class="cx-chip cx-chip-txt">' + o.sub + '</span>');
    // The path line, from the summary the path keeps (assets/course/path.js saveSum).
    var ps = LS.get(ck + '_path_sum_v1'), pl = '';
    if(ps && ps.next){
      var pk = 'levl_card_path_v1', pseen = LS.get(pk) || {}, was = pseen[ck];
      pl = '<p class="cx-pathln"><span>Path</span><span class="cx-pb" aria-hidden="true"><i style="width:' + ps.pct + '%"></i></span><span>' + (was != null && was !== ps.pct ? was + '% &rarr; ' : '') + ps.pct + '%</span>' +
        '<span class="cx-nx">· Up next: ' + (ps.href ? '<a href="' + esc(ps.href) + '">' + esc(ps.next) + '</a>' : esc(ps.next)) + '</span></p>';
      pseen[ck] = ps.pct; LS.set(pk, pseen);
    }
    var hand = handLine(o, pct, best);
    var badges = (best ? '<span class="cx-bdg">' + ICO.star + 'Personal best</span>' : '') + (o.badges || []).map(function(b){ return '<span class="cx-bdg">' + ICO.star + esc(b) + '</span>'; }).join('');
    var bar = total ? '<span class="cx-bar" role="img" aria-label="' + right + ' right, ' + miss_ + ' missed' + (skip ? ', ' + skip + ' unanswered' : '') + '"><i class="ok" style="--w:' + (right / total * 100) + '%"></i><i class="no" style="--w:' + (miss_ / total * 100) + '%"></i>' + (skip ? '<i class="sk" style="--w:' + (skip / total * 100) + '%"></i>' : '') + '</span>' : '';
    var est = o.estimate ? '<span class="cx-est"><small>' + esc(o.estimate.label || 'Estimated score') + '</small><b>' + esc(o.estimate.value) + '</b>' + (o.estimate.range ? '<em>' + esc(o.estimate.range) + '</em>' : '') + '</span>' : '';
    var rt = o.retry ? ctl('btn-outline cx-endp-retry2', o.retry) : '';
    var acts = o.stepHtml ? o.stepHtml + (rt ? '<div class="cx-endp-acts">' + rt + '</div>' : '')
      : '<div class="cx-endp-acts">' + (o.step ? ctl('btn-press', o.step) : '') + rt + also.map(function(a){ return ctl('link-quiet', a); }).join('') + '</div>';
    UPS = null;
    return '<section class="cx-endp cx-endp3' + (short ? ' is-short' : '') + '" aria-label="Session results">' +
      '<div class="cx-band">' +
        '<p class="cx-kick">' + esc(kind) + '<i></i>' + esc(o.title || '') + '</p>' +
        '<div class="cx-endp-score" tabindex="-1"><span class="cx-big" data-n="' + right + '">' + right + '<small>/' + total + '</small></span>' +
          '<span class="cx-hero-side">' + (o.unit ? '<b>' + esc(o.unit) + '</b>' : '') + (hand ? '<span class="cx-hand">' + esc(hand) + '</span>' : '') + '</span>' + est + '</div>' +
        bar + (chips.length ? '<p class="cx-chips">' + chips.join('') + '</p>' : '') + pl +
      '</div>' +
      '<div class="cx-endp-card">' + missedHtml(o.missed, o.missedTitle) + (badges ? '<p class="cx-bdgs">' + badges + '</p>' : '') + acts + (o.extras || '') + '</div>' +
      (short ? '' : (o.next ? '<h2 class="cx-endp-h">' + (o.nextTitle || 'Topics') + '</h2>' + o.next : '') + (o.more || '')) +
      (o.kept || '') + premiumAtLimit(o.course) +
    '</section>';
  }
  /* End screen v2b helpers (owner 2026-11-07), one look in every course.
     topics(rows): one table, misses first. Row: { name, href, c, n, mastery (0..1 or null), links: [{ label, href }] }.
     bars(title, rows): a compact breakdown. Row: { label, c, n }. */
  function topics(rows){
    rows = rows.slice().sort(function(a, b){ return (b.n - b.c) - (a.n - a.c) || a.c / a.n - b.c / b.n; });
    var hasM = rows.some(function(r){ return r.mastery != null; }), ck = courseKey(), mk = 'levl_mast_seen_v1', ms = LS.get(mk) || {}, seen = ms[ck] || (ms[ck] = {});
    UPS = { up: 0, down: 0 };
    var html = '<div class="cx-topics' + (hasM ? '' : ' no-m') + '" role="table" aria-label="Results by topic"><div class="cx-topics-h" role="row"><span role="columnheader">Topic</span><span role="columnheader">Right</span>' +
      (hasM ? '<span role="columnheader">Mastery</span>' : '') + '<span></span></div>' + rows.map(function(r){
        var mp = r.mastery == null ? null : Math.round(r.mastery * 100), was = seen[r.name], dl = '';
        if(mp != null){ if(was != null && was !== mp){ var d = mp - was; UPS[d > 0 ? 'up' : 'down']++; dl = '<span class="cx-dl ' + (d > 0 ? 'up' : 'dn') + '">' + (d > 0 ? '&#9650;' : '&#9660;') + ' ' + Math.abs(d) + '%</span>'; } seen[r.name] = mp; }
        var study = r.c < r.n && r.links && r.links.length ? '<a class="btn-outline sm" href="' + esc(r.links[0].href) + '">Study</a>' : '';
        return '<div class="cx-topic' + (r.c < r.n ? ' is-miss' : '') + '" role="row">' +
          (r.href ? '<a class="cx-topic-name" role="cell" href="' + esc(r.href) + '">' + esc(r.name) + '</a>' : '<span class="cx-topic-name" role="cell">' + esc(r.name) + '</span>') +
          '<span class="cx-topic-r" role="cell">' + r.c + '/' + r.n + '</span>' +
          (hasM ? '<span class="cx-topic-m" role="cell">' + (mp == null ? '' : '<span class="cx-mbar" aria-hidden="true"><i style="width:' + mp + '%"></i></span>' + mp + '% ' + dl) + '</span>' : '') +
          '<span class="cx-topic-go" role="cell">' + study + '</span></div>';
      }).join('') + '</div>';
    LS.set(mk, ms);
    return html;
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
      var act = b.getAttribute('data-act'), fn = handlers[act];
      if(act === 'moremiss') fn = function(){ [].forEach.call(root.querySelectorAll('.cx-mq[data-more]'), function(d){ d.hidden = false; }); b.remove(); };
      if(fn) b.addEventListener('click', fn);
    });
    // The score counts up and the bar fills (under a second), unless the student asked for less motion.
    var big = root.querySelector('.cx-endp3 .cx-big'), card = root.querySelector('.cx-endp3');
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(card && !calm){
      card.classList.add('is-anim');
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ card.classList.add('is-in'); }); });
      var n = big ? +big.getAttribute('data-n') : 0, node = big && big.firstChild;
      if(node && node.nodeType === 3 && n > 0){
        var t0 = null, dur = Math.min(800, 250 + n * 40);
        var step = function(t){ if(t0 == null) t0 = t; var k = Math.min(1, (t - t0) / dur); node.nodeValue = String(Math.round(n * (1 - Math.pow(1 - k, 3)))); if(k < 1) requestAnimationFrame(step); };
        node.nodeValue = '0'; requestAnimationFrame(step);
      }
    }
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
    end: end, wire: wire, topics: topics, bars: bars, miss: miss, keys: keys, atLimit: atLimit, premiumAtLimit: premiumAtLimit };

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
    physics: 'apphys', calculus: 'apcalc', 'calculus-bc': 'apcalcbc', statistics: 'apstat', 'environmental-science': 'apenv', psychology: 'appsych', precalculus: 'apprecalc', macroeconomics: 'apmacro', 'human-geography': 'aphug' };
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
