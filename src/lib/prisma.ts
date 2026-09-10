import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// A driver adapter (rather than Prisma's Rust query engine binary) is used
// here because the binary isn't reliably bundled into Vercel's serverless
// functions when the client is generated to a custom output path — see
// https://github.com/prisma/prisma/discussions/29339. The adapter's
// Wasm-based query compiler ships inside @prisma/client itself, so there's
// no platform-specific binary to go missing.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
