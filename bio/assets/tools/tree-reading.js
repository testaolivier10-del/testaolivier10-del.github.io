/* Simulator: reading and building phylogenetic trees (Unit 7). The tree
   logic is in bio-tool-math.js (ApBioMath.phylo); the trees, character
   tables, "How this model works" box, questions and mini FRQ are data
   (bio/data/tools/tree-reading.json). Two parts:
   - Read a tree: choose a prepared tree (cladograms from body characters, a
     DNA tree drawn to scale), rotate any node (the tool shows the clades do
     not change), select taxa with checkboxes to find their most recent
     common ancestor, their sister group, or whether they form a clade, and
     place each shared derived character on a branch (checked and recorded).
   - Build a tree: join taxa and groups into clades from a character table;
     the check accepts any rotation and names each supported, unsupported or
     missing clade (recorded).
   Every action is a button, checkbox or list (no dragging), and every tree
   has a written description next to the drawing.

   Job: read relationships from a tree's branching, not from the order of the
   tips.

   Tools upgrade (U-Bio-sims): the drawing is the control. Tap a node to
   rotate it (the tips glide to their new rows; reduced motion: jump); tap a
   tip to select it, and the most recent common ancestor of the selection
   and its clade bracket light up live. On character trees, drag a numbered
   character chip onto a branch, or tap a chip and then a branch, to place
   it. The rotate buttons, checkboxes and selects stay as the keyboard path,
   and answers are checked and recorded as before. */
(function(){
  'use strict';
  var SLUG = 'tree-reading';
  var T = window.ApBioTools, M = window.ApBioMath;
  if(!T) return;
  T.mount(SLUG, function(app, data){
    var esc = T.esc, F = T.F, P = M.phylo;
    var reads = data.trees.filter(function(t){ return t.read; }), builds = data.trees.filter(function(t){ return t.build; });
    var byId = function(id){ return data.trees.filter(function(t){ return t.id === id; })[0]; };
    var st = { tree: reads[0].id, root: null, sel: [], show: null, place: {}, checked: {}, recorded: {} };
    var bs = { set: builds[0].id, pieces: [], history: [], checked: {} };

    app.insertAdjacentHTML('beforeend', '<div class="bt-intro">' + data.intro + '</div>' + T.box('How this model works', data.howItWorks) +
      '<section class="bt-card tr-read" aria-labelledby="tr-h"><h2 id="tr-h">Read a tree</h2><div class="tr-pick"></div><p class="tr-about"></p>' +
      '<div class="bt-fig tr-figwrap" role="region" aria-label="Tree drawing: tap a node to rotate it, tap a tip to select it (scrolls sideways on a small screen)"></div><p class="bt-small tr-hint">Tap a numbered node to rotate it. Tap tips to select them: their most recent common ancestor lights up.</p>' +
      '<div class="tr-chips" hidden></div>' +
      '<div class="tr-desc"></div>' +
      '<fieldset class="bt-ctl tr-rotate"><legend>Rotate a node (swap the branches that come out of it)</legend><div class="bt-buttons"></div></fieldset>' +
      '<fieldset class="bt-ctl tr-tips"><legend>Select taxa, then ask a question about them</legend><div class="tr-checks"></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-a="mrca">Most recent common ancestor</button><button type="button" class="btn-press sm alt" data-a="clade">Is this group a clade?</button>' +
      '<button type="button" class="btn-press sm alt" data-a="sister">Find the sister group</button><button type="button" class="bt-btn" data-a="none">Clear the selection</button></div></fieldset>' +
      '<div class="tr-result bt-summary" role="status" aria-live="polite"></div>' +
      '<div class="tr-extra"></div></section>' +
      '<section class="bt-card tr-build" aria-labelledby="tb-h"><h2 id="tb-h">Build a tree from a character table</h2><div class="tb-pick"></div><div class="tb-table"></div>' +
      '<fieldset class="bt-ctl tb-pieces"><legend>Your pieces: check two or more that share a derived character, then join them</legend><div class="tr-checks"></div>' +
      '<div class="bt-buttons"><button type="button" class="btn-press sm" data-b="join">Join the checked pieces into a clade</button><button type="button" class="bt-btn" data-b="undo">Undo the last join</button>' +
      '<button type="button" class="bt-btn" data-b="reset">Start over</button><button type="button" class="btn-press sm alt" data-b="check">Check my tree</button></div></fieldset>' +
      '<div class="tb-status bt-summary" role="status" aria-live="polite"></div><div class="tb-out"></div></section>' +
      '<section class="bt-card" aria-labelledby="tr-q"><h2 id="tr-q">Questions about these trees</h2><div class="bt-qs bio-qs"></div></section>');
    var rc = app.querySelector('.tr-read'), bc = app.querySelector('.tr-build');
    var result = rc.querySelector('.tr-result');

    /* ------------------------------------------------------------ words */
    function nameOf(tree, id){ var x = tree.taxa.filter(function(t){ return t.id === id; })[0]; return x ? x.name : id; }
    function list(names){ return names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]; }
    function tipNames(tree, tips){ return tips.map(function(id){ return nameOf(tree, id); }); }
    function orderNames(tree, root){ return P.leaves(root).map(function(n){ return nameOf(tree, n.name); }); }
    function nodeLabel(tree, n){ return n.kids.length ? 'node ' + n.id + ' (' + orderNames(tree, n).join(', ') + ')' : nameOf(tree, n.name); }
    function nested(tree, n){ return n.kids.length ? '(' + n.kids.map(function(k){ return nested(tree, k); }).join(', ') + ')' : nameOf(tree, n.name); }
    function lenText(tree, n){ return tree.kind === 'dna' && n.len != null ? ' (branch ' + F(n.len, 2) + ')' : ''; }
    function describe(tree, root){
      var items = P.internal(root).slice().sort(function(a, b){ return a.id - b.id; }).map(function(n){
        return '<li>Node ' + n.id + (n === root ? ' (the root, the common ancestor of every taxon here)' : '') + ' splits into ' +
          list(n.kids.map(function(k){ return esc(nodeLabel(tree, k)) + esc(lenText(tree, k)); })) + '.</li>';
      }).join('');
      return '<h3>Text description of this tree</h3><ol class="tr-steps">' + items + '</ol><p class="bt-small">Tips from top to bottom: ' + esc(orderNames(tree, root).join(', ')) + '. In brackets, each pair of brackets is a clade: ' + esc(nested(tree, root)) + '.' +
        (tree.kind === 'dna' ? ' Branch lengths are in ' + esc(tree.unit) + '; the difference between two tips is the sum of the branches between them.' : ' This is a cladogram: only the branching order matters, not branch lengths.') + '</p>';
    }

    /* ---------------------------------------------------------- drawing */
    /* o: { marks: { 'tip,tip': [label] }, sel: [tips], miss: [tips], mrca: node, bracket: [tips] } */
    var lastPos = {};
    function drawTree(tree, root, o){
      o = o || {};
      var leaves = P.leaves(root), rowH = 36, top = 26, L = 14, labelW = 150, W = 600, plotW = W - L - 24 - labelW, dna = tree.kind === 'dna';
      var maxD = Math.max.apply(null, leaves.map(function(n){ return dna ? n.dist : n.depth; })) || 1;
      var H = top + leaves.length * rowH + (dna ? 40 : 4);
      var pos = new Map();
      leaves.forEach(function(n, i){ pos.set(n, { y: top + i * rowH }); });
      (function place(n){
        n.kids.forEach(place);
        var x = L + 24 + (dna ? n.dist : n.kids.length ? n.depth : maxD) / maxD * plotW;
        var y = n.kids.length ? (pos.get(n.kids[0]).y + pos.get(n.kids[n.kids.length - 1]).y) / 2 : pos.get(n).y;
        pos.set(n, { x: x, y: y });
      })(root);
      var p = [], r = pos.get(root);
      p.push('<path class="tr-edge" d="M' + L + ' ' + r.y + 'H' + r.x + '"/>');
      P.nodes(root).forEach(function(n){
        var a = pos.get(n);
        n.kids.forEach(function(k){
          var b = pos.get(k);
          p.push('<path class="tr-edge" d="M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + 'V' + b.y.toFixed(1) + 'H' + b.x.toFixed(1) + '"/>');
          if(o.drop) p.push('<rect class="tr-drop' + (o.hot === k.tips.join(',') ? ' hot' : '') + '" data-br="' + k.tips.join(',') + '" x="' + a.x.toFixed(1) + '" y="' + (b.y - 14).toFixed(1) + '" width="' + Math.max(18, b.x - a.x).toFixed(1) + '" height="28" rx="6"/>');
          if(dna && b.x - a.x >= 36) p.push('<text class="tr-len" x="' + ((a.x + b.x) / 2).toFixed(1) + '" y="' + (b.y - 6).toFixed(1) + '" text-anchor="middle">' + F(k.len, 2) + '</text>');
          var ms = (o.marks || {})[k.tips.join(',')] || [];
          ms.forEach(function(lab, i){
            var mx = (a.x + b.x) / 2 + (i - (ms.length - 1) / 2) * 22;
            p.push('<rect class="tr-mark" x="' + (mx - 2.5).toFixed(1) + '" y="' + (b.y - 9).toFixed(1) + '" width="5" height="18"/><text class="tr-mlab" x="' + mx.toFixed(1) + '" y="' + (b.y - 13).toFixed(1) + '" text-anchor="middle">' + esc(lab) + '</text>');
          });
        });
      });
      if(o.bracket && o.bracket.length){
        var ys = o.bracket.map(function(id){ return pos.get(P.find(root, [id])).y; }), y0 = Math.min.apply(null, ys) - 12, y1 = Math.max.apply(null, ys) + 12, bx = W - 8;
        p.push('<path class="tr-bracket" d="M' + (bx - 8) + ' ' + y0 + 'H' + bx + 'V' + y1 + 'H' + (bx - 8) + '"/>');
      }
      P.internal(root).forEach(function(n){
        var a = pos.get(n), isM = o.mrca === n;
        p.push('<g class="tr-node' + (isM ? ' mrca' : '') + '" data-rot="' + n.id + '" role="button" tabindex="0" aria-label="Node ' + n.id + (isM ? ', the most recent common ancestor of your selection' : '') + '. Rotate it."><circle class="tr-nhit" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="22"/><circle cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="' + (isM ? 13 : 10) + '"/><text x="' + a.x.toFixed(1) + '" y="' + (a.y + 4).toFixed(1) + '" text-anchor="middle">' + n.id + '</text>' +
          (isM ? '<text class="tr-mlab" x="' + a.x.toFixed(1) + '" y="' + (a.y - 17).toFixed(1) + '" text-anchor="middle">MRCA</text>' : '') + '</g>');
      });
      leaves.forEach(function(n){
        var a = pos.get(n), s = (o.sel || []).indexOf(n.name) >= 0, m = (o.miss || []).indexOf(n.name) >= 0;
        p.push('<g class="tr-tipg' + (s ? ' sel' : '') + '" data-tip="' + esc(n.name) + '" role="button" tabindex="0" aria-pressed="' + s + '" aria-label="' + esc(nameOf(tree, n.name)) + (s ? ', selected' : '') + '"><rect class="tr-thit" x="' + (a.x + 2).toFixed(1) + '" y="' + (a.y - 15).toFixed(1) + '" width="' + (W - a.x - 4).toFixed(1) + '" height="30" rx="8"/><text class="tr-tip' + (s ? ' sel' : '') + (m ? ' miss' : '') + '" x="' + (a.x + 8).toFixed(1) + '" y="' + (a.y + 5).toFixed(1) + '">' + (s ? '✓ ' : m ? '✗ ' : '') + esc(nameOf(tree, n.name)) + '</text></g>');
      });
      if(dna){
        var unitPx = plotW / maxD, sy = H - 14;
        p.push('<path class="tr-edge" d="M' + (L + 24) + ' ' + sy + 'H' + (L + 24 + unitPx).toFixed(1) + '"/><text class="tr-len" x="' + (L + 30 + unitPx).toFixed(1) + '" y="' + (sy + 4) + '">1 = 1% of DNA bases differ</text>');
      }
      var label = (dna ? 'Phylogenetic tree drawn to scale' : 'Cladogram') + ' of ' + leaves.length + ' taxa: ' + nested(tree, root) + '. Tips from top to bottom: ' + orderNames(tree, root).join(', ') + '. The text description follows the drawing.';
      lastPos = {}; leaves.forEach(function(n){ lastPos[n.name] = pos.get(n).y; });
      return '<svg class="tr-fig" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(label) + '">' + p.join('') + '</svg>';
    }

    /* ---------------------------------------------------- reading a tree */
    function tree(){ return byId(st.tree); }
    function load(){ st.root = P.parse(tree().newick); }
    var pick = T.choiceSelect({ label: 'Tree', value: st.tree, options: reads.map(function(t){ return { value: t.id, label: t.title }; }),
      onChange: function(v){ st.tree = v; st.sel = []; st.show = null; load(); readAll(); result.textContent = 'Showing ' + tree().title + '.'; } });
    rc.querySelector('.tr-pick').appendChild(pick.el);
    rc.querySelectorAll('[data-a]').forEach(function(b){ b.addEventListener('click', function(){ act(b.getAttribute('data-a')); }); });

    function marks(){
      var t = tree(), out = {};
      if(!t.characters) return out;
      var ans = st.checked[t.id];
      t.characters.forEach(function(c, i){
        var k = ans ? c.has.slice().sort().join(',') : (st.place[t.id] || {})[c.id];
        if(k){ (out[k] = out[k] || []).push(String(i + 1)); }
      });
      return out;
    }
    function figure(glide){
      var t = tree(), s = st.show, o = { marks: marks(), sel: st.sel, drop: !!t.characters && !st.checked[t.id], hot: dragHot };
      if(s){ var m = P.find(st.root, s.mrca); o.mrca = s.kind === 'mrca' ? m : null; o.bracket = s.bracket; o.miss = s.miss; }
      else if(st.sel.length >= 2){ var lm = P.mrca(st.root, st.sel); o.mrca = lm; o.bracket = lm.tips; }
      var before = glide ? Object.assign({}, lastPos) : null;
      rc.querySelector('.tr-figwrap').innerHTML = drawTree(t, st.root, o);
      if(before && !reducedM()) rc.querySelectorAll('.tr-figwrap .tr-tipg').forEach(function(g){
        var id = g.getAttribute('data-tip'), dy = (before[id] || 0) - (lastPos[id] || 0);
        if(Math.abs(dy) > 1 && g.animate) g.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
      });
      if(refocus){ var f = rc.querySelector('.tr-figwrap ' + refocus); refocus = null; if(f){ var sx = fw0().scrollLeft; try{ f.focus({ preventScroll: true }); }catch(er){ f.focus(); } fw0().scrollLeft = sx; } }
      rc.querySelector('.tr-desc').innerHTML = describe(t, st.root);
    }
    function readAll(){
      var t = tree();
      rc.querySelector('.tr-about').textContent = t.about;
      var rot = rc.querySelector('.tr-rotate .bt-buttons');
      rot.innerHTML = P.internal(st.root).map(function(n){ return '<button type="button" class="bt-btn" data-n="' + n.id + '">Rotate node ' + n.id + '</button>'; }).join('') +
        '<button type="button" class="bt-btn" data-n="0">Restore the first drawing</button>';
      rot.querySelectorAll('[data-n]').forEach(function(b){ b.addEventListener('click', function(){ rotate(+b.getAttribute('data-n')); }); });
      var box = rc.querySelector('.tr-tips .tr-checks');
      box.innerHTML = t.taxa.map(function(x){ var id = T.nid('tr-t'); return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" value="' + esc(x.id) + '"><label for="' + id + '">' + esc(x.name) + '</label></div>'; }).join('');
      box.querySelectorAll('input').forEach(function(c){ c.addEventListener('change', function(){
        st.sel = Array.prototype.filter.call(box.querySelectorAll('input'), function(x){ return x.checked; }).map(function(x){ return x.value; });
        st.show = null; figure();
      }); });
      extra();
      figure();
    }
    var refocus = null, dragHot = null;
    function fw0(){ return rc.querySelector('.tr-figwrap'); }
    function reducedM(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
    function toggleTip(id){
      var box = rc.querySelector('.tr-tips .tr-checks'), cb = Array.prototype.filter.call(box.querySelectorAll('input'), function(x){ return x.value === id; })[0];
      if(cb){ cb.checked = !cb.checked; }
      st.sel = Array.prototype.filter.call(box.querySelectorAll('input'), function(x){ return x.checked; }).map(function(x){ return x.value; });
      st.show = null; refocus = '[data-tip="' + id + '"]'; figure();
      var t = tree(), names = tipNames(t, st.sel);
      if(st.sel.length >= 2){ var m = P.mrca(st.root, st.sel), c = P.classify(st.root, st.sel);
        result.textContent = 'Selected ' + list(names) + '. Their most recent common ancestor is node ' + m.id + ' (highlighted); its clade is bracketed. ' + (c.kind === 'clade' ? 'Your selection is that whole clade.' : 'The clade also holds ' + list(tipNames(t, c.missing)) + ', so your selection alone is not a clade.'); }
      else result.textContent = st.sel.length ? 'Selected ' + names[0] + '. Tap another tip to see their most recent common ancestor.' : 'Selection cleared.';
    }
    var fw = rc.querySelector('.tr-figwrap');
    fw.addEventListener('click', function(e){
      var g = e.target.closest && e.target.closest('[data-rot],[data-tip],[data-br]'); if(!g) return;
      if(g.hasAttribute('data-rot')) rotate(+g.getAttribute('data-rot'));
      else if(g.hasAttribute('data-tip')) toggleTip(g.getAttribute('data-tip'));
      else if(g.hasAttribute('data-br') && armed) placeChar(armed, g.getAttribute('data-br'));
    });
    fw.addEventListener('keydown', function(e){
      if(e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest && e.target.closest('[data-rot],[data-tip]'); if(!g) return;
      e.preventDefault();
      if(g.hasAttribute('data-rot')) rotate(+g.getAttribute('data-rot')); else toggleTip(g.getAttribute('data-tip'));
    });
    /* Character chips: drag onto a branch, or tap a chip then a branch. */
    var armed = null, drag = null;
    function placeChar(cid, br){
      var t = tree(), place = st.place[t.id] = st.place[t.id] || {};
      place[cid] = br; armed = null; dragHot = null;
      var c = t.characters.filter(function(x){ return x.id === cid; })[0], n = P.find(st.root, br.split(','));
      result.textContent = 'Placed ' + c.name + ' on the branch leading to ' + nodeLabel(t, n) + '. Check your placements when you are done.';
      var sel = rc.querySelectorAll('.tr-place select')[t.characters.indexOf(c)]; if(sel) sel.value = br;
      chips(); figure();
    }
    function chips(){
      var t = tree(), host = rc.querySelector('.tr-chips');
      if(!host) return;
      if(!t.characters || st.checked[t.id]){ host.innerHTML = ''; host.hidden = true; return; }
      host.hidden = false;
      var place = st.place[t.id] || {};
      host.innerHTML = '<span class="bt-small">Place the characters: drag one onto its branch in the tree above, or tap it and then tap a branch.</span>' + t.characters.map(function(c, i){ return '<button type="button" class="tr-chip' + (armed === c.id ? ' armed' : '') + (place[c.id] ? ' placed' : '') + '" data-ch="' + esc(c.id) + '" aria-pressed="' + (armed === c.id) + '"><b>' + (i + 1) + '</b> ' + esc(c.name) + '</button>'; }).join('');
    }
    rc.addEventListener('pointerdown', function(e){ var b = e.target.closest && e.target.closest('.tr-chip'); if(!b) return; drag = { id: b.getAttribute('data-ch'), x: e.clientX, y: e.clientY, moved: false, b: b }; });
    window.addEventListener('pointermove', function(e){
      if(!drag) return;
      if(!drag.moved && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      if(!drag.moved){ drag.moved = true; drag.ghost = drag.b.cloneNode(true); drag.ghost.className += ' op-ghost'; document.body.appendChild(drag.ghost); }
      drag.ghost.style.left = (e.clientX - 30) + 'px'; drag.ghost.style.top = (e.clientY - 20) + 'px';
      drag.ghost.style.display = 'none'; var under = document.elementFromPoint(e.clientX, e.clientY); drag.ghost.style.display = '';
      var br = under && under.closest && under.closest('[data-br]'), hot = br ? br.getAttribute('data-br') : null;
      rc.querySelectorAll('.tr-drop').forEach(function(r){ r.classList.toggle('hot', r.getAttribute('data-br') === hot); });
      drag.hot = hot; e.preventDefault();
    }, { passive: false });
    window.addEventListener('pointerup', function(){
      if(!drag) return;
      var d = drag; drag = null;
      if(d.ghost) d.ghost.remove();
      if(!d.moved){ armed = armed === d.id ? null : d.id; chips(); var b = rc.querySelector('.tr-chip[data-ch="' + d.id + '"]'); if(b) b.focus(); result.textContent = armed ? 'Now tap the branch where this character first appeared.' : ''; return; }
      if(d.hot) placeChar(d.id, d.hot); else figure();
    });
    rc.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.tr-chip'); if(b && e.detail === 0){ armed = armed === b.getAttribute('data-ch') ? null : b.getAttribute('data-ch'); chips(); result.textContent = armed ? 'Character picked. Use the select below to place it with the keyboard, or tap a branch.' : ''; } });

    function rotate(id){
      var t = tree(), before = P.clades(st.root).join('|'), key = P.key(st.root);
      if(!id){ load(); figure(true); result.textContent = 'Back to the first drawing. Tips from top to bottom: ' + orderNames(t, st.root).join(', ') + '.'; return; }
      var n = P.internal(st.root).filter(function(x){ return x.id === id; })[0];
      P.rotate(n); refocus = '[data-rot="' + id + '"]'; figure(true);
      var same = P.clades(st.root).join('|') === before && P.key(st.root) === key;
      result.textContent = 'Node ' + id + ' rotated: its branches swapped places. Tips from top to bottom now: ' + orderNames(t, st.root).join(', ') + '. ' +
        (same ? 'The tree has the same ' + P.internal(st.root).length + ' clades as before, every node keeps the same descendants, so the relationships have not changed.' : 'The clades changed.');
    }
    function act(a){
      var t = tree(), sel = st.sel, names = tipNames(t, sel);
      if(a === 'none'){ rc.querySelectorAll('.tr-tips input').forEach(function(x){ x.checked = false; }); st.sel = []; st.show = null; figure(); result.textContent = 'Selection cleared.'; return; }
      if(!sel.length){ result.textContent = 'Check at least one taxon first.'; return; }
      if(a === 'mrca'){
        if(sel.length < 2){ result.textContent = 'Check at least two taxa to find their most recent common ancestor.'; return; }
        var m = P.mrca(st.root, sel);
        st.show = { kind: 'mrca', mrca: m.tips, bracket: m.tips };
        result.textContent = 'The most recent common ancestor of ' + list(names) + ' is node ' + m.id + ', marked MRCA. It is the node closest to the tips that has all of them among its descendants. Its descendants: ' + list(tipNames(t, m.tips)) + ' (bracketed on the right).';
      } else if(a === 'clade'){
        var c = P.classify(st.root, sel), mm = c.mrca;
        st.show = { kind: 'clade', mrca: mm.tips, bracket: mm.tips, miss: c.missing };
        if(c.kind === 'clade') result.textContent = sel.length === 1 ? names[0] + ' alone is a clade: one tip and its branch.' :
          'Yes, ' + list(names) + ' form a clade (monophyletic group): node ' + mm.id + ' and all of its descendants, with nothing left out.';
        else result.textContent = 'No, ' + list(names) + ' do not form a clade. Their most recent common ancestor is node ' + mm.id + ', and its descendants also include ' + list(tipNames(t, c.missing)) + ' (marked ✗). ' +
          (c.kind === 'paraphyletic' ? 'Those left out form one clade, so this group is paraphyletic: an ancestor with all but one branch of its descendants.' : 'Those left out do not form one clade, so this group gathers taxa from separate branches: polyphyletic.');
      } else if(a === 'sister'){
        var cl = P.classify(st.root, sel), n = cl.mrca;
        if(n === st.root){ st.show = { kind: 'sister', mrca: n.tips, bracket: n.tips }; result.textContent = 'The smallest clade with ' + list(names) + ' is the whole tree, so it has no sister group here.'; figure(); return; }
        var sis = P.sisters(n), tips = [].concat.apply([], sis.map(function(x){ return x.tips; }));
        st.show = { kind: 'sister', mrca: n.tips, bracket: tips };
        result.textContent = (cl.kind === 'clade' ? '' : 'Your selection is not a clade, so the tool uses the smallest clade that holds it, ' + nodeLabel(t, n) + '. ') +
          'The sister group of ' + (n.kids.length ? nodeLabel(t, n) : nameOf(t, n.name)) + ' is ' + list(sis.map(function(x){ return nodeLabel(t, x); })) + ' (bracketed on the right): both come from node ' + n.parent.id + ', so they are each other\'s closest relatives.';
      }
      figure();
    }

    /* ------------------------------------------------ characters or DNA */
    function branchOptions(t){
      return [{ value: '', label: 'Choose a branch…' }].concat(P.nodes(st.root).filter(function(n){ return n !== st.root; }).sort(function(a, b){ return (b.kids.length ? 1 : 0) - (a.kids.length ? 1 : 0) || (a.id || 0) - (b.id || 0); }).map(function(n){
        return { value: n.tips.join(','), label: 'Branch leading to ' + nodeLabel(t, n) };
      }));
    }
    function extra(){
      var t = tree(), box = rc.querySelector('.tr-extra');
      box.innerHTML = '';
      if(t.kind === 'dna'){
        var ids = t.taxa.map(function(x){ return x.id; });
        box.innerHTML = '<h3>DNA differences read from the tree</h3><p class="bt-small">Each value is the sum of the branch lengths between two tips, in ' + esc(t.unit) + '. The smallest difference marks the most recent common ancestor.</p>' +
          T.dataTable(['Taxon'].concat(t.taxa.map(function(x){ return esc(x.name); })), ids.map(function(a){ return [esc(nameOf(t, a))].concat(ids.map(function(b){ return a === b ? '—' : F(P.distance(st.root, a, b), 1); })); }), 'Percent of DNA bases that differ');
        return;
      }
      var place = st.place[t.id] = st.place[t.id] || {};
      box.innerHTML = '<h3>Place the shared derived characters</h3><p class="bt-small">Each character appeared once, on the branch leading to the clade whose members all have it (Table: which taxa have each one). Your choices appear on the tree as numbered marks.</p>' +
        T.dataTable(['Taxon'].concat(t.characters.map(function(c, i){ return (i + 1) + '. ' + esc(c.name); })), t.taxa.map(function(x){ return [esc(x.name)].concat(t.characters.map(function(c){ return c.has.indexOf(x.id) >= 0 ? 'Yes' : 'No'; })); }), 'Which taxa have each character (' + esc(nameOf(t, t.outgroup)) + ' is the outgroup)') +
        '<div class="bt-controls tr-place"></div><div class="bt-buttons"><button type="button" class="btn-press sm" data-c="check">Check my placements</button></div><div class="tr-charfb" role="status" aria-live="polite"></div>';
      var pl = box.querySelector('.tr-place');
      t.characters.forEach(function(c, i){
        var s = T.choiceSelect({ label: (i + 1) + '. ' + c.name, value: place[c.id] || '', options: branchOptions(t), onChange: function(v){ place[c.id] = v; chips(); figure(); } });
        if(st.checked[t.id]) s.select.disabled = true;
        pl.appendChild(s.el);
      });
      chips();
      var btn = box.querySelector('[data-c="check"]');
      if(st.checked[t.id]){ btn.disabled = true; feedback(t, box.querySelector('.tr-charfb')); }
      btn.addEventListener('click', function(){
        if(!t.characters.some(function(c){ return place[c.id]; })){ box.querySelector('.tr-charfb').textContent = 'Choose a branch for at least one character first.'; return; }
        st.checked[t.id] = true;
        if(!st.recorded[t.id]){
          st.recorded[t.id] = true;
          var items = t.characters.map(function(c){ return { id: SLUG + ':' + t.id + ':char-' + c.id, correct: place[c.id] === c.has.slice().sort().join(','), topic: data.topic, practice: '2.D', level: 'apply', diff: 2, group: 'characters' }; });
          T.record(SLUG, items);
          T.event('apbio-tool-question', { tool: SLUG, correct: items.every(function(x){ return x.correct; }) });
        }
        extra(); chips(); figure();
        box.querySelector('.tr-charfb h3').setAttribute('tabindex', '-1'); box.querySelector('.tr-charfb h3').focus();
      });
    }
    function feedback(t, el){
      var place = st.place[t.id] || {}, right = 0;
      var rows = t.characters.map(function(c, i){
        var want = c.has.slice().sort().join(','), ok = place[c.id] === want, n = P.find(st.root, c.has);
        if(ok) right++;
        return '<li class="' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? 'Right' : place[c.id] ? 'Not quite' : 'Not placed') + ':</b> ' + (i + 1) + '. ' + esc(c.name) + ' belongs on the branch leading to ' + esc(nodeLabel(t, n)) + ', because exactly those taxa have it.</li>';
      }).join('');
      el.innerHTML = '<h3>' + right + ' of ' + t.characters.length + ' placed on the right branch</h3><ul class="tr-fb">' + rows + '</ul><p class="bt-small">The tree now shows every character on its right branch. Only your first check of each tree is recorded.</p><div class="bt-buttons"><button type="button" class="bt-btn" data-c="again">Try again</button></div>' + T.report(SLUG + ':' + t.id + ':characters');
      el.querySelector('[data-c="again"]').addEventListener('click', function(){
        st.checked[t.id] = false; st.place[t.id] = {}; extra(); chips(); figure();
        var first = rc.querySelector('.tr-place select'); if(first) first.focus();
      });
    }

    /* ------------------------------------------------------ building */
    function bset(){ return byId(bs.set); }
    function bstart(){ bs.pieces = bset().taxa.map(function(x){ return { name: x.id, kids: [] }; }); bs.history = []; }
    function plabel(t, n){ return n.kids.length ? '(' + n.kids.map(function(k){ return plabel(t, k); }).join(', ') + ')' : nameOf(t, n.name); }
    function pnewick(n){ return n.kids.length ? '(' + n.kids.map(pnewick).join(',') + ')' : n.name; }
    var bpick = T.choiceSelect({ label: 'Character table', value: bs.set, options: builds.map(function(t){ return { value: t.id, label: t.title }; }),
      onChange: function(v){ bs.set = v; bstart(); buildAll(); bc.querySelector('.tb-status').textContent = 'New table: ' + bset().title + '. Every taxon starts as its own piece.'; } });
    bc.querySelector('.tb-pick').appendChild(bpick.el);
    bc.querySelectorAll('[data-b]').forEach(function(b){ b.addEventListener('click', function(){ bact(b.getAttribute('data-b')); }); });
    function buildAll(){
      var t = bset();
      bc.querySelector('.tb-table').innerHTML = '<p class="bt-small">' + esc(t.about) + ' Join the taxa that share the most widespread derived character last; start with the character the fewest taxa share. Any rotation of the right tree is accepted.</p>' +
        T.dataTable(['Taxon'].concat(t.characters.map(function(c){ return esc(c.name); })), t.taxa.map(function(x){ return [esc(x.name)].concat(t.characters.map(function(c){ return c.has.indexOf(x.id) >= 0 ? 'Yes' : 'No'; })); }), 'Characters (Yes = has the derived character; ' + esc(nameOf(t, t.outgroup)) + ' is the outgroup)');
      pieces();
      bc.querySelector('.tb-out').innerHTML = '';
    }
    function pieces(){
      var t = bset(), box = bc.querySelector('.tb-pieces .tr-checks');
      box.innerHTML = bs.pieces.map(function(n, i){ var id = T.nid('tb-p'); return '<div class="bt-check-row"><input type="checkbox" id="' + id + '" value="' + i + '"><label for="' + id + '">' + esc(plabel(t, n)) + '</label></div>'; }).join('');
      bc.querySelector('[data-b="undo"]').disabled = !bs.history.length;
    }
    function bact(a){
      var t = bset(), status = bc.querySelector('.tb-status');
      if(a === 'reset'){ bstart(); pieces(); bc.querySelector('.tb-out').innerHTML = ''; status.textContent = 'Started over: every taxon is its own piece.'; return; }
      if(a === 'undo'){ if(bs.history.length){ bs.pieces = bs.history.pop(); pieces(); bc.querySelector('.tb-out').innerHTML = ''; status.textContent = 'Last join undone. Pieces: ' + bs.pieces.map(function(n){ return plabel(t, n); }).join('; ') + '.'; } return; }
      if(a === 'join'){
        var idx = Array.prototype.filter.call(bc.querySelectorAll('.tb-pieces input'), function(x){ return x.checked; }).map(function(x){ return +x.value; });
        if(idx.length < 2){ status.textContent = 'Check at least two pieces to join them.'; return; }
        bs.history.push(bs.pieces.slice());
        var group = { kids: idx.map(function(i){ return bs.pieces[i]; }) }, next = [];
        bs.pieces.forEach(function(n, i){ if(i === idx[0]) next.push(group); else if(idx.indexOf(i) < 0) next.push(n); });
        bs.pieces = next; pieces();
        status.textContent = 'Joined ' + plabel(t, group) + ' into one clade. ' + (bs.pieces.length === 1 ? 'One piece is left: your tree is complete. Use Check my tree.' : bs.pieces.length + ' pieces left.');
        return;
      }
      if(a === 'check'){
        if(bs.pieces.length > 1){ status.textContent = 'Keep joining until one piece is left; it will be your whole tree. ' + bs.pieces.length + ' pieces now.'; return; }
        var mine = P.parse(pnewick(bs.pieces[0])), ids = t.taxa.map(function(x){ return x.id; });
        var want = P.parse(P.fromCharacters(ids, t.characters).tree), ok = P.same(mine, want);
        var wantC = P.clades(want), mineC = P.clades(mine);
        var charFor = function(key){ var c = t.characters.filter(function(x){ return x.has.slice().sort().join(',') === key; })[0]; return c ? c.name : null; };
        var rows = P.internal(mine).filter(function(n){ return n !== mine; }).map(function(n){
          var key = n.tips.join(','), good = wantC.indexOf(key) >= 0;
          return '<li class="' + (good ? 'ok' : 'no') + '"><b>' + (good ? 'Supported' : 'Not supported') + ':</b> the clade ' + esc(plabel(t, n)) + (good ? ', marked by ' + esc(charFor(key)) + '.' : ': no derived character is shared by exactly these taxa.') + '</li>';
        });
        wantC.forEach(function(key){ if(mineC.indexOf(key) < 0 && key.split(',').length < ids.length) rows.push('<li class="no"><b>Missing:</b> a clade of ' + esc(list(tipNames(t, key.split(',')))) + ', marked by ' + esc(charFor(key)) + '.</li>'); });
        if(!bs.checked[t.id]){
          bs.checked[t.id] = true;
          T.record(SLUG, [{ id: SLUG + ':build-' + t.id + ':tree', correct: ok, topic: data.topic, practice: '2.D', level: 'apply', diff: 2, group: 'build' }]);
          T.event('apbio-tool-question', { tool: SLUG, correct: ok });
        }
        status.textContent = ok ? 'Right: your tree has exactly the clades the table supports.' : 'Not quite: compare your clades with the table below the drawing.';
        bc.querySelector('.tb-out').innerHTML = '<h3>' + (ok ? 'Your tree matches the table' : 'Your tree differs from the one the table supports') + '</h3><ul class="tr-fb">' + rows.join('') + '</ul>' +
          '<div class="bt-fig tr-figwrap" tabindex="0" role="region" aria-label="Your tree (scrolls sideways on a small screen)">' + drawTree(t, mine, {}) + '</div>' + describe(t, mine).replace('Text description of this tree', 'Text description of your tree') +
          (ok ? '' : '<p class="bt-small">Only your first check of each table is recorded. Undo or start over and try again.</p>') + T.report(SLUG + ':build-' + t.id + ':tree');
      }
    }

    load();
    readAll();
    bstart();
    buildAll();
    T.questions(app.querySelector('.bt-qs'), data.questions, data.stimuli, SLUG);
    if(data.frq) T.frq(app, data.frq, SLUG);
  });
})();
