import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json()) as { action?: "approve" | "reject" };
  const suggestion = await prisma.parkingSuggestion.findUnique({ where: { id } });
  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  if (body.action === "reject") {
    const updated = await prisma.parkingSuggestion.update({
      where: { id },
      data: { status: "rejected", reviewedAt: new Date() },
    });
    return NextResponse.json({ suggestion: updated });
  }

  if (body.action !== "approve") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const [lot] = await prisma.$transaction([
    prisma.parkingLot.create({
      data: {
        name: suggestion.name,
        lat: suggestion.lat,
        lng: suggestion.lng,
        address: suggestion.address,
        priceText: suggestion.priceText,
        hoursText: suggestion.hoursText,
        notes: suggestion.notes,
        lotKind: suggestion.lotKind,
        source: "operator",
        availabilityState: "unknown",
      },
    }),
    prisma.parkingSuggestion.update({
      where: { id },
      data: { status: "approved", reviewedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ lot });
}
