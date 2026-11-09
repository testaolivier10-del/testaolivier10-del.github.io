"""Held teacher questions graded through class_submit; announcements and live link on the course home card."""
import json, time
from playwright.sync_api import sync_playwright
import sys
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8765'
NOW = int(time.time() * 1000); DAY = 86400000
iso = lambda t: time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(t / 1000))
seed = {'at': NOW, 'list': [{'id': 'c1', 'course': 'apbio', 'name': 'Period 3', 'teacher': 'Ms. Rivera', 'extra_time': 1, 'live': True,
  'announcements': [{'id': 1, 'body': 'Old note', 'created_at': iso(NOW - 3 * DAY)}, {'id': 2, 'body': 'Quiz Friday <b>bring</b> a pencil', 'created_at': iso(NOW - DAY)}],
  'assignments': [{'id': 'h1', 'kind': 'practice', 'title': 'Held with teacher q', 'required': True, 'opens_at': iso(NOW - DAY), 'due_at': iso(NOW + DAY),
   'spec': {'topics': ['water-hydrogen-bonding'], 'count': 1, 'controls': {'release': 'after_submit', 'questions': ['tq1']}}}]}]}
INIT = """
localStorage.setItem('levlprep_classes_v1', %s);
window.__calls = [];
(() => { let v; Object.defineProperty(window, 'StudyHubAccount', { configurable: true, get(){ return v; }, set(x){ v = x; if(!x) return;
  x.rpcData = (n, a) => { window.__calls.push([n, a]);
    if(n === 'class_questions_for') return Promise.resolve([{ id: 'tq1', course: 'apbio', topic: 'water-hydrogen-bonding', unit: 'unit-1', type: 'single', q: 'Pick Delta', options: ['Alpha', 'Bravo', 'Charlie', 'Delta'] }]);
    if(n === 'class_submit') return Promise.resolve({ recorded: true, at: 'now', answers: [{ id: 'tq1', correct: 3, why: 'Fourth.' }] });
    return Promise.resolve(null); };
  x.rpc = () => Promise.resolve(true);
  x.onAuthChange = (cb) => { try { cb({ id: 'u1' }); } catch(e) {} };
} }); })();
""" % json.dumps(json.dumps(seed))
ANSWER = """() => { const q = [...document.querySelectorAll('[data-qid]')].find(x => !x.classList.contains('is-answered') && !x.closest('[hidden]'));
  if(!q) return null; const o = q.querySelector('.cx-opt:not([aria-disabled="true"])'), c = q.querySelector('button[class*="-check"]'), i = q.querySelector('input[type="text"]');
  const d = q.querySelectorAll('[role="radiogroup"] button');
  if(o){ o.click(); if(c && o.getAttribute('role') === 'checkbox'){ c.disabled = false; c.click(); } }
  else if(d.length){ q.querySelectorAll('[role="radiogroup"]').forEach(g => g.querySelector('button').click()); if(c) c.click(); }
  else if(i){ i.value = '1'; if(c){ c.disabled = false; c.click(); } } else if(c){ c.disabled = false; c.click(); }
  return q.getAttribute('data-qid'); }"""
fails = 0
def check(ok, m):
  global fails
  print(('PASS ' if ok else 'FAIL ') + m); fails += 0 if ok else 1
with sync_playwright() as p:
  br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  ctx = br.new_context(viewport={'width': 1200, 'height': 900}); ctx.add_init_script(INIT)
  pg = ctx.new_page()
  pg.goto(BASE + '/bio/practice.html?la=h1', wait_until='networkidle')
  pg.click('[data-lvr="start"]')
  for i in range(12):
    pg.wait_for_selector('[data-qid]', timeout=15000); pg.wait_for_timeout(200)
    if pg.query_selector('[data-qid="tq1"]:not(.is-answered)'):
      pg.click('[data-qid="tq1"] .cx-opt[data-i="3"]')
    else:
      pg.evaluate(ANSWER)
    pg.wait_for_timeout(300)
    if pg.query_selector('.bio-pr-score'): break
    pg.evaluate("() => { const b = document.querySelector('.cx-next'); if(b) b.click(); }")
    pg.wait_for_timeout(300)
    if pg.query_selector('.bio-pr-score'): break
  pg.wait_for_timeout(800)
  calls = pg.evaluate('window.__calls')
  sub = [c for c in calls if c[0] == 'class_submit']
  check(sub and sub[0][1]['p_picks'].get('tq1') == 3 and sub[0][1]['p_assignment'] == 'h1', f'class_submit sent the teacher pick ({sub})')
  att = pg.evaluate("() => JSON.parse(localStorage.getItem('levlprep_class_att_v1'))['h1']")
  check(att['graded'].get('tq1') == 1 and att['c'] >= 1, f'attempt counts the graded teacher answer ({att})')
  check('Pick Delta' not in (pg.inner_text('.bio-pr-summary') if pg.query_selector('.bio-pr-summary') else ''), 'ungraded teacher question left out of the page summary')
  pg.goto(BASE + '/bio/', wait_until='networkidle')
  pg.evaluate("() => { if(!window.LevlClassStudent){ const s = document.createElement('script'); s.src = '/assets/class/class-student.js'; document.head.appendChild(s); } }")
  pg.wait_for_selector('#lvClassView', timeout=15000)
  pg.goto(BASE + '/bio/#class', wait_until='networkidle')
  pg.wait_for_selector('#lvClassView .lvx-body', timeout=15000)
  t = pg.inner_text('#lvClassView')
  check('Join the live session' in t and pg.query_selector('#lvClassView a[href="/live.html?c=c1"]') is not None, 'live link on My class')
  check(t.index('Quiz Friday') < t.index('Old note') or 'Old note' not in t, 'announcements newest first, escaped')
  check(not pg.query_selector('#lvClassView .lvx-ann b'), 'announcement text escaped')
  pg.goto(BASE + '/bio/#class/assign', wait_until='networkidle')
  pg.wait_for_selector('#lvClassView .lvx-row .lvx-btn', timeout=15000)
  href = pg.get_attribute('#lvClassView .lvx-row .lvx-btn', 'href')
  check('la=h1' in href, f'My class link carries la= ({href})')
  br.close()
print('FAILURES', fails)
