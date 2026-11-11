---
name: rail-to-door-products
description: "Stage 2 of rail-to-door, run on its own: generate product images with Higgsfield (front, back and side views with transparent backgrounds), check them, process them into display-ready cut-outs and write the product catalogue. Use for /rail-to-door-products, \"generate the clothes / products\", \"make new products with Higgsfield\", \"add these to the rail\", or when the user supplies product photos. Spends Higgsfield credits only after showing the cost and getting a yes."
---

# Rail to door — products only

This is one stage of the `rail-to-door` skill, run on its own.

1. Read `~/.claude/skills/rail-to-door/SKILL.md` for the ground rules, the defaults table and the site layout. Do **not** run the full pipeline.
2. Read `~/.claude/skills/rail-to-door/references/products.md` and carry out that stage, using whatever the user wrote after the command as the brief. With no brief, use the defaults in the main skill.
3. Which site: the folder the user names; otherwise the current directory if it is a rail-to-door site (it has `brand.json` next to `index.html`); otherwise create a new one with `python3 ~/.claude/skills/rail-to-door/scripts/new_site.py ./<brand-slug>-store` and say so. Do not search the machine for a site, and never assume a particular brand — if the site still carries the template's placeholder brand, run the brand stage first.
4. Finish with the checks at the end of the stage guide and a look at the rail (see verify.md), then report what changed, what is placeholder, and what you did not check.

Scripts live in `~/.claude/skills/rail-to-door/scripts/`; the template is `~/.claude/skills/rail-to-door/assets/template/`.
