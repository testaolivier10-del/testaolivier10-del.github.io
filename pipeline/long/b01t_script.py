"""Rebuild test of yt-apbio-01, chapter "Evaporation and sweat", with the 2026-10-17 visual upgrades.
Same narration as the posted video (its audio is reused, so no voice credits)."""
import copy
import b01_script as S
ID = "yt-apbio-01-sweat-test"
CHAPTERS = [copy.deepcopy(c) for c in S.CHAPTERS if c["id"] == "sweat"]
clean = S.clean
