/* Neuron model: ApPsychMath.neuron (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/appsych-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/appsych-tool-checks/neuron.mjs) and
   the test (scripts/test/appsych-tool-neuron.test.mjs) run exactly this code.

   The science (CED 1.3), kept in one place so the picture, the trace and the
   drills agree:
     simulate(o)   the membrane potential of one neuron, sampled every
                   0.02 ms, for a stimulus o:
                     { mode: 'pulse' | 'pair' | 'held', S (mV of
                       depolarization), gap (ms, the second pulse of a pair),
                       t0 (ms), dur (ms), rest, thresh, peak }
                   Rest -70 mV, threshold -55 mV, peak +40 mV by default
                   (typical textbook values). A pulse depolarizes the
                   membrane by S mV and fades; if the membrane reaches
                   threshold, the neuron fires one action potential of the
                   same size whatever S was (all-or-none). After a spike the
                   membrane overshoots below rest (hyperpolarization); for
                   ABS ms nothing can fire it (absolute refractory period),
                   then until REL ms a stronger stimulus is needed (relative
                   refractory period). A held stimulus fires again and again:
                   a stronger one fires sooner after each refractory period,
                   so intensity is coded by the firing rate, never by the
                   size of the spike.
                   -> { t, v, spikes, events: [{ t, S, effect }], ... }
                   effect: 'spike' | 'sub' (below threshold) | 'absolute' |
                   'relative' (in the relative period, too weak to fire)
     The ion story is said in words only (positive sodium ions rush in,
     potassium ions flow out); the sodium-potassium pump is outside the CED.
     NT            the eight neurotransmitters the CED lists, with what each
                   does and the conditions the CED links to it
     DRUGS         real drugs and what they do at the synapse, each one an
                   agonist, an antagonist or a reuptake inhibitor in the
                   course's sense (where pharmacology is more detailed, the
                   note says so)
     synapse(cls, o)   one release of neurotransmitter into the synapse and
                   what the receiving neuron's receptors do over 12 ms, for
                   no drug, an agonist, an antagonist or a reuptake
                   inhibitor (relative units: an explanatory model)
   Every number a drill shows comes from ApPsychStats (M.Stats()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, given, figure }
     types: trace (read a membrane potential trace: count the spikes, how far
     threshold is above rest, why a pulse did or did not fire, what a stronger
     stimulus changes), drug (agonist, antagonist or reuptake inhibitor, and
     what it does to the signal), transmitter (which neurotransmitter fits a
     function, a drug or a condition), parts (the parts of a neuron, glia,
     myelin, the reflex arc, multiple sclerosis and myasthenia gravis). */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function E(recipe){ return M.Stats().evaluate(recipe); }

  /* ------------------------------------------------------- the membrane */
  var REST = -70, THRESH = -55, PEAK = 40, UNDER = -80;
  var ABS = 2, REL = 5, RISE = 0.4, TAU = 2.5, TAU_HELD = 1.6, DT = 0.02;
  function smooth(a, b, u){ u = Math.max(0, Math.min(1, u)); u = u * u * (3 - 2 * u); return a + (b - a) * u; }
  /* The action potential, s ms after the membrane crosses threshold. */
  function wave(s, P){
    var th = P.thresh, pk = P.peak, un = P.rest - 10, rs = P.rest;
    if(s < 0) return rs;
    if(s < 0.5) return smooth(th, pk, s / 0.5);
    if(s < 1.9) return smooth(pk, un, (s - 0.5) / 1.4);
    if(s < REL) return smooth(un, rs, (s - 1.9) / (REL - 1.9));
    return rs;
  }
  /* The threshold, s ms after a spike: out of reach in the absolute
     refractory period, raised in the relative one. */
  function threshAt(s, P){
    if(s < ABS) return Infinity;
    if(s < REL) return P.thresh + 12 * (REL - s) / (REL - ABS);
    return P.thresh;
  }
  function psp(u, S){ if(u < 0) return 0; return u < RISE ? S * u / RISE : S * Math.exp(-(u - RISE) / TAU); }
  function params(o){
    o = o || {};
    var P = { rest: o.rest == null ? REST : o.rest, thresh: o.thresh == null ? THRESH : o.thresh, peak: o.peak == null ? PEAK : o.peak };
    P.mode = o.mode || 'pulse'; P.S = Math.max(0, +o.S || 0); P.gap = o.gap == null ? 3 : +o.gap;
    P.t0 = o.t0 == null ? 2 : +o.t0; P.dur = o.dur == null ? 25 : +o.dur;
    return P;
  }
  function simulate(o){
    var P = params(o), n = Math.round(P.dur / DT);
    var pulses = P.mode === 'pulse' ? [P.t0] : P.mode === 'pair' ? [P.t0, P.t0 + P.gap] : [];
    var events = pulses.map(function(t){ return { t: M.round(t, 3), S: P.S, effect: 'sub' }; });
    var live = [], last = -Infinity, driveFrom = P.t0, t = [], v = [], spikes = [], pi = 0;
    for(var i = 0; i <= n; i++){
      var ti = M.round(i * DT, 6), since = ti - last;
      // pulses arriving now
      while(pi < pulses.length && pulses[pi] <= ti + 1e-9){
        var e = events[pi];
        if(since < ABS) e.effect = 'absolute';
        else { live.push({ t: pulses[pi], S: P.S, e: e }); if(since < REL) e.effect = 'relative'; }
        pi++;
      }
      var base = since < REL ? wave(since, P) : P.rest, V;
      if(since < ABS) V = base;
      else {
        V = base;
        for(var k = 0; k < live.length; k++) V += psp(ti - live[k].t, live[k].S);
        if(P.mode === 'held' && ti >= P.t0) V += P.S * (1 - Math.exp(-(ti - Math.max(driveFrom, P.t0)) / TAU_HELD));
        if(V >= threshAt(since, P)){
          // fires: the all-or-none spike takes over from here
          last = ti; spikes.push(M.round(ti, 3)); since = 0; V = wave(0, P);
          live.forEach(function(x){ x.e.effect = 'spike'; });
          live = []; driveFrom = ti + ABS;
        }
      }
      t.push(ti); v.push(V);
    }
    return { t: t, v: v, spikes: spikes, events: events, rest: P.rest, thresh: P.thresh, peak: P.peak, under: P.rest - 10, mode: P.mode, S: P.S, gap: P.gap, t0: P.t0, dur: P.dur, abs: ABS, rel: REL };
  }
  /* The smallest stimulus that fires a neuron at rest (mV): threshold minus rest. */
  function needed(o){ var P = params(o); return E({ fn: 'sub', args: [P.thresh, P.rest] }); }
  /* Spikes per 25 ms for a held stimulus of S mV (the rate code). */
  function rate(S, o){ var P = params(o); return simulate({ mode: 'held', S: S, rest: P.rest, thresh: P.thresh, peak: P.peak, dur: 25, t0: 2 }).spikes.length; }
  /* A plotted series every step ms, rounded to 0.1 mV (what a drill draws). */
  function series(run, step){
    step = step || 0.1;
    var k = Math.max(1, Math.round(step / DT)), out = [];
    // every step, plus each spike's peak (0.5 ms after it crosses
    // threshold), so the plotted spike always reaches the peak
    var peaks = run.spikes.map(function(sp){ return Math.round((sp + 0.5) / DT); });
    for(var i = 0; i < run.t.length; i++) if(i % k === 0 || peaks.indexOf(i) > -1) out.push([M.round(run.t[i], 2), M.round(run.v[i], 1)]);
    return out;
  }

  /* ----------------------------------------------- neurotransmitters */
  var NT = {
    acetylcholine: { name: 'Acetylcholine', short: 'ACh', role: 'excitatory at muscles', does: 'Makes muscles contract; also helps with learning and memory.', low: 'Alzheimer’s disease damages acetylcholine-making neurons; in myasthenia gravis the immune system attacks acetylcholine receptors at the muscles, so muscles weaken.', fn: 'muscle movement, learning and memory', clear: 'an enzyme in the synapse breaks it down (not reuptake)' },
    dopamine: { name: 'Dopamine', short: 'DA', role: 'reward and movement', does: 'Carries reward and motivation signals and helps start smooth movement.', low: 'Too little in movement pathways: Parkinson’s disease (tremor, slow movement). Too much activity is linked with schizophrenia; reward pathways are central to addiction.', fn: 'reward, motivation and movement', clear: 'reuptake' },
    serotonin: { name: 'Serotonin', short: '5-HT', role: 'mood', does: 'Helps regulate mood, hunger, sleep and arousal.', low: 'Antidepressants such as SSRIs raise serotonin activity; the old idea that depression is simply \u201clow serotonin\u201d is now known to be too simple.', fn: 'mood, hunger and sleep', clear: 'reuptake' },
    norepinephrine: { name: 'Norepinephrine', short: 'NE', role: 'alertness', does: 'Raises alertness and arousal, part of the fight-or-flight response.', low: 'Low activity is linked with depressed mood; too much with anxiety and agitation.', fn: 'alertness and arousal', clear: 'reuptake' },
    glutamate: { name: 'Glutamate', short: 'Glu', role: 'the main excitatory neurotransmitter', does: 'The brain’s main excitatory (“go”) neurotransmitter; important for learning and memory.', low: 'Too much can overexcite the brain: it is linked with seizures and migraines.', fn: 'excitation, learning and memory', clear: 'reuptake (mostly into glial cells)' },
    gaba: { name: 'GABA', short: 'GABA', role: 'the main inhibitory neurotransmitter', does: 'The brain’s main inhibitory (“stop”) neurotransmitter; calms neural activity.', low: 'Too little is linked with seizures, anxiety and insomnia.', fn: 'calming (inhibiting) neural activity', clear: 'reuptake' },
    endorphins: { name: 'Endorphins', short: 'End', role: 'natural painkillers', does: 'The body’s natural opioids: they lessen pain and add pleasure (for example during hard exercise).', low: 'Opioid drugs act on the same receptors, which is why they relieve pain and can be addictive.', fn: 'pain relief and pleasure', clear: 'enzymes break them down (not reuptake)' },
    substanceP: { name: 'Substance P', short: 'SP', role: 'pain signals', does: 'Carries pain signals to the brain and spinal cord and is involved in inflammation.', low: 'Blocking substance P receptors can ease some kinds of pain and nausea.', fn: 'pain signaling', clear: 'enzymes break it down (not reuptake)' }
  };
  var NT_KEYS = Object.keys(NT);
  var CLASSES = {
    agonist: { name: 'Agonist', does: 'binds to the receptors and activates them, as the neurotransmitter does', signal: 'more' },
    antagonist: { name: 'Antagonist', does: 'binds to the receptors without activating them, so the neurotransmitter cannot', signal: 'less' },
    reuptake: { name: 'Reuptake inhibitor', does: 'blocks reuptake, so the neurotransmitter stays in the synapse longer', signal: 'more' }
  };
  /* Real drugs, as introductory psychology classes them. */
  var DRUGS = [
    { id: 'nicotine', name: 'Nicotine', nt: 'acetylcholine', cls: 'agonist', mech: 'binds to some acetylcholine receptors and activates them' },
    { id: 'curare', name: 'Curare (a plant poison)', nt: 'acetylcholine', cls: 'antagonist', mech: 'sits in the acetylcholine receptors at the muscles without activating them, so the muscles cannot contract' },
    { id: 'ropinirole', name: 'Ropinirole (a Parkinson’s medication)', nt: 'dopamine', cls: 'agonist', mech: 'binds to dopamine receptors and activates them, standing in for the missing dopamine' },
    { id: 'haloperidol', name: 'Haloperidol (an antipsychotic)', nt: 'dopamine', cls: 'antagonist', mech: 'blocks dopamine receptors, so dopamine has less effect' },
    { id: 'cocaine', name: 'Cocaine', nt: 'dopamine', cls: 'reuptake', mech: 'blocks the reuptake of dopamine (and of norepinephrine and serotonin), so dopamine stays in the synapse' },
    { id: 'ssri', name: 'An SSRI such as fluoxetine (Prozac)', nt: 'serotonin', cls: 'reuptake', mech: 'blocks the reuptake of serotonin, so it stays in the synapse longer' },
    { id: 'atomoxetine', name: 'Atomoxetine (an ADHD medication)', nt: 'norepinephrine', cls: 'reuptake', mech: 'blocks the reuptake of norepinephrine' },
    { id: 'propranolol', name: 'Propranolol (a beta blocker)', nt: 'norepinephrine', cls: 'antagonist', mech: 'blocks some receptors for norepinephrine and adrenaline, which calms a racing heart' },
    { id: 'ketamine', name: 'Ketamine (an anesthetic)', nt: 'glutamate', cls: 'antagonist', mech: 'blocks one kind of glutamate receptor' },
    { id: 'benzo', name: 'A benzodiazepine such as alprazolam (Xanax)', nt: 'gaba', cls: 'agonist', mech: 'makes GABA receptors respond more strongly (introductory courses call it a GABA agonist)' },
    { id: 'tiagabine', name: 'Tiagabine (a seizure medication)', nt: 'gaba', cls: 'reuptake', mech: 'blocks the reuptake of GABA, so its calming effect lasts longer' },
    { id: 'morphine', name: 'Morphine', nt: 'endorphins', cls: 'agonist', mech: 'binds to the opioid receptors where endorphins act, and activates them' },
    { id: 'naloxone', name: 'Naloxone (Narcan)', nt: 'endorphins', cls: 'antagonist', mech: 'binds to opioid receptors without activating them and pushes opioid drugs off, reversing an overdose' },
    { id: 'aprepitant', name: 'Aprepitant (an anti-nausea medication)', nt: 'substanceP', cls: 'antagonist', mech: 'blocks substance P receptors' }
  ];
  function drugById(id){ for(var i = 0; i < DRUGS.length; i++) if(DRUGS[i].id === id) return DRUGS[i]; return null; }
  /* The example drug the explorer names for a neurotransmitter and class,
     or null (no common one; the note then says why). */
  function exampleOf(nt, cls){ for(var i = 0; i < DRUGS.length; i++) if(DRUGS[i].nt === nt && DRUGS[i].cls === cls) return DRUGS[i]; return null; }

  /* ------------------------------------------------------ the synapse */
  /* One release at t = 0; 12 ms sampled every 0.1 ms. Relative units:
     cleft is the neurotransmitter left in the synapse (1 at release),
     act the share of receptors activated (0 to 1). */
  var SYN = { dur: 12, dt: 0.1, tauNormal: 1.4, tauBlocked: 4.2, block: 0.7, agonist: 0.32, gain: 1.6 };
  function synapse(cls, o){
    o = o || {};
    var fire = o.fire !== false, tau = cls === 'reuptake' ? SYN.tauBlocked : SYN.tauNormal, avail = cls === 'antagonist' ? 1 - SYN.block : 1;
    var ag = cls === 'agonist' ? SYN.agonist : 0, t = [], cleft = [], act = [];
    for(var i = 0; i <= Math.round(SYN.dur / SYN.dt); i++){
      var ti = M.round(i * SYN.dt, 4), rise = Math.min(1, ti / 0.3), c = fire ? rise * Math.exp(-Math.max(0, ti - 0.3) / tau) : 0;
      var a = Math.min(1, avail * SYN.gain * c / (1 + SYN.gain * c) * 1.35 + ag * (1 - avail * SYN.gain * c / (1 + SYN.gain * c)));
      t.push(ti); cleft.push(c); act.push(a);
    }
    var area = 0;
    for(var j = 1; j < act.length; j++) area += (act[j] + act[j - 1]) / 2 * SYN.dt;
    return { cls: cls || 'none', t: t, cleft: cleft, act: act, area: area, peak: Math.max.apply(null, act) };
  }
  /* The signal with a drug, as a percent of the signal with none. */
  function signalPct(cls){ return E({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [synapse(cls).area, synapse('none').area] }] }, 0] }); }

  /* ----------------------------------------------------------- drills */
  var SK = { count: '3.A', gap: '3.A', why: '1.A', stronger: '1.A', peak: '3.A', cls: '1.A', signal: '1.A', fn: '1.A', nt: '1.A', drugnt: '1.A', part: '1.A', next: '1.A' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.A' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, o){
    o = o || {};
    return step(key, label, { kind: 'num', d: 0, unit: o.unit, hint: o.hint, cell: M.cell(answer, 0, o.mistakes || [], 0.5) });
  }
  /* opts: [[text, why], ...], the right one first; the page shuffles. */
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function mv(x){ return M.minus(String(x)) + ' mV'; }

  /* trace: a recording, then read it. */
  function genTrace(r, c){
    var rest = r.pick(c.rests || [-70]), thrUp = r.pick(c.thresholds || [15]), thresh = rest + thrUp;
    var mode = r.pick(c.modes || ['pulse', 'pair', 'held']), S, gap = null;
    if(mode === 'pulse') S = r.pick([r.int(6, thrUp - 3), r.int(thrUp + 3, 38)]);
    else if(mode === 'pair'){ S = r.int(thrUp + 4, 30); gap = r.pick([1, 1.5, 6, 8]); }
    else S = r.int(thrUp + 4, 40);
    var run = simulate({ mode: mode, S: S, gap: gap == null ? 3 : gap, rest: rest, thresh: thresh, dur: 25, t0: 2 });
    // a spike cut off by the end of the recording would be ambiguous to count
    for(var tries = 0; mode === 'held' && tries < 12 && run.spikes.some(function(x){ return x > 22.5; }); tries++){
      S = S > thrUp + 6 ? S - 1 : S + 1;
      run = simulate({ mode: mode, S: S, rest: rest, thresh: thresh, dur: 25, t0: 2 });
    }
    var ser = series(run, 0.1), n = run.spikes.length, up = E({ fn: 'sub', args: [thresh, rest] });
    var lead = c.lead || 'A researcher records the membrane potential of one neuron.';
    var how = mode === 'pulse' ? 'gives one brief stimulus of ' + S + ' mV at 2 ms' : mode === 'pair' ? 'gives two brief stimuli of ' + S + ' mV each, ' + gap + ' ms apart' : 'holds a steady stimulus of ' + S + ' mV on from 2 ms';
    var text = '<p>' + lead + ' This neuron rests at ' + mv(rest) + ' and its threshold is ' + mv(thresh) + '. The researcher ' + how + '. The graph shows the membrane potential for 25 ms (an invented recording drawn from a model).</p>';
    var steps = [
      num('count', 'Read the graph: how many action potentials (spikes) did the neuron fire?', n, { hint: 'Count the tall spikes that reach about +40 mV.',
        mistakes: mode === 'pair' && n === 1 ? [{ value: 2, why: 'There were two stimuli, but the second arrived during the refractory period and did not fire. Count the spikes on the graph, not the stimuli.' }] : mode === 'pulse' && n === 0 ? [{ value: 1, why: 'The bump never reaches the threshold line, so it is not an action potential. A spike rises all the way to about +40 mV.' }] : [] }),
      num('gap', 'How many millivolts above rest must the membrane be pushed to reach threshold?', up, { unit: 'mV', hint: 'Threshold minus resting potential.',
        mistakes: [{ value: Math.abs(thresh), why: 'That is the threshold itself. The question asks how far it is above the resting potential: ' + mv(thresh) + ' minus ' + mv(rest) + '.' }, { value: Math.abs(rest), why: 'That is the resting potential. Subtract: threshold minus rest.' }, { value: PEAK - rest, why: 'That is the distance to the peak of a spike. A neuron only has to reach threshold; the spike does the rest on its own.' }] })
    ];
    var ev = run.events, sol = [];
    if(mode === 'pulse'){
      var fired = n > 0;
      steps.push(choice('why', fired ? 'Why did the neuron fire?' : 'Why did the neuron not fire?', fired ? [
        ['The ' + S + ' mV stimulus pushed the membrane past threshold, which triggers a full action potential.', 'Right. ' + mv(rest) + ' + ' + S + ' mV reaches past ' + mv(thresh) + ', so the neuron fires.'],
        ['The stimulus was strong, so it made a larger action potential than a weak one would.', 'All-or-none: every action potential has the same size. A stronger stimulus does not make a bigger spike.'],
        ['The neuron was in its refractory period.', 'In the refractory period a neuron cannot fire (or needs more). This neuron was at rest and did fire.'],
        ['Inhibitory neurotransmitter made the membrane more negative.', 'That would push the membrane away from threshold, making a spike less likely. This stimulus was excitatory.']
      ] : [
        ['The ' + S + ' mV stimulus did not reach threshold, so the membrane drifted back to rest.', 'Right. ' + mv(rest) + ' + ' + S + ' mV stays below ' + mv(thresh) + '. Below threshold there is no action potential at all.'],
        ['It fired a small action potential, too small to see.', 'All-or-none: there is no small action potential. Below threshold the neuron does not fire.'],
        ['The neuron was in its refractory period.', 'This neuron was at rest. It did not fire because the stimulus was too weak.'],
        ['The stimulus was too strong and the neuron shut down.', 'A stronger stimulus fires a neuron more easily, never less.']
      ]));
      sol.push('Threshold is ' + up + ' mV above rest (' + mv(thresh) + ' − (' + mv(rest) + ')). The stimulus was ' + S + ' mV, ' + (fired ? 'enough: one full action potential.' : 'not enough: a small bump that fades, and no spike.'));
    } else if(mode === 'pair'){
      var second = ev[1], ok2 = second.effect === 'spike';
      steps.push(choice('why', ok2 ? 'Why did the second stimulus also fire a spike?' : 'Why did the second stimulus not fire a spike?', ok2 ? [
        ['It came after the refractory period ended, so the neuron could fire again.', 'Right. ' + gap + ' ms after the first stimulus the neuron had recovered.'],
        ['The second stimulus added onto the first spike to make it bigger.', 'All-or-none: spikes do not add up into a bigger spike. Each is the same size.'],
        ['It arrived during the absolute refractory period.', 'During the absolute refractory period nothing can fire the neuron, and this one did fire.'],
        ['The neuron fires every time it is stimulated, however soon.', 'Not during the refractory period: right after a spike, the neuron cannot fire again.']
      ] : [
        ['It arrived during the refractory period, just after the first spike, when the neuron could not fire again.', 'Right. ' + gap + ' ms after the first stimulus the neuron was still recovering from its spike.'],
        ['It was weaker than the first stimulus.', 'Both stimuli were ' + S + ' mV. The second came too soon, in the refractory period.'],
        ['The first spike used up all the neurotransmitter.', 'The trace is the neuron’s own membrane. It could not fire because it was in its refractory period.'],
        ['Two stimuli always produce only one action potential.', 'Given more time between them (several ms), the neuron fires twice.']
      ]));
      sol.push('Each stimulus was ' + S + ' mV, past the ' + up + ' mV needed. The first fired at about ' + M.fixed(run.spikes[0], 1) + ' ms. ' + (ok2 ? 'The second came ' + gap + ' ms later, after the refractory period, so it fired too.' : 'The second came only ' + gap + ' ms later, in the refractory period, so it did not fire.'));
    } else {
      sol.push('A held stimulus of ' + S + ' mV keeps pushing the membrane past threshold: it fires, waits out its refractory period, and fires again: ' + n + ' spikes in 25 ms.');
    }
    var strongerQ = mode === 'held' ? 'If the researcher held a stronger stimulus, what would change?' : 'If the researcher used a much stronger stimulus that also fired the neuron, what would change?';
    steps.push(choice('stronger', strongerQ, mode === 'held' ? [
      ['The neuron would fire more often: more spikes in the same 25 ms, each the same size.', 'Right. Intensity is coded by how often a neuron fires, not by the size of its spikes.'],
      ['Each spike would be taller.', 'All-or-none: every spike reaches the same peak. A stronger stimulus fires the neuron more often.'],
      ['The resting potential would rise to match the stimulus.', 'Resting potential is the membrane at rest. A stimulus fires the neuron more often.'],
      ['The neuron would stop firing to protect itself.', 'A stronger stimulus fires a neuron sooner after each refractory period, so more often.']
    ] : [
      ['Nothing about the spike: it would be the same size (all-or-none).', 'Right. One spike from a stronger stimulus is the same size. Held on, a stronger stimulus fires the neuron more often.'],
      ['The spike would be taller, about in proportion to the stimulus.', 'All-or-none: once threshold is reached, the spike is always the same size.'],
      ['The threshold would move down.', 'The threshold is a property of the neuron, not of the stimulus.'],
      ['The neuron would skip its refractory period.', 'Every spike is followed by a refractory period, however strong the stimulus.']
    ]));
    sol.push('All-or-none: an action potential either happens at full size or not at all. Stimulus strength is coded by how often neurons fire.');
    return { ctx: c.id, topic: c.topic, type: 'trace', text: text, steps: steps, solution: sol,
      given: { rest: rest, thresh: thresh, mode: mode, S: S, gap: gap, series: ser },
      figure: { kind: 'trace', series: ser, rest: rest, thresh: thresh, mode: mode, pulses: ev.map(function(e){ return e.t; }) } };
  }

  /* drug: what a drug does at the synapse. */
  var DRUG_WORDS = {
    agonist: ['binds to {nt} receptors and activates them', 'mimics {nt} at its receptors', 'fits into {nt} receptors and triggers them, just as {nt} would'],
    antagonist: ['binds to {nt} receptors without activating them', 'blocks {nt} receptors so {nt} cannot bind', 'occupies {nt} receptors and keeps {nt} from acting on them'],
    reuptake: ['blocks the reuptake of {nt} into the sending neuron', 'keeps {nt} from being taken back up by the neuron that released it', 'stops the sending neuron from recycling {nt} out of the synapse']
  };
  function clsChoice(cls, hintNt){
    var all = {
      agonist: ['Agonist', 'An agonist activates the receptor as the neurotransmitter does.'],
      antagonist: ['Antagonist', 'An antagonist sits in the receptor without activating it, so it blocks the neurotransmitter.'],
      reuptake: ['Reuptake inhibitor', 'A reuptake inhibitor never touches the receptors: it leaves more neurotransmitter in the synapse.']
    };
    var slip = {
      agonist: { antagonist: 'An antagonist blocks receptors. This drug activates them: an agonist.', reuptake: 'A reuptake inhibitor works on the sending neuron’s recycling, not on the receptors. This drug activates the receptors itself: an agonist.', none: 'Neurotransmitters are made by the body. This is a drug acting at the receptors: an agonist.' },
      antagonist: { agonist: 'An agonist activates receptors. This drug occupies them without activating them, which blocks the neurotransmitter: an antagonist.', reuptake: 'A reuptake inhibitor increases the neurotransmitter’s effect. This drug blocks receptors and decreases it: an antagonist.', none: 'Neurotransmitters are made by the body. This is a drug blocking receptors: an antagonist.' },
      reuptake: { agonist: 'An agonist binds to the receptors. This drug acts on reuptake, leaving more neurotransmitter in the synapse: a reuptake inhibitor.', antagonist: 'An antagonist blocks receptors and lowers the effect. Blocking reuptake raises it: a reuptake inhibitor.', none: 'Neurotransmitters are made by the body. This drug blocks reuptake: a reuptake inhibitor.' }
    };
    var order = ['agonist', 'antagonist', 'reuptake'].filter(function(k){ return k !== cls; });
    return [[all[cls][0], 'Right. ' + all[cls][1]]].concat(order.map(function(k){ return [all[k][0], slip[cls][k]]; }))
      .concat([['A neurotransmitter', slip[cls].none]]);
  }
  function genDrug(r, c){
    var real = c.real != null ? c.real : r() < 0.5, d, nt, cls, text, mech;
    if(real){
      var pool = DRUGS.filter(function(x){ return !c.nts || c.nts.indexOf(x.nt) > -1; });
      d = r.pick(pool); nt = d.nt; cls = d.cls; mech = d.mech;
      text = '<p>' + (c.lead ? c.lead + ' ' : '') + d.name + ' ' + mech + '.</p>';
    } else {
      cls = r.pick(['agonist', 'antagonist', 'reuptake']);
      var pool2 = NT_KEYS.filter(function(k){ return (cls !== 'reuptake' || NT[k].clear === 'reuptake' || /^reuptake/.test(NT[k].clear)) && (!c.nts || c.nts.indexOf(k) > -1); });
      nt = r.pick(pool2);
      var letter = r.pick(['K', 'M', 'R', 'T', 'V', 'Z']);
      mech = r.pick(DRUG_WORDS[cls]).replace(/\{nt\}/g, NT[nt].name.toLowerCase().replace('gaba', 'GABA'));
      text = '<p>' + (c.lead ? c.lead + ' ' : '') + 'In an invented lab study, Drug ' + letter + ' ' + mech + '.</p>';
    }
    var name = NT[nt].name.replace(/^GABA$/, 'GABA'), lower = nt === 'gaba' ? 'GABA' : NT[nt].name.toLowerCase();
    var more = CLASSES[cls].signal === 'more';
    var steps = [
      choice('cls', 'What kind of drug is it?', clsChoice(cls)),
      choice('signal', 'What happens to the effect of ' + lower + ' on the receiving neuron?', more ? [
        [cls === 'agonist' ? 'It increases: the receptors are activated more, as if there were more ' + lower + '.' : 'It increases: more ' + lower + ' stays in the synapse and keeps activating the receptors.', 'Right. ' + (cls === 'agonist' ? 'An agonist adds its own activation.' : 'Without reuptake the ' + lower + ' keeps acting.')],
        ['It decreases, because the receptors are blocked.', cls === 'agonist' ? 'That is an antagonist. An agonist activates the receptors.' : 'Blocking reuptake does not block receptors; it leaves more ' + lower + ' to act on them.'],
        ['Nothing changes, because the drug does not touch the receiving neuron.', cls === 'agonist' ? 'An agonist works right on the receiving neuron’s receptors.' : 'Even acting on the sending neuron, it changes how much ' + lower + ' reaches the receptors.'],
        ['The sending neuron stops firing action potentials.', 'The drug changes what happens at the synapse, not whether the sending neuron fires.']
      ] : [
        ['It decreases: fewer receptors can be activated by ' + lower + '.', 'Right. The receptors the drug occupies cannot respond to ' + lower + '.'],
        ['It increases, because the drug binds to the receptors.', 'Binding is not the same as activating. An antagonist binds without activating, so it blocks.'],
        ['It increases, because more ' + lower + ' stays in the synapse.', 'That is a reuptake inhibitor. This drug blocks receptors.'],
        ['The sending neuron stops firing action potentials.', 'The drug changes what happens at the receptors, not whether the sending neuron fires.']
      ])
    ];
    // which everyday function it touches
    var others = NT_KEYS.filter(function(k){ return k !== nt && NT[k].fn !== NT[nt].fn; });
    var wrong = M.shuffle(r, others).slice(0, 3);
    steps.push(choice('fn', name + ' mainly affects which of these?', [[cap(NT[nt].fn), 'Right. ' + NT[nt].does]].concat(wrong.map(function(k){ return [cap(NT[k].fn), 'That is ' + (k === 'gaba' ? 'GABA' : NT[k].name.toLowerCase()) + '. ' + NT[nt].name + ': ' + NT[nt].does.charAt(0).toLowerCase() + NT[nt].does.slice(1)]; }))));
    var sol = [
      'The drug ' + mech + ': ' + CLASSES[cls].name.toLowerCase() + ' (it ' + CLASSES[cls].does + ').',
      'So the effect of ' + lower + ' ' + (more ? 'increases' : 'decreases') + '. ' + NT[nt].does
    ];
    return { ctx: c.id, topic: c.topic, type: 'drug', text: text, steps: steps, solution: sol,
      given: { drug: real ? d.id : null, nt: nt, cls: cls }, figure: { kind: 'synapse', nt: nt, cls: cls } };
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* transmitter: which neurotransmitter fits. */
  var NT_CASES = [
    { id: 'naloxone', nt: 'endorphins', text: 'Naloxone (Narcan) can reverse an opioid overdose in minutes. It works by blocking the receptors that heroin and morphine act on. Those are the receptors for which natural neurotransmitter?' },
    { id: 'runner', nt: 'endorphins', text: 'Near the end of a long race, a runner feels less pain and a rush of well-being. Which neurotransmitter best explains it?' },
    { id: 'parkinson', nt: 'dopamine', text: 'A patient has a tremor and has trouble starting movements. The neurons that make one neurotransmitter in a movement pathway are dying. Which one?' },
    { id: 'reward', nt: 'dopamine', text: 'A gambler feels a rush each time the slot machine pays out, and keeps playing. Which neurotransmitter carries this reward signal?' },
    { id: 'ssri', nt: 'serotonin', text: 'A psychiatrist prescribes a medication for depression that keeps one neurotransmitter in the synapse longer. It is also involved in hunger and sleep. Which one?' },
    { id: 'myasthenia', nt: 'acetylcholine', text: 'In myasthenia gravis the immune system attacks receptors at the junction between nerves and muscles, so the muscles tire and weaken. Receptors for which neurotransmitter?' },
    { id: 'alzheimer', nt: 'acetylcholine', text: 'In Alzheimer’s disease, neurons that make one neurotransmitter are among the first lost, and memory fails. Which neurotransmitter, also needed for muscle contraction?' },
    { id: 'seizure', nt: 'gaba', text: 'A patient has seizures. A medication that boosts the brain’s main inhibitory neurotransmitter calms them. Which neurotransmitter?' },
    { id: 'alcohol', nt: 'gaba', text: 'After two drinks, Jordan feels relaxed and less anxious. Alcohol (among other effects) boosts the brain’s main inhibitory neurotransmitter. Which one?' },
    { id: 'learning', nt: 'glutamate', text: 'Strengthening synapses during learning depends on the brain’s main excitatory neurotransmitter. Which one?' },
    { id: 'migraine', nt: 'glutamate', text: 'Too much of one neurotransmitter can overexcite neurons and is linked with migraines and seizures. Which one, the brain’s main excitatory messenger?' },
    { id: 'alert', nt: 'norepinephrine', text: 'A loud crash at night jolts Sam awake: heart pounding, fully alert. Which neurotransmitter, part of the fight-or-flight response, raises this alertness?' },
    { id: 'pain', nt: 'substanceP', text: 'Kai stubs a toe. Which neurotransmitter carries the pain signal from the injury to the spinal cord and brain?' }
  ];
  function genTransmitter(r, c){
    var pool = NT_CASES.filter(function(x){ return !c.cases || c.cases.indexOf(x.id) > -1; }), cs = r.pick(pool), nt = cs.nt;
    var confusable = { endorphins: ['substanceP', 'dopamine', 'serotonin'], substanceP: ['endorphins', 'glutamate', 'acetylcholine'], dopamine: ['serotonin', 'acetylcholine', 'norepinephrine'], serotonin: ['dopamine', 'norepinephrine', 'gaba'], acetylcholine: ['dopamine', 'glutamate', 'gaba'], gaba: ['glutamate', 'serotonin', 'endorphins'], glutamate: ['gaba', 'acetylcholine', 'dopamine'], norepinephrine: ['serotonin', 'dopamine', 'gaba'] }[nt];
    var nm = function(k){ return NT[k].name; };
    var steps = [choice('nt', cs.text, [[nm(nt), 'Right. ' + NT[nt].does]].concat(confusable.map(function(k){ return [nm(k), nm(k) + ' is about ' + NT[k].fn + '. ' + nm(nt) + ' fits here: ' + NT[nt].does.charAt(0).toLowerCase() + NT[nt].does.slice(1)]; })))];
    var lower = nt === 'gaba' ? 'GABA' : nm(nt).toLowerCase();
    var cls = r.pick(['agonist', 'antagonist']);
    steps.push(choice('drugnt', 'A drug that ' + (cls === 'agonist' ? 'activates' : 'blocks') + ' ' + lower + ' receptors would ' + (cls === 'agonist' ? 'act as' : 'be') + ' what kind of drug?', clsChoice(cls)));
    var sol = [nm(nt) + ': ' + NT[nt].does + ' ' + NT[nt].low, 'A drug that ' + (cls === 'agonist' ? 'activates' : 'blocks') + ' its receptors is ' + (cls === 'agonist' ? 'an agonist' : 'an antagonist') + '.'];
    return { ctx: c.id, topic: c.topic, type: 'transmitter', text: '<p>' + (c.lead ? c.lead + ' ' : '') + 'Read the case, then name the neurotransmitter.</p>', steps: steps, solution: sol,
      given: { case: cs.id, nt: nt, cls: cls }, figure: { kind: 'synapse', nt: nt, cls: 'none' } };
  }

  /* parts: the neuron's parts, glia, myelin and the reflex arc. */
  var PARTS = {
    dendrite: { name: 'Dendrites', does: 'receive messages from other neurons' },
    soma: { name: 'Cell body (soma)', does: 'holds the nucleus and keeps the cell alive; sums up incoming signals' },
    axon: { name: 'Axon', does: 'carries the action potential away from the cell body' },
    myelin: { name: 'Myelin sheath', does: 'insulates the axon and speeds the action potential along' },
    terminal: { name: 'Axon terminals', does: 'release neurotransmitter into the synapse' },
    glia: { name: 'Glial cells', does: 'support, nourish and protect neurons (and make myelin)' }
  };
  var PART_CASES = [
    { id: 'ms', part: 'myelin', text: 'In multiple sclerosis (MS), the immune system damages a part of neurons, so signals travel slowly and patients have numbness and weakness. Which part is damaged?' },
    { id: 'receive', part: 'dendrite', text: 'A neuron in the visual cortex receives messages from thousands of other neurons. Which branching part takes in most of these messages?' },
    { id: 'release', part: 'terminal', text: 'An action potential reaches the end of a neuron, and neurotransmitter is released into the synapse. From which part?' },
    { id: 'carry', part: 'axon', text: 'An action potential travels from a motor neuron in the spinal cord all the way to a muscle in the foot. Along which part does it travel?' },
    { id: 'support', part: 'glia', text: 'Most cells in the brain are not neurons. They hold neurons in place, supply nutrients, clean up waste and form myelin. What are they called?' },
    { id: 'sum', part: 'soma', text: 'Signals from many dendrites meet in one part of the neuron, which also contains the nucleus. Which part?' }
  ];
  function genParts(r, c){
    var cs = r.pick(PART_CASES.filter(function(x){ return !c.cases || c.cases.indexOf(x.id) > -1; })), key = cs.part;
    var wrong = M.shuffle(r, Object.keys(PARTS).filter(function(k){ return k !== key; })).slice(0, 3);
    var steps = [choice('part', cs.text, [[PARTS[key].name, 'Right. The ' + PARTS[key].name.toLowerCase().replace(' (soma)', '') + ' ' + PARTS[key].does + '.']].concat(wrong.map(function(k){ return [PARTS[k].name, 'The ' + PARTS[k].name.toLowerCase().replace(' (soma)', '') + ' ' + PARTS[k].does + '. Here the part that fits ' + PARTS[key].does + '.']; })))];
    steps.push(choice('next', 'You touch a hot pan and pull your hand back before you feel the pain. Which path does this reflex take?', [
      ['Sensory neuron to an interneuron in the spinal cord to a motor neuron.', 'Right. The reflex arc loops through the spinal cord, so the hand moves before the message reaches the brain.'],
      ['Sensory neuron to the brain, which decides, then to a motor neuron.', 'That would be slower. A reflex is handled in the spinal cord; the brain learns about the pain a moment later.'],
      ['Motor neuron to an interneuron to a sensory neuron.', 'That runs backwards: the message starts in a sensory neuron and ends in a motor neuron.'],
      ['Straight from the skin to the muscle, with no neurons.', 'Neurons carry every step: sensory, interneuron, motor.']
    ]));
    return { ctx: c.id, topic: c.topic, type: 'parts', text: '<p>' + (c.lead ? c.lead + ' ' : '') + 'Read the case, then name the part.</p>', steps: steps, solution: [PARTS[key].name + ': ' + PARTS[key].does + '.', 'A reflex arc: sensory neuron, interneuron in the spinal cord, motor neuron.'],
      given: { case: cs.id, part: key }, figure: { kind: 'neuron', part: key } };
  }

  var GEN = { trace: genTrace, drug: genDrug, transmitter: genTransmitter, parts: genParts };
  M.register('neuron', {
    REST: REST, THRESH: THRESH, PEAK: PEAK, UNDER: UNDER, ABS: ABS, REL: REL, DT: DT,
    simulate: simulate, wave: wave, threshAt: threshAt, needed: needed, rate: rate, series: series,
    NT: NT, NT_KEYS: NT_KEYS, CLASSES: CLASSES, DRUGS: DRUGS, drugById: drugById, exampleOf: exampleOf,
    SYN: SYN, synapse: synapse, signalPct: signalPct,
    NT_CASES: NT_CASES, PARTS: PARTS, PART_CASES: PART_CASES,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
