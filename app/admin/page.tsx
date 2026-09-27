import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  return (
    <main className="relative z-50 min-h-screen bg-white px-6 py-24 text-black">
      <div className="mx-auto w-full max-w-4xl">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em]">HAZZART ADMIN</p>
        <h1 className="text-4xl font-light">Welcome, {session.username}</h1>
        <p className="mt-4 text-black/60">
          Authentication is working. Dashboard features will be added in the next stage.
        </p>
      </div>
    </main>
  );
}
