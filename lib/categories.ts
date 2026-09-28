import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/mongodb";
import type { AdminCategory } from "@/interfaces/Category";

const COLLECTION = "admin_categories";
const MAX_NAME_LENGTH = 100;

function normalizeName(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Category name is required.");
  }

  const name = value.trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Category name cannot exceed ${MAX_NAME_LENGTH} characters.`);
  }

  return name;
}

function sortCategories(categories: AdminCategory[]) {
  return categories.sort((a, b) => {
    if (a.parentId !== b.parentId) {
      if (a.parentId === null) return -1;
      if (b.parentId === null) return 1;
    }

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

export async function getCategories(): Promise<AdminCategory[]> {
  const db = await getDatabase();

  const categories = (await db
    .collection<AdminCategory>(COLLECTION)
    .find({})
    .project({ _id: 0 })
    .toArray()) as unknown as AdminCategory[];

  return sortCategories(categories);
}

export async function createCategory(nameInput: unknown, parentIdInput: unknown = null) {
  const db = await getDatabase();
  const name = normalizeName(nameInput);
  const parentId =
    typeof parentIdInput === "string" && parentIdInput.trim()
      ? parentIdInput.trim()
      : null;

  if (parentId) {
    const parent = await db
      .collection<AdminCategory>(COLLECTION)
      .findOne({ id: parentId });

    if (!parent) {
      throw new Error("Parent category was not found.");
    }

    if (parent.parentId !== null) {
      throw new Error("A subcategory cannot have subcategories.");
    }
  }

  const duplicate = await db.collection<AdminCategory>(COLLECTION).findOne({
    parentId,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  });

  if (duplicate) {
    throw new Error(
      parentId
        ? "A subcategory with this name already exists in this category."
        : "A category with this name already exists.",
    );
  }

  const now = new Date().toISOString();
  const category: AdminCategory = {
    id: randomUUID(),
    name,
    parentId,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<AdminCategory>(COLLECTION).insertOne(category);
  return category;
}

export async function updateCategory(id: string, nameInput: unknown) {
  const db = await getDatabase();
  const name = normalizeName(nameInput);

  const current = await db.collection<AdminCategory>(COLLECTION).findOne({ id });

  if (!current) {
    throw new Error("Category was not found.");
  }

  const duplicate = await db.collection<AdminCategory>(COLLECTION).findOne({
    id: { $ne: id },
    parentId: current.parentId,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  });

  if (duplicate) {
    throw new Error(
      current.parentId
        ? "A subcategory with this name already exists in this category."
        : "A category with this name already exists.",
    );
  }

  const updated: AdminCategory = {
    ...current,
    name,
    updatedAt: new Date().toISOString(),
  };

  await db.collection<AdminCategory>(COLLECTION).replaceOne({ id }, updated);
  return updated;
}

export async function deleteCategory(id: string) {
  const db = await getDatabase();
  const category = await db.collection<AdminCategory>(COLLECTION).findOne({ id });

  if (!category) {
    throw new Error("Category was not found.");
  }

  const childCount = await db.collection<AdminCategory>(COLLECTION).countDocuments({
    parentId: id,
  });

  if (childCount > 0) {
    throw new Error("Remove this category's subcategories before deleting it.");
  }

  await db.collection<AdminCategory>(COLLECTION).deleteOne({ id });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
