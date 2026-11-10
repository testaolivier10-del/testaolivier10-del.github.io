/* Borders lab page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApHugTools; the model is
   ApHugMath.bordersLab (human-geography/assets/tools/math/borders-lab.js), the
   content human-geography/data/tools/borders-lab.json (served filtered as
   assets/tool-data/borders-lab.json). The frame is ApHugTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore, five scenes, each drawn at the page's own pixel size:
     Boundary types  an invented borderland (Country A to the north, Country
                     B to the south) and a timeline: Play runs the years, so
                     towns appear and the border is drawn before or after
                     them, along a language divide, through one people's land,
                     as a straight line, or left behind as a relict
     State shapes    the five outlines, with each one's usual challenge
     Forces          Country A with the forces that pull it together (arrows
                     in) and apart (arrows out); tap scenes to add them
     Sea zones       a cross-section from the coast: move a ship out and read
                     what the coastal state may do there (UNCLOS)
     Real cases      four real boundaries, each on its region's base map
                     (ApHugMap, with the border note), dated and worded as
                     "often classed as"
   Test yourself: ApHugTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.bordersLab || M.bordersLab.stub) return;
  var B = M.bordersLab, esc = T.esc;
  function n1(v){ return Math.round(v * 10) / 10; }
  function phone(){ return (window.innerWidth || 1280) <= 640; }
  function tag(x, y, text, cls, W){
    var w = text.length * 7.6 + 14, h = 22, cx = Math.max(w / 2 + 3, Math.min((W || 9999) - w / 2 - 3, x));
    return '<g class="bl-tag ' + (cls || '') + '"><rect x="' + n1(cx - w / 2) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + h + '" rx="11"/><text x="' + n1(cx) + '" y="' + n1(y + 4.5) + '" text-anchor="middle">' + esc(text) + '</text></g>';
  }

  /* ----------------------------------------------------- the borderland */
  /* Design space 600 x 300: Country A north of the border, Country B south. */
  var TOWNS = [[60, 60], [150, 40], [250, 70], [350, 45], [450, 75], [540, 50], [100, 110], [200, 115], [300, 100], [410, 118], [520, 110],
    [70, 195], [170, 185], [270, 200], [380, 190], [480, 200], [560, 185], [120, 250], [230, 255], [330, 245], [440, 255], [540, 248]];
  function lineY(kind, x){
    if(kind === 'geometric') return 150;
    if(kind === 'consequent') return 150 + 30 * Math.sin(x / 55) + 12 * Math.sin(x / 19);
    if(kind === 'superimposed') return 150 + 4 * Math.sin(x / 90);
    return 150 + 16 * Math.sin(x / 70);   // the Tarn valley
  }
  // Language of each town: consequent follows the line; superimposed puts the Ardic people astride it.
  function lang(kind, i){
    var t = TOWNS[i];
    if(kind === 'consequent') return t[1] < lineY('consequent', t[0]) ? 'ar' : 'be';
    if(kind === 'superimposed') return t[0] > 180 && t[0] < 440 ? 'ar' : 'be';
    return '';
  }
  function founded(f, i){ return f.settled + (i * 13) % 50; }
  function drawn(f){ return f.drawn; }
  function landSvg(W, H, f, year, o){
    o = o || {};
    var th = o.timeline === false ? 0 : 74, k = Math.min((W - 16) / 600, (H - th - 16) / 300), ox = (W - 600 * k) / 2, oy = 8;
    var P = function(x, y){ return [n1(ox + x * k), n1(oy + y * k)]; }, out = [];
    var x0 = P(0, 0), x1 = P(600, 300);
    out.push('<rect class="bl-land" x="' + x0[0] + '" y="' + x0[1] + '" width="' + n1(x1[0] - x0[0]) + '" height="' + n1(x1[1] - x0[1]) + '" rx="10"/>');
    // The river or the hills, so the landscape is there before anyone draws a line.
    if(f.extra !== 'geometric' && f.extra !== 'consequent' && f.extra !== 'superimposed'){
      var rv = []; for(var x = 0; x <= 600; x += 10) rv.push(P(x, lineY('river', x) + 9).join(' '));
      out.push('<path class="bl-river" d="M' + rv.join('L') + '"/>');
    }
    if(f.extra === 'superimposed' && year >= f.settled){ var a = P(180, 20), b = P(440, 280); out.push('<rect class="bl-people" x="' + a[0] + '" y="' + a[1] + '" width="' + n1(b[0] - a[0]) + '" height="' + n1(b[1] - a[1]) + '" rx="18"/>'); }
    var joined = f.extra === 'relict' ? f.drawn + 50 : Infinity, isLine = year >= f.drawn;
    if(isLine){
      var pts = []; for(var x2 = 0; x2 <= 600; x2 += 6) pts.push(P(x2, lineY(f.extra, x2)).join(' '));
      out.push('<path class="bl-border' + (year >= joined ? ' is-relict' : '') + '" d="M' + pts.join('L') + '"/>');
      if(f.extra === 'relict' && year >= joined) [120, 300, 480].forEach(function(xx){ var q = P(xx, lineY('relict', xx)); out.push('<rect class="bl-post" x="' + n1(q[0] - 5) + '" y="' + n1(q[1] - 5) + '" width="10" height="10" rx="1.5"/>'); });
      if(f.extra === 'geometric'){ var gq = P(600, 150); out.push(tag(gq[0] - 28, gq[1] - 16, '41°N', 'is-line', W)); }
    }
    TOWNS.forEach(function(t, i){
      if(year < founded(f, i)) return;
      var q = P(t[0], t[1]), L = lang(f.extra, i);
      out.push('<circle class="bl-town' + (L ? ' is-' + L : '') + '" cx="' + q[0] + '" cy="' + q[1] + '" r="' + n1(Math.max(4, 6 * k)) + '"/>');
    });
    var na = P(10, 18), nb = P(10, 290), one = year >= joined;
    out.push('<text class="bl-cname" x="' + n1(na[0] + 8) + '" y="' + n1(na[1] + 8) + '">' + (one ? 'One country since ' + joined : 'Country A') + '</text>');
    if(!one) out.push('<text class="bl-cname" x="' + n1(nb[0] + 8) + '" y="' + n1(nb[1] - 4) + '">Country B</text>');
    if(th) out.push(timeline(W, H - th + 6, f, year, joined));
    return out.join('');
  }
  var Y0 = 1700, Y1 = 2000;
  function timeline(W, top, f, year, joined){
    var L = 24, R = W - 24, X = function(y){ return n1(L + (R - L) * (Math.max(Y0, Math.min(Y1, y)) - Y0) / (Y1 - Y0)); }, o = [], yA = top + 26;
    o.push('<line class="bl-axis" x1="' + L + '" y1="' + yA + '" x2="' + R + '" y2="' + yA + '"/>');
    o.push('<rect class="bl-span" x="' + X(f.settled) + '" y="' + (yA - 6) + '" width="' + n1(X(f.settled + 60) - X(f.settled)) + '" height="12" rx="6"/>');
    var ev = [{ y: f.settled, t: String(f.settled), c: 'is-town' }, { y: f.drawn, t: String(f.drawn), c: 'is-line' }];
    if(isFinite(joined)) ev.push({ y: joined, t: String(joined), c: 'is-join' });
    ev.sort(function(a, b){ return a.y - b.y; });
    var lastX = -99, row = 0;
    ev.forEach(function(e){
      var x = +X(e.y); row = x - lastX < 48 ? 1 - row : 0; lastX = x;
      o.push('<circle class="bl-ev ' + e.c + '" cx="' + x + '" cy="' + yA + '" r="6"/><text class="bl-yr" x="' + x + '" y="' + (row ? yA + 24 : yA - 12) + '" text-anchor="middle">' + e.t + '</text>');
    });
    if(year != null) o.push('<path class="bl-now" d="M' + X(year) + ' ' + (yA - 16) + 'V' + (yA + 10) + '"/>');
    return o.join('');
  }
  function landLegend(f){
    var it = ['<li><span class="bl-sw is-town" aria-hidden="true"></span>Towns settled (from ' + f.settled + ')</li>', '<li><span class="bl-sw is-line" aria-hidden="true"></span>Border drawn (' + f.drawn + ')</li>'];
    if(f.extra === 'relict') it.push('<li><span class="bl-sw is-join" aria-hidden="true"></span>Countries join (' + (f.drawn + 50) + ')</li><li><span class="bl-sw is-post" aria-hidden="true"></span>Old customs post</li>');
    if(f.extra === 'consequent' || f.extra === 'superimposed') it.push('<li><span class="bl-sw is-ar" aria-hidden="true"></span>Speaks Ardic</li><li><span class="bl-sw is-be" aria-hidden="true"></span>Speaks Bessan</li>');
    if(f.extra === 'superimposed') it.push('<li><span class="bl-sw is-people" aria-hidden="true"></span>Lands of the Ardic people</li>');
    if(f.extra !== 'geometric' && f.extra !== 'consequent' && f.extra !== 'superimposed') it.push('<li><span class="bl-sw is-river" aria-hidden="true"></span>Tarn River</li>');
    return '<ul class="bl-legend" aria-label="Legend">' + it.join('') + '</ul>';
  }

  /* --------------------------------------------------------- the shapes */
  function shapeSvg(W, H, id, o){
    o = o || {};
    var S = B.SHAPES[id], k = Math.min((W - 24) / 200, (H - 24) / 140), ox = (W - 200 * k) / 2, oy = (H - 140 * k) / 2;
    var tr = 'translate(' + n1(ox) + ' ' + n1(oy) + ') scale(' + n1(k * 100) / 100 + ')' + (o.flip ? ' translate(200 0) scale(-1 1)' : '') + (o.rot === 180 ? ' rotate(180 100 70)' : '');
    var out = '<g transform="' + tr + '">' + S.d.map(function(d, i){ return '<path class="bl-shape' + (S.hole && i === S.hole ? ' is-inner' : '') + '" d="' + d + '"/>'; }).join('') + '</g>';
    if(o.labels && id === 'prorupted') out += tag(n1(ox + (o.flip ? 200 - 150 : 150) * k), n1(oy + 56 * k) - 16, 'Proruption', 'is-line', W);
    if(o.labels && id === 'perforated') out += tag(n1(ox + 104 * k), n1(oy + 104 * k), 'State inside', 'is-line', W);
    return out;
  }

  /* --------------------------------------------------------- the forces */
  var CA = { north: [[60, 40], [250, 20], [300, 120], [180, 160], [70, 140]], northeast: [[250, 20], [470, 30], [520, 110], [400, 150], [300, 120]], east: [[520, 110], [560, 230], [430, 260], [400, 150]],
    capital: [[300, 120], [400, 150], [430, 260], [320, 270], [260, 200]], west: [[70, 140], [180, 160], [260, 200], [200, 290], [50, 260]], central: [[180, 160], [300, 120], [260, 200]],
    south: [[200, 290], [260, 200], [320, 270], [300, 370], [160, 360]], coast: [[320, 270], [430, 260], [560, 230], [540, 340], [300, 370]] };
  var CEN = { north: [172.8, 89.4], northeast: [385.2, 79.4], east: [478.7, 187.7], capital: [345.3, 200.5], west: [145.3, 216], central: [246.7, 160], south: [251.9, 302.4], coast: [431.7, 304.4] };
  var FSC = [
    { short: 'A national railway', where: ['north', 'east', 'west', 'south', 'coast', 'northeast'] },
    { short: 'One national history', where: ['north', 'northeast', 'east', 'west', 'south', 'coast'] },
    { short: 'A team from everywhere', where: ['north', 'east', 'west', 'coast'] },
    { short: 'Clinics for poor provinces', where: ['south', 'west'] },
    { short: 'A separatist movement', where: ['east'] },
    { short: 'Mountains cut off a region', where: ['west'] },
    { short: 'Investment in one region only', where: ['south'] },
    { short: 'A neighbor\'s claim', where: ['northeast'] },
    { short: 'Attacks on rail lines', where: ['coast'] }
  ];
  function forcesSvg(W, H, on){
    var k = Math.min((W - 20) / 510, (H - 20) / 350), ox = (W - 510 * k) / 2 - 50 * k, oy = (H - 350 * k) / 2 - 20 * k;
    var P = function(p){ return [n1(ox + p[0] * k), n1(oy + p[1] * k)]; }, out = [];
    Object.keys(CA).forEach(function(id){ var hit = on.some(function(i){ return B.SCENES[i].force === 'centrifugal' && FSC[i].where.indexOf(id) > -1; });
      out.push('<path class="bl-prov' + (hit ? ' is-hot' : '') + '" d="M' + CA[id].map(function(q){ return P(q).join(' '); }).join('L') + 'Z"/>'); });
    var cap = P(CEN.capital);
    on.forEach(function(i, n){
      var sc = B.SCENES[i];
      FSC[i].where.forEach(function(w){
        var c = P(CEN[w]), dx = c[0] - cap[0], dy = c[1] - cap[1], L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
        var off = (n % 3 - 1) * 7, px = -uy * off, py = ux * off, len = Math.min(46, L * 0.55);
        var a = sc.force === 'centripetal' ? [c[0] + px, c[1] + py] : [c[0] - ux * 6 + px, c[1] - uy * 6 + py];
        var b = sc.force === 'centripetal' ? [c[0] - ux * len + px, c[1] - uy * len + py] : [c[0] + ux * len + px, c[1] + uy * len + py];
        var ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 9;
        out.push('<g class="bl-f ' + (sc.force === 'centripetal' ? 'is-in' : 'is-out') + '"><path d="M' + n1(a[0]) + ' ' + n1(a[1]) + 'L' + n1(b[0]) + ' ' + n1(b[1]) + '"/><path class="bl-fh" d="M' + n1(b[0]) + ' ' + n1(b[1]) + 'L' + n1(b[0] - h * Math.cos(ang - 0.45)) + ' ' + n1(b[1] - h * Math.sin(ang - 0.45)) + 'L' + n1(b[0] - h * Math.cos(ang + 0.45)) + ' ' + n1(b[1] - h * Math.sin(ang + 0.45)) + 'Z"/></g>');
      });
    });
    out.push('<rect class="bl-capital" x="' + n1(cap[0] - 7) + '" y="' + n1(cap[1] - 7) + '" width="14" height="14" rx="2"/>');
    out.push(tag(cap[0], cap[1] + 22, 'Capital', 'is-line', W));
    return out.join('');
  }

  /* ------------------------------------------------------------ the sea */
  var STOPS = [[0, 0], [12, 0.2], [24, 0.36], [200, 0.82], [260, 1]];
  function seaX(nm, L, R){ for(var i = 1; i < STOPS.length; i++) if(nm <= STOPS[i][0]){ var a = STOPS[i - 1], b = STOPS[i]; return L + (R - L) * (a[1] + (b[1] - a[1]) * (nm - a[0]) / (b[0] - a[0])); } return R; }
  function seaSvg(W, H, nm, o){
    o = o || {};
    var land = Math.max(44, W * 0.12), L = land, R = W - 14, top = 34, bot = H - 52, out = [], narrow = W < 420;
    out.push('<rect class="bl-sea" x="' + n1(L) + '" y="' + top + '" width="' + n1(R - L) + '" height="' + (bot - top) + '"/>');
    out.push('<path class="bl-coast" d="M0 ' + (top - 8) + 'H' + n1(L - 6) + 'Q' + n1(L + 4) + ' ' + ((top + bot) / 2) + ' ' + n1(L - 6) + ' ' + (bot + 8) + 'H0Z"/>');
    var bounds = [0, 12, 24, 200, 260];
    for(var i = 0; i < 4; i++){
      var a = seaX(bounds[i], L, R), b = seaX(bounds[i + 1], L, R), on = !o.quiet && nm != null && B.zoneAt(nm) === B.ZONES[i];
      out.push('<rect class="bl-zone z' + (i + 1) + (on ? ' is-on' : '') + '" x="' + n1(a) + '" y="' + top + '" width="' + n1(b - a) + '" height="' + (bot - top) + '"/>');
      out.push('<g class="bl-znum"><circle cx="' + n1((a + b) / 2) + '" cy="' + (top + 22) + '" r="12"/><text x="' + n1((a + b) / 2) + '" y="' + (top + 27) + '" text-anchor="middle">' + (i + 1) + '</text></g>');
      if(i < 3) out.push('<path class="bl-lim" d="M' + n1(b) + ' ' + (top - 4) + 'V' + (bot + 6) + '"/><text class="bl-nm" x="' + n1(b) + '" y="' + (bot + 22) + '" text-anchor="middle">' + bounds[i + 1] + '</text>');
    }
    out.push('<text class="bl-nm" x="' + n1(L) + '" y="' + (bot + 22) + '" text-anchor="middle">0</text>');
    out.push('<text class="bl-cap2" x="' + n1(L) + '" y="' + (bot + 42) + '">' + (narrow ? 'Nautical miles (not to scale)' : 'Nautical miles from the baseline (not to scale)') + '</text>');
    out.push('<text class="bl-cap2" x="6" y="' + (top - 16) + '">Coast</text>');
    if(nm != null){
      var sx = seaX(nm, L, R), sy = (top + bot) / 2 + 14;
      out.push('<g class="bl-ship"><path d="M' + n1(sx - 15) + ' ' + n1(sy) + 'H' + n1(sx + 15) + 'L' + n1(sx + 9) + ' ' + n1(sy + 9) + 'H' + n1(sx - 10) + 'Z"/><rect x="' + n1(sx - 6) + '" y="' + n1(sy - 10) + '" width="11" height="10" rx="1"/></g>');
    }
    return out.join('');
  }
  function seaKey(nm){
    return '<ol class="bl-zkey">' + B.ZONES.map(function(z, i){ var on = nm != null && B.zoneAt(nm) === z; return '<li' + (on ? ' class="is-on"' : '') + '><b>' + (i + 1) + '. ' + esc(z.name) + '</b> (' + (i === 0 ? 'baseline to 12' : i === 1 ? '12 to 24' : i === 2 ? '12 to 200, overlapping the contiguous zone' : 'beyond 200') + ' nautical miles)</li>'; }).join('') + '</ol>';
  }

  /* ------------------------------------------------------- real cases */
  var BASES = {};
  /* The tool page loads hug-map.js (build-aphug.mjs toolShell). */
  function needMap(){ return Promise.resolve(window.ApHugMap); }
  function base(id){
    if(BASES[id]) return BASES[id];
    BASES[id] = needMap().then(function(){ return fetch((window.ApHugBase || '../') + 'figures/base/' + id + '.json'); }).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); });
    return BASES[id];
  }
  function realHtml(x, b){
    var Map = window.ApHugMap, spec = { base: x.base, render: 'reference', label: 'Map of the region with the boundary marked ' + x.mark + ': ' + x.name, marks: [{ at: x.at, text: x.mark }] };
    var src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Map.svg(spec, b));
    var over = Map.overlay(spec, b).filter(function(o){ return o.x != null; }).map(function(o){ return '<span class="hug-map-' + o.kind + (o.low ? ' is-low' : '') + '" style="left:' + o.x + '%;top:' + o.y + '%">' + esc(o.text) + '</span>'; }).join('');
    return '<figure class="hug-map bl-real"><div class="hug-map-pic"><img src="' + src + '" alt="' + esc(spec.label) + '" width="' + b.width + '" height="' + b.height + '"><div class="hug-map-over" aria-hidden="true">' + over + '</div></div><figcaption class="hug-small"><span class="hug-border-note">' + esc(Map.note(b)) + '</span> <span class="hug-base-src">Base map: Natural Earth.</span></figcaption></figure>';
  }

  /* ---------------------------------------------------------- the words */
  var PRESET = {
    antecedent: { first: 'line', extra: 'river', drawn: 1760, settled: 1820 },
    subsequent: { first: 'people', extra: 'river', drawn: 1880, settled: 1760 },
    consequent: { first: 'people', extra: 'consequent', drawn: 1890, settled: 1750 },
    superimposed: { first: 'people', extra: 'superimposed', drawn: 1885, settled: 1740 },
    geometric: { first: 'line', extra: 'geometric', drawn: 1790, settled: 1840 },
    relict: { first: 'line', extra: 'relict', drawn: 1780, settled: 1820 }
  };
  var BT_ORDER = ['antecedent', 'subsequent', 'consequent', 'superimposed', 'geometric', 'relict'];
  var BT_SAY = {
    antecedent: 'The border along the Tarn was drawn in 1760, before anyone settled; towns grew up on both sides from 1820.',
    subsequent: 'Towns spread across the valley from 1760; the border along the Tarn came later, in 1880.',
    consequent: 'The border of 1890 bends to follow where Ardic-speaking towns give way to Bessan-speaking ones. It is also subsequent: the people came first.',
    superimposed: 'In 1885 the empire of Corvia drew a line through the lands of the Ardic people, who now live on both sides of it. It is also subsequent.',
    geometric: 'A straight line along the 41st parallel, agreed in 1790, ignores hills and rivers. It is also antecedent: the towns came later.',
    relict: 'Drawn in 1780, the border stopped working when the two countries joined in 1830; old customs posts still stand along it.'
  };
  var SCENE_LABEL = [['types', 'Boundary types'], ['shapes', 'State shapes'], ['forces', 'Forces'], ['sea', 'Sea zones'], ['real', 'Real cases']];

  /* ---------------------------------------------------------- mount */
  T.mount('borders-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'borders-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
  function chips(cls, label, items){
    return '<div class="bl-row ' + cls + '" role="group" aria-label="' + esc(label) + '"><p class="bl-lbl" aria-hidden="true">' + esc(label) + '</p><div class="bl-chips">' + items.map(function(x){ return '<button type="button" class="tchip" data-k="' + x[0] + '" aria-pressed="false">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var scene = 'types', bt = 'antecedent', shape = 'elongated', on = [0, 4], nm = 8, real = 'A', year = 1950, timer = null, LS = null, nid = T.nid('bl'), touched = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem bl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Borders lab</h2>' +
      '<div class="bl-fig"><div class="bl-pic"><svg class="bl-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg><div class="bl-realbox" hidden></div></div><div class="bl-leg"></div></div>' +
      '<div class="bl-ctl">' + chips('bl-scene', 'Show', SCENE_LABEL) +
        '<div class="bl-grp bl-grp-types">' + chips('bl-bt', 'Boundary type', BT_ORDER.map(function(k){ return [k, B.BTYPES[k].name.replace(' boundary', '')]; })) + '<div class="bl-yearslot"></div><button type="button" class="btn-press sm bl-go">Play the years</button></div>' +
        '<div class="bl-grp bl-grp-shapes">' + chips('bl-sh', 'Shape', B.SHAPE_IDS.map(function(k){ return [k, B.SHAPES[k].name]; })) + '</div>' +
        '<div class="bl-grp bl-grp-forces">' + chips('bl-fo', 'Tap to add a force', FSC.map(function(x, i){ return [String(i), x.short]; })) + '</div>' +
        '<div class="bl-grp bl-grp-sea"><div class="bl-nmslot"></div></div>' +
        '<div class="bl-grp bl-grp-real">' + chips('bl-re', 'Real boundary', B.REAL.map(function(x){ return [x.mark, x.mark + ': ' + shortReal(x)]; })) + '</div>' +
      '</div><div class="bl-say"></div><div class="bl-more"></div><p class="sr-only bl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.bl-live'));
    var cue = T.cue('Pick a boundary type, then play the years: does the border come before the towns or after?');
    $('.bl-ctl').insertBefore(cue.el, $('.bl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sYear = T.slider({ label: 'Year', min: Y0, max: Y1, step: 10, value: year, onInput: function(v){ act(); stopT(); year = v; draw(); words(); } });
    $('.bl-yearslot').appendChild(sYear.el);
    var sNm = T.slider({ label: 'Ship\'s distance from the baseline', min: 0, max: 260, step: 2, value: nm, unit: 'nautical miles', onInput: function(v){ act(); nm = v; draw(); words(); say(B.zoneAt(nm).name); } });
    $('.bl-nmslot').appendChild(sNm.el);
    function stopT(){ if(timer){ clearInterval(timer); timer = null; } var b = $('.bl-go'); if(b) b.textContent = 'Play the years'; }
    $('.bl-go').addEventListener('click', function(){
      act();
      if(timer){ stopT(); return; }
      if(T.reduced()){ year = 1950; sYear.set(year); draw(); words(); return; }
      if(year >= 1950) year = Y0;
      $('.bl-go').textContent = 'Pause';
      timer = setInterval(function(){ year += 5; if(year >= 1950){ year = 1950; stopT(); } sYear.set(year); draw(); if(year % 50 === 0 || !timer) words(); }, 70);
    });
    function onClick(e){
      var b = e.target.closest('.bl-row button'); if(!b || !(LS ? LS.root : host).contains(b)) return;
      var row = b.closest('.bl-row'), k = b.getAttribute('data-k');
      act();
      if(row.classList.contains('bl-scene')){ scene = k; stopT(); }
      else if(row.classList.contains('bl-bt')){ bt = k; stopT(); year = 1950; sYear.set(year); }
      else if(row.classList.contains('bl-sh')) shape = k;
      else if(row.classList.contains('bl-fo')){ var i = +k, at = on.indexOf(i); if(at > -1) on.splice(at, 1); else on.push(i); }
      else if(row.classList.contains('bl-re')) real = k;
      sync(); draw(); words(); say(T.sayHead($('.bl-say')).replace(/<[^>]+>/g, ''));
    }
    host.addEventListener('click', onClick);
    function sync(){
      var root = LS ? LS.root : host;
      var single = { 'bl-scene': scene, 'bl-bt': bt, 'bl-sh': shape, 'bl-re': real };
      Object.keys(single).forEach(function(cls){ root.querySelectorAll('.' + cls + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === single[cls])); }); });
      root.querySelectorAll('.bl-fo button').forEach(function(b){ b.setAttribute('aria-pressed', String(on.indexOf(+b.getAttribute('data-k')) > -1)); });
      ['types', 'shapes', 'forces', 'sea', 'real'].forEach(function(k){ var el = $('.bl-grp-' + k); if(el) el.hidden = k !== scene; });
    }
    function size(){ var f = $('.bl-pic'), r = f ? f.getBoundingClientRect() : { width: 600, height: 420 }; return { W: Math.max(300, Math.round(r.width) || 600), H: Math.max(240, Math.round(r.height) || 420) }; }
    var realTok = 0;
    function draw(){
      var z = size(), svg = $('.bl-svg'), box = $('.bl-realbox'), html = '', label = '', leg = '';
      svg.style.display = scene === 'real' ? 'none' : ''; box.hidden = scene !== 'real';
      if(scene === 'types'){
        var f = PRESET[bt];
        html = landSvg(z.W, z.H, f, year);
        label = 'An invented borderland in ' + year + ': ' + BT_SAY[bt];
        leg = landLegend(f);
      } else if(scene === 'shapes'){
        html = shapeSvg(z.W, z.H, shape, { labels: true });
        label = 'Outline of an invented ' + B.SHAPES[shape].name.toLowerCase() + ' state.';
        leg = '<p class="bt-small">State shapes are an older classification; the current course framework does not list them, but many classes still use them.</p>';
      } else if(scene === 'forces'){
        html = forcesSvg(z.W, z.H, on);
        var a = on.filter(function(i){ return B.SCENES[i].force === 'centripetal'; }).length;
        label = 'Map of Country A with ' + a + ' forces pulling it together and ' + (on.length - a) + ' pulling it apart.';
        leg = '<ul class="bl-legend" aria-label="Legend"><li><span class="bl-sw is-in" aria-hidden="true"></span>Centripetal: pulls the state together</li><li><span class="bl-sw is-out" aria-hidden="true"></span>Centrifugal: pulls it apart</li><li><span class="bl-sw is-hot" aria-hidden="true"></span>A region pulled away</li></ul>';
      } else if(scene === 'sea'){
        html = seaSvg(z.W, Math.min(z.H, 360), nm);
        label = 'Cross-section of the sea from a coast, with a ship ' + nm + ' nautical miles out, in the ' + B.zoneAt(nm).name.toLowerCase() + '.';
        leg = seaKey(nm);
      } else {
        var x = B.REAL.filter(function(r){ return r.mark === real; })[0], tok = ++realTok;
        box.innerHTML = '<p class="bt-small">Loading the map…</p>';
        base(x.base).then(function(b){ if(tok !== realTok) return; box.innerHTML = realHtml(x, b); }).catch(function(){ box.innerHTML = '<p class="bt-small">The map could not load. The case is described under the map.</p>'; });
        leg = '';
      }
      if(scene !== 'real'){ var hh = scene === 'sea' ? Math.min(z.H, 360) : z.H; svg.setAttribute('viewBox', '0 0 ' + z.W + ' ' + hh); svg.innerHTML = html; svg.setAttribute('aria-label', label); }
      $('.bl-leg').innerHTML = leg;
    }
    function shortReal(x){ return { A: 'the 49th parallel', B: 'East and West Germany', C: 'the Sahara', D: 'Punjab' }[x.mark]; }
    function words(){
      var head, sub, why, pills = [];
      if(scene === 'types'){
        var f = PRESET[bt], Bt = B.BTYPES[bt];
        head = Bt.name + '.'; sub = BT_SAY[bt];
        pills = [{ k: 'Year', html: String(year), tone: 'readout' }];
        why = '<p>' + esc(Bt.def) + '</p><p><b>When it was drawn:</b> every border is antecedent (drawn before most people settled) or subsequent (drawn after). <b>How it was drawn:</b> it may also be consequent (along a cultural divide), superimposed (forced by an outside power), geometric (a straight line) or relict (no longer working, but traces remain). So one boundary can fit more than one type.</p>';
        void f;
      } else if(scene === 'shapes'){
        var S = B.SHAPES[shape]; head = S.name + '.'; sub = S.def;
        why = '<p><b>Its usual challenge:</b> ' + esc(S.challenge) + '</p><p>' + esc(S.real) + '</p><p>Shape is only one influence. Roads, technology and a shared identity often matter more than outline.</p>';
      } else if(scene === 'forces'){
        var cp = on.filter(function(i){ return B.SCENES[i].force === 'centripetal'; }).length, cf = on.length - cp;
        head = on.length ? cp + ' pulling together, ' + cf + ' pulling apart.' : 'Tap a scene to add its force.';
        sub = on.length ? B.SCENES[on[on.length - 1]].t : '';
        pills = [{ k: 'Together', html: String(cp), tone: 'good' }, { k: 'Apart', html: String(cf), tone: cf > cp ? 'warn' : 'readout' }];
        why = '<p><b>Centripetal forces</b> unify a state: shared institutions, infrastructure that reaches every region, a national identity. They can lead to stronger cultural cohesion, fairer infrastructure and, at times, ethnonationalism. <b>Centrifugal forces</b> divide it; they can lead to uneven development, ethnic nationalist movements and, at worst, a failed state.</p><p><b>Devolution factors</b> (moving power from the center to regions, or breakup): ' + B.FIDS.concat(['cleansing']).map(function(k){ return '<b>' + esc(B.FACTORS[k].name.toLowerCase()) + '</b> (' + esc(B.FACTORS[k].def.charAt(0).toLowerCase() + B.FACTORS[k].def.slice(1, -1)) + ')'; }).join('; ') + '.</p><p>The same trait can do both: a shared religion can unite a country while dividing one region where most people hold another.</p>';
      } else if(scene === 'sea'){
        var Z = B.zoneAt(nm); head = Z.name + '.'; sub = Z.rights;
        pills = [{ k: 'Ship', html: nm + ' nmi', tone: 'readout' }];
        why = '<p>The UN Convention on the Law of the Sea (UNCLOS, 1982) measures every zone from a coast\'s baseline. One nautical mile is about 1.85 km. Where two coasts are less than 400 nautical miles apart, their exclusive economic zones overlap and the states must agree on a line, often one halfway between.</p>';
      } else {
        var x = B.REAL.filter(function(r){ return r.mark === real; })[0];
        head = x.name + '.'; sub = x.text;
        why = '<p>Real borders rarely fit one type. Each case gives its dates and says how it is often classed, so the type rests on its history. Disputed places are left out of these cases: no answer here depends on a dispute.</p>';
      }
      T.explain($('.bl-say'), '<b>' + esc(head) + '</b> ' + esc(sub), why);
      more();
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(sub), 'explore'); LS.pills(pills, 'left', 'explore'); }
    }
    function more(){
      var el = $('.bl-more'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">Boundary types</h3>' + T.dataTable(['Type', 'What it means'], BT_ORDER.map(function(k){ return [B.BTYPES[k].name, B.BTYPES[k].def]; }), 'Boundary types (CED 4.4)') +
        '<h3 class="ls-title-l">Zones of the sea (UNCLOS, 1982)</h3>' + T.dataTable(['Zone', 'From the baseline', 'What the coastal state may do'], B.ZONES.map(function(z, i){ return [z.name, i === 0 ? 'to 12 nautical miles' : i === 1 ? '12 to 24' : i === 2 ? '12 to 200 (overlaps the contiguous zone)' : 'beyond 200', z.rights]; }), 'Law of the sea zones') +
        '<h3 class="ls-title-l">Real cases</h3>' + T.dataTable(['', 'Boundary', 'Its history'], B.REAL.map(function(x){ return [x.mark, x.name, x.text]; }), 'Four real boundaries') +
        '<p class="bt-small">The borderland, Country A, Country B, the empire of Corvia and the Ardic and Bessan languages are invented for practice.</p>';
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.bl-fig')], dock: [$('.bl-ctl')], why: [$('.bl-say')], details: [$('.bl-more')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      sync(); draw(); words();
      if(s.mode() === 'explore') T.hintSlot(s, $('.bl-go'), 'Start here: play the years', { cls: 'bl-tipslot' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.bl-pic')); }
    }
    sync(); draw(); words();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { boundary: 'Boundary types', shape: 'State shapes', forces: 'Forces and devolution', sea: 'Zones of the sea' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'borders-lab', noun: 'drill',
      generate: function(r, ctx, type){ return B.generate(r, ctx, type); },
      types: [{ value: 'boundary', label: 'Boundary types' }, { value: 'shape', label: 'State shapes' }, { value: 'forces', label: 'Forces and devolution' }, { value: 'sea', label: 'Zones of the sea' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p){ figure(el, p); }
    });
  }
  function figure(el, p){
    var g = p.figure; if(!g || g.kind === 'forces'){ el.innerHTML = ''; return; }
    var W = phone() ? 360 : 600, H, inner, label, leg = '';
    if(g.kind === 'boundary'){
      var f = { first: g.facts.first, extra: g.facts.extra === 'consequent' || g.facts.extra === 'superimposed' || g.facts.extra === 'geometric' || g.facts.extra === 'relict' ? g.facts.extra : 'river', drawn: g.facts.drawn, settled: g.facts.settled };
      H = phone() ? 270 : 400; inner = landSvg(W, H, f, 2000); label = 'The invented borderland in 2000, with a timeline of when the towns were settled and the border was drawn.'; leg = landLegend(f);
    } else if(g.kind === 'shape'){
      H = phone() ? 240 : 320; inner = shapeSvg(W, H, g.shape, { flip: g.flip, rot: g.rot }); label = 'The outline of an invented state.';
    } else {
      H = phone() ? 210 : 300; inner = seaSvg(W, H, g.nm, { quiet: true }); label = 'Cross-section of the sea from Country A\'s coast, with four numbered zones and a ship ' + g.nm + ' nautical miles out.';
      leg = phone() ? '' : '<p class="bt-small">The zones are numbered from the coast outward; their names are what the first step asks.</p>';
    }
    el.innerHTML = '<figure class="cd-fig bl-qfig"><svg class="bl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + inner + '</svg>' + leg + '</figure>';
  }
})();
