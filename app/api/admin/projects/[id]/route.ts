import { NextResponse } from "next/server";
import { invalidatePublicPortfolioCache } from "@/lib/public-cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteProject, updateProject, updateProjectPublicationStatus } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  await requireAdminSession();

  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const raw = formData.get("data");

    if (typeof raw !== "string") throw new Error("Project data is required.");

    const body = JSON.parse(raw) as Record<string, unknown>;
    const imageFiles = formData.getAll("images").filter((value): value is File => value instanceof File);
    const rawRemoveIds = formData.get("removeImageIds");
    const removeImageIds = typeof rawRemoveIds === "string"
      ? (JSON.parse(rawRemoveIds) as unknown[]).filter((value): value is string => typeof value === "string")
      : [];
    const project = await updateProject(id, body, imageFiles, removeImageIds);
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
