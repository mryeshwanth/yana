-- CreateEnum
CREATE TYPE "AvailabilitySource" AS ENUM ('operator', 'places', 'osm', 'live_feed');

-- CreateEnum
CREATE TYPE "AvailabilityState" AS ENUM ('live', 'estimated', 'unknown');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "ParkingLot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "priceText" TEXT,
    "hoursText" TEXT,
    "notes" TEXT,
    "lotKind" TEXT,
    "source" "AvailabilitySource" NOT NULL DEFAULT 'operator',
    "availabilityState" "AvailabilityState" NOT NULL DEFAULT 'unknown',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL DEFAULT 'bangalore',
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParkingLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "queryText" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingSuggestion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "priceText" TEXT,
    "hoursText" TEXT,
    "notes" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ParkingSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParkingCache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParkingCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParkingLot_externalId_key" ON "ParkingLot"("externalId");

-- CreateIndex
CREATE INDEX "ParkingLot_city_hidden_idx" ON "ParkingLot"("city", "hidden");

-- CreateIndex
CREATE INDEX "ParkingLot_lat_lng_idx" ON "ParkingLot"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_googlePlaceId_key" ON "Destination"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Destination_name_idx" ON "Destination"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingCache_key_key" ON "ParkingCache"("key");
