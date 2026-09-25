import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  lotId: z.string().trim().min(1).max(180),
  lotName: z.string().trim().min(1).max(180),
  lotLat: z.number().gte(-90).lte(90).optional(),
  lotLng: z.number().gte(-180).lte(180).optional(),
  destName: z.string().trim().min(1).max(180),
  destLat: z.number().gte(-90).lte(90).optional(),
  destLng: z.number().gte(-180).lte(180).optional(),
  thumb: z.enum(["up", "down"]),
  reason: z.enum(["close_enough", "too_far", "used_other"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the review and try again." }, { status: 400 });
  }

  const review = await prisma.parkingReview.create({
    data: parsed.data,
  });

  return NextResponse.json({ id: review.id });
}
