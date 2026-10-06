/* What the site-wide search (/search.html) searches, and how it gets it.

   assets/site-search.js owns HOW to search (matching, ranking, snippets). This
   file owns WHAT: one loader per course, each turning that course's own data
   into chunks of the shape LevlSearch.rank() takes, with every link rewritten
   to be relative to the site root.

   Lazy by course. Nothing is fetched until a query needs a course: a reader on
   /search.html?course=ochem who never presses "All" never downloads the NREMT
   question bank. Within a course every source is its own promise and is
   allowed to fail on its own, so offline you search whatever the service
   worker has cached and the status line says what is missing.

   The chunk builders are pure (data in, chunks out) and tested in
   scripts/test/site-search.test.mjs; only load() touches the network.

   Adding a source is meant to be one line. termsFromJson() reads every
   glossary shape on this site (A&P's {id: {t, d}} map, ochem's
   {terms: [{id, term, def}]}). */
(function (window) {
  'use strict';

  /* The courses search covers: every one in assets/courses.js that is not
     hidden, in registry order. SOURCES below needs an entry for each. */
  // courses:begin COURSE_LIST key,searchLabel,name,dir,aliases,status (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', searchLabel: 'NREMT', name: 'NREMT-EMT', dir: 'nremt', aliases: [], status: 'live' },
    { key: 'ochem', searchLabel: 'Organic Chem', name: 'Organic Chemistry', dir: 'ochem', aliases: ['organic-chemistry'], status: 'live' },
    { key: 'anp', searchLabel: 'A&P', name: 'Anatomy & Physiology', dir: 'anatomy-physiology', aliases: ['a&p', 'ap', 'anatomy-physiology'], status: 'beta' },
    { key: 'apbio', searchLabel: 'Biology', name: 'AP® Biology', dir: 'bio', aliases: ['bio', 'biology'], status: 'beta' },
  ];
  // courses:end
  var COURSES = COURSE_LIST.filter(function (c) { return c.status !== 'hidden'; }).map(function (c) {
    return { key: c.key, label: c.searchLabel, name: c.name, base: c.dir + '/' };
  });

  /* Glossary data per course, relative to the course folder. Every course
     serves assets/glossary.json in one shape (scripts/lib/glossary.mjs); A&P
     and Bio have their own loaders below. */
  var GLOSSARY = {
    nremt: 'assets/glossary.json', // built by scripts/build-nremt-glossary.mjs; entries are #t-<id>
    ochem: 'assets/glossary.json', // built by scripts/build-ochem-glossary.mjs; entries are #t-<id>
  };

  function courseOf(key) {
    for (var i = 0; i < COURSES.length; i++) if (COURSES[i].key === key) return COURSES[i];
    return null;
  }

  /* ?course= accepts the course keys and the spellings people (and other
     pages) actually use, each course's `aliases` in assets/courses.js;
     anything else means every course. */
  function parseCourse(value) {
    var v = String(value || '').toLowerCase().trim();
    COURSE_LIST.forEach(function (c) { if (c.aliases.indexOf(v) !== -1) v = c.key; });
    return courseOf(v) ? v : 'all';
  }

  /* The ?course= value written for a course. A key with the token "ap" in it
     (apbio) never goes into a URL (docs/apbio-spec.md decision 2): it travels
     as its folder ("bio"), which parseCourse reads back through its aliases. */
  function urlKey(key) {
    var tokens = String(key || '').toLowerCase().split(/[^a-z0-9]+/);
    if (tokens.indexOf('ap') === -1 && tokens.indexOf('apbio') === -1) return key;
    for (var i = 0; i < COURSE_LIST.length; i++) if (COURSE_LIST[i].key === key) return COURSE_LIST[i].dir;
    return key;
  }

  function scopeKeys(scope) {
    return scope === 'all' || !courseOf(scope) ? COURSES.map(function (c) { return c.key; }) : [scope];
  }

  /* ---- text helpers ---- */

  var ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—',
    rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', deg: '°', middot: '·', times: '×', rarr: '→' };

  function decodeEntities(s) {
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, function (m, e) {
      if (e[0] === '#') {
        var n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return isFinite(n) ? String.fromCodePoint(n) : m;
      }
      return Object.prototype.hasOwnProperty.call(ENTITIES, e.toLowerCase()) ? ENTITIES[e.toLowerCase()] : m;
    });
  }

  // Tags out, entities decoded, whitespace collapsed. Block-level tags become
  // a space so "<li>a</li><li>b</li>" does not read as "ab".
  function stripHtml(html) {
    return decodeEntities(String(html || '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ').trim();
  }

  /* Long prose split into pieces of at most `max` characters, at a sentence
     end where there is one and a space where there is not. A 3,000-character
     notes topic as one chunk gives every query the same snippet from its
     first match; split, a hit points at the paragraph that matched. */
  function splitText(text, max) {
    var m = max || 600;
    var s = String(text || '').trim();
    var out = [];
    while (s.length > m) {
      var cut = s.lastIndexOf('. ', m);
      if (cut < m * 0.4) cut = s.lastIndexOf(' ', m);
      if (cut <= 0) cut = m;
      else cut += 1;
      out.push(s.slice(0, cut).trim());
      s = s.slice(cut).trim();
    }
    if (s) out.push(s);
    return out;
  }

  /* A page as a flat run of headings and text, the way a DOM walk sees it,
     grouped into one or more chunks per heading. Used for the NREMT reference
     pages, whose content is cards of <div>s rather than paragraphs, which is
     why the old per-course search found nothing in most of them. */
  function sectionChunks(items, base) {
    var out = [];
    var heading = base.heading;
    var buf = [];
    function flush() {
      var text = buf.join(' ').replace(/\s+/g, ' ').trim();
      buf = [];
      if (text.length < 20) return;
      splitText(text, 500).forEach(function (piece) {
        out.push(make(base, { heading: heading, text: piece }));
      });
    }
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.h != null) { flush(); heading = base.heading + ' — ' + String(it.h).trim(); }
      else if (it.t) buf.push(String(it.t));
    }
    flush();
    return out;
  }

  function make(base, extra) {
    var o = {};
    var k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) o[k] = base[k];
    for (k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    return o;
  }

  /* ---- glossary shapes ---- */

  /* {term:"X", def:"Y"} objects written inline in a page's script (how the
     NREMT glossary carried its terms before it moved to a JSON file). Read
     from the source text rather than by running the page. */
  function inlineTerms(src) {
    var out = [];
    var re = /\{\s*term\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*def\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    var m;
    while ((m = re.exec(String(src || '')))) {
      out.push({ term: unescapeJs(m[1]), def: unescapeJs(m[2]) });
    }
    return out;
  }

  function unescapeJs(s) {
    return s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, function (_, c) {
      if (c[0] === 'u' && c.length === 5) return String.fromCharCode(parseInt(c.slice(1), 16));
      return c === 'n' ? '\n' : c === 't' ? '\t' : c;
    });
  }

  /* A glossary JSON in either shape: A&P's map ({id: {t, d}}) or a list of
     {term|t|name, def|d|definition, id?}. Anything without both a term and a
     definition is dropped rather than indexed half-empty. */
  function termsFromJson(data) {
    var list = [];
    if (Array.isArray(data)) list = data.map(function (x) { return [x && x.id, x]; });
    else if (data && Array.isArray(data.terms)) return termsFromJson(data.terms);
    else if (data && typeof data === 'object') list = Object.keys(data).map(function (k) { return [k, data[k]]; });
    var out = [];
    list.forEach(function (pair) {
      var x = pair[1] || {};
      var term = x.term || x.t || x.name;
      var def = x.def || x.d || x.definition;
      if (!term || !def) return;
      out.push({ id: pair[0] == null ? null : String(pair[0]), term: String(term), def: stripHtml(def), topic: x.p || x.topic || null });
    });
    return out;
  }

  /* ---- per-course chunk builders (pure) ---- */

  function nremtNotesChunks(data) {
    var out = [];
    ((data && data.chapters) || []).forEach(function (ch) {
      var chTitle = 'Ch. ' + ch.num + ' ' + ch.title;
      if (ch.intro) {
        splitText(stripHtml(ch.intro)).forEach(function (piece) {
          out.push({ course: 'nremt', kind: 'Notes', file: 'nremt/study-notes.html#chapter-' + ch.num, heading: chTitle, text: piece, frag: true });
        });
      }
      (ch.sections || []).forEach(function (sec) {
        (sec.topics || []).forEach(function (tp) {
          var heading = chTitle + ' — ' + (tp.heading || sec.title);
          splitText(stripHtml(tp.html)).forEach(function (piece) {
            out.push({ course: 'nremt', kind: 'Notes', file: 'nremt/study-notes.html#' + sec.id, heading: heading, text: piece, frag: true });
          });
        });
      });
    });
    return out;
  }

  function nremtGlossaryChunks(terms) {
    return terms.map(function (x) {
      return { course: 'nremt', kind: 'Glossary', file: 'nremt/glossary.html', heading: x.term, text: x.term + ': ' + x.def, frag: true, weight: 2 };
    });
  }

  function nremtQuestionChunks(core, explanations) {
    var ex = explanations || [];
    return (core || []).map(function (q, i) {
      return {
        course: 'nremt', kind: 'Questions',
        file: 'nremt/practice.html?q=' + (typeof q.id === 'number' ? q.id : i),
        heading: q.domain + (q.topic ? ' — ' + q.topic : ''),
        text: (q.q || '') + ' ' + (ex[i] || ''),
        weight: 0.8,
      };
    });
  }

  function ochemTopics(CU) {
    var out = [];
    ((CU && CU.MODULES) || []).forEach(function (m) {
      (m.topics || []).forEach(function (t) { out.push({ topic: t, module: m }); });
    });
    return out;
  }

  // Mirrors ochem/search.html: lessons and mechanisms from the curriculum, a
  // topic with no href (announced, not built) is not a result.
  function ochemStructureChunks(CU) {
    var out = [];
    ochemTopics(CU).forEach(function (e) {
      var t = e.topic;
      if (!t.href) return;
      var isMech = t.href.indexOf('mechanisms/') === 0;
      out.push({
        course: 'ochem', kind: isMech ? 'Mechanisms' : (t.notesOnly ? 'Textbook' : 'Lessons'), file: 'ochem/' + t.href, heading: t.title,
        text: t.title + ' — ' + e.module.title + '. ' + (isMech ? 'Mechanism walkthrough: push the arrows step by step.' : 'Interactive lesson with guided and independent practice.'),
        weight: 3,
      });
      if (t.mechanism) {
        out.push({ course: 'ochem', kind: 'Mechanisms', file: 'ochem/' + t.mechanism, heading: t.title + ' — mechanism',
          text: 'The ' + t.title.toLowerCase() + ' mechanism, step by step: ' + e.module.title + '.', weight: 3 });
      }
    });
    return out;
  }

  function ochemToolChunks(tools) {
    return ((tools && tools.ALL) || []).map(function (t) {
      return { course: 'ochem', kind: 'Tools', file: 'ochem/tools/' + t.slug + '.html', heading: t.name,
        text: [t.tagline, t.blurb, t.teaches ? 'Teaches: ' + t.teaches : ''].filter(Boolean).join(' '), weight: 3 };
    });
  }

  function ochemQuestionChunks(bank, why, CU) {
    var byId = {};
    ochemTopics(CU).forEach(function (e) { byId[e.topic.id] = e.topic.title; });
    var out = [];
    Object.keys(bank || {}).forEach(function (topicId) {
      var whys = (why && why[topicId]) || [];
      (bank[topicId] || []).forEach(function (q, i) {
        out.push({ course: 'ochem', kind: 'Questions', file: 'ochem/learn.html#' + topicId, heading: byId[topicId] || topicId,
          text: (q.q || '') + ' ' + (whys[i] || ''), weight: 0.8, opensSection: true });
      });
    });
    return out;
  }

  function glossaryChunks(courseKey, terms, hrefFor) {
    var base = courseOf(courseKey).base;
    return terms.map(function (x) {
      var href = hrefFor(x);
      return { course: courseKey, kind: 'Glossary', file: base + href.file, heading: x.term, text: x.def, frag: !!href.frag, weight: 2 };
    });
  }

  function anpStructureChunks(CU, tools) {
    var out = [];
    var chapters = {};
    ((CU && CU.chapters) || []).forEach(function (c) { chapters[c.id] = c; });
    ((CU && CU.topics) || []).filter(function (t) { return t.built; }).forEach(function (t) {
      var ch = chapters[t.chapter];
      out.push({ course: 'anp', kind: 'Lessons', file: 'anatomy-physiology/lessons/' + t.id + '.html', heading: t.title,
        text: t.title + '. Interactive lesson in ' + (ch ? ch.title : 'the course') + '.', weight: 3 });
    });
    (tools || []).forEach(function (t) {
      out.push({ course: 'anp', kind: 'Tools', file: 'anatomy-physiology/tools/' + t.slug + '.html', heading: t.name, text: t.name + '. ' + t.blurb, weight: 3 });
    });
    return out;
  }

  function apbioStructureChunks(CU) {
    var out = [];
    var units = {};
    ((CU && CU.units) || []).forEach(function (u) { units[u.id] = u; });
    ((CU && CU.topics) || []).filter(function (t) { return t.built; }).forEach(function (t) {
      var u = units[t.unit];
      var where = u ? (u.part === 'course' ? 'Unit ' + u.n + ': ' + u.title : 'Skills: ' + u.title) : 'the course';
      out.push({ course: 'apbio', kind: 'Lessons', file: 'bio/lessons/' + t.id + '.html', heading: t.title,
        text: t.title + '. Interactive lesson in ' + where + '.', weight: 3 });
    });
    return out;
  }

  /* ---- results ---- */

  /* Hits (already ranked, best first) grouped by course. Groups are ordered by
     their best hit, so "SN2" leads with ochem and "epinephrine" with NREMT,
     and ties keep the fixed course order so the page does not reshuffle. */
  function groupByCourse(hits) {
    var groups = {};
    hits.forEach(function (h) { (groups[h.course] = groups[h.course] || []).push(h); });
    return COURSES.map(function (c, i) { return { course: c.key, label: c.label, name: c.name, hits: groups[c.key] || [], order: i }; })
      .filter(function (g) { return g.hits.length; })
      .sort(function (a, b) { return (b.hits[0].score - a.hits[0].score) || (a.order - b.order); });
  }

  function countByCourse(hits) {
    var c = {};
    hits.forEach(function (h) { c[h.course] = (c[h.course] || 0) + 1; });
    return c;
  }

  /* ---- loading (browser only) ---- */

  function fetchOk(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r;
    });
  }
  function getJson(url) { return fetchOk(url).then(function (r) { return r.json(); }); }
  function getText(url) { return fetchOk(url).then(function (r) { return r.text(); }); }
  function parseHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script,style,noscript,template,svg,nav,footer,#site-header,.course-nav,.site-nav-fallback').forEach(function (n) { n.remove(); });
    return doc;
  }

  var scriptPromises = {};
  function loadScript(src) {
    if (!scriptPromises[src]) {
      scriptPromises[src] = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = function () { reject(new Error('script ' + src)); };
        document.head.appendChild(s);
      });
    }
    return scriptPromises[src];
  }

  // Headings and text in document order, for sectionChunks().
  function walk(root) {
    var items = [];
    var tw = root.ownerDocument.createTreeWalker(root, 5 /* SHOW_ELEMENT | SHOW_TEXT */);
    var node;
    while ((node = tw.nextNode())) {
      if (node.nodeType === 1) {
        if (/^H[1-4]$/.test(node.tagName)) {
          items.push({ h: node.textContent.replace(/\s+/g, ' ') });
          // Skip the heading's own text nodes.
          var last = node;
          while (last.lastChild) last = last.lastChild;
          tw.currentNode = last;
        }
      } else if (node.nodeValue.trim()) {
        items.push({ t: node.nodeValue });
      }
    }
    return items;
  }

  function pageSections(course, file, title, kind, weight) {
    var base = courseOf(course).base;
    return getText(base + file).then(function (html) {
      var doc = parseHtml(html);
      var root = doc.querySelector('main, [role="main"]') || doc.body;
      // A page's own H1 is its title; the chunks name the page instead.
      root.querySelectorAll('.page-head, .hero, .eyebrow').forEach(function (n) { n.remove(); });
      return sectionChunks(walk(root), { course: course, kind: kind, file: base + file, heading: title, frag: true, weight: weight || 1 });
    });
  }

  /* Each source: a label (for the status line) and a function returning a
     promise of chunks. */
  // One entry per course in assets/courses.js (scripts/check-courses.mjs).
  var SOURCES = {
    nremt: [
      ['notes', function () { return getJson('nremt/assets/study-notes.json').then(nremtNotesChunks); }],
      ['glossary', function () {
        return getJson('nremt/' + GLOSSARY.nremt).then(function (g) {
          return glossaryChunks('nremt', termsFromJson(g), function (x) { return { file: 'glossary.html#t-' + x.id }; });
        });
      }],
      ['tools', function () {
        return getText('nremt/tools.html').then(function (html) {
          var doc = parseHtml(html);
          return Array.prototype.map.call(doc.querySelectorAll('a.tool-card'), function (a) {
            var name = (a.querySelector('.name') || a).textContent.trim();
            var desc = (a.querySelector('.desc') || {}).textContent || '';
            return { course: 'nremt', kind: 'Tools', file: 'nremt/' + a.getAttribute('href'), heading: name, text: name + '. ' + desc.trim(), weight: 3 };
          }).filter(function (c) { return !/search\.html$/.test(c.file); });
        });
      }],
      ['reference pages', function () {
        return Promise.all([
          ['mnemonics.html', 'Mnemonics'], ['flowcharts.html', 'Flow Diagrams'], ['skillsheets.html', 'Skill Sheets'],
          ['formulary.html', 'Drug Formulary'], ['reference-cards.html', 'Reference Cards'],
        ].map(function (p) { return pageSections('nremt', p[0], p[1], 'Reference').catch(function () { return []; }); }))
          .then(function (all) { return [].concat.apply([], all); });
      }],
      ['practice questions', function () {
        return Promise.all([
          getJson('nremt/assets/questions-core.json'),
          getJson('nremt/assets/explanations.json').catch(function () { return []; }),
        ]).then(function (b) { return nremtQuestionChunks(b[0], b[1]); });
      }],
    ],
    ochem: [
      ['lessons and tools', function () {
        return Promise.all([loadScript('ochem/assets/curriculum.js'), loadScript('ochem/assets/tools-registry.js').catch(function () {})])
          .then(function () { return ochemStructureChunks(window.OchemCurriculum).concat(ochemToolChunks(window.OchemTools)); });
      }],
      ['glossary', function () {
        if (!GLOSSARY.ochem) return Promise.resolve([]);
        return getJson('ochem/' + GLOSSARY.ochem).then(function (g) {
          return glossaryChunks('ochem', termsFromJson(g), function (x) {
            return x.id ? { file: 'glossary.html#t-' + x.id } : { file: 'glossary.html', frag: true };
          });
        });
      }],
      ['textbook', function () {
        return loadScript('ochem/assets/curriculum.js').then(function () {
          return Promise.all(ochemTopics(window.OchemCurriculum).map(function (e) {
            return getText('ochem/notes/' + e.topic.id + '.html').then(function (html) {
              var doc = parseHtml(html);
              var out = [];
              var heading = e.topic.title;
              doc.body.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,td,figcaption').forEach(function (el) {
                var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
                if (!text) return;
                if (/^H[1-4]$/.test(el.tagName)) { heading = text; return; }
                if (text.length < 25) return;
                out.push({ course: 'ochem', kind: 'Textbook', file: 'ochem/learn.html#' + e.topic.id,
                  heading: heading === e.topic.title ? e.topic.title : e.topic.title + ' — ' + heading, text: text, frag: true });
              });
              return out;
            }).catch(function () { return []; });
          })).then(function (all) { return [].concat.apply([], all); });
        });
      }],
      ['practice questions', function () {
        return loadScript('ochem/assets/curriculum.js').then(function () {
          return Promise.all([
            getJson('ochem/assets/practice-bank-core.json'),
            getJson('ochem/assets/practice-bank-why.json').catch(function () { return {}; }),
          ]);
        }).then(function (b) { return ochemQuestionChunks(b[0], b[1], window.OchemCurriculum); });
      }],
    ],
    anp: [
      ['lessons and tools', function () {
        return loadScript('anatomy-physiology/assets/anp-curriculum.js').then(function () {
          return anpStructureChunks(window.AnpCurriculum, window.AnpTools);
        });
      }],
      ['glossary', function () {
        return getJson('anatomy-physiology/assets/glossary.json').then(function (g) {
          return glossaryChunks('anp', termsFromJson(g), function (x) { return { file: 'glossary.html#t-' + x.id }; });
        });
      }],
      ['notes', function () {
        return getJson('anatomy-physiology/assets/notes-index.json').then(function (list) {
          return Promise.all(list.map(function (n) {
            // [/] rather than \/: "\//" reads as a comment to scripts/check-courses.mjs.
            var id = String(n.file).replace(/^.*[/]notes[/]/, '').replace(/\.html$/, '');
            var href = 'anatomy-physiology/notes/' + id + '.html';
            return getText(href).then(function (html) {
              var doc = parseHtml(html);
              var root = doc.querySelector('.anp-prose') || doc.querySelector('main') || doc.body;
              root.querySelectorAll('.anp-crumb,.anp-onward').forEach(function (x) { x.remove(); });
              var out = [];
              var heading = n.title;
              var hid = '';
              root.querySelectorAll('h2,h3,p,li,td,th,dd,figcaption').forEach(function (el) {
                var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
                if (!text) return;
                if (/^H[23]$/.test(el.tagName)) { heading = text; hid = el.id || ''; return; }
                if (text.length < 30) return;
                out.push({ course: 'anp', kind: 'Notes', file: href + (hid ? '#' + hid : ''), frag: true,
                  heading: heading === n.title ? n.title : n.title + ' — ' + heading, text: text });
              });
              return out;
            }).catch(function () { return []; });
          })).then(function (all) { return [].concat.apply([], all); });
        });
      }],
    ],
    // AP® Biology: only what is published. The curriculum, glossary and notes
    // index come from scripts/build-apbio.mjs and are empty until a unit is
    // published, so the course adds nothing to a search before then.
    apbio: [
      ['lessons', function () {
        return loadScript('bio/assets/bio-curriculum.js').then(function () {
          return apbioStructureChunks(window.ApBioCurriculum);
        });
      }],
      ['glossary', function () {
        return getJson('bio/assets/glossary.json').then(function (g) {
          return glossaryChunks('apbio', termsFromJson(g), function (x) { return { file: 'glossary.html#t-' + x.id }; });
        });
      }],
      ['notes', function () {
        return getJson('bio/assets/notes-index.json').then(function (list) {
          return Promise.all(list.map(function (n) {
            var id = String(n.file).replace(/^.*[/]notes[/]/, '').replace(/\.html$/, '');
            var href = 'bio/notes/' + id + '.html';
            return getText(href).then(function (html) {
              var doc = parseHtml(html);
              var root = doc.querySelector('.bio-prose') || doc.querySelector('main') || doc.body;
              root.querySelectorAll('.bio-crumb,.bio-onward,.bio-share,.bio-foot').forEach(function (x) { x.remove(); });
              var out = [];
              var heading = n.title;
              var hid = '';
              root.querySelectorAll('h2,h3,p,li,td,th,dd,figcaption').forEach(function (el) {
                var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
                if (!text) return;
                if (/^H[23]$/.test(el.tagName)) { heading = text; hid = el.id || ''; return; }
                if (text.length < 30) return;
                out.push({ course: 'apbio', kind: 'Notes', file: href + (hid ? '#' + hid : ''), frag: true,
                  heading: heading === n.title ? n.title : n.title + ' — ' + heading, text: text });
              });
              return out;
            }).catch(function () { return []; });
          })).then(function (all) { return [].concat.apply([], all); });
        });
      }],
    ],
  };

  /* Starts a course loading (once) and reports each source as it lands:
     onChunks(courseKey, chunks) per source, onDone(courseKey, missing[]) at the
     end with the labels of sources that failed. Returns a promise for the
     whole course. */
  var started = {};
  function load(courseKey, onChunks, onDone) {
    if (started[courseKey]) return started[courseKey];
    var missing = [];
    started[courseKey] = Promise.all((SOURCES[courseKey] || []).map(function (src) {
      return src[1]().then(function (chunks) {
        if (chunks && chunks.length) onChunks(courseKey, chunks);
      }, function () { missing.push(src[0]); });
    })).then(function () { if (onDone) onDone(courseKey, missing); });
    return started[courseKey];
  }

  window.LevlSearchAll = {
    COURSES: COURSES,
    GLOSSARY: GLOSSARY,
    courseOf: courseOf,
    urlKey: urlKey,
    parseCourse: parseCourse,
    scopeKeys: scopeKeys,
    decodeEntities: decodeEntities,
    stripHtml: stripHtml,
    splitText: splitText,
    sectionChunks: sectionChunks,
    inlineTerms: inlineTerms,
    termsFromJson: termsFromJson,
    nremtNotesChunks: nremtNotesChunks,
    nremtGlossaryChunks: nremtGlossaryChunks,
    nremtQuestionChunks: nremtQuestionChunks,
    ochemStructureChunks: ochemStructureChunks,
    ochemToolChunks: ochemToolChunks,
    ochemQuestionChunks: ochemQuestionChunks,
    glossaryChunks: glossaryChunks,
    anpStructureChunks: anpStructureChunks,
    groupByCourse: groupByCourse,
    countByCourse: countByCourse,
    load: load,
  };
})(window);
