const STYLES: Record<string, string> = {
  DRAFT: "bg-muted/15 text-muted",
  PENDING: "bg-accent/15 text-accent",
  PUBLISHED: "bg-primary/15 text-primary-dark",
  REJECTED: "bg-red-500/15 text-red-600",
  UNPUBLISHED: "bg-muted/15 text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-muted/15 text-muted"
      }`}
    >
      {status}
    </span>
  );
}
