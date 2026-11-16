import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/jsm/RoundedBoxGeometry.js';
import { drawCloth as weaveCloth } from './fabrics.js';

// The workshop: the part of the film before the box. Measured → Cut → Sewn → Fitted → Pressed.
// Everything is built from its real parts, in the customer's own cloth colour, around a long oak cutting table.
// q is the whole film's progress (0 → 1); the workshop owns q 0 → WQ.

const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export const WQ = .28;                                  // the workshop's share of the film
export const WCUTS = [.0535, .1115, .1685, .2265];      // quick cuts between the benches

const INK = '#0E1A2B', BONE = '#F4F0E8';
const FORMX = -5, FABX = -.2, MACHX = 4.3, PRESSX = 9.2;      // where each bench stands (x, relative to the workshop)

function paintTex(w, h, fn, repeat){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.userData = { c, x }; return t;
}
function tinted(img, size, fill){
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  if (img){ x.drawImage(img, 0, 0, size, size); x.globalCompositeOperation = 'source-in'; }
  x.fillStyle = fill; if (img) x.fillRect(0, 0, size, size); else { x.font = `${size * .8}px serif`; x.fillText('N', size * .2, size * .8); }
  return c;
}
// a closed outline: total length, a point and heading at any fraction of it
function poly(pts){
  const seg = []; let L = 0;
  for (let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, l, L]); L += l; }
  const at = t => { const d = cl(t) * L; let s = seg[seg.length - 1]; for (const g of seg) if (d <= g[3] + g[2]){ s = g; break; } const k = s[2] ? (d - s[3]) / s[2] : 0; return { x: lerp(s[0][0], s[1][0], k), y: lerp(s[0][1], s[1][1], k), a: Math.atan2(s[1][1] - s[0][1], s[1][0] - s[0][0]) }; };
  const draw = (x, t, map) => { const d = cl(t) * L; x.beginPath(); const p0 = map(pts[0]); x.moveTo(p0[0], p0[1]);
    for (const [a, b, l, s0] of seg){ if (d >= s0 + l){ const p = map(b); x.lineTo(p[0], p[1]); } else { const k = (d - s0) / l, p = map([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); x.lineTo(p[0], p[1]); break; } } x.stroke(); };
  return { L, at, draw };
}

// pattern pieces, (u along the table, v across it), in metres-ish table units
const FRONT = [[0, .08], [.04, .34], [.2, .4], [.34, .34], [.42, .36], [1.42, .4], [1.5, .36], [1.5, -.28], [1.42, -.34], [.66, -.36], [.3, -.26], [.12, -.16], [.03, -.05]];
const BACK = [[0, -.06], [0, .06], [.05, .36], [.22, .42], [.38, .36], [1.45, .32], [1.5, .3], [1.5, -.3], [1.45, -.32], [.38, -.36], [.22, -.42], [.05, -.36]];
const SLEEVE = [[0, 0], [.05, .18], [.16, .26], [1.4, .2], [1.45, .17], [1.45, -.17], [1.4, -.2], [.16, -.24], [.05, -.16]];
const PIECES = [{ pts: FRONT, ox: -1.75, oz: -.5 }, { pts: BACK, ox: -1.75, oz: .5 }, { pts: SLEEVE, ox: -.1, oz: -.45 }];
const shapeOf = pts => { const s = new THREE.Shape(); pts.forEach(([u, v], i) => i ? s.lineTo(u, -v) : s.moveTo(u, -v)); s.closePath(); return s; };   // lies flat once rotated −90° about x

export function buildWorkshop({ T, order, flat, box, catcher, GROUND }){
  const g = new THREE.Group();
  // the made-to-measure piece, in the cloth the customer chose
  const item = order.items.find(i => i.fab) || order.items[0] || { color: '#1f222f', name: 'Suit', size: '40R' }, vest = !!item.scale, cl0 = item.fabric;
  const cloth = new THREE.Color((cl0 && cl0.color) || item.color || '#1f222f');
  const clothM = new THREE.MeshStandardMaterial({ color: cloth, roughness: .92, side: THREE.DoubleSide });
  const clothHi = new THREE.MeshStandardMaterial({ color: cloth.clone().offsetHSL(0, 0, .05), roughness: .85, side: THREE.DoubleSide });
  const steel = flat(0xC9CCD0, .28, .9), steelD = flat(0x55595e, .35, .8), enamel = flat(0x0E1A2B, .32, .25), inkM = flat(0x0E1A2B, .6);
  const copper = flat(0x985322, .35, .75), boneM = flat(0xF4F0E8, .9), paperM = flat(0xFBFAF7, .95);
  const rb = (w, h, d, r, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat); m.position.set(x, y, z); return m; };
  const cyl = (rt, rb_, h, mat, x = 0, y = 0, z = 0, seg = 20) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb_, h, seg), mat); m.position.set(x, y, z); return m; };

  /* ── the oak cutting table ── */
  const oakT = paintTex(1024, 256, (x, w, h) => { x.fillStyle = '#CDB08A'; x.fillRect(0, 0, w, h); let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 120; i++){ x.strokeStyle = `rgba(${r() > .5 ? '120,84,44' : '255,240,215'},${.05 + r() * .08})`; x.lineWidth = 1 + r() * 3; x.beginPath(); const y = r() * h; x.moveTo(0, y); for (let k = 0; k <= 8; k++) x.lineTo(k * w / 8, y + Math.sin(k + i) * 4 * r()); x.stroke(); }
    x.fillStyle = 'rgba(90,60,30,.18)'; for (const yy of [0, h / 2]) x.fillRect(0, yy, w, 2); }, true);
  oakT.repeat.set(3, 1);
  const oak = new THREE.MeshStandardMaterial({ map: oakT, color: 0xE8DCCB, roughness: .6 }), oakEnd = flat(0xB8966A, .7);
  const TL = 8.4, TD = 2.6, TX = 2;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(TL, .12, TD), [oakEnd, oakEnd, oak, oakEnd, oakEnd, oakEnd]).translateX(TX).translateY(-.06));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(.14, -GROUND - .12, .14, oakEnd, TX + sx * (TL / 2 - .3), (GROUND - .12) / 2, sz * (TD / 2 - .25)));
  for (const sz of [-1, 1]) g.add(box(TL - .6, .1, .06, oakEnd, TX, GROUND + .45, sz * (TD / 2 - .25)));
  g.add(box(.06, .1, TD - .5, oakEnd, TX - TL / 2 + .3, GROUND + .45, 0)); g.add(box(.06, .1, TD - .5, oakEnd, TX + TL / 2 - .3, GROUND + .45, 0));
  g.add(box(TL - .8, .05, TD - .7, oakEnd, TX, GROUND + .4, 0));          // lower shelf
  for (let i = 0; i < 4; i++) g.add(cyl(.32, .32, .7, clothHi, TX + 1.2 + i * .1, GROUND + .8, -.6 + i * .02, 24).rotateX(Math.PI / 2).translateY(0));   // bolts of cloth on the shelf
  g.add(catcher(80, 40, 2, GROUND + .02, 0, .2));

  /* ── 01 MEASURED: the dress form, and the tape going round it ── */
  const form = new THREE.Group(); form.position.set(FORMX, .55, 0); g.add(form);
  const torso = new THREE.Group(); torso.scale.set(1.04, 1, .72); form.add(torso);
  const linenT = paintTex(256, 256, (x, w, h) => { x.fillStyle = '#EFE8DC'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1800; i++){ x.fillStyle = i % 2 ? 'rgba(120,100,70,.05)' : 'rgba(255,255,255,.12)'; x.fillRect(Math.random() * w, Math.random() * h, 1, 3 + Math.random() * 3); } }, true);
  linenT.repeat.set(4, 3);
  const linen = new THREE.MeshStandardMaterial({ map: linenT, roughness: .95 });
  const prof = [[.0, -.56], [.3, -.56], [.33, -.4], [.32, -.25], [.26, -.05], [.29, .12], [.33, .26], [.32, .4], [.27, .5], [.18, .56], [.1, .6], [.085, .68], [.085, .74], [0, .76]];
  torso.add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 48), linen));
  torso.add(cyl(.305, .305, .03, inkM, 0, -.56, 0, 40));                                                    // bound hem
  form.add(cyl(.05, .05, .06, oakEnd, 0, .79, 0)); form.add(new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), oakEnd).translateY(.84));   // neck cap
  form.add(cyl(.022, .022, .56 - GROUND - .58, copper, 0, (-.56 + (GROUND - .55)) / 2, 0));                  // brass pole
  form.add(cyl(.045, .045, .12, copper, 0, -.62, 0));
  for (let i = 0; i < 3; i++){ const a = i * Math.PI * 2 / 3 + .4, leg = box(.07, .05, .62, oakEnd, Math.sin(a) * .3, GROUND - .55 + .04, Math.cos(a) * .3); leg.rotation.y = a; form.add(leg); }
  form.add(cyl(.07, .09, .1, oakEnd, 0, GROUND - .55 + .1, 0));
  // tape measure: a bone ribbon with ink ticks that wraps the chest, then the waist
  const tapeT = paintTex(1024, 32, (x, w, h) => { x.fillStyle = BONE; x.fillRect(0, 0, w, h); x.fillStyle = INK;
    for (let i = 0; i < w; i += 8){ const big = i % 80 === 0; x.fillRect(i, 0, 1.5, big ? 14 : 7); if (big){ x.font = '600 11px "JetBrains Mono", monospace'; x.fillText(String(i / 8), i + 3, 27); } } }, true);
  const tapeM = new THREE.MeshStandardMaterial({ map: tapeT, roughness: .7, side: THREE.DoubleSide });
  const ribbonRing = (r, y, hgt, N = 96, turns = 1) => {
    const pos = new Float32Array((N + 1) * 6), uv = new Float32Array((N + 1) * 4), idx = [];
    for (let i = 0; i <= N; i++){ const a = i / N * Math.PI * 2 * turns, x = Math.sin(a) * r, z = Math.cos(a) * r;
      pos.set([x, y + hgt / 2, z, x, y - hgt / 2, z], i * 6); uv.set([i / N * 3, 1, i / N * 3, 0], i * 4); if (i < N){ const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, tapeM); m.userData = { N }; return m; };
  const chestTape = ribbonRing(.34, .26, .045), waistTape = ribbonRing(.275, -.05, .045); torso.add(chestTape); torso.add(waistTape);
  const tapeEnd = rb(.05, .055, .02, .006, copper); torso.add(tapeEnd);                                     // the brass tip, travelling round
  // the jacket, once it is sewn (shows at FITTED): cloth wrapped round the form, closing at the button,
  // a V above it with lapels rolling back, the fronts curving away below; sleeves and buttons
  const jacket = new THREE.Group(); torso.add(jacket);
  const gap = vest ? .9 : .56, yB = vest ? .06 : .0;
  const jprof = vest ? [[.345, -.36], [.31, -.2], [.285, -.05], [.31, .12], [.345, .26], [.335, .4], [.28, .49], [.2, .55]] : [[.36, -.44], [.35, -.3], [.3, -.05], [.32, .12], [.355, .26], [.345, .4], [.3, .5], [.22, .56], [.13, .6]];
  const yLo = jprof[0][1], yHi = jprof[jprof.length - 1][1];
  const rAt = y => { for (let i = 1; i < jprof.length; i++) if (y <= jprof[i][1]){ const [r0, y0] = jprof[i - 1], [r1, y1] = jprof[i]; return lerp(r0, r1, (y - y0) / (y1 - y0)); } return jprof[jprof.length - 1][0]; };
  // a strip of the surface between two angles that change with height (angle 0 = centre front)
  const band = (y0, y1, a0, a1, mat, dr = 0, rows = 30, cols = 10) => {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= rows; j++){ const t = j / rows, y = lerp(y0, y1, t), r = rAt(y) + dr, A0 = a0(t), A1 = a1(t);
      for (let k = 0; k <= cols; k++){ const a = lerp(A0, A1, k / cols); pos.push(Math.sin(a) * r, y, Math.cos(a) * r); uv.push(k / cols, t); } }
    for (let j = 0; j < rows; j++) for (let k = 0; k < cols; k++){ const a = j * (cols + 1) + k, b = a + cols + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat); };
  const onSurf = (a, y, dr = 0) => { const r = rAt(y) + dr; return [Math.sin(a) * r, y, Math.cos(a) * r]; };
  jacket.add(new THREE.Mesh(new THREE.LatheGeometry(jprof.map(([r, y]) => new THREE.Vector2(r, y)), 48, gap / 2, Math.PI * 2 - gap), clothM));
  const G = gap / 2 + .012, ov = t => gap / 2 * .96 * Math.pow(t, .85), ob = t => (vest ? .18 : gap * .32) * (1 - ss(0, .45, t));
  for (const s of [-1, 1]){
    const mir = f => s > 0 ? f : t => -f(t);
    jacket.add(band(yLo, yB, s > 0 ? ob : t => -G, s > 0 ? t => G : t => -ob(t), clothM));                   // the fronts below the button
    jacket.add(band(yB, yHi, s > 0 ? ov : t => -G, s > 0 ? t => G : t => -ov(t), clothM));                   // the fronts above, opening into a V
    if (!vest){
      const lw = t => .3 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), .75);
      jacket.add(band(yB + .01, yHi - .015, mir(ov), mir(t => ov(t) + lw(t)), clothHi, .007, 30, 6));       // lapel, rolled back
      const sl = cyl(.072, .06, .78, clothM, s * .405, .09, 0, 18); sl.rotation.z = s * .06; jacket.add(sl);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.085, 18, 12), clothM); cap.scale.set(1, .7, 1); cap.position.set(s * .345, .47, 0); jacket.add(cap);
      const fl = box(.17, .045, .012, clothHi, ...onSurf(s * .62, -.25, .006)); fl.rotation.y = s * .62; jacket.add(fl);   // pocket flaps
    }
  }
  if (!vest){ const w = box(.12, .025, .01, clothHi, ...onSurf(-.6, .28, .006)); w.rotation.y = -.6; jacket.add(w); }            // breast pocket welt
  for (const y of vest ? [yB, yB - .1, yB - .2, yB - .3] : [yB, yB - .15]) jacket.add(cyl(.019, .019, .012, flat(0x1a1612, .4), ...onSurf(0, y, .012), 14).rotateX(Math.PI / 2));
  // pins (copper heads) and chalk ticks, for the fitting
  const pins = new THREE.Group(); jacket.add(pins);
  for (const [x, y, z] of vest ? [[.28, .42, .14], [-.28, .42, .14], [.3, -.3, .14]] : [[.3, .5, .12], [-.3, .5, .12], [.44, -.27, .05], [-.44, -.27, .05], [.33, -.4, .14]]){
    const pn = new THREE.Group(); pn.position.set(x, y, z); pn.add(new THREE.Mesh(new THREE.SphereGeometry(.014, 10, 8), copper)); pn.add(cyl(.0025, .0025, .07, steel, 0, -.03, 0, 6)); pn.rotation.z = .4; pins.add(pn); }
  for (const [a, y] of [[.42, -.36], [-.42, -.36], [.5, .18]]){ const t = box(.06, .006, .008, boneM, ...onSurf(a, y, .008)); t.rotation.y = a; jacket.add(t); }   // chalk ticks

  /* ── 02 CUT: the cloth on the table, paper pattern, chalk, shears ── */
  const FW = 3.4, FD = 2, PX = 400;   // cloth size; px per unit on its canvas
  const baseC = document.createElement('canvas'); baseC.width = FW * PX; baseC.height = FD * PX;
  { const x = baseC.getContext('2d');
    if (cl0 && cl0.weave) weaveCloth(x, baseC.width, baseC.height, cl0, 2.2);   // the chosen cloth, woven
    else { x.fillStyle = '#' + cloth.getHexString(THREE.SRGBColorSpace); x.fillRect(0, 0, baseC.width, baseC.height);
      for (let i = 0; i < 9000; i++){ x.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.06)'; x.fillRect(Math.random() * baseC.width, Math.random() * baseC.height, 1 + Math.random() * 6, 1); } }
    x.strokeStyle = 'rgba(255,255,255,.08)'; x.lineWidth = 3; x.strokeRect(6, 6, baseC.width - 12, baseC.height - 12); }   // selvedge
  const clothT = paintTex(FW * PX, FD * PX, x => x.drawImage(baseC, 0, 0));
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(FW, FD), new THREE.MeshStandardMaterial({ map: clothT, roughness: .95 })); sheet.rotation.x = -Math.PI / 2; sheet.position.set(FABX, .004, 0); g.add(sheet);
  const toC = ([lx, lz]) => [(lx + FW / 2) * PX, (lz + FD / 2) * PX];
  const outlines = PIECES.map(pc => { const cx = pc.pts.reduce((s, p) => s + p[0], 0) / pc.pts.length, cz = pc.pts.reduce((s, p) => s + p[1], 0) / pc.pts.length;
    return poly(pc.pts.map(([u, v]) => [pc.ox + cx + (u - cx) * 1.05, pc.oz + cz + (v - cz) * 1.05])); });
  const cutLine = outlines[0];
  const paperTex = name => { const t = paintTex(600, 336, (x, w, h) => { x.fillStyle = '#F3EEE2'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(14,26,43,.5)'; x.lineWidth = 2; x.setLineDash([10, 7]); x.beginPath(); x.moveTo(w * .12, h * .5); x.lineTo(w * .88, h * .5); x.stroke(); x.setLineDash([]);
      x.beginPath(); x.moveTo(w * .88, h * .5); x.lineTo(w * .85, h * .46); x.moveTo(w * .88, h * .5); x.lineTo(w * .85, h * .54); x.stroke();
      x.fillStyle = 'rgba(14,26,43,.78)'; x.font = '600 26px "JetBrains Mono", monospace'; x.fillText(name, w * .2, h * .4);
      x.font = '500 18px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(14,26,43,.55)'; x.fillText(`${order.no || ''} · ${cl0 ? 'TO MEASURE' : item.size || ''}`, w * .2, h * .66);
      x.fillStyle = 'rgba(152,83,34,.85)'; x.font = 'italic 400 22px "Bodoni Moda", Georgia, serif'; x.fillText((order.name || '').split(' ')[0], w * .2, h * .8); });
    t.repeat.set(1 / 1.5, 1 / .84); t.offset.set(0, .5); return new THREE.MeshStandardMaterial({ map: t, roughness: 1 }); };
  const papers = PIECES.map((pc, i) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(pc.pts)), paperTex(['FRONT ×2', 'BACK ×2', 'SLEEVE ×2'][i]));
    m.rotation.x = -Math.PI / 2; m.position.set(FABX + pc.ox, .012, pc.oz); m.userData.keep = 1; g.add(m); return m; });
  let lastChalk = -1, lastCut = -1;
  const drawCloth = (chalk, cut) => {
    if (Math.abs(chalk - lastChalk) < .004 && Math.abs(cut - lastCut) < .004) return; lastChalk = chalk; lastCut = cut;
    const x = clothT.userData.x; x.drawImage(baseC, 0, 0); x.lineCap = x.lineJoin = 'round';
    x.strokeStyle = 'rgba(246,241,230,.85)'; x.lineWidth = 5; x.setLineDash([]);
    outlines.forEach((o, i) => { const t = cl(chalk * 3 - i); if (t > 0) o.draw(x, t, toC); });
    if (cut > 0){ x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = 3; cutLine.draw(x, cut, toC); }
    clothT.needsUpdate = true; };
  drawCloth(0, 0);
  // tailor's chalk: a bone wedge
  const chalkT = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .02, 3), boneM); chalkT.scale.set(1, 1, .7); g.add(chalkT);
  // tailor's shears: two steel blades on a brass pivot, black bows
  const shears = new THREE.Group(); g.add(shears);
  const blades = [1, -1].map(s => { const b = new THREE.Group(); shears.add(b);
    const bs = new THREE.Shape(); bs.moveTo(-.05, 0); bs.lineTo(.62, s * .006); bs.lineTo(.6, s * .045); bs.lineTo(-.05, s * .05); bs.closePath();
    const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .008, bevelEnabled: false }), steel); blade.rotation.x = -Math.PI / 2; b.add(blade);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(.065, .016, 8, 22), inkM); bow.rotation.x = -Math.PI / 2; bow.scale.set(1.4, 1, 1); bow.position.set(-.16, .006, -s * .06); b.add(bow);
    b.add(box(.12, .014, .022, inkM, -.08, .006, -s * .03)); return b; });
  shears.add(cyl(.016, .016, .03, copper, 0, .012, 0, 12));
  // the cut front panel, lifted off once the shears are done
  const panelGeo = new THREE.ExtrudeGeometry(shapeOf(FRONT), { depth: .012, bevelEnabled: false });
  const cutPanel = new THREE.Mesh(panelGeo, clothM); cutPanel.rotation.x = -Math.PI / 2; g.add(cutPanel);
  { const pp = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(FRONT)), papers[0].material); pp.position.z = .0125; pp.userData.keep = 1; cutPanel.add(pp); }
  // the order ticket, pinned to the table: who this suit is for
  const ticketT = paintTex(640, 400, (x, w, h) => {
    x.fillStyle = '#FBFAF7'; x.fillRect(0, 0, w, h); x.drawImage(tinted(T.logoImg, 64, INK), 28, 26);
    x.fillStyle = INK; x.font = '500 34px "Bodoni Moda", Georgia, serif'; x.fillText('Atelier Example', 106, 70);
    x.font = '600 15px "Hanken Grotesk", sans-serif'; x.globalAlpha = .6; x.fillText('ORDER TICKET', 470, 66); x.globalAlpha = 1; x.fillRect(28, 104, w - 56, 2);
    x.font = '700 30px "JetBrains Mono", monospace'; x.fillText(order.no || 'ATX-00000', 28, 150);
    x.font = '400 34px "Bodoni Moda", Georgia, serif'; x.fillText((order.name || '').slice(0, 26), 28, 200);
    x.font = '500 21px "Hanken Grotesk", sans-serif'; x.globalAlpha = .75; x.fillText(`${(item.name || '').slice(0, 26)} · ${cl0 ? cl0.name : item.size || ''}`.slice(0, 48), 28, 236); x.globalAlpha = 1;
    const m = order.measure || {}; x.font = '600 20px "JetBrains Mono", monospace';
    [['CHEST', m.chest], ['WAIST', m.waist], ['SLEEVE', m.sleeve]].forEach(([k, v], i) => { x.globalAlpha = .55; x.fillText(k, 28 + i * 200, 300); x.globalAlpha = 1; x.font = '400 40px "Bodoni Moda", Georgia, serif'; x.fillText(`${v || '—'}`, 28 + i * 200, 350); x.font = '600 20px "JetBrains Mono", monospace'; });
    x.fillStyle = '#985322'; x.fillRect(w - 46, 0, 18, h); });
  const ticket = new THREE.Mesh(new THREE.PlaneGeometry(.96, .6), new THREE.MeshStandardMaterial({ map: ticketT, roughness: .9 })); ticket.rotation.set(-Math.PI / 2, 0, .08); ticket.position.set(2.25, .006, .45); g.add(ticket);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(.022, 10, 8), copper).translateX(1.86).translateY(.02).translateZ(.24));
  g.add(cyl(.11, .11, .05, clothHi, 2.2, .025, -.6, 24)); g.add(cyl(.035, .035, .052, copper, 2.2, .026, -.6, 12));   // a coil of thread

  /* ── 03 SEWN: the machine ── */
  const mach = new THREE.Group(); mach.position.set(MACHX, 0, 0); g.add(mach);
  mach.add(rb(1.6, .12, .78, .03, enamel, 0, .06, 0));
  mach.add(box(.5, .006, .36, steel, -.58, .123, 0));                                          // needle plate
  mach.add(rb(.3, .74, .4, .05, enamel, .56, .49, 0));                                         // pillar
  mach.add(rb(1.32, .27, .34, .08, enamel, -.04, .83, 0));                                     // arm
  mach.add(rb(.28, .44, .36, .05, enamel, -.62, .74, 0));                                      // head
  mach.add(box(1.0, .012, .004, copper, -.02, .83, .172)); mach.add(box(1.0, .006, .004, copper, -.02, .8, .172));   // copper pinstripes
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(.18, .18), new THREE.MeshBasicMaterial({ map: T.logoW, transparent: true, depthWrite: false })); decal.position.set(.2, .83, .172); decal.userData.keep = 1; mach.add(decal);
  const wheel = new THREE.Group(); wheel.position.set(.76, .78, 0); mach.add(wheel);
  { const w = cyl(.2, .2, .07, steelD, 0, 0, 0, 40); w.rotation.z = Math.PI / 2; wheel.add(w); const r = cyl(.205, .205, .02, copper, .02, 0, 0, 40); r.rotation.z = Math.PI / 2; wheel.add(r);
    for (let i = 0; i < 4; i++){ const s = box(.012, .3, .03, steelD, .04, 0, 0); s.rotation.x = i * Math.PI / 4; wheel.add(s); } }
  mach.add(cyl(.012, .012, .14, steel, .2, 1.03, 0, 8)); mach.add(cyl(.05, .05, .1, copper, .2, 1.03, 0, 20));            // spool pin + copper thread
  const needleBar = new THREE.Group(); needleBar.position.set(-.66, .3, .06); mach.add(needleBar);
  needleBar.add(cyl(.016, .016, .26, steel, 0, .1, 0, 10)); needleBar.add(cyl(.004, .004, .12, steel, 0, -.08, 0, 6));
  mach.add(box(.1, .012, .08, steel, -.66, .14, .06)); mach.add(cyl(.008, .008, .3, steel, -.6, .3, .06, 6));          // presser foot + bar
  { const th = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.2, 1.06, 0), new THREE.Vector3(-.1, 1.0, .1), new THREE.Vector3(-.62, .92, .18), new THREE.Vector3(-.66, .62, .06)]), new THREE.LineBasicMaterial({ color: 0x985322 })); mach.add(th); }
  // the panel feeding under the needle, and its stitches
  const NX = MACHX - .66, NZ = .06, SEAM_V = .3, U0 = .55, U1 = 1.38, NST = 46;
  const feed = new THREE.Group(); g.add(feed);
  const feedPanel = new THREE.Mesh(panelGeo, clothM); feedPanel.rotation.x = -Math.PI / 2; feed.add(feedPanel);
  const stitches = new THREE.InstancedMesh(new THREE.BoxGeometry(.012, .006, .004), flat(0x985322, .5, .2), NST); stitches.userData.keep = 1;
  { const o = new THREE.Object3D(); for (let i = 0; i < NST; i++){ o.position.set(U0 + (U1 - U0) * i / (NST - 1), .016, SEAM_V); o.updateMatrix(); stitches.setMatrixAt(i, o.matrix); } }
  feed.add(stitches);

  /* ── 05 PRESSED: board, folded jacket, iron, steam ── */
  const press = new THREE.Group(); press.position.set(PRESSX, 0, 0); g.add(press);
  const bshape = new THREE.Shape(); bshape.moveTo(-1.25, -.15); bshape.quadraticCurveTo(-1.45, 0, -1.25, .15); bshape.lineTo(-.6, .37); bshape.lineTo(1.05, .37); bshape.quadraticCurveTo(1.2, .37, 1.2, .22); bshape.lineTo(1.2, -.22); bshape.quadraticCurveTo(1.2, -.37, 1.05, -.37); bshape.lineTo(-.6, -.37); bshape.closePath();
  const coverT = paintTex(512, 256, (x, w, h) => { x.fillStyle = '#EEE8DC'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(14,26,43,.08)'; x.lineWidth = 2; for (let i = -h; i < w; i += 22){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i + h, h); x.stroke(); } }, true);
  coverT.repeat.set(1.2, 1.2);
  const boardG = new THREE.ExtrudeGeometry(bshape, { depth: .06, bevelEnabled: true, bevelSize: .02, bevelThickness: .02, bevelSegments: 2 }); boardG.rotateX(-Math.PI / 2);
  press.add(new THREE.Mesh(boardG, new THREE.MeshStandardMaterial({ map: coverT, color: 0xCFC8BA, roughness: .95 })).translateY(-.16));
  for (const s of [-1, 1]){ const leg = box(.05, 2.0, .05, steel, 0, (GROUND - .16) / 2, s * .22); leg.rotation.x = s * .32; leg.rotation.z = .0; press.add(leg); press.add(box(.05, .04, .5, steel, s * .55, GROUND + .02, 0)); }
  const fold = new THREE.Group(); fold.position.set(.15, -.08, 0); press.add(fold);
  fold.add(rb(1.0, .08, .64, .03, clothM, 0, .04, 0));
  for (const s of [-1, 1]){ const lp = box(.5, .012, .05, clothHi, -.12, .085, s * .1); lp.rotation.y = s * .5; fold.add(lp); }
  fold.add(rb(.1, .02, .5, .01, clothHi, -.46, .09, 0));
  for (const z of [-.05, .1]) fold.add(cyl(.02, .02, .012, flat(0x1a1612, .4), .12, .087, z, 12));
  const iron = new THREE.Group(); press.add(iron);
  { const fs = new THREE.Shape(); fs.moveTo(-.24, -.13); fs.lineTo(.12, -.13); fs.quadraticCurveTo(.26, -.08, .3, 0); fs.quadraticCurveTo(.26, .08, .12, .13); fs.lineTo(-.24, .13); fs.closePath();
    const sole = new THREE.ExtrudeGeometry(fs, { depth: .035, bevelEnabled: false }); sole.rotateX(-Math.PI / 2); iron.add(new THREE.Mesh(sole, steel));
    const body = new THREE.ExtrudeGeometry(fs, { depth: .1, bevelEnabled: true, bevelSize: .025, bevelThickness: .03, bevelSegments: 3 }); body.rotateX(-Math.PI / 2); body.scale(.9, 1, .88);
    iron.add(new THREE.Mesh(body, enamel).translateY(.06));
    const hd = new THREE.Mesh(new THREE.TorusGeometry(.13, .024, 10, 24, Math.PI), enamel); hd.position.set(-.02, .2, 0); iron.add(hd);
    iron.add(cyl(.035, .035, .02, copper, .1, .2, 0, 16)); }
  const steamT = paintTex(64, 64, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); });
  const puffs = Array.from({ length: 12 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamT, transparent: true, depthWrite: false, opacity: 0 })); s.userData.ph = i / 12; s.userData.dx = (i % 4 - 1.5) * .06; press.add(s); return s; });

  /* ── the timeline ── */
  function update(q, time){
    // measured: the tape runs round the chest, then the waist; the brass tip leads it
    const kc = ss(.008, .026, q), kw = ss(.027, .045, q);
    chestTape.geometry.setDrawRange(0, Math.floor(kc * chestTape.userData.N) * 6); waistTape.geometry.setDrawRange(0, Math.floor(kw * waistTape.userData.N) * 6);
    const fitted = ss(.172, .19, q), measuring = q < .05;
    chestTape.visible = waistTape.visible = q < .17 && fitted <= 0;
    { const onWaist = kc >= 1, k = onWaist ? kw : kc, r = onWaist ? .282 : .347, y = onWaist ? -.05 : .26, a = k * Math.PI * 2;
      tapeEnd.visible = measuring && kw < 1 && (kc > 0); tapeEnd.position.set(Math.sin(a) * r, y, Math.cos(a) * r); tapeEnd.rotation.y = a; }
    // fitted: the jacket arrives on the form, then the pins
    jacket.visible = fitted > 0; jacket.scale.setScalar(lerp(1.06, 1, fitted)); jacket.position.y = (1 - fitted) * .12;
    pins.visible = q > .195; pins.scale.setScalar(ss(.195, .21, q) || .001);
    // cut: chalk traces all three pieces, then the shears follow the front
    const chalk = ss(.058, .08, q), cut = ss(.08, .102, q); drawCloth(chalk, cut);
    { const i = Math.min(2, Math.floor(chalk * 3)), t = cl(chalk * 3 - i), pt = outlines[i].at(t);
      chalkT.visible = q > .055 && chalk < 1 && q < .113; chalkT.position.set(FABX + pt.x, .03, pt.y); chalkT.rotation.y = -pt.a; }
    { const pt = cutLine.at(cut), open = .22 * (.5 + .5 * Math.sin(q * 900));
      shears.visible = q > .07 && q < .113; const rest = cut <= 0;
      shears.position.set(FABX + (rest ? -1.6 : pt.x), .02, rest ? .95 : pt.y); shears.rotation.y = rest ? .3 : -pt.a;
      blades[0].rotation.y = rest ? .02 : open; blades[1].rotation.y = rest ? -.02 : -open; }
    const lift = ss(.102, .11, q); cutPanel.visible = cut >= 1 && q < .113; papers[0].visible = !cutPanel.visible;
    cutPanel.position.set(FABX + PIECES[0].ox + lift * .1, .014 + lift * .05, PIECES[0].oz - lift * .05); cutPanel.rotation.z = lift * .04;
    // sewn: the panel feeds under the needle, stitch by stitch
    const sew = ss(.12, .162, q), u = lerp(U0, U1, sew);
    feed.visible = q > .1115 && q < .17; feed.position.set(NX - u, .125, NZ - SEAM_V);
    stitches.count = Math.max(0, Math.floor(sew * NST));
    const running = q > .118 && q < .164; needleBar.position.y = .3 + (running ? Math.sin(time * 38) * .04 : .03); wheel.rotation.x = running ? time * 9 : 0;
    // pressed: the iron works the folded jacket, steam rises
    const pr = ss(.232, .258, q), pressing = q > .229 && q < .27, ph = (q - .232) / .026 * Math.PI * 3;
    iron.position.set(.15 + (pr > 0 && pr < 1 ? Math.sin(ph) * .3 : pr >= 1 ? .7 : -.6), -.08 + .085 + (pr > 0 && pr < 1 ? 0 : .12), pr >= 1 ? .3 : 0); iron.rotation.y = pr >= 1 ? -.5 : 0;
    puffs.forEach(s => { const k = (time * .55 + s.userData.ph) % 1, on = pressing && pr > 0 && pr < 1 ? 1 : 0;
      s.position.set(iron.position.x + .05 + s.userData.dx, iron.position.y + .1 + k * .7, iron.position.z + s.userData.dx * .6); s.scale.setScalar(.12 + k * .35); s.material.opacity = on * (1 - k) * .45 * Math.min(1, k * 6); });
  }
  return { group: g, update, item };
}

// camera keys for the workshop: [q, camera, look-at] (relative to the workshop's x)
export const WCAM = [
  [0.000, [FORMX + 2.2, 1.55, 4.6], [FORMX - .55, .78, 0]], [0.026, [FORMX + 1.4, 1.2, 4.1], [FORMX - .5, .6, 0]], [0.052, [FORMX + .6, 1.2, 3.9], [FORMX - .55, .55, 0]],
  [0.0536, [FABX + 1.3, 5.7, 4.7], [FABX - .3, 0, -.05]], [0.08, [FABX + .9, 5.3, 4.3], [FABX - .55, 0, -.1]], [0.111, [FABX + .5, 4.6, 3.7], [FABX - .9, 0, -.25]],
  [0.1116, [MACHX + 1.9, 1.8, 3.5], [MACHX - 1.0, .35, 0]], [0.14, [MACHX + 1.5, 1.6, 3.2], [MACHX - 1.05, .35, 0]], [0.168, [MACHX + 1.2, 1.5, 3.0], [MACHX - 1.1, .38, 0]],
  [0.1686, [FORMX + 2.4, 1.3, 4.3], [FORMX - .6, .7, 0]], [0.2, [FORMX + 1.7, 1.25, 4.0], [FORMX - .6, .72, 0]], [0.226, [FORMX + .4, 1.4, 3.8], [FORMX - .7, .75, 0]],
  [0.2266, [PRESSX + 1.9, 1.5, 2.9], [PRESSX - .6, -.1, 0]], [0.25, [PRESSX + 1.5, 1.3, 2.6], [PRESSX - .55, -.1, 0]], [0.28, [PRESSX + 1.3, 1.2, 2.3], [PRESSX - .5, -.12, 0]]
];
