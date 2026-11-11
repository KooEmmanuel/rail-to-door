#!/usr/bin/env python3
"""Start a new rail-to-door site from the bundled template.

    python3 new_site.py <target_dir> [--brand brand.json] [--force]

Copies assets/template (the complete working site) to <target_dir>. If --brand is given,
applies it straight away (see apply_brand.py). Prints the next commands to run.
"""
import argparse, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, '..', 'assets', 'template')

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('target'); ap.add_argument('--brand'); ap.add_argument('--force', action='store_true')
    a = ap.parse_args(); target = os.path.abspath(a.target)
    if os.path.exists(target) and os.listdir(target):
        if not a.force: sys.exit(f'{target} already exists and is not empty. Use --force to overwrite it, or pick another folder.')
        shutil.rmtree(target)
    shutil.copytree(TEMPLATE, target, ignore=shutil.ignore_patterns('.DS_Store'))
    print(f'Created {target}')
    if a.brand: subprocess.check_call([sys.executable, os.path.join(HERE, 'apply_brand.py'), target, a.brand])
    print(f'Serve it:   /usr/bin/python3 {target}/serve.py 8792     (then open http://localhost:8792)')

if __name__ == '__main__': main()
