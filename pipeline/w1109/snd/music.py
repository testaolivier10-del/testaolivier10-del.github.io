import requests, json, sys
K=open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["warm cinematic documentary score", "felt piano", "pizzicato strings", "soft celesta", "light, curious, playful suspense", "restrained", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass"],
 "sections": [
  {"section_name": "the choice", "positive_local_styles": ["curious pizzicato strings", "ticking celesta", "suspended, a question hanging", "A minor"], "negative_local_styles": ["drums"], "duration_ms": 8960, "lines": []},
  {"section_name": "earlier", "positive_local_styles": ["light storytelling", "felt piano melody over pizzicato", "gentle forward motion"], "negative_local_styles": ["drums"], "duration_ms": 10320, "lines": []},
  {"section_name": "it is not fifty fifty", "positive_local_styles": ["drop to very quiet", "one suspended chord", "thoughtful pause"], "negative_local_styles": ["drums"], "duration_ms": 4640, "lines": []},
  {"section_name": "the reasoning", "positive_local_styles": ["steady piano ostinato", "warm strings entering", "slowly building", "rising toward major"], "negative_local_styles": ["drums"], "duration_ms": 11360, "lines": []},
  {"section_name": "the switch", "positive_local_styles": ["bright warm resolution in A major", "strong accent after two seconds", "full strings swell", "joyful but restrained", "final sustained chord"], "negative_local_styles": [], "duration_ms": 6220, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.headers.get('content-type'), r.text[:400] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
