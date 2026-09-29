import { getDatabase } from "@/lib/mongodb";
import type { AdminPainting, AdminPaintingImage } from "@/interfaces/Painting";
import type { AdminTableItem } from "@/interfaces/Table";

const COLLECTION = "admin_paintings";

function imageId(paintingId: string, image: AdminPaintingImage) {
  return paintingId + ":" + image.fileId;
}

function toItem(painting: AdminPainting, image: AdminPaintingImage): AdminTableItem {
  return {
    id: imageId(painting.id, image),
    paintingId: painting.id,
    imageFileId: image.fileId,
    imageUrl: image.url,
    imageName: image.name,
    title: painting.name,
    paintingDescription: painting.description,
    description: image.tableDescription ?? painting.description,
    completedDate: painting.completedDate,
    categoryIds: painting.categoryIds,
    createdAt: painting.createdAt,
    updatedAt: image.updatedAt ?? painting.updatedAt,
  };
}

export async function getTableItems(): Promise<AdminTableItem[]> {
  const db = await getDatabase();
  const paintings = await db
    .collection<AdminPainting>(COLLECTION)
    .find({ "images.starred": true })
    .sort({ updatedAt: -1, createdAt: -1 })
    .toArray();

  return paintings.flatMap((painting) =>
    painting.images.filter((image) => image.starred).map((image) => toItem(painting, image)),
  );
}

function parseId(id: string) {
  const separator = id.indexOf(":");
  if (separator <= 0 || separator === id.length - 1) {
    throw new Error("Invalid table item.");
  }

  return {
    paintingId: id.slice(0, separator),
    imageFileId: id.slice(separator + 1),
  };
}

export async function unstarTableItem(id: string) {
  const { paintingId, imageFileId } = parseId(id);
  const db = await getDatabase();

  const result = await db.collection<AdminPainting>(COLLECTION).updateOne(
    { id: paintingId, "images.fileId": imageFileId },
    { $set: { "images.$.starred": false, updatedAt: new Date().toISOString() } },
  );

  if (!result.matchedCount) {
    throw new Error("Table item was not found.");
  }
}

export async function updateTableItem(id: string, descriptionInput: unknown) {
  const { paintingId, imageFileId } = parseId(id);

  if (typeof descriptionInput !== "string") {
    throw new Error("Description must be text.");
  }

  const description = descriptionInput.trim();

  if (description.length > 5000) {
    throw new Error("Description must be 5000 characters or fewer.");
  }

  const db = await getDatabase();
  const current = await db.collection<AdminPainting>(COLLECTION).findOne({
    id: paintingId,
    "images.fileId": imageFileId,
  });

  if (!current) {
    throw new Error("Table item was not found.");
  }

  const image = current.images.find((item) => item.fileId === imageFileId);

  if (!image || !image.starred) {
    throw new Error("Table item is not starred.");
  }

  await db.collection<AdminPainting>(COLLECTION).updateOne(
    { id: paintingId, "images.fileId": imageFileId },
    {
      $set: {
        "images.$.tableDescription": description,
        "images.$.updatedAt": new Date().toISOString(),
      },
    },
  );

  return toItem(current, {
    ...image,
    tableDescription: description,
    updatedAt: new Date().toISOString(),
  });
}
