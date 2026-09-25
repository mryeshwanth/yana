import { NextResponse } from "next/server";
import { z } from "zod";
import { LOT_KIND_IDS } from "@/lib/lot-kinds";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  address: z.string().trim().max(240).optional(),
  priceText: z.string().trim().max(80).optional(),
  hoursText: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(400).optional(),
  lotKind: z.enum(LOT_KIND_IDS).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the parking details and try again." }, { status: 400 });
  }

  const suggestion = await prisma.parkingSuggestion.create({
    data: parsed.data,
  });

  return NextResponse.json({ id: suggestion.id });
}
