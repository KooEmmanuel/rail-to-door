#!/usr/bin/env python3
"""Cloth masks for the colour / cloth repaint (assets/extensions/js/recolour.js).

    python3 make_masks.py <site> [preview.png]

For every assets/rail/*-front.webp and *-back.webp it writes assets/rail/mask/<same name>.png: white where
the garment's cloth is, black for the background, the hook and the wooden hanger (so the hanger never gets
repainted). The optional preview tints every mask red on its photo; look at it before shipping. Run it
again whenever a product photo changes. Needs Pillow, numpy and scipy.
"""
import sys, glob, os, numpy as np
from PIL import Image, ImageFilter
from collections import deque
root = sys.argv[1]; prev = sys.argv[2] if len(sys.argv) > 2 else None
os.makedirs(root + '/assets/rail/mask', exist_ok=True)
tiles = []
for f in sorted(glob.glob(root + '/assets/rail/*-front.webp') + glob.glob(root + '/assets/rail/*-back.webp')):
    a = np.array(Image.open(f).convert('RGBA')).astype(int); h, w = a.shape[:2]
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    op = A > 20
    Y = np.arange(h)[:, None]
    wood = (R > 178) & (R - B > 68) & (R - G > 28) & (R - G < 80) & (G - B > 25) & op & (Y < h * .34)
    rows = np.where(wood.sum(1) > 3)[0]; y0 = rows[0] if len(rows) else int(h * .08)
    hook = op & (Y < y0 + 4) & ~wood
    from scipy import ndimage
    lab, n = ndimage.label(wood | hook, structure=np.ones((3, 3)))
    keep = set(np.unique(lab[hook])) - {0}
    big = ndimage.sum(np.ones_like(lab), lab, index=range(1, n + 1))
    keep |= {i + 1 for i, c in enumerate(big) if c > 400}   # the bar inside the collar can sit apart from the hook
    seen = np.isin(lab, list(keep))
    hanger = Image.fromarray((seen * 255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
    hang = np.array(hanger) > 0
    m = np.where(hang, 0, A).astype('uint8')
    name = os.path.basename(f).replace('.webp', '.png')
    Image.fromarray(m, 'L').save(root + '/assets/rail/mask/' + name, optimize=True)
    # preview: cloth tinted red
    v = a.copy(); mm = m[..., None] / 255
    v[..., :3] = (v[..., :3] * (1 - mm * .7) + np.array([230, 30, 30]) * mm * .7)
    t = Image.fromarray(v.astype('uint8'), 'RGBA').resize((w // 3, h // 3))
    tiles.append(t)
if not prev: print(f'{len(tiles)} masks written to {root}/assets/rail/mask'); sys.exit()
W = sum(t.width for t in tiles[:12]); sheet = Image.new('RGB', (W, 2 * 340), (235, 235, 235)); x = 0
for i, t in enumerate(tiles):
    if i == 12: x = 0
    sheet.paste(t, (x, (i // 12) * 340), t); x += t.width
sheet.save(prev)
