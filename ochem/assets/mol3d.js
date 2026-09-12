/* Molecules in three dimensions, drawn as SVG.

   No 3D library. Not out of purism — the site vendors three.js for the
   anatomy model already — but because a first-year organic molecule is a
   dozen atoms and four dozen lines, and the whole job is a rotation matrix, a
   perspective divide and a depth sort. Pulling in a renderer for that would
   cost more than it saves and would lose the thing that matters most here:
   the atoms are SVG elements, so they inherit the theme's colors, scale
   crisply on a phone, and can be clicked without any picking machinery.

   The geometries are real. Where a shape is standard (tetrahedral, trigonal
   planar, octahedral) the coordinates are generated from the VSEPR
   construction rather than typed in, which means the angles the tool reports
   are measured off the same coordinates it draws — a number nobody had to
   keep in sync with the picture. */
(function(){

  /* ---- Vectors ---------------------------------------------------------- */

  function v(x, y, z){ return { x:x, y:y, z:z }; }
  function add(a, b){ return v(a.x+b.x, a.y+b.y, a.z+b.z); }
  function sub(a, b){ return v(a.x-b.x, a.y-b.y, a.z-b.z); }
  function mul(a, s){ return v(a.x*s, a.y*s, a.z*s); }
  function dot(a, b){ return a.x*b.x + a.y*b.y + a.z*b.z; }
  function cross(a, b){
    return v(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x);
  }
  function len(a){ return Math.sqrt(dot(a, a)); }
  function norm(a){ var l = len(a) || 1; return mul(a, 1/l); }

  // Any unit vector perpendicular to a — used to seed a rotation axis when
  // only one bond direction is known.
  function perpendicular(a){
    var probe = Math.abs(a.x) < 0.9 ? v(1,0,0) : v(0,1,0);
    return norm(cross(a, probe));
  }

  // Rotate `p` about unit axis `k` by `ang` (Rodrigues).
  function rotateAbout(p, k, ang){
    var c = Math.cos(ang), s = Math.sin(ang);
    return add(add(mul(p, c), mul(cross(k, p), s)), mul(k, dot(k, p) * (1 - c)));
  }

  function angleBetween(a, b){
    var d = dot(norm(a), norm(b));
    return Math.acos(Math.max(-1, Math.min(1, d))) * 180 / Math.PI;
  }

  /* ---- Building geometry -----------------------------------------------

     Rather than typing four sets of xyz for every methyl group in the file,
     the directions that complete an atom's geometry are derived from the
     bonds it already has. Three cases cover everything a course draws. */

  var TET = Math.acos(-1/3);            // 109.47°, in radians

  function completeTetrahedral(existing, count){
    // `existing` are unit vectors to current neighbours; return `count` more,
    // arranged so all of them sit at tetrahedral angles.
    var out = [];

    if(existing.length === 0){
      var base = [v(1,1,1), v(1,-1,-1), v(-1,1,-1), v(-1,-1,1)];
      for(var i=0;i<count;i++) out.push(norm(base[i]));
      return out;
    }

    if(existing.length === 1){
      /* A cone around the reverse of the one bond. The cone's half-angle is
         180° − 109.47°, NOT 109.47°: the tetrahedral angle is measured from
         the EXISTING bond, and the axis points the opposite way. Getting this
         backwards puts ethane's hydrogens at 70.5° to the C–C bond, which
         looks almost right and is the wrong molecule. */
      var axis = norm(mul(existing[0], -1));
      var seed = perpendicular(axis);
      var tilt = rotateAbout(axis, seed, Math.PI - TET);
      for(var j=0;j<count;j++) out.push(norm(rotateAbout(tilt, axis, j * 2*Math.PI/3)));
      return out;
    }

    if(existing.length === 2){
      /* The classic construction: the two remaining directions lie in the
         plane that bisects the existing pair and is perpendicular to it.
         This is what puts cyclohexane's axial and equatorial hydrogens where
         they actually are, rather than where a guess would put them. */
      var u1 = norm(existing[0]), u2 = norm(existing[1]);
      var bisect = norm(mul(add(u1, u2), -1));
      var n = norm(cross(u1, u2));
      var half = TET / 2;
      out.push(norm(add(mul(bisect, Math.cos(half)), mul(n, Math.sin(half)))));
      if(count > 1) out.push(norm(add(mul(bisect, Math.cos(half)), mul(n, -Math.sin(half)))));
      return out.slice(0, count);
    }

    // Three neighbours: the last direction is simply away from all of them.
    var s = existing.reduce(function(acc, e){ return add(acc, norm(e)); }, v(0,0,0));
    out.push(norm(mul(s, -1)));
    return out.slice(0, count);
  }

  /* Trigonal planar and linear completions, so a builder can place an sp²
     or sp centre without the tetrahedral construction quietly bending a
     carbonyl. `ref` is an optional plane normal: without it, a chain grown
     one atom at a time picks an arbitrary perpendicular at every step and
     comes out as a spiral instead of the flat zig-zag it should be. */
  function completeTrigonal(existing, count, ref){
    var out = [];
    var n = ref ? norm(ref) : v(0, 0, 1);

    if(existing.length === 0){
      var seed = norm(cross(n, Math.abs(n.x) < 0.9 ? v(1,0,0) : v(0,1,0)));
      for(var i=0;i<count;i++) out.push(norm(rotateAbout(seed, n, i * 2*Math.PI/3)));
      return out;
    }

    if(existing.length === 1){
      var e = norm(existing[0]);
      // Keep the new directions in the plane the caller asked for, unless the
      // existing bond already defines one that contradicts it.
      var axis = Math.abs(dot(e, n)) > 0.95 ? perpendicular(e) : norm(cross(e, n));
      /* 60° off the REVERSE of the existing bond, which puts each new
         direction 120° from it — the same off-by-a-reversal that the
         tetrahedral case warns about, and just as easy to get wrong: 30° here
         looks plausible and gives a 150° carbonyl. */
      out.push(norm(rotateAbout(mul(e, -1), axis,  Math.PI/3)));
      if(count > 1) out.push(norm(rotateAbout(mul(e, -1), axis, -Math.PI/3)));
      return out.slice(0, count);
    }

    var s = existing.reduce(function(acc, x){ return add(acc, norm(x)); }, v(0,0,0));
    out.push(norm(mul(s, -1)));
    return out.slice(0, count);
  }

  function completeLinear(existing, count){
    if(existing.length === 0) return [v(1,0,0), v(-1,0,0)].slice(0, count);
    return [norm(mul(existing[0], -1))].slice(0, count);
  }

  /* One entry point over the three, chosen by steric number — which is what a
     caller walking a structure actually knows. */
  function completeGeometry(existing, count, steric, ref){
    if(steric <= 2) return completeLinear(existing, count);
    if(steric === 3) return completeTrigonal(existing, count, ref);
    return completeTetrahedral(existing, count);
  }

  /* Covalent radii in ångström. A bond length is the sum of the two, pulled in
     for higher orders — close enough that a built molecule measures right when
     the viewer reports its angles, and far cheaper than a length table with an
     entry per pair. */
  var COVALENT = {
    H:0.31, B:0.84, C:0.76, N:0.71, O:0.66, F:0.57, Si:1.11, P:1.07,
    S:1.05, Cl:1.02, Br:1.20, I:1.39, Li:1.28, Na:1.66, Mg:1.41
  };
  function bondLength(elA, elB, order){
    var r = (COVALENT[elA] || 0.77) + (COVALENT[elB] || 0.77);
    if(order === 2) return r - 0.12;
    if(order === 3) return r - 0.22;
    return r;
  }

  /* Ring of n atoms in a plane, or puckered when `pucker` is given — the
     chair is just a hexagon with alternating z. */
  function ringPoints(n, radius, pucker){
    var pts = [];
    for(var i=0;i<n;i++){
      var a = i * 2*Math.PI/n;
      pts.push(v(radius*Math.cos(a), radius*Math.sin(a), (pucker || 0) * (i % 2 ? -1 : 1)));
    }
    return pts;
  }

  /* ---- Element presentation ---------------------------------------------

     CPK conventions, pulled toward the site's palette so a molecule does not
     look like it was pasted in from a different application. Radii are
     drawing radii, not van der Waals radii — the point is to tell atoms apart
     at a glance, and true relative sizes would bury every hydrogen. */
  var STYLE = {
    H:  { color:'#E4DFD4', r:0.30, ink:'#2A2A28' },
    C:  { color:'#4A5A54', r:0.46, ink:'#FFFFFF' },
    N:  { color:'#3B6FB6', r:0.46, ink:'#FFFFFF' },
    O:  { color:'#D1594A', r:0.44, ink:'#FFFFFF' },
    F:  { color:'#5FA85A', r:0.40, ink:'#FFFFFF' },
    Cl: { color:'#5FA85A', r:0.50, ink:'#FFFFFF' },
    Br: { color:'#A0522D', r:0.56, ink:'#FFFFFF' },
    I:  { color:'#7B4FA8', r:0.62, ink:'#FFFFFF' },
    S:  { color:'#C9973A', r:0.54, ink:'#2A2A28' },
    P:  { color:'#E07B39', r:0.54, ink:'#FFFFFF' },
    B:  { color:'#C08060', r:0.48, ink:'#FFFFFF' }
  };
  function styleOf(el){ return STYLE[el] || { color:'#8A9691', r:0.44, ink:'#FFFFFF' }; }

  /* An atom may carry its own style, which is how a condensed group drawn as
     one sphere — a methyl, a tert-butyl — gets a size that reflects how much
     room it actually takes up, instead of every substituent rendering as an
     identically sized carbon. */
  function styleFor(atom){ return atom.style || styleOf(atom.el); }

  /* ---- Molecule construction -------------------------------------------- */

  /* A molecule is {name, formula, atoms:[{el,pos,lp}], bonds:[{a,b,order}],
     note}. Atoms are indices; hydrogens are generated rather than listed. */
  function build(spec){
    var atoms = spec.atoms.map(function(a){
      return {
        el:a.el, pos:a.pos, label:a.label || a.el, fixed:true,
        lp: a.lp || (a.lpDirs ? a.lpDirs.length : 0),
        // Water and ammonia carry their own lone-pair directions, because
        // their bond angles are compressed below tetrahedral and generating
        // the pairs from a tetrahedron would quietly straighten them back out.
        lpDirs: a.lpDirs ? a.lpDirs.map(norm) : null
      };
    });
    var bonds = (spec.bonds || []).map(function(b){
      return { a:b.a, b:b.b, order:b.order || 1 };
    });

    /* Hydrogens and lone pairs are placed last, from whatever bonds the heavy
       atoms ended up with. Doing it here rather than in each definition is
       what keeps a chair's twelve hydrogens honest. */
    (spec.fill || []).forEach(function(f){
      var centre = atoms[f.at];
      var existing = bonds.filter(function(b){ return b.a === f.at || b.b === f.at; })
        .map(function(b){
          var other = atoms[b.a === f.at ? b.b : b.a];
          return sub(other.pos, centre.pos);
        });

      var need = (f.h || 0) + (f.lp || 0);
      /* An sp² centre's third substituent is in the plane of the other two,
         not tilted out of it: a benzene hydrogen generated tetrahedrally
         would stick out of the ring. */
      /* `geom` is the centre's electron-group count, and when a caller knows
         it the hydrogens follow the same geometry as the heavy atoms. Without
         it every fill was tetrahedral, which is right for most of a library
         typed by hand and wrong for every sp² and sp centre a builder makes —
         ethene came out with 109.5° hydrogens on a 120° carbon. */
      var dirs = f.geom
        ? completeGeometry(existing, need, f.geom)
        : (f.planar
            ? [norm(mul(existing.reduce(function(acc, e){ return add(acc, norm(e)); }, v(0,0,0)), -1))]
            : completeTetrahedral(existing, need));

      for(var i=0;i<(f.h || 0);i++){
        atoms.push({ el:'H', pos: add(centre.pos, mul(dirs[i], f.len || 1.09)), lp:0, label:'H' });
        bonds.push({ a:f.at, b:atoms.length - 1, order:1 });
      }
      // Lone pairs are not atoms; they hang off the centre as directions.
      // The count has to go up with them, or the steric number reads as if
      // they were never placed and a bent oxygen gets reported as linear.
      for(var j=0;j<(f.lp || 0);j++){
        centre.lpDirs = centre.lpDirs || [];
        centre.lpDirs.push(dirs[(f.h || 0) + j]);
        centre.lp = (centre.lp || 0) + 1;
      }
    });

    // Any lone pairs declared without a fill get placed opposite the bonds.
    atoms.forEach(function(a, i){
      if(!a.lp || a.lpDirs) return;
      var existing = bonds.filter(function(b){ return b.a === i || b.b === i; })
        .map(function(b){ return sub(atoms[b.a === i ? b.b : b.a].pos, a.pos); });
      a.lpDirs = completeTetrahedral(existing, a.lp);
    });

    return {
      name: spec.name, formula: spec.formula, note: spec.note,
      focus: spec.focus === undefined ? 0 : spec.focus,
      atoms: atoms, bonds: bonds
    };
  }

  /* ---- VSEPR readout -----------------------------------------------------

     Steric number in, shape out. The table is the one every course prints;
     what the tool adds is that the angle next to it is measured off the
     coordinates on screen rather than quoted from the table, so an angle that
     is compressed by a lone pair reads as compressed. */
  var SHAPES = {
    '2,0': { e:'Linear',               m:'Linear',               hyb:'sp',    ideal:180 },
    '3,0': { e:'Trigonal planar',      m:'Trigonal planar',      hyb:'sp²',   ideal:120 },
    '3,1': { e:'Trigonal planar',      m:'Bent',                 hyb:'sp²',   ideal:120 },
    '4,0': { e:'Tetrahedral',          m:'Tetrahedral',          hyb:'sp³',   ideal:109.5 },
    '4,1': { e:'Tetrahedral',          m:'Trigonal pyramidal',   hyb:'sp³',   ideal:109.5 },
    '4,2': { e:'Tetrahedral',          m:'Bent',                 hyb:'sp³',   ideal:109.5 },
    '5,0': { e:'Trigonal bipyramidal', m:'Trigonal bipyramidal', hyb:'sp³d',  ideal:120 },
    '5,1': { e:'Trigonal bipyramidal', m:'See-saw',              hyb:'sp³d',  ideal:120 },
    '6,0': { e:'Octahedral',           m:'Octahedral',           hyb:'sp³d²', ideal:90 }
  };

  function analyse(mol, index){
    var a = mol.atoms[index];
    if(!a) return null;
    var nb = mol.bonds.filter(function(b){ return b.a === index || b.b === index; });
    // A double bond is one electron group, not two — the single most common
    // place a steric-number count goes wrong.
    var groups = nb.length + a.lp;
    var shape = SHAPES[groups + ',' + a.lp] || null;

    var dirs = nb.map(function(b){
      var other = mol.atoms[b.a === index ? b.b : b.a];
      return { key: b.a === index ? b.b : b.a, el: other.el, dir: sub(other.pos, a.pos) };
    });

    var angles = [];
    for(var i=0;i<dirs.length;i++){
      for(var j=i+1;j<dirs.length;j++){
        angles.push({
          a: dirs[i].el, b: dirs[j].el,
          deg: angleBetween(dirs[i].dir, dirs[j].dir)
        });
      }
    }
    angles.sort(function(x, y){ return x.deg - y.deg; });

    return {
      el: a.el,
      bonds: nb.length,
      lonePairs: a.lp,
      steric: groups,
      shape: shape,
      angles: angles
    };
  }

  /* ---- Rendering ---------------------------------------------------------

     The projection was always real — a rotation matrix, a perspective divide
     and a depth sort. What it lacked was any reason for the eye to believe
     it. A flat-filled circle is a disc no matter how correctly it has been
     projected, and size alone is the weakest depth cue there is.

     So three things do the persuading now, none of them touching the maths.
     Every sphere is lit: a radial gradient with the highlight up and to the
     left, which is the difference between a disc and a ball. Everything fades
     with distance — toward the page rather than toward a colour, so it works
     in both themes without knowing which one is on. And a soft ellipse sits
     under the molecule, because an object with a shadow is standing on
     something and an object without one is floating in a diagram.

     Three modes, because the same molecule answers different questions.
     Ball-and-stick is the reading view. Space-filling draws atoms at van der
     Waals radius, which is the only honest way to show why a tert-butyl group
     blocks an approach — the sticks version makes every substituent look like
     it has room. Wireframe strips it back to bonds when the spheres are in
     the way of seeing the skeleton. */

  /* Van der Waals radii in ångström, for space-filling. These are the real
     ones; STYLE.r above is a drawing radius chosen to keep hydrogens visible,
     and using it here would defeat the entire point of the mode. */
  var VDW = {
    H:1.10, C:1.70, N:1.55, O:1.52, F:1.47, Cl:1.75, Br:1.85,
    I:1.98, S:1.80, P:1.80, B:1.92, Li:1.82, Na:2.27, Mg:1.73, Si:2.10
  };
  function vdwOf(el){ return VDW[el] || 1.70; }

  /* Lighten (amt > 0) or darken (amt < 0) a #rrggbb toward white or black.
     Used to build the two ends of each sphere's gradient from its one colour,
     so adding an element to STYLE needs no second and third colour by hand. */
  function shift(hex, amt){
    var h = String(hex).replace('#','');
    if(h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function mix(c){
      return Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt));
    }
    return '#' + [mix(r), mix(g), mix(b)].map(function(c){
      return ('0' + Math.max(0, Math.min(255, c)).toString(16)).slice(-2);
    }).join('');
  }

  /* One gradient per colour per viewer. Naming them after the colour alone made
     two viewers on one page emit the same id twice: harmless in practice, since
     the colliding definitions are identical, but still invalid HTML and a hit in
     every accessibility audit. The instance counter keeps them distinct. */
  var gradSeq = 0;
  function gradScope(){ return 'g' + (++gradSeq); }
  function gradIdFor(color, scope){ return 'm3dg-' + scope + '-' + String(color).replace(/[^0-9a-zA-Z]/g, ''); }

  function defsFor(mol, scope){
    var seen = {}, out = '';
    mol.atoms.forEach(function(a){
      var c = styleFor(a).color;
      if(seen[c]) return;
      seen[c] = 1;
      out +=
        '<radialGradient id="' + gradIdFor(c, scope) + '" cx="34%" cy="28%" r="74%">' +
          '<stop offset="0%" stop-color="' + shift(c, 0.52) + '"/>' +
          '<stop offset="48%" stop-color="' + c + '"/>' +
          '<stop offset="100%" stop-color="' + shift(c, -0.42) + '"/>' +
        '</radialGradient>';
    });
    return '<defs>' + out + '</defs>';
  }

  function project(p, rx, ry, opt){
    // Y first (turntable), then X (tilt) — the pair a drag maps onto.
    var c1 = Math.cos(ry), s1 = Math.sin(ry);
    var x1 = p.x*c1 + p.z*s1, z1 = -p.x*s1 + p.z*c1;
    var c2 = Math.cos(rx), s2 = Math.sin(rx);
    var y2 = p.y*c2 - z1*s2, z2 = p.y*s2 + z1*c2;

    var d = opt.dist;
    var k = d / (d - z2);
    return { x: opt.cx + x1*opt.scale*k, y: opt.cy - y2*opt.scale*k, z: z2, k: k };
  }

  function render(mol, opt){
    opt = opt || {};
    // One gradient namespace per render, so two viewers on a page never emit
    // the same id twice.
    var scope = gradScope();
    var mode = opt.mode || 'ball';
    var o = {
      cx: opt.cx === undefined ? 160 : opt.cx,
      cy: opt.cy === undefined ? 150 : opt.cy,
      scale: opt.scale || 52,
      /* Was 9, which is very nearly an orthographic camera: turning the
         molecule changed the outline but never the sense of near and far.
         6.2 is close enough for the front of a ring to grow visibly as it
         comes round, and still far enough not to bend a benzene. */
      dist: opt.dist || 6.2,
      rx: opt.rx || 0, ry: opt.ry || 0
    };

    var pts = mol.atoms.map(function(a){ return project(a.pos, o.rx, o.ry, o); });
    var items = [];

    /* Depth is mapped across whatever range this molecule actually occupies,
       not a fixed one: water would otherwise use a sliver of the fade and
       come out uniformly flat. */
    var zmin = Infinity, zmax = -Infinity;
    pts.forEach(function(p){
      if(p.z < zmin) zmin = p.z;
      if(p.z > zmax) zmax = p.z;
    });
    var zspan = (zmax - zmin) || 1;
    /* Space-filling spheres overlap almost completely, and at the fade the
       other modes use the back atoms show THROUGH the front ones — which reads
       as glass rather than as distance, and glass is not a fact about the
       molecule. So space-filling does not fade at all: it gets its depth from
       occlusion, which is the strongest cue there is — a sphere in front of
       another sphere simply hides it — plus the perspective growth and the
       shading. Fading would only let the hidden atoms show through again. */
    var floor = mode === 'space' ? 1 : 0.58;
    function fade(z){
      var t = (z - zmin) / zspan;            // 0 at the back, 1 at the front
      return (floor + (1 - floor) * t).toFixed(3);
    }

    /* The shadow goes down first, under everything. It is drawn in screen
       space from the molecule's own projected width rather than as a real
       cast shadow — nobody is lighting this scene, and the job is only to say
       "this object is sitting somewhere", which an ellipse does. */
    if(opt.shadow !== false){
      var minX = Infinity, maxX = -Infinity, maxY = -Infinity;
      pts.forEach(function(p, i){
        var rr = (mode === 'space' ? vdwOf(mol.atoms[i].el) * 0.5 : styleFor(mol.atoms[i]).r) * o.scale * p.k;
        if(p.x - rr < minX) minX = p.x - rr;
        if(p.x + rr > maxX) maxX = p.x + rr;
        if(p.y + rr > maxY) maxY = p.y + rr;
      });
      var w = Math.max(18, (maxX - minX) * 0.42);
      items.push({ z: -Infinity, svg:
        '<ellipse cx="' + ((minX + maxX) / 2).toFixed(1) + '" cy="' + (maxY + 16).toFixed(1) +
        '" rx="' + w.toFixed(1) + '" ry="' + (w * 0.17).toFixed(1) + '" ' +
        'fill="var(--ink)" opacity="0.10"/>'
      });
    }

    /* Space-filling hides the sticks: at van der Waals radius the spheres
       are already touching, and a bond drawn through them would only be
       visible where the surface it is meant to connect has a gap. */
    if(mode !== 'space'){
      mol.bonds.forEach(function(b){
        var pa = pts[b.a], pb = pts[b.b];
        var sa = styleFor(mol.atoms[b.a]), sb = styleFor(mol.atoms[b.b]);
        var mid = { x:(pa.x+pb.x)/2, y:(pa.y+pb.y)/2 };
        var z = (pa.z + pb.z) / 2;
        var w = (mode === 'wire' ? 3.4 : 7) * ((pa.k + pb.k) / 2);

        // Offsets for a double or triple bond, perpendicular in screen space.
        var dx = pb.x - pa.x, dy = pb.y - pa.y;
        var l = Math.sqrt(dx*dx + dy*dy) || 1;
        var nx = -dy/l * w * 0.62, ny = dx/l * w * 0.62;
        var offs = b.order === 2 ? [-0.5, 0.5] : (b.order === 3 ? [-1, 0, 1] : [0]);
        var sw = b.order > 1 ? w * 0.58 : w;
        var op = fade(z);

        offs.forEach(function(f){
          var ox = nx*f, oy = ny*f;
          items.push({ z: z, svg:
            '<g opacity="' + op + '">' +
            '<line x1="' + (pa.x+ox).toFixed(1) + '" y1="' + (pa.y+oy).toFixed(1) +
            '" x2="' + (mid.x+ox).toFixed(1) + '" y2="' + (mid.y+oy).toFixed(1) +
            '" stroke="' + sa.color + '" stroke-width="' + sw.toFixed(1) + '" stroke-linecap="round"/>' +
            '<line x1="' + (mid.x+ox).toFixed(1) + '" y1="' + (mid.y+oy).toFixed(1) +
            '" x2="' + (pb.x+ox).toFixed(1) + '" y2="' + (pb.y+oy).toFixed(1) +
            '" stroke="' + sb.color + '" stroke-width="' + sw.toFixed(1) + '" stroke-linecap="round"/>' +
            '</g>'
          });
        });
      });
    }

    if(opt.lonePairs && mode !== 'space'){
      mol.atoms.forEach(function(a, i){
        (a.lpDirs || []).forEach(function(d){
          var base = add(a.pos, mul(norm(d), styleFor(a).r + 0.42));
          var p = project(base, o.rx, o.ry, o);
          // Two dots, offset perpendicular to the view-space direction.
          var pc = pts[i];
          var vx = p.x - pc.x, vy = p.y - pc.y;
          var l = Math.sqrt(vx*vx + vy*vy) || 1;
          var ox = -vy/l * 4.2 * p.k, oy = vx/l * 4.2 * p.k;
          items.push({ z: p.z, svg:
            '<g opacity="' + fade(p.z) + '">' +
            '<circle cx="' + (p.x+ox).toFixed(1) + '" cy="' + (p.y+oy).toFixed(1) + '" r="' + (2.4*p.k).toFixed(1) + '" fill="var(--muted)"/>' +
            '<circle cx="' + (p.x-ox).toFixed(1) + '" cy="' + (p.y-oy).toFixed(1) + '" r="' + (2.4*p.k).toFixed(1) + '" fill="var(--muted)"/>' +
            '</g>'
          });
        });
      });
    }

    mol.atoms.forEach(function(a, i){
      var p = pts[i], s = styleFor(a);
      var selected = opt.selected === i;

      /* Wireframe keeps a small node so an atom is still a click target and
         still carries its letter; it just stops pretending to have volume. */
      var r = mode === 'space'
        ? vdwOf(a.el) * o.scale * p.k * 0.50
        : (mode === 'wire' ? Math.max(5, s.r * o.scale * p.k * 0.38)
                           : s.r * o.scale * p.k * 0.86);

      var fontSize = Math.max(8, r * (mode === 'space' ? 0.55 : 0.92));
      var fill = (mode === 'wire' && !opt.flat) ? s.color : 'url(#' + gradIdFor(s.color, scope) + ')';

      items.push({ z: p.z, svg:
        '<g class="m3d-atom' + (selected ? ' is-selected' : '') + '" data-atom="' + i + '" tabindex="0" role="button" ' +
          'aria-label="' + a.el + '" opacity="' + fade(p.z) + '">' +
          '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + fill + '"' +
            (selected ? ' stroke="var(--accent)" stroke-width="3.5"' : ' stroke="' + shift(s.color, -0.45) + '" stroke-width="1"') + '/>' +
          (opt.labels && r > 7
            ? '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + fontSize*0.35).toFixed(1) + '" text-anchor="middle" ' +
              'font-size="' + fontSize.toFixed(1) + '" font-weight="800" fill="' + s.ink + '" pointer-events="none">' + a.label + '</text>'
            : '') +
        '</g>'
      });
    });

    items.sort(function(x, y){ return x.z - y.z; });
    return defsFor(mol, scope) + items.map(function(it){ return it.svg; }).join('');
  }

  window.OchemMol3D = {
    v: v, add: add, sub: sub, mul: mul, norm: norm, cross: cross, len: len,
    angleBetween: angleBetween,
    ringPoints: ringPoints,
    completeTetrahedral: completeTetrahedral,
    completeTrigonal: completeTrigonal,
    completeGeometry: completeGeometry,
    bondLength: bondLength,
    styleOf: styleOf,
    styleFor: styleFor,
    vdwOf: vdwOf,
    build: build,
    analyse: analyse,
    render: render,
    SHAPES: SHAPES
  };
})();
