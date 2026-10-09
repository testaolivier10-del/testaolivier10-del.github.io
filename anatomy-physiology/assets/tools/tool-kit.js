/* Shared pieces for the A&P tools (docs/tools-upgrade.md, Phase 1 A&P).
   Loaded on every tool page before the tool's own script.

   AnpToolKit.strip(host, opts)   the "Keep going" strip, after an answer or
                                  at the end of an item. Replaces any strip
                                  already in host, else appends one.
     opts.topic       topic id: a Lesson and a Notes link (built topics only)
     opts.terms       glossary ids to link first (word roots, lab labels)
     opts.text        the item's own text: glossary terms of the topic that
                      appear in it are linked next (up to opts.max, 3)
     opts.structures  names of anatomical structures: each that is a body map
                      Browse-by-name label gets "See it on the 3D body"
   AnpToolKit.bodyName(name)      the body map label for name, or ''
   AnpToolKit.picker(host, opts)  a compact chooser: a disclosure with a
                                  search box over the whole item list
     opts.label   'Choose a loop'      opts.noun  'loops'
     opts.current the current item id  opts.allHref / opts.onAll  the full list
     opts.groups  [{ title, items: [{ id, title, meta, done, href }] }]
     opts.onPick(id)  called for items without href

   Glossary terms come from assets/glossary.json through the shared popup
   module (LevlGlossary.load, one fetch per page), so a term is linked only
   when the published glossary has it; the links carry class "gl" so they
   show the definition on hover or first tap. */
(function(){
  'use strict';
  if(window.AnpToolKit) return;
  var BASE = window.ANP_BASE || '../';

  /* The body map's Browse-by-name labels (nremt/body-map.html: GROUP_CONTENT
     and POINTS_3D names). scripts/test/anp-tool-kit.test.mjs fails when this
     list and the body map disagree. */
  var BODY = ['2nd intercostal space, midclavicular line', 'Adrenal gland', 'Aorta', 'Appendix', 'Brachial artery', 'Brain',
    'Carotid artery', 'Cervical spine (C1–C7)', 'Clavicle', 'Colon', 'Costovertebral angle (CVA)', 'Diaphragm', 'Dorsalis pedis',
    'Esophagus', 'Eye', 'Femoral artery', 'Femur', 'Foot bones', 'Frontal bone', 'Gall bladder', 'Hand bones', 'Heart', 'Humerus',
    'Iliac crest', 'Jugular vein', 'Kidney', 'Liver', 'Lumbar spine (L1–L5)', 'Lung', 'Mandible', 'Medial malleolus', 'Mitral valve',
    'Nipple line', 'Occipital bone', 'Pancreas', 'Parietal bones', 'Patella', 'Pelvis (pelvic ring)', 'Popliteal artery',
    'Posterior lung fields (bases)', 'Posterior tibial artery', 'Prostate gland', 'Pulmonary valve', 'Pulmonary vessels & vena cava',
    'Radial artery', 'Radius & ulna', 'Rectum', 'Rib cage', 'Sacrum & coccyx', 'Scapula', 'Skin', 'Small intestine', 'Spinal cord',
    'Spleen', 'Sternum', 'Stomach', 'Temporal bones', 'Testis', 'Thoracic spine (T1–T12)', 'Thyroid cartilage (larynx)',
    'Tibia / fibula', 'Trachea', 'Tricuspid valve', 'Umbilicus', 'Ureters', 'Urinary bladder', 'Xiphoid process'];
  /* Course names for the same structure that differ from the label only in
     number or spelling. Nothing else is matched: no partial names, no
     synonyms that could mean another structure. */
  var ALIAS = {
    'gallbladder': 'Gall bladder', 'ureter': 'Ureters', 'testes': 'Testis', 'adrenal glands': 'Adrenal gland',
    'right lung': 'Lung', 'left lung': 'Lung', 'lungs': 'Lung', 'kidneys': 'Kidney', 'iliac crests': 'Iliac crest',
    'bladder': 'Urinary bladder', 'dorsalis pedis artery': 'Dorsalis pedis', 'pulmonary semilunar valve': 'Pulmonary valve',
    'bicuspid (mitral) valve': 'Mitral valve'
  };
  var BY = {};
  BODY.forEach(function(n){ BY[n.toLowerCase()] = n; });
  function bodyName(name){
    var k = String(name || '').replace(/<[^>]+>/g, '').trim().toLowerCase();
    return BY[k] || ALIAS[k] || '';
  }

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function topicInfo(id){ var ts = (window.AnpCurriculum || {}).topics || []; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }

  var glossary = null;
  function loadGlossary(){
    if(glossary) return glossary;
    glossary = (window.LevlGlossary && window.LevlGlossary.load ? window.LevlGlossary.load()
      : fetch(BASE + 'assets/glossary.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
          .then(function(d){ d.byId = {}; (d.terms || []).forEach(function(t){ d.byId[t.id] = t; }); return d; }));
    return glossary;
  }
  function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function mentions(text, t){
    return [t.term].concat(t.aka || []).some(function(k){
      return k && k.length > 2 && new RegExp('(^|[^a-z0-9])' + reEsc(k.toLowerCase()) + '(e?s)?($|[^a-z0-9])').test(text);
    });
  }
  function pickTerms(d, opts){
    var out = [], max = opts.max || 3;
    (opts.terms || []).forEach(function(id){ var t = d.byId[id]; if(t && out.indexOf(t) < 0 && out.length < max) out.push(t); });
    if(opts.topic && out.length < max){
      var text = String(opts.text || '').replace(/<[^>]+>/g, ' ').toLowerCase();
      (d.terms || []).forEach(function(t){
        if(out.length >= max || t.topic !== opts.topic || out.indexOf(t) > -1) return;
        if(text && mentions(text, t)) out.push(t);
      });
    }
    return out;
  }

  var uid = 0;
  function strip(host, opts){
    if(!host) return null;
    opts = opts || {};
    var t = opts.topic && topicInfo(opts.topic);
    var seen = {}, bodies = [];
    (opts.structures || []).forEach(function(n){ var b = bodyName(n); if(b && !seen[b]){ seen[b] = 1; bodies.push(b); } });
    var id = 'kg' + (++uid);
    var links = '';
    if(t && t.built){
      links += '<a class="kg-link" href="' + esc(BASE + 'lessons/' + t.id + '.html') + '"><span class="kg-k">Lesson</span> ' + esc(t.title) + '</a>' +
        '<a class="kg-link" href="' + esc(BASE + 'notes/' + t.id + '.html') + '"><span class="kg-k">Notes</span> ' + esc(t.title) + '</a>';
    }
    links += bodies.slice(0, 2).map(function(b){
      return '<a class="kg-link kg-3d" href="' + esc(BASE + '../nremt/body-map.html?focus=' + encodeURIComponent(b)) + '"><span class="kg-k">3D</span> See it on the 3D body: ' + esc(b) + '</a>';
    }).join('');
    var el = host.querySelector(':scope > .kg') || document.createElement('nav');
    el.className = 'kg';
    el.setAttribute('aria-labelledby', id + '-h');
    el.innerHTML = '<h3 class="kg-h" id="' + id + '-h">Keep going</h3><div class="kg-row">' + links +
      '<span class="kg-terms" hidden></span></div>';
    if(!el.parentNode) host.appendChild(el);
    if(!links && !(opts.terms || []).length && !opts.topic){ el.hidden = true; return el; }
    var slot = el.querySelector('.kg-terms');
    loadGlossary().then(function(d){
      var ts = pickTerms(d, opts);
      if(!ts.length){ if(!links) el.hidden = true; return; }
      slot.innerHTML = '<span class="kg-k kg-gk">Glossary</span>' + ts.map(function(x){
        return '<a class="kg-term gl" data-c="' + esc(x.id) + '" href="' + esc(BASE + 'glossary.html#t-' + x.id) + '">' + esc(x.term) + '</a>';
      }).join('');
      slot.hidden = false;
    }).catch(function(){ if(!links) el.hidden = true; });
    return el;
  }

  /* ------------------------------------------------------------ picker */
  var pid = 0;
  function picker(host, opts){
    if(!host) return null;
    var n = 0, cur = null;
    opts.groups.forEach(function(g){ g.items.forEach(function(it){ n++; if(it.id === opts.current) cur = it; }); });
    var p = 'kp' + (++pid);
    var el = document.createElement('details');
    el.className = 'kp';
    el.innerHTML = '<summary class="kp-sum"><span class="kp-label">' + esc(opts.label) + '</span>' +
      (cur ? '<span class="kp-cur">' + esc(cur.title) + '</span>' : '') + '<span class="kp-n">' + n + ' ' + esc(opts.noun) + '</span></summary>' +
      '<div class="kp-body">' +
        '<label class="kp-search" for="' + p + '-q"><span class="sr-only">Search ' + esc(opts.noun) + '</span>' +
        '<input id="' + p + '-q" type="search" autocomplete="off" placeholder="Search ' + n + ' ' + esc(opts.noun) + '"></label>' +
        '<p class="sr-only" id="' + p + '-s" role="status"></p>' +
        '<div class="kp-list">' + opts.groups.map(function(g){
          if(!g.items.length) return '';
          return '<div class="kp-group">' + (g.title ? '<h3 class="kp-gh">' + esc(g.title) + '</h3>' : '') + '<ul>' + g.items.map(function(it){
            var inner = '<span class="kp-t">' + esc(it.title) + '</span>' + (it.meta ? '<span class="kp-m">' + esc(it.meta) + '</span>' : '') +
              (it.done ? '<span class="kp-done" aria-hidden="true">✓</span><span class="sr-only">, done</span>' : '');
            var attrs = ' class="kp-item" data-id="' + esc(it.id) + '" data-hay="' + esc((it.title + ' ' + (it.meta || '') + ' ' + (g.title || '')).toLowerCase()) + '"' + (it.id === opts.current ? ' aria-current="true"' : '');
            return '<li>' + (it.href ? '<a' + attrs + ' href="' + esc(it.href) + '">' + inner + '</a>' : '<button type="button"' + attrs + '>' + inner + '</button>') + '</li>';
          }).join('') + '</ul></div>';
        }).join('') + '</div>' +
        '<p class="kp-none" hidden>Nothing matches. Try another word.</p>' +
        (opts.allHref || opts.onAll ? '<p class="kp-all"><a href="' + esc(opts.allHref || '#') + '" class="kp-alllink">' + esc(opts.allLabel || 'Browse the full list') + ' &rarr;</a></p>' : '') +
      '</div>';
    host.appendChild(el);
    var q = el.querySelector('input'), st = el.querySelector('[role="status"]'), none = el.querySelector('.kp-none'), timer = 0;
    function filter(){
      var words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean), shown = 0;
      el.querySelectorAll('.kp-group').forEach(function(g){
        var k = 0;
        g.querySelectorAll('.kp-item').forEach(function(b){
          var hay = b.getAttribute('data-hay'), on = words.every(function(w){ return hay.indexOf(w) > -1; });
          b.parentNode.hidden = !on; if(on) k++;
        });
        g.hidden = !k; shown += k;
      });
      none.hidden = shown > 0;
      clearTimeout(timer);
      timer = setTimeout(function(){ st.textContent = words.length ? shown + (shown === 1 ? ' match' : ' matches') : ''; }, 400);
    }
    q.addEventListener('input', filter);
    el.addEventListener('toggle', function(){
      if(!el.open) return;
      var c = el.querySelector('.kp-item[aria-current="true"]');
      if(c){ var list = el.querySelector('.kp-list'); list.scrollTop = Math.max(0, list.scrollTop + c.getBoundingClientRect().top - list.getBoundingClientRect().top - 48); }
    });
    el.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && el.open){ e.preventDefault(); el.open = false; el.querySelector('summary').focus(); }
    });
    el.querySelectorAll('button.kp-item').forEach(function(b){
      b.addEventListener('click', function(){ el.open = false; if(opts.onPick) opts.onPick(b.getAttribute('data-id')); });
    });
    el.querySelectorAll('a.kp-item').forEach(function(a){ a.addEventListener('click', function(){ el.open = false; }); });
    var all = el.querySelector('.kp-alllink');
    if(all && opts.onAll) all.addEventListener('click', function(e){ e.preventDefault(); el.open = false; opts.onAll(); });
    return el;
  }

  /* The learner's record for an item id: 'new', 'right' or 'missed'. */
  function status(id){
    try{ var r = window.AnpCore && window.AnpCore.load().q[id]; if(!r || !r.n) return 'new'; return r.right ? 'right' : 'missed'; }catch(e){ return 'new'; }
  }

  window.AnpToolKit = { strip: strip, picker: picker, bodyName: bodyName, status: status, BODY: BODY, ALIAS: ALIAS };
})();
