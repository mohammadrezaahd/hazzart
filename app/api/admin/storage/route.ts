import { list } from "@vercel/blob";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONGODB_LIMIT_BYTES = 256 * 1024 * 1024;
const MONGODB_RESERVE_BYTES = 15 * 1024 * 1024;
const BLOB_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

async function getBlobUsage() {
  let totalBytes = 0;
  let cursor: string | undefined;

  do {
    const result = await list({ prefix: "paintings/", cursor });
    totalBytes += result.blobs.reduce((sum, blob) => sum + blob.size, 0);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return totalBytes;
}

export async function GET() {
  await requireAdminSession();

  try {
    const db = await getDatabase();
    const [stats, blobUsedBytes] = await Promise.all([
      db.stats(),
      getBlobUsage(),
    ]);

    const mongoUsedBytes = Number(stats.storageSize ?? stats.dataSize ?? 0) + Number(stats.indexSize ?? 0);
    const mongoAvailableBytes = Math.max(
      MONGODB_LIMIT_BYTES - MONGODB_RESERVE_BYTES - mongoUsedBytes,
      0,
    );
    const blobAvailableBytes = Math.max(BLOB_LIMIT_BYTES - blobUsedBytes, 0);

    return Response.json({
      mongodb: {
        usedBytes: mongoUsedBytes,
        limitBytes: MONGODB_LIMIT_BYTES,
        reserveBytes: MONGODB_RESERVE_BYTES,
        availableBytes: mongoAvailableBytes,
      },
      blob: {
        usedBytes: blobUsedBytes,
        limitBytes: BLOB_LIMIT_BYTES,
        reserveBytes: 0,
        availableBytes: blobAvailableBytes,
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load storage usage.";
    return Response.json({ error: message }, { status: 500 });
  }
}
