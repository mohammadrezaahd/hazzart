import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/mongodb";
import type { AdminProjectStatus } from "@/interfaces/ProjectStatus";

const COLLECTION = "admin_project_statuses";
const DEFAULTS = [
  { id: "done", name: "Done" },
  { id: "in-progress", name: "In Progress" },
];

async function ensureDefaults() {
  const collection = (await getDatabase()).collection<AdminProjectStatus>(COLLECTION);
  const now = new Date().toISOString();

  for (const item of DEFAULTS) {
    await collection.updateOne(
      { id: item.id },
      { $setOnInsert: { ...item, system: true, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
  }
}

export async function getProjectStatuses() {
  await ensureDefaults();
  return (await getDatabase())
    .collection<AdminProjectStatus>(COLLECTION)
    .find({})
    .project({ _id: 0 })
    .sort({ system: -1, name: 1 })
    .toArray();
}

export async function createProjectStatus(input: unknown) {
  const name = normalizeName(input);
  const db = await getDatabase();
  const collection = db.collection<AdminProjectStatus>(COLLECTION);

  if (await collection.findOne({ name: { $regex: "^" + escapeRegex(name) + "$", $options: "i" } })) {
    throw new Error("A status with this name already exists.");
  }

  const now = new Date().toISOString();
  const status = { id: randomUUID(), name, system: false, createdAt: now, updatedAt: now };
  await collection.insertOne(status);
  return status;
}

export async function updateProjectStatus(id: string, input: unknown) {
  const name = normalizeName(input);
  const db = await getDatabase();
  const collection = db.collection<AdminProjectStatus>(COLLECTION);
  const current = await collection.findOne({ id });

  if (!current) throw new Error("Status was not found.");
  if (current.system) throw new Error("Default statuses cannot be edited.");

  if (await collection.findOne({
    id: { $ne: id },
    name: { $regex: "^" + escapeRegex(name) + "$", $options: "i" },
  })) {
    throw new Error("A status with this name already exists.");
  }

  const updated = { ...current, name, updatedAt: new Date().toISOString() };
  await collection.replaceOne({ id }, updated);
  return updated;
}

export async function deleteProjectStatus(id: string) {
  const db = await getDatabase();
  const collection = db.collection<AdminProjectStatus>(COLLECTION);
  const current = await collection.findOne({ id });

  if (!current) throw new Error("Status was not found.");
  if (current.system) throw new Error("Default statuses cannot be deleted.");

  const used = await db.collection("admin_projects").countDocuments({
    $or: [{ projectStatusId: id }, { statusId: id }],
  });
  if (used) throw new Error("This status is used by projects and cannot be deleted.");

  await collection.deleteOne({ id });
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") throw new Error("Status name is required.");
  const name = value.trim();
  if (!name) throw new Error("Status name is required.");
  if (name.length > 60) throw new Error("Status name cannot exceed 60 characters.");
  return name;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^()|[\]\\]/g, "\\$&");
}
