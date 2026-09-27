import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";
import { findAdminByUsername } from "@/lib/admin-user";
import { isLoginRateLimited, recordLoginFailure, clearLoginFailures } from "@/lib/admin-rate-limit";
import { adminLoginSchema } from "@/lib/admin-validation";

export const runtime = "nodejs";

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();

  return ip || request.headers.get("x-real-ip") || "unknown";
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const host = request.headers.get("host");

  if (!host) {
    return false;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol =
    forwardedProto?.split(",")[0]?.trim() ||
    new URL(request.url).protocol.replace(":", "");

  return origin === `${protocol}://${host}`;
}

export async function POST(request: Request) {
  const clientKey = getClientKey(request);

  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") || "0");

  if (contentLength > 4096) {
    return NextResponse.json({ message: "Invalid request." }, { status: 413 });
  }

  if (isLoginRateLimited(clientKey)) {
    return NextResponse.json(
      { message: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body: unknown = await request.json();
    const input = await adminLoginSchema.validate(body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const username = input.username.toLowerCase();
    const user = await findAdminByUsername(username);

    if (!user || !(await compare(input.password, user.passwordHash))) {
      recordLoginFailure(clientKey);

      return NextResponse.json(
        { message: "Invalid username or password." },
        { status: 401 },
      );
    }

    clearLoginFailures(clientKey);

    await createAdminSession({
      sub: user._id.toString(),
      username: user.username,
      role: "admin",
    });

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ message: "Invalid login data." }, { status: 400 });
    }

    console.error("[Admin Login] Failed.", error);

    return NextResponse.json(
      { message: "Authentication service unavailable." },
      { status: 503 },
    );
  }
}
