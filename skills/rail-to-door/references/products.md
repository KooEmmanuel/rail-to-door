# Stage: products (Higgsfield → cut-outs → catalogue)

Goal: every product on the display has three transparent cut-outs — **front**, **back**, **side** — plus a catalogue entry. The examples below are for clothing on hangers (what the rail was designed around); the same flow works for anything that can hang or stand — bags, shoes, hats, bottles — see "Products that are not clothing". The rail effect depends on the side view: at rest a piece hangs edge-on, "thin as a book"; on hover the front fades in as it turns.

## What good input looks like

- The garment **alone on a hanger**: no person, no mannequin, no props, no floor.
- The **hanger hook at the top centre**, fully inside the frame (the hook is what meets the rail).
- Flat, even studio light, **transparent background** (or a plain white backdrop if the model cannot do transparency), garment filling most of the height.
- The three views are **the same garment** — same fabric, colour, buttons, print.

## 0. Before spending anything

1. The Higgsfield tools are an MCP connector; their names look like `mcp__<id>__generate_image`. If they are listed as deferred, load them first with ToolSearch: `generate_image`, `generate_image_batch`, `remove_background`, `jobs_wait`, `models_explore`, `media_upload`, `media_confirm`, `balance`.
2. If the connector is missing or fails to connect, say so and stop the *generation* part. Offer the fallbacks: the user's own product photos (section 5); or, as a last resort, leaving the template's six sample shirts in place — clearly labelled as placeholders that are not the brand's products.
3. Decide the collection. From the prompt if given; otherwise design a coherent collection of 8 products that fits the brief from the brand stage (a sensible mix, colours that work together and with the brand palette) and show the list — name, one-line description, price — before generating. Names and prices you invent are placeholders; say so.
4. **Cost:** call `generate_image` once with `get_cost: true` (same model and settings) for one image, multiply by pieces × 3 views, read `balance`, and ask the user for one clear go-ahead that states the total. Do not pass `use_unlim` unless the user asks to use unlimited generations; if the tool answers with an `unlim_choice` question, put that question to the user.

## 1. Model and parameters

Proven settings (a full front/back/side set came out right first time with these):

```json
{ "model": "gpt_image_2_6", "quality": "medium", "background": "transparent", "use_unlim": false,
  "aspect_ratio": "3:4" }
```

- `background: "transparent"` makes the model return a ready cut-out PNG — **no separate background-removal step is needed**. Keep "Transparent background" in the prompt as well.
- `aspect_ratio`: `3:4` for front and back, `9:16` for the side (it is a tall, narrow shape).
- `quality: "medium"` was enough at the default 1k resolution; the rail shows garments about 430 px tall. Raise it only if the user asks for a bigger viewer.
- The reference role for this model is **`image_references`**: `"medias": [{ "value": "<front job id>", "role": "image_references" }]`. A finished generation's job id works as the value.
- Cost seen with these settings: **0.5 credits per image**, so about 1.5 credits per garment. Prices change — still preflight with `get_cost: true`.
- If the user names another model, call `models_explore` with `action: "get"` for it and read its `aspect_ratios`, `parameters` (does it have a transparent background option?) and `medias[].roles` before generating.

## 2. Generate — front first, then back and side from it

Generating the front first and feeding it back as the reference is what keeps the three views consistent.

**Front** (one per piece; these are independent prompts, so use `generate_image_batch` for 2–12 at a time, or `generate_image` one by one):

```
Studio product photograph of a single garment hanging on a plain natural-wood clothes hanger with a
slim metal hook: {GARMENT — type, fabric, colour, pattern, collar, sleeves, pockets, buttons, fit}.
Front view, perfectly straight-on, garment hanging naturally and symmetrical, sleeves relaxed at its sides.
The hanger hook is at the top centre of the frame and fully visible; the whole garment is in frame with
a little margin. Transparent background, soft even lighting, no shadows.
No person, no mannequin, no body, no hands, no props, no text, no logo watermark.
```

**Back** (reference = that piece's front):

```
The exact same garment as the reference image, on the same wooden hanger, now seen from directly behind
(back view): same fabric, colour, pattern, length and details; show the back yoke, collar back and any
back print. Same framing with the hanger hook at the top centre, transparent background, soft even lighting,
no shadows. No person, no mannequin, no props, no text.
```

**Side** (reference = that piece's front):

```
The exact same garment as the reference image, on the same wooden hanger, now seen exactly side-on
(a 90-degree profile view), hanging naturally so it appears as a narrow vertical shape — you see the
sleeve and the edge of the body, not the front. The hanger is seen end-on with its hook at the top centre.
Transparent background, soft even lighting, no shadows. Tall, narrow composition. No person, no mannequin,
no props, no text.
```

Poll with `jobs_wait` (up to 12 jobs per call; when `all_terminal` is false wait `poll_after_seconds` and call again). Do not resubmit on a timeout — reuse the job ids.

## 3. Look at every image before going on

Download each result URL and open it (Read the file). Reject and regenerate (at most twice per image, then ask) when:

- there is a person, mannequin, hands or a second garment;
- the hanger or hook is missing or cut off, or the garment is cropped;
- the back or side is a different garment from the front (colour, print, length);
- the "side" is really a three-quarter or front view — it must read as a narrow profile.

The side view usually works first time with the prompt above. If one will not come out right after two tries, keep the front and back and let the script build the side (`--synth-side`): it is a narrow, shaded copy of the front and looks correct on the rail.

## 4. Cut out, name, process

1. Download each kept image with `curl -sL -o <file> <result_url>` and confirm it really is transparent (roughly 40% transparent pixels for a front view, 85% for a side view). If one came back on a solid backdrop, call `remove_background` with `{ media_id: <job_id>, media_type: "image" }`, wait for it and download that instead. (The script can key a plain backdrop itself, but white or very pale garments need the tool.)
2. Save into a raw folder (the session scratchpad is fine) as `<slug>-front.png`, `<slug>-back.png`, `<slug>-side.png`. Slug = lowercase-hyphenated product name.
3. Write `catalog.json` in the same folder — the order here is the order on the rail:

```json
[
  {"id": "bowling-shirt-olive-and-bone", "name": "Bowling Shirt · Olive & Bone", "price": 56, "cat": "Shirts", "sizes": ["S", "M", "L", "XL"]}
]
```

4. Run:

```bash
python3 <skill>/scripts/process_cutouts.py --raw <raw_dir> --site <site_dir>            # replace the catalogue
python3 <skill>/scripts/process_cutouts.py --raw <raw_dir> --site <site_dir> --append   # add to it
```

It trims each image to the garment, resizes to 1000 px tall, writes WebP into `assets/rail/`, measures each piece's dominant colour (the folded garment in the packing scene uses it) and rewrites `PRODUCTS` in `js/data.js`. Read its warnings: a "backdrop removal looks wrong" warning means that image needs `remove_background`.

Arrange the catalogue so neighbouring pieces contrast (light next to dark), and keep it to 6–10 pieces — more than that and the rail scrolls sideways.

## 5. When the user brings their own photos

- Already transparent cut-outs on hangers → name them and run the script directly.
- Photos on a plain backdrop → run the script; it keys the backdrop. Check the result; send any failures through `remove_background`.
- Photos on a model or mannequin, or only a front view → upload the photo (`media_upload` → `curl -X PUT` the bytes to the returned `upload_url` → `media_confirm`), then use it as the reference with the three prompts above, replacing "the same garment as the reference image" with "the garment worn in the reference image, now …". This also spends credits — same go-ahead rule.
- No side views and no budget to generate → `--synth-side`.

## Products that are not clothing

- **Things that hang** (bags, scarves, hats on hooks): same prompts, replacing the hanger with "hanging from a slim metal hook at the top centre". Keep the hook in frame — it is what meets the rail.
- **Things that stand** (shoes, bottles, boxes, ceramics): prompt for the object "standing upright on an invisible surface, shot straight-on at product height", with front, back and true side views. Use the shelf variant of the display (`rail.md`) so they sit on a ledge instead of hanging.
- Set `itemWord` in the brand file ("pair", "bottle", "item") so the page copy matches.
- The packing scene shows each product as a folded bundle in its dominant colour. For rigid products change that shape in `js/journey.js` (see `journey.md`, "Common requests").

## 6. Check

```bash
python3 <skill>/scripts/check_site.py <site_dir>
```

Then on the page: every piece hangs from the rail by its hook, side views are narrow and roughly the same height, hover turns each to a matching front, the viewer's Back tab shows the back, and the price tags read correctly. Heights differing a lot between pieces usually means one image kept a stray speck far from the garment — re-cut that one.
