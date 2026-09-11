/* Conformation Lab — turn the bond, watch the energy.

   Two halves of the same idea, because they are the two places a course asks
   you to reason about strain and both are taught as static pictures.

   NEWMAN. The energy curve is not sampled from a formula pretending to be
   quantum mechanics. Each molecule declares its energy at the six positions
   every textbook prints — the three eclipsed maxima and the three staggered
   minima — and the curve between them is a cosine interpolation, which has
   zero slope at each node and therefore puts the extrema exactly where the
   chemistry says they are. The numbers are the standard ones; what the tool
   adds is that they move while you turn the bond, so "gauche costs 0.9" stops
   being a table entry.

   CHAIR. Built in 3D from the same engine as the viewer, so axial and
   equatorial are not labels someone typed — they are computed from which of
   the carbon's two remaining tetrahedral directions is more parallel to the
   ring axis. Flipping the chair inverts the pucker and every assignment
   follows from the geometry, which is why the classic results (trans-1,2
   diequatorial, cis-1,3 diequatorial) fall out rather than being asserted. */
(function(){
  var M3 = window.OchemMol3D;
  var root = document.getElementById('cfRoot');
  if(!M3 || !root) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  var RT = 0.5925;    // kcal/mol at 298 K — turns an energy gap into a ratio

  /* ====================================================================== */
  /* NEWMAN                                                                  */
  /* ====================================================================== */

  /* energies[] are kcal/mol at 0°, 60°, 120°, 180°, 240°, 300°. front/back
     are the three substituents on each carbon, listed from the 12 o'clock
     position going clockwise. */
  var TORSIONALS = [
    {
      id:'ethane', name:'Ethane', formula:'C₂H₆',
      front:['H','H','H'], back:['H','H','H'],
      energies:[3.0, 0, 3.0, 0, 3.0, 0],
      note:'Three H/H eclipsing interactions at a time, about 1 kcal/mol each. There is no steric story here at all — the hydrogens are nowhere near touching. The barrier is torsional: filled C–H bonds repelling filled C–H bonds.'
    },
    {
      id:'propane', name:'Propane', formula:'C₃H₈',
      front:['CH₃','H','H'], back:['H','H','H'],
      energies:[3.4, 0, 3.4, 0, 3.4, 0],
      note:'One H/CH₃ eclipse (about 1.4) plus two H/H (about 1 each). Slightly worse than ethane, and still only one kind of staggered conformer.'
    },
    {
      id:'butane', name:'Butane', formula:'C₄H₁₀',
      front:['CH₃','H','H'], back:['CH₃','H','H'],
      energies:[4.6, 0.9, 3.6, 0, 3.6, 0.9],
      note:'The one worth knowing. Two different staggered conformers — anti at 180° and gauche at 60° and 300° — and two different eclipsed ones. Gauche is a real minimum, just not the best one.'
    },
    {
      id:'dichloroethane', name:'1,2-dichloroethane', formula:'C₂H₄Cl₂',
      front:['Cl','H','H'], back:['Cl','H','H'],
      energies:[5.0, 1.1, 4.0, 0, 4.0, 1.1],
      note:'The same shape of curve as butane with bigger groups. In the gas phase anti wins comfortably; in a polar solvent the gauche form, which has a dipole, closes much of the gap.'
    }
  ];

  var tor = TORSIONALS[0];
  var theta = 60;

  /* Cosine interpolation between the six declared points. Flat at each node,
     so every maximum and minimum lands exactly on a multiple of 60°. */
  function energyAt(t){
    var x = ((t % 360) + 360) % 360;
    var i = Math.floor(x / 60);
    var f = (x - i * 60) / 60;
    var e0 = tor.energies[i], e1 = tor.energies[(i + 1) % 6];
    return e0 + (e1 - e0) * (1 - Math.cos(Math.PI * f)) / 2;
  }

  /* What this conformation is called, and why it costs what it costs. A name
     depends on the substituents, not only the angle: 60° is "gauche" when two
     real groups are 60° apart and merely "staggered" when they are hydrogens. */
  function describeTorsion(t){
    var x = ((t % 360) + 360) % 360;
    var nearest = Math.round(x / 60) * 60 % 360;
    // Circular distance to that node — 358° is two degrees from 0°, not 358.
    var gap = Math.abs(x - nearest);
    var atNode = Math.min(gap, 360 - gap) < 4;
    var eclipsed = nearest % 120 === 0;
    var bigFront = tor.front[0] !== 'H', bigBack = tor.back[0] !== 'H';
    var bothBig = bigFront && bigBack;

    if(!atNode){
      return {
        name: 'On the way',
        detail: 'Between conformations — the molecule spends very little time here, because it is on the side of a hill rather than at the bottom of a valley or the top of a pass.'
      };
    }
    if(nearest === 0){
      return {
        name: eclipsed ? (bothBig ? 'Syn-periplanar (totally eclipsed)' : 'Eclipsed') : 'Eclipsed',
        detail: bothBig
          ? 'The worst one. The two ' + tor.front[0] + ' groups are eclipsing each other directly, so you are paying a torsional cost and a steric cost at the same time. This is the highest point on the curve.'
          : 'Every front bond is lined up with a back bond. Filled orbital against filled orbital, three times over.'
      };
    }
    if(nearest === 180){
      return {
        name: bothBig ? 'Anti (anti-periplanar)' : 'Staggered',
        detail: bothBig
          ? 'The two ' + tor.front[0] + ' groups are as far apart as the bond allows, 180° across. This is the global minimum and where most molecules are at any instant.'
          : 'Staggered: every front bond bisects a back pair. Nothing is eclipsing anything, and for a symmetric molecule all three staggered forms are identical.'
      };
    }
    if(eclipsed){
      return {
        name: 'Eclipsed',
        detail: bothBig
          ? 'A ' + tor.front[0] + ' group eclipsing a hydrogen, twice, plus one H/H. Bad, but about a kcal better than having the two big groups eclipse each other.'
          : 'Bonds lined up front to back. A maximum, but not the highest one.'
      };
    }
    return {
      name: bothBig ? 'Gauche' : 'Staggered',
      detail: bothBig
        ? 'Staggered, so nothing is eclipsed — but the two ' + tor.front[0] + ' groups are only 60° apart and their electron clouds are close enough to push. That steric cost, about 0.9 kcal/mol, is what separates gauche from anti.'
        : 'Staggered and unstrained.'
    };
  }

  // Screen direction for a Newman angle, 90° being straight up.
  function dirAt(deg, r){
    var a = deg * Math.PI / 180;
    return { x: 150 + r * Math.cos(a), y: 150 - r * Math.sin(a) };
  }

  function newmanSvg(){
    var R = 58, OUT = 30;
    var frontAngles = [90, 210, 330];
    var out = '';

    // Back bonds first, so the front carbon's hub sits on top of them.
    var backParts = tor.back.map(function(label, i){
      var a = frontAngles[i] + theta;
      var edge = dirAt(a, R), tip = dirAt(a, R + OUT), lab = dirAt(a, R + OUT + 16);
      return '<line x1="' + edge.x.toFixed(1) + '" y1="' + edge.y.toFixed(1) + '" x2="' + tip.x.toFixed(1) + '" y2="' + tip.y.toFixed(1) +
             '" stroke="var(--muted)" stroke-width="3.4" stroke-linecap="round"/>' +
             '<text class="nm-lab nm-lab--back" x="' + lab.x.toFixed(1) + '" y="' + (lab.y + 5).toFixed(1) + '" text-anchor="middle">' + esc(label) + '</text>';
    }).join('');

    var frontParts = tor.front.map(function(label, i){
      var a = frontAngles[i];
      var tip = dirAt(a, R), lab = dirAt(a, R + 17);
      return '<line x1="150" y1="150" x2="' + tip.x.toFixed(1) + '" y2="' + tip.y.toFixed(1) +
             '" stroke="var(--ink)" stroke-width="4.2" stroke-linecap="round"/>' +
             '<text class="nm-lab nm-lab--front" x="' + lab.x.toFixed(1) + '" y="' + (lab.y + 5).toFixed(1) + '" text-anchor="middle">' + esc(label) + '</text>';
    }).join('');

    /* The dihedral itself, drawn as an arc between the two front-most
       substituents — the angle the slider controls, shown as an angle. */
    var a1 = dirAt(90, 34), a2 = dirAt(90 + theta, 34);
    var sweep = theta > 180 ? 1 : 0;
    var arc = '<path d="M ' + a1.x.toFixed(1) + ' ' + a1.y.toFixed(1) +
      ' A 34 34 0 ' + sweep + ' 0 ' + a2.x.toFixed(1) + ' ' + a2.y.toFixed(1) + '" ' +
      'fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-dasharray="4 3"/>';

    out += backParts;
    out += '<circle cx="150" cy="150" r="' + R + '" fill="var(--paper)" stroke="var(--muted)" stroke-width="3"/>';
    out += arc;
    out += frontParts;
    out += '<circle cx="150" cy="150" r="7" fill="var(--ink)"/>';
    return out;
  }

  function curveSvg(){
    var W = 360, H = 132, padL = 34, padB = 26, padT = 12;
    var maxE = Math.max.apply(null, tor.energies) * 1.15 || 1;
    function px(t){ return padL + (t / 360) * (W - padL - 8); }
    function py(e){ return H - padB - (e / maxE) * (H - padB - padT); }

    var d = '';
    for(var t = 0; t <= 360; t += 3){
      d += (t === 0 ? 'M ' : ' L ') + px(t).toFixed(1) + ' ' + py(energyAt(t)).toFixed(1);
    }

    var grid = [0, 60, 120, 180, 240, 300, 360].map(function(t){
      return '<line x1="' + px(t).toFixed(1) + '" y1="' + padT + '" x2="' + px(t).toFixed(1) + '" y2="' + (H - padB) + '" ' +
             'stroke="var(--line-soft)" stroke-width="1"/>' +
             '<text class="cf-axis" x="' + px(t).toFixed(1) + '" y="' + (H - padB + 15) + '" text-anchor="middle">' + t + '°</text>';
    }).join('');

    var here = '<line x1="' + px(theta).toFixed(1) + '" y1="' + padT + '" x2="' + px(theta).toFixed(1) + '" y2="' + (H - padB) + '" ' +
      'stroke="var(--accent)" stroke-width="2"/>' +
      '<circle cx="' + px(theta).toFixed(1) + '" cy="' + py(energyAt(theta)).toFixed(1) + '" r="5" fill="var(--accent)"/>';

    return grid +
      '<line x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - 8) + '" y2="' + (H - padB) + '" stroke="var(--line)" stroke-width="1.5"/>' +
      '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (H - padB) + '" stroke="var(--line)" stroke-width="1.5"/>' +
      '<text class="cf-axis" x="6" y="' + (padT + 8) + '">' + maxE.toFixed(1) + '</text>' +
      '<text class="cf-axis" x="6" y="' + (H - padB) + '">0</text>' +
      '<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round"/>' +
      here;
  }

  function renderNewman(){
    var d = describeTorsion(theta);
    var e = energyAt(theta);
    var min = Math.min.apply(null, tor.energies);

    document.getElementById('cfNewmanStage').innerHTML =
      '<svg viewBox="0 0 300 300" role="img" aria-label="Newman projection">' + newmanSvg() + '</svg>';
    document.getElementById('cfCurve').innerHTML =
      '<svg viewBox="0 0 360 132" role="img" aria-label="Energy against dihedral angle">' + curveSvg() + '</svg>';
    document.getElementById('cfAngleOut').textContent = Math.round(theta) + '°';

    document.getElementById('cfReadout').innerHTML =
      '<div class="tstat">' +
        '<div><div class="k">Dihedral</div><div class="v">' + Math.round(theta) + '°</div></div>' +
        '<div><div class="k">Relative energy</div><div class="v">' + e.toFixed(1) + ' <small>kcal/mol</small></div></div>' +
        '<div><div class="k">Above the minimum</div><div class="v">' + (e - min).toFixed(1) + ' <small>kcal/mol</small></div></div>' +
      '</div>' +
      '<div class="tnote ' + (e - min < 0.05 ? 'tnote--good' : (e - min > 2 ? 'tnote--bad' : 'tnote--warn')) + '">' +
        '<span class="tnote__k">' + esc(d.name) + '</span>' + esc(d.detail) +
      '</div>' +
      '<p class="tmuted" style="margin:0;">' + esc(tor.note) + '</p>';
  }

  /* ====================================================================== */
  /* CHAIR                                                                   */
  /* ====================================================================== */

  /* A-values: how much it costs, in kcal/mol, to put this group axial rather
     than equatorial on a cyclohexane. The standard table. */
  var SUBS = {
    H:     { label:'H',    a:0,    r:0.30, color:'#E4DFD4', ink:'#2A2A28' },
    Me:    { label:'CH₃',  a:1.70, r:0.52, color:'#4A5A54', ink:'#FFFFFF' },
    Et:    { label:'Et',   a:1.75, r:0.58, color:'#4A5A54', ink:'#FFFFFF' },
    iPr:   { label:'iPr',  a:2.15, r:0.64, color:'#3F4C47', ink:'#FFFFFF' },
    tBu:   { label:'tBu',  a:4.90, r:0.76, color:'#333E3A', ink:'#FFFFFF' },
    Ph:    { label:'Ph',   a:2.80, r:0.70, color:'#3B4F49', ink:'#FFFFFF' },
    OH:    { label:'OH',   a:0.87, r:0.46, color:'#D1594A', ink:'#FFFFFF' },
    OMe:   { label:'OMe',  a:0.75, r:0.54, color:'#D1594A', ink:'#FFFFFF' },
    F:     { label:'F',    a:0.15, r:0.40, color:'#5FA85A', ink:'#FFFFFF' },
    Cl:    { label:'Cl',   a:0.43, r:0.50, color:'#5FA85A', ink:'#FFFFFF' },
    Br:    { label:'Br',   a:0.38, r:0.56, color:'#A0522D', ink:'#FFFFFF' }
  };

  var PRESETS = [
    { id:'methyl',      label:'Methylcyclohexane',   subs:[['Me','up'],null,null,null,null,null] },
    { id:'tbu',         label:'tert-Butylcyclohexane', subs:[['tBu','up'],null,null,null,null,null] },
    { id:'cis12',       label:'cis-1,2-dimethyl',    subs:[['Me','up'],['Me','up'],null,null,null,null] },
    { id:'trans12',     label:'trans-1,2-dimethyl',  subs:[['Me','up'],['Me','down'],null,null,null,null] },
    { id:'cis13',       label:'cis-1,3-dimethyl',    subs:[['Me','up'],null,['Me','up'],null,null,null] },
    { id:'trans13',     label:'trans-1,3-dimethyl',  subs:[['Me','up'],null,['Me','down'],null,null,null] },
    { id:'cis14',       label:'cis-1,4-dimethyl',    subs:[['Me','up'],null,null,['Me','up'],null,null] },
    { id:'trans14',     label:'trans-1,4-dimethyl',  subs:[['Me','up'],null,null,['Me','down'],null,null] }
  ];

  // Position i carries [key, 'up'|'down'], or null for two hydrogens.
  var ring = [null, null, null, null, null, null];
  var flipped = false;
  /* Tilted almost edge-on by default. Viewed down the ring axis a chair is
     just a hexagon — the pucker that the whole tool is about is the one thing
     that projection hides. */
  var crx = -1.18, cry = 0.42;

  /* Build one chair. `flip` inverts the pucker, which is exactly what a ring
     flip does — and every axial/equatorial assignment is then re-derived from
     the new geometry rather than swapped by hand. */
  function buildChair(flip){
    var pts = M3.ringPoints(6, 1.46, flip ? -0.25 : 0.25);
    var atoms = pts.map(function(p){ return { el:'C', pos:p, lp:0, label:'C' }; });
    var bonds = [0,1,2,3,4,5].map(function(i){ return { a:i, b:(i+1)%6, order:1 }; });
    var slots = [];

    for(var i=0;i<6;i++){
      var existing = [pts[(i+5)%6], pts[(i+1)%6]].map(function(n){ return M3.sub(n, pts[i]); });
      var dirs = M3.completeTetrahedral(existing, 2);
      /* Axial is whichever of the two remaining directions is more parallel
         to the ring axis. Nothing is labelled by position or parity — the
         geometry decides, so a flipped chair reassigns itself. */
      var axialIdx = Math.abs(dirs[0].z) > Math.abs(dirs[1].z) ? 0 : 1;
      var axial = dirs[axialIdx], equat = dirs[1 - axialIdx];
      var axialPointsUp = axial.z > 0;

      // Exactly one of the two positions is on the top face of the ring.
      slots.push({ carbon:i, axial:axial, equatorial:equat, axialPointsUp:axialPointsUp });

      var entry = ring[i];
      ['up','down'].forEach(function(face){
        var isAxial = (slots[i].axialPointsUp === (face === 'up'));
        var dir = isAxial ? axial : equat;
        var key = (entry && entry[1] === face) ? entry[0] : 'H';
        var sub = SUBS[key];
        var dist = key === 'H' ? 1.09 : 1.53;
        atoms.push({
          el: 'C', label: sub.label, lp:0,
          pos: M3.add(pts[i], M3.mul(dir, dist)),
          style: { color:sub.color, r:sub.r, ink:sub.ink },
          subKey: key, isAxial: isAxial, carbon: i, face: face
        });
        bonds.push({ a:i, b:atoms.length - 1, order:1 });
      });
    }

    return { name:'Cyclohexane', formula:'C₆H₁₂', atoms:atoms, bonds:bonds, slots:slots, focus:0 };
  }

  /* What this chair costs: every non-hydrogen sitting axial pays its A-value,
     plus a surcharge for two axial groups 1,3 to each other — they point the
     same way on the same face and genuinely collide, which a plain sum of
     A-values does not capture. */
  function chairEnergy(chair){
    var axialSubs = chair.atoms.filter(function(a){
      return a.subKey && a.subKey !== 'H' && a.isAxial;
    });
    var total = 0, terms = [];

    axialSubs.forEach(function(a){
      var s = SUBS[a.subKey];
      total += s.a;
      terms.push({ text: s.label + ' axial at C' + (a.carbon + 1), kcal: s.a });
    });

    for(var i=0;i<axialSubs.length;i++){
      for(var j=i+1;j<axialSubs.length;j++){
        var d = Math.abs(axialSubs[i].carbon - axialSubs[j].carbon);
        if(d === 2 || d === 4){
          total += 1.6;
          terms.push({
            text: 'Extra 1,3-diaxial crowding between ' + SUBS[axialSubs[i].subKey].label +
                  ' and ' + SUBS[axialSubs[j].subKey].label,
            kcal: 1.6
          });
        }
      }
    }

    return { total: total, terms: terms, axial: axialSubs };
  }

  function renderChair(){
    var here = buildChair(flipped);
    var other = buildChair(!flipped);
    var eHere = chairEnergy(here), eOther = chairEnergy(other);

    var fit = 52;
    document.getElementById('cfChairStage').innerHTML =
      '<svg viewBox="0 0 320 280" role="img" aria-label="Cyclohexane chair">' +
      M3.render(here, { cx:160, cy:140, scale:fit, dist:11, rx:crx, ry:cry, labels:true, lonePairs:false }) +
      '</svg>';

    // Which chair wins, and by how much.
    var lower = Math.min(eHere.total, eOther.total);
    var gap = Math.abs(eHere.total - eOther.total);
    var K = Math.exp(gap / RT);
    var pct = K / (1 + K) * 100;

    var html = '<div class="tstat">' +
      '<div><div class="k">This chair</div><div class="v">' + eHere.total.toFixed(2) + ' <small>kcal/mol</small></div></div>' +
      '<div><div class="k">The other chair</div><div class="v">' + eOther.total.toFixed(2) + ' <small>kcal/mol</small></div></div>' +
      '<div><div class="k">At equilibrium</div><div class="v">' + (gap < 0.005 ? '50 : 50' : pct.toFixed(gap > 2 ? 2 : 1) + '%') +
        ' <small>' + (gap < 0.005 ? '' : 'favoured') + '</small></div></div>' +
    '</div>';

    if(eHere.terms.length === 0 && eOther.terms.length === 0){
      html += '<div class="tnote"><span class="tnote__k">Nothing to strain</span>' +
        'Unsubstituted cyclohexane. Both chairs are identical and it flips between them billions of times a second. ' +
        'Add a substituent below and they stop being equivalent.</div>';
    } else if(gap < 0.005){
      html += '<div class="tnote tnote--info"><span class="tnote__k">Evenly matched</span>' +
        'Both chairs cost the same, so neither is preferred — the ring flips freely and you would find a 50:50 mixture. ' +
        'This is what happens when a flip only trades one identical axial group for another.</div>';
    } else {
      var winner = eHere.total < eOther.total ? 'the one on screen' : 'the other one';
      html += '<div class="tnote ' + (eHere.total <= eOther.total ? 'tnote--good' : 'tnote--warn') + '">' +
        '<span class="tnote__k">' + (eHere.total <= eOther.total ? 'You are looking at the major conformer' : 'The other chair is better') + '</span>' +
        'The gap is ' + gap.toFixed(2) + ' kcal/mol in favour of ' + winner + '. ' +
        'At room temperature that works out to about ' + pct.toFixed(gap > 2 ? 2 : 1) + '% of molecules sitting in the better chair ' +
        'at any moment — energy differences this small still produce lopsided ratios, because the relationship is exponential.' +
      '</div>';
    }

    if(eHere.terms.length){
      html += '<div class="ttable-scroll"><table class="ttable">' +
        '<thead><tr><th>What this chair is paying for</th><th>kcal/mol</th></tr></thead><tbody>' +
        eHere.terms.map(function(t){
          return '<tr><td>' + esc(t.text) + '</td><td class="num">' + t.kcal.toFixed(2) + '</td></tr>';
        }).join('') +
        '<tr><td><b>Total</b></td><td class="num win">' + eHere.total.toFixed(2) + '</td></tr>' +
        '</tbody></table></div>';
    } else {
      html += '<div class="tnote tnote--good"><span class="tnote__k">Nothing axial</span>' +
        'Every substituent on this chair is equatorial, so there is no A-value to pay. This is as good as it gets.</div>';
    }

    html += '<div class="ttable-scroll"><table class="ttable" style="margin-top:10px;">' +
      '<thead><tr><th>Position</th><th>Group</th><th>Face</th><th>This chair</th><th>After a flip</th></tr></thead><tbody>' +
      [0,1,2,3,4,5].map(function(i){
        var e = ring[i];
        if(!e) return '';
        var a = here.atoms.filter(function(x){ return x.carbon === i && x.face === e[1] && x.subKey !== 'H'; })[0];
        var b = other.atoms.filter(function(x){ return x.carbon === i && x.face === e[1] && x.subKey !== 'H'; })[0];
        if(!a || !b) return '';
        return '<tr><td class="num">C' + (i + 1) + '</td><td>' + esc(SUBS[e[0]].label) + '</td><td>' + e[1] + '</td>' +
          '<td class="' + (a.isAxial ? 'lose' : 'win') + '">' + (a.isAxial ? 'axial' : 'equatorial') + '</td>' +
          '<td class="' + (b.isAxial ? 'lose' : 'win') + '">' + (b.isAxial ? 'axial' : 'equatorial') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' +
      '<p class="tmuted" style="margin-top:10px;">A flip turns every axial group equatorial and every equatorial group axial — ' +
      'all six at once. It never moves a group from one face of the ring to the other, which is why cis stays cis: ' +
      'that would take breaking a bond.</p>';

    document.getElementById('cfChairReadout').innerHTML = html;
    renderRingControls();
  }

  function renderRingControls(){
    var opts = Object.keys(SUBS).map(function(k){
      return { k:k, label:SUBS[k].label + (SUBS[k].a ? ' (A = ' + SUBS[k].a.toFixed(2) + ')' : '') };
    });

    document.getElementById('cfRing').innerHTML = [0,1,2,3,4,5].map(function(i){
      var e = ring[i];
      return '<div class="cf-slot">' +
        '<label for="cfSub' + i + '">C' + (i + 1) + '</label>' +
        '<select class="tselect" id="cfSub' + i + '" data-pos="' + i + '">' +
          '<option value="">—</option>' +
          opts.filter(function(o){ return o.k !== 'H'; }).map(function(o){
            return '<option value="' + o.k + '"' + (e && e[0] === o.k ? ' selected' : '') + '>' + esc(o.label) + '</option>';
          }).join('') +
        '</select>' +
        '<div class="tseg cf-face" data-pos="' + i + '">' +
          '<button type="button" data-face="up"' + (!e || e[1] === 'up' ? ' class="on"' : '') + (e ? '' : ' disabled') + '>up</button>' +
          '<button type="button" data-face="down"' + (e && e[1] === 'down' ? ' class="on"' : '') + (e ? '' : ' disabled') + '>down</button>' +
        '</div>' +
      '</div>';
    }).join('');

    document.getElementById('cfRing').querySelectorAll('select').forEach(function(sel){
      sel.addEventListener('change', function(){
        var i = parseInt(sel.getAttribute('data-pos'), 10);
        ring[i] = sel.value ? [sel.value, (ring[i] && ring[i][1]) || 'up'] : null;
        renderChair();
      });
    });
    document.getElementById('cfRing').querySelectorAll('.cf-face button').forEach(function(b){
      b.addEventListener('click', function(){
        var i = parseInt(b.parentNode.getAttribute('data-pos'), 10);
        if(!ring[i]) return;
        ring[i] = [ring[i][0], b.getAttribute('data-face')];
        renderChair();
      });
    });
  }

  /* ====================================================================== */
  /* Page                                                                    */
  /* ====================================================================== */

  root.innerHTML =
    '<div class="tpanel">' +
      '<div class="tpanel__head">Two kinds of conformation</div>' +
      '<div class="tseg" id="cfMode">' +
        '<button type="button" data-mode="newman" class="on">Newman &amp; torsion</button>' +
        '<button type="button" data-mode="chair">Cyclohexane chairs</button>' +
      '</div>' +
    '</div>' +

    '<div id="cfNewman">' +
      '<div class="tpanel"><div class="tpanel__head">Pick a bond to rotate</div>' +
        '<div class="tchips" id="cfTorPicker"></div></div>' +
      '<div class="tsplit">' +
        '<div class="tpanel">' +
          '<div class="tpanel__head"><span>Looking down the bond</span><span class="tmuted" id="cfAngleOut"></span></div>' +
          '<div class="cf-stage" id="cfNewmanStage"></div>' +
          '<input type="range" class="trange" id="cfAngle" min="0" max="360" step="1" value="60" aria-label="Dihedral angle">' +
          '<div class="trow" style="justify-content:space-between;">' +
            '<span class="tmuted" style="font-size:11.5px;">0°</span>' +
            '<span class="tmuted" style="font-size:11.5px;">180°</span>' +
            '<span class="tmuted" style="font-size:11.5px;">360°</span>' +
          '</div>' +
          '<div class="trow" style="margin-top:10px;">' +
            '<button type="button" class="tchip" data-snap="0">Eclipsed</button>' +
            '<button type="button" class="tchip" data-snap="60">Gauche</button>' +
            '<button type="button" class="tchip" data-snap="180">Anti</button>' +
          '</div>' +
        '</div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head">Energy against angle</div>' +
          '<div class="cf-curve" id="cfCurve"></div>' +
          '<div id="cfReadout" style="margin-top:12px;"></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div id="cfChair" hidden>' +
      '<div class="tpanel"><div class="tpanel__head">Start from a classic, or build your own</div>' +
        '<div class="tchips" id="cfPresets"></div></div>' +
      '<div class="tsplit">' +
        '<div class="tpanel">' +
          '<div class="tpanel__head"><span>Drag to turn it</span><span class="tmuted">chair ' +
            '<span id="cfWhich">A</span></span></div>' +
          '<div class="v3-stage" id="cfChairStage"></div>' +
          '<div class="trow" style="margin-top:12px;">' +
            '<button type="button" class="btn-press" id="cfFlip">Flip the ring</button>' +
            '<button type="button" class="tchip" id="cfClear">Clear all</button>' +
          '</div>' +
          '<div id="cfRing" class="cf-ring"></div>' +
        '</div>' +
        '<div class="tpanel">' +
          '<div class="tpanel__head">What it costs</div>' +
          '<div id="cfChairReadout"></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  // --- mode switch
  document.getElementById('cfMode').querySelectorAll('button').forEach(function(b){
    b.addEventListener('click', function(){
      var mode = b.getAttribute('data-mode');
      document.getElementById('cfMode').querySelectorAll('button').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      document.getElementById('cfNewman').hidden = mode !== 'newman';
      document.getElementById('cfChair').hidden = mode !== 'chair';
    });
  });

  // --- newman wiring
  document.getElementById('cfTorPicker').innerHTML = TORSIONALS.map(function(t){
    return '<button type="button" class="tchip" data-id="' + esc(t.id) + '">' + esc(t.name) + '</button>';
  }).join('');
  document.getElementById('cfTorPicker').querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      TORSIONALS.forEach(function(t){ if(t.id === b.getAttribute('data-id')) tor = t; });
      document.getElementById('cfTorPicker').querySelectorAll('.tchip').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      renderNewman();
    });
  });
  document.getElementById('cfTorPicker').querySelector('.tchip').classList.add('on');

  document.getElementById('cfAngle').addEventListener('input', function(e){
    theta = parseInt(e.target.value, 10);
    renderNewman();
  });
  root.querySelectorAll('[data-snap]').forEach(function(b){
    b.addEventListener('click', function(){
      theta = parseInt(b.getAttribute('data-snap'), 10);
      document.getElementById('cfAngle').value = theta;
      renderNewman();
    });
  });

  // --- chair wiring
  document.getElementById('cfPresets').innerHTML = PRESETS.map(function(p){
    return '<button type="button" class="tchip" data-id="' + esc(p.id) + '">' + esc(p.label) + '</button>';
  }).join('');
  document.getElementById('cfPresets').querySelectorAll('.tchip').forEach(function(b){
    b.addEventListener('click', function(){
      PRESETS.forEach(function(p){
        if(p.id !== b.getAttribute('data-id')) return;
        ring = p.subs.map(function(s){ return s ? [s[0], s[1]] : null; });
      });
      document.getElementById('cfPresets').querySelectorAll('.tchip').forEach(function(x){
        x.classList.toggle('on', x === b);
      });
      renderChair();
    });
  });

  document.getElementById('cfFlip').addEventListener('click', function(){
    flipped = !flipped;
    document.getElementById('cfWhich').textContent = flipped ? 'B' : 'A';
    renderChair();
  });
  document.getElementById('cfClear').addEventListener('click', function(){
    ring = [null,null,null,null,null,null];
    document.getElementById('cfPresets').querySelectorAll('.tchip').forEach(function(x){ x.classList.remove('on'); });
    renderChair();
  });

  // Dragging the chair, same gesture as the 3D viewer.
  var chairStage = document.getElementById('cfChairStage');
  var dragging = false, lx = 0, ly = 0;
  chairStage.addEventListener('pointerdown', function(e){
    dragging = true; lx = e.clientX; ly = e.clientY;
    chairStage.setPointerCapture(e.pointerId);
    chairStage.classList.add('is-dragging');
  });
  chairStage.addEventListener('pointermove', function(e){
    if(!dragging) return;
    cry += (e.clientX - lx) * 0.011;
    crx = Math.max(-1.45, Math.min(1.45, crx + (e.clientY - ly) * 0.011));
    lx = e.clientX; ly = e.clientY;
    renderChair();
  });
  ['pointerup','pointercancel'].forEach(function(ev){
    chairStage.addEventListener(ev, function(){ dragging = false; chairStage.classList.remove('is-dragging'); });
  });

  renderNewman();
  renderChair();
})();
