import * as THREE from 'three';

// Atelier Example packaging palette: matte ink board, bone paper, nothing else.
const INK = '#0E1A2B', BONE = '#F4F0E8', PAPER = '#FBFAF7';

function cv(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, repeat){
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const serif = (ctx, px, w = 400, it = false) => { ctx.font = `${it ? 'italic ' : ''}${w} ${px}px "Bodoni Moda", Georgia, serif`; };
const sans = (ctx, px, w = 500) => { ctx.font = `${w} ${px}px "Hanken Grotesk", system-ui, sans-serif`; };
const mono = (ctx, px, w = 500) => { ctx.font = `${w} ${px}px "JetBrains Mono", monospace`; };
// draw text at the largest size (up to px) that fits maxW — brand names vary a lot in length
function fitSerif(ctx, text, x, y, px, maxW, w = 400){ let size = px; serif(ctx, size, w); while (size > 24 && ctx.measureText(text).width > maxW){ size -= 4; serif(ctx, size, w); } ctx.fillText(text, x, y); return size; }
function spaced(ctx, s, x, y, sp){ try { ctx.letterSpacing = sp + 'px'; } catch (e) {} ctx.fillText(s, x, y); try { ctx.letterSpacing = '0px'; } catch (e) {} }

// matte board: a flat colour with a very fine paper grain
function board(ctx, w, h, base, seed = 1, light = 'rgba(255,255,255,.035)', shade = 'rgba(0,0,0,.05)'){
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  let s = seed * 9301; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < w * h / 240; i++){ ctx.fillStyle = rnd() > .5 ? light : shade; ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 10, 1); }
}
function barcode(ctx, x, y, w, h, seed = 7){
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  ctx.fillStyle = '#111'; let cx = x;
  while (cx < x + w){ const bw = 2 + Math.floor(rnd() * 4) * 2; ctx.fillRect(cx, y, bw, h); cx += bw + 2 + Math.floor(rnd() * 3) * 2; }
}
function qr(ctx, x, y, n, cell, seed = 3){
  let s = seed; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  ctx.fillStyle = '#111';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (rnd() > .5) ctx.fillRect(x + i * cell, y + j * cell, cell, cell);
  for (const [a, b] of [[0, 0], [n - 3, 0], [0, n - 3]]){
    ctx.fillStyle = '#111'; ctx.fillRect(x + a * cell, y + b * cell, cell * 3, cell * 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + (a + .7) * cell, y + (b + .7) * cell, cell * 1.6, cell * 1.6);
    ctx.fillStyle = '#111'; ctx.fillRect(x + (a + 1.1) * cell, y + (b + 1.1) * cell, cell * .8, cell * .8);
  }
}
// small line icons for the care marks
function icons(ctx, x, y, s, col){
  ctx.strokeStyle = col; ctx.lineWidth = s * .07; ctx.lineJoin = ctx.lineCap = 'round';
  // this way up
  ctx.beginPath(); for (const dx of [0, s * .5]){ ctx.moveTo(x + dx + s * .12, y + s * .75); ctx.lineTo(x + dx + s * .12, y + s * .1); ctx.moveTo(x + dx - s * .04, y + s * .28); ctx.lineTo(x + dx + s * .12, y + s * .08); ctx.lineTo(x + dx + s * .28, y + s * .28); }
  ctx.moveTo(x - s * .08, y + s * .9); ctx.lineTo(x + s * .82, y + s * .9); ctx.stroke();
  // keep dry (umbrella)
  const ux = x + s * 1.7; ctx.beginPath(); ctx.arc(ux, y + s * .45, s * .4, Math.PI, 0); ctx.closePath(); ctx.moveTo(ux, y + s * .45); ctx.lineTo(ux, y + s * .82); ctx.arc(ux - s * .09, y + s * .82, s * .09, 0, Math.PI); ctx.stroke();
  // handle with care (glass)
  const gx = x + s * 2.9; ctx.beginPath(); ctx.moveTo(gx - s * .26, y + s * .08); ctx.lineTo(gx + s * .26, y + s * .08); ctx.lineTo(gx + s * .04, y + s * .5); ctx.lineTo(gx + s * .04, y + s * .82); ctx.lineTo(gx + s * .22, y + s * .9); ctx.lineTo(gx - s * .22, y + s * .9); ctx.lineTo(gx - s * .04, y + s * .82); ctx.lineTo(gx - s * .04, y + s * .5); ctx.closePath(); ctx.stroke();
}

export function makeTextures(logo){
  const T = { logoImg: logo };
  // the brand mark, tinted to any colour (falls back to a plain "A" if the image is missing)
  const mark = (ctx, x, y, size, fill) => {
    if (!logo){ ctx.fillStyle = fill; serif(ctx, size, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', x, y); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; return; }
    const w = size, h = size * logo.height / logo.width, [c2, x2] = cv(Math.ceil(w), Math.ceil(h));
    x2.drawImage(logo, 0, 0, w, h); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = fill; x2.fillRect(0, 0, w, h);
    ctx.drawImage(c2, x - w / 2, y - h / 2);
  };

  { // plain board, outside (ink) and inside (bone)
    const [c, x] = cv(512, 512); board(x, 512, 512, INK, 3); T.kraft = tex(c);
    const [c2, x2] = cv(512, 512); board(x2, 512, 512, '#E9E3D7', 5, 'rgba(255,255,255,.2)', 'rgba(60,40,10,.04)'); T.kraftIn = tex(c2);
  }
  { // long front of the suit box (1.85 × 0.4): mark + wordmark, quiet details
    const W = 1840, H = 400, [c, x] = cv(W, H); board(x, W, H, INK, 11);
    mark(x, 150, H / 2, 190, BONE);
    x.fillStyle = BONE; x.textBaseline = 'middle'; fitSerif(x, 'Atelier Example', 280, H / 2 + 6, 132, 900); x.textBaseline = 'alphabetic';
    x.fillStyle = 'rgba(245,242,234,.3)'; x.fillRect(1270, 96, 1.5, H - 192);
    x.fillStyle = BONE; x.globalAlpha = .8; sans(x, 22, 500); spaced(x, 'MADE TO MEASURE', 1312, 170, 8); x.globalAlpha = .6; spaced(x, 'LISBON  ·  WORLDWIDE', 1312, 214, 8); x.globalAlpha = 1;
    icons(x, 1316, 262, 44, 'rgba(245,242,234,.7)');
    T.front = tex(c);
  }
  { // short end of the suit box (1.3 × 0.4)
    const W = 1300, H = 400, [c, x] = cv(W, H); board(x, W, H, INK, 23);
    mark(x, W / 2, 168, 200, BONE);
    x.fillStyle = BONE; x.textAlign = 'center'; x.globalAlpha = .7; sans(x, 22, 500); spaced(x, 'ATELIER.EXAMPLE', W / 2, 340, 9); x.globalAlpha = 1; x.textAlign = 'left';
    T.side = tex(c);
  }
  { // the lid (1.85 × 1.3): two long flaps meeting on the centre line. The far flap is quiet, the near flap carries the name.
    const W = 1480, H = 1040, [c, x] = cv(W, H); board(x, W, H, INK, 31);
    x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, H / 2 - 2, W, 4);
    x.fillStyle = BONE; x.textAlign = 'center'; x.globalAlpha = .6; sans(x, 22, 500); spaced(x, 'CUT FOR YOU  ·  DELIVERED TO YOUR DOOR', W / 2, 250, 10); x.globalAlpha = 1; x.textAlign = 'left';
    mark(x, 168, 800, 190, BONE);
    x.fillStyle = BONE; x.textBaseline = 'middle'; fitSerif(x, 'Atelier Example', 296, 792, 96, 500); x.textBaseline = 'alphabetic';
    x.globalAlpha = .6; sans(x, 18, 500); spaced(x, 'MADE TO MEASURE  ·  LISBON', 300, 862, 7); x.globalAlpha = 1;
    T.top = tex(c);
    const half = oy => { const t = tex(c); t.repeat.set(1, .5); t.offset.set(0, oy); return t; };
    T.topF = half(0); T.topB = half(.5);     // near flap = lower half of the canvas, far flap = upper half
  }
  { // shipping label — redrawn with the customer's details once they pay
    const W = 900, H = 600, [c, x] = cv(W, H); T.label = tex(c);
    T.drawLabel = (o = {}) => {
      const name = o.name || 'Ama Mensah', l1 = o.street || '14 Kingsland Road', l2 = o.dest ? `${o.dest.city}, ${o.dest.country}` : 'London, United Kingdom';
      const A = (o.origin && o.origin.code) || 'LIS', B = (o.dest && o.dest.code) || 'LHR', no = o.no || 'ATX-00000';
      x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.globalAlpha = 1;
      x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
      mark(x, 64, 62, 62, '#0E1A2B'); x.fillStyle = '#0E1A2B'; fitSerif(x, 'Atelier Example', 110, 80, 50, 420);
      sans(x, 19, 600); x.textAlign = 'right'; spaced(x, 'PRIORITY AIR', W - 40, 72, 5); x.textAlign = 'left';
      x.fillRect(34, 112, W - 68, 2);
      x.globalAlpha = .55; sans(x, 15, 600); spaced(x, 'SHIP TO', 34, 158, 5); x.globalAlpha = 1;
      serif(x, 40, 400); x.fillText(name.slice(0, 24), 34, 204);
      sans(x, 21, 400); x.globalAlpha = .72; x.fillText(l1.slice(0, 34), 34, 238); x.fillText(l2.slice(0, 34), 34, 266); x.globalAlpha = 1;
      mono(x, 76, 700); x.fillText(B, 30, 352);
      x.fillRect(34, 374, 520, 2);
      barcode(x, 34, 396, 520, 128); x.fillStyle = '#0E1A2B'; mono(x, 18, 700); spaced(x, no, 34, 560, 5);
      serif(x, 44, 400); x.fillText(A, 600, 204); x.fillText(B, 748, 204);
      x.fillRect(694, 187, 34, 3); x.beginPath(); x.moveTo(740, 188); x.lineTo(724, 177); x.lineTo(724, 199); x.fill();
      x.fillRect(600, 232, 236, 64); x.fillStyle = PAPER; mono(x, 26, 700); x.fillText(no, 616, 274);
      qr(x, 644, 340, 15, 12, 5);
      T.label.needsUpdate = true;
    };
    T.drawLabel();
  }
  { // van side — the whole black body side (5.15 × 3.68), ivory lettering above the wheel arch
    const W = 2048, H = 1464, [c, x] = cv(W, H);
    x.fillStyle = '#0E1A2B'; x.fillRect(0, 0, W, H);
    const sh = x.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(255,255,255,.07)'); sh.addColorStop(.35, 'rgba(255,255,255,.015)'); sh.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = sh; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.075)'; x.fillRect(0, 1010, W, 3); x.fillRect(0, 150, W, 2);                 // pressed swage lines
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 1013, W, 2);
    mark(x, 330, 520, 330, BONE);
    x.fillStyle = BONE; x.textBaseline = 'middle'; fitSerif(x, 'Atelier Example', 560, 500, 210, W - 560 - 110);
    x.fillRect(566, 640, 150, 3);
    x.globalAlpha = .82; sans(x, 38, 500); spaced(x, 'READY TODAY, OR CUT TO YOU.', 566, 716, 9);
    x.globalAlpha = .5; sans(x, 30, 500); spaced(x, 'atelier.example', 566, 800, 6); x.globalAlpha = 1; x.textBaseline = 'alphabetic';
    T.van = tex(c);
  }
  { // white brand mark (aircraft tail)
    const [c, x] = cv(512, 512); mark(x, 256, 256, 425, BONE); T.logoW = tex(c);
  }
  { // paper tape: bone, with the wordmark repeating
    const W = 1024, H = 128, [c, x] = cv(W, H); board(x, W, H, BONE, 7, 'rgba(255,255,255,.3)', 'rgba(60,40,10,.05)');
    x.fillStyle = 'rgba(28,26,23,.1)'; x.fillRect(0, 0, W, 3); x.fillRect(0, H - 3, W, 3);
    x.fillStyle = '#0E1A2B'; x.textBaseline = 'middle'; let px = 22;
    for (let i = 0; i < 3; i++){ mark(x, px + 46, H / 2, 92, '#0E1A2B'); fitSerif(x, 'Atelier Example', px + 104, H / 2 + 4, 60, 216); px += 342; }
    T.tape = tex(c, true);
  }
  { // doormat
    const W = 768, H = 460, [c, x] = cv(W, H);
    x.fillStyle = '#B9A789'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++){ x.fillStyle = Math.random() > .5 ? 'rgba(255,240,210,.12)' : 'rgba(50,35,15,.12)'; x.fillRect(Math.random() * W, Math.random() * H, 2, 5); }
    x.strokeStyle = '#2a251d'; x.lineWidth = 6; x.strokeRect(40, 40, W - 80, H - 80);
    x.fillStyle = '#2a251d'; serif(x, 120, 400, true); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('welcome', W / 2, H / 2 + 4);
    T.mat = tex(c);
  }
  { // scan gate sign
    const W = 1024, H = 220, [c, x] = cv(W, H);
    x.fillStyle = '#0E1A2B'; x.fillRect(0, 0, W, H);
    mark(x, 96, H / 2, 104, BONE);
    x.fillStyle = BONE; serif(x, 104, 400); x.textBaseline = 'middle'; x.fillText('Dispatch', 180, H / 2 + 4);
    x.fillStyle = 'rgba(239,234,224,.3)'; x.fillRect(650, 54, 1.5, H - 108);
    x.fillStyle = BONE; x.globalAlpha = .8; sans(x, 24, 600); spaced(x, 'LISBON ATELIER', 690, H / 2 - 20, 6); x.globalAlpha = .5; spaced(x, 'LANE 02', 690, H / 2 + 24, 6);
    T.sign = tex(c);
  }
  { // conveyor belt: pale, fine-ribbed PVC
    const [c, x] = cv(256, 256);
    x.fillStyle = '#C9C4BB'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 16){ x.fillStyle = 'rgba(0,0,0,.09)'; x.fillRect(i, 0, 3, 256); x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(i + 3, 0, 2, 256); }
    x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, 0, 256, 3); x.fillRect(0, 253, 256, 3);
    T.belt = tex(c, true);
  }
  { // soft blob shadow
    const [c, x] = cv(256, 256); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(.55, 'rgba(0,0,0,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); T.blob = tex(c);
  }
  { // round seal sticker for the tissue
    const [c, x] = cv(256, 256); x.fillStyle = INK; x.beginPath(); x.arc(128, 128, 120, 0, 6.3); x.fill(); mark(x, 128, 128, 168, BONE); T.seal = tex(c);
  }
  T.mailer = T.customs = T.kraftIn;   // unused legacy slots
  return T;
}

export function labelSprite(text, pill){
  const [c, x] = cv(512, 96); x.font = `${pill ? 600 : 500} 32px "Hanken Grotesk", sans-serif`;
  try { x.letterSpacing = '7px'; } catch (e) {}
  const w = x.measureText(text).width;
  if (pill){ x.fillStyle = '#0E1A2B'; x.beginPath(); x.roundRect(2, 14, w + 44, 68, 34); x.fill(); x.fillStyle = '#fff'; }
  else x.fillStyle = 'rgba(23,21,15,.72)';
  x.textBaseline = 'middle'; x.fillText(text, pill ? 24 : 4, 50);
  const t = tex(c); t.userData = { w: (w + (pill ? 48 : 8)) / 512 }; return t;
}
