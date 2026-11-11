import * as THREE from 'three';
import { labelSprite } from './textures.js';
import { heroParcel, simpleParcel, blob } from './parcels.js';
import { loadLand, landDots, greatCircle } from './world.js';
import { km } from './data.js';
import { makeTruck, makeJet } from './models.js';
import { RoomEnvironment } from '../vendor/jsm/RoomEnvironment.js';

const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const keys = (K, p) => { if (p <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (p <= K[i][0]) return lerp(K[i - 1][1], K[i][1], ss(K[i - 1][0], K[i][0], p)); return K[K.length - 1][1]; };
const bounce = (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };

const GROUND = -1.6, AX = 400, MX = 800, DX = 1200, S = .6;   // S: map units per degree
const CUTS = [.56, .79, .93];
export const STEPS = [0, .225, .365, .56, .79, .93];
const flat = (c, r = .85, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };

export async function initJourney({ T, M, order }){
  await loadLand();
  T.drawLabel(order);
  const canvas = document.getElementById('gl'), section = document.getElementById('journey');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, .1, 900);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;   // soft studio reflections
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, .55));
  const sun = new THREE.DirectionalLight(0xfff6ea, 2.3); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; sun.shadow.radius = 5;
  const SUN = new THREE.Vector3(.42, .78, .46); let shSize = 0;
  const aimSun = (target, size) => { sun.target.position.copy(target); sun.position.copy(target).addScaledVector(SUN, size * 3);
    if (size !== shSize){ shSize = size; const c = sun.shadow.camera; c.left = c.bottom = -size; c.right = c.top = size; c.near = .5; c.far = size * 7; c.updateProjectionMatrix(); } };
  const catcher = (w, d, x, y, z, op = .2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.ShadowMaterial({ opacity: op })); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.userData.keep = 1; return m; };
  const dark = flat(0x151413, .6), orange = flat(0xC9CCD0, .3, .9);   // 'orange' is now brushed aluminium

  /* ═════ WORLD 1 — atelier: pack, conveyor, van, road ═════ */
  const w1 = new THREE.Group(); scene.add(w1);
  const hero = heroParcel(M); const parcel = hero.group; scene.add(parcel); hero.gift.visible = false;
  // folded garments + tissue
  const rr = (w, d, r) => { const s = new THREE.Shape(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const foldGeo = new THREE.ExtrudeGeometry(rr(1.0, .78, .1), { depth: .1, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 3 }); foldGeo.rotateX(-Math.PI / 2);
  const shown = order.items.slice(0, 5);
  const folds = shown.map((it, i) => {
    const g = new THREE.Group(), c = new THREE.Color(it.color);
    g.add(new THREE.Mesh(foldGeo, flat(c, .95)));
    const collar = box(.34, .03, .16, flat(c.clone().lerp(new THREE.Color(0xffffff), .28), .9), 0, .135, -.22); g.add(collar);
    const tag = box(.12, .012, .2, flat(0xF4F1EB), .3, .135, .12); tag.rotation.y = .3; g.add(tag);
    g.userData = { y1: .34 + i * .15, ry: (i % 2 ? 1 : -1) * (.06 + i * .03), t0: .02 + i * .013 }; parcel.add(g); return g;
  });
  const filler = box(1.2, .3, .96, flat(0xEDE7DB, 1), 0, .17, 0); parcel.add(filler);
  const tissue = new THREE.Mesh(new THREE.PlaneGeometry(1.16, .92, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: .93 }));
  { const pa = tissue.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 9) * .012 + Math.cos(pa.getY(i) * 11) * .012); tissue.geometry.computeVertexNormals(); }
  tissue.rotation.x = -Math.PI / 2; parcel.add(tissue);
  { const seal = new THREE.Mesh(new THREE.CircleGeometry(.12, 28), new THREE.MeshBasicMaterial({ map: T.seal })); seal.position.z = .02; seal.userData.keep = 1; tissue.add(seal); }
  // conveyor: anodised aluminium frame, pale belt, slim ink scan arch
  const BL = 22, BW = 2.3, RIB = .5;
  const alu = flat(0xD3D5D8, .42, .55), steelD = flat(0x3A3835, .5, .5), inkM = flat(0x1A1816, .45), roll = flat(0x9A9DA1, .35, .8);
  T.belt.repeat.set(BL / RIB, 1); const beltMat = new THREE.MeshStandardMaterial({ map: T.belt, color: 0xD2D0CC, roughness: .95 });
  w1.add(new THREE.Mesh(new THREE.BoxGeometry(BL, .08, BW), [alu, alu, beltMat, steelD, alu, alu]).translateY(-.04));
  const tube = (r, len, mat, x, y, z, axis) => { const g = new THREE.CylinderGeometry(r, r, len, 18); if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m; };
  for (const s of [-1, 1]){
    w1.add(box(BL + .3, .3, .1, alu, 0, -.12, s * (BW / 2 + .06)));                       // side beams
    w1.add(box(BL + .3, .03, .16, alu, 0, .045, s * (BW / 2 + .06)));                      // top lip
    w1.add(tube(.028, BL, alu, 0, .3, s * (BW / 2 + .09), 'x'));                           // guide rail
    for (let x = -BL / 2 + .6; x < BL / 2; x += 1.8) w1.add(box(.035, .28, .035, alu, x, .17, s * (BW / 2 + .09)));
    w1.add(tube(.15, .12, roll, s * (BL / 2 + .02), -.12, BW / 2 + .13, 'z')); w1.add(tube(.15, .12, roll, s * (BL / 2 + .02), -.12, -BW / 2 - .13, 'z'));
  }
  for (const x of [-BL / 2, BL / 2]) w1.add(tube(.11, BW, roll, x, -.115, 0, 'z'));       // end drums
  for (let x = -BL / 2 + 1.1; x < BL / 2; x += 2.2) w1.add(tube(.045, BW, roll, x, -.3, 0, 'z'));   // return rollers
  for (let x = -BL / 2 + 1; x < BL / 2; x += 3.4){                                         // H-frame legs
    for (const s of [-1, 1]){ w1.add(box(.09, 1.36, .09, steelD, x, -.94, s * (BW / 2 - .02))); w1.add(box(.26, .03, .26, steelD, x, GROUND + .015, s * (BW / 2 - .02))); }
    w1.add(box(.06, .06, BW - .1, steelD, x, -1.15, 0));
  }
  const GX = 3.5, gate = new THREE.Group(); gate.position.x = GX; w1.add(gate);
  for (const s of [-1, 1]){ gate.add(box(.12, 4.1, .12, inkM, 0, .45, s * (BW / 2 + .34))); gate.add(box(.3, .03, .3, inkM, 0, GROUND + .015, s * (BW / 2 + .34))); }
  const signMat = new THREE.MeshStandardMaterial({ map: T.sign, roughness: .45 });
  gate.add(new THREE.Mesh(new THREE.BoxGeometry(.3, .58, BW + .8), [signMat, signMat, inkM, inkM, inkM, inkM]).translateY(2.6));
  gate.add(box(.07, .04, BW + .2, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xFFF1D6, emissiveIntensity: 1.2 }), 0, 2.29, 0));
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xFFF3DC, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(BW + .1, 2.26), beamMat); beam.rotation.y = Math.PI / 2; beam.position.y = 1.14; beam.userData.keep = 1; gate.add(beam);
  const others = [[-7.6, 1.0, .8, .9], [-5.0, .85, 1.0, .8], [-2.6, 1.15, .78, .95]].map(([ox, w, h, d], i) => { const b = simpleParcel(M, w, h, d); b.rotation.y = i % 2 ? .12 : -.1; b.userData.ox = ox; w1.add(b); return b; });
  // van + road
  const TX0 = BL / 2 + 3.0, truck = makeTruck(T); truck.g.position.x = TX0; w1.add(truck.g);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(260, 6.4), new THREE.MeshBasicMaterial({ color: 0x2B2A2C })); road.rotation.x = -Math.PI / 2; road.position.set(BL / 2 + 130.5, GROUND, 0); w1.add(road);
  const dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, .14), new THREE.MeshBasicMaterial({ color: 0xF2EFEA }), 60), dm = new THREE.Object3D();
  for (let i = 0; i < 60; i++){ dm.position.set(BL / 2 + 6 + i * 4.2, GROUND + .012, 0); dm.rotation.x = -Math.PI / 2; dm.updateMatrix(); dashes.setMatrixAt(i, dm.matrix); } w1.add(dashes);
  const blobGeo = new THREE.IcosahedronGeometry(1, 2);
  for (const zz of [-3.05, 3.05]){ const e = new THREE.Mesh(new THREE.PlaneGeometry(260, .12), new THREE.MeshBasicMaterial({ color: 0xF2EFEA })); e.rotation.x = -Math.PI / 2; e.position.set(BL / 2 + 130.5, GROUND + .012, zz); w1.add(e); }
  let sd = 5; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
  const leaf = [flat(0x3E7D4F, .9), flat(0x4F9160, .9), flat(0x2F6A44, .9)], trunk = flat(0x6b4a2d), bcol = [0xE9D9C4, 0xD9C9B8, 0xE6CFC0, 0xCFd6d2];
  for (let x = 30; x < 118; x += 4 + rnd() * 5){
    const z = -11 - rnd() * 12;
    if (rnd() > .42){ const h = 2.2 + rnd() * 1.6, r = 1.1 + rnd() * .7; w1.add(box(.26, h, .26, trunk, x, GROUND + h / 2, z));
      for (const [ox, oy, oz, k] of [[0, 0, 0, 1], [.7, -.3, .3, .72], [-.6, -.2, -.4, .78], [.1, .7, -.2, .66]]){ const c = new THREE.Mesh(blobGeo, leaf[Math.floor(rnd() * 3)]); c.scale.setScalar(r * k); c.position.set(x + ox * r, GROUND + h + r * .5 + oy * r, z + oz * r); w1.add(c); } }
    else { const w = 3 + rnd() * 4, h = 2 + rnd() * 3; w1.add(box(w, h, 3 + rnd() * 2, flat(bcol[Math.floor(rnd() * 4)], .95), x, GROUND + h / 2, z - 2)); }
  }
  const heroShadow = blob(M, 3.0, 2.4, .0); scene.add(heroShadow);
  w1.add(catcher(420, 90, 150, GROUND + .02, 0));

  /* ═════ WORLD 2 — airport ═════ */
  const air = new THREE.Group(); air.position.x = AX; scene.add(air);
  const apron = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.MeshBasicMaterial({ color: 0xE4E0D9 })); apron.rotation.x = -Math.PI / 2; apron.position.y = GROUND; air.add(apron);
  air.add(catcher(260, 200, 30, GROUND + .03, 0, .22));
  const yl = new THREE.MeshBasicMaterial({ color: 0xC9C3B6 });
  for (const [x, z, w, d] of [[0, 18, 120, .18], [6, 12, .18, 12], [-16, 9, .18, 18]]){ const l = new THREE.Mesh(new THREE.PlaneGeometry(w, d), yl); l.rotation.x = -Math.PI / 2; l.position.set(x, GROUND + .01, z); air.add(l); }
  const J = makeJet(T), jet = J.g, hatch = J.hatch, DOORX = J.DOORX, SILL = J.SILL; air.add(jet);
  // belt loader
  const loader = new THREE.Group(); air.add(loader);
  const LZ0 = 2.6, LZ1 = 9.6, LY1 = -.3, slope = Math.atan2(SILL - LY1, LZ1 - LZ0), LL = Math.hypot(SILL - LY1, LZ1 - LZ0);
  T.belt.wrapS = T.belt.wrapT = THREE.RepeatWrapping;
  const lb = new THREE.Mesh(new THREE.BoxGeometry(1.5, .14, LL + .3), [dark, dark, new THREE.MeshStandardMaterial({ color: 0x1f1f23, roughness: .9 }), dark, dark, dark]);
  lb.position.set(DOORX, (SILL + LY1) / 2 - .08, (LZ0 + LZ1) / 2); lb.rotation.x = slope; loader.add(lb);
  for (const s of [-1, 1]){ const r = box(.08, .2, LL + .3, orange, DOORX + s * .8, (SILL + LY1) / 2 - .02, (LZ0 + LZ1) / 2); r.rotation.x = slope; loader.add(r); }
  loader.add(box(1.9, .7, 3.4, flat(0xECE9E3, .4), DOORX, -.95, 7.6)); loader.add(box(.14, 1.7, .14, dark, DOORX - .5, .2, 4.2)); loader.add(box(.14, 1.7, .14, dark, DOORX + .5, .2, 4.2));
  for (const z of [6.4, 8.8]) for (const s of [-1, 1]){ const w = new THREE.CylinderGeometry(.36, .36, .3, 14); w.rotateZ(Math.PI / 2); loader.add(new THREE.Mesh(w, dark).translateX(DOORX + s * 1.0).translateY(-1.24).translateZ(z)); }
  const truckB = makeTruck(T); truckB.g.rotation.y = -Math.PI / 2; truckB.g.position.set(DOORX, 0, LZ1 + .3 + 2.7); truckB.setDoors(1); air.add(truckB.g);

  /* ═════ WORLD 3 — the flight map ═════ */
  const map = new THREE.Group(); map.position.x = MX; scene.add(map);
  const dots = landDots(1.5), dg = new THREE.CircleGeometry(.3, 12); dg.rotateX(-Math.PI / 2);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xB9B5AE, transparent: true });
  const dotMesh = new THREE.InstancedMesh(dg, dotMat, dots.length); const d3 = new THREE.Object3D();
  dots.forEach(([lon, lat], i) => { d3.position.set(lon * S, 0, -lat * S); d3.updateMatrix(); dotMesh.setMatrixAt(i, d3.matrix); }); dotMesh.frustumCulled = false; map.add(dotMesh);
  const O = order.origin, Dd = order.dest, FN = 120, gc = greatCircle(O, Dd, FN), dist = km(O, Dd);
  const P = gc.map(([lon, lat]) => new THREE.Vector3(lon * S, .12, -lat * S));
  const rib = new Float32Array((FN + 1) * 6), ri = [];
  P.forEach((p, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(FN, i + 1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, w = .22;
    rib.set([p.x + nx * w, p.y, p.z + nz * w, p.x - nx * w, p.y, p.z - nz * w], i * 6); if (i < FN){ const q = i * 2; ri.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); } });
  const ribGeo = new THREE.BufferGeometry(); ribGeo.setAttribute('position', new THREE.BufferAttribute(rib, 3)); ribGeo.setIndex(ri);
  const ribbon = new THREE.Mesh(ribGeo, new THREE.MeshBasicMaterial({ color: 0x17150F, side: THREE.DoubleSide })); ribbon.frustumCulled = false; map.add(ribbon);
  const ghostLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(P), new THREE.LineDashedMaterial({ color: 0x141210, dashSize: .5, gapSize: .5, transparent: true, opacity: .35 })); ghostLine.computeLineDistances(); map.add(ghostLine);
  const xs = P.map(p => p.x), zs = P.map(p => p.z), bx0 = Math.min(...xs), bx1 = Math.max(...xs), bz0 = Math.min(...zs), bz1 = Math.max(...zs);
  const mcx = (bx0 + bx1) / 2, mcz = (bz0 + bz1) / 2;
  let mapH = 60;
  const cityMat = new THREE.MeshBasicMaterial({ color: 0x17150F, transparent: true }), cgeo = new THREE.CircleGeometry(.55, 24); cgeo.rotateX(-Math.PI / 2);
  const rgeo = new THREE.RingGeometry(.9, 1.0, 40); rgeo.rotateX(-Math.PI / 2);
  const rings = [], sprites = [];
  [[O, P[0]], [Dd, P[FN]]].forEach(([c, p], i) => {
    const d = new THREE.Mesh(cgeo, cityMat); d.position.set(p.x, .2, p.z); map.add(d);
    for (let k = 0; k < 2; k++){ const r = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({ color: 0x17150F, transparent: true, depthWrite: false })); r.position.set(p.x, .15, p.z); r.userData.ph = k * .5 + i * .2; map.add(r); rings.push(r); }
    const tx = labelSprite(c.city.toUpperCase(), true), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthTest: false }));
    sp.center.set(i ? 0 : 1, .5); sp.position.set(p.x + (i ? 1 : -1) * 1.2, 1, p.z - 1.4); sp.renderOrder = 5; sp.userData.i = i; map.add(sp); sprites.push(sp);
  });
  const pl = new THREE.Group(), pmat = flat(0x141210, .5);
  { const f = new THREE.CapsuleGeometry(.42, 4.6, 6, 12); f.rotateZ(Math.PI / 2); pl.add(new THREE.Mesh(f, pmat));
    const a = (g, x, z, ry) => { const m = new THREE.Mesh(g, pmat); m.position.set(x, 0, z); m.rotation.y = ry; pl.add(m); };
    a(new THREE.BoxGeometry(1.5, .12, 3.6), -.1, 2.0, -.32); a(new THREE.BoxGeometry(1.5, .12, 3.6), -.1, -2.0, .32); a(new THREE.BoxGeometry(.8, .1, 1.3), -2.3, .8, -.3); a(new THREE.BoxGeometry(.8, .1, 1.3), -2.3, -.8, .3); }
  map.add(pl);
  const pShadow = blob(M, 5, 5, .35); map.add(pShadow);

  /* ═════ WORLD 4 — the doorstep ═════ */
  const door = new THREE.Group(); door.position.x = DX; scene.add(door);
  const paint = (w, h, fn, rx = 1, ry = 1) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  // painted brick wall, stone paving
  const brickT = paint(512, 512, (x, w, h) => { x.fillStyle = '#EDE5D6'; x.fillRect(0, 0, w, h); const bh = h / 8, bw = w / 4;
    for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++){ const ox = c * bw + (r % 2 ? bw / 2 : 0), v = ((r * 7 + c * 13) % 5) - 2; x.fillStyle = `rgba(${v > 0 ? '255,250,240' : '120,100,70'},${Math.abs(v) * .018})`; x.fillRect(ox + 2, r * bh + 2, bw - 4, bh - 4); }
    x.fillStyle = 'rgba(110,92,64,.26)'; for (let r = 0; r <= 8; r++) x.fillRect(0, r * bh - 1, w, 2.5);
    for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) x.fillRect(c * bw + (r % 2 ? bw / 2 : 0) - 1, r * bh, 2.5, bh); }, 30, 12);
  const paveT = paint(512, 512, (x, w, h) => { x.fillStyle = '#EAE7E1'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++){ x.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.035)'; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 2); }
    x.fillStyle = 'rgba(90,84,74,.2)'; x.fillRect(0, 0, w, 3); x.fillRect(0, h / 2, w / 2, 3); x.fillRect(0, 0, 3, h); x.fillRect(w / 2, 0, 3, h / 2); x.fillRect(w / 4, h / 2, 3, h / 2); x.fillRect(w * .75, h / 2, 3, h / 2); x.fillRect(w / 2, h / 2, w / 2, 3); }, 16, 8);
  const wallM = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshStandardMaterial({ map: brickT, color: 0xD9D2C4, roughness: .95 })); wallM.position.set(0, 10, -.12); door.add(wallM);
  const floorM = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ map: paveT, color: 0xCFCCC6, roughness: .9 })); floorM.rotation.x = -Math.PI / 2; floorM.position.z = 14.8; door.add(floorM);
  const stone = flat(0xC9C3B7, .85), trim = flat(0xE6E2DA, .55), inkDoor = flat(0x1B2420, .42), inkDoor2 = flat(0x131A17, .5), brass = flat(0xC9A24B, .28, .85), ironM = flat(0x161616, .5, .4);
  door.add(box(60, .55, .1, stone, 0, .275, -.08)); door.add(box(60, .05, .14, stone, 0, .57, -.07));          // plinth course
  // everything on the step is raised with it
  const SH = .18, porch = new THREE.Group(); porch.position.y = SH; door.add(porch);
  door.add(box(3.6, SH, 1.7, stone, 0, SH / 2, .72)); door.add(box(3.9, SH / 2, 2.0, stone, 0, SH / 4, .86));    // two stone steps
  // door case: pilasters, entablature, cornice, transom light
  for (const s of [-1, 1]){ porch.add(box(.26, 3.74, .2, trim, s * 1.12, 1.87, -.02)); porch.add(box(.34, .16, .26, trim, s * 1.12, .08, 0)); porch.add(box(.34, .12, .26, trim, s * 1.12, 3.68, 0)); }
  porch.add(box(2.7, .3, .24, trim, 0, 3.89, -.01)); porch.add(box(2.96, .09, .36, trim, 0, 4.08, .03)); porch.add(box(2.5, .04, .28, trim, 0, 3.72, .01));
  const glow = new THREE.MeshStandardMaterial({ color: 0xFFF1D2, emissive: 0xE8B878, emissiveIntensity: .35, roughness: .3 });
  porch.add(box(1.92, .46, .04, glow, 0, 3.47, -.03)); porch.add(box(2.0, .05, .08, trim, 0, 3.22, .0));
  for (const x of [-.48, 0, .48]) porch.add(box(.035, .46, .06, trim, x, 3.47, 0));
  // the door: frame, leaf, six panels, brass furniture
  porch.add(box(2.0, 3.2, .1, inkDoor2, 0, 1.6, -.06)); porch.add(box(1.76, 3.14, .1, inkDoor, 0, 1.57, 0));
  for (const [px, py, pw, ph] of [[-.42, 2.62, .6, .62], [.42, 2.62, .6, .62], [-.42, 1.72, .6, .95], [.42, 1.72, .6, .95], [-.42, .62, .6, .86], [.42, .62, .6, .86]]){
    porch.add(box(pw, ph, .03, inkDoor2, px, py, .05)); porch.add(box(pw - .12, ph - .12, .04, inkDoor, px, py, .056)); }
  const knocker = new THREE.Group(); knocker.position.set(0, 2.24, .07); porch.add(knocker);
  knocker.add(new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .03, 20).rotateX(Math.PI / 2), brass));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.085, .016, 10, 28), brass); ring.position.set(0, -.085, .03); knocker.add(ring);
  porch.add(box(.46, .1, .025, brass, 0, 1.2, .062)); porch.add(box(.38, .035, .03, inkDoor2, 0, 1.2, .07));                 // letter slot
  porch.add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .02, 20).rotateX(Math.PI / 2), brass).translateX(.7).translateY(1.5).translateZ(.06));
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.058, 18, 14), brass); knob.position.set(.7, 1.5, .12); porch.add(knob);
  porch.add(box(.05, .12, .02, brass, .7, 1.3, .06));                                                                         // keyhole plate
  for (const y of [.5, 1.57, 2.7]) porch.add(box(.05, .2, .05, brass, -.9, y, .04));                                           // hinges
  porch.add(box(1.76, .09, .12, brass, 0, .045, .02));                                                                        // brass threshold
  // house number tile + bell
  const numT = paint(256, 256, (x, w, h) => { x.fillStyle = '#F7F4EE'; x.fillRect(0, 0, w, h); x.strokeStyle = '#17150F'; x.lineWidth = 6; x.strokeRect(14, 14, w - 28, h - 28); x.fillStyle = '#17150F'; x.font = '400 150px Fraunces, Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('24', w / 2, h / 2 + 8); });
  porch.add(new THREE.Mesh(new THREE.BoxGeometry(.42, .42, .03), [trim, trim, trim, trim, new THREE.MeshStandardMaterial({ map: numT, roughness: .35 }), trim]).translateX(1.72).translateY(2.2).translateZ(-.1));
  porch.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .02, 20).rotateX(Math.PI / 2), brass).translateX(1.72).translateY(1.55).translateZ(-.1)); porch.add(new THREE.Mesh(new THREE.SphereGeometry(.024, 12, 10), flat(0xF7F4EE, .3)).translateX(1.72).translateY(1.55).translateZ(-.085));
  // wall lantern, lit
  const lan = new THREE.Group(); lan.position.set(-1.56, 2.62, .12); porch.add(lan);
  lan.add(box(.1, .3, .04, ironM, 0, .05, -.2)); lan.add(box(.04, .04, .24, ironM, 0, .18, -.1));
  lan.add(box(.2, .34, .2, new THREE.MeshStandardMaterial({ color: 0xFFF3DC, emissive: 0xF0B060, emissiveIntensity: .7, roughness: .2 }), 0, -.05, 0));
  for (const [x, z] of [[-.1, -.1], [.1, -.1], [-.1, .1], [.1, .1]]) lan.add(box(.02, .36, .02, ironM, x, -.05, z));
  lan.add(box(.26, .03, .26, ironM, 0, .135, 0)); lan.add(box(.24, .03, .24, ironM, 0, -.235, 0)); const cap = new THREE.Mesh(new THREE.ConeGeometry(.17, .14, 4), ironM); cap.rotation.y = Math.PI / 4; cap.position.y = .22; lan.add(cap);
  const lampL = new THREE.PointLight(0xffd9a6, 1.6, 6, 2); lampL.position.set(-1.56, 2.6 + SH, .5); door.add(lampL);
  // sash window with sill
  const winT = paint(256, 320, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6c8290'); g.addColorStop(.5, '#33434c'); g.addColorStop(1, '#1a2227'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(247,244,238,.5)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * .34, 0); x.quadraticCurveTo(w * .26, h * .6, w * .06, h); x.lineTo(0, h); x.fill(); x.beginPath(); x.moveTo(w, 0); x.lineTo(w * .66, 0); x.quadraticCurveTo(w * .74, h * .6, w * .94, h); x.lineTo(w, h); x.fill();
    const r = x.createLinearGradient(0, 0, w, h); r.addColorStop(.3, 'rgba(255,255,255,0)'); r.addColorStop(.45, 'rgba(255,255,255,.18)'); r.addColorStop(.6, 'rgba(255,255,255,0)'); x.fillStyle = r; x.fillRect(0, 0, w, h); });
  const sash = new THREE.Group(); sash.position.set(3.75, 2.55, -.1); porch.add(sash);
  sash.add(box(1.9, 2.5, .08, trim, 0, 0, 0)); sash.add(new THREE.Mesh(new THREE.PlaneGeometry(1.62, 2.22), new THREE.MeshStandardMaterial({ map: winT, roughness: .08, metalness: .4 })).translateZ(.045));
  sash.add(box(1.66, .07, .06, trim, 0, 0, .06)); for (const x of [-.27, .27]) sash.add(box(.035, 2.22, .05, trim, x, 0, .055)); for (const y of [-.56, .56]) sash.add(box(1.62, .035, .05, trim, 0, y, .055));
  sash.add(box(2.2, .1, .3, stone, 0, -1.3, .08)); sash.add(box(2.1, .2, .16, trim, 0, 1.36, .02));
  // plants: snake plant in a ceramic pot, clipped box ball in an ink planter
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(.33, .24, .56, 28), flat(0xD9D3C7, .6)); pot.position.set(-1.95, .28, .7); door.add(pot);
  door.add(new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .05, 28), flat(0xCFC8BB, .6)).translateX(-1.95).translateY(.555).translateZ(.7));
  [[0, 1.5, 0, 0], [.1, 1.25, .16, -.14], [-.1, 1.3, -.2, .12], [.02, 1.05, .1, .26], [-.04, 1.15, -.08, -.24], [.12, .9, .28, .1], [-.13, .8, -.3, -.1]].forEach(([ox, h, rz, rx], i) => {
    const g = new THREE.ConeGeometry(.085, h, 5); g.translate(0, h / 2, 0); const lf = new THREE.Mesh(g, i % 2 ? leaf[2] : leaf[1]); lf.scale.z = .45; lf.position.set(-1.95 + ox, .56, .7 + ox * .5); lf.rotation.set(rx, i, rz); door.add(lf); });
  door.add(box(.62, .62, .62, flat(0x1C1A17, .6), 1.95, .31, .75)); door.add(box(.54, .03, .54, flat(0x3a2a1c, 1), 1.95, .62, .75));
  for (const [ox, oy, oz, k] of [[0, 0, 0, 1], [.16, .1, .1, .7], [-.15, .08, -.1, .72], [.02, .22, -.04, .66]]){ const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.42 * k, 2), leaf[ox > 0 ? 0 : ox < 0 ? 2 : 1]); b.position.set(1.95 + ox, 1.0 + oy, .75 + oz); door.add(b); }
  const sp1 = blob(M, 1.6, 1.2, .35); sp1.visible = false; door.add(sp1);
  const fm = flat(0x8f7f63); const matMesh = new THREE.Mesh(new THREE.BoxGeometry(1.75, .035, 1.05), [fm, fm, new THREE.MeshStandardMaterial({ map: T.mat, roughness: 1 }), fm, fm, fm]); matMesh.position.set(.05, .018, .95); porch.add(matMesh);
  const dBox = simpleParcel(M, 1.05, .82, .88); dBox.rotation.y = -.22; dBox.position.set(.05, .036, .92); porch.add(dBox);
  const dShadow = blob(M, 2.2, 1.8, .5); dShadow.visible = false; door.add(dShadow);

  scene.traverse(o => { if (!o.isMesh || o.userData.keep) return; const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (m.isMeshStandardMaterial && !m.transparent){ o.castShadow = true; o.receiveShadow = true; } });
  map.traverse(o => { o.castShadow = false; });

  /* ═════ cameras ═════ */
  const C1 = [
    [0.00, [-.1, 5.4, 4.6], [-.1, .7, 0]], [0.085, [0, 4.6, 5.4], [0, .75, 0]], [0.12, [0, 3.4, 6.6], [0, .8, 0]], [0.15, [-1.25, 3.2, 6.3], [-1.25, .75, 0]], [0.195, [-1.35, 4.7, 5.0], [-1.35, .7, 0]],
    [0.25, [8.2, 4.6, 9.2], [1.7, .35, 0]], [0.315, [10.5, 4.8, 9.2], [5, .5, 0]], [0.37, [5.6, 3.6, 9.2], [11.6, 1.0, 0]], [0.42, [6.2, 4.2, 11.5], [12.6, 1.0, 0]]
  ];
  const C2 = [
    [0.56, [AX + 34, 12, 38], [AX + 2, 2.5, 3]], [0.61, [AX + 20, 6, 24], [AX + 6, .6, 9]], [0.665, [AX + 17, 5.5, 17], [AX + 6, 1.0, 5.5]],
    [0.715, [AX + 14, 5.6, 13], [AX + 6, 2.0, 2.6]], [0.745, [AX + 16, 7, 40], [AX + 3, 3, 0]]
  ];
  const C4 = [[0.93, [DX + .6, 3.0, 13.5], [DX + .5, 2.1, 0]], [0.965, [DX - .9, 2.9, 9.6], [DX - .1, 1.75, .3]], [1.00, [DX - 1.9, 2.5, 8.6], [DX - .35, 1.7, .3]]];
  const v3 = (K, p, idx, out) => { let i = 1; while (i < K.length - 1 && p > K[i][0]) i++; const a = K[i - 1], b = K[i], t = ss(a[0], b[0], p); out.set(lerp(a[idx][0], b[idx][0], t), lerp(a[idx][1], b[idx][1], t), lerp(a[idx][2], b[idx][2], t)); };
  const tgt = new THREE.Vector3(), tmp = new THREE.Vector3();

  /* ═════ DOM ═════ */
  const $ = id => document.getElementById(id);
  const copies = [...section.querySelectorAll('.j-copy')].map(el => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
  const fade = (el, o, ty = 0) => { el.style.opacity = o; el.style.transform = ty ? `translateY(${ty}px)` : ''; el.style.visibility = o < .01 ? 'hidden' : ''; };
  const win = (a, b, p, e = .014) => ss(a, a + e, p) * (1 - ss(b - e, b, p));
  const cut = $('cut'), scanCard = $('scanCard'), flightCard = $('flightCard'), toast = $('toast'), flMi = $('flMi'), hudBar = $('hudBar'), stepEls = [...$('steps').children];

  let W = 0, H = 0, aspect = 1.6;
  function resize(){ W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return; aspect = W / H; renderer.setSize(W, H, false); cam.aspect = aspect; cam.fov = 30 * cl(1.6 / aspect, 1, 1.7); cam.updateProjectionMatrix();
    const t = Math.tan(cam.fov * Math.PI / 360); mapH = Math.max(34, (bx1 - bx0) * 1.3 / (2 * t * aspect), (bz1 - bz0) * 1.45 / (2 * t)) + 6; }
  addEventListener('resize', resize); resize();

  let p = 0, last = -1;
  const progress = () => { const r = section.getBoundingClientRect(); return r.height ? cl(-r.top / (r.height - innerHeight)) : 0; };

  function update(time){
    if (!W) resize(); if (!W) return;
    const pT = progress(); p += (pT - p) * .11; if (Math.abs(pT - p) < .00005) p = pT;

    for (const c of copies){ const o = win(c.a, c.b, p); fade(c.el, o, (1 - o) * 24); }
    fade(scanCard, win(.255, .33, p)); fade(flightCard, win(.805, .925, p)); fade(toast, win(.965, 1.2, p), (1 - win(.965, 1.2, p)) * -16);
    cut.style.opacity = Math.max(...CUTS.map(c => 1 - cl(Math.abs(p - c) / .011)));
    hudBar.style.width = (p * 100).toFixed(2) + '%';
    let si = 0; STEPS.forEach((s, i) => { if (p >= s) si = i; }); stepEls.forEach((el, i) => { el.classList.toggle('done', i < si); el.classList.toggle('now', i === si); });

    const world = p < CUTS[0] ? 1 : p < CUTS[1] ? 2 : p < CUTS[2] ? 3 : 4;
    if (world !== 1){ hero.setFlaps(1); hero.setTape(1); hero.setLabel(1); folds.forEach(g => g.visible = false); tissue.visible = false; filler.visible = false; }
    w1.visible = world === 1; air.visible = world === 2; map.visible = world === 3; door.visible = world === 4; heroShadow.visible = false;

    if (world === 1){
      /* packing */
      folds.forEach(g => { const k = cl((p - g.userData.t0) / .035), e = 1 - (1 - k) ** 3; g.visible = k > 0; g.position.y = lerp(3.6, g.userData.y1, e); g.rotation.y = g.userData.ry + (1 - e) * 1.2; g.rotation.z = (1 - e) * .5; });
      const tk = cl((p - .088) / .02); tissue.visible = tk > 0; tissue.position.y = lerp(2.6, .38 + shown.length * .15 + .04, 1 - (1 - tk) ** 3); tissue.rotation.z = (1 - tk) * .6;
      const closed = ss(.108, .142, p); hero.setFlaps(closed); hero.setTape(cl((p - .142) / .028)); hero.setLabel(cl((p - .168) / .04));
      filler.visible = closed < 1; if (closed >= 1){ folds.forEach(g => g.visible = false); tissue.visible = false; }
      /* belt → van */
      const beltS = cl((p - .225) / .11) * (BL / 2) + ss(.335, .385, p) * 2.5;
      const drive = ss(.425, .56, p); const d2 = drive * drive * 92, tx = TX0 + d2;
      truck.g.position.x = tx; truck.setDoors(1 - ss(.39, .418, p)); truck.wheels.forEach(w => { w.rotation.z = -d2 / .62; });
      truck.g.position.y = drive > 0 && drive < 1 ? Math.sin(time * 22) * .012 : 0;
      parcel.visible = true; parcel.position.set(p < .42 ? beltS : tx - .5, 0, 0);
      const wob = 1 - ss(.19, .225, p);
      parcel.rotation.set(0, keys([[0, -.38], [.1, -.5], [.15, -.86], [.195, .3], [.225, 0]], p) + Math.sin(time * .5) * .05 * wob, 0);
      T.belt.offset.x = -beltS / RIB;
      others.forEach(b => { b.position.x = b.userData.ox + beltS; b.visible = b.position.x < BL / 2 - .7; });
      const gd = Math.min(...others.map(b => Math.abs(b.position.x - GX)), Math.abs(beltS - GX)); beamMat.opacity = Math.exp(-gd * gd * 2.2) * .5;
      if (p < .42){ v3(C1, p, 1, cam.position); v3(C1, p, 2, tgt); }
      else { const k = ss(.42, .475, p); cam.position.set(tx + lerp(6.2 - TX0, 8.5, k), lerp(4.2, 3.4, k), lerp(11.5, 14, k)); tgt.set(tx + lerp(12.6 - TX0, 1.2, k), lerp(1.0, .5, k), 0); }
    } else if (world === 2){
      const u = cl((p - .60) / .115); let z, y, rx = 0;
      if (u < .22){ const k = u / .22; z = lerp(LZ1 + 2.9, LZ1 - .1, k); y = lerp(0, LY1 + .05, ss(.6, 1, k)); rx = slope * ss(.7, 1, k); }
      else if (u < .86){ const k = (u - .22) / .64; z = lerp(LZ1 - .1, LZ0 + .2, k); y = SILL - (z - LZ0) * Math.tan(slope) + .07; rx = slope; }
      else { const k = (u - .86) / .14; z = lerp(LZ0 + .2, .7, k); y = SILL + .02; rx = slope * (1 - ss(0, .5, k)); }
      parcel.visible = z > 1.9; parcel.position.set(AX + DOORX, y, z); parcel.rotation.set(rx, 0, 0);
      hatch.rotation.x = -1.95 * (1 - ss(.716, .738, p));
      const t = cl((p - .742) / .048), run = t * t * 150; jet.position.set(run, Math.max(0, t - .55) ** 2 * 110, 0); jet.rotation.z = ss(.5, .85, t) * .2;
      loader.visible = truckB.g.visible = true;
      if (p < .745){ v3(C2, p, 1, cam.position); v3(C2, p, 2, tgt); }
      else { const k = ss(.745, .79, p); cam.position.set(AX + 16 + run * .55, 7 + k * 6, 40 + k * 10); tgt.set(AX + 3 + run, 3 + jet.position.y * .9, 0); }
    } else if (world === 3){
      parcel.visible = false;
      const o = ss(.79, .815, p), f = ss(.808, .918, p); dotMat.opacity = o; cityMat.opacity = o;
      rings.forEach(r => { const ph = (time * .45 + r.userData.ph) % 1; r.scale.setScalar((.8 + ph * 2.8) * mapH / 55); r.material.opacity = (1 - ph) * .8 * o; });
      const ssz = mapH * .2; sprites.forEach(s => { s.scale.set(ssz, ssz * 96 / 512, 1); s.material.opacity = o; });
      ribGeo.setDrawRange(0, Math.floor(f * FN) * 6);
      const fi = f * FN, i0 = Math.min(FN - 1, Math.floor(fi)), a = P[i0], b = P[i0 + 1], q = fi - i0, ps = mapH / 60;
      pl.position.set(lerp(a.x, b.x, q), .8 + Math.sin(f * Math.PI) * 1.4 * ps, lerp(a.z, b.z, q)); pl.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x); pl.scale.setScalar(.62 * ps);
      pShadow.position.set(pl.position.x + .5 * ps, .05, pl.position.z + .7 * ps); pShadow.scale.setScalar(.7 * ps); pShadow.material.opacity = .3 * o;
      flMi.textContent = Math.round(f * dist).toLocaleString('en-US');
      // start near the origin, pull back to the whole route, settle toward the destination
      const zoom = lerp(.62, 1, ss(.79, .85, p)) * lerp(1, .8, ss(.895, .93, p)), fx = lerp(P[0].x, mcx, ss(.79, .85, p)), fz = lerp(P[0].z, mcz, ss(.79, .85, p));
      const ex = lerp(fx, lerp(mcx, P[FN].x, .6), ss(.895, .93, p)), ez = lerp(fz, lerp(mcz, P[FN].z, .6), ss(.895, .93, p)), hh = mapH * zoom;
      cam.position.set(MX + ex, hh, ez + hh * .3); tgt.set(MX + ex, 0, ez);
    } else {
      parcel.visible = false; v3(C4, p, 1, cam.position); v3(C4, p, 2, tgt);
      const d = cl((p - .94) / .028), y = (1 - bounce(d)) * 4.2; dBox.position.y = .036 + y; dBox.rotation.z = (1 - d) * .25; dShadow.material.opacity = .5 * cl(1 - y / 3);
    }
    aimSun(tgt, world === 1 ? 15 : world === 2 ? 40 : 8);
    cam.lookAt(tgt); renderer.render(scene, cam);
  }
  function dispose(){ removeEventListener('resize', resize); pmrem.dispose(); renderer.dispose(); scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  return { update, dispose, get progress(){ return p; } };
}
