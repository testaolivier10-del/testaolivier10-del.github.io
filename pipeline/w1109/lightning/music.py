import requests, sys
K=open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["cinematic documentary score", "low strings", "felt piano", "tense but restrained", "storm atmosphere", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass", "horror stingers"],
 "sections": [
  {"section_name": "the strike and the choice", "positive_local_styles": ["urgent low string ostinato", "single piano notes", "suspense, a question hanging", "D minor"], "negative_local_styles": ["drums"], "duration_ms": 7300, "lines": []},
  {"section_name": "the usual rule", "positive_local_styles": ["steady pulse", "muted strings", "thoughtful, explaining"], "negative_local_styles": ["drums"], "duration_ms": 6200, "lines": []},
  {"section_name": "the flip", "positive_local_styles": ["a clear accent then a brighter turn", "piano motif rising", "surprise"], "negative_local_styles": ["drums"], "duration_ms": 4100, "lines": []},
  {"section_name": "heart and breath", "positive_local_styles": ["very quiet", "slow heartbeat like pulse in low strings", "suspended chords", "slowly warming"], "negative_local_styles": ["drums"], "duration_ms": 12800, "lines": []},
  {"section_name": "the rescue", "positive_local_styles": ["building hope", "warm strings swell", "resolves to D major", "final sustained warm chord"], "negative_local_styles": [], "duration_ms": 9600, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
