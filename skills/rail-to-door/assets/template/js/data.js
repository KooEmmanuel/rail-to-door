// Real Maison pieces (side / front / back cut-outs) from the clothing-rail prototype.
export const PRODUCTS = [
  {
    "id": "linen-camp-shirt-navy",
    "name": "Linen Camp Shirt · Navy",
    "price": 64,
    "cat": "Shirts",
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "front": "assets/rail/linen-camp-shirt-navy-front.webp",
    "back": "assets/rail/linen-camp-shirt-navy-back.webp",
    "side": "assets/rail/linen-camp-shirt-navy-side.webp",
    "color": "#292d3e",
    "w": 765,
    "h": 1000
  },
  {
    "id": "linen-camp-shirt-bone",
    "name": "Linen Camp Shirt · Bone",
    "price": 64,
    "cat": "Shirts",
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "front": "assets/rail/linen-camp-shirt-bone-front.webp",
    "back": "assets/rail/linen-camp-shirt-bone-back.webp",
    "side": "assets/rail/linen-camp-shirt-bone-side.webp",
    "color": "#bbbeb8",
    "w": 765,
    "h": 1000
  },
  {
    "id": "linen-camp-shirt-sage",
    "name": "Linen Camp Shirt · Sage",
    "price": 64,
    "cat": "Shirts",
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "front": "assets/rail/linen-camp-shirt-sage-front.webp",
    "back": "assets/rail/linen-camp-shirt-sage-back.webp",
    "side": "assets/rail/linen-camp-shirt-sage-side.webp",
    "color": "#899576",
    "w": 765,
    "h": 1000
  },
  {
    "id": "linen-camp-shirt-charcoal",
    "name": "Linen Camp Shirt · Charcoal",
    "price": 64,
    "cat": "Shirts",
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "front": "assets/rail/linen-camp-shirt-charcoal-front.webp",
    "back": "assets/rail/linen-camp-shirt-charcoal-back.webp",
    "side": "assets/rail/linen-camp-shirt-charcoal-side.webp",
    "color": "#343533",
    "w": 765,
    "h": 1000
  },
  {
    "id": "linen-camp-shirt-clay",
    "name": "Linen Camp Shirt · Clay",
    "price": 64,
    "cat": "Shirts",
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "front": "assets/rail/linen-camp-shirt-clay-front.webp",
    "back": "assets/rail/linen-camp-shirt-clay-back.webp",
    "side": "assets/rail/linen-camp-shirt-clay-side.webp",
    "color": "#896b5e",
    "w": 765,
    "h": 1000
  },
  {
    "id": "linen-camp-shirt-sky",
    "name": "Linen Camp Shirt · Sky",
    "price": 64,
    "cat": "Shirts",
    "sizes": [
      "S",
      "M",
      "L",
      "XL"
    ],
    "front": "assets/rail/linen-camp-shirt-sky-front.webp",
    "back": "assets/rail/linen-camp-shirt-sky-back.webp",
    "side": "assets/rail/linen-camp-shirt-sky-side.webp",
    "color": "#8797a6",
    "w": 765,
    "h": 1000
  }
];

// What the shopper fills, and what one product is called in the page copy.
// container.kind: 'tote' | 'basket' | 'cart' | 'box'   (drawn in css/style.css)
export const CONFIG = { container: { kind: 'tote', word: 'bag' }, itemWord: 'piece' };

// Where orders ship from, and where the demo can deliver to.
export const ORIGIN = { city: 'Lisbon', country: 'Portugal', code: 'LIS', lon: -9.14, lat: 38.72 };
export const CITIES = [
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
