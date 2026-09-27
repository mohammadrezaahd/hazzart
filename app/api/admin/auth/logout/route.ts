import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await clearAdminSession();

  const referer = request.headers.get("referer");
  const origin = request.headers.get("origin");

  if (referer && origin) {
    try {
      if (new URL(referer).origin !== origin) {
        return NextResponse.json({ message: "Forbidden." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
