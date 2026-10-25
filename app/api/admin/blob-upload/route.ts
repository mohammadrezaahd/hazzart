import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned } from "@vercel/blob/client";
import { getAdminSession } from "@/lib/admin-auth";
import { ALLOWED_ADMIN_IMAGE_TYPES, MAX_ADMIN_IMAGE_SIZE } from "@/lib/admin-blob-reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_PATH = /^(paintings|projects)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-zA-Z0-9._-]+$/i;

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return Response.json({ error: "Administrator authentication is required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        // The pathname comes from the client, so constrain it before issuing a
        // short-lived, single-path token. The final API also verifies the blob.
        if (!IMAGE_PATH.test(pathname)) {
          throw new Error("Invalid image upload path.");
        }

        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          validUntil: Date.now() + 10 * 60 * 1000,
          allowedContentTypes: [...ALLOWED_ADMIN_IMAGE_TYPES],
          maximumSizeInBytes: MAX_ADMIN_IMAGE_SIZE,
        });

        return {
          token,
          urlOptions: {
            allowedContentTypes: [...ALLOWED_ADMIN_IMAGE_TYPES],
            maximumSizeInBytes: MAX_ADMIN_IMAGE_SIZE,
            addRandomSuffix: false,
            allowOverwrite: false,
          },
        };
      },
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not authorize direct image upload.";
    return Response.json({ error: message }, { status: 400 });
  }
}
