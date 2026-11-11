import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/jsm/RoundedBoxGeometry.js';

const std = (color, roughness, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };
const bx = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const rb = (w, h, d, r, mat, x, y, z) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z);
const V2 = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));

// shared look
const M = {
  white: std(0xF5F3EE, .36), cab: std(0xEFECE6, .28, .05), ink: std(0x211F1C, .3, .15), plastic: std(0x141414, .72), rubber: std(0x0c0c0c, .94),
  alu: std(0xC9CCD0, .3, .9), steel: std(0x5a5d61, .45, .75), rim: std(0xDADCDF, .28, .85), chrome: std(0xF2F3F4, .08, 1),
  wood: std(0xB9B2A6, .85), liner: std(0xE2DFD8, .85), gasket: std(0x0b0b0b, .8),
  lampW: std(0xffffff, .15, 0, { emissive: 0xfff3d6, emissiveIntensity: .9 }), lampR: std(0xd21e1e, .3, 0, { emissive: 0xb00000, emissiveIntensity: .7 }),
  lampA: std(0xf2c35a, .3, 0, { emissive: 0xb07a10, emissiveIntensity: .5 }), lampG: std(0x2fd06a, .3, 0, { emissive: 0x109040, emissiveIntensity: .8 }),
  jet: std(0xF7F6F2, .3, .05), jetGrey: std(0xA9ADB3, .35, .6), jetBelly: std(0xD9DADC, .4, .2)
};

/* ───────────── painted-on detail: glass, decals ───────────── */
function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function toTex(c){ const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function tinted(logo, size, fill){ const h = Math.ceil(size * logo.height / logo.width), [c, x] = canvas(size, h); x.drawImage(logo, 0, 0, size, h); x.globalCompositeOperation = 'source-in'; x.fillStyle = fill; x.fillRect(0, 0, size, h); return c; }
// a windscreen you can read as glass: sky gradient, reflections, a hint of the cabin behind it
function glassTex(w, h, { seats = [], wheel = null, visor = 0 } = {}){
  const [c, x] = canvas(w, h), g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5d7482'); g.addColorStop(.45, '#2a3942'); g.addColorStop(1, '#0d1418'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(4,7,9,.72)';
  for (const sx of seats){ x.beginPath(); x.roundRect(sx * w - w * .075, h * .5, w * .15, h * .6, w * .03); x.fill(); x.beginPath(); x.roundRect(sx * w - w * .042, h * .3, w * .084, h * .2, w * .02); x.fill(); }
  if (wheel !== null){ x.strokeStyle = 'rgba(4,7,9,.8)'; x.lineWidth = h * .035; x.beginPath(); x.ellipse(wheel * w, h * .82, w * .075, h * .2, 0, 0, 6.3); x.stroke(); }
  x.fillStyle = 'rgba(6,9,11,.55)'; x.fillRect(0, h * .9, w, h * .1);                       // dashboard
  if (visor){ x.fillStyle = 'rgba(8,10,12,.85)'; x.fillRect(0, 0, w, h * visor); }
  const r = x.createLinearGradient(0, 0, w, h); r.addColorStop(.12, 'rgba(255,255,255,0)'); r.addColorStop(.24, 'rgba(255,255,255,.2)'); r.addColorStop(.3, 'rgba(255,255,255,.04)'); r.addColorStop(.38, 'rgba(255,255,255,.14)'); r.addColorStop(.46, 'rgba(255,255,255,0)');
  x.fillStyle = r; x.fillRect(0, 0, w, h);
  return toTex(c);
}
const glassMat = (map, extra = {}) => std(0xffffff, .06, .55, { map, envMapIntensity: 1.3, ...extra });

/* ───────────────────────── wheel ───────────────────────── */
const tyreGeo = (() => { const g = new THREE.LatheGeometry(V2([[.39, -.17], [.55, -.17], [.61, -.135], [.622, -.06], [.622, .06], [.61, .135], [.55, .17], [.39, .17]]), 36); g.rotateX(Math.PI / 2); return g; })();
const rimGeo = (() => { const g = new THREE.LatheGeometry(V2([[0, .11], [.13, .11], [.15, .06], [.33, .04], [.37, .13], [.395, .15], [.395, -.15], [0, -.15]]), 28); g.rotateX(Math.PI / 2); return g; })();
const nutGeo = new THREE.CylinderGeometry(.022, .022, .05, 6); nutGeo.rotateX(Math.PI / 2);
const holeGeo = new THREE.CircleGeometry(.045, 12);
function wheel(side){
  const w = new THREE.Group(); w.add(new THREE.Mesh(tyreGeo, M.rubber));
  const r = new THREE.Mesh(rimGeo, M.rim); if (side < 0) r.rotation.y = Math.PI; w.add(r);
  for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; w.add(mesh(nutGeo, M.steel, Math.cos(a) * .24, Math.sin(a) * .24, side * .075)); }
  for (let i = 0; i < 6; i++){ const a = (i + .5) / 6 * Math.PI * 2, h = mesh(holeGeo, M.gasket, Math.cos(a) * .3, Math.sin(a) * .3, side * .052); if (side < 0) h.rotation.y = Math.PI; w.add(h); }
  return w;
}
const archGeo = (r, len) => { const g = new THREE.CylinderGeometry(r, r, len, 22, 1, true, Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); return g; };
const archMat = std(0x141414, .7, 0, { side: THREE.DoubleSide });

/* ───────────────────────── delivery truck ─────────────────────────
   Forward is +x. The cargo floor is at y = 0, the ground at y = -1.6. */
export function makeTruck(T){
  const g = new THREE.Group(), CX = -.1, L = 5.2, W = 2.5, H = 2.6;
  const van = std(0xffffff, .4, 0, { map: T.van });

  /* cargo body */
  g.add(bx(L, .1, W - .14, M.wood, CX, -.05, 0)); g.add(bx(L + .04, .27, W + .04, M.alu, CX, -.115, 0));
  g.add(mesh(new THREE.BoxGeometry(L, H, .06), [M.white, M.white, M.white, M.white, van, M.liner], CX, H / 2, W / 2 - .03));
  g.add(mesh(new THREE.BoxGeometry(L, H, .06), [M.white, M.white, M.white, M.white, M.liner, van], CX, H / 2, -W / 2 + .03));
  g.add(bx(L, .06, W, M.white, CX, H, 0)); g.add(bx(.06, H, W, M.liner, CX + L / 2 - .03, H / 2, 0));
  for (const z of [-1, 1]){   // aluminium corner extrusions, clearance lamps, side guards
    for (const y of [.02, H]) g.add(bx(L + .06, .09, .09, M.alu, CX, y, z * (W / 2 - .01)));
    for (const x of [CX - L / 2, CX + L / 2]) g.add(bx(.09, H, .09, M.alu, x, H / 2, z * (W / 2 - .01)));
    g.add(bx(.05, .05, .16, M.lampR, CX - L / 2 - .03, H - .1, z * (W / 2 - .2)));
    g.add(bx(.05, .05, .16, M.lampW, CX + L / 2 + .03, H - .1, z * (W / 2 - .2)));
    for (const y of [-.52, -.78]) g.add(bx(2.5, .07, .04, M.alu, .95, y, z * 1.24));
    for (const x of [-.2, .95, 2.1]) g.add(bx(.05, .5, .04, M.steel, x, -.56, z * 1.21));
  }
  for (const x of [CX - L / 2, CX + L / 2]) g.add(bx(.09, .1, W, M.alu, x, H + .01, 0));
  g.add(bx(.1, .14, W, M.steel, CX - L / 2, -.07, 0));
  const doors = [1, -1].map(s => {
    const p = new THREE.Group(); p.position.set(CX - L / 2 - .03, 0, s * (W / 2 - .05)); p.userData.s = s;
    p.add(bx(.05, H - .1, W / 2 - .06, M.white, 0, H / 2, -s * (W / 4 - .02)));
    const rod = new THREE.CylinderGeometry(.018, .018, H - .2, 8);
    p.add(mesh(rod, M.steel, -.045, H / 2, -s * (W / 2 - .5))); p.add(mesh(rod, M.steel, -.045, H / 2, -s * .45));
    p.add(bx(.03, .05, .3, M.steel, -.06, 1.05, -s * (W / 2 - .5)));
    for (const y of [.35, H / 2, H - .35]) p.add(bx(.06, .14, .1, M.alu, -.01, y, -s * .04));
    g.add(p); return p;
  });
  const setDoors = k => doors.forEach(d => { d.rotation.y = d.userData.s * 1.98 * k; });

  /* chassis */
  for (const z of [-.48, .48]) g.add(bx(7.3, .2, .12, M.steel, .9, -.4, z));
  for (const x of [-2.2, -.4, 1.4, 3.0]) g.add(bx(.1, .14, 1.0, M.steel, x, -.4, 0));
  g.add(bx(.1, .12, 2.3, M.steel, CX - L / 2 - .02, -.66, 0)); g.add(bx(.02, .15, .52, M.white, CX - L / 2 - .08, -.4, 0));
  for (const z of [-1, 1]){
    g.add(bx(.06, .17, .4, M.lampR, CX - L / 2 - .04, -.4, z * .93)); g.add(bx(.06, .17, .14, M.lampW, CX - L / 2 - .04, -.4, z * .66));
    g.add(bx(.02, .5, .64, M.rubber, -1.98, -.74, z * .9));
    g.add(mesh(archGeo(.76, .78), archMat, -1.2, -.98, z * .86));
  }
  const tank = new THREE.CylinderGeometry(.3, .3, 1.15, 22); tank.rotateZ(Math.PI / 2); g.add(mesh(tank, M.alu, .95, -.62, .98));
  for (const x of [.6, 1.3]) g.add(bx(.05, .64, .05, M.steel, x, -.62, .98));
  g.add(rb(.75, .46, .42, .04, M.plastic, .95, -.6, -.98));
  const ex = new THREE.CylinderGeometry(.06, .06, 1.4, 12); ex.rotateZ(Math.PI / 2); g.add(mesh(ex, M.steel, -2.0, -.62, -.3));

  /* cab-over cab. The profile is the true outer skin (bevel is cut inward), so glass and trim sit proud of it. */
  const cab = new THREE.Group(); cab.position.set(2.7, -.5, 0); g.add(cab);
  const prof = [[0, 0], [1.72, 0], [1.84, .1], [1.86, .78], [1.8, 1.0], [1.46, 2.0], [1.3, 2.1], [.05, 2.1], [0, 2.05]];
  const cg = new THREE.ExtrudeGeometry(new THREE.Shape(V2(prof)), { depth: 2.24, bevelEnabled: true, bevelSize: .05, bevelOffset: -.05, bevelThickness: .05, bevelSegments: 4 }); cg.translate(0, 0, -1.12);
  cab.add(new THREE.Mesh(cg, M.cab));
  const HW = 1.17;   // half width of the cab skin
  // windscreen: rubber gasket, glass with reflections, wipers, sun visor, roof lamps
  const ws = new THREE.Group(), a = Math.atan2(.34, 1.0); ws.position.set(1.63, 1.5, 0); ws.rotation.z = a; cab.add(ws);
  const gk = mesh(new THREE.PlaneGeometry(2.14, 1.0), M.gasket, .008, 0, 0); gk.rotation.y = Math.PI / 2; ws.add(gk);
  const wsm = mesh(new THREE.PlaneGeometry(2.04, .9), glassMat(glassTex(1024, 448, { seats: [.27, .73], wheel: .27, visor: .12 })), .016, 0, 0); wsm.rotation.y = Math.PI / 2; ws.add(wsm);
  for (const z of [-.3, .5]){ const wp = bx(.02, .025, .78, M.plastic, .03, -.36, z); wp.rotation.x = .2; ws.add(wp); ws.add(bx(.03, .05, .05, M.plastic, .03, -.44, z + .36)); }
  const visor = rb(.26, .04, 2.16, .015, M.plastic, 1.5, 2.06, 0); visor.rotation.z = -.2; cab.add(visor);
  for (const z of [-.8, -.4, 0, .4, .8]) cab.add(rb(.06, .045, .12, .015, M.lampW, 1.3, 2.125, z));
  // sides: glass, door shut-lines, handle, logo, mirror, step, arch
  const sideGlass = glassMat(glassTex(512, 384, { seats: [.4] }), { side: THREE.DoubleSide });
  const sgeo = new THREE.ShapeGeometry(new THREE.Shape(V2([[.46, 1.06], [1.7, 1.06], [1.42, 1.9], [.46, 1.9]])));
  { const p = sgeo.attributes.position, uv = sgeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - .46) / 1.24, (p.getY(i) - 1.06) / .84); }
  const fgeo = new THREE.ShapeGeometry(new THREE.Shape(V2([[.4, 1.0], [1.78, 1.0], [1.46, 1.96], [.4, 1.96]])));
  const frameM = std(0x0b0b0b, .8, 0, { side: THREE.DoubleSide }), seam = std(0x1d1c1a, .6);
  const logoInk = T.logoImg ? new THREE.MeshBasicMaterial({ map: toTex(tinted(T.logoImg, 256, '#17150F')), transparent: true, depthWrite: false }) : null;
  for (const s of [-1, 1]){
    cab.add(mesh(fgeo, frameM, 0, 0, s * (HW + .004))); cab.add(mesh(sgeo, sideGlass, 0, 0, s * (HW + .009)));
    for (const [w, h, x, y] of [[.014, 1.9, .34, 1.06], [.014, 1.0, 1.74, .56], [1.4, .014, 1.04, .12], [1.4, .014, 1.04, 2.02]]) cab.add(bx(w, h, .012, seam, x, y, s * (HW + .003)));
    cab.add(rb(.2, .055, .04, .015, M.chrome, .5, .88, s * (HW + .02)));
    if (logoInk){ const lg = mesh(new THREE.PlaneGeometry(.42, .37), logoInk, 1.05, .6, s * (HW + .006)); if (s < 0) lg.rotation.y = Math.PI; cab.add(lg); }
    cab.add(bx(.03, .03, .3, M.plastic, 1.6, 1.62, s * (HW + .15))); cab.add(bx(.03, .03, .3, M.plastic, 1.6, 1.34, s * (HW + .15)));
    cab.add(rb(.1, .5, .22, .04, M.plastic, 1.63, 1.48, s * (HW + .32))); cab.add(bx(.012, .42, .16, M.chrome, 1.577, 1.48, s * (HW + .32)));
    cab.add(bx(.5, .05, .3, M.plastic, .78, -.3, s * 1.06)); cab.add(bx(.04, .3, .04, M.steel, .6, -.16, s * 1.1)); cab.add(bx(.04, .3, .04, M.steel, .96, -.16, s * 1.1));
    cab.add(mesh(archGeo(.76, .46), archMat, .85, -.48, s * .98));
    // headlamp cluster: chrome bezel, lamp, indicator; fog lamp in the bumper
    cab.add(rb(.05, .26, .62, .03, M.chrome, 1.87, .27, s * .8)); cab.add(rb(.06, .19, .36, .03, M.lampW, 1.885, .27, s * .72)); cab.add(rb(.06, .19, .16, .03, M.lampA, 1.885, .27, s * 1.01));
    cab.add(rb(.05, .09, .22, .02, M.lampW, 1.95, -.1, s * .86));
  }
  // grille with slats and emblem, bumper, plate, roof deflector, aerial
  cab.add(rb(.05, .4, 1.34, .03, M.plastic, 1.875, .64, 0)); for (const y of [.5, .57, .64, .71, .78]) cab.add(bx(.02, .022, 1.24, M.chrome, 1.905, y, 0));
  if (T.logoImg){ const em = mesh(new THREE.PlaneGeometry(.3, .265), new THREE.MeshBasicMaterial({ map: toTex(tinted(T.logoImg, 256, '#F2F3F4')), transparent: true }), 1.92, .64, 0); em.rotation.y = Math.PI / 2; cab.add(rb(.03, .32, .38, .03, M.plastic, 1.9, .64, 0)); cab.add(em); }
  cab.add(rb(.28, .36, 2.4, .08, M.plastic, 1.8, -.1, 0)); cab.add(bx(.02, .13, .46, M.white, 1.945, -.02, 0)); cab.add(bx(.03, .05, 1.5, M.chrome, 1.94, .1, 0));
  const dgeo = new THREE.ExtrudeGeometry(new THREE.Shape(V2([[.05, 2.08], [1.28, 2.08], [.42, 2.96], [.05, 3.04]])), { depth: 2.0, bevelEnabled: true, bevelSize: .04, bevelOffset: -.04, bevelThickness: .04, bevelSegments: 3 }); dgeo.translate(0, 0, -1.0); cab.add(new THREE.Mesh(dgeo, M.cab));
  cab.add(mesh(new THREE.CylinderGeometry(.008, .008, .9, 6), M.plastic, .3, 2.5, .9));

  /* wheels (rear axle is dual) */
  const wheels = [];
  const put = (x, z, s) => { const w = wheel(s); w.position.set(x, -.98, z); g.add(w); wheels.push(w); };
  put(3.55, 1.06, 1); put(3.55, -1.06, -1); put(-1.2, 1.04, 1); put(-1.2, -1.04, -1); put(-1.2, .68, 1); put(-1.2, -.68, -1);
  return { g, setDoors, wheels };
}

/* ───────────────────────── cargo aircraft ─────────────────────────
   Nose toward +x, fuselage axis at y = 2.9, ground at y = -1.6. Cargo door on the +z side. */
export function makeJet(T){
  const g = new THREE.Group(), CY = 2.9, R = 2.3;
  const prof = [[.02, -15], [.45, -14.3], [1.0, -12.8], [1.6, -10.4], [2.08, -7.4], [R, -4.2], [R, 8], [2.2, 9.9], [1.93, 11.5], [1.45, 12.85], [.85, 13.65], [.28, 14.08], [0, 14.15]];
  const lathe = (pts, seg = 40, ps = 0, pl = Math.PI * 2, k = 1) => { const geo = new THREE.LatheGeometry(V2(pts.map(([r, y]) => [r * k, y])), seg, ps, pl); geo.rotateZ(-Math.PI / 2); return geo; };
  const lift = x => (x < -5 ? ((-5 - x) / 10) ** 2 * 1.5 : 0);   // the tail sweeps up
  const sweep = geo => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + lift(p.getX(i))); geo.computeVertexNormals(); return geo; };
  g.add(mesh(sweep(lathe(prof, 56)), M.jet, 0, CY, 0));
  // grey belly, ink cheat-lines
  g.add(mesh(sweep(lathe(prof.slice(1, 12), 20, Math.PI / 2 - .62, 1.24, 1.003)), M.jetBelly, 0, CY, 0));
  for (const ps of [.2, Math.PI - .2 - .05]) g.add(mesh(sweep(lathe(prof.slice(2, 10), 6, ps, .05, 1.005)), M.ink, 0, CY, 0));

  /* cockpit: six framed panes wrapped round the nose */
  { const [c, x] = canvas(1024, 256); x.fillStyle = '#F7F6F2'; x.fillRect(0, 0, 1024, 256);
    for (const [px, w] of [[40, 150], [200, 150], [362, 142], [520, 142], [674, 150], [834, 150]]){
      x.fillStyle = '#0b0b0b'; x.beginPath(); x.roundRect(px - 6, 34, w + 12, 188, 22); x.fill();
      const gr = x.createLinearGradient(0, 40, 0, 216); gr.addColorStop(0, '#0e161b'); gr.addColorStop(.6, '#2c3d47'); gr.addColorStop(1, '#6f8794'); x.fillStyle = gr; x.beginPath(); x.roundRect(px, 40, w, 176, 18); x.fill();
      x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.moveTo(px + w * .15, 216); x.lineTo(px + w * .5, 40); x.lineTo(px + w * .68, 40); x.lineTo(px + w * .33, 216); x.fill(); }
    g.add(mesh(lathe([[2.0, 11.1], [1.82, 11.9], [1.56, 12.6]], 24, Math.PI * 1.5 - 1.25, 2.5, 1.012), std(0xffffff, .12, .35, { map: toTex(c), envMapIntensity: 1.2 }), 0, CY, 0)); }
  g.add(mesh(lathe([[.87, 13.62], [.9, 13.58]], 28, 0, Math.PI * 2, 1.004), M.jetGrey, 0, CY, 0));   // radome seam

  /* cabin windows and livery — flat decals sitting just proud of the skin */
  const pane = new THREE.PlaneGeometry(.24, .34), frame = new THREE.PlaneGeometry(.3, .4), paneM = std(0x1a2a33, .1, .5), rimM = std(0xC9CCD0, .3, .8);
  const zAt = dy => Math.sqrt(R * R - dy * dy) + .012;
  for (const s of [1, -1]) for (let i = 0; i < 26; i++){
    const x = -8.6 + i * .68; if (s > 0 && x > 4.2 && x < 7.9) continue;
    const k = x < -4.2 ? (2.08 + (x + 7.4) / 3.2 * .22) / R : 1, y = CY + .42 + lift(x), z = zAt(.42) * Math.min(1, k);
    const w = mesh(pane, paneM, x, y, s * z), f = mesh(frame, rimM, x, y, s * (z - .004)); if (s < 0){ w.rotation.y = f.rotation.y = Math.PI; } g.add(f, w);
  }
  if (T.logoImg){   // wordmark on both sides, registration near the tail
    const [c, x] = canvas(1024, 256); x.drawImage(tinted(T.logoImg, 220, '#17150F'), 10, 30); x.fillStyle = '#17150F'; x.textBaseline = 'middle'; let fs = 190; do { x.font = `400 ${fs}px Fraunces, Georgia, serif`; fs -= 6; } while (fs > 40 && x.measureText('Maison').width > 750); x.fillText('Maison', 250, 134);
    const m = new THREE.MeshBasicMaterial({ map: toTex(c), transparent: true, depthWrite: false });
    const d1 = mesh(new THREE.PlaneGeometry(5.2, 1.3), m, 1.2, CY + 1.3, zAt(1.3) + .03); d1.rotation.x = -.6; g.add(d1);
    const d2 = mesh(new THREE.PlaneGeometry(5.2, 1.3), m, 2.0, CY + 1.3, -zAt(1.3) - .03); d2.rotation.set(.6, Math.PI, 0); g.add(d2);
    const [c2, x2] = canvas(512, 128); x2.fillStyle = '#17150F'; x2.font = '600 84px Inter, sans-serif'; x2.textBaseline = 'middle'; try { x2.letterSpacing = '8px'; } catch (e) {} x2.fillText('CS-MSN', 10, 68);
    const m2 = new THREE.MeshBasicMaterial({ map: toTex(c2), transparent: true, depthWrite: false });
    for (const s of [1, -1]){ const d = mesh(new THREE.PlaneGeometry(1.9, .48), m2, -9.4, CY - .5 + lift(-9.4), s * 1.84); if (s < 0) d.rotation.y = Math.PI; g.add(d); }
  }

  /* wings, flap fairings, tip lights, stabilisers, fin */
  const slab = (pts, t) => { const geo = new THREE.ExtrudeGeometry(new THREE.Shape(V2(pts)), { depth: t, bevelEnabled: true, bevelSize: .1, bevelThickness: .07, bevelSegments: 3 }); geo.rotateX(Math.PI / 2); return geo; };
  const dbl = M.jet.clone(); dbl.side = THREE.DoubleSide; const grey2 = M.jetGrey.clone(); grey2.side = THREE.DoubleSide;
  const wingG = slab([[2.2, 1.4], [-4.6, 15.2], [-6.5, 15.2], [-4.6, 1.4]], .32), stabG = slab([[-10.6, .5], [-13.8, 6.2], [-15, 6.2], [-13.6, .5]], .2);
  const flapG = slab([[-3.4, 2.2], [-5.9, 12.6], [-6.3, 12.6], [-4.5, 2.2]], .04);
  const fairG = new THREE.CapsuleGeometry(.2, 2.0, 4, 10); fairG.rotateZ(Math.PI / 2);
  const bladeM = std(0x55595e, .35, .8), fanM = std(0x15171a, .5, .6);
  for (const s of [1, -1]){
    const wg = new THREE.Group(); wg.position.y = 2.25; wg.scale.z = s; wg.rotation.x = -s * .075; g.add(wg);
    wg.add(new THREE.Mesh(wingG, dbl)); wg.add(mesh(flapG, grey2, 0, .085, 0));
    for (const z of [4.2, 8.4, 11.6]) wg.add(mesh(fairG, dbl, -3.6 - (z - 1.4) * .16, -.42, z));
    const wl = bx(1.1, 1.3, .1, M.jet, -5.85, .62, 15.25); wl.rotation.z = .42; wl.rotation.x = -.2; wg.add(wl);
    wg.add(mesh(new THREE.SphereGeometry(.11, 12, 10), s > 0 ? M.lampG : M.lampR, -4.75, -.1, 15.3));
    const st = mesh(stabG, dbl, 0, 4.4, 0); st.scale.z = s; st.rotation.x = -s * .05; g.add(st);
    // engine: nacelle, polished lip, fan with blades, spinner, exhaust, pylon
    const e = new THREE.Group(); e.position.set(.2, 1.02, s * 6.4); g.add(e);
    e.add(new THREE.Mesh(lathe([[.5, -2.1], [.86, -1.7], [1.0, -.4], [1.02, .9], [.94, 1.7], [.8, 1.95]], 32), M.jet));
    e.add(new THREE.Mesh(lathe([[.8, 1.95], [.9, 2.04], [.98, 1.9], [.94, 1.7]], 32), M.chrome));
    const fan = new THREE.CylinderGeometry(.82, .82, .05, 32); fan.rotateZ(Math.PI / 2); e.add(mesh(fan, fanM, 1.6, 0, 0));
    for (let i = 0; i < 18; i++){ const an = i / 18 * Math.PI * 2, b = bx(.03, .6, .09, bladeM, 1.64, Math.cos(an) * .47, Math.sin(an) * .47); b.rotation.x = an; e.add(b); }
    const cone = new THREE.ConeGeometry(.24, .5, 20); cone.rotateZ(-Math.PI / 2); e.add(mesh(cone, M.alu, 1.86, 0, 0));
    const exh = new THREE.ConeGeometry(.42, 1.1, 20); exh.rotateZ(Math.PI / 2); e.add(mesh(exh, M.jetGrey, -2.3, 0, 0));
    g.add(bx(2.6, .72, .2, M.jet, .1, 1.95, s * 6.4));
    // main gear with door
    g.add(bx(.22, 2.0, .22, M.jetGrey, -1.6, -.2, s * 2.7)); g.add(bx(1.4, 1.0, .05, M.jet, -1.6, .25, s * 3.05));
    for (const dz of [-.3, .3]){ const mw = new THREE.CylinderGeometry(.56, .56, .4, 20); mw.rotateX(Math.PI / 2); g.add(mesh(mw, M.rubber, -1.6, -1.04, s * 2.7 + dz)); const hub = new THREE.CylinderGeometry(.24, .24, .42, 14); hub.rotateX(Math.PI / 2); g.add(mesh(hub, M.rim, -1.6, -1.04, s * 2.7 + dz)); }
  }
  const finG = new THREE.ExtrudeGeometry(new THREE.Shape(V2([[-9.6, 5.6], [-13.9, 11.4], [-15.4, 11.4], [-13.7, 5.6]])), { depth: .3, bevelEnabled: true, bevelSize: .08, bevelThickness: .06, bevelSegments: 3 }); finG.translate(0, 0, -.15); g.add(new THREE.Mesh(finG, M.ink));
  const lm = new THREE.MeshBasicMaterial({ map: T.logoW, transparent: true, depthWrite: false });
  for (const s of [1, -1]){ const lg = mesh(new THREE.PlaneGeometry(2.6, 2.6), lm, -13.3, 8.4, s * .23); if (s < 0) lg.rotation.y = Math.PI; g.add(lg); }
  g.add(mesh(new THREE.SphereGeometry(.13, 12, 10), M.lampR, 1, CY + R + .05, 0)); g.add(mesh(new THREE.SphereGeometry(.1, 12, 10), M.lampW, -15.1, CY + 1.55, 0));
  // nose gear with doors
  g.add(bx(.2, 2.0, .2, M.jetGrey, 9.6, -.2, 0)); for (const s of [-1, 1]) g.add(bx(1.1, .7, .04, M.jet, 9.9, .35, s * .32));
  for (const dz of [-.22, .22]){ const nw = new THREE.CylinderGeometry(.42, .42, .3, 18); nw.rotateX(Math.PI / 2); g.add(mesh(nw, M.rubber, 9.6, -1.18, dz)); }

  /* cargo door: dark hold + a hatch that swings up */
  const DOORX = 6, SILL = 1.45;
  g.add(bx(3.0, 2.5, .2, std(0x0a0a0b, 1), DOORX, SILL + 1.25, 2.2));
  g.add(bx(3.1, .08, .3, M.alu, DOORX, SILL - .02, 2.28));
  const hatch = new THREE.Group(); hatch.position.set(DOORX, SILL + 2.52, 2.33);
  hatch.add(bx(3.0, 2.5, .1, M.jet, 0, -1.25, 0)); hatch.add(bx(.5, .06, .04, M.alu, 0, -2.2, .06)); g.add(hatch);
  return { g, hatch, DOORX, SILL };
}
