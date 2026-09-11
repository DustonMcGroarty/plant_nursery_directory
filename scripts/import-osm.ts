/**
 * Nationwide nursery import via OpenStreetMap (free, no API key, no billing).
 *
 * Unlike scripts/import-places.ts (Google Places), this has no per-request
 * cost and no terms-of-service restriction on building a directory from the
 * data — OpenStreetMap's ODbL license explicitly permits this, provided you
 * credit "© OpenStreetMap contributors" somewhere on the site (see the
 * Footer component / add a line there before going live with this data).
 *
 * Not run automatically: this sandboxed dev environment's network policy
 * blocks the Overpass API endpoints, so this script needs to be run from an
 * environment with normal internet access (your own machine, a CI job, or
 * after the app is deployed):
 *
 *   npm run db:import-osm
 *
 * Strategy: OSM tags plant nurseries and garden centers two ways —
 * shop=garden_centre (retail) and landuse=plant_nursery (wholesale growers).
 * We query the Overpass API once per US state (+ DC) for both tags, which
 * keeps each request small enough to avoid timeouts and makes the whole run
 * resumable (de-duplication is by OSM element id, so re-running after a
 * partial failure just skips what's already imported).
 *
 * Named features missing an addr:city tag get reverse-geocoded via
 * Nominatim (also free, also OpenStreetMap) instead of being skipped —
 * that service allows at most 1 request/second, so a run with a lot of
 * these can take noticeably longer than the Overpass querying alone.
 * Features with no name at all are skipped outright: there's no name to
 * recover from this data source (most are unnamed growing-field land-use
 * polygons, not businesses).
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import slugify from "slugify";
import { US_STATES } from "../src/lib/us-states";

const AUTO_PUBLISH = process.env.AUTO_PUBLISH_IMPORTS === "true";

// Public Overpass instances, tried in order. Public infrastructure run by
// volunteers — be polite: one request in flight at a time, with pauses
// between requests and backoff on failure (see below).
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const DELAY_BETWEEN_STATES_MS = 3000;
const RETRY_BACKOFF_MS = [5000, 15000, 30000];

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildQuery(stateIso: string): string {
  return `
    [out:json][timeout:180];
    area["ISO3166-2"="${stateIso}"]["boundary"="administrative"]->.a;
    (
      nwr["shop"="garden_centre"](area.a);
      nwr["landuse"="plant_nursery"](area.a);
    );
    out center tags;
  `;
}

async function queryOverpass(query: string): Promise<OverpassElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < RETRY_BACKOFF_MS.length; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
            Accept: "*/*",
            // Overpass's usage policy asks scripted clients to identify
            // themselves; some mirrors reject requests with no User-Agent
            // (or Node's generic default one) with a 406.
            "User-Agent": "plant-nursery-directory-import/1.0",
          },
          body: query,
          // Without this, a mirror that hangs instead of erroring can
          // stall the whole run far longer than the retry backoff implies.
          // Must exceed the query's own [timeout:180] above, or large
          // states (California, Texas, ...) get cut off client-side
          // before the server even finishes computing a real answer.
          signal: AbortSignal.timeout(200_000),
        });
        if (res.status === 429 || res.status === 504) {
          await sleep(RETRY_BACKOFF_MS[attempt]);
          continue;
        }
        if (!res.ok) {
          throw new Error(`Overpass ${endpoint} returned ${res.status}: ${await res.text()}`);
        }
        const json = (await res.json()) as { elements: OverpassElement[] };
        return json.elements ?? [];
      } catch (err) {
        lastError = err;
        await sleep(RETRY_BACKOFF_MS[attempt]);
      }
    }
    // Exhausted retries on this endpoint; fall through to the next mirror.
  }
  throw lastError instanceof Error ? lastError : new Error("All Overpass endpoints failed");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Nominatim (OpenStreetMap's free reverse-geocoding service) requires no
// more than 1 request/second and a descriptive User-Agent. This tracks
// the last call across the whole run (not per-state) so we never exceed
// that regardless of how the calling loop is structured.
let lastNominatimCallAt = 0;
const NOMINATIM_MIN_INTERVAL_MS = 1100;

interface ReverseGeocodeResult {
  city: string;
  postcode: string | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const wait = NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimCallAt);
  if (wait > 0) await sleep(wait);
  lastNominatimCallAt = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "plant-nursery-directory-import/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        hamlet?: string;
        municipality?: string;
        postcode?: string;
      };
    };
    const addr = json.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.municipality ?? null;
    if (!city) return null;
    return { city, postcode: addr.postcode ?? null };
  } catch {
    return null;
  }
}

async function uniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base, { lower: true });
  let slug = baseSlug || "nursery";
  let n = 1;
  while (await prisma.nursery.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

export async function upsertElement(el: OverpassElement, fallbackState: string) {
  const tags = el.tags ?? {};
  // Some features carry a real identity in a tag other than `name` (the
  // mapper set `brand`/`operator`/etc. but never got around to `name`
  // itself). Check those before giving up — this is real data OSM already
  // has, not a guess.
  const name =
    tags.name ?? tags.brand ?? tags.operator ?? tags.official_name ?? tags.alt_name ?? tags.short_name;
  if (!name) {
    return tags.shop ? "skipped_no_name_shop" : "skipped_no_name_landuse";
  }

  const lat = el.type === "node" ? el.lat : el.center?.lat;
  const lng = el.type === "node" ? el.lon : el.center?.lon;
  if (lat === undefined || lng === undefined) return "skipped_no_location";

  // Check for a duplicate before the (rate-limited) geocoding lookup below
  // — otherwise re-running the import wastes a Nominatim call on every
  // nursery that's already been imported.
  const externalId = `${el.type}/${el.id}`;
  const existing = await prisma.nursery.findUnique({
    where: { source_externalId: { source: "OPENSTREETMAP", externalId } },
  });
  if (existing) return "duplicate";

  let city = tags["addr:city"];
  let postalCode = tags["addr:postcode"];
  let cityWasEnriched = false;
  if (!city) {
    const geocoded = await reverseGeocode(lat, lng);
    if (!geocoded) return "skipped_no_city";
    city = geocoded.city;
    postalCode = postalCode ?? geocoded.postcode ?? undefined;
    cityWasEnriched = true;
  }
  // Each Overpass query is already scoped to one state's area, so that's
  // more trustworthy than the free-text addr:state tag, which sometimes
  // has a full state name ("Oregon") or other non-standard value instead
  // of the 2-letter code the rest of the app expects.
  const state = fallbackState.toUpperCase();

  const addressLine1 = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");

  const slug = await uniqueSlug(`${name}-${city}-${state}`);

  await prisma.nursery.create({
    data: {
      slug,
      name,
      addressLine1,
      city,
      state,
      postalCode: postalCode ?? "",
      latitude: lat,
      longitude: lng,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
      hours: tags.opening_hours ? { raw: tags.opening_hours } : undefined,
      status: AUTO_PUBLISH ? "PUBLISHED" : "PENDING",
      source: "OPENSTREETMAP",
      externalId,
    },
  });
  return cityWasEnriched ? "created_enriched_city" : "created";
}

async function main() {
  const stats: Record<string, number> = {
    created: 0,
    created_enriched_city: 0,
    duplicate: 0,
    skipped_no_name_shop: 0,
    skipped_no_name_landuse: 0,
    skipped_no_location: 0,
    skipped_no_city: 0,
  };

  // Optional: restrict to specific states, e.g. ONLY_STATES=DE,RI for a
  // quick smoke test, or to re-run just the states that failed last time.
  const onlyCodes = process.env.ONLY_STATES?.split(",").map((s) => s.trim().toUpperCase());
  const statesToRun = onlyCodes
    ? US_STATES.filter((s) => onlyCodes.includes(s.code))
    : US_STATES;

  for (const [i, state] of statesToRun.entries()) {
    const stateIso = `US-${state.code}`;
    console.log(`[${i + 1}/${statesToRun.length}] Querying ${state.name} (${stateIso})...`);

    try {
      const elements = await queryOverpass(buildQuery(stateIso));
      for (const el of elements) {
        const result = await upsertElement(el, state.code);
        stats[result] = (stats[result] ?? 0) + 1;
      }
      console.log(`  -> ${elements.length} results. Running totals:`, stats);
    } catch (err) {
      console.error(`  Failed for ${state.name}, skipping:`, err);
    }

    await sleep(DELAY_BETWEEN_STATES_MS);
  }

  console.log("Done.", stats);
  if (stats.created_enriched_city > 0) {
    console.log(
      `Note: ${stats.created_enriched_city} nurseries had no addr:city tag in OSM, so their city was filled in via reverse geocoding (Nominatim) instead.`,
    );
  }
  if (stats.skipped_no_city > 0) {
    console.log(
      `Note: ${stats.skipped_no_city} nurseries were skipped because OSM had no addr:city tag and reverse geocoding couldn't find one either (usually very rural areas). These can be added manually via the /submit form.`,
    );
  }
  if (stats.skipped_no_name_shop > 0) {
    console.log(
      `Note: ${stats.skipped_no_name_shop} retail garden center locations were skipped with no name in any tag (name/brand/operator/etc). These are real, mapped businesses - just anonymous ones. Worth a follow-up pass via Google Places or Yelp if you want to chase them.`,
    );
  }
  if (stats.skipped_no_name_landuse > 0) {
    console.log(
      `Note: ${stats.skipped_no_name_landuse} plant-nursery land-use polygons were skipped with no name in any tag - these are mostly unnamed growing fields, not standalone businesses, and aren't realistically recoverable from OSM.`,
    );
  }
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
