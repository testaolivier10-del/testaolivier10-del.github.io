import requests, sys
K=open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["cinematic documentary score", "felt piano", "warm strings", "soft celesta", "curious and gentle", "late night library mood", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass", "choir", "corporate pop"],
 "sections": [
  {"section_name": "the challenge", "positive_local_styles": ["sparse felt piano motif", "a question hanging", "quiet", "A minor"], "negative_local_styles": ["drums"], "duration_ms": 8250, "lines": []},
  {"section_name": "the rule", "positive_local_styles": ["steady soft pulse", "muted low strings", "thoughtful"], "negative_local_styles": ["drums"], "duration_ms": 4700, "lines": []},
  {"section_name": "four careful steps", "positive_local_styles": ["piano motif climbing one step at a time", "light pizzicato", "careful, building gently"], "negative_local_styles": ["drums"], "duration_ms": 6650, "lines": []},
  {"section_name": "it works", "positive_local_styles": ["warm turn to C major", "strings bloom softly", "quiet delight"], "negative_local_styles": ["drums"], "duration_ms": 4400, "lines": []},
  {"section_name": "the endless sum", "positive_local_styles": ["slow arpeggios that keep rising", "celesta sparkles", "wonder", "steady"], "negative_local_styles": ["drums"], "duration_ms": 8150, "lines": []},
  {"section_name": "reaching far", "positive_local_styles": ["wide slow string swell", "expansive", "resolves to a warm sustained C major chord", "fades gently"], "negative_local_styles": [], "duration_ms": 9450, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
