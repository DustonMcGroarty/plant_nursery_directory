import Link from "next/link";
import { PlanBadge } from "@/components/PlanBadge";
import type { NurserySearchResultItem } from "@/lib/nursery-queries";

export function NurseryCard({ nursery }: { nursery: NurserySearchResultItem }) {
  return (
    <Link
      href={`/nursery/${nursery.slug}`}
      className="block rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{nursery.name}</h3>
        <PlanBadge planTier={nursery.planTier} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {nursery.city}, {nursery.state}
        {nursery.distanceMiles !== null && (
          <> · {nursery.distanceMiles.toFixed(1)} mi away</>
        )}
      </p>
      {nursery.specialtyNames.length > 0 && (
        <p className="mt-2 flex flex-wrap gap-1">
          {nursery.specialtyNames.slice(0, 3).map((name) => (
            <span
              key={name}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary-dark"
            >
              {name}
            </span>
          ))}
        </p>
      )}
    </Link>
  );
}
