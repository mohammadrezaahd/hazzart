import { getCachedPublicPortfolio, PUBLIC_PORTFOLIO_REVALIDATE_SECONDS } from "@/lib/public-cache";

export const runtime = "nodejs";
export const revalidate = PUBLIC_PORTFOLIO_REVALIDATE_SECONDS;

export async function GET() {
  try {
    return Response.json(await getCachedPublicPortfolio(), {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return Response.json({ error: "Could not load portfolio data." }, { status: 500 });
  }
}
