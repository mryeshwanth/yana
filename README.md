# Yana

Mobile PWA for parking-first trip planning in Indian metros. Drivers pick a lot, then compare Fastest / Broader Roads / Family Comfort. Turn-by-turn stays in Google or Apple Maps.

## Google Cloud setup (required to share with others)

Billing must be on. Enable only these APIs:

1. **Places API (New)**
2. **Routes API**
3. **Maps JavaScript API**

Create two keys in the same project:

| Env var | Used for | API restrictions | Application restriction |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Autocomplete, place details, nearby parking, routes | Places API (New), Routes API | IP (or none while prototyping) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | In-app map | Maps JavaScript API only | HTTP referrers: `http://localhost:3000/*` plus your public host |

Copy [`.env.example`](.env.example) to `.env` and paste both keys. Restart `npm run dev`.

Without keys, search falls back to Nominatim (weak for Indian place names) and the seeded Bangalore catalog.

Do not enable Geocoding API, legacy Directions, Parkopedia, or INRIX for this prototype.

## Local run

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000. Agent catalog (hidden from users): http://localhost:3000/agent — password `yana-admin` unless you change `ADMIN_PASSWORD`.

## PWA

Add to Home Screen from the mobile browser. The app uses a standalone manifest and a light app-shell service worker.
