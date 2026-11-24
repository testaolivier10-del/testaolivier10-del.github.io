"""Browser checks for the 2026-11-23 assignment changes (docs/teacher-classes.md "Locked assignments"):
My class on NREMT, ochem and A&P (practice goes straight in, a timed exam asks once more), hand-picked
questions, review and mastery cards, and the fallback for an unknown assignment. Run from the repo root.
Usage: python3 assign-other.py [args]   with the repo served at http://localhost:8765 and Chrome at /usr/bin/google-chrome."""
import json,sys,time
src=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'assign-ap.py')).read().split("with sync_playwright() as p:")[0].replace("only=sys.argv[1].split(',') if len(sys.argv)>1 else list(AP)","only=[]")
exec(src)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  # --- My class on a course without a runner: the exam asks once more, practice goes straight in
  for d,course,unit,topics in (('anatomy-physiology','anp','blood',['blood-composition']),('nremt','nremt',None,['pharmacology']),('ochem','ochem','substitution-elimination',['sn2'])):
    sd=seed(course,[('pr','practice',{'topics':topics,'count':6}),('ex','exam',{'unit':unit} if unit else {})])
    ctx=b.new_context(viewport={'width':1280,'height':900}); ctx.add_init_script(INIT%(json.dumps(sd),json.dumps({'sb-x-auth-token':'{}'})))
    pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:150]))
    pg.goto(f'{BASE}/{d}/#class/assign'); 
    try: pg.wait_for_selector('.lvx-row', timeout=15000)
    except Exception as e: print('FAIL',d,'My class did not draw'); ctx.close(); continue
    links=pg.evaluate("() => [...document.querySelectorAll('.lvx-row')].map(r=>[r.querySelector('.lvx-t').textContent, r.querySelector('a.lvx-btn').getAttribute('href'), r.querySelector('a.lvx-btn').getAttribute('data-lvx')])")
    ex=[l for l in links if 'ex' in l[0]][0]; pr=[l for l in links if 'pr' in l[0]][0]
    check(ex[2]=='sure' and 'go=1' in ex[1], f'{d}: the exam button asks first and its link starts the exam ({ex[1]})')
    check(pr[2] is None and 'go=1' in pr[1], f'{d}: practice goes straight in ({pr[1]})')
    pg.click('.lvx-row a[data-lvx="sure"]'); pg.wait_for_selector('.lvx-sure')
    check('Start the clock now' in pg.inner_text('.lvx-sure') and pg.url.endswith('#class/assign'), f'{d}: the second step shows and nothing has started')
    pg.click('.lvx-sure [data-lvx="wait"]'); pg.wait_for_timeout(200)
    check(not pg.query_selector('.lvx-sure') and pg.is_visible('.lvx-row a[data-lvx="sure"]'), f'{d}: Not yet puts the button back')
    pg.click('.lvx-row a[data-lvx="sure"]'); pg.click('.lvx-sure a.lvx-btn'); pg.wait_for_timeout(4000)
    check('exams.html' in pg.url and pg.evaluate("() => !!document.querySelector('[role=timer], #quizScreen, .ex-clock, [class*=clock], [class*=timer]')"), f'{d}: Start now opens the exam running ({pg.url.split("/")[-1]})')
    check(not errs, f'{d}: no page errors {errs[:1]}')
    ctx.close()
  # --- hand-picked questions on AP Biology; review and mastery cards are visible
  idx=json.load(open('bio/assets/bank/unit-1.json'))['items']
  t='elements-of-life'; ids=[q['id'] for q in idx if q['topic']==t][:9]; pick=[ids[7],ids[2],ids[5]]
  sd=seed('apbio',[('pk','practice',{'topics':[t],'count':3,'controls':{'same':True,'pick':pick}}),('rv','review',{'topics':[t],'count':5}),('ms','mastery',{'topics':[t],'target':0.8,'min':5})])
  ctx,pg,errs=run_set(b,'bio',sd,'pk')
  check('3 questions your teacher picked' in pg.inner_text('.lvr-card'), 'bio: the start card says the teacher picked the questions')
  pg.click('[data-lvr="start"]'); pg.wait_for_selector('[data-qid]', timeout=20000)
  seen=[]
  for i in range(30):
    for q in qids(pg):
      if q not in seen: seen.append(q)
    r=pg.evaluate("""() => { const q=[...document.querySelectorAll('[data-qid]')].find(x=>!x.classList.contains('is-answered')&&!x.closest('[hidden]')); if(!q){ const nx=[...document.querySelectorAll('button')].find(b=>/^(Next|Continue|Skip)/.test(b.textContent.trim())&&!b.disabled&&b.offsetParent); if(nx){nx.click(); return 'n';} return null; } const opt=q.querySelector('.cx-opt:not([aria-disabled="true"])'), chk=q.querySelector('button[class*="-check"]'); if(opt){opt.click(); if(chk){chk.disabled=false; chk.click();}} else if(chk){chk.disabled=false; chk.click();} return 'a'; }""")
    pg.wait_for_timeout(120)
    if r is None: break
  body=pg.evaluate("() => document.querySelector('#app').innerText")
  check('of 3 questions' in body and len(seen)>=2 and set(seen)<=set(pick), f'bio: the set is the 3 picked questions and nothing else (reached {seen})')
  ctx.close()
  for aid in ('rv','ms'):
    ctx,pg,errs=run_set(b,'bio',sd,aid); check(pg.is_visible('.lvr-card') and not pg.is_visible('#pp'), f'bio: {aid} opens on its card, not the settings'); ctx.close()
  # an assignment this device does not know: the regular page comes back with a note
  ctx=b.new_context(viewport={'width':1280,'height':900}); ctx.add_init_script(INIT%(json.dumps(seed('apbio',[])),'{}')); pg=ctx.new_page(); pg.goto(f'{BASE}/bio/practice.html?la=nope'); pg.wait_for_timeout(6500)
  check(pg.is_visible('#pp') and 'not in your classes' in pg.inner_text('body'), 'bio: an unknown assignment falls back to the regular page with a note')
  ctx.close(); b.close()
print('\n%d failed'%len(fails)); [print(' -',f) for f in fails]
