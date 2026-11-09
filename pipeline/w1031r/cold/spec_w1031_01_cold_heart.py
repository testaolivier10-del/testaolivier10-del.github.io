"""spec for pronounce.py and transcript_check.py: the one take of w1031-01-cold-heart"""
import json, os
_vo = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts.json')))['w1031-01-cold-heart']['vo']
SPEC = {'id': 'w1031-01-cold-heart', 'beats': [{'vo': _vo}]}
