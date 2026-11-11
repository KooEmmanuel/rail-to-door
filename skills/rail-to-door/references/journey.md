# Stage: the 3D order journey

Goal: after payment, the customer watches their order travel. One three.js canvas, four "worlds" far apart on the x-axis, a single progress value `p` (0 → 1) driven by scroll (and by self-play). Files: `js/journey.js` (worlds, cameras, timeline), `js/models.js` (truck, aircraft), `js/parcels.js` (the box), `js/textures.js` (painted surfaces), `js/world.js` (map), `index.html` (captions + HUD), `js/main.js` (self-play).

## Contents
1. The timeline
2. The four worlds
3. Editing: captions, timing, cameras
4. The trim rule (why details go missing) and the detail checklist
5. Lighting, shadows, colour
6. The map
7. Common requests

## 1. The timeline

`p` is the scroll position through `.journey` (1400vh tall), smoothed. Hard cuts between worlds are hidden by a white flash (`CUTS = [.56, .79, .93]`). HUD steps switch at `STEPS = [0, .225, .365, .56, .79, .93]`.

| p | World | What happens | Caption (data-in → data-out) |
|---|---|---|---|
| .02 – .09 | 1 atelier | folded garments drop into the open box, one per item bought (max 5 shown), in each piece's own colour | 01 Packed by hand (.025 → .13) |
| .088 – .108 | 1 | tissue sheet with the logo seal settles on top | |
| .108 – .142 | 1 | the four flaps close (minor first, then major) | |
| .142 – .17 | 1 | paper tape runs across the top and down both ends | 02 Labeled (.15 → .215) |
| .168 – .208 | 1 | the shipping label flies in and lands (customer's name, city, order no.) | |
| .225 – .335 | 1 | the belt runs; the box passes the scan gate (light flashes as it crosses) | 03 Scanned out (.245 → .325), scan card (.255 → .33) |
| .335 – .385 | 1 | the box slides off the belt into the truck | 04 On the road (.365 → .535) |
| .39 – .418 | 1 | truck doors close | |
| .425 – .56 | 1 | the truck drives off down the road, camera tracking | |
| .56 | cut | → airport | |
| .56 – .60 | 2 airport | establishing shot: aircraft, belt loader, truck backed up to it | 05 At the airport (.575 → .765) |
| .60 – .715 | 2 | the box leaves the truck, rides up the loader, enters the hold | |
| .716 – .738 | 2 | cargo hatch swings shut | |
| .742 – .79 | 2 | take-off roll, rotate, climb; camera follows | |
| .79 | cut | → map | |
| .79 – .815 | 3 map | dot map fades in near the origin city | 06 In the air (.80 → .905), flight card (.805 → .925) |
| .808 – .918 | 3 | the aircraft flies the great-circle route, drawing the line; distance counts up | |
| .93 | cut | → doorstep | |
| .94 – .968 | 4 doorstep | the box drops onto the doormat with a bounce | 07 Delivered (.955 → end), toast (.965 → end) |

Self-play scrolls the page over `SECONDS = 62` (`js/main.js`); any wheel/touch/arrow key pauses it; the round button toggles it.

## 2. The four worlds

- **World 1 — atelier** (around x = 0). `hero` is the detailed box (`heroParcel` in `parcels.js`: open top, four hinged flaps, tape, label). It sits on a conveyor (`BL` long, `BW` wide): aluminium side beams, guide rails, end drums, return rollers, H-frame legs, a slim ink scan arch with the "Dispatch" sign and a light bar. Three closed parcels ride behind it. The truck (`makeTruck`) waits with its rear at the belt end; a road with edge lines and centre dashes leads off, with trees and low buildings set well back.
- **World 2 — airport** (x = `AX`). Apron disc and painted lines, the aircraft (`makeJet`) with its cargo door on the near side, an inclined belt loader, a second truck backed up to the loader with its doors open.
- **World 3 — map** (x = `MX`). Land dots from real coastlines, origin and destination markers with pulsing rings and pill labels, the route ribbon, a small aircraft with a shadow.
- **World 4 — doorstep** (x = `DX`). Brick wall, stone plinth and two steps, door case (pilasters, entablature, cornice, lit transom), six-panel door with brass knocker / letter slot / knob / hinges / threshold, number tile, bell, lit lantern, sash window, snake plant in a ceramic pot, box ball in an ink planter, doormat, and the delivered parcel.

Only the current world is visible each frame (`w1.visible = world === 1`, …).

## 3. Editing: captions, timing, cameras

- **Captions** are `<div class="j-copy pos-tl|pos-bl" data-in=".365" data-out=".535">` in `index.html`; they sit *above* the canvas. Change text there; change when they show with the two numbers. Keep captions top-left (`pos-tl`) for scenes where the lower-left is busy (packing, truck).
- **Timing** — each action in `update()` is `ss(a, b, p)` (smoothstep from a to b) or `cl((p - a) / len)`. To lengthen a beat, widen its range and shift what follows; keep the three `CUTS`, the `STEPS` array, the caption windows and the camera keys in step with it.
- **Cameras** — `C1`, `C2`, `C4` are arrays of `[p, [camera x,y,z], [look-at x,y,z]]`; the camera eases between keys. The drive (p .42–.56), the take-off (p > .745) and the map compute the camera from the moving subject instead. To reframe a shot, change the key nearest that `p`; check the shot before and after it too.
- **Field of view** adapts to the window shape in `resize()`; test at 1440×900 and at a phone size.

## 4. The trim rule, and the detail checklist

**Trim rule.** Bodies made with `ExtrudeGeometry` and a bevel grow *outward* by the bevel size, so glass, grilles, lamps and decals placed "on the surface" end up buried under the skin and simply do not appear. The truck cab and deflector therefore use `bevelOffset: -bevelSize` (the profile is the true outer skin), and every piece of trim is placed a few millimetres **proud** of it (`HW + .004` for the side frame, `+ .009` for glass, `.016` off the windscreen plane). On the aircraft, flat decals sit at `zAt(dy) + .012` — the fuselage radius at that height plus a hair. If a detail you added is invisible, it is inside the body: move it outward before changing anything else.

**Glass** is a painted texture (`glassTex` in `models.js`): sky gradient, diagonal reflection streaks, a hint of seats / steering wheel / dashboard. Plain dark planes do not read as windows.

**What "not a toy" means here** — keep these when editing, add more of the same kind when asked for more detail:

- *Truck:* cab-over cab with a raked windscreen in a rubber gasket, wipers, sun visor, roof lamps; side glass, door shut-lines, chrome handle, logo on the door; grille with chrome slats and emblem, headlamp clusters with bezels, indicators, fog lamps, bumper, plate; mirrors on arms; steps, wheel arches; roof deflector; chassis rails, fuel tank, battery box, exhaust, side guards, mud flaps; cargo body with aluminium corner extrusions, clearance lamps, plywood floor, hinged rear doors with lock rods and hinges; tyres with a rounded profile, dished rims, wheel nuts, dual rear wheels.
- *Aircraft:* lathed fuselage with tapered nose and upswept tail, grey belly, ink cheat-line, six-pane cockpit glazing, a row of framed cabin windows, wordmark and registration, swept wings with flaps, flap-track fairings, winglets, red/green tip lights; engines with polished lips, fan blades, spinner, exhaust cone, pylons; fin with the logo, tailplanes; gear legs, wheels, gear doors; beacon; a dark hold behind a hatch that swings up.
- *House:* see World 4 above — real architectural parts, not a rectangle on a wall.

Build new props the same way: start from the real object's parts list, model each part from simple geometry (boxes, rounded boxes, lathes, extrusions), give metals, glass and paint different roughness/metalness.

## 5. Lighting, shadows, colour

- One studio environment map (`RoomEnvironment`) gives reflections; a hemisphere light and one shadow-casting sun do the rest. The sun follows the camera target each frame (`aimSun(target, size)`), with a shadow area sized per world (15 / 40 / 8).
- Every `MeshStandardMaterial` mesh casts and receives shadows. Ground shadows are caught by invisible `ShadowMaterial` planes (`catcher(...)`) so the page background shows through.
- `MeshBasicMaterial` is used for things that must not be lit (map dots, route, decals, apron). Mark helper meshes that should not cast shadows with `userData.keep = 1`.
- Surfaces that looked blown-out were fixed by multiplying their colour down (the wall, paving, belt). If a new surface is glaringly white, lower its `color`, do not add lights.
- Colours come from the brand (see the keys below) plus neutral materials: brushed aluminium, rubber, glass, stone, wood, greenery. Do not add a colour the brand does not have; vehicle lamps are the only exception.

### Brand colour keys in the 3D scenes

Set through `brand.json` → `apply_brand.py` (see `brand.md`); each is one hex value in the code, so it can also be edited directly:

| Key | What it colours | Where |
|---|---|---|
| `boxBoard`, `boxPrint` | packaging board; its print and the tape | `js/textures.js` (`INK`, `BONE`) |
| `truckBody`, `truckCab` | cargo body and side panel; cab and deflector | `M.white`, `M.cab` in `js/models.js`; "van side" in `js/textures.js` |
| `planeBody`, `liveryDark` | fuselage, wings; tail fin, cheat-lines, winglets | `M.jet`, `M.ink` in `js/models.js` |
| `conveyorFrame`, `beltColor` | conveyor beams and rails; the belt | `alu` in `js/journey.js`; the belt block in `js/textures.js` |
| `doorColor` | the front door | `inkDoor` in `js/journey.js` |
| `ink` | route line, map markers and labels, gate, dark trim | throughout |

## 6. The map

`js/world.js` reads `vendor/land-110m.json` (Natural Earth coastlines), rasterises the land once, and `landDots(step)` returns a staggered grid of land points; `greatCircle(a, b, n)` returns the route. The camera frames the route's bounding box, starts tight on the origin, pulls back to the whole route, and settles toward the destination. Any `{lon, lat}` pair works — to add a destination, add it to `CITIES` in `js/data.js` with its airport code.

## 7. Common requests

| Request | Where to make it |
|---|---|
| Different box design | `js/textures.js` (`front`, `side`, `top flaps`, `paper tape`) — see `brand.md` |
| Different label content | `T.drawLabel` in `js/textures.js` |
| Truck livery / side text | the "van side" block in `js/textures.js`; cab paint is `M.cab` in `js/models.js` |
| Aircraft livery | `M.jet`, the cheat-line and wordmark blocks in `makeJet` |
| A different ground vehicle (panel van, cargo bike, scooter courier, pickup) | new builder in `js/models.js` returning `{ g, setDoors?, wheels? }`; swap it where `makeTruck` is used (worlds 1 and 2); keep the load floor at y = 0 and the ground at y = −1.6 so the parcel lines up; model it from its real parts like the truck |
| A ship or train instead of the aircraft | new builder returning `{ g, hatch?, DOORX, SILL }`; replace the apron with a quay or platform, the loader with a crane or ramp, and the take-off with a departure; the map leg works unchanged (the route is just two points) |
| No sorting line (small maker, packed on a table) | replace the conveyor block in World 1 with a packing table; keep the parcel's path (it slides along x from 0 to the vehicle) |
| Products that are not folded clothes in the packing scene | the `folds` block in World 1: swap the folded-bundle geometry for boxes, bottles, shoe boxes — still one per item, in each item's `color` |
| A different destination (apartment door, shop counter, office reception, locker) | rebuild World 4 with the same parts list approach; keep the mat/landing spot where the parcel drops |
| Skip the flight (same-country delivery) | drive straight to the doorstep: move the cut at .56 to the door world and drop worlds 2–3 from `CUTS`, `STEPS` and the captions |
| Longer / shorter film | `SECONDS` in `js/main.js` and the `.journey` height in `css/style.css` |
| The house (number, door style, wall) | World 4 block in `js/journey.js`; number tile text in `numT` |
| More trees / buildings on the road | the prop loop after the road in World 1 (keep them at z < −11 so they never cover the truck) |

After any change run the browser check in `verify.md` and look at the changed scene **and its neighbours**.
