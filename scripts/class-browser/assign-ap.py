"""Browser checks for the 2026-11-23 assignment changes (docs/teacher-classes.md "Locked assignments"):
the start card shows (not the settings panel), no way into the settings, the second step before a timed start,
same questions for two students in practice and exams. Args: course dirs, comma separated (all twelve by default).
Usage: python3 assign-ap.py [args]   with the repo served at http://localhost:8765 and Chrome at /usr/bin/google-chrome."""
import json, sys, time
from playwright.sync_api import sync_playwright
BASE='http://localhost:8765'; NOW=int(time.time()*1000); DAY=86400000
iso=lambda t: time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(t/1000))
AP={'bio':('apbio','unit-1',['water-hydrogen-bonding','elements-of-life']),'calculus':('apcalc','unit-1',['change-at-an-instant','limit-notation']),'chem':('apchem','unit-1',['moles-molar-mass','mass-spectra']),'statistics':('apstat','unit-1',['intro-statistics','variables']),'macroeconomics':('apmacro','unit-1',['scarcity','opportunity-cost-ppc']),'physics':('apphys','unit-1',['scalars-vectors','motion-quantities']),'environmental-science':('apenv','unit-1',['intro-ecosystems','terrestrial-biomes']),'psychology':('appsych','unit-1',['heredity-environment','nervous-system']),'precalculus':('apprecalc','unit-1',['change-in-tandem','rates-of-change']),'calculus-bc':('apcalcbc','unit-1',['change-at-an-instant','limit-notation']),'microeconomics':('apmicro','unit-1',None),'human-geography':('aphug','unit-1',None)}
only=sys.argv[1].split(',') if len(sys.argv)>1 else list(AP)
fails=[]
def check(ok,msg):
  print(('PASS ' if ok else 'FAIL ')+msg)
  if not ok: fails.append(msg)
def seed(course, assigns):
  def a(id,kind,spec): return {'id':id,'kind':kind,'title':'Test '+id,'required':True,'opens_at':iso(NOW-DAY),'due_at':iso(NOW+DAY),'late_until':None,'spec':spec}
  return {'at':NOW,'list':[{'id':'c1','course':course,'name':'Period 3','teacher':'Ms. Rivera','extra_time':1,'assignments':[a(*x) for x in assigns]}]}
INIT="""(() => { const seed=%s;
 try{ if(!sessionStorage.getItem('pw')){ localStorage.setItem('levlprep_classes_v1', JSON.stringify(seed)); sessionStorage.setItem('pw','1'); const pre=%s; Object.keys(pre).forEach(k=>localStorage.setItem(k,pre[k])); } }catch(e){}
 let v; Object.defineProperty(window,'StudyHubAccount',{configurable:true,get(){return v;},set(x){ v=x; if(!x) return; x.rpcData=()=>Promise.resolve(null); x.rpc=()=>Promise.resolve(true); x.onAuthChange=(cb)=>{ try{cb({id:'u1'});}catch(e){} }; }});
})();"""
def qids(page): return page.evaluate("() => [...document.querySelectorAll('[data-qid]')].map(x=>x.getAttribute('data-qid'))")
def run_set(b, d, sd, aid, page_name='practice.html', pre=None, n_expect=None):
  """Opens the assignment, starts it, walks the set and returns the question ids in order."""
  ctx=b.new_context(viewport={'width':1280,'height':900}); ctx.add_init_script(INIT%(json.dumps(sd), json.dumps(pre or {})))
  pg=ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
  pg.goto(f'{BASE}/{d}/{page_name}?la={aid}'); pg.wait_for_selector('.lvr-card [data-lvr="start"]', timeout=20000)
  return ctx, pg, errs
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
  for d in only:
    course, unit, topics = AP[d]
    if not topics:
      import re
      src=open(f'{d}/assets/bank/index.json').read(); topics=list(json.loads(src)['t'].keys())[:2]
    sd=seed(course,[('ps','practice',{'topics':topics,'count':6,'controls':{'same':True}}),('po','practice',{'topics':topics,'count':6}),
                    ('pt','practice',{'topics':topics,'count':4,'controls':{'timeLimit':5,'same':True}}),('ex','exam',{'unit':unit,'count':12,'controls':{'same':True}}),('exo','exam',{'unit':unit,'count':12})])
    # --- start card: no leak, a way back
    ctx,pg,errs=run_set(b,d,sd,'ps')
    txt=pg.inner_text('.lvr-card')
    check('on your own' not in txt and pg.query_selector('.lvr-card a[href="./#class"]') is not None, f'{d}: start card has no way into the settings, and a Not now link')
    check('same questions' in txt, f'{d}: start card says everyone gets the same questions')
    check(not pg.query_selector('form.cx-builder:visible') and not pg.is_visible('#pp'), f'{d}: the settings panel is not shown on an assignment')
    pg.click('[data-lvr="start"]'); pg.wait_for_selector('[data-qid]', timeout=20000)
    check(not pg.query_selector('[data-sure]'), f'{d}: untimed practice starts on one press')
    ids1=pg.evaluate("() => (window.__s = 1, null)")
    def walk(pg, n=12):
      seen=[]
      for i in range(40):
        for q in qids(pg):
          if q not in seen: seen.append(q)
        r=pg.evaluate("""() => { const q=[...document.querySelectorAll('[data-qid]')].find(x=>!x.classList.contains('is-answered')&&!x.closest('[hidden]')); if(!q){ const nx=[...document.querySelectorAll('button')].find(b=>/^(Next|Continue|Next question|Skip)/.test(b.textContent.trim())&&!b.disabled&&b.offsetParent); if(nx){nx.click(); return 'next';} return null; }
          const opt=q.querySelector('.cx-opt:not([aria-disabled="true"])'), chk=q.querySelector('button[class*="-check"]'), inp=q.querySelector('input[type="text"], input:not([type]), textarea'), dir=q.querySelectorAll('[role="radiogroup"] button');
          if(opt){ opt.click(); if(chk){ chk.disabled=false; chk.click(); } } else if(dir.length){ q.querySelectorAll('[role="radiogroup"]').forEach(g=>g.querySelector('button').click()); if(chk) chk.click(); } else if(inp){ inp.value='1'; inp.dispatchEvent(new Event('input',{bubbles:true})); if(chk){chk.disabled=false; chk.click();} } else if(chk){ chk.disabled=false; chk.click(); } return 'a'; }""")
        pg.wait_for_timeout(120)
        if r is None: break
      return seen
    a1=walk(pg); ctx.close()
    # a second student with other history
    ctx,pg,errs2=run_set(b,d,sd,'ps'); pg.click('[data-lvr="start"]'); pg.wait_for_selector('[data-qid]', timeout=20000); a2=walk(pg); ctx.close()
    check(len(a1)>=2 and a1==a2, f'{d}: same questions, same order for two students ({len(a1)} reached)'); print('   ',a1,a2) if a1!=a2 else None
    check(not errs and not errs2, f'{d}: no page errors {errs[:1]}{errs2[:1]}')
    # timed practice: asks once more
    ctx,pg,errs=run_set(b,d,sd,'pt'); pg.click('[data-lvr="start"]')
    check(pg.query_selector('[data-sure]') is not None and not pg.query_selector('[data-qid]') and 'Start the clock now' in pg.inner_text('.lvr-card'), f'{d}: timed practice asks once more before the clock')
    att=pg.evaluate("() => JSON.parse(localStorage.getItem('levlprep_class_att_v1')||'{}')")
    check(not att.get('pt',{}).get('start'), f'{d}: no clock running while it asks')
    pg.click('[data-lvr="wait"]'); pg.wait_for_selector('[data-lvr="start"]:not([data-sure])')
    check(not pg.query_selector('[data-sure]'), f'{d}: Not yet goes back to the card')
    pg.click('[data-lvr="start"]'); pg.click('[data-sure]'); pg.wait_for_selector('[data-qid]', timeout=20000)
    att=pg.evaluate("() => JSON.parse(localStorage.getItem('levlprep_class_att_v1')||'{}')")
    check(bool(att.get('pt',{}).get('start')), f'{d}: Start now starts the clock')
    pg.reload(); pg.wait_for_selector('.lvr-card [data-lvr="start"]', timeout=20000); pg.click('[data-lvr="start"]'); pg.wait_for_timeout(300)
    check(not pg.query_selector('[data-sure]'), f'{d}: a running clock is not asked about again')
    ctx.close()
    # exam: same draw for two students; a different draw without the setting
    def exam_ids(aid):
      ctx,pg,e=run_set(b,d,sd,aid,'exams.html'); pg.click('[data-lvr="start"]'); pg.click('[data-sure]'); pg.wait_for_selector('[data-qid]', timeout=30000); pg.wait_for_timeout(400)
      ids=walk(pg); ctx.close(); return ids, e
    e1,er1=exam_ids('ex'); e2,er2=exam_ids('ex')
    check(len(e1)>=2 and e1==e2, f'{d}: exam: same questions for two students ({len(e1)} reached)'); print('   ',e1,e2) if e1!=e2 else None
    o1,_=exam_ids('exo'); o2,_=exam_ids('exo')
    check(len(o1)>=2, f'{d}: exam without the setting still runs ({len(o1)} questions, {"different" if sorted(o1)!=sorted(o2) else "same by chance"} draws)')
    ctx,pg,e3=run_set(b,d,sd,'po'); pg.click('[data-lvr="start"]'); pg.wait_for_selector('[data-qid]', timeout=20000); p1=walk(pg); ctx.close()
    check(len(p1)>=2 and 'same questions' not in txt.replace('Everyone in the class gets the same questions','') , f'{d}: practice without the setting runs ({len(p1)} questions)')
    check(not er1 and not er2, f'{d}: exam: no page errors {er1[:1]}')
  b.close()
print('\n%d failed'%len(fails)); [print(' -',f) for f in fails]
