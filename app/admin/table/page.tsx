"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminTableItem } from "@/interfaces/Table";
import { getAdminTableItems, unstarAdminTableItem, updateAdminTableItem } from "@/components/api/table";
import { getApiErrorMessage } from "@/components/api/client";

const navigation = [
  { label: "Overview", href: "/admin", icon: "grid" },
  { label: "Categories", href: "/admin/categories", icon: "layers" },
  { label: "Paintings", href: "/admin/paintings", icon: "image" },
  { label: "Projects", href: "/admin/projects", icon: "folder" },
  { label: "Table", href: "/admin/table", icon: "clover" },
  { label: "Artist", href: "/admin/artist", icon: "user" },
  { label: "Statistics", href: null, icon: "chart" },
] as const;

function NavIcon({ type }: { type: (typeof navigation)[number]["icon"] }) {
  if (type === "grid") return <span className="admin-nav-icon admin-nav-icon--grid" aria-hidden="true"><i /><i /><i /><i /></span>;
  if (type === "clover") return <span className="admin-nav-clover" aria-hidden="true">☘</span>;

  const paths: Record<Exclude<typeof type, "grid" | "clover">, string> = {
    layers: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8L12 15l7.5-4M4.5 14 12 18l7.5-4M4.5 17 12 21l7.5-4",
    image: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a2 2 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM7.5 16l3-3 2 2 2.5-3 2.5 4H7.5ZM15.5 8.5h.01",
    folder: "M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-15v-13.5Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    chart: "M4 19V9m6 10V5m6 14v-7m4 7V3",
  };

  return <span className="admin-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[type]} /></svg></span>;
}

export default function AdminTablePage() {
  const [items, setItems] = useState<AdminTableItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const next = await getAdminTableItems();
      setItems(next);
      setDrafts(Object.fromEntries(next.map((item) => [item.id, item.description])));
    } catch (error) {
      setToast({ type: "error", text: getApiErrorMessage(error, "Could not load table.") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(item: AdminTableItem) {
    setSaving(item.id);
    try {
      const updated = await updateAdminTableItem(item.id, drafts[item.id] ?? "");
      setItems((current) => current.map((value) => value.id === updated.id ? updated : value));
      setDrafts((current) => ({ ...current, [updated.id]: updated.description }));
      setToast({ type: "success", text: "Table description updated." });
    } catch (error) {
      setToast({ type: "error", text: getApiErrorMessage(error, "Could not update description.") });
    } finally {
      setSaving(null);
    }
  }

  async function unstar(item: AdminTableItem) {
    setSaving(item.id);
    try {
      await unstarAdminTableItem(item.id);
      setItems((current) => current.filter((value) => value.id !== item.id));
      setToast({ type: "success", text: "Image removed from Table." });
    } catch (error) {
      setToast({ type: "error", text: getApiErrorMessage(error, "Could not unstar image.") });
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div>
          <Link href="/" className="admin-sidebar-brand"><span>HAZZART</span><small>ARTIST PORTFOLIO</small></Link>
          <div className="admin-sidebar-divider" />
          <p className="admin-sidebar-label">WORKSPACE</p>
          <nav className="admin-nav">
            {navigation.map((item) => item.href ? (
              <Link key={item.label} href={item.href} className={"admin-nav-item " + (item.label === "Table" ? "is-active" : "")}>
                <NavIcon type={item.icon} /><span>{item.label}</span>
              </Link>
            ) : (
              <span key={item.label} className="admin-nav-item is-disabled"><NavIcon type={item.icon} /><span>{item.label}</span><small>SOON</small></span>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip"><span className="admin-user-avatar">A</span><span><strong>Administrator</strong><small>Administrator</small></span></div>
          <form action="/api/admin/auth/logout" method="post"><button className="admin-logout">Log out <span>↗</span></button></form>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar"><Link href="/" className="admin-mobile-brand">HAZZART</Link><span className="admin-topbar-context">ADMIN / TABLE</span><Link href="/" className="admin-view-site">View website <span>↗</span></Link></header>
        <div className="admin-main admin-table-main">
          <div className="admin-welcome">
            <div><p className="admin-eyebrow">TABLE</p><h1>Build the front table.</h1><p>Manage the images selected with the shamrock and their independent table descriptions.</p></div>
            <button className="admin-round-link" type="button" onClick={() => void load()}>↻</button>
          </div>

          <section className="admin-table-list">
            <div className="admin-painting-library-heading"><div><p className="admin-card-kicker">STARRED IMAGES</p><h2>Table</h2></div><span>{items.length} images</span></div>

            {loading ? <div className="admin-painting-skeleton"><span /><span /></div> : !items.length ? (
              <div className="admin-category-empty">No starred images yet. Star a painting image to add it here.</div>
            ) : (
              <div className="admin-table-grid">
                {items.map((item) => (
                  <article className="admin-table-card" key={item.id}>
                    <div className="admin-table-image"><img src={item.imageUrl} alt={item.title} /><span className="admin-table-star">☘</span></div>
                    <div className="admin-table-body">
                      <div className="admin-table-meta"><p className="admin-card-kicker">PAINTING</p><span>{item.completedDate}</span></div>
                      <h3>{item.title}</h3>
                      <p className="admin-table-source-description">{item.paintingDescription || "No painting description."}</p>
                      <label className="admin-field"><span>TABLE DESCRIPTION</span><textarea value={drafts[item.id] ?? ""} maxLength={5000} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} /></label>
                      <div className="admin-table-actions">
                        <button type="button" className="admin-submit" onClick={() => void save(item)} disabled={saving === item.id}>Save description <span>↗</span></button>
                        <button type="button" className="admin-table-unstar" onClick={() => void unstar(item)} disabled={saving === item.id}>Unstar ☘</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {toast && <div className={"admin-category-toast admin-category-toast--" + toast.type} role="status"><span>{toast.type === "success" ? "✓" : "!"}</span><p>{toast.text}</p><button type="button" onClick={() => setToast(null)}>×</button></div>}
        </div>
      </section>
    </main>
  );
}
