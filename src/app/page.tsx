import Link from "next/link";
import {
  getAllSpecialties,
  getDirectoryStats,
  getFeaturedNurseries,
} from "@/lib/nursery-queries";
import { PlanBadge } from "@/components/PlanBadge";
import { SearchForm } from "@/components/SearchForm";

export const revalidate = 3600;

export default async function Home() {
  const [stats, featured, specialties] = await Promise.all([
    getDirectoryStats(),
    getFeaturedNurseries(6),
    getAllSpecialties(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-border bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your next favorite plant nursery
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Search {stats.nurseryCount.toLocaleString()} nurseries and garden
            centers across {stats.stateCount} states.
          </p>
          <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-border bg-surface p-4 text-left">
            <SearchForm
              specialties={specialties}
              initial={{ q: "", state: "", specialties: [], radius: 50 }}
            />
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-semibold">Featured Nurseries</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((n) => (
              <Link
                key={n.id}
                href={`/nursery/${n.slug}`}
                className="block rounded-lg border border-border bg-surface p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{n.name}</h3>
                  <PlanBadge planTier={n.planTier} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {n.city}, {n.state}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-lg font-semibold">Own a plant nursery?</h2>
          <p className="mt-1 text-muted">
            Claim your free listing or add your nursery to the directory.
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-dark"
          >
            Add a Nursery
          </Link>
        </div>
      </section>
    </div>
  );
}
