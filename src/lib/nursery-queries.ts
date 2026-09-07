import { prisma } from "@/lib/prisma";
import { haversineMiles } from "@/lib/geo";
import type { Prisma } from "@/generated/prisma/client";

const PLAN_RANK: Record<string, number> = { PREMIUM: 0, FEATURED: 1, FREE: 2 };

// Degrees of latitude per mile is ~constant; degrees of longitude shrinks
// with latitude, so we pad generously rather than computing cos(lat) here.
const MILES_PER_DEGREE_LAT = 69;

export interface NurserySearchParams {
  q?: string;
  state?: string;
  specialties?: string[];
  near?: { lat: number; lng: number; radiusMiles: number };
  page?: number;
  pageSize?: number;
}

export interface NurserySearchResultItem {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  planTier: string;
  distanceMiles: number | null;
  specialtyNames: string[];
  photoUrl: string | null;
}

export async function searchNurseries(params: NurserySearchParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));

  const where: Prisma.NurseryWhereInput = {
    status: "PUBLISHED",
  };

  if (params.state) {
    where.state = params.state.toUpperCase();
  }

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  if (params.specialties && params.specialties.length > 0) {
    where.specialties = {
      some: { specialty: { slug: { in: params.specialties } } },
    };
  }

  if (params.near) {
    const { lat, lng, radiusMiles } = params.near;
    const latDelta = radiusMiles / MILES_PER_DEGREE_LAT;
    // Pad longitude delta for latitudes up to ~70N; still a bounding box
    // prefilter, exact filtering happens below via haversine.
    const lngDelta = radiusMiles / (MILES_PER_DEGREE_LAT * 0.35);
    where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
    where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
  }

  const candidates = await prisma.nursery.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      planTier: true,
      specialties: { select: { specialty: { select: { name: true } } } },
      photos: { take: 1, orderBy: { createdAt: "asc" }, select: { url: true } },
    },
    // Cap the candidate set for in-memory distance sort/pagination; a
    // production-scale dataset would use a geo-indexed query instead.
    take: 2000,
  });

  let withDistance: NurserySearchResultItem[] = candidates.map((n) => ({
    id: n.id,
    slug: n.slug,
    name: n.name,
    city: n.city,
    state: n.state,
    latitude: n.latitude,
    longitude: n.longitude,
    planTier: n.planTier,
    specialtyNames: n.specialties.map((s) => s.specialty.name),
    photoUrl: n.photos[0]?.url ?? null,
    distanceMiles: params.near
      ? haversineMiles(params.near.lat, params.near.lng, n.latitude, n.longitude)
      : null,
  }));

  if (params.near) {
    const radius = params.near.radiusMiles;
    withDistance = withDistance.filter((n) => (n.distanceMiles ?? Infinity) <= radius);
  }

  withDistance.sort((a, b) => {
    const rankDiff = PLAN_RANK[a.planTier] - PLAN_RANK[b.planTier];
    if (rankDiff !== 0) return rankDiff;
    if (a.distanceMiles !== null && b.distanceMiles !== null) {
      return a.distanceMiles - b.distanceMiles;
    }
    return a.name.localeCompare(b.name);
  });

  const total = withDistance.length;
  const start = (page - 1) * pageSize;
  const pageItems = withDistance.slice(start, start + pageSize);

  return { items: pageItems, total, page, pageSize };
}

export async function getNurseryBySlug(slug: string) {
  return prisma.nursery.findUnique({
    where: { slug },
    include: {
      specialties: { include: { specialty: true } },
      photos: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
}

export async function getFeaturedNurseries(limit = 6) {
  return prisma.nursery.findMany({
    where: { status: "PUBLISHED", planTier: { in: ["FEATURED", "PREMIUM"] } },
    // desc so PREMIUM (highest tier) sorts before FEATURED, and a verified
    // listing sorts before an unverified one of the same tier — the
    // homepage spotlight should lead with the most complete, trustworthy
    // listing, not just whichever paid tier row happens to be newest.
    orderBy: [
      { planTier: "desc" },
      { verifiedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: limit,
    include: {
      specialties: { include: { specialty: true } },
      photos: { take: 1, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getAllSpecialties() {
  return prisma.specialty.findMany({ orderBy: { name: "asc" } });
}

export async function getDirectoryStats() {
  const [nurseryCount, stateAgg] = await Promise.all([
    prisma.nursery.count({ where: { status: "PUBLISHED" } }),
    prisma.nursery.groupBy({
      by: ["state"],
      where: { status: "PUBLISHED" },
      _count: true,
    }),
  ]);
  return { nurseryCount, stateCount: stateAgg.length };
}
