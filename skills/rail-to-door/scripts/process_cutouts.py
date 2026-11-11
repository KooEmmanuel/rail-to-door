#!/usr/bin/env python3
"""Turn raw garment images into rail-ready cut-outs and wire them into the site.

    python3 process_cutouts.py --raw <raw_dir> --site <site_dir> [--height 1000] [--synth-side] [--append]

<raw_dir> holds one image per view, named  <slug>-front.*, <slug>-back.*, <slug>-side.*  (png/jpg/webp),
and optionally catalog.json:  [{"id": "<slug>", "name": "...", "price": 58, "cat": "Shirts", "sizes": ["S","M","L","XL"]}, ...]
(the order of catalog.json is the order on the rail; anything missing gets a sensible default).

For every slug it: removes a flat backdrop if the image is not already transparent, trims to the garment,
resizes to --height, saves WebP into <site>/assets/rail/, measures the dominant colour (used for the folded
garment in the 3D packing scene) and rewrites the PRODUCTS block in <site>/js/data.js.

--synth-side  build a side view from the front when no side image exists (a narrow, shaded copy)
--append      keep the products already in data.js and add these after them
Needs: Pillow, numpy, opencv-python, scipy.
"""
import argparse, glob, json, os, re, sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi

def load_rgba(path):
    return np.array(Image.open(path).convert('RGBA'))

def has_alpha(a): return (a[..., 3] < 250).mean() > .02

def key_backdrop(a):
    """Remove a flat, light studio backdrop: colour distance from the border, largest shape, holes filled."""
    bgr = cv2.cvtColor(a[..., :3], cv2.COLOR_RGB2BGR); lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    b = max(8, int(min(a.shape[:2]) * .04))
    border = np.concatenate([lab[:b].reshape(-1, 3), lab[-b:].reshape(-1, 3), lab[:, :b].reshape(-1, 3), lab[:, -b:].reshape(-1, 3)]); med = np.median(border, 0)
    dab = np.hypot(lab[..., 1] - med[1], lab[..., 2] - med[2]); dL = np.abs(med[0] - lab[..., 0])
    m = ((dab > 12) | (dL > 48)).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lb, st, _ = cv2.connectedComponentsWithStats(m)
    if n < 2: return a, 0.0
    big = st[1:, cv2.CC_STAT_AREA].max(); keep = np.zeros_like(m)
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] > big * .08: keep[lb == k] = 255
    keep = ndi.binary_fill_holes(keep > 0).astype(np.uint8) * 255
    keep = cv2.erode(keep, np.ones((3, 3), np.uint8)); alpha = cv2.GaussianBlur(keep, (0, 0), 1.0)
    out = a.copy(); out[..., 3] = alpha
    return out, float((keep > 0).mean())

def trim(a, pad=4):
    ys, xs = np.where(a[..., 3] > 8)
    if not len(ys): return a
    return a[max(0, ys.min() - pad):ys.max() + pad + 1, max(0, xs.min() - pad):xs.max() + pad + 1]

def fit(a, h):
    if a.shape[0] <= h: return a
    w = max(1, round(a.shape[1] * h / a.shape[0])); return np.array(Image.fromarray(a).resize((w, h), Image.LANCZOS))

def synth_side(front):
    """A garment seen edge-on: the front squeezed to a thin profile, shaded toward both edges."""
    h, w = front.shape[:2]; nw = max(40, round(w * .17)); s = np.array(Image.fromarray(front).resize((nw, h), Image.LANCZOS)).astype(np.float32)
    x = np.linspace(-1, 1, nw); shade = (1 - .38 * np.abs(x) ** 1.6)[None, :, None]; s[..., :3] *= shade
    return s.clip(0, 255).astype(np.uint8)

def colour(a):
    h = a.shape[0]; low = a[int(h * .25):]; px = low[low[..., 3] > 200][:, :3]
    if not len(px): px = a[a[..., 3] > 200][:, :3]
    c = np.median(px, 0).astype(int) if len(px) else np.array([120, 120, 120]); return '#%02x%02x%02x' % tuple(c)

def find(raw, slug, view):
    for ext in ('png', 'webp', 'jpg', 'jpeg'):
        p = os.path.join(raw, f'{slug}-{view}.{ext}')
        if os.path.exists(p): return p

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--raw', required=True); ap.add_argument('--site', required=True)
    ap.add_argument('--height', type=int, default=1000); ap.add_argument('--synth-side', action='store_true'); ap.add_argument('--append', action='store_true')
    a = ap.parse_args(); raw, site = os.path.abspath(a.raw), os.path.abspath(a.site); out_dir = os.path.join(site, 'assets', 'rail'); os.makedirs(out_dir, exist_ok=True)
    cat = {}; order = []
    cp = os.path.join(raw, 'catalog.json')
    if os.path.exists(cp):
        for r in json.load(open(cp)): cat[r['id']] = r; order.append(r['id'])
    slugs = sorted({os.path.basename(p).rsplit('-front.', 1)[0] for p in glob.glob(os.path.join(raw, '*-front.*'))})
    slugs = [s for s in order if s in slugs] + [s for s in slugs if s not in order]
    if not slugs: sys.exit(f'No "<slug>-front.*" images found in {raw}')
    items, warn = [], []
    for slug in slugs:
        views = {}
        for v in ('front', 'back', 'side'):
            p = find(raw, slug, v)
            if not p: continue
            img = load_rgba(p)
            if not has_alpha(img):
                img, cov = key_backdrop(img)
                if cov < .03 or cov > .85: warn.append(f'{slug}-{v}: backdrop removal looks wrong ({cov:.0%} kept). Use a transparent PNG (Higgsfield remove_background) for this one.')
            views[v] = fit(trim(img), a.height)
        if 'back' not in views: views['back'] = views['front']; warn.append(f'{slug}: no back view, the front is reused.')
        if 'side' not in views:
            if not a.synth_side: sys.exit(f'{slug}: no side view. Generate one, or pass --synth-side to build it from the front.')
            views['side'] = synth_side(views['front']); warn.append(f'{slug}: side view synthesised from the front.')
        c = cat.get(slug, {}); rec = {'id': slug, 'name': c.get('name', slug.replace('-', ' ').title()), 'price': c.get('price', 60), 'cat': c.get('cat', 'Shirts'), 'sizes': c.get('sizes', ['S', 'M', 'L', 'XL'])}
        for v, img in views.items():
            fn = f'assets/rail/{slug}-{v}.webp'; Image.fromarray(img).save(os.path.join(site, fn), 'WEBP', quality=90, method=6); rec[v] = fn
        rec['color'] = colour(views['front']); rec['w'] = int(views['front'].shape[1]); rec['h'] = int(views['front'].shape[0]); items.append(rec)
        print(f'  {slug}: front {views["front"].shape[1]}x{views["front"].shape[0]}, side {views["side"].shape[1]}px wide, colour {rec["color"]}')
    dp = os.path.join(site, 'js', 'data.js'); s = open(dp, encoding='utf-8').read()
    m = re.search(r'export const PRODUCTS = (\[.*?\n\]);', s, re.S)
    if not m: sys.exit('Could not find the PRODUCTS block in js/data.js')
    if a.append:
        old = [r for r in json.loads(m.group(1)) if r['id'] not in {i['id'] for i in items}]; items = old + items
    s = s[:m.start(1)] + json.dumps(items, indent=2, ensure_ascii=False) + s[m.end(1):]
    open(dp, 'w', encoding='utf-8').write(s); json.dump(items, open(os.path.join(out_dir, 'items.json'), 'w'), indent=1, ensure_ascii=False)
    print(f'{len(items)} products written to js/data.js')
    if len(items) > 10: print('NOTE: the rail is designed for 6-10 pieces; with more it scrolls sideways.')
    for w in warn: print('WARNING:', w)

if __name__ == '__main__': main()
