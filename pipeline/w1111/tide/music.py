import requests, sys
K=open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["cinematic documentary score", "felt piano", "warm strings", "soft marimba", "seaside calm turning to quiet tension", "restrained", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass", "horror stingers", "risers", "whoosh"],
 "sections": [
  {"section_name": "calm beach, a small doubt", "positive_local_styles": ["relaxed felt piano figure", "warm string pad", "easy late afternoon mood", "a question hanging at the end", "D major"], "negative_local_styles": ["drums"], "duration_ms": 9700, "lines": []},
  {"section_name": "the curve explained", "positive_local_styles": ["steady soft marimba pulse", "pizzicato strings", "curious, thoughtful, explaining", "slowly gaining a little motion"], "negative_local_styles": ["drums"], "duration_ms": 18200, "lines": []},
  {"section_name": "the sea rushes in", "positive_local_styles": ["strings swell upward", "faster pulse", "urgency building to one clear accent near the end", "D minor"], "negative_local_styles": ["drums", "cymbal crash"], "duration_ms": 4700, "lines": []},
  {"section_name": "too late", "positive_local_styles": ["sparse", "single low piano notes", "a held low string note", "wry and quiet", "final soft sustained chord"], "negative_local_styles": ["drums"], "duration_ms": 6800, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
