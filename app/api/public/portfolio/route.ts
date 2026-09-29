import { getPublicPortfolio } from "@/lib/public-portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getPublicPortfolio(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Could not load portfolio data." }, { status: 500 });
  }
}
