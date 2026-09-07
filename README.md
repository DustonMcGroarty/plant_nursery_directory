# Find Plant Nurseries — US Plant Nursery Directory

A searchable directory of plant nurseries and garden centers across the
United States, built with Next.js (App Router) and PostgreSQL/Prisma.

## Features

- **Search & filter** by keyword, state, specialty, and "near me" radius
  (browser geolocation + haversine distance, no geocoding API required).
- **Nursery profile pages** with address, phone, website, specialties, and
  `GardenStore` JSON-LD structured data for SEO.
- **Add / claim a listing** — a public form creates a moderation request;
  nothing goes live until approved. Mirrors the "Google creates the
  listing, the owner claims it" model: every imported nursery starts
  unclaimed, and `/submit?claim=<slug>` lets an owner take it over.
- **Admin backend** (`/admin`, secret-protected) — a WordPress-style
  listing manager, not raw SQL:
  - **Listings** — every nursery, filterable by status/state/source,
    with bulk status changes (Draft/Pending/Published/Unpublished/
    Rejected) and a full edit page per listing.
  - **Submissions** — the moderation queue for public `/submit` requests.
  - **Import** — bulk-add or bulk-update listings from a CSV (state
    licensing lists, trade association directories, etc.) — see below.
- **Monetization-ready data model** — every nursery has a `planTier`
  (`FREE` / `FEATURED` / `PREMIUM`) and `sponsoredUntil` date. Featured and
  premium listings are pinned above free ones in search results and get a
  badge; no payment processing is wired up yet, just the schema/UI hooks.

## Tech stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- PostgreSQL + Prisma ORM
- Tailwind CSS v4
- Zod for form validation
- `csv-parse` / `pdf-parse` for bulk-import tooling

## Local setup

1. **Database.** Point `DATABASE_URL` (see `.env.example`) at a Postgres
   instance. Locally:
   ```bash
   createdb plant_nursery_directory
   ```
2. **Env vars.** Copy `.env.example` to `.env` and fill in `DATABASE_URL`,
   `DIRECT_URL` (see the comment in `.env.example` — Supabase needs two
   different connection strings), and a random `ADMIN_SECRET`.
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

## Bulk-importing from state registries, trade associations, etc.

Beyond the OSM/Places pipelines above, `/admin/import` accepts a CSV to
add or update listings in bulk — the intended path for state Dept. of
Agriculture nursery dealer licenses, trade association member
directories, or any other one-off list you get your hands on.

1. Download the template from the link on `/admin/import` (or
   `GET /admin/import/template`) for the exact expected columns.
2. Clean whatever source data you have to match those columns.
3. Upload it. You get a preview — row count, and any validation errors
   per row — before anything is written.
4. Confirm the import. A row matching an existing listing (by name +
   city + state) **updates** it, filling in blanks and license info,
   rather than creating a duplicate; it never changes an existing
   listing's status unless the row explicitly sets one, so a refreshed
   source list can't accidentally re-publish something you'd rejected.
   A row with no match creates a new listing, published by default.

### Pilot: Washington State nursery dealer licenses

```bash
npm run parse:wa-pdf
```

`scripts/parse-wa-nursery-pdf.ts` downloads and parses WSDA's public
"Wholesale Licensed Nursery Dealers" PDF into a CSV matching the
template above (written to `wa-nursery-import.csv`), which you then
upload through `/admin/import`. It prints the PDF's detected table
header and a few sample rows before writing anything — if the column
mapping guessed in `HEADER_ALIASES` near the top of the script doesn't
match what's printed, adjust it there and re-run.

This is a template for the broader state-by-state effort: each state
Dept. of Agriculture publishes its licensed nursery dealers differently
(some as a PDF like Washington's, some as a downloadable CSV, some only
via a public-records-request email to the licensing division) — there's
no single script that covers all 50. This one is the pattern to copy for
the next state.

## Recommended path: populate Supabase, then deploy

This runs the OpenStreetMap import once, against your real production
database, before the site is public — so nobody sees placeholder data.

1. **Create a Supabase project** (supabase.com -> New project). Wait for
   it to finish provisioning.
2. **Get your connection strings.** In the project, go to
   Settings -> Database. Copy the "Transaction" pooler connection string
   (port 6543) for `DATABASE_URL`, and the "Session" pooler or direct
   connection string (port 5432) for `DIRECT_URL`. Put both in your local
   `.env`, along with a random `ADMIN_SECRET`.
3. **Create the tables** in Supabase:
   ```bash
   npx prisma migrate deploy
   ```
4. **Import real data:**
   ```bash
   npm run db:import-osm
   ```
   This can take a while (it makes one request per state, with polite
   delays between them). It's safe to stop and re-run — already-imported
   nurseries are skipped.
5. **Review and publish.** Run `npm run dev` locally against that same
   `.env`, open `/admin`, and approve the imported listings (or set
   `AUTO_PUBLISH_IMPORTS=true` before running the import if you'd rather
   skip review and publish everything immediately).
6. **Deploy to Vercel**, pointing it at the same `DATABASE_URL` /
   `DIRECT_URL` / `ADMIN_SECRET` values as env vars in the Vercel project
   settings. The site now launches with real, already-reviewed data.

## Project structure

```
prisma/schema.prisma            Data model (Nursery, Specialty, ClaimRequest, User, Review, ...)
prisma/seed.ts                  Synthetic sample data for local dev
scripts/import-osm.ts           OpenStreetMap import pipeline (recommended)
scripts/import-places.ts        Google Places import pipeline
scripts/parse-wa-nursery-pdf.ts Washington state license PDF -> CSV (bulk-import pilot)
src/lib/csv-import.ts           CSV template definition + parsing/validation, shared by
                                 the parser scripts and /admin/import
src/app/                        Public routes: /, /search, /nursery/[slug], /submit
src/app/admin/                  Admin backend: listings/, submissions/, import/
src/lib/nursery-queries.ts      Public search/filter/geo query logic
src/lib/geo.ts                  Haversine distance helper
```

## Roadmap ideas

- Photos (schema already supports `NurseryPhoto`; needs an upload flow).
- Reviews (schema already supports `Review`; needs UI).
- Map view of search results.
- Payment integration for `FEATURED`/`PREMIUM` plan upgrades.
- Owner accounts / auth (schema has `User.role: OWNER`, not yet wired to
  real authentication).
- Live inventory sync (schema has `Nursery.inventorySyncUrl`; needs a
  scheduled job that actually reads a linked feed).
- A `Scheduled` listing status that flips to `Published` at a set time
  (needs a background job/cron — deliberately deferred).
- Flexible CSV column mapping in `/admin/import` (currently a fixed
  template) if bulk sources turn out to need it.
