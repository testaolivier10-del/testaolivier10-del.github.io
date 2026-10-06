/* Shared hub components (docs/course-shell.md, W-D): window.LevlHub.

   Every course's dashboard, search page, tools hub and home "now" row draws
   its markup from here, styled by assets/course/hub.css, so the four courses
   cannot drift apart again. Each course keeps its own data and engine (the
   A&P/Bio cores, ochem's mastery engine, NREMT's practice-engine records)
   and only hands this module plain values. Nothing here reads or writes
   storage.

   Also loadable in Node (scripts/build-anp.mjs and build-apbio.mjs render
   the static tools hub with toolCard), so no DOM access at load time. */
(function(root){
  'use strict';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function pct(v){ return Math.round((v || 0) * 100); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }

  /* ---- status words ----------------------------------------------------
     One scale for mastery (0..1) in every course. The word is always shown,
     so the reading never depends on the chip's color. */
  var TIERS = [
    { min: 0.85, label: 'Mastered', lvl: 4 },
    { min: 0.6, label: 'Strong', lvl: 3 },
    { min: 0.3, label: 'Developing', lvl: 2 },
    { min: -1, label: 'Learning', lvl: 1 }
  ];
  function tier(v, answered){
    if(!answered) return { label: 'Not started', lvl: 0 };
    for(var i = 0; i < TIERS.length; i++) if(v >= TIERS[i].min) return TIERS[i];
    return TIERS[TIERS.length - 1];
  }
  function chip(t){ return t ? '<span class="cx-chip" data-lvl="' + (t.lvl || 0) + '">' + esc(t.label) + '</span>' : ''; }

  /* ---- dashboard pieces ------------------------------------------------ */

  // Stat tiles: [{ value (html), label, sub (html) }].
  function stats(tiles){
    return '<div class="cx-stats">' + tiles.map(function(t){
      return '<div class="cx-stat"><div class="cx-stat-num">' + t.value + '</div><div class="cx-stat-label">' + esc(t.label) + '</div>' +
        (t.sub ? '<div class="cx-stat-sub">' + t.sub + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }

  /* One mastery row. o: label, href, value (0..1), text (shown instead of
     the percentage), tier ({label,lvl}), note (html), action ({href,label}). */
  function row(o){
    var p = pct(o.value);
    var act = o.action ? '<a class="cx-go" href="' + esc(o.action.href) + '">' + esc(o.action.label) + '</a>' : '';
    return '<div class="cx-row"><div class="cx-row-top">' +
        '<span class="cx-row-name">' + (o.href ? '<a href="' + esc(o.href) + '">' + esc(o.label) + '</a>' : esc(o.label)) + '</span>' +
        '<span class="cx-row-val"><b>' + (o.text != null ? o.text : (o.tier && !o.tier.lvl ? '' : p + '%')) + '</b>' + chip(o.tier) + '</span>' +
      '</div>' +
      '<div class="track thin" aria-hidden="true"><i style="width:' + Math.max(o.value > 0 ? 2 : 0, Math.min(100, p)) + '%"></i></div>' +
      ((o.note || act) ? '<div class="cx-row-foot"><span>' + (o.note || '') + '</span>' + act + '</div>' : '') +
    '</div>';
  }

  // A collapsible group (chapter, unit, module, domain) with rows inside.
  function group(head, bodyHtml, open){
    return '<details class="cx-group"' + (open ? ' open' : '') + '><summary>' + row(head) + '</summary><div class="cx-group-body">' + bodyHtml + '</div></details>';
  }

  function panel(o){
    var id = o.id ? ' id="' + esc(o.id) + '"' : '';
    var hid = o.id ? o.id + '-h' : '';
    return '<section class="cx-panel' + (o.cls ? ' ' + o.cls : '') + '"' + id + (hid ? ' aria-labelledby="' + esc(hid) + '"' : '') + '>' +
      '<h2' + (hid ? ' id="' + esc(hid) + '"' : '') + '>' + o.title + '</h2>' +
      (o.hint ? '<p class="cx-hint">' + o.hint + '</p>' : '') + (o.body || '') + '</section>';
  }

  /* "Next up". A new learner gets the numbered start list (o.steps: html
     strings, o.intro); someone with data gets the action cards (o.cards:
     { href, title, sub }). */
  function next(o){
    if(o.cards && o.cards.length){
      return panel({ id: o.id || 'cx-next', cls: 'cx-next', title: esc(o.title || 'Study next'),
        body: '<ul class="cx-next-list">' + o.cards.map(function(c){
          return '<li><a href="' + esc(c.href) + '">' + c.title + '</a><span>' + (c.sub || '') + '</span></li>';
        }).join('') + '</ul>' });
    }
    return panel({ id: o.id || 'cx-next', cls: 'cx-next', title: esc(o.title || 'Your dashboard fills in as you study'),
      body: (o.intro ? '<p>' + o.intro + '</p>' : '') + '<ol>' + (o.steps || []).map(function(s){ return '<li>' + s + '</li>'; }).join('') + '</ol>' });
  }

  /* Level card. info: HubProgress.levelInfo(subject). o.sub: lines (html)
     under the bar; o.chips: small earned-badge labels. */
  function level(info, o){
    o = o || {};
    if(!info) return '';
    var into = Math.round(info.into / Math.max(1, info.span) * 100);
    return '<section class="cx-level" aria-labelledby="cx-level-h">' +
      '<div class="cx-level-head"><span class="cx-level-ring" aria-hidden="true">' + info.level + '</span><div>' +
        '<h2 id="cx-level-h">Level ' + info.level + ' &middot; ' + esc(info.title) + '</h2>' +
        '<span class="cx-level-sub">' + (o.xpLine || (Number(info.total || 0).toLocaleString() + ' XP total')) + '</span></div></div>' +
      '<div class="cx-level-track" aria-hidden="true"><i style="width:' + into + '%"></i></div>' +
      '<p class="cx-level-sub">' + Number(info.toNext != null ? info.toNext : info.span - info.into).toLocaleString() + ' XP to level ' + (info.level + 1) + '</p>' +
      (o.sub || []).map(function(s){ return '<p class="cx-level-sub">' + s + '</p>'; }).join('') +
      (o.chips && o.chips.length ? '<div class="cx-level-chips">' + o.chips.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
    '</section>';
  }
  // The streak line every level card carries.
  function streakLine(s){
    if(!s) return '';
    return 'Streak: ' + plural(s.current, 'day') + ' (best ' + s.longest + ') &middot; today ' + s.todayCount + ' of ' + s.goal +
      (s.freezes ? ' &middot; ' + plural(s.freezes, 'freeze') : '');
  }

  /* Badges: [{ icon, label, earned, prog (text), aria }] in a panel. */
  function badges(list, o){
    o = o || {};
    return panel({ id: o.id || 'cx-badges', cls: 'cx-badges', title: esc(o.title || 'Badges'), hint: o.hint,
      body: '<div class="badge-grid">' + list.map(function(b){
        return '<div class="badge' + (b.earned ? '' : ' is-locked') + '" role="img" aria-label="' + esc(b.aria || (b.label + ': ' + (b.earned ? 'earned' : 'not yet'))) + '"' + (b.title ? ' title="' + esc(b.title) + '"' : '') + '>' +
          '<div class="badge-circle' + (b.earned ? '' : ' locked') + '" aria-hidden="true">' + b.icon + '</div>' +
          '<span aria-hidden="true">' + esc(b.label) + '</span>' +
          (b.prog ? '<small class="badge-prog" aria-hidden="true">' + esc(b.prog) + '</small>' : '') + '</div>';
      }).join('') + '</div>' });
  }

  /* ---- tools hub ---------------------------------------------------------
     t: { href, name, desc, icon (svg inner markup), stroke (true when the
     icon is line work drawn with the card's stroke), premium (html, a pill),
     foot (html: tag line, left), status (html, or '' when not tracked),
     attrs (extra attributes on the link), id }. */
  function toolCard(t){
    return '<li><a class="cx-tool" href="' + esc(t.href) + '"' + (t.attrs || '') + '>' +
      '<span class="cx-tool-top"><span class="cx-tool-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"' + (t.stroke ? ' data-stroke' : '') + '>' + (t.icon || '<circle cx="12" cy="12" r="7"/>') + '</svg></span>' + (t.premium || '') + '</span>' +
      '<span class="cx-tool-name">' + esc(t.name) + '</span>' +
      '<span class="cx-tool-desc">' + esc(t.desc || '') + '</span>' +
      (t.status != null ? '<span class="cx-tool-status">' + t.status + '</span>' : '') +
      '<span class="cx-tool-foot"><span>' + (t.foot || '') + '</span><span class="cx-tool-go">Open <span aria-hidden="true">&rarr;</span></span></span>' +
    '</a></li>';
  }
  function toolGrid(cards, label){
    return '<ul class="cx-tool-grid"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + cards.map(toolCard).join('') + '</ul>';
  }
  // "Not tried yet", or accuracy with a bar, from { n, c } tool stats.
  function toolStatus(s){
    if(!s || !s.n) return '<span class="cx-tool-stat is-new">Not tried yet</span><span class="track thin" aria-hidden="true"><i style="width:0%"></i></span>';
    var p = Math.round(s.c / s.n * 100);
    return '<span class="cx-tool-stat"><b>' + p + '%</b> right &middot; ' + s.c + ' of ' + s.n + ' items</span><span class="track thin" aria-hidden="true"><i style="width:' + p + '%"></i></span>';
  }

  /* ---- course home "now" row ------------------------------------------ */
  function nowCard(o){
    return '<div class="k">' + esc(o.kicker) + '</div><h2>' + o.title + '</h2><p>' + (o.text || '') + '</p>' +
      (o.bar != null ? '<div class="xp-track" aria-hidden="true"><div class="xp-fill" style="width:' + Math.max(0, Math.min(100, o.bar)) + '%"></div></div>' : '') +
      (o.cta ? '<a class="' + (o.primary ? 'btn-press' : 'link-quiet') + '" href="' + esc(o.cta.href) + '">' + o.cta.label + '</a>' : '');
  }

  /* ---- search --------------------------------------------------------------
     One controller for every course search page. The course builds its
     index (chunks for LevlSearch: { page, file, heading, text, meta,
     weight }) and hands it over with add(); this owns the box, the status
     line, the kind pills, grouped results and the keyboard.

     o: mount, prefix (id prefix, e.g. 'anp-sr'), label, placeholder, kinds
     (display order of chunk.page values), engine (LevlSearch or a promise
     of it), allHref (the site-wide search), href(hit, terms, S) optional,
     metaFor(hit) optional, perGroup, limit, maxPerSource. */
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  function search(o){
    var doc = root.document, P = o.prefix || 'cx-sr';
    var KINDS = o.kinds || [], PER = o.perGroup || 8;
    var INDEX = [], S = null, active = 'all', expanded = {}, pending = 0, missing = [];
    o.mount.innerHTML =
      '<div class="cx-sr">' +
        '<div class="cx-search"><label class="sr-only" for="' + P + '-q">' + esc(o.label || 'Search the course') + '</label>' + ICON +
          '<input type="search" id="' + P + '-q" placeholder="' + esc(o.placeholder || 'Search the course') + '" autocomplete="off" spellcheck="false" aria-describedby="' + P + '-status ' + P + '-help" aria-controls="' + P + '-results"></div>' +
        '<div class="cx-sr-status" id="' + P + '-status" role="status" aria-live="polite">Building the search index&hellip;</div>' +
        '<p class="cx-sr-help" id="' + P + '-help">Results appear as you type. <kbd>&darr;</kbd> moves into the results, <kbd>&uarr;</kbd> <kbd>&darr;</kbd> between them, <kbd>Enter</kbd> opens one, <kbd>Esc</kbd> returns here.</p>' +
        '<p class="cx-sr-all"><a id="' + P + '-all" href="' + esc(o.allHref) + '">Search all courses &rarr;</a></p>' +
        '<div class="cx-pills cx-sr-filters" id="' + P + '-filters" role="group" aria-label="Filter results by kind"></div>' +
        '<div id="' + P + '-results" class="cx-sr-results"></div>' +
        '<p class="cx-sr-foot">Runs in your browser. Nothing is sent anywhere.</p>' +
      '</div>';
    var box = doc.getElementById(P + '-q'), statusEl = doc.getElementById(P + '-status');
    var filtersEl = doc.getElementById(P + '-filters'), resultsEl = doc.getElementById(P + '-results'), allLink = doc.getElementById(P + '-all');
    var params = new URLSearchParams(root.location.search);
    box.value = params.get('q') || '';

    function counts(list){ var c = {}; list.forEach(function(h){ c[h.page] = (c[h.page] || 0) + 1; }); return c; }
    function order(c){ var ks = KINDS.filter(function(k){ return c[k]; }); Object.keys(c).forEach(function(k){ if(ks.indexOf(k) === -1) ks.push(k); }); return ks; }
    // The same index line in every course: what is searchable, by kind.
    function indexLine(){
      var c = counts(INDEX), ks = order(c);
      return (INDEX.length ? 'Searching ' + INDEX.length.toLocaleString() + ' passages: ' + ks.map(function(k){ return c[k].toLocaleString() + ' ' + k.toLowerCase(); }).join(', ') + '.' : 'Nothing indexed yet.') +
        (pending ? ' Still indexing…' : '') +
        (missing.length ? ' ' + missing.join(' and ') + ' could not be loaded (offline?), so ' + (missing.length > 1 ? 'they are' : 'it is') + ' left out.' : '');
    }
    // The same line in every course: what is searchable, by kind, and how
    // many results the current query has.
    function setStatus(n){
      if(!S) return;
      statusEl.textContent = (n != null ? n.toLocaleString() + (n === 1 ? ' result. ' : ' results. ') : '') + indexLine();
    }
    function renderFilters(hits){
      var c = counts(hits), ks = order(c);
      var btns = [['all', 'Everything', hits.length]];
      ks.forEach(function(k){ btns.push([k, k, c[k]]); });
      if(active !== 'all' && !c[active]) btns.push([active, active, 0]);
      filtersEl.innerHTML = hits.length || active !== 'all' ? btns.map(function(b){
        return '<button type="button" class="cx-pill" data-kind="' + esc(b[0]) + '" aria-pressed="' + (b[0] === active) + '">' + esc(b[1]) + ' <span>' + Number(b[2]).toLocaleString() + '</span></button>';
      }).join('') : '';
    }
    function run(){
      var q = box.value.trim();
      try{ root.history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : root.location.pathname); }catch(e){}
      allLink.href = o.allHref + (q ? '?q=' + encodeURIComponent(q) : '');
      if(!S) return;
      if(!q){ resultsEl.innerHTML = ''; filtersEl.innerHTML = ''; setStatus(); return; }
      var terms = S.tokenize(q);
      var hits = S.rank(INDEX, q, { limit: o.limit || 400, maxPerSource: o.maxPerSource || 3 });
      renderFilters(hits);
      var shown = active === 'all' ? hits : hits.filter(function(h){ return h.page === active; });
      if(!shown.length){
        resultsEl.innerHTML = '<p class="cx-sr-none">No matches for &ldquo;' + esc(q) + '&rdquo;' + (active !== 'all' ? ' in ' + esc(active) : '') + '. Try fewer words, or a related term.</p>';
        setStatus(0);
        return;
      }
      var groups = {};
      shown.forEach(function(h){ (groups[h.page] = groups[h.page] || []).push(h); });
      resultsEl.innerHTML = order(groups).map(function(k){
        var list = groups[k], all = expanded[k] || active !== 'all';
        var vis = all ? list : list.slice(0, PER);
        return '<section class="cx-sr-group" aria-label="' + esc(k) + '"><h2 class="cx-sr-gh">' + esc(k) + ' <span>' + list.length + '</span></h2><ul class="cx-sr-list">' +
          vis.map(function(h){
            var href = o.href ? o.href(h, terms, S) : (h.fragment ? S.textFragment(h.file, terms) : h.file);
            return '<li><a class="cx-sr-hit" href="' + esc(href) + '"><span class="cx-sr-title">' + S.highlight(h.heading, terms, { lead: 0, span: 400 }) + '</span>' +
              '<span class="cx-sr-meta">' + esc(h.meta || h.page) + '</span>' +
              '<span class="cx-sr-snip">' + h.snippet + '</span></a></li>';
          }).join('') + '</ul>' +
          (vis.length < list.length ? '<button type="button" class="cx-sr-more" data-more="' + esc(k) + '">Show all ' + list.length + ' ' + esc(k.toLowerCase()) + '</button>' : '') +
          '</section>';
      }).join('');
      setStatus(shown.length);
    }

    filtersEl.addEventListener('click', function(e){
      var b = e.target.closest('button[data-kind]'); if(!b) return;
      active = b.getAttribute('data-kind'); run();
      var again = filtersEl.querySelector('[data-kind="' + active + '"]'); if(again) again.focus();
    });
    resultsEl.addEventListener('click', function(e){
      var b = e.target.closest('[data-more]'); if(!b) return;
      var k = b.getAttribute('data-more'); expanded[k] = 1; run();
      var links = resultsEl.querySelectorAll('.cx-sr-group[aria-label="' + k + '"] .cx-sr-hit');
      if(links[PER]) links[PER].focus();
    });
    var t = 0;
    box.addEventListener('input', function(){ clearTimeout(t); expanded = {}; t = setTimeout(run, 60); });
    function hits(){ return Array.prototype.slice.call(resultsEl.querySelectorAll('.cx-sr-hit, .cx-sr-more')); }
    box.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){ var h = hits(); if(h[0]){ e.preventDefault(); h[0].focus(); } }
      else if(e.key === 'Enter'){ var f = hits()[0]; if(f && f.tagName === 'A'){ e.preventDefault(); root.location.href = f.href; } }
      else if(e.key === 'Escape' && box.value){ e.preventDefault(); box.value = ''; run(); }
    });
    resultsEl.addEventListener('keydown', function(e){
      var h = hits(), i = h.indexOf(doc.activeElement);
      if(i < 0) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); if(h[i + 1]) h[i + 1].focus(); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); (i ? h[i - 1] : box).focus(); }
      else if(e.key === 'Home'){ e.preventDefault(); h[0].focus(); }
      else if(e.key === 'End'){ e.preventDefault(); h[h.length - 1].focus(); }
      else if(e.key === 'Escape'){ e.preventDefault(); box.focus(); }
    });
    doc.addEventListener('keydown', function(e){
      if(e.key === '/' && doc.activeElement !== box && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')){ e.preventDefault(); box.focus(); box.select(); }
    });

    var api = {
      box: box,
      /* Add chunks now (an array) or later (a promise of one). name: what
         the status line calls this source if it fails to load. */
      add: function(src, name){
        if(src && typeof src.then === 'function'){
          pending++; setStatus();
          return src.then(function(list){ INDEX = INDEX.concat(list || []); if(name && !(list && list.length)) missing.push(name); },
            function(){ if(name) missing.push(name); })
            .then(function(){ pending--; if(box.value.trim()) run(); else setStatus(); });
        }
        INDEX = INDEX.concat(src || []);
        if(box.value.trim()) run(); else setStatus();
        return Promise.resolve();
      },
      fail: function(msg){ statusEl.textContent = msg; },
      run: run
    };
    Promise.resolve(o.engine).then(function(engine){
      S = engine;
      if(!S || typeof S.rank !== 'function') throw 0;
      setStatus(); run();
      if(!box.value) try{ box.focus({ preventScroll: true }); }catch(e){}
    }).catch(function(){ statusEl.textContent = 'The search engine did not load. Check your connection and reload the page.'; });
    return api;
  }
  // Loads assets/site-search.js when the page has not, resolving LevlSearch.
  function engine(src){
    function ok(){ var S = root.LevlSearch; return S && typeof S.rank === 'function' && typeof S.tokenize === 'function'; }
    if(ok()) return Promise.resolve(root.LevlSearch);
    return new Promise(function(res, rej){
      var s = root.document.createElement('script');
      s.src = src;
      s.onload = function(){ ok() ? res(root.LevlSearch) : rej(); };
      s.onerror = rej;
      root.document.head.appendChild(s);
    });
  }

  var api = { esc: esc, pct: pct, plural: plural, tier: tier, chip: chip, stats: stats, row: row, group: group, panel: panel, next: next,
    level: level, streakLine: streakLine, badges: badges, toolCard: toolCard, toolGrid: toolGrid, toolStatus: toolStatus, nowCard: nowCard,
    search: search, engine: engine };
  root.LevlHub = api;
  if(typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
