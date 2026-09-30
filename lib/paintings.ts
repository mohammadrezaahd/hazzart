import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { getDatabase } from "@/lib/mongodb";
import type { AdminPainting, AdminPaintingImage, AdminPaintingStatus } from "@/interfaces/Painting";

const COLLECTION = "admin_paintings";
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function escapeRegex(value: string) {
  return value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
}

function validateDate(value: string) {
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(value)) {
    throw new Error("Date must use YYYY/MM/DD format.");
  }

  const [year, month, day] = value.split("/").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Invalid completion date.");
  }

  return value;
}

function validateName(value: string) {
  const name = value.trim();
  if (!name || name.length > 150) {
    throw new Error("Painting name is required and must be 150 characters or fewer.");
  }
  return name;
}

function validateStatus(value: unknown): AdminPaintingStatus {
  if (value !== "draft" && value !== "published" && value !== "archived") {
    throw new Error("Invalid painting status.");
  }
  return value;
}

function normalizePainting(painting: AdminPainting): AdminPainting {
  return {
    ...painting,
    status: painting.status ?? "published",
    images: painting.images.map((image) => ({ ...image, starred: Boolean(image.starred) })) as [AdminPaintingImage, AdminPaintingImage],
  };
}

function validateDescription(value: string) {
  if (value.length > 5000) {
    throw new Error("Description must be 5000 characters or fewer.");
  }
  return value.trim();
}

async function validateCategories(categoryIds: string[]) {
  const db = await getDatabase();
  const uniqueIds = [...new Set(categoryIds.map((id) => id.trim()).filter(Boolean))];

  if (uniqueIds.length !== categoryIds.length) {
    throw new Error("Invalid or duplicate category selection.");
  }

  const categories = await db
    .collection("admin_categories")
    .find({ id: { $in: uniqueIds } }, { projection: { id: 1 } })
    .toArray();

  if (categories.length !== uniqueIds.length) {
    throw new Error("One or more selected categories no longer exist.");
  }

  return uniqueIds;
}

function getSafeFileName(fileName: string) {
  const name = fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  return name || "painting-image";
}

async function uploadImage(file: File): Promise<AdminPaintingImage> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are accepted.");
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Each painting image must be smaller than 4 MB.");
  }

  const pathname = `paintings/${randomUUID()}-${getSafeFileName(file.name)}`;
  const blob = await put(pathname, file, {
    access: "private",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return {
    fileId: blob.pathname,
    url: `/api/paintings/images/${blob.pathname}`,
    name: file.name || "painting-image",
    contentType: file.type,
    size: file.size,
  };
}

async function deleteImage(fileId: string) {
  if (!fileId) return;

  try {
    await del(fileId);
  } catch {
    // The painting record is still the source of truth if an old image was already removed.
  }
}

export async function getPaintings(filters: {
  search?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  status?: AdminPaintingStatus;
}) {
  const db = await getDatabase();
  const query: Record<string, unknown> = {};

  const search = filters.search?.trim();
  if (search) {
    query.name = { $regex: escapeRegex(search), $options: "i" };
  }

  if (filters.categoryId) {
    query.categoryIds = filters.categoryId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.from || filters.to) {
    query.completedDate = {
      ...(filters.from ? { $gte: validateDate(filters.from) } : {}),
      ...(filters.to ? { $lte: validateDate(filters.to) } : {}),
    };
  }

  const documents = await db
    .collection<AdminPainting>(COLLECTION)
    .find(query)
    .sort({ completedDate: -1, createdAt: -1 })
    .toArray();

  const paintings = documents.map(normalizePainting);
  return {
    paintings,
    total: paintings.length,
  };
}

export async function createPainting(input: {
  name: string;
  description: string;
  completedDate: string;
  categoryIds: string[];
  status: AdminPaintingStatus;
  images: [File, File];
}) {
  const name = validateName(input.name);
  const description = validateDescription(input.description);
  const completedDate = validateDate(input.completedDate);
  const categoryIds = await validateCategories(input.categoryIds);
  const status = validateStatus(input.status);
  const images = await Promise.all(input.images.map(uploadImage));
  const now = new Date().toISOString();

  const painting: AdminPainting = {
    id: randomUUID(),
    name,
    description,
    completedDate,
    categoryIds,
    status,
    images: images.map((image) => ({ ...image, starred: false })) as [AdminPaintingImage, AdminPaintingImage],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const db = await getDatabase();
    await db.collection<AdminPainting>(COLLECTION).insertOne(painting);
    return painting;
  } catch (error) {
    await Promise.all(images.map((image) => deleteImage(image.fileId)));
    throw error;
  }
}

export async function updatePainting(
  id: string,
  input: {
    name: string;
    description: string;
    completedDate: string;
    categoryIds: string[];
    status: AdminPaintingStatus;
    images: [File | null, File | null];
  },
) {
  const db = await getDatabase();
  const current = await db.collection<AdminPainting>(COLLECTION).findOne({ id });

  if (!current) {
    throw new Error("Painting not found.");
  }

  const name = validateName(input.name);
  const description = validateDescription(input.description);
  const completedDate = validateDate(input.completedDate);
  const categoryIds = await validateCategories(input.categoryIds);
  const status = validateStatus(input.status);
  const nextImages = [...current.images] as [AdminPaintingImage, AdminPaintingImage];
  const uploaded: AdminPaintingImage[] = [];

  try {
    for (let index = 0; index < 2; index += 1) {
      const file = input.images[index];
      if (!file) continue;

      const image = await uploadImage(file);
      uploaded.push(image);
      nextImages[index] = image;
    }

    const updatedAt = new Date().toISOString();
    await db.collection<AdminPainting>(COLLECTION).updateOne(
      { id },
      {
        $set: {
          name,
          description,
          completedDate,
          categoryIds,
          status,
          images: nextImages,
          updatedAt,
        },
      },
    );

    for (let index = 0; index < 2; index += 1) {
      if (nextImages[index].fileId !== current.images[index].fileId) {
        await deleteImage(current.images[index].fileId);
      }
    }

    return { ...current, name, description, completedDate, categoryIds, status, images: nextImages, updatedAt };
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteImage(image.fileId)));
    throw error;
  }
}

export async function deletePainting(id: string) {
  const db = await getDatabase();
  const current = await db.collection<AdminPainting>(COLLECTION).findOne({ id });

  if (!current) return false;

  await db.collection<AdminPainting>(COLLECTION).deleteOne({ id });
  await Promise.all(current.images.map((image) => deleteImage(image.fileId)));
  return true;
}


export async function setPaintingImageStar(
  paintingId: string,
  fileId: string,
  starred: boolean,
) {
  const db = await getDatabase();
  const current = await db.collection<AdminPainting>(COLLECTION).findOne({
    id: paintingId,
    "images.fileId": fileId,
  });

  if (!current) {
    throw new Error("Painting image was not found.");
  }

  const image = current.images.find((item) => item.fileId === fileId);

  if (!image) {
    throw new Error("Painting image was not found.");
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    "images.$.starred": starred,
    "images.$.updatedAt": now,
  };

  if (starred && !image.tableDescription) {
    update["images.$.tableDescription"] = current.description;
  }

  await db.collection<AdminPainting>(COLLECTION).updateOne(
    { id: paintingId, "images.fileId": fileId },
    { $set: { ...update, updatedAt: now } },
  );

  return {
    ...current,
    status: current.status ?? "draft",
    images: current.images.map((item) =>
      item.fileId === fileId
        ? {
            ...item,
            starred,
            ...(starred && !item.tableDescription
              ? { tableDescription: current.description }
              : {}),
            updatedAt: now,
          }
        : item,
    ) as [AdminPaintingImage, AdminPaintingImage],
    updatedAt: now,
  };
}


export async function updatePaintingStatus(id: string, status: AdminPaintingStatus) {
  const db = await getDatabase();
  const current = await db.collection<AdminPainting>(COLLECTION).findOne({ id });
  if (!current) throw new Error("Painting not found.");

  const updatedAt = new Date().toISOString();
  await db.collection<AdminPainting>(COLLECTION).updateOne(
    { id },
    { $set: { status, updatedAt } },
  );

  return { ...current, status, updatedAt };
}
