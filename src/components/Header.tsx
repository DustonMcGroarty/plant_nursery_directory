import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary-dark">
          <span aria-hidden="true">🌱</span>
          Root &amp; Bloom
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/search" className="hover:text-primary">
            Browse Nurseries
          </Link>
          <Link href="/submit" className="hover:text-primary">
            Add a Nursery
          </Link>
        </nav>
      </div>
    </header>
  );
}
