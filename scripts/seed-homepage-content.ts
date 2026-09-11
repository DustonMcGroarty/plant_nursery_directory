/**
 * One-off fix for production: the OpenStreetMap import (scripts/import-osm.ts)
 * never touches the Specialty catalog and never sets a nursery's plan tier
 * above the default FREE, so on a database populated purely by that import,
 * the homepage's specialty filter chips and "Featured Nurseries" table both
 * render empty (they're conditionally hidden when there's no data).
 *
 * Also unpublishes big-box retailers (Walmart, Home Depot, etc.) that OSM
 * tags with shop=garden_centre even though they aren't actually nurseries —
 * see BIG_BOX_NAME_PATTERN below.
 *
 * This script is safe to re-run: the specialty upserts are idempotent, the
 * big-box unpublish only touches currently-published matches, and featuring
 * tops up to FEATURE_COUNT rather than skipping outright once any nursery
 * is already featured.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

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

// Big-box/grocery chains OSM sometimes tags shop=garden_centre for their
// in-store garden section — real store, but not a nursery in the sense
// this directory is for. Matched case-insensitively against the nursery
// name; deliberately conservative (exact well-known chain names only) to
// avoid false-positives against small businesses that happen to share a word.
const BIG_BOX_NAME_PATTERN =
  /\b(walmart|home depot|lowe'?s|costco|target|sam'?s club|kmart|menards)\b/i;

const FEATURE_COUNT = 6;

async function main() {
  console.log("Seeding specialty catalog...");
  for (const s of SPECIALTIES) {
    await prisma.specialty.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  console.log("Unpublishing big-box retailers miscategorized as nurseries...");
  const bigBoxMatches = await prisma.nursery.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, name: true, city: true, state: true },
  });
  const bigBoxIds = bigBoxMatches
    .filter((n) => BIG_BOX_NAME_PATTERN.test(n.name))
    .map((n) => n.id);
  if (bigBoxIds.length > 0) {
    await prisma.nursery.updateMany({
      where: { id: { in: bigBoxIds } },
      data: { status: "UNPUBLISHED", planTier: "FREE" },
    });
    for (const n of bigBoxMatches) {
      if (bigBoxIds.includes(n.id)) {
        console.log(`  Unpublished: ${n.name} (${n.city}, ${n.state})`);
      }
    }
  } else {
    console.log("  None found.");
  }

  const currentlyFeatured = await prisma.nursery.findMany({
    where: { status: "PUBLISHED", planTier: { in: ["FEATURED", "PREMIUM"] } },
    select: { id: true, state: true, planTier: true },
  });
  const needed = FEATURE_COUNT - currentlyFeatured.length;
  if (needed <= 0) {
    console.log(`Already have ${currentlyFeatured.length} featured nursery(ies) — nothing to top up.`);
    return;
  }

  console.log(`Selecting ${needed} more published nursery(ies) to feature...`);
  // Prefer listings with a phone or website (the more "complete" looking
  // real entries — OSM data is inconsistent about which fields it has),
  // spread across states not already represented so the homepage doesn't
  // show several nurseries from the same state.
  const alreadyFeaturedIds = currentlyFeatured.map((n) => n.id);
  const seenStates = new Set(currentlyFeatured.map((n) => n.state));
  const candidates = await prisma.nursery.findMany({
    where: {
      status: "PUBLISHED",
      addressLine1: { not: "" },
      OR: [{ phone: { not: null } }, { website: { not: null } }],
      id: { notIn: alreadyFeaturedIds },
    },
    select: { id: true, name: true, city: true, state: true },
    orderBy: { createdAt: "asc" },
    take: 1000,
  });

  const chosen: typeof candidates = [];
  for (const c of candidates) {
    if (BIG_BOX_NAME_PATTERN.test(c.name)) continue;
    if (seenStates.has(c.state)) continue;
    seenStates.add(c.state);
    chosen.push(c);
    if (chosen.length === needed) break;
  }

  if (chosen.length === 0) {
    console.log(
      "No eligible published nursery found to fill the remaining slot(s). " +
        "Mark some manually via /admin instead.",
    );
    return;
  }

  const hasPremium = currentlyFeatured.some((n) => n.planTier === "PREMIUM");
  for (const [i, n] of chosen.entries()) {
    const planTier = !hasPremium && i === 0 ? "PREMIUM" : "FEATURED";
    await prisma.nursery.update({ where: { id: n.id }, data: { planTier } });
    console.log(`  ${planTier.padEnd(8)} ${n.name} (${n.city}, ${n.state})`);
  }

  console.log(`Done — ${chosen.length} more nursery(ies) featured.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
