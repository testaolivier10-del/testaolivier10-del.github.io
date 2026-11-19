/* The molecules the 3D viewer offers, grouped by what they are there to show.

   Bond lengths are the standard ones in ångströms, and angles are either
   generated from the VSEPR construction in mol3d.js or — for the two shapes
   where a lone pair squeezes the bonds below tetrahedral — written out, since
   a generated tetrahedron would quietly report water at 109.5° and lose the
   only interesting thing about it. */
(function(){
  var M3 = window.OchemMol3D;
  if(!M3) return;
  var v = M3.v;

  function deg(d){ return d * Math.PI / 180; }

  var LIB = [];
  function add(group, spec){ LIB.push({ group: group, spec: spec }); }

  /* ---- Shapes from electron groups ------------------------------------- */

  add('VSEPR shapes', {
    id:'methane', name:'Methane', formula:'CH₄',
    note:'Four bonding groups, no lone pairs. The shape every other tetrahedral center is compared against.',
    atoms:[{ el:'C', pos:v(0,0,0) }],
    fill:[{ at:0, h:4, len:1.09 }],
    focus:0
  });

  add('VSEPR shapes', {
    id:'ammonia', name:'Ammonia', formula:'NH₃',
    note:'Four electron groups, but only three of them are bonds. The lone pair takes up more room than a bond does, which is why the H–N–H angle is 107° rather than 109.5°.',
    atoms:[{
      el:'N', pos:v(0,0,0),
      // 68.2° from the −z axis puts the three N–H bonds at 107° to each other.
      lpDirs:[v(0,0,1)]
    }],
    bonds:[],
    focus:0,
    custom: function(spec){
      var out = [];
      for(var i=0;i<3;i++){
        var a = deg(120*i);
        out.push({ el:'H', pos:v(1.01*0.9285*Math.cos(a), 1.01*0.9285*Math.sin(a), -1.01*0.3720) });
      }
      return out;
    }
  });

  add('VSEPR shapes', {
    id:'water', name:'Water', formula:'H₂O',
    note:'Two lone pairs and two bonds. Two pairs pushing is worse than one, so the angle closes further still — 104.5°.',
    atoms:[{
      el:'O', pos:v(0,0,0),
      lpDirs:[v(0, 0.82, 0.57), v(0, -0.82, 0.57)]
    }],
    bonds:[],
    focus:0,
    custom: function(){
      return [
        { el:'H', pos:v( 0.96*Math.sin(deg(52.25)), 0, -0.96*Math.cos(deg(52.25))) },
        { el:'H', pos:v(-0.96*Math.sin(deg(52.25)), 0, -0.96*Math.cos(deg(52.25))) }
      ];
    }
  });

  add('VSEPR shapes', {
    id:'boron-trifluoride', name:'Boron trifluoride', formula:'BF₃',
    note:'Only six electrons on boron and it is perfectly happy — trigonal planar, 120°, and an empty p orbital sticking out of the plane. That empty orbital is the whole of its chemistry.',
    atoms:[{ el:'B', pos:v(0,0,0) }].concat([0,1,2].map(function(i){
      var a = deg(90 + 120*i);
      return { el:'F', pos:v(1.31*Math.cos(a), 1.31*Math.sin(a), 0), lp:3 };
    })),
    bonds:[{a:0,b:1},{a:0,b:2},{a:0,b:3}],
    focus:0
  });

  add('VSEPR shapes', {
    id:'phosphorus-pentachloride', name:'Phosphorus pentachloride', formula:'PCl₅',
    note:'Five electron groups, which no second-row element can manage. The two axial positions and the three equatorial ones are not equivalent — a point that matters the moment anything substitutes.',
    atoms:[{ el:'P', pos:v(0,0,0) },
      { el:'Cl', pos:v(0,0, 2.14), lp:3 }, { el:'Cl', pos:v(0,0,-2.14), lp:3 }
    ].concat([0,1,2].map(function(i){
      var a = deg(90 + 120*i);
      return { el:'Cl', pos:v(2.02*Math.cos(a), 2.02*Math.sin(a), 0), lp:3 };
    })),
    bonds:[{a:0,b:1},{a:0,b:2},{a:0,b:3},{a:0,b:4},{a:0,b:5}],
    focus:0
  });

  add('VSEPR shapes', {
    id:'sulfur-hexafluoride', name:'Sulfur hexafluoride', formula:'SF₆',
    note:'Six groups, every angle 90°, and no lone pair anywhere to distort it. The cleanest octahedron a course ever shows you.',
    atoms:[{ el:'S', pos:v(0,0,0) },
      { el:'F', pos:v( 1.56,0,0), lp:3 }, { el:'F', pos:v(-1.56,0,0), lp:3 },
      { el:'F', pos:v(0, 1.56,0), lp:3 }, { el:'F', pos:v(0,-1.56,0), lp:3 },
      { el:'F', pos:v(0,0, 1.56), lp:3 }, { el:'F', pos:v(0,0,-1.56), lp:3 }
    ],
    bonds:[{a:0,b:1},{a:0,b:2},{a:0,b:3},{a:0,b:4},{a:0,b:5},{a:0,b:6}],
    focus:0
  });

  /* ---- Hybridization --------------------------------------------------- */

  add('Hybridization', {
    id:'ethane', name:'Ethane', formula:'C₂H₆',
    note:'Two sp³ carbons joined by a sigma bond. Turn it end-on and the back methyl group can be spun independently — that free rotation is what the Conformation Lab is about.',
    atoms:[{ el:'C', pos:v(-0.77,0,0) }, { el:'C', pos:v(0.77,0,0) }],
    bonds:[{a:0,b:1}],
    fill:[{ at:0, h:3, len:1.09 }, { at:1, h:3, len:1.09 }],
    focus:0
  });

  add('Hybridization', {
    id:'ethene', name:'Ethene', formula:'C₂H₄',
    note:'Both carbons sp², and every atom in one plane. Rotating the double bond would mean breaking the pi overlap, which is why alkenes have cis and trans isomers and alkanes do not.',
    atoms:[
      /* measured, not idealized: H–C–H 117.4°, H–C–C 121.3°, C–H 1.087 Å, C=C 1.34 Å (OpenStax Organic
         Chemistry 1.8) */
      { el:'C', pos:v(-0.67,0,0) }, { el:'C', pos:v(0.67,0,0) },
      { el:'H', pos:v(-0.67 + 1.087*Math.cos(deg(121.3)),  1.087*Math.sin(deg(121.3)),0) },
      { el:'H', pos:v(-0.67 + 1.087*Math.cos(deg(121.3)), -1.087*Math.sin(deg(121.3)),0) },
      { el:'H', pos:v( 0.67 - 1.087*Math.cos(deg(121.3)),  1.087*Math.sin(deg(121.3)),0) },
      { el:'H', pos:v( 0.67 - 1.087*Math.cos(deg(121.3)), -1.087*Math.sin(deg(121.3)),0) }
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2},{a:0,b:3},{a:1,b:4},{a:1,b:5}],
    focus:0
  });

  add('Hybridization', {
    id:'ethyne', name:'Ethyne', formula:'C₂H₂',
    note:'sp carbons: two hybrid orbitals each, 180° apart, and two perpendicular pi bonds wrapped around the axis. Four atoms in a perfectly straight line.',
    atoms:[
      { el:'C', pos:v(-0.60,0,0) }, { el:'C', pos:v(0.60,0,0) },
      { el:'H', pos:v(-1.66,0,0) }, { el:'H', pos:v(1.66,0,0) }
    ],
    bonds:[{a:0,b:1,order:3},{a:0,b:2},{a:1,b:3}],
    focus:0
  });

  add('Hybridization', {
    id:'carbon-dioxide-3d', name:'Carbon dioxide', formula:'CO₂',
    note:'Two polar bonds and no net dipole. Turn it and you can see why: the two pulls point in exactly opposite directions and cancel.',
    atoms:[
      { el:'C', pos:v(0,0,0) },
      { el:'O', pos:v(-1.16,0,0), lp:2 }, { el:'O', pos:v(1.16,0,0), lp:2 }
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:2}],
    focus:0
  });

  add('Hybridization', {
    id:'formaldehyde-3d', name:'Formaldehyde', formula:'H₂C=O',
    note:'A flat sp² carbon with a big dipole pointing at oxygen. The face a nucleophile attacks is the one above or below this plane — which is the reason attacking a carbonyl gives a mixture.',
    atoms:[
      { el:'C', pos:v(0,0,0) },
      { el:'O', pos:v(0,1.21,0), lp:2 },
      /* measured: H–C–H about 116.5° (microwave; textbooks quote 116 to 118°), C–H 1.11 Å */
      { el:'H', pos:v( 1.11*Math.sin(deg(121.75)), 1.11*Math.cos(deg(121.75)),0) },
      { el:'H', pos:v(-1.11*Math.sin(deg(121.75)), 1.11*Math.cos(deg(121.75)),0) }
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2},{a:0,b:3}],
    focus:0
  });

  add('Hybridization', {
    id:'benzene-3d', name:'Benzene', formula:'C₆H₆',
    note:'Every atom in one plane, every C–C bond the same length. Tilt it edge-on and the flatness is the point: the p orbitals above and below can only overlap all the way round if nothing puckers.',
    atoms: M3.ringPoints(6, 1.39, 0).map(function(p){ return { el:'C', pos:p }; }),
    bonds:[
      {a:0,b:1,order:2},{a:1,b:2},{a:2,b:3,order:2},
      {a:3,b:4},{a:4,b:5,order:2},{a:5,b:0}
    ],
    fill:[0,1,2,3,4,5].map(function(i){ return { at:i, h:1, len:1.08, planar:true }; }),
    focus:0
  });

  /* ---- Stereochemistry and rings --------------------------------------- */

  add('Stereochemistry', {
    id:'chiral-carbon', name:'A stereocenter', formula:'CHFClBr',
    note:'Four different groups on one carbon. Put the hydrogen at the back and read Br → Cl → F: that rotation is the configuration, and it is the one thing you cannot get from a flat drawing.',
    atoms:[{ el:'C', pos:v(0,0,0) },
      { el:'Br', pos:M3.mul(M3.norm(v( 1, 1, 1)), 1.94), lp:3 },
      { el:'Cl', pos:M3.mul(M3.norm(v( 1,-1,-1)), 1.77), lp:3 },
      { el:'F',  pos:M3.mul(M3.norm(v(-1, 1,-1)), 1.35), lp:3 },
      { el:'H',  pos:M3.mul(M3.norm(v(-1,-1, 1)), 1.09) }
    ],
    bonds:[{a:0,b:1},{a:0,b:2},{a:0,b:3},{a:0,b:4}],
    focus:0
  });

  add('Stereochemistry', {
    id:'cyclohexane-chair-3d', name:'Cyclohexane (chair)', formula:'C₆H₁₂',
    note:'Look down the ring edge-on: six hydrogens point straight up and down (axial) and six point out around the rim (equatorial). Every angle is close to 109.5° (drawn at exactly 109.5°; the measured C–C–C is about 111°) and nothing eclipses anything — which is why this shape wins.',
    /* the ideal chair: a pucker of r / (4√2) puts every C–C–C at exactly 109.47°, so all six carbons read the same */
    atoms: M3.ringPoints(6, 1.4425, 1.4425 / (4 * Math.SQRT2)).map(function(p){ return { el:'C', pos:p }; }),
    bonds:[{a:0,b:1},{a:1,b:2},{a:2,b:3},{a:3,b:4},{a:4,b:5},{a:5,b:0}],
    fill:[0,1,2,3,4,5].map(function(i){ return { at:i, h:2, len:1.09 }; }),
    focus:0
  });

  add('Stereochemistry', {
    id:'methanol', name:'Methanol', formula:'CH₃OH',
    note:'Two different centers in one small molecule: a tetrahedral carbon and a bent oxygen with two lone pairs. Click either one and the readout follows.',
    /* the O–H at the measured C–O–H of 108.5°, its two lone pairs either side of that plane; the methyl is the
       ideal tetrahedron */
    atoms:[{ el:'C', pos:v(0,0,0) },
      { el:'O', pos:v(1.43,0,0), lpDirs:[v(0.585*Math.cos(deg(55)), 0.811*Math.cos(deg(55)),  Math.sin(deg(55))),
                                         v(0.585*Math.cos(deg(55)), 0.811*Math.cos(deg(55)), -Math.sin(deg(55)))] },
      // staggered: anti to the methyl hydrogen the fill puts at +y
      { el:'H', pos:v(1.43 + 0.96*Math.cos(deg(71.5)), -0.96*Math.sin(deg(71.5)), 0) }],
    bonds:[{a:0,b:1},{a:1,b:2}],
    fill:[{ at:0, h:3, len:1.09 }],
    focus:1
  });

  /* Build them all, running any custom atom generator first. */
  /* ---- The shapes an organic course actually turns on ---------------------

     The original fifteen covered VSEPR well and organic chemistry thinly. These
     are the centres a student meets in a mechanism and has to reason about in
     three dimensions — a carbocation they are told is flat, an amide nitrogen
     they are told is not pyramidal, a ring whose angles cannot be 109.5°. Every
     one is a claim the viewer can settle by measuring, which is the whole
     argument for having a viewer. */

  add('Reactive intermediates', {
    id:'methyl-cation', name:'Methyl cation', formula:'CH₃⁺',
    note:'Flat, and that is the entire reason SN1 scrambles a stereocenter. Three bonds, no lone pair, an empty p orbital perpendicular to the plane — a nucleophile can arrive at either face with equal ease, so one enantiomer goes in and both come out.',
    /* Explicit coordinates rather than a planar fill: `planar` resolves to a
       single direction (it exists for benzene's one ring hydrogen), so asking
       it for three would place the first and leave the rest undefined. */
    atoms:[
      { el:'C', pos:v(0,0,0), charge:1 },
      { el:'H', pos:v(1.09, 0, 0) },
      { el:'H', pos:v(1.09*Math.cos(deg(120)), 1.09*Math.sin(deg(120)), 0) },
      { el:'H', pos:v(1.09*Math.cos(deg(240)), 1.09*Math.sin(deg(240)), 0) }
    ],
    bonds:[{a:0,b:1},{a:0,b:2},{a:0,b:3}],
    focus:0
  });

  add('Reactive intermediates', {
    id:'methyl-anion', name:'Methyl anion', formula:'CH₃⁻',
    note:'The same carbon with a lone pair instead of an empty orbital, and the shape changes completely: four electron groups, so it pyramidalizes. Compare it against the cation above — the difference between flat and pyramidal is one pair of electrons.',
    atoms:[{ el:'C', pos:v(0,0,0), charge:-1, lpDirs:[v(0,0,1)] }],
    bonds:[],
    focus:0,
    custom: function(){
      var out = [];
      for(var i=0;i<3;i++){
        var a = deg(120*i);
        // the ideal tetrahedral 109.5° (no measured angle to draw)
        out.push({ el:'H', pos:v(1.09*0.9428*Math.cos(a), 1.09*0.9428*Math.sin(a), -1.09/3) });
      }
      return out;
    }
  });

  add('Reactive intermediates', {
    id:'hydronium', name:'Hydronium', formula:'H₃O⁺',
    note:'What "acid" means in water. One lone pair left on the oxygen, so it is pyramidal like ammonia rather than bent like water — protonating oxygen costs it a pair and changes its shape. Its measured H–O–H angle is about 113°, flatter than ammonia\'s 107°.',
    atoms:[{ el:'O', pos:v(0,0,0), charge:1, lpDirs:[v(0,0,1)] }],
    bonds:[],
    focus:0,
    custom: function(){
      var out = [];
      for(var i=0;i<3;i++){
        var a = deg(120*i);
        // H–O–H about 113° (infrared, Tang and Oka 1999): 15.66° from the plane
        out.push({ el:'H', pos:v(0.98*0.9629*Math.cos(a), 0.98*0.9629*Math.sin(a), -0.98*0.2699) });
      }
      return out;
    }
  });

  add('Hybridization', {
    id:'acetonitrile', name:'Acetonitrile', formula:'CH₃C≡N',
    note:'Two carbons with nothing in common: one sp³ and tetrahedral, one sp and perfectly straight. The nitrogen lone pair points along the axis, away from the triple bond, which is where it attacks from.',
    atoms:[
      { el:'C', pos:v(-1.46,0,0) },
      { el:'C', pos:v(0,0,0) },
      { el:'N', pos:v(1.16,0,0), lp:1 }
    ],
    bonds:[{a:0,b:1},{a:1,b:2,order:3}],
    fill:[{ at:0, h:3, len:1.09 }],
    focus:1
  });

  add('Hybridization', {
    id:'dimethyl-ether', name:'Dimethyl ether', formula:'CH₃OCH₃',
    note:'A bent oxygen with two lone pairs, exactly like water — the two methyls have not changed the geometry, only what is attached. Those two pairs are why an ether dissolves a Grignard and why it can be protonated.',
    atoms:[
      { el:'O', pos:v(0,0,0), lpDirs:[v(0,0.82,0.57), v(0,-0.82,0.57)] },
      { el:'C', pos:v( 1.41*Math.sin(deg(55.5)), 0, -1.41*Math.cos(deg(55.5))) },
      { el:'C', pos:v(-1.41*Math.sin(deg(55.5)), 0, -1.41*Math.cos(deg(55.5))) }
    ],
    bonds:[{a:0,b:1},{a:0,b:2}],
    fill:[{ at:1, h:3, len:1.09 }, { at:2, h:3, len:1.09 }],
    focus:0
  });

  add('Hybridization', {
    id:'formamide', name:'Formamide (an amide)', formula:'HCONH₂',
    note:'The nitrogen here is FLAT, not pyramidal — click it and read the angles. Its lone pair is delocalized into the carbonyl, so it sits in a p orbital rather than an sp³ one. That is why amides do not behave like amines, why the C–N bond will not rotate, and why proteins have a backbone with a shape.',
    atoms:[
      { el:'C', pos:v(0,0,0) },
      { el:'O', pos:v(0.66,1.05,0), lp:2 },
      { el:'N', pos:v(-1.35,0.15,0) },
      { el:'H', pos:v(0.52,-0.95,0) },
      /* Placed at exactly ±120° from the N→C direction, so the viewer measures
         the planar nitrogen this molecule is here to demonstrate rather than
         something merely close to it. */
      { el:'H', pos:v(-1.76,1.08,0) },
      { el:'H', pos:v(-1.95,-0.66,0) }
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2},{a:0,b:3},{a:2,b:4},{a:2,b:5}],
    focus:2
  });

  add('Ring strain', {
    id:'cyclopropane-3d', name:'Cyclopropane', formula:'C₃H₆',
    note:'Three carbons in a triangle, so the internal angles are 60° against the 109.5° an sp³ carbon wants. Click a carbon and the readout says so. Every C–H is eclipsed with its neighbor as well, which the ring cannot relieve by twisting — nothing here can move.',
    /* C–C 1.51 Å; each CH2 in the plane that bisects the ring at its carbon, at the measured H–C–H of 114.5°
       (C–H 1.08 Å) */
    atoms: M3.ringPoints(3, 0.872, 0).map(function(p){ return { el:'C', pos:p }; }).concat([0, 1, 2].reduce(function(o, i){
      var a = deg(120 * i), r = v(Math.cos(a), Math.sin(a), 0), c = M3.mul(r, 0.872), h = deg(114.5 / 2);
      o.push({ el:'H', pos:M3.add(c, M3.add(M3.mul(r, 1.08*Math.cos(h)), v(0, 0,  1.08*Math.sin(h)))) });
      o.push({ el:'H', pos:M3.add(c, M3.add(M3.mul(r, 1.08*Math.cos(h)), v(0, 0, -1.08*Math.sin(h)))) });
      return o;
    }, [])),
    bonds:[{a:0,b:1},{a:1,b:2},{a:2,b:0},{a:0,b:3},{a:0,b:4},{a:1,b:5},{a:1,b:6},{a:2,b:7},{a:2,b:8}],
    focus:0
  });

  add('Ring strain', {
    id:'cyclohexane-boat-3d', name:'Cyclohexane (boat)', formula:'C₆H₁₂',
    note:'The conformation the chair is better than. Put it next to the chair and look along the ring: two carbons point the same way at the "prow" and "stern", their hydrogens crowd into each other, and two C–C bonds are fully eclipsed. About 7 kcal/mol worse, and the ring flip never stops here.',
    /* the ideal chair with one end carbon (atom 0) reflected through the plane of carbons 1, 2, 4 and 5: every
       bond length and angle stays exactly tetrahedral, and carbons 0 and 3 become the flagpole ends */
    atoms: M3.ringPoints(6, 1.4425, 1.4425 / (4 * Math.SQRT2)).map(function(p, i){
      if(i !== 0) return { el:'C', pos:p };
      var r = 1.4425, h = r / (4 * Math.SQRT2), n = M3.norm(v(2 * h / r, 0, 1)), d = p.x * n.x + p.y * n.y + p.z * n.z;
      return { el:'C', pos:M3.sub(p, M3.mul(n, 2 * d)) };
    }),
    bonds:[{a:0,b:1},{a:1,b:2},{a:2,b:3},{a:3,b:4},{a:4,b:5},{a:5,b:0}],
    fill:[0,1,2,3,4,5].map(function(i){ return { at:i, h:2, len:1.09 }; }),
    focus:0
  });

  var BUILT = LIB.map(function(entry){
    var spec = entry.spec;
    if(spec.custom){
      var extra = spec.custom(spec);
      var base = spec.atoms.length;
      spec = Object.keys(spec).reduce(function(o, k){ o[k] = spec[k]; return o; }, {});
      spec.atoms = spec.atoms.concat(extra);
      spec.bonds = (spec.bonds || []).concat(extra.map(function(_, i){
        return { a:0, b: base + i, order:1 };
      }));
    }
    var mol = M3.build(spec);
    mol.id = spec.id;
    mol.group = entry.group;
    return mol;
  });

  window.OchemMol3DLibrary = {
    ALL: BUILT,
    get: function(id){
      for(var i=0;i<BUILT.length;i++) if(BUILT[i].id === id) return BUILT[i];
      return null;
    },
    groups: function(){
      var out = [], seen = {};
      BUILT.forEach(function(m){
        if(!seen[m.group]){ seen[m.group] = []; out.push({ label:m.group, items:seen[m.group] }); }
        seen[m.group].push(m);
      });
      return out;
    }
  };
})();
