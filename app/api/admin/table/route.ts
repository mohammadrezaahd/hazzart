import { requireAdminSession } from "@/lib/admin-auth";
import { getTableItems } from "@/lib/table";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminSession();

  try {
    return Response.json({ items: await getTableItems() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load table items.";
    return Response.json({ error: message }, { status: 400 });
  }
}
