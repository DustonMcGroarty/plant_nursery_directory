/**
 * Nationwide nursery import via the Google Places API (New).
 *
 * NOT run automatically — it costs money (Places API billing) and needs a
 * real API key, so it's meant to be run by hand once you have one:
 *
 *   GOOGLE_PLACES_API_KEY=... npm run db:import-places
 *
 * Strategy: tile the continental US + Alaska + Hawaii into overlapping
 * circles and run a Text Search ("plant nursery") biased to each circle,
 * paginating and de-duplicating by Google's place id. Imported nurseries
 * land with status=PENDING so they go through the same /admin moderation
 * queue as user submissions — Places data can include mis-tagged
 * businesses (e.g. hardware stores that also sell a few plants), so a
 * human sanity-check before publishing is worth the friction.
 *
 * IMPORTANT — Google Places API Terms of Service:
 * Google's ToS restricts how Places data may be stored/displayed (caching
 * limits, required attribution, and a general restriction against using
 * Places data to build a business directory that competes with Google
 * Maps). Read https://cloud.google.com/maps-platform/terms before running
 * this against production traffic. For a fully open, ToS-free alternative
 * covering most of the same data, consider importing from OpenStreetMap
 * (shop=garden_centre) via the Overpass API instead — it's free, has no
 * per-request cost, and its ODbL license explicitly allows this use case
 * (with attribution). This script is provided because Google Places was
 * the option chosen for this project, but swapping in an
 * Overpass-based importer is a reasonable follow-up if licensing is a
 * concern.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import slugify from "slugify";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const AUTO_PUBLISH = process.env.AUTO_PUBLISH_IMPORTS === "true";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.regularOpeningHours",
].join(",");

// Roughly tiles the continental US, Alaska, and Hawaii. Step size and
// search radius overlap generously — duplicates are expected and are
// de-duplicated by place id via the Nursery.source+externalId unique
// constraint (see prisma/schema.prisma).
function buildGrid(): { lat: number; lng: number; radiusMeters: number }[] {
  const points: { lat: number; lng: number; radiusMeters: number }[] = [];

  const regions = [
    { latMin: 24.5, latMax: 49.5, lngMin: -125, lngMax: -66.9, step: 0.9 }, // CONUS
    { latMin: 51, latMax: 71, lngMin: -170, lngMax: -130, step: 1.5 }, // Alaska
    { latMin: 18.9, latMax: 22.3, lngMin: -160.3, lngMax: -154.7, step: 0.6 }, // Hawaii
  ];

  for (const r of regions) {
    for (let lat = r.latMin; lat <= r.latMax; lat += r.step) {
      for (let lng = r.lngMin; lng <= r.lngMax; lng += r.step) {
        points.push({ lat, lng, radiusMeters: r.step * 111_000 * 0.75 });
      }
    }
  }
  return points;
}

interface PlaceResult {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText: string; shortText: string; types: string[] }[];
  location?: { latitude: number; longitude: number };
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

function componentByType(place: PlaceResult, type: string) {
  return place.addressComponents?.find((c) => c.types.includes(type));
}

async function searchTextPage(
  center: { lat: number; lng: number; radiusMeters: number },
  pageToken?: string,
): Promise<{ places: PlaceResult[]; nextPageToken?: string }> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": pageToken ? FIELD_MASK : `${FIELD_MASK},nextPageToken`,
    },
    body: JSON.stringify(
      pageToken
        ? { pageToken }
        : {
            textQuery: "plant nursery",
            locationBias: {
              circle: {
                center: { latitude: center.lat, longitude: center.lng },
                radius: center.radiusMeters,
              },
            },
            maxResultCount: 20,
          },
    ),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { places?: PlaceResult[]; nextPageToken?: string };
  return { places: json.places ?? [], nextPageToken: json.nextPageToken };
}

async function uniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base, { lower: true });
  let slug = baseSlug;
  let n = 1;
  while (await prisma.nursery.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

async function upsertPlace(place: PlaceResult) {
  if (!place.location) return "skipped";

  const name = place.displayName?.text ?? "Unnamed Nursery";
  const city =
    componentByType(place, "locality")?.longText ??
    componentByType(place, "postal_town")?.longText ??
    "";
  const state = componentByType(place, "administrative_area_level_1")?.shortText ?? "";
  const postalCode = componentByType(place, "postal_code")?.longText ?? "";
  const streetNumber = componentByType(place, "street_number")?.longText ?? "";
  const route = componentByType(place, "route")?.longText ?? "";
  const addressLine1 = [streetNumber, route].filter(Boolean).join(" ") || place.formattedAddress || "";

  if (!city || !state) return "skipped"; // not enough address data to publish

  const existing = await prisma.nursery.findUnique({
    where: { source_externalId: { source: "GOOGLE_PLACES", externalId: place.id } },
  });
  if (existing) return "duplicate";

  const slug = await uniqueSlug(`${name}-${city}-${state}`);

  await prisma.nursery.create({
    data: {
      slug,
      name,
      addressLine1,
      city,
      state,
      postalCode,
      latitude: place.location.latitude,
      longitude: place.location.longitude,
      phone: place.internationalPhoneNumber ?? null,
      website: place.websiteUri ?? null,
      hours: place.regularOpeningHours?.weekdayDescriptions
        ? { weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions }
        : undefined,
      status: AUTO_PUBLISH ? "PUBLISHED" : "PENDING",
      source: "GOOGLE_PLACES",
      externalId: place.id,
    },
  });
  return "created";
}

async function main() {
  if (!API_KEY) {
    console.error(
      "GOOGLE_PLACES_API_KEY is not set. See .env.example and the README for setup.",
    );
    process.exit(1);
  }

  const grid = buildGrid();
  console.log(`Scanning ${grid.length} grid cells across the US...`);

  const stats = { created: 0, duplicate: 0, skipped: 0 };

  for (const [i, cell] of grid.entries()) {
    let pageToken: string | undefined;
    let pages = 0;
    do {
      const { places, nextPageToken } = await searchTextPage(cell, pageToken);
      for (const place of places) {
        const result = await upsertPlace(place);
        stats[result as keyof typeof stats]++;
      }
      pageToken = nextPageToken;
      pages++;
      // Google requires a short delay before a page token becomes valid.
      if (pageToken) await new Promise((r) => setTimeout(r, 2000));
    } while (pageToken && pages < 3);

    if (i % 25 === 0) {
      console.log(
        `[${i}/${grid.length}] created=${stats.created} duplicate=${stats.duplicate} skipped=${stats.skipped}`,
      );
    }
    // Basic pacing to stay well under rate limits.
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log("Done.", stats);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
