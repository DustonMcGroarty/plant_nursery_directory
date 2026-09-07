"use server";

import { redirect } from "next/navigation";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import type { BusinessType, DataSource, NurseryStatus } from "@/generated/prisma/client";
import { buildAdminListingWhere, type AdminListingFilters } from "@/app/admin/listings/queries";

export async function bulkUpdateStatus(formData: FormData) {
  const ids = formData.getAll("ids").map((v) => v.toString());
  const newStatus = formData.get("newStatus")?.toString();
  const returnTo = formData.get("returnTo")?.toString() || "/admin/listings";

  if (ids.length > 0 && newStatus) {
    await prisma.nursery.updateMany({
      where: { id: { in: ids } },
      data: { status: newStatus as NurseryStatus },
    });
  }

  redirect(returnTo);
}

// Applies a status change to every listing matching the admin's current
// filters, not just the 50 on screen — a plain page of checkboxes doesn't
// scale to a bulk import of thousands of rows (98 pages to click through
// by hand otherwise).
export async function bulkUpdateStatusByFilter(filters: AdminListingFilters, formData: FormData) {
  const newStatus = formData.get("newStatus")?.toString();
  const returnTo = formData.get("returnTo")?.toString() || "/admin/listings";

  if (newStatus) {
    await prisma.nursery.updateMany({
      where: buildAdminListingWhere(filters),
      data: { status: newStatus as NurseryStatus },
    });
  }

  redirect(returnTo);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(base, { lower: true }) || "nursery";
  let slug = baseSlug;
  let n = 1;
  while (
    await prisma.nursery.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)?.toString().trim();
  return v || undefined;
}

function socialLinksFromForm(formData: FormData): Record<string, string> | undefined {
  const platforms = ["instagram", "facebook", "x", "youtube", "pinterest"];
  const links: Record<string, string> = {};
  for (const p of platforms) {
    const v = str(formData, `social_${p}`);
    if (v) links[p] = v;
  }
  return Object.keys(links).length > 0 ? links : undefined;
}

interface NurseryFormFields {
  name: string;
  legalName?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  email?: string;
  contactEmail?: string;
  description?: string;
  businessType?: BusinessType;
  licenseNumber?: string;
  licenseStatus?: string;
  licenseExpiresAt?: Date;
  sourceNotes?: string;
  status: NurseryStatus;
  source: DataSource;
  specialtySlugs: string[];
  socialLinks?: Record<string, string>;
}

function readNurseryForm(formData: FormData): NurseryFormFields {
  const lat = str(formData, "latitude");
  const lng = str(formData, "longitude");
  const licenseExpires = str(formData, "licenseExpiresAt");

  return {
    name: str(formData, "name") ?? "",
    legalName: str(formData, "legalName"),
    addressLine1: str(formData, "addressLine1") ?? "",
    addressLine2: str(formData, "addressLine2"),
    city: str(formData, "city") ?? "",
    state: (str(formData, "state") ?? "").toUpperCase(),
    postalCode: str(formData, "postalCode") ?? "",
    latitude: lat ? Number(lat) : 0,
    longitude: lng ? Number(lng) : 0,
    phone: str(formData, "phone"),
    website: str(formData, "website"),
    email: str(formData, "email"),
    contactEmail: str(formData, "contactEmail"),
    description: str(formData, "description"),
    businessType: str(formData, "businessType") as BusinessType | undefined,
    licenseNumber: str(formData, "licenseNumber"),
    licenseStatus: str(formData, "licenseStatus"),
    licenseExpiresAt: licenseExpires ? new Date(licenseExpires) : undefined,
    sourceNotes: str(formData, "sourceNotes"),
    status: (str(formData, "status") as NurseryStatus) ?? "DRAFT",
    source: (str(formData, "source") as DataSource) ?? "ADMIN",
    specialtySlugs: formData.getAll("specialties").map((v) => v.toString()),
    socialLinks: socialLinksFromForm(formData),
  };
}

export async function createListing(formData: FormData) {
  const f = readNurseryForm(formData);
  const slug = await uniqueSlug(`${f.name}-${f.city}-${f.state}`);

  const specialtyRecords = f.specialtySlugs.length
    ? await prisma.specialty.findMany({ where: { slug: { in: f.specialtySlugs } } })
    : [];

  const nursery = await prisma.nursery.create({
    data: {
      slug,
      name: f.name,
      legalName: f.legalName,
      addressLine1: f.addressLine1,
      addressLine2: f.addressLine2,
      city: f.city,
      state: f.state,
      postalCode: f.postalCode,
      latitude: f.latitude,
      longitude: f.longitude,
      phone: f.phone,
      website: f.website,
      email: f.email,
      contactEmail: f.contactEmail,
      description: f.description,
      businessType: f.businessType,
      licenseNumber: f.licenseNumber,
      licenseStatus: f.licenseStatus,
      licenseExpiresAt: f.licenseExpiresAt,
      sourceNotes: f.sourceNotes,
      status: f.status,
      source: f.source,
      socialLinks: f.socialLinks,
      verifiedAt: new Date(),
      specialties: { create: specialtyRecords.map((s) => ({ specialtyId: s.id })) },
    },
  });

  redirect(`/admin/listings/${nursery.id}`);
}

export async function addNurseryPhoto(nurseryId: string, formData: FormData) {
  const url = str(formData, "url");
  if (!url) {
    redirect(`/admin/listings/${nurseryId}`);
  }
  await prisma.nurseryPhoto.create({
    data: { nurseryId, url, altText: str(formData, "altText") ?? null },
  });
  redirect(`/admin/listings/${nurseryId}?saved=1`);
}

export async function deleteNurseryPhoto(nurseryId: string, photoId: string) {
  await prisma.nurseryPhoto.delete({ where: { id: photoId } });
  redirect(`/admin/listings/${nurseryId}?saved=1`);
}

export async function updateListing(nurseryId: string, formData: FormData) {
  const f = readNurseryForm(formData);
  const slug = await uniqueSlug(`${f.name}-${f.city}-${f.state}`, nurseryId);

  const specialtyRecords = f.specialtySlugs.length
    ? await prisma.specialty.findMany({ where: { slug: { in: f.specialtySlugs } } })
    : [];

  await prisma.nursery.update({
    where: { id: nurseryId },
    data: {
      slug,
      name: f.name,
      legalName: f.legalName,
      addressLine1: f.addressLine1,
      addressLine2: f.addressLine2,
      city: f.city,
      state: f.state,
      postalCode: f.postalCode,
      latitude: f.latitude,
      longitude: f.longitude,
      phone: f.phone,
      website: f.website,
      email: f.email,
      contactEmail: f.contactEmail,
      description: f.description,
      businessType: f.businessType,
      licenseNumber: f.licenseNumber,
      licenseStatus: f.licenseStatus,
      licenseExpiresAt: f.licenseExpiresAt,
      sourceNotes: f.sourceNotes,
      status: f.status,
      source: f.source,
      socialLinks: f.socialLinks,
      specialties: { deleteMany: {}, create: specialtyRecords.map((s) => ({ specialtyId: s.id })) },
    },
  });

  redirect(`/admin/listings/${nurseryId}?saved=1`);
}
