import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getNurseryBySlug } from "@/lib/nursery-queries";
import { PlanBadge } from "@/components/PlanBadge";
import { LimitedInfoBadge, isThinListing } from "@/components/LimitedInfoBadge";
import { stateName } from "@/lib/us-states";

export const revalidate = 3600;

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  WHOLESALE: "Wholesale",
  RETAIL: "Retail",
  ONLINE_ONLY: "Online only",
  BROKER: "Broker",
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABEL: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

function formatTime(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const minute = m[2];
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

function formatHoursRange(raw: string): string {
  const [start, end] = raw.split("-").map((s) => s.trim());
  if (!start || !end) return raw;
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatHours(hours: Record<string, string>): string {
  return DAY_KEYS.filter((k) => hours[k])
    .map((k) => `${DAY_LABEL[k]} ${formatHoursRange(hours[k])}`)
    .join(" · ");
}

function getLicenseInfo(
  expiresAt: Date | null,
  status: string | null,
): { warning: string | null; normal: string | null } {
  if (expiresAt) {
    const daysUntil = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000);
    if (daysUntil < 0) {
      return { warning: `Expired ${expiresAt.toLocaleDateString()}`, normal: null };
    }
    if (daysUntil <= 30) {
      return {
        warning: `Expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
        normal: null,
      };
    }
    return { warning: null, normal: `Active — expires ${expiresAt.toLocaleDateString()}` };
  }
  return { warning: null, normal: status };
}

export async function generateMetadata({
  params,
}: PageProps<"/nursery/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const nursery = await getNurseryBySlug(slug);
  if (!nursery) return {};
  return {
    title: `${nursery.name} — ${nursery.city}, ${nursery.state}`,
    description:
      nursery.description ??
      `${nursery.name} is a plant nursery in ${nursery.city}, ${nursery.state}.`,
  };
}

export default async function NurseryPage({
  params,
}: PageProps<"/nursery/[slug]">) {
  const { slug } = await params;
  const nursery = await getNurseryBySlug(slug);

  if (!nursery || nursery.status !== "PUBLISHED") {
    notFound();
  }

  const fullAddress = [
    nursery.addressLine1,
    nursery.addressLine2,
    nursery.city,
    `${nursery.state} ${nursery.postalCode}`.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    fullAddress,
  )}`;

  const socialLinks =
    nursery.socialLinks && typeof nursery.socialLinks === "object" && !Array.isArray(nursery.socialLinks)
      ? Object.values(nursery.socialLinks as Record<string, string>)
      : [];

  const hoursRecord =
    nursery.hours && typeof nursery.hours === "object" && !Array.isArray(nursery.hours)
      ? (nursery.hours as Record<string, string>)
      : null;
  const todayKey = DAY_KEYS[new Date().getDay()];
  const todaysHours = hoursRecord?.[todayKey];

  const { warning: licenseWarning, normal: licenseNormal } = getLicenseInfo(
    nursery.licenseExpiresAt,
    nursery.licenseStatus,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GardenStore",
    name: nursery.name,
    description: nursery.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: nursery.addressLine1 || undefined,
      addressLocality: nursery.city,
      addressRegion: nursery.state,
      postalCode: nursery.postalCode || undefined,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: nursery.latitude,
      longitude: nursery.longitude,
    },
    telephone: nursery.phone ?? undefined,
    url: nursery.website ?? undefined,
    sameAs: socialLinks.length > 0 ? socialLinks : undefined,
  };

  const detailRows: { label: string; value: ReactNode; wide?: boolean }[] = [
    {
      label: "Address",
      value: (
        <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {fullAddress}
        </a>
      ),
      wide: true,
    },
  ];
  if (nursery.phone) {
    detailRows.push({
      label: "Phone",
      value: <a href={`tel:${nursery.phone}`} className="hover:underline">{nursery.phone}</a>,
    });
  }
  if (nursery.email) {
    detailRows.push({
      label: "Email",
      value: <a href={`mailto:${nursery.email}`} className="hover:underline">{nursery.email}</a>,
    });
  }
  if (nursery.businessType) {
    detailRows.push({
      label: "Business Type",
      value: BUSINESS_TYPE_LABEL[nursery.businessType] ?? nursery.businessType,
    });
  }
  if (hoursRecord) {
    detailRows.push({ label: "Hours", value: formatHours(hoursRecord), wide: true });
  }
  if (licenseWarning || licenseNormal) {
    detailRows.push({
      label: "Nursery License",
      value: licenseWarning ? (
        <span className="flex items-center gap-1.5 text-[#c0293a]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c0293a]" />
          {licenseWarning}
        </span>
      ) : (
        licenseNormal
      ),
      wide: true,
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
        <Link href="/search" className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted hover:text-foreground">
          ← Back to search results
        </Link>
      </div>

      {/* Gradient hero */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-primary-dark via-primary to-[#86e6b0] px-6 py-8 sm:px-10">
          <svg
            className="absolute -top-10 -right-8 opacity-[0.16]"
            width="220"
            height="220"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.6"
          >
            <path d="M12 21c0-5 3-8 8-8 0 5-3 8-8 8Z" />
            <path d="M12 21c0-6-3.5-10-8-10 0 5.5 3 10 8 10Z" />
          </svg>

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight text-white sm:text-[30px]">
                {nursery.name}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#d7f5ec]">
                {nursery.city}, {stateName(nursery.state)}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {nursery.ownerId ? (
                  <span className="flex items-center gap-1.5 rounded-[7px] bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
                    ✓ Claimed
                  </span>
                ) : (
                  isThinListing(nursery) && <LimitedInfoBadge />
                )}
                <PlanBadge planTier={nursery.planTier} />
              </div>
            </div>

            {todaysHours ? (
              <div className="rounded-[14px] bg-primary-dark/50 px-5 py-4 sm:min-w-[190px]">
                <div className="text-[10.5px] font-semibold tracking-wide text-[#bfe9dd] uppercase">
                  Hours Today
                </div>
                <div className="mt-1.5 text-lg font-bold text-white">
                  {formatHoursRange(todaysHours)}
                </div>
              </div>
            ) : nursery.phone ? (
              <div className="rounded-[14px] bg-primary-dark/50 px-5 py-4 sm:min-w-[190px]">
                <div className="text-[10.5px] font-semibold tracking-wide text-[#bfe9dd] uppercase">
                  Call
                </div>
                <a
                  href={`tel:${nursery.phone}`}
                  className="mt-1.5 block text-lg font-bold text-white hover:underline"
                >
                  {nursery.phone}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="flex flex-col gap-5">
          {nursery.description && (
            <p className="text-[14.5px] leading-relaxed text-foreground/80">
              {nursery.description}
            </p>
          )}

          {nursery.specialties.length > 0 && (
            <div>
              <div className="mb-2.5 text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                Specialties
              </div>
              <div className="flex flex-wrap gap-2">
                {nursery.specialties.map(({ specialty }) => (
                  <span
                    key={specialty.id}
                    className="rounded-[8px] bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-primary-dark"
                  >
                    {specialty.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[20px] bg-surface p-5.5 shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)] sm:p-6">
            <div className="mb-4 text-[10.5px] font-semibold tracking-wide text-muted uppercase">
              Details
            </div>
            <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-3">
              {detailRows.map((row) => (
                <div key={row.label} className={row.wide ? "sm:col-span-2" : undefined}>
                  <div className="mb-1 text-[11px] font-medium text-muted">
                    {row.label}
                  </div>
                  <div className="text-sm font-bold text-foreground">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {(nursery.website || socialLinks.length > 0) && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {nursery.website && (
                <a
                  href={nursery.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  Visit website ↗
                </a>
              )}
              {socialLinks.map((url) => {
                let label = url;
                try {
                  label = new URL(url).hostname.replace(/^www\./, "");
                } catch {
                  // Not a full URL (e.g. admin typed a bare handle) - fall
                  // back to showing the raw value instead of crashing.
                }
                return (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: action rail */}
        <div className="flex flex-col gap-3.5">
          <div className="rounded-[20px] bg-primary-dark p-1.5">
            {!nursery.ownerId && (
              <Link
                href={`/submit?claim=${nursery.slug}`}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 hover:bg-white/10"
              >
                <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="text-[13.5px] font-semibold text-white">Claim this listing</span>
              </Link>
            )}
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3.5 py-3 hover:bg-white/10"
            >
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a9c9c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <span className="text-[13.5px] font-semibold text-[#d3e6e1]">Get directions</span>
            </a>
            {nursery.website && (
              <a
                href={nursery.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 hover:bg-white/10"
              >
                <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a9c9c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M2.5 12h19M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
                  </svg>
                </span>
                <span className="text-[13.5px] font-semibold text-[#d3e6e1]">Visit website</span>
              </a>
            )}
          </div>

          <div className="rounded-2xl bg-primary/10 px-4 py-3.5 text-[12px] leading-relaxed text-foreground/70">
            {isThinListing(nursery)
              ? "We don't have much on file for this nursery yet — just a name and location. "
              : "Is this your nursery? "}
            <Link href={`/submit?claim=${nursery.slug}`} className="font-semibold text-primary hover:underline">
              Claim this listing
            </Link>{" "}
            to {isThinListing(nursery) ? "add a phone number, website, address, and more." : "update its details."}
          </div>
        </div>
      </div>
    </div>
  );
}
