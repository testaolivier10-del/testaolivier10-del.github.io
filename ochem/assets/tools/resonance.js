/* Resonance, tools v2 (docs/tools-v2-resonance-brief.md; standard: docs/tools-v2-standard.md).

   One screen, one idea: moving electrons turns one resonance form into another, and the real molecule is the
   blend of them, closer to the better forms. The student grabs a lone pair or a π bond on the molecule and drags
   it one place over (the curved arrow is drawn behind it, as on paper); the electrons settle, the charges move, and
   the row of forms under the picture lights the one now shown, each tagged major, minor or equal. Beside it the
   real molecule (the hybrid) is drawn with its π electrons spread and its charge shared. A move that would leave
   an atom with ten electrons is held, with that atom ringed, until a second push makes room; a move that is not
   resonance (it breaks or makes a σ bond, or starts where there are no electrons) springs back with the reason.

   Which moves are resonance, how many forms a species has and how they rank all come from resonance-engine.js,
   which enumerates rather than looks up. The only rule added here is the tie break for a benzene ring (a form that
   keeps the ring's three alternating double bonds outranks one that does not, when the engine's own rules tie):
   docs/ochem-needs-author.md, "res-v2-benzyl".

   EXPLORE is free play. TEST YOURSELF holds the old tool's three jobs with their old grading: find every form
   (the count, two hints and "Show me one I'm missing"), which of two species is more stabilized (call it first),
   and the six question Check yourself with the same record ids (the species id). */
(function(){
  var Mol = window.OchemMolecules;
  var C = window.OchemChem;
  var R = window.OchemResonance;
  var root = document.getElementById('resRoot');
  if(!Mol || !C || !R || !root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  var SPECIES = [
    { id:'acetate-ion',  label:'Acetate' },
    { id:'formate',      label:'Formate' },
    { id:'allyl-cation', label:'Allyl cation' },
    { id:'allyl-anion',  label:'Allyl anion' },
    { id:'enolate',      label:'Enolate' },
    { id:'acetamide',    label:'Amide' },
    { id:'nitromethane', label:'Nitro group' },
    { id:'carbonate',    label:'Carbonate' },
    { id:'benzene',      label:'Benzene' },
    { id:'phenoxide',    label:'Phenoxide' },
    { id:'benzyl-cation',label:'Benzyl cation' },
    { id:'nitrate',      label:'Nitrate' },
    { id:'ozone',        label:'Ozone' }
  ];
  var FIRST = 6;

  /* ====================================================================== */
  /* The chemistry the picture needs, on top of the engine                    */
  /* ====================================================================== */

  function heavy(st, k){ var a = st.atoms[k]; return a && a.el && a.el !== 'H'; }
  function fc(st, k){ var a = st.atoms[k]; return a && a.el && !a.group ? C.formalCharge(st, k) : 0; }
  function bondKey(b){ return 'bond:' + b.a + '-' + b.b; }
  function sameBond(st, a, b){ var x = C.findBond(st, a, b); return x ? bondKey(x) : null; }

  /* Rings of six heavy atoms (benzene, phenoxide, the benzyl cation). */
  function sixRings(st){
    var adj = {}, out = [], seen = {};
    Object.keys(st.atoms).forEach(function(k){ if(heavy(st, k)) adj[k] = C.neighbors(st, k).filter(function(n){ return heavy(st, n); }); });
    Object.keys(adj).forEach(function(s){
      (function walk(path){
        var last = path[path.length - 1];
        adj[last].forEach(function(n){
          if(path.length === 6){ if(n === s){ var id = path.slice().sort().join(','); if(!seen[id]){ seen[id] = 1; out.push(path.slice()); } } return; }
          if(path.indexOf(n) < 0 && n > s) walk(path.concat([n]));
        });
      })([s]);
    });
    return out;
  }
  // a ring drawn with its three alternating double bonds inside it (a Kekulé benzene ring)
  function kekule(st){
    return sixRings(st).some(function(ring){
      var os = ring.map(function(k, i){ var b = C.findBond(st, k, ring[(i + 1) % 6]); return b ? b.order : 0; });
      return (os.join('') === '212121' || os.join('') === '121212') && ring.every(function(k){ return st.atoms[k].el === 'C'; });
    });
  }

  /* Rank a species' forms: the engine's score, with one tie break (a benzene ring kept whole). Returns the forms in
     order, best first, each with its tier and, for a minor one, the rule that puts it below the best. */
  function rankForms(forms){
    var sc = forms.map(function(f){ return R.score(f).total; });
    var best = Math.max.apply(null, sc);
    var tied = forms.map(function(f, i){ return i; }).filter(function(i){ return Math.abs(sc[i] - best) < 1e-9; });
    var aro = tied.filter(function(i){ return kekule(forms[i]); });
    var majors = aro.length && aro.length < tied.length ? aro : tied;
    var list = forms.map(function(f, i){
      var major = majors.indexOf(i) >= 0, rule = null;
      if(!major){ var c = R.compare(f, forms[majors[0]]); rule = c.winner === 'tie' ? 'ring' : c.rule; }
      return { st: f, key: R.key(f), major: major, rule: rule, score: sc[i] + (major ? 0.5 : 0), i: i };
    });
    list.sort(function(a, b){ return (b.major - a.major) || (b.score - a.score) || (a.i - b.i); });
    var all = majors.length === forms.length;
    list.forEach(function(x){ x.tag = all ? 'equal' : x.major ? 'major' : 'minor'; });
    return list;
  }

  function charged(st){
    return Object.keys(st.atoms).filter(function(k){ return fc(st, k) !== 0; }).map(function(k){ return { k: k, el: st.atoms[k].el, q: fc(st, k) }; });
  }
  function short(st){
    return Object.keys(st.atoms).filter(function(k){ var a = st.atoms[k]; return a.el && !a.group && a.el !== 'H' && C.electronCount(st, k) < C.octetOf(st, k); });
  }
  function over(st){
    return Object.keys(st.atoms).filter(function(k){ var a = st.atoms[k]; return a.el && !a.group && a.el !== 'H' && C.electronCount(st, k) > C.octetOf(st, k); });
  }
  function sign(q){ return q < 0 ? (q === -1 ? '−' : -q + '−') : (q === 1 ? '+' : q + '+'); }

  /* The smallest set of legal moves (at most three) that turns one structure into another. */
  var memo = {};
  function arrowsBetween(a, b){
    var mk = R.key(a) + '>' + R.key(b);
    if(mk in memo) return memo[mk];
    return (memo[mk] = searchArrows(a, b));
  }
  function searchArrows(a, b){
    var want = R.key(b), moves = R.legalMoves(a);
    for(var size = 1; size <= 3; size++){
      var found = null;
      (function build(acc, start){
        if(found) return;
        if(acc.length === size){ var v = R.validate(a, acc); if(v.valid && R.key(v.structure) === want) found = acc.slice(); return; }
        for(var i = start; i < moves.length && !found; i++){ acc.push(moves[i]); build(acc, i + 1); acc.pop(); }
      })([], 0);
      if(found) return found;
    }
    return null;
  }
  /* A path of steps through the forms when no three arrows reach directly (breadth first over the forms). */
  function pathTo(from, to, forms){
    var direct = arrowsBetween(from, to);
    if(direct) return [{ arrows: direct, st: to }];
    var q = [{ st: from, path: [] }], seen = {}; seen[R.key(from)] = 1;
    while(q.length){
      var cur = q.shift();
      for(var i = 0; i < forms.length; i++){
        var f = forms[i], k = R.key(f);
        if(seen[k]) continue;
        var ar = arrowsBetween(cur.st, f);
        if(!ar) continue;
        var p = cur.path.concat([{ arrows: ar, st: f }]);
        if(k === R.key(to)) return p;
        seen[k] = 1; q.push({ st: f, path: p });
      }
    }
    return null;
  }

  /* Could this held set of arrows (one atom over its octet) still become a form with up to three arrows in all? */
  function completable(st, arrows){
    var left = 3 - arrows.length;
    if(left < 1) return false;
    var moves = R.legalMoves(st), ok = false;
    (function build(acc, start){
      if(ok) return;
      if(acc.length){ var v = R.validate(st, arrows.concat(acc)); if(v.valid){ ok = true; return; } }
      if(acc.length === left) return;
      for(var i = start; i < moves.length && !ok; i++){ acc.push(moves[i]); build(acc, i + 1); acc.pop(); }
    })([], 0);
    return ok;
  }

  /* The real molecule: per atom, whether its charge is the same in every form or shared, and (only when every form
     is equally good, so the plain average is exact by symmetry) the share as a fraction. Per bond, the lowest and
     highest order across the forms. */
  function hybridOf(rk){
    var forms = rk.map(function(x){ return x.st; }), st = forms[0], equal = rk[0].tag === 'equal';
    var atoms = {}, bonds = {};
    Object.keys(st.atoms).forEach(function(k){
      var a = st.atoms[k];
      if(!a.el || a.group) return;
      var qs = forms.map(function(f){ return fc(f, k); });
      var same = qs.every(function(q){ return q === qs[0]; });
      if(same){ if(qs[0]) atoms[k] = { fixed: qs[0] }; return; }
      var mean = qs.reduce(function(t, q){ return t + q; }, 0) / qs.length;
      var big = rk.some(function(x, i){ return x.major && qs[i] !== 0; });
      atoms[k] = { neg: qs.some(function(q){ return q < 0; }), pos: qs.some(function(q){ return q > 0; }), big: big, mean: equal ? mean : null };
    });
    st.bonds.forEach(function(b){
      var os = forms.map(function(f){ var x = C.findBond(f, b.a, b.b); return x ? x.order : 0; });
      bonds[bondKey(b)] = { lo: Math.min.apply(null, os), hi: Math.max.apply(null, os) };
    });
    return { atoms: atoms, bonds: bonds, equal: equal };
  }
  // the engine's sentences use dashes as punctuation; the page does not
  function undash(t){ return String(t).replace(/\s+—\s+/g, ', ').replace(/—/g, ', '); }
  function fraction(x){
    var n = Math.abs(x), F = { '1/2':'½', '1/3':'⅓', '2/3':'⅔', '1/4':'¼', '3/4':'¾', '1/5':'⅕', '2/5':'⅖', '3/5':'⅗', '4/5':'⅘', '1/6':'⅙', '5/6':'⅚' };
    for(var d = 1; d <= 6; d++){
      var num = Math.round(n * d);
      if(Math.abs(num / d - n) < 0.005){ var s = d === 1 ? String(num) : (F[num + '/' + d] || num + '/' + d); return (x < 0 ? '−' : '+') + s; }
    }
    return (x < 0 ? '−' : '+') + n.toFixed(2);
  }

  /* ---- Compare two (Test yourself), the old judge, unchanged except that "equally good" counts the majors as
     ranked above (the benzene ring tie break). */
  function stabilization(st){
    var forms = R.contributors(st), rk = rankForms(forms);
    var carriers = {}, comfort = 0, n = 0, net = 0;
    Object.keys(st.atoms).forEach(function(k){ net += C.formalCharge(st, k); });
    forms.forEach(function(f){
      Object.keys(f.atoms).forEach(function(k){
        var a = f.atoms[k];
        if(!a.el || a.group) return;
        if(C.formalCharge(f, k) === 0) return;
        carriers[k] = a.el;
      });
    });
    Object.keys(carriers).forEach(function(k){
      var info = C.info(carriers[k]);
      var en = info ? info.en : 2.5;
      comfort += (net < 0 ? en : -en);
      n++;
    });
    return {
      forms: forms, rk: rk, count: forms.length, equivalentMajors: rk.filter(function(x){ return x.major; }).length,
      spread: n, net: net,
      carriers: Object.keys(carriers).map(function(k){ return carriers[k]; }),
      comfort: n ? comfort / n : 0
    };
  }
  function judge(a, b){
    if((a.count > 1) !== (b.count > 1)){
      var w = a.count > 1 ? 'a' : 'b';
      return { winner:w, rule:'Resonance at all',
        text:'One of these delocalizes and the other does not. A charge stuck on a single atom has nothing helping it; ' +
             'a charge that can be drawn in more than one place is spread over all of them at once. Nothing further down the list comes close to mattering as much.' };
    }
    if(a.net !== 0 && b.net !== 0 && (a.net > 0) !== (b.net > 0)){
      return { winner:'tie', rule:'Different questions',
        text:'One of these is an anion and the other a cation. Both are helped by resonance, but what counts as a good ' +
             'home for the charge is opposite in the two cases: the anion wants the most electronegative atom it can ' +
             'reach and the cation wants the least. Compare two of the same sign and the question has an answer.' };
    }
    if((a.spread === 0) !== (b.spread === 0)){
      return { winner:'tie', rule:'Different questions',
        text:'One of these carries a charge and the other does not. Resonance helps both, but it is doing two different ' +
             'jobs (spreading a charge in one case, delocalizing a neutral π system in the other) and there is no ' +
             'honest way to rank those against each other. Compare two anions, or two neutral systems, and the question ' +
             'becomes answerable.' };
    }
    if(a.spread && b.spread && Math.abs(a.comfort - b.comfort) > 0.05){
      var w2 = a.comfort > b.comfort ? 'a' : 'b';
      var hi = w2 === 'a' ? a : b, lo = w2 === 'a' ? b : a;
      var neg = a.net < 0;
      return { winner:w2, rule:'What the charge lands on',
        text:'Both spread the charge, but not onto equally good atoms. ' +
             (neg
               ? 'A negative charge is far more comfortable on oxygen than on carbon, and moving it onto another oxygen ' +
                 'is worth more than moving it onto three more carbons, which is why acetate beats phenoxide even though ' +
                 'phenoxide spreads over more atoms.'
               : 'A positive charge is better off on the least electronegative atom available, since that is the atom ' +
                 'least reluctant to give up electron density in the first place.') +
             ' Here the winner shares it with ' + hi.carriers.join(', ') + '; the other with ' + lo.carriers.join(', ') + '.' };
    }
    if(a.equivalentMajors !== b.equivalentMajors){
      var w3 = a.equivalentMajors > b.equivalentMajors ? 'a' : 'b';
      var hi3 = w3 === 'a' ? a : b, lo3 = w3 === 'a' ? b : a;
      return { winner:w3, rule:'Equivalent contributors',
        text:'The charge lands on the same kind of atom in both, so what separates them is how evenly it is shared. ' +
             hi3.equivalentMajors + ' of the winner’s forms are equally good, which means the charge genuinely sits ' +
             'between them rather than mostly in one place and occasionally elsewhere. ' +
             (lo3.equivalentMajors === 1
               ? 'The other has a single best form, so most of the charge really is where that form puts it.'
               : 'The other manages ' + lo3.equivalentMajors + '.') };
    }
    if(a.spread !== b.spread){
      var w4 = a.spread > b.spread ? 'a' : 'b';
      return { winner:w4, rule:'How far it spreads',
        text:'Same atoms, same evenness, so it comes down to how many places the charge can be. One moves it over ' +
             Math.max(a.spread, b.spread) + ' atoms and the other over ' + Math.min(a.spread, b.spread) + '. ' +
             'The same charge spread more thinly is a lower energy.' };
    }
    return { winner:'tie', rule:'Level',
      text:'By every rule that separates these, they come out the same. That happens, and the honest answer is that ' +
           'resonance does not distinguish them: whatever separates them is something else, like induction or solvation.' };
  }

  /* The check yourself quiz, unchanged (slug resonance, one record id per species). Mounted with or without the
     studio, so the page's quiz always works. */
  function mountQuiz(){
    if(!window.OchemToolQuiz) return;
    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'resonance',
      rounds: 6,
      intro: 'How far the charge really spreads, and which form carries the most weight.',
      make: function(recent){
        var pool = SPECIES.filter(function(s){ return recent.indexOf(s.id) < 0; });
        if(!pool.length) pool = SPECIES;
        var pick = pool[Math.floor(Math.random() * pool.length)];
        /* contributors(), not enumerate(): the count the forms row shows is the count asked about. */
        var startMol = Mol.get(pick.id);
        if(!startMol) return null;
        var forms = R.contributors(C.fromMolecule(startMol));
        if(!forms || !forms.length) return null;
        var n = forms.length;
        var opts = [n];
        [n + 1, n - 1, n + 2, n * 2].forEach(function(v){
          if(v >= 1 && opts.indexOf(v) < 0 && opts.length < 4) opts.push(v);
        });
        return {
          id: pick.id,
          term: 'resonance-structures', topic: 'resonance',
          prompt: 'How many contributing <b>resonance forms</b> does <b>' + esc(pick.label) + '</b> have?',
          options: opts.map(function(v){ return { id:String(v), label:String(v), correct: v === n }; }),
          explain: '<b>' + n + '</b>. Counting them is not a memory exercise: every form is one legal ' +
                   'push of a lone pair or a π bond away from another, so the count is however many ' +
                   'distinct structures that operation can reach before it starts repeating itself. ' +
                   /* Phenoxide and the benzyl cation come out at five here and four in most textbooks: a benzene
                      ring has its own two Kekulé forms, which a book showing "the three delocalized forms" is
                      quietly holding fixed. */
                   (/phenoxide|benzyl/.test(pick.id)
                     ? 'That includes the ring’s own two Kekulé forms; a textbook picture usually holds those fixed and shows you one fewer. '
                     : '') +
                   'Push the electrons in the picture above and the row of forms shows each one you reach.'
        };
      }
    });
  }

  var view = {};
  window.OchemResonanceModel = { view: view, key: R.key, rankForms: rankForms, hybridOf: hybridOf, kekule: kekule, arrowsBetween: arrowsBetween,
    pathTo: pathTo, completable: completable, stabilization: stabilization, judge: judge, fraction: fraction, SPECIES: SPECIES };

  /* ====================================================================== */
  /* The page                                                                */
  /* ====================================================================== */
  var K = window.LevlKit2, studio = window.OchemStudio || null, Kit = window.OchemStudioKit;
  if(!K || !studio || !Kit || !Kit.kit2){
    mountQuiz();
    if(root.insertAdjacentHTML) root.insertAdjacentHTML('beforeend', '<p class="tnote tnote--info">This tool needs a newer copy of the page. Reload to get it.</p>');
    return;
  }
  function mk(tag, cls, html){ var d = document.createElement(tag); if(cls) d.className = cls; if(html != null) d.innerHTML = html; return d; }
  function byId(id){ return document.getElementById(id); }
  var NS = 'http://www.w3.org/2000/svg';
  function f1(x){ return Math.round(x * 10) / 10; }

  /* ---- state */
  var S = {
    sp: SPECIES[0], name: '', start: null, rk: [], hyb: null,
    cur: null, pending: [], hist: [], visited: {},
    mode: 'explore', part: null, took: false
  };
  var hunt = { found: {}, done: false };        // Test yourself 1: key -> 'given' | 'found' | 'revealed'
  var cmp = { a: null, b: null, guess: null };  // Test yourself 2
  var built = null;                              // a species from Build your own

  /* ---- the stage */
  var stage = mk('div', 'rs2');
  var head = K.head({ purpose: 'Push electrons: the forms blend into one real molecule.', how: { label:'Show me how', onClick: function(){ startTour(); } } });
  stage.appendChild(head.el);
  var sceneBox = mk('div', 'rs2-scene'); sceneBox.id = 'rs2Scene';
  function grad(id){ return '<radialGradient id="rs2g-' + id + '" cx="0.36" cy="0.32" r="0.75"><stop offset="0" class="rs2s-' + id + '0"/><stop offset="0.55" class="rs2s-' + id + '1"/><stop offset="1" class="rs2s-' + id + '2"/></radialGradient>'; }
  sceneBox.innerHTML = '<svg class="rs2-svg" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep" aria-hidden="true"><defs>' +
    ['c', 'h', 'o', 'n', 'x'].map(grad).join('') +
    '<linearGradient id="rs2g-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rs2s-bg0"/><stop offset="1" class="rs2s-bg1"/></linearGradient>' +
    '<linearGradient id="rs2g-tray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="rs2s-tr0"/><stop offset="1" class="rs2s-tr1"/></linearGradient>' +
    '<radialGradient id="rs2g-spot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" class="rs2s-sp0"/><stop offset="1" class="rs2s-sp1"/></radialGradient>' +
    '<radialGradient id="rs2g-neg"><stop offset="0.2" class="rs2s-ng0"/><stop offset="1" class="rs2s-ng1"/></radialGradient>' +
    '<radialGradient id="rs2g-pos"><stop offset="0.2" class="rs2s-ps0"/><stop offset="1" class="rs2s-ps1"/></radialGradient>' +
    '<radialGradient id="rs2g-el"><stop offset="0" class="rs2s-el0"/><stop offset="1" class="rs2s-el1"/></radialGradient>' +
    '<radialGradient id="rs2g-sh"><stop offset="0" class="rs2s-sh0"/><stop offset="1" class="rs2s-sh1"/></radialGradient>' +
    '</defs><g class="rs2-bgs"></g><g class="rs2-hyb"></g><g class="rs2-strip"></g><g class="rs2-mainA"></g><g class="rs2-mainB"></g>' +
    '<g class="rs2-arrows"></g><g class="rs2-fly"></g><g class="rs2-ui"></g></svg><div class="rs2-labs" aria-hidden="true"></div>';
  stage.appendChild(sceneBox);
  var svg = sceneBox.querySelector('svg');
  var G = {};
  ['bgs', 'hyb', 'strip', 'mainA', 'mainB', 'arrows', 'fly', 'ui'].forEach(function(n){ G[n] = svg.querySelector('.rs2-' + n); });
  var labsEl = sceneBox.querySelector('.rs2-labs'), layer = K.layer(sceneBox);

  // the molecule itself is the control: one focusable element over it (keys and screen readers), pointer on it
  var hit = mk('div', 'rs2-hit');
  hit.tabIndex = 0; hit.setAttribute('role', 'application');
  hit.setAttribute('aria-roledescription', 'electron pushing board');
  layer.el.appendChild(hit);
  // the picker and Undo, quiet, on the picture
  var pick = mk('label', 'rs2-pick', '<span>Molecule or ion</span><select aria-label="Molecule or ion"></select>');
  layer.el.appendChild(pick);
  var sel = pick.querySelector('select');
  function optHtml(s){ return '<option value="' + esc(s.id) + '">' + esc(s.label) + '</option>'; }
  sel.innerHTML = '<optgroup label="Start here">' + SPECIES.slice(0, FIRST).map(optHtml).join('') + '</optgroup><optgroup label="More species">' +
    SPECIES.slice(FIRST).map(optHtml).join('') + '</optgroup><option value="__built" hidden>Your own</option>';
  var undoBtn = mk('button', 'rs2-undo', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg><span>Undo</span>');
  undoBtn.type = 'button'; undoBtn.setAttribute('aria-label', 'Undo the last push');
  layer.el.appendChild(undoBtn);
  // the forms row: one button per form (a tap goes there, the arrows drawn on the way)
  var thumbsEl = mk('div', 'rs2-thumbs'); layer.el.appendChild(thumbsEl);

  var lines = mk('div', 'rs2-lines');
  var cause = K.cause({ label:'Why' });
  lines.appendChild(cause.el);
  stage.appendChild(lines);
  var live = mk('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
  stage.appendChild(live);
  function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

  /* ====================================================================== */
  /* Layout: regions of the picture, by its size                            */
  /* ====================================================================== */
  var L = null;
  function layout(){
    var W = Math.max(280, sceneBox.clientWidth), H = Math.max(300, sceneBox.clientHeight);
    var cmpMode = S.mode === 'quiz' && S.part === 'compare';
    var phone = W < 641, wide = W >= 700, top = cmpMode ? 12 : phone ? 52 : 60, pad = phone ? 8 : 14;
    var o = { W: W, H: H, phone: phone, wide: wide, top: top, pad: pad };
    if(cmpMode){
      if(wide){ o.left = { x: pad, y: top + 30, w: W / 2 - pad * 1.5, h: H - top - 30 - pad }; o.right = { x: W / 2 + pad / 2, y: top + 30, w: W / 2 - pad * 1.5, h: H - top - 30 - pad }; }
      else { var hh = (H - top - pad * 2) / 2; o.left = { x: pad, y: top + 26, w: W - pad * 2, h: hh - 26 }; o.right = { x: pad, y: top + hh + pad + 26, w: W - pad * 2, h: hh - 26 }; }
      return o;
    }
    var stripH = wide ? Math.max(118, Math.min(152, H * 0.25)) : phone ? 104 : 128;
    o.strip = { x: pad, y: H - stripH, w: W - pad * 2, h: stripH - pad };
    // no real molecule to show (Find every form before the last one, or a species with one form): the board takes its room
    if((S.mode === 'quiz' && S.part === 'find' && !hunt.done) || S.rk.length < 2){
      o.main = { x: pad, y: top, w: W - pad * 2, h: H - top - stripH - 6 };
      return o;
    }
    if(wide){
      var split = Math.round(W * 0.6);
      o.main = { x: pad, y: top, w: split - pad * 2, h: H - top - stripH - 6 };
      o.hyb = { x: split, y: top + 34, w: W - split - pad, h: H - top - stripH - 40 };
    } else {
      var hybH = phone ? 128 : 170;
      o.main = { x: pad, y: top, w: W - pad * 2, h: H - top - stripH - hybH - 4 };
      o.hyb = { x: pad, y: H - stripH - hybH + 26, w: W - pad * 2, h: hybH - 30 };
    }
    return o;
  }

  /* A transform that fits a structure's atoms (with room for lone pairs and charges) into a region. */
  function fitT(st, box, opts){
    opts = opts || {};
    var ks = Object.keys(st.atoms).filter(function(k){ return opts.flat ? heavy(st, k) : true; });
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    ks.forEach(function(k){ var a = st.atoms[k]; x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); });
    // sizes are set from the bond length, so a structure drawn at another scale (Build your own) looks the same
    var bl = st.bonds.filter(function(b){ return heavy(st, b.a) && heavy(st, b.b); }).map(function(b){ var a = st.atoms[b.a], z = st.atoms[b.b]; return Math.hypot(z.x - a.x, z.y - a.y); }).sort(function(a, b){ return a - b; });
    var u = bl.length ? bl[Math.floor(bl.length / 2)] / 70 : 1;
    var m = (opts.margin == null ? 34 : opts.margin) * u;
    var bw = x1 - x0 + m * 2, bh = y1 - y0 + m * 2;
    var s = Math.min(box.w / bw, box.h / bh, (opts.cap || 2.1) / u);
    return { s: s, k: s * u, ox: box.x + box.w / 2 - (x0 + x1) / 2 * s, oy: box.y + box.h / 2 - (y0 + y1) / 2 * s };
  }
  function P(T, a){ return [T.ox + a.x * T.s, T.oy + a.y * T.s]; }

  /* ====================================================================== */
  /* Drawing a structure                                                     */
  /* ====================================================================== */
  var BALL = { C:'c', H:'h', O:'o', N:'n' };
  function radiusOf(st, k, T){
    var a = st.atoms[k], base = a.el === 'H' ? 10 : 16.5;
    var lab = labelOf(st, k);
    return Math.max(a.el === 'H' ? 7.5 : 11.5, base * T.k * 0.8) * (lab.length > 2 ? 1.16 : lab.length > 1 ? 1.07 : 1);
  }
  function labelOf(st, k){
    var a = st.atoms[k];
    if(!a.el || a.group || a.el === 'H') return a.label;
    var h = (a.hImplicit || 0);
    if(!h) return a.el;
    return a.el + 'H' + (h > 1 ? '₀₁₂₃₄'[h] : '');
  }
  // folded hydrogens, for the small drawings (explicit H atoms counted into the label)
  function flatLabel(st, k){
    var a = st.atoms[k];
    if(!a.el || a.group) return a.label;
    var h = (a.hImplicit || 0) + C.neighbors(st, k).filter(function(n){ return st.atoms[n].el === 'H'; }).length;
    if(a.el === 'C' && h === 0) return 'C';
    return a.el + (h ? 'H' + (h > 1 ? '₀₁₂₃₄'[h] : '') : '');
  }
  function angDist(a, b){ var d = Math.abs(a - b) % (Math.PI * 2); return d > Math.PI ? Math.PI * 2 - d : d; }
  /* Where an atom's lone pairs (and then its charge badge and its octet tag) sit: greedy, into the widest gaps
     between its bonds, the same for the same bonds in every form. */
  function slots(st, k, n){
    var a = st.atoms[k], occ = C.neighbors(st, k).map(function(o){ var b = st.atoms[o]; return Math.atan2(b.y - a.y, b.x - a.x); });
    var out = [], cand = [];
    for(var i = 0; i < 36; i++) cand.push(-Math.PI / 2 + i * Math.PI / 18);
    for(var j = 0; j < n; j++){
      var best = null, bd = -1;
      cand.forEach(function(c){
        var d = Math.min.apply(null, occ.concat(out).map(function(o){ return angDist(c, o); }).concat([Math.PI]));
        if(d > bd + 1e-6){ bd = d; best = c; }
      });
      out.push(best);
    }
    return out;
  }
  function piSide(st, b){
    // the π stick goes inside a ring, otherwise to the side with fewer neighbours
    var A = st.atoms[b.a], Z = st.atoms[b.b], dx = Z.x - A.x, dy = Z.y - A.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
    var rings = sixRings(st), ring = rings.filter(function(r){ return r.indexOf(b.a) >= 0 && r.indexOf(b.b) >= 0; })[0];
    var score = 0;
    if(ring){
      var cx = 0, cy = 0; ring.forEach(function(k){ cx += st.atoms[k].x; cy += st.atoms[k].y; }); cx /= 6; cy /= 6;
      score = (cx - (A.x + Z.x) / 2) * nx + (cy - (A.y + Z.y) / 2) * ny;
    } else {
      [b.a, b.b].forEach(function(e){ C.neighbors(st, e).forEach(function(o){ if(o === b.a || o === b.b) return; var q = st.atoms[o]; score -= ((q.x - (A.x + Z.x) / 2) * nx + (q.y - (A.y + Z.y) / 2) * ny) > 0 ? 1 : -1; }); });
      if(score === 0) score = ny <= 0 ? 1 : -1;   // up, when nothing decides
    }
    return score >= 0 ? 1 : -1;
  }

  /* draw(st, T, o) -> { html, A: anchors }
     o.omitLp {atomKey: [{x, y}]}  lone pairs not drawn (they are in flight): the slot nearest each point
     o.omitPi {bondKey: 1}      π sticks not drawn
     o.noCharge {atomKey: 1}    charge not drawn (an atom over its octet, held)
     o.hybrid  hybridOf()       draw the real molecule: shared π electrons and shared charge, no lone pairs */
  function draw(st, T, o){
    o = o || {};
    var A = { atoms: {}, lps: {}, pis: {}, bonds: {} }, sh = '', bg = '', bo = '', at = '', lp = '', ch = '', s = T.k;
    var stickW = Math.max(3.2, 4.2 * s), piW = Math.max(2.6, 3.2 * s), off = Math.max(5, 6.4 * s);
    var keys = Object.keys(st.atoms);
    keys.forEach(function(k){ var p = P(T, st.atoms[k]); A.atoms[k] = { x: p[0], y: p[1], r: radiusOf(st, k, T) }; });
    // bonds
    st.bonds.forEach(function(b){
      if(b.order < 1) return;
      var a = A.atoms[b.a], z = A.atoms[b.b], bk = bondKey(b), dx = z.x - a.x, dy = z.y - a.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
      A.bonds[bk] = { x1: a.x, y1: a.y, x2: z.x, y2: z.y, mx: (a.x + z.x) / 2, my: (a.y + z.y) / 2, nx: nx, ny: ny };
      bo += '<line class="rs2-sig" x1="' + f1(a.x) + '" y1="' + f1(a.y) + '" x2="' + f1(z.x) + '" y2="' + f1(z.y) + '" stroke-width="' + f1(stickW) + '"/>';
      var side = piSide(st, b), ox = nx * off * side, oy = ny * off * side;
      var hb = o.hybrid && o.hybrid.bonds[bk], extra = hb ? hb.lo - 1 : b.order - 1, partial = hb && hb.hi > hb.lo;
      var sx = a.x + dx * 0.2 + ox, sy = a.y + dy * 0.2 + oy, ex = a.x + dx * 0.8 + ox, ey = a.y + dy * 0.8 + oy;
      A.pis[bk] = { x1: sx, y1: sy, x2: ex, y2: ey, mx: (sx + ex) / 2, my: (sy + ey) / 2 };
      if(partial){
        bg += '<line class="rs2-deloc" x1="' + f1(a.x) + '" y1="' + f1(a.y) + '" x2="' + f1(z.x) + '" y2="' + f1(z.y) + '" stroke-width="' + f1(off * 3.6) + '"/>';
        bo += '<line class="rs2-pi is-part" x1="' + f1(sx) + '" y1="' + f1(sy) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '" stroke-width="' + f1(piW) + '"/>';
      }
      for(var i = 0; i < extra; i++){
        if(i === 0 && o.omitPi && o.omitPi[bk]) continue;
        var m = i === 0 ? 1 : -1;
        bo += '<line class="rs2-pi" x1="' + f1(a.x + dx * 0.2 + ox * m) + '" y1="' + f1(a.y + dy * 0.2 + oy * m) + '" x2="' + f1(a.x + dx * 0.8 + ox * m) + '" y2="' + f1(a.y + dy * 0.8 + oy * m) + '" stroke-width="' + f1(piW) + '"/>';
      }
    });
    // atoms, lone pairs, charges
    keys.forEach(function(k){
      var a = st.atoms[k], p = A.atoms[k], r = p.r, q = fc(st, k), n = o.hybrid ? 0 : (a.lp || 0);
      var sl = slots(st, k, n + 2);
      A.lps[k] = [];
      for(var i = 0; i < n; i++){
        var ang = sl[i], d = r + Math.max(7, 5.2 * s);
        A.lps[k].push({ x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d, ang: ang });
      }
      var skip = {};
      ((o.omitLp && o.omitLp[k]) || []).forEach(function(pt){
        var bi = -1, bd = Infinity;
        A.lps[k].forEach(function(l, j){ if(skip[j]) return; var dd = Math.hypot(l.x - pt.x, l.y - pt.y); if(dd < bd){ bd = dd; bi = j; } });
        if(bi >= 0) skip[bi] = 1;
      });
      A.lps[k].forEach(function(l, j){ if(!skip[j]) lp += pairHtml(l.x, l.y, l.ang, s); });
      A.atoms[k].free = [sl[n], sl[n + 1]];
      var hq = o.hybrid && o.hybrid.atoms[k];
      var showQ = !o.noCharge || !o.noCharge[k];
      if(!o.hybrid && q && showQ) bg += '<circle class="rs2-glow" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * 2.3) + '" fill="url(#rs2g-' + (q < 0 ? 'neg' : 'pos') + ')"/>';
      if(hq){
        if(hq.fixed) bg += '<circle class="rs2-glow" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * 2.2) + '" fill="url(#rs2g-' + (hq.fixed < 0 ? 'neg' : 'pos') + ')"/>';
        else bg += '<circle class="rs2-glow' + (hq.big ? '' : ' is-small') + '" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * (hq.big ? 2.3 : 1.65)) + '" fill="url(#rs2g-' + (hq.neg ? 'neg' : 'pos') + ')"/>';
      }
      sh += '<circle class="rs2-shadow" cx="' + f1(p.x + r * 0.18) + '" cy="' + f1(p.y + r * 0.42) + '" r="' + f1(r * 1.12) + '"/>';
      var lab = labelOf(st, k), fs = Math.min(r * 1.02, r * 2.5 / Math.max(1, lab.length * 0.78));
      at += '<circle class="rs2-ball is-' + (BALL[a.el] || 'x') + '" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r) + '" fill="url(#rs2g-' + (BALL[a.el] || 'x') + ')"/>' +
        '<ellipse class="rs2-shine" cx="' + f1(p.x - r * 0.32) + '" cy="' + f1(p.y - r * 0.38) + '" rx="' + f1(r * 0.34) + '" ry="' + f1(r * 0.22) + '"/>' +
        '<text class="rs2-al is-' + (BALL[a.el] || 'x') + '" x="' + f1(p.x) + '" y="' + f1(p.y + fs * 0.36) + '" font-size="' + f1(fs) + '" text-anchor="middle">' + esc(lab) + '</text>';
      var badge = null;
      if(!o.hybrid && q && showQ) badge = { q: q, t: sign(q) };
      if(hq && hq.fixed) badge = { q: hq.fixed, t: sign(hq.fixed) };
      if(badge){
        var ba = sl[n], br = Math.max(7.5, 6.4 * s), bd = r + br * 0.55, bx = p.x + Math.cos(ba) * bd, by = p.y + Math.sin(ba) * bd;
        A.atoms[k].badge = { x: bx, y: by, r: br };
        ch += '<g class="rs2-badge is-' + (badge.q < 0 ? 'neg' : 'pos') + '"><circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="' + f1(br) + '"/>' +
          '<text x="' + f1(bx) + '" y="' + f1(by + br * 0.42) + '" font-size="' + f1(br * (badge.t.length > 1 ? 1.05 : 1.45)) + '" text-anchor="middle">' + badge.t + '</text></g>';
      }
    });
    return { html: '<g class="rs2-bgl">' + bg + '</g><g class="rs2-shl">' + sh + '</g><g class="rs2-bol">' + bo + '</g><g class="rs2-atl">' + at + '</g><g class="rs2-lpl">' + lp + '</g><g class="rs2-chl">' + ch + '</g>', A: A };
  }
  function pairHtml(cx, cy, ang, s){
    var dr = Math.max(2.4, 2.2 * s), sp = Math.max(3.4, 2.9 * s), px = -Math.sin(ang) * sp, py = Math.cos(ang) * sp;
    return '<g class="rs2-lp"><circle class="rs2-lpglow" cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(sp * 2.1) + '"/>' +
      '<circle class="rs2-e" cx="' + f1(cx + px) + '" cy="' + f1(cy + py) + '" r="' + f1(dr) + '"/><circle class="rs2-e" cx="' + f1(cx - px) + '" cy="' + f1(cy - py) + '" r="' + f1(dr) + '"/></g>';
  }

  /* The small drawings in the forms row: lines and letters, the charge in its colour, the π line violet. */
  function drawFlat(st, T){
    var s = T.k, out = '', hk = Object.keys(st.atoms).filter(function(k){ return heavy(st, k); });
    var lw = Math.max(1.4, 2.6 * s), fsz = Math.max(8.5, 15 * s);
    st.bonds.forEach(function(b){
      if(b.order < 1 || !heavy(st, b.a) || !heavy(st, b.b)) return;
      var a = P(T, st.atoms[b.a]), z = P(T, st.atoms[b.b]), dx = z[0] - a[0], dy = z[1] - a[1], L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
      var ga = flatLabel(st, b.a) === 'C' ? 0 : fsz * 0.62, gz = flatLabel(st, b.b) === 'C' ? 0 : fsz * 0.62;
      var ax = a[0] + dx / L0 * ga, ay = a[1] + dy / L0 * ga, zx = z[0] - dx / L0 * gz, zy = z[1] - dy / L0 * gz;
      out += '<line class="rs2-fsig" x1="' + f1(ax) + '" y1="' + f1(ay) + '" x2="' + f1(zx) + '" y2="' + f1(zy) + '" stroke-width="' + f1(lw) + '"/>';
      var side = piSide(st, b), o2 = Math.max(2.6, 5 * s) * side;
      for(var i = 1; i < b.order; i++){
        var m = i === 1 ? 1 : -1;
        out += '<line class="rs2-fpi" x1="' + f1(ax + dx * 0.08 + nx * o2 * m) + '" y1="' + f1(ay + dy * 0.08 + ny * o2 * m) + '" x2="' + f1(zx - dx * 0.08 + nx * o2 * m) + '" y2="' + f1(zy - dy * 0.08 + ny * o2 * m) + '" stroke-width="' + f1(lw) + '"/>';
      }
    });
    hk.forEach(function(k){
      var p = P(T, st.atoms[k]), lab = flatLabel(st, k), q = fc(st, k), c = lab === 'C';
      if(!c) out += '<text class="rs2-fal" x="' + f1(p[0]) + '" y="' + f1(p[1] + fsz * 0.36) + '" font-size="' + f1(fsz) + '" text-anchor="middle">' + esc(lab) + '</text>';
      if(q){
        // a small badge in the widest gap between the atom's bonds, so no line runs through it
        var ang = slots(st, k, 1)[0], br = Math.max(5.2, fsz * 0.52), dd = (c ? 0 : fsz * 0.32 * lab.length) + br + 2;
        var bx = p[0] + Math.cos(ang) * dd, by = p[1] + Math.sin(ang) * dd;
        out += '<g class="rs2-badge is-' + (q < 0 ? 'neg' : 'pos') + '"><circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="' + f1(br) + '"/><text x="' + f1(bx) + '" y="' + f1(by + br * 0.45) + '" font-size="' + f1(br * 1.5) + '" text-anchor="middle">' + sign(q) + '</text></g>';
      }
    });
    return out;
  }

  /* ====================================================================== */
  /* Painting the scene                                                      */
  /* ====================================================================== */
  var mainT = null, mainA = null;   // the transform and anchors of what is drawn on the board now
  var labs = [];                    // [{ t, cls, x, y }] names on the picture, placed after the picture
  function shown(){ return S.pendingSt || S.cur; }

  function paintBg(){
    var o = L, h = '<rect class="rs2-bg" x="0" y="0" width="' + o.W + '" height="' + o.H + '" fill="url(#rs2g-bg)"/>';
    if(o.main){
      h += '<ellipse class="rs2-spot" cx="' + f1(o.main.x + o.main.w / 2) + '" cy="' + f1(o.main.y + o.main.h / 2) + '" rx="' + f1(o.main.w * 0.55) + '" ry="' + f1(o.main.h * 0.58) + '" fill="url(#rs2g-spot)"/>';
      if(o.hyb) h += '<rect class="rs2-card" x="' + f1(o.hyb.x - 6) + '" y="' + f1(o.hyb.y - 32) + '" width="' + f1(o.hyb.w + 12) + '" height="' + f1(o.hyb.h + 38) + '" rx="16"/>';
      h += '<rect class="rs2-tray" x="0" y="' + f1(o.strip.y - 4) + '" width="' + o.W + '" height="' + f1(o.H - o.strip.y + 4) + '" fill="url(#rs2g-tray)"/>' +
        '<line class="rs2-trayedge" x1="0" y1="' + f1(o.strip.y - 4) + '" x2="' + o.W + '" y2="' + f1(o.strip.y - 4) + '"/>';
    }
    if(o.left){
      [o.left, o.right].forEach(function(b){ h += '<rect class="rs2-card" x="' + f1(b.x) + '" y="' + f1(b.y - 28) + '" width="' + f1(b.w) + '" height="' + f1(b.h + 28) + '" rx="16"/>'; });
    }
    G.bgs.innerHTML = h;
  }

  function paintMain(){
    var st = shown();
    if(!st || !L.main){ G.mainA.innerHTML = ''; G.mainB.innerHTML = ''; mainA = null; return; }
    mainT = fitT(S.start, L.main, { cap: L.phone ? 1.7 : 2.7, margin: 30 });
    var noQ = {}; over(st).forEach(function(k){ noQ[k] = 1; });
    var d = draw(st, mainT, { noCharge: noQ });
    G.mainA.innerHTML = d.html; G.mainA.style.opacity = '1';
    G.mainB.innerHTML = ''; mainA = d.A;
    G.arrows.innerHTML = S.pending.map(function(ar){ return arrowHtml(ar, d.A, 'is-held'); }).join('');
    // problems drawn on the atom: amber ring and the count
    var ring = '';
    over(st).concat(short(st)).forEach(function(k){
      var p = d.A.atoms[k];
      ring += '<circle class="rs2-oct" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(p.r + 4) + '"/>';
    });
    G.ui.innerHTML = ring;
  }

  function paintHybrid(){
    if(!L.hyb){ G.hyb.innerHTML = ''; return; }
    var hideIt = S.mode === 'quiz' && S.part === 'find' && !hunt.done;
    if(hideIt || S.rk.length < 2){ G.hyb.innerHTML = ''; return; }
    var T = fitT(S.start, { x: L.hyb.x, y: L.hyb.y + 10, w: L.hyb.w, h: L.hyb.h - 10 }, { cap: L.phone ? 1.0 : 2.0, margin: 36 });
    var d = draw(S.rk[0].st, T, { hybrid: S.hyb });
    G.hyb.innerHTML = d.html + hybMarks(S.hyb, d.A, L.hyb);
  }
  /* The drawn size of a mark (its box and where its middle sits from the baseline), measured once per text and size. */
  var mtext = null;
  function measure(txt, fs){
    if(!mtext){ mtext = document.createElementNS(NS, 'text'); mtext.setAttribute('class', 'rs2-dq'); mtext.setAttribute('text-anchor', 'middle'); mtext.style.visibility = 'hidden'; svg.appendChild(mtext); }
    mtext.setAttribute('font-size', f1(fs)); mtext.textContent = txt;
    var b = null; try{ b = mtext.getBBox(); }catch(e){}
    var r = b && b.width ? { w: b.width, h: b.height, cy: b.y + b.height / 2 } : { w: fs * 0.85 * txt.length, h: fs * 1.3, cy: -fs * 0.34 };
    return r;
  }
  function hybMarks(hyb, A, box){
    var t = '', placed = [], keys = Object.keys(A.atoms);
    // the heading pill above the card is kept clear
    placed.push({ l: box.x + box.w / 2 - 70, r: box.x + box.w / 2 + 70, t: box.y - 30, b: box.y - 2 });
    function clear(r){
      if(r.l < box.x - 2 || r.r > box.x + box.w + 2 || r.t < box.y - 26 || r.b > box.y + box.h + 2) return false;
      for(var i = 0; i < keys.length; i++){
        var a = A.atoms[keys[i]];
        if(!(r.r + 3 <= a.x - a.r || a.x + a.r + 3 <= r.l || r.b + 3 <= a.y - a.r || a.y + a.r + 3 <= r.t)) return false;
      }
      return !placed.some(function(o){ return !(r.r + 4 <= o.l || o.r + 4 <= r.l || r.b + 4 <= o.t || o.b + 4 <= r.t); });
    }
    Object.keys(hyb.atoms).forEach(function(k){
      var h = hyb.atoms[k], p = A.atoms[k];
      if(h.fixed) return;
      var txt = h.mean != null ? fraction(h.mean) : (h.neg && h.pos ? 'δ±' : h.neg ? 'δ−' : 'δ+');
      var fs0 = Math.max(11, Math.min(16, p.r * 1.05)), fs = h.big ? fs0 : fs0 * 0.86, mb = measure(txt, fs), tw2 = mb.w + 4, th = mb.h + 2, x = null, y = null;
      // outward only: never toward the middle of the molecule, where a mark would read as another atom's
      var mx = 0, my = 0; keys.forEach(function(q){ mx += A.atoms[q].x; my += A.atoms[q].y; }); mx /= keys.length; my /= keys.length;
      var ox = p.x - mx, oy = p.y - my, ol = Math.hypot(ox, oy) || 1;
      var angs = p.free.slice();
      for(var i = 0; i < 16; i++) angs.push(-Math.PI / 2 + i * Math.PI / 8);
      angs = angs.filter(function(a){ return ol < 2 || (Math.cos(a) * ox + Math.sin(a) * oy) / ol > -0.2; });
      outer: for(var di = 0; di < 3; di++){
        for(var ai = 0; ai < angs.length; ai++){
          var c = Math.cos(angs[ai]), sn = Math.sin(angs[ai]);
          // the distance from the centre at which a box of this size just clears the ball along this direction
          var reach = p.r + 4 + Math.min(Math.abs(c) > 1e-6 ? tw2 / 2 / Math.abs(c) : 1e9, Math.abs(sn) > 1e-6 ? th / 2 / Math.abs(sn) : 1e9) + di * 6;
          var cx = p.x + c * reach, cy = p.y + sn * reach, r = { l: cx - tw2 / 2, r: cx + tw2 / 2, t: cy - th / 2, b: cy + th / 2 };
          if(clear(r)){ x = cx; y = cy; placed.push(r); break outer; }
        }
      }
      if(x == null) return;    // no clear spot: the glow still shows it
      t += '<text class="rs2-dq is-' + (h.neg ? 'neg' : 'pos') + (h.big ? '' : ' is-small') + '" x="' + f1(x) + '" y="' + f1(y - mb.cy) + '" font-size="' + f1(fs) + '" text-anchor="middle">' + txt + '</text>';
    });
    return t;
  }

  var thumbBoxes = [];
  function paintStrip(){
    thumbBoxes = [];
    if(!L.strip){ G.strip.innerHTML = ''; thumbsEl.innerHTML = ''; return; }
    var n = S.rk.length, gap = L.phone ? 6 : 12, st = L.strip, headH = 22;
    var w = Math.min(L.phone ? 120 : 190, (st.w - gap * (n - 1)) / n), x0 = st.x + (st.w - (w * n + gap * (n - 1))) / 2;
    var curKey = S.cur ? R.key(S.cur) : null, h = '', btn = '';
    S.rk.forEach(function(f, i){
      var bx = x0 + i * (w + gap), by = st.y + headH, bh = st.h - headH, on = f.key === curKey && !S.pendingSt;
      var hideIt = S.mode === 'quiz' && S.part === 'find' && !hunt.found[f.key];
      var scale = f.major ? 1 : 0.8, iw = w * scale, ih = (bh - 18) * scale;
      var inner = { x: bx + (w - iw) / 2, y: by + 4 + (bh - 18 - ih) / 2, w: iw, h: ih };
      h += '<rect class="rs2-thumb' + (on ? ' is-on' : '') + (hideIt ? ' is-hid' : '') + '" x="' + f1(bx) + '" y="' + f1(by) + '" width="' + f1(w) + '" height="' + f1(bh) + '" rx="12"/>';
      if(hideIt) h += '<text class="rs2-q" x="' + f1(bx + w / 2) + '" y="' + f1(by + bh / 2 + 9) + '" font-size="26" text-anchor="middle">?</text>';
      else h += drawFlat(f.st, fitT(S.start, inner, { flat: true, margin: 22, cap: 0.9 }));
      thumbBoxes.push({ x: bx, y: by, w: w, h: bh, f: f, hid: hideIt, on: on });
      var what = hideIt ? 'Form ' + (i + 1) + ', not found yet' : 'Form ' + (i + 1) + ', ' + f.tag + (on ? ', shown now' : '') + '. ' + R.describe(f.st, S.rk.map(function(x){ return x.st; })).summary;
      btn += '<button type="button" class="rs2-tb" data-i="' + i + '" style="left:' + f1(bx) + 'px;top:' + f1(by) + 'px;width:' + f1(w) + 'px;height:' + f1(bh) + 'px"' +
        (hideIt ? ' disabled' : '') + ' aria-label="' + esc(what) + '"' + (on ? ' aria-current="true"' : '') + '></button>';
    });
    G.strip.innerHTML = h;
    thumbsEl.innerHTML = btn;
  }

  /* Names on the picture: placed after the picture is drawn, each in the first spot clear of the others. */
  function placeLabels(){
    var out = [];
    if(L.hyb && G.hyb.innerHTML) out.push({ t: 'Real molecule', cls: 'is-head', x: L.hyb.x + L.hyb.w / 2, y: L.hyb.y - 15 });
    if(L.strip) out.push({ t: S.mode === 'quiz' && S.part === 'find' ? 'Forms found' : 'Resonance forms', cls: 'is-sub', x: L.strip.x + L.strip.w / 2, y: L.strip.y + 10 });
    thumbBoxes.forEach(function(b){ if(!b.hid) out.push({ t: b.f.tag, cls: 'is-tag is-' + b.f.tag + (b.on ? ' is-on' : ''), x: b.x + b.w / 2, y: b.y + b.h - 10 }); });
    if(L.left && cmp.a){
      out.push({ t: cmp.a.label, cls: 'is-head', x: L.left.x + L.left.w / 2, y: L.left.y - 14 });
      out.push({ t: cmp.b.label, cls: 'is-head', x: L.right.x + L.right.w / 2, y: L.right.y - 14 });
    }
    // the count on an atom with a problem
    var st = shown();
    if(st && mainA && L.main){
      over(st).concat(short(st)).forEach(function(k){
        var p = mainA.atoms[k], n = C.electronCount(st, k), ang = p.free[0], d = p.r + 22;
        out.push({ t: n + ' e⁻', cls: 'is-oct', x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d, atom: k });
      });
    }
    labs = out;
    labsEl.innerHTML = out.map(function(l){ return '<span class="rs2-lab ' + l.cls + '" style="left:' + f1(l.x) + 'px;top:' + f1(l.y) + 'px">' + esc(l.t) + '</span>'; }).join('');
    // keep an octet tag clear of balls and other names: try the atom's free directions, further out if needed
    [].forEach.call(labsEl.querySelectorAll('.is-oct'), function(e, i){
      var l = out.filter(function(x){ return x.cls === 'is-oct'; })[i], p = mainA.atoms[l.atom];
      var tries = [], angs = p.free.slice();
      for(var i2 = 0; i2 < 12; i2++) angs.push(-Math.PI / 2 + i2 * Math.PI / 6);
      [24, 36, 50].forEach(function(d){ angs.forEach(function(a){ tries.push([p.x + Math.cos(a) * (p.r + d), p.y + Math.sin(a) * (p.r + d)]); }); });
      var ok = false;
      for(var t = 0; t < tries.length && !ok; t++){
        e.style.left = f1(tries[t][0]) + 'px'; e.style.top = f1(tries[t][1]) + 'px';
        ok = !labelHits(e);
      }
      if(!ok) e.hidden = true;     // no clear spot: the amber ring and the cause line still say it
    });
  }
  function labelHits(e){
    var r = e.getBoundingClientRect(), s = sceneBox.getBoundingClientRect(), g = 5;
    if(r.left < s.left + 2 || r.right > s.right - 2 || r.top < s.top + 2 || r.bottom > s.bottom - 2) return true;
    var things = [].slice.call(svg.querySelectorAll('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-hyb .rs2-ball, .rs2-mainA .rs2-e, .rs2-thumb, .rs2-dq')).concat([pick.querySelector('select'), undoBtn]);
    return things.some(function(b){ var q = b.getBoundingClientRect(); return !(q.right + g <= r.left || q.left >= r.right + g || q.bottom + g <= r.top || q.top >= r.bottom + g); }) ||
      [].some.call(labsEl.children, function(o){ if(o === e || o.hidden) return false; var q = o.getBoundingClientRect(); return !(q.right + g <= r.left || q.left >= r.right + g || q.bottom + g <= r.top || q.top >= r.bottom + g); });
  }

  function paintCompare(){
    if(!L.left){ return; }
    G.mainA.innerHTML = ''; G.mainB.innerHTML = ''; G.arrows.innerHTML = ''; G.ui.innerHTML = ''; G.strip.innerHTML = ''; G.hyb.innerHTML = '';
    thumbsEl.innerHTML = ''; thumbBoxes = [];
    if(!cmp.a || !cmp.b) return;
    var h = '';
    [[cmp.a, L.left], [cmp.b, L.right]].forEach(function(p){
      var sta = stabilization(p[0].st), T = fitT(p[0].st, p[1], { cap: L.phone ? 1.0 : 1.5, margin: 30 });
      if(cmp.guess === null){ h += draw(sta.forms[0], T).html; return; }
      var hy = sta.count > 1 ? hybridOf(sta.rk) : { atoms: (function(){ var o = {}; charged(sta.forms[0]).forEach(function(c){ o[c.k] = { fixed: c.q }; }); return o; })(), bonds: {} };
      var d = draw(sta.rk[0].st, T, { hybrid: hy });
      h += d.html + hybMarks(hy, d.A, p[1]);
    });
    G.mainA.innerHTML = h;
  }

  var drawn = false;
  function paintAll(){
    L = layout();
    svg.setAttribute('viewBox', '0 0 ' + L.W + ' ' + L.H);
    sceneBox.classList.toggle('is-compare', !!L.left);
    paintBg();
    if(L.left){ paintCompare(); }
    else { paintMain(); paintHybrid(); paintStrip(); }
    placeHit();
    placeLabels();
    undoBtn.hidden = !!L.left; pick.hidden = !!L.left; lines.hidden = !!L.left;
    undoBtn.disabled = !S.pending.length && !S.hist.length;
    drawn = true;
    view.L = L; view.A = mainA; view.S = S; view.T = mainT;
  }
  function placeHit(){
    var b = L.main || { x: 0, y: 0, w: 0, h: 0 };
    hit.hidden = !L.main;
    hit.style.left = f1(b.x) + 'px'; hit.style.top = f1(b.y) + 'px'; hit.style.width = f1(b.w) + 'px'; hit.style.height = f1(b.h) + 'px';
  }

  /* ====================================================================== */
  /* Arrows                                                                  */
  /* ====================================================================== */
  function anchorOf(ar, A, end){
    var key = end === 'from' ? ar.from : ar.to;
    if(C.isBondKey(key)){
      var bk = C.parseBondKey(key), x = A.pis[key] || A.pis['bond:' + bk.b + '-' + bk.a], y = A.bonds[key] || A.bonds['bond:' + bk.b + '-' + bk.a];
      if(end === 'from' && x) return { x: x.mx, y: x.my };
      if(y) return { x: y.mx, y: y.my };
      var a = A.atoms[bk.a], b = A.atoms[bk.b];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    var p = A.atoms[key];
    if(end === 'from' && A.lps[key] && A.lps[key].length){
      // the lone pair nearest the arrow's other end
      var o = rawPos(ar.to, A);
      var best = A.lps[key].slice().sort(function(u, v){ return Math.hypot(u.x - o.x, u.y - o.y) - Math.hypot(v.x - o.x, v.y - o.y); })[0];
      return { x: best.x, y: best.y, ang: best.ang };
    }
    if(end === 'to' && p){
      // onto an atom: end just outside it, on the side the arrow comes from
      var f = rawPos(ar.from, A), dx = f.x - p.x, dy = f.y - p.y, dl = Math.hypot(dx, dy) || 1;
      return { x: p.x + dx / dl * (p.r + 6), y: p.y + dy / dl * (p.r + 6), atom: true };
    }
    return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  function rawPos(key, A){
    if(C.isBondKey(key)){ var bk = C.parseBondKey(key), x = A.bonds[key] || A.bonds['bond:' + bk.b + '-' + bk.a]; if(x) return { x: x.mx, y: x.my }; var a = A.atoms[bk.a], z = A.atoms[bk.b]; return { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 }; }
    var p = A.atoms[key]; return p ? { x: p.x, y: p.y } : { x: 0, y: 0 };
  }
  // a curved arrow from a to b, bowed away from the molecule's middle
  function curve(a, b){
    var dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0;
    var cx = 0, cy = 0, n = 0;
    if(mainA) Object.keys(mainA.atoms).forEach(function(k){ cx += mainA.atoms[k].x; cy += mainA.atoms[k].y; n++; });
    cx = n ? cx / n : a.x; cy = n ? cy / n : a.y;
    var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, side = (mx - cx) * nx + (my - cy) * ny >= 0 ? 1 : -1;
    var bow = Math.max(18, Math.min(46, L0 * 0.5));
    return { a: a, b: b, c: { x: mx + nx * bow * side, y: my + ny * bow * side } };
  }
  function bez(cv, t){ var u = 1 - t; return { x: u * u * cv.a.x + 2 * u * t * cv.c.x + t * t * cv.b.x, y: u * u * cv.a.y + 2 * u * t * cv.c.y + t * t * cv.b.y }; }
  function arrowPath(cv){
    var b = cv.b, c = cv.c, dx = b.x - c.x, dy = b.y - c.y, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, hl = 11, hw = 6;
    var bx = b.x - ux * hl * 0.6, by = b.y - uy * hl * 0.6;
    return { line: 'M' + f1(cv.a.x) + ' ' + f1(cv.a.y) + ' Q' + f1(c.x) + ' ' + f1(c.y) + ' ' + f1(bx) + ' ' + f1(by),
      head: 'M' + f1(b.x) + ' ' + f1(b.y) + ' L' + f1(b.x - ux * hl - uy * hw) + ' ' + f1(b.y - uy * hl + ux * hw) + ' L' + f1(b.x - ux * hl + uy * hw) + ' ' + f1(b.y - uy * hl - ux * hw) + 'Z' };
  }
  function arrowHtml(ar, A, cls){
    var p = arrowPath(curve(anchorOf(ar, A, 'from'), anchorOf(ar, A, 'to')));
    return '<g class="rs2-arrow ' + (cls || '') + '"><path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/></g>';
  }

  /* ====================================================================== */
  /* Motion                                                                  */
  /* ====================================================================== */
  var tw = 0, twEnd = null;
  function stopTween(){ if(tw){ cancelAnimationFrame(tw); tw = 0; } if(twEnd){ var f = twEnd; twEnd = null; f(); } }
  function calm(){ if(!svg.animate) return; try{ [G.mainA, G.hyb, G.strip, labsEl].forEach(function(n){ n.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); }); }catch(e){} }
  function tween(ms, fn, done){
    stopTween();
    twEnd = done || null;
    if(K.reduced() || !window.requestAnimationFrame){ fn(1); stopTween(); calm(); return; }
    var t0 = null;
    function step(ts){
      if(t0 == null) t0 = ts;
      var f = Math.min(1, (ts - t0) / ms);
      fn(f);
      if(f < 1) tw = requestAnimationFrame(step); else { tw = 0; var d = twEnd; twEnd = null; if(d) d(); }
    }
    tw = requestAnimationFrame(step);
  }
  function ease(f){ return f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; }
  function seg(f, a, b){ return Math.max(0, Math.min(1, (f - a) / (b - a))); }

  /* Electrons move from one drawn structure to the next along the arrows. from: the structure drawn now; to: the
     one to draw; arrows: all of them (the held ones and the new one); start: where the new pair is (the finger's
     drop point) or null to draw every arrow in first. Labels and words wait for the end. */
  var flyEls = [];
  function moveElectrons(from, to, arrows, o, done){
    o = o || {};
    var T = mainT, Afrom = draw(from, T).A, Ato = draw(to, T).A;
    var fresh = o.fresh || arrows;             // the arrows whose pairs move now
    var omitLpA = {}, omitPiA = {}, omitLpB = {}, omitPiB = {};
    var ends = fresh.map(function(ar, i){
      var a = o.from && i === fresh.length - 1 ? o.from : anchorOf(ar, Afrom, 'from'), b = anchorOf(ar, Ato, 'to');
      if(C.isBondKey(ar.to)){ var pi = Ato.pis[norm(to, ar.to)]; if(pi) b = { x: pi.mx, y: pi.my }; }
      else { var lps = Ato.lps[ar.to] || []; if(lps.length) b = lps.slice().sort(function(u, v){ return Math.hypot(u.x - a.x, u.y - a.y) - Math.hypot(v.x - a.x, v.y - a.y); })[0]; }
      return { a: a, b: b };
    });
    fresh.forEach(function(ar, i){
      if(C.isBondKey(ar.from)) omitPiA[ar.from] = 1; else (omitLpA[ar.from] = omitLpA[ar.from] || []).push(ends[i].a);
      if(C.isBondKey(ar.to)) omitPiB[norm(to, ar.to)] = 1; else (omitLpB[ar.to] = omitLpB[ar.to] || []).push(ends[i].b);
    });
    var noQa = {}; over(from).forEach(function(k){ noQa[k] = 1; });
    var noQb = {}; over(to).forEach(function(k){ noQb[k] = 1; });
    G.mainA.innerHTML = draw(from, T, { omitLp: omitLpA, omitPi: omitPiA, noCharge: noQa }).html;
    G.mainB.innerHTML = draw(to, T, { omitLp: omitLpB, omitPi: omitPiB, noCharge: noQb }).html;
    G.mainA.style.opacity = '1'; G.mainB.style.opacity = '0';
    G.ui.innerHTML = ''; labsEl.classList.add('is-wait'); cause.el.classList.add('is-wait');
    var curves = ends.map(function(e){ return curve(e.a, e.b); });
    var held = arrows.filter(function(ar){ return fresh.indexOf(ar) < 0; });
    G.arrows.innerHTML = held.map(function(ar){ return arrowHtml(ar, Afrom, 'is-held'); }).join('') +
      curves.map(function(cv){ var p = arrowPath(cv); return '<g class="rs2-arrow is-run"><path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/></g>'; }).join('');
    var runs = [].slice.call(G.arrows.querySelectorAll('.is-run')), heldEls = [].slice.call(G.arrows.querySelectorAll('.is-held'));
    runs.forEach(function(g){ var l = g.querySelector('.rs2-al-l'), len = l.getTotalLength ? l.getTotalLength() : 200; g.__len = len; l.style.strokeDasharray = len; l.style.strokeDashoffset = o.start ? 0 : len; g.querySelector('.rs2-al-h').style.opacity = o.start ? 1 : 0; });
    G.fly.innerHTML = curves.map(function(){ return '<g class="rs2-flyp"><circle class="rs2-lpglow" r="9"/><circle class="rs2-e" r="3"/><circle class="rs2-e" r="3"/></g>'; }).join('');
    flyEls = [].slice.call(G.fly.children);
    var s = T.k, dr = Math.max(2.4, 2.2 * s), sp = Math.max(3.4, 2.9 * s);
    flyEls.forEach(function(g){ g.children[0].setAttribute('r', f1(sp * 2.1)); g.children[1].setAttribute('r', f1(dr)); g.children[2].setAttribute('r', f1(dr)); });
    var ms = o.ms || (o.start ? 520 : 1100), drawIn = o.start ? 0 : 0.3;
    tween(ms, function(f){
      var a = ease(seg(f, 0, drawIn || 0.0001)), m = ease(seg(f, drawIn, 0.82)), x = ease(seg(f, drawIn + (0.82 - drawIn) * 0.55, 0.9)), z = seg(f, 0.84, 1);
      runs.forEach(function(g){ if(!o.start){ g.querySelector('.rs2-al-l').style.strokeDashoffset = f1(g.__len * (1 - a)); g.querySelector('.rs2-al-h').style.opacity = a > 0.95 ? 1 : 0; } g.style.opacity = f1(1 - z); });
      heldEls.forEach(function(g){ g.style.opacity = f1(1 - z); });
      curves.forEach(function(cv, i){
        var p = o.start && i === fresh.length - 1 ? lerpP(o.start, cv.b, m) : bez(cv, m), d = bez(cv, Math.min(1, m + 0.02)), ang = Math.atan2(d.y - p.y, d.x - p.x) + Math.PI / 2;
        var g = flyEls[i], px = -Math.sin(ang) * sp, py = Math.cos(ang) * sp;
        g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
        g.children[1].setAttribute('cx', f1(p.x + px)); g.children[1].setAttribute('cy', f1(p.y + py));
        g.children[2].setAttribute('cx', f1(p.x - px)); g.children[2].setAttribute('cy', f1(p.y - py));
        g.style.opacity = f1(1 - seg(f, 0.86, 1));
      });
      G.mainA.style.opacity = f1(1 - x); G.mainB.style.opacity = f1(x);
    }, function(){
      G.fly.innerHTML = ''; flyEls = []; G.arrows.innerHTML = ''; G.mainB.innerHTML = ''; G.mainB.style.opacity = '0';
      labsEl.classList.remove('is-wait'); cause.el.classList.remove('is-wait');
      if(done) done();
    });
  }
  function lerpP(a, b, t){ return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
  function norm(st, key){ if(!C.isBondKey(key)) return key; var bk = C.parseBondKey(key), b = C.findBond(st, bk.a, bk.b); return b ? bondKey(b) : key; }

  /* A pair that does not make a resonance form springs back to where it came from; the arrow fades red. */
  function springBack(fromPt, toPt, done){
    G.fly.innerHTML = '<g class="rs2-flyp is-bad"><circle class="rs2-lpglow" r="9"/><circle class="rs2-e" r="3"/><circle class="rs2-e" r="3"/></g>';
    var g = G.fly.firstChild, a = G.arrows.querySelector('.is-drag');
    if(a) a.classList.add('is-bad');
    tween(380, function(f){
      var m = ease(f), p = lerpP(fromPt, toPt, m);
      g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
      g.children[1].setAttribute('cx', f1(p.x + 4)); g.children[1].setAttribute('cy', f1(p.y));
      g.children[2].setAttribute('cx', f1(p.x - 4)); g.children[2].setAttribute('cy', f1(p.y));
      g.style.opacity = f1(1 - seg(f, 0.7, 1));
      if(a) a.style.opacity = f1(1 - f);
    }, function(){ G.fly.innerHTML = ''; if(a) a.remove(); if(done) done(); });
  }

  /* ====================================================================== */
  /* What a push does                                                        */
  /* ====================================================================== */
  function outcome(arrows){
    var v = R.validate(S.cur, arrows);
    if(v.valid){
      var k = R.key(v.structure), f = S.rk.filter(function(x){ return x.key === k; })[0];
      return { kind: f ? 'form' : 'negligible', v: v, form: f || null };
    }
    if(v.code === 'octet' && completable(S.cur, arrows)) return { kind: 'held', v: v };
    return { kind: 'reject', v: v };
  }
  var RANK = { form: 0, held: 1, negligible: 2, reject: 3 };

  /* Every place an arrow from this source could end, the nearest first, with what each would do. */
  function targetsFor(src){
    var st = shown(), out = [], A = mainA;
    Object.keys(st.atoms).forEach(function(k){ if(k !== src) out.push({ key: k, x: A.atoms[k].x, y: A.atoms[k].y }); });
    st.bonds.forEach(function(b){ if(b.order < 1) return; var bk = bondKey(b); if(bk === src) return; var m = A.bonds[bk]; out.push({ key: bk, x: m.mx, y: m.my, bond: b }); });
    return out;
  }
  function judgeTarget(src, t){
    if(t.res) return t.res;
    t.res = outcome(S.pending.concat([{ from: src, to: t.key }]));
    return t.res;
  }
  /* Forgiving: the arrow lands on the nearest target that makes sense within reach; a target almost under the
     finger is taken as meant, whatever it does. */
  function snap(src, pt, list){
    var reach = Math.max(58, 44 * mainT.k), near = list.map(function(t){
      var d = t.bond ? segDist(pt, mainA.bonds[t.key]) : Math.hypot(t.x - pt.x, t.y - pt.y) - mainA.atoms[t.key].r * 0.6;
      return { t: t, d: d };
    }).filter(function(x){ return x.d < reach; }).sort(function(a, b){ return a.d - b.d; });
    if(!near.length) return null;
    if(near[0].d < Math.max(12, 9 * mainT.k)) return near[0].t;
    var best = null, br = 9;
    near.forEach(function(x){ var r = RANK[judgeTarget(src, x.t).kind]; if(r < br){ br = r; best = x.t; } });
    return best;
  }
  function segDist(p, b){
    var dx = b.x2 - b.x1, dy = b.y2 - b.y1, l2 = dx * dx + dy * dy || 1, t = Math.max(0.15, Math.min(0.85, ((p.x - b.x1) * dx + (p.y - b.y1) * dy) / l2));
    return Math.hypot(p.x - (b.x1 + dx * t), p.y - (b.y1 + dy * t));
  }
  /* What the finger grabbed: a lone pair (or the atom that holds it), a π bond, or (to be told why not) an atom
     with no lone pair or a single bond. */
  function sourceAt(pt){
    var st = shown(), A = mainA, best = null, bd = Infinity;
    function take(key, d, x, y, real){ if(d < bd){ bd = d; best = { key: key, x: x, y: y, real: real }; } }
    Object.keys(A.lps).forEach(function(k){ A.lps[k].forEach(function(l){ take(k, Math.hypot(l.x - pt.x, l.y - pt.y) - 6, l.x, l.y, true); }); });
    st.bonds.forEach(function(b){ if(b.order >= 2){ var bk = bondKey(b), pi = A.pis[bk]; take(bk, segDist(pt, pi) - 4, pi.mx, pi.my, true); } });
    Object.keys(A.atoms).forEach(function(k){ var a = A.atoms[k], d = Math.hypot(a.x - pt.x, a.y - pt.y) - a.r;
      if((st.atoms[k].lp || 0) > 0){ var l = A.lps[k][0]; take(k, d + 2, l.x, l.y, true); } else take(k, d + 10, a.x, a.y, false); });
    st.bonds.forEach(function(b){ if(b.order === 1){ var m = A.bonds[bondKey(b)]; take(bondKey(b), segDist(pt, m) + 10, m.mx, m.my, false); } });
    var reach = Math.max(26, 20 * mainT.k);
    return bd < reach ? best : null;
  }

  /* After a push: land it. */
  function commit(src, t, dropPt, srcPt){
    var ar = { from: src, to: t.key }, res = judgeTarget(src, t), arrows = S.pending.concat([ar]);
    S.took = true; hideCue(true); tourTurn.did('push');
    if(S.mode === 'quiz' && S.part === 'find') hints.attempt();
    if(res.kind === 'reject'){
      // the pair stays lifted (its place empty) while it springs back along the arrow, drawn red
      if(!G.arrows.querySelector('.is-drag')) G.arrows.insertAdjacentHTML('beforeend', '<g class="rs2-arrow is-drag">' + arrowPathHtml(curve(srcPt, { x: t.x, y: t.y })) + '</g>');
      springBack(dropPt, srcPt, function(){ paintAll(); words(res, ar); });
      words(res, ar, true);
      return;
    }
    var from = shown();
    if(res.kind === 'held'){
      var mid = C.apply(S.cur, arrows).structure;
      moveElectrons(from, mid, arrows, { start: dropPt, from: srcPt, fresh: [ar], ms: 420 }, function(){ S.pending = arrows; S.pendingSt = mid; after(res, ar); });
      return;
    }
    var next = res.v.structure;
    moveElectrons(from, next, arrows, { start: dropPt, from: srcPt, fresh: [ar], ms: 480 }, function(){
      S.hist.push({ cur: S.cur });
      S.cur = res.form ? res.form.st : next; S.pending = []; S.pendingSt = null;
      after(res, ar, arrows);
    });
  }
  function arrowPathHtml(cv){ var p = arrowPath(cv); return '<path class="rs2-al-l" d="' + p.line + '"/><path class="rs2-al-h" d="' + p.head + '"/>'; }
  function after(res, ar, arrows){
    if(res.kind === 'form'){ S.visited[res.form.key] = 1; if(S.mode === 'quiz' && S.part === 'find' && !hunt.found[res.form.key]){ hunt.found[res.form.key] = 'found'; huntPanel(); } }
    paintAll(); words(res, ar, false, arrows);
    syncState();
  }

  /* Go to a form from the row (or the answer in Test yourself): the arrows are drawn, then the electrons move. */
  function goTo(f, done){
    if(!S.cur || f.key === R.key(S.cur)){ if(done) done(); return; }
    stopTween();
    var path = pathTo(S.pendingSt ? S.cur : S.cur, f.st, S.rk.map(function(x){ return x.st; }));
    S.pending = []; S.pendingSt = null; paintMain();
    if(!path){ S.cur = f.st; paintAll(); words({ kind: 'form', form: f }, null); if(done) done(); return; }
    var i = 0;
    (function next(){
      var stp = path[i], from = S.cur;
      moveElectrons(from, stp.st, stp.arrows, {}, function(){
        S.hist.push({ cur: from }); S.cur = stp.st;
        var fk = R.key(stp.st), ff = S.rk.filter(function(x){ return x.key === fk; })[0];
        if(ff) S.visited[ff.key] = 1;
        i++;
        if(i < path.length){ paintAll(); next(); return; }
        paintAll(); words({ kind: 'form', form: f, v: { structure: f.st } }, null, false, stp.arrows); syncState();
        if(done) done();
      });
    })();
  }

  function undo(){
    stopTween();
    if(S.pending.length){
      S.pending.pop();
      S.pendingSt = S.pending.length ? C.apply(S.cur, S.pending).structure : null;
    } else if(S.hist.length){
      S.cur = S.hist.pop().cur;
    } else return;
    paintAll(); words(null); syncState();
    say('Undone. ' + cause.text());
  }

  /* ====================================================================== */
  /* Pointer and keys on the molecule                                         */
  /* ====================================================================== */
  var drag = null, tapSrc = null;
  function local(e){ var r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left) * L.W / r.width, y: (e.clientY - r.top) * L.H / r.height }; }
  hit.addEventListener('pointerdown', function(e){
    if(!S.cur || tw) return;
    var pt = local(e), src = sourceAt(pt);
    if(tapSrc && !src){ var tl = targetsFor(tapSrc.key), t0 = snap(tapSrc.key, pt, tl); if(t0){ var s0 = tapSrc; tapSrc = null; clearPick(); commit(s0.key, t0, { x: t0.x, y: t0.y }, { x: s0.x, y: s0.y }); } return; }
    if(!src) return;
    if(tapSrc && src.key !== tapSrc.key){
      // a tap on a second thing after picking one: that is where the electrons go
      var tl2 = targetsFor(tapSrc.key), t2 = snap(tapSrc.key, pt, tl2);
      if(t2){ var s2 = tapSrc; tapSrc = null; clearPick(); commit(s2.key, t2, { x: t2.x, y: t2.y }, { x: s2.x, y: s2.y }); return; }
    }
    e.preventDefault();
    try{ hit.setPointerCapture(e.pointerId); }catch(er){}
    drag = { src: src, start: pt, moved: false, list: targetsFor(src.key), t: null, id: e.pointerId };
    hideCue(true);
  });
  hit.addEventListener('pointermove', function(e){
    if(!drag || e.pointerId !== drag.id) return;
    var pt = local(e);
    if(!drag.moved && Math.hypot(pt.x - drag.start.x, pt.y - drag.start.y) < 6) return;
    if(!drag.moved){ drag.moved = true; startDragVis(drag); }
    drag.pt = pt;
    drag.t = snap(drag.src.key, pt, drag.list);
    paintDrag(drag);
  });
  function endDrag(e, cancel){
    if(!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null;
    if(!d.moved){
      // a tap: pick this source, then tap where its electrons go
      endDragVis();
      if(!d.src.real){ commitBad(d.src); return; }
      tapSrc = d.src; showPick(d.src); return;
    }
    if(cancel || !d.t){ endDragVis(); springBack(d.pt || d.start, { x: d.src.x, y: d.src.y }, function(){ paintAll(); }); return; }
    endDragVis(true);
    commit(d.src.key, d.t, d.pt, { x: d.src.x, y: d.src.y });
  }
  hit.addEventListener('pointerup', function(e){ endDrag(e); });
  hit.addEventListener('pointercancel', function(e){ endDrag(e, true); });
  hit.addEventListener('lostpointercapture', function(e){ if(drag && drag.id === e.pointerId) endDrag(e, true); });

  // what is shown while dragging: the source dimmed, the pair on the finger, the arrow to the lit target
  var dv = null;
  function startDragVis(d){
    var key = d.src.key, omitLp = {}, omitPi = {};
    if(d.src.real){ if(C.isBondKey(key)) omitPi[key] = 1; else omitLp[key] = [{ x: d.src.x, y: d.src.y }]; }
    var st = shown(), noQ = {}; over(st).forEach(function(k){ noQ[k] = 1; });
    G.mainA.innerHTML = draw(st, mainT, { omitLp: omitLp, omitPi: omitPi, noCharge: noQ }).html;
    G.fly.innerHTML = '<g class="rs2-flyp is-drag"><circle class="rs2-lpglow" r="10"/><circle class="rs2-e" r="3"/><circle class="rs2-e" r="3"/></g>';
    G.arrows.insertAdjacentHTML('beforeend', '<g class="rs2-arrow is-drag"><path class="rs2-al-l"/><path class="rs2-al-h"/></g><circle class="rs2-tgt" r="0"/><line class="rs2-tgtb"/>');
    var s = mainT.k, dr = Math.max(2.4, 2.2 * s), sp = Math.max(3.4, 2.9 * s), fp = G.fly.firstChild;
    fp.children[0].setAttribute('r', f1(sp * 2.1)); fp.children[1].setAttribute('r', f1(dr)); fp.children[2].setAttribute('r', f1(dr));
    dv = { pair: fp, arrow: G.arrows.querySelector('.is-drag'), tgt: G.arrows.querySelector('.rs2-tgt'), tgtb: G.arrows.querySelector('.rs2-tgtb'), sp: sp };
    labsEl.classList.add('is-drag');
  }
  function paintDrag(d){
    if(!dv) return;
    var p = d.pt, sp = dv.sp, g = dv.pair;
    g.children[0].setAttribute('cx', f1(p.x)); g.children[0].setAttribute('cy', f1(p.y));
    g.children[1].setAttribute('cx', f1(p.x + sp)); g.children[1].setAttribute('cy', f1(p.y));
    g.children[2].setAttribute('cx', f1(p.x - sp)); g.children[2].setAttribute('cy', f1(p.y));
    var end = d.t ? (d.t.bond ? { x: d.t.x, y: d.t.y } : anchorOf({ from: d.src.key, to: d.t.key }, mainA, 'to')) : p;
    var a = arrowPath(curve({ x: d.src.x, y: d.src.y }, end));
    dv.arrow.children[0].setAttribute('d', a.line); dv.arrow.children[1].setAttribute('d', a.head);
    var kind = d.t ? judgeTarget(d.src.key, d.t).kind : null;
    dv.arrow.setAttribute('class', 'rs2-arrow is-drag' + (kind === 'reject' ? ' is-no' : ''));
    if(d.t && !d.t.bond){ var at = mainA.atoms[d.t.key]; dv.tgt.setAttribute('cx', f1(at.x)); dv.tgt.setAttribute('cy', f1(at.y)); dv.tgt.setAttribute('r', f1(at.r + 7)); dv.tgtb.setAttribute('class', 'rs2-tgtb'); }
    else dv.tgt.setAttribute('r', '0');
    if(d.t && d.t.bond){ var b = mainA.bonds[d.t.key]; ['x1', 'y1', 'x2', 'y2'].forEach(function(n){ dv.tgtb.setAttribute(n, f1(b[n])); }); dv.tgtb.setAttribute('class', 'rs2-tgtb is-on'); }
    else dv.tgtb.setAttribute('class', 'rs2-tgtb');
    dv.tgt.setAttribute('class', 'rs2-tgt' + (kind === 'reject' ? ' is-no' : ''));
  }
  function endDragVis(keepArrow){
    if(dv){ dv.tgt.remove(); dv.tgtb.remove(); if(!keepArrow) dv.arrow.remove(); }
    G.fly.innerHTML = ''; dv = null; labsEl.classList.remove('is-drag');
  }
  function showPick(src){
    G.ui.insertAdjacentHTML('beforeend', '<circle class="rs2-pickring" cx="' + f1(src.x) + '" cy="' + f1(src.y) + '" r="' + f1(Math.max(13, 10 * mainT.k)) + '"/>');
    cause.set([{ t: C.isBondKey(src.key) ? 'π bond picked' : 'Lone pair picked', role: 'e' }, { t: 'tap where it goes', role: 'ink' }]);
    say(cause.text());
  }
  function clearPick(){ [].forEach.call(G.ui.querySelectorAll('.rs2-pickring'), function(n){ n.remove(); }); }
  function commitBad(src){
    // grabbed an atom with no lone pair, or a single bond: say why nothing moves
    var st = shown(), t;
    if(C.isBondKey(src.key)) t = [{ t: 'Single bond: σ only', role: 'bad' }, { t: 'grab a lone pair or π bond', role: 'ink' }];
    else t = [{ t: labelOf(st, src.key) + ' has no lone pair', role: 'bad' }, { t: 'grab a lone pair or π bond', role: 'ink' }];
    cause.set(t); say(cause.text());
  }

  // keys: arrows pick what to move, Enter takes it, arrows pick where it goes, Enter pushes; Esc cancels; Backspace undoes
  var kb = { phase: 'src', i: 0, list: [], src: null };
  function kbSources(){
    var st = shown(), A = mainA, out = [];
    Object.keys(st.atoms).forEach(function(k){ if((st.atoms[k].lp || 0) > 0 && A.lps[k].length){ var l = A.lps[k][0]; out.push({ key: k, x: l.x, y: l.y, real: true, say: 'lone pair on ' + atomName(st, k) }); } });
    st.bonds.forEach(function(b){ if(b.order >= 2){ var bk = bondKey(b), p = A.pis[bk]; out.push({ key: bk, x: p.mx, y: p.my, real: true, say: 'π bond ' + atomName(st, b.a) + ' to ' + atomName(st, b.b) }); } });
    return out;
  }
  function atomName(st, k){
    var a = st.atoms[k], same = Object.keys(st.atoms).filter(function(o){ return st.atoms[o].el === a.el; });
    var q = fc(st, k), extra = q ? (q < 0 ? ' (negative)' : ' (positive)') : '';
    if(same.length < 2) return labelOf(st, k) + extra;
    var p = st.atoms[k], cx = 0, cy = 0; same.forEach(function(o){ cx += st.atoms[o].x; cy += st.atoms[o].y; }); cx /= same.length; cy /= same.length;
    var dx = p.x - cx, dy = p.y - cy, where = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'top' : 'bottom') : (dx < 0 ? 'left' : 'right');
    return labelOf(st, k) + ' ' + where + extra;
  }
  function kbTargets(src){
    var st = shown();
    return targetsFor(src.key).map(function(t){ t.res = null; return t; }).filter(function(t){
      // the places one step over: bonds at the source's atoms and atoms of the source bond, with their neighbours
      var ends = C.isBondKey(src.key) ? [C.parseBondKey(src.key).a, C.parseBondKey(src.key).b] : [src.key];
      if(t.bond) return ends.indexOf(t.bond.a) >= 0 || ends.indexOf(t.bond.b) >= 0;
      return ends.indexOf(t.key) >= 0 || ends.some(function(e){ return C.neighbors(st, e).indexOf(t.key) >= 0; });
    }).sort(function(a, b){ return RANK[judgeTarget(src.key, a).kind] - RANK[judgeTarget(src.key, b).kind]; }).map(function(t){
      t.say = t.bond ? 'into the ' + atomName(st, t.bond.a) + ' to ' + atomName(st, t.bond.b) + ' bond' : 'onto ' + atomName(st, t.key);
      return t;
    });
  }
  function kbMark(p){ clearPick(); if(p) G.ui.insertAdjacentHTML('beforeend', '<circle class="rs2-pickring is-kb" cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(Math.max(13, 10 * mainT.k)) + '"/>'); }
  hit.addEventListener('keydown', function(e){
    if(!S.cur || tw) return;
    var k = e.key;
    if(k === 'Backspace' || ((e.ctrlKey || e.metaKey) && k === 'z')){ e.preventDefault(); undo(); kb.phase = 'src'; return; }
    if(k === 'Escape'){ if(kb.phase === 'tgt'){ e.preventDefault(); kb.phase = 'src'; kbMark(null); say('Cancelled.'); } return; }
    if(['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(k) >= 0){
      e.preventDefault(); hideCue(true);
      var step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : -1;
      if(kb.phase === 'src'){ kb.list = kbSources(); }
      if(!kb.list.length) return;
      kb.i = kb.started ? (kb.i + step + kb.list.length) % kb.list.length : 0; kb.started = true;
      var it = kb.list[kb.i]; kbMark(it);
      say((kb.phase === 'src' ? 'Move the ' : 'Push it ') + it.say + '. ' + (kb.i + 1) + ' of ' + kb.list.length + '. Enter to ' + (kb.phase === 'src' ? 'pick it.' : 'push.'));
      return;
    }
    if(k === 'Enter' || k === ' '){
      e.preventDefault();
      if(kb.phase === 'src'){
        kb.list = kbSources(); if(!kb.list.length) return;
        var sc = kb.list[kb.started ? kb.i % kb.list.length : 0];
        kb.src = sc; kb.phase = 'tgt'; kb.list = kbTargets(sc); kb.i = 0; kb.started = true;
        if(!kb.list.length){ kb.phase = 'src'; return; }
        kbMark(kb.list[0]); say('Picked the ' + sc.say + '. Arrows choose where it goes: ' + kb.list[0].say + ', 1 of ' + kb.list.length + '. Enter to push.');
      } else {
        var t = kb.list[kb.i], src = kb.src; kb.phase = 'src'; kb.started = false; kbMark(null);
        commit(src.key, t, { x: t.x, y: t.y }, { x: src.x, y: src.y });
      }
    }
  });
  hit.addEventListener('blur', function(){ if(kb.phase === 'tgt'){ kb.phase = 'src'; kbMark(null); } kb.started = false; });

  thumbsEl.addEventListener('click', function(e){
    var b = e.target.closest('.rs2-tb'); if(!b || b.disabled) return;
    var f = S.rk[+b.getAttribute('data-i')]; if(!f) return;
    hideCue(true); S.took = true;
    goTo(f);
  });
  undoBtn.addEventListener('click', undo);
  sel.addEventListener('change', function(){
    if(sel.value === '__built' && built){ load(built.st, built.name, true); return; }
    var sp = SPECIES.filter(function(x){ return x.id === sel.value; })[0];
    if(sp) select(sp);
  });

  /* ====================================================================== */
  /* Words: the cause line and the screen reader text                        */
  /* ====================================================================== */
  function whereQ(st){
    var cs = charged(st);
    if(!cs.length) return null;
    var by = {};
    cs.forEach(function(c){ var t = sign(c.q) + ' on '; by[t] = by[t] || []; by[t].push(labelOf(st, c.k)); });
    return Object.keys(by).map(function(t){ var els = by[t]; return t + (els.length > 1 && els.every(function(x){ return x === els[0]; }) ? els.length + ' ' + els[0] : els.join(', ')); }).join(', ');
  }
  function roleQ(st){ var cs = charged(st); if(!cs.length) return 'ink'; var n = cs.some(function(c){ return c.q < 0; }), p = cs.some(function(c){ return c.q > 0; }); return n && p ? 'ink' : n ? 'neg' : 'pos'; }
  function moveWords(arrows){
    if(!arrows || !arrows.length) return null;
    var lps = arrows.filter(function(a){ return !C.isBondKey(a.from); }).length, pis = arrows.length - lps;
    if(arrows.length === 1) return lps ? 'Lone pair moved' : 'π bond moved';
    if(!lps) return arrows.length + ' π bonds moved';
    return arrows.length + ' pairs moved';
  }
  function verdict(f){
    if(!f) return null;
    if(f.tag === 'equal') return { t: 'equal form', role: 'good' };
    if(f.major) return { t: 'major form', role: 'good' };
    var best = S.rk[0].st;
    var why = { 'octet': 'short of an octet', 'charge-count': 'more charges', 'like-charges': 'like charges side by side', 'ring': 'ring not aromatic' }[f.rule];
    if(f.rule === 'electronegativity'){
      var a = charged(f.st), b = charged(best), neg = a.filter(function(c){ return c.q < 0; })[0], nb = b.filter(function(c){ return c.q < 0; })[0];
      var pos = a.filter(function(c){ return c.q > 0; })[0], pb = b.filter(function(c){ return c.q > 0; })[0];
      why = neg && nb ? '− on ' + neg.el + ', not ' + nb.el : pos && pb ? '+ on ' + pos.el + ', not ' + pb.el : 'charge on a worse atom';
    }
    return { t: 'minor: ' + why, role: 'minor' };
  }
  function overAtom(st){ var o = over(st)[0]; return o ? labelOf(st, o) : null; }
  function words(res, ar, early, arrows){
    var st = shown();
    if(!st) return;
    var parts;
    if(!res){
      if(S.pendingSt){
        var oa = overAtom(S.pendingSt);
        parts = [{ t: oa + ': ' + C.electronCount(S.pendingSt, over(S.pendingSt)[0]) + ' e⁻', role: 'warn' }, { t: 'move a π bond off ' + oa, role: 'e' }];
      } else {
        var f = S.rk.filter(function(x){ return x.key === R.key(st); })[0];
        if(!S.took && f) parts = [{ t: 'Lone pair', role: 'e' }, { t: 'π bond', role: 'e', join: '+' }, { t: 'one place over', role: 'ink' }, { t: 'a new form', role: 'ink' }];
        else if(f){ var w = whereQ(st), v = verdict(f); parts = [{ t: w || 'no charges', role: roleQ(st) }].concat(v ? [v] : []); }
        else parts = [{ t: 'Negligible form', role: 'warn' }];
      }
    } else if(res.kind === 'reject'){
      parts = rejectWords(res.v, ar);
    } else if(res.kind === 'held'){
      var mid = S.pendingSt || C.apply(S.cur, S.pending.concat([ar])).structure, ok = overAtom(mid);
      parts = [{ t: ok + ': ' + C.electronCount(mid, over(mid)[0]) + ' e⁻', role: 'warn' }, { t: 'move a π bond off ' + ok, role: 'e' }];
    } else if(res.kind === 'negligible'){
      var sh = short(st)[0];
      parts = [{ t: moveWords(arrows) || 'Pair moved', role: 'e' }, { t: (sh ? labelOf(st, sh) + ': ' + C.electronCount(st, sh) + ' e⁻' : 'worse octets'), role: 'warn' }, { t: 'negligible form', role: 'warn' }];
    } else {
      var f2 = res.form, w2 = whereQ(st), v2 = verdict(f2);
      parts = [{ t: moveWords(arrows) || 'Electrons moved', role: 'e' }, { t: w2 || 'no charges', role: roleQ(st) }].concat(v2 ? [v2] : []);
    }
    cause.set(parts);
    if(res && res.kind === 'reject' && res.v && res.v.reason) S.lastWhy = undash(res.v.reason);
    if(!early){
      var all = S.rk.length > 1 && S.rk.every(function(x){ return S.visited[x.key]; });
      if(res && res.kind === 'form' && all && !S.tookAll && S.mode === 'explore' && S.rk.length > 2){
        S.tookAll = true;
        cause.take('Every form reached. The real molecule blends them' + (S.rk[0].tag === 'equal' ? ' all equally.' : ', mostly the major ones.'));
      }
      say(cause.text() + ' ' + (res && res.kind === 'reject' && S.lastWhy ? S.lastWhy + ' ' : '') + boardText());
      if(res && res.kind === 'reject') refNow();
    }
    hit.setAttribute('aria-label', boardText());
  }
  function rejectWords(v, ar){
    var st = S.cur, code = v.code;
    if(code === 'broke-sigma') return [{ t: 'Breaks a σ bond', role: 'bad' }, { t: 'atoms must stay bonded', role: 'ink' }];
    if(code === 'new-sigma'){ var bk = ar && !C.isBondKey(ar.to) ? labelOf(st, ar.to) : 'a new atom'; return [{ t: 'New bond to ' + bk, role: 'bad' }, { t: 'that is a reaction', role: 'ink' }]; }
    if(code === 'no-lone-pair' || code === 'group-source') return [{ t: labelOf(st, ar.from) + ' has no lone pair', role: 'bad' }, { t: 'start where electrons are', role: 'ink' }];
    if(code === 'not-adjacent') return [{ t: 'Not next to it', role: 'bad' }, { t: 'move one place over', role: 'ink' }];
    if(code === 'no-change') return [{ t: 'Arrows cancel', role: 'warn' }, { t: 'same form', role: 'ink' }];
    if(code === 'octet'){ var mid = v.structure, k = over(mid)[0]; return [{ t: (k ? labelOf(mid, k) : 'An atom') + ': ' + (k ? C.electronCount(mid, k) : 10) + ' e⁻', role: 'bad' }, { t: 'no way to make room', role: 'ink' }]; }
    if(code === 'over-broken') return [{ t: 'One bond used twice', role: 'bad' }, { t: 'a bond has one pair', role: 'ink' }];
    return [{ t: 'Not a resonance form', role: 'bad' }];
  }
  function boardText(){
    var st = shown(); if(!st) return '';
    var f = S.rk.filter(function(x){ return x.key === R.key(st); })[0], i = f ? S.rk.indexOf(f) + 1 : 0;
    var dbl = st.bonds.filter(function(b){ return b.order >= 2; }).map(function(b){ return atomName(st, b.a) + ' = ' + atomName(st, b.b); });
    return S.name + (f ? ', form ' + i + ' of ' + S.rk.length + ' (' + f.tag + ')' : S.pendingSt ? ', a push held' : ', a negligible form') +
      '. Double bonds: ' + (dbl.join('; ') || 'none') + '. Charges: ' + (whereQ(st) || 'none') + '. Arrow keys pick a lone pair or π bond to move.';
  }

  /* ====================================================================== */
  /* Loading a species                                                      */
  /* ====================================================================== */
  function select(sp){
    S.sp = sp;
    var mol = Mol.get(sp.id);
    load(C.fromMolecule(mol), mol.name, false);
  }
  function load(st, name, isBuilt){
    stopTween(); tapSrc = null; kb.phase = 'src';
    S.start = st; S.name = name || ''; S.built = !!isBuilt;
    S.rk = rankForms(R.contributors(st));
    S.hyb = S.rk.length > 1 ? hybridOf(S.rk) : null;
    var k0 = R.key(st);
    S.cur = (S.rk.filter(function(x){ return x.key === k0; })[0] || S.rk[0]).st;
    S.pending = []; S.pendingSt = null; S.hist = []; S.visited = {}; S.visited[k0] = 1; S.tookAll = false; S.lastWhy = null;
    hunt.found = {}; hunt.found[k0] = 'given'; hunt.done = S.rk.length < 2;
    sel.querySelector('[value="__built"]').hidden = !isBuilt;
    sel.value = isBuilt ? '__built' : S.sp.id;
    if(S.mode === 'quiz' && S.part === 'find'){ hints.reset(); huntPanel(); }
    var fade = drawn && !K.reduced() && G.mainA.animate;
    paintAll(); words(null);
    if(fade) try{ [G.mainA, G.hyb, G.strip].forEach(function(n){ n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' }); }); }catch(e){}
    syncState(); refNow(); placeCue();
    warm();
  }
  /* The arrows between every two forms are found ahead, a pair at a time while the page is idle, so a tap on a form
     starts moving at once (phenoxide's search is the slowest, tens of milliseconds a pair). */
  var warmId = 0;
  function warm(){
    var id = ++warmId, forms = S.rk.map(function(x){ return x.st; }), pairs = [];
    forms.forEach(function(a){ forms.forEach(function(b){ if(a !== b) pairs.push([a, b]); }); });
    var idle = window.requestIdleCallback || function(f){ return setTimeout(function(){ f({ timeRemaining: function(){ return 8; } }); }, 60); };
    (function step(){ idle(function(dl){ while(pairs.length && id === warmId && dl.timeRemaining() > 4){ var p = pairs.shift(); arrowsBetween(p[0], p[1]); } if(pairs.length && id === warmId) step(); }); })();
  }

  function syncState(){
    if(!window.OchemToolState || booting) return;
    window.OchemToolState.write({
      mode: S.mode === 'quiz' && S.part === 'compare' ? 'compare' : null,
      sp: !S.built && S.sp ? (S.sp.id === SPECIES[0].id ? null : S.sp.id) : null,
      a: S.part === 'compare' && cmp.a ? cmp.a.id : null,
      b: S.part === 'compare' && cmp.b ? cmp.b.id : null
    });
  }

  /* ====================================================================== */
  /* The first visit cue and "Show me how"                                   */
  /* ====================================================================== */
  var cue = null, cueSide = 0, SIDES = ['below', 'above', 'right', 'left'];
  function firstSource(){
    var st = S.cur, next = S.rk.filter(function(x){ return x.key !== R.key(st); })[0];
    if(!next || !mainA) return null;
    var ar = arrowsBetween(st, next.st); if(!ar) return null;
    // every spot the cue may point at: each lone pair of an atom the first move starts from, then each π bond it moves
    var spots = [];
    ar.filter(function(a){ return !C.isBondKey(a.from); }).concat(ar.filter(function(a){ return C.isBondKey(a.from); })).forEach(function(a){
      var p = anchorOf(a, mainA, 'from'), isLp = !C.isBondKey(a.from);
      spots.push({ x: p.x, y: p.y, lp: isLp });
      if(isLp) (mainA.lps[a.from] || []).forEach(function(l){ if(l.x !== p.x || l.y !== p.y) spots.push({ x: l.x, y: l.y, lp: true }); });
    });
    return { x: spots[0].x, y: spots[0].y, lp: spots[0].lp, spots: spots };
  }
  /* The one first visit cue: of every spot it may point at and every side, the first whose bubble is inside the
     picture and covers no ball, name or control (the full words first, then shorter ones); failing that, the one that
     covers least. */
  var cueAt = null;
  function placeCue(){
    if(cue){ cue.hide(false); cue = null; }
    if(S.mode !== 'explore' || S.took) return;
    var fs = firstSource(); if(!fs) return;
    var best = null;
    for(var ti = 0; ti < 2; ti++){
      for(var j = 0; j < fs.spots.length; j++){
        var sp = fs.spots[j], text = sp.lp ? ['Drag this lone pair', 'Drag this pair'][ti] : ['Drag this π bond', 'Drag the π bond'][ti];
        for(var i = 0; i < SIDES.length; i++){
          cue = K.cue(layer, { key: 'ochem-res-push', text: text, side: SIDES[i], at: function(){ return [cueAt.x, cueAt.y]; } });
          cueAt = sp;
          if(!cue.show()){ cue = null; return; }
          var sc = cueScore();
          if(sc === 0){ return; }
          if(!best || sc < best.sc) best = { sc: sc, spot: sp, side: SIDES[i], text: text };
          cue.hide(false); cue = null;
        }
      }
    }
    cueAt = best.spot;
    cue = K.cue(layer, { key: 'ochem-res-push', text: best.text, side: best.side, at: function(){ return [cueAt.x, cueAt.y]; } });
    cue.show();
  }
  function cueScore(){
    var b = layer.el.querySelector('.tk2-cue'); if(!b) return 0;
    var r = b.getBoundingClientRect(), s = sceneBox.getBoundingClientRect(), sc = 0;
    var out = Math.max(0, s.left + 2 - r.left) + Math.max(0, r.right - s.right + 2) + Math.max(0, s.top + 2 - r.top) + Math.max(0, r.bottom - s.bottom + 2);
    sc += out * 1000;
    var things = [].slice.call(svg.querySelectorAll('.rs2-mainA .rs2-ball, .rs2-mainA .rs2-badge circle, .rs2-mainA .rs2-lp, .rs2-hyb .rs2-ball, .rs2-thumb')).concat([].slice.call(labsEl.children), [pick.querySelector('select'), undoBtn]);
    things.forEach(function(t){ var q = t.getBoundingClientRect(), w = Math.min(r.right, q.right) - Math.max(r.left, q.left), h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); if(w > 0 && h > 0) sc += w * h; });
    return sc;
  }
  function hideCue(used){ if(cue){ cue.hide(used); cue = null; } }

  var tourTurn = K.tour({ key:'ochem-res', label:'Show me how', steps: [
    { id:'push', text:'Grab a lone pair or a π bond and drag it one place over. The curved arrow follows.', target: function(){ var f = cueAt || firstSource(); if(!f) return hit; var r = svg.getBoundingClientRect(); return { left: r.left + f.x - 14, top: r.top + f.y - 14, width: 28, height: 28, right: r.left + f.x + 14, bottom: r.top + f.y + 14 }; } },
    { id:'forms', text:'Every form of this species is in the row. Major forms count most; tap one to see the arrows that reach it.', target: function(){ return thumbsEl.firstChild || thumbsEl; } },
    { id:'real', text:'The real molecule is none of the forms: it is this blend, with the π electrons and the charge shared.', target: function(){ var r = svg.getBoundingClientRect(); return L.hyb ? { left: r.left + L.hyb.x, top: r.top + L.hyb.y - 30, width: L.hyb.w, height: L.hyb.h + 30, right: r.left + L.hyb.x + L.hyb.w, bottom: r.top + L.hyb.y + L.hyb.h } : hit; } }
  ] });
  function startTour(){ hideCue(true); tourTurn.start(true); }

  /* ====================================================================== */
  /* "?": this species rule by rule, how to read the picture, build your own */
  /* ====================================================================== */
  var ref = mk('div', 'rs2-ref',
    '<p class="rs2-ref-how"><button type="button" class="tk2-how" id="rsRefHow">Show me how</button></p>' +
    '<div id="rsRefNow"></div>' +
    '<details class="tool-more" open><summary>How to read the picture</summary><div class="rs2-ref-key">' +
      '<p><span class="rs2-sw is-e"></span><b>Violet:</b> electrons that can move: lone pairs (two dots) and π bonds (the second line of a double bond). Curved arrows are violet too: each moves one pair, from where it is to one place over.</p>' +
      '<p><span class="rs2-sw is-neg"></span><b>Red glow:</b> a negative formal charge. <span class="rs2-sw is-pos"></span><b>Blue glow:</b> a positive one. The badge gives the sign.</p>' +
      '<p><span class="rs2-sw is-warn"></span><b>Amber ring:</b> an atom without an octet, with its electron count. "10 e⁻" means a push has to make room: a second arrow moves a π bond away from that atom (the first arrow is held until then). Fewer than 8 on carbon is allowed in a cation, and costs.</p>' +
      '<p><b>The atoms never move</b> in resonance, and no σ bond breaks or forms. A push that would do either springs back.</p>' +
      '<p><b>Major, minor, equal.</b> The rules, in the order they are applied: full octets first, then fewest formal charges, then no like charges side by side, then a negative charge on the most electronegative atom (a positive one on the least). For a benzene ring, a form that keeps its three alternating double bonds outranks one that does not when those rules tie. Minor forms are drawn smaller in the row. The tool ranks the forms; it does not put numbers on how much each contributes.</p>' +
      '<p><b>The real molecule</b> (the resonance hybrid) is drawn with a soft violet band along every bond that is double in some forms and single in others, and a glow on every atom that carries charge in some forms: large where a major form puts it, small where only a minor one does. When every form is equally good the share is exact (−½ on each oxygen of acetate) and is written as a fraction; otherwise it is marked δ. Lone pairs are left off it, since which atom holds them is what differs between forms.</p>' +
      '<p>The balls and their sizes are a model, not to scale. A ball marked CH₃ stands for the whole group.</p>' +
    '</div></details>' +
    '<details class="tool-more" id="rsBuildBox"><summary>Build your own</summary><div id="rsBuilder"></div><div id="rsBuildMsg"></div><div id="rsSend"></div></details>');

  function refNow(){
    var el = byId('rsRefNow'); if(!el) return;
    var forms = S.rk.map(function(x){ return x.st; });
    var html = '<h3 class="rs2-ref-h">' + esc(S.name || 'This species') + ': ' + S.rk.length + ' form' + (S.rk.length === 1 ? '' : 's') + '</h3>';
    if(S.rk.length > 1){
      var cmpTxt = R.compare(S.rk[0].st, S.rk[S.rk.length - 1].st);
      html += '<p>' + (S.rk[0].tag === 'equal'
        ? esc(undash(cmpTxt.text)) + ' So the charge is not hopping between them: it is spread across ' + (S.rk.length === 2 ? 'both' : 'all ' + S.rk.length) + ' positions at once, and each carries a share.'
        : (S.rk[S.rk.length - 1].rule === 'ring'
          ? 'By the charge rules these forms tie. The ones that keep the benzene ring as three alternating double bonds count for more, so they are the major forms here.'
          : esc(undash(R.compare(S.rk[S.rk.length - 1].st, S.rk[0].st).text)) + ' The real molecule resembles the major form most; the others still contribute.')) + '</p>';
    } else html += '<p>One form only: there is nowhere for a lone pair or a π bond to go without breaking an octet or the skeleton. Most molecules have no resonance at all.</p>';
    html += '<div class="ttable-scroll"><table class="ttable"><thead><tr><th>Form</th><th>Octets</th><th>Formal charges</th><th>Standing</th></tr></thead><tbody>' +
      S.rk.map(function(f, i){
        var s = R.score(f.st), d = R.describe(f.st, forms);
        return '<tr><td class="num">' + (i + 1) + '</td><td>' + (s.incomplete ? s.incomplete + ' short' : 'all complete') + '</td><td>' + esc(whereQ(f.st) || 'none') + '</td><td>' + esc(f.tag) + (f.major ? '' : ' (' + esc(verdict(f).t.replace(/^minor: /, '')) + ')') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    if(S.lastWhy) html += '<p><b>The last push that sprang back:</b> ' + esc(S.lastWhy) + '</p>';
    if(/phenoxide|benzyl/.test(S.sp && !S.built ? S.sp.id : '')) html += '<p class="tmuted">Five forms here, four in most textbooks: the ring’s own two Kekulé forms are both counted, where a textbook usually holds the ring fixed.</p>';
    el.innerHTML = html;
  }

  var builderApi = null, sendApi = null, lastBuilt = null;
  function openBuilder(){
    var box = byId('rsBuilder'), msg = byId('rsBuildMsg');
    if(builderApi || !window.OchemBuilderUI || !box) return builderApi;
    if(window.OchemToolHandoff) sendApi = window.OchemToolHandoff.mountSend(byId('rsSend'), function(){ return lastBuilt; });
    builderApi = window.OchemBuilderUI.mount(box, {
      onChange: function(st, rep){
        lastBuilt = (rep.empty || !rep.ok) ? null : st;
        if(sendApi) sendApi.refresh();
        if(rep.empty){ msg.innerHTML = ''; return; }
        if(!rep.ok){ msg.innerHTML = '<div class="tnote tnote--bad" style="margin-top:12px;">Fix what is flagged below: a structure that cannot exist has no resonance forms to find.</div>'; return; }
        var forms = R.contributors(C.clone(st));
        if(forms.length <= 1){
          msg.innerHTML = '<div class="tnote tnote--warn" style="margin-top:12px;"><span class="tnote__k">No delocalization</span>' +
            'This one has exactly one contributing form: there is nowhere for the π electrons or a lone pair to go. ' +
            'That is a real answer about the molecule, not a failure: most molecules have no resonance at all. ' +
            'Try a species with a charge next to a π bond, or a lone pair next to one.</div>';
          return;
        }
        msg.innerHTML = '<div class="tnote tnote--good" style="margin-top:12px;"><span class="tnote__k">' + forms.length + ' forms</span>' +
          'Loaded on the picture. Push a lone pair or a π bond there.</div>';
        built = { st: C.clone(st), name: st.name || rep.formula || 'Your own' };
        load(C.clone(st), built.name, true);
      }
    });
    Kit.builder(box);
    return builderApi;
  }
  ref.querySelector('#rsBuildBox').addEventListener('toggle', function(){ if(this.open) openBuilder(); });

  /* ====================================================================== */
  /* Test yourself                                                           */
  /* ====================================================================== */
  // 1. Find every form: the forms row shows only the ones found; each push that reaches a new one counts it
  var findBox = mk('div', 'rs2-dock');
  findBox.innerHTML = '<p class="rs2-count" id="rsFindCount"></p><div id="rsFindHint"></div><div class="trow rs2-row" id="rsFindRow"></div>';
  var hints = studio.hints({ hints: [
      'Look for a lone pair or a π bond next to another π bond, or next to an atom that is short of electrons.',
      'Move a pair one place over: a lone pair into the bond beside it, or a π bond toward its neighbor. If an atom would then pass an octet, move one of its π bonds on too. Atoms stay put; only electrons move.'
    ], answer: { label: 'Show me one I’m missing', onShow: function(){ reveal(); return ''; } } });
  findBox.querySelector('#rsFindHint').appendChild(hints.card);
  findBox.querySelector('#rsFindRow').appendChild(hints.row);
  var againBtn = mk('button', 'tchip', 'Start over'); againBtn.type = 'button';
  againBtn.addEventListener('click', function(){ if(S.built && built) load(built.st, built.name, true); else select(S.sp); });
  findBox.querySelector('#rsFindRow').appendChild(againBtn);
  function huntPanel(){
    var got = S.rk.filter(function(f){ return hunt.found[f.key]; }).length, left = S.rk.length - got;
    var el = byId('rsFindCount');
    if(el) el.innerHTML = '<b>' + got + ' of ' + S.rk.length + '</b> forms found' + (left ? '. ' + (left === 1 ? 'One left.' : left + ' left to find.') : '.');
    var mine = Object.keys(hunt.found).some(function(k){ return hunt.found[k] !== 'given'; });
    var was = hunt.done;
    hunt.done = left === 0;
    if(hunt.done && mine){
      var i = SPECIES.indexOf(S.sp);
      studio.done({ kicker: 'All found', title: 'All ' + S.rk.length + ' forms of ' + esc(S.name) + '.',
        text: 'The real ' + esc(S.name.toLowerCase()) + ' is one blend of them, closest to the ' + (S.rk[0].tag === 'equal' ? 'forms, which are equal here.' : 'major forms.') + ' It is drawn on the picture now.',
        next: { label: 'Next molecule', onClick: function(){ select(SPECIES[(i + 1) % SPECIES.length]); } },
        links: [{ label: 'Start over', onClick: function(){ againBtn.click(); } }].concat(Kit.extras ? Kit.extras({ topic: 'resonance' }) : [])
      }, 'quiz');
    } else studio.done(false, 'quiz');
    if(hunt.done !== was && L) paintAll();
  }
  // a run started from the side panel (above the picture on a phone): bring the picture into view first
  function showStage(){
    if(!L || !L.phone) return;
    var r = sceneBox.getBoundingClientRect();
    if(r.top < 0 || r.bottom > innerHeight) try{ sceneBox.scrollIntoView({ block: 'center', behavior: K.reduced() ? 'auto' : 'smooth' }); }catch(e){}
  }
  function reveal(){
    var missing = S.rk.filter(function(f){ return !hunt.found[f.key]; })[0];
    if(!missing) return;
    showStage();
    hunt.found[missing.key] = 'revealed';
    huntPanel(); paintStrip(); placeLabels();
    goTo(missing);
  }

  view.reveal = reveal;

  // 2. Which is more stabilized? Two species on the picture; call it, then each becomes its real molecule
  var cmpBox = mk('div', 'rs2-dock');
  function cmpOptions(v){ return SPECIES.map(function(sp){ return '<option value="' + esc(sp.id) + '"' + (sp.id === v ? ' selected' : '') + '>' + esc(sp.label) + '</option>'; }).join(''); }
  function setSide(which, id){
    var sp = SPECIES.filter(function(x){ return x.id === id; })[0];
    if(!sp) return;
    var e = { id: sp.id, label: sp.label, st: C.fromMolecule(Mol.get(sp.id)) };
    if(which === 'a') cmp.a = e; else cmp.b = e;
    cmp.guess = null;
  }
  function cmpPanel(){
    var va = cmp.a && cmp.b ? judge(stabilization(cmp.a.st), stabilization(cmp.b.st)) : null;
    var h = '<div class="rs2-picks"><select class="tselect" id="rsCmpA" aria-label="First species">' + cmpOptions(cmp.a && cmp.a.id) + '</select>' +
      '<span class="rs2-vs">vs</span><select class="tselect" id="rsCmpB" aria-label="Second species">' + cmpOptions(cmp.b && cmp.b.id) + '</select></div>';
    if(cmp.guess === null){
      h += '<p class="rs2-ask">Which is more stabilized by resonance? Call it first; the reasoning comes after.</p>' +
        '<div class="trow rs2-row"><button type="button" class="btn-press" data-guess="a">' + esc(cmp.a.label) + '</button>' +
        '<button type="button" class="btn-press" data-guess="b">' + esc(cmp.b.label) + '</button>' +
        '<button type="button" class="tchip" data-guess="tie">About the same</button></div>';
    } else {
      var right = cmp.guess === va.winner, name = va.winner === 'tie' ? 'neither' : (va.winner === 'a' ? cmp.a.label : cmp.b.label);
      var sa = stabilization(cmp.a.st), sb = stabilization(cmp.b.st);
      h += '<div class="tnote ' + (right ? 'tnote--good' : 'tnote--bad') + '"><span class="tnote__k">' + (right ? 'Right' : 'Not quite') + ': ' + esc(va.rule) + '</span>' +
        (va.winner === 'tie' ? '' : esc(name) + ' is the more stabilized. ') + esc(va.text) + '</div>' +
        '<div class="ttable-scroll"><table class="ttable"><thead><tr><th></th><th>' + esc(cmp.a.label) + '</th><th>' + esc(cmp.b.label) + '</th></tr></thead><tbody>' +
        '<tr><td>Forms</td><td class="num">' + sa.count + '</td><td class="num">' + sb.count + '</td></tr>' +
        '<tr><td>Equally good</td><td class="num">' + sa.equivalentMajors + '</td><td class="num">' + sb.equivalentMajors + '</td></tr>' +
        '<tr><td>Charge roams over</td><td class="num">' + sa.spread + '</td><td class="num">' + sb.spread + '</td></tr></tbody></table></div>' +
        '<div class="trow rs2-row"><button type="button" class="tchip" id="rsCmpAgain">Try another pair</button></div>';
    }
    cmpBox.innerHTML = h;
    cmpBox.querySelector('#rsCmpA').addEventListener('change', function(){ setSide('a', this.value); cmpPanel(); paintAll(); syncState(); });
    cmpBox.querySelector('#rsCmpB').addEventListener('change', function(){ setSide('b', this.value); cmpPanel(); paintAll(); syncState(); });
    [].forEach.call(cmpBox.querySelectorAll('[data-guess]'), function(b){ b.addEventListener('click', function(){
      cmp.guess = b.getAttribute('data-guess'); cmpPanel(); showStage(); crossPaint();
      var n = cmpBox.querySelector('.tnote'); if(n){ n.tabIndex = -1; n.focus({ preventScroll: true }); }
    }); });
    var ag = cmpBox.querySelector('#rsCmpAgain');
    if(ag) ag.addEventListener('click', function(){
      var ids = SPECIES.map(function(x){ return x.id; }), a = ids[Math.floor(Math.random() * ids.length)], b;
      do { b = ids[Math.floor(Math.random() * ids.length)]; } while(b === a);
      setSide('a', a); setSide('b', b); cmpPanel(); crossPaint(); syncState();
    });
    studio.task({ kicker: 'Test yourself', title: 'Which is more stabilized?', todo: cmp.guess === null ? 'Look at the two, then make your call.' : (cmp.guess === va.winner ? 'Right. Each is now drawn as its real molecule.' : 'Not quite. Each is now drawn as its real molecule.'), tone: cmp.guess === null ? null : (cmp.guess === va.winner ? 'good' : 'bad') }, 'quiz');
  }
  function crossPaint(){
    if(K.reduced() || !G.mainA.animate){ paintAll(); return; }
    var old = G.mainA.innerHTML; paintAll();
    G.mainB.innerHTML = old; G.mainB.style.opacity = '1';
    tween(520, function(f){ G.mainB.style.opacity = f1(1 - ease(f)); G.mainA.style.opacity = f1(ease(f)); }, function(){ G.mainB.innerHTML = ''; G.mainB.style.opacity = '0'; G.mainA.style.opacity = '1'; });
  }

  /* ====================================================================== */
  /* Modes                                                                   */
  /* ====================================================================== */
  var saved = null;
  function onShow(mode, part){
    stopTween(); hideCue(false); tourTurn.stop(); tapSrc = null;
    var wasFind = S.mode === 'quiz' && S.part === 'find';
    S.mode = mode; S.part = part;
    stage.setAttribute('data-part', mode === 'quiz' ? part : 'explore');
    head.el.hidden = mode !== 'explore';
    if(!S.start){ if(mode === 'quiz' && part === 'compare' && !cmp.a){ setSide('a', 'acetate-ion'); setSide('b', 'enolate'); } if(mode === 'quiz' && part === 'compare') cmpPanel(); return; }
    if(mode === 'quiz' && part === 'find'){
      if(!saved) saved = { cur: S.cur, hist: S.hist.slice(), visited: S.visited };
      var k0 = R.key(S.start);
      S.cur = (S.rk.filter(function(x){ return x.key === k0; })[0] || S.rk[0]).st; S.pending = []; S.pendingSt = null; S.hist = [];
      hunt.found = {}; hunt.found[k0] = 'given'; hunt.done = S.rk.length < 2; hints.reset();
      huntPanel();
    } else if(wasFind && saved){
      S.cur = saved.cur; S.hist = saved.hist; S.visited = saved.visited; saved = null; S.pending = []; S.pendingSt = null; studio.done(false, 'quiz');
    }
    if(mode === 'quiz' && part === 'compare'){
      if(!cmp.a){ setSide('a', 'acetate-ion'); setSide('b', 'enolate'); }
      cmpPanel();
    }
    paintAll(); words(null); syncState();
    if(mode === 'explore') placeCue();
  }

  // the link is read before anything writes it
  var q = window.OchemToolState ? window.OchemToolState.read() : {};
  S.sp = SPECIES.filter(function(x){ return x.id === q.sp; })[0] || SPECIES[0];
  var booting = true;
  root.hidden = true;
  mountQuiz();
  var kitApi = Kit.kit2({
    stage: stage, ref: ref, onShow: onShow,
    parts: [
      { value:'find', label:'Find every form', dock: findBox,
        task: { kicker:'Test yourself', title:'Find every resonance form', todo:'Push lone pairs and π bonds until the row is full. The real molecule appears when it is.' } },
      { value:'compare', label:'Which is more stabilized?', dock: cmpBox,
        task: function(){ return { kicker:'Test yourself', title:'Which is more stabilized?', todo:'Look at the two, then make your call.' }; } }],
    check: { label:'Check yourself: 6 questions',
      task: { kicker:'Test yourself', title:'Check yourself', todo:'Six quick questions. The picture stays live, so use it.' } }
  });
  byId('rsRefHow').addEventListener('click', function(){ studio.close(); if(S.mode === 'explore') startTour(); });

  /* ---- start: a species from the link, a structure handed over from another tool, or acetate */
  var sp0 = S.sp;
  var mol0 = Mol.get(sp0.id);
  booting = false;
  load(C.fromMolecule(mol0), mol0.name, false);
  if(q.mode === 'compare'){
    if(q.a) setSide('a', q.a);
    if(q.b) setSide('b', q.b);
    if(kitApi) kitApi.go('quiz', 'compare');
  }
  if(q.build && window.OchemToolHandoff){
    var box = byId('rsBuildBox');
    if(box){
      box.open = true;
      var api = openBuilder(), got = window.OchemToolHandoff.decode ? window.OchemToolHandoff.decode(q.build) : null;
      // the link carries the builder's own text form; a typed formula or name also works
      if(api){ if(got && api.load) api.load(got); else api.build(q.build); }
      studio.open('details');
    }
  }
  if(window.ResizeObserver) new ResizeObserver(function(){ if(!tw && !drag) { paintAll(); if(cue) cue.place(); } }).observe(sceneBox);
  else window.addEventListener('resize', function(){ paintAll(); });
  paintAll(); words(null);
  // names and marks are placed from measured text: place them again once the fonts are in
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if(!tw && !drag){ paintAll(); if(cue) placeCue(); } });
})();
