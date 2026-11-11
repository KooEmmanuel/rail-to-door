import { makeTextures } from './textures.js';
import { makeMats } from './parcels.js';
import { initShop } from './shop.js';
import { initJourney } from './journey.js';

const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
let T, M, journey = null, auto = false, lastT = 0;
const curtain = $('curtain'), playBtn = $('playBtn');
const SECONDS = 62;   // length of the hands-free play-through

function setAuto(on){ auto = on; playBtn.textContent = on ? '❚❚' : '▶'; }
['wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => auto && setAuto(false), { passive: true }));
addEventListener('keydown', e => { if (auto && [' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) setAuto(false); });
playBtn.addEventListener('click', () => { if (!auto && scrollY >= document.documentElement.scrollHeight - innerHeight - 4) scrollTo(0, 0); setAuto(!auto); });

async function startJourney(order, done){
  curtain.classList.remove('off'); curtain.classList.add('on'); await wait(750);
  done(); document.body.className = 'mode-journey'; scrollTo(0, 0);
  document.querySelectorAll('.oNo').forEach(e => e.textContent = order.no);
  document.querySelectorAll('.oTo').forEach(e => e.textContent = order.dest.city);
  document.querySelectorAll('.oName').forEach(e => e.textContent = order.name.split(' ')[0]);
  document.querySelectorAll('.oB').forEach(e => e.textContent = order.dest.code);
  document.querySelectorAll('.oRoute').forEach(e => e.textContent = `${order.origin.code} → ${order.dest.code}`);
  $('scItems').textContent = `${order.items.length} ${order.items.length > 1 ? 'PIECES' : 'PIECE'}`;
  try {
    await Promise.race([Promise.all(['600 40px Fraunces', '400 40px Fraunces', '700 20px "JetBrains Mono"', '500 20px Inter'].map(f => document.fonts.load(f))), wait(2500)]);
    if (!T){ const logo = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'assets/logo.png'; }); T = makeTextures(logo); M = makeMats(T); }
    journey = await initJourney({ T, M, order });
  } catch (e) { console.error('[rail-to-door] journey failed', e); }
  await wait(500); curtain.classList.add('off'); await wait(600); curtain.classList.remove('on', 'off');
  setAuto(true);
}
async function backToShop(){
  setAuto(false); curtain.classList.remove('off'); curtain.classList.add('on'); await wait(750);
  if (journey){ journey.dispose(); journey = null; }
  document.body.className = 'mode-shop'; scrollTo(0, 0);
  curtain.classList.add('off'); await wait(600); curtain.classList.remove('on', 'off');
}
$('again').addEventListener('click', backToShop);
$('replay').addEventListener('click', () => { scrollTo(0, 0); setAuto(true); });

const shop = initShop({ onPaid: startJourney });
function loop(now){
  const t = now / 1000, dt = Math.min(.05, t - lastT); lastT = t;
  if (document.body.classList.contains('mode-shop')) shop.update(t);
  else if (journey){
    if (auto){
      const max = document.documentElement.scrollHeight - innerHeight;
      scrollTo(0, Math.min(max, scrollY + max / SECONDS * dt)); if (scrollY >= max - 1) setAuto(false);
    }
    journey.update(t);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
