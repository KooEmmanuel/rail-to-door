---
name: rail-to-door
description: "Build a complete animated storefront for any brand, from nothing: AI-generated product cut-outs (Higgsfield) displayed on a rail that turn to face you, drag-and-drop into a bag / basket / cart / box, a drawer and demo checkout, then a scroll-driven 3D film of the order being packed in branded packaging, sorted on a conveyor, driven in a delivery truck, flown on a cargo plane across a real world map and delivered to a doorstep. Every part takes the brand's own name, logo, colours and choices. Use whenever the user wants this kind of store or any part of it — \"build me a store where you drag clothes into a bag\", \"generate the products with Higgsfield\", \"hang them on a rail\", \"the delivery / shipping animation\", \"the truck, plane, conveyor or house scene\", \"make this for my brand\" — or runs /rail-to-door (full pipeline) or a stage (/rail-to-door-brand, -products, -rail, -checkout, -journey, -verify). Works with a detailed prompt, a one-line prompt, or no prompt at all."
---

# Rail to door

A single-page store that turns buying into a little film:

1. **The display** — product cut-outs hang side-on on a rail and turn to face you on hover; click for a front/back viewer; drag one into the container.
2. **Container and checkout** — a bag (or basket, cart, box) that fills up, a drawer to edit the order, a demo payment screen.
3. **The order journey** — after paying, a scroll-driven, self-playing 3D sequence: the items are packed into branded packaging → sealed and labelled with the customer's name → conveyor and scan gate → delivery truck → airport loader → cargo plane → a real-coastline world map with the flight → the parcel lands on a doorstep.

## This skill is self-contained

Everything needed is inside the skill folder. You do **not** need, and must not go looking for, an existing site, a previous project, or anyone's brand files:

- `assets/template/` — the complete working site (plain HTML/CSS/ES modules + three.js, no build step) carrying a neutral placeholder brand ("Maison") and six sample shirts. It is the starting point for every run.
- `scripts/` — create a site, apply a brand, make a stand-in logo, process product images, health-check.
- `references/` — one guide per stage.

**Always start a new site from the template and change it; never rewrite it from scratch.** The template embodies a lot of hard-won visual decisions (lighting, proportions, detail), and rebuilding loses them. The placeholder brand must never reach the user: every run replaces it with their brand, or with one you design.

## How to run: full pipeline or one stage

The first word of the arguments picks a stage. With no stage word, run the full pipeline.

| Invocation | What it does | Guide |
|---|---|---|
| `/rail-to-door [prompt]` | Everything below, in order | this file, then each guide as you reach it |
| `/rail-to-door-brand` · `… brand …` | Write the brief, create the site, apply name, logo, colours, origin, container, vehicle colours | `references/brand.md` |
| `/rail-to-door-products` · `… products …` | Generate product images with Higgsfield, cut them out, write the catalogue | `references/products.md` |
| `/rail-to-door-rail` · `… rail …` | The shop page: display, hover-turn, viewer, drag to the container | `references/rail.md` |
| `/rail-to-door-checkout` · `… checkout …` | Drawer, totals, payment screen | `references/checkout.md` |
| `/rail-to-door-journey` · `… journey …` | The 3D journey: packaging, conveyor, truck, plane, map, house | `references/journey.md` |
| `/rail-to-door-verify` · `… verify …` | Serve it, run the whole flow in a browser, look at every scene | `references/verify.md` |

**Which site a stage works on:** the folder the user names; otherwise the current directory if it is a rail-to-door site (it has `brand.json` next to `index.html`); otherwise a new one created from the template at `./<brand-slug>-store`. Do not search the machine for one.

## The brief: every part is a choice

Before building, settle the brief. Read it out of the prompt; where the prompt is silent, **decide it yourself** in a way that suits the brand, and list your decisions in the final report. Ask a question only when a wrong guess would waste real money or work (see "When to ask").

| Slot | Built in | How it changes |
|---|---|---|
| Brand name, domain, tagline | — | `brand.json` keys → `apply_brand.py` |
| Logo | — | user's file · generated with Higgsfield · `make_logo.py` monogram stand-in |
| Page colours (paper, ink, soft ink, muted, line, wash, accent) | warm white + near-black | `brand.json` |
| Typeface | Fraunces + Inter | manual, see `brand.md` |
| What is sold, and how many | six shirts (placeholder) | products stage |
| Display | hanging rail, side-on → front on hover | rail stage (shelf / peg variants are an edit, see `rail.md`) |
| Container | `tote` (bag) · `basket` · `cart` · `box` | `brand.json` `container`, plus the word used for it |
| Packaging | printed mailer box, paper tape, label | `boxBoard`, `boxPrint`; redesign in `journey.md` |
| Sorting | conveyor with scan gate | `conveyorFrame`, `beltColor`; redesign in `journey.md` |
| Ground leg | cab-over box truck | `truckBody`, `truckCab`; other vehicles in `journey.md` |
| Long leg | cargo aircraft + world map | `planeBody`, `liveryDark`; road-only or sea in `journey.md` |
| Destination | brick house, panelled door | `doorColor`; other buildings in `journey.md` |
| Origin city / airport, destination cities | Lisbon (placeholder) | `brand.json`, `CITIES` in `js/data.js` |
| Captions and copy | generic | `index.html` |

The built-in pieces are a strong default, not a limit. If the brief calls for something that is not built in (a scooter courier, a ship, a market stall instead of a rail, a gift box as the cart), build it in the same style and to the same standard — the stage guides say how.

### With a prompt, with a link, with nothing

- **A prompt** — follow it. Whatever it leaves out, decide.
- **A link to a site the user likes** (only when they give one — never go looking for one, and never assume one): study it for *feel* — palette, typography mood, tone of voice, what they sell and how it is photographed — and design something original in that spirit. Do not copy its name, logo, images, text or layout. See `brand.md`.
- **No prompt at all** — design a brand yourself: a name, a one-line positioning, a palette, an origin city, a small collection that fits it. Then run the pipeline. Present the brand you invented at the top of the report so the user can redirect.

### When to ask

One question, at most, before work starts — and only for these:

- **Spending Higgsfield credits.** Always preflight the cost and get a clear yes (see `products.md`). Bundle "here is the collection and the brand I will build, it costs N credits — go?" into that single question.
- The user's own brand is clearly intended but its name was not given.

Everything else: decide, build, report.

## Full pipeline

1. **Brief + brand** — `references/brand.md`. Ends with a site folder carrying the brand everywhere.
2. **Products** — `references/products.md`. Generate (after the go-ahead), cut out, catalogue. If the user declines the spend or Higgsfield is unavailable, use their own photos; failing that keep the sample shirts and say plainly that they are placeholders.
3. **Display** — `references/rail.md`: copy, sizing, the container.
4. **Checkout** — `references/checkout.md`.
5. **Journey** — `references/journey.md`: confirm every scene carries the brand; make the changes the brief calls for.
6. **Verify** — `python3 scripts/check_site.py <site>`, then the browser run in `references/verify.md`. Do not skip it: most defects in this kind of build are only visible in a screenshot.
7. **Report** — where the site is and how to open it; the brief as built (including what you decided); what is placeholder (names, prices, a stand-in logo, the demo payment); credits spent; what you did not check.

## Where things live in a site

```
index.html          all markup: display, container, viewer, drawer, payment, journey captions, HUD
css/style.css       every style; brand tokens are the :root variables at the top
js/data.js          PRODUCTS (generated), CONFIG (container + wording), ORIGIN, CITIES
js/shop.js          display, hover-turn, drag, viewer, cart, drawer, demo payment
js/main.js          switches shop ↔ journey, self-play (SECONDS = length of the play-through)
js/journey.js       the four 3D worlds, cameras, the scroll timeline
js/models.js        the truck and the aircraft
js/parcels.js       the box (flaps, tape, label) and the closed parcels
js/textures.js      everything painted on canvases: box art, label, tape, truck side, sign, belt, doormat
js/world.js         real coastlines → dot map, great-circle route
assets/logo.png     dark mark on transparent; tinted in code wherever it appears
assets/rail/        product cut-outs:  <slug>-front.webp, -back.webp, -side.webp
vendor/             three.js, lighting helpers, coastline data
brand.json          what the site currently says; edited by scripts/apply_brand.py
serve.py            tiny static server:  python3 serve.py 8792
```

## Quality bar (non-negotiable, whatever the brand)

- **Real cut-outs, side-on.** Products hang thin at rest and turn to the front on hover. Flat front-facing pictures in a row do not deliver the effect.
- **One palette.** The page, the packaging, the conveyor, the vehicles and the route all use the brand's colours. Do not introduce a colour the brand does not have; vehicle lamps are the only exception.
- **Nothing toy-like.** Vehicles, machines and buildings are modelled from their real parts — glass that reads as glass, lamps, grilles, wheels with rims, door hardware — not boxes with cylinders. See the trim rule in `journey.md`.
- **The brand's own mark and typeface on everything printed** (packaging, tape, label, truck, tail fin, doormat). Long names must fit: the template shrinks text to fit; check it did.
- **The payment screen is a demo.** It collects no card details and charges nothing. Keep it that way unless the user explicitly asks to connect a real payment provider, and never ask for or handle real card numbers.
- **Verify by looking.** Code that passes a syntax check can still render wrongly.
- **Say what is placeholder or unverified.**

## Scripts

| Script | Use |
|---|---|
| `scripts/new_site.py <site> [--brand b.json] [--force]` | Copy the template to a new folder (and apply a brand) |
| `scripts/apply_brand.py <site> <b.json>` | Apply / change brand values across the site (re-runnable) |
| `scripts/make_logo.py "<Name>" <out.png>` | Monogram stand-in when there is no logo |
| `scripts/process_cutouts.py --raw <dir> --site <site> [--synth-side] [--append]` | Cut out, trim, resize product images; rewrite the catalogue |
| `scripts/check_site.py <site>` | Static health check before the browser run |

`process_cutouts.py` and `make_logo.py` need Pillow; the former also numpy, opencv-python and scipy (`pip install pillow numpy opencv-python scipy`).
