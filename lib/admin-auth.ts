import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminSessionPayload } from "@/interfaces/Admin";

const SESSION_COOKIE = "__Host-admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET must be configured with at least 32 characters.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSession(payload: AdminSessionPayload) {
  const token = await new SignJWT({
    sub: payload.sub,
    username: payload.username,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret());

  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      payload.role !== "admin"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      username: payload.username,
      role: "admin",
    };
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
