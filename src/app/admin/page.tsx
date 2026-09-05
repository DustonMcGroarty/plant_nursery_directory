import { prisma } from "@/lib/prisma";
import {
  approveClaim,
  isAdminAuthed,
  loginAdmin,
  logoutAdmin,
  rejectClaim,
} from "@/app/admin/actions";

export const dynamic = "force-dynamic";

function parseParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminPage({
  searchParams,
}: PageProps<"/admin">) {
  const sp = await searchParams;
  const authed = await isAdminAuthed();

  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-16 sm:px-6">
        <h1 className="text-xl font-bold">Admin Login</h1>
        {parseParam(sp.error) && (
          <p className="mt-2 text-sm text-accent">Incorrect secret.</p>
        )}
        <form action={loginAdmin} className="mt-4 space-y-3">
          <input
            type="password"
            name="secret"
            placeholder="Admin secret"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-dark"
          >
            Log in
          </button>
        </form>
      </div>
    );
  }

  const pendingClaims = await prisma.claimRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { nursery: { select: { name: true, slug: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pending Submissions ({pendingClaims.length})</h1>
        <form action={logoutAdmin}>
          <button type="submit" className="text-sm text-muted underline">
            Log out
          </button>
        </form>
      </div>

      {pendingClaims.length === 0 ? (
        <p className="mt-8 text-muted">No pending submissions. 🎉</p>
      ) : (
        <div className="mt-6 space-y-4">
          {pendingClaims.map((claim) => (
            <div key={claim.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {claim.nursery ? (
                      <>
                        Claim: {claim.nursery.name}{" "}
                        <span className="text-muted">→ {claim.proposedName}</span>
                      </>
                    ) : (
                      <>New submission: {claim.proposedName}</>
                    )}
                  </p>
                  <p className="text-sm text-muted">
                    {claim.proposedAddressLine1}, {claim.proposedCity}, {claim.proposedState}{" "}
                    {claim.proposedPostalCode}
                  </p>
                  {claim.proposedWebsite && (
                    <p className="text-sm text-muted">{claim.proposedWebsite}</p>
                  )}
                  {claim.proposedDescription && (
                    <p className="mt-1 text-sm">{claim.proposedDescription}</p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    Submitted by {claim.requesterName} ({claim.requesterEmail})
                  </p>
                  {claim.note && (
                    <p className="mt-1 text-xs italic text-muted">Note: {claim.note}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <form action={approveClaim.bind(null, claim.id)}>
                    <button
                      type="submit"
                      className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-contrast hover:bg-primary-dark"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={rejectClaim.bind(null, claim.id)}>
                    <button
                      type="submit"
                      className="w-full rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent/10"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
