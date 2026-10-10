/* Reference cards: an age slider over the pediatric vitals table, and a box
   that says whether a number is inside that row's range.

   ONE JOB: find the right row fast and know at once whether a vital is in it.

   Every range comes from the table on the page (read from the DOM), and the
   only other rule used is the card's own note: for ages 1 to 10, the lowest
   acceptable systolic is about 70 + 2 x age in years. Nothing else. */
(function(){
  'use strict';
  var table = document.querySelector('#pedsVitals table');
  var mount = document.getElementById('vitalsCheck');
  if(!table || !mount) return;

  function txt(el){ return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function nums(s){ return (s.match(/\d+/g) || []).map(Number); }

  /* Age bands in months from the row label: "(0–1 mo)", "(1–3 y)", Adult. */
  var rows = Array.prototype.map.call(table.querySelectorAll('tbody tr'), function(tr){
    var td = tr.querySelectorAll('td'), label = txt(td[0]);
    var m = label.match(/\((\d+)\D+(\d+)\s*(mo|y)\)/), from, to;
    if(m){ var k = m[3] === 'y' ? 12 : 1; from = +m[1] * k; to = +m[2] * k; }
    else { from = 216; to = 1200; }
    return { tr: tr, label: label.replace(/\s*\(.*\)/, ''), range: m ? m[0].slice(1, -1) : '18 y and over',
             from: from, to: to, hr: nums(txt(td[1])), rr: nums(txt(td[2])), sbp: nums(txt(td[3])), sbpText: txt(td[3]) };
  });
  // The card's slider stops: months for the first year, then years.
  var STOPS = [0, 1, 3, 6, 9];
  for(var y = 1; y <= 18; y++) STOPS.push(y * 12);
  STOPS.push(20 * 12);

  function rowFor(mo){
    for(var i = 0; i < rows.length; i++) if(mo >= rows[i].from && mo < rows[i].to) return rows[i];
    return rows[rows.length - 1];
  }
  function ageText(mo){
    if(mo === 0) return 'Newborn';
    if(mo < 12) return mo + ' month' + (mo === 1 ? '' : 's');
    if(mo >= 240) return 'Adult';
    return (mo / 12) + ' year' + (mo === 12 ? '' : 's');
  }
  function sbpLow(mo, r){
    if(mo >= 12 && mo <= 120) return { v: 70 + 2 * Math.floor(mo / 12), how: '70 + 2 × ' + Math.floor(mo / 12) + ' years' };
    /* Over 10 the formula has already reached 90, the figure PALS uses from
       then on; a row that gives a range (school age, 82–90) means its top
       figure at that end, not its bottom one. */
    if(mo > 120 && r.sbp.length > 1 && r.from < 216) return { v: r.sbp[r.sbp.length - 1], how: 'over 10 years, the top of the table’s ' + r.sbpText };
    return { v: r.sbp[0], how: 'the table, ' + r.sbpText };
  }

  /* Age pictograms (visual polish 2026-10), one per stage of the table, drawn
     as single-path figures on a 24 x 40 grid; head size against height shrinks
     with age, as it does in life. */
  var FIGS = [
    { at: 0, name: 'newborn', d: 'M12 13a5.2 5.2 0 1 0 0-.01zM7 20c0-1.6 2.2-2.6 5-2.6s5 1 5 2.6v9c0 2.3-2.2 4-5 4s-5-1.7-5-4z' },
    { at: 12, name: 'toddler', d: 'M12 10.2a4 4 0 1 0 0-.01zM8.2 16c.7-.9 2.2-1.4 3.8-1.4s3.1.5 3.8 1.4l2.2 6.4-1.8.7-2-4.3v6.2l1.1 9.3h-2.2L12 27.6l-1.1 6.7H8.7l1.1-9.3v-6.2l-2 4.3-1.8-.7z' },
    { at: 36, name: 'child', d: 'M12 7.6a3.3 3.3 0 1 0 0-.01zM8.6 12.6c.7-.7 2-1.1 3.4-1.1s2.7.4 3.4 1.1l2.3 7.6-1.7.6-2.2-5.4v8.2l1.1 13.1h-2L12 26.4l-.9 10.1h-2l1.1-13.1v-8.2l-2.2 5.4-1.7-.6z' },
    { at: 144, name: 'adolescent', d: 'M12 5.6a2.9 2.9 0 1 0 0-.01zM8.4 10c.8-.6 2.1-.9 3.6-.9s2.8.3 3.6.9l2.4 9-1.6.5-2.4-6.4v9.4l1.1 15.8h-1.9L12 23.7l-.8 14.6H9.3l1.1-15.8v-9.4L8 19.5l-1.6-.5z' },
    { at: 216, name: 'adult', d: 'M12 5a2.8 2.8 0 1 0 0-.01zM8 9.3c.9-.6 2.3-.9 4-.9s3.1.3 4 .9l2.6 9.4-1.6.5-2.6-6.6v9.7l1.2 16.6h-2L12 23.1l-.8 15.4h-2l1.2-16.6v-9.7L7.8 18.8l-1.6-.5z' }
  ];
  var BAND_T = ['nb', 'in', 'td', 'ps', 'sa', 'ad', 'au'];
  function trackGradient(){
    var n = STOPS.length - 1, parts = [];
    rows.forEach(function(r, i){
      var a = -1, b = -1;
      STOPS.forEach(function(m, k){ if(m >= r.from && m < r.to){ if(a < 0) a = k; b = k; } });
      if(a < 0) return;
      var x0 = Math.max(0, (a - 0.5) / n * 100), x1 = Math.min(100, (b + 0.5) / n * 100);
      parts.push('var(--vc-b' + (i % 2) + ') ' + x0.toFixed(2) + '% ' + x1.toFixed(2) + '%');
    });
    return 'linear-gradient(90deg,' + parts.join(',') + ')';
  }

  mount.innerHTML =
    '<div class="vc">' +
      '<label class="vc-age" for="vcAge"><span>Age</span><output id="vcAgeOut">Newborn</output></label>' +
      '<div class="vc-figs" aria-hidden="true">' + FIGS.map(function(f){
        var at = 0; for(var k = 0; k < STOPS.length; k++) if(STOPS[k] <= (f.pos || f.at)) at = k;
        return '<svg class="vc-fig" data-at="' + f.at + '" viewBox="0 0 24 40" style="left:' + (at / (STOPS.length - 1) * 100).toFixed(1) + '%"><path d="' + f.d + '"/></svg>'; }).join('') + '</div>' +
      '<input type="range" id="vcAge" min="0" max="' + (STOPS.length - 1) + '" step="1" value="' + STOPS.indexOf(48) + '" aria-describedby="vcRowName">' +
      '<div class="vc-ticks" aria-hidden="true">' + [[0, 'birth'], [12, '1 y'], [72, '6 y'], [144, '12 y'], [216, '18 y']].map(function(t){
        return '<span style="left:' + (STOPS.indexOf(t[0]) / (STOPS.length - 1) * 100).toFixed(1) + '%">' + t[1] + '</span>'; }).join('') + '</div>' +
      '<div class="vc-row" id="vcRowName"></div>' +
      '<div class="vc-check">' +
        '<div class="vc-kind" role="group" aria-label="Which vital">' +
          '<button type="button" data-k="hr" aria-pressed="true" class="on">Heart rate</button>' +
          '<button type="button" data-k="rr" aria-pressed="false">Resp. rate</button>' +
          '<button type="button" data-k="sbp" aria-pressed="false">Systolic BP</button>' +
        '</div>' +
        '<label class="vc-in"><span class="sr-only">Value</span><input id="vcVal" type="number" inputmode="numeric" min="0" max="300" placeholder="Type a number"><span id="vcUnit">/min</span></label>' +
        '<div class="vc-gauge" id="vcGauge" aria-hidden="true"></div>' +
        '<p class="vc-out" id="vcOut" role="status" aria-live="polite"></p>' +
      '</div>' +
    '</div>';

  var age = document.getElementById('vcAge'), val = document.getElementById('vcVal'), kind = 'hr';
  age.style.setProperty('--vc-track', trackGradient());

  function band(r, mo){
    if(kind === 'sbp'){ var lo = sbpLow(mo, r); return { lo: lo.v, hi: r.label === 'Adult, for comparison' || /Adult/.test(r.label) ? r.sbp[1] : null, how: lo.how }; }
    return { lo: r[kind][0], hi: r[kind][1] };
  }

  function update(){
    var mo = STOPS[+age.value], r = rowFor(mo);
    document.getElementById('vcAgeOut').textContent = ageText(mo);
    age.setAttribute('aria-valuetext', ageText(mo) + ', ' + r.label + ' row');
    rows.forEach(function(x){ x.tr.classList.toggle('vc-on', x === r); });
    var near = null;
    mount.querySelectorAll('.vc-fig').forEach(function(f){ var a = +f.getAttribute('data-at'); if(a <= Math.max(mo, 0)) near = f; });
    mount.querySelectorAll('.vc-fig').forEach(function(f){ f.classList.toggle('on', f === near); });
    age.style.setProperty('--vc-pos', (+age.value / (STOPS.length - 1) * 100).toFixed(2) + '%');
    document.getElementById('vcRowName').innerHTML = '<b>' + esc(r.label) + '</b> row: HR ' + r.hr.join('–') + ' · RR ' + r.rr.join('–') + ' · SBP ' + esc(r.sbpText) +
      (kind === 'sbp' ? ' · lowest acceptable here: <b>' + sbpLow(mo, r).v + '</b> (' + esc(sbpLow(mo, r).how) + ')' : '');
    document.getElementById('vcUnit').textContent = kind === 'sbp' ? 'mmHg' : '/min';

    var b = band(r, mo), v = val.value === '' ? null : +val.value;
    var max = Math.max(kind === 'sbp' ? 160 : kind === 'rr' ? 70 : 200, (b.hi || b.lo) * 1.3, v || 0);
    var pct = function(x){ return (Math.max(0, Math.min(max, x)) / max * 100).toFixed(1) + '%'; };
    var g = document.getElementById('vcGauge');
    g.innerHTML = '<div class="vc-zone lo" style="left:0;width:' + pct(b.lo) + '"></div>' +
      (b.hi ? '<div class="vc-zone hi" style="left:' + pct(b.hi) + ';right:0"></div>' : '') +
      '<div class="vc-band" style="left:' + pct(b.lo) + ';right:' + (b.hi ? (100 - parseFloat(pct(b.hi))) + '%' : '0') + '"></div>' +
      '<span class="vc-lab" style="left:' + pct(b.lo) + '">' + b.lo + '</span>' +
      (b.hi ? '<span class="vc-lab" style="left:' + pct(b.hi) + '">' + b.hi + '</span>' : '') +
      (v != null && !isNaN(v) ? '<div class="vc-pin" style="left:' + pct(v) + '"><span class="vc-bub">' + v + '</span></div>' : '');
    var out = document.getElementById('vcOut');
    if(v == null || isNaN(v)){ out.className = 'vc-out'; out.textContent = 'Type a ' + (kind === 'hr' ? 'heart rate' : kind === 'rr' ? 'respiratory rate' : 'systolic pressure') + ' to check it against this row.'; g.classList.remove('low', 'high', 'ok'); return; }
    var verdict = v < b.lo ? 'low' : (b.hi && v > b.hi) ? 'high' : 'ok';
    g.className = 'vc-gauge ' + verdict;
    out.className = 'vc-out ' + verdict;
    var name = kind === 'hr' ? 'heart rate' : kind === 'rr' ? 'respiratory rate' : 'systolic pressure';
    var msg = verdict === 'ok' ? v + ' is inside the ' + r.label.toLowerCase() + ' range.'
      : verdict === 'low' ? v + ' is below the ' + r.label.toLowerCase() + ' ' + (kind === 'sbp' ? 'minimum' : 'range') + ' (' + b.lo + ').'
      : v + ' is above the ' + r.label.toLowerCase() + ' range (' + b.hi + ').';
    if(kind === 'sbp' && verdict === 'low' && mo < 216) msg += ' The card calls that hypotensive for this age.';
    if(kind === 'hr' && verdict === 'low' && mo < 216) msg += ' The card: bradycardia in a child is a pre-arrest sign, usually from hypoxia.';
    if(kind === 'sbp' && verdict === 'ok' && mo < 216) msg += ' A normal pressure in a sick child is not reassurance: it is the last thing to go.';
    out.textContent = msg.replace(/^(\d+)/, '$1 ' + (kind === 'sbp' ? 'mmHg' : '/min'));
    out.setAttribute('data-name', name);
  }

  age.addEventListener('input', update);
  val.addEventListener('input', update);
  mount.querySelectorAll('[data-k]').forEach(function(btn){
    btn.addEventListener('click', function(){
      kind = btn.getAttribute('data-k');
      mount.querySelectorAll('[data-k]').forEach(function(x){ var on = x === btn; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      update();
    });
  });
  // Tapping a table row moves the slider to that row.
  rows.forEach(function(r){
    r.tr.addEventListener('click', function(){
      var i = STOPS.findIndex(function(m){ return m >= r.from && m < r.to; });
      if(i >= 0){ age.value = i; update(); }
    });
  });
  update();
})();
