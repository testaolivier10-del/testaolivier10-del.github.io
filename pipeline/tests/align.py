import sys, re, json, wave
sys.path.insert(0,'/home/claude/lp')
import beats_w1014 as B
from pocketsphinx import Decoder
txt=" ".join(re.sub(r"\{\d\}","",b["vo"]) for b in B.ASPIRIN)
words=[re.sub(r"[^a-z']","",w.lower()) for w in txt.split()]
words=[w for w in words if w]
d=Decoder(samprate=16000,bestpath=False)
dic={}
import pocketsphinx,os
for line in open(os.path.dirname(pocketsphinx.__file__)+'/model/en-us/cmudict-en-us.dict'):
    p=line.split(); dic.setdefault(p[0]," ".join(p[1:]))
for w in set(words):
    if w not in dic:
        print("missing",w)
extra={"chewable":"CH UW AH B AH L","platelets":"P L EY T L AH T S"}
for k,v in extra.items():
    if k not in dic: d.add_word(k,v,True)
d.set_align_text(" ".join(words))
w=wave.open('old16.wav'); buf=w.readframes(w.getnframes())
d.start_utt(); d.process_raw(buf,full_utt=True); d.end_utt()
segs=[(s.word,s.start_frame/100,(s.end_frame+1)/100) for s in d.seg() if s.word not in ('<s>','</s>','<sil>','[NOISE]')]
print(len(words),len(segs))
for s in segs: print(s)
json.dump(segs,open('align.json','w'))
