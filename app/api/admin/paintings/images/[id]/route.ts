import { requireAdminSession } from "@/lib/admin-auth";
import { getPaintingImage } from "@/lib/paintings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  const { id } = await params;
  const image = await getPaintingImage(id);

  if (!image) {
    return new Response("Image not found.", { status: 404 });
  }

  return new Response(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
