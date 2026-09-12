/* Full-text search across the textbook's prose.

   The rail's box used to be a title filter: it matched the 62 section names
   and nothing else, so looking up an idea you couldn't name the section for
   ("what was a nucleophile again?", "polar aprotic", "anti-periplanar") found
   nothing unless the words happened to be in a heading. This indexes what the
   sections actually say, so a search lands on the paragraph that says it.

   The index is built from the same note fragments the chapters render, fetched
   through the same cache — there is no separate search corpus to keep in sync,
   and a section already on screen costs nothing to index. A document is one
   section; a block is one top-level element of its fragment, so a hit's
   position is just an index into the rendered container's children and the
   page can scroll to and highlight the exact paragraph.

   Ranking, in short: a section qualifies only if every query term appears
   somewhere in it (AND, not OR — two-word queries should narrow), and its
   blocks are then ordered by how much of the query each one carries, with the
   whole phrase, a title match and a heading match all worth more than a
   scattering of separate terms. */
(function(){
  var docs = {};        // topicId -> { meta, blocks:[{i, text, lower, tag, heading}], lower }
  var order = [];       // topicIds in curriculum order, so ties break by chapter

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* Words that carry no signal here. People type questions, not keywords —
     "what is a nucleophile" should search for "nucleophile", not insist that
     some paragraph also contains "what". They are only dropped when something
     is left to search for, so a query that is nothing but these still runs. */
  var STOP = ('a an the of in on to for is are was were be been am do does did ' +
    'what why how when which who whom that this these those it its as at by ' +
    'from with about into your you i me my we our they them he she his her ' +
    'and or but if then than so such can could would should will shall may ' +
    'might must not no again mean means meaning me tell show explain say ' +
    'define definition vs versus between like over under out up down').split(' ');
  var STOP_SET = {};
  STOP.forEach(function(w){ STOP_SET[w] = true; });

  /* Query terms. Punctuation is dropped so "pKa," and "SN2)" behave, but
     digits and symbols inside a word are kept — "sn2", "h2o" and "pka" are
     real search terms in this subject. */
  function terms(q){
    var all = String(q || '')
      .toLowerCase()
      .split(/[\s,;:()\[\]"'’“”/\\]+/)
      .map(function(t){ return t.replace(/^[.\-–—]+|[.\-–—?!]+$/g, ''); })
      .filter(function(t){ return t.length > 1; });
    var kept = all.filter(function(t){ return !STOP_SET[t]; });
    return kept.length ? kept : all;
  }

  function collapse(s){ return String(s).replace(/\s+/g, ' ').trim(); }

  /* Every occurrence of `needle` in `hay` (both already lowercased). */
  function occurrences(hay, needle){
    var out = [], i = hay.indexOf(needle);
    while(i !== -1 && out.length < 40){
      out.push(i);
      i = hay.indexOf(needle, i + needle.length);
    }
    return out;
  }

  // A match that starts a word reads as the real hit; "ion" inside "cation"
  // is usually noise, so it still counts but for much less.
  function wholeWordish(hay, at, len){
    var before = at === 0 ? ' ' : hay.charAt(at - 1);
    return !/[a-z0-9]/.test(before);
  }

  /* Ranges to highlight, merged and in order, for `text` (original case). */
  function ranges(text, ts){
    var lower = text.toLowerCase(), all = [];
    ts.forEach(function(t){
      occurrences(lower, t).forEach(function(at){ all.push([at, at + t.length]); });
    });
    all.sort(function(a, b){ return a[0] - b[0]; });
    var merged = [];
    all.forEach(function(r){
      var last = merged[merged.length - 1];
      if(last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    });
    return merged;
  }

  function highlight(text, ts){
    var rs = ranges(text, ts), out = '', at = 0;
    rs.forEach(function(r){
      out += escapeHtml(text.slice(at, r[0])) + '<mark>' + escapeHtml(text.slice(r[0], r[1])) + '</mark>';
      at = r[1];
    });
    return out + escapeHtml(text.slice(at));
  }

  /* A window of the block around its densest run of matches, so the snippet
     shows the sentence that answers the query rather than the block's opening. */
  var SNIPPET = 210;
  function snippet(text, ts){
    var rs = ranges(text, ts);
    if(!rs.length) return highlight(collapse(text).slice(0, SNIPPET), ts);

    var best = rs[0][0], bestN = 0;
    rs.forEach(function(r){
      var n = rs.filter(function(o){ return o[0] >= r[0] && o[0] < r[0] + SNIPPET; }).length;
      if(n > bestN){ bestN = n; best = r[0]; }
    });

    var start = Math.max(0, best - 70);
    var end = Math.min(text.length, start + SNIPPET);
    if(start > 0){
      var sp = text.indexOf(' ', start);
      if(sp !== -1 && sp < start + 25) start = sp + 1;
    }
    var cut = text.slice(start, end);
    if(end < text.length){
      var lastSp = cut.lastIndexOf(' ');
      if(lastSp > SNIPPET - 40) cut = cut.slice(0, lastSp);
    }
    return (start > 0 ? '…' : '') + highlight(collapse(cut), ts) + (end < text.length ? '…' : '');
  }

  /* Split a note fragment into its top-level blocks. The index of a block is
     its index among the container's children, which is exactly what the page
     needs to point at the same element once the fragment is rendered. */
  function blocksFrom(html){
    var doc;
    try{ doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch(e){ return []; }
    var out = [], heading = '';
    var kids = doc.body ? doc.body.children : [];
    for(var i = 0; i < kids.length; i++){
      var el = kids[i];
      var tag = el.tagName.toLowerCase();
      var text = collapse(el.textContent || '');
      if(/^h[1-6]$/.test(tag)) heading = text;
      if(!text) continue;
      out.push({ i: i, text: text, lower: text.toLowerCase(), tag: tag, heading: /^h[1-6]$/.test(tag) ? '' : heading });
    }
    return out;
  }

  function add(topicId, meta, html){
    if(docs[topicId]) return;
    var blocks = blocksFrom(html);
    if(!blocks.length) return;
    docs[topicId] = {
      meta: meta,
      blocks: blocks,
      lower: (meta.title + ' ' + meta.moduleTitle + ' ' + blocks.map(function(b){ return b.text; }).join(' ')).toLowerCase()
    };
    if(order.indexOf(topicId) === -1) order.push(topicId);
  }

  function scoreBlock(b, ts, phrase){
    var score = 0, covered = 0;
    ts.forEach(function(t){
      var hits = occurrences(b.lower, t);
      if(!hits.length) return;
      covered++;
      var whole = hits.some(function(at){ return wholeWordish(b.lower, at, t.length); });
      score += whole ? 6 : 1.5;
      score += Math.min(hits.length - 1, 3) * 0.6;
    });
    if(!covered) return null;
    score += covered * 4;                                   // breadth beats repetition
    if(phrase && b.lower.indexOf(phrase) !== -1) score += 10; // the exact wording asked for
    if(/^h[1-6]$/.test(b.tag)) score += 5;                  // a heading names the idea
    if(b.tag === 'div') score += 1;                         // pitfalls, worked examples, key facts
    return score;
  }

  var HITS_PER_SECTION = 2;

  function search(query, opts){
    opts = opts || {};
    var limit = opts.limit || 24;
    var ts = terms(query);
    if(!ts.length) return [];
    var phrase = collapse(query).toLowerCase();
    var results = [];

    order.forEach(function(id){
      var d = docs[id];
      if(!d) return;
      // Every term has to be in the section somewhere, or the section is not
      // what was asked for.
      for(var i = 0; i < ts.length; i++) if(d.lower.indexOf(ts[i]) === -1) return;

      var titleLower = d.meta.title.toLowerCase();
      var titleCovered = ts.filter(function(t){ return titleLower.indexOf(t) !== -1; }).length;

      var scored = [];
      d.blocks.forEach(function(b){
        var s = scoreBlock(b, ts, phrase);
        if(s !== null) scored.push({ block: b, score: s });
      });
      scored.sort(function(a, b){ return b.score - a.score || a.block.i - b.block.i; });

      var titleScore = titleCovered * 12 + (titleLower === phrase ? 30 : titleLower.indexOf(phrase) !== -1 ? 16 : 0);
      var best = (scored.length ? scored[0].score : 0) + titleScore;

      results.push({
        topicId: id,
        title: d.meta.title,
        moduleId: d.meta.moduleId,
        moduleTitle: d.meta.moduleTitle,
        moduleIndex: d.meta.moduleIndex,
        score: best,
        titleMatch: titleCovered === ts.length,
        hits: scored.slice(0, HITS_PER_SECTION).map(function(s){
          return {
            blockIndex: s.block.i,
            heading: s.block.heading,
            isHeading: /^h[1-6]$/.test(s.block.tag),
            text: s.block.text,
            snippet: snippet(s.block.text, ts)
          };
        })
      });
    });

    results.sort(function(a, b){
      return b.score - a.score || order.indexOf(a.topicId) - order.indexOf(b.topicId);
    });
    var shown = results.slice(0, limit);
    // So the panel can say "the closest 24 of 31" rather than implying 24 is
    // all there is.
    shown.total = results.length;
    return shown;
  }

  window.OchemTextbookSearch = {
    add: add,
    has: function(id){ return !!docs[id]; },
    count: function(){ return order.length; },
    search: search,
    terms: terms,
    ranges: ranges,
    escapeHtml: escapeHtml
  };
})();
