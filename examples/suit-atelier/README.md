# Example: a suit atelier

A complete rail-to-door store using every extension in `skills/rail-to-door/references/extensions.md`:

- **Ready to wear:** type → colour → size. Packed and shipped in days.
- **Made to measure:** type → cloth → body measurements. Cut and sewn in weeks.
- **The picture repaints** in the chosen colour or cloth (`js/recolour.js`, with masks in `assets/rail/mask/`).
- **Order tracking** at `?track=<order number>`, with a staff page at `admin.html`. Move an order there and the tracking film carries on in the other tab.
- **The workshop film** for made-to-measure orders, collections, and prices in several currencies.

```bash
python3 serve.py 8793      # then open http://localhost:8793
```

"Atelier Example" is a placeholder brand. Prices, stock colours, cloths, the making fee, lead times and exchange rates are all placeholders. Orders are saved in the browser; see `js/orders.js` for the one place to connect a server. The suit photos come from [custom-suit-studio](https://github.com/KooEmmanuel/custom-suit-studio). The payment screen is a demo: no card details are collected and nothing is charged.
