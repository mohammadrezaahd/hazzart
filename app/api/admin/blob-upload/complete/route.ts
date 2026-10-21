import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import { getAdminSession } from "@/lib/admin-auth";
import { ALLOWED_ADMIN_IMAGE_TYPES, MAX_ADMIN_IMAGE_SIZE } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 4 * 1024 * 1024;
const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeName(name: string) {
  return name.trim().replace(/[^a-zA-Z0-9._-]/g, "-") || "image";
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: "Administrator authentication is required." }, { status: 401 });

  let body: { uploadId?: unknown; chunkCount?: unknown; totalSize?: unknown; fileName?: unknown; contentType?: unknown; kind?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid upload completion request." }, { status: 400 });
  }

  const uploadId = body.uploadId;
  const chunkCount = body.chunkCount;
  const totalSize = body.totalSize;
  const fileName = body.fileName;
  const contentType = body.contentType;
  const kind = body.kind;
  if (typeof uploadId !== "string" || !UPLOAD_ID.test(uploadId) ||
      typeof chunkCount !== "number" || !Number.isInteger(chunkCount) ||
      typeof totalSize !== "number" || !Number.isInteger(totalSize) || totalSize < 1 || totalSize > MAX_ADMIN_IMAGE_SIZE ||
      chunkCount !== Math.ceil(totalSize / CHUNK_SIZE) || chunkCount < 1 || chunkCount > 5) {
    return Response.json({ error: "Invalid upload metadata." }, { status: 400 });
  }
  if (typeof fileName !== "string" || !fileName.trim() || fileName.length > 255 ||
      typeof contentType !== "string" || !ALLOWED_ADMIN_IMAGE_TYPES.has(contentType) ||
      (kind !== "painting" && kind !== "project")) {
    return Response.json({ error: "Invalid image metadata." }, { status: 400 });
  }

  const chunkPaths = Array.from({ length: chunkCount }, (_, index) => `admin-upload-chunks/${uploadId}/${index}.part`);
  let finalPath: string | null = null;
  try {
    const parts: Uint8Array[] = [];
    for (let index = 0; index < chunkPaths.length; index += 1) {
      const chunk = await get(chunkPaths[index], { access: "private" });
      if (!chunk || chunk.statusCode !== 200) throw new Error("An upload chunk is missing. Please retry the upload.");
      const bytes = new Uint8Array(await new Response(chunk.stream).arrayBuffer());
      const expectedSize = index < chunkPaths.length - 1 ? CHUNK_SIZE : totalSize - CHUNK_SIZE * index;
      if (bytes.byteLength !== expectedSize) throw new Error("An upload chunk has an invalid size.");
      parts.push(bytes);
    }

    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const part of parts) {
      combined.set(part, offset);
      offset += part.byteLength;
    }
    if (offset !== totalSize) throw new Error("Uploaded image size does not match its metadata.");

    const prefix = kind === "painting" ? "paintings" : "projects";
    finalPath = `${prefix}/${randomUUID()}-${safeName(fileName)}`;
    const blob = await put(finalPath, combined, {
      access: "private",
      contentType,
      addRandomSuffix: false,
    });
    return Response.json({ pathname: blob.pathname, name: fileName.trim(), contentType, size: totalSize });
  } catch (error) {
    if (finalPath) await del(finalPath).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Could not complete image upload.";
    return Response.json({ error: message }, { status: 400 });
  } finally {
    await Promise.all(chunkPaths.map((path) => del(path).catch(() => undefined)));
  }
}
