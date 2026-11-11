import * as THREE from 'three';

export function makeMats(T){
  const std = (map, extra = {}) => new THREE.MeshStandardMaterial({ map, roughness: .92, metalness: 0, ...extra });
  return {
    kraft: std(T.kraft), kraftIn: std(T.kraftIn), front: std(T.front), side: std(T.side), top: std(T.top),
    label: std(T.label, { roughness: .7 }), tape: std(T.tape, { roughness: .5 }),
    mailer: std(T.mailer, { roughness: .6 }), customs: std(T.customs, { roughness: .6 }),
    white: new THREE.MeshStandardMaterial({ color: 0xF4F2EE, roughness: .7 }),
    blob: new THREE.MeshBasicMaterial({ map: T.blob, transparent: true, depthWrite: false })
  };
}

export function blob(M, w, d, opacity = 1){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.blob.clone());
  m.material.opacity = opacity; m.rotation.x = -Math.PI / 2; m.position.y = .004; m.renderOrder = -1;
  return m;
}

function tapeStrip(M, len, wid, rep){
  const g = new THREE.PlaneGeometry(len, wid); g.translate(len / 2, 0, 0);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * rep);
  return new THREE.Mesh(g, M.tape);
}

/** Closed, taped, labeled box. Origin = bottom centre. */
export function simpleParcel(M, w, h, d, { label = true, tape = true, customs = false } = {}){
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
  g.add(new THREE.Mesh(geo, [M.side, M.side, M.top, M.kraft, M.front, M.front]));
  if (tape){
    const tw = Math.min(.17, d * .2), drop = h * .32;
    const top = tapeStrip(M, w, tw, w / 1.3 * .55); top.rotation.x = -Math.PI / 2; top.position.set(-w / 2, h + .003, 0); g.add(top);
    const r = tapeStrip(M, drop, tw, .14); r.rotation.set(0, Math.PI / 2, 0); r.rotation.z = -Math.PI / 2; r.position.set(w / 2 + .003, h, 0); g.add(r);
    const l = tapeStrip(M, drop, tw, .14); l.rotation.set(0, -Math.PI / 2, 0); l.rotation.z = -Math.PI / 2; l.position.set(-w / 2 - .003, h, 0); g.add(l);
  }
  if (label){
    const lw = Math.min(.6, w * .5), lm = new THREE.Mesh(new THREE.PlaneGeometry(lw, lw * .667), M.label);
    lm.rotation.x = -Math.PI / 2; lm.rotation.z = .06; lm.position.set(w * .1, h + .006, d * .04); g.add(lm);
  }
  if (customs){
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(w * .3, w * .225), M.customs);
    cm.position.set(-w * .26, h * .68, d / 2 + .004); cm.rotation.z = -.08; g.add(cm);
  }
  return g;
}

/** Flat same-day mailer. Origin = centre. */
export function mailer(M){
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.7, .05, 1.16), [M.white, M.white, M.mailer, M.white, M.white, M.white]);
  g.add(m); return g;
}

/** The hero box: open-top, four animated flaps, tape, flying label, gift, crinkle-fill confetti. */
export function heroParcel(M, W = 1.3, H = 1.05, D = 1.05){
  const g = new THREE.Group(), t = .022;
  const wall = (w, h, outer) => new THREE.Mesh(new THREE.BoxGeometry(w, h, t), [M.kraft, M.kraft, M.kraft, M.kraft, outer, M.kraftIn]);
  const f = wall(W, H, M.front); f.position.set(0, H / 2, D / 2 - t / 2); g.add(f);
  const b = wall(W, H, M.front); b.position.set(0, H / 2, -D / 2 + t / 2); b.rotation.y = Math.PI; g.add(b);
  const r = wall(D, H, M.side); r.position.set(W / 2 - t / 2, H / 2, 0); r.rotation.y = Math.PI / 2; g.add(r);
  const l = wall(D, H, M.side); l.position.set(-W / 2 + t / 2, H / 2, 0); l.rotation.y = -Math.PI / 2; g.add(l);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(W, t, D), M.kraftIn); bot.position.y = t / 2; g.add(bot);

  // flaps: [pivot, axis, openAngle]
  const flaps = [];
  const mk = (sx, sz, px, pz, ox, oz, axis, open, lift) => {
    const p = new THREE.Group(); p.position.set(px, H + lift, pz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, t * .8, sz), [M.kraft, M.kraft, M.top, M.kraftIn, M.kraft, M.kraft]);
    m.position.set(ox, 0, oz); p.add(m); g.add(p); flaps.push({ p, axis, open }); return p;
  };
  const OPEN = 1.92;
  mk(D / 2, D - .01, W / 2, 0, -D / 4, 0, 'z', -OPEN, -.012);   // right minor
  mk(D / 2, D - .01, -W / 2, 0, D / 4, 0, 'z', OPEN, -.012);    // left minor
  mk(W, D / 2, 0, D / 2, 0, -D / 4, 'x', 3.3, .008);     // front major
  mk(W, D / 2, 0, -D / 2, 0, D / 4, 'x', -OPEN - .05, .008);     // back major
  const ease = x => x * x * (3 - 2 * x), cl = x => Math.min(1, Math.max(0, x));
  const setFlaps = (k) => { // k: 0 open → 1 closed
    flaps.forEach((fl, i) => { const kk = ease(cl(i < 2 ? k / .6 : (k - .35) / .65)); fl.p.rotation[fl.axis] = fl.open * (1 - kk); });
  };
  setFlaps(0);

  // tape (drawn across the top seam and down both ends)
  const tape = new THREE.Group(); g.add(tape);
  const top = tapeStrip(M, W, .17, .55); top.rotation.x = -Math.PI / 2; top.position.set(-W / 2, H + .026, 0); tape.add(top);
  const dr = tapeStrip(M, .34, .17, .14); dr.rotation.set(0, Math.PI / 2, -Math.PI / 2); dr.position.set(W / 2 + .004, H + .02, 0); tape.add(dr);
  const dl = tapeStrip(M, .34, .17, .14); dl.rotation.set(0, -Math.PI / 2, -Math.PI / 2); dl.position.set(-W / 2 - .004, H + .02, 0); tape.add(dl);
  const setTape = (k) => {
    tape.visible = k > 0.001;
    dl.scale.x = Math.max(.001, cl(k / .2)); top.scale.x = Math.max(.001, cl((k - .15) / .65)); dr.scale.x = Math.max(.001, cl((k - .8) / .2));
    dr.visible = k > .8;
  };
  setTape(0);

  // label
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.66, .44), M.label.clone());
  label.material.side = THREE.DoubleSide; g.add(label);
  const A = { p: new THREE.Vector3(1.0, H + 1.25, -.5), r: new THREE.Euler(-.5, .7, .5) };
  const B = { p: new THREE.Vector3(.12, H + .032, .04), r: new THREE.Euler(-Math.PI / 2, 0, .06) };
  const setLabel = (k) => {
    label.visible = k > 0.001; const e = ease(cl(k));
    label.position.lerpVectors(A.p, B.p, e); label.position.y += Math.sin(e * Math.PI) * .25;
    label.rotation.set(A.r.x + (B.r.x - A.r.x) * e, A.r.y + (B.r.y - A.r.y) * e, A.r.z + (B.r.z - A.r.z) * e);
  };
  setLabel(0);

  // gift
  const gift = new THREE.Group(); g.add(gift);
  const blue = new THREE.MeshStandardMaterial({ color: 0x2146F5, roughness: .45 });
  const rib = new THREE.MeshStandardMaterial({ color: 0xB4532A, roughness: .5 });
  const gb = new THREE.Mesh(new THREE.BoxGeometry(.5, .36, .5), blue); gift.add(gb);
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(.512, .372, .07), rib); gift.add(r1);
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(.07, .372, .512), rib); gift.add(r2);
  for (const s of [-1, 1]){ const bow = new THREE.Mesh(new THREE.TorusGeometry(.065, .022, 8, 18), rib); bow.position.set(s * .06, .21, 0); bow.rotation.set(0, s * .5, s * .5); gift.add(bow); }
  gift.rotation.y = .5;

  // crinkle fill
  const N = 110, cg = new THREE.PlaneGeometry(.03, .17);
  const conf = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), N);
  const seeds = [], cols = [0xffffff, 0xFF4D1F, 0xF4C9BC, 0xffffff, 0xE23B15];
  let s = 17; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < N; i++){
    seeds.push({ vx: (rnd() - .5) * 1.5, vz: (rnd() - .5) * 1.1, vy: 2.0 + rnd() * 2.2, rx: rnd() * 6, ry: rnd() * 6, sp: 3 + rnd() * 8, d: rnd() * .25 });
    conf.setColorAt(i, new THREE.Color(cols[i % cols.length]));
  }
  conf.frustumCulled = false; conf.visible = false; g.add(conf);
  const dummy = new THREE.Object3D();
  const setConfetti = (k) => {
    conf.visible = k > 0 && k < 1; if (!conf.visible) return;
    for (let i = 0; i < N; i++){
      const q = seeds[i], tt = cl((k - q.d) / (1 - q.d)), sc = tt <= 0 ? 0 : Math.sin(Math.min(1, tt * 1.15) * Math.PI) ** .5;
      dummy.position.set(q.vx * tt, H * .7 + q.vy * tt - 1.9 * tt * tt, q.vz * tt);
      dummy.rotation.set(q.rx + tt * q.sp, q.ry + tt * q.sp * .7, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix);
    }
    conf.instanceMatrix.needsUpdate = true;
  };

  return { group: g, W, H, D, setFlaps, setTape, setLabel, setConfetti, gift };
}
