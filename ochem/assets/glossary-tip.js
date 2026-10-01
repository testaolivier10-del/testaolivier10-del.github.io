/* Glossary popups for the ochem notes: the first time a glossary term appears
   in a section, it gets a dotted underline, and hovering, focusing or tapping
   it shows the definition with a link to the section that teaches it. A
   student who opens chapter 14 cold is never stuck on a word from chapter 4.

   Same behavior as the A&P hovers (anatomy-physiology/assets/anp-glossary.js),
   with one difference forced by how the ochem prose is stored: the A&P
   generator marks terms when it builds the page, but the ochem prose is one
   fragment per section that two readers share (the notes page and learn.html,
   see scripts/build-notes-pages.mjs), and the words must stay the only thing
   in it. So the terms are found here, at runtime, in the text the reader is
   looking at. Nothing is marked until the browser is idle after load, and the
   glossary is one JSON file shared with the glossary page.

   Who calls it:
     ochem/notes/*.html  marks <article data-glossary-topic="…"> on load.
     learn.html          textbook.js calls OchemGlossary.mark(el, topicId)
                         after it injects each section.
   A term is not marked inside the section that teaches it (it is defined
   right there), nor inside headings, links, figures or code. */
(function(){
  var script = document.currentScript;
  var SRC = script ? new URL('glossary.json', script.src).href : '/ochem/assets/glossary.json';
  var OCHEM = script ? new URL('../', script.src).href : '/ochem/';
  var data = null, loading = null, matcher = null;
  var tip = null, current = null, hideTimer = null;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function load(){
    if(!loading) loading = fetch(SRC).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ data = d; data.byId = {}; d.terms.forEach(function(t){ data.byId[t.id] = t; }); return d; });
    return loading;
  }

  /* One regex for every spelling. Lowercase entries match in any case (so a
     sentence-initial "Enolate" counts); entries with capitals, like SN2, LDA
     or Grignard, must match exactly, so "lda" in a word never does. Plain
     plurals are allowed on the end. Letters, digits and hyphens on either
     side disqualify a match, so "Markovnikov" is not found in
     "anti-Markovnikov"; so does an en dash, which joins words here
     ("acid–base", "keto–enol").
     No lookbehind: older iOS Safari throws on it at parse time. */
  function buildMatcher(){
    var exact = {}, folded = {}, keys = [];
    data.terms.forEach(function(t){
      if(t.pop === 0) return;
      [t.term].concat(t.aka || []).forEach(function(k){
        if(k.length < 2) return;
        if(k === k.toLowerCase()) folded[k] = t.id; else exact[k] = t.id;
        keys.push(k);
      });
    });
    keys.sort(function(a, b){ return b.length - a.length; });
    var re = new RegExp('(^|[^\\p{L}\\p{N}\\-\u2013])(' + keys.map(reEsc).join('|') + ')(e?s)?(?![\\p{L}\\p{N}\\-\u2013])', 'giu');
    matcher = { re: re, exact: exact, folded: folded };
  }

  function idFor(word){
    if(Object.prototype.hasOwnProperty.call(matcher.exact, word)) return matcher.exact[word];
    var low = word.toLowerCase();
    if(Object.prototype.hasOwnProperty.call(matcher.folded, low)) return matcher.folded[low];
    return null;
  }

  var SKIP = /^(A|H1|H2|H3|H4|H5|H6|SVG|FIGURE|CODE|PRE|SCRIPT|STYLE|BUTTON|SUMMARY|LABEL|SELECT|TEXTAREA|SUB|SUP)$/;
  function skipped(node, root){
    for(var el = node.parentNode; el && el !== root; el = el.parentNode){
      if(SKIP.test(el.nodeName) || (el.classList && el.classList.contains('ogl-term'))) return true;
    }
    return false;
  }

  /* Wrap the first use of each term in `root`, except the terms `topic`
     teaches. */
  function markNow(root, topic){
    if(!root || root.getAttribute('data-glossary-marked')) return;
    root.setAttribute('data-glossary-marked', '1');
    var seen = {};
    data.terms.forEach(function(t){ if(t.topic === topic) seen[t.id] = 1; });
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
        // Already marked, or taught on this page: skip the whole phrase, so
        // "base pair" is not found inside "conjugate acid–base pair".
        if(seen[id]) continue;
        seen[id] = 1;
        var start = m.index + m[1].length, end = start + m[2].length + (m[3] ? m[3].length : 0);
        frag = frag || document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, start)));
        var span = document.createElement('span');
        span.className = 'ogl-term';
        span.setAttribute('data-g', id);
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

  function mark(root, topic){
    if(!root) return;
    load().then(function(){
      if(!matcher){
        try { buildMatcher(); } catch(e){ return; } // no \p{} support: no popups, page unchanged
      }
      markNow(root, topic);
    }).catch(function(){});
  }

  // ---- the popup ---------------------------------------------------------
  function ensureTip(){
    if(tip) return tip;
    var style = document.createElement('style');
    style.textContent =
      '.ogl-term{text-decoration:underline dotted;text-decoration-thickness:1.5px;text-underline-offset:3px;cursor:help;}' +
      '.ogl-term:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:3px;}' +
      '.ogl-tip{position:absolute;z-index:60;max-width:min(340px,calc(100vw - 16px));padding:11px 14px;border-radius:12px;background:var(--ink);color:var(--paper);font:600 14px/1.5 var(--font-ui);box-shadow:var(--shadow-pop);}' +
      '.ogl-tip b{display:block;font-weight:900;margin-bottom:2px;}' +
      '.ogl-tip a{color:inherit;display:inline-block;margin-top:6px;font-weight:800;font-size:13px;}';
    document.head.appendChild(style);
    tip = document.createElement('div');
    tip.className = 'ogl-tip'; tip.id = 'ogl-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    tip.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); });
    tip.addEventListener('mouseleave', scheduleHide);
    document.body.appendChild(tip);
    return tip;
  }
  function show(el){
    var t = data && data.byId[el.getAttribute('data-g')];
    if(!t) return;
    clearTimeout(hideTimer);
    var box = ensureTip(), tp = data.topics[t.topic] || ['', ''];
    box.innerHTML = '<b>' + esc(t.term) + '</b>' + esc(t.def) +
      '<br><a href="' + OCHEM + 'notes/' + t.topic + '.html">Taught in ' + esc(tp[0]) + ' (ch. ' + tp[1] + ') →</a>';
    box.hidden = false;
    if(current && current !== el) current.removeAttribute('aria-describedby');
    current = el;
    el.setAttribute('aria-describedby', 'ogl-tip');
    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var left = Math.max(8, Math.min(r.left, vw - box.offsetWidth - 8));
    var top = r.bottom + 8;
    // Flip above the word when there is no room below it.
    if(top + box.offsetHeight > window.innerHeight - 8 && r.top - box.offsetHeight - 8 > 0) top = r.top - box.offsetHeight - 8;
    box.style.left = (window.scrollX + left) + 'px';
    box.style.top = (window.scrollY + top) + 'px';
  }
  function hide(){ if(tip) tip.hidden = true; if(current) current.removeAttribute('aria-describedby'); current = null; }
  function scheduleHide(){ clearTimeout(hideTimer); hideTimer = setTimeout(hide, 180); }
  function termOf(e){ return e.target && e.target.closest ? e.target.closest('.ogl-term') : null; }

  document.addEventListener('mouseover', function(e){ var el = termOf(e); if(el) show(el); });
  document.addEventListener('mouseout', function(e){ if(termOf(e)) scheduleHide(); });
  document.addEventListener('focusin', function(e){ var el = termOf(e); if(el) show(el); else if(!(tip && tip.contains(e.target))) hide(); });
  document.addEventListener('click', function(e){
    var el = termOf(e);
    // A tap also fires mouseover and focus first, so a click only ever shows;
    // tapping elsewhere or Escape closes.
    if(el){ show(el); return; }
    if(!(tip && tip.contains(e.target))) hide();
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') hide();
    var el = termOf(e);
    if(el && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); if(current === el && tip && !tip.hidden) hide(); else show(el); }
  });
  window.addEventListener('resize', hide);

  window.OchemGlossary = { mark: mark };

  // A notes page: mark its article once the page has settled.
  function auto(){
    var art = document.querySelector('[data-glossary-topic]');
    if(!art) return;
    var go = function(){ mark(art, art.getAttribute('data-glossary-topic')); };
    if(window.requestIdleCallback) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 200);
  }
  if(document.readyState === 'complete') auto(); else window.addEventListener('load', auto);
})();
