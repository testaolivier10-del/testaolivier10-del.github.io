/* NREMT Skill sheets, tools v2 Explore (docs/tools-v2-nremt-skillsheets-brief.md; standard docs/tools-v2-standard.md).

   THE IDEA: a skill station is a fixed list of actions, done on the patient in the sheet's order, and a few of them
   (the critical ones) fail the station on their own. So Explore is the patient and the skill sheet side by side, the
   sheet drawn as the examiner's clipboard: tap a step on the sheet and it happens on the patient (gloves, gauze, the
   tourniquet, the mask and the bag, the splint and its cravats, the collar and the board, the AED pads), the camera
   goes to it, and the cause line says what it did and whether it is a critical step. Free play: any step in any order,
   a second tap takes it back off. Done out of order, the patient shows it at once (a "!" where it matters) and the
   cause line names it. Nothing is scored: the timed run with its critical criteria is Test yourself.

   THE PATIENT is station-patient.js's (one script per station: the steps in the Registry sheet's order, what each
   changes on the body, what is out of order), mounted here with its Explore options (lying across a wide stage, the
   live "!" marks, the bag to squeeze, the tourniquet to place). The steps, which are critical and every medical
   word come from there and from the page (the station cards and the official sheets table); this file adds only
   the 1 to 3 word name of each step on the clipboard, its effect in a few words for the cause line, and its icon.

   RULES KEPT (docs/tools-v2-builder-brief.md): the cause line changes only once the picture shows the change (after
   the item has come in); the clock (the bleed, the soak, the pallor) runs only while Explore shows; every timer and
   the camera stop when it hides; reduced motion gets a short cross fade and the result at once.

     var ex = NremtSkillExplore.build({ studio, guide, onAct() }) -> { stage, ref, hidden(), shown(), show(key), keyOf(slug),
                                                              key(), _state() } */
(function(){
  'use strict';
  if(window.NremtSkillExplore) return;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }

  /* ---- the stations: picker groups, the case in a few words, and per step [name, effect, icon] --------------- */
  var GROUPS = [
    { label: 'Bleeding and shock', keys: ['bleeding'] },
    { label: 'Airway and breathing', keys: ['bvm', 'oxygen'] },
    { label: 'Cardiac arrest', keys: ['aed'] },
    { label: 'Splinting', keys: ['longbone', 'joint'] },
    { label: 'Spinal immobilization', keys: ['supine', 'seated'] },
    { label: 'Patient assessment', keys: ['trauma', 'medical'] }
  ];
  // the picker's name (the page's own station names are longer); the row in the official sheets table
  var NAME = { bleeding: 'Bleeding control and shock', bvm: 'BVM ventilation', oxygen: 'Oxygen by non-rebreather', aed: 'Cardiac arrest and AED',
    longbone: 'Long bone splint', joint: 'Joint splint', supine: 'Spinal, supine patient', seated: 'Spinal, seated patient',
    trauma: 'Trauma assessment', medical: 'Medical assessment' };
  var ROW = { trauma: /trauma/i, medical: /medical/i, aed: /cardiac|aed/i, bvm: /bvm/i, oxygen: /non-rebreather|oxygen/i, longbone: /long bone/i,
    joint: /joint/i, supine: /supine/i, seated: /seated/i, bleeding: /bleeding/i };
  var CASE = { bleeding: 'deep cut on the right thigh, bleeding', bvm: 'unresponsive, on their back', oxygen: 'short of breath, sitting up',
    aed: 'collapsed on the floor', longbone: 'broken right forearm', joint: 'injured right knee', supine: 'possible spine injury, lying down',
    seated: 'possible spine injury, in a car seat', trauma: 'fell 12 feet from a ladder', medical: 'chest pain for 30 minutes' };
  var GLOVES = ['Gloves on', 'hands protected', 'gloves'];
  var STEP = {
    bleeding: { bsi: GLOVES, pressure: ['Direct pressure', 'gauze soaks through', 'gauze'], tq: ['Tourniquet', 'bleeding stops', 'tq'],
      position: ['Lay flat', 'supine and still', 'flat'], o2: ['Oxygen mask', '15 L/min by mask', 'mask'], warm: ['Blanket', 'heat loss prevented', 'blanket'],
      transport: ['Transport now', 'immediate transport', 'ambulance'] },
    bvm: { bsi: GLOVES, resp: ['Check response', 'no response', 'shout'], help: ['Call for help', 'more EMS coming', 'radio'],
      check: ['Breathing and pulse', 'not breathing, weak pulse', 'pulse'], open: ['Open airway', 'head tilt, chin lift', 'tilt'],
      prep: ['Ready suction', 'rigid suction on', 'suction'], suction: ['Suction', 'mouth cleared', 'suction'], open2: ['Reopen airway', 'head tilt again', 'tilt'],
      opa: ['Oral airway', 'tongue held forward', 'opa'], vent1: ['Ventilate', 'first breaths by bag', 'bvm'], recheck: ['Recheck pulse', 'pulse still there', 'pulse'],
      oxy: ['Add oxygen', 'reservoir at 15 L/min', 'tank'], vent2: ['Ventilate on rate', 'chest rises each breath', 'bvm'] },
    oxygen: { bsi: GLOVES, gather: ['Gather equipment', 'cylinder, regulator, mask', 'kit'], crack: ['Crack the valve', 'outlet blown clear', 'valve'],
      reg: ['Fit regulator', 'regulator on the cylinder', 'gauge'], open: ['Open cylinder', 'valve open', 'valve'], psi: ['Check pressure', 'enough oxygen', 'gauge'],
      leaks: ['Check for leaks', 'no hiss at the seal', 'ear'], attach: ['Attach tubing', 'tubing on the outlet', 'tubing'],
      prefill: ['Fill the bag', 'reservoir full', 'bag'], flow: ['Set the flow', 'at least 10 L/min', 'flow'], apply: ['Mask on', 'mask sealed on the face', 'mask'] },
    aed: { bsi: GLOVES, scene: ['Scene safe', 'safe to go in', 'eye'], resp: ['Check response', 'no response', 'shout'], help: ['Call for help', 'help and AED coming', 'radio'],
      check: ['Breathing and pulse', 'no breathing, no pulse', 'pulse'], cpr: ['Compressions', 'hard, fast, full recoil', 'cpr'],
      twomin: ['Two minutes CPR', '30 compressions, 2 breaths', 'cpr'], vent: ['Take the bag', 'partner compresses', 'bvm'], power: ['AED on', 'follow its prompts', 'aed'],
      pads: ['Pads on', 'pads on the chest', 'pads'], clear: ['Clear to analyze', 'nobody touching', 'clear'], shock: ['Shock', 'shock delivered', 'bolt'],
      resume: ['Resume CPR', 'compressions at once', 'cpr'] },
    longbone: { bsi: GLOVES, stab: ['Hold the arm', 'break held still', 'hands'], pms1: ['Check the hand', 'pulse, motor, sense', 'pulse'],
      measure: ['Measure splint', 'sized on the good arm', 'ruler'], apply: ['Apply splint', 'padded board on', 'splint'], above: ['Tie the elbow', 'joint above held', 'cravat'],
      below: ['Tie the wrist', 'joint below held', 'cravat'], secure: ['Secure the arm', 'arm bound to the splint', 'roll'],
      func: ['Hand in function', 'fingers gently curled', 'hand'], pms2: ['Recheck the hand', 'still present after', 'pulse'] },
    joint: { bsi: GLOVES, stab: ['Hold the knee', 'held as found', 'hands'], pms1: ['Check the foot', 'pulse, motor, sense', 'pulse'],
      select: ['Choose splints', 'two padded boards', 'splint'], site: ['Splint the knee', 'boards beside the knee', 'splint'],
      above: ['Tie the thigh', 'bone above held', 'cravat'], below: ['Tie the lower leg', 'bone below held', 'cravat'], secure: ['Secure the leg', 'whole leg held', 'roll'],
      pms2: ['Recheck the foot', 'still present after', 'pulse'] },
    supine: { bsi: GLOVES, manual: ['Hold the head', 'neutral, in line', 'head'], pms1: ['Check all limbs', 'pulse, motor, sense', 'pulse'],
      collar: ['Collar', 'collar sized and on', 'collar'], board: ['Board alongside', 'board beside them', 'board'], roll: ['Log roll', 'onto the board as one', 'roll2'],
      pad: ['Pad the gaps', 'back and knees padded', 'pad'], torso: ['Strap the torso', 'chest and hips strapped', 'strap'],
      headpad: ['Pad the head', 'head kept neutral', 'pad'], head: ['Secure the head', 'blocks and tape on', 'blocks'], legs: ['Strap the legs', 'legs strapped', 'strap'],
      arms: ['Secure the arms', 'arms at the sides', 'strap'], pms2: ['Recheck all limbs', 'still present after', 'pulse'] },
    seated: { bsi: GLOVES, manual: ['Hold the head', 'neutral, in line', 'head'], pms1: ['Check all limbs', 'pulse, motor, sense', 'pulse'],
      collar: ['Collar', 'collar sized and on', 'collar'], device: ['Vest behind', 'device behind the back', 'vest'],
      torso: ['Strap the torso', 'chest straps fastened', 'strap'], legs: ['Leg straps', 'straps round the thighs', 'strap'],
      check: ['Check the straps', 'device does not shift', 'check'], headpad: ['Pad the head', 'head kept neutral', 'pad'],
      head: ['Secure the head', 'head strapped to the vest', 'vest'], move: ['Move to board', 'onto a long board', 'board'],
      pms2: ['Recheck all limbs', 'still present after', 'pulse'] },
    trauma: { bsi: GLOVES, scene: ['Scene size-up', 'safe; a 12 ft fall', 'eye'], gi: ['General impression', 'groaning, left side pain', 'eye'],
      airway: ['Airway', 'open and clear', 'tilt'], breath: ['Breathing', 'fast, shallow: oxygen on', 'mask'], circ: ['Circulation', 'pulse fast, skin pale', 'pulse'],
      priority: ['Priority, transport', 'transport now', 'ambulance'], vitals: ['Vital signs', 'pulse 124, BP 96/60', 'cuff'],
      history: ['SAMPLE history', 'history taken', 'clipboard'], head: ['Head', 'scalp scrape at the back', 'look'],
      neck: ['Neck and collar', 'tender neck: collar on', 'collar'], chest: ['Chest', 'left lower ribs tender', 'steth'], abd: ['Abdomen, pelvis', 'upper left tender', 'look'],
      legs: ['Limbs', 'left wrist swollen', 'look'], back: ['Back', 'nothing found', 'roll2'], reassess: ['Reassess', 'every 5 minutes', 'clock'] },
    medical: { bsi: GLOVES, scene: ['Scene size-up', 'safe; chest pain', 'eye'], gi: ['General impression', 'alert, anxious', 'eye'],
      airway: ['Airway, breathing', 'SpO2 91%: oxygen on', 'mask'], circ: ['Circulation', 'pulse 104, pale, sweaty', 'pulse'],
      priority: ['Priority, transport', 'transport now', 'ambulance'], opqrst: ['OPQRST', 'pressure into the left arm', 'clipboard'],
      sample: ['SAMPLE history', 'takes BP pills', 'clipboard'], focused: ['Heart and lungs', 'lungs clear', 'steth'], vitals: ['Vital signs', 'pulse 104, BP 152/94', 'cuff'],
      treat: ['Treat', 'aspirin per protocol', 'pill'], reassess: ['Reassess', 'every 5 minutes', 'clock'], report: ['Report', 'handoff to the next unit', 'report'] }
  };
  // what the patient shows from the order, by the patient's miss keys: [what was done, what it means]
  var LIVE = {
    'order': ['Tourniquet first', 'sheet wants pressure first'], 'abc': ['Shock care first', 'bleeding not controlled'],
    'suction': ['Breaths through vomit', 'vomit into the lungs'], 'check': ['Pulse before response', 'response comes first'],
    'opa': ['Airway after breaths', 'tongue may block'], 'open2': ['Airway not reopened', 'reopen before the OPA'],
    'order-stab-apply': ['Splint before holding', 'the break was moved'], 'order-pms1-apply': ['Late first check', 'check comes first'],
    'order-apply-pms2': ['Recheck too early', 'recheck comes after'], 'order-stab-site': ['Splint before holding', 'knee took the weight'],
    'order-pms1-site': ['Late first check', 'check comes first'], 'order-site-pms2': ['Recheck too early', 'recheck comes after'],
    'order-manual-collar': ['Collar before holding', 'the neck was moved'], 'order-collar-roll': ['Rolled before the collar', 'neck not protected'],
    'order-torso-head': ['Head before torso', 'body levers the neck'], 'order-pms1-collar': ['Late first check', 'check comes first'],
    'order-device-torso': ['Straps before the vest', 'no device behind yet'], 'order-reg-open': ['Opened too early', 'no regulator on yet'],
    'order-prefill-apply': ['Mask before filling', 'bag still empty'], 'order-flow-apply': ['Mask before the flow', 'no oxygen flowing yet'],
    'order-check-cpr': ['CPR before checking', 'pulse not checked first'], 'order-clear-shock': ['Shock before clear', 'someone may be touching'],
    'order-pads-shock': ['Shock without pads', 'no pads to deliver it'], 'order-breath-head': ['Exam before oxygen', 'breathing comes first'],
    'order-circ-head': ['Exam before circulation', 'circulation first'], 'order-airway-focused': ['Exam before airway', 'airway first']
  };
  // the tourniquet where it was put (station-patient's placeTourniquet kinds)
  var TQ = { ideal: 'bleeding stops', high: 'high and tight: stops', limb: 'wrong leg: still bleeding', groin: 'too high: still bleeding',
    joint: 'over the knee: still bleeding', distal: 'below the wound: still bleeding', over: 'on the wound: still bleeding' };

  /* ---- the icons on the sheet (a 32 by 32 box; the colour is the step's) ------------------------------------ */
  var I = {
    gloves: '<path class="ic-f" d="M9 29V17l-3-6c-.8-1.6 1.4-2.8 2.4-1.4L11 13V5.5c0-1.8 2.6-1.8 2.6 0V12V4c0-1.8 2.7-1.8 2.7 0v8V5c0-1.8 2.6-1.8 2.6 0v8V7.5c0-1.7 2.6-1.7 2.6 0V20c0 4-2 6-2.6 9z"/><path class="ic-l" d="M9 25h12"/>',
    gauze: '<rect class="ic-p" x="5" y="7" width="22" height="18" rx="2"/><path class="ic-l" d="M5 13h22M5 19h22M12 7v18M20 7v18"/><ellipse class="ic-r" cx="17" cy="17" rx="5" ry="4"/>',
    tq: '<rect class="ic-d" x="3" y="12" width="26" height="9" rx="2"/><rect class="ic-r" x="3" y="15.5" width="26" height="2"/><rect class="ic-f" x="10" y="8" width="13" height="5" rx="2.5" transform="rotate(-14 16 10)"/>',
    mask: '<path class="ic-p" d="M10 6c3-2 9-2 12 0l3 9c0 5-4 9-9 9s-9-4-9-9z"/><ellipse class="ic-f" cx="16" cy="27" rx="7" ry="3.6"/><path class="ic-l" d="M12 14h8M13 18h6"/>',
    bvm: '<ellipse class="ic-p" cx="12" cy="13" rx="9" ry="6"/><rect class="ic-d" x="20" y="11" width="4" height="4"/><path class="ic-f" d="M24 7h4l1 6-1 6h-4z"/><path class="ic-l" d="M6 13h12"/>',
    tank: '<rect class="ic-f" x="10" y="9" width="12" height="20" rx="5"/><rect class="ic-d" x="13" y="4" width="6" height="6" rx="1"/><path class="ic-l" d="M13 14h6"/>',
    blanket: '<path class="ic-f" d="M4 9h24v10H4z"/><path class="ic-p" d="M4 19h24l-3 6H7z"/><path class="ic-l" d="M8 9v10M14 9v10M20 9v10M26 9v10"/>',
    ambulance: '<path class="ic-p" d="M3 10h16v13H3z"/><path class="ic-p" d="M19 14h6l4 4v5H19z"/><path class="ic-r" d="M9 13h4v3h3v4h-3v3H9v-3H6v-4h3z" transform="translate(-.5 -1.5) scale(.9)"/><circle class="ic-d" cx="8" cy="24" r="2.6"/><circle class="ic-d" cx="23" cy="24" r="2.6"/>',
    radio: '<rect class="ic-f" x="10" y="8" width="12" height="21" rx="3"/><rect class="ic-d" x="12" y="3" width="2.5" height="6"/><rect class="ic-p" x="12.5" y="11" width="7" height="5" rx="1"/><path class="ic-l" d="M13 20h6M13 23h6"/>',
    shout: '<path class="ic-p" d="M4 6h24v14H14l-6 6v-6H4z"/><path class="ic-l" d="M16 9v6M16 17.5v.5"/>',
    pulse: '<path class="ic-r" d="M16 27S4 19 4 11.5C4 7 9 4.5 12 7.5L16 11l4-3.5C23 4.5 28 7 28 11.5 28 19 16 27 16 27z"/><path class="ic-w" d="M6 15h5l2-4 3 8 2-4h7"/>',
    tilt: '<path class="ic-p" d="M9 26c-3-3-4-8-2-12 2-5 8-8 13-6 3 1 5 4 5 7l2 4-3 1v3l-4 1"/><path class="ic-l" d="M22 5c3 1 5 3 6 6"/><path class="ic-a" d="M26 9l2 2-3 1"/>',
    suction: '<path class="ic-f" d="M5 27c0-9 5-13 11-13 5 0 7-3 7-8"/><rect class="ic-d" x="20" y="3" width="6" height="5" rx="1.5"/><path class="ic-l" d="M5 27c0-9 5-13 11-13 5 0 7-3 7-8" style="stroke-width:1.2"/>',
    opa: '<path class="ic-f" d="M8 6h8v4c5 0 9 5 9 11v5h-5v-5c0-3-2-6-5-6h-3v-4H8z"/>',
    eye: '<path class="ic-p" d="M2 16s5-8 14-8 14 8 14 8-5 8-14 8S2 16 2 16z"/><circle class="ic-f" cx="16" cy="16" r="5"/><circle class="ic-d" cx="16" cy="16" r="2"/>',
    look: '<circle class="ic-p" cx="13" cy="13" r="8"/><path class="ic-d" d="M19 19l8 8" style="stroke-width:4;stroke-linecap:round"/><path class="ic-l" d="M9 12a4 4 0 0 1 4-4"/>',
    hands: '<path class="ic-s" d="M3 13c3-1 7-1 9 1l3 3-2 2-3-2H3z"/><path class="ic-s" d="M29 19c-3 1-7 1-9-1l-3-3 2-2 3 2h7z"/><rect class="ic-p" x="10" y="14" width="12" height="4" rx="2"/>',
    hand: '<path class="ic-s" d="M8 28V16c0-2 3-2 3 0V8c0-2 3-2 3 0v-2c0-2 3-2 3 0v2c0-2 3-2 3 0v4c0-2 3-2 3 0v8c0 4-2 6-3 8z"/><circle class="ic-p" cx="15" cy="20" r="3.4"/>',
    head: '<circle class="ic-s" cx="16" cy="15" r="8"/><path class="ic-f" d="M5 9c-1 4-1 9 2 12l2-2c-2-3-2-6-1-9zM27 9c1 4 1 9-2 12l-2-2c2-3 2-6 1-9z"/><path class="ic-l" d="M16 23v6"/>',
    ruler: '<rect class="ic-y" x="3" y="11" width="26" height="10" rx="1.5" transform="rotate(-20 16 16)"/><path class="ic-l" d="M8 13l1 3M12 11.5l1.5 4M16 10l1 3M20 8.6l1.5 4M24 7.2l1 3" transform="rotate(0)"/>',
    splint: '<rect class="ic-y" x="4" y="11" width="24" height="10" rx="4"/><rect class="ic-p" x="7" y="13.5" width="18" height="5" rx="2.5"/>',
    cravat: '<rect class="ic-s" x="12" y="3" width="8" height="26" rx="4"/><rect class="ic-p" x="7" y="13" width="18" height="6" rx="2"/><path class="ic-p" d="M22 13l5-3 1 5-4 2z"/>',
    roll: '<circle class="ic-p" cx="12" cy="16" r="8"/><circle class="ic-l2" cx="12" cy="16" r="3"/><path class="ic-p" d="M12 8h14v16H12"/><path class="ic-l" d="M17 8v16M22 8v16"/>',
    collar: '<path class="ic-f" d="M5 12c4-4 18-4 22 0v8c-4 4-18 4-22 0z"/><path class="ic-p" d="M12 14c2-1 6-1 8 0v5c-2 1-6 1-8 0z"/>',
    board: '<rect class="ic-y" x="10" y="2" width="12" height="28" rx="6"/><rect class="ic-d" x="12" y="7" width="2.4" height="4" rx="1"/><rect class="ic-d" x="17.6" y="7" width="2.4" height="4" rx="1"/><rect class="ic-d" x="12" y="21" width="2.4" height="4" rx="1"/><rect class="ic-d" x="17.6" y="21" width="2.4" height="4" rx="1"/>',
    roll2: '<rect class="ic-y" x="4" y="20" width="24" height="7" rx="3.5"/><path class="ic-s" d="M10 18c0-6 4-10 8-10s5 4 5 10z"/><path class="ic-a" d="M6 10c2-4 6-6 10-6M6 10l-1-3M6 10l3-1"/>',
    pad: '<path class="ic-p" d="M4 12c0-3 3-5 6-4 4 1 8 1 12 0 3-1 6 1 6 4v8c0 3-3 5-6 4-4-1-8-1-12 0-3 1-6-1-6-4z"/><path class="ic-l" d="M9 16h14"/>',
    strap: '<rect class="ic-f" x="2" y="12" width="28" height="8" rx="2"/><rect class="ic-p" x="12" y="9" width="8" height="14" rx="2"/><rect class="ic-d" x="14.5" y="12" width="3" height="8"/>',
    blocks: '<rect class="ic-f" x="3" y="9" width="7" height="16" rx="2"/><rect class="ic-f" x="22" y="9" width="7" height="16" rx="2"/><circle class="ic-s" cx="16" cy="17" r="6"/><rect class="ic-p" x="3" y="12" width="26" height="3.5" rx="1"/>',
    vest: '<path class="ic-f" d="M8 4h16v6l4 4v14H4V14l4-4z"/><path class="ic-p" d="M4 16h24M4 22h24"/><path class="ic-l" d="M16 4v24"/>',
    aed: '<rect class="ic-o" x="4" y="6" width="24" height="21" rx="4"/><rect class="ic-d" x="8" y="9" width="16" height="6" rx="1.5"/><circle class="ic-r" cx="16" cy="21" r="3.6"/>',
    pads: '<rect class="ic-p" x="3" y="5" width="12" height="16" rx="3" transform="rotate(-10 9 13)"/><rect class="ic-p" x="17" y="11" width="12" height="16" rx="3" transform="rotate(12 23 19)"/><path class="ic-a" d="M10 8l-2 4h3l-2 4" transform="translate(-.5 0)"/>',
    cpr: '<path class="ic-s" d="M8 4h16v6c0 3-2 5-5 5h-6c-3 0-5-2-5-5z"/><path class="ic-a" d="M16 16v7M12 19l4 4 4-4"/><path class="ic-p" d="M4 26c4-2 20-2 24 0v3H4z"/>',
    clear: '<path class="ic-s" d="M6 20V9c0-1.6 2.5-1.6 2.5 0v7V5.5c0-1.6 2.5-1.6 2.5 0V16V7c0-1.6 2.5-1.6 2.5 0v11c0 4-2 7-4 9"/><path class="ic-s" d="M26 20V9c0-1.6-2.5-1.6-2.5 0v7V5.5c0-1.6-2.5-1.6-2.5 0V16V7c0-1.6-2.5-1.6-2.5 0v11c0 4 2 7 4 9"/>',
    bolt: '<path class="ic-o" d="M18 2L6 18h8l-3 12 13-17h-8z"/>',
    valve: '<rect class="ic-f" x="11" y="14" width="10" height="15" rx="4"/><rect class="ic-d" x="13" y="9" width="6" height="6"/><path class="ic-a" d="M8 7a8 5 0 0 1 16 0M24 7l-1-3M24 7l-3 1"/>',
    gauge: '<circle class="ic-p" cx="16" cy="15" r="10"/><path class="ic-l" d="M10 15a6 6 0 0 1 12 0"/><path class="ic-r" d="M16 15l5-4" style="stroke-width:2.4;stroke-linecap:round"/><rect class="ic-d" x="13" y="25" width="6" height="5"/>',
    ear: '<path class="ic-s" d="M11 26c-2-1-3-3-3-5 0-6-1-8 1-12 2-4 7-5 10-3 4 2 4 7 2 10-1 2-3 3-3 5s-2 6-7 5"/><path class="ic-a" d="M24 11c1 1 1 3 0 4M27 9c2 2 2 6 0 8"/>',
    tubing: '<path class="ic-c" d="M5 26c6 0 4-6 9-6s3 6 9 6 3-8-3-10-8-7-4-10 9 0 9 0"/>',
    bag: '<ellipse class="ic-p" cx="16" cy="19" rx="10" ry="9"/><path class="ic-f" d="M11 4h10l-1 7h-8z"/><path class="ic-l" d="M11 17c2 2 8 2 10 0"/>',
    flow: '<rect class="ic-p" x="11" y="3" width="10" height="24" rx="3"/><circle class="ic-f" cx="16" cy="11" r="3"/><path class="ic-l" d="M13 16h6M13 19h6M13 22h6"/>',
    kit: '<rect class="ic-o" x="3" y="10" width="26" height="17" rx="4"/><path class="ic-d" d="M11 10V7c0-2 10-2 10 0v3" style="fill:none;stroke-width:2.4"/><path class="ic-p" d="M14 14h4v3h3v4h-3v3h-4v-3h-3v-4h3z"/>',
    cuff: '<rect class="ic-f" x="3" y="9" width="17" height="12" rx="3"/><circle class="ic-p" cx="25" cy="22" r="5"/><path class="ic-l" d="M20 15c3 0 5 2 5 4"/><path class="ic-d" d="M25 22l2-2" style="stroke-width:1.6"/>',
    clipboard: '<rect class="ic-y" x="6" y="5" width="20" height="25" rx="3"/><rect class="ic-p" x="9" y="9" width="14" height="18" rx="1"/><rect class="ic-d" x="12" y="3" width="8" height="4" rx="1.5"/><path class="ic-l" d="M11 14h10M11 18h10M11 22h7"/>',
    steth: '<path class="ic-c" d="M8 4v8c0 5 8 5 8 0V4M12 16v5c0 5 9 6 10 0v-3"/><circle class="ic-f" cx="22" cy="15" r="4"/>',
    clock: '<circle class="ic-p" cx="16" cy="16" r="12"/><path class="ic-l" d="M16 9v7l5 3" style="stroke-width:2.2;stroke-linecap:round"/>',
    pill: '<rect class="ic-p" x="5" y="11" width="22" height="10" rx="5" transform="rotate(-30 16 16)"/><path class="ic-l" d="M12 20l8-8" transform="rotate(0)"/>',
    report: '<path class="ic-p" d="M4 6h24v15H14l-6 6v-6H4z"/><path class="ic-l" d="M9 11h14M9 15h10"/>',
    flat: '<rect class="ic-y" x="2" y="22" width="28" height="4" rx="2"/><circle class="ic-s" cx="6" cy="17" r="3.4"/><rect class="ic-s" x="10" y="15" width="18" height="5" rx="2.5"/>',
    check: '<circle class="ic-p" cx="16" cy="16" r="12"/><path class="ic-a" d="M10 16l4 4 8-8" style="stroke-width:2.6"/>'
  };
  function icon(k){ return '<svg class="ssx-ic" viewBox="0 0 32 32" aria-hidden="true">' + (I[k] || I.check) + '</svg>'; }

  function build(o){
    var K = window.LevlKit2, SP = window.NremtStationPatient, studio = o.studio;
    var St = { key: 'bleeding', done: [], at: [], order: 0, on: false, sec: 0, cued: false, prevLive: {} };
    var DEFS = {}; SP.pure.DEFS.forEach(function(d){ DEFS[d.key] = d; });
    function def(){ return DEFS[St.key]; }
    function row(key){
      var rows = (o.guide || document).querySelectorAll('.sheets-table tbody tr');
      for(var i = 0; i < rows.length; i++){
        var th = rows[i].querySelector('th'), td = rows[i].querySelectorAll('td');
        if(th && td.length >= 3 && ROW[key].test(th.textContent)) return { code: (th.querySelector('.sheet-code') || {}).textContent || '', min: parseInt(td[1].textContent, 10) || null, name: (th.querySelector('a') || th).textContent.replace(/\s+/g, ' ').trim() };
      }
      return { code: '', min: null, name: NAME[key] };
    }

    /* ---------------------------------------------------------------- the stage */
    var stage = el('div', 'ssx');
    var head = K.head({ purpose: 'Do each step on the patient, in the sheet’s order.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var box = el('div', 'ssx-scene');
    box.innerHTML =
      '<div class="ssx-pt"></div>' +
      '<div class="ssx-board">' +
        '<div class="ssx-clip" aria-hidden="true"><span></span></div>' +
        '<div class="ssx-paper">' +
          '<div class="ssx-top"><p class="ssx-name"><span class="ssx-code"></span><span class="ssx-title"></span></p>' +
            '<p class="ssx-limit"><svg class="ssx-watch" viewBox="0 0 24 24" aria-hidden="true"><rect x="9.5" y="1" width="5" height="3" rx="1"/><circle cx="12" cy="14" r="8.5"/><path d="M12 14V9"/></svg><span></span></p>' +
            '<p class="ssx-key"><i aria-hidden="true"></i>Critical</p>' +
            '<button type="button" class="ssx-reset" aria-label="Start this station over">Start over</button></div>' +
          '<p class="ssx-exam" hidden><b>Examiner</b><span></span></p>' +
          '<ol class="ssx-steps" aria-label="The steps of the sheet" data-ls-allchips></ol>' +
        '</div>' +
      '</div>' +
      '<div class="ssx-cuehost"></div>';
    stage.appendChild(box);
    var ptHost = box.querySelector('.ssx-pt'), board = box.querySelector('.ssx-board'), list = box.querySelector('.ssx-steps'),
      exam = box.querySelector('.ssx-exam'), reset = box.querySelector('.ssx-reset');
    var layer = K.layer(box.querySelector('.ssx-cuehost'));
    var cause = K.cause({ label: 'What the step did' });
    var lines = el('div', 'ssx-lines'); lines.appendChild(cause.el); stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---------------------------------------------------------------- the station */
    var patient = null, timers = [], tickT = 0, causeT = 0, lastBreath = null;
    function later(fn, ms){ var t = setTimeout(function(){ timers = timers.filter(function(x){ return x !== t; }); fn(); }, ms); timers.push(t); return t; }
    function clearTimers(){ timers.forEach(clearTimeout); timers = []; clearTimeout(causeT); causeT = 0; }
    function info(i){ var s = def().steps[i], t = (STEP[St.key] || {})[s.id] || [s.text, '', 'check']; return { s: s, name: t[0], eff: t[1], ic: t[2] }; }
    function doneMap(){ var m = {}; def().steps.forEach(function(s, i){ if(St.done[i]) m[s.id] = St.at[i]; }); return m; }
    function next(){ for(var i = 0; i < St.done.length; i++) if(!St.done[i]) return i; return -1; }

    function station(key, user){
      if(!DEFS[key]) return;
      clearTimers();
      St.key = key; St.done = def().steps.map(function(){ return false; }); St.at = def().steps.map(function(){ return 0; }); St.order = 0; St.sec = 0;
      St.prevLive = {}; lastBreath = null;
      var r = row(key);
      box.querySelector('.ssx-code').textContent = r.code;
      box.querySelector('.ssx-title').textContent = NAME[key];
      box.querySelector('.ssx-limit span').textContent = (r.min || '?') + ' min limit';
      box.setAttribute('data-station', key);
      list.innerHTML = def().steps.map(function(s, i){
        var f = info(i);
        return '<li><button type="button" class="ssx-step' + (s.critical ? ' is-crit' : '') + '" data-i="' + i + '" aria-pressed="false" title="' + esc(s.text) + '" aria-label="Step ' + (i + 1) + ': ' + esc(s.text) + (s.critical ? '. Critical.' : '.') + '">' +
          '<span class="ssx-n" aria-hidden="true"><span>' + (i + 1) + '</span><svg viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.2L15 7"/></svg></span>' + icon(f.ic) +
          '<span class="ssx-lab">' + esc(f.name) + '</span>' + (s.critical ? '<span class="ssx-crit" aria-hidden="true">Critical</span>' : '') + '</button></li>';
      }).join('');
      layout();
      if(patient){ patient.destroy(); patient = null; }
      ptHost.innerHTML = '';
      patient = SP.mount(ptHost, def(), {
        lie: true,
        placeText: '<b>Tap the thigh</b> where the tourniquet goes, or tap its step on the sheet.',
        squeeze: function(P){ return !!(St.key === 'bvm' && (P.st.done.vent1 || P.st.done.vent2)); },
        onPlace: function(i){ if(!St.done[i]) toggle(i, 'tap'); },
        onMove: function(i){ paintRows(); causeFor(i, true); },
        onBreath: function(r, iv){ breathCause(r, iv); },
        // on a small picture the assessment stations show the newest finding's words only (the others keep their dot)
        plateFilter: function(p){
          if(box.classList.contains('is-wide') || (St.key !== 'trauma' && St.key !== 'medical')) return true;
          var best = -1, id = null; def().steps.forEach(function(s, i){ if(St.done[i] && St.at[i] > best){ best = St.at[i]; id = s.id; } });
          return !!(id && patient && patient.lay && patient.lay[id] && patient.lay[id].contains(p));
        },
        onReady: function(P){ var sq = ptHost.querySelector('.sp-squeeze'); if(sq) ptHost.querySelector('.sp-stage').appendChild(sq); if(St.on) P.camera(true); }
      });
      paintRows();
      exam.hidden = true;
      cause.set([{ t: 'The patient', role: 'pt' }, { t: CASE[key], role: 'ink' }]);
      if(user && o.onAct) o.onAct('station', key);
      if(St.on){ startTick(); if(cue && cue.active()) placeCue(); }
    }

    function paintRows(){
      var nx = next(), lv = liveKeys();
      [].forEach.call(list.querySelectorAll('.ssx-step'), function(b, i){
        var on = !!St.done[i];
        b.classList.toggle('is-done', on);
        b.classList.toggle('is-next', i === nx);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        var bad = lv.some(function(x){ return x.i === i; });
        b.classList.toggle('is-flag', bad);
      });
      list.classList.toggle('is-started', St.order > 0);
    }

    /* the live marks: only what the ORDER of what was done shows (never a step simply not done yet) */
    function liveList(){
      if(!patient || !patient.ready) return [];
      var touched = def().steps.some(function(s, i){ return s.touch && St.done[i]; });
      var d = doneMap(), extra = [];
      /* the sheet's order rules (a before b): the patient marks b done before a; in free play b done with a not
         done yet is the same mistake made now (a shock with nobody cleared), so it is marked as it happens */
      (def().order || []).forEach(function(o){
        if(d[o[1]] && !d[o[0]]){
          var sb = def().steps.filter(function(x){ return x.id === o[1]; })[0] || {}, at = sb.at || [240, 300];
          extra.push({ key: 'order-' + o[0] + '-' + o[1], x: at[0] + 26, y: at[1] - 26, sev: o[3] || 'warn', text: o[2] });
        }
      });
      return extra.concat(patient.misses().filter(function(m){
        if(m.key === 'bsi') return touched;
        if(m.key === 'check') return /before responsiveness/.test(m.text);
        if(m.key === 'suction') return /through vomit/.test(m.text);
        if(m.key === 'opa') return /after ventilation/.test(m.text);
        return !!LIVE[m.key];
      }));
    }
    // which sheet row each live mark belongs to (the step done out of turn)
    function liveKeys(){
      return liveList().map(function(m){
        var id = m.key === 'bsi' ? 'bsi' : m.key === 'order' ? 'tq' : m.key === 'abc' ? 'o2' : m.key === 'check' ? 'check' : m.key === 'suction' ? 'suction' :
          m.key === 'opa' ? 'opa' : m.key === 'open2' ? 'open2' : m.key.split('-')[2] || m.key;
        var i = -1; def().steps.forEach(function(s, k){ if(s.id === id) i = k; });
        return { i: i, m: m };
      });
    }

    function toggle(i, how){
      if(!patient) return;
      var on = !St.done[i];
      St.done[i] = on; St.at[i] = on ? ++St.order : 0;
      if(cue) cue.hide(true);
      if(tour.active()) tour.did('step');
      patient.set(doneMap());
      var nx = next();
      patient.current(nx < 0 ? def().steps.length : nx);
      paintRows();
      examLine();
      var f = info(i);
      say((on ? 'Done: ' : 'Taken back: ') + f.s.text + '.');
      if(o.onAct) o.onAct('step', St.key);
      // the words wait for the picture: the item comes in (about half a second), then the cause line and the marks
      clearTimeout(causeT);
      if(K.reduced()){ causeFor(i, on); }
      else {
        // checked each frame: once every item coming in is mostly there (and every item leaving mostly gone)
        var t0 = performance.now(), items = [].slice.call(ptHost.querySelectorAll('.sp-item'));
        var wait = function(){
          var busy = items.some(function(it){ var o = +getComputedStyle(it).opacity, onIt = it.classList.contains('on'); return onIt ? o < 0.65 : o > 0.35; });
          if(busy && performance.now() - t0 < 1600){ causeT = setTimeout(wait, 40); return; }
          causeT = 0; causeFor(i, on);
        };
        causeT = setTimeout(wait, 60);
      }
      if(how !== 'tap') toView();
    }

    function causeFor(i, on){
      if(!patient) return;
      var lv = liveList(), fresh = lv.filter(function(m){ return !St.prevLive[m.key]; });
      St.prevLive = {}; lv.forEach(function(m){ St.prevLive[m.key] = 1; });
      patient.live(lv);
      paintRows();
      var f = info(i);
      if(on && fresh.length){
        var m = fresh[0], t = m.key === 'bsi' ? (St.done[0] ? ['Touched before gloves', 'bare hands'] : ['No gloves', 'bare hands on the patient']) : LIVE[m.key];
        cause.set([{ t: t[0], role: 'step' }, { t: t[1], role: 'pt' }, { t: m.sev === 'bad' ? 'Critical criterion' : 'Out of order', role: m.sev === 'bad' ? 'bad' : 'warn' }]);
        say(m.text);
        return;
      }
      if(!on){ cause.set([{ t: f.name, role: 'step' }, { t: 'taken back off', role: 'ink' }]); return; }
      var eff = f.eff;
      if(f.s.id === 'tq' && St.key === 'bleeding' && patient.st.tq) eff = TQ[patient.st.tq.kind] || eff;
      if(next() < 0 && !lv.length){ cause.take('All ' + St.done.length + ' steps in the sheet’s order. In the room, say each one out loud.'); return; }
      cause.set([{ t: f.name, role: 'step' }, { t: eff, role: 'pt' }, { t: f.s.critical ? 'Critical step' : 'Scored step', role: f.s.critical ? 'crit' : 'ink' }]);
    }

    function breathCause(r, iv){
      lastBreath = { r: r, iv: iv };
      var per = iv ? Math.round(60 / iv) : null;
      if(iv == null) cause.set([{ t: 'First breath', role: 'step' }, { t: 'chest rises', role: 'pt' }]);
      else if(iv >= 15) cause.set([{ t: 'A pause', role: 'step' }, { t: 'squeeze every 5 to 6 s', role: 'pt' }]);
      else cause.set([{ t: iv.toFixed(1) + ' s apart', role: 'step' }, { t: 'about ' + per + ' a minute', role: 'pt' },
        { t: r.rate === 'fast' ? 'Too fast: air to the stomach' : r.rate === 'slow' ? 'Too slow' : 'On rate', role: r.rate === 'ok' ? 'good' : 'bad' }]);
      if(o.onAct) o.onAct('breath', St.key);
    }

    // the examiner's words for the latest step that has them (a finding the examiner gives on an assessment station)
    function examLine(){
      var best = -1, txt = '';
      def().steps.forEach(function(s, i){
        // assessment stations: the examiner gives what you find; on a small picture the newest finding is already
        // written on the patient, so the clipboard keeps only real examiner cues there
        var t = s.cue || ((St.key === 'trauma' || St.key === 'medical') && box.classList.contains('is-wide') ? s.did : '');
        if(St.done[i] && t && St.at[i] > best){ best = St.at[i]; txt = t; }
      });
      exam.hidden = !txt;
      if(txt) exam.querySelector('span').textContent = txt;
      layout();
    }

    /* ---------------------------------------------------------------- layout: wide (patient | sheet) or stacked */
    function layout(){
      var W = box.clientWidth || stage.clientWidth || 360, wide = W >= 860, n = def().steps.length;
      box.classList.toggle('is-wide', wide);
      var cols = 1;
      if(wide){
        // the room the steps have, with the examiner's line counted at its tallest (three lines), so the number of
        // columns never depends on the line it changes (no back and forth)
        var hav = box.clientHeight - 230;
        cols = n * 50 > hav ? 2 : 1;
      } else cols = W >= 330 && n > 5 ? 2 : 1;
      list.style.setProperty('--rows', Math.ceil(n / cols));
      box.classList.toggle('is-2col', cols === 2);
    }
    // on a phone, a step tapped on the sheet below the picture brings the picture back into view
    function toView(){
      if(box.classList.contains('is-wide')) return;
      var r = ptHost.getBoundingClientRect(), vh = window.innerHeight || 800, seen = Math.min(r.bottom, vh) - Math.max(r.top, 60);
      if(seen < r.height * 0.55) ptHost.scrollIntoView({ block: 'start', behavior: K.reduced() ? 'auto' : 'smooth' });
    }

    /* ---------------------------------------------------------------- the clock (the bleed) while Explore shows */
    function startTick(){
      stopTick();
      tickT = setInterval(function(){ if(!St.on || document.hidden || !patient || (studio && studio.root && studio.root.classList.contains('is-sheet'))) return; St.sec++; patient.tick(St.sec); }, 1000);
    }
    function stopTick(){ if(tickT){ clearInterval(tickT); tickT = 0; } }

    /* ---------------------------------------------------------------- input */
    list.addEventListener('click', function(e){
      var b = e.target.closest('.ssx-step'); if(!b) return;
      toggle(+b.getAttribute('data-i'), e.detail === 0 ? 'key' : 'click');
    });
    list.addEventListener('keydown', function(e){
      var b = e.target.closest('.ssx-step'); if(!b) return;
      var all = [].slice.call(list.querySelectorAll('.ssx-step')), i = all.indexOf(b), j = -1;
      if(e.key === 'ArrowDown' || e.key === 'ArrowRight') j = Math.min(all.length - 1, i + 1);
      else if(e.key === 'ArrowUp' || e.key === 'ArrowLeft') j = Math.max(0, i - 1);
      else if(e.key === 'Home') j = 0; else if(e.key === 'End') j = all.length - 1;
      if(j >= 0){ e.preventDefault(); all[j].focus(); }
    });
    reset.addEventListener('click', function(){
      St.done.forEach(function(d, i){ St.done[i] = false; St.at[i] = 0; }); St.order = 0; St.prevLive = {};
      if(patient){ patient.st.breaths = { n: 0, fast: 0, slow: 0, long: 0, short: 0, gaps: [] }; patient.st.gastric = 0; patient.set({}); patient.live(null); patient.current(0); }
      paintRows(); examLine();
      clearTimeout(causeT);
      cause.set([{ t: 'The patient', role: 'pt' }, { t: CASE[St.key], role: 'ink' }]);
      say('Started over.');
    });
    box.addEventListener('pointerdown', function(e){ if(cue && cue.active() && e.target.closest('.ssx-pt, .ssx-board')) cue.hide(true); });

    var rt = null;
    if(window.ResizeObserver) new ResizeObserver(function(){ clearTimeout(rt); rt = setTimeout(function(){ layout(); if(cue && cue.active()) placeCue(); }, 60); }).observe(box);

    // "?" over the stage, or the page hidden: the clock pauses (the camera has nothing running between steps)
    document.addEventListener('visibilitychange', function(){ if(document.hidden) clearTimers(); });

    /* ---------------------------------------------------------------- the cue and "Show me how" */
    var cue = null;
    function firstRow(){ return list.querySelector('.ssx-step'); }
    function placeCue(){ if(cue) cue.place(); }
    function makeCue(){
      var wide = box.classList.contains('is-wide');
      cue = K.cue(layer, { key: 'nremt-skillsheets', text: 'Tap a step on the sheet', side: wide ? 'left' : 'above', at: function(){
        var b = firstRow(), h = box.getBoundingClientRect(); if(!b) return [0, 0];
        var r = b.getBoundingClientRect();
        return wide ? [r.left - h.left - 6, r.top - h.top + r.height / 2] : [r.left - h.left + Math.min(110, r.width / 2), r.top - h.top - 8];
      } });
    }
    var tour = K.tour({ key: 'nremt-skillsheets', label: 'Show me how', steps: [
      { id: 'step', text: 'Tap a step on the sheet: it happens on the patient. Tap it again to take it back.', target: function(){ return firstRow(); } },
      { id: 'pt', text: 'Watch the patient. A step done out of order shows here, marked "!".', target: function(){ return ptHost; } },
      { id: 'crit', text: 'Red "Critical" steps fail the station if missed. The timed run is in Test yourself.', target: function(){ return list.querySelector('.ssx-crit') || firstRow(); } }
    ] });
    function startTour(){ if(cue) cue.hide(true); tour.start(true); }

    /* ---------------------------------------------------------------- "?" */
    var ref = el('div', 'ssx-ref');
    ref.innerHTML =
      '<h3>What you are looking at</h3>' +
      '<p>A patient for one psychomotor station and, beside them, that station’s skill sheet on the examiner’s clipboard: the steps in the order the National Registry’s sheet lists them, paraphrased. Tap a step and it happens on the patient; tap it again to take it back. Steps marked <b>Critical</b> are on the sheet’s critical criteria: missing one fails the station however many points you score.</p>' +
      '<ul class="ssx-ref-l">' +
      '<li><b>Out of order.</b> Do steps in any order. When the order itself is a problem (touching the patient before gloves, a splint before the limb is held, a shock before everyone is clear), the patient shows it, marked "!", and the line under the picture names it. Red there means a critical criterion is involved.</li>' +
      '<li><b>The examiner.</b> On the clipboard, what the examiner tells you after a step (the wound keeps bleeding; on the assessment stations, what you find).</li>' +
      '<li><b>Bleeding control.</b> Tap the thigh to place the tourniquet yourself; a tourniquet over the knee, on the wound or below it does not stop the bleed. <b>BVM.</b> Once you ventilate, squeeze the bag on the picture: about one breath every 5 to 6 seconds.</li>' +
      '<li><b>The clock.</b> Each sheet has a time limit (on the clipboard). Explore has no clock and no score; run a station against the clock in <button type="button" class="tk2-link ssx-ref-test">Test yourself</button>.</li>' +
      '</ul>' +
      '<p class="ssx-ref-p"><button type="button" class="tk2-how ssx-ref-how">Show me how</button></p>' +
      '<h3 class="ssx-ref-vh">What varies by program</h3><ul class="ssx-ref-notes"></ul>' +
      '<div class="ssx-ref-more"></div>' +
      '<p class="ssx-ref-s">Patient figure rendered from <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noopener">BodyParts3D</a>, © 2008 Life Science Integrated Database Center, <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noopener">CC BY-SA 2.1 Japan</a>. A study aid, not a substitute for practice with your instructor. For exam study only. Follow your local protocols and medical direction.</p>';
    ref.querySelector('.ssx-ref-how').addEventListener('click', function(){ if(studio){ if(studio.kit2 && studio.kit2.mode() !== 'explore') studio.kit2.go('explore'); if(studio.close) studio.close(); } setTimeout(startTour, 60); });
    ref.querySelector('.ssx-ref-test').addEventListener('click', function(){ if(studio && studio.kit2){ if(studio.close) studio.close(); studio.kit2.go('quiz'); } });
    function refNotes(){ ref.querySelector('.ssx-ref-vh').textContent = 'What varies by program: ' + NAME[St.key]; ref.querySelector('.ssx-ref-notes').innerHTML = def().notes.map(function(n){ return '<li>' + n + '</li>'; }).join(''); }

    // the station picker: one dropdown at the stage's top left (Explore only)
    var pick = studio && studio.picker ? studio.picker({ label: 'Station', groups: GROUPS.map(function(g){ return { label: g.label, items: g.keys.map(function(k){ return { value: k, label: NAME[k], sub: '' }; }) }; }),
      value: St.key, onChange: function(v){ station(v, true); refNotes(); if(history.replaceState) history.replaceState(null, '', '#station-' + slugOf(v)); } }, 'explore') : null;
    function slugOf(key){ return ({ bleeding: 'bleeding-control-shock-management', bvm: 'bvm-ventilation-of-an-apneic-adult', oxygen: 'oxygen-administration-by-non-rebreather-mask',
      aed: 'cardiac-arrest-management-aed', longbone: 'long-bone-immobilization', joint: 'joint-immobilization', supine: 'spinal-immobilization-supine-patient',
      seated: 'spinal-immobilization-seated-patient', trauma: 'patient-assessment-trauma', medical: 'patient-assessment-medical' })[key]; }
    function keyOf(slug){ var k = null; Object.keys(NAME).forEach(function(x){ if(slugOf(x) === slug) k = x; }); return k; }

    if(o.guide) ref.querySelector('.ssx-ref-more').appendChild(o.guide);
    station(St.key, false); refNotes();
    var api = {
      stage: stage, ref: ref, more: ref.querySelector('.ssx-ref-more'),
      hidden: function(){ St.on = false; stopTick(); clearTimers(); if(patient){ cancelAnimationFrame(patient.raf); patient.raf = 0; clearTimeout(patient.camT); clearTimeout(patient.ut); patient.svg.style.transform = ''; if(patient.svg2) patient.svg2.style.transform = ''; } if(cue) cue.hide(false); },
      shown: function(){
        St.on = true; layout(); startTick();
        if(patient && patient.ready) patient.camera(true);
        if(!St.cued){ St.cued = true; later(function(){ if(!cue) makeCue(); if(St.on && St.order === 0 && cue.show()) placeCue(); }, 350); }
      },
      show: function(key){ if(!DEFS[key]) return false; if(pick) pick.value(key); station(key, false); refNotes(); return true; },
      keyOf: keyOf, slugOf: slugOf,
      key: function(){ return St.key; },
      patient: function(){ return patient; },
      _state: function(){ return { key: St.key, done: St.done.slice(), at: St.at.slice(), on: St.on, sec: St.sec, chain: cause.text(), take: cause.el.classList.contains('is-take') ? cause.el.textContent : '',
        live: liveList().map(function(m){ return m.key; }), tick: !!tickT, timers: timers.length + (causeT ? 1 : 0), cam: !!(patient && patient.raf), lie: !!(patient && patient.lie),
        exam: exam.hidden ? '' : exam.querySelector('span').textContent, breath: lastBreath }; }
    };
    window.NremtSkillExplore.last = api; // for the sweep
    return api;
  }

  window.NremtSkillExplore = { build: build, STEP: STEP, NAME: NAME, LIVE: LIVE, GROUPS: GROUPS };
})();
