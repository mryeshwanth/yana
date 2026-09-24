import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  lat: z.number().gte(-90).lte(90).optional(),
  lng: z.number().gte(-180).lte(180).optional(),
  address: z.string().trim().max(240).optional().nullable(),
  priceText: z.string().trim().max(80).optional().nullable(),
  hoursText: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(400).optional().nullable(),
  source: z.enum(["operator", "places", "osm", "live_feed"]).optional(),
  availabilityState: z.enum(["live", "estimated", "unknown"]).optional(),
  hidden: z.boolean().optional(),
  city: z.string().trim().max(40).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const data = { ...parsed.data };
  if (data.availabilityState === "live" && data.source !== "live_feed") {
    data.availabilityState = "unknown";
  }
  const lot = await prisma.parkingLot.update({ where: { id }, data });
  return NextResponse.json({ lot });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.parkingLot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
