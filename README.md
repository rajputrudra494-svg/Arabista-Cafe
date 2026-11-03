# Arabista Café — website

Single-page site for **Arabista** (Pal Gam, Surat), built from the café's Instagram (@arabista_in) and public Zomato menu.

## Run locally
```bash
python -m http.server 5173
```
Then open http://localhost:5173 (a server is needed because the 3D scene uses ES modules).

## What's inside
| File | Purpose |
| --- | --- |
| `index.html` | All sections: hero, story, A·R·A·B·I·S·T·A letters, 3D signature bar, menu, ambience, craft, events, reviews, Instagram feed, visit/reserve, footer |
| `css/style.css` | Brand tokens (teal `#184848`, cream `#efe3c9`, gold `#d6b274`), layout, responsive rules |
| `js/main.js` | Loader, smooth scroll, GSAP animations, menu search/filter, WhatsApp tray + booking, open/closed status (IST) |
| `js/drink3d.js` | Real-time Three.js layered drink (glass, liquid shader, ice, garnish, beans, string-light bokeh) |
| `js/menu-data.js` | **Edit prices / items / signature drinks here** |
| `assets/ig/` | Photos from the café's Instagram — swap in high-res originals with the same filenames |

## Things to confirm with the café before launch
- Prices are from Zomato (Nov 2026) and may differ in-café.
- Hours: Instagram says 9 AM – 11:30 PM (Zomato lists 9:30 AM – 12:30 AM).
- WhatsApp orders/bookings go to +91 76005 77745 (the Zomato-listed number).
- Review quotes come from public Instagram posts — get the creators' OK.
- Instagram images are 640px; ask the café for originals for sharper photos.
