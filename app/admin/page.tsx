import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  return (
    <main className="admin-dashboard">
      <div className="admin-dashboard-card">
        <p className="admin-auth-kicker">HAZZART ADMIN</p>
        <h1>Welcome, {session.username}</h1>
        <p>Authentication is working. Dashboard features will be added in the next stage.</p>
      </div>
    </main>
  );
}
