import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Thanks!</h1>
      <p className="mt-2 text-muted">
        Your submission is in the queue for review. Once approved, it&apos;ll
        appear in the directory.
      </p>
      <Link href="/search" className="mt-6 inline-block text-primary underline">
        Back to browsing
      </Link>
    </div>
  );
}
