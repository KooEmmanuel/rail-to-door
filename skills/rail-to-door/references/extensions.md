# Extensions: two ways to buy, colour and cloth repaint, try it on, order tracking, the workshop, currencies, collections

The template sells one way: pick a size, pay, watch the film. Real stores often need more. These extensions came out of a real build (a suit atelier), and they work together or one at a time. The modules are in `assets/extensions/`. A complete working site that uses all of them is in the repository's `examples/suit-atelier/`; read it when this guide is not enough.

Add an extension only when the brief calls for it. Each one says what it needs from the brief.

| Extension | Use when | Files |
|---|---|---|
| 1. Collections | the store has more than one product line (suits / vests / dinner …) | `data.js`, `shop.js`, `index.html`, css |
| 2. Currencies | customers pay in more than one currency, or not in the template's | `data.js`, `shop.js`, header |
| 3. Ready to wear + made to measure | some products are in stock and some are made for the customer | `fabrics.js`, `data.js`, `shop.js`, viewer markup |
| 4. Colour and cloth repaint | the customer chooses a colour or a material and should *see* it | `recolour.js`, `scripts/make_masks.py` |
| 5. Order tracking + admin | the customer should follow a real order after paying | `orders.js`, `admin.html`, `admin.js`, `main.js`, `journey.js` |
| 6. The workshop film | made-to-order goods: show the making before the packing | `workshop.js`, `journey.js` |
| 7. Try it on | clothing: the customer should see the garment on their own photo | `tryon.js`, `recolour.js`, viewer markup |

Copy a module with `cp ~/.claude/skills/rail-to-door/assets/extensions/js/<name>.js <site>/js/`. Then wire it in as below.

---

## 1. Collections (category filter)

- In `data.js`, give every product `cats: ['two-piece', 'wedding']` (it can sit in several), and export `CATEGORIES = [{ key, label, long, blurb }]` in filter order.
- In `index.html`, above the rail, add `<nav class="cats" id="cats"></nav><p class="cat-note" id="catNote"></p>`.
- In `shop.js`, build one button per category with its count. Filtering adds `.out` to pieces outside the category (they fold away; `tabIndex = -1`, `aria-hidden`). Write the choice to the URL hash (`#wedding`) so a collection can be linked. A chosen collection turns its first piece to face the viewer.
- Smaller items (waistcoats, ties) can hang shorter: give the product `scale: .47` and set `--s` on the piece.
- When the rail is wider than the screen, show left and right arrows (`.rail.scrolls`); hide them when it fits.

## 2. Currencies

- In `data.js`, store prices in one base currency and list the others with a rate and a rounding step:
  `CURRENCY = { base: 'USD', default: 'EUR', freeShippingOver, shipping, list: { EUR: { rate, step, locale, label }, … } }`.
- `conv(base) = round(base × rate / step) × step`; format with `Intl.NumberFormat(locale, { style: 'currency', maximumFractionDigits: 0 })`.
- Add a `<select id="curSel">` in the header. Remember the choice in `localStorage` (wrapped in try/catch), and re-render every price (rail tags, viewer, drawer, payment) when it changes.
- Each line total is the converted unit price × quantity, so the lines always add up to the total shown.
- Say in the report that the rates are placeholders unless the user supplied them.

## 3. Ready to wear and made to measure

Most stores keep stock *and* make to order. The viewer then offers two clear paths, each as numbered steps:

- **Ready to wear** (already made, hanging): **1 Type → 2 Colour → 3 Size.** Ships in days. No measurements.
- **Made to measure:** **1 Type → 2 Cloth → 3 Body measurements.** Made in weeks.

Data (`data.js`):

- `MTM = { fee, weeks, rtwDays }`: the making fee over the ready-to-wear price, and the lead times shown in the copy.
- `FABRICS = [{ key, name, comp, weight, season, color, weave, add }]`. `weave` is one of twill, flannel, stripe, sharkskin, check, linen, drill, mohair, barathea or velvet. `fabrics.js` draws each on a canvas, so no photos are needed; swap in real swatch photos when the brand has them.
- `COLOURS = { key: { name, hex } }` and a per-product list (`p.colours = ['navy', 'charcoal', …]`); the first colour is the one in the photo.
- `MEASURES = [{ key, label, min, max, def }]`: the body measurements to ask for. Keep `chest`, `waist` and `sleeve`, because the workshop film shows them.

Viewer (`index.html` + `shop.js`):

- A two-button `.buy-mode` switch sets `#focus[data-mode=rtw|mtm]`; `.rtw-only` and `.mtm-only` blocks show and hide with it.
- The steps go in an `<ol class="vsteps">`: type (from the product's categories), colour dots, sizes, cloth swatches with their composition and price, and a grid of measurement inputs.
- Validate the measurements (`checkValidity`, then `reportValidity` on the first bad one) before **Add to bag**. Remember them in `localStorage` for the next made-to-measure piece. Hide fields that do not apply (no inside leg for a waistcoat).
- A chip on the picture names the colour or cloth being shown.
- The price is `mtmPrice(p, fabKey) = p.price + MTM.fee + fabric.add`.

Cart and order:

- A cart line is `{ id, qty, size, col }` for ready to wear and `{ id, qty, fab, measure }` for made to measure. Merge two lines only if all of these match.
- The drawer and payment summary show "Ready to wear · Navy · 40R" or "Made to measure · Oxblood Velvet", with a thumbnail in that colour or cloth (see 4).
- When the bag holds a made-to-measure piece, checkout shows the measurements read-only and the made-to-measure lead time. A mixed bag is treated as made to measure, and the ready-made pieces travel with it.
- Each order item records `colour` or `fabric`, plus `measure`. The order gets `mtm: true|false`, which decides where the film and the tracking start (see 5 and 6).

Below the rail, a **cloth section** shows every cloth as a large pinked-edge card, with two small cards that spell out the two paths. Choosing a cloth there makes every piece open in made to measure with that cloth.

## 4. Colour and cloth repaint

The customer must see what they chose. `recolour.js` repaints the product photo in the browser, with no extra images and no credits:

```js
import { recolour } from './recolour.js';
const url = await recolour(p.front, { hex: '#1F2638' });                     // ready-to-wear colour: keeps the photo's own weave
const url2 = await recolour(p.front, { hex: f.color, fabric: f });            // a cloth: smooths the old weave, lays in the new one
```

- It keeps the photo's folds and shadows. Shadows scale down, and highlights lift toward white without burning out, so dark-to-light and light-to-dark both read naturally.
- It needs a **mask** per photo: `python3 scripts/make_masks.py <site> preview.png` writes `assets/rail/mask/<name>.png` for every front and back cut-out. The mask covers the garment and leaves out the hook and the wooden hanger. **Look at `preview.png`** (cloth tinted red): the hanger and hook must stay uncoloured. The script finds the hanger by its wood colour and its link to the hook, so a garment in a very similar honey-wood colour needs a check.
- Results are cached per photo, colour and cloth, and returned as object URLs. Keep only the latest request when the customer clicks quickly (a counter: paint only if `n === paintN`).
- Use the repainted picture everywhere the customer sees their choice: the viewer (front and back), the bag ghost when it zips, the drawer thumbnails and the payment summary.
- Limits: a strong pattern in the source photo (a chalk stripe) can leave a faint trace under a new cloth, and the weave is laid flat rather than following the folds. That is fine for choosing; say so in the report.

## 5. Order tracking and the atelier admin

- `orders.js` is the storage seam. It keeps orders in `localStorage` for the prototype. **Keep its exports** and replace their bodies with server calls to go live; nothing else changes.
- `STAGES` lists every stage with the film frame it starts on (`start`) and the frame the film rests on while the order sits there (`rest`). Stages flagged `mtm: true` are skipped for ready-to-wear orders. `firstStage(o)` and `stagesFor(o)` handle that.
- In `main.js`:
  - A **Track order** button opens a panel that asks for the order number and email; a wrong email is refused.
  - `?track=NO` deep-links straight to an order and skips the intro.
  - A tracking view shows the first name and initial and the city, **never the street**, because tracking links get forwarded.
  - The film plays only up to `STAGES[o.stage].rest`, then rests on a status card. `onOrdersChange` (the storage event) moves it on live when the admin advances the order in another tab.
- In `journey.js`, `initJourney({ …, limit })` returns `setLimit(l)`. The section height is cut down to the limit, and progress is clamped to it.
- `admin.html` + `admin.js` is a demo staff page:
  - Every order shows its type badge, items with colour or cloth swatches, measurements, a stage bar (only the stages that apply), "Move to next", "Open tracking", "Copy link" and "Remove".
  - It can create demo orders of both kinds.
  - Say clearly that live it needs a staff login and a server.
- After payment, save the order with `saveOrder` and offer "Track this order" on the thank-you card.

## 6. The workshop film (made to order)

`workshop.js` adds a world before the packing, at x = −400. It has five benches, each with its own caption and camera:

- **Measured**: a tape wraps a dress form, and the customer's numbers count up on a card.
- **Cut**: chalk traces a pattern on the cloth, then shears cut it.
- **Sewn**: the panel runs under a sewing-machine needle.
- **Fitted**: the jacket is pinned on the form.
- **Pressed**: an iron, with steam.

The cloth, the jacket and the pattern paper take the chosen cloth's colour and weave, and the order ticket carries the customer's name and order number.

- Wire it in `journey.js`:
  - `q` runs 0 → 1 over the whole film; the workshop owns 0 → `WQ` (.28).
  - The original film is remapped: `p = (q − WQ) / (1 − WQ)`.
  - Build the workshop only for `order.mtm`. A ready-to-wear order starts at `START = WQ`, goes straight to packing, has its workshop HUD steps hidden, and its captions are renumbered from 01.
- `WCUTS` are the quick cuts between benches; `WCAM` holds the camera keys.
- Workshop captions carry `data-q` (they are timed on `q`, not `p`), with a short fade window so they stay readable on the frames where tracking rests.
- The garment is a suit jacket. For other made-to-order goods (shoes, bags, furniture), keep the five-bench structure and the timing, and rebuild the benches for that craft to the same standard: real tools, real parts, nothing toy-like.

## 7. Try it on (virtual try-on)

The customer takes or uploads a photo and gets back a picture of themselves wearing the garment, in the colour or cloth they chose. `tryon.js` holds the whole feature; the panel's markup is the `#tryon` section of the example's `index.html`, and its styles are the "Try it on" block at the end of the example's `css/style.css`. Copy all three.

```js
import { initTryOn } from './tryon.js';
const tryOn = initTryOn();
tryOn.open({ product, picture: imgFront.src, whole: false, key: `${product.id}|c:${colour}`, label: 'Navy · ready to wear' }, openerButton);
```

- **The panel** is a fitting-room mirror beside the steps:
  - Take a photo (camera, mirrored, with a 3-second timer so the customer can step back) or upload one.
  - A **consent checkbox** that must be ticked before anything is sent.
  - A waiting state with the service's own progress (sending, queue position, working) and a seconds counter.
  - The result, with a "You / In the jacket" compare switch, Save picture, and Another photo.
  - Shape the mirror to the brand; the example uses an arch.
- **What is sent:** the photo fitted to 768×1024, and a garment picture built in the browser by `garmentBlob()`. That picture is the photo *as shown* (so a chosen colour or cloth carries through), with the hanger painted out using the extension-4 mask, cropped to the top garment where the photo also shows trousers (`whole: true` skips the crop, for waistcoats), on white.
- **Privacy:**
  - The photo lives in the page's memory for the visit and is never written to storage.
  - The consent line names the service the photo goes to.
  - Results are cached per photo and garment, so looking again costs nothing.
  - Closing the panel stops the camera and aborts a running request.
- **The service** is the one function `tryOnRequest()`, set up by `TRYON` in `data.js`:
  - *Prototype:* `TRYON.space` is a free public Hugging Face Space of the Leffa model (MIT licence), called straight from the browser over Gradio's queue API. It allows **about two try-ons per visitor per day** (the anonymous GPU quota) and takes 20–60 seconds. The quota error is caught and shown as "works again tomorrow". Use it to show the idea, not for a live store.
  - *Live:* set `TRYON.endpoint` to a route on the store's own server. It receives `person` and `garment` (multipart) and returns `{ "url": "…" }`. The server calls a paid try-on service with its secret key. **Never put a key or token in `data.js`**: everything there is public. Do not create accounts or keys for the user; tell them what is needed.
- **Limits to report:**
  - It is an AI preview of colour and style, not a fit check.
  - Only the top garment is put on; trousers are unchanged.
  - The garment covers roughly where the person's own top is, so a plain long-sleeved top gives the best picture.
  - The camera needs https on a live site.
- **Testing:**
  - The free quota is small, so test the flow with the service stubbed: intercept the Space's `/config`, `/upload`, `/queue/join`, `/queue/data` and `/file=` calls and answer with a saved result.
  - Spend at most one real call to confirm the live path.
  - Launch headless Chrome with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` to test the camera.
  - Never publish a test photo of a real person.

---

## Checks for any extension

- `python3 scripts/check_site.py <site>`
- In the browser, at 1440×900 and 390×844:
  - Both paths, end to end: a ready-to-wear piece in a non-photo colour, a made-to-measure piece in a cloth, and a mixed bag.
  - The picture changes for every colour and cloth.
  - Bad measurements are refused.
  - The film starts at packing for ready to wear and at the workshop for made to measure.
  - A tracking link stops at the right stage, and the admin moves it on live in another tab.
  - Try it on: camera and upload, consent required, the waiting state, the result and compare, the quota message, Escape closes only the panel.
  - No console errors, and no sideways scroll on the phone.
- Report placeholders: stock colours, cloths and their prices, the making fee, lead times, exchange rates, the fact that orders live in the browser until a server is connected, and that try-on runs on a free demo service with a small daily limit.
