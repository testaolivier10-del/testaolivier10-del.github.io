"""Browser checks for class assignments on course pages (assets/class/class-run.js).
Usage: python3 pw_class_run.py <base url> <shots dir>"""
import json, sys, time
from playwright.sync_api import sync_playwright

BASE, SHOTS = sys.argv[1], sys.argv[2]
NOW = int(time.time() * 1000)
DAY = 86400000
COURSES_ALL = {
  'bio': ('apbio', 'unit-1', ['water-hydrogen-bonding', 'elements-of-life']),
  'calculus': ('apcalc', 'unit-1', ['change-at-an-instant', 'limit-notation']),
  'chem': ('apchem', 'unit-1', ['moles-molar-mass', 'mass-spectra']),
  'statistics': ('apstat', 'unit-1', ['intro-statistics', 'variables']),
  'macroeconomics': ('apmacro', 'unit-1', ['scarcity', 'opportunity-cost-ppc']),
  'physics': ('apphys', 'unit-1', ['scalars-vectors', 'motion-quantities']),
  'environmental-science': ('apenv', 'unit-1', ['intro-ecosystems', 'terrestrial-biomes']),
  'psychology': ('appsych', 'unit-1', ['heredity-environment', 'nervous-system']),
  'precalculus': ('apprecalc', 'unit-1', ['change-in-tandem', 'rates-of-change']),
  'calculus-bc': ('apcalcbc', 'unit-1', ['change-at-an-instant', 'limit-notation']),
}
COURSES = {k: v for k, v in COURSES_ALL.items() if len(sys.argv) < 4 or k in sys.argv[3].split(',')}
iso = lambda t: time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(t / 1000))
fails = []

def check(ok, msg):
  print(('PASS ' if ok else 'FAIL ') + msg)
  if not ok: fails.append(msg)

def classes(course, unit, topics):
  opens = iso(NOW - DAY)
  def a(id, kind, spec, due=NOW + DAY):
    return {'id': id, 'kind': kind, 'title': 'Test ' + id, 'required': True, 'opens_at': opens, 'due_at': iso(due), 'late_until': None, 'spec': spec}
  return {'at': NOW, 'list': [{'id': 'c1', 'course': course, 'name': 'Period 3', 'teacher': 'Ms. Rivera', 'extra_time': 1, 'assignments': [
    a('p-timed', 'practice', {'topics': topics, 'count': 5, 'controls': {'timeLimit': 0.15, 'shuffle': True, 'release': 'after_due'}}),
    a('p-tq', 'practice', {'topics': topics, 'count': 2, 'controls': {'shuffle': True, 'release': 'now', 'questions': ['tq1']}}),
    a('m1', 'mastery', {'topics': topics[:1], 'target': 0.8, 'min': 40, 'controls': {}}),
    a('e1', 'exam', {'unit': unit, 'count': 15, 'controls': {'timeLimit': 1, 'release': 'after_submit', 'shuffle': True}}),
  ]}]}

TQ = [{'id': 'tq1', 'course': None, 'topic': None, 'unit': None, 'type': 'single', 'q': '<img src=x id=pwned>Teacher asks: pick D',
       'options': ['Alpha', 'Bravo', 'Charlie', 'Delta'], 'correct': 3, 'why': 'Delta is the fourth.'}]

INIT = """
(() => {
  const seed = %s; const tq = %s;
  try { if(!sessionStorage.getItem('pw_seeded')){ localStorage.setItem('levlprep_classes_v1', JSON.stringify(seed)); localStorage.removeItem('levlprep_class_att_v1'); sessionStorage.setItem('pw_seeded', '1'); } } catch(e) {}
  let v;
  Object.defineProperty(window, 'StudyHubAccount', { configurable: true, get(){ return v; }, set(x){
    v = x; if(!x) return;
    x.rpcData = (n, a) => Promise.resolve(n === 'class_questions_for' ? tq.map(q => Object.assign({}, q, { course: '%s', topic: '%s', unit: '%s' })) : null);
    x.rpc = () => Promise.resolve(true);
    const real = x.onAuthChange;
    x.onAuthChange = (cb) => { try { cb({ id: 'u1' }); } catch(e) {} };
  } });
})();
"""

def answer_one(page):
  """Answers the first unanswered question on screen, whatever its type."""
  return page.evaluate("""() => {
    const q = [...document.querySelectorAll('[data-qid]')].find(x => !x.classList.contains('is-answered') && !x.closest('[hidden]'));
    if(!q) return null;
    const opt = q.querySelector('.cx-opt:not([aria-disabled="true"])');
    const chk = q.querySelector('button[class*="-check"]');
    const inp = q.querySelector('input[type="text"], input:not([type]), textarea');
    const dir = q.querySelectorAll('[role="radiogroup"] button');
    if(opt){ opt.click(); if(chk && opt.getAttribute('role') === 'checkbox'){ chk.disabled = false; chk.click(); } }
    else if(dir.length){ q.querySelectorAll('[role="radiogroup"]').forEach(g => g.querySelector('button').click()); if(chk) chk.click(); }
    else if(inp){ inp.value = '1'; inp.dispatchEvent(new Event('input', { bubbles: true })); if(chk){ chk.disabled = false; chk.click(); } }
    else if(chk){ chk.disabled = false; chk.click(); }
    return q.getAttribute('data-qid');
  }""")

def att(page):
  return page.evaluate("() => JSON.parse(localStorage.getItem('levlprep_class_att_v1') || '{}')")

def hide_tab(page):
  page.evaluate("""() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }""")

def next_step(page):
  page.evaluate("() => { const b = document.querySelector('.cx-next'); if(b) b.click(); }")

with sync_playwright() as p:
  br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  for d, (course, unit, topics) in COURSES.items():
    print('==', d)
    ctx = br.new_context(viewport={'width': 1200, 'height': 900})
    ctx.add_init_script(INIT % (json.dumps(classes(course, unit, topics)), json.dumps(TQ), course, topics[0], unit))
    page = ctx.new_page()
    errors, run_req = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: run_req.append(r.url) if 'class-run' in r.url else None)

    # 1. No la=: the page is as before, class-run.js never fetched.
    page.goto(f'{BASE}/{d}/practice.html', wait_until='networkidle')
    page.wait_for_selector('form.cx-builder', timeout=15000)
    check(not run_req and not page.query_selector('.lvr-strip'), f'{d}: practice without la= unchanged, no class-run.js')
    page.goto(f'{BASE}/{d}/exams.html', wait_until='networkidle')
    page.wait_for_timeout(800)
    check(not run_req and not page.query_selector('.lvr-strip, .lvr-card'), f'{d}: exams without la= unchanged')

    # 2. Timed practice, answers held until the due date, tab leave, auto hand-in at zero.
    page.goto(f'{BASE}/{d}/practice.html?la=p-timed', wait_until='networkidle')
    page.wait_for_selector('.lvr-card [data-lvr="start"]', timeout=15000)
    check('9 min' not in page.inner_text('.lvr-card') and 'Time limit' in page.inner_text('.lvr-card'), f'{d}: start card names the time limit')
    page.click('[data-lvr="start"]')
    page.wait_for_selector('[data-qid]', timeout=15000)
    page.wait_for_timeout(600)
    t = page.inner_text('.lvr-strip')
    check('0:0' in t or '0:1' in t or '0:' in t, f'{d}: strip shows the class clock ({t.strip()[:60]!r})')
    qid = answer_one(page)
    page.wait_for_timeout(300)
    fb = page.evaluate("(id) => { const q = document.querySelector('[data-qid=\"' + id + '\"]'); return q ? { right: !!q.querySelector('.is-right, .is-wrong, .ok, .no'), text: (q.querySelector('.cx-fb') || {}).textContent || '' } : null }", qid)
    check(fb and not fb['right'] and 'Answer saved' in fb['text'], f'{d}: held answer shows no right/wrong ({fb})')
    hide_tab(page)
    page.wait_for_timeout(300)
    a = att(page).get('p-timed', {})
    check(a.get('tabs') == 1 and a.get('n', 0) >= 1 and a.get('start'), f'{d}: attempt has start, answer, 1 tab leave ({a.get("n")}, {a.get("tabs")})')
    check('Left this tab 1 time' in page.inner_text('.lvr-strip'), f'{d}: strip counts the tab leave')
    page.screenshot(path=f'{SHOTS}/{d}-practice-timed.png')
    page.wait_for_selector('.lvr-card h2:has-text("Handed in")', timeout=15000)
    a = att(page).get('p-timed', {})
    check(a.get('end', 0) > 0, f'{d}: time up handed it in (end set)')
    check(not page.query_selector('.bio-pr-score, [class$="-pr-score"]'), f'{d}: score held until the due date')
    page.screenshot(path=f'{SHOTS}/{d}-practice-handed.png')
    page.goto(f'{BASE}/{d}/practice.html?la=p-timed', wait_until='networkidle')
    page.wait_for_selector('.lvr-card', timeout=15000)
    check(not page.query_selector('[data-lvr="start"]') and 'Handed in' in page.inner_text('.lvr-card'), f'{d}: a timed hand-in is final')

    # 3. Teacher question, escaped, options shuffled, release now (feedback shown).
    orders, seen_tq, fed = [], False, False
    for k in range(3):
      page.goto(f'{BASE}/{d}/practice.html?la=p-tq', wait_until='networkidle')
      page.wait_for_selector('[data-lvr="start"]', timeout=15000)
      check('1 question written by your teacher' in page.inner_text('.lvr-card'), f'{d}: start card counts the teacher question') if k == 0 else None
      page.click('[data-lvr="start"]')
      for step in range(6):
        page.wait_for_selector('[data-qid]', timeout=15000)
        page.wait_for_timeout(150)
        if page.query_selector('[data-qid="tq1"]'):
          seen_tq = True
          orders.append(page.evaluate("() => [...document.querySelectorAll('[data-qid=\"tq1\"] .cx-opt')].map(b => b.getAttribute('data-i')).join('')"))
          check(not page.query_selector('#pwned') and 'Teacher asks' in page.inner_text('[data-qid="tq1"]'), f'{d}: teacher question shown, its markup escaped') if k == 0 else None
        answer_one(page)
        page.wait_for_timeout(250)
        if page.query_selector('.cx-fb.is-right, .cx-fb.is-wrong'): fed = True
        if page.query_selector('[class$="-pr-score"]'): break
        next_step(page)
        page.wait_for_timeout(250)
        if page.query_selector('[class$="-pr-score"]'): break
    check(seen_tq, f'{d}: teacher question served')
    check(fed, f'{d}: release now shows feedback')
    check(len(set(orders)) > 1 or (orders and orders[0] != '0123'), f'{d}: teacher options shuffled ({orders})')
    a = att(page).get('p-tq', {})
    check('tq1' in (a.get('answers') or {}), f'{d}: teacher answer recorded in the attempt')
    prog = page.evaluate(f"() => Object.keys((JSON.parse(localStorage.getItem('{course}_progress_v1') || '{{}}').q) || {{}})")
    check('tq1' not in prog, f'{d}: teacher question kept out of course progress')

    # 4. Mastery progress in the strip.
    page.goto(f'{BASE}/{d}/practice.html?la=m1', wait_until='networkidle')
    page.wait_for_selector('[data-lvr="start"]', timeout=15000)
    page.click('[data-lvr="start"]')
    page.wait_for_selector('[data-qid]', timeout=15000)
    page.wait_for_timeout(300)
    s0 = page.inner_text('.lvr-strip')
    answer_one(page)
    page.wait_for_timeout(400)
    s1 = page.inner_text('.lvr-strip')
    check('%' in s0 and 'of 40 answers' in s0, f'{d}: mastery strip shows topic % and answers ({s0.strip()[:90]!r})')
    check(s0 != s1, f'{d}: mastery progress moves after an answer ({s1.strip()[-40:]!r})')
    page.screenshot(path=f'{SHOTS}/{d}-mastery.png')

    # 5. Exam: class clock, no pause, held answers, results after hand-in.
    page.goto(f'{BASE}/{d}/exams.html?unit={unit}&la=e1', wait_until='networkidle')
    page.wait_for_selector('[data-lvr="start"]', timeout=15000)
    page.click('[data-lvr="start"]')
    page.wait_for_selector('[role="timer"]', timeout=20000)
    page.wait_for_timeout(700)
    tm = page.inner_text('[role="timer"]')
    check(tm.startswith('0:5') or tm.startswith('1:00') or tm.startswith('0:4'), f'{d}: exam clock runs the 1-minute limit ({tm})')
    check(not page.query_selector('[class$="-ex-pause"]'), f'{d}: no pause button in a class exam')
    for tries in range(6):
      answer_one(page)
      page.wait_for_timeout(300)
      if att(page).get('e1', {}).get('n'): break
      page.evaluate("() => document.querySelector('[class$=\"-ex-next\"]').click()")
      page.wait_for_timeout(200)
    check(not page.query_selector('[class$="-ex-stage"] .is-right, [class$="-ex-stage"] .is-wrong'), f'{d}: exam answer held')
    hide_tab(page)
    a = att(page).get('e1', {})
    check(a.get('n') == 1 and a.get('tabs') == 1, f"{d}: exam attempt records the answer and the tab leave ({a.get('n')}, {a.get('tabs')}, {list((a.get('answers') or {}).items())[:2]})")
    page.screenshot(path=f'{SHOTS}/{d}-exam.png')
    page.evaluate("() => { const f = document.querySelector('[class$=\"-ex-finish\"]'); f.click(); }")
    page.wait_for_timeout(200)
    page.evaluate("() => { const y = document.querySelector('[class$=\"-ex-yes\"]'); y.click(); }")
    page.wait_for_timeout(1500)
    a = att(page).get('e1', {})
    check(a.get('end', 0) > 0 and a.get('n', 0) >= 10, f'{d}: exam hand-in sets end and n = questions ({a.get("n")}, c={a.get("c")})')
    check(bool(page.query_selector('[class$="-ex-results"]')), f'{d}: after_submit shows results after hand-in')
    hist = page.evaluate(f"() => (JSON.parse(localStorage.getItem('{course}_prefs_v1') || '{{}}').examHistory || []).length")
    check(hist >= 1, f'{d}: exam history written (assignment status reads it)')
    check(not errors, f'{d}: no page errors {errors[:3]}')
    ctx.close()
  br.close()
print('\nFAILURES:', len(fails))
for f in fails: print(' -', f)
sys.exit(1 if fails else 0)
