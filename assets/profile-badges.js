/* Profile badges (profile.html, assets/profile.js; owner 2026-11-23, docs/progress-profile.md "Profile v2").
   Every course has the same families of badges, each with its own drawn design:
     units      one per unit or chapter, and the course itself (LevlMilestones: these carry a certificate)
     questions  50, 250, 500, 1,000 answered in the course
     lessons    the first, 10, 25 finished
     exams      the first, 3 taken, one at 80% or higher
     days       7 and 30 days studied in the course
     writing    the first and 10 free responses (courses that have them)
   NREMT keeps the six it had (two streaks, first full exam, 90% exam, 500 questions, level 10) and its
   full exam at 80% certificate, inside the same families.
   About 20 a course: Duolingo and Khan Academy both build their sets from a few families with rising tiers, and
   Codecademy gives one per lesson (research 2026-11-23). Nothing is stored: every badge is worked out from the
   course's own records each time, like the milestones.
   window.LevlBadges; loadable in node for scripts/test/profile-badges.test.mjs. */
(function(root){
  'use strict';
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function fmt(n){ return Number(n || 0).toLocaleString('en-US'); }

  /* What a course's records add up to. part: LevlClassModel.raw(course, get); days: hub_activity days. */
  function stats(course, part, days){
    part = part || {};
    var q = part.q || {}, answers = 0, exams = (part.exams || []).filter(function(x){ return x && x.n > 0; }), best = 0, full = 0, studied = 0;
    Object.keys(q).forEach(function(id){ answers += (q[id] && q[id].n) | 0; });
    exams.forEach(function(x){
      if(x.partial) return;
      var p = Math.round(x.c / x.n * 100); if(p > best) best = p;
      if(x.kind === 'full') full++;
    });
    Object.keys(days || {}).forEach(function(k){ if(days[k] && days[k][course] > 0) studied++; });
    return { answers: answers, exams: exams.length, full: full, best: best, lessons: part.lessons | 0, frq: Object.keys(part.frq || {}).length, days: studied };
  }

  var HAS_FRQ = { nremt: false, ochem: false, anp: false };
  function tier(fam, shape, glyph, n, have, label, how, so){
    var e = have >= n;
    return { id: fam + '-' + n, fam: fam, shape: shape, glyph: glyph, label: label, earned: e, sub: e ? so : '', tip: how + (e || !have ? '' : ' ' + so + ' so far.') };
  }

  /* The badges of one course, in display order. s: stats(); ms: LevlMilestones.list(course) or [];
     x: { longest, level } (NREMT's two site-wide badges); unitWord: 'Unit' | 'Chapter'. */
  function forCourse(course, s, ms, x){
    x = x || {}; ms = ms || [];
    var out = [], ap = !(course in HAS_FRQ), word = ap ? 'Unit' : 'Chapter', n = 0;
    ms.forEach(function(m){
      if(m.kind === 'chapter'){
        // An AP unit's milestone is titled "Unit 3: Cellular Energetics"; a chapter outside the numbered units (a skills
        // chapter) keeps its own name and a check mark. A&P and ochem chapters are numbered in order.
        var um = /^Unit (\d+): (.*)$/.exec(m.title || ''), num = um ? um[1] : ap ? '' : String(++n), name = um ? um[2] : m.title;
        out.push({ id: 'ms-' + m.id, fam: 'unit', shape: 'hex', glyph: num ? ['num', word === 'Unit' ? 'UNIT' : 'CH', num] : ['check'], label: num ? word + ' ' + num + ' complete' : name + ' complete', sub: num ? name : '',
                   earned: !!m.earned, cert: m.earned ? m.id : null, tip: 'Finish every lesson in ' + (num ? word + ' ' + num + ', ' : '') + name + '.' + (m.done && !m.earned ? ' ' + m.done + ' of ' + m.total + ' done.' : '') });
      }
    });
    ms.forEach(function(m){
      if(m.kind === 'course') out.push({ id: 'ms-' + m.id, fam: 'course', shape: 'burst', glyph: ['cap'], gold: true, label: 'Course complete', sub: m.earned ? 'Every ' + word.toLowerCase() + ' finished' : '', earned: !!m.earned, cert: m.earned ? m.id : null,
                                         tip: 'Finish every ' + word.toLowerCase() + '.' + (m.done && !m.earned ? ' ' + m.done + ' of ' + m.total + ' done.' : '') });
      else if(m.kind !== 'chapter') out.push({ id: 'ms-' + m.id, fam: 'exam', shape: 'shield', glyph: ['num', 'EXAM', '80'], label: 'Full exam at 80%', sub: m.earned ? '100 questions, timed' : '', earned: !!m.earned, cert: m.earned ? m.id : null,
                                               tip: 'Score 80% or higher on a full timed exam of 100 questions.' });
    });
    [50, 250, 500, 1000].forEach(function(t){
      out.push(tier('q', 'circle', ['num', 'ANSWERS', t === 1000 ? '1K' : String(t)], t, s.answers, fmt(t) + ' questions', 'Answer ' + fmt(t) + ' questions in this course.', fmt(s.answers) + ' answered'));
    });
    [1, 10, 25].forEach(function(t){
      out.push(tier('lesson', 'tile', t === 1 ? ['book'] : ['num', 'LESSONS', String(t)], t, s.lessons, t === 1 ? 'First lesson' : t + ' lessons', t === 1 ? 'Finish your first lesson in this course.' : 'Finish ' + t + ' lessons in this course.', plural(s.lessons, 'lesson') + ' finished'));
    });
    if(course === 'nremt'){
      out.push(tier('exam', 'shield', ['watch'], 1, s.full, 'First full exam', 'Take one full exam.', '100 questions, timed'));
      out.push(tier('exam', 'shield', ['num', 'EXAMS', '3'], 3, s.exams, '3 exams', 'Take 3 practice exams.', plural(s.exams, 'exam') + ' taken'));
      out.push({ id: 'exam-90', fam: 'exam', shape: 'shield', glyph: ['target'], gold: true, label: '90%+ exam', earned: s.best >= 90, sub: s.best >= 90 ? 'best ' + s.best + '%' : '', tip: 'Score 90% on a full exam.' + (s.best && s.best < 90 ? ' Best so far ' + s.best + '%.' : '') });
      out.push(tier('streak', 'circle', ['flame'], 7, x.longest | 0, '7-day streak', 'Study 7 days in a row.', 'best ' + plural(x.longest | 0, 'day')));
      out.push(tier('streak', 'circle', ['flame', '30'], 30, x.longest | 0, '30-day streak', 'Study 30 days in a row.', 'best ' + plural(x.longest | 0, 'day')));
      out.push(tier('level', 'hex', ['chev'], 10, x.level | 0, 'Level 10', 'Reach level 10.', 'level ' + (x.level | 0)));
    } else {
      out.push(tier('exam', 'shield', ['watch'], 1, s.exams, 'First practice exam', 'Take one practice exam or ' + word.toLowerCase() + ' test.', plural(s.exams, 'exam') + ' taken'));
      out.push(tier('exam', 'shield', ['num', 'EXAMS', '3'], 3, s.exams, '3 exams', 'Take 3 practice exams or ' + word.toLowerCase() + ' tests.', plural(s.exams, 'exam') + ' taken'));
      out.push({ id: 'exam-80', fam: 'exam', shape: 'shield', glyph: ['target'], gold: true, label: '80%+ exam', earned: s.best >= 80, sub: s.best >= 80 ? 'best ' + s.best + '%' : '', tip: 'Score 80% or higher on a practice exam.' + (s.best && s.best < 80 ? ' Best so far ' + s.best + '%.' : '') });
      out.push(tier('days', 'circle', ['flame'], 7, s.days, '7 days studied', 'Study this course on 7 different days.', plural(s.days, 'day') + ' studied'));
      out.push(tier('days', 'circle', ['flame', '30'], 30, s.days, '30 days studied', 'Study this course on 30 different days.', plural(s.days, 'day') + ' studied'));
    }
    if(ap){
      out.push(tier('frq', 'tile', ['pen'], 1, s.frq, 'First free response', 'Write and score one free response.', plural(s.frq, 'free response') + ' written'));
      out.push(tier('frq', 'tile', ['num', 'WRITTEN', '10'], 10, s.frq, '10 free responses', 'Write and score 10 different free responses.', plural(s.frq, 'free response') + ' written'));
    }
    return out;
  }

  /* ------------------------------------------------------------ the art */
  var SHAPE = {
    hex: ['M32 4 56 18v28L32 60 8 46V18z', 'M32 10 50.5 21v22L32 54 13.5 43V21z'],
    shield: ['M32 4 55 12v20c0 14-10 23-23 28C19 55 9 46 9 32V12z', 'M32 10 49.5 16.5V32c0 11-7.6 18-17.5 22-9.9-4-17.5-11-17.5-22V16.5z'],
    circle: ['M32 5a27 27 0 1 0 0 54 27 27 0 0 0 0-54z', 'M32 11a21 21 0 1 0 0 42 21 21 0 0 0 0-42z'],
    tile: ['M17 6h30a11 11 0 0 1 11 11v30a11 11 0 0 1-11 11H17A11 11 0 0 1 6 47V17A11 11 0 0 1 17 6z', 'M18.5 12h27a6.5 6.5 0 0 1 6.5 6.500v27a6.5 6.5 0 0 1-6.5 6.500h-27a6.5 6.5 0 0 1-6.5-6.500v-27a6.5 6.5 0 0 1 6.5-6.500z'],
    burst: ['M32 3l6.2 6.6 8.8-2 2.6 8.7 8.7 2.6-2 8.800L62.9 32l-6.6 6.2 2 8.8-8.7 2.6-2.6 8.7-8.8-2L32 62.900l-6.2-6.6-8.8 2-2.6-8.7-8.7-2.6 2-8.800L1.1 32l6.6-6.2-2-8.8 8.7-2.6 2.6-8.7 8.8 2z', 'M32 12a20 20 0 1 0 0 40 20 20 0 0 0 0-40z']
  };
  var W = '#fff';
  function glyph(g, face){
    var k = g[0];
    if(k === 'num'){
      var big = String(g[2]), size = big.length > 2 ? 17 : 22;
      return '<text x="32" y="25" text-anchor="middle" font-family="Nunito,system-ui,sans-serif" font-weight="900" font-size="' + (g[1].length > 6 ? 6 : 7.5) + '" letter-spacing="1" fill="#fff" opacity=".9">' + g[1] + '</text>' +
        '<text x="32" y="' + (size === 22 ? 46 : 44) + '" text-anchor="middle" font-family="Inter Display,Nunito,system-ui,sans-serif" font-weight="900" font-size="' + size + '" fill="#fff">' + big + '</text>';
    }
    if(k === 'flame') return '<path d="M33 ' + (g[1] ? 13 : 16) + 'c1.5 7 9 9.5 9 18.5a10 10 0 0 1-20 0c0-4 1.8-6.8 4-9 .7 3 1.9 4.3 3.8 4.300C30.2 ' + (g[1] ? 21.5 : 24.5) + ' 29.8 ' + (g[1] ? 17 : 20) + ' 33 ' + (g[1] ? 13 : 16) + 'z" fill="#fff"/>' +
      (g[1] ? '<text x="32" y="40.5" text-anchor="middle" font-family="Inter Display,Nunito,system-ui,sans-serif" font-weight="900" font-size="10" fill="' + face + '">' + g[1] + '</text>'
            : '<path d="M32 33c2.5 2.5 4 4.2 4 6.500a4 4 0 0 1-8 0c0-2.3 1.5-4 4-6.500z" fill="' + face + '"/>');
    if(k === 'watch') return '<circle cx="32" cy="35" r="11" fill="none" stroke="' + W + '" stroke-width="3.5"/><path d="M32 35v-6.5M32 35l4.5 3" stroke="' + W + '" stroke-width="3" stroke-linecap="round" fill="none"/><rect x="29" y="17" width="6" height="5" rx="1.5" fill="' + W + '"/>';
    if(k === 'target') return '<circle cx="32" cy="32" r="12" fill="none" stroke="' + W + '" stroke-width="3.5"/><circle cx="32" cy="32" r="5.5" fill="none" stroke="' + W + '" stroke-width="3"/><circle cx="32" cy="32" r="1.8" fill="' + W + '"/>';
    if(k === 'check') return '<path d="M21 33l8 8 14-16" stroke="' + W + '" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    if(k === 'chev') return '<path d="M21 34l11-10 11 10M21 44l11-10 11 10" stroke="' + W + '" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    if(k === 'cap') return '<path d="M32 21 13 30l19 9 19-9z" fill="' + W + '"/><path d="M21 36v7c3 3.5 7 5 11 5s8-1.5 11-5v-7l-11 5.2z" fill="' + W + '" opacity=".85"/><path d="M49 31v9" stroke="' + W + '" stroke-width="2.5" stroke-linecap="round"/>';
    if(k === 'book') return '<path d="M32 23c-4-3-9-3.5-13-2.500v20c4-1 9-.5 13 2.5 4-3 9-3.5 13-2.500v-20c-4-1-9-.5-13 2.500z" fill="' + W + '"/><path d="M32 23v20" stroke="' + face + '" stroke-width="2.2" stroke-linecap="round"/>';
    if(k === 'pen') return '<path d="M20 44l2.5-9L38 19.500l6.5 6.500L29 41.500z" fill="' + W + '"/><path d="M36 21.500l6.5 6.5" stroke="' + face + '" stroke-width="2.2"/><path d="M20 44l5-1.4-3.6-3.600z" fill="' + face + '"/>';
    return '';
  }
  function hex2(n){ var s = Math.max(0, Math.min(255, Math.round(n))).toString(16); return s.length < 2 ? '0' + s : s; }
  function mix(a, b, t){
    var p = function(h, i){ return parseInt(h.slice(1 + i * 2, 3 + i * 2), 16); };
    return '#' + [0, 1, 2].map(function(i){ return hex2(p(a, i) + (p(b, i) - p(a, i)) * t); }).join('');
  }
  /* Each course's two cover colors (assets/covers/<key>.svg): the dark ground and the light accent. */
  var COLORS = { nremt: ['#0D3B36', '#2EE6D6'], ochem: ['#241A63', '#A18FFF'], anp: ['#4A1A1F', '#FF8A6B'], apbio: ['#1B4422', '#7CCB6B'], apchem: ['#1A2C78', '#8FAEFF'],
    apphys: ['#2A1D06', '#FFB21E'], apcalc: ['#4A1230', '#FF5C9A'], apstat: ['#0E3A52', '#5CC8F0'], apenv: ['#22400F', '#A6DB5C'], appsych: ['#07608A', '#8CC8E8'],
    apprecalc: ['#0B4A33', '#8AF0C0'], apcalcbc: ['#34104C', '#C88CFF'], apmacro: ['#2E4D0C', '#C8F07A'], apmicro: ['#3D0C35', '#FF9BDF'], aphug: ['#7A3310', '#FFB27A'] };
  var LOCK = '<path d="M26 35v-5a6 6 0 0 1 12 0v5" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/><rect x="23" y="35" width="18" height="14" rx="3.5" fill="#94A3B8"/>';
  function art(b, course, locked){
    var sh = SHAPE[b.shape] || SHAPE.circle, c = COLORS[course] || COLORS.nremt;
    var rim = locked ? '#CBD5E1' : b.gold ? '#B7791F' : b.fam === 'streak' || b.fam === 'days' ? '#9A3412' : c[0];
    var face = locked ? '#E8EDF4' : b.gold ? '#E0A019' : b.fam === 'streak' || b.fam === 'days' ? '#EA580C' : mix(c[0], c[1], 0.38);
    return '<svg class="bd-art" viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false"><path d="' + sh[0] + '" fill="' + rim + '"/><path d="' + sh[1] + '" fill="' + face + '"/>' + (locked ? LOCK : glyph(b.glyph, face)) + '</svg>';
  }

  var api = { stats: stats, forCourse: forCourse, art: art, mix: mix, COLORS: COLORS };
  if(typeof module === 'object' && module.exports) module.exports = api;
  root.LevlBadges = api;
})(typeof window !== 'undefined' ? window : globalThis);
