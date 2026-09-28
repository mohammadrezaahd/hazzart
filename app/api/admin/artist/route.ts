import { requireAdminSession } from "@/lib/admin-auth";
import {
  createArtistSocialPlatform,
  getArtistAdminPayload,
  updateArtistContent,
  validateArtistUrl,
} from "@/lib/artist";
import type { ArtistContent } from "@/interfaces/Artist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return Response.json({ error: message }, { status });
}

function parseContent(value: unknown): ArtistContent {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid artist content.");
  }

  const input = value as {
    cvText?: unknown;
    contactText?: unknown;
    socials?: unknown;
  };

  if (
    typeof input.cvText !== "string" ||
    typeof input.contactText !== "string" ||
    !Array.isArray(input.socials)
  ) {
    throw new Error("CV, contact text and socials are required.");
  }

  return {
    cvText: input.cvText,
    contactText: input.contactText,
    socials: input.socials.map((item) => {
      if (!item || typeof item !== "object") {
        throw new Error("Invalid social media item.");
      }

      const social = item as { platformId?: unknown; url?: unknown };

      if (typeof social.platformId !== "string" || typeof social.url !== "string") {
        throw new Error("Each social media item needs a platform and URL.");
      }

      return {
        platformId: social.platformId,
        url: validateArtistUrl(social.url),
        order: 0,
      };
    }),
  };
}

export async function GET() {
  await requireAdminSession();

  try {
    return Response.json(await getArtistAdminPayload());
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function PUT(request: Request) {
  await requireAdminSession();

  try {
    const body: unknown = await request.json();
    const content = parseContent(body);

    return Response.json({
      content: await updateArtistContent(content),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  await requireAdminSession();

  try {
    const formData = await request.formData();
    const name = formData.get("name");
    const defaultUrl = formData.get("defaultUrl");
    const icon = formData.get("icon");

    if (
      typeof name !== "string" ||
      typeof defaultUrl !== "string" ||
      !(icon instanceof File)
    ) {
      throw new Error("Name, URL and SVG icon are required.");
    }

    if (!icon.name.toLowerCase().endsWith(".svg")) {
      throw new Error("Only SVG files are accepted.");
    }

    const iconSvg = await icon.text();

    const platform = await createArtistSocialPlatform({
      name,
      defaultUrl,
      iconSvg,
    });

    return Response.json({ platform }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
