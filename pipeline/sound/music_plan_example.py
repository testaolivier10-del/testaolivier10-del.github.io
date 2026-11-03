import requests, json, sys
K=open('/mnt/user-data/uploads/Downloads/levlprep/elevenlabs_key.txt').read().strip()
plan = {
 "positive_global_styles": ["cinematic documentary score", "orchestral strings", "solo piano", "low taiko pulse", "1940s wartime gravity", "emotional, restrained", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "EDM", "trap beat", "comedy", "lo-fi"],
 "sections": [
  {"section_name": "losses", "positive_local_styles": ["somber D minor", "low sustained strings", "distant timpani rolls", "tension"], "negative_local_styles": ["drums kit"], "duration_ms": 7400, "lines": []},
  {"section_name": "the count", "positive_local_styles": ["steady pulsing low strings", "ticking piano ostinato", "methodical"], "negative_local_styles": [], "duration_ms": 7300, "lines": []},
  {"section_name": "the plan", "positive_local_styles": ["heavier", "brass swells low", "confident but wrong"], "negative_local_styles": [], "duration_ms": 3750, "lines": []},
  {"section_name": "wald", "positive_local_styles": ["drop to solo piano", "curious", "quiet", "thoughtful melody"], "negative_local_styles": ["drums"], "duration_ms": 9250, "lines": []},
  {"section_name": "engine hits", "positive_local_styles": ["dark tension", "low strings tremolo", "big timpani hit", "falling motif"], "negative_local_styles": [], "duration_ms": 4400, "lines": []},
  {"section_name": "realization", "positive_local_styles": ["building", "rising strings", "hopeful turn to D major", "swell"], "negative_local_styles": [], "duration_ms": 5800, "lines": []},
  {"section_name": "the fix", "positive_local_styles": ["full warm resolution in D major", "strong accent at the start", "strings and horns", "triumphant but restrained"], "negative_local_styles": [], "duration_ms": 4500, "lines": []},
  {"section_name": "name", "positive_local_styles": ["settling", "piano melody returns", "soft ending", "final sustained chord"], "negative_local_styles": [], "duration_ms": 4300, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.headers.get('content-type'), r.text[:400] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
