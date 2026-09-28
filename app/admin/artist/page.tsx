import { requireAdminSession } from "@/lib/admin-auth";
import ArtistEditor from "./ArtistEditor";

export default async function AdminArtistPage() {
  const session = await requireAdminSession();

  return <ArtistEditor username={session.username} />;
}
