import { TRYON } from './data.js';
import { maskOf } from './recolour.js';

// Try it on: the customer's photo + the suit as shown (its chosen colour or cloth) → a picture of them wearing it.
// The photo is held in memory only, for this visit. Nothing is stored on this site.
// tryOnRequest() is the one place that talks to the try-on service: swap it to go live (see TRYON in data.js).

const $ = id => document.getElementById(id);
const W = 768, H = 1024;   // what the model works at (3:4)
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => no(new Error('image')); i.src = src; });
const toBlob = (c, q = .92) => new Promise(ok => c.toBlob(ok, 'image/jpeg', q));
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* ── the garment picture the model wants: jacket only, hanger painted out, on white ── */
export async function garmentBlob({ product, picture, whole }){
  const [shown, mk, orig] = await Promise.all([loadImg(picture), loadImg(maskOf(product.front)), loadImg(product.front)]);
  const w = orig.naturalWidth, h = orig.naturalHeight, c = canvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
  const grab = img => { x.clearRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h); return x.getImageData(0, 0, w, h); };
  const md = grab(mk).data, od = grab(orig).data, out = grab(shown), d = out.data;
  // the cloth's average colour, and how wide the garment is on every row
  let r = 0, g = 0, b = 0, n = 0; const wd = new Uint16Array(h), lo = new Int32Array(h).fill(w), hi = new Int32Array(h).fill(-1);   // lo / hi: the cloth's left and right edge on each row
  for (let y = 0, j = 0; y < h; y++) for (let xx = 0; xx < w; xx++, j++){ const m = md[j * 4]; if (m > 38) wd[y]++; if (m > 127){ if (xx < lo[y]) lo[y] = xx; hi[y] = xx; } if (m > 204){ r += d[j * 4]; g += d[j * 4 + 1]; b += d[j * 4 + 2]; n++; } }
  r /= n || 1; g /= n || 1; b /= n || 1;
  let mx = 0; for (let y = 0; y < h * .6; y++) mx = Math.max(mx, wd[y]);
  let top = 0; while (top < h && wd[top] < mx * .25) top++;                                   // the shoulders: above them is only hook
  let hem = h; if (!whole) for (let y = Math.floor(h * .45); y < h; y++) if (wd[y] < mx * .62){ hem = y; break; }   // where the jacket ends and the trousers show
  const wood = (R, G, B) => R > 178 && R - B > 68 && R - G > 28 && R - G < 80 && G - B > 25, clothIsWood = r > 140 && r - b > 45;
  let x0 = w, x1 = 0, y0 = h, y1 = 0;
  for (let y = 0, j = 0; y < h; y++) for (let xx = 0; xx < w; xx++, j++){
    const i = j * 4, m = md[i] / 255, a = od[i + 3];
    if (y < top || y >= hem){ d[i + 3] = 0; continue; }
    const hanger = (a > 40 && m < .5) || (!clothIsWood && y < h * .34 && a > 40 && wood(od[i], od[i + 1], od[i + 2]));
    if (hanger && (xx < lo[y] || xx > hi[y])) d[i + 3] = 0;                                // hanger arms sticking out past the garment: gone
    else if (hanger){ d[i] = r * .55; d[i + 1] = g * .55; d[i + 2] = b * .55; d[i + 3] = a; }   // what shows inside the collar: lining shade, not a hanger
    else d[i + 3] = a * m;
    if (d[i + 3] > 40){ if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  x.putImageData(out, 0, 0);
  const gw = x1 - x0 + 1, gh = y1 - y0 + 1, s = Math.min(W * .86 / gw, H * .92 / gh), o = canvas(W, H), ox = o.getContext('2d');
  ox.fillStyle = '#fff'; ox.fillRect(0, 0, W, H); ox.imageSmoothingQuality = 'high';
  ox.drawImage(c, x0, y0, gw, gh, (W - gw * s) / 2, (H - gh * s) / 2, gw * s, gh * s);
  return toBlob(o);
}

/* ── the customer's photo, fitted to 3:4. cover: fill the frame (camera); otherwise show all of it on white ── */
function fitPhoto(src, sw, sh, { cover = false, mirror = false } = {}){
  const c = canvas(W, H), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.imageSmoothingQuality = 'high';
  const s = cover ? Math.max(W / sw, H / sh) : Math.min(W / sw, H / sh), dw = sw * s, dh = sh * s;
  if (mirror){ x.translate(W, 0); x.scale(-1, 1); }
  x.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return toBlob(c, .9);
}

/* ── the try-on service ── */
class TryError extends Error { constructor(kind, msg, retry){ super(msg || kind); this.kind = kind; this.retry = retry || null; } }
let fnIndex = null, route;   // route: the local server's try-on route when serve.py offers one, else null
// "Try again in 23:59:20" → the local clock time it works again
const retryIn = why => { const m = /(\d+):(\d{2}):(\d{2})/.exec(why || ''); return m ? ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 : null; };
async function localRoute(){
  if (route !== undefined) return route;
  try { const r = await fetch('api/tryon', { cache: 'no-store' }); route = r.ok && (await r.json()).proxy ? 'api/tryon' : null; } catch (e) { route = null; }
  return route;
}
async function tryOnRequest(person, garment, onState, signal){
  const endpoint = TRYON.endpoint || await localRoute();
  if (endpoint){   // a server holds any key and calls the service: your live server, or serve.py on this computer
    const fd = new FormData(); fd.append('person', person, 'person.jpg'); fd.append('garment', garment, 'garment.jpg');
    onState('work'); const r = await fetch(endpoint, { method: 'POST', body: fd, signal });
    if (!r.ok){ let j = {}; try { j = await r.json(); } catch (e) {} throw new TryError(r.status === 429 ? 'quota' : 'busy', j.error, retryIn(j.retry)); }
    return (await r.json()).url;
  }
  const B = TRYON.space + '/gradio_api';
  if (fnIndex == null){ const cfg = await (await fetch(TRYON.space + '/config', { signal })).json(); const dep = cfg.dependencies.find(x => x.api_name === 'leffa_predict_vt'); if (!dep) throw new TryError('busy'); fnIndex = dep.id; }
  onState('send');
  const up = async (blob, name) => { const fd = new FormData(); fd.append('files', blob, name); const r = await fetch(B + '/upload', { method: 'POST', body: fd, signal }); if (!r.ok) throw new TryError('busy'); return { path: (await r.json())[0], meta: { _type: 'gradio.FileData' } }; };
  const [p, g] = await Promise.all([up(person, 'person.jpg'), up(garment, 'garment.jpg')]);
  const session_hash = Math.random().toString(36).slice(2, 13);
  const j = await fetch(B + '/queue/join', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [p, g, false, TRYON.steps || 30, 2.5, 42, 'viton_hd', 'upper_body', false], fn_index: fnIndex, session_hash, event_data: null, trigger_id: null }) });
  if (!j.ok) throw new TryError('busy');
  onState('queue');
  const rd = (await fetch(`${B}/queue/data?session_hash=${session_hash}`, { signal })).body.getReader(), dec = new TextDecoder(); let buf = '';
  for (;;){
    const { value, done } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true });
    let k; while ((k = buf.indexOf('\n\n')) >= 0){
      const line = buf.slice(0, k).split('\n').find(l => l.startsWith('data:')); buf = buf.slice(k + 2); if (!line) continue;
      let m; try { m = JSON.parse(line.slice(5)); } catch (e) { continue; }
      if (m.msg === 'estimation' && m.rank > 0) onState('queue', m.rank);
      if (m.msg === 'process_starts') onState('work');
      if (m.msg === 'unexpected_error') throw new TryError('busy');
      if (m.msg === 'process_completed'){
        if (m.success && m.output && m.output.data && m.output.data[0]) return m.output.data[0].url;
        const why = `${m.title || ''} ${(m.output && m.output.error) || ''}`; throw new TryError(/quota/i.test(why) ? 'quota' : 'busy', why.trim(), retryIn(why));
      }
    }
  }
  throw new TryError('busy');
}

export function initTryOn(){
  const root = $('tryon'), video = $('tryVideo'), photoEl = $('tryPhoto'), resultEl = $('tryResult'), err = $('tryErr'), go = $('tryGo'), ok = $('tryOk');
  let job = null, person = null, personURL = null, personId = 0, stream = null, ctl = null, opener = null, tick = null, counting = null;
  const results = new Map();   // one call per photo + suit: looking again costs nothing
  const set = s => { root.dataset.state = s; go.disabled = !(person && ok.checked) || s === 'working' || s === 'camera'; };
  const say = msg => { err.textContent = msg || ''; };
  const stopCam = () => { clearInterval(counting); counting = null; $('tryCount').textContent = ''; if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } video.srcObject = null; };
  const view = v => { root.dataset.view = v; root.querySelectorAll('.try-tabs button').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); };

  function usePhoto(blob){
    person = blob; personId++; if (personURL) URL.revokeObjectURL(personURL); personURL = URL.createObjectURL(blob); photoEl.src = personURL; say(''); set('ready');
  }
  async function startCam(){
    say('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ say('This browser cannot open the camera here. Upload a photo instead.'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1706 } } });
      video.srcObject = stream; await video.play(); set('camera'); $('tryShutter').focus();
    } catch (e) { stopCam(); say('The camera is not available or was not allowed. Upload a photo instead.'); }
  }
  // three seconds to step back and stand straight
  function shutter(){
    if (counting || !stream) return; let n = 3; const c = $('tryCount'); c.textContent = n;
    counting = setInterval(async () => {
      n--; if (n > 0){ c.textContent = n; return; }
      clearInterval(counting); counting = null; c.textContent = '';
      const blob = await fitPhoto(video, video.videoWidth, video.videoHeight, { cover: true, mirror: true }); stopCam(); usePhoto(blob);
    }, 1000);
  }
  async function fromFile(file){
    if (!file) return; say('');
    try {
      let src, w, h;
      if (window.createImageBitmap){ try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); w = src.width; h = src.height; } catch (e) { src = null; } }
      if (!src){ const u = URL.createObjectURL(file); src = await loadImg(u); w = src.naturalWidth; h = src.naturalHeight; URL.revokeObjectURL(u); }
      stopCam(); usePhoto(await fitPhoto(src, w, h));
    } catch (e) { say('That file could not be opened as a photo. Try a JPG or PNG.'); }
  }

  // when today's free try-ons come back, in the customer's own clock
  function quotaText(ms){
    const base = 'Today’s free try-ons are used up.';
    if (!ms) return base + ' They come back within a day.';
    const at = new Date(Date.now() + ms), now = new Date(), t = at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (ms < 90 * 60 * 1000) return `${base} They come back in about ${Math.max(1, Math.round(ms / 60000))} minutes, at ${t}.`;
    return `${base} They come back ${at.toDateString() === now.toDateString() ? 'today' : 'tomorrow'} at ${t}.`;
  }
  const STATUS = { prep: 'Laying out the jacket', send: 'Sending your photo', queue: 'Waiting for a fitting room', work: 'Putting it on you' };
  async function run(){
    if (!person || !ok.checked || !job) return; say('');
    const key = `${personId}|${job.key}`;
    if (results.has(key)){ resultEl.src = results.get(key); $('trySave').href = results.get(key); view('after'); set('done'); return; }
    set('working'); ctl = new AbortController(); const t0 = performance.now(), st = $('tryStatus'), tm = $('tryTime');
    const state = (s, rank) => { st.textContent = STATUS[s] + (s === 'queue' && rank ? ` · ${rank} ahead of you` : ''); };
    state('prep'); tm.textContent = '0 s'; tick = setInterval(() => { tm.textContent = `${Math.round((performance.now() - t0) / 1000)} s`; }, 1000);
    try {
      const garment = await garmentBlob(job);
      const url = await tryOnRequest(person, garment, state, ctl.signal);
      let shown = url; try { shown = URL.createObjectURL(await (await fetch(url, { signal: ctl.signal })).blob()); } catch (e) { if (e.name === 'AbortError') throw e; }   // a local copy, so it can be saved
      await new Promise((res, rej) => { resultEl.onload = res; resultEl.onerror = () => rej(new TryError('busy')); resultEl.src = shown; });
      results.set(key, shown); $('trySave').href = shown; view('after'); set('done'); $('tryDoneNote').focus();
    } catch (e) {
      if (e.name === 'AbortError') return;
      set('ready');
      say(e.kind === 'quota' ? quotaText(e.retry) : 'The fitting room is busy right now. Wait a minute, then press “Try it on” again.');
    } finally { clearInterval(tick); ctl = null; }
  }

  function open(j, from){
    job = j; opener = from || null;
    $('tryGarment').src = j.picture; $('tryName').textContent = j.product.name; $('tryWhat').textContent = j.label; say('');
    const key = `${personId}|${j.key}`;
    if (person && results.has(key)){ resultEl.src = results.get(key); $('trySave').href = results.get(key); view('after'); set('done'); }
    else { view('before'); set(person ? 'ready' : 'start'); }
    root.classList.add('on'); root.setAttribute('aria-hidden', 'false'); $('tryX').focus();
  }
  function close(){
    if (!root.classList.contains('on')) return;
    if (ctl) ctl.abort(); clearInterval(tick); stopCam();
    if (root.dataset.state === 'working' || root.dataset.state === 'camera') set(person ? 'ready' : 'start');
    root.classList.remove('on'); root.setAttribute('aria-hidden', 'true'); if (opener) opener.focus();
  }

  $('tryCam').addEventListener('click', startCam);
  $('tryShutter').addEventListener('click', shutter);
  $('tryCamX').addEventListener('click', () => { stopCam(); set(person ? 'ready' : 'start'); });
  $('tryUp').addEventListener('click', () => $('tryFile').click());
  $('tryFile').addEventListener('change', e => { fromFile(e.target.files[0]); e.target.value = ''; });
  ok.addEventListener('change', () => set(root.dataset.state));
  go.addEventListener('click', run);
  $('tryAgain').addEventListener('click', () => { view('before'); set('ready'); });
  $('tryBack').addEventListener('click', close); $('tryX').addEventListener('click', close);
  root.addEventListener('click', e => { if (e.target === root) close(); });
  root.querySelectorAll('.try-tabs button').forEach(b => b.addEventListener('click', () => view(b.dataset.v)));
  // Escape closes this panel first, and only this panel
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('on')){ e.stopImmediatePropagation(); close(); } }, true);
  // keep Tab inside the panel while it is open
  root.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return; const f = [...root.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null && !el.disabled);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  return { open, close };
}
