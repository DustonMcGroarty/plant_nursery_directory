import Link from "next/link";
import { PlanBadge } from "@/components/PlanBadge";
import type { NurserySearchResultItem } from "@/lib/nursery-queries";

export function NurseryCard({ nursery }: { nursery: NurserySearchResultItem }) {
  return (
    <Link
      href={`/nursery/${nursery.slug}`}
      className="block rounded-[20px] bg-surface p-5 shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(10,20,18,0.06),0_20px_48px_rgba(10,20,18,0.1)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-foreground">{nursery.name}</h3>
        <PlanBadge planTier={nursery.planTier} />
      </div>
      <p className="mt-1 text-sm text-muted">
        {nursery.city}, {nursery.state}
        {nursery.distanceMiles !== null && (
          <> · {nursery.distanceMiles.toFixed(1)} mi away</>
        )}
      </p>
      {nursery.specialtyNames.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {nursery.specialtyNames.slice(0, 3).map((name) => (
            <span
              key={name}
              className="rounded-[7px] bg-primary/10 px-2.5 py-1 text-[11.5px] font-semibold text-primary-dark"
            >
              {name}
            </span>
          ))}
        </p>
      )}
    </Link>
  );
}
