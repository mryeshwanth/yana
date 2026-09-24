import { NextResponse } from "next/server";
import { getPlaceDetails } from "@/lib/providers/geocoding";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const query = params.get("q") ?? undefined;
  if (!id) {
    return NextResponse.json({ error: "Missing place id" }, { status: 400 });
  }

  try {
    const place = await getPlaceDetails(id, query);
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
