import type { Metadata } from "next";
import { searchNurseries } from "@/lib/nursery-queries";
import { getAllSpecialties } from "@/lib/nursery-queries";
import { SearchForm } from "@/components/SearchForm";
import { NurseryCard } from "@/components/NurseryCard";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Browse Plant Nurseries",
  description: "Search plant nurseries and garden centers by location and specialty.",
};

function parseParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseListParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function SearchPage({
  searchParams,
}: PageProps<"/search">) {
  const sp = await searchParams;
  const q = parseParam(sp.q) ?? "";
  const state = parseParam(sp.state) ?? "";
  const specialties = parseListParam(sp.specialty);
  const lat = parseParam(sp.lat);
  const lng = parseParam(sp.lng);
  const radius = Number(parseParam(sp.radius) ?? 50);
  const page = Number(parseParam(sp.page) ?? 1);

  const near =
    lat && lng
      ? { lat: Number(lat), lng: Number(lng), radiusMiles: radius }
      : undefined;

  const [{ items, total, pageSize }, allSpecialties] = await Promise.all([
    searchNurseries({ q, state, specialties, near, page }),
    getAllSpecialties(),
  ]);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    for (const s of specialties) params.append("specialty", s);
    if (near) {
      params.set("lat", String(near.lat));
      params.set("lng", String(near.lng));
      params.set("radius", String(near.radiusMiles));
    }
    params.set("page", String(targetPage));
    return `/search?${params.toString()}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Browse Plant Nurseries</h1>
      <p className="mt-1 text-muted">
        {total} {total === 1 ? "nursery" : "nurseries"} found
      </p>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <SearchForm
          specialties={allSpecialties}
          initial={{
            q,
            state,
            specialties,
            lat: near?.lat,
            lng: near?.lng,
            radius,
          }}
        />
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-center text-muted">
          No nurseries match your search yet. Try broadening your filters, or{" "}
          <a href="/submit" className="text-primary underline">
            add the one you&apos;re looking for
          </a>
          .
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n) => (
            <NurseryCard key={n.id} nursery={n} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} buildHref={buildHref} />
    </div>
  );
}
