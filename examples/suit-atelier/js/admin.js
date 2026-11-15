import { STAGES, stagesFor, stageText, stageTime, listOrders, setStage, saveOrder, removeOrder, onOrdersChange } from './orders.js';
import { PRODUCTS, CITIES, ORIGIN, FABRICS, COLOURS, MEASURES } from './data.js';
import { swatchURL, fabricOf } from './fabrics.js';

const $ = id => document.getElementById(id), list = $('list');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const when = t => t ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
let toastT; const toast = msg => { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); };

function render(){
  const orders = listOrders();
  if (!orders.length){ list.innerHTML = `<div class="empty">No orders on this device yet. Place one in the store, or create a demo order.</div>`; return; }
  list.innerHTML = orders.map(o => {
    const i = o.stage, link = `./?track=${encodeURIComponent(o.no)}`;
    return `<article class="order" data-no="${esc(o.no)}">
      <div class="order-head"><div><b>${esc(o.no)}</b> <span class="kind ${o.mtm ? 'mtm' : ''}">${o.mtm ? 'Made to measure' : 'Ready to wear'}</span><h2>${esc(o.name)}</h2>
          ${o.mtm && o.measure ? `<p class="meas">${MEASURES.filter(m => o.measure[m.key]).map(m => `${m.label} ${o.measure[m.key]}`).join(' · ')} cm</p>` : ''}</div>
        <p class="meta">${o.items.map(it => it.fabric ? `<i class="sw" style="background-image:url(${swatchURL(fabricOf(it.fabric.key) || it.fabric, 48)})"></i>${esc(`${it.name} · ${it.fabric.name}`)}` : `${it.colour ? `<i class="sw" style="background:${esc(it.colour.hex)}"></i>` : ''}${esc(`${it.name} · ${it.colour ? it.colour.name + ' · ' : ''}${it.size}`)}`).join('<br>')}<br>${esc(o.dest.city)}, ${esc(o.dest.country)} · placed ${when(o.createdAt)}</p></div>
      <div class="track" role="group" aria-label="Stage">${stagesFor(o).map(({ i: k, ...s }) => `<button type="button" data-st="${k}" class="${k < i ? 'done' : k === i ? 'now' : ''}" aria-pressed="${k === i}" title="Set to ${s.label}"><i></i><span>${s.label}</span></button>`).join('')}</div>
      <div class="row"><p class="now-text"><b>${STAGES[i].label}</b>${esc(stageText(o, i))} <span style="color:var(--muted)">· ${when(stageTime(o, i))}</span></p>
        <div class="acts">${i < STAGES.length - 1 ? `<button class="btn sm solid" data-act="next" type="button">Move to ${STAGES[i + 1].label} →</button>` : ''}
          <a class="btn sm" href="${link}" target="_blank" rel="noopener">Open tracking</a><button class="btn sm" data-act="copy" data-link="${link}" type="button">Copy link</button><button class="btn sm" data-act="del" type="button">Remove</button></div></div>
    </article>`; }).join('');
}
list.addEventListener('click', async e => {
  const card = e.target.closest('.order'); if (!card) return; const no = card.dataset.no;
  const st = e.target.closest('button[data-st]'); if (st){ const o = setStage(no, +st.dataset.st); render(); toast(`${no} → ${STAGES[o.stage].label}`); return; }
  const b = e.target.closest('button[data-act]'); if (!b) return;
  if (b.dataset.act === 'next'){ const cur = listOrders().find(o => o.no === no); const o = setStage(no, cur.stage + 1); render(); toast(`${no} → ${STAGES[o.stage].label}`); }
  if (b.dataset.act === 'copy'){ const url = new URL(b.dataset.link, location.href).href; try { await navigator.clipboard.writeText(url); toast('Tracking link copied'); } catch (err) { toast(url); } }
  if (b.dataset.act === 'del' && confirm(`Remove ${no} from this device?`)){ removeOrder(no); render(); }
});
$('demo').addEventListener('click', () => {
  const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)], dest = CITIES[Math.floor(Math.random() * 6)];
  const mtm = Math.random() < .5, f = FABRICS[Math.floor(Math.random() * FABRICS.length)];
  const o = saveOrder({ mtm, no: 'ATX-' + String(Math.floor(10000 + Math.random() * 89999)), name: 'Kwame Boateng', email: 'kwame@example.com', street: '14 Kingsland Road, Flat 3',
    dest, origin: ORIGIN, total: 0, currency: 'RUB', measure: mtm ? Object.fromEntries(MEASURES.map(m => [m.key, m.def])) : null,
    items: [mtm ? { ...p, size: 'Made to measure', fab: f.key, fabric: { key: f.key, name: f.name, color: f.color, weave: f.weave }, color: f.color } : { ...p, size: '40R', colour: { key: p.colours[0], ...COLOURS[p.colours[0]] } }] });
  render(); toast(`Created ${o.no}`);
});
onOrdersChange(render);
render();
