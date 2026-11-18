import requests, sys
K=open('/root/.lpkey/k').read().strip()
plan = {
 "positive_global_styles": ["pastoral documentary score", "felt piano", "warm strings", "soft woodwinds", "summer morning in the countryside", "restrained", "high quality mix"],
 "negative_global_styles": ["vocals", "lyrics", "drum kit", "EDM", "trap beat", "comedy", "lo-fi", "trailer brass", "choir", "horror"],
 "sections": [
  {"section_name": "the sour milk", "positive_local_styles": ["gentle solo felt piano", "a worried question", "soft sustained strings", "D minor"], "negative_local_styles": ["drums"], "duration_ms": 9070, "lines": []},
  {"section_name": "the old farmer's idea", "positive_local_styles": ["curious", "a light clarinet line over piano", "thoughtful"], "negative_local_styles": ["drums"], "duration_ms": 4640, "lines": []},
  {"section_name": "rising over the land", "positive_local_styles": ["rising string swell", "sense of discovery", "opening up", "moving toward F major"], "negative_local_styles": ["drums"], "duration_ms": 9910, "lines": []},
  {"section_name": "the rings", "positive_local_styles": ["steady plucked string ostinato", "each phrase adds a new instrument", "gently building", "F major"], "negative_local_styles": ["drums"], "duration_ms": 12010, "lines": []},
  {"section_name": "where is he", "positive_local_styles": ["brief suspended chord", "quiet", "anticipation"], "negative_local_styles": ["drums"], "duration_ms": 3000, "lines": []},
  {"section_name": "the wheat", "positive_local_styles": ["warm resolution", "golden strings and piano", "hopeful", "ends on a sustained F major chord"], "negative_local_styles": [], "duration_ms": 6370, "lines": []}
 ]
}
r = requests.post('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', headers={'xi-api-key': K}, json={'composition_plan': plan, 'model_id': 'music_v1'}, timeout=600)
print(r.status_code, r.text[:300] if r.status_code != 200 else len(r.content))
if r.status_code == 200: open(sys.argv[1], 'wb').write(r.content)
