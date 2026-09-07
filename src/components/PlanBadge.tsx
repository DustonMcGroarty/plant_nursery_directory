export function PlanBadge({ planTier }: { planTier: string }) {
  if (planTier === "PREMIUM") {
    return (
      <span className="inline-flex items-center rounded-[7px] bg-accent/15 px-2.5 py-1 text-[11.5px] font-semibold text-accent">
        ★ Premium
      </span>
    );
  }
  if (planTier === "FEATURED") {
    return (
      <span className="inline-flex items-center rounded-[7px] bg-primary-dark px-2.5 py-1 text-[11.5px] font-semibold text-white">
        Featured
      </span>
    );
  }
  return null;
}
