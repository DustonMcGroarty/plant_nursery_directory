export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted sm:px-6">
        <p>
          Find Plant Nurseries is a community-built directory of plant
          nurseries and garden centers across the United States.
        </p>
        <p className="mt-2">
          Don&apos;t see a nursery listed?{" "}
          <a href="/submit" className="underline hover:text-primary">
            Add it to the directory
          </a>
          . Own a nursery that&apos;s already listed?{" "}
          <a href="/submit?claim=1" className="underline hover:text-primary">
            Claim your listing
          </a>
          .
        </p>
        <p className="mt-2">
          Some listings sourced from{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            © OpenStreetMap contributors
          </a>
          , available under the{" "}
          <a
            href="https://opendatacommons.org/licenses/odbl/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Open Database License
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
