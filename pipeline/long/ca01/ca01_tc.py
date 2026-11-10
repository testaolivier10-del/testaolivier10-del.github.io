"""the script as it is in the video: beats cut from the timeline (tl.CUT) left out, for transcript_check.py"""
import copy, ca01_script as S, tl
CHAPTERS = copy.deepcopy(S.CHAPTERS)
for ch in CHAPTERS:
    ch['beats'] = [b for b in ch['beats'] if b['key'] not in tl.CUT]
clean = S.clean
