import { MongoClient, type Db } from "mongodb";
import { getDatabaseName } from "@/lib/app-config";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not configured.");
}

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise =
  globalForMongo.mongoClientPromise ??
  new MongoClient(uri).connect().then((client) => {
    console.info("[MongoDB] Connected successfully.");
    return client;
  }).catch((error) => {
    console.error("[MongoDB] Connection failed.", error);
    throw error;
  });

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = clientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(getDatabaseName());
}
