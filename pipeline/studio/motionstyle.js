/* LevlPrep studio motion style (2026-10-21): the house ANIMATION style as one profile every layer reads,
   so the feel of motion is chosen once and applied everywhere (rigs, faces, camera, labels, transitions, sims).

   window.LPMotion = LPMotionStyle(name)  then:
     LPMotion.ease(name)          GSAP ease string for that kind of move ("move", "pop", "camera", "label", "exit")
     LPMotion.dur(kind, base)     duration for a move of that kind (base seconds scaled by the profile)
     LPMotion.time(t)             the time a layer should be drawn at (stepped on twos/threes for the drawn look)
     LPMotion.drift(t)            slow camera drift offset {x, y, s, r} applied to the main camera
     LPMotion.overshoot, .squash  amounts used by rigs and pops
     LPMotion.springK, springC    spring stiffness and damping multipliers for loose parts

   Profiles (finished looks to compare; Olivier picks one or a mix):
     smooth  : soft, floaty, continuous; long sine/expo eases, constant gentle camera drift, no overshoot (Kurzgesagt feel)
     snappy  : quick anticipation and overshoot, short durations, crisp pops, quick whip camera moves, almost no drift
     twos    : hand drawn feel: every layer updates every other frame (12 fps feel at 24/30 fps), holds between keys,
               stronger poses, camera moves stepped too, small boil on outlines
     bouncy  : rubbery: big squash and stretch, elastic settles, loose springs, playful camera bobs                  */
(function (G) {
  const P = {
    smooth: { scale: 1.25, move: "sine.inOut", pop: "power3.out", camera: "sine.inOut", label: "power2.out", exit: "sine.in",
              step: 0, drift: { x: 14, y: 8, s: 0.018, r: 0.25, per: 9 }, overshoot: 0, squash: 0, springK: 0.8, springC: 1.2, boil: 0 },
    snappy: { scale: 0.75, move: "back.inOut(1.4)", pop: "back.out(2.4)", camera: "expo.inOut", label: "back.out(2)", exit: "back.in(1.6)",
              step: 0, drift: { x: 2, y: 1, s: 0.003, r: 0, per: 12 }, overshoot: 0.12, squash: 0.06, springK: 1.4, springC: 0.9, boil: 0 },
    twos:   { scale: 1.0, move: "power2.inOut", pop: "power4.out", camera: "power3.inOut", label: "steps(4)", exit: "power2.in",
              step: 2, drift: { x: 6, y: 3, s: 0.006, r: 0.1, per: 10 }, overshoot: 0.05, squash: 0.03, springK: 1.0, springC: 1.0, boil: 0.6 },
    bouncy: { scale: 1.0, move: "elastic.out(1, 0.55)", pop: "elastic.out(1.1, 0.45)", camera: "back.inOut(1.2)", label: "elastic.out(1, 0.5)", exit: "back.in(2)",
              step: 0, drift: { x: 6, y: 10, s: 0.008, r: 0.5, per: 4 }, overshoot: 0.25, squash: 0.16, springK: 0.6, springC: 0.6, boil: 0 },
  };
  function make(name, fps) {
    const p = P[name] || P.smooth; fps = fps || 30;
    return {
      name, p, overshoot: p.overshoot, squash: p.squash, springK: p.springK, springC: p.springC, boil: p.boil,
      ease: (k) => p[k] || p.move,
      dur: (kind, base) => base * p.scale * (kind === "camera" ? 1.1 : 1),
      time: (t) => (p.step ? Math.floor(t * fps / p.step) * p.step / fps : t),
      drift: (t) => { const d = p.drift, w = 2 * Math.PI / d.per; const tt = p.step ? Math.floor(t * fps / p.step) * p.step / fps : t;
        return { x: d.x * Math.sin(w * tt), y: d.y * Math.sin(w * tt * 0.73 + 1.1), s: 1 + d.s * (0.5 + 0.5 * Math.sin(w * tt * 0.5)), r: d.r * Math.sin(w * tt * 0.41) }; },
    };
  }
  G.LPMotionStyle = make; G.LPMotionProfiles = P;
})(window);
