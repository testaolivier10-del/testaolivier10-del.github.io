"""w1031-02-phineas-gage (premium rebuild 2026-11-09): the voiced script by beat, for pronounce.py and transcript_check.py."""
SPEC = {"id": "w1031-02-phineas-gage", "beats": [
 {"vo": "Phineas Gage was tamping blasting powder into a rock in eighteen forty eight, when a spark set it off, and the iron rod in his hands shot up through his skull.", "energy": "steady"},
 {"vo": "It landed about eighty feet away. And somehow... he lived. He was talking within minutes.", "energy": "curious"},
 {"vo": "[curious] So what did that rod take from him? It tore through his left frontal lobe, the part of the brain that plans ahead and holds back impulses.", "energy": "curious"},
 {"vo": "[warmly] Before the accident, his bosses called him their most capable foreman. [serious] Afterward, he swore, brushed off advice, and dropped his plans as fast as he made them.", "energy": "serious"},
 {"vo": "And his friends said he was NO longer Gage.", "energy": "warm"},
]}
TEXT = " ".join(b["vo"] for b in SPEC["beats"])
