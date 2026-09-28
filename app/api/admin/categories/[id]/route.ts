import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { deleteCategory, updateCategory } from "@/lib/categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
  await requireAdminSession();

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { name?: unknown };
    const category = await updateCategory(id, body.name);
    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update category.";
    const status = message.includes("already exists") || message.includes("required") || message.includes("not found") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: Context) {
  await requireAdminSession();

  try {
    const { id } = await context.params;
    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete category.";
    const status = message.includes("subcategories") || message.includes("not found") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
