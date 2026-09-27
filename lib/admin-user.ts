import type { Collection } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

export interface AdminUserDocument {
  username: string;
  passwordHash: string;
  role: "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

let indexesPromise: Promise<string> | null = null;

async function getUsersCollection(): Promise<Collection<AdminUserDocument>> {
  const db = await getDatabase();
  return db.collection<AdminUserDocument>("users");
}

async function ensureUsersIndexes() {
  if (!indexesPromise) {
    indexesPromise = getUsersCollection().then((collection) =>
      collection.createIndex({ username: 1 }, { unique: true, name: "username_unique" }),
    );
  }

  await indexesPromise;
}

export async function findAdminByUsername(username: string) {
  await ensureUsersIndexes();

  const users = await getUsersCollection();

  return users.findOne(
    {
      username,
      role: "admin",
      isActive: true,
    },
    {
      projection: {
        _id: 1,
        username: 1,
        passwordHash: 1,
        role: 1,
        isActive: 1,
      },
    },
  );
}
