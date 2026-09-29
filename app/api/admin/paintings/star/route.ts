import { requireAdminSession } from "@/lib/admin-auth";
import { setPaintingImageStar } from "@/lib/paintings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireAdminSession();

  try {
    const body = (await request.json()) as {
      paintingId?: unknown;
      fileId?: unknown;
      starred?: unknown;
    };

    if (
      typeof body.paintingId !== "string" ||
      typeof body.fileId !== "string" ||
      typeof body.starred !== "boolean"
    ) {
      return Response.json({ error: "Invalid star request." }, { status: 400 });
    }

    const painting = await setPaintingImageStar(body.paintingId, body.fileId, body.starred);
    return Response.json({ painting });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update star.";
    return Response.json({ error: message }, { status: 400 });
  }
}
