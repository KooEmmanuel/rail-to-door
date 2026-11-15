---
name: rail-to-door-extras
description: "Add-ons for a rail-to-door store, run on their own: ready-to-wear vs made-to-measure buying (type → colour → size, or type → cloth → body measurements), repainting the product photo in the chosen colour or cloth, collections / category filter, multi-currency prices, order tracking with a live status and a demo staff admin, and a workshop film (measured, cut, sewn, fitted, pressed) before the packing. Use for /rail-to-door-extras, \"let customers pick a colour / fabric\", \"made to measure\", \"take measurements\", \"track my order\", \"admin page\", \"categories\", \"multiple currencies\", \"show it being made\"."
---

# Rail to door — extensions

This is one stage of the `rail-to-door` skill, run on its own.

1. Read `~/.claude/skills/rail-to-door/SKILL.md` for the ground rules and the site layout. Do **not** run the full pipeline.
2. Read `~/.claude/skills/rail-to-door/references/extensions.md`. Add only the extensions the user's brief asks for, wiring each in as the guide says. The modules are in `~/.claude/skills/rail-to-door/assets/extensions/`.
3. Which site: the folder the user names; otherwise the current directory if it is a rail-to-door site (it has `brand.json` next to `index.html`); otherwise create one with `python3 ~/.claude/skills/rail-to-door/scripts/new_site.py ./<brand-slug>-store` and run the brand stage first.
4. For the colour / cloth repaint, run `python3 ~/.claude/skills/rail-to-door/scripts/make_masks.py <site> preview.png` and look at the preview before going on.
5. Finish with the checks at the end of the guide and the browser run in `references/verify.md`, then report what was added, what is placeholder (colours, cloths, prices, fee, lead times, rates, browser-only orders) and what you did not check.
