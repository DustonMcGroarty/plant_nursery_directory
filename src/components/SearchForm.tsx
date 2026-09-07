"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { US_STATES } from "@/lib/us-states";

interface SearchFormProps {
  specialties: { slug: string; name: string }[];
  initial: {
    q: string;
    state: string;
    specialties: string[];
    lat?: number;
    lng?: number;
    radius: number;
  };
}

export function SearchForm({ specialties, initial }: SearchFormProps) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q);
  const [state, setState] = useState(initial.state);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    initial.specialties,
  );
  const [radius, setRadius] = useState(initial.radius);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial.lat !== undefined && initial.lng !== undefined
      ? { lat: initial.lat, lng: initial.lng }
      : null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function toggleSpecialty(slug: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation isn't available in this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location. Check browser permissions.");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    for (const s of selectedSpecialties) params.append("specialty", s);
    if (coords) {
      params.set("lat", coords.lat.toString());
      params.set("lng", coords.lng.toString());
      params.set("radius", radius.toString());
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nursery name, city, or keyword"
          className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm sm:w-48"
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-contrast hover:opacity-90"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-xl border border-border px-3.5 py-2 font-medium hover:bg-primary/10"
        >
          {locating ? "Locating…" : coords ? "📍 Location set" : "📍 Use my location"}
        </button>
        {coords && (
          <>
            <label className="flex items-center gap-2 text-muted">
              within
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="rounded-lg border border-border bg-surface px-2 py-1"
              >
                {[10, 25, 50, 100, 250].map((r) => (
                  <option key={r} value={r}>
                    {r} mi
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setCoords(null)}
              className="text-muted underline hover:text-primary"
            >
              Clear
            </button>
          </>
        )}
        {locationError && <span className="text-accent">{locationError}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {specialties.map((s) => {
          const active = selectedSpecialties.includes(s.slug);
          return (
            <button
              type="button"
              key={s.slug}
              onClick={() => toggleSpecialty(s.slug)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                active
                  ? "border-primary bg-primary text-primary-contrast"
                  : "border-border bg-surface text-muted hover:border-primary"
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>
    </form>
  );
}
