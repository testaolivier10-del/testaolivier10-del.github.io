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
    return { v: r.sbp[0], how: 'the table, ' + r.sbpText };
  }

  mount.innerHTML =
    '<div class="vc">' +
      '<label class="vc-age" for="vcAge"><span>Age</span><output id="vcAgeOut">Newborn</output></label>' +
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

  function band(r, mo){
    if(kind === 'sbp'){ var lo = sbpLow(mo, r); return { lo: lo.v, hi: r.label === 'Adult, for comparison' || /Adult/.test(r.label) ? r.sbp[1] : null, how: lo.how }; }
    return { lo: r[kind][0], hi: r[kind][1] };
  }

  function update(){
    var mo = STOPS[+age.value], r = rowFor(mo);
    document.getElementById('vcAgeOut').textContent = ageText(mo);
    age.setAttribute('aria-valuetext', ageText(mo) + ', ' + r.label + ' row');
    rows.forEach(function(x){ x.tr.classList.toggle('vc-on', x === r); });
    document.getElementById('vcRowName').innerHTML = '<b>' + esc(r.label) + '</b> row: HR ' + r.hr.join('–') + ' · RR ' + r.rr.join('–') + ' · SBP ' + esc(r.sbpText) +
      (kind === 'sbp' ? ' · lowest acceptable here: <b>' + sbpLow(mo, r).v + '</b> (' + esc(sbpLow(mo, r).how) + ')' : '');
    document.getElementById('vcUnit').textContent = kind === 'sbp' ? 'mmHg' : '/min';

    var b = band(r, mo), v = val.value === '' ? null : +val.value;
    var max = Math.max(kind === 'sbp' ? 160 : kind === 'rr' ? 70 : 200, (b.hi || b.lo) * 1.3, v || 0);
    var pct = function(x){ return (Math.max(0, Math.min(max, x)) / max * 100).toFixed(1) + '%'; };
    var g = document.getElementById('vcGauge');
    g.innerHTML = '<div class="vc-band" style="left:' + pct(b.lo) + ';right:' + (b.hi ? (100 - parseFloat(pct(b.hi))) + '%' : '0') + '"></div>' +
      '<span class="vc-lab" style="left:' + pct(b.lo) + '">' + b.lo + '</span>' +
      (b.hi ? '<span class="vc-lab" style="left:' + pct(b.hi) + '">' + b.hi + '</span>' : '') +
      (v != null ? '<div class="vc-pin" style="left:' + pct(v) + '"></div>' : '');
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
