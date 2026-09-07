export function isThinListing(nursery: {
  phone: string | null;
  website: string | null;
  addressLine1: string;
}): boolean {
  return !nursery.phone && !nursery.website && !nursery.addressLine1;
}

export function LimitedInfoBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-muted/15 px-2 py-0.5 text-xs font-medium text-muted">
      Limited info available
    </span>
  );
}
