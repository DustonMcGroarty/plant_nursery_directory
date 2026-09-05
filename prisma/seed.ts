/**
 * Sample/demo data for local development.
 *
 * This is NOT real nursery data — it's synthetic so the app is testable
 * end-to-end before the Google Places import pipeline (scripts/import-places.ts)
 * is run with a real API key. See README for how to run the real import.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

const SPECIALTIES = [
  { name: "Native Plants", slug: "native-plants" },
  { name: "Succulents & Cacti", slug: "succulents-cacti" },
  { name: "Trees & Shrubs", slug: "trees-shrubs" },
  { name: "Perennials", slug: "perennials" },
  { name: "Annuals & Bedding Plants", slug: "annuals-bedding-plants" },
  { name: "Houseplants", slug: "houseplants" },
  { name: "Herbs & Vegetables", slug: "herbs-vegetables" },
  { name: "Roses", slug: "roses" },
  { name: "Bonsai", slug: "bonsai" },
  { name: "Orchids", slug: "orchids" },
  { name: "Wholesale", slug: "wholesale" },
  { name: "Landscape Design Services", slug: "landscape-design" },
  { name: "Organic / Pesticide-Free", slug: "organic" },
  { name: "Water Plants & Ponds", slug: "water-plants-ponds" },
  { name: "Garden Supplies & Tools", slug: "garden-supplies" },
];

// Representative cities across the US (approx. real coordinates) so
// map/search/radius demos look realistic. Nursery names below are invented.
const CITIES: { city: string; state: string; lat: number; lng: number; zipBase: string }[] = [
  { city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784, zipBase: "972" },
  { city: "Eugene", state: "OR", lat: 44.0521, lng: -123.0868, zipBase: "974" },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321, zipBase: "981" },
  { city: "Spokane", state: "WA", lat: 47.6588, lng: -117.426, zipBase: "992" },
  { city: "Sacramento", state: "CA", lat: 38.5816, lng: -121.4944, zipBase: "958" },
  { city: "Fresno", state: "CA", lat: 36.7378, lng: -119.7871, zipBase: "937" },
  { city: "San Diego", state: "CA", lat: 32.7157, lng: -117.1611, zipBase: "921" },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, zipBase: "802" },
  { city: "Boulder", state: "CO", lat: 40.015, lng: -105.2705, zipBase: "803" },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074, zipBase: "850" },
  { city: "Tucson", state: "AZ", lat: 32.2226, lng: -110.9747, zipBase: "857" },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431, zipBase: "787" },
  { city: "Houston", state: "TX", lat: 29.7604, lng: -95.3698, zipBase: "770" },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, zipBase: "752" },
  { city: "Minneapolis", state: "MN", lat: 44.9778, lng: -93.265, zipBase: "554" },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298, zipBase: "606" },
  { city: "Columbus", state: "OH", lat: 39.9612, lng: -82.9988, zipBase: "432" },
  { city: "Cleveland", state: "OH", lat: 41.4993, lng: -81.6944, zipBase: "441" },
  { city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388, zipBase: "303" },
  { city: "Savannah", state: "GA", lat: 32.0809, lng: -81.0912, zipBase: "314" },
  { city: "Orlando", state: "FL", lat: 28.5383, lng: -81.3792, zipBase: "328" },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, zipBase: "331" },
  { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, zipBase: "282" },
  { city: "Asheville", state: "NC", lat: 35.5951, lng: -82.5515, zipBase: "288" },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, zipBase: "372" },
  { city: "Richmond", state: "VA", lat: 37.5407, lng: -77.436, zipBase: "232" },
  { city: "Philadelphia", state: "PA", lat: 39.9526, lng: -75.1652, zipBase: "191" },
  { city: "Pittsburgh", state: "PA", lat: 40.4406, lng: -79.9959, zipBase: "152" },
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589, zipBase: "021" },
  { city: "Portland", state: "ME", lat: 43.6591, lng: -70.2568, zipBase: "041" },
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.006, zipBase: "100" },
  { city: "Albany", state: "NY", lat: 42.6526, lng: -73.7562, zipBase: "122" },
];

const NAME_PREFIXES = [
  "Sunrise Valley",
  "Green Thumb",
  "Evergreen",
  "Willow Creek",
  "Blue Ridge",
  "Cedar Hollow",
  "Meadowbrook",
  "Stonebridge",
  "Maple Grove",
  "Riverbend",
  "Wildflower",
  "Harvest Moon",
  "Golden Root",
  "Fern & Frond",
  "Pinecrest",
  "Rambling Rose",
  "Hillside",
  "Copper Leaf",
  "Prairie Sky",
  "Timberline",
];

const NAME_SUFFIXES = ["Nursery", "Garden Center", "Greenhouse & Nursery", "Plant Farm", "Growers"];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

async function main() {
  console.log("Seeding specialties...");
  const specialtyRecords = await Promise.all(
    SPECIALTIES.map((s) =>
      prisma.specialty.upsert({
        where: { slug: s.slug },
        update: {},
        create: s,
      }),
    ),
  );

  console.log("Seeding sample nurseries...");
  let seed = 0;
  for (const location of CITIES) {
    // 2-3 nurseries per city for a realistic, browsable dataset
    const count = 2 + (seed % 2);
    for (let i = 0; i < count; i++) {
      seed++;
      const prefix = pick(NAME_PREFIXES, seed);
      const suffix = pick(NAME_SUFFIXES, seed + 3);
      const name = `${prefix} ${suffix}`;
      const slug = slugify(`${name}-${location.city}-${location.state}`, { lower: true });
      const jitterLat = (((seed * 37) % 100) - 50) / 1000; // +/- ~0.05 deg
      const jitterLng = (((seed * 53) % 100) - 50) / 1000;
      const streetNum = 100 + ((seed * 17) % 8899);

      const chosenSpecialties = [
        specialtyRecords[seed % specialtyRecords.length],
        specialtyRecords[(seed + 4) % specialtyRecords.length],
        specialtyRecords[(seed + 9) % specialtyRecords.length],
      ];
      const uniqueSpecialtyIds = Array.from(new Set(chosenSpecialties.map((s) => s.id)));

      const planTier = seed % 7 === 0 ? "PREMIUM" : seed % 4 === 0 ? "FEATURED" : "FREE";

      await prisma.nursery.upsert({
        where: { source_externalId: { source: "MANUAL_SUBMISSION", externalId: slug } },
        update: {},
        create: {
          slug,
          name,
          addressLine1: `${streetNum} ${pick(["Main St", "Oak Ave", "Garden Rd", "River Rd", "Blossom Ln"], seed)}`,
          city: location.city,
          state: location.state,
          postalCode: `${location.zipBase}${(10 + (seed % 89)).toString()}`,
          latitude: location.lat + jitterLat,
          longitude: location.lng + jitterLng,
          phone: `(${200 + (seed % 700)}) 555-${(1000 + seed * 7) % 9000 + 1000}`,
          website: null,
          description: `${name} is a locally owned plant nursery serving ${location.city}, ${location.state} and the surrounding area.`,
          status: "PUBLISHED",
          source: "MANUAL_SUBMISSION",
          externalId: slug,
          planTier: planTier as "FREE" | "FEATURED" | "PREMIUM",
          sponsoredUntil: planTier === "FREE" ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
          specialties: {
            create: uniqueSpecialtyIds.map((specialtyId) => ({ specialtyId })),
          },
        },
      });
    }
  }

  const nurseryCount = await prisma.nursery.count();
  console.log(`Done. ${nurseryCount} nurseries in the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
