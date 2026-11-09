"""ElevenLabs music_v1 score for the Gage Short, composition plan timed to the edit. usage: music.py <out.mp3>"""
import requests, json, sys, subprocess
K = subprocess.run(['bash', '-c', "tr -d ' \\r\\n' < /root/.lpkey/k"], capture_output=True, text=True).stdout
plan = {
 "positive_global_styles": ["cinematic documentary score", "felt piano", "warm strings", "soft pads", "19th century Americana restraint", "intimate, serious", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "choir", "drum kit", "EDM", "trailer brass", "comedy", "lo-fi", "corporate pop"],
 "sections": [
  {"section_name": "tamping", "positive_local_styles": ["quiet A minor", "low sustained strings", "soft ticking piano ostinato", "uneasy calm"], "negative_local_styles": ["drums"], "duration_ms": 5600, "lines": []},
  {"section_name": "the blast", "positive_local_styles": ["one deep low string and timpani accent at the start", "suspended high strings", "the rod rising"], "negative_local_styles": ["drum kit"], "duration_ms": 4600, "lines": []},
  {"section_name": "he lived", "positive_local_styles": ["hushed", "single piano notes", "gentle lift toward hope"], "negative_local_styles": ["drums"], "duration_ms": 7200, "lines": []},
  {"section_name": "inside the head", "positive_local_styles": ["curious", "slow piano motif", "soft pulsing pad", "thoughtful"], "negative_local_styles": ["drums"], "duration_ms": 8600, "lines": []},
  {"section_name": "before", "positive_local_styles": ["warm brief turn to C major", "strings and piano", "nostalgic"], "negative_local_styles": [], "duration_ms": 4500, "lines": []},
  {"section_name": "after", "positive_local_styles": ["back to A minor", "restless low strings", "dissonant piano", "unsettled"], "negative_local_styles": ["drums"], "duration_ms": 5700, "lines": []},
  {"section_name": "no longer Gage", "positive_local_styles": ["somber resolution", "piano motif returns", "soft ending", "final sustained chord"], "negative_local_styles": [], "duration_ms": 5000, "lines": []}
 ]
}
json.dump(plan, open('gage_plan.json', 'w'), indent=1)
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K},
                  json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
