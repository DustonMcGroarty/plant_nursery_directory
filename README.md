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

The seed data is placeholder only. There are two import pipelines to
populate the directory with real nurseries — both write imported listings
as `status: PENDING` so they go through the `/admin` moderation queue
before appearing publicly (both sources occasionally include mis-tagged
or stale businesses, so a human sanity-check is worth the friction).

**Neither runs automatically.** This sandboxed dev environment's network
policy blocks both APIs, so these need to be run from an environment with
normal internet access — your own machine, a CI job, or after the app is
deployed.

### Option A: OpenStreetMap (recommended — free, no API key)

```bash
npm run db:import-osm
```

`scripts/import-osm.ts` queries the free Overpass API once per US state
for nodes/ways tagged `shop=garden_centre` (retail garden centers) or
`landuse=plant_nursery` (wholesale growers), de-duplicating by OSM element
ID. No API key, no billing, and OpenStreetMap's ODbL license explicitly
permits building a directory from the data — you just need to credit
"© OpenStreetMap contributors" somewhere on the site once real OSM data
is live (a line in the footer is enough).

Some entries get skipped if OSM has no city tag for them (rural or
sparsely-mapped areas); the script logs how many. Those nurseries can
still be added manually via `/submit`.

### Option B: Google Places API (more complete, costs money)

```bash
GOOGLE_PLACES_API_KEY=your-key npm run db:import-places
```

`scripts/import-places.ts` tiles the entire US into overlapping search
circles and runs a Places "Text Search" (`plant nursery`) against each,
de-duplicating by Google's place ID. Requires a billed Google Cloud
project with the Places API (New) enabled.

**Read the comment at the top of the script before running it at
scale** — Google's Places API Terms of Service place restrictions on
caching and on using Places data to build a directory that competes with
Google Maps. This is why OpenStreetMap is the recommended default.

## Project structure

```
prisma/schema.prisma       Data model (Nursery, Specialty, ClaimRequest, User, Review, ...)
prisma/seed.ts             Synthetic sample data for local dev
scripts/import-osm.ts      OpenStreetMap import pipeline (see above, recommended)
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
