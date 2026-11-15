import { makeTextures } from './textures.js';
import { makeMats } from './parcels.js';
import { initShop } from './shop.js';
import { initJourney } from './journey.js';
import { STAGES, stageText, stageTime, saveOrder, findOrder, listOrders, onOrdersChange, normNo } from './orders.js';

const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
let T, M, journey = null, auto = false, lastT = 0, tracking = null;   // tracking: the order being followed live, or null for the preview film
const curtain = $('curtain'), playBtn = $('playBtn');
const SECONDS = 92;   // length of the whole hands-free film, workshop to doorstep

function setAuto(on){ auto = on; playBtn.textContent = on ? '❚❚' : '▶'; }
['wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => auto && setAuto(false), { passive: true }));
addEventListener('keydown', e => { if (auto && [' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) setAuto(false); });
playBtn.addEventListener('click', () => { if (!auto && scrollY >= document.documentElement.scrollHeight - innerHeight - 4) scrollTo(0, 0); setAuto(!auto); });

const fmtWhen = t => t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
function fillStatus(o){
  const i = o.stage; $('stNow').innerHTML = `${STAGES[i].label}<em>.</em>`; $('stText').textContent = stageText(o, i);
  $('stWhen').textContent = `Updated ${fmtWhen(stageTime(o, i) || o.createdAt)}`;
  $('stNext').textContent = i < STAGES.length - 1 ? `Next: ${STAGES[i + 1].label}` : '';
}

// mode 'preview' plays the whole film after payment; 'track' stops where the order really is
async function startJourney(order, done = () => {}, mode = 'preview'){
  tracking = mode === 'track' ? order : null;
  curtain.querySelector('p').textContent = tracking ? `OPENING ORDER ${order.no}.` : 'PAYMENT RECEIVED. YOUR SUIT GOES TO THE CUTTER.';
  curtain.classList.remove('off'); curtain.classList.add('on'); await wait(750);
  done(); document.body.className = `mode-journey ready${tracking ? ' tracking' : ''}`; scrollTo(0, 0);
  if (journey){ journey.dispose(); journey = null; }
  document.querySelectorAll('.oNo').forEach(e => e.textContent = order.no);
  document.querySelectorAll('.oTo').forEach(e => e.textContent = order.dest.city);
  document.querySelectorAll('.oName').forEach(e => e.textContent = order.name.split(' ')[0]);
  document.querySelectorAll('.oB').forEach(e => e.textContent = order.dest.code);
  document.querySelectorAll('.oRoute').forEach(e => e.textContent = `${order.origin.code} → ${order.dest.code}`);
  $('mapCopy').classList.toggle('pos-tr', order.dest.lon < order.origin.lon - 20 && order.dest.lat > order.origin.lat - 15);   // westbound routes that end top-left push the caption right; south-west routes keep the top-left free
  $('scItems').textContent = `${order.items.length} ${order.items.length > 1 ? 'SUITS' : 'SUIT'}`;
  if (tracking) fillStatus(order);
  try {
    await Promise.race([Promise.all(['600 40px "Bodoni Moda"', '400 40px "Bodoni Moda"', 'italic 400 40px "Bodoni Moda"', '700 20px "JetBrains Mono"', '500 20px "Hanken Grotesk"', '600 20px "Hanken Grotesk"'].map(f => document.fonts.load(f))), wait(2500)]);
    if (!T){ const logo = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = 'assets/logo.png'; }); T = makeTextures(logo); M = makeMats(T); }
    // a tracking link can be forwarded: the film shows the first name and city, never the street
    const shown = tracking ? { ...order, name: order.name.split(' ')[0] + (order.name.split(' ')[1] ? ' ' + order.name.split(' ')[1][0] + '.' : ''), street: ' ' } : order;
    journey = await initJourney({ T, M, order: shown, limit: tracking ? STAGES[order.stage].rest : 1 });
  } catch (e) { console.error('[journey] journey failed', e); }
  await wait(500); curtain.classList.add('off'); await wait(600); curtain.classList.remove('on', 'off');
  setAuto(true);
}
async function backToShop(){
  setAuto(false); tracking = null; curtain.querySelector('p').textContent = 'BACK TO THE RAIL.';
  curtain.classList.remove('off'); curtain.classList.add('on'); await wait(750);
  if (journey){ journey.dispose(); journey = null; }
  document.body.className = 'mode-shop ready'; scrollTo(0, 0);
  try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  curtain.classList.add('off'); await wait(600); curtain.classList.remove('on', 'off');
}
$('again').addEventListener('click', backToShop); $('stShop').addEventListener('click', backToShop);
$('replay').addEventListener('click', () => { scrollTo(0, 0); setAuto(true); }); $('stReplay').addEventListener('click', () => { scrollTo(0, 0); setAuto(true); });

/* ── tracking ── */
const trackPanel = $('track'), trackForm = $('trackForm'), trackErr = $('trackErr');
function openTrack(on, no = ''){
  trackPanel.classList.toggle('on', on); trackPanel.setAttribute('aria-hidden', !on); trackErr.textContent = '';
  if (!on) return;
  if (no) trackForm.no.value = no;
  const mine = listOrders().slice(0, 4);
  $('recent').innerHTML = mine.length ? `<p class="mono eyebrow">ON THIS DEVICE</p>` + mine.map(o => `<button type="button" data-no="${o.no}" data-em="${o.email}"><b>${o.no}</b><span>${o.items[0] ? o.items[0].name : ''} · ${STAGES[o.stage].label}</span></button>`).join('') : '';
  setTimeout(() => (no ? trackForm.email : trackForm.no).focus(), 60);
}
function track(no, email){
  const o = findOrder(no, email);
  if (!o){ trackErr.textContent = `We couldn't find order ${normNo(no) || ''}. Check the number on your confirmation.`; return; }
  if (o === 'mismatch'){ trackErr.textContent = "That email doesn't match this order."; return; }
  openTrack(false); try { history.replaceState(null, '', `?track=${o.no}`); } catch (e) {}
  startJourney(o, () => {}, 'track');
}
$('trackBtn').addEventListener('click', () => openTrack(true)); $('trackX').addEventListener('click', () => openTrack(false));
trackPanel.addEventListener('click', e => { if (e.target === trackPanel) openTrack(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && trackPanel.classList.contains('on')) openTrack(false); });
trackForm.addEventListener('submit', e => { e.preventDefault(); track(trackForm.no.value, trackForm.email.value); });
$('recent').addEventListener('click', e => { const b = e.target.closest('button[data-no]'); if (b) track(b.dataset.no, b.dataset.em); });
$('trackThis').addEventListener('click', () => { const o = findOrder($('trackThis').dataset.no); if (o && o !== 'mismatch') startJourney(o, () => {}, 'track'); });
// the atelier moved an order on (another tab): the film carries on to where it is now
onOrdersChange(() => {
  if (!tracking || !journey) return; const o = findOrder(tracking.no); if (!o || o === 'mismatch' || o.stage === tracking.stage) return;
  tracking = o; fillStatus(o); journey.setLimit(STAGES[o.stage].rest); setAuto(true);
});

/* first light: the page opens like a door, once per visit (click or any key skips it) */
const deepTrack = new URLSearchParams(location.search).get('track');
(function intro(){
  const el = $('intro'); let seen = false;
  try { seen = sessionStorage.getItem('nm-intro') === '1'; sessionStorage.setItem('nm-intro', '1'); } catch (e) {}
  if (!el || seen || deepTrack || matchMedia('(prefers-reduced-motion: reduce)').matches){ if (el) el.remove(); document.body.classList.add('ready'); return; }
  document.body.classList.add('intro-on');
  const open = () => { if (el.classList.contains('open')) return; el.classList.add('open'); document.body.classList.add('ready'); setTimeout(() => { el.remove(); document.body.classList.remove('intro-on'); }, 1300); };
  el.addEventListener('click', open); addEventListener('keydown', open, { once: true }); setTimeout(open, 2100);
})();

// after payment the order is saved (stage: Measured), then the preview film plays the whole journey ahead
const shop = initShop({ onPaid: (order, done) => { const saved = saveOrder(order); $('trackThis').dataset.no = saved.no; startJourney(order, done, 'preview'); } });
// a tracking link (?track=ATX-12345). PROTOTYPE: opens straight away; live, the link carries a signed token instead
if (deepTrack){ const o = findOrder(deepTrack); if (o && o !== 'mismatch') startJourney(o, () => {}, 'track'); else openTrack(true, deepTrack); }

addEventListener('scroll', () => document.body.classList.toggle('scrolled', scrollY > 8 && document.body.classList.contains('mode-shop')), { passive: true });
function loop(now){
  const t = now / 1000, dt = Math.min(.05, t - lastT); lastT = t;
  if (document.body.classList.contains('mode-shop')) shop.update(t);
  else if (journey){
    if (auto){
      const max = document.documentElement.scrollHeight - innerHeight, speed = journey.fullScroll / SECONDS;   // same pace whether the film runs to the door or stops early
      scrollTo(0, Math.min(max, scrollY + speed * dt)); if (scrollY >= max - 1) setAuto(false);
    }
    journey.update(t);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
