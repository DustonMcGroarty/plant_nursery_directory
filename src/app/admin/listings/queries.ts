import { prisma } from "@/lib/prisma";
import type { Prisma, NurseryStatus, DataSource } from "@/generated/prisma/client";

export interface AdminListingFilters {
  status?: string;
  state?: string;
  source?: string;
  q?: string;
  page?: number;
}

const PAGE_SIZE = 50;

// Shared with bulkUpdateStatusByFilter (actions.ts) so "apply to all N
// matching" always affects exactly the set the admin is currently looking
// at — not a second, potentially-drifted copy of this filter logic.
export function buildAdminListingWhere(filters: AdminListingFilters): Prisma.NurseryWhereInput {
  const where: Prisma.NurseryWhereInput = {};
  if (filters.status) where.status = filters.status as NurseryStatus;
  if (filters.state) where.state = filters.state.toUpperCase();
  if (filters.source) where.source = filters.source as DataSource;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { city: { contains: filters.q, mode: "insensitive" } },
      { legalName: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listNurseriesForAdmin(filters: AdminListingFilters) {
  const page = Math.max(1, filters.page ?? 1);

  const where = buildAdminListingWhere(filters);

  const [items, total] = await Promise.all([
    prisma.nursery.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        status: true,
        source: true,
        planTier: true,
        updatedAt: true,
        ownerId: true,
      },
    }),
    prisma.nursery.count({ where }),
  ]);

  return { items, total, page, pageSize: PAGE_SIZE };
}

export async function getStatusCounts() {
  const counts = await prisma.nursery.groupBy({ by: ["status"], _count: true });
  return Object.fromEntries(counts.map((c) => [c.status, c._count]));
}
