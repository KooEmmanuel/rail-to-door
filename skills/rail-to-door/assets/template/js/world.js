// Real coastlines (Natural Earth 110m, via world-atlas) turned into a dot-matrix world map.
let landCtx = null;
const RW = 1440, RH = 720;

export async function loadLand(){
  if (landCtx) return;
  const topo = await (await fetch('vendor/land-110m.json')).json();
  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
  const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => [(x += dx) * sx + tx, (y += dy) * sy + ty]); });
  const ring = idxs => idxs.flatMap(i => { const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]; return a; });
  const c = document.createElement('canvas'); c.width = RW; c.height = RH;
  const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#000';
  for (const g of topo.objects.land.geometries){
    const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
    for (const poly of polys){
      ctx.beginPath();
      for (const r of poly){ ring(r).forEach(([lon, lat], i) => { const X = (lon + 180) / 360 * RW, Y = (90 - lat) / 180 * RH; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); }
      ctx.fill('evenodd');
    }
  }
  landCtx = ctx.getImageData(0, 0, RW, RH).data;
}
export const isLand = (lon, lat) => {
  const X = Math.floor((((lon + 180) % 360 + 360) % 360) / 360 * RW), Y = Math.floor((90 - lat) / 180 * RH);
  return Y >= 0 && Y < RH && landCtx[(Y * RW + X) * 4 + 3] > 100;
};
/** Staggered grid of land dots, [lon, lat][] */
export function landDots(step = 1.5){
  const out = []; let row = 0;
  for (let lat = 80; lat >= -56; lat -= step * .88, row++)
    for (let lon = -180 + (row % 2 ? step / 2 : 0); lon < 180; lon += step)
      if (isLand(lon, lat)) out.push([lon, lat]);
  return out;
}
/** n+1 points along the great circle a→b, as [lon, lat] (kept continuous in longitude) */
export function greatCircle(a, b, n = 100){
  const r = Math.PI / 180, v = p => [Math.cos(p.lat * r) * Math.cos(p.lon * r), Math.cos(p.lat * r) * Math.sin(p.lon * r), Math.sin(p.lat * r)];
  const A = v(a), B = v(b), d = Math.acos(Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])), out = [];
  let prev = a.lon;
  for (let i = 0; i <= n; i++){
    const t = i / n, k1 = Math.sin((1 - t) * d) / Math.sin(d), k2 = Math.sin(t * d) / Math.sin(d);
    const x = k1 * A[0] + k2 * B[0], y = k1 * A[1] + k2 * B[1], z = k1 * A[2] + k2 * B[2];
    let lon = Math.atan2(y, x) / r; while (lon - prev > 180) lon -= 360; while (lon - prev < -180) lon += 360; prev = lon;
    out.push([lon, Math.atan2(z, Math.hypot(x, y)) / r]);
  }
  return out;
}
