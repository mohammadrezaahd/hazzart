import { requireAdminSession } from "@/lib/admin-auth";
import { getTableSettings, updateTableSettings } from "@/lib/table";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminSession();
  try {
    return Response.json({ settings: await getTableSettings() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load table settings.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  await requireAdminSession();
  try {
    const body = (await request.json()) as { categoryIds?: unknown };
    return Response.json({ settings: await updateTableSettings(body.categoryIds) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update table settings.";
    return Response.json({ error: message }, { status: 400 });
  }
}