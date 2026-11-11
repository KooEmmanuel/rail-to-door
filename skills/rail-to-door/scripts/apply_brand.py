#!/usr/bin/env python3
"""Re-brand a rail-to-door site in place.

    python3 apply_brand.py <site_dir> <new_brand.json>

<site_dir>/brand.json records what the site currently says; <new_brand.json> holds the values
you want (any subset of the keys). Each changed value is swapped everywhere it appears in the
site's own HTML / CSS / JS (vendor code and product data are left alone), then brand.json is
updated, so the script can be run again later with different values.

Keys: name, domain, tagline, originCity, originCountry, originCode, originLon, originLat,
      airport, orderPrefix, flightNo, registration, logo,
      ink, paper, inkSoft, muted, line, wash, accent          (page colours)
      boxBoard, boxPrint                                      (packaging colours)
      truckBody, truckCab, planeBody, liveryDark (tail fin, stripes), doorColor (house door),
      conveyorFrame, beltColor                                (3D scene colours)
      container (tote | basket | cart | box), containerWord, itemWord
"""
import json, os, re, shutil, sys

def files(site):
    for root, dirs, fs in os.walk(site):
        dirs[:] = [d for d in dirs if d not in ('vendor', 'rail', 'node_modules', '.git')]
        for f in fs:
            if f.endswith(('.html', '.css', '.js')): yield os.path.join(root, f)

def word(s): return r'(?<![A-Za-z0-9])' + re.escape(s) + r'(?![A-Za-z0-9])'

def main():
    if len(sys.argv) != 3: sys.exit(__doc__)
    site, newp = os.path.abspath(sys.argv[1]), sys.argv[2]
    curp = os.path.join(site, 'brand.json'); cur = json.load(open(curp)); new = {**cur, **json.load(open(newp))}
    subs = []   # (regex, replacement), longest / most specific first
    def swap(key, variants=lambda v: [v], whole=True):
        if str(cur[key]) == str(new[key]): return
        for a, b in zip(variants(str(cur[key])), variants(str(new[key]))):
            if a and a != b: subs.append((word(a) if whole else re.escape(a), b))
    swap('tagline', lambda v: [v, v.title(), v.lower()], whole=False)
    swap('airport', whole=False)
    swap('registration'); swap('flightNo', whole=False); swap('domain', lambda v: [v, v.upper()], whole=False)
    swap('originCity', lambda v: [v, v.upper()]); swap('originCountry'); swap('originCode')
    swap('name', lambda v: [v, v.upper()]); swap('orderPrefix')
    for k in ('ink', 'boxBoard', 'boxPrint', 'truckBody', 'truckCab', 'planeBody', 'liveryDark', 'doorColor', 'conveyorFrame', 'beltColor'):
        if k not in cur or k not in new: continue
        swap(k, lambda v: [v, v.upper(), v.lower(), '0x' + v[1:], '0x' + v[1:].upper(), '0x' + v[1:].lower()], whole=False)
    CSSVARS = {'paper': '--paper', 'ink': '--ink', 'inkSoft': '--ink-soft', 'muted': '--muted', 'line': '--line', 'wash': '--wash', 'accent': '--acc'}
    WORDS = {'tote': 'bag', 'basket': 'basket', 'cart': 'cart', 'box': 'box'}
    if new.get('container') not in WORDS: sys.exit('container must be one of: ' + ', '.join(WORDS))
    if 'containerWord' not in json.load(open(newp)) and new['container'] != cur.get('container'): new['containerWord'] = WORDS[new['container']]
    changed = 0
    for path in files(site):
        s = t = open(path, encoding='utf-8').read()
        for rx, rep in subs: t = re.sub(rx, lambda m, rep=rep: rep, t)
        if path.endswith('data.js') and (cur['originLon'], cur['originLat']) != (new['originLon'], new['originLat']):
            t = re.sub(r"(export const ORIGIN = \{[^}]*?lon:\s*)-?[\d.]+(,\s*lat:\s*)-?[\d.]+", lambda m: f"{m.group(1)}{new['originLon']}{m.group(2)}{new['originLat']}", t)
        if path.endswith('data.js'):
            t = re.sub(r"export const CONFIG = \{.*?\};", lambda m: "export const CONFIG = { container: { kind: %s, word: %s }, itemWord: %s };" % tuple(json.dumps(new[k]) for k in ('container', 'containerWord', 'itemWord')), t, count=1)
        if path.endswith('style.css'):
            for k, var in CSSVARS.items():
                if k in new: t = re.sub(r'(%s:)\s*#[0-9A-Fa-f]{3,8}' % re.escape(var), lambda m, k=k: m.group(1) + new[k], t, count=1)
        if t != s: open(path, 'w', encoding='utf-8').write(t); changed += 1
    logo = new.get('logo')
    if logo and os.path.abspath(os.path.join(site, logo)) != os.path.abspath(os.path.join(site, 'assets/logo.png')) and os.path.exists(logo):
        shutil.copy(logo, os.path.join(site, 'assets/logo.png')); new['logo'] = 'assets/logo.png'; print('Logo replaced (use a dark mark on a transparent PNG; it is tinted in code).')
    json.dump(new, open(curp, 'w'), indent=2)
    print(f'Brand applied: {len(subs)} substitutions across {changed} files.')

if __name__ == '__main__': main()
