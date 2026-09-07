import Link from "next/link";
import {
  getAllSpecialties,
  getDirectoryStats,
  getFeaturedNurseries,
} from "@/lib/nursery-queries";
import { SearchForm } from "@/components/SearchForm";

export const revalidate = 3600;

const PLAN_LABEL: Record<string, string> = {
  PREMIUM: "Premium",
  FEATURED: "Featured",
  FREE: "Free",
};

export default async function Home() {
  const [stats, featured, specialties] = await Promise.all([
    getDirectoryStats(),
    getFeaturedNurseries(6),
    getAllSpecialties(),
  ]);

  const spotlight = featured[0];

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero: split */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid items-center gap-11 lg:grid-cols-[minmax(0,1fr)_440px]">
          {/* Left */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11.5px] font-semibold tracking-wide text-muted uppercase">
                Nationwide plant nursery directory
              </span>
            </div>

            <h1 className="text-[42px] leading-[1.08] font-extrabold tracking-tight text-foreground sm:text-[50px]">
              Find your next
              <br />
              favorite plant nursery
            </h1>
            <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
              Search {stats.nurseryCount.toLocaleString()} nurseries and
              garden centers across {stats.stateCount} states — from
              native-plant specialists to full-service wholesale growers.
            </p>

            <div className="mt-7 rounded-[20px] bg-surface p-5 shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)]">
              <SearchForm
                specialties={specialties}
                initial={{ q: "", state: "", specialties: [], radius: 50 }}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-6 rounded-[20px] bg-surface px-6 py-5 shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)]">
              <div>
                <div className="text-[26px] font-extrabold tracking-tight text-foreground">
                  {stats.nurseryCount.toLocaleString()}
                </div>
                <div className="mt-0.5 text-[12.5px] font-medium text-muted">
                  Nurseries listed
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2.5">
                <span className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-primary/10">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M2.5 12h19M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
                  </svg>
                </span>
                <div>
                  <div className="text-[15.5px] font-bold text-foreground">
                    {stats.stateCount}
                  </div>
                  <div className="text-[11.5px] font-medium text-muted">
                    States
                  </div>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2.5">
                <span className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-primary/10">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <div className="text-[15.5px] font-bold text-foreground">
                    Free
                  </div>
                  <div className="text-[11.5px] font-medium text-muted">
                    To list
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: gradient hero device */}
          <div className="relative hidden h-[500px] overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark via-primary to-[#86e6b0] lg:block">
            <svg
              className="absolute -top-12 -right-12 opacity-[0.18]"
              width="260"
              height="260"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.6"
            >
              <path d="M12 21c0-5 3-8 8-8 0 5-3 8-8 8Z" />
              <path d="M12 21c0-6-3.5-10-8-10 0 5.5 3 10 8 10Z" />
            </svg>

            <div className="absolute top-7 right-7 left-7">
              <div className="text-[22px] leading-tight font-bold tracking-tight text-white">
                Every nursery.
                <br />
                One map.
              </div>
            </div>

            {spotlight && (
              <div className="absolute right-7 bottom-7 left-7 rounded-[20px] bg-white p-5 shadow-[0_24px_56px_rgba(0,0,0,0.3)]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="text-[15.5px] font-bold text-foreground">
                    {spotlight.name}
                  </div>
                  <div className="rounded-[7px] bg-primary-dark px-2.5 py-1 text-[10.5px] font-semibold text-white">
                    {PLAN_LABEL[spotlight.planTier] ?? spotlight.planTier}
                  </div>
                </div>
                <div className="mb-3.5 text-[12.5px] text-muted">
                  {spotlight.city}, {spotlight.state}
                  {spotlight.specialties.length > 0 && (
                    <> · {spotlight.specialties.slice(0, 2).map((s) => s.specialty.name).join(", ")}</>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-0 border-t border-border pt-3.5">
                  <div>
                    <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                      Status
                    </div>
                    <div className="mt-0.5 text-[13.5px] font-bold text-foreground">
                      {spotlight.ownerId ? "Claimed" : "Unclaimed"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                      Plan
                    </div>
                    <div className="mt-0.5 text-[13.5px] font-bold text-primary">
                      {PLAN_LABEL[spotlight.planTier] ?? spotlight.planTier}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                      View
                    </div>
                    <Link
                      href={`/nursery/${spotlight.slug}`}
                      className="mt-0.5 block text-[13.5px] font-bold text-foreground underline-offset-2 hover:underline"
                    >
                      Listing →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Nurseries: dense table */}
      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
          <div className="mb-4.5 flex items-baseline justify-between">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              Featured Nurseries
            </h2>
            <Link
              href="/search"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              View all {stats.nurseryCount.toLocaleString()} →
            </Link>
          </div>

          <div className="overflow-hidden rounded-[20px] bg-surface shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)]">
            <div className="hidden grid-cols-[2.4fr_1.4fr_2fr_1fr_1fr] bg-[#f7f9f7] px-5.5 py-3.5 sm:grid">
              <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Nursery
              </div>
              <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Location
              </div>
              <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Specialties
              </div>
              <div className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Status
              </div>
              <div className="text-right text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Plan
              </div>
            </div>

            {featured.map((n, i) => (
              <Link
                key={n.id}
                href={`/nursery/${n.slug}`}
                className={`grid grid-cols-1 gap-1.5 border-t border-border px-5.5 py-4 transition-colors hover:bg-[#f0f4f2] sm:grid-cols-[2.4fr_1.4fr_2fr_1fr_1fr] sm:items-center sm:gap-0 ${
                  i % 2 === 1 ? "bg-[#fbfcfb]" : "bg-surface"
                }`}
              >
                <div className="text-[14px] font-bold text-foreground">
                  {n.name}
                </div>
                <div className="text-[13.5px] text-muted">
                  {n.city}, {n.state}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {n.specialties.slice(0, 2).map(({ specialty }) => (
                    <span
                      key={specialty.id}
                      className="rounded-[7px] bg-primary/10 px-2.5 py-1 text-[11.5px] font-semibold text-primary-dark"
                    >
                      {specialty.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${n.ownerId ? "bg-primary" : "bg-[#c7cbc8]"}`}
                  />
                  <span
                    className={`text-[13px] font-semibold ${n.ownerId ? "text-foreground" : "text-muted"}`}
                  >
                    {n.ownerId ? "Claimed" : "Unclaimed"}
                  </span>
                </div>
                <div className="text-right text-[12.5px] font-bold text-accent sm:text-accent">
                  {PLAN_LABEL[n.planTier] ?? n.planTier}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start gap-5 rounded-[20px] bg-primary-dark px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[22px] font-bold tracking-tight text-white">
              Own a plant nursery?
            </div>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#a9c9c0]">
              Claim your free listing or add your nursery to the directory in
              a few minutes.
            </p>
          </div>
          <Link
            href="/submit"
            className="shrink-0 rounded-[10px] bg-white px-6 py-3 text-sm font-bold whitespace-nowrap text-primary-dark hover:bg-white/90"
          >
            Add Your Nursery
          </Link>
        </div>
      </section>
    </div>
  );
}
