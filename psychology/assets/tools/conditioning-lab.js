/* Conditioning lab trainer page (docs/appsych-spec.md section 6). OWNED BY
   THIS TOOL ONLY (builder T3). Mounts into #app with ApPsychTools.mount; the
   model is ApPsychMath.conditioningLab
   (psychology/assets/tools/math/conditioning-lab.js), the content
   psychology/data/tools/conditioning-lab.json (served filtered as
   assets/tool-data/conditioning-lab.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: one stage, three scenes (the Scene switch), drawn at the stage's
   size (a box at most 760 units wide, so large screens scale it up):
     Classical     a dog in profile, a speaker and a food dish over the
                   record of every trial. "Tone + food" pairs them, "Tone
                   alone" tests the tone, "Rest a day" pauses. The tone's
                   waves, the food and the drops of saliva (counted into a
                   measuring tube) show the last trial; the labels on the
                   scene change as the tone goes from neutral stimulus to CS
                   and the drops from UCR to CR. The record below shades
                   acquisition, extinction and the rest.
     Schedules     a Skinner box (lever, light, food tray, a rat) over its
                   cumulative record. Choose a schedule (FR, VR, FI, VI) and
                   Play: 10 simulated minutes run in about 8 seconds, the
                   rat presses, pellets drop, the record climbs one step per
                   press with each reward ticked. The record is scaled to
                   the schedule, so its shape shows (FR stair steps, FI
                   scallops), and a close-up magnifies the last two
                   minutes with the mark named (pause and run, slow and
                   fast, no pauses). The other three schedules can be shown
                   faint for comparison (More options), all on one scale.
     Consequences  the example drawn in three panels: the behavior, the
                   consequence (it appears when added; it fades and is
                   crossed out when removed; pleasant or unpleasant) and
                   how often the behavior happens on the days after. Below,
                   operant conditioning's four quadrants with the answer lit.
   Colors by role: the course cerulean for the learned (CS, CR, the record);
   vermillion for the unlearned (UCS, UCR, food) and the rewards; every label
   also written. Reduced motion: Play shows the whole record at once, no
   falling drops.
   Test yourself: ApPsychTools.drill over the model's generate(), with a
   figure from the problem's own numbers (the classical record from
   ApPsychPlot), the scenario labels, the four record shapes, or the
   operant quadrant. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
  if(!T || !M || !M.conditioningLab || M.conditioningLab.stub) return;
  var CL = M.conditioningLab, S = M.Stats(), esc = T.esc;
  var VIEWS = [{ v: 'cc', label: 'Classical' }, { v: 'op', label: 'Schedules' }, { v: 'cq', label: 'Consequences' }];
  var MIN = 10, PLAY_S = 8;
  var MEAS = null;
  function tw(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 800) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.58; }
  }
  function txt(x, y, s, cls, anchor){ return '<text class="' + cls + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'middle') + '">' + esc(s) + '</text>'; }
  function tag(x, y, s, cls, anchor){
    var w = tw(s, 12.5, 900) + 16, x0 = anchor === 'end' ? x - w : anchor === 'start' ? x : x - w / 2;
    return '<g class="cl-tag ' + (cls || '') + '"><rect x="' + x0.toFixed(1) + '" y="' + (y - 15).toFixed(1) + '" width="' + w.toFixed(1) + '" height="22" rx="11"/>' + txt(x0 + w / 2, y + 0.5, s, 'cl-tagt') + '</g>';
  }
  function r0(x){ return String(Math.round(x)); }

  /* Room kept clear at the stage's foot on a phone for the Enlarge button (bottom right, about 48 px). */
  var ENL = 46;
  T.mount('conditioning-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'conditioning-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* --------------------------------------------------- illustrations */
  /* A dog's head in profile, facing right, at (x, y) scale k. */
  function dog(x, y, k, open){
    return '<g class="cl-dog" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')">' +
      '<path class="cl-dog-neck" d="M-62 40 C-70 80 -58 120 -40 128 L40 128 C34 100 30 72 22 52 Z"/>' +
      '<path class="cl-dog-head" d="M-46 -6 C-46 -44 -8 -60 22 -52 C44 -46 54 -30 58 -14 L92 -8 C110 -5 118 6 116 18 C114 30 104 36 90 36 L52 38 C40 52 14 60 -10 56 C-36 52 -48 30 -46 -6 Z"/>' +
      '<path class="cl-dog-ear" d="M-18 -46 C-44 -50 -66 -30 -64 4 C-62 30 -50 44 -40 40 C-30 34 -24 10 -16 -10 C-12 -22 -10 -38 -18 -46 Z"/>' +
      '<circle class="cl-dog-eye" cx="34" cy="-20" r="5.5"/><circle class="cl-dog-glint" cx="35.8" cy="-21.8" r="1.6"/>' +
      '<path class="cl-dog-brow" d="M26 -32 Q35 -36 44 -31"/>' +
      '<ellipse class="cl-dog-nose" cx="112" cy="6" rx="9" ry="7"/>' +
      (open ? '<path class="cl-dog-mouth" d="M60 30 Q86 44 104 30 L104 34 Q86 54 60 36 Z"/><path class="cl-dog-tongue" d="M70 38 Q82 50 94 40 Q86 46 74 42 Z"/>' : '<path class="cl-dog-lip" d="M58 30 Q84 38 104 28"/>') +
      '<path class="cl-dog-collar" d="M-58 70 C-30 84 8 84 30 72 L32 84 C8 96 -32 96 -60 82 Z"/><circle class="cl-dog-tagc" cx="-14" cy="92" r="6"/>' +
      '</g>';
  }
  /* A speaker facing right, with n sound arcs. */
  function speaker(x, y, k, on){
    var g = '<g class="cl-spk" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')"><rect class="cl-spk-box" x="-18" y="-12" width="14" height="24" rx="3"/><path class="cl-spk-cone" d="M-4 -12 L14 -26 L14 26 L-4 12 Z"/>';
    if(on) for(var i = 0; i < 3; i++) g += '<path class="cl-wave' + (on === 2 ? ' is-anim' : '') + '" style="animation-delay:' + (i * 0.12) + 's" d="M' + (22 + i * 10) + ' -' + (14 + i * 7) + ' Q' + (30 + i * 12) + ' 0 ' + (22 + i * 10) + ' ' + (14 + i * 7) + '"/>';
    return g + '</g>';
  }
  /* A food dish. */
  function dish(x, y, k, full){
    return '<g class="cl-dish" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + k.toFixed(3) + ')">' + (full ? '<ellipse class="cl-food" cx="0" cy="-8" rx="26" ry="9"/><circle class="cl-food2" cx="-10" cy="-12" r="5"/><circle class="cl-food2" cx="6" cy="-14" r="5.5"/><circle class="cl-food2" cx="14" cy="-9" r="4.5"/>' : '') +
      '<path class="cl-dish-bowl" d="M-36 -6 L36 -6 L28 12 L-28 12 Z"/><rect class="cl-dish-rim" x="-38" y="-9" width="76" height="6" rx="3"/></g>';
  }
  /* The Skinner box: lever on the left wall, a light above, the food tray, a rat. */
  function skinner(x, y, w, h, press, pellet, light){
    var g = [], fl = y + h - 16, rx = x + w * 0.42, ry = fl - 2;
    g.push('<rect class="cl-box" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="10"/>');
    g.push('<rect class="cl-box-wall" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (w * 0.2).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="10"/>');
    for(var i = 1; i < 14; i++){ var gx = x + w * 0.2 + (w * 0.8) * i / 14; g.push('<line class="cl-grid-bar" x1="' + gx.toFixed(1) + '" x2="' + gx.toFixed(1) + '" y1="' + fl + '" y2="' + (y + h - 4) + '"/>'); }
    g.push('<line class="cl-floor" x1="' + x.toFixed(1) + '" x2="' + (x + w).toFixed(1) + '" y1="' + fl + '" y2="' + fl + '"/>');
    var lx = x + w * 0.2, ly = y + h * 0.5;
    g.push('<circle class="cl-light' + (light ? ' is-on' : '') + '" cx="' + (lx - w * 0.1).toFixed(1) + '" cy="' + (y + h * 0.2).toFixed(1) + '" r="' + Math.max(5, w * 0.03).toFixed(1) + '"/>');
    g.push('<rect class="cl-lever" x="' + lx.toFixed(1) + '" y="' + (ly + (press ? 4 : 0)).toFixed(1) + '" width="' + (w * 0.09).toFixed(1) + '" height="6" rx="3" transform="rotate(' + (press ? 14 : 0) + ' ' + lx.toFixed(1) + ' ' + ly.toFixed(1) + ')"/>');
    var tx = x + w * 0.1, ty = fl - 6;
    g.push('<path class="cl-tray" d="M' + (tx - w * 0.07).toFixed(1) + ' ' + (ty - 8) + ' h' + (w * 0.14).toFixed(1) + ' l-6 10 h-' + (w * 0.14 - 12).toFixed(1) + ' Z"/>');
    if(pellet) g.push('<circle class="cl-pellet" cx="' + tx.toFixed(1) + '" cy="' + (ty - 10) + '" r="4"/>');
    // the rat, facing the lever (left)
    var k = Math.min(w / 260, h / 150);
    g.push('<g class="cl-rat" transform="translate(' + (lx + w * 0.2).toFixed(1) + ' ' + ry.toFixed(1) + ') scale(' + k.toFixed(3) + ')">' +
      '<path class="cl-rat-tail" d="M58 -14 C90 -12 104 6 128 -4"/>' +
      '<path class="cl-rat-body" d="M-34 -22 C-30 -44 6 -54 36 -46 C60 -40 70 -22 64 -6 C60 6 30 6 0 4 C-20 4 -36 -6 -34 -22 Z"/>' +
      '<path class="cl-rat-head" d="M-30 -30 C-46 -38 -62 -34 -76 -' + (press ? 34 : 24) + ' C-66 -' + (press ? 22 : 14) + ' -48 -10 -30 -12 Z"/>' +
      '<circle class="cl-rat-ear" cx="-36" cy="-38" r="8"/><circle class="cl-rat-eye" cx="-52" cy="-' + (press ? 32 : 26) + '" r="2.6"/>' +
      '<path class="cl-rat-paw" d="M' + (press ? '-58 -44 L-74 -58' : '-28 0 L-30 4') + '"/><path class="cl-rat-paw" d="M20 2 L18 6"/>' +
      '</g>');
    return g.join('');
  }


  /* Consequences: what each example's behavior and consequence look like.
     Keyed by the model's behavior text; nice = the consequence is pleasant. */
  var CQ_ICONS = {
    'buckles the seatbelt': { b: 'belt', c: 'beep', nice: false },
    'cleans her room': { b: 'broom', c: 'screen', nice: true },
    'texts during class': { b: 'texting', c: 'phone', nice: true },
    'talks back': { b: 'talk', c: 'chores', nice: false },
    'takes an aspirin for a headache': { b: 'pill', c: 'headache', nice: false },
    'finishes homework early': { b: 'homework', c: 'nag', nice: false },
    'touches the hot stove': { b: 'stove', c: 'burn', nice: false },
    'comes home after curfew': { b: 'curfew', c: 'keys', nice: true },
    'answers a question in class': { b: 'hand', c: 'praise', nice: true },
    'leaves a dirty dish on the table': { b: 'dish', c: 'note', nice: false }
  };
  /* Each drawing fills about -50..50 around the origin. */
  function bubble(x, y, w, h, tail, words, cls){
    var t = tail === 'l' ? 'M' + (x + 12) + ' ' + (y + h) + ' l-8 12 l20 -12' : 'M' + (x + w - 22) + ' ' + (y + h) + ' l12 12 l-2 -12';
    return '<g class="cl-ib ' + (cls || '') + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/><path d="' + t + '"/>' + words.map(function(wd, i){ return '<text x="' + (x + w / 2) + '" y="' + (y + 16 + i * 14) + '" text-anchor="middle">' + esc(wd) + '</text>'; }).join('') + '</g>';
  }
  function phoneArt(chat){
    return '<rect class="cl-i" x="-22" y="-44" width="44" height="86" rx="8"/><rect class="cl-i-scr" x="-17" y="-34" width="34" height="62" rx="3"/><circle class="cl-i-dk" cx="0" cy="36" r="3"/>' +
      (chat ? '<rect class="cl-i-acc" x="-14" y="-28" width="22" height="10" rx="4"/><rect class="cl-i-lt" x="-6" y="-14" width="20" height="10" rx="4"/><rect class="cl-i-acc" x="-14" y="0" width="16" height="10" rx="4"/>' : '<rect class="cl-i-lt" x="-12" y="-24" width="24" height="5" rx="2"/><rect class="cl-i-lt" x="-12" y="-14" width="18" height="5" rx="2"/>');
  }
  function handArt(){
    return '<g class="cl-i-skin"><rect x="-20" y="-6" width="40" height="44" rx="12"/><rect x="-20" y="-42" width="9" height="42" rx="4.5"/><rect x="-9" y="-50" width="9" height="50" rx="4.5"/><rect x="2" y="-46" width="9" height="46" rx="4.5"/><rect x="13" y="-36" width="8" height="38" rx="4"/><path d="M-20 18 C-34 10 -38 0 -32 -6 C-26 -10 -20 0 -16 6 Z"/></g>';
  }
  var ICON = {
    none: function(){ return ''; },
    belt: function(){ return '<path class="cl-i" d="M-30 -46 C-14 -50 -6 -44 -8 -30 L-14 22 L30 22 C38 22 40 30 38 38 L-30 38 C-38 38 -40 30 -38 22 Z"/><path class="cl-i-belt" d="M-4 -40 L26 18"/><path class="cl-i-belt" d="M-30 26 L20 26"/><rect class="cl-i-dk" x="18" y="16" width="16" height="16" rx="3"/><path class="cl-i-click" d="M40 6 l8 -6 M42 18 h10 M40 30 l8 6"/>'; },
    broom: function(){ return '<line class="cl-i-stick" x1="-30" y1="-48" x2="12" y2="18"/><path class="cl-i-brm" d="M2 12 L24 0 L44 34 L20 46 Z"/><path class="cl-i-line" d="M10 20 L28 42 M18 14 L34 38"/><circle class="cl-i-dust" cx="-30" cy="40" r="3"/><circle class="cl-i-dust" cx="-20" cy="44" r="2.4"/><circle class="cl-i-dust" cx="-38" cy="44" r="2"/>'; },
    texting: function(){ return phoneArt(true) + '<path class="cl-i-click" d="M28 -30 l8 -6 M30 -18 h10"/>'; },
    phone: function(){ return phoneArt(false); },
    talk: function(){ return '<circle class="cl-i-skin" cx="-16" cy="12" r="26"/><path class="cl-i-line" d="M-30 0 l10 4 M-2 0 l-10 4"/><path class="cl-i-line" d="M-26 24 Q-16 18 -6 24"/>' + bubble(4, -48, 46, 30, 'l', ['No!'], 'is-alt'); },
    pill: function(){ return '<path class="cl-i-glass" d="M6 -36 L44 -36 L38 40 L12 40 Z"/><path class="cl-i-water" d="M9 -10 L41 -10 L38 37 L12 37 Z"/><g transform="rotate(-30 -22 10)"><rect class="cl-i" x="-40" y="0" width="36" height="18" rx="9"/><path class="cl-i-alt" d="M-22 0 h9 a9 9 0 0 1 0 18 h-9 Z"/></g>'; },
    homework: function(){ return '<rect class="cl-i" x="-40" y="-34" width="56" height="74" rx="4"/><path class="cl-i-line" d="M-32 -16 h40 M-32 -4 h40 M-32 8 h40 M-32 20 h28"/><path class="cl-i-check" d="M-28 -28 l6 6 l12 -12"/><circle class="cl-i" cx="32" cy="-26" r="17"/><path class="cl-i-line" d="M32 -36 V-26 L39 -22"/>'; },
    stove: function(){ return '<rect class="cl-i" x="-46" y="4" width="92" height="40" rx="5"/><ellipse class="cl-i-hot" cx="-18" cy="4" rx="22" ry="7"/><ellipse class="cl-i-dk" cx="22" cy="4" rx="18" ry="6"/><path class="cl-i-heat" d="M-28 -8 q-4 -8 0 -16 M-18 -8 q-4 -8 0 -16 M-8 -8 q-4 -8 0 -16"/><g transform="translate(-14 -36) rotate(150) scale(.5)">' + handArt() + '</g>'; },
    curfew: function(){ return '<path class="cl-i" d="M-40 0 L-6 -28 L28 0 V40 H-40 Z"/><rect class="cl-i-lit" x="-30" y="8" width="14" height="12"/><rect class="cl-i-dk" x="-4" y="14" width="14" height="26"/><path class="cl-i-moon" d="M34 -46 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22 Z"/><circle class="cl-i" cx="38" cy="18" r="13"/><path class="cl-i-line" d="M38 10 V18 L43 22"/>'; },
    hand: function(){ return handArt() + '<path class="cl-i-click" d="M-34 -40 l-8 -6 M30 -46 l8 -6 M-2 -58 v-8"/>'; },
    dish: function(){ return '<ellipse class="cl-i" cx="0" cy="10" rx="44" ry="18"/><ellipse class="cl-i-lt" cx="0" cy="8" rx="28" ry="10"/><circle class="cl-i-crumb" cx="-8" cy="6" r="3.5"/><circle class="cl-i-crumb" cx="8" cy="10" r="3"/><circle class="cl-i-crumb" cx="2" cy="2" r="2.4"/><path class="cl-i-smear" d="M-20 8 q8 -6 16 0"/><path class="cl-i-line" d="M-30 -38 L-12 -4 M-34 -36 l4 8 M-26 -40 l4 8"/>'; },
    beep: function(){ return '<g transform="translate(-14 0) scale(1.6)"><rect class="cl-i-dk2" x="-18" y="-12" width="14" height="24" rx="3"/><path class="cl-i" d="M-4 -12 L14 -26 L14 26 L-4 12 Z"/></g><path class="cl-i-wave" d="M18 -22 Q28 0 18 22 M30 -32 Q44 0 30 32 M42 -42 Q60 0 42 42"/><text class="cl-i-word" x="-10" y="-40" text-anchor="middle">BEEP</text>'; },
    screen: function(){ return '<rect class="cl-i" x="-44" y="-34" width="88" height="60" rx="6"/><rect class="cl-i-scr" x="-38" y="-28" width="76" height="48" rx="3"/><path class="cl-i-play" d="M-8 -16 L12 -4 L-8 8 Z"/><rect class="cl-i-dk" x="-10" y="26" width="20" height="10"/><text class="cl-i-word" x="0" y="50" text-anchor="middle">+30 min</text>'; },
    chores: function(){ return '<rect class="cl-i" x="-40" y="-44" width="58" height="84" rx="5"/><rect class="cl-i-dk" x="-24" y="-50" width="26" height="12" rx="3"/><path class="cl-i-line" d="M-30 -24 h36 M-30 -8 h36 M-30 8 h36 M-30 24 h30"/><path class="cl-i-bucket" d="M20 0 h28 l-4 40 h-20 Z"/><path class="cl-i-line" d="M22 0 q12 -16 24 0"/>'; },
    headache: function(){ return '<circle class="cl-i-skin" cx="-6" cy="8" r="32"/><path class="cl-i-line" d="M-20 2 l8 4 M8 2 l-8 4 M-16 24 q10 -6 20 0"/><path class="cl-i-bolt" d="M18 -46 L6 -22 L18 -22 L8 0 L32 -28 L20 -28 L30 -46 Z"/>'; },
    nag: function(){ return bubble(-48, -40, 96, 44, 'r', ['Do your', 'homework!'], 'is-alt') + bubble(-36, 14, 70, 26, 'l', ['Now!'], 'is-alt'); },
    burn: function(){ return '<g transform="scale(.95)">' + handArt() + '</g><ellipse class="cl-i-burn" cx="0" cy="8" rx="13" ry="10"/><path class="cl-i-pain" d="M-34 -10 l-12 -4 M-34 4 h-13 M30 -10 l12 -4 M30 4 h13"/>'; },
    keys: function(){ return '<circle class="cl-i-ring" cx="-20" cy="-22" r="16"/><rect class="cl-i-dk" x="-12" y="-10" width="24" height="30" rx="8"/><rect class="cl-i-key" x="-4" y="18" width="8" height="34" rx="2"/><path class="cl-i-key" d="M4 30 h6 v6 h-6 Z M4 42 h8 v6 h-8 Z"/><circle class="cl-i-lt" cx="0" cy="2" r="4"/>'; },
    praise: function(){ return bubble(-48, -38, 96, 44, 'l', ['Great', 'answer!'], 'is-acc') + '<path class="cl-i-star" d="M30 14 l5 10 l11 1.5 l-8 7.5 l2 11 l-10 -5.5 l-10 5.5 l2 -11 l-8 -7.5 l11 -1.5 Z"/>'; },
    note: function(){ return '<path class="cl-i-paper" d="M-36 -44 H28 L40 -32 V44 H-36 Z"/><path class="cl-i-angry" d="M-24 -26 h44 M-24 -12 h36 M-24 2 h44"/><text class="cl-i-word is-alt" x="2" y="32" text-anchor="middle">Dishes!!</text>'; }
  };

  /* The first-run tip sits just above its target; an empty slot is opened
     there while the tip shows, so it never covers another control. */

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var view = 'cc', LS = null, touched = false, nid = T.nid('cl');
    var trials = [], last = null;
    var sk = 'fr', seed = 7, sess = CL.session(sk, seed, MIN), tNow = MIN * 60, anim = null, compare = false;
    var cq = 0, cqAnim = false, cqT = null;
    function cqGo(){ cqAnim = true; clearTimeout(cqT); cqT = setTimeout(function(){ cqAnim = false; }, 1600); }
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem cl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Conditioning lab</h2>' +
      '<div class="cl-fig"><svg class="cl-svg" xmlns="http://www.w3.org/2000/svg" role="img"></svg></div>' +
      '<div class="cl-ctl">' +
        '<div class="ls-seg cl-views" role="group" aria-label="Scene">' + VIEWS.map(function(v){ return '<button type="button" data-v="' + v.v + '" aria-pressed="false">' + v.label + '</button>'; }).join('') + '</div>' +
        '<div class="cl-grp cl-grp-cc"><div class="cl-trial" role="group" aria-label="Run a trial"><button type="button" class="btn-press sm ls-btn ls-pri cl-pair">Tone + food</button><button type="button" class="bt-btn cl-tone">Tone alone</button><button type="button" class="bt-btn cl-rest">Rest a day</button></div></div>' +
        '<div class="cl-grp cl-grp-op"><div class="ls-seg cl-scheds" role="group" aria-label="Schedule">' + CL.SCHEDULES.map(function(s){ return '<button type="button" data-k="' + s.k + '" aria-pressed="false">' + s.short + '</button>'; }).join('') + '</div><div class="cl-go"><button type="button" class="btn-press sm ls-btn ls-pri cl-play">Play 10 minutes</button></div></div>' +
        '<div class="cl-grp cl-grp-cq"><div class="cl-exrow"><button type="button" class="bt-btn cl-prev" aria-label="Previous example">‹</button><div class="cl-exsel"></div><button type="button" class="bt-btn cl-next" aria-label="Next example">›</button></div></div>' +
      '</div>' +
      '<div class="cl-say"></div>' +
      T.moreHtml('<div class="cl-o cl-o-cc"><div class="cl-row2"><button type="button" class="bt-btn cl-demo">Run the classic demo</button><button type="button" class="bt-btn cl-reset">Start over</button></div><p class="bt-small">The demo runs 10 pairings, 10 tone-alone trials, a rest, then 3 more tone-alone trials.</p></div>' +
        '<div class="cl-o cl-o-op"><label class="bt-radio cl-opt"><input type="checkbox" class="cl-cmp"> Show the other three schedules, faint</label><button type="button" class="bt-btn cl-newrat">A new session</button></div><div class="cl-o cl-o-cq"></div>', 'demo, comparison') +
      '<div class="cl-nums"></div><p class="sr-only cl-live"></p></section>';
    var say = T.announcer($('.cl-live'));
    var cue = T.cue('Press Tone + food a few times and watch the dog learn.');
    $('.cl-ctl').insertBefore(cue.el, $('.cl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.cl-svg');
    var selEx = T.choiceSelect({ label: 'Example', value: '0', options: CL.OPERANT.map(function(o, i){ return { value: String(i), label: o.who + ' ' + o.b }; }), onChange: function(v){ act(); cq = +v; cqGo(); sync(); redraw(); say(cqLine()); } });
    $('.cl-exsel').appendChild(selEx.el);

    function onClick(e){
      var b = e.target.closest('.cl-views button'); if(b){ setView(b.getAttribute('data-v')); return; }
      if(e.target.closest('.cl-pair')){ act(); trial('pair'); return; }
      if(e.target.closest('.cl-tone')){ act(); trial('tone'); return; }
      if(e.target.closest('.cl-rest')){ act(); trial('rest'); return; }
      if(e.target.closest('.cl-demo')){ act(); trials = []; ['pair', 'pair', 'pair', 'pair', 'pair', 'pair', 'pair', 'pair', 'pair', 'pair', 'tone', 'tone', 'tone', 'tone', 'tone', 'tone', 'tone', 'tone', 'tone', 'tone', 'rest', 'tone', 'tone', 'tone'].forEach(function(t){ trials.push(t); }); last = { kind: 'tone', anim: false }; redraw(); say(ccLine()); return; }
      if(e.target.closest('.cl-reset')){ act(); trials = []; last = null; redraw(); say('Start over: the tone is a neutral stimulus again.'); return; }
      var s = e.target.closest('.cl-scheds button'); if(s){ act(); stopAnim(); sk = s.getAttribute('data-k'); sess = CL.session(sk, seed, MIN); tNow = MIN * 60; sync(); redraw(); say(opLine()); return; }
      if(e.target.closest('.cl-play')){ act(); play(); return; }
      if(e.target.closest('.cl-newrat')){ act(); stopAnim(); seed = 1 + Math.floor(Math.random() * 99998); sess = CL.session(sk, seed, MIN); tNow = MIN * 60; redraw(); say(opLine()); return; }
      var nx = e.target.closest('.cl-prev, .cl-next'); if(nx){ act(); cq = (cq + (nx.classList.contains('cl-next') ? 1 : CL.OPERANT.length - 1)) % CL.OPERANT.length; cqGo(); selEx.set(String(cq)); sync(); redraw(); say(cqLine()); return; }
    }
    host.addEventListener('click', onClick);
    $('.cl-cmp').addEventListener('change', function(e){ compare = e.target.checked; redraw(); });
    function trial(k){
      if(trials.length >= 40) trials.shift();
      trials.push(k); last = { kind: k, anim: !T.reduced() }; redraw(); say(ccLine());
      setTimeout(function(){ if(last) last.anim = false; }, 1200);
    }
    function setView(v){
      if(v === view) return;
      act(); stopAnim(); view = v; sync(); redraw();
      say({ cc: 'Classical conditioning. ', op: 'Reinforcement schedules. ', cq: 'Consequences. ' }[v] + line());
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.cl-views button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === view)); });
      ['cc', 'op', 'cq'].forEach(function(k){ var g = $('.cl-grp-' + k), o = $('.cl-o-' + k); if(g) g.hidden = k !== view; if(o) o.hidden = k !== view; });
      root.querySelectorAll('.cl-scheds button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === sk)); });
      var pl = $('.cl-play'); if(pl) pl.textContent = anim ? 'Pause' : tNow < MIN * 60 ? 'Play' : 'Play 10 minutes';
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'cc' ? trials.length + ' trial' + (trials.length === 1 ? '' : 's') : view === 'op' ? (compare ? 'Comparing all four' : CL.schedOf(sk).name) : 'Four quadrants');
    }

    /* ---------------------------------------------------- the session */
    function stopAnim(){ if(anim){ anim.stop(); anim = null; } sync(); }
    function play(){
      if(anim){ stopAnim(); return; }
      var t0 = tNow >= MIN * 60 ? 0 : tNow;
      anim = P.loop(function(dt, t){ tNow = Math.min(MIN * 60, t0 + t / PLAY_S * MIN * 60); redraw(); return tNow < MIN * 60; },
        { duration: PLAY_S * (1 - t0 / (MIN * 60)), still: function(){ tNow = MIN * 60; redraw(); }, onEnd: function(){ anim = null; tNow = MIN * 60; sync(); redraw(); say(opLine()); } });
      tNow = t0; sync(); anim.start();
      if(!anim) return;
    }

    /* ------------------------------------------------ numbers and words */
    /* Did the first tone after the rest bring more drops than the last one before it? */
    function recoveredNow(st){
      var r = trials.lastIndexOf('rest');
      return r < 1 || st.cr[trials.length - 1] > st.cr[r - 1] + 0.05;
    }
    function ccState(){
      var r = CL.classical(trials), v = r.v, n = trials.length;
      var nPair = trials.filter(function(t){ return t === 'pair'; }).length, V = n ? v[n - 1] : 0;
      var phase = 'none';
      if(n){
        var k = trials[n - 1];
        if(k === 'pair') phase = 'acq';
        else if(k === 'rest') phase = 'rest';
        else { var prev = trials.slice(0, n - 1), lastRest = prev.lastIndexOf('rest'), lastPair = prev.lastIndexOf('pair'); phase = lastRest > lastPair && prev.slice(lastRest + 1).indexOf('tone') < 0 ? 'rec' : nPair ? 'ext' : 'nolearn'; }
      }
      return { v: v, cr: r.cr, V: V, nPair: nPair, phase: phase, learned: V >= 0.25, crNow: CL.MAXCR * V };
    }
    function ccLine(){
      var st = ccState(), k = trials[trials.length - 1];
      if(!trials.length) return 'No trials yet. The tone is a neutral stimulus.';
      if(k === 'rest') return 'A day of rest. Sound the tone alone to test for spontaneous recovery.';
      return 'Trial ' + trials.filter(function(t){ return t !== 'rest'; }).length + ', ' + (k === 'pair' ? 'tone and food' : 'tone alone') + ': about ' + r0(st.crNow) + ' drops to the tone.';
    }
    function opDone(){ var n = 0, w = 0; sess.presses.forEach(function(t){ if(t <= tNow) n++; }); sess.rewards.forEach(function(t){ if(t <= tNow) w++; }); return { n: n, w: w }; }
    function opLine(){ var d = opDone(), sc = CL.schedOf(sk); return sc.name + ' (' + sc.how + '): ' + d.n + ' presses and ' + d.w + ' rewards in ' + r0(tNow / 60) + ' minutes.'; }
    function cqLine(){ var o = CL.OPERANT[cq], nm = CL.OP_NAMES[o.add + ',' + o.up]; return o.who + ' ' + o.b + ' and ' + o.c + ': ' + nm.toLowerCase() + '.'; }
    function line(){ return view === 'cc' ? ccLine() : view === 'op' ? opLine() : cqLine(); }

    function words(){
      var head, sub = '', why = '';
      if(view === 'cc'){
        var st = ccState(), PH = { none: 'Before conditioning.', acq: 'Acquisition.', ext: 'Extinction.', rest: 'A rest.', rec: 'Spontaneous recovery.', nolearn: 'No learning yet.' };
        head = PH[st.phase] + ' ' + (trials.length ? ccLine() : 'The tone is a neutral stimulus: it brings no saliva.');
        sub = st.phase === 'acq' ? (st.learned ? 'The tone now brings saliva on its own: it is a CS.' : 'Keep pairing: each pairing strengthens the association.') : st.phase === 'ext' ? 'With no food after it, the tone brings fewer drops each time.' : st.phase === 'rec' ? (recoveredNow(st) ? 'The response came back after the rest, weaker than before.' : 'Little had faded before the rest, so there was little to bring back. Sound the tone alone a few more times, then rest again.') : st.phase === 'rest' ? 'Now try Tone alone.' : st.phase === 'nolearn' ? 'A tone that was never paired with food brings no saliva.' : 'Press Tone + food.';
        why = '<p><b>Before.</b> Food in the mouth (the unconditioned stimulus, UCS) makes a dog salivate with no learning (the unconditioned response, UCR). A tone is a neutral stimulus: it brings no saliva.</p>' +
          '<p><b>Acquisition.</b> Pair the tone with the food again and again. The tone becomes a conditioned stimulus (CS), and salivating to the tone is the conditioned response (CR). Learning is fast at first, then levels off.</p>' +
          '<p><b>Extinction.</b> Sound the tone with no food: the CR weakens trial by trial.</p>' +
          '<p><b>Spontaneous recovery.</b> After a rest the CR comes back, weaker: extinction suppressed the response, it did not erase the learning.</p>' +
          '<p><b>UCR or CR?</b> Both are salivation. Name it by what triggered it: food (UCR) or the tone (CR).</p>' +
          '<p><b>The model.</b> The drops come from a simple learning rule, a teaching model of the published shape, not one dog’s data.</p>';
      } else if(view === 'op'){
        var sc = CL.schedOf(sk), d = opDone();
        head = sc.name + ': ' + sc.how + '.';
        sub = sc.shape + '.';
        why = '<p><b>The cumulative record.</b> The line climbs one step for every lever press, so its slope is the response rate: steep is fast, flat is a pause. Each tick marks a reward.</p>' +
          '<p><b>Ratio or interval.</b> Ratio schedules reward a number of responses, so responding faster pays: high rates. Interval schedules reward the first response after some time, so pressing faster does not bring rewards sooner: lower rates.</p>' +
          '<p><b>Fixed or variable.</b> Fixed requirements are predictable, so the learner pauses after a reward (fixed-ratio) or waits and speeds up as the time nears (fixed-interval scallops). Variable requirements keep responding steady.</p>' +
          '<p><b>Resistance to extinction.</b> Variable schedules, variable-ratio above all (a slot machine), keep behavior going longest when rewards stop. Continuous reinforcement is learned fastest but extinguished fastest.</p>' +
          '<p><b>The model.</b> A simulated rat with typical relative response rates: the shapes are Ferster and Skinner’s (1957); the numbers are illustrative.</p>';
      } else {
        var o = CL.OPERANT[cq], nm = CL.OP_NAMES[o.add + ',' + o.up];
        head = nm + ': ' + o.c + ', and the behavior ' + (o.up ? 'increases' : 'decreases') + '.';
        sub = 'Something is ' + (o.add ? 'added' : 'removed') + ' (' + (o.add ? 'positive' : 'negative') + '), and the behavior goes ' + (o.up ? 'up (reinforcement)' : 'down (punishment)') + '.';
        why = '<p><b>Two questions name every consequence.</b> Is something added (positive) or removed (negative)? Does the behavior become more frequent (reinforcement) or less frequent (punishment)?</p>' +
          '<p><b>Negative reinforcement is not punishment.</b> Taking away something unpleasant (the seatbelt beep, a headache) makes the behavior more likely. Punishment always makes a behavior less likely.</p>' +
          '<p><b>Positive and negative are not good and bad.</b> They mean added and removed, like a plus and a minus sign.</p>';
      }
      T.explain($('.cl-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(view === 'cc'){
          var s2 = ccState();
          LS.pills([{ k: 'Trials', html: String(trials.filter(function(t){ return t !== 'rest'; }).length), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Drops to the tone', html: r0(s2.crNow), tone: s2.learned ? 'accent' : 'ghost' }], 'right', 'explore');
        } else if(view === 'op'){
          var d2 = opDone();
          LS.pills([{ k: 'Presses', html: String(d2.n), tone: 'readout' }], 'left', 'explore');
          LS.pills([{ k: 'Rewards', html: String(d2.w), tone: 'accent' }], 'right', 'explore');
        } else {
          var o2 = CL.OPERANT[cq];
          LS.pills([], 'left', 'explore');
          LS.pills([{ html: CL.OP_NAMES[o2.add + ',' + o2.up], tone: 'accent' }], 'right', 'explore');
        }
      }
    }
    function nums(){
      var h = '';
      if(view === 'cc'){
        var st = ccState(), n = 0;
        h = trials.length ? T.dataTable(['Trial', 'What happened', 'Drops to the tone'], trials.map(function(t, i){ return [t === 'rest' ? '' : String(++n), t === 'pair' ? 'Tone + food' : t === 'tone' ? 'Tone alone' : 'Rest a day', t === 'rest' ? '' : r0(st.cr[i])]; }), 'Every trial') : '<p class="bt-small">No trials yet.</p>';
      } else if(view === 'op'){
        h = T.dataTable(['Schedule', 'Presses in 10 min', 'Rewards', 'Presses per minute'], CL.SCHEDULES.map(function(s){ var q = CL.session(s.k, seed, MIN); return [s.name + ' (' + s.short + ')', String(q.presses.length), String(q.rewards.length), String(M.round(q.presses.length / MIN, 1))]; }), 'One simulated session per schedule');
      } else {
        h = T.dataTable(['', 'Behavior increases', 'Behavior decreases'], [['Something added', 'Positive reinforcement', 'Positive punishment'], ['Something removed', 'Negative reinforcement', 'Negative punishment']], 'The four consequences');
      }
      $('.cl-nums').innerHTML = h;
    }

    /* ------------------------------------------------------- drawing */
    function size(){ var rc = $('.cl-fig').getBoundingClientRect(); return [Math.max(300, Math.min(1600, Math.round(rc.width) || 640)), Math.max(300, Math.min(1000, Math.round(rc.height) || 460))]; }
    function redraw(){
      var wh = size(), k = Math.max(1, wh[0] / 760), W = Math.round(wh[0] / k), H = Math.round(wh[1] / k);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', wh[0]); svg.setAttribute('height', wh[1]);
      var out = view === 'cc' ? ccScene(W, H) : view === 'op' ? opScene(W, H) : cqScene(W, H);
      svg.innerHTML = out.svg; svg.setAttribute('aria-label', out.label);
      if(LS && LS.setupRow) LS.setupRow.setup(view === 'cc' ? trials.filter(function(t){ return t !== 'rest'; }).length + ' trials so far' : view === 'op' ? (compare ? 'Comparing all four' : CL.schedOf(sk).name) : 'Four quadrants');
      words();
    }

    function ccScene(W, H){
      var phone = W < 560, g = [], st = ccState(), k = last ? last.kind : null, n = trials.length;
      var sceneH = Math.round(H * (phone ? 0.42 : 0.46)), L = phone ? 12 : 30, R = W - (phone ? 12 : 30);
      // the scene: speaker, dog, dish, measuring tube
      var sc = Math.min(sceneH / 230, (R - L) / 560) * (phone ? 1.05 : 1), dx = L + (R - L) * (phone ? 0.42 : 0.42), dy = sceneH * 0.44;
      var tone = k === 'pair' || k === 'tone', food = k === 'pair', drops = k && k !== 'rest' ? Math.round(food ? CL.MAXCR : st.crNow) : 0;
      g.push('<rect class="cl-sky" x="0" y="0" width="' + W + '" height="' + sceneH + '"/>');
      g.push(dog(dx, dy, sc, food || drops > 0));
      var spx = L + (R - L) * (phone ? 0.08 : 0.1), spy = dy - 40 * sc;
      g.push(speaker(spx, spy, sc * 1.1, tone ? (last && last.anim ? 2 : 1) : 0));
      var fx = dx + 150 * sc, fy = dy + 110 * sc;
      g.push(dish(fx, fy, sc, food));
      // saliva drops from the mouth into a measuring tube
      var mx = dx + 80 * sc, my = dy + 44 * sc, tx = R - (phone ? 30 : 50), tyT = Math.max(48, sceneH * 0.2), tyB = sceneH - 14, cap = CL.MAXCR;
      var tw2 = 22;
      // a thin tube from the cheek (as in Pavlov's setup) to the measuring tube
      g.push('<path class="cl-tubeline" d="M' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' C' + (mx + 40).toFixed(1) + ' ' + (my + 10).toFixed(1) + ' ' + (tx - tw2 / 2 - 50).toFixed(1) + ' ' + (tyT - 26).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + (tyT - 2).toFixed(1) + '"/>');
      var lvl = tyB - (tyB - tyT) * Math.min(1, drops / cap);
      g.push('<rect class="cl-tube" x="' + (tx - tw2 / 2) + '" y="' + tyT.toFixed(1) + '" width="' + tw2 + '" height="' + (tyB - tyT).toFixed(1) + '" rx="6"/>');
      if(drops) g.push('<rect class="cl-saliva' + (food ? ' is-ucr' : '') + '" x="' + (tx - tw2 / 2 + 3) + '" y="' + lvl.toFixed(1) + '" width="' + (tw2 - 6) + '" height="' + (tyB - lvl - 3).toFixed(1) + '" rx="4"/>');
      for(var q = 0; q <= cap; q += 4){ var yy = tyB - (tyB - tyT) * q / cap; g.push('<line class="cl-tubetick" x1="' + (tx - tw2 / 2 - 6) + '" x2="' + (tx - tw2 / 2) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/>' + txt(tx - tw2 / 2 - 9, yy + 4, String(q), 'cl-tv', 'end')); }
      if(drops && last && last.anim) for(var d = 0; d < 3; d++) g.push('<path class="cl-drop is-anim" style="animation-delay:' + (0.25 + d * 0.18) + 's" d="M' + mx.toFixed(1) + ' ' + (my + 4).toFixed(1) + ' q-4 8 0 10 q4 -2 0 -10 Z"/>');
      else if(drops) g.push('<path class="cl-drop" d="M' + mx.toFixed(1) + ' ' + (my + 4).toFixed(1) + ' q-4 8 0 10 q4 -2 0 -10 Z"/>');
      // labels that change with learning
      var toneLab = !n || !st.nPair ? 'Neutral stimulus: tone' : st.learned || st.phase !== 'acq' ? 'CS: tone' : 'Tone (being paired)';
      g.push(tag(spx + 6, spy - 40 * sc, toneLab, /^CS/.test(toneLab) ? 'is-cs' : 'is-ns', 'start'));
      if(food) g.push(tag(fx, fy + 30 * sc, 'UCS: food', 'is-ucs'));
      var dropLab = !k || k === 'rest' ? '' : food ? 'UCR: saliva to food' : drops >= 1 ? 'CR: saliva to the tone' : 'No saliva';
      if(dropLab) g.push(tag(R, 22, dropLab + (drops ? ' (' + drops + ')' : ''), food ? 'is-ucs' : drops >= 1 ? 'is-cs' : 'is-ns', 'end'));
      if(k === 'rest') g.push(tag(dx, dy - 80 * sc, 'Resting a day', 'is-ns'));
      // the record
      var gT = sceneH + (phone ? 34 : 40), gB = H - (phone ? 46 + ENL : 48), gL = phone ? 34 : 50, gR = W - (phone ? 16 : 30);
      var shown = trials.filter(function(t){ return t !== 'rest'; }).length, X = Math.max(20, shown + 2);
      var x = function(i){ return gL + (i - 0.5) / X * (gR - gL); }, y = function(v){ return gB - v / cap * (gB - gT); };
      // phase bands
      var idx = 0, bands = [], cur = null;
      trials.forEach(function(t){ if(t === 'rest'){ bands.push({ rest: idx }); return; } idx++; var ph = t === 'pair' ? 'acq' : 'ext'; if(!cur || cur.ph !== ph){ cur = { ph: ph, a: idx, b: idx }; bands.push(cur); } else cur.b = idx; });
      bands.forEach(function(b){ if(b.rest != null) return; g.push('<rect class="cl-band is-' + b.ph + '" x="' + (x(b.a) - (gR - gL) / X / 2).toFixed(1) + '" y="' + gT + '" width="' + ((b.b - b.a + 1) * (gR - gL) / X).toFixed(1) + '" height="' + (gB - gT) + '"/>'); });
      [0, 4, 8, 12].forEach(function(v){ g.push('<line class="cl-grid" x1="' + gL + '" x2="' + gR + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' + txt(gL - 7, y(v) + 4, String(v), 'cl-tv', 'end')); });
      bands.forEach(function(b){ if(b.rest == null) return; var rx = gL + b.rest / X * (gR - gL); g.push('<line class="cl-restl" x1="' + rx.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y1="' + gT + '" y2="' + gB + '"/>' + txt(rx + 4, gT + 28, 'rest', 'cl-bt2', 'start')); });
      // acquisition is named at the foot of its band (its points end high), extinction at the top (its points end low)
      bands.forEach(function(b){ if(b.rest != null || b.b - b.a < 2) return; g.push(txt((x(b.a) + x(b.b)) / 2 + (b.ph === 'acq' ? (gR - gL) / X : 0), b.ph === 'acq' ? gB - 10 : gT + 15, b.ph === 'acq' ? 'acquisition' : 'extinction', 'cl-bt2 is-' + b.ph)); });
      var pts = [], j = 0;
      trials.forEach(function(t, i){ if(t === 'rest') return; j++; pts.push({ x: x(j), y: y(st.cr[i]), pair: t === 'pair', i: i }); });
      var segs = [], seg = [];
      trials.forEach(function(t, i){ if(t === 'rest'){ if(seg.length) segs.push(seg); seg = []; return; } seg.push(pts.filter(function(p){ return p.i === i; })[0]); });
      if(seg.length) segs.push(seg);
      segs.forEach(function(sg){ if(sg.length > 1) g.push('<polyline class="cl-crline" points="' + sg.map(function(p){ return p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + '"/>'); });
      pts.forEach(function(p){ g.push('<circle class="cl-crpt' + (p.pair ? ' is-pair' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (phone ? 4.5 : 5.5) + '"/>'); });
      g.push('<line class="cl-axis" x1="' + gL + '" x2="' + gR + '" y1="' + gB + '" y2="' + gB + '"/>');
      for(var tt = 5; tt <= X; tt += 5) g.push(txt(x(tt), gB + 16, String(tt), 'cl-tv'));
      g.push(txt((gL + gR) / 2, gB + (phone ? 34 : 36), 'Trial (filled: tone + food; open: tone alone)', 'cl-axn'));
      g.push('<text class="cl-axn" x="' + gL + '" y="' + (gT - 6) + '" text-anchor="start">Drops of saliva to the tone</text>');
      if(!n) g.push(txt((gL + gR) / 2, (gT + gB) / 2, 'Press Tone + food to run the first trial', 'cl-empty'));
      var label = 'A dog, a speaker and a food dish. ' + ccLine() + ' Record of ' + shown + ' trials: drops of saliva to the tone ' + pts.map(function(p, ii){ return r0(st.cr[p.i]); }).join(', ') + '.';
      return { svg: g.join(''), label: label };
    }

    /* Each schedule's record is drawn on its own scale, so its shape shows (FR's
       stair steps, FI's scallops); the comparison option puts all four on one
       scale, where the slopes compare rates. The close-up magnifies the last
       two minutes, a few rewards, at a fixed scale per schedule. */
    var WIN = 120;
    function winMax(s){ var best = 0, j = 0; for(var i = 0; i < s.presses.length; i++){ while(s.presses[i] - s.presses[j] > WIN) j++; best = Math.max(best, i - j + 1); } return best; }
    function niceStep(v){ return v > 2000 ? 500 : v > 800 ? 200 : v > 300 ? 100 : v > 120 ? 50 : 20; }
    function rec(s, upTo, x, y, from){
      from = from || 0;
      var pts = [[x(from / 60), y(0)]], c = 0;
      s.presses.forEach(function(t){ if(t > upTo || t <= from) return; c++; pts.push([x(t / 60), y(c - 1)], [x(t / 60), y(c)]); });
      pts.push([x(upTo / 60), y(c)]);
      var out = [pts[0]];
      for(var i = 1; i < pts.length; i++){ var a = out[out.length - 1]; if(Math.abs(pts[i][0] - a[0]) > 0.4 || Math.abs(pts[i][1] - a[1]) > 0.4 || i === pts.length - 1) out.push(pts[i]); }
      return out.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    }
    function hatches(s, upTo, x, y, from){
      from = from || 0;
      var c = 0, ri = 0, g = '';
      s.presses.forEach(function(t){ if(t > upTo || t <= from) return; c++; while(ri < s.rewards.length && s.rewards[ri] < t - 1e-9) ri++; if(ri < s.rewards.length && Math.abs(s.rewards[ri] - t) < 1e-9){ var px = x(t / 60), py = y(c); g += '<line class="cl-tick" x1="' + px.toFixed(1) + '" x2="' + (px + 5).toFixed(1) + '" y1="' + py.toFixed(1) + '" y2="' + (py + 7).toFixed(1) + '"/>'; } });
      return g;
    }
    function opScene(W, H){
      var phone = W < 560, g = [], sc = CL.schedOf(sk), L = phone ? 44 : 60, R = W - (phone ? 16 : 30);
      var colW = phone ? (W - 34) / 2 : Math.min(260, W * 0.32);
      var boxW = colW, boxH = phone ? Math.min(124, H * 0.24) : Math.min(150, H * 0.26);
      var bx = phone ? 12 : R - boxW, by = phone ? 46 : 52;
      var near = function(list, w){ return list.some(function(t){ return t <= tNow && t > tNow - w; }); };
      var pressing = anim && near(sess.presses, 1.2 * (MIN * 60) / (PLAY_S * 60)), pellet = anim ? near(sess.rewards, 6) : false;
      g.push(skinner(bx, by, boxW, boxH, pressing, pellet, pellet));
      g.push(txt(bx + boxW / 2, by + boxH + 18, phone ? 'Skinner box, ' + sc.short : 'Skinner box, ' + sc.name.toLowerCase() + ' (' + sc.short + ')', 'cl-axn'));
      var yy3 = by + boxH + 18;
      if(!phone){ var words2 = (sc.how.charAt(0).toUpperCase() + sc.how.slice(1) + '.').split(' '), ln = ''; yy3 += 18; words2.forEach(function(wd){ if(tw(ln + ' ' + wd, 12, 700) > boxW && ln){ g.push(txt(bx + boxW / 2, yy3, ln, 'cl-tv')); yy3 += 16; ln = wd; } else ln = ln ? ln + ' ' + wd : wd; }); if(ln) g.push(txt(bx + boxW / 2, yy3, ln, 'cl-tv')); }
      var gT = phone ? by + boxH + 52 : by + 8, gB = H - (phone ? 52 + ENL : 56), gR = phone ? R : bx - 30;
      // the y scale: this schedule's own, or one for all four when comparing
      var all = CL.SCHEDULES.map(function(s){ return CL.session(s.k, seed, MIN); });
      var yTop = compare ? Math.max.apply(null, all.map(function(q){ return q.presses.length; })) : Math.max(20, sess.presses.length);
      var step = niceStep(yTop), yMax = Math.ceil(yTop * 1.04 / step) * step;
      var x = function(m){ return L + m / MIN * (gR - L); }, y = function(v){ return gB - v / yMax * (gB - gT); };
      // the close-up window on the main record
      var w1 = Math.max(WIN, tNow), w0 = w1 - WIN;
      g.push('<rect class="cl-zoomband" x="' + x(w0 / 60).toFixed(1) + '" y="' + gT + '" width="' + (x(w1 / 60) - x(w0 / 60)).toFixed(1) + '" height="' + (gB - gT) + '"/>');
      for(var v = 0; v <= yMax; v += step) g.push('<line class="cl-grid" x1="' + L + '" x2="' + gR + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' + txt(L - 7, y(v) + 4, String(v), 'cl-tv', 'end'));
      for(var m = 0; m <= MIN; m += 2) g.push(txt(x(m), gB + 16, String(m), 'cl-tv'));
      g.push(txt((L + gR) / 2, gB + 36, 'Minutes', 'cl-axn'));
      g.push('<text class="cl-axn" x="' + (phone ? 12 : L) + '" y="' + (gT - 10) + '" text-anchor="start">' + esc(compare ? 'Total lever presses, all four on one scale' : phone ? 'Total presses (scale fits ' + sc.short + ')' : 'Total lever presses (the scale fits ' + sc.short + ')') + '</text>');
      if(compare) all.forEach(function(q, i){
        var s = CL.SCHEDULES[i]; if(s.k === sk) return;
        g.push('<polyline class="cl-rec is-faint" points="' + rec(q, MIN * 60, x, y) + '"/>');
        g.push(txt(x(MIN) + 4, y(q.presses.length) + 4, s.short, 'cl-tv', 'start'));
      });
      g.push('<polyline class="cl-rec" points="' + rec(sess, tNow, x, y) + '"/>');
      g.push(hatches(sess, tNow, x, y));
      g.push('<line class="cl-axis" x1="' + L + '" x2="' + gR + '" y1="' + gB + '" y2="' + gB + '"/><line class="cl-axis" x1="' + L + '" x2="' + L + '" y1="' + gT + '" y2="' + gB + '"/>');
      var d = opDone(), endX = x(tNow / 60), endY = y(d.n), lab = d.n + ' presses', lw = tw(lab, 14, 900) + 18, lx = Math.min(gR - lw, Math.max(L + 4, endX - lw - 8)), ly = Math.max(gT + 2, endY - 36);
      if(ly + 26 > gB - 4) ly = gB - 30;
      g.push('<g class="cl-bub"><rect x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" width="' + lw.toFixed(1) + '" height="26" rx="8"/>' + txt(lx + lw / 2, ly + 18, lab, 'cl-bt') + '</g>');
      if(!phone) g.push(txt(gR - 4, gB - 10, 'each hatch = a reward', 'cl-hint', 'end'));
      // the close-up panel
      var zx = phone ? bx + boxW + 10 : bx, zw = colW, zt = phone ? by : yy3 + 34, zb = phone ? by + boxH : gB;
      g.push(closeUp(zx, zt, zw, zb - zt, w0, w1, phone));
      var label = 'Skinner box with a rat and a lever, and the cumulative record of lever presses over ' + MIN + ' minutes on a ' + sc.name.toLowerCase() + ' schedule: ' + sc.shape.toLowerCase() + '. A close-up shows the last two minutes. ' + opLine();
      return { svg: g.join(''), label: label };
    }
    /* The last two minutes, magnified, with the schedule's mark named on it. */
    function closeUp(zx, zt, zw, zh, w0, w1, phone){
      var g = [], pad = phone ? 6 : 10, head = phone ? 18 : 22;
      g.push('<rect class="cl-zoom" x="' + zx.toFixed(1) + '" y="' + zt.toFixed(1) + '" width="' + zw.toFixed(1) + '" height="' + zh.toFixed(1) + '" rx="10"/>');
      g.push('<text class="cl-zoomt" x="' + (zx + pad).toFixed(1) + '" y="' + (zt + head - 4).toFixed(1) + '">' + esc(phone ? 'Close-up, 2 min' : 'Close-up: minutes ' + M.round(w0 / 60, 1) + ' to ' + M.round(w1 / 60, 1)) + '</text>');
      var x0 = zx + pad, x1 = zx + zw - pad, y0 = zt + head + 6, y1 = zt + zh - pad - (phone ? 2 : 14);
      if(!sess.cmax) sess.cmax = Math.max(10, Math.ceil(winMax(sess) * 1.04 / 5) * 5);
      var cm = sess.cmax;
      var x = function(m){ return x0 + (m * 60 - w0) / WIN * (x1 - x0); }, y = function(v){ return y1 - v / cm * (y1 - y0); };
      g.push('<line class="cl-axis" x1="' + x0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" y2="' + y1.toFixed(1) + '"/>');
      var upTo = Math.min(tNow, w1);
      g.push('<polyline class="cl-rec is-zoom" points="' + rec(sess, upTo, x, y, w0) + '"/>');
      g.push(hatches(sess, upTo, x, y, w0));
      if(!phone) g.push(txt(x0, y1 + 13, M.round(w0 / 60, 1) + ' min', 'cl-tv', 'start'), txt(x1, y1 + 13, M.round(w1 / 60, 1) + ' min', 'cl-tv', 'end'));
      // name the schedule's mark where it shows
      var inW = sess.presses.filter(function(t){ return t > w0 && t <= upTo; }), cnt = function(t){ var c = 0; inW.forEach(function(p){ if(p <= t) c++; }); return c; };
      var rw = sess.rewards.filter(function(t){ return t > w0 && t <= upTo; });
      function note(px, py, s, up){ var ty = up ? py - 8 : py + 16; ty = Math.max(y0 + 10, Math.min(y1 - 4, ty)); return txt(Math.max(x0 + tw(s, 12, 800) / 2, Math.min(x1 - tw(s, 12, 800) / 2, px)), ty, s, 'cl-znote'); }
      if(sk === 'fr' || sk === 'fi'){
        // the reward whose pause (FR) or interval (FI) sits nearest the middle of the window
        var best = null, mid0 = (w0 + upTo) / 2;
        rw.forEach(function(r){
          var nx = inW.filter(function(t){ return t > r; })[0], nr = sess.rewards.filter(function(t){ return t > r; })[0];
          var ok = sk === 'fr' ? nx && nx - r > 5 && nr && nr <= upTo : nr && nr <= upTo;
          if(!ok) return;
          var c = sk === 'fr' ? (r + nx) / 2 : (r + nr) / 2;
          if(!best || Math.abs(c - mid0) < Math.abs(best.c - mid0)) best = { r: r, nx: nx, nr: nr, c: c };
        });
        if(best && sk === 'fr'){
          var cy = y(cnt(best.r)), a = x(best.r / 60), b2 = x(best.nx / 60), mr = (best.nx + best.nr) / 2;
          g.push('<line class="cl-zpause" x1="' + a.toFixed(1) + '" x2="' + b2.toFixed(1) + '" y1="' + (cy + 5).toFixed(1) + '" y2="' + (cy + 5).toFixed(1) + '"/>', note((a + b2) / 2, cy + 5, 'pause', false));
          g.push(note(x(mr / 60) - 20, y(cnt(mr)), 'run', true));
        } else if(best){
          var e1 = best.r + 0.3 * (best.nr - best.r), e2 = best.r + 0.85 * (best.nr - best.r);
          g.push(note(x(e1 / 60), y(cnt(e1)), 'slow', false), note(x(e2 / 60) - 18, y(cnt(e2)), 'fast', true));
        }
      } else if(upTo - w0 > 30){
        var mt = w0 + (upTo - w0) * 0.5;
        g.push(note(x(mt / 60) + 18, y(cnt(mt)) + 6, 'no pauses', false));
      }
      return g.join('');
    }

    /* Consequences: the example drawn as three panels (the behavior, the
       consequence appearing or vanishing, the behavior next time), with the
       four-quadrant grid below as the answer. */
    function cqScene(W, H){
      var phone = W < 560, g = [], o = CL.OPERANT[cq], ic = CQ_ICONS[o.b] || {}, L = phone ? 10 : 30, R = W - (phone ? 10 : 30);
      var stripT = phone ? 8 : 14, stripH = phone ? Math.min(206, H * 0.42) : Math.min(290, H * 0.47), gap = phone ? 14 : 34;
      var pw = (R - L - 2 * gap) / 3, ph = stripH, capH = phone ? 52 : 58, art = Math.min(pw * (phone ? 0.86 : 0.7), ph - capH - (phone ? 26 : 34));
      var heads = phone ? ['Behavior', 'Then', 'Next time'] : ['1. The behavior', '2. What happens', '3. Next time'];
      var anim = cqAnim && !T.reduced();
      function wrap(t, maxW, size){ var out = [], ln = ''; String(t).split(' ').forEach(function(wd){ if(ln && tw(ln + ' ' + wd, size, 800) > maxW){ out.push(ln); ln = wd; } else ln = ln ? ln + ' ' + wd : wd; }); if(ln) out.push(ln); return out; }
      function cap(cx, y, t, cls, size){ var ls = wrap(t, pw - 12, size).slice(0, 3); return ls.map(function(l, i){ return '<text class="' + cls + '" style="font-size:' + size + 'px" x="' + cx.toFixed(1) + '" y="' + (y + i * (size + 3)).toFixed(1) + '" text-anchor="middle">' + esc(l) + '</text>'; }).join(''); }
      for(var i = 0; i < 3; i++){
        var px = L + i * (pw + gap), cx = px + pw / 2;
        g.push('<rect class="cl-pan' + (i === 2 ? (o.up ? ' is-up' : ' is-down') : '') + '" x="' + px.toFixed(1) + '" y="' + stripT + '" width="' + pw.toFixed(1) + '" height="' + ph.toFixed(1) + '" rx="14"/>');
        g.push(txt(cx, stripT + (phone ? 17 : 22), heads[i], 'cl-panh'));
        if(i < 2){ var ax = px + pw + 3, ay = stripT + ph * 0.45; g.push('<path class="cl-panar" d="M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' h' + (gap - 10) + ' m-6 -6 l6 6 l-6 6"/>'); }
      }
      var artY = stripT + (phone ? 28 : 38) + art / 2, capY = stripT + ph - capH + (phone ? 12 : 16), fs = phone ? 11.5 : 13.5;
      // 1: the behavior
      var c1 = L + pw / 2, sk1 = art / 118;
      g.push('<g transform="translate(' + c1.toFixed(1) + ' ' + artY.toFixed(1) + ') scale(' + sk1.toFixed(3) + ')">' + (ICON[ic.b] || ICON.none)() + '</g>');
      g.push(cap(c1, capY, o.who + ' ' + o.b, 'cl-st1', fs));
      // 2: the consequence, added (it appears) or removed (it vanishes)
      var c2 = L + pw + gap + pw / 2;
      g.push('<g class="cl-cons ' + (o.add ? 'is-add' : 'is-rem') + (anim ? ' is-anim' : '') + '" transform="translate(' + c2.toFixed(1) + ' ' + artY.toFixed(1) + ') scale(' + sk1.toFixed(3) + ')"><g class="cl-cons-art">' + (ICON[ic.c] || ICON.none)() + '</g>' +
        (o.add ? '' : '<g class="cl-cons-x"><circle cx="0" cy="0" r="50"/><line x1="-35" y1="35" x2="35" y2="-35"/></g>') + '</g>');
      var badge = (o.add ? '+ Added: ' : '− Removed: ') + (ic.nice ? 'pleasant' : 'unpleasant'), bw = tw(badge, phone ? 11 : 12.5, 900) + 16, by2 = artY + art / 2 - (phone ? 6 : 4);
      if(phone && bw > pw - 6){ badge = (o.add ? '+ Added' : '− Removed'); bw = tw(badge, 11, 900) + 16; }
      g.push('<g class="cl-badge ' + (o.add ? 'is-add' : 'is-rem') + '"><rect x="' + (c2 - bw / 2).toFixed(1) + '" y="' + (by2 - 15).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="22" rx="11"/><text style="font-size:' + (phone ? 11 : 12.5) + 'px" x="' + c2.toFixed(1) + '" y="' + (by2 + 0.5).toFixed(1) + '" text-anchor="middle">' + esc(badge) + '</text></g>');
      g.push(cap(c2, capY, o.c.charAt(0).toUpperCase() + o.c.slice(1), 'cl-st1', fs));
      // 3: how often the behavior happens over the next days
      var c3 = L + 2 * (pw + gap) + pw / 2, bw3 = Math.min(pw * 0.72, art * 1.1), bx3 = c3 - bw3 / 2, bb = artY + art / 2 - 6, bt = artY - art / 2 + 8, n = 5, sl = bw3 / n;
      var hs = o.up ? [0.35, 0.5, 0.64, 0.8, 0.95] : [0.95, 0.7, 0.48, 0.3, 0.16];
      for(var j = 0; j < n; j++){ var hh = hs[j] * (bb - bt); g.push('<rect class="cl-fbar ' + (o.up ? 'is-up' : 'is-down') + (anim ? ' is-anim' : '') + '" style="animation-delay:' + (0.5 + j * 0.08) + 's" x="' + (bx3 + j * sl + sl * 0.15).toFixed(1) + '" y="' + (bb - hh).toFixed(1) + '" width="' + (sl * 0.7).toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="3"/>'); }
      g.push('<line class="cl-axis" x1="' + bx3.toFixed(1) + '" x2="' + (bx3 + bw3).toFixed(1) + '" y1="' + bb.toFixed(1) + '" y2="' + bb.toFixed(1) + '"/>');
      var ay0 = o.up ? bb - 0.3 * (bb - bt) : bt + 0.05 * (bb - bt), ay1 = o.up ? bt - 4 : bb - 0.2 * (bb - bt);
      g.push('<path class="cl-farrow ' + (o.up ? 'is-up' : 'is-down') + '" d="M' + (bx3 + 4).toFixed(1) + ' ' + ay0.toFixed(1) + ' L' + (bx3 + bw3 - 4).toFixed(1) + ' ' + ay1.toFixed(1) + '"/>');
      var tipx = bx3 + bw3 - 4, ang = Math.atan2(ay1 - ay0, bw3 - 8), hx = function(d){ return (tipx + 11 * Math.cos(ang + d)).toFixed(1) + ' ' + (ay1 + 11 * Math.sin(ang + d)).toFixed(1); };
      g.push('<path class="cl-farrowh ' + (o.up ? 'is-up' : 'is-down') + '" d="M' + hx(Math.PI - 0.5) + ' L' + tipx.toFixed(1) + ' ' + ay1.toFixed(1) + ' L' + hx(Math.PI + 0.5) + '"/>');
      g.push(txt(bx3 + bw3 / 2, bb + (phone ? 12 : 15), phone ? 'days after' : 'times a day, days after', 'cl-tv'));
      g.push(cap(c3, capY, o.up ? 'Does it more often' : 'Does it less often', 'cl-st1 ' + (o.up ? 'is-up' : 'is-down'), fs));
      // the 2 x 2 grid, the answer
      var T0 = stripT + ph + (phone ? 40 : 44), B = H - (phone ? 10 + ENL : 16);
      var lw = phone ? 30 : 110, gx = L + lw, gw = R - gx, gh = B - T0, cwq = gw / 2, chq = gh / 2;
      g.push(txt(gx + cwq / 2, T0 - 12, phone ? 'Behavior up' : 'Behavior increases', 'cl-axn'), txt(gx + cwq * 1.5, T0 - 12, phone ? 'Behavior down' : 'Behavior decreases', 'cl-axn'));
      g.push('<text class="cl-axn" transform="translate(' + (L + lw / 2 + 4) + ' ' + (T0 + chq / 2) + ') rotate(-90)" text-anchor="middle">' + (phone || chq < 150 ? 'Added' : 'Something added') + '</text>');
      g.push('<text class="cl-axn" transform="translate(' + (L + lw / 2 + 4) + ' ' + (T0 + chq * 1.5) + ') rotate(-90)" text-anchor="middle">' + (phone || chq < 150 ? 'Removed' : 'Something removed') + '</text>');
      var Q = [[true, true, 'Positive reinforcement', 'add a pleasant thing'], [true, false, 'Positive punishment', 'add an unpleasant thing'], [false, true, 'Negative reinforcement', 'remove an unpleasant thing'], [false, false, 'Negative punishment', 'remove a pleasant thing']];
      Q.forEach(function(q){
        var cx = gx + (q[1] ? 0 : cwq), cy = T0 + (q[0] ? 0 : chq), on = q[0] === o.add && q[1] === o.up;
        g.push('<rect class="cl-q' + (on ? ' is-on' : '') + (q[1] ? ' is-up' : ' is-down') + '" x="' + (cx + 3).toFixed(1) + '" y="' + (cy + 3).toFixed(1) + '" width="' + (cwq - 6).toFixed(1) + '" height="' + (chq - 6).toFixed(1) + '" rx="12"/>');
        var nm = q[2].split(' '), small = chq < 74;
        if(small) g.push(txt(cx + cwq / 2, cy + chq / 2 - 3, nm[0], 'cl-qn is-sm' + (on ? ' is-on' : '')), txt(cx + cwq / 2, cy + chq / 2 + 13, nm[1], 'cl-qn is-sm' + (on ? ' is-on' : '')));
        else {
          g.push(txt(cx + cwq / 2, cy + chq / 2 - 14, nm[0], 'cl-qn' + (on ? ' is-on' : '')), txt(cx + cwq / 2, cy + chq / 2 + 8, nm[1], 'cl-qn' + (on ? ' is-on' : '')));
          if(!phone) g.push(txt(cx + cwq / 2, cy + chq / 2 + 30, q[3], 'cl-qd' + (on ? ' is-on' : '')));
        }
        if(on) g.push('<circle class="cl-qdot" cx="' + (cx + cwq - 18).toFixed(1) + '" cy="' + (cy + 18).toFixed(1) + '" r="7"/>');
      });
      var label = 'The example in three pictures: ' + o.who + ' ' + o.b + '; then ' + o.c + ' (something ' + (o.add ? 'added' : 'removed') + ', ' + (ic.nice ? 'pleasant' : 'unpleasant') + '); next time the behavior happens ' + (o.up ? 'more' : 'less') + ' often. Below, the four quadrants: something added or removed, behavior up or down. ' + cqLine();
      return { svg: g.join(''), label: label };
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.cl-fig')], dock: [$('.cl-ctl')], setup: 'Setup', moreLabel: 'Demo and comparison', why: [$('.cl-say')], details: [$('.cl-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sync(); redraw();
      if(s.mode() === 'explore') ApPsychTools.hintSlot(s, s.root.querySelector('.cl-pair'), 'Start here: pair the tone with food', { before: s.root.querySelector('.cl-trial') });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(redraw, 60); }).observe($('.cl-fig')); }
      try{ new MutationObserver(function(){ redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    sync(); redraw();
    return { studio: studio, stop: stopAnim };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'conditioning-lab', noun: 'drill',
      generate: function(r, ctx, type){ return CL.generate(r, ctx, type); },
      types: [{ value: 'labels', label: 'UCS, UCR, CS and CR' }, { value: 'phases', label: 'Acquisition to recovery' }, { value: 'schedule', label: 'Reinforcement schedules' }, { value: 'operant', label: 'Reinforcement or punishment' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { labels: 'Label the conditioning', phases: 'Reading a conditioning record', schedule: 'Which schedule?', operant: 'Name the consequence' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  function figure(el, p, st){
    var g = p.figure, wide = (window.innerWidth || 1280) > 900, PW = wide ? 680 : 380, PH = wide ? 380 : 250, html = '';
    if(!g){ el.innerHTML = ''; return; }
    if(g.kind === 'phases'){
      var acq = g.pts.slice(0, g.nA), ext = g.pts.slice(g.nA, g.nA + g.nE), rec = g.pts.slice(g.restAt);
      html = P.svg({ label: 'Drops of saliva to the tone on each trial: ' + g.pts.map(function(q){ return 'trial ' + q[0] + ' ' + q[1]; }).join(', ') + '. A rest between trials ' + g.restAt + ' and ' + (g.restAt + 1) + '.', kind: 'line', width: PW, height: wide ? PH : 190,
        x: [0, g.pts.length + 1], y: [0, 14], xStep: 2, yStep: 2,
        series: [{ name: 'Tone + food', points: acq }, { name: 'Tone alone', points: ext, dashed: true, cls: 's2' }, { name: wide ? 'Tone alone after a rest' : 'After a rest', points: rec, dashed: true, cls: 's2' }],   // short names on a phone
        lines: [{ seg: true, through: [[g.restAt + 0.5, 0], [g.restAt + 0.5, 13.5]], cls: 's3', dashed: true, label: 'rest' }],
        xLabel: 'Trial', yLabel: 'Drops of saliva' });
    } else if(g.kind === 'labels'){
      var sc = CL.SCENARIOS.filter(function(s){ return s.k === g.scene; })[0];
      var cells = [['ucs', 'UCS', 'is-ucs'], ['ucr', 'UCR', 'is-ucs'], ['cs', 'CS', 'is-cs'], ['cr', 'CR', 'is-cs']];
      // A label shows once its step is answered; the UCR (not always asked) with the UCS.
      var shownOf = function(k){ return !!(st[k] || (k === 'ucr' && st.ucs && (p.given.order || []).indexOf('ucr') < 0)); };
      html = '<div class="cl-lab4">' + cells.map(function(c){ var shown = shownOf(c[0]); return '<div class="cl-l ' + c[2] + (shown ? ' is-shown' : '') + '"><span>' + c[1] + '</span><b>' + (shown ? esc(sc[c[0]]) : '?') + '</b></div>'; }).join('') + '</div>' +
        '<p class="cl-lab-note">Before: ' + (shownOf('ucs') ? esc(sc.ucs) : '?') + ' (UCS) → ' + (shownOf('ucr') ? esc(sc.ucr) : 'a response with no learning') + ' (UCR). After pairing: ' + (shownOf('cs') ? esc(sc.cs) : 'the neutral stimulus') + ' (CS) → ' + (shownOf('cr') ? esc(sc.cr) : '?') + ' (CR).</p>';
    } else if(g.kind === 'schedule'){
      // The four record shapes from 4-minute simulated sessions (the same
      // model as Explore). Each mini has its own y scale so its shape shows;
      // the rate under it (presses per minute) compares the steepness.
      html = '<div class="cl-rec4">' + CL.SCHEDULES.map(function(s){
        var q = CL.session(s.k, 7, 4), pts = CL.cumulative(q.presses, 4, 0.02), w = 260, h = 120, l = 8, b = h - 8, top = 8, yM = Math.max(10, q.presses.length) * 1.04;
        var on = st.shape && s.k === g.k, named = st.sched || st.shape, rate = Math.round(q.presses.length / 4);
        var line = pts.map(function(p2){ return (l + p2[0] / 4 * (w - l - 6)).toFixed(1) + ',' + (b - p2[1] / yM * (b - top)).toFixed(1); }).join(' ');
        return '<div class="cl-r' + (on ? ' is-on' : '') + '"><svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (named ? esc(s.name) + ' record: ' : 'A cumulative record: ') + esc(s.shape.toLowerCase()) + ', about ' + rate + ' presses a minute"><line class="cl-axis" x1="' + l + '" x2="' + (w - 6) + '" y1="' + b + '" y2="' + b + '"/><line class="cl-axis" x1="' + l + '" x2="' + l + '" y1="' + top + '" y2="' + b + '"/><polyline class="cl-mini" points="' + line + '"/></svg><span>' + (named ? '<b>' + esc(s.name) + '.</b> ' : '') + esc(s.shape.split(' (')[0]) + '</span><em>about ' + rate + ' presses a minute</em></div>';
      }).join('') + '</div><p class="cl-lab-note">Each record has its own scale; the rate shows which is steeper.</p>';
    } else if(g.kind === 'operant'){
      var named = st.name, Q = [[true, true, 'Positive reinforcement'], [true, false, 'Positive punishment'], [false, true, 'Negative reinforcement'], [false, false, 'Negative punishment']];
      html = '<div class="cl-q4"><span></span><span class="cl-q4h">Behavior up</span><span class="cl-q4h">Behavior down</span>' +
        [true, false].map(function(add){ return '<span class="cl-q4h">' + (add ? 'Added' : 'Removed') + '</span>' + [true, false].map(function(up){
          var on = (st.addrem ? add === g.add : true) && (st.updown ? up === g.up : true) && (st.addrem || st.updown), q = Q.filter(function(x){ return x[0] === add && x[1] === up; })[0];
          return '<span class="cl-q4c' + (on ? ' is-on' : '') + (named && add === g.add && up === g.up ? ' is-key' : '') + '">' + q[2] + '</span>';
        }).join(''); }).join('') + '</div>';
    }
    el.innerHTML = '<figure class="cd-fig cl-qfig">' + html + '</figure>';
  }
})();
