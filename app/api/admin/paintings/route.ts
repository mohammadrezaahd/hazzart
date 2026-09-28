import { requireAdminSession } from "@/lib/admin-auth";
import { createPainting, getPaintings } from "@/lib/paintings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  await requireAdminSession();

  try {
    const formData = await request.formData();
    const image1 = formData.get("image1");
    const image2 = formData.get("image2");

    if (!(image1 instanceof File) || !(image2 instanceof File)) {
      throw new Error("Two painting images are required.");
    }

    const painting = await createPainting({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      completedDate: String(formData.get("completedDate") ?? ""),
      categoryIds: parseCategoryIds(formData.get("categoryIds")),
      images: [image1, image2],
    });

    return Response.json({ painting }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
