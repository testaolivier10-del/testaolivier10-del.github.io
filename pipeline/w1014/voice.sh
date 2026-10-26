#!/bin/bash
# usage: voice.sh module keys
# narrator: Jeremy 5gaEGrWSk4v20HMfIhgC since 2026-10-25 (was Liam TX3LPaxmHKxFdv7VOQHJ)
set -e
cd /home/claude/lp
M=$1; KEYS=$2
TEXT=$(python3 el_split.py text $M $KEYS)
python3 -c "import json,sys; json.dump({'text':sys.argv[1],'model_id':'eleven_v3','voice_settings':{'stability':0.5,'similarity_boost':0.75}},open('/tmp/claude-0/body_$M.json','w'))" "$TEXT"
for i in 1 2 3; do
  code=$(curl -s -w '%{http_code}' -X POST -H "xi-api-key: $(tr -d ' \r\n' < /root/.lpkey/k)" -H "Content-Type: application/json" --data @/tmp/claude-0/body_$M.json https://api.elevenlabs.io/v1/text-to-speech/5gaEGrWSk4v20HMfIhgC/with-timestamps -o /home/claude/lp/$M.el_raw.json)
  if [ "$code" = "200" ] && grep -q audio_base64 /home/claude/lp/$M.el_raw.json; then break; fi
  echo "http $code, retry"; sleep 30
done
python3 el_split.py split $M /home/claude/lp/$M.el_raw.json $KEYS < /dev/null
