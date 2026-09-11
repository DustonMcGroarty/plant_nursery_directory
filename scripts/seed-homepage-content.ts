/**
 * One-off fix for production: the OpenStreetMap import (scripts/import-osm.ts)
 * never touches the Specialty catalog and never sets a nursery's plan tier
 * above the default FREE, so on a database populated purely by that import,
 * the homepage's specialty filter chips and "Featured Nurseries" table both
 * render empty (they're conditionally hidden when there's no data).
 *
 * This script is safe to re-run: the specialty upserts are idempotent, and
 * featuring is skipped for nurseries already above FREE tier.
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

const FEATURE_COUNT = 6;

async function main() {
  console.log("Seeding specialty catalog...");
  for (const s of SPECIALTIES) {
    await prisma.specialty.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  const alreadyFeatured = await prisma.nursery.count({
    where: { planTier: { in: ["FEATURED", "PREMIUM"] } },
  });
  if (alreadyFeatured > 0) {
    console.log(`${alreadyFeatured} nursery(ies) already above FREE tier — skipping featuring.`);
    return;
  }

  console.log(`Selecting ${FEATURE_COUNT} published nurseries to feature...`);
  // Prefer listings with a phone or website (the more "complete" looking
  // real entries — OSM data is inconsistent about which fields it has),
  // spread across distinct states so the homepage doesn't show six
  // nurseries from the same city.
  const candidates = await prisma.nursery.findMany({
    where: {
      status: "PUBLISHED",
      addressLine1: { not: "" },
      OR: [{ phone: { not: null } }, { website: { not: null } }],
    },
    select: { id: true, name: true, city: true, state: true },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  const seenStates = new Set<string>();
  const chosen: typeof candidates = [];
  for (const c of candidates) {
    if (seenStates.has(c.state)) continue;
    seenStates.add(c.state);
    chosen.push(c);
    if (chosen.length === FEATURE_COUNT) break;
  }

  if (chosen.length === 0) {
    console.log(
      "No published nursery has both a phone and a website — nothing to feature. " +
        "Mark some manually via /admin instead.",
    );
    return;
  }

  for (const [i, n] of chosen.entries()) {
    // First pick gets PREMIUM (leads the homepage spotlight), the rest FEATURED.
    const planTier = i === 0 ? "PREMIUM" : "FEATURED";
    await prisma.nursery.update({ where: { id: n.id }, data: { planTier } });
    console.log(`  ${planTier.padEnd(8)} ${n.name} (${n.city}, ${n.state})`);
  }

  console.log(`Done — ${chosen.length} nursery(ies) featured.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
