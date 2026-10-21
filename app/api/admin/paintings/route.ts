import { requireAdminSession } from "@/lib/admin-auth";
import { createPainting, getPaintings } from "@/lib/paintings";
import type { AdminBlobReference } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  await requireAdminSession();

  try {
    const { searchParams } = new URL(request.url);
    return Response.json(
      await getPaintings({
        search: searchParams.get("search") ?? undefined,
        categoryId: searchParams.get("categoryId") ?? undefined,
        from: searchParams.get("from") ?? undefined,
        to: searchParams.get("to") ?? undefined,
        status: searchParams.get("status") === "draft" || searchParams.get("status") === "published" || searchParams.get("status") === "archived"
          ? searchParams.get("status") as "draft" | "published" | "archived"
          : undefined,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  await requireAdminSession();
  try {
    const body = await request.json() as Record<string, unknown>;
    const images = body.images;
    if (!Array.isArray(images) || images.length !== 2) throw new Error("Two painting images are required.");
    const categoryIds = body.categoryIds;
    if (!Array.isArray(categoryIds) || !categoryIds.every((id) => typeof id === "string")) throw new Error("Invalid category selection.");
    const status = body.status;
    if (status !== "draft" && status !== "published" && status !== "archived") throw new Error("Invalid painting status.");
    const painting = await createPainting({
      name: String(body.name ?? ""),
      description: String(body.description ?? ""),
      completedDate: String(body.completedDate ?? ""),
      categoryIds,
      status,
      images: images as [AdminBlobReference, AdminBlobReference],
    });
    return Response.json({ painting }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
