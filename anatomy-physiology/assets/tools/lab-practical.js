/* A&P virtual lab practical (docs/anp-spec.md section 8.1, docs/anp-tools-contract.md).

   Content: data/tools/lab-practical.json (read from #app[data-src]). A SET is a
   lab image set from the map (for example "Heart internal frontal section");
   each of its STATIONS is one registered OpenStax figure with the printed labels
   the set asks about. Every asked label carries its box on the figure (image
   pixels, drawn here as percentages so the boxes scale with the image), the
   accepted answers, what the structure does, and where it is taught. Labels
   that name something taught after the set's topic are listed as covered
   boxes: painted over for good, never asked (docs/anp-spec.md decision 30).
   A station may also list "shown" labels (not structures, left visible) and
   "hints" (headings that would give an answer away, masked while testing).

   Modes
     Explore   the printed labels show; tap any to read its name, what it does
               and where it is taught. Not scored.
     Study     the labels are masked; tap a mask to reveal it. Not scored.
     Quiz      "name it" (a box is highlighted, type its name) and "point to"
               (a name is given, tap its box among the masks). Typed answers
               accept listed synonyms and small spelling slips, and always show
               the correct spelling. A multiple-choice setting for beginners,
               a hint (first letters), and a retry round for misses.
     Practical a timed bell-ringer: a fixed number of stations drawn across the
               chosen sets, a per-station timer (adjustable, or none), no going
               back, some stations with a follow-up question, and a full review
               at the end with each station's image and the right answer.

   Scoring: each answered item is recorded through AnpCore.toolResult (XP,
   mastery for the station's topic and core concepts, misses to the review
   queue, accuracy by system on the dashboard). Item ids, stable forever:
     lab-practical:<set>:<figure>:<label>          name it / point to
     lab-practical:<set>:<figure>:<label>:follow   the follow-up question
   Events: anp-lab-station { set, correct } per scored station item, and
   anp-practical-finish { stations, correct } when a timed practical ends. */
(function(){
  var KIND = 'lab-practical';
  var app = document.getElementById('app');
  if(!app) return;
  var BASE = window.ANP_BASE || '../';
  var SRC = app.getAttribute('data-src') || (BASE + 'data/tools/lab-practical.json');
  var PREFS_KEY = 'anp_lab_prefs_v1';

  var DATA = null;
  var SETS = {};           // id -> set
  var ITEMS = [];          // every askable label: { set, st, lab, id }
  var ITEM = {};           // item id -> item
  var ALLNAMES = [];       // [{ key, lab }] every normalized answer in the data
  var timer = null;        // the running practical's interval
  var booted = false;

  /* ---------------------------------------------------------------- utils */
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cur(){ return window.AnpCurriculum || { chapters: [], topics: [] }; }
  function topicInfo(id){ var ts = cur().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }
  function chapterInfo(id){ var cs = cur().chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return null; }
  function chapterTitle(id){ var c = chapterInfo(id); return c ? c.title : id; }
  function report(id){ return window.LevlReport ? window.LevlReport.button('anp', id) : ''; }
  function core(){ return window.AnpCore || null; }
  function topicLink(id){
    var t = topicInfo(id);
    if(!t) return '';
    return t.built ? '<a href="' + esc(BASE + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a>' : esc(t.title);
  }
  function loadPrefs(){ try{ return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {}; }catch(e){ return {}; } }
  function savePrefs(p){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }catch(e){} }
  var PREFS = loadPrefs();
  function pref(k, d){ return PREFS[k] == null ? d : PREFS[k]; }
  function setPref(k, v){ PREFS[k] = v; savePrefs(PREFS); }
  function status(id){
    try{ var r = core() && core().load().q[id]; if(!r || !r.n) return 'new'; return r.right ? 'right' : 'missed'; }catch(e){ return 'new'; }
  }
  function focusEl(el){ if(el && booted){ try{ el.focus({ preventScroll: false }); }catch(e){ el.focus(); } } }
  function stopTimer(){ if(timer){ clearInterval(timer); timer = null; } }

  /* ------------------------------------------------------------ answers
     Forgiving but not sloppy: case, accents, punctuation, a leading "the",
     a parenthetical ("(cut)") and a plural s do not matter; a slip of one
     letter (two in a long name) is accepted with the correct spelling shown.
     A side or position word must be right ("left", "superior"...), and an
     answer that is closer to another structure's name is that structure. */
  var QUAL = ['left','right','superior','inferior','anterior','posterior','medial','lateral','internal','external','proximal','distal','deep','superficial','ascending','descending','greater','lesser','upper','lower','visceral','parietal','dorsal','ventral','cranial','caudal','common','middle','great','small'];
  function norm(s){
    s = String(s == null ? '' : s).toLowerCase();
    if(s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/\([^)]*\)/g, ' ').replace(/&/g, ' and ').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    s = s.replace(/^the /, '');
    return s.split(' ').filter(Boolean).map(function(w){ return w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w; }).join(' ');
  }
  function dist(a, b){
    // optimal string alignment distance (a transposition counts as one slip)
    var m = a.length, n = b.length, d = [], i, j;
    if(Math.abs(m - n) > 3) return 99;
    for(i = 0; i <= m; i++){ d[i] = [i]; }
    for(j = 0; j <= n; j++) d[0][j] = j;
    for(i = 1; i <= m; i++) for(j = 1; j <= n; j++){
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function tol(key){ var n = key.replace(/ /g, '').length; return n <= 4 ? 0 : n <= 9 ? 1 : 2; }
  function quals(key){
    var out = [];
    key.split(' ').forEach(function(w){
      if(QUAL.indexOf(w) > -1){ out.push(w); return; }
      if(w.length < 4) return;
      var hit = QUAL.filter(function(q){ return q.length >= 4 && dist(w, q) <= 1; });
      if(hit.length === 1) out.push(hit[0]);
    });
    return out.sort().join(' ');
  }
  function variants(lab){
    var v = [norm(lab.name)];
    (lab.accept || []).forEach(function(a){ var k = norm(a); if(k && v.indexOf(k) < 0) v.push(k); });
    return v;
  }
  /* Two labels name the same structure when each one's name is an accepted
     answer for the other (the same vessel labeled in two panels). */
  function same(a, b){
    if(a === b) return true;
    var na = norm(a.name), nb = norm(b.name);
    if(na === nb) return true;
    return variants(b).indexOf(na) > -1 && variants(a).indexOf(nb) > -1;
  }
  /* -> { ok, exact, near: other label when the answer names something else,
          side: true when only a side or position word is missing or wrong } */
  function grade(answer, lab){
    var key = norm(answer);
    if(!key) return { ok: false, empty: true };
    var mine = variants(lab);
    if(mine.indexOf(key) > -1) return { ok: true, exact: true };
    var others = ALLNAMES.filter(function(o){ return !same(o.lab, lab); });
    for(var i = 0; i < others.length; i++) if(others[i].key === key) return { ok: false, near: others[i].lab };
    var best = 99, bestKey = '';
    mine.forEach(function(k){ var d = dist(key, k); if(d < best){ best = d; bestKey = k; } });
    var bestOther = 99, otherLab = null;
    others.forEach(function(o){ var d = dist(key, o.key); if(d < bestOther){ bestOther = d; otherLab = o.lab; } });
    var qa = quals(key), qm = quals(bestKey);
    if(best <= tol(bestKey) && best < bestOther && qa === qm) return { ok: true, exact: false };
    // Right structure, wrong or missing side: say so specifically.
    var stripped = function(k){ return k.split(' ').filter(function(w){ return QUAL.indexOf(w) < 0; }).join(' '); };
    var ks = stripped(key);
    if(ks && mine.some(function(k){ var s = stripped(k); return s && s !== k && dist(ks, s) <= tol(s); })) return { ok: false, side: true };
    if(bestOther <= tol(otherLab ? norm(otherLab.name) : '') && bestOther < best) return { ok: false, near: otherLab };
    return { ok: false };
  }
  function hintOf(name){
    return String(name).replace(/\([^)]*\)/g, '').trim().split(/\s+/).map(function(w){
      return w.charAt(0) + w.slice(1).replace(/[A-Za-z]/g, '_');
    }).join('   ');
  }

  /* --------------------------------------------------------------- data */
  function index(){
    DATA.sets.forEach(function(s){
      SETS[s.id] = s;
      s.stations.forEach(function(st){
        st.set = s;
        st.fig = DATA.figures[st.figure];
        st.labels.forEach(function(lab){
          var it = { set: s, st: st, lab: lab, id: KIND + ':' + s.id + ':' + st.figure + ':' + lab.id };
          lab.item = it;
          ITEMS.push(it); ITEM[it.id] = it;
          variants(lab).forEach(function(k){ ALLNAMES.push({ key: k, lab: lab }); });
        });
      });
    });
  }
  function setItems(s){ return ITEMS.filter(function(it){ return it.set === s; }); }
  function chaptersInData(){
    var seen = [], out = [];
    DATA.sets.forEach(function(s){ if(seen.indexOf(s.chapter) < 0){ seen.push(s.chapter); out.push(s.chapter); } });
    return out;
  }
  function missedItems(){
    var c = core();
    if(!c) return [];
    var ids = c.missed().concat(c.reviewQueue());
    var out = [];
    ids.forEach(function(id){
      var base = id.replace(/:follow$/, '');
      var it = ITEM[base];
      if(it && out.indexOf(it) < 0) out.push(it);
    });
    return out;
  }

  /* Record one scored answer: XP, mastery, review, dashboard, analytics. */
  function score(it, correct, follow){
    var id = follow ? it.id + ':follow' : it.id;
    var st = it.st;
    if(core()) core().toolResult(KIND, [{ id: id, correct: !!correct, topic: st.topic, core: st.core,
      level: follow ? (it.lab.follow.level || 'apply') : 'recall', diff: follow ? 2 : 1, group: it.set.chapter }]);
    if(!follow && core()) core().event('anp-lab-station', { set: it.set.id, correct: !!correct });
  }

  /* ------------------------------------------------------------- figure
     The image with its boxes, positioned in percent of the image so they
     scale with it on any screen. opts:
       mode     'explore' | 'study' | 'name' | 'point' | 'show'
       target   the label being asked (name, show)
       reveal   label ids shown uncovered in study mode
       result   { pick, right } after a point answer
       zoom     1..3 (scrolls inside its own box) */
  function pct(v, of){ return (100 * v / of).toFixed(3) + '%'; }
  function at(b, f){ return 'left:' + pct(b[0], f.w) + ';top:' + pct(b[1], f.h) + ';width:' + pct(b[2], f.w) + ';height:' + pct(b[3], f.h); }
  function credit(f){
    return '<p class="lp-credit">' + esc(f.credit) + ', <a href="' + esc(f.page) + '" rel="noopener">openstax.org</a>, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener license">CC BY 4.0</a>.</p>';
  }
  function figureHtml(st, opts){
    var f = st.fig, mode = opts.mode, z = opts.zoom || 1;
    // covered: later concepts, painted over in every mode. hints: row or
    // column headings that would give an answer away, painted over while
    // being tested (quiz, practical and their review) but shown to study.
    var testing = mode === 'name' || mode === 'point' || mode === 'show';
    var covers = (st.covered || []).concat(testing ? st.hints || [] : []).map(function(c){ return '<span class="lp-cover" aria-hidden="true" style="' + at(c.box, f) + '"></span>'; }).join('');
    var boxes = st.labels.map(function(lab){
      var style = at(lab.box, f), dl = ' data-label="' + esc(lab.id) + '"';
      if(mode === 'explore') return '<button type="button" class="lp-box lp-open' + (opts.pick === lab ? ' is-picked' : '') + '"' + dl + ' style="' + style + '" aria-label="' + esc(lab.name) + '"></button>';
      if(mode === 'study'){
        var shown = (opts.reveal || {})[lab.id];
        return '<button type="button" class="lp-box lp-mask' + (shown ? ' is-shown' : '') + '"' + dl + ' style="' + style + '" aria-pressed="' + (shown ? 'true' : 'false') + '" aria-label="' + (shown ? esc(lab.name) + '. Select to hide.' : 'Hidden label. Select to reveal.') + '"></button>';
      }
      if(mode === 'name'){
        if(lab === opts.target) return '<button type="button" class="lp-box lp-mask is-target"' + dl + ' style="' + style + '" aria-label="The highlighted structure. Type its name below."><span aria-hidden="true">?</span></button>';
        return '<span class="lp-box lp-mask is-still" aria-hidden="true" style="' + style + '"></span>';
      }
      if(mode === 'point'){
        var r = opts.result, cls = '';
        if(r){
          if(same(lab, r.right)) cls = ' is-right';
          else if(r.pick === lab) cls = ' is-wrong';
        }
        return '<button type="button" class="lp-box lp-mask' + cls + '"' + dl + ' style="' + style + '"' + (r ? ' disabled' : '') + ' aria-label="Hidden label ' + (st.labels.indexOf(lab) + 1) + (cls === ' is-right' ? ': ' + esc(lab.name) : cls === ' is-wrong' ? ': ' + esc(lab.name) + ', your pick' : '') + '"></button>';
      }
      if(mode === 'show'){
        // results: the asked label shows, every other asked label is masked
        if(lab === opts.target) return '<span class="lp-box is-answer" aria-hidden="true" style="' + style + '"></span>';
        return '<span class="lp-box lp-mask is-still" aria-hidden="true" style="' + style + '"></span>';
      }
      return '';
    }).join('');
    var ratio = (f.w / f.h).toFixed(4);
    var zoomBar = opts.noZoom ? '' : '<div class="lp-zoom" role="group" aria-label="Zoom the figure">' +
      '<button type="button" class="lp-zbtn" data-z="-1" aria-label="Zoom out"' + (z <= 1 ? ' disabled' : '') + '>&minus;</button>' +
      '<span class="lp-zval" aria-live="polite">' + Math.round(z * 100) + '%</span>' +
      '<button type="button" class="lp-zbtn" data-z="1" aria-label="Zoom in"' + (z >= 3 ? ' disabled' : '') + '>+</button></div>';
    return '<figure class="lp-figure">' + zoomBar +
      '<div class="lp-scroll' + (z > 1 ? ' is-zoomed' : '') + '"><div class="lp-fig" style="--lp-ratio:' + ratio + ';--lp-z:' + z + '">' +
      '<img src="' + esc(BASE + f.src) + '" alt="' + esc(f.alt) + '" width="' + f.w + '" height="' + f.h + '" decoding="async">' +
      covers + boxes + '</div></div><figcaption>' + credit(f) + '</figcaption></figure>';
  }
  /* Wires the zoom buttons of a figure rendered into host; redraw(z) repaints. */
  function wireZoom(host, get, set){
    host.querySelectorAll('.lp-zbtn').forEach(function(b){
      b.addEventListener('click', function(){
        var z = get(), steps = [1, 1.5, 2, 3], k = steps.indexOf(z);
        k = Math.max(0, Math.min(steps.length - 1, k + (+b.getAttribute('data-z'))));
        set(steps[k]);
        var nb = host.querySelector('.lp-zbtn[data-z="' + b.getAttribute('data-z') + '"]');
        if(nb && !nb.disabled) nb.focus(); else { var o = host.querySelector('.lp-zbtn:not([disabled])'); if(o) o.focus(); }
      });
    });
  }
  function scrollToBox(host, lab){
    var sc = host.querySelector('.lp-scroll.is-zoomed');
    var el = host.querySelector('.lp-box[data-label="' + lab.id + '"]');
    if(!sc || !el) return;
    sc.scrollLeft = Math.max(0, el.offsetLeft - sc.clientWidth / 2 + el.offsetWidth / 2);
    sc.scrollTop = Math.max(0, el.offsetTop - sc.clientHeight / 2 + el.offsetHeight / 2);
  }

  /* ---------------------------------------------------------------- shell */
  var MODES = [
    { key: 'explore', label: 'Explore', blurb: 'Labels shown. Tap any structure to see what it is, what it does and where it is taught.' },
    { key: 'study', label: 'Study', blurb: 'Labels hidden. Tap a mask to reveal its label, at your own pace.' },
    { key: 'quiz', label: 'Quiz', blurb: 'Name the highlighted structure, or point to a named one. Scored, with hints and a retry round.' },
    { key: 'practical', label: 'Timed practical', blurb: 'A bell-ringer practical: fixed stations, a timer at each, no going back, full review at the end.' }
  ];
  function modeTabs(active, setId){
    return '<nav class="lp-modes" aria-label="Mode">' + MODES.map(function(m){
      if(setId && m.key === 'practical') return '';
      var href = m.key === 'practical' ? '#practical' : setId ? '#' + m.key + '/' + setId : '#' + m.key;
      return '<a class="lp-mode" href="' + href + '"' + (m.key === active ? ' aria-current="true"' : '') + '>' + esc(m.label) + '</a>';
    }).join('') + '</nav>';
  }
  function paint(html){
    stopTimer();
    app.innerHTML = '<div class="lp">' + html + '</div>';
    app.classList.add('is-ready');
  }

  /* ---------------------------------------------------------------- routing
     #<mode>                 set list for that mode
     #<mode>/<set>[/<n>]     a set in explore, study or quiz (n = station)
     #practical              build a timed practical
     #review                 quiz the structures you missed */
  function route(){
    var h = decodeURIComponent((location.hash || '').replace(/^#/, '')).split('/');
    var mode = /^(explore|study|quiz|practical|review)$/.test(h[0]) ? h[0] : '';
    if(mode === 'practical') return showSetup();
    if(mode === 'review') return startQuiz(null, missedItems(), 'Your missed structures');
    var s = h[1] && SETS[h[1]];
    if(s && mode){
      var n = Math.max(0, Math.min(s.stations.length - 1, (parseInt(h[2], 10) || 1) - 1));
      if(mode === 'explore') return showExplore(s, n, 'explore');
      if(mode === 'study') return showExplore(s, n, 'study');
      return startQuiz(s, null);
    }
    showHome(mode || pref('mode', 'explore'));
  }

  /* ------------------------------------------------------------------ home */
  function showHome(mode){
    setPref('mode', mode);
    var chapters = chaptersInData();
    var q = (location.search.match(/[?&]chapter=([\w-]+)/) || [])[1];
    var filt = pref('chapter', '');
    if(q && chapters.indexOf(q) > -1) filt = q;
    var m = MODES.filter(function(x){ return x.key === mode; })[0] || MODES[0];
    if(mode === 'practical') return showSetup();
    var missed = missedItems();
    var html = modeTabs(mode) + '<p class="lp-lead">' + esc(m.blurb) + '</p>' +
      (missed.length ? '<p class="lp-review"><a class="btn-outline" href="#review">Quiz my missed structures (' + missed.length + ')</a></p>' : '') +
      '<div class="lp-chips" role="group" aria-label="Filter by chapter"><button type="button" class="lp-chip" data-ch="" aria-pressed="' + (!filt) + '">All</button>' +
      chapters.map(function(c){ return '<button type="button" class="lp-chip" data-ch="' + esc(c) + '" aria-pressed="' + (filt === c) + '">' + esc(chapterTitle(c)) + '</button>'; }).join('') + '</div>' +
      chapters.filter(function(c){ return !filt || c === filt; }).map(function(c){
        return '<h2 class="lp-ch">' + esc(chapterTitle(c)) + '</h2><ul class="lp-cards">' + DATA.sets.filter(function(s){ return s.chapter === c; }).map(function(s){
          var its = setItems(s), right = 0, missedN = 0;
          its.forEach(function(it){ var x = status(it.id); if(x === 'right') right++; else if(x === 'missed') missedN++; });
          var t = topicInfo(s.topic);
          return '<li><a class="lp-card" href="#' + mode + '/' + esc(s.id) + '">' +
            '<span class="lp-card-title">' + esc(s.title) + (s.histology ? ' <span class="lp-tag">Histology</span>' : '') + '</span>' +
            '<span class="lp-card-meta">' + its.length + ' structures on ' + s.stations.length + ' figure' + (s.stations.length > 1 ? 's' : '') + (t ? ' · ' + esc(t.title) : '') + '</span>' +
            '<span class="lp-meter" role="img" aria-label="' + right + ' of ' + its.length + ' named right' + (missedN ? ', ' + missedN + ' missed' : '') + '"><span class="lp-meter-ok" style="width:' + (its.length ? 100 * right / its.length : 0) + '%"></span><span class="lp-meter-no" style="width:' + (its.length ? 100 * missedN / its.length : 0) + '%"></span></span>' +
            '</a></li>';
        }).join('') + '</ul>';
      }).join('');
    paint(html);
    app.querySelectorAll('.lp-chip').forEach(function(b){
      b.addEventListener('click', function(){ setPref('chapter', b.getAttribute('data-ch')); showHome(mode); var nb = app.querySelector('.lp-chip[data-ch="' + b.getAttribute('data-ch') + '"]'); if(nb) nb.focus(); });
    });
    document.title = 'Virtual lab practical | Anatomy & Physiology';
  }

  function setHeader(s, mode){
    return '<p class="lp-back"><a href="#' + mode + '">&larr; All image sets</a></p>' +
      '<h2 class="lp-title" tabindex="-1">' + esc(s.title) + '</h2>' +
      '<p class="lp-meta anp-small">' + esc(chapterTitle(s.chapter)) + (topicInfo(s.topic) ? ' · Taught in ' + topicLink(s.topic) : '') + '</p>' +
      modeTabs(mode, s.id);
  }
  function stationTabs(s, n, mode){
    if(s.stations.length < 2) return '';
    return '<nav class="lp-stations" aria-label="Figures in this set">' + s.stations.map(function(st, i){
      return '<a class="lp-st" href="#' + mode + '/' + s.id + '/' + (i + 1) + '"' + (i === n ? ' aria-current="true"' : '') + '>Figure ' + (i + 1) + '<span class="lp-st-sub">' + esc(st.fig.credit.replace(/^.*Figure\s*/, 'OpenStax ')) + '</span></a>';
    }).join('') + '</nav>';
  }
  function infoHtml(lab, st){
    var t = lab.taught && topicInfo(lab.taught);
    return '<p class="lp-info-name">' + esc(lab.name) + '</p>' +
      (lab.fn ? '<p class="lp-info-fn">' + lab.fn + '</p>' : '') +
      (t ? '<p class="anp-small">Taught in ' + topicLink(lab.taught) + '</p>' : '');
  }

  /* --------------------------------------------------------- explore, study */
  function showExplore(s, n, mode){
    var st = s.stations[n], z = 1, reveal = {}, pick = null;
    function draw(){
      var body = setHeader(s, mode) +
        '<p class="lp-lead">' + (mode === 'explore'
          ? 'Every label is a button. Select one to see what the structure is and does.'
          : 'Every label is masked. Select a mask to reveal it, or try naming it first.') + '</p>' +
        stationTabs(s, n, mode) +
        (mode === 'study' ? '<div class="lp-actions"><button type="button" class="btn-outline sm lp-all" data-v="1">Reveal all</button><button type="button" class="btn-outline sm lp-all" data-v="0">Hide all</button><a class="btn-press sm" href="#quiz/' + s.id + '">Quiz me on this set</a></div>' : '') +
        '<div class="lp-stage">' + figureHtml(st, { mode: mode, reveal: reveal, zoom: z, pick: pick }) +
        '<div class="lp-info" aria-live="polite">' + (pick ? infoHtml(pick, st) : '<p class="anp-small">' + (mode === 'explore' ? 'Select a label on the figure.' : 'Revealed labels are explained here.') + '</p>') + '</div></div>' +
        (n + 1 < s.stations.length ? '<p class="lp-next"><a class="btn-outline" href="#' + mode + '/' + s.id + '/' + (n + 2) + '">Next figure &rarr;</a></p>' : '');
      paint(body);
      wireZoom(app, function(){ return z; }, function(v){ z = v; draw(); });
      app.querySelectorAll('.lp-box').forEach(function(b){
        b.addEventListener('click', function(){
          var id = b.getAttribute('data-label');
          var lab = st.labels.filter(function(l){ return l.id === id; })[0];
          if(mode === 'study'){ reveal[id] = !reveal[id]; pick = reveal[id] ? lab : pick === lab ? null : pick; }
          else pick = lab;
          draw();
          var nb = app.querySelector('.lp-box[data-label="' + id + '"]'); if(nb) nb.focus();
        });
      });
      app.querySelectorAll('.lp-all').forEach(function(b){
        b.addEventListener('click', function(){
          var v = b.getAttribute('data-v') === '1';
          st.labels.forEach(function(l){ reveal[l.id] = v; });
          pick = null; draw();
          var nb = app.querySelector('.lp-all[data-v="' + (v ? 1 : 0) + '"]'); if(nb) nb.focus();
        });
      });
    }
    draw();
    focusEl(app.querySelector('.lp-title'));
    document.title = s.title + ' | Virtual lab practical';
  }

  /* ------------------------------------------------------------------ quiz */
  function quizPrefs(){
    return { kind: pref('qkind', 'mix'), mc: !!pref('mc', false), follow: pref('qfollow', true) !== false };
  }
  /* A round: every askable structure in the set, figure by figure, each as a
     name-it or point-to item. items (optional) overrides with a given list. */
  function startQuiz(s, items, title){
    var p = quizPrefs();
    var pool = items || setItems(s);
    if(!pool.length){
      paint(modeTabs('quiz') + '<h2 class="lp-title" tabindex="-1">' + esc(title || 'Quiz') + '</h2><p class="lp-lead">Nothing to review right now. Missed structures come back here until you name them right.</p><p><a class="btn-press sm" href="#quiz">Choose an image set</a></p>');
      focusEl(app.querySelector('.lp-title'));
      return;
    }
    var order = [];
    // figure by figure keeps one image on screen for a run of items
    var byStation = [];
    pool.forEach(function(it){ if(byStation.indexOf(it.st) < 0) byStation.push(it.st); });
    byStation.forEach(function(st){ shuffle(pool.filter(function(it){ return it.st === st; })).forEach(function(it){ order.push(it); }); });
    var run = order.map(function(it, k){
      var kind = p.kind === 'mix' ? (Math.random() < 0.35 && pointable(it) ? 'point' : 'name') : p.kind === 'point' && pointable(it) ? 'point' : 'name';
      return { it: it, kind: kind };
    });
    quizLoop(s, run, title, p);
  }
  function pointable(it){ return it.st.labels.length >= 3; }

  function choicesFor(it){
    var lab = it.lab, out = [lab.name];
    var from = it.st.labels.concat(setItems(it.set).map(function(x){ return x.lab; }), ITEMS.filter(function(x){ return x.set.chapter === it.set.chapter; }).map(function(x){ return x.lab; }));
    shuffle(from.slice(0, it.st.labels.length)).concat(from.slice(it.st.labels.length)).forEach(function(l){
      if(out.length >= 4) return;
      if(same(l, lab)) return;
      if(out.some(function(n){ return norm(n) === norm(l.name); })) return;
      out.push(l.name);
    });
    return shuffle(out);
  }

  function quizLoop(s, run, title, p){
    var k = 0, z = 1, right = 0, results = [];
    function header(){
      return (s ? setHeader(s, 'quiz') : modeTabs('quiz') + '<h2 class="lp-title" tabindex="-1">' + esc(title) + '</h2>') +
        '<details class="lp-settings-d"' + (pref('qopen', false) ? ' open' : '') + '><summary>Quiz settings: ' + esc(p.kind === 'mix' ? 'name it and point to' : p.kind === 'name' ? 'name it only' : 'point to only') + (p.mc ? ', multiple choice' : ', typed answers') + '</summary><div class="lp-settings" role="group" aria-label="Quiz settings">' +
        '<label class="anp-filter">Ask <select class="lp-set-kind"><option value="mix"' + (p.kind === 'mix' ? ' selected' : '') + '>Name it and point to</option><option value="name"' + (p.kind === 'name' ? ' selected' : '') + '>Name it only</option><option value="point"' + (p.kind === 'point' ? ' selected' : '') + '>Point to only</option></select></label>' +
        '<label class="lp-check"><input type="checkbox" class="lp-set-mc"' + (p.mc ? ' checked' : '') + '> Multiple choice instead of typing (beginner)</label>' +
        '</div></details>';
    }
    function wireSettings(){
      var ks = app.querySelector('.lp-set-kind'), mc = app.querySelector('.lp-set-mc'), dd = app.querySelector('.lp-settings-d');
      if(dd) dd.addEventListener('toggle', function(){ setPref('qopen', dd.open); });
      if(ks) ks.addEventListener('change', function(){ setPref('qkind', ks.value); var pool = run.map(function(r){ return r.it; }); startQuiz(s, pool, title); });
      if(mc) mc.addEventListener('change', function(){ setPref('mc', mc.checked); p.mc = mc.checked; step(true); });
    }
    function step(keepFocus){
      if(k >= run.length) return summary();
      var r = run[k], it = r.it, st = it.st, answered = null, hinted = false, choices = p.mc ? choicesFor(it) : null;
      function draw(){
        var prompt, body = '';
        if(r.kind === 'point'){
          prompt = 'Point to: <b>' + esc(it.lab.name) + '</b>';
        } else prompt = 'Name the highlighted structure.';
        var fig = figureHtml(st, r.kind === 'point'
          ? { mode: 'point', zoom: z, result: answered ? { pick: answered.pick, right: it.lab } : null }
          : { mode: answered ? 'show' : 'name', target: it.lab, zoom: z });
        if(r.kind === 'name' && !answered){
          body = p.mc
            ? '<div class="anp-opt-btns lp-mc" role="group" aria-label="Choose the name">' + choices.map(function(c){ return '<button type="button" class="anp-opt" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>'
            : '<form class="lp-answer" autocomplete="off"><label class="lp-label" for="lp-in">Your answer</label><div class="lp-row"><input id="lp-in" class="lp-input" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="done"><button type="submit" class="btn-press sm">Check</button></div>' +
              '<div class="lp-row lp-sub"><button type="button" class="lp-link lp-hint"' + (hinted ? ' disabled' : '') + '>Hint</button><button type="button" class="lp-link lp-idk">I don\'t know</button></div>' +
              (hinted ? '<p class="lp-hinttext" aria-live="polite">Starts: <span class="lp-mono">' + esc(hintOf(it.lab.name)) + '</span></p>' : '') + '</form>';
        }
        if(r.kind === 'point' && !answered) body = '<p class="anp-small">Select the mask that covers this label. On a small screen, zoom in first. <button type="button" class="lp-link lp-idk">I don\'t know</button></p>';
        var fb = answered ? feedbackHtml(it, answered) : '';
        paint(header() +
          '<div class="lp-progress"><span class="anp-small">Item ' + (k + 1) + ' of ' + run.length + ' · ' + right + ' right</span><span class="lp-bar"><span style="width:' + (100 * k / run.length) + '%"></span></span></div>' +
          '<p class="lp-prompt" id="lp-prompt">' + prompt + '</p>' +
          '<div class="lp-stage">' + fig + '</div>' +
          (!answered ? body : '') +
          '<div class="lp-feedback" aria-live="polite">' + fb + '</div>');
        wireSettings();
        wireZoom(app, function(){ return z; }, function(v){ z = v; draw(); if(r.kind === 'name') scrollToBox(app, it.lab); });
        if(r.kind === 'name') scrollToBox(app, it.lab);
        var form = app.querySelector('.lp-answer');
        if(form){
          var inp = form.querySelector('.lp-input');
          form.addEventListener('submit', function(e){ e.preventDefault(); if(!inp.value.trim()) { inp.focus(); return; } submit(grade(inp.value, it.lab), inp.value); });
          form.querySelector('.lp-hint').addEventListener('click', function(){ var v = inp.value; hinted = true; draw(); var i2 = app.querySelector('.lp-input'); if(i2){ i2.value = v; i2.focus(); } });
          form.querySelector('.lp-idk').addEventListener('click', function(){ submit({ ok: false, gaveUp: true }, ''); });
          var tb = app.querySelector('.lp-box.is-target'); if(tb) tb.addEventListener('click', function(){ inp.focus(); });
        }
        app.querySelectorAll('.lp-mc .anp-opt').forEach(function(b){
          b.addEventListener('click', function(){ var c = b.getAttribute('data-c'); submit({ ok: norm(c) === norm(it.lab.name), exact: true }, c); });
        });
        if(r.kind === 'point' && !answered){
          app.querySelectorAll('.lp-box').forEach(function(b){
            b.addEventListener('click', function(){
              var lab = st.labels.filter(function(l){ return l.id === b.getAttribute('data-label'); })[0];
              submit({ ok: same(lab, it.lab), pick: lab }, lab.name);
            });
          });
          var idk = app.querySelector('.lp-idk'); if(idk) idk.addEventListener('click', function(){ submit({ ok: false, gaveUp: true, pick: null }, ''); });
        }
        wireFeedback();
      }
      function submit(g, typed){
        answered = g; answered.typed = typed; answered.hinted = hinted && g.ok;
        var ok = g.ok && !hinted;
        if(ok) right++;
        score(it, ok, false);
        results.push({ it: it, kind: r.kind, ok: ok, g: g });
        if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(ok); }catch(e){}
        draw();
        focusEl(app.querySelector('.lp-verdict'));
      }
      function wireFeedback(){
        var nx = app.querySelector('.lp-nextbtn');
        if(nx) nx.addEventListener('click', function(){ k++; step(); });
        wireFollow(app, it, !answered || !p.follow);
      }
      draw();
      if(!keepFocus) focusEl(app.querySelector('.lp-input') || app.querySelector('.lp-mc .anp-opt') || app.querySelector('.lp-box') || app.querySelector('#lp-prompt'));
      else focusEl(app.querySelector('.lp-set-mc'));
    }
    function feedbackHtml(it, g){
      var lab = it.lab, v;
      if(g.ok && g.hinted) v = '<p class="lp-verdict ok" tabindex="-1"><b>Right, with a hint.</b> It stays in your review queue until you name it without one.</p>';
      else if(g.ok && g.exact) v = '<p class="lp-verdict ok" tabindex="-1"><b>Correct:</b> ' + esc(lab.name) + '.</p>';
      else if(g.ok) v = '<p class="lp-verdict ok" tabindex="-1"><b>Accepted.</b> Spelling: <b>' + esc(lab.name) + '</b>.</p>';
      else {
        var why = g.gaveUp ? '' : g.side ? ' Right structure, but the side or position word is missing or wrong.' : g.near ? ' “' + esc(g.typed || '') + '” names a different structure: ' + esc(g.near.name) + '.' : g.pick ? ' That mask covers <b>' + esc(g.pick.name) + '</b>.' : '';
        v = '<p class="lp-verdict no" tabindex="-1"><b>Not quite.</b> It is <b>' + esc(lab.name) + '</b>.' + why + '</p>';
      }
      return v + (lab.fn ? '<p class="lp-fn">' + lab.fn + '</p>' : '') +
        (lab.taught && topicInfo(lab.taught) ? '<p class="anp-small">Taught in ' + topicLink(lab.taught) + '</p>' : '') +
        (!g.ok || g.hinted ? '<p class="anp-small">Added to your review queue.</p>' : '') +
        (lab.follow && p.follow ? '<div class="lp-follow" data-follow></div>' : '') +
        '<div class="lp-actions"><button type="button" class="btn-press sm lp-nextbtn">' + (k + 1 < run.length ? 'Next' : 'See results') + '</button>' + report(it.id) + '</div>';
    }
    function summary(){
      var byStruct = results.filter(function(x){ return !x.ok; });
      var html = (s ? setHeader(s, 'quiz') : modeTabs('quiz') + '<h2 class="lp-title" tabindex="-1">' + esc(title) + '</h2>') +
        '<div class="lp-score" tabindex="-1"><span class="lp-score-n">' + right + ' / ' + results.length + '</span><span class="anp-small">named right on the first try</span></div>' +
        breakdown(results) +
        (byStruct.length ? '<h3>To review</h3><ul class="lp-misslist">' + byStruct.map(function(x){ return '<li><b>' + esc(x.it.lab.name) + '</b> <span class="anp-small">' + esc(x.it.set.title) + '</span></li>'; }).join('') + '</ul>' : '<p class="lp-lead">Every structure named. Try the timed practical next.</p>') +
        '<div class="lp-actions">' + (byStruct.length ? '<button type="button" class="btn-press sm lp-retry">Retry the ' + byStruct.length + ' missed</button>' : '') +
        (s ? '<a class="btn-outline" href="#quiz/' + s.id + '" data-again>New round</a>' : '') + '<a class="btn-outline" href="#practical">Timed practical</a></div>';
      paint(html);
      var rb = app.querySelector('.lp-retry');
      if(rb) rb.addEventListener('click', function(){ startQuiz(s, byStruct.map(function(x){ return x.it; }), s ? s.title + ': missed' : title); });
      var ag = app.querySelector('[data-again]');
      if(ag) ag.addEventListener('click', function(e){ e.preventDefault(); startQuiz(s, null); });
      focusEl(app.querySelector('.lp-score'));
    }
    step(true);
    focusEl(app.querySelector('.lp-title'));
    if(s) document.title = s.title + ' quiz | Virtual lab practical';
  }

  /* The follow-up question (function, what attaches, what passes through):
     multiple choice, scored as its own item. In the quiz it appears under the
     feedback; in the practical it is part (b) of the station. */
  function followHtml(lab, picked, reveal){
    var f = lab.follow;
    return '<p class="lp-fq"><span class="lp-fq-tag">Follow-up</span> ' + f.q + '</p><div class="anp-opt-btns" role="group" aria-label="Follow-up answers">' +
      f.order.map(function(i){
        var cls = '';
        if(reveal){ if(i === f.correct) cls = ' is-right'; else if(i === picked) cls = ' is-wrong'; }
        else if(i === picked) cls = '" aria-pressed="true';
        return '<button type="button" class="anp-opt' + cls + '" data-i="' + i + '"' + (reveal ? ' disabled' : '') + '>' + f.options[i] + '</button>';
      }).join('') + '</div>' +
      (reveal ? '<p class="lp-fn"><b class="' + (picked === f.correct ? 'ok' : 'no') + '">' + (picked === f.correct ? 'Correct.' : picked == null ? 'Not answered.' : 'Not quite.') + '</b> ' + f.why + '</p>' : '');
  }
  function wireFollow(host, it, skip){
    var box = host.querySelector('[data-follow]');
    if(!box || skip) return;
    var f = it.lab.follow;
    if(!f.order) f.order = shuffle(f.options.map(function(o, i){ return i; }));
    box.innerHTML = followHtml(it.lab, null, false);
    box.querySelectorAll('.anp-opt').forEach(function(b){
      b.addEventListener('click', function(){
        var i = +b.getAttribute('data-i');
        score(it, i === f.correct, true);
        box.innerHTML = followHtml(it.lab, i, true) + '<div class="lp-actions">' + report(it.id + ':follow') + '</div>';
        var nx = host.querySelector('.lp-nextbtn'); if(nx) nx.focus();
      });
    });
  }

  function breakdown(results){
    function rows(keyOf, labelOf){
      var g = {}, order = [];
      results.forEach(function(x){ var key = keyOf(x); if(!g[key]){ g[key] = { n: 0, c: 0 }; order.push(key); } g[key].n++; if(x.ok) g[key].c++; });
      return order.map(function(key){
        var v = g[key];
        return '<tr><th scope="row">' + esc(labelOf(key)) + '</th><td>' + v.c + ' / ' + v.n + '</td><td><span class="lp-bar sm"><span style="width:' + (100 * v.c / v.n) + '%"></span></span></td></tr>';
      }).join('');
    }
    return '<div class="lp-break"><table class="lp-table"><caption>By system</caption><tbody>' +
      rows(function(x){ return x.it.set.chapter; }, chapterTitle) + '</tbody></table>' +
      '<table class="lp-table"><caption>By image set</caption><tbody>' +
      rows(function(x){ return x.it.set.id; }, function(id){ return SETS[id].title; }) + '</tbody></table></div>';
  }

  /* ------------------------------------------------------------- practical */
  var TIMES = [30, 45, 60, 90, 120, 0];
  var COUNTS = [10, 20, 30, 40];
  function showSetup(){
    setPref('mode', 'practical');
    var chosen = pref('psets', null) || DATA.sets.map(function(s){ return s.id; });
    var chapters = chaptersInData();
    var t = pref('ptime', 60), n = pref('pcount', 20), kind = pref('pkind', 'mix'), fol = pref('pfollow', true) !== false;
    var html = modeTabs('practical') +
      '<p class="lp-lead">Build a practical to match your class: choose the systems or image sets, the number of stations and the time at each. Like a real bell-ringer, you cannot go back to a station once you move on.</p>' +
      '<form class="lp-setup">' +
      '<fieldset class="lp-fs"><legend>Image sets</legend>' + chapters.map(function(c){
        var ss = DATA.sets.filter(function(s){ return s.chapter === c; });
        var all = ss.every(function(s){ return chosen.indexOf(s.id) > -1; });
        return '<div class="lp-group"><label class="lp-check lp-check-ch"><input type="checkbox" data-ch="' + esc(c) + '"' + (all ? ' checked' : '') + '> <b>' + esc(chapterTitle(c)) + '</b></label><div class="lp-group-sets">' +
          ss.map(function(s){ return '<label class="lp-check"><input type="checkbox" name="set" value="' + esc(s.id) + '"' + (chosen.indexOf(s.id) > -1 ? ' checked' : '') + '> ' + esc(s.title) + ' <span class="anp-small">(' + setItems(s).length + ')</span></label>'; }).join('') + '</div></div>';
      }).join('') + '</fieldset>' +
      '<div class="lp-opts">' +
      '<label class="anp-filter">Stations <select name="count">' + COUNTS.map(function(c){ return '<option value="' + c + '"' + (c === n ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label class="anp-filter">Time per station <select name="time">' + TIMES.map(function(c){ return '<option value="' + c + '"' + (c === t ? ' selected' : '') + '>' + (c ? c + ' seconds' : 'No timer') + '</option>'; }).join('') + '</select></label>' +
      '<label class="anp-filter">Stations ask <select name="kind"><option value="mix"' + (kind === 'mix' ? ' selected' : '') + '>Name it and point to</option><option value="name"' + (kind === 'name' ? ' selected' : '') + '>Name it only</option></select></label>' +
      '<label class="anp-filter"><input type="checkbox" name="follow"' + (fol ? ' checked' : '') + '> Include follow-up questions</label>' +
      '</div><p class="lp-est anp-small" aria-live="polite"></p>' +
      '<p><button type="submit" class="btn-press">Start the practical</button></p></form>';
    paint(html);
    var form = app.querySelector('.lp-setup');
    function picked(){ return [].slice.call(form.querySelectorAll('input[name="set"]:checked')).map(function(i){ return i.value; }); }
    function est(){
      var ids = picked(), pool = ITEMS.filter(function(it){ return ids.indexOf(it.set.id) > -1; }).length;
      var c = Math.min(+form.count.value, pool), tm = +form.time.value;
      form.querySelector('.lp-est').textContent = !ids.length ? 'Choose at least one image set.' :
        c + ' stations from ' + pool + ' structures' + (c < +form.count.value ? ' (all there are in these sets)' : '') + (tm ? ', about ' + Math.ceil(c * tm / 60) + ' minutes.' : ', untimed.');
      form.querySelector('button[type="submit"]').disabled = !ids.length;
    }
    form.querySelectorAll('input[data-ch]').forEach(function(cb){
      cb.addEventListener('change', function(){
        form.querySelectorAll('input[name="set"]').forEach(function(i){ if(SETS[i.value].chapter === cb.getAttribute('data-ch')) i.checked = cb.checked; });
        est();
      });
    });
    form.querySelectorAll('input[name="set"]').forEach(function(i){
      i.addEventListener('change', function(){
        var c = SETS[i.value].chapter, all = [].slice.call(form.querySelectorAll('input[name="set"]')).filter(function(x){ return SETS[x.value].chapter === c; });
        form.querySelector('input[data-ch="' + c + '"]').checked = all.every(function(x){ return x.checked; });
        est();
      });
    });
    form.count.addEventListener('change', est); form.time.addEventListener('change', est);
    est();
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var ids = picked();
      if(!ids.length) return;
      setPref('psets', ids); setPref('ptime', +form.time.value); setPref('pcount', +form.count.value); setPref('pkind', form.kind.value); setPref('pfollow', form.follow.checked);
      if(core() && !core().allowed('lab-timed-practical')) return;
      runPractical(buildPractical(ids, +form.count.value, form.kind.value, form.follow.checked), +form.time.value);
    });
    focusEl(app.querySelector('.lp-mode[aria-current="true"]'));
    document.title = 'Timed lab practical | Anatomy & Physiology';
  }

  /* Stations are drawn round-robin across the chosen sets, so a 20-station
     practical over four sets gives each about five; the same structure never
     appears twice. */
  function buildPractical(ids, count, kind, follow){
    var pools = ids.map(function(id){ return shuffle(setItems(SETS[id])); }).filter(function(p){ return p.length; });
    var out = [], used = [];
    while(out.length < count && pools.some(function(p){ return p.length; })){
      pools = shuffle(pools);
      pools.forEach(function(p){
        while(out.length < count && p.length){
          var it = p.shift();
          if(used.some(function(l){ return same(l, it.lab); })) continue;
          used.push(it.lab);
          var k = kind === 'mix' && Math.random() < 0.3 && pointable(it) ? 'point' : 'name';
          out.push({ it: it, kind: k, follow: follow && !!it.lab.follow });
          break;
        }
      });
    }
    return shuffle(out);
  }

  function runPractical(stations, secs){
    var k = 0, z = 1;
    function station(){
      if(k >= stations.length) return finish();
      var S = stations[k], it = S.it, st = it.st, pick = null, fpick = null, ends = secs ? Date.now() + secs * 1000 : 0, done = false;
      if(S.follow && !it.lab.follow.order) it.lab.follow.order = shuffle(it.lab.follow.options.map(function(o, i){ return i; }));
      function draw(){
        var typed = app.querySelector('.lp-input') ? app.querySelector('.lp-input').value : '';
        paint('<div class="lp-run-head"><span class="lp-run-n">Station ' + (k + 1) + ' of ' + stations.length + '</span>' +
          (secs ? '<span class="lp-timer" role="timer" aria-live="off"><span class="lp-timer-t">' + secs + '</span> s</span>' : '<span class="anp-small">Untimed</span>') + '</div>' +
          (secs ? '<span class="lp-bar lp-timebar"><span></span></span>' : '') +
          '<p class="lp-prompt">' + (S.kind === 'point' ? '<span class="lp-part">(a)</span> Point to: <b>' + esc(it.lab.name) + '</b>' + (pick ? ' <span class="anp-small">Your pick is marked.</span>' : '') : '<span class="lp-part">(a)</span> Name the highlighted structure.') + '</p>' +
          '<div class="lp-stage">' + figureHtml(st, S.kind === 'point' ? { mode: 'point', zoom: z } : { mode: 'name', target: it.lab, zoom: z }) + '</div>' +
          (S.kind === 'name' ? '<form class="lp-answer" autocomplete="off"><label class="lp-label" for="lp-in">Your answer</label><div class="lp-row"><input id="lp-in" class="lp-input" type="text" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next"></div></form>' : '') +
          (S.follow ? '<div class="lp-follow"><p class="lp-fq"><span class="lp-part">(b)</span> ' + it.lab.follow.q + '</p><div class="anp-opt-btns" role="group" aria-label="Part b answers">' +
            it.lab.follow.order.map(function(i){ return '<button type="button" class="anp-opt" data-i="' + i + '" aria-pressed="' + (fpick === i) + '">' + it.lab.follow.options[i] + '</button>'; }).join('') + '</div></div>' : '') +
          '<div class="lp-actions"><button type="button" class="btn-press sm lp-go">' + (k + 1 < stations.length ? 'Next station' : 'Finish') + ' &rarr;</button><span class="anp-small">No going back.</span></div>');
        var inp = app.querySelector('.lp-input');
        if(inp){ inp.value = typed; }
        if(S.kind === 'name') scrollToBox(app, it.lab);
        if(S.kind === 'point'){
          app.querySelectorAll('.lp-box').forEach(function(b){
            var lab = st.labels.filter(function(l){ return l.id === b.getAttribute('data-label'); })[0];
            if(lab === pick){ b.classList.add('is-picked'); b.setAttribute('aria-pressed', 'true'); } else b.setAttribute('aria-pressed', 'false');
            b.addEventListener('click', function(){ pick = lab; draw(); var nb = app.querySelector('.lp-box[data-label="' + lab.id + '"]'); if(nb) nb.focus(); });
          });
        }
        app.querySelectorAll('.lp-follow .anp-opt').forEach(function(b){
          b.addEventListener('click', function(){ fpick = +b.getAttribute('data-i'); draw(); var nb = app.querySelector('.lp-follow .anp-opt[data-i="' + fpick + '"]'); if(nb) nb.focus(); });
        });
        var form = app.querySelector('.lp-answer');
        if(form) form.addEventListener('submit', function(e){ e.preventDefault(); if(S.follow){ var f = app.querySelector('.lp-follow .anp-opt'); if(f) f.focus(); } else next(); });
        app.querySelector('.lp-go').addEventListener('click', next);
        wireZoom(app, function(){ return z; }, function(v){ z = v; draw(); });
        tick();
        timer = secs ? setInterval(tick, 250) : null;
      }
      function tick(){
        if(!secs || done) return;
        var left = Math.max(0, ends - Date.now()), s = Math.ceil(left / 1000);
        var t = app.querySelector('.lp-timer-t'), bar = app.querySelector('.lp-timebar span'), tm = app.querySelector('.lp-timer');
        if(t && t.textContent !== String(s)) t.textContent = s;
        if(bar) bar.style.width = (100 * left / (secs * 1000)) + '%';
        if(tm){ tm.classList.toggle('is-low', s <= 10); if(s === 10 && !tm.getAttribute('data-warned')){ tm.setAttribute('data-warned', '1'); announce('Ten seconds left.'); } }
        if(left <= 0) next();
      }
      function next(){
        if(done) return;
        done = true; stopTimer();
        var typed = app.querySelector('.lp-input') ? app.querySelector('.lp-input').value : '';
        var g = S.kind === 'point' ? { ok: !!pick && same(pick, it.lab), pick: pick } : grade(typed, it.lab);
        S.typed = typed; S.g = g; S.ok = !!g.ok; S.fpick = fpick;
        score(it, S.ok, false);
        if(S.follow){ S.fok = fpick === it.lab.follow.correct; score(it, S.fok, true); }
        k++; station();
        focusEl(app.querySelector('.lp-input') || app.querySelector('.lp-box') || app.querySelector('.lp-run-n'));
      }
      draw();
    }
    function announce(msg){ var a = document.getElementById('lp-announce'); if(a) a.textContent = msg; }
    function finish(){
      stopTimer();
      var right = stations.filter(function(s){ return s.ok; }).length;
      var fol = stations.filter(function(s){ return s.follow; }), fright = fol.filter(function(s){ return s.fok; }).length;
      if(core()) core().event('anp-practical-finish', { stations: stations.length, correct: right });
      var results = stations.map(function(s){ return { it: s.it, ok: s.ok }; });
      paint('<h2 class="lp-title" tabindex="-1">Practical results</h2>' +
        '<div class="lp-score"><span class="lp-score-n">' + right + ' / ' + stations.length + '</span><span class="anp-small">stations right (' + Math.round(100 * right / stations.length) + '%)' + (fol.length ? ' · follow-ups ' + fright + ' / ' + fol.length : '') + '</span></div>' +
        breakdown(results) +
        (right < stations.length ? '<p class="anp-small">Every missed structure was added to your review queue.</p>' : '') +
        '<div class="lp-actions"><a class="btn-press sm" href="#practical" data-again>New practical</a>' + (right < stations.length ? '<a class="btn-outline" href="#review">Quiz my missed structures</a>' : '') + '</div>' +
        '<h3>Every station</h3><ol class="lp-review-list">' + stations.map(function(s, i){
          var lab = s.it.lab, f = lab.follow;
          var yours = s.kind === 'point' ? (s.g.pick ? 'You pointed to ' + esc(s.g.pick.name) + '.' : 'No box chosen.') : (s.typed ? 'You wrote “' + esc(s.typed) + '”.' : 'No answer.');
          return '<li class="lp-rev ' + (s.ok ? 'is-ok' : 'is-no') + '"><div class="lp-rev-head"><span class="lp-rev-n">' + (i + 1) + '</span><span class="lp-rev-verdict">' + (s.ok ? 'Right' : 'Missed') + '</span><span class="anp-small">' + esc(s.it.set.title) + ' · ' + (s.kind === 'point' ? 'Point to' : 'Name it') + '</span></div>' +
            '<div class="lp-rev-body"><div class="lp-rev-fig">' + figureHtml(s.it.st, { mode: 'show', target: lab, noZoom: true }) + '</div><div class="lp-rev-text">' +
            '<p><b>' + esc(lab.name) + '</b>' + (s.ok && s.g && s.g.exact === false && s.kind === 'name' ? ' <span class="anp-small">(accepted; check the spelling)</span>' : '') + '</p><p class="anp-small">' + yours + '</p>' +
            (lab.fn ? '<p class="lp-fn">' + lab.fn + '</p>' : '') +
            (s.follow ? '<p class="lp-fq"><span class="lp-part">(b)</span> ' + f.q + '</p><p class="lp-fn"><b class="' + (s.fok ? 'ok' : 'no') + '">' + (s.fok ? 'Right.' : 'Missed.') + '</b> Answer: ' + f.options[f.correct] + '. ' + f.why + '</p>' : '') +
            '<div class="lp-actions">' + report(s.it.id) + '</div></div></div></li>';
        }).join('') + '</ol>');
      app.querySelector('[data-again]').addEventListener('click', function(e){ e.preventDefault(); showSetup(); });
      focusEl(app.querySelector('.lp-title'));
    }
    station();
    focusEl(app.querySelector('.lp-input') || app.querySelector('.lp-box') || app.querySelector('.lp-run-n'));
    document.title = 'Timed practical in progress | Anatomy & Physiology';
  }

  /* ------------------------------------------------------------------ boot */
  function boot(){
    fetch(SRC).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
      DATA = d; index();
      var live = document.createElement('p');
      live.id = 'lp-announce'; live.className = 'lp-sr'; live.setAttribute('aria-live', 'assertive');
      app.parentNode.insertBefore(live, app.nextSibling);
      window.addEventListener('hashchange', function(){ booted = true; route(); });
      route();
      booted = true;
    }).catch(function(){
      app.innerHTML = '<p class="lp-error">The lab practical could not load its figures. Check your connection and reload the page.</p>';
      app.classList.add('is-ready');
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
