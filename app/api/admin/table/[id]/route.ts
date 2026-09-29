import { requireAdminSession } from "@/lib/admin-auth";
import { unstarTableItem, updateTableItem } from "@/lib/table";

export const runtime = "nodejs";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return Response.json({ error: message }, { status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  try {
    const { id } = await params;
    const body = (await request.json()) as { description?: unknown };
    const item = await updateTableItem(id, body.description);
    return Response.json({ item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  try {
    const { id } = await params;
    await unstarTableItem(id);
    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
