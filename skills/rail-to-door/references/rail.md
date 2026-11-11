# Stage: the rail (shop page)

Goal: the first screen. A metal rail drawn in CSS, cut-out garments hooked under it, a tote in the corner. Files: `index.html` (the `<main class="shop">` block and the `.focus` viewer), `css/style.css` (section "SHOP — the rail"), `js/shop.js`.

## How it works

- **One piece = `.piece`** with two stacked faces: `.face.side` (visible at rest) and `.face.front` (hidden, rotated −80°). Adding `.facing` (on hover / focus) widens the piece from 90 px to `calc(var(--fh) * .7)`, rotates the side away to +80° while fading it, and rotates the front in. The neighbours close up (`.pieces:has(.facing) .piece:not(.facing)`), so the row keeps its length.
- **`--fh`** on `.rail` is the garment height: `clamp(300px, 47vh, 430px)`. Everything else is derived from it. Change this one value to make garments bigger or smaller.
- **Price tag** `.tag` hangs near the hook, tilted −6°. **Label** `.label` (name + "drag to bag") appears under the facing piece.
- **Click** (no movement) opens the **viewer** (`.focus`): a card with the front and back images back-to-back; drag or use the Front/Back tabs to turn it (snaps to 180° steps); size buttons; "Add to bag" flies the garment to the tote.
- **Drag** (movement > 8 px with a mouse): a ghost of the *front* image follows the pointer, tilting with its speed; the tote grows (`.hot`) when the pointer is within 80 px of it. Released over the tote → the ghost shrinks into the bag, the bag "gulps", the count bumps, the piece on the rail swings. Released anywhere else → it springs back to its place on the rail.
- **Touch**: first tap turns the piece, second tap opens the viewer; adding happens in the viewer (dragging is mouse-only so the page can still scroll).
- Dragging adds the default size (M if the piece has it, else its first size); the size can be changed in the bag drawer.
- The **tote** shows up to three garment images peeking out of its mouth and a count badge; "Continue to bag" appears once it holds something.

## The container (bag, basket, cart, box)

`CONFIG.container` in `js/data.js` (set through `brand.json` → `apply_brand.py`) picks what the shopper fills:

| `kind` | Looks like | Default word |
|---|---|---|
| `tote` | paper carrier bag with rope handles, logo on the front | bag |
| `basket` | woven basket with a hoop handle | basket |
| `cart` | wire shopping trolley on wheels | cart |
| `box` | open-top box in the packaging colours | box |

All four use the same element (`#tote`): products peek out of the top, the count badge sits on the corner, it grows when a product is dragged near and "gulps" on drop. The drawings are the `body[data-container=…]` rules in `css/style.css`. The word (`CONFIG.container.word`) and the product word (`CONFIG.itemWord`) fill every `.cw` / `.iw` span and the script-generated text, so the copy always matches.

For a container that is not built in (a suitcase, a gift bag, a crate): add a `kind`, draw it with the same three parts (`.tote-handles` SVG if it has a handle, `.tote-body`, `.tote-fold`), keep `.tote-peek` and `.tote-badge` working, and use brand colours only.

## Display variants

- **Rail (built in)** — for anything that hangs.
- **Shelf** — for things that stand. Edit the CSS: move `.bar` to the bottom of `.rail` and make it a ledge (taller, with a soft shadow under it); anchor `.piece .face` to the bottom (`top:auto; bottom:<ledge height>; align-items:flex-end; transform-origin:50% 100%`); let images keep their own proportions (`height:auto; max-height:100%`); move `.tag` to sit beside the product. Keep the side → front turn on hover.
- **Pegs / hooks** — as the rail, with a short peg drawn above each piece instead of one long bar.

Whatever the display, the interaction stays the same: side view at rest, front on hover, click for the viewer, drag to the container.

## Things to adjust on request

| Request | Where |
|---|---|
| Headline / eyebrow / helper copy | `index.html`, inside `.shell` |
| Garment size | `--fh` in `.rail` (`css/style.css`) |
| Spacing between pieces | `.piece { margin }` and `.piece.facing { margin }` |
| Rail colour / thickness | `.bar` gradient and height |
| Turn speed | the `.85s var(--ease)` transitions on `.piece` and `.face` |
| Where the container sits | `.bag-zone` (fixed, bottom-right). It must not cover the garments at 1440×900 |
| How close counts as "over the container" | `overBag()` margin `m` in `js/shop.js` |
| More than ~10 pieces | allow the row to scroll: move the `overflow-x:auto; justify-content:flex-start` rules from the mobile media query to the base `.pieces` rule |

## Rules

- Keep the garments as the hero: white page, no cards or boxes around them, soft drop shadow only.
- Side views must stay narrow. If a piece looks wide at rest, its side image is wrong (see `products.md`), not the CSS.
- Do not replace the hover-turn with a flat grid, a carousel, or front-facing images on a rod — that loses the effect this store is built around.
- Every interactive thing needs a non-drag route (click → viewer → Add to bag) for keyboard and touch users.

## Check

Hover each piece (it turns, neighbours close up, label shows). Click one (viewer opens, Back tab turns it, sizes select, Add to bag works). Drag one into the tote (count goes up, peek image appears) and drag one to empty space (springs back, count unchanged). See `verify.md` for the exact browser steps.
