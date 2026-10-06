/* Glossary popups for every course (docs/course-shell.md, W-A).

   A term the course defines is underlined (.gl, styled in base.css); hover,
   keyboard focus or a tap shows its definition in one popup (.cx-tip) with a
   link to the section that teaches it, so a student who opens chapter 14 cold
   is never stuck on a word from chapter 4.

   Load it with the course's data and root, relative to the page:
     <script src="../../assets/course/glossary-tip.js"
             data-glossary="../assets/glossary.json" data-course-root="../" defer></script>

   Two kinds of marks, one popup:
   - Build time: generators write <a class="gl" data-c="id" href="…"> or
     <span class="gl" tabindex="0" data-c="id"> (A&P, AP Bio).
   - Runtime: window.LevlGlossary.mark(rootEl, { topic }) wraps the first use
     of each term in rootEl, skipping headings, links, buttons, figures, code
     and sub/superscripts, and skipping the terms `topic` teaches (they are
     defined right there). topic may be omitted (NREMT study notes). Any
     element with data-glossary-topic="<topic>" is marked once the page has
     settled; add data-glossary-live and it is marked again whenever its
     content is replaced (the ochem lesson card renders one step at a time).

   Matching (from the ochem popups): an all-lowercase spelling matches in any
   case, and so does a capitalized ordinary word ("Ambulatory"); a spelling
   with other capitals (SN2, LDA, pKa) must match exactly. Plain plurals are
   allowed. A letter, digit, hyphen or en dash on either side disqualifies a
   match, so "Markovnikov" is not found in "anti-Markovnikov". No lookbehind:
   older iOS Safari throws on it at parse time.

   Phones: a tap on a term that is a link shows the definition first and
   follows the link on a second tap; a tap elsewhere or Escape closes. */
(function(){
  if(window.LevlGlossary) return;
  var me = document.currentScript;
  var attr = function(n, d){ return (me && me.getAttribute(n)) || d; };
  var DATA = new URL(attr('data-glossary', 'assets/glossary.json'), document.baseURI).href;
  var ROOT = new URL(attr('data-course-root', './'), document.baseURI).href;

  // The marks and the popup are styled in base.css; a page that has not
  // moved to it yet (study notes, lessons) gets it from here.
  if(me && !document.querySelector('link[href*="course/base.css"]')){
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = new URL('base.css', me.src).href;
    document.head.appendChild(l);
  }

  var data = null, loading = null, matcher = null;
  var tip = null, current = null, hideTimer = null;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  // Definitions may carry a few inline tags (italic species names, H<sub>2</sub>O).
  function rich(s){ return esc(s).replace(/&lt;(\/?)(i|b|em|strong|sub|sup)&gt;/g, '<$1$2>'); }
  function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function load(){
    if(!loading) loading = fetch(DATA).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ data = d; d.byId = {}; (d.terms || []).forEach(function(t){ d.byId[t.id] = t; }); return d; });
    return loading;
  }

  /* ---- runtime marking -------------------------------------------------- */
  var ORDINARY = /^\p{Lu}[\p{Ll}\s'’-]+$/u;
  function buildMatcher(){
    var exact = {}, folded = {}, keys = [];
    data.terms.forEach(function(t){
      if(t.pop === 0) return;
      [t.term].concat(t.aka || []).forEach(function(k){
        if(!k || k.length < 2 || /[()]/.test(k)) return;
        if(k === k.toLowerCase() || ORDINARY.test(k)) folded[k.toLowerCase()] = t.id; else exact[k] = t.id;
        keys.push(k);
      });
    });
    keys.sort(function(a, b){ return b.length - a.length; });
    var re = new RegExp('(^|[^\\p{L}\\p{N}\\-–])(' + keys.map(reEsc).join('|') + ')(e?s)?(?![\\p{L}\\p{N}\\-–])', 'giu');
    matcher = { re: re, exact: exact, folded: folded };
  }
  function idFor(word){
    if(Object.prototype.hasOwnProperty.call(matcher.exact, word)) return matcher.exact[word];
    var low = word.toLowerCase();
    return Object.prototype.hasOwnProperty.call(matcher.folded, low) ? matcher.folded[low] : null;
  }

  var SKIP = /^(A|H1|H2|H3|H4|H5|H6|SVG|FIGURE|FIGCAPTION|CODE|PRE|SCRIPT|STYLE|BUTTON|SUMMARY|LABEL|SELECT|TEXTAREA|SUB|SUP|NAV|TH|DFN)$/;
  function skipped(node, root){
    for(var el = node.parentNode; el && el !== root; el = el.parentNode){
      if(SKIP.test(el.nodeName) || (el.classList && el.classList.contains('gl'))) return true;
    }
    return false;
  }

  function markNow(root, topic){
    var seen = {};
    data.terms.forEach(function(t){ if(topic && t.topic === topic) seen[t.id] = 1; });
    Array.prototype.forEach.call(root.querySelectorAll('.gl[data-c]'), function(el){ seen[el.getAttribute('data-c')] = 1; });
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while((n = walker.nextNode())) if(n.nodeValue.length > 1 && !skipped(n, root)) nodes.push(n);
    nodes.forEach(function(node){
      var text = node.nodeValue, re = matcher.re, m, last = 0, frag = null;
      re.lastIndex = 0;
      while((m = re.exec(text))){
        var id = idFor(m[2]);
        // A spelling with the wrong case: retry from the next character, so a
        // shorter term inside it can still match.
        if(!id){ re.lastIndex = m.index + m[1].length + 1; continue; }
        // Already marked, or taught here: skip the whole phrase, so "base
        // pair" is not found inside "conjugate acid–base pair".
        if(seen[id]) continue;
        seen[id] = 1;
        var start = m.index + m[1].length, end = start + m[2].length + (m[3] ? m[3].length : 0);
        frag = frag || document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, start)));
        var span = document.createElement('span');
        span.className = 'gl';
        span.setAttribute('data-c', id);
        span.setAttribute('tabindex', '0');
        span.setAttribute('role', 'button');
        span.textContent = text.slice(start, end);
        frag.appendChild(span);
        last = end;
      }
      if(frag){
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    });
  }

  function mark(root, opts){
    if(!root) return Promise.resolve();
    var topic = (opts && opts.topic) || '';
    return load().then(function(){
      if(!matcher){
        try { buildMatcher(); } catch(e){ return; } // no \p{} support: no marks, page unchanged
      }
      markNow(root, topic);
    }).catch(function(){});
  }

  /* ---- the popup -------------------------------------------------------- */
  function ensureTip(){
    if(tip) return tip;
    tip = document.createElement('div');
    tip.className = 'cx-tip'; tip.id = 'cx-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    tip.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); });
    tip.addEventListener('mouseleave', scheduleHide);
    document.body.appendChild(tip);
    return tip;
  }
  function show(el){
    var id = el.getAttribute('data-c');
    load().then(function(d){
      var t = d.byId[id];
      if(!t) return;
      clearTimeout(hideTimer);
      var box = ensureTip();
      var href = t.href ? new URL(t.href, ROOT).href : '';
      var roots = (t.roots || []).map(function(r){ return '<i>' + esc(r[0]) + '</i> ' + esc(r[1]); }).join(' · ');
      var here = location.href.split('#')[0], to = href.split('#')[0];
      // No "Taught in" link to the page the reader is already on (unless it is a section further down a long page).
      var selfLink = href && to === here && (href.indexOf('#') < 0 || el.tagName === 'A');
      box.innerHTML = '<b>' + esc(t.term) + (t.say ? ' <span class="cx-tip-say">(' + esc(t.say) + ')</span>' : '') + '</b>' + rich(t.def) +
        (roots ? '<span class="cx-tip-roots">' + roots + '</span>' : '') +
        (href && !selfLink && t.topicTitle ? '<a class="cx-tip-link" href="' + esc(href) + '">Taught in ' + esc(t.topicTitle) + ' <span aria-hidden="true">&rarr;</span></a>' : '');
      box.hidden = false;
      if(current && current !== el) current.removeAttribute('aria-describedby');
      current = el;
      el.setAttribute('aria-describedby', 'cx-tip');
      var r = el.getBoundingClientRect();
      var vw = document.documentElement.clientWidth;
      var left = Math.max(8, Math.min(r.left, vw - box.offsetWidth - 8));
      var top = r.bottom + 8;
      // Flip above the word when there is no room below it.
      if(top + box.offsetHeight > window.innerHeight - 8 && r.top - box.offsetHeight - 8 > 0) top = r.top - box.offsetHeight - 8;
      box.style.left = (window.scrollX + left) + 'px';
      box.style.top = (window.scrollY + top) + 'px';
    }).catch(function(){});
  }
  function hide(){ if(tip) tip.hidden = true; if(current) current.removeAttribute('aria-describedby'); current = null; }
  function scheduleHide(){ clearTimeout(hideTimer); hideTimer = setTimeout(hide, 180); }
  function termOf(e){ return e.target && e.target.closest ? e.target.closest('.gl[data-c]') : null; }
  var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;

  document.addEventListener('mouseover', function(e){ var el = termOf(e); if(el && !touch) show(el); });
  document.addEventListener('mouseout', function(e){ if(termOf(e) && !touch) scheduleHide(); });
  document.addEventListener('focusin', function(e){ var el = termOf(e); if(el) show(el); else if(!(tip && tip.contains(e.target))) hide(); });
  document.addEventListener('click', function(e){
    var el = termOf(e);
    if(!el){ if(!(tip && tip.contains(e.target))) hide(); return; }
    // A link: on a phone the first tap reads, the second follows.
    if(el.tagName === 'A'){
      if(touch && (current !== el || !tip || tip.hidden)){ e.preventDefault(); show(el); }
      return;
    }
    show(el);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && tip && !tip.hidden){ hide(); return; }
    var el = termOf(e);
    if(el && el.tagName !== 'A' && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault();
      if(current === el && tip && !tip.hidden) hide(); else show(el);
    }
  });
  window.addEventListener('resize', hide);

  /* ---- automatic marking ------------------------------------------------- */
  function watch(el, topic){
    var busy = false, pending = 0;
    var run = function(){
      pending = 0; busy = true;
      mark(el, { topic: topic }).then(function(){ obs.takeRecords(); busy = false; });
    };
    var obs = new MutationObserver(function(){
      if(busy || pending) return;
      pending = requestAnimationFrame(run);
    });
    obs.observe(el, { childList: true, subtree: true });
    run();
  }
  function auto(){
    var els = document.querySelectorAll('[data-glossary-topic]');
    if(!els.length) return;
    var go = function(){
      Array.prototype.forEach.call(els, function(el){
        var topic = el.getAttribute('data-glossary-topic');
        if(el.hasAttribute('data-glossary-live') && window.MutationObserver) watch(el, topic);
        else mark(el, { topic: topic });
      });
    };
    if(window.requestIdleCallback) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 200);
  }
  if(document.readyState === 'complete') auto(); else window.addEventListener('load', auto);

  window.LevlGlossary = { mark: mark, load: load, show: show, hide: hide };
})();
