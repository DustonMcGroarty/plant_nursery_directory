"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";

const ADMIN_COOKIE = "admin_secret";

export async function loginAdmin(formData: FormData) {
  const secret = formData.get("secret")?.toString() ?? "";
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    redirect("/admin?error=1");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  return Boolean(value && process.env.ADMIN_SECRET && value === process.env.ADMIN_SECRET);
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

export async function approveClaim(claimId: string) {
  const claim = await prisma.claimRequest.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "PENDING") return;

  const specialtyRecords = claim.proposedSpecialties.length
    ? await prisma.specialty.findMany({ where: { slug: { in: claim.proposedSpecialties } } })
    : [];

  if (claim.nurseryId) {
    await prisma.nursery.update({
      where: { id: claim.nurseryId },
      data: {
        name: claim.proposedName ?? undefined,
        addressLine1: claim.proposedAddressLine1 ?? undefined,
        addressLine2: claim.proposedAddressLine2,
        city: claim.proposedCity ?? undefined,
        state: claim.proposedState ?? undefined,
        postalCode: claim.proposedPostalCode ?? undefined,
        phone: claim.proposedPhone,
        website: claim.proposedWebsite,
        description: claim.proposedDescription,
        verifiedAt: new Date(),
        status: "PUBLISHED",
        specialties: specialtyRecords.length
          ? {
              deleteMany: {},
              create: specialtyRecords.map((s) => ({ specialtyId: s.id })),
            }
          : undefined,
      },
    });
  } else {
    const name = claim.proposedName ?? "Unnamed Nursery";
    const slug = await uniqueSlug(`${name}-${claim.proposedCity}-${claim.proposedState}`);

    // Geocoding isn't run for manual submissions yet; store 0,0 as a
    // placeholder so the listing is still visible in non-geo search/browse
    // until an admin/import fills in real coordinates.
    await prisma.nursery.create({
      data: {
        slug,
        name,
        addressLine1: claim.proposedAddressLine1 ?? "",
        addressLine2: claim.proposedAddressLine2,
        city: claim.proposedCity ?? "",
        state: claim.proposedState ?? "",
        postalCode: claim.proposedPostalCode ?? "",
        latitude: 0,
        longitude: 0,
        phone: claim.proposedPhone,
        website: claim.proposedWebsite,
        description: claim.proposedDescription,
        status: "PUBLISHED",
        source: "MANUAL_SUBMISSION",
        verifiedAt: new Date(),
        specialties: {
          create: specialtyRecords.map((s) => ({ specialtyId: s.id })),
        },
      },
    });
  }

  await prisma.claimRequest.update({
    where: { id: claimId },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });

  redirect("/admin");
}

export async function rejectClaim(claimId: string) {
  await prisma.claimRequest.update({
    where: { id: claimId },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
  redirect("/admin");
}

export async function logoutAdmin() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}
