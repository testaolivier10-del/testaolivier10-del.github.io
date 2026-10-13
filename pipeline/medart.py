"""Free medical and science illustrations for LevlPrep videos (Bioicons on GitHub, which includes
about 1,300 Servier Medical Art drawings as SVG: hearts, lungs, skin burn depths, cells, muscles...).

Only commercially usable licenses are allowed (cc-0, cc-by-3.0, cc-by-4.0, mit, bsd). cc-by-sa is skipped
so nothing forces a license on the video. Every drawing used is logged in out/<id>/credits.json, and
credit_line(out) gives the text that MUST go at the end of the YouTube description (and the TikTok
caption when the caption has room): CC BY requires naming the source.

    import medart
    medart.search("heart")                      -> [(name, license, author, category), ...]
    medart.preview(["heart-interior-1", "healthy-lung"])   -> contact sheet PNG on a navy background
    svg = medart.inline("skin-third-degree-burn", out, prefix="sk", x=140, y=80, w=800)
        -> <g> markup with every id prefixed (sk_...) so GSAP can animate parts; logs the credit
    tag = medart.image("healthy-lung", out, x=..., y=..., w=...)   -> <image> tag (file copied into out)
    medart.credit_line(out)
"""
import os, re, json, subprocess, shutil

REPO = "https://github.com/duerrsimon/bioicons"
CACHE = "/home/claude/lp/bioicons"
OK = ("cc-0", "cc-by-3.0", "cc-by-4.0", "mit", "bsd")
LIC_NAME = {"cc-0": "CC0", "cc-by-3.0": "CC BY 3.0", "cc-by-4.0": "CC BY 4.0", "mit": "MIT", "bsd": "BSD"}


def _git(*a):
    return subprocess.run(["git", "-C", CACHE, *a], check=True, capture_output=True, text=True).stdout


def _ensure():
    if not os.path.isdir(f"{CACHE}/.git"):
        subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--no-checkout", REPO, CACHE], check=True)
        _git("sparse-checkout", "init", "--no-cone")
        _git("sparse-checkout", "set", "--no-cone", "/static/icons/icons.json")
        _git("checkout", "-q", "HEAD")


def _index():
    _ensure()
    if not hasattr(_index, "rows"):
        rows = []
        for p in _git("ls-tree", "-r", "--name-only", "HEAD", "static/icons").splitlines():
            parts = p.split("/")
            if len(parts) == 6 and parts[5].endswith(".svg") and parts[2] in OK:
                rows.append(dict(path=p, name=parts[5][:-4], license=parts[2], category=parts[3], author=parts[4].replace("_", " ").replace("--", " ")))
        _index.rows = rows
    return _index.rows


def search(term, limit=40):
    t = term.lower().replace(" ", "-")
    hits = [r for r in _index() if t in r["name"].lower() or t in r["category"].lower()]
    return [(r["name"], r["license"], r["author"], r["category"]) for r in hits[:limit]]


def _fetch(name):
    rows = [r for r in _index() if r["name"] == name]
    assert rows, f"no drawing named {name}; use medart.search()"
    r = rows[0]
    local = f"{CACHE}/{r['path']}"
    if not os.path.exists(local):
        cur = _git("sparse-checkout", "list").split()
        _git("sparse-checkout", "set", "--no-cone", *cur, "/" + r["path"])
        _git("checkout", "-q", "HEAD")
    return r, local


def _log(out, r):
    os.makedirs(out, exist_ok=True)
    p = f"{out}/credits.json"
    cr = json.load(open(p)) if os.path.exists(p) else []
    item = dict(name=r["name"], author=r["author"], license=r["license"], source="bioicons.com")
    if item not in cr:
        cr.append(item)
    json.dump(cr, open(p, "w"), indent=1)


def credit_line(out):
    p = f"{out}/credits.json"
    if not os.path.exists(p):
        return ""
    cr = json.load(open(p))
    serv = sorted({LIC_NAME[c["license"]] for c in cr if c["author"].lower().startswith("servier")})
    other = sorted({f'{c["author"]} ({LIC_NAME[c["license"]]})' for c in cr if not c["author"].lower().startswith("servier") and c["license"] != "cc-0"})
    parts = []
    if serv:
        parts.append(f"Servier Medical Art (smart.servier.com), {' / '.join(serv)}")
    parts += other
    return ("Illustrations adapted from " + "; ".join(parts) + " via bioicons.com") if parts else ""


def _size(svg):
    m = re.search(r'viewBox="([\d.\-e ]+)"', svg)
    if m:
        x, y, w, h = map(float, m.group(1).split())
        return x, y, w, h
    w = float(re.search(r'width="([\d.]+)', svg).group(1)); h = float(re.search(r'height="([\d.]+)', svg).group(1))
    return 0, 0, w, h


def inline(name, out, prefix, x=0, y=0, w=400):
    """Inline SVG group, scaled to width w at (x, y). All ids get the prefix so they never clash."""
    r, local = _fetch(name)
    s = open(local, encoding="utf-8").read()
    s = re.sub(r"<\?xml.*?\?>|<!DOCTYPE.*?>|<!--.*?-->", "", s, flags=re.S)
    vx, vy, vw, vh = _size(s)
    body = re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", s.strip(), flags=re.S)
    body = re.sub(r'\bid="([^"]+)"', lambda m: f'id="{prefix}_{m.group(1)}"', body)
    body = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{prefix}_{m.group(1)})', body)
    body = re.sub(r'(xlink:href|href)="#([^"]+)"', lambda m: f'{m.group(1)}="#{prefix}_{m.group(2)}"', body)
    # class names in embedded <style> blocks would leak into the page; scope them by prefix
    body = re.sub(r'\.(st\d+|cls-\d+|fil\d+|str\d+)\b', lambda m: f'.{prefix}_{m.group(1)}', body)
    body = re.sub(r'class="([^"]+)"', lambda m: 'class="' + " ".join(f"{prefix}_{c}" if re.match(r"(st|cls-|fil|str)\d", c) else c for c in m.group(1).split()) + '"', body)
    k = w / vw
    _log(out, r)
    return f'<g id="{prefix}" transform="translate({x},{y}) scale({k:.5f}) translate({-vx},{-vy})">{body}</g>'


def image(name, out, x=0, y=0, w=400):
    r, local = _fetch(name)
    os.makedirs(out, exist_ok=True)
    shutil.copy(local, f"{out}/{name}.svg")
    vx, vy, vw, vh = _size(open(local, encoding="utf-8").read())
    _log(out, r)
    return f'<image href="{name}.svg" x="{x}" y="{y}" width="{w}" height="{w * vh / vw:.1f}"/>'


def preview(names, path="/tmp/claude-0/medart_preview.png"):
    import cairosvg
    from PIL import Image
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tiles = []
    for n in names:
        _, local = _fetch(n)
        cairosvg.svg2png(url=local, write_to="/tmp/claude-0/_m.png", output_width=400)
        im = Image.open("/tmp/claude-0/_m.png").convert("RGBA"); im.thumbnail((400, 400))
        bg = Image.new("RGBA", (420, 420), (8, 20, 40, 255)); bg.paste(im, (10, 10), im); tiles.append(bg)
    cols = min(4, len(tiles)); rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (420 * cols, 420 * rows))
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 420, (i // cols) * 420))
    sheet.save(path)
    return path
