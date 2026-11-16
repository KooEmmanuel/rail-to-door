import { PRODUCTS, CITIES, ORIGIN, CONFIG, CATEGORIES, CURRENCY, FABRICS, MTM, COLOURS, MEASURES } from './data.js';
import { recolour } from './recolour.js';
import { initTryOn } from './tryon.js';
import { fabricOf, mtmPrice, swatchURL } from './fabrics.js';

const $ = id => document.getElementById(id);

/* ── currency: prices live in CURRENCY.base and are shown in the shopper's chosen currency ── */
const store = { get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch (e) {} } };
let ccy = CURRENCY.list[store.get('nm-currency')] ? store.get('nm-currency') : CURRENCY.default;
const fmts = {};
const conv = base => { const c = CURRENCY.list[ccy]; return Math.round(base * c.rate / c.step) * c.step; };
const money = n => { const c = CURRENCY.list[ccy]; fmts[ccy] ||= new Intl.NumberFormat(c.locale, { style: 'currency', currency: ccy, maximumFractionDigits: 0, minimumFractionDigits: 0 }); return fmts[ccy].format(n); };
const defSize = p => (p.sizes.includes('40R') ? '40R' : p.sizes.includes('M') ? 'M' : p.sizes[0]);
const isVest = p => p.cats.some(c => c.endsWith('-vest'));
const colourOf = (p, key) => (key && COLOURS[key]) || null;
// the picture of a piece in its chosen colour (ready to wear) or cloth (made to measure); the photo itself when unchanged
const pictured = (p, side, l) => { const src = p[side], f = fabricOf(l.fab), c = colourOf(p, l.col);
  if (f) return recolour(src, { hex: f.color, fabric: f });
  if (c && l.col !== p.colours[0]) return recolour(src, { hex: c.hex });
  return Promise.resolve(src); };
const sameMeasure = (a, b) => JSON.stringify(a || null) === JSON.stringify(b || null);

/* ── the garment bag: a tall midnight cover, copper hook and pull, centre zip, hanger hook out of the top, monogram on the chest ── */
const COVER = 'M44 13H56C58.5 13 59.5 15 62 16.5L92 30C96 32 97 35 97 39V192C97 196 95 198 91 198H9C5 198 3 196 3 192V39C3 35 4 32 8 30L38 16.5C40.5 15 41.5 13 44 13Z';
let bagN = 0;
function bagMarkup(){
  const id = 'gz' + (++bagN), ns = 'vector-effect="non-scaling-stroke"';
  return `<svg class="gb-cover" viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="${id}g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
    <mask id="${id}m"><rect width="100" height="200" fill="#fff"/><path class="gz-gap" fill="#000" d="M0 0"/></mask></defs>
    <path d="M50 15V8.5C50 3.5 58 3.5 58 8.5" fill="none" stroke="#985322" stroke-width="2" stroke-linecap="round" ${ns}/>
    <g mask="url(#${id}m)"><path d="${COVER}" fill="#0E1A2B"/><path d="${COVER}" fill="url(#${id}g)"/>
      <path d="M7.5 41V190C7.5 192.5 8.5 193.5 11 193.5H89C91.5 193.5 92.5 192.5 92.5 190V41" fill="none" stroke="rgba(245,242,234,.2)" stroke-width="1" stroke-dasharray="3 3" ${ns}/>
      <line x1="50" x2="50" y1="16" y2="192" stroke="#08111D" stroke-width="3.2" ${ns}/><line x1="50" x2="50" y1="16" y2="192" stroke="#CFCABB" stroke-width="1.3" stroke-dasharray="1.6 1.6" ${ns}/></g>
    <path class="gz-edge" d="M0 0" fill="none" stroke="#3A4A62" stroke-width="1.6" ${ns}/>
    <rect class="gz-pull" x="47.4" y="15" width="5.2" height="9" rx="1.5" fill="#985322"/>
  </svg><i class="gb-mark"></i>`;
}
// k: 0 = open down to the hem, 1 = zipped to the collar
function setZip(bag, k){
  const yp = 190 - (190 - 17) * k, t = (yp - 15) / 175, g = 33 * t, m = yp - 15;
  const d = k >= 1 ? 'M0 0' : `M50 ${yp}C${50 - g * .3} ${yp - m * .5} ${50 - g} ${15 + m * .32} ${50 - g} 15L${50 + g} 15C${50 + g} ${15 + m * .32} ${50 + g * .3} ${yp - m * .5} 50 ${yp}Z`;
  bag.querySelector('.gz-gap').setAttribute('d', d); bag.querySelector('.gz-edge').setAttribute('d', d);
  bag.querySelector('.gz-pull').setAttribute('y', yp - 2); bag.classList.toggle('marked', yp < 52); bag.classList.toggle('shut', k >= 1);
}
// the picked-up suit, with its garment bag closing over it (about half a second)
function bagGhost(p, r, src){
  const bw = Math.max(r.width * 1.04, r.height * .5), g = document.createElement('div'); g.className = 'ghost';
  g.innerHTML = `<div class="gbag" style="width:${bw}px;height:${r.height}px"><img class="gb-suit" src="${src || p.front}" alt="">${bagMarkup()}</div>`;
  const bag = g.firstChild, R = { left: r.left + r.width / 2 - bw / 2, top: r.top, width: bw, height: r.height }; setZip(bag, 0);
  const zipped = new Promise(done => { let t0 = 0; const step = now => { if (!t0){ t0 = now + 130; bag.classList.add('on'); } const k = Math.min(1, Math.max(0, (now - t0) / 520)); setZip(bag, k * k * (3 - 2 * k)); if (k < 1 && g.isConnected) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
  return { g, R, zipped, bag };
}

export function initShop({ onPaid }){
  // the container (bag / basket / cart / box) and the word for one product come from CONFIG
  const CW = CONFIG.container.word, IW = CONFIG.itemWord; document.body.dataset.container = CONFIG.container.kind;
  document.querySelectorAll('.cw').forEach(e => { e.textContent = CW; }); document.querySelectorAll('.iw').forEach(e => { e.textContent = IW; });
  ['bagBtn', 'tote'].forEach(id => $(id).setAttribute('aria-label', 'Open ' + CW));
  const cart = [];               // [{id, size, qty, col, fab, measure}] — ready to wear: col + size; made to measure: fab + measure
  document.querySelectorAll('.mtmWeeks').forEach(e => { e.textContent = MTM.weeks; }); document.querySelectorAll('.rtwDays').forEach(e => { e.textContent = MTM.rtwDays; });
  const byId = id => PRODUCTS.find(p => p.id === id);
  const count = () => cart.reduce((n, l) => n + l.qty, 0);
  // every amount on screen is the converted unit price × qty, so the lines always add up
  const unit = l => mtmPrice(byId(l.id), l.fab);
  const baseSub = () => cart.reduce((n, l) => n + l.qty * unit(l), 0);
  const subtotal = () => cart.reduce((n, l) => n + l.qty * conv(unit(l)), 0);
  const shipping = () => (!cart.length || baseSub() >= CURRENCY.freeShippingOver ? 0 : conv(CURRENCY.shipping));

  /* ── the rail: pieces hang side-on and turn to face you ── */
  const pieces = $('pieces'), tote = $('tote');
  const unface = () => pieces.querySelectorAll('.piece').forEach(p => p.classList.remove('facing'));
  let dragging = false;
  PRODUCTS.forEach((it, k) => {
    const d = document.createElement('div'); d.className = 'piece'; d.tabIndex = 0; d.dataset.cats = it.cats.join(' ');
    if (it.scale) d.style.setProperty('--s', it.scale);
    d.setAttribute('role', 'button'); d.setAttribute('aria-label', `${it.name} — ${it.cat}. Enter to open.`);
    d.innerHTML = `<div class="face side"><img src="${it.side}" alt="" draggable="false"></div>
      <div class="face front"><img src="${it.front}" alt="" draggable="false"></div>
      <div class="tag" data-base="${it.price}"></div><div class="label">${it.name}<i>drag to ${CW}</i></div>`;
    const face = () => { if (dragging) return; unface(); d.classList.add('facing'); };
    d.addEventListener('mouseenter', face); d.addEventListener('focus', face);
    d.addEventListener('keydown', e => { if (e.key === 'Enter') open(k); });
    pieces.append(d); drag(d, it, k, face);
  });
  pieces.addEventListener('mouseleave', () => { if (!dragging) unface(); });

  /* ── the collections: filter the rail ── */
  const catsNav = $('cats'), catNote = $('catNote');
  const inCat = key => PRODUCTS.filter(p => key === 'all' || p.cats.includes(key)).length;
  catsNav.innerHTML = [{ key: 'all', label: 'All' }, ...CATEGORIES].map(c => `<button type="button" data-k="${c.key}" aria-pressed="false">${c.label}<sup>${inCat(c.key)}</sup></button>`).join('');
  let curCat = 'all';
  function setCat(key, push){
    if (key !== 'all' && !CATEGORIES.some(c => c.key === key)) key = 'all';
    curCat = key;
    unface();
    catsNav.querySelectorAll('button').forEach(b => { const on = b.dataset.k === key; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    pieces.querySelectorAll('.piece').forEach(el => { const out = key !== 'all' && !el.dataset.cats.split(' ').includes(key); el.classList.toggle('out', out); el.tabIndex = out ? -1 : 0; el.setAttribute('aria-hidden', out); });
    const c = CATEGORIES.find(x => x.key === key);
    catNote.innerHTML = c ? `<b>${c.long}.</b> ${c.blurb}` : `<b>${CATEGORIES.length} collections.</b> Ready today, or cut to your measure.`;
    catNote.classList.remove('in'); void catNote.offsetWidth; catNote.classList.add('in');
    if (pieces.scrollTo) pieces.scrollTo({ left: 0, behavior: 'smooth' });
    // a chosen collection presents its first piece already turned to you
    const first = pieces.querySelector('.piece:not(.out)'); if (c && first) setTimeout(() => { if (!dragging) first.classList.add('facing'); }, 420);
    if (push){ try { history.replaceState(null, '', key === 'all' ? location.pathname : '#' + key); } catch (e) {} }
  }
  catsNav.addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) setCat(b.dataset.k, true); });
  const fromHash = () => setCat(decodeURIComponent(location.hash.slice(1)) || 'all', false);
  addEventListener('hashchange', fromHash); fromHash();

  /* ── drag a piece off the rail and into the bag ── */
  function drag(el, p, k, face){
    let st = null;
    el.addEventListener('pointerdown', e => { if (e.button) return; st = { x: e.clientX, y: e.clientY, on: false, touch: e.pointerType === 'touch', was: el.classList.contains('facing') }; if (!st.touch){ try { el.setPointerCapture(e.pointerId); } catch (err) {} } });
    el.addEventListener('pointermove', e => {
      if (!st || st.touch) return;
      if (!st.on){
        if (Math.hypot(e.clientX - st.x, e.clientY - st.y) < 8) return;
        // the ghost starts exactly where the facing garment hangs
        const vis = el.querySelector(el.classList.contains('facing') ? '.front img' : '.side img').getBoundingClientRect();
        const h = el.querySelector('.face').offsetHeight, w = h * p.w / p.h;
        const gb = bagGhost(p, { left: vis.left + vis.width / 2 - w / 2, top: vis.top, width: w, height: h }); st.r = gb.R; st.gb = gb;
        st.on = true; st.ox = e.clientX - st.r.left; st.oy = e.clientY - st.r.top; st.rot = 0; st.px = e.clientX;
        st.g = gb.g;
        st.g.style.transformOrigin = `${st.ox}px ${Math.min(st.oy, 40)}px`;
        document.body.append(st.g); el.classList.add('lifted'); document.body.classList.add('dragging'); dragging = true;
      }
      st.rot += ((e.clientX - st.px) * -1.5 - st.rot) * .22; st.px = e.clientX;
      st.g.style.transform = `translate(${e.clientX - st.ox}px,${e.clientY - st.oy}px) rotate(${st.rot.toFixed(1)}deg)`;
      tote.classList.toggle('hot', overBag(e));
    });
    const up = e => {
      if (!st) return; const s = st; st = null;
      if (!s.on){ // a plain click: desktop opens the viewer; touch turns it first, then opens
        if (e.type === 'pointercancel') return;
        if (s.touch && !s.was) face(); else open(k);
        return;
      }
      document.body.classList.remove('dragging'); tote.classList.remove('hot'); dragging = false;
      if (overBag(e)){ const x = e.clientX - s.ox, y = e.clientY - s.oy; s.g.style.transition = 'transform .3s'; s.g.style.transform = `translate(${x}px,${y}px) rotate(0deg)`;   // the zip finishes before the bagged suit goes in
        s.gb.zipped.then(() => { swallow(s.g, x, y, s.r); add({ id: p.id, size: defSize(p), col: p.colours[0] }); setTimeout(() => { el.classList.remove('lifted'); el.classList.add('swing'); setTimeout(() => el.classList.remove('swing'), 950); }, 420); }); }
      else { // spring back onto the rail, out of its bag
        s.gb.bag.classList.add('off'); s.g.style.transition = 'transform .5s cubic-bezier(.3,1.35,.5,1)'; s.g.style.transform = `translate(${s.r.left}px,${s.r.top}px) rotate(0deg)`;
        setTimeout(() => { s.g.remove(); el.classList.remove('lifted'); }, 480);
      }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  const overBag = e => { const r = tote.getBoundingClientRect(), m = 80; return e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - m && e.clientY < r.bottom + m; };
  function swallow(g, x, y, r){
    const b = tote.getBoundingClientRect(), s = Math.min(.34, (b.width * .36) / r.width);
    g.style.transformOrigin = '0 0'; g.style.transition = 'none'; g.style.transform = `translate(${x}px,${y}px)`; g.getBoundingClientRect();
    g.style.transition = 'transform .55s cubic-bezier(.5,0,.3,1), opacity .55s';
    g.style.transform = `translate(${b.left + b.width / 2 - r.width * s / 2}px,${b.top + b.height * .12}px) scale(${s})`; g.style.opacity = '.2';
    setTimeout(() => g.remove(), 560);
  }

  /* ── focus view: turn a piece front / back, pick a size ── */
  const focus = $('focus'), card = $('card'), viewer = $('viewer'); let angle = 0, cur = null, size = null;
  // ready to wear: type → colour → size (it hangs ready, ships in days)
  // made to measure: type → cloth → body measurements (cut and sewn for you, in weeks)
  let mode = 'rtw', fab = null, prefFab = null, col = null, paintN = 0;
  const fabBox = $('fabrics'), colBox = $('colours'), imgF = $('imgFront'), imgB = $('imgBack');
  fabBox.innerHTML = FABRICS.map(f => `<button type="button" role="radio" aria-checked="false" data-f="${f.key}" title="${f.name}" aria-label="${f.name}" style="background-image:url(${swatchURL(f, 96)})"></button>`).join('');
  fabBox.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) setFab(b.dataset.f); });
  colBox.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) setCol(b.dataset.c); });
  // body measurements, remembered on this device for the next piece
  const mBox = $('vMeasure'); let saved = {}; try { saved = JSON.parse(store.get('nm-measure')) || {}; } catch (e) {}
  mBox.innerHTML = MEASURES.map(m => `<label data-k="${m.key}"><span>${m.label}</span><input name="m-${m.key}" type="number" inputmode="numeric" min="${m.min}" max="${m.max}" value="${+saved[m.key] || m.def}" required></label>`).join('');
  const readMeasure = () => { const o = {}; MEASURES.forEach(m => { o[m.key] = +mBox.querySelector(`[name=m-${m.key}]`).value; }); return o; };
  mBox.addEventListener('change', () => store.set('nm-measure', JSON.stringify(readMeasure())));
  const viewPrice = () => { if (!cur) return; $('fPrice').innerHTML = mode === 'mtm' ? `${money(conv(mtmPrice(cur, fab)))} <small>made to measure</small>` : `${money(conv(cur.price))} <small>ready to wear</small>`; };
  // repaint the suit in the chosen colour or cloth (front and back), keeping only the latest request
  function paint(){
    if (!cur) return; const n = ++paintN, l = mode === 'mtm' ? { fab } : { col };
    const chip = $('clothChip'), f = fabricOf(fab), c = colourOf(cur, col);
    $('chipLab').textContent = mode === 'mtm' ? 'Your cloth' : 'Colour';
    chip.querySelector('i').style.background = mode === 'mtm' ? `url(${swatchURL(f, 96)}) center/cover` : c.hex;
    chip.querySelector('b').textContent = mode === 'mtm' ? f.name : c.name;
    $('viewer').classList.add('painting');
    Promise.all([pictured(cur, 'front', l), pictured(cur, 'back', l)]).then(([fr, bk]) => {
      if (n !== paintN) return; imgF.src = fr; imgB.src = bk; $('viewer').classList.remove('painting'); }).catch(() => $('viewer').classList.remove('painting'));
  }
  function setCol(key){
    col = key; const c = colourOf(cur, key);
    colBox.querySelectorAll('[data-c]').forEach(b => { const on = b.dataset.c === key; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $('colName').textContent = c.name + (key === cur.colours[0] ? ' · as pictured' : '');
    if (mode === 'rtw') paint(); }
  function setFab(key){
    fab = key; const f = fabricOf(key);
    fabBox.querySelectorAll('[data-f]').forEach(b => { const on = b.dataset.f === key; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    $('fabName').textContent = f.name; $('fabMeta').textContent = `${f.comp} · ${f.weight} · ${f.season} · + ${money(conv(MTM.fee + f.add))}`;
    if (mode === 'mtm') setMode('mtm'); }
  function setMode(m){
    mode = m; focus.dataset.mode = m;
    focus.querySelectorAll('.buy-mode button').forEach(b => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    if (m === 'mtm' && !fab){ setFab(prefFab || FABRICS[0].key); return; }
    $('vNote').textContent = m === 'mtm' ? `Cut and sewn for you in ${fabricOf(fab).name} from your measurements, in ${MTM.weeks} weeks.` : `Already made and hanging in Lisbon. Pressed and dispatched in ${MTM.rtwDays} days.`;
    viewPrice(); paint(); }
  focus.querySelectorAll('.buy-mode button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  const isBack = () => ((Math.round(angle / 180) % 2) + 2) % 2 === 1;
  const setAngle = a => { angle = a; card.style.transform = `rotateY(${a}deg)`; focus.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', (b.dataset.side === 'back') === isBack())); };
  function open(k){
    cur = PRODUCTS[k]; size = defSize(cur); fab = null; col = cur.colours[0];
    imgF.src = cur.front; imgB.src = cur.back; $('fTitle').textContent = cur.name; $('fCat').textContent = cur.cat || '';
    $('fType').textContent = cur.cats.map(k => (CATEGORIES.find(c => c.key === k) || { label: k }).label).join(' · ');
    colBox.innerHTML = cur.colours.map(key => `<button type="button" role="radio" aria-checked="false" data-c="${key}" title="${COLOURS[key].name}" aria-label="${COLOURS[key].name}" style="background:${COLOURS[key].hex}"></button>`).join('');
    mBox.querySelector('[data-k=inseam]').hidden = isVest(cur);   // no trousers with a waistcoat
    setCol(col);
    if (prefFab) setFab(prefFab); setMode(prefFab ? 'mtm' : 'rtw');   // a cloth chosen below the rail opens the piece made to measure
    const sz = $('sizes'); sz.innerHTML = cur.sizes.map(s => `<button class="${s === size ? 'on' : ''}">${s}</button>`).join('');
    sz.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { size = b.textContent; sz.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }));
    focus.classList.add('open'); document.body.style.overflow = 'hidden'; setAngle(0);
  }
  const close = () => { focus.classList.remove('open'); document.body.style.overflow = ''; unface(); };
  $('close').addEventListener('click', close); focus.addEventListener('click', e => { if (e.target === focus) close(); });
  focus.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { if ((b.dataset.side === 'back') !== isBack()) setAngle(angle + 180); }));
  let sx = 0, base = 0, vd = false;
  viewer.addEventListener('pointerdown', e => { sx = e.clientX; base = angle; vd = true; viewer.setPointerCapture(e.pointerId); viewer.classList.add('dragging'); });
  viewer.addEventListener('pointermove', e => { if (!vd) return; angle = base + (e.clientX - sx) * .6; card.style.transform = `rotateY(${angle}deg)`; });
  const settle = () => { if (!vd) return; vd = false; viewer.classList.remove('dragging'); setAngle(Math.round(angle / 180) * 180); };
  viewer.addEventListener('pointerup', settle); viewer.addEventListener('pointercancel', settle);
  // try it on: the suit as shown (its colour or cloth) on the customer's own photo
  const tryOn = initTryOn();
  $('fTry').addEventListener('click', () => {
    const f = fabricOf(fab), c = colourOf(cur, col);
    tryOn.open({ product: cur, picture: imgF.src, whole: isVest(cur), key: `${cur.id}|${mode === 'mtm' ? 'f:' + fab : 'c:' + col}`,
      label: mode === 'mtm' ? `${f.name} · made to measure` : `${c.name} · ready to wear` }, $('fTry'));
  });
  $('fAdd').addEventListener('click', () => {
    if (mode === 'mtm'){ const bad = [...mBox.querySelectorAll('label:not([hidden]) input')].find(i => !i.checkValidity()); if (bad){ bad.reportValidity(); bad.focus(); return; } store.set('nm-measure', JSON.stringify(readMeasure())); }
    const r0 = card.getBoundingClientRect(), p = cur, line = mode === 'mtm' ? { id: p.id, size: null, fab, measure: readMeasure() } : { id: p.id, size, col };
    const h = Math.min(r0.height, r0.width * p.h / p.w), w = h * p.w / p.h, gb = bagGhost(p, { left: r0.left + r0.width / 2 - w / 2, top: r0.top, width: w, height: h }, imgF.src), g = gb.g, r = gb.R;
    document.body.append(g); g.style.transform = `translate(${r.left}px,${r.top}px)`;
    close(); gb.zipped.then(() => { swallow(g, r.left, r.top, r); add(line); });   // zipped into its garment bag first, then into the bag
  });

  /* ── cart state ── */
  function add(n){
    n = { size: null, col: null, fab: null, measure: null, ...n };
    const l = cart.find(x => x.id === n.id && x.size === n.size && x.col === n.col && x.fab === n.fab && sameMeasure(x.measure, n.measure)); l ? l.qty++ : cart.push({ ...n, qty: 1 });
    setTimeout(() => { tote.classList.remove('gulp'); void tote.offsetWidth; tote.classList.add('gulp'); render(); const bb = $('bagBtn'); bb.classList.remove('bump'); void bb.offsetWidth; bb.classList.add('bump'); }, 420);
  }
  function render(){
    const n = count();
    $('bagCount').textContent = n; $('toteBadge').textContent = n; tote.classList.toggle('has', n > 0); $('goCart').disabled = !n; $('toPay').disabled = !n;
    $('totePeek').innerHTML = Array.from({ length: Math.min(3, n) }, (_, i) => `<span class="gbag mini on shut marked" style="--r:${[-7, 6, -1][i]}deg">${bagMarkup()}</span>`).join('');   // what peeks out is the garment bag, not the bare suit
    $('lines').innerHTML = cart.length ? cart.map((l, i) => { const p = byId(l.id), f = fabricOf(l.fab), c = colourOf(p, l.col); return `<div class="line"><div class="th"><img data-pic="${i}" src="${p.front}" alt="">${f ? `<i class="th-sw" style="background-image:url(${swatchURL(f, 64)})"></i>` : ''}</div>
      <div><b>${p.name}</b>${f ? `<span class="mtm-tag">Made to measure · ${f.name}</span>` : `<span class="rtw-tag">Ready to wear · ${c ? c.name : ''}</span><select data-i="${i}" aria-label="Size">${p.sizes.map(s => `<option${s === l.size ? ' selected' : ''}>${s}</option>`).join('')}</select>`}
      <span class="qty"><button data-i="${i}" data-d="-1" aria-label="Less">−</button>${l.qty}<button data-i="${i}" data-d="1" aria-label="More">+</button></span></div>
      <div class="pr">${money(conv(unit(l)) * l.qty)}<button class="rm" data-i="${i}" data-d="x">Remove</button></div></div>`; }).join('')
      : `<p class="empty">Your ${CW} is empty.<br>Choose a ${IW} from the rail.</p>`;
    pics($('lines'));
    $('subTotal').textContent = money(subtotal()); $('shipCost').textContent = !cart.length ? '—' : shipping() ? money(shipping()) : 'Free';
  }
  // swap each thumbnail for the piece in its chosen colour or cloth
  const pics = root => root.querySelectorAll('img[data-pic]').forEach(img => { const l = cart[+img.dataset.pic]; if (l) pictured(byId(l.id), 'front', l).then(u => { img.src = u; }); });
  $('lines').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]'); if (!b) return; const l = cart[+b.dataset.i];
    if (b.dataset.d === 'x' || (l.qty += +b.dataset.d) <= 0) cart.splice(+b.dataset.i, 1); render();
  });
  $('lines').addEventListener('change', e => { const s = e.target.closest('select[data-i]'); if (s){ cart[+s.dataset.i].size = s.value; } });

  /* ── drawer + demo payment ── */
  const drawer = $('drawer'), scrim = $('scrim'), pay = $('pay');
  const openDrawer = on => { drawer.classList.toggle('on', on); scrim.classList.toggle('on', on); drawer.setAttribute('aria-hidden', !on); };
  [$('bagBtn'), tote, $('goCart')].forEach(b => b.addEventListener('click', () => openDrawer(true)));
  [$('drawerX'), scrim].forEach(b => b.addEventListener('click', () => openDrawer(false)));
  const citySel = $('citySel'); CITIES.forEach(c => citySel.add(new Option(`${c.city}, ${c.country}`, c.code)));
  function openPay(on){
    if (on){
      $('sum').innerHTML = cart.map((l, i) => { const p = byId(l.id), f = fabricOf(l.fab), c = colourOf(p, l.col); return `<div class="si"><i><img data-pic="${i}" src="${p.front}" alt=""></i><span>${p.name}<small>${f ? `Made to measure · ${f.name}` : `${c ? c.name + ' · ' : ''}Size ${l.size}`} · Qty ${l.qty}</small></span><b>${money(conv(unit(l)) * l.qty)}</b></div>`; }).join('');
      pics($('sum'));
      const needM = cart.some(l => l.fab), mb = $('measureBlock'); mb.hidden = !needM;
      if (needM){ const m = cart.find(l => l.fab).measure; $('measureSum').innerHTML = MEASURES.filter(x => m[x.key]).map(x => `<span>${x.label} <b>${m[x.key]}</b></span>`).join(''); }
      $('leadTime').textContent = needM ? `Made to measure: cut and sewn for you in ${MTM.weeks} weeks.${cart.some(l => !l.fab) ? ' Your ready-to-wear pieces travel with it.' : ''}` : `Ready to wear: dispatched in ${MTM.rtwDays} days.`;
      const tot = subtotal() + shipping();
      $('pSub').textContent = money(subtotal()); $('pShip').textContent = shipping() ? money(shipping()) : 'Free'; $('pTotal').textContent = money(tot); $('payAmt').textContent = money(tot);
      $('payBtn').className = 'or-btn wide pay-btn'; $('payBtn').disabled = false; openDrawer(false);
    }
    pay.classList.toggle('on', on); pay.setAttribute('aria-hidden', !on);
  }
  $('toPay').addEventListener('click', () => cart.length && openPay(true));
  $('payX').addEventListener('click', () => openPay(false));
  addEventListener('keydown', e => { if (e.key !== 'Escape') { if (focus.classList.contains('open')){ if (e.key === 'ArrowRight') setAngle(angle + 180); if (e.key === 'ArrowLeft') setAngle(angle - 180); } return; } close(); openPay(false); openDrawer(false); });
  $('payForm').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, btn = $('payBtn'); if (btn.disabled || !cart.length) return;
    btn.disabled = true; btn.classList.add('busy');
    const order = {
      no: 'ATX-' + String(Math.floor(10000 + Math.random() * 89999)), name: f.name.value.trim() || 'Friend', street: f.street.value.trim(),
      dest: CITIES.find(c => c.code === f.city.value), origin: ORIGIN, total: subtotal() + shipping(), currency: ccy,
      email: f.email.value.trim(), mtm: cart.some(l => l.fab),
      measure: (cart.find(l => l.fab) || {}).measure || null,
      items: cart.flatMap(l => { const p = byId(l.id), fb = fabricOf(l.fab), c = colourOf(p, l.col); return Array.from({ length: l.qty }, () => ({ ...p, size: fb ? 'Made to measure' : l.size, fab: l.fab || null,
        fabric: fb ? { key: fb.key, name: fb.name, color: fb.color, weave: fb.weave } : null, measure: l.measure || null,
        colour: c ? { key: l.col, name: c.name, hex: c.hex } : null, color: fb ? fb.color : c && l.col !== p.colours[0] ? c.hex : p.color })); })
    };
    setTimeout(() => { btn.classList.remove('busy'); btn.classList.add('done'); }, 1300);   // simulated payment — nothing is charged
    setTimeout(() => { onPaid(order, () => { openPay(false); cart.length = 0; render(); }); }, 2000);
  });

  /* ── the bag steps aside below the rail while it is empty ── */
  if ('IntersectionObserver' in window){
    const seen = new Set(), zone = $('bagZone');   // the cloth swatches and the promise below the rail
    const tuck = () => zone.classList.toggle('tuck', seen.size > 0 && !count());
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); tuck(); }, { rootMargin: '0px 0px -8% 0px' });
    ['.cloth-grid', '.creed'].forEach(sel => io.observe(document.querySelector(sel)));
    tote.addEventListener('gulp', tuck); addEventListener('scroll', tuck, { passive: true });
  }

  /* ── rail arrows, shown only when the row is wider than its space ── */
  const rail = pieces.parentElement, prevB = $('railPrev'), nextB = $('railNext');
  function railState(){
    const over = pieces.scrollWidth > pieces.clientWidth + 4; rail.classList.toggle('scrolls', over);
    prevB.disabled = pieces.scrollLeft < 8; nextB.disabled = pieces.scrollLeft > pieces.scrollWidth - pieces.clientWidth - 8;
  }
  const nudge = d => pieces.scrollBy({ left: d * pieces.clientWidth * .6, behavior: 'smooth' });
  prevB.addEventListener('click', () => nudge(-1)); nextB.addEventListener('click', () => nudge(1));
  pieces.addEventListener('scroll', railState, { passive: true }); addEventListener('resize', railState);
  pieces.addEventListener('transitionend', e => { if (e.propertyName === 'width') railState(); });
  catsNav.addEventListener('click', () => setTimeout(railState, 750));
  requestAnimationFrame(railState);

  /* ── the cloth: choose a cloth, then any piece opens made to measure in it ── */
  const clothGrid = $('clothGrid');
  clothGrid.innerHTML = FABRICS.map(f => `<button type="button" class="swatch" data-f="${f.key}" aria-pressed="false"><span class="sw-img" style="background-image:url(${swatchURL(f, 320)})"></span>
    <span class="sw-txt"><b>${f.name}</b><span class="sw-comp">${f.comp} · ${f.weight}</span><span class="sw-foot"><i>${f.season}</i><em class="sw-add" data-add="${f.add}" title="Over the ready-to-wear price"></em></span></span></button>`).join('');
  function chooseCloth(key){
    prefFab = key && prefFab !== key ? key : null;
    clothGrid.querySelectorAll('[data-f]').forEach(b => { const on = b.dataset.f === prefFab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    document.body.classList.toggle('has-cloth', !!prefFab);
    if (!prefFab){ setCat(curCat, false); return; }
    const f = fabricOf(prefFab);
    catNote.innerHTML = `<i class="note-sw" style="background-image:url(${swatchURL(f, 64)})"></i><b>${f.name}.</b> Now pick any piece: it opens made to measure in this cloth. <button type="button" class="clear-fab">Clear</button>`;
    catNote.classList.remove('in'); void catNote.offsetWidth; catNote.classList.add('in');
    document.querySelector('.rail').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }
  clothGrid.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) chooseCloth(b.dataset.f); });
  catNote.addEventListener('click', e => { if (e.target.closest('.clear-fab')) chooseCloth(null); });

  /* ── currency switcher (header) ── */
  const curSel = $('curSel');
  Object.entries(CURRENCY.list).forEach(([code, c]) => curSel.add(new Option(c.label, code, false, code === ccy)));
  function prices(){
    pieces.querySelectorAll('.tag').forEach(t => { t.textContent = money(conv(+t.dataset.base)); });
    document.querySelectorAll('.freeOver').forEach(e => { e.textContent = money(conv(CURRENCY.freeShippingOver)); });
    if (cur && focus.classList.contains('open')) viewPrice();
    clothGrid.querySelectorAll('.sw-add').forEach(e => { e.textContent = `+ ${money(conv(MTM.fee + +e.dataset.add))}`; });
    render(); if (pay.classList.contains('on')) openPay(true);
  }
  curSel.addEventListener('change', () => { ccy = curSel.value; store.set('nm-currency', ccy); prices(); });

  prices();
  return { update(){} };
}
