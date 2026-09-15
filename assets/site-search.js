/* The search behind both courses' search pages.

   Each course knows what it is made of and builds its own index — NREMT's
   reference pages and question bank, ochem's textbook fragments, lessons,
   mechanisms, tools and practice bank. What neither of them should own is
   *how searching works*: matching, ranking and snippet highlighting are the
   same problem in both, and the version of this that lived inline in
   nremt/search.html was about to be copied into a second page, which is how
   the two per-course copies of theme.css began.

   A chunk is `{ page, file, heading, text }` plus whatever the caller wants to
   carry through. rank() returns the matching chunks, best first, each with a
   `score` and a `snippet` already escaped and marked up.

   Tested in scripts/test/site-search.test.mjs. */
(function (window) {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function tokenize(q) {
    return String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
  }

  /* A window of the text around the first matching term, escaped, with every
     term marked.

     The order here is the whole trick and it took two wrong versions to get
     to. Marking the raw string and escaping afterwards eats its own <mark>
     tags; marking raw text with a raw pattern misses any term containing
     & < > ' or ". So: slice, escape, then match the ESCAPED term against the
     ESCAPED text. */
  function highlight(text, terms, opts) {
    var o = opts || {};
    var lead = o.lead === undefined ? 60 : o.lead;
    var span = o.span === undefined ? 220 : o.span;
    var lower = String(text).toLowerCase();

    var first;
    for (var i = 0; i < terms.length; i++) {
      var at = lower.indexOf(terms[i]);
      if (at !== -1 && (first === undefined || at < first)) first = at;
    }

    var start = first === undefined ? 0 : Math.max(0, first - lead);
    var end = Math.min(text.length, start + span);
    var snippet = escapeHtml(text.slice(start, end));
    if (start > 0) snippet = '… ' + snippet;
    if (end < text.length) snippet = snippet + ' …';

    for (var j = 0; j < terms.length; j++) {
      snippet = snippet.replace(new RegExp('(' + escapeRe(escapeHtml(terms[j])) + ')', 'ig'), '<mark>$1</mark>');
    }
    return snippet;
  }

  /* Every term has to appear somewhere in the chunk — AND, not OR. That is
     what makes a natural phrase like "chest pain nitroglycerin" work at all:
     matching the whole query as one literal substring returned nothing for
     anything but an exact quotation, and OR returns the entire bank for any
     query containing a common word.

     A term in the heading is worth more than one in the body, and the whole
     phrase appearing intact is worth more than a scattering of its words. A
     chunk may declare its own `weight` to tilt the ordering between kinds of
     result — a lesson's title should outrank the hundredth practice question
     that happens to mention it. */
  function score(chunk, terms, phrase) {
    var h = String(chunk.heading || '').toLowerCase();
    var t = String(chunk.text || '').toLowerCase();
    var total = 0;

    for (var i = 0; i < terms.length; i++) {
      var inH = h.indexOf(terms[i]) !== -1;
      var inT = t.indexOf(terms[i]) !== -1;
      if (!inH && !inT) return null;
      total += (inH ? 2 : 0) + (inT ? 1 : 0);
    }
    if (terms.length > 1 && phrase && (h.indexOf(phrase) !== -1 || t.indexOf(phrase) !== -1)) total += 4;
    return total * (typeof chunk.weight === 'number' ? chunk.weight : 1);
  }

  function rank(index, query, opts) {
    var o = opts || {};
    var limit = o.limit || 40;
    var terms = tokenize(query);
    if (!terms.length) return [];
    var phrase = String(query).toLowerCase().trim();

    var out = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], terms, phrase);
      if (s === null) continue;
      var hit = {};
      for (var k in index[i]) if (Object.prototype.hasOwnProperty.call(index[i], k)) hit[k] = index[i][k];
      hit.score = s;
      hit.snippet = highlight(index[i].text || '', terms, o);
      out.push(hit);
    }

    // Stable within a score: the index is built in a meaningful order (course
    // order, chapter order), and a sort that scrambles equal hits makes the
    // same query look different on every keystroke.
    out.sort(function (a, b) { return b.score - a.score; });
    if (o.maxPerSource) out = capPerSource(out, o.maxPerSource);
    return out.slice(0, limit);
  }

  /* A link that scrolls the reader to the match rather than the top of a long
     page. Built from the longest term rather than the whole query, which
     rarely appears verbatim — a text fragment that does not match is ignored
     by the browser, so a wrong guess costs the scroll, not the link.

     A URL has exactly one fragment, and the text directive is part of it,
     after `:~:`. Ochem's textbook links already carry a hash naming the
     section ('learn.html#e2'), and appending '#:~:text=' to that produced
     'learn.html#e2#:~:text=...' — a second '#' that makes the whole fragment
     'e2#:~:text=...', which matches no element and is not a text directive
     either, so the link silently stopped opening the right chapter. */
  function textFragment(file, terms) {
    if (!terms.length) return file;
    var longest = terms.slice().sort(function (a, b) { return b.length - a.length; })[0];
    var sep = String(file).indexOf('#') === -1 ? '#' : '';
    return file + sep + ':~:text=' + encodeURIComponent(longest);
  }

  /* At most `max` hits from any one place. A long section matching a common
     term fills the whole first screen with cards that read identically — same
     page, same heading, a different paragraph each time — which looks like a
     broken result list rather than a thorough one. */
  function capPerSource(hits, max) {
    var seen = {};
    var out = [];
    for (var i = 0; i < hits.length; i++) {
      var k = (hits[i].file || '') + '\u0000' + (hits[i].heading || '');
      seen[k] = (seen[k] || 0) + 1;
      if (seen[k] <= max) out.push(hits[i]);
    }
    return out;
  }

  window.LevlSearch = {
    escapeHtml: escapeHtml,
    tokenize: tokenize,
    highlight: highlight,
    score: score,
    rank: rank,
    textFragment: textFragment,
    capPerSource: capPerSource,
  };
})(window);
