import sys, json, re, os
sys.path.insert(0,'/home/claude/lp')
import engine2
def gaps(spec):
    p=f"/home/claude/lp/out/{spec['id']}/offsets.json"
    if os.path.exists(p):
        g=json.load(open(p))
        for b in spec['beats']:
            if b['key'] in g: b['gap']=max(0.12,g[b['key']])
def words(spec):
    out=f"/home/claude/lp/out/{spec['id']}"
    T,D,C=engine2.plan(spec,out)
    for b in spec['beats']:
        k=b['key']; j=f"{out}/{k}.el.json"
        if not os.path.exists(j): print(k,'T',round(T[k],2),'(silent)'); continue
        al=json.load(open(j))['alignment']; ch=al['characters']; st=al['character_start_times_seconds']
        ws=[];cur='';s0=None
        for c,t in zip(ch,st):
            if c.strip():
                if not cur: s0=t
                cur+=c
            elif cur: ws.append((cur,s0)); cur=''
        if cur: ws.append((cur,s0))
        print(k,'T',round(T[k],2),'D',round(D[k],2),'cues',{n:round(v,2) for n,v in C[k].items()})
        print('   '+' '.join(f"{w}@{T[k]+t:.2f}" for w,t in ws))
if __name__=='__main__':
    m=__import__(sys.argv[1]); gaps(m.SPEC); words(m.SPEC)
