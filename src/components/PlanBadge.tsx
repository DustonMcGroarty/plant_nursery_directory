export function PlanBadge({ planTier }: { planTier: string }) {
  if (planTier === "PREMIUM") {
    return (
      <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
        ★ Premium
      </span>
    );
  }
  if (planTier === "FEATURED") {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary-dark">
        Featured
      </span>
    );
  }
  return null;
}
