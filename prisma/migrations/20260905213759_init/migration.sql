-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'FEATURED', 'PREMIUM');

-- CreateEnum
CREATE TYPE "NurseryStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('GOOGLE_PLACES', 'YELP', 'MANUAL_SUBMISSION', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VISITOR', 'OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Nursery" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "email" TEXT,
    "description" TEXT,
    "hours" JSONB,
    "status" "NurseryStatus" NOT NULL DEFAULT 'PENDING',
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL_SUBMISSION',
    "externalId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "sponsoredUntil" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nursery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryPhoto" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NurseryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurserySpecialty" (
    "nurseryId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "NurserySpecialty_pkey" PRIMARY KEY ("nurseryId","specialtyId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VISITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimRequest" (
    "id" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "nurseryId" TEXT,
    "proposedName" TEXT,
    "proposedAddressLine1" TEXT,
    "proposedAddressLine2" TEXT,
    "proposedCity" TEXT,
    "proposedState" TEXT,
    "proposedPostalCode" TEXT,
    "proposedPhone" TEXT,
    "proposedWebsite" TEXT,
    "proposedDescription" TEXT,
    "proposedSpecialties" TEXT[],
    "requesterId" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "note" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "authorId" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nursery_slug_key" ON "Nursery"("slug");

-- CreateIndex
CREATE INDEX "Nursery_state_city_idx" ON "Nursery"("state", "city");

-- CreateIndex
CREATE INDEX "Nursery_latitude_longitude_idx" ON "Nursery"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Nursery_status_idx" ON "Nursery"("status");

-- CreateIndex
CREATE INDEX "Nursery_planTier_idx" ON "Nursery"("planTier");

-- CreateIndex
CREATE UNIQUE INDEX "Nursery_source_externalId_key" ON "Nursery"("source", "externalId");

-- CreateIndex
CREATE INDEX "NurseryPhoto_nurseryId_idx" ON "NurseryPhoto"("nurseryId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_slug_key" ON "Specialty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE INDEX "NurserySpecialty_specialtyId_idx" ON "NurserySpecialty"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ClaimRequest_status_idx" ON "ClaimRequest"("status");

-- CreateIndex
CREATE INDEX "ClaimRequest_nurseryId_idx" ON "ClaimRequest"("nurseryId");

-- CreateIndex
CREATE INDEX "Review_nurseryId_idx" ON "Review"("nurseryId");

-- AddForeignKey
ALTER TABLE "Nursery" ADD CONSTRAINT "Nursery_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseryPhoto" ADD CONSTRAINT "NurseryPhoto_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurserySpecialty" ADD CONSTRAINT "NurserySpecialty_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurserySpecialty" ADD CONSTRAINT "NurserySpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
