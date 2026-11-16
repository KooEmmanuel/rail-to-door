// The rail: suit cut-outs (side / front / back) from custom-suit-studio. Order here is the order on the rail (light and dark alternate).
// price: in CURRENCY.base (placeholder prices until the real price sheet arrives)
// cats:  which collections a piece appears in (keys from CATEGORIES)
// scale: drawn smaller than a full suit on the rail (waistcoats hang shorter)
export const PRODUCTS = [
  {
    "id": "the-navy-two-button",
    "name": "The Navy Two-Button",
    "price": 480,
    "cat": "Two-piece · Single-breasted · Notch lapel",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-navy-two-button-front.webp",
    "back": "assets/rail/the-navy-two-button-back.webp",
    "side": "assets/rail/the-navy-two-button-side.webp",
    "color": "#1f222f",
    "w": 583,
    "h": 1000,
    "cats": [
      "two-piece"
    ]
  },
  {
    "id": "the-cream-linen",
    "name": "The Cream Linen",
    "price": 420,
    "cat": "Wedding · Cream linen · Patch pockets",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-cream-linen-front.webp",
    "back": "assets/rail/the-cream-linen-back.webp",
    "side": "assets/rail/the-cream-linen-side.webp",
    "color": "#dbd1c1",
    "w": 595,
    "h": 1000,
    "cats": [
      "wedding",
      "two-piece"
    ]
  },
  {
    "id": "the-black-peak-lapel",
    "name": "The Black Peak Lapel",
    "price": 520,
    "cat": "Dinner suit · Peak lapel · One button",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-black-peak-lapel-front.webp",
    "back": "assets/rail/the-black-peak-lapel-back.webp",
    "side": "assets/rail/the-black-peak-lapel-side.webp",
    "color": "#1e1e1e",
    "w": 587,
    "h": 1000,
    "cats": [
      "dinner",
      "wedding"
    ]
  },
  {
    "id": "the-charcoal-pinstripe",
    "name": "The Charcoal Pinstripe",
    "price": 540,
    "cat": "Two-piece · Chalk pinstripe · Peak lapel",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-charcoal-pinstripe-front.webp",
    "back": "assets/rail/the-charcoal-pinstripe-back.webp",
    "side": "assets/rail/the-charcoal-pinstripe-side.webp",
    "color": "#39393a",
    "w": 540,
    "h": 1000,
    "cats": [
      "two-piece"
    ]
  },
  {
    "id": "the-camel-double-breasted",
    "name": "The Camel Double-Breasted",
    "price": 640,
    "cat": "Double-breasted · Peak lapel",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-camel-double-breasted-front.webp",
    "back": "assets/rail/the-camel-double-breasted-back.webp",
    "side": "assets/rail/the-camel-double-breasted-side.webp",
    "color": "#9c6f49",
    "w": 511,
    "h": 1000,
    "cats": [
      "double-breasted"
    ]
  },
  {
    "id": "the-grey-check",
    "name": "The Grey Check",
    "price": 460,
    "cat": "Two-piece · Subtle check · Notch lapel",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-grey-check-front.webp",
    "back": "assets/rail/the-grey-check-back.webp",
    "side": "assets/rail/the-grey-check-side.webp",
    "color": "#5e5e60",
    "w": 567,
    "h": 1000,
    "cats": [
      "two-piece"
    ]
  },
  {
    "id": "the-forest-double-breasted",
    "name": "The Forest Double-Breasted",
    "price": 690,
    "cat": "Double-breasted · Forest wool",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-forest-double-breasted-front.webp",
    "back": "assets/rail/the-forest-double-breasted-back.webp",
    "side": "assets/rail/the-forest-double-breasted-side.webp",
    "color": "#1a2b1e",
    "w": 516,
    "h": 1000,
    "cats": [
      "double-breasted",
      "wedding"
    ]
  },
  {
    "id": "the-burgundy-two-button",
    "name": "The Burgundy Two-Button",
    "price": 560,
    "cat": "Dinner suit · Burgundy · Notch lapel",
    "sizes": [
      "36R",
      "38R",
      "40R",
      "42R",
      "44R",
      "46R"
    ],
    "front": "assets/rail/the-burgundy-two-button-front.webp",
    "back": "assets/rail/the-burgundy-two-button-back.webp",
    "side": "assets/rail/the-burgundy-two-button-side.webp",
    "color": "#43161f",
    "w": 552,
    "h": 1000,
    "cats": [
      "dinner",
      "two-piece"
    ]
  }
];

// The collections, in the order of the filter.
export const CATEGORIES = [
  { key: 'two-piece', label: 'Two-piece', long: 'Two-piece suits', blurb: 'Jacket and trousers. Monday to Sunday.' },
  { key: 'double-breasted', label: 'Double-breasted', long: 'Double-breasted suits', blurb: 'Two rows of buttons, a little ceremony.' },
  { key: 'dinner', label: 'Dinner', long: 'Dinner suits', blurb: 'For the evening the room turns to look.' },
  { key: 'wedding', label: 'Wedding', long: 'Wedding suits', blurb: 'For the day you make a promise.' }
];

// Prices are stored in CURRENCY.base and converted for display. Change "default" to switch
// the store's opening currency; edit the rates as they move (these are placeholders).
export const CURRENCY = {
  base: 'USD', default: 'EUR',
  freeShippingOver: 500, shipping: 35,          // in the base currency
  list: {
    RUB: { rate: 80,   step: 100, locale: 'ru-RU', label: '₽ RUB' },
    USD: { rate: 1,    step: 1,   locale: 'en-US', label: '$ USD' },
    EUR: { rate: 0.92, step: 1,   locale: 'de-DE', label: '€ EUR' },
    GBP: { rate: 0.78, step: 1,   locale: 'en-GB', label: '£ GBP' },
    GHS: { rate: 12,   step: 10,  locale: 'en-GH', label: '₵ GHS' }
  }
};

// Made to measure: any piece on the rail can instead be cut to the customer's measurements in one of these cloths.
// fee and add are in CURRENCY.base, on top of the ready-to-wear price (placeholders until the real price sheet).
export const MTM = { fee: 150, weeks: '3–4', rtwDays: '2–3' };
export const FABRICS = [
  { key: 'midnight-worsted', name: 'Midnight Worsted', comp: '100% wool · Super 110s', weight: '260 g', season: 'All year', color: '#1B2336', weave: 'twill', add: 0 },
  { key: 'charcoal-flannel', name: 'Charcoal Flannel', comp: '100% wool flannel', weight: '320 g', season: 'Autumn · Winter', color: '#3B3D42', weave: 'flannel', add: 60 },
  { key: 'navy-chalk-stripe', name: 'Navy Chalk Stripe', comp: '100% wool · Super 130s', weight: '280 g', season: 'All year', color: '#1E2942', weave: 'stripe', add: 120 },
  { key: 'slate-sharkskin', name: 'Slate Sharkskin', comp: 'Wool · Super 120s', weight: '270 g', season: 'All year', color: '#59647A', weave: 'sharkskin', add: 80 },
  { key: 'grey-glen-check', name: 'Grey Glen Check', comp: '100% wool', weight: '290 g', season: 'Autumn · Winter', color: '#7B7E84', weave: 'check', add: 90 },
  { key: 'ivory-linen', name: 'Ivory Linen', comp: '100% linen', weight: '240 g', season: 'Summer · Weddings', color: '#E2DACB', weave: 'linen', add: 40 },
  { key: 'sand-drill', name: 'Sand Cotton Drill', comp: '100% cotton', weight: '300 g', season: 'Heat · Safari', color: '#B7A07C', weave: 'drill', add: 20 },
  { key: 'forest-mohair', name: 'Forest Mohair', comp: 'Wool · mohair blend', weight: '250 g', season: 'Evening', color: '#22372B', weave: 'mohair', add: 140 },
  { key: 'black-barathea', name: 'Black Barathea', comp: '100% wool barathea', weight: '300 g', season: 'Dinner · Black tie', color: '#141416', weave: 'barathea', add: 100 },
  { key: 'oxblood-velvet', name: 'Oxblood Velvet', comp: 'Cotton velvet', weight: '420 g', season: 'Dinner · Winter', color: '#4A1A22', weave: 'velvet', add: 160 }
];

// Ready to wear: the colours each piece hangs in, ready to ship. The first colour of each list is the one
// in the photo; the others are shown by recolouring the photo (js/recolour.js).
// PLACEHOLDER stock until the real sheet arrives: change a list to match what is actually on the rail.
export const COLOURS = {
  navy: { name: 'Navy', hex: '#1F2638' }, charcoal: { name: 'Charcoal', hex: '#393A3E' }, black: { name: 'Black', hex: '#151517' },
  grey: { name: 'Mid grey', hex: '#6B6E73' }, slate: { name: 'Slate', hex: '#4A5060' }, chocolate: { name: 'Chocolate', hex: '#4A3426' },
  stone: { name: 'Stone', hex: '#A3937D' }, sand: { name: 'Sand', hex: '#B9A27E' }, cream: { name: 'Cream', hex: '#DDD3C2' },
  camel: { name: 'Camel', hex: '#9C6F49' }, cinnamon: { name: 'Cinnamon', hex: '#6B3219' }, burgundy: { name: 'Burgundy', hex: '#4A1A24' },
  forest: { name: 'Forest', hex: '#1E3024' }, olive: { name: 'Olive', hex: '#5A5A3A' }
};
const STOCK = {
  'the-navy-two-button': ['navy', 'charcoal', 'black', 'grey'],
  'the-cream-linen': ['cream', 'sand', 'stone', 'grey'],
  'the-black-peak-lapel': ['black', 'navy', 'burgundy'],
  'the-charcoal-pinstripe': ['charcoal', 'navy', 'black'],
  'the-camel-double-breasted': ['camel', 'navy', 'chocolate', 'grey'],
  'the-grey-check': ['grey', 'navy', 'chocolate'],
  'the-forest-double-breasted': ['forest', 'navy', 'burgundy', 'black'],
  'the-burgundy-two-button': ['burgundy', 'navy', 'forest', 'black']
};
PRODUCTS.forEach(p => { p.colours = STOCK[p.id] || []; });

// Made to measure: the body measurements the customer gives (cm). chest / waist / sleeve also appear in the film.
export const MEASURES = [
  { key: 'height', label: 'Height', min: 140, max: 215, def: 180 },
  { key: 'chest', label: 'Chest', min: 70, max: 160, def: 102 },
  { key: 'waist', label: 'Waist', min: 55, max: 150, def: 88 },
  { key: 'hips', label: 'Hips', min: 70, max: 160, def: 100 },
  { key: 'shoulder', label: 'Shoulder', min: 35, max: 60, def: 46 },
  { key: 'sleeve', label: 'Sleeve', min: 45, max: 80, def: 64 },
  { key: 'inseam', label: 'Inside leg', min: 60, max: 100, def: 81 }
];

// Try it on: the customer's photo and the chosen suit go to an AI try-on model, which returns a picture of them wearing it.
// PROTOTYPE: a free public demo of the Leffa model on Hugging Face. It allows about two try-ons per person per day
// and can be slow or busy, so it is for showing the idea, not for a live store.
// GOING LIVE: set `endpoint` to a route on your own server (POST person + garment images, returns { url }). The server
// calls a paid try-on service with its secret key. Never put a key in this file: everything here is public.
export const TRYON = { space: 'https://franciszzj-leffa.hf.space', endpoint: '', steps: 30 };

// What the shopper fills, and what one product is called in the page copy.
// container.kind: 'tote' | 'basket' | 'cart' | 'box'   (drawn in css/style.css)
export const CONFIG = { container: { kind: "tote", word: "bag" }, itemWord: "suit" };

// Where orders ship from, and where the demo can deliver to.
export const ORIGIN = { city: 'Lisbon', country: 'Portugal', code: 'LIS', lon: -9.14, lat: 38.72 };
export const CITIES = [
  { city: 'Accra', country: 'Ghana', code: 'ACC', lon: -0.17, lat: 5.6 },
  { city: 'Saint Petersburg', country: 'Portugal', code: 'LED', lon: 30.26, lat: 59.8 },
  { city: 'Kazan', country: 'Portugal', code: 'KZN', lon: 49.28, lat: 55.61 },
  { city: 'Istanbul', country: 'Türkiye', code: 'IST', lon: 28.75, lat: 41.26 },
  { city: 'London', country: 'United Kingdom', code: 'LHR', lon: -0.45, lat: 51.47 },
  { city: 'New York', country: 'United States', code: 'JFK', lon: -73.78, lat: 40.64 },
  { city: 'Toronto', country: 'Canada', code: 'YYZ', lon: -79.6, lat: 43.68 },
  { city: 'Houston', country: 'United States', code: 'IAH', lon: -95.34, lat: 29.98 },
  { city: 'Los Angeles', country: 'United States', code: 'LAX', lon: -118.4, lat: 33.94 },
  { city: 'Paris', country: 'France', code: 'CDG', lon: 2.55, lat: 49.0 },
  { city: 'Amsterdam', country: 'Netherlands', code: 'AMS', lon: 4.76, lat: 52.31 },
  { city: 'Berlin', country: 'Germany', code: 'BER', lon: 13.5, lat: 52.36 },
  { city: 'Lagos', country: 'Nigeria', code: 'LOS', lon: 3.32, lat: 6.58 },
  { city: 'Nairobi', country: 'Kenya', code: 'NBO', lon: 36.93, lat: -1.32 },
  { city: 'Johannesburg', country: 'South Africa', code: 'JNB', lon: 28.24, lat: -26.13 },
  { city: 'Dubai', country: 'UAE', code: 'DXB', lon: 55.36, lat: 25.25 },
  { city: 'Tokyo', country: 'Japan', code: 'HND', lon: 139.78, lat: 35.55 },
  { city: 'Sydney', country: 'Australia', code: 'SYD', lon: 151.18, lat: -33.94 }
];
export const km = (a, b) => { const R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r, h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
