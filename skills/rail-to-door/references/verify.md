# Stage: verify (serve it, run it, look at it)

Goal: prove the whole flow works by doing it in a browser and looking at every scene. Report what you saw; never ask the user to check for you.

## 1. Static check

```bash
python3 <skill>/scripts/check_site.py <site_dir>
```

Fix anything it reports first.

## 2. Serve it

The site is static but uses ES modules and `fetch`, so it must be served over http (opening `index.html` from disk will not work).

```bash
/usr/bin/python3 <site_dir>/serve.py 8792        # run in the background
```

- If your preview tool launches servers itself and cannot read the site folder (some sandboxed launchers cannot reach user folders), start `serve.py` yourself from a shell in the background and attach the preview to the URL instead.
- Before using a port, make sure nothing else is listening on it (`lsof -iTCP:8792 -sTCP:LISTEN`); another project on the same port will show you the wrong site. Check the page title matches the brand you just built.
- If the port is busy, pick another and use it consistently.
- `serve.py` sends `Cache-Control: no-store`, so a reload always shows the latest files.

## 3. The run

Set the viewport to 1440×900 for the main pass.

**Shop**
1. Screenshot the rail: pieces hang side-on from the bar, tags readable, tote bottom-right not covering garments.
2. Hover a piece → it turns to the front, neighbours close up, label shows.
3. Drag a piece onto the tote (a real mouse drag) → bag count becomes 1, a garment peeks out of the tote.
4. Drag another piece to empty space → it springs back; count unchanged.
5. Click a piece → viewer opens; switch to Back; pick a size; "Add to bag" → count becomes 2.

**Checkout**
6. Open the drawer → two lines, totals correct; change a quantity and watch the subtotal.
7. Continue to payment → summary matches; pick a destination city; Pay → spinner → "Paid ✓" → curtain → journey.

**Journey** — pause self-play (click the round button), then jump to each point and screenshot. In the page:

```js
window.go = p => scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight));
go(0.075);   // wait ~2 s after each jump: progress is smoothed
```

| p | You should see |
|---|---|
| .075 | open box on the belt, folded garments (in the bought pieces' colours) visible inside, caption 01 top-left |
| .205 | box closed, paper tape, label with the customer's name and destination code |
| .29 | box passing under the "Dispatch" arch, light on, scan card bottom-right |
| .38 | box sliding into the truck, rear doors open, logo on the truck side |
| .50 | truck on the road: windscreen, side glass, grille, lamps, wheels all visible |
| .585 | airport: whole aircraft, loader, truck; tail logo and wordmark readable |
| .655 | box riding up the loader toward the open hold |
| .77 | aircraft climbing away |
| .87 | world map, route drawn part-way, origin and destination labels, flight card counting |
| .96 | wide doorstep: door case, lantern, window, plants; box dropping |
| .995 | box on the mat, caption 07 with "Shop again" / "Replay", toast top-right |

8. Click "Shop again" → back at the rail with an empty bag.
9. Read the browser console for errors. (Errors left over from earlier page loads can linger in the log — reload and re-read before trusting one.)

**Phone pass** — switch to a phone-sized viewport, reload: no sideways page scroll (`document.documentElement.scrollWidth === innerWidth`), the rail scrolls within itself, tapping a piece turns it and a second tap opens the viewer, the journey captions sit above the HUD. Reset the viewport afterwards.

## 4. What to look for in each screenshot

- Is anything missing that the code says is there? (Buried trim — see the trim rule in `journey.md`.)
- Text over busy 3D, or 3D covering text?
- Blown-out white surfaces, or a scene noticeably darker/brighter than its neighbours?
- Off-brand colour (anything orange or saturated that is not a vehicle lamp)?
- Garment or box clipping through the belt, truck floor, loader or doormat?

Fix, reload, and re-check the affected scene and the ones either side of it.

## 5. Report

State what was checked and at which sizes, what was fixed along the way, and what was not checked. Give the address to open and the command to restart the server.
