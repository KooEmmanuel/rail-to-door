#!/usr/bin/env python3
"""Make a simple monogram mark when a brand has no logo yet.

    python3 make_logo.py "<Brand Name>" <out.png> [--letters AB]

Draws the brand's initial(s) in a serif face inside a fine ring: dark on a transparent PNG (the site
tints the mark in code). It is a stand-in — say so, and replace it when the brand has a real logo.
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont
FONTS = ['/System/Library/Fonts/Supplemental/Georgia.ttf', '/System/Library/Fonts/Supplemental/Times New Roman.ttf', '/Library/Fonts/Georgia.ttf',
         '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', 'C:/Windows/Fonts/georgia.ttf']
def font(size):
    for f in FONTS:
        if os.path.exists(f): return ImageFont.truetype(f, size)
    try: return ImageFont.load_default(size)
    except TypeError: return ImageFont.load_default()
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('name'); ap.add_argument('out'); ap.add_argument('--letters'); a = ap.parse_args()
    words = [w for w in a.name.replace('&', ' ').split() if w[0].isalnum()]
    letters = (a.letters or (words[0][0] if len(words) == 1 else words[0][0] + words[1][0])).upper()[:2]
    S = 1024; im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im); ink = (23, 21, 15, 255)
    d.ellipse([40, 40, S - 40, S - 40], outline=ink, width=22)
    f = font(560 if len(letters) == 1 else 400); box = d.textbbox((0, 0), letters, font=f)
    d.text(((S - (box[2] - box[0])) / 2 - box[0], (S - (box[3] - box[1])) / 2 - box[1]), letters, font=f, fill=ink)
    im.resize((512, 512), Image.LANCZOS).save(a.out); print(f'Monogram "{letters}" written to {a.out}')
if __name__ == '__main__': main()
