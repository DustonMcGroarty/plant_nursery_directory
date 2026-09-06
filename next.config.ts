import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default (1mb) is too small for a bulk CSV import (the uploaded
      // file, plus the same text round-tripped through a hidden field on
      // confirm) once a state's nursery dealer list gets into the
      // thousands of rows.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
