/* The one list of tools.

   The hub page renders cards from it, every tool page renders its own switcher
   from it, and the "related tool" links at the bottom of a tool come out of the
   same place. One array, so adding a tool is one edit and nothing anywhere else
   goes stale — the failure mode this replaces is a hub that quietly stops
   listing a tool that exists.

   `topic` names the curriculum topic the tool belongs to, in curriculum.js's
   vocabulary, so a tool can point back at the lesson that teaches it rather
   than floating free of the course. */
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
      blurb: 'Push electrons on any molecule and the structure changes to match — bonds break, charges appear, fragments separate. Nothing is graded, but nothing is faked either: an arrow that would put ten electrons on a carbon gets told so.',
      teaches: 'Curved arrows, formal charge, octets',
      topic: 'sn2'
    },
    {
      slug: 'resonance',
      name: 'Resonance Explorer',
      icon: ICONS.resonance,
      tagline: 'Find every valid resonance form, and rank them.',
      blurb: 'Move a lone pair or a pi bond and the tool checks whether what you drew is a genuine resonance structure or a different molecule. It knows how many forms exist, so you can hunt for the ones you missed — then see which contributes most and why.',
      teaches: 'Delocalization, contributor weighting',
      topic: 'resonance'
    },
    {
      slug: 'viewer-3d',
      name: '3D Molecule Viewer',
      icon: ICONS.cube,
      tagline: 'Rotate it until the shape stops being abstract.',
      blurb: 'Real VSEPR geometry you can turn with a drag. Bond angles on demand, lone pairs you can show or hide, and a running readout of steric number and shape — because "trigonal pyramidal" means very little until you have looked down at one.',
      teaches: 'VSEPR, hybridization, stereochemistry',
      topic: 'molecular-geometry'
    },
    {
      slug: 'conformations',
      name: 'Conformation Lab',
      icon: ICONS.chair,
      tagline: 'Turn the bond. Watch the energy.',
      blurb: 'Rotate a Newman projection through 360° against a live energy curve, or put substituents on a cyclohexane and flip the chair to see which one wins. Strain stops being a table of numbers when the number moves as you turn the bond.',
      teaches: 'Torsional strain, A-values, chair flips',
      topic: 'conformations'
    },
    {
      slug: 'reaction-predictor',
      name: 'Reaction Predictor',
      icon: ICONS.flask,
      tagline: 'SN1, SN2, E1 or E2 — and why, factor by factor.',
      blurb: 'Pick a substrate, a reagent and a solvent, commit to a prediction, then see the decision broken into the four things that actually decide it. The point is not the answer; it is which factor overruled which.',
      teaches: 'Substitution vs. elimination',
      topic: 'sn1-sn2'
    },
    {
      slug: 'acid-base',
      name: 'Acid/Base Comparator',
      icon: ICONS.scale,
      tagline: 'Two structures. Which proton comes off first?',
      blurb: 'Put any two acids side by side, call it, and get the comparison broken down the way you are supposed to reason about it — atom, resonance, induction, orbital — with both conjugate bases drawn so you can see where the charge went.',
      teaches: 'pKa, conjugate base stability',
      topic: 'acidity-factors'
    },
    {
      slug: 'spectroscopy',
      name: 'Spectroscopy Lab',
      icon: ICONS.wave,
      tagline: 'Read the peaks, name the compound.',
      blurb: 'An IR spectrum whose regions explain themselves, a ¹H NMR predictor that shows you why each signal splits the way it does, and a puzzle mode that hands you a spectrum and makes you work backwards to the structure.',
      teaches: 'IR, ¹H NMR, degrees of unsaturation',
      topic: 'spectroscopy'
    }
  ];

  function bySlug(slug){
    for(var i=0;i<TOOLS.length;i++) if(TOOLS[i].slug === slug) return TOOLS[i];
    return null;
  }

  window.OchemTools = { ALL: TOOLS, bySlug: bySlug, ICONS: ICONS };
})();
