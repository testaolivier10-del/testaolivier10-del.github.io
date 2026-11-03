/* AP® Macroeconomics graders: ApMacroGrade (docs/apmacro-spec.md section 7,
   docs/apmacro-architecture.md "Content formats"). Pure, no DOM: the question
   engine (mac-questions.js), the tools, the content check and the tests all
   call it. Nothing here is graded by an AI model. Forked from AP®
   Environmental Science's grader: numbers (descriptive statistics, worked
   by hand; the unit is optional: %, points, hours), and the "Make it
   specific" builders with macroeconomics slots and hint flags.

     ApMacroGrade.readNumber(typed) -> { value, unit, scale } or null
       "2.5 million people", "2.5e6", "2.5 × 10^6 kWh", "2.5x10^6", "1,250 kg",
       "12%", "−3.4 %", "4.5 billion", "3 thousand", superscript powers.
       scale is the scale word read ("million"), so feedback can name it.
     ApMacroGrade.normUnit(u) -> a canonical form, so kWh = kW·h = kW h = kW*h,
       people/km^2 = people per km² = persons/square kilometer, % = percent,
       yr = year = years = y. An unreadable token only matches itself.
     ApMacroGrade.unitIs(typed, list) -> true when typed is one of list.
     ApMacroGrade.tolerance(N) -> the allowed distance from the key: N.tol
       (absolute) or N.rel (relative) if given, else the larger of 1% of the
       key and half a unit in the key's last shown place (N.places).
     ApMacroGrade.numeric(N, typed | { value, unit }) ->
       { valid, correct, score, value, parts: { value, unit }, notes, mistake }
       N: { answer, unit?, units?: [other accepted spellings], askUnit?
            (default: true when unit is set), places?, tol?, rel?,
            mistakes?: [{ value, why, unit? }] }
       The value and the unit are graded separately (the reader's point for
       an answer "with units"); authored mistakes are matched first, then the
       slips the Chief Reader Reports name: forgot × 100 (or did it twice),
       a factor of 1000 or a million (a prefix or a scale word), the sign.
     ApMacroGrade.formatKey(N) -> the key as text, with its unit.
     ApMacroGrade.specific(S, picks) -> { valid, correct, slots: { name: bool }, notes }
       the "Make it specific" builder: picks = { slot: option index }, every
       slot graded exactly (spec section 7, rule 4).
     ApMacroGrade.flags(S, text) -> [{ rule, ok, hint }]
       the free-text layer: hints only, never a score (rule 4). Rules from
       S.write: directional, noQuestion, variable [words], otherThan [words
       that must not appear], mechanism, context [words], forbid [phrases],
       cite (a "Source n" citation), concept [accepted concept words],
       restricted [words that do not count as the concept]. */
(function(root){
  'use strict';

  var SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  function unsup(x){ return String(x).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, function(c){ return SUP[c]; }); }
  var SCALE = { thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12, quadrillion: 1e15 };

  /* A typed answer, split into its number and unit. Commas are thousands
     separators ("1,250"); powers of ten may be e6, × 10^6, x10^6, *10**6 or
     10⁶; a scale word (thousand, million, billion, trillion) multiplies. */
  var NUM_RE = /^([+-]?)\s*([0-9][0-9,]*\.?[0-9]*|\.[0-9]+)\s*(?:[eE]\s*([+-]?[0-9]+)|[×xX*·]\s*10\s*(?:\^|\*\*)?\s*\(?\s*([+-]?[0-9]+)\s*\)?)?(?![0-9])\s*(.*)$/;
  // A unit may have a number in its denominator ("per 1,000 people",
  // "births/1000", "per 100,000"); that number is part of the unit, not a
  // second answer.
  var NUM_DEN = /(?:\bper|\/)\s*\d[\d,]*(?:\.\d+)?/gi;
  function readNumber(s){
    // A superscript run after a digit is a power ("10⁶" is 10^6, never 106);
    // after a letter it stays a unit power (km², handled by normUnit).
    s = String(s == null ? '' : s).replace(/(\d)\s*([⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+)/g, function(m, d, sup){ return d + '^(' + unsup(sup) + ')'; });
    s = unsup(s).trim().replace(/[−–—]/g, '-').replace(/\s+/g, ' ');
    if(!s) return null;
    // A power of ten or a scale word with no number before it: "10^6 times",
    // "10^(6)", "a million times", "one billion" (Bluebook answers to "how
    // many times" questions).
    var pw = /^([+-]?)\s*10\s*(?:\^|\*\*)\s*\(?\s*([+-]?\d+)\s*\)?(?![0-9.])\s*(.*)$/.exec(s);
    if(pw) s = pw[1] + '1e' + pw[2] + (pw[3] ? ' ' + pw[3] : '');
    var sw = /^(?:(?:a|an|one)\s+)?(thousand|million|billion|trillion)\b\s*(.*)$/i.exec(s);
    if(sw) s = '1 ' + sw[1] + (sw[2] ? ' ' + sw[2] : '');
    var m = NUM_RE.exec(s);
    if(!m) return null;
    var digits = m[2], ex = m[3] != null ? m[3] : m[4], rest = (m[5] || '').trim();
    if(/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(digits)) digits = digits.replace(/,/g, '');
    else if(digits.indexOf(',') > -1) return null;
    var v = parseFloat(digits) * (ex != null ? Math.pow(10, +ex) : 1);
    if(!isFinite(v)) return null;
    var scale = null, sm = /^(thousand|million|billion|trillion|quadrillion)s?\b\s*(.*)$/i.exec(rest);
    if(sm){ scale = sm[1].toLowerCase(); v *= SCALE[scale]; rest = sm[2].trim(); }
    // A stray second number in the unit means the input is not one answer
    // ("2 3 kg"), except exponents right after a letter (km2, m^3, s-1).
    if(/[0-9]/.test(rest.replace(NUM_DEN, ' per ').replace(/([A-Za-z°)])(\^|\*\*)?[+-]?[0-9]+/g, '$1'))) return null;
    return { value: m[1] === '-' ? -v : v, unit: rest, scale: scale, digits: digits };
  }

  /* Units are compared after normalizing how they can be typed. Words and
     symbols, plurals, "per", "square" and "cubic", superscripts, the
     multiplication dot. Case matters for symbols (mg vs Mg) but not for
     words. */
  var WORDS = {
    percent: '%', percents: '%', pct: '%',
    year: 'yr', years: 'yr', yr: 'yr', yrs: 'yr', y: 'yr', annum: 'yr',
    day: 'day', days: 'day', d: 'day', hour: 'h', hours: 'h', hr: 'h', hrs: 'h', h: 'h', minute: 'min', minutes: 'min', min: 'min', mins: 'min',
    second: 's', seconds: 's', sec: 's', s: 's', week: 'week', weeks: 'week', month: 'month', months: 'month',
    person: 'person', people: 'person', persons: 'person', individual: 'individual', individuals: 'individual',
    organism: 'organism', organisms: 'organism', household: 'household', households: 'household', home: 'home', homes: 'home',
    tree: 'tree', trees: 'tree', fish: 'fish', bird: 'bird', birds: 'bird', car: 'car', cars: 'car', vehicle: 'vehicle', vehicles: 'vehicle',
    bulb: 'bulb', bulbs: 'bulb', woman: 'woman', women: 'woman', child: 'child', children: 'child', births: 'birth', birth: 'birth', deaths: 'death', death: 'death',
    dollar: '$', dollars: '$', usd: '$', '$': '$', cent: 'cent', cents: 'cent',
    gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg', milligram: 'mg', milligrams: 'mg', microgram: 'ug', micrograms: 'ug',
    tonne: 'tonne', tonnes: 'tonne', 'metric ton': 'tonne', ton: 'ton', tons: 'ton', pound: 'lb', pounds: 'lb', lbs: 'lb', ounce: 'oz', ounces: 'oz',
    meter: 'm', meters: 'm', metre: 'm', metres: 'm', kilometer: 'km', kilometers: 'km', kilometre: 'km', kilometres: 'km',
    centimeter: 'cm', centimeters: 'cm', millimeter: 'mm', millimeters: 'mm', foot: 'ft', feet: 'ft', inch: 'in', inches: 'in', mile: 'mi', miles: 'mi', yard: 'yd', yards: 'yd',
    hectare: 'ha', hectares: 'ha', acre: 'acre', acres: 'acre',
    liter: 'L', liters: 'L', litre: 'L', litres: 'L', l: 'L', milliliter: 'mL', milliliters: 'mL', ml: 'mL', gallon: 'gal', gallons: 'gal',
    joule: 'J', joules: 'J', kilojoule: 'kJ', kilojoules: 'kJ', megajoule: 'MJ', megajoules: 'MJ', calorie: 'cal', calories: 'cal', kilocalorie: 'kcal', kilocalories: 'kcal', kcal: 'kcal', cal: 'cal',
    watt: 'W', watts: 'W', kilowatt: 'kW', kilowatts: 'kW', megawatt: 'MW', megawatts: 'MW', gigawatt: 'GW', gigawatts: 'GW',
    btu: 'BTU', btus: 'BTU', quad: 'quad', quads: 'quad', therm: 'therm', therms: 'therm',
    // Metric tons as t or MT (never Mt, a megaton), decades, nanograms, kiloliters, seconds.
    t: 'tonne', MT: 'tonne', decade: 'decade', decades: 'decade', nanogram: 'ng', nanograms: 'ng', kiloliter: 'kL', kiloliters: 'kL', secs: 's',
    celsius: '°C', fahrenheit: '°F',
    // "How many times": times, x, fold and × all mean a plain multiplier.
    times: 'times', x: 'times', X: 'times', fold: 'times', '-fold': 'times',
    // Scale words in a unit's denominator: "per thousand" is "per 1,000".
    hundred: 'n100', thousand: 'n1000', million: 'n1000000',
    ppm: 'ppm', ppb: 'ppb', 'kilowatt-hour': 'kWh', 'kilowatt-hours': 'kWh', 'megawatt-hour': 'MWh', 'megawatt-hours': 'MWh'
  };
  // Compound symbols read as products: kWh is kW h, so "kW·h" and "kWh" agree.
  var COMPOUND = { kWh: ['kW', 'h'], MWh: ['MW', 'h'], GWh: ['GW', 'h'], TWh: ['TW', 'h'], Wh: ['W', 'h'] };
  function normUnit(u){
    u = unsup(String(u || '')).trim();
    if(!u) return '';
    if(/^(?:×|x|X|times|-?fold)$/.test(u)) return 'times';
    u = u.replace(/\b(?:degrees?|deg)\s*(C|F|celsius|fahrenheit)\b/gi, function(m, x){ return '°' + x.charAt(0).toUpperCase(); }).replace(/°\s+([CF])\b/g, '°$1')
      .replace(/\bmetric\s+ton(?:ne)?s?\b/gi, 'tonne').replace(/kilowatt[- ]hours?/gi, 'kWh').replace(/megawatt[- ]hours?/gi, 'MWh')
      .replace(/\bsquare\s+([A-Za-z]+)/gi, '$1^2').replace(/\bsq\.?\s+([A-Za-z]+)/gi, '$1^2').replace(/\bcubic\s+([A-Za-z]+)/gi, '$1^3')
      .replace(/([A-Za-z]+)\s+squared\b/gi, '$1^2').replace(/([A-Za-z]+)\s+cubed\b/gi, '$1^3')
      .replace(/\b(?:per|each|every|a)\b/gi, '/').replace(/\s*[·*•⋅×]\s*/g, ' ').replace(/[()]/g, ' ').replace(/\^/g, '');
    var agg = {};
    u.split('/').forEach(function(part, i){
      part.trim().split(/\s+/).filter(Boolean).forEach(function(tok){
        if(tok === 'of' || tok === 'the' || tok === '1') return;
        // A number in a unit ("per 1,000 people", "/100000"): one token, commas dropped.
        if(/^\d[\d,]*$/.test(tok)){ var nt = 'n' + tok.replace(/,/g, ''); agg[nt] = (agg[nt] || 0) + (i ? -1 : 1); return; }
        if(tok === '×'){ agg.times = (agg.times || 0) + 1; return; }
        var m = /^([A-Za-z°%$µμ][A-Za-z°%µμ-]*?)(-?\d+)?$/.exec(tok);
        if(!m){ agg['?' + tok] = (agg['?' + tok] || 0) + 1; return; }
        var name = m[1].replace(/[µμ]/g, 'u'), low = name.toLowerCase();
        var canon = WORDS[name] || WORDS[low] || (/^[a-z]{4,}s$/.test(name) && WORDS[low.slice(0, -1)]) || name;
        var e = (m[2] ? +m[2] : 1) * (i ? -1 : 1);
        (COMPOUND[canon] || [canon]).forEach(function(c){ agg[c] = (agg[c] || 0) + e; });
      });
    });
    return Object.keys(agg).filter(function(k){ return agg[k]; }).sort().map(function(k){ return agg[k] === 1 ? k : k + agg[k]; }).join(' ');
  }
  /* A crude rate keyed "births per 1,000 people" also accepts "per 1,000",
     "per thousand people" and "/1000": when both units carry a number in the
     denominator, the counted nouns (births, people ...) may be left out. */
  var COUNTED = { person: 1, birth: 1, death: 1, individual: 1, woman: 1, child: 1 };
  function bare(n){ return n.split(' ').filter(function(k){ return !COUNTED[k.replace(/-?\d+$/, '')]; }).join(' '); }
  function unitIs(typed, list){
    var t = normUnit(typed);
    return list.some(function(u){ var w = normUnit(u); return w === t || (/\bn\d+-1\b/.test(w) && /\bn\d+-1\b/.test(t) && bare(w) === bare(t)); });
  }

  /* The same unit with another prefix (kg for g, MWh for kWh), as a factor:
     typed value × factor = value in the wanted unit; null when unrelated. */
  var PREFIX = { T: 1e12, G: 1e9, M: 1e6, k: 1e3, h: 1e2, c: 1e-2, m: 1e-3, u: 1e-6, n: 1e-9 };
  function prefixFactor(typed, want){
    var t = normUnit(typed), w = normUnit(want);
    if(!t || !w || t === w) return t === w ? 1 : null;
    var bareW = String(want).trim(), baseW = bareW.replace(/^[TGMkhcmunµμ](?=[A-Za-z])/, ''), fw = baseW === bareW ? 1 : PREFIX[bareW.charAt(0).replace(/[µμ]/, 'u')];
    for(var p in PREFIX) if(normUnit(p + baseW) === t) return PREFIX[p] / fw;
    if(normUnit(baseW) === t) return 1 / fw;
    return null;
  }

  function places(N){
    if(N.places != null) return N.places;
    return null;
  }
  function tolerance(N){
    if(N.tol != null) return +N.tol;
    var A = Math.abs(+N.answer);
    if(N.rel != null) return +N.rel * A;
    var p = places(N), half = p == null ? 0 : 0.5 * Math.pow(10, -p);
    return Math.max(0.01 * A, half, 1e-12);
  }
  function near(v, A, tol){ return Math.abs(v - A) <= tol + 1e-9 * Math.abs(A); }

  /* A key whose unit starts with a scale word ("billion metric tons",
     "million people") is read in base units, so the scale word typed and the
     one in the key's unit cancel: "10.8 billion metric tons",
     "1.08e10 metric tons" and "10,800,000,000 t" all match a key of 10.8
     billion metric tons (u1-math review). A bare number in the key's scale
     ("10.8") still matches the value. */
  var SCALE_UNIT = /^\s*(thousand|million|billion|trillion)s?\b\s*/i;
  function baseKey(N){
    var m = SCALE_UNIT.exec(String(N.unit || ''));
    if(!m) return null;
    var k = SCALE[m[1].toLowerCase()], o = {}, key;
    for(key in N) o[key] = N[key];
    o.answer = +N.answer * k; o.unit = String(N.unit).replace(SCALE_UNIT, '');
    o.units = (N.units || []).map(function(u){ return String(u).replace(SCALE_UNIT, ''); });
    if(N.tol != null) o.tol = N.tol * k;
    o.places = null;
    o.mistakes = (N.mistakes || []).map(function(mk){ var c = {}, x; for(x in mk) c[x] = mk[x]; c.value = +mk.value * k; if(mk.tol != null) c.tol = mk.tol * k; return c; });
    o.scaleWord = m[1].toLowerCase(); o.scaleK = k;
    return o;
  }
  function numeric(N, typed){
    N = N || {};
    var B = baseKey(N);
    if(B){
      var p0 = readNumber(typed && typeof typed === 'object' ? typed.value : typed);
      // No scale word typed and the number is the key's own size: read it in the key's scale.
      if(p0 && !p0.scale && !/^\s*\S*\s*(?:e|×|x|\*)/.test(String(typed)) && Math.abs(p0.value) < B.scaleK / 10){
        var t2 = typed && typeof typed === 'object' ? { value: String(typed.value) + ' ' + B.scaleWord, unit: typed.unit } : String(typed).replace(/^(\s*[+-]?[0-9.,]+)/, '$1 ' + B.scaleWord);
        return numeric(B, t2);
      }
      return numeric(B, typed);
    }
    var raw = typed && typeof typed === 'object' ? typed.value : typed;
    var p = readNumber(raw);
    if(!p) return { valid: false, correct: false, score: 0, notes: ['Type a number, such as 1250, 2.5 million or 2.5e6, then its unit.'] };
    var unitTyped = typed && typeof typed === 'object' && typed.unit != null && String(typed.unit).trim() ? String(typed.unit).trim() : p.unit;
    var A = +N.answer, tol = tolerance(N), notes = [], mistake = null;
    var accepted = [N.unit].concat(N.units || []).filter(function(u){ return u != null && u !== ''; });
    var ask = N.askUnit != null ? !!N.askUnit : accepted.length > 0;
    // "How many times": the multiplier word is optional, never a lost point.
    if(ask && accepted.length && normUnit(N.unit) === 'times' && (!unitTyped || normUnit(unitTyped) === 'times')){ ask = false; }
    var parts = { value: near(p.value, A, tol), unit: null };
    if(ask && accepted.length){
      if(!unitTyped){ parts.unit = false; notes.push('Units: an answer needs its unit. This one is in ' + N.unit + '.'); }
      else if(unitIs(unitTyped, accepted)) parts.unit = true;
      else {
        parts.unit = false;
        var k = prefixFactor(unitTyped, N.unit);
        if(k != null && near(p.value * k, A, tol)) notes.push('Units: your number is right in ' + unitTyped + ', but the question asks for ' + N.unit + '. Convert before you report it.');
        else notes.push('Units: ' + unitTyped + ' is not the unit of this answer. It is in ' + N.unit + '.');
      }
    }
    if(!parts.value){
      (N.mistakes || []).some(function(mk){
        if(near(p.value, +mk.value, Math.max(tol, tolerance({ answer: mk.value, places: N.places, tol: mk.tol, rel: mk.rel }))) && (!mk.unit || !unitTyped || unitIs(unitTyped, [mk.unit]))){ mistake = mk; return true; }
        return false;
      });
      var v = p.value;
      var unitSaid = notes.length && /right in/.test(notes[0]);
      if(mistake) notes.unshift(mistake.why);
      else if(unitSaid){ /* the unit note already explains the number */ }
      else if(A && near(v * 100, A, tol)) notes.unshift('Value: your number is 100 times too small. A percent is the fraction times 100 (0.84 is 84%).');
      else if(A && near(v / 100, A, tol)) notes.unshift('Value: your number is 100 times too large. Check that you multiplied by 100 only once.');
      else if(A && (near(v / 1000, A, tol) || near(v * 1000, A, tol))) notes.unshift('Value: off by a factor of 1000. Check a prefix (k, M, m) or the word "thousand".');
      else if(A && (near(v / 1e6, A, tol) || near(v * 1e6, A, tol))) notes.unshift('Value: off by a factor of a million. Check "million" or the power of ten (× 10^6).');
      else if(A && (near(v / 1e9, A, tol) || near(v * 1e9, A, tol))) notes.unshift('Value: off by a factor of a billion. Check "billion" or the power of ten (× 10^9).');
      else if(A && near(-v, A, tol)) notes.unshift('Value: the size is right but the sign is wrong. Decide the direction first: a decrease, a tax multiplier or a deficit is negative.');
      else if(A && near(v, A, tol * 10)) notes.unshift('Value: close. Keep every digit until the last step, then round.');
      else notes.unshift('Value: not this number. Check the setup step by step.');
    }
    var graded = ['value', 'unit'].filter(function(k){ return parts[k] !== null; });
    var right = graded.filter(function(k){ return parts[k]; }).length;
    return { valid: true, correct: right === graded.length, score: right / graded.length, value: p.value, scale: p.scale, parts: parts, notes: notes, mistake: mistake, right: right, total: graded.length };
  }

  /* The key as text: rounded to its places (else to 4 significant figures,
     trailing zeros dropped), thousands separated, then the unit. */
  function formatKey(N){
    var a = Number(N.answer), s;
    if(N.places != null) s = a.toFixed(N.places);
    else s = String(+a.toPrecision(Math.abs(a) >= 1e4 ? Math.max(4, Math.floor(Math.log10(Math.abs(a))) + 1) : 4));
    if(Math.abs(a) >= 1e15 || (Math.abs(a) > 0 && Math.abs(a) < 1e-4)) s = (+a.toPrecision(3)).toExponential().replace(/e\+?(-?\d+)/, ' × 10^$1');
    else if(Math.abs(a) >= 1e4) s = s.replace(/^(-?\d+)(\.\d+)?$/, function(m, i, d){ return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d || ''); });
    return s + (N.unit ? ' ' + N.unit : '');
  }

  /* ------------------------------------------------- "Make it specific" */
  // Macroeconomics builders (spec section 3, "Causal chains"): the policy or
  // shock, each link of the chain, the curve, its direction, the outcome.
  var SLOT_NAME = { policy: 'the policy', tool: 'the tool', shock: 'the change', curve: 'the curve', market: 'the market', direction: 'the direction', change: 'the change',
    because: 'the reason', link: 'the next link', rate: 'the interest rate', spending: 'the spending', output: 'real output', price: 'the price level',
    unemployment: 'unemployment', currency: 'the currency', netExports: 'net exports', multiplier: 'the multiplier', gap: 'the gap', claim: 'the claim',
    concept: 'the macroeconomics concept', variable: 'the variable', trend: 'the trend' };
  function specific(S, picks){
    var slots = (S && S.slots) || {}, names = Object.keys(slots), out = {}, notes = [];
    if(!names.length) return { valid: false, correct: false, notes: ['This item has no builder.'] };
    if(!picks || names.some(function(n){ return picks[n] == null || picks[n] === ''; })) return { valid: false, correct: false, notes: ['Choose an option in every blank.'] };
    names.forEach(function(n){
      var s = slots[n], ok = +picks[n] === s.correct;
      out[n] = ok;
      if(!ok){ var why = s.why && s.why[+picks[n]]; notes.push('Check ' + (s.label ? s.label.toLowerCase() : SLOT_NAME[n] || n) + (why ? ': ' + why : '.')); }
    });
    return { valid: true, correct: names.every(function(n){ return out[n]; }), slots: out, notes: notes, right: names.filter(function(n){ return out[n]; }).length, total: names.length };
  }

  var DIRECTIONAL = /\b(increase[sd]?|decrease[sd]?|higher|lower|more|less|fewer|greater|smaller|larger|rise[sn]?|rose|fall[sn]?|fell|drop(s|ped)?|grow(s|n)?|decline[sd]?|reduce[sd]?)\b/;
  var VAGUE = /\b(affects?|affected|impacts?|impacted|changes?|changed|alters?|altered|influences?|better|worse)\b/;
  var MECHANISM = /\b(because|since|so that|which (then )?(causes?|leads?|means|lets|allows|reduces?|increases?|shows?|suggests?)|leads? to|results? in|causes?|therefore|as a result|this (shows|suggests|supports|means))\b/;
  // A cited source: "(Source 1)", "Source 2 found", "according to Source 3".
  var CITE = /\bsource\s*[1-3]\b/i;
  function has(t, w){ return t.indexOf(' ' + String(w).toLowerCase()) > -1; }
  function flags(S, text){
    var W = (S && S.write) || {}, t = ' ' + String(text || '').toLowerCase().replace(/[\s\n]+/g, ' ').replace(/[.,;:!()]/g, ' ') + ' ', out = [];
    if(W.directional){
      var dir = DIRECTIONAL.test(t);
      out.push({ rule: 'directional', ok: dir, hint: dir ? '' : 'Say which way: "will increase" or "will decrease", not "will affect" or "will change".' });
      if(!dir && VAGUE.test(t)) out.push({ rule: 'vague', ok: false, hint: '"Affects", "changes" and "impacts" do not say a direction. Name it.' });
    }
    if(W.noQuestion) out.push({ rule: 'noQuestion', ok: String(text || '').indexOf('?') < 0, hint: 'A hypothesis is a statement you can test, not a question.' });
    if(W.variable && W.variable.length) out.push({ rule: 'variable', ok: W.variable.some(function(w){ return has(t, w); }), hint: 'Name the variable the scenario measures (' + W.variable[0] + ').' });
    if(W.otherThan && W.otherThan.length){
      var used = W.otherThan.filter(function(w){ return has(t, w); });
      out.push({ rule: 'otherThan', ok: !used.length, hint: 'The question says "other than" ' + W.otherThan[0] + ': give a different answer.' });
    }
    if(W.mechanism) out.push({ rule: 'mechanism', ok: MECHANISM.test(t), hint: 'Link it: "because ...", "this shows ...", "which suggests ...".' });
    if(W.cite) out.push({ rule: 'cite', ok: CITE.test(t), hint: 'Cite the source you use by its number: "(Source 1)" or "According to Source 3".' });
    if(W.concept && W.concept.length) out.push({ rule: 'concept', ok: W.concept.some(function(w){ return has(t, w); }), hint: 'Name a macroeconomics concept and apply it to the evidence (' + W.concept[0] + ', for example).' });
    if(W.restricted && W.restricted.length){
      var only = W.restricted.filter(function(w){ return has(t, w); });
      if(only.length && !(W.concept || []).some(function(w){ return has(t, w); })) out.push({ rule: 'restricted', ok: false, hint: '"' + only[0] + '" does not count here: name the macroeconomics concept itself.' });
    }
    if(W.context && W.context.length) out.push({ rule: 'context', ok: W.context.some(function(w){ return has(t, w); }), hint: "Tie it to the scenario, in the question's own words." });
    (W.forbid || []).forEach(function(f){ if(has(t, f)) out.push({ rule: 'forbid', ok: false, hint: 'Avoid "' + f + '" here.' }); });
    return out;
  }

  /* ------------------------------------------------------------ graphs */
  /* ApMacroGrade.graph(spec, response) -> { valid, correct, score, points:
     [{ id, ok, note }], notes, slip }. spec is a graph item's `graph`
     (mac-graph.js, docs/apmacro-architecture.md "graph"), response what
     ApMacroGraph.mount().get() returns. One rubric point per task, scored
     apart as readers do (framework.md section 5, "FRQ scoring rules"):
       labels       every axis and curve label right
       shift        the key's curves moved, each the key's way, nothing else
       equilibrium  E2 where the curves as drawn cross (consistent with the
                    student's own shift, as readers score it)
       outcome      E2 against E1 the key's way (price up, output down ...);
                    needs the right shift
       point        the placed point in the key's region, on the key's curve,
                    or up/down from the equilibrium
     The first wrong point's note is `slip`, the line the feedback leads with:
     "You shifted demand; a rise in input costs shifts supply." */
  // E2 snaps to quarter steps and one shift moves the crossing by half a step, so a
  // point within 0.3 is on the drawn crossing and a point on the old one is not.
  var EQ_TOL = 0.3;
  function GR(){ return root.ApMacroGraph; }
  function graph(spec, resp){
    var M = GR();
    if(!M) throw new Error('ApMacroGrade.graph needs ApMacroGraph (mac-graph.js)');
    var k = M.KINDS[spec.kind], does = spec.do || [], key = spec.key || {}, r = resp || {}, sh = r.shifts || {}, pts = [];
    var cap = function(s){ return s.charAt(0).toUpperCase() + s.slice(1); };
    var moved = Object.keys(sh).filter(function(c){ return sh[c]; });
    var valid = moved.length > 0 || !!r.point || Object.keys(r.labels || {}).length > 0 || does.indexOf('shift') < 0;
    if(does.indexOf('label') > -1){
      var wrong = M.labelSlots(spec).filter(function(s){ return (r.labels || {})[s] !== (s === 'x' || s === 'y' ? k[s] : s); });
      var first = wrong[0], note = '';
      if(first === 'x' || first === 'y'){
        var got = (r.labels || {})[first];
        note = !got ? 'Label the ' + (first === 'x' ? 'horizontal' : 'vertical') + ' axis.' :
          got === 'fxPriceFlipped' ? 'The price of a currency is in units of the other currency per unit of this one: ' + M.labelText('fxPrice', spec.names) + '.' :
          'The ' + (first === 'x' ? 'horizontal' : 'vertical') + ' axis of the ' + k.title.toLowerCase() + ' is ' + M.labelText(k[first], spec.names) + ', not ' + M.labelText(got, spec.names) + '.';
      } else if(first) note = (r.labels || {})[first] ? 'One curve has the wrong label: check which curve is ' + M.curveName(first) + '.' : 'Label every curve.';
      pts.push({ id: 'labels', ok: !wrong.length, note: note });
    }
    var want = M.keyOffsets(spec), shiftOk = false;
    if(does.indexOf('shift') > -1){
      var cs = M.curves(spec, {}), need = Object.keys(want), because = key.because ? ' ' + key.because : '';
      var missing = need.filter(function(c){ return !sh[c]; }), extra = moved.filter(function(c){ return !want[c]; });
      var backwards = need.filter(function(c){ return sh[c] && (sh[c] > 0) !== (want[c] > 0); });
      var n2 = '';
      if(!moved.length) n2 = 'Nothing moved yet: shift the curve the change affects.';
      else if(extra.length && missing.length){
        var e = extra[0], m = missing[0];
        n2 = (spec.slips && spec.slips[e]) || 'You shifted ' + M.curveName(e) + ';' + (because ? because + ' shifts ' : ' the change shifts ') + M.curveName(m) + '.';
      } else if(backwards.length){
        var b = backwards[0], c = M.find(cs, b);
        n2 = cap(M.curveName(b)) + ' is the right curve, but it shifts ' + M.dirWord(c.shape, want[b]) + ', not ' + M.dirWord(c.shape, sh[b]) + '.';
      } else if(missing.length) n2 = cap(M.curveName(missing[0])) + ' shifts too' + (key.because ? ' (' + key.because + ')' : '') + '.';
      else if(extra.length) n2 = (spec.slips && spec.slips[extra[0]]) || 'Only ' + need.map(M.curveName).join(' and ') + ' shift' + (need.length === 1 ? 's' : '') + ' here; ' + M.curveName(extra[0]) + ' stays put.';
      shiftOk = !n2;
      pts.push({ id: 'shift', ok: shiftOk, note: n2 });
    }
    if(does.indexOf('equilibrium') > -1){
      var at = M.eq(spec, sh), E = r.eq, near = at && E && Math.abs(E[0] - at[0]) <= EQ_TOL && Math.abs(E[1] - at[1]) <= EQ_TOL;
      pts.push({ id: 'equilibrium', ok: !!near, note: near ? '' : !at ? 'The curves you drew do not cross on the graph.' : 'Put E2 where the curves you drew cross now.' });
      if(key.outcome){
        var o = M.outcome(spec, sh) || {}, ws = Object.keys(key.outcome), off = ws.filter(function(w){ return o[w] !== key.outcome[w]; });
        var word = function(d){ return d === 'up' ? 'rises' : d === 'down' ? 'falls' : 'stays the same'; };
        pts.push({ id: 'outcome', ok: shiftOk && !!near && !off.length, note: !shiftOk ? 'The new equilibrium follows from the right shift.' : !near ? 'Mark the new equilibrium to show what happens.' :
          off.length ? 'At the new equilibrium the ' + off[0] + ' ' + word(key.outcome[off[0]]) + '.' : '' });
      }
    }
    if(does.indexOf('point') > -1){
      var P = key.point || {}, p = r.point, ok = !!p, n3 = p ? '' : 'Place the point.';
      if(p && P.region){ var rg = M.region(spec, {}, p); if(rg !== P.region){ ok = false; n3 = P.region === 'inside' ? 'Unemployed or wasted resources put the economy inside the curve.' : P.region === 'outside' ? 'A point the economy cannot reach now lies outside the curve.' : 'Full, efficient use of resources is a point on the curve.'; } }
      if(p && ok && P.on){ var c3 = M.find(M.curves(spec, {}), P.on); if(M.distTo(c3, p) > EQ_TOL){ ok = false; n3 = 'The point belongs on ' + M.curveName(P.on) + '.'; } }
      if(p && ok && (P.x || P.y)){
        var e0 = M.eq(spec, {}), dx = p[0] - e0[0], dy = p[1] - e0[1], fx = P.x && (P.x === 'up' ? dx <= 0.2 : dx >= -0.2), fy = P.y && (P.y === 'up' ? dy <= 0.2 : dy >= -0.2);
        if(fx || fy){ ok = false; n3 = 'Compared with the starting equilibrium, the point should be ' + [P.x ? (P.x === 'up' ? 'to the right' : 'to the left') : '', P.y ? (P.y === 'up' ? 'higher' : 'lower') : ''].filter(Boolean).join(' and ') + '.'; }
      }
      pts.push({ id: 'point', ok: ok, note: n3 });
    }
    var right = pts.filter(function(x){ return x.ok; }).length, bad = pts.filter(function(x){ return !x.ok; });
    return { valid: valid, correct: pts.length > 0 && !bad.length, score: pts.length ? right / pts.length : 0, points: pts, right: right, total: pts.length,
      notes: bad.map(function(x){ return x.note; }).filter(Boolean), slip: bad.length ? bad[0].note : '' };
  }

  root.ApMacroGrade = { readNumber: readNumber, normUnit: normUnit, unitIs: unitIs, prefixFactor: prefixFactor, tolerance: tolerance,
    numeric: numeric, formatKey: formatKey, specific: specific, flags: flags, graph: graph, SCALE: SCALE };
})(typeof window !== 'undefined' ? window : globalThis);
