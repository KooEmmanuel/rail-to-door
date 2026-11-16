// Atelier Example — orders and their journey stages.
//
// PROTOTYPE: orders live in this browser (localStorage), so tracking works on the device that placed
// the order and the admin page in the same browser can move it forward.
// GOING LIVE: keep this file's exports and replace the bodies of saveOrder / findOrder / listOrders /
// setStage / onOrdersChange with calls to your server (and a courier webhook for the later stages).
// Nothing else in the site needs to change.

// Every stage of an order, in order. `start` is where the stage begins in the film and `rest` is the frame
// the tracking film stops on while an order sits at that stage (both are film progress, 0 → 1).
export const STAGES = [
  { key: 'measured',  label: 'Measured',    mtm: true, start: 0,    rest: .049, text: 'Your measurements are with our cutter.' },
  { key: 'cut',       label: 'Cut',         mtm: true, start: .055, rest: .107, text: 'Your pattern has been chalked onto the cloth and cut by hand.' },
  { key: 'sewn',      label: 'Sewn',        mtm: true, start: .113, rest: .164, text: 'Your suit is being sewn, seam by seam.' },
  { key: 'fitted',    label: 'Fitted',      mtm: true, start: .17,  rest: .222, text: 'Fitted on the form and checked against your measurements.' },
  { key: 'pressed',   label: 'Pressed',     mtm: true, start: .228, rest: .262, text: 'Pressed and finished. Next, it goes into its garment bag.' },
  { key: 'packed',    label: 'Packed',      start: .28,  rest: .432, text: 'Pressed, zipped into its garment bag, boxed and labelled with your name.' },
  { key: 'dispatch',  label: 'Dispatch',    start: .442, rest: .505, text: 'Scanned out of the {origin} atelier.' },
  { key: 'road',      label: 'On the road', start: .543, rest: .64,  text: 'On the van to the airport.' },
  { key: 'airport',   label: 'Airport',     start: .683, rest: .73,  text: 'At the airport, riding up into the hold.' },
  { key: 'air',       label: 'In the air',  start: .849, rest: .9,   text: 'In the air to {city}.' },
  { key: 'delivered', label: 'Delivered',   start: .95,  rest: 1,    text: 'Delivered. Left at the door for {name}.' }
];
// made-to-measure orders begin at Measured; ready-to-wear orders begin at Packed
export const firstStage = o => (o && o.mtm ? 0 : STAGES.findIndex(s => !s.mtm));
export const stagesFor = o => STAGES.map((s, i) => ({ ...s, i })).filter(s => o.mtm || !s.mtm);
export const stageText = (o, i) => STAGES[i].text.replace('{city}', o.dest.city).replace('{name}', o.name.split(' ')[0]).replace('{origin}', o.origin.city);

const KEY = 'nm-orders';
const read = () => { let all; try { all = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { all = {}; }
  for (const o of Object.values(all)) if (o.mtm === undefined) o.mtm = !!o.measure;   // orders saved before ready-to-wear existed
  return all; };
const write = all => { try { localStorage.setItem(KEY, JSON.stringify(all)); return true; } catch (e) { return false; } };
export const normNo = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');

// keep only what tracking needs — no card data ever exists in this system
const slim = o => ({
  no: o.no, name: o.name, email: (o.email || '').trim().toLowerCase(), street: o.street, dest: o.dest, origin: o.origin,
  total: o.total, currency: o.currency, measure: o.measure || null, mtm: !!o.mtm,
  items: o.items.map(({ id, name, size, color, scale, front, fab, fabric, colour, measure }) => ({ id, name, size, color, scale, front, fab: fab || null, fabric: fabric || null, colour: colour || null, measure: measure || null })),
  createdAt: o.createdAt || Date.now()
});

export function saveOrder(order){
  const all = read(), now = Date.now();
  const s0 = firstStage(order); all[order.no] = { ...slim({ ...order, createdAt: now }), stage: s0, history: [{ stage: s0, at: now }] };
  write(all); return all[order.no];
}
// returns the order, null when there is none, or 'mismatch' when the email does not match
export function findOrder(no, email){
  const o = read()[normNo(no)]; if (!o) return null;
  if (email != null && o.email && String(email).trim().toLowerCase() !== o.email) return 'mismatch';
  return o;
}
export const listOrders = () => Object.values(read()).sort((a, b) => b.createdAt - a.createdAt);
export function setStage(no, stage){
  const all = read(), o = all[normNo(no)]; if (!o) return null;
  stage = Math.max(firstStage(o), Math.min(STAGES.length - 1, stage)); if (stage === o.stage) return o;
  o.stage = stage; o.history = (o.history || []).filter(h => h.stage < stage).concat({ stage, at: Date.now() });
  write(all); return o;
}
export function removeOrder(no){ const all = read(); delete all[normNo(no)]; write(all); }
// fires when another tab (the admin page) changes an order
export function onOrdersChange(cb){ addEventListener('storage', e => { if (e.key === KEY) cb(); }); }
// the day a stage was reached, for the status card
export const stageTime = (o, i) => { const h = (o.history || []).find(x => x.stage === i); return h ? h.at : null; };
