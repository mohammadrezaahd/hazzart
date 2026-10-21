import { requireAdminSession } from "@/lib/admin-auth";
import { deletePainting, updatePainting, updatePaintingStatus } from "@/lib/paintings";
import type { AdminBlobReference } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return Response.json({ error: message }, { status });
}

function parseCategoryIds(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    throw new Error("At least one category is required.");
  }

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
    throw new Error("Invalid category selection.");
  }

  return parsed;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const categoryIds = body.categoryIds;
    if (!Array.isArray(categoryIds) || !categoryIds.every((value) => typeof value === "string")) throw new Error("Invalid category selection.");
    const status = body.status;
    if (status !== "draft" && status !== "published" && status !== "archived") throw new Error("Invalid painting status.");
    const images = body.images;
    if (!Array.isArray(images) || images.length !== 2) throw new Error("Two image slots are required.");
    const painting = await updatePainting(id, {
      name: String(body.name ?? ""),
      description: String(body.description ?? ""),
      completedDate: String(body.completedDate ?? ""),
      categoryIds,
      status,
      images: images as [AdminBlobReference | null, AdminBlobReference | null],
    });
    return Response.json({ painting });
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
    const deleted = await deletePainting(id);

    if (!deleted) {
      return Response.json({ error: "Painting not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();
  try {
    const { id } = await params;
    const body = await request.json() as { status?: unknown };
    if (body.status !== "draft" && body.status !== "published" && body.status !== "archived") {
      return Response.json({ error: "Invalid painting status." }, { status: 400 });
    }
    const painting = await updatePaintingStatus(id, body.status);
    return Response.json({ painting });
  } catch (error) {
    return errorResponse(error);
  }
}
