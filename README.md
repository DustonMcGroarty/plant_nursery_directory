# Find Plant Nurseries — US Plant Nursery Directory

A searchable directory of plant nurseries and garden centers across the
United States, built with Next.js (App Router) and PostgreSQL/Prisma.

## Features

- **Search & filter** by keyword, state, specialty, and "near me" radius
  (browser geolocation + haversine distance, no geocoding API required).
- **Nursery profile pages** with address, phone, website, specialties,
  hours, license status, a photo gallery, an interactive map (Leaflet +
  OpenStreetMap tiles, no API key), read-only reviews with a star-rating
  summary, and `GardenStore` JSON-LD structured data for SEO.
- **Map view** on `/search` — a List/Map toggle plots every result on the
  same free OSM tiles as the profile page map.
- **Dynamic favicon + Open Graph images** (`next/og`) — a branded tab icon
  and a per-nursery social share image generated at request time, no
  static image assets to keep in sync.
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

## Launching without touching a terminal

If you're not going to run any commands yourself, this is the click-only
path from "code on GitHub" to "live site with real nurseries in it." Steps
1–4 only matter the first time you set up a database from scratch; if you
already have a Supabase project for this app with data in it, skip straight
to step 5.

1. **Create the database.** Go to [supabase.com](https://supabase.com),
   sign in, and click **New project**. Pick any name/region/password
   (the password is only for Supabase's own dashboard — you won't need to
   remember it for this). Wait for it to say the project is ready.
2. **Copy two connection strings.** In the new project, go to
   **Settings → Database**. You'll see a "Connection string" section with
   a few tabs/modes — copy the **Transaction pooler** string (port 6543)
   and the **Session pooler** (or "Direct connection") string (port 5432).
   Each looks like `postgresql://postgres.xxxx:...`. Keep this tab open.
3. **Add those as GitHub secrets.** In this repository on GitHub, go to
   **Settings → Secrets and variables → Actions**, and click **New
   repository secret** twice, creating:
   - `DATABASE_URL` = the port-6543 string from step 2
   - `DIRECT_URL` = the port-5432 string from step 2
4. **Create the database tables.** Still on GitHub, go to the **Actions**
   tab, click **Create/update database tables** in the left sidebar, then
   **Run workflow** → **Run workflow**. Wait for the green checkmark —
   that means your Supabase database now has the right tables. You only
   need this again in the future if the app's data model changes.
   **Import real nurseries** the same way, via the **Import nurseries
   from OpenStreetMap** workflow — but check your `Nursery` table in
   Supabase's Table Editor first (it shows a row count at the bottom).
   If it's already got thousands of rows, this has already been done —
   don't re-run it, it can take hours.
5. **Deploy the site.** Go to [vercel.com/new](https://vercel.com/new),
   sign in with GitHub, and import this repository. When it asks for
   environment variables, add:
   - `DATABASE_URL` and `DIRECT_URL` — the same two connection strings
     from your Supabase project (Settings → Database, same as step 2)
   - `ADMIN_SECRET` — make up a long random password; this is what
     protects `/admin` on the live site, so save it somewhere
   - `NEXT_PUBLIC_SITE_URL` — leave this blank for now; once you click
     **Deploy** below and Vercel gives you the live URL, come back to
     **Settings → Environment Variables**, add it then, and redeploy
     (**Deployments** tab → **⋯** → **Redeploy**) so it takes effect
   Click **Deploy**.
6. **Review and publish.** Visit `your-site-url/admin`, log in with the
   `ADMIN_SECRET` from step 5, and open **Listings**. Imported nurseries
   start out with status **Pending** (filter the list to that status) —
   select the ones you want live and use the bulk status dropdown to set
   them to **Published**. (**Submissions** is a different queue — that's
   only for claims/new listings people submit through the public
   `/submit` form, not the bulk import.) The site is now real.
7. **Populate the homepage's filter chips and Featured section.** The
   OpenStreetMap import doesn't touch the specialty catalog or feature any
   listings, so on a freshly imported database the homepage's specialty
   filter chips and "Featured Nurseries" table both start out empty. On
   the **Actions** tab, run **Seed specialty catalog + feature a few
   listings** once (same click-only "Run workflow" flow as step 4). Safe
   to re-run.

Re-running the import later (e.g. after OSM gets more data in your area)
is safe — it skips nurseries already imported, so it only ever adds new
ones.

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

## Showcase listing

```bash
npm run db:seed-showcase
```

`scripts/seed-showcase-listing.ts` fully populates **one** existing seed
nursery (`evergreen-nursery-orlando-fl`) with every field the schema and UI
support — full description, hours, an active license, a photo gallery,
several reviews, a claimed owner, and the `PREMIUM` plan — so there's a
finished example to point people at before real data or real owner
sign-ups exist. It also ranks above other listings on the homepage (see
`getFeaturedNurseries`, which sorts a verified listing before an
unverified one of the same plan tier). Everything else in the directory
is untouched; this is a single demo row, not a bulk data change. The
photos it uses are the illustrations in `public/demo/` — swap in real
photography whenever you have it.

## Getting real, nationwide nursery data

The seed data is placeholder only. There are two import pipelines to
populate the directory with real nurseries — both write imported listings
as `status: PENDING` so they go through the `/admin` moderation queue
before appearing publicly (both sources occasionally include mis-tagged
or stale businesses, so a human sanity-check is worth the friction).

**Not a fit for a sandboxed dev environment whose network policy blocks
outbound API access** (Overpass, Places, and — for the OSM path — a
GitHub Actions workflow are all fine; a locked-down local sandbox is not).
The OSM import has a no-terminal path via GitHub Actions — see "Launching
without touching a terminal" above. Both scripts also run the normal way
from any machine/CI job with real internet access, shown below.

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

## Recommended path: populate Supabase, then deploy (terminal version)

Same outcome as "Launching without touching a terminal" above, run from a
command line instead of clicking through GitHub/Vercel's UIs — runs the
OpenStreetMap import once, against your real production database, before
the site is public, so nobody sees placeholder data.

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
6. **Populate the homepage's filter chips and Featured section:**
   ```bash
   npm run db:seed-homepage-content
   ```
   The OSM import doesn't create the specialty catalog or feature any
   listings, so without this the homepage's filter chips and "Featured
   Nurseries" table start out empty. Safe to re-run.
7. **Deploy to Vercel**, pointing it at the same `DATABASE_URL` /
   `DIRECT_URL` / `ADMIN_SECRET` values as env vars in the Vercel project
   settings, plus `NEXT_PUBLIC_SITE_URL` set to your real domain (see
   `.env.example` — without it, the generated Open Graph/social share
   images resolve to `localhost` and won't load when a link is shared).
   The site now launches with real, already-reviewed data.

## Project structure

```
.github/workflows/migrate-database.yml  No-terminal "create tables" step — see launch guide above
.github/workflows/import-osm.yml        No-terminal OSM import — see launch guide above
prisma/schema.prisma             Data model (Nursery, Specialty, ClaimRequest, User, Review, ...)
prisma/seed.ts                   Synthetic sample data for local dev
scripts/import-osm.ts            OpenStreetMap import pipeline (recommended)
scripts/import-places.ts         Google Places import pipeline
scripts/parse-wa-nursery-pdf.ts  Washington state license PDF -> CSV (bulk-import pilot)
scripts/seed-showcase-listing.ts Fully populates one demo listing — see "Showcase listing" above
src/lib/csv-import.ts            CSV template definition + parsing/validation, shared by
                                  the parser scripts and /admin/import
src/app/                         Public routes: /, /search, /nursery/[slug], /submit
src/app/icon.tsx                 Dynamic favicon (next/og)
src/app/opengraph-image.tsx      Site-wide social share image (next/og)
src/app/nursery/[slug]/opengraph-image.tsx  Per-nursery social share image
src/app/admin/                   Admin backend: listings/, submissions/, import/
src/lib/nursery-queries.ts       Public search/filter/geo query logic
src/lib/geo.ts                   Haversine distance helper
src/components/NurseryMap.tsx    Leaflet map (single-location or multi-pin), self-hosted
src/components/SearchResultsView.tsx  List/Map toggle for /search
public/demo/                     Illustrated placeholder photos for the showcase listing
```

## Roadmap ideas

- Photo uploads for owners (schema + display already exist —
  `NurseryPhoto`, the profile-page gallery, admin URL management in
  `/admin/listings/[id]`; what's missing is a self-serve upload flow tied
  to a real owner login, once auth exists).
- Review submissions (schema + display already exist — `Review`, the
  profile-page reviews section; what's missing is a public write/submit
  form, presumably with moderation like `/submit`).
- Payment integration for `FEATURED`/`PREMIUM` plan upgrades.
- Owner accounts / auth (schema has `User.role: OWNER`, not yet wired to
  real authentication — currently the only way to set `ownerId` is via
  `/admin` or the showcase script).
- Live inventory sync (schema has `Nursery.inventorySyncUrl`; needs a
  scheduled job that actually reads a linked feed).
- A `Scheduled` listing status that flips to `Published` at a set time
  (needs a background job/cron — deliberately deferred).
- Flexible CSV column mapping in `/admin/import` (currently a fixed
  template) if bulk sources turn out to need it.
