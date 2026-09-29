import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import AdminStorageOverview from "@/components/admin/AdminStorageOverview";

const navigation = [
  { label: "Overview", href: "/admin", icon: "grid", active: true },
  { label: "Categories", href: "/admin/categories", icon: "layers" },
  { label: "Paintings", href: "/admin/paintings", icon: "image" },
  { label: "Projects", href: "/admin/projects", icon: "folder" },
  { label: "Artist", href: "/admin/artist", icon: "user" },
  { label: "Statistics", href: null, icon: "chart" },
] as const;

function NavIcon({ type }: { type: (typeof navigation)[number]["icon"] }) {
  if (type === "grid") {
    return <span className="admin-nav-icon admin-nav-icon--grid" aria-hidden="true"><i /><i /><i /><i /></span>;
  }

  const paths: Record<Exclude<typeof type, "grid">, string> = {
    layers: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8L12 15l7.5-4M4.5 14 12 18l7.5-4M4.5 17 12 21l7.5-4",
    image: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM7.5 16l3-3 2 2 2.5-3 2.5 4H7.5ZM15.5 8.5h.01",
    folder: "M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-15v-13.5Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    chart: "M4 19V9m6 10V5m6 14v-7m4 7V3",
  };

  return (
    <span className="admin-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[type]} />
      </svg>
    </span>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div>
          <Link href="/" className="admin-sidebar-brand" aria-label="Back to Hazzart website">
            <span>HAZZART</span>
            <small>ARTIST PORTFOLIO</small>
          </Link>

          <div className="admin-sidebar-divider" />

          <p className="admin-sidebar-label">WORKSPACE</p>
          <nav className="admin-nav" aria-label="Admin navigation">
            {navigation.map((item) =>
              item.href ? (
                <Link key={item.label} href={item.href} className={`admin-nav-item ${item.label === "Overview" ? "is-active" : ""}`}>
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span key={item.label} className="admin-nav-item is-disabled" aria-disabled="true">
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                  <small>SOON</small>
                </span>
              ),
            )}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip">
            <span className="admin-user-avatar">{session.username.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{session.username}</strong>
              <small>Administrator</small>
            </span>
          </div>
          <form action="/api/admin/auth/logout" method="post">
            <button type="submit" className="admin-logout">
              Log out <span aria-hidden="true">↗</span>
            </button>
          </form>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <Link href="/" className="admin-mobile-brand" aria-label="Back to Hazzart website">
            HAZZART
          </Link>
          <span className="admin-topbar-context">ADMIN / OVERVIEW</span>
          <Link href="/" className="admin-view-site">
            View website <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <div className="admin-main">
          <div className="admin-welcome">
            <div>
              <p className="admin-eyebrow">DASHBOARD</p>
              <h1>Welcome, {session.username}.</h1>
              <p>Manage the portfolio from one place. More tools will appear here as each section is built.</p>
            </div>
            <Link href="/" className="admin-round-link" aria-label="Open website">
              ↗
            </Link>
          </div>

          <div className="admin-overview-grid">
            <article className="admin-overview-card admin-overview-card--wide">
              <div>
                <span className="admin-card-kicker">NEXT</span>
                <h2>Content management</h2>
                <p>Categories, paintings, projects and artist information will be connected here step by step.</p>
              </div>
              <span className="admin-card-number">01</span>
            </article>

            <article className="admin-overview-card">
              <span className="admin-card-kicker">STATUS</span>
              <strong>Authentication</strong>
              <p className="admin-status"><i /> Secure session active</p>
            </article>

            <article className="admin-overview-card">
              <span className="admin-card-kicker">SITE</span>
              <strong>Public portfolio</strong>
              <p>Ready to browse from the link in the sidebar.</p>
            </article>
          </div>

          <AdminStorageOverview />
        </div>
      </section>
    </main>
  );
}
