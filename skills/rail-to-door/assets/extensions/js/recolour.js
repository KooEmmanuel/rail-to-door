import { drawCloth } from './fabrics.js';

// Shows a suit photo in another colour or cloth, in the browser.
// Each cut-out has a mask (assets/rail/mask/*.png) that marks the cloth and leaves out the hook and the
// wooden hanger. The cloth keeps the photo's own folds and shadows; only its colour (and, for a made-to-
// measure cloth, its weave) changes.
//   ready to wear:   recolour(src, { hex })            keeps the photo's own weave (pinstripe stays pinstripe)
//   made to measure: recolour(src, { hex, fabric })    smooths the photo's weave away and lays the new cloth in

export const maskOf = src => src.replace('assets/rail/', 'assets/rail/mask/').replace(/\.webp$/, '.png');
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
const srcCache = new Map(), outCache = new Map();

const lum = (r, g, b) => (.299 * r + .587 * g + .114 * b) / 255;
const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

// separable box blur of v, weighted by m, so the background never bleeds into the cloth
function blur(v, m, w, h, r){
  const a = new Float32Array(w * h), b = new Float32Array(w * h), ta = new Float32Array(w * h), tb = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++){ a[i] = v[i] * m[i]; b[i] = m[i]; }
  for (let y = 0; y < h; y++){ let sa = 0, sb = 0; const o = y * w;
    for (let x = -r; x < w; x++){ if (x + r < w){ sa += a[o + x + r]; sb += b[o + x + r]; } if (x - r - 1 >= 0){ sa -= a[o + x - r - 1]; sb -= b[o + x - r - 1]; } if (x >= 0){ ta[o + x] = sa; tb[o + x] = sb; } } }
  for (let x = 0; x < w; x++){ let sa = 0, sb = 0;
    for (let y = -r; y < h; y++){ if (y + r < h){ sa += ta[(y + r) * w + x]; sb += tb[(y + r) * w + x]; } if (y - r - 1 >= 0){ sa -= ta[(y - r - 1) * w + x]; sb -= tb[(y - r - 1) * w + x]; } if (y >= 0){ a[y * w + x] = sa; b[y * w + x] = sb; } } }
  const out = new Float32Array(w * h); for (let i = 0; i < w * h; i++) out[i] = b[i] > 1e-3 ? a[i] / b[i] : v[i];
  return out;
}

function source(src){
  if (srcCache.has(src)) return srcCache.get(src);
  const p = Promise.all([loadImg(src), loadImg(maskOf(src))]).then(([img, mk]) => {
    const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(mk, 0, 0, w, h); const md = x.getImageData(0, 0, w, h).data;
    x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0); const px = x.getImageData(0, 0, w, h);
    const d = px.data, m = new Float32Array(w * h), L = new Float32Array(w * h); let sum = 0, n = 0;
    for (let i = 0, j = 0; j < w * h; i += 4, j++){ m[j] = md[i] / 255; L[j] = lum(d[i], d[i + 1], d[i + 2]); if (m[j] > .8){ sum += L[j]; n++; } }
    const mean = sum / Math.max(1, n);
    const spread = L => { let s = 0, k = 0; for (let j = 0; j < w * h; j += 3) if (m[j] > .8){ const v = Math.log(Math.max(.02, L[j]) / mean); s += v * v; k++; } return Math.sqrt(s / Math.max(1, k)); };
    const Lb = blur(L, m, w, h, 3); for (let j = 0; j < w * h; j++) Lb[j] = Lb[j] * .8 + L[j] * .2;   // weave smoothed away, edges kept
    return { w, h, px, m, L, Lb, mean, sp: spread(L), spb: spread(Lb) };
  });
  srcCache.set(src, p); p.catch(() => srcCache.delete(src));
  return p;
}

// the new cloth's weave as a brightness pattern around 1, from the same drawing as the swatches
function weave(fabric, w, h){
  const T = 300, c = document.createElement('canvas'); c.width = c.height = T; const x = c.getContext('2d', { willReadFrequently: true });
  drawCloth(x, T, T, fabric, .55); const d = x.getImageData(0, 0, T, T).data, t = new Float32Array(T * T); let s = 0;
  for (let i = 0, j = 0; j < T * T; i += 4, j++) t[j] = lum(d[i], d[i + 1], d[i + 2]) + .02;
  // keep only the fine weave: the swatch's own light and shade would repeat as blotches across the suit
  const lo = blur(t, new Float32Array(T * T).fill(1), T, T, 9), hp = new Float32Array(T * T);
  for (let j = 0; j < T * T; j++){ hp[j] = 1 + (t[j] / lo[j] - 1) * .75; s += hp[j]; }
  const mean = s / (T * T), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) out[y * w + xx] = hp[(y % T) * T + (xx % T)] / mean;
  return out;
}

export function recolour(src, { hex, fabric = null }){
  const key = src + '|' + hex + '|' + (fabric ? fabric.key : '');
  if (outCache.has(key)) return outCache.get(key);
  const p = source(src).then(S => {
    const { w, h, m, mean } = S, Ls = fabric ? S.Lb : S.L, g = Math.min(1.1, Math.max(.45, .17 / ((fabric ? S.spb : S.sp) || .17)));
    const T = rgb(hex), tex = fabric ? weave(fabric, w, h) : null, out = new ImageData(new Uint8ClampedArray(S.px.data), w, h), d = out.data;
    for (let j = 0, i = 0; j < w * h; j++, i += 4){
      const k = m[j]; if (k < .01) continue;
      const s = Math.pow(Math.max(.03, Ls[j]) / mean, g) * (tex ? tex[j] : 1);
      for (let c = 0; c < 3; c++){
        const t = T[c], v = s <= 1 ? t * s : t + (1 - t) * (1 - 1 / s) * .38;   // shadows darken, highlights lift toward white without burning out
        d[i + c] = d[i + c] * (1 - k) + Math.min(1, v) * 255 * k;
      }
    }
    const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').putImageData(out, 0, 0);
    return new Promise(ok => c.toBlob(b => ok(b ? URL.createObjectURL(b) : c.toDataURL()), 'image/webp', .9));
  });
  outCache.set(key, p); p.catch(() => outCache.delete(key));
  return p;
}
