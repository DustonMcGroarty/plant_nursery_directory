"use server";

import { redirect } from "next/navigation";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { parseImportCsv, type ParsedCsvRow } from "@/lib/csv-import";
import type { BusinessType, NurseryStatus } from "@/generated/prisma/client";

export interface PreviewState {
  rawText?: string;
  rows?: ParsedCsvRow[];
  validCount?: number;
  errorCount?: number;
  error?: string;
}

export async function previewImport(
  _prevState: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file first." };
  }

  const rawText = await file.text();
  let rows: ParsedCsvRow[];
  try {
    rows = parseImportCsv(rawText);
  } catch (e) {
    return { error: `Couldn't parse that file as CSV: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (rows.length === 0) {
    return { error: "That file has no data rows." };
  }

  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  return { rawText, rows, validCount: rows.length - errorCount, errorCount };
}

async function uniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base, { lower: true }) || "nursery";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.nursery.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

async function resolveSpecialtyIds(specialtiesRaw: string | undefined): Promise<string[]> {
  if (!specialtiesRaw?.trim()) return [];
  const names = specialtiesRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (names.length === 0) return [];

  const all = await prisma.specialty.findMany();
  const matched = all.filter(
    (s) => names.includes(s.slug.toLowerCase()) || names.includes(s.name.toLowerCase()),
  );
  return matched.map((s) => s.id);
}

export async function commitImport(formData: FormData) {
  const rawText = formData.get("rawText")?.toString();
  if (!rawText) redirect("/admin/import");

  const rows = parseImportCsv(rawText!);
  const validRows = rows.filter((r) => r.errors.length === 0);

  const today = new Date().toISOString().slice(0, 10);
  let created = 0;
  let updated = 0;

  for (const row of validRows) {
    const r = row.raw;
    const state = r.state.trim().toUpperCase();
    const specialtyIds = await resolveSpecialtyIds(r.specialties);

    const existing = await prisma.nursery.findFirst({
      where: {
        name: { equals: r.name.trim(), mode: "insensitive" },
        city: { equals: r.city.trim(), mode: "insensitive" },
        state,
      },
    });

    const licenseExpiresAt = r.license_expiration ? new Date(r.license_expiration) : undefined;
    const businessTypeRaw = r.business_type?.trim().toUpperCase();
    const businessType = businessTypeRaw ? (businessTypeRaw as BusinessType) : undefined;

    if (existing) {
      await prisma.nursery.update({
        where: { id: existing.id },
        data: {
          legalName: existing.legalName || r.name.trim() || undefined,
          phone: existing.phone || r.phone || undefined,
          website: existing.website || r.website || undefined,
          email: existing.email || r.email || undefined,
          description: existing.description || r.description || undefined,
          businessType: existing.businessType ?? businessType,
          licenseNumber: r.license_number || existing.licenseNumber || undefined,
          licenseStatus: r.license_status || existing.licenseStatus || undefined,
          licenseExpiresAt: licenseExpiresAt ?? existing.licenseExpiresAt ?? undefined,
          sourceNotes: r.source_notes || existing.sourceNotes || `Bulk import ${today}`,
          latitude:
            existing.latitude === 0 && r.latitude ? Number(r.latitude) : existing.latitude,
          longitude:
            existing.longitude === 0 && r.longitude ? Number(r.longitude) : existing.longitude,
          // Deliberately don't touch `status` on an existing record - don't
          // let a bulk refresh silently re-publish something an admin
          // rejected or unpublished, unless this row explicitly says to.
          status: r.status ? (r.status.trim().toUpperCase() as NurseryStatus) : undefined,
          specialties: specialtyIds.length
            ? { deleteMany: {}, create: specialtyIds.map((id) => ({ specialtyId: id })) }
            : undefined,
        },
      });
      updated++;
    } else {
      const slug = await uniqueSlug(`${r.name}-${r.city}-${state}`);
      await prisma.nursery.create({
        data: {
          slug,
          name: r.name.trim(),
          addressLine1: r.address_line1.trim(),
          addressLine2: r.address_line2 || undefined,
          city: r.city.trim(),
          state,
          postalCode: r.postal_code.trim(),
          latitude: r.latitude ? Number(r.latitude) : 0,
          longitude: r.longitude ? Number(r.longitude) : 0,
          phone: r.phone || undefined,
          website: r.website || undefined,
          email: r.email || undefined,
          description: r.description || undefined,
          businessType,
          licenseNumber: r.license_number || undefined,
          licenseStatus: r.license_status || undefined,
          licenseExpiresAt,
          sourceNotes: r.source_notes || `Bulk import ${today}`,
          status: (r.status?.trim().toUpperCase() as NurseryStatus) || "PUBLISHED",
          source: "BULK_IMPORT",
          specialties: { create: specialtyIds.map((id) => ({ specialtyId: id })) },
        },
      });
      created++;
    }
  }

  redirect(`/admin/listings?imported=1&created=${created}&updated=${updated}`);
}
