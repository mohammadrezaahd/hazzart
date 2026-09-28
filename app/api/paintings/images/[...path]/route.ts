import { get } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const pathname = path.join("/");

  if (!pathname.startsWith("paintings/") || pathname.length <= "paintings/".length) {
    return new Response("Not found.", { status: 404 });
  }

  try {
    const result = await get(pathname, { access: "private" });

    if (!result || result.statusCode !== 200) {
      return new Response("Not found.", { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found.", { status: 404 });
  }
}
