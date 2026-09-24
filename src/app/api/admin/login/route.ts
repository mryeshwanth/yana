import { NextResponse } from "next/server";
import { setAdminCookie, verifyAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
