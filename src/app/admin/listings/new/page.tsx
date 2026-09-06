import { prisma } from "@/lib/prisma";
import { createListing } from "@/app/admin/listings/actions";
import { AdminNurseryForm } from "@/components/admin/AdminNurseryForm";

export default async function NewListingPage() {
  const specialties = await prisma.specialty.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Add Listing</h1>
      <p className="mt-1 text-sm text-muted">
        Added listings publish immediately by default — you&apos;re a trusted source, not a
        public submitter.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <AdminNurseryForm action={createListing} specialties={specialties} submitLabel="Create listing" />
      </div>
    </div>
  );
}
