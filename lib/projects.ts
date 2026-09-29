import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { getDatabase } from "@/lib/mongodb";
import type { AdminProject, AdminProjectImage } from "@/interfaces/Project";

const COLLECTION = "admin_projects";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function text(value: unknown, label: string, required = false) {
  if (typeof value !== "string") {
    if (!required && (value === null || value === undefined)) return "";
    throw new Error(label + " must be text.");
  }
  const result = value.trim();
  if (required && !result) throw new Error(label + " is required.");
  if (result.length > 5000) throw new Error(label + " is too long.");
  return result;
}

function date(value: unknown, label: string, required = true) {
  const result = text(value, label, required);
  if (result && !/^\d{4}\/\d{2}\/\d{2}$/.test(result)) {
    throw new Error(label + " must use YYYY/MM/DD format.");
  }
  return result;
}

function normalizeLinks(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Links must be an array.");
  return value.map((item) => {
    const row = item as { id?: unknown; title?: unknown; link?: unknown };
    const title = text(row.title, "Link title", true);
    const link = text(row.link, "Link URL", true);
    try { new URL(link); } catch { throw new Error("Every project link must be a valid URL."); }
    return { id: typeof row.id === "string" && row.id ? row.id : randomUUID(), title, link };
  });
}

function normalizeFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Dynamic fields are invalid.");
  }
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    const k = key.trim();
    if (k) result[k] = text(val, "Value for " + k);
  }
  return result;
}

function getSafeFileName(fileName: string) {
  const name = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  return name || "project-image";
}

async function uploadImage(file: File): Promise<AdminProjectImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are accepted.");
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Each project image must be smaller than 4 MB.");
  }

  const pathname = `projects/${randomUUID()}-${getSafeFileName(file.name)}`;
  const blob = await put(pathname, file, {
    access: "private",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return {
    id: randomUUID(),
    fileId: blob.pathname,
    url: `/api/paintings/images/${blob.pathname}`,
    name: file.name || "project-image",
    contentType: file.type,
    size: file.size,
  };
}

async function deleteImage(fileId: string) {
  if (!fileId) return;
  try { await del(fileId); } catch {}
}

async function normalize(
  body: Record<string, unknown>,
  statusIds: Set<string>,
  current?: AdminProject,
  images?: AdminProjectImage[],
): Promise<AdminProject> {
  const title = text(body.title, "Title", true);
  const myRole = text(body.myRole, "My Role", true);
  const started = date(body.started, "Started", true);
  const statusId = text(body.statusId, "Status", true);

  if (!statusIds.has(statusId)) throw new Error("Selected status was not found.");

  const ended = date(body.ended, "Ended", false) || null;
  if (statusId === "done" && !ended) {
    throw new Error("Ended is required when status is Done.");
  }

  const medium = Array.isArray(body.medium)
    ? body.medium.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim())
    : [];

  if (!medium.length) throw new Error("At least one medium category is required.");

  const projectImages = images ?? current?.images ?? [];
  if (!projectImages.length) throw new Error("At least one project image is required.");

  const now = new Date().toISOString();

  return {
    id: current?.id ?? randomUUID(),
    title,
    myRole,
    started,
    ended,
    medium,
    statusId,
    images: projectImages,
    links: normalizeLinks(body.links),
    dynamicFields: normalizeFields(body.dynamicFields ?? {}),
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function getProjects() {
  return (await getDatabase()).collection<AdminProject>(COLLECTION).find({}).project({_id: 0}).sort({updatedAt: -1}).toArray();
}

export async function createProject(
  body: Record<string, unknown>,
  statusIds: Set<string>,
  imageFiles: File[],
) {
  const uploaded = await Promise.all(imageFiles.map(uploadImage));

  try {
    const project = await normalize(body, statusIds, undefined, uploaded);
    await (await getDatabase()).collection<AdminProject>(COLLECTION).insertOne(project);
    return project;
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteImage(image.fileId)));
    throw error;
  }
}

export async function updateProject(
  id: string,
  body: Record<string, unknown>,
  statusIds: Set<string>,
  imageFiles: File[],
) {
  const db = await getDatabase();
  const current = await db.collection<AdminProject>(COLLECTION).findOne({ id });

  if (!current) throw new Error("Project was not found.");

  const uploaded = await Promise.all(imageFiles.map(uploadImage));
  const nextImages = [...(current.images ?? []), ...uploaded];

  try {
    const project = await normalize(body, statusIds, current, nextImages);
    await db.collection<AdminProject>(COLLECTION).replaceOne({ id }, project);
    return project;
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteImage(image.fileId)));
    throw error;
  }
}

export async function deleteProject(id: string) {
  const db = await getDatabase();
  const current = await db.collection<AdminProject>(COLLECTION).findOne({ id });

  if (!current) throw new Error("Project was not found.");

  await db.collection<AdminProject>(COLLECTION).deleteOne({ id });
  await Promise.all((current.images ?? []).map((image) => deleteImage(image.fileId)));
}