import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const suggestions = await prisma.parkingSuggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ suggestions });
}
