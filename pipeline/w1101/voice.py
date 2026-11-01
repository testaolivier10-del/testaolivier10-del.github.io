import json,sys,base64,subprocess,os,re,time
k=sys.argv[1]; text=json.load(open('/home/claude/lp/w1101/scripts.json'))[k]
out=f'/home/claude/lp/w1101/out/{k}'; os.makedirs(out,exist_ok=True)
json.dump({'text':text,'model_id':'eleven_v3','voice_settings':{'stability':0.5,'similarity_boost':0.75}},open(f'{out}/body.json','w'))
for i in range(3):
    r=subprocess.run(['bash','-c',f'curl -s -w "%{{http_code}}" -X POST -H "xi-api-key: $(tr -d " \\r\\n" < /root/.lpkey/k)" -H "Content-Type: application/json" --data @{out}/body.json https://api.elevenlabs.io/v1/text-to-speech/5gaEGrWSk4v20HMfIhgC/with-timestamps -o {out}/el_raw.json'],capture_output=True,text=True)
    if r.stdout.strip()=='200': break
    print('retry',r.stdout); time.sleep(30)
d=json.load(open(f'{out}/el_raw.json'))
open(f'{out}/voice.mp3','wb').write(base64.b64decode(d['audio_base64']))
a=d['alignment']; ch=a['characters']; st=a['character_start_times_seconds']; en=a['character_end_times_seconds']
words=[];cur='';t0=None
for c,s,e in zip(ch,st,en):
    if c.isspace():
        if cur: words.append({'w':cur,'t0':t0,'t1':last}); cur=''
        continue
    if not cur: t0=s
    cur+=c; last=e
if cur: words.append({'w':cur,'t0':t0,'t1':last})
json.dump(words,open(f'{out}/words.json','w'),indent=0)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{out}/voice.mp3','-ar','44100','-ac','1',f'{out}/voice.wav'])
print(k,len(words),'words, end',round(words[-1]['t1'],2),'first',round(words[0]['t0'],2))
