import { NextResponse } from "next/server";
import { invalidatePublicPortfolioCache } from "@/lib/public-cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteProject, updateProject, updateProjectPublicationStatus } from "@/lib/projects";
import type { AdminBlobReference } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  await requireAdminSession();
  try {
    const { id } = await context.params;
    const body = await request.json() as { data?: unknown; images?: unknown; removeImageIds?: unknown };
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) throw new Error("Project data is required.");
    if (!Array.isArray(body.images)) throw new Error("Invalid project images.");
    const removeImageIds = Array.isArray(body.removeImageIds) ? body.removeImageIds.filter((value): value is string => typeof value === "string") : [];
    const project = await updateProject(id, body.data as Record<string, unknown>, body.images as AdminBlobReference[], removeImageIds);
    invalidatePublicPortfolioCache();
    return NextResponse.json({ project });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not update project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  await requireAdminSession();

  try {
    const { id } = await context.params;
    await deleteProject(id);
    invalidatePublicPortfolioCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not delete project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: Context) {
  await requireAdminSession();

  try {
    const { id } = await context.params;
    const body = await request.json() as { status?: unknown };
    if (body.status !== "draft" && body.status !== "published" && body.status !== "archived") {
      return NextResponse.json({ error: "Invalid publication status." }, { status: 400 });
    }
    const project = await updateProjectPublicationStatus(id, body.status);
    invalidatePublicPortfolioCache();
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not update project status." }, { status: 400 });
  }
}
