import { put } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin-auth";
import { ALLOWED_ADMIN_IMAGE_TYPES, MAX_ADMIN_IMAGE_SIZE } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 4 * 1024 * 1024;
const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: "Administrator authentication is required." }, { status: 401 });

  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const index = Number(url.searchParams.get("index"));
  const contentType = url.searchParams.get("contentType") ?? "";
  const totalSize = Number(url.searchParams.get("totalSize"));

  if (!UPLOAD_ID.test(uploadId) || !Number.isInteger(index) || index < 0 || index > 4) {
    return Response.json({ error: "Invalid upload chunk." }, { status: 400 });
  }
  if (!ALLOWED_ADMIN_IMAGE_TYPES.has(contentType) || !Number.isInteger(totalSize) || totalSize < 1 || totalSize > MAX_ADMIN_IMAGE_SIZE) {
    return Response.json({ error: "Invalid image metadata." }, { status: 400 });
  }

  try {
    const bytes = await request.arrayBuffer();
    const expectedChunkCount = Math.ceil(totalSize / CHUNK_SIZE);
    const expectedSize = index < expectedChunkCount - 1 ? CHUNK_SIZE : totalSize - CHUNK_SIZE * index;
    if (index >= expectedChunkCount || bytes.byteLength !== expectedSize || bytes.byteLength > CHUNK_SIZE) {
      return Response.json({ error: "Invalid chunk size." }, { status: 400 });
    }

    await put(`admin-upload-chunks/${uploadId}/${index}.part`, bytes, {
      access: "private",
      contentType: "application/octet-stream",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return Response.json({ success: true, index });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not store upload chunk.";
    return Response.json({ error: message }, { status: 500 });
  }
}
