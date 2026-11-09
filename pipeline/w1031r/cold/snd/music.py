import requests, json, sys, subprocess
K=open('/root/.lpkey/k').read().strip()
plan=json.load(open(sys.argv[1]))
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[2], 'wb').write(r.content)
