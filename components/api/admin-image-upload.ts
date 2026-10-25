"use client";

import { uploadPresigned } from "@vercel/blob/client";

export interface UploadedAdminImage {
  pathname: string;
  name: string;
  contentType: string;
  size: number;
}

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeName(name: string) {
  return name.trim().replace(/[^a-zA-Z0-9._-]/g, "-") || "image";
}

export async function uploadAdminImage(file: File, kind: "painting" | "project"): Promise<UploadedAdminImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are accepted.");
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Each image must be 20 MB or smaller.");
  }

  const prefix = kind === "painting" ? "paintings" : "projects";
  const pathname = `${prefix}/${crypto.randomUUID()}-${safeName(file.name || "image")}`;

  // The browser sends the file directly to private Vercel Blob storage.
  // Our API route only authorizes this one path using a short-lived signed URL.
  const blob = await uploadPresigned(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/admin/blob-upload",
  });

  return {
    pathname: blob.pathname,
    name: file.name || "image",
    contentType: file.type,
    size: file.size,
  };
}
