import requests, sys
K = open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["cinematic documentary score", "felt piano", "warm low strings", "dry desert heat atmosphere", "soft nylon guitar harmonics", "restrained", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass", "choir", "western cowboy cliche"],
 "sections": [
  {"section_name": "the trade offered", "positive_local_styles": ["sparse", "low sustained string drone", "single piano notes", "a question hanging", "A minor", "heat and stillness"], "negative_local_styles": ["drums"], "duration_ms": 10100, "lines": []},
  {"section_name": "memory of home", "positive_local_styles": ["warmer", "gentle piano figure", "thoughtful", "soft strings enter"], "negative_local_styles": ["drums"], "duration_ms": 9200, "lines": []},
  {"section_name": "one word", "positive_local_styles": ["hushed", "suspended chord held", "very quiet"], "negative_local_styles": ["drums"], "duration_ms": 4200, "lines": []},
  {"section_name": "the next one", "positive_local_styles": ["steady soft pulse in low strings", "curious", "slowly building", "piano motif rising"], "negative_local_styles": ["drums"], "duration_ms": 10900, "lines": []},
  {"section_name": "the trade", "positive_local_styles": ["warm resolution to A major", "strings swell gently", "relief", "final sustained warm chord"], "negative_local_styles": [], "duration_ms": 7700, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
