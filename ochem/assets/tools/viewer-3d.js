/* 3D Molecule Viewer, tools v2 (docs/tools-v2-viewer-3d-brief.md; standard docs/tools-v2-standard.md).

   Two tabs, one idea each, on the shared kit (assets/course/tool-kit2.js, turned on by OchemStudioKit.kit2 in
   ochem/assets/tool-shell.js):
     1. Shape: every electron group on an atom (a bond, a double or triple bond counted once, or a lone pair) pushes
        the others away. Tap an atom: its bonds turn blue, its lone pairs grow as amber lobes, the smallest angle at
        it is drawn and measured, and its card names the shape.
     2. Handedness: a carbon with four different groups, a mirror, and its reflection. Turn the H to the back and
        1 -> 2 -> 3 reads clockwise (R) or counterclockwise (S); the mirror image always reads the other way.

   The molecule is the control: drag anywhere to turn it (arrow keys once the picture has focus), tap an atom (the
   kit's K.spots pins: Tab, Enter, arrows) to read it. Every number is measured from the coordinates being drawn,
   and every word on the picture or in the cause line is derived from the frame that is on screen.

   The drawing is this file's own: one SVG element per drawn thing, made once per molecule and moved every frame
   (no per frame rebuild), depth sorted by re-appending only when the order changes. mol3d.js and its library give
   the coordinates and the VSEPR table; the Conformation Lab uses the same files. */
(function(){
  'use strict';
  var M3 = window.OchemMol3D;
  var LIB = window.OchemMol3DLibrary;
  var root = document.getElementById('v3Root');
  if(!M3 || !LIB) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* ====================================================================== */
  /* The model (no page): what an atom's electron groups are, and handedness */
  /* ====================================================================== */
  var NAMES = { H:'Hydrogen', C:'Carbon', N:'Nitrogen', O:'Oxygen', F:'Fluorine', Cl:'Chlorine', Br:'Bromine', I:'Iodine',
    S:'Sulfur', P:'Phosphorus', B:'Boron' };
  var Z = { H:1, B:5, C:6, N:7, O:8, F:9, P:15, S:16, Cl:17, Br:35, I:53 };
  function dot(a, b){ return a.x * b.x + a.y * b.y + a.z * b.z; }
  /* An angle as it is said: a whole number when it is within 0.15° of one (119.9 is "120°"), else one decimal
     (104.5°). The table in "?" keeps the decimal. */
  function fmtDeg(d){ var r = Math.round(d * 10) / 10; return (Math.abs(r - Math.round(r)) < 0.15 ? String(Math.round(r)) : r.toFixed(1)) + '°'; }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* Formamide's nitrogen is drawn with its lone pair shared into C=O (it is flat). The count is right for the
     shape; the words say where the pair went, so "0 lone pairs" is never read as "it has none". */
  function delocalized(mol, i){ return mol && mol.id === 'formamide' && i === 2; }

  /* Atoms drawn at the VSEPR model's ideal angle rather than a measured one (review round 1). Every other atom in
     the library carries a measured angle (ammonia 107°, water 104.5°, hydronium 113°, ethene 117.4°, formaldehyde
     116.5°, methanol's C–O–H 108.5°, dimethyl ether's C–O–C 111.7°, cyclopropane's H–C–H 114.5°, formamide's
     carbon: O=C–N 124.6°, N–C–H 112.5°) or one its symmetry
     fixes (methane, BF₃, PCl₅, SF₆, CO₂, ethyne, benzene, the methyl cation). A built molecule is all model. When the
     drawn angle is the ideal one, the picture and the line say "ideal". */
  var MODEL = { ethane: 1, 'chiral-carbon': 1, 'cyclohexane-chair-3d': 1, 'cyclohexane-boat-3d': 1, 'methyl-anion': 1,
    formamide: [2], methanol: [0], acetonitrile: [0], 'dimethyl-ether': [1, 2] };
  function isModel(mol, i){
    if(!mol) return false;
    if(mol._model) return true;
    var m = MODEL[mol.id];
    return m === 1 || (!!m && m.indexOf(i) >= 0);
  }
  function bonded(mol, a, b){ return mol.bonds.some(function(x){ return (x.a === a && x.b === b) || (x.a === b && x.b === a); }); }
  /* what the drawn angle is: ring (the two ends are bonded to each other, so the angle is a three membered ring's),
     ideal (a model atom at its shape's ideal value) or measured */
  function angleKind(mol, i, r){
    if(!r || !r.shape || r.angle === null || !r.pair) return 'measured';
    if(bonded(mol, r.pair.a, r.pair.b)) return 'ring';
    if(isModel(mol, i) && Math.abs(r.angle - r.shape.ideal) < 0.6) return 'ideal';
    return 'measured';
  }
  /* the angle's words, the same on the picture and at the end of the cause line */
  function angleLabel(r){
    if(!r || r.angle === null) return '';
    return (r.kind === 'ideal' ? 'ideal ' : '') + fmtDeg(r.angle);
  }

  /* Everything the picture and the words say about atom i, from the coordinates. pair: the two neighbors whose
     angle is drawn (the smallest at this atom). */
  function readAtom(mol, i, view){
    var a = M3.analyse(mol, i);
    if(!a) return null;
    var at = mol.atoms[i], nb = [];
    mol.bonds.forEach(function(b){
      if(b.a === i) nb.push(b.b); else if(b.b === i) nb.push(b.a);
    });
    /* the smallest angle; among pairs that share it (SF6 has twelve 90° pairs), the one that faces the viewer most,
       so its arc can be seen */
    var best = null, all = [];
    for(var p = 0; p < nb.length; p++) for(var q = p + 1; q < nb.length; q++){
      var u = M3.sub(mol.atoms[nb[p]].pos, at.pos), w = M3.sub(mol.atoms[nb[q]].pos, at.pos);
      all.push({ a: nb[p], b: nb[q], deg: M3.angleBetween(u, w), n: M3.cross(u, w) });
    }
    all.forEach(function(x){ if(!best || x.deg < best.deg - 0.05) best = x; });
    if(best && view){
      /* how well the arc can be seen: its plane facing the viewer, and its middle toward the viewer (in front of
         the atom, not behind it) */
      var face = function(x){
        var nn = M3.len(x.n), f = nn < 1e-6 ? 1 : Math.abs(rotate(M3.mul(x.n, 1 / nn), view.rx, view.ry).z);
        var u = M3.norm(M3.sub(mol.atoms[x.a].pos, at.pos)), w = M3.norm(M3.sub(mol.atoms[x.b].pos, at.pos)), m = M3.add(u, w);
        return 0.5 * f + (M3.len(m) > 1e-3 ? rotate(M3.norm(m), view.rx, view.ry).z : 0);
      };
      all.filter(function(x){ return x.deg < best.deg + 0.5; }).forEach(function(x){ if(face(x) > face(best) + 0.05) best = x; });
    }
    a.pair = best;
    a.angle = best ? best.deg : null;
    a.deloc = delocalized(mol, i);
    a.name = a.shape ? a.shape.m : (NAMES[a.el] || a.el);
    a.kind = angleKind(mol, i, a);
    return a;
  }
  /* The cause line for atom i: the count, the spread, the shape (rule 4: it is clear why). */
  function causeParts(r){
    if(!r) return [];
    if(!r.shape){
      var bits = [{ t: plural(r.bonds, 'bond'), role:'bond' }];
      if(r.lonePairs) bits.push({ t: plural(r.lonePairs, 'lone pair'), role:'lp', join:'+' });
      bits.push({ t: 'an end atom, no shape of its own', role:'ink' });
      return bits;
    }
    var out = [{ t: plural(r.bonds, 'bond'), role:'bond' }];
    if(r.deloc) out.push({ t: 'lone pair shared with C=O', role:'lp', join:'+' });
    else out.push({ t: r.lonePairs ? plural(r.lonePairs, 'lone pair') : 'no lone pairs', role:'lp', join:'+' });
    out.push({ t: r.steric + ' groups, ' + r.shape.hyb, role:'groups' });
    var sm = r.shape.m.toLowerCase();
    if(r.angle === null) out.push({ t: sm, role:'shape' });
    else if(r.kind === 'ring')
      out.push({ t: sm + ', the ring squeezes it to ' + angleLabel(r), role:'shape',
        say: sm + ', but the three membered ring squeezes the angle to ' + fmtDeg(r.angle) });
    else out.push({ t: sm + ' ' + angleLabel(r), role:'shape',
      say: sm + ', smallest angle ' + fmtDeg(r.angle) + (r.kind === 'ideal' ? ', drawn at the ideal value' : '') });
    return out;
  }

  /* Handedness. Priorities by atomic number (every atom on this stereocenter is different, so the first point of
     difference is the atom itself). The configuration from the 3D coordinates: with the lowest priority pointing
     away, 1 -> 2 -> 3 clockwise is R, which is (v1 x v2) . v3 < 0 for the three bond directions. */
  function priorities(mol, c){
    var nb = [];
    mol.bonds.forEach(function(b){ if(b.a === c) nb.push(b.b); else if(b.b === c) nb.push(b.a); });
    nb.sort(function(x, y){ return (Z[mol.atoms[y].el] || 0) - (Z[mol.atoms[x].el] || 0); });
    return nb;   // index 0 is priority 1
  }
  function config3D(mol, c){
    var pr = priorities(mol, c), o = mol.atoms[c].pos;
    var v = pr.slice(0, 3).map(function(i){ return M3.sub(mol.atoms[i].pos, o); });
    return dot(M3.cross(v[0], v[1]), v[2]) < 0 ? 'R' : 'S';
  }
  /* The reading off the drawn frame: P1..P3 are screen points (y down). Clockwise on screen is a positive cross
     product; with the H at the back that is R. */
  function readTurn(P1, P2, P3){
    var cr = (P2[0] - P1[0]) * (P3[1] - P1[1]) - (P2[1] - P1[1]) * (P3[0] - P1[0]);
    return cr > 0 ? 'cw' : 'ccw';
  }
  var BACK = Math.cos(35 * Math.PI / 180);   // the H counts as "at the back" within 35 degrees of straight back

  /* The view: turntable (y turn, then x tilt), the same convention mol3d.js renders with, so links keep their
     meaning. mirror: 'x' or 'y' reflects in view space (a mirror stands beside, or under, the molecule). */
  function rotate(p, rx, ry, mirror){
    var c1 = Math.cos(ry), s1 = Math.sin(ry);
    var x1 = p.x * c1 + p.z * s1, z1 = -p.x * s1 + p.z * c1;
    var c2 = Math.cos(rx), s2 = Math.sin(rx);
    var y2 = p.y * c2 - z1 * s2, z2 = p.y * s2 + z1 * c2;
    if(mirror === 'x') x1 = -x1;
    if(mirror === 'y') y2 = -y2;
    return { x: x1, y: y2, z: z2 };
  }
  /* The orientation that points direction d straight away from the viewer (rx stays inside the clamp). */
  function awayView(d){
    var u = M3.norm(d), rho = Math.sqrt(u.x * u.x + u.z * u.z);
    return { ry: Math.atan2(u.x, -u.z), rx: Math.atan2(-u.y, rho) };
  }
  /* The view a molecule opens in: the focus atom's lone pairs up and a little toward you (so a pyramid stands on
     its feet), else the old "Angled" view. */
  /* The view a molecule opens in: searched, not guessed. Every atom as far from every other on screen as it can be
     (no atom hidden behind another), the focus atom's lone pairs pointing up if it has any, and a little depth. */
  function homeView(mol){
    if(mol._home) return mol._home;
    var f = mol.focus == null ? 0 : mol.focus, a = mol.atoms[f], up = null;
    if(a && a.lpDirs && a.lpDirs.length){
      var v = { x:0, y:0, z:0 };
      a.lpDirs.forEach(function(d){ v = M3.add(v, M3.norm(d)); });
      if(M3.len(v) > 0.2) up = M3.norm(v);
    }
    var c = { x:0, y:0, z:0 };
    mol.atoms.forEach(function(at){ c = M3.add(c, at.pos); });
    c = M3.mul(c, 1 / mol.atoms.length);
    var best = { rx: -0.35, ry: 0.6, s: -Infinity };
    // a three membered ring at the focus atom: its 60° is the point, so the ring opens facing the viewer
    var ringN = null, r0 = readAtom(mol, f);
    if(r0 && r0.kind === 'ring' && r0.pair && M3.len(r0.pair.n) > 1e-6) ringN = M3.norm(r0.pair.n);
    // the focus atom's lone pair tips count as things to keep apart too
    var pts0 = mol.atoms.map(function(at){ return { p: at.pos, r: M3.styleOf(at.el).r }; });
    if(a && a.lpDirs) a.lpDirs.forEach(function(d){ pts0.push({ p: M3.add(a.pos, M3.mul(M3.norm(d), M3.styleOf(a.el).r + 0.7)), r: 0.35 }); });
    for(var i = 0; i <= 14; i++) for(var j = 0; j < 24; j++){
      var rx = -1.4 + 2.8 * i / 14, ry = j * Math.PI / 12, P = pts0.map(function(o){ return rotate(M3.sub(o.p, c), rx, ry); });
      var mind = Infinity;
      for(var p = 0; p < P.length; p++) for(var q = p + 1; q < P.length; q++){
        var dd = Math.hypot(P[p].x - P[q].x, P[p].y - P[q].y) - 0.6 * (pts0[p].r + pts0[q].r);
        if(dd < mind) mind = dd;
      }
      var sc = Math.min(mind, 0.9) + (up ? 0.5 * rotate(up, rx, ry).y : 0) + 0.04 * Math.abs(Math.sin(rx)) - 0.02 * Math.abs(rx) +
        (ringN ? 0.6 * Math.abs(rotate(ringN, rx, ry).z) : 0);
      if(sc > best.s + 1e-6) best = { rx: rx, ry: ry, s: sc };
    }
    mol._home = { rx: best.rx, ry: best.ry };
    return mol._home;
  }
  /* A lobe's length (angstrom): a central atom's lone pair is drawn full size; an end atom's (a halogen's three) is
     drawn shorter, so the molecule is not sized for them. */
  function lobeLen(mol, i){
    var a = mol.atoms[i], n = 0;
    mol.bonds.forEach(function(b){ if(b.a === i || b.b === i) n++; });
    return (M3.styleOf(a.el).r * 0.55 + 0.62) * (n > 1 || mol.focus === i || n === 0 ? 1 : 0.6);
  }
  function prep(mol){
    if(mol._R) return mol;
    /* the center the molecule turns about: the center of the smallest ball holding every atom (Badoiu and
       Clarkson's iteration), so the molecule is drawn as big as its region allows at every turn */
    var c = { x:0, y:0, z:0 };
    mol.atoms.forEach(function(a){ c = M3.add(c, a.pos); });
    c = M3.mul(c, 1 / mol.atoms.length);
    for(var it = 1; it < 400; it++){
      var far = null, fd = -1;
      mol.atoms.forEach(function(a){ var d = M3.len(M3.sub(a.pos, c)) + M3.styleOf(a.el).r; if(d > fd){ fd = d; far = a; } });
      var dir = M3.sub(far.pos, c), dl = M3.len(dir) || 1, tgt = M3.add(far.pos, M3.mul(dir, M3.styleOf(far.el).r / dl));
      c = M3.add(c, M3.mul(M3.sub(tgt, c), 1 / (it + 1)));
    }
    var R = 0, Ra = 0;
    mol.atoms.forEach(function(a, i){
      var r = M3.len(M3.sub(a.pos, c)) + M3.styleOf(a.el).r;
      a._lpLen = lobeLen(mol, i);
      if(a.lpDirs && a.lpDirs.length) a.lpDirs.forEach(function(d){ R = Math.max(R, M3.len(M3.add(M3.sub(a.pos, c), M3.mul(M3.norm(d), M3.styleOf(a.el).r * 0.45 + a._lpLen * 1.15)))); });
      R = Math.max(R, r); Ra = Math.max(Ra, r);
    });
    mol._c = c; mol._R = Math.max(R, 0.9); mol._Ra = Math.max(Ra, 0.9);
    return mol;
  }

  window.OchemViewer3DModel = { readAtom: readAtom, causeParts: causeParts, angleLabel: angleLabel, isModel: isModel, priorities: priorities, config3D: config3D,
    readTurn: readTurn, rotate: rotate, awayView: awayView, homeView: homeView, BACK: BACK, fmtDeg: fmtDeg };

  /* ====================================================================== */
  /* The page                                                                */
  /* ====================================================================== */
  var K = window.LevlKit2, studio = window.OchemStudio || null, Kit = window.OchemStudioKit;
  if(!root || !K || !studio || !Kit || !Kit.kit2){
    // Without the studio and the kit (an old cached shell) there is no stage to draw on; the quiz still works.
    mountQuiz();
    if(root && root.insertAdjacentHTML) root.insertAdjacentHTML('beforeend', '<p class="tnote tnote--info">This tool needs a newer copy of the page. Reload to get it.</p>');
    return;
  }
  function mk(tag, cls, html){ var d = document.createElement(tag); if(cls) d.className = cls; if(html != null) d.innerHTML = html; return d; }
  function byId(id){ return document.getElementById(id); }
  var NS = 'http://www.w3.org/2000/svg';
  function sv(tag, cls, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(parent) parent.appendChild(e); return e; }
  function f1(n){ return (Math.round(n * 10) / 10).toString(); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  var VIEW0 = { rx:-0.35, ry:0.6 };              // "Angled", the old default
  var HAND = LIB.get('chiral-carbon');
  var S = { tab:'shape', mode:'explore', part:null };
  var E = { mol: LIB.get('ammonia') || LIB.ALL[0], sel: 0, rx: VIEW0.rx, ry: VIEW0.ry, zoom: 1,
    style:'ball', letters:true, allLp:false, user:false };
  E.sel = E.mol.focus;
  var Hd = { rx: VIEW0.rx, ry: VIEW0.ry, zoom: 1 };
  if(HAND){ var hv0 = homeView(prep(HAND)); Hd.rx = hv0.rx; Hd.ry = hv0.ry; }
  var built = null;                                 // a molecule from Build your own: { mol, st, text }
  var drillSaved = null;

  /* ---------------------------------------------------- the stage */
  var stage = mk('div', 'v3');
  var tabs = K.tabs({ label:'What to explore', big:true, value:S.tab, onChange: function(v){ setTab(v, true); },
    items: [{ value:'shape', label:'Shape' }, { value:'hand', label:'Handedness', short:'R or S' }] });
  stage.appendChild(tabs.el);
  var head = K.head({ purpose:'', how: { label:'Show me how', onClick: function(){ startTour(); } } });
  stage.appendChild(head.el);
  var sceneBox = mk('div', 'v3-scene');
  function grad(el, c){
    var s = M3.styleOf(el), col = ({ H:'#F4F4F2', C:'#3A3F44', N:'#2F5BD3', O:'#E0352B', F:'#7BC043', Cl:'#22A84A', Br:'#9C2A1C',
      I:'#7A2FB0', S:'#F2C230', P:'#F07F1E', B:'#F2A7A0' })[el] || s.color;
    return '<radialGradient id="v3g-' + el + '" cx="0.34" cy="0.3" r="0.78"><stop offset="0" stop-color="' + shade(col, 0.55) + '"/>' +
      '<stop offset="0.5" stop-color="' + col + '"/><stop offset="1" stop-color="' + shade(col, -0.5) + '"/></radialGradient>';
  }
  function shade(hex, amt){
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function m(c){ return Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)); }
    return '#' + [m(r), m(g), m(b)].map(function(c){ return ('0' + clamp(c, 0, 255).toString(16)).slice(-2); }).join('');
  }
  var ELS = ['H', 'C', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'S', 'P', 'B', 'X'];
  sceneBox.innerHTML = '<svg class="v3-svg" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep" aria-hidden="true"><defs>' +
    ELS.map(function(e){ return grad(e); }).join('') +
    '<linearGradient id="v3g-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="v3s-bg0"/><stop offset="1" class="v3s-bg1"/></linearGradient>' +
    '<linearGradient id="v3g-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="v3s-bn0"/><stop offset="1" class="v3s-bn1"/></linearGradient>' +
    '<linearGradient id="v3g-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="v3s-gl0"/><stop offset="0.55" class="v3s-gl1"/><stop offset="1" class="v3s-gl2"/></linearGradient>' +
    '<radialGradient id="v3g-sh"><stop offset="0" class="v3s-sh0"/><stop offset="1" class="v3s-sh1"/></radialGradient>' +
    '<radialGradient id="v3g-lp" cx="0.4" cy="0.35" r="0.8"><stop offset="0" class="v3s-lp0"/><stop offset="1" class="v3s-lp1"/></radialGradient>' +
    '<marker id="v3m-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="v3-arrowhead"/></marker>' +
    '</defs><g class="v3-back"></g><g class="v3-molA"></g><g class="v3-molB"></g><g class="v3-over"></g></svg>' +
    '<div class="v3-labs" aria-hidden="true"></div>';
  stage.appendChild(sceneBox);
  var svg = sceneBox.querySelector('svg');
  var gBack = svg.querySelector('.v3-back'), gA = svg.querySelector('.v3-molA'), gB = svg.querySelector('.v3-molB'), gOver = svg.querySelector('.v3-over');
  var labsEl = sceneBox.querySelector('.v3-labs');
  // the angle number's leader, when it has to sit more than 40 px from its arc
  var aLead = sv('line', 'v3-alead', svg); aLead.style.display = 'none';
  var layer = K.layer(sceneBox);

  // the backdrop: a lit wall, a bench, the mirror (tab 2)
  var bgWall = sv('rect', 'v3-bg', gBack), bench = sv('rect', 'v3-bench', gBack), benchEdge = sv('line', 'v3-benchedge', gBack);
  var mirrorEl = sv('g', 'v3-mirror', gBack), mirrorGlass = sv('rect', 'v3-glass', mirrorEl), mirrorFrame = sv('rect', 'v3-frame', mirrorEl);
  var mirrorSheen = sv('path', 'v3-sheen', mirrorEl);
  var shadowA = sv('ellipse', 'v3-shadow', gBack), shadowB = sv('ellipse', 'v3-shadow', gBack);

  // the keyboard handle for turning: the picture itself (arrow keys), first in the tab order
  var turnEl = mk('div', 'v3-turn');
  turnEl.tabIndex = 0; turnEl.setAttribute('role', 'application'); turnEl.setAttribute('aria-roledescription', '3D model');
  layer.el.appendChild(turnEl);
  // quiet controls on the picture
  var pickEl = mk('label', 'v3-pick v3-ctl', '<span>Molecule</span><select aria-label="Molecule"></select>');
  var molSel = pickEl.querySelector('select');
  layer.el.appendChild(pickEl);
  var btnRow = mk('div', 'v3-btns v3-ctl');
  var backBtn = mk('button', 'v3-btn', '<span>H to the back</span>'); backBtn.type = 'button';
  var resetBtn = mk('button', 'v3-btn', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg><span>Reset view</span>');
  resetBtn.type = 'button'; resetBtn.setAttribute('aria-label', 'Reset view');
  btnRow.appendChild(backBtn); btnRow.appendChild(resetBtn);
  layer.el.appendChild(btnRow);

  var lines = mk('div', 'v3-lines');
  var cause = K.cause({ label:'Why' });
  lines.appendChild(cause.el);
  stage.appendChild(lines);
  var live = mk('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite');
  stage.appendChild(live);
  var lastSaid = '';
  function say(t){ if(t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

  /* ---------------------------------------------------- the molecule picker */
  function pickerHtml(){
    return LIB.groups().map(function(g){
      return '<optgroup label="' + esc(g.label) + '">' + g.items.map(function(m){
        return '<option value="' + esc(m.id) + '">' + esc(m.name) + '</option>';
      }).join('') + '</optgroup>';
    }).join('') + (built ? '<optgroup label="Yours"><option value="__built">' + esc(built.mol.name || 'Your molecule') + '</option></optgroup>' : '');
  }
  function syncPicker(){ molSel.innerHTML = pickerHtml(); molSel.value = E.mol === (built && built.mol) ? '__built' : E.mol.id; }
  molSel.addEventListener('change', function(){
    var m = molSel.value === '__built' ? (built && built.mol) : LIB.get(molSel.value);
    if(m) setMol(m, { how:'pick' });
    if(window.OchemShowWork) window.OchemShowWork(sceneBox);
  });

  /* ====================================================================== */
  /* Drawing: one painter per molecule on screen                            */
  /* ====================================================================== */
  function Painter(g){
    var mol = null, A = [], B = [], LP = [], arc = null, ring = null, order = [], pts = [], sticks = [], topT = null;
    function build(m){
      while(g.firstChild) g.removeChild(g.firstChild);
      mol = prep(m); A = []; B = []; LP = []; order = [];
      mol.bonds.forEach(function(b, j){
        var e = sv('g', 'v3-bond'), n = b.order || 1, ls = [];
        for(var k = 0; k < n; k++) ls.push({ o: sv('line', 'v3-bo', e), i: sv('line', 'v3-bi', e) });
        B.push({ el: e, ls: ls, b: b, z: 0 });
      });
      mol.atoms.forEach(function(a, i){
        var e = sv('g', 'v3-atom'), c = sv('circle', 'v3-ball', e), t = sv('text', 'v3-al', e);
        var el = Z[a.el] ? a.el : 'X';
        c.setAttribute('fill', 'url(#v3g-' + el + ')');
        t.textContent = a.label || a.el;
        if(a.el === 'H' || a.el === 'F' || a.el === 'S' || a.el === 'B') t.classList.add('is-dark');
        A.push({ el: e, c: c, t: t, z: 0 });
        (a.lpDirs || []).forEach(function(d){
          var lg = sv('g', 'v3-lp'), body = sv('ellipse', 'v3-lpb', lg), e1 = sv('circle', 'v3-lpe', lg), e2 = sv('circle', 'v3-lpe', lg);
          LP.push({ el: lg, body: body, e1: e1, e2: e2, at: i, d: M3.norm(d), z: 0 });
        });
      });
      arc = { el: sv('path', 'v3-arc'), z: 0 };
      arc.el.setAttribute('pathLength', '1');
      // the tapped atom's letter again, drawn over its own lone pair lobes (review round 1)
      topT = sv('text', 'v3-al v3-al-top'); topT.style.display = 'none';
      ring = { el: sv('circle', 'v3-ring'), z: 0 };
      return mol;
    }
    /* P: { rx, ry, cx, cy, scale, mirror, style, letters, allLp, sel, selT, prev, prevT, grow, pair, showArc, arcT } */
    function draw(P){
      if(!mol) return [];
      var c = mol._c, d = persp(mol._R), sc = P.scale * (P.grow == null ? 1 : P.grow);
      function proj(p){
        var q = rotate(M3.sub(p, c), P.rx, P.ry, P.mirror), k = d / (d - q.z);
        return { x: P.cx + q.x * sc * k, y: P.cy - q.y * sc * k, z: q.z, k: k };
      }
      pts = mol.atoms.map(function(a){ return proj(a.pos); });
      var space = P.style === 'space', wire = P.style === 'wire', items = [];
      function rad(i){
        var a = mol.atoms[i], p = pts[i];
        return space ? M3.vdwOf(a.el) * sc * p.k * 0.5 : wire ? Math.max(5, M3.styleOf(a.el).r * sc * p.k * 0.38) : M3.styleOf(a.el).r * sc * p.k * 0.98;
      }
      var R = pts.map(function(p, i){ var r0 = rad(i); return P.minH && mol.atoms[i].el === 'H' && !space && !wire ? Math.max(r0, P.minH) : r0; });
      sticks = [];
      mol.atoms.forEach(function(a, i){
        var p = pts[i], o = A[i], r = R[i];
        o.c.setAttribute('cx', f1(p.x)); o.c.setAttribute('cy', f1(p.y)); o.c.setAttribute('r', f1(r));
        var fs = r * (space ? 0.62 : 0.9), show = P.letters && fs >= 11 && !wire;
        if(show){
          fs = Math.min(fs, 26) * ((a.label || a.el).length > 1 ? 0.84 : 1);
          if(fs < 11) show = false;
        }
        o.t.style.display = show ? '' : 'none';
        if(show){ o.t.setAttribute('x', f1(p.x)); o.t.setAttribute('y', f1(p.y + fs * 0.36)); o.t.setAttribute('font-size', f1(fs)); }
        o.z = p.z; o.r = r; items.push(o);
      });
      B.forEach(function(o){
        var pa = pts[o.b.a], pb = pts[o.b.b];
        o.el.style.display = space ? 'none' : '';
        if(space) return;
        var w = (wire ? 0.05 : 0.105) * sc * (pa.k + pb.k) / 2, n = o.ls.length;
        var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L;
        var gap = n > 1 ? w * 0.95 : 0, wl = n > 1 ? w * 0.72 : w;
        var on = P.sel != null && (o.b.a === P.sel || o.b.b === P.sel), wasOn = P.prev != null && (o.b.a === P.prev || o.b.b === P.prev);
        o.el.classList.toggle('is-sel', on && P.selT > 0.02);
        // a bond in front of an atom stops at the edge of its letter, so no letter is crossed by a stick
        var zb = (pa.z + pb.z) / 2, ta = 0, tb = 0;
        if(P.letters && pa.z < zb && R[o.b.a] * 0.9 >= 11) ta = Math.min(0.45, R[o.b.a] * 0.62 / L);
        if(P.letters && pb.z < zb && R[o.b.b] * 0.9 >= 11) tb = Math.min(0.45, R[o.b.b] * 0.62 / L);
        var ax = pa.x + dx * ta, ay = pa.y + dy * ta, bx = pb.x - dx * tb, by = pb.y - dy * tb;
        sticks.push({ x1: ax, y1: ay, x2: bx, y2: by, w: n > 1 ? gap * 2 * (n - 1) + wl + 2.4 : wl + 2.4 });
        o.ls.forEach(function(l, k){
          var off = (k - (n - 1) / 2) * gap * 2;
          [l.o, l.i].forEach(function(e){
            e.setAttribute('x1', f1(ax + nx * off)); e.setAttribute('y1', f1(ay + ny * off));
            e.setAttribute('x2', f1(bx + nx * off)); e.setAttribute('y2', f1(by + ny * off));
          });
          l.o.setAttribute('stroke-width', f1(wl + 2.4)); l.i.setAttribute('stroke-width', f1(wl));
        });
        o.el.style.setProperty('--v3-on', String(on ? P.selT : wasOn ? P.prevT : 0));
        o.z = (pa.z + pb.z) / 2 - 0.001; items.push(o);
      });
      LP.forEach(function(o){
        var t = space ? 0 : o.at === P.sel ? P.selT : o.at === P.prev ? P.prevT : 0, dots = !space && P.allLp && t < 0.02;
        if(t < 0.02 && !dots){ o.el.style.display = 'none'; return; }
        o.el.style.display = '';
        var a = mol.atoms[o.at], ar = M3.styleOf(a.el).r, base = a.pos;
        if(dots){
          var pd = proj(M3.add(base, M3.mul(o.d, ar + 0.34))), pc = pts[o.at], vx = pd.x - pc.x, vy = pd.y - pc.y, l = Math.sqrt(vx * vx + vy * vy) || 1;
          var ox = -vy / l * 4 * pd.k, oy = vx / l * 4 * pd.k;
          o.el.setAttribute('class', 'v3-lp is-dots'); o.body.style.display = 'none';
          o.e1.setAttribute('cx', f1(pd.x + ox)); o.e1.setAttribute('cy', f1(pd.y + oy)); o.e1.setAttribute('r', f1(2.4 * pd.k));
          o.e2.setAttribute('cx', f1(pd.x - ox)); o.e2.setAttribute('cy', f1(pd.y - oy)); o.e2.setAttribute('r', f1(2.4 * pd.k));
          o.z = pd.z; items.push(o); return;
        }
        o.el.setAttribute('class', 'v3-lp'); o.body.style.display = '';
        // a lobe: a balloon from the atom outward, scaled by t as it grows
        var Lw = (a._lpLen || ar * 0.55 + 0.62) * t, mid = proj(M3.add(base, M3.mul(o.d, ar * 0.45 + Lw * 0.62))), tip = proj(M3.add(base, M3.mul(o.d, ar * 0.45 + Lw * 1.15)));
        var pc2 = pts[o.at], ax = tip.x - pc2.x, ay = tip.y - pc2.y, al = Math.sqrt(ax * ax + ay * ay);
        var wd = 0.3 * sc * mid.k * Math.max(0.35, t), half = Math.max(wd, al * 0.52);
        var ang = Math.atan2(ay, ax) * 180 / Math.PI;
        o.body.setAttribute('cx', f1(mid.x)); o.body.setAttribute('cy', f1(mid.y)); o.body.setAttribute('rx', f1(half)); o.body.setAttribute('ry', f1(wd));
        o.body.setAttribute('transform', 'rotate(' + f1(ang) + ' ' + f1(mid.x) + ' ' + f1(mid.y) + ')');
        var ux = al > 0.5 ? ax / al : 1, uy = al > 0.5 ? ay / al : 0, er = Math.max(1.6, 0.075 * sc * mid.k * t);
        o.e1.setAttribute('cx', f1(mid.x - uy * wd * 0.42)); o.e1.setAttribute('cy', f1(mid.y + ux * wd * 0.42)); o.e1.setAttribute('r', f1(er));
        o.e2.setAttribute('cx', f1(mid.x + uy * wd * 0.42)); o.e2.setAttribute('cy', f1(mid.y - ux * wd * 0.42)); o.e2.setAttribute('r', f1(er));
        o.el.style.opacity = String(Math.min(1, t * 1.6));
        o.z = mid.z; o.box = [mid.x - half, mid.y - half, mid.x + half, mid.y + half]; items.push(o);
      });
      // the ring round the tapped atom, and the arc of its smallest angle
      if(P.sel != null && P.selT > 0.02 && pts[P.sel]){
        var ps = pts[P.sel];
        ring.el.style.display = '';
        ring.el.setAttribute('cx', f1(ps.x)); ring.el.setAttribute('cy', f1(ps.y)); ring.el.setAttribute('r', f1(R[P.sel] + 4 + 8 * P.selT));
        ring.el.style.opacity = String(P.selT);
        ring.z = ps.z - 0.0005; items.push(ring);
      } else ring.el.style.display = 'none';
      arc.pts = null;
      if(P.pair && P.showArc && P.arcT > 0.01 && !space){
        var at = mol.atoms[P.sel], u = M3.norm(M3.sub(mol.atoms[P.pair.a].pos, at.pos)), v = M3.norm(M3.sub(mol.atoms[P.pair.b].pos, at.pos));
        var th = Math.acos(clamp(dot(u, v), -1, 1)), rho = M3.styleOf(at.el).r * 0.98 + 0.22, w2;
        if(th > Math.PI - 0.02){
          // a straight angle: any half circle round the axis; take the one that faces the viewer
          var tryv = [M3.v(1, 0, 0), M3.v(0, 1, 0), M3.v(0, 0, 1)], bestW = null, bestF = -1;
          tryv.forEach(function(t0){ var w0 = M3.norm(M3.sub(t0, M3.mul(u, dot(t0, u)))); if(!isFinite(w0.x)) return; var rw = rotate(w0, P.rx, P.ry, P.mirror), f = Math.abs(rw.x) + Math.abs(rw.y); if(f > bestF){ bestF = f; bestW = w0; } });
          w2 = bestW || M3.norm(M3.cross(u, Math.abs(u.z) < 0.9 ? M3.v(0, 0, 1) : M3.v(1, 0, 0)));
        } else w2 = M3.norm(M3.sub(v, M3.mul(u, dot(u, v))));
        var path = '', n2 = 24, AP = [];
        for(var s = 0; s <= n2; s++){
          var tt = th * s / n2, dir = M3.add(M3.mul(u, Math.cos(tt)), M3.mul(w2, Math.sin(tt)));
          var q = proj(M3.add(at.pos, M3.mul(dir, rho)));
          AP.push(q); path += (s ? 'L' : 'M') + f1(q.x) + ',' + f1(q.y);
        }
        arc.el.setAttribute('d', path);
        arc.el.style.display = '';
        arc.el.style.strokeDashoffset = String(1 - P.arcT);
        arc.pts = AP; arc.mid = AP[n2 >> 1];
        arc.z = AP.reduce(function(sm, q){ return sm + q.z; }, 0) / AP.length; items.push(arc);
      } else arc.el.style.display = 'none';
      // depth sort: back first; re-append only when the order changes
      items.sort(function(x, y){ return x.z - y.z; });
      var same = items.length === order.length;
      for(var j = 0; same && j < items.length; j++) if(items[j] !== order[j]) same = false;
      if(!same){ items.forEach(function(it){ g.appendChild(it.el); }); order = items; }
      var si = P.sel, so = si != null ? A[si] : null, showTop = false;
      if(so && so.t.style.display !== 'none' && P.selT > 0.02){
        var ps2 = pts[si];
        showTop = LP.some(function(o){ return o.at === si && o.el.style.display !== 'none' && o.z > ps2.z; }) &&
          !pts.some(function(p, k){ return k !== si && p.z > ps2.z && Math.hypot(p.x - ps2.x, p.y - ps2.y) < R[k] + R[si] * 0.4; });
      }
      topT.style.display = showTop ? '' : 'none';
      if(showTop){
        ['x', 'y', 'font-size'].forEach(function(k){ topT.setAttribute(k, so.t.getAttribute(k)); });
        topT.textContent = so.t.textContent; topT.setAttribute('class', so.t.getAttribute('class') + ' v3-al-top');
        if(g.lastChild !== topT) g.appendChild(topT);
      }
      return pts.map(function(p, i){ return { x: p.x, y: p.y, z: p.z, r: R[i] }; });
    }
    function lobes(){ return LP.filter(function(o){ return o.el.style.display !== 'none' && o.box && !o.el.classList.contains('is-dots'); }).map(function(o){ return o.box; }); }
    return { build: build, draw: draw, mol: function(){ return mol; }, arc: function(){ return arc; }, pts: function(){ return pts; }, lobes: lobes,
      sticks: function(){ return sticks; } };
  }
  var PA = Painter(gA), PB = Painter(gB);

  /* ====================================================================== */
  /* Layout                                                                  */
  /* ====================================================================== */
  var L = null;
  function layoutNow(){
    var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
    if(!W || !H) return null;
    var phone = W < 641, pad = phone ? 10 : 18, top = phone ? 58 : 66, benchH = phone ? 34 : 44;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    L = { W: W, H: H, phone: phone, pad: pad, top: top, benchY: H - benchH };
    bgWall.setAttribute('width', W); bgWall.setAttribute('height', H);
    bench.setAttribute('y', L.benchY); bench.setAttribute('width', W); bench.setAttribute('height', benchH);
    benchEdge.setAttribute('x1', 0); benchEdge.setAttribute('x2', W); benchEdge.setAttribute('y1', L.benchY + 0.5); benchEdge.setAttribute('y2', L.benchY + 0.5);
    if(S.tab === 'hand'){
      // side by side, or stacked (the mirror under the molecule): whichever gives each molecule the larger square
      var hh = L.benchY - top - (phone ? 0 : 24);
      L.side = Math.min((W - pad * 2) / 2, hh) >= Math.min(W - pad * 2, hh / 2);
      if(L.side){
        var half = (W - pad * 2) / 2, gapX = phone ? 10 : 22;
        L.regA = [pad, top, pad + half - gapX, L.benchY - 30];
        L.mir = [pad + half + gapX * 0.4, top - 8, W - pad, L.benchY + 4];
        L.regB = [L.mir[0] + gapX, top + 10, L.mir[2] - gapX * 0.6, L.benchY - 30];
      } else {
        // stacked: little margin between the two (review round 1: each molecule was a third of its region)
        var mid = top + (L.benchY - top) * 0.5;
        L.regA = [pad, top - 4, W - pad, mid - 10];
        L.mir = [pad, mid - 4, W - pad, L.benchY + 4];
        L.regB = [pad + 4, mid + 10, W - pad - 4, L.benchY - 6];
      }
    } else {
      // on a wide stage the molecule may use the band beside the picker and the buttons, so it fills the height
      var ctlW = Math.max(pickEl.offsetWidth || 0, btnRow.offsetWidth || 0) + 24, top1 = top, hgt = L.benchY - 6 - pad;
      if(!phone && W - 2 * ctlW - 2 * pad >= hgt) top1 = pad;
      L.regA = [pad, top1, W - pad, L.benchY - 6];
    }
    return L;
  }
  /* the eye's distance (angstrom): far enough that the perspective is mild, so the ball that holds the molecule at
     every turn is not inflated much by the nearest atom */
  function persp(R){ return Math.max(10, 6 * R); }
  function fitIn(reg, mol, zoom, atomsOnly){
    var w = reg[2] - reg[0], h = reg[3] - reg[1], R = atomsOnly ? mol._Ra : mol._R, d = persp(mol._R), kmax = d / (d - R);
    var rad = Math.max(40, Math.min(w, h) / 2 - 3);
    // the ball that holds the molecule at every turn fills the region's height; a cap only keeps the smallest
    // molecules on the widest screens from turning into a wall of one ball (review round 1: 210 was too low)
    var sc = Math.min(rad / (R * kmax), L.phone ? 190 : 320);
    return { cx: (reg[0] + reg[2]) / 2, cy: (reg[1] + reg[3]) / 2, scale: sc * (zoom || 1) };
  }

  /* ====================================================================== */
  /* Motion: tweens, one frame loop, and the frame                          */
  /* ====================================================================== */
  var tweens = [], raf = 0;
  function ease(t){ return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function tween(ms, step, done){
    var tw = { t0: 0, ms: K.reduced() ? 0 : ms, step: step, done: done, dead: false };
    tweens.push(tw);
    if(!tw.ms){ step(1); finish(tw); paint(); return tw; }
    kick();
    return tw;
  }
  function finish(tw){ tw.dead = true; tweens = tweens.filter(function(x){ return x !== tw; }); if(tw.done) tw.done(); }
  function stopTweens(jump){ tweens.slice().forEach(function(tw){ if(jump){ tw.step(1); } tw.dead = true; if(jump && tw.done) tw.done(); }); tweens = []; }
  function kick(){ if(!raf) raf = requestAnimationFrame(loop); }
  function loop(now){
    raf = 0;
    tweens.slice().forEach(function(tw){
      if(tw.dead) return;
      if(!tw.t0) tw.t0 = now;
      var u = Math.min(1, (now - tw.t0) / tw.ms);
      tw.step(ease(u));
      if(u >= 1) finish(tw);
    });
    paint();
    if(tweens.length) kick();
  }
  function crossFade(){ if(!K.reduced()) return; sceneBox.classList.remove('is-xf'); void sceneBox.offsetWidth; sceneBox.classList.add('is-xf'); }

  /* What is drawn at this moment (the words read from here, never from where a change is heading). */
  var D = { selT: 1, prev: null, prevT: 0, grow: 1, ready: true, arcT: 1 };

  /* ---------------------------------------------------- labels on the picture */
  var labPool = {};
  function lab(key, cls){
    var e = labPool[key];
    if(!e){ e = mk('div', 'v3-lab ' + cls); labsEl.appendChild(e); labPool[key] = e; }
    e.hidden = false; return e;
  }
  function hideLabs(except){ Object.keys(labPool).forEach(function(k){ if(!except || except.indexOf(k) < 0) labPool[k].hidden = true; }); }
  function boxOf(e){ var r = e.getBoundingClientRect(), s = sceneBox.getBoundingClientRect(); return [r.left - s.left, r.top - s.top, r.right - s.left, r.bottom - s.top]; }
  function hits(a, b, g){ g = g || 0; return a[0] < b[2] + g && b[0] < a[2] + g && a[1] < b[3] + g && b[1] < a[3] + g; }
  /* the controls' boxes, measured once per layout (reading them every frame forced a layout per frame) */
  var ctlCache = null;
  function ctlBoxes(){
    if(!ctlCache || ctlCache.L !== L || ctlCache.pick !== pickEl.hidden || ctlCache.mode !== S.mode)
      ctlCache = { L: L, pick: pickEl.hidden, mode: S.mode, b: [pickEl, btnRow].filter(function(e){ return !e.hidden && e.offsetParent; }).map(boxOf) };
    return ctlCache.b;
  }
  function labW(e){ if(e._t !== e.textContent || e._W !== L.W){ e._t = e.textContent; e._W = L.W; e._w = e.offsetWidth; e._h = e.offsetHeight; } return e._w; }
  /* place a label at the first candidate point that keeps it inside the picture and clear of the boxes given;
     returns false (and hides it) when no candidate is clear */
  function placeLab(e, cands, avoid, inside, circ){
    if(e._t !== e.textContent || e._W !== L.W){ e._t = e.textContent; e._W = L.W; e._w = e.offsetWidth; e._h = e.offsetHeight; }
    var w = e._w, h = e._h, R0 = inside || [4, 4, L.W - 4, L.benchY + 30];
    if(circ && circ.length > 24){
      // only the circles the candidates can reach (a frame places a dozen labels against a few hundred circles)
      var bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      cands.forEach(function(c){ bx0 = Math.min(bx0, c[0]); by0 = Math.min(by0, c[1]); bx1 = Math.max(bx1, c[0]); by1 = Math.max(by1, c[1]); });
      var reach = [bx0 - w / 2, by0 - h / 2, bx1 + w / 2, by1 + h / 2];
      circ = circ.filter(function(c){ return hitsC(reach, c, 4); });
    }
    for(var i = 0; i < cands.length; i++){
      var x = cands[i][0] - w / 2, y = cands[i][1] - h / 2, b = [x, y, x + w, y + h];
      if(b[0] < R0[0] || b[1] < R0[1] || b[2] > R0[2] || b[3] > R0[3]) continue;
      if(avoid.some(function(a){ return hits(b, a, 4); })) continue;
      if(circ && circ.some(function(c){ return hitsC(b, c, 4); })) continue;
      e.style.left = f1(x) + 'px'; e.style.top = f1(y) + 'px';
      return b;
    }
    e.hidden = true;
    return null;
  }
  /* a box against a circle { x, y, r }, with a gap */
  function hitsC(b, c, g){
    var dx = Math.max(b[0] - c.x, 0, c.x - b[2]), dy = Math.max(b[1] - c.y, 0, c.y - b[3]), rr = c.r + (g || 0);
    return dx * dx + dy * dy < rr * rr;
  }
  /* what a label must keep off, as circles: every ball, every stick (sampled along its length) and any drawn line
     (the angle's arc, the reading arrow) */
  function ballCircles(pts){ return pts.map(function(p){ return { x: p.x, y: p.y, r: p.r }; }); }
  function stickCircles(sticks){
    var out = [];
    sticks.forEach(function(k){
      var L0 = Math.hypot(k.x2 - k.x1, k.y2 - k.y1), n = Math.max(1, Math.ceil(L0 / Math.max(4, k.w / 2 + 3)));
      for(var j = 0; j <= n; j++) out.push({ x: k.x1 + (k.x2 - k.x1) * j / n, y: k.y1 + (k.y2 - k.y1) * j / n, r: k.w / 2 });
    });
    return out;
  }
  function lineCircles(P, r){
    // a drawn line as circles no more than 4 px apart (a big arc's 25 points can be 25 px apart)
    var out = [];
    (P || []).forEach(function(q, k){
      var x = q.x == null ? q[0] : q.x, y = q.y == null ? q[1] : q.y;
      if(k){
        var p = P[k - 1], px = p.x == null ? p[0] : p.x, py = p.y == null ? p[1] : p.y, n = Math.ceil(Math.hypot(x - px, y - py) / 4);
        for(var j = 1; j < n; j++) out.push({ x: px + (x - px) * j / n, y: py + (y - py) * j / n, r: r });
      }
      out.push({ x: x, y: y, r: r });
    });
    return out;
  }
  function ballBoxes(pts, skip){ return pts.filter(function(p, i){ return !skip || skip.indexOf(i) < 0; }).map(function(p){ return [p.x - p.r * 0.8, p.y - p.r * 0.8, p.x + p.r * 0.8, p.y + p.r * 0.8]; }); }

  /* ====================================================================== */
  /* Tab 1: Shape                                                            */
  /* ====================================================================== */
  var spots = null, spotsMol = null, spotsGuard = false;
  function makeSpots(mol, items){
    if(spots && spots.el.parentNode) spots.el.parentNode.removeChild(spots.el);
    spotsMol = mol;
    spots = K.spots(layer, { key:'ochem-v3-atoms', label:'Atoms', chip:false, items: items,
      avoid: function(){
        var sr = sceneBox.getBoundingClientRect(), pts = S.tab === 'shape' ? lastPts.shape : lastPts.hand;
        return [pickEl, btnRow].concat([].slice.call(labsEl.querySelectorAll('.v3-lab'))).filter(function(e){ return !e.hidden && e.offsetParent; })
          .map(function(e){ return e.getBoundingClientRect(); })
          .concat(pts.map(function(p){ var r = p.r + 3; return { left: sr.left + p.x - r, top: sr.top + p.y - r, width: 2 * r, height: 2 * r }; }))
          .concat(S.tab === 'shape' ? PA.lobes().map(function(b){ return { left: sr.left + b[0], top: sr.top + b[1], width: b[2] - b[0], height: b[3] - b[1] }; }) : [])
          .concat(stickCircles(PA.sticks()).filter(function(c, k){ return k % 2 === 0; }).concat(S.tab === 'shape' && PA.arc().pts && PA.arc().el.style.display !== 'none' ? lineCircles(PA.arc().pts, 3) : [])
            .map(function(c){ return { left: sr.left + c.x - c.r, top: sr.top + c.y - c.r, width: 2 * c.r, height: 2 * c.r }; }));
      },
      onPick: function(it, how){
        if(spotsGuard || !it) return;
        if(how === 'key' || how === 'find'){
          var i = +it.id.slice(1);
          if(S.tab === 'shape') selectAtom(i, 'key');
          else { hideCue(true); }
        }
      } });
    spots.el.classList.add('v3-spots');
    // the pins are invisible over the balls: the atom itself is what is seen and tapped
    return spots;
  }
  function spotItems1(mol){
    return mol.atoms.map(function(a, i){
      var r = readAtom(mol, i);
      return { id: 'a' + i, name: r ? r.name : a.el, at: [[0, 0]] };
    });
  }
  function quietPick(id){ spotsGuard = true; try{ spots.pick(id, 'set'); } finally { spotsGuard = false; } }

  function setMol(m, o){
    o = o || {};
    if(!m) return;
    if(o.how) hideCue(true);
    var first = !PA.mol();
    stopTweens(true);
    var swap = function(){
      E.mol = prep(m); E.sel = m.focus == null ? 0 : m.focus; if(!E.mol.atoms[E.sel]) E.sel = 0;
      if(!o.keepView){ var hv = homeView(E.mol); E.rx = hv.rx; E.ry = hv.ry; E.zoom = 1; }
      choosePair(true);
      if(S.tab !== 'shape'){ syncPicker(); return; }
      PA.build(E.mol);
      makeSpots(E.mol, spotItems1(E.mol));
      syncPicker();
      turnLabel();
      refNow();
    };
    if(first || o.instant || S.tab !== 'shape'){ swap(); D.grow = 1; D.selT = 1; D.prev = null; D.ready = true; D.arcT = 1; settle(); paint(); return; }
    // the old molecule shrinks away, the new one grows in; the words wait for it (reduced motion: a cross fade)
    crossFade();
    D.ready = false; quietPick(null); cause.el.classList.add('is-wait');
    tween(200, function(u){ D.grow = 1 - 0.4 * u; D.fade = 1 - u; }, function(){
      swap(); D.selT = 0; D.prev = null; D.arcT = 0;
      tween(320, function(u){ D.grow = 0.6 + 0.4 * u; D.fade = u; D.selT = u; D.arcT = u; }, function(){ D.fade = 1; settle(); });
    });
    if(o.how === 'pick') sync({ mol: m.id, build: null, st: null });
  }

  /* which angle the arc shows: chosen when the atom, the molecule or the view settles (never during a drag) */
  function choosePair(force){
    var r = readAtom(E.mol, E.sel, { rx: E.rx, ry: E.ry });
    if(!r || !r.pair){ E.pair = null; return false; }
    var cur = E.pair && E.pairFor === E.mol && E.pairAt === E.sel ? E.pair : null;
    if(cur && !force){
      var at = E.mol.atoms[E.sel], m = M3.add(M3.norm(M3.sub(E.mol.atoms[cur.a].pos, at.pos)), M3.norm(M3.sub(E.mol.atoms[cur.b].pos, at.pos)));
      var nn = M3.len(cur.n || { x:0, y:0, z:0 }), f = nn < 1e-6 ? 1 : Math.abs(rotate(M3.mul(cur.n, 1 / nn), E.rx, E.ry).z);
      var seen = 0.5 * f + (M3.len(m) > 1e-3 ? rotate(M3.norm(m), E.rx, E.ry).z : 0);
      if(seen > 0.1) return false;
    }
    var changed = !cur || cur.a !== r.pair.a || cur.b !== r.pair.b;
    E.pair = r.pair; E.pairFor = E.mol; E.pairAt = E.sel;
    return changed;
  }
  /* after a turn settles: an arc that has gone edge on moves to a pair that faces the viewer, drawn in again */
  function rePair(){
    if(S.tab !== 'shape' || !D.ready || drillHides()) return;
    if(choosePair(false)){ D.ready = false; D.arcT = 0; cause.el.classList.add('is-wait'); tween(260, function(u){ D.arcT = u; }, function(){ settle(); }); }
  }
  function selectAtom(i, how){
    if(S.tab !== 'shape' || !E.mol.atoms[i]) return;
    hideCue(true); tourDid('tap');
    if(i === E.sel && D.ready){ quietPick('a' + i); return; }
    stopTweens(true);
    D.prev = E.sel; E.sel = i; choosePair(true); D.ready = false; D.selT = 0; D.prevT = 1; D.arcT = 0;
    quietPick(null);
    cause.el.classList.add('is-wait');
    tween(300, function(u){ D.selT = u; D.prevT = 1 - u; D.arcT = u; }, function(){ D.prev = null; D.prevT = 0; settle(); });
  }

  /* The change has finished drawing: now the card, the angle and the cause line say it (labels wait for the
     picture). */
  function settle(){
    D.ready = true; D.selT = 1; D.arcT = 1; D.grow = 1; D.fade = 1;
    turnLabel();
    cause.el.classList.remove('is-wait');
    words();
    // Name the shape keeps the pins hidden until Check; they come back with the answer (shown first, so the card
    // is measured on screen)
    if(spots) spots.hide(drillHides());
    paint();
    if(S.tab === 'shape' && !drillHides()){ quietPick('a' + E.sel); paint(); }
  }

  function drillHides(){ return S.mode === 'quiz' && S.part === 'predict' && !task.done; }
  // the model's name for a screen reader; in Name the shape the molecule is not named until Check
  function turnLabel(){
    if(S.tab === 'hand') return;
    turnEl.setAttribute('aria-label', (drillHides() ? 'The molecule to name' : E.mol.name) + ', 3D model. Arrow keys turn it; Tab reaches each atom.');
  }

  /* the tapped atom as drawn: its angle is the one the arc shows */
  function drawnAtom(){
    var r = readAtom(E.mol, E.sel);
    if(r && E.pair && E.pairFor === E.mol && E.pairAt === E.sel){ r.pair = E.pair; r.angle = E.pair.deg; r.kind = angleKind(E.mol, E.sel, r); }
    return r;
  }
  function frameShape(){
    var lay = L, mol = E.mol, F = fitIn(lay.regA, mol, E.zoom);
    var hideAns = drillHides();
    var r = drawnAtom();
    var P = { rx: E.rx, ry: E.ry, cx: F.cx, cy: F.cy, scale: F.scale, style: E.style, letters: E.letters && !hideAns, allLp: E.allLp,
      sel: E.sel, selT: D.selT, prev: D.prev, prevT: D.prevT, grow: D.grow, pair: r && r.pair, showArc: !hideAns, arcT: D.arcT };
    var pts = PA.draw(P);
    lastPts.shape = pts;
    gA.style.opacity = D.fade == null ? 1 : String(D.fade);
    // the shadow on the bench, under the molecule's drawn width
    shadowB.style.display = 'none';
    var x0 = Infinity, x1 = -Infinity;
    pts.forEach(function(p){ x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); });
    shadowA.style.display = '';
    shadowA.setAttribute('cx', f1((x0 + x1) / 2)); shadowA.setAttribute('cy', f1(lay.benchY + 12));
    shadowA.setAttribute('rx', f1(Math.max(30, (x1 - x0) * 0.46))); shadowA.setAttribute('ry', f1(L.phone ? 8 : 11));
    shadowA.style.opacity = String(D.fade == null ? 1 : D.fade);
    // pins follow the atoms
    if(spots && spotsMol === mol){ spots.items.forEach(function(it, i){ it.at[0] = [pts[i].x, pts[i].y]; }); }
    // the angle on the picture, once the arc is drawn
    var ang = labPool.ang;
    var arc = PA.arc();
    // how much of the arc can be seen: points not under a ball drawn in front of them (no arc in sight, no number)
    var seen = 0;
    if(arc.pts){
      arc.pts.forEach(function(q){ if(!pts.some(function(p){ return p.z > q.z && Math.hypot(p.x - q.x, p.y - q.y) < p.r; })) seen++; });
      seen /= arc.pts.length;
    }
    arc.el.setAttribute('data-seen', seen >= 0.3 ? '1' : '0');
    if(D.ready && r && r.angle !== null && !hideAns && E.style !== 'space' && arc.mid && seen >= 0.3){
      var e = lab('ang', 'is-angle'); e.textContent = angleLabel(r);
      var ps = pts[E.sel], mx = arc.mid.x - ps.x, my = arc.mid.y - ps.y, ml = Math.sqrt(mx * mx + my * my), ux = ml > 3 ? mx / ml : 0, uy = ml > 3 ? my / ml : -1;
      /* near the arc first: within 40 px of its middle or its quarter points, outward first (recheck 1: the number
         drifted up to 90 px away and read as another atom's label); only if none is clear, farther out with a leader */
      var near = [], far = [], AP = arc.pts, anchors = [arc.mid, AP[Math.round(AP.length * 0.25)], AP[Math.round(AP.length * 0.75)]];
      var dirs = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, 2.0, -2.0, 2.4, -2.4, 2.8, -2.8, 3.14];
      [14, 20, 26, 32, 38].forEach(function(dd){ anchors.forEach(function(A){ dirs.forEach(function(t){
        var c = Math.cos(t), s = Math.sin(t); near.push([A.x + (ux * c - uy * s) * dd, A.y + (ux * s + uy * c) * dd]);
      }); }); });
      [50, 64, 80, 100, 124, 150, 180, 210].forEach(function(dd){ dirs.forEach(function(t){
        var c = Math.cos(t), s = Math.sin(t); far.push([arc.mid.x + (ux * c - uy * s) * dd, arc.mid.y + (ux * s + uy * c) * dd]);
      }); });
      // clear of every ball, stick, lobe and control, and of its own arc (review round 1)
      var avA = ctlBoxes().concat(PA.lobes()), avC = ballCircles(pts).concat(stickCircles(PA.sticks()), lineCircles(AP, 3));
      var bA = placeLab(e, near, avA, null, avC);
      if(!bA){ e.hidden = false; bA = placeLab(e, far, avA, null, avC); }
      aLead.style.display = 'none';
      if(bA){
        // how far the pill is from its arc; past 40 px a short leader joins them
        var best = null;
        AP.forEach(function(q){ var dx = Math.max(bA[0] - q.x, 0, q.x - bA[2]), dy = Math.max(bA[1] - q.y, 0, q.y - bA[3]), d = Math.hypot(dx, dy); if(!best || d < best.d) best = { d: d, q: q }; });
        if(best.d > 40){
          var qx = clamp(best.q.x, bA[0], bA[2]), qy = clamp(best.q.y, bA[1], bA[3]);
          aLead.setAttribute('x1', f1(qx)); aLead.setAttribute('y1', f1(qy)); aLead.setAttribute('x2', f1(best.q.x)); aLead.setAttribute('y2', f1(best.q.y));
          aLead.style.display = '';
        }
      }
    } else { if(ang) ang.hidden = true; aLead.style.display = 'none'; }
    if(spots && spotsMol === mol) spots.place();
    lastPts.shape = pts;
    return pts;
  }

  /* ====================================================================== */
  /* Tab 2: Handedness                                                       */
  /* ====================================================================== */
  var handRead = null, lastPts = { shape: [], hand: [] };     // what the drawn frame reads: { back, cfg, mirror }
  function frameHand(){
    var lay = L, mol = prep(HAND), FA = fitIn(lay.regA, mol, Hd.zoom, true), FB = fitIn(lay.regB, mol, Hd.zoom, true);
    var s = Math.min(FA.scale, FB.scale);
    var mirror = lay.side ? 'x' : 'y';
    // the H is the atom this tab asks for: never smaller than its letter needs (11 px or more)
    var base = { rx: Hd.rx, ry: Hd.ry, style: E.style === 'space' ? 'ball' : E.style, letters: true, allLp: false, sel: null, selT: 0, prev: null, prevT: 0, grow: 1, minH: 13 };
    var ptsA = PA.draw(Object.assign({}, base, { cx: FA.cx, cy: FA.cy, scale: s }));
    var ptsB = PB.draw(Object.assign({}, base, { cx: FB.cx, cy: FB.cy, scale: s, mirror: mirror }));
    lastPts.hand = ptsA; lastPts.handB = ptsB;
    gA.style.opacity = 1; gB.style.opacity = 1;
    // the mirror: a glass pane standing on the bench (side by side) or lying under the molecule (stacked)
    mirrorEl.style.display = '';
    var m = lay.mir;
    mirrorGlass.setAttribute('x', f1(m[0])); mirrorGlass.setAttribute('y', f1(m[1])); mirrorGlass.setAttribute('width', f1(m[2] - m[0])); mirrorGlass.setAttribute('height', f1(m[3] - m[1]));
    mirrorFrame.setAttribute('x', f1(m[0])); mirrorFrame.setAttribute('y', f1(m[1])); mirrorFrame.setAttribute('width', f1(m[2] - m[0])); mirrorFrame.setAttribute('height', f1(m[3] - m[1]));
    mirrorGlass.setAttribute('rx', 14); mirrorFrame.setAttribute('rx', 14);
    var sw = m[2] - m[0], sh = m[3] - m[1];
    mirrorSheen.setAttribute('d', 'M' + f1(m[0] + sw * 0.08) + ',' + f1(m[3] - sh * 0.06) + 'L' + f1(m[0] + sw * 0.34) + ',' + f1(m[1] + sh * 0.06) + 'L' + f1(m[0] + sw * 0.42) + ',' + f1(m[1] + sh * 0.06) + 'L' + f1(m[0] + sw * 0.16) + ',' + f1(m[3] - sh * 0.06) + 'Z');
    var x0 = Infinity, x1 = -Infinity;
    ptsA.forEach(function(p){ x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); });
    shadowA.style.display = lay.side ? '' : 'none';
    shadowA.setAttribute('cx', f1((x0 + x1) / 2)); shadowA.setAttribute('cy', f1(lay.benchY + 12));
    shadowA.setAttribute('rx', f1(Math.max(30, (x1 - x0) * 0.46))); shadowA.setAttribute('ry', f1(L.phone ? 8 : 11)); shadowA.style.opacity = 1;
    shadowB.style.display = 'none';

    // what this frame reads: is the H (priority 4) pointing away, and which way 1 -> 2 -> 3 turns as drawn
    var c = 0, pr = priorities(mol, c), hdir = rotate(M3.norm(M3.sub(mol.atoms[pr[3]].pos, mol.atoms[c].pos)), Hd.rx, Hd.ry);
    var back = -hdir.z >= BACK;
    function readOf(pts){ var t = readTurn([pts[pr[0]].x, pts[pr[0]].y], [pts[pr[1]].x, pts[pr[1]].y], [pts[pr[2]].x, pts[pr[2]].y]); return { turn: t, cfg: t === 'cw' ? 'R' : 'S' }; }
    var rA = readOf(ptsA), rB = readOf(ptsB);
    handRead = { back: back, a: rA, b: rB };

    // the reading arrows (only while the H is at the back), the priority numbers, the names
    var avoid = ctlBoxes(), placed = [], arrowCirc = [];
    function arrowFor(pts, rd, key){
      var path = arrows[key];
      var cx = pts[c].x, cy = pts[c].y, th = [0, 1, 2].map(function(k){ return Math.atan2(pts[pr[k]].y - cy, pts[pr[k]].x - cx); });
      var dist = [0, 1, 2].map(function(k){ return Math.hypot(pts[pr[k]].x - cx, pts[pr[k]].y - cy); });
      var rad = Math.max(pts[c].r + 10, Math.min.apply(null, dist) * 0.62), cw = rd.turn === 'cw';
      var span = function(a, b){ var dd = cw ? b - a : a - b; while(dd < 0) dd += 2 * Math.PI; return dd; };
      var a0 = th[0] + (cw ? 0.22 : -0.22), tot = span(th[0], th[2]) - 0.44, a1 = a0 + (cw ? tot : -tot);
      if(tot < 0.6){ path.style.display = 'none'; return; }
      var p0 = [cx + rad * Math.cos(a0), cy + rad * Math.sin(a0)], p1 = [cx + rad * Math.cos(a1), cy + rad * Math.sin(a1)];
      path.style.display = '';
      path.setAttribute('d', 'M' + f1(p0[0]) + ',' + f1(p0[1]) + 'A' + f1(rad) + ',' + f1(rad) + ' 0 ' + (tot > Math.PI ? 1 : 0) + ' ' + (cw ? 1 : 0) + ' ' + f1(p1[0]) + ',' + f1(p1[1]));
      // the arrow's path, for the labels to keep off (its head a little wider)
      var n = Math.max(6, Math.ceil(rad * tot / 6));
      for(var j = 0; j <= n; j++){ var aj = a0 + (cw ? 1 : -1) * tot * j / n; arrowCirc.push({ x: cx + rad * Math.cos(aj), y: cy + rad * Math.sin(aj), r: j === n ? 7 : 3 }); }
      if(!handDrawn[key]){
        path.classList.remove('is-in');
        if(!K.reduced()){ void path.getBoundingClientRect(); requestAnimationFrame(function(){ path.classList.add('is-in'); }); }
        else path.classList.add('is-in');
      }
      handDrawn[key] = true;
    }
    if(back){
      // the letters wait for the arrows to draw in (review round 1), as the words wait for the picture elsewhere
      if(!handDrawn.a && !K.reduced()){ cfgWait = true; clearTimeout(cfgWaitT); cfgWaitT = setTimeout(function(){ cfgWait = false; if(S.tab === 'hand') paint(); }, 340); }
      arrowFor(ptsA, rA, 'a'); arrowFor(ptsB, rB, 'b');
    }
    else { handDrawn.a = handDrawn.b = false; arrows.a.style.display = 'none'; arrows.b.style.display = 'none'; }
    var handCirc = ballCircles(ptsA).concat(ballCircles(ptsB), stickCircles(PA.sticks()), stickCircles(PB.sticks()), arrowCirc);
    // priority numbers beside each group, on both
    [[ptsA, 'A'], [ptsB, 'B']].forEach(function(pp){
      var pts = pp[0];
      pr.forEach(function(ai, k){
        var e = lab('pr' + pp[1] + k, 'is-prio'); e.textContent = String(k + 1);
        var p = pts[ai], vx = p.x - pts[c].x, vy = p.y - pts[c].y, l = Math.hypot(vx, vy);
        if(l < 4){ vx = 0.7; vy = -0.7; l = 1; }
        var ux = vx / l, uy = vy / l, cands = [];
        [p.r + 13, p.r + 20, p.r + 28, p.r + 38, p.r + 50].forEach(function(dd){ [0, 0.6, -0.6, 1.2, -1.2, 2, -2, 2.7, -2.7].forEach(function(t){
          var cs = Math.cos(t), sn = Math.sin(t); cands.push([p.x + (ux * cs - uy * sn) * dd, p.y + (ux * sn + uy * cs) * dd]);
        }); });
        // clear of both molecules' balls and sticks and both reading arrows (review round 1)
        var b = placeLab(e, cands, avoid.concat(placed), null, handCirc);
        if(b) placed.push(b);
      });
    });
    // the names under each, and the letter once it can be read
    [[ptsA, 'A', rA, lay.regA, 'Molecule'], [ptsB, 'B', rB, lay.regB, 'Mirror image']].forEach(function(pp){
      var pts = pp[0], y1 = -Infinity, y0 = Infinity, xa = Infinity, xb = -Infinity;
      pts.forEach(function(p){ y1 = Math.max(y1, p.y + p.r); y0 = Math.min(y0, p.y - p.r); xa = Math.min(xa, p.x - p.r); xb = Math.max(xb, p.x + p.r); });
      var cx = (xa + xb) / 2;
      var nm = lab('nm' + pp[1], 'is-name'); nm.textContent = pp[4];
      var bn = placeLab(nm, [[cx, y1 + 18], [cx, y1 + 30], [cx, y0 - 18], [cx, y0 - 30], [xb + labW(nm) / 2 + 10, (y0 + y1) / 2], [xa - labW(nm) / 2 - 10, (y0 + y1) / 2]], avoid.concat(placed), null, handCirc);
      if(bn) placed.push(bn);
      var cf = lab('cf' + pp[1], 'is-cfg');
      cf.classList.toggle('is-wait', back && cfgWait);
      if(back){
        cf.textContent = pp[2].cfg;
        var bc = placeLab(cf, [[xb + 30, (y0 + y1) / 2], [xa - 30, (y0 + y1) / 2], [xb + 30, y0 + 20], [xa - 30, y0 + 20], [cx, y0 - 26], [cx + 70, y1 + 18], [cx - 70, y1 + 18], [xb + 30, y1 - 20], [xa - 30, y1 - 20]], avoid.concat(placed), null, handCirc);
        if(bc) placed.push(bc);
      } else cf.hidden = true;
    });
    // the invisible keyboard pins follow the atoms once a drag ends (placing them reads the layout every frame)
    if(spots && spotsMol === HAND){ spots.items.forEach(function(it, i){ it.at[0] = [ptsA[i].x, ptsA[i].y]; }); if(!drag || !drag.moved) spots.place(); }

    return ptsA;
  }
  var handDrawn = { a: false, b: false }, arrows = {}, cfgWait = false, cfgWaitT = 0;
  ['a', 'b'].forEach(function(k){ var p = sv('path', 'v3-read', gOver); p.setAttribute('pathLength', '1'); p.setAttribute('marker-end', 'url(#v3m-arrow)'); p.style.display = 'none'; arrows[k] = p; });
  function handWords(){
    var r = handRead; if(!r) return;
    cause.el.classList.toggle('is-wait', !!(r.back && cfgWait));
    if(r.back){
      cause.set([{ t:'H at the back', role:'h' }, { t:'1 → 2 → 3 ' + (r.a.turn === 'cw' ? 'clockwise' : 'counterclockwise'), role:'dir', join:'+',
        say: 'one, two, three turns ' + (r.a.turn === 'cw' ? 'clockwise' : 'counterclockwise') }, { t: r.a.cfg, role:'cfg' }, { t:'mirror image ' + r.b.cfg, role:'cfg', join:'+' }]);
    } else {
      cause.set([{ t:'H not at the back', role:'h' }, { t:'turn it away to read R or S', role:'ink' }]);
    }
    say(cause.text());
  }

  /* ====================================================================== */
  /* The frame                                                               */
  /* ====================================================================== */
  function paint(){
    if(!L) layoutNow();
    if(!L) return;
    hideLabs(S.tab === 'shape' ? ['ang'] : null);
    if(S.tab === 'shape'){
      mirrorEl.style.display = 'none'; gB.style.display = 'none'; gOver.style.display = 'none';
      frameShape();
    } else {
      gB.style.display = ''; gOver.style.display = '';
      if(labPool.ang) labPool.ang.hidden = true;
      aLead.style.display = 'none';
      frameHand();
      handWords();
    }
    if(cueOn()) cue.place();
  }

  function words(){
    if(S.tab !== 'shape') return;
    if(drillHides()){
      // the question, never the answer (review round 1: this kept the last Explore line)
      cause.set([{ t:'Name the shape of the ringed atom', role:'ink' }]);
      var fa = E.mol.atoms[E.sel];
      say('Name the shape: the ringed atom is ' + (fa ? (NAMES[fa.el] || fa.el) : 'an atom') + ' in a molecule. Turn the model with the arrow keys to see it.');
      return;
    }
    var r = drawnAtom();
    cause.set(causeParts(r));
    say((E.mol.name ? E.mol.name + ', ' : '') + (r ? (NAMES[r.el] || r.el) + ': ' : '') + cause.text());
  }

  /* ---------------------------------------------------- turning */
  function view(){ return S.tab === 'hand' ? Hd : E; }
  function turnBy(dx, dy){
    var v = view();
    v.ry += dx; v.rx = clamp(v.rx + dy, -1.45, 1.45);
    if(v === E) E.user = true;
  }
  function turnTo(rx, ry, ms, done){
    var v = view(), r0 = v.rx, y0 = v.ry, dy = ry - y0;
    while(dy > Math.PI) dy -= 2 * Math.PI; while(dy < -Math.PI) dy += 2 * Math.PI;
    tween(ms || 520, function(u){ v.rx = r0 + (rx - r0) * u; v.ry = y0 + dy * u; }, function(){ crossFade(); if(done) done(); sync(); setTimeout(rePair, 0); });
  }
  var ptrs = {}, drag = null, pinch = null;
  sceneBox.addEventListener('pointerdown', function(e){
    if(e.target.closest('.v3-ctl') || e.target.closest('.tk2-cue') || e.button > 0) return;
    // a mouse drag turns the model; it never selects the page's text (review round 1)
    if(e.pointerType === 'mouse') e.preventDefault();
    ptrs[e.pointerId] = [e.clientX, e.clientY];
    var ids = Object.keys(ptrs);
    if(ids.length === 2){
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: view().zoom };
      drag = null; return;
    }
    drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, id: e.pointerId };
    try{ sceneBox.setPointerCapture(e.pointerId); }catch(err){}
    hideCue(true);
  });
  sceneBox.addEventListener('pointermove', function(e){
    if(ptrs[e.pointerId]) ptrs[e.pointerId] = [e.clientX, e.clientY];
    if(pinch){
      var ids = Object.keys(ptrs); if(ids.length < 2) return;
      var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      view().zoom = clamp(pinch.z * d / (pinch.d || 1), 0.6, 1.8); kick(); return;
    }
    if(!drag || drag.id !== e.pointerId) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if(!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    if(!drag.moved){ drag.moved = true; stopTweens(true); sceneBox.classList.add('is-drag'); tourDid('turn'); }
    drag.x = e.clientX; drag.y = e.clientY;
    turnBy(dx * 0.011, dy * 0.011);
    kick();
  });
  function endPtr(e){
    delete ptrs[e.pointerId];
    if(pinch){ if(Object.keys(ptrs).length < 2) pinch = null; return; }
    if(!drag || drag.id !== e.pointerId) return;
    var was = drag; drag = null; sceneBox.classList.remove('is-drag');
    if(was.moved){ sync(); rePair(); if(S.tab === 'hand') paint(); return; }
    if(e.type === 'pointerup') tapAt(e.clientX, e.clientY);
  }
  sceneBox.addEventListener('pointerup', endPtr);
  sceneBox.addEventListener('pointercancel', endPtr);
  // a pointer click on a pin is handled as a tap above (on what is drawn under the finger); keys still reach the kit
  sceneBox.addEventListener('click', function(e){ if(e.detail > 0 && e.target.closest('.tk2-spots')) e.stopPropagation(); }, true);
  sceneBox.addEventListener('wheel', function(e){
    if(!e.ctrlKey) return;      // a plain wheel scrolls the page
    e.preventDefault();
    var v = view(); v.zoom = clamp(v.zoom * Math.exp(-e.deltaY * 0.004), 0.6, 1.8); kick();
  }, { passive: false });
  /* a tap acts on the atom drawn under the finger: the front-most ball that contains the point, else the nearest
     center within 26 px; a tap on empty picture does nothing */
  function tapAt(cx, cy){
    if(!L) return;
    var s = sceneBox.getBoundingClientRect(), x = cx - s.left, y = cy - s.top;
    var drawn = S.tab === 'shape' ? frameShapePts() : frameHandPts();
    var best = null;
    drawn.map(function(p, i){ return { p: p, i: i }; }).sort(function(a, b){ return b.p.z - a.p.z; }).some(function(o){
      if(Math.hypot(o.p.x - x, o.p.y - y) <= o.p.r + 3){ best = o.i; return true; } return false;
    });
    if(best == null){
      var nd = 27;
      drawn.forEach(function(p, i){ var d = Math.hypot(p.x - x, p.y - y); if(d < nd){ nd = d; best = i; } });
    }
    if(best == null) return;
    if(S.tab === 'shape'){ if(!drillHides()) selectAtom(best, 'tap'); }
    else { hideCue(true); spots.pick('a' + best, 'tap'); }
  }
  function frameShapePts(){ return lastPts.shape; }
  function frameHandPts(){ return lastPts.hand; }

  turnEl.addEventListener('keydown', function(e){
    var st = e.shiftKey ? 0.4 : 0.14, k = e.key;
    if(k === 'ArrowLeft') turnBy(-st, 0); else if(k === 'ArrowRight') turnBy(st, 0);
    else if(k === 'ArrowUp') turnBy(0, -st); else if(k === 'ArrowDown') turnBy(0, st);
    else if(k === 'Home'){ e.preventDefault(); resetView(); return; }
    else return;
    e.preventDefault(); hideCue(true); tourDid('turn'); stopTweens(true); paint(); syncSoon();
    clearTimeout(keyPairT); keyPairT = setTimeout(rePair, 350);
  });
  var syncT = 0, keyPairT = 0;
  function syncSoon(){ clearTimeout(syncT); syncT = setTimeout(function(){ sync(); }, 300); }
  function resetView(){
    hideCue(true);
    var v = view(), hv = homeView(S.tab === 'shape' ? E.mol : HAND), z0 = v.zoom;
    turnTo(hv.rx, hv.ry, 520);
    tween(520, function(u){ v.zoom = z0 + (1 - z0) * u; });
  }
  resetBtn.addEventListener('click', resetView);
  backBtn.addEventListener('click', function(){
    hideCue(true); tourDid('back');
    var pr = priorities(HAND, 0), t = awayView(M3.sub(HAND.atoms[pr[3]].pos, HAND.atoms[0].pos));
    turnTo(t.rx, t.ry, 700);
  });

  /* ---------------------------------------------------- tabs */
  var PURPOSE = { shape:'See how electron groups set each atom’s shape', hand:'Turn the H to the back to read R or S' };
  function setTab(v, user){
    if(v !== 'shape' && v !== 'hand') v = 'shape';
    stopTweens(true); clearTimeout(cfgWaitT); cfgWait = false;
    S.tab = v; tabs.value(v);
    stage.setAttribute('data-tab', v);
    head.purpose(PURPOSE[v]);
    pickEl.hidden = v !== 'shape';
    backBtn.hidden = v !== 'hand';
    L = null; layoutNow();
    hideLabs();
    if(v === 'shape'){
      PA.build(E.mol); makeSpots(E.mol, spotItems1(E.mol)); PB.build(HAND); gB.style.display = 'none';
      D.selT = 1; D.prev = null; D.ready = true; D.arcT = 1; D.grow = 1; D.fade = 1;
      cause.el.classList.remove('is-wait');
      turnLabel();
      paint(); words(); if(!drillHides()) quietPick('a' + E.sel);
    } else {
      PA.build(HAND); PB.build(HAND); handDrawn = { a: false, b: false };
      makeSpots(HAND, HAND.atoms.map(function(a, i){
        var pr = priorities(HAND, 0), k = pr.indexOf(i);
        return { id: 'a' + i, name: i === 0 ? 'Stereocenter' : (NAMES[a.el] || a.el) + ', priority ' + (k + 1), at: [[0, 0]] };
      }));
      turnEl.setAttribute('aria-label', 'Bromochlorofluoromethane and its mirror image. Arrow keys turn it; Tab reaches each atom.');
      crossFade(); paint();
    }
    if(user){ sync({ tab: v === 'hand' ? 'hand' : null }); }
    refNow();
    showCue();
  }

  /* ---------------------------------------------------- the one cue, and "Show me how" */
  var cue = null;
  function cueOn(){ return cue && cue.active(); }
  function cueAt(){
    var pts = S.tab === 'shape' ? lastPts.shape : lastPts.hand;
    if(!pts.length || !L) return [L ? L.W / 2 : 0, L ? L.H / 2 : 0];
    var x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function(p){ x1 = Math.max(x1, p.x + p.r); y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r); });
    return [Math.min(x1 + 6, L.W - 8), (y0 + y1) / 2];
  }
  function cueClear(){
    var b = layer.el.querySelector('.tk2-cue'); if(!b) return true;
    var r = b.getBoundingClientRect(), sc = sceneBox.getBoundingClientRect();
    if(r.left < sc.left + 2 || r.right > sc.right - 2 || r.top < sc.top + 2 || r.bottom > sc.bottom - 2) return false;
    var others = [].slice.call(labsEl.querySelectorAll('.v3-lab:not([hidden])')).concat([pickEl, btnRow, layer.el.querySelector('.tk2-spot-card:not([hidden])')]);
    var pts = S.tab === 'shape' ? lastPts.shape : lastPts.hand.concat(lastPts.handB || []);
    var balls = pts.map(function(p){ return { left: sc.left + p.x - p.r, right: sc.left + p.x + p.r, top: sc.top + p.y - p.r, bottom: sc.top + p.y + p.r }; });
    return others.filter(Boolean).filter(function(e){ return !e.hidden && e.offsetParent; }).map(function(e){ return e.getBoundingClientRect(); }).concat(balls).every(function(q){
      return r.right <= q.left || q.right <= r.left || r.bottom <= q.top || q.bottom <= r.top;
    });
  }
  function hideCue(used){ if(cue && cue.active()) cue.hide(used); }
  function showCue(){
    hideCue(false);
    if(S.mode !== 'explore' || tourActive() || !L) return;
    var key = S.tab === 'shape' ? 'ochem-v3-shape' : 'ochem-v3-hand', text = S.tab === 'shape' ? 'Drag to turn it, tap an atom' : 'Turn the H to the back';
    var sides = ['right', 'below', 'left', 'above'];
    for(var i = 0; i < sides.length; i++){
      var side = sides[i];
      cue = K.cue(layer, { key: key, text: text, side: side, at: function(){ return cueAtSide(side); } });
      if(!cue.show()) return;
      if(cueClear() || i === sides.length - 1) return;
      cue.hide(false);
    }
  }
  function cueAtSide(side){
    var pts = S.tab === 'shape' ? lastPts.shape : lastPts.hand;
    if(!pts.length) return cueAt();
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function(p){ x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r); });
    if(side === 'right') return [x1 + 4, (y0 + y1) / 2];
    if(side === 'left') return [x0 - 4, (y0 + y1) / 2];
    if(side === 'below') return [(x0 + x1) / 2, y1 + 4];
    return [(x0 + x1) / 2, y0 - 4];
  }
  stage.addEventListener('keydown', function(e){ if(/^(Arrow|Home|End|Enter| )/.test(e.key) && sceneBox.contains(e.target)) hideCue(true); }, true);
  var tourShape = K.tour({ key:'ochem-v3-shape', label:'Show me how', steps: [
    { id:'turn', text:'Drag the molecule to turn it. Look at it from every side.', target: function(){ return sceneBox; } },
    { id:'tap', text:'Tap an atom. Its bonds turn blue and its lone pairs show in amber.', target: function(){ var b = layer.el.querySelector('.tk2-spot[aria-pressed="true"]') || layer.el.querySelector('.tk2-spot'); return b || sceneBox; } },
    { id:'mol', text:'Pick another molecule. Build your own from the ? sheet.', target: function(){ return molSel; } }],
    onClose: function(had){ if(had) try{ head.how.focus({ preventScroll:true }); }catch(e){} showCue(); } });
  var tourHand = K.tour({ key:'ochem-v3-hand', label:'Show me how', steps: [
    { id:'turn', text:'Drag the molecule. Its reflection in the mirror turns with it.', target: function(){ return sceneBox; } },
    { id:'back', text:'Or let it turn the H to the back for you.', target: function(){ return backBtn; } },
    { id:'read', text:'With the H at the back, follow 1, 2, 3: clockwise is R. The mirror image reads the other way.', target: function(){ var e = labPool.cfA; return e && !e.hidden ? e : sceneBox; } }],
    onClose: function(had){ if(had) try{ head.how.focus({ preventScroll:true }); }catch(e){} showCue(); } });
  function tourActive(){ return tourShape.active() || tourHand.active(); }
  function tourDid(id){ if(tourShape.active()) tourShape.did(id); if(tourHand.active()) tourHand.did(id); }
  function startTour(){
    if(S.mode !== 'explore') return;
    hideCue(false); tourShape.stop(); tourHand.stop();
    (S.tab === 'shape' ? tourShape : tourHand).start(true);
  }

  /* ====================================================================== */
  /* "?": this atom, this molecule, the view, Build your own, the key        */
  /* ====================================================================== */
  var ref = mk('div', 'v3-ref',
    '<p class="v3-ref-how"><button type="button" class="tk2-how" id="v3RefHow">Show me how</button></p>' +
    '<div id="v3RefNow"></div>' +
    '<details class="tool-more" id="v3RefView"><summary>View</summary><div class="v3-ref-view">' +
      '<div class="tseg" id="v3Modes" role="group" aria-label="Style">' +
        '<button type="button" data-mode="ball" aria-pressed="true">Ball &amp; stick</button>' +
        '<button type="button" data-mode="space" aria-pressed="false">Space-filling</button>' +
        '<button type="button" data-mode="wire" aria-pressed="false">Wireframe</button></div>' +
      '<div class="tseg" id="v3Views" role="group" aria-label="View from">' +
        '<button type="button" data-view="iso">Angled</button><button type="button" data-view="front">Front</button>' +
        '<button type="button" data-view="top">Top</button><button type="button" data-view="side">Edge-on</button>' +
        '<button type="button" id="v3Spin">Turn it once</button></div>' +
      '<label class="tcheck"><input type="checkbox" id="v3Labels" checked> Atom letters</label>' +
      '<label class="tcheck"><input type="checkbox" id="v3Lp"> Lone pairs on every atom</label>' +
      '<label class="tcheck"><input type="range" id="v3Zoom" class="trange" min="60" max="180" value="100" aria-label="Zoom"> Zoom</label>' +
    '</div></details>' +
    '<details class="tool-more" id="v3BuildBox"><summary>Build your own molecule</summary>' +
      '<p class="tmuted" style="margin:6px 0 10px;">Type a formula or draw it; the model in the picture folds up as you go.</p>' +
      '<div id="v3Builder"></div><div id="v3BuildMsg"></div><div id="v3Send"></div></details>' +
    '<details class="tool-more"><summary>How to read the picture</summary><div class="v3-ref-key">' +
      '<p><span class="v3-sw is-bond"></span><b>Blue bonds:</b> the tapped atom\'s bonds. A double or triple bond is one electron group, not two.</p>' +
      '<p><span class="v3-sw is-lp"></span><b>Amber lobes:</b> its lone pairs, two electrons each. They push like a bond (a little harder) but are not part of the shape\'s name.</p>' +
      '<p><span class="v3-sw is-shape"></span><b>The arc:</b> the smallest bond angle at that atom, measured from the coordinates drawn. Every angle is under "This atom".</p>' +
      '<p><span class="v3-sw is-cfg"></span><b>Handedness:</b> priorities go by atomic number (Br 1, Cl 2, F 3, H 4). With the H pointing away from you, 1 → 2 → 3 clockwise is R and counterclockwise is S. A mirror reverses the turn, so the mirror image is the other one.</p>' +
      '<p>Ball sizes are drawing sizes, chosen so hydrogens stay visible; Space-filling uses the real van der Waals sizes. Most angles drawn are measured ones: ammonia 107°, water 104.5°, hydronium about 113°, ethene 117.4° and formaldehyde about 116.5° (H–C–H), methanol 108.5° (C–O–H), dimethyl ether 111.7° (C–O–C), cyclopropane 114.5° (H–C–H) and formamide\'s carbon (O=C–N 124.6°, N–C–H 112.5°). Methane, BF₃, PCl₅, SF₆, CO₂, ethyne, benzene and the methyl cation have the angles their symmetry sets. Where no measured angle is drawn (ethane, the stereocenter, the chair and the boat, the methyl anion, formamide\'s nitrogen, the methyl groups), the number says <b>ideal</b>: that atom is drawn at the model\'s ideal angle, and the real molecule is off by a degree or two. A molecule you build is drawn at the ideal angles.</p>' +
    '</div></details>');
  function refNow(){
    var el = byId('v3RefNow'); if(!el) return;
    if(drillHides()){ el.innerHTML = '<div class="tempty">Hidden until you answer.</div>'; return; }
    if(S.tab === 'hand'){
      var cfg = config3D(HAND, 0);
      el.innerHTML = '<h3 class="v3-ref-h">This stereocenter</h3>' +
        '<p class="tmuted" style="margin:0 0 8px;">' + esc(HAND.note || '') + '</p>' +
        '<div class="tnote tnote--info"><span class="tnote__k">Bromochlorofluoromethane, CHFClBr</span>The molecule on the left is (' + cfg + '); its mirror image is (' + (cfg === 'R' ? 'S' : 'R') +
        '). No turn makes one into the other: swapping any two groups is the only way, and that is a different molecule.</div>';
      return;
    }
    var a = readAtom(E.mol, E.sel);
    var html = '<h3 class="v3-ref-h">This atom: ' + esc(a ? (NAMES[a.el] || a.el) : '') + ' in ' + esc(E.mol.name) + '</h3>';
    if(a){
      var shape = a.shape;
      html += '<div class="tstat">' +
        '<div><div class="k">Electron groups</div><div class="v">' + a.steric + '</div></div>' +
        '<div><div class="k">Bonds</div><div class="v">' + a.bonds + '</div></div>' +
        '<div><div class="k">Lone pairs</div><div class="v">' + a.lonePairs + '</div></div>' +
        '<div><div class="k">Hybridization</div><div class="v">' + (shape ? shape.hyb : 'n/a') + '</div></div></div>';
      if(shape){
        html += '<div class="tnote tnote--info"><span class="tnote__k">' + esc(shape.m) + '</span>' +
          'The ' + a.steric + ' electron groups arrange themselves ' + shape.e.toLowerCase() + '. ' +
          (a.deloc ? 'This nitrogen\'s lone pair is shared into the C=O (resonance), so it sits in a p orbital and the nitrogen is flat. ' :
          a.lonePairs ? 'But you only see the atoms, and ' + (a.lonePairs === 1 ? 'one of those groups is a lone pair' : a.lonePairs + ' of them are lone pairs') +
            ', so the shape you name from the atoms alone is ' + shape.m.toLowerCase() + '.' :
            'With no lone pairs, the shape of the atoms is the same as the shape of the groups.') + '</div>';
      } else {
        html += '<p class="tmuted">An end atom has one neighbor, so it has no bond angle and no shape of its own. Tap a central atom.</p>';
      }
      if(a.angles.length){
        var ideal = shape ? shape.ideal : null;
        html += '<div class="ttable-scroll"><table class="ttable"><thead><tr><th>Angle</th><th>Measured</th>' + (ideal ? '<th>Ideal</th>' : '') + '</tr></thead><tbody>' +
          dedupeAngles(a.angles).map(function(g){
            var off = ideal === null ? 0 : g.deg - ideal;
            return '<tr><td>' + esc(g.a) + '–' + esc(a.el) + '–' + esc(g.b) + (g.count > 1 ? ' <span class="tmuted">×' + g.count + '</span>' : '') + '</td>' +
              '<td class="num">' + g.deg.toFixed(1) + '°</td>' +
              (ideal ? '<td class="num ' + (Math.abs(off) < 0.6 ? 'win' : 'lose') + '">' + (Math.abs(off) < 0.6 ? 'on the nose' : (off > 0 ? '+' : '') + off.toFixed(1) + '°') + '</td>' : '') + '</tr>';
          }).join('') + '</tbody></table></div>';
        if(ideal !== null && a.angles[0].deg - ideal < -1.2 && a.lonePairs){
          html += '<p class="tmuted" style="margin-top:10px;">Every angle here is under the ideal ' + ideal + '°. A lone pair is held by one nucleus instead of shared between two, so it spreads out closer to the atom and squeezes the bonding pairs together. Two lone pairs squeeze harder than one.</p>';
        }
        if(ideal === 120 && !a.lonePairs && !a.deloc && a.angles[0].deg < 119){
          html += '<p class="tmuted" style="margin-top:10px;">The double bond holds four electrons, so it pushes a little harder than a single bond and the two single bonds close to ' + fmtDeg(a.angles[0].deg) + ', under the ideal 120°.</p>';
        }
        if(ideal !== null && a.lonePairs && a.angles[0].deg - ideal > 1.2){
          // hydronium (review recheck 1): wider than ideal with a lone pair, so the squeeze idea needs a word
          html += '<p class="tmuted" style="margin-top:10px;">Measured wider than ' + ideal + '°, though it has a lone pair. The positive oxygen pulls every pair in close to itself: the bonding pairs crowd each other and spread apart, and its lone pair is held tighter, so it squeezes them less than ammonia\'s does (107°).</p>';
        }
        if(a.kind === 'ideal'){
          html += '<p class="tmuted" style="margin-top:10px;">This atom is drawn at the model\'s ideal angle; no measured angle is drawn for it.</p>';
        }
        if(a.kind === 'ring'){
          html += '<p class="tmuted" style="margin-top:10px;">Four groups would spread to 109.5°, but three carbons in a ring can only meet at 60°. That squeeze is the ring strain; the hydrogens open out to 114.5°.</p>';
        }
        if(shape && shape.e === 'Trigonal bipyramidal'){
          html += '<p class="tmuted" style="margin-top:10px;">The arc shows the smallest angle, 90° between an axial and an equatorial bond. The three equatorial bonds are 120° apart.</p>';
        }
      }
    }
    html += '<h3 class="v3-ref-h">This molecule: ' + esc(E.mol.name) + (E.mol.formula ? ' · ' + esc(E.mol.formula) : '') + '</h3>' +
      '<p class="tmuted" style="margin:0;">' + esc(E.mol.note || '') + '</p>';
    el.innerHTML = html;
  }
  /* Six identical 109.5° angles is one fact, not six rows. */
  function dedupeAngles(angles){
    var out = [];
    angles.forEach(function(g){
      var hit = out.filter(function(o){ return Math.abs(o.deg - g.deg) < 0.5 && ((o.a === g.a && o.b === g.b) || (o.a === g.b && o.b === g.a)); })[0];
      if(hit){ hit.count++; return; }
      out.push({ a:g.a, b:g.b, deg:g.deg, count:1 });
    });
    return out;
  }

  // the view settings ("?")
  var VIEWS = { iso: VIEW0, front: { rx:0, ry:0 }, top: { rx:-1.45, ry:0 }, side: { rx:0, ry:Math.PI / 2 } };
  function paintModes(){ ref.querySelectorAll('#v3Modes button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === E.style)); b.classList.toggle('on', b.getAttribute('data-mode') === E.style); }); }
  ref.querySelector('#v3Modes').addEventListener('click', function(e){
    var b = e.target.closest('[data-mode]'); if(!b) return;
    E.style = b.getAttribute('data-mode'); paintModes(); byId('v3Lp').disabled = E.style === 'space';
    sceneBox.classList.remove('is-xf'); void sceneBox.offsetWidth; sceneBox.classList.add('is-xf');
    sync(); paint();
  });
  ref.querySelector('#v3Views').addEventListener('click', function(e){
    var b = e.target.closest('[data-view]');
    if(b){ var v = VIEWS[b.getAttribute('data-view')]; turnTo(v.rx, v.ry, 520); return; }
    if(e.target.closest('#v3Spin')){
      var v2 = view(), y0 = v2.ry;
      tween(6000, function(u){ v2.ry = y0 + u * 2 * Math.PI; }, function(){ v2.ry = y0; sync(); });
    }
  });
  ref.querySelector('#v3Labels').addEventListener('change', function(e){ E.letters = e.target.checked; paint(); });
  ref.querySelector('#v3Lp').addEventListener('change', function(e){ E.allLp = e.target.checked; paint(); });
  ref.querySelector('#v3Zoom').addEventListener('input', function(e){ view().zoom = parseInt(e.target.value, 10) / 100; paint(); });
  // the view sheet shows the current zoom whenever "?" opens
  function syncZoomInput(){ var z = ref.querySelector('#v3Zoom'); if(z) z.value = Math.round(view().zoom * 100); }

  /* ---------------------------------------------------- Build your own (in "?") */
  var builderApi = null, v3SendApi = null, v3LastBuilt = null;
  function showBuildMsg(kind, text){
    var el = byId('v3BuildMsg'); if(!el) return;
    el.innerHTML = text ? '<div class="tnote tnote--' + kind + '" style="margin-top:12px;">' + esc(text) + '</div>' : '';
  }
  function openBuilder(){
    if(builderApi) return builderApi;
    if(!window.OchemBuilderUI){ showBuildMsg('bad', 'The builder did not load on this page.'); return null; }
    if(window.OchemToolHandoff){
      v3SendApi = window.OchemToolHandoff.mountSend(byId('v3Send'), function(){ return v3LastBuilt; });
    }
    builderApi = window.OchemBuilderUI.mount(byId('v3Builder'), {
      onChange: function(st, report){
        v3LastBuilt = (report.empty || !report.ok) ? null : st;
        if(v3SendApi) v3SendApi.refresh();
        if(report.empty){ showBuildMsg('', ''); return; }
        if(!report.ok){ showBuildMsg('bad', 'Fix what is flagged below and it will fold up. A structure that cannot exist has no shape to show.'); return; }
        var r = window.OchemBuilder.to3D(st);
        if(r.error){ showBuildMsg('warn', r.error); return; }
        r.mol.name = st.name || 'Your molecule';
        r.mol.focus = 0;
        r.mol._model = true;
        r.mol.note = 'Built from your drawing, so the angles are the ideal ones for each shape. The ready-made molecules carry real compressions: ammonia at 107°, water at 104.5°.';
        var typed = byId('mbText');
        var asText = typed && typed.value ? typed.value : null;
        built = { mol: r.mol };
        sync(asText ? { build: asText, st: null, mol: null } : { build: null, st: window.OchemBuilder.encode(st), mol: null });
        showBuildMsg('good', r.mol.approximate
          ? 'Folded. This has more than one ring, so the second ring is grown outward rather than closed exactly. Angles inside the first ring are right, the rest is approximate.'
          : 'Folded. It is in the picture: drag it, and tap any atom.');
        if(S.tab !== 'shape') setTab('shape', true);
        setMol(r.mol, { how:'build' });
      }
    });
    return builderApi;
  }
  ref.querySelector('#v3BuildBox').addEventListener('toggle', function(e){ if(e.target.open) openBuilder(); });

  /* ---------------------------------------------------- links (the old keys, plus tab) */
  function sync(extra){
    if(!window.OchemToolState) return;
    var cur = window.OchemToolState.read();
    var v = S.tab === 'hand' ? Hd : E;
    var next = { mol: cur.mol, build: cur.build, st: cur.st, tab: S.tab === 'hand' ? 'hand' : null,
      mode: E.style === 'ball' ? null : E.style, rx: v.rx.toFixed(2), ry: v.ry.toFixed(2) };
    Object.keys(extra || {}).forEach(function(k){ next[k] = extra[k]; });
    if(next.build) next.mol = null;
    window.OchemToolState.write(next);
  }

  /* ====================================================================== */
  /* Test yourself, part 1: Name the shape (the old "Predict shape")         */
  /* ====================================================================== */
  var TASK_POOL = ['methane', 'ammonia', 'water', 'boron-trifluoride', 'phosphorus-pentachloride', 'sulfur-hexafluoride',
                   'ethene', 'ethyne', 'carbon-dioxide-3d', 'formaldehyde-3d', 'methyl-cation', 'methyl-anion',
                   'hydronium', 'acetonitrile', 'dimethyl-ether'];
  /* Formamide is left out: the model draws its nitrogen with the lone pair delocalized (no lone pair on N), which
     is right for the shape and would read as a wrong count in "N bonds and 0 lone pairs" feedback. Angles are only
     asked where the library's geometry is the textbook value. */
  var ANGLE_OK = { methane:109.5, ammonia:107, water:104.5, 'boron-trifluoride':120, 'phosphorus-pentachloride':90,
                   'sulfur-hexafluoride':90, ethene:120, ethyne:180, 'carbon-dioxide-3d':180, 'formaldehyde-3d':120,
                   'methyl-cation':120, acetonitrile:180, formamide:120 };
  var ANGLES = [90, 104.5, 107, 109.5, 120, 180];
  var task = { on:false, done:false, id:null, shape:null, angle:null, score:{ right:0, total:0 } };
  var taskBox = mk('div', 'v3q');
  taskBox.setAttribute('aria-live', 'polite');
  function taskSay(){
    if(!task.on){ taskBox.innerHTML = ''; return; }
    var mol = E.mol, a = M3.analyse(mol, mol.focus === undefined ? 0 : mol.focus);
    var shapes = [];
    Object.keys(M3.SHAPES).forEach(function(k){ var n = M3.SHAPES[k].m; if(shapes.indexOf(n) < 0) shapes.push(n); });
    var askAngle = ANGLE_OK[task.id] !== undefined;
    var chip = function(kind, val, label, chosen, right){
      var cls = 'tchip' + (chosen ? ' on' : '') + (task.done && right ? ' is-right' : '') + (task.done && chosen && !right ? ' is-wrong' : '');
      return '<button type="button" class="' + cls + '" data-' + kind + '="' + esc(String(val)) + '" aria-pressed="' + (chosen ? 'true' : 'false') + '"' + (task.done ? ' disabled' : '') + '>' + label + '</button>';
    };
    var html = '<p class="v3q-q">What shape is the ringed <b>' + esc(a.el) + '</b>' + (askAngle ? ', and its bond angle' : '') + '? Turn the model to see.' +
      (task.score.total ? ' <span class="tmuted">' + task.score.right + ' of ' + task.score.total + '</span>' : '') + '</p>' +
      '<p class="v3q-k">Molecular shape</p><div class="tchips">' +
        shapes.map(function(n){ return chip('shape', n, esc(n), task.shape === n, n === a.shape.m); }).join('') + '</div>' +
      (askAngle ? '<p class="v3q-k">' + (task.id === 'phosphorus-pentachloride' || task.id === 'sulfur-hexafluoride' ? 'Smallest bond angle' : 'Bond angle, about') + '</p><div class="tchips">' +
        ANGLES.map(function(g){ return chip('angle', g, g + '°', task.angle === g, g === ANGLE_OK[task.id]); }).join('') + '</div>' : '') +
      '<div class="trow">' +
        (task.done ? '<button type="button" class="btn-press" id="v3Next">Next molecule</button>'
                   : '<button type="button" class="btn-press" id="v3Check"' + (task.shape && (!askAngle || task.angle !== null) ? '' : ' disabled') + '>Check</button>' +
                     '<button type="button" class="tchip tchip--ghost" id="v3LpHint">' + (E.allLp ? 'Hide' : 'Show') + ' lone pairs</button>') +
      '</div>';
    if(task.done){
      var okS = task.shape === a.shape.m, okA = !askAngle || task.angle === ANGLE_OK[task.id];
      var measured = a.angles.length ? a.angles[0].deg : null;
      html += '<div class="tnote ' + (okS && okA ? 'tnote--good' : 'tnote--bad') + '" tabindex="-1" id="v3Verdict"><span class="tnote__k">' +
        esc(mol.name) + ': ' + esc(a.shape.m) + (askAngle ? ', ' + ANGLE_OK[task.id] + '°' : '') + '</span>' +
        a.bonds + ' bond' + (a.bonds === 1 ? '' : 's') + ' and ' + a.lonePairs + ' lone pair' + (a.lonePairs === 1 ? '' : 's') +
        ' on the ' + esc(a.el) + ' make ' + a.steric + ' electron group' + (a.steric === 1 ? '' : 's') + ', arranged ' + esc(a.shape.e.toLowerCase()) + '. ' +
        (a.lonePairs ? 'Name the shape from the atoms only: ' + esc(a.shape.m.toLowerCase()) + '. ' : '') +
        (!okS && task.shape ? (task.shape === a.shape.e && a.lonePairs ? 'You named the electron geometry; the lone pair' + (a.lonePairs > 1 ? 's are' : ' is') + ' there but not part of the shape. '
          : 'Count the electron groups again: every lone pair counts, and a double or triple bond counts as one. ') : '') +
        (askAngle && measured !== null ? 'Measured on this model: ' + measured.toFixed(1) + '°' +
          (a.lonePairs && ANGLE_OK[task.id] < 109.5 ? ', under 109.5° because lone pairs push the bonds together.' : '.') : '') +
        '</div>';
    }
    taskBox.innerHTML = html;
  }
  taskBox.addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b || b.disabled) return;
    if(b.hasAttribute('data-shape')){ task.shape = b.getAttribute('data-shape'); taskSay(); refocus('[data-shape="' + task.shape + '"]'); return; }
    if(b.hasAttribute('data-angle')){ task.angle = parseFloat(b.getAttribute('data-angle')); taskSay(); refocus('[data-angle="' + task.angle + '"]'); return; }
    if(b.id === 'v3Check'){
      var a = M3.analyse(E.mol, E.mol.focus === undefined ? 0 : E.mol.focus), askAngle = ANGLE_OK[task.id] !== undefined;
      task.done = true; task.score.total++;
      if(task.shape === a.shape.m && (!askAngle || task.angle === ANGLE_OK[task.id])) task.score.right++;
      E.letters = true; byId('v3Labels').checked = true;
      // the answer comes back on the picture the way a change does: the arc draws, then the words
      D.ready = false; D.arcT = 0;
      tween(300, function(u){ D.arcT = u; }, function(){ settle(); });
      taskSay(); refNow();
      var v = taskBox.querySelector('#v3Next') || byId('v3Verdict'); if(v) v.focus({ preventScroll:true });
      if(window.OchemShowWork) window.OchemShowWork(sceneBox);
      return;
    }
    if(b.id === 'v3Next'){ nextTask(); var f = taskBox.querySelector('[data-shape]'); if(f) f.focus(); return; }
    if(b.id === 'v3LpHint'){ E.allLp = !E.allLp; byId('v3Lp').checked = E.allLp; paint(); taskSay(); refocus('#v3LpHint'); }
  });
  function refocus(sel){ var x = taskBox.querySelector(sel); if(x) x.focus(); }
  function nextTask(){
    var pool = TASK_POOL.filter(function(id){ return LIB.get(id) && id !== task.id; });
    task.id = pool[Math.floor(Math.random() * pool.length)];
    task.shape = null; task.angle = null; task.done = false;
    /* Lone pairs on (the shape is named from the atoms, and seeing the pairs is how a student learns to leave them
       out); letters off so the ringed atom is found by looking; a random start, so "edge-on" is found, not given. */
    E.letters = false; byId('v3Labels').checked = false;
    setMol(LIB.get(task.id), { instant: true });
    E.rx = -0.2 - Math.random() * 0.7; E.ry = Math.random() * 6.28;
    D.ready = true; quietPick(null); turnLabel(); words(); refNow();
    crossFade(); paint();
    taskSay();
  }

  /* ====================================================================== */
  /* Modes                                                                   */
  /* ====================================================================== */
  /* The shell's adapter calls this after every switch: mode 'explore' | 'quiz', part 'predict' | 'check' or null.
     "Name the shape" borrows the Shape picture; Explore gets back the molecule, atom, view and settings it had. */
  function onShow(mode, part){
    stopTweens(true); clearTimeout(cfgWaitT); cfgWait = false; tourShape.stop(); tourHand.stop(); hideCue(false);
    var drill = mode === 'quiz' && part === 'predict';
    if(drill && !drillSaved) drillSaved = { mol:E.mol, sel:E.sel, rx:E.rx, ry:E.ry, letters:E.letters, allLp:E.allLp, tab:S.tab, zoom:E.zoom };
    S.mode = mode; S.part = part;
    tabs.el.hidden = mode !== 'explore'; head.el.hidden = mode !== 'explore';
    pickEl.hidden = drill || S.tab !== 'shape';
    task.on = drill;
    if(!drill && drillSaved){
      var sv0 = drillSaved; drillSaved = null;
      E.letters = sv0.letters; E.allLp = sv0.allLp; E.zoom = sv0.zoom;
      byId('v3Labels').checked = E.letters; byId('v3Lp').checked = E.allLp;
      E.mol = prep(sv0.mol); E.sel = sv0.sel; E.rx = sv0.rx; E.ry = sv0.ry;
      setTab(sv0.tab, false); syncPicker();
      settle(); refNow();
    }
    if(drill){
      if(S.tab !== 'shape') setTab('shape', false);
      pickEl.hidden = true;
      task.score = task.score || { right:0, total:0 };
      nextTask();
    } else taskSay();
    if(spots) spots.hide(drill && !task.done);
    if(mode === 'explore') showCue();
  }

  root.hidden = true;
  mountQuiz();
  setTab((window.OchemToolState && window.OchemToolState.read().tab === 'hand') ? 'hand' : 'shape', false);
  Kit.kit2({
    stage: stage, ref: ref, onShow: onShow,
    parts: [
      { value:'predict', label:'Name the shape', dock: taskBox,
        task: { kicker:'Test yourself', title:'Name the shape', todo:'Turn the model, then name the shape of the ringed atom.' } }],
    check: { label:'Check yourself: 6 questions',
      task: { kicker:'Test yourself', title:'Check yourself', todo:'Six quick questions on shape and hybridization. The picture stays live, so use it.' } }
  });
  byId('v3RefHow').addEventListener('click', function(){ studio.close(); if(S.mode === 'explore') startTour(); });
  (function(){
    // opening "?" shows the zoom as it is; a run still going stops when "?" covers the whole stage on a phone
    var sheet = studio.root.querySelector('.ls-sheet');
    if(!sheet || !window.MutationObserver) return;
    var mo = new MutationObserver(function(){
      var open = studio.root.classList.contains('is-sheet') && !sheet.hidden;
      if(open){ syncZoomInput(); refNow(); if(L && L.phone) stopTweens(true); }
    });
    mo.observe(studio.root, { attributes: true, attributeFilter: ['class'] });
    mo.observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
  })();
  // a page that is hidden stops any run where it is (it lands on its end state)
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stopTweens(true); });

  /* ---------------------------------------------------- start: from the link, or ammonia */
  (function restore(){
    var q = window.OchemToolState ? window.OchemToolState.read() : {};
    if(q.mode && ['ball', 'space', 'wire'].indexOf(q.mode) >= 0){ E.style = q.mode; paintModes(); byId('v3Lp').disabled = E.style === 'space'; }
    var v = q.tab === 'hand' ? Hd : E;
    if(q.rx && isFinite(parseFloat(q.rx))) v.rx = clamp(parseFloat(q.rx), -1.45, 1.45);
    if(q.ry && isFinite(parseFloat(q.ry))) v.ry = parseFloat(q.ry);
    var started = false;
    if((q.st || q.build) && window.OchemBuilder){
      var box = byId('v3BuildBox'), api = openBuilder();
      if(api){
        if(box) box.open = true;
        var handed = q.st ? window.OchemBuilder.decode(q.st) : null;
        if(handed && api.load){ api.load(handed); started = true; }
        else if(q.build){ var t = byId('mbText'); if(t) t.value = q.build; api.build(q.build); started = true; }
      }
    }
    var keep = q.tab !== 'hand' && !!q.rx;
    if(!started && q.mol && LIB.get(q.mol)){ setMol(LIB.get(q.mol), { instant: true, keepView: keep }); started = true; }
    if(!started) setMol(E.mol, { instant: true, keepView: keep });
    if(q.tab === 'hand') setTab('hand', false);
  })();
  if(window.ResizeObserver) new ResizeObserver(function(){ L = null; layoutNow(); paint(); if(cueOn()) cue.place(); }).observe(sceneBox);
  else window.addEventListener('resize', function(){ L = null; layoutNow(); paint(); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ paint(); if(S.mode === 'explore' && !cueOn()) showCue(); });
  if(S.mode === 'explore') showCue();
  window.OchemViewer3DModel.view = { state: function(){ return { tab: S.tab, mode: S.mode, part: S.part, mol: E.mol.id, sel: E.sel, rx: E.rx, ry: E.ry, hand: { rx: Hd.rx, ry: Hd.ry }, read: handRead, ready: D.ready, style: E.style }; },
    pts: function(){ return S.tab === 'shape' ? lastPts.shape : lastPts.hand; }, select: function(i){ selectAtom(i, 'tap'); }, setMol: function(id){ setMol(LIB.get(id), { how:'pick' }); },
    turn: function(rx, ry){ var v = view(); v.rx = rx; v.ry = ry; paint(); }, tab: function(t){ setTab(t, true); },
    fit: function(){ return { L: L, R: E.mol._R, Ra: E.mol._Ra, F: L && fitIn(L.regA, E.mol, E.zoom) }; } };

  /* ====================================================================== */
  /* Check yourself (the page's quiz; same generator and record ids)         */
  /* ====================================================================== */
  function mountQuiz(){
  /* Every answer here is computed by M3.analyse() from the same coordinates the viewer draws, exactly as the
     on-screen readout is. Nothing is typed into a question bank, so a quiz answer and the molecule on screen cannot
     drift apart, and a molecule added to the library becomes a question without anyone writing one. */
  if(window.OchemToolQuiz){
    var SHAPE_POOL = [];
    Object.keys(M3.SHAPES).forEach(function(k){
      var m = M3.SHAPES[k].m;
      if(SHAPE_POOL.indexOf(m) < 0) SHAPE_POOL.push(m);
    });

    window.OchemToolQuiz.mount(document.getElementById('tool-quiz'), {
      slug: 'viewer-3d',
      rounds: 6,
      intro: 'Shape, steric number and hybridization, without the model in front of you.',
      make: function(recent){
        /* Only atoms the shape table actually classifies: a ring carbon in benzene is a fine thing to look at and a
           poor thing to be asked about out of context. */
        var pool = LIB.ALL.filter(function(m){
          var a = M3.analyse(m, m.focus === undefined ? 0 : m.focus);
          return a && a.shape;
        });
        if(!pool.length) return null;

        /* `recent` holds full question ids ("water:shape"), so a bare molecule id never matched and every draw was
           unfiltered. */
        function seenLately(m){
          return recent.some(function(r){ return r.indexOf(m.id + ':') === 0; });
        }
        var pick = null, tries = 0;
        do {
          pick = pool[Math.floor(Math.random() * pool.length)];
          tries++;
        } while(tries < 40 && seenLately(pick) && pool.length > recent.length);

        var idx = pick.focus === undefined ? 0 : pick.focus;
        var a = M3.analyse(pick, idx);
        var askHyb = Math.random() < 0.4;

        if(askHyb){
          var hybs = ['sp', 'sp²', 'sp³', 'sp³d', 'sp³d²'];
          return {
            id: pick.id + ':hyb',
            term: 'hybridization', topic: 'hybridization',
            options: hybs.map(function(h){ return { id:h, label:h, correct: h === a.shape.hyb }; }),
            prompt: 'What is the hybridization of the ' + esc(a.el) + ' in <b>' +
                    esc(pick.name) + '</b>?',
            explain: '<b>' + a.shape.hyb + '</b>. ' + a.bonds + ' bond' + (a.bonds === 1 ? '' : 's') +
                     ' plus ' + a.lonePairs + ' lone pair' + (a.lonePairs === 1 ? '' : 's') +
                     ' makes a steric number of ' + a.steric + ', and the hybridization follows from ' +
                     'the count of electron groups, not from how many of them happen to be bonds.'
          };
        }

        /* Distractors are other real shapes, with the electron geometry included when it differs from the
           molecular one: "tetrahedral" is the answer students give for ammonia, and it deserves to be on the list
           so that choosing it is a thing that can be corrected. */
        var wrong = SHAPE_POOL.filter(function(s){ return s !== a.shape.m; });
        for(var i = wrong.length - 1; i > 0; i--){
          var j = Math.floor(Math.random() * (i + 1));
          var t = wrong[i]; wrong[i] = wrong[j]; wrong[j] = t;
        }
        var opts = [{ id:a.shape.m, label:a.shape.m, correct:true }];
        wrong.slice(0, 3).forEach(function(s){ opts.push({ id:s, label:s, correct:false }); });

        return {
          id: pick.id + ':shape',
          term: 'vsepr-theory', topic: 'molecular-geometry',
          prompt: 'What is the <b>molecular shape</b> at the ' + esc(a.el) +
                  ' of <b>' + esc(pick.name) + '</b>' +
                  (pick.formula ? ' (<span class="tformula">' + esc(pick.formula) + '</span>)' : '') + '?',
          options: opts,
          explain: '<b>' + a.shape.m + '</b>. The electron geometry is ' + a.shape.e.toLowerCase() +
                   ', with ' + a.steric + ' groups around the ' + a.el + '. But ' +
                   (a.lonePairs
                     ? a.lonePairs + ' of them ' + (a.lonePairs === 1 ? 'is a lone pair, and lone pairs ' : 'are lone pairs, and lone pairs ') +
                       'are not part of the SHAPE even though they push on it. That is the whole of the difference between the two names.'
                     : 'with no lone pairs the two names are the same thing.')
        };
      }
    });
  }
  }
})();
