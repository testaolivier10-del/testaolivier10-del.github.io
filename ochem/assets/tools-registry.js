/* The one list of tools.

   The hub page renders cards from it, every tool page renders its own switcher
   from it, and the "related tool" links at the bottom of a tool come out of the
   same place. One array, so adding a tool is one edit and nothing anywhere else
   goes stale — the failure mode this replaces is a hub that quietly stops
   listing a tool that exists.

   `topic` lists the curriculum topics a tool belongs to, in curriculum.js's
   vocabulary, so a tool can point back at the lessons that teach it rather
   than floating free of the course.

   Two of these used to be ids that do not exist — 'conformations' and
   'sn1-sn2' were never topics, they were what the topics felt like they ought
   to be called — which nothing noticed because nothing read the field. Checked
   against curriculum.js now, and an array, because a tool that covers SN1 and
   SN2 and E1 and E2 was never going to fit in one. */
(function(){

  /* Line marks rather than emoji: they inherit currentColor, so they work in
     both themes and at any size, and they don't render as a different picture
     on every platform. Each is drawn in a 24x24 box. */
  var ICONS = {
    arrow:
      '<path d="M4 17c0-6 4-10 10-10h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M15 3.5 20 7l-5 3.5z" fill="currentColor"/>' +
      '<circle cx="4" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
    resonance:
      '<circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="18" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M10 10h4M10 14h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    cube:
      '<path d="M12 3 20 7.5v9L12 21 4 16.5v-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    chair:
      '<path d="M3 14h5l3-5 3 5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M8 14v4M16 14v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    flask:
      '<path d="M9 3v6L4 19a1.6 1.6 0 0 0 1.4 2h13.2A1.6 1.6 0 0 0 20 19l-5-10V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M7.5 3h9M6.7 14h10.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    scale:
      '<path d="M12 4v16M5 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M5 8 2.5 14h5zM19 8l-2.5 6h5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M8.5 20h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    wave:
      '<path d="M2 16c2 0 2-8 4-8s2 5 4 5 2-9 4-9 2 12 4 12 2-4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  var TOOLS = [
    {
      slug: 'arrow-pusher',
      name: 'Arrow Pusher',
      icon: ICONS.arrow,
      tagline: 'Draw a mechanism and watch what it makes.',
      blurb: 'Push electrons on any molecule — one of twenty, or one you drew — and the structure changes to match. Commit a step and carry on from its product, because mechanisms are three and four steps long. Nothing is graded and nothing is faked: an arrow that would put ten electrons on a carbon is told so, and one that merely makes a primary carbocation is told that too.',
      teaches: 'Curved arrows, formal charge, octets',
      topic: ['curved-arrows', 'sn2', 'formal-charge']
    },
    {
      slug: 'resonance',
      name: 'Resonance Explorer',
      icon: ICONS.resonance,
      tagline: 'Find every valid resonance form, and rank them.',
      blurb: 'Move a lone pair or a pi bond and the tool checks whether what you drew is a genuine resonance structure or a different molecule. It works out how many forms exist rather than looking them up, so it does it for any species you build — and a second mode puts two side by side and asks which is more stabilized.',
      teaches: 'Delocalization, contributor weighting',
      topic: ['resonance', 'conjugate']
    },
    {
      slug: 'viewer-3d',
      name: '3D Molecule Viewer',
      icon: ICONS.cube,
      tagline: 'Rotate it until the shape stops being abstract.',
      blurb: 'Type a formula, or draw a structure, and watch the flat drawing fold into the shape it really has. Lit, shaded and shadowed, with space-filling and wireframe modes, angles measured off the coordinates on screen, and a readout of steric number and shape — because "trigonal pyramidal" means very little until you have looked down at one.',
      teaches: 'VSEPR, hybridization, stereochemistry',
      topic: ['molecular-geometry', 'hybridization', 'bonding']
    },
    {
      slug: 'conformations',
      name: 'Conformation Lab',
      icon: ICONS.chair,
      tagline: 'Turn the bond. Watch the energy.',
      blurb: 'Rotate a Newman projection through 360° against a live energy curve — built from the groups you choose, not a fixed list — or substitute a cyclohexane and see both chairs at once with the population split under each. Strain stops being a table of numbers when the number moves as you turn the bond.',
      teaches: 'Torsional strain, A-values, chair flips',
      topic: ['conformational-analysis', 'newman', 'ring-flips']
    },
    {
      slug: 'reaction-predictor',
      name: 'Reaction Predictor',
      icon: ICONS.flask,
      tagline: 'SN1, SN2, E1 or E2 — and why, factor by factor.',
      blurb: 'Pick a substrate — or draw one — add a reagent and a solvent, commit to a prediction, then see the decision broken into the four things that actually decide it, plus how lopsided the resulting mixture is. The point is not the answer; it is which factor overruled which.',
      teaches: 'Substitution vs. elimination',
      topic: ['sn1', 'sn2', 'e1', 'e2']
    },
    {
      slug: 'acid-base',
      name: 'Acid/Base Comparator',
      icon: ICONS.scale,
      tagline: 'Two structures. Which proton comes off first?',
      blurb: 'Put two acids side by side, rank four at once, or take a single molecule and work out which of its protons comes off first. Every verdict comes from the measured pKa and every explanation from atom, resonance, induction and orbital in that order — and the tool says so plainly on the occasions those two disagree.',
      teaches: 'pKa, conjugate base stability',
      topic: ['acidity-factors', 'pka', 'conjugate']
    },
    {
      slug: 'spectroscopy',
      name: 'Spectroscopy Lab',
      icon: ICONS.wave,
      tagline: 'Read the peaks, name the compound.',
      blurb: 'An IR spectrum whose regions explain themselves, a ¹H NMR predictor that will take any structure you draw and show why each signal splits the way it does, and a puzzle mode that hands you a spectrum and makes you work back to the structure — by drawing it, if you want the harder version.',
      teaches: 'IR, ¹H NMR, degrees of unsaturation',
      topic: ['ir', 'h-nmr', 'mass-spec']
    }
  ];

  function bySlug(slug){
    for(var i=0;i<TOOLS.length;i++) if(TOOLS[i].slug === slug) return TOOLS[i];
    return null;
  }

  window.OchemTools = { ALL: TOOLS, bySlug: bySlug, ICONS: ICONS };
})();
