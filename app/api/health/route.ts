import { NextResponse } from "next/server";
import { getDatabaseName } from "@/lib/app-config";
import { getDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });

    return NextResponse.json({
      status: "ok",
      database: "connected",
      databaseName: getDatabaseName(),
    });
  } catch (error) {
    console.error("[Health] MongoDB check failed.", error);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
      },
      { status: 503 },
    );
  }
}
