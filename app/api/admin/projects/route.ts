import { NextResponse } from "next/server";
import { invalidatePublicPortfolioCache } from "@/lib/public-cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { createProject, getProjects } from "@/lib/projects";
import type { AdminBlobReference } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdminSession();
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? undefined;
    const statusParam = url.searchParams.get("status");
    const status = statusParam === "draft" || statusParam === "published" || statusParam === "archived"
      ? statusParam
      : undefined;
    return NextResponse.json({ projects: await getProjects({ search, status }) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdminSession();
  try {
    const body = await request.json() as { data?: unknown; images?: unknown };
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) throw new Error("Project data is required.");
    if (!Array.isArray(body.images) || !body.images.length) throw new Error("At least one project image is required.");
    const project = await createProject(body.data as Record<string, unknown>, body.images as AdminBlobReference[]);
    invalidatePublicPortfolioCache();
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
