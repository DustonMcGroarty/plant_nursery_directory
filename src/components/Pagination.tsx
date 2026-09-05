interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, pageSize, total, buildHref }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <a href={buildHref(page - 1)} className="text-primary hover:underline">
          ← Previous
        </a>
      ) : (
        <span className="text-muted">← Previous</span>
      )}
      <span className="text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <a href={buildHref(page + 1)} className="text-primary hover:underline">
          Next →
        </a>
      ) : (
        <span className="text-muted">Next →</span>
      )}
    </nav>
  );
}
