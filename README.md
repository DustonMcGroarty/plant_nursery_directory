# Root & Bloom — US Plant Nursery Directory

A searchable directory of plant nurseries and garden centers across the
United States, built with Next.js (App Router) and PostgreSQL/Prisma.

## Features

- **Search & filter** by keyword, state, specialty, and "near me" radius
  (browser geolocation + haversine distance, no geocoding API required).
- **Nursery profile pages** with address, phone, website, specialties, and
  `GardenStore` JSON-LD structured data for SEO.
- **Add / claim a listing** — a public form creates a moderation request;
  nothing goes live until approved.
- **Admin moderation queue** (`/admin`, secret-protected) to approve or
  reject submissions.
- **Monetization-ready data model** — every nursery has a `planTier`
  (`FREE` / `FEATURED` / `PREMIUM`) and `sponsoredUntil` date. Featured and
  premium listings are pinned above free ones in search results and get a
  badge; no payment processing is wired up yet, just the schema/UI hooks.

## Tech stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- PostgreSQL + Prisma ORM
- Tailwind CSS v4
- Zod for form validation

## Local setup

1. **Database.** Point `DATABASE_URL` (see `.env.example`) at a Postgres
   instance. Locally:
   ```bash
   createdb plant_nursery_directory
   ```
2. **Env vars.** Copy `.env.example` to `.env` and fill in `DATABASE_URL`
   and a random `ADMIN_SECRET`.
3. **Install, migrate, seed:**
   ```bash
   npm install
   npx prisma migrate dev
   npm run db:seed
   ```
   The seed script creates ~60 **synthetic** sample nurseries across ~30
   cities so the app is browsable before real data is imported — see
   below.
4. **Run it:**
   ```bash
   npm run dev
   ```

## Getting real, nationwide nursery data

The seed data is placeholder only. To populate the directory with real
nurseries, run the Google Places import pipeline:

```bash
GOOGLE_PLACES_API_KEY=your-key npm run db:import-places
```

`scripts/import-places.ts` tiles the entire US into overlapping search
circles and runs a Places "Text Search" (`plant nursery`) against each,
de-duplicating by Google's place ID and importing results as `PENDING`
(reviewed via `/admin` before publishing — Places results sometimes
include mis-tagged businesses). This requires a billed Google Cloud
project with the Places API (New) enabled.

**Before running it at scale, read the comment at the top of the
script** — Google's Places API Terms of Service place restrictions on
caching and on using Places data to build a directory that competes with
Google Maps. An alternative worth considering is importing from
[OpenStreetMap](https://www.openstreetmap.org) (`shop=garden_centre`) via
the Overpass API instead: it's free, requires no API key, and its ODbL
license explicitly permits this kind of directory (with attribution).

## Project structure

```
prisma/schema.prisma       Data model (Nursery, Specialty, ClaimRequest, User, Review, ...)
prisma/seed.ts             Synthetic sample data for local dev
scripts/import-places.ts   Google Places import pipeline (see above)
src/app/                   Routes: /, /search, /nursery/[slug], /submit, /admin
src/lib/nursery-queries.ts Search/filter/geo query logic
src/lib/geo.ts             Haversine distance helper
```

## Roadmap ideas

- Photos (schema already supports `NurseryPhoto`; needs an upload flow).
- Reviews (schema already supports `Review`; needs UI).
- Map view of search results.
- Payment integration for `FEATURED`/`PREMIUM` plan upgrades.
- Owner accounts / auth (schema has `User.role: OWNER`, not yet wired to
  real authentication).
