-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('WHOLESALE', 'RETAIL', 'ONLINE_ONLY', 'BROKER');

-- AlterEnum
ALTER TYPE "DataSource" ADD VALUE 'BULK_IMPORT';

-- AlterEnum
ALTER TYPE "NurseryStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Nursery" ADD COLUMN     "businessType" "BusinessType",
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "inventorySyncUrl" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "licenseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "licenseStatus" TEXT,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "sourceNotes" TEXT;
