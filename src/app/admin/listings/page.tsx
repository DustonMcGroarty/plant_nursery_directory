import Link from "next/link";
import { listNurseriesForAdmin, getStatusCounts } from "@/app/admin/listings/queries";
import { bulkUpdateStatus, bulkUpdateStatusByFilter } from "@/app/admin/listings/actions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SelectAllCheckbox } from "@/components/admin/SelectAllCheckbox";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { US_STATES } from "@/lib/us-states";
import { NurseryStatus, DataSource } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function parseParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({
  searchParams,
}: PageProps<"/admin/listings">) {
  const sp = await searchParams;
  const status = parseParam(sp.status) ?? "";
  const state = parseParam(sp.state) ?? "";
  const source = parseParam(sp.source) ?? "";
  const q = parseParam(sp.q) ?? "";
  const page = Number(parseParam(sp.page) ?? 1);
  const imported = parseParam(sp.imported);
  const importedCreated = parseParam(sp.created);
  const importedUpdated = parseParam(sp.updated);

  const [{ items, total, pageSize }, statusCounts] = await Promise.all([
    listNurseriesForAdmin({ status, state, source, q, page }),
    getStatusCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildHref(params: Record<string, string | number>) {
    const merged = { status, state, source, q, page: 1, ...params };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v) usp.set(k, String(v));
    }
    return `/admin/listings?${usp.toString()}`;
  }

  const currentQueryString = buildHref({ page }).split("?")[1];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {imported && (
        <p className="mb-4 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary-dark">
          Import complete: {importedCreated} created, {importedUpdated} updated.
        </p>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Listings ({total})</h1>
        <Link
          href="/admin/listings/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-dark"
        >
          + Add Listing
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {Object.entries(statusCounts).map(([s, count]) => (
          <Link
            key={s}
            href={buildHref({ status: s })}
            className={`rounded-full border px-3 py-1 ${
              status === s ? "border-primary bg-primary/10 text-primary-dark" : "border-border text-muted"
            }`}
          >
            {s} ({count})
          </Link>
        ))}
        {status && (
          <Link href={buildHref({ status: "" })} className="text-muted underline">
            Clear
          </Link>
        )}
      </div>

      <form method="get" className="mt-4 flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-4">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search name/city"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          name="state"
          defaultValue={state}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          name="source"
          defaultValue={source}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All sources</option>
          {Object.values(DataSource).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input type="hidden" name="status" value={status} />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-dark"
        >
          Filter
        </button>
      </form>

      <form action={bulkUpdateStatus} className="mt-4">
        <input type="hidden" name="returnTo" value={`/admin/listings?${currentQueryString}`} />
        <div className="flex items-center gap-3 rounded-t-lg border border-b-0 border-border bg-surface px-4 py-3 text-sm">
          <SelectAllCheckbox name="ids" />
          <span className="text-muted">Select all</span>
          <select
            name="newStatus"
            defaultValue=""
            className="rounded-md border border-border bg-background px-2 py-1"
          >
            <option value="" disabled>
              Change status to…
            </option>
            {Object.values(NurseryStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 hover:bg-primary/10"
          >
            Apply to selected
          </button>
          <ConfirmSubmitButton
            type="submit"
            formAction={bulkUpdateStatusByFilter.bind(null, { status, state, source, q })}
            confirmMessage={`This will change the status of all ${total.toLocaleString()} listing${total === 1 ? "" : "s"} matching your current filters — not just this page. This can't be undone in bulk. Continue?`}
            className="ml-auto rounded-md border border-accent/40 px-3 py-1.5 text-accent hover:bg-accent/10"
          >
            Apply to all {total.toLocaleString()} matching filters
          </ConfirmSubmitButton>
        </div>

        <div className="overflow-x-auto rounded-b-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="w-8 px-3 py-2"></th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <input type="checkbox" name="ids" value={n.id} />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/listings/${n.id}`} className="font-medium hover:text-primary">
                      {n.name}
                    </Link>
                    {n.ownerId && <span className="ml-2 text-xs text-primary-dark">Claimed</span>}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {n.city}, {n.state}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={n.status} />
                  </td>
                  <td className="px-3 py-2 text-muted">{n.source}</td>
                  <td className="px-3 py-2 text-muted">{n.planTier}</td>
                  <td className="px-3 py-2 text-muted">
                    {n.updatedAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
                    No listings match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </form>

      {totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={buildHref({ page: page - 1 })} className="text-primary hover:underline">
              ← Previous
            </Link>
          ) : (
            <span className="text-muted">← Previous</span>
          )}
          <span className="text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildHref({ page: page + 1 })} className="text-primary hover:underline">
              Next →
            </Link>
          ) : (
            <span className="text-muted">Next →</span>
          )}
        </nav>
      )}
    </div>
  );
}
