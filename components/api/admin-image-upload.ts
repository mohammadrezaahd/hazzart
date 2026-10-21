"use client";

export interface UploadedAdminImage {
  pathname: string;
  name: string;
  contentType: string;
  size: number;
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const CHUNK_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function readError(response: Response) {
  try {
    const body = await response.json() as { error?: string };
    return body.error || "Image upload failed.";
  } catch {
    return "Image upload failed.";
  }
}

export async function uploadAdminImage(file: File, kind: "painting" | "project"): Promise<UploadedAdminImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Only JPG, PNG and WebP images are accepted.");
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) throw new Error("Each image must be 20 MB or smaller.");

  const uploadId = crypto.randomUUID();
  const chunkCount = Math.ceil(file.size / CHUNK_SIZE);
  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = file.slice(index * CHUNK_SIZE, Math.min(file.size, (index + 1) * CHUNK_SIZE));
    const query = new URLSearchParams({
      uploadId,
      index: String(index),
      contentType: file.type,
      totalSize: String(file.size),
    });
    const response = await fetch("/api/admin/blob-upload?" + query.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: chunk,
    });
    if (!response.ok) throw new Error(await readError(response));
  }

  const response = await fetch("/api/admin/blob-upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId,
      chunkCount,
      totalSize: file.size,
      fileName: file.name || "image",
      contentType: file.type,
      kind,
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return await response.json() as UploadedAdminImage;
}
