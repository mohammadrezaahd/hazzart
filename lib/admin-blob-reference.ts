import { get } from "@vercel/blob";

export const MAX_ADMIN_IMAGE_SIZE = 20 * 1024 * 1024;
export const ALLOWED_ADMIN_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface AdminBlobReference {
  pathname: string;
  name: string;
  contentType: string;
  size: number;
}

export async function validateAdminBlobReference(value: unknown, expectedPrefix: "paintings" | "projects"): Promise<AdminBlobReference> {
  if (!value || typeof value !== "object") throw new Error("Uploaded image reference is missing.");
  const image = value as Partial<AdminBlobReference>;
  if (typeof image.pathname !== "string" || !new RegExp("^" + expectedPrefix + "/[0-9a-f-]{36}-[a-zA-Z0-9._-]+$").test(image.pathname)) {
    throw new Error("Invalid uploaded image reference.");
  }
  if (typeof image.name !== "string" || !image.name.trim() || image.name.length > 255) throw new Error("Invalid image filename.");
  if (typeof image.contentType !== "string" || !ALLOWED_ADMIN_IMAGE_TYPES.has(image.contentType)) throw new Error("Only JPG, PNG and WebP images are accepted.");
  if (!Number.isInteger(image.size) || !image.size || image.size > MAX_ADMIN_IMAGE_SIZE) throw new Error("Each image must be 20 MB or smaller.");

  const result = await get(image.pathname, { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("Uploaded image could not be verified.");
  if (result.blob.pathname !== image.pathname || result.blob.contentType !== image.contentType || result.blob.size !== image.size || !result.blob.size || result.blob.size > MAX_ADMIN_IMAGE_SIZE) {
    throw new Error("Uploaded image metadata does not match the file in storage.");
  }
  await result.stream?.cancel().catch(() => undefined);
  return { pathname: image.pathname, name: image.name.trim(), contentType: image.contentType, size: image.size };
}
