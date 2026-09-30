import { requireAdminSession } from "@/lib/admin-auth";
import { deletePainting, updatePainting, updatePaintingStatus } from "@/lib/paintings";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  try {
    const { id } = await params;
    const formData = await request.formData();
    const image1 = formData.get("image1");
    const image2 = formData.get("image2");

    const painting = await updatePainting(id, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      completedDate: String(formData.get("completedDate") ?? ""),
      categoryIds: parseCategoryIds(formData.get("categoryIds")),
      status: (() => {
        const value = formData.get("status");
        if (value !== "draft" && value !== "published" && value !== "archived") {
          throw new Error("Invalid painting status.");
        }
        return value;
      })(),
      images: [
        image1 instanceof File ? image1 : null,
        image2 instanceof File ? image2 : null,
      ],
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
