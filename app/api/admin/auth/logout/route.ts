import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      new URL(request.url).protocol.replace(":", "");

    if (origin !== `${protocol}://${host}`) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
  }

  await clearAdminSession();

  return NextResponse.json({ authenticated: false });
}
