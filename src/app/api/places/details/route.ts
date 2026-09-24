import { NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/providers/geocoding";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing place id" }, { status: 400 });
  }

  try {
    const place = await getPlaceDetails(id);
    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }
    return NextResponse.json({ place });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Details failed" },
      { status: 502 },
    );
  }
}
