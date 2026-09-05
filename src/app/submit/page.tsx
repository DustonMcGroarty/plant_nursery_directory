import type { Metadata } from "next";
import { getAllSpecialties, getNurseryBySlug } from "@/lib/nursery-queries";
import { SubmitForm } from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Add or Claim a Nursery",
  description: "Submit a new plant nursery or claim your existing listing.",
};

function parseParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SubmitPage({
  searchParams,
}: PageProps<"/submit">) {
  const sp = await searchParams;
  const claimSlug = parseParam(sp.claim);

  const [specialties, claimingNursery] = await Promise.all([
    getAllSpecialties(),
    claimSlug ? getNurseryBySlug(claimSlug) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">
        {claimingNursery ? `Claim ${claimingNursery.name}` : "Add a Nursery"}
      </h1>
      <p className="mt-1 text-muted">
        {claimingNursery
          ? "Confirm or correct the details below. We'll review your claim before it goes live."
          : "Know a nursery that's not in the directory yet? Add it below."}
      </p>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 sm:p-6">
        <SubmitForm specialties={specialties} claimingNursery={claimingNursery} />
      </div>
    </div>
  );
}
