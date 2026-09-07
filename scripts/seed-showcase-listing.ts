/**
 * Fully populates ONE listing with every field the schema and UI support —
 * photos, hours, license, reviews, a claimed owner, and PREMIUM plan — so
 * there's a finished, "every feature turned on" example to point at before
 * launch. Everything else in the directory stays exactly as seeded/imported;
 * this is deliberately a single showcase, not a bulk data change.
 *
 *   npm run db:seed-showcase
 *
 * Targets the existing "evergreen-nursery-orlando-fl" seed row by slug.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const SLUG = "evergreen-nursery-orlando-fl";

const SPECIALTY_SLUGS = [
  "succulents-cacti",
  "organic",
  "herbs-vegetables",
  "houseplants",
  "native-plants",
];

const PHOTOS: { url: string; altText: string }[] = [
  {
    url: "/demo/greenhouse-interior.svg",
    altText: "Rows of potted plants inside the Evergreen Nursery greenhouse",
  },
  {
    url: "/demo/potted-plant-display.svg",
    altText: "Shelving display of potted houseplants",
  },
  {
    url: "/demo/garden-center-exterior.svg",
    altText: "Evergreen Nursery storefront and outdoor plant displays",
  },
  {
    url: "/demo/seedling-tray-closeup.svg",
    altText: "Watering a tray of seedlings",
  },
];

const REVIEWS: { name: string; email: string; rating: number; body: string; daysAgo: number }[] = [
  {
    name: "Priya Nandakumar",
    email: "priya.demo@example.com",
    rating: 5,
    body: "Incredible selection of succulents and the staff actually know what they're talking about. Repotted three plants for me on the spot and gave me care tips I hadn't heard anywhere else.",
    daysAgo: 12,
  },
  {
    name: "Marcus Webb",
    email: "marcus.demo@example.com",
    rating: 5,
    body: "My go-to for herbs every spring. Everything is organically grown and clearly labeled. Prices are fair for the quality.",
    daysAgo: 34,
  },
  {
    name: "Dana Ferreira",
    email: "dana.demo@example.com",
    rating: 4,
    body: "Great houseplant selection and a genuinely pretty space to walk through. Parking gets tight on weekends, so I go on weekday mornings now.",
    daysAgo: 58,
  },
  {
    name: "Sam Okonkwo",
    email: "sam.demo@example.com",
    rating: 5,
    body: "Asked for native Florida plants that could handle full sun and poor soil, and they walked me through half a dozen options. Everything I bought is thriving a year later.",
    daysAgo: 95,
  },
];

async function main() {
  const nursery = await prisma.nursery.findUnique({ where: { slug: SLUG } });
  if (!nursery) {
    throw new Error(
      `Nursery "${SLUG}" not found — run "npm run db:seed" first, or change SLUG in this script.`,
    );
  }

  const owner = await prisma.user.upsert({
    where: { email: "owner.evergreen@example.com" },
    update: {},
    create: {
      email: "owner.evergreen@example.com",
      name: "Jamie Castellano",
      role: "OWNER",
    },
  });

  const specialties = await prisma.specialty.findMany({
    where: { slug: { in: SPECIALTY_SLUGS } },
  });

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  await prisma.nursery.update({
    where: { id: nursery.id },
    data: {
      description:
        "Evergreen Nursery has been Orlando's neighborhood source for houseplants, succulents, and organically grown herbs and vegetables since 2011. We hand-pick every plant that comes through our doors, propagate a large share of our succulent and cactus inventory in-house, and our staff — most of whom have horticulture backgrounds — spend as much time as it takes helping you find the right plant for your space. Stop by for a browse, a repotting, or just to talk plants.",
      phone: "(407) 555-0148",
      website: "https://www.evergreennurseryorlando.example.com",
      email: "hello@evergreennurseryorlando.example.com",
      businessType: "RETAIL",
      hours: {
        mon: "9:00-18:00",
        tue: "9:00-18:00",
        wed: "9:00-18:00",
        thu: "9:00-18:00",
        fri: "9:00-19:00",
        sat: "8:00-19:00",
        sun: "10:00-16:00",
      },
      licenseNumber: "FL-NRS-88214",
      licenseStatus: "Active",
      licenseExpiresAt: oneYearFromNow,
      socialLinks: {
        instagram: "https://instagram.com/evergreennurseryorlando",
        facebook: "https://facebook.com/evergreennurseryorlando",
      },
      ownerId: owner.id,
      verifiedAt: new Date(),
      planTier: "PREMIUM",
      sponsoredUntil: ninetyDaysFromNow,
      specialties: {
        deleteMany: {},
        create: specialties.map((s) => ({ specialtyId: s.id })),
      },
    },
  });

  await prisma.nurseryPhoto.deleteMany({ where: { nurseryId: nursery.id } });
  await prisma.nurseryPhoto.createMany({
    data: PHOTOS.map((p) => ({ nurseryId: nursery.id, url: p.url, altText: p.altText })),
  });

  await prisma.review.deleteMany({ where: { nurseryId: nursery.id } });
  for (const r of REVIEWS) {
    const author = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { email: r.email, name: r.name, role: "VISITOR" },
    });
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - r.daysAgo);
    await prisma.review.create({
      data: {
        nurseryId: nursery.id,
        authorId: author.id,
        rating: r.rating,
        body: r.body,
        createdAt,
      },
    });
  }

  console.log(`Showcase listing ready: /nursery/${nursery.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
