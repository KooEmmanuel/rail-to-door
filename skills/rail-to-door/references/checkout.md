# Stage: bag and checkout

Goal: from a full tote to "Paid ✓" and the hand-off into the order journey. Files: `index.html` (`.drawer`, `.pay`, `.curtain`), `css/style.css` (sections "drawer" and "payment"), `js/shop.js` (cart state, drawer, payment), `js/main.js` (the hand-off).

## Flow

1. **Bag drawer** (`#drawer`) — opens from the header Bag button, the tote, or "Continue to bag". One line per piece+size: thumbnail, name, size select, − / + quantity, line price, Remove. Footer: subtotal, shipping, "Continue to payment".
2. **Payment** (`#pay`) — left: order summary and totals. Right: name, street, destination city (from `CITIES` in `js/data.js`), the demo-card notice, "Pay $…".
3. **Pay** — the button shows a spinner (1.3 s), then "Paid ✓", then calls `onPaid(order, done)`.
4. **Hand-off** (`startJourney` in `js/main.js`) — a dark curtain wipes up, the page switches to `mode-journey`, order details are written into the captions, the 3D journey is built for *this* order, the curtain lifts and the journey starts playing by itself.

The `order` object the journey receives:

```js
{ no: 'NVA-48213', name, street, dest: {city, country, code, lon, lat}, origin: ORIGIN, total,
  items: [ {…product, size}, … ]   // one entry per unit, used for the folded garments in the box
}
```

## Money rules in the template

- Shipping is free at a subtotal of $150 or more, otherwise $18 — `shipping()` in `js/shop.js`.
- Currency is USD, formatted by `money()`.
- Change these two functions for another policy or currency; update the header/copy that mentions them.

## The payment is a demo — keep it honest

- The form is prefilled with sample details and the "card" is a notice that says nothing is charged. It collects **no card fields**. Do not add card-number, expiry or CVC inputs, and never ask the user for real card details.
- If the user asks for real payments, that is a separate, explicit piece of work: use the provider's hosted checkout or embedded fields (Stripe Checkout / Payment Element, Paystack inline, etc.) so card data never touches this page, run it in the provider's test mode first, and call `onPaid(order, done)` only after the provider confirms the payment server-side. Say clearly that the static template has no server and one is required.
- Keep the wording "Demo" visible wherever a payment is simulated.

## Things to adjust on request

| Request | Where |
|---|---|
| Add/remove destination cities | `CITIES` in `js/data.js` (needs `code`, `lon`, `lat` — the map uses them) |
| Default customer details | the `value="…"` attributes in `#payForm` |
| Extra field (email, phone) | add the `<label>` in `#payForm`; read it in the submit handler; add it to `order` |
| Processing time | the two `setTimeout`s in the submit handler (1300 ms spinner, 2000 ms hand-off) |
| Curtain message | `.curtain p` in `index.html` |

## Check

Add two pieces, open the drawer: quantities and sizes change, totals follow, Remove works, an empty bag disables "Continue to payment". On the payment screen the summary matches the bag. Pay → spinner → "Paid ✓" → curtain → the journey starts, and "Shop again" at the end returns to an empty bag.
