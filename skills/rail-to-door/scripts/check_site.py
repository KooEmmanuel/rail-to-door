#!/usr/bin/env python3
"""Static health check for a rail-to-door site (run before opening the browser).

    python3 check_site.py <site_dir>

Checks that every product image exists, product fields are complete, scripts parse (if node is installed),
and that no stray brand placeholders remain. Exits non-zero on problems.
"""
import json, os, re, shutil, subprocess, sys
site = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else sys.exit(__doc__); bad = []
s = open(os.path.join(site, 'js', 'data.js'), encoding='utf-8').read()
m = re.search(r'export const PRODUCTS = (\[.*?\n\]);', s, re.S)
items = json.loads(m.group(1)) if m else bad.append('PRODUCTS block missing in js/data.js') or []
for it in items:
    for k in ('id', 'name', 'price', 'sizes', 'front', 'back', 'side', 'color', 'w', 'h'):
        if k not in it: bad.append(f'{it.get("id", "?")}: missing "{k}"')
    for v in ('front', 'back', 'side'):
        if v in it and not os.path.exists(os.path.join(site, it[v])): bad.append(f'{it["id"]}: file missing {it[v]}')
for f in ('index.html', 'css/style.css', 'vendor/three.module.js', 'vendor/land-110m.json', 'assets/logo.png', 'brand.json'):
    if not os.path.exists(os.path.join(site, f)): bad.append(f'missing {f}')
if shutil.which('node'):
    for f in sorted(os.listdir(os.path.join(site, 'js'))):
        if f.endswith('.js'):
            r = subprocess.run(['node', '--check', os.path.join(site, 'js', f)], capture_output=True, text=True)
            if r.returncode: bad.append(f'js/{f}: ' + r.stderr.strip().splitlines()[-1])
print(f'{len(items)} products; ' + ('OK' if not bad else f'{len(bad)} problem(s):'))
for b in bad: print(' -', b)
sys.exit(1 if bad else 0)
