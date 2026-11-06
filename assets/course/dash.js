/* The course dashboard, every course (design F on the dashboard canvas, owner 2026-10-26; docs/dashboard.md).

   Five questions a student actually has, in the order they ask them, and nothing on the page that does not answer
   one of them:
     1 What should I do now?        the path's Up next when a path exists (round 4), else one action and why and two
                                    "then" steps; today, the streak and the reminder either way
     2 Am I getting better?         one chart: weekly accuracy, exams on the same line, the goal, exam day
     3 Will I be ready?             the course's readiness reading as a distance to a goal, and what closes it
     4 Where am I losing points?    areas ordered by what they cost, not by their percent
     5 What have I built?           level, memory, badges, the next thing to earn
   Every older panel is kept, folded under the question it answers ("details" drawers), so nothing was removed.

   Each course hands this module plain values (a model; see the adapters: nremt/dashboard.html, ochem/assets/
   dash-ochem.js, assets/course/dash-ap.js for the six AP® courses and A&P). Nothing here reads course storage
   except dailyWeeks(), which reads the shared daily accuracy log (hub_daily_v1, written by LevlPremium.noteAnswer in
   assets/premium.js).
   Styles: assets/course/dash.css, scoped to .d5, course colour from the page's data-cover (assets/course/r3.css). */
(function(){
  'use strict';
  var DAY = 86400000;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function shortDate(t){ try{ return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }catch(e){ return ''; } }
  function weekday(t){ try{ return new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }catch(e){ return ''; } }
  function startOfDay(t){ var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

  /* ---- icons: stroke drawings in currentColor, decorative (the text beside each says the same) ---- */
  var P = {
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
    check: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 12l2 2 4-4"/>',
    star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    stack: '<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4"/><path d="M4 17l8 4 8-4"/>',
    up: '<path d="M4 19l6-6 4 4 6-8"/><path d="M15 9h5v5"/>',
    medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>',
    snow: '<path d="M12 2v20M4 7l16 10M20 7L4 17"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/><path d="M5 12h3l2-3 2 5 2-2h5"/>',
    lungs: '<path d="M12 4v8"/><path d="M12 9c-2 0-3 1-4 3s-3 7-4 7-1-6 1-10 3-4 7-4z"/><path d="M12 9c2 0 3 1 4 3s3 7 4 7 1-6-1-10-3-4-7-4z"/>',
    bandage: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M10 10l4 4"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    person: '<circle cx="12" cy="7" r="3"/><path d="M7 21c0-5 2-9 5-9s5 4 5 9"/>',
    ambulance: '<path d="M3 16V8h11v8M14 11h4l3 3v2h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  function icon(name, size){
    var p = P[name]; if(!p) return '';
    return '<svg width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>';
  }

  /* ---- the daily accuracy log, by week ----
     hub_daily_v1: { v:1, days: { 'YYYY-MM-DD': { <course>: [right, total] } } } (assets/premium.js noteAnswer).
     Weeks start on Monday; a week counts once it holds 5 answers, so one question does not draw a point. */
  function dailyWeeks(course, maxWeeks){
    var log = null;
    try{ log = JSON.parse(localStorage.getItem('hub_daily_v1') || 'null'); }catch(e){}
    if(!log || !log.days) return [];
    var weeks = {};
    Object.keys(log.days).forEach(function(k){
      var v = log.days[k] && log.days[k][course];
      if(!v || !v[1]) return;
      var p = k.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
      var monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
      var w = weeks[monday.getTime()] || (weeks[monday.getTime()] = { t: monday.getTime(), right: 0, total: 0 });
      w.right += v[0]; w.total += v[1];
    });
    return Object.keys(weeks).map(function(k){ return weeks[k]; })
      .filter(function(w){ return w.total >= 5; })
      .sort(function(a, b){ return a.t - b.t; })
      .slice(-(maxWeeks || 10))
      .map(function(w){ return { t: w.t, pct: Math.round(w.right / w.total * 100), n: w.total }; });
  }

  /* The trend in plain words, and when the goal is reached at this pace (a straight line through the weekly
     points; only drawn when it is rising and there are three weeks to fit). */
  function trend(p){
    var w = p.weeks || [], ex = p.exams || [], out = {};
    if(w.length >= 2){
      var a = w[0].pct, b = w[w.length - 1].pct, span = Math.max(1, Math.round((w[w.length - 1].t - w[0].t) / (7 * DAY)));
      var weeksTxt = plural(span, 'week');
      if(b - a >= 3) out.head = 'Yes. ' + a + '% to ' + b + '% in ' + weeksTxt + '.';
      else if(a - b >= 3) out.head = 'Not this stretch. ' + a + '% to ' + b + '% over ' + weeksTxt + '.';
      else out.head = 'Holding steady around ' + b + '%.';
    } else if(ex.length >= 2){
      var e0 = ex[0].pct, e1 = ex[ex.length - 1].pct;
      out.head = e1 > e0 ? 'Yes. Your exams went from ' + e0 + '% to ' + e1 + '%.' : e1 < e0 ? 'Your last exam was lower: ' + e0 + '% then ' + e1 + '%.' : 'Your exams are level at ' + e1 + '%.';
    } else if(w.length === 1){
      out.head = 'This week so far: ' + w[0].pct + '% on ' + plural(w[0].n, 'answer') + '.';
    } else if(ex.length === 1){
      out.head = 'One exam so far: ' + ex[0].pct + '%.';
    }
    if(w.length >= 3 && p.goal){
      var pts = w.slice(-6), n = pts.length, mx = 0, my = 0;
      pts.forEach(function(q){ mx += q.t; my += q.pct; }); mx /= n; my /= n;
      var sxy = 0, sxx = 0;
      pts.forEach(function(q){ sxy += (q.t - mx) * (q.pct - my); sxx += (q.t - mx) * (q.t - mx); });
      var slope = sxx ? sxy / sxx : 0, last = pts[n - 1];
      // Only a line that is still being drawn: a last week older than two weeks, or a date already past, says
      // nothing about "this pace".
      if(slope > 0 && last.pct < p.goal.pct && Date.now() - last.t < 21 * DAY){
        var at = last.t + (p.goal.pct - last.pct) / slope;
        if(at > Date.now() && at - Date.now() < 200 * DAY) out.goalAt = { t: at, from: last };
      }
    }
    return out;
  }

  /* ---- the progress chart ----
     Two drawings of the same numbers, one shaped for a wide column and one for a phone, so the labels stay at
     reading size in both; CSS shows one. Colours are classes, so dark mode follows the theme. */
  function chart(p, tr, W, H, narrow){
    var weeks = p.weeks || [], exams = p.exams || [], now = Date.now();
    var times = weeks.map(function(w){ return w.t; }).concat(exams.map(function(e){ return e.t; }));
    if(!times.length) return '';
    var t0 = Math.min.apply(null, times), end = now + 7 * DAY, examT = p.examDate ? p.examDate.t : null;
    if(tr.goalAt) end = Math.max(end, tr.goalAt.t + 4 * DAY);
    var examIn = examT && examT > now && examT - now <= 75 * DAY;
    if(examIn) end = Math.max(end, examT);
    if(now - t0 < 21 * DAY) t0 = now - 21 * DAY;
    var L = narrow ? 34 : 44, R = W - (narrow ? 14 : 24), T = narrow ? 26 : 34, B = H - (narrow ? 34 : 40);
    var vals = weeks.map(function(w){ return w.pct; }).concat(exams.map(function(e){ return e.pct; }));
    if(p.goal) vals.push(p.goal.pct);
    var lo = Math.max(0, Math.floor((Math.min.apply(null, vals) - 12) / 10) * 10), hi = 100;
    function x(t){ return L + (t - t0) / Math.max(1, end - t0) * (R - L); }
    function y(v){ return B - (v - lo) / (hi - lo) * (B - T); }
    function f(n){ return Math.round(n * 10) / 10; }
    var s = '', hand = narrow ? 13 : 16, small = narrow ? 11 : 12;
    var desc = [];
    if(weeks.length) desc.push('Weekly accuracy, oldest to newest: ' + weeks.map(function(w){ return w.pct + '%'; }).join(', ') + '.');
    if(exams.length) desc.push((p.examWord || 'Exams') + ': ' + exams.map(function(e){ return e.pct + '%'; }).join(', ') + '.');
    if(p.goal) desc.push('Goal line at ' + p.goal.pct + '%.');
    if(tr.goalAt) desc.push('At this pace the goal is reached around ' + shortDate(tr.goalAt.t) + '.');
    if(examIn) desc.push('Exam day ' + shortDate(examT) + '.');
    s += '<svg class="d5-chart' + (narrow ? ' d5-chart-n' : ' d5-chart-w') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc.join(' ')) + '">';
    s += '<line class="d5-axis" x1="' + L + '" y1="' + B + '" x2="' + R + '" y2="' + B + '"/>';
    // the part of the chart that is still ahead
    var xn = x(now);
    var examLater = examT && examT > now && !examIn;
    if(end - now > 2 * DAY) s += '<rect class="d5-ahead" x="' + f(xn) + '" y="' + T + '" width="' + f(R - xn) + '" height="' + (B - T) + '"/>' + (narrow || examLater ? '' : '<text class="d5-ahead-t" x="' + f(xn + 8) + '" y="' + (T + 16) + '">ahead</text>');
    if(p.goal){
      var yg = y(p.goal.pct);
      s += '<line class="d5-goal" x1="' + L + '" y1="' + f(yg) + '" x2="' + R + '" y2="' + f(yg) + '"/>';
      s += '<text class="d5-goal-t" x="' + (L + 4) + '" y="' + f(yg - 7) + '" font-size="' + hand + '">' + esc(narrow ? p.goal.pct + '% goal' : p.goal.label) + '</text>';
    }
    // weekly accuracy
    var here = null, weekPts = [];
    if(weeks.length){
      var pts = weeks.map(function(w){ return [x(w.t + 3.5 * DAY > now ? Math.min(now, w.t + 3.5 * DAY) : w.t + 3.5 * DAY), y(w.pct), w.pct]; });
      var line = pts.map(function(q){ return f(q[0]) + ',' + f(q[1]); }).join(' ');
      if(pts.length > 1){
        s += '<polygon class="d5-area" points="' + f(pts[0][0]) + ',' + B + ' ' + line + ' ' + f(pts[pts.length - 1][0]) + ',' + B + '"/>';
        s += '<polyline class="d5-line" points="' + line + '"/>';
      }
      here = pts[pts.length - 1]; weekPts = pts;
      if(!narrow && pts.length > 1) s += '<text class="d5-small" x="' + f(pts[0][0]) + '" y="' + f(pts[0][1] + 20) + '" text-anchor="middle" font-size="' + small + '">' + pts[0][2] + '%</text>';
    }
    // projection to the goal
    if(tr.goalAt && here){
      var gx = x(tr.goalAt.t), gy = y(p.goal.pct);
      s += '<line class="d5-proj" x1="' + f(here[0]) + '" y1="' + f(here[1]) + '" x2="' + f(gx) + '" y2="' + f(gy) + '"/>';
      s += '<circle class="d5-proj-dot" cx="' + f(gx) + '" cy="' + f(gy) + '" r="' + (narrow ? 4.5 : 6) + '"/>';
      if(!narrow){
        // Above the goal line, so it never meets "you are here", which sits below the line.
        var ly = Math.max(T + 18, gy - 34), lx = Math.min(R - 70, Math.max(L + 80, gx + 40));
        s += '<text class="d5-note-mut" x="' + f(lx) + '" y="' + f(ly) + '" text-anchor="middle" font-size="' + hand + '">' + esc(p.goal.pct + '% by about ' + shortDate(tr.goalAt.t)) + '</text>';
        s += arrow(lx - 20, ly + 6, gx + 4, gy - 9, 'd5-arrow-mut');
      }
    }
    // exams on the same line
    exams.forEach(function(e, i){
      var ex = x(e.t), ey = y(e.pct), r = narrow ? 4.5 : 5.5;
      s += '<rect class="d5-exam" x="' + f(ex - r) + '" y="' + f(ey - r) + '" width="' + f(2 * r) + '" height="' + f(2 * r) + '" transform="rotate(45 ' + f(ex) + ' ' + f(ey) + ')"/>';
      if(i === exams.length - 1) s += '<text class="d5-strong" x="' + f(ex) + '" y="' + f(ey - 12) + '" text-anchor="middle" font-size="' + (small + 1) + '">' + e.pct + '%</text>';
    });
    if(!narrow && exams.length && (exams.length > 1 || weeks.length)){
      var e0 = exams[0], fx = x(e0.t), fy = y(e0.pct);
      // Put the note on the side of the diamond away from the weekly line, so the words never sit on it.
      var lineY = null;
      if(weekPts.length > 1) for(var k = 1; k < weekPts.length; k++){
        if(weekPts[k - 1][0] <= fx && weekPts[k][0] >= fx){ var u = (fx - weekPts[k - 1][0]) / Math.max(1, weekPts[k][0] - weekPts[k - 1][0]); lineY = weekPts[k - 1][1] + u * (weekPts[k][1] - weekPts[k - 1][1]); }
      }
      var above = lineY !== null ? lineY > fy : fy + 48 > B - 10;
      var tx = Math.max(L + 6, fx - 70), ty = above ? Math.max(T + 14, fy - 30) : Math.min(B - 10, fy + 48);
      s += '<text class="d5-note" x="' + f(tx) + '" y="' + f(ty) + '" font-size="' + hand + '">' + esc(p.firstExamWord || 'first exam') + '</text>';
      s += above ? arrow(tx + 50, ty + 5, fx - 3, fy - 9, 'd5-arrow') : arrow(tx + 50, ty - 15, fx - 2, fy + 9, 'd5-arrow');
    }
    // you are here
    if(!here && exams.length){ var le = exams[exams.length - 1]; here = [x(le.t), y(le.pct), le.pct]; }
    if(here){
      s += '<circle class="d5-here-ring" cx="' + f(here[0]) + '" cy="' + f(here[1]) + '" r="' + (narrow ? 10 : 13) + '"/>';
      s += '<circle class="d5-here" cx="' + f(here[0]) + '" cy="' + f(here[1]) + '" r="' + (narrow ? 5 : 7) + '"/>';
      var right = here[0] < (L + R) / 2, hx = right ? here[0] + 18 : here[0] - 18, hy = Math.min(B - 10, here[1] + (narrow ? 36 : 56));
      s += '<text class="d5-note-acc" x="' + f(hx) + '" y="' + f(hy) + '" text-anchor="' + (right ? 'start' : 'end') + '" font-size="' + (hand + 1) + '">' + esc('you are here, ' + here[2] + '%') + '</text>';
      if(!narrow) s += arrow(hx + (right ? 12 : -12), hy - 15, here[0] + (right ? 6 : -6), here[1] + 12, 'd5-arrow-acc');
    }
    // exam day
    if(examIn){
      var xe = x(examT);
      s += '<line class="d5-examday" x1="' + f(xe) + '" y1="' + T + '" x2="' + f(xe) + '" y2="' + B + '"/>';
      s += '<text class="d5-note-ink" x="' + f(xe - 8) + '" y="' + (T + (narrow ? 14 : 20)) + '" text-anchor="end" font-size="' + (hand + 1) + '">exam day</text>';
    } else if(examT && examT > now){
      s += '<text class="d5-small" x="' + R + '" y="' + (T + 14) + '" text-anchor="end" font-size="' + small + '">exam in ' + plural(Math.ceil((examT - now) / DAY), 'day') + ' →</text>';
    }
    // dates along the bottom
    var ticks = [[t0, shortDate(t0), false], [now, 'Today', true]];
    if(examIn) ticks.push([examT, shortDate(examT), false]);
    else if(tr.goalAt && !narrow) ticks.push([tr.goalAt.t, shortDate(tr.goalAt.t), false]);
    var lastX = -999;
    ticks.sort(function(a, b){ return a[0] - b[0]; }).forEach(function(tk){
      var tx2 = x(tk[0]); if(tx2 - lastX < (narrow ? 52 : 70)) return; lastX = tx2;
      s += '<text class="' + (tk[2] ? 'd5-strong' : 'd5-small') + '" x="' + f(Math.max(L + 18, Math.min(R - 18, tx2))) + '" y="' + (H - (narrow ? 10 : 14)) + '" text-anchor="middle" font-size="' + small + '">' + esc(tk[1]) + '</text>';
    });
    s += '<text class="d5-small" x="' + (L - 8) + '" y="' + f(y(hi) + 4) + '" text-anchor="end" font-size="' + (small - 1) + '">100%</text>';
    if(lo > 0 || !narrow) s += '<text class="d5-small" x="' + (L - 8) + '" y="' + f(y(lo) + 4) + '" text-anchor="end" font-size="' + (small - 1) + '">' + lo + '%</text>';
    return s + '</svg>';
  }
  // A hand-drawn arrow: a soft curve with an open head at the target.
  function arrow(x1, y1, x2, y2, cls){
    var mx = (x1 + x2) / 2 + (y2 - y1) * 0.25, my = (y1 + y2) / 2 - (x2 - x1) * 0.25;
    var a = Math.atan2(y2 - my, x2 - mx), h = 7;
    function f(n){ return Math.round(n * 10) / 10; }
    var h1 = [x2 - h * Math.cos(a - 0.5), y2 - h * Math.sin(a - 0.5)], h2 = [x2 - h * Math.cos(a + 0.5), y2 - h * Math.sin(a + 0.5)];
    return '<path class="' + cls + '" d="M' + f(x1) + ' ' + f(y1) + ' Q' + f(mx) + ' ' + f(my) + ' ' + f(x2) + ' ' + f(y2) + ' M' + f(h1[0]) + ' ' + f(h1[1]) + ' L' + f(x2) + ' ' + f(y2) + ' L' + f(h2[0]) + ' ' + f(h2[1]) + '"/>';
  }

  /* ---- pieces ---- */
  function section(n, kicker, titleHtml, body, id, cls){
    return '<section class="d5-sec' + (cls ? ' ' + cls : '') + '"' + (id ? ' id="' + id + '"' : '') + ' aria-labelledby="d5h' + n + '">' +
      '<div class="d5-q"><p class="d5-n">' + n + ' &middot; ' + esc(kicker) + '</p><h2 id="d5h' + n + '">' + titleHtml + '</h2></div>' + body + '</section>';
  }
  /* A folded drawer under a question: the detailed panel the old dashboard showed, kept whole. */
  function drawer(d){
    if(!d || (!d.html && !d.slot)) return '';
    return '<details class="d5-more"' + (d.open ? ' open' : '') + (d.id ? ' id="' + d.id + '"' : '') + '><summary>' + d.label + '</summary><div class="d5-more-body">' +
      (d.slot ? '<div id="' + d.slot + '"></div>' : '') + (d.html || '') + '</div></details>';
  }
  function drawers(list){ return (list || []).map(drawer).join(''); }

  function nowCard(m){
    var t = m.today || {}, html = '<div class="d5-now">';
    if(m.steps){
      html += '<p class="d5-now-t">' + m.title + '</p>' + (m.body ? '<p class="d5-now-b">' + m.body + '</p>' : '') +
        '<ol class="d5-steps">' + m.steps.map(function(s){ return '<li>' + s + '</li>'; }).join('') + '</ol>';
    } else {
      html += '<div class="d5-now-top"><div class="d5-now-txt">' + (m.kicker ? '<p class="d5-now-k">' + esc(m.kicker) + '</p>' : '') + '<p class="d5-now-t">' + m.title + '</p>' + (m.body ? '<p class="d5-now-b">' + m.body + '</p>' : '') + '</div>' +
        (m.href ? '<div class="d5-now-go"><p class="d5-starthere" aria-hidden="true">start here</p>' +
          '<svg class="d5-starthere-a" width="40" height="22" viewBox="0 0 40 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 2c8 2 20 4 26 14"/><path d="M26 15l6 2 1-7"/></svg>' +
          '<a class="d5-btn" href="' + esc(m.href) + '">' + esc(m.cta || 'Start') + ' &rarr;</a></div>' : '') + '</div>';
      if(m.then && m.then.length) html += '<div class="d5-then">' + m.then.map(function(x){
        return '<a class="d5-then-row" href="' + esc(x.href) + '"><span>' + x.text + '</span><b>' + esc(x.cta || 'Go') + ' &rarr;</b></a>';
      }).join('') + '</div>';
    }
    var bits = [];
    if(t.streak != null) bits.push('<span class="d5-streak">' + icon('flame', 16) + '<b>' + (t.streak ? plural(t.streak, 'day') + ' streak' : 'No streak yet') + '</b></span>');
    if(t.goal) bits.push('<span>' + (t.count >= t.goal ? 'Today&rsquo;s ' + t.goal + ' done' : t.count + ' of ' + t.goal + ' today' + (t.streak && t.count < t.goal ? ', ' + (t.goal - t.count) + ' more keeps it alive' : '')) + '</span>');
    if(t.freezes) bits.push('<span class="d5-freeze">' + icon('snow', 15) + plural(t.freezes, 'freeze') + ' saved</span>');
    if(t.reminder) bits.push('<span class="d5-spacer"></span><a class="d5-remind" href="' + esc(t.reminder.href) + '">' + icon('bell', 15) + esc(t.reminder.text) + '</a>');
    if(bits.length) html += '<div class="d5-today">' + bits.join('') + '</div>';
    return html + '</div>';
  }

  function progressCard(p){
    var tr = trend(p), html = '<div class="d5-card">';
    var has = (p.weeks && p.weeks.length) || (p.exams && p.exams.length);
    if(!has) return html + '<p class="d5-lead">' + (p.empty || 'Your line starts with your first answers.') + '</p><p class="d5-mut">Each week you answer at least 5 questions adds a point, and every exam lands on the same line.</p>' + drawers(p.more) + '</div>';
    html += '<p class="d5-lead">' + esc(tr.head || '') + '</p>';
    var sub = [];
    if(p.sub) sub.push(p.sub);
    if(tr.goalAt){
      var ex = p.examDate && p.examDate.t > Date.now() ? p.examDate.t : null;
      var lead = ex ? Math.round((ex - tr.goalAt.t) / (7 * DAY)) : null;
      sub.push('At this pace you reach ' + p.goal.pct + '% around ' + shortDate(tr.goalAt.t) + (lead && lead > 0 ? ', ' + plural(lead, 'week') + ' before your exam.' : lead !== null && lead <= 0 ? ', after your exam date, so there is ground to make up.' : '.'));
    }
    if(sub.length) html += '<p class="d5-mut">' + sub.join(' ') + '</p>';
    html += chart(p, tr, 760, 280, false) + chart(p, tr, 360, 230, true);
    var key = [];
    if(p.weeks && p.weeks.length) key.push('<span><i class="d5-k-line"></i>your accuracy each week</span>');
    if(p.exams && p.exams.length) key.push('<span><i class="d5-k-exam"></i>' + esc(p.examWord || 'exams') + '</span>');
    if(p.goal) key.push('<span><i class="d5-k-goal"></i>' + esc(p.goal.key || p.goal.label) + '</span>');
    if(key.length || p.allHref) html += '<div class="d5-key">' + key.join('') + (p.allHref ? '<span class="d5-spacer"></span><a href="' + esc(p.allHref) + '">' + esc(p.allText || 'All exams') + '</a>' : '') + '</div>';
    return html + drawers(p.more) + '</div>';
  }

  function readyCard(r){
    var html = '<div class="d5-card">';
    if(r.locked) return html + r.locked + drawers(r.more) + '</div>';
    html += '<div class="d5-ready-top"><div><p class="d5-big"><b>' + r.big + '</b>' + (r.bigSub ? '<span>' + r.bigSub + '</span>' : '') + (r.badge || '') + '</p>' +
      (r.note ? '<p class="d5-hand">' + esc(r.note) + '</p>' : '') + '</div>' + (r.side ? '<p class="d5-ready-side">' + r.side + '</p>' : '') + '</div>';
    if(r.scale){
      var v = Math.max(0, Math.min(100, r.scale.value)), g = r.scale.goal;
      html += '<div class="d5-scale" role="img" aria-label="' + esc(r.scale.aria || (v + ' of 100' + (g != null ? ', goal ' + g : ''))) + '"><i style="width:' + v + '%"></i>' + (g != null ? '<b style="left:' + g + '%"></b>' : '') + '</div>' +
        '<div class="d5-scale-k" aria-hidden="true"><span>' + (r.scale.lo || '0') + '</span>' + (g != null ? '<span class="d5-scale-g" style="left:' + g + '%">' + (r.scale.goalText || g) + '</span>' : '') + '<span>' + (r.scale.hi || '100') + '</span></div>';
    }
    if(r.gap && r.gap.length){
      html += '<p class="d5-gap-h">' + esc(r.gapTitle || 'How to close the gap') + '</p><div class="d5-gap">' + r.gap.map(function(x){
        var val = x.value == null ? '' : '<b class="d5-gap-v' + (x.kind === 'ok' ? ' ok' : x.kind === 'mut' ? ' mut' : '') + '">' + esc(x.value) + '</b>';
        return x.href ? '<a class="d5-gap-row" href="' + esc(x.href) + '"><span>' + x.text + '</span>' + val + '</a>' : '<div class="d5-gap-row"><span>' + x.text + '</span>' + val + '</div>';
      }).join('') + '</div>';
    }
    if(r.extra) html += '<div class="d5-extra">' + r.extra + '</div>';
    if(r.foot) html += '<p class="d5-foot">' + r.foot + '</p>';
    return html + drawers(r.more) + '</div>';
  }

  var focusSeq = 0;
  function focusCard(f){
    var id = 'd5f' + (++focusSeq), views = (f.views || []).filter(Boolean), html = '<div class="d5-card">';
    html += '<div class="d5-focus-top"><p class="d5-mut">' + (f.intro || '') + '</p>';
    if(views.length > 1) html += '<div class="d5-seg" role="group" aria-label="Group by">' + views.map(function(v, i){
      return '<button type="button" data-d5view="' + id + '-' + i + '" aria-pressed="' + (i === 0) + '">' + esc(v.label) + (v.badge || '') + '</button>';
    }).join('') + '</div>';
    html += '</div>';
    views.forEach(function(v, i){
      html += '<div class="d5-view" id="' + id + '-' + i + '"' + (i ? ' hidden' : '') + '>' + (v.intro ? '<p class="d5-mut d5-view-i">' + v.intro + '</p>' : '');
      if(v.locked) html += v.locked;
      else if(!v.rows || !v.rows.length) html += '<p class="d5-empty">' + (v.empty || 'Answer a few questions and this fills in.') + '</p>';
      else html += v.rows.map(function(r){
        return '<a class="d5-row" href="' + esc(r.href) + '"><span class="d5-ic' + (r.warm ? ' warm' : '') + '">' + (r.icon ? (P[r.icon] ? icon(r.icon) : '<b>' + esc(r.icon) + '</b>') : '') + '</span>' +
          '<span class="d5-row-n"><b>' + esc(r.name) + '</b><small>' + (r.sub || '') + '</small></span>' +
          '<span class="d5-row-b"><span class="d5-bar"><i style="width:' + Math.round(Math.max(0, Math.min(1, r.bar || 0)) * 100) + '%"></i></span><small>' + (r.cost || '') + '</small></span>' +
          '<span class="d5-go">' + esc(r.cta || 'Drill') + ' &rarr;</span></a>';
      }).join('');
      if(v.foot) html += '<p class="d5-mut d5-view-f">' + v.foot + '</p>';
      html += '</div>';
    });
    return html + drawers(f.more) + '</div>';
  }

  function recordCard(r){
    var html = '<div class="d5-card"><div class="d5-rec-top">';
    (r.stats || []).forEach(function(s){
      html += '<div class="d5-rec-s"><p class="d5-k">' + esc(s.label) + '</p><p><b>' + s.big + '</b>' + (s.sub ? ' <span class="d5-mut">' + s.sub + '</span>' : '') + '</p>' +
        (s.bar != null ? '<span class="d5-bar d5-bar-acc"><i style="width:' + Math.round(Math.max(0, Math.min(1, s.bar)) * 100) + '%"></i></span>' : '') + (s.html || '') + '</div>';
    });
    html += '</div>';
    if(r.badges && r.badges.length) html += '<ul class="d5-badges">' + r.badges.map(function(b){
      return '<li class="' + (b.earned ? 'on' : 'off') + '"><span class="d5-med" aria-hidden="true">' + (P[b.icon] ? icon(b.icon, 26) : '<b>' + esc(b.icon || '') + '</b>') + '</span><b>' + esc(b.label) + '</b><small>' + esc(b.sub || (b.earned ? 'Earned' : '')) + '</small>' +
        '<span class="d5-sr">' + (b.earned ? 'earned' : 'not yet') + '</span></li>';
    }).join('') + '</ul>';
    if(r.next) html += '<div class="d5-next">' + icon('medal', 26) + '<span><b>' + r.next.text + '</b>' + (r.next.sub ? ' <span class="d5-mut">' + r.next.sub + '</span>' : '') + '</span>' +
      (r.next.href ? '<a href="' + esc(r.next.href) + '">' + esc(r.next.cta || 'See milestones') + '</a>' : '') + '</div>';
    return html + drawers(r.more) + '</div>';
  }

  function footLine(o){
    o = o || {};
    return '<div class="d5-house"><span>Kept in this browser.</span><a href="' + esc(o.account || '/account.html') + '">Sign in to sync it</a>' +
      '<a href="' + esc(o.backup || '/privacy.html#backup') + '">Download a backup</a><span class="d5-spacer"></span><a href="' + esc(o.premium || '/premium.html') + '">What Premium adds</a></div>';
  }

  /* ---- the path's Up next (round 4, docs/course-redesign-r4.md decision 7: Home owns "what next") ----
     Question 1 points to the stop the course home shows as Up next. This reads the path the way
     assets/course/path.js does, without writing anything: assets/path/<course>.json, the student's own
     <course>_path_v1 and the course's progress. With no path made yet, question 1 stays as it was. */
  var PATH = { key: null, d: null, loading: false };
  function pparse(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function pathKey(){ var m = document.querySelector('main[data-cover]'); return m ? m.getAttribute('data-cover') : null; }
  function pathState(key){ var s = pparse(key + '_path_v1'); if(!s || s.v !== 1 || !s.mode) return null; if(s.mode === 'class') s.mode = 'self'; s.done = s.done || {}; s.covered = s.covered || {}; s.cram = s.cram || { kind: 'test', topics: [] }; return s; }
  function loadPath(){
    var key = pathKey();
    if(!key || PATH.d || PATH.loading || !pathState(key) || !window.fetch) return;
    PATH.key = key; PATH.loading = true;
    fetch('/assets/path/' + key + '.json', { credentials: 'same-origin' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      PATH.loading = false;
      if(d && d.v === 1){ d.topics.forEach(function(t, i){ t.i = i; }); PATH.d = d; rerender(); }
    }).catch(function(){ PATH.loading = false; });
  }
  // The same stops, in the same order, as path.js stops(); only what picks the current one and names it.
  function pathNext(){
    var key = pathKey(), S = key && pathState(key), D = PATH.d;
    if(!S || !D || PATH.key !== key) return null;
    var U = D.units, T = D.topics, BY = {}, ACC = null, P;
    T.forEach(function(t){ BY[t.id] = t; });
    if(S.anchor && !BY[S.anchor]) S.anchor = null;
    if(D.kind === 'ap' || D.kind === 'anp'){ var pr = pparse(D.progress) || {}; P = { lessons: pr.lessons || {}, q: pr.q || {} }; }
    else if(D.kind === 'ochem') P = { op: pparse('ochem_progress') || {}, read: pparse('ochem_textbook_read') || {} };
    else P = { nl: pparse('nremt_lessons_v1') || {} };
    function courseDone(id){
      if(D.kind === 'ap' || D.kind === 'anp') return !!P.lessons[id];
      if(D.kind === 'ochem') return !!((P.op[id] && P.op[id].completed) || P.read[id]);
      var t = BY[id]; return !!(t && (t.lessons || []).some(function(l){ return P.nl[l]; }));
    }
    function isF(id){ return !!(S.done[id] || S.covered[id] || courseDone(id)); }
    function acc(id){
      if(D.kind !== 'ap' && D.kind !== 'anp') return null;
      if(!ACC){ ACC = {}; for(var k in P.q){ var r = P.q[k]; if(!r || !r.t) continue; var a = ACC[r.t] || (ACC[r.t] = [0, 0]); a[0] += +r.right || 0; a[1] += +r.seen || 0; } }
      var x = ACC[id]; return x && x[1] >= 3 ? Math.round(100 * x[0] / x[1]) : null;
    }
    function base(){ return '/' + D.dir + '/'; }
    function abs(rel){ if(!rel) return ''; try{ return new URL(rel, location.origin + base()).pathname; }catch(e){ return rel; } }
    function hasPass(){ try{ return !!(window.LevlPremium && window.LevlPremium.has(key)); }catch(e){ return false; } }
    function readMode(){ var m = pparse('levl_book_mode_' + D.dir); return !!(m && m.mode === 'read'); }
    function practiceUrl(t){ return D.practice ? abs(D.practice) + (D.kind === 'nremt' ? '' : '?topic=' + encodeURIComponent(t.id)) : ''; }
    function bookUrl(t){ return D.kind === 'nremt' ? abs('study-notes.html') + '#chapter-' + t.n : abs('learn.html') + '#' + encodeURIComponent(t.id); }
    function startUrl(t){ if(readMode() && (t.o || t.l)) return bookUrl(t); if(t.l && (t.f || hasPass())) return abs(t.l); return abs(t.o) || abs(t.l) || practiceUrl(t); }
    function tName(t){ return (t.n ? t.n + ' ' : '') + t.t; }
    function courseUnits(){
      var cus = [];
      U.forEach(function(u, ui){ if(u.label === 'Skills') return; var ts = T.filter(function(t){ return t.u === ui; }); if(ts.length) cus.push({ u: ui, a: ts[0].i, b: ts[ts.length - 1].i }); });
      cus.sort(function(x, y){ return x.a - y.a; });
      cus.forEach(function(c, k){ c.from = k ? cus[k - 1].b + 1 : 0; c.to = k < cus.length - 1 ? c.b : T.length - 1; });
      return cus;
    }
    function topicStop(t, extra){ var o = { kind: 'topic', id: t.id, title: t.t, state: isF(t.id) ? 'done' : 'todo' }; for(var k in extra) o[k] = extra[k]; return o; }
    var st = [], cus = courseUnits();
    if(S.mode === 'self'){
      cus.forEach(function(c, k){
        var ts = T.filter(function(t){ return t.i >= c.from && t.i <= c.to; }), cnt = 0;
        ts.forEach(function(t, j){ st.push(topicStop(t, { cu: k })); cnt++; if(cnt % 4 === 0 && j < ts.length - 1) st.push({ kind: 'mix', id: 'x:p' + c.u + '-' + cnt, title: 'Practice set', state: 'todo', cu: k }); });
        if(D.review) st.push({ kind: 'review', id: 'x:r' + c.u, title: 'Review your misses', state: 'todo', cu: k });
        var test = D.tests[U[c.u].id];
        if(test) st.push({ kind: 'test', id: 'x:t' + c.u, title: U[c.u].label + ' test', state: 'todo', url: abs(test), cu: k });
      });
      if(D.exams) st.push({ kind: 'exam', id: 'x:exam', title: 'Full practice exam', state: 'todo', cu: cus.length - 1 });
      var lastT = -1; st.forEach(function(x, i){ if(x.kind === 'topic' && x.state === 'done') lastT = i; });
      st.forEach(function(x, i){ if(x.kind !== 'topic' && (S.done[x.id] || i < lastT)) x.state = 'done'; });
    } else if(S.mode === 'cram'){
      var byAcc = function(x, y){ var ax = acc(x.id), ay = acc(y.id); return (ax == null ? 101 : ax) - (ay == null ? 101 : ay) || x.i - y.i; };
      var list = S.cram.kind === 'exam' ? T.filter(function(t){ return !isF(t.id); }).sort(byAcc).slice(0, 6)
        : (S.cram.topics || []).filter(function(id){ return BY[id]; }).map(function(id){ return BY[id]; }).sort(byAcc);
      var n = 0;
      list.forEach(function(t){ st.push(topicStop(t)); n++; if(n % 3 === 0 && n < list.length) st.push({ kind: 'mix', title: 'Mixed set', state: 'todo' }); });
      st.push({ kind: 'mix', title: 'Timed practice', state: 'todo', timed: 1 });
      st.push({ kind: 'day', title: S.cram.kind === 'exam' ? 'The ' + D.exam.label : 'Test day', state: 'todo' });
    } else return null;
    var now = -1;
    if(S.mode === 'self') st.forEach(function(x, i){ if(now < 0 && x.state === 'todo') now = i; });
    st.forEach(function(x, i){ if(now < 0 && x.state === 'todo' && x.kind === 'topic') now = i; });
    if(now < 0) st.forEach(function(x, i){ if(now < 0 && x.state === 'todo') now = i; });
    if(now < 0) now = st.length - 1;   // everything done: the home shows the last stop, so this does too
    var s = st[now]; if(!s) return null;
    var url = s.kind === 'topic' ? startUrl(BY[s.id]) : s.kind === 'review' ? abs(D.review) : s.kind === 'test' ? s.url
      : s.kind === 'mix' ? (s.timed ? (abs(D.exams) || abs(D.practice)) : abs(D.practice)) : s.kind === 'exam' ? (abs(D.exams) || abs(D.review)) : '';
    var u = S.mode !== 'cram' && s.cu != null && cus[s.cu] ? U[cus[s.cu].u] : null;
    var where = u ? u.label + (u.title ? ' · ' + u.title : '') : S.mode === 'cram' ? (S.cram.kind === 'exam' ? 'Exam review' : 'Cramming for a test') : 'Studying on my own';
    return { title: s.kind === 'topic' ? tName(BY[s.id]) : s.title, url: url, where: where, home: base() };
  }
  // Question 1 with a path: the path's Up next leads; what the course's own reading suggested is kept, folded
  // under it ("Also from your answers"), so nothing the card offered before is gone.
  function withPath(n, pn){
    var o = n || {}, rows = '';
    if(o.steps) rows = '<ol class="d5-steps">' + o.steps.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ol>';
    else {
      var list = (o.href ? [{ text: o.title, href: o.href, cta: o.cta }] : []).concat(o.then || []);
      rows = (o.href && o.body ? '<p class="d5-mut">' + o.body + '</p>' : '') + '<div class="d5-then">' + list.map(function(x){
        return '<a class="d5-then-row" href="' + esc(x.href) + '"><span>' + x.text + '</span><b>' + esc(x.cta || 'Go') + ' &rarr;</b></a>';
      }).join('') + '</div>';
    }
    return { kicker: 'Your path · ' + pn.where, title: 'Up next on your path: <span>' + esc(pn.title) + '</span>',
      body: 'Your whole path is on the <a href="' + esc(pn.home) + '">course home</a>.', href: pn.url || pn.home, cta: pn.url ? 'Continue' : 'Open your path',
      today: o.today, more: [{ label: 'Also from your answers', html: rows, id: 'd5NowMore' }] };
  }

  var LAST = null;
  function rerender(){ if(LAST) render(LAST.root, LAST.m); }

  /* The whole page, for the courses whose dashboard is drawn by script. */
  function render(root, m){
    if(!root) return;
    LAST = { root: root, m: m };
    loadPath();
    var pn = pathNext(), now = pn ? withPath(m.now, pn) : m.now;
    // A redraw (a sync, another tab, a pass arriving) keeps the drawers the student had open.
    var open = Array.prototype.map.call(root.querySelectorAll('details.d5-more[open] > summary'), function(x){ return x.textContent; });
    root.innerHTML = '<div class="d5">' +
      section(1, 'right now', 'What should I <span>do now?</span>', nowCard(now) + drawers(now.more), null, 'd5-first lap') +
      section(2, 'progress', 'Am I getting <span>better?</span>', progressCard(m.progress)) +
      section(3, m.ready.kicker || 'exam day', m.ready.title, readyCard(m.ready)) +
      section(4, 'focus', 'Where am I <span>losing points?</span>', focusCard(m.focus)) +
      section(5, 'your record', 'What have I <span>built?</span>', recordCard(m.record)) +
      footLine(m.foot) + '</div>';
    if(open.length) Array.prototype.forEach.call(root.querySelectorAll('details.d5-more > summary'), function(x){ if(open.indexOf(x.textContent) > -1) x.parentNode.open = true; });
    band(m.band);
    wire(root);
  }

  /* The band at the top of the page: its handwritten line becomes the one-sentence status, and the level sits
     beside the band's button (the level led the page before, owner 2026-10-26; it stays the first thing seen). */
  function band(b){
    if(!b) return;
    var main = document.querySelector('.r3-dashboard') || document;
    // Round 4 band (scripts/lib/dashboard-page.mjs progressBand): the status is its one sub line and the level sits
    // under it (the band has no buttons now). Older bands: the hand line and the button row.
    var hand = main.querySelector('.band [data-d5-status]') || main.querySelector('.band .hand');
    // The status was written as a lowercase hand line; as the band's sub line it starts with a capital.
    if(hand && b.status) hand.textContent = hand.hasAttribute('data-d5-status') ? b.status.charAt(0).toUpperCase() + b.status.slice(1) : b.status;
    var ctas = main.querySelector('.band .hero-ctas') || main.querySelector('.band .d5-lvl-row');
    if(!ctas && b.level && hand){ ctas = document.createElement('p'); ctas.className = 'd5-lvl-row'; hand.parentNode.insertBefore(ctas, hand.nextSibling); }
    if(ctas && b.level){
      var chip = ctas.querySelector('.d5-lvl') || ctas.appendChild(document.createElement('span'));
      chip.className = 'd5-lvl';
      chip.innerHTML = '<b>Level ' + b.level.level + '</b> ' + esc(b.level.title || '') + (b.level.toNext != null ? '<small>' + Number(b.level.toNext).toLocaleString() + ' XP to ' + (b.level.level + 1) + '</small>' : '');
    }
  }

  // The topic / domain switches. One listener per root, so re-renders do not stack handlers.
  function wire(root){
    if(root.__d5wired) return;
    root.__d5wired = true;
    // The older panels drawn into the drawers carry their own h2; under a question (h2) they are h3. Drawn by
    // course scripts at any time, so this watches for them.
    function demote(){
      Array.prototype.forEach.call(root.querySelectorAll('.d5-more-body h2'), function(h){
        var n = document.createElement('h3');
        Array.prototype.forEach.call(h.attributes, function(a){ n.setAttribute(a.name, a.value); });
        while(h.firstChild) n.appendChild(h.firstChild);
        h.parentNode.replaceChild(n, h);
      });
    }
    demote();
    if(window.MutationObserver) new MutationObserver(function(){ if(root.querySelector('.d5-more-body h2')) demote(); }).observe(root, { childList: true, subtree: true });
    root.addEventListener('click', function(e){
      // A link to a drawer on this page ("Set one", "See milestones") opens it.
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if(a){ var t = document.getElementById(a.getAttribute('href').slice(1)); if(t && t.tagName === 'DETAILS') t.open = true; return; }
      var b = e.target.closest && e.target.closest('[data-d5view]');
      if(!b) return;
      var group = b.parentNode, target = b.getAttribute('data-d5view');
      Array.prototype.forEach.call(group.querySelectorAll('[data-d5view]'), function(x){
        var on = x === b; x.setAttribute('aria-pressed', String(on));
        var pane = document.getElementById(x.getAttribute('data-d5view')); if(pane) pane.hidden = !on;
      });
      var pane = document.getElementById(target); if(pane) pane.hidden = false;
    });
  }

  // A path made or changed in another tab moves question 1 with it.
  window.addEventListener('storage', function(e){ if(e.key && /_path_v1$/.test(e.key)) { if(!PATH.d) loadPath(); else rerender(); } });

  window.LevlDash = {
    render: render, band: band, wire: wire, section: section, now: nowCard, progress: progressCard, ready: readyCard,
    focus: focusCard, record: recordCard, foot: footLine, drawer: drawer, drawers: drawers, icon: icon,
    rerender: rerender, pathNext: pathNext, dailyWeeks: dailyWeeks, trend: trend, esc: esc, plural: plural, shortDate: shortDate, weekday: weekday, startOfDay: startOfDay
  };
})();
