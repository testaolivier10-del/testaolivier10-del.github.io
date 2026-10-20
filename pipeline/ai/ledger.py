"""Modal spend ledger for LevlPrep: one file per run, plus budget reservations.
(An estimate kept by us; Modal's own usage page is the truth when Olivier checks it.)

Why per run files: several scheduled runs (Sunday and Wednesday Shorts, the daily long build) can overlap.
Each run writes ONLY its own file modal_ledger/<run_id>.json, so two runs never edit the same file.
Why reservations: separate files stop write collisions but not double spending. A run first RESERVES its share;
the reservation is pushed to the media branch, and git only accepts the push if nobody else pushed in between
(compare and swap on the branch), so two runs cannot both claim the same remaining money.

usage (run from anywhere; the media branch clone is /tmp/m):
  python3 ledger.py begin <task> [usd|auto]  reserve this run's share (auto = Shorts first formula), prints the grant
  python3 ledger.py month                    spent, held by other runs, this run's reservation, what is left
  python3 ledger.py end                      close this run's reservation (unspent money goes back), commit and push
  python3 ledger.py sweep                    list stale reservations of other runs (nothing is changed)
  tasks: shorts-sun, shorts-wed, long, manual

Every call is logged from submit to result at the H100 rate, so queue and cold start count too (on the safe side).
A call that was submitted but never collected (a run that crashed) keeps counting at its full estimated price:
Modal still ran it, so it is never "released".
Crash recovery: a reservation is released only when BOTH are true: its run has not touched its file for STALE_H
hours (no run lasts that long), and it has no call younger than OPEN_MAX_H (a call never runs that long).
Until then it keeps holding its money. The legacy file /tmp/m/modal_ledger.json (before 2026-10-19) is read for
history and never written again."""
import json, os, sys, time, datetime, glob, subprocess, calendar

ROOT = os.environ.get("LP_LEDGER_ROOT") or ("/tmp/m" if os.path.isdir("/tmp/m") else os.path.expanduser("~/lpledger"))
DIR = os.path.join(ROOT, "modal_ledger")
LEGACY = os.path.join(ROOT, "modal_ledger.json")
RUNFILE = os.path.join(ROOT, ".lp_run")          # local, never committed: which run this workspace is
RATE = 0.0011          # USD per second, H100 on Modal (about $3.95 an hour), estimate
CAP = 27.0             # monthly cap: the free $30 credit minus a $3 safety margin
EST = {"video": 0.65, "images": 0.12}   # price of one call when it is still open (or abandoned)
STALE_H = 12           # a run untouched this long is over
OPEN_MAX_H = 2         # no single Modal call lasts this long
WEIGHT = {"shorts-sun": 4.0, "shorts-wed": 3.0, "long": 0.5}   # Shorts first (video standard 3c)
GIT = ["git", "-C", ROOT, "-c", "user.name=LevlPrep automation", "-c", "user.email=noreply@levlprep.com"]

def _now(): return time.time()
def _month(): return datetime.date.today().strftime("%Y-%m")
def _est(kind): return EST["video"] if kind.startswith("video") else EST["images"]

def _read(p):
    try: return json.load(open(p))
    except Exception: return None

def run_id():
    try: return open(RUNFILE).read().strip() or None
    except Exception: return None

def _path(rid): return os.path.join(DIR, rid + ".json")

def _all_runs():
    runs = {os.path.basename(p)[:-5]: d for p in sorted(glob.glob(os.path.join(DIR, "*.json"))) if (d := _read(p))}
    _COLLECTED.clear()   # a call submitted in one run and collected in a resumed run counts once
    _COLLECTED.update(c.get("call") for d in runs.values() for c in d.get("calls", []) if c.get("call"))
    return runs

def _spent(d, month):
    return sum(c["usd"] for c in d.get("calls", []) if c["date"].startswith(month))

_COLLECTED = set()
def _open_cost(d):
    return sum(_est(o["kind"]) for cid, o in d.get("open", {}).items() if cid not in _COLLECTED)

def _stale(d, now):
    last = d.get("touched", d.get("started", 0))
    young_open = any(now - o["t"] < OPEN_MAX_H * 3600 for cid, o in d.get("open", {}).items() if cid not in _COLLECTED)
    return now - last > STALE_H * 3600 and not young_open

def _held(d, now):
    """Money a run is still holding beyond what it already spent: unspent reservation (while active) plus open calls."""
    oc = _open_cost(d)
    r = d.get("reservation", {})
    if r.get("status") == "active" and not _stale(d, now):
        return max(0.0, r.get("usd", 0.0) - d.get("spent_in_run", 0.0) - oc) + oc
    return oc   # closed or stale: only its uncollected calls still count

def status(exclude=None):
    """(spent this month, held by runs other than `exclude`, left for `exclude` before its own reservation)."""
    m, now = _month(), _now()
    legacy = _read(LEGACY) or {"calls": []}
    spent = sum(c["usd"] for c in legacy.get("calls", []) if c["date"].startswith(m))
    held = 0.0
    for rid, d in _all_runs().items():
        spent += _spent(d, m)
        if rid != exclude: held += _held(d, now)
    return round(spent, 2), round(held, 2), round(CAP - spent - held, 2)

def _load_mine():
    rid = run_id()
    if not rid:   # no begin in this workspace (a manual chat): use a dated manual run, no reservation
        rid = "manual-" + datetime.date.today().isoformat()
        os.makedirs(DIR, exist_ok=True); open(RUNFILE, "w").write(rid)
    d = _read(_path(rid)) or {"run": rid, "task": "manual", "started": _now(), "reservation": {"usd": 0.0, "status": "none"},
                              "spent_in_run": 0.0, "open": {}, "calls": []}
    return rid, d

def _save(rid, d):
    os.makedirs(DIR, exist_ok=True); d["touched"] = _now()
    tmp = _path(rid) + ".tmp"; json.dump(d, open(tmp, "w"), indent=1); os.replace(tmp, _path(rid))

def can_spend(usd):
    """Clients call this before a new Modal call. True when this run may spend `usd` more."""
    return left() >= usd

def start(call_id, kind):
    rid, d = _load_mine(); d["open"][call_id] = {"t": _now(), "kind": kind}; _save(rid, d)

def finish(call_id):
    rid, d = _load_mine()
    o = d["open"].pop(call_id, None)
    if not o:   # submitted by an earlier run (a resumed build): log it here; status() then stops counting it as open there
        for other in _all_runs().values():
            if call_id in other.get("open", {}): o = other["open"][call_id]; break
    if o:
        s = _now() - o["t"]
        # timed from submit to collect; a call collected late (a resumed run) is capped at twice its usual price
        usd = round(min(s * RATE, 2 * _est(o["kind"])), 3)
        d["calls"].append({"date": datetime.date.today().isoformat(), "kind": o["kind"], "seconds": round(s), "usd": usd, "call": call_id})
        d["spent_in_run"] = round(d.get("spent_in_run", 0.0) + usd, 3)
    _save(rid, d)

def month_spend(month=None):
    m = month or _month()
    legacy = _read(LEGACY) or {"calls": []}
    return round(sum(c["usd"] for c in legacy.get("calls", []) if c["date"].startswith(m)) +
                 sum(_spent(d, m) for d in _all_runs().values()), 2)

def left():
    """Kept for old callers: what this run may still spend."""
    rid, d = _load_mine(); s, h, l = status(exclude=rid)
    free_global = CAP - s - h - _open_cost(d)
    r = d.get("reservation", {})
    if r.get("status") == "active":
        return round(min(r["usd"] - d.get("spent_in_run", 0.0) - _open_cost(d), free_global), 2)
    return round(free_global, 2)

def _runs_left_this_month(task):
    """Remaining weighted runs from today to month end: Sundays, Wednesdays, and about 2 long builds a week."""
    today = datetime.date.today(); last = calendar.monthrange(today.year, today.month)[1]
    days = [today + datetime.timedelta(n) for n in range(last - today.day + 1)]
    sun = sum(1 for x in days if x.weekday() == 6); wed = sum(1 for x in days if x.weekday() == 2)
    longs = max(1, round(len(days) * 2 / 7))
    total = sun * WEIGHT["shorts-sun"] + wed * WEIGHT["shorts-wed"] + longs * WEIGHT["long"]
    return WEIGHT.get(task, 0.5), max(total, WEIGHT.get(task, 0.5))

def _git(*a, check=True):
    return subprocess.run(GIT + list(a), capture_output=True, text=True, check=check)

def _sync():
    _git("sparse-checkout", "add", "/modal_ledger/", check=False)
    return _git("pull", "-q", "--rebase", "--autostash", "origin", "media", check=False).returncode == 0

def _commit_push(rid, msg):
    """Commit only this run's file and push. Returns True when the remote accepted it."""
    _git("add", "--sparse", _path(rid))
    if _git("diff", "--cached", "--quiet", check=False).returncode != 0:
        _git("commit", "-q", "-m", msg, "--", _path(rid))
    return _git("push", "-q", "origin", "media", check=False).returncode == 0

def begin(task, want="auto"):
    """Reserve this run's share. Atomic: the reservation counts only once git accepted the push;
    if another run pushed first, pull, recompute what is free, shrink the grant if needed, retry."""
    rid = datetime.datetime.now().strftime("%Y%m%d-%H%M") + "-" + task
    os.makedirs(DIR, exist_ok=True); open(RUNFILE, "w").write(rid)
    for attempt in range(5):
        _sync()
        s, h, free = status(exclude=rid)
        if want == "auto":
            w, total = _runs_left_this_month(task); ask = free * w / total
        else:
            ask = float(want)
        grant = round(max(0.0, min(ask, free)), 2)
        d = _read(_path(rid)) or {"run": rid, "task": task, "started": _now(), "spent_in_run": 0.0, "open": {}, "calls": []}
        d["reservation"] = {"usd": grant, "status": "active", "asked": round(ask, 2), "free_when_granted": free}
        _save(rid, d)
        if _commit_push(rid, f"Modal reservation {rid}: ${grant}"):
            print(f"run {rid} reserved ${grant} (asked {round(ask, 2)}; spent this month {s}, held by other runs {h}, free {free})")
            return grant
        _git("reset", "-q", "--soft", "HEAD~1", check=False)   # undo our unpushed commit, then retry on top of theirs
        time.sleep(3 + attempt * 2)
    print(f"run {rid}: could not push the reservation after 5 tries; reserving $0 (use the fallback in video standard section 2)")
    d = _read(_path(rid)); d["reservation"]["usd"] = 0.0; _save(rid, d)
    return 0.0

def end():
    rid, d = _load_mine()
    r = d.get("reservation", {}); r["status"] = "closed"; r["closed"] = _now(); d["reservation"] = r
    _save(rid, d); _sync()
    ok = _commit_push(rid, f"Modal ledger {rid}: closed, spent ${round(d.get('spent_in_run', 0), 2)}")
    if not ok: _sync(); ok = _commit_push(rid, f"Modal ledger {rid}: closed")
    print(f"run {rid} closed: spent ${round(d.get('spent_in_run', 0), 2)} of ${r.get('usd', 0)} reserved; "
          f"{len(d.get('open', {}))} calls still open (they keep counting). pushed: {ok}")

def sweep():
    now = _now(); me = run_id()
    for rid, d in _all_runs().items():
        if rid == me: continue
        r = d.get("reservation", {})
        if r.get("status") == "active":
            age = round((now - d.get("touched", d.get("started", now))) / 3600, 1)
            state = "STALE, released" if _stale(d, now) else "active"
            print(f"{rid}: reserved ${r.get('usd')}, spent ${round(d.get('spent_in_run', 0), 2)}, "
                  f"{len(d.get('open', {}))} open calls, last touched {age} h ago -> {state}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "month"
    if cmd == "begin": begin(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "auto")
    elif cmd == "end": end()
    elif cmd == "sweep": sweep()
    else:
        rid, d = _load_mine() if run_id() else (None, {})
        s, h, free = status(exclude=rid)
        line = f"month {s} USD estimated, cap {CAP}, held by other runs {h}, free {free}"
        if d.get("reservation", {}).get("status") == "active":
            line += f"; this run {rid} reserved {d['reservation']['usd']}, spent {round(d.get('spent_in_run', 0), 2)}, may still spend {left()}"
        print(line)
