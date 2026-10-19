"""Modal spend ledger for LevlPrep (an estimate kept by us; Modal's own usage page is the truth).
Each call is logged from submit to result at the H100 rate, so queue and cold start count too (on the safe side).
usage: python3 ledger.py month   -> this month's estimated spend, the cap, what is left
The ledger lives in the media branch clone at /tmp/m/modal_ledger.json; commit it with the run's other files."""
import json, os, sys, time, datetime
PATH = "/tmp/m/modal_ledger.json" if os.path.isdir("/tmp/m") else os.path.expanduser("~/modal_ledger.json")
RATE = 0.0011          # USD per second, H100 on Modal (about $3.95 an hour), estimate
CAP = 27.0             # monthly cap: the free $30 credit minus a $3 safety margin
def _load():
    try: return json.load(open(PATH))
    except Exception: return {"open": {}, "calls": []}
def _save(d): json.dump(d, open(PATH, "w"), indent=1)
def start(call_id, kind):
    d = _load(); d["open"][call_id] = {"t": time.time(), "kind": kind}; _save(d)
def finish(call_id):
    d = _load(); o = d["open"].pop(call_id, None)
    if o:
        s = time.time() - o["t"]
        d["calls"].append({"date": datetime.date.today().isoformat(), "kind": o["kind"], "seconds": round(s), "usd": round(s * RATE, 3)})
    _save(d)
def month_spend(month=None):
    m = month or datetime.date.today().strftime("%Y-%m")
    return round(sum(c["usd"] for c in _load()["calls"] if c["date"].startswith(m)), 2)
def left():
    return round(CAP - month_spend(), 2)
if __name__ == "__main__":
    print(f"month {month_spend()} USD estimated, cap {CAP}, left {left()}")
