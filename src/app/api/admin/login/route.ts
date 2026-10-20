import { NextResponse } from "next/server";
import { setAdminCookie, verifyAdminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim() ?? "";
    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Wrong password." }, { status: 401 });
    }
    await setAdminCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
