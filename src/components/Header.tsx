import Link from "next/link";

export function Header() {
  return (
    <header className="bg-primary-dark">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
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
          <span className="text-[17px] font-bold tracking-tight text-white">
            Find Plant Nurseries
          </span>
        </Link>
        <nav className="flex items-center gap-8 text-sm font-medium text-[#a9c9c0]">
          <Link href="/search" className="hover:text-white">
            Browse Nurseries
          </Link>
          <Link
            href="/submit"
            className="rounded-lg bg-white px-[18px] py-2 font-bold text-primary-dark hover:bg-white/90"
          >
            Add a Nursery
          </Link>
        </nav>
      </div>
    </header>
  );
}
