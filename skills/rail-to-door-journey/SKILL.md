---
name: rail-to-door-journey
description: "Stage 5 of rail-to-door, run on its own: the scroll-driven 3D order film — items packed into branded packaging, tape and label, conveyor and scan gate, delivery truck, airport loader, cargo plane, real world map flight, doorstep delivery — in the brand's colours, with any part swappable (another vehicle, road-only, a different building). Use for /rail-to-door-journey, \"the delivery animation\", \"the 3D shipping scenes\", \"work on the truck / plane / box / conveyor / map / house\", \"add more detail\", timing, camera or caption changes."
---

# Rail to door — the 3D order journey only

This is one stage of the `rail-to-door` skill, run on its own.

1. Read `~/.claude/skills/rail-to-door/SKILL.md` for the ground rules, the defaults table and the site layout. Do **not** run the full pipeline.
2. Read `~/.claude/skills/rail-to-door/references/journey.md` and carry out that stage, using whatever the user wrote after the command as the brief. With no brief, use the defaults in the main skill.
3. Which site: the folder the user names; otherwise the current directory if it is a rail-to-door site (it has `brand.json` next to `index.html`); otherwise create a new one with `python3 ~/.claude/skills/rail-to-door/scripts/new_site.py ./<brand-slug>-store` and say so. Do not search the machine for a site, and never assume a particular brand — if the site still carries the template's placeholder brand, run the brand stage first.
4. Finish with the checks at the end of the stage guide and the journey table in verify.md, looking at the changed scene and its neighbours, then report what changed, what is placeholder, and what you did not check.

Scripts live in `~/.claude/skills/rail-to-door/scripts/`; the template is `~/.claude/skills/rail-to-door/assets/template/`.
