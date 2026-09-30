import { NextResponse } from "next/server";
import { invalidatePublicPortfolioCache } from "@/lib/public-cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { createProject, getProjects } from "@/lib/projects";

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
    const formData = await request.formData();
    const raw = formData.get("data");

    if (typeof raw !== "string") throw new Error("Project data is required.");

    const body = JSON.parse(raw) as Record<string, unknown>;
    const imageFiles = formData.getAll("images").filter((value): value is File => value instanceof File);

    if (!imageFiles.length) throw new Error("At least one project image is required.");

    const project = await createProject(body, imageFiles);
    invalidatePublicPortfolioCache();

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}