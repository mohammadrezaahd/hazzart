import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { createProject, getProjects } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminSession();
  try {
    return NextResponse.json({ projects: await getProjects() });
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

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}