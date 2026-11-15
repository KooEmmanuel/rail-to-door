import { FABRICS, MTM } from './data.js';

// Woven cloth, drawn in code: the swatches in the store, the viewer's cloth picker and the cloth on the
// cutting table in the film all come from drawCloth, so the customer sees the same cloth everywhere.
export const fabricOf = key => FABRICS.find(f => f.key === key) || null;
export const mtmPrice = (p, key) => p.price + (key ? MTM.fee + (fabricOf(key) || { add: 0 }).add : 0);

export function drawCloth(x, w, h, f, k = 1){
  let s = 7 + f.key.length; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const L = a => `rgba(255,255,255,${a})`, D = a => `rgba(0,0,0,${a})`;
  x.fillStyle = f.color; x.fillRect(0, 0, w, h);
  const noise = (n, a, len = 3) => { for (let i = 0; i < n; i++){ x.fillStyle = r() > .5 ? L(a) : D(a); x.fillRect(r() * w, r() * h, 1 + r() * len * k, Math.max(1, k * .7)); } };
  const twill = (step, a1, a2, steep = 1) => { x.lineWidth = step * .5; let n = 0;
    for (let i = -h / steep; i < w + step; i += step, n++){ x.strokeStyle = n % 2 ? L(a1) : D(a2); x.beginPath(); x.moveTo(i, h); x.lineTo(i + h / steep, 0); x.stroke(); } };
  const S = 4 * k;
  switch (f.weave){
    case 'twill': twill(S, .05, .09); noise(w * h / 70, .03); break;
    case 'flannel': noise(w * h / 5, .045, 5);
      for (let i = 0; i < w * h / 900; i++){ const cx = r() * w, cy = r() * h, rr = (6 + r() * 14) * k, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, r() > .5 ? L(.05) : D(.06)); g.addColorStop(1, L(0)); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); } break;
    case 'stripe': twill(S, .05, .09); x.strokeStyle = L(.42); x.lineWidth = 1.6 * k; x.setLineDash([2.2 * k, 1.4 * k]);
      for (let i = 14 * k; i < w; i += 26 * k){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } x.setLineDash([]); break;
    case 'sharkskin': { const c = 2 * k; for (let j = 0, rj = 0; j < h; j += c, rj++) for (let i = 0, ri = 0; i < w; i += c, ri++){ x.fillStyle = (ri + Math.floor(rj / 2)) % 4 < 2 ? L(.08) : D(.1); x.fillRect(i, j, c, c); } noise(w * h / 80, .03); break; }
    case 'check': { twill(S, .04, .07); const B = 28 * k;
      for (let i = 0; i < w; i += B){ x.fillStyle = D(.11); x.fillRect(i, 0, B / 2, h); for (let t = 0; t < B / 2; t += 3 * k){ x.fillStyle = L(.05); x.fillRect(i + t, 0, k, h); } }
      for (let j = 0; j < h; j += B){ x.fillStyle = D(.11); x.fillRect(0, j, w, B / 2); for (let t = 0; t < B / 2; t += 3 * k){ x.fillStyle = L(.05); x.fillRect(0, j + t, w, k); } }
      x.fillStyle = 'rgba(152,83,34,.35)'; for (let i = B * .75; i < w; i += B * 2) x.fillRect(i, 0, k, h); for (let j = B * .75; j < h; j += B * 2) x.fillRect(0, j, w, k); break; }
    case 'linen': noise(w * h / 8, .05, 2);
      for (let j = 0; j < h; j += 2 * k){ x.fillStyle = r() > .5 ? L(.06 + r() * .06) : D(.05 + r() * .05); x.fillRect(0, j, w, k * (.6 + r() * .8)); }
      for (let i = 0; i < w; i += 2 * k){ x.fillStyle = r() > .5 ? L(.04) : D(.05); x.fillRect(i, 0, k * .7, h); }
      for (let i = 0; i < w * h / 500; i++){ x.fillStyle = r() > .4 ? D(.12) : L(.18); x.fillRect(r() * w, r() * h, (6 + r() * 16) * k, 1.4 * k); } break;
    case 'drill': twill(S * .8, .06, .1, 2.2); noise(w * h / 60, .03); break;
    case 'mohair': twill(S, .06, .08); { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, L(.14)); g.addColorStop(.45, L(0)); g.addColorStop(.7, L(.1)); g.addColorStop(1, D(.1)); x.fillStyle = g; x.fillRect(0, 0, w, h); } break;
    case 'barathea': noise(w * h / 2.5, .07, 1.5); for (let j = 0; j < h; j += 3 * k){ x.fillStyle = L(.03); x.fillRect(0, j, w, k * .5); } break;
    case 'velvet': { const g = x.createRadialGradient(w * .35, h * .3, 0, w * .5, h * .5, Math.max(w, h) * .8); g.addColorStop(0, L(.2)); g.addColorStop(.5, L(.03)); g.addColorStop(1, D(.3)); x.fillStyle = g; x.fillRect(0, 0, w, h); noise(w * h / 6, .03, 1); break; }
    default: noise(w * h / 40, .04);
  }
}
const cache = {};
export function swatchURL(f, size = 160){
  const id = f.key + size; if (cache[id]) return cache[id];
  const c = document.createElement('canvas'); c.width = c.height = size; drawCloth(c.getContext('2d'), size, size, f, size / 160);
  return (cache[id] = c.toDataURL('image/jpeg', .86));
}
