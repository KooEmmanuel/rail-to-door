# Stage: brief and brand

Goal: a new site folder that carries the brand — name, logo, colours, wording, origin — everywhere: page, container, packaging, tape, label, truck, aircraft, map, captions. Nothing of the template's placeholder brand ("Maison", Lisbon) may remain.

## 1. Write the brief

Fill every line. Take what the prompt gives; decide the rest so it suits the brand. Keep it short — it goes in your final report.

```
Brand        name · one-line positioning · domain (invent "<name>.example" if unknown)
Sells        what, to whom, price band · number of products (6–10)
Look         paper, ink, accent (+ optional soft ink, muted, line, wash) · typeface mood
Logo         user's file | generate | monogram stand-in
Container    tote | basket | cart | box, and the word for it ("bag", "basket", "cart", "box")
Item word    "piece", "item", "pair", "bottle" …
Packaging    board colour + print colour
Vehicles     truck body + cab colour · aircraft body + tail/stripe colour
Destination  door colour
Origin       city, country, airport name and IATA code, longitude / latitude
```

### If the user gave a link to a site they like

Only when they did. Open it (browser tools or a fetch), and note: dominant colours, type mood (serif / grotesque / mono, light / heavy), tone of voice, what is sold and how it is photographed, how much white space. Then design an **original** brand in that spirit — your own name unless the user gave one, your own palette near theirs but not sampled pixel-for-pixel, your own copy. Never reuse their name, logo, product images, text, or page structure, and never present the result as that brand. If the page cannot be opened, say so and continue from the prompt alone.

### If there is no prompt

Invent the brand: pick a clear point of view (e.g. "undyed linen basics from Porto", "loud streetwear from Seoul", "children's knitwear from Dublin"), a short name that is not an existing well-known brand, a palette of three colours, an origin city with a real airport. Vary your choices — do not reuse the placeholder or the same idea every time.

## 2. Create the site

```bash
python3 <skill>/scripts/new_site.py ./<brand-slug>-store
```

It refuses to overwrite a non-empty folder unless you pass `--force`.

## 3. Apply the brand

Write a JSON file with the keys below (any subset; unknown keys are ignored) and run:

```bash
python3 <skill>/scripts/apply_brand.py <site_dir> <brand.json>
```

It is re-runnable — it reads what the site currently says from `<site>/brand.json`.

| Key | Example | Drives |
|---|---|---|
| `name` | `Nova Supply` | header, container, packaging, tape, label, truck, aircraft, toast, page title (also UPPERCASE) |
| `domain` | `novasupply.co` | packaging side, truck side |
| `tagline` | `FROM THE RAIL TO YOUR DOOR` | truck side |
| `originCity`, `originCountry` | `Lagos`, `Nigeria` | captions, scan card, gate sign, packaging, map label |
| `originCode` | `LOS` | label, flight card, route (the airport's real IATA code) |
| `originLon`, `originLat` | `3.32`, `6.58` | where the flight starts on the map |
| `airport` | `Murtala Muhammed` | the "on the road" caption |
| `orderPrefix` | `NVA` | order numbers (`NVA-48213`) |
| `flightNo`, `registration` | `NV 88`, `5N-NVA` | flight card, aircraft tail (decorative) |
| `ink` | `#101B2E` | text, buttons, route line, logo tint, dark trim |
| `paper`, `inkSoft`, `muted`, `line`, `wash`, `accent` | hex | page background, secondary text, hairlines, panels, italic emphasis |
| `boxBoard`, `boxPrint` | `#101B2E`, `#DCE6FF` | packaging board colour; its print and the paper tape |
| `truckBody`, `truckCab` | hex | cargo body (and its side panel); cab |
| `planeBody`, `liveryDark` | hex | fuselage; tail fin and stripes |
| `doorColor` | hex | the front door in the delivery scene |
| `conveyorFrame`, `beltColor` | hex | conveyor frame; belt |
| `container` | `tote` `basket` `cart` `box` | what the shopper fills |
| `containerWord`, `itemWord` | `cart`, `item` | the words used in all page copy (defaults follow `container`) |
| `logo` | path to a PNG | every place the mark appears |

Colour guidance:
- Keep contrast: `ink` on `paper` must be clearly readable; `boxPrint` on `boxBoard` likewise. A dark board with light print is the safest packaging; a light board needs to be at least as dark as `#D8D2C6` to stand out on a pale page.
- Light vehicle bodies read best (panels, shadows and glass show). A strong brand colour works well on the **cab** and the **tail fin**; a fully dark truck loses its detail.
- Use the brand's accent sparingly on the page. The 3D scenes take their colour from the keys above — do not add colours the brand does not have.

## 4. Logo

The mark must be a **dark shape on a transparent PNG**, roughly square, 400 px or more. It is re-tinted in code (ink on the page, print colour on the packaging, white on the tail fin), so colour in the file is ignored.

In order of preference:
1. **The user's logo.** If it sits on a solid background, cut it out first (Higgsfield `remove_background`, or any tool that yields a transparent PNG). Pass its path as `logo`.
2. **Generate one** (with the same credit go-ahead as the products): `generate_image`, model `gpt_image_2_6`, `background: "transparent"`, `aspect_ratio: "1:1"`, prompt along the lines of: *"Minimal flat logo mark for a {positioning} brand called {Name}: a single solid black abstract symbol, bold simple geometry, no text, no letters, no gradients, centred, transparent background."* Look at it before using it; reject anything with text, detail too fine to read at 24 px, or a resemblance to a known brand's mark.
3. **Monogram stand-in:** `python3 <skill>/scripts/make_logo.py "<Name>" <site>/assets/logo.png` — initials in a ring. Tell the user it is a stand-in.

## 5. Copy

`apply_brand.py` does not rewrite marketing copy. Edit in `index.html`:
- the eyebrow above the rail (`New collection | Shirts and jackets`) and the headline,
- the seven journey captions (they mention "atelier", "van", "cargo flight" — adjust to how this brand really works),
- the curtain line and the delivered message.

Keep sentences short and concrete; write in the brand's voice from the brief.

## 6. Type beyond the defaults

To change typefaces: the Google Fonts `<link>` in `index.html`, `--serif` / `--sans` in `css/style.css`, the `serif()` / `sans()` helpers in `js/textures.js`, the font name in the aircraft wordmark in `js/models.js`, and the `document.fonts.load` list in `js/main.js` (canvas art is painted with the font, so it must load first). Request only weights the family really has, then confirm in the browser that headings and the packaging print use the new face.

## 7. Check

```bash
python3 <skill>/scripts/check_site.py <site_dir>
grep -rn "Maison\|Lisbon\|MSN" <site_dir>/index.html <site_dir>/js <site_dir>/css     # must print nothing
```

Then look at it (`verify.md`): header, container, packaging front and tape, label, truck side and cab, aircraft tail and wordmark, gate sign. Long names should fit without clipping.
