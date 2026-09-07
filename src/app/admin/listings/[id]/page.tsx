import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateListing, addNurseryPhoto, deleteNurseryPhoto } from "@/app/admin/listings/actions";
import { AdminNurseryForm } from "@/components/admin/AdminNurseryForm";

function parseParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditListingPage({
  params,
  searchParams,
}: PageProps<"/admin/listings/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  const [nursery, specialties] = await Promise.all([
    prisma.nursery.findUnique({
      where: { id },
      include: {
        specialties: { include: { specialty: true } },
        photos: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!nursery) notFound();

  const socialLinks =
    nursery.socialLinks && typeof nursery.socialLinks === "object" && !Array.isArray(nursery.socialLinks)
      ? (nursery.socialLinks as Record<string, string>)
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit: {nursery.name}</h1>
        <Link href={`/nursery/${nursery.slug}`} target="_blank" className="text-sm text-primary underline">
          View public page →
        </Link>
      </div>
      {parseParam(sp.saved) && (
        <p className="mt-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">Saved.</p>
      )}

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Photos</h2>
        {nursery.photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {nursery.photos.map((photo) => (
              <li key={photo.id} className="overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- external/local photo URL of unknown dimensions */}
                <img src={photo.url} alt={photo.altText ?? ""} className="aspect-video w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-2">
                  <span className="truncate text-xs text-muted" title={photo.url}>
                    {photo.altText || photo.url}
                  </span>
                  <form action={deleteNurseryPhoto.bind(null, nursery.id, photo.id)}>
                    <button type="submit" className="text-xs text-accent hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <form
          action={addNurseryPhoto.bind(null, nursery.id)}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="url"
            name="url"
            required
            placeholder="Photo URL"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="altText"
            placeholder="Alt text (optional)"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm sm:w-56"
          />
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-primary/10"
          >
            Add photo
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <AdminNurseryForm
          action={updateListing.bind(null, nursery.id)}
          specialties={specialties}
          submitLabel="Save changes"
          initial={{
            name: nursery.name,
            legalName: nursery.legalName,
            addressLine1: nursery.addressLine1,
            addressLine2: nursery.addressLine2,
            city: nursery.city,
            state: nursery.state,
            postalCode: nursery.postalCode,
            latitude: nursery.latitude,
            longitude: nursery.longitude,
            phone: nursery.phone,
            website: nursery.website,
            email: nursery.email,
            contactEmail: nursery.contactEmail,
            description: nursery.description,
            businessType: nursery.businessType,
            licenseNumber: nursery.licenseNumber,
            licenseStatus: nursery.licenseStatus,
            licenseExpiresAt: nursery.licenseExpiresAt,
            sourceNotes: nursery.sourceNotes,
            status: nursery.status,
            source: nursery.source,
            socialLinks,
            selectedSpecialtySlugs: nursery.specialties.map((s) => s.specialty.slug),
          }}
        />
      </div>
    </div>
  );
}
