# rail-to-door

A Claude Code skill that builds a complete animated storefront for any brand.

You give it a brand. It gives you a store where:

- products hang side-on on a rail and turn to face you when you hover,
- you drag them into a bag (or a basket, cart or box),
- you check out on a demo payment screen,
- and then a 3D film plays of your order being packed in branded packaging, sent down a conveyor, driven to the airport, flown across a real world map and left on your doorstep.

Every part takes the brand's own name, logo and colours.

![The rail](screenshots/01_rail_suit_turned.jpg)
![The delivery van](screenshots/04_delivery_van.jpg)
![The cargo plane](screenshots/07_full_plane_with_van.jpg)

See a finished store made with it: [custom-suit-studio](https://github.com/KooEmmanuel/custom-suit-studio).

## Extras: two ways to buy, live colour and cloth, order tracking

Optional add-ons for stores that sell more than one way (`/rail-to-door-extras`):

- **Ready to wear or made to measure.** The viewer walks through numbered steps: *type → colour → size* for pieces already made, or *type → cloth → body measurements* for pieces made to order. Measurements are checked and remembered. A mixed bag works.
- **The picture changes with the choice.** Pick a colour or a cloth and the product photo repaints in the browser, keeping its folds and shadows, with no extra images or credits. `scripts/make_masks.py` keeps the hanger out of it.
- **The cloth.** A section of drawn cloth swatches (twill, flannel, chalk stripe, sharkskin, glen check, linen, drill, mohair, barathea, velvet), each with composition, weight, season and price.
- **Order tracking.** "Track order" with the order number and email, or a `?track=` link. The film plays up to where the order really is and stops on a live status card. Ready-to-wear orders start at packing; made-to-measure orders start at the tailor's table.
- **A staff admin page** to move orders through their stages; the customer's tracking moves on live.
- **The workshop film**: measured, cut, sewn, fitted and pressed, in the customer's own cloth, before the box.
- **Collections and currencies**: a category filter on the rail, and prices in several currencies.

![Ready to wear: choose a colour](screenshots/08_ready_to_wear_colour.jpg)
![Made to measure: choose a cloth, give your measurements](screenshots/09_made_to_measure_cloth.jpg)
![The workshop film](screenshots/10_workshop_cut.jpg)
![Tracking stops where the order really is](screenshots/11_tracking.jpg)
![The atelier admin](screenshots/12_atelier_admin.jpg)

A complete store using all of them is in [`examples/suit-atelier`](examples/suit-atelier). Run it with `python3 serve.py 8793` inside that folder. The guide is [`skills/rail-to-door/references/extensions.md`](skills/rail-to-door/references/extensions.md).

## Install

Copy the eight skill folders into your Claude Code skills folder:

```bash
git clone https://github.com/KooEmmanuel/rail-to-door.git
cp -R rail-to-door/skills/* ~/.claude/skills/
```

The stage skills read the main skill from `~/.claude/skills/rail-to-door`, so keep that path.

## Use

In Claude Code:

```
/rail-to-door Build a men's made-to-measure suit store called Custom Suit Studio. Dark green and black. Ships from Accra.
```

A one-line prompt works, and so does no prompt at all; the skill decides anything you leave out and tells you what it chose.

You can also run one stage at a time:

| Command | What it does |
|---|---|
| `/rail-to-door` | The whole pipeline |
| `/rail-to-door-brand` | Name, logo, colours, origin city, bag / basket / cart / box |
| `/rail-to-door-products` | Product images with Higgsfield, cut out and catalogued |
| `/rail-to-door-rail` | The shop page: rail, hover-turn, viewer, drag to the bag |
| `/rail-to-door-checkout` | Order drawer, totals, demo payment screen |
| `/rail-to-door-journey` | The 3D film: box, conveyor, van, plane, map, doorstep |
| `/rail-to-door-verify` | Runs the whole flow in a browser and checks every scene |
| `/rail-to-door-extras` | Ready to wear + made to measure, colour / cloth repaint, order tracking + admin, workshop film, collections, currencies |

## What you need

- Claude Code
- Python 3 with Pillow, NumPy, SciPy and OpenCV (for logos and product cut-outs): `pip install pillow numpy scipy opencv-python`
- Optional: the Higgsfield connector, to generate product images. Without it, give the skill your own product photos. It shows the credit cost and waits for your yes before generating anything.

The site itself is plain HTML, CSS and JavaScript with three.js. There is no build step. Run it with `python3 serve.py` inside the generated folder.

The payment screen is a demo; no card details are taken.

## Licence

Apache 2.0. The bundled three.js (r160) is MIT-licensed, © three.js authors. The world map uses Natural Earth data (public domain).
