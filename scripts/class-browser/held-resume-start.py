"""Review fixes: held answers stay out of progress until release (3), an exam resumes its clock and counts tab
leaves after a reload (4), a failed exam start and a used-up free exam (5). Usage: pw_review.py <base> [dirs]"""
import json, sys, time
from playwright.sync_api import sync_playwright
BASE = sys.argv[1]
NOW = int(time.time() * 1000); DAY = 86400000
iso = lambda t: time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(t / 1000))
COURSES = {'bio': ('apbio', 'unit-1', ['water-hydrogen-bonding']), 'calculus': ('apcalc', 'unit-1', ['change-at-an-instant']),
           'macroeconomics': ('apmacro', 'unit-1', ['scarcity'])}
if len(sys.argv) > 2: COURSES = {k: v for k, v in COURSES.items() if k in sys.argv[2].split(',')}
fails = []
def check(ok, m):
  print(('PASS ' if ok else 'FAIL ') + m)
  if not ok: fails.append(m)

def seed(course, unit, topics):
  a = lambda id, kind, spec, due: {'id': id, 'kind': kind, 'title': 'T ' + id, 'required': True, 'opens_at': iso(NOW - 2 * DAY), 'due_at': iso(due), 'spec': spec}
  return {'at': NOW, 'list': [{'id': 'c1', 'course': course, 'name': 'P3', 'teacher': 'Ms. R', 'extra_time': 1, 'assignments': [
    a('hs', 'practice', {'topics': topics, 'count': 3, 'controls': {'release': 'after_submit'}}, NOW + DAY),
    a('hd', 'practice', {'topics': topics, 'count': 2, 'controls': {'release': 'after_due'}}, NOW + DAY),
    a('ex', 'exam', {'unit': unit, 'count': 15, 'controls': {'release': 'after_submit'}}, NOW + DAY),
    a('ef', 'exam', {'unit': unit, 'count': 15, 'controls': {}}, NOW + DAY)]}]}

INIT = """(() => { const seed = %s;
  if(!sessionStorage.getItem('pw')){ localStorage.setItem('levlprep_classes_v1', JSON.stringify(seed)); sessionStorage.setItem('pw', '1'); }
  let v; Object.defineProperty(window, 'StudyHubAccount', { configurable: true, get(){ return v; }, set(x){ v = x; if(!x) return;
    x.rpcData = () => Promise.resolve(null); x.rpc = () => Promise.resolve(true); x.onAuthChange = (cb) => { try { cb({ id: 'u1' }); } catch(e) {} }; } }); })();"""

ANSWER = """() => { const q = [...document.querySelectorAll('[data-qid]')].find(x => !x.classList.contains('is-answered') && !x.closest('[hidden]'));
  if(!q) return null; const o = q.querySelector('.cx-opt:not([aria-disabled="true"])'), c = q.querySelector('button[class*="-check"]'), i = q.querySelector('input[type="text"]');
  const d = q.querySelectorAll('[role="radiogroup"] button');
  if(o){ o.click(); if(c && o.getAttribute('role') === 'checkbox'){ c.disabled = false; c.click(); } }
  else if(d.length){ q.querySelectorAll('[role="radiogroup"]').forEach(g => g.querySelector('button').click()); if(c) c.click(); }
  else if(i){ i.value = '1'; if(c){ c.disabled = false; c.click(); } } else if(c){ c.disabled = false; c.click(); }
  return q.getAttribute('data-qid'); }"""

def prog(pg, course): return pg.evaluate(f"() => Object.keys((JSON.parse(localStorage.getItem('{course}_progress_v1') || '{{}}').q) || {{}})")
def att(pg, id): return pg.evaluate(f"() => (JSON.parse(localStorage.getItem('levlprep_class_att_v1') || '{{}}'))['{id}'] || {{}}")
def hide(pg): pg.evaluate("""() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); }""")

def run_practice(pg, d, id, course):
  pg.goto(f'{BASE}/{d}/practice.html?la={id}', wait_until='networkidle')
  pg.click('[data-lvr="start"]')
  answered = []
  for k in range(15):
    pg.wait_for_selector('[data-qid]', timeout=15000); pg.wait_for_timeout(150)
    q = pg.evaluate(ANSWER); pg.wait_for_timeout(200)
    if q: answered.append(q)
    if not pg.evaluate("() => !!document.querySelector('[data-qid]:not(.is-answered)')"):
      before_end = prog(pg, course)
      nb = pg.query_selector('.cx-next')
      if nb and 'result' in nb.inner_text().lower(): nb.click(); pg.wait_for_timeout(500); return answered, before_end
      if nb: nb.click(); pg.wait_for_timeout(200)
  return answered, prog(pg, course)

with sync_playwright() as p:
  br = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  for d, (course, unit, topics) in COURSES.items():
    print('==', d)
    ctx = br.new_context(service_workers='block'); ctx.add_init_script(INIT % json.dumps(seed(course, unit, topics)))
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))

    # 3. after_submit: nothing in progress while answering, recorded at hand-in.
    ans, before = run_practice(pg, d, 'hs', course)
    after = prog(pg, course)
    check(ans and not any(a in before for a in ans), f'{d}: held answers not in progress before hand-in ({len(ans)} answered)')
    check(all(a in after for a in ans), f'{d}: after_submit records them at hand-in')
    # after_due: still not in progress after hand-in, nor the missed list.
    ans2, _ = run_practice(pg, d, 'hd', course)
    after2 = prog(pg, course)
    check(ans2 and not any(a in after2 for a in ans2), f'{d}: after_due keeps answers out of progress after hand-in')
    held = pg.evaluate("() => Object.keys((JSON.parse(localStorage.getItem('levlprep_class_hold_v1') || '{}'))['hd'] || {})")
    check(set(ans2) <= set(held), f'{d}: held answers wait in the hold store')
    # Released (due date passed): opening the assignment records them.
    pg.evaluate("() => { const c = JSON.parse(localStorage.getItem('levlprep_classes_v1')); c.list[0].assignments[1].due_at = new Date(Date.now() - 1000).toISOString(); localStorage.setItem('levlprep_classes_v1', JSON.stringify(c)); }")
    pg.goto(f'{BASE}/{d}/practice.html?la=hd', wait_until='networkidle'); pg.wait_for_selector('.lvr-card', timeout=15000)
    check(all(a in prog(pg, course) for a in ans2), f'{d}: released after the due date: recorded then')
    check(pg.query_selector('[data-lvr="answers"]') is not None, f'{d}: See your answers offered once released')

    # 5a. failed load: no attempt, button back with a message.
    def block(route): route.abort()
    pg.route('**/assets/bank/unit-*.json', block)
    pg.goto(f'{BASE}/{d}/exams.html?unit={unit}&la=ex', wait_until='networkidle')
    pg.click('[data-lvr="start"]'); pg.wait_for_timeout(1500)
    btn = pg.query_selector('[data-lvr="start"]')
    msg = pg.inner_text('.lvr-card [role="status"]')
    check(btn and not btn.is_disabled() and 'did not load' in msg, f'{d}: failed exam load re-enables Start with a message ({msg!r})')
    check(not att(pg, 'ex').get('start'), f'{d}: no attempt started on a failed load')
    pg.unroute('**/assets/bank/unit-*.json', block)

    # 4. exam without a limit: start, reload, clock resumes, tab leave counted before Start.
    pg.goto(f'{BASE}/{d}/exams.html?unit={unit}&la=ex', wait_until='networkidle')
    pg.click('[data-lvr="start"]'); pg.wait_for_selector('[role="timer"]', timeout=20000)
    a0 = att(pg, 'ex')
    check(a0.get('start') and a0.get('limit'), f'{d}: exam attempt starts at load with its budget ({a0.get("limit")})')
    pg.wait_for_timeout(2500)
    pg.reload(wait_until='networkidle'); pg.wait_for_selector('.lvr-card', timeout=15000)
    hide(pg); pg.wait_for_timeout(200)
    check(att(pg, 'ex').get('tabs') == 1, f'{d}: tab leave counted after a reload, before Keep going')
    pg.click('[data-lvr="start"]'); pg.wait_for_selector('[role="timer"]', timeout=20000); pg.wait_for_timeout(600)
    t = pg.inner_text('[role="timer"]'); lim = a0['limit'] // 1000
    parts = [int(x) for x in t.split(':')]; secs = parts[-1] + 60 * parts[-2] + (3600 * parts[0] if len(parts) == 3 else 0)
    check(secs <= lim - 2, f'{d}: the clock resumed, not restarted ({t} of {lim}s)')

    # 5b. free exam used up: a clear message, no Start, no attempt.
    pg.evaluate(f"() => localStorage.setItem('levlprep_free_exam_v1', JSON.stringify({{ '{course}': true }}))")
    pg.goto(f'{BASE}/{d}/exams.html?unit={unit}&la=ef', wait_until='networkidle'); pg.wait_for_selector('.lvr-card', timeout=15000)
    txt = pg.inner_text('.lvr-card')
    check('free practice exam' in txt and not pg.query_selector('[data-lvr="start"]') and not att(pg, 'ef').get('start'), f'{d}: used free exam: message on the start card, no attempt')
    check(not errs, f'{d}: no page errors {errs[:2]}')
    ctx.close()
  br.close()
print('FAILURES', len(fails))
for f in fails: print(' -', f)
