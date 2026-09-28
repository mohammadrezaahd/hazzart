import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { createCategory, getCategories } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminSession();

  try {
    return NextResponse.json({ categories: await getCategories() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load categories.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requireAdminSession();

  try {
    const body = (await request.json()) as { name?: unknown; parentId?: unknown };
    const category = await createCategory(body.name, body.parentId);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create category.";
    const status = message.includes("already exists") || message.includes("cannot") || message.includes("required") || message.includes("not found") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
