import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { LOT_KIND_IDS } from "@/lib/lot-kinds";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  address: z.string().trim().max(240).optional().nullable(),
  priceText: z.string().trim().max(80).optional().nullable(),
  hoursText: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(400).optional().nullable(),
  lotKind: z.enum(LOT_KIND_IDS).optional().nullable(),
  source: z.enum(["operator", "places", "osm", "live_feed"]).default("operator"),
  availabilityState: z.enum(["live", "estimated", "unknown"]).default("unknown"),
  hidden: z.boolean().default(false),
  city: z.string().trim().max(40).default("bangalore"),
});

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const lots = await prisma.parkingLot.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ lots });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lot details" }, { status: 400 });
  }
  const availabilityState =
    parsed.data.source === "live_feed" ? parsed.data.availabilityState : parsed.data.availabilityState === "live" ? "unknown" : parsed.data.availabilityState;
  try {
    const lot = await prisma.parkingLot.create({
      data: { ...parsed.data, availabilityState },
    });
    return NextResponse.json({ lot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add that lot." },
      { status: 500 },
    );
  }
}
