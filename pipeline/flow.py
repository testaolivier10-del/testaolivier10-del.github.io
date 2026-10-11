"""Stub: the old Kokoro voice path is not used. ElevenLabs .el.json files must exist for every beat."""
def one(text, path):
    raise RuntimeError("No ElevenLabs audio for this beat; voice it first (Kokoro is retired).")
def weight(s):
    return max(len(s), 1)
