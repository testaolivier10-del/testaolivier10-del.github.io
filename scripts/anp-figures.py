"""A&P figure pipeline (local tool; its outputs are committed, CI does not run it).

For every OpenStax figure registered in anatomy-physiology/data/figures/*.json:

  1. LICENSE. Look the image up in the OpenStax figure catalog (every A&P 2e
     figure with its caption credits; see docs/anp-spec.md section 2 and
     decision 22). A figure credited to a third party is refused. The catalog
     path comes from ANP_FIGURE_CATALOG.
  2. IMAGE. Download it once (cached), scale it to at most 1100 px wide, and
     save anatomy-physiology/figures/<id>.jpg. Width and height go back into
     the figure's entry, with the OpenStax page it came from and its license.
  3. LABELS (only with --detect). Find the figure's baked-in text labels: dark
     marks sitting on the white margin, one box per line of text. Writes
     <id>.boxes.json and <id>.overlay.png (numbered boxes) next to the cache,
     for a person or agent to name: each label is one or more line boxes.
     Named labels go in anatomy-physiology/data/labels/<id>.json as
     { "figure": id, "labels": [{ id, name, accept, lines: [box numbers],
     concept }] }; the next run turns lines into the label's box.

Needs Pillow:  pip install pillow

    python3 scripts/anp-figures.py            download, resize, update entries
    python3 scripts/anp-figures.py --detect   also propose label boxes
    ... --only a,b                           only these topics' figure files
"""
import json, os, sys, glob, urllib.request, io
from collections import deque
from PIL import Image, ImageDraw, ImageFont, ImageFile
# A few OpenStax originals end a handful of bytes short on the server itself;
# the missing bytes are the last pixels of the last row, so decode them anyway.
ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'anatomy-physiology', 'data', 'figures')
OUT = os.path.join(ROOT, 'anatomy-physiology', 'figures')
LABELS = os.path.join(ROOT, 'anatomy-physiology', 'data', 'labels')
CACHE = os.environ.get('ANP_FIGURE_CACHE', os.path.join(ROOT, '.cache', 'anp-figures'))
CATALOG = os.environ.get('ANP_FIGURE_CATALOG')
MAX_W = 1100
DETECT = '--detect' in sys.argv
ONLY = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None


def load_catalog():
    if not CATALOG or not os.path.exists(CATALOG):
        sys.exit('Set ANP_FIGURE_CATALOG to the OpenStax figure catalog (see the module docstring).')
    return {c['url']: c for c in json.load(open(CATALOG, encoding='utf8'))}


def fetch(url, dest):
    # A cached download is reused only if it decodes completely; a transfer cut
    # off halfway is fetched again.
    if os.path.exists(dest):
        data = open(dest, 'rb').read()
        try:
            Image.open(io.BytesIO(data)).load()
            return data
        except Exception:
            os.remove(dest)
    req = urllib.request.Request(url, headers={'User-Agent': 'LevlPrep figure pipeline'})
    data = urllib.request.urlopen(req, timeout=60).read()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'wb').write(data)
    return data


def components(mask, W, H, eight=True):
    """Connected components of a 0/1 bytearray: [x0, y0, x1, y1, n] each."""
    seen = bytearray(W * H)
    out = []
    nb = (-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1) if eight else (-1, 1, -W, W)
    for i in range(W * H):
        if not mask[i] or seen[i]:
            continue
        q = deque([i]); seen[i] = 1
        y, x = divmod(i, W)
        x0 = x1 = x; y0 = y1 = y; n = 0
        while q:
            j = q.popleft(); n += 1
            jy, jx = divmod(j, W)
            if jx < x0: x0 = jx
            if jx > x1: x1 = jx
            if jy < y0: y0 = jy
            if jy > y1: y1 = jy
            for d in nb:
                k = j + d
                if k < 0 or k >= W * H or seen[k] or not mask[k]:
                    continue
                kx = k % W
                if abs(kx - jx) > 1:
                    continue
                seen[k] = 1; q.append(k)
        out.append([x0, y0, x1, y1, n])
    return out


def detect_labels(im):
    """Boxes around text sitting on white margins. Returns [x, y, w, h] in the
    image's own pixels.

    1. Letters: connected dark marks the size of a glyph. A leader line is
       long and thin, and an outline is large, so neither survives this.
    2. Words and lines: letters grown sideways until they touch their
       neighbours, then grouped.
    3. Kept only where the ring around the group is white margin, so a small
       dark mark inside the drawing is not mistaken for a label."""
    g = im.convert('L')
    W, H = g.size
    px = g.load()
    dark = bytearray(W * H)
    for y in range(H):
        for x in range(W):
            if px[x, y] < 125:
                dark[y * W + x] = 1
    letters = bytearray(W * H)
    for x0, y0, x1, y1, n in components(dark, W, H):
        w, h = x1 - x0 + 1, y1 - y0 + 1
        if 3 <= h <= 24 and w <= 26 and not (h <= 3 and w > 12):
            for yy in range(y0, y1 + 1):
                r = yy * W
                for xx in range(x0, x1 + 1):
                    if dark[r + xx]:
                        letters[r + xx] = 1
    grow_x, grow_y = 5, 1
    grown = bytearray(W * H)
    for i in range(W * H):
        if letters[i]:
            y, x = divmod(i, W)
            for yy in range(max(0, y - grow_y), min(H, y + grow_y + 1)):
                r = yy * W
                for xx in range(max(0, x - grow_x), min(W, x + grow_x + 1)):
                    grown[r + xx] = 1
    boxes = []
    for x0, y0, x1, y1, n in components(grown, W, H, eight=False):
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if not (8 <= bh <= 30 and bw >= 14):
            continue
        ring = []
        for xx in range(max(0, x0 - 3), min(W, x1 + 4), 2):
            for yy in (max(0, y0 - 3), min(H - 1, y1 + 3)):
                ring.append(px[xx, yy])
        for yy in range(max(0, y0 - 3), min(H, y1 + 4), 2):
            for xx in (max(0, x0 - 3), min(W - 1, x1 + 3)):
                ring.append(px[xx, yy])
        if ring and sum(1 for v in ring if v > 230) / len(ring) > 0.7:
            boxes.append([x0, y0, bw, bh])
    # One box per LINE of text. Whether two stacked lines are one label
    # ("Right pulmonary / artery") or two labels that happen to sit close
    # ("Aortic arch", "Ligamentum arteriosum") cannot be told from pixels
    # alone, so the person or agent naming the labels groups lines into labels.
    merged = sorted(boxes, key=lambda b: (b[1], b[0]))
    return [[max(0, x - 2), max(0, y - 2), w + 4, h + 4] for x, y, w, h in merged]


def overlay(im, boxes, path):
    o = im.convert('RGB').copy()
    d = ImageDraw.Draw(o)
    for i, (x, y, w, h) in enumerate(boxes):
        d.rectangle([x, y, x + w, y + h], outline=(220, 0, 0), width=2)
        d.text((x + w + 3, y), str(i), fill=(220, 0, 0))
    o.save(path)


def main():
    catalog = load_catalog()
    os.makedirs(OUT, exist_ok=True)
    refused = []
    for path in sorted(glob.glob(os.path.join(DATA, '*.json'))):
        if ONLY and os.path.basename(path)[:-5] not in ONLY:
            continue
        entries = json.load(open(path, encoding='utf8'))
        changed = False
        for fid, f in entries.items():
            if f.get('source') != 'openstax':
                continue
            url = (f.get('openstax') or {}).get('url')
            c = catalog.get(url)
            if not c:
                refused.append(f'{fid}: not in the A&P 2e catalog ({url})'); continue
            if c['license'] != 'CC BY 4.0 (OpenStax)':
                refused.append(f'{fid}: credits a third party ({"; ".join(c["thirdParty"])}); not cleared for commercial use'); continue
            raw = fetch(url, os.path.join(CACHE, fid + '.orig'))
            im = Image.open(io.BytesIO(raw))
            if im.mode not in ('RGB', 'L'):
                bg = Image.new('RGB', im.size, (255, 255, 255))
                bg.paste(im, mask=im.convert('RGBA').split()[-1])
                im = bg
            if im.width > MAX_W:
                im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
            dest = os.path.join(OUT, fid + '.jpg')
            im.convert('RGB').save(dest, 'JPEG', quality=82, optimize=True, progressive=True)
            upd = {'w': im.width, 'h': im.height, 'ext': 'jpg', 'license': 'CC BY 4.0'}
            upd_os = dict(f.get('openstax') or {})
            upd_os.update({'page': c['page'], 'figure': c.get('figure') or upd_os.get('figure'), 'section': c['section']})
            for k, v in upd.items():
                if f.get(k) != v:
                    f[k] = v; changed = True
            if f.get('openstax') != upd_os:
                f['openstax'] = upd_os; changed = True
            # Named labels (data/labels/<id>.json) given as line numbers become
            # one box: the union of those lines' boxes from the detection run.
            lp = os.path.join(LABELS, fid + '.json')
            bf = os.path.join(CACHE, fid + '.boxes.json')
            if os.path.exists(lp) and os.path.exists(bf):
                ldata = json.load(open(lp, encoding='utf8'))
                lines = json.load(open(bf))
                lchanged = False
                for lab in ldata.get('labels', []):
                    if lab.get('lines') and not lab.get('box'):
                        bs = [lines[k] for k in lab['lines'] if 0 <= k < len(lines)]
                        if bs:
                            x0 = min(b[0] for b in bs); y0 = min(b[1] for b in bs)
                            x1 = max(b[0] + b[2] for b in bs); y1 = max(b[1] + b[3] for b in bs)
                            lab['box'] = [x0, y0, x1 - x0, y1 - y0]
                            lchanged = True
                if lchanged:
                    open(lp, 'w', encoding='utf8').write(json.dumps(ldata, indent=2, ensure_ascii=False) + '\n')
            if DETECT and not os.path.exists(lp):
                boxes = detect_labels(im)
                os.makedirs(CACHE, exist_ok=True)
                json.dump(boxes, open(os.path.join(CACHE, fid + '.boxes.json'), 'w'))
                overlay(im, boxes, os.path.join(CACHE, fid + '.overlay.png'))
                print(f'{fid}: {len(boxes)} label boxes proposed -> {os.path.join(CACHE, fid + ".overlay.png")}')
        if changed:
            open(path, 'w', encoding='utf8').write(json.dumps(entries, indent=2, ensure_ascii=False) + '\n')
    for r in refused:
        print('REFUSED', r)
    print(f'figures: {len(glob.glob(os.path.join(OUT, "*.jpg")))} images in anatomy-physiology/figures/')
    if refused:
        sys.exit(1)


if __name__ == '__main__':
    main()
