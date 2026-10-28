# Yana

Yana is a web-only parking-first trip planner for Indian metros (Bangalore first). You search a destination, pick a car park, then compare a few real drive options before you leave.

It is a mobile PWA. No accounts. No in-app turn-by-turn. Navigation opens in Google Maps or Apple Maps as origin → parking → destination.

Route cards are tagged **Fastest**, **Broader roads**, **Family comfort**, and **Safer indicators**. Each option has a Yana score (0–100) from road mix, lighting, surface, turns, weather, and nearby hospital / police / petrol. That score is a comfort composite, not a claim the road is safe. Parking never fakes live availability.

This repo contains **no live secrets**. Copy [`.env.example`](.env.example) to a local `.env` (gitignored). Never commit `.env` or paste real keys into issues.

## Google Cloud setup

Billing must be on. Enable only these APIs:

1. **Places API (New)**
2. **Routes API**
3. **Maps JavaScript API**

Create **two keys** in the same Google Cloud project. Do not use one key for both.

| Env var | Name it in Console | Used for | API restrictions | Application restriction |
|---|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Yana server | Autocomplete, place details, nearby parking, routes | Places API (New), Routes API | IP if you have one; otherwise none while prototyping |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yana maps | In-app map only | Maps JavaScript API only | HTTP referrers: `http://localhost:3000/*` and your public host (`https://<your-app>.up.railway.app/*`) |

The maps key is a **browser** key. It will appear in client JS. Restrict it by referrer or anyone can bill your Google project.

Copy `.env.example` to `.env`, paste both keys, restart `npm run dev`.

Without keys, search falls back to Nominatim (weak for Indian place names) and the seeded Bangalore catalog.

## Local run

Needs Node 20+ and PostgreSQL.

```bash
cp .env.example .env
# paste keys and DATABASE_URL into .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000.

Operator tools (catalog, suggestions, reviews) are at http://localhost:3000/agent. Local default password is `yana-admin` via `ADMIN_PASSWORD`. Change it if you expose that machine. Production **must not** use this default.

## Deploy on Railway

1. New project → Deploy from this GitHub repo.
2. Add a **PostgreSQL** plugin so `DATABASE_URL` is injected.
3. Set these variables on the **web service** (available at **build and runtime**):

| Variable | Notes |
|---|---|
| `DATABASE_URL` | From the Postgres plugin |
| `GOOGLE_MAPS_API_KEY` | Server key (Places New + Routes) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript key. Required at **build** time — redeploy after changing it |
| `ADMIN_PASSWORD` | Strong password. **Not** `yana-admin` |
| `ADMIN_SESSION_SECRET` | Long random string. **Not** `change-me-in-production` |

4. Restrict the maps key HTTP referrer to your Railway URL and any custom domain.
5. First deploy runs `prisma migrate deploy` then `next start`. Health check: `/api/health`.
6. Optional catalog seed: `railway run npx tsx prisma/seed.ts`

If login at `/agent/login` fails in production, the page shows the server error. Usually `ADMIN_PASSWORD` or `ADMIN_SESSION_SECRET` is still a local default.

## Secrets

| Keep private | Why |
|---|---|
| `.env` | Local keys and database URL |
| `GOOGLE_MAPS_API_KEY` | Server key; restrict APIs |
| `DATABASE_URL` | Postgres |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | Operator login |

Rotate Google keys in Cloud Console, then update Railway and local `.env`. Delete the old keys in Console.

## PWA

Add to Home Screen from the mobile browser. The app uses a standalone manifest and a light app-shell service worker.
