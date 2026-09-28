import { requireAdminSession } from "@/lib/admin-auth";
import { deleteArtistSocialPlatform } from "@/lib/artist";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  try {
    const { id } = await params;

    if (!id) {
      return Response.json({ error: "Platform id is required." }, { status: 400 });
    }

    const deleted = await deleteArtistSocialPlatform(id);

    if (!deleted) {
      return Response.json({ error: "Social platform not found." }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return Response.json({ error: message }, { status: 400 });
  }
}
