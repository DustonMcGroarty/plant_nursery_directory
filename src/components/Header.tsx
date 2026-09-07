import Link from "next/link";

export function Header() {
  return (
    <header className="bg-primary-dark">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white"
          >
            <svg width="19" height="19" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="logoGradHeader" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="#86e6b0" />
                </linearGradient>
              </defs>
              <path
                d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Z"
                fill="url(#logoGradHeader)"
              />
              <path
                d="M9 10.5c0-2 1.6-3.5 4.5-3.5-.2 2-1.7 3.5-4.5 3.5Z"
                fill="#ffffff"
                opacity="0.9"
              />
            </svg>
          </span>
          <span className="truncate text-[15px] font-bold tracking-tight text-white sm:text-[17px]">
            Find Plant Nurseries
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-4 text-sm font-medium text-[#a9c9c0] sm:gap-8">
          <Link href="/search" className="hidden hover:text-white sm:inline">
            Browse Nurseries
          </Link>
          <Link
            href="/submit"
            className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-primary-dark hover:bg-white/90 sm:px-[18px] sm:py-2 sm:text-sm"
          >
            Add a Nursery
          </Link>
        </nav>
      </div>
    </header>
  );
}
