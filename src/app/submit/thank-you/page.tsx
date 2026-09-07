import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="rounded-[20px] bg-surface p-10 shadow-[0_2px_8px_rgba(10,20,18,0.04),0_16px_40px_rgba(10,20,18,0.06)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold tracking-tight text-foreground">
          Thanks!
        </h1>
        <p className="mt-2 text-muted">
          Your submission is in the queue for review. Once approved, it&apos;ll
          appear in the directory.
        </p>
        <Link
          href="/search"
          className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Back to browsing →
        </Link>
      </div>
    </div>
  );
}
