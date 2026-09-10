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
  // Prisma's client is generated to src/generated/prisma (not the default
  // node_modules/@prisma/client location Next.js auto-traces), so its
  // query engine binary isn't picked up by automatic file tracing —
  // causing "Prisma Client could not locate the query engine" on
  // whichever serverless functions didn't happen to trace it in.
  outputFileTracingIncludes: {
    "/**/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
