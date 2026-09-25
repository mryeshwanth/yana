-- CreateEnum
CREATE TYPE "ReviewThumb" AS ENUM ('up', 'down');

-- CreateEnum
CREATE TYPE "ReviewReason" AS ENUM ('close_enough', 'too_far', 'used_other');

-- CreateTable
CREATE TABLE "ParkingReview" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "lotName" TEXT NOT NULL,
    "lotLat" DOUBLE PRECISION,
    "lotLng" DOUBLE PRECISION,
    "destName" TEXT NOT NULL,
    "destLat" DOUBLE PRECISION,
    "destLng" DOUBLE PRECISION,
    "thumb" "ReviewThumb" NOT NULL,
    "reason" "ReviewReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParkingReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParkingReview_lotId_createdAt_idx" ON "ParkingReview"("lotId", "createdAt");

-- CreateIndex
CREATE INDEX "ParkingReview_thumb_idx" ON "ParkingReview"("thumb");
